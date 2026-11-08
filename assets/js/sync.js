/**
 * 毛迹 - Supabase 账号与云同步
 * 配置存本地（URL + anon key），数据按用户隔离存放在 user_data 表。
 * 未配置或加载失败时完全不影响本地功能。
 */
(function (global) {
  'use strict';

  var CONFIG_KEY = 'maoji.supabase.v1';
  var SYNC_KEY = 'maoji.sync.v1';
  var TABLE = 'user_data';

  var client = null;
  var currentUser = null;

  function readJSON(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    try {
      global.localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('[毛迹] 写入配置失败', e);
    }
  }

  /* ---------- 配置管理 ---------- */

  function getConfig() {
    var c = readJSON(CONFIG_KEY, null);
    if (!c || !c.url || !c.key) return null;
    return { url: c.url, key: c.key };
  }

  function saveConfig(url, key) {
    url = String(url || '').trim().replace(/\/+$/, '');
    key = String(key || '').trim();
    if (!/^https:\/\/.+/.test(url)) return { ok: false, msg: 'Project URL 要以 https:// 开头' };
    if (key.length < 20) return { ok: false, msg: 'anon key 看起来不对，请完整粘贴' };
    writeJSON(CONFIG_KEY, { url: url, key: key });
    client = null;
    return { ok: true };
  }

  function clearConfig() {
    try { global.localStorage.removeItem(CONFIG_KEY); } catch (e) {}
    client = null;
    currentUser = null;
  }

  function isConfigured() {
    return !!getConfig();
  }

  /* ---------- 客户端 ---------- */

  function getClient() {
    if (client) return client;
    var conf = getConfig();
    if (!conf) return null;
    if (!global.supabase || !global.supabase.createClient) {
      console.warn('[毛迹] supabase-js 未加载（网络问题？）');
      return null;
    }
    try {
      client = global.supabase.createClient(conf.url, conf.key);
    } catch (e) {
      console.warn('[毛迹] Supabase 初始化失败', e);
      return null;
    }
    // 恢复登录态并监听变化
    client.auth.getSession().then(function (res) {
      currentUser = (res && res.data && res.data.user) || null;
    }).catch(function () {});
    client.auth.onAuthStateChange(function (event, session) {
      currentUser = (session && session.user) || null;
    });
    return client;
  }

  function ready() {
    return isConfigured() && !!getClient();
  }

  /* ---------- 登录态 ---------- */

  function getUser() {
    return currentUser;
  }

  function signUp(email, password) {
    var c = getClient();
    if (!c) return Promise.reject(new Error('同步组件不可用'));
    return c.auth.signUp({ email: email, password: password }).then(function (res) {
      if (res.error) throw res.error;
      // res.data.session 为空说明需要邮箱确认
      return { needsConfirm: !res.data.session };
    });
  }

  function signIn(email, password) {
    var c = getClient();
    if (!c) return Promise.reject(new Error('同步组件不可用'));
    return c.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) throw res.error;
      currentUser = res.data.user;
      return res.data.user;
    });
  }

  function signOut() {
    var c = getClient();
    currentUser = null;
    if (!c) return Promise.resolve();
    return c.auth.signOut().catch(function () {});
  }

  /* ---------- 数据同步（整库一行，按用户隔离） ---------- */

  function upload(db) {
    var c = getClient();
    if (!c || !currentUser) return Promise.reject(new Error('尚未登录'));
    return c.from(TABLE).upsert({
      user_id: currentUser.id,
      data: db,
      updated_at: new Date().toISOString()
    }).then(function (res) {
      if (res.error) throw res.error;
      markSynced();
      return true;
    });
  }

  function download() {
    var c = getClient();
    if (!c || !currentUser) return Promise.reject(new Error('尚未登录'));
    return c.from(TABLE).select('data, updated_at').eq('user_id', currentUser.id).maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data ? { data: res.data.data, updatedAt: res.data.updated_at } : null;
      });
  }

  function markSynced() {
    var s = readJSON(SYNC_KEY, {});
    s.at = Date.now();
    if (currentUser) s.email = currentUser.email || '';
    writeJSON(SYNC_KEY, s);
  }

  function lastSync() {
    return readJSON(SYNC_KEY, null);
  }

  function friendlyError(err) {
    var msg = (err && err.message) || String(err || '未知错误');
    if (/Failed to fetch|NetworkError|load failed/i.test(msg)) {
      return '网络连接失败，检查网络后再试';
    }
    if (/Invalid login credentials/i.test(msg)) return '邮箱或密码不对';
    if (/already registered|already exists/i.test(msg)) return '这个邮箱已经注册过了，直接登录试试';
    if (/at least 6 characters/i.test(msg)) return '密码至少要 6 位';
    if (/valid email/i.test(msg)) return '邮箱格式好像不对';
    if (/rate limit|too many/i.test(msg)) return '尝试太频繁了，稍等一分钟再试';
    if (/Email not confirmed/i.test(msg)) return '邮箱还没确认，去收件箱点一下确认链接';
    if (/table.*not found|relation.*does not exist/i.test(msg)) return '云端还没建表，先去执行初始化 SQL（见设置页说明）';
    return msg;
  }

  global.Sync = {
    getConfig: getConfig,
    saveConfig: saveConfig,
    clearConfig: clearConfig,
    isConfigured: isConfigured,
    ready: ready,
    getUser: getUser,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    upload: upload,
    download: download,
    lastSync: lastSync,
    friendlyError: friendlyError
  };
})(window);
