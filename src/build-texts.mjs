// Bauwerkzeug fuer den Text-Bestand der Mappen (Runde 198).
//
// Der Nutzer hat gesagt: "Tu dois faire la meme chose avec eux comme tu l'as
// fait avec le CESEDA" - fuer jedes Dokument, das er gibt, und fuer alle, die
// noch kommen. Beim Kodex hiess das: den ECHTEN Wortlaut ins Haus holen, ihn
// durchsuchbar machen und jedes Zitat daraus belegen. Hier ist derselbe Weg
// fuer die anderen Dokumente (Sexologie, Medizin, Mathematik, Web, ...):
// die echten Seiten des Dokuments werden in Abschnitte zerlegt und als
// src/<domaene>/texte.json(.gz) abgelegt. App.Corpus (index.html) sucht darin
// und legt nur die passenden Abschnitte vor sie - mit Quelle, Seite und der
// Pflicht, woertlich zu zitieren.
//
// Dieses Modul rechnet nur: es bekommt die Seiten (aus PDF.js bereits
// ausgelesen) und gibt die fertige Datei zurueck. Wer es laufen laesst, holt
// das PDF und entpackt es selbst (siehe src/CORPUS.md, "Dokumente").

// Ein Abschnitt soll etwa diese Groesse haben - gross genug, um einen
// Gedanken zu tragen, klein genug, um nicht den Platz anderer zu fressen.
export const MAX_SECTION = 1500;

// Eine Seite in Abschnitte zerlegen: Absaetze werden zusammengehalten, bis
// die Groesse erreicht ist. Zu lange Absaetze werden an Satzgrenzen geteilt.
export function pageToSections(pageText, opts) {
  const o = opts || {};
  const max = o.max || MAX_SECTION;
  const raw = String(pageText == null ? '' : pageText).replace(/\r/g, '');
  let blocks = raw.split(/\n{2,}/).map(function (b) {
    return b.split('\n').map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean).join('\n');
  }).filter(function (b) { return b.replace(/\s+/g, '').length >= 40; });
  // Sehr lange Absaetze (manchmal ist eine ganze Seite ein Absatz) an
  // Satzgrenzen teilen.
  const parts = [];
  for (const b of blocks) {
    if (b.length <= max) { parts.push(b); continue; }
    let rest = b;
    while (rest.length > max) {
      let cut = rest.lastIndexOf('. ', max);
      if (cut < max * 0.5) cut = rest.lastIndexOf(' ', max);
      if (cut < max * 0.5) cut = max;
      parts.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1).trim();
    }
    if (rest.length >= 40) parts.push(rest);
  }
  // Wieder zusammensetzen, bis die Zielgroesse erreicht ist.
  const out = [];
  let cur = '';
  for (const p of parts) {
    if (cur && (cur.length + p.length + 2) > max) { out.push(cur); cur = p; }
    else cur = cur ? cur + '\n\n' + p : p;
  }
  if (cur.trim().length >= 40) out.push(cur);
  return out;
}

// Aus allen Seiten eines Dokuments die Abschnitte machen.
export function docToSections(pages, doc) {
  const out = [];
  for (let i = 0; i < pages.length; i++) {
    const secs = pageToSections(pages[i]);
    for (const x of secs) {
      const first = String(x).split('\n')[0].replace(/\s+/g, ' ').trim();
      out.push({
        t: first.length > 96 ? first.slice(0, 94) + '\u2026' : first,
        c: doc.label || doc.slug || '',
        p: String(i + 1),
        x: x,
        b: doc.label || doc.slug || ''
      });
    }
  }
  return out;
}

// Die fertige Datei fuer eine Domaene.
export function makeTextFile(dom, docs, opts) {
  const o = opts || {};
  const sections = [];
  const list = [];
  for (const d of docs) {
    list.push({ label: d.label, source: d.source || '', author: d.author || '', licence: d.licence || '', note: d.note || '', pages: (d.pages || []).length });
    for (const s of docToSections(d.pages || [], d)) { s.s = d.source || ''; sections.push(s); }
  }
  return {
    title: o.title || (dom + ' \u2014 textes des documents remis'),
    author: o.author || list.map(function (d) { return d.author || ''; }).filter(Boolean).join(' ; '),
    source: o.source || list.map(function (d) { return d.source || ''; }).filter(Boolean).join(' '),
    licence: o.licence || 'Reprise du texte des documents remis par le propri\u00e9taire, avec citation de la source. Droits des auteurs respectifs.',
    note: 'Runde 198 \u2014 texte int\u00e9gral, d\u00e9coup\u00e9 par page (' + list.length + ' document(s), ' + sections.length + ' sections). Lu par App.Corpus.',
    kind: 'texte',
    mode: 'texte',
    docs: list,
    sections: sections
  };
}
