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

## A — Gesetze (die 78 Kodexe)

Der amtliche Wortlaut kommt aus `https://codes.droit.org/payloads/<Nom du code>.xml`
(Spiegel von Legifrance/Dila, Feld `lastup`, Stand bis 2026-09). Es sind **165 580 Artikel in
Kraft** über **alle 78 Kodexe**, die codes.droit.org anbietet — davon seit Runde 277 die 54
fehlenden (75 479 Artikel, 357 MB Rohtext, ~38 MB gepackt). Gehostet wird seit Runde 273/274:
die Tabelle `src/droit/remote.json` (165 Einträge) trägt den logischen Pfad → Adresse.

Bauwerkzeug: **`src/droit/build-codes.mjs`** (reine Rechnung: XML → Artikel und
Index). Ablauf pro Kodex:

1. XML holen (aus dem Harness: `tools.fetch_url` + `fs.readFile`).
2. `parseCodeXML(xml)` → `{ articles: [{num, texte, etat, debut, fin}], … }`.
3. `makeFiles(...)` → `articles.json.gz` (Artikel + Text + Fassungsdatum) und
   `index.json.gz` (Nummer → Treffer).
4. gzip **ist Pflicht** (der Browser liest mit `DecompressionStream("gzip")`, siehe
   `App.DroitLookup._json`); danach hochladen und den Tabelleneintrag schreiben.

Die Zuordnung Frage → Kodex läuft **nicht** über Pfade, sondern über
**Wörter**: jeder Kodex hat in `src/droit/codes-index.json` ein Feld `words`
(~20–68 Begriffe des Alltags). `App.DroitLookup.route(text)` normalisiert die
Frage und wählt den Kodex mit den meisten Treffern (`_wordHit`: exakt + Präfix ab
5 Buchstaben, Schwelle `bestSc >= 4`). Seit Runde 277 sind die `words` der 54 neuen Kodexe aus
**ihren eigenen Abschnittstiteln** erzeugt (häufig im Kodex, `df <= 6` im Bestand); die
Ausnahme-Kodexe (altes Recht, Mayotte, Neukaledonien, Marine, Pensionen, Domänen, Nationaldienst)
tragen **keine** `words` und sind nur über ihren Namen erreichbar.

**Neuen Kodex aufnehmen:** XML holen, `build-codes.mjs` laufen lassen, beide `.gz` hochladen,
Eintrag in `src/droit/remote.json`, dann einen Eintrag in `codes-index.json` (mit `nom`, `detect`,
`code`, `lastup`, `articlesFile`, `indexFile`, `words`, `notions`). **Danach zwei Karten neu
erzeugen** (sie hängen am ganzen Bestand): `numbers-index.json.gz` (alle Nummern aller Kodexe →
Kodex, hält `_loadLegal()`) und die Namensliste der Tür `isDroit`/`CODES` in `index.html`
(seit Runde 277 aus dem Register erzeugt, 153 Formen). Der Baum steht in Runde 277 des
Geschichts-Bündels (`src/docs/history.enc`, Adresse in README §1).

### A.1 — Der Wächter: alle 15 Tage auffrischen (Runde 283, 2026-09-27)

Der Eigentuemer: « tous les 15 jours il faut mettre les codes de legisfrance a jour dans ta base de
donnees ». Es gibt keinen Cron — was den Bestand bewachen kann, ist Sofia selbst, wenn eine Seite
offen ist. Zwei Stuecke in `index.html`:

- **`App.DroitFresh`** (der Wachposten): liest `https://codes.droit.org/` (eine Seite, ~75 KB) und
  vergleicht je Kodex `data-modif` mit unserem Pruefling. Dafuer traegt `src/droit/remote.json`
  (**v4**) unter `codes` 82 Eintraege: `nom`, `lastup` (unsere Fassung, aus dem `lastup` des Index),
  `seen` (was die Quelle beim letzten Relevé sagte), `enVigueur`, `abroges`. Die vier Vertraege
  (`source: "eur-lex"`) sind vom Wächter ausgenommen.
