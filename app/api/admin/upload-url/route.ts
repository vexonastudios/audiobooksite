import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * GET /api/admin/upload-url?filename=my-book-128.mp3&type=audio/mpeg
 * Returns a presigned PUT URL so the browser can upload directly to R2.
 * This avoids the 4.5MB body limit on Vercel serverless functions.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');
    const contentType = searchParams.get('type') || 'application/octet-stream';

    if (!filename) {
      return NextResponse.json({ error: 'filename required' }, { status: 400 });
    }

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: filename,
      ContentType: contentType,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${filename}`;

    return NextResponse.json({ uploadUrl: url, publicUrl });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('upload-url error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
