'use client';

import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';

export default function AuthorsIndex() {
  const authors = useLibraryStore((s) => s.getAllAuthors());
  
  if (!useLibraryStore((s) => s.isLoaded)) {
    return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 32 }}>Authors</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {authors.map((author) => {
          const books = useLibraryStore.getState().getByAuthor(author);
          return (
            <Link key={author} href={`/authors/${encodeURIComponent(author)}`} className="card" style={{ padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'transform var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
               <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                 {author.charAt(0).toUpperCase()}
               </div>
               <div>
                 <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{author}</div>
                 <div className="text-secondary text-sm">{books.length} {books.length === 1 ? 'Book' : 'Books'}</div>
               </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
