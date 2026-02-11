// @ts-nocheck
/// <reference lib="webworker" />
export {}

// PWA Service Worker
// Cache-first strategy for assets, network-first for API calls

const CACHE_NAME = 'life-os-v1'

const sw = self as unknown as ServiceWorkerGlobalScope

sw.addEventListener('install', (event) => {
  event.waitUntil(sw.skipWaiting())
})

sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.clients.claim())
})

sw.addEventListener('fetch', (event) => {
  const fetchEvent = event as FetchEvent

  if (fetchEvent.request.method !== 'GET') {
    return
  }

  fetchEvent.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(fetchEvent.request).then((response) => {
        return (
          response ||
          fetch(fetchEvent.request).then((response) => {
            cache.put(fetchEvent.request, response.clone())
            return response
          })
        )
      })
    })
  )
})
