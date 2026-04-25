import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

const VOICE_ID = 'fnYMz3F5gMEDGMWcH1ex';

// POST /api/admin/announcements/generate
// Body: { text: string }
// Returns raw MP3 bytes for admin preview — no R2 upload
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return adminForbidden();
  }

  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
  }

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
        text: text.trim(),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!elRes.ok) {
    const errText = await elRes.text();
    console.error('ElevenLabs error:', errText);
    return NextResponse.json({ error: 'ElevenLabs TTS failed', detail: errText }, { status: 502 });
  }

  const audioBuffer = await elRes.arrayBuffer();

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.byteLength),
      'Cache-Control': 'no-store',
    },
  });
}
