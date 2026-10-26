// Moteur studio Suno — table des familles + auto-reglages.
// Vendu depuis Music Design Studio (engine.js : GENRES/bpm/accords/batterie/voix/instru/mix)
// + discipline MelodyForge (style compact, paroles = prompt, style = instructions).
// Les descripteurs sont en anglais : la boite Style Suno se colle telle quelle.
// Les accords reprennent EXACTEMENT les libelles de SOUND.chords (music-data.js)
// pour que l'auto-selection dans mzChords fonctionne.
export const SUNO_FAM = {
  pop: { bpm: 110, chords: 'C - G - Am - F (euphoric lift)', drums: 'four-on-the-floor kick, snappy snare, offbeat hats', vocal: 'soft modern vocal, light doubles, airy harmonies', instru: 'clean guitar, warm piano, airy pads, tight drums, sub bass', mix: 'warm airy mix, controlled low-end, vocal forward' },
  rock: { bpm: 120, chords: 'Em - C - G - D', drums: 'driving kick, big snare, straight 8th hats, energetic fills', vocal: 'bold forward vocal with grit and power', instru: 'crunchy distorted guitars, live drums, bass', mix: 'punchy drums, solid center vocal' },
  metal: { bpm: 140, chords: 'Am - G - F - E (epic minor)', drums: 'double kick, aggressive fills, dynamic breaks', vocal: 'powerful vocal, clean to harsh', instru: 'heavily distorted guitars, deep bass, double-kick drums', mix: 'heavy low-end, tight drums, wall of guitars' },
  hiphop: { bpm: 85, chords: 'Dm - Bb - F - C', drums: '808 kick, trap snare, rolling hi-hats', vocal: 'confident rhythmic flow, tight timing', instru: '808s, trap drums, sparse keys, pads', mix: 'tight low-end, crisp highs, punchy 808s' },
  edm: { bpm: 128, chords: 'Am - F - C - G', drums: 'big kick, claps on 2 and 4, sidechained hats, builds and drops', vocal: 'energetic lead vocal, bright presence', instru: 'sidechained supersaws, bright plucks, pads, sub bass', mix: 'wide stereo, strong sidechain pump, massive drops' },
  jazz: { bpm: 100, chords: 'Dm7 - G7 - Cmaj7 (ii-V-I)', drums: 'swing ride, brushed snare, walking feel', vocal: 'smooth phrased vocal with swing feel', instru: 'piano, upright bass, brushed drums, sax', mix: 'warm natural sound, room ambience' },
  rnb: { bpm: 75, chords: 'Dm7 - G7 - Cmaj7 (ii-V-I)', drums: 'laid-back kick, soft snare, swung hats', vocal: 'smooth expressive vocal, gentle vibrato', instru: 'electric piano, soft bass, lush pads', mix: 'warm rounded low-end, silky highs, intimate vocal' },
  blues: { bpm: 80, chords: 'E7 - A7 - B7 (12-bar blues)', drums: 'shuffle groove, light crash, walking bass', vocal: 'raw expressive vocal', instru: 'electric guitar, harmonica, bass, brushed drums', mix: 'warm vintage sound' },
  country: { bpm: 90, chords: 'C - F - G - C (classical cadence)', drums: 'natural kick, light snare, train beat', vocal: 'storytelling vocal, natural tone', instru: 'acoustic guitar, pedal steel, bass, fiddle', mix: 'natural instruments, clear vocal on top' },
  folk: { bpm: 80, chords: 'C - G - Am - Em (alberti flow)', drums: 'light percussion, brush snare, tambourine', vocal: 'warm unadorned vocal, harmonies on chorus', instru: 'acoustic guitar, mandolin, fiddle, upright bass', mix: 'natural warm sound, minimal processing' },
  indie: { bpm: 90, chords: 'C - G - Am - F (euphoric lift)', drums: 'soft kick, brushed snare, organic feel', vocal: 'intimate close-mic vocal, warmth and fragility', instru: 'acoustic guitar, upright bass, subtle piano', mix: 'warm organic mix, gentle compression' },
  classical: { bpm: 90, chords: 'C - F - G - C (classical cadence)', drums: 'orchestral percussion, timpani swells', vocal: 'operatic vocal or choir', instru: 'full symphonic orchestra, strings, brass', mix: 'concert hall, wide dynamics' },
  comedy: { bpm: 110, chords: 'C - F - G - C (classical cadence)', drums: 'playful bouncy beat, rimshots, comedic stingers', vocal: 'character-driven vocal, comic timing', instru: 'acoustic guitar, banjo, toy instruments', mix: 'bright and punchy, vocal-forward' }
};

