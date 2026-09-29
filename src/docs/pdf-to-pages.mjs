// PDF -> Seiten (reine Rechnung). Runde 198.
//
// Der Nutzer gibt PDFs; daraus wird der ECHTE Wortlaut ins Haus geholt
// (siehe src/docs/build-texts.mjs und src/CORPUS.md). PDF.js liefert den Text
// seitenweise als "items": kleine Stuecke mit Position (transform), Breite und
// Hoehe. Diese Datei setzt daraus wieder lesbare Seiten zusammen.
//
// Wichtig: PDF.js trennt an Ligaturen (fi, fl) und an Schriftschnitten. Die
// Teilstuecke liegen dann LUECKENLOS nebeneinander ("dif" | "fi" | "cultes").
// Wer zwischen allen Stuecken ein Leerzeichen setzt, bekommt "dif fi cultes" -
// genau dieser Fehler stand in der ersten Fassung (Sexologie: 31 Stellen wie
// "dé fi nition"). Deshalb wird hier ein Leerzeichen NUR bei einer echten
// Luecke eingefuegt (gemessen in Textkoordinaten, Standard 1.2), Zeilen und
// Absaetze nach dem Hoehenunterschied.

export const DEFAULTS = { gap: 1.2, lineTol: 2.5, paraGap: 1.7, keepEmpty: false };

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }

// Ein Item: { str, x, y, w, h } (y waechst nach OBEN, wie in PDF-Koordinaten).
function toItem(it) {
  const tr = it && it.transform ? it.transform : [1, 0, 0, 1, 0, 0];
  const x = num(tr[4]);
  const y = num(tr[5]);
  const w = num(it && it.width);
  const h = num((it && it.height) || tr[3]) || Math.abs(num(tr[3])) || 10;
  return { str: it && it.str != null ? String(it.str) : '', x: x, y: y, w: w, h: h };
}

// Eine Seite (Array von PDF.js-Items) -> ein String.
export function pageFromItems(items, opts) {
  const o = Object.assign({}, DEFAULTS, opts || {});
  const list = (items || []).map(toItem).filter(function (it) { return o.keepEmpty || it.str.length > 0; });
  if (!list.length) return '';
  // Zeilen bilden: gleiche Hoehe (y) -> eine Zeile, innerhalb der Zeile nach x.
  const lines = [];
  for (const it of list) {
    let line = null;
    for (const L of lines) {
      if (Math.abs(L.y - it.y) <= o.lineTol) { line = L; break; }
    }
    if (!line) { line = { y: it.y, h: it.h, items: [] }; lines.push(line); }
    line.items.push(it);
    if (it.h) line.h = Math.max(line.h || 0, it.h);
  }
  lines.sort(function (a, b) { return b.y - a.y; }); // von oben nach unten
  const out = [];
  let prevY = null, prevH = 0;
  for (const L of lines) {
    L.items.sort(function (a, b) { return a.x - b.x; });
    let text = '';
    let prevEnd = null;
    for (const it of L.items) {
      if (prevEnd != null && it.x - prevEnd > o.gap) text += ' ';
      text += it.str;
      prevEnd = it.x + it.w;
    }
    text = text.replace(/[ \t]+/g, ' ').replace(/ $/, '');
    if (!text.trim()) continue;
    if (prevY != null) {
      const dy = prevY - L.y;
      const para = dy > (Math.max(prevH, L.h, 10) * o.paraGap);
      out.push(para ? '\n\n' : '\n');
    }
    out.push(text);
    prevY = L.y; prevH = L.h;
  }
  return out.join('');
}

// Mehrere Seiten (Array von PDF.js textContent-Objekten `{items}`).
export function pagesFromTextContents(contents, opts) {
  return (contents || []).map(function (tc) { return pageFromItems(tc && tc.items, opts); });
}
