'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryEntry, Bookmark, SavedQuote, Favorite } from '@/lib/types';

export interface QuoteSettings {
  includeLink: boolean;
  includeBook: boolean;
  useQuotes: boolean;
}

interface UserState {
  history: HistoryEntry[];
  bookmarks: Bookmark[];
  quotes: SavedQuote[];
  favorites: Favorite[];
  skipInterval: number;

  // Notifications
  notificationsEnabled: boolean;
  heardNotificationIds: string[];

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
  updateBookmark: (id: string, partial: Partial<Bookmark>) => void;
  getBookmarksByBook: (bookId: string) => Bookmark[];

  // Quotes
  saveQuote: (quote: Omit<SavedQuote, 'id' | 'createdAt'>) => void;
  removeQuote: (id: string) => void;

  // Favorites
  addFavorite: (item: Omit<Favorite, 'id' | 'createdAt'>) => void;
  removeFavorite: (itemId: string) => void;
  isFavorited: (itemId: string) => boolean;
  toggleFavorite: (item: Omit<Favorite, 'id' | 'createdAt'>) => void;

  // Settings
  quoteSettings: QuoteSettings;
  setSkipInterval: (val: number) => void;
  updateQuoteSettings: (settings: Partial<QuoteSettings>) => void;
  playerQuickActions: string[];
  setPlayerQuickActions: (actions: string[]) => void;

  // Notification actions
  toggleNotifications: () => void;
  markNotificationHeard: (id: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      history: [],
      bookmarks: [],
      quotes: [],
      favorites: [],
      skipInterval: 15,
      quoteSettings: { includeLink: true, includeBook: true, useQuotes: true },
      notificationsEnabled: true,
      heardNotificationIds: [],
      playerQuickActions: ['speed', 'chapters', 'bookmark', 'favorite'],

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

      updateBookmark: (id, partial) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((b) => (b.id === id ? { ...b, ...partial } : b)),
        }));
      },

      getBookmarksByBook: (bookId) => {
        return get().bookmarks.filter((b) => b.bookId === bookId);
      },

      setSkipInterval: (val) => set({ skipInterval: val }),
      setPlayerQuickActions: (actions) => set({ playerQuickActions: actions }),
      updateQuoteSettings: (updates) => set((state) => ({
        quoteSettings: { ...state.quoteSettings, ...updates }
      })),

      toggleNotifications: () => set((state) => ({
        notificationsEnabled: !state.notificationsEnabled,
      })),

      markNotificationHeard: (id) => set((state) => ({
        heardNotificationIds: state.heardNotificationIds.includes(id)
          ? state.heardNotificationIds
          : [...state.heardNotificationIds, id],
      })),

      saveQuote: (quote) => {
        const id = `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        set((state) => ({
          quotes: [{ id, createdAt: Date.now(), ...quote }, ...state.quotes].slice(0, 200),
        }));
      },

      removeQuote: (id) => {
        set((state) => ({ quotes: state.quotes.filter(q => q.id !== id) }));
      },

      addFavorite: (item) => {
        const id = `fav_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        set((state) => {
          if (state.favorites.some(f => f.itemId === item.itemId)) return state;
          return { favorites: [{ id, createdAt: Date.now(), ...item }, ...state.favorites] };
        });
      },

      removeFavorite: (itemId) => {
        set((state) => ({ favorites: state.favorites.filter(f => f.itemId !== itemId) }));
      },

      isFavorited: (itemId) => {
        return !!get().favorites.find(f => f.itemId === itemId);
      },

      toggleFavorite: (item) => {
        const exists = get().favorites.some(f => f.itemId === item.itemId);
        if (exists) {
          get().removeFavorite(item.itemId);
        } else {
          get().addFavorite(item);
        }
      },
    }),
    {
      name: 'scrollreader-user', // localStorage key
      skipHydration: true,       // prevent SSR/client mismatch that breaks React event system
    }
  )
);
