const CACHE = 'ikrox-inv-v6';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Let external APIs through to network
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('api.anthropic.com') ||
      e.request.url.includes('unpkg.com') ||
      e.request.url.includes('cdn.jsdelivr.net') ||
      e.request.url.includes('openfoodfacts.org')) {
    return;
  }
  // Network first for HTML (always get latest), cache first for everything else
  if (e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
  }
});

// Accept skipWaiting messages
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
