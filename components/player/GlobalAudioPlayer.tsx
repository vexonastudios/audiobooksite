'use client';

import { usePlayerStore } from '@/lib/store/playerStore';
import { useUserStore } from '@/lib/store/userStore';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import Link from 'next/link';

function formatTime(s: number) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function GlobalAudioPlayer() {
  const { currentBook, isPlaying, currentTime, duration, activeChapterIndex,
    setPlaying, skipForward, skipBackward, close } = usePlayerStore();
  const skipInterval = useUserStore(s => s.skipInterval);

  if (!currentBook) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeChapter = currentBook.chapters[activeChapterIndex];

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const { getAudioElement } = require('@/lib/store/playerStore');
    const audio = getAudioElement();
    const time = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = time;
  }

  return (
    <div className="player-bar animate-fade-in">
      {/* Cover + Info */}
      <Link href={`/audiobook/${currentBook.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '0 0 auto', maxWidth: 260 }}>
        {currentBook.coverImage ? (
          <img
            src={currentBook.coverImage}
            alt={currentBook.title}
            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--color-brand)', flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0 }}>
          <div className="truncate" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', maxWidth: 180 }}>
            {currentBook.title}
          </div>
          <div className="truncate" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {activeChapter ? activeChapter.title : currentBook.authorName}
          </div>
        </div>
      </Link>

      {/* Controls — center */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-icon"
            onClick={skipBackward}
            title={`Back ${skipInterval}s`}
            style={{ width: 36, height: 36, fontSize: '0.75rem', position: 'relative' }}
          >
            <SkipBack size={18} />
            <span style={{ position: 'absolute', fontSize: '0.5rem', fontWeight: 700, bottom: 4 }}>{skipInterval}</span>
          </button>

          <button
            className="btn-play-large"
            onClick={() => setPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
          </button>

          <button
            className="btn btn-icon"
            onClick={skipForward}
            title={`Forward ${skipInterval}s`}
            style={{ width: 36, height: 36, fontSize: '0.75rem', position: 'relative' }}
          >
            <SkipForward size={18} />
            <span style={{ position: 'absolute', fontSize: '0.5rem', fontWeight: 700, bottom: 4 }}>{skipInterval}</span>
          </button>
        </div>

        {/* Scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 480 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', minWidth: 36, textAlign: 'right' }}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={handleScrub}
            className="scrubber"
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', minWidth: 36 }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Close */}
      <button className="btn btn-icon" onClick={close} title="Close player" style={{ flexShrink: 0 }}>
        <X size={18} />
      </button>
    </div>
  );
}
