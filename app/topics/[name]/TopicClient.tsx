'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { BookCard } from '@/components/ui/BookCard';
import { ChevronRight, LayoutGrid } from 'lucide-react';

// Match category color from the same logic used on the topics index
const CATEGORY_COLORS: Record<string, string> = {
  'Assurance': '#1a7a5e', 'Faith and Provision': '#1a7a5e', 'Providence': '#1a7a5e',
  'Revival': '#1a7a5e', 'Sanctification': '#1a7a5e', 'The Holy Spirit': '#1a7a5e',
  'The Word of God': '#1a7a5e',
  'Greed': '#2e6aa7', 'Killing Sin': '#2e6aa7', 'Marriage': '#2e6aa7',
  'Military': '#2e6aa7', 'Money and Stewardship': '#2e6aa7', 'Parenting': '#2e6aa7',
  'Patriotism': '#2e6aa7',
  'Counseling': '#5a3e85', 'Preaching': '#5a3e85',
  'Moravians': '#7a4f1a',
  'Church Planting': '#0e7490', 'Medical Missions': '#0e7490', 'Missions Training': '#0e7490',
  'Street Preaching': '#0e7490', 'Women Evangelists': '#0e7490',
  'Loss on the Mission Field': '#0e7490', 'Prison Ministry': '#0e7490',
  'Africa': '#6b7280', 'American Indians': '#6b7280', 'Burmah (Myanmar)': '#6b7280',
  'China': '#6b7280', 'Congo': '#6b7280',
  'Healing': '#be185d', 'Humility': '#be185d', 'Prayer': '#be185d', 'Restoration': '#be185d',
};

const DEFAULT_COLOR = '#2e6aa7';

export default function TopicClient() {
  const params = useParams();
  const topicName = decodeURIComponent(params.name as string);
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const books = useLibraryStore((s) => s.getByTopic(topicName));
  const color = CATEGORY_COLORS[topicName] ?? DEFAULT_COLOR;

  // Sort newest first (by pubDate if available, otherwise stable order)
  const sortedBooks = [...books].sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-xl)', marginBottom: 32 }} />
        <div className="book-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* ─── Hero ─── */}
      <div style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        borderRadius: 'var(--radius-xl)',
        padding: '32px 28px',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeInUp 0.4s both',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            >Home</Link>
            <ChevronRight size={13} color="rgba(255,255,255,0.45)" />
            <Link href="/topics" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            >Topics</Link>
            <ChevronRight size={13} color="rgba(255,255,255,0.45)" />
            <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{topicName}</span>
          </nav>

          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 6, letterSpacing: '-0.02em' }}>
            {topicName}
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', marginBottom: 16 }}>
            {books.length === 0
              ? 'No audiobooks yet for this topic.'
              : `${books.length} free audiobook${books.length !== 1 ? 's' : ''} — listen online, no signup required.`}
          </p>

          <Link
            href="/topics"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.18s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
          >
            <LayoutGrid size={13} />
            All Topics
          </Link>
        </div>
      </div>

      {/* ─── Book grid ─── */}
      {sortedBooks.length > 0 ? (
        <div className="book-grid" style={{ animation: 'fadeInUp 0.5s 0.1s both' }}>
          {sortedBooks.map((book) => (
            <BookCard key={book.id} book={book} width="100%" />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
          <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>No audiobooks yet</p>
          <p style={{ fontSize: '0.875rem' }}>Check back soon — we're always adding new titles.</p>
          <Link
            href="/topics"
            style={{
              display: 'inline-block', marginTop: 20,
              padding: '9px 22px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-brand)', color: '#fff',
              fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
            }}
          >
            Browse all topics
          </Link>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
