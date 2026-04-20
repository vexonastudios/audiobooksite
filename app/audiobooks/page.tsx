'use client';

import { useState, useMemo, Suspense } from 'react';
import { useLibraryStore, slugify } from '@/lib/store/libraryStore';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookCard } from '@/components/ui/BookCard';
import { ScrollRow } from '@/components/ui/ScrollRow';
import {
  Search, SlidersHorizontal, LayoutGrid, List as ListIcon,
  ChevronDown, X, Clock, TrendingUp, ArrowDownAZ, Calendar,
  Headphones, Users, Tag, Hash
} from 'lucide-react';
import type { Audiobook } from '@/lib/types';

type SortKey = 'recent' | 'popular' | 'alpha' | 'length';
type ViewMode = 'grid' | 'list';

const SORT_OPTIONS: { key: SortKey; label: string; icon: any }[] = [
  { key: 'recent', label: 'Most Recent', icon: Calendar },
  { key: 'popular', label: 'Most Popular', icon: TrendingUp },
  { key: 'alpha', label: 'A – Z', icon: ArrowDownAZ },
  { key: 'length', label: 'Duration', icon: Clock },
];

function parseDurationSecs(book: Audiobook): number {
  if (book.totalDuration) {
    const parts = book.totalDuration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return book.chapters.reduce((sum, ch) => sum + (ch.duration || 0), 0);
}

function AudiobooksPageContent() {
  const { audiobooks, isLoaded, getAllCategories, getAllTopics, getAllAuthors } = useLibraryStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [selectedTopic, setSelectedTopic] = useState<string | null>(searchParams.get('topic'));
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(searchParams.get('author'));
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(40);

  const categories = getAllCategories();
  const topics = getAllTopics();
  const authors = getAllAuthors();

  // Active filter count
  const activeFilterCount = [selectedCategory, selectedTopic, selectedAuthor].filter(Boolean).length;

  // Filter + Sort
  const filteredBooks = useMemo(() => {
    let books = [...audiobooks];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.authorName.toLowerCase().includes(q) ||
        b.categories.some(c => c.toLowerCase().includes(q)) ||
        b.topics.some(t => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory) {
      books = books.filter(b => b.categories.some(c => slugify(c) === slugify(selectedCategory!)));
    }

    // Topic filter
    if (selectedTopic) {
      books = books.filter(b => b.topics.some(t => slugify(t) === slugify(selectedTopic!)));
    }

    // Author filter
    if (selectedAuthor) {
      books = books.filter(b => b.authorName === selectedAuthor);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        books.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        break;
      case 'popular':
        books.sort((a, b) => b.plays - a.plays);
        break;
      case 'alpha':
        books.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'length':
        books.sort((a, b) => parseDurationSecs(b) - parseDurationSecs(a));
        break;
    }

    return books;
  }, [audiobooks, searchQuery, selectedCategory, selectedTopic, selectedAuthor, sortBy]);

  const visibleBooks = filteredBooks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBooks.length;

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedTopic(null);
    setSelectedAuthor(null);
    setSearchQuery('');
  };

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 48, width: 300, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 48, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page pb-24">
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 6 }}>Browse Audiobooks</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
          {filteredBooks.length === audiobooks.length
            ? `Explore all ${audiobooks.length} audiobooks in our library`
            : `${filteredBooks.length} audiobook${filteredBooks.length !== 1 ? 's' : ''} found`
          }
        </p>
      </div>

      {/* Recommended Audiobooks (Only show if no search/filters active and in grid mode) */}
      {!searchQuery && activeFilterCount === 0 && viewMode === 'grid' && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <TrendingUp size={22} color="var(--color-brand)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Recommended for You</h2>
          </div>
          <ScrollRow books={[...audiobooks].sort((a,b) => b.plays - a.plays).slice(0, 10)} />
        </div>
      )}

      {/* Search + Controls Bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Search Input */}
        <div style={{
          flex: '1 1 280px',
          position: 'relative',
          maxWidth: 480,
        }}>
          <Search size={18} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search titles, authors, topics…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: '0.9375rem',
              outline: 'none',
              color: 'var(--color-text-primary)',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-brand)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4,
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px',
            borderRadius: 'var(--radius-lg)',
            border: `1.5px solid ${showFilters || activeFilterCount > 0 ? 'var(--color-brand)' : 'var(--color-border)'}`,
            background: showFilters ? 'rgba(46,106,167,0.06)' : 'var(--color-surface)',
            color: showFilters || activeFilterCount > 0 ? 'var(--color-brand)' : 'var(--color-text-secondary)',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
            transition: 'all 0.2s',
          }}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              background: 'var(--color-brand)', color: 'white',
              borderRadius: 20, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700,
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            style={{
              padding: '10px 36px 10px 16px',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--color-text-muted)',
          }} />
        </div>

        {/* View Toggle (desktop only) */}
        <div className="desktop-only" style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1.5px solid var(--color-border)' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '9px 12px', border: 'none', cursor: 'pointer',
              background: viewMode === 'grid' ? 'var(--color-brand)' : 'var(--color-surface)',
              color: viewMode === 'grid' ? 'white' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '9px 12px', border: 'none', cursor: 'pointer',
              background: viewMode === 'list' ? 'var(--color-brand)' : 'var(--color-surface)',
              color: viewMode === 'list' ? 'white' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <ListIcon size={16} />
          </button>
        </div>
      </div>

      {/* Filters Panel (collapsible) */}
      {showFilters && (
        <div className="card" style={{
          padding: 20, marginBottom: 24,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Filter By</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'none', border: 'none', color: 'var(--color-brand)',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem',
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Category row */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Tag size={14} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Topic row */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Hash size={14} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topic</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {topics.map(topic => (
                <button
                  key={topic}
                  className={`pill ${selectedTopic === topic ? 'active' : ''}`}
                  onClick={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Author row */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Users size={14} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Author</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {authors.map(author => (
                <button
                  key={author}
                  className={`pill ${selectedAuthor === author ? 'active' : ''}`}
                  onClick={() => setSelectedAuthor(selectedAuthor === author ? null : author)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {author}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {selectedCategory && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: 'rgba(46,106,167,0.08)', color: 'var(--color-brand)',
              fontSize: '0.8125rem', fontWeight: 600,
            }}>
              <Tag size={12} />
              {selectedCategory}
              <button onClick={() => setSelectedCategory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brand)', padding: 0, lineHeight: 1 }}>
                <X size={14} />
              </button>
            </span>
          )}
          {selectedTopic && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: 'rgba(46,106,167,0.08)', color: 'var(--color-brand)',
              fontSize: '0.8125rem', fontWeight: 600,
            }}>
              <Hash size={12} />
              {selectedTopic}
              <button onClick={() => setSelectedTopic(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brand)', padding: 0, lineHeight: 1 }}>
                <X size={14} />
              </button>
            </span>
          )}
          {selectedAuthor && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: 'rgba(46,106,167,0.08)', color: 'var(--color-brand)',
              fontSize: '0.8125rem', fontWeight: 600,
            }}>
              <Users size={12} />
              {selectedAuthor}
              <button onClick={() => setSelectedAuthor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brand)', padding: 0, lineHeight: 1 }}>
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {filteredBooks.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--color-text-muted)',
        }}>
          <Headphones size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--color-text-secondary)', marginBottom: 8 }}>No audiobooks found</h3>
          <p style={{ fontSize: '0.9375rem', marginBottom: 20 }}>Try adjusting your search or filters</p>
          <button
            onClick={clearAllFilters}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <X size={16} />
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
          gap: 20,
        }}>
          {visibleBooks.map(book => (
            <BookCard key={book.id} book={book} width="100%" />
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleBooks.map(book => (
            <Link
              key={book.id}
              href={`/audiobook/${book.slug}`}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <img
                src={book.thumbnailUrl || book.coverImage || '/placeholder.png'}
                alt={book.title}
                style={{
                  width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                }}
                loading="lazy"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)', marginBottom: 2 }} className="truncate">
                  {book.title}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {book.authorName}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  {book.length || '—'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {book.chapters.length} ch.
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => setVisibleCount(v => v + 40)}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 32px', fontWeight: 700, fontSize: '0.9375rem',
            }}
          >
            Show More ({filteredBooks.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Quick Stats Footer */}
      <div style={{
        marginTop: 48,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 16,
      }}>
        {[
          { label: 'Audiobooks', value: audiobooks.length, icon: Headphones },
          { label: 'Authors', value: authors.length, icon: Users },
          { label: 'Categories', value: categories.length, icon: Tag },
          { label: 'Topics', value: topics.length, icon: Hash },
        ].map(stat => (
          <div key={stat.label} style={{
            textAlign: 'center', padding: '20px 12px',
            background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}>
            <stat.icon size={20} style={{ color: 'var(--color-brand)', marginBottom: 8 }} />
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AudiobooksPage() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <div className="skeleton" style={{ height: 48, width: 300, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 48, marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        </div>
      }
    >
      <AudiobooksPageContent />
    </Suspense>
  );
}
