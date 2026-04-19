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

const r2 = () => new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * POST /api/admin/upload-cover
 * Body: { key: "covers/temp-…", slug: "book-slug", variant: "portrait" | "square" }
 *
 * variant "portrait" → 800×1200 → covers/t-{slug}.webp  → returns { coverImage }
 * variant "square"   → 400×400  → covers/1024-{slug}.webp → returns { thumbnailUrl }
 */
export async function POST(req: NextRequest) {
  let tmpDir: string | null = null;

  try {
    await requireAdmin();
    const { key, slug, variant } = await req.json() as { key: string; slug: string; variant: 'portrait' | 'square' };
    if (!key || !slug) return NextResponse.json({ error: 'key and slug required' }, { status: 400 });

    const client = r2();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scrollreader-cover-'));
    const inputPath = path.join(tmpDir, 'input');

    // 1. Download original from R2
    const { Body } = await client.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }));
    if (!Body) throw new Error('Empty R2 response');

    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(inputPath);
      (Body as Readable).pipe(ws).on('finish', resolve).on('error', reject);
    });

    const inputBuf = fs.readFileSync(inputPath);
    const cleanSlug = slug.replace(/[^a-z0-9-]/g, '-').toLowerCase();
    const base = process.env.R2_PUBLIC_URL!;

    if (variant === 'square') {
      // Square thumbnail: 400×400
      const buf = await sharp(inputBuf)
        .resize(400, 400, { fit: 'cover', position: 'centre' })
        .webp({ quality: 85 })
        .toBuffer();
      const thumbKey = `covers/1024-${cleanSlug}.webp`;
      await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: thumbKey, Body: buf, ContentType: 'image/webp',
      }));
      return NextResponse.json({ thumbnailUrl: `${base}/${thumbKey}` });
    } else {
      // Portrait tall cover: 800×1200
      const buf = await sharp(inputBuf)
        .resize(800, 1200, { fit: 'cover', position: 'top' })
        .webp({ quality: 88 })
        .toBuffer();
      const coverKey = `covers/t-${cleanSlug}.webp`;
      await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: coverKey, Body: buf, ContentType: 'image/webp',
      }));
      return NextResponse.json({ coverImage: `${base}/${coverKey}` });
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('process-cover error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
