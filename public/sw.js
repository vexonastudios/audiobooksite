/**
 * Scroll Reader Service Worker
 *
 * Cache strategy:
 *   - Audio files (audio.scrollreader.com / .mp3)   → Cache-first  (offline listening)
 *   - Next.js static assets (/_next/static/)         → Cache-first  (content-hashed, immutable)
 *   - Navigation (HTML pages)                        → Network-first, cache fallback (offline shell)
 *
 * Push notifications:
 *   - Handled via Firebase Cloud Messaging (FCM)
 *   - The firebase-messaging-sw.js compat script is imported below
 */

// ── Firebase Cloud Messaging ──────────────────────────────────────────────────
// FCM requires this exact import to receive background messages via the SW.
// Step 1: Load the server-generated config (injects FIREBASE_* globals)
importScripts('/api/firebase-sw-config');
// Step 2: Load the Firebase compat libs
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// This config is public — no secrets here.
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || '',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || '',
  projectId:         self.FIREBASE_PROJECT_ID         || '',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID|| '',
  appId:             self.FIREBASE_APP_ID             || '',
});

// FCM messaging instance — handles background messages automatically
const _fcmMessaging = firebase.messaging();

// ── Push event (non-FCM fallback, or when FCM data-only) ─────────────────────
self.addEventListener('push', (event) => {
  // FCM compat lib handles most pushes; this is a fallback for data-only messages
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { return; }

  const title = data.title || 'Scroll Reader';
  const options = {
    body:    data.body || '',
    icon:    '/icon-192x192.png',
    badge:   '/icon-192x192.png',
    data:    { url: data.link || data.data?.link || '/' },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click → navigate to link ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing tab if we have one, otherwise open a new window
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});


const AUDIO_CACHE    = 'scrollreader-audio-v1';
const STATIC_CACHE   = 'scrollreader-static-v1';
const PAGE_CACHE     = 'scrollreader-pages-v1';
const IMAGE_CACHE    = 'scrollreader-images-v1';

// Pages to pre-cache immediately when the SW installs so they're available offline right away
const PRECACHE_PAGES = ['/downloads'];

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE)
      .then((cache) =>
        // Try to cache key pages at install time; don't fail install if network is down
        Promise.allSettled(PRECACHE_PAGES.map((url) => cache.add(url)))
      )
    // NOTE: We do NOT call skipWaiting() here.
    // The new SW waits politely until the user confirms the update toast.
    // The PWAUpdater component sends 'SKIP_WAITING' when the user clicks "Update Now".
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old cache versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![AUDIO_CACHE, STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Listen for messages from the PWAUpdater component.
// When the user clicks 'Update Now', the component sends SKIP_WAITING.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch handler ────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Audio files → Cache-first (offline listening)
  const isAudio = url.hostname === 'audio.scrollreader.com' || url.pathname.endsWith('.mp3');
  if (isAudio) {
    event.respondWith(handleAudioRequest(event.request));
    return;
  }

  // 2. Next.js immutable static assets → Cache-first (content-hashed filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      })
    );
    return;
  }

  // 3. Cached images (book covers) — cache-first for offline display
  // Handle both same-origin (/public/*) and known external image hosts
  const isImage =
    url.pathname.match(/\.(png|jpg|jpeg|webp|avif|gif|svg)$/i) &&
    (url.origin === self.location.origin ||
     url.hostname === 'scrollreader.com' ||
     url.hostname === 'audio.scrollreader.com');

  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request.url);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            // Clone before consuming — cache a copy, return the original
            cache.put(event.request.url, response.clone());
          }
          return response;
        } catch {
          // Offline and not cached — return a transparent placeholder
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // 4. HTML page navigation → Network-first, cache fallback
  // This means pages always try to load fresh, but work offline if previously visited.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh page for future offline use
          const clone = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          // Network failed — serve from cache
          const cached = await caches.match(event.request);
          if (cached) return cached;

          // If the specific page isn't cached, fall back to the /downloads page
          // (better than a browser error screen)
          const fallback = await caches.match('/downloads');
          return fallback || new Response(
            '<html><body style="font-family:sans-serif;padding:40px;text-align:center">' +
            '<h2>You\'re offline</h2>' +
            '<p>Open <a href="/downloads">My Downloads</a> to listen to saved audiobooks.</p>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }
});

// ── Audio: Cache-first with Range request support ────────────────────────────

async function handleAudioRequest(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cachedResponse = await cache.match(request.url, { ignoreSearch: false });

  if (!cachedResponse) {
    // Not in audio cache — fetch normally from network
    return fetch(request);
  }

  const rangeHeader = request.headers.get('Range');

  // No range needed — return full cached file (most desktop scenarios)
  if (!rangeHeader) {
    return new Response(cachedResponse.body, {
      status: 200,
      headers: {
        'Content-Type': cachedResponse.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': cachedResponse.headers.get('Content-Length') || '',
        'Accept-Ranges': 'bytes',
      },
    });
  }

  // Range request — required for seeking in Safari (iOS/macOS) and Chrome
  const buffer = await cachedResponse.arrayBuffer();
  const total  = buffer.byteLength;

  const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!rangeMatch) {
    return new Response('Invalid Range', { status: 400 });
  }

  const start = parseInt(rangeMatch[1], 10);
  const end   = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : total - 1;

  if (start >= total || end >= total || start > end) {
    return new Response('', {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` },
    });
  }

  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Range':  `bytes ${start}-${end}/${total}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': String(end - start + 1),
      'Content-Type':   cachedResponse.headers.get('Content-Type') || 'audio/mpeg',
    },
  });
}
