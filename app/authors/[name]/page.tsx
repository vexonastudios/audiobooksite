'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';

export default function AuthorDetail() {
  const params = useParams();
  const authorName = decodeURIComponent(params.name as string);
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const books = useLibraryStore((s) => s.getByAuthor(authorName));

  if (!isLoaded) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <Link href="/authors" className="text-brand text-sm" style={{ fontWeight: 600, color: 'var(--color-brand)', marginBottom: 12, display: 'inline-block' }}>← All Authors</Link>
        <h1>{authorName}</h1>
        <p className="text-secondary" style={{ marginTop: 8 }}>{books.length} {books.length === 1 ? 'Audiobook' : 'Audiobooks'} available</p>
      </div>

      <div className="book-grid">
        {books.map(book => (
          <div key={book.id} className="book-card">
            <Link href={`/audiobook/${book.slug}`} style={{ display: 'block' }}>
              <img src={book.thumbnailUrl || book.coverImage} alt={book.title} className="book-card-img" />
            </Link>
            <div className="book-card-body">
              <div className="book-card-title">{book.title}</div>
              {book.length && <div className="book-card-length">{book.length}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
