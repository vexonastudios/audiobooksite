'use client';

import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { PushToast } from '@/components/ui/PushToast';

/**
 * PushNotificationProvider
 *
 * Drop this inside the root layout (client boundary).
 * It renders nothing visible unless a foreground push arrives.
 * Background push notifications are handled by the service worker.
 */
export function PushNotificationProvider() {
  const { foregroundMessage, dismissForegroundMessage } = usePushNotifications();

  if (!foregroundMessage) return null;

  return (
    <PushToast
      title={foregroundMessage.title}
      body={foregroundMessage.body}
      link={foregroundMessage.link}
      onDismiss={dismissForegroundMessage}
    />
  );
}
