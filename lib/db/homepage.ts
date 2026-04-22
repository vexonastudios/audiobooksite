import { sql } from '@/lib/db';
import type { Article } from '@/lib/types';
import audiobooksJson from '@/public/data/audiobooks.json';
import articlesJson from '@/public/data/articles.json';
import { getAllAudiobooks } from '@/lib/db/audiobooks';

/**
 * Fetch the N most-recently-published audiobooks directly from the DB.
 * Falls back to the static JSON bundle if the DB is unavailable.
 */
export async function getRecentAudiobooks(limit = 20) {
  try {
    const audiobooks = await getAllAudiobooks();
    return [...audiobooks]
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, limit);
  } catch {
    return (audiobooksJson as any[])
      .sort((a, b) => new Date(b.pubDate ?? b.pub_date).getTime() - new Date(a.pubDate ?? a.pub_date).getTime())
      .slice(0, limit);
  }
}

/**
 * Fetch the N most-recently-published articles from the DB.
 * Falls back to static JSON.
 */
export async function getRecentArticles(limit = 20): Promise<Article[]> {
  try {
    const rows = await sql`
      SELECT id, slug, title, excerpt, pub_date AS "pubDate",
             author_name AS "authorName", cover_image AS "coverImage",
             categories, topics, published,
             audio_url AS "audioUrl", voice_id AS "voiceId",
             duration_secs AS "durationSecs", length_str AS "lengthStr",
             source_audiobook_slug AS "sourceAudiobookSlug"
      FROM articles
      WHERE published = true
      ORDER BY pub_date DESC
      LIMIT ${limit}
    `;
    return rows as Article[];
  } catch {
    return (articlesJson as Article[]).slice(0, limit);
  }
}

/**
 * Get total published audiobook count — lightweight single-column query.
 */
export async function getAudiobookCount(): Promise<number> {
  try {
    const [row] = await sql`SELECT COUNT(*) AS n FROM audiobooks WHERE published = true`;
    return Number((row as any).n);
  } catch {
    return (audiobooksJson as any[]).length;
  }
}
