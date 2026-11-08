/**
 * 毛迹 - 界面与交互
 */
(function () {
  'use strict';

  var S = window.Store;
  var view = document.getElementById('view');
  var modalRoot = document.getElementById('modal-root');
  var toastRoot = document.getElementById('toast-root');

  var SPECIES = { cat: '猫咪', dog: '狗狗', other: '小伙伴' };
  var GENDERS = { male: '男孩子', female: '女孩子', unknown: '保密' };
  var EMOJIS = ['🐶', '🐱', '🐰', '🐹', '🐦', '🐢', '🐠', '🐾'];
  var ACCENTS = ['#e8774a', '#2f6e5f', '#7a6ff0', '#d4a017', '#c04434', '#3f7fbf'];
  var MOODS = ['🥰', '😄', '😴', '🤩', '🥺', '😷', '🎂', '🚶'];

  var STYLES = [
    { key: 'oil', label: '古典油画', emoji: '🖼️', prompt: 'classical oil painting portrait, rich texture, museum quality' },
    { key: 'watercolor', label: '水彩插画', emoji: '🎨', prompt: 'soft watercolor illustration, gentle washes, paper texture' },
    { key: 'anime', label: '动漫风', emoji: '✨', prompt: 'cute anime style illustration, clean lineart, pastel colors' },
    { key: 'real', label: '写实写真', emoji: '📷', prompt: 'realistic professional pet photography, sharp detail, natural light' },
    { key: 'pixel', label: '像素世界', emoji: '👾', prompt: 'pixel art, 16-bit retro game style, limited palette' },
    { key: 'vintage', label: '复古胶片', emoji: '🎞️', prompt: 'vintage film photography, warm grain, nostalgic tone' }
  ];

  var BGS = [
    { key: 'warm', label: '暖米', desc: '温暖的原木色，最接近纸质手账', themeColor: '#faf7f2', category: '纯色', icon: '', preview: { bg: '#faf7f2', surface: '#fffdfa', accent: '#e8774a' } },
    { key: 'mist', label: '晨雾', desc: '清冷的灰蓝，安静又清爽', themeColor: '#eef1f4', category: '纯色', icon: '', preview: { bg: '#eef1f4', surface: '#fcfdfe', accent: '#3a6d84' } },
    { key: 'forest', label: '森林', desc: '低饱和的灰绿，像窗外的树影', themeColor: '#eef1ec', category: '纯色', icon: '', preview: { bg: '#eef1ec', surface: '#fcfdfb', accent: '#3d7355' } },
    { key: 'dusk', label: '暮色', desc: '柔和的暖粉褐，适合傍晚翻看', themeColor: '#f6eef0', category: '纯色', icon: '', preview: { bg: '#f6eef0', surface: '#fffcfd', accent: '#8a5b4e' } },
    { key: 'lawn', label: '阳光草坪', desc: '草地、太阳和云朵，适合白天翻看', themeColor: '#c8e6c9', category: '场景', icon: '🌿', preview: { bg: '#c8e6c9', surface: '#fff', accent: '#558b2f' } },
    { key: 'home', label: '温馨小家', desc: '木地板和窗台，像窝在沙发里', themeColor: '#fff8e1', category: '场景', icon: '🏠', preview: { bg: '#fff8e1', surface: '#fff', accent: '#e65100' } },
    { key: 'planet', label: '小小星球', desc: '住在一颗星球上，抬头就是星空', themeColor: '#1a1a3e', category: '场景', icon: '🪐', preview: { bg: '#1a1a3e', surface: '#fff', accent: '#ce93d8' } },
    { key: 'clouds', label: '软软云朵', desc: '飘在云朵上，整个人都轻了', themeColor: '#e1f5fe', category: '场景', icon: '☁️', preview: { bg: '#e1f5fe', surface: '#fff', accent: '#0277bd' } }
  ];

  var IMG_ENDPOINT = 'https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image';

  /* ================= 工具 ================= */

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function applyBg(key) {
    var preset = BGS.find(function (b) { return b.key === key; }) || BGS[0];
    document.documentElement.setAttribute('data-bg', preset.key);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', preset.themeColor);
    return preset;
  }

  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    var d = new Date(dateStr + 'T00:00:00');
    var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return parts[0] + '年' + Number(parts[1]) + '月' + Number(parts[2]) + '日 · ' + week;
  }

  function parseDay(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function fmtDateCompact(dateStr) {
    var d = parseDay(dateStr);
    if (!d) return dateStr || '';
    var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + week;
  }

  function relDay(dateStr) {
    var d = parseDay(dateStr);
    if (!d) return '';
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var diff = Math.round((start - d) / 86400000);
    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    if (diff > 1 && diff < 7) return diff + ' 天前';
    return '';
  }

  function groupMoments(moments) {
    var groups = [];
    moments.forEach(function (m) {
      var key = (m.date || '').slice(0, 7);
      var last = groups[groups.length - 1];
      if (!last || last.key !== key) {
        last = { key: key, items: [] };
        groups.push(last);
      }
      last.items.push(m);
    });
    return groups;
  }

  function daysSince(ts) {
    if (!ts) return 0;
    return Math.max(1, Math.floor((Date.now() - ts) / 86400000) + 1);
  }

  // 相伴天数：优先按「相遇日」计算，没填则退回建档时间
  function companionDays(pet) {
    if (!pet) return 1;
    var met = parseDay(pet.metOn);
    if (met) {
      var now = new Date();
      var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return Math.max(1, Math.floor((start - met) / 86400000) + 1);
    }
    return daysSince(pet.createdAt);
  }

  function ageText(birthday) {
    if (!birthday) return '';
    var b = new Date(birthday + 'T00:00:00');
    if (isNaN(b.getTime())) return '';
    var now = new Date();
    var months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
    if (now.getDate() < b.getDate()) months -= 1;
    if (months < 0) return '';
    if (months === 0) return '不满 1 个月';
    var y = Math.floor(months / 12);
    var m = months % 12;
    if (y === 0) return m + ' 个月';
    return y + ' 岁' + (m ? ' ' + m + ' 个月' : '');
  }

  function avatarHTML(pet, extraClass) {
    var cls = 'avatar' + (extraClass ? ' ' + extraClass : '');
    if (pet.avatar) {
      return '<div class="' + cls + '"><img src="' + esc(pet.avatar) + '" alt="' + esc(pet.name) + '" /></div>';
    }
    return '<div class="' + cls + '">' + esc(pet.emoji || '🐾') + '</div>';
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastRoot.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .25s ease, transform .25s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(function () { el.remove(); }, 260);
    }, 2200);
  }

  function lightbox(src) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<img src="' + esc(src) + '" alt="" />';
    box.onclick = function () {
      box.remove();
      if (modalRoot.hidden) document.body.classList.remove('modal-open');
    };
    document.body.appendChild(box);
    document.body.classList.add('modal-open');
  }

  // 把 IndexedDB 里的图片填进占位 img（data-mid 可点看大图，data-cover-mid 只展示）
  function hydrateImages(root) {
    if (!window.Gallery) return;
    Array.prototype.forEach.call(root.querySelectorAll('[data-cover-mid]'), function (img) {
      Gallery.getUrl(img.getAttribute('data-cover-mid')).then(function (url) {
        if (url) { img.src = url; return; }
        var cover = img.parentNode;
        img.remove();
        if (cover) {
          cover.classList.add('is-empty');
          cover.textContent = '📷';
        }
      }).catch(function () { img.remove(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-mid]'), function (img) {
      Gallery.getUrl(img.getAttribute('data-mid')).then(function (url) {
        if (!url) { img.remove(); return; }
        img.src = url;
        img.onclick = function () { lightbox(url); };
      }).catch(function () { img.remove(); });
    });
  }

  /* ================= 弹窗 ================= */

  function closeModal() {
    modalRoot.hidden = true;
    modalRoot.innerHTML = '';
    modalRoot.onclick = null;
    if (!document.querySelector('.lightbox')) document.body.classList.remove('modal-open');
  }

  function openModal(opts) {
    modalRoot.hidden = false;
    document.body.classList.add('modal-open');
    modalRoot.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
      '  <div class="modal-head">' +
      '    <div><h3>' + esc(opts.title || '') + '</h3>' +
      (opts.subtitle ? '<p>' + esc(opts.subtitle) + '</p>' : '') + '</div>' +
      '    <button class="modal-close" data-close aria-label="关闭">✕</button>' +
      '  </div>' +
      '  <div class="modal-body">' + (opts.body || '') + '</div>' +
      (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
      '</div>';

    modalRoot.querySelector('[data-close]').onclick = closeModal;
    modalRoot.onclick = function (e) { if (e.target === modalRoot) closeModal(); };

    var modal = modalRoot.querySelector('.modal');
    if (opts.onMount) opts.onMount(modal);
    return modal;
  }

  function confirmDialog(title, desc, confirmText, onConfirm, onCancel) {
    openModal({
      title: title,
      subtitle: desc,
      footer:
        '<button class="btn btn-soft" data-cancel>再想想</button>' +
        '<button class="btn btn-danger" data-ok>' + esc(confirmText || '确认') + '</button>',
      onMount: function (modal) {
        modal.querySelector('[data-cancel]').onclick = function () {
          closeModal();
          if (onCancel) onCancel();
        };
        modal.querySelector('[data-ok]').onclick = function () {
          closeModal();
          onConfirm();
        };
      }
    });
  }

  /* ================= 首页 ================= */

  function findAnniversary() {
    var all = S.listAllMoments();
    var now = new Date();
    for (var i = 0; i < all.length; i++) {
      var d = parseDay(all[i].date);
      if (!d) continue;
      if (d.getFullYear() < now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()) {
        return all[i];
      }
    }
    return null;
  }

  // 首页右侧：有动态时预览最近一条，没有时保留原来的装饰卡
  function heroArtHTML() {
    var latest = S.listPosts()[0];
    if (!latest) {
      return (
        '<a class="hero-art hero-feed" href="#/feed" aria-label="打开回忆流">' +
        '  <div class="art-main">🐈</div>' +
        '  <div class="art-chip art-chip-1">📔 备忘录 + 相册</div>' +
        '  <div class="art-chip art-chip-2">🔒 只存在本地</div>' +
        '</a>'
      );
    }
    var coverId = latest.imageIds && latest.imageIds.length ? latest.imageIds[0] : '';
    var text = latest.text || (coverId ? '今天也留下了一张照片' : '记下了一条碎碎念');
    return (
      '<a class="hero-art hero-feed" href="#/feed" aria-label="打开回忆流">' +
      '  <div class="feed-preview">' +
      '    <div class="fp-cover' + (coverId ? '' : ' is-empty') + '">' +
      (coverId
        ? '<img data-cover-mid="' + esc(coverId) + '" alt="" />'
        : '📷') +
      '    </div>' +
      '    <div class="fp-body">' +
      '      <span class="fp-eyebrow">最近一条 · ' + esc(fmtDateCompact(latest.date)) + '</span>' +
      '      <p class="fp-text">' + esc(text) + '</p>' +
      '      <span class="fp-more">打开回忆流 →</span>' +
      '    </div>' +
      '  </div>' +
      '  <div class="art-chip art-chip-1">📔 备忘录 + 相册</div>' +
      '</a>'
    );
  }

  function renderHome() {
    var pets = S.listPets();
    var totalMoments = pets.reduce(function (sum, p) { return sum + S.countMoments(p.id); }, 0);

    var anniversary = findAnniversary();
    var anniversaryPet = anniversary ? S.getPet(anniversary.petId) : null;
    var nudge = '';
    if (anniversary && anniversaryPet) {
      nudge =
        '<a class="memory-nudge" href="#/pet/' + anniversaryPet.id + '">' +
        '  <span class="mn-badge">🕰️</span>' +
        '  <span class="mn-body">' +
        '    <span class="mn-eyebrow">那年今日 · ' + esc(anniversaryPet.name) + '的 ' + esc(fmtDate(anniversary.date)) + '</span>' +
        '    <span class="mn-title">' + esc(anniversary.title || anniversary.text || '这一天，你们在一起') + '</span>' +
        (anniversary.title && anniversary.text
          ? '<span class="mn-text">' + esc(anniversary.text) + '</span>'
          : '') +
        '  </span>' +
        '  <span class="mn-go">看看 →</span>' +
        '</a>';
    }

    var hero =
      '<section class="hero">' +
      '  <div class="hero-copy">' +
      '    <span class="hero-eyebrow">🐾 只属于你们的私人空间</span>' +
      '    <h1>把它的<em>每一天</em><br />都留下来。</h1>' +
      '    <p class="hero-desc">一张照片、一段碎碎念，都是以后会反复翻看的证据。为它建一份档案，把成长、模样和故事留在你手里。</p>' +
      '    <div class="hero-actions">' +
      '      <button class="btn btn-primary" id="hero-add">＋ 添加我的毛孩子</button>' +
      '      <button class="btn btn-ghost" id="hero-help">看看怎么用</button>' +
      '    </div>' +
      '    <p class="hero-note">无需注册 · 不联网也能翻看</p>' +
      '  </div>' +
      heroArtHTML() +
      '</section>';

    var section =
      '<section>' +
      '  <div class="section-head">' +
      '    <h2>我的毛孩子</h2>' +
      '    <span class="count">' + pets.length + ' 位 · ' + totalMoments + ' 条回忆</span>' +
      '  </div>';

    if (pets.length === 0) {
      section +=
        '<div class="empty">' +
        '  <div class="empty-emoji">🐾</div>' +
        '  <h3>还没有小伙伴的档案</h3>' +
        '  <p>先添加一只，之后每一步成长都可以记在这里。</p>' +
        '  <button class="btn btn-primary" id="empty-add">建立第一份档案</button>' +
        '</div>';
    } else {
      section += '<div class="pet-grid">';
      section += pets.map(function (pet) {
        var looks = S.listAiLooks(pet.id).length;
        var last = S.listMoments(pet.id)[0];
        var meta = [SPECIES[pet.species] || '小伙伴'];
        if (pet.breed) meta.push(pet.breed);
        var age = ageText(pet.birthday);
        if (age) meta.push(age);

        var lastHTML = last
          ? '<div class="pet-card-last">' +
            (last.mood ? '<span class="pcl-mood">' + esc(last.mood) + '</span>' : '<span class="pcl-dot"></span>') +
            '<span class="pcl-text">' + esc(last.title || last.text || '记下了一条回忆') + '</span>' +
            '<span class="pcl-time">' + esc(relDay(last.date) || fmtDateCompact(last.date)) + '</span>' +
            '</div>'
          : '<div class="pet-card-last is-empty"><span class="pcl-dot"></span><span class="pcl-text">还没有回忆，去记下第一件小事</span></div>';

        return (
          '<a class="pet-card" href="#/pet/' + pet.id + '" style="--card-accent:' + esc(pet.accent || '#e8774a') + '">' +
          '  <div class="pet-card-top">' +
          avatarHTML(pet) +
          '  <div class="pet-card-id">' +
          '    <div class="pet-card-name">' + esc(pet.name) + '</div>' +
          '    <div class="pet-card-meta">' + meta.map(esc).join(' · ') + '</div>' +
          '  </div>' +
          '  </div>' +
          lastHTML +
          '  <div class="pet-card-stats">' +
          '    <span class="pcs"><b>' + S.countMoments(pet.id) + '</b><i>条回忆</i></span>' +
          '    <span class="pcs"><b>' + companionDays(pet) + '</b><i>天相伴</i></span>' +
          (looks ? '<span class="pcs pcs-ai"><b>' + looks + '</b><i>AI 形象</i></span>' : '') +
          '  </div>' +
          '</a>'
        );
      }).join('');
      section +=
        '<button class="add-card" id="grid-add">' +
        '  <span class="plus">＋</span>' +
        '  <span>再添加一只</span>' +
        '</button>';
      section += '</div>';
    }
    section += '</section>';

    view.innerHTML = hero + nudge + section;

    var openAdd = function () { openPetForm(null); };
    document.getElementById('hero-add').onclick = openAdd;
    document.getElementById('hero-help').onclick = openHelp;
    var emptyAdd = document.getElementById('empty-add');
    if (emptyAdd) emptyAdd.onclick = openAdd;
    var gridAdd = document.getElementById('grid-add');
    if (gridAdd) gridAdd.onclick = openAdd;

    hydrateImages(view);
  }

  function openHelp() {
    openModal({
      title: '毛迹怎么用',
      subtitle: '三件小事，就能留下它的完整成长',
      body:
        '<div class="field"><label>1 · 建一份档案</label><p class="help">名字、品种、生日，还有一张最好看的照片。档案是所有回忆的落脚点。</p></div>' +
        '<div class="field"><label>2 · 记下每一条成长</label><p class="help">在时间线里写下今天发生的事，配上照片和心情。日常的碎片，日后就是完整的故事。</p></div>' +
        '<div class="field"><label>3 · 生成专属 AI 形象</label><p class="help">选一种画风，AI 会为它画一张专属肖像，可以直接设成头像。</p></div>' +
        '<p class="help" style="margin-top:18px">所有数据只保存在这台设备上。换设备前，记得在右上角导出备份。</p>',
      footer: '<button class="btn btn-primary" data-ok>知道了</button>',
      onMount: function (modal) {
        modal.querySelector('[data-ok]').onclick = closeModal;
      }
    });
  }

  /* ================= 宠物表单 ================= */

  function openPetForm(pet) {
    var isEdit = !!pet;
    var state = {
      emoji: (pet && pet.emoji) || '🐾',
      avatar: (pet && pet.avatar) || '',
      accent: (pet && pet.accent) || ACCENTS[0]
    };

    var body =
      '<div class="field">' +
      '  <label>名字 <span class="req">*</span></label>' +
      '  <input class="input" name="name" maxlength="20" placeholder="它叫什么？" value="' + esc(pet ? pet.name : '') + '" />' +
      '</div>' +
      '<div class="field-row">' +
      '  <div class="field"><label>类型</label>' +
      '    <select class="select" name="species">' +
      ['cat', 'dog', 'other'].map(function (k) {
        return '<option value="' + k + '"' + (pet && pet.species === k ? ' selected' : (!pet && k === 'cat' ? ' selected' : '')) + '>' + SPECIES[k] + '</option>';
      }).join('') +
      '    </select></div>' +
      '  <div class="field"><label>品种</label>' +
      '    <input class="input" name="breed" maxlength="30" placeholder="例如英短、柯基" value="' + esc(pet ? pet.breed : '') + '" /></div>' +
      '</div>' +
      '<div class="field-row">' +
      '  <div class="field"><label>生日</label>' +
      '    <input class="input" type="date" name="birthday" max="' + today() + '" value="' + esc(pet ? pet.birthday : '') + '" /></div>' +
      '  <div class="field"><label>性别</label>' +
      '    <select class="select" name="gender">' +
      ['unknown', 'male', 'female'].map(function (k) {
        return '<option value="' + k + '"' + (pet && pet.gender === k ? ' selected' : '') + '>' + GENDERS[k] + '</option>';
      }).join('') +
      '    </select></div>' +
      '</div>' +
      '<div class="field"><label>和它相遇于</label>' +
      '  <input class="input" type="date" name="metOn" max="' + today() + '" value="' + esc(pet ? pet.metOn : '') + '" />' +
      '  <p class="help">相伴天数从这一天开始算；记不清可以留空，从建档当天算起。</p>' +
      '</div>' +
      '<div class="field"><label>头像</label>' +
      '  <div class="emoji-picker" data-emojis>' +
      EMOJIS.map(function (e) {
        return '<button type="button" class="emoji-opt' + (state.avatar ? '' : (e === state.emoji ? ' active' : '')) + '" data-emoji="' + e + '">' + e + '</button>';
      }).join('') +
      '  </div>' +
      '  <div style="margin-top:10px"><label class="upload-box" data-pick>' +
      '    <span>📷 上传一张照片（优先作为头像）</span>' +
      '    <span class="help">会自动压缩，只存在本地</span>' +
      '  </label>' +
      '  <input type="file" accept="image/*" data-file />' +
      '  </div>' +
      '  <div class="upload-preview" data-preview></div>' +
      '</div>' +
      '<div class="field"><label>用一句话介绍它</label>' +
      '  <textarea class="textarea" name="bio" maxlength="120" placeholder="例如：晚上八点准时在门口等我回家。">' + esc(pet ? pet.bio : '') + '</textarea>' +
      '</div>' +
      '<div class="field"><label>卡片配色</label>' +
      '  <div class="emoji-picker" data-colors>' +
      ACCENTS.map(function (c) {
        return '<button type="button" class="emoji-opt' + (c === state.accent ? ' active' : '') + '" data-color="' + c + '" style="background:' + c + '1a;border-color:' + (c === state.accent ? c : 'transparent') + '"><span style="width:14px;height:14px;border-radius:50%;background:' + c + ';display:block"></span></button>';
      }).join('') +
      '  </div>' +
      '</div>';

    var footer =
      '<button class="btn btn-soft" data-cancel>取消</button>' +
      '<button class="btn btn-primary" data-save>' + (isEdit ? '保存修改' : '建档') + '</button>';

    openModal({
      title: isEdit ? '编辑档案' : '新建毛孩子档案',
      subtitle: isEdit ? '改好了就保存，回忆不会丢' : '先简单介绍，之后再慢慢补充',
      body: body,
      footer: footer,
      onMount: function (modal) {
        var preview = modal.querySelector('[data-preview]');
        var fileInput = modal.querySelector('[data-file]');

        function renderPreview() {
          preview.innerHTML = state.avatar
            ? '<div class="upload-thumb"><img src="' + esc(state.avatar) + '" alt="" /><button type="button" data-remove-photo>✕</button></div>'
            : '';
          var rm = preview.querySelector('[data-remove-photo]');
          if (rm) {
            rm.onclick = function () {
              state.avatar = '';
              renderPreview();
              syncEmojiActive();
            };
          }
        }

        function syncEmojiActive() {
          modal.querySelectorAll('[data-emoji]').forEach(function (btn) {
            btn.classList.toggle('active', !state.avatar && btn.dataset.emoji === state.emoji);
          });
        }

        renderPreview();

        modal.querySelectorAll('[data-emoji]').forEach(function (btn) {
          btn.onclick = function () {
            state.emoji = btn.dataset.emoji;
            state.avatar = '';
            renderPreview();
            syncEmojiActive();
          };
        });

        modal.querySelectorAll('[data-color]').forEach(function (btn) {
          btn.onclick = function () {
            state.accent = btn.dataset.color;
            modal.querySelectorAll('[data-color]').forEach(function (b) {
              b.classList.remove('active');
              b.style.borderColor = 'transparent';
            });
            btn.classList.add('active');
            btn.style.borderColor = state.accent;
          };
        });

        modal.querySelector('[data-pick]').onclick = function () { fileInput.click(); };

        fileInput.onchange = function () {
          var file = fileInput.files && fileInput.files[0];
          if (!file) return;
          S.compressImage(file, 600).then(function (dataUrl) {
            state.avatar = dataUrl;
            renderPreview();
            syncEmojiActive();
          }).catch(function (err) {
            toast(err.message || '图片处理失败');
          });
          fileInput.value = '';
        };

        modal.querySelector('[data-cancel]').onclick = closeModal;

        modal.querySelector('[data-save]').onclick = function () {
          var name = modal.querySelector('[name="name"]').value.trim();
          if (!name) {
            toast('给它起个名字吧');
            modal.querySelector('[name="name"]').focus();
            return;
          }
          var payload = {
            name: name,
            species: modal.querySelector('[name="species"]').value,
            breed: modal.querySelector('[name="breed"]').value.trim(),
            birthday: modal.querySelector('[name="birthday"]').value,
            metOn: modal.querySelector('[name="metOn"]').value,
            gender: modal.querySelector('[name="gender"]').value,
            bio: modal.querySelector('[name="bio"]').value.trim(),
            emoji: state.emoji,
            avatar: state.avatar,
            accent: state.accent
          };

          try {
            if (isEdit) {
              S.updatePet(pet.id, payload);
              toast('档案已更新');
              closeModal();
              render();
            } else {
              var created = S.addPet(payload);
              toast('欢迎 ' + created.name + ' 加入');
              closeModal();
              location.hash = '#/pet/' + created.id;
            }
          } catch (err) {
            toast(err.message || '保存失败');
          }
        };
      }
    });
  }

  /* ================= 宠物详情 ================= */

  function renderPet(id, tab) {
    var pet = S.getPet(id);
    if (!pet) {
      view.innerHTML = '<div class="empty"><div class="empty-emoji">🐾</div><h3>找不到这份档案</h3><p>它可能已被删除。</p><a class="btn btn-primary" href="#/">回到首页</a></div>';
      return;
    }

    var moments = S.listMoments(pet.id);
    var looks = S.listAiLooks(pet.id);
    var age = ageText(pet.birthday);

    var head =
      '<a class="back-link" href="#/">← 全部毛孩子</a>' +
      '<section class="profile-card">' +
      avatarHTML(pet, 'avatar-lg') +
      '  <div class="profile-info">' +
      '    <h1>' + esc(pet.name) + '</h1>' +
      '    <div class="profile-tags">' +
      '      <span class="tag tag-accent">' + esc(SPECIES[pet.species] || '小伙伴') + '</span>' +
      (pet.breed ? '<span class="tag">' + esc(pet.breed) + '</span>' : '') +
      (pet.gender !== 'unknown' ? '<span class="tag">' + esc(GENDERS[pet.gender]) + '</span>' : '') +
      (age ? '<span class="tag">' + esc(age) + '</span>' : '') +
      (pet.birthday ? '<span class="tag">生日 ' + esc(pet.birthday.replace(/-/g, '/')) + '</span>' : '') +
      (pet.metOn ? '<span class="tag">相遇 ' + esc(pet.metOn.replace(/-/g, '/')) + '</span>' : '') +
      '    </div>' +
      (pet.bio ? '<p class="profile-bio">' + esc(pet.bio) + '</p>' : '') +
      '  </div>' +
      '  <div class="profile-actions">' +
      '    <button class="btn btn-soft btn-sm" data-edit>编辑</button>' +
      '    <button class="btn btn-soft btn-sm" data-del-pet>删除</button>' +
      '  </div>' +
      '</section>' +
      '<div class="stat-strip">' +
      '  <div class="stat-box"><div class="k">相伴</div><div class="v">' + companionDays(pet) + ' 天</div></div>' +
      '  <div class="stat-box"><div class="k">回忆</div><div class="v">' + moments.length + ' 条</div></div>' +
      '  <div class="stat-box"><div class="k">AI 形象</div><div class="v">' + looks.length + ' 张</div></div>' +
      '</div>' +
      '<div class="tabs">' +
      '  <a class="tab' + (tab !== 'ai' ? ' active' : '') + '" href="#/pet/' + pet.id + '">成长时间线</a>' +
      '  <a class="tab' + (tab === 'ai' ? ' active' : '') + '" href="#/pet/' + pet.id + '/ai">AI 形象</a>' +
      '</div>';

    var main = tab === 'ai' ? renderAiPanel(pet, looks) : renderTimeline(pet, moments);

    view.innerHTML = head + main;

    view.querySelector('[data-edit]').onclick = function () { openPetForm(pet); };
    view.querySelector('[data-del-pet]').onclick = function () {
      confirmDialog('删除 ' + pet.name + ' 的档案？', '档案、回忆和 AI 形象都会一起删除，无法恢复。', '确认删除', function () {
        S.removePet(pet.id);
        toast('档案已删除');
        location.hash = '#/';
      });
    };

    bindTimeline(pet, moments);
    bindAiPanel(pet, looks);
  }

  function momentItem(m) {
    var rel = relDay(m.date);
    return (
      '<div class="tl-item">' +
      '  <article class="moment-card" data-moment="' + m.id + '">' +
      '    <div class="moment-head">' +
      '      <div class="moment-when">' +
      '        <span class="moment-date">' + esc(fmtDateCompact(m.date)) + '</span>' +
      (rel ? '<span class="moment-rel">' + esc(rel) + '</span>' : '') +
      '      </div>' +
      (m.mood ? '<span class="moment-mood">' + esc(m.mood) + '</span>' : '') +
      '    </div>' +
      (m.title ? '<h3 class="moment-title">' + esc(m.title) + '</h3>' : '') +
      (m.text ? '<p class="moment-text">' + esc(m.text) + '</p>' : '') +
      (m.photos && m.photos.length
        ? '<div class="moment-photos">' + m.photos.map(function (src) {
          return '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async" data-zoom="' + esc(src) + '" />';
        }).join('') + '</div>'
        : '') +
      '    <div class="moment-foot"><button class="moment-del" data-del-moment="' + m.id + '">删除这条</button></div>' +
      '  </article>' +
      '</div>'
    );
  }

  function renderTimeline(pet, moments) {
    var toolbar =
      '<div class="tl-toolbar">' +
      '  <span class="hint">' + (moments.length ? '共 ' + moments.length + ' 条回忆' : '从今天开始记录吧') + '</span>' +
      '  <button class="btn btn-primary btn-sm" data-add-moment>＋ 添加回忆</button>' +
      '</div>';

    if (moments.length === 0) {
      return toolbar +
        '<div class="empty">' +
        '  <div class="empty-emoji">📷</div>' +
        '  <h3>还没有回忆</h3>' +
        '  <p>第一次打疫苗、第一次学会握手，都值得留下。</p>' +
        '  <button class="btn btn-primary" data-add-moment>记下第一件事</button>' +
        '</div>';
    }

    var groups = groupMoments(moments);
    var html = groups.map(function (g) {
      var year = g.key.slice(0, 4);
      var month = Number(g.key.slice(5, 7));
      var label = (year && !isNaN(month)) ? year + ' 年 ' + month + ' 月' : '未标注日期';
      return '<div class="tl-group">' +
        '<div class="tl-month"><span>' + label + '</span><i>' + g.items.length + ' 条</i></div>' +
        g.items.map(momentItem).join('') +
        '</div>';
    }).join('');

    return toolbar + '<div class="timeline">' + html + '</div>';
  }

  function bindTimeline(pet, moments) {
    Array.prototype.forEach.call(view.querySelectorAll('[data-add-moment]'), function (btn) {
      btn.onclick = function () { openMomentForm(pet); };
    });

    Array.prototype.forEach.call(view.querySelectorAll('[data-zoom]'), function (img) {
      img.onclick = function () { lightbox(img.dataset.zoom); };
    });

    Array.prototype.forEach.call(view.querySelectorAll('[data-del-moment]'), function (btn) {
      btn.onclick = function () {
        confirmDialog('删除这条回忆？', '删除后无法恢复。', '删除', function () {
          S.removeMoment(btn.dataset.delMoment);
          toast('已删除');
          render();
        });
      };
    });
  }

  /* ================= 回忆表单 ================= */

  function openMomentForm(pet) {
    var photos = [];

    var body =
      '<div class="field"><label>日期</label>' +
      '  <input class="input" type="date" name="date" value="' + today() + '" /></div>' +
      '<div class="field"><label>标题</label>' +
      '  <input class="input" name="title" maxlength="40" placeholder="例如：第一次学会握手" /></div>' +
      '<div class="field"><label>发生了什么</label>' +
      '  <textarea class="textarea" name="text" maxlength="500" placeholder="随手写几句就好，不用讲究文采。"></textarea></div>' +
      '<div class="field"><label>今天的心情</label>' +
      '  <div class="emoji-picker" data-moods>' +
      MOODS.map(function (e) {
        return '<button type="button" class="emoji-opt" data-mood="' + e + '">' + e + '</button>';
      }).join('') +
      '  </div></div>' +
      '<div class="field"><label>照片</label>' +
      '  <label class="upload-box" data-pick-moment>' +
      '    <span>🖼️ 添加照片（可多选）</span>' +
      '    <span class="help">会自动压缩后保存在本地</span>' +
      '  </label>' +
      '  <input type="file" accept="image/*" multiple data-files />' +
      '  <div class="upload-preview" data-preview></div>' +
      '</div>';

    openModal({
      title: '记下一条回忆',
      subtitle: '关于 ' + pet.name + ' 的今天',
      body: body,
      footer:
        '<button class="btn btn-soft" data-cancel>取消</button>' +
        '<button class="btn btn-primary" data-save>保存</button>',
      onMount: function (modal) {
        var preview = modal.querySelector('[data-preview]');
        var fileInput = modal.querySelector('[data-files]');
        var mood = '';

        function renderPreview() {
          preview.innerHTML = photos.map(function (src, i) {
            return '<div class="upload-thumb"><img src="' + esc(src) + '" alt="" /><button type="button" data-rm-index="' + i + '">✕</button></div>';
          }).join('');
          Array.prototype.forEach.call(preview.querySelectorAll('[data-rm-index]'), function (btn) {
            btn.onclick = function () {
              photos.splice(Number(btn.dataset.rmIndex), 1);
              renderPreview();
            };
          });
        }

        modal.querySelector('[data-pick-moment]').onclick = function () { fileInput.click(); };

        fileInput.onchange = function () {
          var files = Array.prototype.slice.call(fileInput.files || []);
          if (!files.length) return;
          Promise.all(files.map(function (f) { return S.compressImage(f, 1000); }))
            .then(function (list) {
              photos = photos.concat(list);
              renderPreview();
            })
            .catch(function (err) { toast(err.message || '图片处理失败'); });
          fileInput.value = '';
        };

        modal.querySelectorAll('[data-mood]').forEach(function (btn) {
          btn.onclick = function () {
            mood = mood === btn.dataset.mood ? '' : btn.dataset.mood;
            modal.querySelectorAll('[data-mood]').forEach(function (b) {
              b.classList.toggle('active', b.dataset.mood === mood);
            });
          };
        });

        modal.querySelector('[data-cancel]').onclick = closeModal;

        modal.querySelector('[data-save]').onclick = function () {
          var text = modal.querySelector('[name="text"]').value.trim();
          var title = modal.querySelector('[name="title"]').value.trim();
          if (!title && !text && photos.length === 0) {
            toast('写点什么，或者加张照片吧');
            return;
          }
          try {
            S.addMoment({
              petId: pet.id,
              date: modal.querySelector('[name="date"]').value || today(),
              title: title,
              text: text,
              mood: mood,
              photos: photos
            });
            toast('已记下这一刻');
            closeModal();
            render();
          } catch (err) {
            toast(err.message || '保存失败');
          }
        };
      }
    });
  }

  /* ================= AI 形象 ================= */

  function buildPrompt(pet, style, features) {
    var species = pet.species === 'dog' ? 'dog' : (pet.species === 'cat' ? 'cat' : 'pet');
    var subject = pet.breed ? pet.breed + ' ' + species : species;
    var parts = [
      style.prompt,
      'portrait of a lovely ' + subject,
      'sitting pose, looking at camera',
      'soft natural window light',
      'clean minimal warm background',
      'high detail, adorable, professional pet portrait'
    ];
    if (features) parts.push(features);
    return parts.join(', ');
  }

  function renderAiPanel(pet, looks) {
    var stylesHTML = STYLES.map(function (s, i) {
      return '<button type="button" class="style-chip' + (i === 0 ? ' active' : '') + '" data-style="' + s.key + '">' +
        '<span class="emoji">' + s.emoji + '</span>' + s.label + '</button>';
    }).join('');

    var latest = looks[0];

    return (
      '<section class="ai-panel" id="ai-panel">' +
      '  <h2>为 ' + esc(pet.name) + ' 画一张专属肖像</h2>' +
      '  <p class="sub">选一种画风，AI 会画出它最像的样子。满意的话可以直接设为头像。</p>' +
      '  <div class="style-grid" data-styles>' + stylesHTML + '</div>' +
      '  <div class="field"><label>它的独特特征（选填）</label>' +
      '    <input class="input" data-features maxlength="60" placeholder="例如：橘色虎斑、绿色眼睛、左耳有个小缺口" /></div>' +
      '  <button class="btn btn-primary btn-block" data-generate>✨ 生成肖像</button>' +
      '  <div class="ai-result" id="ai-result" style="margin-top:22px">' +
      '    <div class="ai-frame" id="ai-frame">' + (latest ? '<img src="' + esc(latest.url) + '" alt="" />' : '🎨') + '</div>' +
      '    <div id="ai-detail">' + (latest
        ? '<p class="ai-note">这张肖像已经保存在你的设备上，随时可以设成头像。</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
          '  <button class="btn btn-ghost btn-sm" data-set-avatar>设为头像</button>' +
          '  <button class="btn btn-soft btn-sm" data-open-ai>查看大图</button>' +
          '</div>' +
          '<div class="ai-prompt-box">' + esc(latest.prompt) + '</div>'
        : '<p class="ai-note">还没有生成过。点上面的按钮，这里就会出现它最可爱的专属肖像。</p>') +
      '    </div>' +
      '  </div>' +
      (looks.length > 1
        ? '<div class="ai-history-label">历史形象</div><div class="ai-history">' + looks.map(function (l) {
          return '<img src="' + esc(l.url) + '" alt="" loading="lazy" decoding="async" data-look="' + esc(l.url) + '" title="' + esc(l.style || '') + '" />';
        }).join('') + '</div>'
        : '') +
      '</section>'
    );
  }

  function bindAiPanel(pet, looks) {
    var panel = document.getElementById('ai-panel');
    if (!panel) return;

    var selected = STYLES[0].key;
    var featureInput = panel.querySelector('[data-features]');

    panel.querySelectorAll('[data-style]').forEach(function (btn) {
      btn.onclick = function () {
        selected = btn.dataset.style;
        panel.querySelectorAll('[data-style]').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
      };
    });

    Array.prototype.forEach.call(panel.querySelectorAll('[data-look]'), function (img) {
      img.onclick = function () { lightbox(img.dataset.look); };
    });

    var currentLook = looks[0];
    var setAvatarBtn = panel.querySelector('[data-set-avatar]');
    if (setAvatarBtn && currentLook) {
      setAvatarBtn.onclick = function () {
        S.updatePet(pet.id, { avatar: currentLook.url });
        toast('已设为头像');
        render();
      };
    }
    var openAiBtn = panel.querySelector('[data-open-ai]');
    if (openAiBtn && currentLook) {
      openAiBtn.onclick = function () { lightbox(currentLook.url); };
    }

    var genBtn = panel.querySelector('[data-generate]');
    genBtn.onclick = function () {
      var style = STYLES.find(function (s) { return s.key === selected; }) || STYLES[0];
      var features = featureInput.value.trim();
      var prompt = buildPrompt(pet, style, features);

      // 同一个 prompt 已有结果就直接复用
      var cached = S.listAiLooks(pet.id).find(function (l) { return l.prompt === prompt; });
      if (cached) {
        showResult(cached, style);
        toast('这张之前画过，直接帮你翻出来了');
        return;
      }

      genBtn.disabled = true;
      genBtn.textContent = '正在画…';
      var frame = panel.querySelector('#ai-frame');
      frame.innerHTML = '';
      frame.classList.add('loading');

      var url = IMG_ENDPOINT + '?prompt=' + encodeURIComponent(prompt) + '&image_size=square_hd';
      var img = new Image();
      img.onload = function () {
        try {
          S.saveAiLook({ petId: pet.id, prompt: prompt, style: style.label, url: url });
        } catch (err) {
          console.warn(err);
        }
        frame.classList.remove('loading');
        genBtn.disabled = false;
        genBtn.textContent = '✨ 生成肖像';
        var look = { url: url, prompt: prompt, style: style.label };
        showResult(look, style);
        appendHistory(look);
        toast('肖像画好了');
      };
      img.onerror = function () {
        frame.classList.remove('loading');
        frame.innerHTML = '🎨';
        genBtn.disabled = false;
        genBtn.textContent = '✨ 生成肖像';
        toast('生成失败了，检查一下网络再试');
      };
      img.src = url;
    };

    function showResult(look, style) {
      var frame = panel.querySelector('#ai-frame');
      frame.classList.remove('loading');
      frame.innerHTML = '<img src="' + esc(look.url) + '" alt="' + esc(pet.name) + ' 的肖像" />';

      var detail = panel.querySelector('#ai-detail');
      detail.innerHTML =
        '<p class="ai-note">「' + esc(look.style || '') + '」风格的肖像，已经保存在你的设备上。</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
        '  <button class="btn btn-ghost btn-sm" d-set>设为头像</button>' +
        '  <button class="btn btn-soft btn-sm" d-open>查看大图</button>' +
        '</div>' +
        '<div class="ai-prompt-box">' + esc(look.prompt) + '</div>';

      detail.querySelector('[d-set]').onclick = function () {
        S.updatePet(pet.id, { avatar: look.url });
        toast('已设为头像');
        render();
      };
      detail.querySelector('[d-open]').onclick = function () { lightbox(look.url); };
    }

    function appendHistory(look) {
      var history = panel.querySelector('.ai-history');
      if (!history) {
        history = document.createElement('div');
        history.className = 'ai-history';
        panel.appendChild(history);
      }
      var thumb = document.createElement('img');
      thumb.src = look.url;
      thumb.dataset.look = look.url;
      thumb.onclick = function () { lightbox(look.url); };
      history.insertBefore(thumb, history.firstChild);
    }
  }

  /* ================= 回忆流 ================= */

  function postCardHTML(post) {
    var petIds = post.petIds || (post.petId ? [post.petId] : []);
    var pets = petIds.map(function (id) { return S.getPet(id); }).filter(Boolean);
    var rel = relDay(post.date);
    var imgs = post.imageIds || [];
    var photosHTML = imgs.length
      ? '<div class="post-photos' + (imgs.length === 1 ? ' is-single' : '') + '">' +
        imgs.map(function (id) {
          return '<img data-mid="' + esc(id) + '" alt="" loading="lazy" decoding="async" />';
        }).join('') +
        '</div>'
      : '';
    var petTags = pets.length
      ? '<div class="post-pets">' + pets.map(function (p) {
          return '<span class="post-pet">' + esc(p.emoji || '🐾') + ' ' + esc(p.name) + '</span>';
        }).join('') + '</div>'
      : '';

    return (
      '<article class="post-card" data-post="' + post.id + '">' +
      '  <div class="post-head">' +
      '    <div class="post-when">' +
      '      <span class="post-date">' + esc(fmtDateCompact(post.date)) + '</span>' +
      (rel ? '<span class="post-rel">' + esc(rel) + '</span>' : '') +
      '    </div>' +
      petTags +
      '  </div>' +
      (post.text ? '<p class="post-text">' + esc(post.text) + '</p>' : '') +
      photosHTML +
      '  <div class="post-foot">' +
      '    <span class="post-privacy">🔒 仅自己可见</span>' +
      '    <button class="post-del" data-del-post="' + post.id + '">删除</button>' +
      '  </div>' +
      '</article>'
    );
  }

  function renderFeed() {
    var posts = S.listPosts();

    var composer =
      '<div class="feed-composer">' +
      '  <button class="fc-input" data-compose>今天想记点什么？</button>' +
      '  <button class="btn btn-primary btn-sm" data-compose>＋ 发一条</button>' +
      '</div>';

    var body;
    if (!posts.length) {
      body =
        '<div class="empty">' +
        '  <div class="empty-emoji">📔</div>' +
        '  <h3>回忆流还是空的</h3>' +
        '  <p>发一张照片、写几句碎碎念，之后每一张都会留在这里。</p>' +
        '  <button class="btn btn-primary" data-compose>写下第一条</button>' +
        '</div>';
    } else {
      body = '<div class="feed-list">' + posts.map(postCardHTML).join('') + '</div>';
    }

    view.innerHTML =
      '<a class="back-link" href="#/">← 返回首页</a>' +
      '<div class="page-head"><h1>回忆流</h1><p>照片和碎碎念，只属于你自己' +
      (posts.length ? ' · 共 ' + posts.length + ' 条' : '') + '</p></div>' +
      composer +
      body;

    Array.prototype.forEach.call(view.querySelectorAll('[data-compose]'), function (btn) {
      btn.onclick = openPostForm;
    });

    Array.prototype.forEach.call(view.querySelectorAll('[data-del-post]'), function (btn) {
      btn.onclick = function () {
        var post = S.getPost(btn.dataset.delPost);
        if (!post) return;
        confirmDialog('删除这条动态？', '文字和照片都会一起删除，无法恢复。', '删除', function () {
          S.removePost(post.id);
          if (window.Gallery && post.imageIds && post.imageIds.length) {
            Gallery.deleteImages(post.imageIds).catch(function () {});
          }
          toast('已删除');
          render();
        });
      };
    });

    hydrateImages(view);
  }

  function openPostForm() {
    if (!window.Gallery) {
      toast('当前浏览器不支持本地相册，换个浏览器再试');
      return;
    }
    var pets = S.listPets();
    var photos = []; // { blob, url }

    var petChips = pets.length
      ? pets.map(function (p) {
          return '<label class="pet-chip"><input type="checkbox" value="' + p.id + '" /><span>' + esc(p.emoji || '🐾') + ' ' + esc(p.name) + '</span></label>';
        }).join('')
      : '<span class="help">还没有毛孩子，先去添加一个吧</span>';

    var body =
      '<div class="field"><label>照片</label>' +
      '  <label class="upload-box" data-pick-post>' +
      '    <span>🖼️ 选择照片（可多选）</span>' +
      '    <span class="help">会自动压缩，只存在这台设备上</span>' +
      '  </label>' +
      '  <input type="file" accept="image/*" multiple data-post-files />' +
      '  <div class="upload-preview" data-post-preview></div>' +
      '</div>' +
      '<div class="field"><label>说点什么</label>' +
      '  <textarea class="textarea" name="postText" maxlength="500" placeholder="今天想记下的碎碎念…"></textarea></div>' +
      '<div class="field-row">' +
      '  <div class="field"><label>日期</label>' +
      '    <input class="input" type="date" name="postDate" max="' + today() + '" value="' + today() + '" /></div>' +
      '  <div class="field field-pets"><label>关联毛孩子（选填，可多选）</label>' +
      '    <div class="pet-multi" data-pet-multi>' +
      (pets.length ? '<label class="pet-chip"><input type="checkbox" data-pet-none /><span>不关联</span></label>' : '') +
      petChips +
      '    </div></div>' +
      '</div>';

    openModal({
      title: '发一条动态',
      subtitle: '照片和文字只会留在这台设备上',
      body: body,
      footer:
        '<button class="btn btn-soft" data-cancel>取消</button>' +
        '<button class="btn btn-primary" data-save-post>发布</button>',
      onMount: function (modal) {
        var preview = modal.querySelector('[data-post-preview]');
        var fileInput = modal.querySelector('[data-post-files]');

        // 关联毛孩子：多选，「不关联」与其他互斥
        var noneChip = modal.querySelector('[data-pet-none]');
        var petChecks = modal.querySelectorAll('.pet-multi input[type="checkbox"][value]');
        if (noneChip) {
          noneChip.checked = true;
          noneChip.onchange = function () {
            if (noneChip.checked) {
              petChecks.forEach(function (c) { c.checked = false; });
            }
          };
          petChecks.forEach(function (c) {
            c.onchange = function () {
              if (c.checked) noneChip.checked = false;
            };
          });
        }

        function renderPreview() {
          preview.innerHTML = photos.map(function (p, i) {
            return '<div class="upload-thumb"><img src="' + p.url + '" alt="" /><button type="button" data-post-rm="' + i + '">✕</button></div>';
          }).join('');
          Array.prototype.forEach.call(preview.querySelectorAll('[data-post-rm]'), function (btn) {
            btn.onclick = function () {
              var item = photos.splice(Number(btn.dataset.postRm), 1)[0];
              if (item) URL.revokeObjectURL(item.url);
              renderPreview();
            };
          });
        }

        modal.querySelector('[data-pick-post]').onclick = function () { fileInput.click(); };

        fileInput.onchange = function () {
          var files = Array.prototype.slice.call(fileInput.files || []);
          fileInput.value = '';
          if (!files.length) return;
          Promise.all(files.map(function (f) { return Gallery.compress(f); }))
            .then(function (blobs) {
              blobs.forEach(function (blob) {
                if (photos.length >= 9) {
                  toast('一条最多 9 张照片');
                  return;
                }
                photos.push({ blob: blob, url: URL.createObjectURL(blob) });
              });
              renderPreview();
            })
            .catch(function (err) { toast(err.message || '图片处理失败'); });
        };

        modal.querySelector('[data-cancel]').onclick = closeModal;

        modal.querySelector('[data-save-post]').onclick = function () {
          var btn = modal.querySelector('[data-save-post]');
          var text = modal.querySelector('[name="postText"]').value.trim();
          if (!text && !photos.length) {
            toast('写点什么，或者加张照片吧');
            return;
          }
          btn.disabled = true;
          btn.textContent = '发布中…';
          Promise.all(photos.map(function (p) { return Gallery.addImage(p.blob); }))
            .then(function (ids) {
              var petIds = Array.prototype.map.call(petChecks, function (c) {
                return c.checked ? c.value : '';
              }).filter(Boolean);
              S.addPost({
                text: text,
                petIds: petIds,
                date: modal.querySelector('[name="postDate"]').value || today(),
                imageIds: ids
              });
              photos.forEach(function (p) { URL.revokeObjectURL(p.url); });
              closeModal();
              toast('已发布');
              render();
            })
            .catch(function (err) {
              btn.disabled = false;
              btn.textContent = '发布';
              toast(err.message || '图片保存失败');
            });
        };
      }
    });
  }

  /* ================= 备份 ================= */

  function clearAllData(onCancel) {
    confirmDialog('清空全部数据？', '所有档案、回忆、AI 形象和回忆流动态（含照片）都会被删除，且无法恢复。', '确认清空', function () {
      S.clearAll();
      if (window.Gallery) Gallery.clearAll().catch(function () {});
      closeModal();
      toast('已清空');
      location.hash = '#/';
      render();
    }, onCancel);
  }

  function openBackup() {
    var pets = S.listPets();
    var moments = pets.reduce(function (s, p) { return s + S.countMoments(p.id); }, 0);
    var posts = S.countPosts();

    openModal({
      title: '备份与迁移',
      subtitle: '数据存在本设备，换设备前先导出',
      body:
        '<p class="help" style="margin-bottom:8px">当前有 ' + pets.length + ' 份档案、' + moments + ' 条回忆、' + posts + ' 条回忆流动态。</p>' +
        '<p class="help" style="margin-bottom:16px">备份只包含档案和文字；回忆流里的照片存在本设备的相册库里，不会写进 JSON 文件。</p>' +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
        '  <button class="btn btn-ghost btn-block" data-export>⬇️ 导出为备份文件（JSON）</button>' +
        '  <button class="btn btn-ghost btn-block" data-import>⬆️ 从备份文件恢复</button>' +
        '  <button class="btn btn-danger btn-block" data-clear>清空全部数据</button>' +
        '</div>' +
        '<input type="file" accept="application/json,.json" data-import-file />',
      footer: '<button class="btn btn-primary" data-close2>完成</button>',
      onMount: function (modal) {
        var fileInput = modal.querySelector('[data-import-file]');

        modal.querySelector('[data-export]').onclick = function () {
          var text = S.exportData();
          var blob = new Blob([text], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = '毛迹备份-' + today() + '.json';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          toast('备份文件已导出');
        };

        modal.querySelector('[data-import]').onclick = function () { fileInput.click(); };

        fileInput.onchange = function () {
          var file = fileInput.files && fileInput.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function () {
            try {
              S.importData(String(reader.result));
              closeModal();
              toast('恢复成功');
              location.hash = '#/';
              render();
            } catch (err) {
              toast(err.message || '文件解析失败');
            }
          };
          reader.readAsText(file);
          fileInput.value = '';
        };

        modal.querySelector('[data-clear]').onclick = function () {
          clearAllData(function () { openBackup(); });
        };

        modal.querySelector('[data-close2]').onclick = closeModal;
      }
    });
  }

  /* ================= 账号与云同步 ================= */

  function updateAccountBtn() {
    var btn = document.getElementById('btn-account');
    if (!btn) return;
    var configured = window.Sync && Sync.isConfigured();
    btn.hidden = !configured;
    if (configured) {
      var user = Sync.getUser();
      btn.textContent = user ? '✅' : '👤';
      btn.title = user ? '已登录：' + (user.email || '') : '登录 / 注册';
    }
  }

  function doUpload() {
    var db;
    try {
      db = JSON.parse(S.exportData()).data;
    } catch (e) {
      toast('读取本地数据失败');
      return;
    }
    toast('正在上传…');
    Sync.upload(db).then(function () {
      toast('已备份到云端 ☁️');
      if (parseRoute().name === 'settings') render();
    }).catch(function (err) {
      toast(Sync.friendlyError(err));
    });
  }

  function doDownload() {
    toast('正在恢复…');
    Sync.download().then(function (cloud) {
      if (!cloud || !cloud.data) {
        toast('云端还没有备份');
        return;
      }
      try {
        S.importData(JSON.stringify(cloud.data));
      } catch (e) {
        toast('云端数据解析失败');
        return;
      }
      toast('已恢复云端数据');
      render();
    }).catch(function (err) {
      toast(Sync.friendlyError(err));
    });
  }

  function afterAuth() {
    updateAccountBtn();
    closeModal();
    toast('登录成功');
    Sync.download().then(function (cloud) {
      var cloudData = cloud && cloud.data;
      var cloudEmpty = !cloudData ||
        (!(cloudData.pets || []).length && !(cloudData.moments || []).length && !(cloudData.aiLooks || []).length);
      var local = JSON.parse(S.exportData()).data;
      var localEmpty = !local.pets.length && !local.moments.length && !local.aiLooks.length;
      if (cloudEmpty && !localEmpty) {
        confirmDialog('备份到云端？', '把这台设备上的档案存进你的账号，换设备也不会丢。', '上传备份', doUpload);
      } else if (!cloudEmpty && localEmpty) {
        confirmDialog('恢复云端数据？', '你的账号里有一份备份，恢复后这台设备会显示同样的档案。', '恢复', doDownload);
      } else if (!cloudEmpty) {
        toast('云端有备份，可在设置里选择上传或恢复');
      }
      if (parseRoute().name === 'settings') render();
    }).catch(function (err) {
      toast(Sync.friendlyError(err));
    });
  }

  function openConnect() {
    openModal({
      title: '连接 Supabase',
      subtitle: '一次性配置，Key 只保存在这台设备上',
      body:
        '<div class="field"><label>Project URL</label>' +
        '<input class="input" id="cfg-url" type="url" placeholder="https://xxxx.supabase.co" autocomplete="off" /></div>' +
        '<div class="field"><label>anon public key</label>' +
        '<textarea class="input textarea" id="cfg-key" style="min-height:72px" placeholder="粘贴 Settings → API 里的 anon public key" autocomplete="off"></textarea></div>' +
        '<p class="help">在 supabase.com 建好项目后，从 Project Settings → API 页面复制这两项。详细步骤见设置页「账号与同步」。</p>',
      footer:
        '<button class="btn btn-soft" data-cancel>取消</button>' +
        '<button class="btn btn-primary" data-ok>连接</button>',
      onMount: function (modal) {
        modal.querySelector('[data-cancel]').onclick = closeModal;
        modal.querySelector('[data-ok]').onclick = function () {
          var res = Sync.saveConfig(
            modal.querySelector('#cfg-url').value,
            modal.querySelector('#cfg-key').value
          );
          if (!res.ok) { toast(res.msg); return; }
          closeModal();
          updateAccountBtn();
          toast('已连接，现在可以登录了');
          openAuth();
        };
      }
    });
  }

  function openAuth(mode) {
    if (!Sync.isConfigured()) { openConnect(); return; }
    var isLogin = mode !== 'signup';
    var body =
      '<div class="field"><label>邮箱</label>' +
      '<input class="input" id="auth-email" type="email" placeholder="you@example.com" autocomplete="email" /></div>' +
      '<div class="field"><label>密码</label>' +
      '<input class="input" id="auth-pwd" type="password" placeholder="至少 6 位" autocomplete="current-password" /></div>' +
      '<p class="auth-tip" id="auth-tip" hidden></p>' +
      '<p class="help">' + (isLogin ? '还没有账号？' : '已有账号？') +
      '<button class="link-btn" id="auth-switch">' + (isLogin ? '注册一个' : '去登录') + '</button> · ' +
      '<button class="link-btn" id="auth-reconfig">重新连接 Supabase</button></p>';
    openModal({
      title: isLogin ? '登录毛迹' : '注册毛迹账号',
      subtitle: isLogin ? '同步你的毛孩子档案到云端' : '注册后档案可以跟着账号走',
      body: body,
      footer:
        '<button class="btn btn-soft" data-cancel>取消</button>' +
        '<button class="btn btn-primary" data-ok>' + (isLogin ? '登录' : '注册') + '</button>',
      onMount: function (modal) {
        modal.querySelector('[data-cancel]').onclick = closeModal;
        modal.querySelector('#auth-switch').onclick = function () { openAuth(isLogin ? 'signup' : 'login'); };
        modal.querySelector('#auth-reconfig').onclick = function () { closeModal(); openConnect(); };
        var tip = modal.querySelector('#auth-tip');
        function showTip(msg) {
          tip.textContent = msg;
          tip.hidden = false;
        }
        modal.querySelector('[data-ok]').onclick = function () {
          var email = modal.querySelector('#auth-email').value.trim();
          var pwd = modal.querySelector('#auth-pwd').value;
          if (!email || !pwd) { showTip('邮箱和密码都要填'); return; }
          tip.hidden = true;
          var btn = modal.querySelector('[data-ok]');
          btn.disabled = true;
          btn.textContent = isLogin ? '登录中…' : '注册中…';
          var p = isLogin ? Sync.signIn(email, pwd) : Sync.signUp(email, pwd);
          p.then(function (res) {
            if (isLogin) { afterAuth(); return; }
            if (res && res.needsConfirm) {
              closeModal();
              confirmDialog('去邮箱确认一下', '确认邮件已经发到 ' + email + '，点邮件里的链接激活账号，然后回来登录。（也可以在 Supabase 后台 Authentication 里关掉邮箱确认）', '好的', function () {}, function () {});
            } else {
              afterAuth();
            }
          }).catch(function (err) {
            btn.disabled = false;
            btn.textContent = isLogin ? '登录' : '注册';
            showTip(Sync.friendlyError(err));
          });
        };
      }
    });
  }

  function openSyncPanel() {
    var user = Sync.getUser();
    if (!user) { openAuth(); return; }
    var last = Sync.lastSync();
    var lastText = last && last.at ? fmtDateCompact(new Date(last.at).toISOString().slice(0, 10)) + ' ' + new Date(last.at).toTimeString().slice(0, 5) : '还没同步过';
    openModal({
      title: '账号与同步',
      subtitle: user.email || '',
      body:
        '<div class="sync-row"><span class="sync-label">上次同步</span><span class="sr-value">' + esc(lastText) + '</span></div>' +
        '<p class="help">上传会把这台设备的完整档案存到云端；恢复会用云端数据覆盖这台设备。两边都改过的话，选新的那份。</p>',
      footer:
        '<button class="btn btn-soft" data-out>退出登录</button>' +
        '<button class="btn btn-soft" data-down>从云端恢复</button>' +
        '<button class="btn btn-primary" data-up>上传备份</button>',
      onMount: function (modal) {
        modal.querySelector('[data-out]').onclick = function () {
          Sync.signOut().then(function () {
            closeModal();
            updateAccountBtn();
            toast('已退出登录');
            if (parseRoute().name === 'settings') render();
          });
        };
        modal.querySelector('[data-down]').onclick = function () {
          closeModal();
          confirmDialog('从云端恢复？', '这台设备上现在的档案会被云端备份覆盖，确定继续吗？', '覆盖恢复', doDownload);
        };
        modal.querySelector('[data-up]').onclick = function () {
          closeModal();
          doUpload();
        };
      }
    });
  }

  /* ================= 设置 ================= */

  function renderSettings() {
    var active = BGS.find(function (b) { return b.key === S.getPrefs().bg; }) || BGS[0];

    function swatchHTML(bg) {
      var on = bg.key === active.key;
      var sceneCls = bg.category === '场景' ? ' is-scene' : '';
      var iconHTML = bg.icon ? '<span class="bg-icon">' + bg.icon + '</span>' : '';
      return '<button type="button" class="bg-swatch' + sceneCls + (on ? ' active' : '') + '" data-bg-key="' + bg.key + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="bg-preview" style="--sw-bg:' + bg.preview.bg + ';--sw-surface:' + bg.preview.surface + ';--sw-accent:' + bg.preview.accent + '">' +
        iconHTML +
        '  <span class="bg-check">✓</span>' +
        '</span>' +
        '<span class="bg-name">' + esc(bg.label) + '</span>' +
        '</button>';
    }

    var solids = BGS.filter(function (b) { return b.category === '纯色'; }).map(swatchHTML).join('');
    var scenes = BGS.filter(function (b) { return b.category === '场景'; }).map(swatchHTML).join('');

    var syncConfigured = window.Sync && Sync.isConfigured();
    var syncUser = syncConfigured ? Sync.getUser() : null;
    var syncReady = syncConfigured && Sync.ready();
    var last = syncConfigured ? Sync.lastSync() : null;
    var lastText = last && last.at ? new Date(last.at).toLocaleDateString('zh-CN') + ' ' + new Date(last.at).toTimeString().slice(0, 5) : '还没同步过';

    var accountBody;
    if (!syncConfigured) {
      accountBody =
        '<button class="setting-row is-btn" data-sync-connect>' +
        '  <div class="sr-icon">☁️</div>' +
        '  <div class="sr-body"><div class="sr-title">连接 Supabase</div><div class="sr-sub">注册一个免费项目，把 Key 粘贴进来（只需一次）</div></div>' +
        '  <span class="sr-arrow">→</span>' +
        '</button>' +
        '<div class="sync-help">① supabase.com 免费注册并 New project；② 左侧 SQL Editor 里执行建表 SQL（找我要）；③ Project Settings → API 复制 URL 和 anon key；④ 点上面按钮粘贴连接。</div>';
    } else if (!syncUser) {
      accountBody =
        '<button class="setting-row is-btn" data-sync-login>' +
        '  <div class="sr-icon">👤</div>' +
        '  <div class="sr-body"><div class="sr-title">登录 / 注册</div><div class="sr-sub">登录后可以把档案备份到云端</div></div>' +
        '  <span class="sr-arrow">→</span>' +
        '</button>';
    } else {
      accountBody =
        '<div class="setting-row">' +
        '  <div class="sr-icon">✅</div>' +
        '  <div class="sr-body"><div class="sr-title">已登录</div><div class="sr-sub">' + esc(syncUser.email || '') + '</div></div>' +
        '</div>' +
        '<div class="setting-row">' +
        '  <div class="sr-icon">☁️</div>' +
        '  <div class="sr-body"><div class="sr-title">上次同步</div><div class="sr-sub">上传或恢复后自动更新</div></div>' +
        '  <div class="sr-value">' + esc(lastText) + '</div>' +
        '</div>' +
        '<button class="setting-row is-btn" data-sync-upload>' +
        '  <div class="sr-icon">⬆️</div>' +
        '  <div class="sr-body"><div class="sr-title">上传备份</div><div class="sr-sub">把这台设备的档案存到云端</div></div>' +
        '  <span class="sr-arrow">→</span>' +
        '</button>' +
        '<button class="setting-row is-btn" data-sync-download>' +
        '  <div class="sr-icon">⬇️</div>' +
        '  <div class="sr-body"><div class="sr-title">从云端恢复</div><div class="sr-sub">用云端备份覆盖这台设备</div></div>' +
        '  <span class="sr-arrow">→</span>' +
        '</button>' +
        '<button class="setting-row is-btn is-danger" data-sync-logout>' +
        '  <div class="sr-icon">🚪</div>' +
        '  <div class="sr-body"><div class="sr-title">退出登录</div><div class="sr-sub">本地数据不受影响</div></div>' +
        '</button>';
    }
    if (syncConfigured && !syncReady) {
      accountBody += '<div class="sync-help">同步组件加载失败（网络问题），本地功能不受影响，刷新页面可重试。</div>';
    }

    view.innerHTML =
      '<a class="back-link" href="#/">← 返回首页</a>' +
      '<div class="page-head"><h1>设置</h1><p>按你的习惯调整毛迹，所有变化都只留在这台设备上。</p></div>' +

      '<section class="settings-card">' +
      '  <div class="sc-head"><h2>账号与同步</h2><p>档案跟着账号走</p></div>' +
      accountBody +
      '</section>' +

      '<section class="settings-card">' +
      '  <div class="sc-head"><h2>个性化</h2><p>换一种底色，换一种心情</p></div>' +
      '  <div class="setting-row">' +
      '    <div class="sr-icon">🎨</div>' +
      '    <div class="sr-body"><div class="sr-title">背景</div><div class="sr-sub" data-bg-desc>' + esc(active.desc) + '</div></div>' +
      '    <div class="sr-value" data-bg-value>' + esc(active.label) + '</div>' +
      '  </div>' +
      '  <div class="bg-group">' +
      '    <span class="bg-group-label">纯色</span>' +
      '    <div class="bg-picker">' + solids + '</div>' +
      '  </div>' +
      '  <div class="bg-group">' +
      '    <span class="bg-group-label">场景</span>' +
      '    <div class="bg-picker">' + scenes + '</div>' +
      '  </div>' +
      '</section>' +

      '<section class="settings-card">' +
      '  <div class="sc-head"><h2>数据</h2><p>换设备前记得先导出</p></div>' +
      '  <button class="setting-row is-btn" data-backup>' +
      '    <div class="sr-icon">💾</div>' +
      '    <div class="sr-body"><div class="sr-title">备份与恢复</div><div class="sr-sub">导出 JSON 文件，或从备份找回</div></div>' +
      '    <span class="sr-arrow">→</span>' +
      '  </button>' +
      '  <button class="setting-row is-btn is-danger" data-clear>' +
      '    <div class="sr-icon">🧹</div>' +
      '    <div class="sr-body"><div class="sr-title">清空全部数据</div><div class="sr-sub">删除所有档案、回忆、AI 形象和动态</div></div>' +
      '    <span class="sr-arrow">→</span>' +
      '  </button>' +
      '</section>' +

      '<section class="settings-card">' +
      '  <div class="sc-head"><h2>关于</h2><p>毛迹 · 本地优先的回忆手账</p></div>' +
      '  <button class="setting-row is-btn" data-help>' +
      '    <div class="sr-icon">💡</div>' +
      '    <div class="sr-body"><div class="sr-title">使用帮助</div><div class="sr-sub">三步了解毛迹怎么用</div></div>' +
      '    <span class="sr-arrow">→</span>' +
      '  </button>' +
      '  <div class="setting-row">' +
      '    <div class="sr-icon">🐾</div>' +
      '    <div class="sr-body"><div class="sr-title">版本</div><div class="sr-sub">纯本地运行，无需注册</div></div>' +
      '    <div class="sr-value">1.0</div>' +
      '  </div>' +
      '  <div class="setting-row">' +
      '    <div class="sr-icon">🔒</div>' +
      '    <div class="sr-body"><div class="sr-title">隐私</div><div class="sr-sub">数据默认只留在这台设备，除非你主动开启云同步</div></div>' +
      '  </div>' +
      '</section>';

    var connectBtn = view.querySelector('[data-sync-connect]');
    if (connectBtn) connectBtn.onclick = openConnect;
    var loginBtn = view.querySelector('[data-sync-login]');
    if (loginBtn) loginBtn.onclick = function () { openAuth('login'); };
    var uploadBtn = view.querySelector('[data-sync-upload]');
    if (uploadBtn) uploadBtn.onclick = doUpload;
    var downloadBtn = view.querySelector('[data-sync-download]');
    if (downloadBtn) downloadBtn.onclick = function () {
      confirmDialog('从云端恢复？', '这台设备上现在的档案会被云端备份覆盖，确定继续吗？', '覆盖恢复', doDownload);
    };
    var logoutBtn = view.querySelector('[data-sync-logout]');
    if (logoutBtn) logoutBtn.onclick = function () {
      Sync.signOut().then(function () {
        updateAccountBtn();
        toast('已退出登录');
        render();
      });
    };

    view.querySelector('[data-backup]').onclick = openBackup;
    view.querySelector('[data-clear]').onclick = function () { clearAllData(); };
    view.querySelector('[data-help]').onclick = openHelp;

    var valueEl = view.querySelector('[data-bg-value]');
    var descEl = view.querySelector('[data-bg-desc]');

    Array.prototype.forEach.call(view.querySelectorAll('[data-bg-key]'), function (btn) {
      btn.onclick = function () {
        var preset = applyBg(btn.dataset.bgKey);
        S.updatePrefs({ bg: preset.key });
        Array.prototype.forEach.call(view.querySelectorAll('[data-bg-key]'), function (b) {
          var on = b.dataset.bgKey === preset.key;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        valueEl.textContent = preset.label;
        descEl.textContent = preset.desc;
        toast('背景已换成「' + preset.label + '」');
      };
    });
  }

  // 兼容旧版本 btn-backup 和新版本 btn-settings，避免浏览器混合缓存导致整页白屏
  var gearBtn = document.getElementById('btn-settings') || document.getElementById('btn-backup');
  if (gearBtn) {
    gearBtn.onclick = function () {
      location.hash = '#/settings';
    };
  }

  var feedBtn = document.getElementById('btn-feed');
  if (feedBtn) {
    feedBtn.onclick = function () {
      location.hash = '#/feed';
    };
  }

  var accountBtn = document.getElementById('btn-account');
  if (accountBtn) {
    accountBtn.onclick = function () {
      if (!window.Sync || !Sync.isConfigured()) { openConnect(); return; }
      if (!Sync.getUser()) { openAuth('login'); return; }
      openSyncPanel();
    };
  }
  // supabase-js 异步恢复会话，稍等片刻再刷新按钮状态
  updateAccountBtn();
  setTimeout(updateAccountBtn, 800);
  setTimeout(updateAccountBtn, 2500);

  /* ================= 路由 ================= */

  function parseRoute() {
    var hash = location.hash.replace(/^#/, '');
    var parts = hash.split('/').filter(Boolean);
    if (parts[0] === 'settings') return { name: 'settings' };
    if (parts[0] === 'feed') return { name: 'feed' };
    if (parts[0] === 'pet' && parts[1]) {
      return { name: 'pet', id: parts[1], tab: parts[2] === 'ai' ? 'ai' : 'timeline' };
    }
    return { name: 'home' };
  }

  function render() {
    var route = parseRoute();
    if (route.name === 'settings') {
      renderSettings();
    } else if (route.name === 'feed') {
      renderFeed();
    } else if (route.name === 'pet') {
      renderPet(route.id, route.tab);
    } else {
      renderHome();
    }
  }

  window.addEventListener('hashchange', render);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var box = document.querySelector('.lightbox');
    if (box) {
      box.remove();
      if (modalRoot.hidden) document.body.classList.remove('modal-open');
      return;
    }
    if (!modalRoot.hidden) closeModal();
  });

  applyBg(S.getPrefs().bg);

  try {
    render();
  } catch (err) {
    console.error('[毛迹] 渲染失败', err);
    view.innerHTML =
      '<div class="empty">' +
      '  <div class="empty-emoji">🐾</div>' +
      '  <h3>页面加载遇到问题</h3>' +
      '  <p>试试强制刷新（Ctrl+F5），或清理浏览器缓存后再打开。</p>' +
      '</div>';
  }
})();
