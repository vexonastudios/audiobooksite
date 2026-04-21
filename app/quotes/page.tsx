'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import {
  Quote, X, Search, Share2, Copy, Check, BookOpen, ExternalLink, Play,
  CheckSquare, Square, ChevronDown, ChevronRight, Settings, Image as ImageIcon,
  Globe, Heart, Bookmark, Loader2, Users, TrendingUp, Clock,
} from 'lucide-react';
import { generateQuoteImage } from '@/lib/generateQuoteImage';
import type { SavedQuote } from '@/lib/types';
import type { CommunityQuote } from '@/lib/db/quotes';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useLibraryStore } from '@/lib/store/libraryStore';

// ─── My Quote Card ─────────────────────────────────────────────────────────────
function QuoteCard({ q, onDelete }: { q: SavedQuote; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const [isRenderingImage, setIsRenderingImage] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
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
      const audio = document.querySelector('audio');
      if (audio) audio.currentTime = q.time;
    } else {
      loadBook(book, q.time);
    }
  }

  const handleExportImage = async () => {
    try {
      setIsRenderingImage(true);
      const dataUrls = await generateQuoteImage({
        quoteText: q.text,
        bookAuthor: q.bookAuthor,
        bookTitle: q.bookTitle,
        chapterTitle: q.chapterTitle,
        bookCoverUrl: q.bookCover || '',
      });
      dataUrls.forEach((dataUrl, i) => {
        const link = document.createElement('a');
        const suffix = dataUrls.length > 1 ? `-part${i + 1}` : '';
        link.download = `quote-${q.bookSlug}-${Math.floor(q.time)}${suffix}.png`;
        link.href = dataUrl;
        link.click();
      });
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsRenderingImage(false);
    }
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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

      <div style={{ padding: '20px 22px 16px' }}>
        <blockquote style={{ margin: 0, padding: '0 0 0 18px', borderLeft: '3px solid var(--color-brand)', fontSize: '1rem', lineHeight: 1.75, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>
          <Quote size={16} style={{ color: 'var(--color-brand)', marginBottom: 8, opacity: 0.5 }} />
          <span>{q.text}</span>
        </blockquote>
        <div style={{ marginTop: 14, fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          — {q.bookAuthor}{q.chapterTitle && `, ${q.chapterTitle}`}
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="text-xs text-muted" style={{ fontWeight: 500 }}>
            {new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          {showConfirmDelete ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Delete?</span>
              <button onClick={onDelete} className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--color-error)' }}>Yes</button>
              <button onClick={() => setShowConfirmDelete(false)} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>No</button>
            </div>
          ) : (
            <button onClick={() => setShowConfirmDelete(true)} className="btn btn-icon" style={{ width: 28, height: 28, color: 'var(--color-error)' }} title="Delete quote">
              <X size={16} />
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: 8 }}>
          <button onClick={handlePlay} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', fontSize: '0.8rem' }}>
            <Play size={14} /> Play
          </button>
          <button onClick={handleCopy} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', fontSize: '0.8rem' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleExportImage} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', fontSize: '0.8rem' }} disabled={isRenderingImage}>
            <ImageIcon size={14} /> {isRenderingImage ? '...' : 'Image'}
          </button>
          <button onClick={handleShare} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', fontSize: '0.8rem' }}>
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Community Card ─────────────────────────────────────────────────────────────
function CommunityCard({ q }: { q: CommunityQuote }) {
  const [copied, setCopied] = useState(false);
  const quotes = useUserStore(s => s.quotes);
  const saveQuote = useUserStore(s => s.saveQuote);
  const alreadySaved = quotes.some(local => local.id === q.id);

  function handleCopy() {
    const text = `"${q.text}" — ${q.bookAuthor}${q.chapterTitle ? `, ${q.chapterTitle}` : ''}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleShare() {
    const text = `"${q.text}" — ${q.bookAuthor} | Listen free at scrollreader.com/audiobook/${q.bookSlug}`;
    if (navigator.share) {
      navigator.share({ title: q.bookTitle, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
    }
  }

  function handleSave() {
    if (alreadySaved) return;
    saveQuote({
      text: q.text,
      bookId: q.bookId,
      bookTitle: q.bookTitle,
      bookSlug: q.bookSlug,
      bookAuthor: q.bookAuthor,
      bookCover: q.bookCover,
      chapterTitle: q.chapterTitle,
      time: q.time,
    });
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      {/* Book strip */}
      <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        {q.bookCover && <img src={q.bookCover} alt="" style={{ width: 32, height: 32, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.bookTitle}</div>
          <div className="text-xs text-muted">{q.bookAuthor}</div>
        </div>
        {/* Saves badge */}
        {q.savesCount > 1 && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            fontSize: '0.72rem', fontWeight: 700,
            color: q.savesCount >= 5 ? '#ef4444' : 'var(--color-text-muted)',
            background: q.savesCount >= 5 ? 'rgba(239,68,68,0.1)' : 'var(--color-surface)',
            border: `1px solid ${q.savesCount >= 5 ? 'rgba(239,68,68,0.25)' : 'var(--color-border)'}`,
            borderRadius: 20, padding: '2px 8px',
          }}>
            <Heart size={10} fill={q.savesCount >= 5 ? '#ef4444' : 'none'} />
            {q.savesCount}
          </span>
        )}
        <Link href={`/audiobook/${q.bookSlug}?t=${Math.floor(q.time)}`} title="Open book at this moment" style={{ color: 'var(--color-text-muted)', display: 'flex', flexShrink: 0 }}>
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px 14px' }}>
        <blockquote style={{ margin: 0, padding: '0 0 0 14px', borderLeft: '3px solid var(--color-brand)', fontSize: '0.93rem', lineHeight: 1.7, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>
          <Quote size={13} style={{ color: 'var(--color-brand)', marginBottom: 6, opacity: 0.4 }} />
          <span>{q.text}</span>
        </blockquote>
        {q.chapterTitle && (
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <BookOpen size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
            {q.chapterTitle}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
        <button onClick={handleCopy} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', fontSize: '0.78rem' }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={handleShare} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', fontSize: '0.78rem' }}>
          <Share2 size={13} /> Share
        </button>
        <button
          onClick={handleSave}
          className={alreadySaved ? 'btn btn-secondary' : 'btn btn-primary'}
          disabled={alreadySaved}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', fontSize: '0.78rem', opacity: alreadySaved ? 0.7 : 1 }}
        >
          {alreadySaved ? <Check size={13} /> : <Bookmark size={13} />}
          {alreadySaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type ActiveTab = 'mine' | 'community';
type SortBy = 'recent' | 'popular';

export default function QuotesPage() {
  const quotes = useUserStore(s => s.quotes);
  const removeQuote = useUserStore(s => s.removeQuote);
  const quoteSettings = useUserStore(s => s.quoteSettings);
  const updateQuoteSettings = useUserStore(s => s.updateQuoteSettings);

  const [activeTab, setActiveTab] = useState<ActiveTab>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const [showImageBanner, setShowImageBanner] = useState(false);

  useEffect(() => {
    // Show image generation feature banner to first-time users if they have quotes saved
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('saw_quote_image_banner')) {
      setShowImageBanner(true);
    }
  }, []);

  function closeImageBanner() {
    setShowImageBanner(false);
    if (typeof localStorage !== 'undefined') localStorage.setItem('saw_quote_image_banner', 'true');
  }

  // Community state
  const [communityQuotes, setCommunityQuotes] = useState<CommunityQuote[]>([]);
  const [communityTotal, setCommunityTotal] = useState(0);
  const [communityPage, setCommunityPage] = useState(1);
  const [communitySearch, setCommunitySearch] = useState('');
  const [communitySort, setCommunitySort] = useState<SortBy>('recent');
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCommunity = useCallback(async (page: number, search: string, sort: SortBy, append = false) => {
    setCommunityLoading(true);
    setCommunityError(false);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24', sort });
      if (search) params.set('search', search);
      const r = await fetch(`/api/quotes/community?${params}`);
      if (!r.ok) throw new Error('fetch failed');
      const data = await r.json();
      setCommunityQuotes(prev => append ? [...prev, ...data.quotes] : data.quotes);
      setCommunityTotal(data.total);
    } catch {
      setCommunityError(true);
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  // Load community in the background immediately on mount to populate the total badge
  useEffect(() => {
    if (communityQuotes.length === 0 && !communityLoading && !communityError) {
      loadCommunity(1, '', communitySort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCommunity]); // Run once on mount (communitySort is 'recent' initially)

  // Debounced search in community tab
  function handleCommunitySearch(val: string) {
    setCommunitySearch(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setCommunityPage(1);
      loadCommunity(1, val, communitySort, false);
    }, 400);
  }

  function handleSortChange(sort: SortBy) {
    setCommunitySort(sort);
    setCommunityPage(1);
    setCommunityQuotes([]);
    loadCommunity(1, communitySearch, sort, false);
  }

  function loadMoreCommunity() {
    const next = communityPage + 1;
    setCommunityPage(next);
    loadCommunity(next, communitySearch, communitySort, true);
  }

  // My Quotes filter
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

  const tabStyle = (tab: ActiveTab) => ({
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--color-brand)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--color-brand)' : 'var(--color-text-muted)',
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'color 0.15s, border-color 0.15s',
    flexShrink: 0,
  } as React.CSSProperties);

  const badgeStyle = (active: boolean) => ({
    background: active ? 'var(--color-brand)' : 'var(--color-surface-2)',
    color: active ? 'white' : 'var(--color-text-muted)',
    borderRadius: 20,
    padding: '1px 8px',
    fontSize: '0.7rem',
    fontWeight: 700,
  } as React.CSSProperties);

  return (
    <div className="page" style={{ maxWidth: 920 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1>Quotes</h1>
        <p className="text-secondary" style={{ marginTop: 6 }}>
          Save memorable passages from any audiobook. Share them with friends.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: 28,
        gap: 4,
      }}>
        <button style={tabStyle('mine')} onClick={() => setActiveTab('mine')}>
          <Bookmark size={15} />
          My Quotes
          {quotes.length > 0 && <span style={badgeStyle(activeTab === 'mine')}>{quotes.length}</span>}
        </button>
        <button style={tabStyle('community')} onClick={() => setActiveTab('community')}>
          <Users size={15} />
          Community
          {communityTotal > 0 && <span style={badgeStyle(activeTab === 'community')}>{communityTotal}</span>}
        </button>
      </div>

      {/* ── MY QUOTES TAB ── */}
      {activeTab === 'mine' && (
        <>
          {/* Search + settings */}
          {quotes.length > 0 && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
              <div className="search-input-wrap" style={{ flex: 1, minWidth: 220 }}>
                <Search size={16} className="search-icon" />
                <input
                  type="search"
                  placeholder="Search quotes, books, authors..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          )}

          {/* Copy format settings */}
          {quotes.length > 0 && (
            <div style={{ marginBottom: 28, background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <div
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: settingsExpanded ? 'var(--color-surface-2)' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  <Settings size={16} /> Copy Format Settings
                </div>
                {settingsExpanded ? <ChevronDown size={16} color="var(--color-text-muted)" /> : <ChevronRight size={16} color="var(--color-text-muted)" />}
              </div>
              {settingsExpanded && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                    <div onClick={() => updateQuoteSettings({ useQuotes: !quoteSettings.useQuotes })} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                      {quoteSettings.useQuotes ? <CheckSquare size={16} color="var(--color-brand)" /> : <Square size={16} color="var(--color-border)" />}
                      Show &quot;Quotes&quot;
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
                  <div style={{ padding: '14px 16px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Example output</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.6, fontFamily: 'monospace' }}>
                      {quoteSettings.useQuotes ? '"For God so loved the world…"' : 'For God so loved the world…'}
                      {quoteSettings.includeBook ? ' — Apostle John, The Bible (John Chapter 3)' : ' — Apostle John'}
                      {quoteSettings.includeLink && ' Listen at: https://scrollreader.com/audiobook/the-bible'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feature Banner: Image Generation */}
          {showImageBanner && quotes.length > 0 && (
            <div style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--color-brand)', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative' }}>
              <ImageIcon size={24} style={{ opacity: 0.9, marginTop: 2, flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700 }}>Export Beautiful Images</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.5 }}>
                  Did you know you can turn your favorites into stylized quote images to share on social media? Try tapping the <strong>Image</strong> button on any quote below!
                </p>
              </div>
              <button onClick={closeImageBanner} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'white', opacity: 0.7, cursor: 'pointer', padding: 4 }} title="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Quote cards or empty state */}
          {quotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0 40px', color: 'var(--color-text-muted)' }}>
              <Quote size={52} style={{ margin: '0 auto 20px', opacity: 0.12 }} />
              <h3 style={{ marginBottom: 8, opacity: 0.7 }}>No quotes saved yet</h3>
              <p style={{ fontSize: '0.925rem', marginBottom: 28 }}>
                Open any audiobook and hit <strong>Share Quote</strong> to select and save a passage.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  Browse Audiobooks
                </Link>
                <button className="btn btn-secondary" onClick={() => setActiveTab('community')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Globe size={15} /> See Community Quotes
                </button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              <p>No quotes match &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {filtered.map(q => (
                <QuoteCard key={q.id} q={q} onDelete={() => removeQuote(q.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── COMMUNITY TAB ── */}
      {activeTab === 'community' && (
        <>
          {/* Sort + Search bar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            {/* Sort toggle */}
            <div style={{ display: 'flex', borderRadius: 8, border: '1px solid var(--color-border)', overflow: 'hidden', flexShrink: 0 }}>
              <button
                onClick={() => handleSortChange('recent')}
                style={{
                  padding: '7px 14px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: communitySort === 'recent' ? 'var(--color-brand)' : 'var(--color-surface)',
                  color: communitySort === 'recent' ? 'white' : 'var(--color-text-muted)',
                }}
              >
                <Clock size={13} /> Newest
              </button>
              <button
                onClick={() => handleSortChange('popular')}
                style={{
                  padding: '7px 14px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  borderLeft: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: communitySort === 'popular' ? 'var(--color-brand)' : 'var(--color-surface)',
                  color: communitySort === 'popular' ? 'white' : 'var(--color-text-muted)',
                }}
              >
                <TrendingUp size={13} /> Highest Ranked
              </button>
            </div>
            {/* Search */}
            <div className="search-input-wrap" style={{ flex: 1, minWidth: 200 }}>
              <Search size={16} className="search-icon" />
              <input
                type="search"
                placeholder="Search quotes, books, authors..."
                value={communitySearch}
                onChange={e => handleCommunitySearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {communityError ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              <p>Could not load community quotes. Please try again.</p>
              <button className="btn btn-secondary" onClick={() => loadCommunity(1, communitySearch, communitySort)} style={{ marginTop: 12 }}>Retry</button>
            </div>
          ) : communityLoading && communityQuotes.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand)' }} />
            </div>
          ) : communityQuotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
              <Users size={52} style={{ margin: '0 auto 20px', opacity: 0.12 }} />
              <h3 style={{ marginBottom: 8, opacity: 0.7 }}>No community quotes yet</h3>
              <p style={{ fontSize: '0.925rem' }}>Be the first! Save a quote from any audiobook and it will appear here.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {communityQuotes.map(q => (
                  <CommunityCard key={q.id} q={q} />
                ))}
              </div>

              {/* Load more */}
              {communityQuotes.length < communityTotal && (
                <div style={{ textAlign: 'center', marginTop: 36 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={loadMoreCommunity}
                    disabled={communityLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 28px' }}
                  >
                    {communityLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    Load More ({communityTotal - communityQuotes.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
