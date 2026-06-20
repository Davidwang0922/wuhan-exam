
// 武汉外初机考训练 - Service Worker v3
var CACHE_NAME = 'wuhan-exam-v3';
var STATIC_CACHE = 'wuhan-exam-static-v3';
var IMAGE_CACHE = 'wuhan-exam-images-v3';

// 核心文件：离线必须
var staticFiles = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装：预缓存核心文件
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(staticFiles);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== STATIC_CACHE && key !== IMAGE_CACHE;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：智能缓存策略
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // 图片：缓存优先（先看缓存，没有再网络请求并缓存）
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.pathname.includes('exam_images')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          return cached || fetch(event.request).then(function(response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // 其他：网络优先，失败时回退缓存
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match('./');
      });
    })
  );
});
