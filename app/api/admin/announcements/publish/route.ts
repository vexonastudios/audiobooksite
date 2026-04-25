import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;


const VOICE_ID = 'fnYMz3F5gMEDGMWcH1ex';

function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

// POST /api/admin/announcements/publish
// Body: { notificationId: string }
// Regenerates audio → uploads to R2 → marks published
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return adminForbidden();
  }

  const { notificationId } = await req.json();
  if (!notificationId) {
    return NextResponse.json({ error: 'notificationId required' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
  }

  // Fetch the notification row
  const [notif] = await sql`SELECT * FROM notifications WHERE id = ${notificationId}`;
  if (!notif) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });

  // Generate audio via ElevenLabs
  const elRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: notif.body_text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!elRes.ok) {
    const errText = await elRes.text();
    return NextResponse.json({ error: 'ElevenLabs TTS failed', detail: errText }, { status: 502 });
  }

  const audioBuffer = Buffer.from(await elRes.arrayBuffer());
  const key = `notifications/${notificationId}.mp3`;

  // Upload to R2
  await r2Client().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: audioBuffer,
    ContentType: 'audio/mpeg',
  }));

  const audioUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  // Update DB: set audio_url + published = true
  const [updated] = await sql`
    UPDATE notifications
    SET audio_url = ${audioUrl}, published = true
    WHERE id = ${notificationId}
    RETURNING *
  `;

  return NextResponse.json(updated);
}
