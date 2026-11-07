const CACHE_NAME = 'agriscout-cache-v3'; // v3 para forzar la actualización
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './js/data.js',
    './js/ui.js',
    './js/map.js',
    './js/config.js',
    './js/evaluation.js',
    './js/reports.js',
    './js/main.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting(); // Activa el nuevo SW de inmediato
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});