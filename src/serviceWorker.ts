/* eslint-disable no-undef */
// @ts-ignore
import { precacheAndRoute } from 'workbox-precaching';
// @ts-ignore  
import { registerRoute } from 'workbox-routing';
// @ts-ignore
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
// @ts-ignore
import { ExpirationPlugin } from 'workbox-expiration';

// Precache static assets
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache page navigations (HTML)
registerRoute(
  ({ request }: any) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// Cache CSS, JavaScript, and Web Worker requests
registerRoute(
  ({ request }: any) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Cache images
registerRoute(
  ({ request }: any) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Handle API calls with network first strategy
registerRoute(
  ({ request }: any) => request.url.includes('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60,
      }),
    ],
  })
);

// Skip waiting on activation
// @ts-ignore
self.addEventListener('activate', (event: any) => {
  // @ts-ignore
  event.waitUntil(self.clients.claim());
});
