// ====================================================================
// GRISELLA MAKEUP - PWA SERVICE WORKER (AUTO-UPDATE & INSTANT RELOAD)
// ====================================================================
const CACHE_NAME = 'grisella-makeup-v8';

self.addEventListener('install', () => {
  // Langsung lewati masa tunggu agar versi baru dari Vercel langsung aktif
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Hapus cache versi lama agar browser tidak memuat bundle JavaScript jadul
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
  // 1. HANYA tangani GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 2. Jangan sentuh request cross-origin (Supabase API, Midtrans, CDNs, fonts, dll)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. SEMUA request API, Next.js chunk/internals, SW, manifest, navigasi dokumen,
  // dan Next.js RSC router transition (_rsc / header RSC) WAJIB langsung diteruskan ke browser network!
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/manifest.json' ||
    event.request.mode === 'navigate' ||
    url.searchParams.has('_rsc') ||
    event.request.headers.get('RSC')
  ) {
    return;
  }

  // 4. Hanya tangani aset statis berekstensi (gambar, icon, font, media)
  const isStaticAsset = url.pathname.match(
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i
  );
  if (!isStaticAsset) {
    return;
  }

  // 5. Network-First dengan cache fallback aman (tidak pernah melempar Failed to fetch)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Kembalikan status 408 daripada undefined agar browser native tidak melempar TypeError: Failed to fetch
        return new Response('', { status: 408, statusText: 'Request Timed Out' });
      })
  );
});
