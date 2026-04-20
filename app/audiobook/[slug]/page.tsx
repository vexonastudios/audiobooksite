'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useUserStore } from '@/lib/store/userStore';
import { Play, Pause, SkipBack, SkipForward, Headphones, Share2, BookmarkPlus, Clock, List, AlertCircle, BookOpen, X, Quote, Moon, Heart, ExternalLink, RotateCcw, RotateCw, Youtube, Book } from 'lucide-react';
import { BookCard } from '@/components/ui/BookCard';
import { ReadAlongPanel } from '@/components/ui/ReadAlongPanel';
import { QuoteModal } from '@/components/ui/QuoteModal';
import { HeartButton } from '@/components/ui/HeartButton';
import { parseVTT, getContextText } from '@/lib/parseVTT';
import type { TranscriptCue } from '@/lib/parseVTT';
import authorsData from '@/public/data/authors.json';

function formatTime(s: number) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function AudiobookPage() {
  const { slug } = useParams();
  const book = useLibraryStore((s) => s.getBySlug(slug as string));
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  
  // Stores
  const { currentBook, isPlaying, currentTime, duration, playbackSpeed, 
          sleepTimerMode, sleepTimerEndsAt, setSleepTimer, clearSleepTimer,
          loadBook, setPlaying, setPlaybackSpeed, skipForward, skipBackward, jumpToChapter } = usePlayerStore();
  const { history, addBookmark, getBookmarksByBook, removeBookmark, skipInterval, isFavorited, toggleFavorite, playerQuickActions } = useUserStore();

  const searchParams = useSearchParams();

  // Local state
  const [activeTab, setActiveTab] = useState<'chapters' | 'bookmarks' | 'share' | 'timer'>('chapters');
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [readAlongOpen, setReadAlongOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [loadedCues, setLoadedCues] = useState<TranscriptCue[]>([]);
  const [transcriptStatus, setTranscriptStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');
  const [timerTick, setTimerTick] = useState(0);
  // Timestamp from shared link (?t=)
  const [timedStart, setTimedStart] = useState<number | null>(null);

  // Parse ?t= param from URL on load
  useEffect(() => {
    const t = searchParams?.get('t');
    if (t) {
      const secs = parseInt(t, 10);
      if (!isNaN(secs) && secs > 0) setTimedStart(secs);
    }
  }, [searchParams]);

  // Tick for Sleep Timer Countdown UI
  useEffect(() => {
    if (sleepTimerMode !== 'minutes') return;
    const interval = setInterval(() => setTimerTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [sleepTimerMode]);

  // Load VTT cues for bookmark context (preloaded when panel first opens or book plays)
  useEffect(() => {
    if (!book) return;
    setTranscriptStatus('loading');
    const url = book.vttUrl || `/transcripts/${book.slug}.vtt`;
    fetch(url)
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(text => {
        setLoadedCues(parseVTT(text));
        setTranscriptStatus('available');
      })
      .catch(() => setTranscriptStatus('unavailable'));
  }, [book?.slug]);

  const isCurrent = currentBook?.id === book?.id;
  
  // Computed values for standby display
  const historyEntry = history.find(h => h.bookId === book?.id);
  const standbyTime = historyEntry ? historyEntry.position : 0;
  
  let standbyChapterIdx = 0;
  if (book) {
    for (let i = 0; i < book.chapters.length; i++) {
      if (book.chapters[i].startTime <= standbyTime) {
        standbyChapterIdx = i;
      } else {
        break;
      }
    }
  }

  const displayTime = isCurrent ? currentTime : standbyTime;
  
  const displayProgress = isCurrent && duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Find matching author mapped from authors.json
  const authorRecord = book ? authorsData.find(a => a.name === book.authorName) : null;
  
  // Find active chapter index for display
  const activeChapterIndex = usePlayerStore(s => s.activeChapterIndex);
  const currentChapterIdx = isCurrent ? activeChapterIndex : standbyChapterIdx;
  const bookmarks = book ? getBookmarksByBook(book.id) : [];

  if (!isLoaded) {
    return (
      <div className="page" style={{ display: 'flex', gap: 32, padding: '40px 24px' }}>
        <div className="skeleton" style={{ width: 320, height: 320, borderRadius: 'var(--radius-xl)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
           <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 'var(--radius-xl)' }} />
           <div className="skeleton" style={{ width: '100%', height: 400, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '100px 0' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--color-warning)' }} />
        <h2>Audiobook not found</h2>
        <p className="text-secondary" style={{ marginTop: 8, marginBottom: 24 }}>The book you are looking for does not exist or was removed.</p>
        <Link href="/" className="btn btn-primary">Return Home</Link>
      </div>
    );
  }

  // Related books (same first category)
  const related = useLibraryStore.getState().getByCategory(book.categories[0] || '')
    .filter(b => b.id !== book.id).slice(0, 8);

  const handlePlayPause = () => {
    if (isCurrent) {
      setPlaying(!isPlaying);
    } else if (timedStart !== null) {
      loadBook(book, timedStart);
      setTimedStart(null);
    } else {
      const hist = history.find(h => h.bookId === book.id);
      loadBook(book, hist?.position || 0);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrent) return;
    const { getAudioElement } = require('@/lib/store/playerStore');
    const audio = getAudioElement();
    const time = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = time;
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrent || !book) return;
    const chapterTitle = book.chapters[currentChapterIdx]?.title;
    const transcriptContext = loadedCues.length > 0
      ? getContextText(loadedCues, currentTime, 5, 20)
      : undefined;
    addBookmark(book.id, currentTime, {
      note: bookmarkNote.trim(),
      chapterTitle,
      transcriptContext,
      bookTitle: book.title,
      bookSlug: book.slug,
      bookCover: book.coverImage,
      bookAuthor: book.authorName,
    });
    setBookmarkNote('');
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    if (isCurrent) {
      url.searchParams.set('t', Math.floor(currentTime).toString());
    }
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const SpotifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.241 1.2zM20.04 9.42C15.6 6.78 9.06 6.6 5.28 7.74c-.6.18-1.2-.18-1.38-.78-.18-.6.18-1.2.78-1.38 4.38-1.32 11.52-1.14 16.56 1.86.54.3.72 1.02.42 1.56-.3.48-1.02.72-1.62.42z"/>
    </svg>
  );

  const renderExternalLinks = (className?: string) => {
    if (!book.youtubeLink && !book.spotifyLink && !book.buyLink) return null;
    
    if (className === 'desktop-only') {
      return (
        <div className={`external-links-container ${className}`} style={{ marginTop: 8 }}>
          <h4 style={{ marginBottom: 12, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-tertiary)', paddingLeft: 4 }}>Available On</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {book.youtubeLink && (
              <a href={book.youtubeLink} target="_blank" rel="noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'var(--color-surface)', borderRadius: 14, color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                <Youtube size={20} color="#ef4444" />
                <span style={{ flex: 1 }}>YouTube</span>
                <ExternalLink size={16} opacity={0.3} color="currentColor" />
              </a>
            )}
            {book.spotifyLink && (
              <a href={book.spotifyLink} target="_blank" rel="noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'var(--color-surface)', borderRadius: 14, color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.color = '#22c55e'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                <SpotifyIcon width={20} height={20} color="#22c55e" />
                <span style={{ flex: 1 }}>Spotify</span>
                <ExternalLink size={16} opacity={0.3} color="currentColor" />
              </a>
            )}
            {book.buyLink && (
              <a href={book.buyLink} target="_blank" rel="noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'var(--color-surface)', borderRadius: 14, color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.color = 'var(--color-brand)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                <Book size={18} color="var(--color-brand)" />
                <span style={{ flex: 1 }}>Buy Physical Book</span>
                <ExternalLink size={16} opacity={0.3} color="currentColor" />
              </a>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`external-links-container ${className || ''}`} style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-tertiary)', minWidth: 'min-content', textAlign: 'right' }}>
            Also<br/>On
          </h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {book.youtubeLink && (
              <a href={book.youtubeLink} target="_blank" rel="noreferrer" title="Watch on YouTube"
                  style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', borderRadius: '50%', color: 'var(--color-text-secondary)', transition: 'all 0.2s', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--color-surface)'; }}>
                <Youtube size={22} />
              </a>
            )}
            {book.spotifyLink && (
              <a href={book.spotifyLink} target="_blank" rel="noreferrer" title="Listen on Spotify"
                  style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', borderRadius: '50%', color: 'var(--color-text-secondary)', transition: 'all 0.2s', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#22c55e'; e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--color-surface)'; }}>
                <SpotifyIcon width={22} height={22} />
              </a>
            )}
            {book.buyLink && (
              <a href={book.buyLink} target="_blank" rel="noreferrer" title="Buy Physical Book"
                  style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', borderRadius: '50%', color: 'var(--color-text-secondary)', transition: 'all 0.2s', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-brand)'; e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = 'rgba(46,106,167,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--color-surface)'; }}>
                <Book size={20} style={{ marginLeft: 1 }} />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Set background color globally based on book
  const bgStyle = book.generatedColors 
    ? { 
        background: book.generatedColors, 
        opacity: 0.25, 
        position: 'absolute' as const, 
        left: 0,
        right: 0,
        top: 0,
        height: '600px',
        zIndex: -1,
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
      } 
    : {};

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {bgStyle.background && <div style={bgStyle} />}
      
      <div className="page pb-24">
        
        {/* Layout: Cover Left | Info & Player Right */}
        <div className="audiobook-layout">
          
          {/* Left Column: Cover */}
          <div className="audiobook-cover-col" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             {/* Cover with author overlay on mobile */}
             <div style={{ position: 'relative' }}>
               <picture>
                 <source media="(max-width: 768px)" srcSet={book.thumbnailUrl || book.coverImage || '/placeholder.png'} />
                 <img
                   src={book.coverImage || '/placeholder.png'}
                   alt={book.title}
                   className="audiobook-cover-img"
                   style={{ objectFit: 'cover', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', display: 'block', width: '100%' }}
                 />
               </picture>
               {/* Author overlay — mobile only, sits on bottom of cover */}
               <div className="mobile-only" style={{
                 position: 'absolute', bottom: 0, left: 0, right: 0,
                 background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)',
                 borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)',
                 padding: '32px 14px 12px',
                 display: 'flex', alignItems: 'center', gap: 8,
               }}>
                 {authorRecord?.image && (
                   <img src={authorRecord.image} alt={book.authorName}
                     style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.5)' }} />
                 )}
                 <div>
                   <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.95)', fontWeight: 600, margin: 0 }}>
                     <Link href={`/authors/${encodeURIComponent(book.authorName)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                       {book.authorName}
                     </Link>
                   </p>
                   {authorRecord?.dates && (
                     <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', margin: 0, marginTop: 1 }}>{authorRecord.dates}</p>
                   )}
                 </div>
               </div>
             </div>
             <div className="audiobook-stats" style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '8px 0' }}>
               <div style={{ textAlign: 'center' }}>
                 <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{(book.plays / 1000).toFixed(1)}k</div>
                 <div className="text-muted text-xs">Total Plays</div>
               </div>
               <div style={{ textAlign: 'center' }}>
                 <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{book.length.split(' ')[0]}</div>
                 <div className="text-muted text-xs">Hours</div>
               </div>
             </div>

             {renderExternalLinks('desktop-only')}
          </div>

          {/* Right Column: Stacked Cards */}
          <div className="audiobook-right-col" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
            
              {/* Desktop: Title & Author row */}
              <h1 className="desktop-only" style={{ fontSize: '2.4rem', fontWeight: 700, margin: '8px 0 6px 0', lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
                {book.title}
              </h1>
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                {authorRecord?.image && (
                  <img src={authorRecord.image} alt={book.authorName}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
                  />
                )}
                <div>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>By</span>
                    <Link href={`/authors/${encodeURIComponent(book.authorName)}`} style={{ fontSize: '1.1rem', color: 'var(--color-brand)', fontWeight: 600, textDecoration: 'none' }}>
                      {book.authorName}
                    </Link>
                  </p>
                  {authorRecord?.dates && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>{authorRecord.dates}</p>
                  )}
                </div>
              </div>

            {/* CARD 1: Player Controls */}
            <div className="card player-card-mobile" style={{ padding: '24px' }}>

              {/* Timestamped-link banner */}
              {!isCurrent && timedStart !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--color-brand)', color: 'white',
                  borderRadius: 'var(--radius-md)', padding: '10px 16px',
                  marginBottom: 16, gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Shared link starts at {formatTime(timedStart)}</span>
                  </div>
                  <button
                    onClick={() => setTimedStart(null)}
                    style={{ background: 'none', border: 'none', color: 'white', opacity: 0.7, cursor: 'pointer', padding: 0, lineHeight: 1 }}
                    aria-label="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {book.chapters[currentChapterIdx] ? (
                <div style={{ textAlign: 'center', marginBottom: 16, fontWeight: 600, fontSize: '1.25rem' }}>
                  {book.chapters[currentChapterIdx].title}
                </div>
              ) : null}

              {/* Scrubber Area */}
              {(() => {
                let currentMax = 100;
                const displayChapter = book.chapters[currentChapterIdx];
                if (displayChapter) {
                   if (book.chapters[currentChapterIdx+1]) {
                      currentMax = book.chapters[currentChapterIdx+1].startTime - displayChapter.startTime;
                   } else if (duration > 0 || displayChapter.duration) {
                      currentMax = isCurrent ? duration - displayChapter.startTime : (displayChapter.duration || 100);
                   }
                }
                const cMax = currentMax;
                const cVal = displayChapter ? Math.min(Math.max(0, displayTime - displayChapter.startTime), cMax) : 0;
                const pPct = cMax > 0 ? (cVal / cMax) * 100 : 0;
                
                return (
                  <div className="scrubber-row" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <input
                      type="range"
                      min={0}
                      max={cMax}
                      step={0.1}
                      value={cVal}
                      onChange={(e) => {
                        if (!isCurrent) return;
                        const { getAudioElement } = require('@/lib/store/playerStore');
                        getAudioElement().currentTime = book.chapters[currentChapterIdx].startTime + parseFloat(e.target.value);
                      }}
                      disabled={!isCurrent || duration === 0}
                      className="scrubber"
                      style={{ 
                        flex: 1, 
                        background: `linear-gradient(to right, var(--color-brand) ${pPct}%, var(--color-surface-2) ${pPct}%)`,
                        height: 6
                      }}
                    />
                    
                    {/* Speed dropdown text (Desktop only, mobile moves it below) */}
                    <div className="desktop-only" style={{ position: 'relative' }}>
                      <select 
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        style={{ 
                          padding: '6px 16px', 
                          fontSize: '0.875rem',
                          fontWeight: 700, 
                          borderRadius: 20, 
                          backgroundColor: 'var(--color-brand-dark)', 
                          color: 'white', 
                          border: 'none', 
                          appearance: 'none', 
                          MozAppearance: 'none', 
                          WebkitAppearance: 'none', 
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <option value="0.75">0.75x</option>
                        <option value="1">1x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                      </select>
                    </div>
                  </div>
                );
              })()}

              {/* Time displays */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 24, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                <div style={{ width: 80, textAlign: 'left', color: 'var(--color-text-primary)' }}>
                  {book.chapters[currentChapterIdx] ? formatTime(displayTime - book.chapters[currentChapterIdx].startTime) : '0:00'}
                </div>
                <div style={{ flex: 1, textAlign: 'center', color: 'var(--color-brand)', fontWeight: 600 }}>
                  {!isCurrent ? (standbyTime > 0 ? 'Resume' : '') : (duration > 0 ? formatTime(duration - currentTime) + ' left' : '')}
                </div>
                <div style={{ width: 80, textAlign: 'right', color: 'var(--color-text-primary)' }}>
                  {book.chapters[currentChapterIdx] && book.chapters[currentChapterIdx+1] ? 
                    `-${formatTime(book.chapters[currentChapterIdx+1].startTime - displayTime)}` : 
                    book.chapters[currentChapterIdx] && (duration > 0 || book.chapters[currentChapterIdx].duration) ? 
                    `-${formatTime((isCurrent ? duration : (book.chapters[currentChapterIdx].startTime + (book.chapters[currentChapterIdx].duration||0))) - displayTime)}` : '0:00'}
                </div>
              </div>

              {/* Playback Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '16px 0' }}>
                {/* 48px invisible spacer to mathematically balance the 48px Speed button on the right, keeping Play button dead center */}
                <div style={{ width: 48, flexShrink: 0 }} />
                <button 
                  className="btn-icon" 
                  style={{ width: 44, height: 44, background: 'transparent', border: 'none', opacity: !isCurrent || currentChapterIdx === 0 ? 0.3 : 1, pointerEvents: !isCurrent || currentChapterIdx === 0 ? 'none' : 'auto' }}
                  onClick={() => jumpToChapter(currentChapterIdx - 1)}
                  title="Previous chapter"
                >
                  <SkipBack size={24} fill="currentColor" />
                </button>
                <button className="btn-skip" style={{ width: 48, height: 48, background: 'transparent', border: 'none' }} onClick={skipBackward} disabled={!isCurrent} title={`Back ${skipInterval}s`}>
                  <RotateCcw size={32} strokeWidth={2} />
                  <span className="skip-label">{skipInterval}</span>
                </button>
                <button className="btn-play-large" onClick={handlePlayPause} style={{ flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, background: 'var(--color-brand)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(var(--color-brand-rgb, 0,0,0), 0.3)' }}>
                  {isCurrent && isPlaying
                    ? <Pause size={32} strokeWidth={2.5} fill="currentColor" color="currentColor" />
                    : <Play size={32} strokeWidth={2.5} style={{ marginLeft: 4 }} fill="currentColor" color="currentColor" />
                  }
                </button>
                <button className="btn-skip" style={{ width: 48, height: 48, background: 'transparent', border: 'none' }} onClick={skipForward} disabled={!isCurrent} title={`Forward ${skipInterval}s`}>
                  <RotateCw size={32} strokeWidth={2} />
                  <span className="skip-label">{skipInterval}</span>
                </button>
                <button 
                  className="btn btn-icon" 
                  style={{ width: 44, height: 44, background: 'transparent', border: 'none', opacity: !isCurrent || currentChapterIdx === book.chapters.length - 1 ? 0.3 : 1, pointerEvents: !isCurrent || currentChapterIdx === book.chapters.length - 1 ? 'none' : 'auto' }}
                  onClick={() => jumpToChapter(currentChapterIdx + 1)}
                  title="Next chapter"
                >
                  <SkipForward size={24} fill="currentColor" />
                </button>
                <button 
                  className="btn btn-icon" 
                  onClick={() => { const nextSpeed = playbackSpeed >= 2 ? 0.75 : playbackSpeed + 0.25; setPlaybackSpeed(nextSpeed); }} 
                  style={{ width: 48, height: 44, background: 'transparent', border: 'none', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}
                  title="Playback speed"
                >
                  {playbackSpeed}x
                </button>
              </div>

              {/* Mobile-Only Bottom Options Row — dynamically ordered from user preferences */}
              {(() => {
                // Settings flex: 1 ensures equal columns. align-content handles text wrapping gracefully.
                const btnStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 4, color: 'var(--color-text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'center' };
                const actionMap: Record<string, React.ReactNode> = {
                  chapters: (
                    <button key="chapters" onClick={() => { setActiveTab('chapters'); setMobileTabOpen(true); }} style={btnStyle}>
                      <List size={22} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Chapters</span>
                    </button>
                  ),
                  bookmark: (
                    <button key="bookmark" onClick={(e) => { e.preventDefault(); setActiveTab('bookmarks'); setMobileTabOpen(true); }} style={btnStyle}>
                      <BookmarkPlus size={22} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Bookmark</span>
                    </button>
                  ),
                  favorite: (
                    <button key="favorite" onClick={(e) => { e.preventDefault(); if (!book) return; toggleFavorite({ type: 'audiobook', itemId: book.id, itemSlug: book.slug, title: book.title, author: book.authorName, cover: book.coverImage, thumbnail: book.thumbnailUrl }); }} style={btnStyle}>
                      <Heart size={22} fill={book && isFavorited(book.id) ? 'var(--color-error)' : 'none'} color={book && isFavorited(book.id) ? 'var(--color-error)' : 'currentColor'} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Favorite</span>
                    </button>
                  ),
                  quote: (
                    <button key="quote" onClick={() => { setQuoteModalOpen(true); if (isPlaying) setPlaying(false); }} style={{ ...btnStyle, opacity: transcriptStatus === 'unavailable' ? 0.3 : transcriptStatus === 'loading' ? 0.5 : 1 }} disabled={transcriptStatus !== 'available'}>
                      <Quote size={22} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Quote</span>
                    </button>
                  ),
                  share: (
                    <button key="share" onClick={() => { setActiveTab('share'); setMobileTabOpen(true); }} style={btnStyle}>
                      <Share2 size={22} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Share</span>
                    </button>
                  ),
                  timer: (
                    <button key="timer" onClick={() => { setActiveTab('timer'); setMobileTabOpen(true); }} style={btnStyle}>
                      <Moon size={22} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Timer</span>
                    </button>
                  ),
                  readalong: (
                    <button key="readalong" onClick={() => setReadAlongOpen(true)} style={{ ...btnStyle, opacity: transcriptStatus === 'unavailable' ? 0.3 : transcriptStatus === 'loading' ? 0.5 : 1 }} disabled={transcriptStatus !== 'available'}>
                      <BookOpen size={22} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Read Along</span>
                    </button>
                  ),
                };
                return (
                  <div className="mobile-player-options mobile-only" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 24, padding: '12px 2px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)' }}>
                    {playerQuickActions.map(id => actionMap[id] ?? null)}
                  </div>
                );
              })()}

              {renderExternalLinks('mobile-only')}
            </div>

            {/* CARD 2: Tabs (Chapters, Bookmarks, etc) */}
            <div className={`card tabs-card-desktop ${mobileTabOpen ? 'mobile-modal-active' : ''}`} style={{ padding: '16px 24px 24px', flex: 1 }}>
              
              {/* Mobile-Only Modal Header */}
              {mobileTabOpen && (
                <div className="mobile-only" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 8 }}>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, textTransform: 'capitalize' }}>{activeTab}</h2>
                  <button className="btn btn-icon" onClick={() => setMobileTabOpen(false)} style={{ background: 'var(--color-surface-2)', borderRadius: '50%', width: 36, height: 36 }}>
                    <X size={20} />
                  </button>
                </div>
              )}

              <div className="tabs">
                <button className={`tab ${activeTab === 'chapters' ? 'active' : ''}`} onClick={() => setActiveTab('chapters')}>
                  <List size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Chapters
                </button>
                <button className={`tab ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')}>
                  <BookmarkPlus size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Bookmarks
                </button>
                <button className={`tab ${activeTab === 'share' ? 'active' : ''}`} onClick={() => setActiveTab('share')}>
                  <Share2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Share
                </button>
                <button className={`tab ${activeTab === 'timer' ? 'active' : ''}`} onClick={() => setActiveTab('timer')}>
                  <Moon size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Timer
                </button>

                {/* Desktop-only: Inject quick actions into the tabs row */}
                {transcriptStatus !== 'unavailable' && (
                  <button className="tab desktop-only" onClick={() => setReadAlongOpen(true)} disabled={transcriptStatus === 'loading'} style={{ opacity: transcriptStatus === 'loading' ? 0.5 : 1 }}>
                    <BookOpen size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Read Along
                    {loadedCues.length > 0 && <span style={{ background: 'var(--color-brand)', color: 'white', borderRadius: 20, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700, marginLeft: 6, verticalAlign: '1px' }}>Sync</span>}
                  </button>
                )}
                {transcriptStatus !== 'unavailable' && (
                  <button className="tab desktop-only" onClick={() => { setQuoteModalOpen(true); if (isPlaying) setPlaying(false); }} disabled={transcriptStatus === 'loading'} style={{ opacity: transcriptStatus === 'loading' ? 0.5 : 1 }}>
                    <Quote size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Quote
                  </button>
                )}
                <button 
                  className="tab desktop-only" 
                  onClick={(e) => { e.preventDefault(); if (!book) return; toggleFavorite({ type: 'audiobook', itemId: book.id, itemSlug: book.slug, title: book.title, author: book.authorName, cover: book.coverImage, thumbnail: book.thumbnailUrl }); }}
                  style={{ color: book && isFavorited(book.id) ? 'var(--color-error)' : 'inherit' }}
                >
                  <Heart size={16} fill={book && isFavorited(book.id) ? 'currentColor' : 'none'} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Favorite
                </button>
              </div>

              <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                {/* CHAPTERS TAB */}
                {activeTab === 'chapters' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {book.chapters.map((ch, idx) => {
                      const isActive = isCurrent && currentChapterIdx === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (!isCurrent) loadBook(book, ch.startTime);
                            else jumpToChapter(idx);
                            setMobileTabOpen(false);
                          }}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', borderRadius: 'var(--radius-md)',
                            background: isActive ? 'var(--color-surface-2)' : (!isCurrent && currentChapterIdx === idx ? 'rgba(0,0,0,0.03)' : 'transparent'),
                            textAlign: 'left', transition: 'background var(--transition-fast)'
                          }}
                          onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--color-border)')}
                          onMouseLeave={e => !isActive && (e.currentTarget.style.background = !isCurrent && currentChapterIdx === idx ? 'rgba(0,0,0,0.03)' : 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {isActive ? <Headphones size={18} color="var(--color-brand)" /> : <span className="text-muted" style={{ width: 18, fontSize: '0.875rem' }}>{idx+1}</span>}
                            <span style={{ fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--color-brand)' : 'inherit' }}>{ch.title}</span>
                          </div>
                          <div className="text-muted text-sm">{formatTime(ch.startTime)}</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* BOOKMARKS TAB */}
                {activeTab === 'bookmarks' && (
                  <div>
                    {isCurrent ? (
                      <form onSubmit={handleAddBookmark} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        <input 
                          type="text" 
                          placeholder={`Add a note at ${formatTime(currentTime)}...`}
                          value={bookmarkNote}
                          onChange={e => setBookmarkNote(e.target.value)}
                          className="search-input"
                          style={{ flex: 1, paddingLeft: 16 }}
                        />
                        <button type="submit" className="btn btn-primary">Save</button>
                      </form>
                    ) : (
                      <div className="text-muted text-sm" style={{ marginBottom: 20, fontStyle: 'italic' }}>
                        Start playing this book to add new bookmarks.
                      </div>
                    )}

                    {bookmarks.length === 0 ? (
                      <div className="text-muted text-center" style={{ padding: '32px 0' }}>No bookmarks saved for this book.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {bookmarks.sort((a,b) => a.time - b.time).map(bm => (
                          <div key={bm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                            <div>
                               <div style={{ fontWeight: 600, color: 'var(--color-brand)', marginBottom: 4, cursor: 'pointer' }}
                                    onClick={() => { 
                                      if(!isCurrent) loadBook(book, bm.time); 
                                      else { const {getAudioElement} = require('@/lib/store/playerStore'); getAudioElement().currentTime = bm.time; } 
                                      setMobileTabOpen(false);
                                    }}>
                                 {formatTime(bm.time)}
                               </div>
                               <div className="text-secondary">{bm.note || bm.chapterTitle || 'Saved Bookmark'}</div>
                               <div className="text-xs text-muted" style={{ marginTop: 8 }}>Added {new Date(bm.createdAt).toLocaleDateString()}</div>
                            </div>
                            <button className="btn btn-icon text-error" onClick={() => removeBookmark(bm.id)}>
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SHARE TAB */}
                {activeTab === 'share' && (() => {
                  const shareUrl = isCurrent
                    ? `https://scrollreader.com/audiobook/${book.slug}?t=${Math.floor(currentTime)}`
                    : `https://scrollreader.com/audiobook/${book.slug}`;
                  const shareText = `Listening to "${book.title}" by ${book.authorName} on ScrollReader`;

                  const socials: { label: string; color: string; href: string; icon: React.ReactNode }[] = [
                    {
                      label: 'WhatsApp',
                      color: '#25D366',
                      href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
                    },
                    {
                      label: 'Facebook',
                      color: '#1877F2',
                      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
                    },
                    {
                      label: 'Twitter / X',
                      color: '#000000',
                      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
                    },
                    {
                      label: 'Telegram',
                      color: '#26A5E4',
                      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
                    },
                    {
                      label: 'Reddit',
                      color: '#FF4500',
                      href: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>,
                    },
                    {
                      label: 'Email',
                      color: '#6B7280',
                      href: `mailto:?subject=${encodeURIComponent('Check out this audiobook')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
                    },
                    ...(book.spotifyLink ? [{
                      label: 'Listen on Spotify',
                      color: '#1DB954',
                      href: book.spotifyLink,
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>,
                    }] : []),
                  ];

                  return (
                    <div style={{ padding: '8px 0' }}>
                      <h3 style={{ marginBottom: 6 }}>Share this audiobook</h3>
                      <p className="text-secondary text-sm" style={{ marginBottom: 20 }}>
                        {isCurrent ? `Shares a timestamped link starting at ${formatTime(currentTime)}.` : 'Share a link to this audiobook with friends.'}
                      </p>

                      {/* Copy Link Row */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                        <input
                          readOnly
                          value={shareUrl}
                          className="search-input"
                          style={{ flex: 1, paddingLeft: 14, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}
                        />
                        <button className="btn btn-primary" onClick={handleShare} style={{ whiteSpace: 'nowrap', minWidth: 110 }}>
                          {copiedLink ? '✓ Copied!' : 'Copy Link'}
                        </button>
                      </div>

                      {/* Social Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {socials.map(s => (
                          <a
                            key={s.label}
                            href={s.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 6,
                              padding: '14px 8px',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--color-surface-2)',
                              border: '1px solid var(--color-border)',
                              color: s.color,
                              textDecoration: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.transform = '';
                              (e.currentTarget as HTMLElement).style.boxShadow = '';
                            }}
                          >
                            {s.icon}
                            <span style={{ color: 'var(--color-text-primary)' }}>{s.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}


                {/* TIMER TAB */}
                {activeTab === 'timer' && (
                  <div style={{ padding: '8px 0' }}>
                    <h3 style={{ marginBottom: 16 }}>Sleep Timer</h3>
                    
                    {sleepTimerMode ? (
                      <div style={{ background: 'var(--color-surface-2)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: 20 }}>
                        <Moon size={32} style={{ color: 'var(--color-brand)', margin: '0 auto 12px', opacity: 0.8 }} />
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 4 }}>
                          {sleepTimerMode === 'chapter' ? 'Pausing at End of Chapter' : (
                            sleepTimerEndsAt ? formatTime(Math.max(0, (sleepTimerEndsAt - Date.now()) / 1000)) : ''
                          )}
                        </div>
                        <div className="text-muted text-sm" style={{ marginBottom: 16 }}>
                          {sleepTimerMode === 'minutes' ? 'until playback stops' : 'The player will pause when this chapter concludes.'}
                        </div>
                        <button className="btn btn-secondary" onClick={clearSleepTimer} style={{ width: '100%', padding: '10px' }}>
                          Turn Off Timer
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="text-muted text-sm" style={{ marginBottom: 8 }}>Select an option to automatically pause playback:</div>
                        <button className="btn btn-secondary" onClick={() => setSleepTimer(15)} style={{ padding: '12px', justifyContent: 'flex-start', fontWeight: 500 }}>15 Minutes</button>
                        <button className="btn btn-secondary" onClick={() => setSleepTimer(30)} style={{ padding: '12px', justifyContent: 'flex-start', fontWeight: 500 }}>30 Minutes</button>
                        <button className="btn btn-secondary" onClick={() => setSleepTimer(60)} style={{ padding: '12px', justifyContent: 'flex-start', fontWeight: 500 }}>60 Minutes</button>
                        <button className="btn btn-secondary" onClick={() => setSleepTimer('chapter')} style={{ padding: '12px', justifyContent: 'flex-start', fontWeight: 500 }}>End of current chapter</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: Meta & Description */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>About the Book</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {book.categories.map(c => <Link key={c} href={`/categories/${encodeURIComponent(c)}`} className="pill">{c}</Link>)}
                {book.topics.map(t => <Link key={t} href={`/topics/${encodeURIComponent(t)}`} className="pill">#{t}</Link>)}
                {book.originalYear && <span className="pill" style={{ background: 'transparent', border: 'none' }}>Published {book.originalYear}</span>}
              </div>
              
              <div 
                className="prose"
                style={{ 
                  color: 'var(--color-text-secondary)', 
                  lineHeight: 1.7, 
                  fontSize: '0.9375rem',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}
                dangerouslySetInnerHTML={{ __html: book.description || book.excerpt }}
              />
            </div>
          </div>
        </div>

        {/* More Like This */}
        {related.length > 0 && (
          <div style={{ marginTop: 64, display: 'block', width: 'auto', minWidth: 0 }}>
            <div className="section-header">
              <h2 className="section-title">More Like This</h2>
            </div>
            <div className="scroll-row-wrapper" style={{ minWidth: 0, width: '100%' }}>
              <div className="scroll-row">
                {related.map(rBook => (
                   <BookCard key={rBook.id} book={rBook} />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Read Along Panel */}
      <ReadAlongPanel
        slug={book.slug}
        currentTime={isCurrent ? currentTime : 0}
        isOpen={readAlongOpen}
        onClose={() => setReadAlongOpen(false)}
        onSeek={(time) => {
          const { getAudioElement } = require('@/lib/store/playerStore');
          if (!isCurrent) {
            loadBook(book, time);
          } else {
            getAudioElement().currentTime = time;
          }
        }}
        bookTitle={book.title}
        authorName={book.authorName}
        vttUrl={book.vttUrl}
      />

      {/* Quote Modal */}
      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        allCues={loadedCues}
        currentTime={isCurrent ? currentTime : 0}
        bookId={book.id}
        bookTitle={book.title}
        bookSlug={book.slug}
        bookAuthor={book.authorName}
        bookCover={book.coverImage}
        chapterTitle={book.chapters[currentChapterIdx]?.title}
      />
    </div>
  );
}
