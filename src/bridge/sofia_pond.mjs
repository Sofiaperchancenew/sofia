#!/usr/bin/env node
// Sofia – lokaler Steg (Port 3 der SofiaAPI).  Version 1.0 (Node)
//
// Dieses eine Skript ist beides:
//
//   * der SERVER, den ein offener Tab mit Sofia abfragt – genau das Protokoll,
//     das `SofiaAPI.local(true)` erwartet (GET /next, POST /chunk, POST /answer);
//   * ein kleiner CLIENT fuer eigene Programme (`Sofia`):
//         import { Sofia } from "./sofia_pond.mjs";
//         console.log(await new Sofia().ask("En une phrase : qui es-tu ?"));
//
// Ausserdem spricht er POST /v1/chat/completions (mit SSE) – die Sprache, die
// fast jede KI-Bibliothek versteht. Ein Programm, das auf OpenAI eingestellt
// ist, aendert also nur `baseURL` und redet mit ihr.
//
// Nur 127.0.0.1, und der Tab muss offen bleiben: sie denkt in seinem Browser.
//
// Start (Node 18 oder neuer):
//     node sofia_pond.mjs
//     node sofia_pond.mjs --demo "En une phrase : qui es-tu ?"
//     node sofia_pond.mjs --selftest          // ohne Browser pruefen
//     node sofia_pond.mjs --port 9123
//
// Im Tab von Sofia (einmal, in der Console):   SofiaAPI.local(true)

import http from "node:http";
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import process from "node:process";

export const VERSION = "1.0";
export const MODEL_ID = "sofia";
export const DEFAULT_PORT = 8787;
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_HOLD_MS = 20000;
export const DEFAULT_TIMEOUT = 180;
const MAX_BODY = 32 * 1024 * 1024;

export class SofiaError extends Error {}
export class NoPageError extends SofiaError {}

const estTokens = (t) => Math.max(1, Math.floor(String(t || "").length / 4));

// ---------------------------------------------------------------------------
// Der Kern: Auftraege, die auf einen Tab warten.
// ---------------------------------------------------------------------------

class Job {
  constructor(text, opts, key) {
    this.id = randomUUID().replace(/-/g, "").slice(0, 32);
    this.text = text;
    this.opts = opts || {};
    this.key = key || null;
    this.chunks = [];
    this.answer = null;
    this.error = null;
    this.finished = false;
    this.created = Date.now();
    this.subs = new Set();
    this.done = new Promise((resolve) => { this._end = resolve; });
  }
  watch(fn) {
    this.subs.add(fn);
    for (const c of this.chunks) { try { fn("chunk", c); } catch {} }
  }
  unwatch(fn) { this.subs.delete(fn); }
  push(chunk) {
    this.chunks.push(chunk);
    for (const fn of [...this.subs]) { try { fn("chunk", chunk); } catch {} }
  }
  finish(text, error) {
    if (this.finished) return;
    this.answer = text == null ? "" : String(text);
    this.error = error ? String(error) : null;
    this.finished = true;
    for (const fn of [...this.subs]) { try { fn("end", this.error || this.answer || "") } catch {} }
    this._end();
  }
}

export class Bridge {
  constructor({ holdMs = DEFAULT_HOLD_MS, timeout = DEFAULT_TIMEOUT, log = true } = {}) {
    this.holdMs = Math.max(0, holdMs | 0);
    this.timeout = timeout;
    this.log = log;
    this.pending = [];
    this.jobs = new Map();
    this.waiters = [];
    this.everSeen = false;
    this.lastSeen = 0;
    this.asked = 0;
    this.answered = 0;
    this.fails = 0;
  }

  notePage() { this.everSeen = true; this.lastSeen = Date.now(); }

