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
  mp3Url: string;
  mp3UrlLow: string;
}

export default function AudiobookList() {
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [genResults, setGenResults] = useState<Record<string, 'ok' | 'err'>>({});

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

  async function handleGenerate64k(id: string) {
    setGenerating(g => ({ ...g, [id]: true }));
    setGenResults(r => { const next = { ...r }; delete next[id]; return next; });
    try {
      const res = await fetch('/api/admin/generate-64k', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      // Update the book in state with both new URLs (128k may have been renamed too)
      setBooks(b => b.map(x => x.id === id ? { ...x, mp3Url: data.mp3Url ?? x.mp3Url, mp3UrlLow: data.mp3UrlLow } : x));
      setGenResults(r => ({ ...r, [id]: 'ok' }));
    } catch (e) {
      console.error('Generate 64k error:', e);
      setGenResults(r => ({ ...r, [id]: 'err' }));
    } finally {
      setGenerating(g => ({ ...g, [id]: false }));
    }
  }

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.authorName?.toLowerCase().includes(search.toLowerCase())
  );

  const missingCount = books.filter(b => b.mp3Url && !b.mp3UrlLow).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Audiobooks ({books.length})</h1>
        <Link href="/admin/audiobooks/new" className="btn-primary">+ New Audiobook</Link>
      </div>

      {/* 64k status bar */}
      {!loading && missingCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 8, marginBottom: 16,
          background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E',
          fontSize: 13, fontWeight: 500,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>{missingCount} audiobook{missingCount !== 1 ? 's' : ''} missing 64kbps version</span>
        </div>
      )}

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
                <th>64k</th>
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
                    {b.mp3UrlLow ? (
                      <span title={b.mp3UrlLow} style={{ color: '#059669', fontWeight: 600, fontSize: 15 }}>✓</span>
                    ) : b.mp3Url ? (
                      generating[b.id] ? (
                        <span style={{ color: '#D97706', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
                          ⏳ Generating…
                        </span>
                      ) : genResults[b.id] === 'err' ? (
                        <button
                          onClick={() => handleGenerate64k(b.id)}
                          title="Retry — previous attempt failed"
                          style={{
                            background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA',
                            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                            fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                          }}
                        >
                          ✗ Retry
                        </button>
                      ) : genResults[b.id] === 'ok' ? (
                        <span style={{ color: '#059669', fontWeight: 600, fontSize: 15 }}>✓</span>
                      ) : (
                        <button
                          onClick={() => handleGenerate64k(b.id)}
                          title="Generate 64kbps mono version from existing 128kbps"
                          style={{
                            background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
                            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                            fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                          }}
                        >
                          ⚡ Gen
                        </button>
                      )
                    ) : (
                      <span style={{ color: '#CBD5E0' }}>—</span>
                    )}
                  </td>
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