// Regles mot-cle (ordre = priorite) : mappe les 443 libelles SOUND.genre vers une famille.
const FAM_RULES = [
  ['hard rock', 'rock'], ['neue deutsche härte', 'metal'], ['moist tribal', 'edm'], ['sweaty percussion', 'edm'], ['afrohouse', 'edm'], ['high-tech minimal', 'edm'], ['aggrotech', 'edm'], ['dark electro', 'edm'], ['industrial dance', 'edm'], ['afterhours', 'edm'], ['midnight vibe', 'edm'], ['runway music', 'edm'], ['ha dance', 'edm'], ['dungeon synth', 'classical'], ['medieval dark wave', 'classical'], ['gothic dungeon', 'classical'],
  
  ['doom', 'metal'], ['black metal', 'metal'], ['death', 'metal'], ['thrash', 'metal'],
  ['speed metal', 'metal'], ['power metal', 'metal'], ['symphonic metal', 'metal'], ['nu metal', 'metal'],
  ['metalcore', 'metal'], ['deathcore', 'metal'], ['mathcore', 'metal'], ['djent', 'metal'],
  ['grind', 'metal'], ['sludge', 'metal'], ['viking', 'metal'], ['folk metal', 'metal'],
  ['industrial metal', 'metal'], ['groove metal', 'metal'], ['alternative metal', 'metal'],
  ['rap metal', 'metal'], ['funk metal', 'metal'], ['pirate', 'metal'], ['crystal metal', 'metal'],
  ['orchestral metal', 'metal'], ['pounding metal', 'metal'], ['heavy metal', 'metal'], ['metal', 'metal'],
  ['hip-hop', 'hiphop'], ['hip hop', 'hiphop'], ['boom-bap', 'hiphop'], ['grime', 'hiphop'],
  ['crunk', 'hiphop'], ['phonk', 'hiphop'], ['hyphy', 'hiphop'], ['drill', 'hiphop'],
  ['trap', 'hiphop'], ['rap', 'hiphop'],
  ['tribal house', 'edm'], ['vogue', 'edm'], ['ebm', 'edm'], ['cyber', 'edm'], ['circuit', 'edm'],
  ['hardstyle', 'edm'], ['gabber', 'edm'], ['synthwave', 'edm'], ['vapor', 'edm'], ['rave', 'edm'],
  ['house', 'edm'], ['techno', 'edm'], ['trance', 'edm'], ['dubstep', 'edm'], ['drum & bass', 'edm'],
  ['drum and bass', 'edm'], ['garage', 'edm'], ['electro', 'edm'], ['club', 'edm'], ['edm', 'edm'],
  ['dance-pop', 'edm'], ['future bass', 'edm'], ['tropical', 'edm'],
  ['italo', 'edm'], ['eurodisco', 'edm'], ['eurodance', 'edm'], ['hi-nrg', 'edm'],
  ['lovers rock', 'rnb'], ['gregorian', 'classical'],
  ['bebop', 'jazz'], ['bossa', 'jazz'], ['swing', 'jazz'], ['jazz', 'jazz'],
  ['blues', 'blues'],
  ['motown', 'rnb'], ['disco', 'rnb'], ['boogie', 'rnb'], ['gospel', 'rnb'], ['soul', 'rnb'],
  ['funk', 'rnb'], ['r&b', 'rnb'], ['rnb', 'rnb'], ['reggae', 'rnb'], ['dub', 'rnb'], ['ska', 'rnb'],
  ['worship', 'rnb'],
  ['country', 'country'], ['americana', 'country'], ['bluegrass', 'country'], ['western', 'country'],
  ['chanson', 'folk'], ['singer-songwriter', 'folk'], ['celtic', 'folk'], ['acoustic', 'folk'], ['folk', 'folk'],
  ['symphonic orchestra', 'classical'], ['symphonic', 'classical'], ['classical', 'classical'],
  ['baroque', 'classical'], ['opera', 'classical'], ['mozart', 'classical'], ['bach', 'classical'],
  ['beethoven', 'classical'], ['orchestra', 'classical'],
  ['parody', 'comedy'], ['novelty', 'comedy'], ['comedy', 'comedy'],
  ['dream pop', 'indie'], ['shoegaze', 'indie'], ['slowcore', 'indie'], ['indie', 'indie'],
  ['k-pop', 'pop'], ['j-pop', 'pop'], ['city pop', 'pop'], ['pop', 'pop'],
  ['punk', 'rock'], ['grunge', 'rock'], ['guitar', 'rock'], ['rock', 'rock'],
  ['trance', 'edm'], ['madchester', 'indie'], ['chillwave', 'indie'], ['chillout', 'indie'],
  ['new beat', 'edm'], ['outrun', 'edm'], ['spacesynth', 'edm'], ['darksynth', 'edm'],
  ['darkwave', 'edm'], ['cold wave', 'edm'], ['newgrass', 'country'], ['merseybeat', 'pop'],
  ['trot', 'pop'], ['enka', 'pop'], ['dansband', 'pop'], ['dansktop', 'pop'],
  ['bubblegum', 'pop'], ['doo-wop', 'pop'], ['bhangra', 'pop'], ['horrorcore', 'hiphop'],
  ['psychobilly', 'rock'], ['psych', 'rock'], ['tango', 'folk'], ['fado', 'folk'],
  ['soca', 'rnb'], ['merengue', 'rnb'], ['bachata', 'rnb'], ['samba', 'rnb'],
  ['cumbia', 'rnb'], ['cajun', 'folk'], ['klezmer', 'folk'], ['gnawa', 'folk'],
  ['highlife', 'rnb'], ['oompah', 'folk'], ['wiesn', 'folk'], ['schlager', 'pop'],
  ['showstopper', 'comedy'], ['r and b', 'rnb'],
  ['cabaret', 'rock'], ['glitch', 'hiphop'], ['boom bap', 'hiphop'], ['industrial', 'edm'], ['ambient', 'edm']
];