  take(holdMs) {
    while (this.pending.length) {
      const job = this.jobs.get(this.pending.shift());
      if (job && !job.finished) return Promise.resolve(job);
    }
    return new Promise((resolve) => {
      const w = { resolve, timer: null };
      w.timer = setTimeout(() => {
        const i = this.waiters.indexOf(w);
        if (i >= 0) this.waiters.splice(i, 1);
        resolve(null);
      }, holdMs);
      this.waiters.push(w);
    });
  }

  complete(id, text, error) {
    const job = this.jobs.get(id);
    if (!job) return false;
    job.finish(text, error);
    this.answered++;
    return true;
  }

  submit(text, opts = {}, key = null, method = "ask") {
    const o = { ...opts };
    if (method !== "ask") o.method = method;
    const job = new Job(text, o, key);
    this.jobs.set(job.id, job);
    this.asked++;
    const waiter = this.waiters.shift();
    if (waiter) { clearTimeout(waiter.timer); waiter.resolve(job); }
    else this.pending.push(job.id);
    if (this.jobs.size > 64) this.prune();
    return job;
  }

  prune() {
    const cut = Date.now() - 600000;
    for (const [id, job] of this.jobs) {
      if (job.finished && job.created < cut) this.jobs.delete(id);
    }
  }

  async wait(job, timeoutMs) {
    try {
      const t = timeoutMs == null ? this.timeout * 1000 : timeoutMs;
      const timed = sleep(t).then(() => "timeout");
      const res = await Promise.race([job.done.then(() => "done"), timed]);
      if (res === "timeout") {
        throw new SofiaError(
          `Sofia n'a pas répondu (${Math.max(1, Math.round(t / 1000))} s). L'onglet est-il encore ouvert, ` +
          "et n'y a-t-il pas une autre demande en cours ?");
      }
      if (job.error) throw new SofiaError(job.error);
      return job.answer || "";
    } finally {
      this.jobs.delete(job.id);
    }
  }

  async ask(text, opts = {}, key = null, method = "ask") {
    const job = this.submit(text, opts, key, method);
    if (!this.everSeen) {
      const t0 = Date.now();
      while (!this.everSeen && !job.finished && Date.now() - t0 < 4000) await sleep(150);
      if (!this.everSeen && !job.finished) {
        this.jobs.delete(job.id);
        this.fails++;
        throw new NoPageError(
          "Aucun onglet Sofia ne s'est annoncé. La page est-elle ouverte, et " +
          "as-tu tapé une fois `SofiaAPI.local(true)` dedans ? (Le pont est éteint par défaut.)");
      }
    }
    return this.wait(job);
  }
}

// ---------------------------------------------------------------------------
// OpenAI-Uebersetzung
// ---------------------------------------------------------------------------

// `splitModel` und `fromOpenAI` sind auch für Tests exportiert.
export function splitModel(model) {
  const m = String(model || MODEL_ID);
  for (const sep of ["@", "#"]) {
    const i = m.indexOf(sep);
    if (i >= 0) return [m.slice(0, i).trim() || MODEL_ID, m.slice(i + 1).trim() || null];
  }
  return [m.trim() || MODEL_ID, null];
}

export function fromOpenAI(payload) {
  const msgs = Array.isArray(payload.messages) ? payload.messages : [];
  const systemParts = [];
  const dialogue = [];
  for (const m of msgs) {
    if (!m || typeof m !== "object") continue;
    const role = String(m.role || "user").toLowerCase();
    let content = m.content;
    if (Array.isArray(content)) {
      let images = 0;
      content = content.map((p) => {
        if (p && typeof p === "object" && p.text) return String(p.text);
        if (p && typeof p === "object" && p.image_url) { images++; return ""; }
        return "";
      }).filter(Boolean).join("\n");
      if (images) {
        // Die Frage soll sauber bleiben: der Hinweis gehört in die Anweisung.
        systemParts.push(`[Hinweis: ${images} Bild(er) wurden mitgeschickt; über den lokalen Steg ` +
                         "können keine Bilder übertragen werden.]");
      }
    }
    content = String(content == null ? "" : content).trim();
    if (!content) continue;
    if (role === "system") systemParts.push(content);
    else if (role === "assistant") dialogue.push(["Assistant", content]);
    else dialogue.push(["User", content]);
  }
  let question = "";
  let context = [];
  for (let i = dialogue.length - 1; i >= 0; i--) {
    if (dialogue[i][0] === "User") {
      question = dialogue[i][1];
      context = dialogue.slice(0, i).concat(dialogue.slice(i + 1));
      break;
    }
  }
  let system = systemParts.filter(Boolean).join("\n\n");
  if (context.length) {
    const hist = context.map(([r, t]) => `${r}: ${t}`).join("\n");
    system = (system ? system + "\n\n" : "") + "[Échanges précédents]\n" + hist;
  }
  return { question, system };
}

