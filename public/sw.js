const CACHE_NAME = 'forty-life-shell-v1'
const APP_SHELL = [
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME)
  const response = await fetch('/', { cache: 'reload' })
  if (!response.ok) throw new Error('Unable to cache the app shell')

  const html = await response.clone().text()
  const assets = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g), match => match[1])

  await cache.put('/', response)
  await cache.addAll([...APP_SHELL, ...new Set(assets)])
}

self.addEventListener('install', event => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            void caches.open(CACHE_NAME).then(cache => cache.put('/', response.clone()))
          }
          return response
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match('/')) ?? Response.error())
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok) {
          void caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()))
        }
        return response
      })
    })
  )
})