- **`App.DroitUpdate`** (die Auffrischung): XML neu holen, mit **demselben Werkzeug der Runde 277**
  bauen (`build-codes.mjs`, per Blob importiert), beide `.gz` mit `CompressionStream('gzip')` packen
  und per `root.uploadPlugin(blob, {expires: +10 Jahre})` ablegen, dann Tabelle und Register im
  Speicher ziehen und `_idx`/`_artMap`/`_artMeta`/`_planIdx` des Kodex leeren. Die neuen Adressen
  liegen im Browser (`sofia_droit_files_v1`, `sofia_droit_seen_v1`) und werden in
  `App.DroitLookup.remote()` ueber die gravierte Tabelle gelegt; `src/` bleibt die Referenz.

Regel: eine Pruefung alle sechs Stunden je Browser; eine Auffrischung erst ab `MIN_DAYS = 15` Tagen,
nur beim Eigentuemer (Modi `owner` und `preview` von `App.Access`), `MAX_PER_RUN = 4` Kodexe je
Durchgang. Zur
Hand laeuft der Auftrag « mets a jour les codes » vor dem Absenden der Frage; sein Befund und die
Frische-Zeile gehen ueber `takeNote()` in die Schlusspassage des Prompts (`droitFresh`, wie
`protonLate`/`conseilLate`) — im Mittelteil versinkt ein kurzer Auftrag. `runAll()` = alle 78
Kodexe (357 MB roh, ~40 MB abgelegt), dem Atelier vorbehalten. Nachgemessen 2026-09-27: 78 Kodexe
bei der Quelle, **0 geaendert**; Probelauf « Code de l'artisanat » (393 Artikel, Fassung
2025-12-11) in 38 s relu, gebaut, abgelegt, wieder gelesen.

---

## A2 — Die Vertraege der Union (Runde 278)

Dieselbe Form wie die Kodexe, andere Quelle: die **konsolidierten Fassungen** der Vertraege
stehen bei EUR-Lex als amtliches XHTML:

    https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:<CELEX>/TXT

(`12016E` = AEUV, `12016M` = EUV, `12012P` = Charta, `12016A` = Euratom.) EUR-Lex antwortet
gelegentlich mit **HTTP 202** (Warteschlange) — dann einfach nach ein paar Sekunden erneut holen.

Bauwerkzeug: **`src/droit/build-eu.mjs`** (`parseEurlex`, `makeEuFiles`, `tidyEu`; rein rechnend).
Es liest `<p class="ti-art">Article N</p>`, die Unterzeile `sti-art` (bei den Vertraegen
"(ex-article 81 TCE)", in der Charta die Ueberschrift des Artikels) und die Gliederung
`ti-section-1/2/3`. Zwei Regeln: `Article premier` = **1**, und das Lesen endet beim **ersten
wiederholten Artikel** — dort beginnen die Protokolle, die wieder bei "premier" anfangen.
`tidyEu` zieht die Zellentrenner der Aufzaehlungen ("a) | ...") zu einem Leerzeichen zusammen.

`makeEuFiles` erzeugt dieselben zwei Dateien wie bei den Kodexen, mit einem Unterschied: der
Index traegt **keine** Legifrance-Kennungen (`articles` bleibt leer, `paths` zaehlt die Artikel
auf). Deshalb akzeptieren `App.DroitLookup.resolveKey` und `status` seit Runde 278 den Plan als
Nachweis, dass es einen Artikel gibt; gelesen wird aus dem Korpus.

Bestand: AEUV 358, EUV 55, Charta 54, Euratom **141** Artikel in Kraft (Euratom ist alt: die
abrogierten Artikel fehlen, daher die Nummernsprünge). Sie stehen im **selben** Register
`codes-index.json` wie die Kodexe (82 Eintraege) und im **selben** `src/droit/remote.json`
(173 Dateien), also auch mit `detect`/ `words` fuer Tuer und Aiguillage.

**Was draussen bleibt**: Verordnungen, Richtlinien, das Amtsblatt — ein Strom aus zehntausenden
Rechtsakten. Die Tuer oeffnet sich fuer sie (Vokabular in `CODES`), in der Hausbibliothek liegen
nur die vier Grundtexte. Ein einzelner Akt kaeme mit derselben Recette herein (CELEX einsetzen).

## A3 — Die Rechtsprechung (Runde 279)

Zwei Quellen des **Conseil d'État**, beide **live** gelesen (nichts wird gehostet ausser den zwei
Fiches) — und beide liefern Dokumente **derselben Form**, damit sie in EINEN Prompt-Block gehen.

