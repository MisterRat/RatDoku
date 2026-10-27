// Service Worker for RatDoku PWA (Sudoku by MrRat.com)
const CACHE_NAME = 'ratdoku-v3';

// Resolve app paths against the service worker's own folder, so the app works
// both at the site root (Docker) and under a sub-path (GitHub Pages /RatDoku/).
const BASE = new URL('./', self.location).href;
const at = (path) => new URL(path, BASE).href;

// Essential static assets to pre-cache on install
const PRECACHE_ASSETS = [
  at(''),
  at('index.html'),
  at('manifest.webmanifest'),
  at('manifest.json'),
  at('favicon.svg'),
  at('apple-touch-icon.png'),
  at('icons/icon-192.png'),
  at('icons/icon-512.png'),
  at('icons/icon-maskable-512.png'),
  at('icons/apple-touch-icon.png')
];

// Install Event: Cache app shell assets safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use map with individual catches to prevent a single 404 from aborting installation
      await Promise.all(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch {
            // Ignore missing optional precache items
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear outdated caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First for assets, Network-First with Cache Fallback for navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests and http(s) protocols
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Navigation requests (HTML pages) -> Network first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
              cache.put(at('index.html'), responseToCache.clone());
              cache.put(at(''), responseToCache.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const cachedIndex = await caches.match(at('index.html'));
          if (cachedIndex) return cachedIndex;
          const cachedRoot = await caches.match(at(''));
          if (cachedRoot) return cachedRoot;
          return new Response('Offline - RatDoku is ready to play once loaded.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // 2. Static Assets, Scripts, Styles, Fonts, Images -> Cache-First with Network Background Update
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-while-revalidate in background
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // If not cached, fetch from network and cache
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an image, provide fallback favicon if available
          if (request.destination === 'image') {
            return caches.match(at('favicon.svg'));
          }
          return new Response('Offline asset unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
    })
  );
});

