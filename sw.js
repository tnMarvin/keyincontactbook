/**
 * 功能描述：電子聯絡簿離線 Service Worker (PWA 秒開快取機制 + 支援 PPT 生成套件)
 * 代碼產生日期與時間：2026-10-23 14:35
 */

const CACHE_NAME = 'contact-book-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
];

// 1. 安裝並快取全部離線核心資產
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

// 3. 快取優先策略：靜態資源優先從本地快取秒開，徹底避免校園斷網時的請求阻塞
self.addEventListener('fetch', (e) => {
  // Google Apps Script API 走網路
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 其餘靜態 HTML / JS 一律優先自快取讀取
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 背景異步更新快取 (Stale-while-revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
