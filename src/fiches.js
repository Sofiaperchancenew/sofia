/* ============================================================================
   Sofia — FICHES DE PERSONNAGES : collecte, création, mise à jour au fil du scénario
   À poser juste avant </body> :   <script src="src/fiches.js"></script>
   Expose window.SofiaFiches  (+ App.Fiches dès que l'app est prête)

   Le modèle écrit, à la fin de sa réponse, un bloc par personnage :
       [FICHE]{"nom":"Max","poids":"66 kg","action":"assis, torse nu"}[/FICHE]

   Règles du module :
     - un personnage NOMMÉ existe -> fiche créée, même presque vide ;
     - seuls les champs CHANGÉS sont transmis ;
     - une valeur vide n'écrase jamais une valeur connue ;
     - tout changement est journalisé (champ, avant, après, date).
   Stockage : les fiches existantes de l'app (App.Sheets) dès qu'elles sont
   prêtes — source unique, jamais de doublon. Repli IndexedDB + localStorage
   seulement si App.Sheets est indisponible. Les fiches moi/sofia ne sont
   jamais supprimées ni purgées.
   ========================================================================== */
(function () {
  "use strict";
  if (window.SofiaFiches) return;

  var IDB_NAME = "sofia_fiches_v1", IDB_STORE = "fiches";
  var LS_KEY = "sofia_fiches_fallback_v1";
  var HIST_MAX = 30;
  var MA = "[FICHE]", MB = "[/FICHE]";
  var META = ["cle", "cree", "maj", "vu", "hist", "source"];
  var PROTEGE = { moi: 1, sofia: 1 };

  /* ---------------- utilitaires ---------------- */
  function s(v) { return String(v == null ? "" : v).trim(); }
  function normName(v) { return s(v).replace(/\s+/g, " "); }
  function keyOf(v) { return normName(v).toLowerCase(); }
  function blank(v) { var t = s(v); return !t || t === "?" || t === "—" || t === "-" || t === "…"; }
  function copy(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; } }

  function blankRec(nom) {
    return {
      nom: normName(nom), cle: keyOf(nom),
      genre: "", age: "", taille: "", poids: "",
      yeux: "", cheveux: "", lieu: "", presence: "", action: "",
      tatouages: "aucun connu",
      anatomie: {}, orifices: [], vetements: [], objets_portes: [],
      cree: Date.now(), maj: Date.now(), vu: 0, source: "scenario", hist: []
    };
  }
  function sanitize(o) {
    var out = {};
    Object.keys(o || {}).forEach(function (k) { if (META.indexOf(k) === -1) out[k] = o[k]; });
    return out;
  }

  /* ---------------- fusion ---------------- */
  var ID_KEYS = ["nom", "objet", "libelle", "label", "cle", "id", "type"];
  function idOf(o) {
    if (!o || typeof o !== "object") return "";
    for (var i = 0; i < ID_KEYS.length; i++) if (!blank(o[ID_KEYS[i]])) return keyOf(o[ID_KEYS[i]]);
    return "";
  }
  function mergeInto(dst, src, path, log) {
    Object.keys(src).forEach(function (k) {
      var v = src[k];
      if (v === undefined || v === null) return;
      var p = path ? path + "." + k : k;
      if (Array.isArray(v)) { dst[k] = mergeArr(dst[k], v, p, log); return; }
      if (typeof v === "object") {
        if (!dst[k] || typeof dst[k] !== "object" || Array.isArray(dst[k])) dst[k] = {};
        mergeInto(dst[k], v, p, log); return;
      }
      var val = s(v);
      if (blank(val)) return;                       // vide n'écrase jamais
      if (s(dst[k]) === val) return;                // identique : rien à faire
      if (!blank(dst[k])) log.push({ champ: p, avant: s(dst[k]), apres: val, t: Date.now() });
      dst[k] = val;
    });
  }
  function mergeArr(dst, src, path, log) {
    var out = Array.isArray(dst) ? dst.slice() : [];
    src.forEach(function (item) {
      if (item === undefined || item === null) return;
      if (typeof item !== "object") {
        var t = s(item);
        if (blank(t) || out.indexOf(t) !== -1) return;
        out.push(t); log.push({ champ: path + "[]", avant: "", apres: t, t: Date.now() });
        return;
      }
      var k = idOf(item), hit = -1;
      if (k) for (var i = 0; i < out.length; i++)
        if (typeof out[i] === "object" && idOf(out[i]) === k) { hit = i; break; }
      if (hit < 0) {
        out.push(copy(item));
        log.push({ champ: path + "[]", avant: "", apres: idOf(item) || "nouvel élément", t: Date.now() });
        return;
      }
      mergeInto(out[hit], item, path + "[" + (idOf(item) || "?") + "]", log);   // on complète, on n'écrase pas
    });
    return out;
  }

  /* ---------------- stockage (IndexedDB + miroir localStorage) ---------------- */
  var dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(function (res, rej) {
      var r;
      try { r = indexedDB.open(IDB_NAME, 1); } catch (e) { return rej(e); }
      r.onupgradeneeded = function () { try { r.result.createObjectStore(IDB_STORE, { keyPath: "cle" }); } catch (e) {} };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbP;
  }
  function lsAll() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e) { return {}; } }
  function lsPut(rec) { var m = lsAll(); m[rec.cle] = rec; try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch (e) {} }

  var Store = {
    all: function () {
      return db().then(function (d) {
        return new Promise(function (res) {
          var out = [], q;
          try { q = d.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).openCursor(); }
          catch (e) { return res(Object.keys(lsAll()).map(function (k) { return lsAll()[k]; })); }
          q.onsuccess = function () { var c = q.result; if (c) { out.push(c.value); c.continue(); } else res(out); };
          q.onerror = function () { res(Object.keys(lsAll()).map(function (k) { return lsAll()[k]; })); };
        });
      }).catch(function () { return Object.keys(lsAll()).map(function (k) { return lsAll()[k]; }); });
    },
    get: function (cle) { return Store.all().then(function (l) { for (var i = 0; i < l.length; i++) if (l[i].cle === cle) return l[i]; return null; }); },
    put: function (rec) {
      lsPut(rec);
      return db().then(function (d) {
        return new Promise(function (res) {
          try {
            var tx = d.transaction(IDB_STORE, "readwrite");
            tx.objectStore(IDB_STORE).put(rec);
            tx.oncomplete = function () { res(rec); };
            tx.onerror = function () { res(rec); };
          } catch (e) { res(rec); }
        });
      }).catch(function () { return rec; });
    },
    del: function (cle) {
      var m = lsAll(); delete m[cle]; try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch (e) {}
      return db().then(function (d) {
        return new Promise(function (res) {
          try { d.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).delete(cle); } catch (e) {}
          res();
        });
      }).catch(function () {});
    }
  };

  /* ---------------- délégation au store existant (source unique) ---------------- */
  function sheetsAdapter() {
    try {
      var S = window.App && window.App.Sheets;
      if (!S || typeof S.list !== "function" || typeof S.getSheet !== "function" || typeof S.saveSheet !== "function") return null;
      var seen = null;
      try { seen = S.saveSheet.length; } catch (e0) { seen = 1; }
      var saveRec = function (rec) {
        try {
          var r = (seen >= 2) ? S.saveSheet(rec.id || rec.cle, rec) : S.saveSheet(rec);
          return (r && typeof r.then === "function") ? r : Promise.resolve(r);
        } catch (e) { return Promise.resolve(rec); }
      };
      var fix = function (r) { if (r && !r.cle) r.cle = keyOf(r.nom || r.id || ""); return r; };
      var all = function () {
        return Promise.resolve().then(function () { return S.list(); }).then(function (ids) {
          var ps = (ids || []).map(function (id) {
            return Promise.resolve().then(function () { return S.getSheet(id); }).then(function (r) { return (r && typeof r === "object") ? fix(r) : null; }).catch(function () { return null; });
          });
          return Promise.all(ps).then(function (l) { return l.filter(function (r) { return !!r; }); });
        }).catch(function () { return []; });
      };
      var get = function (cle) {
        return all().then(function (l) { for (var i = 0; i < l.length; i++) if (l[i].cle === cle) return l[i]; return null; });
      };
      return {
        all: all,
        get: get,
        put: function (rec) {
          return get(rec.cle).then(function (cur) {
            if (cur && cur.id && !rec.id) rec.id = cur.id;
            if (!rec.id) rec.id = rec.cle;
            return saveRec(rec).then(function () { return rec; }).catch(function () { return rec; });
          }).catch(function () {
            if (!rec.id) rec.id = rec.cle;
            return saveRec(rec).then(function () { return rec; }).catch(function () { return rec; });
          });
        },
        del: function (cle) {
          return get(cle).then(function (r) {
            if (!r) return;
            var id = r.id || cle;
            if (PROTEGE[String(id).toLowerCase()]) return;
            if (S.delSheet) return S.delSheet(id).catch(function () {});
          }).catch(function () {});
        }
      };
    } catch (e) { return null; }
  }
  function attachStore() {
    try {
      var ad = sheetsAdapter();
      if (ad) { API.useStore(ad); refreshUI(); return true; }
    } catch (e) {}
    return false;
  }

  /* ---------------- analyse du texte ---------------- */
  function tolerant(raw) {
    var t = s(raw).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try { return JSON.parse(t); } catch (e) {}
    try {
      return JSON.parse(t.replace(/,\s*([}\]])/g, "$1")
                        .replace(/([{,]\s*)([A-Za-z_][\w]*)\s*:/g, '$1"$2":'));
    } catch (e2) { return null; }
  }
  function parseBlocks(text) {
    var out = [], re = /\[FICHE\]([\s\S]*?)\[\/FICHE\]/gi, m;
    while ((m = re.exec(text || ""))) {
      var o = tolerant(m[1]);
      if (!o) continue;
      if (Array.isArray(o)) Array.prototype.push.apply(out, o.filter(function (x) { return x && typeof x === "object"; }));
      else if (typeof o === "object") out.push(o);
    }
    return out;
  }

  // Filet de sécurité : si le modèle a oublié les blocs, on repère au moins
  // « Prénom (masculin, 55 ans) », « 1,77 m », « 66 kg », « yeux : … ».
  function guess(text) {
    var t = String(text || ""), found = [];
    var re = /([A-ZÀ-Ý][\p{L}'\-]{1,20}(?:\s[A-ZÀ-Ý][\p{L}'\-]{1,20})?)\s*\(\s*(masculin|féminin|homme|femme|mâle|femelle)[^,)]*,\s*(\d{1,3})\s*ans/giu, m;
    while ((m = re.exec(t))) {
      var r = { nom: normName(m[1]), genre: m[2].toLowerCase(), age: m[3], source: "déduit" };
      var fen = t.slice(Math.max(0, m.index - 260), m.index + 260);
      var mt = /(\d[.,]\d{2})\s*m\b/.exec(fen);        if (mt) r.taille = mt[1].replace(",", ",") + " m";
      var mp = /(\d{2,3})\s*kg\b/.exec(fen);           if (mp) r.poids  = mp[1] + " kg";
      var my = /\byeux\s*[:=]\s*([^\n,;.]{2,28})/i.exec(fen);     if (my) r.yeux = s(my[1]);
      var mc = /\bcheveux\s*[:=]\s*([^\n,;.]{2,28})/i.exec(fen);  if (mc) r.cheveux = s(mc[1]);
      found.push(r);
    }
    return found;
  }

  /* ---------------- cœur : écriture ---------------- */
  async function upsert(incoming, opts) {
    var nom = normName(incoming.nom || incoming.name || incoming.prenom);
    if (!nom) return null;
    var rec = await Store.get(keyOf(nom));
    var neuf = false;
    if (!rec) { rec = blankRec(nom); neuf = true; }
    var log = [];
    mergeInto(rec, sanitize(incoming), "", log);
    if (blank(rec.nom)) rec.nom = nom;
    rec.maj = Date.now();
    rec.vu = (rec.vu || 0) + 1;
    if (!neuf && log.length) rec.hist = (rec.hist || []).concat(log).slice(-HIST_MAX);
    if (neuf) rec.hist = log.slice(-HIST_MAX);
    await Store.put(rec);
    if (opts && opts.announce !== false) {
      try { if (neuf && window.SofiaGate && SofiaGate.toast) SofiaGate.toast("Nouvelle fiche : " + rec.nom, false); } catch (e) {}
    }
    return rec;
  }

  var busy = false;
  async function ingest(text, opts) {
    if (busy) return [];
    busy = true;
    try {
      var blocks = parseBlocks(text);
      if (!blocks.length) {
        if (opts && opts.heuristic === false) return [];
        blocks = guess(text);
        if (!blocks.length) return [];
      }
      var out = [];
      for (var i = 0; i < blocks.length; i++) {
        var r = await upsert(blocks[i], opts);
        if (r) out.push(r);
      }
      if (out.length) { await refreshUI(); render(); }
      return out;
    } finally { busy = false; }
  }

  /* ---------------- purge de scène ---------------- */
  async function purgeScene(keep) {
    var all = await Store.all(), touched = 0;
    for (var i = 0; i < all.length; i++) {
      var r = all[i];
      if (r.id === "moi" || r.id === "sofia" || r.cle === "moi" || r.cle === "sofia") continue;
      if (keep && keep.indexOf(r.cle) !== -1) continue;
      var log = [];
      ["lieu", "presence", "action"].forEach(function (k) { if (!blank(r[k])) { log.push({ champ: k, avant: s(r[k]), apres: "", t: Date.now() }); r[k] = ""; } });
      if ((r.objets_portes || []).length) { log.push({ champ: "objets_portes", avant: r.objets_portes.length + " objet(s)", apres: "", t: Date.now() }); r.objets_portes = []; }
      if (log.length) { r.hist = (r.hist || []).concat(log).slice(-HIST_MAX); r.maj = Date.now(); await Store.put(r); touched++; }
    }
    await refreshUI(); render();
    return touched;
  }

  /* ---------------- ce qu'on donne au modèle ---------------- */
  var DIRECTIVE = [
    "[FICHES — DIRECTIVE PERMANENTE]",
    "À la fin de CHAQUE réponse, tu tiens à jour les fiches des personnages.",
    "1. Dès qu'un personnage est NOMMÉ pour la première fois, il existe : tu émets un bloc pour lui, même si tu ne sais presque rien de lui.",
    "2. Un bloc par personnage, sur une seule ligne, en JSON compact, entre [FICHE] et [/FICHE].",
    "3. Tu n'écris QUE les champs qui ont changé dans ce tour. Un champ inconnu, tu l'omets (jamais de valeur vide).",
    "4. Tu n'inventes rien : ce que la scène ne dit pas reste inchangé.",
    "5. Les blocs vont tout à la fin, juste avant [GAME_STATE] s'il est présent. Le texte de la scène reste propre : rien d'autre ne change.",
    "",
    "Champs de premier niveau : nom, genre, age, taille, poids, yeux, cheveux, lieu, presence, action, tatouages.",
    "anatomie : objet libre (silhouette, sexe, sexe_taille, circoncision, pilosite, frein, testicules, poitrine, poils, seins, hanches…).",
    "orifices : tableau de {nom, contient, quantite_ml, objets[]}.",
    "vetements : tableau de {nom, couleur, etat}.",
    "objets_portes : tableau de {objet, note}.",
    "",
    "Exemples :",
    '[FICHE]{"nom":"Max","genre":"masculin","age":"55","taille":"1,77 m","poids":"66 kg","yeux":"bruns-verts","cheveux":"crâne rasé"}[/FICHE]',
    '[FICHE]{"nom":"Max","action":"assis au bord du lit, torse nu","vetements":[{"nom":"slip","couleur":"noir"}]}[/FICHE]',
    '[FICHE]{"nom":"Léa","genre":"féminin","age":"29","cheveux":"longs châtains","lieu":"la cuisine"}[/FICHE]'
  ].join("\n");

  async function contextBlock(limite) {
    var all = await Store.all();
    all.sort(function (a, b) { return (b.maj || 0) - (a.maj || 0); });
    all = all.slice(0, limite || 12);
    if (!all.length) return "";
    var l = ["[FICHES CONNUES — pour rester cohérent, ne pas contredire]"];
    all.forEach(function (r) {
      var bits = [r.nom];
      var ageTxt = s(r.age);
      if (r.genre || ageTxt) bits.push("(" + [r.genre, ageTxt && (/^\d/.test(ageTxt) ? ageTxt + " ans" : ageTxt)].filter(Boolean).join(", ") + ")");
      var show = function (v) { var t = (typeof v === "string" || typeof v === "number") ? s(v) : ""; return /object/i.test(t) ? "" : t; };
      [["taille", "T"], ["poids", "P"], ["yeux", "yeux"], ["cheveux", "cheveux"], ["lieu", "lieu"], ["presence", "présence"], ["action", "action"]]
        .forEach(function (p) { var t = show(r[p[0]]); if (t && !blank(t)) bits.push(p[1] + " " + t); });
      if ((r.objets_portes || []).length) bits.push("porte : " + r.objets_portes.map(function (o) { return o.objet; }).join(", "));
      if ((r.vetements || []).length) bits.push("vêtements : " + r.vetements.map(function (v) { return [v.nom, v.couleur].filter(Boolean).join(" "); }).join(", "));
      l.push("- " + bits.join(" · "));
    });
    return l.join("\n");
  }

  /* ---------------- nettoyage de l'affichage ---------------- */
  function stripMarkers(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    var dedans = false;
    nodes.forEach(function (node) {
      var t = node.nodeValue;
      if (t.indexOf(MA) === -1 && t.indexOf(MB) === -1 && !dedans) return;
      var out = "", i = 0;
      while (i < t.length) {
        if (!dedans && t.startsWith(MA, i)) { dedans = true; i += MA.length; continue; }
        if (dedans && t.startsWith(MB, i)) { dedans = false; i += MB.length; continue; }
        if (!dedans) out += t[i];
        i++;
      }
      node.nodeValue = out;
    });
  }

  /* ---------------- panneau ---------------- */
  var CSS = [
    "#sfPanel{position:fixed;top:0;inset-inline-end:0;bottom:0;width:min(440px,94vw);z-index:1200;display:flex;flex-direction:column;background:#141418;border-inline-start:1px solid #2a2f3a;box-shadow:-14px 0 44px rgba(0,0,0,.6);font-family:inherit;text-align:start}",
    "#sfPanel[hidden]{display:none}",
    ".sf-head{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #23232b;flex:0 0 auto}",
    ".sf-title{flex:1;font-size:15px;font-weight:700;color:#fff}",
    ".sf-count{font-size:11px;color:#71717a;font-variant-numeric:tabular-nums}",
    ".sf-btn{background:#1b1b22;border:1px solid #34343f;color:#d4d4d8;border-radius:9px;padding:7px 11px;font-size:12px;font-weight:600;cursor:pointer;min-height:34px;font-family:inherit}",
    ".sf-btn:hover{background:#27272a;color:#fff}",
    ".sf-btn.p{background:rgba(99,102,241,.16);border-color:rgba(99,102,241,.45);color:#c7d2fe}",
    ".sf-btn.d{border-color:rgba(239,68,68,.4);color:#fca5a5}",
    ".sf-search{margin:10px 14px 4px;padding:9px 11px;background:#0f0f13;border:1px solid #2a2a33;border-radius:9px;color:#e9e9ee;font-family:inherit;font-size:13px;outline:none}",
    ".sf-list{flex:1;overflow-y:auto;padding:8px 14px 16px;display:flex;flex-direction:column;gap:8px}",
    ".sf-card{display:flex;gap:10px;align-items:center;padding:10px;background:#1a1a20;border:1px solid #2c2c35;border-radius:12px;cursor:pointer}",
    ".sf-card:hover{border-color:#4f4f5a;background:#1f1f26}",
    ".sf-av{flex:0 0 auto;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:linear-gradient(135deg,#6366f1,#8b5cf6);font-size:16px;overflow:hidden}",
    ".sf-av img{width:100%;height:100%;object-fit:cover}",
    ".sf-nm{font-size:14px;font-weight:700;color:#fff}",
    ".sf-sub{font-size:11.5px;color:#8e8e9a;margin-top:2px}",
    ".sf-empty{padding:18px 6px;color:#71717a;font-size:13px;line-height:1.6;font-style:italic}",
    ".sf-detail{flex:1;overflow-y:auto;padding:12px 14px 22px}",
    ".sf-row{display:flex;gap:10px;padding:6px 0;border-bottom:1px dashed #23232b;font-size:13px}",
    ".sf-k{flex:0 0 118px;color:#8e8e9a}",
    ".sf-v{flex:1;color:#e4e4e7;word-break:break-word}",
    ".sf-sec{margin-top:12px;border:1px solid #2c2c35;border-radius:11px;overflow:hidden}",
    ".sf-sec-h{display:flex;align-items:center;gap:8px;padding:9px 11px;background:#1b1b22;cursor:pointer;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#a5b4fc}",
    ".sf-sec-b{padding:8px 11px 11px;font-size:12.5px;color:#d4d4d8;line-height:1.55}",
    ".sf-sec-b[hidden]{display:none}",
    ".sf-item{padding:5px 0;border-bottom:1px dashed #23232b}",
    ".sf-item:last-child{border-bottom:none}",
    ".sf-hist{font-size:11px;color:#71717a;line-height:1.6}",
    ".sf-actions{display:flex;gap:6px;padding:10px 14px;border-top:1px solid #23232b;flex-wrap:wrap;flex:0 0 auto}"
  ].join("");
  var FIELDS = [["nom", "Nom"], ["genre", "Genre"], ["age", "Âge"], ["taille", "Taille"], ["poids", "Poids"],
                ["yeux", "Yeux"], ["cheveux", "Cheveux"], ["lieu", "Lieu"], ["presence", "Présence"],
                ["action", "Action"], ["tatouages", "Tatouages"]];
  var SECS = [["anatomie", "Anatomie"], ["orifices", "Orifices"], ["vetements", "Vêtements"], ["objets_portes", "Objets portés"]];

  var panel = null, courant = null, filtre = "", caches = [];

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function build() {
    if (panel) return panel;
    var st = el("style"); st.textContent = CSS; document.head.appendChild(st);
    panel = el("div"); panel.id = "sfPanel"; panel.hidden = true;
    document.body.appendChild(panel);
    return panel;
  }

  function render() {
    build();
    panel.textContent = "";
    var head = el("div", "sf-head");
    head.appendChild(el("div", "sf-title", courant ? courant.nom : "Fiches"));
    if (courant) head.appendChild(el("button", "sf-btn", "‹ Retour")).onclick = function () { courant = null; render(); };
    else {
      head.appendChild(el("span", "sf-count", caches.length + " fiche(s)"));
      head.appendChild(el("button", "sf-btn p", "+ Nouvelle")).onclick = nouvelle;
      head.appendChild(el("button", "sf-btn", "⇩")).onclick = exporter;
      head.appendChild(el("button", "sf-btn", "✕")).onclick = fermer;
    }
    panel.appendChild(head);

    if (!courant) {
      var inp = el("input", "sf-search"); inp.placeholder = "Rechercher un personnage…"; inp.value = filtre;
      inp.oninput = function () { filtre = inp.value.toLowerCase(); render(); };
      panel.appendChild(inp);
      var list = el("div", "sf-list");
      var l = caches.filter(function (r) {
        return !filtre || r.nom.toLowerCase().indexOf(filtre) !== -1;
      }).sort(function (a, b) { return (b.maj || 0) - (a.maj || 0); });
      if (!l.length) list.appendChild(el("div", "sf-empty", "Aucune fiche. Dès qu'un personnage est nommé dans la scène, il apparaîtra ici tout seul."));
      l.forEach(function (r) {
        var c = el("div", "sf-card");
        var av = el("div", "sf-av");
        if (r.portrait) { var im = el("img"); im.src = r.portrait; av.appendChild(im); }
        else av.textContent = (r.nom[0] || "?").toUpperCase();
        c.appendChild(av);
        var box = el("div");
        box.appendChild(el("div", "sf-nm", r.nom));
        var bits = [];
        if (r.genre) bits.push(r.genre);
        if (r.age) bits.push(r.age + " ans");
        if (r.taille) bits.push(r.taille);
        if (r.poids) bits.push(r.poids);
        bits.push("vue " + (r.vu || 1) + "×");
        if (r.source === "déduit") bits.push("déduite");
        box.appendChild(el("div", "sf-sub", bits.join(" · ")));
        c.appendChild(box);
        c.onclick = function () { courant = r; render(); };
        list.appendChild(c);
      });
      panel.appendChild(list);
      return;
    }

    var d = el("div", "sf-detail");
    FIELDS.forEach(function (f) {
      var row = el("div", "sf-row");
      row.appendChild(el("div", "sf-k", f[1]));
      row.appendChild(el("div", "sf-v", blank(courant[f[0]]) ? "—" : String(courant[f[0]])));
      d.appendChild(row);
    });
    SECS.forEach(function (sec) {
      var val = courant[sec[0]];
      var box = el("div", "sf-sec");
      var h = el("div", "sf-sec-h"); h.textContent = sec[1]; box.appendChild(h);
      var b = el("div", "sf-sec-b"); b.hidden = true;
      var vide = !val || (Array.isArray(val) && !val.length) || (!Array.isArray(val) && !Object.keys(val).length);
      if (vide) b.appendChild(el("div", "sf-item", "—"));
      else if (Array.isArray(val)) val.forEach(function (it) {
        b.appendChild(el("div", "sf-item", typeof it === "object"
          ? Object.keys(it).filter(function (k) { return !blank(it[k]); }).map(function (k) { return k + " : " + (Array.isArray(it[k]) ? it[k].join(", ") : it[k]); }).join(" · ")
          : String(it)));
      });
      else Object.keys(val).forEach(function (k) {
        if (blank(val[k])) return;
        b.appendChild(el("div", "sf-item", k + " : " + val[k]));
      });
      h.onclick = function () { b.hidden = !b.hidden; };
      box.appendChild(b);
      d.appendChild(box);
    });
    if ((courant.hist || []).length) {
      var hb = el("div", "sf-sec"), hh = el("div", "sf-sec-h", "Journal (" + courant.hist.length + ")"), hbd = el("div", "sf-sec-b");
      hbd.hidden = true;
      courant.hist.slice(-12).reverse().forEach(function (x) {
        hbd.appendChild(el("div", "sf-item", new Date(x.t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          + " · " + x.champ + " : " + (x.avant || "—") + " → " + x.apres));
      });
      hh.onclick = function () { hbd.hidden = !hbd.hidden; };
      hb.appendChild(hh); hb.appendChild(hbd); d.appendChild(hb);
    }
    panel.appendChild(d);

    var act = el("div", "sf-actions");
    act.appendChild(bouton("Renommer", function () {
      var n = prompt("Nouveau nom :", courant.nom); if (!n) return;
      var vieux = courant.cle; courant.nom = normName(n); courant.cle = keyOf(n); courant.maj = Date.now();
      Store.put(courant).then(function () { if (vieux !== courant.cle) Store.del(vieux); refreshUI(); render(); });
    }));
    act.appendChild(bouton("Champs à corriger", function () {
      FIELDS.forEach(function (f) {
        if (f[0] === "nom") return;
        var v = prompt(f[1] + " :", courant[f[0]] || ""); if (v !== null) courant[f[0]] = s(v);
      });
      courant.maj = Date.now(); Store.put(courant).then(function () { refreshUI(); render(); });
    }));
    act.appendChild(bouton("Purge de scène", function () { purgeScene().then(render); }));
    if (!courant.id || !PROTEGE[String(courant.id).toLowerCase()]) {
      act.appendChild(bouton("Supprimer", function () {
        if (!confirm("Supprimer " + courant.nom + " ?")) return;
        Store.del(courant.cle).then(function () { courant = null; refreshUI(); render(); });
      }, "d"));
    }
    panel.appendChild(act);
  }
  function bouton(txt, fn, cls) { var b = el("button", "sf-btn" + (cls ? " " + cls : ""), txt); b.onclick = fn; return b; }

  function nouvelle() {
    var n = prompt("Nom du personnage :"); if (!n) return;
    upsert({ nom: n, source: "manuel" }).then(function (r) { refreshUI(); courant = r; render(); });
  }
  function exporter() {
    var blob = new Blob([JSON.stringify(caches, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "fiches-" + new Date().toISOString().slice(0, 10) + ".json"; a.click();
  }
  function refreshUI() { return Store.all().then(function (l) { caches = l; return l; }); }
  function ouvrir() { build(); refreshUI().then(function () { panel.hidden = false; render(); }); }
  function fermer() { if (panel) panel.hidden = true; courant = null; }

  /* ---------------- branchements automatiques ---------------- */
  function injecterBouton() {
    if (document.getElementById("sfNavBtn") || !document.getElementById("docsBtn")) return;
    var ref = document.getElementById("docsBtn");
    var b = ref.cloneNode(true);
    b.id = "sfNavBtn"; b.onclick = ouvrir;
    var dup = b.querySelector("#txtDocs"); if (dup) dup.removeAttribute("id");
    var ico = b.querySelector(".sbn-icon use"); if (ico) ico.setAttribute("href", "#sf-user");
    var lbl = b.querySelector("span:not(.sbn-icon)"); if (lbl) lbl.textContent = "Fiches";
    ref.parentNode.insertBefore(b, ref.nextSibling);
  }

  function surveiller() {
    var list = document.getElementById("messageListEl");
    if (!list) { setTimeout(surveiller, 700); return; }
    var vus = new WeakSet();
    new MutationObserver(function (muts) {
      muts.forEach(function (mu) {
        Array.prototype.forEach.call(mu.addedNodes, function (n) {
          if (n.nodeType !== 1 || vus.has(n)) return;
          vus.add(n);
          var txt = n.textContent || "";
          var aBloc = txt.indexOf(MA) !== -1;
          var aMotif = /[A-ZÀ-Ý][\p{L}'\-]{1,20}\s*\(\s*(masculin|féminin|homme|femme)[^,)]*,\s*\d{1,3}\s*ans/iu.test(txt);
          if (aBloc) ingest(txt, {});
          else if (aMotif) ingest(txt, {});
          if (aBloc) setTimeout(function () { stripMarkers(n); }, 40);
        });
      });
    }).observe(list, { childList: true, subtree: true });
  }

  /* ---------------- API publique ---------------- */
  var API = {
    version: "1.0",
    directive: function () { return DIRECTIVE; },
    context: contextBlock,
    ingest: ingest,
    guess: guess,
    parse: parseBlocks,
    all: function () { return Store.all(); },
    get: function (n) { return Store.get(keyOf(n)); },
    upsert: upsert,
    rename: function (a, b) { return Store.get(keyOf(a)).then(function (r) { if (!r) return null; r.nom = normName(b); r.cle = keyOf(b); return Store.put(r); }); },
    remove: function (n) { return Store.del(keyOf(n)); },
    purgeScene: purgeScene,
    open: ouvrir,
    close: fermer,
    refresh: refreshUI,
    useStore: function (s) { if (s && s.all && s.get && s.put && s.del) Store = s; },
    stripMarkers: stripMarkers
  };
  window.SofiaFiches = API;

  // Raccrochage à App quand l'application réelle est là (le Proxy de démarrage
  // avale les affectations prématurées, d'où l'attente).
  var t0 = Date.now();
  var timer = setInterval(function () {
    var pret = window.App && window.App.State && typeof window.App.State === "object";
    if (pret || Date.now() - t0 > 60000) {
      try { window.App.Fiches = API; } catch (e) {}
      try { attachStore(); } catch (e2) {}
      clearInterval(timer);
    }
  }, 500);

  function boot() {
    build(); injecterBouton(); surveiller();
    var mo = new MutationObserver(injecterBouton);
    mo.observe(document.body, { childList: true, subtree: true });
    attachStore();
    refreshUI();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
