'use client';

import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { useUserStore } from '@/lib/store/userStore';
import type { Audiobook, Article } from '@/lib/types';
import type { CommunityQuote } from '@/lib/db/quotes';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft, BookOpen, Quote, ArrowUp, Heart, TrendingUp, Headphones,
  Bookmark, Search, Smartphone, HistoryIcon, UserPlus, RefreshCw, Star, X,
} from 'lucide-react';
import { SignInButton } from '@clerk/nextjs';
import { ScrollRow } from '@/components/ui/ScrollRow';

// ── Constants ──────────────────────────────────────────────────────────────────
const CL_CARD_WIDTH = 134;
const BOOK_CARD_WIDTH = 168;
const ARTICLE_CARD_WIDTH = 240;
const QUOTE_CARD_WIDTH = 280;
const DAY_SEED = Math.floor(Date.now() / 86_400_000);

const ARTICLE_GRADIENTS = [
  'linear-gradient(135deg,#1e3a5f 0%,#2e6aa7 100%)',
  'linear-gradient(135deg,#3d1f5f 0%,#7c3aed 100%)',
  'linear-gradient(135deg,#1a4731 0%,#15803d 100%)',
  'linear-gradient(135deg,#5f1c1c 0%,#b91c1c 100%)',
  'linear-gradient(135deg,#3d2d0f 0%,#b45309 100%)',
  'linear-gradient(135deg,#0f2d3d 0%,#0369a1 100%)',
];

// ── Shared scroll hook ─────────────────────────────────────────────────────────
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

// ── Daily shuffle (pure) ───────────────────────────────────────────────────────
function dailyShuffle<T extends { id: string }>(items: T[], seed = DAY_SEED): T[] {
  return [...items].sort(
    (a, b) => ((a.id.charCodeAt(0) * 31 + seed) % 997) - ((b.id.charCodeAt(0) * 31 + seed) % 997),
  );
}

// ── Skeleton row ───────────────────────────────────────────────────────────────
function SkeletonRow({ count = 5, width = BOOK_CARD_WIDTH, height = 230 }) {
  return (
    <div style={{ display: 'flex', gap: 16 }} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ width, height, flexShrink: 0, borderRadius: 'var(--radius-lg)' }} />
      ))}
    </div>
  );
}

