const CACHE = 'neo-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/whale.png',
  '/manifest.json',
];

// Install: cache alle Core-Assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: alte Caches loeschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: API-Calls immer frisch, Rest aus Cache mit Network-Fallback
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // API-Calls nie cachen
  if (url.includes('/api/')) return;

  // Uploads direkt vom Server
  if (url.includes('/uploads/')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Gueltige Responses cachen
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline-Fallback: index.html fuer SPA
        if (e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
