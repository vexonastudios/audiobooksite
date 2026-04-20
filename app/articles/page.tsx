'use client';

import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { BookOpen } from 'lucide-react';
import { HeartButton } from '@/components/ui/HeartButton';

export default function ArticlesIndex() {
  const articles = useLibraryStore((s) => s.articles);
  const isLoaded = useLibraryStore((s) => s.isLoaded);

  if (!isLoaded) {
    return (
      <div className="page">
        <div style={{ height: 48, background: 'var(--color-surface-raised)', borderRadius: 12, marginBottom: 40 }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="page" style={{ maxWidth: 1160 }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-brand)', marginBottom: 10 }}>
          The ScrollReader Journal
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 14px', letterSpacing: '-0.03em' }}>
          Articles & Excerpts
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', maxWidth: 560, margin: 0 }}>
          Devotional writings, historical excerpts, and spiritual reflections. {articles.length} posts to explore.
        </p>
      </div>

      {/* Featured Article */}
      {featured && (
        <Link href={`/articles/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 48 }}>
          <div
            style={{
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              background: featured.coverImage
                ? `url(${featured.coverImage}) center/cover`
                : 'linear-gradient(135deg, #1e3a5f 0%, #2e6aa7 100%)',
              minHeight: 380,
              display: 'flex',
              alignItems: 'flex-end',
              cursor: 'pointer',
              boxShadow: '0 8px 40px rgba(46,106,167,0.18)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            className="featured-card"
          >
            {/* Dark overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(10,20,35,0.88) 0%, rgba(10,20,35,0.3) 60%, transparent 100%)',
            }} />
            <div style={{ position: 'relative', padding: '40px 44px', width: '100%' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span style={{ background: 'rgba(46,106,167,0.88)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 999 }}>
                  Featured
                </span>
                {(featured.categories ?? [])[0] && (
                  <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 999 }}>
                    {featured.categories![0]}
                  </span>
                )}
              </div>
              <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, margin: '0 0 12px', lineHeight: 1.25, maxWidth: 680 }}>
                {featured.title}
              </h2>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 600 }}
                dangerouslySetInnerHTML={{ __html: featured.excerpt || featured.description?.slice(0, 180) + '…' }}
              />
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                By <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{featured.authorName}</strong>
                {' · '}
                {new Date(featured.pubDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Article Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {rest.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            style={{ textDecoration: 'none', display: 'block' }}
            className="article-card-link"
          >
            <article style={{
              background: 'var(--color-surface)',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
            }} className="article-card">
              {/* Cover image or gradient placeholder */}
              <div style={{
                height: 180,
                background: article.coverImage
                  ? `url(${article.coverImage}) center/cover`
                  : `linear-gradient(135deg, hsl(${(parseInt(article.id || '0') * 47) % 360}, 55%, 32%) 0%, hsl(${(parseInt(article.id || '0') * 47 + 60) % 360}, 65%, 45%) 100%)`,
                flexShrink: 0,
                position: 'relative',
              }}>
                {!article.coverImage && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.25 }}>
                    <BookOpen size={48} color="#fff" />
                  </div>
                )}
                {/* Favorite heart overlay */}
                <HeartButton
                  size={16}
                  item={{
                    type: 'article',
                    itemId: article.id,
                    itemSlug: article.slug,
                    title: article.title,
                    author: article.authorName,
                    cover: article.coverImage,
                  }}
                />
              </div>

              {/* Card body */}
              <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  {(article.categories ?? [])[0] && (
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-brand)', background: 'rgba(46,106,167,0.08)', padding: '3px 10px', borderRadius: 999 }}>
                      {article.categories![0]}
                    </span>
                  )}
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12, marginLeft: 'auto' }}>
                    {new Date(article.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 10px', lineHeight: 1.35, color: 'var(--color-text-primary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {article.title}
                </h3>

                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}
                  dangerouslySetInnerHTML={{ __html: article.excerpt || article.description?.replace(/<[^>]*>/g, ' ').slice(0, 160) + '…' }}
                />

                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                  By <strong style={{ color: 'var(--color-text-secondary)' }}>{article.authorName}</strong>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      <style>{`
        .featured-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 56px rgba(46,106,167,0.26) !important;
        }
        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.12) !important;
        }
      `}</style>
    </div>
  );
}
