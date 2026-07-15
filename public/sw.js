/* Ebola IPC Dashboard service worker.
 * Strategy for a fully static, privacy-first app:
 *  - Precache the app shell (start page) on install.
 *  - Navigations: network-first, fall back to the cached shell when offline.
 *  - Same-origin static assets (/_next/*, icons, css): stale-while-revalidate,
 *    so everything the app loaded once is available offline afterwards.
 *  - Cross-origin requests (e.g. OpenStreetMap map tiles) are left untouched
 *    and simply fail offline — an accepted degradation for the map only.
 * No uploaded data is ever cached: the app keeps data in memory, never fetches
 * it over the network, so nothing sensitive can land in the cache.
 */
const VERSION = 'v1';
const CACHE = `ipc-dashboard-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        // registration.scope is the app's start URL (basePath-aware).
        await cache.add(new Request(self.registration.scope, { cache: 'reload' }));
      } catch {
        /* offline install — runtime caching will fill in on first online load */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Ignore cross-origin (map tiles, etc.) — let the network handle them.
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const fresh = await fetch(req);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return (
            (await cache.match(req)) ||
            (await cache.match(self.registration.scope)) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
