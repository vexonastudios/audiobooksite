'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Volume2, Play, X, Bell } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { getAudioElement, usePlayerStore } from '@/lib/store/playerStore';

interface Notification {
  id: string;
  title: string;
  body_text: string;
  audio_url: string;
}

export function NotificationBanner() {
  const [notif, setNotif] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const notificationsEnabled = useUserStore(s => s.notificationsEnabled);
  const heardIds = useUserStore(s => s.heardNotificationIds);
  const markHeard = useUserStore(s => s.markNotificationHeard);

  useEffect(() => {
    if (!notificationsEnabled) return;

    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : null)
      .then((data: Notification | null) => {
        if (!data) return;
        // Don't show if user already dismissed/heard it
        if (heardIds.includes(data.id)) return;
        setNotif(data);
        // Small delay before animating in
        setTimeout(() => setVisible(true), 400);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsEnabled]);

  const handleDismiss = () => {
    if (!notif) return;
    markHeard(notif.id);
    setVisible(false);
    setTimeout(() => setNotif(null), 350);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const handlePlay = () => {
    if (!notif?.audio_url) return;
    
    // Pause it if this notification is currently playing
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    // 1. Pause the main audiobook player so it doesn't overlap or get hijacked
    const mainAudio = getAudioElement();
    if (!mainAudio.paused) {
      mainAudio.pause();
      usePlayerStore.getState().setPlaying(false);
    }

    // 2. Initialize or play the isolated notification audio
    if (!audioRef.current) {
      audioRef.current = new Audio(notif.audio_url);
      audioRef.current.onended = () => {
        setPlaying(false);
        setPlayed(true);
        markHeard(notif.id);
        // Fade out banner after a moment
        setTimeout(() => {
          setVisible(false);
          setTimeout(() => setNotif(null), 350);
        }, 1800);
      };
    }
    
    audioRef.current.play().catch(() => {});
    setPlaying(true);
  };

  if (!notif || !notificationsEnabled) return null;

  return (
    <div
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        borderBottom: '1.5px solid #FCD34D',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 100,
        position: 'relative',
        boxShadow: '0 2px 8px rgba(245,158,11,0.12)',
        marginBottom: 24,
        marginTop: -8,
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(245,158,11,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Bell size={16} style={{ color: '#D97706' }} />
      </div>

      {/* Title + body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400E', lineHeight: 1.2 }}>
          {notif.title}
        </div>
        <div className="notif-body" style={{ fontSize: '0.8125rem', color: '#B45309', marginTop: 2 }}>
          {notif.body_text.length > 100 ? notif.body_text.slice(0, 100) + '…' : notif.body_text}
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={handlePlay}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: playing ? '#D97706' : '#F59E0B',
          color: '#fff',
          border: 'none',
          borderRadius: 20,
          padding: '7px 16px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.8125rem',
          transition: 'background 0.15s, transform 0.1s',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(245,158,11,0.3)',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {playing
          ? <><Volume2 size={14} /> Playing…</>
          : played
            ? <><Play size={14} /> Replay</>
            : <><Play size={14} /> Listen</>
        }
      </button>

      {/* All announcements link */}
      <Link
        href="/announcements"
        className="notif-all-ann"
        style={{ fontSize: '0.75rem', color: '#B45309', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        All announcements
      </Link>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          background: 'none', border: 'none',
          color: '#D97706', cursor: 'pointer',
          padding: 4, borderRadius: 4, flexShrink: 0,
          opacity: 0.7, lineHeight: 1,
        }}
        title="Dismiss"
        aria-label="Dismiss announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
}
