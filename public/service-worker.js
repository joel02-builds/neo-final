const CACHE_NAME = 'neo-v5';
const STATIC = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
];

// Nie cachen — immer frisch vom Server
const NEVER_CACHE = [
  '/manifest.json',
  '/whale.png',
  '/api/',
  '/uploads/',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    // Alle alten Caches komplett loeschen
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        console.log('[SW] Loesche alten Cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Nie cachen: API, Uploads, Manifest, Icons
  const neverCache = NEVER_CACHE.some(p => url.pathname.startsWith(p));
  if (neverCache) return; // Netzwerk direkt

  // Alles andere: Cache-first mit Netzwerk-Fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          caches.open(CACHE_NAME).then(c => c.put(e.request, response.clone()));
        }
        return response;
      });
      return cached || networkFetch;
    }).catch(() => caches.match('/index.html'))
  );
});
