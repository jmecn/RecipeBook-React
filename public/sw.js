'use strict';

var CACHE_NAME = 'recipe-book-react-cache-v1';
var RECIPE_FILE_PATTERN = /\/bundles\/[^/]+\/recipes\//;

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      (async function () {
        var names = await caches.keys();
        return Promise.all(
          names
            .filter(function (n) {
              return (
                (n.startsWith('tfg-recipe-cache-') || n.startsWith('recipe-book-react-cache-')) &&
                n !== CACHE_NAME
              );
            })
            .map(function (n) { return caches.delete(n); })
        );
      })(),
    ])
  );
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  if (RECIPE_FILE_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
  }
});

async function cacheFirst(request) {
  var cached = await caches.match(request);
  if (cached) return cached;

  var response = await fetch(request);
  if (response.ok) {
    var cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
