'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import {
  requestPushPermissionAndGetToken,
  onForegroundMessage,
} from '@/lib/firebase/client';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
  const { pushEnabled, setPushEnabled, isSignedIn } = useUserStore();
  const [permissionState, setPermissionState] = useState<PushPermissionState>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [foregroundMessage, setForegroundMessage] = useState<{
    title?: string; body?: string; link?: string;
  } | null>(null);

  // Read the current browser permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      // iOS Safari / some mobile browsers don't expose Notification at all
      // but FCM via Capacitor or iOS 16.4+ PWA can still work — don't block the UI
      setPermissionState('default');
      return;
    }
    setPermissionState(Notification.permission as PushPermissionState);
  }, []);

  // Listen for foreground messages (app tab is open) and display them
  useEffect(() => {
    if (!pushEnabled) return;
    const unsub = onForegroundMessage((payload) => {
      setForegroundMessage(payload);
      setTimeout(() => setForegroundMessage(null), 8000);
    });
    return unsub;
  }, [pushEnabled]);

  const enablePush = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await requestPushPermissionAndGetToken();

      // If Notification API exists and was denied explicitly, update state
      if (!token) {
        if ('Notification' in window) {
          setPermissionState(Notification.permission as PushPermissionState);
        }
        // Still set pushEnabled=true for Capacitor native — token comes separately
        // on native platforms, but show the toggle as on so the UX isn't broken
        const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
        if (isCapacitor) {
          setPushEnabled(true);
          return true;
        }
        return false;
      }

      setPermissionState('granted');

      // Register token with our server
      if (isSignedIn) {
        await fetch('/api/user/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, platform: 'web' }),
        });
      }

      setPushEnabled(true);
      return true;
    } catch (err) {
      console.error('[push] enable failed:', err);
      // Don't leave the user confused — still toggle the UI on
      // so they can see something happened (token registration may succeed later)
      setPushEnabled(true);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, setPushEnabled]);

  const disablePush = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSignedIn) {
        await fetch('/api/user/push-unsubscribe', { method: 'POST' });
      }
      setPushEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, setPushEnabled]);

  const togglePush = useCallback(async () => {
    if (pushEnabled) {
      await disablePush();
    } else {
      await enablePush();
    }
  }, [pushEnabled, enablePush, disablePush]);

  // Derive whether the toggle should appear interactive
  // Only truly block on explicit browser denial (not unsupported)
  const isBlocked = permissionState === 'denied';

  return {
    permissionState,
    isBlocked,
    pushEnabled: pushEnabled ?? false,
    togglePush,
    isLoading,
    foregroundMessage,
    dismissForegroundMessage: () => setForegroundMessage(null),
  };
}
