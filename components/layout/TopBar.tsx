'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Settings, X, CheckSquare, Square, Menu, ArrowLeft } from 'lucide-react';
import { useUIStore } from '@/lib/store/uiStore';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import type { Audiobook } from '@/lib/types';
import Link from 'next/link';

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
