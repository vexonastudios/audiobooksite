'use client';

import { useState } from 'react';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useUserStore } from '@/lib/store/userStore';
import { Play, Pause, SkipBack, SkipForward, X, RotateCcw, RotateCw } from 'lucide-react';
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

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function GlobalAudioPlayer() {
  const { currentBook, isPlaying, currentTime, duration, activeChapterIndex,
    playbackSpeed, setPlaying, skipForward, skipBackward, setPlaybackSpeed, jumpToChapter, close } = usePlayerStore();
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
    <>
      <style>{`
        :root {
          --player-height-dynamic: var(--player-height);
        }
      `}</style>
      <div className="player-bar animate-fade-in">

        {/* Cover + Info */}
        <Link href={`/audiobook/${currentBook.slug}`} className="player-info-section" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          minWidth: 0, flex: '0 0 auto', maxWidth: 240, textDecoration: 'none',
        }}>
          {currentBook.coverImage ? (
            <img
              src={currentBook.coverImage}
              alt={currentBook.title}
              style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}
            />
          ) : (
            <div style={{ width: 46, height: 46, borderRadius: 10, background: 'var(--color-brand)', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div className="truncate" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', maxWidth: 170 }}>
              {currentBook.title}
            </div>
            <div className="truncate" style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {activeChapter ? activeChapter.title : currentBook.authorName}
            </div>
          </div>
        </Link>

        {/* Controls — center */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

            {/* Prev Track */}
            <button 
              className="btn-icon" 
              onClick={() => jumpToChapter(activeChapterIndex - 1)} 
              disabled={activeChapterIndex === 0} 
              style={{ opacity: activeChapterIndex === 0 ? 0.3 : 1 }}
              title="Previous Chapter"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>

            {/* Rewind 15s */}
            <button
              className="btn-skip"
              onClick={skipBackward}
              title={`Back ${skipInterval}s`}
            >
              <RotateCcw size={22} strokeWidth={2.5} />
              <span className="skip-label">{skipInterval}</span>
            </button>

            {/* Play / Pause */}
            <button
              className="btn-play-large"
              onClick={() => setPlaying(!isPlaying)}
              title={isPlaying ? 'Pause' : 'Play'}
              style={{ width: 48, height: 48 }}
            >
              {isPlaying
                ? <Pause size={20} strokeWidth={2.5} fill="currentColor" color="currentColor" />
                : <Play size={20} strokeWidth={2.5} style={{ marginLeft: 2 }} fill="currentColor" color="currentColor" />
              }
            </button>

            {/* Fast-forward 15s */}
            <button
              className="btn-skip"
              onClick={skipForward}
              title={`Forward ${skipInterval}s`}
            >
              <RotateCw size={22} strokeWidth={2.5} />
              <span className="skip-label">{skipInterval}</span>
            </button>

            {/* Next Track */}
            <button 
              className="btn-icon" 
              onClick={() => jumpToChapter(activeChapterIndex + 1)} 
              disabled={activeChapterIndex >= (currentBook.chapters?.length || 1) - 1} 
              style={{ opacity: activeChapterIndex >= (currentBook.chapters?.length || 1) - 1 ? 0.3 : 1 }}
              title="Next Chapter"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>

            {/* Speed Toggle — hidden on mobile */}
            <button
              className="player-speed-btn player-desktop-only"
              onClick={() => {
                const currentIndex = SPEEDS.indexOf(playbackSpeed);
                const nextIndex = currentIndex === -1 || currentIndex === SPEEDS.length - 1 ? 0 : currentIndex + 1;
                setPlaybackSpeed(SPEEDS[nextIndex]);
              }}
              style={{
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: 20,
                background: 'transparent',
                color: 'var(--color-text-primary)',
                border: '1.5px solid var(--color-text-primary)', /* Solid border exactly like the screenshot */
                cursor: 'pointer',
                minWidth: 52,
                textAlign: 'center',
                transition: 'background var(--transition-fast), transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              title="Playback speed"
            >
              {playbackSpeed}x
            </button>

          </div>

          {/* Scrubber — hidden on mobile */}
          <div className="player-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 460 }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', minWidth: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
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
              style={{
                flex: 1,
                background: `linear-gradient(to right, var(--color-brand) ${progress}%, rgba(46, 106, 167, 0.25) ${progress}%)`
              }}
            />
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', minWidth: 38, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Close */}
        <button className="btn-icon" onClick={close} title="Close player" style={{ flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>
    </>
  );
}
