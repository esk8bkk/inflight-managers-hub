/* ============================================================
   Inflight Manager's Hub — Service Worker
   Strategy: cache-first for all app assets (full offline).
   Bump CACHE_VERSION to force an update of all cached files.
   ============================================================ */

const CACHE_VERSION = 'imh-v1.0.3';
const CACHE_NAME = `imh-cache-${CACHE_VERSION}`;

// Core shell — precached on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './shared/theme.css',
  './shared/flight-context.js',
  './shared/ui.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './plugins/announcement/index.html',
  './plugins/briefing/index.html',
  './plugins/crew-tools/index.html',
];

// Google Fonts — cached at runtime (first online load → offline forever)
const RUNTIME_CACHE_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Precache failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isRuntimeHost = RUNTIME_CACHE_HOSTS.includes(url.hostname);

  if (!isSameOrigin && !isRuntimeHost) return; // let the browser handle it

  // Cache-first with background refresh
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => cached); // offline: fall back to cache
      return cached || fetchPromise;
    })
  );
});

// Allow page to trigger an update check
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
