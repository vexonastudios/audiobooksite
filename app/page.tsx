'use client';

import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';
import type { Audiobook, Article } from '@/lib/types';
import type { CommunityQuote } from '@/lib/db/quotes';
import Link from 'next/link';
import { Headphones, ChevronRight, ChevronLeft, BookOpen, Quote, ArrowUp, Heart, TrendingUp } from 'lucide-react';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { ScrollRow } from '@/components/ui/ScrollRow';

// ── Constants ──────────────────────────────────────────────────────────────────
const BOOK_CARD_WIDTH = 168;
const CL_CARD_WIDTH = 134;
const ARTICLE_CARD_WIDTH = 240;
const QUOTE_CARD_WIDTH = 280;
const DAY_SEED = Math.floor(Date.now() / 86_400_000); // stable for entire session

const ARTICLE_GRADIENTS = [
  'linear-gradient(135deg,#1e3a5f 0%,#2e6aa7 100%)',
  'linear-gradient(135deg,#3d1f5f 0%,#7c3aed 100%)',
  'linear-gradient(135deg,#1a4731 0%,#15803d 100%)',
  'linear-gradient(135deg,#5f1c1c 0%,#b91c1c 100%)',
  'linear-gradient(135deg,#3d2d0f 0%,#b45309 100%)',
  'linear-gradient(135deg,#0f2d3d 0%,#0369a1 100%)',
];

// ── Shared hook: scroll state for any horizontal scroll container ──────────────
// Eliminates identical checkScroll logic that was duplicated in every scroll row.
// Uses a passive resize listener with requestAnimationFrame throttle to avoid
// forced layout / paint jank on window resize.
function useScrollable(ref: React.RefObject<HTMLDivElement>) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const rafId = useRef<number>(0);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 5);
  }, [ref]);

  // Throttle resize via rAF so we only read layout once per frame
  const onResize = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(check);
  }, [check]);

  useEffect(() => {
    check();
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId.current);
    };
  }, [check, onResize]);

  return { canScrollLeft, canScrollRight, check };
}

