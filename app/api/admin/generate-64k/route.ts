import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CopyObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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
 * For an existing audiobook:
 *  1. Downloads the source MP3 via its public URL
 *  2. Transcodes → 64kbps mono  (and 128kbps stereo if the slug-based name differs)
 *  3. Uploads both to R2 under canonical slug-based names ({slug}-128.mp3 / {slug}-64.mp3)
 *  4. Copies the source file to the canonical 128k key in R2 (rename)
 *  5. Updates the DB with both new URLs
 *
 * Returns: { mp3Url, mp3UrlLow, title, key128, key64 }
 */
export async function POST(req: NextRequest) {
  let tmpDir: string | null = null;

  try {
    await requireAdmin();

    // Verify ffmpeg binary is available before doing any work
    if (!ffmpegPath) {
      return NextResponse.json({ error: 'ffmpeg binary not found in this environment' }, { status: 500 });
    }

    const { bookId } = await req.json();
    if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 });

    // 1. Fetch the audiobook from DB
    const book = await getAudiobookById(bookId);
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    if (!book.mp3Url) return NextResponse.json({ error: 'Book has no MP3 URL' }, { status: 400 });

    const publicUrlBase = process.env.R2_PUBLIC_URL!;
    const bucket = process.env.R2_BUCKET_NAME!;

    // 2. Canonical key names based on slug (e.g. "francois-coillard-128.mp3")
    const key128 = `${book.slug}-128.mp3`;
    const key64 = `${book.slug}-64.mp3`;

    // 3. Derive the current R2 key from the existing mp3Url
    //    e.g. https://audio.scrollreader.com/Audiobook%20-%20Foo.mp3 → "Audiobook - Foo.mp3"
    const existingUrlPath = new URL(book.mp3Url).pathname; // "/Audiobook%20-%20Foo.mp3"
    const existingKey = decodeURIComponent(existingUrlPath.replace(/^\//, '')); // "Audiobook - Foo.mp3"
    const existingKeyIsCanonical = existingKey === key128;

    // 4. Download the source MP3 via its public URL (using Next.js global fetch — no native https module)
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-gen64-'));
    const inputPath = path.join(tmpDir, 'input.mp3');
    const out64Path = path.join(tmpDir, 'out-64.mp3');

    const response = await fetch(book.mp3Url);
    if (!response.ok) {
      throw new Error(`Failed to download source MP3 (HTTP ${response.status}): ${book.mp3Url}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

    // 5. Transcode to 64kbps mono
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

    // 6. Upload the 64k file to R2
    await uploadToR2(out64Path, key64, bucket);

    // 7. If the existing file isn't already at the canonical 128k key, copy it there in R2
    //    (R2 has no rename — copy + delete)
    if (!existingKeyIsCanonical) {
      try {
        await r2.send(new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${existingKey}`,
          Key: key128,
        }));
        // Delete the old key after successful copy
        await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: existingKey }));
      } catch (copyErr) {
        // Log but don't fail the whole operation — the 64k file is already uploaded
        console.warn('generate-64k: R2 rename failed (copy/delete), continuing:', String(copyErr));
      }
    }

    const mp3Url = `${publicUrlBase}/${key128}`;
    const mp3UrlLow = `${publicUrlBase}/${key64}`;

    // 8. Update DB with both canonical URLs
    await updateAudiobook(bookId, { mp3Url, mp3UrlLow });

    return NextResponse.json({ mp3Url, mp3UrlLow, key128, key64, title: book.title });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('generate-64k error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function uploadToR2(filePath: string, key: string, bucket: string) {
  const body = fs.readFileSync(filePath);
  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'audio/mpeg',
  }));
}
