import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import sharp from 'sharp';

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
 * POST /api/admin/upload-cover
 * Accepts multipart/form-data with a `file` field (image).
 * Produces:
 *   - Portrait cover: 800×1200 WebP → {slug}-cover.webp
 *   - Square thumbnail: 400×400 WebP → {slug}-thumb.webp
 * Returns: { coverImage, thumbnailUrl }
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const slug = (form.get('slug') as string | null) || `cover-${Date.now()}`;

    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Portrait cover 800×1200
    const portraitBuf = await sharp(buffer)
      .resize(800, 1200, { fit: 'cover', position: 'top' })
      .webp({ quality: 88 })
      .toBuffer();

    // Square thumbnail 400×400
    const thumbBuf = await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer();

    const coverKey = `covers/${slug}-cover.webp`;
    const thumbKey = `covers/${slug}-thumb.webp`;

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

    const publicBase = process.env.R2_PUBLIC_URL!;
    return NextResponse.json({
      coverImage:   `${publicBase}/${coverKey}`,
      thumbnailUrl: `${publicBase}/${thumbKey}`,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('upload-cover error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
