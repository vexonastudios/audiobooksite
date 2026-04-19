'use client';

import { useEffect } from 'react';
import { useLibraryStore } from '@/lib/store/libraryStore';

/**
 * Runs once on app load — fetches the static JSON files and
 * populates the Zustand library store.
 */
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const setData = useLibraryStore((s) => s.setData);
  const isLoaded = useLibraryStore((s) => s.isLoaded);

  useEffect(() => {
    if (isLoaded) return;

    Promise.all([
      fetch('/data/audiobooks.json').then((r) => r.json()),
      fetch('/data/articles.json').then((r) => r.json()),
    ])
      .then(([audiobooks, articles]) => {
        setData(audiobooks, articles);
      })
      .catch((err) => {
        console.error('Failed to load library data:', err);
      });
  }, [isLoaded, setData]);

  return <>{children}</>;
}
