'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const search = useLibraryStore((s) => s.search);

  if (!isLoaded) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;

  const results = query ? search(query) : [];

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <h1>Search Results</h1>
        <p className="text-secondary" style={{ marginTop: 8 }}>
          {query ? `${results.length} results for "${query}"` : 'Enter a search term above.'}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="book-grid">
          {results.map(book => (
            <div key={book.id} className="book-card">
              <Link href={`/audiobook/${book.slug}`} style={{ display: 'block' }}>
                <img src={book.thumbnailUrl || book.coverImage} alt={book.title} className="book-card-img" />
              </Link>
              <div className="book-card-body">
                <div className="book-card-title">{book.title}</div>
                <div className="book-card-author">{book.authorName}</div>
              </div>
            </div>
          ))}
        </div>
      ) : query ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
           No audiobooks found matching your search.
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page"><div className="skeleton" style={{ height: 400 }} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
