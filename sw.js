// Star Accommodations — Service Worker
// Provides offline support and installability.
// Strategy:
//  - HTML (navigation): network-first, fall back to cache (so updates load when online)
//  - Everything else (icons, manifest): cache-first
const CACHE_NAME = 'star-hotel-v1';
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icon.svg',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-512.png'
];

self.addEventListener('install', function(event) {
    // Pre-cache core assets. If any single asset fails, install still succeeds.
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return Promise.all(CORE_ASSETS.map(function(url) {
                return cache.add(url).catch(function(err) {
                    console.warn('SW: failed to cache', url, err);
                });
            }));
        }).then(function() { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function(event) {
    // Delete old caches on version bump
    event.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(names.map(function(n) {
                if (n !== CACHE_NAME) return caches.delete(n);
            }));
        }).then(function() { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function(event) {
    var req = event.request;
    if (req.method !== 'GET') return;
    var url = new URL(req.url);
    // Only handle same-origin requests
    if (url.origin !== self.location.origin) return;

    // Navigation requests: network-first, fall back to cached index.html
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).then(function(res) {
                var copy = res.clone();
                caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); });
                return res;
            }).catch(function() {
                return caches.match(req).then(function(m) {
                    return m || caches.match('./index.html');
                });
            })
        );
        return;
    }

    // Everything else: cache-first
    event.respondWith(
        caches.match(req).then(function(cached) {
            if (cached) return cached;
            return fetch(req).then(function(res) {
                if (res && res.status === 200 && res.type === 'basic') {
                    var copy = res.clone();
                    caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); });
                }
                return res;
            }).catch(function() { return cached; });
        })
    );
});

// Optional message channel for "Update now" button in the future
self.addEventListener('message', function(event) {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
