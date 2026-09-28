# Der Bestand von Sofia — was sie wirklich vorliegen hat

> **Runde 274 — alle Pfade hier sind LOGISCHE Pfade.** Die Korpusdateien selbst liegen
> **ausserhalb des Generators** (gehostet auf `user.uploads.dev`), weil er sonst nicht mehr
> gespeichert werden konnte: `src/remote.json` (Korpora, Indizes) und `src/droit/remote.json`
> (Recht) geben die Übersetzung „Pfad -> Adresse", angewandt in `App.Core.loadJson` bzw.
> `App.DroitLookup._json`. Im Haus bleiben nur die Tabellen, die Module und die Doku.
> Ein neues Korpus gehört genau dorthin: hochladen, Eintrag in die passende Tabelle,
> Pfad im Code unverändert.

Diese Datei ist die Bauanleitung für genau das, was der Eigentümer verlangt hat:
**„Tu dois faire la même chose avec eux comme tu l'as fait avec le CESEDA."**
Für jedes Gesetz, jedes PDF und jeden Link, den er gibt — und für alle, die noch
kommen — wird der **echte Wortlaut** ins Haus geholt, durchsuchbar gemacht und
zitiert. Sofia antwortet dann aus diesem Bestand, nicht aus dem Modellgedächtnis.

Kurz: es gibt **zwei Schichten**.

| Schicht | Inhalt | Datei(en) | Leser im Code |
|---|---|---|---|
| **A — Gesetze** | die französischen Kodexe im amtlichen Wortlaut, jeder Artikel einzeln, mit Nummer, Weg und Fassungsdatum | `src/droit/<slug>/articles.json.gz` + `index.json.gz`, `src/droit/codes-index.json`, `src/droit/numbers-index.json.gz` | `App.DroitLookup`, `App.DroitMemo` |
| **B — Dokumente** | die Texte der Dokumente, die der Eigentümer gibt (Sexologie, Mathematik, Web, Anatomie, …), seitenweise zerlegt | `src/<domaene>/texte.json.gz`, registriert in `src/corpus-index.json` | `App.Corpus` |

