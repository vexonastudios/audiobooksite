'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryEntry, Bookmark, SavedQuote } from '@/lib/types';

interface UserState {
  history: HistoryEntry[];
  bookmarks: Bookmark[];
  quotes: SavedQuote[];
  skipInterval: number;

  // History
  addToHistory: (bookId: string, position: number) => void;
  clearHistory: () => void;

  // Bookmarks
  addBookmark: (bookId: string, time: number, meta: {
    note?: string;
    chapterTitle?: string;
    transcriptContext?: string;
    bookTitle?: string;
    bookSlug?: string;
    bookCover?: string;
    bookAuthor?: string;
  }) => void;
  removeBookmark: (id: string) => void;
  getBookmarksByBook: (bookId: string) => Bookmark[];

  // Quotes
  saveQuote: (quote: Omit<SavedQuote, 'id' | 'createdAt'>) => void;
  removeQuote: (id: string) => void;

  // Settings
  setSkipInterval: (val: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      history: [],
      bookmarks: [],
      quotes: [],
      skipInterval: 15,

      addToHistory: (bookId, position) => {
        set((state) => {
          const filtered = state.history.filter((h) => h.bookId !== bookId);
          return {
            history: [
              { bookId, position, lastListened: Date.now() },
              ...filtered,
            ].slice(0, 50), // keep last 50
          };
        });
      },

      clearHistory: () => set({ history: [] }),

      addBookmark: (bookId, time, meta) => {
        const id = `bm_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        set((state) => ({
          bookmarks: [
            { id, bookId, time, note: meta.note || '', createdAt: Date.now(), ...meta },
            ...state.bookmarks,
          ],
        }));
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
      },

      getBookmarksByBook: (bookId) => {
        return get().bookmarks.filter((b) => b.bookId === bookId);
      },

      setSkipInterval: (val) => set({ skipInterval: val }),

      saveQuote: (quote) => {
        const id = `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        set((state) => ({
          quotes: [{ id, createdAt: Date.now(), ...quote }, ...state.quotes].slice(0, 200),
        }));
      },

      removeQuote: (id) => {
        set((state) => ({ quotes: state.quotes.filter(q => q.id !== id) }));
      },
    }),
    {
      name: 'scrollreader-user', // localStorage key
    }
  )
);
