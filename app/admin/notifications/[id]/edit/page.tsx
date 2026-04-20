import { notFound } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import NotificationForm from '../../NotificationForm';

const sql = neon(process.env.DATABASE_URL!);

export default async function EditNotificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await sql`SELECT * FROM notifications WHERE id = ${id}`;
  if (!row) notFound();

  const initialData = {
    id: row.id,
    title: row.title,
    body_text: row.body_text,
    audio_url: row.audio_url ?? '',
    voice_id: row.voice_id,
    published: row.published,
    expires_at: row.expires_at ?? '',
  };

  return <NotificationForm initialData={initialData} />;
}