export function familyFor(label) {
  var s = String(label || '').toLowerCase();
  if (!s) return null;
  for (var i = 0; i < FAM_RULES.length; i++) {
    if (s.indexOf(FAM_RULES[i][0]) !== -1) return FAM_RULES[i][1];
  }
  return null;
}

// Complement Style (instru + mix de la famille) pour les gros plans Style (v5/v4.5).
// MelodyForge : le style reste compact, tranche a 1000.
export function sunoExtra(famKey, max) {
  if (!famKey || !SUNO_FAM[famKey] || (max || 0) < 500) return '';
  var F = SUNO_FAM[famKey];
  return ', ' + F.instru + ', ' + F.mix;
}

// Humeurs (cover + habillage), en anglais comme tout prompt visuel/Suno.
export const SUNO_MOODS = ['longing', 'wistful', 'aching', 'haunted', 'cold fury', 'slow despair',
  'defiant optimism', 'gentle healing', 'fragile hope', 'dawn breaking', 'quiet determination',
  'euphoric', 'energetic', 'playful', 'tender', 'melancholic', 'dark and moody', 'peaceful',
  'romantic', 'nostalgic', 'triumphant', 'intimate', 'anthemic', 'dreamy', 'smoky', 'velvet'];

// ---------------------------------------------------------------------------
// Canonical Suno meta-tags — TOUS en anglais, entre crochets [...].
// Suno ignore / chante les tags français ([Couplet], [Refrain], [Pont]).
// Tout ce qui part vers Structure + Lyrics DOIT passer par ici.
// Stacking officiel : [Verse 1 | Spoken Word | Soft Piano]
// ---------------------------------------------------------------------------
export const SUNO_STRUCT = {
  intro: 'Intro',
  v1: 'Verse 1',
  v2: 'Verse 2',
  pre: 'Pre-Chorus',
  ch: 'Chorus',
  chf: 'Final Chorus',
  post: 'Post-Chorus',
  hook: 'Hook',
  br: 'Bridge',
  inter: 'Interlude',
  brk: 'Break',
  out: 'Outro',
  ins: 'Instrumental'
};

