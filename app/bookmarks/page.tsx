'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { Bookmark, Play, X, Search, Clock, BookOpen, Quote, Share2, Copy, Check, Edit3 } from 'lucide-react';
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

function BookmarkCard({ bm, onDelete, onPlay, onUpdate }: { bm: BookmarkType; onDelete: () => void; onPlay: () => void; onUpdate: (partial: Partial<BookmarkType>) => void }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState(bm.note || '');

  function shareQuote() {
    if (!bm.transcriptContext) return;
    const bookTitle = bm.bookTitle || 'Scroll Reader Audiobook';
    const author = bm.bookAuthor || '';
    const slug = bm.bookSlug || '';
    const text = `"${bm.transcriptContext}"\n\n— ${bookTitle}${author ? ' by ' + author : ''}\nhttps://scrollreader.com/audiobook/${slug}?t=${Math.floor(bm.time)}`;

    if (navigator.share) {
      navigator.share({ title: bookTitle, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow var(--transition-fast)' }}>
      {/* Book header */}
      <div style={{ padding: '14px 18px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 14, alignItems: 'center' }}>
        {bm.bookCover ? (
          <img src={bm.bookCover} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--color-brand)', flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0 }}>
          <Link href={bm.bookSlug ? `/audiobook/${bm.bookSlug}` : '#'} style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block' }} className="truncate">
            {bm.bookTitle || 'Unknown Book'}
          </Link>
          {bm.bookAuthor && <div className="text-muted text-xs">{bm.bookAuthor}</div>}
        </div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* Chapter + Timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: bm.transcriptContext || bm.note ? 14 : 0, flexWrap: 'wrap' }}>
          {bm.chapterTitle && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-brand)', background: 'rgba(46,106,167,0.1)', padding: '4px 10px', borderRadius: 20 }}>
              <BookOpen size={12} />{bm.chapterTitle}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', padding: '4px 10px', borderRadius: 20 }}>
            <Clock size={12} />{formatTime(bm.time)}
          </span>
        </div>

        {/* Transcript context */}
        {bm.transcriptContext && (
          <blockquote style={{
            margin: '0 0 14px',
            padding: '12px 16px',
            borderLeft: '3px solid var(--color-brand)',
            background: 'rgba(46,106,167,0.05)',
            borderRadius: '0 8px 8px 0',
            fontStyle: 'italic',
            color: 'var(--color-text-secondary)',
            fontSize: '0.9rem',
            lineHeight: 1.65,
          }}>
            <Quote size={14} style={{ color: 'var(--color-brand)', marginBottom: 6, display: 'block', opacity: 0.6 }} />
            {bm.transcriptContext.length > 280 ? bm.transcriptContext.slice(0, 280) + '...' : bm.transcriptContext}
          </blockquote>
        )}

        {/* User note */}
        {isEditing ? (
          <div style={{ marginBottom: 14 }}>
            <input 
              type="text" 
              className="search-input" 
              value={editNote} 
              onChange={e => setEditNote(e.target.value)} 
              style={{ width: '100%', marginBottom: 8, padding: '8px 12px', fontSize: '0.875rem' }} 
              placeholder="Add a note..."
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-primary" 
                onClick={() => { onUpdate({ note: editNote }); setIsEditing(false); }} 
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Save
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setIsEditing(false); setEditNote(bm.note || ''); }} 
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 14, fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ opacity: 0.5 }}>📝</span>
            <span style={{ flex: 1 }}>{bm.note || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No note attached</span>}</span>
            <button className="btn btn-icon" onClick={() => setIsEditing(true)} style={{ width: 28, height: 28, opacity: 0.7 }} title="Edit note">
              <Edit3 size={14} />
            </button>
          </div>
        )}

        {/* Date + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div className="text-xs text-muted">Saved {new Date(bm.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {bm.transcriptContext && (
              <button
                onClick={shareQuote}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8125rem' }}
                title="Share this quote"
              >
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                {copied ? 'Copied!' : 'Share Quote'}
              </button>
            )}
            <button
              onClick={onPlay}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.8125rem' }}
            >
              <Play size={13} /> Play Here
            </button>
            <button className="btn btn-icon" onClick={onDelete} title="Delete bookmark" style={{ width: 34, height: 34, color: 'var(--color-error)' }}>
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookmarksPage() {
  const bookmarks = useUserStore((s) => s.bookmarks);
  const removeBookmark = useUserStore((s) => s.removeBookmark);
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const loadBook = usePlayerStore((s) => s.loadBook);
  const { currentBook } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isLoaded) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;

  const getBook = (bookId: string) => useLibraryStore.getState().audiobooks.find(b => b.id === bookId);

  // Filter + search across notes, chapter titles, transcript contexts, book titles
  const filtered = bookmarks.filter(bm => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (bm.note || '').toLowerCase().includes(q) ||
      (bm.chapterTitle || '').toLowerCase().includes(q) ||
      (bm.transcriptContext || '').toLowerCase().includes(q) ||
      (bm.bookTitle || '').toLowerCase().includes(q) ||
      (bm.bookAuthor || '').toLowerCase().includes(q)
    );
  });

  // Group by bookId
  const groupedByBook = filtered.reduce((acc, bm) => {
    if (!acc[bm.bookId]) acc[bm.bookId] = [];
    acc[bm.bookId].push(bm);
    return acc;
  }, {} as Record<string, BookmarkType[]>);

  function handlePlay(bm: BookmarkType) {
    const book = getBook(bm.bookId);
    if (!book) return;
    const isCurrent = currentBook?.id === book.id;
    if (!isCurrent) {
      loadBook(book, bm.time);
    } else {
      const { getAudioElement } = require('@/lib/store/playerStore');
      getAudioElement().currentTime = bm.time;
    }
  }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Your Bookmarks</h1>
          <p className="text-secondary" style={{ marginTop: 6 }}>
            {bookmarks.length} saved moment{bookmarks.length !== 1 ? 's' : ''} across your audiobooks
          </p>
        </div>

        {/* Search */}
        {bookmarks.length > 0 && (
          <div className="search-input-wrap" style={{ width: 280 }}>
            <Search size={16} className="search-icon" />
            <input
              type="search"
              placeholder="Search notes, quotes, books..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
          <Bookmark size={52} style={{ margin: '0 auto 20px', opacity: 0.15 }} />
          <h3 style={{ marginBottom: 8, opacity: 0.7 }}>No bookmarks yet</h3>
          <p style={{ fontSize: '0.925rem' }}>Open an audiobook and save a moment while listening.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          <p>No bookmarks match "{searchQuery}"</p>
        </div>
      ) : (
        <div>
          {Object.entries(groupedByBook).map(([bookId, bms]) => {
            const book = getBook(bookId);
            const sorted = [...bms].sort((a, b) => a.time - b.time);
            return (
              <div key={bookId} style={{ marginBottom: 40 }}>
                {Object.keys(groupedByBook).length > 1 && book && (
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link href={`/audiobook/${book.slug}`} style={{ fontWeight: 700, fontSize: '1.05rem' }}>{book.title}</Link>
                    <span className="text-muted text-sm">· {sorted.length} bookmark{sorted.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sorted.map(bm => (
                    <BookmarkCard
                      key={bm.id}
                      bm={bm}
                      onDelete={() => removeBookmark(bm.id)}
                      onPlay={() => handlePlay(bm)}
                      onUpdate={(partial) => {
                        const { updateBookmark } = useUserStore.getState();
                        updateBookmark(bm.id, partial);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
