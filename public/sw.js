/**
 * Scroll Reader Service Worker
 * Intercepts audio requests and serves from cache when available.
 * Handles HTTP Range requests so seeking works fully offline.
 */

const CACHE_NAME = 'audiobook-offline-cache-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept requests that could be audio files
  const isAudioDomain = url.hostname === 'audio.scrollreader.com';
  const isMp3 = url.pathname.endsWith('.mp3');
  if (!isAudioDomain && !isMp3) return;

  event.respondWith(handleAudioRequest(event.request));
});

async function handleAudioRequest(request) {
  // Try to find a cache match using the exact URL (cache keys are the R2 URLs)
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request.url, { ignoreSearch: false });

  // Not cached — go to network as normal
  if (!cachedResponse) {
    return fetch(request);
  }

  const rangeHeader = request.headers.get('Range');

  // No range header — return the full cached file (most desktop browsers)
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

  // Range request — needed for scrubbing in Safari (iOS/macOS) and Chrome
  const buffer = await cachedResponse.arrayBuffer();
  const total = buffer.byteLength;

  // Parse "bytes=START-END" or "bytes=START-"
  const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!rangeMatch) {
    return new Response('Invalid Range header', { status: 400 });
  }

  const start = parseInt(rangeMatch[1], 10);
  const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : total - 1;

  if (start >= total || end >= total || start > end) {
    return new Response('', {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` },
    });
  }

  const chunk = buffer.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    headers: {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(end - start + 1),
      'Content-Type': cachedResponse.headers.get('Content-Type') || 'audio/mpeg',
    },
  });
}
