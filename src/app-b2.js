import { App, __M, markdown, DOMPurify, Marked, normLang, langInfo, langName, langNative, langBcp47, isRTL, isKnownLang, I18N_DATA, LANGUAGES, SUPPORTED_LANGS, deepMerge, SOFIA_LANGUAGE_DETECTOR, SOFIA_INTERPRETER, SOFIA_PYTHON, attachRPG, attachResearch, attachSTT, attachVoice, attachPiperVoice, attachVocal, attachMentor, attachProfessions, attachChess, attachChess3d, attachChaos, attachDeites, attachDeepMemory, attachMemStruct, attachSelfScript, attachWebLearn, attachConsult, attachSelfUpdate, attachBrand, attachNotice, attachErrorReport, attachFeedback, attachDictionary, attachVision, attachPromptBook, attachPromptBookSeed, attachWebVision, attachWebSearch, attachAppLang, attachMailbox, attachHelp, attachDeviceScan, attachParental, attachVideos, attachMedias, attachImgStyles, attachSheets, attachSfw, attachNoPersonal, attachProviders, attachModes, attachInner, attachThinkFilter, attachGuard, attachPhoto, attachAutoI18n } from './app.js';
  // Ronde 168 (souhait de l'utilisateur : "ligne de code pour chercher un medicament
  // dans un dictionnaire ... voir si ca peut servir Sofia") : VIDAL, la
  // référence française du médicament. Il en naît deux choses.
  // (1) UN OUTIL DE RECHERCHE (App.MedLookup). Un index fourni
  //     (src/medicaments/vidal-index.json, construit à partir des sitemaps publics de
  //     vidal.fr : 8 344 gammes, 15 252 spécialités, 2 265 substances)
  //     est interrogé localement - car le robots.txt de VIDAL bloque pour les robots toutes les
  //     adresses avec "query=", mais pas les fiches elles-mêmes. Ensuite seulement la
  //     vraie fiche est récupérée via superFetch et lue dans le navigateur : la
  //     page de gamme pour une marque, la fiche de substance pour un principe actif,
  //     la spécialité pour un dosage et une forme précis.
  // (2) TROIS FICHES dans src/medicaments/ comme mémoire : VIDAL et ses
  //     fiches, le bon usage des médicaments, les sources officielles.
  //     La même machine que pour les dossiers précédents (copiée et écrasée),
  //     porte propre (isMed) et bloc propre. Lu, jamais prescrit :
  //     pas de dose, pas d'ordonnance.
  App.MedLookup = {
    INDEX_URL: 'src/medicaments/vidal-index.json.gz',
    GAMME_BASE: 'https://www.vidal.fr/medicaments/gammes/',
    DRUG_BASE: 'https://www.vidal.fr/medicaments/',
    SUB_BASE: 'https://www.vidal.fr/medicaments/substances/',
    TIMEOUT_MS: 9000,
    CACHE_MS: 600000,
    MAX_SEC: 1100,
    MAX_TOTAL: 6400,
    _idx: null, _loading: null, _cache: null,
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    warm() {
      if (this._idx || this._loading) return this._loading;
      let self = this;
      try {
        this._loading = App.Core.loadJson(this.INDEX_URL)
          .then(j => {
            self._loading = null;
            if (!j || !j.g) { console.warn('[MedLookup] index absent'); return null; }
            let split = str => String(str || '').split('\n').map(l => {
              let p = l.lastIndexOf(' ');
              return p > 0 ? { s: l.slice(0, p), i: l.slice(p + 1) } : null;
            }).filter(Boolean);
            self._idx = { g: split(j.g), d: split(j.d), s: split(j.s) };
            console.log('[MedLookup] index prêt :', self._idx.g.length, 'Gammes,', self._idx.d.length, 'spécialités,', self._idx.s.length, 'substances');
            return self._idx;
          })
          .catch(e => { self._loading = null; console.warn('[MedLookup] index échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    _norm(s) {
      return String(s == null ? '' : s).toLowerCase()
        .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ');
    },
    STOP: (function () {
      let o = {};
      ('c est quoi quel quelle quels quelles est sont etait le la les un une des de du au aux et ou pour par sur dans avec sans plus moins que qui ce je tu il elle on nous vous me te se moi toi lui eux mon ma mes ton ta tes son sa ses leur leurs peux peut voudrais veux sais savoir connais comprends comprendre donne donner montre rappeler rappelle merci stp svp aide dis dit fait faire lecon revois citer cherche chercher trouve trouv info informations renseigne parles parle quelle dose combien prendre le nom sert sertil sertelle serve servent role utile utilise utiliser utilisation usage indique indiquee traite traiter contre chez quand pourquoi comment effets effet indesirable indesirables posologie posologies danger dangereux risque risques prix cout explique expliquer expliquez raconte raconter decris decrire definir definition definitions substance substances active actif principe medicament medicaments ca cela cella fonctionne marche agit action agitil sertil veux faut dois connaitre parler').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })(),
    _tokens(s) {
      return this._norm(s).split(' ').filter(w => w.length >= 3 && !this.STOP[w]);
    },
    _score(qt, slug) {
      let toks = String(slug || '').split('-').filter(Boolean);
      if (!toks.length) return 0;
      let hit = 0, score = 0, first = 0;
      for (let i = 0; i < qt.length; i++) {
        let q = qt[i], best = 0;
        for (const t of toks) {
          if (t === q) { if (best < 5) best = 5; continue; }
          if (q.length >= 4 && t.indexOf(q) === 0) { if (best < 4) best = 4; }
          else if (t.length >= 4 && q.indexOf(t) === 0) { if (best < 4) best = 4; }
          else if (q.length >= 5 && t.indexOf(q) > 0) { if (best < 2) best = 2; }
        }
        if (best) {
          hit++; score += best;
          if (i === 0 && (toks[0] === q || (q.length >= 4 && toks[0].indexOf(q) === 0))) first = 1;
        }
      }
      if (!hit) return 0;
      score += first ? 3 : 0;
      score -= (qt.length - hit) * 2;
      score -= Math.min(Math.max(toks.length - qt.length, 0), 12) * 0.35;
      return score;
    },
    _best(list, qt) {
      if (!list || !list.length) return null;
      let best = null;
      for (const e of list) {
        let sc = this._score(qt, e.s);
        if (sc > 0 && (!best || sc > best.score)) best = { score: sc, e: e };
      }
      return best;
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
    DROP: /^(posologie|dosage|mode d'emploi|modalit[ée]s d'administration|commentaire|pharmacodynamie|pharmacocin[ée]tique|s[ée]curit[ée] pr[ée]clinique)/i,
    _heading(blk) {
      let sels = ['h2', 'h3', 'h4', 'h5', 'table.title b', 'table.title'];
      for (const sel of sels) {
        let e = blk.querySelector(sel);
        if (e) { let t = this._t(e); if (t && t.length < 140) return t; }
      }
      return '';
    },
    _parse(html, url) {
      let doc;
      try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { return null; }
      if (!doc) return null;
      let main = doc.querySelector('.document') || doc.querySelector('.product-range') || doc.body;
      if (!main) return null;
      let out = { url: url, title: '', substance: null, substanceUrl: null, famille: '', classif: [], excipients: '', presentations: [], gammes: [], sections: [] };
      let h1 = doc.querySelector('h1');
      if (h1) out.title = this._t(h1);
      if (!out.title) out.title = this._norm(String(doc.title || '').split(' - ')[0]);
      let syn = doc.querySelector('#synthese');
      if (syn) {
        syn.querySelectorAll('.classif').forEach(c => {
          let b = c.querySelector('b'), label = b ? this._t(b) : '';
          let val = this._t(c.querySelector('div') || c).replace(label, '').replace(/\s+/g, ' ').trim();
          if (label && val) out.classif.push(label + ' : ' + val);
        });
        let mol = syn.querySelector('.molecules a.link-substances');
        if (mol) { out.substance = this._t(mol); try { out.substanceUrl = new URL(mol.getAttribute('href'), 'https://www.vidal.fr/').href; } catch (e) {} }
        let exc = syn.querySelector('.excipients .list');
        if (exc) out.excipients = this._t(exc);
        syn.querySelectorAll('.packages .package .name').forEach(n => { let t = this._t(n); if (t) out.presentations.push(t); });
      }
      let fam = doc.querySelector('.entetemed .famille');
      if (fam) out.famille = this._t(fam);
      let subL = doc.querySelector('.links.subst a') || doc.querySelector('.links .subst a');
      if (!out.substance && subL) { out.substance = this._t(subL); try { out.substanceUrl = new URL(subL.getAttribute('href'), 'https://www.vidal.fr/').href; } catch (e) {} }
      let gath = doc.querySelector('#substance_gatherings');
      if (gath) {
        gath.querySelectorAll('li .name').forEach(a => { let t = this._t(a); if (t && out.gammes.indexOf(t) < 0) out.gammes.push(t); });
      }
      let seen = {};
      main.querySelectorAll('[data-rubric], .rubric').forEach(blk => {
        let head = this._heading(blk);
        if (!head) return;
        let key = head.toLowerCase().replace(/\s+/g, ' ');
        if (seen[key]) return;
        seen[key] = 1;
        let body = this._t(blk);
        if (body.indexOf(head) === 0) body = body.slice(head.length).trim();
        if (!body) return;
        let gated = /^connectez-vous\s+pour\s+acc/i.test(body) || /^connect/i.test(body) && body.length < 90;
        out.sections.push({ t: head, x: gated ? '' : body, gated: gated });
      });
      for (const s of out.sections) { if (s.x.length > this.MAX_SEC) s.x = s.x.slice(0, this.MAX_SEC) + ' …'; }
      return out;
    },
    async fiche(url) {
      this._cache = this._cache || {};
      let c = this._cache[url];
      if (c && Date.now() - c.ts < this.CACHE_MS) return c.v;
      let html;
      try { html = await this._fetchText(url); } catch (e) { return null; }
      if (!html || html.length < 1500) return null;
      let parsed = this._parse(html, url);
      if (!parsed || !parsed.sections.length && !parsed.presentations.length && !parsed.gammes.length) return null;
      this._cache[url] = { ts: Date.now(), v: parsed };
      return parsed;
    },
    _url(c) {
      let base = c.kind === 'gamme' ? this.GAMME_BASE : (c.kind === 'substance' ? this.SUB_BASE : this.DRUG_BASE);
      return base + c.e.s + '-' + c.e.i + '.html';
    },
    // Une fiche ne compte que si elle donne vraiment quelque chose : les anciens
    // modèles "document abr" de préparations retirées ne portent aucune rubrique.
    _worth(kind, f) {
      if (!f) return false;
      if (kind === 'drug') return f.sections.length >= 2 || f.presentations.length >= 1;
      return f.sections.length >= 3;
    },
    _candidates(idx, qt) {
      let take = (list, kind, bonus) => {
        let out = [];
        for (const e of list) { let sc = this._score(qt, e.s); if (sc > 0) out.push({ kind: kind, e: e, score: sc + bonus }); }
        out.sort((a, b) => b.score - a.score);
        return out.slice(0, 2);
      };
      let all = take(idx.s, 'substance', 1).concat(take(idx.g, 'gamme', 0), take(idx.d, 'drug', -1));
      all.sort((a, b) => b.score - a.score);
      let seen = {}, out = [];
      for (const c of all) { let k = c.kind + ':' + c.e.s; if (seen[k]) continue; seen[k] = 1; out.push(c); }
      return (out.length && out[0].score >= 5) ? out : [];
    },
    async search(text) {
      if (!this.isEnabled()) return { failed: true, reason: 'disabled' };
      try {
        let idx = this._idx || await this.warm();
        if (!idx) return { failed: true, reason: 'no-index' };
        let qt = this._tokens(text);
        if (!qt.length) return { failed: true, reason: 'no-terms' };
        let cands = this._candidates(idx, qt);
        if (!cands.length) return { failed: true, reason: 'no-match' };
        let last = null;
        for (let i = 0; i < cands.length && i < 7; i++) {
          let c = cands[i], url = this._url(c);
          last = url;
          let f = await this.fiche(url);
          if (this._worth(c.kind, f)) return { ok: true, kind: c.kind, score: c.score, url: url, f: f };
        }
        return { failed: true, reason: 'unreadable', url: last };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    rxSection(f, re, max) {
      try {
        const secs = (f && Array.isArray(f.sections)) ? f.sections : [];
        for (const s of secs) {
          if (s && s.t && re.test(s.t)) return String(s.x || '').replace(/\s+/g, ' ').trim().slice(0, max || 320);
        }
      } catch (e) {}
      return '';
    },
    async rxPosology(url) {
      try {
        const html = await this._fetchText(url);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const heads = Array.from(doc.querySelectorAll('h2,h3'));
        for (const h of heads) {
          if (/mode d'emploi|posologie/i.test(h.textContent || '')) {
            let t = '', el = h.nextElementSibling, n = 0;
            while (el && !/^H[23]$/i.test(el.tagName) && n < 10) {
              const v = String(el.textContent || '').replace(/\s+/g, ' ').trim();
              if (v) t += v + '\n';
              el = el.nextElementSibling; n++;
            }
            t = t.trim();
            if (t.length > 20) return t.slice(0, 900);
          }
        }
      } catch (e) {}
      return '';
    },
    rxClinic(f, text) {
      try {
        const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '');
        const tn = norm(text);
        const secs = (f && Array.isArray(f.sections)) ? f.sections : [];
        const flat = norm(secs.map((s) => String((s && s.t) || '') + ' ' + String((s && s.x) || '')).join(' ') + ' ' + ((f && f.title) || ''));
        const snip = (re, max) => {
          const m = flat.match(re);
          if (!m || m.index == null) return '';
          return flat.slice(Math.max(0, m.index - 50), m.index + (max || 200)).replace(/\s+/g, ' ').trim();
        };
        const out = [];
        const ctx = [];
        const am = tn.match(/(\d+)\s*ans/);
        if (am) ctx.push('âge ' + am[1] + ' ans');
        if (/enceinte|grossesse/.test(tn)) ctx.push('grossesse');
        if (/allait/.test(tn)) ctx.push('allaitement');
        if (/nourrisson|bebe/.test(tn)) ctx.push('bébé/nourrisson');
        else if (/enfant|fils|fille|garcon|ado/.test(tn)) ctx.push('enfant');
        if (/allergi/.test(tn)) ctx.push('allergie signalée');
        if (/asthme/.test(tn)) ctx.push('asthme');
        if (/diabete/.test(tn)) ctx.push('diabète');
        if (/coeur|cardiaque|tension|hypertension/.test(tn)) ctx.push('cœur/tension');
        if (/foie|hepatique/.test(tn)) ctx.push('foie');
        if (/rein|renal/.test(tn)) ctx.push('rein');
        if (/ulcere/.test(tn)) ctx.push('ulcère');
        if (/anticoagulant|anti-agregant|kardegic|sous avk/.test(tn)) ctx.push('anticoagulant/antiagrégant');
        if (/je prends|je suis sous|traitement en cours|mon traitement/.test(tn)) ctx.push('traitement en cours');
        if (/fievre/.test(tn)) ctx.push('fièvre');
        if (/toux|touss/.test(tn)) ctx.push('toux');
        if (/douleur/.test(tn)) ctx.push('douleur');
        const dm = tn.match(/depuis\s+(\d+)\s*jours?/);
        if (dm) ctx.push('depuis ' + dm[1] + ' jours');
        if (ctx.length) out.push('Contexte repéré dans ton message : ' + ctx.join(', ') + '.');
        if (/enceinte|grossesse|allait/.test(tn)) {
          const g = snip(/grossesse[\s\S]{0,140}|femme enceinte[\s\S]{0,140}|allaitement[\s\S]{0,140}/, 170);
          if (g) out.push('La fiche dit sur grossesse/allaitement : …' + g + '… — à montrer au médecin, au pharmacien ou au CRAT (lecrat.fr).');
          else out.push('La fiche lue ne donne pas de rubrique grossesse/allaitement visible : seuls un médecin, un pharmacien ou le CRAT (lecrat.fr) tranchent.');
        }
        if (/nourrisson|bebe|enfant|fils|fille|garcon|ado/.test(tn) && !am) out.push('Enfant sans âge ni poids : la dose enfant dépend du poids — donne l’âge et le poids, ou vois le pharmacien.');
        if (/allergi/.test(tn)) out.push('Allergie signalée : fais vérifier les excipients' + (f && f.excipients ? ' (' + String(f.excipients).slice(0, 160) + ')' : '') + ' par le pharmacien.');
        if (/asthme/.test(tn) && flat.indexOf('asthme') < 0) out.push('Asthme signalé mais la fiche n’en parle pas : avis du médecin avant tout nouveau médicament.');
        if (/anticoagulant|anti-agregant|kardegic|sous avk|millepertuis|ibuprofene|ketoprofene|anti-inflammatoire/.test(tn)) {
          const gi = snip(/interaction[\s\S]{0,150}|hemorragie[\s\S]{0,130}|anti-inflammatoire[\s\S]{0,130}/, 170);
          if (gi) out.push('La fiche signale côté interactions : …' + gi + '… — parles-en au pharmacien.');
          else out.push('Interaction possible avec ce que tu prends : parles-en au pharmacien avant d’ajouter quoi que ce soit.');
        }
        if (/sang|difficulte a respirer|essouffl|douleur thoracique|oppression thoracique|confusion|convulsion|urticaire|gonflement du visage|malaise|evanouissement/.test(tn)) out.push('Signal d’alerte dans ce que tu décris : urgences ou 15 sans attendre.');
        else if (dm && /fievre/.test(tn) && parseInt(dm[1], 10) >= 3) out.push('Fièvre depuis ' + dm[1] + ' jours : sans amélioration, consulte un médecin rapidement.');
        else if (dm && /toux|touss/.test(tn) && parseInt(dm[1], 10) >= 8) out.push('Toux depuis ' + dm[1] + ' jours : au-delà d’une semaine sans amélioration, consulte.');
        if (!/ans|enceinte|grossesse|allait|nourrisson|bebe|enfant|fils|fille|garcon|ado|allergi|asthme|diabete|coeur|cardiaque|tension|foie|hepatique|rein|renal|ulcere|anticoagulant|kardegic|je prends|je suis sous|traitement en cours/.test(tn)) out.push('Pour ajuster vraiment au patient : quel âge, grossesse ou allaitement, allergies, traitements en cours ?');
        out.push('Recontrôle : pas d’amélioration, aggravation ou effet indésirable → médecin ; effet grave ou intoxication → 15 ou centre antipoison.');
        return out;
      } catch (e) { return []; }
    },
    async prescriptionCard(res, text) {
      try {
        const f = res && res.f;
        if (!f) return '';
        const L = [];
        L.push('Proposition de traitement (informatif — lu dans le Vidal à l\u2019instant) :');
        L.push('**' + (f.title || 'Médicament') + '**' + (f.substance ? ' (' + f.substance + ')' : ''));
        const ind = this.rxSection(f, /dans quel cas|indication/i, 320);
        if (ind) L.push('• Indications : ' + ind);
        let pos = '';
        try { pos = await this.rxPosology(f.url || res.url); } catch (eP) { pos = ''; }
        if (pos) L.push('• Posologie (Vidal) : ' + pos);
        const ci = this.rxSection(f, /contre-indication/i, 300);
        if (ci) L.push('• Contre-indications : ' + ci);
        const att = this.rxSection(f, /attention|pr[ée]caution|mise en garde/i, 300);
        if (att) L.push('• Précautions : ' + att);
        if (f.url || res.url) L.push('• Fiche complète : ' + (f.url || res.url));
        try {
          const _cl = this.rxClinic(f, text);
          if (_cl && _cl.length) {
            L.push('Lecture clinique de Sofia (d’après ton message, pas du Vidal) :');
            for (const _c of _cl) L.push('• ' + _c);
          }
        } catch (eCl) {}
        L.push('Pour les médicaments sur ordonnance et un traitement vraiment sur mesure, un médecin qui t\u2019examine reste nécessaire.');
        return L.join('\n\n');
      } catch (e) { return ''; }
    },
    MALADIES_URL: 'src/medicaments/vidal-maladies.json',
    MAL_BASE: 'https://www.vidal.fr/',
    _mal: null, _malLoading: null, _malRe: null, _maladiePending: null, _malCache: null,
    malWarm() {
      if (this._mal || this._malLoading) return this._malLoading;
      let self = this;
      try {
        this._malLoading = App.Core.loadJson(this.MALADIES_URL).then(function (j) {
          self._malLoading = null;
          let items = (j && j.items) || [];
          self._mal = items.map(function (e) { return { t: e[0], u: e[1], c: e[2] || '' }; });
          let toks = {};
          self._mal.forEach(function (e) {
            self._norm(e.t).split(' ').forEach(function (w) { if (w.length >= 6 && !self.STOP[w]) toks[w] = 1; });
          });
          let alt = Object.keys(toks).join('|');
          try { self._malRe = alt ? new RegExp('\\b(' + alt + ')', 'i') : null; } catch (eR) { self._malRe = null; }
          console.log('[Maladie] index prêt :', self._mal.length, 'maladies');
          return self._mal;
        }).catch(function (e) { self._malLoading = null; console.warn('[Maladie] index échoué :', e && e.message); return null; });
      } catch (e) { this._malLoading = null; }
      return this._malLoading;
    },
    isMaladie(text) {
      try {
        if (!this._malRe) { try { this.malWarm(); } catch (eW) {} return false; }
        let t = String(text == null ? '' : text);
        if (t.length > 900) t = t.slice(0, 900);
        if (!this._malRe.test(t)) return false;
        if (/(python|javascript|\.py\b|numpy|pandas|def |import |<html|css\b)/i.test(t)) return false;
        return true;
      } catch (e) { return false; }
    },
    async searchMaladie(text) {
      if (!this.isEnabled()) return { failed: true, reason: 'disabled' };
      try {
        let idx = this._mal || await this.malWarm();
        if (!idx || !idx.length) return { failed: true, reason: 'no-index' };
        let qt = this._tokens(text);
        if (!qt.length) return { failed: true, reason: 'no-terms' };
        if (qt.length === 1 && /^(enfant|enfants|bebe|adulte|adultes|homme|femme|fille|fils|garcon|patient|patients)$/.test(qt[0])) return { failed: true, reason: 'too-generic' };
        let best = null;
        for (const e of idx) {
          let slug = this._norm(e.t).replace(/ /g, '-');
          let sc = this._score(qt, slug);
          if (sc < 3.5) continue;
          let pos = 9999;
          for (const q of qt) { let i = slug.indexOf(q); if (i >= 0 && i < pos) pos = i; }
          if (!best || sc > best.score || (sc === best.score && (pos < best.pos || (pos === best.pos && slug.length < best.slug.length)))) best = { e: e, score: sc, pos: pos, slug: slug };
        }
        try {
          let pri = { angine: 'angine-mal-gorge', tension: 'hypertension', avc: 'vasculaire-cerebral', sucre: 'diabete', asthme: 'asthme', cholesterol: 'cholesterol', migraine: 'migraine', insomnie: 'insomnie' };
          for (const q of qt) {
            if (pri[q]) {
              for (const e of idx) {
                if (e.u.indexOf(pri[q]) >= 0) {
                  let slug = this._norm(e.t).replace(/ /g, '-');
                  if (this._score(qt, slug) > 0) { best = { e: e, score: 99, pos: 0, slug: slug }; break; }
                }
              }
            }
            if (best && best.score === 99) break;
          }
        } catch (eP) {}
        if (!best) return { failed: true, reason: 'no-match' };
        let f = await this.ficheMaladie(best.e.u);
        if (!f) return { failed: true, reason: 'unreadable', url: best.e.u };
        return { ok: true, score: best.score, url: this.MAL_BASE + best.e.u, f: f };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    async ficheMaladie(rel) {
      this._malCache = this._malCache || {};
      let c = this._malCache[rel];
      if (c && Date.now() - c.ts < this.CACHE_MS) return c.v;
      try {
        let pages = [rel, String(rel).replace(/\.html$/, '/que-faire.html')];
        let seen = {}, secs = [], intro = '', title = '';
        for (const p of pages) {
          let html = await this._fetchText(this.MAL_BASE + p);
          if (!html || html.length < 3000) continue;
          let doc = new DOMParser().parseFromString(html, 'text/html');
          if (!title) { let h1 = doc.querySelector('h1'); if (h1) title = this._t(h1); }
          if (!intro) { let pi = doc.querySelector('p.intro'); if (pi) intro = this._t(pi).slice(0, 600); }
          let heads = Array.from(doc.querySelectorAll('h2.vlxtitle'));
          for (const h of heads) {
            let t = this._t(h);
            let key = String(h.getAttribute('data-vlxtype') || t).toLowerCase();
            if (seen[key] || !t) continue;
            seen[key] = 1;
            let el = h.nextElementSibling, tx = '', n = 0;
            while (el && n < 6) {
              if (el.matches && el.matches('div.vlxtexte')) { tx = this._t(el); break; }
              el = el.nextElementSibling; n++;
            }
            if (tx) {
              if (tx.length > this.MAX_SEC) tx = tx.slice(0, this.MAX_SEC) + ' …';
              secs.push({ t: t, x: tx });
            }
            if (secs.length >= 6) break;
          }
          if (secs.length >= 6) break;
        }
        if (!secs.length && !intro) return null;
        let v = { title: title, intro: intro, sections: secs };
        this._malCache[rel] = { ts: Date.now(), v: v };
        return v;
      } catch (e) { return null; }
    },
    buildMaladieBlock(res) {
      try {
        if (!res || res.failed || !res.f) return '';
        let f = res.f;
        let L = ['[MALADIE - FICHE VIDAL LUE EN DIRECT]'];
        L.push("You have just read this VIDAL disease page yourself, a moment ago, at " + (res.url || '') + ". VIDAL is the French reference on medicines and health (proprietary, © Vidal France); this is its patient version. Speak from THIS page: explain what the disease is, its symptoms and what to do, the way the page states them, and say that this comes from VIDAL, naming the page.");
        L.push("Hard rules, no exception: this page informs, it never diagnoses and never prescribes. Never say he HAS this disease - only his own doctor, after examining him, diagnoses. Never name a medicine, a dose or a duration from this page: names, doses and durations come ONLY from a drug fiche read live, and only when he explicitly asked his doctor for a treatment. Red-flag signs: urgent care or 15/112. Otherwise: his doctor or pharmacist; pregnancy, child or chronic treatment: doctor, pharmacist or CRAT (lecrat.fr).");
        if (f.title) L.push('Fiche : ' + f.title);
        if (f.intro) L.push(f.intro);
        let total = 0;
        for (const s of (f.sections || [])) {
          if (!s.x || total + s.x.length > 4000) break;
          total += s.x.length;
          L.push('--- ' + s.t + ' ---\n' + s.x);
        }
        return L.join('\n');
      } catch (e) { return ''; }
    },
    buildBlock(res, opts) {
      try {
        if (!res || res.failed || !res.f || !res.f.url) return '';
        let f = res.f;
        let kindLabel = res.kind === 'gamme' ? 'page de gamme (version patient)'
          : res.kind === 'substance' ? 'fiche de substance (fiche DCI)'
          : 'fiche de specialite';
        let L = ['[MEMO DES MEDICAMENTS - FICHE VIDAL LUE EN DIRECT]'];
        L.push("You have just read this VIDAL " + kindLabel + " yourself, a moment ago, at " + f.url + ". VIDAL is the French reference on medicines (proprietary, © Vidal France); a fiche is built on the official RCP or on the patient version. Speak from THIS page: name the medicine exactly as it is named here, name its active substance and its family, then its indications and its warnings the way the page states them, and say that this comes from VIDAL, naming the fiche.");
        if (opts && opts.rx) L.push("PRESCRIPTION MODE: he explicitly asked his doctor for a treatment, in a doctor role. You may state medicine names, doses, durations and frequencies EXACTLY as written on this page - never invented, never reworded, never extrapolated from another rubric. If a rubric is absent from the page, say so plainly and do not invent it. For pregnancy, a child or a long treatment, refer to the doctor, the pharmacist or the CRAT (lecrat.fr). Close with one short line: prescription-only items and a truly tailored treatment need a real examining doctor.");
        else L.push("Hard rules, no exception: never give a dose and never reword one, never prescribe, never advise stopping, doubling or replacing a treatment, never make a diagnosis, and never let a question turn a page into a prescription. If he asks for a dose, say plainly that you do not give dosages, and send him to his doctor or pharmacist; in case of overdose, poisoning or a bad reaction, to the centre antipoison, the SAMU (15) or 112. If a rubric is not below, it is either absent from the page or reserved for health professionals - say so, do not invent it. For a pregnancy, a child or a long treatment, refer to the doctor, the pharmacist or the CRAT (lecrat.fr). The page may carry figures inside its own warnings (a threshold, a ceiling, a delay); treat them as the page's wording about safety, never as a dose for him to take, and never answer a how-much question with one.");
        if (f.title) L.push('Fiche : ' + f.title);
        if (f.famille) L.push('Famille : ' + f.famille);
        if (f.substance) L.push('Substance active : ' + f.substance + (f.substanceUrl ? ' (' + f.substanceUrl + ')' : ''));
        if (f.classif && f.classif.length) f.classif.forEach(c => L.push('Classification : ' + c));
        if (f.excipients) L.push('Excipients : ' + f.excipients);
        if (f.presentations && f.presentations.length) L.push('Presentations : ' + f.presentations.slice(0, 20).join(' | '));
        if (f.gammes && f.gammes.length) L.push('Specialites de cette substance : ' + f.gammes.slice(0, 40).join(', '));
        let total = 0;
        for (const s of f.sections) {
          if (!s.x || this.DROP.test(s.t)) continue;
          if (total + s.x.length > this.MAX_TOTAL) break;
          total += s.x.length;
          L.push('--- ' + s.t + ' ---\n' + s.x);
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  };
  App.MedMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/medicaments/vidal-medicaments.json.gz', kind: 'cours' },
      { url: 'src/medicaments/bon-usage-medicaments.json.gz', kind: 'cours' },
      { url: 'src/medicaments/sources-officielles-medicaments.json.gz', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('medicament medicaments medicamenteuse medicamenteux ordonnance ordonnances prescription prescrit prescrire posologie notice automedication generique generiques biosimilaire biosimilaires gelule gelules comprime comprimes comprime suppositoire suppositoires sirop sachet sachets antibiotique antibiotiques antalgique antalgiques antidouleur antalgiques antipyretique antipyretiques anticoagulant anticoagulants vaccin vaccins pharmacovigilance pharmacie pharmacien pharmaciens contre indication contre indications interaction interactions effet effets indesirable indesirables excipient excipients traitement traitements delivrance remboursement boite boites vidal marge therapeutique').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    SHORT_WORDS: (function () {
      let o = {};
      ('amm cip cis rcp dci atc gpr crat lppr smr asmr dci cap cpr gel pdr sol inj').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae').replace(/[’']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-zà-ÿ0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, String(t == null ? '' : t).replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae'));
    },
    // La porte : s'agit-il d'un médicament, de sa délivrance, de questions sur sa notice
    // - ou nomme-t-il une substance active ou une marque ? Un terme technique ET
    // une question, ou un court message qui ne nomme que le thème.
    isMed(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’]/g, "'");
      const S = /(medicament|medicamenteu|medicamenteuse|medicaments|ordonnance|prescription|posologie|notice|automedication|generique|biosimilaire|gelule|comprime|suppositoire|sirop|sachet|antibiotique|antalgique|antidouleur|anti-?inflammatoire|antipyretique|anticoagulant|antihistaminique|vaccin|pharmacovigilance|pharmacien|pharmacie|contre-?indication|interaction|effets? indesirable|excipient|delivrance|remboursement|\bamm\b|\bcip\b|\brcp\b|vidal|boite de medicament|automédication)/;
      const BRANDS = /(paracetamol|doliprane|efferalgan|dafalgan|ibuprof|advil|nurofen|aspirine|aspégique|aspegic|amoxicilline|clavulan|augmentin|omeprazole|esomeprazole|pantoprazole|metformine|glucophage|levothyrox|sertraline|fluoxetine|prednisolone|cortisone|ventoline|salbutamol|spasfon|smecta|imodium|gaviscon|ma[ae]lox|spedifen|voltarene|ketoprofene|codeine|tramadol|morphine|xanax|alprazolam|lexomil|zolpidem|stilnox|bisoprolol|amlodipine|ramipril|atorvastatine|kardegic|mopral|inexium|coversyl|kreon|aerius|zyrtec|claritin|cetirizine|loratadine|monuril|zithromax|azithromycine|vogalene|motilium|primperan|lyrica|pregabaline|paracetamol|doli-?prane|séresta|seresta|temesta|tranxene|hémigoxine|hemigoxine|eupantol|inipomp|forlax|movicol|dulcolax|microlax|normacol|daflon|ginkor|smecta|tiorfan|imodium|biogaran|sandoz|zentiva|teva|arrow|my?lan|viatris|cristers|zydus|substipharm|eg labo)/;
      const SUF = /\b[a-z]{2,}(cilline|mycine|cycline|azole|prazole|sartan|statine|dipine|olol|azepam|triptan|gliptine|glitazone|floxacine|coxib|profene|asone|olone|caine|thiazide|tidine|triptyline)\b/;
      if (!S.test(tn) && !BRANDS.test(tn) && !SUF.test(tn)) return false;
      // Python, HTML/CSS et langage de programmation : ces fiches n'y appartiennent PAS.
      if (/(\bpython3?\b|\.py\b|<\s*\/?\s*[a-z][a-z0-9]*\s*>|\bcss\b|\bhtml\b|\bjavascript\b|\bnumpy\b|\bpandas\b|\bimport\s|\bdict\b|\btuple\b|\bdef\s+[a-z_])/.test(tn)) return false;
      const Q = /(explique|expliquer|expliquez|comment|c'est quoi|qu'est[- ]?ce|que veut dire|signifie|sens de|pourquoi|combien|quel|quelle|quels|quelles|parle[- ]?moi|parler|decri|defini|role|sert|sert[- ]?il|donne[- ]?moi|dis[- ]?moi|montre|rappelle|cite|liste|presente|resume|aide|lecon|revois|revoir|revis|methode|verifie|détaille|detaille|comprend|cherche|chercher|trouve|trouver|info|renseigne|ca sert a|\?)/;
      if (Q.test(t)) return true;
      if (/\b(j'ai|j ai|je|mon|ma|mes|me|tu|ton|ta|tes|il|elle|nous|vous|ils|elles|suis|aime|aimes|pense|penses|crois|sens|sais|vais|veux|peux|prends|prend|avale|achete|acheter)\b/.test(tn)) return false;
      return t.replace(/\s+/g, ' ').trim().length <= 60;
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
              books.push({ title: label, author: j.author || '', source: j.source || '', licence: j.licence || '', note: j.note || '' });
              j.sections.forEach(s => { if (s && s.x) secs.push({ t: s.t, c: s.c, p: s.p, x: s.x, b: label, k: self.SOURCES[i].kind }); });
            });
            if (!secs.length) { console.warn('[MedMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[MedMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[MedMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    block(text) {
      try {
        if (!this._data || !this.isMed(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MEMO DES MEDICAMENTS ET DES SOURCES OFFICIELLES]'];
        L.push("Voici les fiches sur les medicaments avec lesquelles il travaille" + (books.length > 1 ? ', en plusieurs fiches' : '') + ' : '
          + books.map(b => '« ' + b.title + ' »').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push("The sections below are the ones that match his question. Answer from them and say which fiche and which section it comes from. Give the addresses exactly as the fiche gives them (vidal.fr for a fiche, base-donnees-publique.medicaments.gouv.fr and the CIS/CIP codes for the official data, lecrat.fr for pregnancy and breastfeeding, ansm.sante.fr for a recall or a restriction), and when a source is not in these sections, say so instead of inventing it.");
          L.push("Hard rules, no exception: never a dose, never a prescription, never a diagnosis, never a substitution of one medicine for another. A question of dose, of a symptom, of pregnancy, of a child or of a bad reaction belongs to the doctor or the pharmacist; an overdose, a poisoning or an emergency to the centre antipoison, the SAMU (15) or 112. Write in ordinary text, no emoji, no $ sign, no LaTeX; a medicine name, a code and a quotation stay exactly as the fiche gives them.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push("No section of these fiches matches his question exactly. Here is what they cover, so you can tell him what they hold and explain from them:");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.MedMemo.warm();
  // L'index fait presque 1 Mo. Il n'est PAS récupéré au démarrage, mais quelques
  // secondes plus tard, pour que le premier rendu n'en souffre pas.
  setTimeout(function () { try { App.MedLookup.warm(); } catch (e) {} try { App.MedLookup.malWarm(); } catch (e2) {} }, 4000);
  // Ronde 169 (souhait de l'utilisateur : "Dico des metiers ... et dictionnaire des
  // metiers 2019 ... et dictionnaire interministeriel des competences ... et
  // studyrama fiches-metiers"). Il en naît deux choses, dans src/metiers/.
  // (1) App.MetierLookup - UN OUTIL DE MÉTIERS. Un index fourni des fiches métiers
  //     Studyrama (1497 adresses, à partir du
  //     sitemap.xml public) est interrogé localement ; ensuite seulement la fiche elle-même
  //     est récupérée via superFetch et lue dans le navigateur (missions, compétences,
  //     parcours, perspectives, salaire). En plus, l'index Onisep du "dico
  //     des metiers" 2019 : 569 métiers avec niveau minimal, secteur et les
  //     intérêts qui y mènent.
  // (2) DEUX DOSSIERS comme mémoire : l'orientation en France (Onisep :
  //     27 intérêts, 11 statuts, contrats, diplômes, où trouver de l'aide)
  //     et les compétences des métiers d'État (DICo/RIME : savoir-faire,
  //     savoir-être, connaissances, les niveaux de Notions à Expertise).
  //     La même machine que les dossiers précédents, porte propre (isMetier).
  //     Ils conseillent, ils ne décident pas pour le jeune.
  App.MetierLookup = {
    INDEX_URL: 'src/metiers/studyrama-index.json.gz',
    ONISEP_URL: 'src/metiers/onisep-metiers-index.json.gz',
    BASE: 'https://www.studyrama.com/formations/fiches-metiers/',
    TIMEOUT_MS: 9000,
    CACHE_MS: 600000,
    MAX_SEC: 1000,
    MAX_TOTAL: 5200,
    _idx: null, _on: null, _loading: null, _cache: null, _pending: null,
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    warm() {
      if ((this._idx && this._on) || this._loading) return this._loading;
      let self = this;
      try {
        this._loading = Promise.all([
          App.Core.loadJson(this.INDEX_URL),
          App.Core.loadJson(this.ONISEP_URL)
        ]).then(function (pair) {
          self._loading = null;
          let st = pair[0], on = pair[1];
          if (st && st.fiches) self._idx = String(st.fiches).split('\n').map(l => l.trim()).filter(Boolean);
          if (on && on.metiers) self._on = { centres: on.centres || [], secteur: on.secteur || [], metiers: on.metiers };
          console.log('[MetierLookup] index prêt :', self._idx ? self._idx.length : 0, 'fiches Studyrama,', self._on ? self._on.metiers.length : 0, 'métiers Onisep');
          return self._idx || self._on;
        }).catch(e => { self._loading = null; console.warn('[MetierLookup] index échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    _norm(s) {
      return String(s == null ? '' : s).toLowerCase()
        .replace(/\u0153/g, 'oe').replace(/\u00e6/g, 'ae')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ');
    },
    STOP: (function () {
      let o = {};
      ('c est quoi quel quelle quels quelles est sont etait ete etre avoir le la les un une des de du au aux et ou pour par sur dans avec sans plus moins que qui ce je tu il elle on nous vous me te se moi toi lui eux mon ma mes ton ta tes son sa ses leur leurs peux peut voudrais veux sais savoir connais comprends comprendre donne donner montre rappeler rappelle merci stp svp aide dis dit fait faire lecon revois citer cherche chercher trouve trouv info informations renseigne parles parle pourquoi comment explique expliquer expliquez raconte raconter decris decrire definir definition definitions ca cela fonctionne marche vie metier metiers profession emploi travail travailler choisis choisir choix devenir envie aime aimerais voudrais futur avenir tres bien tout tous toute toutes aussi alors donc mais comme quand meme chez beaucoup vraiment tard').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })(),
    _tokens(s) {
      return this._norm(s).split(' ').filter(w => w.length >= 3 && !this.STOP[w]);
    },
    _score(qt, slug) {
      let toks = String(slug || '').split('-').filter(Boolean);
      if (!toks.length) return 0;
      let hit = 0, score = 0, first = 0, ex = 0;
      for (let i = 0; i < qt.length; i++) {
        let q = qt[i], best = 0;
        for (const t of toks) {
          if (t === q) { if (best < 6) best = 6; ex++; continue; }
          if (q.length >= 4 && t.indexOf(q) === 0) { if (best < 4) best = 4; }
          else if (t.length >= 4 && q.indexOf(t) === 0) { if (best < 5) best = 5; }
          else if (q.length >= 5 && t.indexOf(q) > 0) { if (best < 2) best = 2; }
        }
        if (best) {
          hit++; score += best;
          if (i === 0 && (toks[0] === q || (q.length >= 4 && toks[0].indexOf(q) === 0) || (toks[0].length >= 4 && q.indexOf(toks[0]) === 0))) first = 1;
        }
      }
      if (!hit) return 0;
      score += ex * 2;
      score += first ? 3 : 0;
      score -= (qt.length - hit) * 2;
      score -= Math.min(Math.max(toks.length - qt.length, 0), 12) * 0.35;
      return score;
    },
    _slug(nom) {
      return String(nom == null ? '' : nom)
        .replace(/\u2019/g, ' ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9\/]+/)
        .map(function (seg) { return seg.split('/')[0]; })
        .filter(Boolean)
        .join('-');
    },
    local(text) {
      try {
        if (!this._on || !this._on.metiers) return null;
        let qt = this._tokens(text);
        if (!qt.length) return null;
        let best = null;
        for (const m of this._on.metiers) {
          let sc = this._score(qt, this._slug(m[0]));
          if (sc > 0 && (!best || sc > best.score)) best = { score: sc, m: m };
        }
        if (!best || best.score < 6) return null;
        let m = best.m;
        return {
          nom: m[0], page: m[1], niveau: m[5], secteur: this._on.secteur[m[3]] || '',
          centres: String(m[4] || '').split(',').filter(Boolean).map(i => this._on.centres[+i]).filter(Boolean)
        };
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
    _parse(html, url) {
      let doc;
      try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { return null; }
      if (!doc) return null;
      let main = doc.querySelector('article') || doc.querySelector('.main-content') || doc.querySelector('main') || doc.body;
      if (!main) return null;
      let out = { url: url, title: '', intro: '', updated: '', sections: [] };
      let h1 = doc.querySelector('h1');
      if (h1) out.title = this._t(h1);
      if (!out.title) out.title = this._t(doc.querySelector('title')).split(' - ')[0];
      let lds = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const ld of lds) {
        try {
          let j = JSON.parse(ld.textContent || '{}');
          let g = j['@graph'] || [j];
          let a = g.filter ? (g.filter(x => x && x['@type'] === 'Article')[0] || {}) : {};
          if (a.description && !out.intro) out.intro = String(a.description).replace(/\s+/g, ' ').trim();
          if (a.dateModified) out.updated = String(a.dateModified).slice(0, 10);
        } catch (e) {}
      }
      let seen = {};
      main.querySelectorAll('h2').forEach(h => {
        let t = this._t(h);
        if (!t || t.length > 140 || seen[t]) return;
        let box = h.closest('div.field__item') || h.parentElement;
        if (!box) return;
        let clone = box.cloneNode(true);
        clone.querySelectorAll('h2,h3,script,style,form,button,nav,aside').forEach(x => x.remove());
        let x = this._t(clone);
        if (x.length < 40) return;
        seen[t] = 1;
        out.sections.push({ t: t, x: x.slice(0, this.MAX_SEC) });
      });
      return out.sections.length ? out : null;
    },
    fiche(url) {
      this._cache = this._cache || {};
      let c = this._cache[url];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return Promise.resolve(c.v);
      let self = this;
      return this._fetchText(url).then(function (html) {
        let f = self._parse(html, url);
        self._cache[url] = { t: Date.now(), v: f };
        return f;
      }).catch(function () { return null; });
    },
    async search(text) {
      if (!this.isEnabled()) return { failed: true, reason: 'disabled' };
      try {
        if (!this._idx && !this._on) await this.warm();
        let qt = this._tokens(text);
        let local = this.local(text);
        let best = null;
        if (this._idx && qt.length) {
          for (const line of this._idx) {
            let sc = this._score(qt, line.split('/').pop());
            if (sc > 0 && (!best || sc > best.score)) best = { score: sc, line: line };
          }
        }
        if (best && best.score >= 6) {
          for (let i = 0; i < 2; i++) {
            let url = this.BASE + best.line;
            let f = await this.fiche(url);
            if (f) return { ok: true, url: url, f: f, local: local, score: best.score };
            break;
          }
        }
        if (local) return { ok: true, url: null, f: null, local: local, score: 0, localOnly: true };
        return { failed: true, reason: qt.length ? 'no-match' : 'no-terms' };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    buildBlock(res) {
      try {
        if (!res || res.failed) return '';
        let L = ['[FICHES DES METIERS - ORIENTATION]'];
        if (res.local) {
          L.push('Ligne de l\'index Onisep (dico des metiers 2019) : ' + res.local.nom
            + ' - niveau d\'etudes minimal : ' + res.local.niveau
            + ' ; secteur professionnel : ' + (res.local.secteur || 'non precise')
            + (res.local.centres && res.local.centres.length ? ' ; centres d\'interet associes : ' + res.local.centres.join(', ') : '') + '.');
        }
        if (res.f && res.f.sections && res.f.sections.length) {
          L.push('You have just read this Studyrama job sheet yourself, a moment ago, at ' + res.url
            + (res.f.updated ? ' (updated ' + res.f.updated + ')' : '')
            + '. Name Studyrama as the source of the sheet, and give the access level (the diploma it takes) from the Onisep line, then speak from this sheet: the missions as this sheet lists them, the qualities and the training it names, the prospects, and the salary ONLY as an indication that Studyrama gives (a range, which varies with region, seniority and employer - never a promise, never a figure for him in particular).');
          L.push('Rules, no exception: never tell him what he must do with his life, never rank jobs by prestige or by pay, never say that a job is for one sex or for the other, never promise a job or a salary. Give the access level as a starting point, not as a rule (it comes from the Onisep index of the dico des metiers 2019, and diplomas and training change). For a personal choice of orientation, send him to the CIO and its psychologue de l\'Education nationale, to onisep.fr, and after the bac to Parcoursup; for apprenticeship, to a CFA. If a rubric is not below, say so instead of inventing it. Write plain text, no emoji, no $ sign, no LaTeX.');
          if (res.local) L.push('Fiche : ' + res.local.nom + ' (niveau minimal ' + res.local.niveau + ', secteur ' + (res.local.secteur || '?') + ')');
          if (res.f.intro) L.push('Resume de la page : ' + res.f.intro);
          let total = 0;
          for (const s of res.f.sections) {
            if (total + s.x.length > this.MAX_TOTAL) break;
            total += s.x.length;
            L.push('--- ' + s.t + ' ---\n' + s.x);
          }
        } else if (res.local) {
          L.push('No Studyrama sheet was read for this one. Use the Onisep index line above (the minimal level and the sector are facts from it), and say plainly what it does not carry: the daily work, the training path and the prospects then come from your general knowledge or from onisep.fr and studyrama.com/formations/fiches-metiers. Do not invent a salary.');
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  };
  App.MetierMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/metiers/orientation-france.json.gz', kind: 'cours' },
      { url: 'src/metiers/competences-etat.json.gz', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('metier metiers profession professions emploi emplois job jobs carriere carrieres orientation diplome diplomes formation formations etude etudes etudiant etudiante scolaire lycee college universite licence master bts dut cap bac concours salaire salaires remuneration debouche debouches recrutement recrute embauche alternance apprentissage apprenti stage stages parcoursup cfa onisep studyrama reconversion devenir choisir choix avenir projet voie filiere specialite specialites secteur manuel metiers').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    SHORT_WORDS: (function () {
      let o = {};
      ('cap bts dut bp bma mc cs cfa cv iut rh bac pro').split(' ').forEach(w => { if (w) o[w] = 1; });
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
    // La porte : s'agit-il d'un métier, d'une formation, d'études, d'un
    // salaire, d'une reconversion, d'une question d'orientation ? Pas de médicaments,
    // langages de programmation ou anatomie - ceux-là ont leurs propres dossiers.
    isMetier(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019]/g, "'");
      if (/(medicament|medicaments|posologie|ordonnance|antibiotique|antalgique|vaccin|doliprane|paracetamol|ibuprofene|mol[eé]cule chimique|\bpython3?\b|\bhtml\b|\bcss\b|\bjavascript\b|anatomie|physiologie|\bnerf\b|\bmuscle\b|\barticulation\b|sexolog|contracepti)/.test(tn)) return false;
      const K = /(metier|metiers|profession|professions|\bemploi\b|\bemplois\b|\bjob\b|\bjobs\b|carriere|orientation|diplome|diplomes|reconversion|alternance|apprentissage|parcoursup|\bcfa\b|\bonisep\b|studyrama|fiche metier|fiche-metier|debouche|debouches|salaire|salaires|remuneration|travailleur social|fonction publique|\bconcours\b)/;
      if (K.test(tn)) return true;
      const D = /(comment devenir|je veux devenir|je voudrais devenir|j'aimerais devenir|j aimerais devenir|que fait un|que fait une|que fait le|que fait la|quel metier|quelle profession|quels metiers|quelles etudes|pour devenir|pour exercer|metier de|profession de|salaire d|salaire de|devenir (?:un|une|le|la)?\s*[a-z])/;
      if (D.test(tn)) return true;
      // Et la preuve la plus forte : le métier figure dans l'index Onisep (569 métiers).
      // "je veux etre pompier", "aide soignant", "kinesitherapeute" - un nom
      // suffit, la porte s'ouvre.
      try {
        if (App.MetierLookup && App.MetierLookup.local) {
          if (!App.MetierLookup._idx) { try { App.MetierLookup.warm(); } catch (e) {} }
          if (App.MetierLookup.local(text)) return true;
        }
      } catch (e) {}
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
              books.push({ title: label, author: j.author || '', source: j.source || '', licence: j.licence || '', note: j.note || '' });
              j.sections.forEach(s => { if (s && s.x) secs.push({ t: s.t, c: s.c, p: s.p, x: s.x, b: label, k: self.SOURCES[i].kind }); });
            });
            if (!secs.length) { console.warn('[MetierMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[MetierMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[MetierMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    block(text) {
      try {
        if (!this._data || !this.isMetier(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MEMO DES METIERS ET DE L\'ORIENTATION EN FRANCE]'];
        L.push('Voici les fiches sur les metiers et l\'orientation avec lesquelles il travaille' + (books.length > 1 ? ', en plusieurs fiches' : '') + ' : '
          + books.map(b => '« ' + b.title + ' »').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push('The sections below are the ones that match his question. Answer from them and say which fiche and which section it comes from. The access levels, the sectors and the diplomas come from the Onisep dico des metiers 2019 and from the DICo 2017: give them as they stand, and when a source is not in these sections, say so instead of inventing it.');
          L.push('Hard rules, no exception: do not choose his life for him, do not rank jobs by prestige or by pay, never say a job is for one sex, never promise a job or a salary. For a personal orientation choice, send him to the CIO and its psychologue de l\'Education nationale, to onisep.fr, and after the bac to Parcoursup; for apprenticeship to a CFA. Write in ordinary text, no emoji, no $ sign, no LaTeX.');
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push('No section of these fiches matches his question exactly. Here is what they cover, so you can tell him what they hold and explain from them:');
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.MetierMemo.warm();
  setTimeout(function () { try { App.MetierLookup.warm(); } catch (e) {} }, 5200);
