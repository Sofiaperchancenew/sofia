// Laboratoire Rythme Sofia — moteur de théorie rythmique + preview WebAudio.
// Objectif : surprendre techniquement par la maîtrise du rythme.
// 100% anglais vers Suno. Aucune dépendance.
export const TIME_SIGS = [
  { id: '4/4', beats: 4, unit: 4, steps: 16, label: '4/4 — standard', suno: '4/4 driving pulse' },
  { id: '3/4', beats: 3, unit: 4, steps: 12, label: '3/4 — waltz', suno: '3/4 waltz pulse' },
  { id: '6/8', beats: 2, unit: 8, steps: 12, label: '6/8 — compound sway', suno: '6/8 compound groove' },
  { id: '12/8', beats: 4, unit: 8, steps: 12, label: '12/8 — afro shuffle', suno: '12/8 afro shuffle' },
  { id: '5/4', beats: 5, unit: 4, steps: 20, label: '5/4 — odd meter (Take Five)', suno: '5/4 odd meter' },
  { id: '7/8', beats: 7, unit: 8, steps: 14, label: '7/8 — Balkan drive (2+2+3)', suno: '7/8 Balkan groove' },
  { id: '9/8', beats: 3, unit: 8, steps: 18, label: '9/8 — compound odd', suno: '9/8 compound odd meter' }
];

export const FEELS = [
  { id: 'straight', label: 'Straight', suno: 'straight groove' },
  { id: 'swing58', label: 'Swing 58%', suno: 'swung 58%' },
  { id: 'swing62', label: 'Swing 62% (triplet)', suno: 'swung triplet feel' },
  { id: 'shuffle', label: 'Shuffle 12/8', suno: 'shuffled 12/8 feel' },
  { id: 'halftime', label: 'Half-time', suno: 'half-time drums' },
  { id: 'doubletime', label: 'Double-time', suno: 'double-time drums' },
  { id: 'triplet', label: 'Triplet hats', suno: 'triplet hats' }
];

export const POLYS = [
  { id: 'none', label: 'No cross-rhythm', suno: '' },
  { id: '3:2', label: '3:2 — tresillo over pulse', suno: '3:2 cross-rhythm' },
  { id: '4:3', label: '4:3 — four over three', suno: '4:3 polyrhythm' },
  { id: '5:4', label: '5:4 — five over four', suno: '5:4 polyrhythm' },
  { id: '6:4', label: '6:4 — double-triplet', suno: '6:4 cross-rhythm' },
  { id: '7:4', label: '7:4 — septuplet tension', suno: '7:4 polyrhythm' }
];

// Algorithme euclidien (Bjorklund) : répartit k impulsions sur n pas.
export function euclid(k, n) {
  k = Math.max(1, Math.min(n, k | 0)); n = Math.max(1, n | 0);
  if (k >= n) { var full = []; for (var i = 0; i < n; i++) full.push(1); return full; }
  var pattern = [], counts = [], remainders = [], divisor = n - k;
  remainders.push(k); var level = 0;
  while (true) {
    counts.push(Math.floor(divisor / remainders[level]));
    remainders.push(divisor % remainders[level]);
    divisor = remainders[level]; level++;
    if (remainders[level] <= 1) break;
  }
  counts.push(divisor);
  function build(l) {
    if (l === -1) pattern.push(0);
    else if (l === -2) pattern.push(1);
    else { for (var i = 0; i < counts[l]; i++) build(l - 1); if (remainders[l] !== 0) build(l - 2); }
  }
  build(level);
  // rotation : commencer par une impulsion
  while (pattern.length && pattern[0] === 0) pattern.push(pattern.shift());
  return pattern.slice(0, n);
}

function rot(arr, s) { s = ((s % arr.length) + arr.length) % arr.length; return arr.slice(s).concat(arr.slice(0, s)); }

