/**
 * 毛迹 - 本地数据层
 * 所有数据保存在 localStorage，不上传任何服务器。
 */
(function (global) {
  'use strict';

  var DB_KEY = 'maoji.db.v1';
  var PREFS_KEY = 'maoji.prefs.v1';
  var MAX_PHOTO_EDGE = 1000; // 图片最长边压缩到 1000px，避免撑爆本地存储

  var defaultDB = { pets: [], moments: [], aiLooks: [], posts: [] };

  var BG_KEYS = ['warm', 'mist', 'forest', 'dusk', 'lawn', 'home', 'planet', 'clouds'];
  var defaultPrefs = { bg: 'warm' };

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function load() {
    try {
      var raw = global.localStorage.getItem(DB_KEY);
      if (!raw) return clone(defaultDB);
      var data = JSON.parse(raw);
      return {
        pets: Array.isArray(data.pets) ? data.pets : [],
        moments: Array.isArray(data.moments) ? data.moments : [],
        aiLooks: Array.isArray(data.aiLooks) ? data.aiLooks : [],
        // 回忆流：图片本体存在 IndexedDB，这里只存元数据
        posts: Array.isArray(data.posts) ? data.posts.map(function (p) {
          var ids = Array.isArray(p.petIds) ? p.petIds : (p.petId ? [p.petId] : []);
          return {
            id: p.id,
            text: p.text || '',
            petIds: ids,
            date: p.date || '',
            imageIds: Array.isArray(p.imageIds) ? p.imageIds : [],
            createdAt: p.createdAt || 0
          };
        }) : []
      };
    } catch (e) {
      console.warn('[毛迹] 读取本地数据失败，已使用空白数据', e);
      return clone(defaultDB);
    }
  }

  var db = load();

  function loadPrefs() {
    try {
      var raw = global.localStorage.getItem(PREFS_KEY);
      if (!raw) return clone(defaultPrefs);
      var data = JSON.parse(raw);
      return { bg: BG_KEYS.indexOf(data.bg) >= 0 ? data.bg : 'warm' };
    } catch (e) {
      return clone(defaultPrefs);
    }
  }

  var prefs = loadPrefs();

  /* ---------- 个性化配置（与档案数据分开存放） ---------- */
  function getPrefs() {
    return { bg: prefs.bg };
  }

  function updatePrefs(patch) {
    if (patch && BG_KEYS.indexOf(patch.bg) >= 0) prefs.bg = patch.bg;
    try {
      global.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('[毛迹] 个性化设置保存失败', e);
    }
    return getPrefs();
  }

  function persist() {
    try {
      global.localStorage.setItem(DB_KEY, JSON.stringify(db));
      return true;
    } catch (e) {
      console.error('[毛迹] 保存失败，本地存储可能已满', e);
      throw new Error('本地存储空间不足，请先删除部分照片或导出备份。');
    }
  }

  /* ---------- 宠物 ---------- */
  function listPets() {
    return db.pets.slice().sort(function (a, b) {
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }

  function getPet(id) {
    return db.pets.find(function (p) { return p.id === id; }) || null;
  }

  function addPet(input) {
    var now = Date.now();
    var pet = {
      id: uid('pet'),
      name: input.name || '未命名',
      species: input.species || 'cat',
      breed: input.breed || '',
      birthday: input.birthday || '',
      metOn: input.metOn || '',
      gender: input.gender || 'unknown',
      bio: input.bio || '',
      avatar: input.avatar || '',
      emoji: input.emoji || '🐾',
      accent: input.accent || '#e8774a',
      createdAt: now,
      updatedAt: now
    };
    db.pets.push(pet);
    persist();
    return pet;
  }

  function updatePet(id, patch) {
    var pet = getPet(id);
    if (!pet) return null;
    Object.keys(patch).forEach(function (k) {
      if (k !== 'id' && k !== 'createdAt') pet[k] = patch[k];
    });
    pet.updatedAt = Date.now();
    persist();
    return pet;
  }

  function removePet(id) {
    db.pets = db.pets.filter(function (p) { return p.id !== id; });
    db.moments = db.moments.filter(function (m) { return m.petId !== id; });
    db.aiLooks = db.aiLooks.filter(function (a) { return a.petId !== id; });
    // 动态本身保留，只解除与这只毛孩子的关联
    db.posts.forEach(function (p) {
      p.petIds = (p.petIds || []).filter(function (pid) { return pid !== id; });
    });
    persist();
  }

  /* ---------- 成长时间线 ---------- */
  function listMoments(petId) {
    return db.moments
      .filter(function (m) { return m.petId === petId; })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }

  function listAllMoments() {
    return db.moments.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  function countMoments(petId) {
    return db.moments.filter(function (m) { return m.petId === petId; }).length;
  }

  function addMoment(input) {
    var now = Date.now();
    var moment = {
      id: uid('mom'),
      petId: input.petId,
      date: input.date || new Date().toISOString().slice(0, 10),
      title: input.title || '',
      text: input.text || '',
      mood: input.mood || '',
      photos: input.photos || [],
      createdAt: now
    };
    db.moments.push(moment);
    persist();
    return moment;
  }

  function removeMoment(id) {
    db.moments = db.moments.filter(function (m) { return m.id !== id; });
    persist();
  }

  /* ---------- AI 形象 ---------- */
  function listAiLooks(petId) {
    return db.aiLooks
      .filter(function (a) { return a.petId === petId; })
      .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
  }

  function saveAiLook(input) {
    // 同一个 prompt 已经生成过就直接复用，避免重复消耗
    var exist = db.aiLooks.find(function (a) {
      return a.petId === input.petId && a.prompt === input.prompt;
    });
    if (exist) return exist;

    var look = {
      id: uid('look'),
      petId: input.petId,
      prompt: input.prompt,
      style: input.style,
      url: input.url,
      createdAt: Date.now()
    };
    db.aiLooks.push(look);
    persist();
    return look;
  }

  function removeAiLook(id) {
    db.aiLooks = db.aiLooks.filter(function (a) { return a.id !== id; });
    persist();
  }

  /* ---------- 回忆流（相册动态） ---------- */
  function listPosts() {
    return db.posts.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  function getPost(id) {
    return db.posts.find(function (p) { return p.id === id; }) || null;
  }

  function addPost(input) {
    var petIds = Array.isArray(input.petIds) ? input.petIds.filter(Boolean) : (input.petId ? [input.petId] : []);
    var post = {
      id: uid('post'),
      text: input.text || '',
      petIds: petIds,
      date: input.date || new Date().toISOString().slice(0, 10),
      imageIds: Array.isArray(input.imageIds) ? input.imageIds : [],
      createdAt: Date.now()
    };
    db.posts.push(post);
    persist();
    return post;
  }

  function removePost(id) {
    var post = getPost(id);
    db.posts = db.posts.filter(function (p) { return p.id !== id; });
    persist();
    return post;
  }

  function countPosts() {
    return db.posts.length;
  }

  /* ---------- 备份 ---------- */
  function exportData() {
    return JSON.stringify({
      app: '毛迹',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: db
    }, null, 2);
  }

  function importData(text) {
    var parsed = JSON.parse(text);
    var data = parsed && parsed.data ? parsed.data : parsed;
    if (!data || !Array.isArray(data.pets)) throw new Error('文件格式不正确');
    db = {
      pets: data.pets || [],
      moments: data.moments || [],
      aiLooks: data.aiLooks || [],
      posts: Array.isArray(data.posts) ? data.posts.map(function (p) {
        var ids = Array.isArray(p.petIds) ? p.petIds : (p.petId ? [p.petId] : []);
        return {
          id: p.id,
          text: p.text || '',
          petIds: ids,
          date: p.date || '',
          imageIds: Array.isArray(p.imageIds) ? p.imageIds : [],
          createdAt: p.createdAt || 0
        };
      }) : []
    };
    persist();
    return db;
  }

  function clearAll() {
    db = clone(defaultDB);
    persist();
  }

  /* ---------- 图片压缩 ---------- */
  function compressImage(file, maxEdge) {
    var edge = maxEdge || MAX_PHOTO_EDGE;
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
          var cw = Math.round(w * scale);
          var ch = Math.round(h * scale);
          var canvas = document.createElement('canvas');
          canvas.width = cw;
          canvas.height = ch;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, cw, ch);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  global.Store = {
    uid: uid,
    getPrefs: getPrefs,
    updatePrefs: updatePrefs,
    listPets: listPets,
    getPet: getPet,
    addPet: addPet,
    updatePet: updatePet,
    removePet: removePet,
    listMoments: listMoments,
    listAllMoments: listAllMoments,
    countMoments: countMoments,
    addMoment: addMoment,
    removeMoment: removeMoment,
    listAiLooks: listAiLooks,
    saveAiLook: saveAiLook,
    removeAiLook: removeAiLook,
    listPosts: listPosts,
    getPost: getPost,
    addPost: addPost,
    removePost: removePost,
    countPosts: countPosts,
    exportData: exportData,
    importData: importData,
    clearAll: clearAll,
    compressImage: compressImage
  };
})(window);
