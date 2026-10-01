// Sofia – Chargeur de l'Atelier (couche technique)
//
// C'est la raison pour laquelle Sofia peut réellement modifier son propre code source.
// Ses modules sont des fichiers sous src/*.js, importés statiquement par index.html
// – un navigateur en cours d'exécution ne charge jamais deux fois un module, on ne
// peut donc pas « réécrire » un fichier à la volée. La solution : index.html
// n'importe plus les modules directement, mais via `bootModules()` ici.
//
//   SANS patch (cas normal) : chaque chemin est chargé tel quel, via exactement
//   l'URL absolue qu'utiliserait aussi un import statique. Pas de Blob, pas de
//   fetch supplémentaire, même identité de module, même comportement.
//
//   AVEC patch : le fichier source est récupéré, le patch (find → replace) y est
//   appliqué, et le résultat est importé comme module Blob. Les imports relatifs
//   à l'intérieur d'un module ainsi construit sont réécrits vers les URL absolues
//   (elles aussi construites ou originales), afin qu'il n'existe toujours qu'UNE
//   seule instance du module par fichier.
//
// Si un module patché échoue à l'import (erreur de syntaxe, exception au
// chargement), le chargeur retombe silencieusement sur le fichier ORIGINAL et met
// le patch en quarantaine – un patch cassé ne peut donc pas rendre l'app
// inactive.
//
// L'ensemble des patches est écrit par src/atelier.js (App.Atelier) dans
// IndexedDB 'sofia_atelier_v1'. Le chargeur ne fait que le lire.

const DB_NAME = 'sofia_atelier_v1';
const DB_VERSION = 1;
const STORE = 'meta';
const KEY = 'log';
const FLAG_KEY = 'sofia_atelier_active_v1';
// Anciens noms (avant le renommage) : lus une fois pour migrer, puis abandonnés.
const OLD_DB_NAME = 'enya_atelier_v1';
const OLD_FLAG_KEY = 'enya_atelier_active_v1';