const oaiChunk = (id, model, delta, finish = null) => ({
  id: "chatcmpl-" + id, object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000),
  model, choices: [{ index: 0, delta, finish_reason: finish }],
});

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "600",
  "Cache-Control": "no-store",
};

function sendJson(res, obj, code = 200) {
  const body = Buffer.from(JSON.stringify(obj), "utf8");
  res.writeHead(code, { ...CORS, "Content-Type": "application/json; charset=utf-8", "Content-Length": body.length });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let size = 0;
    const parts = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { req.destroy(); return; }
      parts.push(c);
    });
    req.on("end", () => {
      try {
        const parsed = JSON.parse(Buffer.concat(parts).toString("utf8") || "{}");
        resolve(parsed && typeof parsed === "object" ? parsed : {});
      } catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
    req.on("close", () => resolve({}));
  });
}

export function makeServer(bridge, options = {}) {
  const {
    log = bridge.log,
    checkOrigin = true,
    allowOrigin = ["*.perchance.org", "http://127.0.0.1", "http://localhost"],
  } = options;

  const originOk = (req, res) => {
    if (!checkOrigin) return true;
    const origin = req.headers.origin;
    if (!origin || origin === "null") return true;
    for (const pat of allowOrigin) {
      if (pat.startsWith("*.")) {
        const host = pat.slice(2);
        if (origin.endsWith("." + host) || origin.endsWith("//" + host)) return true;
      } else if (origin.startsWith(pat)) return true;
    }
    if (log) console.log(`[pont] origine refusée : ${origin} (${req.url})`);
    sendJson(res, {
      error: "origin_not_allowed", origin,
      hint: "Seuls *.perchance.org et localhost. --no-origin-check désactive le contrôle.",
    }, 403);
    return false;
  };

  const openSse = (res) => {
    res.writeHead(200, {
      ...CORS, "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no", "Connection": "keep-alive",
    });
    res.write(": open\n\n");
    return setInterval(() => { try { res.write(": ping\n\n"); } catch {} }, 15000);
  };
  const sseSend = (res, payload) => { try { res.write("data: " + JSON.stringify(payload) + "\n\n"); return true; } catch { return false; } };

  const handleAsk = async (res, data) => {
    const method = String(data.method || "ask").toLowerCase();
    const text = String(data.text || data.prompt || data.task || "");
    let opts = {};
    let key = data.key || data.thread || null;
    if (method === "history") {
      opts = { n: parseInt(data.n || 20, 10) || 20 };
      key = null;
    } else {
      const map = {
        maxtokens: "maxTokens", max_tokens: "maxTokens", maxTokens: "maxTokens",
        skipmemory: "skipMemory", skip_memory: "skipMemory", keepmarkers: "keepMarkers",
        keep_markers: "keepMarkers", system: "system", lang: "lang", language: "lang",
        temperature: "temperature", fresh: "fresh", raw: "raw", explain: "explain",
        file: "file", code: "code", n: "n",
      };
      for (const [k, v] of Object.entries(data)) {
        const tgt = map[k];
        if (tgt && v !== undefined && v !== null) opts[tgt] = v;
      }
      if (method !== "ask") opts.method = method;
    }

    let job;
    try {
      job = bridge.submit(text, opts, key, method);
    } catch (e) {
      return sendJson(res, { error: String(e.message || e), kind: "no_page" }, 503);
    }

    // Kein Tab je gesehen? Dann sofort die Wahrheit sagen statt lange warten.
    if (!bridge.everSeen) {
      const t0 = Date.now();
      while (!bridge.everSeen && !job.finished && Date.now() - t0 < 4000) await sleep(150);
      if (!bridge.everSeen && !job.finished) {
        bridge.jobs.delete(job.id);
        bridge.fails++;
        return sendJson(res, {
          error: "Aucun onglet Sofia ne s'est annoncé. La page est-elle ouverte, et as-tu tapé " +
                 "une fois `SofiaAPI.local(true)` dedans ?",
          kind: "no_page",
        }, 503);
      }
    }

    if (data.stream) {
      const timer = openSse(res);
      const fn = (kind, payload) => {
        if (kind === "chunk") sseSend(res, { chunk: payload, id: job.id });
        else if (job.error) { sseSend(res, { error: job.error, id: job.id, done: true }); res.write("data: [DONE]\n\n"); }
        else { sseSend(res, { text: payload, id: job.id, done: true }); res.write("data: [DONE]\n\n"); }
      };
      job.watch(fn);
      const stop = () => { clearInterval(timer); job.unwatch(fn); bridge.jobs.delete(job.id); try { res.end(); } catch {} };
      res.on("close", stop);
      job.done.then(stop);
      return;
    }

    try {
      const out = await bridge.wait(job);
      const payload = { text: out, id: job.id, model: MODEL_ID, method };
      if (method === "history") {
        try { payload.history = out.trim().startsWith("[") ? JSON.parse(out) : []; } catch { payload.history = []; }
      }
      return sendJson(res, payload);
    } catch (e) {
      return sendJson(res, { error: String(e.message || e), kind: "timeout" }, 504);
    }
  };

  const handleOpenAi = async (res, payload) => {
    const [model, key] = splitModel(payload.model);
    const { question, system } = fromOpenAI(payload);
    if (!question) {
      return sendJson(res, { error: { message: "aucun message utilisateur", type: "invalid_request_error" } }, 400);
    }
    const opts = {};
    if (system) opts.system = system;
    if (payload.temperature != null) opts.temperature = payload.temperature;
    if (payload.max_tokens != null) opts.maxTokens = payload.max_tokens;
    if (payload.max_completion_tokens != null) opts.maxTokens = payload.max_completion_tokens;

    let job;
    try {
      job = bridge.submit(question, opts, key, "ask");
    } catch (e) {
      return sendJson(res, { error: { message: String(e.message || e), type: "sofia_no_page" } }, 503);
    }
    if (!bridge.everSeen) {
      const t0 = Date.now();
      while (!bridge.everSeen && !job.finished && Date.now() - t0 < 4000) await sleep(150);
      if (!bridge.everSeen && !job.finished) {
        bridge.jobs.delete(job.id);
        return sendJson(res, {
          error: { message: "Aucun onglet Sofia ne s'est annoncé. Ouvre la page et tape SofiaAPI.local(true).",
                   type: "sofia_no_page" },
        }, 503);
      }
    }

    if (payload.stream) {
      const timer = openSse(res);
      let first = true;
      const fn = (kind, payloadChunk) => {
        if (kind === "chunk") {
          const delta = first ? { role: "assistant", content: payloadChunk } : { content: payloadChunk };
          first = false;
          sseSend(res, oaiChunk(job.id, model, delta));
          return;
        }
        if (job.error) {
          sseSend(res, oaiChunk(job.id, model, { content: "\n[Erreur] " + job.error }, "stop"));
        } else {
          if (first) sseSend(res, oaiChunk(job.id, model, { role: "assistant", content: "" }));
          sseSend(res, oaiChunk(job.id, model, {}, "stop"));
        }
        res.write("data: [DONE]\n\n");
      };
      job.watch(fn);
      const stop = () => { clearInterval(timer); job.unwatch(fn); bridge.jobs.delete(job.id); try { res.end(); } catch {} };
      res.on("close", stop);
      job.done.then(stop);
      return;
    }

    try {
      const out = await bridge.wait(job);
      return sendJson(res, {
        id: "chatcmpl-" + job.id, object: "chat.completion", created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: out } }],
        usage: {
          prompt_tokens: estTokens(question + system), completion_tokens: estTokens(out),
          total_tokens: estTokens(question + system) + estTokens(out),
        },
      });
    } catch (e) {
      return sendJson(res, { error: { message: String(e.message || e), type: "sofia_timeout" } }, 504);
    }
  };

  const server = http.createServer(async (req, res) => {
    if (!originOk(req, res)) return;
    const path = (req.url || "/").split("?")[0].replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }

    if (req.method === "GET" && path === "/next") {
      bridge.notePage();
      const job = await bridge.take(bridge.holdMs);
      if (!job) return sendJson(res, {});
      return sendJson(res, { id: job.id, text: job.text, opts: job.opts, key: job.key });
    }

    if (req.method === "GET" && path === "/health") {
      return sendJson(res, {
        ok: true, service: "sofia-pond", version: VERSION,
        page_seen: bridge.everSeen,
        page_last_seen_s: bridge.lastSeen ? Math.round((Date.now() - bridge.lastSeen) / 100) / 10 : null,
        asked: bridge.asked, answered: bridge.answered, failed: bridge.fails,
        pending: bridge.pending.length, hold_ms: bridge.holdMs, timeout_s: bridge.timeout,
      });
    }

    if (req.method === "GET" && path === "/v1/models") {
      const now = Math.floor(Date.now() / 1000);
      return sendJson(res, { object: "list", data: [
        { id: MODEL_ID, object: "model", created: now, owned_by: "perchance/sofia", permission: [] },
        { id: MODEL_ID + "@<faden>", object: "model", created: now, owned_by: "perchance/sofia", permission: [] },
      ]});
    }

    if (req.method === "GET" && (path === "/" || path === "/help")) {
      return sendJson(res, {
        service: "Sofia – pont local", version: VERSION,
        server: "GET /next, POST /chunk, POST /answer (onglet)",
        programme: "POST /ask, POST /v1/chat/completions, GET /v1/models, GET /health",
        dans_l_onglet: "SofiaAPI.local(true)",
      });
    }

    if (req.method === "POST" && (path === "/chunk" || path === "/answer")) {
      bridge.notePage();
      const data = await readBody(req);
      const id = String(data.id || "");
      if (path === "/chunk") {
        const job = bridge.jobs.get(id);
        if (job && typeof data.text === "string" && data.text) job.push(data.text);
      } else if (data.error) {
        bridge.complete(id, null, String(data.error));
      } else {
        bridge.complete(id, data.text == null ? "" : String(data.text), null);
      }
      return sendJson(res, { ok: true });
    }

    if (req.method === "POST" && path === "/ask") return handleAsk(res, await readBody(req));
    if (req.method === "POST" && path === "/v1/chat/completions") return handleOpenAi(res, await readBody(req));

    return sendJson(res, { error: "not_found", path }, 404);
  });

  server.on("clientError", (err, socket) => { try { socket.destroy(); } catch {} });
  return server;
}

