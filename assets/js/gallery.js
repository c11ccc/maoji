/**
 * 毛迹 - 本地相册库
 * 图片本体存在 IndexedDB，避免撑爆 localStorage；这里只负责存取和压缩。
 */
(function (global) {
  'use strict';

  var DB_NAME = 'maoji-media';
  var STORE_NAME = 'images';
  var MAX_EDGE = 1280;
  var QUALITY = 0.82;

  var dbPromise = null;
  var urlCache = {}; // id -> objectURL，避免重复读库

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!global.indexedDB) {
        reject(new Error('当前浏览器不支持本地相册'));
        return;
      }
      var req;
      try {
        req = global.indexedDB.open(DB_NAME, 1);
      } catch (e) {
        reject(e);
        return;
      }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('相册库打开失败')); };
    });
    return dbPromise;
  }

  function withStore(mode, fn) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx;
        try {
          tx = db.transaction(STORE_NAME, mode);
        } catch (e) {
          reject(e);
          return;
        }
        var store = tx.objectStore(STORE_NAME);
        var result;
        try {
          result = fn(store);
        } catch (e) {
          reject(e);
          return;
        }
        tx.oncomplete = function () { resolve(result); };
        tx.onerror = function () { reject(tx.error || new Error('相册写入失败')); };
        tx.onabort = function () { reject(tx.error || new Error('相册写入中断')); };
      });
    });
  }

  function addImage(blob) {
    var id = 'img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return withStore('readwrite', function (store) {
      store.put(blob, id);
    }).then(function () { return id; });
  }

  function getImage(id) {
    return withStore('readonly', function (store) {
      var req = store.get(id);
      var box = { blob: null };
      req.onsuccess = function () { box.blob = req.result || null; };
      return box;
    }).then(function (box) { return box.blob; });
  }

  function deleteImage(id) {
    if (urlCache[id]) {
      URL.revokeObjectURL(urlCache[id]);
      delete urlCache[id];
    }
    return withStore('readwrite', function (store) {
      store.delete(id);
    });
  }

  function deleteImages(ids) {
    if (!Array.isArray(ids) || !ids.length) return Promise.resolve();
    return withStore('readwrite', function (store) {
      ids.forEach(function (id) {
        if (urlCache[id]) {
          URL.revokeObjectURL(urlCache[id]);
          delete urlCache[id];
        }
        store.delete(id);
      });
    });
  }

  function getUrl(id) {
    if (!id) return Promise.resolve('');
    if (urlCache[id]) return Promise.resolve(urlCache[id]);
    return getImage(id).then(function (blob) {
      if (!blob) return '';
      var url = URL.createObjectURL(blob);
      urlCache[id] = url;
      return url;
    });
  }

  function clearAll() {
    Object.keys(urlCache).forEach(function (id) {
      URL.revokeObjectURL(urlCache[id]);
      delete urlCache[id];
    });
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error || new Error('相册清空失败')); };
      });
    });
  }

  /* ---------- 上传前压缩 ---------- */
  function compress(file, maxEdge) {
    var edge = maxEdge || MAX_EDGE;
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        reject(new Error('请选择图片文件'));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('图片读取失败')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('图片解析失败')); };
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          var scale = Math.min(1, edge / Math.max(w, h));
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          if (canvas.toBlob) {
            canvas.toBlob(function (blob) {
              blob ? resolve(blob) : reject(new Error('图片压缩失败'));
            }, 'image/jpeg', QUALITY);
          } else {
            reject(new Error('当前浏览器不支持图片压缩'));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  global.Gallery = {
    addImage: addImage,
    getImage: getImage,
    getUrl: getUrl,
    deleteImage: deleteImage,
    deleteImages: deleteImages,
    clearAll: clearAll,
    compress: compress
  };
})(window);
