const APP_CACHE_VERSION = "2026-05-10-2";
const CACHE_NAME = `topik-words-cache-${APP_CACHE_VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./data/sample_topik_vocab.json",
  "./assets/icon-192.svg",
  "./assets/icon-512.svg"
];

const NETWORK_FIRST_PATHS = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/manifest.webmanifest",
  "/data/sample_topik_vocab.json",
  "/service-worker.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  const pathname = url.pathname;
  const isNetworkFirst = NETWORK_FIRST_PATHS.some((path) => pathname.endsWith(path));

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      });
    })
  );
});
