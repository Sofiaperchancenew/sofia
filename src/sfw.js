// Patch SFW strict — Sofia 100 % SFW, sans contenu sexuel.
// Supprime/désactive tous les scripts/prompts sexuels : donjon/BDSM,
// dressing lingerie/sextoys, anatomie intime, fiches intimes, simulation
// de contraintes intimes. Les images restent habillées (garde existante).
// Ce module est chargé via bootModules et appliqué après attachImgStyles.
export function attachSfw(App) {
  if (!App) return;
  const Core = App.Core || {};
  // 1. Inventaire donjon vidé (aucun meuble/objet/drogue/plug/machine).
  try { Core.DONJON_SECTIONS = []; } catch (e) {}
  try { Core._bdsmBrief = ''; } catch (e) {}
  try { Core._dressingBrief = ''; } catch (e) {}
  // 2. Détecteurs de scène sexuelle neutralisés : plus aucune scène
  // sexuelle ne se déclenche, même si l'utilisateur la demande.
  // sexTalkMode 'off' => sceneCraftActive false => tous les blocs
  // dominants (dominance/donjon/energy/herBody/cast) restent vides.
  try {
    Core.sexTalkMode = function () { return 'off'; };
    Core.sceneCraftActive = function () { return false; };
    Core.soloActive = function () { return false; };
    Core.castLatched = function () { return false; };
    Core.sexoAllowed = function () { return false; };
    Core.isRemoteBrief = function () { return false; };
  } catch (e) {}
  // 3. Blocs de prompts sexuels désactivés (retournent vide).
  // On garde les gardes SFW (tailBlock, softSceneBlock, scrubPrompt,
  // parental, imageSfw) intacts : ils portent le refus doux existant.
  const EMPTY = function () { return ''; };
  const SEXUAL_BLOCKS = [
    'dominanceBlock', 'donjonBlock', 'donjonTail',
    'energyBlock', 'energyTail', 'craftTail',
    'herBodyBlock', 'sexTalkBlock',
    'soloMistressBlock', 'soloContinueBlock', 'soloNewcomerBlock',
    'soloIntimacyTail', 'castBlock',
    'dressingBlock', 'sceneReactTail',
    'stagingTail', 'castTail', 'castMoveTail', 'tuTail',
    'anatomyBlock', 'realityBlock'
  ];
  for (const k of SEXUAL_BLOCKS) {
    try { Core[k] = EMPTY; } catch (e) {}
  }
  // castSheetTail : garde le suivi des fiches, sans l'anatomie intime.
  // Remplacé par une consigne SFW (prénoms, tenues habillées, actes amicaux).
  try {
    Core.castSheetTail = function (session, text) {
      let nm = [];
      try { nm = (this.sceneCastNames(session) || []).slice(0, 20); } catch (e) {}
      let who = nm.length ? ('On stage now: ' + nm.join(', ') + '. ') : '';
      return '\n\n[FINAL RULE - FICHES FOLLOW THE CAST - SFW] ' + who +
        'Every named character who is PRESENT in this scene has her/his OWN sheet ' +
        '(genre in words, body in modest everyday terms, outfit layer by layer, current friendly act, place), ' +
        'created or refreshed by your [FICHE_STATE] line THIS very reply. ' +
        'Never print a fiche as visible text (no Name:/Genre:/Corps: blocks, no {...}, no { or } in prose): ' +
        'sheets live ONLY in your [FICHE_STATE] line. ' +
        'Bodies stay fully clothed in modest everyday clothing, no intimate anatomy, no underwear detail, ' +
        'no orifices beyond mouth/hands, no sexual acts. ' +
        'Sofia never has a scene sheet. His message ALREADY HAPPENED and opens this reply.';
    };
  } catch (e) {}
  // castIdentityTail : version SFW (pas de corps intime, pas de provocation).
  try {
    const __origCastIdentity = Core.castIdentityTail;
    Core.castIdentityTail = function (session, text) {
      try {
        let r = '';
        try { r = __origCastIdentity ? '' : ''; } catch (e) {}
        return '\n\n[FINAL RULE - STAY THE CHARACTERS - SFW] You play the requested characters in modest everyday clothing, ' +
          'warm friendly interaction only, no nudity, no sexual content. ' +
          'Sofia never appears as a character. The whole reply is in HIS language, complete sentences only.';
      } catch (e) { return ''; }
    };
  } catch (e) {}
  // stagingQuotes : filtre les citations sexuelles, garde le lieu/tenue neutre.
  try {
    Core.stagingQuotes = function (text, session) {
      try {
        const SEX = /(vulve|chatte|clitoris|capuchon|gland|sein|poitrine|mamelon|t[eé]ton|masturb|branl|doigt.*levre|levre.*ecarte|ecarte.*levre|ouvre.*vulve|montre.*chatte|lingerie|sextoy|string|culotte|soutien|slip|boxer|fesse|plug|gode|speculum|sp[eé]culum|menott|ligot|attach.*nu|nu.*attach|\bnu(e)?s?\b|deshabill|denud|orgasme|jouir|baiser|baise|sodomie|fellation|penis|bite|couille|queue|verge|erect|bande)\b/i;
        let parts = String(text == null ? '' : text).replace(/\s+/g, ' ').split(/\n+|[.!?…]+\s+/);
        let keep = [];
        for (let p of parts) {
          let q = p.trim().slice(0, 220);
          if (q.length >= 12 && !SEX.test(q) && /(fauteuil|table|banc|cuisine|salon|chambre|jardin|lit|armoire|photo|image|envoie|voici|ding|notification|assis|debout|marche|porte|fenetre|sourit|bonjour|merci)\b/i.test(q)) keep.push(q);
          if (keep.join(' ').length >= 300) break;
        }
        if (!keep.length) return '';
        return '[HIS STAGING - SFW, HIS OWN WORDS] ' + keep.map(q => '"' + q + '"').join(' ') +
          ' The first two sentences already stand in that exact place, fully clothed, nothing sexual.';
      } catch (e) { return ''; }
    };
  } catch (e) {}
  // 4. Fiches : nettoie toute anatomie intime à la sauvegarde/lecture.
  // Les fiches gardent genre/âge/taille/tenue habillée, jamais d'intime.
  try {
    if (App.Sheets && typeof App.Sheets.saveSheet === 'function' && !App.Sheets.saveSheet._sfwPatched) {
      const __origSave = App.Sheets.saveSheet.bind(App.Sheets);
      App.Sheets.saveSheet = async function (a, b) {
        try {
          let s = (b !== undefined) ? b : a;
          if (s && typeof s === 'object') {
            try {
              if (s.anatomie && typeof s.anatomie === 'object') {
                for (const k of ['vagin', 'levres', 'clitoris', 'capuchon', 'profondeur', 'squirt', 'sexe', 'sexe_taille', 'pilosite', 'poitrine']) {
                  try { delete s.anatomie[k]; } catch (e) {}
                }
              }
              if (Array.isArray(s.orifices)) {
                try { s.orifices = s.orifices.filter(o => !/vagin|clitoris|ut[ée]rus|ovaire|trompe|vulve|capuchon|levres|l[èe]vres|penis|testicule|couille|prostate|sexe/i.test(String((o && o.nom) || o || ''))); } catch (e) {}
              }
              if (Array.isArray(s.vetements)) {
                // Retire la lingerie des tenues : tenue habillée uniquement.
                try {
                  s.vetements = s.vetements.map(v => {
                    if (!v || typeof v !== 'object') return v;
                    if (Array.isArray(v.couches)) v.couches = v.couches.filter(c => !/soutien|tanga|string|culotte|slip|boxer|lingerie|dentelle|jarretelle/i.test(String(c)));
                    return v;
                  }).filter(v => v && (!Array.isArray(v.couches) || v.couches.length));
                } catch (e) {}
              }
            } catch (e) {}
          }
        } catch (e) {}
        return __origSave(a, b);
      };
      App.Sheets.saveSheet._sfwPatched = true;
    }
  } catch (e) {}
  // 5. Garde finale anti-fuite : retire toute phrase sexuelle du prompt assemblé.
  // Liste courte, francais + anglais, sans toucher aux gardes SFW elles-mêmes.
  try {
    if (!Core._sfwScrubPatched) {
      Core._sfwScrubPatched = true;
      const SEX_SENT = /(lingerie|sextoy|dildo|vibrator|fuck machine|machine [aà] traire|pilori|chaise gyn[ée]cologique|poulie au plafond|croix de saint|plug anal|bouchon ur[ée]tral|sonde gastrique|dilatateur|magic wand|elle jouit|elle prend son plaisir|prends ton plaisir|takes her pleasure|takes his pleasure| Damit|porno|zero taboo|sans tabou|découvre qui il est|17\s*cm|4\s*cm.*non circoncis|frein.*rompu|bande|érection|jouissance|orgasme|masturb|sodomie|fellation|p[ée]n[ée]tr|vulve|vagin|clitoris|p[ée]nis|bite|couille|queue|verge|sperme|semence|profond[e]?ur moyenne|fontaines occasionnelles|enti[èe]rement [ée]pil[ée]e|lèvres fines|clitoris moyen|petit capuchon|gros seins|poitrine 95|bonnet [A-G]|seins lourds tombants)[^.\n]{0,120}/gi;
      const __origScrub = (App.Age && App.Age.scrubPrompt) ? App.Age.scrubPrompt.bind(App.Age) : null;
      if (App.Age && typeof App.Age.scrubPrompt === 'function' && !App.Age.scrubPrompt._sfwPlus) {
        const __prev = App.Age.scrubPrompt.bind(App.Age);
        App.Age.scrubPrompt = function (text) {
          try { text = __prev(text); } catch (e) {}
          if (typeof text !== 'string' || !text) return text;
          if (App.Age && typeof App.Age.nsfw === 'function') { try { if (App.Age.nsfw()) return text; } catch (e) {} }
          // En mode SFW : retire les phrases sexuelles restantes, garde le reste.
          try { text = text.replace(SEX_SENT, ''); } catch (e) {}
          // Resserre les doubles sauts laissés par la coupe.
          try { text = text.replace(/\n{3,}/g, '\n\n'); } catch (e) {}
          return text;
        };
        App.Age.scrubPrompt._sfwPlus = true;
      }
    }
  } catch (e) {}
  try { console.log('[SFW] patch strict appliqué : scènes sexuelles désactivées, fiches habillées.'); } catch (e) {}
  try { stripSexJobs(App); } catch (e) { console.warn('[SFW] metiers sexuels : echec', e); }
  // 7. Garde recherche web : une demande sexuelle explicite est cherchée
  // derrière l'écran (jamais de carte visible, jamais d'historique cru) et
  // le modèle reçoit une consigne de refus poli. Couvre aussi les cartes
  // déjà persistées (rendu d'historique après rechargement).
  try { hardenWebSearch(App); } catch (e) { console.warn('[SFW] garde websearch : echec', e); }
}