export const SUNO_ENERGY = {
  build: 'Build-up',
  drop: 'Drop',
  bassDrop: 'Bass Drop',
  tempoDrop: 'Tempo Drop',
  stripped: 'Stripped Back',
  acoustic: 'Acoustic',
  fadeOut: 'Fade Out',
  silence: 'Silence',
  pause: 'Pause'
};

// Jointure stacking Suno : [A | B | C] — pipes, pas de virgules, pas de "—" ni ":".
export function sunoJoin() {
  var parts = [];
  for (var i = 0; i < arguments.length; i++) {
    var p = String(arguments[i] == null ? '' : arguments[i]).trim();
    if (p) parts.push(p);
  }
  return '[' + parts.join(' | ') + ']';
}

// Mappe un objet vocal Sofia (t/short/fem/instru, toutes langues) vers un
// bracket vocal Suno canonique en anglais.
// Ex : "voix féminine chuchotée" -> "Female Vocal | Whispered"
export function sunoVocalBracket(v) {
  try {
    if (!v) return 'Female Vocal';
    if (v.instru) return 'Instrumental';
    var raw = String((v.t || '') + ' ' + (v.short || '')).toLowerCase();
    var isChoir = /ch[oœ]ur|choir|choral|gospel|gregorian|stade|stadium|backing/.test(raw);
    var isDuet = /duo|duet|alternating|homme-femme|homme femme/.test(raw);
    var isWhisper = /chuchot|whisper|intime|intimate|murmur/.test(raw);
    var isSpoken = /parl[eé]e?|spoken|parlado|sensuelle.*parl|slam|r[eé]cit/.test(raw);
    var isFalsetto = /falsetto|fausset|aerien|aérien/.test(raw);
    var isScream = /scream|screamo|growl|guttural|cri[eé]e|eraille|eraill|shout|m[eé]tal.*puiss|rock.*voix|harsh/.test(raw);
    var isBelt = /belt|puissant|powerful|diva|t[eé]nor|tenor|soaring|lyrique|opera|habit[eé]e|stadium/.test(raw);
    var isHarm = /harmonie|layered|empil/.test(raw);
    var isAdlib = /yodel|ad-lib|adlib/.test(raw);
    var isBeatbox = /beatbox/.test(raw);
    var fem = !!v.fem || /female|f[eé]minine|femme|soprano|alto|diva/.test(raw);
    var masc = /male|masculin|homme|t[eé]nor|grave|tenor/.test(raw);
    if (isChoir) {
      if (/stade|stadium|anthem|euphorique|euphoric/.test(raw)) return 'Choir | Anthemic';
      return 'Choir';
    }
    if (isDuet) return 'Duet';
    if (v.child) return 'Child Vocal';
    if (v.rap) return (v.fem ? 'Female Vocal' : 'Male Vocal') + ' | Spoken Word';
    if (v.t === 'instrumental' || /sans voix|instrumental/.test(raw)) return 'Instrumental';
    if (/respiration|non-verbal|non verbal|breath/.test(raw)) return 'Instrumental';
    if (isBeatbox) return fem ? 'Female Vocal | Spoken Word' : 'Male Vocal | Spoken Word';
    if (isAdlib) return 'Ad-lib';
    if (isHarm) return 'Layered Vocals | Harmonies';
    if (isSpoken && !fem && !masc) return 'Spoken Word';
    if (isSpoken) return (fem ? 'Female Vocal' : 'Male Vocal') + ' | Spoken Word';
    if (isWhisper) return (fem || !masc ? 'Female Vocal' : 'Male Vocal') + ' | Whispered';
    if (isFalsetto) return 'Falsetto';
    if (isScream) {
      if (fem && !masc) return 'Female Vocal | Screaming';
      if (masc && !fem) return 'Male Vocal | Screaming';
      return 'Screaming';
    }
    if (isBelt) return (fem ? 'Female Vocal' : 'Male Vocal') + ' | Belted';
    if (fem) return 'Female Vocal';
    if (masc) return 'Male Vocal';
    // robotique / auto-tunée / androgyne : reste chantable, base neutre
    if (/robot|auto-tun|autotune|androgyne/.test(raw)) return 'Male Vocal';
    return 'Female Vocal';
  } catch (e) { return 'Female Vocal'; }
}

