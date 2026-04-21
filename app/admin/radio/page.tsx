'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { GripVertical, Play, Trash2, Radio, CheckCircle, XCircle, AlertTriangle, SkipForward } from 'lucide-react';

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
  // Client-side playlist ordering (not persisted — drag to arrange)
  playOrder?: number;
}

function formatDuration(secs: number) {
  if (!secs) return '—';
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

// ─── Inline confirm row ───────────────────────────────────────────────────────
function ConfirmRow({
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      background: danger ? '#FEF2F2' : '#EFF6FF',
      border: `1px solid ${danger ? '#FECACA' : '#BFDBFE'}`,
      borderRadius: 10,
      marginTop: 8,
      flexWrap: 'wrap',
    }}>
      <AlertTriangle size={16} color={danger ? '#DC2626' : '#2563EB'} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: danger ? '#991B1B' : '#1E40AF', flex: 1 }}>
        {message}
      </span>
      <button
        onClick={onConfirm}
        style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: danger ? '#DC2626' : '#2563EB', color: '#fff', border: 'none', cursor: 'pointer',
        }}
      >
        <CheckCircle size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
        Confirm
      </button>
      <button
        onClick={onCancel}
        style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </div>
  );
}

// ─── Playlist queue card ──────────────────────────────────────────────────────
function PlaylistQueue({
  blocks,
  activeId,
  onActivate,
  onReorder,
}: {
  blocks: RadioBlock[];
  activeId: string | undefined;
  onActivate: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  const [order, setOrder] = useState<string[]>(() => blocks.map((b) => b.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOver = useRef<string | null>(null);

  // Sync when blocks change externally
  useEffect(() => {
    setOrder((prev) => {
      const existing = new Set(prev);
      const newIds = blocks.map((b) => b.id).filter((id) => !existing.has(id));
      const pruned = prev.filter((id) => blocks.some((b) => b.id === id));
      return [...pruned, ...newIds];
    });
  }, [blocks]);

  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));
  const orderedBlocks = order.map((id) => blockMap[id]).filter(Boolean);

  // Promote active to top of visual queue
  const activeBlock = orderedBlocks.find((b) => b.id === activeId);
  const queueBlocks = orderedBlocks.filter((b) => b.id !== activeId);

  function handleDragStart(id: string) { setDragging(id); }
  function handleDragEnter(id: string) { dragOver.current = id; }
  function handleDragEnd() {
    if (dragging && dragOver.current && dragging !== dragOver.current) {
      const next = [...order];
      const from = next.indexOf(dragging);
      const to = next.indexOf(dragOver.current);
      next.splice(from, 1);
      next.splice(to, 0, dragging);
      setOrder(next);
      onReorder(next);
    }
    setDragging(null);
    dragOver.current = null;
  }

  if (orderedBlocks.length === 0) return null;

  return (
    <div style={{
      background: 'var(--color-surface, #fff)',
      border: '1px solid var(--color-border, #E2E8F0)',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border, #E2E8F0)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'linear-gradient(135deg, #1e40af08, #1e40af04)',
      }}>
        <Radio size={18} color="#2563EB" />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Playback Queue</div>
          <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: 1 }}>
            Drag to reorder. The next inactive block will auto-advance when you go live.
          </div>
        </div>
      </div>

      {/* Queue rows */}
      <div style={{ padding: '8px 0' }}>
        {/* Active block — pinned at top */}
        {activeBlock && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 20px',
            background: '#F0FDF4',
            borderLeft: '3px solid #10B981',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#065F46' }}>
                {activeBlock.label ?? activeBlock.id}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: 1 }}>
                🔴 NOW PLAYING · {formatDuration(activeBlock.totalDuration)} · {activeBlock.chapterCount} chapters
              </div>
            </div>
          </div>
        )}

        {/* Queue items */}
        {queueBlocks.map((block, idx) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => handleDragStart(block.id)}
            onDragEnter={() => handleDragEnter(block.id)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 20px',
              borderBottom: idx < queueBlocks.length - 1 ? '1px solid #F1F5F9' : 'none',
              cursor: 'grab',
              background: dragging === block.id ? '#EFF6FF' : 'transparent',
              transition: 'background 0.15s',
              opacity: dragging === block.id ? 0.6 : 1,
            }}
          >
            <GripVertical size={16} color="#CBD5E0" style={{ flexShrink: 0 }} />
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, color: '#718096',
              flexShrink: 0,
            }}>
              {idx + 2}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1A202C' }}>
                {block.label ?? block.id}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#718096', marginTop: 1 }}>
                {formatDuration(block.totalDuration)} · {block.chapterCount} chapters
              </div>
            </div>
            <button
              onClick={() => onActivate(block.id)}
              title="Go Live with this block"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <SkipForward size={12} /> Go Live
            </button>
          </div>
        ))}

        {queueBlocks.length === 0 && !activeBlock && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#A0AEC0', fontSize: 13 }}>
            No blocks in queue.{' '}
            <Link href="/admin/radio/new" style={{ color: '#2563EB' }}>Register one →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RadioAdminPage() {
  const [blocks, setBlocks] = useState<RadioBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmActivate, setConfirmActivate] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setConfirmActivate(null);
    setActivating(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/radio/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to activate');
      } else {
        setSuccess(`Block "${id}" is now live.`);
        setTimeout(() => setSuccess(''), 4000);
        await load();
      }
    } finally {
      setActivating(null);
    }
  }

  async function remove(id: string) {
    setConfirmDelete(null);
    setDeleting(id);
    setError('');
    try {
      await fetch(`/api/admin/radio/${id}`, { method: 'DELETE' });
      setSuccess(`Block "${id}" deleted.`);
      setTimeout(() => setSuccess(''), 4000);
      await load();
    } finally {
      setDeleting(null);
    }
  }

  const activeBlock = blocks.find((b) => b.isActive);
  const inactiveBlocks = blocks.filter((b) => !b.isActive);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>

      {/* ─── Page header ─── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800 }}>Scroll Radio</h1>
          <p style={{ color: '#718096', fontSize: 14, margin: '4px 0 0' }}>
            Register generated blocks and manage the live Now Playing stream.
          </p>
        </div>
        <Link href="/admin/radio/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700,
          background: '#2e6aa7', color: '#fff', textDecoration: 'none',
        }}>
          + Register Block
        </Link>
      </div>

      {/* ─── Notifications ─── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          <XCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#D1FAE5', color: '#065F46', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* ─── No active block warning ─── */}
      {!activeBlock && !loading && blocks.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <AlertTriangle size={16} color="#D97706" />
          <p style={{ margin: 0, color: '#92400E', fontSize: 14 }}>
            No active block. Click <strong>Go Live</strong> next to a block to start the live stream.
          </p>
        </div>
      )}

      {/* ─── Playlist Queue ─── */}
      {!loading && blocks.length > 0 && (
        <PlaylistQueue
          blocks={blocks}
          activeId={activeBlock?.id}
          onActivate={(id) => setConfirmActivate(id)}
          onReorder={() => { /* order is client-side only for now */ }}
        />
      )}

      {/* ─── Inline activate confirmation ─── */}
      {confirmActivate && (
        <ConfirmRow
          message={`Go live with block "${confirmActivate}"? This will deactivate the current stream and start this block now.`}
          onConfirm={() => activate(confirmActivate)}
          onCancel={() => setConfirmActivate(null)}
        />
      )}

      {/* ─── All Blocks table ─── */}
      <div style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: '0.9375rem' }}>
          All Blocks
        </div>

        {loading ? (
          <div style={{ padding: 24, color: '#718096', fontSize: 14 }}>Loading…</div>
        ) : blocks.length === 0 ? (
          <div style={{ padding: 24, color: '#718096', fontSize: 14 }}>
            No blocks registered yet.{' '}
            <Link href="/admin/radio/new" style={{ color: '#2e6aa7' }}>Register the first one →</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Block ID</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Label</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chapters</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Broadcast Start</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '10px 12px' }} />
                </tr>
              </thead>
              <tbody>
                {blocks.map((b, i) => (
                  <>
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: i < blocks.length - 1 ? '1px solid #F1F5F9' : 'none',
                        background: b.isActive ? '#F0FDF4' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#2D3748' }}>{b.id}</td>
                      <td style={{ padding: '12px 12px', color: '#4A5568' }}>{b.label ?? <span style={{ color: '#CBD5E0' }}>—</span>}</td>
                      <td style={{ padding: '12px 12px', color: '#718096', whiteSpace: 'nowrap' }}>{formatDuration(b.totalDuration)}</td>
                      <td style={{ padding: '12px 12px', color: '#718096' }}>{b.chapterCount || '—'}</td>
                      <td style={{ padding: '12px 12px', color: '#718096', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(b.broadcastStartTime)}</td>
                      <td style={{ padding: '12px 12px' }}>
                        {b.isActive ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#D1FAE5', color: '#065F46', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                            Live
                          </span>
                        ) : b.broadcastStartTime ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F3F4F6', color: '#6B7280', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                            Inactive
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FEF9C3', color: '#854D0E', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                            Unscheduled
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {!b.isActive && (
                            <button
                              onClick={() => setConfirmActivate(b.id)}
                              disabled={activating === b.id}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                background: activating === b.id ? '#E5E7EB' : '#2563EB',
                                color: activating === b.id ? '#9CA3AF' : '#fff',
                                border: 'none', cursor: activating === b.id ? 'default' : 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Play size={11} />
                              {activating === b.id ? 'Activating…' : 'Go Live'}
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDelete(b.id)}
                            disabled={deleting === b.id}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: deleting === b.id ? '#F3F4F6' : '#FEE2E2',
                              color: deleting === b.id ? '#9CA3AF' : '#DC2626',
                              border: '1px solid',
                              borderColor: deleting === b.id ? '#E5E7EB' : '#FECACA',
                              cursor: deleting === b.id ? 'default' : 'pointer',
                            }}
                          >
                            <Trash2 size={11} />
                            {deleting === b.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline confirm delete */}
                    {confirmDelete === b.id && (
                      <tr key={`confirm-del-${b.id}`} style={{ background: '#FEF2F2' }}>
                        <td colSpan={7} style={{ padding: '0 16px 12px' }}>
                          <ConfirmRow
                            danger
                            message={`Permanently delete "${b.id}"? This cannot be undone.`}
                            onConfirm={() => remove(b.id)}
                            onCancel={() => setConfirmDelete(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Activate confirm (for queue Go Live) ─── */}
      {confirmActivate && !blocks.find(b => b.id === confirmActivate) && (
        <ConfirmRow
          message={`Go live with this block? The current stream will be deactivated.`}
          onConfirm={() => activate(confirmActivate)}
          onCancel={() => setConfirmActivate(null)}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
