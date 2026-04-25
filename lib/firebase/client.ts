/**
 * lib/firebase/client.ts
 *
 * Client-side Firebase SDK singleton.
 * Handles FCM token retrieval for web browsers and PWA.
 * On Capacitor (iOS/Android), we use @capacitor/push-notifications instead.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  try {
    if (!messaging) {
      messaging = getMessaging(getFirebaseApp());
    }
    return messaging;
  } catch {
    return null;
  }
}

/**
 * Request notification permission and get FCM token.
 * Returns the token string or null if denied/unavailable.
 */
export async function requestPushPermissionAndGetToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Safari/older browsers don't support Web Push
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const msg = getFirebaseMessaging();
  if (!msg) return null;

  try {
    // FCM requires its own dedicated service worker at /firebase-messaging-sw.js
    // (generated at build time by scripts/generate-firebase-sw.mjs)
    let swReg: ServiceWorkerRegistration;
    try {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      console.log('[FCM] firebase-messaging-sw.js registered');
    } catch {
      // Fall back to the existing sw.js if registration fails
      swReg = await navigator.serviceWorker.ready;
    }

    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    console.log('[FCM] token obtained:', token ? token.slice(0, 20) + '…' : 'null');
    return token || null;
  } catch (err) {
    console.warn('[FCM] getToken failed:', err);
    return null;
  }
}

/**
 * Listen for foreground push messages (app is open).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; link?: string }) => void,
): () => void {
  const msg = getFirebaseMessaging();
  if (!msg) return () => {};

  return onMessage(msg, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      link: (payload.data?.link as string) || '/',
    });
  });
}
