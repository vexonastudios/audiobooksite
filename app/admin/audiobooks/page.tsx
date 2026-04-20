'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdminBook {
  id: string;
  title: string;
  authorName: string;
  totalDuration: string;
  plays: number;
  published: boolean;
  slug: string;
}

export default function AudiobookList() {
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/audiobooks')
      .then(r => r.json())
      .then(setBooks)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/audiobooks/${id}`, { method: 'DELETE' });
    setBooks(b => b.filter(x => x.id !== id));
  }

  async function handleTogglePublish(id: string, current: boolean) {
    await fetch(`/api/admin/audiobooks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !current }),
    });
    setBooks(b => b.map(x => x.id === id ? { ...x, published: !current } : x));
  }

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.authorName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Audiobooks ({books.length})</h1>
        <Link href="/admin/audiobooks/new" className="btn-primary">+ New Audiobook</Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Search by title or author…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 24, color: '#666' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 24, color: '#666' }}>No audiobooks found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Duration</th>
                <th>Plays</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ color: '#1A202C', fontWeight: 600, maxWidth: 300 }}>
                    <span title={b.title}>{b.title.length > 55 ? b.title.slice(0, 55) + '…' : b.title}</span>
                  </td>
                  <td style={{ color: '#4A5568', whiteSpace: 'nowrap' }}>{b.authorName}</td>
                  <td style={{ color: '#4A5568', whiteSpace: 'nowrap' }}>{b.totalDuration}</td>
                  <td style={{ color: '#4A5568' }}>{b.plays?.toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => handleTogglePublish(b.id, b.published)}
                      className={`badge ${b.published ? 'badge-green' : 'badge-gray'}`}
                      style={{ cursor: 'pointer', border: 'none', background: undefined }}
                    >
                      {b.published ? 'Live' : 'Draft'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/audiobook/${b.slug}`} target="_blank" className="btn-secondary" style={{ marginRight: 6 }}>
                      View
                    </Link>
                    <Link href={`/admin/audiobooks/${b.id}/edit`} className="btn-secondary" style={{ marginRight: 6 }}>
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(b.id, b.title)} className="btn-danger">
                      Del
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
