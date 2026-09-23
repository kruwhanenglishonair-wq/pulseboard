// Powerhouse Service Worker v6 with Hardened Navigation & Cloud Push Handlers
const CACHE_NAME = 'powerhouse-v6';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon.svg',
  '/apple-touch-icon.png',
  '/favicon-96x96.png',
  '/favicon.ico',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png'
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

// Cache & network routing
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore non-http / non-https schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // Ignore cross-origin requests
  if (url.origin !== self.location.origin) return;

  // 1. Network-first for API routes, manifests, and icons
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('manifest') ||
    url.pathname.includes('apple-touch-icon')
  ) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (url.pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ error: 'Offline mode active' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          });
        }
        return new Response('', { status: 404 });
      })
    );
    return;
  }

  // 2. Network-first for HTML page navigation requests (clicking links, opening pages, notification click)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline or network error, fallback to cached page or cached root '/'
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;

          // Never resolve with undefined! Return fallback HTML so Chrome NEVER crashes with "This page couldn't load"
          return new Response(
            '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Powerhouse</title><style>body{font-family:system-ui,sans-serif;text-align:center;padding:48px 20px;color:#1e293b}a{display:inline-block;margin-top:16px;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:10px;font-weight:600}</style></head><body><h2>Connecting to Powerhouse...</h2><p>Please check your internet connection and reload.</p><a href="/">Return to Home Feed</a></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 3. Stale-while-revalidate for static assets (js, css, images)
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
        .catch(() => cachedResponse || new Response('', { status: 404 }));

      return cachedResponse || fetchPromise;
    })
  );
});

// ==============================================================================
// Web Push & Mobile Notification Listeners
// ==============================================================================

// Handle click on mobile notifications to focus or open the target announcement
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || '/';
  // Ensure the target URL is ALWAYS an absolute URL based on the current origin!
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. If an existing window/tab of Powerhouse is open, navigate and focus it
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // 2. Otherwise open a new standalone window with the full absolute URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle incoming Web Push events from server / cloud
self.addEventListener('push', (event) => {
  let data = { title: '📢 Powerhouse Announcement', body: 'A new company update has been published.', url: '/' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const isUrgent = data.isUrgent || data.title?.includes('🚨');
  const options = {
    body: data.body,
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: isUrgent ? [300, 100, 300, 100, 300] : [200, 100, 200],
    tag: data.tag || `powerhouse-${Date.now()}`,
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle messages from client to show or schedule notifications
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || 'Powerhouse Update', {
      icon: '/web-app-manifest-192x192.png',
      badge: '/favicon-96x96.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }

  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options, delayMs } = event.data;
    if (delayMs && delayMs > 0) {
      setTimeout(() => {
        self.registration.showNotification(title || 'Powerhouse Update', {
          icon: '/web-app-manifest-192x192.png',
          badge: '/favicon-96x96.png',
          vibrate: [200, 100, 200],
          ...options
        });
      }, delayMs);
    }
  }

  // Handle Home Screen App Icon Badge on Mobile (Web Badging API & Android Launcher Bridge)
  if (event.data.type === 'SET_APP_BADGE') {
    const count = event.data.count || 0;
    if ('setAppBadge' in self.navigator) {
      if (count > 0) {
        self.navigator.setAppBadge(count).catch(() => {});
      } else {
        self.navigator.clearAppBadge().catch(() => {});
      }
    }

    // Android Launcher Badging Bridge:
    // Android launchers (Xiaomi MIUI/HyperOS, Samsung OneUI, Pixel) draw the red circle dot on the home screen icon
    // based on active notifications in the Android notification shade.
    try {
      if (count > 0) {
        self.registration.showNotification(`🔴 Powerhouse: ${count} New Notice${count > 1 ? 's' : ''}`, {
          tag: 'powerhouse-unread-badge',
          body: `You have ${count} unread announcement${count > 1 ? 's' : ''}. Tap to open.`,
          icon: '/web-app-manifest-192x192.png',
          badge: '/favicon-96x96.png',
          renotify: false,
          silent: true,
          data: { url: '/' }
        }).catch(() => {});
      } else {
        self.registration.getNotifications({ tag: 'powerhouse-unread-badge' }).then((notifications) => {
          notifications.forEach((n) => n.close());
        }).catch(() => {});
      }
    } catch (err) {}
  }
});
