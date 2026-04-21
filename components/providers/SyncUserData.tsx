'use client';

// SyncUserData.tsx
// Mounts once inside ClerkProvider. When a user signs in, it:
// 1. Fetches their quotes, favorites, history, and bookmarks from the DB
// 2. Merges them into the local Zustand store (DB wins for conflicts by id)
// This gives users their full data back on any browser/device automatically.

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useUserStore } from '@/lib/store/userStore';

export function SyncUserData() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const {
    mergeQuotesFromDB,
    mergeFavoritesFromDB,
    mergeHistoryFromDB,
    mergeBookmarksFromDB,
    mergeUpvotesFromDB,
    setSignedIn,
  } = useUserStore();
  const hasSynced = useRef(false);

  // Keep the store informed of sign-in state (used for write-through)
  useEffect(() => {
    if (isLoaded) setSignedIn(!!isSignedIn);
  }, [isLoaded, isSignedIn, setSignedIn]);

  // One-time sync when user is authenticated
  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasSynced.current) return;
    hasSynced.current = true;

    Promise.all([
      fetch('/api/user/quotes').then(r => r.ok ? r.json() : null),
      fetch('/api/user/favorites').then(r => r.ok ? r.json() : null),
      fetch('/api/user/history').then(r => r.ok ? r.json() : null),
      fetch('/api/user/bookmarks').then(r => r.ok ? r.json() : null),
      fetch('/api/user/upvotes').then(r => r.ok ? r.json() : null),
    ]).then(([qData, fData, hData, bData, uvData]) => {
      // 1. Pull down from DB and merge into local via Zustand
      if (qData?.quotes) mergeQuotesFromDB(qData.quotes);
      if (fData?.favorites) mergeFavoritesFromDB(fData.favorites);
      if (hData?.history) mergeHistoryFromDB(hData.history);
      if (bData?.bookmarks) mergeBookmarksFromDB(bData.bookmarks);
      if (uvData?.upvotes) mergeUpvotesFromDB(uvData.upvotes);

      // 2. Push up any local items that the DB didn't already have.
      // This seamlessly migrates data for users who were browsing anonymously 
      // and then created an account.
      setTimeout(() => {
        const state = useUserStore.getState();

        const dbQuoteIds = new Set((qData?.quotes || []).map((q: any) => q.id));
        state.quotes.filter(q => !dbQuoteIds.has(q.id)).forEach(q =>
          fetch('/api/user/quotes', { method: 'POST', body: JSON.stringify(q) })
        );

        const dbFavIds = new Set((fData?.favorites || []).map((f: any) => f.id));
        state.favorites.filter(f => !dbFavIds.has(f.id)).forEach(f =>
          fetch('/api/user/favorites', { method: 'POST', body: JSON.stringify(f) })
        );

        const dbHistIds = new Set((hData?.history || []).map((h: any) => h.bookId));
        state.history.filter(h => !dbHistIds.has(h.bookId)).forEach(h =>
          fetch('/api/user/history', { method: 'POST', body: JSON.stringify(h) })
        );

        const dbBmarkIds = new Set((bData?.bookmarks || []).map((b: any) => b.id));
        state.bookmarks.filter(b => !dbBmarkIds.has(b.id)).forEach(b =>
          fetch('/api/user/bookmarks', { method: 'POST', body: JSON.stringify(b) })
        );
      }, 500);

    }).catch(() => { /* network failure — local state is fine */ });
  }, [isLoaded, isSignedIn, mergeQuotesFromDB, mergeFavoritesFromDB, mergeHistoryFromDB, mergeBookmarksFromDB, mergeUpvotesFromDB]);

  return null; // renders nothing
}
