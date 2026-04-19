'use client';

import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';

export default function ArticlesIndex() {
  const articles = useLibraryStore((s) => s.articles);
  const isLoaded = useLibraryStore((s) => s.isLoaded);

  if (!isLoaded) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <h1>Articles</h1>
        <p className="text-secondary" style={{ marginTop: 8 }}>Read {articles.length} posts and articles.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {articles.map((article) => (
          <Link key={article.id} href={`/articles/${article.slug}`} className="card" style={{ display: 'flex', gap: 20, transition: 'transform var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            {article.coverImage && (
              <img src={article.coverImage} alt={article.title} style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-brand)', fontWeight: 600, marginBottom: 4 }}>
                {new Date(article.pubDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>{article.title}</h2>
              <div className="text-secondary" style={{ fontSize: '0.9375rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: article.excerpt || article.description.slice(0, 150) + '...' }} />
              <div className="text-muted text-sm" style={{ marginTop: 12 }}>By {article.authorName}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
