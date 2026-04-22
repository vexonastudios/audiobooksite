import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { getAudiobookById, updateAudiobook } from '@/lib/db/audiobooks';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

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
 * Downloads from the public MP3 URL → transcodes with ffmpeg → uploads to R2 → updates DB.
 *
 * Returns: { mp3UrlLow, title, key64 }
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
    if (!book.mp3Url) return NextResponse.json({ error: 'Book has no MP3 URL' }, { status: 400 });

    const publicUrlBase = process.env.R2_PUBLIC_URL!;

    // 2. Create temp dir
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-gen64-'));
    const inputPath = path.join(tmpDir, 'input.mp3');
    const out64Path = path.join(tmpDir, 'out-64.mp3');

    // 3. Download the source MP3 directly from its public URL (no R2 key guessing needed)
    await downloadUrl(book.mp3Url, inputPath);

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

    // 5. Derive the 64k output key from the source URL filename
    //    Strategy: strip domain, strip query params, derive base name, append -64
    //
    //    Examples:
    //      https://audio.scrollreader.com/book-name.mp3          → book-name-64.mp3
    //      https://audio.scrollreader.com/book-name-128.mp3      → book-name-64.mp3
    //      https://audio.scrollreader.com/audio/book-name-128.mp3 → audio/book-name-64.mp3
    const urlPath = new URL(book.mp3Url).pathname; // e.g. "/book-name-128.mp3"
    const withoutLeadingSlash = urlPath.replace(/^\//, '');  // "book-name-128.mp3"
    // Strip any existing quality suffix (-128, -64, -low, -high, etc.) before the extension
    const key64 = withoutLeadingSlash.replace(/(-128|-64|-low|-high|-standard)?\.mp3$/i, '-64.mp3');

    // 6. Upload the 64k file to R2
    await uploadToR2(out64Path, key64, 'audio/mpeg');

    const mp3UrlLow = `${publicUrlBase}/${key64}`;

    // 7. Update DB
    await updateAudiobook(bookId, { mp3UrlLow });

    return NextResponse.json({ mp3UrlLow, key64, title: book.title });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('generate-64k error:', err);
    // Return the full error string so the admin UI can surface it
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Download a URL to a local file path using Node's built-in http/https,
 * following up to 5 redirects.
 */
function downloadUrl(url: string, destPath: string, redirectsLeft = 5): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redirectsLeft <= 0) return reject(new Error(`Too many redirects downloading: ${url}`));
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      // Follow redirects (301, 302, 307, 308)
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); // consume + discard body
        return downloadUrl(res.headers.location, destPath, redirectsLeft - 1)
          .then(resolve).catch(reject);
      }
      if (res.statusCode && res.statusCode >= 400) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} downloading MP3 from: ${url}`));
      }
      const ws = fs.createWriteStream(destPath);
      res.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadToR2(filePath: string, key: string, contentType: string) {
  const body = fs.readFileSync(filePath);
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}
