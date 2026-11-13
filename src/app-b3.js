import { App, __M, markdown, DOMPurify, Marked, normLang, langInfo, langName, langNative, langBcp47, isRTL, isKnownLang, I18N_DATA, LANGUAGES, SUPPORTED_LANGS, deepMerge, SOFIA_LANGUAGE_DETECTOR, SOFIA_INTERPRETER, SOFIA_PYTHON, attachRPG, attachResearch, attachSTT, attachVoice, attachPiperVoice, attachVocal, attachMentor, attachProfessions, attachChess, attachChess3d, attachChaos, attachDeites, attachDeepMemory, attachMemStruct, attachSelfScript, attachWebLearn, attachConsult, attachSelfUpdate, attachBrand, attachNotice, attachErrorReport, attachFeedback, attachDictionary, attachVision, attachPromptBook, attachPromptBookSeed, attachWebVision, attachWebSearch, attachAppLang, attachMailbox, attachHelp, attachDeviceScan, attachParental, attachVideos, attachMedias, attachImgStyles, attachSheets, attachSfw, attachNoPersonal, attachProviders, attachModes, attachInner, attachThinkFilter, attachGuard, attachPhoto, attachAutoI18n } from './app.js';
  // Ronde 170 (souhait de l'utilisateur, comme pour les dossiers précédents seulement l'adresse :
  // "code civil français : https://www.legifrance.gouv.fr/download/file/pdf/LEGITEXT000006070721.pdf/LEGI").
  // Le Code civil se trouve dans src/droit/. Trois pièces :
  // (1) App.DroitLookup - UN OUTIL. Ronde 173 : sept codes, UN registre.
  //     Le tableau src/droit/codes-index.json dit où se trouve l'index des
  //     numéros d'articles de chaque code (numéro -> identifiant Legifrance) et
  //     comment le code s'appelle dans le texte. Ensuite, l'article LUI-MÊME est
  //     récupéré via superFetch chez Legifrance et lu dans le navigateur (texte,
  //     version "en vigueur depuis", modification, source dans le plan).
  //     Si aucun code n'est nommé, le numéro est cherché dans tous les index.
  //     Si Legifrance tombe, le texte fourni sert de repli.
  // (2) Les index sont grands (le Code de l'éducation à lui seul 2,8 Mo) : chacun
  //     n'est récupéré que quand une question pointe vers son code.
  App.DroitLookup = {
    REGISTRY_URL: 'src/droit/codes-index.json',
    // Ronde 273 : le corpus de lois ne tient plus dans src/ — 20 Mo à lui seul, et le
    // générateur ne s'enregistrait plus (« Couldn't save the src files: upload timed
    // out »). Les fichiers .gz du corpus sont donc lus sur GitHub (raw.githubusercontent,
    // dépôt Sofiaperchancenew/sofia), listés dans src/droit/remote.json, et lus à
    // distance — par les MÊMES chemins logiques 'src/droit/...', que ce tableau traduit.
    // Depuis le 28.10.2026 : plus aucun repli vers l'hébergeur Perchance. Si GitHub est
    // injoignable, le module rend null puis lit en direct chez Legifrance, comme avant.
    REMOTE_URL: 'src/droit/remote.json',
    DEFAULT: 'code-civil',
    TIMEOUT_MS: 9000,
    CACHE_MS: 600000,
    MAX_TOTAL: 2000,
    // Ronde 197 : 1500 au lieu de 520 caractères par article. À 520, L812-2 se terminait
    // au milieu de la phrase ; Sofia citait quand même le reste mot pour mot, la
    // garde des sources ne voyait pas la citation dans le texte lu et faisait réécrire toute la
    // réponse - la transcription s'arrêtait alors. L'article de codex est
    // un texte juridique : il appartient entièrement au prompt.
    MAX_TOPIC: 1500,
    NAMES: ['Code civil', 'Code pénal', 'Code de procédure pénale', "Code de l'éducation",
      "Code de l'entrée et du séjour des étrangers et du droit d'asile",
      "Code de la famille et de l'aide sociale", 'Code de justice administrative'],
    _reg: null, _regLoading: null, _remote: null, _remoteLoading: null, _remoteDoc: null,
    _idx: {}, _idxLoading: {}, _artMap: {}, _artMapLoading: {}, _artMeta: {},
    _cache: {}, _planIdx: null, _pending: null, _numIdx: null, _numIdxLoading: null,
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    // La table des fichiers hébergés (petite, elle, elle reste dans la maison).
    remote() {
      if (this._remote) return Promise.resolve(this._remote);
      if (this._remoteLoading) return this._remoteLoading;
      let self = this;
      try {
        this._remoteLoading = fetch(this.REMOTE_URL, { cache: 'no-cache' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) {
            self._remoteLoading = null;
            self._remote = (j && j.files) ? j.files : {};
            self._remoteDoc = j || null;
            // Ronde 283 : les fichiers relus lors d'une mise à jour du corpus
            // (App.DroitUpdate) prennent le pas sur ceux de la table gravée — le corpus
            // du navigateur passe avant, et la table gardée dans la maison reste la
            // copie de référence.
            try {
              let ov = JSON.parse(localStorage.getItem((App.DroitUpdate && App.DroitUpdate.OV_KEY) || 'sofia_droit_files_v1') || 'null') || {};
              let ks = Object.keys(ov), kk = 0;
              // 100 % GitHub : les vieux dépôts Perchance sont jetés, pas relus.
              for (let i = 0; i < ks.length; i++) {
                let v = ov[ks[i]];
                if (typeof v === 'string' && /uploads\.dev|perchance/i.test(v)) { try { delete ov[ks[i]]; } catch (e) {} continue; }
                if (v) { self._remote[ks[i]] = v; kk++; }
              }
              try { localStorage.setItem((App.DroitUpdate && App.DroitUpdate.OV_KEY) || 'sofia_droit_files_v1', JSON.stringify(ov)); } catch (e) {}
              if (kk) console.log('[DroitLookup] ' + kk + ' fichier(s) du corpus relus lors de la dernière mise à jour');
            } catch (e) {}
            let n = Object.keys(self._remote).length;
            console.log('[DroitLookup] corpus hébergé :', n, 'fichier(s)');
            return self._remote;
          })
          .catch(function () { self._remoteLoading = null; self._remote = {}; return self._remote; });
      } catch (e) { this._remoteLoading = null; this._remote = {}; }
      return this._remoteLoading;
    },
    // 'src/droit/code-travail/index.json.gz' -> adresse GitHub brute.
    // EXCEPTION : le registre (codes-index.json) est vendu DANS la maison
    // (src/droit/codes-index.json, 67 Ko) : le routage des 82 codes ne dépend
    // d'aucun hébergeur, même hors ligne partiel.
    url(p) {
      let s = String(p == null ? '' : p);
      let rel = s.replace(/^src\/droit\//, '');
      if (rel === 'codes-index.json') return s;
      let hit = this._remote && (this._remote[rel] || this._remote[s]);
      if (typeof hit === 'string' && hit && !/uploads\.dev|perchance/i.test(hit)) return hit;
      if (/^src\/droit\//.test(s)) return 'https://raw.githubusercontent.com/Sofiaperchancenew/sofia/main/' + s;
      return p;
    },
    // Ronde 277 : le corpus entier (78 codes, 165 000 articles) est stocké compressé
    // (38 Mo au lieu de ~900 Mo bruts). Un fichier en .gz
    // est décompressé dans le navigateur. Si le décompresseur manque (vieux navigateur), il y a
    // zéro - alors Sofia lit simplement l'article en direct chez Legifrance, comme avant.
    _json(url) {
      let self = this;
      return this.remote().catch(function () {}).then(function () {
        let u = self.url(url);
        // Ronde 275 : derselbe Öffner wie beim übrigen Korpus — mit Spiegel, falls die
        // Hauptadresse (oder die Tabelle) ausfällt. Der logische Pfad ist 'src/droit/…'.
        return App.Core.openJson(u, String(url), /\.gz(\?|$)/.test(String(u)) || /\.gz$/.test(String(url)));
      }).catch(function (e) { console.warn('[DroitLookup] chargement échoué : ' + url, e && e.message); return null; });
    },
    // Le registre : la liste des codes et l'emplacement de leurs index.
    registry() {
      if (this._reg) return Promise.resolve(this._reg);
      if (this._regLoading) return this._regLoading;
      let self = this;
      try {
        this._regLoading = this._json(this.REGISTRY_URL).then(function (j) {
          self._regLoading = null;
          if (j && j.codes && j.codes.length) self._reg = j;
          console.log('[DroitLookup] registre prêt :', self._reg ? self._reg.codes.length : 0, 'Code(s)');
          return self._reg;
        }).catch(e => { self._regLoading = null; console.warn('[DroitLookup] registre échoué :', e && e.message); return null; });
      } catch (e) { this._regLoading = null; }
      return this._regLoading;
    },
    codes() { return (this._reg && this._reg.codes) || []; },
    bySlug(slug) {
      let list = this.codes();
      for (let i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
      return null;
    },
    // L'index d'un code : numéro -> identifiant, plus le chemin de chaque numéro.
    index(slug) {
      if (this._idx[slug]) return Promise.resolve(this._idx[slug]);
      if (this._idxLoading[slug]) return this._idxLoading[slug];
      let code = this.bySlug(slug);
      if (!code || !code.index) return Promise.resolve(null);
      let self = this;
      try {
        this._idxLoading[slug] = this._json(code.index).then(function (j) {
          self._idxLoading[slug] = null;
          if (j && (j.articles || j.paths)) {
            self._idx[slug] = j;
            // Ronde 278 : die Vertraege der Union tragen keine Legifrance-Kennung, nur
            // den Plan (paths) - die Zahl der Artikel kommt dann von dort.
            let n = Object.keys(j.articles || {}).length || Object.keys(j.paths || {}).length, m = Object.keys(j.abrogated || {}).length;
            if (slug === self.DEFAULT) console.log('[DroitLookup] index prêt :', n, 'articles en vigueur,', m, 'abrogés');
            else console.log('[DroitLookup]', code.nom + ':', n, 'articles en vigueur,', m, 'abrogés');
          }
          return self._idx[slug] || null;
        }).catch(e => { self._idxLoading[slug] = null; console.warn('[DroitLookup] index ' + slug + ' échoué :', e && e.message); return null; });
      } catch (e) { this._idxLoading[slug] = null; }
      return this._idxLoading[slug];
    },
    // Le texte fourni d'un code (repli), sous forme de tableau.
    artMap(slug) {
      if (this._artMap[slug]) return Promise.resolve(this._artMap[slug]);
      if (this._artMapLoading[slug]) return this._artMapLoading[slug];
      let code = this.bySlug(slug);
      if (!code || !code.articles) return Promise.resolve(null);
      let self = this;
      try {
        this._artMapLoading[slug] = this._json(code.articles).then(function (j) {
          self._artMapLoading[slug] = null;
          let map = {};
          let meta = {};
          if (j && j.sections && j.sections.length) {
            j.sections.forEach(function (s) {
              let n = String(s.t || '').replace(/^Article\s+/i, '');
              if (n) { map[n] = s.x; meta[n] = { d: s.d || '', m: s.m || '' }; }
            });
            console.log('[DroitLookup]', code.nom + ': classeur de texte intégral prêt (' + j.sections.length + ' article(s))');
          }
          self._artMap[slug] = map;
          self._artMeta[slug] = meta;
          return map;
        }).catch(e => { self._artMapLoading[slug] = null; self._artMap[slug] = {}; return null; });
      } catch (e) { this._artMapLoading[slug] = null; }
      return this._artMapLoading[slug];
    },
    warm() {
      let self = this;
      return this.registry().then(function () { return self.index(self.DEFAULT); });
    },
    // Ronde 277 : 78 codes signifient 78 index - aucune question ne peut les charger tous.
    // D'où une seule petite carte : numéro -> codes qui le portent. Ainsi
    // elle trouve un numéro nommé ("article 1240") tout de suite, sans deviner.
    numIndex() {
      if (this._numIdx) return Promise.resolve(this._numIdx);
      if (this._numIdxLoading) return this._numIdxLoading;
      let self = this;
      this._numIdxLoading = this._json('src/droit/numbers-index.json.gz').then(function (j) {
        self._numIdxLoading = null;
        self._numIdx = (j && j.numbers) || {};
        console.log('[DroitLookup] carte des numéros prête :', Object.keys(self._numIdx).length, "numéros d'articles");
        return self._numIdx;
      });
      return this._numIdxLoading;
    },
    // Quels codes portent ce(s) numéro(s) ? Le code avec le plus de résultats
    // gagne ; le foyer par défaut (Code civil) vient en dernier.
    async codesFor(nums) {
      try {
        let map = await this.numIndex();
        if (!map) return [];
        let count = {};
        for (const n of nums) {
          let ks = map[n] || map[String(n).toUpperCase()] || [];
          for (const s of ks) count[s] = (count[s] || 0) + 1;
        }
        let def = this.DEFAULT;
        return Object.keys(count).sort(function (a, b) {
          if (count[a] !== count[b]) return count[b] - count[a];
          return a === def ? 1 : 0;
        });
      } catch (e) { return []; }
    },
    // Quel code est visé ? Le nom le plus long figurant dans le texte gagne
    // ("code de procedure penale" bat "code penal"). Sinon null.
    detect(text) {
      try {
        let t = String(text == null ? '' : text).toLowerCase().replace(/\u2019/g, "'");
        t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let best = null, bestLen = 0;
        const list = this.codes();
        for (let i = 0; i < list.length; i++) {
          const terms = list[i].detect || [];
          for (let k = 0; k < terms.length; k++) {
            let q = String(terms[k] || '').toLowerCase().replace(/\u2019/g, "'").normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (!q || q.length <= bestLen) continue;
            let re = new RegExp('(^|[^a-z0-9])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');
            if (re.test(t)) { best = list[i].slug; bestLen = q.length; }
          }
        }
        return best;
      } catch (e) { return null; }
    },
    // Ronde 198 : faire d'une question quotidienne le code. Chaque code apporte dans le
    // registre (src/droit/codes-index.json) son propre champ lexical
    // ("voisin", "mur", "terrain" pour le Code civil ; "licenciement",
    // "preavis" pour le travail ; "garde a vue", "perquisition" pour la
    // procédure pénale). Le résultat le plus long pèse le plus, pour que "permis de
    // construire" (urbanisme) batte le résultat plus court "permis" (route).
    // Pure lexicologie - aucun contenu de loi, et aucun index ne doit
    // être chargé pour cela.
    _normText(t) {
      return ' ' + String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    },
    // Une expression du champ lexical touche-t-elle le texte ? Exactement (comme mot propre) ou -
    // à partir de cinq lettres - aussi fléchi : "menace" touche "menaces",
    // "licenciement" touche "licenciements". Borné au début, pour que des mots
    // courts comme "vol" ne touchent pas "volume".
    _wordHit(t, w) {
      if (t.indexOf(' ' + w + ' ') !== -1) return true;
      if (w.length < 5) return false;
      try { return new RegExp('(^| )' + w + '[a-z]{1,4}( |$)').test(t); } catch (e) { return false; }
    },
    route(text) {
      try {
        const t = this._normText(text);
        if (t.length < 4) return null;
        let best = null, bestSc = 0, log = [];
        const list = this.codes();
        for (let i = 0; i < list.length; i++) {
          const words = list[i].words || [];
          let sc = 0, n = 0;
          for (let k = 0; k < words.length; k++) {
            let w = this._normText(words[k]).trim();
            if (w.length < 3) continue;
            if (!this._wordHit(t, w)) continue;
            sc += w.length + 3 * (w.split(' ').length - 1);
            n++;
          }
          if (!n) continue;
          log.push(list[i].slug + '=' + sc);
          if (sc > bestSc) { bestSc = sc; best = list[i].slug; }
        }
        if (bestSc < 4) return null;
        if (log.length > 1) console.log('[DroitLookup] champ lexical :', log.join(' | '));
        return best;
      } catch (e) { return null; }
    },
    // Tous les numéros d'article qu'il nomme : "article 1240", "articles 9 et 16-1",
    // "art. L. 111-1", "l'article R. 421-1 du code ...". Le numéro garde
    // sa lettre d'identification (L pour l'éducation, CJA, CESEDA ; R/D/A pour les règlements).
    numbers(text) {
      try {
        let t = String(text == null ? '' : text).toLowerCase().replace(/\u2019/g, "'");
        if (t.length > 600) t = t.slice(0, 600);
        let out = [];
        const re = /(?:articles?|art)\s*\.?\s*(?:n[°o]\s*)?((?:[lrd]?\s?\.?\s?\d{1,4}(?:\s*-\s*\d{1,3})?)(?:\s*(?:,|et|ou)\s*(?:[lrd]?\s?\.?\s?\d{1,4}(?:\s*-\s*\d{1,3})?))*)/g;
        let m;
        while ((m = re.exec(t))) {
          let parts = String(m[1] || '').split(/\s*(?:,|et|ou)\s*/);
          for (const part of parts) {
            let raw = String(part).replace(/[.\s]/g, '');
            if (!raw) continue;
            let mm = /^([lrd])?([\d\-]+)$/.exec(raw);
            if (!mm) continue;
            let body = mm[2].split('-').map(function (x) {
              return String(Number(String(x).replace(/^(1)(er|re|ere)$/i, '1')));
            }).join('-');
            if (body.indexOf('NaN') >= 0) continue;
            let n = (mm[1] ? mm[1].toUpperCase() : '') + body;
            if (out.indexOf(n) < 0) out.push(n);
          }
          if (out.length >= 3) break;
        }
        return out;
      } catch (e) { return []; }
    },
    // Retrouver un numéro nommé dans un index : d'abord exactement, puis avec
    // la lettre d'identification d'une partie (L, R, D, A) devant ou sans elle. Ainsi
    // "article 111-1" trouve l'article L111-1 du Code de l'éducation.
    resolveKey(idx, num) {
      try {
        if (!idx) return null;
        const A = idx.articles || {}, D = idx.abrogated || {}, P = idx.paths || {};
        // Ronde 278 : die Vertraege der Union tragen keine Legifrance-Kennung; bei ihnen
        // zaehlt der Plan (paths) als Nachweis, dass es den Artikel gibt.
        if (A[num] || D[num] || P[num]) return num;
        let letter = /^[LRDA]/.test(num) ? num.charAt(0) : '';
        let body = letter ? num.slice(1) : num;
        if (!letter) {
          const letters = ['L', 'R', 'D', 'A'];
          for (let i = 0; i < letters.length; i++) if (A[letters[i] + body] || D[letters[i] + body] || P[letters[i] + body]) return letters[i] + body;
        } else if (A[body] || D[body] || P[body]) return body;
        return null;
      } catch (e) { return null; }
    },
    locateIn(idx, nums) {
      let out = [];
      if (!idx) return out;
      for (const n of nums) { let k = this.resolveKey(idx, n); if (k && out.indexOf(k) < 0) out.push(k); }
      return out;
    },
    status(num, slug) {
      try {
        let idx = this._idx[slug || this.DEFAULT];
        if (!idx) return null;
        if (idx.articles && idx.articles[num]) return 'en-vigueur';
        if (idx.paths && idx.paths[num]) return 'en-vigueur';   // Ronde 278 : Union-Vertraege
        if (idx.abrogated && idx.abrogated[num]) return 'abroge';
        return 'inconnu';
      } catch (e) { return null; }
    },
    _fetchText(url) {
      const self = this;
      return Promise.race([
        App.Core.proxyFetch(url).then(r => r.text()),
        new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, self.TIMEOUT_MS); })
      ]);
    },
    _t(el) {
      return (el ? (el.textContent || '') : '').replace(/\u00a0/g, ' ')
        .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
    },
    _parse(html) {
      let doc;
      try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { return null; }
      if (!doc) return null;
      let art = doc.querySelector('article.js-article-content-to-copy') || doc.querySelector('main article') || doc.querySelector('article');
      if (!art) return null;
      let out = { num: '', text: '', env: '', date: '', path: [] };
      let h2 = art.querySelector('h2.name-article') || art.querySelector('h2');
      if (h2) out.num = this._t(h2).replace(/^Article\s*/i, '');
      let c = art.querySelector('div.content');
      if (c) out.text = this._t(c);
      art.querySelectorAll('span').forEach(s => {
        if (out.env) return;
        let v = this._t(s);
        if (/^Version en vigueur depuis le /.test(v)) out.env = v.replace(/^Version en vigueur depuis le /, '');
      });
      let d = art.querySelector('p.date');
      if (d) {
        let raw = String(d.innerHTML || d.textContent || '');
        raw = raw.replace(/<br\s*\/?>/gi, ' · ').replace(/<[^>]+>/g, ' ');
        out.date = raw.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280);
      }
      let seen = {};
      doc.querySelectorAll('#breadcrumb li').forEach(li => {
        let v = this._t(li);
        if (!v || seen[v]) return;
        seen[v] = 1;
        out.path.push(v);
      });
      // Le fil d'Ariane commence à "Accueil" et "Legifrance" et nomme ensuite
      // le code : tout ce qui précède est retiré. Le nom du code vient du registre, pour qu'
      // ici aucun code ne soit codé en dur (ronde 173).
      let cut = -1;
      const names = this.NAMES.concat(this.codes().map(function (x) { return x.nom; }));
      for (let i = 0; i < names.length; i++) {
        let j = out.path.indexOf(names[i]);
        if (j >= 0) { cut = j; break; }
      }
      if (cut > 0) out.path = out.path.slice(cut + 1);
      else out.path = out.path.filter(function (v) { return !/^(Accueil|Legifrance)$/i.test(v); });
      out.path = out.path.filter(function (v) { return !/^Article\s/i.test(v); });
      return out;
    },
    read(num, slug) {
      let s = slug || this.DEFAULT;
      let key = s + ':' + num;
      this._cache = this._cache || {};
      let c = this._cache[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return Promise.resolve(c.v);
      let idx = this._idx[s];
      if (!idx) return Promise.resolve(null);
      let id = (idx.articles && idx.articles[num]) || null;
      if (!id) return Promise.resolve(null);
      let code = this.bySlug(s) || {};
      let url = (idx.base || code.base || 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI') + id + '/';
      let self = this;
      // Legifrance répond de façon irrégulière (page Cloudflare au lieu de l'article) :
      // un second essai peu après sauve la plupart des ratés.
      const once = function () {
        return self._fetchText(url).then(function (html) {
          let a = self._parse(html);
          if (!a || !a.text) throw new Error('vide');
          return a;
        });
      };
      return once().catch(function () {
        return new Promise(function (r) { setTimeout(r, 800); }).then(once);
      }).then(function (a) {
        a.url = url;
        self._cache[key] = { t: Date.now(), v: a };
        return a;
      }).catch(function () { return null; });
    },
    async search(text) {
      if (!this.isEnabled()) return { failed: true, reason: 'disabled' };
      try {
        await this.warm();
        let nums = this.numbers(text);
        if (!nums.length) return { failed: true, reason: 'no-number' };
        let named = this.detect(text);
        let slug = named || this.DEFAULT;
        let idx = await this.index(slug);
        let keys = this.locateIn(idx, nums);
        // Aucun code nommé et le numéro ne figure pas dans le code par défaut : la
        // carte des numéros dit quels codes portent ce numéro du tout ;
        // seuls ceux-là sont chargés (24 index d'avance seraient trop).
        if (!keys.length && !named) {
          let cands = await this.codesFor(nums);
          if (!cands.length) cands = this.codes().map(function (c) { return c.slug; });
          for (let i = 0; i < cands.length; i++) {
            if (cands[i] === slug) continue;
            let other = await this.index(cands[i]);
            let k = this.locateIn(other, nums);
            if (k.length) { slug = cands[i]; keys = k; break; }
          }
        }
        let code = this.bySlug(slug) || {};
        let nom = code.nom || slug;
        if (!keys.length) return { failed: true, reason: 'not-in-code', slug: slug, nom: nom };
        let arts = [], status = {};
        for (const k of keys.slice(0, 2)) {
          status[k] = this.status(k, slug);
          if (status[k] === 'abroge') { arts.push({ num: k, abroge: true }); continue; }
          let a = await this.read(k, slug);
          if (a) { a.num = k; arts.push(a); }
          else {
            let loc = await this.localText(k, slug);
            let fromCode = false;
            if (loc) { try { let map = await this.artMap(slug); fromCode = !!(map && map[k]); } catch (e) {} }
            arts.push(loc ? { num: k, text: loc, local: true, fromCode: fromCode } : { num: k, failed: true });
          }
        }
        return { ok: true, arts: arts, numbers: nums, status: status, slug: slug, nom: nom };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    // ---- Ronde 197 : recherche thématique dans le code -------------------------
    // Jusqu'ici, seul un numéro NOMMÉ ("l'article L. 812-1") aidait. Une question
    // sans numéro ("un étranger doit-il justifier de son identité ?") laissait le
    // code inutilisé : la réponse venait du savoir du modèle, sans article. Ici
    // le code lui-même est parcouru - d'abord le chemin de chaque article
    // (livre > titre > chapitre > section), puis le texte des candidats,
    // dans la mesure où il est dans la maison (articles.json). Résultat : les articles
    // concernés, avec numéro, chemin et version.
    _topic: {}, _topicLoading: {},
    // Ronde 197 : le pont lexical. Le code parle en langue administrative, la
    // question en langue quotidienne : il dit « presenter les pieces ou documents ... a
    // toute requisition », elle demande « justifier de son identite ». Mesuré,
    // L. 812-1 se trouvait ainsi au rang 27 : les mots de sa question (etranger, France,
    // sejour, titre) figurent dans presque chaque article, « requisition » dans aucun.
    // Chaque ligne : à gauche les mots de la QUESTION, à droite les mots du CODE. Les deux côtés
    // passent par le même radical (_topicStem) - pure lexicologie, aucun
    // contenu juridique. Mots isolés uniquement (le radical ne connaît pas les espaces).
    LEX: [
      [['identite', 'papier', 'papiers'], ['presenter', 'pieces', 'documents', 'requisition', 'circuler', 'sejourner']],
      [['controle', 'controler', 'verification', 'verifier'], ['presentation', 'pieces', 'documents', 'requisition', 'retenue']],
      [['expulsion', 'expulser', 'expulse'], ['eloignement', 'quitter', 'territoire', 'interdiction', 'reconduite']],
      [['oqtf'], ['eloignement', 'quitter', 'territoire', 'depart']],
      [['retention', 'retenu', 'retenue'], ['retenue', 'residence', 'eloignement']],
      [['asile', 'refugie', 'refugies'], ['asile', 'subsidiaire', 'renvoi', 'internationale']],
      [['naturalisation', 'nationalite'], ['nationalite', 'declaration', 'decret', 'acquisition']],
      [['regularisation', 'regulariser'], ['sejour', 'familiale', 'exceptionnelle']],
      [['mariage', 'epoux', 'epouse'], ['mariage', 'union', 'consentement']],
      [['divorce', 'divorcer'], ['divorce', 'compensatoire', 'separation', 'conjugal']],
      [['heritage', 'heritier', 'succession', 'heriter'], ['succession', 'heritier', 'legs', 'reserve', 'testament']],
      [['loyer', 'locataire', 'bailleur'], ['bail', 'loyer', 'locataire', 'bailleur', 'conge']],
      [['licenciement', 'licencie', 'employeur', 'salaire'], ['salarie', 'travail', 'licenciement', 'remuneration']],
      [['viol', 'violeur'], ['viol', 'sexuelle', 'atteinte', 'consentement']],
      [['vol', 'voler', 'voleur'], ['vol', 'soustraction', 'frauduleuse', 'escroquerie']],
      [['meurtre', 'homicide', 'assassinat'], ['meurtre', 'homicide', 'assassinat']],
      [['avocat', 'defense'], ['avocat', 'juridictionnelle', 'defense']]
    ],
    _lexExpand(qw) {
      try {
        let base = {}, set = {}, add = [];
        for (let i = 0; i < qw.length; i++) { base[qw[i]] = 1; set[qw[i]] = 1; }
        const rows = this.LEX || [];
        for (let r = 0; r < rows.length; r++) {
          let trig = rows[r][0] || [], exp = rows[r][1] || [], hit = false;
          for (let i = 0; i < trig.length && !hit; i++) { if (base[this._topicStem(trig[i])]) hit = true; }
          if (!hit) continue;
          for (let i = 0; i < exp.length; i++) { let st = this._topicStem(exp[i]); if (st && !set[st]) { set[st] = 1; add.push(st); } }
          if (add.length >= 14) break;
        }
        return add;
      } catch (e) { return []; }
    },
    // Ronde 197 : radical propre et COHÉRENT. App.DroitMemo._stem fournit pour
    // la même racine des radicaux différents ("policier" -> "polici", "police" ->
    // "polic"), la question ne trouvait donc pas l'article où figure le mot.
    // Ici, on retire d'abord l'accent, puis une terminaison (la plus longue d'abord),
    // puis on réduit à cinq caractères - les deux côtés passent par la même règle.
    _topicStem(w) {
      let s = String(w == null ? '' : w).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      if (!s) return '';
      const SUF = ['issements', 'issement', 'ements', 'ement', 'ations', 'ation', 'tions', 'tion', 'ances', 'ence', 'ance', 'ieres', 'iere', 'iers', 'ier', 'euses', 'euse', 'es', 's', 'x', 'er', 'ir', 'e'];
      for (let round = 0; round < 2; round++) {
        for (let i = 0; i < SUF.length; i++) {
          const sf = SUF[i];
          if (s.length - sf.length >= 4 && s.slice(-sf.length) === sf) { s = s.slice(0, s.length - sf.length); break; }
        }
      }
      if (s.length >= 3 && s.slice(-2) === 'ee') s = s.slice(0, -1);
      return s.length > 5 ? s.slice(0, 5) : s;
    },
    TOPIC_STOP: null,
    _topicStop() {
      if (this.TOPIC_STOP) return this.TOPIC_STOP;
      let o = {};
      ('doit doit pouvoir peuvent peuvent doivent tout toute tous toutes dans avec sans lors plus moins comment combien devant derriere apres avant entre encore depuis pendant quel quelle quels quelles quand pourquoi ainsi aussi cela ceci celui celle etre avoir etait serait fais fait faire suis sont mesme meme ici dont alors donc car mais pour par sur sous vers chez si non oui son ses leur leurs cette cest quels quoi cas situation question exemple raison sujet parler dire dire sappelle agit concerne quant droit droits loi lois code codes article articles texte textes regle regles disposition dispositions').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      try { if (App.DroitMemo && App.DroitMemo.STOP) for (const k of Object.keys(App.DroitMemo.STOP)) o[k] = 1; } catch (e) {}
      this.TOPIC_STOP = o;
      return o;
    },
    _topicWords(t) {
      let s = String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019']/g, ' ').replace(/[^a-z0-9]+/g, ' ');
      let stop = this._topicStop();
      let self = this;
      let out = [];
      let parts = s.split(' ');
      for (let i = 0; i < parts.length; i++) {
        let w = parts[i];
        if (w.length < 4 || stop[w]) continue;
        let st = self._topicStem(w);
        if (!st || stop[st]) continue;
        out.push(st);
      }
      return out;
    },
    _topicNorm(t) {
      return ' ' + String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    },
    // Suites de 2 et 3 mots de la question (pour les correspondances de phrases dans le chemin).
    _spans(qw) {
      let out = [];
      for (let n = 3; n >= 2; n--) { for (let i = 0; i + n <= qw.length; i++) out.push(qw.slice(i, i + n).join(' ')); }
      return out;
    },
    async topicIndex(slug, withText) {
      let key = slug + (withText ? '|t' : '|p');
      if (this._topic[key]) return this._topic[key];
      if (this._topicLoading[key]) return this._topicLoading[key];
      let self = this;
      let code = this.bySlug(slug);
      if (!code) return null;
      let p = (async function () {
        let idx = await self.index(slug);
        if (!idx) return null;
        let texts = {};
        if (withText) { try { let map = await self.artMap(slug); if (map) texts = map; } catch (e) {} }
        let docs = [];
        let refs = {};
        let paths = idx.paths || {};
        for (const num of Object.keys(idx.articles)) {
          // Ronde 197 : les parenthèses "(Articles L812-1 a L812-6)" dans le chemin ne sont
          // pas du contenu - elles n'apportaient que "artic", "l812", "1", "a", "6" dans
          // l'index et diluaient le comptage.
          let path = String(paths[num] || '').replace(/\((?:Articles?|Article)[^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
          let raw = withText ? String(texts[num] || '') : '';
          if (raw) { let r = self._refs(raw); if (r.length) refs[num] = r; }
          docs.push({ num: num, path: path, pw: self._topicWords(path), tw: self._topicWords(raw.slice(0, 9000)), hasText: !!raw });
        }
        let df = {};
        for (const d of docs) {
          let seen = {};
          let all = d.pw.concat(d.tw);
          for (let i = 0; i < all.length; i++) { let w = all[i]; if (seen[w]) continue; seen[w] = 1; df[w] = (df[w] || 0) + 1; }
        }
        let refsInv = {};
        for (const num of Object.keys(refs)) {
          let rs = refs[num];
          for (let i = 0; i < rs.length; i++) { (refsInv[rs[i]] = refsInv[rs[i]] || []).push(num); }
        }
        let e = { docs: docs, df: df, N: docs.length || 1, withText: docs.filter(function (d) { return d.hasText; }).length, idx: idx, refs: refs, refsInv: refsInv, norms: null };
        self._topic[key] = e;
        console.log('[DroitLookup] index thématique ' + (code.nom || slug) + (withText ? ' (chemin + texte intégral)' : ' (chemin)') + ':', e.N, 'articles,', e.withText, 'avec texte');
        return e;
      })();
      this._topicLoading[key] = p;
      return p;
    },
    // Ronde 197 : les renvois d'un article ("a l'occasion d'un controle
    // mentionne a l'article L. 812-2"). Un article ne dit souvent pas lui-même de quoi
    // il s'agit, mais renvoie à celui qui le dit. La chaîne qui répond vraiment à la
    // question va L813-2 -> L813-1 -> L812-2 -> L812-1.
    _refs(t) {
      let out = [], seen = {};
      try {
        const re = /(?:^|[^a-z0-9])((?:[lrd])\.?\s?\d{1,4}\s?-\s?\d{1,3})(?![0-9])/gi;
        let m, s = String(t || '');
        while ((m = re.exec(s))) {
          let n = String(m[1]).toUpperCase().replace(/[.\s]/g, '');
          if (!seen[n]) { seen[n] = 1; out.push(n); }
          if (out.length >= 40) break;
        }
      } catch (e) {}
      return out;
    },
    // Ronde 197 : ce sont les mots rares qui décident, pas ceux qui figurent partout.
    // D'où de l'idf AU CARRÉ, une compensation de longueur pour le texte de l'article (les longs
    // articles finissent sinon par tout nommer) et un bonus quand plusieurs des
    // mots les PLUS RARES de la question figurent dans le même article.
    _scoreDoc(d, qw, soft, e) {
      let sc = 0, matched = 0;
      const idf = function (w) { return Math.log(1 + e.N / (1 + (e.df[w] || 0))); };
      let tokens = d.tw.length;
      let textFactor = 1 / (1 + Math.log(1 + tokens / 260));
      let seen = {};
      for (let i = 0; i < qw.length; i++) {
        let w = qw[i];
        if (seen[w]) continue; seen[w] = 1;
        let g = Math.pow(idf(w), 2);
        let inP = d.pw.indexOf(w) >= 0, inT = d.tw.indexOf(w) >= 0;
        if (inP) { sc += g; matched++; }
        if (inT) { sc += 0.55 * g * textFactor; if (!inP) matched++; }
      }
      // Ronde 197 : les mots du pont lexical ne comptent qu'environ à moitié et ne remplissent
      // pas le bonus de résultat. Sinon « presenter des pieces » tirerait chaque
      // article sur les papiers d'étrangers vers le haut (mesuré : R414-2, le
      // document pour mineurs, se trouvait ainsi au rang 3).
      if (soft && soft.length) {
        let seen2 = {};
        for (let i = 0; i < soft.length; i++) {
          let w = soft[i];
          if (seen2[w] || seen[w]) continue; seen2[w] = 1;
          let g = Math.pow(idf(w), 2) * 0.45;
          if (d.pw.indexOf(w) >= 0) sc += g;
          if (d.tw.indexOf(w) >= 0) sc += 0.55 * g * textFactor;
        }
      }
      if (matched >= 2) sc += 1.0 * matched;
      return sc;
    },
    // Si la question ne nomme aucun numéro : trouver les articles par chemin et texte.
    async searchTopic(text) {
      if (!this.isEnabled()) return { failed: true, reason: 'disabled' };
      try {
        await this.registry();
        let qwBase = this._topicWords(text).filter(function (w, i, a) { return a.indexOf(w) === i; }).slice(0, 22);
        if (qwBase.length < 2) return { failed: true, reason: 'no-topic' };
        // Ronde 197 : le pont lexical uniquement pour l'évaluation À L'INTÉRIEUR du code.
        // Le choix du code (étape 1) se fait avec les vrais mots de la question, sinon
        // le vocabulaire d'un code attirerait une question dans le mauvais.
        let lex = this._lexExpand(qwBase);
        let qw = qwBase.concat(lex).slice(0, 34);
        if (lex.length) console.log('[DroitLookup] pont lexical :', lex.join(', '));
        let named = this.detect(text);
        let slug = named;
        // Étape 1 : quel CODE ? (seulement s'il n'en nomme aucun). Ronde 198 : à partir
        // de la question quotidienne, le code est déterminé par son propre champ lexical
        // (champ "words" dans le registre) : "voisin, mur, terrain" -> Code civil,
        // "licenciement, preavis" -> Code du travail, "garde a vue,
        // perquisition" -> procédure pénale. Aucun index ne doit être chargé pour cela,
        // et un mot comme "construction" ne peut plus tirer une question dans le mauvais
        // code. Si aucun champ lexical n'est trouvé, elle dit plutôt que son
        // corpus ne couvre pas la question (et interroge ensuite la GBD).
        if (!slug) {
          slug = this.route(text);
          if (slug) console.log('[DroitLookup] domaine issu du champ lexical :', slug);
          else console.log('[DroitLookup] aucun domaine dans le champ lexical');
        }
        if (!slug) return { failed: true, reason: 'topic-empty' };
        // Étape 2 : évaluer tous les articles DE CE code (chemin + texte).
        let e = await this.topicIndex(slug, true);
        if (!e) return { failed: true, reason: 'topic-no-code' };
        let scored = [];
        for (let i2 = 0; i2 < e.docs.length; i2++) {
          let sc = this._scoreDoc(e.docs[i2], qwBase, lex, e);
          if (sc > 0) scored.push({ d: e.docs[i2], sc: sc });
        }
        if (!scored.length) return { failed: true, reason: 'topic-empty' };
        scored.sort(function (a, b) { return b.sc - a.sc; });
        let topScore = scored[0].sc;
        if (topScore < 8) return { failed: true, reason: 'topic-weak', top: Math.round(topScore) };
        // Ronde 197 : les renvois, dans les deux sens. Un article pointe souvent
        // vers celui qui répond vraiment à la question ("a l'occasion d'un controle
        // mentionne a l'article L. 812-2"). En avant (0,72) : ce que les meilleurs
        // articles nomment eux-mêmes. En arrière (0,60) : qui pointe vers eux - cela va
        // chercher les articles suivants (L. 813-1 "en cas de controle" pointe vers L. 812-2).
        let idx = e.idx || null;
        if (idx && (e.refs || e.refsInv)) {
          let known = {};
          for (let i2 = 0; i2 < scored.length; i2++) known[scored[i2].d.num] = 1;
          let extra = [];
          const push = function (num, sc, via) {
            let key = this.resolveKey(idx, num);
            if (!key || known[key]) return;
            if (this.status(key, slug) !== 'en-vigueur') return;
            known[key] = 1;
            extra.push({ d: { num: key, path: (idx.paths || {})[key] || '', via: via }, sc: sc });
          }.bind(this);
          for (let k = 0; k < Math.min(5, scored.length); k++) {
            let src = scored[k], rs = (e.refs && e.refs[src.d.num]) || [];
            for (let i2 = 0; i2 < rs.length; i2++) {
              push(rs[i2], src.sc * 0.72, src.d.num);
            }
          }
          for (let k = 0; k < Math.min(2, scored.length); k++) {
            let src = scored[k], rs = (e.refsInv && e.refsInv[src.d.num]) || [];
            for (let i2 = 0; i2 < rs.length && i2 < 6; i2++) push(rs[i2], src.sc * 0.60, src.d.num);
          }
          if (extra.length) {
            scored = scored.concat(extra);
            scored.sort(function (a, b) { return b.sc - a.sc; });
            console.log('[DroitLookup] Querverweise:', extra.map(function (x) { return x.d.num + ' <- ' + x.d.via; }).join(', '));
          }
        }
        // Étape 3 : le cœur et son voisinage. D'abord le cœur : les articles
        // qui sont presque aussi proches de la question que le meilleur (70 % de son
        // score). Puis le voisinage du cœur dans le plan du code - le code
        // est une table des matières ; qui se trouve dans le même livre/titre ou chapitre
        // appartient à la même question. Ainsi L813-1 à L813-3 sont venus s'ajouter à L812-1/2,
        // sans qu'un article sur les documents de voyage pour mineurs
        // (R414-2, proche linguistiquement, étranger sur le fond) ne vienne avec.
        const region = function (p, n) { return String(p || '').split(' > ').slice(0, n).join(' > '); };
        let seeds = [];
        for (let k = 0; k < scored.length && seeds.length < 4; k++) { if (scored[k].sc >= topScore * 0.7) seeds.push(scored[k]); }
        if (!seeds.length) seeds.push(scored[0]);
        let reg = {};
        for (let k = 0; k < seeds.length; k++) {
          let k3 = region(seeds[k].d.path, 3), k4 = region(seeds[k].d.path, 4);
          if (k3) reg['3|' + k3] = Math.max(reg['3|' + k3] || 0, seeds[k].sc);
          if (k4) reg['4|' + k4] = Math.max(reg['4|' + k4] || 0, seeds[k].sc);
        }
        let cand = [], seen2 = {};
        for (let k = 0; k < scored.length; k++) {
          let it = scored[k];
          let k3 = region(it.d.path, 3), k4 = region(it.d.path, 4);
          let keep = (reg['3|' + k3] && it.sc >= reg['3|' + k3] * 0.5) || (reg['4|' + k4] && it.sc >= reg['4|' + k4] * 0.35);
          if (keep) { cand.push(it); seen2[it.d.num] = 1; }
          if (cand.length >= 40) break;
        }
        for (let k = 0; k < scored.length && cand.length < 6; k++) {
          let it = scored[k];
          if (!seen2[it.d.num]) { cand.push(it); seen2[it.d.num] = 1; }
        }
        cand = cand.slice(0, 8);
        let code = this.bySlug(slug) || {};
        let arts = [];
        // Ronde 197 : dans la recherche thématique, on ne lit en direct chez Legifrance
        // que de façon limitée. Les articles sont dans la maison (articles.json) ; s'il en manque
        // un, il est rattrapé - mais au plus quatre, sinon un tour dure
        // vingt secondes et Legifrance abandonne.
        let liveReads = 0;
        for (let k = 0; k < cand.length; k++) {
          let num = cand[k].d.num;
          let txt = await this.localText(num, slug);
          let local = !!txt, env = '', fromCode = false, mdate = '', mod = '';
          if (txt) {
            try { let map = await this.artMap(slug); fromCode = !!(map && map[num]); } catch (e) {}
            // Ronde 198 : la date de version et l'origine se trouvent maintenant dans la maison (depuis la
            // source XML), pour que le bloc puisse dire depuis quand le texte s'applique.
            let mm = (this._artMeta[slug] || {})[num];
            if (mm) { mdate = mm.d || ''; mod = mm.m || ''; }
          }
          if (!txt && liveReads < 4) { liveReads++; let a = await this.read(num, slug); if (a) { txt = a.text; env = a.env || ''; } }
          if (txt) arts.push({ num: num, text: txt, local: local, fromCode: fromCode, env: env, date: mdate, mod: mod, topic: true, via: cand[k].d.via || '' });
        }
        if (!arts.length) return { failed: true, reason: 'topic-read-failed' };
        console.log('[DroitLookup] Themensuche ' + slug + ':', arts.map(function (a) { return a.num; }).join(', '));
        return { ok: true, arts: arts, numbers: [], status: {}, slug: slug, nom: code.nom || slug, topic: true, terms: qw.slice(0, 10), score: Math.round(topScore) };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    // Où l'article se trouve dans le code. Les index des nouveaux codes portent le chemin
    // eux-mêmes (champ "paths") ; le Code civil non - pour lui, le
    // plan officiel du dossier (App.DroitMemo) sert de source.
    pathOf(slug, num) {
      try {
        let s = slug || this.DEFAULT;
        let idx = this._idx[s];
        if (idx && idx.paths && idx.paths[num]) return idx.paths[num];
        if (s !== this.DEFAULT) return '';
        if (!App.DroitMemo || !App.DroitMemo._data) return '';
        if (!this._planIdx) {
          let map = {};
          App.DroitMemo._data.sections.forEach(s2 => {
            if (s2.k !== 'plan') return;
            let x = String(s2.x || '');
            let cm = /Chemin complet : ([^\n]+)/.exec(x);
            let path = cm ? cm[1] : s2.t;
            let am = /Articles directs \([^)]*\) : ([^\n]+)/.exec(x);
            if (!am) return;
            am[1].split(',').forEach(function (v) {
              let n = v.trim().replace(/ \(abrog[eé]\)$/, '');
              if (n && !map[n]) map[n] = path;
            });
          });
          this._planIdx = map;
        }
        return this._planIdx[num] || '';
      } catch (e) { return ''; }
    },
    planPath(num) { return this.pathOf(this.DEFAULT, num); },
    // Le texte fourni, quand Legifrance ne répond pas.
    async localText(num, slug) {
      try {
        let s = slug || this.DEFAULT;
        if (App.DroitMemo && App.DroitMemo._data) {
          let hit = App.DroitMemo._data.sections.filter(function (x) { return x.t === 'Article ' + num; })[0];
          if (hit) return hit.x;
        }
        let map = await this.artMap(s);
        return (map && map[num]) || null;
      } catch (e) { return null; }
    },
    local(num) { return this.localText(num, this.DEFAULT); },
    // Ronde 197 : un texte d'article ne se termine jamais au milieu d'un mot. L'essai montrait
    // "autoris..." et "en u" - cela se lit comme une citation interrompue.
    _cut(t, n) {
      let s = String(t == null ? '' : t);
      if (s.length <= n) return s;
      let head = s.slice(0, n);
      let sp = head.lastIndexOf(' ');
      if (sp > n * 0.6) head = head.slice(0, sp);
      return head.replace(/[\s,;:]+$/, '') + ' […]';
    },
    buildBlock(res) {
      try {
        if (!res || res.failed || !res.arts || !res.arts.length) return '';
        let nom = res.nom || 'Code civil';
        let slug = res.slug || this.DEFAULT;
        let topic = !!res.topic;
        let body = [], read = [], live = false, fromFiche = false;
        let rank = 0;
        for (const a of res.arts) {
          rank++;
          if (a.abroge) {
            body.push('ATTENTION : le numero ' + a.num + ' correspond a un article ABROGE du ' + nom + '. Cherche ce qui l\'a remplace et dis-le ; ne presente pas ce numero comme une regle en vigueur.');
            continue;
          }
          let plan = this.pathOf(slug, a.num);
          let chemin = plan || ((a.path && a.path.length) ? a.path.join(' > ') : '');
          chemin = String(chemin).replace(/\((?:Articles?|Article)[^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
          // Ronde 197 : seulement les deux dernières étapes (chapitre > section) et chacune
          // raccourcie - sinon le même chemin de 175 caractères figurait devant chacun des neuf
          // articles et mangeait la place des textes d'articles.
          if (topic && chemin) chemin = chemin.split(' > ').slice(-2).map(function (p) { return p.length > 62 ? p.slice(0, 60) + '…' : p; }).join(' > ');
          else if (chemin.length > 175) chemin = chemin.slice(0, 173) + '...';
          let where = nom + (chemin ? ', ' + chemin : '') + ((topic && a.via) ? ' [montre par l\'article ' + a.via + ']' : '');
          if (a.text && !a.local) {
            live = true;
            body.push('--- Article ' + (a.num || '?') + ' (' + where + ')' + (topic ? ' [rang ' + rank + ']' : '')
              + (a.env ? ' [version en vigueur depuis le ' + a.env + ']' : '')
              + (a.date ? '\nModification : ' + a.date : '')
              + '\n' + this._cut(a.text, topic ? this.MAX_TOPIC : this.MAX_TOTAL));
            if (a.url) read.push(a.url);
          } else if (a.text) {
            fromFiche = true;
            // Ronde 197 : la légende disait « Legifrance n'a pas repondu » -
            // neuf fois de suite. Sofia lisait cela comme une source incertaine et
            // ne citait donc plus AUCUN article, alors que le texte était devant
            // elle. Le texte provient du fichier du code (chargé depuis Legifrance) ;
            // il est nommé comme tel, pas comme expédient.
            body.push('--- Article ' + a.num + ' (' + where + ')' + (topic ? ' [rang ' + rank + ']' : '') + ' '
              + (a.fromCode ? '[texte officiel du code, repris du fichier du code]' : '[texte repris de la fiche, non relu sur Legifrance]')
              + (a.date ? ' [derniere modification : ' + a.date + (a.mod ? ' - ' + a.mod : '') + ']' : '')
              + '\n' + this._cut(a.text, topic ? this.MAX_TOPIC : this.MAX_TOTAL));
          } else {
            body.push('L\'article ' + a.num + ' du ' + nom + ' n\'a pas pu etre lu (ni sur Legifrance, ni dans la fiche livree). Dis-le et n\'invente pas son texte.');
          }
        }
        let L = [];
        if (topic) {
          L.push('[' + nom.toUpperCase() + ' - ARTI[ée] QUE LA RECHERCHE PAR MOTS A TROUVES POUR SA QUESTION' + (live ? ' - lus sur Legifrance' : ' - texte officiel du code, repris du fichier du code') + ']');
          L.push('Sa question ne nommait aucun article : elle a donc cherche elle-meme dans le code, mot par mot, et les articles ci-dessous sont CLASSEES - le rang 1 est le plus proche de sa question, [montre par l\'article ...] signale ceux vers lesquels un autre article renvoie. Commence par les premiers rangs et dis lesquels repondent vraiment. Reponds a partir de LEUR texte, cite chaque numero exact avec le nom du code, et si un article dont tu aurais besoin n\'est pas ici, nomme celui qu\'il faudrait lire.');
        } else if (live) L.push('[' + nom.toUpperCase() + ' - TU VIENS DE LIRE CET ARTICLE TOI-MEME SUR LEGIFRANCE]');
        else if (fromFiche) L.push('[' + nom.toUpperCase() + ' - ARTICLE REPRIS DE LA FICHE LIVREE (Legifrance n\'a pas repondu)]');
        else L.push('[' + nom.toUpperCase() + ' - ARTICLE DEMANDE, NON LU]');
        L = L.concat(body);
        if (read.length) L.push('Source : Legifrance (Dila), ' + read.join(' , ') + '. Cite le numero exact et la date de la version, et nomme Legifrance.');
        if (nom === 'Code civil') {
          L.push('Regles : tu informes sur le droit, tu ne donnes pas de conseil juridique personnalise. Ne cite pas un article dont tu n\'as pas le texte ; si un point manque, dis-le. Depuis le 1er octobre 2016, l\'ancien article 1382 est devenu 1240 (le numero 1382 parle maintenant de la preuve). Pour un cas personnel, renvoie a un avocat, un notaire ou un juriste. Texte ordinaire, sans emoji ni LaTeX.');
        } else {
          L.push('Regles : tu informes sur le droit, tu ne donnes pas de conseil juridique personnalise. Ne cite pas un article dont tu n\'as pas le texte ; si un point manque, dis-le. Nomme le code exact dont vient l\'article et ne melange pas les codes. Pour un cas personnel, renvoie a un avocat, un notaire ou un juriste. Texte ordinaire, sans emoji ni LaTeX.');
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  };
  // =====================================================================================
  // Ronde 283 (27 septembre 2026) — LE CORPUS JURIDIQUE SE SURVEILLE LUI-MÊME.
  // Le propriétaire : « tous les 15 jours il faut mettre les codes de Legifrance à jour
  // dans ta base de données. »
  //
  // Deux pièces, et une seule règle : ne refaire que ce qui a bougé.
  //
  //   (1) App.DroitFresh — LE GUET. Il lit l'index public de codes.droit.org (une page de
  //       75 Ko — la source même qui a nourri le corpus en ronde 277) et compare, code par
  //       code, la date « data-modif » de la source à celle que porte notre prélèvement
  //       (champ « codes » de src/droit/remote.json, relevé sur le champ « lastup » de
  //       chaque index). Aucun code n'est téléchargé pour savoir s'il a changé.
  //
  //   (2) App.DroitUpdate — LA MISE À JOUR. Pour chaque code dont la source a bougé : le XML
  //       officiel est relu chez codes.droit.org, reconstruit par le MÊME outil que la ronde
  //       277 (src/droit/build-codes.mjs, importé tel quel), ses deux fichiers .gz (index +
  //       texte des articles) sont redéposés à l'hébergement, et la table du corpus est
  //       corrigée en mémoire — les fichiers relus sont gardés dans le navigateur ; la copie
  //       de référence de src/ n'est pas touchée (elle se refait en atelier).
  //
  // Quand : une vérification au plus toutes les six heures par navigateur ; une passe de mise
  // à jour quand le corpus a MIN_DAYS (15) jours, et chez le propriétaire seulement — la passe
  // télécharge et redépose des fichiers, c'est donc son quota, pas celui du visiteur. Chez les
  // autres, le corpus reste celui de la maison, et Sofia continue de lire l'article en direct
  // chez Legifrance comme avant.
  App.DroitFresh = {
    INDEX_URL: 'https://codes.droit.org/',
    MIN_DAYS: 15,
    CHECK_MS: 6 * 3600 * 1000,
    KEY: 'sofia_droit_fresh_v1',
    _src: null, _srcAt: 0,
    read() {
      try { return JSON.parse(localStorage.getItem(this.KEY) || 'null') || {}; }
      catch (e) { return {}; }
    },
    write(o) { try { localStorage.setItem(this.KEY, JSON.stringify(o)); } catch (e) {} },
    doc() { return (App.DroitLookup && App.DroitLookup._remoteDoc) || null; },
    ageDays() {
      let d = this.doc(), t = d && d.at ? Date.parse(d.at) : NaN;
      if (!isFinite(t)) return null;
      return Math.max(0, Math.floor((Date.now() - t) / 86400000));
    },
    // L'index de la source, lu en entier une fois (six heures de mémoire).
    async source(force) {
      if (!force && this._src && (Date.now() - this._srcAt) < this.CHECK_MS) return this._src;
      if (!root || typeof root.superFetch !== 'function') throw new Error('superFetch indisponible');
      let html = await App.Core.proxyFetch(this.INDEX_URL, { timeoutMs: 45000 }).then(function (r) { return r.text(); });
      let doc = new DOMParser().parseFromString(html, 'text/html');
      let list = [];
      doc.querySelectorAll('dl[data-name]').forEach(function (dl) {
        let dt = dl.querySelector('dt.nom') || dl.querySelector('dt');
        let nom = (dt ? dt.textContent : '').replace(/\s*\(20\d\d-\d\d-\d\d\)\s*$/, '').replace(/\s+/g, ' ').trim();
        let modif = String(dl.getAttribute('data-modif') || '').slice(0, 10);
        if (nom) list.push({ nom: nom, modif: modif, edit: dl.getAttribute('data-edit') || '', weight: parseInt(dl.getAttribute('data-weight') || '0', 10) || 0 });
      });
      if (!list.length) throw new Error('index de codes.droit.org illisible');
      this._src = list; this._srcAt = Date.now();
      return list;
    },
    // Le guet : quels codes ont bougé chez la source depuis notre prélèvement ?
    async check(force) {
      let D = App.DroitLookup;
      let doc = this.doc();
      if (!doc || !doc.codes) { try { await D.remote(); } catch (e) {} doc = this.doc(); }
      let list = await this.source(force);
      let byNom = {};
      list.forEach(function (s) { byNom[s.nom.toLowerCase()] = s; });
      let codes = (doc && doc.codes) || {};
      let sn = App.DroitUpdate ? App.DroitUpdate.seen() : {};
      let behind = [], unknown = [];
      for (let slug in codes) {
        let rec = codes[slug];
        if (!rec || rec.nom == null || rec.source === 'eur-lex') continue;
        let s = byNom[String(rec.nom).toLowerCase()];
        if (!s) { unknown.push(slug); continue; }
        let mine = (sn[slug] && sn[slug].see) || rec.seen || rec.lastup || '';
        if (s.modif && s.modif !== mine) behind.push({ slug: slug, nom: rec.nom, ours: mine, theirs: s.modif });
      }
      let out = { at: Date.now(), source: list.length, ageDays: this.ageDays(), behind: behind, unknown: unknown };
      let w = this.read();
      w.checkedAt = out.at; w.behind = behind.length; w.unknown = unknown.length;
      this.write(w);
      if (behind.length) console.log('[DroitFresh] ' + behind.length + ' code(s) modifiés chez la source depuis le prélèvement : ' + behind.map(function (b) { return b.slug + ' (' + b.ours + ' -> ' + b.theirs + ')'; }).join(', '));
      else console.log('[DroitFresh] corpus à jour : ' + list.length + ' code(s) chez la source, aucun modifié depuis le prélèvement du ' + ((doc && doc.at) ? String(doc.at).slice(0, 10) : '?') + ' (' + out.ageDays + ' jour(s))');
      return out;
    },
    // La phrase que Sofia reçoit quand le texte qu'elle lit vient du fichier du corpus et
    // que celui-ci a de l'âge (ou qu'un code a bougé).
    line() {
      let age = this.ageDays();
      let st = this.read();
      let behind = st.behind || 0;
      if (age == null) return '';
      if (age < this.MIN_DAYS && !behind) return '';
      let d = this.doc();
      let s = 'Fraîcheur du corpus : le texte fourni vient du relevé des codes fait le ' + ((d && d.at) ? String(d.at).slice(0, 10) : '?') + ', il y a ' + age + ' jour(s)';
      if (behind) s += ' ; ' + behind + ' code(s) ont été modifiés chez la source (codes.droit.org, qui recopie Legifrance) depuis ce relevé';
      return s + '. Cite la date de version que porte l\'article ; si un point a changé depuis, la lecture en direct chez Legifrance fait foi — dis-le alors simplement.';
    },
    // Au démarrage : guetter, puis mettre à jour si c'est le moment et si c'est le propriétaire.
    async ensure(force) {
      try {
        if (!App.DroitLookup || !App.DroitLookup.isEnabled()) return null;
        let w = this.read();
        if (!force && w.checkedAt && (Date.now() - w.checkedAt) < this.CHECK_MS) return { skipped: true };
        let res = await this.check(force);
        if (res.behind.length) {
          let owner = false;
          try {
            let m = (App.Access && typeof App.Access.mode === 'function') ? App.Access.mode() : '';
            // « owner » : la page publiée, sur l'appareil du propriétaire.
            // « preview » : l'atelier, c'est-à-dire lui encore, en train de travailler le code.
            // Un visiteur (essai, invité) ne relit rien : la passe télécharge et redépose.
            owner = (m === 'owner' || m === 'preview');
          } catch (e) {}
          if (owner && App.DroitUpdate) await App.DroitUpdate.due(res, force);
          else console.log('[DroitFresh] ' + res.behind.length + ' code(s) en retard chez la source — la mise à jour se fait chez le propriétaire.');
        }
        return res;
      } catch (e) { console.warn('[DroitFresh] guet impossible :', e && e.message); return null; }
    }
  };
  App.DroitUpdate = {
    MAX_PER_RUN: 4,
    OV_KEY: 'sofia_droit_files_v1',
    SEEN_KEY: 'sofia_droit_seen_v1',
    _mod: null,
    // L'outil de la ronde 277, importé tel quel : une seule vérité pour lire le XML.
    async parser() {
      if (this._mod) return this._mod;
      let r = await fetch('src/droit/build-codes.mjs', { cache: 'force-cache' });
      if (!r.ok) throw new Error('build-codes.mjs illisible (' + r.status + ')');
      let url = URL.createObjectURL(new Blob([await r.text()], { type: 'text/javascript' }));
      this._mod = await import(url);
      return this._mod;
    },
    overrides() { try { return JSON.parse(localStorage.getItem(this.OV_KEY) || 'null') || {}; } catch (e) { return {}; } },
    seen() { try { return JSON.parse(localStorage.getItem(this.SEEN_KEY) || 'null') || {}; } catch (e) { return {}; } },
    saveSeen(o) { try { localStorage.setItem(this.SEEN_KEY, JSON.stringify(o)); } catch (e) {} },
    async gzip(text) {
      let stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
      return new Blob([await new Response(stream).arrayBuffer()], { type: 'application/gzip' });
    },
    // Un code, de bout en bout : relu chez la source, reconstruit, rendu en
    // téléchargements. 100 % GitHub : plus aucun dépôt sur l'hébergeur Perchance —
    // le propriétaire commite les 2 fichiers dans le dépôt (chemins exacts
    // annoncés en console) et le corpus les lit dès la mise en ligne.
    async one(slug) {
      let D = App.DroitLookup;
      let doc = App.DroitFresh.doc();
      let rec = (doc && doc.codes && doc.codes[slug]) || null;
      let code = D.bySlug(slug);
      let nom = (rec && rec.nom) || (code && code.nom);
      if (!nom) throw new Error('code inconnu : ' + slug);
      let t0 = Date.now();
      let xml = await App.Core.proxyFetch('https://codes.droit.org/payloads/' + encodeURIComponent(nom) + '.xml', { timeoutMs: 90000 })
        .then(function (r) { return r.text(); });
      if (!xml || xml.length < 2000) throw new Error('XML vide pour ' + nom);
      let M = await this.parser();
      let made = M.makeFiles(M.parseCodeXML(xml), { nom: nom });
      if (!made.count) throw new Error('aucun article lu dans ' + nom);
      let sec = Math.round((Date.now() - t0) / 1000);
      this._download(await this.gzip(JSON.stringify(made.indexFile)), 'index.json.gz');
      this._download(await this.gzip(JSON.stringify(made.articlesFile)), 'articles.json.gz');
      console.log('[DroitUpdate] ' + nom + ' : ' + made.count + ' articles' + (made.abrogated ? ', ' + made.abrogated + ' abrogés' : '') + ', version du ' + (made.indexFile.lastup || '?') + ' — reconstruit en ' + sec + ' s. COMMITE les 2 fichiers téléchargés dans le dépôt GitHub sous src/droit/' + slug + '/ (index.json.gz, articles.json.gz), puis recharge : aucune URL Perchance ne subsiste.');
      return { slug: slug, nom: nom, n: made.count, abrogated: made.abrogated, lastup: made.indexFile.lastup || '', sec: sec, github: ['src/droit/' + slug + '/index.json.gz', 'src/droit/' + slug + '/articles.json.gz'] };
    },
    // Propose un fichier en téléchargement (mise à jour du corpus : le
    // propriétaire commite ensuite dans le dépôt GitHub, au chemin annoncé).
    _download(blob, name) {
      try {
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = String(name == null ? 'fichier.bin' : name);
        document.body.appendChild(a); a.click();
        setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 10000);
      } catch (e) { console.warn('[DroitUpdate] téléchargement impossible : ' + name); }
    },
    // Une passe : les codes en retard, si le corpus a MIN_DAYS jours (ou si on le demande).
    async due(res, force) {
      let behind = (res && res.behind) || [];
      let age = res ? res.ageDays : null;
      if (!behind.length) {
        if (force) console.log('[DroitUpdate] rien à relire : aucun code n\'a changé chez la source');
        return [];
      }
      if (!force && !(age >= App.DroitFresh.MIN_DAYS)) {
        console.log('[DroitUpdate] ' + behind.length + ' code(s) ont changé chez la source, mais le corpus n\'a que ' + age + ' jour(s) : la passe aura lieu à ' + App.DroitFresh.MIN_DAYS + ' jours (ou dis « mets à jour les codes »).');
        return [];
      }
      return await this.run(behind.map(function (b) { return b.slug; }).slice(0, this.MAX_PER_RUN));
    },
    async run(slugs, opts) {
      let o = opts || {};
      let out = [];
      for (let i = 0; i < slugs.length; i++) {
        try { out.push(await this.one(slugs[i])); }
        catch (e) { console.warn('[DroitUpdate] ' + slugs[i] + ' a échoué :', e && e.message); out.push({ slug: slugs[i], nom: (App.DroitLookup.bySlug(slugs[i]) || {}).nom, error: String((e && e.message) || e) }); }
      }
      let ok = out.filter(function (x) { return !x.error; });
      let w = App.DroitFresh.read();
      w.ranAt = Date.now(); w.ranCodes = ok.length;
      App.DroitFresh.write(w);
      if (ok.length) {
        let txt = 'Corpus juridique mis à jour : ' + ok.length + ' code(s) relus chez la source — ' + ok.map(function (x) { return x.nom + ' (' + x.n + ' articles)'; }).join(', ') + '.';
        console.log('[DroitUpdate] ' + txt);
        if (!o.silent && App.Notice && App.Notice.show) { try { App.Notice.show('droit-fresh', { text: txt, tone: 'info', duration: 12000 }); } catch (e) {} }
      }
      return out;
    },
    // Une relecture complète des 78 codes — lourde (357 Mo relus, ~40 Mo redéposés) :
    // réservée à l'atelier, jamais déclenchée par une phrase.
    async runAll() {
      let doc = App.DroitFresh.doc() || {};
      let slugs = Object.keys(doc.codes || {}).filter(function (k) { return doc.codes[k].source !== 'eur-lex'; });
      console.log('[DroitUpdate] relecture complète : ' + slugs.length + ' code(s)');
      return await this.run(slugs, { silent: true });
    },
    // « mets à jour les codes » — la passe demandée à la main par le propriétaire.
    asked(text) {
      let s = String(text == null ? '' : text).toLowerCase().trim();
      // Une question (« quelle est la dernière mise à jour du code de la route ? ») n'est
      // pas un ordre : elle se contente d'une réponse, pas d'une passe de mise à jour.
      if (/^(quel|quelle|quels|quelles|quand|est-?ce|combien|pourquoi|comment|où|as-?tu|tu as)/.test(s)) return false;
      if (!/(mets?[- ]?(?:à|a) jour|mettre à jour|mettez à jour|mise à jour|actualise|rafra[iî]chis|recharge|fais (?:la|une) mise à jour)/.test(s)) return false;
      return /code|loi|l[ée]gifrance|corpus|juridique/.test(s);
    },
    async askedRun(text) {
      let st = await App.DroitFresh.check(true);
      let out = await this.due(st, true);
      let ok = out.filter(function (x) { return !x.error; });
      let ko = out.filter(function (x) { return x.error; });
      let doc = App.DroitFresh.doc();
      let L = ['[MISE À JOUR DU CORPUS JURIDIQUE — c\'est TOI qui viens de la faire, à sa demande]'];
      if (ok.length) {
        L.push('Tu as relu chez la source (codes.droit.org, qui recopie Legifrance/Dila) et reconstruit ' + ok.length + ' code(s) (fichiers téléchargés : dis de les commiter sur GitHub sous src/droit/<code>/ — index.json.gz et articles.json.gz — puis de recharger) :');
        ok.forEach(function (x) { L.push('- ' + x.nom + ' : ' + x.n + ' articles en vigueur' + (x.abrogated ? ', ' + x.abrogated + ' abrogés' : '') + (x.lastup ? ', version du ' + x.lastup : '')); });
        L.push('Dis-le en deux ou trois phrases, simplement, nomme les codes relus et leur version. Pas d\'emoji, pas de tableau.');
      } else if (ko.length) {
        L.push('La relecture a échoué pour : ' + ko.map(function (x) { return (x.nom || x.slug) + ' (' + x.error + ')'; }).join(', ') + '. Dis-le franchement en une phrase, sans excuse.');
      } else {
        L.push('Rien à relire : sur les ' + st.source + ' codes de la source, aucun n\'a changé depuis le prélèvement du ' + ((doc && doc.at) ? String(doc.at).slice(0, 10) : '?') + '. Dis-le en une phrase, et ne prétends pas avoir relu un code.');
      }
      return L.join('\n');
    },
    // Ronde 283 : ce que le tour doit dire en conclusion saillante (fin d'assemblage).
    // Deux choses y entrent : le compte rendu de la passe de mise à jour demandée à la main,
    // et — si le texte du code vient du fichier du corpus — son âge. Un ordre court placé
    // au milieu d'un prompt de 100 000 caractères se noie ; ici, il est lu en dernier.
    takeNote() {
      let NL = String.fromCharCode(10);
      let L = [];
      if (this._note) { L.push(this._note); this._note = ''; }
      try {
        let dp = App.DroitLookup && App.DroitLookup._pending;
        let fromFile = !!(dp && (dp.arts || []).some(function (a) { return a && a.text && a.local; }));
        if (fromFile && App.DroitFresh && App.DroitFresh.line) {
          let fl = App.DroitFresh.line();
          if (fl) L.push('[FRAÎCHEUR DU CORPUS JURIDIQUE] ' + fl);
        }
      } catch (e) {}
      return L.length ? (NL + NL + L.join(NL + NL) + NL) : '';
    },
  };
  App.DroitMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/droit/notions-droit-civil.json', kind: 'fiche', slug: 'code-civil' },
      // Ronde 198 : le texte du Code civil et son plan ne figurent plus
      // ici comme dossier - tout le code (les 2 899 articles, avec chemin et
      // date de version) se trouve désormais comme corpus de lecture dans
      // src/droit/code-civil/ et est lu par App.DroitLookup. Ainsi
      // le bloc n'est plus rempli d'un texte qui figure déjà ailleurs.
      // Ronde 173 : les six nouveaux codes - leurs fiches de notes tournent dans le
      // même corpus (même machine, même porte isDroit). Le champ
      // "slug" dit à quel code appartient un dossier : le bloc de prompt nomme
      // ainsi le code dont proviennent vraiment les sections choisies.
      { url: 'src/droit/penal/notions.json', kind: 'fiche', slug: 'code-penal' },
      { url: 'src/droit/procedure-penale/notions.json', kind: 'fiche', slug: 'code-procedure-penale' },
      { url: 'src/droit/education/notions.json', kind: 'fiche', slug: 'code-education' },
      { url: 'src/droit/ceseda/notions.json', kind: 'fiche', slug: 'ceseda' },
      { url: 'src/droit/famille-aide-sociale/notions.json', kind: 'fiche', slug: 'code-famille-aide-sociale' },
      { url: 'src/droit/justice-administrative/notions.json', kind: 'fiche', slug: 'code-justice-administrative' },
      { url: 'src/droit/constitution/notions.json', kind: 'fiche', slug: 'constitution' }
    ],
    MAX: 2600,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('loi lois code codes droit droits juridique article articles art texte textes civil penale penal paragraphe alinea disposition dispositions legifrance notaire avocat juriste tribunal jurisprudence texte presente presente vis versa').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    SHORT_WORDS: (function () {
      let o = {};
      ('loi art pacs dom nant gage').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/\u0153/g, 'oe').replace(/\u0152/g, 'oe').replace(/\u00e6/g, 'ae').replace(/\u00c6/g, 'ae').replace(/[\u2019']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-z\u00e0-\u00ff0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, String(t == null ? '' : t).replace(/\u0153/g, 'oe').replace(/\u0152/g, 'oe').replace(/\u00e6/g, 'ae').replace(/\u00c6/g, 'ae'));
    },
    // La porte : s'agit-il du droit civil, du Code civil, d'un de ses
    // articles, d'une question juridique ? Pas de médicaments, de langages de programmation,
    // d'anatomie, de sexualité ou de mathématiques pures - ceux-là ont leurs dossiers.
    isDroit(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u2019/g, "'");
      if (/\b(allemagne|allemand|belgique|belge|suisse|luxembourg|espagne|espagnol|italie|italien|portugal|portugais|pays-bas|neerlandais|royaume-uni|britannique|angleterre|irlande|irlandais|etats-unis|americain|canada|canadien|quebec|maroc|marocain|algerie|algerien|tunisie|tunisien|senegal|mali|cameroun|congo|egypte|turquie|turc|japon|japonais|bresil|mexique|mexicain|inde|indien|australie|autriche)\b/.test(tn) && !/(france|francais|legifrance)/.test(tn)) return false;
      // Ronde 173 : s'il nomme un code, la porte s'ouvre - et cela
      // AVANT la liste d'exclusion, pour que "l'article 9 du code civil" n'échoue pas à cause
      // d'un mot comme "ordonnance".
      // Ronde 198 : les noms de TOUS les codes du corpus (24) ouvrent la porte -
      // les plus longs d'abord, pour que "code de la famille et de l'aide sociale"
      // ne reste pas accroché au plus court "code de la famille".
            // Ronde 277 : les noms des 78 codes du corpus (c'etait 24) - les plus longs
      // d'abord, pour que "code de la famille et de l'aide sociale" ne reste pas
      // accroche au plus court "code de la famille".
            // Ronde 277/278 : les noms des 78 codes de loi et des quatre traits de
      // l'Union (TFUE, TUE, Charte, Euratom) - les plus longs d'abord, pour que
      // "code de la famille et de l'aide sociale" ne reste pas accroche au plus
      // court "code de la famille".
      const CODES = /(code du domaine de l'etat et des collectivites publiques applicable a la collectivite territoriale de mayotte|code domaine de l'etat et des collectivites publiques applicable a la collectivite territoriale de mayotte|domaine de l'etat et des collectivites publiques applicable a la collectivite territoriale de mayotte|code des pensions de retraite des marins francais du commerce, de peche ou de plaisance|code de la legion d'honneur, de la medaille militaire et de l'ordre national du merite|code pensions de retraite des marins francais du commerce, de peche ou de plaisance|code legion d'honneur, de la medaille militaire et de l'ordre national du merite|pensions de retraite des marins francais du commerce, de peche ou de plaisance|legion d'honneur, de la medaille militaire et de l'ordre national du merite|code des pensions militaires d'invalidite et des victimes de guerre|traite instituant la communaute europeenne de l'energie atomique|code de l'entree et du sejour des etrangers et du droit d'asile|code pensions militaires d'invalidite et des victimes de guerre|code du domaine public fluvial et de la navigation interieure|installation classee pour la protection de l'environnement|pensions militaires d'invalidite et des victimes de guerre|code domaine public fluvial et de la navigation interieure|code des relations entre le public et l'administration|entree et du sejour des etrangers et du droit d'asile|code de l'expropriation pour cause d'utilite publique|domaine public fluvial et de la navigation interieure|code general de la propriete des personnes publiques|charte des droits fondamentaux de l'union europeenne|code des pensions civiles et militaires de retraite|code des postes et des communications electroniques|code disciplinaire et penal de la marine marchande|traite sur le fonctionnement de l'union europeenne|code expropriation pour cause d'utilite publique|code des instruments monetaires et des medailles|code pensions civiles et militaires de retraite|code postes et des communications electroniques|general de la propriete des personnes publiques|code des impositions sur les biens et services|la communaute europeenne de l'energie atomique|relations entre le public et l'administration|disciplinaire et penal de la marine marchande|code instruments monetaires et des medailles|code general des collectivites territoriales|expropriation pour cause d'utilite publique|communaute europeenne de l'energie atomique|code de la construction et de l'habitation|code des communes de la nouvelle-caledonie|code impositions sur les biens et services|pensions civiles et militaires de retraite|postes et des communications electroniques|droits fondamentaux de l'union europeenne|code de l'action sociale et des familles|code de la famille et de l'aide sociale|instruments monetaires et des medailles|code des procedures civiles d'execution|general des collectivites territoriales|le fonctionnement de l'union europeenne|code communes de la nouvelle-caledonie|journal officiel de l'union europeenne|code de la justice penale des mineurs|impositions sur les biens et services|cour de justice de l'union europeenne|interruption volontaire de grossesse|code du travail applicable a mayotte|code general de la fonction publique|code de deontologie des architectes|code de justice militaire \(nouveau\)|obligation de quitter le territoire|code de la propriete intellectuelle|code procedures civiles d'execution|code du cinema et de l'image animee|code general des impots, annexe iii|acces aux documents administratifs|code general des impots, annexe ii|code general des impots, annexe iv|code rural et de la peche maritime|code livre des procedures fiscales|code de l'organisation judiciaire|communes de la nouvelle-caledonie|code des juridictions financieres|code travail applicable a mayotte|code general des impots, annexe i|service penitentiaire d'insertion|code deontologie des architectes|code justice militaire \(nouveau\)|code cinema et de l'image animee|construction et de l'habitation|general de la fonction publique|code de justice administrative|action sociale et des familles|code de la securite interieure|procedures civiles d'execution|general des impots, annexe iii|charte des droits fondamentaux|code de l'entree et du sejour|garantie legale de conformite|code juridictions financieres|general des impots, annexe ii|general des impots, annexe iv|rural et de la peche maritime|livre des procedures fiscales|traite sur l'union europeenne|code organisation judiciaire|code de la commande publique|famille et de l'aide sociale|travail applicable a mayotte|general des impots, annexe i|administration penitentiaire|deontologie des architectes|cour administrative d'appel|justice militaire \(nouveau\)|code de la securite sociale|code des douanes de mayotte|silence de l'administration|cinema et de l'image animee|code monetaire et financier|droit de l'union europeenne|juridiction administrative|demande de logement social|justice penale des mineurs|code de la voirie routiere|code de justice militaire|service d'aide a domicile|code de l'aviation civile|code de la sante publique|code du domaine de l'etat|aide sociale a l'enfance|retention administrative|droit de la consommation|credit a la consommation|propriete intellectuelle|code de procedure civile|code de procedure penale|juridictions financieres|code des ports maritimes|silence vaut acceptation|code du service national|code du travail maritime|code forestier \(nouveau\)|code procedures fiscales|redressement judiciaire|entrepreneur individuel|protection de l'enfance|code de l'environnement|organisation judiciaire|code de la consommation|demarchage telephonique|logement locatif social|vaccination obligatoire|code douanes de mayotte|rupture conventionnelle|code general des impots|ordonnance n° 2016-131|liquidation judiciaire|justice administrative|tribunal administratif|certificat d'urbanisme|plan local d'urbanisme|code commande publique|litige de consommation|charges de copropriete|contravention routiere|etablissement de sante|allocations familiales|assignation en justice|code domaine de l'etat|lutte contre le dopage|monetaire et financier|declaration prealable|reglement d'urbanisme|servitude d'urbanisme|droit de retractation|syndic de copropriete|tribunal pour enfants|code service national|inspection du travail|code travail maritime|code minier \(nouveau\)|tribunal de commerce|registre du commerce|code aviation civile|droit de l'education|sejour des etrangers|installation classee|permis de construire|code de la mutualite|code de la recherche|assurance vieillesse|cotisations sociales|code voirie routiere|code ports maritimes|association sportive|detention provisoire|traite de maastricht|reglement de l'union|directive europeenne|ordonnance 2016-131|societe commerciale|code de l'artisanat|code de l'education|droit des etrangers|visa de long sejour|gestion des dechets|code de l'urbanisme|securite interieure|code des assurances|code des transports|federation sportive|forestier \(nouveau\)|code rural \(ancien\)|procedures fiscales|droit communautaire|juge administratif|pollution des eaux|code de la defense|code de la famille|excuse de minorite|brevet d'invention|permis de conduire|amende forfaitaire|douanes de mayotte|decision implicite|code du patrimoine|contrat de travail|general des impots|code penitentiaire|traite de lisbonne|l'union europeenne|reglement europeen|fonds de commerce|auto-entrepreneur|justice militaire|code de l'energie|carte de resident|sejour irregulier|demandeur d'asile|especes protegees|commande publique|mineur delinquant|mineur delinquent|retrait de points|videosurveillance|agent de securite|assurance maladie|code des communes|domaine de l'etat|code de commerce|droit commercial|juge des enfants|code de la route|exces de vitesse|alcool au volant|securite sociale|procedure civile|juge des referes|procedure penale|code des douanes|delai de recours|service national|licence sportive|code du tourisme|droit du travail|temps de travail|travail maritime|minier \(nouveau\)|societe anonyme|aide a domicile|aviation civile|titre de sejour|carte de sejour|demande d'asile|logement social|droits d'auteur|permis a points|videoprotection|securite privee|caisse primaire|voirie routiere|audience civile|code assurances|ports maritimes|code transports|code patrimoine|code du travail|salaire minimum|conseil d'etat|action sociale|code artisanat|etude d'impact|clause abusive|code mutualite|droit d'auteur|marque deposee|droits voisins|code recherche|delit de fuite|sante publique|secret medical|code electoral|code forestier|rural \(ancien\)|traite de rome|charte de nice|traite euratom|droit europeen|reglement \(ue\)|directive \(ue\)|droit d'asile|environnement|don d'organes|code communes|code du sport|code tourisme|penitentiaire|milieu ouvert|aide sociale|code energie|consommation|retractation|code defense|code douanes|club sportif|licenciement|conges payes|copropriete|contrefacon|port d'arme|prud'hommes|code minier|droit penal|code civil|commercant|bioethique|c\. pr\. pen|assurances|transports|patrimoine|prudhommes|conge paye|code penal|code rural|artisanat|education|etrangers|urbanisme|mutualite|recherche|electoral|forestier|charte ue|commerce|retraite|communes|tourisme|energie|defense|hopital|douanes|travail|c\. trav|euratom|eur-lex|c\. civ|ceseda|urssaf|minier|c\. pen|detenu|c\.civ|celex|sarl|casf|icpe|cpam|crpa|smic|tfue)/;
      if (CODES.test(tn)) return true;
      if (/(?:article|articles|art)\s*\.?\s*n?[°o]?\s*[lrd]?\s*\.?\s*\d{1,4}(-\d{1,3})?\s*(du |de la |des |au )?(codes?|ceseda)/.test(tn)) return true;
      if (/(medicament|medicaments|posologie|ordonnance|antibiotique|paracetamol|ibuprofene|\bpython3?\b|\bhtml\b|\bcss\b|\bjavascript\b|anatomie|physiologie|\bnerf\b|\bmuscle\b|sexolog|contracepti|pythagore|thales|\bfraction|\btheoreme|\bequation|derivee|primitive|photosynthese|recette de cuisine)/.test(tn)) return false;
      // Ronde 197 : étranger ET police/contrôle/papiers - c'est le droit
      // du séjour, même sans terme fixe. Précisément cette question ("un
      // étranger doit-il justifier de son identité devant un policier ?") passait
      // avant pour une question de maths, parce que la porte des maths l'avalait.
      if (/(etranger|etrangere|etrangers)/.test(tn)
          && /(police|policier|policiere|gendarmerie|controle|identite|papiers|sejour|sejourner|regularis|expuls|eloign|retenu|retenue|frontiere|visa)/.test(tn)) return true;
      // Un article du Code civil, explicitement nommé.
      if (/(code civil|legifrance|ordonnance n[°o] ?2016-131|\d{1,4}(-\d{1,3})? du code civil|code civil, article)/.test(tn)) return true;
      if (/(article|articles|art\.)\s*\.?\s*n?[°o]?\s*\d{1,4}(-\d{1,3})?\s*(du |de la |des )?(code civil|c\. civ)/.test(tn)) return true;
      // Des mots juridiques clairs : eux seuls ouvrent déjà la porte.
      const K = /(droit civil|juridique|juriste|cour de cassation|jurisprudence|conseil constitutionnel|tribunal|avocat|notaire|huissier|commissaire de justice|prud'hommes|heritage|heritier|succession|testament|legataire|donation entre vifs|reserve hereditaire|quotite disponible|legs|usufruit|nue-propriete|servitude|mitoyen|hypotheque|cautionnement|nantissement|usucapion|indivision|tutelle|curatelle|sauvegarde de justice|emancipation|prestation compensatoire|pension alimentaire|autorite parentale|etat civil|vices caches|clause penale|force majeure|nullite du contrat|vice du consentement|dommages et interets|responsabilite civile|delai de prescription|code du travail|code de la consommation|code penal|licenciement|bailleur|locataire|depot de garantie|caution locative|expulsion|etat des lieux|bail d'habitation|pacs|concubinage|filiation|adoption|divorce|mariage)/;
      if (K.test(tn)) return true;
      // Ronde 173 : les institutions des six nouveaux codes. Elles sont clairement
      // juridiques, donc elles ouvrent seules la porte - une garde à vue, une
      // demande d'asile, un tribunal administratif ne sont pas des mots du quotidien.
      const K2 = /(\boqtf\b|\bofpra\b|\bcnda\b|\bcada\b|\bjld\b|code de procedure penale|code de l'education|sejour des etrangers|droit des etrangers|droit d'asile|demandeur d'asile|code de la famille|aide sociale|action sociale|code de justice administrative|\bcja\b|tribunal administratif|cour administrative d'appel|conseil d'etat|juge administratif|juridiction administrative|garde a vue|juge d'instruction|mise en examen|procureur de la republique|procureur general|cour d'assises|tribunal correctionnel|tribunal judiciaire|juge des libertes|juge de l'application des peines|casier judiciaire|obligation de quitter le territoire|interdiction de retour|interdiction du territoire|titre de sejour|carte de sejour|carte de resident|visa de long sejour|retention administrative|centre de retention|assignation a residence|assistant de service social|instruction obligatoire|obligation scolaire|etablissement public local d'enseignement|\beple\b|contrat d'association|diplome national|aide a domicile|protection de l'enfance|droits et obligations des eleves|vie scolaire|prescription de l'action publique|action publique|controle judiciaire|detention provisoire|liberation conditionnelle|sursis probatoire|reduction de peine|partie civile|constitution de partie civile|instruction preparatoire|chambre de l'instruction|intime conviction|conseil de discipline|commission d'appel|projet personnalise de scolarisation|maison departementale des personnes handicapees|communaute educative|contrat d'integration republicaine|aide personnalisee d'autonomie|aide sociale a l'enfance)/;
      if (K2.test(tn)) return true;
      if (/(constitution|constitutionnel|bloc de constitutionnalite|declaration des droits de l'homme|preambule de 1946|\bqpc\b|question prioritaire de constitutionnalite|conseil constitutionnel)/.test(tn)) return true;
      // Ronde 198 : les institutions des nouveaux codes (travail, santé,
      // sécurité sociale, aide sociale, consommation, route, logement, commerce,
      // procédure, environnement, urbanisme, exécution des peines, sport, propriété
      // intellectuelle, procédure administrative, justice des mineurs). Elles sont clairement juridiques
      // et figurent donc APRÈS la liste d'exclusion - une question sur un
      // médicament ou sur l'anatomie reste à ses dossiers.
      const K3 = /(\blicenciement|\blicencie|\bsalarie|\bsalariee|\bembauche|\bcdd\b|\bcdi\b|\bsmic\b|contrat de travail|temps de travail|heures supplementaires|conges payes|prud'hom|prudhom|inspection du travail|rupture conventionnelle|faute grave|faute lourde|preavis|solde de tout compte|accident du travail|maladie professionnelle|inaptitude|delegue du personnel|\bgreve\b|syndicat|secret medical|dossier medical|consentement aux soins|\bhopital\b|\bclinique\b|\bvaccination\b|\bivg\b|interruption volontaire de grossesse|don d'organes|bioethique|profession de sante|etablissement de sante|soins palliatifs|medecin traitant|sage-femme|assurance maladie|carte vitale|tiers payant|cotisations? sociales|\burssaf\b|\bcpam\b|\bcaf\b|allocations familiales|prime d'activite|\brsa\b|aide au logement|\bapl\b|assurance vieillesse|aide sociale|protection de l'enfance|aide a domicile|allocation personnalisee d'autonomie|\bapa\b|\bmdph\b|hebergement d'urgence|garantie legale|vice cache|demarchage|retractation|credit a la consommation|clause abusive|association de consommateurs|action de groupe|permis a points|retrait de points|exces de vitesse|alcool au volant|delit de fuite|suspension du permis|annulation du permis|controle technique|logement social|\bhlm\b|copropriete|\bsyndic\b|charges de copropriete|bailleur social|commission d'attribution|\bassignation\b|\brefere\b|mise en demeure|commissaire de justice|\bhuissier\b|\bsignification\b|\bconclusions\b|tribunal judiciaire|tribunal de commerce|registre du commerce|\brcs\b|fonds de commerce|redressement judiciaire|liquidation judiciaire|\bsarl\b|\bsas\b|\bsasu\b|bail commercial|droit d'auteur|\bmarque deposee|\bbrevet\b|contrefacon|\binpi\b|droits voisins|silence de l'administration|decision implicite|recours gracieux|recours hierarchique|acces aux documents administratifs|\bcada\b|\bicpe\b|installation classee|especes protegees|etude d'impact|permis de construire|declaration prealable|certificat d'urbanisme|\bplu\b|\blotissement\b|permis de demoler|\bdetenu\b|maison d'arret|centre penitentiaire|permission de sortie|reduction de peine|amenagement de peine|bracelet electronique|federation sportive|licence sportive|\bdopage\b)/;
      if (K3.test(tn)) return true;
      // Ronde 173 : école ou enseignement supérieur ET un droit, un devoir ou une
      // sanction - c'est une question sur le Code de l'éducation.
      if (/(droit|droits|obligation|obligations|sanction|exclusion|exclu|renvoy|redoublement|inscription|orientation|bourse|assiduite|discipline|harcelement|reglement interieur)/.test(tn)
          && /(eleve|etudiant|college|lycee|universite|ecole|scolarite|baccalaureat|classe|professeur|enseignant)/.test(tn)) return true;
      // Un article avec un numéro L, R, D ou A appartient toujours à un code.
      if (/(?:article|articles|art)\s*\.?\s*n?[°o]?\s*[lrd]\s?\.?\s?\d{1,4}\s?-\s?\d/.test(tn)) return true;
      // Autres mots juridiques : ils n'ouvrent la porte que s'il y a aussi une question
      // ou une commande ("explique le contrat de vente"), pas à
      // chaque mot lâché en passant.
      const B = /(contrat|obligation|propriete|proprietaire|faute|dommage|prejudice|indemnisation|vendeur|acheteur|\bcaution\b|garantie|dette|creance|prescri|bail|loyer|donation|succession|heritage|divorce|mariage|pacs|droit de|droits de|loi|code)/;
      const D = /(quels? (sont|est)|que dit|que faire|comment|c'est quoi|qu'est[- ]ce|explique|expliquer|ai-je le droit|j'ai le droit|je veux savoir|est[- ]ce legal|le delai|combien de temps|depuis quand|renumero|renumerot|abroge|en vigueur|a quoi sert|qui a ecrit|difference entre|puis-je|je peux|j'aimerais savoir|je voudrais savoir|conseil|ne veut pas|ne rend pas|ne paie|ne paye|refuse|litige|conflit|mon proprietaire|mon bailleur|mon employeur|mon locataire)/;
      if (B.test(tn) && D.test(tn)) return true;
      return false;
    },
    warm() {
      if (this._data || this._loading) return this._loading;
      let self = this;
      try {
        this._loading = Promise.all(this.SOURCES.map(s => App.Core.loadJson(s.url)))
          .then(list => {
            self._loading = null;
            let secs = [], books = [];
            list.forEach((j, i) => {
              if (!j || !j.sections || !j.sections.length) return;
              let label = j.title || self.SOURCES[i].url;
              books.push({ title: label, author: j.author || '', source: j.source || '', licence: j.licence || '', note: j.note || '', slug: self.SOURCES[i].slug || '' });
              j.sections.forEach(s => { if (s && s.x) secs.push({ t: s.t, c: s.c, p: s.p, x: s.x, b: label, k: self.SOURCES[i].kind, g: self.SOURCES[i].slug || '' }); });
            });
            if (!secs.length) { console.warn('[DroitMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[DroitMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[DroitMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    // La table des matières des dossiers ne doit JAMAIS passer entièrement dans le prompt :
    // 1700 sections feraient un mégaoctet. C'est pourquoi une ligne par ouvrage,
    // avec le nombre de sections et seulement quelques titres.
    toc() {
      try {
        if (!this._data) return '';
        let byBook = {}, order = [];
        this._data.sections.forEach(s => {
          let b = s.b || '?';
          if (!byBook[b]) { byBook[b] = { n: 0, t: [] }; order.push(b); }
          byBook[b].n++;
          if (byBook[b].t.length < 18 && !/^Article /.test(s.t)) byBook[b].t.push(s.t);
        });
        let out = [], total = 0;
        for (const b of order) {
          let full = b + ' : ' + byBook[b].n + ' sections' + (byBook[b].t.length ? ' - ' + byBook[b].t.join(' · ') : '');
          if (total + full.length > 2600) { out.push(b + ' : ' + byBook[b].n + ' sections'); continue; }
          total += full.length; out.push(full);
        }
        return out.join('\n');
      } catch (e) { return ''; }
    },
    block(text) {
      try {
        if (!this._data || !this.isDroit(text)) return '';
        let sel = this.pick(text, this.MAX) || [];
        let books = this._data.books || [];
        let byTitle = {};
        books.forEach(b => { if (b && b.slug) byTitle[b.title] = b.slug; });
        // Ronde 173 : le bloc s'appelait toujours "DROIT CIVIL". Il nomme désormais
        // le code dont il s'agit : si la question nomme un code, ce sont d'abord ses sections
        // qui comptent ; sinon c'est le code d'où proviennent les sections choisies ;
        // et en dernier recours le code de la question.
        let named = (App.DroitLookup && App.DroitLookup.detect) ? App.DroitLookup.detect(text) : null;
        if (named && sel.length) {
          let only = sel.filter(s => s && byTitle[s.b] === named);
          if (only.length) sel = only;
        }
        let slug = null;
        if (sel.length) {
          let counts = {};
          sel.forEach(s => { let g = s && byTitle[s.b]; if (g) counts[g] = (counts[g] || 0) + 1; });
          let best = 0;
          for (const g in counts) if (counts[g] > best) { best = counts[g]; slug = g; }
        }
        if (!slug) slug = named;
        let code = (App.DroitLookup && App.DroitLookup.bySlug) ? App.DroitLookup.bySlug(slug || 'code-civil') : null;
        let nom = (code && code.nom) || 'Code civil';
        let L = [(nom === 'Code civil')
          ? '[DROIT CIVIL - LE CODE CIVIL ET TES FICHES DE REFERENCE]'
          : '[' + nom.toUpperCase() + ' - TES FICHES DE REFERENCE]'];
        L.push('Voici le materiel de droit (' + nom + ') avec lequel il travaille : '
          + books.map(b => '« ' + b.title + ' »').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push('Les sections ci-dessous correspondent a sa question. Reponds a partir d\'elles, en citant l\'article exact (numero, et date de version quand elle est donnee) et la fiche d\'ou il vient. Le plan officiel sert a situer un article (livre, titre, chapitre). Si l\'article cherche n\'est pas ici, dis-le au lieu de l\'inventer.');
          let regles = 'Regles : tu informes sur le droit, tu ne donnes pas de conseil juridique personnalise et tu ne remplaces ni un avocat, ni un notaire, ni un juriste. N\'invente jamais un numero d\'article ni un texte. ';
          if (nom === 'Code civil') regles += 'Depuis le 1er octobre 2016, l\'ancien article 1382 est devenu 1240 (le numero 1382 parle maintenant de la preuve). Ne confonds pas le droit civil avec le droit du travail, penal ou de la consommation : dis quel code s\'applique. ';
          else regles += 'Ces fiches portent le ' + nom + ' : ne melange pas ses articles avec ceux d\'un autre code, et dis de quel code vient chaque numero. ';
          regles += 'Pour un cas personnel, renvoie a un avocat, un notaire, un conciliateur de justice, un point-justice ou service-public.fr. Texte ordinaire, sans emoji ni LaTeX.';
          L.push(regles);
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']\n' + s.x));
        } else {
          L.push('Aucune section de ces fiches ne correspond exactement a sa question. Voici ce qu\'elles contiennent, pour lui dire ce qu\'elles portent :');
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  // Les deux ouvrages font ensemble bien 1,2 Mo. Ils n'arrivent donc que quelques
  // secondes après le premier rendu, comme l'index VIDAL.
  setTimeout(function () { try { App.DroitMemo.warm(); } catch (e) {} }, 6000);
  setTimeout(function () { try { App.DroitLookup.warm(); } catch (e) {} }, 6800);
  // Ronde 283 : le guet du corpus juridique passe après le premier chargement — il lit
  // l'index de la source (une page), et relit chez elle les seuls codes qui ont bougé.
  setTimeout(function () { try { App.DroitFresh.ensure(); } catch (e) {} }, 12000);
  setTimeout(function () { try { App.Watch.ensure(); } catch (e) {} }, 14000);
  setTimeout(function () { try { App.Satellite.warm(); } catch (e) {} }, 16000);
  setTimeout(function () { try { App.Sujets.ensure(); } catch (e) {} }, 9000);
  setTimeout(function () { try { App.Sujets.syncAutoUI(); App.Sujets.flush(); } catch (e) {} }, 12000);
  try { window.addEventListener('online', function () { try { App.Sujets.flush(); } catch (e) {} }); } catch (e2) {}
  try { setInterval(function () { try { App.Sujets.flush(); } catch (e) {} }, 5 * 60 * 1000); } catch (e3) {}
  // =====================================================================================
  // Ronde 279 (souhait de l'utilisateur — la page « Rechercher une décision (ArianeWeb) »
  // du Conseil d'État) : LA JURISPRUDENCE ADMINISTRATIVE.
  //
  // ArianeWeb est la base publique de jurisprudence administrative du Conseil d'État :
  // près de 300 000 documents — décisions du Conseil d'État, arrêts des cours
  // administratives d'appel, décisions du Tribunal des conflits, analyses de
  // jurisprudence, conclusions des rapporteurs publics.
  //
  // Comme pour la GBD, rien n'est recopié : Sofia cherche ELLE-MÊME dans la base, lit la
  // décision sur place, et la cite. Deux appels, relevés dans l'application publique
  // d'ArianeWeb (un moteur Sinequa) :
  //   (1) la recherche —
  //       /xsearch?type=json&text.add=<question>&SourceStr4=<fond>&SkipCount=<n>
  //       « text.add » est la question en texte libre ; « SourceStr4 » le fonds (AW_DCE,
  //       AW_DCA, AW_DTC, AW_AJCE, AW_AJCA, AW_AJTC, AW_CRP) ; « SkipCount » le nombre de
  //       résultats. Chaque document porte la juridiction, la formation, le numéro,
  //       l'ECLI, la date de lecture, la mention de publication, le résumé officiel
  //       (SourceStr21) et des extraits.
  //   (2) la décision elle-même —
  //       /plugin?plugin=Service.downloadFilePagePlugin&Index=Ariane_Web&Id=<Id>
  //       Elle revient en HTML, en ISO-8859-1 : d'où la lecture en octets et le décodage
  //       latin-1 (sinon « Conseil d'État » arrive mojibaké, avec des « Ã » partout). Les conclusions
  //       des rapporteurs publics (AW_CRP) sont des PDF : ils sont lus par pdf.js, chargé
  //       à la demande, et une seule fois par session.
  // Rien n'est gardé durablement : la base évolue.
  App.JuriLookup = {
    SEARCH: 'https://www.conseil-etat.fr/xsearch?type=json',
    DOC: 'https://www.conseil-etat.fr/plugin?plugin=Service.downloadFilePagePlugin',
    SITE: 'https://www.conseil-etat.fr/arianeweb/#/recherche',
    PAGE: 'https://www.conseil-etat.fr/decisions-de-justice/jurisprudence/rechercher-une-decision-arianeweb',
    TIMEOUT_MS: 15000,
    PDF_MS: 20000,
    CACHE_MS: 600000,
    MAX_TEXT: 4000,
    MAX_DOCS: 2,
    MAX_TRY: 6,
    MAX_PDF_PAGES: 12,
    // Les fonds d'ArianeWeb (champ SourceStr4). « decision » : le texte de la décision
    // (HTML) ; « conclusions » : les conclusions du rapporteur public (PDF).
    FONDS: [
      { slug: 'AW_DCE', nom: "Conseil d'État", type: 'decision' },
      { slug: 'AW_DCA', nom: "Cour administrative d'appel", type: 'decision' },
      { slug: 'AW_DTC', nom: 'Tribunal des conflits', type: 'decision' },
      { slug: 'AW_AJCE', nom: "Analyse du Conseil d'État", type: 'analyse' },
      { slug: 'AW_AJCA', nom: "Analyse de cour administrative d'appel", type: 'analyse' },
      { slug: 'AW_AJTC', nom: 'Analyse du Tribunal des conflits', type: 'analyse' },
      { slug: 'AW_CRP', nom: 'Conclusions du rapporteur public', type: 'conclusions' }
    ],
    _cache: {}, _pending: null, _pdf: null,
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    fond(slug) {
      for (let i = 0; i < this.FONDS.length; i++) if (this.FONDS[i].slug === slug) return this.FONDS[i];
      return null;
    },
    nomFond(slug) { let f = this.fond(slug); return f ? f.nom : String(slug == null ? '' : slug); },
    _race(p, ms) {
      return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms || 15000); })]);
    },
    _latin1(buf) {
      try { return new TextDecoder('iso-8859-1').decode(buf); }
      catch (e) { let s = ''; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]); return s; }
    },
    // La question telle quelle, débarrassée de ce qui casse le moteur.
    _query(text) {
      let q = String(text == null ? '' : text).replace(/[\u2019\u02bc]/g, "'")
        .replace(/[<>#&|]/g, ' ').replace(/\s+/g, ' ').trim();
      if (q.length > 220) q = q.slice(0, 220).replace(/\s+\S*$/, '');
      return q;
    },
    STOPW: null,
    _stop() {
      if (this.STOPW) return this.STOPW;
      let o = {};
      ('que qui quoi dont ou et mais donc or ni car pour par avec sans dans sur sous vers chez entre depuis pendant apres avant lors quand comment pourquoi combien quel quelle quels quelles est sont etait etaient ete avoir fait faire peut peuvent doit doivent tout toute tous toutes cette cet ces son sa ses leur leurs plus moins aussi ainsi alors cela ceci celui celle ils elles nous vous mes tes mon ma une des les lui eux au aux du de la le un en il elle on je tu se sappelle sagit concerne ' +
       // Les mots de la question de jurisprudence elle-meme : ils reviennent dans presque
       // tous les documents et ne distinguent donc rien (« quelle est la jurisprudence du
       // Conseil d'Etat sur... »). Ce sont les mots de FOND qui doivent chercher.
       'jurisprudence arrets arret decisions decision jugements jugement conseil etats etat juge juges administratif administrative administratives administratifs tribunal tribunaux cour cours conflits conflit droit droits loi lois regle regles reglement reglements saisir competence competent legalite solution question').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      this.STOPW = o;
      return o;
    },
    // La question reduite a ses mots de fond : c'est avec ceux-la que le moteur
    // d'ArianeWeb classe le mieux (mesure : la question entiere ne rendait que des
    // conclusions, les mots de fond ramenent la decision elle-meme au premier rang).
    _kw(text) {
      let stop = this._stop();
      let w = String(text == null ? '' : text).toLowerCase().replace(/[\u2019\u02bc']/g, ' ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ')
        .split(' ').filter(x => x.length >= 4 && !stop[x]);
      return w.slice(0, 6).join(' ');
    },
    _searchUrl(q) {
      let u = this.SEARCH + '&SkipCount=' + this.MAX_TRY + '&text.add=' + encodeURIComponent(q);
      // Tous les fonds nommement : sans cette liste, le moteur ne rend qu'une poignee
      // de documents (mesure : 16 au lieu de 115 sur la meme question).
      for (let i = 0; i < this.FONDS.length; i++) u += '&SourceStr4=' + this.FONDS[i].slug;
      return u;
    },
    async _json(url) {
      let r = await this._race(App.Core.proxyFetch(url), this.TIMEOUT_MS);
      if (!r || !r.ok) throw new Error('HTTP ' + (r && r.status));
      return r.json();
    },
    // Les extraits du moteur portent des marques de surlignage (« {b}perquisition{nb} »).
    _clean(s) {
      return String(s == null ? '' : s).replace(/\{b\}|\{nb\}/g, '').replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ').trim();
    },
    _doc(d) {
      return {
        id: d.Id, fond: d.SourceStr4 || '', juridiction: d.SourceStr3 || '',
        formation: d.SourceStr7 || '', num: d.SourceStr5 || '', ecli: d.SourceStr30 || '',
        date: String(d.SourceDateTime1 || '').slice(0, 10),
        enr: String(d.SourceDateTime2 || '').slice(0, 10),
        publie: d.SourceStr8 || '', degre: d.SourceStr9 || '', recours: d.SourceStr12 || '',
        resume: this._clean(d.SourceStr21 || ''), extrait: this._clean(d.Extracts || ''),
        analyse: String(d.SourceStr10 || ''), conclusions: String(d.SourceCsv7 || ''),
        affaires: d.SourceCsv1 || '', techniques: d.SourceCsv3 || ''
      };
    },
    // Chercher dans ArianeWeb, puis lire les décisions trouvées.
    async search(text) {
      if (!this.isEnabled()) return { failed: true, reason: 'disabled' };
      try {
        let raw = this._query(text);
        if (!raw) return { failed: true, reason: 'no-query' };
        let kw = this._kw(text) || raw;
        // Deux recherches : les mots de fond, puis la question entière. La première
        // classe mieux ; la seconde rattrape ce que la première a laissé passer.
        let lists = [];
        try { lists.push(await this._json(this._searchUrl(kw))); }
        catch (e) { console.warn('[JuriLookup] recherche (mots de fond) échouée', e && e.message); }
        if (kw !== raw) {
          try { lists.push(await this._json(this._searchUrl(raw))); }
          catch (e) { console.warn('[JuriLookup] recherche (question) échouée', e && e.message); }
        }
        let docs = [], seenId = {}, total = 0;
        for (const j of lists) {
          if ((j.DocumentCount || 0) > total) total = j.DocumentCount || 0;
          for (const d of (j.Documents || [])) { if (!d || seenId[d.Id]) continue; seenId[d.Id] = 1; docs.push(d); }
        }
        // Ronde 279 : l'open data de la justice administrative est interrogé s'il n'y a
        // rien à lire, OU si la question nomme un tribunal administratif / une cour
        // administrative d'appel (ArianeWeb ne sait pas filtrer par juridiction, l'open
        // data les contient toutes). Ses décisions entrent dans le même bloc.
        let od = null, odWant = false;
        try { odWant = !!(App.OpenDataLookup && App.OpenDataLookup.isEnabled() && App.OpenDataLookup.wants(text)); } catch (e) {}
        let awMax = odWant ? 1 : this.MAX_DOCS;
        // La même affaire revient dans plusieurs fonds (la décision, son analyse, les
        // conclusions) : on ne garde, par affaire, qu'un document — et d'abord la
        // DÉCISION elle-même, celle qui juge ; le second est le complément (analyse de
        // jurisprudence ou conclusions du rapporteur public) quand il y en a un.
        let seen = {}, pick = [];
        const take = function (d) {
          let k = String(d.SourceStr5 || d.Id) + '|' + String(d.SourceDateTime1 || '').slice(0, 10);
          if (seen[k]) return false;
          seen[k] = 1; pick.push(d); return true;
        };
        for (let i = 0; i < docs.length; i++) { let f = this.fond(docs[i].SourceStr4); if (f && f.type === 'decision') { take(docs[i]); break; } }
        for (let i = 0; i < docs.length && pick.length < awMax; i++) take(docs[i]);
        let out = [];
        for (let i = 0; i < pick.length; i++) {
          let rec = this._doc(pick[i]);
          rec.src = 'aw';
          try {
            let r = await this.read(rec.id);
            if (r && r.text) { rec.text = r.text; rec.lu = r.type; }
            else if (r && r.pdf) rec.pdf = true;
          } catch (e) { console.warn('[JuriLookup] lecture échouée ' + rec.num, e && e.message); }
          out.push(rec);
        }
        // Ronde 279 : ce qu'ArianeWeb n'a pas donné, l'open data le donne (et si la
        // question nomme un tribunal ou une cour, il complète la décision lue).
        if (out.length < this.MAX_DOCS) {
          try { od = await App.OpenDataLookup.search(text, { avoid: out.map(function (d) { return d.num; }) }); }
          catch (e) { console.warn('[OpenDataLookup] recherche échouée', e && e.message); od = null; }
          if (od && od.docs && od.docs.length) {
            for (let i = 0; i < od.docs.length && out.length < this.MAX_DOCS; i++) out.push(od.docs[i]);
          } else od = null;
        }
        if (!out.length) return { failed: true, reason: lists.length ? 'no-hit' : 'engine', query: kw };
        if (!total && od) total = od.total;
        console.log('[JuriLookup] recherche : « ' + kw + ' » -', total, 'document(s) ; lus :',
          out.map(function (d) { return (d.src === 'open' ? 'open data' : d.fond) + ' n' + d.num; }).join(', '));
        return { ok: true, query: kw, total: total, docs: out, url: this.PAGE, od: od ? { total: od.total, counts: od.counts } : null };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    // Le texte d'un document de la base, en HTML ou en PDF.
    async read(id) {
      let key = String(id == null ? '' : id);
      if (!key) return null;
      let c = this._cache[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return c.v;
      let index = /^\/Consilia_Web\//.test(key) ? 'Consilia_Web' : 'Ariane_Web';
      let url = this.DOC + '&Index=' + index + '&Id=' + encodeURIComponent(key);
      let r = await this._race(App.Core.proxyFetch(url), this.TIMEOUT_MS);
      if (!r || !r.ok) throw new Error('HTTP ' + (r && r.status));
      let buf = new Uint8Array(await r.arrayBuffer());
      let v;
      if (buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
        let t = await this._pdfText(buf);
        v = t ? { text: t, type: 'pdf' } : { pdf: true };
      } else {
        v = { text: this._html(buf), type: 'html' };
      }
      if (v.text) this._cache[key] = { t: Date.now(), v: v };
      return v;
    },
    // Le HTML d'une décision : balises au net, entités résolues, lignes propres.
    _html(buf) {
      let html = this._latin1(buf);
      let pre = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|tr|li|blockquote|td)>/gi, '\n');
      let txt = '';
      try { let doc = new DOMParser().parseFromString(pre, 'text/html'); txt = doc && doc.body ? doc.body.textContent : ''; }
      catch (e) { txt = pre.replace(/<[^>]+>/g, ' '); }
      if (!txt) txt = pre.replace(/<[^>]+>/g, ' ');
      return txt.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ')
        .replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    },
    // pdf.js seulement si un PDF se présente (les conclusions du rapporteur public).
    _pdfLib() {
      if (this._pdf) return this._pdf;
      let self = this;
      this._pdf = (async function () {
        const pdfjs = await import('https://esm.sh/pdfjs-dist@4.2.67/legacy/build/pdf.mjs');
        try {
          if (!pdfjs.GlobalWorkerOptions.workerPort) {
            let src = URL.createObjectURL(new Blob(
              ['import "https://esm.sh/pdfjs-dist@4.2.67/legacy/build/pdf.worker.mjs";'], { type: 'text/javascript' }));
            pdfjs.GlobalWorkerOptions.workerPort = new Worker(src, { type: 'module' });
          }
        } catch (e) { console.warn('[JuriLookup] worker pdf', e && e.message); }
        console.log('[JuriLookup] lecteur PDF prêt (conclusions du rapporteur public)');
        return pdfjs;
      })().catch(function (e) { self._pdf = null; console.warn('[JuriLookup] pdf.js indisponible', e && e.message); throw e; });
      return this._pdf;
    },
    async _pdfText(buf) {
      try {
        let pdfjs = await this._pdfLib();
        let doc = await this._race(pdfjs.getDocument({ data: buf, disableFontFace: true }).promise, this.PDF_MS);
        let out = [];
        let n = Math.min(doc.numPages, this.MAX_PDF_PAGES);
        for (let p = 1; p <= n; p++) {
          let pg = await doc.getPage(p);
          let tc = await pg.getTextContent();
          out.push(tc.items.map(function (i) { return i.str; }).join(' '));
          if (out.join(' ').length > this.MAX_TEXT) break;
        }
        try { doc.destroy(); } catch (e) {}
        return out.join('\n\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      } catch (e) { console.warn('[JuriLookup] PDF illisible', e && e.message); return ''; }
    },
    _cut(t, n) {
      let s = String(t == null ? '' : t);
      if (s.length <= n) return s;
      let head = s.slice(0, n), sp = head.lastIndexOf(' ');
      if (sp > n * 0.6) head = head.slice(0, sp);
      return head.replace(/[\s,;:]+$/, '') + ' […]';
    },
    // Le bloc de prompt : ce que Sofia a vraiment lu dans ArianeWeb.
    buildBlock(res) {
      try {
        if (!res || res.failed || !res.docs || !res.docs.length) return '';
        let open = res.docs.filter(function (d) { return d.src === 'open'; });
        let aw = res.docs.length - open.length;
        let L = [];
        if (open.length && !aw) L.push('[JURISPRUDENCE ADMINISTRATIVE - CE QUE TU VIENS DE LIRE TOI-MÊME DANS L\'OPEN DATA DE LA JUSTICE ADMINISTRATIVE]');
        else if (open.length) L.push('[JURISPRUDENCE ADMINISTRATIVE - CE QUE TU VIENS DE LIRE TOI-MÊME DANS LES BASES PUBLIQUES DE LA JUSTICE ADMINISTRATIVE (ARIANEWEB ET OPEN DATA)]');
        else L.push('[JURISPRUDENCE ADMINISTRATIVE - CE QUE TU VIENS DE LIRE TOI-MÊME DANS ARIANEWEB (CONSEIL D\'ÉTAT)]');
        let srcs = [];
        if (aw) srcs.push("ArianeWeb, la base publique de jurisprudence administrative du Conseil d'État — près de 300 000 documents : décisions du Conseil d'État, arrêts des cours administratives d'appel, décisions du Tribunal des conflits, analyses de jurisprudence, conclusions de rapporteurs publics (" + this.SITE + ")");
        if (open.length) srcs.push("l'open data de la justice administrative, la plateforme officielle du Conseil d'État qui publie TOUTES les décisions des tribunaux administratifs, des cours administratives d'appel et du Conseil d'État depuis 2021-2022 — jugements de première instance et ordonnances compris — avec le texte intégral de chaque décision (" + App.OpenDataLookup.SITE + " )");
        L.push("Sa question porte sur la jurisprudence administrative. Tu as cherché toi-même dans " + srcs.join(" et dans ")
          + ". Ta recherche : « " + res.query + " » — " + res.total + " document(s) ; tu as lu "
          + res.docs.length + " d'entre eux, reproduits ci-dessous.");
        L.push("Il n'a lu QUE ces décisions — " + res.docs.map(function (d) { return (d.juridiction || '?') + (d.num ? ' n° ' + d.num : '') + (d.date ? ' (' + d.date + ')' : ''); }).join(' ; ') + " : ne nomme, ne cite et ne résume AUCUNE autre décision, AUCUNE autre juridiction et AUCUN autre numéro. Si sa question nomme une juridiction qui n'est pas dans cette liste (ou lui demande si « tel tribunal » a jugé), ne lui fais pas dire qu'elle a jugé : dis plutôt ce que ces décisions-ci jugent, en les nommant elles, même si elles viennent d'un autre tribunal.");
        L.push("Réponds à partir de LEUR texte, jamais de mémoire : ouvre ta réponse en nommant la décision que tu as lue (juridiction, numéro de dossier, date de lecture), puis dis ce qu'elle juge et pourquoi elle compte. Une décision d'espèce ne vaut que par ce qu'elle juge : ne lui fais pas dire plus. Si une décision ci-dessous ne répond pas vraiment à sa question, dis-le et prends l'autre. Ce qui n'est pas ci-dessous, tu ne l'as pas lu — dis-le au lieu de l'inventer.");
        for (const d of res.docs) {
          let t = this.fond(d.fond);
          let head = '--- ' + (d.juridiction || (t ? t.nom : d.fond)) + (d.formation ? ', ' + d.formation : '') + (d.num ? ' n° ' + d.num : '') + (d.date ? ', lecture du ' + d.date : '');
          let meta = [];
          if (d.ecli) meta.push('ECLI ' + d.ecli);
          if (d.src === 'open') {
            if (d.publie) meta.push('classement : ' + this._pubLabel(d.publie));
            if (d.type) meta.push(d.type);
          } else {
            if (d.publie) meta.push('mention de publication : ' + d.publie + (d.publie === 'A' ? ' (Recueil Lebon)' : ''));
            if (d.nomFond) meta.push(d.nomFond);
          }
          head += (meta.length ? ' [' + meta.join(' ; ') + ']' : '');
          let body = [];
          if (d.resume) body.push('Résumé officiel (abstract de la base) : ' + this._cut(d.resume, 900));
          if (d.text) {
            let lab = d.src === 'open' ? 'Texte intégral de la décision, lu dans la base :'
              : (d.lu === 'pdf' ? 'Conclusions du rapporteur public, texte lu (PDF) :' : 'Texte de la décision, lu dans la base :');
            body.push(lab + '\n' + this._cut(d.text, this.MAX_TEXT));
          }
          else if (d.pdf) body.push("(Le texte complet de ce document est un PDF qui n'a pas pu être lu ; ne le cite pas mot pour mot.)");
          else if (d.extrait) body.push('Extrait lu par le moteur de recherche : ' + this._cut(d.extrait, 700));
          L.push(head + '\n' + body.join('\n') + (d.analyse ? '\n(analyse liée : ' + d.analyse + ')' : '')
            + (d.src === 'open' && d.zip ? '\n(Fichier source dans l\'open data : ' + d.id + ' — archive mensuelle : ' + d.zip + ')' : ''));
        }
        let srcLine = [];
        if (open.length) srcLine.push("l'open data de la justice administrative (base tenue par le Conseil d'État : " + App.OpenDataLookup.SITE + " )");
        if (aw) srcLine.push("ArianeWeb (" + this.PAGE + ")");
        L.push("Source : " + srcLine.join(' et ') + ". Nomme la source quand tu cites une décision, avec sa juridiction, son numéro de dossier et sa date de lecture"
          + (open.length ? ", et dis si elle est classée A ou B au Recueil Lebon ou sans apport jurisprudentiel particulier (C, D, Z)" : "")
          + ". Tu informes sur le droit, tu ne donnes pas de conseil juridique personnalisé : pour un cas personnel, renvoie à un avocat ou à un juriste. N'invente ni un numéro, ni une date, ni un considérant, ni une solution ; et si la question porte sur un texte de loi, c'est le code qu'il faut lire, pas la décision. Texte ordinaire, sans emoji ni LaTeX.");
        return L.join('\n');
      } catch (e) { return ''; }
    },
    // La porte : la question porte-t-elle sur ce que le juge administratif a JUGÉ
    // (jurisprudence administrative), et non sur le texte d'un code ?
    isJuri(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u02bc]/g, "'");
      if (!tn) return false;
      // Loin des affaires : l'open data de la justice administrative lui-même (la
      // plateforme officielle, ses archives mensuelles, ses codes de publication, sa
      // licence), ArianeWeb et Judilibre. Sa fiche doit pouvoir répondre sans qu'une
      // décision soit en cause — et avant la règle du « code nommé », car « code de
      // publication » n'est pas un code de lois.
      if (/open\s*data|donnees? ouvertes|opendata|ariane\s*web|judilibre|code de publication|classement de publication|recueil lebon/.test(tn)) return true;
      // Un code nommément cité (« le code de justice administrative », « l'article 1240 du
      // code civil », « l'article L. 5 du CJA ») : c'est le TEXTE DE LOI qu'il faut lire
      // (App.DroitLookup), pas la décision. ArianeWeb ne couvre d'ailleurs que la
      // jurisprudence administrative — le code civil, le code pénal, le code du travail
      // n'y sont pas.
      if (/\bcodes?\b/.test(tn)) return false;
      if (/(article|articles|art)\s*\.?\s*n?[°o]?\s*[lrd]?\s*\.?\s*\d+/.test(tn)
          && /\b(cja|ceseda|c\.? ?civ|c\.? ?pen|cgi|cpf)\b/.test(tn)) return false;
      // Marques sans ambiguïté d'une question de jurisprudence.
      if (/ecli\s*:/.test(tn)) return true;
      if (/jurisprudence|jurisprudences/.test(tn)) return true;
      if (/(rapporteur public|conclusions du rapporteur|grandes? decisions?|revirement de jurisprudence|principes? general(aux)? du droit|arret de principe)/.test(tn)) return true;
      // Les arrêts de principe, nommés.
      if (/(blanco|nicolo|benjamin|dehaene|jamart|lamotte|trompier[- ]gravier|robin et godot|rosan girard|barel|cadot|pelletier|prince napoleon|heyries|labonne|gomel|duvigneres|perreux|\bkone\b|dame cachet|couiteas|regnault[- ]desroziers|ternon|lambert|kpmg|morsang|hardouin|alitalia|gaupillat|action francaise|deville|la fleurette|epoux bertin|mimeur|societe commerciale de l'ouest africain)/.test(tn)) return true;
      // « arrêt n° 398234 », « décision n° 440346 ».
      if (/(arret|decision|jugement|ce|tc|caa)\s*n[°o]\s*\d{5,}/.test(tn)) return true;
      // Les notions que la jurisprudence administrative a elle-même créées : leur nom
      // seul suffit (ce sont les « grands arrêts » du droit administratif).
      if (/(theorie de l'imprevision|theorie du bilan|circonstances exceptionnelles|voie de fait|acte de gouvernement|service public industriel et commercial|responsabilite pour risque|responsabilite sans faute|droit de greve des fonctionnaires|effet direct des (conventions|directives?)|controle de conventionalite|controle normal|controle maximum|mutabilite du contrat|fait du prince|egalite devant les charges publiques|rupture d'egalite|principe de securite juridique|droit au dereferencement|actes de droit souple|mesures d'ordre interieur|dignite de la personne humaine|retrait d'une decision creatrice de droits|recours des tiers contre un contrat)/.test(tn)) return true;
      // Le nom d'une juridiction administrative ET une décision.
      const COURT = /(conseil d'etat|conseil detat|cour administrative d'appel|cours administratives d'appel|tribunal administratif|tribunaux administratifs|tribunal des conflits|juge administratif|juridiction administrative)/;
      const DEC = /(arret|arrets|decision|decisions|jugement|jugements|juge|jugee|annul|suspend|rejet|confirm|infirm|censur|condamn|ordonn|reconnu|admis|refus|legalite|solution)/;
      if (COURT.test(tn) && DEC.test(tn)) return true;
      return false;
    },
    // Le classement officiel d'une décision (fiche « Le code de publication ») :
    // A publié au Recueil Lebon, B mentionné aux tables, C sans apport jurisprudentiel
    // particulier, D et Z intérêt limité aux parties.
    _pubLabel(c) {
      c = String(c == null ? '' : c).toUpperCase();
      if (c === 'A') return 'A — publié au Recueil Lebon';
      if (c === 'B') return 'B — mentionné aux tables du Recueil Lebon';
      if (c === 'C') return "C — pas d'apport jurisprudentiel particulier";
      if (c === 'D' || c === 'Z') return c + ' — intérêt limité aux parties';
      return c;
    }
  };
