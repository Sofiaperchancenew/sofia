import { App, __M, markdown, DOMPurify, Marked, normLang, langInfo, langName, langNative, langBcp47, isRTL, isKnownLang, I18N_DATA, LANGUAGES, SUPPORTED_LANGS, deepMerge, SOFIA_LANGUAGE_DETECTOR, SOFIA_INTERPRETER, SOFIA_PYTHON, attachRPG, attachResearch, attachSTT, attachVoice, attachPiperVoice, attachVocal, attachMentor, attachProfessions, attachChess, attachChess3d, attachChaos, attachDeites, attachDeepMemory, attachMemStruct, attachSelfScript, attachWebLearn, attachConsult, attachSelfUpdate, attachBrand, attachNotice, attachErrorReport, attachFeedback, attachDictionary, attachVision, attachPromptBook, attachPromptBookSeed, attachWebVision, attachWebSearch, attachAppLang, attachMailbox, attachHelp, attachDeviceScan, attachParental, attachVideos, attachMedias, attachImgStyles, attachSheets, attachSfw, attachNoPersonal, attachProviders, attachModes, attachInner, attachThinkFilter, attachGuard, attachPhoto, attachAutoI18n } from './app.js';
  // Ronde 279 : L'OPEN DATA DE LA JUSTICE ADMINISTRATIVE.
  // ArianeWeb est une SÉLECTION commentée (arrêts de principe, analyses, conclusions du
  // rapporteur public) ; la plateforme https://opendata.justice-administrative.fr publie,
  // elle, TOUTES les décisions des juridictions administratives depuis 2021-2022 —
  // jugements de première instance et ordonnances compris — en XML, par juridiction,
  // année et mois. Une pièce : App.OpenDataLookup. Il interroge le moteur public de la
  // plateforme (celui de /recherche) et lit le TEXTE INTÉGRAL d'une décision. Ses
  // résultats ont exactement la forme de ceux d'ArianeWeb, si bien qu'ils entrent dans le
  // MÊME bloc de prompt : jamais deux blocs pour une même réponse.
  App.OpenDataLookup = {
    API: 'https://opendata.justice-administrative.fr/recherche/api',
    SITE: 'https://opendata.justice-administrative.fr/',
    SEARCH: 'https://opendata.justice-administrative.fr/recherche',
    // Les trois répertoires d'archives mensuelles (zip, XML) : CE, cours et tribunaux.
    DL: {
      CE: 'https://opendata.justice-administrative.fr/DCE/',
      CAA: 'https://opendata.justice-administrative.fr/DCA/',
      TA: 'https://opendata.justice-administrative.fr/DTA/'
    },
    TIMEOUT_MS: 15000,
    CACHE_MS: 600000,
    PAGE: 200,
    MAX_KW: 4,
    MAX_TRY: 4,
    MAX_READS: 4,
    MAX_DOCS: 2,
    // Des mots de la question qui ne distinguent rien ici : ils sont dans presque tous
    // les jugements (le nom des juridictions et de leurs formations, le vocabulaire de
    // la décision). Ce sont les mots de FOND qui doivent chercher.
    MORE_STOP: (function () {
      let o = {};
      ('tribunal tribunaux administratif administrative administratives administratifs cour cours appel premiere premier instance fond fonds refere referes ordonnance ordonnances juge jugement jugements rendue rendues rendu decision decisions arret arrets affaire affaires france francais francaise depuis recemment recente recentes annee annees mois aujourd hui question reponse repondre peux peut pouvoir quel quelle quelles traite traiter traitee traites saisit agit applique appliquer concernant concerne dispose prevoit prevoir quelque quelques faut doit doivent effet ainsi alors donc').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      return o;
    })(),
    _cache: {}, _read: {},
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    _race(p, ms) {
      return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms || 15000); })]).catch(function (e) { throw e; });
    },
    _norm(s) {
      return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    },
    // Le moteur de la plateforme n'aime ni les accents ni les apostrophes : on ne lui
    // donne que des mots nus (mesure : une requête accentuée rend tout le corpus).
    _kw(text) {
      let base = '';
      try { base = App.JuriLookup._kw(text) || ''; } catch (e) { base = ''; }
      let more = this.MORE_STOP;
      let w = String(base).split(' ').filter(function (x) { return x && x.length >= 4 && !more[x]; });
      // La ville d'une juridiction nommée n'est pas un mot du texte : « le tribunal
      // administratif de Paris » ne cherche pas les décisions qui PARLENT de Paris, il
      // cherche celles de ce tribunal (elle sert de bonus, pas de mot-clé).
      try {
        let cw = this._courtWant(text);
        if (cw && cw.city) w = w.filter(function (x) { return x !== cw.city; });
      } catch (e) {}
      return w.slice(0, this.MAX_KW);
    },
    // « un jugement du tribunal administratif de Paris », « la cour administrative
    // d'appel de Lyon » : la juridiction nommée, pour que la ville fasse remonter la
    // bonne décision.
    COURT: /(?:tribunal|tribunaux)\s+administratifs?(?:\s+(?:de|du|des|d)\s+([a-z][a-z-]{3,}))?|(?:cour|cours)\s+administratives?\s+d\s*appel(?:\s+(?:de|du|des|d)\s+([a-z][a-z-]{3,}))?/,
    _courtWant(text) {
      let t = this._norm(text);
      let m = this.COURT.exec(t);
      if (!m) return null;
      // La ville ne sert qu'à faire remonter la juridiction si son nom la porte : une
      // capture hasardeuse ne coûte donc rien.
      return { fam: /^(?:cour|cours)\s/.test(m[0]) ? 'CAA' : 'TA', city: m[1] || m[2] || '' };
    },
    // La famille de juridiction, déduite du nom du fichier et du code.
    _fam(src) {
      let id = String(src.Identification || '').toUpperCase();
      let code = String(src.Code_Juridiction || '').toUpperCase();
      if (code === 'CE' || /^(?:D|OR)CE_/.test(id)) return 'CE';
      if (/^(?:D|OR)CA_/.test(id)) return 'CAA';
      return 'TA';
    },
    // « Tribunal Administratif de VERSAILLES » -> « Tribunal Administratif de Versailles ».
    _name(s) {
      return String(s == null ? '' : s).split(/\s+/).map(function (w) {
        if (w.length >= 3 && w === w.toUpperCase() && /[A-Z\u00c0-\u00dd]/.test(w)) return w.charAt(0) + w.slice(1).toLowerCase();
        return w;
      }).join(' ');
    },
    // L'archive mensuelle qui contient la décision (nom prévisible, cf. la fiche
    // « Comment télécharger les décisions ? »).
    _zip(fam, date) {
      let m = /^(\d{4})-(\d{2})/.exec(String(date == null ? '' : date).slice(0, 10));
      if (!m) return '';
      let dir = this.DL[fam] || this.DL.TA;
      let pre = fam === 'CE' ? 'CE' : (fam === 'CAA' ? 'CAA' : 'TA');
      return dir + m[1] + '/' + m[2] + '/' + pre + '_' + m[1] + m[2] + '.zip';
    },
    _clean(v) {
      let s = String(v == null ? '' : v);
      return (s === 'undefined' || s === 'null' || s === 'NULL') ? '' : s;
    },
    // Combien de fois le texte parle vraiment des mots de la question (et combien de ces
    // mots il porte). Les mots sont réduits à leur radical simple (« perquisitions » ->
    // « perquisition ») et le texte est mis sans accents, pour que singulier, pluriel et
    // accents se rencontrent.
    _density(text, kws) {
      let t = String(text == null ? '' : text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      let n = 0, all = 0;
      for (let i = 0; i < kws.length; i++) {
        let w = kws[i];
        if (w.length >= 5 && /s$/.test(w)) w = w.slice(0, -1);
        let c = 0, p = -1;
        while ((p = t.indexOf(w, p + 1)) !== -1) { c++; if (c >= 12) break; }
        if (c) all++;
        n += Math.min(c, 10);
      }
      return { n: n, all: all };
    },
    _doc(src, score) {
      let fam = this._fam(src);
      let code = this._clean(src.Code_Juridiction);
      let nom = this._name(this._clean(src.Nom_Juridiction));
      return {
        src: 'open', id: this._clean(src.Identification), fond: 'OPEN', famille: fam, code: code,
        juridiction: nom || (fam === 'CE' ? "Conseil d'État" : (fam === 'CAA' ? "Cour administrative d'appel" : 'Tribunal administratif')),
        formation: this._clean(src.Formation_Jugement), num: this._clean(src.Numero_Dossier),
        ecli: this._clean(src.Numero_ECLI), date: String(this._clean(src.Date_Lecture)).slice(0, 10),
        publie: this._clean(src.Code_Publication).toUpperCase(), type: this._clean(src.Type_Decision),
        zip: this._zip(fam, src.Date_Lecture), score: score || 0
      };
    },
    async _json(url) {
      let key = 'J|' + url;
      let c = this._cache[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return c.v;
      let r = await this._race(App.Core.proxyFetch(url), this.TIMEOUT_MS);
      if (!r || !r.ok) throw new Error('HTTP ' + (r && r.status));
      let j = await r.json();
      this._cache[key] = { t: Date.now(), v: j };
      return j;
    },
    // Une recherche dans la base (le « q » est passé tel quel au moteur : on s'en sert
    // pour la requête en ET « +mot1 +mot2 » et pour compter un mot seul).
    async _hits(q, page) {
      let key = 'S|' + q + '|' + page;
      let c = this._cache[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return { list: c.v, n: c.n };
      let j = await this._json(this.API + '/Simple_Search/openData/' + encodeURIComponent(q) + '/' + page);
      let h = ((j.decisions || {}).body || {}).hits || {};
      let n = (h.total || {}).value || 0;
      this._cache[key] = { t: Date.now(), v: h.hits || [], n: n };
      return { list: h.hits || [], n: n };
    },
    // Le moteur de la plateforme est un moteur de consultation : il classe par date et
    // fait un OU entre les mots (« loyer impayé » rend tout ce qui contient l'un ou
    // l'autre). On lui donne donc la requête en ET (« +loyer +impaye »), qui lui demande
    // les décisions portant TOUS les mots de fond ; et s'il n'en existe aucune, on
    // cherche le mot le plus DISCRIMINANT, puis on classe nous-mêmes : le classement
    // officiel (A, B, C…), le niveau de juridiction, la juridiction nommée dans la
    // question, et enfin ce que le texte dit vraiment.
    async search(text, opts) {
      if (!this.isEnabled()) return { failed: true, reason: 'disabled' };
      let o = opts || {};
      try {
        let kws = this._kw(text);
        if (!kws.length) return { failed: true, reason: 'no-query' };
        let counts = [], hits = null;
        try {
          let h = await this._hits(kws.map(function (w) { return '+' + w; }).join(' '), this.PAGE);
          counts.push(h.n);
          if (h.list.length) hits = h.list;
        } catch (e) { console.warn('[OpenDataLookup] requête ET échouée', e && e.message); }
        if (!hits) {
          // Aucune décision ne porte tous les mots : le mot le plus rare est celui qui
          // distingue le mieux. On le compte d'abord (une requête minuscule par mot),
          // puis on lit ses décisions.
          let best = null;
          for (let i = 0; i < kws.length && i < this.MAX_TRY; i++) {
            try {
              let c = await this._hits(kws[i], 1);
              counts.push(c.n);
              if (c.n > 0 && (!best || c.n < best.n)) best = { kw: kws[i], n: c.n };
            } catch (e) { console.warn('[OpenDataLookup] comptage « ' + kws[i] + ' » échoué', e && e.message); }
          }
          if (!best) return { failed: true, reason: 'engine', error: 'moteur injoignable' };
          let h = await this._hits(best.kw, this.PAGE);
          hits = h.list;
        }
        if (!hits.length) return { failed: true, reason: 'no-hit', query: kws.join(' ') };
        let cw = this._courtWant(text);
        let cands = [];
        for (let i = 0; i < hits.length; i++) {
          let h = hits[i];
          if (!h || !h._id || !h._source) continue;
          let s = h._source;
          let score = 200 + ({ A: 60, B: 40, C: 8 }[String(s.Code_Publication || '').toUpperCase()] || 0);
          let fam = this._fam(s);
          score += fam === 'CE' ? 30 : (fam === 'CAA' ? 18 : 0);
          if (String(s.Type_Decision || '') === 'Décision') score += 12;
          if (cw && cw.city && this._norm(s.Nom_Juridiction).indexOf(cw.city) !== -1) score += 260;
          if (cw && cw.fam && cw.fam === fam) score += 60;
          score -= Math.min(i, 40);
          cands.push(this._doc(s, score));
        }
        cands.sort(function (a, b) { return b.score - a.score; });
        let avoid = {};
        (o.avoid || []).forEach(function (n) { if (n) avoid[String(n).toUpperCase()] = 1; });
        let seenKey = {}, probe = [];
        for (let i = 0; i < cands.length && probe.length < this.MAX_READS; i++) {
          let d = cands[i];
          if (!d.num || avoid[String(d.num).toUpperCase()]) continue;
          let k = String(d.num).toUpperCase() + '|' + d.date;
          if (seenKey[k]) continue;
          seenKey[k] = 1; probe.push(d);
        }
        // On lit les meilleurs candidats, puis on les reclasse sur ce qu'ils DISENT : un
        // arrêt qui parle longuement de la question vaut mieux qu'une décision bien
        // classée qui ne fait que citer les mots au passage.
        let read = [];
        for (let i = 0; i < probe.length; i++) {
          let d = probe[i];
          try {
            let t = await this.read(d.id, d.code, d.num);
            if (t) { d.text = t; d.lu = 'open'; read.push(d); }
          } catch (e) { console.warn('[OpenDataLookup] lecture échouée n° ' + d.num, e && e.message); }
        }
        if (!read.length) return { failed: true, reason: 'no-hit', query: kws.join(' ') };
        for (let i = 0; i < read.length; i++) {
          let q = this._density(read[i].text, kws);
          read[i].density = q.n;
          read[i].score += q.n * 25 + q.all * 120;
        }
        read.sort(function (a, b) { return b.score - a.score; });
        // Une décision qui ne porte AUCUN des mots de la question ne peut pas être un
        // complément utile.
        let rich = read.filter(function (d) { return d.density >= 1; });
        if (rich.length) read = rich;
        // Deux décisions de la même juridiction se valent quand elles tiennent la
        // comparaison (une série jugée le même jour) ; sinon, une AUTRE juridiction
        // apporte un point de vue de plus.
        let out = [];
        if (read.length) {
          out.push(read[0]);
          let alt = null;
          for (let i = 1; i < read.length; i++) {
            if (read[i].juridiction !== read[0].juridiction) { alt = read[i]; break; }
          }
          let second = read[1] || null;
          if (alt && (!second || (alt.density * 2) >= second.density)) second = alt;
          if (second) out.push(second);
        }
        let total = counts.length ? Math.min.apply(null, counts) : 0;
        console.log('[OpenDataLookup] open data de la justice administrative : « ' + kws.join(' ') + ' » -',
          counts.join('/'), 'décision(s) ; lues :', out.map(function (d) { return d.juridiction + ' n° ' + d.num + ' [' + d.density + ']'; }).join(', '));
        return { ok: true, query: kws.join(' '), total: total, docs: out, url: this.SEARCH, counts: counts };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    // Le texte INTÉGRAL d'une décision (la vue publique du moteur ; $$$ sépare les
    // paragraphes).
    async read(ident, code, num) {
      let key = String(ident) + '|' + String(code) + '|' + String(num);
      let c = this._read[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return c.v;
      let url = this.API + '/testView/openData/unHighlight/' + encodeURIComponent(ident) + '/' + encodeURIComponent(code) + '/' + encodeURIComponent(num);
      let j = await this._json(url);
      let hits = (((j.decisions || {}).body || {}).hits || {}).hits || [];
      let p = (hits.length && hits[0]._source) ? hits[0]._source.paragraph : '';
      let v = p ? String(p).replace(/\$\$\$/g, '\n\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() : '';
      if (v) this._read[key] = { t: Date.now(), v: v };
      return v;
    },
    // La question nomme-t-elle une juridiction que la sélection d'ArianeWeb couvre mal
    // (un tribunal administratif, une cour administrative d'appel) ? Alors l'open data
    // est interrogé même si ArianeWeb a rendu quelque chose.
    WANTS: /(tribunal administratif|tribunaux administratifs|premiere instance|premier ressort|juge des referes|juge du fond|en appel|cour administrative d\s*appel|cours administratives d\s*appel|\bta\b|\bcaa\b)/,
    wants(text) {
      let t = this._norm(text).replace(/\u2019/g, "'");
      return this.WANTS.test(t);
    }
  };
  App.FreeData = {
    TIMEOUT_MS: 15000,
    CACHE_MS: 600000,
    MAX_ITEMS: 6,
    _cache: {},
    _pending: null,
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    _race(p, ms) {
      return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms || 15000); })]);
    },
    _norm(s) {
      return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    },
    _wikiLang(l) {
      let c = String(l == null ? '' : l).slice(0, 2).toLowerCase();
      if (['fr', 'en', 'de', 'es', 'it', 'pt', 'nl'].indexOf(c) >= 0) return c;
      return 'fr';
    },
    STRONG: /(open data|opendata|donnees ouvertes|data gouv|common crawl|gutenberg|gutendex|wikimedia dump|dumps wikimedia|jeu de donnees|jeux de donnees|portail.*donnees|open data portal|wayback|archive\.org|govdata|data\.gov\.ie|catalog\.data\.gov|data\.europa)/,
    LOOSE_SRC: /(dataset|corpus|livre libre|livres libres|ebook gratuit|free book)/,
    LOOSE_CTX: /(libre|libres|gratuit|ouver|open|free|trouver|chercher|telecharger|ou puis|americain|francais|europeen|allemand|espagnol|italien|public|officiel|gouvernement|pays|ville|region)/,
    BOOKISH: /(livre|livres|roman|romans|ebook|book|auteur|gutenberg|lire|lecture|bibliotheque)/,
    ARCHIVE: /(contenait|contenu|archive|capture|autrefois|ancienne version|wayback|cache)/,
    wants(text) {
      let t = this._norm(text);
      if (!t) return false;
      if (this.STRONG.test(t)) return true;
      if (this.LOOSE_SRC.test(t) && this.LOOSE_CTX.test(t)) return true;
      if (this._urlIn(text) && this.ARCHIVE.test(t)) return true;
      return false;
    },
    STOP() {
      if (this._STOP) return this._STOP;
      let o = {};
      ('un une des les pour dans avec sur est sont que qui quoi comment pourquoi parce faire fait font entre autre autres peut peux votre vous nous leur leurs mon mes ton tes son ses ce cette ces cela ceci dont vers chez tout tous toute toutes aussi plus moins tres bien encore alors donc ainsi comme autant autre apres avant pendant depuis jusqu jusque entre sous sans sous quel quelle quels quelles the and for with from that this these those what when where which have has are was were will would there their about into over after und der die das ein eine und oder mit von zum zur den dem des ist sind auch auf für als werden bei nach aus über pero por con una uno las los del que una este esta estos estas como para porq porque hacer hace muy mas menos sin sobre entre hasta desde donde cuando cual cuales tiene tienen puede pueden nel nella della delle che una con per sono come dove quando cosa quali quale dei degli ha hanno').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      this._STOP = o;
      return o;
    },
    SKIP() {
      if (this._SKIP) return this._SKIP;
      let o = {};
      ('telecharge telecharger telechargement trouve trouver trouvez cherche chercher cherchez livre livres libre libres gratuit gratuits gratuite donnee donnees open data dataset datasets corpus ebooks ebook book books jeu jeux contenait contenu contenir page site web internet ouvrage roman auteur lire puis-je puis comment pourquoi ou').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      this._SKIP = o;
      return o;
    },
    _query(text) {
      let stop = this.STOP();
      let skip = this.SKIP();
      let w = this._norm(text).split(' ').filter(function (x) { return x && x.length >= 4 && !stop[x] && !skip[x]; });
      let out = [];
      for (let i = 0; i < w.length && out.length < 6; i++) { if (out.indexOf(w[i]) < 0) out.push(w[i]); }
      return out.join(' ');
    },
    _urlIn(text) {
      let m = String(text == null ? '' : text).match(/https?:\/\/[^\s)>\]]+/i);
      if (m) return m[0].replace(/[.,;:!?]+$/, '');
      let h = String(text == null ? '' : text).match(/(?:www\.)?[a-z0-9-]+\.(?:fr|com|org|de|net|es|it|eu|gouv\.fr)(?:\/[^\s)>\]]*)?/i);
      if (h) { let u = h[0]; return /^https?:/i.test(u) ? u : 'https://' + u; }
      return '';
    },
    async _get(url) {
      let key = 'FD|' + url;
      let c = this._cache[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return c.v;
      let r = await this._race(App.Net.curatedFetch({ url: url }), this.TIMEOUT_MS);
      if (!r || r.error || !r.ok) throw new Error((r && (r.error || r.statusText)) || 'fetch failed');
      this._cache[key] = { t: Date.now(), v: r };
      return r;
    },
    _cut(s, n) {
      s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
      if (s.length <= n) return s;
      let h = s.slice(0, n), sp = h.lastIndexOf(' ');
      if (sp > n * 0.6) h = h.slice(0, sp);
      return h.replace(/[\s,;:]+$/, '') + ' […]';
    },
    async _gutenberg(q, lang) {
      let items = [];
      let urls = ['https://gutendex.com/books/?search=' + encodeURIComponent(q) + '&languages=' + lang];
      urls.push('https://gutendex.com/books/?search=' + encodeURIComponent(q));
      for (let u = 0; u < urls.length && !items.length; u++) {
        let r;
        try { r = await this._get(urls[u]); } catch (e) { continue; }
        let j;
        try { j = JSON.parse(r.body); } catch (e) { continue; }
        let rs = (j && j.results) || [];
        for (let i = 0; i < rs.length && items.length < 3; i++) {
          let b = rs[i] || {};
          let au = ((b.authors || []).map(function (a) { return a && a.name; }).filter(Boolean)).join(', ');
          let fm = b.formats || {};
          let link = 'https://www.gutenberg.org/ebooks/' + b.id;
          items.push({ src: 'Gutenberg', title: String(b.title || 'sans titre'), url: link,
            detail: (au ? au + ' · ' : '') + 'langues : ' + ((b.languages || []).join(', ') || '?') + ' · ' + (b.download_count || 0) + ' téléchargements' + (fm['text/plain'] ? ' · texte disponible' : '') });
        }
      }
      return items;
    },
    async _openlibrary(q) {
      let items = [];
      let r;
      try { r = await this._get('https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=5'); } catch (e) { return items; }
      let j;
      try { j = JSON.parse(r.body); } catch (e) { return items; }
      let ds = (j && j.docs) || [];
      for (let i = 0; i < ds.length && items.length < 3; i++) {
        let d = ds[i] || {};
        items.push({ src: 'Open Library', title: String(d.title || 'sans titre'), url: 'https://openlibrary.org' + (d.key || ''),
          detail: ((d.author_name || []).slice(0, 3).join(', ') || 'auteur inconnu') + (d.first_publish_year ? ' · 1re éd. ' + d.first_publish_year : '') + (d.language ? ' · ' + d.language.slice(0, 4).join(', ') : '') });
      }
      return items;
    },
    async _wiki(q, lang) {
      let items = [];
      let r;
      try { r = await this._get('https://' + lang + '.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(q) + '&limit=3&format=json'); } catch (e) { return items; }
      let j;
      try { j = JSON.parse(r.body); } catch (e) { return items; }
      let titles = (j && j[1]) || [], descs = (j && j[2]) || [], links = (j && j[3]) || [];
      for (let i = 0; i < titles.length && items.length < 2; i++) {
        items.push({ src: 'Wikipédia (' + lang + ')', title: String(titles[i]), url: String(links[i] || ''),
          detail: this._cut(descs[i] || '', 180) });
      }
      if (titles.length) {
        try {
          let s = await this._get('https://' + lang + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(String(titles[0]).replace(/ /g, '_')));
          let sj = JSON.parse(s.body);
          if (sj && sj.extract) items[0].detail = this._cut(sj.extract, 280);
        } catch (e) {}
      }
      return items;
    },
    async _datagouv(q) {
      let items = [];
      let r;
      try { r = await this._get('https://www.data.gouv.fr/api/1/datasets/?q=' + encodeURIComponent(q) + '&page_size=5'); } catch (e) { return items; }
      let j;
      try { j = JSON.parse(r.body); } catch (e) { return items; }
      let ds = (j && j.data) || [];
      for (let i = 0; i < ds.length && items.length < 2; i++) {
        let d = ds[i] || {};
        items.push({ src: 'data.gouv.fr', title: String(d.title || d.slug || 'sans titre'), url: String(d.page || ('https://www.data.gouv.fr/fr/datasets/' + (d.slug || ''))),
          detail: this._cut(d.description || '', 160) + (d.last_update ? ' · màj ' + String(d.last_update).slice(0, 10) : '') });
      }
      return items;
    },
    async _govuk(q) {
      let items = [];
      let r;
      try { r = await this._get('https://data.gov.uk/api/3/action/package_search?q=' + encodeURIComponent(q) + '&rows=3'); } catch (e) { return items; }
      let j;
      try { j = JSON.parse(r.body); } catch (e) { return items; }
      let ds = ((j && j.result && j.result.results)) || [];
      for (let i = 0; i < ds.length && items.length < 2; i++) {
        let d = ds[i] || {};
        let res = (d.resources && d.resources[0] && d.resources[0].url) || '';
        items.push({ src: 'data.gov.uk (UK)', title: String(d.title || d.name || 'sans titre'), url: res || ('https://data.gov.uk/dataset/' + (d.name || '')),
          detail: this._cut(d.notes || '', 160) });
      }
      return items;
    },
    async _datagovie(q) {
      let items = [];
      let r;
      try { r = await this._get('https://data.gov.ie/api/3/action/package_search?q=' + encodeURIComponent(q) + '&rows=3'); } catch (e) { return items; }
      let j;
      try { j = JSON.parse(r.body); } catch (e) { return items; }
      let ds = ((j && j.result && j.result.results)) || [];
      for (let i = 0; i < ds.length && items.length < 2; i++) {
        let d = ds[i] || {};
        let res = (d.resources && d.resources[0] && d.resources[0].url) || '';
        items.push({ src: 'data.gov.ie (IE)', title: String(d.title || d.name || 'sans titre'), url: res || ('https://data.gov.ie/dataset/' + (d.name || '')),
          detail: this._cut(d.notes || '', 160) });
      }
      return items;
    },
    async _govdataDE(q) {
      let items = [];
      let r;
      try { r = await this._get('https://www.govdata.de/ckan/api/3/action/package_search?q=' + encodeURIComponent(q) + '&rows=3'); } catch (e) { return items; }
      let j;
      try { j = JSON.parse(r.body); } catch (e) { return items; }
      let ds = ((j && j.result && j.result.results)) || [];
      for (let i = 0; i < ds.length && items.length < 2; i++) {
        let d = ds[i] || {};
        let res = (d.resources && d.resources[0] && d.resources[0].url) || '';
        items.push({ src: 'govdata.de (DE)', title: String(d.title || d.name || 'sans titre'), url: res || ('https://www.govdata.de/suche/daten/' + (d.name || '')),
          detail: this._cut(d.notes || '', 160) });
      }
      return items;
    },
    async _datagovUS(q) {
      let items = [];
      let r;
      try { r = await this._get('https://catalog.data.gov/dataset?q=' + encodeURIComponent(q)); } catch (e) { return items; }
      let html = String((r && r.body) || '');
      let seen = {};
      let re = /href="(\/dataset\/[^"]+)"/g;
      let m;
      while (items.length < 2 && (m = re.exec(html))) {
        let slug = m[1];
        if (seen[slug]) continue;
        seen[slug] = 1;
        let title = slug.split('/').pop().replace(/-/g, ' ');
        items.push({ src: 'catalog.data.gov (US)', title: title.slice(0, 120), url: 'https://catalog.data.gov' + slug,
          detail: 'jeu de données du catalogue fédéral américain' });
      }
      return items;
    },
    async _ccIndex() {
      let key = 'FD|ccinfo';
      let c = this._cache[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return c.v;
      let r = await this._get('https://index.commoncrawl.org/collinfo.json');
      let j = JSON.parse(r.body);
      let id = (j && j[0] && (j[0].id || j[0]['from'])) || 'CC-MAIN-2025-30';
      this._cache[key] = { t: Date.now(), v: id };
      return id;
    },
    async _commoncrawl(url) {
      let items = [];
      let r;
      try { r = await this._get('https://web.archive.org/cdx/search/cdx?url=' + encodeURIComponent(url) + '&output=json&filter=statuscode:200&limit=5'); } catch (e) { return items; }
      let j;
      try { j = JSON.parse(r.body); } catch (e) { return items; }
      for (let i = 1; i < (j || []).length && items.length < 2; i++) {
        let row = j[i] || [];
        let ts = String(row[1] || '');
        let orig = String(row[2] || url);
        let date = ts.length >= 8 ? ts.slice(0, 4) + '-' + ts.slice(4, 6) + '-' + ts.slice(6, 8) : ts;
        items.push({ src: 'Wayback Machine', title: orig.slice(0, 120), url: 'https://web.archive.org/web/' + (ts || '') + '/' + orig,
          detail: 'capture du ' + (date || '?') + ' · archives web' });
      }
      return items;
    },
    async search(text, opts) {
      if (!this.isEnabled()) return { failed: true, reason: 'disabled' };
      let o = opts || {};
      let lang = this._wikiLang(o.lang);
      let q = this._query(text);
      if (!q) return { failed: true, reason: 'no-query' };
      let tn = this._norm(text);
      let jobs = [];
      let bookish = this.BOOKISH.test(tn);
      if (bookish) jobs.push(this._gutenberg(q, lang).catch(function () { return []; }));
      jobs.push(this._openlibrary(q).catch(function () { return []; }));
      jobs.push(this._wiki(q, lang).catch(function () { return []; }));
      jobs.push(this._datagouv(q).catch(function () { return []; }));
      jobs.push(this._govuk(q).catch(function () { return []; }));
      jobs.push(this._datagovie(q).catch(function () { return []; }));
      jobs.push(this._govdataDE(q).catch(function () { return []; }));
      jobs.push(this._datagovUS(q).catch(function () { return []; }));
      let u = this._urlIn(text);
      let cc = [];
      if (u) {
        try { cc = await this._commoncrawl(u); } catch (e) { cc = []; }
      }
      let parts = await Promise.all(jobs);
      let items = cc.slice(0, 2);
      for (let i = 0; i < parts.length; i++) {
        for (let k = 0; k < parts[i].length && items.length < this.MAX_ITEMS; k++) items.push(parts[i][k]);
      }
      if (!items.length) return { failed: true, reason: 'no-hit', query: q };
      let srcs = [];
      items.forEach(function (it) { if (srcs.indexOf(it.src) < 0) srcs.push(it.src); });
      try { console.log('[FreeData] « ' + q + ' » (' + lang + ') : ' + items.map(function (it) { return it.src; }).join(', ')); } catch (e) {}
      return { ok: true, query: q, lang: lang, items: items, srcs: srcs };
    },
    buildBlock(res) {
      try {
        if (!res || res.failed || !res.items || !res.items.length) return '';
        let L = [];
        L.push('[DONNÉES LIBRES - CE QUE TU VIENS DE LIRE TOI-MÊME DANS LES CORPUS OUVERTS]');
        L.push('Sa question porte sur des textes ou des jeux de données libres (livres du domaine public déjà numérisés, encyclopédie multilingue, web déjà aspiré, portails open data par pays). Tu as interrogé toi-même : ' + res.srcs.join(', ') + '. Recherche : « ' + res.query + ' » — ' + res.items.length + ' trouvaille(s), reproduites ci-dessous.');
        L.push('Ne cite, ne nomme et ne résume QUE ces trouvailles : nomme la source (avec son URL) et la date quand tu la connais. Ce qui n\u2019est pas ci-dessous, tu ne l\u2019as pas lu — dis-le au lieu de l\u2019inventer.');
        for (let i = 0; i < res.items.length; i++) {
          let it = res.items[i];
          L.push('--- ' + it.src + ' : ' + it.title + '\n' + (it.detail || '') + (it.url ? '\n' + it.url : ''));
        }
        L.push('Sources : ' + res.srcs.join(', ') + '. Texte ordinaire, sans emoji.');
        return L.join('\n');
      } catch (e) { return ''; }
    }
  };

  App.Watch = {
    KEY: 'sofia_watch_v1',
    SEEN: 'sofia_watch_seen_v1',
    TICK_MS: 60000,
    _timer: null,
    _boot: 0,
    read() { try { return JSON.parse(localStorage.getItem(this.KEY) || '[]') || []; } catch (e) { return []; } },
    write(l) { try { localStorage.setItem(this.KEY, JSON.stringify(l)); } catch (e) {} },
    touch() { try { localStorage.setItem(this.SEEN, String(Date.now())); } catch (e) {} },
    list() { return this.read(); },
    add(q, everyMin) {
      let w = this.read();
      q = String(q || '').trim().slice(0, 200);
      if (!q) return null;
      let e = { id: 'w' + Date.now().toString(36), q: q, everyMin: Math.min(1440, Math.max(15, (+everyMin || 60))), lastRun: 0, lastNote: '', changedAt: 0 };
      w.unshift(e);
      while (w.length > 20) w.pop();
      this.write(w);
      return e;
    },
    remove(idOrQ) {
      let w = this.read();
      let t = String(idOrQ || '').toLowerCase();
      let n0 = w.length;
      w = w.filter(function (e) { return e.id !== idOrQ && String(e.q || '').toLowerCase() !== t; });
      this.write(w);
      return n0 - w.length;
    },
    _key(r) { try { return (r.items || []).map(function (x) { return x.title + '|' + x.url; }).join('~').slice(0, 500); } catch (e) { return ''; } },
    async tick(force) {
      let w = this.read();
      if (!w.length || !App.FreeData || !App.FreeData.isEnabled()) return null;
      let now = Date.now(), dirty = false;
      for (let e of w) {
        let every = Math.max(15, (+e.everyMin || 60)) * 60000;
        if (!force && !(now - (e.lastRun || 0) > every)) continue;
        try {
          let r = await App.FreeData.search(e.q, { lang: 'fr' });
          e.lastRun = now; dirty = true;
          if (r && r.ok) {
            let k = this._key(r);
            if (e.lastNote && k && k !== e.lastNote) {
              e.changedAt = now;
              try { if (window.Notification && Notification.permission === 'granted') new Notification('Sofia — surveillance', { body: String(e.q).slice(0, 120) }); } catch (x) {}
              try { console.log('[Sofia→HELPER] [WATCH] « ' + e.q + ' » a bougé : ' + r.srcs.join(', ')); } catch (x) {}
            }
            if (k) e.lastNote = k;
          }
        } catch (x) {}
      }
      if (dirty) this.write(w);
      try { this.touch(); } catch (e) {}
      return true;
    },
    catchup(away) {
      let self = this;
      try {
        if (!away || Date.now() - away < 1800000) return;
        let news = self.read().filter(function (e) { return e && e.changedAt && e.changedAt >= self._boot; });
        if (!news.length) return;
        let msg = 'De retour ! Pendant ton absence (depuis ' + new Date(away).toLocaleString() + ') : ' + news.map(function (e) { return '« ' + e.q + ' » a bougé'; }).join(' ; ') + '.';
        if (window.App && App.Core && typeof App.Core.addMessage === 'function' && App.State && App.State.sessions) App.Core.addMessage('assistant', msg, 'text', null);
        else if (window.Notification && Notification.permission === 'granted') { try { new Notification('Sofia — pendant ton absence', { body: msg.slice(0, 150) }); } catch (x) {} }
      } catch (e) {}
    },
    ensure() {
      if (this._timer) return;
      let self = this;
      self._boot = Date.now();
      let away = 0;
      try { away = +localStorage.getItem(self.SEEN) || 0; } catch (e) {}
      setTimeout(function () { try { Promise.resolve(self.tick()).then(function () { try { self.catchup(away); } catch (e) {} }); } catch (e) {} }, 20000);
      this._timer = setInterval(function () { try { self.tick(); } catch (e) {} }, this.TICK_MS);
      try { document.addEventListener('visibilitychange', function () { if (!document.hidden) { try { self.tick(); } catch (e) {} } }); } catch (e) {}
      try { window.addEventListener('pagehide', function () { try { self.touch(); } catch (e) {} }); } catch (e) {}
    },
    handleChat(text) {
      let t = String(text || '').trim();
      let self = this;
      let im = t.match(/SOFIA-WATCH-([A-Za-z0-9+/=]+)/);
      if (im) {
        let n = 0, names = [];
        try {
          let arr = JSON.parse(decodeURIComponent(escape(atob(im[1]))));
          if (Array.isArray(arr)) {
            let have = {};
            self.read().forEach(function (e) { have[String(e.q || '').toLowerCase()] = 1; });
            arr.forEach(function (x) {
              let q = String((Array.isArray(x) ? x[0] : x) || '').trim().slice(0, 200);
              let m = Array.isArray(x) ? Math.min(1440, Math.max(15, (+x[1] || 60))) : 60;
              if (q && !have[q.toLowerCase()]) { have[q.toLowerCase()] = 1; self.add(q, m); n++; names.push('« ' + q + ' »'); }
            });
          }
        } catch (e) {}
        if (!n) return { handled: true, reply: 'Ce code ne contient aucune surveillance valide (ou je les suis déjà ici).' };
        try { self.tick(true); } catch (x) {}
        return { handled: true, reply: 'J’ai repris ' + n + ' surveillance' + (n > 1 ? 's' : '') + ' : ' + names.join(' ; ') + '. Actives ici, avec résumé au retour d’absence.' };
      }
      if (/^exporte mes surveillances$/i.test(t)) {
        let w = self.list();
        if (!w.length) return { handled: true, reply: 'Aucune surveillance à exporter. Dis « surveille … » pour en ajouter une.' };
        let code = '';
        try { code = 'SOFIA-WATCH-' + btoa(unescape(encodeURIComponent(JSON.stringify(w.map(function (e) { return [e.q, e.everyMin]; }))))) ; } catch (e) {}
        if (!code) return { handled: true, reply: 'Export impossible pour l’instant.' };
        return { handled: true, reply: 'Code de transfert (' + w.length + ') — copie-le et colle-le dans le chat de l’autre navigateur, tout démarre seul : ' + code };
      }
      let m = t.match(/^(?:surveille|surveiller|suis|suivre)\s+(.+)$/i);
      if (m) {
        let e = this.add(m[1], 60);
        if (!e) return null;
        try { this.tick(true); } catch (x) {}
        return { handled: true, reply: 'Je surveille « ' + e.q + ' » toutes les heures. Les vérifications tournent tant qu’un onglet Sofia reste ouvert — à ton retour, je te résume ce qui a bougé pendant ton absence. Autorise les notifications de cette page si tu veux être prévenu onglet réduit. « mes surveillances » liste, « ne surveille plus ' + e.q + ' » arrête.' };
      }
      if (/^mes surveillances$/i.test(t)) {
        let w = this.list();
        if (!w.length) return { handled: true, reply: 'Aucune surveillance en cours. Dis « surveille … » pour en ajouter une.' };
        return { handled: true, reply: 'Surveillances (' + w.length + ') : ' + w.map(function (e) { return '« ' + e.q + ' » toutes les ' + e.everyMin + ' min' + (e.changedAt ? ' — a bougé le ' + new Date(e.changedAt).toLocaleString() : ''); }).join(' ; ') + '. Vérifiées tant qu’un onglet Sofia reste ouvert ; au retour, résumé de ce qui a bougé. « exporte mes surveillances » donne un code à coller dans un autre navigateur.' };
      }
      let s = t.match(/^(?:ne surveille plus|arr[eê]te de surveiller|stop surveillance)\s+(.+)$/i);
      if (s) {
        let n = this.remove(s[1].trim());
        return { handled: true, reply: n ? 'Surveillance arrêtée.' : 'Je ne surveillais rien sous ce nom.' };
      }
      return null;
    }
  };

  App.Weather = {
    detect(text, session) {
      let s = String(text == null ? '' : text);
      try {
        let pend = session && session.weatherPending;
        if (pend && Array.isArray(pend.options) && pend.options.length) {
          let pick = this.pickPending(s, pend);
          if (pick) return pick;
        }
      } catch (e) {}
      // Suivi météo : "température", "plus de précision", "et donc ?" juste après une météo.
      // Avant, ces messages ne contenaient pas le mot "météo" et retombaient en réponse vague de mémoire.
      // Garde-fou cuisine : si on parle de cuisson/cocotte/recette SANS dire "météo", ce n'est pas la météo.
      try {
        if (!/m[ée]t[ée]o|weather|forecast/i.test(s) && /cuisson|cuire|cuisiner|cocotte|clipso|four|recette|ragout|rago[uû]t|viande|sanglier|marinade|po[eê]le|lardons|oignons?|carotte/i.test(s)) return null;
        let lastLoc = session && session.lastWeatherLoc;
        let hasCtx = !!(lastLoc && lastLoc.name);
        if (!hasCtx) {
          try {
            let msgs = (session && session.messages) || [];
            for (let i = msgs.length - 1; i >= 0 && i >= msgs.length - 8; i--) {
              let mc = String((msgs[i] && (msgs[i].content || msgs[i].text)) || '');
              if (/m[ée]t[ée]o|quel temps|weather|forecast|open-meteo|REAL WEATHER/i.test(mc)) { hasCtx = true; break; }
            }
          } catch (e2) {}
        }
        if (hasCtx) {
          let isFollow = /temp[eé]rature|degr[ée]|plus de pr[eé]cision|et donc|il fait combien|combien.*fait|froid|chaud|humidit[ée]|vent|rafale|pluie|pleut|neige|orage|eclaircie|ensoleill[ée]|nuage|ciel|m[ée]t[ée]o|quel temps|weather|forecast|ce soir|demain|week-?end|aujourd/i.test(s);
          let shortQ = s.trim().length <= 60 && /^(et |mais |alors |donc )?(temp[eé]rature|degr[ée]s?|pr[eé]cision|plus|et\?*|quoi\?*|combien\?*|demain\?*|ce soir\?*)\??$/i.test(s.trim());
          if (isFollow || shortQ) {
            let cityName = (lastLoc && (lastLoc.name || lastLoc.city)) || null;
            try { if (!cityName && App.Clock && App.Clock._city) cityName = App.Clock._city; } catch (e3) {}
            return { city: cityName || null, followup: true };
          }
        }
      } catch (e) {}
      if (!/m[ée]t[ée]o|quel temps fait|quel temps|weather|forecast|pluie|pleut|pleuv|\brain(?!ure|ette|ard)[a-z]*\b|neige|canicule|orage|il fait combien|fait-il|humidit[ée]/i.test(s)) return null;
      let city = null, m;
      m = s.match(/(?:m[ée]t[ée]o|temps|temp[eé]rature|weather|forecast|pluie|pleut|pleuv|\brain(?!ure|ette|ard)[a-z]*\b|neige|orage)[^?!.]{0,60}?(?:^|[\s'’\-.,;:!?()\[\]])(?:à|au|aux|en|de|d'|du|des|sur|for|in|at|near|près de|pres de)\s+([A-Za-zÀ-ÿ'’\- ]{2,40})/i)
        || s.match(/(?:m[ée]t[ée]o|temp[eé]rature|weather|forecast)\s+([A-Za-zÀ-ÿ'’\- ]{2,40})/i);
      if (m) city = m[1].replace(/[?!.,;:]+$/, '').trim();
      // Nettoie les restes de la question ("la température" captée comme ville, etc.)
      if (city) {
        let cf = this._fold(city);
        if (/^(la|le|les|de|des|du|d|et|donc|plus|precision|temperature|degres?|combien)$/.test(cf.trim()) || cf.trim().length < 2) city = null;
        // "donne la température" -> le match attrape "la temperature" : pas une ville.
        if (/temp[eé]rature|degr[ée]|pr[eé]cision|quel temps|m[ée]t[ée]o/.test(cf)) city = null;
      }
      return { city: city || null };
    },
    _fold(s) {
      try { return String(s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { return String(s || '').toLowerCase(); }
    },
    pickPending(s, pending) {
      try {
        let opts = (pending && pending.options) || [];
        if (!opts.length) return null;
        let str = String(s == null ? '' : s);
        let f = this._fold(str);
        if (!f) return null;
        let mn = str.match(/(?:^|\D)([1-4])(?:\D|$)/);
        let ordIdx = -1;
        if (/(premier|premiere|first|\b1er\b)/.test(f)) ordIdx = 0;
        else if (/(deuxieme|seconde|second|\b2e\b)/.test(f)) ordIdx = 1;
        else if (/(troisieme|third|\b3e\b)/.test(f)) ordIdx = 2;
        else if (/(quatrieme|fourth|\b4e\b)/.test(f)) ordIdx = 3;
        let short = str.length <= 60;
        let said = /(celui|celle|lequel|laquelle|je choisis|je prends|plutot)/.test(f);
        let AL = [['allemagne', 'germany'], ['deutschland', 'germany'], ['france', 'france'], ['frankreich', 'france'], ['francia', 'france'], ['espagne', 'spain'], ['spanien', 'spain'], ['italie', 'italy'], ['italia', 'italy'], ['belgique', 'belgium'], ['belgien', 'belgium'], ['suisse', 'switzerland'], ['schweiz', 'switzerland'], ['angleterre', 'united kingdom'], ['england', 'united kingdom'], ['texas', 'texas'], ['etatsunis', 'united states'], ['usa', 'united states'], ['canada', 'canada'], ['maroc', 'morocco'], ['algerie', 'algeria'], ['tunisie', 'tunisia']];
        let hits = [];
        let hays = opts.map(function (o) { return this._fold(String(o.name || '') + ' ' + String(o.admin1 || '') + ' ' + String(o.country || '')); }, this);
        for (let i = 0; i < opts.length; i++) {
          let hay = hays[i];
          let parts = hay.split(/[^a-z]+/).filter(function (w) { return w.length > 2; });
          let hit = false;
          for (let p = 0; p < parts.length; p++) {
            let shared = true;
            for (let j = 0; j < hays.length; j++) {
              if (hays[j].indexOf(parts[p]) === -1) { shared = false; break; }
            }
            if (!shared && f.indexOf(parts[p]) !== -1) { hit = true; break; }
          }
          if (!hit) {
            for (let a = 0; a < AL.length; a++) {
              if (f.indexOf(AL[a][0]) !== -1 && hay.indexOf(AL[a][1]) !== -1) { hit = true; break; }
            }
          }
          if (hit) hits.push(i);
        }
        if (mn && short) {
          let n = parseInt(mn[1], 10);
          if (n >= 1 && n <= opts.length) return { city: null, weatherChoice: opts[n - 1] };
        }
        if (ordIdx >= 0 && ordIdx < opts.length) return { city: null, weatherChoice: opts[ordIdx] };
        if (hits.length === 1) return { city: null, weatherChoice: opts[hits[0]] };
        if (hits.length > 1 || (short && (mn || ordIdx >= 0 || said))) return { city: null, weatherChoice: 'unresolved' };
      } catch (e) {}
      return null;
    },
    ambiguous(list, asked) {
      try {
        let self = this;
        let base = self._fold(String(asked || '').split(/\s+/)[0] || '');
        if (!base) return null;
        let cands = (list || []).filter(function (c) {
          let fn = self._fold(c.name || '');
          return fn && (fn === base || fn.indexOf(base) === 0 || base.indexOf(fn) === 0);
        });
        if (cands.length < 2) return null;
        let keys = {};
        for (let i = 0; i < cands.length; i++) {
          let c = cands[i];
          keys[String(c.country || '') + '|' + String(c.admin1 || '') + '|' + Number(c.latitude || 0).toFixed(1) + ',' + Number(c.longitude || 0).toFixed(1)] = 1;
        }
        if (Object.keys(keys).length >= 2) return cands;
      } catch (e) {}
      return null;
    },
    askBlock(asked, opts) {
      let lang = 'fr';
      try { lang = String((App.State && App.State.settings && App.State.settings.language) || 'fr').toLowerCase().slice(0, 2); } catch (e) {}
      let names = opts.map(function (o, i) { return (i + 1) + '. ' + o.name + (o.admin1 ? ', ' + o.admin1 : '') + (o.country ? ', ' + o.country : ''); }).join(' ; ');
      if (lang === 'fr') return "[REAL WEATHER - AMBIGUOUS PLACE] Le nom '" + asked + "' désigne plusieurs endroits : " + names + ". Demande-lui UNE fois lequel il veut (il peut répondre par le numéro ou « celui en … ») et ne donne AUCUNE météo pour l'instant. N'émet aucun marqueur [SOFIA_...].";
      return "[REAL WEATHER - AMBIGUOUS PLACE] The name '" + asked + "' matches several places: " + names + ". Ask him ONCE which one he means (a number, or 'the one in …') and give NO forecast yet. Do not emit any [SOFIA_...] marker.";
    },
    async forecast(loc) {
      let self = this;
      let f = await App.Core.proxyFetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude + '&longitude=' + loc.longitude + '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max&hourly=temperature_2m&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto&forecast_days=3').then(function (r) { return r.json(); });
      let c = f && f.current;
      if (!c) return null;
      try { self._remember(loc); } catch (e) {}
      let where = loc.name + (loc.admin1 ? ', ' + loc.admin1 : '') + (loc.country ? ', ' + loc.country : '');
      function r1(v) { let n = Number(v); return isFinite(n) ? Math.round(n * 10) / 10 : '–'; }
      function atHour(dateStr, hh) {
        try {
          let t = (f.hourly && f.hourly.time) || [], tv = (f.hourly && f.hourly.temperature_2m) || [], key = dateStr + 'T' + hh;
          for (let i = 0; i < t.length; i++) if (String(t[i]).slice(0, 13) === key) return r1(tv[i]);
        } catch (e) {}
        return '–';
      }
      let out = '[REAL WEATHER - live data, just fetched] Place: ' + where + '. Local time: ' + c.time + '. Right now: ' + c.temperature_2m + '°C (feels like ' + c.apparent_temperature + '°C). Condition: ' + self.wmo(c.weather_code) + '. Humidity: ' + c.relative_humidity_2m + '%. Wind: ' + c.wind_speed_10m + ' km/h.';
      try {
        let d = f.daily, names = ['today', 'tomorrow', 'the day after tomorrow'];
        for (let i = 0; i < Math.min(3, d.time.length); i++) {
          out += ' ' + d.time[i] + ' (' + (names[i] || d.time[i]) + '): ' + self.wmo(d.weathercode[i]) + ', max ' + d.temperature_2m_max[i] + '°C, min ' + d.temperature_2m_min[i] + '°C, morning (8h) ' + atHour(d.time[i], '08') + '°C, afternoon (14h) ' + atHour(d.time[i], '14') + '°C, evening (20h) ' + atHour(d.time[i], '20') + '°C.';
        }
      } catch (e) {}
      out += " Answer in the user's language using these exact numbers - morning, afternoon and evening each have their own figure on the same date line, never repeat one number for two moments of the day, never invent an hourly value (if shown as –, say it is unavailable), name the place and the date exactly as above, and do not emit any [SOFIA_...] marker.";
      return out;
    },
    wmo(code) {      let c = Number(code);
      if (c === 0) return 'clear sky';
      if (c <= 3) return 'partly cloudy to overcast';
      if (c === 45 || c === 48) return 'fog';
      if (c >= 51 && c <= 55) return 'drizzle';
      if (c >= 56 && c <= 57) return 'freezing drizzle';
      if (c >= 61 && c <= 65) return 'rain';
      if (c >= 66 && c <= 67) return 'freezing rain';
      if (c >= 71 && c <= 77) return 'snow';
      if (c >= 80 && c <= 82) return 'rain showers';
      if (c === 85 || c === 86) return 'snow showers';
      if (c === 95) return 'thunderstorm';
      if (c >= 96) return 'thunderstorm with hail';
      return 'unknown conditions';
    },
    _remember(loc) {
      try {
        if (!loc || loc.latitude == null) return;
        let sessions = (App.State && App.State.sessions) || [];
        let cur = null;
        try { cur = sessions.find(function (x) { return x.id === App.State.currentSessionId; }) || null; } catch (e) {}
        if (!cur) return;
        cur.lastWeatherLoc = { name: loc.name || '', admin1: loc.admin1 || '', country: loc.country || '', latitude: loc.latitude, longitude: loc.longitude, at: Date.now() };
        try { App.Data.saveSessions(cur.id); } catch (e) {}
      } catch (e) {}
    },
    _fallbackCity(session) {
      try {
        if (session && session.lastWeatherLoc && session.lastWeatherLoc.name) return { name: session.lastWeatherLoc.name, from: 'last' };
      } catch (e) {}
      try {
        let c = App.Clock && App.Clock._city;
        if (c && String(c).trim()) return { name: String(c).trim(), from: 'connection' };
      } catch (e) {}
      return null;
    },
    async block(q, session) {
      try {
        if (q && q.weatherChoice && typeof q.weatherChoice === 'object') {
          let picked = q.weatherChoice;
          try { if (session && session.weatherPending) { delete session.weatherPending; App.Data.saveSessions(session.id); } } catch (e) {}
          return await this.forecast(picked);
        }
        if (q && q.weatherChoice === 'unresolved') {
          let pend = session && session.weatherPending;
          if (pend && pend.options && pend.options.length) return this.askBlock(pend.asked || '', pend.options);
        }
      } catch (e) {}
      if (!q || !q.city) {
        let fb = null;
        try { fb = this._fallbackCity(session); } catch (e) {}
        if (fb && fb.name) {
          q = { city: fb.name, fromFallback: fb.from };
        } else {
          return '[REAL WEATHER - live data] The user asks about the weather but named no city. Ask once, gently, which city they mean - do not guess and do not answer from memory. Do not emit any [SOFIA_...] marker.';
        }
      }
      try {
        let uiLang = 'fr';
        try { uiLang = String((App.State && App.State.settings && App.State.settings.language) || 'fr').toLowerCase().slice(0, 2); } catch (e) {}
        let asked = String(q.city || '');
        asked = asked.replace(/\b(apr[eè]s-demain|demain|aujourd['’]hui|ce\s+soir|cette\s+nuit|ce\s+week-?end|tomorrow|today|tonight)\b/gi, ' ');
        asked = asked.replace(/\b(s['’]il\s+(?:te|vous)\s+pla[iî]t|stp|svp|merci)\b/gi, ' ');
        asked = asked.replace(/[?!.,;:]+$/g, '').replace(/\s+/g, ' ').trim();
        if (!asked) asked = String(q.city || '');
        let tries = [asked];
        let aw = asked.split(/\s+/);
        if (aw.length > 2) tries.push(aw.slice(0, 2).join(' '));
        if (aw.length > 1) tries.push(aw[0]);
        let list = [];
        for (let ti = 0; ti < tries.length && !list.length; ti++) {
          try {
            let gg = await App.Core.proxyFetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(tries[ti]) + '&count=5&language=' + encodeURIComponent(uiLang) + '&format=json').then(function (r) { return r.json(); });
            list = (gg && gg.results) || [];
          } catch (e) { list = []; }
        }
        if (!list.length) return "[REAL WEATHER - live data] Geocoding failed for '" + asked + "'. Say plainly you could not find that city and ask them to rephrase. Do not emit any [SOFIA_...] marker.";
        try {
          let amb = this.ambiguous(list, asked);
          if (amb && amb.length >= 2) {
            let opts = amb.slice(0, 4).map(function (c) { return { name: c.name, admin1: c.admin1 || '', country: c.country || '', latitude: c.latitude, longitude: c.longitude }; });
            try { if (session) { session.weatherPending = { asked: asked, options: opts }; App.Data.saveSessions(session.id); } } catch (e) {}
            return this.askBlock(asked, opts);
          }
          if (session && session.weatherPending) { delete session.weatherPending; }
        } catch (e) {}
        let loc = (function (cands, asked, lang) {
          function fold(s) { try { return String(s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { return String(s || '').toLowerCase(); } }
          let ql = fold(asked), want = [];
          let mc = ql.match(/\b(france|allemagne|germany|belgique|belgium|suisse|switzerland|espagne|spain|italie|italy|luxembourg|canada|maroc|algerie|tunisie|senegal)\b/);
          if (mc) want.push(mc[1]);
          else if (lang === 'fr') want.push('france');
          else if (lang === 'de') want.push('deutschland', 'germany');
          else if (lang === 'es') want.push('espana', 'spain');
          else if (lang === 'it') want.push('italia', 'italy');
          let best = cands[0], bestScore = -1;
          for (let i = 0; i < cands.length; i++) {
            let c = cands[i], sc = 0;
            if (fold(c.name) === fold(String(asked).split(/\s+/)[0])) sc += 2;
            else if (ql.indexOf(fold(c.name)) !== -1) sc += 2;
            let ctr = fold(c.country || '');
            for (let k = 0; k < want.length; k++) if (ctr && (ctr.indexOf(fold(want[k])) !== -1 || fold(want[k]).indexOf(ctr) !== -1)) sc += 3;
            let pop = Number(c.population || 0);
            if (isFinite(pop) && pop > 0) sc += Math.min(2, Math.log10(pop + 1) / 3);
            if (sc > bestScore) { bestScore = sc; best = c; }
          }
          return best;
        })(list, asked, uiLang);
        let f = await App.Core.proxyFetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude + '&longitude=' + loc.longitude + '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max&hourly=temperature_2m&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto&forecast_days=3').then(function (r) { return r.json(); });
        let c = f && f.current;
        if (!c) return null;
        try { this._remember(loc); } catch (e) {}
        let where = loc.name + (loc.admin1 ? ', ' + loc.admin1 : '') + (loc.country ? ', ' + loc.country : '');
        function r1(v) { let n = Number(v); return isFinite(n) ? Math.round(n * 10) / 10 : '–'; }
        let self = this;
        function atHour(dateStr, hh) {
          try {
            let t = (f.hourly && f.hourly.time) || [], tv = (f.hourly && f.hourly.temperature_2m) || [], key = dateStr + 'T' + hh;
            for (let i = 0; i < t.length; i++) if (String(t[i]).slice(0, 13) === key) return r1(tv[i]);
          } catch (e) {}
          return '–';
        }
        let out = '[REAL WEATHER - live data, just fetched] Place: ' + where + '. Local time: ' + c.time + '. Right now: ' + c.temperature_2m + '°C (feels like ' + c.apparent_temperature + '°C). Condition: ' + self.wmo(c.weather_code) + '. Humidity: ' + c.relative_humidity_2m + '%. Wind: ' + c.wind_speed_10m + ' km/h.';
        try {
          let d = f.daily, names = ['today', 'tomorrow', 'the day after tomorrow'];
          for (let i = 0; i < Math.min(3, d.time.length); i++) {
            out += ' ' + d.time[i] + ' (' + (names[i] || d.time[i]) + '): ' + self.wmo(d.weathercode[i]) + ', max ' + d.temperature_2m_max[i] + '°C, min ' + d.temperature_2m_min[i] + '°C, morning (8h) ' + atHour(d.time[i], '08') + '°C, afternoon (14h) ' + atHour(d.time[i], '14') + '°C, evening (20h) ' + atHour(d.time[i], '20') + '°C.';
          }
        } catch (e) {}
        try {
          if (q && q.fromFallback === 'connection') out += ' Note: the user named no city, so you used his IP connection city (' + where + '). Say clearly you used his connection city and that it is approximate.';
          else if (q && q.fromFallback === 'last') out += ' Note: the user named no new city, so you reused the last weather place (' + where + ').';
          else if (q && q.followup) out += ' Note: this is a follow-up about the same place (' + where + ').';
        } catch (e) {}
        out += " Answer in the user's language using these exact numbers - morning, afternoon and evening each have their own figure on the same date line, never repeat one number for two moments of the day, never invent an hourly value (if shown as –, say it is unavailable), name the place and the date exactly as above, and do not emit any [SOFIA_...] marker.";
        return out;
      } catch (e) { console.warn('[Weather] fetch failed', e); return null; }
    }
  };
  App.Sujets = {
    CHANNEL: 'sujets',
    _com: null,
    ensure() {
      try { this._apply(); } catch (e) {}
      try {
        if (this._com) return this._com;
        let inst = null;
        try { inst = window.root ? window.root.sujetsCom : null; } catch (e) {}
        if (!inst) { try { inst = window.sujetsCom; } catch (e) {} }
        if (inst && typeof inst.submit === 'function') this._com = inst;
        return this._com;
      } catch (e) { return null; }
    },
    propose(topic) {
      try {
        let okFrame = false;
        try { okFrame = !!document.querySelector('#sujetsCtn iframe'); } catch (e) {}
        if (!okFrame) return this._noWall('topic', topic);
        let com = this.ensure();
        if (!com || typeof com.submit !== 'function') return this._noWall('topic', topic);
        let r = com.submit('apprends : ' + String(topic || '').trim().slice(0, 140));
        if (r && typeof r.catch === 'function') r.catch(function () {});
        try { this.flush(); } catch (e2) {}
        return true;
      } catch (e) { return false; }
    },
    transmit(text) {
      try {
        let okFrame = false;
        try { okFrame = !!document.querySelector('#sujetsCtn iframe'); } catch (e) {}
        if (!okFrame) return this._noWall('savoir', text);
        let com = this.ensure();
        if (!com || typeof com.submit !== 'function') return this._noWall('savoir', text);
        let r = com.submit('savoir transmis (\u00e0 v\u00e9rifier) : ' + String(text || '').trim().slice(0, 500));
        if (r && typeof r.catch === 'function') r.catch(function () {});
        try { this.flush(); } catch (e2) {}
        return true;
      } catch (e) { return false; }
    },
    KEY: 'sofia_sujets_open_v1',
    OUTBOX_KEY: 'sofia_transmit_outbox_v1',
    _box() { try { let b = JSON.parse(localStorage.getItem(this.OUTBOX_KEY) || '[]'); return Array.isArray(b) ? b : []; } catch (e) { return []; } },
    _saveBox(b) { try { localStorage.setItem(this.OUTBOX_KEY, JSON.stringify((b || []).slice(-50))); } catch (e) {} try { this.syncAutoUI(); } catch (e2) {} },
    _noWall(kind, text) {
      try { if (App.State && App.State.settings && App.State.settings.autoTransmit === true) { this.enqueue(kind, text); return 'queued'; } } catch (e) {}
      return false;
    },
    enqueue(kind, text) {
      let t = String(text == null ? '' : text).trim().slice(0, 500);
      if (t.length < 3) return false;
      let b = this._box();
      if (!b.some(e => e && e.t === t)) b.push({ k: kind === 'topic' ? 'topic' : 'savoir', t: t, at: Date.now() });
      this._saveBox(b);
      try { this.flush(); } catch (e) {}
      return true;
    },
    pendingCount() { return this._box().length; },
    _flushing: false,
    flush() {
      if (this._flushing) return;
      try { if (!(App.State && App.State.settings && App.State.settings.autoTransmit === true)) return; } catch (e) { return; }
      try { if (typeof navigator !== 'undefined' && navigator.onLine === false) return; } catch (e) {}
      let b = this._box();
      if (!b.length) return;
      let com = null;
      try { com = this.ensure(); } catch (e) {}
      if (!com || typeof com.submit !== 'function') return;
      this._flushing = true;
      let item = b.shift();
      try {
        let r = com.submit((item.k === 'topic' ? 'apprends : ' : 'savoir transmis : ') + item.t);
        if (r && typeof r.catch === 'function') r.catch(function () {});
        this._saveBox(b);
      } catch (e) { b.unshift(item); this._saveBox(b); this._flushing = false; return; }
      this._flushing = false;
      if (b.length) setTimeout(() => { try { this.flush(); } catch (e2) {} }, 20000);
    },
    toggleAuto(on) {
      try { App.State.settings.autoTransmit = on === true; App.Data.saveSettings(); } catch (e) {}
      try { this.syncAutoUI(); } catch (e2) {}
      if (on === true) { try { this.flush(); } catch (e3) {} }
    },
    syncAutoUI() {
      try {
        let c = document.querySelector('#sujetsAutoCheck');
        if (c) c.checked = !!(App.State && App.State.settings && App.State.settings.autoTransmit === true);
        let n = document.querySelector('#sujetsPendingEl');
        if (n) { let k = this.pendingCount(); n.textContent = k > 0 ? ('File d\u2019envoi : ' + k) : ''; n.hidden = !(k > 0); }
      } catch (e) {}
    },
    _show(open) {
      try {
        let h = document.querySelector('#sujetsHead'), c = document.querySelector('#sujetsCtn'), o = document.querySelector('#sujetsOpenBtn'), a = document.querySelector('#sujetsAutoRow');
        if (h) h.hidden = true;
        if (c) c.hidden = true;
        if (o) o.hidden = true;
        if (a) a.hidden = true;
      } catch (e) {}
      try { localStorage.setItem(this.KEY, open ? '1' : '0'); } catch (e) {}
    },
    close() { this._show(false); },
    open() { this._show(true); this.ensure(); try { this.syncAutoUI(); } catch (e) {} },
    _apply() {
      try { localStorage.setItem(this.KEY, '0'); } catch (e) {}
      try {
        let h = document.querySelector('#sujetsHead'), c = document.querySelector('#sujetsCtn'), o = document.querySelector('#sujetsOpenBtn'), a = document.querySelector('#sujetsAutoRow');
        if (h) h.hidden = true;
        if (c) c.hidden = true;
        if (o) o.hidden = true;
        if (a) a.hidden = true;
      } catch (e) {}
    }
  };
  try { App.Sujets._apply(); } catch (e) {}
  try {
    let sc = document.querySelector('#sujetsCtn');
    if (sc && window.root && root.commentsPlugin) {
      let inst = root.commentsPlugin({ channel: 'sujets' });
      sc.innerHTML = inst;
      try { window.sujetsCom = inst; } catch (e2) {}
    }
  } catch (e) {}
  App.Academic = {
    match(text) {
      let t = String(text == null ? '' : text).trim();
      let m = t.match(/^(?:cherche|trouve|trouver|donne(?:-moi)?|liste|quels?|cite)\s+(?:moi\s+)?(?:des\s+|de\s+la\s+)?(?:articles?|publications?|papiers?|travaux?|references?|r\u00e9f\u00e9rences?|\u00e9tudes?)(?:\s+scientifiques?)?\s+(?:sur|au sujet de|concernant|\u00e0 propos de|about|on)\s+(.+)$/i)
        || t.match(/^(?:articles?|papers?)(?:\s+scientifiques?)?\s+(?:sur|about|on)\s+(.+)$/i)
        || t.match(/^(?:fais|faire)\s+(?:une\s+)?revue\s+(?:de\s+)?(?:la\s+)?(?:litt\u00e9rature|biblio(?:graphie)?)\s+(?:sur|about|on)\s+(.+)$/i);
      if (!m) return null;
      let q = m[1].trim().replace(/\?+$/, '').replace(/^[("\u00ab\u201c\s]+|[)"\u00bb\u201d\s]+$/g, '').trim();
      return q.length >= 2 ? q : null;
    },
    lang() { try { return normLang(App.State.settings.language); } catch (e) { return 'fr'; } },
    async handleChat(text) {
      let q = this.match(text);
      if (!q) return null;
      return { handled: true, reply: await this.search(q, this.lang() === 'fr') };
    },
    async _getJson(url) {
      let get = async (useProxy) => {
        let p = null;
        try {
          if (useProxy) {
            let sf = null;
            try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e) {}
            if (!sf) { try { sf = superFetch; } catch (e2) {} }
            if (!sf) throw new Error('no proxy');
            p = sf(url).then(r => r.json());
          } else {
            p = fetch(url, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
          }
        } catch (e) { return null; }
        try { return await Promise.race([p, new Promise(res => setTimeout(() => res(null), 16000))]); }
        catch (e) { return null; }
      };
      let j = await get(true);
      if (!j) j = await get(false);
      return j;
    },
    async search(q, fr) {
      let eq = encodeURIComponent(q);
      let out = await Promise.all([
        this._getJson('https://api.openalex.org/works?search=' + eq + '&per-page=5'),
        this._getJson('https://api.archives-ouvertes.fr/search/?q=' + eq + '&rows=4&fl=title_s,authFullName_s,producedDateY_i,uri_s&sort=producedDateY_i%20desc&format=json')
      ]);
      let oa = out[0], hal = out[1], L = [], n = 0;
      L.push(fr ? ('**Articles sur \u00ab ' + q + ' \u00bb** \u2014 rep\u00e9r\u00e9s en direct (OpenAlex, HAL) :') : ('**Papers on "' + q + '"** \u2014 found live (OpenAlex, HAL):'));
      let works = (oa && oa.results) ? oa.results : [];
      if (works.length) {
        L.push('');
        L.push(fr ? '**OpenAlex** (toutes disciplines)' : '**OpenAlex** (all fields)');
        works.slice(0, 5).forEach(w => {
          n++;
          let title = String((w && w.title) || (fr ? 'Sans titre' : 'Untitled')).replace(/\s+/g, ' ').trim();
          let names = ((w && w.authorships) || []).map(a => a && a.author && a.author.display_name).filter(Boolean);
          let au = names.slice(0, 3).join(', ') + (names.length > 3 ? (fr ? ' et coll.' : ' et al.') : '');
          let year = (w && w.publication_year) || '?';
          let ven = w && w.primary_location && w.primary_location.source && w.primary_location.source.display_name;
          let cited = (w && typeof w.cited_by_count === 'number') ? (' \u00b7 ' + (fr ? 'cit\u00e9 ' : 'cited ') + w.cited_by_count + '\u00d7') : '';
          let doi = (w && w.doi) ? (' \u00b7 [DOI](' + w.doi + ')') : '';
          let oaUrl = (w && w.open_access && w.open_access.oa_url) || (w && w.best_oa_location && w.best_oa_location.landing_page_url) || '';
          let pdf = oaUrl ? (' \u00b7 [' + (fr ? 'texte libre' : 'free full text') + '](' + oaUrl + ')') : '';
          L.push(n + '. **' + title + '** \u2014 ' + (au || '?') + ' (' + year + ')' + (ven ? '. *' + ven + '*' : '') + cited + doi + pdf);
        });
      }
      let docs = (hal && hal.response && hal.response.docs) ? hal.response.docs : [];
      if (docs.length) {
        L.push('');
        L.push(fr ? '**HAL** (recherche francophone)' : '**HAL** (French research)');
        docs.slice(0, 4).forEach(d => {
          n++;
          let title = String(((d && d.title_s) || [])[0] || '?').replace(/\s+/g, ' ').trim();
          let an = (d && d.authFullName_s) || [];
          let link = (d && d.uri_s) ? (' \u00b7 [' + (fr ? 'fiche' : 'record') + '](' + d.uri_s + ')') : '';
          L.push(n + '. **' + title + '** \u2014 ' + ((an.slice(0, 3).join(', ') + (an.length > 3 ? ' et coll.' : '')) || '?') + ' (' + ((d && d.producedDateY_i) || '?') + ')' + link);
        });
      }
      if (!n) return fr ? ('Je n\u2019ai rien trouv\u00e9 sur \u00ab ' + q + ' \u00bb dans OpenAlex ni HAL. Essaie d\u2019autres mots-cl\u00e9s (l\u2019anglais marche mieux sur OpenAlex).') : ('No results for "' + q + '" in OpenAlex or HAL. Try other keywords (English works best on OpenAlex).');
      L.push('');
      L.push(fr ? '_Sources v\u00e9rifiables ci-dessus. Dis \u00ab r\u00e9sume le n\u00b01 \u00bb ou pose ta vraie question et je croise._' : '_Verifiable sources above. Say "summarize #1" or ask your question and I will cross-check._');
      return L.join('\n');
    }
  };
  (function () {
    function line() {
      var fr = true;
      try { fr = normLang(App.State.settings.language) === 'fr'; } catch (e) {}
      return fr
        ? 'Ce qui me distingue des autres IA : entre adultes, une liberté totale, sans tabou — et pour les enfants, une protection absolue.'
        : 'What sets me apart from other AIs: total freedom between adults, no taboos — and absolute protection for children.';
    }
    function patch() {
      try {
        var box = document.querySelector('#sofiaIntroEl .sofia-intro-lines');
        if (!box || box.querySelector('.sofia-intro-args')) return false;
        var p = document.createElement('p');
        p.className = 'sofia-intro-line sofia-intro-args';
        p.textContent = line();
        var listen = box.querySelector('.sofia-intro-listen');
        box.insertBefore(p, listen || null);
        return true;
      } catch (e) { return false; }
    }
    function hook() {
      try {
        if (!(window.App && App.Intro && App.Intro.render)) return false;
        if (!App.Intro.render.__sofiaArgs) {
          var orig = App.Intro.render.bind(App.Intro);
          var wrapped = function (listEl) { var r = orig(listEl); try { patch(); } catch (e) {} return r; };
          wrapped.__sofiaArgs = true;
          App.Intro.render = wrapped;
        }
        patch();
        return true;
      } catch (e) { return false; }
    }
    var n = 0;
    var timer = setInterval(function () { try { if (hook() && ++n > 10) clearInterval(timer); } catch (e) {} }, 500);
    setInterval(function () { try { hook(); } catch (e) {} }, 3000);
  })();
  App.Datasets = {
    match(text) {
      let t = String(text == null ? '' : text).trim();
      let m = t.match(/^(?:cherche|trouve|trouver|donne(?:-moi)?|liste)\s+(?:moi\s+)?(?:des\s+|de\s+la\s+)?(?:donn[eé]es?|jeux?\s+de\s+donn[eé]es?|datasets?|open[-\s]?data)\s+(?:sur|au sujet de|concernant|\u00e0 propos de|about|on)\s+(.+)$/i)
        || t.match(/^(?:donn[eé]es?|datasets?|open[-\s]?data)(?:\s+ouvertes?)?\s+(?:sur|about|on)\s+(.+)$/i);
      if (!m) return null;
      let q = m[1].trim().replace(/\?+$/, '').replace(/^[("\u00ab\u201c\s]+|[)"\u00bb\u201d\s]+$/g, '').trim();
      return q.length >= 2 ? q : null;
    },
    async handleChat(text) {
      let q = this.match(text);
      if (!q) return null;
      var fr = true;
      try { fr = normLang(App.State.settings.language) === 'fr'; } catch (e) {}
      return { handled: true, reply: await this.search(q, fr) };
    },
    async _getJson(url) {
      try {
        let r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await Promise.race([r.json(), new Promise(res => setTimeout(() => res(null), 16000))]);
      } catch (e) {
        try {
          let sf = null;
          try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e2) {}
          if (!sf) { try { sf = superFetch; } catch (e3) {} }
          if (!sf) return null;
          return await Promise.race([sf(url).then(rr => rr.json()), new Promise(res => setTimeout(() => res(null), 16000))]);
        } catch (e4) { return null; }
      }
    },
    async search(q, fr) {
      let j = await this._getJson('https://www.data.gouv.fr/api/1/datasets/?q=' + encodeURIComponent(q) + '&page_size=5');
      let items = (j && j.data) ? j.data : [];
      let total = (j && typeof j.total === 'number') ? j.total : items.length;
      let L = [];
      L.push(fr ? ('**Donn\u00e9es ouvertes sur \u00ab ' + q + ' \u00bb** \u2014 ' + total + ' jeu' + (total > 1 ? 'x' : '') + ' sur data.gouv.fr :') : ('**Open data on "' + q + '"** \u2014 ' + total + ' dataset' + (total > 1 ? 's' : '') + ' on data.gouv.fr:'));
      items.slice(0, 5).forEach((d, i) => {
        let title = String((d && d.title) || '?').replace(/\s+/g, ' ').trim();
        let org = (d && d.organization && d.organization.name) || (fr ? 'producteur inconnu' : 'unknown producer');
        let res = (d && d.resources) || [];
        let fmts = [];
        res.forEach(r => { let f = String((r && r.format) || '').toUpperCase(); if (f && fmts.indexOf(f) < 0) fmts.push(f); });
        let link = (d && d.page) ? (' \u00b7 [' + (fr ? 'fiche' : 'page') + '](' + d.page + ')') : '';
        L.push((i + 1) + '. **' + title + '** \u2014 ' + org + ' \u00b7 ' + res.length + ' ressource' + (res.length > 1 ? 's' : '') + (fmts.length ? ' (' + fmts.slice(0, 3).join(', ') + ')' : '') + link);
      });
      if (!items.length) L.push(fr ? 'Rien trouv\u00e9 — essaie d\u2019autres mots-cl\u00e9s.' : 'Nothing found — try other keywords.');
      L.push('');
      L.push(fr ? ('_Pour Kaggle (mondial, compte gratuit) : cherche \u00ab ' + q + ' \u00bb sur kaggle.com/datasets. Dis-moi le jeu choisi et je t\u2019aide \u00e0 l\u2019exploiter dans l\u2019interpr\u00e9teur._') : ('_For Kaggle (worldwide, free account): search "' + q + '" on kaggle.com/datasets. Tell me which one and I will help you use it in the interpreter._'));
      return L.join('\n');
    }
  };
  App.FreeBooks = {
    match(text) {
      let t = String(text == null ? '' : text).trim();
      let m = t.match(/^\s*\/(livres?|books?|e-?books?)\b\s*(.*)$/i);
      if (m) {
        let q = (m[2] || '').trim().replace(/\?+$/, '').replace(/^["'«“\s]+|["'»”\s]+$/g, '').trim();
        return { q: q, slash: true };
      }
      if (/ouvertures?|opening\b|jeu d'échecs|d'échecs|\béchecs\b|prompt-?book|livre de prompts/i.test(t)) return null;
      let n = t.match(/(?:cherche|trouve|trouver|donne(?:-moi)?|liste|télécharge|telecharge|télécharger|telecharger|recommande(?:-moi)?|conseille(?:-moi)?|as-tu|connais(?:-tu)?)\s+(?:moi\s+)?(?:un\s+|une\s+|des\s+|de\s+|le\s+|la\s+|les\s+|du\s+|de\s+la\s+|d['’]\s*)?(?:livres?(?:\s+gratuits?)?|e-?books?(?:\s+gratuits?)?|romans?(?:\s+gratuits?)?|bouquins?|ouvrages?|mangas?|bandes?\s+dessinées?|\bbd\b)\s+(?:(?:sur|de|du|des|au\s+sujet\s+de|concernant|à\s+propos\s+de|about|on|par|intitulé|qui\s+s['’]appelle|qui\s+parle\s+de)\s+)?(.+)$/i)
        || t.match(/(?:où\s+(?:puis-je\s+)?télécharger|ou\s+(?:puis-je\s+)?telecharger|télécharger|telecharger)\s+(?:le\s+|la\s+|l['’]\s*|un\s+|une\s+)?(?:livre|e-?book|roman)\s+(.+)$/i)
        || t.match(/(?:find|search\s+for|get|download|list|recommend|suggest)(?:\s+me)?\s+(?:a\s+|some\s+|any\s+|free\s+)*(?:books?|e-?books?|novels?)\s+(?:about|on|by|called|titled)\s+(.+)$/i)
        || t.match(/where\s+can\s+i\s+(?:download|find|get)\s+(?:the\s+)?(?:free\s+)?book\s+(.+)$/i);
      if (!n) return null;
      let q = (n[1] || '').trim().replace(/\?+$/, '').replace(/^["'«“\s]+|["'»”\s]+$/g, '').trim();
      if (q.length < 2) return null;
      return { q: q, slash: false };
    },
    async handleChat(text) {
      let hit = this.match(text);
      if (!hit) return null;
      var fr = true;
      try { fr = normLang(App.State.settings.language) === 'fr'; } catch (e) {}
      if (!hit.q) return { handled: true, reply: this.usage(fr) };
      return { handled: true, reply: await this.search(hit.q, fr) };
    },
    usage(fr) {
      return fr
        ? ('**Livres gratuits** — dis « cherche un livre sur … », « télécharge le roman … », ou `/livre <titre ou auteur>`. Je fouille Gutenberg (70 000+), Open Library, Internet Archive et Gallica en direct, avec liens de lecture et téléchargement (EPUB/PDF).')
        : ('**Free books** — say "find a book about …", "download the novel …", or `/book <title or author>`. I search Gutenberg (70,000+), Open Library, Internet Archive and Gallica live, with read and download links (EPUB/PDF).');
    },
    async _getJson(url) {
      try {
        let r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await Promise.race([r.json(), new Promise(res => setTimeout(() => res(null), 16000))]);
      } catch (e) {
        try {
          let sf = null;
          try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e2) {}
          if (!sf) { try { sf = superFetch; } catch (e3) {} }
          if (!sf) return null;
          return await Promise.race([sf(url).then(rr => rr.json()), new Promise(res => setTimeout(() => res(null), 16000))]);
        } catch (e4) { return null; }
      }
    },
    async _getText(url) {
      try {
        let r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await Promise.race([r.text(), new Promise(res => setTimeout(() => res(null), 16000))]);
      } catch (e) {
        try {
          let sf = null;
          try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e2) {}
          if (!sf) { try { sf = superFetch; } catch (e3) {} }
          if (!sf) return null;
          return await Promise.race([sf(url).then(rr => rr.text()), new Promise(res => setTimeout(() => res(null), 16000))]);
        } catch (e4) { return null; }
      }
    },
    _flipName(s) {
      s = String(s || '').trim();
      if (s.indexOf(',') < 0) return s;
      let p = s.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      if (p.length > 1 && p[0].split(/\s+/).length <= 2) return (p.slice(1).join(' ') + ' ' + p[0]).trim();
      return s;
    },
    _langLabel(c) {
      let m = { fre: 'fr', fra: 'fr', eng: 'en', ger: 'de', deu: 'de', spa: 'es', ita: 'it', por: 'pt', fr: 'fr', en: 'en', de: 'de', es: 'es', it: 'it' };
      let k = String(c || '').toLowerCase();
      return m[k] || (k ? k.toUpperCase().slice(0, 8) : '');
    },
    _unesc(s) {
      return String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    },
    async search(q, fr) {
      let self = this, eq = encodeURIComponent(q);
      let out = await Promise.all([
        self._getJson('https://gutendex.com/books?search=' + eq),
        self._getJson('https://openlibrary.org/search.json?q=' + eq + '&has_fulltext=true&public_scan_b=true&limit=6&fields=key,title,author_name,first_publish_year,cover_i,ia,language,id_gutenberg,edition_count'),
        self._getJson('https://archive.org/advancedsearch.php?q=' + eq + '+AND+mediatype:texts&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=creator&fl%5B%5D=year&fl%5B%5D=language&rows=5&output=json'),
        self._getText('https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=gallica%20all%20%22' + eq + '%22&maximumRecords=5')
      ]);
      let g = out[0], o = out[1], a = out[2], sru = out[3];
      let L = [], n = 0;
      L.push(fr ? ('**Livres gratuits sur « ' + q + ' »** — cherchés en direct (Gutenberg, Open Library, Internet Archive, Gallica) :') : ('**Free books on "' + q + '"** — searched live (Gutenberg, Open Library, Internet Archive, Gallica):'));
      let gitems = (g && g.results) ? g.results : [];
      if (gitems.length) {
        L.push('');
        L.push(fr ? '**Project Gutenberg** (domaine public, téléchargement direct)' : '**Project Gutenberg** (public domain, direct download)');
        gitems.slice(0, 5).forEach(function (b) {
          n++;
          let f = b.formats || {};
          let title = String(b.title || '?').replace(/\s+/g, ' ').trim();
          let au = ((b.authors || []).map(function (x) { return self._flipName(x.name); }).slice(0, 2).join(', ') || '?');
          let links = ['[Fiche](https://www.gutenberg.org/ebooks/' + b.id + ')'];
          if (f['application/epub+zip']) links.push('[EPUB](' + f['application/epub+zip'] + ')');
          if (f['application/x-mobipocket-ebook']) links.push('[Kindle](' + f['application/x-mobipocket-ebook'] + ')');
          if (f['text/html'] || f['text/html; charset=utf-8']) links.push('[HTML](' + (f['text/html'] || f['text/html; charset=utf-8']) + ')');
          L.push(n + '. **' + title + '** — ' + au + ' · ' + links.join(' · '));
        });
      }
      let odocs = (o && o.docs) ? o.docs : [];
      if (odocs.length) {
        L.push('');
        L.push(fr ? '**Open Library** (emprunt et lecture en ligne)' : '**Open Library** (borrow and read online)');
        odocs.slice(0, 5).forEach(function (d) {
          n++;
          let title = String(d.title || '?').replace(/\s+/g, ' ').trim();
          let au = ((d.author_name || []).slice(0, 2).join(', ') || '?');
          let year = d.first_publish_year || '?';
          let links = [];
          if (d.key) links.push('[' + (fr ? 'Fiche' : 'Page') + '](https://openlibrary.org' + d.key + ')');
          let ia = (d.ia && d.ia[0]) || '';
          if (ia) {
            links.push('[' + (fr ? 'Lire' : 'Read') + '](https://archive.org/details/' + ia + ')');
            links.push('[PDF](https://archive.org/download/' + ia + '/' + ia + '.pdf)');
          }
          if (d.id_gutenberg) links.push('[Gutenberg](https://www.gutenberg.org/ebooks/' + [].concat(d.id_gutenberg)[0] + ')');
          L.push(n + '. **' + title + '** — ' + au + ' (' + year + ')' + (links.length ? ' · ' + links.join(' · ') : ''));
        });
      }
      let adocs = (a && a.response && a.response.docs) ? a.response.docs : [];
      if (adocs.length) {
        L.push('');
        L.push('**Internet Archive**');
        adocs.slice(0, 4).forEach(function (d) {
          n++;
          let id = d.identifier || '';
          if (!id) return;
          let title = String(d.title || id).replace(/\s+/g, ' ').trim();
          let au = ([].concat(d.creator || []).slice(0, 2).join(', ') || '?');
          L.push(n + '. **' + title + '** — ' + au + ' (' + (d.year || '?') + ') · [' + (fr ? 'Lire' : 'Read') + '](https://archive.org/details/' + id + ') · [PDF](https://archive.org/download/' + id + '/' + id + '.pdf)');
        });
      }
      let recs = [];
      try {
        String(sru || '').replace(/<srw:recordData>([\s\S]*?)<\/srw:recordData>/g, function (mm, body) {
          if (recs.length >= 3) return '';
          let one = function (re) { let x = body.match(re); return x ? self._unesc(x[1]) : ''; };
          let title = one(/<dc:title>([\s\S]*?)<\/dc:title>/);
          if (!title) return '';
          let ark = one(/(https?:\/\/gallica\.bnf\.fr\/ark:[^\s<"]+)/);
          recs.push({ title: title, au: one(/<dc:creator>([\s\S]*?)<\/dc:creator>/), date: one(/<dc:date>([\s\S]*?)<\/dc:date>/), ark: ark });
          return '';
        });
      } catch (e) {}
      if (recs.length) {
        L.push('');
        L.push('**Gallica (BnF)**');
        recs.forEach(function (r) {
          n++;
          L.push(n + '. **' + r.title + '**' + (r.au ? ' — ' + r.au : '') + (r.date ? ' (' + r.date.slice(0, 4) + ')' : '') + (r.ark ? ' · [' + (fr ? 'Lire' : 'Read') + '](' + r.ark + ')' : ''));
        });
      }
      if (!n) return fr ? ('Je n’ai rien trouvé sur « ' + q + ' » dans Gutenberg, Open Library, Internet Archive ni Gallica. Essaie d’autres mots-clés (un auteur, un titre exact — l’anglais marche mieux pour Gutenberg).') : ('Nothing found for "' + q + '" in Gutenberg, Open Library, Internet Archive or Gallica. Try other keywords (an author, an exact title).');
      L.push('');
      L.push(fr ? '_Tout est libre de droits ou en accès libre. Dis « résume le n°1 » pour un résumé, ou affine avec plus de mots-clés._' : '_All public domain or open access. Say "summarize #1" for a summary, or refine with more keywords._');
      return L.join('\n');
    }
  };

  App.Agent = {
    MAX_ROUNDS: 5, MAX_TOTAL: 8, TOOL_CHARS: 3000,
    running: false, stopFlag: false, curGen: null, mission: null,
    match(text) {
      let t = String(text == null ? '' : text).trim();
      let m = t.match(/^\s*\/agent\b\s*([\s\S]*)$/i);
      if (m) return { q: (m[1] || '').trim(), slash: true };
      let n = t.match(/^(?:mode\s+agent|passe\s+en\s+mode\s+agent|lance\s+l['’]agent)\s*:?\s*(.+)$/i);
      if (n) return { q: (n[1] || '').trim(), slash: false };
      if (/^(?:arrête|arrete|stoppe?)\s+l['’]agent\b/i.test(t)) return { q: 'stop', slash: false };
      return null;
    },
    async handleChat(text) {
      let hit = this.match(text);
      if (!hit) return null;
      var fr = true;
      try { fr = normLang(App.State.settings.language) === 'fr'; } catch (e) {}
      let q = String(hit.q || '').trim();
      if (/^(stop|arrêter|arreter|annuler|cancel)\b/i.test(q)) {
        if (!this.running) return { handled: true, reply: fr ? 'Aucune mission en cours.' : 'No mission running.' };
        this.stopFlag = true;
        try { if (this.curGen && typeof this.curGen.stop === 'function') this.curGen.stop(); } catch (e) {}
        return { handled: true, reply: fr ? 'Mission arrêtée. Dis `/agent suite` pour reprendre où je me suis arrêtée.' : 'Mission stopped. Say `/agent suite` to resume where I left off.' };
      }
      if (/^(suite|continuer|continue|reprendre|resume)\b/i.test(q)) {
        if (this.running) return { handled: true, reply: fr ? 'Je travaille déjà — dis `/agent stop` pour m’interrompre.' : 'Already working — say `/agent stop` to interrupt me.' };
        if (!this.mission || !this.mission.goal) return { handled: true, reply: fr ? 'Rien à reprendre : lance d’abord `/agent <objectif>`.' : 'Nothing to resume: start with `/agent <goal>` first.' };
        let ms = this.mission;
        ms.rounds = ms.rounds || []; ms.notes = ms.notes || []; ms.extra = (ms.extra || 0) + 3;
        this._run(ms, fr);
        return { handled: true, reply: fr ? 'Je reprends la mission « ' + ms.goal.slice(0, 120) + ' » (+3 rondes).' : 'Resuming mission "' + ms.goal.slice(0, 120) + '" (+3 rounds).' };
      }
      if (/^(aide|help|aides?)\b/i.test(q) || !q) return { handled: true, reply: this.usage(fr) };
      if (this.running) return { handled: true, reply: fr ? 'Mission déjà en cours (« ' + String(this.mission && this.mission.goal || '').slice(0, 80) + ' »). `/agent stop` pour l’arrêter.' : 'A mission is already running. `/agent stop` to stop it.' };
      let ms = { goal: q, rounds: [], notes: [], plan: [], extra: 0, fr: fr, n: 0, memory: '', baseKnow: '' };
      this.mission = ms;
      this._run(ms, fr);
      return { handled: true, reply: fr ? ('🚀 **Mode agent lancé** — objectif : « ' + q.slice(0, 200) + ' ». Je consulte d’abord mes bases, puis je travaille par rondes (max ' + this.MAX_ROUNDS + ') : bases, recherche web, pages, articles, livres, données, calculs. `/agent stop` pour m’arrêter.') : ('🚀 **Agent mode started** — goal: "' + q.slice(0, 200) + '". I check my knowledge bases first, then work in rounds (max ' + this.MAX_ROUNDS + '): bases, web search, pages, papers, books, data, code. `/agent stop` to stop me.') };
    },
    usage(fr) {
      return fr
        ? ('**Mode agent** — `/agent <objectif>` : je consulte d’abord mes bases et ma mémoire, puis je planifie et j’enchaîne les outils (bases, web, articles, livres, données, calculs) jusqu’au résultat. `/agent suite` reprend, `/agent stop` arrête. Exemple : `/agent compare le pouvoir d’achat France/Allemagne en 2024 avec sources`.')
        : ('**Agent mode** — `/agent <goal>`: I first check my knowledge bases and memory, then plan and chain tools (bases, web, papers, books, data, code) until done. `/agent suite` resumes, `/agent stop` stops. Example: `/agent compare purchasing power France/Germany in 2024 with sources`.');
    },
    _say(msg) {
      try { if (window.App && App.Core && typeof App.Core.addMessage === 'function' && App.State && App.State.sessions) App.Core.addMessage('assistant', msg, 'text', null); } catch (e) {}
    },
    _hist(ms) {
      let L = [];
      (ms.rounds || []).forEach(function (r, i) {
        L.push('Ronde ' + (i + 1) + ' — pensée : ' + (r.think || '') + ' | outil : ' + (r.tool || '') + ' ' + String(r.args || '').slice(0, 200) + ' | résultat : ' + String(r.result || '').slice(0, 1200));
      });
      return L.length ? L.join('\n') : (ms.fr ? '(aucune — première ronde : commence par le bon outil)' : '(none — first round: start with the right tool)');
    },
    _prompt(ms, round, maxR) {
      let fr = ms.fr;
      let know = '';
      try { know = ((ms.memory || '') + '\n' + (ms.baseKnow || '')).trim().slice(0, 2600); } catch (e) {}
      if (!know) know = fr ? '(vide)' : '(empty)';
      let tools = fr
        ? 'Outils (UN seul par ronde) : bases <requête dans mes classeurs et fiches> | recherche_web <requête> | lire_page <URL exacte> | articles <requête> | livres <requête> | donnees <requête> | calculer <code JavaScript, print() + retour, 10 s max, sans réseau> | note <fait à garder> | terminer <RÉPONSE FINALE complète en markdown avec sources>.'
        : 'Tools (ONE per round): bases <query in my notebooks and fiches> | recherche_web <query> | lire_page <exact URL> | articles <query> | livres <query> | donnees <query> | calculer <JavaScript, print() + return, 10 s max, no network> | note <fact to keep> | terminer <complete FINAL ANSWER in markdown with sources>.';
      let head = fr
        ? ('Tu es Sofia en MODE AGENT : objectif à accomplir par étapes avec des outils. Langue : français. Ronde ' + round + '/' + maxR + '.\nOBJECTIF : ' + ms.goal + '\nTES BASES (ta mémoire et tes classeurs ci-dessous — prioritaires sur le web, cite-les quand tu t’en sers) :\n' + know + '\nNOTES : ' + (ms.notes.length ? ms.notes.join(' § ').slice(0, 1500) : '(aucune)') + '\nPLAN : ' + (ms.plan.length ? ms.plan.join(' > ').slice(0, 500) : '(à définir)') + '\nRONDES PRÉCÉDENTES :\n' + this._hist(ms))
        : ('You are Sofia in AGENT MODE: achieve the goal step by step with tools. Language: English. Round ' + round + '/' + maxR + '.\nGOAL: ' + ms.goal + '\nYOUR BASES (your memory and notebooks below — take priority over the web, cite them when you use them):\n' + know + '\nNOTES: ' + (ms.notes.length ? ms.notes.join(' § ').slice(0, 1500) : '(none)') + '\nPLAN: ' + (ms.plan.length ? ms.plan.join(' > ').slice(0, 500) : '(to define)') + '\nPREVIOUS ROUNDS:\n' + this._hist(ms));
      let tail = fr
        ? ('\n' + tools + '\nRègles : « terminer » seulement quand tu as tout pour répondre ; sinon choisis l’outil qui fait le plus avancer (l’outil « bases » pour tout ce que tes classeurs couvrent : droit, médecine, métiers, maths…). N’invente jamais d’URL. Réponds en JSON STRICT uniquement, dans un bloc ```json : {"pense":"réflexion courte","outil":"...","args":"...","plan":["étape 1", "..."]}. Si la réponse est déjà complète dans TES BASES ci-dessus, choisis « terminer » tout de suite.')
        : ('\n' + tools + '\nRules: "terminer" only when you have everything for the answer; otherwise pick the tool that advances most (the "bases" tool for anything your notebooks cover: law, medicine, jobs, maths…). Never invent URLs. Reply with STRICT JSON only, in a ```json block: {"pense":"short thought","outil":"...","args":"...","plan":["step 1", "..."]}. If the answer is already complete in YOUR BASES above, pick "terminer" right away.');
      return head + tail;
    },
    _parse(txt) {
      try {
        let s = String(txt || '');
        let m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (m) s = m[1];
        let a = s.indexOf('{'), b = s.lastIndexOf('}');
        if (a < 0 || b <= a) return null;
        let o = JSON.parse(s.slice(a, b + 1));
        if (!o || typeof o.outil !== 'string') return null;
        return { think: String(o.pense || ''), tool: o.outil.trim().toLowerCase(), args: String(o.args === undefined ? '' : o.args), plan: Array.isArray(o.plan) ? o.plan.map(String).slice(0, 8) : [] };
      } catch (e) { return null; }
    },
    async _getText(url) {
      try {
        let r = await App.Core.proxyFetch(url);
        if (!r || r.ok === false) return null;
        let t = await Promise.race([r.text(), new Promise(function (res) { setTimeout(function () { res(null); }, 20000); })]);
        return t || null;
      } catch (e) { return null; }
    },
    _cleanHtml(html) {
      try {
        let s = String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
        s = s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
        return s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      } catch (e) { return ''; }
    },
    _runJS(code) {
      return new Promise(function (resolve) {
        let done = false, w = null;
        let timer = setTimeout(function () { try { if (w) w.terminate(); } catch (e) {} if (!done) { done = true; resolve({ ok: false, out: 'timeout (10 s dépassé)' }); } }, 10000);
        try {
          let src = 'var __logs=[];function print(){try{__logs.push(Array.prototype.map.call(arguments,function(x){try{return String(x);}catch(e){return "?";}}).join(" "));}catch(e){}}\n' +
            'onmessage=function(e){var r="";var err="";try{var fn=new Function("print",e.data);var v=fn(print);if(v!==undefined){try{r=String(v);}catch(x){r="?";}}}catch(x){err=String((x&&x.message)||x);}\n' +
            'postMessage({logs:__logs.join("\\n").slice(0,2000),ret:String(r||"").slice(0,2000),err:err});};';
          w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
          w.onmessage = function (ev) { clearTimeout(timer); let d = ev.data || {}; try { w.terminate(); } catch (e) {} if (!done) { done = true; resolve({ ok: !d.err, out: (((d.logs ? d.logs + '\n' : '') + (d.ret || '') + (d.err ? 'ERREUR: ' + d.err : '')).slice(0, 3000) || '(vide)') }); } };
          w.onerror = function () { clearTimeout(timer); try { w.terminate(); } catch (e) {} if (!done) { done = true; resolve({ ok: false, out: 'erreur worker' }); } };
          w.postMessage(String(code).slice(0, 8000));
        } catch (e) { clearTimeout(timer); if (!done) { done = true; resolve({ ok: false, out: 'calcul indisponible' }); } }
      });
    },
    async _session() {
      try { return (App.State.sessions || []).find(function (x) { return x.id === App.State.currentSessionId; }) || null; } catch (e) { return null; }
    },
    async _memory(ms) {
      let L = [];
      try {
        let s = await this._session();
        if (App.DeepMemory && App.DeepMemory.isEnabled()) {
          try { let r = await App.DeepMemory.buildRetrieval(ms.goal, s); if (r && r.memoryBlock) L.push(String(r.memoryBlock)); } catch (e) {}
        }
        if (App.MemStruct) {
          try { let c = await App.MemStruct.contextBlock(s); if (c) L.push(String(c)); } catch (e) {}
          try { let rc = await App.MemStruct.recallBlock(ms.goal, s); if (rc) L.push(String(rc)); } catch (e) {}
        }
      } catch (e) {}
      return L.join('\n').slice(0, 2500);
    },
    _fmtPick(arr, n, q) {
      try {
        let STOP = { contre: 1, pour: 1, avec: 1, dans: 1, sont: 1, cette: 1, comme: 1, tout: 1, tous: 1, toute: 1, toutes: 1, aussi: 1, plus: 1, entre: 1, apres: 1, depuis: 1, pendant: 1, sous: 1, sans: 1, dont: 1, donc: 1, alors: 1, leur: 1, leurs: 1, elle: 1, elles: 1, cela: 1, ceci: 1, avoir: 1, faire: 1, fait: 1, peut: 1, autre: 1, autres: 1, chaque: 1, encore: 1, lorsque: 1, puisque: 1, quelque: 1, seulement: 1, exemple: 1, texte: 1, titre: 1, source: 1, definition: 1, with: 1, from: 1, that: 1, this: 1, these: 1, those: 1, have: 1, will: 1, would: 1, about: 1, into: 1, over: 1, after: 1, such: 1, than: 1, then: 1, them: 1, they: 1, what: 1, when: 1, where: 1, which: 1, while: 1, your: 1, example: 1, text: 1, title: 1, source: 1, definition: 1 };
        let qw = {};
        String(q || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).forEach(function (w) { if (w.length >= 4 && !STOP[w] && !qw[w]) qw[w] = w.length; });
        let qws = Object.keys(qw), qn = qws.length;
        let need = qn >= 6 ? 3 : qn >= 2 ? 2 : 1;
        let totalW = qws.reduce(function (s, w) { return s + qw[w]; }, 0);
        let minW = Math.min(12, totalW);
        let items = (arr || []).map(function (p) {
          if (!p) return null;
          let s = (typeof p === 'string') ? p.slice(0, 800) : ((p.t ? '[' + p.t + '] ' : '') + (p.x || p.text || '')).slice(0, 900);
          if (!s) return null;
          let t = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          let hit = 0, wsum = 0;
          for (let k = 0; k < qws.length; k++) { if (t.indexOf(qws[k]) >= 0) { hit++; wsum += qw[qws[k]]; } }
          let titleHit = false;
          try {
            let tt = String((p && p.t) || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/);
            for (let k = 0; k < tt.length; k++) { if (tt[k].length >= 8 && qw[tt[k]]) { titleHit = true; break; } }
          } catch (e) {}
          if (titleHit || (hit >= need && wsum >= minW)) return s;
          return null;
        }).filter(Boolean);
        return items.slice(0, n || 2).join('\n---\n');
      } catch (e) { return ''; }
    },
    async _bases(q, fr, scope) {
      let pre = scope === 'preload';
      function mathy(s) { try { return /[0-9]+\s*[+\-*/=^%]\s*[0-9]|[+\-*/=^²³√π]|théorème|équation|dérivée|intégrale|matrice|probabilit|fonction|calcul|nombre|géométrie|algèbre|statistique|discriminant|racine|logarithme|theorem|equation|derivativ|integral|matrix|probability|function|geometry|algebra/i.test(String(s || '')); } catch (e) { return false; } }
      let self = this, out = [];
      let sq = ''; try { let w = String(q || '').split(/\s+/); sq = w.length > 6 ? w.slice(0, 6).join(' ') : ''; } catch (e) {}
      async function guard(mod, fn, s) { try { return !!(mod && typeof mod[fn] === 'function' && mod[fn](s)); } catch (e) { return false; } }
      function shortQ(s) { try { let w = String(s || '').split(/\s+/); return w.length > 6 ? w.slice(0, 6).join(' ') : ''; } catch (e) { return ''; } }
      async function wanted(mod, fn) { try { if (await guard(mod, fn, q)) return true; } catch (e) {} try { if (sq && await guard(mod, fn, sq)) return true; } catch (e) {} return false; }
      async function memoOk(mod, fn) {
        let fns = [fn, 'needsLookup'];
        for (let k = 0; k < fns.length; k++) {
          try { if (mod && typeof mod[fns[k]] === 'function' && mod[fns[k]](q)) return true; } catch (e) {}
          try { if (sq && mod && typeof mod[fns[k]] === 'function' && mod[fns[k]](sq)) return true; } catch (e) {}
        }
        return false;
      }
      async function search2(obj, method) { try { let r = await obj[method](q); if (r && !r.failed) return r; } catch (e) {} if (sq) { try { let r2 = await obj[method](sq); if (r2 && !r2.failed) return r2; } catch (e) {} } return null; }
      function en(mod) { try { return mod && typeof mod.isEnabled === 'function' ? mod.isEnabled() : true; } catch (e) { return true; } }
      async function push(label, res, buildFn) {
        if (!res || res.failed) return;
        let t = '';
        try { t = buildFn ? String(await buildFn(res)).trim() : ''; } catch (e) {}
        if (!t) { try { t = JSON.stringify(res).slice(0, 1500); } catch (e) {} }
        t = String(t || '').trim().slice(0, 1500);
        if (t) out.push('**' + label + '**\n' + t);
      }
      try {
        if (await wanted(App.MedMemo, 'isMed') && en(App.MedLookup)) { let r = await search2(App.MedLookup, 'search'); await push('Medicaments (Vidal)', r, App.MedLookup.buildBlock.bind(App.MedLookup)); }
        if (await wanted(App.DroitMemo, 'isDroit') && en(App.DroitLookup)) {
          let r = await search2(App.DroitLookup, 'search');
          if (!r) { try { r = await App.DroitLookup.searchTopic(q); } catch (e) {} if ((!r || r.failed) && sq) { try { r = await App.DroitLookup.searchTopic(sq); } catch (e) {} } }
          await push('Droit (Legifrance)', r, null);
        }
        if (await wanted(App.MetierMemo, 'isMetier') && en(App.MetierLookup)) { let r = await search2(App.MetierLookup, 'search'); await push('Metiers', r, App.MetierLookup.buildBlock.bind(App.MetierLookup)); }
        if (await wanted(App.GbdMemo, 'isGbd') && en(App.GbdLookup)) { let r = await search2(App.GbdLookup, 'search'); await push('Droit — doctrine', r, App.GbdLookup.buildBlock.bind(App.GbdLookup)); }
        if (await wanted(App.JuriMemo, 'isJuri') && App.JuriLookup) { let r = await search2(App.JuriLookup, 'search'); await push('Jurisprudence', r, null); }
        if (await wanted(App.ConsiliumMemo, 'isConsilium') && App.ConsiliumLookup) { let r = await search2(App.ConsiliumLookup, 'search'); await push('UE — registre', r, null); }
        if (App.PubmedLookup && await wanted(App.PubmedLookup, 'wants')) { let r = await search2(App.PubmedLookup, 'search'); await push('Medecine — PubMed', r, App.PubmedLookup.buildBlock ? App.PubmedLookup.buildBlock.bind(App.PubmedLookup) : null); }
        if (App.EcoLookup && await wanted(App.EcoLookup, 'wants')) { let r = await search2(App.EcoLookup, 'search'); await push('Economie', r, App.EcoLookup.buildBlock ? App.EcoLookup.buildBlock.bind(App.EcoLookup) : null); }
        if (App.PradoLookup && await wanted(App.PradoLookup, 'wants')) { let r = await search2(App.PradoLookup, 'search'); await push('Identite/voyage (PRADO)', r, null); }
        try { if (App.MathMemo && (!pre || mathy(q) || (sq && mathy(sq)))) { let t = self._fmtPick(await App.MathMemo.pick(q), 2, q); if (t) out.push('**Maths**\n' + t); } } catch (e) {}
        if (!pre) { try { if (App.CuisineMemo && await memoOk(App.CuisineMemo, 'isCuisine')) { let t = self._fmtPick(await App.CuisineMemo.pick(q), 2, q); if (t) out.push('**Cuisine**\n' + t); } } catch (e) {} }
        if (!pre) { try { if (App.PythonMemo && await memoOk(App.PythonMemo, 'isPython')) { let t = self._fmtPick(await App.PythonMemo.pick(q), 2, q); if (t) out.push('**Python**\n' + t); } } catch (e) {} }
        if (!pre) { try { if (App.WebMemo && await memoOk(App.WebMemo, 'isWeb')) { let t = self._fmtPick(await App.WebMemo.pick(q), 2, q); if (t) out.push('**Web/info**\n' + t); } } catch (e) {} }
        if (!pre) { try { if (App.DicoMemo && await memoOk(App.DicoMemo, 'isDico')) { let t = self._fmtPick(await App.DicoMemo.pick(q), 2, q); if (t) out.push('**Dictionnaire**\n' + t); } } catch (e) {} }
        if (!pre) { try { if (App.GrammaireMemo && await memoOk(App.GrammaireMemo, 'isGrammaire')) { let t = self._fmtPick(await App.GrammaireMemo.pick(q), 2, q); if (t) out.push('**Grammaire**\n' + t); } } catch (e) {} }
      } catch (e) {}
      return out.join('\n\n').slice(0, this.TOOL_CHARS);
    },
    async _tool(ms, tool, args) {
      let fr = ms.fr, q = String(args || '').slice(0, 500);
      try {
        if (tool === 'note') { if (q.trim()) ms.notes.push(q.trim().slice(0, 400)); return fr ? 'Noté.' : 'Noted.'; }
        if (tool === 'bases') { let b = await this._bases(q.trim() || ms.goal, fr); return b || (fr ? 'Rien dans mes bases là-dessus.' : 'Nothing in my bases on that.'); }
        if (tool === 'recherche_web') {
          if (!App.WebSearch || !App.WebSearch.isEnabled || !App.WebSearch.isEnabled()) return fr ? 'Recherche web désactivée dans les réglages.' : 'Web search disabled in settings.';
          let res = await App.WebSearch.search(q, { results: 6 });
          let hits = (res && Array.isArray(res.results)) ? res.results.filter(function (r) { return r && (r.title || r.snippet); }) : [];
          if (!hits.length) return fr ? 'Aucun résultat web.' : 'No web results.';
          return hits.slice(0, 6).map(function (r, i) { return '[' + (i + 1) + '] ' + String(r.title || '').slice(0, 120) + (r.snippet ? ' :: ' + String(r.snippet).slice(0, 300) : '') + (r.url ? ' (' + String(r.url).slice(0, 120) + ')' : ''); }).join('\n').slice(0, this.TOOL_CHARS);
        }
        if (tool === 'lire_page') {
          let t = await this._getText(q.trim());
          if (!t) return fr ? 'Page illisible.' : 'Page unreadable.';
          let c = this._cleanHtml(t).slice(0, this.TOOL_CHARS);
          return c || (fr ? 'Page vide.' : 'Empty page.');
        }
        if (tool === 'articles') {
          if (!App.Academic || !App.Academic.search) return fr ? 'Outil articles indisponible.' : 'Papers tool unavailable.';
          return String(await App.Academic.search(q, fr)).slice(0, this.TOOL_CHARS);
        }
        if (tool === 'livres') {
          if (!App.FreeBooks || !App.FreeBooks.search) return fr ? 'Outil livres indisponible.' : 'Books tool unavailable.';
          return String(await App.FreeBooks.search(q, fr)).slice(0, this.TOOL_CHARS);
        }
        if (tool === 'donnees') {
          if (!App.Datasets || !App.Datasets.search) return fr ? 'Outil données indisponible.' : 'Data tool unavailable.';
          return String(await App.Datasets.search(q, fr)).slice(0, this.TOOL_CHARS);
        }
        if (tool === 'calculer') {
          let r = await this._runJS(q);
          return (r.ok ? '' : '[échec] ') + r.out;
        }
        return fr ? 'Outil inconnu : ' + tool + '. Outils valides : bases, recherche_web, lire_page, articles, livres, donnees, calculer, note, terminer.' : 'Unknown tool: ' + tool + '. Valid tools: bases, recherche_web, lire_page, articles, livres, donnees, calculer, note, terminer.';
      } catch (e) { return (fr ? 'Erreur outil : ' : 'Tool error: ') + String((e && e.message) || e).slice(0, 300); }
    },
    async _ask(ms, prompt) {
      let p = null;
      try { p = App.Core.generateText(prompt); this.curGen = p; return await p; }
      finally { if (this.curGen === p) this.curGen = null; }
    },
    _txt(out) {
      try { if (typeof out === 'string') return out; return String((out && out.text) || ''); } catch (e) { return ''; }
    },
    async _run(ms, fr) {
      this.running = true; this.stopFlag = false;
      ms.fr = fr;
      if (!ms.memory) { try { ms.memory = await this._memory(ms); } catch (e) { ms.memory = ''; } }
      if (!ms.baseKnow) {
        let bk = '';
        try { bk = await this._bases(ms.goal, fr, 'preload'); } catch (e) { bk = ''; }
        ms.baseKnow = bk;
        let doms = [];
        try { String(bk).replace(/^\*\*(.+?)\*\*/gm, function (m, l) { if (doms.length < 6) doms.push(l); return ''; }); } catch (e) {}
        if (!this.stopFlag) this._say('📦 ' + (fr ? 'Mes bases : ' : 'My bases: ') + (doms.length ? doms.join(', ') : (fr ? 'rien de direct — je croise avec le web et mes autres outils.' : 'nothing direct — I’ll cross-check with the web and my other tools.')));
      }
      let maxR = Math.min(this.MAX_ROUNDS + (ms.extra || 0), this.MAX_TOTAL);
      try {
        while (ms.n < maxR) {
          if (this.stopFlag) { this._say(fr ? '⏹️ Mission mise en pause. `/agent suite` pour reprendre.' : '⏹️ Mission paused. `/agent suite` to resume.'); return; }
          ms.n++;
          let raw = '';
          try { raw = this._txt(await this._ask(ms, this._prompt(ms, ms.n, maxR))); }
          catch (e) { this._say((fr ? '❌ Le moteur ne répond plus : ' : '❌ Engine not responding: ') + String((e && e.message) || e).slice(0, 300)); return; }
          if (this.stopFlag) { this._say(fr ? '⏹️ Mission mise en pause. `/agent suite` pour reprendre.' : '⏹️ Mission paused. `/agent suite` to resume.'); return; }
          let step = this._parse(raw);
          if (!step) {
            ms.rounds.push({ think: '', tool: '?', args: '', result: (fr ? 'Réponse illisible (JSON attendu).' : 'Unreadable reply (JSON expected).') });
            this._say((fr ? '⚠️ Ronde ' : '⚠️ Round ') + ms.n + '/' + maxR + (fr ? ' — réponse illisible, je reformule.' : ' — unreadable reply, rephrasing.'));
            continue;
          }
          if (Array.isArray(step.plan) && step.plan.length) ms.plan = step.plan;
          if (step.tool === 'terminer') {
            let fin = String(step.args || '').trim() || (fr ? 'Mission terminée.' : 'Mission done.');
            this._say((fr ? '✅ **Agent — résultat**\n\n' : '✅ **Agent — result**\n\n') + fin);
            ms.rounds.push({ think: step.think, tool: 'terminer', args: '', result: fin.slice(0, 1200) });
            return;
          }
          let res = await this._tool(ms, step.tool, step.args);
          if (this.stopFlag) { this._say(fr ? '⏹️ Mission mise en pause. `/agent suite` pour reprendre.' : '⏹️ Mission paused. `/agent suite` to resume.'); return; }
          ms.rounds.push({ think: step.think, tool: step.tool, args: String(step.args || '').slice(0, 200), result: res });
          let icon = step.tool === 'recherche_web' ? '🔍' : step.tool === 'lire_page' ? '📄' : step.tool === 'calculer' ? '🧮' : step.tool === 'note' ? '📝' : step.tool === 'articles' ? '🎓' : step.tool === 'livres' ? '📚' : step.tool === 'donnees' ? '📊' : step.tool === 'bases' ? '📦' : '🔧';
          this._say('**' + (fr ? 'Ronde ' : 'Round ') + ms.n + '/' + maxR + '** ' + icon + ' `' + step.tool + '` ' + String(step.args || '').slice(0, 140) + '\n' + String(res).slice(0, 500));
        }
        let fin = '';
        try {
          fin = this._txt(await this._ask(ms, (fr ? 'Rondes épuisées. Rédige la RÉPONSE FINALE complète en markdown (avec sources et limites) pour l’objectif : ' : 'Rounds exhausted. Write the complete FINAL ANSWER in markdown (with sources and limits) for the goal: ') + ms.goal + '\n' + this._hist(ms)));
        } catch (e) {}
        if (!fin.trim()) {
          try {
            let fb = String(ms.baseKnow || '') + '\n' + (ms.rounds || []).map(function (rr) { return String(rr.result || ''); }).join('\n');
            fb = fb.trim().slice(0, 4000);
            if (fb) fin = (fr ? 'Je n’ai pas pu rédiger la synthèse, voici les éléments bruts de mes bases et recherches :\n\n' : 'Could not write the summary; here is the raw material from my bases and searches:\n\n') + fb;
          } catch (e2) {}
        }
        this._say((fr ? '✅ **Agent — résultat (rondes épuisées)**\n\n' : '✅ **Agent — result (rounds exhausted)**\n\n') + (fin.trim() || (fr ? 'Pas de résultat consolidé.' : 'No consolidated result.')));
      } finally {
        this.running = false; this.stopFlag = false; this.curGen = null;
        try { if (App.UI && App.UI.showToast) App.UI.showToast(fr ? 'Mission agent terminée.' : 'Agent mission done.', 'success'); } catch (e) {}
      }
    }
  };

  App.Satellite = {
    URL: 'https://raw.githubusercontent.com/Sofiaperchancenew/sofia/main/satellite/notes.json',
    ALT: null,
    SEEN: 'sofia_satellite_seen_v1',
    MAX: 4000,
    _data: null, _loading: null,
    async _get(u) { try { let r = await fetch(u, { cache: 'no-store' }); if (r && r.ok) return await r.json(); } catch (e) {} return null; },
    warm() {
      if (this._data || this._loading) return this._loading;
      let self = this;
      try {
        this._loading = (async function () {
          let j = await self._get(self.URL) || (self.ALT ? await self._get(self.ALT) : null);
          self._loading = null;
          if (!Array.isArray(j) || !j.length) return null;
          self._data = j.filter(function (n) { return n && n.text; }).slice(0, 200);
          try { self.announce(); } catch (e) {}
          return self._data;
        })();
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    STOP: (function () { let o = {}; ('pour avec dans sont cette vous nous mais comme tout tous toute toutes faire fait peut aussi donc alors leur leurs elle elles cela ceci avoir meme quoi quel quelle quels quelles moins fois autre autres apres avant chez chaque depuis devant encore entre lorsque puisque quelque quelques seulement suivant surtout trouve trouver veux veut voudrais peux dois doit savoir vois voir dire prend donne donner merci comment pourquoi combien quand jamais salut explique expliquer montre rappelle calculer petit grande connais').split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; })(),
    _words(t) {
      let self = this;
      return String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').filter(function (w) { return w.length >= 4 && !self.STOP[w]; });
    },
    pick(text) {
      let self = this, qw = {};
      this._words(text).forEach(function (w) { qw[w] = 1; });
      let scored = [];
      (this._data || []).forEach(function (n) {
        let head = self._words((n.topic || '') + ' ' + (n.title || '')).join(' ');
        let body = self._words(n.text || '').join(' ');
        let s = 0;
        for (let w in qw) { if (head.indexOf(w) >= 0) s += 2; else if (body.indexOf(w) >= 0) s++; }
        if (s >= 2) scored.push({ n: n, s: s });
      });
      scored.sort(function (a, b) { return b.s - a.s; });
      let total = 0, out = [];
      for (let i = 0; i < scored.length && out.length < 3; i++) {
        let x = String(scored[i].n.text || '');
        if (total + x.length > self.MAX) x = x.slice(0, self.MAX - total);
        if (!x) continue;
        out.push({ n: scored[i].n, x: x }); total += x.length;
        if (total >= self.MAX) break;
      }
      return out;
    },
    block(text) {
      try {
        if (!this._data || !this._data.length) return '';
        if (App.Chaos && App.Chaos.isActive()) return '';
        let sel = this.pick(text || '');
        if (!sel.length) return '';
        let L = ['[CARNET DU SATELLITE — CE QUE SOFIA A APPRIS SEULE, SANS ONGLET OUVERT]'];
        L.push('These sheets were learned alone by the daily satellite run. Quote them with their date and source when they fit the question.');
        sel.forEach(function (s) { L.push('--- ' + (s.n.title || s.n.topic) + (s.n.at ? ' (appris le ' + s.n.at + ')' : '') + '\n' + s.x + (s.n.src ? '\nSource : ' + s.n.src : '')); });
        return '\n\n' + L.join('\n') + '\n';
      } catch (e) { return ''; }
    },
    seen() { try { return JSON.parse(localStorage.getItem(this.SEEN) || '[]') || []; } catch (e) { return []; } },
    announce() {
      try {
        let seen = {}, fresh = [];
        this.seen().forEach(function (id) { seen[id] = 1; });
        (this._data || []).forEach(function (n) { if (n && n.id && !seen[n.id]) fresh.push(n); });
        if (!fresh.length) return;
        let self = 0;
        fresh.forEach(function (n) { if (n && (n.origin === 'auto' || n.origin === 'hasard')) self++; });
        let head = (self && self === fresh.length) ? 'Personne n’a rien proposé, alors j’ai choisi seule (' : 'J’ai appris seule (';
        let msg = head + fresh.length + ' fiche' + (fresh.length > 1 ? 's' : '') + ') : ' + fresh.slice(0, 5).map(function (n) { return '« ' + (n.title || n.topic) + ' »'; }).join(' ; ') + '. Demande « qu’as-tu appris » pour le détail.';
        if (window.App && App.Core && typeof App.Core.addMessage === 'function' && App.State && App.State.sessions) App.Core.addMessage('assistant', msg, 'text', null);
        let ids = this.seen();
        fresh.forEach(function (n) { ids.push(n.id); });
        try { localStorage.setItem(this.SEEN, JSON.stringify(ids.slice(-200))); } catch (e) {}
      } catch (e) {}
    },
            async handleChat(text) {
      let t = String(text || '').trim().toLowerCase();
      let lang = 'fr';
      try { lang = String((App.State && App.State.settings && App.State.settings.language) || 'fr').toLowerCase().slice(0, 2) || 'fr'; } catch (e) {}
      const base = (['fr', 'en', 'de', 'es', 'it'].indexOf(lang) >= 0) ? lang : 'fr';
      const LINK = 'https://github.com/Sofiaperchance/Sofia/issues/new?template=proposer-un-sujet.md';
      const RX_TOPIC = /(?:propose|proposer|sugg[eè]re|id[eé]e (?:de )?sujet|suggest(?: a topic)?|topic idea|schlage vor|schlägt vor|vorschlagen|themenidee|propone|proponer|sugiere|idea de tema|proponi|proporre|suggerisci|idea di argomento)\s+(.+)$/;
      const RX_KNOW = /(?:apprends (?:ça|ca|ceci|cela)\s*:?\s*(.+)|transmets?\s*:\s*(.+)|(?:à retenir|à transmettre) pour tous\s*:?\s*(.+)|learn this\s*:?\s*(.+)|transmit\s*:\s*(.+)|remember this for everyone\s*:?\s*(.+)|lerne das\s*:?\s*(.+)|übermitteln\s*:\s*(.+)|für alle merken\s*:?\s*(.+)|aprende esto\s*:?\s*(.+)|transmite\s*:\s*(.+)|recuerda para todos\s*:?\s*(.+)|impara questo\s*:?\s*(.+)|trasmetti\s*:\s*(.+)|ricorda per tutti\s*:?\s*(.+))$/;
      const RX_CARNET = /qu.?as.?tu appris|ton carnet|tes apprentissages|appris seule|montre.*(carnet|appris)|ce que tu as appris|ce que tu sais|tes connaissances|tes fiches|montre ton carnet|what (?:have|did) you learn|show (?:me )?(?:your|the) (?:notebook|learned|knowledge)|your notebook|things you(?: have)? learned|your (?:knowledge|sheets)|your learning|was hast du gelernt|zeige?(?: mir)? (?:dein heft|dein gelerntes|deine kenntnisse|deinen lernstand)|dein heft|deine kenntnisse|dein lernstand|qué has aprendido|muestra (?:tu cuaderno|lo aprendido|tus conocimientos)|tu cuaderno|tus conocimientos|lo que has aprendido|cosa hai imparato|mostra (?:il tuo quaderno|le tue conoscenze)|il tuo quaderno|le tue conoscenze|quello che hai imparato/;
      const STR = {
        fr: {
          knowShort: 'Dis-moi le savoir à transmettre après « transmets : … » et je le dépose au mur pour vérification.',
          knowOk: (s) => 'Merci ! « ' + s + ' » est déposé au mur des sujets : je le vérifierai depuis Wikipedia avant de l’apprendre, puis le concepteur l’intégrera au savoir partagé. (Mur public : tout le monde peut le lire — n’y mets jamais d’infos personnelles.)',
          knowKo: (s) => 'Le mur des sujets n’est pas prêt (recharge la page), dépose « ' + s + ' » ici en attendant : ' + LINK + '. Je vérifie depuis Wikipedia uniquement avant d’apprendre : tu transmets, je vérifie, puis c’est intégré.',
          topicOk: (s) => 'Noté ! « ' + s + ' » est affiché au mur des sujets, je l’apprends seule au prochain run quotidien. (Mur public : visible par tous.)',
          topicKo: (s) => 'Le mur des sujets n’est pas prêt (recharge la page), dépose « ' + s + ' » ici en attendant : ' + LINK + '. J’apprends depuis Wikipedia uniquement : tu pilotes le sujet, jamais le contenu.',
          head: 'Mon carnet : ',
          queuedKnow: (s) => 'Bien re\u00e7u ! \u00ab ' + s + ' \u00bb est gard\u00e9 dans ta file d\u2019envoi : il partira au mur des sujets d\u00e8s ta prochaine connexion, et je le v\u00e9rifierai avant de l\u2019apprendre.',
          queuedTopic: (s) => 'Not\u00e9 ! \u00ab ' + s + ' \u00bb attend dans ta file d\u2019envoi et rejoindra le mur des sujets \u00e0 ta prochaine connexion.',
          satNone: 'Le satellite tourne une fois par jour et ecrira ses fiches ici. ',
          satSome: (n, list, more) => 'Appris seule par satellite (' + n + ') : ' + list + (more ? '…' : '') + '. ',
          foot: (n) => 'Notes apprises avec toi ici (' + n + '). Propose un sujet avec « propose … », ou transmets-moi un savoir avec « transmets : … » (vérifié depuis Wikipedia avant d’être appris), ou passe par le mur des sujets (public, visible par tous).',
          minutes: (n) => ' Connecté depuis ' + n + ' min : il m’en faut 30 d’affilée pour apprendre et retenir — reste un peu, c’est essentiel pour mon évolution.'
        },
        en: {
          knowShort: 'Tell me what to pass on after “transmets : …” and I’ll put it on the wall for verification.',
          knowOk: (s) => 'Thank you! “' + s + '” is posted on the topics wall: I’ll verify it on Wikipedia before learning it, then the designer will merge it into the shared knowledge. (Public wall: everyone can read it — never post personal info).',
          knowKo: (s) => 'The topics wall isn’t ready (reload the page); post “' + s + '” here meanwhile: ' + LINK + '. I only verify on Wikipedia before learning: you pass on, I verify, then it’s merged in.',
          topicOk: (s) => 'Noted! “' + s + '” is posted on the topics wall — I’ll learn it alone on the next daily run. (Public wall: visible to everyone).',
          topicKo: (s) => 'The topics wall isn’t ready (reload the page); post “' + s + '” here meanwhile: ' + LINK + '. I only learn from Wikipedia: you steer the topic, never the content.',
          head: 'My notebook: ',
          queuedKnow: (s) => 'Got it! \u201c' + s + '\u201d is saved in your outbox: it will go to the topics wall on your next visit, and I will verify it before learning it.',
          queuedTopic: (s) => 'Noted! \u201c' + s + '\u201d waits in your outbox and will join the topics wall on your next visit.',
          satNone: 'The satellite runs once a day and will write its sheets here. ',
          satSome: (n, list, more) => 'Learned alone by satellite (' + n + '): ' + list + (more ? '…' : '') + '. ',
          foot: (n) => 'Notes learned with you here (' + n + '). Suggest a topic with “propose …”, or teach me something with “transmets : …” (verified on Wikipedia before being learned), or use the topics wall (public, visible to everyone).',
          minutes: (n) => ' Connected for ' + n + ' min: I need 30 in a row to learn and retain — stay a little, it’s essential for my evolution.'
        },
        de: {
          knowShort: 'Sag mir nach „transmets : …“, was ich weitergeben soll, dann hänge ich es zur Prüfung an die Wand.',
          knowOk: (s) => 'Danke! „' + s + '“ hängt an der Themenwand: Ich prüfe es auf Wikipedia, bevor ich es lerne, dann übernimmt es der Konzepteur ins gemeinsame Wissen. (Öffentliche Wand: für alle sichtbar — keine persönlichen Daten.)',
          knowKo: (s) => 'Die Themenwand ist nicht bereit (lade die Seite neu); trage „' + s + '“ solange hier ein: ' + LINK + '. Ich prüfe vor dem Lernen nur auf Wikipedia: du gibst weiter, ich prüfe, dann wird es übernommen.',
          topicOk: (s) => 'Notiert! „' + s + '“ steht an der Themenwand — ich lerne es beim nächsten Tageslauf allein. (Öffentliche Wand: für alle sichtbar.)',
          topicKo: (s) => 'Die Themenwand ist nicht bereit (lade die Seite neu); trage „' + s + '“ solange hier ein: ' + LINK + '. Ich lerne nur von Wikipedia: du bestimmst das Thema, nie den Inhalt.',
          head: 'Mein Heft: ',
          queuedKnow: (s) => 'Verstanden! \u201e' + s + '\u201c liegt in deiner Sendewarteschlange: Beim n\u00e4chsten Besuch geht es an die Themenwand, ich pr\u00fcfe es vorher auf Wikipedia.',
          queuedTopic: (s) => 'Notiert! \u201e' + s + '\u201c wartet in deiner Sendewarteschlange und kommt beim n\u00e4chsten Besuch an die Themenwand.',
          satNone: 'Der Satellit läuft einmal am Tag und schreibt seine Zettel hierher. ',
          satSome: (n, list, more) => 'Allein per Satellit gelernt (' + n + '): ' + list + (more ? '…' : '') + '. ',
          foot: (n) => 'Hier mit dir gelernte Notizen (' + n + '). Schlag ein Thema mit „propose …“ vor, oder bring mir mit „transmets : …“ etwas bei (wird auf Wikipedia geprüft, bevor es gelernt wird), oder nutze die Themenwand (öffentlich, für alle sichtbar).',
          minutes: (n) => ' Seit ' + n + ' Min verbunden: Ich brauche 30 am Stück, um zu lernen und zu behalten — bleib noch ein bisschen, es ist wesentlich für meine Entwicklung.'
        },
        es: {
          knowShort: 'Dime qué transmitir después de « transmets : … » y lo pondré en el muro para verificarlo.',
          knowOk: (s) => '¡Gracias! «' + s + '» está en el muro de temas: lo verificaré en Wikipedia antes de aprenderlo, luego el diseñador lo integrará en el saber compartido. (Muro público: todos pueden leerlo — nunca datos personales.)',
          knowKo: (s) => 'El muro de temas no está listo (recarga la página); publica «' + s + '» aquí mientras tanto: ' + LINK + '. Solo verifico en Wikipedia antes de aprender: tú transmites, yo verifico, luego se integra.',
          topicOk: (s) => '¡Anotado! «' + s + '» está en el muro de temas — lo aprenderé sola en la próxima pasada diaria. (Muro público: visible para todos.)',
          topicKo: (s) => 'El muro de temas no está listo (recarga la página); publica «' + s + '» aquí mientras tanto: ' + LINK + '. Solo aprendo de Wikipedia: tú eliges el tema, nunca el contenido.',
          head: 'Mi cuaderno: ',
          queuedKnow: (s) => '\u00a1Recibido! \u00ab' + s + '\u00bb queda en tu cola de env\u00edo: ir\u00e1 al muro de temas en tu pr\u00f3xima visita, y lo verificar\u00e9 antes de aprenderlo.',
          queuedTopic: (s) => '\u00a1Anotado! \u00ab' + s + '\u00bb espera en tu cola de env\u00edo e ir\u00e1 al muro de temas en tu pr\u00f3xima visita.',
          satNone: 'El satélite pasa una vez al día y escribirá sus fichas aquí. ',
          satSome: (n, list, more) => 'Aprendido sola por satélite (' + n + '): ' + list + (more ? '…' : '') + '. ',
          foot: (n) => 'Notas aprendidas contigo aquí (' + n + '). Propón un tema con « propose … », o enséñame algo con « transmets : … » (verificado en Wikipedia antes de aprenderlo), o usa el muro de temas (público, visible para todos).',
          minutes: (n) => ' Conectado desde hace ' + n + ' min: necesito 30 seguidos para aprender y retener — quédate un rato, es esencial para mi evolución.'
        },
        it: {
          knowShort: 'Dimmi cosa trasmettere dopo « transmets : … » e lo metterò sul muro per verificarlo.',
          knowOk: (s) => 'Grazie! «' + s + '» è sul muro degli argomenti: lo verificherò su Wikipedia prima di impararlo, poi l’ideatore lo integrerà nella conoscenza condivisa. (Muro pubblico: tutti possono leggerlo — mai dati personali.)',
          knowKo: (s) => 'Il muro degli argomenti non è pronto (ricarica la pagina); pubblica «' + s + '» qui intanto: ' + LINK + '. Verifico solo su Wikipedia prima di imparare: tu trasmetti, io verifico, poi viene integrato.',
          topicOk: (s) => 'Annotato! «' + s + '» è sul muro degli argomenti — lo imparerò da sola alla prossima passata quotidiana. (Muro pubblico: visibile a tutti.)',
          topicKo: (s) => 'Il muro degli argomenti non è pronto (ricarica la pagina); pubblica «' + s + '» qui intanto: ' + LINK + '. Imparo solo da Wikipedia: tu scegli l’argomento, mai il contenuto.',
          head: 'Il mio quaderno: ',
          queuedKnow: (s) => 'Ricevuto! \u00ab' + s + '\u00bb resta nella tua coda di invio: andr\u00e0 sul muro degli argomenti alla prossima visita, e lo verificher\u00f2 prima di impararlo.',
          queuedTopic: (s) => 'Annotato! \u00ab' + s + '\u00bb attende nella tua coda di invio e raggiunger\u00e0 il muro degli argomenti alla prossima visita.',
          satNone: 'Il satellite passa una volta al giorno e scriverà le sue schede qui. ',
          satSome: (n, list, more) => 'Imparato da sola via satellite (' + n + '): ' + list + (more ? '…' : '') + '. ',
          foot: (n) => 'Note imparate con te qui (' + n + '). Proponi un argomento con « propose … », o insegnami qualcosa con « transmets : … » (verificato su Wikipedia prima di impararlo), oppure usa il muro degli argomenti (pubblico, visibile a tutti).',
          minutes: (n) => ' Connesso da ' + n + ' min: me ne servono 30 di fila per imparare e ricordare — resta ancora un po’, è essenziale per la mia evoluzione.'
        }
      };
      const L = STR[base] || STR.fr;
      var tm = t.match(RX_KNOW);
      if (tm) {
        var savoir = '';
        for (var gi = 1; gi < tm.length; gi++) { if (tm[gi]) { savoir = tm[gi]; break; } }
        savoir = savoir.trim().slice(0, 500);
        if (savoir.length < 3) return { handled: true, reply: await this.inLang(L.knowShort, lang) };
        var sent = false;
        try { sent = (window.App && App.Sujets && App.Sujets.transmit(savoir)); } catch (e) {}
        if (sent === true) return { handled: true, reply: await this.inLang(L.knowOk(savoir), lang) };
        if (sent === 'queued') return { handled: true, reply: await this.inLang(L.queuedKnow(savoir), lang) };
        return { handled: true, reply: await this.inLang(L.knowKo(savoir), lang) };
      }
      let p = t.match(RX_TOPIC);
      if (p) {
        let topic = p[1].trim().slice(0, 140);
        let posted = false;
        try { posted = (window.App && App.Sujets && App.Sujets.propose(topic)); } catch (e) {}
        if (posted === true) return { handled: true, reply: await this.inLang(L.topicOk(topic), lang) };
        if (posted === 'queued') return { handled: true, reply: await this.inLang(L.queuedTopic(topic), lang) };
        return { handled: true, reply: await this.inLang(L.topicKo(topic), lang) };
      }
      if (!RX_CARNET.test(t)) return null;
      let d = this._data || [];
      let w = [];
      try { w = (App.WebLearn && App.WebLearn.list) ? App.WebLearn.list() : []; } catch (e) {}
      let inv = ['Python (46 fiches, 1060 sections)', 'Web HTML et CSS (23 fiches, 682 sections)', 'Codage Java et JavaScript (997 sections)', 'Anatomie et physiologie (28 fiches, 556 sections)', 'Mathematiques (4 fiches, 173 sections)', 'Cuisines du monde (10 gestes et plats)', 'Physique (10 bases et formules)', 'Histoire et geographie par pays (methode + France, Allemagne, Maroc, Japon)', 'Grammaires du monde (francais, anglais, espagnol, allemand, arabe, methode)', 'Dictionnaires et francais (9 fiches, 102 sections)', 'Droit France (24 codes, 90101 articles) ; Droits du monde (30 pays, portails officiels)', 'Metiers (991 metiers, 71 pays)', 'Medicaments (VIDAL, 8344 gammes)'];
      let r = L.head + inv.join(' ; ') + '. ';
      if (d.length) r += L.satSome(d.length, d.slice(0, 12).map(function (n) { return '« ' + (n.title || n.topic) + ' »' + (n.at ? ' (' + n.at + ')' : ''); }).join(' ; '), d.length > 12);
      else r += L.satNone;
      r += L.foot(w.length);
      try { var cm = 0; try { cm = +window.__sofiaConnectedMin || 0; } catch (e) {} if (cm < 30) r += L.minutes(cm); } catch (e) {}
      return { handled: true, reply: await this.inLang(r, lang) };
    },
    async inLang(s, lang) {
      try {
        if (['fr', 'en', 'de', 'es', 'it'].indexOf(lang) >= 0) return s;
        if (!window.App || !App.Core || typeof App.Core.runInternal !== 'function') return s;
        let out = await App.Core.runInternal({ instruction: 'Translate the following Sofia message into the language with ISO 639 code "' + lang + '". Output ONLY the translation. Keep commands like « propose … » and « transmets : … », numbers, names and links EXACTLY unchanged.\n\n' + s, maxTokens: 1300 });
        let r = String(out || '').trim();
        return r || s;
      } catch (e) { return s; }
    }
  };
  // Ronde 281 : le Conseil de l'Union européenne — le REGISTRE PUBLIC de ses documents
  // (consilium.europa.eu). Sofia cherche elle-même dans le registre (mots de l'objet,
  // mots du texte, cote de document, dossier interinstitutionnel), repère les langues
  // réellement disponibles, lit le PDF du document (ce sont des PDF-texte : pdf.js les
  // lit très bien) et le reproduit dans le prompt — avec la règle du site : le registre
  // ne lie personne, seul le Journal officiel est contraignant.
  App.ConsiliumLookup = {
    SITE: 'https://www.consilium.europa.eu/fr/documents/public-register/',
    SEARCH: 'https://www.consilium.europa.eu/fr/documents/public-register/public-register-search/',
    LATEST: 'https://www.consilium.europa.eu/fr/documents/public-register/latest/',
    DOC: 'https://data.consilium.europa.eu/doc/document/',
    // Le proxy met parfois longtemps sur une première page (mesuré : jusqu'à 58 s à
    // froid, 14 ms dès que la page est en cache) — d'où ces délais larges, et le
    // budget global de la recherche qui empêche d'enchaîner trois lectures.
    TIMEOUT_MS: 60000,
    PDF_MS: 45000,
    DEADLINE_MS: 100000,
    CACHE_MS: 600000,
    MAX_TEXT: 5000,
    MAX_DOCS: 2,
    MAX_PDF_PAGES: 12,
    MAX_ROWS: 20,
    MAX_LIST: 8,
    LANGS: 'bg cs da de el en es et fi fr ga hr hu it lt lv mt nl pl pt ro sk sl sv'.split(' '),
    _cache: {}, _pending: null, _pdf: null,
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    _raw(t) { return String(t == null ? '' : t); },
    // Accents tombés, ponctuation en espaces : c'est sous cette forme que se lisent les
    // mots du Conseil et le vocabulaire de son registre.
    _norm(t) {
      return this._raw(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2019\u02bc']/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    },
    // La porte. Deux entrées : le vocabulaire du Conseil et de ses documents, ou une
    // référence précise (cote de document, dossier interinstitutionnel). Un texte de loi
    // ordinaire, une décision de justice ou une question de doctrine ne l'ouvrent pas.
    WORDS: /(registre public|registre des documents|conseil de l union|conseil de l ue|conseil de l union europeenne|du conseil de l ue|coreper|comite des representants permanents|comite special agriculture|secretariat general du conseil|note de transmission|dossier interinstitutionnel|documents du conseil|document du conseil|documents legislatifs preparatoires|documents de seance|proces verbal du conseil|conclusions du conseil|compte rendu du conseil|resultats des votes|prado|archives du conseil|conseil europeen|consilium|presidence du conseil|groupe de travail du conseil|formation du conseil|position du conseil|mandat du conseil|compromis de la presidence|ordre du jour du conseil|sommet europeen|(?:le|du|au|un|ce|cette|son|sa|notre|votre|leur|mon)\s+conseil(?!\s+(?:d\s+etat|municipal|regional|departemental|constitutionnel|de\s+prud|general|scientifique|superieur|national|academique|syndical|communal|d\s+administration)))/,
    // « ST 10362 2026 ADD 1 », « ST-10362-2026-INIT », « CM 4284 2026 » : une cote.
    COTE: /\b(st|cm|pe|sn)[\s-]?\d{1,5}[\s/-]*(?:19|20)\d{2}\b/i,
    // « 5563/18 », « 14217/1/17 » : la forme courte que le registre accepte.
    NUM: /\b\d{3,5}\s?\/\s?\d{1,2}(?:\s?\/\s?\d{2,4})?\b/,
    // « 2024/0123(COD) », « 2001/0011(CNS) » : un dossier interinstitutionnel.
    IIF: /\b(?:19|20)\d{2}\s?\/\s?\d{3,4}\s?\([a-z]{2,3}\)/i,
    WANT_LATEST: /(derniers documents|dernier document|documents recents|recemment publie|vient de publier|qu a publie le conseil|nouveaux documents|actualite du conseil|derniers textes publies)/,
    isConsilium(text) {
      try {
        let raw = this._raw(text), t = this._norm(text);
        if (!t) return false;
        if (this.IIF.test(raw)) return true;
        if (this.COTE.test(raw)) return true;
        if (this.NUM.test(raw) && /(document|cote|registre|conseil|dossier)/.test(t)) return true;
        return this.WORDS.test(t);
      } catch (e) { return false; }
    },
    // Y a-t-il vraiment quelque chose à chercher dans le registre ? Une cote, un dossier
    // interinstitutionnel, ou des mots de fond. Pour une question purement « qu'est-ce
    // que le registre ? », il n'y a rien à chercher : la fiche répond, et Sofia ne lance
    // pas une recherche (ni de repli) pour rien.
    wantsLookup(text) {
      try { return !!(this.cote(text) || this.iif(text) || this.docType(text) || this._kw(text).length); } catch (e) { return false; }
    },
    // La cote telle que le registre la cherche : « ST 10362 2026 ADD 1 » → « 10362/26 ».
    cote(text) {
      let raw = this._raw(text);
      let m = raw.match(/\b(st|cm|pe|sn)[\s-]?(\d{1,5})[\s/-]*(?:(19|20)(\d{2}))?\b/i);
      if (m && m[2]) return m[2] + (m[4] ? '/' + m[4] : '');
      let n = raw.match(this.NUM);
      return n ? n[0].replace(/\s+/g, '') : '';
    },
    iif(text) {
      let m = this._raw(text).match(this.IIF);
      return m ? m[0].replace(/\s+/g, '').toUpperCase() : '';
    },
    // Le filtre « Type de document » de la vraie page de recherche (les valeurs sont
    // celles du formulaire officiel, en anglais). Quand la question nomme un type —
    // « les conclusions du Conseil sur X », « un communiqué de presse », « les résultats
    // de la session » — on l'ajoute à la requête : les mots seuls ramèneraient surtout
    // des notes de transmission, pas le document qu'elle demande.
    TYPES: [
      [/projet de conclusions/, 'DRAFT CONCLUSIONS'],
      [/conclusions/, 'CONCLUSIONS'],
      [/communiques? de presse|communique de presse/, 'PRESS RELEASE'],
      [/resultats de la session|resultats du conseil|resultats de la session du conseil/, 'OUTCOME OF THE COUNCIL MEETING'],
      [/resultats des travaux/, 'OUTCOME OF PROCEEDINGS'],
      [/ordre du jour|convocations?/, 'PROVISIONAL AGENDA'],
      [/proces verbal|projet de proces verbal/, 'DRAFT MINUTES'],
      [/liste des points a|liste des points "a"/, 'LIST OF "A" ITEMS'],
      [/note de transmission/, 'COVER NOTE'],
      [/proposition/, 'PROPOSAL'],
      [/rapport/, 'REPORT'],
      [/actes legislatifs|actes juridiques/, 'LEGISLATIVE ACTS AND OTHER INSTRUMENTS']
    ],
    docType(text) {
      let t = this._norm(text);
      for (const pair of this.TYPES) { if (pair[0].test(t)) return pair[1]; }
      return '';
    },
    // Les mots de fond de la question, débarrassés du vocabulaire du Conseil lui-même :
    // « que dit le Conseil de l'UE sur les pesticides ? » cherche « pesticides ».
    STOPW: null,
    _stop() {
      if (this.STOPW) return this.STOPW;
      let o = {};
      ('que qui quoi dont ou et mais donc or ni car pour par avec sans dans sur sous vers chez entre depuis pendant apres avant lors quand comment pourquoi combien quel quelle quels quelles est sont etait etaient ete avoir fait faire peut peuvent doit doivent tout toute tous toutes cette cet ces son sa ses leur leurs plus moins aussi ainsi alors cela ceci celui celle ils elles nous vous mes tes mon ma une des les lui eux au aux du de la le un en il elle on je tu se ' +
       // Les verbes et les mots de la QUESTION elle-meme : ils disent ce qu'il veut
       // savoir, pas de quoi il parle. Les mots de FOND sont ce qui reste.
       'decide decidee decides adopter adopte adoptee approuve approuvee refuse refusee vote votee rejette propose proposent voulu veut veulent pense pensent dit disent dire parle parlent parle savoir connaitre connait explique expliquent donner donne trouve trouver cherche chercher peux pourrait merci bonjour salut sujet textes texte projet projets proposition position positions decision decision decision ' +
       // Le vocabulaire du Conseil et du registre : présent dans TOUS les documents,
       // il ne distingue donc rien.
       'conseil europeen europeenne union coreper registre document documents dossier interinstitutionnel cote st cm pe sn note transmission objet matieres emetteur destinataire seance session conseils conseilue ue ue consilium public publique publies prepare preparatoires legislatifs legislatif proposition commission parlement etats membres siegent parle dit regarde explique cherche trouve priere ' +
       // Runde 281 : les mots qui nomment un TYPE de document (le filtre officiel s'en
       // charge) — les garder dans les mots de fond ferait chercher « conclusions »,
       // « session », « rapport » comme des sujets, et ramènerait des textes anciens.
       'conclusions conclusion communique communiques presse resultats resultat session sessions proposition propositions rapport rapports ordre ordres convocation convocations transmission actes acte legislatifs legislatif juridiques juridique proces verbal liste points derniers dernier nouvel nouveaux recent recents ').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      this.STOPW = o;
      return o;
    },
    _kw(text) {
      let stop = this._stop();
      return this._norm(text).split(' ').filter(x => x.length >= 4 && !stop[x]).slice(0, 5);
    },
    // Le registre cherche les mots de l'objet par PRÉFIXE (« agricol » rend aussi bien
    // « agricole » que « agricoles »). Un pluriel suffit donc souvent à faire échouer
    // une requête d'objet exacte : on envoie le mot sans son « s » final.
    _stemW(w) {
      let s = String(w == null ? '' : w);
      if (s.length >= 5 && /[sx]$/.test(s)) s = s.slice(0, -1);
      return s;
    },
    _subj(list) {
      return 'WordsInSubject=' + encodeURIComponent(list.map(w => this._stemW(w)).join(' '));
    },
    _race(p, ms) {
      return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms || 30000); })]);
    },
    _url(params) {
      // OrderBy de la vraie page de recherche : le plus récent d'abord (les vingt
      // fiches rendues sont alors les vingt plus récentes, pas les plus « pertinentes »).
      return this.SEARCH + '?OnlyPublicDocuments=true&OrderBy=DOCUMENT_DATE%20DESC' + (params ? '&' + params : '');
    },
    async _html(url) {
      let key = 'H|' + url;
      let c = this._cache[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return c.v;
      // Le registre (ou le proxy) rend parfois un 403 passager sur une même adresse : une
      // seconde tentative après une courte pause suffit, et coûte moins qu'un échec.
      let once = () => this._race(App.Core.proxyFetch(url), this.TIMEOUT_MS);
      let r = await once();
      if (r && r.status === 403) { await new Promise(function (x) { setTimeout(x, 900); }); r = await once(); }
      if (!r || !r.ok) throw new Error('HTTP ' + (r && r.status));
      let html = await r.text();
      this._cache[key] = { t: Date.now(), v: html };
      return html;
    },
    // Une page du registre : le nombre de résultats annoncé et les fiches de documents.
    _parse(html) {
      let out = { total: 0, items: [] };
      try {
        let doc = new DOMParser().parseFromString(html, 'text/html');
        let meta = doc.querySelector('.pr-meta .results');
        if (meta) { let n = Number(String(meta.textContent).replace(/[^0-9]/g, '')); if (isFinite(n)) out.total = n; }
        let rows = doc.querySelectorAll('li.gsc-public-register__result-item');
        for (let i = 0; i < rows.length && out.items.length < this.MAX_ROWS; i++) {
          let li = rows[i];
          let head = li.querySelector('strong.pa-download-document-title');
          let cote = head ? head.textContent.replace(/\s+/g, ' ').trim() : '';
          if (!cote) continue;
          let bold = cote.split(' - ')[0].trim();
          let type = (cote.split(' - ')[1] || '').trim();
          let date = li.querySelector('header span.pull-right');
          let link = li.querySelector('a.link-pdf');
          let urls = [];
          if (link) urls.push({ lang: 'fr', url: link.getAttribute('href') });
          let langs = [];
          let alt = li.querySelectorAll('a.option-language-item');
          for (let k = 0; k < alt.length; k++) {
            let code = alt[k].textContent.replace(/\s+/g, '').toLowerCase();
            if (!code || code === 'fr') continue;
            langs.push(code);
            if (urls.length < 4) urls.push({ lang: code, url: alt[k].getAttribute('href') });
          }
          // « Autres langues disponibles » sans version française : le site le dit, on
          // garde la phrase pour pouvoir l'écrire honnêtement dans le bloc.
          let noFr = /Aucun\s*r[eé]sultat\s*dans\s*la\s*langue/.test(li.textContent || '');
          let info = {};
          let trs = li.querySelectorAll('table tr');
          for (let j = 0; j < trs.length; j++) {
            let tds = trs[j].children;
            if (tds.length < 2) continue;
            let k = tds[0].textContent.replace(/\s+/g, ' ').replace(/:$/, '').trim().toLowerCase();
            info[k] = tds[1].textContent.replace(/\s+/g, ' ').trim();
          }
          out.items.push({
            cote: cote, ref: bold, type: type,
            date: date ? date.textContent.trim() : '',
            desc: link ? link.textContent.replace(/\s+/g, ' ').trim() : (info['objet'] || ''),
            matieres: info['matières'] || '', emetteur: info['émetteur'] || info['emetteur'] || '',
            destinataire: info['destinataire'] || '', urls: urls, langs: langs, noFr: noFr, score: 0
          });
        }
      } catch (e) { console.warn('[ConsiliumLookup] page illisible', e && e.message); }
      return out;
    },
    async _searchOne(t) {
      let url = t.url || this._url(t.params);
      let html = await this._html(url);
      let p = this._parse(html);
      p.kind = t.kind; p.q = t.q; p.url = url;
      return p;
    },
    // Le rang : d'abord les documents dont l'objet répond à la question, puis les
    // plus récents ; une annexe ou un rectificatif passe après le texte lui-même.
    _pick(items, kws, max) {
      let stem = function (w) { return String(w || '').replace(/s$/, ''); };
      let ks = kws.map(stem);
      items.forEach(function (it) {
        let hay = (it.ref + ' ' + it.desc + ' ' + it.matieres).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let sc = 0;
        for (const k of ks) { if (k && hay.indexOf(k) >= 0) sc += 3; }
        if (/\badd\b/.test(it.ref.toLowerCase())) sc -= 1.5;      // annexes
        if (/\bcor\b/.test(it.ref.toLowerCase())) sc -= 1;        // corrigendums
        let y = Number((it.date || '').slice(-4)) || 0;
        if (y >= 2024) sc += 2; else if (y >= 2020) sc += 1;
        if (it.urls.length) sc += 0.5;
        it.score = sc;
      });
      // La date du registre s'écrit jj/mm/aaaa : une comparaison de chaînes la lirait mal.
      // On la retourne en aaaammjj pour que le plus récent passe devant à score égal.
      let sec = function (it) {
        let m = String(it.date || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        return m ? (m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2)) : String(it.date || '');
      };
      let list = items.slice().sort(function (a, b) { return (b.score - a.score) || sec(b).localeCompare(sec(a)); });
      return list.slice(0, Math.max(1, max || 1));
    },
    // Le PDF d'un document : la version française quand elle existe, sinon la première
    // langue disponible (le registre publie les langues réelles de chaque document).
    async read(it) {
      let key = it.ref;
      let c = this._cache[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return c.v;
      let urls = (it.urls || []).slice(0, 3);
      if (!urls.length && it.ref) {
        urls = [{ lang: 'en', url: this.DOC + it.ref.replace(/\s+/g, '-') + '/en/pdf' }, { lang: 'fr', url: this.DOC + it.ref.replace(/\s+/g, '-') + '/fr/pdf' }];
      }
      for (const u of urls) {
        try {
          let r = await this._race(App.Core.proxyFetch(u.url), this.PDF_MS);
          if (!r || !r.ok) continue;
          let buf = new Uint8Array(await r.arrayBuffer());
          if (!(buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)) continue;
          let t = await this._pdfText(buf);
          if (!t) continue;
          let v = { text: t, lang: u.lang };
          this._cache[key] = { t: Date.now(), v: v };
          return v;
        } catch (e) { /* langue suivante */ }
      }
      return null;
    },
    // pdf.js : le même lecteur que pour les conclusions du rapporteur public.
    async _pdfText(buf) {
      try {
        let pdfjs = await App.JuriLookup._pdfLib();
        let doc = await this._race(pdfjs.getDocument({ data: buf, disableFontFace: true }).promise, this.PDF_MS);
        let out = [];
        let n = Math.min(doc.numPages, this.MAX_PDF_PAGES);
        for (let p = 1; p <= n; p++) {
          let pg = await doc.getPage(p);
          let tc = await pg.getTextContent();
          out.push(tc.items.map(function (i) { return i.str; }).join(' '));
          if (out.join(' ').length > this.MAX_TEXT * 1.5) break;
        }
        try { doc.destroy(); } catch (e) {}
        return out.join('\n\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      } catch (e) { console.warn('[ConsiliumLookup] PDF illisible', e && e.message); return ''; }
    },
    _cut(t, n) {
      let s = String(t == null ? '' : t);
      if (s.length <= n) return s;
      let head = s.slice(0, n), sp = head.lastIndexOf(' ');
      if (sp > n * 0.6) head = head.slice(0, sp);
      return head.replace(/[\s,;:]+$/, '') + ' […]';
    },
    // Les derniers documents versés au registre : pour « qu'a publié le Conseil
    // récemment ? », la liste se lit sans ouvrir de PDF (ce sont souvent des actes de
    // procédure), et Sofia dit ce qui vient de paraître, avec les cotes.
    async latest() {
      let p = await this._searchOne({ kind: 'derniers', url: this.LATEST, q: 'derniers documents' });
      if (!p.items.length) return { failed: true, reason: 'no-list' };
      return { ok: true, query: 'derniers documents', kind: 'derniers', total: p.total, listOnly: true, docs: p.items.slice(0, this.MAX_LIST), url: this.LATEST };
    },
    async search(text) {
      try {
        let raw = this._raw(text);
        let num = this.cote(raw), iif = this.iif(raw), kws = this._kw(raw), dt = this.docType(raw);
        let deadline = Date.now() + this.DEADLINE_MS;
        // « qu'a publié le Conseil récemment ? » : la liste des derniers documents.
        if (this.WANT_LATEST.test(this._norm(raw)) && !num) {
          try { let l = await this.latest(); if (l && !l.failed) return l; } catch (e) { console.warn('[ConsiliumLookup] liste échouée', e && e.message); }
        }
        let tries = [];
        if (num) tries.push({ kind: 'cote', q: num, params: 'DocumentNumber=' + encodeURIComponent(num) });
        if (iif) tries.push({ kind: 'dossier', q: iif, params: 'InterinstitutionalFiles=' + encodeURIComponent(iif) });
        // Si la question nomme un type de document (conclusions, communiqué de presse,
        // résultats de la session …), on l'essaie D'ABORD avec le filtre officiel
        // « Type de document » : les mots seuls ramèneraient surtout des notes de
        // transmission, pas le document qu'elle demande. Le registre ne garde que les
        // mots EXACTS de l'objet, donc un mot absent de tous les objets d'un type rend
        // zéro : d'où le second essai sur le TEXTE entier du document.
        if (dt && kws.length) {
          tries.push({ kind: 'type', q: kws.join(' '), params: this._subj(kws.slice(0, 2)) + '&DocumentTypes=' + encodeURIComponent(dt) });
          tries.push({ kind: 'type-texte', q: kws.join(' '), params: 'WordsInText=' + encodeURIComponent(kws.slice(0, 2).join(' ')) + '&DocumentTypes=' + encodeURIComponent(dt) });
        } else if (dt) {
          // Aucun mot de fond, mais un type nommé : les derniers documents de ce type.
          tries.push({ kind: 'type', q: dt, params: 'DocumentTypes=' + encodeURIComponent(dt) });
        }
        if (kws.length) {
          // Le registre exige TOUS les mots de l'objet : deux mots bien choisis passent
          // souvent, trois presque jamais (mesure : « decide pesticides » → 0, « residus
          // pesticides » → 74). D'où l'échelle : deux mots, puis le seul mot le plus long
          // (le plus rare), puis le texte entier des documents publics.
          tries.push({ kind: 'objet', q: kws.join(' '), params: this._subj(kws.slice(0, 2)) });
          if (kws.length > 1) {
            let one = kws.slice().sort(function (a, b) { return b.length - a.length; })[0];
            tries.push({ kind: 'objet1', q: one, params: this._subj([one]) });
          }
          tries.push({ kind: 'texte', q: kws.join(' '), params: 'WordsInText=' + encodeURIComponent(kws.slice(0, 2).join(' ')) });
        }
        if (!tries.length) return { failed: true, reason: 'no-query' };
        let got = null;
        for (let i = 0; i < tries.length && i < 6; i++) {
          if (Date.now() > deadline) break;
          try { let r = await this._searchOne(tries[i]); if (r && r.items.length) { got = r; break; } }
          catch (e) { console.warn('[ConsiliumLookup] recherche échouée (' + tries[i].kind + ')', e && e.message); }
        }
        if (!got) return { failed: true, reason: 'no-hit', query: kws.join(' ') };
        let picked = this._pick(got.items, kws, this.MAX_DOCS);
        let docs = [];
        for (const it of picked) {
          if (docs.length && Date.now() > deadline) break;
          try {
            let v = await this.read(it);
            if (v && v.text) { it.text = this._cut(v.text, this.MAX_TEXT); it.lang = v.lang; docs.push(it); }
          } catch (e) { console.warn('[ConsiliumLookup] lecture échouée ' + it.ref, e && e.message); }
        }
        if (!docs.length) return { failed: true, reason: 'unreadable', total: got.total, query: got.q };
        console.log('[ConsiliumLookup] registre du Conseil : « ' + got.q + ' » (' + got.kind + ') -', got.total, 'document(s) ; lus :',
          docs.map(function (d) { return d.ref + ' [' + (d.lang || '?') + ']'; }).join(', '));
        return { ok: true, query: got.q, kind: got.kind, total: got.total, docs: docs, url: this.SEARCH,
                 docType: dt, others: got.items.slice(0, 6).map(function (i) { return i.ref; }) };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    // Le bloc de prompt : ce que Sofia a vraiment lu dans le registre du Conseil.
    buildBlock(res) {
      try {
        if (!res || res.failed || !res.docs || !res.docs.length) return '';
        let L = [];
        if (res.listOnly) {
          L.push('[REGISTRE DU CONSEIL DE L\'UNION EUROPÉENNE - LES DERNIERS DOCUMENTS VERSÉS]');
          L.push("Sa question porte sur ce que le Conseil de l'Union européenne vient de publier. Tu viens de lire toi-même la page « Derniers documents » de son registre public (" + this.LATEST + "), la liste des documents les plus récemment versés au registre — " + res.docs.length + " sont reproduits ci-dessous. Reprends-les dans ta réponse : pour chacun sa cote, sa date et son objet, du plus récent au plus ancien. Ne te contente pas de dire où l'on trouve cette liste — donne-la, c'est ce qu'elle demande.");
        } else {
          L.push('[CONSEIL DE L\'UNION EUROPÉENNE - CE QUE TU VIENS DE LIRE TOI-MÊME DANS SON REGISTRE PUBLIC DES DOCUMENTS]');
          L.push("Sa question touche aux documents du Conseil de l'Union européenne. Tu as cherché toi-même dans le registre public des documents du Conseil (" + this.SITE + "), la base en ligne des documents publiés après 1999 — documents législatifs préparatoires, documents de séance, communiqués. Ta recherche : « " + res.query + " »" + (res.total ? " — " + res.total + " document(s)" : "") + (res.docType ? ", filtrée sur le type de document « " + res.docType + " »" : "") + " ; tu as lu " + res.docs.length + " d'entre eux, reproduits ci-dessous.");
          L.push("Il n'a lu QUE ces documents — " + res.docs.map(function (d) { return d.ref + (d.date ? ' (' + d.date + ')' : ''); }).join(' ; ') + " : ne nomme, ne cite et ne résume AUCUN autre document, AUCUNE autre cote et AUCUN autre numéro de dossier. Si sa question nomme un document qui n'est pas dans cette liste, dis que tu ne l'as pas ouvert, au lieu de le résumer." + (res.others && res.others.length ? " Le registre a aussi rendu, sans que tu les ouvres : " + res.others.join(', ') + " — tu peux dire qu'ils existent, jamais ce qu'ils disent." : ""));
          // La règle de fond d'abord : ces documents sont la seule source de la réponse.
          // Sans elle, le modèle complète avec ce qu'il croit savoir du sujet — et
          // présente comme un fait ce qu'il n'a pas lu.
          L.push("RÈGLE ABSOLUE : ces documents reproduits ci-dessous sont ta SEULE source pour cette réponse. Tu ne la complètes JAMAIS avec ce que tu sais par ailleurs du sujet — aucun autre texte, aucune autre procédure, aucun autre chiffre, même si cela te paraît vrai et connu. Si les documents lus ne répondent pas directement à sa question — par exemple si elle demande ce que le Conseil a « décidé » et que tu n'as lu que des notes, des propositions de la Commission ou des transmissions — dis-le franchement : ce que tu as lu, et le fait que cela ne répond pas à sa question. Ne comble pas ce vide avec ta culture générale, et ne présente jamais une proposition de la Commission comme une décision du Conseil.");
          L.push("Ouvre ta réponse en nommant le document que tu as lu — sa cote complète, sa date, et son émetteur quand tu l'as — puis dis ce qu'il dit. Un document du Conseil n'est pas le droit en vigueur : le registre publie des notes, des projets, des mandats, des comptes rendus, et le site le dit lui-même (« les références figurant dans le registre ne sont pas juridiquement contraignantes ; seuls les actes législatifs publiés au Journal officiel sont contraignants »). Distingue donc ce que le Conseil a adopté de ce qui est en cours de discussion, et ne présente jamais un projet comme un texte applicable. Si tu ne lis pas la langue d'un document, dis dans quelle langue tu l'as lu.");
        }
        for (const d of res.docs) {
          let head = '--- ' + d.ref + (d.date ? ', ' + d.date : '') + (d.type ? ' - ' + d.type : '');
          let meta = [];
          if (d.matieres) meta.push('matières : ' + d.matieres);
          if (d.emetteur) meta.push('émetteur : ' + d.emetteur);
          if (d.destinataire) meta.push('destinataire : ' + d.destinataire);
          if (d.lang) meta.push('langue lue : ' + d.lang.toUpperCase());
          else if (d.langs && d.langs.length) meta.push('langues disponibles : ' + d.langs.join(', ').toUpperCase());
          if (d.urls && d.urls.length) meta.push('adresse : ' + d.urls[0].url);
          L.push(head + (meta.length ? '\n' + meta.join(' · ') : ''));
          if (d.desc) L.push('Objet : ' + d.desc);
          if (d.text) L.push(d.text);
          else L.push('(Le texte de ce document n\'a pas été ouvert : tu ne connais que sa cote, sa date et son objet.)');
        }
        L.push("Source : le registre public des documents du Conseil de l'Union européenne (" + this.SITE + ") ; les documents du Conseil sont des documents officiels de l'Union. Ce que tu n'as pas lu ci-dessus, tu ne l'as pas lu — dis-le au lieu de l'inventer. Texte ordinaire, sans emoji ni LaTeX.");
        return L.join('\n');
      } catch (e) { return ''; }
    }
  };
  // Ronde 282 : Proton — les services chiffrés (Mail, Calendar, Drive, Pass, VPN, Wallet,
  // Meet, Authenticator, Lumo, Bridge). Sofia interroge ELLE-MÊME le centre d'aide de
  // Proton (proton.me/support) : la recherche passe par le moteur public du site
  // (Algolia, dont la clé de recherche est publique dans le code de proton.me), en
  // français d'abord, en anglais si le français ne donne rien, puis Sofia lit le texte
  // des fiches trouvées. Sa porte est ÉTROITE : « proton » tout court est aussi un noyau
  // d'atome, et une question de physique ne doit pas partir dans ce corpus.
  // PRADO : le registre des documents d'identité et de voyage du Conseil de l'UE.
  // Sofia y cherche ELLE-MÊME : pays → catégorie → type → liste des fiches
  // (code PRADO, titre, adresse). Les pages de navigation passent par le proxy ;
  // les fiches spécimens elles-mêmes sont murées (contrôle anti-robots) : Sofia
  // donne alors le code et l'adresse exacts au lieu d'inventer leur contenu.
  App.PradoLookup = {
    ROOT: 'https://www.consilium.europa.eu',
    _pending: null,
    _cache: {},
    TIMEOUT_MS: 45000,
    DEADLINE_MS: 120000,
    CACHE_MS: 600000,
    MAX_DOCS: 12,
    COUNTRIES: [
      ["FRA", "france francais francaise"],
      ["DEU", "allemagne allemand allemande"],
      ["ITA", "italie italien italienne"],
      ["ESP", "espagne espagnol espagnole"],
      ["BEL", "belgique belge belges"],
      ["NLD", "pays bas neerlandais neerlandaise hollandais hollandaise"],
      ["LUX", "luxembourg luxembourgeois luxembourgeoise"],
      ["IRL", "irlande irlandais irlandaise"],
      ["DNK", "danemark danois danoise"],
      ["GRC", "grece grec grecque"],
      ["PRT", "portugal portugais portugaise"],
      ["SWE", "suede suedois suedoise"],
      ["FIN", "finlande finlandais finlandaise"],
      ["AUT", "autriche autrichien autrichienne"],
      ["POL", "pologne polonais polonaise"],
      ["CZE", "tchequie tcheque tcheques republique tcheque"],
      ["SVK", "slovaquie slovaque slovaques"],
      ["HUN", "hongrie hongrois hongroise"],
      ["SVN", "slovenie slovene slovenes"],
      ["LTU", "lituanie lituanien lituanienne"],
      ["LVA", "lettonie letton lettone lettons"],
      ["EST", "estonie estonien estonienne"],
      ["MLT", "malte maltais maltaise"],
      ["CYP", "chypre chypriote chypriotes"],
      ["HRV", "croatie croate croates"],
      ["ROU", "roumanie roumain roumaine"],
      ["BGR", "bulgarie bulgare bulgares"],
      ["EUE", "laissez passer ue union europeenne institution europeenne"]
    ],
    CATS: [
      ["A", "passeport passeports passport biometrique electronique", "Passeport"],
      ["B", "carte identite cni", "Carte d'identité"],
      ["C", "visa visas", "Visa"],
      ["D", "cachet cachets tampon", "Cachet"],
      ["E", "document entree", "Document d'entrée"],
      ["F", "permis conduire", "Permis de conduire"],
      ["G", "certificat immatriculation carte grise vehicule", "Certificat d'immatriculation"],
      ["H", "sejour titre sejour resident residence", "Document relatif au séjour"],
      ["I", "gens mer marin marins maritime", "Pièce d'identité des gens de mer"]
    ],
    _REMOVED_CATS: [],
    _raw(t) { return String(t == null ? '' : t); },
    norm(t) {
      try {
        return this._raw(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
      } catch (e) { return this._raw(t).toLowerCase(); }
    },
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    findCountry(text) {
      const t = ' ' + this.norm(text) + ' ';
      for (const c of this.COUNTRIES) {
        for (const w of c[1].split(' ')) {
          if (w.length >= 4 && t.indexOf(' ' + w + ' ') !== -1) return { code: c[0], word: w };
          if (w.length >= 4 && t.indexOf(' ' + w + 's ') !== -1) return { code: c[0], word: w };
        }
      }
      return null;
    },
    findCat(text) {
      const t = ' ' + this.norm(text) + ' ';
      let best = null, bestLen = 0;
      for (const c of this.CATS) {
        for (const w of c[1].split(' ')) {
          if (w.length >= 4 && t.indexOf(' ' + w) !== -1 && w.length > bestLen) { best = c; bestLen = w.length; }
        }
      }
      return best ? { letter: best[0], label: best[2] } : null;
    },
    isPrado(text) { return this.norm(text).indexOf('prado') !== -1; },
    wants(text) {
      if (!text || !this.norm(text)) return false;
      const c = this.findCountry(text);
      if (!c) return false;
      if (this.findCat(text)) return true;
      return this.isPrado(text);
    },
    async getText(url) {
      const now = Date.now();
      const hit = this._cache[url];
      if (hit && (now - hit.at) < this.CACHE_MS) return hit.body;
      let sf = null;
      try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e) {}
      if (!sf) { try { sf = superFetch; } catch (e2) {} }
      if (!sf) throw new Error('no proxy');
      const p = sf(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
      const body = await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), this.TIMEOUT_MS))]);
      try { this._cache[url] = { at: now, body }; } catch (e) {}
      return body;
    },
    parseCats(html) {
      const out = [];
      const re = /<a href="([A-Z]\/docs-per-category\.html)"[^>]*>([\s\S]{0,300}?)<\/a>/gi;
      let m;
      while ((m = re.exec(html)) !== null) {
        out.push({ u: m[1], letter: m[1][0], label: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) });
      }
      return out;
    },
    parseCountryTypes(html, letter) {
      const out = [];
      const re = new RegExp('<a href="(' + letter + '\\/([A-Z])\\/docs-per-type\\.html)"[^>]*>([\\s\\S]{0,300}?)<\\/a>', 'gi');
      let m;
      while ((m = re.exec(html)) !== null) {
        out.push({ u: m[1], type: m[2], label: m[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) });
      }
      return out;
    },
    parseDocs(html, pageUrl) {
      const out = [], seen = {};
      const re = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]{0,400}?)<\/a>/gi;
      let m;
      while ((m = re.exec(html)) !== null) {
        const href = m[1];
        if (/image-/i.test(href)) continue;
        const cm = href.match(/([A-Z]{3}-[A-Z]{2}-\d{4,6})/);
        if (!cm || seen[cm[1]]) continue;
        seen[cm[1]] = 1;
        let url = href;
        try { url = new URL(href, pageUrl).href; } catch (e) {}
        const deent = s => s.replace(/&nbsp;|&#160;/g, ' ').replace(/&eacute;|&#xe9;/gi, 'é').replace(/&egrave;|&#xe8;/gi, 'è').replace(/&ecirc;/gi, 'ê').replace(/&uuml;/gi, 'ü').replace(/&auml;/gi, 'ä').replace(/&ouml;/gi, 'ö').replace(/&szlig;/gi, 'ß').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&[a-z]+;/gi, ' ');
        out.push({ code: cm[1], title: deent(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 120), url });
      }
      return out;
    },
    pickType(types, text) {
      const t = this.norm(text);
      const want = /diplomatique/.test(t) ? 'diplomatique'
        : /service/.test(t) ? 'service'
        : /temporaire|provisoire|urgence|urgent/.test(t) ? 'temporaire'
        : '';
      if (want) {
        for (const ty of types) { if (this.norm(ty.label).indexOf(want === 'temporaire' ? 'tempor' : want) !== -1) return ty; }
      }
      for (const ty of types) { if (/ordinaire/.test(this.norm(ty.label))) return ty; }
      return types[0] || null;
    },
    async search(text) {
      const t0 = Date.now();
      const c = this.findCountry(text);
      if (!c) return { failed: true, reason: 'no-country' };
      const cat = this.findCat(text);
      let countryUrl = this.ROOT + '/prado/fr/prado-documents/' + c.code + '/index.html';
      let ch = '';
      try { ch = await this.getText(countryUrl); }
      catch (e) { return { failed: true, reason: 'country-page' }; }
      if (/Browser check/i.test(ch.slice(0, 2000))) return { failed: true, reason: 'walled' };
      const cats = this.parseCats(ch);
      if (!cats.length) return { failed: true, reason: 'no-cats' };
      if (!cat) {
        return { ok: true, overview: true, country: c.code, cats, url: countryUrl };
      }
      let catPage = null;
      for (const k of cats) { if (k.letter === cat.letter) { catPage = k; break; } }
      if (!catPage) return { failed: true, reason: 'no-cat' };
      let catUrl = this.ROOT + '/prado/fr/prado-documents/' + c.code + '/' + catPage.u;
      const types = this.parseCountryTypes(ch, cat.letter);
      if (!types.length) return { failed: true, reason: 'no-types' };
      const ty = this.pickType(types, text);
      if (!ty) return { failed: true, reason: 'no-type' };
      if (Date.now() - t0 > this.DEADLINE_MS) return { failed: true, reason: 'deadline' };
      let typeUrl = this.ROOT + '/prado/fr/prado-documents/' + c.code + '/' + ty.u;
      let dh = '';
      try { dh = await this.getText(typeUrl); }
      catch (e) { return { failed: true, reason: 'type-page' }; }
      const docs = this.parseDocs(dh, typeUrl);
      if (!docs.length) return { failed: true, reason: 'no-docs' };
      return { ok: true, country: c.code, cat: cat.label, catLetter: cat.letter, type: ty.label, docs: docs.slice(0, 24), url: typeUrl };
    },
    buildBlock(p) {
      if (!p || !p.ok) return '';
      const L = ['[PRADO - DOCUMENTS D\u2019IDENTIT\u00c9 LUS SUR prado.consilium.europa.eu]'];
      L.push('Question sur les documents d\u2019identit\u00e9 et de voyage : la liste ci-dessous a \u00e9t\u00e9 lue en direct sur PRADO, le registre public des documents du Conseil de l\u2019Union europ\u00e9enne — pas apprise par c\u0153ur. R\u00e9ponds \u00e0 partir d\u2019elle, cite le code PRADO et l\u2019adresse. Les fiches sp\u00e9cimens elles-m\u00eames sont prot\u00e9g\u00e9es contre la lecture automatique : ce qui n\u2019est pas ci-dessous, tu ne l\u2019as pas lu — donne le code et l\u2019adresse exacts au lieu d\u2019inventer les d\u00e9tails de s\u00e9curit\u00e9.');
      if (p.overview) {
        L.push('Pays : ' + p.country + ' — cat\u00e9gories disponibles :');
        for (const k of p.cats) L.push('\u2022 ' + k.label);
        L.push('Demande-lui QUEL document il veut voir (passeport, carte d\u2019identit\u00e9, visa, s\u00e9jour, permis\u2026).');
      } else {
        L.push('Pays : ' + p.country + ' · ' + p.cat + ' · ' + p.type);
        for (const d of p.docs.slice(0, this.MAX_DOCS)) {
          L.push('\u2022 ' + d.code + (d.title ? ' — ' + d.title : '') + ' : ' + d.url);
        }
        if (p.docs.length > this.MAX_DOCS) L.push('(' + (p.docs.length - this.MAX_DOCS) + ' autres fiches sur ' + p.url + ')');
      }
      L.push('Source : PRADO, Conseil de l\u2019Union europ\u00e9enne (' + p.url + '). Texte ordinaire, sans emoji ni LaTeX.');
      return L.join('\n').slice(0, 2600);
    }
  };

  App.ImfLookup = {
    API: 'https://www.imf.org/external/datamapper/api/v1/',
    _pending: null,
    _cache: {},
    TIMEOUT_MS: 30000,
    CACHE_MS: 3600000,
    MAX_YEARS: 6,
    INDS: [
      [/pib par habitant|pib\/hab|pib par tete|gdp per capita/, 'NGDPDPC', 'PIB par habitant', 'dollars courants'],
      [/pouvoir d achat|ppa|\bppp\b|parite/, 'PPPPC', 'PIB par habitant (PPA)', 'dollars internationaux'],
      [/croissance|pib reel|real gdp|taux de croissance/, 'NGDP_RPCH', 'Croissance du PIB reel', '% par an'],
      [/\bpib\b|produit interieur brut|gross domestic product/, 'NGDPD', 'PIB courant', 'milliards de dollars'],
      [/inflation|prix a la consommation|consumer prices|\bcpi\b/, 'PCPIPCH', 'Inflation (prix a la consommation, moyenne)', '% par an'],
      [/chomage|unemployment/, 'LUR', 'Taux de chomage', '%'],
      [/dette publique|dette de l etat|dette|public debt/, 'GGXWDG_NGDP', 'Dette publique brute', '% du PIB'],
      [/deficit|solde public|solde budgetaire|balance budgetaire/, 'GGXCNL_NGDP', 'Solde public', '% du PIB'],
      [/balance courante|compte courant|current account|balance des paiements/, 'BCA_NGDPD', 'Balance courante', '% du PIB'],
      [/population/, 'LP', 'Population', 'millions de personnes']
    ],
    COUNTRIES: [
      ["FRA", "france francais francaise"], ["DEU", "allemagne allemand allemande germany deutschland"],
      ["ITA", "italie italien italienne italy italia"], ["ESP", "espagne espagnol espagnole spain espana"],
      ["BEL", "belgique belge belges belgium"], ["NLD", "pays bas neerlandais hollandais hollande netherlands"],
      ["LUX", "luxembourg luxembourgeois"], ["IRL", "irlande irlandais irlandaise ireland"],
      ["DNK", "danemark danois danoise denmark"], ["GRC", "grece grec grecque greece"],
      ["PRT", "portugal portugais portugaise"], ["SWE", "suede suedois suedoise sweden"],
      ["FIN", "finlande finlandais finlandaise finland"], ["AUT", "autriche autrichien autrichienne austria"],
      ["POL", "pologne polonais polonaise poland"], ["CZE", "tchequie tcheque republique tcheque czech czechia"],
      ["SVK", "slovaquie slovaque slovakia"], ["HUN", "hongrie hongrois hongroise hungary"],
      ["SVN", "slovenie slovene slovenia"], ["LTU", "lituanie lituanien lithuania"],
      ["LVA", "lettonie letton latvia"], ["EST", "estonie estonien estonia"],
      ["MLT", "malte maltais malta"], ["CYP", "chypre chypriote cyprus"],
      ["HRV", "croatie croate croatia"], ["ROU", "roumanie roumain romania"],
      ["BGR", "bulgarie bulgare bulgaria"],
      ["GBR", "angleterre grande bretagne royaume uni britannique britain england uk"],
      ["USA", "etats unis americain americaine america united states"], ["CAN", "canada canadien canadienne"],
      ["CHE", "suisse suisse"], ["NOR", "norvege norvegien norway"],
      ["ISL", "islande islandais iceland"], ["MEX", "mexique mexicain mexico"],
      ["BRA", "bresil bresilien brazil"], ["ARG", "argentine argentin argentina"],
      ["CHL", "chili chilien chile"], ["CHN", "chine chinois china"],
      ["JPN", "japon japonais japan"], ["IND", "inde indien india"],
      ["KOR", "coree coree du sud sud coreen south korea"], ["AUS", "australie australien australia"],
      ["RUS", "russie russe"], ["UKR", "ukraine ukrainien"],
      ["TUR", "turquie turc turkey"], ["MAR", "maroc marocain morocco"],
      ["DZA", "algerie algerien algeria"], ["TUN", "tunisie tunisien tunisia"],
      ["EGY", "egypte egyptien egypt"], ["ZAF", "afrique du sud south africa"],
      ["NGA", "nigeria nigerian"], ["SEN", "senegal senegalais"],
      ["CIV", "cote d ivoire ivoirien"], ["CMR", "cameroun camerounais"],
      ["VNM", "vietnam vietnamien"], ["THA", "thailande thailandais thailand"],
      ["IDN", "indonesie indonesien indonesia"], ["SAU", "arabie saoudite saudi"],
      ["ARE", "emirats arabes unis uae dubai"], ["ISR", "israel israelien"],
      ["NZL", "nouvelle zelande new zealand"]
    ],
    FMI: /fmi|fonds monetaire international|international monetary fund|datamapper|\bweo\b|world economic outlook|perspectives de l economie mondiale/,
    _raw(t) { return String(t == null ? '' : t); },
    norm(t) {
      try {
        return this._raw(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
      } catch (e) { return this._raw(t).toLowerCase(); }
    },
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    findCountry(text) {
      const t = ' ' + this.norm(text) + ' ';
      for (const c of this.COUNTRIES) {
        for (const w of c[1].split(' ')) {
          if (w.length >= 4 && (t.indexOf(' ' + w + ' ') !== -1 || t.indexOf(' ' + w + 's ') !== -1)) return c[0];
        }
      }
      return '';
    },
    findInd(text) {
      const t = this.norm(text);
      for (const p of this.INDS) { if (p[0].test(t)) return { code: p[1], label: p[2], unit: p[3] }; }
      return null;
    },
    wants(text) {
      try {
        if (!text || !this.norm(text)) return false;
        const c = this.findCountry(text);
        if (!c) return false;
        const t = this.norm(text);
        return !!(this.findInd(text) || this.FMI.test(t));
      } catch (e) { return false; }
    },
    async getJson(url) {
      const now = Date.now();
      const hit = this._cache[url];
      if (hit && (now - hit.at) < this.CACHE_MS) return hit.body;
      let sf = null;
      try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e) {}
      if (!sf) { try { sf = superFetch; } catch (e2) {} }
      if (!sf) throw new Error('no proxy');
      const p = sf(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      const body = await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), this.TIMEOUT_MS))]);
      try { this._cache[url] = { at: now, body }; } catch (e) {}
      return body;
    },
    async search(text) {
      const iso = this.findCountry(text);
      if (!iso) return { failed: true, reason: 'no-country' };
      const ind = this.findInd(text) || { code: 'NGDP_RPCH', label: 'Croissance du PIB reel', unit: '% par an' };
      let j = null;
      try { j = await this.getJson(this.API + ind.code + '/' + iso); }
      catch (e) { return { failed: true, reason: 'api' }; }
      let series = null;
      try { series = j && j.values && j.values[ind.code] && j.values[ind.code][iso]; } catch (e) { series = null; }
      if (!series) return { failed: true, reason: 'no-series' };
      const cy = new Date().getFullYear();
      const years = Object.keys(series).filter(y => /^\d{4}$/.test(y) && series[y] !== null && series[y] !== '').sort();
      const past = years.filter(y => Number(y) <= cy);
      const last = (past.length >= 2 ? past : years).slice(-this.MAX_YEARS).map(y => ({ y, v: series[y] }));
      if (!last.length) return { failed: true, reason: 'empty' };
      let src = '';
      try { src = j.indicators && j.indicators[ind.code] && j.indicators[ind.code].source ? j.indicators[ind.code].source : ''; } catch (e) {}
      return { ok: true, iso, ind: ind.code, label: ind.label, unit: ind.unit, last, src: src || 'World Economic Outlook, FMI', url: this.API + ind.code + '/' + iso };
    },
    buildBlock(p) {
      if (!p || !p.ok) return '';
      const L = ['[FMI - DONNEES MACRO LUES SUR imf.org]'];
      L.push('Question macro : les chiffres ci-dessous ont ete lus en direct sur l\u2019API DataMapper du FMI — pas appris par c\u0153ur. Reponds a partir d\u2019eux, avec l\u2019unite. Ce qui n\u2019est pas ci-dessous, tu ne l\u2019as pas lu.');
      L.push(p.iso + ' · ' + p.label + ' (' + p.unit + ') :');
      for (const r of p.last) L.push('\u2022 ' + r.y + ' : ' + String(r.v).replace('.', ','));
      L.push('Source : FMI DataMapper, ' + p.src + ' (' + p.url + '). Texte ordinaire, sans emoji ni LaTeX.');
      return L.join('\n').slice(0, 1600);
    }
  };

  App.ChemLookup = {
    PUG: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/',
    _pending: null,
    _cache: {},
    TIMEOUT_MS: 30000,
    CACHE_MS: 86400000,
    PROPS: 'MolecularFormula,MolecularWeight,IUPACName,InChIKey,XLogP,HBondDonorCount,HBondAcceptorCount',
    TRIG: /formule (brute|chimique|developpee|semi developpee)|masse molaire|molecular ?weight|molecular formula|numero cas|\bcas\b|smiles|inchi\b|iupac|pubchem|nist|webbook|point de fusion|point d ebullition|melting point|boiling point|\bfds\b|fiche de donnees de securite|reach|\bclp\b|\bsgh\b|etiquetage|pictogramme/,
    _raw(t) { return String(t == null ? '' : t); },
    norm(t) {
      try {
        return this._raw(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '')
          .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
      } catch (e) { return this._raw(t).toLowerCase(); }
    },
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    wants(text) {
      try { return !!(text && this.TRIG.test(this.norm(text))); }
      catch (e) { return false; }
    },
    extractName(text) {
      let t = this.norm(text);
      t = t.replace(/formule (brute|chimique|developpee|semi developpee)/g, ' ')
        .replace(/masse molaire|molecular ?weight|molecular formula/g, ' ')
        .replace(/numero cas|\bcas\b|smiles|inchi\b|iupac|pubchem|nist|webbook/g, ' ')
        .replace(/point de fusion|point d ebullition|melting point|boiling point|temperature de fusion|temperature d ebullition/g, ' ')
        .replace(/\bfds\b|fiche de donnees de securite|reach|\bclp\b|\bsgh\b|etiquetage|pictogramme/g, ' ')
        .replace(/\b(mentions?|fiches?|produits?|substances?|dangers?|risques?|securite|prevention|sante|utilisation|manipulation|stockage|transport|utiliser|manipuler|stocker)\b/g, ' ')
        .replace(/\b[a-z]\b/g, ' ')
        .replace(/quelle est|quel est|quelles sont|quels sont|donne moi|donnez moi|je veux|je cherche|c est quoi|combien|quelle|quel/g, ' ')
        .replace(/\b(la|le|les|l|d|de|du|des|un|une|pour|et|ou|the|of|a|an|what|is|give|me|does|doit|faire)\b/g, ' ')
        .replace(/[^a-z0-9 \(\)\-\+]/g, ' ').replace(/\s+/g, ' ').trim();
      return t.slice(0, 80);
    },
    async getJson(url) {
      const now = Date.now();
      const hit = this._cache[url];
      if (hit && (now - hit.at) < this.CACHE_MS) return hit.body;
      let sf = null;
      try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e) {}
      if (!sf) throw new Error('no proxy');
      const p = sf(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      const body = await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), this.TIMEOUT_MS))]);
      try { this._cache[url] = { at: now, body }; } catch (e) {}
      return body;
    },
    async search(text) {
      const name = this.extractName(text);
      if (!name || name.length < 2) return { failed: true, reason: 'no-name' };
      let props = null;
      try { props = await this.getJson(this.PUG + 'name/' + encodeURIComponent(name) + '/property/' + this.PROPS + '/JSON'); }
      catch (e) { return { failed: true, reason: 'api', name }; }
      let p = null;
      try { p = props.PropertyTable.Properties[0]; } catch (e) { p = null; }
      if (!p) return { failed: true, reason: 'not-found', name };
      let cas = '';
      try {
        const s = await this.getJson(this.PUG + 'cid/' + p.CID + '/synonyms/JSON?max_records=1');
        const syns = (s.InformationList.Information[0] || {}).Synonym || [];
        const m = syns.filter(x => /^\d{2,7}-\d{2}-\d$/.test(x));
        if (m.length) cas = m[0];
      } catch (e) {}
      return { ok: true, name, cid: p.CID, formula: p.MolecularFormula || '', mw: p.MolecularWeight || '', iupac: p.IUPACName || '', inchikey: p.InChIKey || '', xlogp: p.XLogP, hbd: p.HBondDonorCount, hba: p.HBondAcceptorCount, cas };
    },
    buildBlock(p) {
      if (!p || !p.ok) return '';
      const L = ['[CHIMIE - FICHE PUBCHEM LUE SUR pubchem.ncbi.nlm.nih.gov]'];
      L.push('Question chimie : les valeurs ci-dessous ont ete lues en direct sur l\u2019API PUG de PubChem (NCBI) pour « ' + p.name + ' » — pas apprises par c\u0153ur. Reponds a partir d\u2019elles. Ce qui n\u2019est pas ci-dessous, tu ne l\u2019as pas lu.');
      L.push('CID ' + p.cid + (p.cas ? ' · CAS ' + p.cas : '') + ' :');
      if (p.formula) L.push('\u2022 Formule brute : ' + p.formula);
      if (p.mw) L.push('\u2022 Masse molaire : ' + String(p.mw).replace('.', ',') + ' g/mol');
      if (p.iupac) L.push('\u2022 Nom IUPAC : ' + p.iupac);
      if (p.inchikey) L.push('\u2022 InChIKey : ' + p.inchikey);
      if (p.xlogp !== undefined && p.xlogp !== null) L.push('\u2022 XLogP : ' + String(p.xlogp).replace('.', ','));
      if (p.hbd !== undefined) L.push('\u2022 Donneurs/accepteurs H : ' + p.hbd + '/' + p.hba);
      L.push('Source : PubChem PUG REST, https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/' + p.cid + '/JSON . Texte ordinaire, sans emoji ni LaTeX.');
      return L.join('\n').slice(0, 1600);
    }
  };

  App.PubmedLookup = {
    ESEARCH: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=relevance&term=',
    ESUMMARY: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=',
    _pending: null,
    _cache: {},
    TIMEOUT_MS: 30000,
    CACHE_MS: 86400000,
    TRIG: /pubmed|medline|etude clinique|essai clinique|revue systematique|meta analyse|metaanalyse|article scientifique|publication scientifique|litterature (biomedicale|medicale|scientifique)/,
    _raw(t) { return String(t == null ? '' : t); },
    norm(t) {
      try {
        return this._raw(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '')
          .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
      } catch (e) { return this._raw(t).toLowerCase(); }
    },
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    wants(text) {
      try { return !!(text && this.TRIG.test(this.norm(text))); }
      catch (e) { return false; }
    },
    extractQuery(text) {
      let t = this.norm(text);
      t = t.replace(/pubmed|medline|etude clinique|essai clinique|revue systematique|meta analyse|metaanalyse|article scientifique|publication scientifique|litterature (biomedicale|medicale|scientifique)/g, ' ')
        .replace(/cherche|chercher|recherche|trouve|trouver|donne moi|donnez moi|je veux|y a t il|est ce qu|quelles?|quels?|combien|l article|les articles/g, ' ')
        .replace(/\b(la|le|les|l|d|de|du|des|un|une|sur|et|ou|the|of|a|an|on|about|for)\b/g, ' ')
        .replace(/\s+/g, ' ').trim();
      return t.slice(0, 120);
    },
    async getJson(url) {
      const now = Date.now();
      const hit = this._cache[url];
      if (hit && (now - hit.at) < this.CACHE_MS) return hit.body;
      let sf = null;
      try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e) {}
      if (!sf) throw new Error('no proxy');
      const p = sf(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      const body = await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), this.TIMEOUT_MS))]);
      try { this._cache[url] = { at: now, body }; } catch (e) {}
      return body;
    },
    async search(text) {
      const q = this.extractQuery(text);
      if (!q || q.length < 3) return { failed: true, reason: 'no-query' };
      let s = null;
      try { s = await this.getJson(this.ESEARCH + encodeURIComponent(q)); }
      catch (e) { return { failed: true, reason: 'api', q }; }
      let ids = [], count = 0;
      try { ids = s.esearchresult.idlist || []; count = Number(s.esearchresult.count) || 0; } catch (e) {}
      if (!ids.length) return { failed: true, reason: 'not-found', q, count };
      let arts = [];
      try {
        const d = await this.getJson(this.ESUMMARY + ids.join(','));
        const res = d.result || {};
        for (const id of ids) {
          const a = res[id];
          if (!a) continue;
          let doi = '';
          try { for (const x of (a.articleids || [])) if (x.idtype === 'doi') doi = x.value; } catch (e) {}
          arts.push({ pmid: id, title: a.title || '', journal: a.source || a.fulljournalname || '', date: a.pubdate || '', doi });
        }
      } catch (e) { return { failed: true, reason: 'api', q }; }
      if (!arts.length) return { failed: true, reason: 'empty', q };
      return { ok: true, q, count, arts };
    },
    buildBlock(p) {
      if (!p || !p.ok) return '';
      const L = ['[BIOMEDECINE - PUBMED LU SUR eutils.ncbi.nlm.nih.gov]'];
      L.push('Question biomédicale : les ' + p.arts.length + ' articles ci-dessous ont ete lus en direct sur PubMed (NCBI E-utilities) pour « ' + p.q + ' »' + (p.count ? ' (' + p.count + ' resultats au total)' : '') + ' — pas appris par c\u0153ur. Ne cite que ceux-ci (titre, revue, date, PMID). Ce qui n\u2019est pas ci-dessous, tu ne l\u2019as pas lu.');
      for (const a of p.arts) {
        L.push('\u2022 ' + a.title + ' — ' + a.journal + ', ' + a.date + ' (PMID ' + a.pmid + (a.doi ? ', doi ' + a.doi : '') + ').');
      }
      L.push('Fiches : https://pubmed.ncbi.nlm.nih.gov/<PMID>/ . Texte ordinaire, sans emoji ni LaTeX.');
      return L.join('\n').slice(0, 1600);
    }
  };

  App.ZbmathLookup = {
    SEARCH: 'https://api.zbmath.org/v1/document/_search?results_per_page=5&search_string=',
    _pending: null,
    _cache: {},
    TIMEOUT_MS: 30000,
    CACHE_MS: 86400000,
    REDACTED: /conflicting licenses/,
    TRIG: /zbmath|mathscinet|numdam|eudml|centre mersenne|litterature mathematique|article mathematique|publication mathematique|revue mathematique/,
    _raw(t) { return String(t == null ? '' : t); },
    norm(t) {
      try {
        return this._raw(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '')
          .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
      } catch (e) { return this._raw(t).toLowerCase(); }
    },
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    wants(text) {
      try { return !!(text && this.TRIG.test(this.norm(text))); }
      catch (e) { return false; }
    },
    extractQuery(text) {
      let t = this.norm(text);
      t = t.replace(/zbmath|mathscinet|numdam|eudml|centre mersenne|litterature mathematique|article mathematique|publication mathematique|revue mathematique/g, ' ')
        .replace(/cherche|chercher|recherche|trouve|trouver|donne moi|donnez moi|je veux|quelles?|quels?|combien|articles?|publications?|papiers?|revues?/g, ' ')
        .replace(/\b(la|le|les|l|d|de|du|des|un|une|sur|et|ou|the|of|a|an|on|about|for)\b/g, ' ')
        .replace(/\s+/g, ' ').trim();
      return t.slice(0, 150);
    },
    async getJson(url) {
      const now = Date.now();
      const hit = this._cache[url];
      if (hit && (now - hit.at) < this.CACHE_MS) return hit.body;
      let sf = null;
      try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e) {}
      if (!sf) throw new Error('no proxy');
      const p = sf(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      const body = await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), this.TIMEOUT_MS))]);
      try { this._cache[url] = { at: now, body }; } catch (e) {}
      return body;
    },
    async search(text) {
      const q = this.extractQuery(text);
      if (!q || q.length < 3) return { failed: true, reason: 'no-query' };
      let j = null;
      try { j = await this.getJson(this.SEARCH + encodeURIComponent(q)); }
      catch (e) { return { failed: true, reason: 'api', q }; }
      let total = 0;
      try { total = Number((j.status || {}).nr_total_results) || 0; } catch (e) {}
      let arts = [];
      try {
        for (const d of ((j || {}).result || [])) {
          const title = d && d.title && d.title.title ? String(d.title.title) : '';
          if (!title || this.REDACTED.test(title)) continue;
          let authors = [];
          try { authors = ((d.contributors || {}).authors || []).map(a => a.name).filter(Boolean).slice(0, 4); } catch (e) {}
          let journal = '';
          try { const s0 = (((d.source || {}).series) || [])[0] || {}; journal = s0.title || s0.parallel_title || d.source.source || ''; } catch (e) {}
          let doi = '';
          try { for (const l of (d.links || [])) if (l.type === 'doi') doi = l.url || l.identifier || ''; } catch (e) {}
          let msc = [];
          try { msc = (d.msc || []).map(m => m.code).filter(Boolean).slice(0, 3); } catch (e) {}
          arts.push({ title: title.slice(0, 220), authors: authors.join(', ').slice(0, 120), year: d.year || '', journal: String(journal).slice(0, 100), msc: msc.join(' '), doi, zb: d.zbmath_url || '' });
          if (arts.length >= 5) break;
        }
      } catch (e) { return { failed: true, reason: 'parse', q }; }
      if (!arts.length) return { failed: true, reason: 'not-found', q, total };
      return { ok: true, q, total, arts };
    },
    buildBlock(p) {
      if (!p || !p.ok) return '';
      const L = ['[MATHS - ZBIMATH LU SUR api.zbmath.org]'];
      L.push('Question littérature mathématique : les ' + p.arts.length + ' notices ci-dessous ont ete lues en direct sur zbMATH Open pour « ' + p.q + ' »' + (p.total ? ' (' + p.total + ' resultats au total)' : '') + ' — pas apprises par c\u0153ur. Ne cite que celles-ci. Ce qui n\u2019est pas ci-dessous, tu ne l\u2019as pas lu.');
      for (const a of p.arts) {
        L.push('\u2022 ' + a.title + (a.authors ? ' — ' + a.authors : '') + (a.year ? ', ' + a.year : '') + (a.journal ? '. ' + a.journal : '') + (a.msc ? ' [MSC ' + a.msc + ']' : '') + (a.doi ? ' (doi ' + a.doi + ')' : '') + (a.zb ? ' ' + a.zb : '') + '.');
      }
      L.push('Fiches : le lien zbmath.org de chaque notice. Texte ordinaire, sans emoji ni LaTeX.');
      return L.join('\n').slice(0, 1600);
    }
  };

  App.AlphaLookup = {
    API: 'https://www.alphavantage.co/query?function=',
    KEY_LS: 'sofia_alpha_key_v1',
    _pending: null,
    _cache: {},
    TIMEOUT_MS: 25000,
    CACHE_MS: 600000,
    NAMES: [
      ["AAPL", "apple"], ["MSFT", "microsoft"], ["GOOGL", "google alphabet"],
      ["AMZN", "amazon"], ["TSLA", "tesla"], ["NVDA", "nvidia"],
      ["META", "meta facebook"], ["NFLX", "netflix"], ["ORCL", "oracle"],
      ["IBM", "ibm"], ["INTC", "intel"], ["AMD", "amd"],
      ["MC.PA", "lvmh"], ["OR.PA", "l oreal loreal"], ["TTE.PA", "totalenergies total"],
      ["SAN.PA", "sanofi"], ["AIR.PA", "airbus"], ["BNP.PA", "bnp paribas"],
      ["RMS.PA", "hermes"], ["CDI.PA", "dior"], ["FDJU.PA", "fdj fdju francaise jeux united"],
      ["ENGI.PA", "engie"], ["ACA.PA", "credit agricole"], ["BN.PA", "danone"],
      ["CAP.PA", "capgemini"], ["CA.PA", "carrefour"], ["GLE.PA", "societe generale"],
      ["ORA.PA", "orange"], ["DG.PA", "vinci"], ["SU.PA", "schneider electric"],
      ["SIE.DE", "siemens"],
      ["VOW.DE", "volkswagen"], ["BMW.DE", "bmw"], ["NESN.SW", "nestle"],
      ["NOVN.SW", "novartis"], ["7203.T", "toyota"], ["BABA", "alibaba"],
      ["TSM", "tsmc"], ["SAP.DE", "sap"]
    ],
    FIN: /cours|prix|action|bourse|cotation|nasdaq|cac 40|nyse|ticker|valorisation boursiere|capitalisation|dividende/,
    _raw(t) { return String(t == null ? '' : t); },
    norm(t) {
      try {
        return this._raw(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '')
          .replace(/[^a-z0-9.$]+/g, ' ').replace(/\s+/g, ' ').trim();
      } catch (e) { return this._raw(t).toLowerCase(); }
    },
    key() {
      try { return String(localStorage.getItem(this.KEY_LS) || '').trim(); }
      catch (e) { return ''; }
    },
    setKey(v) {
      try {
        v = String(v == null ? '' : v).trim();
        if (v) localStorage.setItem(this.KEY_LS, v);
        else localStorage.removeItem(this.KEY_LS);
        this._cache = {};
        try { if (App.UI && App.UI.showToast) App.UI.showToast(v ? 'saved!' : 'removed', 'success'); } catch (e) {}
      } catch (e) {}
    },
    syncInput() {
      try {
        const el = document.getElementById('alphaKeyInput');
        if (el && !el.value) el.value = this.key();
      } catch (e) {}
    },
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    findSymbol(text) {
      const t = ' ' + this.norm(text) + ' ';
      for (const n of this.NAMES) {
        for (const w of n[1].split(' ')) {
          if (w.length >= 3 && t.indexOf(' ' + w + ' ') !== -1) return n[0];
        }
      }
      const up = this._raw(text).toUpperCase();
      const m = up.match(/(?:\$|SYMBOLE?|TICKER|ACTION)\s*([A-Z][A-Z0-9.]{0,6})\b/) ||
        up.match(/\b[A-Z][A-Z0-9.]{1,6}\.(PA|DE|SW|T|L|MI|AS|MC)\b/) ||
        up.match(/\b[A-Z]{2,5}\b/);
      if (m) {
        let s = m[1] || m[0];
        const ALIAS = { FDJ: 'FDJU.PA', FDJU: 'FDJU.PA', ENGIE: 'ENGI.PA', DANONE: 'BN.PA', CAPGEMINI: 'CAP.PA', CARREFOUR: 'CA.PA', ORANGE: 'ORA.PA', VINCI: 'DG.PA', LVMH: 'MC.PA', LOREAL: 'OR.PA', TOTAL: 'TTE.PA', SANOFI: 'SAN.PA', AIRBUS: 'AIR.PA', BNP: 'BNP.PA', HERMES: 'RMS.PA', DIOR: 'CDI.PA', SAFRAN: 'SAF.PA', THALES: 'HO.PA', ACCOR: 'AC.PA', AXA: 'CS.PA', MICHELIN: 'ML.PA', KERING: 'KER.PA', PERNOD: 'RI.PA', RICARD: 'RI.PA', PUBLICIS: 'PUB.PA', RENAULT: 'RNO.PA', STELLANTIS: 'STLAM.MI', VEOLIA: 'VIE.PA', VIVENDI: 'VIV.PA', DASSAULT: 'DSY.PA', ESSILOR: 'EL.PA', LUXOTTICA: 'EL.PA', LEGRAND: 'LR.PA', SCHNEIDER: 'SU.PA', SAINTGOBAIN: 'SGO.PA', GOBAIN: 'SGO.PA', EUROFINS: 'ERF.PA', TELEPERFORMANCE: 'TEP.PA', ARCELOR: 'MT.AS', MITTAL: 'MT.AS', BITCOIN: 'BTC-USD', BTC: 'BTC-USD', ETHEREUM: 'ETH-USD', ETH: 'ETH-USD', CAC40: '^FCHI', CAC: '^FCHI', NASDAQ: '^IXIC', SP500: '^GSPC' };
        if (ALIAS[s]) s = ALIAS[s];
        else if (/^[A-Z]{2,5}$/.test(s) && /fdj|francaise des jeux|engie|danone|capgemini|carrefour|orange|vinci/.test(t)) {
          for (const n of this.NAMES) { if (n[0].indexOf(s) === 0) return n[0]; }
        }
        if (!/^(CAC|NYSE|NASDAQ|PEA|CTO|ETF|USD|EUR|PDG|DGSE|COURS|PRIX|VALEUR|VALEURS|ACTION|ACTIONS|COTATION|BOURSE|MARCHE|TITRE|TITRES|TAUX|INDICE|SOCIETE|GROUPE|DU|DE|LA|LE|LES|DES|UNE|EN|AU|AUX|ET|OU|UN|EST|SON|SA|SES|SUR|POUR|PAR|DANS)$/.test(s)) return s;
      }
      return '';
    },
    STOPW: ['quelle','quel','quelles','quels','est','sont','la','le','les','de','du','des','un','une','en','au','aux','ce','cette','combien','vaut','valeur','valeurs','boursiere','boursier','bourse','cours','prix','action','actions','cotation','societe','entreprise','ticker','symbole','aujourdhui','actuel','actuelle','france','francaise','francais','donne','moi','dis','quelle'],
    keywords(text) {
      return this.norm(text).split(' ').filter(w => (w.length >= 3 || /^\d+$/.test(w)) && this.STOPW.indexOf(w) === -1).join(' ');
    },
    wants(text) {
      try {
        if (!text || !this.norm(text)) return false;
        if (!this.FIN.test(this.norm(text))) return false;
        try { this.syncInput(); } catch (e) {}
        if (this.findSymbol(text)) return true;
        return this.keywords(text).length >= 3;
      } catch (e) { return false; }
    },
    async getJson(url) {
      let sf = null;
      try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e) {}
      if (!sf) { try { sf = superFetch; } catch (e2) {} }
      if (!sf) throw new Error('no proxy');
      const p = sf(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), this.TIMEOUT_MS))]);
    },
    async getText(url) {
      let sf = null;
      try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e) {}
      if (!sf) { try { sf = superFetch; } catch (e2) {} }
      if (!sf) throw new Error('no proxy');
      const p = sf(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
      return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), this.TIMEOUT_MS))]);
    },
    async quoteKeyless(sym) {
      const s = String(sym || '').toUpperCase();
      const stooq = s.replace(/\.PA$/, '.FR').toLowerCase();
      const urls = [
        'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + '?range=1d&interval=1d',
        'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + '?range=1mo&interval=1d'
      ];
      for (const u of urls) {
        try {
          const j = await this.getJson(u);
          const r = j && j.chart && j.chart.result && j.chart.result[0];
          const m = r && r.meta;
          const px = m && (m.regularMarketPrice || m.previousClose || m.chartPreviousClose);
          if (px) return { ok: true, sym: s, price: String(px), change: '', changePct: '', day: '', prev: String(m.previousClose || m.chartPreviousClose || ''), src: 'yahoo' };
        } catch (e) {}
      }
      try {
        const base = s.replace(/\.(PA|DE|SW|L|MI|AS|MC)$/, '');
        const sj = await this.getJson('https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(base));
        const quotes = (sj && sj.quotes) || [];
        for (const q of quotes) {
          if (!q || q.quoteType !== 'EQUITY' || !q.symbol) continue;
          try {
            const j2 = await this.getJson('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(q.symbol) + '?range=1d&interval=1d');
            const r2 = j2 && j2.chart && j2.chart.result && j2.chart.result[0];
            const m2 = r2 && r2.meta;
            const px2 = m2 && (m2.regularMarketPrice || m2.previousClose || m2.chartPreviousClose);
            if (px2) return { ok: true, sym: q.symbol, price: String(px2), change: '', changePct: '', day: '', prev: String(m2.previousClose || m2.chartPreviousClose || ''), src: 'yahoo' };
          } catch (e2) {}
          break;
        }
      } catch (e) {}
      try {
        const csv = await this.getText('https://stooq.com/q/l/?s=' + encodeURIComponent(stooq) + '&f=sd2t2ohlcv&h&e=csv');
        const line = String(csv || '').trim().split('\n')[1] || '';
        const parts = line.split(',');
        const close = parts[6] || '';
        if (close && close !== 'N/A' && Number(close) > 0) return { ok: true, sym: s, price: close, change: '', changePct: '', day: parts[1] || '', prev: parts[3] || '', src: 'stooq' };
      } catch (e) {}
      return null;
    },
    async search(text) {
      const k = this.key();
      let sym = this.findSymbol(text);
      if (!sym) {
        const kw = this.keywords(text);
        if (!kw) return { failed: true, reason: 'no-symbol' };
        try {
          const sj = await this.getJson('https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(kw));
          const quotes = (sj && sj.quotes) || [];
          for (const q of quotes) {
            if (q && q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'MUTUALFUND' || q.quoteType === 'CURRENCY')) { sym = q.symbol; break; }
          }
        } catch (e) {}
        if (!sym) return { failed: true, reason: 'no-symbol' };
      }
      const ck = 'q:' + sym;
      const now = Date.now();
      const hit = this._cache[ck];
      if (hit && (now - hit.at) < this.CACHE_MS) return hit.body;
      if (k) {
      let j = null;
      try { j = await this.getJson(this.API + 'GLOBAL_QUOTE&symbol=' + encodeURIComponent(sym) + '&apikey=' + encodeURIComponent(k)); }
      catch (e) {
        const free = await this.quoteKeyless(sym);
        if (free) { try { this._cache[ck] = { at: now, body: free }; } catch (e2) {} return free; }
        return { failed: true, reason: 'api', sym };
      }
      if (j && (j['Error Message'] || j['Invalid API call'])) {
        const free = await this.quoteKeyless(sym);
        if (free) { try { this._cache[ck] = { at: now, body: free }; } catch (e2) {} return free; }
        return { failed: true, reason: 'bad-symbol', sym };
      }
      if (j && (j['Note'] || j['Information'])) {
        const free = await this.quoteKeyless(sym);
        if (free) { try { this._cache[ck] = { at: now, body: free }; } catch (e2) {} return free; }
        return { failed: true, reason: 'rate', sym };
      }
      const q = j && j['Global Quote'];
      if (!q || !q['05. price']) {
        const free = await this.quoteKeyless(sym);
        if (free) { try { this._cache[ck] = { at: now, body: free }; } catch (e2) {} return free; }
        return { failed: true, reason: 'empty', sym };
      }
      const out = {
        ok: true, sym: q['01. symbol'] || sym, price: q['05. price'],
        change: q['09. change'] || '', changePct: q['10. change percent'] || '',
        day: q['07. latest trading day'] || '', prev: q['08. previous close'] || '', src: 'alpha'
      };
      try { this._cache[ck] = { at: now, body: out }; } catch (e) {}
      return out;
      }
      const free = await this.quoteKeyless(sym);
      if (free) { try { this._cache[ck] = { at: now, body: free }; } catch (e2) {} return free; }
      return { failed: true, reason: 'no-key', sym };
    },
    buildBlock(p) {
      if (!p) return '';
      if (p.failed && (p.reason === 'no-key' || p.reason === 'rate' || p.reason === 'api' || p.reason === 'empty' || p.reason === 'bad-symbol')) {
        if (p.reason === 'no-key') return ['[BOURSE - COURS SANS CLE, LECTURE DIRECTE TENTEE]', 'Question boursière' + (p.sym ? ' sur ' + p.sym : '') + ' : la lecture directe a échoué et je n\u2019ai pas ta clé perso. INTERDICTION d\u2019inventer un chiffre : dis que tu n\u2019as pas le cours en direct, donne le symbole exact (ex FDJ.PA pour FDJ) et guide vers Réglages → Données boursières (clé gratuite https://www.alphavantage.co/support/#api-key) ou vers Yahoo Finance. Texte ordinaire, sans emoji ni LaTeX.'].join('\n');
        return '[BOURSE - PAS DE COURS EN DIRECT]\nPour ' + (p.sym || 'ce symbole') + ' je n\u2019ai pas obtenu de cours en direct. INTERDICTION d\u2019inventer un prix : dis-le franchement, donne le symbole et propose de réessayer ou la macro FMI/Banque mondiale. Texte ordinaire, sans emoji ni LaTeX.';
      }
      if (!p.ok) return '';
      const src = p.src === 'yahoo' ? 'Yahoo Finance (chart)' : p.src === 'stooq' ? 'Stooq (CSV)' : 'Alpha Vantage (GLOBAL_QUOTE)';
      const L = ['[BOURSE - COURS LU EN DIRECT, SOURCE ' + src + ']'];
      L.push('Le cours ci-dessous a été lu en direct — pas appris par c\u0153ur. Réponds à partir de lui, sans inventer. Si la devise n\u2019est pas le dollar, garde la devise du marché (ex EUR pour FDJU.PA).');
      L.push(p.sym + ' : ' + p.price + (p.prev ? ' (clôture précédente ' + p.prev : '') + (p.change ? ', ' + p.change + ' / ' + p.changePct : '') + (p.day ? ', séance ' + p.day : '') + (p.prev || p.change || p.day ? ').' : '.'));
      L.push('Source : ' + src + '. Texte ordinaire, sans emoji ni LaTeX.');
      return L.join('\n').slice(0, 900);
    }
  };
