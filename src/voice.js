const LS_KEY = "sofia_voice_v1";
const TTS_REGIONS = {
  fr: [["FR", "France"], ["CA", "Canada / Québec"], ["BE", "Belgique"], ["CH", "Suisse"]],
  en: [["US", "États-Unis"], ["GB", "Royaume-Uni"], ["CA", "Canada"], ["AU", "Australie"], ["IN", "Inde"]],
  de: [["DE", "Allemagne"], ["AT", "Autriche"], ["CH", "Suisse"]],
  es: [["ES", "Espagne"], ["MX", "Mexique"], ["AR", "Argentine"], ["US", "États-Unis"]],
  it: [["IT", "Italie"], ["CH", "Suisse"]],
  pt: [["PT", "Portugal"], ["BR", "Brésil"]],
  nl: [["NL", "Pays-Bas"], ["BE", "Belgique"]],
  pl: [["PL", "Pologne"]],
  cs: [["CZ", "Tchéquie"]],
  sk: [["SK", "Slovaquie"]],
  hu: [["HU", "Hongrie"]],
  ro: [["RO", "Roumanie"]],
  bg: [["BG", "Bulgarie"]],
  hr: [["HR", "Croatie"]],
  sr: [["RS", "Serbie"]],
  el: [["GR", "Grèce"]],
  tr: [["TR", "Turquie"]],
  ru: [["RU", "Russie"]],
  uk: [["UA", "Ukraine"]],
  sv: [["SE", "Suède"]],
  da: [["DK", "Danemark"]],
  nb: [["NO", "Norvège"]],
  fi: [["FI", "Finlande"]],
  ar: [["SA", "Arabie"], ["EG", "Égypte"]],
  he: [["IL", "Israël"]],
  fa: [["IR", "Iran"]],
  ur: [["PK", "Pakistan"]],
  hi: [["IN", "Inde"]],
  bn: [["BD", "Bangladesh"]],
  zh: [["CN", "Chine"], ["TW", "Taïwan"], ["HK", "Hong Kong"]],
  ja: [["JP", "Japon"]],
  ko: [["KR", "Corée"]],
  vi: [["VN", "Viêt Nam"]],
  th: [["TH", "Thaïlande"]],
  id: [["ID", "Indonésie"]],
  ms: [["MY", "Malaisie"]]
};
const TEST_PHRASES = {
  fr: "Bonjour, je suis Sofia. Voici ma voix actuelle.",
  en: "Hello, I am Sofia. This is my current voice.",
  de: "Hallo, ich bin Sofia. Das ist meine aktuelle Stimme.",
  es: "Hola, soy Sofia. Esta es mi voz actual.",
  it: "Ciao, sono Sofia. Questa è la mia voce attuale.",
  pt: "Olá, eu sou a Sofia. Esta é a minha voz atual."
};
function regionsFor(lang) { return TTS_REGIONS[lang] || [[lang.toUpperCase(), lang.toUpperCase()]]; }
function defaultRegion(lang) { return regionsFor(lang)[0][0]; }
function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e) { return {}; }
}
function save(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
}
function pickVoice(name, bcp47) {
  try {
    const vs = speechSynthesis.getVoices ? speechSynthesis.getVoices() : [];
    if (!vs.length) return null;
    if (name) {
      const f = vs.find((v) => v.name === name);
      if (f) return f;
    }
    const b = String(bcp47 || "").toLowerCase();
    const lang = b.split("-")[0];
    return vs.find((v) => String(v.lang || "").toLowerCase() === b)
      || vs.find((v) => String(v.lang || "").toLowerCase().indexOf(lang) === 0)
      || vs.find((v) => String(v.lang || "").toLowerCase().indexOf("fr") === 0)
      || vs[0];
  } catch (e) { return null; }
}
export function attachVoice(App, deps) {
  App = App || {};
  const N = App.Voice || {};
  const S = Object.assign({ voiceMode: false, autoSpeak: false, female: true, pitch: 1.3, rate: 1.4, voice: "", region: "", liveEnabled: false, liveLang: "auto", liveAutoSend: false, sttEngine: "auto", sttModel: "", sttMic: "", sttCorrect: "auto" }, load());
  function baseLang() {
    try {
      const s = String((App && App.State && App.State.settings && App.State.settings.language) || "fr");
      return s.split(/[-_]/)[0].toLowerCase() || "fr";
    } catch (e) { return "fr"; }
  }
  function validRegion(lang, r) {
    const list = regionsFor(lang);
    const up = String(r || "").toUpperCase();
    for (const e of list) if (e[0] === up) return up;
    return null;
  }
  function ttsBcp47() { const lang = baseLang(); return lang + "-" + (validRegion(lang, S.region) || defaultRegion(lang)); }
  let streamBuf = "";
  let suppressOnce = false;
  let recog = null;
  let liveRecog = null;
  function persist() { save(S); }
  function utter(text) {
    try {
      if (!("speechSynthesis" in window)) return false;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).slice(0, 1200));
      const b = ttsBcp47();
      u.lang = b;
      const v = pickVoice(S.voice, b);
      if (v) { u.voice = v; try { if (String(v.lang || "").toLowerCase().indexOf(baseLang()) !== 0) u.lang = v.lang; } catch (e2) {} }
      u.pitch = Number(S.pitch) || 1;
      u.rate = Number(S.rate) || 1;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function plain(text) {
    return String(text == null ? "" : text).replace(/[#*_`>\[\]()|]/g, "").replace(/\[(SOFIA_IMAGE|SOFIA_VIDEO)[^\]]*\]/gi, "").trim();
  }
  if (typeof N.speak !== "function") N.speak = function(text, btn) {
    const t = plain(text);
    if (!t) return false;
    return utter(t);
  };
  if (typeof N.testVoice !== "function") N.testVoice = function() {
    utter(TEST_PHRASES[baseLang()] || TEST_PHRASES.en);
  };
  if (typeof N.onSend !== "function") N.onSend = function() { streamBuf = ""; };
  if (typeof N.onGenerationStart !== "function") N.onGenerationStart = function() { streamBuf = ""; };
  if (typeof N.onGenerationEnd !== "function") N.onGenerationEnd = function() {
    try {
      if (suppressOnce) { suppressOnce = false; return; }
      if (S.autoSpeak && streamBuf.trim()) utter(plain(streamBuf));
    } catch (e) {}
    streamBuf = "";
  };
  if (typeof N.feedStreamText !== "function") N.feedStreamText = function(t) {
    try { streamBuf += String(t == null ? "" : t); } catch (e) {}
  };
  if (typeof N.restartStreamText !== "function") N.restartStreamText = function() { streamBuf = ""; };
  if (typeof N.ensureSpokenTurn !== "function") N.ensureSpokenTurn = function() {};
  if (typeof N.suppressNextAutoSpeak !== "function") N.suppressNextAutoSpeak = function() { suppressOnce = true; };
  function makeRecog(onText) {
    try {
      const RC = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!RC) return null;
      const r = new RC();
      r.interimResults = false;
      r.lang = (S.liveLang && S.liveLang !== "auto") ? S.liveLang : ttsBcp47();
      r.onresult = function(ev) {
        try {
          const t = ev.results[0][0].transcript;
          if (typeof onText === "function") onText(t);
          else {
            const box = document.querySelector("#chatInputEl, #msgInputEl, textarea");
            if (box) { box.value = (box.value ? box.value + " " : "") + t; box.focus(); }
          }
        } catch (e) {}
      };
      return r;
    } catch (e) { return null; }
  }
  if (typeof N.toggleListening !== "function") N.toggleListening = function() {
    try {
      if (recog) { recog.stop(); recog = null; return; }
      recog = makeRecog();
      if (!recog) return;
      recog.onend = function() { recog = null; };
      recog.start();
    } catch (e) {}
  };
  if (typeof N.toggleLive !== "function") N.toggleLive = function() {
    try {
      if (liveRecog) { liveRecog.stop(); liveRecog = null; return; }
      liveRecog = makeRecog(function(t) {
        const box = document.querySelector("#chatInputEl, #msgInputEl, textarea");
        if (box) box.value = (box.value ? box.value + " " : "") + t;
        if (S.liveAutoSend && App.Core && typeof App.Core.send === "function") App.Core.send();
      });
      if (!liveRecog) return;
      liveRecog.continuous = true;
      liveRecog.onend = function() { liveRecog = null; };
      liveRecog.start();
    } catch (e) {}
  };
  if (typeof N.validateLive !== "function") N.validateLive = function() {
    try { if (liveRecog) { liveRecog.stop(); liveRecog = null; } } catch (e) {}
  };
  if (typeof N.liveLangSetting !== "function") N.liveLangSetting = function() { return S.liveLang || "auto"; };
  function set(k, v) { S[k] = v; persist(); try { N.refreshUI(); } catch (e) {} }
  if (typeof N.setVoiceMode !== "function") N.setVoiceMode = function(v) { set("voiceMode", !!v); };
  if (typeof N.setAutoSpeak !== "function") N.setAutoSpeak = function(v) { set("autoSpeak", !!v); };
  if (typeof N.setFemale !== "function") N.setFemale = function(v) { set("female", !!v); };
  if (typeof N.setPitch !== "function") N.setPitch = function(v) { set("pitch", Number(v) || 1); };
  if (typeof N.setRate !== "function") N.setRate = function(v) { set("rate", Number(v) || 1); };
  if (typeof N.setVoice !== "function") N.setVoice = function(v) { set("voice", String(v == null ? "" : v)); };
  if (typeof N.setRegion !== "function") N.setRegion = function(v) {
    const lang = baseLang();
    const ok = validRegion(lang, v) || defaultRegion(lang);
    set("region", ok);
  };
  if (typeof N.ttsLang !== "function") N.ttsLang = function() { try { return ttsBcp47(); } catch (e) { return "fr-FR"; } };
  if (typeof N.setLiveEnabled !== "function") N.setLiveEnabled = function(v) { set("liveEnabled", !!v); };
  if (typeof N.setLiveLang !== "function") N.setLiveLang = function(v) { set("liveLang", String(v == null ? "auto" : v)); };
  if (typeof N.setLiveAutoSend !== "function") N.setLiveAutoSend = function(v) { set("liveAutoSend", !!v); };
  if (typeof N.setSttEngine !== "function") N.setSttEngine = function(v) { set("sttEngine", String(v == null ? "auto" : v)); };
  if (typeof N.setSttModel !== "function") N.setSttModel = function(v) { set("sttModel", String(v == null ? "" : v)); };
  if (typeof N.setSttMic !== "function") N.setSttMic = function(v) { set("sttMic", String(v == null ? "" : v)); };
  if (typeof N.setSttCorrect !== "function") N.setSttCorrect = function(v) { set("sttCorrect", String(v == null ? "auto" : v)); };
  if (typeof N.refreshUI !== "function") N.refreshUI = function() {
    try {
      const map = [["voiceModeCheck", "voiceMode"], ["autoSpeakCheck", "autoSpeak"], ["femaleVoiceCheck", "female"], ["liveListenCheck", "liveEnabled"], ["liveAutoSendCheck", "liveAutoSend"]];
      for (const pair of map) {
        const el = document.getElementById(pair[0]);
        if (el && el.type === "checkbox") el.checked = !!S[pair[1]];
      }
      const sel = document.getElementById("liveListenLangSelect");
      if (sel && S.liveLang) sel.value = S.liveLang;
      const rs = document.getElementById("ttsRegionSelect");
      if (rs) {
        const lang = baseLang();
        if (!validRegion(lang, S.region)) { S.region = defaultRegion(lang); persist(); }
        rs.innerHTML = "";
        for (const e of regionsFor(lang)) {
          const o = document.createElement("option");
          o.value = e[0];
          o.textContent = e[1] + " (" + lang + "-" + e[0] + ")";
          rs.appendChild(o);
        }
        rs.value = S.region;
      }
      const vs = document.getElementById("ttsVoiceSelect");
      if (vs && (vs.options.length === 0 || vs.dataset.lang !== baseLang())) {
        try {
          const voices = speechSynthesis.getVoices ? speechSynthesis.getVoices() : [];
          vs.innerHTML = "";
          vs.dataset.lang = baseLang();
          const b = ttsBcp47().toLowerCase(), lg = b.split("-")[0];
          const match = voices.filter((v) => String(v.lang || "").toLowerCase().indexOf(lg) === 0);
          const rest = voices.filter((v) => String(v.lang || "").toLowerCase().indexOf(lg) !== 0);
          for (const v of match.concat(rest).slice(0, 80)) {
            const o = document.createElement("option");
            o.value = v.name; o.textContent = v.name + " (" + v.lang + ")";
            vs.appendChild(o);
          }
          if (S.voice) vs.value = S.voice;
        } catch (e) {}
      }
    } catch (e) {}
  };
  if (typeof N.init !== "function") N.init = function() {
    try {
      if ("speechSynthesis" in window && speechSynthesis.getVoices) {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = function() { try { N.refreshUI(); } catch (e) {} };
      }
      N.refreshUI();
    } catch (e) {}
  };
  App.Voice = N;
  return N;
}
