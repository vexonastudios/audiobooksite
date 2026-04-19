import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Force Node.js runtime (not Edge) — needed for ffmpeg and fs access
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
 * POST /api/admin/process-audio
 * Body: { key: "filename.mp3" }
 * 
 * Downloads the uploaded MP3 from R2, transcodes to:
 *  - 128kbps stereo (standard) → replaces the uploaded file
 *  - 64kbps mono (low quality)  → saves as filename-low.mp3
 * 
 * Returns: { mp3Url, mp3UrlLow, totalDuration, lengthStr, durationSecs }
 */
export async function POST(req: NextRequest) {
  let tmpDir: string | null = null;
  
  try {
    await requireAdmin();
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scrollreader-'));
    const inputPath  = path.join(tmpDir, 'input.mp3');
    const out128Path = path.join(tmpDir, 'out-128.mp3');
    const out64Path  = path.join(tmpDir, 'out-64.mp3');

    // 1. Download from R2
    const getCmd = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key });
    const { Body } = await r2.send(getCmd);
    if (!Body) throw new Error('Empty R2 response');

    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(inputPath);
      (Body as Readable).pipe(ws).on('finish', resolve).on('error', reject);
    });

    // 2. Get duration
    const durationSecs = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, meta) => {
        if (err) reject(err);
        else resolve(Math.round(meta.format.duration ?? 0));
      });
    });

    const totalDuration = secsToHHMMSS(durationSecs);
    const lengthStr = secsToHumanLength(durationSecs);

    // 3. Transcode to 128kbps stereo
    await transcode(inputPath, out128Path, '128k', 2);

    // 4. Transcode to 64kbps mono
    await transcode(inputPath, out64Path, '64k', 1);

    // 5. Generate filenames
    const baseName = key.replace(/\.[^.]+$/, '').replace(/-\d+$/, '').replace(/-?(128|64)$/, '');
    const key128 = `${baseName}-128.mp3`;
    const key64  = `${baseName}-64.mp3`;

    // 6. Upload both to R2
    await uploadToR2(out128Path, key128, 'audio/mpeg');
    await uploadToR2(out64Path,  key64,  'audio/mpeg');

    const mp3Url    = `${process.env.R2_PUBLIC_URL}/${key128}`;
    const mp3UrlLow = `${process.env.R2_PUBLIC_URL}/${key64}`;

    return NextResponse.json({ mp3Url, mp3UrlLow, totalDuration, lengthStr, durationSecs });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('process-audio error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function transcode(input: string, output: string, bitrate: string, channels: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .audioBitrate(bitrate)
      .audioChannels(channels)
      .audioCodec('libmp3lame')
      .output(output)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
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

function secsToHHMMSS(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function secsToHumanLength(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
