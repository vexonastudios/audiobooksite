import { NextResponse } from 'next/server';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { sql } from '@/lib/db/index';

/**
 * GET /api/admin/metadata
 * Returns all distinct categories, topics, and authors from the DB.
 */
export async function GET() {
  try {
    await requireAdmin();

    const [catRows, topicRows, authorRows, audiobookRows] = await Promise.all([
      sql`SELECT DISTINCT unnest(categories) AS val FROM audiobooks WHERE categories IS NOT NULL ORDER BY val`,
      sql`SELECT DISTINCT unnest(topics) AS val FROM audiobooks WHERE topics IS NOT NULL ORDER BY val`,
      sql`SELECT DISTINCT author_name AS val FROM audiobooks WHERE author_name != '' ORDER BY val`,
      sql`SELECT slug, title FROM audiobooks ORDER BY title ASC`,
    ]);

    return NextResponse.json({
      categories: catRows.map((r: unknown) => (r as { val: string }).val).filter(Boolean),
      topics:     topicRows.map((r: unknown) => (r as { val: string }).val).filter(Boolean),
      authors:    authorRows.map((r: unknown) => (r as { val: string }).val).filter(Boolean),
      audiobooks: audiobookRows as { slug: string, title: string }[],
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
