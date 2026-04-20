import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET /api/notifications — public; returns the single most recent active notification
export async function GET() {
  const rows = await sql`
    SELECT id, title, body_text, audio_url, created_at, expires_at
    FROM notifications
    WHERE published = true
      AND audio_url IS NOT NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (rows.length === 0) return NextResponse.json(null);
  return NextResponse.json(rows[0], {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    },
  });
}
