'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryEntry, Bookmark } from '@/lib/types';

interface UserState {
  history: HistoryEntry[];
  bookmarks: Bookmark[];

  // History
  addToHistory: (bookId: string, position: number) => void;
  clearHistory: () => void;

  // Bookmarks
  addBookmark: (bookId: string, time: number, note: string) => void;
  removeBookmark: (id: string) => void;
  getBookmarksByBook: (bookId: string) => Bookmark[];
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      history: [],
      bookmarks: [],

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

      addBookmark: (bookId, time, note) => {
        const id = `bm_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        set((state) => ({
          bookmarks: [
            { id, bookId, time, note, createdAt: Date.now() },
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
    }),
    {
      name: 'scrollreader-user', // localStorage key
    }
  )
);
