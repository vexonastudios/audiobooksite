'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { BookCard } from '@/components/ui/BookCard';

export default function TopicClient() {
  const params = useParams();
  const topicName = decodeURIComponent(params.name as string);
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  const books = useLibraryStore((s) => s.getByTopic(topicName));

  if (!isLoaded) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <Link href="/topics" className="text-brand text-sm" style={{ fontWeight: 600, color: 'var(--color-brand)', marginBottom: 12, display: 'inline-block' }}>← All Topics</Link>
        <h1>#{topicName}</h1>
        <p className="text-secondary" style={{ marginTop: 8 }}>{books.length} {books.length === 1 ? 'Audiobook' : 'Audiobooks'}</p>
      </div>

      <div className="book-grid">
        {books.map(book => (
          <BookCard key={book.id} book={book} width="100%" />
        ))}
      </div>
    </div>
  );
}
