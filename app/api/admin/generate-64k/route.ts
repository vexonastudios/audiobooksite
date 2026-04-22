import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { getAudiobookById, updateAudiobook } from '@/lib/db/audiobooks';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Force Node.js runtime — needed for ffmpeg and fs access
export const runtime = 'nodejs';
export const maxDuration = 300;

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * POST /api/admin/generate-64k
 * Body: { bookId: "123" }
 *
 * Downloads the book's existing 128kbps MP3 from its public URL,
 * transcodes to 64kbps mono, uploads to R2 as {slug}-64.mp3,
 * and saves the new URL in mp3_url_low.
 *
 * The original 128kbps file and its URL are left completely untouched.
 *
 * Returns: { mp3UrlLow, title, key64 }
 */
export async function POST(req: NextRequest) {
  let tmpDir: string | null = null;

  try {
    await requireAdmin();

    if (!ffmpegPath) {
      return NextResponse.json({ error: 'ffmpeg binary not found in this environment' }, { status: 500 });
    }

    const { bookId } = await req.json();
    if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 });

    // 1. Fetch book from DB
    const book = await getAudiobookById(bookId);
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    if (!book.mp3Url) return NextResponse.json({ error: 'Book has no MP3 URL' }, { status: 400 });

    const publicUrlBase = process.env.R2_PUBLIC_URL!;
    const bucket = process.env.R2_BUCKET_NAME!;

    // 2. The 64k output key — always slug-based since it's a brand new file
    const key64 = `${book.slug}-64.mp3`;

    // 3. Download the existing MP3 from its public URL (untouched, whatever format/name it has)
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-gen64-'));
    const inputPath = path.join(tmpDir, 'input.mp3');
    const out64Path = path.join(tmpDir, 'out-64.mp3');

    const response = await fetch(book.mp3Url);
    if (!response.ok) {
      throw new Error(`Failed to download source MP3 (HTTP ${response.status}): ${book.mp3Url}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

    // 4. Transcode to 64kbps mono
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate('64k')
        .audioChannels(1)
        .audioCodec('libmp3lame')
        .output(out64Path)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(new Error(`ffmpeg transcode failed: ${err.message}`)))
        .run();
    });

    // 5. Upload the 64k file to R2 — original 128k file is not touched
    const body = fs.readFileSync(out64Path);
    await r2.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key64,
      Body: body,
      ContentType: 'audio/mpeg',
    }));

    const mp3UrlLow = `${publicUrlBase}/${key64}`;

    // 6. Update only mp3_url_low in the DB — mp3_url stays unchanged
    await updateAudiobook(bookId, { mp3UrlLow });

    return NextResponse.json({ mp3UrlLow, key64, title: book.title });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('generate-64k error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
