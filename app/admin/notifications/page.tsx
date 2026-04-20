'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mic, PlusCircle, Pencil, Trash2, Eye, EyeOff, Volume2 } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body_text: string;
  audio_url: string | null;
  published: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/notifications');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
    setItems(a => a.filter(x => x.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mic size={22} style={{ color: '#2e6aa7' }} /> Announcements
          </h1>
          <p style={{ margin: '6px 0 0', color: '#718096', fontSize: 14 }}>
            Create audio announcements delivered via ElevenLabs TTS
          </p>
        </div>
        <Link href="/admin/notifications/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <PlusCircle size={15} /> New Announcement
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#718096' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#718096' }}>
            <Mic size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>No announcements yet. <Link href="/admin/notifications/new" style={{ color: '#2e6aa7' }}>Create the first one.</Link></div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Audio</th>
                <th>Expires</th>
                <th>Created</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(n => (
                <tr key={n.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1A202C', fontSize: 14 }}>{n.title}</div>
                    <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body_text}</div>
                  </td>
                  <td>
                    <span className={`badge ${n.published ? 'badge-green' : 'badge-gray'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {n.published ? <><Eye size={10} /> Live</> : <><EyeOff size={10} /> Draft</>}
                    </span>
                  </td>
                  <td>
                    {n.audio_url
                      ? <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Volume2 size={12} /> Ready</span>
                      : <span style={{ color: '#9CA3AF', fontSize: 12 }}>No audio</span>
                    }
                  </td>
                  <td style={{ color: '#718096', fontSize: 13 }}>
                    {n.expires_at
                      ? new Date(n.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : <span style={{ color: '#CBD5E0' }}>Never</span>}
                  </td>
                  <td style={{ color: '#718096', fontSize: 13 }}>
                    {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/admin/notifications/${n.id}/edit`}
                        title="Edit"
                        style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: '#EBF5FF', color: '#2e6aa7', borderRadius: 7, textDecoration: 'none', fontSize: 13 }}
                      >
                        <Pencil size={13} />
                      </Link>
                      <button
                        onClick={() => handleDelete(n.id, n.title)}
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
