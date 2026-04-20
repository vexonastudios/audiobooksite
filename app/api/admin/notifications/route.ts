import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';

const sql = neon(process.env.DATABASE_URL!);

// GET /api/admin/notifications — list all (admin)
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return adminForbidden();
  }

  const rows = await sql`
    SELECT * FROM notifications ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

// POST /api/admin/notifications — create draft
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return adminForbidden();
  }

  const { title, body_text, voice_id, expires_at } = await req.json();

  if (!title?.trim() || !body_text?.trim()) {
    return NextResponse.json({ error: 'title and body_text are required' }, { status: 400 });
  }

  const id = `notif_${Date.now()}`;
  const [row] = await sql`
    INSERT INTO notifications (id, title, body_text, voice_id, expires_at, published)
    VALUES (
      ${id},
      ${title.trim()},
      ${body_text.trim()},
      ${voice_id || 'fnYMz3F5gMEDGMWcH1ex'},
      ${expires_at || null},
      false
    )
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
