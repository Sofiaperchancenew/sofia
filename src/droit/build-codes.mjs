// Bauwerkzeug fuer den Gesetzesbestand (Runde 198).
//
// Es macht fuer JEDEN Kodex genau das, was in Runde 197 fuer den CESEDA von
// Hand gemacht wurde: den amtlichen Wortlaut aller in Kraft stehenden Artikel
// ins Haus holen, mit Nummer, Weg im Plan, Fassungsdatum und Herkunft - damit
// Sofia den Artikel zitieren kann, statt ihn aus dem Modellwissen zu erfinden.
//
// Quelle: https://codes.droit.org/ (freier Spiegel der Kodexe von Legifrance,
// taeglich aus den amtlichen Daten der Dila gebaut). Ein Kodex = EINE Datei:
//   https://codes.droit.org/payloads/<Name des Kodex>.xml
// Der XML-Baum ist flach und klar:
//   <code nom id lastup>
//     <t niveau title id etat>          Abschnitt der Gliederung
//       <article id num etat date modTitle>Wortlaut</article>
//       <t>...</t>
//     </t>
//   </code>
//
// Dieses Modul ist absichtlich reines Rechnen ohne Netz und ohne Dateisystem:
// `parseCodeXML(xml)` gibt die Artikel zurueck, `makeFiles(parsed, meta)` die
// beiden fertigen Dateien. Wer es laufen laesst, holt und schreibt selbst
// (siehe src/CORPUS.md, Abschnitt "Gesetze").

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '\u00ab', raquo: '\u00bb', deg: '\u00b0', euro: '\u20ac', sect: '\u00a7', hellip: '\u2026', ndash: '\u2013', mdash: '\u2014', oelig: '\u0153', OElig: '\u0152', eacute: '\u00e9', egrave: '\u00e8', agrave: '\u00e0', ecirc: '\u00ea', ccedil: '\u00e7', ugrave: '\u00f9', icirc: '\u00ee', ocirc: '\u00f4', acirc: '\u00e2' };

export function decodeEntities(s) {
  return String(s == null ? '' : s)
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return ' '; } })
    .replace(/&#(\d+);/g, (m, d) => { try { return String.fromCodePoint(Number(d)); } catch (e) { return ' '; } })
    .replace(/&([a-zA-Z]+);/g, (m, n) => (ENT[n] != null ? ENT[n] : m));
}

