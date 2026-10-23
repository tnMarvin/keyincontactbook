/**
 * 功能描述：電子聯絡簿離線 Service Worker (PWA 快取機制 + 支援 JSZip 與 PptxGenJS 本地秒開)
 * 代碼產生日期與時間：2026-10-23 17:35
 */

const CACHE_NAME = 'contact-book-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// 1. 安裝階段：將所有靜態 UI 與核心解析函式庫寫入快取
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. 啟用階段：清除舊版本的快取，確保資源更新
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

// 3. 攔截請求：GAS 請求走網路，靜態資源走快取優先，防斷網白畫面
self.addEventListener('fetch', (e) => {
  // Google Apps Script 雲端同步請求，一律直接連網
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 其餘前端靜態檔案（HTML / PptxGenJS / JSZip）優先由本機快取提供
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
