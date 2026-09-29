export const ENC_PREFIX = "/*SOFIA-ENC1gz*/";
const ATELIER_DB = "enya_atelier_v1";
const ATELIER_STORE = "state";
const ATELIER_KEY = "atelier";
const FLAGS_KEY = "sofia_boot_flags_v1";
const NO_PATCH = ["src/atelier-loader.js", "index.html", "main.pjs"];

export function currentKey() {
  try { return (window.SofiaEnc && window.SofiaEnc.key) || ""; } catch (e) { return ""; }
}
function isEnc(t) { return typeof t === "string" && t.indexOf(ENC_PREFIX) === 0; }

function b64ToBytes(s) {
  const b = atob(String(s));
  const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
function bytesToB64(u) {
  let s = "";
  for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
  return btoa(s);
}
async function importEncKey(keyB64) {
  return crypto.subtle.importKey("raw", b64ToBytes(keyB64), "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function gzipBytes(u8) {
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());
}
async function gunzipBytes(u8) {
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}
export async function encryptText(plain, keyB64) {
  const key = await importEncKey(keyB64);
  const pt = await gzipBytes(new TextEncoder().encode(String(plain)));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, pt));
  return ENC_PREFIX + bytesToB64(iv) + "." + bytesToB64(ct);
}
export async function decryptText(rec, keyB64) {
  const body = String(rec).slice(ENC_PREFIX.length);
  const dot = body.indexOf(".");
  const iv = b64ToBytes(body.slice(0, dot));
  const ct = b64ToBytes(body.slice(dot + 1));
  const key = await importEncKey(keyB64);
  const pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct));
  return new TextDecoder().decode(await gunzipBytes(pt));
}

