export function attachMedias(App) {
  const RADIO_API = "https://de1.api.radio-browser.info";
  const ARCHIVE_EMBED = "https://archive.org/embed/";
  const RADIO_PRESETS = [
    { keys: ["france inter"], items: [
      { kind: "radio", title: "France Inter", country: "France", themes: ["info", "culture"], sub: "France · Français · MP3", stream: "https://icecast.radiofrance.fr/franceinter-midfi.mp3", page: "https://www.radiofrance.fr/franceinter", tags: "france inter generaliste" }
    ] },
    { keys: ["france info", "franceinfo"], items: [
      { kind: "radio", title: "France Info", country: "France", themes: ["info"], sub: "France · Français · MP3 · info en continu", stream: "https://icecast.radiofrance.fr/franceinfo-midfi.mp3", page: "https://www.radiofrance.fr/franceinfo", tags: "france info actualites" }
    ] },
    { keys: ["france culture"], items: [
      { kind: "radio", title: "France Culture", country: "France", themes: ["culture"], sub: "France · Français · MP3", stream: "https://icecast.radiofrance.fr/franceculture-midfi.mp3", page: "https://www.radiofrance.fr/franceculture", tags: "france culture savoirs" }
    ] },
    { keys: ["france musique"], items: [
      { kind: "radio", title: "France Musique", country: "France", themes: ["classique", "jazz"], sub: "France · Français · MP3 · classique jazz", stream: "https://icecast.radiofrance.fr/francemusique-midfi.mp3", page: "https://www.radiofrance.fr/francemusique", tags: "france musique classique" }
    ] },
    { keys: ["fip"], items: [
      { kind: "radio", title: "FIP", country: "France", themes: ["jazz", "soul", "rock", "pop"], sub: "France · Français · MP3 · éclectique", stream: "https://icecast.radiofrance.fr/fip-midfi.mp3", page: "https://www.radiofrance.fr/fip", tags: "fip eclectique" }
    ] },
    { keys: ["mouv", "le mouv"], items: [
      { kind: "radio", title: "Le Mouv'", country: "France", themes: ["electro", "rap"], sub: "France · Français · MP3 · hip-hop électro", stream: "https://icecast.radiofrance.fr/mouv-midfi.mp3", page: "https://www.radiofrance.fr/mouv", tags: "mouv jeunes hip-hop" }
    ] },
    { keys: ["rtl"], items: [
      { kind: "radio", title: "RTL", country: "France", themes: ["info", "varietes"], sub: "France · Français", stream: "https://icecast.rtl.fr/rtl-1-44-128", page: "https://www.rtl.fr/", tags: "rtl generaliste" }
    ] },
    { keys: ["europe 1"], items: [
      { kind: "radio", title: "Europe 1", country: "France", themes: ["info"], sub: "France · Français · MP3", stream: "https://stream.europe1.fr/europe1.mp3", page: "https://www.europe1.fr/", tags: "europe 1 generaliste" }
    ] },
    { keys: ["europe 2"], items: [
      { kind: "radio", title: "Europe 2", country: "France", themes: ["rock", "pop"], sub: "France · Français · MP3 · pop rock", stream: "https://europe2.lmn.fm/europe2.mp3", page: "https://www.europe2.fr/", tags: "europe 2 pop rock" }
    ] },
    { keys: ["nrj"], items: [
      { kind: "radio", title: "NRJ", country: "France", themes: ["hits", "pop", "electro"], sub: "France · Français · MP3 · hits", stream: "https://cdn.nrjaudio.fm/audio1/fr/30001/mp3_128.mp3", page: "https://www.nrj.fr/", tags: "nrj hits" }
    ] },
    { keys: ["nostalgie"], items: [
      { kind: "radio", title: "Nostalgie", country: "France", themes: ["varietes", "pop"], sub: "France · Français · les plus grands classiques", stream: "https://streaming.nrjaudio.fm/oug7girb92oc?origine=fluxradios", page: "https://www.nostalgie.fr/", tags: "nostalgie annees 80 90" }
    ] },
    { keys: ["cherie fm", "cherie"], items: [
      { kind: "radio", title: "Chérie FM", country: "France", themes: ["pop", "varietes"], sub: "France · Français · MP3 · pop douce", stream: "https://cdnradio.streamakaci.com/cheriefm1.mp3", page: "https://www.cheriefm.fr/", tags: "cherie fm pop" }
    ] },
    { keys: ["fun radio"], items: [
      { kind: "radio", title: "Fun Radio", country: "France", themes: ["electro", "hits"], sub: "France · Français · dancefloor", stream: "https://icecast.funradio.fr/fun-1-44-128", page: "https://www.funradio.fr/", tags: "fun radio dance electro" }
    ] },
    { keys: ["rfm"], items: [
      { kind: "radio", title: "RFM", country: "France", themes: ["pop", "varietes"], sub: "France · Français · MP3 · best des années 80 à aujourd'hui", stream: "https://stream.rfm.fr/rfm.mp3", page: "https://www.rfm.fr/", tags: "rfm pop" }
    ] },
    { keys: ["rire et chansons"], items: [
      { kind: "radio", title: "Rire et Chansons", country: "France", themes: ["humour"], sub: "France · Français · humour", stream: "https://streaming.nrjaudio.fm/ou8o8xgk7oiu?origine=fluxradios", page: "https://www.rireetchansons.fr/", tags: "rire et chansons humour sketches" }
    ] },
    { keys: ["skyrock"], items: [
      { kind: "radio", title: "Skyrock", country: "France", themes: ["rap"], sub: "France · Français · rap R&B", stream: "https://icecast.skyrock.net/s/natio_mp3_128k", page: "https://www.skyrock.fm/", tags: "skyrock rap rnb" }
    ] },
    { keys: ["oui fm"], items: [
      { kind: "radio", title: "OUI FM", country: "France", themes: ["rock"], sub: "France · Français · MP3 · rock", stream: "https://ouifm.ice.infomaniak.ch/ouifm-high.mp3", page: "https://www.ouifm.fr/", tags: "oui fm rock" }
    ] },
    { keys: ["radio nova", "nova"], items: [
      { kind: "radio", title: "Radio Nova", country: "France", themes: ["electro", "soul", "jazz"], sub: "France · Français · MP3 · éclectique", stream: "https://novazz.ice.infomaniak.ch/novazz-128.mp3", page: "https://www.nova.fr/", tags: "nova world electro" }
    ] },
    { keys: ["tsf jazz", "tsf"], items: [
      { kind: "radio", title: "TSF Jazz", country: "France", themes: ["jazz", "soul"], sub: "France · Français · MP3 · jazz", stream: "https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3", page: "https://www.tsfjazz.com/", tags: "tsf jazz" }
    ] },
    { keys: ["jazz radio"], items: [
      { kind: "radio", title: "Jazz Radio", country: "France", themes: ["jazz", "soul"], sub: "France · Français · MP3 · jazz soul", stream: "https://jazzradio.ice.infomaniak.ch/jazzradio-high.mp3", page: "https://www.jazzradio.fr/", tags: "jazz radio soul funk" }
    ] },
    { keys: ["sud radio"], items: [
      { kind: "radio", title: "Sud Radio", country: "France", themes: ["info"], sub: "France · Français · MP3 · débats", stream: "https://start-sud.ice.infomaniak.ch/start-sud-high.mp3", page: "https://www.sudradio.fr/", tags: "sud radio debats" }
    ] },
    { keys: ["bfm business", "bfm"], items: [
      { kind: "radio", title: "BFM Business", country: "France", themes: ["info"], sub: "France · Français · MP3 · économie", stream: "https://audio.bfmtv.com/bfmbusiness_128.mp3", page: "https://www.bfmbusiness.com/", tags: "bfm business economie" }
    ] },
    { keys: ["top music"], items: [
      { kind: "radio", title: "Top Music Strasbourg", country: "France", themes: ["hits", "pop"], sub: "France · Français · MP3 · 128 kbps", stream: "https://sc.creacast.com/topmusic_strasbourg", page: "https://www.topmusic.fr/", tags: "top music alsace strasbourg" },
      { kind: "radio", title: "Top Music Colmar", country: "France", themes: ["hits", "pop"], sub: "France · Français · MP3 · 128 kbps", stream: "https://sc.creacast.com/topmusic_colmar", page: "https://www.topmusic.fr/", tags: "top music alsace colmar" },
      { kind: "radio", title: "Top Music Mulhouse", country: "France", themes: ["hits", "pop"], sub: "France · Français · MP3 · 128 kbps", stream: "https://sc.creacast.com/topmusic_mulhouse", page: "https://www.topmusic.fr/", tags: "top music alsace mulhouse" },
      { kind: "radio", title: "Top Music Haguenau", country: "France", themes: ["hits", "pop"], sub: "France · Français · MP3 · 128 kbps", stream: "https://sc.creacast.com/topmusic_haguenau", page: "https://www.topmusic.fr/", tags: "top music alsace haguenau" },
      { kind: "radio", title: "Top Music Sélestat", country: "France", themes: ["hits", "pop"], sub: "France · Français · MP3 · 128 kbps", stream: "https://sc.creacast.com/topmusic_selestat", page: "https://www.topmusic.fr/", tags: "top music alsace selestat" }
    ] },
    { keys: ["rfi monde", "rfi"], items: [
      { kind: "radio", title: "RFI Monde", country: "France", themes: ["info"], sub: "France · Français · MP3 · actualité mondiale", stream: "https://rfimonde64k.ice.infomaniak.ch/rfimonde-64.mp3", page: "https://www.rfi.fr/", tags: "rfi monde international" }
    ] },
    { keys: ["rfi afrique"], items: [
      { kind: "radio", title: "RFI Afrique", country: "France", themes: ["info"], sub: "France · Français · MP3 · actualité africaine", stream: "https://rfiafrique64k.ice.infomaniak.ch/rfiafrique-64.mp3", page: "https://www.rfi.fr/", tags: "rfi afrique" }
    ] },
    { keys: ["rts la premiere", "la premiere"], items: [
      { kind: "radio", title: "RTS La Première", country: "Suisse", themes: ["info", "culture"], sub: "Suisse · Français · MP3", stream: "https://stream.srg-ssr.ch/m/la-1ere/mp3_128", page: "https://www.rts.ch/", tags: "rts suisse romande" }
    ] },
    { keys: ["couleur 3"], items: [
      { kind: "radio", title: "Couleur 3", country: "Suisse", themes: ["rock", "electro", "pop"], sub: "Suisse · Français · MP3 · pop culture", stream: "https://stream.srg-ssr.ch/m/couleur3/mp3_128", page: "https://www.rts.ch/", tags: "couleur 3 suisse" }
    ] },
    { keys: ["classic 21", "classic21"], items: [
      { kind: "radio", title: "Classic 21", country: "Belgique", themes: ["rock"], sub: "Belgique · Français · MP3 · rock classique", stream: "https://radios.rtbf.be/classic21-128.mp3", page: "https://www.rtbf.be/", tags: "classic 21 belgique rtbf rock" }
    ] },
    { keys: ["classic fm"], items: [
      { kind: "radio", title: "Classic FM", country: "Royaume-Uni", themes: ["classique"], sub: "Royaume-Uni · English · MP3 · classique", stream: "https://media-ssl.musicradio.com/ClassicFMMP3", page: "https://www.classicfm.com/", tags: "classic fm uk classical" }
    ] },
    { keys: ["npo radio 1", "npo"], items: [
      { kind: "radio", title: "NPO Radio 1", country: "Pays-Bas", themes: ["info"], sub: "Pays-Bas · Nederlands · MP3 · info", stream: "https://icecast.omroep.nl/radio1-bb-mp3", page: "https://www.nporadio1.nl/", tags: "npo nederland nieuws" }
    ] },
    { keys: ["rai radio 1", "rai"], items: [
      { kind: "radio", title: "Rai Radio 1", country: "Italie", themes: ["info"], sub: "Italie · Italiano · MP3 · info", stream: "https://icestreaming.rai.it/1.mp3", page: "https://www.raiplaysound.it/", tags: "rai italia notizie" }
    ] },
    { keys: ["groove salad", "somafm", "soma fm"], items: [
      { kind: "radio", title: "SomaFM Groove Salad", country: "USA", themes: ["ambient", "electro"], sub: "USA · English · MP3 · ambient downtempo", stream: "https://ice1.somafm.com/groovesalad-128-mp3", page: "https://somafm.com/", tags: "somafm ambient chill" }
    ] },
    { keys: ["defcon", "def con"], items: [
      { kind: "radio", title: "SomaFM DEF CON Radio", country: "USA", themes: ["electro"], sub: "USA · English · MP3 · hacker electro", stream: "https://ice1.somafm.com/defcon-128-mp3", page: "https://somafm.com/", tags: "somafm defcon hacker" }
    ] },
    { keys: ["kexp"], items: [
      { kind: "radio", title: "KEXP Seattle", country: "USA", themes: ["rock", "pop"], sub: "USA · English · MP3 · indépendant", stream: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3", page: "https://www.kexp.org/", tags: "kexp seattle indie" }
    ] },
    { keys: ["metal detector", "metal"], items: [
      { kind: "radio", title: "SomaFM Metal Detector", country: "USA", themes: ["metal"], sub: "USA · English · MP3 · métal", stream: "https://ice1.somafm.com/metal-128-mp3", page: "https://somafm.com/", tags: "somafm metal detector" }
    ] }
  ];
  function normStation(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/([a-z])([0-9])/g, "$1 $2").replace(/([0-9])([a-z])/g, "$1 $2").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function cleanRadioQuery(q) {
    return String(q || "").replace(/\s+(en\s+)?(la\s+|le\s+|les\s+)?(radio|radios|station|stations)\s*$/i, "").replace(/^(la\s+|le\s+|les\s+)?(radio|radios|station|stations)\s+/i, "").trim();
  }
  function presetRadios(q) {
    const nq = " " + normStation(q) + " ";
    const out = [];
    for (const p of RADIO_PRESETS) {
      for (const k of p.keys) {
        if (nq.indexOf(" " + normStation(k) + " ") >= 0) {
          for (const it of p.items) out.push(Object.assign({}, it));
          break;
        }
      }
    }
    return out;
  }
  const THEME_ALIASES = {
    info: ["info", "infos", "information", "informations", "actualite", "actualites", "news", "journal"],
    culture: ["culture", "culturel", "savoirs"],
    rock: ["rock", "poprock", "punk"],
    classique: ["classique", "classical", "classic", "baroque"],
    jazz: ["jazz", "blues", "swing"],
    electro: ["electro", "techno", "dance", "house", "edm", "downtempo", "trance"],
    pop: ["pop"],
    hits: ["hit", "hits", "tube", "tubes", "top"],
    humour: ["humour", "humoristique", "comique", "drole", "sketch", "sketches"],
    soul: ["soul", "funk", "disco", "rnb"],
    metal: ["metal", "hard"],
    ambient: ["ambient", "chill", "lounge", "detente", "relax", "relaxation", "zen"],
    rap: ["rap", "hiphop", "hip"],
    varietes: ["varietes", "variete", "chanson", "chansons", "francophone"]
  };
  const THEME_LABEL = { info: "Info", culture: "Culture", rock: "Rock", classique: "Classique", jazz: "Jazz", electro: "Électro", pop: "Pop", hits: "Hits", humour: "Humour", soul: "Soul & Funk", metal: "Métal", ambient: "Ambient", rap: "Rap & Hip-hop", varietes: "Variétés" };
  const THEME_WORDS = {};
  for (const th of Object.keys(THEME_ALIASES)) {
    THEME_WORDS[th] = th;
    for (const w of THEME_ALIASES[th]) if (!THEME_WORDS[w]) THEME_WORDS[w] = th;
  }
  const COUNTRY_ALIASES = {
    "France": ["france", "francais", "francaise", "francaises", "francophones"],
    "Suisse": ["suisse", "suisses", "romande", "romand"],
    "Belgique": ["belgique", "belge", "belges"],
    "Royaume-Uni": ["royaume uni", "angleterre", "anglais", "anglaise", "anglaises", "uk", "britannique"],
    "Pays-Bas": ["pays bas", "hollande", "hollandais", "hollandaise", "neerlandais", "neerlandaise"],
    "Italie": ["italie", "italien", "italienne", "italiennes"],
    "USA": ["usa", "etats unis", "americain", "americaine", "americaines", "americains", "amerique"],
    "Pologne": ["pologne", "polonais", "polonaise", "polonaises", "polski", "polskie"],
    "Allemagne": ["allemagne", "allemand", "allemande", "allemandes", "deutsch", "deutschland"],
    "Espagne": ["espagne", "espagnol", "espagnole", "espagnoles"],
    "Portugal": ["portugal", "portugais", "portugaise", "portugaises"],
    "Canada": ["canada", "canadien", "canadienne", "canadiennes", "quebec", "quebecois"],
    "Maroc": ["maroc", "marocain", "marocaine", "marocaines"],
    "Algérie": ["algerie", "algerien", "algerienne", "algeriennes"],
    "Tunisie": ["tunisie", "tunisien", "tunisienne", "tunisiennes"]
  };
  const COUNTRY_API = {
    "France": "France",
    "Suisse": "Switzerland",
    "Belgique": "Belgium",
    "Royaume-Uni": "United Kingdom",
    "Pays-Bas": "Netherlands",
    "Italie": "Italy",
    "USA": "United States",
    "Pologne": "Poland",
    "Allemagne": "Germany",
    "Espagne": "Spain",
    "Portugal": "Portugal",
    "Canada": "Canada",
    "Maroc": "Morocco",
    "Algérie": "Algeria",
    "Tunisie": "Tunisia"
  };
  const SPOTLIGHT_TITLES = ["France Inter", "FIP", "RTL", "Skyrock", "TSF Jazz", "RFI Monde", "RTS La Première", "Classic 21", "Classic FM", "KEXP Seattle"];
  function allPresetItems() {
    const out = [];
    for (const p of RADIO_PRESETS) for (const it of p.items) out.push(Object.assign({}, it));
    return out;
  }
  function detectThemes(nq) {
    const found = [];
    for (const th of Object.keys(THEME_ALIASES)) {
      if (THEME_WORDS && (" " + th + " ") && nq.indexOf(" " + th + " ") >= 0) { if (found.indexOf(th) < 0) found.push(th); continue; }
      for (const w of THEME_ALIASES[th]) {
        if (nq.indexOf(" " + w + " ") >= 0) { if (found.indexOf(th) < 0) found.push(th); break; }
      }
    }
    return found;
  }
  function detectCountry(nq) {
    for (const c of Object.keys(COUNTRY_ALIASES)) {
      for (const w of COUNTRY_ALIASES[c]) {
        if (nq.indexOf(" " + w + " ") >= 0) return c;
      }
    }
    return null;
  }
  function httpsStream(u) {
    if (/^http:\/\//i.test(u || "")) return "https://" + u.slice(7);
    return u;
  }
  function fx() {
    try {
      const r = globalThis.root;
      if (r && typeof r.superFetch === "function") return r.superFetch;
    } catch (e) {}
    return fetch;
  }
  async function getJson(url, opts) {
    const r = await fx()(url, opts);
    return JSON.parse(await r.text());
  }
  async function searchRadios(q, count) {
    count = Math.min(Math.max(Number(count) || 6, 1), 12);
    const seen = new Set();
    const out = [];
    const push = (m) => {
      const st = httpsStream(m.stream || "");
      if (!st) return;
      const k = st.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      m.stream = st;
      out.push(m);
    };
    for (const m of presetRadios(q)) push(m);
    if (out.length) return out.slice(0, 12);
    const nq = " " + normStation(q) + " ";
    const co0 = detectCountry(nq);
    let curated = [];
    if (/(^|\s)(monde|world|international|internationaux)(\s|$)/.test(nq)) curated = allPresetItems().filter((m) => m.country !== "France");
    else if (/^\s*(radio|radios|station|stations|musique|music)\s*$/.test(nq)) curated = allPresetItems().filter((m) => SPOTLIGHT_TITLES.indexOf(m.title) >= 0);
    else {
      const th = detectThemes(nq);
      if (th.length || co0) curated = allPresetItems().filter((m) => (!th.length || (m.themes || []).some((x) => th.indexOf(x) >= 0)) && (!co0 || m.country === co0));
    }
    for (const m of curated) push(m);
    if (curated.length) return out.slice(0, 12);
    const apiCountry = co0 && COUNTRY_API[co0];
    const jobs = apiCountry ? [
      getJson(RADIO_API + "/json/stations/bycountryexact/" + encodeURIComponent(apiCountry) + "?hidebroken=true", { timeoutMs: 25000 }).catch(() => []),
      getJson(RADIO_API + "/json/stations/bycountry/" + encodeURIComponent(apiCountry) + "?hidebroken=true", { timeoutMs: 25000 }).catch(() => []),
      getJson(RADIO_API + "/json/stations/search?name=" + encodeURIComponent(q) + "&limit=" + count + "&hidebroken=true&order=clickcount&reverse=true", { timeoutMs: 25000 }).catch(() => [])
    ] : [
      getJson(RADIO_API + "/json/stations/bynameexact/" + encodeURIComponent(q) + "?hidebroken=true", { timeoutMs: 25000 }).catch(() => []),
      getJson(RADIO_API + "/json/stations/search?name=" + encodeURIComponent(q) + "&limit=" + count + "&hidebroken=true&order=clickcount&reverse=true", { timeoutMs: 25000 }).catch(() => [])
    ];
    const settled = await Promise.all(jobs);
    for (const grp of settled) {
      for (const s of (Array.isArray(grp) ? grp : [])) {
        push({
          kind: "radio",
          title: (s.name || "").trim() || "Radio",
          sub: [s.country, s.language, s.codec, s.bitrate ? s.bitrate + " kbps" : ""].filter(Boolean).join(" · "),
          stream: s.url_resolved || s.url || "",
          page: s.homepage || "",
          tags: s.tags || ""
        });
        if (out.length >= count) break;
      }
      if (out.length >= count) break;
    }
    return out.slice(0, count);
  }
  async function searchMusic(q, count) {
    count = Math.min(Math.max(Number(count) || 6, 1), 12);
    const [songs, eps] = await Promise.all([
      getJson("https://itunes.apple.com/search?term=" + encodeURIComponent(q) + "&media=music&entity=song&limit=" + count, { timeoutMs: 25000 }).catch(() => ({ results: [] })),
      getJson("https://itunes.apple.com/search?term=" + encodeURIComponent(q) + "&media=podcast&entity=podcastEpisode&limit=" + count, { timeoutMs: 25000 }).catch(() => ({ results: [] }))
    ]);
    const out = [];
    for (const t of ((songs && songs.results) || [])) {
      if (!t.previewUrl) continue;
      out.push({ kind: "track", title: t.trackName || "", sub: t.artistName || "", thumb: String(t.artworkUrl100 || "").replace("100x100", "300x300"), audio: t.previewUrl, page: t.trackViewUrl || "" });
    }
    for (const e of ((eps && eps.results) || [])) {
      const au = e.previewUrl || e.episodeUrl || "";
      if (!au) continue;
      out.push({ kind: "podcast", title: e.trackName || "", sub: e.collectionName || "", thumb: String(e.artworkUrl100 || e.artworkUrl600 || "").replace("100x100", "300x300"), audio: au, page: e.trackViewUrl || e.collectionViewUrl || "" });
    }
    return out.slice(0, count);
  }
  async function searchCommons(q, filetype, count) {
    count = Math.min(Math.max(Number(count) || 6, 1), 12);
    const ft = filetype ? " filetype:" + filetype : "";
    const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=" + encodeURIComponent(q + ft) + "&gsrlimit=" + count + "&gsrnamespace=6&prop=imageinfo&iiprop=url%7Csize%7Cmime&iiurlwidth=640";
    const j = await getJson(url, { timeoutMs: 25000 });
    const pages = j.query && j.query.pages ? Object.values(j.query.pages) : [];
    return pages.slice(0, count).map((p) => {
      const ii = (p.imageinfo && p.imageinfo[0]) || {};
      const mime = ii.mime || "";
      return {
        kind: mime.indexOf("video") === 0 ? "cvideo" : mime.indexOf("audio") === 0 ? "caudio" : "cimage",
        title: String(p.title || "").replace(/^File:/, "").replace(/_/g, " "),
        thumb: ii.thumburl || ii.url || "",
        file: ii.url || "",
        page: ii.descriptionurl || "",
        mime: mime
      };
    }).filter((v) => v.file);
  }
  async function searchArchive(q, mediatype, count) {
    count = Math.min(Math.max(Number(count) || 6, 1), 12);
    const mt = mediatype ? "+AND+mediatype%3A" + mediatype : "";
    const url = "https://archive.org/advancedsearch.php?q=" + encodeURIComponent(q) + mt + "&fl%5B%5D=identifier%2Ctitle%2Cmediatype%2Cdescription&rows=" + count + "&output=json";
    const j = await getJson(url, { timeoutMs: 25000 });
    const docs = (j.response && j.response.docs) || [];
    return docs.slice(0, count).map((d) => ({
      kind: "archive",
      title: d.title || d.identifier,
      sub: d.mediatype || "",
      desc: String(d.description || "").slice(0, 220),
      thumb: "https://archive.org/services/img/" + d.identifier,
      embed: ARCHIVE_EMBED + d.identifier,
      page: "https://archive.org/details/" + d.identifier
    }));
  }
  async function searchAllMedia(q, count) {
    count = Math.min(Math.max(Number(count) || 3, 1), 6);
    const jobs = [
      searchRadios(q, count).then((v) => ({ k: "radios", v: v })).catch(() => ({ k: "radios", v: [] })),
      searchMusic(q, count).then((v) => ({ k: "music", v: v })).catch(() => ({ k: "music", v: [] })),
      searchCommons(q, "", count).then((v) => ({ k: "commons", v: v })).catch(() => ({ k: "commons", v: [] })),
      searchArchive(q, "", count).then((v) => ({ k: "archive", v: v })).catch(() => ({ k: "archive", v: [] }))
    ];
    const res = await Promise.all(jobs);
    const out = { radios: [], music: [], commons: [], archive: [] };
    for (const r of res) out[r.k] = r.v;
    return out;
  }
  function kindLabel(m) {
    return m.kind === "radio" ? "Radio" : m.kind === "track" ? "Musique" : m.kind === "podcast" ? "Podcast" : m.kind === "cimage" ? "Image" : m.kind === "cvideo" ? "Vidéo" : m.kind === "caudio" ? "Audio" : m.kind === "archive" ? "Archive" : "Média";
  }
  function mediaNode(m) {
    const card = document.createElement("div");
    card.className = "svideo-card";
    card.dataset.smedia = "1";
    if (m.kind === "cimage") {
      const a = document.createElement("a");
      a.href = m.page || m.file;
      a.target = "_blank";
      a.rel = "noopener";
      const img = document.createElement("img");
      img.src = m.thumb || m.file;
      img.alt = m.title || "";
      img.loading = "lazy";
      img.style.cssText = "width:100%;display:block;max-height:420px;object-fit:contain;background:#000";
      a.appendChild(img);
      card.appendChild(a);
    } else if (m.kind === "radio" || m.kind === "track" || m.kind === "podcast" || m.kind === "caudio") {
      if (m.thumb) {
        const img = document.createElement("img");
        img.src = m.thumb;
        img.alt = "";
        img.loading = "lazy";
        img.style.cssText = "width:100%;display:block;max-height:220px;object-fit:cover;background:#000";
        card.appendChild(img);
      }
      const au = document.createElement("audio");
      au.controls = true;
      au.preload = "none";
      au.src = m.kind === "radio" ? httpsStream(m.stream) : (m.audio || m.file);
      au.style.cssText = "width:100%;margin:8px 0 2px";
      card.appendChild(au);
    } else if (m.kind === "cvideo") {
      const vd = document.createElement("video");
      vd.controls = true;
      vd.preload = "none";
      vd.poster = m.thumb || "";
      vd.src = m.file;
      vd.style.cssText = "width:100%;display:block;background:#000;max-height:400px";
      card.appendChild(vd);
    } else if (m.kind === "archive") {
      const wrap = document.createElement("div");
      wrap.className = "svideo-player";
      const fr = document.createElement("iframe");
      fr.src = m.embed;
      fr.setAttribute("allowfullscreen", "");
      fr.setAttribute("frameborder", "0");
      fr.loading = "lazy";
      wrap.appendChild(fr);
      card.appendChild(wrap);
    }
    const meta = document.createElement("div");
    meta.className = "svideo-meta";
    const badge = document.createElement("span");
    badge.className = "svideo-badge svideo-peertube";
    badge.textContent = kindLabel(m);
    const title = document.createElement("a");
    title.href = m.page || m.file || m.stream || "#";
    title.target = "_blank";
    title.rel = "noopener";
    title.className = "svideo-title";
    title.textContent = m.title || title.href;
    meta.appendChild(badge);
    meta.appendChild(title);
    if (m.sub) {
      const ch = document.createElement("div");
      ch.className = "svideo-chan";
      ch.textContent = m.sub;
      meta.appendChild(ch);
    }
    if (m.themes && m.themes.length) {
      const tc = document.createElement("div");
      tc.className = "svideo-chan";
      tc.textContent = m.themes.map((k) => THEME_LABEL[k] || k).join(" · ");
      meta.appendChild(tc);
    }
    if (m.desc) {
      const d = document.createElement("div");
      d.className = "svideo-chan";
      d.textContent = m.desc;
      meta.appendChild(d);
    }
    card.appendChild(meta);
    return card;
  }
  function postMedia(label, items) {
    const list = document.querySelector("#messageListEl");
    if (!list) return null;
    const row = document.createElement("div");
    row.className = "messageRow assistantRow";
    const wrap = document.createElement("div");
    wrap.className = "msgWrapper";
    const body = document.createElement("div");
    body.className = "messageContent markdown-content";
    if (label) {
      const p = document.createElement("div");
      p.className = "svideo-intro";
      p.textContent = label;
      body.appendChild(p);
    }
    for (const m of items) body.appendChild(mediaNode(m));
    wrap.appendChild(body);
    row.appendChild(wrap);
    list.appendChild(row);
    const sc = document.querySelector("#chatHistoryCtn");
    if (sc) sc.scrollTop = sc.scrollHeight;
    return row;
  }
  function scoreMedia(m, words) {
    let s = 0;
    const t = normStation(m.title || "");
    const tags = normStation(m.tags || "");
    for (let w of words) {
      w = normStation(w);
      if (w.length < 3) continue;
      if (t.indexOf(w) >= 0) s += 3;
      else if (tags.indexOf(w) >= 0) s += 2;
      const th = THEME_WORDS[w];
      if (th && m.themes && m.themes.indexOf(th) >= 0) s += 4;
    }
    if (m.thumb) s += 1;
    return s;
  }
  function cmdMedia(text) {
    const t = String(text || "").trim();
    try {
      const A = (typeof App !== "undefined" ? App : window.App) || null;
      if (A) {
        if (A.RPG && A.RPG.state && A.RPG.state.active) return null;
        if (A.Deites && A.Deites.isActive && A.Deites.isActive()) return null;
        try {
          const s = A.State.sessions.find(x => x.id === A.State.currentSessionId) || null;
          if (s && A.Core) {
            if (A.Scene && A.Scene.active && A.Scene.active(s)) return null;
            try { if (A.Core.sceneCraftActive && A.Core.sceneCraftActive(s, t)) return null; } catch (e1) {}
            try { if (A.Core.soloActive && A.Core.soloActive(s, t)) return null; } catch (e2) {}
            try { if (A.Core.castTail && A.Core.castTail(s, t)) return null; } catch (e3) {}
            try {
              const adultOn = (A.Age && A.Age.nsfw) ? !!A.Age.nsfw() : !!(A.State.settings && A.State.settings.adultContent);
              if (!adultOn && A.Core.BDSM_RE && A.Core.BDSM_RE.test(t)) {
                let wc = 0;
                try { wc = A.Core.newCastCount(t) || 0; } catch (e4) {}
                if (wc >= 1) return null;
                try { if (A.Core.castLatched && A.Core.castLatched(s, t)) return null; } catch (e5) {}
              }
            } catch (e6) {}
          }
        } catch (e) {}
      }
    } catch (e) {}
    const hasWordChar = (s) => /[a-z0-9àâäéèêëîïôöùûüç]/i.test(s);
    let m = t.match(/^\/(radio|musique|music|podcast|image|images|photo|archive)\s+(.+)/i);
    if (m) {
      let ty = m[1].toLowerCase();
      if (ty === "musique") ty = "music";
      if (ty === "images") ty = "image";
      return { type: ty, q: m[2].trim() };
    }
    const nt = " " + normStation(t) + " ";
    for (const p of RADIO_PRESETS) {
      for (const k of p.keys) {
        if (nt.indexOf(" " + normStation(k) + " ") >= 0) return { type: "radio", q: k };
      }
    }
    const bare = t.match(/^(?:la\s+|le\s+|les\s+)?radios?\s+([A-Za-zÀÂÄÉÈÊËÎÏÔÖÙÛÜÇàâäéèêëîïôöùûüç0-9][^?!;]{1,40}?)\s*[?!;.]*$/);
    if (bare) {
      const bq = cleanRadioQuery(bare[1]);
      if (bq.length >= 2) return { type: "radio", q: bq };
    }
    const rm = t.match(/(?:radios?|stations?)\s+([a-zàâäéèêëîïôöùûüç0-9][a-zàâäéèêëîïôöùûüç0-9\s',-]{1,58})/i);
    if (rm) {
      const rq = cleanRadioQuery(rm[1].replace(/\s*(sur\s+)?(youtube|peertube|vimeo|archive|spotify)\s*$/i, ""));
      const nrm = " " + normStation(rq) + " ";
      if (rq.length >= 2 && (presetRadios(rq).length || detectThemes(nrm).length || detectCountry(nrm) || /(^|\s)(monde|world|international)(\s|$)/.test(nrm))) return { type: "radio", q: rq };
      const words = rq.split(/\s+/).filter(Boolean);
      if (rq.length >= 2 && rq.length <= 30 && words.length <= 3 && /^[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/.test(rq.trim())) return { type: "radio", q: rq };
    }
    if (/(radio|station|musique|music|chanson|podcast|image|photo|archive|mus[eé]e|livre audio)/i.test(t)) {
      let type = "all";
      if (/radio|station/i.test(t)) type = "radio";
      else if (/podcast/i.test(t)) type = "podcast";
      else if (/musique|music|chanson/i.test(t)) type = "music";
      else if (/image|photo/i.test(t)) type = "image";
      else if (/archive|livre audio/i.test(t)) type = "archive";
      const qm = t.match(/(?:mets?|mettez|joue?|jouer|lance|lancer|lis|lire|lisez|écoute|écouter|cherche|chercher|trouve|trouver|montre|montrer|passe|passer|balance)\s+(?:moi\s+|une\s+|un\s+|des\s+|la\s+|le\s+|les\s+|l\s+)?(?:radio\s+|station\s+|musique\s+|music\s+|chanson\s+|podcast\s+|image\s+|photo\s+)?(.{2,120})/i);
      let q = qm ? cleanRadioQuery(qm[1].replace(/\s*(sur\s+)?(youtube|peertube|vimeo|archive|spotify)\s*$/i, "")) : "";
      if (q.length >= 2 && hasWordChar(q)) return { type: type, q: q };
    }
    const qm2 = t.match(/(?:mets?|mettez|joue?|jouer|lance|lancer|lis|lire|lisez|écoute|écouter|passe|passer|balance)\s+(?:moi\s+|une\s+|un\s+|des\s+|du\s+|de\s+la\s+|de\s+|la\s+|le\s+|les\s+|l\s+)?(.{2,60})/i);
    if (qm2) {
      const q2 = cleanRadioQuery(qm2[1].replace(/\s*(sur\s+)?(youtube|peertube|vimeo|archive|spotify)\s*$/i, ""));
      if (/^(je|j'|tu|il|elle|on|nous|vous|ils|elles|ce|cette|ça)\b/i.test(q2.trim())) return null;
      if (q2.length >= 2 && hasWordChar(q2)) return { type: "radio", q: q2 };
    }
    return null;
  }
  let lastRadios = [];
  function isListenFollowup(text) {
    const s = String(text || "").trim();
    if (s.length > 90) return false;
    return /(peux(\s+je)?\s+l['’]?\s*écouter|puis(\s+je)?\s+l['’]?\s*écouter|faire\s+écouter|fais(\s+moi)?\s+écouter|écoute\s+ça|lance\s+la\s+lecture)/i.test(s);
  }
  async function answerMedia(type, q) {
    if (!q) return;
    postMedia("Je cherche « " + q + " »…", []);
    const list = document.querySelector("#messageListEl");
    try {
      let items = [];
      let label = "";
      if (type === "radio") { items = await searchRadios(q, 4); label = "J'ai mis la radio pour « " + q + " » — touche lecture :"; }
      else if (type === "music" || type === "podcast") { items = await searchMusic(q, 6); label = "Voilà pour « " + q + " » — extraits et épisodes lisibles ici :"; }
      else if (type === "image") { items = await searchCommons(q, "bitmap", 6); label = "Images libres pour « " + q + " » :"; }
      else if (type === "archive") { items = await searchArchive(q, "", 5); label = "Dans Internet Archive pour « " + q + " » :"; }
      else {
        const all = await searchAllMedia(q, 2);
        items = [...all.radios.slice(0, 1), ...all.music.slice(0, 2), ...all.commons.slice(0, 2), ...all.archive.slice(0, 1)];
        label = "Médias pour « " + q + " » :";
      }
      if (list && list.lastChild) list.lastChild.remove();
      if (!items.length) { postMedia("Je n'ai rien trouvé pour « " + q + " » cette fois.", []); return; }
      if (type === "radio") lastRadios = items.slice(0, 6);
      const words = q.toLowerCase().split(/[^a-zàâäéèêëîïôöùûüç0-9]+/).filter(Boolean);
      items.sort((a, b) => scoreMedia(b, words) - scoreMedia(a, words));
      postMedia(label, items.slice(0, 6));
    } catch (e) {
      if (list && list.lastChild) list.lastChild.remove();
      postMedia("La recherche a échoué. Réessaie.", []);
    }
  }
  function enrichMedia(scope) {
    const links = scope.querySelectorAll ? scope.querySelectorAll(".messageContent a[href]") : [];
    for (const a of links) {
      try {
        if (a.dataset.smediaDone === "1" || a.dataset.svideoDone === "1") continue;
        const href = a.getAttribute("href") || "";
        let m = href.match(/^https?:\/\/(www\.)?archive\.org\/details\/([A-Za-z0-9_.-]+)/);
        if (m) {
          a.dataset.smediaDone = "1";
          const card = mediaNode({ kind: "archive", title: (a.textContent || "").trim().slice(0, 140) || m[2], sub: "", desc: "", thumb: "", embed: ARCHIVE_EMBED + m[2], page: href });
          a.after(card);
          continue;
        }
        if (/\.(mp3|ogg|oga|m4a|wav|opus)(\?|$)/i.test(href)) {
          a.dataset.smediaDone = "1";
          const card = mediaNode({ kind: "caudio", title: (a.textContent || "").trim().slice(0, 140) || href, sub: "", thumb: "", file: href, page: href, mime: "audio" });
          a.after(card);
          continue;
        }
        if (/creacast|icecast|shoutcast|radionomy|listen\.|\/stream(\/|$|\?)|:\d{4,5}\//i.test(href)) {
          a.dataset.smediaDone = "1";
          const card = mediaNode({ kind: "radio", title: (a.textContent || "").trim().slice(0, 140) || href, sub: "Flux direct", stream: href, page: href, tags: "" });
          a.after(card);
        }
      } catch (e) {}
    }
  }
  function watchMedia() {
    const list = document.querySelector("#messageListEl");
    if (!list || list.dataset.smediaWatch === "1") return;
    list.dataset.smediaWatch = "1";
    enrichMedia(list);
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          enrichMedia(n);
          const isUser = n.classList && n.classList.contains("userRow");
          if (isUser && !n.dataset.smediaAnswered) {
            const txt = n.innerText || n.textContent || "";
            if (lastRadios.length && isListenFollowup(txt) && !cmdMedia(txt)) {
              n.dataset.smediaAnswered = "1";
              postMedia("Pour l'écouter, touche lecture :", lastRadios);
              continue;
            }
            const c = cmdMedia(txt);
            if (c && c.q) {
              n.dataset.smediaAnswered = "1";
              answerMedia(c.type, c.q);
            }
          }
        }
      }
    });
    obs.observe(list, { childList: true, subtree: false });
  }
  function ensureMediaCss() {
    if (document.getElementById("smediaCss")) return;
    const st = document.createElement("style");
    st.id = "smediaCss";
    st.textContent = ".svideo-card audio{width:100%}"
      + "#smediaBtn{background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:5px;min-height:34px;min-width:34px;display:flex;align-items:center;justify-content:center;border-radius:8px}"
      + "#smediaBtn:hover{color:#fff;background:rgba(255,255,255,.06)}"
      + "#smediaPop{position:fixed;z-index:940;inset-inline:0;margin-inline:auto;bottom:86px;width:min(600px,calc(100vw - 20px));max-height:min(64vh,560px);display:flex;flex-direction:column;background:#17171c;border:1px solid #34343f;border-radius:14px;box-shadow:0 20px 55px rgba(0,0,0,.65);overflow:hidden}"
      + "#smediaPop[hidden]{display:none}"
      + "#smediaHead{display:flex;gap:8px;padding:10px 12px;border-bottom:1px solid #26262e;align-items:center}"
      + "#smediaInput{flex:1;background:#1d1d23;border:1px solid #33333d;border-radius:9px;color:#eee;padding:9px 11px;font-size:14px;outline:none;min-width:0}"
      + "#smediaGo{background:rgba(99,102,241,.16);border:1px solid rgba(99,102,241,.4);color:#c7d2fe;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer}"
      + "#smediaTabs{display:flex;gap:6px;padding:8px 12px 0;flex-wrap:wrap}"
      + "#smediaRes{overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:4px}"
      + "#smediaStatus{padding:8px 12px;color:#8e8e96;font-size:12px}";
    document.head.appendChild(st);
  }
  function ensureMediaUi() {
    ensureMediaCss();
    watchMedia();
    if (document.getElementById("smediaBtn")) return;
    const box = document.querySelector("#inputActionsCtn");
    if (!box) return;
    const anchor = document.querySelector("#svideoBtn") || document.querySelector("#attachBtn");
    const b = document.createElement("button");
    b.id = "smediaBtn";
    b.type = "button";
    b.title = "Radios, musique, images, archives";
    b.setAttribute("aria-label", "Chercher un média");
    b.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"></polygon></svg>';
    b.addEventListener("click", () => {
      const pop = document.getElementById("smediaPop");
      if (!pop) return;
      pop.hidden = !pop.hidden;
      if (!pop.hidden) { const i = document.getElementById("smediaInput"); if (i) i.focus(); }
    });
    if (anchor) box.insertBefore(b, anchor);
    else box.appendChild(b);
    const pop = document.createElement("div");
    pop.id = "smediaPop";
    pop.hidden = true;
    pop.innerHTML = '<div id="smediaHead"><input id="smediaInput" placeholder="Radio, musique, image, archive…" autocomplete="off" spellcheck="false"><button id="smediaGo" type="button">Chercher</button></div>'
      + '<div id="smediaTabs"><button class="svideo-tab on" data-tab="all" type="button">Tout</button><button class="svideo-tab" data-tab="radios" type="button">Radios</button><button class="svideo-tab" data-tab="music" type="button">Musique</button><button class="svideo-tab" data-tab="commons" type="button">Images</button><button class="svideo-tab" data-tab="archive" type="button">Archives</button></div>'
      + '<div id="smediaStatus">Astuce : « radio jazz », « radios belges », « radios du monde », « cherche une musique … ».</div>'
      + '<div id="smediaRes"></div>';
    document.body.appendChild(pop);
    const input = pop.querySelector("#smediaInput");
    const go = pop.querySelector("#smediaGo");
    const res = pop.querySelector("#smediaRes");
    const status = pop.querySelector("#smediaStatus");
    let tab = "all";
    pop.querySelectorAll(".svideo-tab").forEach((t) => t.addEventListener("click", () => {
      pop.querySelectorAll(".svideo-tab").forEach((x) => x.classList.remove("on"));
      t.classList.add("on");
      tab = t.dataset.tab;
    }));
    const run = async () => {
      const q = input.value.trim();
      if (q.length < 2) { status.textContent = "Écris au moins deux lettres."; return; }
      status.textContent = "Recherche en cours…";
      res.innerHTML = "";
      try {
        let list = [];
        if (tab === "radios") list = await searchRadios(q, 8);
        else if (tab === "music") list = await searchMusic(q, 8);
        else if (tab === "commons") list = await searchCommons(q, "", 8);
        else if (tab === "archive") list = await searchArchive(q, "", 8);
        else {
          const all = await searchAllMedia(q, 2);
          list = [...all.radios.slice(0, 2), ...all.music.slice(0, 3), ...all.commons.slice(0, 3), ...all.archive.slice(0, 2)];
        }
        if (!list.length) { status.textContent = "Rien trouvé pour « " + q + " »."; return; }
        status.textContent = list.length + " résultat(s).";
        for (const mm of list) {
          const wrap = document.createElement("div");
          wrap.appendChild(mediaNode(mm));
          const add = document.createElement("button");
          add.type = "button";
          add.className = "svideo-tab";
          add.textContent = "Mettre dans le chat";
          add.addEventListener("click", () => { postMedia("", [mm]); });
          wrap.appendChild(add);
          res.appendChild(wrap);
        }
      } catch (e) {
        status.textContent = "La recherche a échoué. Réessaie.";
      }
    };
    go.addEventListener("click", run);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
    document.addEventListener("click", (e) => {
      if (pop.hidden) return;
      if (pop.contains(e.target) || b.contains(e.target)) return;
      pop.hidden = true;
    });
  }
  App.Medias = { searchRadios: searchRadios, searchMusic: searchMusic, searchCommons: searchCommons, searchArchive: searchArchive, searchAll: searchAllMedia, answer: answerMedia, post: postMedia };
  try { globalThis.SofiaMedias = App.Medias; } catch (e) {}
  try {
    ensureMediaUi();
    setTimeout(ensureMediaUi, 1500);
    setTimeout(ensureMediaUi, 4000);
  } catch (e) {}
}
