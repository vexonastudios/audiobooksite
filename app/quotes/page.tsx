'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { Quote, X, Search, Share2, Copy, Check, BookOpen, ExternalLink, Play, CheckSquare, Square, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import type { SavedQuote } from '@/lib/types';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useLibraryStore } from '@/lib/store/libraryStore';

function QuoteCard({ q, onDelete }: { q: SavedQuote; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const loadBook = usePlayerStore(s => s.loadBook);
  const { currentBook } = usePlayerStore();
  const getBook = () => useLibraryStore.getState().audiobooks.find(b => b.id === q.bookId);

  const quoteSettings = useUserStore(s => s.quoteSettings);

  let formattedText = quoteSettings.useQuotes ? `"${q.text}"` : q.text;
  if (quoteSettings.includeBook) {
    formattedText += ` — ${q.bookAuthor}, ${q.bookTitle}${q.chapterTitle ? ` (${q.chapterTitle})` : ''}`;
  } else {
    formattedText += ` — ${q.bookAuthor}`;
  }
  if (quoteSettings.includeLink) {
    formattedText += ` Listen at: https://scrollreader.com/audiobook/${q.bookSlug}?t=${Math.floor(q.time)}`;
  }
  function handleCopy() {
    navigator.clipboard.writeText(formattedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: q.bookTitle, text: formattedText }).catch(() => {});
    } else {
      handleCopy();
    }
  }

  function handlePlay() {
    const book = getBook();
    if (!book) return;
    if (currentBook?.id === book.id) {
      const { getAudioElement } = require('@/lib/store/playerStore');
      getAudioElement().currentTime = q.time;
    } else {
      loadBook(book, q.time);
    }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Book strip */}
      <div style={{ padding: '10px 16px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        {q.bookCover && <img src={q.bookCover} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link href={`/audiobook/${q.bookSlug}`} style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }} className="truncate">{q.bookTitle}</Link>
          <div className="text-xs text-muted">{q.bookAuthor}</div>
        </div>
        {q.chapterTitle && (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-brand)', background: 'rgba(46,106,167,0.1)', padding: '2px 10px', borderRadius: 20, fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <BookOpen size={11} />{q.chapterTitle}
          </span>
        )}
      </div>

      {/* Quote body */}
      <div style={{ padding: '20px 22px 16px' }}>
        <blockquote style={{
          margin: 0,
          padding: '0 0 0 18px',
          borderLeft: '3px solid var(--color-brand)',
          fontSize: '1rem',
          lineHeight: 1.75,
          fontStyle: 'italic',
          color: 'var(--color-text-primary)',
        }}>
          <Quote size={16} style={{ color: 'var(--color-brand)', marginBottom: 8, opacity: 0.5 }} />
          <span>{q.text}</span>
        </blockquote>

        <div style={{ marginTop: 14, fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          — {q.bookAuthor}{q.chapterTitle && `, ${q.chapterTitle}`}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div className="text-xs text-muted" style={{ flex: 1 }}>
          {new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <button onClick={handlePlay} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: '0.8rem' }}>
          <Play size={12} /> Play
        </button>
        <button onClick={handleCopy} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: '0.8rem' }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={handleShare} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: '0.8rem' }}>
          <Share2 size={12} /> Share
        </button>
        <button onClick={onDelete} className="btn btn-icon" style={{ width: 30, height: 30, color: 'var(--color-error)' }} title="Delete quote">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  const quotes = useUserStore(s => s.quotes);
  const removeQuote = useUserStore(s => s.removeQuote);
  const quoteSettings = useUserStore(s => s.quoteSettings);
  const updateQuoteSettings = useUserStore(s => s.updateQuoteSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const filtered = quotes.filter(q => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.text.toLowerCase().includes(query) ||
      q.bookTitle.toLowerCase().includes(query) ||
      q.bookAuthor.toLowerCase().includes(query) ||
      (q.chapterTitle || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Your Saved Quotes</h1>
          <p className="text-secondary" style={{ marginTop: 6 }}>
            {quotes.length} quote{quotes.length !== 1 ? 's' : ''} saved · share them with friends
          </p>
        </div>

        {quotes.length > 0 && (
          <div className="search-input-wrap" style={{ width: 280 }}>
            <Search size={16} className="search-icon" />
            <input
              type="search"
              placeholder="Search quotes, books, authors..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        )}
      </div>

      {/* Settings Row */}
      {quotes.length > 0 && (
        <div style={{ marginBottom: 32, background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          {/* Header Toggle */}
          <div 
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: settingsExpanded ? 'var(--color-surface-2)' : 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              <Settings size={16} /> Copy Format Settings
            </div>
            {settingsExpanded ? <ChevronDown size={16} color="var(--color-text-muted)" /> : <ChevronRight size={16} color="var(--color-text-muted)" />}
          </div>

          {/* Expanded Content */}
          {settingsExpanded && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                <div onClick={() => updateQuoteSettings({ useQuotes: !quoteSettings.useQuotes })} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                  {quoteSettings.useQuotes ? <CheckSquare size={16} color="var(--color-brand)" /> : <Square size={16} color="var(--color-border)" />}
                  Show "Quotes"
                </div>
                <div onClick={() => updateQuoteSettings({ includeBook: !quoteSettings.includeBook })} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                  {quoteSettings.includeBook ? <CheckSquare size={16} color="var(--color-brand)" /> : <Square size={16} color="var(--color-border)" />}
                  Include Book Title
                </div>
                <div onClick={() => updateQuoteSettings({ includeLink: !quoteSettings.includeLink })} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                  {quoteSettings.includeLink ? <CheckSquare size={16} color="var(--color-brand)" /> : <Square size={16} color="var(--color-border)" />}
                  Include Link
                </div>
              </div>

              {/* Real-time Preview */}
              <div style={{ padding: '14px 16px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Example output</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.6, fontFamily: 'monospace' }}>
                  {quoteSettings.useQuotes ? '"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."' : 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'}
                  {quoteSettings.includeBook ? ' — Apostle John, The Bible (John Chapter 3)' : ' — Apostle John'}
                  {quoteSettings.includeLink && ' Listen at: https://scrollreader.com/audiobook/the-bible'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {quotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
          <Quote size={52} style={{ margin: '0 auto 20px', opacity: 0.12 }} />
          <h3 style={{ marginBottom: 8, opacity: 0.7 }}>No quotes saved yet</h3>
          <p style={{ fontSize: '0.925rem', marginBottom: 24 }}>
            Open any audiobook and hit <strong>Share Quote</strong> to select and save a passage.
          </p>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Browse Audiobooks
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          <p>No quotes match "{searchQuery}"</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map(q => (
            <QuoteCard key={q.id} q={q} onDelete={() => removeQuote(q.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
