'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Trophy, Headphones, BookOpen, Flame, Star, ArrowLeft } from 'lucide-react';

type BookStat = {
  audiobookId: string;
  title: string;
  slug: string;
  coverImage: string;
  authorName: string;
  totalSecs: number;
  completionPct: number;
  lastListened: string;
  durationSecs: number;
  lengthStr: string;
};

type MyStats = {
  totalSecs: number;
  streak: number;
  booksStarted: number;
  booksCompleted: number;
  favoriteGenre: string | null;
  books: BookStat[];
};

function formatTime(secs: number): string {
  if (secs < 60) return `${Math.round(secs)}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function ProgressBar({ pct, color = '#2e6aa7' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 6, borderRadius: 99, background: 'var(--color-surface-2)', overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '20px 24px', borderRadius: 16, flex: 1, minWidth: 120,
      background: `${color}12`, border: `1px solid ${color}30`,
    }}>
      <div style={{ color, opacity: 0.9 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'center' }}>{label}</div>
    </div>
  );
}

export default function StatsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setLoading(false); return; }
    fetch('/api/analytics/my-stats')
      .then(r => r.json())
      .then(d => { 
        if (d.error) {
          setStats(null);
        } else {
          setStats(d); 
        }
        setLoading(false); 
      })
      .catch(() => { setStats(null); setLoading(false); });
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="page" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 32, borderRadius: 10 }} />
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ flex: 1, height: 100, borderRadius: 16 }} />)}
        </div>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, marginBottom: 12, borderRadius: 12 }} />)}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="page" style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <Trophy size={52} style={{ color: 'var(--color-brand)', marginBottom: 20 }} />
        <h2>Sign in to track your listening</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
          Create a free account to see your listening history, streaks, and progress across all audiobooks.
        </p>
        <Link href="/sign-in" className="btn btn-primary" style={{ display: 'inline-flex' }}>Sign In</Link>
      </div>
    );
  }

  const hasData = stats && stats.booksStarted > 0;

  return (
    <div className="page" style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 80 }}>
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        color: 'var(--color-brand)', textDecoration: 'none',
        fontSize: '0.875rem', fontWeight: 600, marginBottom: 28,
      }}>
        <ArrowLeft size={15} /> Home
      </Link>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2e6aa7 100%)',
        borderRadius: 20, padding: '32px 32px 28px',
        marginBottom: 32, color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>Your Listening Stats</h1>
            <p style={{ margin: 0, opacity: 0.75, fontSize: 14 }}>Your personal audiobook journey</p>
          </div>
        </div>
        <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.02em' }}>
          {formatTime(stats?.totalSecs ?? 0)}
        </div>
        <div style={{ opacity: 0.8, fontSize: 14, marginTop: 4 }}>Total listening time</div>
      </div>

      {!hasData ? (
        <div style={{ textAlign: 'center', paddingTop: 40, color: 'var(--color-text-secondary)' }}>
          <Headphones size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3>No listening data yet</h3>
          <p>Start playing an audiobook to see your stats here!</p>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 16 }}>Browse Audiobooks</Link>
        </div>
      ) : (
        <>
          {/* Stat Pills */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            <StatPill icon={<Flame size={22} />} label="Day Streak" value={`${stats!.streak}`} color="#f59e0b" />
            <StatPill icon={<BookOpen size={22} />} label="Books Started" value={`${stats!.booksStarted}`} color="#2e6aa7" />
            <StatPill icon={<Trophy size={22} />} label="Completed" value={`${stats!.booksCompleted}`} color="#22c55e" />
            {stats!.favoriteGenre && (
              <StatPill icon={<Star size={22} />} label="Top Genre" value={stats!.favoriteGenre} color="#7c3aed" />
            )}
          </div>

          {/* Books List */}
          <h2 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>Your Books</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats!.books.map(b => {
              const completionColor = b.completionPct >= 90 ? '#22c55e' : b.completionPct >= 50 ? '#f59e0b' : '#2e6aa7';
              return (
                <Link key={b.audiobookId} href={`/audiobook/${b.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', gap: 16, alignItems: 'center',
                    padding: '14px 18px', borderRadius: 14,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                  >
                    {b.coverImage && (
                      <img src={b.coverImage} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{b.authorName}</div>
                      <ProgressBar pct={b.completionPct} color={completionColor} />
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: completionColor }}>{b.completionPct}%</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{formatTime(b.totalSecs)} listened</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
