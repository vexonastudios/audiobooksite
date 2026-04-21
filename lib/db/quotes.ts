import { sql } from './index';
import type { SavedQuote, Favorite } from '@/lib/types';

// ─── Quotes ───────────────────────────────────────────────────────────────────

export async function getUserQuotes(userId: string): Promise<SavedQuote[]> {
  const rows = await sql`
    SELECT id, text, book_id, book_title, book_slug, book_author,
           book_cover, chapter_title, time_secs, created_at
    FROM user_quotes
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 500
  `;
  return rows.map((r: any) => ({
    id: r.id,
    text: r.text,
    bookId: r.book_id,
    bookTitle: r.book_title,
    bookSlug: r.book_slug,
    bookAuthor: r.book_author,
    bookCover: r.book_cover || undefined,
    chapterTitle: r.chapter_title || undefined,
    time: Number(r.time_secs),
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function upsertUserQuote(userId: string, q: SavedQuote): Promise<void> {
  await sql`
    INSERT INTO user_quotes
      (id, user_id, text, book_id, book_title, book_slug, book_author,
       book_cover, chapter_title, time_secs, created_at)
    VALUES
      (${q.id}, ${userId}, ${q.text}, ${q.bookId}, ${q.bookTitle}, ${q.bookSlug},
       ${q.bookAuthor}, ${q.bookCover ?? ''}, ${q.chapterTitle ?? ''},
       ${q.time}, to_timestamp(${q.createdAt / 1000}))
    ON CONFLICT (user_id, id) DO NOTHING
  `;
}

export async function deleteUserQuote(userId: string, id: string): Promise<void> {
  await sql`DELETE FROM user_quotes WHERE user_id = ${userId} AND id = ${id}`;
}

// ─── Community Feed ───────────────────────────────────────────────────────────

export type CommunityQuote = SavedQuote & { savesCount: number };

export async function getCommunityQuotes(
  page = 1,
  limit = 24,
  search?: string,
  bookId?: string,
  sortBy: 'recent' | 'popular' = 'recent',
): Promise<{ quotes: CommunityQuote[]; total: number }> {
  const offset = (page - 1) * limit;
  const searchLike = search ? `%${search.toLowerCase()}%` : null;

  // We run two separate typed queries to avoid nested sql`` template literals
  // which @neondatabase/serverless does not support.
  const rows = sortBy === 'popular'
    ? await sql`
        SELECT
          MIN(id)            AS id,
          text,
          book_id,
          MAX(book_title)    AS book_title,
          MAX(book_slug)     AS book_slug,
          MAX(book_author)   AS book_author,
          MAX(book_cover)    AS book_cover,
          MAX(chapter_title) AS chapter_title,
          MIN(time_secs)     AS time_secs,
          MAX(created_at)    AS created_at,
          COUNT(*)           AS saves_count
        FROM user_quotes
        WHERE (${searchLike}::text IS NULL
               OR lower(text) LIKE ${searchLike}
               OR lower(book_title) LIKE ${searchLike}
               OR lower(book_author) LIKE ${searchLike})
          AND (${bookId ?? null}::text IS NULL OR book_id = ${bookId ?? null})
        GROUP BY text, book_id
        ORDER BY COUNT(*) DESC, MAX(created_at) DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT
          MIN(id)            AS id,
          text,
          book_id,
          MAX(book_title)    AS book_title,
          MAX(book_slug)     AS book_slug,
          MAX(book_author)   AS book_author,
          MAX(book_cover)    AS book_cover,
          MAX(chapter_title) AS chapter_title,
          MIN(time_secs)     AS time_secs,
          MAX(created_at)    AS created_at,
          COUNT(*)           AS saves_count
        FROM user_quotes
        WHERE (${searchLike}::text IS NULL
               OR lower(text) LIKE ${searchLike}
               OR lower(book_title) LIKE ${searchLike}
               OR lower(book_author) LIKE ${searchLike})
          AND (${bookId ?? null}::text IS NULL OR book_id = ${bookId ?? null})
        GROUP BY text, book_id
        ORDER BY MAX(created_at) DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

  // Count of distinct (text, book_id) groups for pagination
  const countRows = await sql`
    SELECT COUNT(*) AS total FROM (
      SELECT 1
      FROM user_quotes
      WHERE (${searchLike}::text IS NULL
             OR lower(text) LIKE ${searchLike}
             OR lower(book_title) LIKE ${searchLike}
             OR lower(book_author) LIKE ${searchLike})
        AND (${bookId ?? null}::text IS NULL OR book_id = ${bookId ?? null})
      GROUP BY trim(text), book_id
    ) AS deduped
  `;

  const quotes: CommunityQuote[] = rows.map((r: any) => ({
    id: r.id,
    text: r.text,
    bookId: r.book_id,
    bookTitle: r.book_title,
    bookSlug: r.book_slug,
    bookAuthor: r.book_author,
    bookCover: r.book_cover || undefined,
    chapterTitle: r.chapter_title || undefined,
    time: Number(r.time_secs),
    createdAt: new Date(r.created_at).getTime(),
    savesCount: Number(r.saves_count),
  }));

  return { quotes, total: Number((countRows[0] as any).total) };
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function getUserFavorites(userId: string): Promise<Favorite[]> {
  const rows = await sql`
    SELECT id, type, item_id, item_slug, title, author, cover, thumbnail, created_at
    FROM user_favorites
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return rows.map((r: any) => ({
    id: r.id,
    type: r.type as 'audiobook' | 'article',
    itemId: r.item_id,
    itemSlug: r.item_slug,
    title: r.title,
    author: r.author,
    cover: r.cover || undefined,
    thumbnail: r.thumbnail || undefined,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function upsertUserFavorite(userId: string, f: Favorite): Promise<void> {
  await sql`
    INSERT INTO user_favorites
      (id, user_id, type, item_id, item_slug, title, author, cover, thumbnail, created_at)
    VALUES
      (${f.id}, ${userId}, ${f.type}, ${f.itemId}, ${f.itemSlug}, ${f.title},
       ${f.author}, ${f.cover ?? ''}, ${f.thumbnail ?? ''}, to_timestamp(${f.createdAt / 1000}))
    ON CONFLICT (user_id, id) DO NOTHING
  `;
}

export async function deleteUserFavorite(userId: string, id: string): Promise<void> {
  await sql`DELETE FROM user_favorites WHERE user_id = ${userId} AND id = ${id}`;
}
