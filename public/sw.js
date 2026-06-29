const CACHE_NAME = 'meu-cliente-v5';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/brand/app-icon.png',
  '/brand/app-logo.png',
  '/brand/app-logo-mark.png',
  '/brand/app-logo-wide.png',
  '/brand/app-logo-card.png',
  '/brand/app-logo-hero.png',
  '/brand/app-logo-alt.png',
];

const firebaseConfig = (() => {
  try {
    const search = new URL(self.location.href).searchParams;
    const rawConfig = search.get('firebaseConfig');

    return rawConfig ? JSON.parse(decodeURIComponent(rawConfig)) : null;
  } catch {
    return null;
  }
})();

let firebaseMessagingInitialized = false;

function initializeFirebaseMessaging() {
  if (firebaseMessagingInitialized || !firebaseConfig) {
    return;
  }

  try {
    importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

    if (!self.firebase.apps.length) {
      self.firebase.initializeApp(firebaseConfig);
    }

    const messaging = self.firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Meu Cliente';
      const body = payload.notification?.body || payload.data?.body || 'Nova notificação disponível.';
      const url = payload.data?.url || '/';

      self.registration.showNotification(title, {
        body,
        icon: '/brand/app-icon.png',
        badge: '/brand/app-icon.png',
        data: { url },
      });
    });

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const targetUrl = event.notification.data?.url || '/';

      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
          for (const client of windowClients) {
            if ('focus' in client && client.url.includes(targetUrl)) {
              return client.focus();
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }

          return undefined;
        }),
      );
    });

    firebaseMessagingInitialized = true;
  } catch {
    // Se o Firebase Messaging não estiver disponível, o cache do PWA continua funcionando.
  }
}

initializeFirebaseMessaging();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(keys.map((key) => (key === CACHE_NAME ? Promise.resolve() : caches.delete(key))));
    }),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (
    requestUrl.pathname.startsWith('/@vite/') ||
    requestUrl.pathname.startsWith('/@react-refresh') ||
    requestUrl.pathname.startsWith('/src/') ||
    requestUrl.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return cache.match('/index.html');
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      });
    }),
  );
});
