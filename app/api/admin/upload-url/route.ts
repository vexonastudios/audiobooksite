import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');
    const contentType = searchParams.get('type') || 'application/octet-stream';

    if (!filename) {
      return NextResponse.json({ error: 'filename required' }, { status: 400 });
    }

    // Check env vars explicitly so the error is clear
    const endpoint  = process.env.R2_ENDPOINT;
    const accessKey = process.env.R2_ACCESS_KEY_ID;
    const secretKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket    = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!endpoint || !accessKey || !secretKey || !bucket || !publicUrl) {
      const missing = ['R2_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME','R2_PUBLIC_URL']
        .filter(k => !process.env[k]);
      return NextResponse.json({ error: `Missing env vars: ${missing.join(', ')}` }, { status: 500 });
    }

    const r2 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    const command = new PutObjectCommand({ Bucket: bucket, Key: filename, ContentType: contentType });
    const url = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return NextResponse.json({ uploadUrl: url, publicUrl: `${publicUrl}/${filename}` });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    const msg = err instanceof Error ? err.message : String(err);
    console.error('upload-url error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
