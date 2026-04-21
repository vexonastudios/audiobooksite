import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';


// PATCH /api/admin/notifications/[id] — update fields
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return adminForbidden();
  }

  const { id } = await params;
  const body = await req.json();

  const { title, body_text, audio_url, voice_id, published, expires_at } = body;

  const [row] = await sql`
    UPDATE notifications
    SET
      title      = COALESCE(${title ?? null}, title),
      body_text  = COALESCE(${body_text ?? null}, body_text),
      audio_url  = COALESCE(${audio_url ?? null}, audio_url),
      voice_id   = COALESCE(${voice_id ?? null}, voice_id),
      published  = COALESCE(${published ?? null}::boolean, published),
      expires_at = COALESCE(${expires_at ?? null}::timestamptz, expires_at)
    WHERE id = ${id}
    RETURNING *
  `;

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

// DELETE /api/admin/notifications/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return adminForbidden();
  }

  const { id } = await params;
  await sql`DELETE FROM notifications WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
