'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Headphones, Book, TrendingUp, Search } from 'lucide-react';

export interface AuthorData {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  birthYear: number | null;
  deathYear: number | null;
  bookCount: number;
  totalPlays: number;
}

type SortOption = 'name_asc' | 'books_desc' | 'plays_desc';

export default function AuthorsClient({ authors }: { authors: AuthorData[] }) {
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [searchQuery, setSearchQuery] = useState('');

  // ── 1. Prolific Authors Featured Row ──
  const prolificAuthors = useMemo(() => {
    return [...authors].sort((a, b) => b.bookCount - a.bookCount).slice(0, 6);
  }, [authors]);

  // ── 2. Filter & Sort Main Grid ──
  const filteredAndSorted = useMemo(() => {
    // Filter
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? authors.filter(a => a.name.toLowerCase().includes(query))
      : [...authors];

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name_asc') {
        const lastA = a.name.split(' ').pop() || a.name;
        const lastB = b.name.split(' ').pop() || b.name;
        // Optionally sort by last name, but alphabetical by exact name is fine.
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'books_desc') {
        if (b.bookCount !== a.bookCount) return b.bookCount - a.bookCount;
        return b.totalPlays - a.totalPlays;
      }
      if (sortBy === 'plays_desc') {
        if (b.totalPlays !== a.totalPlays) return b.totalPlays - a.totalPlays;
        return b.bookCount - a.bookCount;
      }
      return 0;
    });

    return filtered;
  }, [authors, sortBy, searchQuery]);

  // Group by first letter if sorting by name
  const groupedAuthors = useMemo(() => {
    if (sortBy !== 'name_asc' || searchQuery) return null;
    
    const groups: Record<string, AuthorData[]> = {};
    filteredAndSorted.forEach(author => {
      const char = author.name.charAt(0).toUpperCase();
      if (!groups[char]) groups[char] = [];
      groups[char].push(author);
    });
    return groups;
  }, [filteredAndSorted, sortBy, searchQuery]);

  const existingLetters = groupedAuthors ? Object.keys(groupedAuthors).sort() : [];
  // For the jump bar (A-Z)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Smooth scroll
  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`letter-${letter}`);
    if (el) {
      // offset for fixed headers
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="page" style={{ paddingBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>Authors</h1>
          <p className="text-secondary" style={{ margin: '8px 0 0 0' }}>
            {authors.length} authors — browse their free Christian audiobooks
          </p>
        </div>

        {/* Filter Input */}
        <div className="search-input-wrap" style={{ minWidth: 200, maxWidth: 320, flex: 1, margin: 0 }}>
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Filter authors..."
            className="search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginBottom: 40 }} />

      {/* ── Featured Row (Always visible unless searching) ── */}
      {!searchQuery && (
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={22} color="var(--color-brand)" />
            Prolific Authors
          </h2>
          <div className="scroll-row-container" style={{ margin: '0 -16px', padding: '4px 16px', overflowX: 'auto', display: 'flex', gap: 16 }}>
            {prolificAuthors.map(author => (
              <FeaturedAuthorCard key={`featured-${author.id}`} author={author} />
            ))}
          </div>
        </section>
      )}

      {/* ── Sort & Jump Bar Container ── */}
      <div style={{ 
        position: 'sticky', top: 52, zIndex: 20, 
        background: 'var(--color-bg)', padding: '16px 0',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4, flexShrink: 0 }}>
            Sort By
          </div>
          <button 
            className={`btn ${sortBy === 'name_asc' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSortBy('name_asc')}
            style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: 20, flexShrink: 0 }}
          >
            Name (A-Z)
          </button>
          <button 
            className={`btn ${sortBy === 'books_desc' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSortBy('books_desc')}
            style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: 20, flexShrink: 0 }}
          >
            Most Books
          </button>
          <button 
            className={`btn ${sortBy === 'plays_desc' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSortBy('plays_desc')}
            style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: 20, flexShrink: 0 }}
          >
            Most Listened
          </button>
        </div>

        {/* Alphabet Jump Bar */}
        {sortBy === 'name_asc' && !searchQuery && (
          <div style={{ 
            display: 'flex', gap: 4, marginTop: 12, overflowX: 'auto', 
            paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none'
          }}>
            {alphabet.map(letter => {
              const hasAuthors = existingLetters.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => scrollToLetter(letter)}
                  disabled={!hasAuthors}
                  style={{
                    minWidth: 26, height: 26, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, border: 'none',
                    background: hasAuthors ? 'var(--color-surface-2)' : 'transparent',
                    color: hasAuthors ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    opacity: hasAuthors ? 1 : 0.4,
                    cursor: hasAuthors ? 'pointer' : 'default',
                    fontWeight: 700, fontSize: '0.75rem',
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Grid ── */}
      {groupedAuthors ? (
        // Render Grouped by Letter
        <div>
          {existingLetters.map(letter => (
            <div key={letter} id={`letter-${letter}`} style={{ marginBottom: 40, scrollMarginTop: 140 }}>
              <h3 style={{ 
                fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-muted)',
                marginBottom: 16, borderBottom: '2px solid var(--color-surface-2)', paddingBottom: 4
              }}>
                {letter}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 20 }}>
                {groupedAuthors[letter].map(author => (
                  <AuthorCard key={author.id} author={author} sortBy={sortBy} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Render Flat List (Sorted by metrics or Searched)
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 20 }}>
          {filteredAndSorted.map(author => (
            <AuthorCard key={author.id} author={author} sortBy={sortBy} />
          ))}
          {filteredAndSorted.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No authors found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Supporting Components ──

function FeaturedAuthorCard({ author }: { author: AuthorData }) {
  return (
    <Link
      href={`/author/${author.slug}`}
      className="card"
      style={{
        flexShrink: 0, width: 220, padding: 16,
        display: 'flex', alignItems: 'center', gap: 14,
        textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s',
      }}
    >
      {author.imageUrl ? (
        <img
          src={author.imageUrl}
          alt={author.name}
          style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-brand) 0%, #0e4f8a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
        }}>
          {author.name.charAt(0)}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {author.name}
        </div>
        <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--color-surface)', padding: '2px 6px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-brand)' }}>
            <Book size={10} /> {author.bookCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

function AuthorCard({ author, sortBy }: { author: AuthorData, sortBy: SortOption }) {
  return (
    <Link
      href={`/author/${author.slug}`}
      className="card author-card"
      style={{
        padding: 20, textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        textDecoration: 'none',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
    >
      {author.imageUrl ? (
        <img
          src={author.imageUrl}
          alt={author.name}
          style={{
            width: 80, height: 100, objectFit: 'cover',
            borderRadius: 8, border: '2px solid var(--color-surface-2)',
          }}
        />
      ) : (
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-brand) 0%, #0e4f8a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
        }}>
          {author.name.charAt(0)}
        </div>
      )}

      <div style={{ width: '100%' }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3, color: 'var(--color-text)' }}>
          {author.name}
        </div>
        {author.birthYear && (
          <div className="text-secondary" style={{ fontSize: 12, marginTop: 2 }}>
            {author.birthYear}{author.deathYear ? ` – ${author.deathYear}` : ''}
          </div>
        )}
        
        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 4, 
            background: sortBy === 'books_desc' ? 'var(--color-brand)' : 'var(--color-surface-2)', 
            color: sortBy === 'books_desc' ? 'white' : 'var(--color-text-secondary)',
            padding: '3px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
          }}>
            <Book size={12} strokeWidth={2.5} /> {author.bookCount}
          </span>

          {sortBy === 'plays_desc' && (
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 4, 
              background: 'var(--color-brand)', color: 'white',
              padding: '3px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
            }}>
              <Headphones size={12} strokeWidth={2.5} /> 
              {author.totalPlays > 1000 ? (author.totalPlays/1000).toFixed(1) + 'k' : author.totalPlays}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
