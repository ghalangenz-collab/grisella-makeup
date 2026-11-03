// ====================================================================
// GRISELLA MAKEUP - PWA SERVICE WORKER (AUTO-UPDATE & INSTANT RELOAD)
// ====================================================================
const CACHE_NAME = 'grisella-makeup-v6';

self.addEventListener('install', () => {
  // Langsung lewati masa tunggu agar versi baru dari Vercel langsung aktif
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Hapus SEMUA cache lama seketika agar browser tidak memuat bundle JavaScript jadul
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
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

  // Jangan pernah simpan cache untuk:
  // - API routes (/api/*)
  // - Next.js dynamic chunks & static scripts (/_next/*)
  // - Service Worker & Manifest
  // - HTML document navigasi
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/manifest.json' ||
    event.request.mode === 'navigate'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Aset statis gambar/font: Network-First dengan fallback cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