// Der Wortlaut eines Artikels: <br/> und </p> werden Zeilen, Zellen einer
// Tabelle werden " | ", alles andere ist Beiwerk und faellt weg.
export function articleText(raw) {
  let s = decodeEntities(String(raw == null ? '' : raw));
  s = s.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n').replace(/<p[^>]*>/gi, '')
    .replace(/<\/div\s*>/gi, '\n').replace(/<div[^>]*>/gi, '')
    .replace(/<\/tr\s*>/gi, '\n').replace(/<tr[^>]*>/gi, '')
    .replace(/<\/t[dh]\s*>/gi, ' | ').replace(/<t[dh][^>]*>/gi, '')
    .replace(/<sup[^>]*>/gi, '^')
    .replace(/<[^>]+>/g, '');
  return s.replace(/[ \t\u00a0]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Die Nummer so, wie App.DroitLookup sie sucht: ohne Punkt und Leerzeichen,
// gross geschrieben ("L. 812-1" wird "L812-1", "R*123-4" bleibt "R*123-4").
export function normNum(num) {
  return String(num == null ? '' : num).replace(/[\s.\u00a0]/g, '').toUpperCase();
}

const ATTR = (attrs, k) => { const m = new RegExp(k + '="([^"]*)"').exec(attrs); return m ? decodeEntities(m[1]) : ''; };

// Der ganze Kodex, in einem Durchgang gelesen.
export function parseCodeXML(xml) {
  const src = String(xml == null ? '' : xml).replace(/<!--[\s\S]*?-->/g, '');
  const rootM = /<code\b((?:"[^"]*"|'[^']*'|[^>"'])*?)>/.exec(src);
  const meta = {
    nom: rootM ? ATTR(rootM[1], 'nom') : '',
    code: rootM ? ATTR(rootM[1], 'id') : '',
    lastup: rootM ? ATTR(rootM[1], 'lastup') : ''
  };
  const re = /<(\/?)([a-zA-Z0-9_:-]+)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let m, trail = [], sections = {}, articles = [];
  while ((m = re.exec(src))) {
    const closing = m[1] === '/', name = m[2], attrs = m[3], self = m[4] === '/';
    if (name === 't') {
      if (closing) trail.pop();
      else if (!self) {
        const t = { title: ATTR(attrs, 'title'), niveau: ATTR(attrs, 'niveau'), etat: ATTR(attrs, 'etat'), id: ATTR(attrs, 'id') };
        trail.push(t);
        if (t.id) sections[t.id] = t.title;
      }
    } else if (name === 'article' && !closing && !self) {
      const start = m.index + m[0].length;
      const end = src.indexOf('</article>', start);
      const raw = end === -1 ? src.slice(start) : src.slice(start, end);
      articles.push({
        num: normNum(ATTR(attrs, 'num')),
        id: ATTR(attrs, 'id'),
        etat: ATTR(attrs, 'etat'),
        date: ATTR(attrs, 'date'),
        mod: ATTR(attrs, 'modTitle'),
        path: trail.map(t => t.title).filter(Boolean).join(' > '),
        x: articleText(raw)
      });
    }
  }
  return { meta, articles, sections };
}

// Der letzte Teil des Wegs - das, was in der Fiche neben dem Artikel steht.
export function shortPath(path, n) {
  const parts = String(path || '').split(' > ').filter(Boolean);
  return parts.slice(-(n || 2)).join(' > ');
}

// Die beiden Dateien, die App.DroitLookup erwartet.
//   articles.json - der Wortlaut (sections: t/c/x, dazu d = Fassungsdatum, m = Herkunft)
//   index.json    - Nummer -> Legifrance-Kennung, Weg jedes Artikels, Gliederung
export function makeFiles(parsed, opts) {
  const o = opts || {};
  const meta = parsed.meta || {};
  const nom = o.nom || meta.nom || '';
  const today = o.date || new Date().toISOString().slice(0, 10);
  const byNum = new Map();
  for (const a of parsed.articles) {
    if (!a.num || !a.x) continue;
    const prev = byNum.get(a.num);
    // Doppelte Nummer (Umnummerierung, Anhang): der laengere Wortlaut gewinnt,
    // bei Gleichstand der spaeter im Baum stehende (der ist der neuere).
    if (!prev || a.x.length >= prev.x.length) byNum.set(a.num, a);
  }
  const list = [...byNum.values()];
  const sections = [];
  const articles = {}, paths = {}, abrogated = Object.assign({}, o.oldAbrogated || {});
  for (const a of list) {
    sections.push({
      t: 'Article ' + a.num,
      c: shortPath(a.path, 2),
      x: a.x,
      d: a.date || '',
      m: (a.mod || '').replace(/\s*-?\s*art\.\s*$/, '').slice(0, 70)
    });
    const suffix = String(a.id || '').replace(/^LEGIARTI/, '');
    if (suffix) articles[a.num] = suffix;
    if (a.path) paths[a.num] = a.path;
    delete abrogated[a.num];
  }
  // Punkte/Leerzeichen in den Schluesseln der alten Karte mitziehen.
  const cleanAbrogated = {};
  for (const k of Object.keys(abrogated)) { const n = normNum(k); if (n && !articles[n]) cleanAbrogated[n] = abrogated[k]; }

  const articlesFile = {
    title: nom + ' \u2014 articles en vigueur (texte officiel)',
    author: 'Dila \u2014 L\u00e9gifrance (relev\u00e9 sur codes.droit.org)',
    source: 'https://www.legifrance.gouv.fr/codes/texte_lc/' + (meta.code || '') + '/',
    licence: 'Textes officiels : libres de droits (art. L122-5 CPI), reproduits depuis L\u00e9gifrance (Dila), source cit\u00e9e. Relev\u00e9 sur codes.droit.org.',
    note: 'Consult\u00e9 le ' + today + ' \u2014 ' + list.length + ' articles en vigueur' + (meta.lastup ? ', Kodex-Fassung ' + meta.lastup : ''),
    mode: 'articles',
    kind: 'articles',
    sections: sections
  };
  const indexFile = {
    code: meta.code || '',
    nom: nom,
    date: today,
    base: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI',
    prefix: 'LEGIARTI',
    source: 'https://codes.droit.org/',
    lastup: meta.lastup || '',
    enVigueur: String(list.length),
    abroges: String(Object.keys(cleanAbrogated).length),
    articles: articles,
    abrogated: cleanAbrogated,
    sections: parsed.sections || {},
    paths: paths
  };
  return { articlesFile, indexFile, count: list.length, abrogated: Object.keys(cleanAbrogated).length };
}
