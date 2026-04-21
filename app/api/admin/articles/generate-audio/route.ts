import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const maxDuration = 120;


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

/** Strip all HTML tags so ElevenLabs only gets plain text */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')   // remove tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Approx seconds → "Xm Ys" */
function secsToStr(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// POST /api/admin/articles/generate-audio
// Body: { articleId: string, voiceId?: string }
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return adminForbidden();
  }

  const { articleId, voiceId } = await req.json();
  if (!articleId) {
    return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
  }

  // Fetch article
  const [article] = await sql`SELECT id, slug, title, content, cover_image FROM articles WHERE id = ${articleId}`;
  if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

  const plainText = stripHtml(String(article.content || ''));
  if (!plainText || plainText.length < 10) {
    return NextResponse.json({ error: 'Article content is empty or too short to generate audio.' }, { status: 400 });
  }

  const voice = voiceId || 'fnYMz3F5gMEDGMWcH1ex';

  // Generate via ElevenLabs
  const elRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: plainText,
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
  const key = `articles/${article.slug}.mp3`;

  // Upload to R2
  await r2Client().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: audioBuffer,
    ContentType: 'audio/mpeg',
  }));

  const audioUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  // Estimate duration (128kbps MP3: bytes/16000 ≈ secs)
  const durationSecs = Math.round(audioBuffer.byteLength / 16000);
  const lengthStr = secsToStr(durationSecs);

  // Update DB
  const [updated] = await sql`
    UPDATE articles
    SET audio_url     = ${audioUrl},
        voice_id      = ${voice},
        duration_secs = ${durationSecs},
        length_str    = ${lengthStr},
        updated_at    = now()
    WHERE id = ${articleId}
    RETURNING *
  `;

  return NextResponse.json({ audio_url: audioUrl, duration_secs: durationSecs, length_str: lengthStr, row: updated });
}
