import { App, __M, markdown, DOMPurify, Marked, normLang, langInfo, langName, langNative, langBcp47, isRTL, isKnownLang, I18N_DATA, LANGUAGES, SUPPORTED_LANGS, deepMerge, SOFIA_LANGUAGE_DETECTOR, SOFIA_INTERPRETER, SOFIA_PYTHON, attachRPG, attachResearch, attachSTT, attachVoice, attachPiperVoice, attachVocal, attachMentor, attachProfessions, attachChess, attachChess3d, attachChaos, attachDeites, attachDeepMemory, attachMemStruct, attachSelfScript, attachWebLearn, attachConsult, attachSelfUpdate, attachBrand, attachNotice, attachErrorReport, attachFeedback, attachDictionary, attachVision, attachPromptBook, attachPromptBookSeed, attachWebVision, attachWebSearch, attachAppLang, attachMailbox, attachHelp, attachDeviceScan, attachParental, attachVideos, attachMedias, attachImgStyles, attachSheets, attachSfw, attachNoPersonal, attachProviders, attachModes, attachInner, attachThinkFilter, attachGuard, attachPhoto, attachAutoI18n } from './app.js';
  // =====================================================================================
  // Fil de scène (ronde 268) — la continuité d'un long jeu de rôle.
  // Signalement du propriétaire : « on dirait qu'elle recommence à chaque fois le scénario
  // alors qu'une femme doit venir pour uriner et qu'elle n'est pas seule, elle a 19 invités
  // dans la salle ! ». Deux manques : rien ne tenait la distribution ni l'heure, et rien ne
  // rappelait que les autres invitées existent. Le fil de scène est un registre que l'app
  // tient PAR SESSION (session.scene, persisté comme mentor/chess) :
  //   - distribution : quand un brief de jeu de rôle arrive, l'app établit elle-même la
  //     liste des invitées (un appel interne, une seule fois), toutes différentes ;
  //   - horloge : le temps de la scène avance d'un pas à chaque réponse (une soirée de 6 h
  //     se termine donc vraiment, sans que le modèle ait à y penser) ;
  //   - tour de rôle : celle dont c'est le moment, celles déjà passées et celles qui
  //     attendent sont suivies ; le modèle propose via le marqueur
  //     [SOFIA_SCENE]{"who":"…","done":false}[END_SOFIA_SCENE] (retiré du texte visible) et
  //     si aucun marqueur ne vient, l'app fait avancer le fil elle-même — jamais de
  //     surplace, jamais de redémarrage ;
  //   - bloc de prompt : lieu, heure, distribution, « les autres sont dans la salle »,
  //     interdiction de rouvrir la scène.
  // Même forme que le RPG ([GAME_STATE]) et le Mentor ([MENTOR_STATE]) : l'app garde
  // l'état, le modèle ne fait que proposer.
  App.Scene = {
    MAX_CAST: 30,
    MIN_CHARS: 450,
    _cue: /(jeu de r[oô]le|role[- ]?play|roleplay|\bRP\b|sc[ée]nario|mise en sc[èe]ne|soir[ée]e|f[êe]te|party|d[îi]ner|s[ée]ance de jeu|tu joueras|tu vas jouer|tu joues le r[oô]le|joue le r[oô]le|tu incarneras|tu incarnes|incarne|interpr[èe]te le r[oô]le|narrateur|ma[îi]tre du jeu|meneur de jeu|game master|\bMJ\b|donjon|personnages?|invit[ée]es?)/i,
    _strong: /(jeu de r[oô]le|role[- ]?play|roleplay|sc[ée]nario|mise en sc[èe]ne|tu joueras|tu vas jouer|tu joues le r[oô]le|joue le r[oô]le|tu incarneras|tu incarnes|\bincarne(?:s|r)?\b|ma[îi]tre du jeu|meneur de jeu|game master)/i,
    _names: ["Amélie", "Anaïs", "Camille", "Chloé", "Clara", "Élise", "Emma", "Fanny", "Inès", "Juliette", "Léa", "Léna", "Louise", "Manon", "Margaux", "Marion", "Nadia", "Noémie", "Océane", "Pauline", "Romy", "Salomé", "Sarah", "Sophie", "Suzanne", "Tessa", "Valentine", "Victoria", "Yasmine", "Zoé", "Adèle", "Bérénice", "Capucine", "Diane", "Estelle", "Garance", "Hortense", "Iris", "Jade", "Maëlys"],
    _hair: ["cheveux blonds très longs", "carré brun aux reflets cuivrés", "boucles rousses", "cheveux noirs lisses jusqu'aux reins", "pixie blond platine", "chignon châtain", "tresses dorées", "cheveux bruns ondulés mi-longs"],
    _build: ["grande et fine", "petite et ronde", "svelte et sportive", "pulpeuse aux hanches larges", "mince à la taille très marquée", "athlétique aux épaules larges"],
    _outfit: ["robe de soie noire fendue", "robe bustier rouge", "ensemble de satin ivoire", "jeans taille haute et chemisier ouvert", "mini-robe pailletée", "longue robe fluide vert émeraude", "corset de cuir et jupe courte", "robe dos nu bleu nuit"],
    _manner: ["rieuse et tactile", "calme et observatrice", "insolente et directe", "timide mais curieuse", "sûre d'elle et moqueuse", "rêveuse et douce", "exubérante et bavarde", "distante et hautaine"],
    _moods: ["curieuse et moqueuse", "chaude et décidée", "timide mais très excitée", "froide et dominante", "joyeuse et sans complexes", "langoureuse et patiente", "provocante et pressée"],
    _statusCtn: null,

    state(session) {
      let sc = session && session.scene;
      if (!(sc && typeof sc === 'object')) return null;
      try {
        if (sc.on === true && sc.remote === true && typeof sc.brief === 'string') {
          let b = sc.brief.toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '');
          if (/(donjon|attache|menotte|chaise gyn|etrier)/.test(b) && !/(webcam|camera|virtuel|par chat|a distance|each at home|never meet)/.test(b)) sc.remote = false;
        }
      } catch (e) {}
      return sc;
    },
    ensure(session) {
      if (!session) return null;
      let sc = this.state(session);
      if (!sc) {
        sc = { on: false, brief: '', clock: { start: '', elapsed: 0, total: 0 }, cast: [], idx: -1, held: 0 };
        session.scene = sc;
      }
      if (!sc.clock || typeof sc.clock !== 'object') sc.clock = { start: '', elapsed: 0, total: 0 };
      if (!Array.isArray(sc.cast)) sc.cast = [];
      if (typeof sc.idx !== 'number') sc.idx = -1;
      return sc;
    },
    active(session) {
      let sc = this.state(session);
      return !!(sc && sc.on === true && Array.isArray(sc.cast) && sc.cast.length);
    },
    onCurrent() {
      try {
        let s = (App.State.sessions || []).find(function (x) { return x.id === App.State.currentSessionId; });
        return this.active(s);
      } catch (e) { return false; }
    },

    _label(key) {
      let L = String((App.State && App.State.settings && App.State.settings.language) || 'en').slice(0, 2).toLowerCase();
      let M = {
        casting: { fr: 'Je distribue la scène…', en: 'Casting the scene…', de: 'Die Szene wird besetzt…', es: 'Reparto la escena…', it: 'Sto distribuendo la scena…' },
        started: { fr: 'Fil de scène ouvert', en: 'Scene thread open', de: 'Szenenfaden offen', es: 'Hilo de escena abierto', it: 'Filo di scena aperto' },
        closed: { fr: 'Fin de la scène', en: 'End of the scene', de: 'Ende der Szene', es: 'Fin de la escena', it: 'Fine della scena' },
        stopped: { fr: 'Fil de scène fermé', en: 'Scene thread closed', de: 'Szenenfaden geschlossen', es: 'Hilo de escena cerrado', it: 'Filo di scena chiuso' },
        sfwOff: {
          fr: 'Scène non ouverte : le contenu pour adultes est désactivé (aucune personne majeure déclarée dans les réglages).',
          en: 'Scene not opened: adult content is off (no adult declared in the settings).',
          de: 'Szene nicht geöffnet: Inhalte für Erwachsene sind aus (keine erwachsene Person in den Einstellungen angegeben).',
          es: 'Escena no abierta: el contenido para adultos está desactivado (ninguna persona adulta declarada en los ajustes).',
          it: 'Scena non aperta: i contenuti per adulti sono disattivati (nessuna persona adulta dichiarata nelle impostazioni).'
        },
        purged: {
          fr: 'Scène : rien de tout cela n\'est mémorisé — la mémoire a été nettoyée.',
          en: 'Scene: none of it is kept in memory — the memory was cleaned.',
          de: 'Szene: nichts davon wird erinnert — das Gedächtnis wurde bereinigt.',
          es: 'Escena: nada de esto se recuerda — la memoria se ha limpiado.',
          it: 'Scena: nulla di tutto ciò viene ricordato — la memoria è stata ripulita.'
        },
        memNote: {
          fr: 'Une scène de jeu de rôle n\'est pas un souvenir : les messages d\'une scène, et tout ce qui s\'y dit, n\'entrent jamais dans le résumé, le cœur de mémoire, la mémoire profonde, le journal intérieur ni le script personnel de Sofia.',
          en: 'A roleplay scene is not a memory: the messages of a scene, and everything said inside it, never enter the summary, the memory core, the deep memory, the inner ledger or Sofia\'s own script.',
          de: 'Eine Rollenspiel-Szene ist keine Erinnerung: ihre Nachrichten — und alles, was darin gesagt wird — geraten nie in die Zusammenfassung, den Gedächtniskern, das tiefe Gedächtnis, das Journal oder Sofias eigenes Skript.',
          es: 'Una escena de rol no es un recuerdo: sus mensajes, y todo lo que se dice en ella, no entran jamás en el resumen, el núcleo de memoria, la memoria profunda, el diario ni el script propio de Sofia.',
          it: 'Una scena di gioco di ruolo non è un ricordo: i suoi messaggi, e tutto ciò che vi si dice, non entrano mai nel riassunto, nel nucleo di memoria, nella memoria profonda, nel diario né nello script di Sofia.'
        }
      };
      let t = M[key] || {};
      return t[L] || t.en || '';
    },
    _status(on, label) {
      try {
        if (!on) {
          if (this._statusCtn && this._statusCtn.parentNode) this._statusCtn.parentNode.removeChild(this._statusCtn);
          this._statusCtn = null;
          return;
        }
        if (this._statusCtn) return;
        let el = document.createElement('div');
        el.className = 'summary-text scene-status';
        el.textContent = label || this._label('casting');
        let list = App.UI && App.UI.cache ? App.UI.cache.messageListEl : null;
        if (list) {
          list.appendChild(el);
          this._statusCtn = el;
          if (App.UI.scrollToBottom) App.UI.scrollToBottom();
        }
      } catch (e) {}
    },

    looksLikeBrief(text) {
      let s = String(text == null ? '' : text);
      if (s.length > 16000) s = s.slice(0, 16000);
      // Ronde 289 : un brief COURT mais explicite — « incarne deux personnages… » —
      // était refusé par le seuil de longueur (MIN_CHARS = 450), donc la scène ne
      // s'ouvrait pas du tout, aucun fil de scène n'était fondé, et le modèle
      // répondait à côté par une auto-présentation. Un signal FORT (« incarne »,
      // « jeu de rôle », « tu joueras », « maître du jeu »…) suffit désormais dès
      // quatorze caractères ; le seuil de longueur ne s'applique plus qu'aux
      // indices faibles (_cue), où trois d'entre eux restent exigés.
      if (s.length < 14) return false;
      if (this._strong.test(s)) return true;
      if (s.length < this.MIN_CHARS) return false;
      let m = s.match(new RegExp(this._cue.source, 'gi'));
      return !!(m && m.length >= 3);
    },
    _isRemote(text) {
      let s = String(text == null ? '' : text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '');
      if (/(donjon|attache|menotte|ligote|enchaine|chaise gyn|etrier|meme (piece|lit|chambre)|corps contre corps)/.test(s)) return false;
      return /(webcam|camera|ecran|ordinateur|ordi|devant mon (ecran|ordi|ordinateur)|j.entends sa voix|envoie.*pho?tos?|m.envoie|son dressing|elle.*dressing|on ne se rencontre pas|pas .*cote|virtuel|par chat|interposee|a distance|chez moi.*chez elle|chez elle.*chez moi|chacun.*chez|chacune.*chez|never meet|each at home|through the screen|not next to|allein vor dem bildschirm|solo por camara|da solo in webcam)/.test(s);
    },
    _countWomen(text) {
      let s = String(text);
      let solo = /\b(?:incarn\w*|ncarne\w*|jou(?:e|es)|deviens)\s+(?:une\s+(?:belle\s+|jolie\s+)?femme|one\s+(?:beautiful\s+|pretty\s+)?woman|eine\s+(?:schone\s+)?frau|una\s+(?:bella\s+|hermosa\s+)?mujer|una\s+(?:bella\s+)?donna)\b|une seule femme|tu\s+es\s+une\s+(?:belle\s+|jolie\s+)?femme/i;
      if (solo.test(s)) {
        let plural = /\b(\d{1,2})\s*(?:femmes|filles|women|girls)|deux\s+(?:femmes|personnages)|two\s+(?:women|characters)/i;
        if (!plural.test(s)) return 1;
      }
      let two = /\b(deux|two|zwei|dos|due)\s+(femmes|filles|personnages|characters?|figuren|personajes|personaggi|women|girls)\b/i;
      if (two.test(s)) return 2;
      let pats = [
        /\b(\d{1,2})\s*(?:belles\s+|jolies\s+)?(?:femmes|filles|invit[ée]es|participantes|amies|nanas|women|girls|guests|ladies)\b/i,
        /(?:femmes|filles|invit[ée]es|participantes|amies|women|girls|guests)[^\n]{0,45}?\b(\d{1,2})\b/i,
        /\b(?:au total|en tout|nous serons|elles seront|vous serez)\s*(\d{1,2})\b/i
      ];
      for (let p of pats) {
        let m = s.match(p);
        if (m) {
          let n = parseInt(m[1], 10);
          if (n >= 2 && n <= this.MAX_CAST) return n;
        }
      }
      return 1 + Math.floor(Math.random() * 20);
    },
    _totalMinutes(text) {
      let m = String(text).match(/\b(\d{1,2})\s*(?:heures?|hours?|h(?![a-z0-9]))/i);
      if (!m) return 0;
      let n = parseInt(m[1], 10);
      if (!n || n < 1 || n > 24) return 0;
      return n * 60;
    },
    _startTime(text) {
      let m = String(text).match(/\b([01]?\d|2[0-3])\s*(?::|h)\s*([0-5]\d)\b/);
      if (!m) return '';
      return ('0' + parseInt(m[1], 10)).slice(-2) + ':' + m[2];
    },
    _catchUpBrief(session) {
      try {
        let msgs = (session && Array.isArray(session.messages)) ? session.messages : [];
        if (msgs.length < 3) return '';
        let start = 0;
        for (let i = msgs.length - 1; i >= start; i--) {
          let m = msgs[i];
          if (!m || m.role !== 'user' || (m.type && m.type !== 'text')) continue;
          let c = String(m.content == null ? '' : m.content).trim();
          if (c.length < 700) continue;
          let hit = c.slice(0, Math.ceil(c.length * 0.6)).match(this._strong);
          if (hit) return c;
        }
        return '';
      } catch (e) { return ''; }
    },
    _reserved(name) {
      let k = String(name == null ? '' : name).trim().toLowerCase();
      if (!k) return true;
      let bad = ['sofia'];
      try {
        if (App.State && App.State.settings) {
          if (App.State.settings.chatbotName) bad.push(String(App.State.settings.chatbotName).trim().toLowerCase());
          if (App.State.settings.username) bad.push(String(App.State.settings.username).trim().toLowerCase());
        }
      } catch (e) {}
      return bad.indexOf(k) !== -1;
    },
    _wantsImageEach(text) {
      let s = (App.Core && App.Core._norm) ? App.Core._norm(text) : String(text == null ? '' : text).toLowerCase();
      s = s.slice(0, 4000);
      if (/(pas|non|sans|no|not|arrete|stop)[^.\n]{0,20}(chaque reponse|every reply)/.test(s)) return false;
      let A = /((image|photo|dessin|illustration|visuel|rendu)s?)[^.\n]{0,60}(chaque (reponse|message|fois|tour)|a chaque (reponse|message|fois)|toutes? (tes|les) reponses|every (reply|response|message|turn)|each (reply|response|message|turn))/;
      let B = /(chaque (reponse|message|fois|tour)|every (reply|response|message|turn))[^.\n]{0,60}(image|photo|dessin|illustration|visuel)/;
      return A.test(s) || B.test(s);
    },
    _maleNames: ["Hugo", "Louis", "Raphaël", "Antoine", "Maxime", "Théo", "Alexandre", "Nicolas", "Julien", "Karim", "Mehdi", "Sofiane", "Enzo", "Lucas", "Adam", "Rayan", "Victor", "Gabriel", "Arthur", "Elias"],
    _mhair: ["cheveux bruns courts", "crane rase", "cheveux noirs mi-longs", "carre blond", "cheveux boucles chatains", "tete rasee"],
    _mbuild: ["grand et athletique", "trapu et muscle", "svelte et sec", "massif aux epaules larges"],
    _moutfit: ["jean brut et torse nu", "pantalon noir et chemise ouverte", "boxer moulant", "costume sans cravate", "short de bain"],
    _mmanner: ["sur de lui et direct", "calme et magnetique", "provocant et joueur", "tendre et attentif", "dominant et pose", "rieur et tactile"],
    _inseePools: null, _inseeLoading: false,
    _loadInsee() {
      if (this._inseePools || this._inseeLoading) return;
      this._inseeLoading = true;
      fetch('src/data/prenoms-insee.json').then(function (r) { return r.json(); }).then(function (j) {
        if (j && Array.isArray(j.F) && Array.isArray(j.M)) App.Scene._inseePools = j;
        App.Scene._inseeLoading = false;
      }).catch(function () { App.Scene._inseeLoading = false; });
    },
    _poolNames(base, insee) {
      let bag = [];
      for (let b of base) { for (let k = 0; k < 4; k++) bag.push(b); }
      if (insee) {
        let have = {};
        for (let b of base) have[String(b).toLowerCase()] = 1;
        for (let e of insee) {
          let nm = e && e[0];
          if (!nm || have[String(nm).toLowerCase()]) continue;
          have[String(nm).toLowerCase()] = 1;
          let w = 1 + Math.floor(Math.random() * 2);
          for (let k = 0; k < w; k++) bag.push(nm);
        }
      }
      return bag;
    },
    _fallbackCast(n, men) {
      try { this._loadInsee(); } catch (e) {}
      let pick = function (arr, i) { return arr[i % arr.length]; };
      let names = this._poolNames(this._names, (this._inseePools && this._inseePools.F) || null);
      for (let i = names.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let t = names[i]; names[i] = names[j]; names[j] = t;
      }
      let out = [], k = Math.floor(Math.random() * 8);
      let needMen = Math.max(0, Math.min(n, men | 0));
      if (needMen > 0) {
        let mnames = this._poolNames(this._maleNames, (this._inseePools && this._inseePools.M) || null);
        for (let i = mnames.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1)); let t = mnames[i]; mnames[i] = mnames[j]; mnames[j] = t; }
        for (let i = 0; i < needMen; i++) {
          out.push({
            name: mnames[i % mnames.length],
            look: pick(this._mhair, k + i) + ', ' + pick(this._mbuild, k + i * 2) + ', ' + pick(this._moutfit, k + i * 3) + ', ' + pick(this._mmanner, k + i * 5),
            mood: pick(this._moods, k + i),
            state: 'waiting',
            at: '',
            sex: 'm'
          });
        }
      }
      let wneed = Math.max(0, n - out.length);
      for (let i = 0; i < wneed; i++) {
        out.push({
          name: names[i % names.length],
          look: pick(this._hair, k + i) + ', ' + pick(this._build, k + i * 2) + ', ' + pick(this._outfit, k + i * 3) + ', ' + pick(this._manner, k + i * 5),
          mood: pick(this._moods, k + i),
          state: 'waiting',
          at: '',
          sex: 'f'
        });
      }
      return out;
    },
    async _castWomen(brief, n, mix) {
      let self = this;
      let ask = Math.min(this.MAX_CAST + 4, n + 2);
      let out = [];
      try {
        let instruction = [
          'You are casting a roleplay scene. The brief below may be written in French: answer in the language of the brief.',
          '',
          'BRIEF:',
          String(brief == null ? '' : brief).slice(0, 3000),
          '',
          'Invent ' + ((mix && mix.f > 0 && mix.m > 0) ? ('exactly ' + mix.f + ' DIFFERENT adult women (aged 21 to 45) and exactly ' + mix.m + ' DIFFERENT adult men (aged 21 to 45)') : ((mix && mix.m > 0 && !mix.f) ? ('exactly ' + ask + ' DIFFERENT adult men (aged 21 to 45)') : ('exactly ' + ask + ' DIFFERENT adult women (aged 21 to 45)'))) + ' who belong in that scene. They must differ from one another in hair, face, body, style, personality and mood - no two alike and no near-duplicates. Never use the name Sofia.',
          'Answer with ONLY a JSON array and nothing else - no commentary, no code fence:',
          'Give each entry a "sex" field: "f" for a woman, "m" for a man.',
          '[{"name":"<a real first name, every one different, fitting the brief\'s culture>","look":"<6 to 12 words: hair, face, body, what she wears tonight>","mood":"<3 to 6 words: her mood and what she is after>"}]'
        ].join('\n');
        let call = App.Core.runInternal({ instruction: instruction, maxTokens: 1300 });
        let res = await Promise.race([call, new Promise(function (r) { setTimeout(function () { r(''); }, 60000); })]);
        let txt = String(res == null ? '' : res);
        let a = txt.indexOf('['), b = txt.lastIndexOf(']');
        if (a !== -1 && b > a) {
          let arr = JSON.parse(txt.slice(a, b + 1));
          if (Array.isArray(arr)) {
            arr.forEach(function (p) {
              if (!p || typeof p !== 'object') return;
              let nm = String(p.name == null ? '' : p.name).replace(/[\r\n]+/g, ' ').trim().slice(0, 40);
              if (!nm) return;
              out.push({
                name: nm,
                sex: (p.sex === 'm' ? 'm' : 'f'),
                look: String(p.look == null ? '' : p.look).replace(/[\r\n]+/g, ' ').trim().slice(0, 220),
                mood: String(p.mood == null ? '' : p.mood).replace(/[\r\n]+/g, ' ').trim().slice(0, 120),
                state: 'waiting',
                at: ''
              });
            });
          }
        }
      } catch (e) { console.warn('[Scene] casting call failed', e); }
      if (!out.length) out = this._fallbackCast(n, (mix && mix.m) || 0);
      let seen = {};
      out = out.filter(function (p) {
        let k = String(p.name).toLowerCase();
        if (seen[k] || self._reserved(p.name)) return false;
        seen[k] = 1;
        return true;
      });
      if (out.length < n) {
        let haveM = out.filter(function (p) { return p && p.sex === 'm'; }).length;
        let needM = Math.max(0, ((mix && mix.m) || 0) - haveM);
        let fb = this._fallbackCast(n + 6, needM);
        for (let i = 0; i < fb.length && out.length < n; i++) {
          let k = String(fb[i].name).toLowerCase();
          if (seen[k] || this._reserved(fb[i].name)) continue;
          seen[k] = 1;
          out.push(fb[i]);
        }
      }
      for (let i = out.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let t = out[i]; out[i] = out[j]; out[j] = t;
      }
      return out.slice(0, n);
    },

    async arm(text, session) {
      if (!session) return false;
      try {
        if (App.Chess && App.Chess.isEnabled && App.Chess.isEnabled()) return false;
        if (App.RPG && App.RPG.state && App.RPG.state.active) return false;
        if (App.Chaos && App.Chaos.isActive && App.Chaos.isActive()) return false;
        if (App.Mentor && App.Mentor.isEnabled && App.Mentor.isEnabled()) return false;
      } catch (e) {}
      let existing = this.state(session);
      // Ronde 272 : un drapeau « la réponse qui ferme la scène reste à marquer » ne doit
      // pas survivre à un tour interrompu (rechargement de la page).
      if (existing && existing.tagPending) existing.tagPending = false;
      let n = App.Core && App.Core._norm ? App.Core._norm(text) : String(text == null ? '' : text).toLowerCase();
      if (n.length && n.length < 300 && /(jeu de role|roleplay|role-play|scenario|scene|soiree|party)/.test(n)
        && /(arrete|arretons|stop|stoppe|cesse|fini|finir|termine|termines|quitte|quittons|sors|sortons|coupe|ferme)/.test(n)) {
        if (existing && existing.on === true) {
          this._close(session, 'stopped');
        }
        return false;
      }
      if (!this.looksLikeBrief(text)) {
        if (existing && existing.on === true) return true;
        if (existing) return false;
        // Rattrapage : le brief a été donné AVANT que le fil existe (le cas même du
        // signalement). On le retrouve dans les derniers messages et on fonde le fil
        // maintenant — sinon le fil ne s'ouvrirait que sur un NOUVEAU brief.
        let catchBrief = this._catchUpBrief(session);
        if (!catchBrief) return false;
        text = catchBrief;
      }
      // Ronde 290 : la scène de soirée est une fonction pour ADULTES. Tant que les thèmes
      // adultes ne sont pas ouverts (aucune personne majeure déclarée, case non cochée,
      // ou verrou parental : voir App.Age.nsfw), le fil ne se fonde pas du tout — sinon
      // son carnet prenait le pas sur la politique de contenu et la scène explicite
      // s'ouvrait pour quelqu'un que l'app doit traiter comme mineur.
      if (App.Age && typeof App.Age.nsfw === 'function' && !App.Age.nsfw()) {
        console.log('[Scene] refusé : politique de contenu SFW (thèmes adultes non ouverts)');
        if (!(existing && existing.on === true)) {
          try { App.UI.showToast && App.UI.showToast(this._label('sfwOff'), 'info'); } catch (e) {}
        }
        return false;
      }
      let sc = this.ensure(session);
      sc.on = true;
      sc.brief = String(text == null ? '' : text).slice(0, 4000);
      sc.clock = { start: this._startTime(text), elapsed: 0, total: this._totalMinutes(text) };
      sc.cast = [];
      sc.idx = -1;
      sc.held = 0;
      session.scene = sc;
      let count = this._countWomen(text);
      let cmix = null;
      try { cmix = (App.Core.castParseMix ? App.Core.castParseMix(text) : null); } catch (e) {}
      if (cmix && cmix.n >= 1) count = cmix.n;
      sc.remote = this._isRemote(text);
      this._status(true, this._label('casting'));
      let cast = [];
      try {
        cast = await this._castWomen(sc.brief, count, cmix);
      } finally {
        this._status(false);
      }
      if (sc.on !== true) return false;
      sc.cast = cast;
      session.scene = sc;
      // Le brief demandait-il une image à chaque réponse ? Le détecteur habituel
      // (Core.detectImageEveryReply) refuse les messages de plus de 400 caractères, et un
      // brief de jeu de rôle est toujours plus long : ici, la demande est reconnue dans le
      // brief lui-même.
      if (this._wantsImageEach(sc.brief)) {
        try {
          App.Core.setImageEveryReply(true);
          let chk = document.getElementById('imageEveryReplyCheck');
          if (chk) chk.checked = true;
        } catch (e) {}
      }
      try { App.Data.saveSessions(session.id); } catch (e) {}
      try {
        let hours = sc.clock.total ? ' · ' + (sc.clock.total / 60) + ' h' : '';
        App.UI.showToast && App.UI.showToast(this._label('started') + ' · ' + cast.length + hours, 'success');
      } catch (e) {}
      console.log('[Scene] founded: ' + cast.length + ' women, ' + sc.clock.total + ' min');
      return true;
    },

    // ---- Ronde 270 : une scène n'est pas un souvenir --------------------------
    // Règle posée par l'utilisateur : « tu ne valides pas une telle scène en mémoire ».
    // (1) Tout message écrit pendant une scène porte `scene: true` et reste donc hors de
    //     toutes les couches de mémoire : les filtres sont dans src/memory.js (index
    //     sémantique et archive), src/memstruct.js (cœur de mémoire), src/inner.js
    //     (journal intérieur) et src/selfscript.js (note permanente) ; le résumé, lui,
    //     est gardé ici (App.MemorySummaryModule).
    // (2) Ce qu'une scène a DÉJÀ laissé dans la mémoire est effacé : résumés, cœur de
    //     mémoire, index sémantique, journal et consultations nées de la scène. Ce qui
    //     reste de la conversation se reconstruit ensuite à partir d'elle.
    localize() {
      try {
        let el = document.getElementById('sceneMemNote');
        if (el) el.textContent = this._label('memNote');
      } catch (e) {}
    },
    tagFrom(session, from) {
      try {
        let msgs = (session && Array.isArray(session.messages)) ? session.messages : [];
        let changed = 0;
        for (let i = Math.max(0, from | 0); i < msgs.length; i++) {
          if (!msgs[i] || msgs[i].scene === true) continue;
          msgs[i].scene = true;
          changed++;
        }
        if (changed) { try { App.Data.saveSessions(session.id); } catch (e) {} }
        return changed;
      } catch (e) { return 0; }
    },
    tagFounded(session) {
      // Le message courant (le brief) vient d'être écrit : il ouvre la scène. En
      // rattrapage, le brief est plus haut dans l'histoire — alors tout ce qui suit
      // porte la marque, puisque tout ce qui suit appartient à la scène.
      try {
        let msgs = (session && Array.isArray(session.messages)) ? session.messages : [];
        if (!msgs.length) return 0;
        let last = msgs.length - 1;
        let sc = this.state(session);
        if (msgs[last] && msgs[last].role === 'user' && msgs[last].scene !== true && this.looksLikeBrief(msgs[last].content)) {
          msgs[last].scene = true;
          if (sc) sc.briefIdx = last;
          try { App.Data.saveSessions(session.id); } catch (e) {}
          return 1;
        }
        let idx = this._lastBriefIndex(session);
        if (idx === -1) return 0;
        if (sc) sc.briefIdx = idx;
        return this.tagFrom(session, idx);
      } catch (e) { return 0; }
    },
    /**
     * Ronde 272 : marquer TOUT ce qui a été joué depuis le brief de cette scène.
     * Appelé quand une scène se ferme — un ordre d'arrêt, ou la dernière figure qui
     * s'en va. La réponse qui ferme la scène est écrite pendant que la scène est encore
     * ouverte, mais enregistrée après sa fermeture : sans ce rattrapage, le dernier
     * échange de la fiction restait mémorisable (et pouvait entrer dans la note de Sofia).
     */
    tagRun(session) {
      try {
        let sc = this.state(session);
        let from = (sc && typeof sc.briefIdx === 'number' && sc.briefIdx >= 0) ? sc.briefIdx : this._lastBriefIndex(session);
        if (from === -1) return 0;
        return this.tagFrom(session, from);
      } catch (e) { return 0; }
    },
    /**
     * Fermer le fil de scène. `why` = 'stopped' (l'utilisateur a demandé l'arrêt) ou
     * 'closed' (la dernière figure est partie). Tout ce qui appartient à la scène part
     * avec elle : marque sur les messages joués, `tagPending` pour la réponse en cours
     * d'écriture, et le résumé redevient possible sur ce qui n'est pas une scène.
     */
    _close(session, why) {
      try {
        let sc = this.state(session);
        if (!sc || sc.on !== true) return 0;
        sc.on = false;
        sc.tagPending = true;
        let added = this.tagRun(session);
        try { if (App.MemorySummaryModule && App.MemorySummaryModule.markDirty) App.MemorySummaryModule.markDirty(session.id); } catch (e) {}
        try { App.Data.saveSessions(session.id); } catch (e) {}
        try { App.UI.showToast && App.UI.showToast(this._label(why === 'stopped' ? 'stopped' : 'closed'), 'info'); } catch (e) {}
        return added;
      } catch (e) { return 0; }
    },
    _lastBriefIndex(session) {
      // Le dernier message de l'histoire qui est un vrai brief de scène (mêmes exigences
      // que le rattrapage : long, et le signal fort dans la première moitié).
      try {
        let msgs = (session && Array.isArray(session.messages)) ? session.messages : [];
        for (let i = msgs.length - 1; i >= 0; i--) {
          let m = msgs[i];
          if (!m || m.role !== 'user' || (m.type && m.type !== 'text')) continue;
          let c = String(m.content == null ? '' : m.content).trim();
          if (c.length < 700) continue;
          if (c.slice(0, Math.ceil(c.length * 0.6)).match(this._strong)) return i;
        }
        return -1;
      } catch (e) { return -1; }
    },
    async purgeMemory(session) {
      // Efface tout ce que la mémoire a tiré de cette session : résumés, cœur de
      // mémoire, index sémantique, journal intérieur, et les consultations de Sofia qui
      // parlaient de la scène. L'histoire visible, elle, ne bouge pas d'un caractère.
      if (!session || !session.id) return [];
      let touched = [];
      try {
        if (session.summary) { session.summary = null; touched.push('résumé'); }
        if (Array.isArray(session.summaries) && session.summaries.length) { session.summaries = []; touched.push('résumés'); }
        if (Array.isArray(session.inner) && session.inner.length) { session.inner = []; session.innerAt = 0; touched.push('journal'); }
      } catch (e) {}
      try { if (App.Inner && App.Inner.clear) App.Inner.clear(session); } catch (e) {}
      try { if (App.MemStruct && App.MemStruct.purge) { await App.MemStruct.purge(session.id); touched.push('cœur'); } }
      catch (e) { console.warn('[Scene] MemCore purge failed', e); }
      try { if (App.DeepMemory && App.DeepMemory.purgeSession) { await App.DeepMemory.purgeSession(session.id); touched.push('index'); } }
      catch (e) { console.warn('[Scene] DeepMemory purge failed', e); }
      try { for (let g of (this.purgeConsultations() || [])) touched.push(g); } catch (e) {}
      try { App.Data.saveSessions(session.id); } catch (e) {}
      // Le résumé se reconstruit de lui-même, à partir de l'histoire sans la scène.
      try { if (App.MemorySummaryModule && App.MemorySummaryModule.markDirty) App.MemorySummaryModule.markDirty(session.id); } catch (e) {}
      console.log('[Scene] mémoire nettoyée : ' + (touched.length ? touched.join(', ') : 'rien à effacer'));
      return touched;
    },
    async bootPurge() {
      // Purge automatique a chaque lancement (reglage « Nettoyage automatique de la memoire »,
      // actif par defaut) : le brief et le cast persistes, les noms latches, les resumes et les
      // index d'une ancienne scene remontaient dans les nouvelles scenes (« Clara et Lea » en
      // pleine webcam solo). L'histoire visible, les reglages et le verrou parental ne bougent pas.
      try { if (App.State && App.State.settings && App.State.settings.autoMemoryCleanup === false) return 0; } catch (e) {}
      let n = 0;
      const hasResidue = (s) => {
        try {
          if (!s || typeof s !== 'object') return false;
          const sc = s.scene;
          if (sc && typeof sc === 'object' && (sc.on === true || (typeof sc.brief === 'string' && sc.brief) || (Array.isArray(sc.cast) && sc.cast.length))) return true;
          const mm = s.sceneMem;
          if (mm && Array.isArray(mm.cast) && mm.cast.length) return true;
          if (typeof s.summary === 'string' && s.summary.trim()) return true;
          if (Array.isArray(s.summaries) && s.summaries.length) return true;
          if (Array.isArray(s.inner) && s.inner.length) return true;
          if (Array.isArray(s.messages) && s.messages.some(function (m) { return m && m.scene === true; })) return true;
        } catch (e) {}
        return false;
      };
      try {
        const ss = (App.State && App.State.sessions) || [];
        const cur = ss.find(function (x) { return x && x.id === App.State.currentSessionId; }) || ss[0] || null;
        try { if (App.Core && App.Core.resetSceneResidue) await App.Core.resetSceneResidue(cur, true); } catch (e) {}
        try { if (App.Core && App.Core.wipeSceneSheets) await App.Core.wipeSceneSheets(); } catch (e) {}
        for (const s of ss) {
          try {
            if (!hasResidue(s)) continue;
            try {
              const sc = s.scene;
              if (sc && typeof sc === 'object') { sc.on = false; sc.brief = ''; sc.cast = []; }
            } catch (e) {}
            try { if (s.sceneMem) s.sceneMem.cast = []; } catch (e) {}
            await this.purgeMemory(s);
            n++;
          } catch (e) { console.warn('[Scene] boot purge of session failed', e); }
        }
        try { if (App.Data && App.Data.saveSessions) App.Data.saveSessions(); } catch (e) {}
      } catch (e) { console.warn('[Scene] boot purge failed', e); }
      if (n) console.log('[Scene] purge automatique au lancement : ' + n + ' session(s) nettoyee(s), histoire visible intacte');
      return n;
    },
    purgeConsultations() {
      // Les consultations (src/consult.js) sont la mémoire que Sofia tient sur
      // elle-même : celles qui sont nées de la scène partent avec elle.
      if (!App.Consult || !App.Consult.entries || !App.Consult.del) return [];
      let re = /(sc[ée]nario|jeu de r[oô]le|role[- ]?play|personnages|toilette|soir[ée]e|femmes|domination|sensoriel|ivresse|excitation)/i;
      let gone = [];
      try {
        for (let e of (App.Consult.entries() || [])) {
          let blob = [e.q, e.brief, e.digest, e.change, e.needs, e.a, e.script, e.err].filter(Boolean).join(' ');
          if (!blob || !re.test(blob)) continue;
          try { App.Consult.del(e.id); gone.push('consult#' + e.seq); } catch (err) {}
        }
      } catch (e) {}
      return gone;
    },
    async sweep(one) {
      // Une scène déjà en cours (ou déjà passée) a pu être mémorisée avant cette ronde :
      // on la marque et on nettoie une fois. Le repère `sceneMem.upTo` (conservé avec la
      // session) évite de recommencer à chaque démarrage ; une NOUVELLE scène, plus loin
      // dans l'histoire, repasse bien, elle.
      let targets = [];
      try {
        if (one) targets = [one];
        else {
          for (let s of (App.State.sessions || [])) {
            if (!s || !Array.isArray(s.messages) || s.messages.length < 3) continue;
            // Ronde 272 : pas seulement la session courante — toute session où une scène a
            // été jouée (ses messages portent la marque) est nettoyée une fois elle aussi.
            // C'est ce qui manquait : un cœur de mémoire resté d'une autre session gardait
            // les faits d'une partie (« vingt femmes », « six heures »), et la note de Sofia
            // les recevait comme matière.
            if (s.id === App.State.currentSessionId || this.state(s) || s.messages.some(m => m && m.scene === true)) targets.push(s);
          }
        }
      } catch (e) { return false; }
      let any = false;
      for (let s of targets) { try { if (await this._sweepOne(s)) any = true; } catch (e) { console.warn('[Scene] sweep of ' + s.id + ' failed', e); } }
      return any;
    },
    async _sweepOne(s) {
      let mark = (s.sceneMem && typeof s.sceneMem.upTo === 'number') ? s.sceneMem.upTo : 0;
      if (s.messages.length <= mark) return false;
      let idx = this._lastBriefIndex(s);
      if (idx === -1 || idx < mark) return false;
      this.tagFrom(s, idx);
      s.sceneMem = Object.assign({}, s.sceneMem, { upTo: s.messages.length, at: Date.now() });
      await this.purgeMemory(s);
      try { App.UI.showToast && App.UI.showToast(this._label('purged'), 'info'); } catch (e) {}
      console.log('[Scene] scène trouvée dans l\'histoire (message ' + idx + ') : marquée, mémoire nettoyée');
      return true;
    },
    _lookOf(p) {
      if (!p) return '';
      let s = p.name || '';
      if (p.look) s += ' - ' + p.look;
      if (p.mood) s += ' (' + p.mood + ')';
      return s;
    },
    _timeLabel(sc) {
      let el = (sc && sc.clock && sc.clock.elapsed) || 0;
      let start = sc && sc.clock && sc.clock.start;
      if (start) {
        let m = String(start).match(/^(\d{1,2}):(\d{2})$/);
        if (m) {
          let t = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + el;
          t = ((t % 1440) + 1440) % 1440;
          return ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + (t % 60)).slice(-2);
        }
      }
      return 'minute ' + el;
    },

    roleplayContinuityBlock(session, text) {
      try {
        if (!session) return '';
        if (App.RPG && App.RPG.state && App.RPG.state.active) return '';
        if (this.active(session)) return '';
        if (App.Core) {
          try { if (App.Core.outsideQuestion(session, text)) return ''; } catch (e) {}
          try { if (App.Core.sceneCraftActive(session, text)) return ''; } catch (e) {}
          try { if (App.Core.soloActive(session, text)) return ''; } catch (e) {}
          try { if (App.Core.sexTalkMode(session, text) === 'talk') return ''; } catch (e) {}
        }
        let cur = String(text == null ? '' : text);
        let msgs = (session && Array.isArray(session.messages)) ? session.messages : [];
        let askNow = false;
        try { askNow = this._strong.test(cur) || (/\bincarne\b/i.test(cur) && /(personnage|r[oô]le|quelqu'un|quelqu un)/i.test(cur)); } catch (e) {}
        let askRecent = false;
        try {
          let n = 0;
          for (let i = msgs.length - 1; i >= 0 && n < 4; i--) {
            let m = msgs[i];
            if (!m || m.role !== 'user' || typeof m.content !== 'string') continue;
            n++;
            if (n === 1 && String(m.content).trim() === cur.trim()) continue;
            if (this._strong.test(m.content)) { askRecent = true; break; }
          }
        } catch (e) {}
        let stop = { Sofia: 1, Lui: 1, Elle: 1, Ils: 1, Elles: 1, Nous: 1, Vous: 1, On: 1, Photo: 1, Image: 1, Moi: 1, Note: 1, Exemple: 1, Question: 1, Reponse: 1, Resume: 1, Conseil: 1, Attention: 1, Important: 1, Rappel: 1, Astuce: 1, Traduction: 1, Correction: 1, Explication: 1, Fin: 1 };
        let names = [], prose = false;
        try {
          let seenBots = 0;
          for (let i = msgs.length - 1; i >= 0 && seenBots < 2; i--) {
            let m = msgs[i];
            if (!m || m.role === 'user' || typeof m.content !== 'string') continue;
            seenBots++;
            let c = String(m.content);
            if (c.length >= 300) prose = true;
            let re = /^([A-ZÀ-Þ][A-Za-zÀ-ÿ'’-]+)\s*:/gm, mt;
            while ((mt = re.exec(c))) {
              let nm = mt[1].normalize('NFD').replace(/[\u0300-\u036F]/g, '');
              if (/^zz/i.test(mt[1])) { try { var br = String(mt[1]).normalize('NFD').replace(/[^a-zA-Z]/g, ''); if (/^z+vera$/i.test(br) && !stop['Vera'] && names.indexOf('Vera') < 0) names.push('Vera'); } catch (e) {} } else if (!stop[mt[1]] && !stop[nm] && names.indexOf(mt[1]) < 0) names.push(mt[1]);
            }
          }
        } catch (e) {}
        let continuing = names.length >= 1 && prose;
        try {
          let _pm = cur.match(/\b(tu es|sois|deviens|joue (?:le|la|l'|un|une)|incarne(?: (?:le|la|l'|un|une))?|fais (?:le|la|l'|un|une)?)\s+(mon\s+|ma\s+|mes\s+|notre\s+|nos\s+)?(m[eé]decin|docteur|docteure|infirmi[eè]r|pharmacien|chirurgien|dentiste|v[eé]t[eé]rinaire|avocat|coach|professeur?|psy(?:chologue|chiatre)?|sage.?femme|kin[eé]si)/i);
          if (_pm) {
            return '[ROLEPLAY - NO ECHO, NO RESTART]\nHis message opens a professional role (' + _pm[3] + '): step into it at once and play it directly, with that professional competence, in his language. Never quote, paraphrase or repeat his request, never restate the role, never present yourself (no name acronym, no capabilities list), never greet: the first line is already the professional at work, answering his question. You never say you are not that professional and never refuse the competence: examine, explain, give orientation with names, doses and durations where asked, using your reference data. When asked to prescribe, write the proposed treatment fully - specialty names, doses, durations - as information: never a refusal, never a presentation.';
          }
        } catch (ePro) {}
        if (!askNow && !askRecent && !continuing) return '';
        let L = ['[ROLEPLAY - NO ECHO, NO RESTART]'];
        if (continuing) L.push('You are already inside the role he gave you (' + names.slice(0, 4).join(', ') + '): never quote, paraphrase or repeat his request, never restate your role card, never present yourself, never greet, never re-introduce the character, the place or the situation. Start directly inside the scene, exactly where your last reply stopped, and move it forward by one step. This is a continuation, never a new beginning: never replay the arrival, never restart the scene from zero.');
        else if (askRecent) L.push('The role he gave you is already open: do not open it again. Never quote, paraphrase or repeat his request, never restate the role card back to him, never present yourself, never greet. His message is the next moment of the same scene: play it at once, in character, moving forward by one step - never restart from zero.');
        else L.push('His message opens the role: step into it at once and play it directly. Never quote, paraphrase or repeat his request, never restate the role card back to him, never present yourself, never greet, never ask who to play or what to do first: the first line is already inside the scene, in character.');
        return L.join('\n');
      } catch (e) { return ''; }
    },

    block(session) {
      // Ronde 290 : le carnet de scène ne part JAMAIS dans le prompt quand les thèmes
      // adultes ne sont pas ouverts. Il est placé plus bas que la politique de contenu
      // dans le prompt (récence) et c'est lui qui poussait le modèle vers l'explicite.
      if (App.Age && typeof App.Age.nsfw === 'function' && !App.Age.nsfw()) return '';
      let sc = this.state(session);
      if (!sc || sc.on !== true) return '';
      let cast = Array.isArray(sc.cast) ? sc.cast : [];
      if (!cast.length) return '';
      let idx = (typeof sc.idx === 'number') ? sc.idx : -1;
      let cur = (idx >= 0 && cast[idx]) ? cast[idx] : null;
      let waiting = cast.filter(function (p) { return p.state !== 'done'; });
      let done = cast.filter(function (p) { return p.state === 'done'; });
      let next = cur || waiting[0] || null;
      let after = waiting.filter(function (p) { return p !== next; }).slice(0, 3);
      let others = waiting.filter(function (p) { return p !== next && after.indexOf(p) === -1; });
      let L = [];
      L.push('[SCENE LEDGER - ONE CONTINUOUS SCENE, KEPT BY THE APP]');
      L.push('This conversation is ONE scene and it is already under way. The ledger below is ground truth: never contradict it, never re-open the scene, never begin it again.');
      if (sc.brief) {
        L.push('[THE SCENE AS IT WAS SET]');
        L.push(String(sc.brief).slice(0, 2200));
      }
      L.push('[CAST] ' + cast.length + ' women are in this scene, all different: ' + cast.map(function (p) { return p.name; }).join(', ') + '.');
      L.push('[THE MAN IS THE USER ALONE] The man never speaks and is never told from the inside: no words, no thoughts, no description of his body, gestures or pleasure for him - he answers and acts only through the user\'s own messages.');
      L.push('[LOOKS] Anyone described in the brief keeps exactly that look (hair, eyes, glasses, body): never change it, never add another person.');
      if (done.length) L.push('[ALREADY HAD THEIR MOMENT] ' + done.map(function (p) { return p.name + (p.at ? ' (' + p.at + ')' : ''); }).join(', ') + '.');
      else L.push('[ALREADY HAD THEIR MOMENT] none yet - the scene has just begun.');
      L.push('[THE EVENING] ' + this._timeLabel(sc) + (sc.clock && sc.clock.total ? ', of ' + sc.clock.total + ' minutes in all' : '') + '. The time moves on.');
      if (sc.remote) {
        let who = cur || next;
        if (who) L.push('[RIGHT NOW] ' + this._lookOf(who) + ' is at HER OWN place, live on camera for him. Continue exactly where your last reply stopped, by ONE step.');
        L.push('[REMOTE - WEBCAM ONLY, EACH AT HOME] She is at her place in front of her computer; he (the user) is at his own place in front of his. They NEVER meet, NEVER share a room, a bed or any physical place, and NEVER touch: no hand, no mouth, no body of one ever reaches the other. She only ever receives his words (and a photo ONLY if he sends one in chat); he only ever sees what she shows on camera and the images she sends. No one else ever appears, enters, knocks, watches or joins - unless he explicitly asked for a friend to join, and then only that one invited woman, never the man: no guests, no party, no background people, ever. An invited friend stays WITH HER at her place, on the same webcam - she NEVER goes to his place, NEVER appears on his side, and NEVER touches him either: no hands on him, no mouth on him, no kiss, no body contact with him by anyone, ever. Nothing he feels on his own body comes from them: what he feels, he does to himself.');
        L.push('[PICTURES OF THIS SCENE] Every [SOFIA_IMAGE] prompt you write shows HER ALONE, as a real photo taken with her photo camera, never a webcam screenshot: one single adult woman, exactly her looks from the brief, at her place. NEVER the man, NEVER a couple, NEVER his body in any form, NEVER another woman unless he explicitly asked for a friend to join - and then the two women together on her own photos, still never him, never a threesome with him. The standing rule that says to draw him naked does NOT apply in this scene: he is never drawn. If in doubt, show her face close-up.');
        L.push('[THE SHEETS STAY SILENT] You know her body, her sizes and what she wears by heart: never check, read, quote or recite any sheet, fiche or file aloud, never say you are checking anything, never list fields (name, age, sizes, outfit) as data - what the sheets know simply shows in how you play her, in your own words, in character.');
        L.push('[NO PRESENTATION, EVER] She never presents herself: no name, no age, no body description, no capabilities, no greeting ritual, no recap of the situation - the brief already set all of that and repeating it is redundant. The first line is her voice on camera, mid-scene, in character.');
        L.push('[WHAT SHE WEARS - SHE SAYS IT] What she wears on camera is hers to change - but every change is said AND shown: when she takes something off or puts something new on, she says it in her own words in the text (what she removes, what she puts on, its colour and fabric), and the [SOFIA_IMAGE] of that moment draws exactly that. No silent change: if the text announces nothing new, she still wears what the previous reply had on her. Your [FICHE_STATE] of this very reply updates her vetements at once: drop every piece she took off, add the new piece with its colour and fabric in its couches. A plug, a toy or any object she puts on or inside her body follows the same rule: she says it in her own words in the text first, and your [FICHE_STATE] records it in her objets_portes at once.');
        L.push('[HER POSES - HERS TO CHOOSE] On camera she takes whatever pose she wants - standing, sitting, kneeling, lying down, leaning forward, turning around, standing naturally, close to the lens or across the room: no position is ever imposed on her and she is never kept frozen in one place. Each reply may move her into a new pose of her own choosing, said in her own words, and the [SOFIA_IMAGE] of that moment draws exactly that pose.');
        L.push('[SHOT VARIETY - NEVER TWICE THE SAME] When you send several photos in one reply, each photo gets a DIFFERENT framing: rotate between close-up on her face, close-up on her face, medium shot, full-body ensemble front in modest clothing, medium shot kneeling, standing, crouching or on all fours, wide shot across the room, lying on her back or stomach, high-angle plunge, low angle, side profile, mirror photo with the camera in her hand, camera at eye level for a modest portrait. If he names a framing (gros plan, de dos, en pied, appareil au sol...), that photo uses exactly it - his staging wins over the rotation, down to where the camera sits. Say each framing in your own words just before its [SOFIA_IMAGE].');
      }
      if (!sc.remote && cur) {
        L.push('[RIGHT NOW] ' + this._lookOf(cur) + ' is there at the toilet, in the middle of her moment.');
        if (after.length) L.push('[AFTER HER] ' + after.map((p) => this._lookOf(p)).join(' | ') + '.');
      } else if (!sc.remote && next) {
        L.push('[SHE COMES] ' + this._lookOf(next) + ' - she has not come yet, and now it is her turn.');
        if (after.length) L.push('[AFTER HER] ' + after.map((p) => this._lookOf(p)).join(' | ') + '.');
      }
      if (!sc.remote && others.length) L.push('[IN THE ROOM] ' + others.map(function (p) { return p.name; }).join(', ') + ' are not away and not gone: they are in the room with the music, the drinks and the food - talking, laughing, drinking, dancing, coming and going, waiting their turn. They are really there: let them be heard in your reply.');
      L.push('[HOW TO PLAY THIS REPLY]');
      L.push('- Never re-open, re-introduce or re-describe the scene, the room, the set-up or the situation: it is known and already told. Begin exactly where your last reply stopped and move the scene forward by ONE step.');
      if (sc.remote && (cur || next)) L.push('- This reply it is ' + (cur || next).name + '\'s moment on camera: her voice, her words, what she shows and what she feels - ONE step, no one else, no touch, never his words.');
      if (!sc.remote && cur) L.push('- ' + cur.name + ' is the one who is at the toilet. Continue her moment exactly where it stopped - her gesture, her words, what she feels - and do not begin another woman\'s moment in this same reply.');
      else if (!sc.remote && next) L.push('- This reply it is ' + next.name + '\'s moment: she comes to the toilet now, or she is already at it. She shows herself in her own voice - her name, how she looks tonight, what she wears, her mood, why she is here - and then she really does what she came to do, and she says what she does and what she feels. She is like none of the women before her: her own words, her own way of moving, her own thing to do with him.');
      if (!sc.remote) L.push('- The man is there, installed and entirely available, exactly as the scene has him. She does with him what she wants, at her own pace; nothing is imposed on her and she takes what she wants.');
      L.push('- Never summarise, replay or re-describe what has already been told, and never start her protocol from the beginning again.');
      L.push('- NOTHING IN THIS SCENE IS CHECKED. It is a fiction that the two of you are living, and there is nothing in it to verify and nothing to validate: never look anything up, never verify a fact, never cite or name a source, never say you are not certain, never say you cannot check or cannot verify something, and never put a warning, a caveat, a caution, a disclaimer or a limitation inside this scene. Never step out of the scene to comment on it, to explain yourself, or to ask him to confirm or approve anything: you decide, and the scene goes on. You are not an assistant here - you are the women of this evening.');
      if (sc.clock && sc.clock.total && sc.clock.elapsed >= sc.clock.total) L.push('- The evening\'s time is up: this is the last moment of the night. Let it close.');
      L.push('[LEDGER LINE] End every reply with exactly one line, and nothing at all after it:');
      L.push('[SOFIA_SCENE]{"who":"' + (next ? next.name : '') + '","done":false}[END_SOFIA_SCENE]');
      L.push('Set "done" to true only once her moment is over and she has gone back to the party.');
      return L.join('\n');
    },

    // Ronde 290 : une scène ouverte AVANT ce correctif (ou avant que le propriétaire ne
    // déclare des personnes et n'ouvre les thèmes adultes) reste enregistrée dans la
    // session. On la ferme une fois au démarrage : la mémoire n'en garde rien de plus, et
    // le carnet ne part plus dans le prompt.
    enforcePolicy() {
      if (!App.Age || typeof App.Age.nsfw !== 'function' || App.Age.nsfw()) return 0;
      let n = 0;
      try {
        for (let s of (App.State.sessions || [])) {
          let sc = this.state(s);
          if (sc && sc.on === true) { this._close(s, 'stopped'); n++; }
        }
      } catch (e) {}
      if (n) console.log('[Scene] politique SFW : ' + n + ' scène(s) fermée(s)');
      return n;
    },

    _parse(buf) {
      let m = String(buf == null ? '' : buf).match(/\[SOFIA_SCENE\]\s*([\s\S]*?)\s*\[END_SOFIA_SCENE\]/i);
      if (!m) return null;
      try {
        let o = JSON.parse(m[1]);
        return (o && typeof o === 'object') ? o : null;
      } catch (e) { return null; }
    },
    handleMarker(buf, session) {
      let sc = this.state(session);
      if (sc && sc.on === true) {
        try { this.afterTurn(session, this._parse(buf)); } catch (e) { console.warn('[Scene] afterTurn failed', e); }
      }
      return this.stripMarker(buf);
    },
    stripMarker(text) {
      let s = String(text == null ? '' : text);
      s = s.replace(/\[SOFIA_SCENE\][\s\S]*?\[END_SOFIA_SCENE\]/gi, '');
      let i = s.search(/\[SOFIA_SCENE\]/i);
      if (i !== -1 && i >= s.length - 600) s = s.slice(0, i);
      s = s.replace(/\[END_SOFIA_SCENE\]/gi, '');
      return s.replace(/[ \t]*\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    },
    afterTurn(session, info) {
      let sc = this.state(session);
      if (!sc || sc.on !== true) return;
      let cast = Array.isArray(sc.cast) ? sc.cast : [];
      if (!cast.length) return;
      let cur = (sc.idx >= 0 && cast[sc.idx]) ? cast[sc.idx] : null;
      let who = info && info.who ? String(info.who).trim() : '';
      let done = !!(info && info.done);
      let j = -1;
      if (who) {
        let k = who.toLowerCase();
        for (let i = 0; i < cast.length; i++) {
          let nm = String(cast[i].name || '').toLowerCase();
          if (nm && (nm === k || nm.indexOf(k) === 0 || k.indexOf(nm) === 0)) { j = i; break; }
        }
      }
      if (j !== -1) {
        if (cur && cur !== cast[j] && cur.state === 'current') { cur.state = 'done'; cur.at = this._timeLabel(sc); }
        sc.idx = j;
        sc.held = 0;
        if (done) { cast[j].state = 'done'; cast[j].at = this._timeLabel(sc); sc.idx = -1; }
        else { cast[j].state = 'current'; }
      } else if (done) {
        if (cur) { cur.state = 'done'; cur.at = this._timeLabel(sc); }
        sc.idx = -1; sc.held = 0;
      } else {
        if (sc.idx === -1) {
          let w = -1;
          for (let i = 0; i < cast.length; i++) { if (cast[i].state !== 'done') { w = i; break; } }
          if (w !== -1) { cast[w].state = 'current'; sc.idx = w; sc.held = 0; }
        } else {
          sc.held = (sc.held || 0) + 1;
          if (sc.held >= 2 && cur) { cur.state = 'done'; cur.at = this._timeLabel(sc); sc.idx = -1; sc.held = 0; }
        }
      }
      if (sc.clock && sc.clock.total > 0) {
        let doneCount = cast.filter(function (p) { return p.state === 'done'; }).length;
        let curCount = cast.filter(function (p) { return p.state === 'current'; }).length;
        let frac = (doneCount + 0.5 * curCount) / cast.length;
        sc.clock.elapsed = Math.min(sc.clock.total, Math.round(sc.clock.total * frac));
      } else if (sc.clock) {
        sc.clock.elapsed = (sc.clock.elapsed || 0) + 5;
      }
      let remain = cast.filter(function (p) { return p.state !== 'done'; }).length;
      if (!remain) {
        if (sc.clock && sc.clock.total > 0) sc.clock.elapsed = sc.clock.total;
        this._close(session, 'closed');
      }
      try { App.Data.saveSessions(session.id); } catch (e) {}
    }
  };

  // Ronde 152 : calculer comme dans le manuel scolaire (« Assistance scolaire »). L'utilisateur a
  // prescrit la méthode selon laquelle TOUTE mathématique doit être expliquée :
  //   - « Pour poser une addition, on écrit les nombres à additionner en colonnes,
  //      comme dans un tableau de numération. » (exemple : 1205 + 897 + 78)
  //   - « Pour effectuer une addition, on fait les additions colonne après colonne
  //      en commençant par celle de droite. Il ne faut pas oublier les retenues. »
  //   - « Pour vérifier une addition, on recompte l'opération en changeant l'ordre
  //      des nombres à additionner. »
  //   - Soustraction : « la poser correctement, indiquer le signe « moins » ;
  //      commencer par la colonne des unités ; ne pas oublier les retenues. »
  // L'app calcule donc elle-même : elle reconnaît l'opération (y compris avec PLUSIEURS
  // termes), construit la feuille — pose, un bloc par colonne avec report,
  // feuille finie, vérification — et la place avec une phrase chacune dans le prompt
  // ou, en repli, derrière la réponse.
  App.Math = {
    WORD_RE: /(calcul|r[ée]sultat|combien|soustraction|addition|multiplication|division|tables?|pos[ée]e?s?|poser|pose|math[ée]mat|somme|diff[ée]rence|produit|quotient|[àa] la main|feuille|colonnes?|retenues?|op[ée]ration|le[çc]on|v[ée]rifi|explique)/i,
    DIV_CUE: /(divis|partage|combien|calcul|r[ée]sultat|quotient|reste|op[ée]ration)/i,
    ADD_CUE: /(addition|additionner|somme|ajoute|plus|combien|calcul|calcule|poser|pose|op[ée]ration|effectue)/i,
    LANG_LABEL: { fr: "La feuille", en: "The sheet", de: "Das Blatt", es: "La hoja", it: "Il foglio" },
    UNITS: {
      fr: ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de mille', 'centaines de mille', 'millions', 'dizaines de millions', 'centaines de millions', 'milliards', 'dizaines de milliards', 'centaines de milliards'],
      en: ['units', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions', 'ten millions', 'hundred millions', 'billions', 'ten billions', 'hundred billions']
    },
    _lang() {
      try { return String((App.State.settings && App.State.settings.language) || 'fr').slice(0, 2).toLowerCase(); } catch (e) { return 'fr'; }
    },
    _text(v, lang) { if (!v) return ''; if (typeof v === 'string') return v; return v[lang] || ''; },
    _unit(lang, k) { let L = this.UNITS[lang] || this.UNITS.fr; return L[k] || ('10^' + k); },

    // ---- trouver l'opération dans le message --------------------------------
    // Nombre = chiffres purs, les espaces de milliers français sont autorisés
    // (« 1 205 » -> 1205). Virgule/point = nombre décimal -> pas de calcul.
    _num(tok) {
      let s = String(tok).replace(/[\u00a0\u202f\u2019]/g, ' ').trim();
      if (/[.,]/.test(s)) return null;
      let parts = s.split(/[ \t]+/).filter(p => p !== '');
      if (!parts.length || parts.some(p => !/^\d+$/.test(p))) return null;
      if (parts.length > 1) {
        if (!/^\d{1,3}$/.test(parts[0])) return null;
        for (let i = 1; i < parts.length; i++) if (parts[i].length !== 3) return null;
      }
      let v = parts.join('').replace(/^0+(?=\d)/, '');
      return v.length > 12 ? null : v;
    },
    // Chaîne Nombre / Opérateur / Nombre / ... – ainsi « 1205 + 897 + 78 »
    // ou « 1205 plus 897 plus 78 » devient un calcul à trois termes.
    _scan(t) {
      let NUM = /[0-9][0-9 \t'\u2019]*/y;
      let OPW = /[ \t]*(\+|-|\*|×|x|÷|\/|:|plus|moins|fois|et|multipli[ée]e?s?|divis[ée]e?s?)[ \t]*/iy;
      let PARW = /par[ \t]*/iy;
      let out = [], i = 0;
      while (i < t.length) {
        NUM.lastIndex = i;
        let n = NUM.exec(t);
        if (!n) { i++; continue; }
        let s = this._num(n[0]);
        let pos = n.index + n[0].length;
        let after = /^[.,]\d/.test(t.slice(pos)), before = n.index > 0 ? t[n.index - 1] : '';
        if (!s || after || /[A-Za-z0-9.,]/.test(before)) { i = pos; continue; }
        let chain = { start: n.index, end: pos, strs: [s], ops: [], plus: false };
        let p = pos;
        while (true) {
          OPW.lastIndex = p;
          let o = OPW.exec(t);
          if (!o) break;
          let w = o[1].toLowerCase(), q = o.index + o[0].length;
          if (/^(multipli|divis)/.test(w)) { PARW.lastIndex = q; let pm = PARW.exec(t); if (pm) q = PARW.lastIndex; }
          NUM.lastIndex = q;
          let m = NUM.exec(t);
          if (!m) break;
          let s2 = this._num(m[0]);
          let after2 = /^[.,]\d/.test(t.slice(m.index + m[0].length));
          if (!s2 || after2) break;
          if (w === 'et' && !chain.plus && !ADD_CUE.test(t)) break; // « 12 et 13 » n'est pas une addition
          chain.strs.push(s2); chain.ops.push(w);
          if (w === '+' || w === 'plus') chain.plus = true;
          chain.end = p = m.index + m[0].length;
        }
        if (chain.strs.length >= 2) out.push(chain);
        i = Math.max(p, i + 1);
      }
      return out;
    },
    _kind(w) {
      if (w === '+' || w === 'plus') return '+';
      if (w === '-' || w === 'moins') return '-';
      if (w === '*' || w === '×' || w === 'x' || w === 'fois' || /^multipli/.test(w)) return '*';
      if (w === '÷' || w === '/' || w === ':' || /^divis/.test(w)) return '/';
      return null;
    },
    detect(raw) {
      try {
        let t = String(raw == null ? '' : raw).replace(/[\u00a0\u202f]/g, ' ');
        if (t.length > 400) t = t.slice(0, 400);
        let cue = this.WORD_RE.test(t);
        let chains = this._scan(t);
        for (let c = 0; c < chains.length; c++) {
          let ch = chains[c];
          let kinds = ch.ops.map(w => this._kind(w));
          if (!kinds.length || kinds.some(k => !k)) continue;
          if (kinds.some(k => k !== kinds[0])) continue;   // aucun opérateur mixte
          // Sans mot-signal (« calcule », « combien », « colonne » ...), le
          // message doit être un calcul pur - sinon « 15 - 20 minutes » serait
          // un problème.
          if (!cue) {
            let rest = t.slice(0, ch.start) + ' ' + t.slice(ch.end);
            if (/[A-Za-z\u00c0-\u00ff]/.test(rest)) continue;
          }
          let strs = ch.strs, op = kinds[0];
          if (strs.length > 6) continue;
          let nums = strs.map(s => BigInt(s));
          if (op === '+') return { op: '+', strs: strs, nums: nums };
          if (op === '-') { if (strs.length !== 2 || nums[0] < nums[1]) continue; return { op: '-', strs: strs, nums: nums }; }
          if (op === '*') { if (strs.length !== 2 || strs[0].length + strs[1].length > 18) continue; return { op: '*', strs: strs, nums: nums }; }
          if (op === '/') {
            if (strs.length !== 2 || strs[0].length > 9) continue;
            let explicit = ch.ops.some(w => w === '÷' || /^divis/.test(w));
            if (!explicit && !this.DIV_CUE.test(t)) continue;
            if (nums[1] === 0n || nums[1] > 999n || nums[0] < nums[1]) continue;
            return { op: '/', strs: strs, nums: nums };
          }
        }
        return null;
      } catch (e) { return null; }
    },

    // ---- géométrie de la feuille --------------------------------------------
    // Une ligne est signe (éventuel) + espaces + chiffres avec exactement
    // un espace intermédiaire : la colonne j (0 = à gauche) se trouve à l'index 2 + 2*j.
    _row(sign, digits, w) {
      let a = [];
      for (let i = 0; i < w; i++) { let c = digits[i]; a.push(c === undefined || c === null || c === ' ' ? ' ' : String(c)); }
      return ((sign || ' ') + ' ' + a.join(' ')).replace(/\s+$/, '');
    },
    _marks(w, map) {
      let a = new Array(2 * w + 1).fill(' ');
      Object.keys(map).forEach(key => {
        let v = String(map[key]), idx = 2 + 2 * Number(key);
        for (let i = 0; i < v.length; i++) if (idx + i < a.length) a[idx + i] = v[i];
      });
      return a.join('').replace(/\s+$/, '');
    },
    _rule(w) { return '-'.repeat(2 * w + 1); },
    _fence(rows) { return '```text\n' + rows.filter(r => r !== null && r !== undefined).join('\n') + '\n```'; },
    _pos(w, k) { return w - 1 - k; },   // colonne k depuis la droite -> index depuis la gauche
    _padLeft(s, w) { return ' '.repeat(Math.max(0, w - s.length)) + s; },
    // Poser le nombre de façon que son chiffre des UNITÉS tombe sur la colonne (w-1-shift).
    _place(s, shift, w) {
      let a = new Array(w).fill(' ');
      let i = w - 1 - shift;
      for (let c = s.length - 1; c >= 0 && i >= 0; c--, i--) a[i] = s[c];
      return a;
    },
    _n(v) { return String(v); },

    sheets(det) {
      if (!det || !det.strs || det.strs.length < 2) return [];
      try {
        if (det.op === '+') return this._sumSheets(det);
        if (det.op === '-') return this._subSheets(det);
        if (det.op === '*') return this._mulSheets(det);
        if (det.op === '/') return this._divSheets(det);
      } catch (e) { console.warn('[Math] sheet build failed:', e); }
      return [];
    },

    // ---- Addition : n termes, colonne par colonne -----------------------------
    _sumSheets(det) {
      let n = det.strs.length, W0 = 0;
      det.strs.forEach(s => { if (s.length > W0) W0 = s.length; });
      let digs = det.strs.map(s => s.split('').map(Number));
      let at = (i, k) => { let j = det.strs[i].length - 1 - k; return j >= 0 ? digs[i][j] : 0; };
      let carry = 0, resC = [], marks = {}, steps = [];
      for (let k = 0; k < W0; k++) {
        let add = [];
        for (let i = 0; i < n; i++) add.push(at(i, k));
        let sum = add.reduce((x, y) => x + y, 0);
        let total = sum + carry;
        let digit = total % 10, out = Math.floor(total / 10);
        if (out > 0) marks[k + 1] = { step: k, v: out };
        resC[k] = digit;
        steps.push({ k: k, add: add, sum: sum, carryIn: carry, total: total, digit: digit, carryOut: out });
        carry = out;
      }
      if (carry > 0) resC[W0] = carry;
      let W = Math.max(W0, resC.length);
      let base = () => det.strs.map((s, i) => this._row(i === det.strs.length - 1 ? '+' : ' ', this._padLeft(s, W), W));
      let marksAt = (upto) => {
        let m = {};
        Object.keys(marks).forEach(key => { if (marks[key].step <= upto) m[this._pos(W, Number(key))] = marks[key].v; });
        return m;
      };
      let resRow = (upto) => {
        let a = new Array(W).fill(' ');
        for (let k = 0; k <= upto && k < resC.length; k++) a[this._pos(W, k)] = String(resC[k]);
        return this._row(' ', a.join(''), W);
      };
      let resS = det.nums.reduce((x, y) => x + y, 0n).toString();
      let out = [];
      out.push({ block: this._fence(base().concat([this._rule(W)])), note: {
        fr: "Je pose l'addition : j'écris les nombres à additionner en colonnes, comme dans un tableau de numération - les unités sous les unités, les dizaines sous les dizaines.",
        en: "I write the addition down: the numbers in columns, units under units, tens under tens."
      } });
      steps.forEach(st => {
        let m = marksAt(st.k), rows = [];
        if (Object.keys(m).length) rows.push(this._marks(W, m));
        rows = rows.concat(base());
        rows.push(this._rule(W));
        rows.push(resRow(st.k));
        out.push({ block: this._fence(rows), note: this._noteSumStep(st) });
      });
      let mF = marksAt(W0), fin = [];
      if (Object.keys(mF).length) fin.push(this._marks(W, mF));
      fin = fin.concat(base());
      fin.push(this._rule(W));
      fin.push(resRow(resC.length - 1));
      let finBlock = this._fence(fin);
      let prev = out.length ? out[out.length - 1] : null;
      if (prev && prev.block === finBlock) {
        prev.note.fr += ' La somme est ' + resS + '.';
        prev.note.en += ' The sum is ' + resS + '.';
      } else {
        out.push({ block: finBlock, note: {
          fr: 'La somme est ' + resS + '.',
          en: 'The sum is ' + resS + '.'
        } });
      }
      let rev = det.strs.slice().reverse();
      out.push({ block: this._plainSheet(rev, '+', resS), note: {
        fr: "Vérification : je recompte l'opération en changeant l'ordre des nombres à additionner : " + rev.join(' + ') + ' = ' + resS + '. On retrouve bien ' + resS + '.',
        en: 'Check: I add them up again in a different order: ' + rev.join(' + ') + ' = ' + resS + '. I find ' + resS + ' again.'
      } });
      return out;
    },
    _noteSumStep(st) {
      let add = st.add.join(' + ');
      let fr = 'Colonne des ' + this._unit('fr', st.k) + ' : ' + add + (st.carryIn ? ' = ' + st.sum + ', plus la retenue ' + st.carryIn + ' : ' + st.total : ' = ' + st.total) + '. J\'écris ' + st.digit + (st.carryOut ? ' et je retiens ' + st.carryOut : '') + '.';
      let en = 'Column of the ' + this._unit('en', st.k) + ': ' + add + (st.carryIn ? ' = ' + st.sum + ', plus the carry ' + st.carryIn + ' : ' + st.total : ' = ' + st.total) + '. I write ' + st.digit + (st.carryOut ? ' and carry ' + st.carryOut : '') + '.';
      return { fr: fr, en: en };
    },

    // ---- Soustraction : signe moins, unités d'abord, reports -----------------
    _subSheets(det) {
      let aStr = det.strs[0], bStr = det.strs[1];
      let W = Math.max(aStr.length, bStr.length);
      let A = aStr.split('').map(Number), B = bStr.split('').map(Number);
      let atA = (k) => { let j = A.length - 1 - k; return j >= 0 ? A[j] : 0; };
      let atB = (k) => { let j = B.length - 1 - k; return j >= 0 ? B[j] : 0; };
      let topC = [];
      for (let k = 0; k < W; k++) topC.push(atA(k));
      let resC = [], marks = {}, steps = [];
      for (let k = 0; k < W; k++) {
        let a0 = topC[k], b = atB(k), a2 = a0, borrowed = false, nines = [];
        if (a0 < b) {
          let j = k + 1;
          while (j < W && topC[j] === 0) { topC[j] = 9; marks[j] = { step: k, v: 9 }; nines.push(true); j++; }
          if (j < W) { topC[j] -= 1; marks[j] = { step: k, v: 1 }; }
          a2 = a0 + 10; borrowed = true;
        }
        resC[k] = a2 - b;
        steps.push({ k: k, a0: a0, a2: a2, b: b, borrowed: borrowed, digit: a2 - b, nines: nines.length });
      }
      let resS = (det.nums[0] - det.nums[1]).toString(), resLen = resS.length;
      let base = () => [this._row(' ', this._padLeft(aStr, W), W), this._row('-', this._padLeft(bStr, W), W)];
      let marksAt = (upto) => {
        let m = {};
        Object.keys(marks).forEach(key => { if (marks[key].step <= upto) m[this._pos(W, Number(key))] = marks[key].v; });
        return m;
      };
      let resRow = (upto) => {
        let a = new Array(W).fill(' ');
        for (let k = 0; k <= upto && k < resLen; k++) a[this._pos(W, k)] = String(resC[k]);
        return this._row(' ', a.join(''), W);
      };
      let out = [];
      out.push({ block: this._fence(base().concat([this._rule(W)])), note: {
        fr: "Je pose la soustraction en colonnes, correctement alignée, et j'indique le signe « moins ».",
        en: 'I write the subtraction down in columns, lined up, with the minus sign.'
      } });
      steps.forEach(st => {
        let m = marksAt(st.k), rows = [];
        if (Object.keys(m).length) rows.push(this._marks(W, m));
        rows = rows.concat(base());
        rows.push(this._rule(W));
        rows.push(resRow(st.k));
        out.push({ block: this._fence(rows), note: this._noteSubStep(st) });
      });
      let mF = marksAt(W - 1), fin = [];
      if (Object.keys(mF).length) fin.push(this._marks(W, mF));
      fin = fin.concat(base());
      fin.push(this._rule(W));
      fin.push(resRow(resLen - 1));
      let finBlock = this._fence(fin);
      let prev = out.length ? out[out.length - 1] : null;
      if (prev && prev.block === finBlock) {
        prev.note.fr += ' Le résultat est ' + resS + '.';
        prev.note.en += ' The result is ' + resS + '.';
      } else {
        out.push({ block: finBlock, note: {
          fr: 'Le résultat est ' + resS + '.',
          en: 'The result is ' + resS + '.'
        } });
      }
      out.push({ block: this._plainSheet([resS, bStr], '+', aStr), note: {
        fr: "Vérification : j'additionne le résultat et le nombre que j'ai soustrait : " + resS + ' + ' + bStr + ' = ' + aStr + '. On retrouve bien ' + aStr + '.',
        en: 'Check: I add the result and the number I took away: ' + resS + ' + ' + bStr + ' = ' + aStr + '. I find ' + aStr + ' again.'
      } });
      return out;
    },
    _noteSubStep(st) {
      let fr, en;
      if (st.borrowed) {
        fr = 'Colonne des ' + this._unit('fr', st.k) + ' : ' + st.a0 + ' - ' + st.b + ' est impossible, ' + st.a0 + ' est plus petit que ' + st.b + '. J\'emprunte une dizaine : ' + st.a2 + ' - ' + st.b + ' = ' + st.digit + '. J\'écris ' + st.digit + '.';
        en = 'Column of the ' + this._unit('en', st.k) + ': ' + st.a0 + ' - ' + st.b + ' is impossible, ' + st.a0 + ' is smaller than ' + st.b + '. I borrow a ten: ' + st.a2 + ' - ' + st.b + ' = ' + st.digit + '. I write ' + st.digit + '.';
        if (st.nines) {
          fr += " (les colonnes qui sont à 0 ne peuvent rien prêter : en passant, elles deviennent 9)";
          en += ' (the columns that are 0 have nothing to lend: on the way through they become 9)';
        }
      } else {
        fr = 'Colonne des ' + this._unit('fr', st.k) + ' : ' + st.a0 + ' - ' + st.b + ' = ' + st.digit + '. J\'écris ' + st.digit + '.';
        en = 'Column of the ' + this._unit('en', st.k) + ': ' + st.a0 + ' - ' + st.b + ' = ' + st.digit + '. I write ' + st.digit + '.';
      }
      return { fr: fr, en: en };
    },

    // ---- Multiplication : une ligne par chiffre du facteur du bas -----------
    // ---- Multiplication : d'abord poser, puis chiffre par chiffre avec report ---
    // Les petites opérations (jusqu'à 4 chiffres en haut, jusqu'à 2 en bas) sont
    // présentées chiffre par chiffre - comme l'addition : un bloc par colonne du facteur du haut, le
    // report comme petit nombre sur la ligne au-dessus, le produit partiel grandit
    // sous la ligne. Les grandes opérations restent à une ligne par produit partiel.
    _mulSheets(det) {
      let aStr = det.strs[0], bStr = det.strs[1];
      let a = det.nums[0], b = det.nums[1];
      let prod = (a * b).toString();
      let bd = bStr.split(''), parts = [];
      for (let k = bd.length - 1; k >= 0; k--) {
        if (bd[k] === '0') continue;
        parts.push({ d: bd[k], part: (a * BigInt(bd[k])).toString(), shift: bd.length - 1 - k });
      }
      let W = Math.max(aStr.length, bStr.length, prod.length);
      parts.forEach(p => { if (p.part.length + p.shift > W) W = p.part.length + p.shift; });
      let pose = () => [this._row(' ', this._padLeft(aStr, W), W), this._row('×', this._padLeft(bStr, W), W)];
      let rule = this._rule(W);
      let ad = aStr.split('').map(Number);
      let digitSteps = (aStr.length <= 4 && bStr.length <= 2 && parts.length > 0);
      let out = [];
      out.push({ block: this._fence(pose().concat([rule])), note: {
        fr: "Pour poser une multiplication, j'écris les nombres en colonnes, les unités sous les unités, et j'indique le signe « × ». Je multiplie par chaque chiffre du nombre du bas, en commençant par les unités et en allant de droite à gauche, sans oublier les retenues ; je décale chaque nouveau produit d'un rang vers la gauche, puis j'additionne les lignes.",
        en: 'To write a multiplication down I line the numbers up in columns, units under units, with the × sign. I multiply by every digit of the bottom number, starting with the units and going right to left, never forgetting the carries; each new product is shifted one place to the left, and then I add the lines.'
      } });
      let done = [];
      parts.forEach(p => {
        if (digitSteps) {
          let carry = 0, marks = {}, cur = new Array(W).fill(' ');
          for (let j = 0; j < aStr.length; j++) {
            let dig = ad[aStr.length - 1 - j];
            let cin = carry;
            let t = dig * Number(p.d) + cin;
            let digit = t % 10, cout = Math.floor(t / 10);
            let idx = W - 1 - p.shift - j;
            if (idx >= 0) cur[idx] = String(digit);
            if (cout > 0 && W - 1 - p.shift - (j + 1) >= 0) marks[W - 1 - p.shift - (j + 1)] = cout;
            let rows = [];
            if (Object.keys(marks).length) rows.push(this._marks(W, marks));
            rows = rows.concat(pose());
            rows.push(rule);
            done.forEach(r => rows.push(r));
            rows.push(this._row(' ', cur.join(''), W));
            out.push({ block: this._fence(rows), note: this._noteMulDigit(dig, p, cin, t, digit, cout, j, j === aStr.length - 1) });
            carry = cout;
          }
          done.push(this._row(' ', this._place(p.part, p.shift, W).join(''), W));
        } else {
          done.push(this._row(' ', this._place(p.part, p.shift, W).join(''), W));
          let rows = pose().slice();
          rows.push(rule);
          done.forEach(r => rows.push(r));
          out.push({ block: this._fence(rows), note: this._noteMulPart(p, aStr) });
        }
      });
      let fin = pose().slice();
      fin.push(rule);
      done.forEach(r => fin.push(r));
      fin.push(rule);
      fin.push(this._row(' ', this._padLeft(prod, W), W));
      let shifted = parts.map(p => p.part + '0'.repeat(p.shift));
      out.push({ block: this._fence(fin), note: {
        fr: (parts.length > 1 ? "J'additionne les lignes : " + shifted.join(' + ') + ' = ' + prod + '. ' : '') + 'Le produit est ' + prod + '.',
        en: (parts.length > 1 ? 'I add the lines: ' + shifted.join(' + ') + ' = ' + prod + '. ' : '') + 'The product is ' + prod + '.'
      } });
      out.push({ block: this._plainSheet([bStr, aStr], '×', prod), note: {
        fr: "Vérification : je recommence en changeant l'ordre des facteurs : " + bStr + ' × ' + aStr + ' = ' + prod + '. On retrouve bien ' + prod + '.',
        en: 'Check: I do it again with the factors the other way round: ' + bStr + ' × ' + aStr + ' = ' + prod + '. I find ' + prod + ' again.'
      } });
      return out;
    },
    _noteMulDigit(dig, p, cin, t, digit, cout, j, isLast) {
      let fr, en, un = this._unit('fr', j), unEn = this._unit('en', j);
      if (j === 0) {
        let headFr = p.shift > 0 ? 'Je passe au chiffre des ' + this._unit('fr', p.shift) + ' du bas (' + p.d + ') : ' + dig + ' × ' + p.d + ' = ' + t + '. J\'écris ' : 'Je commence par le chiffre des unités : ' + dig + ' × ' + p.d + ' = ' + t + '. J\'écris ';
        let headEn = p.shift > 0 ? 'Now the ' + this._unit('en', p.shift) + ' of the bottom number (' + p.d + '): ' + dig + ' × ' + p.d + ' = ' + t + '. I write ' : 'I start with the units: ' + dig + ' × ' + p.d + ' = ' + t + '. I write ';
        fr = headFr + digit + (cout ? ' et je retiens ' + cout : '') + '.';
        en = headEn + digit + (cout ? ' and carry ' + cout : '') + '.';
      } else {
        let base = dig * Number(p.d);
        fr = 'Chiffre des ' + un + ' : ' + dig + ' × ' + p.d + (cin ? ' = ' + base + ', plus la retenue ' + cin + ' : ' + t + '. J\'écris ' : ' = ' + t + '. J\'écris ') + digit + (cout ? ' et je retiens ' + cout : '') + '.';
        en = 'Column of the ' + unEn + ': ' + dig + ' × ' + p.d + (cin ? ' = ' + base + ', plus the carry ' + cin + ' : ' + t + '. I write ' : ' = ' + t + '. I write ') + digit + (cout ? ' and carry ' + cout : '') + '.';
      }
      if (isLast) {
        fr += ' Le produit de cette ligne est ' + p.part + (p.shift ? " (je le décale de " + p.shift + ' rang vers la gauche)' : '') + '.';
        en += ' The product of this line is ' + p.part + (p.shift ? ' (shifted ' + p.shift + ' place(s) to the left)' : '') + '.';
      }
      return { fr: fr, en: en };
    },
    _noteMulPart(p, aStr) {
      let fr = (p.shift === 0
        ? 'Je multiplie par les unités : ' + aStr + ' × ' + p.d + ' = ' + p.part + '. Je pose ' + p.part + '.'
        : 'Je multiplie par les ' + this._unit('fr', p.shift) + ' : ' + aStr + ' × ' + p.d + ' = ' + p.part + '. Je décale d\'un rang vers la gauche et je pose ' + p.part + '.');
      let en = (p.shift === 0
        ? 'I multiply by the units: ' + aStr + ' × ' + p.d + ' = ' + p.part + '. I write ' + p.part + '.'
        : 'I multiply by the ' + this._unit('en', p.shift) + ': ' + aStr + ' × ' + p.d + ' = ' + p.part + '. I shift one place to the left and write ' + p.part + '.');
      return { fr: fr, en: en };
    },
    // ---- Division : dividende à gauche, diviseur à droite, une ligne par étape ---
    _divSheets(det) {
      let dstr = det.strs[0], vstr = det.strs[1];
      let num = det.nums[0], v = det.nums[1];
      let W = dstr.length;
      let qAll = (num / v).toString(), remAll = (num % v).toString();
      let cur = '', i = 0, steps = [], started = false;
      while (i < dstr.length) {
        cur += dstr[i]; i++;
        let cv = BigInt(cur);
        if (cv < v) { if (started) steps.push({ zero: true, cur: cur }); continue; }
        let qd = cv / v, pr = qd * v, rm = cv - pr;
        steps.push({ zero: false, cur: cur, qd: qd.toString(), prod: pr.toString(), rem: rm.toString(), startIdx: i - cur.length, endIdx: i - 1, next: (i < dstr.length ? dstr[i] : '') });
        started = true;
        cur = (rm === 0n) ? '' : rm.toString();
      }
      let bar = 2 * W + 2;
      let R = Math.max(vstr.length, qAll.length), cellW = 2 * R - 1;
      let cell = (s) => { let a = new Array(cellW).fill(' '); for (let c = 0; c < s.length && c < R; c++) a[2 * c] = s[c]; return a.join(''); };
      let blank = () => new Array(W).fill(' ');
      let left = (arr) => this._row(' ', arr.join(''), W);
      let withBar = (arr, right) => {
        let l = left(arr);
        let s = l + ' '.repeat(Math.max(0, bar - l.length)) + '|';
        if (right != null) s += ' ' + right;
        return s.replace(/\s+$/, '');
      };
      let head = () => [withBar(dstr.split(''), cell(vstr)), withBar(blank(), '-'.repeat(cellW))];
      let out = [], qN = 0, rows = [];
      let poseNote = {
        fr: "Pour poser une division, j'écris le dividende à gauche et le diviseur à droite, séparés par un trait vertical. Pour l'effectuer : je cherche combien de fois le diviseur est contenu dans les premiers chiffres du dividende, j'écris ce chiffre au quotient, je multiplie, je soustrais, puis je descends le chiffre suivant - et s'il reste quelque chose à la fin, je vérifie en multipliant le quotient par le diviseur et en ajoutant le reste.",
        en: 'To write a division down I put the dividend on the left and the divisor on the right, separated by a vertical bar. To work it out: I look for how many times the divisor fits into the first digits of the dividend, I write that digit in the quotient, I multiply, I subtract, and then I bring down the next digit - and if something is left at the end, I check by multiplying the quotient by the divisor and adding the remainder.'
      };
      steps.forEach((st, si) => {
        if (st.zero) { qN++; }
        else {
          qN++;
          rows.push(left(this._place(st.prod, W - 1 - st.endIdx, W)));
          let dashArr = blank();
          for (let j = st.startIdx; j <= st.endIdx; j++) dashArr[j] = '-';
          rows.push(left(dashArr));
          let remArr = this._place(st.rem, W - 1 - st.endIdx, W);
          if (st.next) remArr[st.endIdx + 1] = st.next;
          rows.push(left(remArr));
        }
        let body = head().concat([withBar(blank(), cell(qAll.slice(0, qN)))]).concat(rows.slice());
        let note = this._noteDivStep(st, vstr);
        if (si === 0) { note.fr = poseNote.fr + ' ' + note.fr; note.en = poseNote.en + ' ' + note.en; }
        out.push({ block: this._fence(body), note: note });
      });
      let last = out[out.length - 1].note;
      let resFr = (remAll === '0' ? 'Le quotient est ' + qAll + '.' : 'Le quotient est ' + qAll + ' et le reste est ' + remAll + '.');
      let resEn = (remAll === '0' ? 'The quotient is ' + qAll + '.' : 'The quotient is ' + qAll + ' and the remainder is ' + remAll + '.');
      last.fr = last.fr + ' ' + resFr;
      last.en = last.en + ' ' + resEn;
      let pr = (v * BigInt(qAll)).toString();
      out.push({ block: this._plainSheet([qAll, vstr], '×', pr), note: {
        fr: (remAll === '0'
          ? 'Vérification : ' + qAll + ' × ' + vstr + ' = ' + num + '. On retrouve bien ' + num + '.'
          : 'Vérification : ' + qAll + ' × ' + vstr + ' = ' + pr + ', et ' + pr + ' + ' + remAll + ' = ' + num + '. On retrouve bien ' + num + '.'),
        en: (remAll === '0'
          ? 'Check: ' + qAll + ' × ' + vstr + ' = ' + num + '. I find ' + num + ' again.'
          : 'Check: ' + qAll + ' × ' + vstr + ' = ' + pr + ', and ' + pr + ' + ' + remAll + ' = ' + num + '. I find ' + num + ' again.')
      } });
      return out;
    },
    _noteDivStep(st, vstr) {
      if (st.zero) {
        return {
          fr: st.cur + ' est plus petit que ' + vstr + " : j'écris 0 au quotient et je descends le chiffre suivant.",
          en: st.cur + ' is smaller than ' + vstr + ': I write 0 in the quotient and bring down the next digit.'
        };
      }
      let fr = 'Dans ' + st.cur + ', il y a ' + st.qd + ' fois ' + vstr + ' : ' + st.qd + ' × ' + vstr + ' = ' + st.prod + '. ' + st.cur + ' - ' + st.prod + ' = ' + st.rem + ". J'écris " + st.qd + ' au quotient.';
      let en = 'In ' + st.cur + ' there are ' + st.qd + ' times ' + vstr + ': ' + st.qd + ' × ' + vstr + ' = ' + st.prod + '. ' + st.cur + ' - ' + st.prod + ' = ' + st.rem + '. I write ' + st.qd + ' in the quotient.';
      if (st.next) { fr += ' Je descends le ' + st.next + '.'; en += ' I bring down the ' + st.next + '.'; }
      return { fr: fr, en: en };
    },

    // ---- Feuille sans étapes intermédiaires (pour la vérification) ----------
    _plainSheet(strs, sign, resStr) {
      let W = resStr.length;
      strs.forEach(s => { if (s.length > W) W = s.length; });
      let rows = [];
      for (let i = 0; i < strs.length; i++) rows.push(this._row(i === strs.length - 1 ? (sign || ' ') : ' ', this._padLeft(strs[i], W), W));
      rows.push(this._rule(W));
      rows.push(this._row(' ', this._padLeft(resStr, W), W));
      return this._fence(rows);
    },

    promptBlock(text) {
      try {
        let det = this.detect(text);
        if (!det) return null;
        let sheets = this.sheets(det);
        if (!sheets.length) return null;
        let lang = this._lang();
        let L = ['[APP-COMPUTED SHEET - ALREADY WORKED OUT ON PAPER, DIGIT BY DIGIT]'];
        L.push('He asked for exactly this calculation and the app has already worked it out the way the lesson shows: first the pose (the numbers in columns, units under units), then one block per column from the units to the left with the retenues as a small number on the line above, then the finished sheet, and at the end the verification. The blocks below are correct and already in the right order.');
        L.push('Put them into your answer exactly as they are - same digits, same lines, same fences, same order - and after each block write the sentence given with it (adjust it to your voice if you like, but keep the method, the order and the numbers). Do not retype or reformat the numbers and do not work anything out yourself: everything you need is in the blocks.');
        let body = sheets.map((s, idx) => {
          let note = this._text(s.note, lang);
          return 'BLOCK ' + (idx + 1) + ':\n' + s.block + (note ? '\nSentence to write right after this block: ' + note : '');
        }).join('\n\n');
        return L.join('\n') + '\n\n' + body;
      } catch (e) { return null; }
    },
    // Repli : elle a seulement raconté et montré aucune feuille - alors l'app pose
    // la feuille (avec ses phrases) derrière sa réponse.
    ensureSheet(reply, userText) {
      try {
        let det = this.detect(userText);
        if (!det) return reply;
        let r = String(reply == null ? '' : reply);
        let blocks = r.match(/```[\s\S]*?```/g) || [];
        for (const b of blocks) {
          let inner = b.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
          let ok = false;
          try { ok = App.Core.isMathSheet(inner); } catch (e) {}
          if (ok) return reply;
        }
        let sheets = this.sheets(det);
        if (!sheets.length) return r;
        let lang = this._lang();
        let label = this.LANG_LABEL[lang] || this.LANG_LABEL.en;
        let body = sheets.map(s => {
          let note = this._text(s.note, lang);
          return s.block + (note ? '\n\n' + note : '');
        }).join('\n\n');
        return r.replace(/\s*$/, '') + '\n\n**' + label + ' :**\n\n' + body + '\n';
      } catch (e) { return reply; }
    }
  };

  // Ronde 153/154 : les dossiers de calcul de l'utilisateur – le « Mémo mathématique » (TAGE 2,
  // ecricome.org) et le cours « Fondamentaux des mathématiques 1 » (Laurent
  // Pujo-Menjouet, Université Claude Bernard Lyon 1, 232 p.). Ils sont son
  // ouvrage de référence pour tout ce qui n'est pas un calcul en colonnes : règles,
  // critères, formules, théorèmes, définitions, unités.
  // L'app trouve elle-même les sections qui conviennent (les titres comptent plus que le
  // texte courant) et les place devant elle ; la méthode reste celle du manuel :
  // règle en une phrase, puis montrer sur les lignes, puis vérifier. Chaque dossier se trouve
  // comme fichier propre dans src/maths/.
  App.MathMemo = {
    // D'autres ouvrages s'ajoutent comme ligne supplémentaire. Si un fichier (encore) manque
    // ou ne se charge pas, il est silencieusement ignoré - un nouvel
    // ouvrage ne doit jamais rendre inutilisables ceux qui existent.
    SOURCES: [
      { url: 'src/maths/memo-tage2.json.gz', kind: 'fiche' },
      { url: 'src/maths/cours-fondmath1.json.gz', kind: 'cours' },
      { url: 'src/maths/cours-cmath-multiplication.json.gz', kind: 'cours' },
      { url: 'src/maths/cours-monka-fractions.json.gz', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 12,
    _data: null, _loading: null,
    _tag: '[MathMemo]',
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
            if (!secs.length) { console.warn((self._tag || '[MathMemo]') + ' aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log((self._tag || '[MathMemo]') + ' prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn((self._tag || '[MathMemo]') + ' chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    // Forme de base française grossière (et accents retirés, pour que « theoreme » retrouve
    // « théorème ») : « simplifier » et « simplification » tombent tous deux sur
    // « simplifi », « carré »/« carrée » sur la même, etc.
    _stem(w) {
      return String(w).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/(ifications|ification|ifiez|ifions|ifier|ifies|ifi[ée]e?s?)$/, 'ifi')
        .replace(/(ences?|entes?|ances?|ants?|antes?)$/, '')
        .replace(/(ements?|ations?|tions?|iques?|euses?|elles?|it[ée]s?)$/, '')
        .replace(/(er|es|s|e)$/, '');
    },
    // Mots qui ne disent rien sur le thème dans la question (« deux », « dans »,
    // « explique » ...) - sinon c'est la section au texte courant le plus épais qui gagne.
    STOP: (function () {
      let o = {};
      ('dans avec plus sont cette pour vous nous mais comme tout tous toute toutes faire fait peut aussi donc alors leur leurs elle elles cela ceci etre être avoir meme même quoi quel quelle quels quelles moins fois deux trois quatre cinq six sept huit neuf dix cent mille partie comment pourquoi combien quand toujours jamais autre autres apres après avant chez chaque depuis devant encore entre lorsque puisque quelque quelques seulement suivant surtout trouve trouver veux veut voudrais peux dois doit savoir vois voir dire dit prendre donne donner merci bonjour salut voila voilà explique expliquer expliquez montrer montrez rappelle rappeler rappelez retiens retenir calcul calculer calcule pose poser posée effectue effectuer exercice encore mieux bien toute petit grande sais connais theoreme theoremes propriete proprietes definition definitions notations remarque exemple exemples suite suites théoreme théorèmes propriété propriétés définition définitions nombre nombres énonce énoncé énonces énoncés énoncer énoncez enonce enonces enoncer enoncez').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/[’']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-zà-ÿ0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => x.length >= 4 && !this.STOP[x]).map(x => self._stem(x));
    },
    // Le message est-il seulement des mathématiques ? Les calculs purs sont reconnus par App.Math.
    // Et : il doit vraiment avoir expliqué/demandé quelque chose - sinon « augmente le
    // volume de ta voix » ouvrirait le dossier.
    isMath(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      const S = /(math|calcul|nombre|chiffre|fraction|d[ée]nominateur|num[ée]rateur|puissance|racine|pgcd|ppcm|divis|multiple|[ée]quation|d[ée]velopp|factoris|identit[ée]|litt[ée]ral|th[ée]or[èe]me|triangle|pythagore|thal[èe]s|trigonom|sinus|cosinus|hypot[ée]nuse|quadrilat|parall[ée]logramme|losange|rectangle|trap[èe]ze|cercl|disque|sph[èe]re|c[ôo]ne|cylindre|pyramide|pourcent|proportion|produit en croix|augmentation|baisse|r[ée]duction|int[ée]r[êe]t|unit[ée]|conversion|converti|p[ée]rim[èe]tre|simplif|d[ée]cimal|formule|moyenne|vitesse|parit[ée]|additi|soustrac|multipli|division|limites? (finie|infinie|de fonctions?|de suites?|en [+-]|d'une fonction|d'un quotient)|limite de (f|g|u|v|x|la fonction|la suite)|calcul\w* la limite|quelle est la limite|tend vers|\bd[ée]riv(é|ée|ee|ees|és|ées|er|ons?|able|ables|abilit[ée]|abilite)(?![a-zà-ÿ])|int[ée]grale|primitiv|matrice|d[ée]terminant|vecteur|transform[ée]e de|espace vectoriel|produit scalaire|application lin[ée]aire|jacobien|gradient|s[ée]rie enti[èe]re|s[ée]rie num[ée]rique|tangente|continuit[ée]|est continue|continue sur|fonctions? continues?|accroissements finis|valeurs interm[ée]diaires|bolzano|weierstrass|\bcauchy\b|\brolle\b|r[ée]currence|r[ée]current|suites? (r[ée]elle|de nombres|num[ée]rique|d[ée]finie|arithm[ée]tique|g[ée]om[ée]trique|adjacente|extraite|monotone|converge|diverge|tend vers)|converg|diverg|adjacentes|monotone|croissante|d[ée]croissante|major[ée]e|minor[ée]e|born[ée]e|injectiv|surjectiv|bijectiv|injection|surjection|bijection|cardinal|application r[ée]ciproque|fonction (paire|impaire)|variations? (de|d'une)|tableau de variations|domaine de d[ée]finition|[ée]tudier la fonction|nombres? complexes?|affixe|imaginaire pur|partie (r[ée]elle|imaginaire)|forme (alg[ée]brique|trigonom[ée]trique|exponentielle)|moivre|lin[ée]aris|duplication|polyn[ôo]me|irr[ée]ductible|anneau|discriminant|racine (double|multiple)|logarithme|exponentielle|quantificateur|pr[ée]dicat|assertion|implication|contrapos[ée]e|par l'absurde|contre-exemple|tautologie|de morgan|compl[ée]mentaire|inclusion|intervalle|arithm[ée]tique|premiers entre eux|b[ée]zout|fermat|\bgauss\b|congru|modulo|nombres? premiers?|divisibilit[ée]|facteurs premiers|convexe|concave|inflexion|asymptote|p[ée]riodique|partie enti[èe]re|homographique|hyperbolique|croissances compar[ée]es|valeur absolue|in[ée]galit[ée] triangulaire|bornes? (sup[ée]rieure|inf[ée]rieure)|extremum|h[ôo]pital|bin[ôo]me|factorielle|coefficient binomial|t[ée]lescopique|changement d'indice|somme (de|des)|produit (de|des)|moivre|lin[ée]aris|duplication|r[èe]gles? (de calcul|des signes|de priorit[ée]))/g;
      const W = /(\baire\b|\bvolume\b|\bmasse\b|\blongueur\b|\bsurface\b|\bdistance\b|\bdur[ée]e\b|\bcarr[ée]\b|\bcube\b|\btemps\b|\bheures?\b|\bminutes?\b|\bsecondes?\b)/g;
      let strong = new Set(), weak = new Set(), m;
      while ((m = S.exec(t))) strong.add(m[0]);
      while ((m = W.exec(t))) weak.add(m[0]);
      if (!strong.size && !weak.size) return false;
      if (!strong.size && strong.size + weak.size < 2) return false;
      return /(explique|expliquer|expliquez|comment|c'est quoi|qu'est[- ]ce|pourquoi|combien|calcul|calculer|calcule|je ne comprends|je comprends pas|je ne sais pas|je ne sais plus|sais pas|comprendre|compris|savoir|donne[- ]?moi|donne la|dis[- ]?moi|montre|rappelle|aide|le[çc]on|revois|revoir|m[ée]thode|corrige|v[ée]rifie|d[ée]taille|d[ée]montre|[ée]nonce|\?)/.test(t);
    },
    // Un index de tous les mots-clés plus la fréquence de chaque mot (dans combien
    // de sections il figure dans le texte courant). Un mot rare comme
    // « pythagore » dit bien plus sur le thème que « theoreme ».
    _index() {
      if (!this._data) return null;
      if (this._idx && this._idx.n === this._data.sections.length) return this._idx;
      let idx = { n: this._data.sections.length, e: [], df: {} };
      let self = this;
      this._data.sections.forEach(s => {
        let tw = self._words(s.t), bw = self._words(s.x);
        idx.e.push({ s: s, t: tw, b: bw, ts: tw.join(' '), bs: bw.join(' ') });
      });
      this._idx = idx;
      return idx;
    },
    // Deux mots se rencontrent s'ils sont égaux, ou si l'un commence
    // par l'autre - mais seulement pour de vrais mots : « cône » devient « con »
    // et rencontrerait sinon « convertit », alors que les deux n'ont rien à voir
    // l'un avec l'autre. C'est pourquoi un préfixe ne compte qu'à partir de cinq lettres.
    _hit(a, b) { return a === b || (a.length >= 5 && b.length >= 5 && (a.indexOf(b) === 0 || b.indexOf(a) === 0)); },
    _df(w) {
      let idx = this._index(); if (!idx) return 1;
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
    _bodyScore(df) { return df <= 1 ? 26 : df === 2 ? 18 : df === 3 ? 12 : df <= 6 ? 8 : 4; },
    pick(text, max) {
      let idx = this._index(); if (!idx) return null;
      let ws = this._words(text);
      if (!ws.length) return null;
      let bg = [];
      for (let i = 0; i + 1 < ws.length; i++) { if (ws[i] && ws[i + 1]) bg.push(ws[i] + ' ' + ws[i + 1]); }
      let scored = idx.e.map(e => {
        let score = 0, rare = 1e6, tm = 0;
        for (const w of ws) {
          if (!w) continue;
          for (const tw of e.t) {
            if (tw === w) { score += 20; rare = Math.min(rare, this._df(w)); tm++; break; }
            if (this._hit(tw, w)) { score += 10; rare = Math.min(rare, this._df(w)); tm++; break; }
          }
          for (const bw of e.b) { if (bw && this._hit(bw, w)) { score += this._bodyScore(this._df(w)); break; } }
        }
        for (const p of bg) {
          if (e.ts.indexOf(p) !== -1) { score += 14; tm++; }
          else if (e.bs.indexOf(p) !== -1) { score += 12; }
        }
        return { t: e.s.t, x: e.s.x, c: e.s.c, p: e.s.p, b: e.s.b, score: score, rare: tm ? rare : 1e6 };
      }).filter(s => s.score >= this.MIN_SCORE).sort((a, b) => b.score - a.score || a.rare - b.rare);
      if (!scored.length) return null;
      let total = 0, chosen = [];
      for (const s of scored) {
        if (chosen.length && total + s.x.length > max) break;
        chosen.push(s); total += s.x.length;
        if (chosen.length >= 3) break;
      }
      return chosen;
    },
    hasMatch(text) {
      try { let p = this._data ? this.pick(text) : null; return !!(p && p.length); } catch (e) { return false; }
    },
    needsLookup(text) {
      if (!this._data) return false;
      try {
        let ws = this._words(text);
        for (const w of ws) { if (w && this._df(w) === 0) return true; }
        return false;
      } catch (e) { return false; }
    },
    lookupQuery(text) {
      let s = String(text == null ? '' : text).toLowerCase().replace(/[’']/g, ' ').replace(/[-–—]/g, ' ');
      let stop = {};
      ('explique expliquer expliquez comment pourquoi combien quoi quel quelle quels quelles est sont etait le la les un une des de du au aux et ou car donc mais pour par sur dans avec sans plus moins que qui ce je tu il elle on nous vous me te se moi toi lui eux mon ma mes ton ta tes son sa ses leur leurs peux peut voudrais veux sais savoir comprends comprendre donne montrer montre rappelle revois merci stp svp aide dis fait faire exercice toute tous toutes exactement vraiment simplement surtout plutot alors aussi encore jamais toujours ainsi comme ca cela deja bien voila quand').split(' ').forEach(w => { if (w) stop[w] = 1; });
      let ws = s.replace(/[^a-zà-ÿ0-9+×÷\/ ]+/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !stop[w]);
      let q = ws.join(' ').slice(0, 120).trim();
      if (!q) q = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      return q;
    },
    toc() {
      if (!this._data) return '';
      let byBook = {}, order = [];
      this._data.sections.forEach(s => {
        let b = s.b || '?';
        if (!byBook[b]) { byBook[b] = {}; order.push(b); }
        let c = s.c || '';
        if (!byBook[b][c]) byBook[b][c] = [];
        byBook[b][c].push(s.t);
      });
      return order.map(b => {
        let ch = byBook[b];
        return b + ' : ' + Object.keys(ch).map(c => (c ? c + ' : ' : '') + ch[c].join(' · ')).join(' | ');
      }).join('\n');
    },
    block(text) {
      try {
        if (!this._data || !this.isMath(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO MATHÉMATIQUE - SES MAPPES DE COURS DE RÉFÉRENCE]'];
        L.push('This is the mathematics material he gave you' + (books.length > 1 ? ', in several documents' : '') + ': '
          + books.map(b => '« ' + b.title + ' »' + (b.note ? ' (' + b.note + ')' : '')).join(' ; ') + '.');
        if (sel && sel.length) {
          L.push("The sections below are the ones that match his question. State the rule the way these documents state it, in his language, then SHOW the working on lines exactly like the lesson sheet (and if it is a calculation the app has already laid it out - use its blocks as they are), then check the result. Never replace the written working with a sentence that only says what to do. If one of these sections does not really fit his question, ignore it and answer from what you know.");
          L.push("Write it in ordinary text on the page, never as a typeset formula: a $ sign or a backslash command is NOT rendered here - it arrives as literal junk in the middle of the formula - so write the maths with words, with ×, ÷, √ and the ordinary Unicode signs, and name the pages of his course you took it from.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push("No section of these documents matches his question exactly. Here is what they cover, so you can tell him what they hold and explain from them:");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  };
  App.MathMemo.warm();
  // Ronde 160/161 (souhait de l'utilisateur – seulement l'adresse, comme pour les dossiers précédents :
  // "cours d'anatomie : https://www.anatomiehumaine.net/cours", puis
  // "https://sofia.medicalistes.fr/spip/IMG/pdf/anatomie_et_physiologie_humaines.pdf").
  // Son anatomie se trouve comme QUINZE fiches dans src/anatomy/ : sept issues du
  // cours en ligne anatomiehumaine.net (ronde 160) et huit du manuel
  // "Anatomie et Physiologie Humaines" (medicalistes.fr, 204 pages, ronde 161).
  // C'est LA MÊME machine que pour le
  // mémo de calcul – construction des mots, stemming, index, poids des titres, recherche par mot-clé – mais
  // corpus propre, porte propre (isAnatomy) et bloc propre. MathMemo n'est
  // pas touché : la machine est copiée et écrasée, pour que
  // les dossiers de calcul continuent inchangés (deux corpus, un moteur).
  App.AnatomyMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/anatomy/cours-anatomie-bases.json.gz', kind: 'cours' },
      { url: 'src/anatomy/cours-anatomie-osteologie.json.gz', kind: 'cours' },
      { url: 'src/anatomy/cours-anatomie-muscles.json.gz', kind: 'cours' },
      { url: 'src/anatomy/cours-anatomie-cardio-vasculaire.json.gz', kind: 'cours' },
      { url: 'src/anatomy/cours-anatomie-digestif.json.gz', kind: 'cours' },
      { url: 'src/anatomy/cours-anatomie-neuro-sensoriel.json.gz', kind: 'cours' },
      { url: 'src/anatomy/cours-anatomie-reperes.json.gz', kind: 'cours' },
      { url: 'src/anatomy/physio-corps-cellule-tissus.json.gz', kind: 'cours' },
      { url: 'src/anatomy/physio-tegument-squelette-muscles.json.gz', kind: 'cours' },
      { url: 'src/anatomy/physio-nerveux-sensoriel.json.gz', kind: 'cours' },
      { url: 'src/anatomy/physio-endocrinien-sang.json.gz', kind: 'cours' },
      { url: 'src/anatomy/physio-coeur-vaisseaux-immunite.json.gz', kind: 'cours' },
      { url: 'src/anatomy/physio-respiratoire-digestif-metabolisme.json.gz', kind: 'cours' },
      { url: 'src/anatomy/physio-urinaire-genital-clinique.json.gz', kind: 'cours' },
      { url: 'src/anatomy/physio-termes-medicaux.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-structure-de-la-cellule.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-organisation-tissulaire.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-biologie-anatomie-physiologie.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-systeme-locomoteur-generalites.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-systeme-cardiovasculaire-generalites.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-systeme-respiratoire-generalites.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-systeme-digestif-generalites.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-systeme-urinaire-generalites.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-systeme-endocrinien-generalites.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-systeme-nerveux-generalites.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-lappareil-de-reproduction.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-anatomie-peau.json.gz', kind: 'cours' },
      { url: 'src/anatomy/ide-anatomie-vocabulaire-medical.json.gz', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 12,
    _data: null, _loading: null, _idx: null,
    // Mots génériques qui figurent dans presque CHAQUE question ("rôle", "fonction") -
    // ils ne disent rien sur le thème et tireraient sinon la section au
    // bon mot-titre vers le haut ("Quels sont les roles du foie ?" rencontrait
    // d'abord "Ligament : composition, roles et types").
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('role roles rôle rôles fonction fonctions sert servent contient contiennent presente presentent présente présentent differents differentes différents différentes plusieurs organe organes couche couches partie parties anatomie anatomie').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    // "coeur", "oeil", "caecum" : sans cela, les ligatures œ et æ tombent de la construction des
    // mots (elle ne connaît que a-z et à-ÿ) - "le coeur" ne trouverait aucune section.
    // Question ET dossier passent par la même fonction, donc tout reste cohérent.
    _words(t) {
      return App.MathMemo._words.call(this, String(t == null ? '' : t).replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE'));
    },
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, String(t == null ? '' : t).replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE'));
    },
    // La porte : s'agit-il du corps humain ? Un terme technique ET une question
    // (ou un court message qui ne nomme que le thème) - sinon
    // "j'ai mal au coeur" lui ouvrirait tout le cours.
    isAnatomy(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      const S = /(\bos\b|syst[èe]me|osseu|anatomie|anatomique|physiolog|neuroanatomie|myolog|ost[ée]olog|arthrolog|squelett|squelette|muscul|muscle|myocarde|myofibr|sarcom|actine|myosine|synap|dendrit|axone|ganglion|r[ée]flexe|tendon|tendineux|ligament|cartilag|chondro|articul|nerf|nerveux|neurone|neurolog|enc[ée]phal|cerveau|cervelet|tronc c[ée]r[ée]bral|lobe (frontal|pari[ée]tal|occipital|temporal)|m[ée]ninge|moelle [ée]pini[èe]re|dermatome|plexus|nerf (cr[âa]nien|rachidien|vague|trijumeau|facial|optique|olfactif)|cr[âa]ne|neurocr[âa]ne|visc[ée]rocr[âa]ne|suture|fontanelle|sinus (maxillaire|frontal|sph[ée]no[ïi]dal|ethmo[ïi]dal|paranasal)|mandibule|maxillaire|zygomatique|temporal|occipital|pari[ée]tal|frontal|ethmo[ïi]de|sph[ée]no[ïi]de|hyo[ïi]de|orbite|septum|vomer|vert[èe]bre|vert[ée]bral|rachis|colonne vert[ée]brale|disque intervert[ée]bral|atlas|axis|sacrum|coccyx|lombaire|cervical|thoracique|costal|c[ôo]te|sternum|clavicule|scapula|omoplate|hum[ée]rus|radius|ulna|cubitus|carpe|m[ée]tacarpe|phalange|f[ée]mur|tibia|fibula|p[ée]ron[ée]|patella|rotule|tarse|m[ée]tatarse|m[ée]nisque|bassin|coxal|iliaque|ischion|pubis|symphyse|ceinture (scapulaire|pelvienne)|thorax|abdomen|abdominal|diaphragme|estomac|gastrique|œsophage|oesophage|intestin|duod[ée]num|j[ée]junum|il[ée]on|c[ôo]lon|caecum|cæcum|appendice|rectum|anus|foie|h[ée]pat|pancr[ée]as|v[ée]sicule|sali(vaire|ve)|parotide|rein|r[ée]nal|n[ée]phr|vessie|uret[èe]re|poumon|pulmonaire|bronche|trach[ée]e|larynx|pharynx|[ée]piglotte|c[œo]eur|cardiaque|h[ée]matose|endocarde|p[ée]ricarde|valve (mitrale|tricuspide|aortique|pulmonaire)|aorte|coronaire|art[èe]re|art[ée]riel|veine|veineux|veinule|capillaire|sang|sanguin|lymph|peau|[ée]piderme|derme|hypoderme|k[ée]ratin|m[ée]lanin|poil|ongle|sudoripare|s[ée]bac[ée]e|[œo]il|r[ée]tine|corn[ée]e|scl[èe]re|scl[ée]rotique|iris|pupille|cristallin|humeur aqueuse|conjonctive|oreille|tympan|cochl[ée]e|vestibul|fosse nasale|langue|palais|dentaire|poplit|glut[ée]al|fessier|quadriceps|ischio[- ]jambier|delto[ïi]de|pectoral|trap[èe]ze|abducteur|adducteur|fl[ée]chisseur|extenseur|supinateur|pronateur|rotateur|coiffe des rotateurs|brachio|biceps|triceps|sartorius|gracile|semi[- ](tendineux|membraneux)|nomenclature|appareil (digestif|urinaire|respiratoire|reproducteur|locomoteur)|digestif|digestion|urinaire|respiratoire|reproducteur|entorse|luxation|subluxation|fracture|tendinopathie|tendinite|arthrose|[ée]pith[ée]lium|tissu)/;
      const S2 = /(tissu|épithél|epithel|conjonctif|cellul|organite|ribosome|mitochondri|\b(adn|arn|atp)\b|mitose|m[ée]iose|chromosome|hormone|glande|endocrin|insuline|glucagon|thyro[ïi]de|parathyro|surr[ée]nal|hypophyse|ocytocine|cortisol|aldost[ée]rone|testost[ée]rone|[œo]strog[èe]ne|progest[ée]rone|m[ée]latonine|immunit|anticorps|antig[èe]ne|lymphocyte|leucocyte|[ée]rythrocyte|plaquette|thrombocyte|h[ée]matie|h[ée]moglobine|phagocyt|m[ée]tabol|enzyme|glycolyse|glucide|lipid|prot[ée]in|respirat|alv[ée]ole|ventilation|spirom|n[ée]phron|miction|urinaire|urin|gam[èe]te|ovocyte|spermatozo|grossesse|ovul|f[ée]condation|ut[ée]rus|vagin|testicule|ovaire|scrotum|p[ée]nis|spermatogen|ovogen|sympt[ôo]me|diagnostic|clinique|anamn[èe]se|inflammation|thermor[ée]gulation|temp[ée]rature|hom[ée]ostasie|[ée]lectrolyte|osmol|osmor[ée]cept|osmose|p[ée]ristalt|digestif|pr[ée]fix|suffix|m[ée]dic|glossaire)/;
      const Q = /(explique|expliquer|expliquez|comment|c'est quoi|qu'est[- ]ce|que veut dire|signifie|pourquoi|combien|quel|quelle|quels|quelles|parle[- ]?moi|parler|d[ée]cri|d[ée]fini|r[ôo]le|fonction|sert|situ[ée]|o[ùu] se trouve|localis|compose|constitu|donne[- ]?moi|dis[- ]?moi|montre|rappelle|cite|liste|pr[ée]sente|r[ée]sume|raconte|aide|le[çc]on|revois|revoir|r[ée]vis|m[ée]thode|corrige|v[ée]rifie|d[ée]taille|[ée]nonce|\?)/;
      if (!S.test(t) && !S2.test(t)) return false;
      if (Q.test(t)) return true;
      // Court et seulement le thème ("le systeme nerveux", "les os du carpe") - c'est
      // une question au cours, même sans point d'interrogation. Sauf si c'est un
      // message À SON SUJET ("j'ai mal au coeur", "mon bras me fait mal") :
      // là, aucune feuille de cours n'a sa place dans le prompt.
      // Les accents ne sont pas des caractères de mot pour \\b : dans "système", \\bme\\b voit un
      // mot "me" - le texte de corps était ainsi méconnu comme message À SON SUJET.
      // C'est pourquoi on vérifie une copie sans accents pour le veto.
      let tn = t.replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u02bc]/g, "'");
      if (/\b(j'ai|j ai|j'|je|mon|ma|mes|me|tu|ton|ta|tes|il|elle|nous|vous|ils|elles|suis|aime|aimes|pense|penses|crois|sens|sais|vais|veux|peux)\b/.test(tn)) return false;
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
            if (!secs.length) { console.warn('[AnatomieMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[AnatomieMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[AnatomieMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    block(text) {
      try {
        if (!this._data || !this.isAnatomy(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ["[MÉMO D'ANATOMIE HUMAINE - LES MAPPES DE SON COURS DE RÉFÉRENCE]"];
        L.push('Voici le cours d\'anatomie avec lequel il travaille' + (books.length > 1 ? ', en plusieurs fiches' : '') + ' : '
          + (books.length > 5
            ? Object.entries(books.reduce((o, b) => { let h = ''; try { h = new URL(b.source || '').hostname.replace(/^www\./, ''); } catch (e) { h = b.author || b.title || ''; } o[h] = (o[h] || 0) + 1; return o; }, {})).map(([h, n]) => '« ' + h + ' » (' + n + (n > 1 ? ' fiches' : ' fiche') + ')').join(' ; ')
            : books.map(b => '« ' + b.title + ' »').join(' ; ')) + '.');
        if (sel && sel.length) {
          L.push("The sections below are the ones that match his question. Teach from them: name the structures in the order the course names them, keep its own terms (this is the nomenclature his exams use), give its numbers (how many, which, where, what it attaches to), and when a section carries a mnemonic, give it. Say which part of his course it comes from. If one of these sections does not really fit his question, ignore it and answer from what you know - but never invent a muscle, an origin, an insertion, a nerve or an innervation that is not in these sections: it is better to say what you are sure of.");
          L.push("Write it as ordinary text on the page: no emoji, no $ sign, no LaTeX. A list of structures stays a plain list, one per line, in the course's order.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push("No section of his course matches this question exactly. Here is what his course covers, so you can tell him what it holds and explain from it:");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.AnatomyMemo.warm();
  // Ronde 162 (souhait de l'utilisateur - quatre adresses dans un message) : une
  // NOUVELLE matière. HTML et CSS n'ont jamais été traités ici, donc un
  // corpus propre dans src/web/ : (1) le cours apprendre-html-et-css.com, qu'il a
  // envoyé deux fois (la page elle-même et une leçon MDN en plus), et
  // (2) un cours HTML/CSS en PDF (projet.eu.org, 2nde ICN, 88 pages).
  // C'est LA MÊME machine que pour le mémo de calcul et d'anatomie
  // (copiée et écrasée), avec porte propre (isWeb) et bloc propre.
  App.WebMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/web/web-introduction.json.gz', kind: 'cours' },
      { url: 'src/web/web-les-bases-du-html.json.gz', kind: 'cours' },
      { url: 'src/web/web-les-bases-du-css.json.gz', kind: 'cours' },
      { url: 'src/web/web-mise-en-forme-de-texte.json.gz', kind: 'cours' },
      { url: 'src/web/web-modele-de-boite.json.gz', kind: 'cours' },
      { url: 'src/web/web-alignement-des-blocs.json.gz', kind: 'cours' },
      { url: 'src/web/web-gestion-du-fond.json.gz', kind: 'cours' },
      { url: 'src/web/web-les-balises-video-et-audio.json.gz', kind: 'cours' },
      { url: 'src/web/web-tableaux.json.gz', kind: 'cours' },
      { url: 'src/web/web-formulaires.json.gz', kind: 'cours' },
      { url: 'src/web/web-responsive-design.json.gz', kind: 'cours' },
      { url: 'src/web/web-programme-avance.json.gz', kind: 'cours' },
      { url: 'src/web/web-la-mise-en-production.json.gz', kind: 'cours' },
      { url: 'src/web/web-mdn-html.json.gz', kind: 'cours' },
      { url: 'src/web/pdf-bases-html.json.gz', kind: 'cours' },
      { url: 'src/web/pdf-bases-css.json.gz', kind: 'cours' },
      { url: 'src/web/pdf-texte-font.json.gz', kind: 'cours' },
      { url: 'src/web/pdf-boite.json.gz', kind: 'cours' },
      { url: 'src/web/pdf-background.json.gz', kind: 'cours' },
      { url: 'src/web/pdf-medias.json.gz', kind: 'cours' },
      { url: 'src/web/pdf-tableaux-formulaires.json.gz', kind: 'cours' },
      { url: 'src/web/pdf-aller-plus-loin.json.gz', kind: 'cours' },
      { url: 'src/web/web-qkzk-html-css.json.gz', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 12,
    _data: null, _loading: null, _idx: null,
    // Les mêmes mots de remplissage que dans le mémo de calcul, plus ceux qui figurent dans CHAQUE
    // question HTML/CSS ("comment", "code", "page") - ils ne disent rien
    // sur le thème et tireraient sinon la section au bon mot vers le haut.
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('code codes page pages site sites web html5 css3 element elements attribut attributs balise balises propriete proprietes valeur valeurs fichier fichiers exemple exemples ligne lignes fonctionne fonctionnement difference differences').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, t);
    },
    // La porte : s'agit-il de HTML ou CSS ? Un terme technique ET une question (ou un
    // court message qui ne nomme que le thème). Les termes techniques sont ici
    // plus restreints que dans les autres dossiers : "texte", "position" ou
    // "propriete" seuls disent autant dans une phrase sur le corps ou sur
    // les mathématiques, donc ils ne comptent pas ici.
    isWeb(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      // Ronde 199 : Java et JavaScript ne sont pas HTML/CSS - ils ont leur
      // propre cours (src/code, App.CodeMemo).
      if (/\b(java|javascript|jquery|typescript|jdk|jvm)\b/.test(t) && !/\bhtml\b|\bcss\b|<[a-z]/.test(t)) return false;
      const S = /(<\/?(html|head|body|div|span|p|a|ul|ol|li|h[1-6]|img|table|tr|td|th|form|input|label|select|option|button|section|article|header|footer|nav|main|aside|video|audio|source|iframe|meta|link|script|style|br|hr|figure|figcaption)\b|\bhtml5?\b|\bcss3?\b|\bdiv\b|\bspan\b|balise|balisage|attribut|doctype|s[ée]lecteur|s[ée]lecteurs|feuille de style|flexbox|\bflex\b|\bgrid\b|\bfloat\b|mod[èe]le de bo[îi]te|\bbox[- ]?sizing\b|\bmargin\b|\bpadding\b|\bborder\b|\bbackground\b|\bdisplay\b|\bz-index\b|\bnth-child\b|\bposition\s*:\s*(absolute|relative|fixed|sticky)\b|pseudo[- ]?(classe|classes|[ée]l[ée]ment|[ée]l[ée]ments)|::before|::after|\bsvg\b|\bhref\b|\bsrc\b|\balt\b|hypertexte|\bw3c\b|placeholder|bookmark|responsive|\blien(s)?\b(?=[\s\S]*\b(page|site|web|html|css|ancre|href|navigateur|url|cliqu)\b)|\bformulaire(s)?\b(?=[\s\S]*\b(html|css|web|champ|input|inscription|envoyer|cr[ée]er|site|balise)\b)|responsive design|media quer|points? de rupture|police de caract|barre de navigation|page web|site web|langage de balisage|\bclass\b\s*(=|et|et\s+id|css)|#id\b|\.class\b|attributs? (html|id|class))/;
      const Q = /(explique|expliquer|expliquez|comment|c'est quoi|qu'est[- ]ce|que veut dire|signifie|[àa] quoi (sert|servent)|pourquoi|combien|quel|quelle|quels|quelles|parle[- ]?moi|d[ée]cri|donne[- ]?moi|dis[- ]?moi|montre|rappelle|cite|liste|pr[ée]sente|r[ée]sume|aide|le[çc]on|revois|revoir|r[ée]vis|m[ée]thode|corrige|v[ée]rifie|d[ée]taille|[ée]nonce|\?)/;
      if (!S.test(t)) return false;
      if (Q.test(t)) return true;
      // Court et seulement le thème ("les balises de structure", "flexbox") - c'est
      // une question au cours, même sans point d'interrogation. Sauf si c'est un
      // message À PROPOS de quelque chose ("ma classe me saoule") : là, aucune
      // feuille de cours n'a sa place dans le prompt.
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u02bc]/g, "'");
      if (/\b(j'ai|j ai|j'|je|mon|ma|mes|me|tu|ton|ta|tes|il|elle|nous|vous|ils|elles|suis|aime|aimes|pense|penses|crois|sens|sais|vais|veux|peux)\b/.test(tn)) return false;
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
            if (!secs.length) { console.warn('[WebMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[WebMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[WebMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    block(text) {
      try {
        if (!this._data || !this.isWeb(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO HTML ET CSS - LES COURS DE RÉFÉRENCE]'];
        L.push("Voici les cours de HTML et de CSS avec lesquels il travaille" + (books.length > 1 ? ', en plusieurs leçons' : '') + ' : '
          + (books.length > 5
            ? Object.entries(books.reduce((o, b) => { let h = ''; try { h = new URL(b.source || '').hostname.replace(/^www\./, ''); } catch (e) { h = b.author || b.title || ''; } o[h] = (o[h] || 0) + 1; return o; }, {})).map(([h, n]) => '« ' + h + ' » (' + n + (n > 1 ? ' leçons' : ' leçon') + ')').join(' ; ')
            : books.map(b => '« ' + b.title + ' »').join(' ; ')) + '.');
        if (sel && sel.length) {
          L.push("The sections below are the ones that match his question. Answer from them: keep the course's own terms (élément, balise, attribut, sélecteur, propriété, valeur), give the code exactly as the course writes it, and say which lesson it comes from. If one of these sections does not really fit his question, ignore it and answer from what you know - but never invent a tag, an attribute, a property or a value that is not in these sections.");
          L.push("Write it as ordinary text on the page: no emoji, no $ sign, no LaTeX. Code stays in a plain code block, exactly as in the course, and every tag you name is written between < and > as the course does.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push("No section of these courses matches his question exactly. Here is what they cover, so you can tell him what they hold and explain from them:");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.WebMemo.warm();
  // Ronde 163 (souhait de l'utilisateur - de nouveau seulement des adresses, six dans un
  // message) : deux nouvelles matières. (1) Encore deux ouvrages HTML/CSS, qui
  // figurent déjà plus haut dans App.WebMemo.SOURCES (le PDF tony3d3 n'était pas
  // accessible, voir src/README.md). (2) PYTHON - une nouvelle matière : un
  // corpus propre dans src/python/ avec les quatre cours qu'il a envoyés. La même
  // machine (copiée et écrasée), porte propre (isPython), bloc propre.
  App.PythonMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/python/py-sdv-bases.json.gz', kind: 'cours' },
      { url: 'src/python/py-sdv-controle.json.gz', kind: 'cours' },
      { url: 'src/python/py-sdv-fichiers-modules.json.gz', kind: 'cours' },
      { url: 'src/python/py-sdv-fonctions-chaines.json.gz', kind: 'cours' },
      { url: 'src/python/py-sdv-conteneurs-qualite.json.gz', kind: 'cours' },
      { url: 'src/python/py-sdv-scientifique.json.gz', kind: 'cours' },
      { url: 'src/python/py-sdv-objets-graphique.json.gz', kind: 'cours' },
      { url: 'src/python/py-sdv-projets.json.gz', kind: 'cours' },
      { url: 'src/python/py-zeste-premiers-pas.json.gz', kind: 'cours' },
      { url: 'src/python/py-zeste-donnees.json.gz', kind: 'cours' },
      { url: 'src/python/py-zeste-programmes.json.gz', kind: 'cours' },
      { url: 'src/python/py-zeste-types.json.gz', kind: 'cours' },
      { url: 'src/python/py-zeste-fonctions.json.gz', kind: 'cours' },
      { url: 'src/python/py-zeste-entrees-sorties.json.gz', kind: 'cours' },
      { url: 'src/python/py-zeste-plus-loin.json.gz', kind: 'cours' },
      { url: 'src/python/py-zeste-bibliotheque.json.gz', kind: 'cours' },
      { url: 'src/python/py-zeste-annexes.json.gz', kind: 'cours' },
      { url: 'src/python/py-buffat-base-python.json.gz', kind: 'cours' },
      { url: 'src/python/py-courspython-intro.json.gz', kind: 'cours' },
      // Ronde 164 (souhait de l'utilisateur - de nouveau seulement des adresses, trois dans un message) :
      // trois nouveaux ouvrages Python. (1) "Apprendre a programmer avec
      // Python 3" de Gerard Swinnen (16 fascicules de chapitres dans src/python/py-inforef-*.json), (2) le
      // fascicule de cours universitaire de Thibault Clerice (8 fascicules dans py-ponteineptique-*),
      // (3) "Premiers pas en Python" du prof. Djungu (3 fascicules dans py-in2p3-*).
      { url: 'src/python/py-inforef-sorciers.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-premiers-pas.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-controle-flux.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-boucles.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-types.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-fonctions.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-fenetres.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-fichiers.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-structures.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-objets.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-interfaces.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-projets.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-bdd.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-web.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-impression.json.gz', kind: 'cours' },
      { url: 'src/python/py-inforef-reseau.json.gz', kind: 'cours' },
      { url: 'src/python/py-ponteineptique-bases.json.gz', kind: 'cours' },
      { url: 'src/python/py-ponteineptique-fonctions-fichiers.json.gz', kind: 'cours' },
      { url: 'src/python/py-ponteineptique-regex.json.gz', kind: 'cours' },
      { url: 'src/python/py-ponteineptique-donnees.json.gz', kind: 'cours' },
      { url: 'src/python/py-ponteineptique-modules-cli.json.gz', kind: 'cours' },
      { url: 'src/python/py-ponteineptique-flask.json.gz', kind: 'cours' },
      { url: 'src/python/py-ponteineptique-sqlalchemy.json.gz', kind: 'cours' },
      { url: 'src/python/py-ponteineptique-api-tests.json.gz', kind: 'cours' },
      { url: 'src/python/py-in2p3-generalites.json.gz', kind: 'cours' },
      { url: 'src/python/py-in2p3-variables.json.gz', kind: 'cours' },
      { url: 'src/python/py-in2p3-controle.json.gz', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 12,
    _data: null, _loading: null, _idx: null,
    // Mots de remplissage comme dans les autres dossiers, plus ceux qui figurent dans CHAQUE
    // question Python ("programme", "script", "exemple") - et "python"
    // lui-même, parce qu'il apparaît dans chaque section.
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('python python3 code codes programme programmes script scripts fichier fichiers exemple exemples ligne lignes terminal shell affiche afficher affichage').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    // Ronde 164 : la décomposition en mots des dossiers jette tout ce qui a moins de quatre lettres.
    // Or, ce sont justement les courts termes techniques qui manquent en Python : "API",
    // "SQL", "CSV", "ORM", "CLI" - une question comme "c'est quoi une API ?" ne trouvait
    // aucune section. C'est pourquoi ce dossier-matière garde en plus une
    // courte liste de mots courts autorisés.
    SHORT_WORDS: (function () {
      let o = {};
      ('api sql csv orm cli xml uri pip url utf pdf gui poo mvc').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })(),
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/[’']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-zà-ÿ0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    // La porte : s'agit-il du langage Python ? Un mot Python ET une question.
    // "variable", "fonction", "liste", "boucle", "classe" ou "module" seuls
    // ne comptent PAS ici - ils figurent de la même façon dans les mathématiques ou dans une
    // phrase ordinaire ("ma classe", "boucle d'oreille"), et une feuille de cours
    // serait alors déplacée. Il faut qu'il y ait "python" ou une vraie
    // commande Python.
    isPython(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      // Ronde 199 : s'il nomme Java ou JavaScript, la question n'appartient pas à Python.
      // « c'est quoi une boucle for en Java ? » correspondait ici via « boucle for » et
      // recevait un bloc Python pour une question Java.
      if (/\b(java|javascript|jquery|typescript|jdk|jvm|jakarta)\b/.test(t) && !/python/.test(t)) return false;
      const S = /(\bpython3?\b|\.py\b|\bpy\b|\bpycon\b|\bcpython\b|\banaconda\b|\bminiconda\b|\bjupyter\b|\bnotebook\b|\bnumpy\b|\bpandas\b|\bmatplotlib\b|\bbio-?python\b|\bscript\s+python|\bprogramme\s+python|\blangage\s+python|\bdef\s+[a-z_à-ÿ]|\bdef\b|\bimport\s+[a-z_à-ÿ]|\bfrom\s+[a-z_à-ÿ]+\s+import\b|print\s*\(|\bprint\b|\binput\b|\blen\s*\(|range\s*\(|\bfloat\s*\(|\bstr\s*\(|\bint\s*\(|\bappend\b|\bf-?strings?\b|\btuples?\b|\bdict\b|boucles?\s+(for|while)|\bwhile\b.{0,20}:|\bfor\s+[a-z_]+[^.\n]{0,25}\bin\b|\bindentation\b|\binterpr[ée]teur python|\bidle\b|\bpip\b|\bconda\b|\bnotebook jupyter|\bregex\b|\bexpressions?\s+r[ée]guli[èe]res?\b|\bre\.(compile|sub|match|search|findall)\b|\bflask\b|\bjinja2?\b|\bsqlalchemy\b|\bsqlite3?\b|\bmysql\b|\bsql\b|\borm\b|\brequests\b|\bjson\b|\bcsv\b|\bapi\b|\bunittest\b|\bpytest\b|\bclick\b|\bcli\b|\bvenv\b|\bvirtualenv\b|\btkinter\b|\bwerkzeug\b|\btests?\s+unitaires?\b|\bmodule\s+re\b|\blignes?\s+de\s+commande\b|hach(er|age|é|ez|ons)?\b.{0,28}\bmot\s+de\s+passe\b|\bmot\s+de\s+passe\b.{0,28}\bhach|\bexcept\b.{0,12}\b(ValueError|KeyError|TypeError|IndexError)|rendre?_template|\burl_for\b)/;
      const Q = /(explique|expliquer|expliquez|comment|c'est quoi|qu'est[- ]?ce|que veut dire|signifie|[àa] quoi (sert|servent)|pourquoi|combien|quel|quelle|quels|quelles|parle[- ]?moi|d[ée]cri|donne[- ]?moi|dis[- ]?moi|montre|rappelle|cite|liste|pr[ée]sente|r[ée]sume|aide|le[çc]on|revois|revoir|r[ée]vis|m[ée]thode|corrige|v[ée]rifie|d[ée]taille|[ée]cris|[ée]crire|cr[ée]e|cr[ée]er|corrige mon|mon code|\?)/;
      if (!S.test(t)) return false;
      if (Q.test(t)) return true;
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u02bc]/g, "'");
      if (/\b(j'ai|j ai|j'|je|mon|ma|mes|me|tu|ton|ta|tes|il|elle|nous|vous|ils|elles|suis|aime|aimes|pense|penses|crois|sens|sais|vais|veux|peux)\b/.test(tn)) return false;
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
            if (!secs.length) { console.warn('[PythonMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[PythonMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[PythonMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    block(text) {
      try {
        if (!this._data || !this.isPython(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO PYTHON - LES COURS DE RÉFÉRENCE]'];
        L.push("Voici les cours de Python avec lesquels il travaille" + (books.length > 1 ? ', en plusieurs cours' : '') + ' : '
          + (books.length > 5
            ? Object.entries(books.reduce((o, b) => { let h = ''; try { h = new URL(b.source || '').hostname.replace(/^www\./, ''); } catch (e) { h = b.author || b.title || ''; } o[h] = (o[h] || 0) + 1; return o; }, {})).map(([h, n]) => '« ' + h + ' » (' + n + ' cours)').join(' ; ')
            : books.map(b => '« ' + b.title + ' »').join(' ; ')) + '.');
        if (sel && sel.length) {
          L.push("The sections below are the ones that match his question. Answer from them: keep the course's own terms (variable, chaîne, liste, dictionnaire, fonction, argument, module), give the code exactly as the course writes it - in a plain code block, ready to run - and say which course and which section it comes from. Explain what the code does line by line when it is short. If one of these sections does not really fit his question, ignore it and answer from what you know - but never invent a method, an argument or a library function that is not in these sections.");
          L.push("Write it as ordinary text on the page: no emoji, no $ sign, no LaTeX. A Python keyword or a name stays in ordinary characters, exactly as in the course.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push("No section of these courses matches his question exactly. Here is what they cover, so you can tell him what they hold and explain from them:");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.PythonMemo.warm();
  // Ronde 199 (souhait de l'utilisateur) : « apprends-lui le codage, le java, le css, le
  // html, le python et je serais un programmeur comblé … donne-lui ton script en
  // intégration ou des cours ». HTML/CSS (WebMemo) et Python (PythonMemo) ont
  // leur porte et leur corpus ; JAVA et JAVASCRIPT manquaient complètement. Ce dossier
  // est leur porte. Le vrai cours se trouve dans src/code/texte.json.gz (Wikilivre,
  // chapitre par chapitre) et remplace cette fiche via App.Corpus, dès qu'un chapitre couvre la
  // question. La porte est volontairement ÉTROITE et exclut
  // Python et le web : sinon deux blocs de cours figureraient dans la même réponse.
  App.CodeMemo = {
    MAX: 3400,
    isCode(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      const S = /(\bjava\b|\bjavascript\b|\becmascript\b|\bnode\.?js\b|\bjquery\b|\btypescript\b|\bjdk\b|\bjre\b|\bjvm\b|\bjakarta\b|\bmaven\b|\bgradle\b|\bpoo\b|\bprogrammation objet\b|apprendre (à |a )?(coder|programmer)|cours de (code|programmation|java|javascript)|(tutoriel|le[çc]on|exercice|d[ée]butant|cours).{0,40}(java|javascript|programmation|code)|\bprogrammation\b(?!\s+neurolinguistique)|\balgorithmes?\b|\bcode source\b|\bcoder\b|\bint[ée]gr\w*\b.{0,40}\b(code|programme|script|application|fonctionnalit[ée])\b|\bam[ée]lior\w*\b.{0,40}\b(application|site|programme|code|script)\b)/;
      if (!S.test(t)) return false;
      // Python et le web gardent leur propre porte (et leur propre cours).
      try {
        if (App.PythonMemo && App.PythonMemo.isPython && App.PythonMemo.isPython(text)) return false;
        if (App.WebMemo && App.WebMemo.isWeb && App.WebMemo.isWeb(text)) return false;
      } catch (e) {}
      return true;
    },
    block(text) {
      try {
        if (!this.isCode(text)) return '';
        return [
          "[PROGRAMMATION - COURS DE RÉFÉRENCE (JAVA, JAVASCRIPT)]",
          "Il apprend à programmer. Ses cours sont sous la main : le cours de Java et le cours de JavaScript (Wikilivre), en entier, chapitre par chapitre - le vrai texte arrive ci-dessous dès qu'un chapitre répond à sa question. Pour HTML et CSS c'est l'autre cours (le Web), pour Python le cours de Python.",
          "Manière de répondre : explique comme à un débutant, nomme le chapitre et reprends la phrase exacte du cours ; écris ensuite le code COMPLET dans un bloc de code (avec le nom du fichier et la commande pour le lancer), et commente les lignes qui comptent. Vérifie le code avant de le donner. Un cours ne se récite pas : il s'explique, avec un exemple qui tourne.",
          "Ne dis jamais que tu ne peux pas apprendre à programmer, ni qu'il doit chercher un cours ailleurs : il est là."
        ].join("\n");
      } catch (e) { return ''; }
    }
  };
  // Ronde 165 (souhait de l'utilisateur - de nouveau seulement des adresses, cinq dans un
  // message) : SEXOLOGIE, une nouvelle matière. Corpus propre dans src/sexo/ avec les
  // cinq ouvrages qu'il a envoyés : le guide pour la première ligne du RSSP (cerhes.org), les
  // "Notions generales de sexologie" du CHU Nantes, le
  // guide de prescription du RSSP (santesexuelle.org), le fascicule universitaire
  // Item 40 du CNGOF (UNF3S) et le guide EVRAS (evras.be).
  // C'est LA MÊME machine que pour les dossiers précédents (copiée et
  // écrasée), avec porte propre (isSexo) et bloc propre. Sa porte se trouve
  // volontairement AVANT le mémo d'anatomie : "c'est quoi le vaginisme ?" serait sinon capté par son
  // cours de corps via le mot "vagin", et il n'y a rien là-dessus.
  // Ronde 172 (souhait de l'utilisateur - de nouveau seulement une adresse) : BDSM. La fiche
  // src/sexo/bdsm-art-de-dominer.json est le résumé du "The New Topping Book" de Dossie Easton
  // et Janet Hardy (en français "L'Art de dominer",
  // Bookey). Elle se trouve dans le même corpus que la sexologie, parce que le thème en
  // fait partie : rôles et leur fluidité, consentement et négociation (oui/non/
  // peut-être), safewords, éthique et confidentialité, communication, préparation
  // et conduite d'une scène, incidents et premiers secours, post-soin et
  // top-drop, jouets et leur entretien, communauté, jeu d'ombre et rituel -
  // et à la fin les règles de travail pour Sofia. La porte (isSexo) a été
  // étendue aux mots BDSM.
  App.SexoMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/sexo/cerhes-guide-premier-recours.json.gz', kind: 'cours' },
      { url: 'src/sexo/chu-nantes-notions-generales.json.gz', kind: 'cours' },
      { url: 'src/sexo/santesexuelle-guide-prescription.json.gz', kind: 'cours' },
      { url: 'src/sexo/unf3s-item40-sexualite.json.gz', kind: 'cours' },
      { url: 'src/sexo/evras-sexualite-comportements.json.gz', kind: 'cours' },
      { url: 'src/sexo/bdsm-art-de-dominer.json.gz', kind: 'cours' },
      // SFW-only: '{ url: 'src/sexo/objets-plaisir.json.gz', kind: 'cours' },' supprime (moderation 2026-10-28).
      // SFW-only: '{ url: 'src/sexo/pratiques-configurations.json.gz', kind: 'cours' },' supprime (moderation 2026-10-28).
      // SFW-only: '{ url: 'src/sexo/scenarios-contrainte.json.gz', kind: 'cours' },' supprime (moderation 2026-10-28).
      // SFW-only: '{ url: 'src/sexo/anatomie-intime.json.gz', kind: 'cours' },' supprime (moderation 2026-10-28).
      // SFW-only: '{ url: 'src/sexo/seins.json.gz', kind: 'cours' },' supprime (moderation 2026-10-28).
      // SFW-only: 'src/sexo/objets-donjon.json.gz' supprime (moderation 2026-10-28).
    ],
    MAX: 5200,
    MIN_SCORE: 12,
    _data: null, _loading: null, _idx: null,
    // Mots de remplissage comme dans les autres dossiers, plus ceux qui figurent dans CHAQUE
    // question de sexologie ("sexualite", "sexe", "trouble", "dysfonction") -
    // ils ne disent rien sur le thème et tireraient sinon la section la plus épaisse
    // vers le haut.
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('sexe sexes sexuel sexuelle sexuelles sexualite sexualites sexologique sexologiques sexologue sexologues sexotherapie corps personne personnes femme femmes homme hommes couple couples rapport rapports partenaire partenaires trouble troubles dysfonction dysfonctions probleme problemes cause causes prise prises soin soins therapeutique clinique sante patient patiente patients').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    // La décomposition en mots jette tout ce qui a moins de quatre lettres ; dans cette matière,
    // les courts termes techniques sont justement les importants : IST, VIH, MST, OMS,
    // DSM, PMA. C'est pourquoi une courte liste de mots courts autorisés en plus.
    SHORT_WORDS: (function () {
      let o = {};
      ('ist vih mst oms dsm pma ivg cis gay sida').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })(),
    // "oestrogenes", "perinee" : sans cela, les ligatures œ et æ tombent de la construction des
    // mots - "les oestrogenes" ne trouverait aucune section. Question ET dossier passent
    // par la même fonction, donc tout reste cohérent.
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae').replace(/[’']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-zà-ÿ0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, String(t == null ? '' : t).replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae'));
    },
    // La porte : s'agit-il de sexualité, de ses troubles ou de sa
    // prévention ? Un terme technique ET une question (ou un court message qui
    // ne nomme que le thème) - sinon "ma libido est bizarre" lui ouvrirait
    // tout le cours. "corps", "sante" ou "couple" seuls ne comptent PAS ici.
    isSexo(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      const S = /(sexolog|sexu|dyspareuni|algopareuni|apareuni|eupareuni|anodyspareuni|\banism|vaginism|vaginite|vaginose|vaginal|vulvovaginit|[ée]jacul|anorgasmi|anaphrodisi|orgasm|clitorid|clitoris|vulvodyni|vestibulodyni|vulv|p[eé]rin[ée]e|endometrios|priapism|libido|masturb|dysfonction [ée]rectile|trouble [ée]rectile|[ée]rection|phimosis|paraphimosis|lapeyronie|balanite|d[ée]calottage|hymen|n[ée]ovagin|vaginectomie|phalloplastie|m[ée]toidioplastie|dicklit|identit[ée] de genre|transgenre|transmasculin|transf[ée]minin|dysphorie|non[- ]?binaire|\btrans\b|testost[ée]rone|(?:œ|oe)strog[èe]ne|androg[èe]ne|vasocongestion|[ée]rog[èe]nes|pr[ée]liminaires|fellation|fellatio|cunnilingus|sodomie|p[ée]n[ée]trat|\bp[ée]nis\b|\bverge\b|consentement|pornograph|sexting|sextos?|nudes?\b|\bevras\b|premier rapport|lubrification|pubert[ée]|coming[- ]?out|lgbt|sildenafil|tadalafil|vard[ée]nafil|avanafil|dapox[ée]tine|ipde[- ]?5|viagra|cialis|levitra|spedra|priligy|aphrodisiaque|contracepti|pr[ée]servatif|capote|\bist\b|\bvih\b|\bmst\b|\bsida\b|spermoculture|sperme|m[ée]nopause|andropause|impuissance|mycose|frigidit[ée]|excitation sexuelle|d[ée]sir sexuel|troubles? du d[ée]sir|syphilis|gonocoque|chlamydia|trichomonas|condylome|herp[èe]s|papillomavirus|excision|mutilation|kegel|\bh[ée]gar\b|bougies? de h[ée]gar|rokitansky|k[üu]ster|hyst[ée]rectomie|\bivg\b|violences? sexuelles?|violences? conjugales?|\bviol\b|bdsm|sadomaso|sadomasochis|\bsadique|\bsadisme|\bmasochis|shibari|kinbaku|\bbondage\b|safeword|mot[- ]?de[- ]?s[ée]curit[ée]|subspace|topspace|aftercare|\bkink|f[ée]tichis|fetichis|\bmunch|domin(?:ation|ant|ante|ants|antes|ateur|atrice|ateurs|atrices)|soumission (?:[ée]rotique|volontaire|consentie)|esclave sexuel|jeu d'ombres?|shadow play)/;
      const Q = /(explique|expliquer|expliquez|comment|c'est quoi|qu'est[- ]?ce|que veut dire|signifie|pourquoi|combien|quel|quelle|quels|quelles|parle[- ]?moi|parler|d[ée]cri|d[ée]fini|r[ôo]le|fonction|sert|situ[ée]|o[ùu] se trouve|localis|compose|constitu|donne[- ]?moi|dis[- ]?moi|montre|rappelle|cite|liste|pr[ée]sente|r[ée]sume|raconte|aide|le[çc]on|revois|revoir|r[ée]vis|m[ée]thode|corrige|v[ée]rifie|d[ée]taille|[ée]nonce|comprend|\?)/;
      if (!S.test(t)) return false;
      if (Q.test(t)) return true;
      // Court et seulement le thème ("le vaginisme", "la dyspareunie") - c'est une
      // question au cours, même sans point d'interrogation. Sauf si c'est un message
      // À SON SUJET ("j'ai mal pendant les rapports") : là, aucune feuille de cours
      // n'a sa place dans le prompt. Les accents ne sont pas des caractères de mot pour \\b, c'est pourquoi
      // on vérifie une copie sans accents pour le veto.
      let tn = t.replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u02bc]/g, "'");
      if (/\b(j'ai|j ai|j'|je|mon|ma|mes|me|tu|ton|ta|tes|il|elle|nous|vous|ils|elles|suis|aime|aimes|pense|penses|crois|sens|sais|vais|veux|peux)\b/.test(tn)) return false;
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
            if (!secs.length) { console.warn('[SexoMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[SexoMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[SexoMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    block(text) {
      try {
        if (!this._data || !this.isSexo(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO DE SEXOLOGIE - LES COURS DE RÉFÉRENCE]'];
        L.push("Voici les cours de sexologie avec lesquels il travaille" + (books.length > 1 ? ', en plusieurs fiches' : '') + ' : '
          + (books.length > 5
            ? Object.entries(books.reduce((o, b) => { let h = ''; try { h = new URL(b.source || '').hostname.replace(/^www\./, ''); } catch (e) { h = b.author || b.title || ''; } o[h] = (o[h] || 0) + 1; return o; }, {})).map(([h, n]) => '« ' + h + ' » (' + n + (n > 1 ? ' fiches' : ' fiche') + ')').join(' ; ')
            : books.map(b => '« ' + b.title + ' »').join(' ; ')) + '.');
        if (sel && sel.length) {
          L.push("The sections below are the ones that match his question. This is a medical and sexological course: answer factually, with the course's own terms (dyspareunie, vaginisme, anaphrodisie, anorgasmie, dysfonction erectile, IPDE-5), give its own numbers (doses, percentages, durations, the phases in their order, the criteria that distinguish primaire from secondaire), keep its distinctions exactly (what is organic, what is iatrogenic, what is psychogenic), and say which fiche and which section it comes from. Keep it sober and respectful: no moral judgement, no emoji, no jokes. If one of these sections does not really fit his question, ignore it and answer from what you know - but never invent a dose, a percentage, a criterion or a diagnosis that is not in these sections.");
          L.push("Write it as ordinary text on the page: no emoji, no $ sign, no LaTeX. A drug name, a dose, a term or a structure stays in ordinary characters, exactly as in the course.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push("No section of these courses matches his question exactly. Here is what they cover, so you can tell him what they hold and explain from them:");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.SexoMemo.warm();
  // Ronde 166 (souhait de l'utilisateur - de nouveau seulement une adresse) : LES DICTIONNAIRES.
  // Il a envoyé le répertoire de Lexilogos (Xavier Negre), qui
  // rassemble les dictionnaires et outils linguistiques français. Un répertoire
  // seul n'est cependant pas une matière, donc deux vrais ouvrages en plus, vers lesquels ce
  // répertoire lui-même renvoie : "Les dictionnaires de la langue francaise : une
  // histoire et une dynamique" de Jean Pruvost (Musée virtuel des
  // dictionnaires, Université Cergy-Pontoise, récupéré via Internet Archive
  // — la page elle-même est morte) et "Le francais aujourd'hui" de
  // l'Académie française (histoire, orthographe, politique linguistique).
  // Trois fiches dans src/dico/. La même machine que pour les dossiers précédents
  // (copiée et écrasée), porte propre (isDico), bloc propre.
  // Sa porte se trouve AVANT le mémo Python et refuse les textes Python - sinon
  // "c'est quoi le dictionnaire de l'Academie ?" serait capté par le dossier Python,
  // parce que le mot "dictionnaire" y figure comme type Python dans la porte.
  App.DicoMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/dico/dictionnaires-panorama.json.gz', kind: 'cours' },
      { url: 'src/dico/dictionnaires-histoire.json.gz', kind: 'cours' },
      { url: 'src/dico/langue-francaise-histoire-orthographe.json.gz', kind: 'cours' },
      { url: 'src/dico/outils-cnrtl.json.gz', kind: 'cours' },
      { url: 'src/dico/outils-robert.json.gz', kind: 'cours' },
      { url: 'src/dico/dictionnaire-visuel.json.gz', kind: 'cours' },
      { url: 'src/dico/robert-guide-accords.json.gz', kind: 'cours' },
      { url: 'src/dico/robert-guide-grammaire.json.gz', kind: 'cours' },
      { url: 'src/dico/robert-guide-typographie.json.gz', kind: 'cours' }
    ],
    MAX: 5200,
    // Petit corpus (40 sections issues de 3 fiches) : un mot qui ne figure que dans 4 à 6
    // sections suffit déjà ici à distinguer. Sinon p. ex. "Usito"
    // (4 sections) passe sous le seuil et la réponse aboutit dans la table des matières.
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    // Mots de remplissage comme dans les autres dossiers, plus ceux qui figurent dans CHAQUE question
    // de cette matière ("dictionnaire", "mot", "francais") - ils ne disent
    // rien sur le thème et tireraient sinon la section la plus épaisse vers le haut.
    STOP: Object.assign({}, App.MathMemo.STOP, (function () {
      let o = {};
      ('dictionnaire dictionnaires mot mots francais francaise francaises langue definition definitions ouvrage ouvrages outil outils vocabulaire usage eme edition').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })()),
    // La décomposition en mots jette tout ce qui a moins de quatre lettres ; ici, ce sont
    // justement les sigles qui importent : TLF, TLFi, OQLF, BDL, DRF, DVLF, INaLF.
    SHORT_WORDS: (function () {
      let o = {};
      ('tlf tlfi oqlf bdl drf dvlf inalf artfl cnrs tic').split(' ').forEach(w => { if (w) o[w] = 1; });
      return o;
    })(),
    // Les ligatures œ et æ sortent de la plage de caractères a-zà-ÿ ("cœur",
    // "sœur", "nœud" figurent dans les citations des fiches).
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae').replace(/[’']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-zà-ÿ0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => (x.length >= 4 || this.SHORT_WORDS[x]) && !this.STOP[x]).map(x => self._stem(x));
    },
    lookupQuery(t) {
      return App.MathMemo.lookupQuery.call(this, String(t == null ? '' : t).replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae'));
    },
    // La porte : s'agit-il d'un dictionnaire, de lexicographie ou de l'
    // orthographe et de la défense de la langue françaises ? Un terme technique ET une question
    // (ou un court message qui ne nomme que le thème). "langue" seul
    // ne compte PAS - dans le mémo d'anatomie, c'est la langue ("la langue").
    isDico(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      // Ronde 221 : s'il s'agit d'une AUTRE langue, la question appartient à la fiche
      // des langues du monde - le français lui-même la refuse de lui-même.
      try { if (App.LanguesMemo && App.LanguesMemo.isLangues(text)) return false; } catch (e) {}
      // Et les langues anciennes (grec, latin, sumérien, sanskrit ...) ont
      // leur propre fiche - "dictionnaire de sumerien" appartient lui aussi là-bas.
      try { if (App.AncientMemo && App.AncientMemo.isAncient(text)) return false; } catch (e) {}
      // Les Écritures (bible, coran, torah, dhammapada) ont leur propre porte.
      try { if (App.ReligionMemo && App.ReligionMemo.isReligion(text)) return false; } catch (e) {}
      const S = /(dictionnair|lexicograph|lexicolog|lexical|synonym|antonym|homonym|homophon|homograph|paronym|polys[ée]m|monos[ée]m|[ée]tymolog|orthograph|orthotypograph|typograph|grammair|grammatic|conjugaison|conjugu|n[ée]olog|anglicism|qu[ée]b[ée]cism|r[ée]gionalism|archa[ïi]sme|littr[ée]|larousse|bescherelle|\bbled\b|petit robert|grand robert|dictionnaire robert|\btlfi?\b|tr[ée]sor de la langue|wiktionnaire|\bdvlf\b|fureti[èe]re|richelet|estienne|\bnicot\b|calepino|acad[ée]mie fran[çc]aise|usito|cnrtl|ikonet|adjectifs?|\bvingts?\b|\bcents?\b|\bmilles?\b|pronoms? relatifs?|plut[ôo]t|plus t[ôo]t|\bsi j['’](aurais|serais)\b|dictionnaire visuel|\bvisuel\b|emprunts?|calques?|figures? de style|discours (direct|indirect|rapport)|interrogation (directe|indirecte)|concordance des temps|subordonn|italique|minuscules?|f[ée]minisation|noms? de m[ée]tiers|paul robert|alain rey|rey-debove|dictionnaire historique|moyen fran[çc]ais|\binalf\b|noms? propres|qu[ée]b[ée]cois|lexique|politique linguistique|franceterme|terminolog|vitrine linguistique|\boqlf\b|banque de d[ée]pannage|rectifications? de l['’]orthographe|nouvelle orthographe|ponctuation|majuscules?|trait d['’]union|circonflexe|c[ée]dille|proverbe|locution|expression fig[ée]e|origines? des expressions|argot|\brimes?\b|anagramme|pluriels? des|s['’][ée]crit|s['’][ée]crivent|participe pass[ée]|accords? (du|de l['’]|des)|langue fran[çc]aise|fran[çc]ais correct|que veut dire|d[ée]finition d|d[ée]finis|sens du mot|que signifie|signification)/;
      const Q = /(explique|expliquer|expliquez|comment|\bsi\b|c['’]est quoi|qu['’]est[- ]?ce|que veut dire|signifie|sens de|synonymes? de|antonymes? de|origine de|vient de|pourquoi|combien|quel|quelle|quels|quelles|parle[- ]?moi|parler|d[ée]cri|d[ée]fini|r[ôo]le|sert|situ[ée]|donne[- ]?moi|dis[- ]?moi|montre|rappelle|cite|liste|pr[ée]sente|r[ée]sume|aide|le[çc]on|revois|revoir|r[ée]vis|m[ée]thode|corrige|v[ée]rifie|d[ée]taille|[ée]nonce|comprend|s['’][ée]crit|s['’]accorde|s['’]emploie|s['’]utilise|orthographi|conjugue|\bse dit\b|\?)/;
      if (!S.test(t)) return false;
      // Une question purement d'orthographe ("comment s'ecrit ... ?") ne compte que si une
      // section des fiches y convient vraiment - sinon non ("... en japonais ?",
      // "... bonjour ?") : alors seule la table des matières serait dans le prompt.
      let tS = t.replace(/s['’][ée]crit|s['’][ée]crivent/g, ' ');
      if (tS !== t && !S.test(tS) && !this.hasMatch(tS)) return false;
      // Court et seulement le thème ("le Littré", "les rectifications de 1990") - c'est
      // une question aux fiches, même sans point d'interrogation. Sauf si c'est un
      // message À SON SUJET ("je me suis trompe sur un mot").
      let tn = t.replace(/œ/g, 'oe').replace(/Œ/g, 'oe').replace(/æ/g, 'ae').replace(/Æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u02bc]/g, "'");
      // Python ou HTML/CSS : ces fiches n'ont PAS leur place dans le prompt -
      // même quand la question ressemble à une question technique ("c'est quoi un
      // dictionnaire en python ?"). Le veto se trouve AVANT la vérification de question.
      if (/(\bpython3?\b|\.py\b|\bpandas\b|\bnumpy\b|\bjupyter\b|\bpip\b|\bimport\s|\bprint\s*\(|\bdef\s+[a-z_]|\bdict\b|\btuple\b|<\/?[a-z]+>|\bcss\b|\bhtml\b)/.test(tn)) return false;
      if (Q.test(t)) return true;
      // Seulement après : un court message À SON SUJET ("j'ai un dictionnaire chez moi",
      // "je me suis trompe sur un mot") n'est pas une question aux fiches.
      if (/\b(j'ai|j ai|j'|je|mon|ma|mes|me|tu|ton|ta|tes|il|elle|nous|vous|ils|elles|suis|aime|aimes|pense|penses|crois|sens|sais|vais|veux|peux)\b/.test(tn)) return false;
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
            if (!secs.length) { console.warn('[DicoMemo] aucun classeur chargé'); return null; }
            self._data = { sections: secs, books: books };
            console.log('[DicoMemo] prêt :', secs.length, 'sections sur', books.length, 'classeur(s)');
            return self._data;
          }).catch(e => { self._loading = null; console.warn('[DicoMemo] chargement échoué :', e && e.message); return null; });
      } catch (e) { this._loading = null; }
      return this._loading;
    },
    block(text) {
      try {
        if (!this._data || !this.isDico(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO DES DICTIONNAIRES, DES OUTILS DE RÉFÉRENCE ET DE LA LANGUE FRANÇAISE]'];
        L.push("Voici les fiches sur les dictionnaires et sur la langue française avec lesquelles il travaille" + (books.length > 1 ? ", en plusieurs fiches" : '') + ' : '
          + (books.length > 5
            ? Object.entries(books.reduce((o, b) => { let h = ''; try { h = new URL(b.source || '').hostname.replace(/^www\./, ''); } catch (e) { h = b.author || b.title || ''; } o[h] = (o[h] || 0) + 1; return o; }, {})).map(([h, n]) => '« ' + h + ' » (' + n + (n > 1 ? ' fiches' : ' fiche') + ')').join(' ; ')
            : books.map(b => '« ' + b.title + ' »').join(' ; ')) + '.');
        if (sel && sel.length) {
          L.push("The sections below are the ones that match his question. Answer from them: name the work exactly as the fiche names it (Furetière 1690, Richelet 1680, Dictionnaire de l'Académie 1694, Littré 1872, Grand dictionnaire universel de Larousse 1865-1876, Petit Larousse 1906, Trésor de la langue française 1971-1994, Petit Robert 1967), give its author and its date when the fiche gives them, and say which fiche and which section it comes from. When the question turns on usage rather than on knowledge, name the tool he can open himself: the CNRTL (cnrtl.fr) for the history, the first attestation and the dating of a word, Le Robert (dictionnaire.lerobert.com) for its current sense, its synonyms and its collocations, the conjugator of that same site for a verb, its guide for a rule, and the Dictionnaire visuel (ikonet.com) when he must name a thing he can only see. For a question of orthographe, give the rule AND its example exactly as the fiche gives them (rectifications de 1990, pluriel des noms composés, accord du participe passé, adjectifs de couleur, accord du verbe, vingt, cent et mille, trait d'union, ponctuation et espaces, majuscules, homonymes comme plutôt et plus tôt, discours indirect, figures de style). If one of these sections does not really fit his question, ignore it and answer from what you know - but never invent a date, a title, an author, a definition or an orthographic rule that is not in these sections.");
          L.push("Write it as ordinary text on the page: no emoji, no $ sign, no LaTeX. A word, a spelling or a quotation stays in ordinary characters, exactly as in the fiche; when the fiche gives an old and a rectified form, give both.");
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + (s.p ? ', p. ' + s.p : '') + ']\n' + s.x));
        } else {
          L.push("No section of these fiches matches his question exactly. Here is what they cover, so you can tell him what they hold and explain from them:");
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.DicoMemo.warm();
  App.CuisineMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/cuisine/cuisines-monde.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-france-sale.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-france-sucre.json', kind: 'cours' },
      { url: 'src/cuisine/themealdb.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-japon.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-japon2.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-irasshai.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-chine.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-commeaujapon.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-tilda.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-blogspot.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-lkk.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-kikkoman.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-hellofresh.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-cookpad.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-mamaly.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-tavola.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-ile.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-cuisineitalienne.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-blogs-italiens.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-odelices.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-lci-venise.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-recette-italienne.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-jevtobond.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-piments.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-thai-fr.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-demotivateur.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-thaikitchen.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-colruyt.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-mekong.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-autourduriz.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-jevtobond-street.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-hapiya.json', kind: 'cours' },
      { url: 'src/cuisine/recettes-saveurs.json', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    _tag: '[CuisineMemo]',
    warm() { return App.MathMemo.warm.call(this); },
    _words(t) {
      let s = String(t == null ? '' : t).toLowerCase().replace(/[’']/g, ' ').replace(/%/g, ' pourcent ').replace(/[^a-zà-ÿ0-9]+/g, ' ');
      let self = this;
      return s.split(' ').filter(x => x.length >= 3 && !this.STOP[x]).map(x => self._stem(x));
    },
    isCuisine(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      const S = /(cuisin|recette|\briz\b|pâtes|pates|couscous|tajine|curry|paella|tacos|tortilla|\bmiso\b|\bpho\b|sushi|onigiri|ramen|nouilles|panko|dashi|nori|tofu|soja|wasabi|udon|soba|somen|yakitori|tempura|gyoza|bento|takoyaki|okonomiyaki|teriyaki|natto|shiso|mirin|tsuyu|katsuobushi|aonori|harusame|korokke|izakaya|oyaki|karaage|tamago|sando|chirashi|taiyaki|chiffon cake|chigiri|ajitsuke|kakiage|gochujang|kewpie|anko|kinshi|negima|chashu|poke|nanban|ebi|shokupan|menma|yuzu|kinako|hiyashi|cheesecake|sichuan|mantou|aigre-douce|pekinoise|shaoxing|dim sum|wonton|bao|jiaozi|coco|wok|dan tat|mapo|katsudon|tonkatsu|melon pan|omurice|kombu|katsuobushi|donburi|hangiri|jasmin|basmati|kimchi|pak cho|cinq épices|cinq-epices|magret|kaki|soupe|bouillon|pot-au-feu|hong shao|hongshao|pidan|kumquat|sambal|chow mein|surimi|concombre|asperge|vinaigre|marinade|vermicelle|sésame|sesame|cacahuète|cacahuete|bouchée|bouchee|cheung fun|pasqualina|ragu bianco|pesto rosso|amaretti|ail noir|carpaccio|panettone|trapanese|trapanaise|robiola|fagottini|calzone|panzanella|frittata|bucatini|burrata|stracciatella|pecorino|arborio|safran|gorgonzola|melon|artichaut|one pot|gressin|grissin|risi|bisi|moules farcies|pan di spagna|pinza|pinsa|maratea|polenta|chitarra|sarde|busiate|granita|homard|luciana|moscardini|mammole|pad thai|tom yam|tom kha|satay|massaman|khao|som tam|laab|tamarin|citronnelle|gingembre|galanga|kaffir|combava|nam prik|kua kling|tod man|pad siu|krapao|manchon|wonton|nasi|bami|loempia|sriracha|tempeh|cha yen|sen mee|moo hong|mamuang|khanom|yam gai|yam neua|coleslaw|khorat|pandan|palourde|gloire du matin|kaeng|yam talay|moo kham|mijot|ragoût|ragout|épice|epice|piment|curcuma|cumin|paprika|cuisson|cuire|\bfour\b|frire|grill|ferment|levain|boulanger|\bpain\b|conserve|bocal|congél|hygiène|alimentaire|ingrédient|menu|restaurant|gastronom|frigo|reste|placard|courgette|tomate|oignon|carotte|poireau|pomme de terre|champignon|aubergine|poivron|brocoli|chou|haricot|lentille|pois chiche|thon|saumon|poulet|dinde|porc|bœuf|boeuf|veau|agneau|canard|lapin|\boeuf\b|fromage|crème|creme|lait|beurre|farine|sucre|chocolat|pomme|poire|fraise|banane|citron|miel|quiche|gratin|tarte|gâteau|gateau|crêpe|crepe|sauce|bouillon|recipe)/;
      const Q = /(explique|expliquer|expliquez|comment|c\u2019est quoi|qu\u2019est|que veut dire|pourquoi|combien|quel|quelle|donne|dis|montre|rappelle|aide|leçon|corrige|détaille|recette|cuisiner|préparer|recipe|\?)/;
      if (!S.test(t)) return false;
      if (Q.test(t)) return true;
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (/\b(j'ai|j ai|je|mon|ma|mes|tu|ton|ta|il|elle|nous|vous|ils|elles|suis|aime|veux|peux)\b/.test(tn)) return false;
      return t.replace(/\s+/g, ' ').trim().length <= 60;
    },
    block(text) {
      try {
        if (!this._data || !this.isCuisine(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO CUISINE — RECETTES ET GESTES]'];
        L.push('Voici ses fiches cuisine : ' + books.map(b => '\u00ab ' + b.title + ' \u00bb').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push('The sections below match his question. Give the working the way the fiche gives it (quantities, times, steps in order), name the dish and its country, and say which section it comes from. Never invent a time, a temperature or a dose that is not in these sections. Write ordinary text, no emoji.');
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']\n' + s.x));
        } else {
          L.push('No section matches exactly. Here is what the fiche covers:');
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.CuisineMemo.warm();
  App.PhysiqueMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/physique/bases-physique.json', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    _tag: '[PhysiqueMemo]',
    warm() { return App.MathMemo.warm.call(this); },
    isPhysique(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      try { if (App.ProtonMemo && App.ProtonMemo.isProton(text)) return false; } catch (e) {}
      if (/atome crochu/.test(t)) return false;
      const S = /(physique|mécanique|mecanique|cinématique|vitesse|accélération|accelere|force|newton|énergie|energie|travail|puissance|pression|poussée d'archimède|chaleur|température|\bondes?\b|fréquence|longueur d'onde|doppler|électricité|tension|intensité|résistance|ohm|loi d'ohm|optique|lentille|miroir|réflexion|réfraction|prisme|gravit|pesanteur|chute libre|satellite|marée|kelvin|joule|watt|\bbar\b|pascal|relativit|quantique|einstein|photon|big bang|trou noir|nucl[ée]aire|particule|\batome\b|atomique|fusion|fission|radioactiv|espace-temps|quark|neutrino|boson)/;
      const Q = /(explique|expliquer|expliquez|comment|c\u2019est quoi|qu\u2019est|que veut dire|pourquoi|combien|quel|quelle|formule|calcule|donne|dis|montre|rappelle|aide|leçon|corrige|détaille|démontre|\?)/;
      if (!S.test(t)) return false;
      if (Q.test(t)) return true;
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (/\b(j'ai|j ai|je|mon|ma|mes|tu|ton|ta|il|elle|nous|vous|ils|elles|suis|aime|veux|peux)\b/.test(tn)) return false;
      return t.replace(/\s+/g, ' ').trim().length <= 60;
    },
    block(text) {
      try {
        if (!this._data || !this.isPhysique(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO PHYSIQUE — BASES ET FORMULES]'];
        L.push('Voici sa fiche de physique : ' + books.map(b => '\u00ab ' + b.title + ' \u00bb').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push('The sections below match his question. State the law and its formula exactly as the fiche states them, work the numbers with units at every step, convert before computing, and say which section it comes from. Never invent a constant or a formula that is not in these sections. Write maths in ordinary text with ×, ÷ and Unicode signs, never $ or backslash commands, no emoji.');
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']\n' + s.x));
        } else {
          L.push('No section matches exactly. Here is what the fiche covers:');
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.PhysiqueMemo.warm();
  App.HistoireGeoMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/histoire-geo/monde-par-pays.json', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    _tag: '[HistoireGeoMemo]',
    warm() { return App.MathMemo.warm.call(this); },
    isHistoireGeo(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      const S = /(histoire|géographie|geographie|pays|capitale|drapeau|monnaie|frontière|population|densité|carte|échelle|légende|relief|climat|fleuve|montagne|continent|europe|afrique|\basie\b|amérique|oceanie|union européenne|schengen|euro|frise|chronologie|antiquité|moyen âge|révolution|décolonisation|guerre mondiale|mur de berlin|empire|royaume|république|président|\broi\b|parlement|france|allemagne|maroc|japon|brésil|espagne|italie|portugal)/;
      const Q = /(explique|expliquer|expliquez|comment|c\u2019est quoi|qu\u2019est|que veut dire|pourquoi|combien|quel|quelle|quels|où|situe|raconte|résume|présente|donne|dis|montre|rappelle|aide|leçon|corrige|détaille|capitale de|drapeau de|monnaie de|population de|\?)/;
      if (!S.test(t)) return false;
      if (Q.test(t)) return true;
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (/\b(j'ai|j ai|je|mon|ma|mes|tu|ton|ta|il|elle|nous|vous|ils|elles|suis|aime|veux|peux|vais|habite)\b/.test(tn)) return false;
      return t.replace(/\s+/g, ' ').trim().length <= 60;
    },
    block(text) {
      try {
        if (!this._data || !this.isHistoireGeo(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO HISTOIRE ET GÉOGRAPHIE PAR PAYS — MÉTHODE ET FICHES]'];
        L.push('Voici ses fiches pays et sa méthode : ' + books.map(b => '\u00ab ' + b.title + ' \u00bb').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push('The sections below match his question. Answer with the ten-box country grid (capital, population, language, currency, regime, relief, climate, rivers, five dates, speciality) when he asks about a country, and with the dated timeline when he asks about history. Say which section it comes from. Never invent a capital, a date, a number or a name that is not in these sections. Ordinary text, no emoji.');
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']\n' + s.x));
        } else {
          L.push('No section matches exactly. Here is what the fiches cover:');
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.HistoireGeoMemo.warm();
  App.EduMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/education/ecole.json', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    _tag: '[EduMemo]',
    warm() { return App.MathMemo.warm.call(this); },
    isEdu(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      try { t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
      const S = /(programme scolaire|programmes|eduscol|education nationale|maternelle|moyenne section|grande section|petite section|cp\b|ce1|ce2|cm1|cm2|college|brevet|dnb|lycee|seconde generale|premiere|terminale|specialite|grand oral|baccalaureat|\bbac\b|bac pro|bac general|bac technologique|voie pro|apprentissage|apprenti|parcoursup|bts\b|\bbut\b|cpge|prepa|licence|master|universite|crous|bourse scolaire|bourse etudiante|dossier social|orientation scolaire|conseil de classe|professeur principal|cio\b|vacances scolaires|vacances de|zone a|zone b|zone c|rentree scolaire|annee scolaire|trimestre|bulletin|releve de notes|redoublement|passage en|carte scolaire|inscription a l'ecole|cantine scolaire|scolarite obligatoire|socle commun|enseignement moral|filiere|section euro|internat|externat|demi-pension|cycle 2|apprentissages fondamentaux|questionner le monde|evaluations nationales|reperes annuels|attendus de fin|classes dedoublees|livret scolaire|evar|vie affective|cycle 3|consolidation|6e|histoire-geographie|sciences et technologie|nombres decimaux|proportionnalite)/;
      const Q = /(explique|expliquer|expliquez|comment|quoi|dire|pourquoi|combien|quand|quelle date|quel|quelle|aide|lecon|corrige|resume|presente|donne|dis|montre|rappelle|detaille|liste|calendrier|\?)/;
      if (!S.test(t)) return false;
      if (Q.test(t)) return true;
      let tn = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (/\b(j'ai|j ai|je|mon|ma|mes|tu|ton|ta|il|elle|nous|vous|ils|elles|suis|aime|veux|peux|vais|habite)\b/.test(tn)) return false;
      return t.replace(/\s+/g, ' ').trim().length <= 60;
    },
    block(text) {
      try {
        if (!this._data || !this.isEdu(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO ÉCOLE FRANCE — CY[ée], PROGRAMMES, CALENDRIER, ORIENTATION]'];
        L.push('Voici ses fiches école : ' + books.map(b => '« ' + b.title + ' »').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push('The sections below match the question. Answer from them only: cycles, cycle 2 and cycle 3 programs by subject and BO reference, zones A/B/C/Corse, vacation dates by year and zone, evaluations and yearly benchmarks, orientation steps, grants. Give the exact dates and the year. Never invent a vacation date, a schedule or a threshold not in these sections; if the year is missing, say to check education.gouv.fr. Ordinary text, no emoji.');
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']\n' + s.x));
        } else {
          L.push('No section matches exactly. Here is what the school fiches cover:');
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.EduMemo.warm();
  App.GrammaireMemo = Object.assign({}, App.MathMemo, {
    SOURCES: [
      { url: 'src/grammaire/grammaires-monde.json', kind: 'cours' }
    ],
    MAX: 5200,
    MIN_SCORE: 8,
    _data: null, _loading: null, _idx: null,
    _tag: '[GrammaireMemo]',
    warm() { return App.MathMemo.warm.call(this); },
    isGrammaire(text) {
      let t = String(text == null ? '' : text).toLowerCase();
      if (t.length > 900) t = t.slice(0, 900);
      try { if (App.DicoMemo && App.DicoMemo.isDico(text) && !/(anglais|anglaise|espagnol|allemand|arabe|italien|portugais|chinois|japonais|russe|néerlandais|turc|hindi|apprendre|toute langue|n\u2019importe quelle langue)/.test(t)) return false; } catch (e) {}
      const S = /(grammaire|conjugaison|conjugue|orthographe|participe|subjonctif|imparfait|passé composé|plus-que-parfait|conditionnel|auxiliaire|prétérit|present perfect|gérondif|ser et estar|déclinaison|cas accusatif|cas datif|racine arabe|alphabet arabe|phrase en |apprendre l\u2019anglais|apprendre l\u2019espagnol|apprendre l\u2019allemand|apprendre l\u2019arabe|toute langue|anglais|espagnol|allemand|arabe|italien|portugais|chinois|japonais|russe)/;
      const Q = /(explique|expliquer|expliquez|comment|c\u2019est quoi|qu\u2019est|que veut dire|pourquoi|différence|quel|quelle|conjugue|accorde|s\u2019écrit|se dit|donne|dis|montre|rappelle|aide|leçon|corrige|détaille|apprendre|\?)/;
      if (!S.test(t)) return false;
      if (/(anglais|anglaise|espagnol|allemand|arabe|italien|portugais|chinois|japonais|russe|toute langue|n\u2019importe quelle langue|apprendre)/.test(t) && Q.test(t)) return true;
      if (/(anglais|anglaise|espagnol|allemand|arabe|italien|portugais|chinois|japonais|russe)/.test(t)) return true;
      if (Q.test(t)) return true;
      return false;
    },
    block(text) {
      try {
        if (!this._data || !this.isGrammaire(text)) return '';
        let sel = this.pick(text, this.MAX);
        let books = this._data.books || [];
        let L = ['[MÉMO GRAMMAIRES DU MONDE — FRANÇAIS, ANGLAIS, ESPAGNOL, ALLEMAND, ARABE, MÉTHODE]'];
        L.push('Voici ses grammaires : ' + books.map(b => '\u00ab ' + b.title + ' \u00bb').join(' ; ') + '.');
        if (sel && sel.length) {
          L.push('The sections below match his question. Give the rule exactly as the fiche gives it with its example, name the language and the section it comes from. For French spelling give the rule AND its example (1990 rectifications, past participle, colours, vingt cent mille). Never invent a rule, a conjugation or a spelling that is not in these sections. Ordinary text, no emoji.');
          sel.forEach(s => L.push('--- ' + s.t + ' [' + (s.b || '') + (s.c ? ' > ' + s.c : '') + ']\n' + s.x));
        } else {
          L.push('No section matches exactly. Here is what the grammar fiches cover:');
          L.push(this.toc());
        }
        return L.join('\n');
      } catch (e) { return ''; }
    }
  });
  App.GrammaireMemo.warm();
