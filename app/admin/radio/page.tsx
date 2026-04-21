'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  GripVertical, Play, Trash2, Radio, CheckCircle, XCircle,
  AlertTriangle, Square, RefreshCw, Clock, Layers,
} from 'lucide-react';

interface RadioBlock {
  id: string;
  mp3Url: string;
  manifestUrl: string;
  totalDuration: number;
  chapterCount: number;
  label: string | null;
  broadcastStartTime: string | null;
  isActive: boolean;
  playOrder: number | null;
  generatedAt: string;
  createdAt: string;
}

interface ScheduleEntry {
  id: string;
  label: string | null;
  totalDuration: number;
  chapterCount: number;
  mp3Url: string;
  manifestUrl: string;
  playOrder: number | null;
  estimatedStartTime: string;
  isCurrent: boolean;
}

interface NowPlayingInfo {
  active: boolean;
  queued?: boolean;
  queueLength?: number;
  blockId?: string;
  label?: string;
  positionSecs?: number;
  totalDuration?: number;
  blockIndex?: number;
  blockCount?: number;
  blockStartSecs?: number;
  elapsedPlaylistSecs?: number;
  totalPlaylistDuration?: number;
  playlistStartTime?: string;
  schedule?: ScheduleEntry[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function pct(pos: number, dur: number) {
  if (!dur) return 0;
  return Math.min(100, (pos / dur) * 100);
}

// ── Inline confirm ─────────────────────────────────────────────────────────────
function ConfirmRow({ message, onConfirm, onCancel, danger = false }: {
  message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      background: danger ? '#FEF2F2' : '#EFF6FF',
      border: `1px solid ${danger ? '#FECACA' : '#BFDBFE'}`,
      borderRadius: 10, marginTop: 8, flexWrap: 'wrap',
    }}>
      <AlertTriangle size={15} color={danger ? '#DC2626' : '#2563EB'} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: danger ? '#991B1B' : '#1E40AF', flex: 1 }}>{message}</span>
      <button onClick={onConfirm} style={{
        padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
        background: danger ? '#DC2626' : '#2563EB', color: '#fff', border: 'none', cursor: 'pointer',
      }}>Confirm</button>
      <button onClick={onCancel} style={{
        padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', cursor: 'pointer',
      }}>Cancel</button>
    </div>
  );
}

