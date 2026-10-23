function ttsFS() {
  try { if (self.Module && self.Module.FS) return self.Module.FS; } catch (e) {}
  try { if (typeof FS !== 'undefined' && FS) return FS; } catch (e) {}
  try { if (self && self.FS) return self.FS; } catch (e) {}
  return null;
}
function initTts(modelBuf, tokensText) {
  try {
    const FS = ttsFS();
    if (!FS) throw new Error('no FS');
    try { FS.writeFile('/model.onnx', new Uint8Array(modelBuf)); } catch (e) {
      const s = FS.open('/model.onnx', 'w+');
      FS.write(s, new Uint8Array(modelBuf), 0, modelBuf.byteLength, 0);
      FS.close(s);
    }
    try { FS.writeFile('/tokens.txt', tokensText); } catch (e2) {
      const s2 = FS.open('/tokens.txt', 'w+');
      const b = new TextEncoder().encode(tokensText);
      FS.write(s2, b, 0, b.length, 0);
      FS.close(s2);
    }
    tts = createOfflineTts(self.Module);
    self.postMessage({ type: 'sofia-tts-ready', sampleRate: tts.sampleRate, numSpeakers: tts.numSpeakers, lang: tts.lang });
  } catch (e) {
    self.postMessage({ type: 'error', message: 'TTS init failed: ' + (e && e.message ? e.message : e) });
  }
}
self.onmessage = function (e) {
  const d = e.data || {};
  if (d.type === 'urls') {
    wasmBinUrl = d.wasm || '';
    if (wasmBinUrl && pendingWasm) { const f = pendingWasm; pendingWasm = null; try { f(); } catch (e) {} }
    return;
  }
  if (d.type === 'stat') {
    try {
      const FS = ttsFS();
      const names = FS.readdir('/');
      const info = names.map(function (n) {
        try { const st = FS.stat('/' + n); return n + ':' + st.size; }
        catch (e) { return n + ':?'; }
      });
      self.postMessage({ type: 'sofia-tts-stat', info: info });
    } catch (e) { self.postMessage({ type: 'error', id: d.id, message: 'stat failed: ' + (e && e.message ? e.message : e) }); }
    return;
  }
  if (d.type === 'init') {
    if (!runtimeReady) { pendingModel = { model: d.model, tokens: d.tokens }; return; }
    initTts(d.model, d.tokens);
    return;
  }
  if (d.type === 'speak') {
    if (!tts) { self.postMessage({ type: 'error', id: d.id, message: 'not ready' }); return; }
    try {
      const pcs = (d.codepoints && Array.isArray(d.codepoints) && d.codepoints.length && Array.isArray(d.codepoints[0])) ? d.codepoints : [d.codepoints];
      const audio = tts.generateWithConfig('', { phonemeCodepoints: pcs, sid: 0, speed: d.speed || 1.0 });
      self.postMessage({ type: 'sofia-tts-audio', id: d.id, samples: audio.samples, sampleRate: audio.sampleRate }, [audio.samples.buffer]);
    } catch (err) {
      self.postMessage({ type: 'error', id: d.id, message: 'generate failed: ' + (err && err.message ? err.message : err) });
    }
  }
};
