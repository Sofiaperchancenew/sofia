// MediaWiki-Seite (Wikibooks/Wikiversity) -> lesbarer Text. Runde 199.
//
// Fuer die Programmier-Kurse (Java, JavaScript) reicht die TextExtrakt-API
// NICHT: sie wirft die Code-Bloecke weg - und genau die sind in einem
// Programmierkurs das Wichtigste ("Exemple :" und dann nichts). Deshalb wird
// hier das gerenderte HTML der Seite (`action=parse&prop=text`) genommen und
// selbst in Text verwandelt: Absaetze, Ueberschriften, Listen und die
// Code-Bloecke (`<pre>`) bleiben erhalten.
//
// Reine Rechnung: das DOM-Werkzeug (linkedom) wird hereingereicht, damit dieses
// Modul nichts weiter braucht.
export function wikiHtmlToText(html, parseHTML) {
  const { document } = parseHTML(String(html == null ? '' : html));
  const drop = ['.mw-editsection', '.navbox', '.catlinks', '.toc', '.tocnumber', '.toctext',
    '.mw-collapsible-toggle', '.reference', '.mw-references-wrap', '.mw-references-columns',
    '.metadata', '.ambox', '.noprint', '.mw-empty-elt', 'style', 'script', '.mw-jump-link',
    '.mw-indicators', '.printfooter', '.mw-hidden-catlinks', 'noscript'];
  for (const sel of drop) { try { document.querySelectorAll(sel).forEach(function (e) { e.remove && e.remove(); }); } catch (e) {} }
  // Das Buch-Menue (die Liste aller Kapitel) steht als <div style="...columns: 3 350px">
  // auf JEDER Seite - ohne diese Zeile wiederholte sich das Inhaltsverzeichnis
  // hundertfach im Bestand.
  try {
    document.querySelectorAll('div[style]').forEach(function (e) {
      const st = e.getAttribute && e.getAttribute('style') || '';
      if (/columns\s*:/.test(st)) e.remove && e.remove();
    });
  } catch (e) {}
  const root = document.querySelector('.mw-parser-output') || document.body || document.documentElement;
  if (!root) return '';
  const out = [];
  emit(root, out, 0);
  return out.join('').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
}

const HEAD = { H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6 };
const SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, BUTTON: 1, SELECT: 1, IFRAME: 1 };

function emit(node, out, depth) {
  if (!node) return;
  const type = node.nodeType;
  if (type === 3) { // Text
    out.push(String(node.textContent || '').replace(/\s+/g, ' '));
    return;
  }
  if (type !== 1) return; // Kommentare usw.
  const tag = String(node.tagName || '').toUpperCase();
  if (SKIP[tag]) return;
  if (HEAD[tag]) {
    const t = textOf(node).trim();
    if (t) out.push('\n\n' + '='.repeat(3 - Math.min(2, depth)) + ' ' + t + '\n\n');
    return;
  }
  if (tag === 'PRE') {
    const code = String(node.textContent || '').replace(/\r/g, '').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    if (code) out.push('\n\n' + code + '\n\n');
    return;
  }
  if (tag === 'P' || tag === 'BLOCKQUOTE' || tag === 'DD' || tag === 'DT' || tag === 'FIGCAPTION') {
    const t = textOf(node).trim();
    if (t) out.push('\n\n' + t + '\n\n');
    return;
  }
  if (tag === 'LI') {
    const t = textOf(node).trim();
    if (t) out.push('\n- ' + t);
    return;
  }
  if (tag === 'UL' || tag === 'OL' || tag === 'DL') {
    out.push('\n');
    for (const c of childNodes(node)) emit(c, out, depth);
    out.push('\n');
    return;
  }
  if (tag === 'BR') { out.push('\n'); return; }
  if (tag === 'HR') { out.push('\n\n'); return; }
  if (tag === 'TABLE') {
    // Tabellen zeilenweise als Text retten (Vergleichstabellen der Kurse).
    for (const tr of node.querySelectorAll('tr')) {
      const cells = [];
      for (const td of tr.querySelectorAll('th,td')) cells.push(textOf(td).trim());
      const line = cells.filter(Boolean).join(' | ');
      if (line) out.push('\n' + line);
    }
    out.push('\n');
    return;
  }
  const block = { DIV: 1, SECTION: 1, ARTICLE: 1, MAIN: 1, ASIDE: 1, HEADER: 1, FOOTER: 1, NAV: 1, FIGURE: 1, CENTER: 1 };
  if (block[tag]) {
    out.push('\n');
    for (const c of childNodes(node)) emit(c, out, depth + 1);
    out.push('\n');
    return;
  }
  for (const c of childNodes(node)) emit(c, out, depth);
}

function childNodes(node) {
  const out = [];
  if (!node || !node.childNodes) return out;
  for (let i = 0; i < node.childNodes.length; i++) out.push(node.childNodes[i]);
  return out;
}

function textOf(node) {
  if (!node) return '';
  const pre = [];
  if (node.querySelectorAll) node.querySelectorAll('pre').forEach(function (p) { pre.push(p.textContent); });
  let t = String(node.textContent || '');
  if (pre.length) t = t; // pre-Text ist in textContent schon enthalten
  return t.replace(/\s+/g, ' ');
}
