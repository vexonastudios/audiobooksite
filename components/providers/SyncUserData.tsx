'use client';

// SyncUserData.tsx
// Mounts once inside ClerkProvider. When a user signs in, it:
// 1. Fetches their quotes + favorites from the DB
// 2. Merges them into the local Zustand store (DB wins for conflicts by id)
// This gives users their data back on any browser/device automatically.

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useUserStore } from '@/lib/store/userStore';

export function SyncUserData() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { mergeQuotesFromDB, mergeFavoritesFromDB, setSignedIn } = useUserStore();
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
    ]).then(([qData, fData]) => {
      if (qData?.quotes) mergeQuotesFromDB(qData.quotes);
      if (fData?.favorites) mergeFavoritesFromDB(fData.favorites);
    }).catch(() => { /* network failure — local state is fine */ });
  }, [isLoaded, isSignedIn, userId, mergeQuotesFromDB, mergeFavoritesFromDB]);

  return null; // renders nothing
}