### A3.1 ArianeWeb (`App.JuriLookup`)

Die amtliche Rechtsprechungsbasis — eine **Auswahl** (Grundsatzurteile, Analysen, Schlussantraege):

    Suche:  https://www.conseil-etat.fr/xsearch?type=json&SkipCount=6&text.add=<q>&SourceStr4=<Fonds>…
    Lesen:  https://www.conseil-etat.fr/plugin?plugin=Service.downloadFilePagePlugin&Index=Ariane_Web&Id=<Id>

Zwei gemessene Regeln: **alle sieben Fonds namentlich** mitgeben (`AW_DCE`, `AW_DCA`, `AW_DTC`,
`AW_AJCE`, `AW_AJCA`, `AW_AJTC`, `AW_CRP`) — sonst rendert der Motor nur ~16 statt ~115 Dokumente;
und **zweimal** suchen: die Sachwoerter allein (die ganze Frage sortiert schlecht und bringt nur
Schlussantraege), dann die ganze Frage. Das HTML kommt in **ISO-8859-1**, die Schlussantraege sind
**PDF** (pdf.js bei Bedarf). Pro Sache nur ein Dokument: zuerst die Entscheidung, dann hoechstens
eine Ergaenzung.

### A3.2 Die offene Daten der Verwaltungsjustiz (`App.OpenDataLookup`)

Die Plattform https://opendata.justice-administrative.fr/ veroeffentlicht **alle** Entscheidungen
der Verwaltungsgerichte (seit 30.06.2022), der Berufungsgerichte (31.03.2022) und des Conseil
d'État (30.09.2021), in **XML**, als Monatsarchive je Gericht:

    https://opendata.justice-administrative.fr/DCE/2026/06/CE_202606.zip    (CE_AAAAMM)
    https://opendata.justice-administrative.fr/DCA/2026/07/CAA_202607.zip   (CAA_AAAAMM)
    https://opendata.justice-administrative.fr/DTA/2026/07/TA_202607.zip    (TA_AAAAMM)

Die Indexseiten `/DCE/`, `/DCA/`, `/DTA/` listen die Archive. Ein Dateiname im Archiv sagt alles:
`DTA_2617313_20260730.xml` = Entscheidung des Verwaltungsgerichts Paris vom 30. Juli 2026
(TA-Codes: `TA75` = Paris, `CAA78` = Versailles …). Die XML-Bausteine (`Identification`,
`Code_Juridiction`, `Numero_Dossier`, `Date_Lecture`, `Numero_ECLI`, `Code_Publication`,
`Texte_Integral` …) stehen in der Fiche `opendata.json.gz`.

Fuer das Lesen in der App gibt es einen **oeffentlichen Motor** (der von `/recherche`):

    Suche:  /recherche/api/Simple_Search/openData/<Anfrage>/<n>          (n = Trefferzahl)
    Lesen:  /recherche/api/testView/openData/unHighlight/<Datei>/<Code>/<Nummer>

Zwei Fallen, beide gemessen: der Motor sortiert nach **Datum** und macht ein **ODER** zwischen den
Woertern (« loyer impayé » → 20 294 = die Vereinigung), und eine **akzentuierte** Anfrage liefert den
ganzen Bestand (953 241). Deshalb: Woerter nackt und akzentfrei, und die **UND**-Anfrage
`+mot1 +mot2` (Lucene). Bleibt sie leer, wird jedes Wort einzeln gezaehlt und das **seltenste**
weitergelesen. Dann liest Sofia bis zu **vier** Kandidaten und sortiert nach **Dichte** (wie oft das
Schluesselwort im Text steht, akzentfrei) — vor der Einstufung A/B/C/D/Z und der Gerichtsstufe.

### A3.3 Was in der App zusammenkommt

- **Eine Stimme**: ArianeWeb zuerst; die Plattform, wenn dort nichts steht ODER wenn die Frage ein
  Verwaltungsgericht / einen Appellationshof nennt (dann ist ArianeWeb auf eine Entscheidung
  begrenzt). Der Block nennt die einzig gelesenen Entscheidungen.
- **Zwei Fiches** (gehostet, ueber `src/droit/remote.json`): `jurisprudence/notions.json.gz`
  (**164** Abschnitte) und `jurisprudence/opendata.json.gz` (**12** Abschnitte).
