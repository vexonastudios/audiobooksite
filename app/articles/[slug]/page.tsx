'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { AlertCircle } from 'lucide-react';

export default function ArticleDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const article = useLibraryStore((s) => s.getArticleBySlug(slug));

  if (!isLoaded) return <div className="page"><div className="skeleton" style={{ height: 600, maxWidth: 760, margin: '0 auto' }} /></div>;

  if (!article) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '100px 0' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--color-warning)' }} />
        <h2>Article not found</h2>
        <Link href="/articles" className="btn btn-primary" style={{ marginTop: 24 }}>View all articles</Link>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 760, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <Link href="/articles" className="text-brand text-sm" style={{ fontWeight: 600, color: 'var(--color-brand)', marginBottom: 20, display: 'inline-block' }}>← All Articles</Link>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.2, marginBottom: 16 }}>{article.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
           <span>{new Date(article.pubDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}</span>
           <span>•</span>
           <strong>{article.authorName}</strong>
        </div>
      </div>

      {/* Cover */}
      {article.coverImage && (
        <img src={article.coverImage} alt={article.title} style={{ width: '100%', borderRadius: 'var(--radius-xl)', marginBottom: 40, boxShadow: 'var(--shadow-md)' }} />
      )}
      
      {/* Article Content */}
      <div 
        className="prose"
        style={{ 
          fontSize: '1.125rem', 
          lineHeight: 1.8, 
          color: 'var(--color-text-primary)',
          fontFamily: "'Lora', serif"
        }}
        dangerouslySetInnerHTML={{ __html: article.description }}
      />
    </div>
  );
}
