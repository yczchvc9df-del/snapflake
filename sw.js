// Snapflake Studio offline support. Version 342248004e
const CACHE = 'snapflake-342248004e';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/favicon.svg', 'icons/favicon-32.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('snapflake-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // the app page: try the network first so updates arrive, fall back to the saved copy offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  // fonts: keep a copy so the app looks right offline
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
