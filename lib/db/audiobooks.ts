import { sql } from './index';
import type { Audiobook, Chapter } from '@/lib/types';

// ── Type returned from DB rows ────────────────────────────────────────────────
interface AudiobookRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  pub_date: string;
  author_name: string;
  cover_image: string;
  thumbnail_url: string;
  mp3_url: string;
  mp3_url_low: string;
  total_duration: string;
  length_str: string;
  duration_secs: number;
  original_year: number | null;
  youtube_link: string | null;
  spotify_link: string | null;
  buy_link: string | null;
  vtt_url: string | null;
  generated_colors: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  plays: number;
  published: boolean;
  categories: string[];
  topics: string[];
  created_at: string;
  updated_at: string;
  chapters?: ChapterRow[];
}

interface ChapterRow {
  id: number;
  audiobook_id: string;
  title: string;
  start_time: number;
  duration: number | null;
  sort_order: number;
}

function rowToAudiobook(row: AudiobookRow, chapters: ChapterRow[] = []): Audiobook & { mp3UrlLow?: string } {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    description: row.description,
    pubDate: row.pub_date ? String(row.pub_date) : '',
    authorName: row.author_name,
    coverImage: row.cover_image,
    thumbnailUrl: row.thumbnail_url,
    mp3Url: row.mp3_url,
    mp3UrlLow: row.mp3_url_low || '',
    totalDuration: row.total_duration,
    length: row.length_str,
    originalYear: String(row.original_year ?? ''),
    youtubeLink: row.youtube_link,
    spotifyLink: row.spotify_link,
    buyLink: row.buy_link,
    vttUrl: row.vtt_url,
    generatedColors: row.generated_colors,
    metaDescription: row.meta_description || '',
    focusKeyword: row.focus_keyword || '',
    plays: row.plays,
    categories: row.categories ?? [],
    topics: row.topics ?? [],
    chapters: chapters.map((c) => ({
      title: c.title,
      startTime: c.start_time,
      duration: c.duration,
    })),
  };
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getAllAudiobooks(): Promise<(Audiobook & { mp3UrlLow?: string })[]> {
  const books = await sql`
    SELECT * FROM audiobooks WHERE published = true ORDER BY created_at DESC
  ` as AudiobookRow[];

  if (books.length === 0) return [];

  const ids = books.map((b) => b.id);
  const chapters = await sql`
    SELECT * FROM chapters WHERE audiobook_id = ANY(${ids}::text[]) ORDER BY sort_order ASC
  ` as ChapterRow[];

  const chaptersByBook: Record<string, ChapterRow[]> = {};
  for (const ch of chapters) {
    if (!chaptersByBook[ch.audiobook_id]) chaptersByBook[ch.audiobook_id] = [];
    chaptersByBook[ch.audiobook_id].push(ch);
  }

  return books.map((b) => rowToAudiobook(b, chaptersByBook[b.id] ?? []));
}

export async function getAllAudiobooksAdmin(): Promise<(Audiobook & { mp3UrlLow?: string; published?: boolean })[]> {
  const books = await sql`
    SELECT * FROM audiobooks ORDER BY created_at DESC
  ` as AudiobookRow[];

  if (books.length === 0) return [];

  const ids = books.map((b) => b.id);
  const chapters = await sql`
    SELECT * FROM chapters WHERE audiobook_id = ANY(${ids}::text[]) ORDER BY sort_order ASC
  ` as ChapterRow[];

  const chaptersByBook: Record<string, ChapterRow[]> = {};
  for (const ch of chapters) {
    if (!chaptersByBook[ch.audiobook_id]) chaptersByBook[ch.audiobook_id] = [];
    chaptersByBook[ch.audiobook_id].push(ch);
  }

  return books.map((b) => ({
    ...rowToAudiobook(b, chaptersByBook[b.id] ?? []),
    published: b.published,
  }));
}

export async function getAudiobookById(id: string): Promise<(Audiobook & { mp3UrlLow?: string; published?: boolean }) | null> {
  const books = await sql`SELECT * FROM audiobooks WHERE id = ${id}` as AudiobookRow[];
  if (!books[0]) return null;
  const chapters = await sql`SELECT * FROM chapters WHERE audiobook_id = ${id} ORDER BY sort_order ASC` as ChapterRow[];
  return { ...rowToAudiobook(books[0], chapters), published: books[0].published };
}

export async function getAudiobookBySlug(slug: string): Promise<(Audiobook & { mp3UrlLow?: string }) | null> {
  const books = await sql`SELECT * FROM audiobooks WHERE slug = ${slug} AND published = true` as AudiobookRow[];
  if (!books[0]) return null;
  const chapters = await sql`SELECT * FROM chapters WHERE audiobook_id = ${books[0].id} ORDER BY sort_order ASC` as ChapterRow[];
  return rowToAudiobook(books[0], chapters);
}