export function serve(bridge, { host = DEFAULT_HOST, port = DEFAULT_PORT, ...options } = {}) {
  const server = makeServer(bridge, options);
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve(server));
  });
}

// ---------------------------------------------------------------------------
// Kleiner Client fuer eigene Programme.
// ---------------------------------------------------------------------------

export class Sofia {
  constructor(base = "http://127.0.0.1:8787", { timeout = (DEFAULT_TIMEOUT + 60) * 1000, key = null } = {}) {
    this.base = String(base).replace(/\/+$/, "");
    this.timeout = timeout;
    this.key = key;
  }

  async #json(path, payload) {
    const init = payload == null
      ? { method: "GET" }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
    const res = await fetch(this.base + path, { ...init, signal: AbortSignal.timeout(this.timeout) });
    const data = await res.json().catch(() => ({}));
    if (data && data.error && !data.text && !data.history) {
      throw new SofiaError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
    }
    return data;
  }

  #payload(text, opts, stream = false) {
    const p = { text: String(text == null ? "" : text) };
    if (stream) p.stream = true;
    for (const [k, v] of Object.entries(opts || {})) if (v !== undefined && v !== null) p[k] = v;
    if (p.key === undefined && this.key) p.key = this.key;
    return p;
  }

  async health() { return this.#json("/health", null); }
  async models() { return (await this.#json("/v1/models", null)).data || []; }

  async ask(text, opts = {}) {
    const r = await this.#json("/ask", this.#payload(text, opts));
    return r.text || "";
  }

  async *stream(text, opts = {}) {
    const res = await fetch(this.base + "/ask", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.#payload(text, opts, true)),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      throw new SofiaError(`pont: HTTP ${res.status} ${t.slice(0, 200)}`);
    }
    let buf = "";
    for await (const chunk of res.body) {
      buf += Buffer.from(chunk).toString("utf8");
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const ev = JSON.parse(data);
          if (ev.error) throw new SofiaError(ev.error);
          if (ev.chunk) yield ev.chunk;
        } catch (e) { if (e instanceof SofiaError) throw e; }
      }
    }
  }

  async code(task, { file = null, code = null, explain = false, ...opts } = {}) {
    const r = await this.#json("/ask", { ...opts, text: task, method: "code", file, code, explain });
    return r.text || "";
  }

  async persona(opts = {}) {
    const r = await this.#json("/ask", this.#payload("", { ...opts, method: "persona" }));
    return r.text || "";
  }

  async history(n = 20) {
    const r = await this.#json("/ask", { text: "", method: "history", n });
    return r.history || [];
  }
}

