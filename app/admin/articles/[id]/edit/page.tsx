import { notFound } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import ArticleForm from '../../ArticleForm';

const sql = neon(process.env.DATABASE_URL!);

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [row] = await sql`SELECT * FROM articles WHERE id = ${resolvedParams.id}`;
  if (!row) notFound();

  const initialData = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    content: row.content ?? '',
    pub_date: typeof row.pub_date === 'string' ? row.pub_date : row.pub_date?.toISOString?.() ?? '',
    author_name: row.author_name,
    cover_image: row.cover_image ?? '',
    categories: row.categories ?? [],
    topics: row.topics ?? [],
    published: row.published,
    audio_url: row.audio_url ?? '',
    voice_id: row.voice_id ?? '',
    duration_secs: row.duration_secs ?? 0,
    length_str: row.length_str ?? '',
    source_audiobook_slug: row.source_audiobook_slug ?? '',
  };

  return <ArticleForm initialData={initialData} />;
}