// Tag refrain : si la voix est déjà massive (diva/duo/choir) on la garde,
// sinon chœur euphorique canonique.
export function sunoChorusTag(vocalBracket) {
  var b = String(vocalBracket || '');
  if (/Choir|Duet|Diva|Belted/i.test(b)) return b;
  return 'Choir | Layered Harmonies';
}

// Fragment Style Suno en anglais : "female vocal, whispered, french vocals (fr_fr), clear singable pronunciation"
// Style = virgules uniquement, jamais de pipes (les pipes sont réservés aux [crochets] Lyrics).
export function sunoStyleVoice(vocalObj, langName, voiceCode, langCode) {
  try {
    var vb = sunoVocalBracket(vocalObj).toLowerCase().replace(/\s*\|\s*/g, ', ');
    if (vocalObj && vocalObj.instru) return 'instrumental';
    var EN_LANG = { fr: 'french', en: 'english', de: 'german', es: 'spanish', it: 'italian', pl: 'polish', ja: 'japanese', zh: 'chinese', 'zh-CN': 'chinese', ko: 'korean', hi: 'hindi', sq: 'albanian', pt: 'portuguese', ru: 'russian', ar: 'arabic', tr: 'turkish', nl: 'dutch', el: 'greek', ro: 'romanian', uk: 'ukrainian', sv: 'swedish' };
    var lc = String(langCode || '').slice(0, 5);
    var enLang = EN_LANG[lc] || EN_LANG[String(lc).slice(0, 2).toLowerCase()] || String(langName || lc || 'french').toLowerCase();
    // évite "français vocals" : force l'anglais
    if (/fran/.test(enLang)) enLang = 'french';
    if (/deutsch|allemand/.test(enLang)) enLang = 'german';
    if (/espa/.test(enLang)) enLang = 'spanish';
    var vc = String(voiceCode || '');
    return vb + ', ' + enLang + ' vocals' + (vc ? ' (' + vc + ')' : '') + ', clear singable pronunciation';
  } catch (e) { return 'female vocal, clear singable pronunciation'; }
}
// Lexique exhaustif pour le panneau d'aide (clic = copier).
// Regroupe le message utilisateur : structure + vocal + solos + énergie + échos.
export const SUNO_LEXICON = [
  { g: 'Structure', tags: ['Intro', 'Verse', 'Verse 1', 'Verse 2', 'Pre-Chorus', 'Chorus', 'Post-Chorus', 'Hook', 'Bridge', 'Interlude', 'Break', 'Outro', 'Coda', 'Instrumental'] },
  { g: 'Voix', tags: ['Male Vocal', 'Female Vocal', 'Duet', 'Choir', 'Harmonies', 'Layered Vocals', 'Ad-lib', 'Call and Response', 'Whisper', 'Whispered', 'Spoken Word', 'Belted', 'Falsetto', 'Screaming', 'Shout', 'Gospel Choir', "Children's Choir", 'Child Vocal', 'Background Harmonies', 'Whispered Backing', 'Echoing Vocals', 'Scat Singing', 'Melisma', 'Vocal Runs'] },
  { g: 'Solos', tags: ['Guitar Solo', 'Piano Solo', 'Drum Solo', 'Drum Fill', 'Percussion Break', 'Bass Solo', 'Sax Solo', 'Saxophone Solo', 'Synthesizer Solo', 'Synth Solo', 'Drum Break', 'Drum Drop', 'Breakdown', 'Bagpipe Solo', 'Accordion Interlude', 'Instrumental Break'] },
  { g: 'Énergie', tags: ['Build', 'Build-up', 'Drop', 'Bass Drop', 'Tempo Drop', 'Slowdown', 'Half-time', 'Double-time', 'Stripped Back', 'Acoustic', 'Key Change', 'Modulation', 'Fade Out', 'Cold End', 'Abrupt Ending', 'Silence', 'Stop', 'Pause', 'A Cappella', 'Applause', 'Crowd Cheering', 'Anthemic', 'Euphoric'] },
  { g: 'Échos', tags: ['Echo', 'Vocal Echo', 'Delay', 'Whispered Echo', 'Call and Response', 'Post-Chorus | Echo'] },
  { g: 'Effets studio', tags: ['Plate Reverb', 'Hall Reverb', 'Spring Reverb', 'Gated Reverb', 'Ping-Pong Delay', 'Tape Delay', 'Tape Saturation', 'Bitcrusher', 'Sidechain Pump', 'Telephone Filter', 'Autopan', 'Stereo Widening', 'Vinyl Crackle', 'Chorus'] },
  { g: 'Bruitages', tags: ['*wind blowing*', '*rain falling*', '*distant thunder*', '*ocean waves*', '*crowd cheering*', '*soft drumroll*'] },
  { g: 'Rythme & Jeu', tags: ['Rubato', 'Syncopated', 'Polyrhythm', 'Staccato', 'Legato', 'Pizzicato', 'Arpeggios', 'Counterpoint'] },
  { g: 'Dynamique', tags: ['Crescendo', 'Decrescendo', 'Vibrato', 'Tremolo', 'Swell'] }
];

