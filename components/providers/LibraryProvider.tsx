'use client';

import { useEffect } from 'react';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';

/**
 * Runs once on app load — fetches from the API and populates the Zustand
 * library store (audiobooks, articles, and author profiles).
 * Also manually rehydrates the userStore from localStorage AFTER mount,
 * preventing SSR/client hydration mismatches that break React event delegation.
 */
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const setData = useLibraryStore((s) => s.setData);
  const isLoaded = useLibraryStore((s) => s.isLoaded);

  // Rehydrate persisted user store from localStorage after client mount
  useEffect(() => {
    useUserStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (isLoaded) return;

    fetch('/api/library')
      .then((r) => r.json())
      .then(({ audiobooks, articles, authors }) => {
        setData(audiobooks ?? [], articles ?? [], authors ?? []);
      })
      .catch((err) => {
        console.error('Failed to load library data:', err);
      });
  }, [isLoaded, setData]);

  return <>{children}</>;
}
