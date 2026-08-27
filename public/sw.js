const CACHE = 'proof-motion-canvas-v1'
const SHELL = ['/assets/editorial-plate.webp', '/favicon.svg', '/legal.css', '/privacy/', '/terms/']

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    const home = await fetch('/')
    const markup = await home.clone().text()
    await cache.put('/', home)
    const builtAssets = [...markup.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map((match) => match[1])
    await cache.addAll([...new Set([...SHELL, ...builtAssets])])
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone()
      caches.open(CACHE).then((cache) => cache.put(event.request, copy))
      return response
    }).catch(() => caches.match(event.request, { ignoreVary: true }).then((cached) => cached || caches.match('/', { ignoreVary: true }))))
    return
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone()
      caches.open(CACHE).then((cache) => cache.put(event.request, copy))
    }
    return response
  })))
})
