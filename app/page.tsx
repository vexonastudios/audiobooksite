'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';
import type { Audiobook, Article } from '@/lib/types';
import type { CommunityQuote } from '@/lib/db/quotes';
import Link from 'next/link';
import { Headphones, ChevronRight, ChevronLeft, BookOpen, Quote, ArrowUp, Heart, TrendingUp } from 'lucide-react';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { ScrollRow } from '@/components/ui/ScrollRow';

const BOOK_CARD_WIDTH = 168;
const CL_CARD_WIDTH = 134;

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
  }, []); // articles length won't change after load; resize is the only trigger needed

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

// ── Format seconds as "Xh Ym" or "Xm" ────────────────────────────────────────
function formatListenTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return '< 1m';
}

// ── Hero subtitle: personalized for signed-in users ───────────────────────────
interface PersonalStats {
  totalListenSecs: number;
  booksStarted: number;
  quotesSaved: number;
}

function HeroSubtitle({ audiobookCount }: { audiobookCount: number }) {
  const isSignedIn = useUserStore(s => s.isSignedIn);
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    // Abort controller prevents state updates after unmount or re-trigger
    const controller = new AbortController();
    setStatsLoading(true);
    fetch('/api/user/stats', { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {}) // AbortError silently ignored too
      .finally(() => setStatsLoading(false));
    return () => controller.abort();
  }, [isSignedIn]);

  // Not signed in — generic subtitle
  if (!isSignedIn) {
    return (
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
        {audiobookCount} audiobooks from classic authors — always free.
      </p>
    );
  }

  // Signed in but still fetching on first load — show skeleton
  if (statsLoading && !stats) {
    return (
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4 }}>
        {[88, 70, 72].map((w, i) => (
          <span key={i} className="skeleton" style={{ height: 18, width: w, borderRadius: 6, display: 'inline-block' }} />
        ))}
      </div>
    );
  }

  // No listening history yet
  if (!stats || stats.booksStarted === 0) {
    return (
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
        {audiobookCount} audiobooks from classic authors — always free.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: '0.925rem', color: 'var(--color-text-secondary)',
      }}>
        <Headphones size={15} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
        <strong style={{ color: 'var(--color-text-primary)' }}>{formatListenTime(stats.totalListenSecs)}</strong>
        &nbsp;listened all-time
      </span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: '0.925rem', color: 'var(--color-text-secondary)',
      }}>
        <BookOpen size={15} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
        <strong style={{ color: 'var(--color-text-primary)' }}>{stats.booksStarted}</strong>
        &nbsp;{stats.booksStarted === 1 ? 'book' : 'books'} started
      </span>
      {stats.quotesSaved > 0 && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '0.925rem', color: 'var(--color-text-secondary)',
        }}>
          <Quote size={15} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
          <strong style={{ color: 'var(--color-text-primary)' }}>{stats.quotesSaved}</strong>
          &nbsp;{stats.quotesSaved === 1 ? 'quote' : 'quotes'} saved
        </span>
      )}
    </div>
  );
}