// Détection (volontairement large) : trouve chaque chemin .js relatif dans une
// chaîne. Pour repérer les dépendances, trop vaut mieux que trop peu – ce qui
// n'existe pas est écarté de toute façon au chargement.
// Pour le REMPLACEMENT dans le code source, c'est en revanche IMPORT_SPEC_RE qui
// s'applique : seuls de vrais spécificateurs d'import doivent être réécrits.
// Sinon la liste de chemins dans src/selfupdate.js (un champ de données, pas un
// import) serait par exemple détruite.
const LOCAL_SPEC_RE = /(['"])((?:\.\.?\/|\/)[^'"\n]+?\.js)\1/g;
const IMPORT_SPEC_RE = /(\b(?:import\s*\(\s*|from\s+|import\s+))(['"])((?:\.\.?\/|\/)[^'"\n]+?\.js)\2/g;

// ---- Chiffrement (Ronde 66) ------------------------------------------------
// Un module chiffré est un simple enregistrement sur le disque :
//   /*SOFIA-ENC1[gz]*/ + base64(iv) + "." + base64(ciphertext)
// `gz` signifie : le clair a été compressé en gzip avant le chiffrement. Cela
// garde l'enregistrement petit (du base64 d'octets aléatoires ne se compresse pas
// lui-même, mais le code source se compresse très bien). Le chargeur reconnaît la
// marque, déchiffre avec la clé que fournit le verrou d'accès (index.html)
// (window.SofiaEnc.key en base64, AES-128-GCM, clé = les 16 premiers octets de
// sha256(norm(clé) + "|sofia-enc-v1")), décompresse le cas échéant et importe le
// résultat comme module Blob. Si la clé est absente (verrouillé), bootModules ne
// charge pas le graphe du tout – le verrou affiche le panneau de blocage et
// recharge après déverrouillage ; la clé est alors disponible.
export const ENC_PREFIX = '/*SOFIA-ENC1';

let _lastReport = null;
let _depsCache = null;
let _texts = null;
let _encSet = null;
let _encKey = null;
let _encKeyTried = false;

// ---- Couche de protection (Ronde 99) ---------------------------------------
// Trois choses qui rendent la copie coûteuse, voire traçable. Honnêtement :
// qui veut vraiment le code l'obtient – il tourne dans son navigateur. Cette
// couche ne coûte rien au visiteur honnête et complique la vie du copieur, voire
// laisse des traces :
//
//   1. ORIGINE (contrôle d'origine) : les modules ne démarrent que sur un
//      générateur dont l'identifiant public figure dans la liste d'autorisation
//      (ci-dessous ou dans la commande à distance). Une page copiée sous un
//      identifiant étranger reste bloquée. Exceptions : aperçu d'éditeur non
//      enregistré, propriétaire disposant de la clé d'accès, et environnements
//      sans identifiant (en cas de doute, NE PAS bloquer).
//   2. FILIGRANE (marque d'exemplaire) : à la construction, chaque module reçoit
//      une ligne de commentaire en tête qui identifie cet exemplaire – un
//      identifiant aléatoire généré localement plus quelques données grossières.
//      Une copie transmise porte ainsi la trace de qui l'a tirée.
//   3. COMMANDE À DISTANCE (petit fichier de configuration) : un minuscule
//      fichier public peut remplacer la liste d'autorisation, la durée d'essai et
//      « gratuit pour tous » – sans que index.html ait besoin d'être republié.
//      S'il tombe, les valeurs intégrées s'appliquent (l'app démarre donc
//      toujours).
//
// En complément, un registre secondaire (Ledger) : au premier démarrage d'un
// appareil, son identifiant est écrit avec quelques données grossières dans un
// fichier texte public. Cela ne fonctionne que dans une version enregistrée et
// seulement si upload-plugin est chargé ; les erreurs sont avalées, l'app
// n'attend jamais après lui.
const WM_KEY = 'sofia_mark_v1';
const WM_T_KEY = 'sofia_mark_t_v1';
const WM_LOGGED_KEY = 'sofia_mark_logged_v1';
const REMOTE_CACHE_KEY = 'sofia_remote_v1';
const OFFICIAL_NAME = 's-o-f-i-a';
const OFFICIAL_ORIGINS = ['fc57a86cb9204723c1c9b830ebe27432'];
const REMOTE_FILE = 'cfg-6k3q9v2m8w4zt7ph5r1jnc0d';
const REMOTE_URL = 'https://editable.uploads.dev/file/' + OFFICIAL_NAME + '/' + REMOTE_FILE;
let _mark = null;
let _remote = null;
let _remoteTried = false;

function randHex(bytes) {
  const u = new Uint8Array(bytes);
  try { crypto.getRandomValues(u); } catch (e) { for (let i = 0; i < u.length; i++) u[i] = Math.floor(Math.random() * 256); }
  let s = '';
  for (let i = 0; i < u.length; i++) s += (u[i] + 256).toString(16).slice(1);
  return s;
}

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

/**
 * Identifiant de cet exemplaire de navigateur. Aléatoire, local, sans serveur – il
 * est volontairement stable (localStorage), afin que la même copie porte toujours
 * la même trace.
 */
export function copyMark() {
  if (_mark) return _mark;
  let id = lsGet(WM_KEY);
  if (!(/^[0-9a-f]{24}$/.test(id || ''))) { id = randHex(12); lsSet(WM_KEY, id); }
  let first = Number(lsGet(WM_T_KEY)) || 0;
  if (!first || first > Date.now() + 86400000) { first = Date.now(); lsSet(WM_T_KEY, String(first)); }
  // Figer les données UNE FOIS : sinon chaque module du même démarrage porterait
  // une ligne différente dès que la fenêtre change au démarrage.
  let lang = '?', scr = '?', tz = 0;
  try { lang = String(navigator.language || '?').slice(0, 5); } catch (e) {}
  try { scr = screen.width + 'x' + screen.height; } catch (e) {}
  try { tz = -new Date().getTimezoneOffset(); } catch (e) {}
  _mark = { id: id, first: first, lang: lang, scr: scr, tz: tz };
  try { window.SofiaMark = _mark; } catch (e) {}
  return _mark;
}

function markStamp() {
  const m = copyMark();
  let iso = '';
  try { iso = new Date(m.first).toISOString().slice(0, 16) + 'Z'; } catch (e) {}
  return '/* NOTICE - personal copy ' + m.id + ' - ' + iso + ' - ' + m.lang + ' ' + m.scr + ' tz' + m.tz
    + ' - copying or redistribution is not permitted */\n';
}

// ---- Commande à distance ---------------------------------------------------
function validRemote(o) {
  if (!o || typeof o !== 'object') return null;
  const out = {};
  if (Array.isArray(o.origins)) {
    const list = o.origins.filter((x) => typeof x === 'string' && /^[0-9a-f]{32}$/.test(x));
    if (list.length) out.origins = list;
  }
  if (typeof o.trialMs === 'number' && o.trialMs >= 3600000 && o.trialMs <= 31536000000) out.trialMs = Math.round(o.trialMs);
  if (typeof o.free === 'boolean') out.free = o.free;
  if (typeof o.ledger === 'boolean') out.ledger = o.ledger;
  out.v = (typeof o.v === 'number') ? o.v : 1;
  out.ts = Date.now();
  return out;
}

/**
 * Récupère le petit fichier de configuration (s'il existe) et le place sous
 * window.SofiaRemote. Ne lève jamais, ne bloque jamais le démarrage : en cas
 * d'erreur, le dernier état mémorisé s'applique, sinon les valeurs intégrées.
 */
export async function loadRemote() {
  if (_remoteTried) return _remote;
  _remoteTried = true;
  let cfg = null;
  try {
    const res = await fetch(REMOTE_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (res && res.ok) cfg = validRemote(await res.json());
  } catch (e) { cfg = null; }
  if (!cfg) {
    try { cfg = validRemote(JSON.parse(lsGet(REMOTE_CACHE_KEY) || 'null')); } catch (e) { cfg = null; }
    if (cfg && Date.now() - (cfg.ts || 0) > 7 * 86400000) cfg = null;
  } else {
    lsSet(REMOTE_CACHE_KEY, JSON.stringify(cfg));
  }
  _remote = cfg;
  if (cfg) {
    try { window.SofiaRemote = cfg; } catch (e) {}
    // Le verrou en est informé, afin de pouvoir appliquer par ex.
    // « gratuit pour tous » immédiatement, sans que index.html ait besoin d'être
    // republié.
    try {
      window.dispatchEvent(new CustomEvent('sofia-remote', { detail: cfg }));
    } catch (e) {}
    try {
      const g = window.SofiaGate;
      if (g && typeof g.applyRemote === 'function') g.applyRemote(cfg);
    } catch (e) {}
  }
  return cfg;
}

export function remote() { return _remote || null; }

/** Liste d'autorisation : la commande à distance prime sur les identifiants intégrés. */
export function allowedOrigins() {
  const r = _remote || (function () { try { return window.SofiaRemote; } catch (e) { return null; } })();
  if (r && Array.isArray(r.origins) && r.origins.length) return r.origins;
  return OFFICIAL_ORIGINS;
}

/**
 * Le graphe de modules a-t-il le droit de démarrer ici ? En cas de doute, oui
 * (une erreur dans ce contrôle ne doit jamais bloquer le propriétaire).
 */
export function originAllowed() {
  try {
    if (window.generatorIsUnsaved === true) return true;          // aperçu d'éditeur
    const pub = String(window.generatorPublicId || '');
    if (!/^[0-9a-f]{32}$/.test(pub)) return true;                 // sans identifiant, ne pas bloquer
    if (allowedOrigins().indexOf(pub) >= 0) return true;
    const g = window.SofiaGate;
    if (g && typeof g.accessMode === 'function' && g.accessMode() === 'key') return true;
    return false;
  } catch (e) { return true; }
}

/** Panneau d'information pour une copie non autorisée (style propre, pas le CSS de l'app). */
function copyNotice() {
  const draw = function () {
    try {
      if (document.getElementById('sofiaCopyNotice')) return;
      const d = document.createElement('div');
      d.id = 'sofiaCopyNotice';
      d.setAttribute('style', 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:#0d0d12;color:#e8e8ef;font:15px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;visibility:visible;opacity:1');
      const box = document.createElement('div');
      box.setAttribute('style', 'max-width:560px');
      const h = document.createElement('p');
      h.setAttribute('style', 'margin:0 0 10px;font-size:19px;font-weight:700');
      h.textContent = 'This copy of Sofia is not authorised.';
      const p1 = document.createElement('p');
      p1.setAttribute('style', 'margin:0 0 10px;color:#b9b9c6');
      p1.textContent = 'Sofia only runs on her original page. This copy carries a traceable mark ('
        + copyMark().id + ').';
      const p2 = document.createElement('p');
      p2.setAttribute('style', 'margin:0;color:#8f8fa0;font-size:13px');
      p2.textContent = 'Original: perchance.org/' + OFFICIAL_NAME;
      box.appendChild(h); box.appendChild(p1); box.appendChild(p2);
      d.appendChild(box);
      document.body.appendChild(d);
    } catch (e) {}
  };
  if (document.body) draw();
  else setTimeout(draw, 50);
}

/**
 * Registre secondaire (Ledger) – UNIQUEMENT si la commande à distance dit
 * `ledger: true`, donc désactivé par défaut. Raison : un registre public
 * publierait des données grossières des visiteurs et contredirait la promesse de
 * Sofia « tout reste dans ton navigateur ». C'est pourquoi chaque appareil écrit
 * son propre petit fichier (`wm-<identifiant>`) – on ne le lit donc que si l'on
 * dispose d'un identifiant issu d'une copie repérée. Jamais bloquant, les erreurs
 * sont avalées.
 */
function appendLedger() {
  try {
    const r = _remote || (function () { try { return window.SofiaRemote; } catch (e) { return null; } })();
    if (!r || r.ledger !== true) return;
    if (window.generatorIsUnsaved === true) return;
    const R = (typeof root !== 'undefined' && root) ? root : null;
    const up = R && R.uploadPlugin;
    if (!up || !up.editable || typeof up.editable.set !== 'function') return;
    const last = Number(lsGet(WM_LOGGED_KEY)) || 0;
    if (last && Date.now() - last < 86400000) return;      // au plus une fois par jour
    lsSet(WM_LOGGED_KEY, String(Date.now()));
    const m = copyMark();
    let ua = '?';
    try { ua = String(navigator.userAgent || '?').slice(0, 160); } catch (e) {}
    let gen = '', pub = '';
    try { gen = String(window.generatorName || ''); } catch (e) {}
    try { pub = String(window.generatorPublicId || ''); } catch (e) {}
    const entry = {
      id: m.id, first: new Date(m.first).toISOString(), lang: m.lang, screen: m.scr, tz: m.tz,
      ua: ua, generator: gen, publicId: pub, seenAt: new Date().toISOString()
    };
    up.editable.set('wm-' + m.id, JSON.stringify(entry, null, 1) + '\n').catch(function () {});
  } catch (e) {}
}

export function lastBootReport() { return _lastReport; }

function b64ToBytes(s) {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

// La clé de déchiffrement est-elle déjà là ? (Le verrou pose window.SofiaEnc.)
export function encActive() {
  try { return !!(window.SofiaEnc && window.SofiaEnc.key); } catch (e) { return false; }
}
// Le chiffrement est-il activé pour cette page ?
export function encRequired() {
  try { return !!window.__sofiaEncActive; } catch (e) { return false; }
}

async function encKey() {
  if (_encKey) return _encKey;
  // Tant qu'aucune clé n'est disponible, ne rien mémoriser : le verrou peut
  // renseigner window.SofiaEnc à tout moment (par ex. après le déverrouillage), et
  // la clé doit alors vraiment être importée.
  if (!encActive()) return null;
  if (_encKeyTried) return null;
  _encKeyTried = true;
  try {
    const raw = b64ToBytes(window.SofiaEnc.key);
    _encKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
  } catch (e) { _encKey = null; }
  return _encKey;
}

function bytesToB64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}

// Décomposer l'en-tête de l'enregistrement : { gz, iv, ct } – ou null si aucune marque ne le précède.
function parseEnc(text) {
  if (typeof text !== 'string' || text.indexOf(ENC_PREFIX) !== 0) return null;
  const end = text.indexOf('*/', ENC_PREFIX.length);
  if (end < 0) return null;
  const body = text.slice(end + 2);
  const dot = body.indexOf('.');
  if (dot < 0) return null;
  return { gz: text.slice(ENC_PREFIX.length, end) === 'gz', iv: body.slice(0, dot), ct: body.slice(dot + 1) };
}

async function gunzipBytes(bytes) {
  if (typeof DecompressionStream === 'undefined') throw new Error('DecompressionStream absent');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decryptWith(parsed, key) {
  let pt = new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(parsed.iv) },
    key,
    b64ToBytes(parsed.ct)
  ));
  if (parsed.gz) pt = await gunzipBytes(pt);
  return new TextDecoder().decode(pt);
}

// Le chemin chaud : la clé en mémoire (le verrou pose window.SofiaEnc).
async function decryptMarked(text) {
  try {
    const key = await encKey();
    if (!key) return null;
    const r = parseEnc(text);
    if (!r) return null;
    return await decryptWith(r, key);
  } catch (e) { return null; }
}

/**
 * Déchiffre un enregistrement avec une clé transmise explicitement (base64).
 * L'outil (src/enc-tool.js) en a besoin pour inspecter avec une clé saisie
 * manuellement ; le chargeur lui-même utilise decryptMarked.
 */
export async function decryptText(text, keyB64) {
  const r = parseEnc(text);
  if (!r) return null;
  const key = await crypto.subtle.importKey('raw', b64ToBytes(keyB64), { name: 'AES-GCM' }, false, ['decrypt']);
  return await decryptWith(r, key);
}

/**
 * Pendant de decryptMarked : construit l'enregistrement qui va sur le disque.
 * Utilisé exclusivement par le packer (src/enc-tool.js) – code mort à
 * l'exécution, mais présent ici pour que l'émetteur (packer) et le récepteur
 * (chargeur) tirent le même format du même fichier et ne puissent pas diverger.
 */
export async function encryptText(plain, keyB64) {
  const key = await crypto.subtle.importKey('raw', b64ToBytes(keyB64), { name: 'AES-GCM' }, false, ['encrypt']);
  let bytes = new TextEncoder().encode(plain);
  let gz = false;
  try {
    if (typeof CompressionStream !== 'undefined') {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
      const z = new Uint8Array(await new Response(stream).arrayBuffer());
      if (z.length) { bytes = z; gz = true; }
    }
  } catch (e) { gz = false; }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, bytes));
  return ENC_PREFIX + (gz ? 'gz' : '') + '*/' + bytesToB64(iv) + '.' + bytesToB64(ct);
}

function hasFlag() {
  try { return localStorage.getItem(FLAG_KEY) === '1' || localStorage.getItem(OLD_FLAG_KEY) === '1'; } catch (e) { return false; }
}
export function setFlag(on) {
  try {
    if (on) { localStorage.setItem(FLAG_KEY, '1'); localStorage.setItem(OLD_FLAG_KEY, '1'); }
    else { localStorage.removeItem(FLAG_KEY); localStorage.removeItem(OLD_FLAG_KEY); }
  } catch (e) {}
}

function openDb() {
  return new Promise((resolve, reject) => {
    let req;
    try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(key) {
  return openDb().then((d) => new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).get(key);
    r.onsuccess = () => resolve(r.result == null ? null : r.result);
    r.onerror = () => reject(r.error);
  })).catch(() => null);
}

function idbPut(key, value) {
  return openDb().then((d) => new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  })).catch(() => false);
}

// L'unique enregistrement : { v, version, patches: [], log: [], report: {} }
export async function readState() {
  const s = await idbGet(KEY);
  if (!s || typeof s !== 'object') return { v: 1, version: 0, patches: [], log: [], report: null };
  if (!Array.isArray(s.patches)) s.patches = [];
  if (!Array.isArray(s.log)) s.log = [];
  return s;
}

export async function writeState(state) {
  const s = state || { v: 1, version: 0, patches: [], log: [], report: null };
  s.v = 1;
  await idbPut(KEY, s);
  setFlag((s.patches || []).some((p) => p && p.on));
  return s;
}

export function resolveSpec(baseAbs, raw) {
  try {
    const u = new URL(raw, baseAbs);
    u.hash = '';
    return u.href;
  } catch (e) { return null; }
}

function isLocal(abs) {
  try { return abs.indexOf(location.origin + '/') === 0; } catch (e) { return false; }
}

async function textOf(abs) {
  if (!_texts) _texts = new Map();
  if (_texts.has(abs)) return _texts.get(abs);
  let t = null;
  try {
    const res = await fetch(abs, { cache: 'no-store' });
    if (res && res.ok) t = await res.text();
  } catch (e) { t = null; }
  if (typeof t === 'string' && t.indexOf(ENC_PREFIX) === 0) {
    if (!_encSet) _encSet = new Set();
    _encSet.add(abs);
    const plain = await decryptMarked(t);
    if (plain == null) {
      try { console.warn('[SofiaEnc] module chiffré sans clé valide : ' + abs.replace(location.origin, '')); } catch (e) {}
    }
    t = plain;
  }
  _texts.set(abs, t);
  return t;
}

function specsIn(text, re) {
  const rx = re || LOCAL_SPEC_RE;
  const out = [];
  let m;
  rx.lastIndex = 0;
  while ((m = rx.exec(text)) !== null) {
    const quote = m[m.length - 2];
    const raw = m[m.length - 1];
    const pre = m.length > 3 ? (m[1] || '') : '';
    out.push({ at: m.index, len: m[0].length, pre: pre, quote: quote, raw: raw });
  }
  return out;
}

async function depsOf(abs) {
  if (!_depsCache) _depsCache = new Map();
  if (_depsCache.has(abs)) return _depsCache.get(abs);
  const text = await textOf(abs);
  const list = [];
  if (text) {
    for (const s of specsIn(text)) {
      const dep = resolveSpec(abs, s.raw);
      if (dep && dep !== abs && isLocal(dep) && !list.includes(dep)) list.push(dep);
    }
  }
  _depsCache.set(abs, list);
  return list;
}

/**
 * Tous les modules .js locaux atteignables depuis les racines (parcours en
 * largeur sur les spécificateurs d'import relatifs). Le packer (src/enc-tool.js)
 * a besoin exactement de cette liste : sinon des modules importés seulement
 * indirectement (par ex. chess-pieces.js, chess-pgn.js) resteraient en clair sur
 * le disque.
 */
export async function moduleClosure(roots) {
  const seen = new Set();
  const out = [];
  const queue = [];
  for (const r of roots || []) {
    const a = resolveSpec(location.href, r);
    if (a && !seen.has(a)) { seen.add(a); queue.push(a); }
  }
  while (queue.length) {
    const a = queue.shift();
    // Ne retenir que les chemins qui existent vraiment. Certains modules
    // contiennent dans des commentaires ou des gabarits des chaînes d'import
    // (par ex. "./src/selbst.js") qui se résoudraient relativement mais pointent
    // dans le vide – sinon elles finiraient comme chemins fantômes dans la passe
    // de chiffrement.
    if (await textOf(a) == null) continue;
    out.push(a);
    for (const d of await depsOf(a)) {
      if (!seen.has(d)) { seen.add(d); queue.push(d); }
    }
  }
  return out;
}

/**
 * find → replace sur un texte. Renvoie null si l'endroit ne s'y trouve plus –
 * le patch est alors périmé, pas cassé.
 */
function applyOne(text, p) {
  const find = String(p.find == null ? '' : p.find);
  if (!find) return null;
  if (p.all) {
    if (text.indexOf(find) < 0) return null;
    return text.split(find).join(String(p.replace == null ? '' : p.replace));
  }
  const i = text.indexOf(find);
  if (i < 0) return null;
  return text.slice(0, i) + String(p.replace == null ? '' : p.replace) + text.slice(i + find.length);
}

// Renommage : recopie une fois l'enregistrement de l'ancien nom vers le nouveau.
async function migrateLegacyStore() {
  try {
    if (lsGet(FLAG_KEY) !== '1' && lsGet(OLD_FLAG_KEY) === '1') lsSet(FLAG_KEY, '1');
    const cur = await idbGet(KEY);
    if (cur && typeof cur === 'object' && ((cur.patches || []).length || (cur.log || []).length || cur.version)) return;
    const old = await new Promise((res) => {
      try {
        const rq = indexedDB.open(OLD_DB_NAME);
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => res(null);
      } catch (e) { res(null); }
    });
    if (!old) return;
    let rec = null;
    try {
      if (old.objectStoreNames.contains(STORE)) {
        rec = await new Promise((res) => {
          try {
            const tx = old.transaction(STORE, 'readonly');
            const r = tx.objectStore(STORE).get(KEY);
            r.onsuccess = () => res(r.result == null ? null : r.result);
            r.onerror = () => res(null);
          } catch (e) { res(null); }
        });
      }
    } catch (e) {}
    try { old.close(); } catch (e) {}
    if (rec && typeof rec === 'object') {
      await idbPut(KEY, rec);
      try { indexedDB.deleteDatabase(OLD_DB_NAME); } catch (e) {}
    }
  } catch (e) {}
}

export async function bootModules(paths, opts) {
  opts = opts || {};
  try { await migrateLegacyStore(); } catch (e) {}
  const started = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const report = { ts: Date.now(), mode: 'plain', applied: [], stale: [], broken: [], built: [], ms: 0 };

  const abs = (p) => resolveSpec(location.href, p);
  const elapsed = () => Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - started);

  // Couche de protection (Ronde 99) : d'abord récupérer le petit fichier de
  // configuration (brièvement borné), puis le contrôle d'origine. Les deux ne
  // doivent pas retarder le démarrage – d'où la limite de temps.
  await Promise.race([loadRemote().catch(function () {}), new Promise(function (r) { setTimeout(r, 1500); })]);
  copyMark();
  if (!originAllowed()) {
    copyNotice();
    try { console.warn('[Sofia] copie sans autorisation d\'origine – les modules ne sont pas chargés. Identifiant : ' + String(window.generatorPublicId || '')); } catch (e) {}
    await new Promise(function () {});
  }

  // Chiffré et encore verrouillé : ne pas charger le graphe de modules du tout.
  // Le verrou affiche le panneau de blocage et recharge la page après le
  // déverrouillage – la clé est alors disponible et le graphe est reconstruit
  // déchiffré.
  if (encRequired() && !encActive()) {
    try { console.info('[SofiaEnc] verrouillé – les modules ne sont pas encore chargés.'); } catch (e) {}
    await new Promise(function () {});
  }
  try { appendLedger(); } catch (e) {}

  let state = null;
  if (hasFlag()) {
    try { state = await readState(); } catch (e) { state = null; }
  }
  const patches = ((state && state.patches) || []).filter((p) => p && p.on && p.path && p.find);
  if (!patches.length && !encRequired()) {
    // Rien à faire : charger tel quel. Ensuite inscrire le rapport comme "plain",
    // afin que l'interface n'affiche pas un rapport de patch périmé.
    // (index.html et src/atelier.js ont chacun leur propre exemplaire de ce
    // module, c'est pourquoi le rapport n'est pas seulement gardé en mémoire mais
    // dans IndexedDB – sinon l'Atelier ne verrait jamais le rapport de ce
    // démarrage.)
    const out = {};
    for (const p of paths) out[p] = await import(abs(p));
    report.ms = elapsed();
    _lastReport = report;
    let st = state;
    if (!st) { try { st = await readState(); } catch (e) { st = null; } }
    const old = st && st.report;
    if (old && (old.mode !== 'plain' || (Array.isArray(old.applied) && old.applied.length))) {
      try { st.report = report; await writeState(st); } catch (e) {}
    }
    return out;
  }

  report.mode = patches.length ? 'patched' : 'encrypted';
  const topPaths = paths.slice();
  const patchBy = new Map();
  for (const p of patches) {
    const a = abs(p.path);
    if (!a) continue;
    if (!patchBy.has(a)) patchBy.set(a, []);
    patchBy.get(a).push(p);
  }
  const hasPatch = (a) => patchBy.has(a);
  const patched = [];        // patches réellement appliqués
  const stale = [];
  const broken = [];

  const built = new Map();
  const building = new Set();
  const needCache = new Map();

  async function needsBuild(a, seen) {
    if (needCache.has(a)) return needCache.get(a);
    if (hasPatch(a)) { needCache.set(a, true); return true; }
    seen = seen || new Set();
    if (seen.has(a)) return false;
    seen.add(a);
    const deps = await depsOf(a);
    for (const d of deps) {
      if (await needsBuild(d, seen)) { needCache.set(a, true); return true; }
    }
    needCache.set(a, false);
    return false;
  }

  async function build(a) {
    if (built.has(a)) return built.get(a);
    if (building.has(a)) return a;                       // cycle : l'arête de retour reste originale
    const original = await textOf(a);
    if (original == null) { built.set(a, a); return a; }
    building.add(a);
    let text = original;
    // Les modules chiffrés ne sont qu'un enregistrement sur le disque et ne sont
    // jamais importables directement – ils ont toujours besoin d'un Blob
    // (déchiffré).
    let changed = !!(_encSet && _encSet.has(a));
    for (const p of patchBy.get(a) || []) {
      const next = applyOne(text, p);
      if (next == null) { stale.push({ id: p.id, path: p.path }); continue; }
      text = next;
      changed = true;
      patched.push({ id: p.id, path: p.path });
    }
    // Construire aussi les dépendances et réécrire les spécificateurs.
    // Si ce module devient un Blob, TOUS les imports locaux DOIVENT devenir
    // absolus : un module Blob n'a pas de base utilisable, un spécificateur
    // relatif y lève « Invalid relative url or base scheme isn't hierarchical ».
    // C'est pourquoi on construit d'abord toutes les cibles, puis on réécrit en
    // UNE seule passe – sinon le résultat dépendrait de l'ordre des imports.
    const specs = specsIn(text, IMPORT_SPEC_RE);
    const jobs = [];
    let anyBlobDep = false;
    for (const s of specs) {
      const dep = resolveSpec(a, s.raw);
      if (!dep || dep === a || !isLocal(dep)) continue;
      const url = await build(dep);
      const target = url || dep;
      if (target !== dep) anyBlobDep = true;
      jobs.push({ s: s, target: target, dep: dep });
    }
    if (changed || anyBlobDep) {
      for (let i = jobs.length - 1; i >= 0; i--) {
        const s = jobs[i].s;
        text = text.slice(0, s.at) + s.pre + s.quote + jobs[i].target + s.quote + text.slice(s.at + s.len);
        changed = true;
      }
    }
    // Dans un module Blob, `import.meta.url` serait l'URL blob:. Pour le code
    // source, l'URL d'origine est la bonne base (chess-piece-art.js en construit
    // le chemin vers son WebP) – on remplace donc l'expression par celle-ci, mais
    // seulement si un Blob est réellement construit.
    if (changed && text.indexOf('import.meta.url') >= 0) {
      text = text.split('import.meta.url').join(JSON.stringify(a));
    }
    // Filigrane (Ronde 99) : marquer cet exemplaire – seulement APRÈS les patches
    // et la réécriture des imports, pour qu'aucun patch ne passe à travers.
    if (changed) text = markStamp() + text;
    building.delete(a);
    if (!changed) { built.set(a, a); return a; }
    const blob = new Blob([text], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    built.set(a, url);
    report.built.push(a.replace(location.origin, ''));
    return url;
  }

  const out = {};
  for (const p of topPaths) {
    const a = abs(p);
    let url = a;
    try {
      url = await build(a);
    } catch (e) {
      url = a;
    }
    if (url !== a) {
      try {
        out[p] = await import(url);
        continue;
      } catch (e) {
        // Le patch a rendu le module inchargeable : quarantaine + original.
        broken.push({ path: p, error: String((e && e.message) || e).slice(0, 400) });
        for (const q of patchBy.get(a) || []) { q.on = false; q.broken = true; q.error = String((e && e.message) || e).slice(0, 400); }
        try { URL.revokeObjectURL(url); } catch (e2) {}
        built.set(a, a);
        // Les modules chiffrés ne sont qu'un enregistrement sur le disque – un
        // repli sur l'URL d'origine lèverait une erreur de syntaxe.
        if (_encSet && _encSet.has(a)) throw e;
      }
    }
    // Un module manquant (404) ne doit jamais bloquer tout le démarrage :
    // il est noté comme cassé et le reste démarre sans lui.
    try {
      out[p] = await import(a);
    } catch (e) {
      broken.push({ path: p, error: 'missing: ' + String((e && e.message) || e).slice(0, 200) });
      out[p] = null;
    }
  }

  report.applied = patched.map((x) => x.id);
  report.stale = stale.map((x) => x.id);
  report.broken = broken;
  report.ms = elapsed();
  _lastReport = report;

  if (state && (stale.length || broken.length)) {
    try {
      state.report = report;
      await writeState(state);
    } catch (e) {}
  } else if (state) {
    try { state.report = report; await writeState(state); } catch (e) {}
  }
  try {
    if (typeof console !== 'undefined' && console.info) {
      console.info('[Atelier] patches: ' + patched.length + ' applied, ' + stale.length + ' stale, ' + broken.length + ' broken'
        + ' · modules built: ' + report.built.length + ' · ' + report.ms + 'ms');
    }
  } catch (e) {}
  return out;
}
