const CACHE_NAME = 'guroh-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/guroh_app_icon.png',
  '/guroh_logo_mark.svg',
  '/guroh_icon_square.png',
  '/favicon.svg',
  '/offline.html'
];

// Exponential backoff configuration for connection flapping
const SYNC_RETRY_CONFIG = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  pingUrl: '/favicon.svg'
};

// Install Event - Pre-cache shell assets & offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate for assets, Network-first with offline fallback for navigation
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin or non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Navigation requests: Network-First with Offline Route Handler & Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.warn('[SW] Navigation failed. Checking cache or routing to offline fallback:', event.request.url);
          const cachedPage = await caches.match(event.request);
          if (cachedPage) {
            return cachedPage;
          }
          const offlineFallback = await caches.match('/offline.html');
          if (offlineFallback) {
            return offlineFallback;
          }
          return new Response(
            '<h1>Offline</h1><p>Guroh is offline and no fallback is cached.</p>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Static assets & APIs: Cache-first with network fallback and background refresh
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Return cached or pass error through
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Helper: Check actual network connectivity using lightweight ping probe
async function verifyNetworkConnectivity() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const probe = await fetch(`${SYNC_RETRY_CONFIG.pingUrl}?_t=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return probe.ok;
  } catch {
    return false;
  }
}

// Background Sync Event for offline lesson progress queuing with exponential backoff & flapping guard
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-lesson-progress') {
    event.waitUntil(handleSyncWithBackoff());
  }
});

async function handleSyncWithBackoff() {
  console.log('[SW] sync-lesson-progress invoked. Initializing network resilience probe...');

  let attempt = 0;
  let delay = SYNC_RETRY_CONFIG.baseDelayMs;

  while (attempt < SYNC_RETRY_CONFIG.maxRetries) {
    attempt++;
    const isConnected = await verifyNetworkConnectivity();

    if (isConnected) {
      console.log(`[SW] Network connection verified on attempt ${attempt}. Broadcasting sync signal.`);
      const allClients = await self.clients.matchAll();
      for (const client of allClients) {
        client.postMessage({
          type: 'SYNC_OFFLINE_PROGRESS_TRIGGERED',
          timestamp: Date.now(),
          attempt
        });
      }
      return;
    }

    console.warn(`[SW] Connection flapping/offline detected on attempt ${attempt}. Retrying in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, SYNC_RETRY_CONFIG.maxDelayMs);
  }

  console.error('[SW] Max sync retries exceeded during connection flapping. Sync rescheduled.');
  throw new Error('Connection flapping: Failed to establish stable network for background sync.');
}

// Listen for messages from client windows
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CHECK_SYNC_STATUS') {
    event.ports[0]?.postMessage({ active: true, cache: CACHE_NAME });
  }
});
