// ====================================================================
// GRISELLA MAKEUP - PWA SERVICE WORKER (AUTO-UPDATE SUPPORT)
// ====================================================================
const CACHE_NAME = 'grisella-makeup-v2';

self.addEventListener('install', () => {
  // Lewati antrian tunggu agar versi baru langsung aktif saat dideploy ke Vercel
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Bersihkan cache versi lama
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Jangan cache API routes, service worker, manifest, atau navigasi halaman
  if (
    url.pathname.startsWith('/api') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/manifest.json' ||
    event.request.mode === 'navigate'
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Aset statis: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && event.request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
