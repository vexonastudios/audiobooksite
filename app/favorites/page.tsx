'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { Heart, BookOpen, Headphones, Trash2 } from 'lucide-react';
import { BookCard } from '@/components/ui/BookCard';

type Tab = 'audiobooks' | 'articles';

export default function FavoritesPage() {
  const favorites = useUserStore((s) => s.favorites);
  const removeFavorite = useUserStore((s) => s.removeFavorite);
  const audiobooks = useLibraryStore((s) => s.audiobooks);
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const [activeTab, setActiveTab] = useState<Tab>('audiobooks');

  const audiobookFavs = favorites.filter((f) => f.type === 'audiobook');
  const articleFavs = favorites.filter((f) => f.type === 'article');

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 48, width: 280, borderRadius: 12, marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 230, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  const total = favorites.length;

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 36, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
            }}>
              <Heart size={24} fill="white" color="white" />
            </div>
            <h1 style={{ margin: 0 }}>Your Favorites</h1>
          </div>
          <p className="text-secondary" style={{ margin: 0 }}>
            {total === 0
              ? 'Nothing saved yet — tap the heart on any audiobook or article.'
              : `${total} saved item${total !== 1 ? 's' : ''} · ${audiobookFavs.length} audiobook${audiobookFavs.length !== 1 ? 's' : ''}, ${articleFavs.length} article${articleFavs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tabs" style={{ marginBottom: 28 }}>
        <button
          className={`tab ${activeTab === 'audiobooks' ? 'active' : ''}`}
          onClick={() => setActiveTab('audiobooks')}
        >
          <Headphones size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
          Audiobooks
          {audiobookFavs.length > 0 && (
            <span style={{
              marginLeft: 7, background: activeTab === 'audiobooks' ? 'var(--color-brand)' : 'var(--color-surface-2)',
              color: activeTab === 'audiobooks' ? 'white' : 'var(--color-text-muted)',
              borderRadius: 20, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700,
            }}>
              {audiobookFavs.length}
            </span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'articles' ? 'active' : ''}`}
          onClick={() => setActiveTab('articles')}
        >
          <BookOpen size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
          Articles
          {articleFavs.length > 0 && (
            <span style={{
              marginLeft: 7, background: activeTab === 'articles' ? 'var(--color-brand)' : 'var(--color-surface-2)',
              color: activeTab === 'articles' ? 'white' : 'var(--color-text-muted)',
              borderRadius: 20, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700,
            }}>
              {articleFavs.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Audiobooks Tab ── */}
      {activeTab === 'audiobooks' && (
        <>
          {audiobookFavs.length === 0 ? (
            <EmptyState
              icon={<Headphones size={52} style={{ margin: '0 auto 20px', opacity: 0.15 }} />}
              heading="No favorite audiobooks yet"
              body="Browse audiobooks and tap the ♥ heart to save them here."
              cta={{ href: '/', label: 'Browse Audiobooks' }}
            />
          ) : (
            <div className="book-grid">
              {audiobookFavs.map((fav) => {
                const book = audiobooks.find((b) => b.id === fav.itemId);
                if (book) {
                  return <BookCard key={fav.id} book={book} />;
                }
                // Fallback card for books no longer in library
                return (
                  <FallbackCard
                    key={fav.id}
                    fav={fav}
                    onRemove={() => removeFavorite(fav.itemId)}
                    href={`/audiobook/${fav.itemSlug}`}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Articles Tab ── */}
      {activeTab === 'articles' && (
        <>
          {articleFavs.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={52} style={{ margin: '0 auto 20px', opacity: 0.15 }} />}
              heading="No favorite articles yet"
              body="Browse articles and tap the ♥ heart to save them here."
              cta={{ href: '/articles', label: 'Browse Articles' }}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {articleFavs.map((fav) => (
                <div key={fav.id} style={{ position: 'relative' }}>
                  <Link href={`/articles/${fav.itemSlug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                    >
                      {/* Cover */}
                      <div style={{
                        height: 140,
                        background: fav.cover
                          ? `url(${fav.cover}) center/cover`
                          : 'linear-gradient(135deg, #1e3a5f 0%, #2e6aa7 100%)',
                        position: 'relative',
                      }}>
                        {!fav.cover && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                            <BookOpen size={40} color="#fff" />
                          </div>
                        )}
                      </div>
                      {/* Body */}
                      <div style={{ padding: '16px 18px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35, marginBottom: 6,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          color: 'var(--color-text-primary)' }}>
                          {fav.title}
                        </div>
                        <div className="text-muted text-xs">{fav.author}</div>
                      </div>
                    </div>
                  </Link>
                  {/* Remove button */}
                  <button
                    onClick={() => removeFavorite(fav.itemId)}
                    title="Remove from favorites"
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
                      border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.8)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Helper Components ── */

function EmptyState({
  icon, heading, body, cta,
}: { icon: React.ReactNode; heading: string; body: string; cta: { href: string; label: string } }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
      {icon}
      <h3 style={{ marginBottom: 8, opacity: 0.7 }}>{heading}</h3>
      <p style={{ fontSize: '0.925rem', marginBottom: 28 }}>{body}</p>
      <Link href={cta.href} className="btn btn-primary">{cta.label}</Link>
    </div>
  );
}

function FallbackCard({
  fav, onRemove, href,
}: { fav: { title: string; author: string; cover?: string; thumbnail?: string }; onRemove: () => void; href: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        <div className="book-card">
          <div className="book-card-img" style={{
            background: fav.cover
              ? `url(${fav.thumbnail || fav.cover}) center/cover`
              : 'var(--color-surface-2)',
          }} />
          <div className="book-card-body">
            <div className="book-card-title">{fav.title}</div>
            <div className="book-card-author">{fav.author}</div>
          </div>
        </div>
      </Link>
      <button
        onClick={onRemove}
        title="Remove from favorites"
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
          border: 'none', cursor: 'pointer', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
