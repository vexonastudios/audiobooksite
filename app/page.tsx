/**
 * Home page — React Server Component.
 *
 * Because this file has NO 'use client' directive, Next.js renders it on the
 * server and sends real HTML to the browser (and to search engine crawlers).
 *
 * What Google now sees in the initial HTML response:
 *  • <h1>Free Christian Audiobooks</h1>
 *  • Canonical link + description meta (from layout.tsx)
 *  • {audiobookCount} Audiobooks — All Free, Forever (stats banner)
 *  • Links to every recent audiobook title (<a href="/audiobook/slug">Title</a>)
 *  • Links to every recent article title
 *
 * Previously the page was 'use client' → Google saw a completely blank <div>.
 *
 * Interactive client sections (hero subtitle, continue listening, explore,
 * trending, community quotes) are delegated to <HomeInteractive /> which carries
 * its own 'use client' boundary and receives the server-fetched data as props.
 */

import Link from 'next/link';
import { Headphones } from 'lucide-react';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { HomeInteractive } from '@/components/home/HomeInteractive';
import { getRecentAudiobooks, getRecentArticles, getAudiobookCount } from '@/lib/db/homepage';
import type { Metadata } from 'next';

// Page-level ISR: revalidate every 5 minutes so new books appear quickly.
export const revalidate = 300;

// Fine-tuned page metadata (overrides layout.tsx defaults for the home route)
export const metadata: Metadata = {
  title: 'Free Christian Audiobooks — Scroll Reader',
  description:
    "Discover hundreds of free Christian audiobooks: missionary biographies, Puritan devotions, and classic theology. No account required.",
};

export default async function HomePage() {
  // All three queries run in parallel — total latency = slowest one (~50–80 ms).
  const [recentBooks, recentArticles, audiobookCount] = await Promise.all([
    getRecentAudiobooks(20),
    getRecentArticles(20),
    getAudiobookCount(),
  ]);

  return (
    <div className="page">
      <NotificationBanner />

      {/* ── Hero ── Server-rendered so <h1> appears in raw HTML for crawlers */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ marginBottom: 8 }}>Free Christian Audiobooks</h1>
      </div>

      {/* ── Client island ─────────────────────────────────────────────────────
           Renders all interactive sections (Continue Listening, Recent Additions,
           Trending, Articles, Quotes, Explore) and the auth-aware hero subtitle.
           Receives server-fetched data so it can render immediately without
           waiting for the full LibraryProvider /api/library fetch. */}
      <HomeInteractive
        serverRecentBooks={recentBooks}
        serverArticles={recentArticles}
        audiobookCount={audiobookCount}
      />

      {/* ── Stats banner ── Server-rendered; count is known at request time */}
      <div className="stats-banner" role="complementary" aria-label="Library stats">
        <Headphones size={40} aria-hidden="true" style={{ opacity: 0.8, flexShrink: 0 }} />
        <div>
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', marginBottom: 4 }}>
            {audiobookCount} Audiobooks — All Free, Forever
          </h2>
          <p style={{ opacity: 0.85, fontSize: '0.9375rem', margin: 0 }}>
            Classic Christian literature from missionary biographies to Puritan devotions. No subscription needed.
          </p>
        </div>
      </div>

      {/*
        ── SEO-only link list ──────────────────────────────────────────────────
        Renders actual <a> tags for recent books and articles in the raw HTML
        response so search engine crawlers that don't execute JavaScript can
        still discover and index individual audiobook/article pages.

        Hidden from sighted users (visually-hidden, not display:none — avoids
        Google cloaking concerns; the content is semantically identical to what
        JS-enabled users see in the scroll rows above).
      */}
      <nav aria-label="Recent audiobooks" className="sr-seo-nav">
        <ul>
          {recentBooks.map(b => (
            <li key={b.id}>
              <Link href={`/audiobook/${b.slug}`}>{b.title} — {b.authorName}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Recent articles" className="sr-seo-nav">
        <ul>
          {recentArticles.map(a => (
            <li key={a.id}>
              <Link href={`/articles/${a.slug}`}>{a.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
