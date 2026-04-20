import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Auto-create table if it doesn't exist
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id          SERIAL PRIMARY KEY,
      name        TEXT        NOT NULL,
      email       TEXT        NOT NULL,
      subject     TEXT        NOT NULL,
      message     TEXT        NOT NULL,
      read        BOOLEAN     NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// POST /api/contact — submit a contact message (public)
export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Truncate to sane limits
    if (name.length > 120 || email.length > 254 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: 'Input too long.' }, { status: 400 });
    }

    await ensureTable();

    await sql`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (${name.trim()}, ${email.trim()}, ${subject.trim()}, ${message.trim()})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] POST error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}

// GET /api/contact — admin only (called server-side)
export async function GET() {
  try {
    await ensureTable();
    const rows = await sql`
      SELECT id, name, email, subject, message, read, created_at
      FROM contact_messages
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[contact] GET error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

// PATCH /api/contact — mark a message as read/unread
export async function PATCH(req: NextRequest) {
  try {
    const { id, read } = await req.json();
    await ensureTable();
    await sql`UPDATE contact_messages SET read = ${read} WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] PATCH error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// DELETE /api/contact — delete a message
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await ensureTable();
    await sql`DELETE FROM contact_messages WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] DELETE error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