// Grilles classiques. steps = positions sur la grille du meter (16 par défaut).
function baseLayers(meterId, patternId, ek, en) {
  var steps = 16;
  try {
    for (var i = 0; i < TIME_SIGS.length; i++) if (TIME_SIGS[i].id === meterId) steps = TIME_SIGS[i].steps;
  } catch (e) {}
  function empty() { var a = []; for (var j = 0; j < steps; j++) a.push(0); return a; }
  var kick = empty(), snare = empty(), hat = empty(), bell = empty();
  function put(arr, idxs) { idxs.forEach(function (ix) { arr[((ix % steps) + steps) % steps] = 1; }); }
  // pulsations de base
  if (steps === 16) { put(kick, [0, 8]); if (patternId !== 'halftime') put(kick, [10]); put(snare, [4, 12]); for (var h = 0; h < 16; h += 2) hat[h] = 1; }
  else if (steps === 12) { put(kick, [0, 6]); put(snare, [3, 9]); for (var h2 = 0; h2 < 12; h2 += 2) hat[h2] = 1; }
  else if (steps === 20) { put(kick, [0, 8, 12]); put(snare, [4, 16]); for (var h3 = 0; h3 < 20; h3 += 2) hat[h3] = 1; }
  else if (steps === 14) { put(kick, [0, 4, 8]); put(snare, [6, 11]); for (var h4 = 0; h4 < 14; h4++) if (h4 % 2 === 0) hat[h4] = 1; }
  else if (steps === 18) { put(kick, [0, 6, 12]); put(snare, [6, 15]); for (var h5 = 0; h5 < 18; h5 += 3) hat[h5] = 1; }
  else { put(kick, [0]); put(snare, [Math.floor(steps / 2)]); for (var h6 = 0; h6 < steps; h6 += 2) hat[h6] = 1; }

  if (patternId === 'tresillo') {
    var t = euclid(3, 8);
    bell = empty();
    for (var b = 0; b < steps; b++) bell[b] = t[b % 8] ? 1 : 0;
  } else if (patternId === 'son32') {
    bell = empty(); put(bell, steps === 16 ? [0, 3, 6, 10, 12] : [0, 2, 4, 7, 9]);
  } else if (patternId === 'son23') {
    bell = empty(); put(bell, steps === 16 ? [2, 4, 8, 11, 14] : [1, 3, 6, 8, 10]);
  } else if (patternId === 'bossa') {
    kick = empty(); snare = empty(); hat = empty();
    put(kick, steps === 16 ? [0, 6, 8, 14] : [0, 4, 6, 10]);
    put(snare, steps === 16 ? [4, 12] : [3, 9]);
    for (var bb = 0; bb < steps; bb++) hat[bb] = (bb % 2 === 0) ? 1 : 0;
    bell = empty(); put(bell, steps === 16 ? [0, 3, 6, 10, 12] : [0, 2, 4, 7, 9]);
  } else if (patternId === 'ewe') {
    var ewe = [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1];
    bell = empty();
    for (var e = 0; e < steps; e++) bell[e] = ewe[e % 12] ? 1 : 0;
  } else if (patternId === 'trap') {
    hat = empty(); for (var th = 0; th < steps; th++) hat[th] = 1;
    kick = empty(); put(kick, [0, 7, 10]); snare = empty(); put(snare, [8]);
  } else if (patternId === 'halftime') {
    snare = empty(); put(snare, [8]); kick = empty(); put(kick, [0, 10]);
  } else if (patternId === 'doubletime') {
    snare = empty(); put(snare, [4, 12, 2, 6, 10, 14].filter(function (x) { return x < steps; }));
    hat = empty(); for (var dh = 0; dh < steps; dh++) hat[dh] = 1;
  } else if (patternId === 'euclid') {
    var kk = Math.max(2, Math.min(13, ek | 0 || 5)), nn = steps;
    var ep = euclid(kk, nn);
    hat = ep.slice();
    bell = rot(ep, 1).map(function (v) { return v ? 1 : 0; });
  } else if (patternId === 'dembow') {
    kick = empty(); put(kick, [0, 3, 4, 6, 8, 11, 12, 14].filter(function (x) { return x < steps; }));
    snare = empty(); put(snare, [4, 12]);
  }
  return { steps: steps, kick: kick, snare: snare, hat: hat, bell: bell };
}

export const RHYTHM_PATTERNS = [
  { id: 'straight', label: 'Straight 16ths', suno: 'straight 16th groove' },
  { id: 'tresillo', label: 'Tresillo 3-3-2 (dembow)', suno: 'tresillo 3-3-2 groove' },
  { id: 'son32', label: 'Son clave 3-2', suno: 'son clave 3-2' },
  { id: 'son23', label: 'Son clave 2-3', suno: 'son clave 2-3' },
  { id: 'bossa', label: 'Bossa-nova', suno: 'bossa-nova groove' },
  { id: 'ewe', label: 'Ewe bell 12/8 (2-2-1-2-2-2-1)', suno: 'ewe bell groove' },
  { id: 'dembow', label: 'Dembow', suno: 'dembow groove' },
  { id: 'trap', label: 'Trap triplets + rolls', suno: 'trap triplet hats' },
  { id: 'halftime', label: 'Half-time (lourd)', suno: 'half-time drums' },
  { id: 'doubletime', label: 'Double-time (DnB)', suno: 'double-time drums' },
  { id: 'euclid', label: 'Euclidien réglable K/N', suno: 'euclidean rhythm' }
];

