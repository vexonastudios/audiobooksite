'use client';

import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { Bookmark, Play, X } from 'lucide-react';
import type { Bookmark as BookmarkType } from '@/lib/types';

function formatTime(s: number) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function BookmarksPage() {
  const bookmarks = useUserStore((s) => s.bookmarks);
  const removeBookmark = useUserStore((s) => s.removeBookmark);
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const loadBook = usePlayerStore((s) => s.loadBook);
  const { currentBook, currentTime } = usePlayerStore();

  if (!isLoaded) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;

  const getBookForEntry = (bookId: string) => {
    const all = useLibraryStore.getState().audiobooks;
    return all.find(b => b.id === bookId);
  }

  // Group bookmarks by bookId
  const groupedBookmarks = bookmarks.reduce((acc, bm) => {
    if (!acc[bm.bookId]) acc[bm.bookId] = [];
    acc[bm.bookId].push(bm);
    return acc;
  }, {} as Record<string, BookmarkType[]>);

  const bookIds = Object.keys(groupedBookmarks);

  return (
    <div className="page" style={{ maxWidth: 840 }}>
      <div style={{ marginBottom: 32 }}>
        <h1>Saved Bookmarks</h1>
        <p className="text-secondary" style={{ marginTop: 8 }}>Your custom notes and saved timestamps.</p>
      </div>

      {bookmarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
          <Bookmark size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p>You haven't saved any bookmarks yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {bookIds.map(bookId => {
             const book = getBookForEntry(bookId);
             if (!book) return null;
             const bms = groupedBookmarks[bookId].sort((a,b) => a.time - b.time);
             
             return (
               <div key={bookId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                 <div style={{ padding: '16px 20px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 16, alignItems: 'center' }}>
                   {book.coverImage ? (
                     <img src={book.thumbnailUrl || book.coverImage} alt={book.title} style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                   ) : (
                     <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--color-brand)' }} />
                   )}
                   <div>
                     <Link href={`/audiobook/${book.slug}`} style={{ fontWeight: 600, fontSize: '1.0625rem' }}>{book.title}</Link>
                     <div className="text-muted text-sm">{bms.length} {bms.length === 1 ? 'bookmark' : 'bookmarks'}</div>
                   </div>
                 </div>
                 
                 <div style={{ padding: '12px 20px' }}>
                   {bms.map(bm => {
                      const isCurrent = currentBook?.id === book.id;
                      return (
                        <div key={bm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                            <div className="text-secondary" style={{ fontStyle: 'italic', marginBottom: 4 }}>"{bm.note}"</div>
                            <div className="text-xs text-muted">Added {new Date(bm.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8125rem' }}
                              onClick={() => {
                                if (!isCurrent) loadBook(book, bm.time);
                                else {
                                  const {getAudioElement} = require('@/lib/store/playerStore');
                                  getAudioElement().currentTime = bm.time;
                                }
                              }}
                            >
                              <Play size={14} /> {formatTime(bm.time)}
                            </button>
                            <button className="btn btn-icon text-error" onClick={() => removeBookmark(bm.id)} title="Delete bookmark" style={{ width: 32, height: 32 }}>
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      )
                   })}
                 </div>
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
}
