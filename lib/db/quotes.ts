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

export async function getCommunityQuotes(
  page = 1,
  limit = 24,
  search?: string,
  bookId?: string,
): Promise<{ quotes: SavedQuote[]; total: number }> {
  const offset = (page - 1) * limit;

  // Build where conditions
  const searchLike = search ? `%${search.toLowerCase()}%` : null;

  const rows = await sql`
    SELECT id, text, book_id, book_title, book_slug, book_author,
           book_cover, chapter_title, time_secs, created_at
    FROM user_quotes
    WHERE (${searchLike}::text IS NULL
           OR lower(text) LIKE ${searchLike}
           OR lower(book_title) LIKE ${searchLike}
           OR lower(book_author) LIKE ${searchLike})
      AND (${bookId ?? null}::text IS NULL OR book_id = ${bookId ?? null})
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countRows = await sql`
    SELECT COUNT(*) AS total FROM user_quotes
    WHERE (${searchLike}::text IS NULL
           OR lower(text) LIKE ${searchLike}
           OR lower(book_title) LIKE ${searchLike}
           OR lower(book_author) LIKE ${searchLike})
      AND (${bookId ?? null}::text IS NULL OR book_id = ${bookId ?? null})
  `;

  const quotes: SavedQuote[] = rows.map((r: any) => ({
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
