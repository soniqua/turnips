// PWA Code adapted from https://github.com/pwa-builder/PWABuilder
const CACHE = "pwa-precache-v1";
const precacheFiles = [
  "/index.html",
  "/js/predictions.js",
  "/js/scripts.js",
  "/css/styles.css",
  "https://code.jquery.com/jquery-3.4.1.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/i18next/19.4.2/i18next.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/i18next-xhr-backend/3.2.2/i18nextXHRBackend.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/i18next-browser-languagedetector/4.0.2/i18nextBrowserLanguageDetector.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jquery-i18next/1.2.1/jquery-i18next.min.js",
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js",
  "https://cdn.jsdelivr.net/npm/canvas-confetti@1.2.0/dist/confetti.browser.min.js"
];

self.addEventListener("install", function (event) {
  console.log("[PWA] Install Event processing");

  console.log("[PWA] Skip waiting on install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[PWA] Caching pages during install");
      return cache.addAll(precacheFiles);
    })
  );
});

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
  console.log("[PWA] Claiming clients for current page");
  event.waitUntil(self.clients.claim());
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      let response;
      try {
        // Fetch from network first.
        response = await fetch(event.request);
        event.waitUntil(updateCache(event.request, response.clone()));
      } catch (error) {
        try {
          // Try if there's locally cached version.
          response = await fromCache(event.request);
        } catch (error) {
          console.log("[PWA] Network request failed and no cache." + error);
          throw error;
        }
      }
      return response;
    })()
  );
});

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
