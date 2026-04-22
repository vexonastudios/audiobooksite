'use client';

/**
 * LegacyFavoritesMigration
 *
 * One-time migration for users coming from the old WordPress scrollreader.com site.
 *
 * The old site stored favorites in localStorage like:
 *   key: "favorites"
 *   value: ["1260", "842"]   ← WordPress post IDs (which ARE our new DB book IDs)
 *
 * The new app stores favorites under "scrollreader-user" in a richer Favorite object.
 * This component runs once, reads the old key, looks up each book from the library,
 * and imports them into the new store — then deletes the old key so it never runs again.
 */

import { useEffect } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import { useLibraryStore } from '@/lib/store/libraryStore';

const LEGACY_KEY = 'favorites';         // Old WordPress localStorage key
const MIGRATED_FLAG = 'sr_wp_fav_migrated'; // Set after migration so it never re-runs

export function LegacyFavoritesMigration() {
  const addFavorite = useUserStore((s) => s.addFavorite);
  const favorites = useUserStore((s) => s.favorites);
  const books = useLibraryStore((s) => s.audiobooks);

  useEffect(() => {
    // Only run client-side, only once ever, only when the library is loaded
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(MIGRATED_FLAG)) return;  // already done
    if (books.length === 0) return;                    // library not ready yet

    let legacyIds: string[] = [];
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) {
        // No old favorites — still mark as done so we don't keep checking
        localStorage.setItem(MIGRATED_FLAG, '1');
        return;
      }
      legacyIds = JSON.parse(raw);
      if (!Array.isArray(legacyIds) || legacyIds.length === 0) {
        localStorage.setItem(MIGRATED_FLAG, '1');
        return;
      }
    } catch {
      localStorage.setItem(MIGRATED_FLAG, '1');
      return;
    }

    // Build a set of already-favorited itemIds so we don't double-import
    const alreadyFavoritedIds = new Set(favorites.map((f) => f.itemId));

    let imported = 0;
    legacyIds.forEach((wpPostId) => {
      const id = String(wpPostId);
      if (alreadyFavoritedIds.has(id)) return; // already in new store

      // WordPress post IDs are used as the book ID in our new DB too
      const book = books.find((b) => b.id === id);
      if (!book) {
        console.warn(`[LegacyMigration] Could not find book for WP post ID: ${id}`);
        return;
      }

      addFavorite({
        type: 'audiobook',
        itemId: book.id,
        itemSlug: book.slug,
        title: book.title,
        author: book.authorName,
        cover: book.coverImage,
        thumbnail: book.thumbnailUrl,
      });
      imported++;
    });

    // Mark migration complete and clean up the old key
    localStorage.setItem(MIGRATED_FLAG, '1');
    localStorage.removeItem(LEGACY_KEY);

    if (imported > 0) {
      console.info(`[LegacyMigration] Imported ${imported} favorite(s) from old Scroll Reader site.`);
    }
  }, [books, favorites, addFavorite]); // re-runs if library loads after mount

  return null;
}