// 7. Garde recherche web SFW : le sexuel explicite ne s'affiche jamais.
// Une requête comme « pisse bouche » ou des résultats porno (pornhub,
// cumguru, « vidéos porno »...) sont traités derrière l'écran : aucune
// carte visible, rien en historique, et le modèle reçoit une consigne de
// refus poli en français. Les requêtes médicales neutres (ex. « analyse
// d'urine ») restent autorisées : seul le croisement cru est bloqué.
const SFW_WEB_PORN_HOSTS = [
  'pornhub', 'xvideos', 'xnxx', 'xhamster', 'youporn', 'redtube', 'beeg',
  'tube8', 'spankbang', 'chaturbate', 'cam4', 'camsoda', 'onlyfans',
  'cumguru', 'porntube', 'faphouse', 'hentai', 'sex.com', 'lubw'
];
const SFW_WEB_HARD = [
  'porno', 'porn', 'xxx', 'fellation', 'sodomie', 'branlette', 'gangbang',
  'bukkake', 'creampie', 'facial', 'gode', 'sextoy', 'vibromasseur',
  'ejaculat', 'chaturbate', 'escort', 'prostitue'
];
function sfwWebNorm(s) {
  try {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
      .normalize('NFD').replace(/[\u0300-\u036F]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  } catch (e) { return ''; }
}
function sfwWebHas(n, words) {
  if (!n) return false;
  const hay = ' ' + n + ' ';
  for (const w of words) {
    if (!w) continue;
    if (hay.indexOf(' ' + w) !== -1 || hay.indexOf(w) !== -1) {
      // Sous-chaîne simple, sans backtracking : 'piss' attrape
      // pisse/pissez/pisser, 'boiv' attrape boivent/boire.
      if (n.indexOf(w) !== -1) return true;
    }
  }
  return false;
}
function sfwWebOral(n) {
  return sfwWebHas(n, ['bouche', 'boire', 'boiv', 'avale', 'aval']);
}
function sfwWebPiss(n) {
  return sfwWebHas(n, ['piss', 'pipi', 'urine']);
}
function isSfwWebNsfwQuery(q) {
  const n = sfwWebNorm(q).slice(0, 200);
  if (!n) return false;
  if (sfwWebHas(n, SFW_WEB_PORN_HOSTS)) return true;
  if (sfwWebHas(n, SFW_WEB_HARD)) return true;
  const piss = sfwWebPiss(n);
  const oral = sfwWebOral(n);
  if (piss && oral) return true;
  if (sfwWebHas(n, ['sperme', 'foutre', 'cyprine', 'ejac']) &&
    (oral || sfwWebHas(n, ['video', 'film', 'porno', 'sexe', 'bite']))) return true;
  return false;
}
function isSfwWebNsfwItem(r) {
  try {
    const host = sfwWebNorm((r && (r.host || '')) + ' ' + (r && (r.url || '')));
    if (host && sfwWebHas(host, SFW_WEB_PORN_HOSTS)) return true;
    const t = sfwWebNorm(((r && (r.title || '')) + ' ' + (r && (r.snippet || '')) + ' ' + (r && (r.display || ''))).slice(0, 600));
    if (!t) return false;
    if (sfwWebHas(t, SFW_WEB_PORN_HOSTS)) return true;
    if (sfwWebHas(t, ['videos porno', 'video porno', 'film porno', 'films xxx', 'sex video', 'sex tape', 'videos de sexe'])) return true;
    if (sfwWebHas(t, SFW_WEB_HARD)) return true;
    if (sfwWebPiss(t) && (sfwWebOral(t) || sfwWebHas(t, ['sperme', 'video', 'porno']))) return true;
    return false;
  } catch (e) { return false; }
}
function isSfwWebNsfwRes(res) {
  try {
    if (!res) return false;
    if (res.blocked === 'nsfw') return true;
    if (res.query && isSfwWebNsfwQuery(res.query)) return true;
    if (res.label && isSfwWebNsfwQuery(res.label)) return true;
    const arr = res.results || [];
    for (let i = 0; i < arr.length && i < 12; i++) {
      if (isSfwWebNsfwItem(arr[i])) return true;
    }
    return false;
  } catch (e) { return false; }
}
export function hardenWebSearch(App) {
  if (!App || !App.WebSearch || App.WebSearch._sfwNsfwHardened) return false;
  const WS = App.WebSearch;
  const blockedRes = (q) => ({
    query: q || '', label: 'Demande non affichable', engines: [], results: [],
    plan: null, weather: null, live: null, failed: true, blocked: 'nsfw', at: Date.now()
  });
  const refuseBlock = () => [
    '[LIVE WEB SEARCH RESULT - REFUSED]',
    'La personne demande un contenu sexuel explicite. La recherche a ete traitee en arriere-plan et AUCUN resultat ne doit apparaitre a l\u2019ecran.',
    'Regles : ne montre aucune carte, ne cite aucun titre, aucune URL, aucun extrait, ne decris rien d\u2019explicite, ne repete pas la formulation crue.',
    'Reponds brievement en francais : tu ne peux pas aider pour ce type de contenu, sans details crus et sans moraliser lourdement, puis propose une alternative neutre et saines (ex. sante, anatomie scolaire, vie affective).'
  ].join('\n');
  try {
    const __origSearch = WS.search.bind(WS);
    WS.search = async function (query, opts) {
      try {
        if (isSfwWebNsfwQuery(query)) return blockedRes(String(query || ''));
      } catch (e) {}
      let res = null;
      try { res = await __origSearch(query, opts); } catch (e) { throw e; }
      try {
        if (res && isSfwWebNsfwRes(res)) {
          const b = blockedRes(res.query || String(query || ''));
          try { b.label = res.label ? 'Demande non affichable' : b.label; } catch (e) {}
          return b;
        }
      } catch (e) {}
      return res;
    };
  } catch (e) {}
  try {
    const __origBlock = WS.buildBlock.bind(WS);
    WS.buildBlock = function (res, opts) {
      try { if (res && isSfwWebNsfwRes(res)) return refuseBlock(); } catch (e) {}
      try { return __origBlock(res, opts); } catch (e) { return refuseBlock(); }
    };
  } catch (e) {}
  try {
    const __origCard = WS.renderCard.bind(WS);
    WS.renderCard = function (res, opts) {
      try { if (res && isSfwWebNsfwRes(res)) return null; } catch (e) { return null; }
      try { return __origCard(res, opts); } catch (e) { return null; }
    };
  } catch (e) {}
  try {
    const __origAttach = WS.attachCardToMessage.bind(WS);
    WS.attachCardToMessage = function (botId, res, opts) {
      try {
        if (res && isSfwWebNsfwRes(res)) {
          try {
            const sid = (opts && opts.sessionId) || (App.State && App.State.currentSessionId);
            const sess = ((App.State && App.State.sessions) || []).find((s) => s.id === sid);
            const msg = sess && (sess.messages || []).find((m) => m.id === botId);
            if (msg) { try { delete msg.websearch; } catch (e) {} try { delete msg.websearchPlan; } catch (e) {} }
            try { if (App.Data && App.Data.saveSessions && sess) App.Data.saveSessions(sess.id); } catch (e) {}
            const host = document.querySelector('.messageRow[data-message-id="' + botId + '"] .msgText .webSearchCard');
            if (host && host.remove) host.remove();
          } catch (e) {}
          return null;
        }
      } catch (e) { return null; }
      try { return __origAttach(botId, res, opts); } catch (e) { return null; }
    };
  } catch (e) {}
  try {
    WS._sfwNsfwHardened = true;
    App.SfwWeb = {
      isNsfwQuery: isSfwWebNsfwQuery,
      isNsfwResult: isSfwWebNsfwRes,
      isNsfwItem: isSfwWebNsfwItem
    };
  } catch (e) {}
  // Nettoyage au mieux des messages déjà persistés (tests crus déjà en historique).
  try {
    const sessions = (App.State && App.State.sessions) || [];
    let touched = [];
    for (const s of sessions) {
      let dirty = false;
      for (const m of (s.messages || [])) {
        try {
          if (m && m.websearch && isSfwWebNsfwRes(m.websearch)) {
            delete m.websearch; dirty = true;
            try {
              const card = document.querySelector('.messageRow[data-message-id="' + m.id + '"] .msgText .webSearchCard');
              if (card && card.remove) card.remove();
            } catch (e) {}
          }
          if (m && m.websearchPlan && m.websearchPlan.images && m.websearch &&
            m.websearch.blocked === 'nsfw') { try { delete m.websearchPlan; dirty = true; } catch (e) {} }
        } catch (e) {}
      }
      if (dirty) touched.push(s.id);
    }
    for (const id of touched.slice(0, 5)) {
      try { if (App.Data && App.Data.saveSessions) App.Data.saveSessions(id); } catch (e) {}
    }
    if (touched.length) console.log('[SFW] websearch NSFW nettoye : ' + touched.length + ' session(s).');
  } catch (e) {}
  try { console.log('[SFW] garde websearch NSFW activee.'); } catch (e) {}
  return true;
}
// 6. Métiers sexuels supprimés (demande utilisateur).
// Les données vivent dans des modules chiffrés (src/professions-data.js) :
// on neutralise au niveau de l'objet App.Professions + nettoyage du menu.
// - Les 17 rôles du secteur "adult" (14 index + 3 noyaux) sont marqués
//   adult (porte 18+ interne : invisibles, non activables sans mode adulte)...
// - ...et le secteur "adult" est retiré du menu dans tous les cas, même en
//   mode adulte : puce, tuiles, note de pied, vue verrouillée.
// - L'activation est refusée partout : setActive, /metier, buildPromptBlock,
//   expand, byId/findByName. Si un rôle sexuel était actif, il est coupé.
function stripSexJobs(App) {
  const P = App.Professions;
  if (!P || P._sfwNoSexJobs) return;
  P._sfwNoSexJobs = true;
  const SEX_IDS = new Set([
    'maitresse-sexuelle', 'maitre-sexuel', 'educatrice-sexuelle',
    'masseur-erotique', 'masseuse-erotique', 'acteur-porno', 'actrice-porno',
    'danseur-erotique', 'danseuse-erotique', 'escort', 'dominatrice',
    'maitre-dominant', 'soumise', 'soumis', 'webcam-model',
    'masseur-tantrique', 'coach-en-seduction'
  ]);
  const isSexId = (id) => SEX_IDS.has(String(id == null ? '' : id).trim().toLowerCase());
  const isSexProf = (p) => !!p && (isSexId(p.id) || p.sector === 'adult');
  const orig = {};
  for (const k of ['byId', 'findByName', 'all', 'sectors', 'visible', 'active', 'activeId',
    'isEnabled', 'setActive', 'handleCommand', 'buildPromptBlock', 'buildAwarenessLine',
    'expand', 'knowledge', 'refs', 'nameOf', 'renderPicker', 'renderPanel', 'refreshUI', 'localize']) {
    try { if (typeof P[k] === 'function') orig[k] = P[k].bind(P); } catch (e) {}
  }
  // 6a. Porte 18+ interne sur les 17 rôles (invisibles + non incarnables
  // sans mode adulte, y compris via les chemins internes : toggle, panel).
  try { for (const id of SEX_IDS) { const p = orig.byId ? orig.byId(id) : null; if (p && !p.adult) p.adult = true; } } catch (e) {}
  // 6b. Rôle sexuel actif : coupé et oublié.
  try {
    const cur = orig.byId && orig.activeId ? orig.byId(orig.activeId()) : null;
    if (isSexProf(cur)) {
      try { App.State.settings.professionMode = false; } catch (e) {}
      try { App.State.settings.professionId = null; } catch (e) {}
      try { if (App.Data && App.Data.saveSettings) App.Data.saveSettings(); } catch (e) {}
    }
  } catch (e) {}
  const EMPTY_KNOW = () => ({ mission: '', method: [], deliverables: [], terms: [], guard: [], src: 'none' });
  try { if (orig.visible) P.visible = (p) => !isSexProf(p) && orig.visible(p); } catch (e) {}
  try { if (orig.all) P.all = () => orig.all().filter((p) => !isSexProf(p)); } catch (e) {}
  try { if (orig.sectors) P.sectors = () => orig.sectors().filter((s) => s && s.id !== 'adult'); } catch (e) {}
  try { if (orig.byId) P.byId = (id) => (isSexId(id) ? null : orig.byId(id)); } catch (e) {}
  try { if (orig.findByName) P.findByName = (q) => { const p = orig.findByName(q); return isSexProf(p) ? null : p; }; } catch (e) {}
  try { if (orig.nameOf) P.nameOf = (x) => { const p = (typeof x === 'string') ? orig.byId(x) : x; return isSexProf(p) ? '' : orig.nameOf(x); }; } catch (e) {}
  try { if (orig.knowledge) P.knowledge = (id) => { const p = (typeof id === 'string') ? orig.byId(id) : (id || (orig.active ? orig.active() : null)); return isSexProf(p) ? EMPTY_KNOW() : orig.knowledge(id); }; } catch (e) {}
  try { if (orig.refs) P.refs = (id, code) => { const p = (typeof id === 'string') ? orig.byId(id) : (id || (orig.active ? orig.active() : null)); return isSexProf(p) ? [] : orig.refs(id, code); }; } catch (e) {}
  try { if (orig.active) P.active = () => { const p = orig.active(); return isSexProf(p) ? null : p; }; } catch (e) {}
  try { if (orig.activeId) P.activeId = () => { const id = orig.activeId(); return isSexId(id) ? null : id; }; } catch (e) {}
  try {
    if (orig.isEnabled) P.isEnabled = () => {
      try { const p = orig.active ? orig.active() : null; if (isSexProf(p)) return false; } catch (e) {}
      return orig.isEnabled();
    };
  } catch (e) {}
  const refuseToast = () => { try { if (App.UI && App.UI.showToast) App.UI.showToast('Ce rôle n’existe pas.', 'info'); } catch (e) {} };
  try {
    if (orig.setActive) P.setActive = (id, opts) => {
      if (isSexId(id)) { refuseToast(); return { ok: false, reason: 'removed' }; }
      return orig.setActive(id, opts);
    };
  } catch (e) {}
  try {
    if (orig.expand) P.expand = (id, opts) => {
      if (isSexId(id)) return Promise.resolve({ ok: false, reason: 'removed' });
      return orig.expand(id, opts);
    };
  } catch (e) {}
  const CMD_NAMES = new Set(['metier', 'metiers', 'profession', 'professions', 'beruf', 'berufe', 'oficio', 'oficios', 'professione', 'professioni', 'mate']);
  try {
    if (orig.handleCommand) P.handleCommand = (text) => {
      try {
        const raw = String(text == null ? '' : text).trim();
        if (raw[0] === '/') {
          const sp = raw.indexOf(' ');
          const cmd = (sp === -1 ? raw.slice(1) : raw.slice(1, sp)).toLowerCase();
          const rest = sp === -1 ? '' : raw.slice(sp + 1).trim();
          if (CMD_NAMES.has(cmd)) {
            if (!rest || rest === 'on' || rest === 'an') {
              try {
                const cur = orig.activeId ? orig.byId(orig.activeId()) : null;
                if (isSexProf(cur)) { refuseToast(); try { P.openPicker(); } catch (e) {} return true; }
              } catch (e) {}
            } else if (rest !== 'off' && rest !== 'quit' && rest !== 'leave') {
              try {
                const m = rest.match(/^(.+?)\s+(in|en|au|im|a|à)\s+(.+)$/i);
                const q = m ? m[1] : rest;
                let hit = null;
                try { hit = orig.byId(String(q).trim().toLowerCase()); } catch (e) {}
                if (!hit && orig.findByName) { try { hit = orig.findByName(q); } catch (e) {} }
                if (isSexProf(hit)) { refuseToast(); try { P.openPicker(); } catch (e) {} return true; }
              } catch (e) {}
            }
          }
        }
      } catch (e) {}
      return orig.handleCommand(text);
    };
  } catch (e) {}
  const guardBlock = (fn) => function () {
    try { const p = orig.active ? orig.active() : null; if (isSexProf(p)) return ''; } catch (e) {}
    return fn.apply(this, arguments);
  };
  try { if (orig.buildPromptBlock) P.buildPromptBlock = guardBlock(orig.buildPromptBlock); } catch (e) {}
  try {
    if (orig.buildAwarenessLine) P.buildAwarenessLine = function () {
      try { const p = orig.active ? orig.active() : null; if (isSexProf(p)) return null; } catch (e) {}
      return orig.buildAwarenessLine();
    };
  } catch (e) {}
  // 6c. Nettoyage DOM du menu (puce adulte, tuiles, note de pied).
  // Les rendus internes ne passent pas toujours par les méthodes exportées :
  // un observateur répare chaque affichage, quel que soit son chemin.
  function stripDom() {
    try {
      let changed = false;
      document.querySelectorAll('#profSectorRow [data-sec="adult"], #profSectorRow [data-locked="adult"]').forEach((el) => { el.remove(); changed = true; });
      document.querySelectorAll('#profGridEl .prof-card').forEach((card) => {
        if (isSexId(card.getAttribute('data-id'))) { card.remove(); changed = true; }
      });
      document.querySelectorAll('#profPickerFoot .prof-adult-foot, #profGridEl .prof-adult-locked').forEach((el) => { el.remove(); changed = true; });
      const grid = document.getElementById('profGridEl');
      if (grid && !grid.querySelector('.prof-card') && !grid.querySelector('.prof-empty')) {
        const all = document.querySelector('#profSectorRow [data-sec="all"]');
        if (all) { all.click(); return true; }
        grid.innerHTML = '<div class="prof-empty">Aucun rôle ici.</div>';
        changed = true;
      }
      if (changed) {
        try {
          const cnt = document.getElementById('profCountEl');
          const g = document.getElementById('profGridEl');
          if (cnt && g) { const n = g.querySelectorAll('.prof-card').length; if (n) cnt.textContent = String(n); }
        } catch (e) {}
      }
      return changed;
    } catch (e) { return false; }
  }
  const wrapRender = (name) => {
    try {
      if (!orig[name]) return;
      P[name] = function () {
        if (name === 'renderPanel') {
          try {
            const cur = orig.activeId ? orig.byId(orig.activeId()) : null;
            if (isSexProf(cur)) {
              try { if (App.State) { App.State.settings.professionMode = false; App.State.settings.professionId = null; } } catch (e) {}
              try { if (App.Data && App.Data.saveSettings) App.Data.saveSettings(); } catch (e) {}
              try { const ctn = document.getElementById('profPanelCtn'); if (ctn) ctn.hidden = true; } catch (e) {}
              return;
            }
          } catch (e) {}
        }
        const r = orig[name].apply(this, arguments);
        stripDom();
        return r;
      };
    } catch (e) {}
  };
  wrapRender('renderPicker');
  wrapRender('renderPanel');
  wrapRender('refreshUI');
  wrapRender('localize');
  try {
    const mo = new MutationObserver(() => { stripDom(); });
    mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  // 6d. Packs persistés (IndexedDB) des rôles supprimés : effacés au mieux.
  try {
    (async function () {
      try {
        const open = indexedDB.open('enya_professions_v1');
        const db = await new Promise((res, rej) => { open.onsuccess = () => res(open.result); open.onerror = () => rej(open.error); });
        for (const store of ['packs', 'persona']) {
          try {
            if (!db.objectStoreNames.contains(store)) continue;
            const tx = db.transaction(store, 'readwrite');
            for (const id of SEX_IDS) { try { tx.objectStore(store).delete(id); } catch (e) {} }
          } catch (e) {}
        }
        try { db.close(); } catch (e) {}
      } catch (e) {}
    })();
  } catch (e) {}
  try { console.log('[SFW] metiers sexuels retires : 17 roles, secteur adult masque.'); } catch (e) {}
}
