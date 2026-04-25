'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import {
  requestPushPermissionAndGetToken,
  onForegroundMessage,
} from '@/lib/firebase/client';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * usePushNotifications
 *
 * Manages the entire push notification lifecycle:
 *  - Reads the persisted opt-in preference from Zustand
 *  - Requests permission and obtains FCM token when enabled
 *  - Registers token with the server (/api/user/push-subscribe)
 *  - Listens for foreground messages and shows them as toasts
 *
 * Returns:
 *  - permissionState  Current browser permission (granted/denied/default/unsupported)
 *  - pushEnabled      Whether the user has opted in
 *  - togglePush       Async function to enable/disable
 *  - isLoading        True while requesting permission / saving token
 */
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
      setPermissionState('unsupported');
      return;
    }
    setPermissionState(Notification.permission as PushPermissionState);
  }, []);

  // Listen for foreground messages (app tab is open) and display them
  useEffect(() => {
    if (!pushEnabled) return;
    const unsub = onForegroundMessage((payload) => {
      setForegroundMessage(payload);
      // Auto-clear after 8 seconds
      setTimeout(() => setForegroundMessage(null), 8000);
    });
    return unsub;
  }, [pushEnabled]);

  const enablePush = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await requestPushPermissionAndGetToken();
      if (!token) {
        setPermissionState(Notification.permission as PushPermissionState);
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
      return false;
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

  return {
    permissionState,
    pushEnabled: pushEnabled ?? false,
    togglePush,
    isLoading,
    foregroundMessage,
    dismissForegroundMessage: () => setForegroundMessage(null),
  };
}
