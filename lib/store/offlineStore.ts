import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OfflineBook {
  id: string;
  slug: string;
  title: string;
  sizeBytes: number;
  quality: '64k' | '128k';
  downloadedAt: number;
  mp3Url: string; // The URL that was cached
}

interface OfflineState {
  offlineBooks: Record<string, OfflineBook>;
  isDownloading: Record<string, number>; // bookId -> progress (0-100)
  
  saveBookOffline: (book: any, quality: '64k' | '128k') => Promise<void>;
  removeBookOffline: (bookId: string) => Promise<void>;
  isOffline: (bookId: string) => boolean;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      offlineBooks: {},
      isDownloading: {},

      saveBookOffline: async (book, quality) => {
        const mp3Url = quality === '128k' ? book.mp3Url : (book.mp3UrlLow || book.mp3Url);
        if (!mp3Url) return;

        set((state) => ({
          isDownloading: { ...state.isDownloading, [book.id]: 0 }
        }));

        try {
          // Fetch the file to cache it
          const response = await fetch(mp3Url);
          if (!response.ok) throw new Error('Failed to download audio file');

          // Get total size for progress tracking
          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          
          let loaded = 0;
          const reader = response.body?.getReader();
          const chunks = [];

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              if (value) {
                chunks.push(value);
                loaded += value.length;
                if (total > 0) {
                  const progress = Math.round((loaded / total) * 100);
                  set((state) => ({
                    isDownloading: { ...state.isDownloading, [book.id]: progress }
                  }));
                }
              }
            }
          }

          // Combine chunks and put into cache
          const blob = new Blob(chunks, { type: 'audio/mpeg' });
          const cache = await caches.open('audiobook-offline-cache-v1');
          
          // Store it against the exact URL
          await cache.put(mp3Url, new Response(blob, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': loaded.toString()
            }
          }));

          const offlineBook: OfflineBook = {
            id: book.id,
            slug: book.slug,
            title: book.title,
            sizeBytes: loaded,
            quality,
            downloadedAt: Date.now(),
            mp3Url
          };

          set((state) => {
            const newIsDownloading = { ...state.isDownloading };
            delete newIsDownloading[book.id];
            
            return {
              offlineBooks: { ...state.offlineBooks, [book.id]: offlineBook },
              isDownloading: newIsDownloading
            };
          });

        } catch (error) {
          console.error('Failed to save offline:', error);
          set((state) => {
            const newIsDownloading = { ...state.isDownloading };
            delete newIsDownloading[book.id];
            return { isDownloading: newIsDownloading };
          });
          throw error;
        }
      },

      removeBookOffline: async (bookId) => {
        const book = get().offlineBooks[bookId];
        if (!book) return;

        try {
          const cache = await caches.open('audiobook-offline-cache-v1');
          await cache.delete(book.mp3Url);

          set((state) => {
            const newBooks = { ...state.offlineBooks };
            delete newBooks[bookId];
            return { offlineBooks: newBooks };
          });
        } catch (error) {
          console.error('Failed to remove from cache:', error);
        }
      },

      isOffline: (bookId) => {
        return !!get().offlineBooks[bookId];
      }
    }),
    {
      name: 'scrollreader-offline-storage',
    }
  )
);
