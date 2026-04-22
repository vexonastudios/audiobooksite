import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const AUDIO_CACHE = 'scrollreader-audio-v1';
const IMAGE_CACHE = 'scrollreader-images-v1';

export interface OfflineBook {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  sizeBytes: number;
  quality: '64k' | '128k';
  downloadedAt: number;
  mp3Url: string; // The original R2 URL - used as cache key
}

interface OfflineState {
  offlineBooks: Record<string, OfflineBook>;
  isDownloading: Record<string, number>; // bookId -> progress (0-100)
  errors: Record<string, string>; // bookId -> error message
  supportsOffline: boolean; // whether browser supports Cache API

  saveBookOffline: (book: any, quality: '64k' | '128k') => Promise<void>;
  cancelDownload: (bookId: string) => void;
  removeBookOffline: (bookId: string) => Promise<void>;
  removeAllOffline: () => Promise<void>;
  isOffline: (bookId: string) => boolean;
  getOfflineUrl: (bookId: string) => string | null;
  checkSupport: () => void;
  clearError: (bookId: string) => void;
  totalStorageBytes: () => number;
}

// Track AbortControllers for in-progress downloads so they can be cancelled
const activeControllers: Record<string, AbortController> = {};

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      offlineBooks: {},
      isDownloading: {},
      errors: {},
      supportsOffline: true,

      checkSupport: () => {
        const supported = typeof window !== 'undefined' && 'caches' in window;
        set({ supportsOffline: supported });
      },

      saveBookOffline: async (book, quality) => {
        // Duplicate download guard
        if (get().isDownloading[book.id] !== undefined) return;

        // Pick the right source URL. Always prefer the 64k URL for standard quality.
        const mp3Url = quality === '128k'
          ? book.mp3Url
          : (book.mp3UrlLow || book.mp3Url);

        if (!mp3Url) {
          set((s) => ({ errors: { ...s.errors, [book.id]: 'No audio URL available for this book.' } }));
          return;
        }

        // Check Cache API support
        if (!('caches' in window)) {
          set((s) => ({ errors: { ...s.errors, [book.id]: 'Your browser does not support offline storage. Try downloading the MP3 file directly.' } }));
          return;
        }

        // Check storage quota (iOS Safari caps at ~50MB per origin)
        if (navigator.storage?.estimate) {
          const { quota = 0, usage = 0 } = await navigator.storage.estimate();
          const available = quota - usage;
          // A 64k/hr audiobook is ~29MB/hr; warn at < 30MB free
          if (available < 30 * 1024 * 1024) {
            set((s) => ({ errors: { ...s.errors, [book.id]: `Not enough storage space (${Math.round(available / 1024 / 1024)}MB free). Clear some saved books first, or download the MP3 file directly.` } }));
            return;
          }
        }

        // Set up abort controller for cancellation
        const abortController = new AbortController();
        activeControllers[book.id] = abortController;

        // Clear any previous error and start progress at 0
        set((s) => ({
          isDownloading: { ...s.isDownloading, [book.id]: 0 },
          errors: { ...s.errors, [book.id]: '' },
        }));

        try {
          // We proxy through our own /api/download endpoint so the fetch
          // comes from the same origin — avoids CORS issues with R2 in iOS Safari SW context.
          const proxyUrl = `/api/download?bookId=${book.id}&quality=${quality}`;

          const response = await fetch(proxyUrl, { signal: abortController.signal });
          if (!response.ok) throw new Error(`Download failed (HTTP ${response.status})`);

          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;

          let loaded = 0;
          const reader = response.body?.getReader();
          const chunks: BlobPart[] = [];

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                chunks.push(value);
                loaded += value.length;
                if (total > 0) {
                  const progress = Math.min(99, Math.round((loaded / total) * 100));
                  set((s) => ({ isDownloading: { ...s.isDownloading, [book.id]: progress } }));
                }
              }
            }
          }

          // Build final blob and cache it keyed to the R2 URL so the SW can intercept it
          const blob = new Blob(chunks, { type: 'audio/mpeg' });
          const cache = await caches.open(AUDIO_CACHE);

          await cache.put(mp3Url, new Response(blob, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': loaded.toString(),
              'Accept-Ranges': 'bytes',
            },
          }));

          // Also cache the cover image for offline display
          if (book.coverImage || book.thumbnailUrl) {
            try {
              const imageCache = await caches.open(IMAGE_CACHE);
              const coverUrl = book.thumbnailUrl || book.coverImage;
              const imgResponse = await fetch(coverUrl, { signal: abortController.signal });
              if (imgResponse.ok) {
                await imageCache.put(coverUrl, imgResponse);
              }
              // Also cache the full-size cover if different from thumbnail
              if (book.coverImage && book.coverImage !== coverUrl) {
                const fullResponse = await fetch(book.coverImage, { signal: abortController.signal });
                if (fullResponse.ok) {
                  await imageCache.put(book.coverImage, fullResponse);
                }
              }
            } catch {
              // Non-critical — continue even if image caching fails
            }
          }

          const offlineBook: OfflineBook = {
            id: book.id,
            slug: book.slug,
            title: book.title,
            coverImage: book.coverImage,
            sizeBytes: loaded,
            quality,
            downloadedAt: Date.now(),
            mp3Url,
          };

          set((s) => {
            const newDownloading = { ...s.isDownloading };
            delete newDownloading[book.id];
            return {
              offlineBooks: { ...s.offlineBooks, [book.id]: offlineBook },
              isDownloading: newDownloading,
            };
          });

        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            // User cancelled — just clean up
            set((s) => {
              const newDownloading = { ...s.isDownloading };
              delete newDownloading[book.id];
              return { isDownloading: newDownloading };
            });
          } else {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            set((s) => {
              const newDownloading = { ...s.isDownloading };
              delete newDownloading[book.id];
              return {
                isDownloading: newDownloading,
                errors: { ...s.errors, [book.id]: `Save failed: ${msg}` },
              };
            });
          }
        } finally {
          delete activeControllers[book.id];
        }
      },

      cancelDownload: (bookId) => {
        const controller = activeControllers[bookId];
        if (controller) {
          controller.abort();
        }
      },

      removeBookOffline: async (bookId) => {
        const book = get().offlineBooks[bookId];
        if (!book) return;
        try {
          if ('caches' in window) {
            const cache = await caches.open(AUDIO_CACHE);
            await cache.delete(book.mp3Url);
            // Also clean up cached cover images
            const imageCache = await caches.open(IMAGE_CACHE);
            if (book.coverImage) await imageCache.delete(book.coverImage).catch(() => {});
          }
        } catch (e) {
          console.warn('Could not clear cache entry:', e);
        }
        set((s) => {
          const newBooks = { ...s.offlineBooks };
          delete newBooks[bookId];
          return { offlineBooks: newBooks };
        });
      },

      removeAllOffline: async () => {
        try {
          if ('caches' in window) {
            await caches.delete(AUDIO_CACHE);
            await caches.delete(IMAGE_CACHE);
          }
        } catch (e) {
          console.warn('Could not clear caches:', e);
        }
        set({ offlineBooks: {} });
      },

      isOffline: (bookId) => !!get().offlineBooks[bookId],

      // Returns the original mp3 URL (the SW will intercept and serve from cache)
      getOfflineUrl: (bookId) => get().offlineBooks[bookId]?.mp3Url ?? null,

      clearError: (bookId) => {
        set((s) => ({ errors: { ...s.errors, [bookId]: '' } }));
      },

      totalStorageBytes: () => {
        return Object.values(get().offlineBooks).reduce((acc, b) => acc + b.sizeBytes, 0);
      },
    }),
    {
      name: 'scrollreader-offline-storage',
      // Don't persist isDownloading or errors — those are transient
      partialize: (s) => ({ offlineBooks: s.offlineBooks }),
    }
  )
);
