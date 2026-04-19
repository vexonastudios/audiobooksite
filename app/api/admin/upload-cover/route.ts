import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import sharp from 'sharp';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * POST /api/admin/process-cover
 * Body: { key: "covers/temp-filename.jpg", slug: "book-slug" }
 *
 * The browser first uploads the original image directly to R2 via presigned URL.
 * Then calls this endpoint which:
 *  1. Downloads the original from R2
 *  2. Resizes to portrait 800×1200 WebP → covers/{slug}-cover.webp
 *  3. Resizes to square 400×400 WebP   → covers/{slug}-thumb.webp
 *  4. Deletes the temp original
 *  5. Returns { coverImage, thumbnailUrl }
 */
export async function POST(req: NextRequest) {
  let tmpDir: string | null = null;

  try {
    await requireAdmin();
    const { key, slug } = await req.json();
    if (!key || !slug) return NextResponse.json({ error: 'key and slug required' }, { status: 400 });

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scrollreader-cover-'));
    const inputPath = path.join(tmpDir, 'input');

    // 1. Download original from R2
    const { Body } = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }));
    if (!Body) throw new Error('Empty R2 response');

    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(inputPath);
      (Body as Readable).pipe(ws).on('finish', resolve).on('error', reject);
    });

    const inputBuf = fs.readFileSync(inputPath);

    // 2. Portrait cover 800×1200
    const portraitBuf = await sharp(inputBuf)
      .resize(800, 1200, { fit: 'cover', position: 'top' })
      .webp({ quality: 88 })
      .toBuffer();

    // 3. Square thumbnail 400×400
    const thumbBuf = await sharp(inputBuf)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer();

    const cleanSlug = slug.replace(/[^a-z0-9-]/g, '-').toLowerCase();
    const coverKey = `covers/t-${cleanSlug}.webp`;    // tall portrait — t- prefix
    const thumbKey = `covers/1024-${cleanSlug}.webp`; // square 1024 format

    // 4. Upload both to R2
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: coverKey,
      Body: portraitBuf,
      ContentType: 'image/webp',
    }));

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: thumbKey,
      Body: thumbBuf,
      ContentType: 'image/webp',
    }));

    const base = process.env.R2_PUBLIC_URL!;
    return NextResponse.json({
      coverImage: `${base}/${coverKey}`,
      thumbnailUrl: `${base}/${thumbKey}`,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('process-cover error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
