/**
 * 功能描述：電子聯絡簿離線 Service Worker (PWA 快取機制)
 * 代碼產生日期與時間：2026-07-24 14:03
 */

const CACHE_NAME = 'contact-book-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html'
];

// 1. 安裝並將靜態介面寫入快取
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. 清理舊版快取
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 攔截網路請求：斷網時優先以快取載入 UI
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate' || e.request.url.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match('./index.html') || caches.match('./');
        })
    );
  }
});
