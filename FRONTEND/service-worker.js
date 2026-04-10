const CACHE_NAME = 'study-planner-v2';
const ASSETS = [
    './',
    './index.html',
    './login.html',
    './styles.css',
    './script.js',
    './login.js',
    './api-client.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                ASSETS.map(url => cache.add(url).catch(err => console.log('Cache failed for', url)))
            );
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    if (e.request.url.includes('/api/')) return;

    // Network-first strategy for rapid development updates
    e.respondWith(
        fetch(e.request).then(response => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(e.request, responseClone);
            });
            return response;
        }).catch(() => {
            return caches.match(e.request);
        })
    );
});
