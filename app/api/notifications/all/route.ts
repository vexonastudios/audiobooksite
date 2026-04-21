import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';


// GET /api/notifications/all — public archive list (all published, no expiry filter)
export async function GET() {
  const rows = await sql`
    SELECT id, title, body_text, audio_url, created_at, expires_at
    FROM notifications
    WHERE published = true AND audio_url IS NOT NULL
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}
