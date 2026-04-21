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
    ]).then(([qData, fData, hData, bData]) => {
      if (qData?.quotes) mergeQuotesFromDB(qData.quotes);
      if (fData?.favorites) mergeFavoritesFromDB(fData.favorites);
      if (hData?.history) mergeHistoryFromDB(hData.history);
      if (bData?.bookmarks) mergeBookmarksFromDB(bData.bookmarks);
    }).catch(() => { /* network failure — local state is fine */ });
  }, [isLoaded, isSignedIn, userId, mergeQuotesFromDB, mergeFavoritesFromDB, mergeHistoryFromDB, mergeBookmarksFromDB]);

  return null; // renders nothing
}
