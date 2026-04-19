export interface Chapter {
  title: string;
  startTime: number; // seconds
  duration: number | null;
}

export interface Audiobook {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  pubDate: string;
  authorName: string;
  coverImage: string;
  thumbnailUrl: string;
  categories: string[];
  topics: string[];
  mp3Url: string;
  totalDuration: string;
  length: string;
  originalYear: string;
  youtubeLink: string | null;
  spotifyLink: string | null;
  buyLink: string | null;
  generatedColors: string | null;
  plays: number;
  chapters: Chapter[];
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  pubDate: string;
  authorName: string;
  coverImage: string;
  categories: string[];
  topics: string[];
}

export interface Bookmark {
  id: string;
  bookId: string;
  time: number;
  note: string;
  createdAt: number;
  // Auto-captured fields
  chapterTitle?: string;
  transcriptContext?: string;
  bookTitle?: string;
  bookSlug?: string;
  bookCover?: string;
  bookAuthor?: string;
}

export interface HistoryEntry {
  bookId: string;
  position: number; // seconds
  lastListened: number; // timestamp
}
