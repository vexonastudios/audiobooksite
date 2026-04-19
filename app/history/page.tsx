'use client';

import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { Play, History, Trash2 } from 'lucide-react';

function formatTime(s: number) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function HistoryPage() {
  const history = useUserStore((s) => s.history);
  const clearHistory = useUserStore((s) => s.clearHistory);
  const getBySlug = useLibraryStore((s) => s.getBySlug);
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const loadBook = usePlayerStore((s) => s.loadBook);

  if (!isLoaded) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;

  const getBookForEntry = (bookId: string) => {
    const all = useLibraryStore.getState().audiobooks;
    return all.find(b => b.id === bookId);
  }

  const entriesWithBooks = history.map(h => ({
    ...h,
    book: getBookForEntry(h.bookId)
  })).filter(h => h.book);

  return (
    <div className="page" style={{ maxWidth: 840 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1>Listening History</h1>
        {entriesWithBooks.length > 0 && (
          <button onClick={clearHistory} className="btn text-error" style={{ fontSize: '0.875rem' }}>
            <Trash2 size={16} /> Clear All
          </button>
        )}
      </div>

      {entriesWithBooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
          <History size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p>Your listening history is empty.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {entriesWithBooks.map((entry) => {
             const book = entry.book!;
             return (
               <div key={entry.bookId} className="card" style={{ display: 'flex', gap: 20, alignItems: 'center', padding: 16 }}>
                 <Link href={`/audiobook/${book.slug}`} style={{ flexShrink: 0 }}>
                   {book.coverImage ? (
                     <img src={book.thumbnailUrl || book.coverImage} alt={book.title} style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                   ) : (
                     <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)' }} />
                   )}
                 </Link>
                 <div style={{ flex: 1, minWidth: 0 }}>
                   <div className="text-secondary text-xs" style={{ marginBottom: 4 }}>
                     Last listened {new Date(entry.lastListened).toLocaleDateString()}
                   </div>
                   <Link href={`/audiobook/${book.slug}`} style={{ fontSize: '1.125rem', fontWeight: 600, display: 'block', marginBottom: 2 }} className="truncate">
                     {book.title}
                   </Link>
                   <div className="text-muted text-sm truncate">{book.authorName}</div>
                   <div style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--color-brand)', fontWeight: 500 }}>
                     Position: {formatTime(entry.position)}
                   </div>
                 </div>
                 <button 
                   className="btn btn-primary btn-icon" 
                   onClick={() => loadBook(book, entry.position)}
                   title="Resume"
                   style={{ width: 48, height: 48, borderRadius: '50%' }}
                 >
                   <Play size={20} style={{ marginLeft: 2 }} />
                 </button>
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
}
