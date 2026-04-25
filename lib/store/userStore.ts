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
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  history: HistoryEntry[];
  bookmarks: Bookmark[];
  quotes: SavedQuote[];
  favorites: Favorite[];
  upvotedQuotes: { quoteText: string; bookId: string }[];
  skipInterval: number;
  // Whether a Clerk user is currently signed in (set by SyncUserData)
  isSignedIn: boolean;
  setSignedIn: (v: boolean) => void;

  // Push notifications (Web Push / FCM)
  pushEnabled: boolean;
  setPushEnabled: (v: boolean) => void;

  // Notifications (in-app audio banner)
  notificationsEnabled: boolean;
  heardNotificationIds: string[];

  // History
  addToHistory: (bookId: string, position: number) => void;
  clearHistory: () => void;
  mergeHistoryFromDB: (dbHistory: HistoryEntry[]) => void;

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
  mergeBookmarksFromDB: (dbBookmarks: Bookmark[]) => void;

  // Quotes
  saveQuote: (quote: Omit<SavedQuote, 'id' | 'createdAt'>) => void;
  removeQuote: (id: string) => void;
  mergeQuotesFromDB: (dbQuotes: SavedQuote[]) => void;

  // Upvotes
  toggleUpvote: (quoteText: string, bookId: string) => void;
  isUpvoted: (quoteText: string, bookId: string) => boolean;
  mergeUpvotesFromDB: (upvotes: { quoteText: string; bookId: string }[]) => void;

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

  // Scroll Radio
  scrollRadioEnabled: boolean;
  toggleScrollRadio: () => void;

  // Mobile App Navigation
  mobileNavActions: string[];
  setMobileNavActions: (actions: string[]) => void;

  // Appearance
  colorScheme: 'light' | 'dark' | 'system';
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      history: [],
      bookmarks: [],
      quotes: [],
      favorites: [],
      upvotedQuotes: [],
      skipInterval: 15,
      isSignedIn: false,
      setSignedIn: (v) => set({ isSignedIn: v }),
      quoteSettings: { includeLink: true, includeBook: true, useQuotes: true },
      notificationsEnabled: true,
      heardNotificationIds: [],
      pushEnabled: false,
      colorScheme: 'system' as const,
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
      playerQuickActions: ['chapters', 'bookmark', 'quote', 'readalong'],
      readAlongFontSize: 1.2,
      mobileNavActions: ['home', 'browse', 'favorites', 'quotes'],
      scrollRadioEnabled: true,

      addToHistory: (bookId, position) => {
        const entry: HistoryEntry = { bookId, position, lastListened: Date.now() };
        set((state) => {
          const filtered = state.history.filter((h) => h.bookId !== bookId);
          return {
            history: [entry, ...filtered].slice(0, 50),
          };
        });
        // Write-through: update position in DB for signed-in users (throttled by caller)
        if (get().isSignedIn) {
          fetch('/api/user/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
          }).catch(() => {});
        }
      },

      clearHistory: () => {
        set({ history: [] });
        if (get().isSignedIn) {
          fetch('/api/user/history', { method: 'DELETE' }).catch(() => {});
        }
      },

      mergeHistoryFromDB: (dbHistory) => {
        set((state) => {
          // For history, DB wins for each bookId (most accurate cross-device position)
          const localByBook = new Map(state.history.map(h => [h.bookId, h]));
          dbHistory.forEach(h => localByBook.set(h.bookId, h));
          const merged = Array.from(localByBook.values())
            .sort((a, b) => b.lastListened - a.lastListened)
            .slice(0, 50);
          return { history: merged };
        });
      },

      addBookmark: (bookId, time, meta) => {
        const id = `bm_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const full: Bookmark = { id, bookId, time, note: meta.note || '', createdAt: Date.now(), ...meta };
        set((state) => ({
          bookmarks: [full, ...state.bookmarks],
        }));
        if (get().isSignedIn) {
          fetch('/api/user/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(full),
          }).catch(() => {});
        }
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
        if (get().isSignedIn) {
          fetch(`/api/user/bookmarks?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
        }
      },

      updateBookmark: (id, partial) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((b) => (b.id === id ? { ...b, ...partial } : b)),
        }));
        // Sync the updated bookmark to DB
        const updated = get().bookmarks.find(b => b.id === id);
        if (updated && get().isSignedIn) {
          fetch('/api/user/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
        }
      },

      getBookmarksByBook: (bookId) => {
        return get().bookmarks.filter((b) => b.bookId === bookId);
      },

      mergeBookmarksFromDB: (dbBookmarks) => {
        set((state) => {
          const existingIds = new Set(state.bookmarks.map(b => b.id));
          const newOnes = dbBookmarks.filter(b => !existingIds.has(b.id));
          return { bookmarks: [...newOnes, ...state.bookmarks] };
        });
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

      setPushEnabled: (v) => set({ pushEnabled: v }),

      toggleScrollRadio: () => set((state) => ({
        scrollRadioEnabled: !state.scrollRadioEnabled,
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

      toggleUpvote: (quoteText, bookId) => {
        const isCurrentlyUpvoted = get().upvotedQuotes.some(
          u => u.quoteText === quoteText && u.bookId === bookId
        );
        // Optimistic update
        set((state) => ({
          upvotedQuotes: isCurrentlyUpvoted
            ? state.upvotedQuotes.filter(u => !(u.quoteText === quoteText && u.bookId === bookId))
            : [...state.upvotedQuotes, { quoteText, bookId }],
        }));
        // Fire and forget to server
        fetch('/api/user/upvotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteText, bookId }),
        }).catch(() => {});
      },

      isUpvoted: (quoteText, bookId) => {
        return get().upvotedQuotes.some(u => u.quoteText === quoteText && u.bookId === bookId);
      },

      mergeUpvotesFromDB: (upvotes) => {
        set({ upvotedQuotes: upvotes });
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
      version: 6,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
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
        // v3 → v4: Add scrollRadioEnabled
        if (fromVersion < 4) {
          if (persistedState.scrollRadioEnabled === undefined) {
            persistedState.scrollRadioEnabled = true;
          }
        }
        // v4 → v5: Add colorScheme
        if (fromVersion < 5) {
          if (persistedState.colorScheme === undefined) {
            persistedState.colorScheme = 'system';
          }
        }
        // v5 → v6: Add pushEnabled (off by default)
        if (fromVersion < 6) {
          persistedState.pushEnabled = false;
        }
        return persistedState;
      },
    }
  )
);
