'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Audiobook, Chapter } from '@/lib/types';

interface PlayerState {
  // Current track
  currentBook: Audiobook | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  activeChapterIndex: number;
  volume: number;

  // Actions
  loadBook: (book: Audiobook, startTime?: number) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  jumpToChapter: (index: number) => void;
  close: () => void;
}

/**
 * Finds which chapter is active based on current playback time.
 * Returns the highest chapter index whose startTime <= currentTime.
 */
function computeChapterIndex(chapters: Chapter[], currentTime: number): number {
  if (!chapters.length) return 0;
  let active = 0;
  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i].startTime <= currentTime) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}

// A ref to the actual <audio> element — kept outside Zustand so it's never serialized
let audioEl: HTMLAudioElement | null = null;

export function getAudioElement(): HTMLAudioElement {
  if (!audioEl && typeof window !== 'undefined') {
    audioEl = new Audio();
    audioEl.preload = 'metadata';
  }
  return audioEl!;
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  currentBook: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1.0,
  activeChapterIndex: 0,
  volume: 1.0,

  loadBook: (book, startTime = 0) => {
    const audio = getAudioElement();
    const wasPlaying = !audio.paused;

    if (audio.src !== book.mp3Url) {
      audio.src = book.mp3Url;
      audio.load();
    }
    audio.currentTime = startTime;
    audio.playbackRate = get().playbackSpeed;
    audio.volume = get().volume;
    audio.play().catch(() => {});

    set({
      currentBook: book,
      isPlaying: true,
      currentTime: startTime,
      activeChapterIndex: computeChapterIndex(book.chapters, startTime),
    });
  },

  setPlaying: (playing) => {
    const audio = getAudioElement();
    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    set({ isPlaying: playing });
  },

  setCurrentTime: (time) => {
    const { currentBook } = get();
    const chapterIndex = currentBook
      ? computeChapterIndex(currentBook.chapters, time)
      : 0;
    set({ currentTime: time, activeChapterIndex: chapterIndex });
  },

  setDuration: (duration) => set({ duration }),

  setPlaybackSpeed: (speed) => {
    getAudioElement().playbackRate = speed;
    set({ playbackSpeed: speed });
  },

  setVolume: (volume) => {
    getAudioElement().volume = volume;
    set({ volume });
  },

  skipForward: () => {
    const audio = getAudioElement();
    audio.currentTime = Math.min(audio.currentTime + 15, audio.duration || 0);
  },

  skipBackward: () => {
    const audio = getAudioElement();
    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  },

  jumpToChapter: (index) => {
    const { currentBook } = get();
    if (!currentBook?.chapters[index]) return;
    const time = currentBook.chapters[index].startTime;
    const audio = getAudioElement();
    audio.currentTime = time;
    if (audio.paused) {
      audio.play().catch(() => {});
      set({ isPlaying: true });
    }
  },

  close: () => {
    const audio = getAudioElement();
    audio.pause();
    audio.src = '';
    set({
      currentBook: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      activeChapterIndex: 0,
    });
  },
}));
