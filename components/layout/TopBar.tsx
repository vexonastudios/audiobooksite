'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Settings, X, Menu, ArrowLeft, Radio, Loader2 } from 'lucide-react';
import { useUIStore } from '@/lib/store/uiStore';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import type { Audiobook } from '@/lib/types';
import Link from 'next/link';

// ─── Now Playing types ────────────────────────────────────────────────────────
interface NowPlayingData {
  active: boolean;
  blockId?: string;
  mp3Url?: string;
  manifestUrl?: string;
  broadcastStartTime?: string;
  totalDuration?: number;
  positionSecs?: number;
}

// ─── Radio Modal ──────────────────────────────────────────────────────────────
function RadioModal({
  data,
  onClose,
}: {
  data: NowPlayingData;
  onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !data.mp3Url) return;

    // Seek to live position
    const seek = () => {
      if (data.positionSecs && isFinite(data.positionSecs)) {
        audio.currentTime = data.positionSecs;
      }
      setLoading(false);
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    };

    audio.addEventListener('canplay', seek, { once: true });
    audio.load();
    return () => audio.removeEventListener('canplay', seek);
  }, [data.mp3Url, data.positionSecs]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 72,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 28px 24px',
          width: 340,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
          position: 'relative',
          animation: 'radioModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)', cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #e53e3e, #c53030)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(229,62,62,0.4)',
          }}>
            <Radio size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Scroll Radio
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#e53e3e',
                display: 'inline-block',
                animation: 'radioPulse 1.4s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '0.8rem', color: '#e53e3e', fontWeight: 600 }}>
                LIVE
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
          Streaming curated Christian audiobooks — live, synchronized broadcasting for our entire community.
        </p>

        {/* Play / Pause */}
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 'var(--radius-md)',
            background: loading ? 'var(--color-surface-2)' : 'linear-gradient(135deg, #e53e3e, #c53030)',
            color: loading ? 'var(--color-text-muted)' : 'white',
            fontWeight: 700,
            fontSize: '0.9375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: loading ? 'default' : 'pointer',
            border: 'none',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(229,62,62,0.35)',
          }}
        >
          {loading ? (
            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Tuning in…</>
          ) : isPlaying ? (
            <>⏸ Pause</>
          ) : (
            <>▶ Listen Live</>
          )}
        </button>

        {/* hidden audio */}
        {data.mp3Url && (
          <audio ref={audioRef} src={data.mp3Url} preload="auto" style={{ display: 'none' }} />
        )}
      </div>

      <style>{`
        @keyframes radioModalIn {
          from { opacity: 0; transform: scale(0.88) translateY(-12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
}

// ─── Now Playing Button ───────────────────────────────────────────────────────
function NowPlayingButton() {
  const [data, setData] = useState<NowPlayingData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/now-playing');
      if (res.ok) setData(await res.json());
    } catch { /* silent fail */ }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, [poll]);

  if (!mounted || !data?.active) return null;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        aria-label="Scroll Radio — Now Playing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 13px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #e53e3e, #c53030)',
          color: 'white',
          border: 'none',
          fontWeight: 700,
          fontSize: '0.8rem',
          letterSpacing: '0.01em',
          cursor: 'pointer',
          boxShadow: '0 3px 12px rgba(229,62,62,0.4)',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 5px 18px rgba(229,62,62,0.55)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = '';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 12px rgba(229,62,62,0.4)';
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'white',
          display: 'inline-block',
          animation: 'radioPulse 1.4s ease-in-out infinite',
          flexShrink: 0,
        }} />
        Now Playing
      </button>

      {modalOpen && (
        <RadioModal data={data} onClose={() => setModalOpen(false)} />
      )}

      <style>{`
        @keyframes radioPulse {
          0%, 100% { opacity: 1; transform: scale(1);   }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
export function TopBar() {
  const { toggleSidebar } = useUIStore();
  const router = useRouter();
  const currentPath = usePathname();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Audiobook[]>([]);
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const search = useLibraryStore((s) => s.search);
  const skipInterval = useUserStore((s) => s.skipInterval);
  const setSkipInterval = useUserStore((s) => s.setSkipInterval);
  const quoteSettings = useUserStore((s) => s.quoteSettings);
  const updateQuoteSettings = useUserStore((s) => s.updateQuoteSettings);
  const readAlongFontSize = useUserStore((s) => s.readAlongFontSize);
  const setReadAlongFontSize = useUserStore((s) => s.setReadAlongFontSize);
  const { isSignedIn } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close everything on route change
  useEffect(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setMobileSearchOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  // Auto-focus mobile search input when overlay opens
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 80);
    }
  }, [mobileSearchOpen]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (q.length > 1) {
      setResults(search(q).slice(0, 6));
      setOpen(true);
    } else {
      setOpen(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      setMobileSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  // Shared search results dropdown
  const searchDropdown = open && results.length > 0 ? (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: 0,
      right: 0,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      overflow: 'hidden',
      zIndex: 9999,
    }}>
      {results.map((book) => (
        <Link
          key={book.id}
          href={`/audiobook/${book.slug}`}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px',
            transition: 'background var(--transition-fast)',
            borderBottom: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
        >
          {book.coverImage ? (
            <img src={book.coverImage} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--color-brand)', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div className="book-card-title" style={{ fontSize: '0.875rem' }}>{book.title}</div>
            <div className="book-card-author">{book.authorName}</div>
          </div>
        </Link>
      ))}
      <Link
        href={`/search?q=${encodeURIComponent(query)}`}
        onMouseDown={(e) => e.preventDefault()}
        style={{ display: 'block', padding: '10px 14px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-brand)', fontWeight: 500 }}
      >
        See all results for &quot;{query}&quot;
      </Link>
    </div>
  ) : null;

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        backdropFilter: 'blur(8px)',
        overflow: 'visible',
      }}>

        {/* ─── Mobile left: hamburger + logo (hidden on desktop) ─── */}
        <div className="topbar-mobile-nav">
          <button className="btn btn-icon" onClick={toggleSidebar} aria-label="Open menu" style={{ flexShrink: 0, paddingLeft: 0 }}>
            <Menu size={24} />
          </button>
          <Link href="/" aria-label="Home" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Scroll Reader" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em', lineHeight: 1 }}>
              Scroll Reader
            </span>
          </Link>
        </div>

        {/* ─── Desktop search (hidden on mobile) ─── */}
        <form className="topbar-search-desktop" onSubmit={handleSubmit} style={{ flex: 1, maxWidth: 480, position: 'relative', alignSelf: 'center' }}>
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Search audiobooks, authors..."
              value={query}
              onChange={handleChange}
              onFocus={() => query.length > 1 && setOpen(true)}
              onBlur={() => setOpen(false)}
              className="search-input"
              id="global-search"
            />
          </div>
          {searchDropdown}
        </form>

        {/* ─── Right actions ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          {/* Now Playing — only shown when Scroll Radio is live */}
          <NowPlayingButton />

          {/* Search icon — mobile only, opens overlay */}
          <button
            className="btn btn-icon topbar-search-icon"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          <Link href="/settings" className="btn btn-icon" aria-label="Preferences">
            <Settings size={20} />
          </Link>

          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* ─── Mobile search overlay (portal, covers entire screen top) ─── */}
      {mobileSearchOpen && mounted && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: 60,
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 10,
          zIndex: 200,
          boxShadow: 'var(--shadow-md)',
        }}>
          <button
            className="btn btn-icon"
            onClick={() => { setMobileSearchOpen(false); setOpen(false); setQuery(''); setResults([]); }}
            aria-label="Close search"
          >
            <ArrowLeft size={20} />
          </button>

          <form onSubmit={handleSubmit} style={{ flex: 1, position: 'relative' }}>
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                ref={mobileInputRef}
                type="search"
                placeholder="Search audiobooks, authors..."
                value={query}
                onChange={handleChange}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className="search-input"
              />
            </div>
            {searchDropdown}
          </form>

          {query && (
            <button className="btn btn-icon" onClick={() => { setQuery(''); setResults([]); setOpen(false); }}>
              <X size={18} />
            </button>
          )}
        </div>,
        document.body
      )}


    </>
  );
}