Beides landet am Ende als **Block** im Prompt (`App.SourceGuard` sieht ihn, zählt
ihn zum „Bestand" und prüft die Antwort dagegen). Der Block sagt immer: *„Le
texte ci-dessous EST sous tes yeux… cite la phrase exacte et nomme le document et
la page."* Alles, was die Antwort daraus wörtlich übernimmt, wird zweifarbig
angezeigt (`App.SourceColor`).

---

## A — Gesetze (die 24 Kodexe)

Der amtliche Wortlaut kommt aus `https://codes.droit.org/payloads/<Nom du code>.xml`
(Spiegel von Légifrance/Dila, Feld `lastup`, Stand bis 2026-09). Es sind **90 101
Artikel in Kraft** über **24 Kodexe**.

Bauwerkzeug: **`src/droit/build-codes.mjs`** (reine Rechnung: XML → Artikel und
Index). Ablauf pro Kodex:

1. XML holen (aus dem Harness: `tools.fetch_url` + `fs.readFile`).
2. `parseCodeXML(xml)` → `{ articles: [{num, texte, etat, debut, fin}], … }`.
3. `makeFiles(...)` → `articles.json.gz` (Artikel + Text + Fassungsdatum) und
   `index.json.gz` (Nummer → Treffer).
4. gzip **ist Pflicht** (150 MB ungepackt → 20 MB gepackt; der Browser liest mit
   `DecompressionStream("gzip")`, siehe `App.DroitLookup._json`).

Die Zuordnung Frage → Kodex läuft **nicht** mehr über Pfade, sondern über
**Wörter**: jeder Kodex hat in `src/droit/codes-index.json` ein Feld `words`
(~20–68 Begriffe des Alltags). `App.DroitLookup.route(text)` normalisiert die
Frage und wählt den Kodex mit den meisten Treffern (`_wordHit`: exakt + Präfix ab
5 Buchstaben, Schwelle `bestSc >= 4`). **Neuen Kodex aufnehmen:** XML holen,
`build-codes.mjs` laufen lassen, Ergebnis nach `src/droit/<slug>/`, dann einen
Eintrag in `codes-index.json` (mit `nom`, `code`, `lastup`, `articles`, `abroges`,
`articlesFile`, `indexFile`, `words`, `notions`). `numbers-index.json.gz` danach
neu erzeugen (alle Nummern aller Kodexe → Kodex) — er hält `_loadLegal()` und
damit die Prüfung „diese Artikelnummer gibt es überhaupt".

---

## B — Dokumente (PDF, Text, Link)

Genau dieser Weg gilt **ab jetzt für jedes Dokument**, das der Eigentümer gibt.
Drei Schritte, zwei Bauwerkzeuge.

### B1. Seiten aus dem PDF lesen

Bauwerkzeug: **`src/docs/pdf-to-pages.mjs`**. PDF.js zerlegt eine Seite in
„items" (Textstücke mit Position, Breite, Höhe). Diese Datei setzt daraus wieder
lesbare Seiten zusammen: gleiche Höhe → eine Zeile, innerhalb der Zeile nach x
sortiert, **ein Leerzeichen nur bei einer echten Lücke** (Standard 1.2
Textkoordinaten), Zeilenumbruch bzw. Absatz nach dem Höhenunterschied.

> **Fallstrick, der schon zugeschlagen hat:** PDF.js trennt an **Ligaturen**
> (`fi`, `fl`) und an Schriftschnitten ohne echte Lücke. Wer zwischen *allen*
> Stücken ein Leerzeichen setzt, bekommt `dé fi nition`, `dif fi cile`,
> `ré fl exe` — 31 solcher Stellen in der ersten Sexologie-Fassung. Deshalb die
> lückenbasierte Regel. Prüfbefehl nach dem Lesen:
> ```js
> (text.match(/[A-Za-zÀ-ÿ]{1,6} (fi|fl) [A-Za-zÀ-ÿ]{1,6}/g) || []).length   // muss 0 sein
> ```

Ablauf im Harness (execute_js, Modul-Worker):

```js
const pdfjs = await import("https://esm.sh/pdfjs-dist@4.2.67/legacy/build/pdf.mjs");
pdfjs.GlobalWorkerOptions.workerPort = new Worker(
  URL.createObjectURL(new Blob(
    ['import "https://esm.sh/pdfjs-dist@4.2.67/legacy/build/pdf.worker.mjs";'],
    { type: "text/javascript" })), { type: "module" });

const p2p = await import(URL.createObjectURL(new Blob(
  [await fs.readTextFile("src/docs/pdf-to-pages.mjs")], { type: "text/javascript" })));

const raw = await fs.readFile("scratch/pdfs/<name>.pdf");
const doc = await pdfjs.getDocument({ data: raw.buffer, disableFontFace: true }).promise;
const pages = [];
for (let p = 1; p <= doc.numPages; p++) {
  const pg = await doc.getPage(p);
  pages.push(p2p.pageFromItems((await pg.getTextContent()).items));
}
```

Das PDF selbst vorher mit `tools.fetch_url` nach `scratch/pdfs/` holen (der
eigene `fetch` im Worker scheitert an CORS) — außer es ist ein lokaler Link, dann
`fs.readFile`.

### B2. Seiten → Abschnitte → Datei

Bauwerkzeug: **`src/docs/build-texts.mjs`** (reine Rechnung):

- `pageToSections(pageText)` — Absätze bleiben zusammen, bis `MAX_SECTION = 1500`
  Zeichen; zu lange Absätze werden an Satzgrenzen geteilt. Zu kurze (< 40
  Zeichen) fallen weg.
- `docToSections(pages, doc)` — alle Seiten eines Dokuments → Abschnitte
  `{ t: Titel, c/b: Dokument, p: Seite, x: Text }`.
- `makeTextFile(dom, docs, opts)` — die fertige Datei
  `{ title, author, source, licence, note, kind:"texte", mode:"texte",
  docs:[…], sections:[…] }`.

Dann **gzip** (Pflicht) und schreiben:

```js
const bt = await import(URL.createObjectURL(new Blob(
  [await fs.readTextFile("src/docs/build-texts.mjs")], { type: "text/javascript" })));
const file = bt.makeTextFile("sexo", docs, { title: "Sexologie — textes intégraux des documents remis" });
const gz = new Blob([JSON.stringify(file)]).stream().pipeThrough(new CompressionStream("gzip"));
await fs.writeFile("src/sexo/texte.json.gz", new Uint8Array(await new Response(gz).arrayBuffer()));
```

`docs` ist eine Liste `{ label, source, author, licence, note, pages }` — `pages`
ist das Array aus B1. **Label und Quelle immer mitgeben**, sie werden als
Fußnote im Block angezeigt (`[SEXOLOGIE — … REMIS]`, Dokument + Seite).

### B3. Registrieren

Ein Eintrag in **`src/corpus-index.json`** unter `textes.list`:
`domaine`, `label`, `file`, `docs`, `sections`, `sources`. Der Registrierung
folgt `App.Corpus.REGISTER` in `index.html` (4 Bereiche: sexo, maths, web,
anatomie; bei Bedarf erweitern).

> **Fallstrick:** das Feld `domaine` muss **exakt** dem Namen der Tür in
> `App.Corpus.MEMO` entsprechen (`sexo`, `maths`, `web`, `anatomie`, `python`,
> `dico`, `med`, `metier`, `droit`, `gbd`, `code`) — **nicht** dem Ordnernamen. Ein
> falscher Name, und der Bestand wird nie gefunden.

### B4. Kurse aus einem Wiki (Wikilivre) — Runde 199

Ein Programmierkurs ist ohne seine **Code-Blöcke** wertlos. Die TextExtrakt-API von
MediaWiki (`prop=extracts`) wirft genau die weg („Exemple :" und dann nichts). Deshalb
kommt eine Wiki-Seite als **gerendertes HTML** und wird selbst in Text verwandelt:

1. Seite holen: `https://<wiki>/w/api.php?action=parse&page=<Titel>&prop=text&format=json&formatversion=2&disableeditsection=1&disabletoc=1`
   (ganze Bücher gibt es als `…/Version imprimable` — ein Aufruf statt hundert).
2. `src/docs/wiki-to-text.mjs` (`wikiHtmlToText(html, parseHTML)`) in Text umwandeln;
   das DOM-Werkzeug (linkedom) wird hereingereicht:
   `const { parseHTML } = await import("https://esm.sh/linkedom@0.18.5");`
   Absätze, Überschriften, Listen, Tabellen und **`<pre>`-Codeblöcke** bleiben erhalten.
3. Das Buch-Menü (auf **jeder** Seite dasselbe Kapitelverzeichnis) steht in einem
   `<div style="…columns: 3 350px">` und wird entfernt — sonst wiederholt sich das
   Inhaltsverzeichnis hundertfach im Bestand.
4. Den Text an den Überschriften (`\n\n=+ …`) in Kapitel zerlegen, damit `p` im Block
   eine sinnvolle Nummer ist; dann wie in B2/B3 weiter (build-texts → gzip → Register).

Eine neue Tür braucht fünf Zeilen: die Mappe (`App.CodeMemo` mit `isCode`/`block`) neben
den anderen Mappen, ihren `block`-Aufruf bei den Nachschlageblättern (`systemInfo`),
`MEMO`/`ORDER`/`mint` in `App.Corpus` und die Mappenliste in `App.SourceGuard.init`.
**Wichtig:** das Tor muss zu den bestehenden Türen **disjunkt** sein (nicht Python, nicht
Web), sonst stehen zwei Kursblöcke in derselben Antwort. Genau dafür wurden `isPython`
und `isWeb` in Runde 199 um die Zeile „nennt er Java/JavaScript? dann nicht ich"
ergänzt — vorher bekam „c'est quoi une boucle for en Java ?" über „boucle for" einen
**Python**-Block.

---

## Wie `App.Corpus` das benutzt (index.html)

- `warmAll()` lädt beim Start alle Bestände (gzip → `DecompressionStream`),
  protokolliert `[Corpus] <dom>: echter Text bereit - N Abschnitte aus M Dokument(en)`.
- `init()` **umhüllt den `block` jeder Memo-Tür**: zuerst wird die Fiche gefragt
  (`orig`); liefert sie `''` (Tür geschlossen), bleibt es bei `''`; findet der
  Bestand sonst einen echten Text, wird **der Club aus dem Bestand** gerendert,
  nicht die Fiche.
- `pick()` sucht mit idf²+tf und Sätzen, `blockFor()` baut den Block mit dem
  Titel, der Quellenzeile und den Passagen `[rang n]` (Dokument, Seite,
  Zitatpflicht). `MAX = 3400` Zeichen, `MIN = 3.5`.
- Die **Datei-Vorablesung** (`App.Files`) wird übersprungen, wenn `mint()` einen
  Text findet, der die Frage deckt (`return ''`) — sonst zöge `Julianew.html`
  die Antwort in eine falsche Richtung.

---

## Sicherung: die Wache (`App.SourceGuard`)

- `add()` sammelt den Bestand (`_normAll`, `_wordsAll`, `_readArticles`) —
  Gesetze, Fiches und der Dokumenttext.
- `audit(answer, userText)` prüft nach der Antwort: erfundene Artikelnummern
  (`_loadLegal`), Zitate ohne Quelle, Artikelinhalt außerhalb des gelesenen
  Textes, Daten ohne Quelle — und bei Dokumenttext zusätzlich
  `mustQuote`. Fällt etwas durch, wird **einmal** nachgebessert
  (`MAX_REPAIRS = 1`) und der Prompt `corrective()` angehängt.
- **`mustQuote` ist bewusst weich:** gemessen an einem echten Zug war die gute,
  richtige Antwort eine Paraphrase (0,37 bzw. 0,26 ihrer Inhaltswörter stehen im
  Dokument). Ein harter Zitat-Zwang hätte sie verworfen und einen zweiten
  Modellaufruf (64 s) erzwungen, der ebenfalls nichts wörtlich zitierte. Jetzt
  fällt nur die Antwort durch, die das Dokument **ignoriert** (gemeinsamer
  Wortschatz < 20 % und keine Seitenzahl und kein 30-Zeichen-Stück wörtlich);
  kurze Antworten (< 15 Inhaltswörter) werden nicht geprüft.

---

## Prüfen (immer live, nie nur die Dateien)

1. `page_refresh`, dann müssen die `[Corpus] … echter Text bereit`-Zeilen die
   neuen Abschnittszahlen zeigen.
2. Leere Test-Session anlegen, echte Frage stellen, Antwort lesen, Session
   wieder löschen (`App.Data._removeSession(id)`).
3. Bei einer Rechtsfrage: routet der richtige Kodex? stand ein Artikel im Prompt?
   wurde er zitiert? Bei einer Dokumentfrage: stand der Dokumenttext im Prompt
   (`App.SourceGuard._material` mit `QU'IL T'A DONNE`)? Und **kein**
   `[SourceGuard] Antwort berichtigt` ohne Grund.
4. Keine Fehler in der Konsole, keine `perchanceErrors`.

---

## Regel für die Zukunft

> **Jeder Text, jeder Link und jedes PDF, das der Eigentümer gibt, wird so
> behandelt** — nicht zusammengefasst, sondern **wörtlich** ins Haus geholt
> (Schicht A oder B), durchsuchbar gemacht, mit Quelle und Seite, und muss in der
> Antwort zitiert werden können. Er will nicht, dass Sofia aus ihrer Erinnerung
> antwortet, sondern aus einer echten, aktuellen Datenbank. Genau das ist das
> Ziel von Sofia.

Offene Wunschliste des Eigentümers (sukzessive, sobald er die Dokumente gibt):
Python, Wörterbücher, Medikamente, weitere Rechtsgebiete.

**Nachtrag Runde 199 (Programmierkurse).** Der Eigentümer wollte, dass Sofia das
Programmieren lernt (Java, JavaScript, HTML, CSS, Python) — und dass „mein Script" (der
Bau dieser Anwendung) ihr als Integrations-Lehre dient. Er hat dafür `Julianew.html`
(seine Kopie dieser Anwendung, 1,6 MB, drei Fassungen) aus der Dokumentbibliothek
**gelöscht**: das war kein Nachschlagewerk, sondern sein Code zum Verbessern. Neu:
`src/code/` mit den Wikilivre-Kursen für **Java** und **JavaScript** (997 Abschnitte)
und dem selbst geschriebenen **Integrationskurs** `src/code/integration.md`; die Tür
`App.CodeMemo` öffnet auf Java/JavaScript/Programmieren/Integrieren. HTML/CSS und Python
behalten ihre Kurse (`src/web/`, `src/python/`). Rezept für weitere Wiki-Kurse: B4 oben.


---

## Runde 274 — die Korpora liegen ausserhalb (2026-09-24)

Der Eigentümer meldete zum zweiten Mal „Couldn't save the src files: upload timed out". `src/` war
nach Runde 273 noch 6,15 MB / 248 Dateien schwer. Seit Runde 274 gilt:

| Was | Wohin |
|---|---|
| die 137 Fiches der zwölf Bereiche | gehostet, Eintrag in `src/remote.json` |
| die Verzeichnis-Indizes (Vidal, Studyrama/Onisep, GBD-Blogs) | gehostet, Eintrag in `src/remote.json` |
| `src/corpus-index.json` (das Register der echten Texte) | bleibt im Haus, ist klein |
| die Recht-Korpora (49 Dateien) | gehostet seit Runde 273, Eintrag in `src/droit/remote.json` |
| die Rechts-Notions + `codes-index.json` | gehostet seit Runde 274, Eintrag in `src/droit/remote.json` |
| `docs/history.enc` (Projektgeschichte) | gehostet seit Runde 274, Adresse in `README.md` §1 |
| `brand/logo-source-gradient.png` (Logo-Quellbild) | gehostet seit Runde 274 |
| `docs/README-full.md.gz` (README §9–§171) | im Haus (gzip, 314 KB) + gehostete Zweitfassung |

Ergebnis: `src/` 6,15 -> 2,2 MB, 248 -> 90 Dateien. Alles im Betrieb geprüft (dieselben Zahlen in
allen zwölf Memorien, 24 Kodexe, „article 1240", 136 Blogs, fünf Textkorpora). Einzelheiten in
`README.md` §172 und im Geschichtsbündel (Abschnitt 1 der README).
