const CACHE_NAME = "stellarkraal-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
];

// Install: pre-cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//   - API calls (contains /api/): network-first, fail silently (caller shows offline toast)
//   - Static assets (HTML/CSS/JS/fonts): cache-first, fallback to network then cache root
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET") return;
  if (url.origin !== location.origin && !url.pathname.startsWith("/api/")) return;

  // API: network-only (let app handle offline toast)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        Response.json({ error: "offline", message: "You appear to be offline." }, { status: 503 })
      )
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Only cache successful same-origin responses for HTML/CSS/JS/fonts
        if (
          response.ok &&
          url.origin === location.origin &&
          (request.destination === "document" ||
            request.destination === "script" ||
            request.destination === "style" ||
            request.destination === "font" ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".woff2") ||
            url.pathname.endsWith(".woff") ||
            url.pathname.endsWith(".html"))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() =>
      // Fallback: serve root shell
      caches.match("/").then((shell) => shell ?? new Response("Offline", { status: 503 }))
    )
  );
});
