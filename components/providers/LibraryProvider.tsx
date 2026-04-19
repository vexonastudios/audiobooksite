'use client';

import { useEffect } from 'react';
import { useLibraryStore } from '@/lib/store/libraryStore';

/**
 * Runs once on app load — fetches from the API and populates the Zustand
 * library store (audiobooks, articles, and author profiles).
 */
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const setData = useLibraryStore((s) => s.setData);
  const isLoaded = useLibraryStore((s) => s.isLoaded);

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
