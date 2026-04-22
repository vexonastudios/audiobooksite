/**
 * lib/recommendations.ts
 *
 * Pure client-side recommendation engine.
 * No backend calls, no ML — runs in microseconds against the existing
 * in-memory library (150 books × O(n) scoring).
 *
 * Two exports:
 *   getRecommendations()  — general-purpose, used by both surfaces
 *   buildUserProfile()    — exported so callers can inspect the profile if needed
 */

import type { Audiobook } from '@/lib/types';
import type { HistoryEntry, Favorite, Bookmark, SavedQuote } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserSignals {
  history:   HistoryEntry[];
  favorites: Favorite[];
  bookmarks: Bookmark[];
  quotes:    SavedQuote[];
}

/** Accumulated interest score per tag/author */
export interface UserProfile {
  categories: Record<string, number>;
  topics:     Record<string, number>;
  authors:    Record<string, number>;
  listenedIds: Set<string>;
}

export type RecommendationStrategy =
  | 'personal'   // Weighted user-profile scoring (home page "Picked For You")
  | 'similar';   // Content similarity to a seed book (book detail "More Like This")

export interface RecommendationOptions {
  /** Book IDs to exclude from results (e.g. the current book being viewed) */
  excludeIds?: string[];
  /** Maximum number of results to return (default: 12) */
  limit?: number;
  /** 'personal' uses user history; 'similar' uses seedBook content tags */
  strategy?: RecommendationStrategy;
  /** Required when strategy === 'similar' */
  seedBook?: Audiobook;
}

// ── Signal weights ─────────────────────────────────────────────────────────────
// Higher = stronger signal that a user likes the tags of this book.

const WEIGHT = {
  QUOTE:          5,  // saved a quote from the book
  FAVORITE:       4,  // explicitly favourited
  BOOKMARK:       3,  // bookmarked a moment
  FINISHED:       3,  // listened > 80 %
  ENGAGED:        2,  // listened 20–80 %
  BROWSED:        1,  // listened < 20 %
  AUTHOR_BONUS:   3,  // extra points on top of tag score if same author
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getListenFraction(entry: HistoryEntry, book: Audiobook): number {
  // Try the cached duration on the history entry first; fall back to chapters sum
  const totalSecs = book.chapters.reduce((s, c) => s + (c.duration ?? 0), 0);
  if (totalSecs <= 0) return 0;
  return Math.min(1, entry.position / totalSecs);
}

function addWeightedTags(
  profile: UserProfile,
  book: Audiobook,
  weight: number,
): void {
  for (const cat of book.categories) {
    profile.categories[cat] = (profile.categories[cat] ?? 0) + weight;
  }
  for (const topic of book.topics) {
    profile.topics[topic] = (profile.topics[topic] ?? 0) + weight;
  }
  profile.authors[book.authorName] =
    (profile.authors[book.authorName] ?? 0) + weight;
}

// ── Phase 1: Build user interest profile ──────────────────────────────────────

export function buildUserProfile(
  allBooks: Audiobook[],
  signals: UserSignals,
): UserProfile {
  const profile: UserProfile = {
    categories:  {},
    topics:      {},
    authors:     {},
    listenedIds: new Set(signals.history.map(h => h.bookId)),
  };

  const bookMap = new Map(allBooks.map(b => [b.id, b]));

  // Quotes — strongest positive signal
  for (const q of signals.quotes) {
    const book = bookMap.get(q.bookId);
    if (book) addWeightedTags(profile, book, WEIGHT.QUOTE);
  }

  // Favorites
  for (const fav of signals.favorites) {
    if (fav.type !== 'audiobook') continue;
    const book = bookMap.get(fav.itemId);
    if (book) addWeightedTags(profile, book, WEIGHT.FAVORITE);
  }

  // Bookmarks
  for (const bm of signals.bookmarks) {
    const book = bookMap.get(bm.bookId);
    if (book) addWeightedTags(profile, book, WEIGHT.BOOKMARK);
  }

  // Listening history — weight by how much they listened
  for (const entry of signals.history) {
    const book = bookMap.get(entry.bookId);
    if (!book) continue;
    const fraction = getListenFraction(entry, book);
    const weight =
      fraction >= 0.8 ? WEIGHT.FINISHED :
      fraction >= 0.2 ? WEIGHT.ENGAGED  :
                        WEIGHT.BROWSED;
    addWeightedTags(profile, book, weight);
  }

  return profile;
}

// ── Phase 2: Score a single candidate book ────────────────────────────────────

function scoreBookPersonal(book: Audiobook, profile: UserProfile): number {
  let score = 0;
  for (const cat of book.categories) {
    score += profile.categories[cat] ?? 0;
  }
  for (const topic of book.topics) {
    score += profile.topics[topic] ?? 0;
  }
  // Author bonus — multiply by a constant so same-author stays sticky
  if (profile.authors[book.authorName]) {
    score += profile.authors[book.authorName] * WEIGHT.AUTHOR_BONUS;
  }
  // Popularity tiebreaker (tiny weight so it never beats content signals)
  score += (book.plays ?? 0) * 0.0001;
  return score;
}

function scoreBookSimilar(book: Audiobook, seed: Audiobook): number {
  let score = 0;
  const seedCats  = new Set(seed.categories);
  const seedTopics = new Set(seed.topics);
  for (const cat of book.categories)  if (seedCats.has(cat))   score += 3;
  for (const topic of book.topics)    if (seedTopics.has(topic)) score += 2;
  if (book.authorName === seed.authorName)                        score += 4;
  score += (book.plays ?? 0) * 0.0001;
  return score;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function getRecommendations(
  allBooks: Audiobook[],
  signals: UserSignals,
  options: RecommendationOptions = {},
): Audiobook[] {
  const {
    excludeIds = [],
    limit = 12,
    strategy = 'personal',
    seedBook,
  } = options;

  const excludeSet = new Set(excludeIds);

  // Build profile for personal strategy
  const profile =
    strategy === 'personal' || signals.history.length > 0
      ? buildUserProfile(allBooks, signals)
      : null;

  // If personalizing, also exclude already-listened books
  if (profile) {
    Array.from(profile.listenedIds).forEach(id => excludeSet.add(id));
  }

  // Filter candidates
  const candidates = allBooks.filter(b => !excludeSet.has(b.id));

  // Score
  const scored: { book: Audiobook; score: number }[] = candidates.map(book => {
    let score = 0;
    if (strategy === 'similar' && seedBook) {
      score = scoreBookSimilar(book, seedBook);
      // Blend in personal profile if available (hybrid approach)
      if (profile) score += scoreBookPersonal(book, profile) * 0.4;
    } else if (profile) {
      score = scoreBookPersonal(book, profile);
    } else {
      // Anonymous + no seed: fall back to popularity
      score = book.plays ?? 0;
    }
    return { book, score };
  });

  // Sort descending, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.book);
}
