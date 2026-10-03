// Bauwerkzeug fuer die Vertraege der Europaeischen Union (Runde 278).
//
// Die Kodexe kommen aus codes.droit.org (siehe build-codes.mjs). Die Vertraege
// haben keine solche Quelle: sie stehen bei EUR-Lex als XHTML der amtlichen
// konsolidierten Fassung:
//
//   https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:12016E/TXT
//   (12016E = AEUV/TFUE, 12016M = EUV/TUE, 12012P = Charta, 12016A = Euratom)
//
// Der Baum ist flach und regelmaessig:
//   <div id="101">
//     <p class="ti-art">Article 101</p>
//     <p class="sti-art">(ex-article 81 TCE)</p>      <- Herkunft, kommt in das Feld m
//     <div id="101.001"><p class="normal">1. ...</p></div>
//   </div>
//   <p class="ti-section-1">TITRE VII</p>             <- Gliederung
//   <p class="ti-section-2">LES REGLES DE CONCURRENCE</p>
//
// Hinter dem eigentlichen Vertrag folgen die Protokolle; sie beginnen ihre
// Nummerierung wieder bei "Article premier". Genau daran endet das Lesen: der
// erste wiederholte Artikel ist der erste Artikel eines Protokolls.
//
// Dieses Modul ist wie build-codes.mjs reines Rechnen: kein Netz, kein
// Dateisystem. Wer es laufen laesst, holt und schreibt selbst (src/CORPUS.md).

import { articleText } from './build-codes.mjs';

const LABEL = /<p[^>]*class="(ti-section-1|ti-section-2|ti-section-3|ti-art|sti-art)"[^>]*>([\s\S]*?)<\/p>/g;

const text = (h) => String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// Der Wortlaut, wie er in der Fiche stehen soll: die Zellentrenner der
// Aufzaehlungen ("a) | ...") werden zu einem Leerzeichen, sonst bleibt alles.
export function tidyEu(s) {
  return String(s == null ? '' : s)
    .replace(/[ \t]*\|[ \t]*/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// "Article premier" ist Artikel 1 - so, wie eine Frage ihn nennt.
// Nur echte Nummern. In Euratom tragen manche Zwischenueberschriften die Klasse
// ti-art ("ARTICLES 209 A 223") - die sind kein Artikel und fallen hier heraus.
export function articleNumber(title) {
  let n = text(title).replace(/^Article\s+/i, '').trim();
  if (/^premier$/i.test(n)) return '1';
  n = n.replace(/[\s.\u00a0]/g, '').toUpperCase();
  return /^\d{1,4}$/.test(n) ? n : '';
}

export function parseEurlex(html) {
  const src = String(html == null ? '' : html);
  const marks = [];
  LABEL.lastIndex = 0;
  let m;
  while ((m = LABEL.exec(src))) marks.push({ kind: m[1], raw: m[2], at: m.index, end: m.index + m[0].length });
  marks.sort((a, b) => a.at - b.at);
  const meta = { nom: '', celex: '' };
  const t = /<title>([\s\S]*?)<\/title>/i.exec(src);
  if (t) meta.nom = text(t[1]).replace(/\s*[|·]\s*EUR-Lex.*$/i, '').trim();
  // Die naechste Markierung ab einer Stelle (die Liste ist nach `at` sortiert).
  const nextFrom = (pos) => { for (const mk of marks) if (mk.at >= pos) return mk; return null; };
  // Die Gliederung, wie sie an einer Stelle gerade gilt (letzter Titel/Ziffer/Absatz).
  const secMarks = marks.filter((mk) => mk.kind.indexOf('ti-section') === 0);
  const trailAt = (pos) => {
    let t1 = '', t2 = '', t3 = '';
    for (const s of secMarks) {
      if (s.at >= pos) break;
      const v = text(s.raw);
      if (s.kind === 'ti-section-1') { t1 = v; t2 = ''; t3 = ''; }
      else if (s.kind === 'ti-section-2') { t2 = v; t3 = ''; }
      else t3 = v;
    }
    return [t1, t2, t3].filter(Boolean).join(' > ');
  };
  const arts = [], sections = {}, seen = {};
  for (const am of marks) {
    if (am.kind !== 'ti-art') continue;
    const num = articleNumber(am.raw);
    if (!num) continue;
    if (seen[num]) break;                 // ab hier: Protokolle
    seen[num] = 1;
    let start = am.end, note = '';
    // Die eigene Unterzeile des Artikels: "(ex-article 81 TCE)" (Vertraege) oder
    // die Ueberschrift ("Dignite humaine", Charta).
    const nx = nextFrom(start);
    if (nx && nx.kind === 'sti-art') { note = text(nx.raw); start = nx.end; }
    const after = nextFrom(start);
    const end = after ? after.at : src.length;
    const path = trailAt(am.at);
    arts.push({ num: num, path: path, m: note, x: tidyEu(articleText(src.slice(start, end))) });
    if (path) sections['a' + num] = path;
  }
  return { meta, articles: arts, sections };
}

// Kurzer Weg fuer die Fiche: die letzten zwei Stufen der Gliederung.
export function shortPath(path, n) {
  const parts = String(path || '').split(' > ').filter(Boolean);
  return parts.slice(-(n || 2)).join(' > ');
}

// Dieselben zwei Dateien, die App.DroitLookup fuer die Kodexe erwartet - nur
// traegt der Index hier keine Legifrance-Kennungen (die gibt es fuer die
// Vertraege nicht): articles bleibt leer, paths zaehlt die Artikel auf.
// Damit ist resolveKey zufrieden und read() versucht erst gar kein Netz.
export function makeEuFiles(parsed, opts) {
  const o = opts || {};
  const nom = o.nom || parsed.meta.nom || '';
  const celex = o.celex || '';
  const today = o.date || new Date().toISOString().slice(0, 10);
  const sections = [], paths = {}, sheet = {};
  for (const a of parsed.articles) {
    sections.push({
      t: 'Article ' + a.num,
      c: shortPath(a.path, 2),
      x: a.x,
      d: o.version || '',
      m: (a.m || '').slice(0, 70)
    });
    paths[a.num] = a.path || '';
    sheet['a' + a.num] = a.path || '';
  }
  const articlesFile = {
    title: nom + ' \u2014 texte consolidé (Journal officiel de l\u2019Union européenne)',
    author: 'Union européenne (EUR-Lex, fassung faisant foi)',
    source: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex,
    licence: 'Textes officiels de l\u2019Union : reproduits depuis EUR-Lex (Office des publications), source citée.',
    note: 'Consulté le ' + today + ' \u2014 ' + parsed.articles.length + ' articles' + (o.version ? ', version ' + o.version : ''),
    mode: 'articles',
    kind: 'articles',
    sections: sections
  };
  const indexFile = {
    code: celex,
    nom: nom,
    date: today,
    base: '',
    prefix: '',
    source: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex,
    lastup: o.version || '',
    enVigueur: String(parsed.articles.length),
    abroges: '0',
    articles: {},
    abrogated: {},
    sections: sheet,
    paths: paths
  };
  return { articlesFile, indexFile, count: parsed.articles.length, abrogated: 0 };
}
