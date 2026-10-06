export function attachWardrobe(App) {
  let _gallery = null;
  function showGallery(items, startNum, total) {
    try {
      if (!items || !items.length) return false;
      const rows = document.querySelectorAll('.messageRow.assistantRow');
      const row = rows.length ? rows[rows.length - 1] : null;
      if (!row || row.querySelector('[data-wd-gallery]')) return false;
      const host = row.querySelector('.msgWrapper') || row;
      const strip = galleryStrip(items, startNum, total);
      if (!strip) return false;
      host.appendChild(strip);
      return true;
    } catch (e) { return false; }
  }
  function galleryStrip(items, startNum, total) {
    try {
      const base = (typeof startNum === 'number' && startNum >= 0) ? startNum : 0;
      const tot = (typeof total === 'number' && total > 0) ? total : (base + items.length);
      const d = document.createElement('div');
      d.className = 'wd-gallery';
      d.setAttribute('data-wd-gallery', '1');
      d.style.cssText = 'margin-top:10px;';
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;';
      const choose = (n) => {
        try {
          const inp = (App.UI && App.UI.cache && App.UI.cache.promptInputEl) || document.querySelector('textarea');
          if (inp) {
            inp.value = String(n);
            try { inp.focus(); } catch (e) {}
            try {
              const ev = new Event('input', { bubbles: true });
              inp.dispatchEvent(ev);
            } catch (e) {}
          }
          if (App.UI && App.UI.showToast) App.UI.showToast('Numéro ' + n + ' : envoie pour confirmer', 'info');
        } catch (e) {}
      };
      items.forEach((it, i) => {
        const n = base + i + 1;        const cell = document.createElement('div');
        cell.style.cssText = 'position:relative;border:1px solid #3f3f46;border-radius:10px;overflow:hidden;background:#000;cursor:pointer;height:max-content;';
        cell.title = (it.name || '') + ' — cliquer pour agrandir, pastille rouge pour choisir le ' + n;
        if (it.img) {
          const im = document.createElement('img');
          im.loading = 'lazy';
          im.referrerPolicy = 'no-referrer';
          im.src = it.img;
          im.alt = it.name || '';
          im.style.cssText = 'max-width:100%;max-height:110px;object-fit:contain;object-position:center;display:block;background:#000;';
          const wrap = document.createElement('div');
          wrap.style.cssText = 'width:100%;height:110px;overflow:hidden;background:#000;display:flex;align-items:center;justify-content:center;';
          wrap.appendChild(im);
          cell.appendChild(wrap);
        } else {
          const ph = document.createElement('div');
          ph.style.cssText = 'height:110px;display:flex;align-items:center;justify-content:center;color:#52525b;font-size:11px;padding:6px;text-align:center;';
          ph.textContent = it.name || 'sans photo';
          cell.appendChild(ph);
        }
        const badge = document.createElement('span');
        badge.textContent = n;
        badge.style.cssText = 'position:absolute;top:4px;left:4px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#e11d48;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;';
        badge.title = 'Choisir le numéro ' + n;
        badge.onclick = (e) => {
          try { if (e && e.stopPropagation) e.stopPropagation(); } catch (err) {}
          choose(n);
        };
        cell.appendChild(badge);
        const chooseBtn = document.createElement('button');
        chooseBtn.textContent = 'Choisir';
        chooseBtn.style.cssText = 'width:100%;border:none;background:#e11d48;color:#fff;font-size:12px;font-weight:700;padding:7px 0;cursor:pointer;';
        chooseBtn.onclick = (e) => {
          try { if (e && e.stopPropagation) e.stopPropagation(); } catch (err) {}
          choose(n);
        };
        cell.appendChild(chooseBtn);
        cell.onclick = () => {
          try { if (window.enlargeImage && it.img) window.enlargeImage(it.img); } catch (e) {}
        };
        grid.appendChild(cell);
      });
      d.appendChild(grid);
      const last = base + items.length;
      const hint = document.createElement('div');
      hint.style.cssText = 'margin-top:6px;font-size:12px;color:#a1a1aa;';
      hint.textContent = 'n°' + (base + 1) + '–' + last + ' sur ' + tot + ' — touche une photo pour l’agrandir, la pastille rouge pour choisir' + (last < tot ? ' — écris « suite » pour voir la suite' : ' — fin du catalogue');
      d.appendChild(hint);
      return d;
    } catch (e) { return null; }
  }
  function hookGallery() {
    return;
  }
  const LS = 'sofia-wardrobe';
  const W = {
    cats: [],
    outfit: null,
    proposal: null,
    others: {},
    open: false
  };
  try {
    const raw = localStorage.getItem(LS);
    if (raw) { const o = JSON.parse(raw); W.outfit = o.her || null; W.his = o.his || null; W.decor = o.decor || null; W.proposal = o.proposal || null; W.others = o.others || {}; }
  } catch (e) {}
  function save() {
    try { localStorage.setItem(LS, JSON.stringify({ her: W.outfit, his: W.his || null, decor: W.decor || null, proposal: W.proposal || null, others: W.others || {} })); } catch (e) {}
  }
  const KEEP = /(lingerie|soutien|culotte|string|boxer|slip|cale[çc]on|costume|chemise|pantalon|homme|bas|collant|nuit|pyjama|maillot|corset|gu[êe]pi[eè]re|jarretelle|latex|catsuit|combinaison|v[êe]tement|ensemble|nuisette|babydoll|bikini|dentelle|sexy|mobilier|meuble|d[ée]cor|canap[ée]|fauteuil|tabouret|balan[çc]oire|potence|cabine|machine|matelas|pouf|chaise\s+sm|si[èe]ge)/i;
  function isAdult() {
    try { if (App && App.Core && App.Core.sexoAllowed) return !!App.Core.sexoAllowed(); } catch (e) {}
    return false;
  }
  const SURFACE = { 'vetements-femme': 1, 'rg-vetements': 1, 'gl-pull': 1 };
  async function load() {
    const adult = isAdult();
    if (W._adult !== adult) { W.cats = []; W._adult = adult; }
    if (W.cats.length) return W.cats;
    const files = adult ? ['src/data/vetements-catalog.json', 'src/data/bdsm-catalog.json'] : ['src/data/vetements-catalog.json'];
    for (const f of files) {
      let c = null;
      try { c = await fetch(f).then(r => r.json()); } catch (e) { continue; }
      const cats = (c && c.categories) || {};
      for (const id of Object.keys(cats)) {
        if (!adult && !SURFACE[id]) continue;
        const cat = cats[id] || {};
        const items = Array.isArray(cat.items) ? cat.items.filter(it => it && it.name) : [];
        if (!items.length) continue;
        const label = cat.label || id;
        if (!KEEP.test(label + ' ' + id)) continue;
        const kind = /(mobilier|meuble|d[ée]cor|machine|canap[ée]|fauteuil|cabine|potence)/i.test(label + ' ' + id) ? 'decor' : 'wear';
        W.cats.push({ id: f + '#' + id, label: label, shop: cat.shop || '', kind: kind, items: items });
      }
    }
    return W.cats;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  let _decEl = null;
  function dec(s) {
    try {
      _decEl = _decEl || document.createElement('textarea');
      _decEl.innerHTML = String(s == null ? '' : s);
      return _decEl.value;
    } catch (e) { return String(s == null ? '' : s); }
  }
  function colorDot(it) {
    const cols = Array.isArray(it.colors) ? it.colors : [];
    if (!cols.length) return '';
    const c = String(cols[0]);
    if (/^#[0-9a-f]{3,8}$/i.test(c)) return '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + c + ';border:1px solid #52525b;vertical-align:-1px;"></span> ';
    return '<span style="font-size:11px;color:#a1a1aa;">' + esc(c) + '</span> ';
  }
  function card(it, idx, num) {
    const sel = W.outfit && W.outfit.pid === it.pid;
    const nm = dec(it.name), br = dec(it.brand || ''), ds = dec(it.desc || '').replace(/\s+/g, ' ').trim().slice(0, 110);
    const n = (typeof num === 'number' && num > 0) ? num : (idx + 1);
    return '<div class="wd-card" data-i="' + idx + '" style="position:relative;background:#18181b;border:1px solid ' + (sel ? '#e11d48' : '#27272a') + ';border-radius:10px;overflow:hidden;cursor:pointer;height:max-content;">' +
      '<span style="position:absolute;top:6px;left:6px;z-index:2;min-width:24px;height:24px;padding:0 7px;border-radius:12px;background:#e11d48;color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;">' + n + '</span>' +
      (it.img ? '<div style="width:100%;height:220px;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;"><img loading="lazy" referrerpolicy="no-referrer" src="' + esc(it.img) + '" alt="" data-full="' + esc(it.img) + '" style="max-width:100%;max-height:100%;object-fit:contain;object-position:center;background:#000;display:block;cursor:zoom-in;" title="Voir en grand"></div>' : '<div style="height:220px;display:flex;align-items:center;justify-content:center;color:#52525b;font-size:12px;background:#000;">sans photo</div>') +
      '<div style="padding:8px 10px;">' +
      '<div style="font-size:12.5px;color:#e4e4e7;line-height:1.3;"><b style="color:#fda4af;">n°' + n + '</b> ' + esc(nm) + '</div>' +
      '<div style="margin-top:4px;font-size:12px;color:#a1a1aa;">' + colorDot(it) + esc(br) + '</div>' +
      (ds ? '<div style="margin-top:4px;font-size:11.5px;color:#71717a;line-height:1.35;">' + esc(ds) + (dec(it.desc || '').length > 110 ? '…' : '') + '</div>' : '') +
      '</div></div>';
  }
  function collectAll() {
    const all = [];
    let g = 0;
    for (const c of W.cats) for (const it of c.items) { g++; all.push({ cat: c.label, kind: c.kind || 'wear', it: it, g: g }); }
    return all;
  }
  function render() {
    const grid = document.getElementById('wdGrid');
    if (!grid) return;
    const q = (document.getElementById('wdSearch').value || '').toLowerCase().trim();
    const catId = document.getElementById('wdCat').value;
    let all = collectAll();
    if (catId) all = all.filter(x => x.cat === catId);
    if (q) {
      const words = q.split(/\s+/);
      all = all.filter(x => {
        const hay = ((x.it.name || '') + ' ' + (x.it.brand || '') + ' ' + ((x.it.colors || []).join(' ')) + ' ' + (x.it.desc || '') + ' ' + x.cat).toLowerCase();
        return words.every(w => hay.indexOf(w) !== -1);
      });
    }
    all = all.slice(0, 120);
    grid.innerHTML = all.map((x, i) => card(x.it, i, x.g)).join('') ||
      '<div style="color:#71717a;font-size:13px;padding:20px;">Rien trouvé. Essaie « rouge », « dentelle », « corset »…</div>';
    grid.querySelectorAll('.wd-card').forEach(el => {
      el.onclick = () => {
        const found = all[+el.dataset.i];
        if (found.kind === 'decor') selectDecor(found.it);
        else select(found.it);
      };
      const im = el.querySelector('img[data-full]');
      if (im) im.onclick = (e) => { e.stopPropagation(); try { window.open(im.dataset.full, '_blank'); } catch (err) {} };
    });
    const n = document.getElementById('wdCount');
    if (n) n.textContent = all.length ? ('n°' + all[0].g + '–' + all[all.length - 1].g + ' — ' + all.length + ' modèle(s), dis le numéro pour choisir') : '0 modèle';
  }
  function selectDecor(it) {
    W.decor = { pid: it.pid, name: dec(it.name), brand: dec(it.brand || ''), shop: it.shop || '', colors: it.colors || [], img: it.img || '', url: it.url || '', desc: dec(it.desc || '').replace(/\s+/g, ' ').trim().slice(0, 200) };
    save();
    render();
    refreshBar();
    try {
      const t = (App.UI && App.UI.showToast) ? App.UI.showToast.bind(App.UI) : null;
      if (t) t('Décor placé : ' + W.decor.name, 'success');
    } catch (e) {}
  }
  function refreshBar() {
    const bar = document.getElementById('wdNow');
    if (!bar) return;
    let h = '';
    if (W.outfit) h += 'Elle portera : <b style="color:#fda4af;">' + esc(W.outfit.name) + '</b>' + (W.outfit.url ? ' <a href="' + esc(W.outfit.url) + '" target="_blank" style="font-size:12px;color:#fda4af;">(acheter' + (W.outfit.shop ? ' · ' + esc(W.outfit.shop) : '') + ')</a>' : '');
    if (W.his) h += (h ? '<br>' : '') + 'Il portera : <b style="color:#93c5fd;">' + esc(W.his.name) + '</b>';
    if (W.decor) h += (h ? '<br>' : '') + 'Dans la pièce : <b style="color:#fcd34d;">' + esc(W.decor.name) + '</b>';
    bar.innerHTML = h || 'Clique un modèle pour l\u2019utiliser : tenues sur eux, meubles dans la pièce.';
  }
  function select(it) {
    W.outfit = { pid: it.pid, name: dec(it.name), brand: dec(it.brand || ''), price: it.price || '', shop: it.shop || '', colors: it.colors || [], img: it.img || '', url: it.url || '', desc: dec(it.desc || '').replace(/\s+/g, ' ').trim().slice(0, 200) };
    W.proposal = null;
    save();
    render();
    refreshBar();
    try {
      const t = (App.UI && App.UI.showToast) ? App.UI.showToast.bind(App.UI) : null;
      if (t) t('Tenue choisie : ' + W.outfit.name, 'success');
    } catch (e) {}
  }
  function openModal() {
    if (document.getElementById('wdModal')) {
      const m = document.getElementById('wdModal');
      m.hidden = false;
      refreshBar();
      render();
      return;
    }
    const d = document.createElement('div');
    d.id = 'wdModal';
    d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;padding:16px;';
    d.onclick = (e) => { if (e.target === d) d.hidden = true; };
    d.innerHTML =
      '<div style="background:#09090b;border:1px solid #27272a;border-radius:14px;max-width:860px;width:100%;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;">' +
      '<div style="padding:14px 16px;border-bottom:1px solid #27272a;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
      '<b id="wdTitle" style="color:#e4e4e7;font-size:15px;">Catalogue</b>' +
      '<input id="wdSearch" placeholder="rouge, dentelle, corset…" style="flex:1;min-width:140px;background:#18181b;border:1px solid #3f3f46;color:#e4e4e7;border-radius:8px;padding:8px 10px;font-size:13px;">' +
      '<select id="wdCat" style="background:#18181b;border:1px solid #3f3f46;color:#e4e4e7;border-radius:8px;padding:8px;font-size:13px;max-width:220px;"></select>' +
      '<button id="wdClose" style="background:#27272a;border:none;color:#e4e4e7;border-radius:8px;padding:8px 12px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div id="wdNow" style="padding:8px 16px;font-size:13px;color:#a1a1aa;border-bottom:1px solid #27272a;"></div>' +
      '<div style="padding:6px 16px;font-size:12px;color:#71717a;"><span id="wdCount"></span></div>' +
      '<div id="wdGrid" style="padding:6px 16px 16px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;"></div>' +
      '<div style="padding:10px 16px;border-top:1px solid #27272a;display:flex;gap:10px;">' +
      '<button id="wdNude" style="background:transparent;border:1px solid #52525b;color:#a1a1aa;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:13px;">Retirer (nue)</button>' +
      '<span style="font-size:12px;color:#52525b;align-self:center;">La tenue choisie habille la scène et les images suivantes.</span>' +
      '</div></div>';
    document.body.appendChild(d);
    document.getElementById('wdClose').onclick = () => { d.hidden = true; };
    document.getElementById('wdSearch').oninput = render;
    document.getElementById('wdCat').onchange = render;
    document.getElementById('wdNude').onclick = () => {
      W.outfit = null; save(); render();
      document.getElementById('wdNow').textContent = 'Elle est nue.';
    };
    load().then(() => {
      const t = document.getElementById('wdTitle');
      if (t) t.textContent = isAdult() ? 'Catalogue lingerie' : 'Catalogue vêtements';
      const sel = document.getElementById('wdCat');
      if (sel) sel.innerHTML = '<option value="">Toutes rayons</option>' + W.cats.map(c => '<option value="' + esc(c.label) + '">' + esc(c.label) + ' (' + c.items.length + ')</option>').join('');
      if (W.outfit && document.getElementById('wdNow')) document.getElementById('wdNow').innerHTML = 'Elle portera : <b style="color:#fda4af;">' + esc(W.outfit.name) + '</b>';
      render();
    });
    render();
  }
  App.Wardrobe = {
    open: openModal,
    current: () => W.outfit,
    his: () => W.his || null,
    others: () => W.others || {},
    decor: () => W.decor || null,
    clear: () => { W.outfit = null; save(); },
    proposal: () => W.proposal || null,
    propose: (item) => {
      if (!item) return false;
      W.proposal = { pid: item.pid, name: dec(item.name), brand: dec(item.brand || ''), shop: item.shop || '', colors: item.colors || [], img: item.img || '', url: item.url || '', desc: dec(item.desc || '').replace(/\s+/g, ' ').trim().slice(0, 200) };
      save();
      return true;
    },
    clearHis: () => { W.his = null; save(); },
    clearDecor: () => { W.decor = null; save(); },
    arm: (items, startNum, total) => {
      try { return showGallery(items, startNum, total); } catch (e) { return false; }
    },
    applyDecor: (item) => {
      if (!item) return false;
      W.decor = { pid: item.pid, name: dec(item.name), brand: dec(item.brand || ''), shop: item.shop || '', colors: item.colors || [], img: item.img || '', url: item.url || '', desc: dec(item.desc || '').replace(/\s+/g, ' ').trim().slice(0, 200) };
      save();
      return true;
    },
    apply: (item, who) => {
      if (!item) return false;
      const o = { pid: item.pid, name: dec(item.name), brand: dec(item.brand || ''), shop: item.shop || '', colors: item.colors || [], img: item.img || '', url: item.url || '', desc: dec(item.desc || '').replace(/\s+/g, ' ').trim().slice(0, 200) };
      if (who === 'him') W.his = o;
      else if (typeof who === 'string' && who.indexOf('other:') === 0 && who.length > 6) { W.others = W.others || {}; W.others[who.slice(6)] = o; }
      else W.outfit = o;
      if (who !== 'him' && !(typeof who === 'string' && who.indexOf('other:') === 0)) W.proposal = null;
      save();
      return true;
    },
    pick: (query, n) => {
      try {
        const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const words = norm(query).split(/[^a-z]+/i).map(w => (w.length > 3 ? w.replace(/[sx]$/, '') : w)).filter(w => w.length > 2 && !/^(une|des|les|pour|avec|dans|elle|lui|moi|toi|nous|vous|ils|elles|est|sont|pas|plus|tout|tous|toute|toutes|avec|sans|peau|porter|mettre|veux|veut|peux|peut|que|qui|donne|montre|remontre|quel|quelle|choisir|habiller|robe|vetement|vetements|lingerie|tenue|tenues|ensemble|ensembles|catalogue)$/.test(w));
        let all = collectAll();
        if (words.length) {
          const scored = [];
          for (const x of all) {
            const hay = norm((x.it.name || '') + ' ' + (x.it.brand || '') + ' ' + ((x.it.colors || []).join(' ')) + ' ' + (x.it.desc || ''));
            let c = 0;
            for (const w of words) if (hay.indexOf(w) !== -1) c++;
            if (c > 0) scored.push({ x: x, c: c });
          }
          scored.sort((a, b) => b.c - a.c);
          if (scored.length) all = scored.map(s => s.x);
        }
        const out = all.slice(0, Math.max(1, Math.min(40, n || 10))).map(x => ({ kind: x.kind, cat: x.cat, pid: x.it.pid, name: dec(x.it.name), brand: dec(x.it.brand || ''), shop: x.it.shop || '', colors: x.it.colors || [], img: x.it.img || '', url: x.it.url || '', desc: dec(x.it.desc || '').replace(/\s+/g, ' ').trim().slice(0, 160) }));
        return out;
      } catch (e) { return []; }
    },
    promptLine: () => {
      try {
        let s = '';
        if (W.outfit) {
          const o = W.outfit;
          s += '[WARDROBE - WHAT SHE WEARS NOW] She wears exactly this real outfit and nothing else (unless the scene itself undresses her later): ' +
            o.name + (o.brand ? ' (' + o.brand + ')' : '') +
            (o.colors && o.colors.length ? ', colour ' + o.colors.join('/') : '') +
            (o.desc ? '. ' + o.desc : '') +
            (o.price ? ' [listed at ' + o.price + (o.shop ? ' on ' + o.shop : '') + ']' : '') +
            '. Name it naturally when relevant; every image prompt of her draws exactly this outfit on her body. Quote its shop and price only if he asks where to buy it - never advertise unprompted.';
        }
        if (W.his) {
          const h = W.his;
          if (s) s += '\n';
          s += '[WARDROBE - WHAT HE WEARS NOW] He wears exactly this real outfit and nothing else (unless the scene itself undresses him later): ' +
            h.name + (h.brand ? ' (' + h.brand + ')' : '') +
            (h.colors && h.colors.length ? ', colour ' + h.colors.join('/') : '') +
            (h.desc ? '. ' + h.desc : '') +
            '. This overrides any older clothing: never mention previous garments again. Every image prompt of him draws exactly this outfit on his body.';
        }
        try {
          const oo = W.others || {};
          for (const nm of Object.keys(oo)) {
            const x = oo[nm];
            if (!x) continue;
            if (s) s += '\n';
            s += '[WARDROBE - ' + nm.toUpperCase() + ' WEARS NOW] ' + nm + ' wears exactly this real outfit and nothing else (unless the scene itself undresses them later): ' +
              x.name + (x.brand ? ' (' + x.brand + ')' : '') +
              (x.colors && x.colors.length ? ', colour ' + x.colors.join('/') : '') +
              (x.desc ? '. ' + x.desc : '') +
              '. Every image prompt of the scene draws exactly this outfit on ' + nm + '.';
          }
        } catch (e) {}
        if (W.decor) {
          const d = W.decor;
          if (s) s += '\n';
          s += '[SCENE DECOR - WHAT THE ROOM CONTAINS] The room of this scene contains exactly this real furniture piece, placed where it belongs and used as staged: ' +
            d.name + (d.brand ? ' (' + d.brand + ')' : '') +
            (d.colors && d.colors.length ? ', colour ' + d.colors.join('/') : '') +
            (d.desc ? '. ' + d.desc : '') +
            '. It stays there for the whole scene unless he moves it. Every image prompt of the room draws exactly this piece in it.';
        }
        try {
          const p = W.proposal;
          if (p && (!W.outfit || p.pid !== W.outfit.pid)) {
            if (s) s += '\n';
            s += '[WARDROBE PROPOSAL - NOT WORN YET] He proposed this piece for her but she has NOT accepted it yet: ' +
              p.name + (p.brand ? ' (' + p.brand + ')' : '') +
              (p.colors && p.colors.length ? ', colour ' + p.colors.join('/') : '') +
              (p.desc ? '. ' + p.desc : '') +
              '. Draw it on her ONLY if the scene text above says she accepted it or was forced to wear it; otherwise draw what the scene text says she wears.';
          }
        } catch (e) {}
        return s;
      } catch (e) { return ''; }
    },
    hisLine: () => {
      try {
        if (!W.his) return '';
        const h = W.his;
        return '[WARDROBE - WHAT HE WEARS NOW] He wears exactly this real outfit: ' + h.name + (h.brand ? ' (' + h.brand + ')' : '') + (h.colors && h.colors.length ? ', colour ' + h.colors.join('/') : '') + (h.desc ? '. ' + h.desc : '');
      } catch (e) { return ''; }
    },
    otherLine: () => {
      try {
        const oo = W.others || {};
        const L = [];
        for (const nm of Object.keys(oo)) {
          const x = oo[nm];
          if (x) L.push(nm + ' wears: ' + x.name + (x.brand ? ' (' + x.brand + ')' : ''));
        }
        return L.join(' | ');
      } catch (e) { return ''; }
    }
  };
  function addBtn() {
    try {
      if (document.getElementById('wardrobeBtn')) return true;
      const anchor = document.getElementById('attachBtn');
      if (!anchor || !anchor.parentNode) return false;
      const b = document.createElement('button');
      b.id = 'wardrobeBtn';
      b.title = 'Catalogue lingerie — l\u2019habiller';
      b.setAttribute('aria-label', 'Catalogue lingerie');
      b.style.cssText = 'background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:5px;min-height:34px;min-width:34px;display:flex;align-items:center;justify-content:center;';
      b.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg>';
      b.onclick = (e) => { e.stopPropagation(); openModal(); };
      anchor.parentNode.insertBefore(b, anchor.nextSibling);
      return true;
    } catch (e) { return false; }
  }
  if (!addBtn()) {
    let tries = 0;
    const t = setInterval(() => { if (addBtn() || ++tries > 20) clearInterval(t); }, 500);
  }
  try { load().catch(() => {}); } catch (e) {}
}
