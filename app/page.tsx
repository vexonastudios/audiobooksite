'use client';

import { useState } from 'react';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import type { Audiobook } from '@/lib/types';
import Link from 'next/link';
import { Play, Headphones } from 'lucide-react';

const BOOK_CARD_WIDTH = 168;

function BookCard({ book }: { book: Audiobook }) {
  const loadBook = usePlayerStore((s) => s.loadBook);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="book-card"
      style={{ width: BOOK_CARD_WIDTH, flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/audiobook/${book.slug}`} style={{ display: 'block', position: 'relative' }}>
        {book.coverImage ? (
          <img
            src={book.thumbnailUrl || book.coverImage}
            alt={book.title}
            className="book-card-img"
            loading="lazy"
          />
        ) : (
          <div className="book-card-img cover-placeholder">
            {book.title.charAt(0)}
          </div>
        )}
        {hovered && (
          <button
            onClick={(e) => { e.preventDefault(); loadBook(book); }}
            style={{
              position: 'absolute',
              bottom: 8, right: 8,
              width: 40, height: 40,
              borderRadius: '50%',
              background: 'var(--color-brand)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast)',
            }}
            title={`Play ${book.title}`}
          >
            <Play size={18} style={{ marginLeft: 2 }} />
          </button>
        )}
      </Link>
      <div className="book-card-body">
        <div className="book-card-title">{book.title}</div>
        <div className="book-card-author">{book.authorName}</div>
        {book.length && <div className="book-card-length">{book.length}</div>}
      </div>
    </div>
  );
}

function ScrollRow({ books }: { books: Audiobook[] }) {
  return (
    <div className="scroll-row">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { audiobooks, isLoaded, getByCategory, getRecent } = useLibraryStore();
  const history = useUserStore((s) => s.history);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useLibraryStore((s) => s.getAllCategories());
  const recentBooks = getRecent(20);

  // "Continue Listening" — map history bookId → audiobook
  const continueListening = history
    .slice(0, 10)
    .map((h) => audiobooks.find((b) => b.id === h.bookId))
    .filter(Boolean) as Audiobook[];

  // "Explore" row — filtered by selected category pill, or all
  const exploreBooks = activeCategory
    ? getByCategory(activeCategory).slice(0, 20)
    : audiobooks.slice(0, 20);

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 16 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{ width: BOOK_CARD_WIDTH, height: 230, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Hero greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 6 }}>Free Christian Audiobooks</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          {audiobooks.length} audiobooks from classic authors — always free.
        </p>
      </div>

      {/* Continue Listening */}
      {continueListening.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Continue Listening</h2>
            <Link href="/history" className="see-all-link">See all</Link>
          </div>
          <ScrollRow books={continueListening} />
        </section>
      )}

      {/* Recent Additions */}
      <section style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">Recent Additions</h2>
          <Link href="/categories" className="see-all-link">Browse all</Link>
        </div>
        <ScrollRow books={recentBooks} />
      </section>

      {/* Explore */}
      <section style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">Explore</h2>
        </div>

        {/* Category pill filter row */}
        <div className="scroll-row" style={{ marginBottom: 20, paddingBottom: 4 }}>
          <button
            className={`pill ${activeCategory === null ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <ScrollRow books={exploreBooks} />
      </section>

      {/* Stats banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-light) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginBottom: 24,
      }}>
        <Headphones size={40} style={{ opacity: 0.8, flexShrink: 0 }} />
        <div>
          <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', marginBottom: 4 }}>
            {audiobooks.length} Audiobooks — All Free, Forever
          </h3>
          <p style={{ opacity: 0.85, fontSize: '0.9375rem' }}>
            Classic Christian literature from missionary biographies to Puritan devotions. No subscription needed.
          </p>
        </div>
      </div>
    </div>
  );
}
