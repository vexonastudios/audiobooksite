// AUTO-GENERATED — do not edit. Re-generated on every build.
// See scripts/generate-firebase-sw.mjs

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDNSpbNj00vUdDy7oTw7jWsW-EMngQvf0g",
  authDomain:        "scroll-reader-d4c8b.firebaseapp.com",
  projectId:         "scroll-reader-d4c8b",
  storageBucket:     "scroll-reader-d4c8b.firebasestorage.app",
  messagingSenderId: "99009142164",
  appId:             "1:99009142164:web:c73eccb5623b25708c8381",
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
