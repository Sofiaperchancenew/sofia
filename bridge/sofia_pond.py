#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sofia – lokaler Steg (Port 3 der SofiaAPI).  Version 1.0

Dieses eine Skript ist beides:

  * der SERVER, den ein offener Tab mit Sofia abfragt – genau das Protokoll,
    das `SofiaAPI.local(true)` erwartet (GET /next, POST /chunk, POST /answer);
  * ein kleiner CLIENT fuer eigene Programme (`Sofia`), damit kein zweites
    Skript noetig ist:   s = Sofia();  print(s.ask("..."))

Ausserdem spricht der Server die Sprache, die fast jede KI-Bibliothek schon
versteht: POST /v1/chat/completions (mit SSE-Streaming). Ein Programm, das auf
OpenAI eingestellt ist, aendert also nur `base_url` und redet mit ihr.

Nur Standardbibliothek (kein pip install), nur 127.0.0.1, und der Tab muss
offen bleiben: sie denkt in seinem Browser, nicht hier.

Start:
    python sofia_pond.py                 # Server starten
    python sofia_pond.py --demo          # Server + eine Frage zum Probieren
    python sofia_pond.py --selftest      # ohne Browser pruefen, ob alles laeuft
    python sofia_pond.py --port 9123     # anderer Port

Im Tab von Sofia (einmal, in der Console):
    SofiaAPI.local(true)
