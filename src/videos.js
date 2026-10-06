export function attachVideos(App) {
  const PEERTUBE_BASE = "https://peer.tube";
  const YT_EMBED = "https://www.youtube-nocookie.com/embed/";
  const VIMEO_EMBED = "https://player.vimeo.com/video/";
  const VIMEO_JWT_TTL = 20 * 60 * 1000;
  const cache = { vimeoJwt: "", vimeoJwtAt: 0 };
  function fx() {
    try {
      const r = globalThis.root;
      if (r && typeof r.superFetch === "function") return r.superFetch;
    } catch (e) {}
    return fetch;
  }
  async function getText(url, opts) {
    const r = await fx()(url, opts);
    return await r.text();
  }
  function unesc(s) {
    return String(s == null ? "" : s)
      .replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\"/g, "\"")
      .replace(/\\\//g, "/");
  }
  function fmtDur(sec) {
    sec = Math.round(Number(sec) || 0);
    if (!sec) return "";
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const p = (n) => String(n).padStart(2, "0");
    return h ? h + ":" + p(m) + ":" + p(s) : m + ":" + p(s);
  }
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
  }
  async function searchYouTube(q, count) {
    count = Math.min(Math.max(Number(count) || 6, 1), 12);
    const html = await getText("https://www.youtube.com/results?search_query=" + encodeURIComponent(q) + "&hl=fr", { timeoutMs: 25000 });
    const t = unesc(html).replace(/\\n/g, " ");
    const out = [];
    const seen = new Set();
    const blocks = t.split('videoWithContextRenderer":{"headline"').slice(1);
    for (const b of blocks) {
      if (out.length >= count) break;
      const tm = b.match(/"runs":\s*\[{"text":"((?:[^"\\]|\\.){2,160}?)"\}\]/);
      const im = b.match(/"videoId":"([A-Za-z0-9_-]{11})"/);
      if (!im || seen.has(im[1])) continue;
      seen.add(im[1]);
      let title = tm ? tm[1].replace(/\\(.)/g, "$1") : im[1];
      let channel = "";
      const cm = b.match(/"shortBylineText":\{"runs":\[{"text":"((?:[^"\\]|\\.){1,80}?)"\}/);
      if (cm) channel = cm[1].replace(/\\(.)/g, "$1");
      let dur = "";
      const dm = b.match(/"lengthText":\{"runs":\[{"text":"([^"]{1,16})"\}/);
      if (dm) dur = dm[1];
      out.push({ source: "youtube", id: im[1], title: title, channel: channel, duration: dur, thumb: "https://i.ytimg.com/vi/" + im[1] + "/hqdefault.jpg", url: "https://www.youtube.com/watch?v=" + im[1], embed: YT_EMBED + im[1] });
    }
    if (out.length < count) {
      const shorts = t.split('shortsLockupViewModel":{"entityId":"shorts-shelf-item-').slice(1);
      for (const b of shorts) {
        if (out.length >= count) break;
        const im = b.match(/^([A-Za-z0-9_-]{11})/);
        if (!im || seen.has(im[1])) continue;
        const am = b.match(/"accessibilityText":"((?:[^"\\]|\\.){2,200}?)"\}/);
        let title = am ? am[1].replace(/\\(.)/g, "$1").split(/, \d[\d\s\u202f\u00a0]*vues/)[0] : im[1];
        seen.add(im[1]);
        out.push({ source: "youtube", id: im[1], title: title + " #short", channel: "", duration: "", thumb: "https://i.ytimg.com/vi/" + im[1] + "/hqdefault.jpg", url: "https://www.youtube.com/shorts/" + im[1], embed: YT_EMBED + im[1] });
      }
    }
    return out;
  }
  async function searchPeerTube(q, count) {
    count = Math.min(Math.max(Number(count) || 6, 1), 12);
    const txt = await getText(PEERTUBE_BASE + "/api/v1/search/videos?search=" + encodeURIComponent(q) + "&count=" + count + "&nsfw=false&sort=-publishedAt", { timeoutMs: 25000 });
    const o = JSON.parse(txt);
    return (o.data || []).slice(0, count).map((v) => ({
      source: "peertube",
      id: v.uuid || v.shortUUID,
      title: v.name || "",
      channel: (v.channel && v.channel.displayName) || (v.account && v.account.displayName) || "",
      duration: fmtDur(v.duration),
      views: Number(v.views) || 0,
      thumb: v.thumbnailUrl || "",
      url: v.url || (PEERTUBE_BASE + "/videos/watch/" + (v.uuid || "")),
      embed: v.embedUrl || (PEERTUBE_BASE + "/videos/embed/" + (v.shortUUID || v.uuid || ""))
    }));
  }
  async function vimeoToken() {
    if (cache.vimeoJwt && Date.now() - cache.vimeoJwtAt < VIMEO_JWT_TTL) return cache.vimeoJwt;
    const html = await getText("https://vimeo.com/search?q=" + encodeURIComponent("a"), { timeoutMs: 20000 });
    const m = html.match(/"jwt":"([^"]+)"/);
    if (!m) throw new Error("vimeo token introuvable");
    cache.vimeoJwt = m[1];
    cache.vimeoJwtAt = Date.now();
    return cache.vimeoJwt;
  }
  async function searchVimeo(q, count) {
    count = Math.min(Math.max(Number(count) || 6, 1), 12);
    const jwt = await vimeoToken();
    const txt = await getText("https://api.vimeo.com/videos?query=" + encodeURIComponent(q) + "&per_page=" + count + "&fields=name,link,duration,pictures,user", { timeoutMs: 25000, headers: { Authorization: "jwt " + jwt, Accept: "application/json" } });
    const o = JSON.parse(txt);
    return (o.data || []).slice(0, count).map((v) => {
      const m = String(v.link || "").match(/(\d{5,})/);
      const id = m ? m[1] : "";
      let thumb = "";
      try {
        const sizes = (v.pictures && v.pictures.sizes) || [];
        let best = null;
        for (const s of sizes) if (!best || (s.width || 0) > (best.width || 0)) best = s;
        thumb = best ? best.link : "";
      } catch (e) {}
      return { source: "vimeo", id: id, title: v.name || "", channel: (v.user && v.user.name) || "", duration: fmtDur(v.duration), thumb: thumb, url: v.link || "", embed: id ? VIMEO_EMBED + id : "" };
    }).filter((v) => v.id);
  }
  function juniorManual() {
    try { return localStorage.getItem("sofia_qwant_junior") === "1"; } catch (e) { return false; }
  }
  function juniorAuto() {
    try { if (App.Parental && typeof App.Parental.effectiveLocked === "function" && App.Parental.effectiveLocked()) return true; } catch (e) {}
    try { if (App.Age && typeof App.Age.age === "function" && App.Age.age() > 0 && App.Age.age() < 18) return true; } catch (e) {}
    return false;
  }
  function isJunior() { return juniorManual() || juniorAuto(); }
  function setJunior(on) {
    try { localStorage.setItem("sofia_qwant_junior", on ? "1" : "0"); } catch (e) {}
    return isJunior();
  }
  async function searchQwant(q, count) {
    count = Math.min(Math.max(Number(count) || 6, 1), 12);
    const safe = isJunior() ? 1 : 1;
    const url = "https://api.qwant.com/v3/search/videos?t=videos&q=" + encodeURIComponent(q) + "&count=" + count + "&safesearch=" + safe + "&locale=fr_FR&uiv=4";
    const txt = await getText(url, { timeoutMs: 25000 });
    const o = JSON.parse(txt);
    const items = (((o || {}).data || {}).result || {}).items || [];
    return items.slice(0, count).map((it) => {
      const title = it.title || "";
      const link = it.url || "";
      const thumb = it.thumbnail || "";
      let dur = it.duration;
      if (typeof dur === "number" && dur > 0) dur = fmtDur(dur);
      else dur = "";
      const channel = it.channel || it.source || "";
      let embed = it.media || link;
      try { const parsed = link ? parseUrl(link) : null; if (parsed && parsed.embed) embed = parsed.embed; } catch (e) {}
      return { source: "qwant", id: link, title: title, channel: channel, duration: dur, thumb: thumb, url: link, embed: embed };
    }).filter((v) => v.url);
  }
  async function searchAll(q, count) {
    count = Math.min(Math.max(Number(count) || 4, 1), 8);
    const jobs = [
      searchYouTube(q, count).then((v) => ({ k: "youtube", v: v })).catch(() => ({ k: "youtube", v: [] })),
      searchPeerTube(q, count).then((v) => ({ k: "peertube", v: v })).catch(() => ({ k: "peertube", v: [] })),
      searchVimeo(q, count).then((v) => ({ k: "vimeo", v: v })).catch(() => ({ k: "vimeo", v: [] })),
      searchQwant(q, count).then((v) => ({ k: "qwant", v: v })).catch(() => ({ k: "qwant", v: [] }))
    ];
    const res = await Promise.all(jobs);
    const out = { youtube: [], peertube: [], vimeo: [], qwant: [] };
    for (const r of res) out[r.k] = r.v;
    return out;
  }
  function srcLabel(s) {
    return s === "youtube" ? "YouTube" : s === "peertube" ? "PeerTube" : s === "vimeo" ? "Vimeo" : "Qwant";
  }
  function playCard(v) {
    const card = document.createElement("div");
    card.className = "svideo-card";
    card.dataset.svideo = "1";
    const thumb = document.createElement("div");
    thumb.className = "svideo-thumb";
    if (v.thumb) {
      const img = document.createElement("img");
      img.src = v.thumb;
      img.alt = "";
      img.loading = "lazy";
      thumb.appendChild(img);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "svideo-play";
    btn.setAttribute("aria-label", "Lire la vidéo");
    btn.textContent = "▶";
    thumb.appendChild(btn);
    if (v.duration) {
      const d = document.createElement("span");
      d.className = "svideo-dur";
      d.textContent = v.duration;
      thumb.appendChild(d);
    }
    const meta = document.createElement("div");
    meta.className = "svideo-meta";
    const badge = document.createElement("span");
    badge.className = "svideo-badge svideo-" + v.source;
    badge.textContent = srcLabel(v.source);
    const title = document.createElement("a");
    title.href = v.url;
    title.target = "_blank";
    title.rel = "noopener";
    title.className = "svideo-title";
    title.textContent = v.title || v.url;
    meta.appendChild(badge);
    meta.appendChild(title);
    if (v.channel) {
      const ch = document.createElement("div");
      ch.className = "svideo-chan";
      ch.textContent = v.channel;
      meta.appendChild(ch);
    }
    card.appendChild(thumb);
    card.appendChild(meta);
    const open = () => {
      if (card.dataset.playing === "1") return;
      card.dataset.playing = "1";
      const wrap = document.createElement("div");
      wrap.className = "svideo-player";
      const fr = document.createElement("iframe");
      fr.src = v.embed;
      fr.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      fr.setAttribute("allowfullscreen", "");
      fr.setAttribute("frameborder", "0");
      fr.loading = "lazy";
      wrap.appendChild(fr);
      thumb.replaceWith(wrap);
    };
    btn.addEventListener("click", (e) => { e.stopPropagation(); open(); });
    thumb.addEventListener("click", open);
    return card;
  }
  function postAssistant(labelHtml, videos) {
    const list = document.querySelector("#messageListEl");
    if (!list) return null;
    const row = document.createElement("div");
    row.className = "messageRow assistantRow";
    const wrap = document.createElement("div");
    wrap.className = "msgWrapper";
    const body = document.createElement("div");
    body.className = "messageContent markdown-content";
    if (labelHtml) {
      const p = document.createElement("div");
      p.className = "svideo-intro";
      p.textContent = labelHtml;
      body.appendChild(p);
    }
    for (const v of videos) body.appendChild(playCard(v));
    wrap.appendChild(body);
    row.appendChild(wrap);
    list.appendChild(row);
    const sc = document.querySelector("#chatHistoryCtn");
    if (sc) sc.scrollTop = sc.scrollHeight;
    return row;
  }
  function parseUrl(u) {
    let m = null;
    try {
      const x = new URL(u, location.href);
      const host = x.hostname.replace(/^www\./, "");
      if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
        const id = x.searchParams.get("v");
        if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { source: "youtube", id: id, url: "https://www.youtube.com/watch?v=" + id, embed: YT_EMBED + id };
        m = x.pathname.match(/^\/(shorts|live|embed)\/([A-Za-z0-9_-]{11})/);
        if (m) return { source: "youtube", id: m[2], url: "https://www.youtube.com/watch?v=" + m[2], embed: YT_EMBED + m[2] };
      } else if (host === "youtu.be") {
        m = x.pathname.match(/^\/([A-Za-z0-9_-]{11})/);
        if (m) return { source: "youtube", id: m[1], url: "https://www.youtube.com/watch?v=" + m[1], embed: YT_EMBED + m[1] };
      } else if (host === "vimeo.com" || host === "www.vimeo.com") {
        m = x.pathname.match(/\/(\d{5,})/);
        if (m) return { source: "vimeo", id: m[1], title: "", channel: "", duration: "", thumb: "", url: "https://vimeo.com/" + m[1], embed: VIMEO_EMBED + m[1] };
      } else if (host === "player.vimeo.com") {
        m = x.pathname.match(/\/video\/(\d{5,})/);
        if (m) return { source: "vimeo", id: m[1], title: "", channel: "", duration: "", thumb: "", url: "https://vimeo.com/" + m[1], embed: VIMEO_EMBED + m[1] };
      }
      m = x.pathname.match(/\/videos\/(?:watch|embed)\/([0-9a-fA-F-]{8,40}|[A-Za-z0-9]{8,22})/);
      if (m) {
        const id = m[1];
        return { source: "peertube", id: id, title: "", channel: "", duration: "", thumb: "", url: x.origin + "/videos/watch/" + id, embed: x.origin + "/videos/embed/" + id };
      }
      m = x.pathname.match(/^\/w\/([A-Za-z0-9]{8,22})/);
      if (m) return { source: "peertube", id: m[1], title: "", channel: "", duration: "", thumb: "", url: x.origin + "/videos/watch/" + m[1], embed: x.origin + "/videos/embed/" + m[1] };
    } catch (e) {}
    return null;
  }
  function enrichScope(scope) {
    const links = scope.querySelectorAll ? scope.querySelectorAll(".messageContent a[href]") : [];
    for (const a of links) {
      try {
        if (a.dataset.svideoDone === "1") continue;
        const v = parseUrl(a.getAttribute("href"));
        if (!v) continue;
        a.dataset.svideoDone = "1";
        const title = (a.textContent || "").trim();
        if (!v.title && title && !/^https?:\/\//.test(title) && title.length < 160) v.title = title;
        if (!v.title) v.title = v.url;
        const card = playCard(v);
        a.after(card);
      } catch (e) {}
    }
  }
  function cmdQuery(text) {
    const t = String(text || "").trim();
    let m = t.match(/^\/vid[eé]os?\s+(.+)/i) || t.match(/^\/video\s+(.+)/i);
    if (m) return m[1].trim();
    m = t.match(/^\/junior\s+(on|off|oui|non|1|0)/i);
    if (m) {
      const on = /^(on|oui|1)/i.test(m[1]);
      setJunior(on);
      postAssistant(on ? "Mode Junior activé : Qwant Junior et filtrage strict." : "Mode Junior désactivé.", []);
      return "";
    }
    m = t.match(/(?:cherch\w*|trouve\w*|montre\w*|mets?\w*|lance\w*|regarde\w*)\s+(?:moi\s+)?(?:une\s+|des\s+|la\s+|les\s+)?(?:vid[eé]os?\s*)?(?:sur\s+|de\s+|du\s+)?(.{3,120})/i);
    if (m && /(vid[eé]o|youtube|peertube|peer\.tube|vimeo|qwant)/i.test(t)) {
      let q = m[1].replace(/\s*(sur\s+)?(youtube|peertube|peer\.tube|vimeo|qwant)\s*$/i, "").trim();
      return q.length >= 2 ? q : "";
    }
    return "";
  }
  function scoreVideo(v, words) {
    let s = 0;
    const t = String(v.title || "").toLowerCase();
    const c = String(v.channel || "").toLowerCase();
    for (const w of words) {
      if (w.length < 3) continue;
      if (t.indexOf(w) >= 0) s += 3;
      if (c.indexOf(w) >= 0) s += 1;
    }
    if (/#short/i.test(v.title || "")) s -= 4;
    if (v.source === "youtube") s += 1;
    if (v.thumb) s += 1;
    return s;
  }
  let ytApiPromise = null;
  function ytApi() {
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve) => {
      try {
        if (globalThis.YT && globalThis.YT.Player) { resolve(globalThis.YT); return; }
      } catch (e) {}
      const to = setTimeout(() => { try { resolve(globalThis.YT || null); } catch (e2) { resolve(null); } }, 8000);
      const prev = globalThis.onYouTubeIframeAPIReady;
      globalThis.onYouTubeIframeAPIReady = function () {
        try { if (typeof prev === "function") prev(); } catch (e) {}
        clearTimeout(to);
        try { resolve(globalThis.YT || null); } catch (e2) { resolve(null); }
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = () => { clearTimeout(to); resolve(null); };
      document.head.appendChild(s);
    });
    return ytApiPromise;
  }
  function blockedBox(v, queue, host) {
    const box = document.createElement("div");
    box.className = "svideo-blocked";
    const p = document.createElement("div");
    p.className = "svideo-intro";
    p.textContent = "« " + (v.title || "") + " » refuse la lecture intégrée (erreur YouTube " + (v.ytErr || "153") + ").";
    box.appendChild(p);
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.flexWrap = "wrap";
    const open = document.createElement("a");
    open.href = v.url;
    open.target = "_blank";
    open.rel = "noopener";
    open.className = "svideo-tab";
    open.textContent = "Ouvrir sur YouTube";
    row.appendChild(open);
    if (queue && queue.length && host) {
      const next = document.createElement("button");
      next.type = "button";
      next.className = "svideo-tab";
      next.dataset.svideoTry = "1";
      next.textContent = "Essayer : " + queue[0].title.slice(0, 60);
      next.addEventListener("click", () => {
        const nv = queue[0];
        const rest = queue.slice(1);
        const np = directPlayer(nv, rest);
        host.replaceWith(np);
        const sc = document.querySelector("#chatHistoryCtn");
        if (sc) sc.scrollTop = sc.scrollHeight;
      });
      row.appendChild(next);
    }
    box.appendChild(row);
    return box;
  }
  function directPlayer(v, queue) {
    queue = queue || [];
    if (v.source === "qwant" && !parseUrl(v.embed || v.url)) {
      const box = document.createElement("div");
      box.className = "svideo-blocked";
      const p = document.createElement("div");
      p.className = "svideo-intro";
      p.textContent = "« " + (v.title || "") + " » (Qwant) — lecture sur le site d'origine.";
      box.appendChild(p);
      const open = document.createElement("a");
      open.href = v.url;
      open.target = "_blank";
      open.rel = "noopener";
      open.className = "svideo-tab";
      open.textContent = "Ouvrir la vidéo";
      box.appendChild(open);
      return box;
    }
    const wrap = document.createElement("div");
    wrap.className = "svideo-player";
    wrap.style.margin = "10px 0";
    wrap.style.maxWidth = "520px";
    if (v.source === "youtube" && v.id) {
      const slot = document.createElement("div");
      slot.style.aspectRatio = "16/9";
      slot.style.background = "#000";
      wrap.appendChild(slot);
      ytApi().then((api) => {
        if (!slot.isConnected) return;
        if (!api || !api.Player) {
          slot.replaceWith(blockedBox(v, queue, wrap));
          return;
        }
        try {
          let started = false;
          let engaged = false;
          let stallTimer = null;
          const clearStall = () => { try { if (stallTimer) clearTimeout(stallTimer); } catch (e) {} stallTimer = null; };
          const offerDirect = () => {
            try {
              if (started || !wrap.isConnected) return;
              if (wrap.querySelector("[data-svideo-direct]")) return;
              const b = document.createElement("button");
              b.type = "button";
              b.className = "svideo-tab";
              b.dataset.svideoDirect = "1";
              b.textContent = "Lecture directe";
              b.title = "Si la lecture ne démarre pas, lire sans le pilotage YouTube";
              b.addEventListener("click", () => {
                const w2 = document.createElement("div");
                w2.className = "svideo-player";
                w2.style.margin = "10px 0";
                w2.style.maxWidth = "520px";
                const fr = document.createElement("iframe");
                fr.src = v.embed;
                fr.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
                fr.setAttribute("allowfullscreen", "");
                fr.setAttribute("frameborder", "0");
                w2.appendChild(fr);
                wrap.replaceWith(w2);
              });
              wrap.appendChild(b);
            } catch (e) {}
          };
          new api.Player(slot, {
            videoId: v.id,
            host: "https://www.youtube-nocookie.com",
            playerVars: { rel: 0 },
            events: {
              onStateChange: (e) => {
                try {
                  if (e && (e.data === 1 || e.data === 2 || e.data === 3)) engaged = true;
                  if (e && e.data === 1) { started = true; clearStall(); }
                  else if (e && e.data === 3 && !started) { clearStall(); stallTimer = setTimeout(offerDirect, 12000); }
                } catch (e2) {}
              },
              onError: (e) => {
                try { v.ytErr = String((e && e.data) || "153"); } catch (e2) {}
                try {
                  if (engaged && wrap.isConnected) {
                    const nx = wrap.nextElementSibling;
                    if (!nx || !nx.querySelector || !nx.querySelector("[data-svideo-try]")) wrap.after(blockedBox(v, queue, wrap));
                  } else wrap.replaceWith(blockedBox(v, queue, wrap));
                } catch (e3) { try { wrap.replaceWith(blockedBox(v, queue, wrap)); } catch (e4) {} }
              }
            }
          });
        } catch (e) {
          slot.replaceWith(blockedBox(v, queue, wrap));
        }
      });
      return wrap;
    }
    const fr = document.createElement("iframe");
    fr.src = v.embed;
    fr.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    fr.setAttribute("allowfullscreen", "");
    fr.setAttribute("frameborder", "0");
    fr.loading = "lazy";
    wrap.appendChild(fr);
    return wrap;
  }
  async function answerQuery(q, originRow) {
    if (!q) return;
    if (originRow) originRow.dataset.svideoBusy = "1";
    const jr = isJunior();
    postAssistant("Je cherche « " + q + " » sur YouTube, PeerTube, Vimeo et Qwant…" + (jr ? " (Junior : filtrage strict)" : ""), []);
    let all = null;
    try {
      all = await searchAll(q, 3);
    } catch (e) {
      all = { youtube: [], peertube: [], vimeo: [], qwant: [] };
    }
    const list = document.querySelector("#messageListEl");
    if (list && list.lastChild) list.lastChild.remove();
    const mixed = [...(all.youtube || []), ...(all.peertube || []), ...(all.vimeo || []), ...(all.qwant || [])];
    if (!mixed.length) {
      postAssistant("Je n'ai rien trouvé pour « " + q + " » cette fois. Essaie avec d'autres mots.", []);
      return;
    }
    const words = q.toLowerCase().split(/[^a-zàâäéèêëîïôöùûüç0-9]+/).filter(Boolean);
    const ranked = mixed.slice().sort((a, b) => scoreVideo(b, words) - scoreVideo(a, words));
    const best = ranked[0];
    const row = postAssistant("Mon choix pour « " + q + " » — " + best.title, []);
    const body = row ? row.querySelector(".messageContent") : null;
    if (body) {
      const link = document.createElement("a");
      link.href = best.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "svideo-title";
      link.dataset.svideoDone = "1";
      link.textContent = srcLabel(best.source) + (best.channel ? " · " + best.channel : "") + (best.duration ? " · " + best.duration : "");
      body.appendChild(link);
      body.appendChild(directPlayer(best, ranked.slice(1)));
      if (ranked.length > 1) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "svideo-tab";
        more.textContent = "Voir les " + (ranked.length - 1) + " autres";
        more.addEventListener("click", () => {
          for (const v of ranked.slice(1)) body.appendChild(playCard(v));
          more.remove();
          const sc = document.querySelector("#chatHistoryCtn");
          if (sc) sc.scrollTop = sc.scrollHeight;
        });
        body.appendChild(more);
      }
    }
  }
  function watchChat() {
    const list = document.querySelector("#messageListEl");
    if (!list || list.dataset.svideoWatch === "1") return;
    list.dataset.svideoWatch = "1";
    enrichScope(list);
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          enrichScope(n);
          const isUser = n.classList && n.classList.contains("userRow");
          const txt = isUser ? (n.innerText || n.textContent || "") : "";
          const q = isUser ? cmdQuery(txt) : "";
          if (q && n.dataset.svideoBusy !== "1" && n.dataset.svideoAnswered !== "1") {
            n.dataset.svideoAnswered = "1";
            answerQuery(q, n);
          }
        }
      }
    });
    obs.observe(list, { childList: true, subtree: false });
  }
  function ensureCss() {
    if (document.getElementById("svideoCss")) return;
    const st = document.createElement("style");
    st.id = "svideoCss";
    st.textContent = ".svideo-card{margin:10px 0;max-width:520px;background:#141417;border:1px solid #2c2c33;border-radius:12px;overflow:hidden}"
      + ".svideo-thumb{position:relative;aspect-ratio:16/9;background:#000;cursor:pointer}"
      + ".svideo-thumb img{width:100%;height:100%;object-fit:cover;display:block}"
      + ".svideo-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:56px;height:56px;border-radius:50%;border:none;background:rgba(0,0,0,.65);color:#fff;font-size:22px;cursor:pointer}"
      + ".svideo-play:hover{background:rgba(0,0,0,.85)}"
      + ".svideo-dur{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.8);color:#fff;font-size:11px;padding:2px 6px;border-radius:6px}"
      + ".svideo-meta{padding:9px 12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}"
      + ".svideo-badge{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:2px 8px;border-radius:999px}"
      + ".svideo-youtube{background:rgba(255,0,0,.15);color:#ff8a8a;border:1px solid rgba(255,0,0,.4)}"
      + ".svideo-peertube{background:rgba(255,143,0,.14);color:#ffc37a;border:1px solid rgba(255,143,0,.4)}"
      + ".svideo-vimeo{background:rgba(26,183,234,.14);color:#8fd8f5;border:1px solid rgba(26,183,234,.4)}"
      + ".svideo-qwant{background:rgba(90,63,180,.16);color:#c4b5fd;border:1px solid rgba(90,63,180,.45)}"
      + ".svideo-title{color:#e8e8ea;font-size:13.5px;font-weight:600;text-decoration:none;flex:1 1 200px}"
      + ".svideo-title:hover{text-decoration:underline}"
      + ".svideo-chan{width:100%;color:#8e8e96;font-size:12px}"
      + ".svideo-player{aspect-ratio:16/9;background:#000}"
      + ".svideo-player iframe{width:100%;height:100%;border:0;display:block}"
      + ".svideo-intro{font-size:13.5px;color:#c9c9d1;margin:4px 0 2px}"
      + ".svideo-blocked{margin:10px 0;max-width:520px;background:#1a1512;border:1px solid #4a3520;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}"
      + ".svideo-blocked a.svideo-tab{text-decoration:none;display:inline-block}"
      + "#svideoBtn{background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:5px;min-height:34px;min-width:34px;display:flex;align-items:center;justify-content:center;border-radius:8px}"
      + "#svideoBtn:hover{color:#fff;background:rgba(255,255,255,.06)}"
      + "#svideoPop{position:fixed;z-index:940;inset-inline:0;margin-inline:auto;bottom:86px;width:min(600px,calc(100vw - 20px));max-height:min(64vh,560px);display:flex;flex-direction:column;background:#17171c;border:1px solid #34343f;border-radius:14px;box-shadow:0 20px 55px rgba(0,0,0,.65);overflow:hidden}"
      + "#svideoPop[hidden]{display:none}"
      + "#svideoHead{display:flex;gap:8px;padding:10px 12px;border-bottom:1px solid #26262e;align-items:center}"
      + "#svideoInput{flex:1;background:#1d1d23;border:1px solid #33333d;border-radius:9px;color:#eee;padding:9px 11px;font-size:14px;outline:none;min-width:0}"
      + "#svideoGo{background:rgba(99,102,241,.16);border:1px solid rgba(99,102,241,.4);color:#c7d2fe;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer}"
      + "#svideoTabs{display:flex;gap:6px;padding:8px 12px 0}"
      + ".svideo-tab{background:transparent;border:1px solid #33333d;color:#a1a1aa;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer}"
      + ".svideo-tab.on{background:rgba(99,102,241,.16);border-color:rgba(99,102,241,.5);color:#fff}"
      + "#svideoRes{overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:4px}"
      + "#svideoStatus{padding:8px 12px;color:#8e8e96;font-size:12px}";
    document.head.appendChild(st);
  }
  function ensureUi() {
    ensureCss();
    watchChat();
    if (document.getElementById("svideoBtn")) return;
    const box = document.querySelector("#inputActionsCtn");
    const anchor = document.querySelector("#attachBtn");
    if (!box) return;
    const b = document.createElement("button");
    b.id = "svideoBtn";
    b.type = "button";
    b.title = "Chercher une vidéo (YouTube, PeerTube, Vimeo, Qwant)";
    b.setAttribute("aria-label", "Chercher une vidéo");
    b.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"></rect><polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none"></polygon></svg>';
    b.addEventListener("click", togglePop);
    if (anchor) box.insertBefore(b, anchor);
    else box.appendChild(b);
    const pop = document.createElement("div");
    pop.id = "svideoPop";
    pop.hidden = true;
    pop.innerHTML = '<div id="svideoHead"><input id="svideoInput" placeholder="Chercher une vidéo…" autocomplete="off" spellcheck="false"><button id="svideoGo" type="button">Chercher</button></div>'
      + '<div id="svideoTabs"><button class="svideo-tab on" data-tab="all" type="button">Tout</button><button class="svideo-tab" data-tab="youtube" type="button">YouTube</button><button class="svideo-tab" data-tab="peertube" type="button">PeerTube</button><button class="svideo-tab" data-tab="vimeo" type="button">Vimeo</button><button class="svideo-tab" data-tab="qwant" type="button">Qwant</button><button class="svideo-tab" data-tab="junior" type="button">Junior : off</button></div>'
      + '<div id="svideoStatus">Astuce : écris « cherche une vidéo de … » ou « /video … » et je la joue ici même.</div>'
      + '<div id="svideoRes"></div>';
    document.body.appendChild(pop);
    const input = pop.querySelector("#svideoInput");
    const go = pop.querySelector("#svideoGo");
    const res = pop.querySelector("#svideoRes");
    const status = pop.querySelector("#svideoStatus");
    let tab = "all";
    const jrBtn = () => pop.querySelector('[data-tab="junior"]');
    const syncJr = () => { const b = jrBtn(); if (b) b.textContent = "Junior : " + (isJunior() ? "on" : "off"); };
    syncJr();
    pop.querySelectorAll(".svideo-tab").forEach((t) => t.addEventListener("click", () => {
      if (t.dataset.tab === "junior") {
        setJunior(!isJunior());
        syncJr();
        status.textContent = isJunior() ? "Junior activé : Qwant Junior et filtrage strict." : "Junior désactivé.";
        return;
      }
      pop.querySelectorAll(".svideo-tab").forEach((x) => x.classList.remove("on"));
      t.classList.add("on");
      tab = t.dataset.tab;
    }));
    const run = async () => {
      const q = input.value.trim();
      if (q.length < 2) { status.textContent = "Écris au moins deux lettres."; return; }
      status.textContent = "Recherche en cours…" + (isJunior() ? " (Junior : filtrage strict)" : "");
      res.innerHTML = "";
      try {
        const all = await searchAll(q, tab === "all" ? 2 : 8);
        const list = tab === "all" ? [...all.youtube, ...all.peertube, ...all.vimeo, ...all.qwant] : (all[tab] || []);
        if (!list.length) { status.textContent = "Rien trouvé pour « " + q + " »."; return; }
        status.textContent = list.length + " résultat(s) — ▶ pour lire ici, le titre pour ouvrir la page.";
        for (const v of list) {
          const card = playCard(v);
          const add = document.createElement("button");
          add.type = "button";
          add.className = "svideo-tab";
          add.textContent = "Mettre dans le chat";
          add.addEventListener("click", () => { postAssistant("", [v]); });
          const wrap = document.createElement("div");
          wrap.appendChild(card);
          wrap.appendChild(add);
          res.appendChild(wrap);
        }
      } catch (e) {
        status.textContent = "La recherche a échoué. Réessaie.";
      }
    };
    go.addEventListener("click", run);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
    document.addEventListener("click", (e) => {
      if (pop.hidden) return;
      if (pop.contains(e.target) || b.contains(e.target)) return;
      pop.hidden = true;
    });
  }
  function togglePop() {
    const pop = document.getElementById("svideoPop");
    if (!pop) return;
    pop.hidden = !pop.hidden;
    if (!pop.hidden) {
      const i = document.getElementById("svideoInput");
      if (i) i.focus();
    }
  }
  App.Videos = { searchYouTube: searchYouTube, searchPeerTube: searchPeerTube, searchVimeo: searchVimeo, searchQwant: searchQwant, searchAll: searchAll, answer: answerQuery, post: postAssistant, card: playCard, isJunior: isJunior, setJunior: setJunior, PEERTUBE_BASE: PEERTUBE_BASE };
  try { globalThis.SofiaVideos = App.Videos; } catch (e) {}
  try {
    ensureUi();
    setTimeout(ensureUi, 1500);
    setTimeout(ensureUi, 4000);
  } catch (e) {}
}
