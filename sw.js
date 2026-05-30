const CACHE_NAME = 'sirius-v1';
const STATIC_ASSETS = [
  '/',
  '/products',
  '/about',
  '/contact',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API calls
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) return;
  if (url.hostname.includes('cloudinary') || url.hostname.includes('pexels')) return;

  // Network-first for navigation, cache-first for assets
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => 
        caches.match('/').then(res => res || new Response('Offline', { status: 503, statusText: 'Service Unavailable' }))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && (url.pathname.startsWith('/assets') || url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch((err) => {
        console.error('Service Worker fetch failed for:', request.url, err);
        return new Response('Network error occurred', { status: 504, statusText: 'Gateway Timeout' });
      });
    })
  );
});
