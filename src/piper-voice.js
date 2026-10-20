export function attachPiperVoice(App, deps) {
  const HF_MODEL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx";
  const FR_WORDS = new Set("les des une est que qui dans pour pas plus avec sur sous vers chez entre pendant depuis sans elle nous vous ils elles mon ton son notre votre leur mais donc tres bien bonjour merci etre avoir faire aller oui non comme tout tous aussi quand pourquoi comment moi toi lui sont etait etaient suis sommes etes avez ont avons cette ces peut veux veut sais sait chose toujours jamais maintenant demain hier beaucoup trop peu encore deja voila alors tu te je il elle on ces ses mes tes sa ma ta es est ont suis ai as etre mets fais fait vas dis vois prends donne montre viens".split(" "));
  function varint(n) {
    const b = [];
    n >>>= 0;
    while (n > 127) { b.push((n & 127) | 128); n >>>= 7; }
    b.push(n);
    return new Uint8Array(b);
  }
  function concat(parts) {
    let n = 0;
    for (const p of parts) n += p.length;
    const out = new Uint8Array(n);
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }
  function patchModel(buf) {
    const enc = new TextEncoder();
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    const entry = (k, v) => {
      const kb = enc.encode(k), vb = enc.encode(v);
      const inner = concat([new Uint8Array([10]), varint(kb.length), kb, new Uint8Array([18]), varint(vb.length), vb]);
      return concat([new Uint8Array([114]), varint(inner.length), inner]);
    };
    return concat([u8, entry("sample_rate", "22050"), entry("n_speakers", "1"), entry("language", "fr_FR"), entry("comment", "piper")]);
  }
  function idb() {
    return new Promise((resolve, reject) => {
      try {
        const q = indexedDB.open("sofia-piper-v1", 1);
        q.onupgradeneeded = () => { try { q.result.createObjectStore("models"); } catch (e) {} };
        q.onsuccess = () => resolve(q.result);
        q.onerror = () => reject(q.error || new Error("idb open"));
      } catch (e) { reject(e); }
    });
  }
  async function idbGet(key) {
    const db = await idb();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction("models", "readonly");
        const rq = tx.objectStore("models").get(key);
        rq.onsuccess = () => { let v = null; try { v = rq.result || null; } catch (e) {} try { db.close(); } catch (e2) {} resolve(v); };
        rq.onerror = () => { try { db.close(); } catch (e) {} resolve(null); };
      } catch (e) { try { db.close(); } catch (e2) {} resolve(null); }
    });
  }
  async function idbSet(key, val) {
    try {
      const db = await idb();
      await new Promise((resolve) => {
        try {
          const tx = db.transaction("models", "readwrite");
          const rq = tx.objectStore("models").put(val, key);
          rq.onsuccess = () => resolve(true);
          rq.onerror = () => resolve(false);
        } catch (e) { resolve(false); }
      });
      try { db.close(); } catch (e) {}
    } catch (e) {}
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      try {
        const el = document.createElement("script");
        el.src = src;
        el.onload = () => resolve(true);
        el.onerror = () => reject(new Error("script " + src));
        document.head.appendChild(el);
      } catch (e) { reject(e); }
    });
  }
  const P = {
    _loading: null,
    _ready: false,
    _sampleRate: 22050,
    _worker: null,
    _seq: 0,
    _pending: {},
    _ctx: null,
    _current: null,
    _playGen: 0,
    _initTimer: null,
    engine() {
      try { return String((App.State && App.State.settings && App.State.settings.ttsEngine) || "system"); } catch (e) { return "system"; }
    },
    setEngine(name) {
      try {
        App.State.settings.ttsEngine = (String(name) === "piper") ? "piper" : "system";
        App.Data.saveSettings();
      } catch (e) {}
      if (String(name) === "piper") this.warm();
      try { if (App.Voice && App.Voice.refreshUI) App.Voice.refreshUI(); } catch (e2) {}
      this.renderStatus();
    },
    isFrench(text) {
      const s = String(text == null ? "" : text);
      if (!s.trim()) return false;
      let score = 0;
      const accents = s.match(/[àâçéèêëîïôùûÿœ]/gi);
      if (accents) score += Math.min(2, accents.length);
      const words = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z]+/).filter((w) => w.length >= 2);
      if (!words.length) return score >= 1;
      for (const w of words) if (FR_WORDS.has(w)) score += 1;
      if (words.length === 1) return score >= 1;
      return score >= 2;
    },
    useFor(text) {
      try {
        if (this.engine() !== "piper") return false;
        if (!this._ready) return false;
        return this.isFrench(text);
      } catch (e) { return false; }
    },
    ready() { return !!this._ready; },
    statusLine() {
      if (this._ready) return "Voix Sofia prête (français neuronal, local).";
      if (this._loading) return "Chargement de la voix Sofia…";
      return "Voix Sofia non chargée.";
    },
    renderStatus() {
      try {
        const el = document.getElementById("ttsEngineStatusEl");
        if (el) el.textContent = this.statusLine();
        const sel = document.getElementById("ttsEngineSelect");
        if (sel && sel.value !== this.engine()) sel.value = this.engine();
      } catch (e) {}
    },
    warm() {
      try { this.ensure((st) => this._progress(st)); } catch (e) {}
      return true;
    },
    _progress(st) {
      try {
        const el = document.getElementById("ttsEngineStatusEl");
        if (el && st && st.label) el.textContent = String(st.label);
      } catch (e) {}
    },
    ensure(onProgress) {
      if (this._ready) return Promise.resolve({ sampleRate: this._sampleRate });
      if (this._loading) {
        if (typeof onProgress === "function") this._tapProgress(onProgress);
        return this._loading;
      }
      const prog = (f, label) => {
        const st = { frac: f, label: label };
        try { this._progress(st); } catch (e) {}
        try { if (typeof onProgress === "function") onProgress(st); } catch (e2) {}
        for (const fn of this._progTaps.slice()) { try { fn(st); } catch (e3) {} }
        this._progTaps.length = 0;
      };
      this._progTaps = [];
      this._loading = (async () => {
        prog(0.02, "Voix Sofia : phonèmes…");
        await this._loadPhonemize();
        prog(0.15, "Voix Sofia : moteur…");
        await this._loadWorker(prog);
        prog(0.55, "Voix Sofia : voix française…");
        const tokens = await (await fetch("src/tts-eng/siwis-tokens.txt")).text();
        let model = await idbGet("siwis-patched");
        if (!model) {
          model = await this._fetchModel(prog);
          try { await idbSet("siwis-patched", model); } catch (e) {}
        } else {
          prog(0.9, "Voix Sofia : démarrage…");
        }
        await this._initWorker(model, tokens);
        this._ready = true;
        this.renderStatus();
        return { sampleRate: this._sampleRate };
      })();
      this._loading.then(null, () => { this._loading = null; this.renderStatus(); });
      return this._loading;
    },
    _progTaps: [],
    _tapProgress(fn) { try { this._progTaps.push(fn); } catch (e) {} },
    async _loadPhonemize() {
      try {
        if (typeof piperPhonemizeInitialize === "function" && typeof Module !== "undefined" && Module && typeof Module._malloc === "function") {
          const r = piperPhonemizeInitialize();
          if (r === 22050) return true;
        }
      } catch (e) {}
      if (!this._phoneBlobs) {
        const wbuf = await (await fetch("src/tts-eng/piper-phonemize-wasm-main.wasm")).arrayBuffer();
        const dbuf = await (await fetch("src/tts-eng/piper-phonemize-wasm-main.data")).arrayBuffer();
        this._phoneBlobs = {
          wasm: URL.createObjectURL(new Blob([wbuf], { type: "application/wasm" })),
          data: URL.createObjectURL(new Blob([dbuf], { type: "application/octet-stream" }))
        };
      }
      try {
        const prev = (typeof window !== "undefined" && window.Module) ? window.Module : {};
        const blobs = this._phoneBlobs;
        window.Module = Object.assign({}, prev, {
          locateFile: function (p) {
            const s = String(p || "");
            if (s.indexOf(".wasm") !== -1) return blobs.wasm;
            if (s.indexOf(".data") !== -1) return blobs.data;
            return s;
          }
        });
      } catch (e) {}
      await loadScript("src/tts-eng/piper-phonemize-wasm-main.js");
      await loadScript("src/tts-eng/piper-phonemize.js");
      for (let i = 0; i < 600; i++) {
        try {
          if (typeof Module !== "undefined" && Module && typeof Module._malloc === "function") break;
        } catch (e) {}
        await new Promise((r) => setTimeout(r, 100));
      }
      const r = piperPhonemizeInitialize();
      if (r !== 22050) throw new Error("phone init " + r);
      return true;
    },
    async _loadWorker(prog) {
      const parts = ["src/tts-eng/tts-worker-head.js", "src/tts-eng/sherpa-onnx-wasm-main-tts.js", "src/tts-eng/sherpa-onnx-tts.js", "src/tts-eng/tts-worker-tail.js"];
      const texts = [];
      let i = 0;
      for (const u of parts) {
        const t = await (await fetch(u)).text();
        if (!t) throw new Error("worker part " + u);
        texts.push(t);
        i++;
        try { prog(0.15 + 0.2 * (i / parts.length), "Voix Sofia : moteur…"); } catch (e) {}
      }
      const blob = new Blob(texts, { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const wbuf = await (await fetch("src/tts-eng/sherpa-onnx-wasm-main-tts.wasm")).arrayBuffer();
      const wurl = URL.createObjectURL(new Blob([wbuf], { type: "application/wasm" }));
      const w = new Worker(url);
      this._worker = w;
      await new Promise((resolve, reject) => {
        const to = setTimeout(() => reject(new Error("tts runtime timeout")), 90000);
        const h = (e) => {
          const d = e.data || {};
          if (d.type === "sofia-tts-runtime") { clearTimeout(to); w.removeEventListener("message", h); resolve(true); }
          else if (d.type === "error" && !d.id) { clearTimeout(to); w.removeEventListener("message", h); reject(new Error(String(d.message || "worker"))); }
        };
        w.addEventListener("message", h);
        w.postMessage({ type: "urls", wasm: wurl });
      });
      this._worker.addEventListener("message", (e) => {
        const d = e.data || {};
        if (d.type === "sofia-tts-audio" || d.type === "error") {
          const p = this._pending[d.id];
          if (p) {
            delete this._pending[d.id];
            if (d.type === "sofia-tts-audio") p.resolve(d);
            else p.reject(new Error(String(d.message || "synth")));
          }
        } else if (d.type === "sofia-tts-ready") {
          try { if (d.sampleRate) this._sampleRate = d.sampleRate; } catch (e2) {}
          if (this._initWait) { const f = this._initWait; this._initWait = null; f.resolve(d); }
        }
      });
    },
    async _fetchModel(prog) {
      const r = await fetch(HF_MODEL);
      if (!r.ok) throw new Error("model http " + r.status);
      const total = Number(r.headers.get("Content-Length") || 63200000);
      const reader = r.body.getReader();
      const chunks = [];
      let got = 0;
      for (;;) {
        const rd = await reader.read();
        if (rd.done) break;
        chunks.push(rd.value);
        got += rd.value.length;
        try { prog(0.55 + 0.3 * Math.min(1, got / total), "Voix Sofia : voix française " + Math.round(100 * got / total) + " %…"); } catch (e) {}
      }
      const raw = concat(chunks);
      return patchModel(raw);
    },
    _initWorker(model, tokens) {
      const w = this._worker;
      if (!w) throw new Error("no worker");
      return new Promise((resolve, reject) => {
        const to = setTimeout(() => { this._initWait = null; reject(new Error("tts init timeout")); }, 180000);
        this._initWait = {
          resolve: (d) => { clearTimeout(to); resolve(d); },
          reject: (m) => { clearTimeout(to); reject(new Error(m)); }
        };
        const buf = model instanceof Uint8Array ? model : new Uint8Array(model);
        w.postMessage({ type: "init", model: buf, tokens: tokens }, [buf.buffer]);
      });
    },
    _sentences(t) {
      const s = String(t == null ? "" : t).replace(/\s+/g, " ").trim();
      if (!s) return [];
      const m = s.match(/[^.!?…]+[.!?…]+["»”’)\]]?|[^.!?…]+$/g);
      return ((m && m.length ? m : [s]).map((x) => String(x).trim()).filter(Boolean)).slice(0, 48);
    },
    _phonemize(text) {
      let out = null;
      try { out = piperPhonemize(String(text), "fr"); } catch (e) { out = null; }
      if (!out || !out.length) throw new Error("phonemize");
      const arr = [];
      for (const s of out) {
        if (s && s.length) arr.push(new Int32Array(s));
      }
      if (!arr.length) throw new Error("phonemize vide");
      return arr;
    },
    _synth(cp) {
      const w = this._worker;
      if (!w) return Promise.reject(new Error("moteur absent"));
      const id = "p" + (++this._seq);
      const plain = Array.from(cp instanceof Int32Array ? cp : new Int32Array(cp));
      return new Promise((resolve, reject) => {
        this._pending[id] = { resolve, reject };
        try {
          w.postMessage({ type: "speak", id: id, codepoints: plain, speed: 1 });
        } catch (e) {
          delete this._pending[id];
          reject(e);
        }
        setTimeout(() => {
          if (this._pending[id]) { delete this._pending[id]; reject(new Error("synth timeout")); }
        }, 60000);
      });
    },
    async _audio() {
      if (this._ctx) {
        try {
          if (this._ctx.state === "suspended") await this._ctx.resume();
        } catch (e) {}
        if (this._ctx.state === "suspended") throw new Error("audio-bloque");
        return this._ctx;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("pas-audio");
      this._ctx = new AC();
      try {
        if (this._ctx.state === "suspended") await this._ctx.resume();
      } catch (e) {}
      if (this._ctx.state === "suspended") throw new Error("audio-bloque");
      return this._ctx;
    },
    async speak(text, onProgress) {
      await this.ensure(onProgress);
      const myGen = this._playGen;
      const sents = this._sentences(text);
      if (!sents.length) throw new Error("texte vide");
      const bufs = [];
      let sr = this._sampleRate;
      for (const s of sents) {
        if (myGen !== this._playGen) throw new Error("stoppe");
        const cps = this._phonemize(s);
        for (const cp of cps) {
          if (myGen !== this._playGen) throw new Error("stoppe");
          const d = await this._synth(cp);
          if (d.sampleRate) sr = d.sampleRate;
          if (d.samples && d.samples.length) bufs.push(d.samples);
        }
      }
      let n = 0;
      for (const b of bufs) n += b.length;
      if (!n) throw new Error("audio vide");
      const flat = new Float32Array(n);
      let o = 0;
      for (const b of bufs) { flat.set(b, o); o += b.length; }
      let peak = 0, vs = 0;
      for (let i = 0; i < flat.length; i += 7) {
        const a = Math.abs(flat[i]);
        if (a > peak) peak = a;
        if (a > 0.02) vs++;
      }
      const voiced = flat.length ? vs / Math.ceil(flat.length / 7) : 0;
      if (myGen !== this._playGen) throw new Error("stoppe");
      await this._play(flat, sr);
      return { seconds: flat.length / sr, peak: peak, voiced: voiced };
    },
    _play(flat, sr) {
      return this._audio().then((ctx) => new Promise((resolve, reject) => {
        const gen = ++this._playGen;
        const mine = { gen: gen, src: null };
        this._current = mine;
        try {
          const buf = ctx.createBuffer(1, flat.length, sr);
          buf.getChannelData(0).set(flat);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          mine.src = src;
          src.onended = () => {
            if (this._current === mine) this._current = null;
            if (gen === this._playGen) resolve(true);
            else reject(new Error("stoppe"));
          };
          src.start();
        } catch (e) { reject(e); }
      }));
    },
    stopAll() {
      this._playGen++;
      const c = this._current;
      this._current = null;
      try { if (c && c.src) c.src.stop(); } catch (e) {}
      return true;
    }
  };
  App.PiperVoice = P;
  try {
    document.addEventListener("pointerdown", () => { try { if (P._ctx && P._ctx.state === "suspended") P._ctx.resume(); } catch (e) {} }, true);
  } catch (e) {}
  return P;
}
