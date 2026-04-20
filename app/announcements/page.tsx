'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Play, Volume2, Calendar } from 'lucide-react';
import { getAudioElement, usePlayerStore } from '@/lib/store/playerStore';

interface Notification {
  id: string;
  title: string;
  body_text: string;
  audio_url: string;
  created_at: string;
  expires_at: string | null;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/notifications/all')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
      
    // Cleanup isolated audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handlePlay = (notif: Notification) => {
    if (playingId === notif.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    // 1. Pause the main audiobook player so it doesn't overlap or get hijacked
    const mainAudio = getAudioElement();
    if (!mainAudio.paused) {
      mainAudio.pause();
      usePlayerStore.getState().setPlaying(false);
    }

    // 2. Play using our isolated audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
    } else {
      audioRef.current.pause();
    }

    audioRef.current.src = notif.audio_url;
    audioRef.current.load();
    audioRef.current.onended = () => setPlayingId(null);
    audioRef.current.play().catch(() => {});
    setPlayingId(notif.id);
  };

  return (
    <div className="page" style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 96 }}>

      {/* Page header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(245,158,11,0.1)', color: '#D97706',
          padding: '6px 14px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14,
        }}>
          <Bell size={13} /> Announcements
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 10 }}>
          ScrollReader Updates
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.0625rem', lineHeight: 1.65, maxWidth: 560 }}>
          Audio announcements from the ScrollReader team — new books, site updates, and more.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
          <Bell size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>No announcements yet. Check back soon!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map(notif => {
            const isExpired = notif.expires_at && new Date(notif.expires_at) < new Date();
            const isPlaying = playingId === notif.id;

            return (
              <div
                key={notif.id}
                style={{
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 16,
                  padding: '20px 24px',
                  background: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  opacity: isExpired ? 0.55 : 1,
                  transition: 'box-shadow 0.15s ease',
                }}
                className="notification-card"
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: isPlaying ? '#FEF3C7' : 'rgba(245,158,11,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: isPlaying ? '2px solid #FCD34D' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                }}>
                  {isPlaying
                    ? <Volume2 size={18} style={{ color: '#D97706' }} />
                    : <Bell size={18} style={{ color: '#D97706' }} />
                  }
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {notif.title}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      <Calendar size={12} />
                      {new Date(notif.created_at).toLocaleDateString(undefined, {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                      {isExpired && (
                        <span style={{ background: '#F3F4F6', color: '#9CA3AF', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>
                          Expired
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: '8px 0 16px', color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.65 }}>
                    {notif.body_text}
                  </p>

                  {notif.audio_url && (
                    <button
                      onClick={() => handlePlay(notif)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        background: isPlaying ? '#D97706' : '#FFFBEB',
                        color: isPlaying ? '#fff' : '#B45309',
                        border: `1.5px solid ${isPlaying ? '#D97706' : '#FCD34D'}`,
                        borderRadius: 20,
                        padding: '7px 18px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isPlaying
                        ? <><Volume2 size={14} /> Playing…</>
                        : <><Play size={14} /> Play Audio</>
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .notification-card:hover {
          box-shadow: var(--shadow-md) !important;
        }
      `}</style>
    </div>
  );
}
