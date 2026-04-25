'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import {
  requestPushPermissionAndGetToken,
  onForegroundMessage,
  deletePushToken,
} from '@/lib/firebase/client';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
  const { pushEnabled, setPushEnabled, isSignedIn, newBookAlertsEnabled } = useUserStore();
  const [permissionState, setPermissionState] = useState<PushPermissionState>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [foregroundMessage, setForegroundMessage] = useState<{
    title?: string; body?: string; link?: string;
  } | null>(null);

  // Read the current browser permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
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

      if (!token) {
        if ('Notification' in window) {
          setPermissionState(Notification.permission as PushPermissionState);
        }
        const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
        if (isCapacitor) {
          setPushEnabled(true);
          return true;
        }
        return false;
      }

      setPermissionState('granted');

      const topics = ['all-users'];
      if (newBookAlertsEnabled) {
        topics.push('new-audiobooks');
      }

      // Register token with our server (now allowed for anonymous guests too)
      await fetch('/api/user/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: 'web', topics }),
      });

      setPushEnabled(true);
      return true;
    } catch (err) {
      console.error('[push] enable failed:', err);
      setPushEnabled(true);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [setPushEnabled]);

  const disablePush = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Unregister natively so the browser stops receiving them immediately
      await deletePushToken();
      // 2. Also try to clean up our DB if they are signed in (best-effort)
      if (isSignedIn) {
        await fetch('/api/user/push-unsubscribe', { method: 'POST' }).catch(() => {});
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
