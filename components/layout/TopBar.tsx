'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Settings, X } from 'lucide-react';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import type { Audiobook } from '@/lib/types';
import Link from 'next/link';

export function TopBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Audiobook[]>([]);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const search = useLibraryStore((s) => s.search);
  const skipInterval = useUserStore((s) => s.skipInterval);
  const setSkipInterval = useUserStore((s) => s.setSkipInterval);
  const { isSignedIn } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

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
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: 'var(--color-bg)',
      borderBottom: '1px solid var(--color-border)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      backdropFilter: 'blur(8px)',
    }}>
      {/* Search */}
      <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search audiobooks, authors..."
            value={query}
            onChange={handleChange}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => query.length > 1 && setOpen(true)}
            className="search-input"
            id="global-search"
          />
        </div>

        {/* Dropdown results */}
        {open && results.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0, right: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            zIndex: 999,
          }}>
            {results.map((book) => (
              <Link
                key={book.id}
                href={`/audiobook/${book.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
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
              style={{ display: 'block', padding: '10px 14px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-brand)', fontWeight: 500 }}
            >
              See all results for "{query}"
            </Link>
          </div>
        )}
      </form>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        <button className="btn btn-icon" onClick={() => setSettingsOpen(true)}>
          <Settings size={20} />
        </button>
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

      {settingsOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div className="card" style={{ width: 320, padding: 24, position: 'relative' }}>
            <button className="btn btn-icon" style={{ position: 'absolute', top: 12, right: 12 }} onClick={() => setSettingsOpen(false)}>
              <X size={18} />
            </button>
            <h3 style={{ marginBottom: 16 }}>Player Settings</h3>
            
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Skip Interval</div>
            <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>
              Adjust how many seconds the forward/backward buttons skip.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 15, 30, 45].map(val => (
                <button 
                  key={val}
                  className={`btn ${skipInterval === val ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '8px 0' }}
                  onClick={() => setSkipInterval(val)}
                >
                  {val}s
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