// ── Article Card ───────────────────────────────────────────────────────────────
const ArticleCard = memo(function ArticleCard({
  article, audiobooks, index,
}: { article: Article; audiobooks: Audiobook[]; index: number }) {
  const sourceBook = article.sourceAudiobookSlug
    ? audiobooks.find(b => b.slug === article.sourceAudiobookSlug)
    : null;
  const gradient = ARTICLE_GRADIENTS[index % ARTICLE_GRADIENTS.length];
  const date = useMemo(
    () => new Date(article.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    [article.pubDate],
  );
  return (
    <Link href={`/articles/${article.slug}`} className="article-card-link" aria-label={article.title}>
      <div
        className="article-card"
        style={{ background: gradient }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 10px 28px rgba(0,0,0,0.2)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = ''; }}
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
  const scrollBy = useCallback((d: number) => ref.current?.scrollBy({ left: d, behavior: 'smooth' }), []);
  return (
    <div className="scroll-row-wrapper" onMouseEnter={check}>
      <div className="scroll-row" ref={ref} onScroll={check}>
        {articles.map((a, i) => <ArticleCard key={a.id} article={a} audiobooks={audiobooks} index={i} />)}
      </div>
      {canScrollLeft && (<><div className="scroll-fade left" aria-hidden="true" /><button className="scroll-arrow left" onClick={() => scrollBy(-(ARTICLE_CARD_WIDTH + 14) * 3)} aria-label="Scroll articles left"><ChevronLeft size={18} aria-hidden="true" /></button></>)}
      {canScrollRight && (<><div className="scroll-fade right" aria-hidden="true" /><button className="scroll-arrow right" onClick={() => scrollBy((ARTICLE_CARD_WIDTH + 14) * 3)} aria-label="Scroll articles right"><ChevronRight size={18} aria-hidden="true" /></button></>)}
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
            {q.bookCover && <img src={q.bookCover} alt="" width={22} height={22} loading="lazy" className="quote-card-cover" />}
            <span className="quote-card-author-name">{q.bookAuthor}</span>
          </div>
          <div className="quote-card-badges">
            {q.upvotesCount > 0 && <span className="badge badge-brand" aria-label={`${q.upvotesCount} upvotes`}><ArrowUp size={10} aria-hidden="true" /> {q.upvotesCount}</span>}
            {q.savesCount > 1 && <span className="badge badge-muted" aria-label={`${q.savesCount} saves`}><Heart size={10} aria-hidden="true" /> {q.savesCount}</span>}
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
  const scrollBy = useCallback((d: number) => ref.current?.scrollBy({ left: d, behavior: 'smooth' }), []);
  return (
    <div className="scroll-row-wrapper" onMouseEnter={check}>
      <div className="scroll-row" ref={ref} onScroll={check}>
        {quotes.map(q => <HomeCommunityQuoteCard key={q.id} q={q} />)}
      </div>
      {canScrollLeft && (<><div className="scroll-fade left" aria-hidden="true" /><button className="scroll-arrow left" onClick={() => scrollBy(-(QUOTE_CARD_WIDTH + 14) * 3)} aria-label="Scroll quotes left"><ChevronLeft size={18} aria-hidden="true" /></button></>)}
      {canScrollRight && (<><div className="scroll-fade right" aria-hidden="true" /><button className="scroll-arrow right" onClick={() => scrollBy((QUOTE_CARD_WIDTH + 14) * 3)} aria-label="Scroll quotes right"><ChevronRight size={18} aria-hidden="true" /></button></>)}
    </div>
  );
}

// ── Format listen time ─────────────────────────────────────────────────────────
function formatListenTime(s: number) {
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return '< 1m';
}

// ── Hero Subtitle (auth-aware) ─────────────────────────────────────────────────
interface PersonalStats { totalListenSecs: number; booksStarted: number; quotesSaved: number; }
function HeroSubtitle({ audiobookCount }: { audiobookCount: number }) {
  const isSignedIn = useUserStore(s => s.isSignedIn);
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [loading, setLoading] = useState(() => isSignedIn);

  useEffect(() => {
    if (!isSignedIn) return;
    const ac = new AbortController();
    setLoading(true);
    fetch('/api/user/stats', { signal: ac.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [isSignedIn]);

  if (!isSignedIn) return <p className="hero-subtitle">{audiobookCount} audiobooks from classic authors — always free.</p>;
  if (loading && !stats) return <div className="hero-stats">{[88, 70, 72].map((w, i) => <span key={i} className="skeleton" style={{ height: 18, width: w, borderRadius: 6, display: 'inline-block' }} />)}</div>;
  if (!stats || stats.booksStarted === 0) return <p className="hero-subtitle">{audiobookCount} audiobooks from classic authors — always free.</p>;

  return (
    <div className="hero-stats hero-mobile-hidden">
      <span className="hero-stat"><Headphones size={15} aria-hidden="true" className="hero-stat-icon" /><strong>{formatListenTime(stats.totalListenSecs)}</strong>&nbsp;listened all-time</span>
      <span className="hero-stat"><BookOpen size={15} aria-hidden="true" className="hero-stat-icon" /><strong>{stats.booksStarted}</strong>&nbsp;{stats.booksStarted === 1 ? 'book' : 'books'} started</span>
      {stats.quotesSaved > 0 && <span className="hero-stat"><Quote size={15} aria-hidden="true" className="hero-stat-icon" /><strong>{stats.quotesSaved}</strong>&nbsp;{stats.quotesSaved === 1 ? 'quote' : 'quotes'} saved</span>}
    </div>
  );
}

// ── Continue Listening side panel ────────────────────────────────────────────
// Shown on desktop when the user has < 5 books, filling the wasted whitespace
// with genuinely useful content rather than an empty grey expanse.

const FEATURE_TIPS = [
  {
    icon: Bookmark,
    title: 'Bookmarks',
    desc: 'Tap ⋮ on any audiobook to pin a moment in time — great for quotes you want to revisit.',
  },
  {
    icon: Quote,
    title: 'Save Quotes',
    desc: 'Highlight any transcript line while listening to save it to your personal quote collection.',
  },
  {
    icon: Search,
    title: 'Explore by Topic',
    desc: 'Filter by Missions, Prayer, Puritan, Biography and more using the Explore section below.',
  },
  {
    icon: HistoryIcon,
    title: 'Listening History',
    desc: 'Every book you start is tracked. Pick up exactly where you left off, any time.',
  },
  {
    icon: Smartphone,
    title: 'Add to Home Screen',
    desc: 'Open in your browser then tap Share → Add to Home Screen for an app-like experience.',
  },
];

function ContinueListeningSection({
  books,
  isSignedIn,
}: {
  books: Audiobook[];
  isSignedIn: boolean;
}) {
  // Show the panel on desktop when there are fewer than 5 books (lots of wasted space)
  const showPanel = books.length < 5;

  // Pick 2 tips to show — rotate daily so returning users see variety
  const tipSeed = Math.floor(Date.now() / 86_400_000) % FEATURE_TIPS.length;
  const tips = [
    FEATURE_TIPS[tipSeed % FEATURE_TIPS.length],
    FEATURE_TIPS[(tipSeed + 1) % FEATURE_TIPS.length],
  ];

  return (
    <section style={{ marginBottom: 40 }}>
      <div className="section-header">
        <h2 className="section-title">Continue Listening</h2>
        <Link href="/history" className="see-all-link">See all</Link>
      </div>
      <div className={`cl-layout${showPanel ? ' cl-layout--with-panel' : ''}`}>
        {/* Book covers */}
        <div className="cl-books">
          <ScrollRow books={books} cardWidth={CL_CARD_WIDTH} compact={true} />
        </div>

        {/* Side panel — desktop only, only when < 5 books */}
        {showPanel && (
          <aside className="cl-panel" aria-label="Site features">
            {isSignedIn ? (
              // ── Feature discovery for signed-in light users ──────────────────
              <div className="cl-panel-inner">
                <p className="cl-panel-eyebrow">
                  <Star size={13} aria-hidden="true" style={{ color: 'var(--color-brand)' }} />
                  Did you know?
                </p>
                <div className="cl-tips">
                  {tips.map((tip, i) => (
                    <div key={i} className="cl-tip">
                      <div className="cl-tip-icon">
                        <tip.icon size={15} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="cl-tip-title">{tip.title}</p>
                        <p className="cl-tip-desc">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // ── Sign-up CTA for guests ───────────────────────────────────────
              <div className="cl-panel-inner cl-panel-cta">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="cl-cta-icon">
                    <UserPlus size={15} aria-hidden="true" />
                  </div>
                  <h3 className="cl-cta-title">Free account — worth it</h3>
                </div>
                <ul className="cl-cta-list" aria-label="Account benefits">
                  <li>
                    <RefreshCw size={13} aria-hidden="true" />
                    Sync progress across all your devices
                  </li>
                  <li>
                    <Bookmark size={13} aria-hidden="true" />
                    Save bookmarks &amp; favourite quotes
                  </li>
                  <li>
                    <HistoryIcon size={13} aria-hidden="true" />
                    Full listening history, always intact
                  </li>
                </ul>
                <SignInButton mode="modal">
                  <button className="cl-cta-btn" aria-label="Sign in or create a free account">
                    Sign in free →
                  </button>
                </SignInButton>
              </div>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}

// ── Props from the server page ─────────────────────────────────────────────────
export interface HomeInteractiveProps {
  /** Pre-fetched by the RSC — used immediately, no Zustand wait needed */
  serverRecentBooks: Audiobook[];
  serverArticles: Article[];
  audiobookCount: number;
}

/**
 * All client-interactive sections of the home page.
 * Receives server-fetched recent books + articles as props so they render
 * immediately without waiting for LibraryProvider's /api/library fetch.
 *
 * Also reads from the libraryStore once it loads (for Continue Listening,
 * Explore full pool, and tag pills).
 */
export function HomeInteractive({ serverRecentBooks, serverArticles, audiobookCount }: HomeInteractiveProps) {
  const { audiobooks, isLoaded } = useLibraryStore();
  const history = useUserStore(s => s.history);
  const isSignedIn = useUserStore(s => s.isSignedIn);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [communityQuotes, setCommunityQuotes] = useState<CommunityQuote[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<Audiobook[]>([]);
  const [showStatsBanner, setShowStatsBanner] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydration guard — prevents SSR/client mismatch on non-deterministic daily shuffle
  useEffect(() => { setMounted(true); }, []);

  // Check if user previously dismissed the banner
  useEffect(() => {
    if (localStorage.getItem('hideStatsBanner')) {
      setShowStatsBanner(false);
    }
  }, []);

  const dismissStatsBanner = () => {
    setShowStatsBanner(false);
    localStorage.setItem('hideStatsBanner', 'true');
  };

  // Use server-fetched books immediately; fall through to store once loaded
  const recentBooks = isLoaded
    ? [...audiobooks].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()).slice(0, 20)
    : serverRecentBooks;
  const articles = isLoaded ? audiobooks.length > 0 ? serverArticles : serverArticles : serverArticles;

  // Memoize expensive derivations (only runs when full store is loaded)
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

  const dailyTags = useMemo(() => {
    const all = Array.from(new Set([...categories, ...topics])).sort();
    if (!all.length) return [];
    if (!mounted) return all.slice(0, 15);
    return dailyShuffle(all.map(t => ({ id: t }))).slice(0, 15).map(x => x.id);
  }, [categories, topics, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  const dailyExplore = useMemo(() => {
    if (!audiobooks.length) return [];
    const recentIds = new Set(recentBooks.map(b => b.id));
    const pool = audiobooks.filter(b => !recentIds.has(b.id));
    if (!mounted) return pool.slice(0, 20);
    return dailyShuffle(pool).slice(0, 20);
  }, [audiobooks, recentBooks, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  const continueListening = useMemo(() => {
    const map = new Map(audiobooks.map(b => [b.id, b]));
    return history.slice(0, 10).map(h => map.get(h.bookId)).filter(Boolean) as Audiobook[];
  }, [history, audiobooks]);

  const exploreBooks = useMemo(() => {
    if (!activeTag) return dailyExplore;
    return audiobooks.filter(b => b.categories?.includes(activeTag) || b.topics?.includes(activeTag)).slice(0, 20);
  }, [activeTag, audiobooks, dailyExplore]);

  // Fetch community quotes + trending in parallel, once on mount
  useEffect(() => {
    const ac = new AbortController();
    Promise.all([
      fetch('/api/quotes/community?limit=12&sort=popular', { signal: ac.signal }).then(r => r.ok ? r.json() : null),
      fetch('/api/analytics/trending', { signal: ac.signal }).then(r => r.ok ? r.json() : null),
    ]).then(([qData, tData]) => {
      if (qData?.quotes?.length) setCommunityQuotes(qData.quotes);
      if (tData?.books?.length) setTrendingBooks(tData.books);
    }).catch(() => {});
    return () => ac.abort();
  }, []);

  return (
    <>
      {/* Hero subtitle — auth-aware, fetches personal stats */}
      <div style={{ marginBottom: 32 }}>
        <HeroSubtitle audiobookCount={audiobookCount} />
      </div>

      {/* Continue Listening — smart layout with side panel on desktop when < 5 books */}
      {continueListening.length > 0 && (
        <ContinueListeningSection books={continueListening} isSignedIn={isSignedIn} />
      )}

      {/* Recent Additions — starts with server data, smooth upgrade when store loads */}
      <section style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">Recent Additions</h2>
          <Link href="/audiobooks" className="see-all-link">Browse all</Link>
        </div>
        <ScrollRow books={recentBooks} />
      </section>

      {/* Stats Banner — dismissible CTA */}
      {showStatsBanner && (
        <div className="stats-banner" role="complementary" aria-label="Library stats">
          <button className="stats-banner-close" onClick={dismissStatsBanner} aria-label="Dismiss">
            <X size={18} aria-hidden="true" />
          </button>
          <Headphones size={40} aria-hidden="true" style={{ opacity: 0.8, flexShrink: 0 }} className="stats-banner-icon" />
          <div>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', marginBottom: 4 }} className="stats-banner-title">
              {audiobookCount} Audiobooks — All Free, Forever
            </h2>
            <p style={{ opacity: 0.85, fontSize: '0.9375rem', margin: 0 }} className="stats-banner-text">
              Classic Christian literature from missionary biographies to Puritan devotions. No subscription needed.
            </p>
          </div>
        </div>
      )}

      {/* Trending This Week */}
      {trendingBooks.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} aria-hidden="true" style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
              Trending This Week
            </h2>
          </div>
          <ScrollRow books={trendingBooks} />
        </section>
      )}

      {/* Latest Articles */}
      {articles.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Latest Articles</h2>
            <Link href="/articles" className="see-all-link">Browse all</Link>
          </div>
          <ArticleScrollRow articles={articles} audiobooks={audiobooks.length ? audiobooks : serverRecentBooks} />
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
        <div className="scroll-row" style={{ marginBottom: 20, paddingBottom: 4 }} role="group" aria-label="Filter by category">
          <button className={`pill ${!activeTag ? 'active' : ''}`} onClick={() => setActiveTag(null)} aria-pressed={!activeTag}>All</button>
          {dailyTags.map(tag => (
            <button key={tag} className={`pill ${activeTag === tag ? 'active' : ''}`} onClick={() => setActiveTag(activeTag === tag ? null : tag)} aria-pressed={activeTag === tag}>{tag}</button>
          ))}
        </div>
        {exploreBooks.length === 0
          ? <div style={{ display: 'flex', gap: 16 }}>{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton" style={{ width: BOOK_CARD_WIDTH, height: 230, flexShrink: 0, borderRadius: 'var(--radius-lg)' }} />)}</div>
          : <ScrollRow books={exploreBooks} />
        }
      </section>
    </>
  );
}
