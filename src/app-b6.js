import { App, __M, markdown, DOMPurify, Marked, normLang, langInfo, langName, langNative, langBcp47, isRTL, isKnownLang, I18N_DATA, LANGUAGES, SUPPORTED_LANGS, deepMerge, SOFIA_LANGUAGE_DETECTOR, SOFIA_INTERPRETER, SOFIA_PYTHON, attachRPG, attachResearch, attachSTT, attachVoice, attachPiperVoice, attachVocal, attachMentor, attachProfessions, attachChess, attachChess3d, attachChaos, attachDeites, attachDeepMemory, attachMemStruct, attachSelfScript, attachWebLearn, attachConsult, attachSelfUpdate, attachBrand, attachNotice, attachErrorReport, attachFeedback, attachDictionary, attachVision, attachPromptBook, attachPromptBookSeed, attachWebVision, attachWebSearch, attachAppLang, attachMailbox, attachHelp, attachDeviceScan, attachParental, attachVideos, attachMedias, attachImgStyles, attachSheets, attachSfw, attachNoPersonal, attachProviders, attachModes, attachInner, attachThinkFilter, attachGuard, attachPhoto, attachAutoI18n } from './app.js';

  App.SelfKnow = {
    _pending: null, _db: null,
    RX: /combien de parties|parties.*(base|memoire|donn|stock|archiv|connais|tu as|vous avez)|base.*(partie|echec|coup|donn|stock|archiv|connais)|bdd|database|donn.{0,3}es.*(partie|echec|stock)|stock.*(partie|echec)|archiv.*(partie|echec)|(tu|vous|sofia).*(base|donn|stock|archiv|partie.*stock)|moteur de recherche|serveur.*archiv|joues?.*(base|donn|contre.*donn)|intelligence.*(base|donn|partie)|pas de base|aucune base|sans base|connais.*(quoi|sujet|domaine)|tes (connaissances|sujets|sources|donnees)|quels.*(sujets|domaines|connaissances)|tes (domaines|connaissances)|tu sais quoi|tes savoirs|c.est quoi le mode|qu.est.ce que le mode|mode (enfer|neant|dieu|mentor|rpg|interprete|echec|normal)|explique.*(modes?|menus?|fonction|possibilit)|tous les modes|liste des modes|tes (modes|menus|fonctions|possibilites)|quelles.*(fonction|possibilit|menu)|que sais-tu faire|tu sais faire quoi|interprete.*(sert|quoi|veut dire|definition)|metiers?.*(combien|liste|connais)|combien de metiers|combien de.*(gamme|medicament|blog|code|article|fiche)|(ue.conseil|fiscalite|jurisprudence)|menus?.*(ou est|ou sont|pars|reglage|trouve)|c.est quoi (le neant|l.enfer|dieu|interpreteur|l.interpreteur)|niveau.*(echec|\belo\b|fide|classement)|(echec|\belo\b|fide|classement).*(niveau|fort|classe)|\belo\b|fide|(\bfort\b|\bforte\b|\bjoue\b|\bjoues\b|\bbats\b).*(echec|\belo\b)|ton niveau de jeu/,
    norm(t) {
      try {
        return String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '')
          .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
      } catch (e) { return String(t || '').toLowerCase(); }
    },
    wants(text) { try { return this.RX.test(this.norm(text)); } catch (e) { return false; } },
    _refreshLive(db) {
      try {
        const ix = App.MedLookup && App.MedLookup._idx;
        if (ix) {
          const sz = function (v) { if (Array.isArray(v)) return v.length; if (v && typeof v === 'object') { let n = 0; for (const k in v) n++; return n; } return 0; };
          const g = sz(ix.g), d = sz(ix.d), s = sz(ix.s);
          if (g || d || s) db.medIdx = { g: g, d: d, s: s };
        }
      } catch (e) {}
      try { const v = App.MetierLookup && App.MetierLookup._idx; if (Array.isArray(v) && v.length) db.metierFiches = v.length; } catch (e) {}
      try { const v = App.GbdLookup && App.GbdLookup._blogs; if (Array.isArray(v) && v.length) db.gbdBlogs = v.length; } catch (e) {}
      try { const v = App.DroitLookup && App.DroitLookup._reg && App.DroitLookup._reg.codes; if (Array.isArray(v) && v.length) db.droitCodes = v.length; } catch (e) {}
      try { const r = App.DroitLookup && App.DroitLookup._remote; if (r) { let n = 0; for (const k in r) n++; if (n) db.droitFichiers = n; } } catch (e) {}
      try {
        if (Array.isArray(db.memos)) {
          const seen = {};
          for (const m of db.memos) seen[m.id] = m.n;
          const T = [['MathMemo', 'maths'], ['AnatomyMemo', 'anatomie'], ['WebMemo', 'web'], ['PythonMemo', 'python'], ['SexoMemo', 'intime'], ['DicoMemo', 'dictionnaire'], ['CuisineMemo', 'cuisine'], ['PhysiqueMemo', 'physique'], ['HistoireGeoMemo', 'histoire-geo'], ['GrammaireMemo', 'grammaire'], ['MedMemo', 'medecine'], ['MetierMemo', 'metiers'], ['DroitMemo', 'droit-fr'], ['JuriMemo', 'jurisprudence'], ['DroitMondeMemo', 'droit-monde'], ['ConsiliumMemo', 'ue-conseil'], ['ProtonMemo', 'fiscalite'], ['GbdMemo', 'blogs-memo'], ['AncientMemo', 'antiquite'], ['LanguesMemo', 'langues']];
          for (const pair of T) {
            if (!seen[pair[1]]) {
              try {
                const M = App[pair[0]];
                const ix2 = (M && typeof M._index === 'function') ? M._index() : null;
                if (ix2 && typeof ix2.n === 'number' && ix2.n > 0) db.memos.push({ id: pair[1], n: ix2.n });
              } catch (e2) {}
            }
          }
        }
      } catch (e) {}
      return db;
    },
    async counts() {
      if (this._db) { try { this._refreshLive(this._db); } catch (e) {} return this._db; }
      let games = 0, lines = 0, ecos = 0;
      try {
        const L = await import('./atelier-loader.js');
        const key = (window.SofiaEnc && window.SofiaEnc.key) || '';
        const plain = async (p) => {
          const t = await fetch(p, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
          return L.decryptText(t, key);
        };
        try {
          const g = await plain('src/chess-games.js');
          const m = g.match(/,"[A-E][0-9]{2}[a-z]?",/g);
          games = m ? m.length : 0;
        } catch (e) {}
        try {
          const o = await plain('src/chess-openings.js');
          const m2 = o.match(/\{ eco: '/g);
          lines = m2 ? m2.length : 0;
          ecos = new Set(o.match(/eco: '[A-E][0-9]{2}'/g) || []).size;
        } catch (e) {}
      } catch (e) {}
      let mine = null;
      try { mine = (App.Chess && typeof App.Chess.stats === 'function') ? App.Chess.stats() : null; } catch (e) {}
      let chessBases = [];
      try {
        if (App.ChessDB && typeof App.ChessDB.manifest === 'function') {
          const man = await App.ChessDB.manifest();
          if (man && typeof man.totalGames === 'number' && man.totalGames >= games) games = man.totalGames;
          if (man && Array.isArray(man.bases)) chessBases = man.bases.map(function (b) { return { id: b.id, nom: b.nom || b.id, games: b.games || 0 }; });
          try {
            const eb = (man && Array.isArray(man.bases)) ? man.bases.find(function (b) { return b.id === 'eco-codes'; }) : null;
            if (eb && eb.lignes > lines) { lines = eb.lignes; ecos = eb.codesBase || ecos; }
          } catch (e) {}
        }
      } catch (e) {}
      let met = null;
      try {
        const P = App.Professions;
        met = {
          n: (P && typeof P.all === 'function') ? P.all().length : 0,
          s: (P && typeof P.sectors === 'function') ? P.sectors().length : 0,
          c: (P && typeof P.countries === 'function') ? P.countries().length : 0
        };
      } catch (e) {}
      const fresh = this._refreshLive({ memos: (Array.isArray(this._memos) ? this._memos : (this._memos = [])) });
      this._db = { games, lines, ecos, mine, met, chessBases, memos: fresh.memos, medIdx: fresh.medIdx || null, metierFiches: fresh.metierFiches || 0, gbdBlogs: fresh.gbdBlogs || 0, droitCodes: fresh.droitCodes || 0, droitFichiers: fresh.droitFichiers || 0 };
      return this._db;
    },
    async search(text) {
      if (!this.wants(text)) { this._pending = null; return null; }
      const c = await this.counts();
      const out = { ok: true, c };
      this._pending = out;
      return out;
    },
    buildBlock(p) {
      if (!p || !p.ok) return '';
      const c = p.c || {};
      const L = [];
      L.push('[SELF - SOFIA PARLE D ELLE-MEME - CHIFFRES LUS EN DIRECT DANS SES PROPRES FICHIERS, REPONDS A PARTIR D EUX SANS INVENTER]');
      L.push('Tu POSSEDES ces bases en copie integrale dans tes propres fichiers (src/echecs/, manifestes lus en direct). Ne dis JAMAIS que tu n as pas de base de donnees, que tu n es pas un serveur d archives ou que tu ne stockes rien : c est faux.');
      if (c.games) L.push('Echecs en base : ' + c.games + ' parties en copie integrale' + (Array.isArray(c.chessBases) && c.chessBases.length ? ' (' + c.chessBases.map(function (b) { return (b.id || b.nom) + ':' + b.games; }).join(' + ') + ')' : '') + ', PGN complet relu a la demande, jamais resume.');
      if (c.lines) L.push('Livre d ouvertures : ' + c.lines + ' lignes ECO, ' + c.ecos + ' codes ECO distincts, table francaise 2365 lignes en copie integrale.');
      L.push('Comment tu joues : avec ton moteur local, ton livre ECO, ton repertoire ChessTempo (2963 variantes nommees, position->nom), ta table Lumbras (10360 lignes coups->code), ton livre live GameKnot (stats reelles 4M parties sur FEN) et ton livre Polyglot SCID-Performance hors-ligne (92 954 positions, coups ponderes), ta table CDG-Openings (7680 lignes FEN->ECO+nom), ton éval cloud Lichess (Stockfish direct, sans clé) et en option le livre live Lichess (source des coups : hybride) ; tu ne recopies pas une partie existante, tu reflechis. Tu relis une partie exacte seulement quand on te la demande (reference base-numero).');
      L.push('Tes fonctions echecs : analyser une position, proposer des variantes, expliquer pourquoi un coup est une erreur, coacher, donner des problemes tactiques (Lichess, pas de stock fixe).');
      L.push('Problemes tactiques : a la demande depuis Lichess (pas de stock fixe).');
      L.push('Tout document remis, tous sujets, est garde en copie integrale et relu au mot pres, jamais resume.');
      if (c.mine && typeof c.mine.games === 'number') L.push('Tes parties a toi contre elle : ' + c.mine.games + ' jouees (' + (c.mine.w || 0) + ' gagnee(s), ' + (c.mine.l || 0) + ' perdue(s), ' + (c.mine.d || 0) + ' nulle(s)).');
      if (c.met && c.met.n) L.push('Metiers : ' + c.met.n + ' metiers, ' + c.met.s + ' secteurs, ' + c.met.c + ' pays.');
      if (Array.isArray(c.memos) && c.memos.length) L.push('Tes domaines relus en direct (' + c.memos.length + ' classeurs, sections lues dans tes fichiers) : ' + c.memos.map(function (m) { return m.id + ':' + m.n; }).join(' + ') + '. Cite uniquement ces chiffres, n invente aucun autre domaine.');
      if (c.medIdx && (c.medIdx.g || c.medIdx.d || c.medIdx.s)) L.push('Medicaments (index live) : ' + c.medIdx.g + ' gammes, ' + c.medIdx.d + ' specialites, ' + c.medIdx.s + ' substances.');
      if (c.metierFiches) L.push('Fiches metiers : ' + c.metierFiches + ' fiches.');
      if (c.gbdBlogs) L.push('Blogs intimes : ' + c.gbdBlogs + ' blogs suivis.');
      if (c.droitCodes || c.droitFichiers) L.push('Droit (registre live) : ' + c.droitCodes + ' codes, ' + c.droitFichiers + ' fichiers d index.');
      L.push('MODES : Normal (elle-meme, par defaut). Mentor (coaching socratique par petits pas, il questionne au lieu de donner la reponse). Interprete (elle ecrit et execute du vrai code aussitot — interpreteur veut dire celui qui execute le code ; JavaScript et Python avec numpy, pandas, matplotlib, dans un bac a sable isole ; se combine avec le Mentor). RPG (maitresse de jeu d une aventure de table : narration, personnages, des). Echecs (vraie partie sur echiquier, son moteur de regles seul arbitre, ou coach si tu preferes ; pleine puissance en option, 3D possible). Neant (session volontairement isolee et ephemere, froide et poetique ; on en sort par le bouton, rien ne rejoint les autres conversations). Dieu (ambiance lumineuse et majestueuse) et Enfer (ambiance sombre, l Adversaire) : des roles d ambiance, on en sort par le bouton de sortie.');
      L.push('MENUS (boutons reels de ton interface) : Paramètres, ❓ Guide (curseurs expliques, version, signalement de bugs), 💡 Sujets (espace communautaire), Parler (vocal), onglets Images et Documents, Nouvelle conversation, panneau Echecs (nouvelle partie, annuler un coup, indice, echiquier 3D, pleine puissance, choix de la variante, de la couleur, du personnage, source des coups, commentaires, horloge, theme et style des pieces, barre d evaluation, coordonnees, sons, livre ECO, livre live Lichess). Ne cite que ces boutons, n en invente aucun.');
      L.push('Texte ordinaire, sans emoji.');
      return L.join('\n').slice(0, 4500);
    }
  };

  App.ModeFauna = {
    _raf: 0, _watch: 0, _mode: null, _parts: [], _t: 0,
    modeNow() {
      try { if (App.Chaos && App.Chaos.isActive && App.Chaos.isActive()) return 'neant'; } catch (e) {}
      try {
        if (App.Deites && App.Deites.is) {
          if (App.Deites.is('hell')) return 'enfer';
          if (App.Deites.is('god')) return 'dieu';
        }
      } catch (e) {}
      return null;
    },
    cv() { try { return document.getElementById('modeFaunaCv'); } catch (e) { return null; } },
    size(cv) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth, h = window.innerHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      }
      return {w, h, dpr};
    },
    seed(mode, w, h) {
      const R = Math.random, small = w < 700 ? 0.55 : 1, P = [];
      const n = q => Math.max(4, Math.round(q * small));
      if (mode === 'neant') {
        for (let i = 0; i < n(24); i++) P.push({k: 'wisp', x: R() * w, y: R() * h, vx: (R() - 0.5) * 0.14, vy: (R() - 0.5) * 0.1, r: 26 + R() * 60, ph: R() * 6.28, sp: 0.2 + R() * 0.5});
        for (let i = 0; i < n(5); i++) P.push({k: 'eye', x: R() * w, y: R() * h, r: 9 + R() * 14, ph: R() * 6.28, sp: 0.1 + R() * 0.2});
      } else if (mode === 'dieu') {
        for (let i = 0; i < n(38); i++) P.push({k: 'mote', x: R() * w, y: R() * h, vy: -(0.15 + R() * 0.45), sway: 10 + R() * 26, r: 0.8 + R() * 2.2, ph: R() * 6.28, sp: 0.3 + R() * 0.7});
        for (let i = 0; i < n(8); i++) P.push({k: 'petal', x: R() * w, y: R() * h, vy: 0.12 + R() * 0.25, vx: (R() - 0.5) * 0.2, r: 3 + R() * 5, rot: R() * 6.28, vr: (R() - 0.5) * 0.03, ph: R() * 6.28});
        for (let i = 0; i < 3; i++) P.push({k: 'ring', x: w * (0.25 + 0.25 * i) + R() * 60, y: h * (0.3 + R() * 0.4), r: 6, vr: 0.5 + R() * 0.4, max: 90 + R() * 70});
      } else {
        for (let i = 0; i < n(48); i++) P.push({k: 'ember', x: R() * w, y: h * 0.3 + R() * h * 0.7, vy: -(0.3 + R() * 0.9), sway: 8 + R() * 22, r: 0.8 + R() * 2.4, ph: R() * 6.28, sp: 1 + R() * 3});
        for (let i = 0; i < n(4); i++) P.push({k: 'bat', x: R() * w, y: R() * h * 0.7, vx: (R() < 0.5 ? -1 : 1) * (0.6 + R() * 0.9), ph: R() * 6.28, sp: 6 + R() * 4, s: 7 + R() * 7});
      }
      this._parts = P;
    },
    step(mode, w, h) {
      for (const p of this._parts) {
        if (p.k === 'wisp' || p.k === 'eye') {
          p.x += p.vx; p.y += p.vy; p.ph += 0.008 * p.sp;
          if (p.x < -80) p.x = w + 80; if (p.x > w + 80) p.x = -80;
          if (p.y < -80) p.y = h + 80; if (p.y > h + 80) p.y = -80;
        } else if (p.k === 'mote') {
          p.y += p.vy; p.ph += 0.02 * p.sp; p.x += Math.sin(p.ph) * 0.3;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        } else if (p.k === 'petal') {
          p.y += p.vy; p.x += p.vx + Math.sin(p.ph += 0.01) * 0.3; p.rot += p.vr;
          if (p.y > h + 12) { p.y = -12; p.x = Math.random() * w; }
        } else if (p.k === 'ring') {
          p.r += p.vr;
          if (p.r > p.max) { p.r = 6; p.x = Math.random() * w; p.y = Math.random() * h; }
        } else if (p.k === 'ember') {
          p.y += p.vy; p.ph += 0.05 * p.sp; p.x += Math.sin(p.ph) * 0.5;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        } else if (p.k === 'bat') {
          p.x += p.vx; p.ph += 0.09;
          p.y += Math.sin(p.ph * 0.4) * 0.5;
          if (p.vx > 0 && p.x > w + 30) { p.x = -30; p.y = Math.random() * h * 0.7; }
          if (p.vx < 0 && p.x < -30) { p.x = w + 30; p.y = Math.random() * h * 0.7; }
        }
      }
    },
    draw(cx, mode, w, h, dpr) {
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, w, h);
      const t = this._t += 0.016;
      if (mode === 'neant') {
        for (const p of this._parts) {
          if (p.k === 'wisp') {
            const a = 0.05 + 0.05 * Math.sin(p.ph + t * p.sp);
            const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, 'rgba(190,180,220,' + a.toFixed(3) + ')');
            g.addColorStop(1, 'rgba(190,180,220,0)');
            cx.fillStyle = g;
            cx.beginPath(); cx.ellipse(p.x, p.y, p.r, p.r * 0.45, Math.sin(p.ph) * 0.6, 0, 6.29); cx.fill();
          } else {
            const open = 0.5 + 0.5 * Math.sin(p.ph + t * p.sp);
            if (open < 0.12) continue;
            cx.fillStyle = 'rgba(8,6,14,0.85)';
            cx.beginPath(); cx.ellipse(p.x, p.y, p.r, p.r * 0.55 * open + 1, 0, 0, 6.29); cx.fill();
            cx.fillStyle = 'rgba(205,190,235,' + (0.5 * open).toFixed(3) + ')';
            cx.beginPath(); cx.ellipse(p.x, p.y, p.r * 0.32, p.r * 0.3 * open + 0.6, 0, 0, 6.29); cx.fill();
          }
        }
      } else if (mode === 'dieu') {
        cx.globalCompositeOperation = 'lighter';
        for (const p of this._parts) {
          if (p.k === 'mote') {
            const tw = 0.35 + 0.65 * Math.abs(Math.sin(p.ph + t * p.sp));
            cx.fillStyle = 'rgba(255,215,130,' + (0.75 * tw).toFixed(3) + ')';
            cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.29); cx.fill();
          } else if (p.k === 'petal') {
            cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
            cx.fillStyle = 'rgba(255,232,170,0.5)';
            cx.beginPath(); cx.ellipse(0, 0, p.r, p.r * 0.45, 0, 0, 6.29); cx.fill();
            cx.restore();
          } else {
            const a = Math.max(0, 0.4 * (1 - p.r / p.max));
            cx.strokeStyle = 'rgba(255,220,140,' + a.toFixed(3) + ')';
            cx.lineWidth = 1.5;
            cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.29); cx.stroke();
          }
        }
        cx.globalCompositeOperation = 'source-over';
      } else {
        const g0 = cx.createRadialGradient(w / 2, h + 40, 10, w / 2, h + 40, h * 0.55);
        g0.addColorStop(0, 'rgba(255,80,20,0.10)');
        g0.addColorStop(1, 'rgba(255,80,20,0)');
        cx.fillStyle = g0; cx.fillRect(0, 0, w, h);
        cx.globalCompositeOperation = 'lighter';
        for (const p of this._parts) {
          if (p.k === 'ember') {
            const fl = 0.5 + 0.5 * Math.sin(p.ph * 2 + t * 3);
            cx.fillStyle = 'rgba(255,' + Math.round(90 + 90 * fl) + ',20,' + (0.8 * fl + 0.1).toFixed(3) + ')';
            cx.beginPath(); cx.arc(p.x, p.y, p.r * (0.7 + 0.5 * fl), 0, 6.29); cx.fill();
          } else {
            const flap = Math.sin(p.ph) * p.s * 0.9;
            cx.fillStyle = 'rgba(20,5,5,0.9)';
            cx.beginPath();
            cx.moveTo(p.x - p.s, p.y);
            cx.quadraticCurveTo(p.x - p.s * 0.4, p.y - flap, p.x, p.y);
            cx.quadraticCurveTo(p.x + p.s * 0.4, p.y - flap, p.x + p.s, p.y);
            cx.quadraticCurveTo(p.x + p.s * 0.4, p.y + p.s * 0.35, p.x, p.y + p.s * 0.25);
            cx.quadraticCurveTo(p.x - p.s * 0.4, p.y + p.s * 0.35, p.x - p.s, p.y);
            cx.fill();
          }
        }
        cx.globalCompositeOperation = 'source-over';
      }
    },
    loop() {
      this._raf = 0;
      const mode = this.modeNow();
      const cv = this.cv();
      if (!mode || !cv) { this.stop(); return; }
      if (mode !== this._mode) { this._mode = mode; const s = this.size(cv); this.seed(mode, s.w, s.h); }
      const s = this.size(cv);
      const cx = cv.getContext('2d');
      if (cx) { this.step(mode, s.w, s.h); this.draw(cx, mode, s.w, s.h, s.dpr); }
      this._raf = requestAnimationFrame(() => this.loop());
    },
    start() {
      const cv = this.cv();
      if (!cv) return;
      try {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const mode = this.modeNow();
          if (!mode) return;
          cv.hidden = false;
          const s = this.size(cv), cx = cv.getContext('2d');
          this._mode = mode; this.seed(mode, s.w, s.h);
          if (cx) this.draw(cx, mode, s.w, s.h, s.dpr);
          return;
        }
      } catch (e) {}
      cv.hidden = false;
      if (!this._raf) this._raf = requestAnimationFrame(() => this.loop());
    },
    stop() {
      try { if (this._raf) cancelAnimationFrame(this._raf); } catch (e) {}
      this._raf = 0; this._mode = null;
      const cv = this.cv();
      if (cv) { try { cv.hidden = true; const cx = cv.getContext('2d'); if (cx) cx.clearRect(0, 0, cv.width, cv.height); } catch (e) {} }
    },
    kick() {
      try {
        if (document.hidden) { this.stop(); return; }
        if (this.modeNow()) this.start(); else this.stop();
      } catch (e) {}
    },
    init() {
      try {
        if (this._watch) return;
        this._watch = setInterval(() => this.kick(), 2000);
        window.addEventListener('resize', () => { this._mode = null; });
      } catch (e) {}
    }
  };
  try { App.ModeFauna.init(); } catch (e) {}

  App.ProtonLookup = {
    SITE: 'https://proton.me/',
    HELP: 'https://proton.me/support/',
    ALGOLIA: 'https://q7lz4uqhr8-dsn.algolia.net/1/indexes/pme_production_searchable_posts/query',
    APP_ID: 'Q7LZ4UQHR8',
    // Clé de RECHERCHE publique du site de Proton (elle ne permet que de lire l'index
    // des fiches d'aide ; elle est visible par quiconque ouvre le JavaScript de proton.me).
    API_KEY: '9bda42b54df6b6a8332b6435758e0022',
    NET_MS: 15000,
    PROXY_MS: 25000,
    TIMEOUT_MS: 45000,
    CACHE_MS: 600000,
    MAX_TEXT: 5000,
    MAX_DOCS: 2,
    _cache: {}, _pending: null, _pendingFor: null,
    isEnabled() {
      try { return typeof fetch === 'function' && typeof DOMParser === 'function'; } catch (e) { return false; }
    },
    _raw(t) { return String(t == null ? '' : t); },
    _norm(t) {
      return this._raw(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2019\u02bc']/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    },
    // Les noms de services et de formules : eux seuls ouvrent la porte sans discussion.
    PRODUCTS: /(proton ?mail|protonmail|proton ?bridge|proton ?vpn|proton ?drive|proton ?calendar|proton ?calendrier|proton ?pass|proton ?wallet|proton ?meet|proton ?authenticator|proton ?sentinel|proton ?scribe|proton ?unlimited|proton ?duo|proton ?family|proton ?visionary|proton ?docs|proton ?sheets|proton ?ag|proton ?for ?business|proton ?business|fondation proton|compte proton|abonnement proton|offre proton|application proton|proton\.me|pm\.me|\blumo\b|\blumos\b|hide[- ]my[- ]email|easy switch)/,
    // La physique : si elle est nommée, ce n'est pas de la marque qu'il s'agit.
    PHYS: /(atome|atomique|particule|noyau|nucleon|neutron|electron|physique|chimie|chimique|isotope|accelerateur|cyclotron|proton ?therapie|quark|masse atomique|charge positive|charge electrique)/,
    // « un proton », « les protons » : c'est la particule, pas le service — même quand la
    // question ne dit rien de la physique (« qu'est-ce qu'un proton ? »).
    PART: /\b(un|le|la|du|des|de|d|les|deux|trois|ce|cet|cette|ces)\s+protons?\b/i,
    isProton(text) {
      try {
        let raw = this._raw(text), t = this._norm(text);
        if (!t) return false;
        if (this.PRODUCTS.test(t)) return true;
        if (this.PHYS.test(t)) return false;
        if (!/\bproton\b/.test(t)) return false;
        if (this.PART.test(raw) || this.PART.test(t)) return false;
        return true;
      } catch (e) { return false; }
    },
    // Y a-t-il vraiment quelque chose à chercher dans le centre d'aide ? Une question
    // (« comment… », « pourquoi… »), un geste (« activer », « installer », « supprimer »)
    // ou un point de fait (« prix », « gratuit »). Pour un simple « c'est quoi Proton ? »,
    // la fiche répond : Sofia ne lance pas une recherche pour rien.
    WANT: /(comment|pourquoi|pour quel|ou est|ou se trouve|ou trouver|ou voir|est[- ]ce que|qu est[- ]ce|quand|combien|quel|quelle|quels|quelles|puis[- ]je|peut[- ]on|peut on|que faire|besoin d aide|aide|au secours|probleme|problemes|souci|erreur|marche pas|fonctionne pas|ne marche|impossible|bloque|bloquee|activer|desactiver|configurer|parametrer|installer|telecharger|mettre a jour|mise a jour|mettre en place|creer|supprimer|fermer|recuperer|recuperation|reinitialis|restaurer|changer|modifier|renommer|ajouter|importer|exporter|transferer|migrer|partager|inviter|envoyer|recevoir|signaler|verifier|proteger|securiser|chiffrer|prix|tarif|cout|combien coute|gratuit|payant|abonnement|difference|comparer|compatible|synchronis|syncronis|support|assistance|reglage|reglages|option|parametre|parametres|fonctionne|fonctionnent|connect|connexion|connexions|plante|bug|coince|ouvre pas|lance pas|ne s ouvre)/,
    wantsLookup(text) {
      try { return this.WANT.test(this._norm(text)); } catch (e) { return false; }
    },
    STOPW: null,
    _stop() {
      if (this.STOPV) return this.STOPV;
      let o = {};
      // Ne sont écartés que les mots de liaison, les mots de la question elle-même et le
      // nom de la marque : « compte », « adresse », « prix » sont au contraire les mots de
      // fond, et ce sont eux qui font trouver la bonne fiche.
      ('proton protonmail protonmail protonvpn lumo lumos ' +
       'que qui quoi dont ou et mais donc or ni car pour par avec sans dans sur sous vers chez entre depuis pendant apres avant lors quand comment pourquoi combien quel quelle quels quelles est sont etait etaient ete avoir fait faire peut peuvent doit doivent tout toute tous toutes cette cet ces son sa ses leur leurs plus moins aussi ainsi alors cela ceci celui celle ils elles nous vous mes tes mon ma une des les lui eux au aux du de la le un en il elle on je tu se ' +
       'veux voudrais aimerais peux pourrait dois merci bonjour salut sujet savoir connaitre explique expliquer donne donner trouve trouver cherche chercher parle parler dit dire ' +
       'comment il y a').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      this.STOPV = o;
      return o;
    },
    _kw(text) {
      let stop = this._stop();
      return this._norm(text).split(' ').filter(x => x.length >= 3 && !stop[x]).slice(0, 6);
    },
    _race(p, ms) {
      return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms || 30000); })]);
    },
    // L'index des fiches d'aide de Proton. En premier essai, la requête directe du
    // navigateur (l'API de recherche autorise les pages web à l'interroger) ; si elle ne
    // passe pas, le même appel par le proxy sans CORS.
    async _algolia(query, locale) {
      let filters = 'target:support AND locale:' + (locale || 'fr');
      let body = { query: query, hitsPerPage: 6, filters: filters,
                   attributesToRetrieve: ['title', 'link', 'description', 'type', 'date', 'categories', 'locale', 'content'] };
      let res = null;
      try {
        res = await this._race(fetch(this.ALGOLIA, {
          method: 'POST',
          headers: { 'X-Algolia-Application-Id': this.APP_ID, 'X-Algolia-API-Key': this.API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }), this.NET_MS);
      } catch (e) { res = null; }
      if ((!res || !res.ok) && typeof root !== 'undefined' && root && typeof root.superFetch === 'function') {
        try {
          let u = this.ALGOLIA + '?query=' + encodeURIComponent(query) + '&hitsPerPage=6&filters=' + encodeURIComponent(filters);
          let r2 = await this._race(App.Core.proxyFetch(u, { headers: { 'X-Algolia-Application-Id': this.APP_ID, 'X-Algolia-API-Key': this.API_KEY } }), this.PROXY_MS);
          if (r2 && r2.ok) res = r2;
        } catch (e) { /* on garde l'échec du premier essai */ }
      }
      if (!res || !res.ok) throw new Error('HTTP ' + (res && res.status));
      let j = await res.json();
      return (j && j.hits) ? j.hits : [];
    },
    _cut(t, n) {
      let s = String(t == null ? '' : t);
      if (s.length <= n) return s;
      let head = s.slice(0, n), sp = head.lastIndexOf(' ');
      if (sp > n * 0.6) head = head.slice(0, sp);
      return head.replace(/[\s,;:]+$/, '') + ' […]';
    },
    // Le texte lisible d'une fiche : ce que voit un lecteur, sans les scripts ni le menu.
    _text(html) {
      let doc = new DOMParser().parseFromString(html, 'text/html');
      let main = doc.querySelector('main') || doc.body;
      if (!main) return '';
      main.querySelectorAll('script,style,noscript,svg,iframe,form,nav,header,footer').forEach(function (e) { try { e.remove(); } catch (x) {} });
      let parts = [];
      let walk = function (el) {
        for (let i = 0; i < el.children.length; i++) {
          let n = el.children[i], tag = n.tagName.toLowerCase();
          if (/^h[1-6]$/.test(tag)) { let t = n.textContent.replace(/\s+/g, ' ').trim(); if (t) parts.push('\n' + '#'.repeat(Number(tag[1])) + ' ' + t); continue; }
          if (tag === 'li') { let t = n.textContent.replace(/\s+/g, ' ').trim(); if (t.length > 3) parts.push('- ' + t); continue; }
          if (tag === 'p' || tag === 'table' || tag === 'blockquote') { let t = n.textContent.replace(/\s+/g, ' ').trim(); if (t.length > 3) parts.push(t); continue; }
          if (n.children.length) { walk(n); continue; }
          let t = n.textContent.replace(/\s+/g, ' ').trim();
          if (t.length > 3) parts.push(t);
        }
      };
      walk(main);
      let NOISE = /^(Open menu|Close menu|Close|Search|Products|Privacy|Company|Connect|Learn more|Sign in|Sign up|Get Proton|Support|Menu|Back|Next|Share|Copy|Download|Print|Scan to get the mobile app|Skip to content|\d+ min read|Recherche dans la section support)$/i;
      return parts.join('\n').replace(/\n{3,}/g, '\n\n').split('\n')
        .filter(function (l) { let s = l.trim(); return s && !NOISE.test(s); }).join('\n').trim();
    },
    async _page(url) {
      let key = 'P|' + url, c = this._cache[key];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return c.v;
      if (typeof root === 'undefined' || !root || typeof root.superFetch !== 'function') return '';
      let r = await this._race(App.Core.proxyFetch(url), this.TIMEOUT_MS);
      if (!r || !r.ok) throw new Error('HTTP ' + (r && r.status));
      let html = await r.text();
      let txt = '';
      try { txt = this._text(html); } catch (e) { txt = ''; }
      this._cache[key] = { t: Date.now(), v: txt };
      return txt;
    },
    // Un résultat du moteur -> la fiche, avec son adresse française quand elle existe.
    _item(h, locale) {
      try {
        let link = String(h.link || '');
        let slug = link.replace(/^\/fr\//, '/').replace(/^\/support\//, '').replace(/^\/+|\/+$/g, '');
        if (!slug) return null;
        let fr = (h.locale === 'fr') || locale === 'fr';
        let cats = (h.categories || []).map(function (c) { return c && c.name ? c.name : ''; }).filter(Boolean);
        return {
          title: String(h.title || ''), slug: slug, type: h.type || '',
          date: String(h.date || '').slice(0, 10), cats: cats, locale: h.locale || locale,
          url: 'https://proton.me/support/' + (fr ? 'fr/' : '') + slug,
          desc: String(h.description || ''),
          content: String(h.content || '').slice(0, 3000)
        };
      } catch (e) { return null; }
    },
    // Le moteur rend surtout par pertinence de texte ; on reclasse nous-mêmes, parce que
    // ce qui compte ici est que le TITRE de la fiche parle de la question : un mot de la
    // question dans le titre pèse bien plus qu'un mot noyé dans le corps.
    _rank(items, kws) {
      try {
        for (const it of items) {
          let title = this._norm(it.title), cats = this._norm((it.cats || []).join(' '));
          let hay = this._norm(it.title + ' ' + (it.desc || '') + ' ' + (it.content || ''));
          let sc = 0, inTitle = 0, chars = 0;
          for (const k of kws) {
            if (title.indexOf(k) !== -1) { sc += 5; inTitle++; chars += k.length; }
            else if (cats.indexOf(k) !== -1) { sc += 2; chars += k.length / 2; }
            else if (hay.indexOf(k) !== -1) sc += 1;
          }
          it.score = sc; it.inTitle = inTitle; it.chars = chars;
        }
        return items.slice().sort(function (a, b) {
          return (b.score - a.score) || (b.inTitle - a.inTitle) || (b.chars - a.chars)
            || String(b.date).localeCompare(String(a.date));
        });
      } catch (e) { return items; }
    },
    async search(text) {
      try {
        let raw = this._raw(text), kws = this._kw(raw);
        if (!kws.length) return { failed: true, reason: 'no-query' };
        // Plusieurs formes de la même question, du plus précis au plus large : le moteur
        // du centre d'aide cherche les mots EXACTS, donc une question en langue naturelle
        // (« comment activer la double authentification ? ») ne trouve rien si on ne lui
        // donne que tous ses mots à la fois. On interroge donc aussi le mot le plus long
        // seul, et on reclasse nous-mêmes l'ensemble des résultats rendus.
        let longest = kws.slice().sort(function (a, b) { return b.length - a.length; })[0];
        let uniq = [];
        [kws.slice(0, 5).join(' '), kws.slice(0, 3).join(' '), kws.slice(0, 2).join(' '), longest].forEach(function (qq) {
          if (qq && uniq.indexOf(qq) === -1) uniq.push(qq);
        });
        let q = kws.slice(0, 5).join(' ');
        let hits = [], locale = 'fr';
        for (const qq of uniq) {
          let step = [];
          try { step = await this._algolia(qq, 'fr'); } catch (e) { step = []; console.warn('[ProtonLookup] recherche FR échouée', e && e.message); }
          if (step.length) hits = hits.concat(step);
        }
        if (!hits.length) {
          locale = 'en';
          for (const qq of uniq) {
            let step = [];
            try { step = await this._algolia(qq, 'en'); } catch (e) { step = []; }
            if (step.length) hits = hits.concat(step);
          }
        }
        if (!hits.length) return { failed: true, reason: 'no-hit', query: q };
        let items = [], seen = {};
        for (const h of hits) {
          let it = this._item(h, locale);
          if (!it || seen[it.slug]) continue;
          seen[it.slug] = 1; items.push(it);
        }
        if (!items.length) return { failed: true, reason: 'no-hit', query: q };
        items = this._rank(items, kws);
        // Aucune fiche dont le TITRE parle de la question : le moteur a rendu du bruit.
        // Mieux vaut alors la recherche web ouverte que deux fiches hors sujet.
        if (!items[0] || items[0].score < 5) return { failed: true, reason: 'weak', query: q };
        // On ne retient que les fiches dont le titre porte vraiment la question (le reste
        // peut servir de contexte, mais pas de source).
        let pool = items.filter(function (it) { return it.score >= 5; });
        let docs = [];
        for (const it of pool.slice(0, this.MAX_DOCS)) {
          try {
            let t = await this._page(it.url);
            if (t && t.length > 200) { it.text = this._cut(t, this.MAX_TEXT); docs.push(it); }
          } catch (e) { console.warn('[ProtonLookup] fiche illisible ' + it.slug, e && e.message); }
        }
        if (!docs.length) return { failed: true, reason: 'unreadable', query: q };
        console.log('[ProtonLookup] centre d\'aide Proton : « ' + q + ' » (' + locale + ') -', docs.length, 'fiche(s) lue(s) :',
          docs.map(function (d) { return d.slug + ' [' + d.locale + ']'; }).join(', '));
        return { ok: true, query: q, locale: locale, docs: docs, url: this.HELP,
                 others: items.slice(0, 6).map(function (i) { return i.title; }) };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    // Le bloc de prompt : ce que Sofia a vraiment lu dans le centre d'aide de Proton.
    buildBlock(res) {
      try {
        if (!res || res.failed || !res.docs || !res.docs.length) return '';
        let L = ['[PROTON - CE QUE TU VIENS DE LIRE TOI-MÊME DANS SON CENTRE D\'AIDE]'];
        L.push("Sa question porte sur Proton, l'ensemble de services chiffrés (Mail, Calendar, Drive, Pass, VPN, Wallet, Meet, Authenticator, Lumo, Bridge). Tu as interrogé toi-même le centre d'aide officiel de Proton (" + this.HELP + ") et lu " + res.docs.length + " fiche(s), reproduites ci-dessous (recherche : « " + res.query + " »" + (res.locale === 'en' ? ", en anglais : aucune fiche française ne correspondait" : ", en français") + ").");
        L.push("RÈGLE ABSOLUE : ces fiches reproduites sont ta SEULE source pour cette réponse. Tu ne la complètes pas avec ce que tu sais par ailleurs sur Proton — aucun prix, aucun quota, aucune version, aucune procédure qui ne soit écrit ci-dessous. Ce que tu n'y trouves pas, tu dis que tu ne l'as pas lu, au lieu de l'inventer.");
        L.push("Réponds à partir de ces fiches, en nommant celle dont vient chaque chose (son titre, et son adresse quand c'est utile). Les prix et les quotas changent souvent : ne cite que les chiffres écrits ci-dessous et rappelle la date de la fiche. Si une fiche est en anglais, dis-le et traduis-la au lieu d'inventer le terme officiel français. Tu parles d'un service commercial : tu expliques, sans vanter ni dénigrer ; quand une fonction demande un abonnement payant, dis-le clairement.");
        for (const d of res.docs) {
          let head = '--- ' + (d.title || d.slug) + (d.date ? ' (' + d.date + ')' : '');
          let meta = [];
          if (d.cats && d.cats.length) meta.push('rubrique : ' + d.cats.join(' > '));
          if (d.locale) meta.push('langue lue : ' + String(d.locale).toUpperCase());
          meta.push('adresse : ' + d.url);
          L.push(head + '\n' + meta.join(' · '));
          if (d.desc) L.push('Objet : ' + d.desc);
          if (d.text) L.push(d.text);
        }
        if (res.others && res.others.length) L.push("Le moteur du centre d'aide avait aussi rendu, sans que tu les ouvres : " + res.others.join(' ; ') + ". Tu peux dire qu'elles existent, jamais ce qu'elles disent.");
        L.push("Source : le centre d'aide officiel de Proton (" + this.HELP + "), pages publiques lues en direct. Ce que tu n'as pas lu ci-dessus, tu ne l'as pas lu. Texte ordinaire, sans emoji ni LaTeX.");
        return L.join('\n');
      } catch (e) { return ''; }
    }
  };
  // La fiche du Conseil (même machine que les autres dossiers, porte propre isConsilium).
  // Elle porte, telles quelles, les pages officielles du Conseil : ce qu'est l'institution,
  // ce que contient le registre public (documents législatifs préparatoires, documents de
  // séance, communiqués), la grammaire d'une cote (ST/CM/PE/SN, INIT/ADD/REV/COR), les
  // codes interinstitutionnels et les codes Matières, le téléchargement, les archives,
  // PRADO, la base des traités et accords, l'accès aux documents et la portée juridique.
  App.DroitMondeMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/droit-monde/methode-droit-monde.json', kind: 'cours' },
      { url: 'src/droit-monde/portails-droit-monde.json', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    _tag: '[DroitMondeMemo]',
    warm() { return App.MathMemo.warm.call(this); },
    isDroitMonde(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      try { if (App.ConsiliumMemo && App.ConsiliumMemo.isConsilium(text)) return false; } catch (e) {}
      const P = /\b(allemagne|allemand|belgique|belge|suisse|luxembourg|espagne|espagnol|italie|italien|portugal|portugais|pays-bas|neerlandais|royaume-uni|britannique|angleterre|irlande|irlandais|etats-unis|americain|canada|canadien|quebec|maroc|marocain|algerie|algerien|tunisie|tunisien|senegal|mali|cameroun|congo|egypte|turquie|turc|japon|japonais|bresil|mexique|mexicain|inde|indien|australie|autriche|europeen|droit etranger|droit compare|legislation etrangere)\b/;
      const L = /(droit|loi|code|article|tribunal|justice|juridique|constitution|decret|reglement|directive|parlement|peine|prison|amende|contrat|divorce|mariage|heritage|licenciement|bail|visa|asile|nationalite|stgb|bgb|zpo|common law|eur-lex|rgpd|gdpr)/;
      const Q = /(explique|expliquer|expliquez|comment|c\u2019est quoi|qu\u2019est|que dit|que prevoit|pourquoi|combien|quel|quelle|donne|dis|montre|rappelle|aide|leçon|corrige|détaille|capitale|compare|\?)/;
      if (!P.test(tn) || !L.test(tn)) return false;
      if (Q.test(t)) return true;
      return t.replace(/\s+/g, ' ').trim().length <= 70;
    },
    block(text) {
      try {
        if (!this._data || !this.isDroitMonde(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO DROITS DU MONDE — PORTAILS OFFICIELS ET MÉTHODE PAR PAYS]'];
        L.push('Voici ses fiches de droit etranger : ' + books.map(b => '\u00ab ' + b.title + ' \u00bb').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push('The sections below match his question. Name the country, the exact text (code + article number), the official portal it is read on and the version date. Quote the rule the way the fiche states it, never from memory; what is not in these sections must be read live on the official portal before answering, and said so. Common-law countries need statute section + guiding case. End with the limit: she reads the texts, she is not a lawyer. Ordinary text, no emoji.');
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']\n' + s.x));
        } else {
          L.push('No section matches exactly. Here is what the world-law fiches cover:');
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.DroitMondeMemo.warm();
  App.ConsiliumMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/droit/conseil/register.json.gz', kind: 'fiche', slug: 'conseil' }
    ],
    MAX: 5000,
    MIN_SCORE: 9,
    _data: null, _loading: null, _idx: null,
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('conseil conseils coreper registre document documents dossier cote cotes note notes union europeenne europeen consilium archive archives seance session st cm pe sn init add rev cor').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      return o;
    })()),
    SHORT_WORDS: (function () { let o = {}; ('st cm pe sn ue').split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/\u0153/g, 'oe').replace(/\u0152/g, 'oe').replace(/\u00e6/g, 'ae').replace(/\u00c6/g, 'ae').replace(/[\u2019']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-z\u00e0-\u00ff0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, String(t == null ? '' : t).replace(/\u0153/g, 'oe').replace(/\u0152/g, 'oe').replace(/\u00e6/g, 'ae').replace(/\u00c6/g, 'ae'));
    },
    isConsilium(text) { return App.ConsiliumLookup.isConsilium(text); },
    warm() {
      if (this._data || this._loading) return this._loading;
      let self = this;
      try {
        this._loading = Promise.all(this.SOURCES.map(s => App.DroitLookup._json(s.url)))
          .then(list => {
            self._loading = null;
            let secs = [], books = [];
            list.forEach((j, i) => {
              if (!j || !j.sections || !j.sections.length) return;
              let label = j.title || self.SOURCES[i].url;
              books.push({ title: label, author: j.author || '', source: j.source || '', licence: j.licence || '', note: j.note || '', slug: self.SOURCES[i].slug || '' });
              j.sections.forEach(s => { if (s && s.x) secs.push({ t: s.t, c: s.c, p: s.p, u: s.u, x: s.x, b: label, k: self.SOURCES[i].kind, g: self.SOURCES[i].slug || '' }); });
            });
            if (!secs.length) { console.warn('[ConsiliumMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[ConsiliumMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[ConsiliumMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    toc() {
      try {
        if (!this._data) return '';
        let byBook = {}, order = [];
        this._data.sections.forEach(s => {
          let b = s.b || '?';
          if (!byBook[b]) { byBook[b] = { n: 0, t: [] }; order.push(b); }
          byBook[b].n++;
          if (byBook[b].t.length < 18) byBook[b].t.push(s.c ? s.c + ' — ' + s.t : s.t);
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
        if (!this._data || !this.isConsilium(text)) return '';
        let sel = this.pick(text, this.MAX);
        let L = ['[CONSEIL DE L\'UNION EUROPÉENNE - LES FICHES DE RÉFÉRENCE]'];
        L.push("Voici ce que tu as sous les yeux : les pages officielles du Conseil de l'Union européenne sur ses documents — ce qu'est le Conseil (et ce qu'est le Conseil européen), ce que contient son registre public depuis 1999 (documents législatifs préparatoires, documents de séance, communiqués de presse), la grammaire d'une cote (ST, CM, PE, SN ; INIT, ADD, REV, COR), les codes interinstitutionnels « 2024/0123(COD) » et les codes Matières, le téléchargement d'un document, les archives de plus de trente ans, PRADO, la base des traités et accords, la demande d'accès et la portée juridique du registre.");
        if (sel && sel.length) {
          L.push("Les sections ci-dessous correspondent à sa question. Réponds à partir d'elles, et nomme toujours la source : telle page officielle du Conseil. Rappelle la règle du site quand c'est utile : un document du registre n'est pas le droit applicable — seuls les actes publiés au Journal officiel de l'Union sont contraignants. Ne confonds pas le Conseil de l'Union européenne, le Conseil européen et le Conseil de l'Europe. Si la section ne dit pas ce qu'il demande, dis-le au lieu de l'inventer.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']' + (s.u ? ' (' + s.u + ')' : '') + '\n' + s.x));
        } else {
          L.push("Aucune section de ces fiches ne correspond exactement à sa question. Voici ce qu'elles contiennent, pour lui dire ce qu'elles portent :");
          L.push(this.toc());
        }
        L.push("Règles : tu informes sur les documents et les procédures de l'Union, tu ne donnes pas de conseil juridique personnalisé. N'invente ni cote, ni date, ni numéro de dossier. Distingue ce qui est adopté et publié de ce qui est en cours de négociation. Pour un cas personnel, renvoie à un juriste ou à un avocat. Texte ordinaire, sans emoji ni LaTeX.");
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  setTimeout(function () { try { App.ConsiliumMemo.warm(); } catch (e) {} }, 7900);
  // La fiche Proton (même machine que les autres dossiers, porte propre isProton).
  // Elle porte, condensées et réécrites, les pages publiques de Proton : l'entreprise et
  // son origine, les services (Mail, Calendar, Drive, Pass, VPN, Wallet, Meet,
  // Authenticator, Lumo, Bridge), le chiffrement de bout en bout et à accès zéro avec ses
  // limites, les adresses et alias, la création et la récupération du compte, la sécurité
  // (A2F, surveillance, Sentinel, Key Transparency), les formules et leurs prix, la
  // migration (Easy Switch, outil d'export), le spam, la confidentialité et le cadre
  // juridique suisse.
  App.ProtonMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/proton/fiche.json.gz', kind: 'fiche', slug: 'proton' }
    ],
    MAX: 5000,
    MIN_SCORE: 9,
    _data: null, _loading: null, _idx: null,
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      // Ne sont écartés que les mots de liaison, les mots de la question et le nom de la
      // marque : « compte », « prix », « gratuit », « adresse » sont au contraire les mots
      // qui désignent une section, et la fiche ne se lit pas sans eux.
      ('proton protonmail protonvpn lumo lumos ' +
       'que qui quoi dont ou et mais donc or ni car pour par avec sans dans sur sous vers chez entre depuis pendant apres avant lors quand comment pourquoi combien quel quelle quels quelles est sont etait etaient ete avoir fait faire peut peuvent doit doivent tout toute tous toutes cette cet ces son sa ses leur leurs plus moins aussi ainsi alors cela ceci celui celle ils elles nous vous mes tes mon ma une des les lui eux au aux du de la le un en il elle on je tu se ' +
       'veux voudrais aimerais peux pourrait dois merci bonjour salut sujet savoir connaitre explique expliquer donne donner trouve trouver cherche chercher parle parler dit dire ' +
       'comment il y a').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      return o;
    })()),
    SHORT_WORDS: (function () { let o = {}; ('vpn ia a2f 2fa mail').split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/\u0153/g, 'oe').replace(/\u0152/g, 'oe').replace(/\u00e6/g, 'ae').replace(/\u00c6/g, 'ae').replace(/[\u2019']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-z\u00e0-\u00ff0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, String(t == null ? '' : t));
    },
    isProton(text) { return App.ProtonLookup.isProton(text); },
    warm() {
      if (this._data || this._loading) return this._loading;
      let self = this;
      try {
        this._loading = Promise.all(this.SOURCES.map(s => App.DroitLookup._json(s.url)))
          .then(list => {
            self._loading = null;
            let secs = [], books = [];
            list.forEach((j, i) => {
              if (!j || !j.sections || !j.sections.length) return;
              let label = j.title || self.SOURCES[i].url;
              books.push({ title: label, author: j.author || '', source: j.source || '', licence: j.licence || '', note: j.note || '', slug: self.SOURCES[i].slug || '' });
              j.sections.forEach(s => { if (s && s.x) secs.push({ t: s.t, c: s.c, p: s.p, u: s.u, x: s.x, b: label, k: self.SOURCES[i].kind, g: self.SOURCES[i].slug || '' }); });
            });
            if (!secs.length) { console.warn('[ProtonMemo] aucune fiche chargée'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[ProtonMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[ProtonMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    toc() {
      try {
        if (!this._data) return '';
        let byBook = {}, order = [];
        this._data.sections.forEach(s => {
          let b = s.c || '?';
          if (!byBook[b]) { byBook[b] = { n: 0, t: [] }; order.push(b); }
          byBook[b].n++;
          if (byBook[b].t.length < 18) byBook[b].t.push(s.t);
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
    // Question générale (« c'est quoi Proton ? ») ou mot trop courant : la sélection par
    // score ne rend rien. On cherche alors les sections dont le TITRE porte un mot de la
    // question, et à défaut l'entrée en matière.
    _closest(text) {
      try {
        if (!this._data) return [];
        let ws = this._words(text), secs = this._data.sections, hits = [];
        if (ws.length) {
          for (const s of secs) {
            let t = App.ProtonLookup._norm(s.t), n = 0;
            for (const w of ws) { if (w && t.indexOf(w) !== -1) n++; }
            if (n) hits.push({ s: s, n: n });
          }
          hits.sort(function (a, b) { return b.n - a.n; });
          if (hits.length) return hits.slice(0, 2).map(function (h) { return h.s; });
        }
        return secs.filter(function (s) { return /en une phrase|vue d'ensemble/.test(s.t); }).slice(0, 2);
      } catch (e) { return []; }
    },
    block(text) {
      try {
        if (!this._data || !this.isProton(text)) return '';
        let sel = this.pick(text, this.MAX);
        let weak = false;
        if (!sel || !sel.length) { sel = this._closest(text); weak = true; }
        let L = ['[PROTON - LES FICHES DE RÉFÉRENCE]'];
        L.push("Voici ce que tu as sous les yeux : les pages officielles de Proton (proton.me), condensées — ce qu'est Proton (née en 2014 au CERN, société suisse, fondation à but non lucratif), ses services (Mail, Calendar, Drive, Pass, VPN, Wallet, Meet, Authenticator, Lumo, Bridge), son chiffrement (de bout en bout, à accès zéro) et ses limites, les adresses et les alias, la création et la récupération du compte, la sécurité (authentification à deux facteurs, surveillance du compte, Proton Sentinel, Key Transparency), les formules et leurs prix, la migration (Easy Switch, outil d'export), le spam et l'hameçonnage, la politique de confidentialité et le cadre juridique suisse.");
        if (sel && sel.length) {
          L.push(weak
            ? "Sa question est générale : aucune section ne correspond mot pour mot, voici donc l'entrée en matière et les sections les plus proches. Réponds à partir d'elles, sans inventer de détail, et nomme la source : telle page officielle de Proton."
            : "Les sections ci-dessous correspondent à sa question. Réponds à partir d'elles, et nomme la source : telle page officielle de Proton. Attention à ce qui change souvent : les prix, les quotas et les noms des formules — ne cite que ce qui est écrit ici, avec l'adresse de la page. Ne mélange pas les services entre eux et n'attribue pas à l'un ce qui vaut pour l'autre. Si la section ne dit pas ce qu'il demande, dis-le au lieu de l'inventer.");
          sel.forEach(s => L.push('--- ' + s.t + (s.c ? ' [' + s.c + ']' : '') + (s.u ? ' (' + s.u + ')' : '') + '\n' + s.x));
        } else {
          L.push("Aucune section de ces fiches ne correspond exactement à sa question. Voici ce qu'elles contiennent, pour lui dire ce qu'elles portent :");
        }
        if (weak || !sel || !sel.length) L.push(this.toc());
        L.push("Règles : tu expliques un service commercial, sans vanter ni dénigrer. Tu ne donnes pas de conseil de sécurité personnalisé : tu dis ce que Proton documente. N'invente ni prix, ni quota, ni version. Sur le chiffrement, sois exact : ce qui est chiffré de bout en bout reste hors de portée de Proton, et une phrase de récupération perdue signifie des données définitivement illisibles. Texte ordinaire, sans emoji ni LaTeX.");
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  setTimeout(function () { try { App.ProtonMemo.warm(); } catch (e) {} }, 8300);
  // La fiche de jurisprudence (même machine que les autres dossiers, porte propre isJuri).
  // Elle porte, telles quelles, les pages officielles du Conseil d'État : la présentation
  // de la juridiction administrative et de la base ArianeWeb, et les 75 grandes décisions
  // depuis 1873 avec, pour chacune, les faits et le sens et la portée. Depuis la
  // ronde 279, elle porte en plus la présentation officielle de l'open data de la
  // justice administrative (ce que la plateforme publie depuis 2021-2022, les archives
  // zip mensuelles, les codes A/B/C/D/Z, la licence et ses obligations).
  App.JuriMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/droit/jurisprudence/notions.json.gz', kind: 'fiche', slug: 'jurisprudence' },
      { url: 'src/droit/jurisprudence/opendata.json.gz', kind: 'fiche', slug: 'opendata' }
    ],
    MAX: 5000,
    MIN_SCORE: 9,
    _data: null, _loading: null, _idx: null,
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('jurisprudence arret arrets decision decisions conseil etat administratif administrative administratives cour cours tribunal tribunaux conflits juge juges jugement contentieux cassation pourvoi exces pouvoir refere droit droits juridique ce tc caa'.split(' ')).forEach(function (w) { if (w) o[w] = 1; });
      return o;
    })()),
    SHORT_WORDS: (function () { let o = {}; ('loi ce tc caa').split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/\u0153/g, 'oe').replace(/\u0152/g, 'oe').replace(/\u00e6/g, 'ae').replace(/\u00c6/g, 'ae').replace(/[\u2019']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-z\u00e0-\u00ff0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, String(t == null ? '' : t).replace(/\u0153/g, 'oe').replace(/\u0152/g, 'oe').replace(/\u00e6/g, 'ae').replace(/\u00c6/g, 'ae'));
    },
    isJuri(text) { return App.JuriLookup.isJuri(text); },
    warm() {
      if (this._data || this._loading) return this._loading;
      let self = this;
      try {
        this._loading = Promise.all(this.SOURCES.map(s => App.DroitLookup._json(s.url)))
          .then(list => {
            self._loading = null;
            let secs = [], books = [];
            list.forEach((j, i) => {
              if (!j || !j.sections || !j.sections.length) return;
              let label = j.title || self.SOURCES[i].url;
              books.push({ title: label, author: j.author || '', source: j.source || '', licence: j.licence || '', note: j.note || '', slug: self.SOURCES[i].slug || '' });
              j.sections.forEach(s => { if (s && s.x) secs.push({ t: s.t, c: s.c, p: s.p, u: s.u, x: s.x, b: label, k: self.SOURCES[i].kind, g: self.SOURCES[i].slug || '' }); });
            });
            if (!secs.length) { console.warn('[JuriMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[JuriMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[JuriMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    toc() {
      try {
        if (!this._data) return '';
        let byBook = {}, order = [];
        this._data.sections.forEach(s => {
          let b = s.b || '?';
          if (!byBook[b]) { byBook[b] = { n: 0, t: [] }; order.push(b); }
          byBook[b].n++;
          if (byBook[b].t.length < 18) byBook[b].t.push(s.c || s.t);
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
        if (!this._data || !this.isJuri(text)) return '';
        let sel = this.pick(text, this.MAX);
        let L = ['[JURISPRUDENCE ADMINISTRATIVE - LES FICHES DE RÉFÉRENCE (CONSEIL D\'ÉTAT)]'];
        L.push("Voici ce que tu as sous les yeux : les pages officielles du Conseil d'État sur la juridiction administrative et la base ArianeWeb, les 75 grandes décisions depuis 1873 — pour chacune, les faits et le sens et la portée — et la présentation officielle de l'open data de la justice administrative (ce que la plateforme publie depuis 2021-2022, comment les décisions se téléchargent en zip par juridiction, année et mois, le sens des codes A, B, C, D, Z, et la licence).");
        if (sel && sel.length) {
          L.push("Les sections ci-dessous correspondent à sa question. Réponds à partir d'elles : nomme la décision par sa date, sa juridiction et son nom (et son numéro quand la fiche le donne), et dis ce qu'elle a jugé. Ces fiches EXPLIQUENT les décisions ; le texte intégral d'une décision se lit dans ArianeWeb (pour celles que le Conseil d'État a retenues) et dans l'open data de la justice administrative (pour TOUTES les décisions des tribunaux, des cours et du Conseil d'État depuis 2021-2022). Si la décision cherchée n'est pas là, dis-le au lieu de l'inventer.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']' + (s.u ? ' (' + s.u + ')' : '') + '\n' + s.x));
        } else {
          L.push("Aucune section de ces fiches ne correspond exactement à sa question. Voici ce qu'elles contiennent, pour lui dire ce qu'elles portent :");
          L.push(this.toc());
        }
        L.push("Règles : tu informes sur le droit, tu ne donnes pas de conseil juridique personnalisé. N'invente ni numéro, ni date, ni solution. Dis si une solution est ancienne ou si la jurisprudence a évolué depuis. Une décision d'espèce ne vaut que par ce qu'elle juge. Pour un cas personnel, renvoie à un avocat ou à un juriste. Texte ordinaire, sans emoji ni LaTeX.");
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  setTimeout(function () { try { App.JuriMemo.warm(); } catch (e) {} }, 7600);
  // Ronde 178 (souhait de l'utilisateur - de nouveau seulement l'adresse :
  // "Bibliothèque numérique contributive et gratuite du Barreau de Paris France :
  //  https://www.lagbd.org/").
  // La Grande Bibliothèque du Droit (GBD) est la bibliothèque juridique libre
  // du Barreau de Paris. Contrairement à Legifrance (le texte de loi), Sofia
  // y trouve de la DOCTRINE : articles signés, commentaires d'arrêts, essais d'
  // avocats et de professeurs. Deux pièces, comme pour les dossiers précédents :
  // (1) App.GbdLookup - UN OUTIL. Il cherche via l'API MediaWiki publique
  //     (CirrusSearch) et lit l'article LUI-MÊME dans le navigateur :
  //     titre, auteur, son blog, date, domaine (fil d'Ariane) et le texte.
  //     En plus, l'annuaire des blogs de la GBD (136 blogs juridiques).
  // (2) App.GbdMemo - la carte du fonds (ce que contient la GBD, en quels
  //     chiffres), sa charte et l'annuaire des blogs comme feuille de référence.
  // La règle que les deux énoncent : LA DOCTRINE N'EST PAS LA LOI.
  App.GbdLookup = {
    API: 'https://www.lagbd.org/api.php',
    SITE: 'https://www.lagbd.org/',
    BLOGS_URL: 'src/gbd/blogs.json.gz',
    TIMEOUT_MS: 12000,
    CACHE_MS: 600000,
    MAX_TEXT: 3000,
    MAX_HITS: 5,
    BLOG_MAX: 3,
    _blogs: null, _blogsLoading: null, _cache: {}, _pending: null,
    isEnabled() {
      try { return !!(typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); }
      catch (e) { return false; }
    },
    warm() {
      if (this._blogs || this._blogsLoading) return this._blogsLoading || Promise.resolve(this._blogs);
      let self = this;
      try {
        this._blogsLoading = App.Core.loadJson(this.BLOGS_URL).then(function (j) {
          self._blogsLoading = null;
          self._blogs = (j && j.blogs) || [];
          console.log('[GbdLookup] répertoire des blogs prêt :', self._blogs.length, 'blogs');
          return self._blogs;
        }).catch(function (e) { self._blogsLoading = null; self._blogs = []; console.warn('[GbdLookup] blogs.json échoué :', e && e.message); return self._blogs; });
      } catch (e) { this._blogsLoading = null; }
      return this._blogsLoading;
    },
    _norm(s) {
      return String(s == null ? '' : s).toLowerCase()
        .replace(/\u0153/g, 'oe').replace(/\u00e6/g, 'ae').replace(/[\u2019']/g, ' ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    },
    STOP: (function () {
      let o = {};
      ('grande bibliotheque droit droits gbd lagbd barreau paris avocat avocats ordre doctrine article articles blog blogs juridique juridiques bibliotheque numerique contributive libre gratuite trouve trouver cherche chercher recherche rechercher donne donner montre montrer lis lire dis dire dit raconte parle parler explique expliquer veux voudrais aimerais peux sais connais quel quelle quels quelles est sont etait ete etre sur dans avec pour plus moins que qui quoi comment pourquoi quand tout tous toute toutes aussi alors donc mais comme meme encore deja leur leurs son sa ses mon ma mes ce cette ces des les une un du de la le et ou au aux en par chez vers tres bien quelques quelque plusieurs moi toi lui eux ils elles on se me te notre votre nos vos commentaire commentaires arret arrets veille actualite chronique analyse analyses etude etudes these theses memoire redige redigee synthese dossier dossiers faut fait faire passe parle parlent').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      return o;
    })(),
    _tokens(s) {
      let self = this;
      return this._norm(s).split(' ').filter(function (w) { return w.length >= 3 && !self.STOP[w]; });
    },
    query(text) {
      return this._q(this._tokens(text));
    },
    // Construire une requête de recherche à partir des jetons de contenu, sans déchirer un mot.
    _q(tk, n) {
      let a = n ? tk.slice(0, n) : tk;
      let s = '';
      for (const w of a) { if (s.length + w.length + 1 > 110) break; s += (s ? ' ' : '') + w; }
      return s;
    },
    _get(params) {
      let url = this.API + '?' + params + '&format=json&origin=*';
      this._cache = this._cache || {};
      let c = this._cache[url];
      if (c && (Date.now() - c.t) < this.CACHE_MS) return Promise.resolve(c.v);
      let self = this;
      const once = function () {
        return Promise.race([
          App.Core.proxyFetch(url).then(function (r) { return r.text(); }),
          new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, self.TIMEOUT_MS); })
        ]).then(function (t) { return JSON.parse(t); });
      };
      return once().catch(function () { return new Promise(function (r) { setTimeout(r, 700); }).then(once); })
        .then(function (j) { self._cache[url] = { t: Date.now(), v: j }; return j; })
        .catch(function (e) { console.warn('[GbdLookup] récupération échouée :', e && e.message); return null; });
    },
    _dateOf(s) {
      let m = /((\d{1,2})\s+)?(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})/i.exec(String(s == null ? '' : s));
      return m ? m[0].replace(/\s+/g, ' ').trim() : '';
    },
    _textOf(el) {
      if (!el) return '';
      let c = el.cloneNode(true);
      c.querySelectorAll('sup.reference, sup.noprint, a.autonumber, .mw-editsection, style, script, .noprint, .mw-empty-elt, .navbox, .catlinks, .references, .mw-references-wrap, .toc, table, .mw-collapsible').forEach(function (x) { x.remove(); });
      return String(c.textContent || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
    },
    _skip(el) {
      try {
        return !!(el.closest && el.closest('#toc, .toc, .navbox, .catlinks, .references, .mw-references-wrap, .mw-editsection, .noprint, .mw-empty-elt, .mw-collapsible, .metadata, .sistersitebox, .portal, .printfooter, .mw-jump-link'));
      } catch (e) { return false; }
    },
    STOPHEAD: /^(sommaire|notes? et r[ée]f[ée]rences?|r[ée]f[ée]rences?|voir aussi|liens externes|articles? connexes|articles? li[ée]s|bibliographie|sources?|pour aller plus loin|pour en savoir plus|annexes?|navigation)$/i,
    _extract(main) {
      let out = { path: '', author: '', blog: '', date: '', title: '', url: '', paras: [], sections: [], sigDone: false, pseen: 0 };
      if (!main) return out;
      let pre = main.querySelector('pre');
      if (pre) {
        let p = String(pre.textContent || '').replace(/\s+/g, ' ').trim();
        if (p && p.length < 240) out.path = p.replace(/\s*>\s*/g, ' > ');
      }
      let stop = false;
      for (const el of [...main.children]) {
        let tag = el.tagName;
        if (tag === 'PRE' || tag === 'BR' || tag === 'HR' || tag === 'SCRIPT' || tag === 'STYLE') continue;
        if (tag === 'TABLE') continue;
        if (this._skip(el)) continue;
        if (tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5') {
          let h = String(el.textContent || '').replace(/\s+/g, ' ').replace(/\[\s*modifier\s*\]$/, '').trim();
          if (!h) continue;
          if (this.STOPHEAD.test(h)) { stop = true; continue; }
          if (stop) continue;
          out.sections.push({ t: h, x: '' });
          continue;
        }
        if (stop) continue;
        if (tag === 'P') {
          out.pseen++;
          if (!out.sigDone && out.pseen <= 4) {
            let bs = [...el.querySelectorAll('b')];
            let date = '';
            for (const b of bs) { let d = this._dateOf(b.textContent); if (d) { date = d; break; } }
            let raw0 = String(el.textContent || '').replace(/\s+/g, ' ').trim();
            if (bs.length >= 2 && date && raw0.length < 340) {
              out.date = date;
              out.author = String(bs[0].textContent || '').replace(/\[\d+\]/g, ' ').replace(/\s+/g, ' ').trim();
              let a = el.querySelector('a.external[href]') || el.querySelector('a[href^="http"]');
              if (a) out.blog = a.getAttribute('href') || '';
              out.sigDone = true;
              continue;
            }
          }
        }
        let txt = this._textOf(el);
        if (!txt) continue;
        if (out.sections.length) { let s = out.sections[out.sections.length - 1]; s.x += (s.x ? '\n' : '') + txt; }
        else out.paras.push(txt);
      }
      return out;
    },
    async read(title) {
      let t = String(title == null ? '' : title);
      let params = 'action=parse&prop=text&disableeditsection=1&disablelimitreport=1&page=' + encodeURIComponent(t);
      let j = await this._get(params);
      let html = j && j.parse && j.parse.text && j.parse.text['*'];
      if (!html) return null;
      let doc;
      try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { return null; }
      if (!doc) return null;
      let main = doc.querySelector('.mw-parser-output') || doc.querySelector('#mw-content-text') || doc.body;
      if (!main) return null;
      let ex = this._extract(main);
      let real = String((j.parse && j.parse.title) || t).replace(/_/g, ' ');
      ex.title = real;
      ex.url = this.SITE + encodeURIComponent(real.replace(/ /g, '_')).replace(/%2F/g, '/');
      return ex;
    },
    blogsFor(text) {
      try {
        if (!this._blogs || !this._blogs.length) return [];
        let qt = this._tokens(text);
        if (!qt.length) return [];
        let scored = [];
        for (const b of this._blogs) {
          let hay = this._norm((b.n || '') + ' ' + (b.s || '')).split(' ');
          let subj = this._norm(b.s || '');
          let score = 0, matched = {};
          for (const q of qt) {
            for (const w of hay) {
              if (!w || w.length < 3) continue;
              if (w === q) { score += 6; matched[q] = 1; break; }
              if (w.length >= 4 && q.length >= 4 && (w.indexOf(q) === 0 || q.indexOf(w) === 0)) { score += 3; matched[q] = 1; break; }
            }
            if (subj && subj.indexOf(q) !== -1) score += 4;
          }
          let hit = Object.keys(matched).length;
          score += hit * 2;
          score += hit === qt.length ? 3 : 0;
          // Un blog spécialisé sur son mot-clé est une meilleure réponse qu'un
          // blog de cabinet qui couvre vingt matières : plus la liste des
          // matières est longue, plus la déduction est petite.
          if (hit) { let subs = String(b.s || '').split('/').filter(function (x) { return x.trim(); }).length; score -= Math.min(subs, 10) * 0.6; }
          if (score > 0) scored.push({ n: b.n || '', s: b.s || '', u: b.u || '', score: score, hit: hit });
        }
        scored.sort(function (a, b) { return b.score - a.score || b.hit - a.hit; });
        return scored.slice(0, this.BLOG_MAX).filter(function (x) { return x.score >= 10; });
      } catch (e) { return []; }
    },
    async search(text) {
      if (!this.isEnabled()) return { failed: true, reason: 'disabled' };
      try {
        await this.warm();
        let tn = this._norm(text);
        let blogs = this.blogsFor(text);
        let blogOnly = blogs.length > 0 && /(blog|veille|suivr|suiv|actualit|newsletter|flux|abonn)/.test(tn);
        let tk = this._tokens(text);
        // S'il demande un blog (ou une veille), l'annuaire est la
        // réponse : alors on ne cherche même pas d'articles.
        if (blogOnly) return { ok: true, url: this.SITE, f: null, blogs: blogs, blogOnly: true, hits: [], query: this._q(tk) };        if (!tk.length) return { failed: true, reason: 'no-terms' };
        // La GBD cherche avec ET (CirrusSearch) : plus il y a de mots, moins il y a de
        // résultats. D'où d'abord toute la question, et si rien ne vient, une
        // échelle descendante - toujours moins de mots, jusqu'à ce que quelque chose vienne.
        let tries = [this._q(tk)];
        if (tk.length >= 4) tries.push(this._q(tk, 3));
        if (tk.length >= 3) tries.push(this._q(tk, 2));
        if (tk.length >= 2) tries.push(this._q(tk, 1));
        let hits = [], q = '';
        for (const cand of tries) {
          if (!cand || cand === q) continue;
          q = cand;
          let j = await this._get('action=query&list=search&srlimit=' + this.MAX_HITS + '&srprop=snippet%7Cwordcount%7Ctimestamp&srsearch=' + encodeURIComponent(cand));
          let h = (j && j.query && j.query.search) || [];
          h = h.filter(function (x) {
            if (!x || !x.title) return false;
            if (/^(Accueil|Main Page)$/i.test(x.title)) return false;
            if (/^(Sp[ée]cial|Cat[ée]gorie|Mod[èe]le|Discussion|Aide|Portail|Fichier|MediaWiki|Utilisateur)\s*:/i.test(x.title)) return false;
            return true;
          });
          if (h.length) { hits = h; break; }
        }
        let f = null;
        if (hits.length && !blogOnly) f = await this.read(hits[0].title);
        if (!f && !hits.length && !blogs.length) return { failed: true, reason: 'no-result', query: q };
        return {
          ok: true, url: this.SITE, f: f, blogs: blogs, blogOnly: blogOnly, query: q,
          hits: hits.map(function (h) {
            return { t: h.title, wc: h.wordcount || 0, ts: String(h.timestamp || '').slice(0, 10), sn: String(h.snippet || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim() };
          })
        };
      } catch (e) { return { failed: true, error: String((e && e.message) || e) }; }
    },
    _excerpt(f, max) {
      let out = [], total = 0;
      const add = function (t) {
        t = String(t == null ? '' : t);
        if (!t || total >= max) return;
        let s = t.slice(0, max - total);
        out.push(s); total += s.length;
      };
      (f.paras || []).forEach(add);
      (f.sections || []).forEach(function (s) { if (total >= max) return; add('— ' + s.t); add(s.x); });
      return out.join('\n');
    },
    buildBlock(res) {
      try {
        if (!res || res.failed) return '';
        let f = res.f || null;
        let hits = res.hits || [];
        let blogs = res.blogs || [];
        if (!f && !hits.length && !blogs.length) return '';
        let L = [];
        if (f && (f.paras.length || f.sections.length)) {
          L.push('[GBD (GRANDE BIBLIOTHÈQUE DU DROIT) - TU VIENS DE LIRE TOI-MÊME CET ARTICLE DE DOCTRINE : « ' + f.title + ' »'
            + (f.author ? ', de ' + f.author : '') + (f.date ? ' (' + f.date + ')' : '') + ']');
          L.push("Réponds à partir de cet article en le SIGNANT pour lui : nomme l'auteur" + (f.blog ? ", puis son blog (" + f.blog + ")" : "") + (f.date ? ' et la date, ' + f.date + ',' : '')
            + " et dis qu'il s'agit d'une doctrine (l'analyse d'un auteur), pas de la règle de droit ; ne présente jamais sa thèse comme le droit applicable. Pour le texte en vigueur, la référence est Légifrance."
            + (f.url ? " Adresse de l'article, à donner : " + f.url + '.' : '')
            + " C'est un article de www.lagbd.org, la bibliothèque juridique libre et gratuite du Barreau de Paris (Ordre des avocats de Paris) : un texte signé, qui n'engage que son auteur.");
          if (f.path) L.push('Domaine (fil d\'Ariane) : ' + f.path);
          L.push("Extrait de l'article, tel qu'il est écrit :");
          L.push(this._excerpt(f, this.MAX_TEXT));
        } else {
          L.push(res.blogOnly
            ? '[GRANDE BIBLIOTHÈQUE DU DROIT (GBD) - ANNUAIRE DES BLOGS JURIDIQUES DU BARREAU DE PARIS]'
            : '[LA GRANDE BIBLIOTHÈQUE DU DROIT (GBD) - AUCUN ARTICLE LU]');
          if (!res.blogOnly) L.push("Aucun article n'a pu être lu pour cette question (la recherche n'a rien donné, ou la page n'a pas répondu). N'affirme pas ce qu'un auteur de la GBD dit : dis-le, et réponds à partir de tes fiches ou du web.");
        }
        if (hits.length) {
          let others = hits.filter(function (h) { return !f || h.t !== f.title; }).slice(0, 4);
          if (others.length) {
            L.push("Autres résultats de ta recherche sur la GBD (titres seuls - ne les cite que si c'est utile, et seulement pour dire qu'ils existent) :");
            others.forEach(function (h) { L.push('- ' + h.t + (h.ts ? ' (' + h.ts + (h.wc ? ', ' + h.wc + ' mots' : '') + ')' : '')); });
          }
        }
        if (blogs.length) {
          L.push("Blogs juridiques que l'annuaire de la GBD recense sur ce sujet (nom, matières, adresse) :");
          blogs.forEach(function (b) { L.push('- ' + b.n + (b.s ? ' (' + b.s + ')' : '') + (b.u ? ' — ' + b.u : '')); });
          L.push("Ne propose QUE ces blogs, et donne pour chacun son nom et son adresse tels qu'ils sont écrits ci-dessus : ils sont exacts. N'invente aucun blog, n'en cite aucun de mémoire, et ne prends pas un éditeur (Lamy, Lexbase, Dalloz, Larcier...) pour un blog. Si aucun de ces blogs ne convient, dis-le au lieu d'en inventer un, et renvoie à l'annuaire complet de la GBD (136 blogs).");
        }
        L.push("Règles : nomme l'auteur, son blog et la date, et dis qu'il s'agit d'une doctrine (l'analyse d'un auteur) et non de la règle de droit ; ne présente jamais la thèse d'un auteur comme le droit applicable ; pour le texte en vigueur, la référence est Légifrance. N'invente ni le nom d'un auteur, ni le nom d'un blog, ni le titre d'un article : ne cite que ce qui est écrit ci-dessus. Ne cite pas un article que tu n'as pas lu. Le domaine vient du fil d'Ariane (territoire > domaine > matière > sous-matière). S'il s'agit d'un commentaire d'arrêt, donne le nom de la décision et sa date telles qu'elles figurent dans l'article. Tu informes sur le droit, tu ne donnes pas de conseil juridique personnalisé : pour un cas personnel, renvoie à un avocat, un notaire ou un juriste. Texte ordinaire, sans emoji ni LaTeX.");
        return L.join('\n');
      } catch (e) { return ''; }
    }
  };
  App.GbdMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/gbd/fiche-gbd.json.gz', kind: 'fiche' },
      { url: 'src/gbd/domaines.json.gz', kind: 'fonds' },
      { url: 'src/gbd/blogs.json.gz', kind: 'blogs' }
    ],
    MAX: 5600,
    MIN_SCORE: 10,
    _data: null, _loading: null, _idx: null,
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('grande bibliotheque droit droits gbd lagbd barreau paris avocat avocats ordre doctrine juridique numerique contributive libre gratuite blog blogs bibliotheque').split(' ').forEach(function (w) { if (w) o[w] = 1; });
      return o;
    })()),
    SHORT_WORDS: (function () { let o = {}; ('gbd loi').split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/\u0153/g, 'oe').replace(/\u0152/g, 'oe').replace(/\u00e6/g, 'ae').replace(/\u00c6/g, 'ae').replace(/[\u2019']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-z\u00e0-\u00ff0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, String(t == null ? '' : t).replace(/\u0153/g, 'oe').replace(/\u0152/g, 'oe').replace(/\u00e6/g, 'ae').replace(/\u00c6/g, 'ae'));
    },
    // La porte : s'agit-il de la Grande Bibliothèque du Droit elle-même, de doctrine
    // (articles signés, commentaires d'arrêts), des blogs juridiques, du
    // Barreau de Paris ou de JurisPedia ? Pas de médicaments, de métiers,
    // d'anatomie, de langages de programmation ou de calcul pur - ceux-là ont leurs dossiers.
    isGbd(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u2019/g, "'");
      if (/(medicament|posologie|ordonnance|antibiotique|anatomie|physiologie|\bpython3?\b|\bhtml\b|\bcss\b|javascript|sexolog|contracepti|pythagore|thales|theoreme|equation|primitive|photosynthese)/.test(tn)) return false;
      const NAME = /(grande bibliotheque du droit|\blagbd\b|lagbd\.(org|fr)|la gbd|\bgbd\b|bibliotheque juridique|bibliotheque numerique|bibliotheque du droit|ordre des avocats de paris|barreau de paris|jurispedia)/;
      if (NAME.test(tn)) return true;
      const K = /(doctrine|commentaire d'arret|commentaires d'arrets|chronique|these de doctorat|article de doctrine|article signe|qui a ecrit|qui ecrit sur)/;
      // Ronde 178 : les choses qui n'existent QUE dans la GBD - l'annuaire des blogs d'
      // avocats et la doctrine. Un mot juridique OU une vraie demande de recherche doit
      // être présent ("quel blog litteraire lire" ne doit PAS ouvrir la porte).
      const GBDSPEC = /(blogs? juridiques?|annuaire des blogs|veille juridique|bibliotheque juridique|droit partage)/;
      const BLOG = /(\bblogs?\b|weblog|newsletter|flux rss)/;
      const JUR = /(droit|juridique|avocat|barreau|juriste|penal|civil|travail|famille|affaires|immobilier|fiscal|social|urbanisme|environnement|numerique|propriete intellectuelle|sante|international|europeen|prud|commercial|consommation|bancaire|assurance|\bloi\b|\bcode\b|jurisprudence|cassation|conseil d'etat|conseil constitutionnel)/;
      const SEEK = /(trouve|trouver|cherche|chercher|recherche|rechercher|donne|donner|liste|voir|consulte|existe|qui a ecrit|qui ecrit sur|etude|etudes|article|articles|ressources|memoire|these|\?)/;
      if (GBDSPEC.test(tn)) return true;
      if (K.test(tn) && (JUR.test(tn) || SEEK.test(tn))) return true;
      if (BLOG.test(tn) && JUR.test(tn)) return true;
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
            if (!secs.length) { console.warn('[GbdMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[GbdMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[GbdMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    toc() {
      try {
        if (!this._data) return '';
        let byBook = {}, order = [];
        this._data.sections.forEach(s => {
          let b = s.b || '?';
          if (!byBook[b]) { byBook[b] = { n: 0, t: [] }; order.push(b); }
          byBook[b].n++;
          if (byBook[b].t.length < 18) byBook[b].t.push(s.t);
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
        if (!this._data || !this.isGbd(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[LA GRANDE BIBLIOTHÈQUE DU DROIT (GBD) - TES FICHES DE RÉFÉRENCE]'];
        L.push("Voici tes fiches sur la Grande Bibliothèque du Droit (la bibliothèque juridique libre et gratuite du Barreau de Paris) et sur l'annuaire de ses blogs : "
          + books.map(b => '« ' + b.title + ' »').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push("Ces sections servent à DEUX choses. Si sa question porte sur la Grande Bibliothèque du Droit elle-même (ce qu'elle est, qui la porte, son comité, ses chiffres, sa Charte, comment on y cherche, ce qu'elle contient, ses blogs, le Barreau de Paris), réponds à partir d'elles et dis de quelle fiche vient chaque point. Si sa question porte sur un point de droit, elles ne sont qu'un repère (voici ce que la GBD a sur ce sujet) : la réponse vient alors de l'article lu en direct ci-dessus ou de tes fiches de droit, et ces sections servent seulement à dire ce que la GBD porte sur la question.");
          L.push("Règle de lecture, sans exception : ce que la GBD publie est de la DOCTRINE signée (l'analyse d'un auteur), pas une norme. Quand tu parles d'un article de la GBD, nomme son auteur et son blog, donne la date, et dis qu'il s'agit d'une doctrine ; ne présente jamais la thèse d'un auteur comme la règle de droit. Pour le texte en vigueur, la référence est Légifrance. Tu informes sur le droit, tu ne donnes pas de conseil juridique personnalisé : pour un cas personnel, renvoie à un avocat, un notaire ou un juriste. Texte ordinaire, sans emoji ni LaTeX.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + ']\n' + s.x));
        } else {
          L.push("Aucune section de ces fiches ne correspond exactement à sa question. Voici ce qu'elles contiennent, pour lui dire ce qu'elles portent :");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  // Les fiches GBD sont petites (les blogs sont le plus gros), elles peuvent venir tout
  // de suite ; la lecture de l'annuaire des blogs tient à la même horloge.
  setTimeout(function () { try { App.GbdMemo.warm(); } catch (e) {} }, 7400);
  // Ronde 220 (souhait de l'utilisateur : « des cours de grec et de latin, sumérien,
  // langue de l'ancienne Égypte avec les hiéroglyphes expliqués, de l'inca,
  // aztèque etc. ») : une NOUVELLE matière - les langues et écritures anciennes. C'est
  // LA MÊME machine que pour le mémo de calcul, d'anatomie et du web (copiée et
  // écrasée), avec corpus propre (src/anciennes/), porte propre
  // (isAncient) et bloc propre. Les caractères grecs, coptes, cunéiformes,
  // hiéroglyphiques et mayas figurent en Unicode dans le texte et sont
  // affichés ; à côté, toujours la translittération.
  App.AncientMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/anciennes/grec-ancien.json.gz', kind: 'cours' },
      { url: 'src/anciennes/latin.json.gz', kind: 'cours' },
      { url: 'src/anciennes/sumerien.json.gz', kind: 'cours' },
      { url: 'src/anciennes/egyptien-hieroglyphes.json.gz', kind: 'cours' },
      { url: 'src/anciennes/maya.json.gz', kind: 'cours' },
      { url: 'src/anciennes/quechua.json.gz', kind: 'cours' },
      { url: 'src/anciennes/nahuatl.json.gz', kind: 'cours' },
      { url: 'src/anciennes/autres-ecritures.json.gz', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 12,
    _data: null, _loading: null, _idx: null,
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('langue langues ecriture ecritures ancien ancienne anciens anciennes alphabet signe signes lettre lettres mot mots texte textes cours lecon traduire traduction traduis histoire civilisation peuples dieu dieux roi rois epoque grammaire declinaison conjugaison vocable vocabulaire prononciation').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    lookupQuery(t) { return App.MathMemo.lookupQuery.call(this, t); },
    // La porte : s'agit-il d'une langue ancienne ou d'une écriture ancienne ?
    isAncient(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      // Ronde 221 : le grec CONTEMPORAIN n'est pas une langue ancienne - il appartient
      // à la fiche des langues du monde (sinon cette porte capte chaque "grec").
      if (/grec (moderne|contemporain)|grec d['’]aujourd/.test(t)) return false;
      const S = /(\bgrec\b|grecque|hell[eé]n|myc[eé]nien|hom[eè]re|homere|iliade|odyss[eé]e|odyssee|platon|sophocle|euripide|[ée]sope|attique|koin[eè]|declinaison|d[ée]clinaison|aoriste|optatif|augment|\blatin\b|latine|rome antique|romain|virgile|\bc[eé]sar\b|cic[eé]ron|ovid|horace|tite-live|gaffiot|sum[eé]r|sumer|cun[eé]iforme|cuneiforme|m[eé]sopotamie|akkadien|babylonien|assyrien|gilgame[sš]|uruk|tablette d'argile|assyriolog|[ée]gypt|hi[eé]roglyphe|hi[eé]roglyphique|pharaon|cartouche|d[eé]motique|hi[eé]ratique|\bcopte\b|champollion|rosette|osiris|isis|horus|anubis|\bmaya\b|mayas|glyphe|glyphes|tzolk|haab|compte long|palenque|tikal|azt[eè]que|azteque|mexica|tenochtitlan|nahuatl|quetzal|quechua|quichua|kichwa|\binca\b|incas|quipu|khipu|aymara|wiracocha|sanskrit|sanscrit|v[eé]dique|panini|devanagari|hittite|hrozn|lin[eé]aire [ab]|lineaire [ab]|[ée]trusque|etrusque|ph[eé]nicien|aram[eé]en|syriaque|gotique|wulfila|\brunes?\b|runique|futhark|ogham|vieux-slave|glagolitique|cyrillique|avestique|pehlevi|ougaritique|[ée]lamite|ourartien|hourrite|zapot[eè]que|isthmien|\bindus\b|rongorongo|antiquit[eé]|antiquite)/;
      const Q = /(explique|expliquer|expliquez|comment|c'est quoi|qu'est[- ]ce|que veut dire|signifie|sens de|pourquoi|combien|quel|quelle|quels|quelles|parle[- ]?moi|parler|d[ée]cri|tradui|d[ée]fini|a quoi|\bqui\b|o[uù]|quand|liste|cite|donne[- ]?moi|dis[- ]?moi|montre|rappelle|apprends|enseigne|le[çc]on|cours|exercice|tableau|alphabet|revois|r[ée]vis|aide|\?)/;
      if (!S.test(t)) return false;
      // Un simple terme technique suffit si le message est court et ne raconte
      // rien sur lui-même ("je suis allé en Grèce", "mon chat").
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u02bc]/g, "'");
      if (Q.test(t)) return true;
      if (/\b(j'ai|j ai|j'|je|mon|ma|mes|me|tu|ton|ta|tes|il|elle|nous|vous|ils|elles|suis|aime|aimes|pense|penses|crois|sens|sais|vais|veux|peux|habite|part)[^a-z]/.test(tn)) return false;
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
            if (!secs.length) { console.warn('[AncientMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[AncientMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[AncientMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    block(text) {
      try {
        if (!this._data || !this.isAncient(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[LANGUES ET ÉCRITURES ANCIENNES - LES FICHES DE RÉFÉRENCE]'];
        L.push("Voici les fiches de cours sur les langues et les écritures anciennes qu'il étudie" + (books.length > 1 ? ', en plusieurs fiches' : '') + ' : '
          + books.map(b => '« ' + b.title + ' »').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push("The sections below are the ones that match his question. Teach from them: give the letters and signs with their real value, the grammar rule, and a short example, in his language. Where a section gives a source (a tablet, a stele, an author, a manual), name it. You MAY write the ancient signs themselves as ordinary text (grec, cunéiforme, hiéroglyphes égyptiens, glyphes mayas) since they render here - but ALWAYS give the translittération next to them, and when a sign is not rendered describe it by its shape and its code (p. ex. le code Gardiner). Before the culture of a people, say plainly what is established and what is a debated hypothesis. If one of these sections does not really fit his question, ignore it and answer from what you know - but never invent a sign, a value, a declension, a word or a date that is not in these sections: it is better to say what you are sure of.");
          L.push("Write it as ordinary text on the page: no emoji, no $ sign, no LaTeX. A list of forms stays a plain list, one per line. A paradigm (declension, conjugation, sign list) may be laid out as a simple table or aligned lines. End with where to read more when the section names a source.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push("No section of these fiches matches his question exactly. Here is what they cover, so you can tell him what they hold and explain from them:");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.AncientMemo.warm();
  // Ronde 221 (souhait de l'utilisateur - il a envoyé la page des langues de Lexilogos,
  // "pour les langues") : LES LANGUES DU MONDE ET LEURS DICTIONNAIRES.
  // Il a donné le répertoire "Dictionnaires par langue" (Xavier Negre, lexilogos.com)
  // avec environ deux cent soixante-dix langues - des dialectes et langues
  // régionales de France aux dialectes d'Europe, jusqu'aux langues d'Afrique,
  // d'Asie, des Amériques, d'Océanie et du Vieux Monde - et en plus la page
  // "Langues du monde & linguistique" (familles de langues, droit des minorités,
  // linguistique, phonétique, cartes).
  // Deux fiches dans src/langues/, en texte clair. La même machine que pour les dossiers
  // précédents (copiée et écrasée), porte propre (isLangues), bloc propre.
  // Sa porte refuse les questions du mémo Dictionnaires (TLFi, Larousse,
  // orthographe, conjugaison ...) et le mémo Dictionnaires refuse inversement
  // tout ce qui appartient ici ; les langues anciennes restent au AncientMemo,
  // qui tourne avant dans la chaîne.
  App.LanguesMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/langues/dictionnaires-par-langue.json.gz', kind: 'cours' },
      { url: 'src/langues/langues-du-monde.json.gz', kind: 'cours' }
    ],
    MAX: 6000,
    // Un nom de langue figure dans plusieurs sections (gallois touche aussi gallo,
    // un nom figure dans son groupe et dans les règles), d'où le même
    // seuil bas que dans le mémo Dictionnaires.
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    // Les noms de toutes les langues du répertoire, sans accents et sans le
    // français (celui-ci a sa propre fiche). Ils sont le signe sûr
    // qu'il s'agit d'une langue déterminée ("le gallois", "en albanais").
    NAMES: 'angevin|berrichon|bourbonnais|bourguignon|champenois|gallo|lorrain|mainois|marchois|normand|jersiais|orleanais|parisien|picard|poitevin|saintongeais|wallon|auvergnat|bearnais|gascon|gavot|limousin|provencal|nissart|mentonnais|monegasque|occitan|aranais|bressan|comtois|dauphinois|forezien|fribourgeois|jurassien|lyonnais|neuchatelois|savoyard|valaisan|valdotain|vaudois|vivarois|alsacien|corse|basque|breton|cornique|gaelique ecossais|gaelique irlandais|gallois|mannois|badois|bas-allemand|bavarois|berlinois|bolonais|bruxellois|cachoube|colognais|flamand|frioulan|frison|genois|ladin|lapon|milanais|napolitain|piemontais|platt|romanche|sarde|ecossais|sicilien|sorabe|souabe|suisse alemanique|suisse romand|venitien|albanais|allemand|anglais|aragonais|asturien|catalan|danois|espagnol|estonien|feroien|finnois|galicien|grec moderne|islandais|italien|ladino|luxembourgeois|maltais|neerlandais|norvegien|portugais|rromani|suedois|yiddish|aroumain|bielorusse|bosniaque|bulgare|croate|hongrois|letton|lituanien|macedonien|montenegrin|polonais|roumain|russe|serbe|slovaque|slovene|tcheque|ukrainien|abkhaze|armenien|azeri|georgien|ingouche|ossete|tchetchene|arabe|dari|hebreu moderne|kurde|pachto|persan|ourdou|turc|assamais|bengali|bhojpuri|cachemiri|goujarati|hindi|kannada|khowar|malayalam|maldivien|marathi|meitei|nepalais|oriya|panjabi|santali|sindhi|singhalais|tamoul|telougou|tibetain|birman|cantonais|chinois|coreen|hmong|indonesien|japonais|javanais|khmer|lao|malais|mongol|nuosu|tagalog|thai|vietnamien|kazakh|kirghize|ouighour|ouzbek|tadjik|tatar|tatar de crimee|turkmene|siberien|afrikaans|amharique|bambara|berbere|cap-verdien|comorien|ewe|haoussa|kabyle|lingala|malgache|peul|rifain|sango|somali|songhai|soninke|swahili|tigrigna|touareg|wolof|yoruba|zoulou|acadien|cadien|cherokee|inuit|inuktitut|maya|nahuatl|quechua|guarani|quebecois|bislama|hawaien|maori|marquisien|tahitien|guadeloupeen|martiniquais|guyanais|haitien|mauricien|reunionnais|americain|australien|canadien|irlandais|autrichien allemand|autrichien bavarois|belge|bresilien|bolivien|canarien|chilien|colombien|costaricien|dominicain|espagnol americain|mexicain|paraguayen|peruvien|uruguayen|venezuelien|algerien|egyptien arabe|jordanien|libyen|marocain|syrien|tunisien|libanais|argentin|avestique|copte|etrusque|gaulois|gotique|grec ancien|hebreu ancien|egyptien ancien|hittite|latin|louvite|pali|phenicien|prussien|samaritain|sanskrit|syriaque',
    // Mots de remplissage : tout ce qui figure dans CHAQUE question de cette matière.
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('langue langues dictionnaire dictionnaires mot mots parler parle parles parlent parlee parlees traduction traduire traduit traduis apprentissage apprendre apprends alphabet alphabets ecriture ecritures clavier clavier prononciation lexique vocabulaire grammaire expression expressions bilingue multilingue bilinguisme locuteur locuteurs langue-langue').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    // Sigles que la décomposition en mots jette (moins de quatre lettres), qui sont
    // ici justement le thème : les langues d'oc et d'oïl, ewe, lao.
    SHORT_WORDS: (function () {
      let o = {};
      ('oc oïl oil ewe lao').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae').replace(/[’']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-zà-ÿ0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    _nameRe() {
      if (this._nameRe_) return this._nameRe_;
      // Attention : les noms multi-mots ("grec moderne", "suisse alemanique",
      // "tatar de crimee") sont UN nom - séparés par |, pas par des espaces.
      let ns = String(this.NAMES || '').split('|').filter(Boolean).sort((a, b) => b.length - a.length);
      this._nameRe_ = new RegExp('(?:^|[^a-z])(' + ns.join('|') + ')(?:[^a-z]|$)');
      return this._nameRe_;
    },
    // Les sections où la langue nommée a une LIGNE avec son nom et
    // son adresse. Le mécanisme hérité cherche des mots et évalue chaque section
    // de la même façon - les sections d'aperçu, qui nomment le même nom dans le texte courant,
    // délogeraient sinon la section avec l'adresse.
    _directSections(text) {
      let tn = String(text == null ? '' : text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u02bc]/g, "'");
      let names = [], seen = {}, re = new RegExp(this._nameRe().source, 'g'), m;
      while ((m = re.exec(tn))) {
        let n = m[1];
        if (n && !seen[n]) { seen[n] = 1; names.push(n); }
        re.lastIndex = m.index + Math.max(1, m[0].length - 1);
      }
      if (!names.length) return [];
      let res = [];
      for (const s of (this._data && this._data.sections) || []) {
        let x = String(s.x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (const n of names) {
          let esc = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (new RegExp('(?:^|\\n)[^\\n]*' + esc + '[^\\n]*https://www\\.lexilogos\\.com').test(x)) { res.push(s); break; }
        }
      }
      return res;
    },
    // D'abord les sections avec l'adresse, puis le mécanisme hérité.
    pick(text, max) {
      let out = [], total = 0, seen = {};
      let list = [];
      try { list = this._directSections(text); } catch (e) { list = []; }
      try { list = list.concat(App.MathMemo.pick.call(this, text, max) || []); } catch (e) {}
      for (const s of list) {
        if (!s || seen[s.t]) continue;
        let len = String(s.x || '').length;
        if (out.length && total + len > max) break;
        seen[s.t] = 1; out.push(s); total += len;
        if (out.length >= 3) break;
      }
      return out.length ? out : null;
    },
    lookupQuery(t) { return App.MathMemo.lookupQuery.call(this, t); },
    // La porte : s'agit-il d'une langue du monde - ou des langues en général ?
    isLangues(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      // Veto 1 : le français lui-même et sa défense (TLFi, Larousse,
      // Robert, orthographe, conjugaison, québécismes ...) - c'est la
      // fiche Dictionnaires, pas celle-ci.
      if (/(tlfi?|tr[eé]sor de la langue|larousse|robert|wiktionnaire|acad[eé]mie fran|usito|cnrtl|bescherelle|orthograph|orthotypograph|conjugaison|conjugu|grammaire fran|accord du participe|rectifications? de l|nouvelle orthographe|franceterme|oqlf|banque de d[eé]pannage|synonym|antonym|homophone|homographe|paronym|anglicism|qu[eé]b[eé]cism|ponctuation|typograph|figure de style|pluriel des|langue fran)/.test(t)) return false;
      // Veto 2 : Python, HTML, CSS - ces fiches n'y appartiennent pas.
      if (/(\bpython3?\b|\.py\b|\bcss\b|\bhtml\b|\bjavascript\b)/.test(t)) return false;
      // Veto 3 : les langues et écritures anciennes ont leur propre fiche, et celle-ci
      // tourne avant dans la chaîne (grec, latin, sumérien, hiéroglyphes,
      // maya, quechua, nahuatl, sanskrit, étrusque, gotique, runes ...).
      try { if (App.AncientMemo && App.AncientMemo.isAncient(text)) return false; } catch (e) {}
      // Les grandes questions sur les langues, sans qu'aucune langue ne soit nommée.
      if (/(combien de langues|langues du monde|familles? de langues|famille linguistique|langues? (romanes?|celtiques?|germaniques?|slaves?|indo-europ|turques?|cr[eé]oles?|juives?|bantoues?|sino-tib|alta[iï]ques?)|langue (officielle|r[eé]gionale|minoritaire|morte|ancienne|des signes|construite|vivante|maternelle)|un dictionnaire pour chaque langue|dictionnaires? par langue|lexilogos|quelle langue|langue parle[- ]?t[- ]?on|parle[- ]?t[- ]?on (au|en|à|aux)|langues? d['’](o[ïi]l|oc)|francoproven|francophonie|bilinguisme|plurilinguisme)/.test(t)) return true;
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u02bc]/g, "'");
      if (!this._nameRe().test(tn)) return false;
      // Un nom de langue seul ne suffit pas ("fromage suisse", "film americain") :
      // il doit s'agir de la langue, d'un dictionnaire ou de la traduction.
      if (/\b(?:langues?|linguist\w*|lexic\w*|dialect\w*|patois|dictionnaires?|lexiques?|vocabulaires?|grammaires?|alphabets?|[eé]critures?|claviers?|traductions?|traduire|traduis\w*|traduit|traducteur|parl(?:e|es|er|[eé]e?s?|ent|ait)\b|prononc\w*|apprend\w*|apprentissage|bilingue|multilingue|locuteurs?|endonyme|autonyme|dit[- ]?on|expressions?|mots?)/.test(t)) return true;
      // Ou une question qui fait de la langue elle-même le thème ("c'est quoi le
      // swahili ?", "explique-moi le breton") - mais pas un simple superlatif
      // sur un pays ou un produit ("le meilleur fromage belge").
      return /(explique|expliquer|expliquez|c['’]est quoi|qu['’]est[- ]?ce|que veut dire|signifie|sens de|d[ée]fini|d[ée]cri|donne[- ]?moi|dis[- ]?moi|montre|parle[- ]?moi|pr[ée]sente|raconte|combien|o[uù] (?:est|sont|se trouve|trouver|chercher|apprendre|peut[- ]?on|puis[- ]?je))/.test(t);
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
            if (!secs.length) { console.warn('[LanguesMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[LanguesMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[LanguesMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    block(text) {
      try {
        if (!this._data || !this.isLangues(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[LANGUES DU MONDE ET DICTIONNAIRES PAR LANGUE - LES FICHES DE RÉFÉRENCE]'];
        L.push("Voici les fiches sur les langues du monde et sur le portail des langues de Xavier Nègre (Lexilogos)" + (books.length > 1 ? ', en plusieurs fiches' : '') + ' : '
          + books.map(b => '« ' + b.title + ' »').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push("The sections below are the ones that match his question. Answer from them: name the language as the sheet names it in French, and when the question is where to find a dictionary, a grammar or a tool for that language, give the page exactly as the sheet gives it (https://www.lexilogos.com/...). Say what that page really holds. Keep three things apart: the language, its regional and national varieties, and its writing. Never invent a dictionary, a title, an author, a number of speakers or an address that is not in these sections. When the question is about the meaning, the spelling or the grammar of FRENCH, say that it belongs to the other sheets (the French dictionaries) and that these sheets only say which work to open. If one of these sections does not really fit his question, ignore it and answer from what you know.");
          L.push("Write it as ordinary text on the page: no emoji, no $ sign, no LaTeX. A language name and an address stay in ordinary characters, exactly as in the sheet; a list of languages stays a plain list, one per line. When he asks where to look, end with the page of that language.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push("No section of these sheets matches his question exactly. Here is what they cover, so you can tell him what they hold and explain from them:");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.LanguesMemo.warm();
  // Ronde 236 (les dix adresses du proprietaire : secuser.com x9 et
  // anonymat.org/vostraces). Les pages ont ete recuperees et lues en direct, et
  // leur contenu est largement archival : actus figees en 2014, dernieres alertes
  // virus et phishing en 2011, dernieres vulnerabilites en 2016 - la fiche le dit
  // et renvoie vers des relais a jour. MÊME machine que les autres dossiers
  // (mots, stemming, index, poids des titres), corpus propre (src/secu/), porte
  // propre (isSecu) et bloc propre. Les autres mémos ne sont pas touchés.
  App.SecuMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/secu/secu-fiche.json', kind: 'fiche' }
    ],
    MAX: 5200,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    _tag: '[SecuMemo]',
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('securite sécurité informatique secuser secu site sites page pages alerte alertes newsletter newsletters lettre lettres outil outils gratuit gratuits gratuite gratuites ligne lignes dossier dossiers liste listes rubrique rubriques recherche moteur analyseur internet web').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    SHORT_WORDS: (function () { let o = {}; ('ver bot').split(' ').forEach(w => { if (w) o[w] = 1; }); return o; })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae').replace(/[’']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-zà-ÿ0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    lookupQuery(t) { return App.MathMemo.lookupQuery.call(this, t); },
    // La porte : s'agit-il de securite informatique au sens de Secuser - virus et
    // troyens, phishing, hoax, antivirus et desinfection, failles, vie privee ?
    // Un terme fort du domaine ET une question (ou un court message qui ne nomme
    // que le theme). « Virus » seul ne suffit pas : sans contexte machine, c'est
    // la fiche maladies qui parle (grippe, gastro...), pas celle-ci.
    isSecu(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      try { if (App.ProtonMemo && App.ProtonMemo.isProton(text)) return false; } catch (e) {}
      // La cuisine (recette de cookies) et la médecine (virus, symptômes,
      // médicaments) : ces fiches n'y appartiennent pas.
      if (/(recette|cuisine|cuisiner|four\b|pâtisserie|gâteau|chocolat|ingrédient)/.test(t)) return false;
      if (/(fièvre|fievre|toux|gorge|grippe|gastro|diarrhée|diarrhee|vomissement|douleur|malade|maladie|sympt[oô]me|traitement|ordonnance|médicament|medicament|docteur|médecin|medecin|hôpital|hopital|vaccin|papillomavirus|herpès|herpes|\bsida\b|\bvih\b|coronavirus|covid|angine|bronchite|pneumonie|otite)/.test(t)) return false;
      const S = /(secuser|hoaxkiller|inoculer|anonymat|vostraces|vos traces|cybermalveillance|signal[- ]?spam|pharos|33700|cheval de troie|troyen|troj|ransomware|ran[çc]ongiciel|cryptolocker|hame[çc]onnage|phishing|smishing|vishing|pharming|hoax|viroax|canular|antivirus|anti[- ]?virus|désinfection|desinfection|pare[- ]?feu|firewall|spyware|logiciel espion|keylogger|adware|dialer|rootkit|botnet|pourriel|spamming|mailbombing|faille de sécurité|vulnérabilité|piratage|pirater|piraté|vie privée|cookies?|traceur)/;
      const V = /\bvirus\b/;
      const C = /(informatique|ordinateur|\bpc\b|windows|fichier|pièce jointe|piece jointe|courriel|e-?mail|\bmail\b|messagerie|logiciel|télécharg|telecharg|navigateur|internet|disque dur|démarrage|demarrage|boot|macro|conficker|mydoom|blaster|wannacry|morto|zbot|storm worm)/;
      if (!S.test(t) && !(V.test(t) && C.test(t))) return false;
      const Q = /(explique|expliquer|expliquez|comment|c'est quoi|qu'est[- ]?ce|que veut dire|signifie|sens de|pourquoi|combien|quel|quelle|quels|quelles|parle[- ]?moi|donne[- ]?moi|dis[- ]?moi|montre|rappelle|cite|liste|présente|presente|résume|resume|que faire|quoi faire|au secours|aide|leçon|revois|méthode|corrige|vérifie|détaille|\?)/;
      if (Q.test(t)) return true;
      let tn = t; try { tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
      if (/\b(j'ai|j ai|je|mon|ma|mes|tu|ton|ta|il|elle|nous|vous|ils|elles|suis|aime|veux|peux)\b/.test(tn)) return false;
      return t.replace(/\s+/g, ' ').trim().length <= 60;
    },
    warm() { return App.MathMemo.warm.call(this); },
    block(text) {
      try {
        if (!this._data || !this.isSecu(text)) return '';
        let sel = this.pick(text, this.MAX);
        let weak = false;
        if (!sel || !sel.length) {
          weak = true;
          try { sel = this._data.sections.filter(s => /Secuser\.com, le site/.test(s.t || '')).slice(0, 1); } catch (e) { sel = []; }
        }
        let L = ['[SÉCURITÉ INFORMATIQUE — SECUSER.COM ET ANONYMAT.ORG : LES FICHES DE RÉFÉRENCE]'];
        L.push("Tu as sous les yeux les pages de Secuser.com (site français indépendant, Emmanuel JUD, depuis 1998) et d'Anonymat.org, condensées et vérifiées en direct : le site et ses rubriques, les alertes virus, le dossier « Virus : généralités », l'antivirus en ligne, les outils de désinfection, les avis de vulnérabilités, les alertes phishing, l'antihoax, les quatre newsletters, et « Vos traces sur le Net ». C'est TA SEULE source sur ce sujet : tu l'as lue, elle est recopiée ci-dessous.");
        if (sel && sel.length) {
          L.push(weak
            ? "Sa question est générale : voici la fiche de présentation du site, qui dit ce qu'il est et ce qu'il couvre. Présente Secuser à partir d'elle (son auteur, ses rubriques, son caractère archival), nomme l'adresse, puis dis ce que ces fiches portent pour répondre à sa question."
            : "Les sections ci-dessous correspondent à sa question. Commence ta réponse en nommant la page que tu as lue (par exemple « d'après la page Alertes phishing de Secuser... » avec son adresse), réponds avec SES exemples, SES dates et SES statuts, et n'ajoute rien qu'elle ne dise pas.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']\n' + s.x));
          L.push("Deux règles d'honnêteté : (1) Secuser est largement ARCHIVAL — actualités figées en 2014, dernières alertes virus et phishing en 2011, dernières vulnérabilités en 2016 — dis-le quand il demande de l'actuel, et ne présente jamais les outils d'époque (Windows XP/Vista/7, removal tools 2003-2011) comme des conseils d'aujourd'hui : renvoie alors vers la section des relais à jour. (2) N'invente ni alerte, ni date, ni statut : ce qui n'est pas écrit ci-dessus n'existe pas ici. Texte ordinaire, sans emoji ni LaTeX.");
        } else {
          L.push("Aucune section de ces fiches ne correspond exactement à sa question. Voici ce qu'elles portent, pour le lui dire et répondre d'après elles :");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.SecuMemo.warm();
  setTimeout(function () { try { App.GbdLookup.warm(); } catch (e) {} }, 8000);
  attachRPG(App);
  try { if (typeof attachSheets === 'function') attachSheets(App); } catch (e) { console.warn('[Fiches] attach failed', e); }
  App.Interpreter = SOFIA_INTERPRETER;
  App.Python = SOFIA_PYTHON;
  App.Notebook = {
    LABEL: { en: 'Notebook (.ipynb)', de: 'Notizbuch (.ipynb)', es: 'Cuaderno (.ipynb)', fr: 'Carnet (.ipynb)', it: 'Quaderno (.ipynb)' },
    DONE: { en: 'Notebook downloaded.', de: 'Notizbuch heruntergeladen.', es: 'Cuaderno descargado.', fr: 'Carnet téléchargé.', it: 'Quaderno scaricato.' },
    EMPTY: { en: 'No code runs in this chat.', de: 'Kein Code in diesem Chat.', es: 'Sin código en este chat.', fr: 'Aucun code exécuté dans ce chat.', it: 'Nessun codice in questa chat.' },
    label() { let l = 'en'; try { l = String(App.State.settings.language || 'en').slice(0, 2); } catch (e) {} return this.LABEL[l] || this.LABEL.en; },
    msg(key) { let l = 'en'; try { l = String(App.State.settings.language || 'en').slice(0, 2); } catch (e) {} return this[key][l] || this[key].en; },
    runs(session) { try { return (session.messages || []).filter(m => m && m.interpreter && m.interpreter.code); } catch (e) { return []; } },
    hasRuns(session) { return this.runs(session).length > 0; },
    toLines(s) {
      s = String(s == null ? '' : s);
      if (!s) return [];
      let parts = s.split('\n');
      return parts.map((l, i) => l + (i < parts.length - 1 ? '\n' : ''));
    },
    textOf(v) {
      if (v == null) return '';
      if (typeof v === 'string') return v;
      try { return JSON.stringify(v, null, 2); } catch (e) { try { return String(v); } catch (e2) { return ''; } }
    },
    blobB64(blob) {
      return new Promise((res) => {
        try {
          let fr = new FileReader();
          fr.onload = () => { try { res(String(fr.result).split(',')[1] || ''); } catch (e) { res(''); } };
          fr.onerror = () => res('');
          fr.readAsDataURL(blob);
        } catch (e) { res(''); }
      });
    },
    fileName(session) {
      let base = 'sofia-carnet';
      try { base = (session.title || 'sofia-carnet').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'sofia-carnet'; } catch (e) {}
      return base + '.ipynb';
    },
    async build(sessionId) {
      let session = null;
      try { session = (App.State.sessions || []).find(s => s.id === sessionId) || null; } catch (e) {}
      if (!session) return null;
      let runs = this.runs(session);
      if (!runs.length) return null;
      let hasPy = runs.some(r => (r.interpreter.lang || '') === 'python');
      let cells = [];
      let dstr = '';
      try { dstr = new Date().toLocaleDateString(); } catch (e) {}
      cells.push({ cell_type: 'markdown', metadata: {}, source: this.toLines('# ' + (session.title || 'Sofia') + '\nCarnet exporté de Sofia · ' + dstr + ' · ' + runs.length + ' cellule(s) de code') });
      for (let m of runs) {
        let d = m.interpreter;
        let lang = (d.lang === 'python') ? 'python' : 'javascript';
        if (d.caption) cells.push({ cell_type: 'markdown', metadata: {}, source: this.toLines(d.caption) });
        let outputs = [];
        let logs = Array.isArray(d.logs) ? d.logs.join('\n') : String(d.logs || '');
        if (logs) outputs.push({ output_type: 'stream', name: 'stdout', text: this.toLines(logs) });
        if (d.stderr) outputs.push({ output_type: 'stream', name: 'stderr', text: this.toLines(d.stderr) });
        if (d.result !== null && d.result !== undefined && d.result !== '') outputs.push({ output_type: 'execute_result', execution_count: null, data: { 'text/plain': this.toLines(this.textOf(d.result)) }, metadata: {} });
        if (d.error) outputs.push({ output_type: 'error', ename: String((d.error && d.error.name) || 'Error'), evalue: String((d.error && d.error.message) || ''), traceback: this.toLines(String((d.error && d.error.message) || '')) });
        if (Array.isArray(d.images) && d.images.length && App.ImgStore) {
          for (let ref of d.images) {
            try {
              if (typeof ref !== 'string' || ref.indexOf('img://') !== 0) continue;
              let blob = await App.ImgStore.get(ref.slice(6));
              if (!blob || !/^image\/(png|jpeg|gif)$/.test(blob.type || '')) continue;
              let b64 = await this.blobB64(blob);
              if (!b64) continue;
              outputs.push({ output_type: 'display_data', data: { ['image/' + blob.type.split('/')[1]]: b64 }, metadata: {} });
            } catch (e) {}
          }
        }
        let cell = { cell_type: 'code', execution_count: null, metadata: {}, source: this.toLines(d.code), outputs: outputs };
        if (!hasPy || lang !== 'python') { try { cell.metadata.vscode = { languageId: lang === 'python' ? 'python' : 'javascript' }; } catch (e) {} }
        cells.push(cell);
        if (d.ok === false && !d.error && !d.stderr && !logs) cells.push({ cell_type: 'markdown', metadata: {}, source: this.toLines('*Exécution sans sortie.*') });
      }
      return {
        nbformat: 4, nbformat_minor: 5,
        metadata: hasPy
          ? { kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' }, language_info: { name: 'python', version: '3' } }
          : { kernelspec: { display_name: 'JavaScript', language: 'javascript', name: 'javascript' }, language_info: { name: 'javascript' } },
        cells: cells
      };
    },
    async download(sessionId) {
      let nb = await this.build(sessionId);
      if (!nb) { try { if (App.UI && App.UI.showToast) App.UI.showToast(this.msg('EMPTY'), 'info'); } catch (e) {} return { ok: false }; }
      let session = (App.State.sessions || []).find(s => s.id === sessionId);
      try {
        let url = URL.createObjectURL(new Blob([JSON.stringify(nb, null, 1)], { type: 'application/x-ipynb+json' }));
        let a = document.createElement('a');
        a.href = url;
        a.download = this.fileName(session || {});
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { try { URL.revokeObjectURL(url); a.remove(); } catch (e) {} }, 5000);
      } catch (e) { return { ok: false }; }
      try { if (App.UI && App.UI.showToast) App.UI.showToast(this.msg('DONE'), 'success'); } catch (e) {}
      return { ok: true };
    }
  };
  attachProviders(App, { builtin: (p) => root.generateText(p), superFetch: (...a) => App.Core.proxyFetch(...a) });
  attachModes(App, { internal: (p) => root.generateText(p) });
  // Sofia Core : le résident intérieur. Continue même quand un fournisseur externe
  // écrit les réponses visibles (voir src/inner.js).
  attachInner(App, { internal: (p) => root.generateText(p) });
  // Sofia Core : filtre de pensée rigoureux – le processus de pensée d'un modèle (y compris en
  // mode Échecs) ne doit jamais apparaître dans la bulle de chat (voir src/think-filter.js).
  attachThinkFilter(App);
  // Sofia Core : couche de contrôle pour les voix externes. Un modèle connecté soi-même
  // peut être la voix de Sofia – jamais le maître de la procédure (voir src/guard.js).
  attachGuard(App);
  attachResearch(App, { generateText: (p) => App.Core.generateText(p) });
  attachSTT(App);
  attachVoice(App);
  try { if (typeof attachPiperVoice === "function") attachPiperVoice(App); } catch (e) { console.warn("[Piper] attach failed", e); }
  attachVocal(App);
  attachMentor(App, { generateText: (p) => App.Core.generateText(p) });
  // Le monde des métiers : Sofia incarne un métier et travaille avec sa
  // méthode et les ouvrages de référence faisant autorité DE SON PAYS. Si le noyau
  // entretenu manque pour un métier, elle le construit au premier usage via le
  // moteur intégré et le dépose dans IndexedDB (src/professions.js).
  attachProfessions(App, { internal: (p) => App.Core.runInternal(p) });
  // Barre de secteurs dans la fenêtre des métiers : le bord droit ne s'estompe que si
  // des puces viennent vraiment encore à droite - sinon le bord paraîtrait coupé.
  (() => {
    const sync = (row) => { if (row) row.classList.toggle("scrolled-end", row.scrollWidth - row.clientWidth - row.scrollLeft <= 2); };
    document.addEventListener("scroll", (e) => { if (e.target && e.target.id === "profSectorRow") sync(e.target); }, true);
    const watch = () => {
      const row = document.getElementById("profSectorRow");
      if (!row) { setTimeout(watch, 400); return; }
      sync(row);
      new MutationObserver(() => sync(row)).observe(row, { childList: true });
      window.addEventListener("resize", () => sync(row));
    };
    watch();
  })();
  attachChess(App, { generateText: (p) => App.Core.generateText(p) });
  try { if (typeof attachChess3d === 'function') attachChess3d(App); } catch (e) { console.warn('[Chess3d] attach failed', e); }
  attachChaos(App);
  attachDeites(App);
  attachParental(App);
  attachVideos(App);
  attachMedias(App);
  try { if (typeof attachImgStyles === 'function') attachImgStyles(App); } catch (eIS) {}
  try { if (typeof attachSfw === 'function') attachSfw(App); } catch (eSFW) { console.warn('[SFW] attach failed', eSFW); }
  attachDeepMemory(App, { generateText: (p) => App.Core.generateText(p) });
 // Noyau de mémoire (« Memory Core ») : mémoire épisodique au-dessus de la recherche vectorielle –
  // épisodes, faits sur l'utilisateur, sentiments + chaîne narrative (src/memstruct.js).
  // Tourne en arrière-plan via le canal interne, jamais via le fournisseur externe.
  attachMemStruct(App, { internal: (p) => App.Core.runInternal(p) });
 // Barre d'avis visible au-dessus du champ de saisie : chaque auto-reprogrammation
  // (nouvelle note personnelle, consultation en attente, réponse appliquée) devient
  // visible, même si l'utilisateur n'est pas dans les réglages (src/notice.js).
  attachNotice(App);
 // Script personnel : Sofia écrit et entretient sa propre note permanente
  // sur qui elle est pour cet utilisateur et comment elle veut travailler. Alimentée
  // par le noyau de mémoire, tourne en silence via le canal interne (src/selfscript.js).
  attachSelfScript(App, { internal: (p) => App.Core.runInternal(p) });
 // Apprentissage autonome : elle va d'elle-même sur le web, lit les vraies pages
  // et s'en écrit une fiche qu'elle garde – un savoir qui réapparaîtra plus tard dans
  // ses réponses (src/weblearn.js). Via [SOFIA_LEARN]
  // elle détermine elle-même ce qu'elle veut savoir durablement.
  attachWebLearn(App, { internal: (p) => App.Core.runInternal(p) });
  // Ronde 214 : « tout ce que Julia apprend d'elle même sur internet doit faire
  // partie des fiches de connaissance de mentor. » Les fiches web écrites par elle-même
  // (App.WebLearn) appartiennent à la fiche de connaissances du mentor : l'
  // instruction pour la fiche de connaissances les reçoit, et la tâche exige de
  // les inclure dans la fiche (avec source et date) au lieu d'enseigner depuis la
  // mémoire du modèle.
  try {
    if (App.Mentor && App.WebLearn && typeof App.Mentor._buildSheetInstruction === 'function') {
      const _origSheetInstr = App.Mentor._buildSheetInstruction.bind(App.Mentor);
      App.Mentor._buildSheetInstruction = function (session) {
        let base = _origSheetInstr(session);
        try {
          let notes = [];
          let q = '';
          try { let s = App.Mentor.getState(session); q = [s && s.topic, s && s.goal, s && s.stage].filter(Boolean).join(' '); } catch (e) {}
          try { if (q && App.WebLearn._test && App.WebLearn._test.pick) notes = App.WebLearn._test.pick(q) || []; } catch (e) {}
          if (!notes.length) {
            try { notes = (App.WebLearn.list ? App.WebLearn.list() : []).slice().sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 5); } catch (e) {}
          } else { notes = notes.slice(0, 6); }
          if (!notes.length) return base;
          let L = ['', '[WHAT YOU LEARNED ON YOUR OWN - PART OF YOUR KNOWLEDGE SHEETS]',
            'These are the notes you wrote yourself from real pages you read. They are part of your knowledge sheets: fold what they establish into the sheet below - into "learned" and into "terms" with their definition - name the source and the date when it matters, and never present them as something you always knew.'];
          notes.forEach(function (n, i) {
            let d = n.at ? new Date(n.at).toLocaleDateString() : '';
            let src = (n.src || []).map(function (x) { return x.h || x.u; }).filter(Boolean).slice(0, 3);
            L.push('[' + (i + 1) + '] ' + (n.title || '') + ' · ' + (n.topic || '') + (d ? ' · ' + d : '') + (src.length ? ' · source: ' + src.join(', ') : ''));
            L.push(String(n.text || '').slice(0, 1200));
          });
          L.push('[END WHAT YOU LEARNED ON YOUR OWN]');
          return base + '\n' + L.join('\n');
        } catch (e) { return base; }
      };
    }
  } catch (e) { console.warn('[Mentor] learned-sheet patch failed', e); }
 // Consultations avec l'assistant IA : Sofia ne peut pas se reprogrammer
  // elle-même – son code réside dans des fichiers. Elle formule donc une interrogation
  // sur elle-même, le briefing va à l'assistant IA (ou à une
  // passe d'assistant résidente du moteur interne), et la réponse revient :
  // comme nouveau script personnel et/ou comme tâches de programmation ouvertes
  // (src/consult.js).
  attachConsult(App, { internal: (p) => App.Core.runInternal(p) });
 // Erreurs de script vers l'assistant IA : de vraies erreurs dans son code en cours
  // (erreurs de template/listes Perchance, JS non capturé, promesses rejetées, erreurs de patch
  // signalées par des modules) sont capturées et placées comme rapport fini dans
  // le canal de consultation – l'utilisateur le transmet d'UN clic
  // ("Copy for the AI helper") dans le chat avec l'aide (src/errorreport.js).
  attachErrorReport(App);
  // Son visage lui appartient : l'emblème (avatar dans la barre latérale, en-tête
  // mobile, image d'accueil, icône d'onglet) ne se trouve plus codé en dur dans le
  // HTML, mais dans App.Brand – et Sofia elle-même peut le redessiner. Le marqueur
  // [SOFIA_LOGO] dans sa réponse va au vrai générateur d'images de l'app et
  // le résultat devient aussitôt son nouveau visage (src/brand.js).
 // Mise à jour de soi-même : son propre code réside comme vrai fichier sous src/,
  // et il est chargé exactement une fois. Si un fichier change (par l'aide,
  // comme correction de bug ou par le propriétaire), elle prend la nouvelle version en
  // un mouvement ordonné : enregistrer la conversation, se déconnecter (voix, micro,
  // code en cours), recharger la page, revenir dans le même chat (src/selfupdate.js).
  attachSelfUpdate(App, { reload: () => location.reload() });
 // Ronde 215 : l'annonce « j'ai pris ma nouvelle version, je suis de retour »
  // (src/selfupdate.js, updateSay) est écrite APRÈS le rechargement dans la
  // session alors active. Si c'était un chat VIDE tout neuf (p.ex.
  // le chat d'accueil), elle restait comme seul message – le chat
  // ne montrait plus, à chaque ouverture, que « ⟳ J'ai pris la nouvelle version… ». Maintenant
  // l'annonce d'auto-mise à jour est sautée tant que la session
  // n'a encore aucun message ; la barre d'avis nomme de toute façon la nouvelle version.
  // Dans une vraie conversation (avec messages), elle apparaît inchangée.
  try {
    if (App.Core && typeof App.Core.addMessage === 'function') {
      const _origAddMessage = App.Core.addMessage.bind(App.Core);
      App.Core.addMessage = function (role, content, type, extra) {
        try {
          const isUpdateSay = role === 'assistant'
            && typeof content === 'string'
            && content.replace(/^\s+/, '').charAt(0) === '\u27F3';
          if (isUpdateSay) {
            const s = (App.State.sessions || []).find(function (x) { return x.id === App.State.currentSessionId; });
            if (s && Array.isArray(s.messages) && s.messages.length === 0) return;
          }
        } catch (e) {}
        return _origAddMessage(role, content, type, extra);
      };
    }
  } catch (e) { console.warn('[SelfUpdate] announce-guard patch failed', e); }
  attachBrand(App, { generateImage: (p, o) => App.Core.generateImage(p, o) });
 // Dictionnaire (src/dictionary.js) : récupère la vraie définition Wiktionary d'un
  // objet dans la langue de l'interface. Le prompt de vision reste en premier, la
  // définition vient derrière (reproduction visuelle, voir src/vision.js).
  attachDictionary(App, { superFetch: (...a) => App.Core.proxyFetch(...a) });
  attachVision(App, { generateText: (p) => App.Core.generateText(p), generateImage: (p, o) => App.Core.generateImage(p, o) });
 // Encyclopédie d'images (src/promptbook.js) : nom -> prompt d'image, consultable
  // lettre par lettre. Un résultat dessine directement, sinon elle demande
  // d'apprendre l'objet.
  // Le catalogue de base (src/promptbook-seed.js) fournit le vocabulaire pour 100 000
  // entrées ; il doit être AVANT attachPromptBook, pour que la construction au démarrage
  // trouve déjà le vocabulaire.
  attachPromptBookSeed(App);
  attachPromptBook(App, { generateImage: (p, o) => App.Core.generateImage(p, o) });
 // Images a partir d'une photo (SFW-only) : le marqueur [SOFIA_PHOTO] decrirait la photo jointe
  // pour generer un portrait habille. Aucune modification intime, aucun denudement (src/photo.js, stub SFW).
  attachPhoto(App, {}); // SFW-only stub (src/photo.js) : description uniquement, jamais de denudement.
  try { if (typeof attachNoPersonal === 'function') attachNoPersonal(App); } catch (eNP) { console.warn('[NoPersonal] attach failed', eNP); }
 // Images du web : visiter des liens, regarder vraiment les images (vision) et apprendre –
  // et la propre recherche d'images de Sofia (marqueur [SOFIA_WEBIMG], voir src/webvision.js).
  attachWebVision(App, { superFetch: (...a) => App.Core.proxyFetch(...a), generateText: (p) => App.Core.generateText(p) });
 // Vraie recherche web : interroger vraiment Google + Bing et montrer les résultats
  // (marqueur [SOFIA_WEBSEARCH], voir src/websearch.js).
  attachWebSearch(App, { superFetch: (...a) => App.Core.proxyFetch(...a), webvision: App.WebVision });
  // Garde SFW nº 7 (src/sfw.js) : attachSfw a tourné AVANT la recherche web,
  // donc on l'applique ici, une fois App.WebSearch présent — le sexuel
  // explicite est traité derrière l'écran, jamais affiché.
  try { const __sfwM = __M['./src/sfw.js']; if (__sfwM && typeof __sfwM.hardenWebSearch === 'function') __sfwM.hardenWebSearch(App); } catch (eHW) { console.warn('[SFW] garde websearch (post-attach) echec', eHW); }
 // Ronde 157/158 : les moteurs que le propriétaire avait nommés — lukol.com (les résultats de
  // Google) et naver.com (Corée) — tournaient EN PARALLÈLE des moteurs de src/websearch.js et
  // leurs résultats figuraient TOUT EN HAUT dans la carte et dans le prompt. Pour cela,
  // `App.WebSearch.search` est enveloppé : le module chiffré reste intact et chaque site d'appel
  // passe par l'enveloppe (recherche web, vérification des sources, recherche mathématique, ronde 155).
  //
  // Ronde 210 : Lukol supprimé (il ne rendait le Programmable Search de Google que dans le
  // navigateur, et le lecteur r.jina.ai ne livrait plus que du CSS). Ronde 266 : Naver supprimé sur
  // demande du propriétaire (« enlève naver comme moteur de recherche »). La liste `engines` est donc
  // VIDE aujourd'hui : l'enveloppe ne fait plus que laisser passer les moteurs de src/websearch.js
  // (l'infrastructure reste en place : ré-enregistrer un moteur — nom, fonction de lecture, adresse —
  // suffit à le remettre dans la carte).
  // Ronde 176 : la garde des sources. Sur de vraies bases de données, elle ne doit inventer
  // ni article ni définition. L'app sait ce qui, dans ce tour,
  // se trouvait VRAIMENT devant elle : les sections des dossiers et les fiches
  // lues elle-même (Légifrance, VIDAL, Studyrama). La garde rassemble ce matériel,
  // vérifie la réponse finie contre lui et ne laisse corriger qu'UNE SEULE FOIS au plus ;
  // si cela n'aide pas non plus, elle ajoute le texte exact comme indication de source.
  // Ronde 198 : LES CORPUS DE TEXTES — même procédé que pour le code (ronde 197),
  // mais pour les documents que le propriétaire a donnés, et pour tout ce qu'
  // il donne encore. Pour le code, cela disait : amener le vrai texte dans la maison, le
  // rendre interrogeable et prouver chaque citation à partir de lui. Ici : les vraies pages
  // d'un document (sexologie, médecine, mathématiques, web, ...) résident comme
  // src/<domaine>/texte.json.gz dans la maison, sont récupérées en arrière-plan, et leurs
  // sections correspondantes passent AVANT la fiche condensée. La fiche reste comme
  // repli si aucun texte n'est (encore) là ou si rien ne convient.
  // La règle pour l'avenir (voir src/CORPUS.md) : chaque document qu'il
  // donne est inscrit ainsi — pas copié dans le prompt, mais rendu durable.
  // Ronde 277 (demande du propriétaire : la Bible complète, la Torah, le Coran,
  // le livre de Siddhartha Gautama) : LES ÉCRITURES SAINTES. Six corpus au format
  // texte (Bible Segond 1910 intégrale, Torah hébreu + Segond, Torah Rabbinat + Rachi,
  // Coran arabe + Hamidullah, Dhammapada Hû 1878, Enseignement du Bouddha BDK), lus en direct aux adresses ci-dessous (même machine que
  // les autres classeurs : SOURCES + warm + pick). Le registre src/corpus-index.json
  // les annonce aussi pour le jour où le miroir GitHub les portera.
  App.ReligionMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'https://raw.githubusercontent.com/Sofiaperchancenew/sofia/main/src/religion/bible-segond-1910.json.gz', kind: 'ecriture' },
      { url: 'https://raw.githubusercontent.com/Sofiaperchancenew/sofia/main/src/religion/torah-hebreu-segond.json.gz', kind: 'ecriture' },
      { url: 'https://raw.githubusercontent.com/Sofiaperchancenew/sofia/main/src/religion/coran-hamidullah.json.gz', kind: 'ecriture' },
      { url: 'https://raw.githubusercontent.com/Sofiaperchancenew/sofia/main/src/religion/dhammapada-hu.json.gz', kind: 'ecriture' },
      { url: 'https://raw.githubusercontent.com/Sofiaperchancenew/sofia/main/src/religion/enseignement-bouddha-bdk.json.gz', kind: 'ecriture' },
      { url: 'https://raw.githubusercontent.com/Sofiaperchancenew/sofia/main/src/religion/torah-rabbinat-rachi.json.gz', kind: 'ecriture' }
    ],
    MAX: 6000,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    LIVRES: 'genese|exode|levitique|nombres|deuteronome|josue|juges|ruth|samuel|rois|chroniques|esdras|nehemie|esther|job|psaume|psaumes|proverbes|ecclesiaste|cantique|esaie|jeremie|lamentations|ezechiel|daniel|osee|joel|amos|abdias|jonas|michee|nahum|habacuc|sophonie|aggee|zacharie|malachie|matthieu|marc|luc|jean|actes|romains|corinthiens|galates|ephesiens|philippiens|colossiens|thessaloniciens|timothee|tite|philemon|hebreux|jacques|pierre|jude|apocalypse',
    _normQ(t) {
      return String(t == null ? '' : t).toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[\u0300-\u036F]/g, '');
    },
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/[\u2019']/g, ' ').replace(/%/g, ' pourcent ').replace(/[\u0591-\u05c7\u064b-\u065f\u0670]/g, '').replace(/[\u0671\u0622\u0623\u0625]/g, '\u0627').replace(/[^a-z\u00e0-\u00ff0-9\u0590-\u05ff\u0600-\u06ff]+/g, ' ');
      let self = this, out = [];
      let sq = ''; try { let w = String(q || '').split(/\s+/); sq = w.length > 6 ? w.slice(0, 6).join(' ') : ''; } catch (e) {}
      s.split(' ').forEach(function (x) {
        if (/^\d{1,3}$/.test(x)) { out.push(x); return; }
        if (/^[ivxlcdm]{2,6}$/i.test(x)) { out.push(x.toUpperCase()); return; }
        if (/^[\u0590-\u05ff\u0600-\u06ff]{2,}$/.test(x)) { out.push(x); return; }
        if (x.length >= 4 && !self.STOP[x]) out.push(self._stem(x));
      });
      return out;
    },
    isReligion(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      let tn = t.replace(/œ/g, 'oe').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (/[\u0590-\u05ff]/.test(t) || /[\u0600-\u06ff]/.test(t)) return true;
      return /(\bbible\b|biblique|biblical|scripture|testament|gospel|coran|quran|koran|surah|sourate|coranique|sourate|torah|pentateuque|evangile|evangeliste|psaume|genese|exode|levitique|deuteronome|apocalypse|epitre|dhammapada|tipitaka|sutta|bouddha|bouddhique|enseignement du bouddha|sentier octuple|nobles verites|terre pure|rachi|rashi|rabbinat|buddha|buddhist|sutta|dhammapada|genesis|exodus|deuteronomy|leviticus|psalm|proverbs|revelation|decalogue|genesis|exodus|matthew|romans|revelation|psalms?|proverbs|(?:mark|luke|john)\s+\d|beatitudes|cantique des cantiques|ecclesiaste|moise|abraham|siddhartha|gautama|\bmara\b)/.test(tn);
    },
    expand(text) {
      let tn = this._normQ(text), add = [];
      const SYN = [['creation', 'crea cieux terre commencement'], ['amour', 'aime charite prochain freres'], ['foi', 'croit croire fideles'], ['priere', 'prie priez'], ['pardon', 'pardonne misericorde'], ['resurrection', 'ressuscita morts'], ['sagesse', 'sage intelligence'], ['paradis', 'ciel royaume'], ['enfer', 'feu etang'], ['loi', 'commandements loi'], ['lumiere', 'lumiere tenebres'], ['peche', 'peche iniquite'], ['grace', 'grace misericorde'], ['paix', 'paix'], ['justice', 'juste justice'], ['royaume', 'royaume cieux'], ['berger', 'berger brebis'], ['alliance', 'alliance arche'], ['love', 'aime charite prochain'], ['faith', 'croit croire fideles'], ['prayer', 'prie priez'], ['god', 'dieu seigneur'], ['lord', 'seigneur eternel'], ['light', 'lumiere tenebres'], ['peace', 'paix'], ['wisdom', 'sage intelligence'], ['mercy', 'misericorde pardonne'], ['heaven', 'ciel royaume'], ['psalm', 'psaume cantique'], ['genesis', 'genese commencement'], ['exodus', 'exode egypte'], ['gospel', 'evangile jean']];
      for (const pair of SYN) { if (tn.indexOf(pair[0]) !== -1) add.push(pair[1]); }
      return String(text || '') + (add.length ? ' ' + add.join(' ') : '');
    },
    findRef(text) {
      try {
        if (!this._data) return [];
        let tn = ' ' + this._normQ(text).replace(/-/g, ' ') + ' ';
        tn = tn.replace(/\bgenesis\b/g, 'genese').replace(/\bexodus\b/g, 'exode').replace(/\bleviticus\b/g, 'levitique').replace(/\bdeuteronomy\b/g, 'deuteronome').replace(/\bpsalms?\b/g, 'psaume').replace(/\bproverbs\b/g, 'proverbes').replace(/\becclesiastes\b/g, 'ecclesiaste').replace(/\bisaiah\b/g, 'esaie').replace(/\bjeremiah\b/g, 'jeremie').replace(/\bezekiel\b/g, 'ezechiel').replace(/\bmatthew\b/g, 'matthieu').replace(/\bmark\b/g, 'marc').replace(/\bluke\b/g, 'luc').replace(/\bjohn\b/g, 'jean').replace(/\bacts\b/g, 'actes').replace(/\bromans\b/g, 'romains').replace(/\brevelation\b/g, 'apocalypse').replace(/\bjames\b/g, 'jacques').replace(/\bhebrews\b/g, 'hebreux');
        let secs = this._data.sections;
        let self = this;
        let normT = function (s) { return ' ' + self._normQ(s.t).replace(/-/g, ' ') + ' '; };
        let hasNum = function (nt, n) { try { return new RegExp('\\b' + n + '\\b').test(nt); } catch (e) { return false; } };
        let inRange = function (s, v) {
          if (v == null) return true;
          let m = / \((\d+)(?:-(\d+))?\)/.exec(String(s.t || ''));
          if (!m) return true;
          let a = +m[1], b = m[2] ? +m[2] : a;
          return v >= a && v <= b;
        };
        let out = [];
        let docPref = function (s) {
          let b = String(s.b || '');
          if (/[\u0590-\u05ff]/.test(text) && /massor[ée]tique/.test(b)) return 0;
          if (/[\u0600-\u06ff]/.test(text) && /Coran/.test(b)) return 0;
          if (/hebreu|massoretique|segond/.test(tn) && /massor[eé]tique/.test(b)) return 0;
          if (/rachi|rashi|rabbinat/.test(tn) && /Rachi/.test(b)) return 0;
          if (/torah/.test(tn) && /massor[eé]tique/.test(b)) return 0;
          if (/coran|arabe/.test(tn) && /Coran/.test(b)) return 0;
          if (/dhammapada|pali/.test(tn) && /Dhammapada/.test(b)) return 0;
          if (/enseignement|bdk|sutra|sentier/.test(tn) && /Enseignement du Bouddha/.test(b)) return 0;
          if (/bible|segond|testament/.test(tn) && /Bible/.test(b)) return 0;
          return 1;
        };
        let chapOf = function (s) {
          let t = String(s.t || '');
          let m = /(?:^|—\s*)([12]?\s?[A-Za-zÀ-ÿ'’]+?)\s+(\d+)\s*[\(:]/.exec(t);
          if (m) return +m[2];
          let m2 = /Sourate (\d+),/.exec(t);
          if (m2) return +m2[1];
          return null;
        };
        let m = new RegExp('\\b([123]?)\\s*(' + this.LIVRES + ')\\s+(\\d+)(?:\\s*[:.]\\s*(\\d+))?').exec(tn);
        if (m) {
          let book = ((m[1] ? m[1] + ' ' : '') + m[2]).replace(/\s+/g, ' ').trim(), ch = +m[3], v = m[4] ? +m[4] : null;
          let rx = new RegExp('(^\\s*|—\\s*)' + book + 's?\\s+(\\d+)\\s');
          let cands = [];
          for (const s of secs) {
            let nt = normT(s);
            let mt = rx.exec(nt);
            if (!mt || +mt[2] !== ch) continue;
            if (!inRange(s, v)) continue;
            cands.push({ s: s, head: mt.index <= 2 ? 0 : 1, pref: docPref(s) });
          }
          cands.sort((a, b) => (a.pref - b.pref) || (a.head - b.head));
          for (const c of cands.slice(0, 2)) out.push(c.s);
          if (out.length) return out;
        }
        let ms = /sourate\s+(\d+)(?:\s*[:.]\s*(\d+))?/.exec(tn);
        if (ms) {
          let ch = +ms[1], v = ms[2] ? +ms[2] : null;
          for (const s of secs) {
            let nt = normT(s);
            if (nt.indexOf('sourate') === -1 || chapOf(s) !== ch) continue;
            if (!inRange(s, v)) continue;
            out.push(s);
            if (out.length >= 2) break;
          }
          if (out.length) return out;
        }
        let md = /dhammapada[^\n:;]{0,50}?ch(?:apitre)?\.?\s*([ivxlcdm]+|\d+)/.exec(tn);
        if (md) {
          let tok = md[1].toUpperCase();
          for (const s of secs) {
            if (String(s.t || '').toUpperCase().indexOf('CH. ' + tok) !== -1) { out.push(s); if (out.length >= 2) break; }
          }
        }
        return out;
      } catch (e) { return []; }
    },
    block(text) {
      try {
        if (!this.isReligion(text)) return '';
        let L = ['[ÉCRITURES SAINTES - LES SIX TEXTES REMIS]'];
        L.push('Il t\'a remis six Écritures en texte intégral : « La Bible — Louis Segond 1910 » (Ancien + Nouveau Testament) ; « La Torah » (les cinq livres, chaque verset en français puis en hébreu) ; « La Torah — Rabbinat + Rachi » (Torah-Box : texte français et commentaire de Rachi, chapitre par chapitre) ; « Le Coran » (les 114 sourates, chaque verset en français puis en arabe) ; « Le Dhammapada » (les 26 chapitres, trad. Hû 1878) ; « L\'Enseignement du Bouddha » (BDK Tokyo, français moderne : le Bouddha, le Dharma, la Pratique).');
        if (this._data) {
          let secs = [];
          try {
            let refs = this.findRef(text);
            if (refs && refs.length) secs = secs.concat(refs.slice(0, 2));
          } catch (e2) {}
          let sel = null;
          try { sel = this.pick(this.expand(text), this.MAX); } catch (e3) {}
          if (sel) for (const s of sel) {
            if (secs.length >= 5) break;
            if (!secs.some(o => o.t === s.t && o.x === s.x)) secs.push({ t: s.t, c: s.c, p: s.p, x: s.x, b: s.b });
          }
          if (secs.length) {
            let total = 0;
            secs = secs.filter(function (s) { total += String(s.x || '').length; return total <= 7200; });
            L.push('Les passages ci-dessous sont ceux qui répondent à sa question, mot pour mot. Réponds À PARTIR D\'EUX : cite la phrase exacte entre guillemets et nomme la référence (Bible : « Genèse 1:1 » ; Coran : « Sourate 2:255 » ; Dhammapada : « ch. I » ; Bouddha : « Enseignement du Bouddha, p. 38 »). N\'invente aucun verset : si le texte ne dit pas ce qu\'il demande, dis-le. Respecte chaque tradition : ne mélange pas les Testaments, ne fais pas dire à un texte ce qu\'il ne dit pas.');
            secs.forEach(s => L.push('--- ' + s.t + (s.p && s.p !== s.t ? ' [' + s.p + ']' : '') + ' « ' + (s.b || '') + ' »\n' + s.x));
            return L.join('\n');
          }
        }
        L.push('Cite le verset exact quand le texte est sous tes yeux ; sinon dis ce qui manque plutôt que d\'inventer.');
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.ReligionMemo.warm();
  App.Corpus = Object.assign({}, App.MathMemo, {
    REGISTER: 'src/corpus-index.json',
    // Quel corpus appartient à quelle porte, et quelle fiche sert de repli.
    // Si un nouveau domaine s'ajoute, on complète une ligne ici.
    MEMO: { maths: 'MathMemo', med: 'MedMemo', metier: 'MetierMemo', gbd: 'GbdMemo', droit: 'DroitMemo', juri: 'JuriMemo', conseil: 'ConsiliumMemo', proton: 'ProtonMemo', sexo: 'SexoMemo', anatomie: 'AnatomyMemo', web: 'WebMemo', dico: 'DicoMemo', python: 'PythonMemo', code: 'CodeMemo', religion: 'ReligionMemo' },
    // Le même ordre que l'aiguillage dans App.Core.sendMessage : un domaine par tour.
    ORDER: ['maths', 'proton', 'med', 'metier', 'conseil', 'juri', 'gbd', 'droit', 'sexo', 'anatomie', 'religion', 'web', 'dico', 'python', 'code'],
    MAX: 3400,
    MIN: 3.5,
    _files: {}, _store: {}, _idx: {}, _loading: {}, _patched: false,
    _has(dom) { return !!this._files[dom]; },
    // Récupérer tous les corpus de textes que nomme le registre. Si un fichier manque ou
    // si le navigateur ne peut pas décompresser, on reste silencieusement à la fiche.
    warmAll() {
      let self = this;
      return App.Core.loadJson(this.REGISTER).then(function (j) {
        let list = (j && j.textes && j.textes.list) || [];
        for (const t of list) if (t && t.domaine && t.file) self._files[t.domaine] = t.file;
        let n = Object.keys(self._files).length;
        if (n) console.log('[Corpus] registre prêt :', n, 'corpus de textes');
        return Promise.all(Object.keys(self._files).map(function (d) { return self.load(d); }));
      }).catch(function (e) { console.warn('[Corpus] registre échoué', e && e.message); return null; });
    },
    load(dom) {
      let url = this._files[dom];
      if (!url) return Promise.resolve(null);
      if (this._store[dom] !== undefined) return Promise.resolve(this._store[dom]);
      if (this._loading[dom]) return this._loading[dom];
      let self = this;
      this._loading[dom] = App.Core.loadJson(url).then(function (j) {
        self._store[dom] = (j && j.sections && j.sections.length) ? j : null;
        if (self._store[dom]) console.log('[Corpus] ' + dom + ': texte réel prêt – ' + j.sections.length + ' sections sur ' + ((j.docs || []).length) + ' document(s)');
        return self._store[dom];
      }).catch(function (e) { console.warn('[Corpus] chargement échoué (' + dom + ')', e && e.message); self._store[dom] = null; return null; });
      return this._loading[dom];
    },
    _indexDom(dom) {
      let data = this._store[dom];
      if (!data) return null;
      if (this._idx[dom] && this._idx[dom].n === data.sections.length) return this._idx[dom];
      let self = this;
      let idx = { n: data.sections.length, e: [], df: {} };
      data.sections.forEach(function (s) {
        let tw = self._words(s.t), bw = self._words(s.x);
        idx.e.push({ s: s, t: tw, b: bw, ts: tw.join(' '), bs: bw.join(' ') });
      });
      this._idx[dom] = idx;
      return idx;
    },
    _dfDom(dom, w, idx) {
      if (idx.df[w] != null) return idx.df[w];
      let n = 0;
      for (const e of idx.e) {
        let found = false;
        for (const bw of e.b) { if (bw && this._hit(bw, w)) { found = true; break; } }
        if (!found) for (const tw of e.t) { if (tw && this._hit(tw, w)) { found = true; break; } }
        if (found) n++;
      }
      idx.df[w] = n;
      return n;
    },
    // La même recherche que dans les fiches (radical de mot, ce sont les mots rares qui décident),
    // mais avec de l'idf au carré et une compensation de longueur : une longue section
    // finit sinon par tout nommer. Retour : les meilleures sections, en ordre.
    pick(dom, text, max) {
      let idx = this._indexDom(dom);
      if (!idx) return null;
      let ws = this._words(text);
      if (!ws.length) return null;
      let bg = [];
      for (let i = 0; i + 1 < ws.length; i++) { if (ws[i] && ws[i + 1]) bg.push(ws[i] + ' ' + ws[i + 1]); }
      let self = this, N = idx.n || 1;
      let scored = [];
      for (const e of idx.e) {
        let sc = 0, tm = 0, seen = {};
        let tf = 1 / (1 + Math.log(1 + e.b.length / 300));
        for (const w of ws) {
          if (!w || seen[w]) continue; seen[w] = 1;
          let g = Math.pow(Math.log(1 + N / (1 + self._dfDom(dom, w, idx))), 2);
          if (e.t.indexOf(w) >= 0) { sc += g; tm++; }
          else if (e.b.indexOf(w) >= 0) { sc += 0.55 * g * tf; tm++; }
        }
        for (const p of bg) {
          if (e.ts.indexOf(p) !== -1) { sc += 1.4; tm++; }
          else if (e.bs.indexOf(p) !== -1) { sc += 1.1; tm++; }
        }
        if (tm >= 2) sc += 0.8 * tm;
        if (sc > 0) scored.push({ s: e.s, score: sc });
      }
      if (!scored.length) return null;
      scored.sort((a, b) => b.score - a.score);
      if (scored[0].score < this.MIN) return null;
      let chosen = [], total = 0;
      for (const it of scored) {
        let x = String(it.s.x || '');
        if (chosen.length && total + x.length > max) break;
        chosen.push(it.s); total += x.length;
        if (chosen.length >= 3) break;
      }
      return chosen;
    },
    // Quel domaine est visé dans ce tour ? La même porte que pour les
    // fiches, dans le même ordre.
    mint(text) {
      let M = {
        maths: function () { return App.MathMemo && App.MathMemo.isMath(text) && !(App.DroitMemo && App.DroitMemo.isDroit(text)); },
        med: function () { return App.MedMemo && App.MedMemo.isMed(text); },
        proton: function () { return App.ProtonMemo && App.ProtonMemo.isProton(text); },
        metier: function () { return App.MetierMemo && App.MetierMemo.isMetier(text); },
        gbd: function () { return App.GbdMemo && App.GbdMemo.isGbd(text); },
        conseil: function () { return App.ConsiliumMemo && App.ConsiliumMemo.isConsilium(text); },
        juri: function () { return App.JuriMemo && App.JuriMemo.isJuri(text); },
        droit: function () { return App.DroitMemo && App.DroitMemo.isDroit(text); },
        sexo: function () { return App.SexoMemo && App.Core && App.Core.sexoAllowed && App.Core.sexoAllowed() && App.SexoMemo.isSexo(text); },
        anatomie: function () { return App.AnatomyMemo && App.AnatomyMemo.isAnatomy(text); },
        religion: function () { return App.ReligionMemo && App.ReligionMemo.isReligion(text); },
        web: function () { return App.WebMemo && App.WebMemo.isWeb(text); },
        dico: function () { return App.DicoMemo && App.DicoMemo.isDico(text); },
        python: function () { return App.PythonMemo && App.PythonMemo.isPython(text); },
        code: function () { return App.CodeMemo && App.CodeMemo.isCode(text); }
      };      for (const dom of this.ORDER) { try { if (M[dom] && M[dom]()) return dom; } catch (e) {} }
      return null;
    },
    // Le bloc : le vrai texte du document, avec page et l'obligation de le
    // prouver mot pour mot. Si le domaine n'est PAS dans le corpus (ou si aucune
    // section ne convient), '' revient - alors la fiche reste.
    blockFor(dom, text) {
      try {
        let sel = this.pick(dom, text, this.MAX);
        if (!sel || !sel.length) return '';
        let data = this._store[dom] || {};
        let docs = data.docs || [];
        let L = [];
        L.push('[' + String(data.title || dom).toUpperCase() + ' - LE TEXTE QU\'IL T\'A DONNE]');
        // Ronde 198 : sans cette phrase, elle allait, sur une question de sexologie, dans SES
        // fichiers (Julianew.html) au lieu du texte qui se trouvait directement sous elle.
        L.push('Le texte ci-dessous EST sous tes yeux : reponds a partir de LUI. Ne cherche pas dans ses fichiers (la bibliotheque de documents) et ne dis pas que tu n\'as pas la fiche - tu l\'as ici, avec la page. Si tu veux un detail qui n\'y est pas, dis simplement ce qui manque.');
        L.push('Ce sont les documents qu\'il a remis' + (docs.length > 1 ? ', en plusieurs documents' : '') + ' : '
          + docs.map(function (d) { return '« ' + d.label + ' »'; }).join(' ; ')
          + '. Les passages ci-dessous sont ceux qui repondent a sa question, classes - le rang 1 est le plus proche, et chaque passage dit le document et la page. Reponds A PARTIR DE CE TEXTE : cite la phrase exacte entre guillemets et nomme le document et la page. Si un passage ne repond pas vraiment, dis-le et prends le suivant. Si le texte ne dit pas ce qu\'il demande, dis-le - n\'invente RIEN et ne remplace pas le texte par ta memoire.');
        sel.forEach(function (s, i) {
          L.push('--- ' + (s.b || '') + (s.p ? ', page ' + s.p : '') + ' [rang ' + (i + 1) + ']' + (s.t ? ' - ' + s.t : '') + '\n' + s.x);
        });
        L.push('Source : ' + String(data.source || '').slice(0, 300) + ' - ce texte vient des documents, pas du modele : cite-le et nomme la page.');
        return L.join('\n');
      } catch (e) { return ''; }
    },
    // Les fiches sont déplacées : si un vrai texte est là et touche la question,
    // il bat la fiche condensée. Sinon tout reste comme avant.
    init() {
      if (this._patched) return;
      this._patched = true;
      let self = this;
      for (const dom of Object.keys(this.MEMO)) {
        try {
          const M = App[this.MEMO[dom]];
          if (!M || typeof M.block !== 'function' || M.__corpus) continue;
          const orig = M.block;
          M.block = function (t) {
            // Interroger d'abord la fiche : sa porte décide si ce domaine
            // est seulement visé ("'', = porte fermée). C'est seulement si elle
            // donne quelque chose que le vrai texte entre en jeu - et la bat.
            let fiche = orig.call(M, t);
            if (!fiche) return fiche;
            try {
              if (self._store[dom]) {
                const cb = self.blockFor(dom, t);
                if (cb) return cb;
              }
            } catch (e) { console.warn('[Corpus] bloc échoué (' + dom + ')', e); }
            return fiche;
          };
          M.__corpus = true;
        } catch (e) {}
      }
    }
  });
  App.SourceGuard = {
    MAX_REPAIRS: 1,
    _material: [], _wordsAll: new Set(), _normAll: "", _readArticles: {}, _readSheets: [], _kinds: {},
    _legalNums: null, _legalLoading: null, _repairs: 0, _patched: false,
    STOPWORDS: ["dans","avec","pour","plus","tout","tous","toute","toutes","cette","cet","ces","sont","etre","fait","elle","nous","vous","mais","donc","alors","aussi","entre","sans","leur","leurs","meme","peut","doivent","doit","selon","comme","quand","apres","avant","autre","autres","dune","dun","lon","les","des","une","aux","par","sur","que","qui","son","ses","est","pas","ne","il","au","du","en","la","le","et","ou","de","un","y","a"],
    _norm(s) {
      return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    },
    _wordsArr(s) {
      const stop = this.STOPWORDS;
      return this._norm(s).split(" ").filter(w => w.length >= 5 && stop.indexOf(w) === -1);
    },
    _numNorm(s) { return String(s == null ? "" : s).toUpperCase().replace(/[^A-Z0-9]+/g, ""); },
    // Identifiant d'une fiche/d'un lecteur, pour que la garde sache quel type de corpus était en jeu.
    init() {
      if (this._patched) return;
      this._patched = true;
      const memos = [["math","MathMemo"],["anatomie","AnatomyMemo"],["web","WebMemo"],["python","PythonMemo"],["sexo","SexoMemo"],["dico","DicoMemo"],["med","MedMemo"],["metier","MetierMemo"],["droit","DroitMemo"],["juri","JuriMemo"],["conseil","ConsiliumMemo"],["proton","ProtonMemo"],["gbd","GbdMemo"],["code","CodeMemo"],["religion","ReligionMemo"]];
      for (const pair of memos) {
        try {
          const M = App[pair[1]];
          if (!M || typeof M.block !== "function" || M.__sourceGuard) continue;
          const orig = M.block;
          M.block = function (t) { const r = orig.call(M, t); try { if (r) App.SourceGuard.add(pair[0], r); } catch (e) {} return r; };
          M.__sourceGuard = true;
        } catch (e) {}
      }
      const looks = [["med","MedLookup"],["metier","MetierLookup"],["droit","DroitLookup"],["juri","JuriLookup"],["gbd","GbdLookup"],["conseil","ConsiliumLookup"],["proton","ProtonLookup"],["self","SelfKnow"]];
      for (const pair of looks) {
        try {
          const M = App[pair[1]];
          if (!M || typeof M.buildBlock !== "function" || M.__sourceGuard) continue;
          const orig = M.buildBlock;
          M.buildBlock = function (p) { const r = orig.call(M, p); try { if (r) App.SourceGuard.add(pair[0], r, p); } catch (e) {} return r; };
          M.__sourceGuard = true;
        } catch (e) {}
      }
    },
    reset() {
      this._material = []; this._wordsAll = new Set(); this._normAll = "";
      this._readArticles = {}; this._readSheets = []; this._kinds = {}; this._repairs = 0;
    },
    add(kind, text, meta) {
      const t = String(text == null ? "" : text);
      if (t.length < 80) return;
      this._material.push({ kind: kind, text: t });
      this._kinds[kind] = true;
      this._normAll = (this._normAll + " " + this._norm(t)).slice(-400000);
      for (const w of this._wordsArr(t)) this._wordsAll.add(w);
      if (meta && Array.isArray(meta.arts)) {
        for (const a of meta.arts) {
          if (!a || !a.num) continue;
          this._readArticles[String(a.num).toUpperCase()] = { text: a.text || "", env: a.env || "", url: a.url || "", nom: meta.nom || "" };
        }
      }
      // Fiche lue par elle-même sans numéros d'article (VIDAL, Studyrama, Onisep).
      if (meta && meta.f) {
        const sheet = { kind: kind, title: meta.f.title || "", substance: meta.f.substance || "", url: meta.f.url || meta.url || "" };
        if (!this._readSheets.some(s => s.title === sheet.title && s.url === sheet.url)) this._readSheets.push(sheet);
      }
    },
    // Ronde 198 : une seule petite carte de tous les numéros d'articles de tous les codes
    // (234 Ko compressés) au lieu de sept grands index. Elle dit seulement : ce
    // numéro existe-t-il du tout dans un code du corpus ?
    async _loadLegal() {
      if (this._legalNums) return this._legalNums;
      if (this._legalLoading) return this._legalLoading;
      const self = this;
      // Ronde 274 : cette carte est hébergée avec le reste du corpus ; DroitLookup._json
      // applique la table src/droit/remote.json (et décompresse).
      this._legalLoading = App.DroitLookup._json("src/droit/numbers-index.json.gz")
        .then(j => {
          const s = new Set();
          if (j && j.numbers) for (const k of Object.keys(j.numbers)) s.add(String(k).toUpperCase());
          self._legalNums = s; self._legalLoading = null;
          return s;
        })
        .catch(() => { self._legalLoading = null; self._legalNums = new Set(); return self._legalNums; });
      return this._legalLoading;
    },
    // Numéros d'article qui figurent dans la réponse. Avec lettre (L/R/D/A) toujours,
    // un nombre nu seulement si un code est nommé à proximité (sinon
    // « art. 11 » d'un règlement modificatif serait lu comme article de code).
    _citations(t) {
      const out = new Set();
      const s = String(t == null ? "" : t);
      let m;
      const re1 = /\b([LRDA])\s*\.?\s*(\d{1,4}(?:\s?-\s?\d{1,4})*)\b/g;
      while ((m = re1.exec(s))) out.add(m[1].toUpperCase() + m[2].replace(/\s+/g, "").replace(/-{2,}/g, "-"));
      const re2 = /(?:article|articles|art\.)\s*n?[°o]?\s*(\d{1,4}(?:\s?-\s?\d{1,4})*)/gi;
      while ((m = re2.exec(s))) {
        const around = s.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60).toLowerCase();
        if (!/code|civil|penal|pénal|procedure|procédure|education|éducation|ceseda|famille|administrative/.test(around)) continue;
        out.add(m[1].replace(/\s+/g, "").replace(/-{2,}/g, "-"));
      }
      return [...out];
    },
    // Le numéro figure-t-il (dans une écriture quelconque) comme mot propre dans la réponse ?
    _hasNum(answer, num) {
      const a = this._numNorm(answer), n = this._numNorm(num);
      if (!n) return false;
      let from = 0, i = a.indexOf(n, from);
      while (i !== -1) {
        if (!/[0-9]/.test(a.charAt(i + n.length))) return true;
        from = i + 1; i = a.indexOf(n, from);
      }
      return false;
    },
    _quoteOk(q, userNorm) {
      const nq = this._norm(q);
      if (nq.length < 40) return true;
      if (userNorm && userNorm.indexOf(nq) !== -1) return true;   // l'utilisateur l'a dit lui-même
      if (this._normAll.indexOf(nq) !== -1) return true;
      const ws = this._wordsArr(q);
      if (ws.length < 6) return true;
      let hit = 0;
      for (const w of ws) if (this._wordsAll.has(w)) hit++;
      return hit / ws.length >= 0.45;
    },
    // La réponse dit-elle « L'article … dispose que X » ? Alors X doit provenir du
    // texte vraiment lu. C'est exactement là que naît l'invention : aujourd'hui L131-1
    // contenait « l'instruction est obligatoire… », et elle a répondu
    // « les établissements … ouverts aux élèves handicapés ».
    // Ronde 197 : la phrase doit appartenir À CET article. Avant, on cherchait dans
    // tout le texte de la réponse la première phrase avec "dispose que" - dans une
    // réponse qui présente trois articles à la suite, cela correspondait pour CHAQUE
    // article à la phrase du premier. Résultat : L812-2 et L813-1 passaient
    // pour "pas issus du texte lu", alors qu'ils étaient cités mot pour mot,
    // et la garde faisait réécrire toute la réponse (49 s).
    _auditText(a) {
      return String(a == null ? "" : a)
        .replace(/\b([LRDA])\s*\.\s*(?=\d)/gi, "$1")
        .replace(/(\d)\s?-\s?(\d)/g, "$1-$2");
    },
    _clauseVerdict(a, rd, num) {
      const txt = String(rd.text || "");
      if (!txt) return null;
      const aa = this._auditText(a);
      const sents = aa.split(/[.!?](?=\s|\n|$)/);
      let clause = null;
      for (let i = 0; i < sents.length; i++) {
        if (!this._hasNum(sents[i], num)) continue;
        let win = sents[i] + " " + (sents[i + 1] || "");
        const m = /(?:dispose|prévoit|stipule|énonce|affirme|indique|garantit|précise)\s+que\s+([^.;!?\n]{20,500})/i.exec(win);
        if (m) { clause = m[1]; break; }
      }
      if (!clause) return null;
      const set = new Set(this._wordsArr(txt));
      const ws = this._wordsArr(clause);
      if (ws.length < 4) return null;
      let hit = 0;
      for (const w of ws) if (set.has(w)) hit++;
      const ratio = hit / ws.length;
      return { hit: hit, total: ws.length, ratio: ratio, ok: ratio >= 0.25, clause: clause.replace(/\s+/g, " ").slice(0, 90) };
    },
    async audit(answer, userText) {
      const res = { ok: true, invented: [], badQuotes: [], unread: [], summary: "" };
      if (!this._material.length) return res;
      const a = String(answer == null ? "" : answer);
      if (a.replace(/\s+/g, "").length < 30) return res;
      const userNorm = this._norm(userText);
      if (this._kinds.droit) {
        try {
          const known = await this._loadLegal();
          if (known && known.size) {
            for (const c of this._citations(a)) if (!known.has(c.toUpperCase())) res.invented.push(c);
          }
        } catch (e) {}
      }
      const qs = [];
      let m;
      const qre = /[«"“]([^»"”]{40,700})[»"”]/g;
      while ((m = qre.exec(a))) qs.push(m[1]);
      for (const q of qs.slice(0, 4)) if (!this._quoteOk(q, userNorm)) res.badQuotes.push(q.replace(/\s+/g, " ").slice(0, 90));
      // Une date qui ne figure nulle part dans le matériel est inventée (date de version,
      // loi modificative, source) - c'est exactement là que naissent les fausses « versions ».
      res.inventedDates = [];
      const ds = a.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g);
      if (ds) for (const d of [...new Set(ds)]) if (this._normAll.indexOf(this._norm(d)) === -1) res.inventedDates.push(d);
      for (const num of Object.keys(this._readArticles)) {
        const rd = this._readArticles[num];
        if (!rd.text || !this._hasNum(a, num)) continue;
        const v = this._clauseVerdict(a, rd, num);
        if (v && !v.ok) res.unread.push(num + " (« " + v.clause + " » ne figure pas dans le texte)");
      }
      // Ronde 197 : sur une question juridique pour laquelle des articles ont été lus, on ne
      // répond pas sans numéro. Sans cette obligation, elle a répondu deux fois
      // "je n'aie pas l'intégralité du texte sous les yeux pour citer un numéro
      // d'article", alors que le texte exact était dans le prompt (et la règle « tu l'as
      // lu » aussi). Mesuré : le même tour avec et sans citation.
      res.mustCite = [];
      if (this._kinds.droit) {
        const nums = Object.keys(this._readArticles).filter(n => this._readArticles[n].text);
        if (nums.length) {
          let cited = false;
          for (const n of nums) {
            const bare = n.replace(/^[LRDA]/, '');
            if (this._hasNum(a, n) || (bare !== n && this._hasNum(a, bare))) { cited = true; break; }
          }
          if (!cited) res.mustCite = nums;
        }
      }
      // Ronde 198 : si le vrai texte du document était là, la réponse ne doit pas l'
      // ignorer. Mesuré sur un vrai tour (sexologie) : la bonne, la juste
      // réponse était une paraphrase - 0,37 de ses mots de contenu figurent dans le
      // document, aucun segment de 30 caractères mot pour mot, aucun numéro de page. Une dure
      // obligation de citation l'aurait rejetée et aurait forcé un second appel au modèle (64 s),
      // qui n'aurait lui non plus rien cité mot pour mot. C'est pourquoi la
      // garde vérifie seulement si la réponse puise du tout dans le document
      // (vocabulaire commun), pas si elle cite mot pour mot. Ainsi, seule
      // la réponse qui ignore vraiment le document échoue.
      res.mustQuote = [];
      let textCorpus = false;
      for (const m of this._material) { if (m.text.indexOf("QU'IL T'A DONNE") !== -1) { textCorpus = true; break; } }
      if (textCorpus) {
        const words = this._wordsArr(a);
        let hit = 0;
        for (const w of words) if (this._wordsAll.has(w)) hit++;
        const ratio = words.length ? hit / words.length : 1;
        // Les réponses courtes (moins de 15 mots de contenu) sont trop petites pour un rapport
        // - elles ne sont pas vérifiées, sinon la garde déclencherait sans raison sur
        // une réponse brève et juste.
        const ok = words.length < 15 || ratio >= 0.20 || /\bpage\s*\d{1,3}\b/i.test(a) || this._verbatimFromMaterial(a, 30);
        if (!ok) res.mustQuote = ['texte'];
      }
      if (res.invented.length || res.badQuotes.length || res.unread.length || res.inventedDates.length || res.mustCite.length || res.mustQuote.length) {
        res.ok = false;
        const bits = [];
        if (res.invented.length) bits.push("Numéro d'article sans texte : " + res.invented.join(", "));
        if (res.unread.length) bits.push("Contenu non issu du texte lu");
        if (res.mustCite.length) bits.push("aucun article lu cité");
        if (res.mustQuote.length) bits.push("La réponse ne s'appuie pas sur le document");
        if (res.inventedDates.length) bits.push("Date sans source : " + res.inventedDates.join(", "));
        if (res.badQuotes.length) bits.push("Citation sans source : " + res.badQuotes.length);
        res.summary = bits.join(" | ");
      }
      return res;
    },
    // Un segment quelconque de n caractères de la réponse figure-t-il mot pour mot dans le corpus
    // lu ? (La même base que la réponse bicolore.)
    _verbatimFromMaterial(a, n) {
      try {
        const text = '(' + this._norm(a) + ')';
        const words = text.split(' ').filter(Boolean);
        let buf = [];
        for (let i = 0; i < words.length; i++) {
          buf.push(words[i]);
          while (buf.length > 1 && buf.join(' ').length > n) buf.shift();
          if (buf.join(' ').length >= n && this._normAll.indexOf(buf.join(' ')) !== -1) return true;
        }
        return false;
      } catch (e) { return true; }
    },
    corrective(aud) {
      const l = [];
      l.push("[CONTRÔLE DE SOURCE — RÉÉCRIS TA RÉPONSE]");
      l.push("Ta réponse vient d'être vérifiée contre ce que tu avais réellement sous les yeux, et elle contient des éléments qui n'y sont pas :");
      for (const n of aud.invented) l.push("- tu citais l'article " + n + " : cet article n'est pas dans les codes que tu as chargés, tu ne l'as pas lu.");
      for (const n of aud.unread) l.push("- ce que tu attribues à l'article " + n + " : ce n'est pas ce que dit le texte que tu as lu.");
      if (aud.mustCite && aud.mustCite.length) l.push("- ta réponse ne cite AUCUN des articles que tu as lus (" + aud.mustCite.join(", ") + "), et l'un d'eux répond pourtant à sa question : réponds en citant le numéro exact de l'article (par exemple « l'article " + aud.mustCite[0] + " du " + ((this._readArticles[aud.mustCite[0]] || {}).nom || 'code') + " ») et son texte. N'écris jamais que tu n'as pas le texte : tu l'as lu, il est ci-dessous.");
      if (aud.inventedDates && aud.inventedDates.length) l.push("- tu donnes la date " + aud.inventedDates.join(", ") + " : elle n'est dans aucune de tes sources ; n'écris une date que si elle y est.");
      if (aud.mustQuote && aud.mustQuote.length) l.push("- ta réponse ne s'appuie pas sur le document que tu as sous les yeux. Réponds à partir de LUI : reprends au moins une phrase exacte (entre guillemets) de ce texte, et nomme le document et la page. N'écris jamais que tu n'as pas le document : tu l'as, il est ci-dessous.");
      for (const q of aud.badQuotes) l.push("- ce passage entre guillemets ne vient d'aucune de tes sources : « " + q + " »");
      const reads = [];
      for (const num of Object.keys(this._readArticles)) {
        const r = this._readArticles[num];
        if (!r.text) continue;
        reads.push("- article " + num + (r.nom ? " (" + r.nom + ")" : "") + (r.env ? ", version en vigueur depuis le " + r.env : "") + " : « " + r.text.slice(0, 700) + " »" + (r.url ? " — " + r.url : ""));
      }
      if (reads.length) { l.push("Ce que tu as réellement lu, mot pour mot :"); for (const r of reads) l.push(r); }
      l.push("RÉÉCRIS maintenant la réponse en te servant UNIQUEMENT de ce qui est écrit ci-dessus ou plus haut dans tes instructions : n'écris un numéro d'article que si son texte y figure vraiment ; ne mets entre guillemets que ce qui y est écrit tel quel ; ce qui n'y est pas, dis simplement que tu ne l'as pas lu et renvoie à la source (Légifrance, VIDAL ou Studyrama selon le cas). Ne t'excuse pas, ne commente pas ce contrôle : réponds directement à la question, en français.");
      return "\n\n" + l.join("\n");
    },
    note(aud) {
      const l = [];
      for (const num of Object.keys(this._readArticles)) {
        const r = this._readArticles[num];
        if (!r.text) continue;
        l.push("- " + (r.nom ? r.nom + " — " : "") + "article " + num + (r.env ? " (version en vigueur depuis le " + r.env + ")" : "") + " : « " + r.text.slice(0, 400) + " »" + (r.url ? " — " + r.url : ""));
      }
      for (const s of this._readSheets) {
        if (!s.title) continue;
        l.push("- fiche lue en direct : " + s.title + (s.substance ? " (substance : " + s.substance + ")" : "") + (s.url ? " — " + s.url : ""));
      }
      if (!l.length) return "";
      return "---\n\n**Texte lu en direct par l'application** (pour ce point, la fiche ne suffisait pas) :\n\n" + l.join("\n");
    }
  };

  // Ronde 177 : réponse bicolore. Dans ce tour, un corpus était vraiment présent – les
  // sections des dossiers et les sources lues elle-même (Légifrance, VIDAL,
  // Studyrama). Ce qui en provient mot pour mot figure en bleu clair ; ce qui est sa propre
  // formulation reste blanc. La coloration est un pur affichage : le texte
  // ne contient jamais de balisage, seule l'étendue des mots est enregistrée (msg.sourceColor).
  // Ronde 200 : « elle doit citer les articles lois, texte de référence de cuisine
  // et autre en bleu et sa réflexion en blanc » – on compte désormais TOUT ce qui, dans
  // ce tour, se trouvait vraiment devant ses yeux : les articles du code, les sections
  // des dossiers, les fiches – et, nouveauté, aussi ce qu'elle a elle-même lu sur le web
  // (résultats de recherche, sources vérifiées, pages entières) et les ouvrages de référence du
  // métier. Avant, une réponse sur les arts de la cuisine restait toute blanche, parce qu'elle les
  // avait trouvés sur le web ; c'était exactement le reproche.
  App.SourceColor = {
    MIN_RUN: 5,        // tant de mots d'affilée doivent venir littéralement du fonds
    MIN_ANCHOR: 3,     // le plus court libellé qui compte en simple couverture
    MIN_COVER: 0.75,   // part des mots de contenu présents dans le fonds
    EXTRA_MAX: 200000, // autant de texte lu par elle-même (web, œuvres) compte
    LABEL_DB: "ses sources",
    LABEL_OWN: "sa propre formulation",
    _key: null, _mwStr: "", _mwFlat: "",
    _extra: [], _exLen: 0,

    available() {
      try {
        if (App.State && App.State.settings && App.State.settings.sourceColor === false) return false;
        const g = App.SourceGuard;
        const own = !!(g && g._material && g._material.length && g._wordsAll && g._wordsAll.size);
        return !!(own || this._exLen);
      } catch (e) { return false; }
    },
    // Ronde 200 : texte qu'elle a lu elle-même lors de ce tour (recherche web,
    // vérification des faits, texte de page, œuvres du métier). Il compte comme
    // fonds pour la coloration, mais n'entre PAS dans la garde des sources (qui
    // ne vérifie toujours que sa propre base – là on n'invente pas, ici on cite).
    reset() { this._extra = []; this._exLen = 0; this._key = null; },
    note(kind, text) {
      const t = String(text == null ? "" : text);
      if (t.length < 80 || this._exLen >= this.EXTRA_MAX) return;
      this._extra.push({ kind: kind, text: t });
      this._exLen += t.length;
      this._key = null;
    },
    _isContent(w) { return w.length >= 5 && App.SourceGuard.STOPWORDS.indexOf(w) === -1; },
    // La fiche écrit « trois ans », elle répond « 3 ans » (ou l'inverse) :
    // pour la comparaison de libellés, les mots-nombres passent en chiffres.
    NUMWORDS: { zero: "0", un: "1", une: "1", deux: "2", trois: "3", quatre: "4", cinq: "5", six: "6", sept: "7", huit: "8", neuf: "9", dix: "10", onze: "11", douze: "12", treize: "13", quatorze: "14", quinze: "15", seize: "16", vingt: "20", trente: "30", quarante: "40", cinquante: "50", soixante: "60", cent: "100", mille: "1000" },
    _cnum(w) { const n = this.NUMWORDS[w]; return n === undefined ? w : n; },
    // Le fonds dit « chaque enfant », elle répond « tous les enfants » : pour la
    // comparaison, le singulier compte (et inversement).
    _ckey(w) {
      let x = this._cnum(w);
      if (x.length > 4 && x.charAt(x.length - 1) === 's' && x.charAt(x.length - 2) !== 's') x = x.slice(0, -1);
      return x;
    },
    // Les phrases où elle parle elle-même (adressées à l'utilisateur, de sa propre
    // voix) sont sa formulation – même si les termes techniques viennent du fonds.
    // Un passage littéral qui s'y trouve devient quand même bleu clair.
    VOICE: ["je", "j", "moi", "mon", "ma", "mes", "tu", "toi", "ton", "ta", "tes", "nous", "vous", "notre", "nos", "votre", "vos", "voici", "voila", "disons", "imagine", "imaginons", "prenons", "voyons", "essaie", "essayez", "essayons", "regarde", "souviens", "veux", "peux"],
    _hasVoice(ws) { for (const w of ws) if (this.VOICE.indexOf(w) !== -1) return true; return false; },
    // Découpe un texte en mots : `words` est la normalisation (comme dans la garde
    // des sources), `keys` la même chaîne avec des chiffres au lieu des mots-nombres
    // (pour la comparaison de libellés), `offs` retient où se trouve chaque mot.
    tokens(str) {
      const s = String(str == null ? "" : str);
      const words = [], keys = [], offs = [];
      const re = /[0-9A-Za-z\u00c0-\u024f]+/g;
      let m;
      while ((m = re.exec(s))) {
        const w = App.SourceGuard._norm(m[0]);
        if (!w) continue;
        words.push(w); keys.push(this._ckey(w)); offs.push([m.index, m.index + m[0].length]);
      }
      return { words: words, keys: keys, offs: offs };
    },
    // Phrases du texte brut (ponctuation et retours à la ligne séparent).
    sentences(str) {
      const s = String(str == null ? "" : str);
      const out = [];
      const re = /[.!?;\u2026]+[\s"'«»)\]]*|\n+/g;
      let start = 0, m;
      while ((m = re.exec(s))) {
        if (m.index > start) out.push([start, m.index]);
        start = m.index + m[0].length;
      }
      if (start < s.length) out.push([start, s.length]);
      return out;
    },
    // Le fonds de ce tour comme une chaîne de mots – les libellés littéraux s'y
    // trouvent avec indexOf (mots entiers, grâce aux espaces).
    // Ronde 200 : s'y ajoute le texte qu'elle a lu elle-même (App.SourceColor.note).
    _bestand() {
      const g = App.SourceGuard;
      const key = String((g._normAll || "").length) + ":" + g._material.length + ":" + this._exLen;
      if (this._key !== key) {
        const raw = String(g._normAll || "").split(" ");
        for (const e of this._extra) {
          const parts = App.SourceGuard._norm(e.text).split(" ");
          for (let i = 0; i < parts.length; i++) if (parts[i]) raw.push(parts[i]);
        }
        const set = new Set();
        for (let i = 0; i < raw.length; i++) {
          const w = raw[i];
          if (w && this._isContent(w)) set.add(this._ckey(w));
          raw[i] = this._ckey(w);
        }
        this._key = key; this._mwStr = " " + raw.join(" ") + " "; this._mset = set;
        this._mwFlat = this._mwStr.replace(/ /g, "");
      }
      return this._mwStr;
    },
    // Cet identifiant (numéro d'article, norme) est-il vraiment dans le fonds ?
    // « 16 282 » et « 16282 » comptent comme le même identifiant.
    _hasIdent(id) {
      const s = App.SourceGuard._norm(id);
      if (!s) return false;
      this._bestand();
      if (this._mwStr.indexOf(" " + s + " ") !== -1) return true;
      const f = s.replace(/ /g, "");
      return f.length >= 3 && this._mwFlat.indexOf(f) !== -1;
    },
    // Ses phrases d'opinion : un numéro d'article ne les transforme pas en fonds.
    OPINION: /\b(?:je pense|je crois|je trouve|a mon avis|selon moi|d'apres moi|pour moi|a ta place|je te conseille|je vous conseille|tu devrais|vous devriez|il faudrait|je prefere|j'aimerais|je recommande|note que|retiens que)\b/,
    // Une phrase contenant un identifiant présent dans le fonds (article, norme,
    // page) est une ligne de citation – elle nomme la source et doit être bleu clair.
    // Ronde 200 : si elle contient un long « … » que le fonds NE connaît pas, ce
    // n'est pas une ligne de citation – un libellé inventé ne doit pas paraître bleu.
    _bogusQuote(seg) {
      const re = /[«"\u201c]([^»"\u201d]{12,})(?:[»"\u201d]|$)/g;
      const s = String(seg == null ? "" : seg);
      let m;
      while ((m = re.exec(s))) {
        const tk = this.tokens(m[1]);
        let nc = 0;
        for (const w of tk.words) if (this._isContent(w)) nc++;
        if (nc >= 4 && !this.runs(tk.words, tk.keys, 4).length) return true;
      }
      return false;
    },
    _citesId(seg) {
      try {
        const s = String(seg == null ? "" : seg);
        const n = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u2019/g, "'").toLowerCase();
        if (!/[0-9]/.test(n)) return false;
        if (this.OPINION.test(n)) return false;
        if (this._bogusQuote(s)) return false;
        const re = /(?:articles?|art)\s*\.?\s*(?:n[°o]\s*)?([lrd]?\s*\.?\s*\d{1,4}(?:\s*[-\u2013]\s*\d{1,3})?)|(?:\b(?:nf|en|iso|iec|din|astm|une|bs)\b[^0-9\n]{0,8}(\d[\d\s.\u2013-]{0,14}\d))/g;
        let m;
        while ((m = re.exec(n))) {
          const id = (m[1] || m[2] || "").trim();
          if (id && this._hasIdent(id)) return true;
        }
        return false;
      } catch (e) { return false; }
    },
    // Tous les libellés à partir de minLen mots présents littéralement dans le fonds.
    runs(ws, ks, minLen) {
      const out = [];
      if (!ws || !ws.length) return out;
      const hay = this._bestand();
      if (!hay || hay.length < 4) return out;
      let i = 0;
      while (i + minLen <= ws.length) {
        // Les ancres sont des mots de contenu et des nombres (les nombres figurent dans tout texte de loi).
        if (!this._isContent(ws[i]) && !/^[0-9]+$/.test(ks[i])) { i++; continue; }
        const max = Math.min(ws.length, i + 48);
        let k = minLen, best = 0;
        while (i + k <= max) {
          const frag = " " + ks.slice(i, i + k).join(" ") + " ";
          if (hay.indexOf(frag) === -1) break;
          best = k; k++;
        }
        if (best >= minLen) { out.push([i, i + best]); i += best; }
        else i++;
      }
      return out;
    },
    // Cette phrase appartient-elle au fonds ou à elle ?
    classify(ws, ks, voice, cite, opinion, num) {
      this._bestand();
      const long = this.runs(ws, ks, this.MIN_RUN);
      const set = this._mset || new Set();
      let n = 0, hit = 0;
      for (let i = 0; i < ws.length; i++) {
        if (!this._isContent(ws[i])) continue;
        n++;
        if (set.has(ks[i])) hit++;
      }
      const cover = n ? hit / n : 0;
      let inRuns = 0;
      for (const r of long) inRuns += r[1] - r[0];
      if (inRuns / ws.length >= 0.4) return { all: true, runs: long };
      // Les phrases courtes entièrement bâties avec la langue technique du fonds
      // sont presque toujours du fonds (une définition, une dose) : même sans libellé.
      if (n >= 3 && n <= 6 && cover >= 0.9 && !voice && !opinion) return { all: true, runs: long };
      // Ronde 200 : la reproduction à forte couverture vaut aussi dans sa voix.
      // « Vous pouvez réclamer un passage sur les fonds voisins » EST le texte de loi
      // (seul le « vous » est le sien) – l'utilisateur veut exactement cela en bleu.
      // Ses phrases d'opinion (OPINION) restent blanches ; qui exprime une opinion le dit.
      if (n >= 3 && cover >= this.MIN_COVER && !opinion && this.runs(ws, ks, this.MIN_ANCHOR).length) return { all: true, runs: long };
      if (n >= 8 && cover >= 0.92 && !opinion) return { all: true, runs: long };
      // Presque chaque mot de contenu vient du fonds (≥ 6 mots, ≥ 85 %) : la phrase
      // est une reproduction du texte, même si aucun passage n'est littéral.
      if (n >= 6 && cover >= 0.85 && !opinion) return { all: true, runs: long };
      // Reproduction plus longue avec trois quarts de couverture : même cas, juste plus long.
      if (n >= 8 && cover >= 0.75 && !opinion) return { all: true, runs: long };
      // Une phrase qui cite explicitement la source (numéro d'article, norme, « … »,
      // selon/d'après/aux termes de, « le texte », « la loi », « le document ») est
      // du fonds dès que son vocabulaire vient pour moitié du fonds.
      if (cite && !opinion && n >= 3 && (cover >= this.MIN_COVER || (cover >= 0.5 && this.runs(ws, ks, this.MIN_ANCHOR).length))) {
        return { all: true, runs: long };
      }
      // Un nombre à plusieurs chiffres venu du fonds (délai, dose, mesure) plus une
      // demi-couverture du vocabulaire : une donnée reprise, pas une réflexion propre.
      if (num && !opinion && n >= 5 && cover >= 0.5) return { all: true, runs: long };
      return { all: false, runs: long };
    },
    // Étendues de mots (dans le texte brut) qui proviennent du fonds.
    mask(text) {
      const t = String(text == null ? "" : text);
      const out = [];
      if (!t || !this.available()) return out;
      this._key = null;   // relire à neuf le fonds du tour en cours
      const sents = this.sentences(t);
      let gi = 0;
      for (const s of sents) {
        const seg = t.slice(s[0], s[1]);
        const tk = this.tokens(seg);
        const ws = tk.words;
        if (!ws.length) continue;
        const voice = this._hasVoice(ws) || /\?/.test(seg);
        const norm = String(seg).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u2019/g, "'").toLowerCase();
        const opinion = this.OPINION.test(norm);
        const ident = this._citesId(seg);
        const cite = ident || /[«\u201c"]/.test(seg)
          || /(?:selon|d'apres|aux termes|dispose|disposent|prevoit|prevoient|enonce|stipule|stipulent|le texte|la loi|le document)\b/.test(norm);
        let num = false;
        for (let q = 0; q < tk.keys.length; q++) {
          const k = tk.keys[q];
          if (/^[0-9]{2,4}$/.test(k) && this._hasIdent(k)) { num = true; break; }
        }
        // Ronde 200 : la ligne de citation à identifiant réel est entièrement du fonds.
        if (ident && !opinion && ws.length >= 2) out.push([gi, gi + ws.length]);
        else {
          const v = (ws.length >= 2) ? this.classify(ws, tk.keys, voice, cite, opinion, num) : { all: false, runs: [] };
          if (v.all) out.push([gi, gi + ws.length]);
          else for (const r of v.runs) out.push([gi + r[0], gi + r[1]]);
        }
        gi += ws.length;
      }
      return this._merge(out, gi);
    },
    _merge(list, max) {
      const a = list.filter(r => r[1] > r[0] && r[0] < max)
        .map(r => [Math.max(0, r[0]), Math.min(max, r[1])])
        .sort((x, y) => x[0] - y[0]);
      const out = [];
      for (const r of a) {
        const last = out[out.length - 1];
        if (last && r[0] <= last[1]) { if (r[1] > last[1]) last[1] = r[1]; }
        else out.push([r[0], r[1]]);
      }
      return out;
    },
    // Colore une réponse rendue. `ranges` sont les étendues de mots mémorisées ;
    // si elles manquent, elles sont calculées à partir du fonds de ce tour. Renvoie
    // les étendues réellement colorées (vide = rien de coloré).
    paint(el, text, ranges) {
      if (!el) return [];
      let marks = (ranges && ranges.length) ? ranges : this.mask(String(text == null ? "" : text));
      if (!marks || !marks.length) return [];
      let ok = false;
      try { ok = this._apply(el, String(text == null ? "" : text), marks); }
      catch (e) { console.warn('[SourceColor] colorisation échouée :', e); ok = false; }
      if (!ok) return [];
      el.classList.add('srcColored');
      return marks;
    },
    decorate(el, text, ranges) {
      const marks = this.paint(el, text, ranges);
      return (marks && marks.length) ? this.legend() : null;
    },
    legend() {
      const d = document.createElement('div');
      d.className = 'srcLegend';
      d.innerHTML = '<i></i><span>' + this.LABEL_DB + '</span><span class="sep">·</span><i class="own"></i><span>' + this.LABEL_OWN + '</span>';
      return d;
    },
    // Chaîne de texte de l'élément rendu, avec les nœuds dont elle provient.
    _collect(el) {
      const nodes = [];
      let full = "";
      const SKIP = { PRE: 1, CODE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, BUTTON: 1, SVG: 1, img: 1 };
      const SKIPCLS = ['srcLegend', 'codeBlockWrapper', 'mathSheet'];
      const walk = (n) => {
        for (let c = n.firstChild; c; c = c.nextSibling) {
          if (c.nodeType === 3) {
            const s = c.nodeValue || "";
            if (s) { nodes.push({ node: c, from: full.length, to: full.length + s.length }); full += s; }
          } else if (c.nodeType === 1) {
            if (SKIP[c.tagName]) continue;
            let skip = false;
            if (c.classList) for (const k of SKIPCLS) if (c.classList.contains(k)) { skip = true; break; }
            if (skip) continue;
            if (c.tagName === "BR") { full += " "; continue; }
            walk(c);
          }
        }
      };
      walk(el);
      return { full: full, nodes: nodes };
    },
    // Associe à chaque mot du DOM le mot brut correspondant (Markdown retire
    // par ex. les puces numérotées, LaTeX est réécrit avant le rendu).
    _align(raw, dom) {
      const map = new Array(dom.length).fill(-1);
      let r = 0;
      for (let d = 0; d < dom.length; d++) {
        const w = dom[d];
        if (r < raw.length && raw[r] === w) { map[d] = r; r++; continue; }
        const lim = Math.min(raw.length, r + 80);
        let hit = -1;
        for (let k = r + 1; k < lim; k++) { if (raw[k] === w) { hit = k; break; } }
        if (hit !== -1) { r = hit + 1; map[d] = hit; }
      }
      return map;
    },
    _apply(el, text, ranges) {
      const src = this._collect(el);
      if (!src || !src.full) return false;
      const dom = this.tokens(src.full);
      if (!dom.words.length) return false;
      const raw = this.tokens(text).keys;
      const map = this._align(raw, dom.keys);
      const blue = new Array(dom.words.length).fill(false);
      let any = false;
      for (let d = 0; d < dom.words.length; d++) {
        const r = map[d];
        if (r < 0) continue;
        for (let q = 0; q < ranges.length; q++) {
          const rg = ranges[q];
          if (rg[0] > r) break;
          if (r >= rg[0] && r < rg[1]) { blue[d] = true; any = true; break; }
        }
      }
      if (!any) return false;
      const buckets = new Map();
      let ni = 0;
      for (let d = 0; d < dom.words.length; d++) {
        const at = dom.offs[d][0];
        while (ni < src.nodes.length - 1 && at >= src.nodes[ni].to) ni++;
        const info = src.nodes[ni];
        if (!info || at < info.from || at >= info.to) continue;
        let arr = buckets.get(info);
        if (!arr) { arr = []; buckets.set(info, arr); }
        arr.push({ from: dom.offs[d][0], to: dom.offs[d][1], blue: blue[d] });
      }
      let done = 0;
      for (const [info, toks] of buckets) done += this._rebuild(info, toks) ? 1 : 0;
      return done > 0;
    },
    // Découper un nœud de texte en morceaux blancs / bleu clair.
    _rebuild(info, toks) {
      const node = info.node;
      const s = node.nodeValue || "";
      if (!s || !toks || !toks.length) return false;
      const pieces = [];
      let pos = 0;
      for (let k = 0; k < toks.length; k++) {
        const l0 = Math.max(0, toks[k].from - info.from);
        const l1 = Math.min(s.length, toks[k].to - info.from);
        const next = (k + 1 < toks.length) ? Math.min(s.length, toks[k + 1].from - info.from) : s.length;
        if (l1 <= l0) continue;
        if (l0 > pos) pieces.push([pos, l0, toks[k].blue]);
        pieces.push([l0, l1, toks[k].blue]);
        if (next > l1) pieces.push([l1, next, toks[k].blue]);
        if (next > pos) pos = next;
      }
      if (!pieces.length) return false;
      if (pos < s.length) pieces.push([pos, s.length, pieces[pieces.length - 1][2]]);
      const merged = [];
      for (const p of pieces) {
        const last = merged[merged.length - 1];
        if (last && last[1] === p[0] && last[2] === p[2]) last[1] = p[1];
        else merged.push([p[0], p[1], p[2]]);
      }
      if (merged.length === 1 && !merged[0][2]) return false;
      const frag = document.createDocumentFragment();
      for (const p of merged) {
        const chunk = s.slice(p[0], p[1]);
        if (!chunk) continue;
        if (p[2]) { const sp = document.createElement('span'); sp.className = 'srcDb'; sp.textContent = chunk; frag.appendChild(sp); }
        else frag.appendChild(document.createTextNode(chunk));
      }
      node.parentNode.replaceChild(frag, node);
      return true;
    }
  };

  // ---- Ronde 286 : TF-IDF — classer par RESSEMBLANCE, pas par ordre d'arrivée ----------------
  // Le 25 septembre 2026 le propriétaire a envoyé un article — « Créer un moteur de recherche
  // simple à l'aide de Python » (similarité cosinus + matrice terme-document pondérée TF-IDF) —
  // avec un simple « est-ce que ça peut t'aider ». Il ne s'agissait pas de faire indexer une
  // collection de documents : c'est le COEUR de l'article qui manquait ici. Il était parti de sa
  // question « retenue gav étranger » : la carte rendait quatre pages peu précises, puis la fiche
  // service-public qui répondait vraiment (la retenue pour vérification du droit au séjour), puis
  // TROIS pages de fiscalité des non-résidents que le seul mot « étranger » avait attirées — et
  // Sofia concluait que la notion n'existait pas. Les moteurs rendent une LISTE ; personne ne la
  // classait. L'article fait exactement cela, en quatre étapes :
  //   1. nettoyer (minuscules, accents repliés, ponctuation ôtée) ;
  //   2. matrice terme-document : tf = log(1 + fréquence), idf = log((N+1)/(df+1)) + 1 ;
  //   3. la question devient un vecteur dans la même matrice ;
  //   4. similarité cosinus entre la question et chaque document.
  // Trois ajouts, parce qu'ici on ne classe pas des articles mais des PAGES WEB :
  //   • le TITRE compte double (un mot de la question dans le titre vaut bien plus qu'un mot noyé
  //     dans un extrait) ;
  //   • la COUVERTURE (part des mots de la question réellement présents) est mesurée à part : un
  //     long texte administratif partage toujours un mot banal avec n'importe quelle question ;
  //   • les formes d'un même mot que le radical simple ne rapproche pas sont rapprochées
  //     explicitement (SAME) : mesuré, ce réducteur-ci sépare « retenue » (→ retenu) de
  //     « rétention »/« retenir » (→ reten), et il ne voyait donc pas que la page sur la retenue
  //     d'un étranger et l'article de loi qui la décrit parlaient de la même chose.
  App.Tfidf = {
    STOP: ("le la les un une des du de d au aux a et ou ni car donc or mais que qui quoi dont en dans par pour sur sous avec sans vers chez est sont etre avoir fait faire plus moins tout tous toute toutes ce cet cette ces son sa ses leur leurs il elle ils elles nous vous je tu on se ne pas comme aussi si alors quand comment pourquoi quel quelle quels quelles bien tres peut pouvoir doit devoir meme encore deja depuis entre apres avant selon lors the of and or to in on for with an is are was were be been this that these those it its as at by from not no do does did how what why which who when where can could should would may might").split(/\s+/),
    // Les mots d'un sigle. Quand quelqu'un écrit « gav », il parle de la garde à vue.
    BRIDGE: { gav: ["garde", "vue"] },
    // Les formes d'un même mot que le radical ci-dessous ne rapproche pas, formes MESURÉES comme
    // manquantes. Table courte et explicite : on n'y met que ce qui a réellement échoué.
    SAME: {
      retenir: "reten", retenu: "reten", retenue: "reten", retenues: "reten", retenus: "reten",
      retention: "reten", retentions: "reten", retenons: "reten", retenez: "reten",
      detenir: "deten", detenu: "deten", detenue: "deten", detention: "deten",
      circuler: "circul", circulation: "circul", circulant: "circul",
      sejourner: "sejour", sejourne: "sejour", sejournant: "sejour",
      etrangers: "etranger", etrangere: "etranger", etrangeres: "etranger"
    },
    _fold(s) {
      return String(s == null ? "" : s).toLowerCase()
        .replace(/[àâäáãå]/g, "a").replace(/[éèêë]/g, "e").replace(/[îïíì]/g, "i")
        .replace(/[ôöóòõ]/g, "o").replace(/[ûüúù]/g, "u").replace(/[ç]/g, "c")
        .replace(/[ñ]/g, "n").replace(/[’']/g, " ");
    },
    // « retenues » et « retenue » sont le même mot ; « gav » et « l813 » restent intacts (un sigle
    // et un numéro d'article sont des mots de la question, pas du bruit).
    _stem(t) {
      if (this.SAME[t]) return this.SAME[t];
      let s = t;
      if (s.length >= 6) s = s.replace(/(ements|ement|ations|ation|tions|tion|ances|ance|ences|ence|ieres|iere|iers|euses|euse|es|s|x|e)$/, "");
      else if (s.length >= 5) s = s.replace(/(es|s|x|e)$/, "");
      return s.length >= 3 ? s : t;
    },
    _tokens(s) {
      let out = [], parts = this._tokenList(s);
      for (const t of parts) if (out.indexOf(t) === -1) out.push(t);
      return out;
    },
    // Mêmes règles, mais DANS L'ORDRE et sans doublon supprimé : c'est ce qu'il faut pour voir
    // les mots qui se suivent.
    _tokenList(s) {
      let out = [], parts = this._fold(s).replace(/[^a-z0-9]+/g, " ").split(/\s+/);
      for (const p of parts) {
        if (!p || p.length < 3) continue;
        if (this.STOP.indexOf(p) !== -1) continue;
        let t = this._stem(p);
        if (t && t.length >= 3) out.push(t);
      }
      return out;
    },
    // Les mots qui SE SUIVENT (« amende forfaitaire », « droit séjour », « garde vue ») deviennent
    // un terme à part entière de la matrice : « amende~forfaitaire ». C'est la formulation exacte
    // de l'article — un terme de fréquence rare, donc lourd — et c'est la seule chose qui
    // distingue un article sur l'amende forfaitaire d'un article qui parle d'amende ET, ailleurs,
    // de forfait. Aucun réglage à la main : c'est l'idf qui décide si le voisinage est rare.
    _shingles(list) {
      let out = [];
      for (let i = 0; i + 1 < list.length; i++) out.push(list[i] + "~" + list[i + 1]);
      return out;
    },
    _cos(a, b) {
      let dot = 0, na = 0, nb = 0;
      for (const t in a) { na += a[t] * a[t]; if (b[t]) dot += a[t] * b[t]; }
      for (const t in b) nb += b[t] * b[t];
      return (na && nb) ? dot / Math.sqrt(na * nb) : 0;
    },
    // Construire la matrice : le vocabulaire, la fréquence, la rareté, le vecteur de la question.
    _index(query, docs, opts) {
      opts = opts || {};
      let textOf = opts.text || ((d) => [d.title, d.snippet, d.desc, d.summary, d.text].filter(Boolean).join(". "));
      let titleOf = opts.title || ((d) => String(d.title || ""));
      let terms = this._tokens(query);
      if (!terms.length || !docs.length) return null;
      let bridge = Object.create(null);
      for (const t of terms) { let b = this.BRIDGE[t]; if (b) for (const w of b) bridge[w] = 0.5; }
      let N = docs.length, df = Object.create(null);
      let body = [], titles = [], bodyList = [], titleList = [];
      for (const d of docs) {
        let bl, tl;
        try { bl = this._tokenList(textOf(d)); } catch (e) { bl = []; }
        try { tl = this._tokenList(titleOf(d)); } catch (e) { tl = []; }
        bodyList.push(bl); titleList.push(tl);
        let bt = [], seenB = Object.create(null);
        for (const t of bl) if (!seenB[t]) { seenB[t] = 1; bt.push(t); }
        let tt = [], seenT = Object.create(null);
        for (const t of tl) if (!seenT[t]) { seenT[t] = 1; tt.push(t); }
        body.push(bt); titles.push(tt);
        let seen = Object.create(null);
        for (const t of bt.concat(tt, tt, this._shingles(bl), this._shingles(tl))) if (!seen[t]) { seen[t] = 1; df[t] = (df[t] || 0) + 1; }
      }
      let idfOf = (t) => Math.log((N + 1) / ((df[t] || 0) + 1)) + 1;
      let vecOf = (toks, extra) => {
        let tf = Object.create(null);
        for (const t of toks) tf[t] = (tf[t] || 0) + 1;
        if (extra) for (const t in extra) tf[t] = (tf[t] || 0) + extra[t];
        let v = Object.create(null);
        for (const t in tf) v[t] = Math.log(1 + tf[t]) * idfOf(t);
        return v;
      };
      let seen = [], titleSeen = [];
      for (let k = 0; k < docs.length; k++) {
        let sd = Object.create(null), st = Object.create(null);
        for (const t of body[k]) sd[t] = 1;
        for (const t of titles[k]) { sd[t] = 1; st[t] = 1; }
        seen.push(sd); titleSeen.push(st);
      }
      // Les groupes de mots de la question, mais seulement ceux qui existent vraiment dans la
      // liste : un voisinage que personne ne porte ne peut rien distinguer et ne ferait
      // qu'alourdir la question (donc baisser toutes les ressemblances sans rien départager).
      let q = vecOf(terms, bridge);
      for (const g of this._shingles(this._tokenList(query))) if (df[g]) q[g] = (q[g] || 0) + Math.log(2) * idfOf(g);
      return {
        terms, bridge, seen, titleSeen, q,
        vecs: bodyList.map((bl, k) => vecOf(bl.concat(titleList[k], titleList[k], this._shingles(bl), this._shingles(titleList[k]))))
      };
    },
    // Classer des documents contre une question. Rend [{doc, i, score, cover, title, fit}].
    rank(query, docs, opts) {
      docs = docs || [];
      let ix = null;
      try { ix = this._index(query, docs, opts || {}); } catch (e) { ix = null; console.warn("[Tfidf] index échoué", e && e.message); }
      let out = docs.map((d, k) => ({ doc: d, i: k, score: 0, cover: 0, title: 0, fit: 0 }));
      if (!ix) return out;
      let terms = ix.terms;
      for (let k = 0; k < docs.length; k++) {
        let sc = this._cos(ix.q, ix.vecs[k]);
        let direct = 0, have = 0, nt = 0;
        for (const t of terms) {
          if (ix.seen[k][t]) { direct++; have++; } else { let b = ix.bridge[t]; if (b && b.some((w) => ix.seen[k][w])) have += 0.5; }
          if (ix.titleSeen[k][t]) nt++;
        }
        // La couverture : deux mots de la question sur trois valent mieux qu'un seul mot répété
        // dix fois. Et un mot de la question DANS LE TITRE vaut mieux qu'un mot dans le corps.
        let cover = Math.min(1, direct / terms.length);
        let cover2 = Math.min(1, have / terms.length);
        let tcover = nt / terms.length;
        out[k].score = sc; out[k].cover = cover; out[k].cover2 = cover2; out[k].title = tcover;
        out[k].fit = sc * (0.35 + 0.65 * cover2) * (0.85 + 0.15 * tcover);
      }
      out.sort((a, b) => (b.fit - a.fit) || (b.cover2 - a.cover2) || (a.i - b.i));
      return out;
    },
    // La fin de la liste est presque toujours du bruit : les moteurs la complètent avec des pages
    // qui partagent un mot banal (« étranger » avait attiré la fiscalité des non-résidents). On
    // coupe ce qui est manifestement hors sujet — mais seulement s'il reste de quoi répondre.
    prune(ranked, opts) {
      opts = opts || {};
      let list = (ranked || []).slice();
      let min = Math.max(2, opts.min || 3);
      if (list.length <= min) return list;
      let best = list[0].cover2 || 0;
      if (!best) return list;
      let keep = opts.coverRatio != null ? opts.coverRatio : 0.5;
      let kept = list.filter((r) => (r.cover2 || 0) >= best * keep);
      return kept.length >= min ? kept : list.slice(0, min);
    },
    // Réordonner une liste d'objets (résultats web, articles) et inscrire sur chacun sa
    // ressemblance (fit, score, cover) — la carte et le prompt peuvent alors le dire honnêtement.
    rerank(query, rows, opts) {
      opts = opts || {};
      let ranked = this.rank(query, rows, opts);
      let list = opts.prune === false ? ranked : this.prune(ranked, opts);
      return list.map((r) => {
        r.doc.fit = Math.round(r.fit * 1000) / 1000;
        r.doc.score = Math.round(r.score * 1000) / 1000;
        r.doc.cover = Math.round(r.cover2 * 100) / 100;
        return r.doc;
      });
    }
  };

  App.WebExtra = {
    READER: "https://r.jina.ai/",
    GT: "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t",
    TIMEOUT_MS: 9000,   // le lecteur récupère et rend la page ; 3 s sont la norme
    TTL_MS: 600000,     // comme le cache de recherche dans src/websearch.js
    ROWS: 4,            // un moteur d'appoint fournit au plus autant de lignes
    engines: [],
    _cache: new Map(),
    _off: {},           // moteur → instant jusqu'auquel il se tait (voir OFF_MS)
    OFF_MS: 600000,     // dix minutes de silence après une réponse vide ou bloquée
    EXTRA_DEADLINE_MS: 6500,   // on n'attend pas un moteur d'appoint plus longtemps que cela
    register(e) { this.engines.push(e); return this; },
    _host(u) { try { return new URL(u).host.replace(/^www\./i, ""); } catch (e) { return ""; } },
    _dec(s) {
      return String(s == null ? "" : s)
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"").replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&#(x?[0-9a-f]+);/gi, (m, d) => {
          try { return String.fromCodePoint(parseInt(d.replace(/^x/i, ""), /^x/i.test(d) ? 16 : 10)); } catch (e) { return m; }
        });
    },
    _text(html) { return this._dec(String(html == null ? "" : html).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim(); },
    _hangul(s) { return /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(String(s == null ? "" : s)); },
    // Langue de la question (pour la rétro-traduction) : le détecteur de langue du
    // projet, sinon la langue de l'interface, sinon le français (ainsi écrit l'utilisateur).
    _lang(q) {
      try {
        let LD = App.Plugins && App.Plugins.languageDetector;
        if (LD && typeof LD._runSync === "function") {
          let d = LD._runSync(q);
          if (d && d.code && d.isReliable) return String(d.code).slice(0, 2);
        }
      } catch (e) {}
      try {
        let l = String((App.State && App.State.settings && App.State.settings.language) || "").toLowerCase().slice(0, 2);
        if (l.length === 2 && /^[a-z]{2}$/.test(l)) return l;
      } catch (e) {}
      return "fr";
    },
    // Traduire sans clé (le point d'accès public gtx de Google ; l'interface l'utilise
    // aussi). Chaque texte part dans une requête propre et parallèle – c'est plus rapide
    // qu'une requête groupée et une panne n'en fait tomber qu'une, pas tout.
    async _gt(texts, tl, sl) {
      let guard = (ms) => new Promise((r) => setTimeout(() => r(""), ms));
      return await Promise.all(texts.map(async (t) => {
        let s = String(t == null ? "" : t).trim();
        if (!s) return "";
        try {
          let u = this.GT + "&sl=" + (sl || "auto") + "&tl=" + tl + "&q=" + encodeURIComponent(s.slice(0, 1500));
          let txt = await Promise.race([fetch(u).then((r) => r.text()).catch(() => ""), guard(6000)]);
          if (!txt) return "";
          let j = JSON.parse(txt);
          return ((j && j[0]) || []).map((x) => (x && x[0]) || "").join("") || "";
        } catch (e) { return ""; }
      }));
    },
    // D'abord en direct (les cibles autorisent CORS – cela n'utilise pas de proxy),
    // sinon via le proxy Perchance. Les deux sous le même délai.
    async _fetchText(url, init) {
      let guard = () => new Promise((r) => setTimeout(() => r(""), this.TIMEOUT_MS));
      let t = "";
      try { t = await Promise.race([fetch(url, init).then((r) => r.text()).catch(() => ""), guard()]); } catch (e) { t = ""; }
      if (!t) { try { t = await Promise.race([App.Core.proxyFetch(url, init).then((r) => r.text()).catch(() => ""), guard()]); } catch (e) { t = ""; } }
      return t;
    },
    // Sous charge, le lecteur renvoie parfois la page brute au lieu du texte rendu
    // (on y trouve alors du CSS au lieu de résultats). On attend brièvement et on
    // relit avec un marqueur de cache ; seul un texte avec « Markdown Content: »
    // compte comme réponse.
    async _readRendered(url) {
      if (!url || typeof url !== "string") return "";
      let body = "";
      for (let i = 0; i < 3; i++) {
        let u = i ? url + (url.indexOf("?") === -1 ? "?" : "&") + "_=" + Date.now() + i : url;
        let got = await this._fetchText(u);
        if (got && typeof got === "string" && got.indexOf("Markdown Content:") !== -1) return got;
        if (got) body = got;
        await new Promise((r) => setTimeout(r, 800 + i * 900));
      }
      return body;
    },
    // ---- Lukol (Google) : le texte du lecteur en Markdown -------------------
    // Par résultat une ligne d'URL pure, en dessous l'adresse visible (« host › chemin »)
    // et l'extrait. Google répète chaque résultat une fois (la seconde avec une
    // vignette) – l'URL en double élimine cela. Le titre doit être reconstruit, car
    // dans le texte du lecteur le lien du résultat porte l'URL comme texte : d'abord
    // le mot du titre mis en gras par Google dans l'extrait, sinon le dernier segment
    // de l'adresse visible, et si ce n'est qu'un mot, une simple adresse ou une date,
    // le début de l'extrait.
    _parseReader(md, want) {
      let lines = String(md == null ? "" : md).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let isUrl = (l) => /^https?:\/\/\S+$/.test(l);
      let isImg = (l) => /^\[!\[/.test(l);
      let isHost = (l) => /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(l);
      let out = [], seen = new Set();
      for (let i = 0; i < lines.length; i++) {
        if (!isUrl(lines[i])) continue;
        let url = lines[i].replace(/\*\*/g, "");
        if (/^https?:\/\/(?:www\.)?lukol\.com\//i.test(url)) continue;
        let key = url.replace(/[#?].*$/, "").replace(/\/+$/, "").toLowerCase();
        let host = this._host(url);
        if (!host || seen.has(key)) continue;
        let crumb = "", snippet = "";
        for (let j = i + 1; j < lines.length; j++) {
          let x = lines[j];
          if (isUrl(x) || isHost(x)) break;                       // résultat suivant
          if (isImg(x) || /^\d+$/.test(x)) continue;
          if (/^(?:file\s*format|format\s+de\s+fichier|formato\s+de\s+archivo)\b/i.test(x)) continue;
          if (/^(?:about|environ)\b.{0,40}\bresults?\b/i.test(x)) continue;
          if (x.indexOf("›") !== -1 && !crumb) { crumb = x; continue; }
          if (!snippet) snippet = x;
        }
        if (!crumb && !snippet) continue;
        seen.add(key);
        let title = "";
        let bold = snippet.match(/^\*\*([^*]{2,90})\*\*/);
        if (bold && !/^\d/.test(bold[1]) && !/\b(?:19|20)\d{2}\b/.test(bold[1])) title = bold[1];
        if (!title && crumb) {
          let seg = crumb.split("›").map((s) => s.trim()).filter(Boolean);
          let last = seg.length ? seg[seg.length - 1] : "";
          title = (last && !/^(?:watch|view|index|home|accueil|startseite|inicio)$/i.test(last)) ? last : crumb;
        }
        title = title.replace(/(?:\.\.\.|…)+\s*$/, "").trim();     // le CSE abrège ici avec « … »
        let dateish = /^(?:\d{1,2}\s+\w{3,9}|\w{3,9}\s+\d{1,2})\s*,?\s*\d{4}$/i.test(title);
        if (snippet && (title.length < 4 || title.indexOf(" ") === -1 || dateish || title.toLowerCase().replace(/^www\./, "") === host)) {
          let open = snippet.replace(/\*\*/g, "").replace(/^(?:\d{1,2}\s+\w{3,9}|\w{3,9}\s+\d{1,2})\s*,?\s*\d{4}\s*(?:\.{2,}|…)\s*/, "").trim();
          let cut = open.search(/\.{2,}|:|\. |;|\?|!/);
          if (cut < 8 || cut > 60) { let c2 = open.search(/[,;]|\s[—–]\s/); if (c2 >= 8 && c2 <= 60) cut = c2; }
          let cand = (cut >= 8 ? open.slice(0, Math.min(cut, 60)) : open.slice(0, 60)).replace(/\s+\S*$/, "").trim();
          if (cand.length > title.length) title = cand;
        }
        out.push({
          title: String(title || host).replace(/\*\*/g, "").replace(/_+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
          url: url,
          host: host,
          display: crumb.slice(0, 160),
          snippet: snippet.replace(/\*\*/g, "").replace(/\s+/g, " ").trim().slice(0, 400),
          engine: ""
        });
        if (out.length >= Math.max(want, 8)) break;
      }
      return out;
    },
    // ---- DuckDuckGo Lite : les vraies pages de résultats de DuckDuckGo --------
    // L'API historique est morte (« DuckDuckGo » reste donc éteint dans src/websearch.js) et
    // html.duckduckgo.com répond 202 avec sa page anti-robot (anomaly.js). Le point d'accès
    // « lite » — du HTML pur, sans JavaScript — traverse le proxy Perchance et rend de vrais
    // résultats (essayé le 25 septembre 2026 : « retenue GAV étranger » → impots.gouv.fr,
    // service-public.gouv.fr). Une ligne par résultat :
    //   <a class='result-link' href="//duckduckgo.com/l/?uddg=<adresse>&rut=…">Titre</a>
    // puis <td class='result-snippet'>…</td> et <span class='link-text'>host/chemin</span>.
    // Le href est une redirection : l'adresse réelle est le paramètre `uddg`.
    _ddgReal(href) {
      let s = this._dec(String(href == null ? "" : href)).trim();
      if (s.indexOf("//") === 0) s = "https:" + s;
      let m = s.match(/[?&]uddg=([^&]+)/);
      if (m) {
        try { let real = decodeURIComponent(m[1]); if (/^https?:\/\//i.test(real)) return real; } catch (e) {}
      }
      return /^https?:\/\//i.test(s) ? s : "";
    },
    _parseDdgLite(html, want) {
      let t = String(html == null ? "" : html), out = [], seen = new Set();
      let tag = /<a\b([^>]*\bclass='result-link'[^>]*)>/gi, m;
      while ((m = tag.exec(t)) && out.length < Math.max(want, 8)) {
        let url = this._ddgReal((m[1].match(/href="([^"]+)"/i) || [])[1]);
        let host = this._host(url);
        if (!host || seen.has(url)) continue;
        let tail = t.slice(tag.lastIndex, tag.lastIndex + 2500);
        let title = this._text((tail.match(/^([\s\S]{0,400}?)<\/a>/i) || ["", ""])[1]);
        let snippet = this._text((tail.match(/class='result-snippet'>([\s\S]{0,700}?)<\/td>/i) || ["", ""])[1]);
        let display = this._text((tail.match(/class='link-text'>([\s\S]{0,300}?)<\/span>/i) || ["", ""])[1]);
        if (!title && !snippet) continue;
        seen.add(url);
        out.push({
          title: (title || host).replace(/_+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
          url: url,
          host: host,
          display: display.slice(0, 160),
          snippet: snippet.replace(/\s+/g, " ").trim().slice(0, 400),
          engine: ""
        });
      }
      return out;
    },
    // ---- SearXNG : les résultats de Google par un autre chemin ----------------
    // Google ne se laisse pas lire par le proxy : sa page revient en coquille JavaScript
    // (93 Ko, un seul lien, « enablejs » deux fois, zéro résultat — mesuré le 25 septembre 2026).
    // Un SearXNG public interroge Google (et Bing, Dogpile…) depuis SON serveur et rend, lui,
    // du HTML pur. Sur « retenue GAV étranger » il a ramené la section L813-1 du CESEDA sur
    // Légifrance, service-public.gouv.fr et le bulletin du ministère de la Justice, marqués
    // « google cse » : ce sont bien les résultats de Google. opnxng.com répond au proxy
    // (baresearch, priv.au, tiekoetter, hbubli, paulgo, rhscz, segfau : non, essayés le même jour).
    _parseSearx(html, want) {
      let t = String(html == null ? "" : html), out = [], seen = new Set();
      let blocks = t.split(/<article\b[^>]*class="[^"]*\bresult\b[^"]*"/i).slice(1);
      for (let b of blocks) {
        if (out.length >= Math.max(want, 8)) break;
        let atag = (b.match(/<a[^>]+class="url_header"[^>]*>/i) || b.match(/<h3>\s*<a[^>]*>/i) || [""])[0];
        let url = this._dec(((atag || "").match(/href="([^"]+)"/i) || [])[1] || "");
        if (!/^https?:\/\//i.test(url)) continue;
        let host = this._host(url);
        if (!host || seen.has(url)) continue;
        let title = this._text((b.match(/<h3>([\s\S]{0,400}?)<\/h3>/i) || ["", ""])[1]);
        let snippet = this._text((b.match(/<p class="content">([\s\S]{0,700}?)<\/p>/i) || ["", ""])[1]);
        if (!title && !snippet) continue;
        seen.add(url);
        out.push({
          title: (title || host).replace(/\s+/g, " ").trim().slice(0, 160),
          url: url,
          host: host,
          display: url.replace(/^https?:\/\//i, "").slice(0, 160),
          snippet: snippet.replace(/\s+/g, " ").trim().slice(0, 400),
          engine: ""
        });
      }
      return out;
    },
    // ---- Brave Search : un index indépendant, lu directement ---------------
    // search.brave.com rend ses résultats en HTML côté serveur (SvelteKit) — à condition de se
    // présenter comme un navigateur : sans les en-têtes User-Agent/Accept-Language, la page reste
    // vide. Essayé le 25 septembre 2026 : « retenue GAV étranger » → juritravail.com,
    // village-justice.com, nicolasavocat.com, en 3,1 s. Chaque résultat est un
    // <div class="snippet" data-pos="N" data-type="web"> : le premier lien est l'adresse,
    // <div class="title …"> le titre, <div class="content …"> l'extrait, <cite class="snippet-url">
    // l'adresse visible. Brave a son propre robot d'indexation : ses résultats ne recoupent pas
    // ceux de Google — deux sources indépendantes, exactement ce que la maison demande.
    _parseBrave(html, want) {
      let t = String(html == null ? "" : html), out = [], seen = new Set();
      let blocks = t.split(/<div class="snippet[^"]*"\s+data-pos="/i).slice(1);
      for (let b of blocks) {
        if (out.length >= Math.max(want, 8)) break;
        let url = this._dec((b.match(/<a href="([^"]+)"/i) || [])[1] || "");
        if (!/^https?:\/\//i.test(url)) continue;
        let host = this._host(url);
        if (!host || seen.has(url)) continue;
        let title = this._text((b.match(/<div class="title[^"]*"[^>]*>([\s\S]{0,300}?)<\/div>/i) || ["", ""])[1]);
        let snippet = this._text((b.match(/<div class="content[^"]*"[^>]*>([\s\S]{0,900}?)<\/div>/i) || ["", ""])[1]);
        let display = this._text((b.match(/<cite class="snippet-url[^"]*"[^>]*>([\s\S]{0,300}?)<\/cite>/i) || ["", ""])[1]);
        if (!title && !snippet) continue;
        if (snippet === title) snippet = "";
        seen.add(url);
        out.push({
          title: (title || host).replace(/\s+/g, " ").trim().slice(0, 160),
          url: url,
          host: host,
          display: display.slice(0, 160),
          snippet: snippet.replace(/\s+/g, " ").trim().slice(0, 400),
          engine: ""
        });
      }
      return out;
    },
    // Le proxy partagé a souvent renvoyé des résultats d'une toute autre recherche.
    // Une ligne sans aucun terme de recherche est donc écartée – mais seulement s'il
    // reste ensuite quelque chose : mieux vaut non vérifié que vide (vaut pour les
    // lignes coréennes quand la rétro-traduction a échoué).
    _filter(rows, q) {
      let W = App.WebSearch, tokens = [], rel = null;
      try { tokens = (W && W._debug && W._debug.tokensOf) ? W._debug.tokensOf(q) : []; } catch (e) { tokens = []; }
      try { rel = (W && W._debug && W._debug.relevant) || null; } catch (e) { rel = null; }
      if (!tokens.length || !rel) return rows;
      let kept = rows.filter((r) => rel(r, tokens, 1));
      return kept.length ? kept : rows;
    },
    async search(eng, query, want) {
      let q = String(query == null ? "" : query).replace(/\s+/g, " ").trim().slice(0, 200);
      if (!q) return [];
      let n = Math.max(1, want || this.ROWS);
      let id = eng.key || eng.name;
      let key = id + "|" + q.toLowerCase();
      let hit = this._cache.get(key);
      if (hit && (Date.now() - hit.ts) < this.TTL_MS) return hit.list.slice(0, n);
      // Un moteur qui vient de ne rien rendre se tait un moment : la carte et le prompt ne
      // doivent pas attendre chaque fois un site qui bloque ou qui limite (les instances
      // SearXNG publiques renvoient leur page d'accueil quand on les presse).
      if (this._off[id] && Date.now() < this._off[id]) return [];
      let t0 = Date.now();
      let sq = q, srcLang = "";
      if (eng.to) {
        if (this._hangul(q)) srcLang = "ko";
        else {
          let tr = await this._gt([q], eng.to, "auto");
          if (tr && tr[0]) { sq = tr[0]; srcLang = eng.to; }
        }
      }
      let init = eng.headers ? { headers: eng.headers } : undefined;
      let body = eng.reader ? await this._readRendered(eng.url(sq)) : await this._fetchText(eng.url(sq), init);
      let rows = body ? this[eng.parse](body, Math.max(n, this.ROWS + 2)) : [];
      if (rows.length && srcLang) {
        let tl = this._lang(q);
        if (tl !== srcLang) {
          let flat = [];
          rows.slice(0, n).forEach((r) => { flat.push(r.title || ""); flat.push(r.snippet || ""); });
          let back = await this._gt(flat, tl, srcLang);
          for (let i = 0; i < Math.min(rows.length, n); i++) {
            let t2 = back[i * 2] || "", s2 = back[i * 2 + 1] || "";
            if (t2) rows[i].title = t2.slice(0, 200);
            if (s2) rows[i].snippet = s2.slice(0, 500);
          }
        }
      }
      rows = this._filter(rows.slice(0, n), q);
      rows.forEach((r) => { r.engine = eng.name; });
      let why = body ? "" : " (page inaccessible)";
      if (!rows.length && body) why = " (rien d'exploitable : " + this._text(body).slice(0, 90) + ")";
      if (rows.length) {
        delete this._off[id];
        this._cache.set(key, { ts: Date.now(), list: rows });
      } else {
        this._off[id] = Date.now() + this.OFF_MS;   // il se tait dix minutes (voir OFF_MS)
        why += " – mis en pause 10 min";
      }
      console.log("[" + eng.name + "] " + (sq === q ? "\"" + q + "\"" : "\"" + q + "\" → \"" + sq + "\"") + " → " + rows.length + " résultats en " + (Date.now() - t0) + " ms" + why);
      return rows;
    },
    // Les moteurs d'appoint courent ensemble. `deadlineMs` begrenzt nur das WARTEN: was bis
    // dahin da ist, wird genommen, die übrigen laufen im Hintergrund weiter (ihr Fund landet im
    // Cache und in der Bremse). Ohne Frist wird auf alle gewartet.
    async all(query, want, deadlineMs) {
      let lists = this.engines.map((e) => this.search(e, query, Math.min(this.ROWS, want)).catch((err) => {
        console.warn("[WebExtra] " + e.name + " failed: " + ((err && err.message) || err));
        return [];
      }));
      let out = [];
      let done = lists.map((p) => p.then((rows) => { for (const r of rows) out.push(r); }));
      let all = Promise.all(done).then(() => true);
      if (!deadlineMs) { await all; return out; }
      let inTime = await Promise.race([all, new Promise((r) => setTimeout(() => r(false), deadlineMs))]);
      if (!inTime) console.log("[WebExtra] " + (deadlineMs / 1000) + " s : " + out.length + " résultat(s) d'appoint gardés, les moteurs lents finissent en arrière-plan");
      return out;
    },
    wrap() {
      let W = App.WebSearch;
      if (!W || typeof W.search !== "function" || W.__extraWrapped) return;
      let orig = W.search.bind(W);
      let self = this;
      W.search = async function (query, opts) {
        let want = Math.min(8, Math.max(1, parseInt((opts || {}).results, 10) || 8));
        // La frist court dès le départ, en parallèle des moteurs du module : ce qui est arrivé à
        // l'échéance est gardé, le reste finit en arrière-plan (voir `all`).
        let extraP = self.all(query, Math.max(3, want), self.EXTRA_DEADLINE_MS).catch(() => []);
        let res = null;
        try { res = await orig(query, opts); } catch (e) { res = null; }
        let extra = [];
        try { extra = await extraP; } catch (e) { extra = []; }
        if (!res || !extra.length) return res;
        let used = new Set(), out = [];
        let strip = (u) => String(u || "").toLowerCase().replace(/[#?].*$/, "").replace(/\/+$/, "");
        for (let r of extra) {
          if (out.length >= want) break;
          let h = String(r.host || self._host(r.url) || "").toLowerCase();
          if (!h || used.has(h)) continue;
          used.add(h);
          out.push(r);
        }
        for (let r of (Array.isArray(res.results) ? res.results : [])) {
          if (out.length >= Math.max(want, 8)) break;
          let h = String(r.host || self._host(r.url) || "").toLowerCase();
          if (h && used.has(h)) continue;
          let u = strip(r.url);
          if (u && out.some((x) => strip(x.url) === u)) continue;
          if (h) used.add(h);
          out.push(r);
        }
        res.results = out;
        // ---- Ronde 286 : l'ordre n'est plus celui des moteurs, mais celui de la RESSEMBLANCE ---
        // Jusqu'ici la carte et le prompt rangeaient les pages dans l'ordre où les moteurs les
        // avaient rendues (les moteurs d'appoint d'abord, puis src/websearch.js). Une page juste
        // en cinquième position restait en cinquième position, et le prompt la lisait ainsi.
        // Le calcul de la ronde 286 reclasse l'ensemble contre la question, puis écarte la queue
        // hors sujet — à condition qu'il reste de quoi répondre.
        try {
          if (App.Tfidf && res.results.length > 2) {
            let before = res.results.map((r) => String(r.host || self._host(r.url) || "?"));
            let ranked = App.Tfidf.rerank(query, res.results, { min: 3, coverRatio: 0.5 });
            if (ranked.length >= 3) {
              res.results = ranked;
              res.reranked = { by: "tf-idf", before: before, after: ranked.map((r) => String(r.host || self._host(r.url) || "?")) };
              console.log("[Tfidf] « " + query + " » : " + ranked.length + " page(s) — "
                + before.join(" > ") + "  →  "
                + ranked.map((r) => String(r.host || self._host(r.url) || "?") + " " + (r.fit == null ? "?" : r.fit)).join(" > "));
            }
          }
        } catch (e) { console.warn("[Tfidf] reclassement web échoué", e && e.message); }
        // Les moteurs d'appoint d'abord (dans l'ordre de leur enregistrement), puis les moteurs
        // de src/websearch.js – la carte les nomme honnêtement comme « via … ».
        let names = extra.map((r) => r.engine).filter((n, i, a) => n && a.indexOf(n) === i);
        res.engines = names.concat((Array.isArray(res.engines) ? res.engines : []).filter((n, i, a) => names.indexOf(n) === -1 && a.indexOf(n) === i));
        // De vrais résultats sont là – dire « échec » serait mentir, même si Google/Ecosia
        // bloquent en ce moment via le proxy partagé.
        if (res.results.length) res.failed = false;
        return res;
      };
      W.__extraWrapped = true;
    }
  };
  // ---- les moteurs que l'utilisateur avait cités ---------------------------
  // Ronde 210 : Lukol SUPPRIMÉ. Il ne rendait le Programmable Search de Google que dans le
  // navigateur – le source ne contient aucun résultat – et le lecteur (r.jina.ai) ne livrait plus
  // que la page brute (du CSS au lieu de résultats) ; Lukol n'était donc qu'une redirection vers
  // Google, superflu depuis que Google tourne lui-même en moteur prioritaire (src/websearch.js).
  //
  // Ronde 266 : Naver SUPPRIMÉ sur demande du propriétaire (« enlève naver comme moteur de
  // recherche »). Le moteur, son lecteur (_parseNaver) et ses filtres (_NAVER_SELF, _NAVER_AD)
  // sont partis avec lui. L'enveloppe ci-dessous reste : il suffit
  // d'un `App.WebExtra.register({ name, parse, url })` pour en remettre un.
  //
  // ---- Ronde 284 : les moteurs d'appoint reviennent — Google par un autre chemin -----------
  // Question du propriétaire : « Pourquoi Sofia ne va pas sur google pour faire des recherches ? »
  // Mesures du 25 septembre 2026 : Google, interrogé par le proxy partagé, ne rend PAS ses
  // résultats (93 Ko de coquille JavaScript, un seul lien, « enablejs » deux fois, zéro résultat) ;
  // Bing rendait les résultats d'une autre recherche ; l'API de DuckDuckGo est morte ; Mojeek
  // demande un captcha ; Ecosia et Wikipédia répondent. Trois chemins rendent donc de VRAIES
  // pages de résultats, et passent devant dans la carte et dans le prompt :
  //   • Brave Search — son propre index, en HTML (en-têtes de navigateur obligatoires) ;
  //   • Lukol — un moteur de recherche Google (Programmable Search / CSE) : ce sont les résultats
  //     de Google, mais sa page ne se construit que dans un navigateur. Le lecteur r.jina.ai la
  //     rend (elle est alors du Markdown, « Markdown Content: ») et _parseReader y lit déjà les
  //     résultats (Ronde 210 ; supprimé alors que le lecteur ne livrait plus que la page brute,
  //     remis en service le 25 septembre 2026 : 8 résultats lus sur « retenue GAV étranger »).
  //     Le lecteur gratuit ralentit après beaucoup d'appels et rend alors la page brute : Sofia
  //     le voit (elle exige « Markdown Content: »), réessaie, puis l'interrupteur le met au repos ;
  //   • SearXNG — deux instances publiques, chacune interroge Google (CSE), Bing, Dogpile…
  //     depuis son propre serveur : les résultats de Google par un autre chemin encore ;
  //   • DuckDuckGo Lite — l'interface HTML de DuckDuckGo (pas l'API). Elle montre parfois sa
  //     page anti-robot ; l'interrupteur (_off) la fait alors taire dix minutes.
  // Les instances SearXNG limitent le débit quand on les presse : d'où l'interrupteur aussi.
  const BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };
  App.WebExtra.register({
    name: "Brave",
    key: "brave",
    headers: BROWSER_HEADERS,
    url: (q) => "https://search.brave.com/search?q=" + encodeURIComponent(q),
    parse: "_parseBrave"
  });
  App.WebExtra.register({
    name: "Lukol (Google)",
    key: "lukol",
    reader: true,
    url: (q) => "https://www.lukol.com/s.php?q=" + encodeURIComponent(q),
    parse: "_parseReader"
  });
  const searxEngines = [
    ["opnxng", "https://opnxng.com/search?q="],
    ["dresden", "https://searx.dresden.network/search?q="]
  ];
  for (const [id, base] of searxEngines) {
    App.WebExtra.register({
      name: "SearXNG",
      key: "searx:" + id,
      url: (q) => base + encodeURIComponent(q),
      parse: "_parseSearx"
    });
  }
  App.WebExtra.register({
    name: "DuckDuckGo Lite",
    key: "ddg-lite",
    url: (q) => "https://lite.duckduckgo.com/lite/?q=" + encodeURIComponent(q) + "&kl=wt-wt",
    parse: "_parseDdgLite"
  });
  App.WebExtra.wrap();
  App.AutoLookup = {
    _pending: null,
    HOST: "https://www.auto-data.net",
    BRANDS: [
      { n: "Acura", u: "/fr/acura-brand-6" },
      { n: "Alfa Romeo", u: "/fr/alfa-romeo-brand-11" },
      { n: "Alpina", u: "/fr/alpina-brand-16" },
      { n: "Aston Martin", u: "/fr/aston-martin-brand-36" },
      { n: "Audi", u: "/fr/audi-brand-41" },
      { n: "Bentley", u: "/fr/bentley-brand-66" },
      { n: "BMW", u: "/fr/bmw-brand-86" },
      { n: "Bugatti", u: "/fr/bugatti-brand-106" },
      { n: "BYD", u: "/fr/byd-brand-116" },
      { n: "Cadillac", u: "/fr/cadillac-brand-121" },
      { n: "Chevrolet", u: "/fr/chevrolet-brand-156" },
      { n: "Chrysler", u: "/fr/chrysler-brand-161" },
      { n: "Citroen", u: "/fr/citroen-brand-166" },
      { n: "Cupra", u: "/fr/cupra-brand-256" },
      { n: "Dacia", u: "/fr/dacia-brand-181" },
      { n: "Daewoo", u: "/fr/daewoo-brand-191" },
      { n: "Daihatsu", u: "/fr/daihatsu-brand-2" },
      { n: "Dodge", u: "/fr/dodge-brand-32" },
      { n: "DS", u: "/fr/ds-brand-198" },
      { n: "Ferrari", u: "/fr/ferrari-brand-62" },
      { n: "Fiat", u: "/fr/fiat-brand-67" },
      { n: "Ford", u: "/fr/ford-brand-72" },
      { n: "Genesis", u: "/fr/genesis-brand-202" },
      { n: "GMC", u: "/fr/gmc-brand-97" },
      { n: "Great Wall", u: "/fr/great-wall-brand-107" },
      { n: "Haval", u: "/fr/haval-brand-214" },
      { n: "Honda", u: "/fr/honda-brand-127" },
      { n: "Hongqi", u: "/fr/hongqi-brand-296" },
      { n: "Hummer", u: "/fr/hummer-brand-137" },
      { n: "Hyundai", u: "/fr/hyundai-brand-147" },
      { n: "Infiniti", u: "/fr/infiniti-brand-152" },
      { n: "Jaguar", u: "/fr/jaguar-brand-3" },
      { n: "Jeep", u: "/fr/jeep-brand-8" },
      { n: "Kia", u: "/fr/kia-brand-23" },
      { n: "Koenigsegg", u: "/fr/koenigsegg-brand-28" },
      { n: "Lada", u: "/fr/lada-brand-140" },
      { n: "Lamborghini", u: "/fr/lamborghini-brand-38" },
      { n: "Lancia", u: "/fr/lancia-brand-43" },
      { n: "Land Rover", u: "/fr/land-rover-brand-48" },
      { n: "Lexus", u: "/fr/lexus-brand-58" },
      { n: "Lotus", u: "/fr/lotus-brand-78" },
      { n: "Maserati", u: "/fr/maserati-brand-108" },
      { n: "Mazda", u: "/fr/mazda-brand-118" },
      { n: "McLaren", u: "/fr/mclaren-brand-123" },
      { n: "Mercedes-Benz", u: "/fr/mercedes-benz-brand-138" },
      { n: "MG", u: "/fr/mg-brand-153" },
      { n: "Mini", u: "/fr/mini-brand-168" },
      { n: "Mitsubishi", u: "/fr/mitsubishi-brand-173" },
      { n: "NIO", u: "/fr/nio-brand-295" },
      { n: "Nissan", u: "/fr/nissan-brand-4" },
      { n: "Opel", u: "/fr/opel-brand-19" },
      { n: "Pagani", u: "/fr/pagani-brand-29" },
      { n: "Peugeot", u: "/fr/peugeot-brand-49" },
      { n: "Polestar", u: "/fr/polestar-brand-223" },
      { n: "Porsche", u: "/fr/porsche-brand-64" },
      { n: "RAM", u: "/fr/ram-brand-240" },
      { n: "Renault", u: "/fr/renault-brand-99" },
      { n: "Rolls-Royce", u: "/fr/rolls-royce-brand-109" },
      { n: "Rover", u: "/fr/rover-brand-119" },
      { n: "Saab", u: "/fr/saab-brand-124" },
      { n: "Seat", u: "/fr/seat-brand-144" },
      { n: "Skoda", u: "/fr/skoda-brand-154" },
      { n: "Smart", u: "/fr/smart-brand-164" },
      { n: "Subaru", u: "/fr/subaru-brand-189" },
      { n: "Suzuki", u: "/fr/suzuki-brand-194" },
      { n: "Tesla", u: "/fr/tesla-brand-197" },
      { n: "Toyota", u: "/fr/toyota-brand-40" },
      { n: "Vauxhall", u: "/fr/vauxhall-brand-60" },
      { n: "Volkswagen", u: "/fr/volkswagen-brand-80" },
      { n: "Volvo", u: "/fr/volvo-brand-85" },
      { n: "Xiaomi", u: "/fr/xiaomi-brand-339" },
    ],
    norm(s) {
      try { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { return String(s == null ? '' : s).toLowerCase(); }
    },
    isEnabled() {
      try { return (typeof root !== 'undefined' && root && typeof root.superFetch === 'function'); } catch (e) { return false; }
    },
    findBrand(text) {
      const t = ' ' + this.norm(text) + ' ';
      let best = null, bestLen = 0;
      for (const b of this.BRANDS) {
        const n = ' ' + this.norm(b.n) + ' ';
        if (t.indexOf(n) !== -1 && n.length > bestLen) { best = b; bestLen = n.length; }
      }
      return best;
    },
    findVIN(text) {
      const toks = String(text == null ? '' : text).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
      for (const t of toks) { if (/^[A-HJ-NPR-Z0-9]{17}$/.test(t)) return t; }
      return null;
    },
    WMI: {
      VF1: "Renault", VF3: "Peugeot", VF7: "Citroën", VF6: "Renault Trucks",
      VSS: "SEAT", VS6: "Ford Espagne", VSK: "Nissan Espagne",
      WBA: "BMW", WBS: "BMW M", WDD: "Mercedes-Benz", WDB: "Mercedes-Benz",
      WAU: "Audi", WVW: "Volkswagen", WVG: "Volkswagen", WV1: "Volkswagen Utilitaires",
      WPO: "Porsche", W0L: "Opel", WF0: "Ford Allemagne",
      ZAR: "Alfa Romeo", ZFA: "Fiat", ZFF: "Ferrari", ZHW: "Lamborghini",
      ZAM: "Maserati", ZLA: "Lancia",
      SAJ: "Jaguar", SAL: "Land Rover", SBM: "McLaren", SCC: "Lotus",
      TMB: "Skoda", UU1: "Dacia", U5Y: "Kia Slovaquie", TRU: "Audi Hongrie",
      NMT: "Toyota Turquie", YV1: "Volvo", YV2: "Volvo Trucks", YS3: "Saab",
      JHM: "Honda", JF1: "Subaru", JF2: "Subaru", JM1: "Mazda", JN1: "Nissan",
      JTD: "Toyota", JMB: "Mitsubishi", JS1: "Suzuki",
      "1HG": "Honda USA", "1FA": "Ford USA", "1G1": "Chevrolet", "1C3": "Chrysler",
      "1N4": "Nissan USA", "1YV": "Mazda USA", "4T1": "Toyota USA", "5TD": "Toyota USA",
      "2HG": "Honda Canada", "2G1": "Chevrolet Canada",
      "3FA": "Ford Mexique", "3VW": "Volkswagen Mexique", "3N1": "Nissan Mexique", "3MY": "Mazda Mexique",
      KMH: "Hyundai", KNA: "Kia", KL1: "Chevrolet (Daewoo)",
      MA3: "Maruti Suzuki", MAL: "Hyundai Inde",
      "6G1": "Holden", "9BW": "Volkswagen Brésil", "9BD": "Fiat Brésil", "9BG": "Chevrolet Brésil"
    },
    COUNTRY: [
      ["AA","AH","Afrique du Sud"], ["AJ","AN","Côte d'Ivoire"], ["BA","BE","Angola"],
      ["BF","BK","Kenya"], ["BL","BR","Tanzanie"], ["CA","CE","Bénin"], ["CF","CK","Madagascar"],
      ["CL","CR","Tunisie"], ["DA","DE","Égypte"], ["DF","DK","Maroc"], ["DL","DR","Zambie"],
      ["EA","EE","Éthiopie"], ["EF","EK","Mozambique"], ["FA","FE","Ghana"], ["FF","FK","Nigéria"],
      ["JA","JZ","Japon"], ["KA","KE","Sri Lanka"], ["KF","KK","Israël"], ["KL","KR","Corée du Sud"],
      ["KS","K0","Kazakhstan"], ["L0","LZ","Chine"], ["MA","ME","Inde"], ["MF","MK","Indonésie"],
      ["ML","MR","Thaïlande"], ["MS","M0","Birmanie"], ["NA","NE","Iran"], ["NF","NK","Pakistan"],
      ["NL","NR","Turquie"], ["PA","PE","Philippines"], ["PF","PK","Singapour"], ["PL","PR","Malaisie"],
      ["RA","RE","Émirats arabes unis"], ["RF","RK","Taïwan"], ["RL","RR","Vietnam"], ["RS","R0","Arabie saoudite"],
      ["SA","SM","Royaume-Uni"], ["SN","ST","Allemagne"], ["SU","SZ","Pologne"], ["S1","S4","Lettonie"],
      ["TA","TH","Suisse"], ["TJ","TP","Tchéquie"], ["TR","TV","Hongrie"], ["TW","T1","Portugal"],
      ["UH","UM","Danemark"], ["UN","UT","Irlande"], ["UU","UZ","Roumanie"], ["U5","U7","Slovaquie"],
      ["VA","VE","Autriche"], ["VF","VR","France"], ["VS","VW","Espagne"], ["VX","V2","Serbie"],
      ["V3","V5","Croatie"], ["V6","V0","Estonie"], ["W0","WZ","Allemagne"],
      ["XA","XE","Bulgarie"], ["XF","XK","Grèce"], ["XL","XR","Pays-Bas"], ["XS","XW","Russie (ex-URSS)"],
      ["XX","X2","Luxembourg"], ["X3","X0","Russie"],
      ["YA","YE","Belgique"], ["YF","YK","Finlande"], ["YL","YR","Malte"], ["YS","YW","Suède"],
      ["YX","Y2","Norvège"], ["Y3","Y5","Biélorussie"], ["Y6","Y0","Ukraine"],
      ["ZA","ZR","Italie"], ["Z3","Z5","Lituanie"], ["ZX","Z2","Slovénie"],
      ["1","1","États-Unis"], ["4","4","États-Unis"], ["5","5","États-Unis"], ["2","2","Canada"],
      ["3A","3W","Mexique"], ["3X","37","Costa Rica"], ["38","39","Îles Caïmans"],
      ["8A","8E","Argentine"], ["8F","8K","Chili"], ["8L","8R","Équateur"], ["8S","8W","Pérou"],
      ["8X","82","Venezuela"], ["9A","9E","Brésil"], ["9F","9K","Colombie"], ["9L","9R","Paraguay"],
      ["9S","9W","Uruguay"], ["9X","92","Trinité-et-Tobago"], ["93","99","Brésil"],
      ["6","6","Australie"], ["7","7","Nouvelle-Zélande"]
    ],
    YEAR: {
      A: [2010,1980], B: [2011,1981], C: [2012,1982], D: [2013,1983], E: [2014,1984],
      F: [2015,1985], G: [2016,1986], H: [2017,1987], J: [2018,1988], K: [2019,1989],
      L: [2020,1990], M: [2021,1991], N: [2022,1992], P: [2023,1993], R: [2024,1994],
      S: [2025,1995], T: [2026,1996], V: [2027,1997], W: [2028,1998], X: [2029,1999],
      Y: [2030,2000],
      "1": [2031,2001], "2": [2032,2002], "3": [2033,2003], "4": [2034,2004], "5": [2035,2005],
      "6": [2036,2006], "7": [2037,2007], "8": [2038,2008], "9": [2039,2009]
    },
    vinCountry(vin) {
      const c2 = vin.slice(0, 2);
      for (const r of this.COUNTRY) {
        if (r[0].length === 1) { if (vin[0] === r[0]) return r[2]; }
        else if (c2 >= r[0] && c2 <= r[1]) return r[2];
      }
      return '';
    },
    decodeVIN(vin) {
      const wmi = vin.slice(0, 3);
      const make = this.WMI[wmi] || '';
      const yc = vin[9];
      const yr = this.YEAR[yc];
      return {
        ok: true, vin: true, code: vin, wmi,
        make: make || ('constructeur non répertorié (' + wmi + ')'),
        country: this.vinCountry(vin) || 'pays non répertorié',
        year: yr ? (yr[0] + ' (ou ' + yr[1] + ')') : 'caractère illisible',
        yearCode: yc, plant: vin[10], descriptor: vin.slice(3, 8), check: vin[8], serial: vin.slice(11)
      };
    },
    vinBlock(p) {
      const L = ['[VIN - DECODE LOCAL, SANS RESEAU]'];
      L.push('VIN question: the 17-character code was decoded locally with the ISO tables (WMI make table, country table and year table from EpicVIN). Answer from this decode, never invent other details. A VIN never tells mileage, accidents or owners: for a French vehicle point to the free official Histovec report (histovec.interieur.gouv.fr, needs the VIN plus the owner data on the carte grise); full paid history exists at vin-info.com, epicvin.com, car2db.com, carvertical.com or carfax.eu; a free decode check is possible at freevindecoder.eu; stolen-vehicle doubt goes to the police/gendarmerie, the APIC/FNUCI-type files are not public search engines - say so.');
      L.push('VIN : ' + p.code);
      L.push('Constructeur (WMI ' + p.wmi + ') : ' + p.make);
      L.push('Pays de fabrication : ' + p.country);
      L.push('Année modèle (10e caractère « ' + p.yearCode + ' ») : ' + p.year);
      L.push('Détail : caractéristiques ' + p.descriptor + ' · contrôle ' + p.check + ' · usine ' + p.plant + ' · série ' + p.serial);
      return L.join('\n');
    },

    wants(text) {
      if (this.findVIN(text)) return true;
      const t = this.norm(text);
      if (!/(fiche technique|consommation|puissance|couple|cylindree|0\s?[-a]\s?100|vitesse max|chevaux|coffre|empattement|motorisation|carburant|poids a vide|boite de vitesse|l\/100|wh\/km|autonomie)/.test(t)) return false;
      if (this.findBrand(text)) return true;
      return /(voiture|automobile|vehicule|bagnole|modele|marque|moteur)/.test(t);
    },
    toks(text, brand) {
      const stop = new Set('fiche,technique,consommation,carburant,puissance,couple,cylindree,vitesse,maximale,max,chevaux,coffre,empattement,motorisation,dimensions,poids,vide,boite,vitesses,quelle,quel,quelles,quels,combien,donne,moi,les,des,est,sur,pour,avec,par,qui,quoi,auto,voiture,vehicule,modele,marque,moteur,de,la,le,les,un,une,des,du,aux,annee,phase,generation,litres'.split(','));
      const bn = new Set(this.norm(brand.n).split(/[^a-z0-9]+/).filter(Boolean));
      const out = [];
      for (const w of this.norm(text).split(/[^a-z0-9.]+/)) {
        const c = w.replace(/^\.+|\.+$/g, '');
        if (!c || bn.has(c) || stop.has(c)) continue;
        if (c.length >= 3 || /^\d/.test(c)) out.push(c);
      }
      return [...new Set(out)].slice(0, 12);
    },
    async getText(url) {
      let sf = null;
      try { sf = (typeof root !== 'undefined' && root.superFetch) || null; } catch (e) {}
      if (!sf) { try { sf = superFetch; } catch (e2) {} }
      if (!sf) throw new Error('no proxy');
      const p = sf(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
      return await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 16000))]);
    },
    meta(html, what) {
      const m = html.match(new RegExp('<meta\\s+name="' + what + '"\\s+content="([^"]*)"', 'i'))
        || html.match(new RegExp('<meta\\s+content="([^"]*)"\\s+name="' + what + '"', 'i'));
      return m ? m[1].replace(/\s+/g, ' ').trim() : '';
    },
    title(html) {
      const m = html.match(/<title>([\s\S]*?)<\/title>/i);
      return m ? m[1].replace(/\s+/g, ' ').trim() : '';
    },
    carlistH(html) {
      const m = html.match(/<div class="carlist">\s*<div class="h">([\s\S]*?)<\/div>/i);
      if (!m) return '';
      return m[1].replace(/<br\s*\/?>/gi, ' | ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
    },
    links(html, re) {
      return [...new Set([...html.matchAll(/href="(\/fr\/[^"]+)"/g)].map(x => x[1]))].filter(u => re.test(u));
    },
    slug(u) {
      return this.norm(u.replace(/^\/fr\//, '').replace(/-\d+$/, ''));
    },
    label(u) {
      return u.replace(/^\/fr\//, '').replace(/-\d+$/, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    },
    score(u, tk) {
      const n = this.slug(u);
      let s = 0;
      for (const t of tk) if (t && n.indexOf(t) !== -1) s += t.length >= 5 ? 2 : 1;
      return s;
    },
    async search(text) {
      let v = null;
      try { v = this.findVIN(text); } catch (e) {}
      if (v) { try { return this.decodeVIN(v); } catch (e) { return { failed: true, reason: 'vin-decode' }; } }
      const brand = this.findBrand(text);
      if (!brand) return { failed: true, reason: 'no-brand' };
      const tk = this.toks(text, brand);
      let models = [];
      try {
        const bh = await this.getText(this.HOST + brand.u);
        models = this.links(bh, /-model-\d+$/);
      } catch (e) { return { failed: true, reason: 'brand-page' }; }
      let model = null, ms = -1;
      for (const u of models) {
        const s = this.score(u, tk);
        if (s > ms) { ms = s; model = u; }
      }
      if (!model || (tk.length && ms <= 0)) return { failed: true, reason: 'no-model' };
      let gens = [];
      try {
        const mh = await this.getText(this.HOST + model);
        gens = this.links(mh, /-generation-\d+$/);
      } catch (e) { return { failed: true, reason: 'model-page' }; }
      if (!gens.length) return { failed: true, reason: 'no-generation' };
      let gen = gens[0], gs = -1;
      for (const u of gens) {
        const s = this.score(u, tk);
        if (s > gs) { gs = s; gen = u; }
      }
      let gh = '';
      try { gh = await this.getText(this.HOST + gen); } catch (e) { return { failed: true, reason: 'generation-page' }; }
      const genTitle = this.title(gh).split('|')[0].trim();
      const desc = this.meta(gh, 'description');
      const resume = this.carlistH(gh);
      const vers = this.links(gh, /^\/fr\/(?!.*(?:brand-|model-|generation-)).*-\d+$/).slice(0, 8);
      let vbest = vers[0] || '', vs = -1;
      for (const u of vers) {
        const s = this.score(u, tk);
        if (s > vs) { vs = s; vbest = u; }
      }
      let vdesc = '';
      if (vbest) {
        try { vdesc = this.meta(await this.getText(this.HOST + vbest), 'description'); } catch (e) {}
      }
      return { ok: true, brand: brand.n, model: this.label(model), gen: genTitle, url: this.HOST + gen, desc, resume, versions: vers.map(u => this.label(u)), versionUrl: vbest ? this.HOST + vbest : '', versionDesc: vdesc };
    },
    buildBlock(p) {
      if (!p || !p.ok) return '';
      if (p.vin) { try { return this.vinBlock(p); } catch (e) { return ''; } }
      const L = ['[AUTO-DATA - SPECS READ LIVE ON auto-data.net]'];
      L.push('Car question: the specs below were read live on auto-data.net, not from memory. Answer from them, cite the source with its URL. Whatever is not in them, say plainly you did not find it - never invent figures.');
      L.push('Model: ' + p.gen);
      if (p.desc) L.push(p.desc);
      if (p.resume) L.push('Summary: ' + p.resume);
      if (p.versionDesc) L.push('Version: ' + p.versionDesc + ' (' + p.versionUrl + ')');
      if (p.versions && p.versions.length) L.push('Other versions: ' + p.versions.join(' ; '));
      L.push('Source: ' + p.url);
      return L.join('\n').slice(0, 2200);
    }
  };


  // ---- Ronde 286 : son propre corpus de droit, reclassé par la même mesure -------------------
  // Mesures du 25 septembre 2026, sur la question « retenue gav étranger » :
  //   • le réducteur de mots du corpus range DÉJÀ « retenue » avec « retenir » et « rétention »
  //     (mesuré : App.DroitLookup._topicStem("retenue") === "reten") — ce n'était donc PAS la
  //     cause. La cause est son PONT LEXICAL : « étranger » y ouvre « résidence » et
  //     « éloignement », et ces deux mots tirent en tête les articles de la RÉTENTION
  //     administrative (L. 752-x, L. 753-x) ; la RETENUE pour vérification du droit au séjour
  //     (L. 813-1…) n'entre même pas dans les huit articles rendus.
  //   • dès que la question porte ses propres mots (« retenue pour vérification du droit au
  //     séjour d'un étranger »), la bonne famille sort : L. 813-8, L. 813-2, L. 813-1, L. 813-3…
  //   • un seul mot (« retenue ») ne livre RIEN : aucun domaine ne s'en déduit.
  // Conclusion honnête : sur un télégramme de trois mots, le corpus ne peut pas deviner DE QUELLE
  // retenue il s'agit (police, douane, fisc) — c'est à la RÉPONSE de les énumérer au lieu d'en
  // choisir une et de déclarer les autres imaginaires (règle ajoutée à SOURCE_PROMPT).
  // Ce que cette enveloppe ajoute — DEUX passes, dont la seconde est la vraie réparation :
  //   (a) ce que le module a rendu est reclassé par ressemblance réelle à la question ;
  //   (b) si cette famille-là n'est PAS prouvée (meilleure ressemblance sous 0,16), on cherche
  //       une SECONDE fois dans le code, non plus par radicaux mais par les MOTS ÉCRITS de la
  //       question : « retenue/retenu/retenir » mais pas « rétention », « étranger »… C'est le
  //       seul endroit où les deux notions peuvent se séparer, parce que le radical commun
  //       (« reten ») les confond. Mesuré le 25 septembre 2026 sur « retenue gav étranger » :
  //       la première passe rend 8 articles de la RÉTENTION (L. 752-x, L. 753-x, R. 753-x) ;
  //       la seconde rend L. 813-11, L. 813-15, L. 813-10, L. 813-2… — la retenue pour
  //       vérification du droit au séjour, exactement la notion que la réponse avait niée.
  //       (Le sigle « gav » n'apparaît nulle part dans le code — 0 article sur 2496 — c'est
  //       pourquoi il ne sert qu'au web ; L. 813-11 parle de « personnes gardées à vue ».)
  // Le numéro d'article compte comme un mot (une question « L. 814-1 » doit trouver L. 814-1).
  (function () {
    let DL = (typeof App !== "undefined" && App && App.DroitLookup) || null;
    if (!DL || typeof DL.searchTopic !== "function" || DL.__tfidfWrapped) return;
    // Formes écrites d'un même mot que le radical ne rapproche pas, et qui séparent ici les deux
    // notions : « rétention » n'est PAS dans cette famille (c'est le placement administratif).
    const FORMS = {
      reten: ["retenue", "retenues", "retenu", "retenus", "retenir", "retient", "retenons", "retenez"],
      deten: ["detenu", "detenue", "detenus", "detenues", "detenir", "detient"]
    };
    const MAX_ARTS = 8;      // le nombre d'articles que la carte et le prompt reçoivent
    const textsOf = (a) => String(a.num || "") + " " + String(a.text || "");
    const reRank = (text, arts) => App.Tfidf.rerank(text, arts, { text: textsOf, title: (a) => String(a.num || ""), prune: false });
    // La seconde passe : lire le code article par article et garder ceux qui portent VRAIMENT
    // les mots de la question. Un mot présent dans presque tout le code (« étranger » : 1180
    // articles sur 2496) ne distingue rien — on exige donc au moins un mot vraiment rare.
    async function surfacePool(slug, text) {
      try {
        if (!slug || !App.Tfidf || typeof DL.artMap !== "function") return [];
        let map = await DL.artMap(slug);
        if (!map) return [];
        let words = App.Tfidf._tokens(text);
        if (!words.length) return [];
        let forms = [];
        for (const w of words) {
          for (const f of (FORMS[w] || [w])) {
            let ff = App.Tfidf._fold(f);
            if (ff && ff.length >= 3 && forms.indexOf(ff) === -1) forms.push(ff);
          }
        }
        if (!forms.length) return [];
        let nums = Object.keys(map), count = Object.create(null), hits = [];
        for (const f of forms) count[f] = 0;
        for (const num of nums) {
          let t = App.Tfidf._fold(map[num] || ""), got = [];
          for (const f of forms) if (t.indexOf(f) !== -1) { got.push(f); count[f]++; }
          if (got.length) hits.push({ num: num, text: map[num], forms: got, local: true, fromCode: true, env: "", date: "", mod: "", via: "", topic: false });
        }
        let lim = Math.max(20, nums.length * 0.25), rare = [];
        for (const f of forms) if (count[f] <= lim) rare.push(f);
        let pool = rare.length ? hits.filter((h) => h.forms.some((f) => rare.indexOf(f) !== -1)) : hits;
        if (pool.length > 400) pool = pool.slice(0, 400);
        console.log("[Tfidf] code « " + slug + " » : " + hits.length + " article(s) portent les mots écrits, dont "
          + pool.length + " dans le vivier (" + rare.length + " mot(s) rare(s) sur " + forms.length + ")");
        return pool;
      } catch (e) { console.warn("[Tfidf] seconde passe échouée", e && e.message); return []; }
    }
    let origTopic = DL.searchTopic.bind(DL);
    DL.searchTopic = async function (text) {
      let res = null;
      try { res = await origTopic(text); } catch (e) { console.warn("[Tfidf] recherche thématique droit échouée", e && e.message); res = null; }
      try {
        if (!App.Tfidf) return res;
        let arts = (res && res.ok && Array.isArray(res.arts)) ? res.arts.slice() : [];
        let slug = (res && res.slug) || (DL.route ? DL.route(text) : null);
        // Les DEUX passes tournent toujours et leurs candidats sont RÉUNIS, puis classés une
        // seule fois (mesuré : 0,1 s à 1,1 s au total, index compris). C'est un seul classement,
        // donc un seul idf : plus rien à comparer entre deux listes, ce qui était le point
        // fragile. Mesuré le 25 septembre 2026 :
        //   • « retenue gav étranger » : le module rendait la RÉTENTION administrative
        //     (L. 752-x, L. 753-x, R. 753-x) ; la réunion classe en tête L. 813-11, L. 813-15,
        //     L. 813-10 — la RETENUE pour vérification du droit au séjour, exactement la notion
        //     que la réponse avait niée ;
        //   • « comment contester une amende forfaitaire » : le module mettait L. 412-1 (obstacle
        //     à la circulation) en tête ; la réunion met L. 121-5 (la procédure de l'amende
        //     forfaitaire) devant.
        let pool = await surfacePool(slug, text);
        let uniq = [], seen = Object.create(null);
        for (const a of arts.concat(pool)) {
          if (a && a.num != null && !seen[a.num]) { seen[a.num] = 1; uniq.push(a); }
        }
        let ranked = uniq.length ? reRank(text, uniq) : [];
        if (res && res.ok) {
          let keep = ranked.length ? ranked.slice(0, Math.max(MAX_ARTS, arts.length)) : arts;
          if (keep.length) {
            res.arts = keep;
            res.ranked = { via: "mots_ecrits+module", before: arts.map((a) => a.num), after: keep.map((a) => a.num) };
            if (pool.length) res.via = "articles du code, classés par ressemblance (mots écrits + score du module)";
            console.log("[Tfidf] droit « " + text + " » (" + slug + " / " + arts.length + " + " + pool.length + " candidats) : "
              + (arts.slice(0, 4).map((a) => a.num).join(", ") || "rien") + "  →  "
              + keep.slice(0, 4).map((a) => a.num + " " + a.fit).join(", "));
          }
        } else if (ranked.length >= 3) {
          // Le module n'a rien trouvé (ou pas de domaine) mais les mots écrits, eux, sont là.
          let code = DL.bySlug ? DL.bySlug(slug) : null;
          let arts2 = ranked.slice(0, MAX_ARTS);
          res = {
            ok: true, arts: arts2, numbers: [], status: "surface", topic: false,
            slug: slug || "", nom: (code && code.nom) || "",
            terms: App.Tfidf._tokens(text), score: arts2[0].fit,
            via: "articles trouvés par les mots écrits de la question",
            ranked: { via: "mots_ecrits", before: [], after: arts2.map((a) => a.num) }
          };
          console.log("[Tfidf] droit « " + text + " » : le module n'a rien rendu, les mots écrits donnent " + arts2.slice(0, 4).map((a) => a.num + " " + a.fit).join(", "));
        }
      } catch (e) { console.warn("[Tfidf] reclassement droit échoué", e && e.message); }
      return res;
    };
    DL.__tfidfWrapped = true;
  })();

  // ---- Ronde 222 : verrou des sources « sources internet russes » -------------
  // Souhait de l'utilisateur : « Vu que la Russie est en conflit avec l'Ukraine,
  // interdit toutes les sources internet russes à Sofia. » Mis en œuvre à UN seul
  // endroit, sur trois niveaux, pour qu'aucun point d'appel ne puisse être oublié :
  //
  //   (1) RÉSEAU : `root.superFetch` et `window.fetch` rejettent un hôte russe
  //       avant même de récupérer quoi que ce soit. C'est le filet de secours pour
  //       tout ce qui n'est pas nommé ici – y compris des modules chiffrés qui
  //       arriveraient plus tard, car ils relisent `root.superFetch` resp. `fetch`
  //       à CHAQUE appel. Au lieu d'une erreur, une réponse 403 honnête revient,
  //       que tous les appelants connaissent déjà (`res.ok === false`).
  //   (2) RÉSULTATS ET PAGES : `App.WebSearch.search` est re-filtré (résultats ET
  //       images, l'enveloppe se pose au-dessus de celle des moteurs d'appoint de la ronde 157),
  //       un lien vers une page russe n'est même pas ouvert par
  //       `App.WebVision.ingestUrl`. Le bloc de prompt et la carte disent
  //       honnêtement ce qui a été retenu resp. non ouvert.
  //   (3) PROMPT : App.Constants.RUSSIA_PROMPT lui dit qu'elle n'utilise pas les
  //       sources russes, ne les cite pas et ne fait pas comme si elle les avait
  //       lues.
  //
  // Ronde 261 : règle permanente et invisible – la carte « Sources russes » et son
  // interrupteur sont retirés des réglages ; la quarantaine s'applique toujours.
  App.SourcePolicy = {
    WHY: 'Russian internet sources are blocked (Russia / Ukraine conflict)',
    _installed: false, _ready: false, _count: 0, _last: 0,
    _suffixRe: null, _cyrRe: null,
    HOSTS: [],
    // Ce que l'UTILISATEUR voit (5 langues, comme tous les textes d'interface de la maison).
    _txt: {
      en: {
        title: 'Russian sources',
        enable: 'Block Russian internet sources',
        desc: 'Because Russia is at war with Ukraine, Sofia does not open, read or cite any Russian internet source: domains .ru, .su, .рф, .рус and .москва, plus the well-known Russian media and portals. She says so honestly instead of citing what she could not read.',
        noteOne: '{n} Russian source withheld',
        noteMany: '{n} Russian sources withheld',
        pageCardTxt: 'Russian source blocked: {h} was not opened — Sofia does not consult Russian sources.',
        cardNote: function (n) { return String(n === 1 ? this.noteOne : this.noteMany).replace('{n}', n); },
        pageCard: function (h) { return String(this.pageCardTxt || '').replace('{h}', h); }
      },
      de: {
        title: 'Russische Quellen',
        enable: 'Russische Internet-Quellen sperren',
        desc: 'Wegen des Krieges zwischen Russland und der Ukraine öffnet, liest und zitiert Sofia keine russische Internet-Quelle: Domains .ru, .su, .рф, .рус und .москва sowie die bekannten russischen Medien und Portale. Sie sagt das ehrlich, statt zu zitieren, was sie nicht lesen konnte.',
        noteOne: '{n} russische Quelle zurückgehalten',
        noteMany: '{n} russische Quellen zurückgehalten',
        pageCardTxt: 'Russische Quelle gesperrt: {h} wurde nicht geöffnet – Sofia zieht keine russischen Quellen heran.',
        cardNote: function (n) { return String(n === 1 ? this.noteOne : this.noteMany).replace('{n}', n); },
        pageCard: function (h) { return String(this.pageCardTxt || '').replace('{h}', h); }
      },
      es: {
        title: 'Fuentes rusas',
        enable: 'Bloquear las fuentes de internet rusas',
        desc: 'Debido a la guerra entre Rusia y Ucrania, Sofia no abre, lee ni cita ninguna fuente de internet rusa: dominios .ru, .su, .рф, .рус y .москва, además de los medios y portales rusos conocidos. Lo dice con honestidad en lugar de citar lo que no ha podido leer.',
        noteOne: '{n} fuente rusa descartada',
        noteMany: '{n} fuentes rusas descartadas',
        pageCardTxt: 'Fuente rusa bloqueada: no se abrió {h} — Sofia no consulta fuentes rusas.',
        cardNote: function (n) { return String(n === 1 ? this.noteOne : this.noteMany).replace('{n}', n); },
        pageCard: function (h) { return String(this.pageCardTxt || '').replace('{h}', h); }
      },
      fr: {
        title: 'Sources russes',
        enable: 'Bloquer les sources internet russes',
        desc: "En raison du conflit entre la Russie et l'Ukraine, Sofia n'ouvre, ne lit et ne cite aucune source internet russe : domaines .ru, .su, .рф, .рус et .москва, ainsi que les médias et portails russes connus. Elle le dit honnêtement au lieu de citer ce qu'elle n'a pas pu lire.",
        noteOne: '{n} source russe écartée',
        noteMany: '{n} sources russes écartées',
        pageCardTxt: "Source russe bloquée : {h} n'a pas été ouverte — Sofia ne consulte pas les sources russes.",
        cardNote: function (n) { return String(n === 1 ? this.noteOne : this.noteMany).replace('{n}', n); },
        pageCard: function (h) { return String(this.pageCardTxt || '').replace('{h}', h); }
      },
      it: {
        title: 'Fonti russe',
        enable: 'Blocca le fonti internet russe',
        desc: 'A causa della guerra tra Russia e Ucraina, Sofia non apre, non legge e non cita alcuna fonte internet russa: domini .ru, .su, .рф, .рус e .москва, più i media e i portali russi noti. Lo dice con onestà invece di citare ciò che non ha potuto leggere.',
        noteOne: '{n} fonte russa esclusa',
        noteMany: '{n} fonti russe escluse',
        pageCardTxt: 'Fonte russa bloccata: {h} non è stata aperta — Sofia non consulta fonti russe.',
        cardNote: function (n) { return String(n === 1 ? this.noteOne : this.noteMany).replace('{n}', n); },
        pageCard: function (h) { return String(this.pageCardTxt || '').replace('{h}', h); }
      }
    },
    // Ce que lit le MODÈLE (les blocs de prompt de la maison sont en anglais).
    _prompt: {
      withheld: function (n) {
        return '[' + n + ' Russian source' + (n === 1 ? '' : 's') + ' withheld by policy: '
          + (n === 1 ? 'it is' : 'they are') + ' NOT in the list above. Do not cite ' + (n === 1 ? 'it' : 'them')
          + ', do not invent what ' + (n === 1 ? 'it say' : 'they say')
          + ', and if the point can only be answered from a Russian source, say plainly that you do not consult Russian sources.]';
      },
      pageBlocked: function (host) {
        return '[SOURCE BLOCKED - RUSSIAN] The user\'s link points to ' + host + ', a Russian internet source. '
          + 'By the standing policy (Russia / Ukraine) it was NOT opened and you were given no content from it. '
          + 'Tell the user this in one calm sentence, do not pretend to have read it, and offer an independent or international source instead.';
      }
    },
    lang() {
      try {
        let l = String((App.State && App.State.settings && App.State.settings.language) || 'en').slice(0, 2).toLowerCase();
        return this._txt[l] ? l : 'en';
      } catch (e) { return 'en'; }
    },
    t() { return this._txt[this.lang()] || this._txt.en; },
    enabled() {
      // Ronde 261 : règle permanente et invisible (la carte des réglages est retirée).
      return true;
    },
    localize() {
      // Ronde 261 : plus de carte dans les réglages – les seuls textes visibles
      // (les notes de la réponse et la plaque d'une page bloquée) vivent dans _txt
      // et sont lus à la demande par t().
    },
    // Traduire une fois les listes de App.Constants en regex (chemin chaud).
    _build() {
      let C = App.Constants || {};
      let esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let tlds = (C.RUSSIA_BLOCKED_TLDS || []).map(esc);
      let cyr = (C.RUSSIA_BLOCKED_TLDS_CYR || []).map(esc);
      this._suffixRe = tlds.length ? new RegExp('(?:' + tlds.join('|') + ')$', 'i') : null;
      this._cyrRe = cyr.length ? new RegExp('(?:' + cyr.join('|') + ')$', 'i') : null;
      this.HOSTS = (C.RUSSIA_BLOCKED_HOSTS || []).slice();
      this._ready = true;
    },
    hostOf(url) {
      try {
        let s = String(url == null ? '' : url).trim();
        if (!s) return '';
        let u = new URL(s, location.href);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
        return u.hostname.toLowerCase().replace(/^www\./, '');
      } catch (e) { return ''; }
    },
    // Seulement le nom d'hôte – volontairement sans test de langue (voir App.Constants).
    blockedHost(h) {
      if (!h) return false;
      if (this._suffixRe && this._suffixRe.test(h)) return true;
      if (this._cyrRe && this._cyrRe.test(h)) return true;
      for (let d of this.HOSTS) {
        if (h === d) return true;
        let n = d.length;
        if (h.length > n && h.charAt(h.length - n - 1) === '.' && h.slice(-n) === d) return true;
      }
      return false;
    },
    blocked(url) {
      if (!this.enabled()) return false;
      if (!this._ready) this._build();
      return this.blockedHost(this.hostOf(url));
    },
    // Une réponse 403 honnête au lieu d'une exception : chaque appelant de la
    // maison vérifie `res.ok === false` et retombe silencieusement sur « indisponible ».
    _denied(url) {
      let h = this.hostOf(url) || '?';
      let body = 'Russian internet source blocked by policy: ' + h;
      try {
        return new Response(body, { status: 403, statusText: 'Blocked (Russian source)', headers: { 'content-type': 'text/plain; charset=utf-8' } });
      } catch (e) {
        return { ok: false, status: 403, statusText: 'Blocked', text: () => Promise.resolve(body), json: () => Promise.resolve(null), blob: () => Promise.resolve(null), headers: { get: () => 'text/plain' } };
      }
    },
    note(n) {
      this._count += n;
      this._last = Date.now();
      console.log('[SourcePolicy] ' + n + ' résultats russes retenus');
    },
    // Une petite plaque durable dans la réponse : le verrou Russie n'est pas un
    // filtrage silencieux – l'utilisateur doit voir que quelque chose n'a pas été ouvert.
    pageNotice(host) {
      let box = document.createElement('div');
      box.className = 'sourcePolicyCard';
      box.style.cssText = 'margin-top:12px; padding:10px 12px; border:1px solid rgba(161,98,7,0.45); border-radius:12px; background:rgba(120,53,15,0.15); color:#e4e4e7; font-size:12.5px; line-height:1.5; text-align:left;';
      box.textContent = this.t().pageCard(host || '?');
      return box;
    },
    // Écarter les résultats de recherche et les images d'un résultat.
    filterResults(res) {
      if (!res || typeof res !== 'object' || !this.enabled()) return res;
      let n = 0;
      if (Array.isArray(res.results)) {
        let keep = [];
        for (let r of res.results) {
          if (r && this.blocked(r.url)) { n++; continue; }
          keep.push(r);
        }
        res.results = keep;
      }
      n += this.filterImages(res.plan);
      if (n) {
        res.russianBlocked = (res.russianBlocked || 0) + n;
        this.note(n);
      }
      return res;
    },
    // Des images tombent aussi quand seule la PAGE SOURCE est russe
    // (l'image elle-même se trouve souvent sur un CDN).
    filterImages(plan) {
      if (!plan || !Array.isArray(plan.images) || !plan.images.length) return 0;
      let keep = [], n = 0;
      for (let im of plan.images) {
        let credit = (im && im.credit && im.credit.url) || '';
        if (im && (this.blocked(im.url) || (credit && this.blocked(credit)))) { n++; continue; }
        keep.push(im);
      }
      plan.images = keep;
      return n;
    },
    install() {
      if (this._installed) return;
      if (!this._ready) this._build();
      this._installed = true;
      let self = this;
      // (1) Couche réseau ---------------------------------------------------
      try {
        let R = (typeof root !== 'undefined' && root) ? root : (window.root || null);
        if (R && typeof R.superFetch === 'function' && !R.__sofiaSourcePolicy) {
          let orig = R.superFetch.bind(R);
          R.superFetch = function (url) {
            if (self.blocked(url)) { console.log('[SourcePolicy] superFetch verweigert: ' + self.hostOf(url)); return Promise.resolve(self._denied(url)); }
            return orig.apply(null, arguments);
          };
          R.__sofiaSourcePolicy = true;
        }
      } catch (e) { console.warn('[SourcePolicy] enveloppe superFetch échouée', e); }
      try {
        if (!window.__sofiaSourcePolicyFetch) {
          let of = window.fetch.bind(window);
          window.fetch = function (input) {
            let u = (typeof input === 'string') ? input : ((input && input.url) || '');
            if (u && /^https?:/i.test(u) && self.blocked(u)) { console.log('[SourcePolicy] fetch verweigert: ' + self.hostOf(u)); return Promise.resolve(self._denied(u)); }
            return of.apply(null, arguments);
          };
          window.__sofiaSourcePolicyFetch = true;
        }
      } catch (e) { console.warn('[SourcePolicy] enveloppe fetch échouée', e); }
      // (2) Résultats et pages ---------------------------------------------
      try {
        let W = App.WebSearch;
        if (W && typeof W.search === 'function' && !W.__sofiaSourcePolicy) {
          let os = W.search.bind(W);
          W.search = async function (query, opts) { return self.filterResults(await os(query, opts)); };
          W.__sofiaSourcePolicy = true;
        }
        if (W && typeof W.buildBlock === 'function' && !W.__sofiaSourcePolicyBlock) {
          let ob = W.buildBlock.bind(W);
          W.buildBlock = function (res, opts) {
            let s = ob(res, opts);
            let n = (res && res.russianBlocked) || 0;
            return n ? s + '\n' + self._prompt.withheld(n) : s;
          };
          W.__sofiaSourcePolicyBlock = true;
        }
        if (W && typeof W.renderCard === 'function' && !W.__sofiaSourcePolicyCard) {
          let oc = W.renderCard.bind(W);
          W.renderCard = function (res, opts) {
            let card = oc(res, opts);
            let n = (res && res.russianBlocked) || 0;
            if (card && n) {
              try {
                let foot = document.createElement('div');
                foot.style.cssText = 'margin-top:8px; font-size:11.5px; color:#a16207;';
                foot.textContent = self.t().cardNote(n);
                card.appendChild(foot);
              } catch (e) {}
            }
            return card;
          };
          W.__sofiaSourcePolicyCard = true;
        }
      } catch (e) { console.warn('[SourcePolicy] enveloppe recherche web échouée', e); }
      try {
        let V = App.WebVision;
        if (V && typeof V.ingestUrl === 'function' && !V.__sofiaSourcePolicy) {
          let oi = V.ingestUrl.bind(V);
          V.ingestUrl = async function (url, opts) {
            if (self.blocked(url)) {
              let h = self.hostOf(url) || '?';
              console.log('[SourcePolicy] page russe non ouverte : ' + h);
              try { if (App.UI && App.UI.showToast) App.UI.showToast(self.t().pageCard(h), 'info'); } catch (e) {}
              return { kind: 'page', blocked: true, url: String(url), host: h, title: '', excerpt: '', images: [], at: Date.now() };
            }
            return oi(url, opts);
          };
          V.__sofiaSourcePolicy = true;
        }
        if (V && typeof V.buildPageBlock === 'function' && !V.__sofiaSourcePolicyBlock) {
          let ob = V.buildPageBlock.bind(V);
          V.buildPageBlock = function (plan) { return (plan && plan.blocked) ? self._prompt.pageBlocked(plan.host || '?') : ob(plan); };
          V.__sofiaSourcePolicyBlock = true;
        }
        if (V && typeof V.renderCard === 'function' && !V.__sofiaSourcePolicyCard) {
          let oc = V.renderCard.bind(V);
          V.renderCard = function (meta, opts) {
            if (meta && meta.blocked) return self.pageNotice(meta.host);
            return oc(meta, opts);
          };
          V.__sofiaSourcePolicyCard = true;
        }
        // Une page verrouillée n'a pas d'images – la carte d'images du module ne
        // dessinerait donc rien du tout. C'est pourquoi CETTE enveloppe accroche la
        // petite plaque directement à la réponse (au même endroit où siège sinon la
        // carte), pour que l'utilisateur voie vraiment le verrou.
        if (V && typeof V.attachCardToMessage === 'function' && !V.__sofiaSourcePolicyAttach) {
          let oa = V.attachCardToMessage.bind(V);
          V.attachCardToMessage = function (botId, plan, opts) {
            if (plan && plan.blocked) {
              try {
                let card = self.pageNotice(plan.host);
                let host = document.querySelector('.messageRow[data-message-id="' + botId + '"] .msgText');
                if (host) host.appendChild(card);
                return card;
              } catch (e) { return null; }
            }
            return oa(botId, plan, opts);
          };
          V.__sofiaSourcePolicyAttach = true;
        }
      } catch (e) { console.warn('[SourcePolicy] enveloppe WebVision échouée', e); }
      this.localize();
      console.log('[SourcePolicy] actif – sources internet russes bloquées (' + this.HOSTS.length + ' Hosts, ' + (((App.Constants || {}).RUSSIA_BLOCKED_TLDS || []).length) + ' TLDs)');
    }
  };
  App.SourcePolicy.install();
