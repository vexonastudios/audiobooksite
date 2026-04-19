import { getAuthorBySlug } from '@/lib/db/authors';
import { getAllAudiobooks } from '@/lib/db/audiobooks';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookCard } from '@/components/ui/BookCard';
import type { Metadata } from 'next';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: 'Author Not Found' };
  return {
    title: `${author.name} — ScrollReader Audiobooks`,
    description: author.description?.slice(0, 160) ?? `Free Christian audiobooks by ${author.name}.`,
  };
}

export default async function AuthorDetailPage({ params }: Props) {
  const { slug } = await params;
  const [author, allBooks] = await Promise.all([
    getAuthorBySlug(slug),
    getAllAudiobooks(),
  ]);

  if (!author) notFound();

  const books = allBooks.filter(
    (b) => b.authorName.toLowerCase() === author.name.toLowerCase()
  );

  const lifespan = author.birthYear
    ? author.deathYear
      ? `${author.birthYear} – ${author.deathYear}`
      : `b. ${author.birthYear}`
    : null;

  return (
    <div className="page">
      <Link href="/authors" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 14, fontWeight: 600, color: 'var(--color-brand)',
        textDecoration: 'none', marginBottom: 32,
      }}>
        ← All Authors
      </Link>

      {/* Author hero */}
      <div style={{
        display: 'flex', gap: 32, alignItems: 'flex-start',
        marginBottom: 48, flexWrap: 'wrap',
      }}>
        {/* Portrait */}
        <div style={{ flexShrink: 0 }}>
          {author.imageUrl ? (
            <img
              src={author.imageUrl}
              alt={author.name}
              style={{
                width: 160, height: 200, objectFit: 'cover',
                borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                border: '3px solid var(--color-surface-2)',
              }}
            />
          ) : (
            <div style={{
              width: 160, height: 200, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--color-brand) 0%, #0e4f8a 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}>
              <span style={{ fontSize: '4rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                {author.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '2rem', lineHeight: 1.2 }}>{author.name}</h1>
          {lifespan && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 15, margin: '0 0 16px', fontStyle: 'italic' }}>
              {lifespan}
            </p>
          )}
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
            {books.length} audiobook{books.length !== 1 ? 's' : ''} available
          </p>
          {author.description && (
            <p style={{
              fontSize: 15, lineHeight: 1.75, color: 'var(--color-text)',
              maxWidth: 600, borderLeft: '3px solid var(--color-brand)',
              paddingLeft: 16, margin: 0,
            }}>
              {author.description}
            </p>
          )}
        </div>
      </div>

      {/* Books grid */}
      {books.length > 0 ? (
        <>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 20px' }}>Audiobooks by {author.name}</h2>
          <div className="book-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} width="100%" />
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--color-text-muted)' }}>No audiobooks found for this author yet.</p>
      )}
    </div>
  );
}