"""

from __future__ import annotations

import argparse
import collections
import json
import queue
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = "1.0"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8787
DEFAULT_HOLD_MS = 20000          # Long-Poll: so lange darf /next warten
DEFAULT_TIMEOUT = 180.0          # so lange wartet ein Auftrag auf eine Antwort
MODEL_ID = "sofia"
MAX_BODY = 32 * 1024 * 1024


class SofiaError(RuntimeError):
    """Antwort kam nicht, oder sie kam als Fehler."""


# ---------------------------------------------------------------------------
# Auftragswarteschlange: der gemeinsame Kern von Server und Client.
# ---------------------------------------------------------------------------

class Job:
    """Ein Auftrag: Frage hinein, Chunks unterwegs, Antwort am Ende."""

    def __init__(self, text: str, opts: dict, key: str | None = None):
        self.id = uuid.uuid4().hex
        self.text = text
        self.opts = opts or {}
        self.key = key
        self.chunks: list[str] = []
        self.answer: str | None = None
        self.error: str | None = None
        self.created = time.time()
        self.done = threading.Event()
        self.lock = threading.Lock()
        self.subs: list[queue.Queue] = []

    @staticmethod
    def _deliver(sink, kind: str, data) -> None:
        """Ein Zuschauer ist entweder eine Queue oder eine Funktion(kind, data)."""
        try:
            if callable(sink):
                sink(kind, data)
            else:
                sink.put((kind, data))
        except Exception:
            pass

    def watch(self, sink) -> None:
        """Ein Zuschauer (SSE). Schon vorhandene Chunks kommen sofort mit."""
        with self.lock:
            self.subs.append(sink)
            for c in self.chunks:
                self._deliver(sink, "chunk", c)

    def unwatch(self, sink) -> None:
        with self.lock:
            if sink in self.subs:
                self.subs.remove(sink)

    def push(self, chunk: str) -> None:
        with self.lock:
            self.chunks.append(chunk)
            for sink in list(self.subs):
                self._deliver(sink, "chunk", chunk)

    def finish(self, text: str | None = None, error: str | None = None) -> None:
        self.answer = text
        self.error = error
        with self.lock:
            for sink in list(self.subs):
                self._deliver(sink, "end", error if error else (text or ""))
        self.done.set()


class Bridge:
    """Die Warteschlange zwischen Tab und eigenem Programm."""

    def __init__(self, hold_ms: int = DEFAULT_HOLD_MS, timeout: float = DEFAULT_TIMEOUT,
                 log: bool = True):
        self.cv = threading.Condition()
        self.pending: collections.deque[str] = collections.deque()
        self.jobs: dict[str, Job] = {}
        self.hold = max(0.0, hold_ms / 1000.0)
        self.timeout = timeout
        self.log = log
        self.ever_seen = False          # hat sich je ein Tab gemeldet?
        self.last_seen = 0.0
        self.asked = 0
        self.answered = 0
        self.fails = 0

    # -- Seite des Tabs ----------------------------------------------------
    def note_page(self) -> None:
        with self.cv:
            self.ever_seen = True
            self.last_seen = time.time()

    def take(self, timeout: float) -> Job | None:
        end = time.monotonic() + timeout
        with self.cv:
            while not self.pending:
                rest = end - time.monotonic()
                if rest <= 0:
                    return None
                self.cv.wait(rest)
            jid = self.pending.popleft()
            return self.jobs.get(jid)

    def complete(self, job_id: str, text: str | None = None, error: str | None = None) -> bool:
        job = self.jobs.get(job_id)
        if job is None:
            return False
        job.finish(text=text, error=error)
        with self.cv:
            self.answered += 1
        return True

    # -- Seite des Programms ----------------------------------------------
    def submit(self, text: str, opts: dict | None = None, key: str | None = None,
               method: str = "ask") -> Job:
        opts = dict(opts or {})
        if method != "ask":
            opts["method"] = method
        job = Job(text, opts, key)
        with self.cv:
            self._prune()
            self.jobs[job.id] = job
            self.pending.append(job.id)
            self.asked += 1
            seen = self.ever_seen
            self.cv.notify_all()
        if not seen:
            # Kein Tab hat sich je gemeldet: dann sagen wir gleich die Wahrheit,
            # statt drei Minuten zu warten.
            t0 = time.monotonic()
            while not job.done.is_set() and not self.ever_seen and time.monotonic() - t0 < 4.0:
                job.done.wait(0.2)
            if not self.ever_seen and not job.done.is_set():
                with self.cv:
                    self.jobs.pop(job.id, None)
                    self.fails += 1
                raise SofiaError(
                    "Kein Tab mit Sofia hat sich gemeldet. Offen ist die Seite, "
                    "und wurde dort einmal `SofiaAPI.local(true)` getippt? "
                    "(Die Bruecke ist standardmaessig aus.)")
        return job

    def wait(self, job: Job, timeout: float | None = None) -> str:
        try:
            waiting = max(1.0, self.timeout) if timeout is None else timeout
            if not job.done.wait(waiting):
                raise SofiaError(
                    "Sofia hat nicht geantwortet (%ds). Ist der Tab noch offen, "
                    "und laeuft dort gerade etwas anderes?" % int(max(1, round(self.timeout))))
            if job.error:
                raise SofiaError(job.error)
            return job.answer or ""
        finally:
            with self.cv:
                self.jobs.pop(job.id, None)

    def ask(self, text: str, opts: dict | None = None, key: str | None = None,
            method: str = "ask") -> str:
        return self.wait(self.submit(text, opts, key, method))

    def _prune(self) -> None:
        if len(self.jobs) < 64:
            return
        cut = time.time() - 600
        for jid, job in list(self.jobs.items()):
            if job.created < cut and jid not in self.pending:
                self.jobs.pop(jid, None)


# ---------------------------------------------------------------------------
# Der HTTP-Server.
# ---------------------------------------------------------------------------

def _est_tokens(text: str) -> int:
    return max(1, len(text or "") // 4)


def _oai_chunk(job_id: str, model: str, delta: dict, finish: str | None = None) -> bytes:
    return json.dumps({
        "id": "chatcmpl-" + job_id, "object": "chat.completion.chunk",
        "created": int(time.time()), "model": model,
        "choices": [{"index": 0, "delta": delta, "finish_reason": finish}],
    }, ensure_ascii=False).encode("utf-8")


def _split_model(model: str) -> tuple[str, str | None]:
    """`sofia` oder `sofia@mein-faden` -> (Modellname, Faden)."""
    m = str(model or MODEL_ID)
    for sep in ("@", "#"):
        if sep in m:
            name, key = m.split(sep, 1)
            return (name.strip() or MODEL_ID), (key.strip() or None)
    return (m.strip() or MODEL_ID, None)


def _from_openai(payload: dict) -> tuple[str, str]:
    """OpenAI-Nachrichten -> (Frage, eigene Anweisung)."""
    msgs = payload.get("messages") or []
    system_parts: list[str] = []
    dialogue: list[tuple[str, str]] = []
    for m in msgs:
        if not isinstance(m, dict):
            continue
        role = str(m.get("role") or "user").lower()
        content = m.get("content")
        if isinstance(content, list):   # multimodale Nachricht
            parts = []
            images = 0
            for p in content:
                if isinstance(p, dict) and p.get("text"):
                    parts.append(str(p["text"]))
                elif isinstance(p, dict) and p.get("image_url"):
                    images += 1
            content = "\n".join(parts)
            if images:
                # Die Frage soll sauber bleiben: der Hinweis gehoert in die Anweisung.
                system_parts.append(
                    "[Hinweis: %d Bild(er) wurden mitgeschickt; ueber den lokalen Steg "
                    "koennen keine Bilder uebertragen werden.]" % images)
        content = str(content or "").strip()
        if not content:
            continue
        if role == "system":
            system_parts.append(content)
        elif role == "assistant":
            dialogue.append(("Assistant", content))
        else:
            dialogue.append(("User", content))

    question = ""
    context: list[tuple[str, str]] = []
    for i in range(len(dialogue) - 1, -1, -1):
        role, text = dialogue[i]
        if role == "User":
            question = text
            context = dialogue[:i] + dialogue[i + 1:]
            break
    else:
        context = dialogue

    system = "\n\n".join(p for p in system_parts if p)
    if context:
        hist = "\n".join("%s: %s" % (r, t) for r, t in context)
        system = (system + "\n\n" if system else "") + "[Bisheriger Verlauf]\n" + hist
    return question, system


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "SofiaPond/" + VERSION
    bridge: Bridge = None            # type: ignore[assignment]
    allow_origin: list[str] = ["*.perchance.org", "http://127.0.0.1", "http://localhost"]
    check_origin = True

    # -- kleine Helfer -----------------------------------------------------
    def log_message(self, fmt: str, *args) -> None:
        if Handler.bridge is not None and Handler.bridge.log:
            sys.stdout.write("[pont] %s\n" % (fmt % args))
            sys.stdout.flush()

    def _head(self, code: int, ctype: str | None = None, length: int | None = None,
              extra: list[tuple[str, str]] | None = None) -> None:
        self.send_response(code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Cache-Control", "no-store")
        if ctype:
            self.send_header("Content-Type", ctype)
        if length is not None:
            self.send_header("Content-Length", str(length))
        for k, v in (extra or []):
            self.send_header(k, v)
        self.end_headers()

    def _json(self, obj, code: int = 200) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self._head(code, "application/json; charset=utf-8", len(body))
        self._write(body)

    def _write(self, data: bytes) -> None:
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True

    def _body(self) -> dict:
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = 0
        if n <= 0 or n > MAX_BODY:
            return {}
        try:
            raw = self.rfile.read(n)
        except Exception:
            return {}
        try:
            data = json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            return {}
        return data if isinstance(data, dict) else {}

    def _origin_ok(self) -> bool:
        """Fremde Webseiten duerfen nicht heimlich mit ihr reden."""
        if not Handler.check_origin:
            return True
        origin = self.headers.get("Origin")
        if not origin:
            return True            # curl, Python, Node: kein Origin
        if origin == "null":
            return True            # Datei/opake Herkunft
        for pat in Handler.allow_origin:
            if pat.startswith("*."):
                host = pat[2:]
                if origin.endswith("." + host) or origin.endswith("//" + host):
                    return True
            elif origin.startswith(pat):
                return True
        self.log_message("Herkunft abgelehnt: %s (%s)", origin, self.path)
        self._json({"error": "origin_not_allowed", "origin": origin,
                    "hint": "Nur *.perchance.org und localhost. --no-origin-check schaltet die Pruefung ab."},
                   403)
        return False

    # -- SSE ---------------------------------------------------------------
    def _sse_open(self) -> None:
        self._head(200, "text/event-stream; charset=utf-8", None,
                   [("Transfer-Encoding", "chunked"), ("X-Accel-Buffering", "no")])
        try:
            self.wfile.flush()
        except Exception:
            pass

    def _sse_chunk(self, data: bytes) -> bool:
        try:
            self.wfile.write(b"%x\r\n" % len(data) + data + b"\r\n")
            self.wfile.flush()
            return True
        except (BrokenPipeError, ConnectionResetError, OSError):
            self.close_connection = True
            return False

    def _sse_event(self, payload) -> bool:
        if isinstance(payload, bytes):
            body = payload
        else:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        return self._sse_chunk(b"data: " + body + b"\n\n")

    def _sse_end(self) -> None:
        try:
            self.wfile.write(b"0\r\n\r\n")
            self.wfile.flush()
        except Exception:
            pass

    # -- HTTP --------------------------------------------------------------
    def do_OPTIONS(self) -> None:
        self._head(204)

    def do_GET(self) -> None:
        if not self._origin_ok():
            return
        path = self.path.split("?", 1)[0].rstrip("/") or "/"
        br = Handler.bridge

        if path == "/next":
            br.note_page()
            job = br.take(br.hold)
            if job is None:
                return self._json({})
            return self._json({"id": job.id, "text": job.text, "opts": job.opts, "key": job.key})

        if path == "/health":
            return self._json({
                "ok": True, "service": "sofia-pond", "version": VERSION,
                "page_seen": br.ever_seen, "page_last_seen_s": (
                    round(time.time() - br.last_seen, 1) if br.last_seen else None),
                "asked": br.asked, "answered": br.answered, "failed": br.fails,
                "pending": len(br.pending), "hold_ms": int(br.hold * 1000),
                "timeout_s": br.timeout,
            })

        if path == "/v1/models":
            return self._json({"object": "list", "data": [
                {"id": MODEL_ID, "object": "model", "created": int(time.time()),
                 "owned_by": "perchance/sofia", "permission": []},
                {"id": MODEL_ID + "@<faden>", "object": "model", "created": int(time.time()),
                 "owned_by": "perchance/sofia", "permission": []},
            ]})

        if path in ("/", "/help"):
            return self._json({
                "service": "Sofia – pont local", "version": VERSION,
                "server": "GET /next, POST /chunk, POST /answer (Tab)",
                "programm": "POST /ask, POST /v1/chat/completions, GET /v1/models, GET /health",
                "im_tab": "SofiaAPI.local(true)",
            })

        self._json({"error": "not_found", "path": path}, 404)

    def do_POST(self) -> None:
        if not self._origin_ok():
            return
        path = self.path.split("?", 1)[0].rstrip("/") or "/"
        br = Handler.bridge

        if path in ("/chunk", "/answer"):
            br.note_page()
            data = self._body()
            jid = str(data.get("id") or "")
            if path == "/chunk":
                text = data.get("text")
                job = br.jobs.get(jid)
                if job is not None and isinstance(text, str) and text:
                    job.push(text)
            else:
                if data.get("error"):
                    br.complete(jid, error=str(data.get("error")))
                else:
                    br.complete(jid, text=str(data.get("text") or ""))
            return self._json({"ok": True})

        if path == "/ask":
            return self._ask(self._body())

        if path == "/v1/chat/completions":
            return self._openai(self._body())

        self._json({"error": "not_found", "path": path}, 404)

    # -- eigene Programme --------------------------------------------------
    _OPT_MAP = {
        "maxtokens": "maxTokens", "max_tokens": "maxTokens", "maxTokens": "maxTokens",
        "skipmemory": "skipMemory", "skip_memory": "skipMemory", "keepmarkers": "keepMarkers",
        "keep_markers": "keepMarkers", "system": "system", "lang": "lang", "language": "lang",
        "temperature": "temperature", "fresh": "fresh", "raw": "raw", "explain": "explain",
        "file": "file", "code": "code", "n": "n",
    }

    def _opts_from(self, data: dict, method: str) -> tuple[dict, str | None]:
        opts: dict = {}
        for k, v in data.items():
            tgt = Handler._OPT_MAP.get(k)
            if tgt is not None and v is not None:
                opts[tgt] = v
        if method != "ask":
            opts["method"] = method
        key = data.get("key") or data.get("thread") or None
        return opts, key

    def _ask(self, data: dict) -> None:
        br = Handler.bridge
        method = str(data.get("method") or "ask").lower()
        text = str(data.get("text") or data.get("prompt") or data.get("task") or "")
        if method == "history":
            opts, key = {"n": int(data.get("n") or 20)}, None
        else:
            opts, key = self._opts_from(data, method)
        try:
            job = br.submit(text, opts, key, method=method)
        except SofiaError as e:
            return self._json({"error": str(e), "kind": "no_page"}, 503)

        if data.get("stream"):
            return self._stream_job(job)

        try:
            out = br.wait(job)
        except SofiaError as e:
            return self._json({"error": str(e), "kind": "timeout"}, 504)
        payload = {"text": out, "id": job.id, "model": MODEL_ID, "method": method}
        if method == "history":
            try:
                payload["history"] = json.loads(out) if out.strip().startswith("[") else []
            except Exception:
                payload["history"] = []
        return self._json(payload)

    def _stream_job(self, job: Job) -> None:
        br = Handler.bridge
        q: queue.Queue = queue.Queue()
        job.watch(q)
        self._sse_open()
        try:
            while True:
                try:
                    kind, data = q.get(timeout=15.0)
                except queue.Empty:
                    if not self._sse_chunk(b": ping\n\n"):
                        return
                    continue
                if kind == "chunk":
                    if not self._sse_event({"chunk": data, "id": job.id}):
                        return
                    continue
                # Ende
                if job.error:
                    self._sse_event({"error": job.error, "id": job.id, "done": True})
                else:
                    self._sse_event({"text": data, "id": job.id, "done": True})
                self._sse_chunk(b"data: [DONE]\n\n")
                return
        finally:
            job.unwatch(q)
            with br.cv:
                br.jobs.pop(job.id, None)
            self._sse_end()

    def _openai(self, payload: dict) -> None:
        br = Handler.bridge
        model, key = _split_model(payload.get("model"))
        question, system = _from_openai(payload)
        if not question:
            return self._json({"error": {"message": "messages ohne User-Nachricht",
                                         "type": "invalid_request_error"}}, 400)
        opts: dict = {}
        if system:
            opts["system"] = system
        for src, tgt in (("temperature", "temperature"), ("max_tokens", "maxTokens"),
                         ("max_completion_tokens", "maxTokens")):
            if payload.get(src) is not None:
                opts[tgt] = payload[src]
        stream = bool(payload.get("stream"))
        try:
            job = br.submit(question, opts, key)
        except SofiaError as e:
            return self._json({"error": {"message": str(e), "type": "sofia_no_page"}}, 503)

        if stream:
            q: queue.Queue = queue.Queue()
            job.watch(q)
            self._sse_open()
            first = True
            try:
                while True:
                    try:
                        kind, data = q.get(timeout=15.0)
                    except queue.Empty:
                        if not self._sse_chunk(b": ping\n\n"):
                            return
                        continue
                    if kind == "chunk":
                        delta = {"content": data}
                        if first:
                            delta = {"role": "assistant", "content": data}
                            first = False
                        if not self._sse_event(_oai_chunk(job.id, model, delta)):
                            return
                        continue
                    if job.error:
                        self._sse_event(_oai_chunk(job.id, model, {"content": "\n[Fehler] " + job.error},
                                                   "stop"))
                    elif first:
                        self._sse_event(_oai_chunk(job.id, model, {"role": "assistant", "content": ""}))
                        self._sse_event(_oai_chunk(job.id, model, {}, "stop"))
                    else:
                        self._sse_event(_oai_chunk(job.id, model, {}, "stop"))
                    self._sse_chunk(b"data: [DONE]\n\n")
                    return
            finally:
                job.unwatch(q)
                with br.cv:
                    br.jobs.pop(job.id, None)
                self._sse_end()

        try:
            out = br.wait(job)
        except SofiaError as e:
            return self._json({"error": {"message": str(e), "type": "sofia_timeout"}}, 504)
        return self._json({
            "id": "chatcmpl-" + job.id, "object": "chat.completion", "created": int(time.time()),
            "model": model,
            "choices": [{"index": 0, "finish_reason": "stop",
                         "message": {"role": "assistant", "content": out}}],
            "usage": {"prompt_tokens": _est_tokens(question + system), "completion_tokens": _est_tokens(out),
                      "total_tokens": _est_tokens(question + system) + _est_tokens(out)},
        })


def make_server(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, bridge: Bridge | None = None,
                check_origin: bool = True, allow_origin: list[str] | None = None) -> ThreadingHTTPServer:
    Handler.bridge = bridge or Bridge()
    Handler.check_origin = check_origin
    if allow_origin:
        Handler.allow_origin = allow_origin
    srv = ThreadingHTTPServer((host, port), Handler)
    srv.daemon_threads = True
    return srv


def serve(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, bridge: Bridge | None = None,
          **kw) -> tuple[ThreadingHTTPServer, threading.Thread]:
    srv = make_server(host, port, bridge, **kw)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv, t


# ---------------------------------------------------------------------------
# Kleiner Client fuer eigene Programme (nur Standardbibliothek).
# ---------------------------------------------------------------------------

class Sofia:
    """Sofia aus einem eigenen Programm fragen.

        s = Sofia()
        print(s.ask("Fasse mir diesen Text zusammen: ..."))
        for morceau in s.stream("Zaehle bis drei."):
            print(morceau, end="", flush=True)
    """

    def __init__(self, base: str = "http://127.0.0.1:8787",
                 timeout: float = DEFAULT_TIMEOUT + 60, key: str | None = None):
        self.base = base.rstrip("/")
        self.timeout = timeout
        self.key = key

    # -- intern ------------------------------------------------------------
    def _request(self, path: str, payload: dict | None) -> urllib.request.addinfourl:
        url = self.base + path
        if payload is None:
            req = urllib.request.Request(url, method="GET")
        else:
            req = urllib.request.Request(
                url, data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}, method="POST")
        return urllib.request.urlopen(req, timeout=self.timeout)

    def _json(self, path: str, payload: dict | None) -> dict:
        try:
            with self._request(path, payload) as r:
                return json.loads(r.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as e:
            try:
                return json.loads(e.read().decode("utf-8") or "{}")
            except Exception:
                raise SofiaError("pont: HTTP %s auf %s" % (e.code, path))

    def _payload(self, text: str, opts: dict, stream: bool = False) -> dict:
        p: dict = {"text": text}
        if stream:
            p["stream"] = True
        for k, v in (opts or {}).items():
            if v is not None:
                p[k] = v
        p.setdefault("key", self.key)
        return p

    # -- was man wirklich benutzt -----------------------------------------
    def health(self) -> dict:
        return self._json("/health", None)

    def models(self) -> list:
        return self._json("/v1/models", None).get("data", [])

    def ask(self, text: str, **opts) -> str:
        r = self._json("/ask", self._payload(text, opts))
        if r.get("error"):
            raise SofiaError(r["error"])
        return r.get("text", "")

    def stream(self, text: str, **opts):
        """Erzeugt die Textstuecke, so wie sie kommen."""
        try:
            with self._request("/ask", self._payload(text, opts, stream=True)) as r:
                for raw in r:
                    line = raw.decode("utf-8").strip()
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        return
                    try:
                        ev = json.loads(data)
                    except Exception:
                        continue
                    if ev.get("error"):
                        raise SofiaError(ev["error"])
                    if ev.get("chunk"):
                        yield ev["chunk"]
        except urllib.error.HTTPError as e:
            raise SofiaError("pont: HTTP %s" % e.code)

    def code(self, task: str, file: str | None = None, code: str | None = None,
             explain: bool = False, **opts) -> str:
        """Ihr Code-Auftrag: sie bekommt die Datei, sie gibt die geaenderte zurueck."""
        payload = {"task": task, "file": file, "code": code, "explain": bool(explain), "method": "code"}
        payload.update({k: v for k, v in opts.items() if v is not None})
        r = self._json("/ask", payload)
        if r.get("error"):
            raise SofiaError(r["error"])
        return r.get("text", "")

    def persona(self, **opts) -> str:
        """Ihr echter Wortlaut – fuer ein eigenes SDK."""
        r = self._json("/ask", self._payload("", dict(opts, method="persona")))
        if r.get("error"):
            raise SofiaError(r["error"])
        return r.get("text", "")

    def history(self, n: int = 20) -> list:
        """Die letzten n Nachrichten der laufenden Unterhaltung."""
        r = self._json("/ask", {"text": "", "method": "history", "n": int(n)})
        if r.get("error"):
            raise SofiaError(r["error"])
        return r.get("history") or []


# ---------------------------------------------------------------------------
# Selbsttest: tut so, als waere ein Tab offen. Ohne Browser pruefbar.
# ---------------------------------------------------------------------------

def selftest(bridge: Bridge) -> int:
    """Ein falscher Tab beantwortet jede Frage mit 'echo: <Frage>'."""
    def fake_tab():
        base = "http://%s:%d" % (SERVER_ADDRESS[0], SERVER_ADDRESS[1])
        while not STOP.is_set():
            try:
                req = urllib.request.Request(base + "/next", method="GET")
                with urllib.request.urlopen(req, timeout=15) as r:
                    job = json.loads(r.read().decode("utf-8") or "{}")
            except Exception:
                time.sleep(0.3)
                continue
            if not job.get("id"):
                continue
            text = job.get("text") or ""
            method = (job.get("opts") or {}).get("method") or "ask"
            if method == "persona":
                out = "PERSONA-DEMO"
            elif method == "history":
                out = '[]'
            else:
                out = "echo: " + text
            for i in range(0, len(out), 4):
                body = json.dumps({"id": job["id"], "text": out[i:i + 4]}).encode()
                rq = urllib.request.Request(base + "/chunk", data=body, method="POST")
                rq.add_header("Content-Type", "text/plain")
                try:
                    urllib.request.urlopen(rq, timeout=5).close()
                except Exception:
                    pass
            body = json.dumps({"id": job["id"], "text": out}).encode()
            rq = urllib.request.Request(base + "/answer", data=body, method="POST")
            rq.add_header("Content-Type", "text/plain")
            try:
                urllib.request.urlopen(rq, timeout=5).close()
            except Exception:
                pass

    STOP.clear()
    tab = threading.Thread(target=fake_tab, daemon=True)
    tab.start()
    time.sleep(0.2)

    print("[selftest] 1/6 health ......", end=" ")
    h = urllib.request.urlopen("http://%s:%d/health" % SERVER_ADDRESS, timeout=5)
    print("ok" if json.loads(h.read())["ok"] else "FEHLER")

    print("[selftest] 2/6 ask .........", end=" ")
    got = bridge.ask("ping")
    print("ok" if got == "echo: ping" else "FEHLER (%r)" % got)

    print("[selftest] 3/6 streaming ....", end=" ")
    s = Sofia(base="http://%s:%d" % SERVER_ADDRESS, timeout=30)
    out = "".join(s.stream("bruecke"))
    print("ok" if out == "echo: bruecke" else "FEHLER (%r)" % out)

    print("[selftest] 4/6 faden/methode ", end=" ")
    persona = s.persona()
    print("ok" if persona == "PERSONA-DEMO" else "FEHLER (%r)" % persona)

    print("[selftest] 5/6 openai ......", end=" ")
    req = urllib.request.Request(
        "http://%s:%d/v1/chat/completions" % SERVER_ADDRESS,
        data=json.dumps({"model": "sofia", "messages": [
            {"role": "system", "content": "kurz"},
            {"role": "user", "content": "hallo"}]}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    r = json.loads(urllib.request.urlopen(req, timeout=30).read())
    content = (((r.get("choices") or [{}])[0].get("message") or {}).get("content") or "")
    print("ok" if content == "echo: hallo" else "FEHLER (%r)" % r)

    print("[selftest] 6/6 openai-ssE ..", end=" ")
    req = urllib.request.Request(
        "http://%s:%d/v1/chat/completions" % SERVER_ADDRESS,
        data=json.dumps({"model": "sofia@faden", "stream": True,
                         "messages": [{"role": "user", "content": "strom"}]}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    raw = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
    clean = raw.replace("\\", "")
    print("ok" if ("echo: strom" in clean and "[DONE]" in raw) else "FEHLER")

    STOP.set()
    return 0


STOP = threading.Event()
SERVER_ADDRESS = (DEFAULT_HOST, DEFAULT_PORT)


# ---------------------------------------------------------------------------
# Start
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    global SERVER_ADDRESS
    ap = argparse.ArgumentParser(
        prog="sofia_pond.py",
        description="Sofia – pont local : votre programme parle à Sofia, un onglet ouvert suffit.")
    ap.add_argument("--host", default=DEFAULT_HOST, help="127.0.0.1 par défaut (ne pas ouvrir au réseau).")
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    ap.add_argument("--hold", type=int, default=DEFAULT_HOLD_MS, help="attente longue de /next, en ms")
    ap.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT, help="secondes avant abandon d'une question")
    ap.add_argument("--no-origin-check", action="store_true",
                    help="accepter n'importe quelle page web comme appelant (déconseillé)")
    ap.add_argument("--allow-origin", action="append", default=None,
                    help="origine autorisée en plus (répétable), ex. https://mon-site.fr")
    ap.add_argument("--selftest", action="store_true", help="test sans navigateur")
    ap.add_argument("--demo", nargs="?", const="En une phrase : qui es-tu ?", default=None,
                    help="après le démarrage, poser une question")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)

    bridge = Bridge(hold_ms=min(args.hold, 1500) if args.selftest else args.hold,
                    timeout=args.timeout, log=not args.quiet)
    try:
        srv = make_server(args.host, args.port, bridge,
                          check_origin=not args.no_origin_check,
                          allow_origin=args.allow_origin)
    except OSError as e:
        print("Le port %d est déjà pris (%s). Essayez : --port %d"
              % (args.port, e, args.port + 1))
        return 2
    SERVER_ADDRESS = (args.host, args.port)
    runner = threading.Thread(target=srv.serve_forever, daemon=True)
    runner.start()

    if args.selftest:
        print("[selftest] serveur sur http://%s:%d" % SERVER_ADDRESS)
        code = selftest(bridge)
        srv.shutdown()
        print("[selftest] terminé" if code == 0 else "[selftest] échec")
        return code

    print("")
    print("  Sofia – pont local   v%s" % VERSION)
    print("  ------------------------------------------------")
    print("  Serveur      : http://%s:%d" % SERVER_ADDRESS)
    print("  Adresse base : http://%s:%d/v1   (OpenAI compatible)" % SERVER_ADDRESS)
    print("")
    print("  1. Laissez cette fenêtre ouverte.")
    print("  2. Dans l'onglet de Sofia, une fois :   SofiaAPI.local(true)")
    print("  3. Ici, dans un autre programme :")
    print("       from sofia_pond import Sofia")
    print("       print(Sofia().ask(\"En une phrase : qui es-tu ?\"))")
    print("")
    print("  Arrêt : Ctrl+C")
    print("")

    if args.demo:
        try:
            out = bridge.ask(args.demo)
            print("[essai] %s\n" % out)
        except SofiaError as e:
            print("[essai] %s\n" % e)

    try:
        while runner.is_alive():
            runner.join(0.5)
    except KeyboardInterrupt:
        print("\n[arrêt] pont fermé")
    finally:
        srv.shutdown()
        srv.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
