// Powerhouse Service Worker
const CACHE_NAME = 'powerhouse-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon.svg',
  '/apple-touch-icon.png',
  '/favicon-96x96.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Clearing old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-first for manifests, icons, and API calls to guarantee fresh branding
  if (url.pathname.startsWith('/api/') || url.pathname.includes('manifest') || url.pathname.includes('apple-touch-icon')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (url.pathname.startsWith('/api/')) {
            return new Response(JSON.stringify({ error: 'Offline mode active' }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            });
          }
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for page navigations & static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