export async function createAudiobook(data: AudiobookInput): Promise<string> {
  const id = data.id || generateId();
  await sql`
    INSERT INTO audiobooks (
      id, slug, title, excerpt, description, pub_date, author_name,
      cover_image, thumbnail_url, mp3_url, mp3_url_low, total_duration,
      length_str, duration_secs, original_year, youtube_link, spotify_link,
      buy_link, vtt_url, generated_colors, meta_description, focus_keyword,
      plays, published, categories, topics
    ) VALUES (
      ${id}, ${data.slug}, ${data.title}, ${data.excerpt ?? ''}, ${data.description ?? ''},
      ${data.pubDate ?? new Date().toISOString()}, ${data.authorName},
      ${data.coverImage ?? ''}, ${data.thumbnailUrl ?? ''}, ${data.mp3Url ?? ''},
      ${data.mp3UrlLow ?? ''}, ${data.totalDuration ?? ''}, ${data.lengthStr ?? ''},
      ${data.durationSecs ?? 0}, ${data.originalYear ?? null}, ${data.youtubeLink ?? null},
      ${data.spotifyLink ?? null}, ${data.buyLink ?? null}, ${data.vttUrl ?? null}, ${data.generatedColors ?? null},
      ${data.metaDescription ?? ''}, ${data.focusKeyword ?? ''},
      ${data.plays ?? 0}, ${data.published ?? true},
      ${data.categories ?? []}, ${data.topics ?? []}
    )
  `;

  if (data.chapters?.length) {
    for (let i = 0; i < data.chapters.length; i++) {
      const ch = data.chapters[i];
      await sql`
        INSERT INTO chapters (audiobook_id, title, start_time, duration, sort_order)
        VALUES (${id}, ${ch.title}, ${ch.startTime}, ${ch.duration ?? null}, ${i})
      `;
    }
  }

  return id;
}

export async function updateAudiobook(id: string, data: Partial<AudiobookInput>): Promise<void> {
  await sql`
    UPDATE audiobooks SET
      slug            = COALESCE(${data.slug ?? null}, slug),
      title           = COALESCE(${data.title ?? null}, title),
      excerpt         = COALESCE(${data.excerpt ?? null}, excerpt),
      description     = COALESCE(${data.description ?? null}, description),
      pub_date        = COALESCE(${data.pubDate ?? null}, pub_date),
      author_name     = COALESCE(${data.authorName ?? null}, author_name),
      cover_image     = COALESCE(${data.coverImage ?? null}, cover_image),
      thumbnail_url   = COALESCE(${data.thumbnailUrl ?? null}, thumbnail_url),
      mp3_url         = COALESCE(${data.mp3Url ?? null}, mp3_url),
      mp3_url_low     = COALESCE(${data.mp3UrlLow ?? null}, mp3_url_low),
      total_duration  = COALESCE(${data.totalDuration ?? null}, total_duration),
      length_str      = COALESCE(${data.lengthStr ?? null}, length_str),
      duration_secs   = COALESCE(${data.durationSecs ?? null}, duration_secs),
      original_year   = COALESCE(${data.originalYear ?? null}, original_year),
      youtube_link    = COALESCE(${data.youtubeLink ?? null}, youtube_link),
      spotify_link    = COALESCE(${data.spotifyLink ?? null}, spotify_link),
      buy_link        = COALESCE(${data.buyLink ?? null}, buy_link),
      vtt_url         = COALESCE(${data.vttUrl ?? null}, vtt_url),
      generated_colors = COALESCE(${data.generatedColors ?? null}, generated_colors),
      meta_description = COALESCE(${data.metaDescription ?? null}, meta_description),
      focus_keyword    = COALESCE(${data.focusKeyword ?? null}, focus_keyword),
      plays           = COALESCE(${data.plays ?? null}, plays),
      published       = COALESCE(${data.published ?? null}, published),
      categories      = COALESCE(${data.categories ?? null}, categories),
      topics          = COALESCE(${data.topics ?? null}, topics)
    WHERE id = ${id}
  `;

  // Replace chapters if provided
  if (data.chapters !== undefined) {
    await sql`DELETE FROM chapters WHERE audiobook_id = ${id}`;
    for (let i = 0; i < data.chapters.length; i++) {
      const ch = data.chapters[i];
      await sql`
        INSERT INTO chapters (audiobook_id, title, start_time, duration, sort_order)
        VALUES (${id}, ${ch.title}, ${ch.startTime}, ${ch.duration ?? null}, ${i})
      `;
    }
  }
}

export async function deleteAudiobook(id: string): Promise<void> {
  await sql`DELETE FROM audiobooks WHERE id = ${id}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(): string {
  return String(Date.now()) + String(Math.floor(Math.random() * 1000));
}

export interface AudiobookInput {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  pubDate?: string;
  authorName: string;
  coverImage?: string;
  thumbnailUrl?: string;
  mp3Url?: string;
  mp3UrlLow?: string;
  totalDuration?: string;
  lengthStr?: string;
  durationSecs?: number;
  originalYear?: number | null;
  youtubeLink?: string | null;
  spotifyLink?: string | null;
  buyLink?: string | null;
  vttUrl?: string | null;
  generatedColors?: string | null;
  metaDescription?: string;
  focusKeyword?: string;
  plays?: number;
  published?: boolean;
  categories?: string[];
  topics?: string[];
  chapters?: Chapter[];
}
