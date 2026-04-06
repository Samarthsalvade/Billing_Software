// const CACHE_NAME = 'billing-app-v1';
// const urlsToCache = [
//   '/',
//   '/index.html',
//   '/static/css/main.css',
//   '/static/js/main.js'
// ];

// // Install service worker
// self.addEventListener('install', (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then((cache) => {
//         console.log('Opened cache');
//         return cache.addAll(urlsToCache);
//       })
//   );
// });

// // Fetch from cache
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request)
//       .then((response) => {
//         if (response) {
//           return response;
//         }
//         return fetch(event.request);
//       }
//     )
//   );
// });

// // Activate and clean old caches
// self.addEventListener('activate', (event) => {
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cacheName) => {
//           if (cacheName !== CACHE_NAME) {
//             return caches.delete(cacheName);
//           }
//         })
//       );
//     })
//   );
// });
const CACHE_NAME = 'billing-app-v2';

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const files = await fetch('/asset-manifest.json')
        .then(res => res.json())
        .then(data => Object.values(data.files));

      return cache.addAll(files);
    })
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
});