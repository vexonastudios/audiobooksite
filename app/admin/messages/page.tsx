import { neon } from '@neondatabase/serverless';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminMessagesClient from './AdminMessagesClient';

const sql = neon(process.env.DATABASE_URL!);

async function getMessages() {
  try {
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
    const rows = await sql`
      SELECT id, name, email, subject, message, read, created_at
      FROM contact_messages
      ORDER BY read ASC, created_at DESC
    `;
    return rows;
  } catch {
    return [];
  }
}

export default async function AdminMessagesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const messages = await getMessages();
  const unreadCount = messages.filter((m: any) => !m.read).length;

  return <AdminMessagesClient messages={messages} unreadCount={unreadCount} />;
}
