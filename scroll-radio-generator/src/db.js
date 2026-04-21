// src/db.js
// Connects to your Neon Postgres DB and fetches audiobook + chapter data.

import { neon } from '@neondatabase/serverless';

let _sql = null;

function getSQL() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set in .env');
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

/**
 * Returns all published audiobooks joined with their chapters.
 * Filters out books with no chapters, and chapters shorter than MIN_CHAPTER_SECS.
 */
export async function fetchLibrary() {
  const sql = getSQL();
  const minSecs = Number(process.env.MIN_CHAPTER_SECS ?? 300);

  console.log('📚 Fetching library from database...');

  const books = await sql`
    SELECT
      a.id,
      a.slug,
      a.title,
      a.author_name,
      a.mp3_url,
      a.total_duration,
      a.cover_image
    FROM audiobooks a
    WHERE a.published = true
      AND a.mp3_url IS NOT NULL
      AND a.mp3_url != ''
    ORDER BY a.title ASC
  `;

  if (books.length === 0) {
    throw new Error('No published audiobooks found in the database.');
  }

  // Fetch all chapters for these books
  const ids = books.map(b => b.id);
  const allChapters = await sql`
    SELECT
      c.audiobook_id,
      c.title,
      c.start_time,
      c.duration,
      c.sort_order
    FROM chapters c
    WHERE c.audiobook_id = ANY(${ids}::text[])
      AND c.duration >= ${minSecs}
    ORDER BY c.audiobook_id, c.sort_order ASC
  `;

  // Group chapters by book, then attach to each book
  const chaptersByBook = {};
  for (const ch of allChapters) {
    if (!chaptersByBook[ch.audiobook_id]) chaptersByBook[ch.audiobook_id] = [];
    chaptersByBook[ch.audiobook_id].push({
      title: ch.title,
      startTime: Number(ch.start_time),
      duration: Number(ch.duration),
      sortOrder: Number(ch.sort_order),
    });
  }

  const library = books
    .map(b => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      authorName: b.author_name,
      mp3Url: b.mp3_url,
      coverImage: b.cover_image,
      chapters: chaptersByBook[b.id] ?? [],
    }))
    .filter(b => b.chapters.length > 0); // only books that have eligible chapters

  console.log(`   Found ${library.length} books with ${allChapters.length} eligible chapters.`);
  return library;
}
