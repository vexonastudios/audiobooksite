'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Headphones, Star, Search, BookOpen, ExternalLink } from 'lucide-react';

interface PrintedBook {
  id: string;
  slug: string;
  title: string;
  author_name: string;
  cover_image: string;
  thumbnail_url: string;
  buy_link: string;
  plays: number;
  excerpt: string;
  categories: string[];
  original_year: number | null;
}

function isAmazonLink(url: string) {
  return url.includes('amazon') || url.includes('amzn.to');
}

function getStoreName(url: string) {
  if (url.includes('amazon') || url.includes('amzn.to')) return 'Amazon';
  if (url.includes('scrollreader') || url.includes('shop.scrollreader')) return 'ScrollReader Shop';
  if (url.includes('grantedministries')) return 'Granted Ministries';
  try {
    return new URL(url).hostname.replace('www.', '').replace('shop.', '');
  } catch {
    return 'Buy Book';
  }
}

export default function PrintedBooksPage() {
  const [books, setBooks] = useState<PrintedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetch('/api/books')
      .then(r => r.json())
      .then(d => { setBooks(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Gather unique categories from all books
  const allCategories = ['All', ...Array.from(new Set(books.flatMap(b => b.categories ?? []))).sort()];

  const filtered = books.filter(b => {
    const matchSearch = search === '' ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || (b.categories ?? []).includes(activeCategory);
    return matchSearch && matchCat;
  });

  const featured = books.slice(0, 4); // top 4 by plays
  const rest = filtered;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-brand), #4a90d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={22} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Printed Books
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: 600 }}>
          Every book in our library paired with where you can own a physical copy. Sorted by listener popularity—the most-loved audiobooks are at the top.
        </p>
      </div>

      {/* Featured / Most Recommended */}
      {!loading && featured.length > 0 && search === '' && activeCategory === 'All' && (
        <section style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Star size={18} color="#f59e0b" fill="#f59e0b" />
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Most Recommended</h2>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 4 }}>Based on listener plays</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {featured.map((book, i) => (
              <FeaturedCard key={book.id} book={book} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* Search + Category Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 28 }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            placeholder="Search by title or author…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {allCategories.slice(0, 8).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid',
                borderColor: activeCategory === cat ? 'var(--color-brand)' : 'var(--color-border)',
                background: activeCategory === cat ? 'var(--color-brand)' : 'transparent',
                color: activeCategory === cat ? 'white' : 'var(--color-text-secondary)',
                fontSize: 13,
                fontWeight: activeCategory === cat ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
        {loading ? 'Loading…' : `${filtered.length} book${filtered.length !== 1 ? 's' : ''}`}
      </p>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 14, background: 'var(--color-surface-2)', height: 320, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--color-text-muted)' }}>
          <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: 17, fontWeight: 600 }}>No books found</p>
          <p style={{ fontSize: 14, marginTop: 6 }}>Try a different search or category</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: 20,
        }}>
          {rest.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Featured Card (large, horizontal on desktop) ─────────────────────────── */
function FeaturedCard({ book, rank }: { book: PrintedBook; rank: number }) {
  const cover = book.cover_image || book.thumbnail_url || '/placeholder.png';
  const storeName = getStoreName(book.buy_link);
  const amazon = isAmazonLink(book.buy_link);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      transition: 'transform 150ms, box-shadow 150ms',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'; }}
    >
      {/* Cover */}
      <div style={{ position: 'relative' }}>
        <img
          src={cover}
          alt={book.title}
          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />
        {/* Rank badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: '#f59e0b', color: 'white',
          borderRadius: 8, padding: '4px 9px', fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <Star size={11} fill="white" />
          #{rank}
        </div>
        {/* Play count badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.6)', color: 'white',
          borderRadius: 8, padding: '4px 9px', fontSize: 11, fontWeight: 600,
          backdropFilter: 'blur(8px)',
        }}>
          {book.plays.toLocaleString()} plays
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {book.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{book.author_name}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          {/* Listen free */}
          <Link
            href={`/audiobook/${book.slug}`}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 10px', borderRadius: 10,
              border: '1.5px solid var(--color-brand)', color: 'var(--color-brand)',
              fontSize: 12, fontWeight: 600, textDecoration: 'none',
              transition: 'all 150ms',
            }}
            onClick={e => e.stopPropagation()}
          >
            <Headphones size={13} /> Listen Free
          </Link>
          {/* Buy */}
          <a
            href={book.buy_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 10px', borderRadius: 10,
              background: amazon ? '#FF9900' : 'var(--color-brand)',
              color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none',
              transition: 'all 150ms',
            }}
            onClick={e => e.stopPropagation()}
          >
            <ShoppingCart size={13} /> {storeName}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Grid Card (compact) ──────────────────────────────────────────────────── */
function BookCard({ book }: { book: PrintedBook }) {
  const cover = book.cover_image || book.thumbnail_url || '/placeholder.png';
  const storeName = getStoreName(book.buy_link);
  const amazon = isAmazonLink(book.buy_link);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 150ms, box-shadow 150ms',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {/* Cover */}
      <div style={{ position: 'relative' }}>
        <img
          src={cover}
          alt={book.title}
          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {book.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{book.author_name}</div>
        {book.plays > 0 && (
          <div style={{ fontSize: 10, color: 'var(--color-brand)', fontWeight: 500, marginTop: 2 }}>
            {book.plays.toLocaleString()} listens
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '0 12px 12px', display: 'flex', gap: 6 }}>
        <Link
          href={`/audiobook/${book.slug}`}
          style={{
            flex: 1, textAlign: 'center',
            padding: '7px 6px',
            borderRadius: 8,
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            fontSize: 11, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'all 150ms',
          }}
          onClick={e => e.stopPropagation()}
        >
          <Headphones size={11} /> Listen
        </Link>
        <a
          href={book.buy_link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, textAlign: 'center',
            padding: '7px 6px',
            borderRadius: 8,
            background: amazon ? '#FF9900' : 'var(--color-brand)',
            color: 'white',
            fontSize: 11, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'all 150ms',
          }}
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={11} /> {storeName === 'Amazon' ? 'Amazon' : 'Buy'}
        </a>
      </div>
    </div>
  );
}
