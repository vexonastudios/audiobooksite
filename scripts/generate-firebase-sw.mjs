/**
 * scripts/generate-firebase-sw.mjs
 *
 * Run at build time (see package.json "build" script).
 * Reads NEXT_PUBLIC_FIREBASE_* env vars and writes
 * public/firebase-messaging-sw.js so FCM can initialise
 * inside the service worker without needing importScripts
 * to hit a dynamic API route.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load .env.local (for local dev); Vercel injects these automatically in CI
config({ path: resolve(root, '.env.local'), override: false });

const {
  NEXT_PUBLIC_FIREBASE_API_KEY: apiKey = '',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain = '',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId = '',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: storageBucket = '',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId = '',
  NEXT_PUBLIC_FIREBASE_APP_ID: appId = '',
} = process.env;

const sw = `// AUTO-GENERATED — do not edit. Re-generated on every build.
// See scripts/generate-firebase-sw.mjs

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            ${JSON.stringify(apiKey)},
  authDomain:        ${JSON.stringify(authDomain)},
  projectId:         ${JSON.stringify(projectId)},
  storageBucket:     ${JSON.stringify(storageBucket)},
  messagingSenderId: ${JSON.stringify(messagingSenderId)},
  appId:             ${JSON.stringify(appId)},
});

const messaging = firebase.messaging();

// Handle background messages (app is closed or in another tab)
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  const link = payload.data?.link || '/';

  self.registration.showNotification(title || 'Scroll Reader', {
    body: body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: { link },
    vibrate: [200, 100, 200],
  });
});

// Navigate to the deep link when a notification is tapped
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(link);
      } else {
        clients.openWindow(link);
      }
    })
  );
});
`;

const outPath = resolve(root, 'public', 'firebase-messaging-sw.js');
writeFileSync(outPath, sw, 'utf8');
console.log('✅ firebase-messaging-sw.js written to public/');
