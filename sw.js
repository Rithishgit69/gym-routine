/* Service worker: offline app shell + offline copy of exercise photos and animations. */
const VERSION = 'v1.2.0';
const SHELL_CACHE = `shell-${VERSION}`;
const MEDIA_CACHE = 'media-v1';
const SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/exercises.js',
  './js/program.js',
  './js/db.js',
  './js/cloud.js',
  './js/zip.js',
  './js/edit.js',
  './js/app.js',
  './fonts/Inter-variable.woff2',
  './fonts/BarlowCondensed-600.woff2',
  './fonts/BarlowCondensed-700.woff2',
  './fonts/BarlowCondensed-800.woff2',
  './fonts/BarlowCondensed-800italic.woff2',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Exercise animations: network first (fresh from GitHub when online), offline copy otherwise.
  const isMedia = url.hostname === 'raw.githubusercontent.com' &&
    (url.pathname.startsWith('/hasaneyldrm/exercises-dataset/') || url.pathname.startsWith('/yuhonas/free-exercise-db/'));
  if (isMedia) {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA_CACHE);
      try {
        const res = await Promise.race([fetch(req), timeout(6000)]);
        if (res && res.ok && res.type !== 'opaque') cache.put(req.url, res.clone());
        return res;
      } catch (_) {
        const hit = await cache.match(req.url, { ignoreVary: true });
        return hit || Response.error();
      }
    })());
    return;
  }

  // App shell: cache first, refresh in the background.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const hit = await cache.match(req, { ignoreSearch: true }) ||
        (req.mode === 'navigate' ? await cache.match('./index.html') : null);
      const net = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { event.waitUntil(net); return hit; }
      return (await net) || Response.error();
    })());
  }
});
