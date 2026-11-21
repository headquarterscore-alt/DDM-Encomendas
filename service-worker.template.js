const cacheName = "__DDM_CACHE__";
const assets = "__DDM_ASSETS__";
const root = self.registration.scope;
const assetUrls = new Set(assets.map(name => new URL(name, root).href));
const entryPaths = new Set([new URL(root).pathname, new URL("index.html", root).pathname]);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    // Fetch the canonical page directly. A cached redirect can fail on navigation.
    const requests = [root, ...assetUrls].map(url => new Request(url, {cache: "reload", redirect: "error"}));
    await cache.addAll(requests);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("ddm-postos-") && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function serve(request, cacheUrl) {
  const cached = await caches.match(cacheUrl, {cacheName}).catch(() => undefined);
  if (cached && !cached.redirected) return cached;
  return fetch(request);
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate" && entryPaths.has(url.pathname)) {
    event.respondWith(serve(request, root));
  } else if (assetUrls.has(url.href)) {
    event.respondWith(serve(request, url.href));
  }
});
