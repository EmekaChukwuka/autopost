// Name your cache
const CACHE_NAME = "autopost-cache-v1";

// App pages to cache
const APP_SHELL = [
  "/app/dashboard.html",
  "/app/calendar.html",
  "/app/pricing.html",
  "/app/signup.html",
  "/app/signin.html",
  "/app/logout.html",
  "/app/create.html",
  "/app/analytics.html",
  "/app/settings.html",
  "/app/payment.html",
  "/app/payment-verification.html",
  "/app/generate-calendar.html",
  "/app/app.js",
  "/autopost-icon.jpg",
  "/assets/icons/icon-512.png"
];

// Install event (cache files)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Activate event (cleanup old cache)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});

// Fetch event (serve from cache, fallback to network)
self.addEventListener("fetch", (event) => {
  // Only cache items inside /app/
  if (!event.request.url.includes("/app/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => caches.match("/app/dashboard.html"))
      );
    })
  );
});