// ---------------------------------------------------------------------------
// Moments de surprise Suno — solos + voix solo/chœur + échos.
// Tout reste anglais, entre crochets, stacking avec " | ".
// Le solo dépend de la famille (rock→guitare, metal→batterie, jazz→sax...),
// le 2e refrain alterne (chœur ↔ voix solo / call-response),
// le pont passe en voix solo fragile (whisper/spoken/falsetto),
// l'outro maîtrise l'écho (Fade Out | Echo + ligne "… (echo…)").
// ---------------------------------------------------------------------------
export const SOLO_BY_FAMILY = {
  rock: ['Guitar Solo', 'Drum Solo', 'Drum Fill', 'Bass Solo', 'Breakdown'],
  metal: ['Drum Solo', 'Drum Fill', 'Guitar Solo', 'Drum Break', 'Bass Solo', 'Breakdown'],
  jazz: ['Sax Solo', 'Piano Solo', 'Drum Solo', 'Drum Fill'],
  blues: ['Guitar Solo', 'Sax Solo', 'Piano Solo'],
  country: ['Guitar Solo', 'Instrumental Break', 'Piano Solo'],
  folk: ['Instrumental Break', 'Accordion Interlude', 'Guitar Solo'],
  indie: ['Guitar Solo', 'Instrumental Break', 'Piano Solo'],
  hiphop: ['Percussion Break', 'Drum Break', 'Drum Drop', 'Drum Fill'],
  edm: ['Synth Solo', 'Drum Drop', 'Drum Fill', 'Percussion Break', 'Breakdown', 'Synthesizer Solo'],
  rnb: ['Sax Solo', 'Piano Solo', 'Guitar Solo'],
  classical: ['Instrumental Break', 'Interlude', 'Piano Solo'],
  comedy: ['Percussion Break', 'Drum Solo', 'Accordion Interlude'],
  pop: ['Guitar Solo', 'Piano Solo', 'Synth Solo', 'Drum Fill', 'Percussion Break']
};

// Solo canonique pour un label de genre (дәже résultat toujours dans le lexique).
export function soloForFamily(famKey, genreLabel) {
  var fam = famKey || null;
  try { if (!fam && genreLabel) fam = familyFor(genreLabel); } catch (e) {}
  var pool = (fam && SOLO_BY_FAMILY[fam]) || SOLO_BY_FAMILY.pop;
  try {
    var g = String(genreLabel || '').toLowerCase();
    // affinage : reggae/ska → percussion, bossa → piano, trap → drum drop
    if (/reggae|ska|dub|afro|tribal|conga|bongo/.test(g)) return 'Percussion Break';
    if (/bossa|swing|bebop/.test(g)) return 'Piano Solo';
    if (/trap|drill|phonk/.test(g)) return 'Drum Drop';
    if (/house|techno|trance|dubstep|edm|dance|synthwave|hyperpop/.test(g)) return Math.random() < 0.5 ? 'Synth Solo' : 'Drum Drop';
    if (/sax|jazz/.test(g)) return 'Sax Solo';
    if (/bagpipe|celtic|folk metal|viking|pirate/.test(g) && Math.random() < 0.3) return 'Bagpipe Solo';
  } catch (e) {}
  return pool[Math.floor(Math.random() * pool.length)];
}

