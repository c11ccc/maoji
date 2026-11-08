/**
 * 毛迹 - Service Worker（PWA 离线缓存）
 * 策略：自身静态资源缓存优先；Supabase 等接口请求直接走网络，不缓存。
 * 改版时把 CACHE_VERSION 里的 v 号 +1，旧缓存会自动清掉。
 */
(function () {
  'use strict';

  var CACHE_VERSION = 'maoji-v11';
  var CORE = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/style.css',
    './assets/js/store.js',
    './assets/js/gallery.js',
    './assets/js/sync.js',
    './assets/js/app.js',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png'
  ];

  self.addEventListener('install', function (e) {
    e.waitUntil(
      caches.open(CACHE_VERSION).then(function (cache) {
        return cache.addAll(CORE);
      }).then(function () { return self.skipWaiting(); })
    );
  });

  self.addEventListener('activate', function (e) {
    e.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k.indexOf('maoji-') === 0 && k !== CACHE_VERSION) return caches.delete(k);
        }));
      }).then(function () { return self.clients.claim(); })
    );
  });

  self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET') return;

    var url = new URL(req.url);
    // 外部接口（Supabase 等）不缓存，直接走网络
    if (url.origin !== self.location.origin) {
      // CDN 上的 supabase-js 允许缓存（带版本号，内容不变）
      if (url.hostname === 'cdn.jsdelivr.net') {
        e.respondWith(cacheFirst(req));
      }
      return;
    }

    // 页面导航请求：网络优先，失败回退缓存首页（保证离线能开）
    if (req.mode === 'navigate') {
      e.respondWith(
        fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put('./index.html', copy); });
          return res;
        }).catch(function () {
          return caches.match('./index.html');
        })
      );
      return;
    }

    // 其余同源静态资源：缓存优先，顺带更新缓存
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      })
    );
  });

  function cacheFirst(req) {
    return caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    });
  }
})();
