import { sql } from './index';
import type { HistoryEntry, Bookmark } from '@/lib/types';

// ─── History ──────────────────────────────────────────────────────────────────

export async function getUserHistory(userId: string): Promise<HistoryEntry[]> {
  const rows = await sql`
    SELECT book_id, position_secs, last_listened
    FROM user_history
    WHERE user_id = ${userId}
    ORDER BY last_listened DESC
    LIMIT 50
  `;
  return rows.map((r: any) => ({
    bookId: r.book_id,
    position: Number(r.position_secs),
    lastListened: new Date(r.last_listened).getTime(),
  }));
}

export async function upsertHistoryEntry(userId: string, entry: HistoryEntry): Promise<void> {
  await sql`
    INSERT INTO user_history (user_id, book_id, position_secs, last_listened)
    VALUES (
      ${userId},
      ${entry.bookId},
      ${entry.position},
      to_timestamp(${entry.lastListened / 1000})
    )
    ON CONFLICT (user_id, book_id) DO UPDATE
      SET position_secs = EXCLUDED.position_secs,
          last_listened = EXCLUDED.last_listened
  `;
}

export async function clearUserHistory(userId: string): Promise<void> {
  await sql`DELETE FROM user_history WHERE user_id = ${userId}`;
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const rows = await sql`
    SELECT id, book_id, time_secs, note, chapter_title, transcript_context,
           book_title, book_slug, book_cover, book_author, created_at
    FROM user_bookmarks
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return rows.map((r: any) => ({
    id: r.id,
    bookId: r.book_id,
    time: Number(r.time_secs),
    note: r.note || '',
    createdAt: new Date(r.created_at).getTime(),
    chapterTitle: r.chapter_title || undefined,
    transcriptContext: r.transcript_context || undefined,
    bookTitle: r.book_title || undefined,
    bookSlug: r.book_slug || undefined,
    bookCover: r.book_cover || undefined,
    bookAuthor: r.book_author || undefined,
  }));
}

export async function upsertBookmark(userId: string, b: Bookmark): Promise<void> {
  await sql`
    INSERT INTO user_bookmarks
      (id, user_id, book_id, time_secs, note, chapter_title, transcript_context,
       book_title, book_slug, book_cover, book_author, created_at)
    VALUES (
      ${b.id}, ${userId}, ${b.bookId}, ${b.time},
      ${b.note ?? ''}, ${b.chapterTitle ?? ''}, ${b.transcriptContext ?? ''},
      ${b.bookTitle ?? ''}, ${b.bookSlug ?? ''}, ${b.bookCover ?? ''}, ${b.bookAuthor ?? ''},
      to_timestamp(${b.createdAt / 1000})
    )
    ON CONFLICT (user_id, id) DO UPDATE
      SET note = EXCLUDED.note,
          chapter_title = EXCLUDED.chapter_title
  `;
}

export async function deleteBookmark(userId: string, id: string): Promise<void> {
  await sql`DELETE FROM user_bookmarks WHERE user_id = ${userId} AND id = ${id}`;
}
