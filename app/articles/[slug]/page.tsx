'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { AlertCircle, ArrowLeft, Calendar, User, Headphones, Pause, Twitter, Facebook, Link2, Check } from 'lucide-react';
import type { Audiobook } from '@/lib/types';

export default function ArticleDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const article = useLibraryStore((s) => s.getArticleBySlug(slug));
  const sourceAudiobook = useLibraryStore((s) => article?.sourceAudiobookSlug ? s.getBySlug(article.sourceAudiobookSlug) : undefined);
  const { currentBook, isPlaying, loadBook, setPlaying } = usePlayerStore();
  const isThisPlaying = isPlaying && currentBook?.id === article?.id;
  const [copied, setCopied] = useState(false);

  // Compute share links safely
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = article?.title || '';
  const twitterLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
  const facebookLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded) {
    return (
      <div className="page" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 32, width: 120, borderRadius: 8, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 60, borderRadius: 10, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 24, width: '40%', borderRadius: 8, marginBottom: 40 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 16, marginBottom: 40 }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 18, borderRadius: 6, marginBottom: 14, width: `${85 + Math.random() * 15}%` }} />
        ))}
      </div>
    );
  }

  if (!article) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '100px 0' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--color-warning)' }} />
        <h2>Article not found</h2>
        <Link href="/articles" className="btn btn-primary" style={{ marginTop: 24 }}>View all articles</Link>
      </div>
    );
  }

  const formattedDate = new Date(article.pubDate).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Reading column */}
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        {/* Back nav */}
        <Link
          href="/articles"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'var(--color-brand)', textDecoration: 'none',
            fontSize: '0.875rem', fontWeight: 600, marginBottom: 36,
          }}
        >
          <ArrowLeft size={15} /> All Articles
        </Link>

        {/* Category badge */}
        {(article.categories ?? []).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {article.categories!.map(c => (
              <span
                key={c}
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--color-brand)',
                  background: 'rgba(46,106,167,0.08)', padding: '4px 12px', borderRadius: 999,
                  marginRight: 8,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(1.9rem, 5vw, 2.9rem)',
          fontWeight: 800,
          lineHeight: 1.18,
          marginBottom: 20,
          letterSpacing: '-0.025em',
          color: 'var(--color-text-primary)',
        }}>
          {article.title}
        </h1>

        {/* Meta & Actions Wrapper */}
        <div style={{
          marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid var(--color-border)'
        }}>
          {/* Meta Line */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16,
            color: 'var(--color-text-secondary)', fontSize: '0.9375rem',
            marginBottom: 24,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} />
              <strong style={{ color: 'var(--color-text-primary)' }}>{article.authorName}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} />
              {formattedDate}
            </span>
            {article.lengthStr && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-brand)', fontWeight: 600 }}>
                <Headphones size={14} /> {article.lengthStr} listen
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 32, justifyContent: 'flex-start' }}>
            {/* Play Article Button */}
            {article.audioUrl ? (
              <button
                onClick={() => {
                  if (isThisPlaying) {
                    setPlaying(false);
                  } else {
                    const pseudoBook: Audiobook = {
                      id: article.id, slug: article.slug, title: article.title, authorName: article.authorName,
                      coverImage: article.coverImage || '', thumbnailUrl: article.coverImage || '',
                      mp3Url: article.audioUrl!, excerpt: article.excerpt, description: article.description,
                      pubDate: article.pubDate, categories: article.categories, topics: article.topics,
                      totalDuration: article.lengthStr || '', length: article.lengthStr || '',
                      originalYear: '', youtubeLink: null, spotifyLink: null, buyLink: null,
                      generatedColors: null, plays: 0, chapters: [], vttUrl: null
                    };
                    loadBook(pseudoBook);
                  }
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: isThisPlaying ? 'rgba(46,106,167,0.12)' : 'var(--color-brand)',
                  color: isThisPlaying ? 'var(--color-brand)' : '#fff',
                  border: isThisPlaying ? '2px solid var(--color-brand)' : 'none',
                  borderRadius: 999, padding: '12px 28px',
                  fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: isThisPlaying ? 'none' : '0 4px 14px rgba(46,106,167,0.35)',
                }}
              >
                {isThisPlaying ? <><Pause size={18} /> Pause</> : <><Headphones size={18} /> Listen to this Article</>}
              </button>
            ) : <div />}

            {/* Share Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', fontWeight: 600, marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Share</span>
              <a href={twitterLink} target="_blank" rel="noopener noreferrer" className="share-btn" aria-label="Share on X">
                <Twitter size={16} />
              </a>
              <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="share-btn" aria-label="Share on Facebook">
                <Facebook size={16} />
              </a>
              <button onClick={handleCopy} className="share-btn" aria-label="Copy Link" style={{ background: copied ? 'var(--color-brand)' : undefined, color: copied ? '#fff' : undefined, borderColor: copied ? 'var(--color-brand)' : undefined }}>
                {copied ? <Check size={16} /> : <Link2 size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Hero cover */}
        {article.coverImage && (
          <div style={{ marginBottom: 48, borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 36px rgba(0,0,0,0.12)' }}>
            <img
              src={article.coverImage}
              alt={article.title}
              style={{ width: '100%', display: 'block', maxHeight: 440, objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Article body */}
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.description }}
        />

        {/* Source Audiobook Link */}
        {sourceAudiobook && (
          <div style={{
            marginTop: 56, padding: '24px 32px', borderRadius: 16, background: 'var(--color-surface-hover)',
            display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
            border: '1px solid var(--color-border)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
          }}>
            <img 
              src={sourceAudiobook.thumbnailUrl || sourceAudiobook.coverImage} 
              alt={sourceAudiobook.title} 
              style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            />
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Listen to the Full Audiobook
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                This article is derived from <strong>{sourceAudiobook.title}</strong>. The entire book is available to listen to right now.
              </p>
            </div>
            <div>
              <Link href={`/audiobook/${sourceAudiobook.slug}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--color-brand)', color: '#fff', padding: '12px 24px', borderRadius: 999,
                fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(46,106,167,0.35)', transition: 'all 0.2s'
              }}>
                <Headphones size={18} /> Listen to Audiobook
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');

        .article-body {
          font-family: 'Lora', Georgia, serif;
          font-size: clamp(1.0625rem, 2vw, 1.175rem);
          line-height: 1.9;
          color: var(--color-text-primary);
        }
        .article-body p {
          margin-bottom: 1.4em;
        }
        .article-body h1, .article-body h2, .article-body h3, .article-body h4 {
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 700;
          margin: 2em 0 0.6em;
          color: var(--color-text-primary);
          letter-spacing: -0.02em;
          line-height: 1.25;
        }
        .article-body h2 { font-size: 1.5rem; }
        .article-body h3 { font-size: 1.25rem; }
        .article-body h4 { font-size: 1.0625rem; color: var(--color-brand); }
        .article-body blockquote {
          margin: 2em 0;
          padding: 20px 28px;
          border-left: 4px solid var(--color-brand);
          background: rgba(46,106,167,0.05);
          border-radius: 0 10px 10px 0;
          font-style: italic;
          color: var(--color-text-secondary);
        }
        .article-body blockquote p { margin-bottom: 0.5em; }
        .article-body em { font-style: italic; }
        .article-body strong { font-weight: 700; }
        .article-body a { color: var(--color-brand); text-decoration: underline; text-underline-offset: 3px; }
        .article-body ul, .article-body ol { margin: 0 0 1.4em 1.5rem; }
        .article-body li { margin-bottom: 0.4em; }
        .article-body iframe {
          width: 100%;
          border-radius: 12px;
          margin: 2em 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .article-body img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5em 0;
        }
        .article-body .tts-node { background: transparent !important; padding: 0 !important; border-radius: 0 !important; }
        .article-body [data-isttsnode], .article-body [class*="tts-"] { display: inline !important; }

        .share-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%;
          background: transparent; color: var(--color-text-secondary);
          border: 1px solid var(--color-border); cursor: pointer;
          transition: all 0.2s ease;
        }
        .share-btn:hover {
          background: var(--color-surface-hover);
          color: var(--color-brand);
          border-color: var(--color-brand);
        }
      `}</style>
    </div>
  );
}