export function getPattern(meterId, patternId, ek, en) {
  return baseLayers(meterId, patternId, ek, en);
}

export function patternLabel(id) {
  for (var i = 0; i < RHYTHM_PATTERNS.length; i++) if (RHYTHM_PATTERNS[i].id === id) return RHYTHM_PATTERNS[i];
  return RHYTHM_PATTERNS[0];
}
export function meterById(id) {
  for (var i = 0; i < TIME_SIGS.length; i++) if (TIME_SIGS[i].id === id) return TIME_SIGS[i];
  return TIME_SIGS[0];
}
export function feelById(id) {
  for (var i = 0; i < FEELS.length; i++) if (FEELS[i].id === id) return FEELS[i];
  return FEELS[0];
}
export function polyById(id) {
  for (var i = 0; i < POLYS.length; i++) if (POLYS[i].id === id) return POLYS[i];
  return POLYS[0];
}

// Fragment Style Suno (anglais, virgules). '' si 4/4 straight sans poly (comportement par défaut inchangé).
export function rhythmSunoFragment(o) {
  o = o || {};
  var meter = meterById(o.meter || '4/4'), pat = patternLabel(o.pattern || 'straight'),
    feel = feelById(o.feel || 'straight'), poly = polyById(o.poly || 'none');
  var isDefault = (meter.id === '4/4' && pat.id === 'straight' && feel.id === 'straight' && poly.id === 'none');
  if (isDefault) return '';
  var parts = [];
  if (meter.id !== '4/4') parts.push(meter.suno);
  else if (pat.id === 'straight' && feel.id !== 'straight') parts.push('4/4 driving pulse');
  if (pat.id !== 'straight') {
    if (pat.id === 'euclid') parts.push('euclidean hats ' + (o.k || 5) + '/' + meter.steps);
    else parts.push(pat.suno);
  }
  if (feel.id !== 'straight') parts.push(feel.suno);
  if (poly.id !== 'none') parts.push(poly.suno);
  return parts.join(', ');
}

// Bracket Structure Suno (anglais, pipes) : ex "7/8 Percussion Break".
export function rhythmStructBracket(o) {
  o = o || {};
  var meter = meterById(o.meter || '4/4'), pat = patternLabel(o.pattern || 'straight'),
    poly = polyById(o.poly || 'none');
  var isDefault = (meter.id === '4/4' && pat.id === 'straight' && poly.id === 'none');
  if (isDefault) return '';
  var core = meter.id !== '4/4' ? meter.id + ' Percussion Break' : 'Percussion Break';
  var extras = [];
  if (pat.id !== 'straight') extras.push(pat.id === 'euclid' ? 'euclidean ' + (o.k || 5) + '/' + meter.steps : pat.suno);
  if (poly.id !== 'none') extras.push(poly.suno);
  if ((o.feel || 'straight') !== 'straight') extras.push(feelById(o.feel).suno);
  return extras.length ? core + ', ' + extras.join(', ') : core;
}

// Modulation métrique : ex noire -> noire pointée = tempo × 2/3.
export function metricModulation(bpm, from, to) {
  var table = { 'quarter': 1, 'dotted-quarter': 1.5, 'half': 2, 'eighth': 0.5, 'triplet-quarter': 2 / 3 };
  var f = table[from] || 1, t = table[to] || 1;
  return Math.round(bpm * f / t);
}

export function asciiRow(arr) {
  return arr.map(function (v) { return v ? '●' : '○'; }).join('');
}

// Preset surprise : 1 chance sur 2 de sortir du 4/4.
export function surpriseRhythm() {
  var r = Math.random();
  if (r < 0.35) {
    var meters = ['5/4', '7/8', '12/8', '6/8', '9/8'];
    var pats = ['tresillo', 'ewe', 'euclid', 'son32', 'bossa'];
    return {
      meter: meters[Math.floor(Math.random() * meters.length)],
      pattern: pats[Math.floor(Math.random() * pats.length)],
      feel: ['straight', 'swing58', 'swing62', 'shuffle'][Math.floor(Math.random() * 4)],
      poly: ['none', 'none', '3:2', '4:3'][Math.floor(Math.random() * 4)],
      k: 3 + Math.floor(Math.random() * 8)
    };
  }
  return {
    meter: '4/4',
    pattern: ['tresillo', 'son32', 'trap', 'halftime', 'doubletime', 'euclid'][Math.floor(Math.random() * 6)],
    feel: ['straight', 'swing58', 'swing62', 'halftime', 'triplet'][Math.floor(Math.random() * 5)],
    poly: ['none', 'none', 'none', '3:2'][Math.floor(Math.random() * 4)],
    k: 3 + Math.floor(Math.random() * 8)
  };
}