// ── Compact community quote card for home page preview ────────────────────────
function HomeCommunityQuoteCard({ q }: { q: CommunityQuote }) {
  return (
    <Link
      href={`/audiobook/${q.bookSlug}?t=${Math.floor(q.time)}`}
      style={{ textDecoration: 'none', flexShrink: 0, width: 280 }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: '16px 18px',
          height: 160,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow = '';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
        }}
      >
        <p style={{
          margin: 0,
          fontSize: '0.85rem',
          lineHeight: 1.55,
          fontStyle: 'italic',
          color: 'var(--color-text-primary)',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          paddingLeft: 10,
          borderLeft: '3px solid var(--color-brand)',
        }}>
          {q.text}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            {q.bookCover && (
              <img
                src={q.bookCover}
                alt=""
                style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <span style={{
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {q.bookAuthor}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
            {q.upvotesCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: '0.7rem', fontWeight: 700,
                color: 'var(--color-brand)',
                background: 'rgba(46,106,167,0.1)',
                borderRadius: 20, padding: '2px 7px',
              }}>
                <ArrowUp size={10} /> {q.upvotesCount}
              </span>
            )}
            {q.savesCount > 1 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: '0.7rem', fontWeight: 700,
                color: 'var(--color-text-muted)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 20, padding: '2px 7px',
              }}>
                <Heart size={10} /> {q.savesCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Community Quotes scroll row ───────────────────────────────────────────────
function CommunityQuotesScrollRow({ quotes }: { quotes: CommunityQuote[] }) {
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
  }, []);

  return (
    <div className="scroll-row-wrapper" onMouseEnter={checkScroll}>
      <div className="scroll-row" ref={ref} onScroll={checkScroll}>
        {quotes.map(q => (
          <HomeCommunityQuoteCard key={q.id} q={q} />
        ))}
      </div>
      {canScrollLeft && (
        <>
          <div className="scroll-fade left" />
          <button className="scroll-arrow left" onClick={() => ref.current?.scrollBy({ left: -(280 + 14) * 3, behavior: 'smooth' })} aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="scroll-fade right" />
          <button className="scroll-arrow right" onClick={() => ref.current?.scrollBy({ left: (280 + 14) * 3, behavior: 'smooth' })} aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { audiobooks, articles, isLoaded, getRecent } = useLibraryStore();
  const history = useUserStore((s) => s.history);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [dailyTags, setDailyTags] = useState<string[]>([]);
  const [dailyExplore, setDailyExplore] = useState<Audiobook[]>([]);

  // Memoize expensive derived lists — only recomputes when audiobooks/articles change
  const recentBooks = useMemo(() => getRecent(20), [audiobooks]); // eslint-disable-line react-hooks/exhaustive-deps
  const recentArticles = useMemo(() => articles.slice(0, 20), [articles]);
  const categories = useMemo(() => {
    const s = new Set<string>();
    audiobooks.forEach(b => b.categories.forEach(c => s.add(c)));
    return Array.from(s).sort();
  }, [audiobooks]);
  const topics = useMemo(() => {
    const s = new Set<string>();
    audiobooks.forEach(b => b.topics.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [audiobooks]);

  // Community quotes for home page preview
  const [communityQuotes, setCommunityQuotes] = useState<CommunityQuote[]>([]);

  // Trending this week
  const [trendingBooks, setTrendingBooks] = useState<Audiobook[]>([]);

  // Fetch community quotes once on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/quotes/community?limit=12&sort=popular', { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.quotes?.length) setCommunityQuotes(data.quotes); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Fetch trending once on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/analytics/trending', { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.books?.length) setTrendingBooks(data.books); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Build daily pill tags when categories/topics change
  useEffect(() => {
    const allTags = Array.from(new Set([...categories, ...topics])).sort();
    if (allTags.length === 0) return;
    const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const shuffled = [...allTags].sort((a, b) => {
      const hashA = (a.charCodeAt(0) + seed) % 100;
      const hashB = (b.charCodeAt(0) + seed) % 100;
      return hashA - hashB;
    });
    setDailyTags(shuffled.slice(0, 15));
  }, [categories, topics]);

  // Build daily-shuffled Explore pool when books load (excludes recent 20)
  useEffect(() => {
    if (audiobooks.length === 0) return;
    const recentIds = new Set(recentBooks.map(b => b.id));
    const pool = audiobooks.filter(b => !recentIds.has(b.id));
    const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const shuffled = [...pool].sort((a, b) => {
      const hashA = (a.id.charCodeAt(0) * 31 + seed) % 997;
      const hashB = (b.id.charCodeAt(0) * 31 + seed) % 997;
      return hashA - hashB;
    });
    setDailyExplore(shuffled.slice(0, 20));
  }, [audiobooks, recentBooks]);

  // "Continue Listening" — memoized to avoid O(n) search on every render
  const continueListening = useMemo(() => {
    const bookMap = new Map(audiobooks.map(b => [b.id, b]));
    return history
      .slice(0, 10)
      .map(h => bookMap.get(h.bookId))
      .filter(Boolean) as Audiobook[];
  }, [history, audiobooks]);

  // "Explore" row — tag-filtered or daily shuffle
  const exploreBooks = useMemo(() => {
    if (activeTag) {
      return audiobooks
        .filter(b => b.categories?.includes(activeTag) || b.topics?.includes(activeTag))
        .slice(0, 20);
    }
    return dailyExplore;
  }, [activeTag, audiobooks, dailyExplore]);

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
        <h1 style={{ marginBottom: 8 }}>Free Christian Audiobooks</h1>
        <HeroSubtitle audiobookCount={audiobooks.length} />
      </div>

      {/* Continue Listening */}
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

      {/* Trending This Week */}
      {trendingBooks.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} style={{ color: 'var(--color-brand)' }} />
              Trending This Week
            </h2>
          </div>
          <ScrollRow books={trendingBooks} />
        </section>
      )}

      {/* Latest Articles */}
      {recentArticles.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Latest Articles</h2>
            <Link href="/articles" className="see-all-link">Browse all</Link>
          </div>
          <ArticleScrollRow articles={recentArticles} audiobooks={audiobooks} />
        </section>
      )}

      {/* Community Quotes */}
      {communityQuotes.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Community Quotes</h2>
            <Link href="/quotes" className="see-all-link">View all quotes</Link>
          </div>
          <CommunityQuotesScrollRow quotes={communityQuotes} />
        </section>
      )}

      {/* Explore */}
      <section style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">Explore</h2>
          <Link href="/audiobooks" className="see-all-link">Browse all</Link>
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

        {/* Skeleton while daily shuffle is being built */}
        {exploreBooks.length === 0 ? (
          <div style={{ display: 'flex', gap: 16 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton" style={{ width: BOOK_CARD_WIDTH, height: 230, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : (
          <ScrollRow books={exploreBooks} />
        )}
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
