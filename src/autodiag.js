export function attachAutoDiag(App) {
  const EXPECT = {
    games: 4204408, ecoLines: 2365, ecoCodes: 500, remoteKeys: 3084,
    memosMin: 18, medG: 8344, medD: 15252, medS: 2265,
    fiches: 1497, blogs: 136, droitCodes: 82, droitFichiers: 176
  };
  const TRIGGERS = [
    "combien de parties d'échecs connais-tu dans ta base de données ?",
    "as-tu une base de donnees de parties stockees ?",
    "tu joues contre une base de donnees ou avec ton intelligence ?",
    "tu es un moteur de recherche ou un serveur d archives ?",
    "je n'ai pas de base de donnees, vrai ou faux ?",
    "combien de gammes de médicaments connais-tu ?",
    "combien de codes de droit connais-tu ?",
    "combien de blogs suis-tu ?",
    "quelles sont tes fonctions et tes menus ?",
    "que connais-tu comme sujets ?",
    "quels sont tes domaines de connaissance ?",
    "tes sources en droit et medecine ?",
    "c est quoi le mode echecs ?",
    "parle-moi de ta fiscalite",
    "cite tes menus",
    "tu sais faire quoi ?"
  ];
  const DOMAINS = [
    { mod: 'MathMemo', id: 'maths', is: 'isMath', q: 'comment simplifier la fraction 12/18 ?' },
    { mod: 'AncientMemo', id: 'antiquite', is: 'isAncient', q: 'comment lire les hieroglyphes egyptiens ?' },
    { mod: 'LanguesMemo', id: 'langues', is: 'isLangues', q: 'comment apprendre le wolof ?' },
    { mod: 'MedMemo', id: 'medecine', is: 'isMed', q: "quelle est la posologie du Doliprane chez l'adulte ?" },
    { mod: 'MetierMemo', id: 'metiers', is: 'isMetier', q: 'quel diplome pour devenir kinesitherapeute ?' },
    { mod: 'ProtonMemo', id: 'fiscalite', is: 'isProton', q: 'comment configurer proton mail ?' },
    { mod: 'ConsiliumMemo', id: 'ue-conseil', is: 'isConsilium', q: "que dit le Conseil de l'UE sur le pacte de stabilite ?" },
    { mod: 'JuriMemo', id: 'jurisprudence', is: 'isJuri', q: 'quelle est la jurisprudence sur la garde a vue ?' },
    { mod: 'GbdMemo', id: 'doctrine', is: 'isGbd', q: 'la doctrine sur la rupture conventionnelle ?' },
    { mod: 'DroitMondeMemo', id: 'droit-monde', is: 'isDroitMonde', q: 'que dit le droit allemand sur le divorce ?' },
    { mod: 'DroitMemo', id: 'droit-fr', is: 'isDroit', q: "que dit l'article L131-1 du code de l'education ?" },
    { mod: 'SexoMemo', id: 'intime', is: 'isSexo', q: "qu'est-ce que la dyspareunie ?" },
    { mod: 'AnatomyMemo', id: 'anatomie', is: 'isAnatomy', q: 'quel nerf innerve le muscle deltoide ?' },
    { mod: 'WebMemo', id: 'web', is: 'isWeb', q: 'comment centrer une div en CSS avec flexbox ?' },
    { mod: 'GrammaireMemo', id: 'grammaire', is: 'isGrammaire', q: 'comment apprendre l anglais ?' },
    { mod: 'DicoMemo', id: 'dictionnaire', is: 'isDico', q: "quelle est l'etymologie du mot travail ?" },
    { mod: 'PythonMemo', id: 'python', is: 'isPython', q: 'comment ecrire une boucle for en Python ?' },
    { mod: 'CodeMemo', id: 'code', is: 'isCode', q: "c'est quoi une boucle for en Java ?" },
    { mod: 'CuisineMemo', id: 'cuisine', is: 'isCuisine', q: 'quelle est la recette du couscous ?' },
    { mod: 'PhysiqueMemo', id: 'physique', is: 'isPhysique', q: "c'est quoi la gravitation ?" },
    { mod: 'HistoireGeoMemo', id: 'histoire-geo', is: 'isHistoireGeo', q: 'quelles sont les causes de la Révolution française ?' }
  ];
  async function chk(id, label, fn) {
    try {
      const r = await fn();
      return { id: id, label: label, ok: !!(r && r.ok), detail: (r && r.detail) || '' };
    } catch (e) { return { id: id, label: label, ok: false, detail: 'EXC ' + String(e && e.message || e).slice(0, 120) }; }
  }
  async function checkDomain(d) {
    try {
      const M = App[d.mod];
      if (!M) return { id: 'dom-' + d.id, label: 'domaine ' + d.id, ok: false, detail: 'module absent' };
      try { if (!M._data && typeof M.warm === 'function') await M.warm(); } catch (e) {}
      let n = 0, hasIdx = false;
      try {
        const ix = (typeof M._index === 'function') ? M._index() : null;
        if (ix && typeof ix.n === 'number') { n = ix.n; hasIdx = true; }
      } catch (e) {}
      if (!hasIdx && M._data && Array.isArray(M._data.sections)) { n = M._data.sections.length; hasIdx = true; }
      let door = null, blk = 0, cov = null;
      try { door = (typeof M[d.is] === 'function') ? !!M[d.is](d.q) : null; } catch (e) { door = false; }
      try { if (typeof M.needsLookup === 'function') cov = M.needsLookup(d.q) ? 'partiel' : 'fiche'; } catch (e) {}
      try { const b = (typeof M.block === 'function') ? (M.block(d.q) || '') : ''; blk = b.length; } catch (e) {}
      const det = (hasIdx ? 'sections=' + n : 'sans-index') + (door === null ? '' : ' porte=' + (door ? 'OK' : 'HS')) + (cov === null ? '' : ' couv=' + cov) + ' bloc=' + blk + 'c';
      const ok = (hasIdx ? n > 0 : true) && door === true && blk > 0;
      return { id: 'dom-' + d.id, label: 'domaine ' + d.id, ok: !!ok, detail: det };
    } catch (e) { return { id: 'dom-' + d.id, label: 'domaine ' + d.id, ok: false, detail: 'EXC ' + String(e && e.message || e).slice(0, 80) }; }
  }
  async function runAll() {
    const D = App.AutoDiag;
    if (D.running) return D.last;
    D.running = true;
    const out = [];
    out.push(await chk('manifest', 'manifeste echecs', async () => {
      const m = await App.ChessDB.manifest();
      const ok = m && m.totalGames === EXPECT.games;
      return { ok: ok, detail: 'total=' + (m && m.totalGames) + ' bases=' + ((m && m.bases && m.bases.length) || 0) };
    }));
    out.push(await chk('remote', 'registre morceaux', async () => {
      const r = await App.ChessDB.remote();
      const n = r && r.files ? Object.keys(r.files).length : 0;
      return { ok: n === EXPECT.remoteKeys, detail: 'cles=' + n };
    }));
    const chunkTests = [
      ['kasparov', 'src/echecs/kasparov-garry/morceau-0001.json.gz', 'parties', 500],
      ['eco', 'src/echecs/eco-codes/morceau-0001.json', 'lignes', 500],
      ['twic920', 'src/echecs/twic/920/morceau-0001.json.gz', 'parties', 2000]
    ];
    const chunkRes = await Promise.all(chunkTests.map(async t => {
      try {
        const ch = await App.ChessDB.openChunk(t[1]);
        const n = ((ch && (ch[t[2]] || ch.parties || ch.lignes)) || []).length;
        return { id: 'chunk-' + t[0], label: 'morceau ' + t[0], ok: n >= t[3], detail: 'n=' + n };
      } catch (e) { return { id: 'chunk-' + t[0], label: 'morceau ' + t[0], ok: false, detail: 'EXC ' + String(e && e.message || e).slice(0, 80) }; }
    }));
    for (const r of chunkRes) out.push(r);
    out.push(await chk('getgame', 'partie connue + FICS en attente', async () => {
      const g = await App.ChessDB.getGame('kasparov-garry-0000001');
      const p = await App.ChessDB.getGame('fics-2000-std2000-0000001');
      const ok = !!(g && g.id) && p === null;
      return { ok: ok, detail: 'kas=' + (g && g.id) + ' pending=' + p };
    }));
    out.push(await chk('eco', 'recherche ECO C11', async () => {
      const r = await App.EcoLookup.search('C11 défense française');
      const n = (r && r.hits && r.hits.length) || 0;
      return { ok: n > 0, detail: 'hits=' + n };
    }));
    const domRes = await Promise.all(DOMAINS.map(checkDomain));
    for (const r of domRes) out.push(r);
    out.push(await chk('med-idx', 'index medicaments', async () => {
      try { if (App.MedLookup && !App.MedLookup._idx && typeof App.MedLookup.warm === 'function') await App.MedLookup.warm(); } catch (e) {}
      const ix = App.MedLookup && App.MedLookup._idx;
      const g = (ix && ix.g && ix.g.length) || 0, d = (ix && ix.d && ix.d.length) || 0, s = (ix && ix.s && ix.s.length) || 0;
      return { ok: g === EXPECT.medG && d === EXPECT.medD && s === EXPECT.medS, detail: 'gammes=' + g + ' specialites=' + d + ' substances=' + s };
    }));
    out.push(await chk('metier-idx', 'index metiers', async () => {
      try { if (App.MetierLookup && (!App.MetierLookup._idx || !App.MetierLookup._on) && typeof App.MetierLookup.warm === 'function') await App.MetierLookup.warm(); } catch (e) {}
      const f = (App.MetierLookup && App.MetierLookup._idx && App.MetierLookup._idx.length) || 0;
      const o = (App.MetierLookup && App.MetierLookup._on && App.MetierLookup._on.metiers && App.MetierLookup._on.metiers.length) || 0;
      return { ok: f >= EXPECT.fiches && o > 0, detail: 'studyrama=' + f + ' onisep=' + o };
    }));
    out.push(await chk('gbd-blogs', 'repertoire blogs', async () => {
      try { if (App.GbdLookup && !App.GbdLookup._blogs && typeof App.GbdLookup.warm === 'function') await App.GbdLookup.warm(); } catch (e) {}
      const n = (App.GbdLookup && App.GbdLookup._blogs && App.GbdLookup._blogs.length) || 0;
      return { ok: n >= EXPECT.blogs, detail: 'blogs=' + n };
    }));
    out.push(await chk('droit-reg', 'registre droit', async () => {
      try { if (App.DroitLookup && !App.DroitLookup._reg && typeof App.DroitLookup.registry === 'function') await App.DroitLookup.registry(); } catch (e) {}
      const codes = (App.DroitLookup && App.DroitLookup._reg && App.DroitLookup._reg.codes && App.DroitLookup._reg.codes.length) || 0;
      let files = 0;
      try {
        if (App.DroitLookup && typeof App.DroitLookup.remote === 'function') {
          const r = await App.DroitLookup.remote();
          if (r) { for (const k in r) files++; }
        } else if (App.DroitLookup && App.DroitLookup._remote) { for (const k in App.DroitLookup._remote) files++; }
      } catch (e) {}
      return { ok: codes >= EXPECT.droitCodes && files >= EXPECT.droitFichiers, detail: 'codes=' + codes + ' fichiers=' + files };
    }));
    out.push(await chk('corpus-reg', 'registre corpus', async () => {
      const j = await fetch('src/corpus-index.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      const doms = (j && j.textes && j.textes.list) || [];
      let secs = 0;
      for (const x of doms) secs += (x && x.sections) || 0;
      const ok = doms.length > 0 && secs > 0 && !!(App.Corpus);
      return { ok: ok, detail: 'domaines=' + doms.length + ' sections=' + secs + (App.Corpus ? '' : ' Corpus absent') };
    }));
    out.push(await chk('professions', 'monde des metiers', async () => {
      const P = App.Professions;
      const n = (P && typeof P.all === 'function') ? P.all().length : 0;
      const s = (P && typeof P.sectors === 'function') ? P.sectors().length : 0;
      const c = (P && typeof P.countries === 'function') ? P.countries().length : 0;
      return { ok: n > 0 && s > 0 && c > 0, detail: 'metiers=' + n + ' secteurs=' + s + ' pays=' + c };
    }));
    out.push(await chk('wardrobe-cat', 'catalogue habillage', async () => {
      let n = 0;
      for (const f of ['src/data/vetements-catalog.json', 'src/data/bdsm-catalog.json']) {
        try {
          const c = await fetch(f).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
          const cats = (c && c.categories) || {};
          for (const id of Object.keys(cats)) {
            const items = cats[id] && cats[id].items;
            if (Array.isArray(items)) n += items.length;
          }
        } catch (e) {}
      }
      return { ok: n > 0, detail: 'modeles=' + n };
    }));
    out.push(await chk('interp', 'interpretes code', async () => {
      let sup = false, on = false, py = false;
      try { sup = !!(App.Interp && typeof App.Interp.isSupported === 'function' && App.Interp.isSupported()); } catch (e) {}
      try { on = !!(App.Interp && typeof App.Interp.isEnabled === 'function' && App.Interp.isEnabled()); } catch (e) {}
      try { py = !!(App.Python && typeof App.Python.isSupported === 'function' ? App.Python.isSupported() : App.Python); } catch (e) {}
      return { ok: sup, detail: 'js=' + (sup ? (on ? 'actif' : 'supporte/inactif(reglage)') : 'HS') + ' python=' + (py ? 'supporte' : 'non-charge') };
    }));
    out.push(await chk('websearch', 'recherche web', async () => {
      const on = !!(App.WebSearch && typeof App.WebSearch.isEnabled === 'function' ? App.WebSearch.isEnabled() : App.WebSearch);
      return { ok: !!on, detail: on ? 'active' : 'inactive' };
    }));
    out.push(await chk('build', 'timbre de build', async () => {
      const b = await fetch('src/build.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      const nf = b && b.files ? Object.keys(b.files).length : 0;
      return { ok: !!(b && b.v && nf > 0), detail: 'v=' + (b && b.v) + ' fichiers=' + nf };
    }));
    out.push(await chk('triggers', 'declencheurs identite', async () => {
      const bad = TRIGGERS.filter(t => { try { return !App.SelfKnow.wants(t); } catch (e) { return true; } });
      return { ok: bad.length === 0, detail: bad.length ? 'rates:' + bad.slice(0, 3).join(' | ').slice(0, 160) : 'toutes captees' };
    }));
    out.push(await chk('counts', 'compteurs vs attendus', async () => {
      const c = await App.SelfKnow.counts();
      const probs = [];
      if (c.games !== EXPECT.games) probs.push('parties=' + c.games);
      if (c.lines !== EXPECT.ecoLines) probs.push('lignes=' + c.lines);
      if (!Array.isArray(c.memos) || c.memos.length < EXPECT.memosMin) probs.push('classeurs=' + ((c.memos || []).length));
      if (!c.medIdx || c.medIdx.g !== EXPECT.medG || c.medIdx.d !== EXPECT.medD || c.medIdx.s !== EXPECT.medS) probs.push('med=' + JSON.stringify(c.medIdx));
      if (c.metierFiches !== EXPECT.fiches) probs.push('fiches=' + c.metierFiches);
      if (c.gbdBlogs !== EXPECT.blogs) probs.push('blogs=' + c.gbdBlogs);
      if (c.droitCodes !== EXPECT.droitCodes || c.droitFichiers !== EXPECT.droitFichiers) probs.push('droit=' + c.droitCodes + '/' + c.droitFichiers);
      return { ok: probs.length === 0, detail: probs.length ? probs.join(' ') : 'conforme' };
    }));
    out.push(await chk('tail', 'rappel final identite', async () => {
      await App.SelfKnow.search("combien de parties d'échecs connais-tu ?");
      const t = App.Core.selfTail();
      const ok = typeof t === 'string' && t.length > 100 && t.indexOf('4204408') >= 0;
      return { ok: ok, detail: 'len=' + (t && t.length) };
    }));
    out.push(await chk('guard', 'garde-source branchee', async () => {
      const ok = !!(App.SelfKnow && App.SelfKnow.__sourceGuard && App.SourceGuard && App.SourceGuard._kinds);
      return { ok: ok, detail: ok ? 'self enregistre' : 'self absent' };
    }));
    out.push(await chk('ui', 'panneaux et entree', async () => {
      const ids = ['promptInputEl', 'sendBtn', 'chessPanelCtn', 'wardrobeBtn', 'chessModeCheck'];
      const miss = ids.filter(id => !document.getElementById(id));
      return { ok: miss.length === 0, detail: miss.length ? 'manque:' + miss.join(',') : 'presents' };
    }));
    const nok = out.filter(r => !r.ok).length;
    D.last = { at: Date.now(), total: out.length, fails: nok, rows: out };
    D.running = false;
    try { console.log('[AutoDiag] ' + (out.length - nok) + '/' + out.length + ' OK' + (nok ? ' — HS: ' + out.filter(r => !r.ok).map(r => r.id).join(',') : '')); } catch (e) {}
    return D.last;
  }
  function wants(text) {
    try {
      const n = String(text == null ? '' : text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
      try { if (/(medic|medecin|docteur|patient|symptome|maladie|douleur|ordonnance|hopital|infirmier|pharmacie)/.test(n)) return false; } catch (eMed) {}
      return /(auto.?diagnosti[qc]ues?|verifie.?toi|teste.?toi|self.?test|fais.?moi.?un.?auto.?diagnosti|lance.?l.?auto.?diagnosti|fais ton bilan|bilan de sante|test de sante|cherche tes failles|trouve tes erreurs|ton bilan|diagnosti[qc]ue.?toi|bilan complet|diagnostic complet|teste tes connaissances|verifie tes connaissances|controle tes domaines)/.test(n);
    } catch (e) { return false; }
  }
  function ensureMute() {
    try {
      if (App.WebSearch && !App.WebSearch.__autodiagMuted && typeof App.WebSearch.search === 'function') {
        const origWS = App.WebSearch.search.bind(App.WebSearch);
        App.WebSearch.search = function (q, opts) {
          try { if (App.AutoDiag && App.AutoDiag._muteWeb) return Promise.resolve(null); } catch (e) {}
          return origWS(q, opts);
        };
        App.WebSearch.__autodiagMuted = true;
      }
    } catch (e) {}
  }
  async function search(text) {
    ensureMute();
    if (!wants(text)) { App.AutoDiag._pending = null; return null; }
    const rep = await runAll();
    const out = { ok: true, rep: rep };
    App.AutoDiag._pending = out;
    return out;
  }
  function buildBlock(p) {
    if (!p || !p.ok || !p.rep) return '';
    const L = ['[AUTODIAG - BATTERIE LUE EN DIRECT A L INSTANT - TOUS DOMAINES, RESUME-LA HONNETEMENT, CHIFFRES INCLUS]', 'Ceci est l auto-test de l app elle-meme, pas une demande medicale : resume honnetement avec les chiffres, jamais de refus medical.'];
    for (const r of p.rep.rows) L.push((r.ok ? 'OK ' : 'HS ') + r.label + (r.detail ? ' : ' + r.detail : ''));
    L.push('Si tout est OK, dis-le en une phrase avec les grands chiffres (parties, domaines, codes, medicaments, metiers, blogs). Si des lignes sont HS, cite-les exactement et dis ce qui manque, sans minimiser.');
    return L.join('\n').slice(0, 6000);
  }
  App.AutoDiag = { last: null, running: false, _pending: null, runAll: runAll, wants: wants, search: search, buildBlock: buildBlock };
  try {
    if (App.WebSearch && !App.WebSearch.__autodiagMuted && typeof App.WebSearch.search === 'function') {
      const origWS = App.WebSearch.search.bind(App.WebSearch);
      App.WebSearch.search = function (q, opts) {
        try { if (App.AutoDiag && App.AutoDiag._muteWeb) return Promise.resolve(null); } catch (e) {}
        return origWS(q, opts);
      };
      App.WebSearch.__autodiagMuted = true;
    }
  } catch (e) {}
  try {
    if (App.SourceGuard && !App.AutoDiag.__sourceGuard && typeof App.AutoDiag.buildBlock === 'function') {
      const orig = App.AutoDiag.buildBlock;
      App.AutoDiag.buildBlock = function (p) { const r = orig(p); try { if (r) App.SourceGuard.add('diag', r, p); } catch (e) {} return r; };
      App.AutoDiag.__sourceGuard = true;
    }
  } catch (e) {}
  try {
    setTimeout(() => { runAll().catch(() => {}); }, 25000);
  } catch (e) {}
}
