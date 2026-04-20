import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/index';

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        id, slug, title, author_name, cover_image, thumbnail_url,
        buy_link, plays, excerpt, categories, original_year
      FROM audiobooks
      WHERE published = true
        AND buy_link IS NOT NULL
        AND buy_link != ''
      ORDER BY plays DESC
    `;
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}