// ── Article Card ───────────────────────────────────────────────────────────────
// Wrapped in memo: only re-renders when its own props change, not on every
// parent re-render triggered by tag selection or trending data arriving.
const ArticleCard = memo(function ArticleCard({
  article,
  audiobooks,
  index,
}: {
  article: Article;
  audiobooks: Audiobook[];
  index: number;
}) {
  const sourceBook = article.sourceAudiobookSlug
    ? audiobooks.find(b => b.slug === article.sourceAudiobookSlug)
    : null;
  const gradient = ARTICLE_GRADIENTS[index % ARTICLE_GRADIENTS.length];
  // Cache the formatted date — new Date() + toLocaleDateString is relatively slow
  const date = useMemo(
    () => new Date(article.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    [article.pubDate],
  );

  return (
    <Link href={`/articles/${article.slug}`} className="article-card-link" aria-label={article.title}>
      {/* cursor:pointer removed — <a> already implies it; saves one CSS property per card */}
      <div
        className="article-card"
        style={{ background: gradient }}
        // Direct DOM style mutation avoids React reconciling 2 style objects on every hover
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'translateY(-4px)';
          el.style.boxShadow = '0 10px 28px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = '';
          el.style.boxShadow = '';
        }}
      >
        <p className="article-card-title">{article.title}</p>
        <div>
          <p className="article-card-meta">{article.authorName} · {date}</p>
          {sourceBook && (
            <p className="article-card-source">
              <BookOpen size={10} aria-hidden="true" style={{ flexShrink: 0 }} />
              From: {sourceBook.title}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
});

// ── Article Scroll Row ─────────────────────────────────────────────────────────
function ArticleScrollRow({ articles, audiobooks }: { articles: Article[]; audiobooks: Audiobook[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { canScrollLeft, canScrollRight, check } = useScrollable(ref);

  const scrollBy = useCallback((delta: number) => {
    ref.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  return (
    <div className="scroll-row-wrapper" onMouseEnter={check}>
      <div className="scroll-row" ref={ref} onScroll={check}>
        {articles.map((a, i) => (
          <ArticleCard key={a.id} article={a} audiobooks={audiobooks} index={i} />
        ))}
      </div>
      {canScrollLeft && (
        <>
          <div className="scroll-fade left" aria-hidden="true" />
          <button className="scroll-arrow left" onClick={() => scrollBy(-(ARTICLE_CARD_WIDTH + 14) * 3)} aria-label="Scroll articles left">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="scroll-fade right" aria-hidden="true" />
          <button className="scroll-arrow right" onClick={() => scrollBy((ARTICLE_CARD_WIDTH + 14) * 3)} aria-label="Scroll articles right">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Format seconds ─────────────────────────────────────────────────────────────
function formatListenTime(s: number): string {
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return '< 1m';
}

// ── Hero Subtitle ──────────────────────────────────────────────────────────────
interface PersonalStats { totalListenSecs: number; booksStarted: number; quotesSaved: number; }

function HeroSubtitle({ audiobookCount }: { audiobookCount: number }) {
  const isSignedIn = useUserStore(s => s.isSignedIn);

  // Start loading immediately when signed in — avoids the one-frame flash where
  // we'd show the generic subtitle before the effect fires.
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(() => isSignedIn);

  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();
    setStatsLoading(true);
    fetch('/api/user/stats', { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
    return () => controller.abort();
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <p className="hero-subtitle">
        {audiobookCount} audiobooks from classic authors — always free.
      </p>
    );
  }

  if (statsLoading && !stats) {
    return (
      <div className="hero-stats">
        {([88, 70, 72] as const).map((w, i) => (
          <span key={i} className="skeleton" style={{ height: 18, width: w, borderRadius: 6, display: 'inline-block' }} />
        ))}
      </div>
    );
  }

  if (!stats || stats.booksStarted === 0) {
    return (
      <p className="hero-subtitle">
        {audiobookCount} audiobooks from classic authors — always free.
      </p>
    );
  }

  return (
    <div className="hero-stats">
      <span className="hero-stat">
        <Headphones size={15} aria-hidden="true" className="hero-stat-icon" />
        <strong>{formatListenTime(stats.totalListenSecs)}</strong>
        &nbsp;listened all-time
      </span>
      <span className="hero-stat">
        <BookOpen size={15} aria-hidden="true" className="hero-stat-icon" />
        <strong>{stats.booksStarted}</strong>
        &nbsp;{stats.booksStarted === 1 ? 'book' : 'books'} started
      </span>
      {stats.quotesSaved > 0 && (
        <span className="hero-stat">
          <Quote size={15} aria-hidden="true" className="hero-stat-icon" />
          <strong>{stats.quotesSaved}</strong>
          &nbsp;{stats.quotesSaved === 1 ? 'quote' : 'quotes'} saved
        </span>
      )}
    </div>
  );
}

// ── Community Quote Card ───────────────────────────────────────────────────────
const HomeCommunityQuoteCard = memo(function HomeCommunityQuoteCard({ q }: { q: CommunityQuote }) {
  return (
    <Link
      href={`/audiobook/${q.bookSlug}?t=${Math.floor(q.time)}`}
      className="quote-card-link"
      aria-label={`Quote from ${q.bookAuthor}: ${q.text.slice(0, 80)}`}
    >
      <article className="quote-card">
        <p className="quote-card-text">{q.text}</p>
        <footer className="quote-card-footer">
          <div className="quote-card-author">
            {q.bookCover && (
              <img
                src={q.bookCover}
                alt=""
                width={22}
                height={22}
                loading="lazy"
                className="quote-card-cover"
              />
            )}
            <span className="quote-card-author-name">{q.bookAuthor}</span>
          </div>
          <div className="quote-card-badges">
            {q.upvotesCount > 0 && (
              <span className="badge badge-brand" aria-label={`${q.upvotesCount} upvotes`}>
                <ArrowUp size={10} aria-hidden="true" /> {q.upvotesCount}
              </span>
            )}
            {q.savesCount > 1 && (
              <span className="badge badge-muted" aria-label={`${q.savesCount} saves`}>
                <Heart size={10} aria-hidden="true" /> {q.savesCount}
              </span>
            )}
          </div>
        </footer>
      </article>
    </Link>
  );
});

// ── Community Quotes Row ───────────────────────────────────────────────────────
function CommunityQuotesScrollRow({ quotes }: { quotes: CommunityQuote[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { canScrollLeft, canScrollRight, check } = useScrollable(ref);

  const scrollBy = useCallback((delta: number) => {
    ref.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  return (
    <div className="scroll-row-wrapper" onMouseEnter={check}>
      <div className="scroll-row" ref={ref} onScroll={check}>
        {quotes.map(q => <HomeCommunityQuoteCard key={q.id} q={q} />)}
      </div>
      {canScrollLeft && (
        <>
          <div className="scroll-fade left" aria-hidden="true" />
          <button className="scroll-arrow left" onClick={() => scrollBy(-(QUOTE_CARD_WIDTH + 14) * 3)} aria-label="Scroll quotes left">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="scroll-fade right" aria-hidden="true" />
          <button className="scroll-arrow right" onClick={() => scrollBy((QUOTE_CARD_WIDTH + 14) * 3)} aria-label="Scroll quotes right">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Skeleton Row ───────────────────────────────────────────────────────────────
function SkeletonRow({ count = 5, width = BOOK_CARD_WIDTH, height = 230 }) {
  return (
    <div style={{ display: 'flex', gap: 16 }} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ width, height, flexShrink: 0, borderRadius: 'var(--radius-lg)' }} />
      ))}
    </div>
  );
}

// ── Daily seeded deterministic shuffle (pure, no side effects) ─────────────────
function dailyShuffle<T extends { id: string }>(items: T[], seed = DAY_SEED): T[] {
  return [...items].sort((a, b) => ((a.id.charCodeAt(0) * 31 + seed) % 997) - ((b.id.charCodeAt(0) * 31 + seed) % 997));
}

// ── Home Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { audiobooks, articles, isLoaded, getRecent } = useLibraryStore();
  const history = useUserStore(s => s.history);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [communityQuotes, setCommunityQuotes] = useState<CommunityQuote[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<Audiobook[]>([]);

  // ── Memoized derivations ─────────────────────────────────────────────────────
  // getRecent is a stable store fn; audiobooks is the real dep.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recentBooks = useMemo(() => getRecent(20), [audiobooks]);
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

  // 15 daily pill tags — shuffled once per calendar day
  const dailyTags = useMemo(() => {
    const all = Array.from(new Set([...categories, ...topics])).sort();
    if (all.length === 0) return [];
    return dailyShuffle(all.map(t => ({ id: t }))).slice(0, 15).map(x => x.id);
  }, [categories, topics]);

  // Explore pool: full library minus recent 20, shuffled daily
  const dailyExplore = useMemo(() => {
    if (audiobooks.length === 0) return [];
    const recentIds = new Set(recentBooks.map(b => b.id));
    return dailyShuffle(audiobooks.filter(b => !recentIds.has(b.id))).slice(0, 20);
  }, [audiobooks, recentBooks]);

  // Continue Listening: O(1) Map lookup instead of O(n) find per entry
  const continueListening = useMemo(() => {
    const map = new Map(audiobooks.map(b => [b.id, b]));
    return history.slice(0, 10).map(h => map.get(h.bookId)).filter(Boolean) as Audiobook[];
  }, [history, audiobooks]);

  // Explore display list
  const exploreBooks = useMemo(() => {
    if (!activeTag) return dailyExplore;
    return audiobooks
      .filter(b => b.categories?.includes(activeTag) || b.topics?.includes(activeTag))
      .slice(0, 20);
  }, [activeTag, audiobooks, dailyExplore]);

  // ── Fetch secondary data (community quotes + trending) in parallel ───────────
  // Both use AbortController so navigating away never causes post-unmount setState.
  useEffect(() => {
    const ac = new AbortController();
    Promise.all([
      fetch('/api/quotes/community?limit=12&sort=popular', { signal: ac.signal })
        .then(r => r.ok ? r.json() : null),
      fetch('/api/analytics/trending', { signal: ac.signal })
        .then(r => r.ok ? r.json() : null),
    ]).then(([qData, tData]) => {
      if (qData?.quotes?.length) setCommunityQuotes(qData.quotes);
      if (tData?.books?.length) setTrendingBooks(tData.books);
    }).catch(() => {}); // AbortError and network errors silently ignored
    return () => ac.abort();
  }, []);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="page" aria-busy="true">
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: 16, borderRadius: 8 }} />
        <SkeletonRow />
      </div>
    );
  }

  return (
    <div className="page">
      <NotificationBanner />

      {/* Hero */}
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
            {/* aria-hidden on decorative icon so screen readers say "Trending This Week", not "up-trend Trending This Week" */}
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} aria-hidden="true" style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
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

        {/* Tag pill filter */}
        <div className="scroll-row" style={{ marginBottom: 20, paddingBottom: 4 }} role="group" aria-label="Filter by category">
          <button
            className={`pill ${activeTag === null ? 'active' : ''}`}
            onClick={() => setActiveTag(null)}
            aria-pressed={activeTag === null}
          >
            All
          </button>
          {dailyTags.map(tag => (
            <button
              key={tag}
              className={`pill ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              aria-pressed={activeTag === tag}
            >
              {tag}
            </button>
          ))}
        </div>

        {exploreBooks.length === 0
          ? <SkeletonRow />
          : <ScrollRow books={exploreBooks} />
        }
      </section>

      {/* Stats banner */}
      <div className="stats-banner" role="complementary" aria-label="Library stats">
        <Headphones size={40} aria-hidden="true" style={{ opacity: 0.8, flexShrink: 0 }} />
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
