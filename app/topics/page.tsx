'use client';

import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';

export default function TopicsIndex() {
  const topics = useLibraryStore((s) => s.getAllTopics());
  
  if (!useLibraryStore((s) => s.isLoaded)) {
    return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 32 }}>Topics</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {topics.map((topic) => {
          const books = useLibraryStore.getState().getByTopic(topic);
          return (
            <Link key={topic} href={`/topics/${encodeURIComponent(topic)}`} className="pill" style={{ padding: '8px 16px', fontSize: '0.9375rem' }}>
               #{topic} <span style={{ opacity: 0.6, marginLeft: 8, fontSize: '0.8rem' }}>{books.length}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
