'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { usePlayerStore } from '@/lib/store/playerStore';

const HEARTBEAT_INTERVAL_MS = 30_000;
const PLATFORM = 'web'; // Change to 'ios' or 'android' in Capacitor native wrapper

/** Gets or creates an anonymous session ID for this browser tab. */
function getSessionId(): string {
  let id = sessionStorage.getItem('sr_session_id');
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('sr_session_id', id);
  }
  return id;
}

function fireAndForget(url: string, body: object) {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    // keepalive lets the request survive page unloads
    keepalive: true,
  }).catch(() => {}); // silently swallow any network errors
}

interface UsePlayAnalyticsOptions {
  audiobookId: string | null | undefined;
  isPlaying: boolean;
  currentTime: number;
}

/**
 * Drop this hook into the AudioEngine. It fires-and-forgets:
 *   - One play event when playback starts (deduped per audiobookId per session)
 *   - Heartbeat every 30s with accurate seconds-actually-listened
 *   - Final heartbeat on pause / book change / unmount
 */
export function usePlayAnalytics({ audiobookId, isPlaying, currentTime }: UsePlayAnalyticsOptions) {
  const { userId } = useAuth();

  // Track which book we've already fired a play_event for this session
  const firedPlayRef = useRef<string | null>(null);
  // Track the currentTime at the last heartbeat to compute delta
  const lastHeartbeatTimeRef = useRef<number | null>(null);
  // Track the audiobookId when the interval was started
  const activeBookRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: send a final heartbeat with whatever delta has accumulated
  const flushHeartbeat = (bookId: string) => {
    if (lastHeartbeatTimeRef.current === null) return;
    const now = usePlayerStore.getState().currentTime;
    const delta = now - lastHeartbeatTimeRef.current;
    if (delta > 0 && delta < 600) { // sanity cap at 10 min (handles seek edge cases)
      fireAndForget('/api/analytics/heartbeat', {
        audiobookId: bookId,
        sessionId: getSessionId(),
        platform: PLATFORM,
        listenedSecs: Math.round(delta),
        position: now,
      });
    }
    lastHeartbeatTimeRef.current = null;
  };

  const clearHeartbeatInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!audiobookId) return;

    if (isPlaying) {
      // --- Book changed while playing → flush old book, start fresh ---
      if (activeBookRef.current && activeBookRef.current !== audiobookId) {
        flushHeartbeat(activeBookRef.current);
        clearHeartbeatInterval();
        firedPlayRef.current = null;
      }
      activeBookRef.current = audiobookId;

      // --- Fire play event once per book per session ---
      if (firedPlayRef.current !== audiobookId) {
        firedPlayRef.current = audiobookId;
        fireAndForget('/api/analytics/play', {
          audiobookId,
          sessionId: getSessionId(),
          platform: PLATFORM,
          startPosition: currentTime,
          // userId is read on the server from the Clerk session cookie — no need to send it
        });
        lastHeartbeatTimeRef.current = currentTime;
      }

      // --- Start 30s heartbeat interval ---
      if (!intervalRef.current) {
        lastHeartbeatTimeRef.current = currentTime;
        intervalRef.current = setInterval(() => {
          const book = activeBookRef.current;
          if (!book || lastHeartbeatTimeRef.current === null) return;
          const now = usePlayerStore.getState().currentTime;
          const delta = now - lastHeartbeatTimeRef.current!;
          if (delta > 0 && delta < 600) {
            fireAndForget('/api/analytics/heartbeat', {
              audiobookId: book,
              sessionId: getSessionId(),
              platform: PLATFORM,
              listenedSecs: Math.round(delta),
              position: now,
            });
          }
          lastHeartbeatTimeRef.current = now;
        }, HEARTBEAT_INTERVAL_MS);
      }
    } else {
      // --- Paused → flush remaining seconds, stop interval ---
      if (activeBookRef.current) {
        flushHeartbeat(activeBookRef.current);
      }
      clearHeartbeatInterval();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, audiobookId]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (activeBookRef.current) {
        flushHeartbeat(activeBookRef.current);
      }
      clearHeartbeatInterval();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suppress unused warning — userId is included for potential future use
  void userId;
}
