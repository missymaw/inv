const CACHE = 'ikrox-inv-v1';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network first for Supabase/API, cache first for app shell
  if (e.request.url.includes('supabase.co') || e.request.url.includes('api.anthropic.com')) {
    return; // Let these through to network
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});

// Recibe mensajes para actualizaciones
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
