import { getAllAuthors } from '@/lib/db/authors';
import { getAllAudiobooks } from '@/lib/db/audiobooks';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authors — ScrollReader',
  description: 'Browse all Christian authors available as free audiobooks on ScrollReader.',
};

export default async function AuthorsIndexPage() {
  const [authors, audiobooks] = await Promise.all([getAllAuthors(), getAllAudiobooks()]);

  // Book count per author name
  const bookCount: Record<string, number> = {};
  audiobooks.forEach((b) => {
    bookCount[b.authorName] = (bookCount[b.authorName] || 0) + 1;
  });

  // Only show authors who have books
  const withBooks = authors.filter((a) => bookCount[a.name] > 0);

  return (
    <div className="page">
      <h1 style={{ marginBottom: 8 }}>Authors</h1>
      <p className="text-secondary" style={{ marginBottom: 36 }}>
        {withBooks.length} authors — browse their free Christian audiobooks
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: 20,
      }}>
        {withBooks.map((author) => (
          <Link
            key={author.id}
            href={`/author/${author.slug}`}
            className="card"
            style={{
              padding: 20, textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              textDecoration: 'none',
              transition: 'transform 0.18s, box-shadow 0.18s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {/* Portrait or initial */}
            {author.imageUrl ? (
              <img
                src={author.imageUrl}
                alt={author.name}
                style={{
                  width: 80, height: 100, objectFit: 'cover',
                  borderRadius: 8, border: '2px solid var(--color-surface-2)',
                }}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-brand) 0%, #0e4f8a 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
              }}>
                {author.name.charAt(0)}
              </div>
            )}

            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3, color: 'var(--color-text)' }}>
                {author.name}
              </div>
              {author.birthYear && (
                <div className="text-secondary" style={{ fontSize: 12, marginTop: 2 }}>
                  {author.birthYear}{author.deathYear ? ` – ${author.deathYear}` : ''}
                </div>
              )}
              <div className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>
                {bookCount[author.name]} {bookCount[author.name] === 1 ? 'Book' : 'Books'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
