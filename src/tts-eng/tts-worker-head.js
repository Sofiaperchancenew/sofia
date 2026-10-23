let tts = null;
let pendingModel = null;
let runtimeReady = false;
let wasmBinUrl = '';
let pendingWasm = null;
let emptyDataUrl = '';
try { emptyDataUrl = URL.createObjectURL(new Blob([new Uint8Array(0)], { type: 'application/octet-stream' })); } catch (e) {}
self.Module = {
  locateFile: function (path, scriptDirectory) {
    const s = String(path || '');
    if (s.indexOf('.wasm') !== -1 && wasmBinUrl) return wasmBinUrl;
    if (s.indexOf('.data') !== -1 && emptyDataUrl) return emptyDataUrl;
    return (scriptDirectory || '') + path;
  },
  instantiateWasm: function (imports, successCallback) {
    const go = function () {
      fetch(wasmBinUrl).then((r) => {
        if (!r.ok) throw new Error('wasm http ' + r.status);
        return r.arrayBuffer();
      }).then((bin) => WebAssembly.instantiate(bin, imports)).then((res) => {
        successCallback(res.instance, res.module);
      }).catch((e) => {
        try { self.postMessage({ type: 'sofia-tts-log', text: 'ERR: wasm instantiate: ' + (e && e.message ? e.message : e) }); } catch (e2) {}
      });
    };
    if (wasmBinUrl) go();
    else pendingWasm = go;
  },
  setStatus: function (status) {
    self.postMessage({ type: 'sofia-tts-progress', status: String(status || '') });
  },
  print: function (text) {
    self.postMessage({ type: 'sofia-tts-log', text: String(text || '') });
  },
  printErr: function (text) {
    self.postMessage({ type: 'sofia-tts-log', text: 'ERR: ' + String(text || '') });
  },
  onRuntimeInitialized: function () {
    runtimeReady = true;
    self.postMessage({ type: 'sofia-tts-runtime' });
    if (pendingModel) {
      const m = pendingModel;
      pendingModel = null;
      initTts(m.model, m.tokens);
    }
  }
};
