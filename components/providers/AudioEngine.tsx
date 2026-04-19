'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore, getAudioElement } from '@/lib/store/playerStore';
import { useUserStore } from '@/lib/store/userStore';

/**
 * Attaches event listeners to the global <audio> element.
 * This component renders nothing — it's purely a side-effect runner
 * that keeps the Zustand player store in sync with the audio element.
 */
export function AudioEngine() {
  const { setCurrentTime, setDuration, setPlaying, currentBook } = usePlayerStore();
  const addToHistory = useUserStore((s) => s.addToHistory);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = getAudioElement();

    const saveCurrentPosition = () => {
      const book = usePlayerStore.getState().currentBook;
      if (book && audio.currentTime > 0) {
        addToHistory(book.id, audio.currentTime);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Save position to history every 10 seconds
      if (saveTimerRef.current) return;
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        saveCurrentPosition();
      }, 10_000);
    };

    const onDuration = () => setDuration(audio.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      saveCurrentPosition();
    };
    const onEnded = () => {
      setPlaying(false);
      saveCurrentPosition();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    window.addEventListener('beforeunload', saveCurrentPosition);

    // Media Session API — lock-screen controls for PWA & native apps
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        const interval = useUserStore.getState().skipInterval || 15;
        audio.currentTime = Math.max(audio.currentTime - interval, 0);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        const interval = useUserStore.getState().skipInterval || 15;
        audio.currentTime = Math.min(audio.currentTime + interval, audio.duration || 0);
      });
    }

    // Global Hotkeys (Desktop)
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or editable element
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
        return;
      }

      // Only apply hotkeys if a book is actually loaded
      if (!usePlayerStore.getState().currentBook) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault(); // Prevent scrolling page down
          if (audio.paused) audio.play().catch(() => {});
          else audio.pause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          usePlayerStore.getState().skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          usePlayerStore.getState().skipForward();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      saveCurrentPosition();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('beforeunload', saveCurrentPosition);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [setCurrentTime, setDuration, setPlaying, addToHistory]);

  // Update Media Session metadata when book changes
  useEffect(() => {
    if (!currentBook || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentBook.title,
      artist: currentBook.authorName,
      album: 'ScrollReader',
      artwork: currentBook.coverImage
        ? [{ src: currentBook.coverImage, sizes: '512x512', type: 'image/webp' }]
        : [],
    });
  }, [currentBook]);

  return null;
}