- **Lizenz**: Licence Ouverte 2.0 + CGU des Conseil d'État — Quellenangabe, Datum der letzten
  Aktualisierung, keine Verfaelschung, **Pseudonymisierung**, Verbot der Profilierung von
  Richtern und Geschaeftsstellen (siehe `src/droit/ATTRIBUTION.md`).
- **Nicht dabei**: **ConsiliaWeb** (Antworten des `SourceStr4=CW`, `Index=Consilia_Web`; die Dateien
  sind .doc/OLE und nicht einfach lesbar); **Blanco (1873)** — dafuer ist die Fiche da, ArianeWeb
  hat ihn nicht und die offenen Daten beginnen 2021/2022; die **ordentliche Gerichtsbarkeit**
  (Judilibre) ist ein eigener Bestand.

## A4 — Der Rat der Europaeischen Union (Runde 281)

Eine andere Art von Quelle als die Kodexe und die Rechtsprechung: kein Rechtstext, sondern das
**oeffentliche Register der Dokumente des Rates** — Noten, Vorschlaege, Mandate, Sitzungsprotokolle,
Mitteilungen. Alle Adressen liegen auf consilium.europa.eu:

    Uebersicht: https://www.consilium.europa.eu/fr/documents/public-register/
    Suche:      https://www.consilium.europa.eu/fr/documents/public-register/public-register-search/
    Zuletzt:    https://www.consilium.europa.eu/fr/documents/public-register/latest/
    PDF:        https://data.consilium.europa.eu/doc/document/<Kennung mit Bindestrichen>/<Sprache>/pdf

### A4.1 Die Suche (`App.ConsiliumLookup`)

Das **echte Suchformular** der Seite (`method="get"`, also alles als Query-Parameter) hat mehr
Felder, als die App zuerst benutzte. Die ganze Liste, an der Seite gemessen:

| Parameter | Form | Anmerkung |
|---|---|---|
| `OnlyPublicDocuments` | `true` | immer dabei |
| `WordsInSubject` | `residus pesticides` | **ALLE** Woerter muessen im Gegenstand stehen |
| `WordsInText` | `residus pesticides` | im Volltext; viel mehr Treffer, oft Rauschen |
| `DocumentNumber` | `10362/26` | die Kennung in der Kurzform des Registers |
| `InterinstitutionalFiles` | `2024/0123(COD)` | die interinstitutionelle Nummer |
| `SubjectMatters` | z. B. `AGRI`, `ENV`, `DELACT` | **426** Matieres-Codes (Mehrfachauswahl) |
| `DocumentTypes` | z. B. `CONCLUSIONS`, `PRESS RELEASE` | der Typ (genau EIN Wert) |
| `DateFrom` / `DateTo` | Datum | Datum des Dokuments |
| `MeetingDateFrom` / `MeetingDateTo` | Datum | Datum der Sitzung |
| `DocumentLanguage` | `FR`, `EN` … (`X` = mehrsprachig) | Sprache des Dokuments |
| `OrderBy` | `DOCUMENT_DATE DESC` / `ASC` | Sortierung |

Zwei Messungen, die den Umgang mit dem Register bestimmen:

- **`WordsInSubject` sucht per PRAEFIX.** « agricol » findet « agricole » UND « agricoles ». Ein
  Plural kann also eine Objektsuche zu Unrecht leer machen (« pesticides » gegen einen Gegenstand,
  der « pesticide » sagt) — deshalb schickt die App das Wort **ohne sein « s »/« x »**
  (`_stemW`, `_subj`).
- **`WordsInSubject` verlangt ALLE Woerter** — zwei gut gewaehlte gehen oft durch, drei fast nie
  (gemessen: « decide pesticides » → 0, « residus pesticides » → 74). Deshalb die Leiter der
  Versuche: **zwei Woerter im Gegenstand → das eine laengste Wort → Volltext**. Ein globales
  Zeitbudget (`DEADLINE_MS = 100000`) begrenzt den Zug (der Proxy braucht kalt bis ~58 s fuer eine
  Seite, warm ~15 ms). Die Woerter der Frage selbst (decide, adopte, approuve …) und die **Typwoerter**
  (conclusions, communique, presse, resultats, session, rapport, proposition …) stehen in der
  Stoppliste: sie sagen, WAS er wissen will, nicht WOMUEBER.
