/**
 * Scroll Reader Service Worker
 *
 * Cache strategy:
 *   - Audio files (audio.scrollreader.com / .mp3)   → Cache-first  (offline listening)
 *   - Next.js static assets (/_next/static/)         → Cache-first  (content-hashed, immutable)
 *   - Navigation (HTML pages)                        → Network-first, cache fallback (offline shell)
 */

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
      .finally(() => self.skipWaiting())
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

  // 3. Cached images (book covers) → Cache-first for offline display
  const isImage = url.pathname.match(/\.(png|jpg|jpeg|webp|avif|gif)$/i);
  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          return response;
        } catch {
          // Return nothing if image isn't cached and we're offline
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