// ── Now-Playing Dashboard Card ─────────────────────────────────────────────────
function NowPlayingDashboard({ info, onRefresh }: { info: NowPlayingInfo | null; onRefresh: () => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  if (!info) return null;

  if (!info.active && !info.queued) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#FFFBEB', border: '1px solid #FDE68A',
        borderRadius: 12, padding: '14px 18px', marginBottom: 24,
      }}>
        <AlertTriangle size={16} color="#D97706" />
        <span style={{ fontSize: 14, color: '#92400E' }}>
          No active playlist. Add blocks to the queue below and click <strong>Start Playlist</strong>.
        </span>
      </div>
    );
  }

  if (info.queued && !info.active) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#EFF6FF', border: '1px solid #BFDBFE',
        borderRadius: 12, padding: '14px 18px', marginBottom: 24,
      }}>
        <Clock size={16} color="#2563EB" />
        <span style={{ fontSize: 14, color: '#1E40AF' }}>
          {info.queueLength} block{info.queueLength !== 1 ? 's' : ''} queued — click <strong>Start Playlist</strong> to go live.
        </span>
      </div>
    );
  }

  // Derive live position
  const startMs = info.playlistStartTime ? new Date(info.playlistStartTime).getTime() : 0;
  const liveElapsed = (Date.now() - startMs) / 1000;
  const loopedElapsed = info.totalPlaylistDuration ? liveElapsed % info.totalPlaylistDuration : liveElapsed;

  // Current block progress
  const blockPos = info.blockStartSecs !== undefined ? loopedElapsed - info.blockStartSecs : (info.positionSecs ?? 0);
  const blockDur = info.totalDuration ?? 0;
  const blockPct = pct(blockPos, blockDur);

  // Playlist progress
  const playlistPct = pct(loopedElapsed, info.totalPlaylistDuration ?? 0);

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #065F46, #047857)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: '#4ADE80',
          animation: 'pulse 1.5s infinite', flexShrink: 0,
        }} />
        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9375rem' }}>
          🔴 LIVE — Scroll Radio
        </span>
        <button
          onClick={onRefresh}
          style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div style={{ padding: '18px 20px 20px' }}>
        {/* Current block */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Block {(info.blockIndex ?? 0) + 1} of {info.blockCount}
              </span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1A202C', marginTop: 2 }}>
                {info.label ?? info.blockId}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#718096' }}>
              <div>{formatDuration(Math.round(blockPos))} / {formatDuration(blockDur)}</div>
              <div style={{ marginTop: 2, color: '#059669', fontWeight: 600 }}>{Math.round(blockPct)}% through</div>
            </div>
          </div>
          {/* Block progress bar */}
          <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${blockPct}%`,
              background: 'linear-gradient(90deg, #059669, #10B981)',
              borderRadius: 4, transition: 'width 2s linear',
            }} />
          </div>
        </div>

        {/* Playlist overview */}
        {(info.totalPlaylistDuration ?? 0) > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#718096', marginBottom: 4 }}>
              <span>Playlist progress</span>
              <span>{formatDuration(Math.round(loopedElapsed))} / {formatDuration(info.totalPlaylistDuration ?? 0)}</span>
            </div>
            <div style={{ height: 5, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${playlistPct}%`,
                background: 'linear-gradient(90deg, #2563EB, #3B82F6)',
                borderRadius: 4, transition: 'width 2s linear',
              }} />
            </div>
          </div>
        )}

        {/* Schedule */}
        {info.schedule && info.schedule.length > 1 && (
          <div style={{ marginTop: 18, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Full Schedule
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {info.schedule.map((entry, i) => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: entry.isCurrent ? '#F0FDF4' : '#F8FAFC',
                  border: `1px solid ${entry.isCurrent ? '#A7F3D0' : '#F1F5F9'}`,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: entry.isCurrent ? '#059669' : '#E2E8F0',
                    color: entry.isCurrent ? '#fff' : '#718096',
                    fontSize: '0.68rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: entry.isCurrent ? 700 : 500, color: entry.isCurrent ? '#065F46' : '#2D3748', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.label ?? entry.id}
                    </div>
                    <div style={{ fontSize: 11, color: '#718096', marginTop: 1 }}>
                      {formatDuration(entry.totalDuration)} · starts ~{formatTime(entry.estimatedStartTime)}
                    </div>
                  </div>
                  {entry.isCurrent && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '2px 8px', borderRadius: 99 }}>
                      NOW
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Drag-to-reorder Queue ──────────────────────────────────────────────────────
function QueueBuilder({
  blocks,
  queue,
  setQueue,
  isRunning,
}: {
  blocks: RadioBlock[];
  queue: string[];
  setQueue: (ids: string[]) => void;
  isRunning: boolean;
}) {
  const dragId = useRef<string | null>(null);
  const overIdx = useRef<number>(-1);

  const queuedBlocks = queue.map((id) => blocks.find((b) => b.id === id)).filter(Boolean) as RadioBlock[];
  const unqueued = blocks.filter((b) => !queue.includes(b.id));

  function removeFromQueue(id: string) {
    setQueue(queue.filter((q) => q !== id));
  }

  function addToQueue(id: string) {
    setQueue([...queue, id]);
  }

  function handleDragStart(id: string) { dragId.current = id; }
  function handleDragEnter(idx: number) { overIdx.current = idx; }
  function handleDragEnd() {
    if (dragId.current === null || overIdx.current === -1) return;
    const from = queue.indexOf(dragId.current);
    if (from === -1) return;
    const next = [...queue];
    next.splice(from, 1);
    next.splice(overIdx.current, 0, dragId.current);
    setQueue(next);
    dragId.current = null;
    overIdx.current = -1;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }} className="queue-grid">
      {/* Left: Queue */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #1e40af08, transparent)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Layers size={16} color="#2563EB" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Playlist Queue</div>
            <div style={{ fontSize: 11, color: '#718096', marginTop: 1 }}>Drag to reorder · {queuedBlocks.length} block{queuedBlocks.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div style={{ minHeight: 80, padding: queuedBlocks.length ? 0 : '24px 18px' }}>
          {queuedBlocks.length === 0 ? (
            <p style={{ fontSize: 13, color: '#A0AEC0', margin: 0 }}>
              No blocks in queue. Add from the right →
            </p>
          ) : (
            queuedBlocks.map((b, i) => (
              <div
                key={b.id}
                draggable
                onDragStart={() => handleDragStart(b.id)}
                onDragEnter={() => handleDragEnter(i)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px',
                  borderBottom: i < queuedBlocks.length - 1 ? '1px solid #F1F5F9' : 'none',
                  cursor: 'grab',
                  background: isRunning && b.isActive && b.playOrder === i + 1 ? '#F0FDF4' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <GripVertical size={15} color="#CBD5E0" style={{ flexShrink: 0 }} />
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#E2E8F0', color: '#718096',
                  fontSize: '0.68rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.label ?? b.id}
                  </div>
                  <div style={{ fontSize: 11, color: '#718096', marginTop: 1 }}>
                    {formatDuration(b.totalDuration)} · {b.chapterCount} ch
                  </div>
                </div>
                <button
                  onClick={() => removeFromQueue(b.id)}
                  style={{ background: 'none', border: 'none', color: '#CBD5E0', cursor: 'pointer', padding: 4 }}
                  title="Remove from queue"
                >
                  <XCircle size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Available blocks */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: '0.875rem' }}>
          Available Blocks
          <div style={{ fontSize: 11, color: '#718096', fontWeight: 400, marginTop: 1 }}>Click + to add to queue</div>
        </div>
        <div style={{ minHeight: 80, padding: unqueued.length ? 0 : '24px 18px' }}>
          {unqueued.length === 0 ? (
            <p style={{ fontSize: 13, color: '#A0AEC0', margin: 0 }}>
              All blocks are in the queue.
            </p>
          ) : (
            unqueued.map((b, i) => (
              <div key={b.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                borderBottom: i < unqueued.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.label ?? b.id}
                  </div>
                  <div style={{ fontSize: 11, color: '#718096', marginTop: 1 }}>
                    {formatDuration(b.totalDuration)} · {b.chapterCount} ch · {formatDate(b.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => addToQueue(b.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer',
                  }}
                >
                  + Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) { .queue-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RadioAdminPage() {
  const [blocks, setBlocks] = useState<RadioBlock[]>([]);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [blocksRes, npRes] = await Promise.all([
        fetch('/api/admin/radio'),
        fetch('/api/now-playing'),
      ]);
      const blocksData = await blocksRes.json();
      const npData = await npRes.json();
      const fetchedBlocks: RadioBlock[] = blocksData.blocks ?? [];
      setBlocks(fetchedBlocks);
      setNowPlaying(npData);

      // Initialize queue from DB play_order
      const queued = fetchedBlocks
        .filter((b) => b.playOrder != null)
        .sort((a, b) => (a.playOrder ?? 0) - (b.playOrder ?? 0))
        .map((b) => b.id);
      if (queued.length > 0) setQueue(queued);
    } catch {
      setError('Failed to load radio data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh now-playing every 15s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/now-playing');
        if (res.ok) setNowPlaying(await res.json());
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(id);
  }, []);

  function toast(msg: string, isError = false) {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  }

  async function startPlaylist() {
    if (queue.length === 0) return toast('Add at least one block to the queue.', true);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/radio/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: queue }),
      });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Failed', true); return; }
      toast('Playlist started! 🔴 Now live.');
      await load();
    } finally { setSaving(false); }
  }

  async function saveOrder() {
    if (queue.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/admin/radio/playlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: queue }),
      });
      toast('Queue order saved.');
      await load();
    } finally { setSaving(false); }
  }

  async function stopPlaylist() {
    setConfirmStop(false);
    setSaving(true);
    try {
      await fetch('/api/admin/radio/playlist', { method: 'DELETE' });
      setQueue([]);
      toast('Playlist stopped.');
      await load();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    setConfirmDelete(null);
    setDeleting(id);
    try {
      await fetch(`/api/admin/radio/${id}`, { method: 'DELETE' });
      setQueue((q) => q.filter((qid) => qid !== id));
      toast(`Block deleted.`);
      await load();
    } finally { setDeleting(null); }
  }

  const isRunning = nowPlaying?.active === true;
  const totalQueueDuration = queue
    .map((id) => blocks.find((b) => b.id === id)?.totalDuration ?? 0)
    .reduce((a, b) => a + b, 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: isRunning ? 'linear-gradient(135deg, #059669, #10B981)' : '#E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Radio size={22} color={isRunning ? '#fff' : '#718096'} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              Scroll Radio
              {isRunning && (
                <span style={{ fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '3px 10px', borderRadius: 99 }}>
                  ● LIVE
                </span>
              )}
            </h1>
            <p style={{ color: '#718096', fontSize: 13, margin: '3px 0 0' }}>
              Build your playlist queue, drag to reorder, and go live.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/admin/radio/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: '#F1F5F9', color: '#374151', textDecoration: 'none', border: '1px solid #E2E8F0',
          }}>
            + Register Block
          </Link>
          {isRunning ? (
            <button onClick={() => setConfirmStop(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer',
            }}>
              <Square size={13} /> Stop Broadcast
            </button>
          ) : (
            <button onClick={startPlaylist} disabled={saving || queue.length === 0} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: saving || queue.length === 0 ? '#E5E7EB' : '#059669',
              color: saving || queue.length === 0 ? '#9CA3AF' : '#fff',
              border: 'none', cursor: saving || queue.length === 0 ? 'default' : 'pointer',
            }}>
              <Play size={13} /> {saving ? 'Starting…' : 'Start Playlist'}
            </button>
          )}
          {isRunning && queue.length > 0 && (
            <button onClick={saveOrder} disabled={saving} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: saving ? 'default' : 'pointer',
            }}>
              <RefreshCw size={13} /> Save Order
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          <XCircle size={15} /> {error}
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#D1FAE5', color: '#065F46', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          <CheckCircle size={15} /> {success}
        </div>
      )}

      {/* Stop confirm */}
      {confirmStop && (
        <div style={{ marginBottom: 16 }}>
          <ConfirmRow
            danger
            message="Stop the live broadcast? This will deactivate all blocks and clear the queue."
            onConfirm={stopPlaylist}
            onCancel={() => setConfirmStop(false)}
          />
        </div>
      )}

      {/* Now Playing dashboard */}
      {!loading && <NowPlayingDashboard info={nowPlaying} onRefresh={load} />}

      {/* Queue builder */}
      {!loading && blocks.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>
              Playlist Builder
            </div>
            {totalQueueDuration > 0 && (
              <div style={{ fontSize: 12, color: '#718096' }}>
                Total runtime: {formatDuration(totalQueueDuration)}
              </div>
            )}
          </div>
          <QueueBuilder blocks={blocks} queue={queue} setQueue={setQueue} isRunning={isRunning} />
        </div>
      )}

      {/* All Blocks table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          All Registered Blocks
          <span style={{ fontSize: 12, color: '#718096', fontWeight: 400 }}>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
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
                  {['#', 'Block ID', 'Label', 'Duration', 'Chapters', 'Created', 'Status', ''].map((h) => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blocks.map((b, i) => (
                  <>
                    <tr key={b.id} style={{ borderBottom: i < blocks.length - 1 ? '1px solid #F1F5F9' : 'none', background: b.isActive ? '#F0FDF4' : 'transparent' }}>
                      <td style={{ padding: '11px 12px', color: '#A0AEC0', fontWeight: 700 }}>
                        {b.playOrder ?? '—'}
                      </td>
                      <td style={{ padding: '11px 12px', fontFamily: 'monospace', fontSize: 12, color: '#2D3748' }}>{b.id}</td>
                      <td style={{ padding: '11px 12px', color: '#4A5568' }}>{b.label ?? <span style={{ color: '#CBD5E0' }}>—</span>}</td>
                      <td style={{ padding: '11px 12px', color: '#718096', whiteSpace: 'nowrap' }}>{formatDuration(b.totalDuration)}</td>
                      <td style={{ padding: '11px 12px', color: '#718096' }}>{b.chapterCount || '—'}</td>
                      <td style={{ padding: '11px 12px', color: '#718096', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(b.createdAt)}</td>
                      <td style={{ padding: '11px 12px' }}>
                        {b.isActive && b.playOrder === (nowPlaying?.blockIndex ?? -1) + 1 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#D1FAE5', color: '#065F46', padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                            On-Air
                          </span>
                        ) : b.isActive ? (
                          <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Queued</span>
                        ) : b.broadcastStartTime ? (
                          <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Inactive</span>
                        ) : (
                          <span style={{ background: '#FEF9C3', color: '#854D0E', padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Unscheduled</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        <button
                          onClick={() => setConfirmDelete(b.id)}
                          disabled={deleting === b.id}
                          title="Delete block"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 9px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                            background: '#FEE2E2', color: '#DC2626',
                            border: '1px solid #FECACA', cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={11} /> {deleting === b.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                    {confirmDelete === b.id && (
                      <tr key={`del-${b.id}`}>
                        <td colSpan={8} style={{ padding: '0 12px 10px' }}>
                          <ConfirmRow
                            danger
                            message={`Permanently delete "${b.label ?? b.id}"? This cannot be undone.`}
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

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
