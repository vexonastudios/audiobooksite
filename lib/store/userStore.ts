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
  // Whether a Clerk user is currently signed in (set by SyncUserData)
  isSignedIn: boolean;
  setSignedIn: (v: boolean) => void;

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
  mergeQuotesFromDB: (dbQuotes: SavedQuote[]) => void;

  // Favorites
  addFavorite: (item: Omit<Favorite, 'id' | 'createdAt'>) => void;
  removeFavorite: (itemId: string) => void;
  isFavorited: (itemId: string) => boolean;
  toggleFavorite: (item: Omit<Favorite, 'id' | 'createdAt'>) => void;
  mergeFavoritesFromDB: (dbFavs: Favorite[]) => void;

  // Settings
  quoteSettings: QuoteSettings;
  setSkipInterval: (val: number) => void;
  updateQuoteSettings: (settings: Partial<QuoteSettings>) => void;
  playerQuickActions: string[];
  setPlayerQuickActions: (actions: string[]) => void;
  readAlongFontSize: number;
  setReadAlongFontSize: (size: number) => void;

  // Notification actions
  toggleNotifications: () => void;
  markNotificationHeard: (id: string) => void;

  // Mobile App Navigation
  mobileNavActions: string[];
  setMobileNavActions: (actions: string[]) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      history: [],
      bookmarks: [],
      quotes: [],
      favorites: [],
      skipInterval: 15,
      isSignedIn: false,
      setSignedIn: (v) => set({ isSignedIn: v }),
      quoteSettings: { includeLink: true, includeBook: true, useQuotes: true },
      notificationsEnabled: true,
      heardNotificationIds: [],
      playerQuickActions: ['chapters', 'bookmark', 'quote', 'readalong'],
      readAlongFontSize: 1.2,
      mobileNavActions: ['home', 'browse', 'favorites', 'quotes'],

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
      setMobileNavActions: (actions) => set({ mobileNavActions: actions }),
      setReadAlongFontSize: (size) => set({ readAlongFontSize: size }),
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
        const full = { id, createdAt: Date.now(), ...quote };
        set((state) => ({ quotes: [full, ...state.quotes].slice(0, 200) }));
        // Write-through to DB for signed-in users (fire and forget)
        if (get().isSignedIn) {
          fetch('/api/user/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(full),
          }).catch(() => {});
        }
      },

      removeQuote: (id) => {
        set((state) => ({ quotes: state.quotes.filter(q => q.id !== id) }));
        // Write-through delete
        if (get().isSignedIn) {
          fetch(`/api/user/quotes?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
        }
      },

      mergeQuotesFromDB: (dbQuotes) => {
        set((state) => {
          const existingIds = new Set(state.quotes.map(q => q.id));
          const newOnes = dbQuotes.filter(q => !existingIds.has(q.id));
          return { quotes: [...newOnes, ...state.quotes].slice(0, 500) };
        });
      },

      addFavorite: (item) => {
        const id = `fav_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        let full: Favorite | null = null;
        set((state) => {
          if (state.favorites.some(f => f.itemId === item.itemId)) return state;
          full = { id, createdAt: Date.now(), ...item };
          return { favorites: [full, ...state.favorites] };
        });
        // Write-through to DB
        if (full && get().isSignedIn) {
          fetch('/api/user/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(full),
          }).catch(() => {});
        }
      },

      removeFavorite: (itemId) => {
        const fav = get().favorites.find(f => f.itemId === itemId);
        set((state) => ({ favorites: state.favorites.filter(f => f.itemId !== itemId) }));
        if (fav && get().isSignedIn) {
          fetch(`/api/user/favorites?id=${encodeURIComponent(fav.id)}`, { method: 'DELETE' }).catch(() => {});
        }
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

      mergeFavoritesFromDB: (dbFavs) => {
        set((state) => {
          const existingIds = new Set(state.favorites.map(f => f.id));
          const newOnes = dbFavs.filter(f => !existingIds.has(f.id));
          return { favorites: [...newOnes, ...state.favorites] };
        });
      },
    }),
    {
      name: 'scrollreader-user', // localStorage key
      skipHydration: true,       // prevent SSR/client mismatch that breaks React event system
      version: 3,
      migrate: (persistedState: any, fromVersion: number) => {
        // v1 → v2: ensure quote and readalong are in playerQuickActions
        if (fromVersion < 2) {
          let actions: string[] = persistedState.playerQuickActions ?? ['chapters', 'bookmark', 'quote', 'readalong'];
          actions = actions.filter((a: string) => a !== 'speed'); // removed from quick actions
          if (!actions.includes('quote')) actions.push('quote');
          if (!actions.includes('readalong')) actions.push('readalong');
          persistedState.playerQuickActions = actions;
          if (persistedState.readAlongFontSize === undefined) {
            persistedState.readAlongFontSize = 1.2;
          }
        }
        // v2 → v3: Add mobileNavActions
        if (fromVersion < 3) {
          if (!persistedState.mobileNavActions) {
            persistedState.mobileNavActions = ['home', 'browse', 'favorites', 'quotes'];
          }
        }
        return persistedState;
      },
    }
  )
);
