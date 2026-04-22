import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { getAudiobookById, updateAudiobook } from '@/lib/db/audiobooks';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Force Node.js runtime — needed for ffmpeg and fs access
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min max for large files

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
 * Takes an existing audiobook's 128kbps MP3 and generates a 64kbps mono version.
 * Downloads from R2 → transcodes with ffmpeg → uploads back to R2 → updates DB.
 *
 * Returns: { mp3UrlLow, title }
 */
export async function POST(req: NextRequest) {
  let tmpDir: string | null = null;

  try {
    await requireAdmin();
    const { bookId } = await req.json();
    if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 });

    // 1. Fetch the audiobook from DB
    const book = await getAudiobookById(bookId);
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    if (!book.mp3Url) return NextResponse.json({ error: 'Book has no 128kbps MP3 URL' }, { status: 400 });

    // 2. Derive the R2 key from the public URL
    const publicUrlBase = process.env.R2_PUBLIC_URL!;
    if (!book.mp3Url.startsWith(publicUrlBase)) {
      return NextResponse.json({ error: `MP3 URL does not match R2_PUBLIC_URL. Expected prefix: ${publicUrlBase}` }, { status: 400 });
    }
    const existingKey = book.mp3Url.replace(publicUrlBase + '/', '');

    // 3. Create temp dir and download the 128kbps file
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-gen64-'));
    const inputPath = path.join(tmpDir, 'input.mp3');
    const out64Path = path.join(tmpDir, 'out-64.mp3');

    const getCmd = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: existingKey });
    const { Body } = await r2.send(getCmd);
    if (!Body) throw new Error('Empty R2 response when downloading source MP3');

    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(inputPath);
      (Body as Readable).pipe(ws).on('finish', resolve).on('error', reject);
    });

    // 4. Transcode to 64kbps mono
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate('64k')
        .audioChannels(1)
        .audioCodec('libmp3lame')
        .output(out64Path)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });

    // 5. Generate the 64k key based on the existing filename
    //    e.g. "in-quest-of-god-broomhall-128.mp3" → "in-quest-of-god-broomhall-64.mp3"
    const key64 = existingKey.replace(/-128\.mp3$/, '-64.mp3');
    if (key64 === existingKey) {
      // Fallback: if the filename doesn't end with -128.mp3, derive from slug
      const fallbackKey = `${book.slug}-64.mp3`;
      await uploadToR2(out64Path, fallbackKey, 'audio/mpeg');
      const mp3UrlLow = `${publicUrlBase}/${fallbackKey}`;
      await updateAudiobook(bookId, { mp3UrlLow });
      return NextResponse.json({ mp3UrlLow, title: book.title });
    }

    // 6. Upload to R2
    await uploadToR2(out64Path, key64, 'audio/mpeg');

    const mp3UrlLow = `${publicUrlBase}/${key64}`;

    // 7. Update the DB
    await updateAudiobook(bookId, { mp3UrlLow });

    return NextResponse.json({ mp3UrlLow, title: book.title });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('generate-64k error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function uploadToR2(filePath: string, key: string, contentType: string) {
  const body = fs.readFileSync(filePath);
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}
