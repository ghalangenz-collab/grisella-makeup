// ====================================================================
// GRISELLA MAKEUP - PWA SERVICE WORKER (AUTO-UPDATE & INSTANT RELOAD)
// ====================================================================
const CACHE_NAME = 'grisella-makeup-v8';

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
  // HANYA tangani GET requests untuk aset statis.
  // SEMUA request non-GET (POST, PUT, DELETE, dll) serta API, Next.js chunk, SW, dan manifest
  // WAJIB langsung diteruskan ke native browser network tanpa di-intercept!
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/manifest.json' ||
    event.request.mode === 'navigate'
  ) {
    // Biarkan browser langsung memproses tanpa event.respondWith
    return;
  }

  // Aset statis gambar/font: Network-First dengan fallback cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
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