// ---------------------------------------------------------------------------
// Selbsttest: tut so, als waere ein Tab offen.
// ---------------------------------------------------------------------------

export async function selftest(bridge, base) {
  let running = true;
  const fakeTab = (async () => {
    while (running) {
      let job = null;
      try {
        const r = await fetch(base + "/next");
        job = await r.json();
      } catch { await sleep(300); continue; }
      if (!job || !job.id) continue;
      const method = (job.opts || {}).method || "ask";
      const out = method === "persona" ? "PERSONA-DEMO" : method === "history" ? "[]" : "echo: " + job.text;
      for (let i = 0; i < out.length; i += 4) {
        await fetch(base + "/chunk", {
          method: "POST", headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ id: job.id, text: out.slice(i, i + 4) }),
        }).catch(() => {});
      }
      await fetch(base + "/answer", {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ id: job.id, text: out }),
      }).catch(() => {});
    }
  })();

  await sleep(250);
  const s = new Sofia(base, { timeout: 30000 });
  const results = [];

  const h = await s.health();
  results.push(["health", !!h.ok]);

  results.push(["ask", (await s.ask("ping")) === "echo: ping"]);

  let streamed = "";
  for await (const c of s.stream("bruecke")) streamed += c;
  results.push(["streaming", streamed === "echo: bruecke"]);

  results.push(["methode/persona", (await s.persona()) === "PERSONA-DEMO"]);

  const comp = await fetch(base + "/v1/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sofia", messages: [
      { role: "system", content: "kurz" }, { role: "user", content: "hallo" }] }),
  }).then((r) => r.json());
  results.push(["openai", comp?.choices?.[0]?.message?.content === "echo: hallo"]);

  const sseRaw = await fetch(base + "/v1/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sofia@faden", stream: true, messages: [{ role: "user", content: "strom" }] }),
  }).then((r) => r.text());
  results.push(["openai-stream", sseRaw.includes("echo: strom") && sseRaw.includes("[DONE]")]);

  running = false;
  fakeTab.catch(() => {});
  let bad = 0;
  for (const [name, ok] of results) {
    if (!ok) bad++;
    console.log(`[selftest] ${ok ? "ok     " : "ÉCHEC  "} ${name}`);
  }
  return bad;
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const a = { port: DEFAULT_PORT, host: DEFAULT_HOST, hold: DEFAULT_HOLD_MS, timeout: DEFAULT_TIMEOUT, origin: true, allow: [] };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--port") a.port = parseInt(argv[++i], 10);
    else if (v === "--host") a.host = argv[++i];
    else if (v === "--hold") a.hold = parseInt(argv[++i], 10);
    else if (v === "--timeout") a.timeout = parseFloat(argv[++i]);
    else if (v === "--no-origin-check") a.origin = false;
    else if (v === "--allow-origin") a.allow.push(argv[++i]);
    else if (v === "--quiet") a.quiet = true;
    else if (v === "--selftest") a.selftest = true;
    else if (v === "--demo") { a.demo = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "En une phrase : qui es-tu ?"; }
    else if (v === "--help" || v === "-h") a.help = true;
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("node sofia_pond.mjs [--port 8787] [--host 127.0.0.1] [--hold 20000] [--timeout 180]\n" +
                "                    [--selftest] [--demo \"...\"] [--quiet] [--no-origin-check] [--allow-origin URL]");
    return 0;
  }
  if (typeof fetch !== "function") {
    console.error("Node 18 ou plus récent est nécessaire (fetch intégré).");
    return 2;
  }

  const bridge = new Bridge({
    holdMs: args.selftest ? Math.min(args.hold, 1500) : args.hold,
    timeout: args.timeout, log: !args.quiet,
  });
  let server;
  try {
    server = await serve(bridge, {
      host: args.host, port: args.port, log: !args.quiet,
      checkOrigin: args.origin, allowOrigin: args.allow.length ? args.allow : undefined,
    });
  } catch (e) {
    console.error(`Le port ${args.port} est déjà pris (${e.code || e.message}). Essayez : --port ${args.port + 1}`);
    return 2;
  }
  const base = `http://${args.host}:${args.port}`;

  if (args.selftest) {
    console.log(`[selftest] serveur sur ${base}`);
    const bad = await selftest(bridge, base);
    server.close();
    console.log(bad === 0 ? "[selftest] terminé" : `[selftest] échec (${bad})`);
    return bad === 0 ? 0 : 1;
  }

  console.log(`\n  Sofia – pont local   v${VERSION}   (Node)\n  ------------------------------------------------`);
  console.log(`  Serveur      : ${base}`);
  console.log(`  Adresse base : ${base}/v1   (compatible OpenAI)\n`);
  console.log("  1. Laissez cette fenêtre ouverte.");
  console.log("  2. Dans l'onglet de Sofia, une fois :   SofiaAPI.local(true)");
  console.log("  3. Ici, dans un autre programme :");
  console.log("       import { Sofia } from \"./sofia_pond.mjs\";");
  console.log("       console.log(await new Sofia().ask(\"En une phrase : qui es-tu ?\"));\n");
  console.log("  Arrêt : Ctrl+C\n");

  if (args.demo) {
    try { console.log("[essai] " + await bridge.ask(args.demo) + "\n"); }
    catch (e) { console.log(`[essai] ${e.message}\n`); }
  }

  process.on("SIGINT", () => { console.log("\n[arrêt] pont fermé"); server.close(() => process.exit(0)); });
  return new Promise(() => {});
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (isMain) {
  main().then((code) => process.exit(code || 0)).catch((e) => { console.error(e); process.exit(1); });
}
