'use client';

import { useState, useEffect } from 'react';
import { Radio, Users, Globe, Headphones, Clock, ExternalLink, ToggleLeft, ToggleRight, RefreshCw, Play, Music } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';

interface BlockSchedule {
  id: string;
  label: string;
  totalDuration: number;
  chapterCount: number;
  mp3Url: string;
  manifestUrl: string | null;
  playOrder: number;
  estimatedStartTime: string;
  isCurrent: boolean;
}

interface NowPlayingData {
  active: boolean;
  blockId?: string;
  label?: string;
  totalDuration?: number;
  positionSecs?: number;
  blockIndex?: number;
  blockCount?: number;
  totalPlaylistDuration?: number;
  elapsedPlaylistSecs?: number;
  schedule?: BlockSchedule[];
  manifestUrl?: string | null;
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ScrollRadioInfoPage() {
  const [data, setData] = useState<NowPlayingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRadioEnabled = useUserStore((s) => s.scrollRadioEnabled);
  const toggleScrollRadio = useUserStore((s) => s.toggleScrollRadio);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch('/api/now-playing');
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="page pb-24">
      {/* ── Header ── */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px 40px',
        marginBottom: 40,
        background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(229,62,62,0.05) 100%)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #e53e3e, #c53030)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 24px rgba(229,62,62,0.25)',
        }}>
          <Radio size={32} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Scroll Radio
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          A 24/7 global broadcast where listeners around the world tune into the exact same story at the exact same moment.
        </p>
      </div>

      {/* ── Live Status ── */}
      <div className="card" style={{ padding: 28, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Music size={20} style={{ color: '#e53e3e' }} />
            Now Playing
          </h2>
          <button
            onClick={() => fetchData(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)', padding: '7px 14px', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem', transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            Loading live status…
          </div>
        ) : !data?.active ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)' }}>
            <Radio size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No broadcast active right now</p>
            <p style={{ margin: '6px 0 0', fontSize: '0.875rem' }}>Check back soon — a new playlist may be queued.</p>
          </div>
        ) : (
          <>
            {/* Current block */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(229,62,62,0.07) 0%, rgba(229,62,62,0.02) 100%)',
              border: '1px solid rgba(229,62,62,0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#e53e3e', color: 'white',
                      borderRadius: 20, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'radioPulse 1.4s ease-in-out infinite', display: 'inline-block' }} />
                      LIVE
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Block {(data.blockIndex ?? 0) + 1} of {data.blockCount}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 6px' }}>{data.label ?? 'Scroll Radio'}</h3>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>⏱ {formatTime(data.positionSecs ?? 0)} / {formatDuration(data.totalDuration ?? 0)}</span>
                    <span>📋 Playlist: {formatTime(data.elapsedPlaylistSecs ?? 0)} / {formatDuration(data.totalPlaylistDuration ?? 0)}</span>
                  </div>
                </div>
                {data.manifestUrl && (
                  <a
                    href={data.manifestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                      color: 'var(--color-brand)', padding: '8px 14px', borderRadius: 'var(--radius-md)',
                      fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none',
                      transition: 'border-color 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    <ExternalLink size={13} />
                    View Manifest
                  </a>
                )}
              </div>
            </div>

            {/* Upcoming schedule */}
            {data.schedule && data.schedule.length > 1 && (
              <div>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                  Full Playlist
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.schedule.map((block) => (
                    <div
                      key={block.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: block.isCurrent ? 'rgba(229,62,62,0.06)' : 'var(--color-surface-2)',
                        border: `1px solid ${block.isCurrent ? 'rgba(229,62,62,0.2)' : 'var(--color-border)'}`,
                      }}
                    >
                      {block.isCurrent ? (
                        <Play size={14} style={{ color: '#e53e3e', flexShrink: 0 }} />
                      ) : (
                        <span style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          {block.playOrder}
                        </span>
                      )}
                      <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: block.isCurrent ? 700 : 500, color: block.isCurrent ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {block.label}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                        {formatDuration(block.totalDuration)}
                      </span>
                      {block.manifestUrl && (
                        <a
                          href={block.manifestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View manifest"
                          style={{ color: 'var(--color-brand)', display: 'flex', flexShrink: 0 }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Preference Toggle ── */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>Show "Now Playing" Button</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            When enabled, a live indicator appears in the top menu when Scroll Radio is broadcasting.
          </p>
        </div>
        <button
          onClick={toggleScrollRadio}
          aria-label={scrollRadioEnabled ? 'Disable Scroll Radio button' : 'Enable Scroll Radio button'}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: scrollRadioEnabled ? 'rgba(46,106,167,0.08)' : 'var(--color-surface-2)',
            border: `1.5px solid ${scrollRadioEnabled ? 'var(--color-brand)' : 'var(--color-border)'}`,
            color: scrollRadioEnabled ? 'var(--color-brand)' : 'var(--color-text-muted)',
            padding: '10px 18px', borderRadius: 'var(--radius-lg)',
            cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          {scrollRadioEnabled
            ? <><ToggleRight size={20} />Enabled</>
            : <><ToggleLeft size={20} />Disabled</>
          }
        </button>
      </div>

      {/* ── Features Grid ── */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>How It Works</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
        marginBottom: 48,
      }}>
        {[
          { Icon: Globe, title: 'Global Synchronization', body: 'When you tune in, you join a live stream. Every listener around the world hears the exact same sentence at the exact same moment.' },
          { Icon: Users, title: 'Shared Experience', body: 'There is something profoundly unifying about knowing believers everywhere are listening to the same missionary biography alongside you.' },
          { Icon: Clock, title: '24/7 Curated Playlist', body: 'We curate a rotating playlist of classic Christian audiobooks. Just tune in and let the stream minister to you — no choices needed.' },
        ].map(({ Icon, title, body }) => (
          <div key={title} className="card" style={{ padding: 28 }}>
            <Icon size={26} style={{ color: '#e53e3e', marginBottom: 16 }} />
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 10 }}>{title}</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <div style={{ textAlign: 'center' }}>
        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontWeight: 600 }}>
          <Headphones size={18} />
          Back to Browse
        </Link>
      </div>

      <style>{`
        @keyframes radioPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
