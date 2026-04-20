'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Settings, X, CheckSquare, Square } from 'lucide-react';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import type { Audiobook } from '@/lib/types';
import Link from 'next/link';

export function TopBar() {
  const router = useRouter();
  const currentPath = usePathname();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Audiobook[]>([]);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const search = useLibraryStore((s) => s.search);
  const skipInterval = useUserStore((s) => s.skipInterval);
  const setSkipInterval = useUserStore((s) => s.setSkipInterval);
  const quoteSettings = useUserStore((s) => s.quoteSettings);
  const updateQuoteSettings = useUserStore((s) => s.updateQuoteSettings);
  const { isSignedIn } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close search whenever the route changes
  useEffect(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

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
      overflow: 'visible',
    }}>
      {/* Search — standard combobox pattern: onBlur closes, onMouseDown on results
          prevents blur so the link click can fire. No global listeners needed. */}
      <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: 480, position: 'relative', alignSelf: 'center' }}>
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

        {/* Dropdown — position:absolute, NO portal. The sticky header has overflow:visible
            so the dropdown correctly extends below the header into the page. */}
        {open && results.length > 0 && (
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
                // onMouseDown prevents the input's onBlur from firing before the
                // link's onClick, which is the standard accessible combobox pattern.
                onMouseDown={(e) => e.preventDefault()}
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
              onMouseDown={(e) => e.preventDefault()}
              style={{ display: 'block', padding: '10px 14px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-brand)', fontWeight: 500 }}
            >
              See all results for &quot;{query}&quot;
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

      {settingsOpen && mounted && createPortal(
        <div onClick={() => setSettingsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, padding: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-2)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Preferences</h2>
              <button className="btn btn-icon" onClick={() => setSettingsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {/* Playback Settings Section */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--color-brand)' }}>Playback Settings</h3>
                
                <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Skip Interval</div>
                    <div className="text-secondary text-sm">Amount of time to jump when clicking forward/backward.</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[5, 15, 30, 45].map(val => (
                      <button 
                        key={val}
                        className={`btn ${skipInterval === val ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)' }}
                        onClick={() => setSkipInterval(val)}
                      >
                        {val}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote Sharing Settings */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--color-brand)' }}>Quote Sharing Format</h3>
                <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div onClick={() => updateQuoteSettings({ useQuotes: !quoteSettings.useQuotes })} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.95rem' }}>
                      {quoteSettings.useQuotes ? <CheckSquare size={20} color="var(--color-brand)" /> : <Square size={20} color="var(--color-border)" />}
                      Add quotation marks {`" "`} around text
                    </div>
                    <div onClick={() => updateQuoteSettings({ includeBook: !quoteSettings.includeBook })} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.95rem' }}>
                      {quoteSettings.includeBook ? <CheckSquare size={20} color="var(--color-brand)" /> : <Square size={20} color="var(--color-border)" />}
                      Include Book Title and Chapter Note
                    </div>
                    <div onClick={() => updateQuoteSettings({ includeLink: !quoteSettings.includeLink })} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.95rem' }}>
                      {quoteSettings.includeLink ? <CheckSquare size={20} color="var(--color-brand)" /> : <Square size={20} color="var(--color-border)" />}
                      Include scrollreader.com Link
                    </div>
                  </div>
                  
                  {/* Real-time Preview */}
                  <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Example output</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.6, fontFamily: 'monospace' }}>
                      {quoteSettings.useQuotes ? '"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."' : 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'}
                      {quoteSettings.includeBook ? ' — Apostle John, The Bible (John Chapter 3)' : ' — Apostle John'}
                      {quoteSettings.includeLink && ' Listen at: https://scrollreader.com/audiobook/the-bible'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Settings Placeholder */}
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--color-brand)' }}>Appearance & Display</h3>
                
                <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: 'var(--radius-md)', opacity: 0.7 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>Theme Preference (Coming Soon)</div>
                  <div className="text-secondary text-sm">Toggle between Light, Dark, or System themes.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </header>
  );
}
