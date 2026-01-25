// Service Worker for Aerium PWA
// Version 1.0.0

const CACHE_VERSION = 'aerium-v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/static/css/style.css',
  '/static/css/theme-init.css',
  '/static/js/theme-init.js',
  '/static/js/enhanced-ui.js',
  '/static/js/utils.js',
  '/static/images/logoWhite.png',
  '/static/images/icon-192.png',
  '/static/images/icon-512.png',
  '/manifest.json'
];

// API routes that should be cached
const API_ROUTES = [
  '/api/data/today',
  '/api/status'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('[SW] Failed to cache some assets:', err);
          // Continue even if some assets fail
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('aerium-') || name.startsWith('static-') || name.startsWith('dynamic-') || name.startsWith('api-'))
            .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip WebSocket requests
  if (request.url.includes('socket.io')) {
    return;
  }

  // API requests - Network First strategy with cache fallback
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets - Cache First strategy
  if (request.url.includes('/static/')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // HTML pages - Network First strategy
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Everything else - Cache First with network fallback
  event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
});

// Cache First Strategy - Check cache first, fall back to network
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Update cache in background
      updateCache(request, cacheName);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    await cacheResponse(request, networkResponse.clone(), cacheName);
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Cache first failed:', error);
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

// Network First Strategy - Try network first, fall back to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    await cacheResponse(request, networkResponse.clone(), cacheName);
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/html' })
      });
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Helper: Cache a response
async function cacheResponse(request, response, cacheName) {
  // Only cache successful responses
  if (!response || response.status !== 200 || response.type === 'error') {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

// Helper: Update cache in background
function updateCache(request, cacheName) {
  fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        caches.open(cacheName).then(cache => {
          cache.put(request, response);
        });
      }
    })
    .catch(err => console.warn('[SW] Background update failed:', err));
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-readings') {
    event.waitUntil(syncReadings());
  }
});

async function syncReadings() {
  try {
    // Get offline readings from IndexedDB or cache
    // Send them to the server when back online
    console.log('[SW] Syncing offline readings...');
    // Implementation would go here
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Push notifications support
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Aerium Alert';
  const options = {
    body: data.body || 'New notification from Aerium',
    icon: '/static/images/icon-192.png',
    badge: '/static/images/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

console.log('[SW] Service Worker loaded');