- **`DocumentTypes` zuerst, wenn die Frage einen Typ nennt.** « les conclusions du Conseil sur
  l'agriculture », « le communiqué de presse … », « les résultats de la session » — dann wird der
  offizielle Filter gesetzt (`App.ConsiliumLookup.TYPES` / `docType`), und zwar **vor** der
  Objektsuche: die Woerter allein braechten vor allem Uebermittlungsnoten. Zwei Versuche (Gegenstand
  + Typ, dann Volltext + Typ); ohne Sachwort bleibt ein reiner Typversuch
  (« die letzten Dokumente dieses Typs »). *Gemessen:* `DocumentTypes=CONCLUSIONS` allein → 297
  Dokumente; `WordsInSubject=agriculture&DocumentTypes=CONCLUSIONS` → 0 (die Rats-Schlussfolgerungen
  zum Thema tragen « agricole » im Gegenstand), `WordsInText=agriculture&…` → 18.
- **`OrderBy=DOCUMENT_DATE DESC`** steht in jeder Abfrage: die zwanzig zurueckgegebenen Fiches sind
  dann die zwanzig **neuesten**, nicht die « relevantesten ».
- Das Register (oder der Proxy) antwortet **zeitweise mit 403** auf ein und dieselbe Adresse; `_html`
  versucht nach ~0,9 s **ein zweites Mal**, und die Leiter steigt sonst weiter.


Gelesen wird die Seite mit DOMParser: die Gesamtzahl aus `.pr-meta .results`, die Treffer aus
`li.gsc-public-register__result-item` (Kennung und Art aus `strong.pa-download-document-title`,
Datum aus `header span.pull-right`, Objekt aus dem Linktext, die Tabellenzeilen als Felder
`objet` / `matières` / `émetteur` / `destinataire`), die Sprachen aus `a.link-pdf` (FR) und
`a.option-language-item`, und die Wendung « Aucun résultat dans la langue … », wenn es keine
franzoesische Fassung gibt. Der **Rang** (`_pick`): Sachwort im Gegenstand +3 je Wort, `ADD` −1,5
(Anhang), `COR` −1 (Berichtigung), Jahr ≥ 2024 +2 (≥ 2020 +1), PDF vorhanden +0,5 — dann nach
**Datum absteigend** (die Registerschreibweise jj/mm/aaaa wird dafuer in aaaammjj gedreht; eine
Zeichenketten-Sortierung war ein Fehler und ist behoben).

Gelesen werden hoechstens **zwei** Dokumente (`MAX_DOCS`), **12 Seiten** und **5000 Zeichen** je
Dokument, mit **pdf.js** — demselben Leser wie bei den Schlussantraegen (`App.JuriLookup._pdfLib()`
wird geteilt). Zuerst die franzoesische Fassung; gibt es sie nicht, die erste tatsaechlich
vorhandene Sprache, die im Block dann genannt wird.

### A4.2 Die Liste der zuletzt eingestellten Dokumente

« qu'a publié le Conseil récemment ? » oeffnet nicht die Suche, sondern die Seite `latest/`
(`WANT_LATEST`): acht Dokumente, **kein** PDF wird gelesen (es sind oft Verfahrensakte). Der Block
ist ein eigener (der Auftrag lautet: die Liste geben, Cote und Datum, nicht erklaeren, wo sie steht).

### A4.3 Die Fiche (`App.ConsiliumMemo`)

`src/droit/conseil/register.json.gz`, **29 Abschnitte auf einem Ordner**, gehostet und ueber
`src/droit/remote.json` (**176** Dateien) eingetragen. Sie traegt, was die Suche nicht suchen kann:
die Institution (Rat der EU / Europaeischer Rat / Europarat), das Register und seine drei
Dokumentarten (vorbereitende Gesetzgebungsdokumente, Sitzungsdokumente, Mitteilungen), die
**Grammatik einer Kennung** (ST, CM, PE, SN; INIT, ADD, REV, COR), die interinstitutionellen Codes
und die Codes « Matières », die **Archive** (1952 bis heute, oeffentlich nach 30 Jahren), **PRADO**
(die Vertragsdatenbank des Rates), die Vertraege und Abkommen, **Law Tracker**, den Zugang zu
Dokumenten (15 Arbeitstage, Verordnung 1049/2001) und die **rechtliche Tragweite**: was im Register
steht, bindet niemanden — nur die im Amtsblatt veroeffentlichten Rechtsakte binden.

