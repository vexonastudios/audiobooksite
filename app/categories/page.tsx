'use client';

import Link from 'next/link';
import { useLibraryStore, slugify } from '@/lib/store/libraryStore';

export default function CategoriesIndex() {
  const categories = useLibraryStore((s) => s.getAllCategories());
  
  if (!useLibraryStore((s) => s.isLoaded)) {
    return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 32 }}>Categories</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {categories.map((cat) => {
          const books = useLibraryStore.getState().getByCategory(cat);
          return (
            <Link key={cat} href={`/categories/${slugify(cat)}`} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
               <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{cat}</div>
               <div className="pill" style={{ pointerEvents: 'none', background: 'var(--color-surface-2)', border: 'none' }}>{books.length} Books</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
