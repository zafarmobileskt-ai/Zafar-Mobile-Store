/**
 * ZAFAR MOBILE STORE - High-Performance Offline PWA Service Worker
 * Capabilities:
 * - Application Shell precaching (HTML, manifest, offline fallback, icons)
 * - Navigation preload & Network-first with cache and offline.html fallback
 * - Stale-while-revalidate caching for stylesheets, scripts, and fonts
 * - Cache-first for images and brand iconography with fallback
 * - Auto cache cleanup on version activation
 * - Live bypass for SSE, WebSocket, HMR, Firebase, and real-time sync endpoints
 */

const CACHE_VERSION = 'v5.3';
const STATIC_CACHE = `zafar-pos-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `zafar-pos-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `zafar-pos-images-${CACHE_VERSION}`;

const OFFLINE_FALLBACK_URL = '/offline.html';

// Application shell and core static assets to precache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-1024.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png'
];

// Helper: Determine if URL is a live or internal development request that should bypass SW caching
function shouldBypassRequest(url) {
  return (
    // Live Server-Sent Events and Sync APIs
    url.pathname.startsWith('/api/sync') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/ws/') ||
    // Raw source code files in development MUST NEVER be cached by SW
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('/src/') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.jsx') ||
    // Firebase and Google Auth APIs
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    // Vite Dev Server / HMR Internal endpoints
    url.pathname.includes('/@') ||
    url.pathname.includes('/.vite/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('hot-update') ||
    url.search.includes('v=') ||
    url.search.includes('t=')
  );
}

// 1. INSTALL LIFECYCLE: Pre-cache App Shell & Assets safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Use individual caching to avoid total failure if any single optional asset is missing
      const cachePromises = PRECACHE_ASSETS.map(async (assetUrl) => {
        try {
          const response = await fetch(assetUrl, { cache: 'no-cache' });
          if (response && response.ok) {
            await cache.put(assetUrl, response);
          }
        } catch (err) {
          console.warn(`[SW] Pre-caching notice for ${assetUrl}:`, err);
        }
      });
      await Promise.all(cachePromises);
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE LIFECYCLE: Purge obsolete caches and immediately claim clients
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName.startsWith('zafar-pos-') &&
            !currentCaches.includes(cacheName)
          ) {
            console.log('[SW] Purging outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH LIFECYCLE: Intelligent routing and offline caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle URL parsing safely
  let requestUrl;
  try {
    requestUrl = new URL(request.url);
  } catch {
    return;
  }

  // Ignore non-http/https schemes (e.g. chrome-extension, data, blob)
  if (!requestUrl.protocol.startsWith('http')) {
    return;
  }

  // Bypass live API, Firebase, and development HMR requests
  if (shouldBypassRequest(requestUrl)) {
    return;
  }

  // STRATEGY A: Navigation Requests (HTML Pages / App Shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Attempt network fetch with a 3.5-second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const networkResponse = await fetch(request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
            cache.put('/', networkResponse.clone());
            cache.put('/index.html', networkResponse.clone());
            return networkResponse;
          }
        } catch {
          // Network failed or timed out; proceed to offline cache lookup
        }

        // Check cache for the requested URL or root app shell
        const cache = await caches.open(STATIC_CACHE);
        const cachedPage = (await cache.match(request)) || (await cache.match('/')) || (await cache.match('/index.html'));
        if (cachedPage) {
          return cachedPage;
        }

        // Offline fallback page
        const offlinePage = await cache.match(OFFLINE_FALLBACK_URL);
        return offlinePage || new Response('You are offline. Please reconnect.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })()
    );
    return;
  }

  // STRATEGY B: Images & Icons (Cache-First with fallback)
  if (
    request.destination === 'image' ||
    requestUrl.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/i)
  ) {
    event.respondWith(
      (async () => {
        const imageCache = await caches.open(IMAGE_CACHE);
        const staticCache = await caches.open(STATIC_CACHE);

        // Check image cache or static cache
        const cachedImage = (await imageCache.match(request)) || (await staticCache.match(request));
        if (cachedImage) {
          return cachedImage;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            imageCache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch {
          // Offline fallback icon
          const fallbackIcon = await staticCache.match('/icon-192.png');
          if (fallbackIcon) return fallbackIcon;
        }

        return cachedImage || new Response('', { status: 404 });
      })()
    );
    return;
  }

  // STRATEGY C: Fonts (Google Fonts / Webfonts - Stale-While-Revalidate)
  if (
    request.destination === 'font' ||
    requestUrl.hostname.includes('fonts.gstatic.com') ||
    requestUrl.hostname.includes('fonts.googleapis.com')
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cachedFont = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedFont);

        return cachedFont || fetchPromise;
      })()
    );
    return;
  }

  // STRATEGY D: General Static Assets (CSS, JS bundles, manifest)
  event.respondWith(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      const runtimeCache = await caches.open(RUNTIME_CACHE);

      const cachedResponse = (await staticCache.match(request)) || (await runtimeCache.match(request));
      if (cachedResponse) {
        // Fetch in background to update cache for next load
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
              runtimeCache.put(request, networkResponse.clone());
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
          runtimeCache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        return cachedResponse || new Response('Resource unavailable offline', { status: 503 });
      }
    })()
  );
});

// 4. MESSAGE EVENT: Support manual update triggers from the UI
self.addEventListener('message', (event) => {
  if (event.data) {
    if (event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  }
});