### A4.4 Die Lehre dieser Runde: die Stellung im Prompt

Der Block stand zuerst dort, wo alle anderen stehen (bei ~30 000 Zeichen eines ~100 000 Zeichen
langen Prompts). Gemessen: das Modell **benutzte ihn nicht** — es antwortete aus seinem eigenen
Allgemeinwissen ueber Pestizide, oder es sagte, es habe kein Dokument gelesen, obwohl das Dokument
im Prompt stand. Mit dem Block allein (14 000 Zeichen) antwortete dasselbe Modell **genau** aus dem
Dokument. Der Block wird daher jetzt erst am Ende der Assemblierung angehaengt, **unmittelbar vor die
Conversation History** (`conseilLate`), gefolgt von einem kurzen Auftrag pro Zug in
`buildModeReminder(text)` (eigene Fassung fuer die Liste) und — als **allerletzte Worte** des
Kontexts, direkt vor der Frage — von `conseilTail` (« [REPONSE ATTENDUE] Commence ta réponse en
nommant la cote et la date du document que tu viens de lire … Ne t'appuie que sur ce qui est
reproduit ci-dessus »). Auch in Schlussstellung bleibt die Antwort **nicht deterministisch**: bei
Temperatur 0,7 antwortete derselbe Prompt einmal aus den Dokumenten, einmal aus der eigenen Kultur
— die Schlussstellung macht es nur viel wahrscheinlicher. Eine Kontrollprobe mit einem Kodex
(« article 1240 ») zeigt: dort funktioniert der fruehe Platz weiterhin — die anderen Lektoren
bleiben also, wie sie sind.

### A4.5 Grenzen

- **Nicht dabei**: die Archive vor 1999 (eigene Datenbank), PRADO und die Vertragsdatenbank (die
  Fiche erklaert sie, die Suche findet dort nicht), der Inhalt des Amtsblatts.
- **Bindet nicht**: der Block sagt es selbst — « les références figurant dans le registre ne sont
  pas juridiquement contraignantes ; seuls les actes législatifs publiés au Journal officiel sont
  contraignants ». Ein Kommissionsvorschlag ist keine Entscheidung des Rates, und Sofia muss das
  unterscheiden.

## A5 — Proton (`App.ProtonLookup`, `App.ProtonMemo`) (Runde 282)

Der Eigentuemer gab das HTML der **Anmeldeseite** `account.proton.me/login` — eine Seite ohne
Inhalt. Daraus wurde: die oeffentlichen Seiten von Proton lesen (das Hilfecenter durchsuchen) und
eine Fiche ueber die Dienste. **Anmelden kann sich der Generator nirgends** (kein Browser, keine
Cookies, Proxy ohne Sitzung) — und ein Passwort des Eigentuemers wird nie verlangt oder verarbeitet.

### A5.1 Die Suche im Hilfecenter (`App.ProtonLookup`)

- **Endpunkt des Index**: `https://q7lz4uqhr8-dsn.algolia.net/1/indexes/pme_production_searchable_posts/query`
  (Algolia). **App-Id** `Q7LZ4UQHR8`, **oeffentlicher Suchschluessel** (nur Lesen)
  `9bda42b54df6b6a8332b6435758e0022` — beide stehen im JavaScript der Seite selbst.
- **Koerper**: `{query, hitsPerPage: 6, filters: "target:support AND locale:fr", attributesToRetrieve:
  [title, link, description, type, date, categories, locale, content]}`. Kopfzeilen
  `X-Algolia-Application-Id` / `X-Algolia-API-Key`. Antwortfelder eines Treffers: `id`, `title`,
  `link` (`/support/<slug>` oder `/fr/support/<slug>`), `content` (Ausschnitt), `date`, `description`,
  `type` (mail, calendar, drive, pass, proton-wallet, meet, business, account, …), `target`
  (`support`), `categories` (Name + slug + link, der Brotkrumenpfad), `locale`, `record_index`,
  `objectID`. Der Index hat ~30 500 Datensaetze fuer `target:support` ueber alle Sprachen.