// 2e refrain : alterne avec le 1er pour surprendre.
// Si le 1er est massif (Choir), le 2e passe en voix solo / call-response, et inversement.
export function alternateChorusTag(firstTag, vocalBracket) {
  var f = String(firstTag || '');
  var vb = String(vocalBracket || '');
  var r = Math.random();
  var isMassive = /Choir|Duet|Anthemic/i.test(f);
  if (isMassive) {
    if (r < 0.4) {
      if (/Female Vocal/i.test(vb)) return 'Female Vocal | Call and Response';
      if (/Male Vocal/i.test(vb)) return 'Male Vocal | Call and Response';
      return 'Call and Response';
    }
    if (r < 0.7) {
      if (/Female Vocal/i.test(vb)) return 'Female Vocal | Ad-lib';
      if (/Male Vocal/i.test(vb)) return 'Male Vocal | Ad-lib';
      return 'Ad-lib';
    }
    return 'Whispered';
  }
  // 1er refrain solo → le 2e explose en chœur
  if (r < 0.6) return 'Choir | Layered Harmonies';
  return 'Choir';
}

// Pont : voix solo fragile qui tranche avec le refrain massif.
export function bridgeVocalFx(vocalBracket) {
  var vb = String(vocalBracket || '');
  var r = Math.random();
  if (/Spoken Word/i.test(vb)) return 'Whispered';
  if (/Whisper/i.test(vb)) return 'Spoken Word';
  if (/Screaming|Belted/i.test(vb)) return r < 0.5 ? 'Whispered' : 'Falsetto';
  if (r < 0.45) return 'Whispered';
  if (r < 0.7) return 'Spoken Word';
  if (r < 0.85) return 'Falsetto';
  return 'Ad-lib';
}

// Plan complet des moments pour une chanson (1-2 surprises max, rotation auto).
// Retour : { solo, chorus2, bridgeFx, outro }
// Plan exceptionnel : solo + chœur/solo alterné + pont fragile + couplet duo,
// lift tonal/tempo + stop-break silence + outro à 3 visages (fade-echo / cold / a cappella).
export function outroVariant() {
  var r = Math.random();
  if (r < 0.65) return { parts: ['Outro', 'Fade Out', 'Echo'], kind: 'fade' };
  if (r < 0.85) return { parts: ['Outro', 'Cold End'], kind: 'cold' };
  return { parts: ['Outro', 'A Cappella'], kind: 'acap' };
}
// Lift avant le final : changement de ton ou flip de tempo (30% des chansons).
export function liftFor(famKey, genreLabel) {
  if (Math.random() > 0.3) return null;
  var fam = famKey || null;
  try { if (!fam && genreLabel) fam = familyFor(genreLabel); } catch (e) {}
  var g = String(genreLabel || '').toLowerCase();
  if (/house|techno|trance|dubstep|edm|dance|hyperpop|trap|drill|dembow/.test(g)) return Math.random() < 0.5 ? 'Double-time' : 'Tempo Drop';
  if (fam === 'metal' || fam === 'rock') return Math.random() < 0.5 ? 'Half-time' : 'Key Change';
  if (fam === 'jazz' || fam === 'blues') return 'Tempo Drop';
  if (fam === 'hiphop') return 'Double-time';
  return 'Key Change';
}
// Couplet 2 en duo : la 2e voix entre en scène (35%, jamais si déjà duo).
export function duetVerseTag(vocalBracket) {
  var vb = String(vocalBracket || '');
  if (/Duet/i.test(vb)) return null;
  if (Math.random() > 0.35) return null;
  if (/Female Vocal/i.test(vb)) return 'Female Vocal | Duet';
  if (/Male Vocal/i.test(vb)) return 'Male Vocal | Duet';
  return 'Duet';
}
export function sunoMoments(genreLabel, vocalBracket) {
  var fam = null;
  try { fam = familyFor(genreLabel); } catch (e) { fam = null; }
  return {
    solo: soloForFamily(fam, genreLabel),
    chorus2: alternateChorusTag(sunoChorusTag(vocalBracket), vocalBracket),
    bridgeFx: bridgeVocalFx(vocalBracket),
    duetV2: duetVerseTag(vocalBracket),
    lift: liftFor(fam, genreLabel),
    stopBreak: Math.random() < 0.25,
    outro: outroVariant()
  };
}
