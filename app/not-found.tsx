import Link from 'next/link';
import { Search, Compass, BookOpen, Headphones } from 'lucide-react';
import { sql } from '@/lib/db';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found | ScrollReader',
};

export default async function NotFound() {
  // Fetch some nice recent content to show
  let recentAudiobooks: any[] = [];
  let recentArticles: any[] = [];

  try {
    recentAudiobooks = await sql`
      SELECT slug, title, cover_image, author_name 
      FROM audiobooks 
      WHERE published = true 
      ORDER BY pub_date DESC 
      LIMIT 3
    `;
    
    recentArticles = await sql`
      SELECT slug, title, cover_image, author_name 
      FROM articles 
      WHERE published = true 
      ORDER BY pub_date DESC 
      LIMIT 3
    `;
  } catch (err) {
    console.error('Failed to fetch recent posts for 404', err);
  }

  return (
    <div style={{ maxWidth: 1000, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <Compass size={64} style={{ color: '#93C5FD', margin: '0 auto 24px' }} />
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#1A202C', marginBottom: 16 }}>
        Page Not Found
      </h1>
      <p style={{ fontSize: 18, color: '#4A5568', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
        We couldn't track down the page you were looking for. It might have been moved, or the link might be broken.
      </p>

      {/* Search Form */}
      <form action="/search" method="GET" style={{ maxWidth: 500, margin: '0 auto 48px', display: 'flex', gap: 8 }}>
        <input 
          type="text" 
          name="q" 
          placeholder="Search audiobooks, authors, or articles..." 
          style={{ flex: 1, padding: '14px 20px', borderRadius: 999, border: '1px solid #E2E8F0', outline: 'none', fontSize: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
        />
        <button type="submit" style={{ background: '#2e6aa7', color: '#fff', border: 'none', borderRadius: 999, padding: '0 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <Search size={18} /> Search
        </button>
      </form>

      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 40, textAlign: 'left' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#2D3748', marginBottom: 24, textAlign: 'center' }}>
          Explore Our Latest Content
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          
          {/* Audiobooks Column */}
          {recentAudiobooks.length > 0 && (
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2e6aa7', marginBottom: 16, fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Headphones size={18} /> Recent Audiobooks
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recentAudiobooks.map(book => (
                  <Link key={book.slug} href={`/audiobook/${book.slug}`} className="not-found-card">
                    <img src={book.cover_image || '/placeholder.png'} alt={book.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div className="not-found-title" style={{ color: '#1A202C', fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{book.title}</div>
                      <div style={{ color: '#718096', fontSize: 13 }}>{book.author_name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Articles Column */}
          {recentArticles.length > 0 && (
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2e6aa7', marginBottom: 16, fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <BookOpen size={18} /> Recent Articles
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recentArticles.map(article => (
                  <Link key={article.slug} href={`/articles/${article.slug}`} className="not-found-card">
                    <img src={article.cover_image || '/placeholder.png'} alt={article.title} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div className="not-found-title" style={{ color: '#1A202C', fontWeight: 600, fontSize: 15, marginBottom: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</div>
                      <div style={{ color: '#718096', fontSize: 13 }}>{article.author_name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .not-found-card {
          display: flex;
          gap: 16px;
          text-decoration: none;
          background: #F8FAFC;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          transition: all 0.2s;
        }
        .not-found-card:hover {
          transform: translateY(-2px);
          border-color: #CBD5E0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .not-found-card:hover .not-found-title {
          color: #2e6aa7 !important;
        }
      `}</style>
    </div>
  );
}
