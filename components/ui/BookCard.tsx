'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useUserStore } from '@/lib/store/userStore';
import type { Audiobook } from '@/lib/types';

function getDurationSecs(book: Audiobook) {
  if (book.totalDuration) {
    const parts = book.totalDuration.split(':').map(Number);
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    if (parts.length === 2) return parts[0]*60 + parts[1];
  }
  return book.chapters.reduce((sum, ch) => sum + (ch.duration || 0), 0);
}

interface BookCardProps {
  book: Audiobook;
  width?: number | string;
  compact?: boolean;
}

export function BookCard({ book, width = 168, compact = false }: BookCardProps) {
  const loadBook = usePlayerStore((s) => s.loadBook);
  const historyEntry = useUserStore((s) => s.history.find(h => h.bookId === book.id));
  const [hovered, setHovered] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  // Calculate progress on mount to avoid hydration mismatches
  useEffect(() => {
    if (historyEntry) {
      const duration = getDurationSecs(book);
      if (duration > 0) {
        setProgress(Math.min(100, Math.max(0, (historyEntry.position / duration) * 100)));
      }
    } else {
      setProgress(null);
    }
  }, [historyEntry, book]);

  return (
    <div
      className="book-card"
      style={{ width, flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/audiobook/${book.slug}`} style={{ display: 'block', position: 'relative' }}>
        {book.coverImage ? (
          <img
            src={book.thumbnailUrl || book.coverImage}
            alt={book.title}
            className="book-card-img"
            loading="lazy"
          />
        ) : (
          <div className="book-card-img cover-placeholder">
            {book.title.charAt(0)}
          </div>
        )}


        
        {/* Progress bar overlay */}
        {progress !== null && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: 'rgba(0,0,0,0.5)', overflow: 'hidden' }}>
             <div style={{ width: `${progress}%`, height: '100%', background: '#22c55e' }} />
          </div>
        )}

        {hovered && (
          <button
            onClick={(e) => { e.preventDefault(); loadBook(book, historyEntry?.position); }}
            style={{
              position: 'absolute',
              bottom: 12, right: 8,
              width: 40, height: 40,
              borderRadius: '50%',
              background: 'var(--color-brand)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast)',
            }}
            title={`Play ${book.title}`}
          >
            <Play size={18} style={{ marginLeft: 2 }} />
          </button>
        )}
      </Link>
      {!compact && (
        <div className="book-card-body">
          <div className="book-card-title">{book.title}</div>
          <div className="book-card-author">{book.authorName}</div>
          {book.length && <div className="book-card-length">{book.length}</div>}
        </div>
      )}
    </div>
  );
}
