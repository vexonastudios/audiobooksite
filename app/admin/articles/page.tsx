'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, PlusCircle, Pencil, Trash2 } from 'lucide-react';

interface Article {
  id: string;
  slug: string;
  title: string;
  author_name: string;
  pub_date: string;
  published: boolean;
  categories: string[];
  cover_image: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchArticles = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/articles');
    if (res.ok) setArticles(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    setArticles(a => a.filter(x => x.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} style={{ color: '#2e6aa7' }} /> Articles
          </h1>
          <p style={{ margin: '6px 0 0', color: '#718096', fontSize: 14 }}>
            Manage all articles and posts
          </p>
        </div>
        <Link href="/admin/articles/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <PlusCircle size={15} /> New Article
        </Link>
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
          <div style={{ padding: 48, textAlign: 'center', color: '#718096' }}>Loading articles…</div>
        ) : articles.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#718096' }}>
            <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>No articles yet. <Link href="/admin/articles/new" style={{ color: '#2e6aa7' }}>Create the first one.</Link></div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Published</th>
                <th>Date</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles
                .filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.author_name.toLowerCase().includes(search.toLowerCase()))
                .map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1A202C', fontSize: 14 }}>{a.title}</div>
                    <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>{a.slug}</div>
                  </td>
                  <td style={{ color: '#4A5568', fontSize: 13 }}>{a.author_name}</td>
                  <td>
                    {(a.categories || []).map(c => (
                      <span key={c} className="badge badge-gray" style={{ marginRight: 4 }}>{c}</span>
                    ))}
                  </td>
                  <td>
                    <span className={`badge ${a.published ? 'badge-green' : 'badge-gray'}`}>
                      {a.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ color: '#718096', fontSize: 13 }}>
                    {new Date(a.pub_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/admin/articles/${a.id}/edit`}
                        title="Edit"
                        style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: '#EBF5FF', color: '#2e6aa7', borderRadius: 7, textDecoration: 'none', fontSize: 13 }}
                      >
                        <Pencil size={13} />
                      </Link>
                      <button
                        onClick={() => handleDelete(a.id, a.title)}
                        title="Delete"
                        className="btn-danger"
                        style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', fontSize: 13 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
