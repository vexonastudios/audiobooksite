'use client';

import { useRef } from 'react';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';
import type { Audiobook, Article } from '@/lib/types';
import Link from 'next/link';
import { Headphones, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { BookCard } from '@/components/ui/BookCard';
import { useState, useEffect } from 'react';

const BOOK_CARD_WIDTH = 168;
const CL_CARD_WIDTH = 134; // Slightly smaller for Continue Listening

// ── Scroll Row with desktop arrow + right fade ────────────────────────────────
function ScrollRow({ books, cardWidth = BOOK_CARD_WIDTH, compact = false }: { books: Audiobook[]; cardWidth?: number; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [books]);

  const scrollLeft = () => {
    if (ref.current) ref.current.scrollBy({ left: -((cardWidth + 16) * 3), behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (ref.current) ref.current.scrollBy({ left: (cardWidth + 16) * 3, behavior: 'smooth' });
  };
  return (
    <div className="scroll-row-wrapper" onMouseEnter={checkScroll}>
      <div className="scroll-row" ref={ref} onScroll={checkScroll}>
        {books.map((book) => (
          <BookCard key={book.id} book={book} width={cardWidth} compact={compact} />
        ))}
      </div>
      
      {canScrollLeft && (
        <>
          <div className="scroll-fade left" />
          <button className="scroll-arrow left" onClick={scrollLeft} aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
        </>
      )}
      
      {canScrollRight && (
        <>
          <div className="scroll-fade right" />
          <button className="scroll-arrow right" onClick={scrollRight} aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

// ── Article thumbnail colors ───────────────────────────────────────────────────
const ARTICLE_GRADIENTS = [
  'linear-gradient(135deg, #1e3a5f 0%, #2e6aa7 100%)',
  'linear-gradient(135deg, #3d1f5f 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #1a4731 0%, #15803d 100%)',
  'linear-gradient(135deg, #5f1c1c 0%, #b91c1c 100%)',
  'linear-gradient(135deg, #3d2d0f 0%, #b45309 100%)',
  'linear-gradient(135deg, #0f2d3d 0%, #0369a1 100%)',
];

function ArticleCard({ article, audiobooks, index }: { article: Article; audiobooks: Audiobook[]; index: number }) {
  const sourceBook = article.sourceAudiobookSlug
    ? audiobooks.find(b => b.slug === article.sourceAudiobookSlug)
    : null;
  const gradient = ARTICLE_GRADIENTS[index % ARTICLE_GRADIENTS.length];
  const date = new Date(article.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Link
      href={`/articles/${article.slug}`}
      style={{ textDecoration: 'none', flexShrink: 0, width: 240 }}
    >
      <div style={{
        background: gradient,
        borderRadius: 16,
        padding: '20px 18px 16px',
        height: 150,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(0,0,0,0.2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
      >
        <p style={{
          color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: '0.875rem',
          lineHeight: 1.35, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.title}
        </p>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', margin: '0 0 4px', fontWeight: 500 }}>
            {article.authorName} · {date}
          </p>
          {sourceBook && (
            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem', margin: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <BookOpen size={10} style={{ flexShrink: 0 }} /> From: {sourceBook.title}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function ArticleScrollRow({ articles, audiobooks }: { articles: Article[]; audiobooks: Audiobook[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [articles]);

  const scrollLeft = () => {
    if (ref.current) ref.current.scrollBy({ left: -(240 + 14) * 3, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (ref.current) ref.current.scrollBy({ left: (240 + 14) * 3, behavior: 'smooth' });
  };

  return (
    <div className="scroll-row-wrapper" onMouseEnter={checkScroll}>
      <div className="scroll-row" ref={ref} onScroll={checkScroll}>
        {articles.map((a, i) => (
          <ArticleCard key={a.id} article={a} audiobooks={audiobooks} index={i} />
        ))}
      </div>
      
      {canScrollLeft && (
        <>
          <div className="scroll-fade left" />
          <button className="scroll-arrow left" onClick={scrollLeft} aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
        </>
      )}
      
      {canScrollRight && (
        <>
          <div className="scroll-fade right" />
          <button className="scroll-arrow right" onClick={scrollRight} aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { audiobooks, articles, isLoaded, getByCategory, getRecent } = useLibraryStore();
  const history = useUserStore((s) => s.history);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [dailyTags, setDailyTags] = useState<string[]>([]);

  const categories = useLibraryStore((s) => s.getAllCategories());
  const topics = useLibraryStore((s) => s.getAllTopics());
  const recentBooks = getRecent(20);
  const recentArticles = articles.slice(0, 20);

  useEffect(() => {
    // Merge categories and topics, remove duplicates
    const allTags = Array.from(new Set([...categories, ...topics])).sort();
    if (allTags.length > 0) {
      // Use current day as pseudo-random seed to rotate tags daily
      const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      const shuffled = [...allTags].sort((a, b) => {
         const hashA = (a.charCodeAt(0) + seed) % 100;
         const hashB = (b.charCodeAt(0) + seed) % 100;
         return hashA - hashB;
      });
      // Show ~15 random distinct tags each day
      setDailyTags(shuffled.slice(0, 15));
    }
  }, [categories, topics]);

  // "Continue Listening" — map history bookId → audiobook
  const continueListening = history
    .slice(0, 10)
    .map((h) => audiobooks.find((b) => b.id === h.bookId))
    .filter(Boolean) as Audiobook[];

  // "Explore" row — filtered by selected tag, checking both category and topic arrays
  const exploreBooks = activeTag
    ? audiobooks.filter(b => b.categories?.includes(activeTag) || b.topics?.includes(activeTag)).slice(0, 20)
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
      <NotificationBanner />
      {/* Hero greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 6 }}>Free Christian Audiobooks</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          {audiobooks.length} audiobooks from classic authors — always free.
        </p>
      </div>

      {/* Continue Listening — compact, no title/author/length */}
      {continueListening.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Continue Listening</h2>
            <Link href="/history" className="see-all-link">See all</Link>
          </div>
          <ScrollRow books={continueListening} cardWidth={CL_CARD_WIDTH} compact={true} />
        </section>
      )}

      {/* Recent Additions */}
      <section style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">Recent Additions</h2>
          <Link href="/audiobooks" className="see-all-link">Browse all</Link>
        </div>
        <ScrollRow books={recentBooks} />
      </section>

      {/* Recent Articles */}
      {recentArticles.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Latest Articles</h2>
            <Link href="/articles" className="see-all-link">Browse all</Link>
          </div>
          <ArticleScrollRow articles={recentArticles} audiobooks={audiobooks} />
        </section>
      )}

      {/* Explore */}
      <section style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">Explore</h2>
        </div>

        {/* Category pill filter row */}
        <div className="scroll-row" style={{ marginBottom: 20, paddingBottom: 4 }}>
          <button
            className={`pill ${activeTag === null ? 'active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {dailyTags.map((tag) => (
            <button
              key={tag}
              className={`pill ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
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
