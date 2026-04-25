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
  mp3UrlLow?: string | null;
  totalDuration: string;
  length: string;
  originalYear: string;
  youtubeLink: string | null;
  spotifyLink: string | null;
  buyLink: string | null;
  generatedColors: string | null;
  metaDescription?: string;
  focusKeyword?: string;
  plays: number;
  chapters: Chapter[];
  vttUrl?: string | null;
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
  audioUrl?: string;
  voiceId?: string;
  durationSecs?: number;
  lengthStr?: string;
  sourceAudiobookSlug?: string;
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

export interface Favorite {
  id: string;
  type: 'audiobook' | 'article';
  itemId: string;
  itemSlug: string;
  title: string;
  author: string;
  cover?: string;
  thumbnail?: string;
  createdAt: number;
}

export interface SavedQuote {
  id: string;
  text: string;
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  bookAuthor: string;
  bookCover?: string;
  chapterTitle?: string;
  time: number;
  createdAt: number;
}
