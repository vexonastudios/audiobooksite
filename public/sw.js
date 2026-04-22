const CACHE_NAME = 'audiobook-offline-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Only intercept audio requests from our storage domain
  if (requestUrl.hostname === 'audio.scrollreader.com' || requestUrl.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(async (cachedResponse) => {
        // If not in cache, fallback to network
        if (!cachedResponse) {
          return fetch(event.request);
        }

        // Support HTTP Range Requests (Safari/Chrome HTML5 audio scrubbing)
        const rangeHeader = event.request.headers.get('Range');
        if (!rangeHeader) {
          return cachedResponse; // No range requested, return full file
        }

        const buffer = await cachedResponse.arrayBuffer();
        const total = buffer.byteLength;
        
        // Parse "bytes=0-" or "bytes=0-100"
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

        if (start >= total || end >= total) {
          return new Response("", {
            status: 416,
            headers: { "Content-Range": `bytes */${total}` }
          });
        }

        const chunk = buffer.slice(start, end + 1);
        
        return new Response(chunk, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${total}`,
            "Accept-Ranges": "bytes",
            "Content-Length": (end - start + 1).toString(),
            "Content-Type": cachedResponse.headers.get("Content-Type") || "audio/mpeg",
          }
        });
      })
    );
  }
});
