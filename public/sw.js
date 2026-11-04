// Service Worker for RatDoku PWA (Sudoku by MrRat.com)
//
// Offline-first: once RatDoku has been opened one time, it never needs the internet again.
// Everything is served from the cache straight away, so the game starts instantly even on a
// slow, filtered or missing connection. When a connection happens to be available, a new
// version downloads quietly in the background and is used from the next launch.

// Filled in at build time (see vite.config.ts): every file of this build, and a cache name
// that changes with each build so old files are cleaned up.
const BUILD = /*__RATDOKU_BUILD__*/ { cache: 'ratdoku-dev', files: [] };

// Resolve app paths against the service worker's own folder, so the app works
// both at the site root (Docker) and under a sub-path (GitHub Pages /RatDoku/).
const BASE = new URL('./', self.location).href;
const at = (path) => new URL(path, BASE).href;
const INDEX = at('index.html');

const SHELL = [
  '',
  'index.html',
  'manifest.webmanifest',
  'manifest.json',
  'favicon.svg',
  'apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

// Install: download the whole game (page, code, styles, fonts, puzzle generator, icons).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(BUILD.cache).then(async (cache) => {
      const urls = [...new Set([...SHELL, ...BUILD.files])].map(at);
      await Promise.all(
        urls.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response.ok) await cache.put(url, response);
          } catch {
            // A missing optional file must not stop the install.
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: remove caches from older builds and take control right away.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== BUILD.cache).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function fromNetworkAndStore(request, cacheKey) {
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(BUILD.cache);
    await cache.put(cacheKey || request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Pages: always the cached game, never waiting on the network.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(INDEX).then(
        (cached) =>
          cached ||
          fromNetworkAndStore(request, INDEX).catch(
            () =>
              new Response('RatDoku needs to be opened once with an internet connection.', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
              })
          )
      )
    );
    return;
  }

  // Everything else: cache first; fetch (and keep) only what isn't cached yet.
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(
      (cached) =>
        cached ||
        fromNetworkAndStore(request).catch(() => {
          if (request.destination === 'image') return caches.match(at('favicon.svg'));
          return new Response('', { status: 503 });
        })
    )
  );
});