- **Abruf**: zuerst `fetch` direkt (die API erlaubt Webseiten, ~0,6 s); wenn das scheitert der
  **Proxy** `root.superFetch` als GET mit denselben Parametern. (Ein POST ueber den Proxy haengt —
  deswegen GET im Rueckfall.)
- **Die Fragen → Woerter** (`_stop`/`_kw`): es fliegen nur Fuellwoerter, Fragewoerter und der
  Markenname weg; « compte », « adresse », « prix », « gratuit », « alias », « domaine » bleiben.
- **Mehrere Fassungen** (`search`): 5 Woerter, 3, 2, dann das laengste Wort allein; franzoesisch
  zuerst, englisch nur, wenn franzoesisch **gar nichts** gibt (der Block sagt dann die Sprache).
- **Eigenes Sortieren** (`_rank`): Wort der Frage im **Titel** +5, in den **Rubriken** +2, im Text +1;
  Gleichstand: Zahl der Titelwoerter → Summe ihrer Laenge → Datum absteigend. Fichen mit
  `score < 5` (kein Wort im Titel) werden **gar nicht gelesen**: `failed: 'weak'` → offene Websuche.
- **Lesen** (`_page`/`_text`): `https://proton.me/support/fr/<slug>`, sonst ohne `fr/`; `<main>` ohne
  Skripte, Styles, Navigation, Formulare; Ueberschriften als `#`, Listen als `-`; ≤ 5000 Zeichen je
  Fiche, ≤ 2 Fichen je Frage; Ergebnis 10 Minuten zwischengespeichert.

### A5.2 Die Fiche (`App.ProtonMemo`)

`src/proton/fiche.json.gz` (**43 Abschnitte auf einem Ordner**, 11,4 KB gzip, 34,6 KB Klartext),
**direkt aus `src/`** geladen (`App.DroitLookup._json('src/proton/fiche.json.gz')`; kein Eintrag in
`src/droit/remote.json` — die Datei ist klein genug, um dauerhaft im Generator zu bleiben). Rubriken:
„Proton, l'entreprise" (4), „Les services" (11), „Le chiffrement" (4), „Adresses et alias" (2),
„Comptes et récupération" (4), „Sécurité" (4), „Abonnements" (7), „Migration et données" (2),
„Aide et bonnes pratiques" (3), „Confidentialité" (2). Jede Sektion nennt ihre Adresse
(`u`); `_closest` faengt allgemeine Fragen ab (« c'est quoi Proton ? » → „Proton en une phrase" +
„Les services : vue d'ensemble" + die Uebersicht).

### A5.3 Die Tuer und die Stellung im Prompt

- `isProton`: `PRODUCTS` (Dienst- und Formelnamen, `proton.me`, `pm.me`, `lumo`, `hide-my-email`,
  `easy switch`) oeffnet; `PHYS` (Atome, Noyau, Neutron, Electron, Physique, Chimie, Isotope …) und
  `PART` (« un/le/les proton(s) ») schliessen; sonst oeffnet « proton » allein. Die Tuer steht
  **vor** Med/Web/Droit/Juri.
- Bloecke in der **saillanten Schlussstellung**: `protonLate` (gelesene Fichen, dann die Fiche) +
  `protonTail` unmittelbar vor der Frage; ein Satz im saillanten Absatz; `App.Corpus.MEMO/ORDER/mint`
  (`proton: 'ProtonMemo'`) und `App.SourceGuard` (memos + looks) eingetragen.
- `wantsLookup` verlangt eine Frage oder einen Griff (comment, pourquoi, prix, activer, supprimer,
  connexion …) — « c'est quoi Proton ? » beantwortet die Fiche ohne Netz (dann greift die allgemeine
  Websuche, wie bei den anderen Fichen auch).

### A5.4 Grenzen

- **Kein Anmelden**: technisch unmoeglich (kein Browser, keine Cookies) — und ein Passwort gehoert
  nie in den Prompt, den Code oder eine oeffentliche Datei.
- Das Hilfecenter ist eine **Stichwortsuche**; Fragen muessen umgeschrieben werden, und nicht jede
  Frage hat dort eine Titel-Fiche (dann offene Websuche).
- Die Fiche ist eine **Nachzeichnung** oeffentlicher Seiten (kein Auszug); Preise, Quoten und
  Formelnamen aendern sich — Sofia nennt, was sie gelesen hat, mit Datum und Adresse.

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
