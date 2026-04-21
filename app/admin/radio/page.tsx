'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface RadioBlock {
  id: string;
  mp3Url: string;
  manifestUrl: string;
  totalDuration: number;
  chapterCount: number;
  label: string | null;
  broadcastStartTime: string | null;
  isActive: boolean;
  generatedAt: string;
  createdAt: string;
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function RadioAdminPage() {
  const [blocks, setBlocks] = useState<RadioBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/radio');
      const data = await res.json();
      setBlocks(data.blocks ?? []);
    } catch {
      setError('Failed to load radio blocks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function activate(id: string) {
    if (!confirm(`Activate block "${id}"?\n\nThis will set it as the live Now Playing stream and deactivate all other blocks.`)) return;
    setActivating(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/radio/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // uses server time as broadcastStartTime
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to activate');
      } else {
        await load();
      }
    } finally {
      setActivating(null);
    }
  }

  async function remove(id: string) {
    if (!confirm(`Delete block "${id}"? This cannot be undone.`)) return;
    setDeleting(id);
    setError('');
    try {
      await fetch(`/api/admin/radio/${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setDeleting(null);
    }
  }

  const activeBlock = blocks.find(b => b.isActive);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0 }}>Scroll Radio</h1>
          <p style={{ color: '#718096', fontSize: 14, margin: '4px 0 0' }}>
            Register generated blocks and manage the live Now Playing stream.
          </p>
        </div>
        <Link href="/admin/radio/new" className="btn-primary">+ Register Block</Link>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Active Block Banner */}
      {activeBlock && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #059669', background: '#ECFDF5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#D1FAE5', color: '#065F46',
              padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#10B981', display: 'inline-block',
                animation: 'pulse 2s infinite',
              }} />
              LIVE
            </span>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#065F46' }}>
              {activeBlock.label ?? activeBlock.id}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 13, color: '#047857' }}>
            <div><strong>Started:</strong> {formatDate(activeBlock.broadcastStartTime)}</div>
            <div><strong>Duration:</strong> {formatDuration(activeBlock.totalDuration)}</div>
            <div><strong>Chapters:</strong> {activeBlock.chapterCount}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <a href={activeBlock.mp3Url} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: '#047857', textDecoration: 'none', fontWeight: 500 }}>
              🎵 MP3 →
            </a>
            <a href={activeBlock.manifestUrl} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: '#047857', textDecoration: 'none', fontWeight: 500 }}>
              📄 Manifest →
            </a>
          </div>
        </div>
      )}

      {!activeBlock && !loading && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #D97706', background: '#FFFBEB' }}>
          <p style={{ margin: 0, color: '#92400E', fontSize: 14 }}>
            ⚠️ No active block. Register and activate a block to start the Now Playing stream.
          </p>
        </div>
      )}

      {/* Blocks Table */}
      <div className="card">
        <h2 style={{ margin: '0 0 16px' }}>All Blocks</h2>

        {loading ? (
          <p style={{ color: '#718096', fontSize: 14 }}>Loading…</p>
        ) : blocks.length === 0 ? (
          <p style={{ color: '#718096', fontSize: 14 }}>
            No blocks registered yet.{' '}
            <Link href="/admin/radio/new" style={{ color: '#2e6aa7' }}>Register the first one →</Link>
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Block ID</th>
                <th>Label</th>
                <th>Duration</th>
                <th>Chapters</th>
                <th>Broadcast Start</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {blocks.map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{b.id}</td>
                  <td style={{ color: '#4A5568' }}>{b.label ?? <span style={{ color: '#CBD5E0' }}>—</span>}</td>
                  <td style={{ color: '#718096' }}>{b.totalDuration ? formatDuration(b.totalDuration) : '—'}</td>
                  <td style={{ color: '#718096' }}>{b.chapterCount || '—'}</td>
                  <td style={{ color: '#718096', fontSize: 13 }}>{formatDate(b.broadcastStartTime)}</td>
                  <td>
                    {b.isActive ? (
                      <span className="badge badge-green">● Live</span>
                    ) : b.broadcastStartTime ? (
                      <span className="badge badge-gray">Inactive</span>
                    ) : (
                      <span className="badge badge-gray">Unscheduled</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!b.isActive && (
                        <button
                          className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: 13, whiteSpace: 'nowrap' }}
                          disabled={activating === b.id}
                          onClick={() => activate(b.id)}
                        >
                          {activating === b.id ? 'Activating…' : '▶ Go Live'}
                        </button>
                      )}
                      <button
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: 13 }}
                        disabled={deleting === b.id}
                        onClick={() => remove(b.id)}
                      >
                        {deleting === b.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
