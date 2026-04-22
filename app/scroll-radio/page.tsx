'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Radio, Headphones, Clock, ExternalLink, ToggleLeft, ToggleRight,
  RefreshCw, Play, Music, BookOpen, User, ChevronRight, Mic,
} from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ManifestTrack {
  offset: number;
  duration: number;
  type: 'bumper' | 'chapter';
  title?: string;
  bookTitle?: string;
  bookSlug?: string;
  authorName?: string;
}

interface Manifest {
  blockId: string;
  totalDuration: number;
  generatedAt: string;
  tracks: ManifestTrack[];
}

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
  blockStartSecs?: number;
  schedule?: BlockSchedule[];
  manifestUrl?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/** Group consecutive chapter tracks by bookTitle into book sections */
function groupTracksByBook(tracks: ManifestTrack[]) {
  type BookGroup = { bookTitle: string; bookSlug?: string; authorName?: string; chapters: ManifestTrack[] };
  const groups: BookGroup[] = [];
  for (const t of tracks) {
    if (t.type !== 'chapter') continue;
    const last = groups[groups.length - 1];
    if (last && last.bookTitle === t.bookTitle) {
      last.chapters.push(t);
    } else {
      groups.push({ bookTitle: t.bookTitle!, bookSlug: t.bookSlug, authorName: t.authorName, chapters: [t] });
    }
  }
  return groups;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ScrollRadioPage() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollRadioEnabled = useUserStore((s) => s.scrollRadioEnabled);
  const toggleScrollRadio = useUserStore((s) => s.toggleScrollRadio);

  const fetchManifest = useCallback(async (url: string) => {
    setLoadingManifest(true);
    setManifest(null);
    try {
      const res = await fetch(url);
      if (res.ok) setManifest(await res.json());
    } catch { /* silent */ }
    finally { setLoadingManifest(false); }
  }, []);

  const fetchLive = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch('/api/now-playing');
      if (res.ok) {
        const data: NowPlayingData = await res.json();
        setNowPlaying(data);
        if (data.active && data.manifestUrl) {
          fetchManifest(data.manifestUrl);
        }
      }
    } catch { /* silent */ }
    finally { setLoadingLive(false); setRefreshing(false); }
  }, [fetchManifest]);

  useEffect(() => { fetchLive(); }, [fetchLive]);

  // Position of playhead relative to the start of the current block
  const posInBlock = nowPlaying?.positionSecs ?? 0;

  // Which track in the manifest is currently playing?
  const currentTrack = manifest?.tracks.reduce<ManifestTrack | null>((found, t) => {
    return t.offset <= posInBlock ? t : found;
  }, null);

  const bookGroups = manifest ? groupTracksByBook(manifest.tracks) : [];

  return (
    <div className="page pb-24">

      {/* ── Hero Header ── */}
      <div style={{
        textAlign: 'center', padding: '52px 20px 36px',
        marginBottom: 32,
        background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(229,62,62,0.05) 100%)',
        borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, #e53e3e, #c53030)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(229,62,62,0.25)',
        }}>
          <Radio size={28} />
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
          Scroll Radio
        </h1>
        <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          A 24/7 global broadcast — everyone listens to the same chapter at the same moment.
        </p>
      </div>

      {/* ── Live Status Bar ── */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', background: nowPlaying?.active ? '#e53e3e' : '#718096',
              animation: nowPlaying?.active ? 'radioPulse 1.4s ease-in-out infinite' : 'none',
            }} />
            {loadingLive ? (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Checking broadcast…</span>
            ) : nowPlaying?.active ? (
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', marginRight: 10 }}>
                  {nowPlaying.label ?? 'Scroll Radio — Live'}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Block {(nowPlaying.blockIndex ?? 0) + 1} of {nowPlaying.blockCount} &nbsp;·&nbsp;
                  {fmtTime(posInBlock)} / {fmt(nowPlaying.totalDuration ?? 0)}
                </span>
              </div>
            ) : (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No broadcast active right now</span>
            )}
          </div>
          <button
            onClick={() => fetchLive(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-md)',
              fontWeight: 600, fontSize: '0.8125rem', transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Progress bar across entire playlist */}
        {nowPlaying?.active && (nowPlaying.totalPlaylistDuration ?? 0) > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 5 }}>
              <span>Playlist: {fmtTime(nowPlaying.elapsedPlaylistSecs ?? 0)} elapsed</span>
              <span>{fmt(nowPlaying.totalPlaylistDuration!)} total</span>
            </div>
            <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #e53e3e, #c53030)',
                width: `${Math.min(100, ((nowPlaying.elapsedPlaylistSecs ?? 0) / nowPlaying.totalPlaylistDuration!) * 100)}%`,
                transition: 'width 1s linear',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Currently Playing Chapter ── */}
      {nowPlaying?.active && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

          {/* Now playing track */}
          <div className="card" style={{
            padding: 24,
            background: 'linear-gradient(135deg, rgba(229,62,62,0.07) 0%, rgba(229,62,62,0.02) 100%)',
            border: '1px solid rgba(229,62,62,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Music size={14} style={{ color: '#e53e3e' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e53e3e', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Now Playing
              </span>
            </div>
            {loadingManifest ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading track info…</div>
            ) : currentTrack?.type === 'chapter' ? (
              <>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.3 }}>
                  {currentTrack.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 4px', fontWeight: 600 }}>
                  {currentTrack.bookTitle}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
                  {currentTrack.authorName}
                </p>
                {currentTrack.bookSlug && (
                  <Link href={`/audiobook/${currentTrack.bookSlug}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: '0.8125rem', color: 'var(--color-brand)', fontWeight: 600,
                    textDecoration: 'none',
                  }}>
                    <BookOpen size={13} /> View Audiobook <ChevronRight size={12} />
                  </Link>
                )}
              </>
            ) : currentTrack?.type === 'bumper' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)' }}>
                <Mic size={16} />
                <span style={{ fontStyle: 'italic' }}>Station bumper / intro</span>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No manifest available</div>
            )}
          </div>

          {/* Block progress */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Clock size={14} style={{ color: 'var(--color-brand)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Block Progress
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              {fmtTime(posInBlock)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
              of {fmt(nowPlaying.totalDuration ?? 0)} in this block
            </div>
            <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, var(--color-brand), var(--color-brand-light))',
                width: `${Math.min(100, (posInBlock / (nowPlaying.totalDuration ?? 1)) * 100)}%`,
              }} />
            </div>
            {nowPlaying.manifestUrl && (
              <a href={nowPlaying.manifestUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
                fontSize: '0.8rem', color: 'var(--color-brand)', fontWeight: 600, textDecoration: 'none',
              }}>
                <ExternalLink size={12} /> View raw manifest
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Book/Chapter breakdown from manifest ── */}
      {manifest && bookGroups.length > 0 && (
        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} style={{ color: 'var(--color-brand)' }} />
            Books in This Block
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookGroups.map((group, gi) => {
              const bookStart = group.chapters[0].offset;
              const bookEnd = group.chapters[group.chapters.length - 1].offset + group.chapters[group.chapters.length - 1].duration;
              const isCurrentBook = currentTrack?.bookTitle === group.bookTitle;
              return (
                <div key={gi} style={{
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isCurrentBook ? 'rgba(229,62,62,0.25)' : 'var(--color-border)'}`,
                  background: isCurrentBook ? 'rgba(229,62,62,0.04)' : 'var(--color-surface)',
                  overflow: 'hidden',
                }}>
                  {/* Book header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', gap: 12, flexWrap: 'wrap',
                    borderBottom: '1px solid var(--color-border)',
                    background: isCurrentBook ? 'rgba(229,62,62,0.06)' : 'var(--color-surface-2)',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        {isCurrentBook && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#e53e3e', color: 'white',
                            borderRadius: 20, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', animation: 'radioPulse 1.4s ease-in-out infinite', display: 'inline-block' }} />
                            NOW
                          </span>
                        )}
                        <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {group.bookTitle}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <User size={11} /> {group.authorName}
                        <span>·</span>
                        {group.chapters.length} chapter{group.chapters.length !== 1 ? 's' : ''}
                        <span>·</span>
                        {fmt(bookEnd - bookStart)}
                        <span>·</span>
                        starts at {fmtTime(bookStart)}
                      </div>
                    </div>
                    {group.bookSlug && (
                      <Link href={`/audiobook/${group.bookSlug}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-brand)',
                        textDecoration: 'none', flexShrink: 0,
                      }}>
                        <Headphones size={13} /> Listen <ChevronRight size={11} />
                      </Link>
                    )}
                  </div>

                  {/* Chapter list */}
                  <div style={{ padding: '8px 0' }}>
                    {group.chapters.map((ch, ci) => {
                      const isNow = currentTrack === ch || (
                        currentTrack && currentTrack.offset >= ch.offset && currentTrack.offset < ch.offset + ch.duration
                      );
                      return (
                        <div key={ci} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '8px 18px',
                          background: isNow ? 'rgba(229,62,62,0.05)' : 'transparent',
                        }}>
                          {isNow
                            ? <Play size={12} style={{ color: '#e53e3e', flexShrink: 0 }} />
                            : <span style={{ width: 12, fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', flexShrink: 0 }}>{ci + 1}</span>
                          }
                          <span style={{
                            flex: 1, fontSize: '0.8125rem',
                            fontWeight: isNow ? 700 : 400,
                            color: isNow ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {ch.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                            {fmtTime(ch.offset)} · {fmt(ch.duration)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Full Playlist Schedule ── */}
      {nowPlaying?.active && nowPlaying.schedule && nowPlaying.schedule.length > 1 && (
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={16} style={{ color: '#e53e3e' }} />
            Full Playlist ({nowPlaying.schedule.length} blocks)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nowPlaying.schedule.map((block) => (
              <div key={block.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: block.isCurrent ? 'rgba(229,62,62,0.06)' : 'var(--color-surface-2)',
                border: `1px solid ${block.isCurrent ? 'rgba(229,62,62,0.2)' : 'var(--color-border)'}`,
              }}>
                {block.isCurrent
                  ? <Play size={13} style={{ color: '#e53e3e', flexShrink: 0 }} />
                  : <span style={{ width: 13, fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', flexShrink: 0 }}>{block.playOrder}</span>
                }
                <span style={{
                  flex: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontWeight: block.isCurrent ? 700 : 500,
                  color: block.isCurrent ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                }}>
                  {block.label}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {fmt(block.totalDuration)}
                </span>
                {block.manifestUrl && (
                  <a href={block.manifestUrl} target="_blank" rel="noopener noreferrer"
                    title="View manifest JSON" style={{ color: 'var(--color-brand)', flexShrink: 0, display: 'flex' }}>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── User Preference Toggle ── */}
      <div className="card" style={{
        padding: '20px 24px', marginBottom: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>Show "Now Playing" Button</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            When enabled, a live indicator appears in the top menu bar during broadcasts.
          </p>
        </div>
        <button
          onClick={toggleScrollRadio}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: scrollRadioEnabled ? 'rgba(46,106,167,0.08)' : 'var(--color-surface-2)',
            border: `1.5px solid ${scrollRadioEnabled ? 'var(--color-brand)' : 'var(--color-border)'}`,
            color: scrollRadioEnabled ? 'var(--color-brand)' : 'var(--color-text-muted)',
            padding: '10px 18px', borderRadius: 'var(--radius-lg)',
            cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          {scrollRadioEnabled ? <><ToggleRight size={20} />Enabled</> : <><ToggleLeft size={20} />Disabled</>}
        </button>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontWeight: 600 }}>
          <Headphones size={18} />
          Back to Browse
        </Link>
      </div>

      <style>{`
        @keyframes radioPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.7); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .scroll-radio-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
