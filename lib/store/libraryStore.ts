'use client';

import { create } from 'zustand';
import Fuse from 'fuse.js';
import type { Audiobook, Article } from '@/lib/types';

interface LibraryState {
  audiobooks: Audiobook[];
  articles: Article[];
  isLoaded: boolean;
  fuse: Fuse<Audiobook> | null;

  // Initialize with fetched data
  setData: (audiobooks: Audiobook[], articles: Article[]) => void;

  // Selectors
  getBySlug: (slug: string) => Audiobook | undefined;
  getArticleBySlug: (slug: string) => Article | undefined;
  getByCategory: (category: string) => Audiobook[];
  getByTopic: (topic: string) => Audiobook[];
  getByAuthor: (name: string) => Audiobook[];
  getRecent: (limit?: number) => Audiobook[];
  getMostPlayed: (limit?: number) => Audiobook[];
  search: (query: string) => Audiobook[];
  getAllCategories: () => string[];
  getAllTopics: () => string[];
  getAllAuthors: () => string[];
}

const fuseOptions = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'authorName', weight: 1.5 },
    { name: 'categories', weight: 1 },
    { name: 'topics', weight: 1 },
    { name: 'excerpt', weight: 0.5 },
  ],
  threshold: 0.35,
  minMatchCharLength: 2,
};

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  audiobooks: [],
  articles: [],
  isLoaded: false,
  fuse: null,

  setData: (audiobooks, articles) => {
    const fuse = new Fuse(audiobooks, fuseOptions);
    set({ audiobooks, articles, isLoaded: true, fuse });
  },

  getBySlug: (slug) => get().audiobooks.find((b) => b.slug === slug),

  getArticleBySlug: (slug) => get().articles.find((a) => a.slug === slug),

  getByCategory: (category) =>
    get().audiobooks.filter((b) =>
      b.categories.some((c) => c.toLowerCase() === category.toLowerCase())
    ),

  getByTopic: (topic) =>
    get().audiobooks.filter((b) =>
      b.topics.some((t) => t.toLowerCase() === topic.toLowerCase())
    ),

  getByAuthor: (name) =>
    get().audiobooks.filter(
      (b) => b.authorName.toLowerCase() === name.toLowerCase()
    ),

  getRecent: (limit = 20) =>
    [...get().audiobooks]
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, limit),

  getMostPlayed: (limit = 20) =>
    [...get().audiobooks]
      .sort((a, b) => b.plays - a.plays)
      .slice(0, limit),

  search: (query) => {
    const { fuse, audiobooks } = get();
    if (!query.trim()) return audiobooks;
    return fuse ? fuse.search(query).map((r) => r.item) : [];
  },

  getAllCategories: () => {
    const set = new Set<string>();
    get().audiobooks.forEach((b) => b.categories.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  },

  getAllTopics: () => {
    const set = new Set<string>();
    get().audiobooks.forEach((b) => b.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  },

  getAllAuthors: () => {
    const set = new Set<string>();
    get().audiobooks.forEach((b) => set.add(b.authorName));
    return Array.from(set).sort();
  },
}));
