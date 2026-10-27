/* ============================================================================
   Sofia — CÂBLAGE DU PIPELINE IMAGE
   Branche les trois fonctions réelles (texte, vision, image) sur le verrou
   d'apparence et sur les fiches. À charger APRÈS fiches.js et verrou-apparence.js

   Rien n'est deviné côté app : on sonde quelques points d'entrée connus, et si
   aucun ne répond, on appelle l'API directement. Cablage.diagnostic() dit
   exactement ce qui a été trouvé et ce qui manque.
   ========================================================================== */
(function () {
  "use strict";
  var F = window.SofiaFiches;
  if (!F || !F.verrou || window.Cablage) return;

  /* ---------------- configuration ---------------- */
  var C = {
    base: "https://api.venice.ai/api/v1",
    cle: null,
    texte: null,
    vision: null,
    image: null,
    taille: [512, 768],
    concurrence: 1,
    auto: true
  };
  var trouve = { texte: null, vision: null, image: null, cle: null };

  function cherche(chemins) {
    for (var i = 0; i < chemins.length; i++) {
      var p = chemins[i].split("."), o = window;
      for (var j = 0; j < p.length && o; j++) o = o[p[j]];
      if (typeof o === "function") return { f: o, nom: chemins[i] };
    }
    return null;
  }

  function depuisApp() {
    var s = (window.App && window.App.State && window.App.State.settings) || {};
    var nid = [s, s.api, s.cle, s.cles, s.venice].filter(function (x) { return x && typeof x === "object"; });
    var champs = ["apiKey", "api_key", "cleApi", "veniceKey", "token", "key", "cle"];
    for (var i = 0; i < nid.length && !C.cle; i++) {
      for (var j = 0; j < champs.length; j++) {
        var v = nid[i][champs[j]];
        if (typeof v === "string" && v.length > 12) { C.cle = v; trouve.cle = "App.State.settings." + champs[j]; break; }
      }
    }
    ["modeleTexte", "textModel", "chatModel", "modele"].forEach(function (k) { if (!C.texte && s[k]) C.texte = s[k]; });
    ["modeleVision", "visionModel"].forEach(function (k) { if (!C.vision && s[k]) C.vision = s[k]; });
    ["modeleImage", "imageModel"].forEach(function (k) { if (!C.image && s[k]) C.image = s[k]; });
    try {
      ["venice_api_key", "apiKey", "sofia_cle"].forEach(function (k) { if (!C.cle && localStorage.getItem(k)) { C.cle = localStorage.getItem(k); trouve.cle = "localStorage." + k; } });
    } catch (e) {}
    return trouve;
  }

  /* ---------------- requête ---------------- */
  async function requete(chemin, body) {
    if (!C.cle) throw new Error("aucune clé API : renseigne Cablage.config.cle");
    var r = await fetch(C.base + chemin, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + C.cle },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " — " + (await r.text()).slice(0, 240));
    return r.json();
  }

  /* ---------------- média : normalisation et allègement ---------------- */
  function estData(v) { return typeof v === "string" && /^data:/i.test(v); }
  function estUrl(v) { return typeof v === "string" && /^https?:/i.test(v); }
  function estB64(v) { return typeof v === "string" && v.length > 200 && !/\s/.test(v.slice(0, 100)); }
  function blobDataUrl(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(b); }); }
  function charger(src) { return new Promise(function (res, rej) { var i = new Image(); i.crossOrigin = "anonymous"; i.onload = function () { res(i); }; i.onerror = rej; i.src = src; }); }

  async function versDataUrl(m) {
    if (!m) return null;
    if (typeof m === "object") m = m.dataUrl || m.url || m.base64 || m.b64 || m.ref || null;
    if (!m) return null;
    if (estData(m)) return m;
    if (estUrl(m)) { try { var r = await fetch(m); return await blobDataUrl(await r.blob()); } catch (e) { return m; } }
    if (estB64(m)) return "data:image/webp;base64," + m;
    return null;
  }
  async function alleger(src, maxL, maxH, q) {
    var du = await versDataUrl(src); if (!du) return null;
    var im = await charger(du);
    var r = Math.min(maxL / im.width, maxH / im.height, 1);
    var c = document.createElement("canvas");
    c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", q || 0.82);
  }

  /* ---------------- file d'attente ---------------- */
  var file = [], actif = 0;
  function enfiler(t) { return new Promise(function (res, rej) { file.push({ t: t, res: res, rej: rej }); pompe(); }); }
  function pompe() {
    while (actif < C.concurrence && file.length) {
      var j = file.shift(); actif++;
      j.t().then(function (v) { actif--; j.res(v); pompe(); }, function (e) { actif--; j.rej(e); pompe(); });
    }
  }

  /* ---------------- les trois adaptateurs ---------------- */
  async function texte(prompt) {
    if (trouve.texte) { try { var t = await trouve.texte.f(prompt, { sansHistorique: true, silencieux: true }); if (t) return t; } catch (e) {} }
    if (!C.texte) throw new Error("aucun modèle texte : renseigne Cablage.config.texte");
    var j = await requete("/chat/completions", {
      model: C.texte,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, max_tokens: 900
    });
    return j.choices[0].message.content;
  }
  async function texteJSON(p) {
    var t = await texte(p);
    if (/\{[\s\S]*\}/.test(t)) return t;
    return texte(p + "\n\nRappel : réponds UNIQUEMENT par le JSON compact, sans texte autour, sans balises.");
  }

  async function vision(media, question) {
    if (trouve.vision) { try { var v = await trouve.vision.f(media, question); if (v) return v; } catch (e) {} }
    if (!C.vision) throw new Error("aucun modèle vision : renseigne Cablage.config.vision");
    var du = await versDataUrl(media);
    var j = await requete("/chat/completions", {
      model: C.vision,
      messages: [{ role: "user", content: [
        { type: "text", text: question },
        { type: "image_url", image_url: { url: du } }
      ] }],
      temperature: 0, max_tokens: 400
    });
    return j.choices[0].message.content;
  }

  async function image(o) {
    if (trouve.image) { try { var im = await trouve.image.f(o); if (im) return await normaliser(im); } catch (e) {} }
    if (!C.image) throw new Error("aucun modèle image : renseigne Cablage.config.image");
    var body = {
      model: o.model || C.image,
      prompt: o.prompt,
      negative_prompt: o.negative,
      seed: o.seed,
      width: o.width || C.taille[0],
      height: o.height || C.taille[1],
      format: "webp",
      hide_watermark: true
    };
    if (o.mediaId) {
      var du = await versDataUrl(o.mediaId);
      if (du) { body.image = du.split(",")[1]; body.strength = o.retry ? 0.55 : 0.7; }
    }
    var j = await requete("/image/generate", body);
    var b64 = j.images && j.images[0];
    if (!b64) throw new Error("réponse image vide");
    return { dataUrl: estData(b64) ? b64 : "data:image/webp;base64," + b64, seed: j.seed != null ? j.seed : o.seed };
  }
  async function normaliser(m) { return { dataUrl: await versDataUrl(m), seed: null }; }

  function brancher(o) {
    if (o.texte) trouve.texte = { f: o.texte, nom: "manuel" };
    if (o.vision) trouve.vision = { f: o.vision, nom: "manuel" };
    if (o.image) trouve.image = { f: o.image, nom: "manuel" };
    return diagnostic();
  }

  /* ---------------- enveloppes passées au verrou ---------------- */
  function outils() {
    detecter();
    return {
      llm: function (p) { return enfiler(function () { return texteJSON(p); }); },
      vision: function (m, q) { return enfiler(function () { return vision(m, q); }); },
      generer: function (a) { return enfiler(function () { return image(a); }); }
    };
  }

  async function planche(nom, o) {
    o = Object.assign({}, outils(), o || {});
    var img = await F.verrou.planche(nom, o);
    if (!img) return null;
    var petit = await alleger(img.dataUrl, 512, 768);
    await F.upsert(Object.assign({}, await F.get(nom), { portrait: petit }));
    return img;
  }

  async function generer(nom, action, decor, o) {
    o = Object.assign({}, outils(), o || {});
    var img = await F.verrou.generer(nom, action, decor, o);
    if (img) await F.upsert(Object.assign({}, await F.get(nom), { derniere_image: await alleger(img.dataUrl, 448, 672) }));
    return img;
  }

  /* ---------------- affichage ---------------- */
  function css() {
    if (document.getElementById("sfImgCss")) return;
    var s = document.createElement("style"); s.id = "sfImgCss";
    s.textContent = ".sf-imgrow{margin:8px 0;display:flex;flex-direction:column;gap:5px;align-items:flex-start}"
      + ".sf-img{max-width:min(360px,80%);border-radius:12px;border:1px solid #2c2c35;display:block}"
      + ".sf-cap{font-size:11.5px;color:#8e8e9a;font-style:italic}";
    document.head.appendChild(s);
  }
  function afficher(media, legende) {
    var list = document.getElementById("messageListEl");
    if (!list || !media) return null;
    css();
    var row = document.createElement("div"); row.className = "sf-imgrow";
    var img = document.createElement("img"); img.className = "sf-img"; img.src = media.dataUrl || media;
    row.appendChild(img);
    if (legende) { var cap = document.createElement("div"); cap.className = "sf-cap"; cap.textContent = legende; row.appendChild(cap); }
    list.appendChild(row); list.scrollTop = list.scrollHeight;
    return img;
  }

  /* ---------------- déclencheur [IMAGE] ---------------- */
  var DIRECTIVE = [
    "[IMAGE — DIRECTIVE]",
    "Quand la scène mérite une image, ajoute à la fin, juste avant les blocs [FICHE] :",
    '[IMAGE]{"personnages":["Max"],"action":"assis au bord du lit, torse nu","decor":"chambre d hôtel, petit matin","cadrage":"medium shot, waist up"}[/IMAGE]',
    "personnages : les noms présents sur l'image, 1 à 3, tels qu'écrits dans leurs fiches.",
    "cadrage : wide shot | full body shot | medium shot | close-up.",
    "Un seul bloc [IMAGE] par réponse, et seulement si une image apporte quelque chose."
  ].join("\n");

  var dejaVus = new WeakSet(), dernier = "";
  function lireBloc(txt) {
    var m = /\[IMAGE\]([\s\S]*?)\[\/IMAGE\]/i.exec(txt);
    if (!m) return null;
    try { return JSON.parse(m[1].replace(/^[^{]*/, "").replace(/[^}]*$/, "")); } catch (e) { return null; }
  }
  async function traiter(txt) {
    var d = lireBloc(txt); if (!d || !d.personnages || !d.personnages.length) return;
    var emp = JSON.stringify([d.personnages, d.action, d.decor, d.cadrage]);
    if (emp === dernier) return; dernier = emp;
    for (var i = 0; i < Math.min(d.personnages.length, 3); i++) {
      var nom = d.personnages[i];
      try {
        var img = await generer(nom, d.action, d.decor, { cadrage: d.cadrage });
        afficher(img, nom + (d.action ? " — " + d.action : ""));
      } catch (e) { console.warn("[cablage] " + nom + " : " + e.message); }
    }
  }
  function surveiller() {
    var list = document.getElementById("messageListEl");
    if (!list) { setTimeout(surveiller, 800); return; }
    new MutationObserver(function (muts) {
      muts.forEach(function (mu) {
        Array.prototype.forEach.call(mu.addedNodes, function (n) {
          if (n.nodeType !== 1 || dejaVus.has(n)) return;
          dejaVus.add(n);
          var t = n.textContent || "";
          if (t.indexOf("[IMAGE]") !== -1) setTimeout(function () { traiter(t); }, 60);
        });
      });
    }).observe(list, { childList: true, subtree: true });
  }

  /* ---------------- diagnostic ---------------- */
  function detecter() {
    trouve.texte = trouve.texte || cherche(["App.Api.chat", "App.LLM.chat", "App.Core.chat", "App.chat", "App.sendChat", "App.Core.texte"]);
    trouve.vision = trouve.vision || cherche(["App.Api.vision", "App.LLM.vision", "App.Core.vision", "App.vision", "App.Vision.analyser"]);
    trouve.image = trouve.image || cherche(["App.Api.image", "App.Images.generate", "App.Image.generate", "App.generateImage", "App.Core.image"]);
    try {
      var AC = window.App && window.App.Core;
      if (AC) {
        if ((!trouve.texte || trouve.texte.nom !== "manuel") && typeof AC.generateText === "function")
          trouve.texte = { f: function (p) { return AC.generateText({ instruction: p, maxTokens: 900, temperature: 0.2 }); }, nom: "App.Core.generateText" };
        if ((!trouve.vision || trouve.vision.nom !== "manuel") && typeof AC.visionLook === "function")
          trouve.vision = { f: function (m, q) { return AC.visionLook(m, q); }, nom: "App.Core.visionLook" };
        if ((!trouve.image || trouve.image.nom !== "manuel") && typeof AC.generateImage === "function")
          trouve.image = { f: function (o) {
            var res = (o.width && o.height) ? (o.width + "x" + o.height) : (C.taille[0] + "x" + C.taille[1]);
            return AC.generateImage(o.prompt, { negativePrompt: o.negative, seed: o.seed, resolution: res });
          }, nom: "App.Core.generateImage" };
      }
    } catch (e) {}
    return trouve;
  }

  function diagnostic() {
    depuisApp();
    detecter();
    var l = {
      "clé API": trouve.cle || (C.cle ? "config" : "MANQUANTE"),
      "adaptateur texte": trouve.texte ? trouve.texte.nom : (C.texte ? "API directe (" + C.texte + ")" : "MANQUANT"),
      "adaptateur vision": trouve.vision ? trouve.vision.nom : (C.vision ? "API directe (" + C.vision + ")" : "MANQUANT"),
      "adaptateur image": trouve.image ? trouve.image.nom : (C.image ? "API directe (" + C.image + ")" : "MANQUANT"),
      "base": C.base
    };
    try { console.table(l); } catch (e) { console.log(l); }
    return l;
  }

  window.Cablage = {
    config: C,
    brancher: brancher,
    diagnostic: diagnostic,
    planche: planche,
    generer: generer,
    afficher: afficher,
    texte: texte, texteJSON: texteJSON, vision: vision, image: image,
    versDataUrl: versDataUrl, alleger: alleger,
    directive: function () { return DIRECTIVE; },
    imageMaintenant: function (nom, action, decor, o) { return generer(nom, action, decor, o).then(function (i) { afficher(i, nom); return i; }); },
    boot: function () { diagnostic(); if (C.auto) surveiller(); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { Cablage.boot(); });
  else Cablage.boot();
})();
