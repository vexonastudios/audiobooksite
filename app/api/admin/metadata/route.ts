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

    const [catRows, topicRows, authorRows] = await Promise.all([
      sql`SELECT DISTINCT unnest(categories) AS val FROM audiobooks WHERE categories IS NOT NULL ORDER BY val`,
      sql`SELECT DISTINCT unnest(topics) AS val FROM audiobooks WHERE topics IS NOT NULL ORDER BY val`,
      sql`SELECT DISTINCT author_name AS val FROM audiobooks WHERE author_name != '' ORDER BY val`,
    ]);

    return NextResponse.json({
      categories: catRows.map((r: { val: string }) => r.val).filter(Boolean),
      topics:     topicRows.map((r: { val: string }) => r.val).filter(Boolean),
      authors:    authorRows.map((r: { val: string }) => r.val).filter(Boolean),
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