function openDb() {
  return new Promise((resolve, reject) => {
    let req;
    try { req = indexedDB.open(ATELIER_DB, 1); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(ATELIER_STORE)) d.createObjectStore(ATELIER_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function blankState() { return { v: 1, version: 0, patches: [], staged: [], log: [], report: null }; }
export async function readState() {
  try {
    const d = await openDb();
    const s = await new Promise((res, rej) => {
      const q = d.transaction(ATELIER_STORE, "readonly").objectStore(ATELIER_STORE).get(ATELIER_KEY);
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
    if (s && typeof s === "object") {
      if (!Array.isArray(s.patches)) s.patches = [];
      if (!Array.isArray(s.staged)) s.staged = [];
      return s;
    }
  } catch (e) {}
  return blankState();
}
export async function writeState(st) {
  try {
    const d = await openDb();
    await new Promise((res, rej) => {
      const tx = d.transaction(ATELIER_STORE, "readwrite");
      tx.objectStore(ATELIER_STORE).put(st || blankState(), ATELIER_KEY);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
    return true;
  } catch (e) { return false; }
}

let _flags = {};
try { _flags = JSON.parse(localStorage.getItem(FLAGS_KEY) || "{}") || {}; } catch (e) {}
export function setFlag(k, v) {
  _flags[String(k)] = v;
  try { localStorage.setItem(FLAGS_KEY, JSON.stringify(_flags)); } catch (e) {}
}

function normalizeModule(code) {
  let s = String(code == null ? "" : code);
  s = s.replace(/\bexport\s+default\s+/g, "const __default__ = ");
  s = s.replace(/\bexport\s*\*\s*from\s*['"][^'"]*['"]\s*;?/g, "");
  s = s.replace(/\bexport\s*\{[^}]*\}\s*(?:from\s*['"][^'"]*['"]\s*)?;?/g, "");
  s = s.replace(/^[ \t]*import[\s\S]*?from\s*['"][^'"]*['"]\s*;?/gm, "");
  s = s.replace(/^[ \t]*import\s*['"][^'"]*['"]\s*;?/gm, "");
  s = s.replace(/^[ \t]*export\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/gm, "");
  s = s.replace(/\bimport\s*\.\s*meta\b/g, '({url:""})');
  s = s.replace(/\bimport\s*\(/g, "(((");
  return s;
}
function syntaxError(code) {
  const s = normalizeModule(code);
  try { new Function(s); return null; }
  catch (e1) {
    const m1 = String((e1 && e1.message) || e1);
    if (/await|yield/i.test(m1)) {
      try { new Function("return (async () => {\n" + s + "\n});"); return null; }
      catch (e2) { return String((e2 && e2.message) || e2); }
    }
    return m1;
  }
}
function countOf(text, find) {
  if (!find) return 0;
  let n = 0, i = 0;
  while ((i = text.indexOf(find, i)) >= 0) { n++; i += find.length; }
  return n;
}
function tryPatch(text, p) {
  const find = String((p && p.find) == null ? "" : p.find);
  if (!find) return { ok: false, error: "empty-find" };
  const n = countOf(text, find);
  if (!n) return { ok: false, error: "not-found" };
  if (n > 1 && !p.all) return { ok: false, error: "ambiguous" };
  const rep = String((p && p.replace) == null ? "" : p.replace);
  const after = p.all ? text.split(find).join(rep) : text.slice(0, text.indexOf(find)) + rep + text.slice(text.indexOf(find) + find.length);
  const err = syntaxError(after);
  if (err) return { ok: false, error: "syntax: " + err };
  return { ok: true, text: after };
}

function toAbs(p) { return new URL(String(p), document.baseURI).href; }
function relOf(u) {
  let s = String(u);
  try { s = new URL(s, document.baseURI).pathname; } catch (e) {}
  const i = s.indexOf("/src/");
  if (i >= 0) return s.slice(i + 1);
  return s.replace(/^\.\//, "").replace(/^\/+/, "");
}
function normRel(p) { return String(p || "").trim().replace(/^\.\//, "").replace(/^\/+/, ""); }
const SPEC_RE = /((?:import\s+(?:[^'";]*?\s+from\s+)?|export\s+(?:[^'";]*?\s+from\s+)?|import\s*\(\s*)['"])(\.[^'"]+)((?:['"]))/g;
function scanSpecs(text) {
  const out = [];
  SPEC_RE.lastIndex = 0;
  let m;
  while ((m = SPEC_RE.exec(text))) {
    const s = m[2].split("?")[0].split("#")[0];
    if (/\.m?js$/.test(s)) out.push(s);
  }
  return out;
}
function resolveSpec(spec, fromAbs) {
  try {
    const u = new URL(spec, fromAbs);
    if (u.origin !== new URL(document.baseURI).origin) return null;
    return u.href.split("?")[0].split("#")[0];
  } catch (e) { return null; }
}
async function fetchText(abs) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(abs, { cache: "no-store" });
      if (r && r.ok) return await r.text();
    } catch (e) {}
    if (a < 2) { try { await new Promise((res) => setTimeout(res, 400 * (a + 1))); } catch (e) {} }
  }
  return null;
}

export async function moduleClosure(paths) {
  const key = currentKey();
  const roots = (paths || []).map(toAbs);
  const out = [];
  const seen = new Set();
  const queue = roots.slice();
  while (queue.length) {
    const abs = queue.shift();
    if (seen.has(abs)) continue;
    seen.add(abs);
    out.push(abs);
    const text = await fetchText(abs);
    if (text == null) continue;
    let plain = text;
    if (isEnc(text)) {
      if (!key) continue;
      try { plain = await decryptText(text, key); } catch (e) { continue; }
    }
    for (const spec of scanSpecs(plain)) {
      const dep = resolveSpec(spec, abs);
      if (!dep) continue;
      try { if (!/\.m?js$/.test(new URL(dep).pathname)) continue; } catch (e) { continue; }
      if (!seen.has(dep)) queue.push(dep);
    }
  }
  return out;
}

function rewriteImports(text, fromAbs, built) {
  SPEC_RE.lastIndex = 0;
  return text.replace(SPEC_RE, (m, pre, spec, post) => {
    const dep = resolveSpec(spec, fromAbs);
    if (dep && built.has(dep)) return pre + built.get(dep) + post;
    return m;
  });
}
function topo(deps) {
  const indeg = new Map(), dependents = new Map();
  for (const n of deps.keys()) { indeg.set(n, 0); dependents.set(n, []); }
  for (const [n, ds] of deps) for (const d of ds) {
    if (!indeg.has(d)) continue;
    indeg.set(n, indeg.get(n) + 1);
    dependents.get(d).push(n);
  }
  const q = [...indeg].filter(([, v]) => v === 0).map(([k]) => k);
  const out = [];
  while (q.length) {
    const n = q.shift();
    out.push(n);
    for (const m of dependents.get(n)) {
      indeg.set(m, indeg.get(m) - 1);
      if (indeg.get(m) === 0) q.push(m);
    }
  }
  if (out.length !== deps.size) throw new Error("cycle: " + [...deps.keys()].filter((k) => out.indexOf(k) < 0).map(relOf).join(", "));
  return out;
}

let _rep = { ok: true, at: Date.now(), ts: Date.now(), mode: "plain", loaded: [], errors: [], applied: [], broken: [], stale: [], built: 0, ms: 0 };
export function lastBootReport() { return _rep; }

export async function readPlain(path) {
  const abs = toAbs("./" + normRel(path));
  const t = await fetchText(abs);
  if (t == null) return null;
  if (!isEnc(t)) return t;
  const key = currentKey();
  if (!key) return null;
  try { return await decryptText(t, key); } catch (e) { return null; }
}

export async function bootModules(paths) {
  const t0 = Date.now();
  const rep = { ok: true, at: t0, ts: t0, mode: "plain", loaded: [], errors: [], applied: [], broken: [], stale: [], built: 0, ms: 0 };
  _rep = rep;
  const M = {};
  const rels = (paths || []).slice();
  const absRoots = rels.map(toAbs);
  const key = currentKey();
  let order = [];
  try { order = await moduleClosure(rels); }
  catch (e) { rep.errors.push("closure :: " + ((e && e.message) || e)); }
  const texts = new Map();
  for (const abs of order) {
    const t = await fetchText(abs);
    if (t == null) rep.errors.push(relOf(abs) + " :: unreadable");
    else texts.set(abs, t);
  }
  const plain = new Map();
  let encCount = 0, clearCount = 0;
  for (const [abs, t] of texts) {
    if (isEnc(t)) {
      encCount++;
      if (!key) { rep.ok = false; rep.errors.push(relOf(abs) + " :: encrypted, no key"); continue; }
      try { plain.set(abs, await decryptText(t, key)); }
      catch (e) { rep.ok = false; rep.errors.push(relOf(abs) + " :: decrypt failed"); }
    } else { clearCount++; plain.set(abs, t); }
  }
  rep.mode = encCount && clearCount ? "mixed" : (encCount ? "enc" : "plain");
  let state = null;
  try { state = await readState(); } catch (e) { state = blankState(); }
  const active = ((state && state.patches) || []).filter((p) => p && p.on && !p.broken);
  const byPath = new Map();
  for (const p of active) {
    const np = normRel(p.path);
    if (!np || NO_PATCH.indexOf(np) >= 0) continue;
    if (!byPath.has(np)) byPath.set(np, []);
    byPath.get(np).push(p);
  }
  const haveRels = new Set([...plain.keys()].map(relOf));
  for (const [np, list] of byPath) {
    if (!haveRels.has(np)) for (const p of list) rep.stale.push(p.id || np);
  }
  let stateDirty = false;
  for (const [abs, text] of plain) {
    const list = byPath.get(relOf(abs));
    if (!list || !list.length) continue;
    let cur = text;
    for (const p of list) {
      const res = tryPatch(cur, p);
      if (!res.ok) {
        p.broken = true; p.error = res.error; stateDirty = true;
        rep.broken.push({ id: p.id || "", path: relOf(abs), error: res.error });
        continue;
      }
      cur = res.text;
      rep.applied.push(p.id || relOf(abs));
    }
    plain.set(abs, cur);
  }
  if (stateDirty) { try { await writeState(state); } catch (e) {} }
  const deps = new Map();
  for (const [abs, text] of plain) {
    const ds = [];
    for (const spec of scanSpecs(text)) {
      const dep = resolveSpec(spec, abs);
      if (dep && plain.has(dep)) ds.push(dep);
    }
    deps.set(abs, ds);
  }
  for (const [abs, text] of plain) {
    for (const spec of scanSpecs(text)) {
      const dep = resolveSpec(spec, abs);
      if (dep && !plain.has(dep)) {
        try { if (/\.m?js$/.test(new URL(dep).pathname)) rep.stale.push(relOf(abs) + " -> " + relOf(dep)); } catch (e) {}
      }
    }
  }
  let buildOrder = [];
  try { buildOrder = topo(deps); }
  catch (e) { rep.ok = false; rep.errors.push(((e && e.message) || e)); }
  const built = new Map();
  for (const abs of buildOrder) {
    if (relOf(abs) === "src/atelier-loader.js") { built.set(abs, abs); continue; }
    let text = plain.get(abs);
    text = rewriteImports(text, abs, built);
    text = text.split("import.meta.url").join(JSON.stringify(abs));
    try { built.set(abs, URL.createObjectURL(new Blob([text], { type: "text/javascript" }))); }
    catch (e) { rep.ok = false; rep.errors.push(relOf(abs) + " :: blob failed"); }
  }
  try { window.__sofiaBlob = Object.fromEntries(built); } catch (e) {}
  rep.built = built.size;
  for (let i = 0; i < rels.length; i++) {
    const rel = rels[i], abs = absRoots[i];
    if (!built.has(abs)) { rep.ok = false; rep.errors.push(rel + " :: not built"); M[rel] = {}; continue; }
    try {
      M[rel] = await import(built.get(abs));
      rep.loaded.push(rel);
    } catch (e) { rep.ok = false; rep.errors.push(rel + " :: " + ((e && e.message) || e)); M[rel] = {}; }
  }
  rep.ms = Date.now() - t0;
  try {
    const st = state || await readState();
    st.report = rep;
    await writeState(st);
  } catch (e) {}
  return M;
}
