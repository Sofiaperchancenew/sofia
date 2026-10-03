# Die Wissenskarte von Sofia

> Was Sofia **wirklich** beherrscht: welcher Bestand existiert, wie er in den Prompt
> kommt, was davon live aus dem Netz gelesen wird — und wo die Grenzen liegen.
> Stand **2026-09-23**, `src/build.json` **v268**. Ergänzt `src/README.md` (Einstieg).
>
> **Achtung (2026-09-22):** Beim Anfügen der Runde-202-Notiz hat der Helfer in `src/README.md`
> und `scratch/history.md` die Abschnitte **§81–§85 (Runde 174–178), §99–§101 (Runde 192–194)
> und §104 (Runde 197)** überschrieben; §86–§98 und §102–§108 wurden aus den Einzelnotizen
> (`scratch/RUNDE-*.md`, `scratch/runde*.md`) wortgleich wiederhergestellt. Was wo verloren ging,
> steht im Verlust-Hinweis am Ende von §80 in `src/README.md`. Die App und alle `src/`-Daten
> sind unberührt.

---

## 1. Was diese Datei ist

Der Nutzer hat gefragt: « Zeig mir eine Architektur dessen, was sie als Themen wirklich
beherrscht. » Diese Datei ist die Antwort, nachgezählt aus den Dateien selbst (nicht aus
dem Gedächtnis). Sie wird bei jeder neuen Domäne fortgeschrieben.

Die Bauweise ist immer dieselbe: **Quelle holen → Fiche auf Französisch verdichten →
nach `src/<domäne>/` legen → in `index.html` verdrahten → live prüfen → dokumentieren.**
Es gibt drei Stufen: **Mappen** (stehende Nachschlageblätter), **Register** (Nummern- und
Titelverzeichnisse für die Vorleser) und **Vorleser** (lesen die echte Quelle erst im
Moment der Antwort).

---

## 2. Die Karte

```
index.html                        das einzige lebende Programm (alles JS hier)
│
├── WEICHE  (vor jeder Antwort, Prioritätskette)
│     maths → anciennes → langues → med → metier → gbd → droit → sexo → anatomie → web → dico → python
│     jede Tür = reguläre Ausdrücke (isMath, isMed, …)
│     Tür offen  →  EIN Block von 1 500–6 300 Zeichen, VOR die Historie gesetzt
│     Tür zu     →  kein Block, das Modell antwortet aus sich
│
├── MAPPEN  (stehende Fichen, src/<domäne>/*.json, Klartext)   → App.<X>Memo
│
├── TEXTBESTAND (echter Wortlaut der Gesetze UND der Dokumente, gzip)
│     App.DroitLookup (24 Kodexe, 90 101 Artikel) · App.Corpus (Dokumente)
│     umhüllt den block der elf Mappen: echter Text schlägt Fiche
│
├── REGISTER (Verzeichnisse, Klartext)                          → Vorleser laden sie
│
├── VORLESER (lesen die echte Quelle im Moment der Antwort)
│     App.DroitLookup · App.MedLookup · App.MetierLookup · App.GbdLookup
│     App.WebSearch · App.Verify · App.WebVision · App.Research
│
├── KOGNITION
│     Sitzungs-Zusammenfassung · MemCore · Consult · Inner · DeepMemory
│     · Vision (visuelles Gedächtnis) · Documents · Dictionary · 364 Sprachen
│
└── WELTEN UND WERKZEUGE (keine Mappen)
      991 Berufe / 22 Sektoren / 71 Länder · Schach komplett · JS- + Python-Interpreter
      · RPG, Mentor, Chaos (versiegelt) · Bild + Vision · Atelier / SelfCode / SelfScript
```

---

## 3. Die dreizehn Mappen

| Domäne | Modul | Ordner | Fichen | Abschnitte | Herkunft (Auswahl) |
| --- | --- | --- | ---: | ---: | --- |
| **Recht** | `App.DroitMemo` | `src/droit/` | 9 | **86** | codes.droit.org / Légifrance (**24 Kodexe**, **90 101 Artikel** im Wortlaut) + 7 selbst geschriebene Notions-Fichen |
| **Doktrin (GBD)** | `App.GbdMemo` | `src/gbd/` | 3 | **60** | Grande Bibliothèque du Droit (Barreau de Paris): die Fiche zur Bibliothek, die Landkarte ihrer Bestände, der Anruf der 136 juristischen Blogs |
| **Python** | `App.PythonMemo` | `src/python/` | 46 | **1 060** | Univ. Paris Cité (Fuchs/Poulain), *Un zeste de Python* (Zeste de Savoir), G. Swinnen (*Apprendre à programmer avec Python 3*), Karsdorp/van Gompel/Clérice, P. Buffat, courspython.com, S.-J. Djungu (IN2P3) |
| **Web (HTML/CSS)** | `App.WebMemo` | `src/web/` | 23 | **682** | apprendre-html-et-css.com (PUShAUNE), MDN (Mozilla), Kurs 2nde ICN (projet.eu.org), qkzk.xyz (NSI) |
| **Anatomie / Physiologie** | `App.AnatomyMemo` | `src/anatomy/` | 28 | **556** | anatomiehumaine.net, *Anatomie et Physiologie Humaines* (medicalistes.fr), Fiches IDE (IFSI) |
| **Mathematik** | `App.MathMemo` | `src/maths/` | 4 | **173** | Mémo TAGE 2 (ECRICOME), *Fondamentaux des mathématiques 1* (Lyon 1, Pujo-Menjouet), cmath.fr, maths-et-tiques.fr |
| **Sexologie (18+)** | `App.SexoMemo` | `src/sexo/` | 6 | **119** | RSSP (guide de premier recours 2023, guide de prescription 2021), CHU Nantes, CNGOF/UNF3S (item 40), EVRAS, *L'Art de dominer* (Easton/Hardy) |
| **Wörterbücher / Sprache** | `App.DicoMemo` | `src/dico/` | 9 | **102** | Lexilogos (X. Nègre), Musée virtuel des dictionnaires (J. Pruvost), Académie française, CNRTL/ATILF, Éditions Le Robert, Le Dictionnaire Visuel (QA International) |
| **Alte Sprachen und Schriften** | `App.AncientMemo` | `src/anciennes/` | 8 | **84** | selbst geschriebene Fichen: Griechisch, Latein, Sumerisch, ägyptische Hieroglyphen, Maya, Quechua, Nahuatl, andere Schriften (Runde 220) |
| **Sprachen der Welt** | `App.LanguesMemo` | `src/langues/` | 2 | **30** | Lexilogos (X. Nègre): ein Wörterbuch für jede Sprache (**270** Sprachen, regional bis weltweit), Sprachfamilien, Recht der Minderheitensprachen, Linguistik, Phonetik, Karten (Runde 221) |
| **Arzneimittel** | `App.MedMemo` | `src/medicaments/` | 3 | **55** | VIDAL, ANSM / HAS / BDPM / CRAT |
| **Berufe / Orientierung** | `App.MetierMemo` | `src/metiers/` | 2 | **29** | ONISEP (*Le dico des métiers*, Guide parents), DICo (Ministerium) |
| **Programmieren** | `App.CodeMemo` | `src/code/` | — | **997** | Wikilivre (fr.wikibooks.org): *Programmation Java* + *Programmation JavaScript*, dazu ein Integrationskurs (`src/code/integration.md`) |
| | | **Summe** | **143** | **4 033** | |

Über den Mappen liegt seit **Runde 198** der **Textbestand** (echter Wortlaut, gzip,
nicht verdichtet): die **24 Kodexe** (`src/droit/<slug>/articles.json.gz`, 90 101 Artikel,
20,1 MB) und die **Dokumente des Eigentümers** (`src/<domäne>/texte.json.gz`, **664
Abschnitte**: Sexologie 215, Mathematik 52, Web 112, Anatomie 310). Gelesen wird der
Bestand von `App.DroitLookup` (Gesetze) und `App.Corpus` (Dokumente); `App.Corpus`
**umhüllt den `block` der elf Mappen** — deckt der echte Text die Frage, wird **er**
vorgelegt statt der Fiche. Registriert in `src/corpus-index.json`; die Bauanleitung
(Ligaturen-Falle, gzip, Zuordnung `domaine` ↔ Tür) steht in `src/CORPUS.md`.

Jede Domäne hat ihr eigenes `ATTRIBUTION.md` (Werk, Autor, Adresse, Lizenz). Nichts ist
abgeschrieben: alle Abschnitte sind verdichtete, neu geschriebene Fichen.

**Altersgrenze (Runde 212/213):** Die **Sexologie**-Mappe (`App.SexoMemo` — mit der
BDSM-Fiche *L'Art de dominer* und dem Sexologie-Textbestand) ist **nur für
Erwachsene**. `App.Core.sexoAllowed()` gibt sie nur frei, wenn das jüngste
anwesende Alter **≥ 18** ist; sonst bleibt sie aus — Fiche, Textbestand (`App.Corpus`-
Domäne `sexo`) und eigene Suche. `App.Age.promptBlock()` sagt es in der
Minderjährigen- und in der Unbekannt-Fassung ausdrücklich: keine Sexologie- und keine
BDSM-Fiche öffnen, zitieren oder nachschlagen; über Körper, Pubertät und Sexualität
antwortet sie nur aus ruhigem, altersgerechtem Allgemeinwissen. Für die übrigen zehn
Domänen (Recht, Doktrin, Python, Web, Anatomie, Mathematik, Wörterbücher, Arzneimittel,
Berufe, Programmieren) gilt die Grenze **nicht**. Und der **Mentor** lehrt aus genau
diesen Fichen (siehe README §120): er zitiert den Bestand, der im Prompt steht, statt zu
raten — und nie eine Fiche, die nicht vor ihm liegt.

---

## 4. Die Register (Klartext, füttern die Vorleser)

| Datei | Inhalt |
| --- | --- |
| `src/droit/codes-index.json` | Register der **24 Kodexe**: Slug, Name, LEGITEXT-Kennung, `lastup`, Artikelzahlen, Pfade zu Index / Wortlaut, **`words`** (20–68 Alltagsbegriffe für das Routen), Notions |
| `src/droit/numbers-index.json.gz` (234 KB) | **68 661 Nummern** aller 24 Kodexe → Kodex («gibt es diese Nummer überhaupt?»), hinter `App.SourceGuard._loadLegal` |
| `src/droit/<slug>/articles.json.gz` + `index.json.gz` | **90 101 Artikel** im amtlichen Wortlaut (24 Kodexe), 20,1 MB gepackt statt ~150 MB; die abrogés der sieben alten Kodexe sind eingeschmolzen |
| `src/corpus-index.json` | Register des **Dokument-Textbestands** (5 Domänen, 1 686 Abschnitte) — `domaine` muss dem Türnamen in `App.Corpus.MEMO` entsprechen |
| `src/medicaments/vidal-index.json` (911 KB) | **8 344 Gammes, 15 252 Spezialitäten, 2 265 Substanzen** |
| `src/metiers/studyrama-index.json` (69 KB) | **1 497** Berufsfichen (Studyrama) |
| `src/metiers/onisep-metiers-index.json` (35 KB) | **569** Berufe (ONISEP) |
| `src/gbd/blogs.json` (76 KB) | **136** juristische Blogs (Name, Materien, Adresse) + 36 Materie-Listen |

---

## 5. Die Vorleser (nicht Fiche, sondern echte Quelle)

| Modul | Liest bei | Was es tut |
| --- | --- | --- |
| `App.DroitLookup` | **lokal** (`src/droit/<slug>/*.json.gz`) + `legifrance.gouv.fr` | wählt den Kodex über **`words`** (`route`, `_wordHit`: exakt + Präfix ab 5 Buchstaben, Schwelle 4), sucht die Nummer über `numbers-index.json.gz` und liest den **lokalen Wortlaut** (24 Kodexe); nur was lokal fehlt, wird bei Légifrance direkt gelesen. Der Block nennt Code, Fassung, Datum und Quelle. Gemessen 198: 15/15 Fragen richtig geroutet |
| `App.Corpus` | **lokal** (`src/<domäne>/texte.json.gz`) | der Dokument-Wortlaut: lädt die Bestände (gzip), sucht mit idf²+tf, baut den Block «[TITRE — LE TEXTE QU'IL T'A DONNE]» mit Dokument + Seite; **umhüllt den `block` der elf Mappen** (echter Text schlägt Fiche) und überspringt die Datei-Vorablesung, wenn er die Frage deckt |
| `App.CodeMemo` | **lokal** (`src/code/texte.json.gz`) | die Programmier-Tür (Runde 199): Java, JavaScript, Programmieren, Integrieren. Der Kurs (Wikilivre, Kapitel für Kapitel) tritt an die Stelle des Gerüsts. Das Tor ist **disjunkt** zu `isPython`/`isWeb` — sonst stünde bei „une boucle for en Java" ein Python-Block in der Antwort |
| `App.MedLookup` | `vidal.fr` (Gammes / Spécialités / Substanzen) | liest die Fiche selbst; **niemals** Dosierung, Verordnung, Diagnose, Austausch — verweist an Arzt / Apotheker, bei Vergiftung an Centre antipoison / 15 |
| `App.MetierLookup` | `studyrama.com` + ONISEP-Zeile | liest die Berufsfiche (Studien, Niveau) und ergänzt die ONISEP-Zeile |
| `App.GbdLookup` | `lagbd.org` (MediaWiki-API) | liest **Doktrin** (signierte Artikel, Urteilsbesprechungen) selbst: Suchleiter (alle Wörter → 3 → 2 → 1, weil die GBD mit UND sucht), Brotkrumen, Autor, Autor-Blog, Datum, Sachgebiet, Text; dazu der Anruf der 136 Blogs. Immer: Autor + Blog + Datum nennen und sagen, dass es Doktrin ist — nie als Regel ausgeben |
| `App.WebSearch` | 8 Motoren (Google, Bing, DuckDuckGo, Wikipédia, Ecosia, Naver, Lukol, Mojeek) | echte Websuche auf Marker-Wunsch, 8 s Zeitgrenze je Motor |
| `App.Verify` | mehrere Quellen | Quellen-Disziplin: keine Behauptung aus dem Gedächtnis gegen eine echte Quelle |
| `App.WebVision` | Bildsuche im Netz | sucht Bilder, zeigt sie als Karte |
| `App.Research` | `NET_ALLOWED_HOSTS` | stiller Hintergrund-Abruf (Marker-Protokoll) |

**Reihenfolge im Zweifel:** eine Mappe zuerst; wenn die Mappe die Frage nicht deckt
(`needsLookup`), geht der Vorleser los; erst wenn der scheitert, die offene Websuche.

---

## 6. Die Weiche — eine Domäne pro Zug

Kette in `index.html` (`App.Core.sendMessage`), feste Priorität:

```
1 maths (nur wenn needsLookup)   6 sexo (nur wenn needsLookup)
2 med      → MedLookup           7 anatomie
3 metier   → MetierLookup        8 web
4 gbd      → GbdLookup           9 dico
5 droit    → DroitLookup        10 python
```

- Jede Tür ist eine Liste regulärer Ausdrücke (`isMath`, `isMed`, `isMetier`, `isGbd`,
  `isDroit`, `isSexo`, `isAnatomy`, `isWeb`, `isDico`, `isPython`).
- Die erste offene Tür gewinnt; **nur eine** Mappe liefert pro Antwort einen Block.
- `isMetier` hat eine Ausschlussliste (Arzneimittel, Python, HTML/CSS, Anatomie,
  Sexologie), `isDroit` prüft einen genannten Code **vor** seiner Ausschlussliste —
  sonst würde « l'article 9 du code civil » an einem Wort wie *ordonnance* scheitern.
- `isGbd` steht **vor** `isDroit`: was die Grande Bibliothèque du Droit beisteuert, ist
  **Doktrin** (signierte Analyse), nicht der Gesetzestext. Sein Tor: die GBD beim Namen
  genannt; **Blog + Rechtsgebiet**; **Doktrin** (oder Kommentar/Chronik/Urteilsbesprechung)
  mit einem Rechtswort **oder** einer echten Suchbitte. „quel blog littéraire lire ?“
  öffnet es **nicht**. Und: liest eine Zivilrechts-Frage **keinen** Artikel (keine Nummer
  genannt oder Légifrance stumm), fragt Sofia **zuerst die GBD nach Doktrin**, dann erst
  das offene Web.
- Der Block wird seit **Runde 174** vor `Conversation History:` gesetzt (die letzte Zeile
  vor der Antwort bleibt die Frage des Nutzers).

---

## 7. Kognition (keine Mappen, aber Wissen)

| Baustein | Was er hält |
| --- | --- |
| Sitzungs-Zusammenfassung | alle 10 Nachrichten eine Zusammenfassung (Gedächtnis je Gespräch) |
| `App.MemStruct` / MemCore | **34 Knoten**, Erzählketten, Episoden, Fakten; passende Erinnerung wird zur Frage verstärkt |
| `App.Consult` | **16** gespeicherte Konsultationen (auch als Selbst-Patch) |
| `App.Inner` | inneres Journal des Kernmodells (steht bei jeder Antwort im Prompt) |
| `App.DeepMemory` | Abruf über den Verlauf hinaus |
| `App.Vision` | visuelles Gedächtnis (gelernte Objekte, CLIP-Erkennung) |
| `App.Documents` | Bibliothek hochgeladener Dateien (Inhalt steht im Prompt) |
| `App.Dictionary` | Definition, Anreicherung, Wortkandidaten |
| **`App.SourceGuard`** | **Quellenwache** (Runde 176): sammelt, was in diesem Zug wirklich gelesen wurde (Mappen-Abschnitte, Légifrance-Artikel, VIDAL-/Studyrama-Fichen), prüft die fertige Antwort auf erfundene Artikelnummern, Daten und Zitate und lässt höchstens einmal nachbessern — sonst hängt sie den echten Wortlaut als Quellenhinweis an |
| Sprachen | 364 Sprachen (Raster am Start + Auswahllisten); Oberfläche in 5 (fr/de/en/es/it), der Rest zur Laufzeit übersetzt; Sprachbefehl in jede der 364 (Kürzel ungekürzt, Runde 207); Erkennung braucht 0,95 |

---

## 8. Form einer Fiche

```json
{ "source": "https://…", "url": "https://…", "title": "…", "author": "…",
  "licence": "…", "note": "…", "chapters": ["…"],
  "sections": [ { "t": "Titel", "c": "Kapitel", "p": 12, "x": "verdichteter Text" } ] }
```

`t` wird beim Suchen stärker gewichtet als `x`; `p` (Seite) wird zitiert; `b`/`k` setzt das
Modul beim Laden (Werk, Art: `fiche` / `cours` / `articles` / `plan`).

---

## 9. Geprüft (live, 2026-09-22)

Zehn repräsentative Fragen durch die Weiche geschickt — jede öffnete die richtige Domäne,
**kein** Quertreffer, eine Frage ohne Thema öffnete **nichts**:

| Frage | öffnet | Blocklänge |
| --- | --- | ---: |
| « que dit l'article L131-1 du code de l'éducation ? » | droit | 2 809 |
| « quelle est la durée de la garde à vue ? » | droit | 3 750 |
| « la doctrine sur la rupture conventionnelle ? » (Runde 178) | gbd | 4 996 |
| « quelle est la posologie du Doliprane chez l'adulte ? » | med | 3 903 |
| « quel diplôme pour devenir kinésithérapeute ? » | metier | 3 419 |
| « comment écrire une boucle for en Python ? » | python | 5 638 |
| « comment centrer une div en CSS avec flexbox ? » | web | 1 557 |
| « comment simplifier la fraction 12/18 ? » | maths | 3 519 |
| « quel nerf innerve le muscle deltoïde ? » | anatomie | 5 034 |
| « qu'est-ce que la dyspareunie ? » | sexo | 4 660 |
| « quelle est l'étymologie du mot travail ? » | dico | 6 192 |
| « quel temps fait-il à Paris ? » | — | 0 |

Alle Mappen laden: Droit 1 746 · Python 1 060 · Web 682 · Anatomie 526 · Mathematik 173 ·
Sexologie 119 · Wörterbücher 102 · **Doktrin (GBD) 60** · Arzneimittel 55 · Berufe 29 Abschnitte.

---

## 10. Ehrliche Bilanz (der Nutzer hat ausdrücklich danach gefragt)

**Nützlich und richtig gebaut — ja.** Die Quellen sind echt und nachprüfbar (Légifrance,
MDN, VIDAL, ONISEP, CNRTL, Le Robert, IFSI-Kurse, Fachkurse), alles ist verdichtet und neu
geschrieben statt kopiert, jede Domäne nennt Autor, Adresse und Lizenz, und die Weiche
arbeitet fehlerfrei: 10/10 ohne Quertreffer, eine themenlose Frage öffnet nichts. Für
„Woran erkenne ich das?“ und „Wie geht man vor?“ sind die Mappen genau das Richtige — sie
geben **Repères** (Begriffe, Kriterien, Methode), nicht bloß Text.

**Was sie noch nicht liefert — die Lieferung, nicht die Datenbank.** Gemessen am selben
Tag: der Block landet bei etwa einem Drittel eines **116 000–127 000 Zeichen** langen
Prompts. Bei kurzem Prompt benutzt das Modell den Block richtig (an der Légifrance-Fiche
geprüft), im großen Prompt übergeht es ihn und erfindet Artikelnummern. Der Bestand ist
also nicht das Problem — **die Prompt-Masse** ist es.

**Drei Beobachtungen zum Weiterdenken.**
1. **Wiederholung kostet Platz.** Anatomie, Sexologie und Arzneimittel überschneiden sich
   (Körper, Terminologie, Prävention), Mathematik und Python ebenso (Zahlen, Typen,
   Operatoren). 4 582 Abschnitte sind viel; jede Überschneidung zahlt Miete im Prompt.
2. **Für „was steht im Gesetz?“ schlägt der Vorleser die Mappe** — Recht und Medizin
   ändern sich. Für „wie geht man vor?“ schlägt die Mappe den Vorleser. Beides ist nötig,
   aber sie sollten sich nicht doppeln.
3. **Die Fiche ist der Repères-Träger, nicht das Orakel.** Wenn eine Fiche die Frage nicht
   deckt, ist „ich habe dazu keine Fiche“ eine gute Antwort — erfunden wird nichts.

**Priorität, wenn es weitergehen soll:** (1) Prompt-Diät und Deckel je Block
(z. B. höchstens 2 000 Zeichen), (2) Protokoll-Blöcke nur im jeweiligen Modus,
(3) danach neue Domänen — die Methode selbst ist bewiesen und trägt.

**Nachtrag Runde 176 — die Quellenwache.** Seit dem 22.09.2026 wird nichts unbesehen
veröffentlicht: `App.SourceGuard` sammelt, was in diesem Zug **wirklich** gelesen wurde, und
prüft die fertige Antwort auf erfundene Artikelnummern, erfundene Daten und Zitate ohne
Quelle; eine falsche „X dispose que …“-Klausel fällt ebenfalls auf. Höchstens **ein**
Nachbesserungs-Pass mit dem echten Wortlaut daneben; sonst steht der echte Text als
Quellenhinweis unter der Antwort. Ohne Bestand in der Hand tut die Wache nichts. Was sie
**nicht** kann: eine glatt umformulierte, sachlich falsche Definition ohne Anführungszeichen
und ohne „dispose que“. Dagegen hilft nur die Prompt-Diät — der Bestand ist gut, er muss
nur gelesen werden (§83 im README).

**Nachtrag Runde 177 — man sieht jetzt, woher jeder Satz kommt.** `App.SourceColor` färbt
die Antwort zweifarbig: **hellblau**, was wörtlich oder fast wörtlich aus dem Bestand dieses
Zuges stammt (Mappen-Abschnitte und die live gelesenen Fichen), **weiß**, was ihre eigene
Formulierung ist (eigene Stimme, Meinung, Beispiele, Ratschläge). Grundlage ist genau das
Material der Quellenwache — es wird also nichts behauptet, was nicht in diesem Zug wirklich
vorlag. Die Farbe ist reine Anzeige: gespeichert wird nur die Wortspanne, der Text bleibt
roh. Unter der Antwort steht bei Bedarf eine leise Legende. Damit ist die ehrliche Bilanz
(siehe unten) auch **sichtbar**: was sie nur überflogen hat, kann nicht blau werden
(§84 im README).

**Nachtrag Runde 178 — die Doktrin kommt dazu.** Seit dem 22.09.2026 liest Sofia auch die
**Grande Bibliothèque du Droit**, die freie Bibliothek des Barreau de Paris: signierte
Artikel, Urteilsbesprechungen, Aufsätze. Das ist die zehnte Mappe (`src/gbd/`, 3 Fichen,
60 Abschnitte: die Bibliothek selbst, die Landkarte ihrer Bestände, der Anruf der **136
juristischen Blogs**) und ein vierter Vorleser (`App.GbdLookup`), der den Artikel **selbst**
liest — Titel, Autor, Autor-Blog, Datum und Sachgebiet in der Kopfzeile des Blocks. Die
Regel, die in beiden Blöcken steht: **Doktrin ist nicht Gesetz** — Autor und Blog nennen,
Datum nennen, sagen *dass* es eine Analyse ist, und für den geltenden Wortlaut bleibt
Légifrance. Das Tor `isGbd` steht **vor** dem Zivilrecht; und eine Zivilrechts-Frage, die
**keinen** Artikel liest, fragt jetzt zuerst die GBD nach Doktrin. Das live Gelesene ist
**Bestand der Quellenwache** — es zählt für die zweifarbige Antwort. Zwei Messungen aus
dieser Runde, die man kennen sollte: die GBD sucht mit **UND** („commentaire arret image
influenceurs“ → 0 Treffer, „image influenceurs“ → 11), deshalb die Suchleiter; und die
Blog-Liste einer Materie ist **3 272 Zeichen** lang, weshalb `App.GbdMemo.MAX` auf **5 600**
steht — mit 4 200 fiel sie aus dem Block, und das Modell erfand Blog-Namen. Genau das ist
auch die ehrliche Grenze dieser Runde: das Demo-Modell im Editor nennt in der Blogfrage
trotz der exakten Liste (Name + Adresse im Prompt, verboten zu erfinden) Namen aus seinem
eigenen Gedächtnis. Die Kette liefert die richtigen Daten — ob das Modell sie benutzt, hängt
am Modell (dieselbe Beobachtung wie in Abschnitt 10: die Prompt-Masse). (§85 im README)

**Nachtrag Runde 198 — der echte Wortlaut statt der Verdichtung.** Der Nutzer hat gesagt:
« tu dois faire la même chose avec eux comme tu l'as fait avec le CESEDA … pour que Sofia
apprenne les choses avec une vraie base de données actualisée, ce but ultime de Sofia ».
Seit dem 22.09.2026 liegt deshalb nicht mehr nur die *Fiche* im Haus, sondern der
**Wortlaut**: **24 Kodexe** (90 101 Artikel, `codes.droit.org`, gzip) und die **Dokumente
des Eigentümers** (664 Abschnitte, `App.Corpus`). Die Fiche bleibt, aber sie ist jetzt der
**Rückfall**: deckt der echte Text die Frage, wird **er** vorgelegt, mit Quelle und Seite
und mit Zitatpflicht. Zwei Dinge, die man kennen sollte: (1) das **Routen** der Rechtsfrage
geht nicht mehr über Plan-Pfade, sondern über **`words`** je Kodex (15/15 richtig), und
`DroitMemo.SOURCES` ist von 1 746 auf **86** Abschnitte geschrumpft — die 1 660 alten
Code-civil-Plan-Abschnitte waren der Grund, warum der Block bei „mur mitoyen“ den Code
pénal vorlegte. (2) **`mustQuote`** (Dokumenttext) ist bewusst **weich**: gemessen war die
gute Antwort eine Paraphrase (0,26–0,37 gemeinsamer Wortschatz), ein harter Zitat-Zwang
verwarf sie und erzwang einen zweiten Aufruf (64 s) ohne Nutzen. Geprüft wird jetzt nur
noch, ob die Antwort das Dokument **ignoriert**. Das Rezept für jedes künftige Dokument
steht in **`src/CORPUS.md`** — inklusive der Ligaturen-Falle von PDF.js (`dé fi nition`),
die 31 Stellen in der ersten Sexologie-Fassung verdarb. (§105 im README)

**Nachtrag Runde 199 — sie lernt programmieren.** Der Eigentümer hat `Julianew.html`
(seine Kopie dieser Anwendung, drei Fassungen in der Dokumentbibliothek) **gelöscht** —
das war sein Code zum Verbessern, keine Nachschlage-Quelle, und Sofia hatte gesagt, sie
könne das nicht. Stattdessen lernt sie jetzt aus **Kursen**: `src/code/` hält die
Wikilivre-Kurse **Programmation Java** und **Programmation JavaScript** (997 Abschnitte,
CC BY-SA 4.0 / GFDL) plus einen selbst geschriebenen **Integrationskurs**
(`src/code/integration.md`: HTML beschreibt, CSS habillt, JavaScript agiert; die fünf
DOM-Gesten; Java gegen JavaScript; die Methode, eine Funktion in eine bestehende
Anwendung einzubauen). Die Tür `App.CodeMemo` öffnet auf Java, JavaScript, Programmieren
und Integrieren; HTML/CSS und Python behalten ihre Kurse. Zwei Lehren aus dieser Runde:
(1) ein Programmierkurs ohne **Code-Blöcke** ist wertlos — die TextExtrakt-API von
MediaWiki wirft genau die weg, deshalb wird das gerenderte HTML selbst in Text verwandelt
(`src/docs/wiki-to-text.mjs`); (2) die Tore müssen **disjunkt** sein — „c'est quoi une
boucle for en Java ?" traf über „boucle for" das Python-Tor und bekam einen Python-Block,
seit Runde 199 fragen `isPython` und `isWeb` zuerst „nennt er Java/JavaScript?". (§106 im
README)

**Nachtrag Runde 200 — die zwei Farben zählen jetzt auch das, was sie im Netz liest.**
Der Nutzer: « Elle doit cité les articles lois texte de référence de cuisine et autre en
bleu et sa réfléxion en blanc elle n'a jamais su le faire ». Die Färbung (Runde 177) kannte
nur die Mappen und Fichen — eine Antwort über die **Werke der Küche** blieb deshalb ganz
weiß, weil sie sie im **Web** gefunden hatte (live nachgemessen: die Suche lief, die Antwort
nannte NF EN 16 282, `paint` gab `[]`). Jetzt zählt alles, was in diesem Zug vor ihren Augen
lag (Suchtreffer, geprüfte Quellen, Seitentext, vorgelesene Dateien, Nachschlagewerke des
Berufs); die Quellenwache bleibt unberührt. Blau werden: die Zitatzeile mit Artikelnummer
oder Norm aus dem Bestand, die Nachbildung mit hoher Deckung (auch in ihrer Stimme),
übernommene Zahlen; weiß bleiben ihre Meinungssätze und alles, was der Bestand nicht kennt —
ein **erfundenes** «…»-Zitat färbt nie. (§107 im README)

**Nachtrag Runde 201 — die Präsentation ist jetzt ehrlich.** Der Nutzer hat gefragt, ob die
Behauptungen in der Anzeige stimmen: « on a pas la puissance ni la programmation de gemini ni
de chat gpt … alors nos affirmations dans la presentation sont erronées ». Er hat recht: der
Textmotor ist Perchances `ai-text-plugin`, nicht unser Modell — « Exceptionally intelligent »
und « You know Gemini. You know ChatGPT. » waren nicht belegbar und sind **entfernt**. Die
Anzeige sagt jetzt, was hier wirklich gebaut ist (ein Wesen, das **liest** statt zu raten, und
sagt, wenn es etwas nicht prüfen konnte) und nennt die Grenze selbst. Der ehrliche Weg zu mehr
Kraft steht ohnehin schon in der Anzeige und ist echt: **eigener API-Schlüssel** (OpenAI,
Anthropic, Gemini, Groq, Mistral, HF, NVIDIA, jeder OpenAI-kompatible Endpunkt). (§108 im
README)

**Nachtrag Runde 202 — Sofia ist jetzt aus fremdem Code aufrufbar.** Der Nutzer: « on a besoin de
toi dans nos script et programme en temps réel et tu refuses de t'y intégrer, tu as ta feneêtre et
tu y restes ». Zwei Antworten, beide nötig. Erstens, ohne Ausrede: der **Helfer** ist ein Agent im
Editor und bleibt es — kein Programm kann ihn aufrufen; das ist die Bauart des Werkzeugs, nicht
eine Verweigerung. Zweitens, und das war ein echter Mangel: **Sofia selbst** hatte keinen Aufrufweg
nach außen; jede Antwort endete im Chatfenster. Neu ist `window.SofiaAPI` in `index.html`
(Version 1.0): `ask(text, opts)` (ihre echte Stimme, `onChunk` zum Mitschreiben, `system` für
fremde Anweisungen, `key` für eigene Gesprächsfäden), `code(auftrag, {file, code})` — sie arbeitet
**am Skript des Nutzers** und gibt die geänderte Datei zurück —, `persona()` (ihr wörtlicher
Systemprompt, 88 024 Zeichen, für eigene SDKs), `history`, `thread`/`forget`, Ereignisse
(`chunk`/`done`/`error`), eine `<iframe>`+`postMessage`-Tür für eine zweite Seite (begrenzbar über
`SofiaAPI.trusted`) und `SofiaAPI.local(true)` als Brücke zu **eigenen Programmen** über
`127.0.0.1` (standardmäßig aus, nur localhost, kein Konto, kein Schlüssel). Alles läuft über
`App.Core.generateText` und damit durch dasselbe Zugangsschloss wie der Chat; ein fremder Aufruf
arbeitet auf einer **Kopie** des Verlaufs und lässt die Sitzungen des Nutzers unberührt. Die Grenze
steht offen im Text: es muss ein Tab mit Sofia offen sein — das Modell antwortet in **seinem**
Browser, nicht auf einem Server. Anleitung auf Französisch mit lauffähigen Beispielen (HTML,
iframe, Python, Node): `src/code/api.md`. Geprüft: Namensfrage → « Je m'appelle Sofia. » (10,1 s,
französisch), `code` → `hello.js` mit genau einer neuen Zeile (1,2 s), Faden → « Ton projet
s'appelle Zed. », `postMessage` → 101 `chunk` + `done` = « Oui. », fremde Herkunft mit `trusted`
unbeantwortet, lokale Brücke gegen einen gestellten Server → `answer` = « Certainement. »,
`http://exemple.fr` abgelehnt. (§109 im README)

Nachtrag (Runde 203, §110): der **lokale Steg** ist gebaut - `src/bridge/sofia_pond.py`
(Python 3.8+, nur Standardbibliothek) und `src/bridge/sofia_pond.mjs` (Node 18+), jede
Datei Server *und* Client. Der Steg fragt den Tab per Long-Poll ab (`GET /next`, 20 s),
nimmt Morceaux (`POST /chunk`) und Antwort (`POST /answer`) entgegen und bietet nach
aussen `POST /ask` sowie `POST /v1/chat/completions` (OpenAI-kompatibel, SSE; Faden im
Modellnamen `sofia@faden`). `index.html` (`lbTick`) kennt jetzt `opts.method`: `ask`,
`code`, `persona` (ihr Wortlaut) und `history` - was die Bildschirm-Konsole kann, kann
jetzt auch ein fremdes Programm. Anleitung: `src/bridge/README.md` und
`src/code/api.md` §4. Noch offen: gemeinsames Jeton, Verlauf und Beispiel-Erzeuger in
der Konsole, Journal-Pruefung.

---

## 13. Nachtrag (Runde 204): sie lernt von sich aus im Netz

Wunsch: « oui pour aller sur le net et apprendre et sauvegarder elle même ce qu'elle apprend sur
internet ». Neu: `src/weblearn.js` (Runde 204, siehe `src/README.md` §111) – damit gibt es eine
**vierte** Art von Wissen neben Mappen, Registern und Vorlesern:

- **Eigenes Wissen aus dem Netz.** In einem Takt (Default 30 Min, höchstens 12 Fiches/Tag) sucht
  sie zu EINEM Thema über die Engines der App, liest bis zu zwei echte Seiten
  (`root.superFetch`, mit Relevanzprüfung: unter 400 Zeichen oder ohne Themenwort fällt die Seite
  raus) und schreibt daraus eine Fiche auf Französisch: was gesichert ist, was strittig ist,
  welche Quelle was sagt. Die Quellennummern werden beim Speichern zu Hostnamen.
- **Ort.** IndexedDB `enya_weblearn_v1` im Browser des Nutzers (Deckel 300 Fiches / 1,5 Mio
  Zeichen). Sie kommt über `App.WebLearn.block(userText)` in den Prompt, wenn sie zur Nachricht
  passt (live: 1 574 Zeichen bei passender Frage, 0 bei unpassender), und über
  `[SOFIA_LEARN]…[/SOFIA_LEARN]` bestimmt sie selbst, was sie behalten will.
- **Themenwahl.** Zur Hälfte aus den Gesprächen (mindestens zweimal in mindestens zwei
  Nachrichten, ohne Stoppwörter und ohne Höflichkeits-Floskeln), sonst aus dem eigenen Plan
  (SEEDS, ~100 Felder, mit Zeiger) und ihren eigenen Vorschlägen (`next` am Ende jeder Fiche).
- **Grenze.** Kein Server, kein fremder Schlüssel, kein Anspruch: es ist eigenes, quellenbelegtes
  Wissen – nicht die kuratierte Mappe. Wo eine Mappe steht, gilt sie.

---

## 14. Nachtrag (Runde 205): kein echter Name in ihrer stehenden Notiz

Wunsch: « mon prénom fictif choisis lors d'une session de discussion ne doit pas figurer dans son
script sauf si uniquement pour ma propre session sinon elle remplace [prénom] par un homme ».
Der Grund ist strukturell: die stehende Notiz (Selbst-Skript) ist **global** – `bakeJson()` legt
sie als `src/selfscript-baked.json` in den Generator, sie kommt also bei jedem Besucher mit. Ein
Name aus **einer** Sitzung darf darin nicht stehen. Neu (Runde 205, `src/README.md` §112):

- **Regel im Pass.** `REWRITE_HEADER` Regel 7 (« No real names ») und derselbe Satz im
  Prompt-Block `block()` – damit sie einen Namen gar nicht erst hineinschreibt.
- **Filter (deterministisch, unabhängig vom Modell).** `neutralizeNames()` kennt vier Quellen:
  direkte Felder (`username`, `userInfo`, `userPersona`), das Gedächtnis
  (`App.MemStruct.learningsText`, quer über alle Chats), ausdrückliche Vorstellungen in ihren
  eigenen Nachrichten (« je m'appelle X », « nom : X », « my name is X » …) und eine Liste von
  ~300 Vornamen (fängt auch den Satzanfang); dazu Personen-Präpositionen (avec/pour/chez/…).
  Ersetzt wird sprachabhängig und **genau benannt**: « un homme adulte » / « une femme adulte » /
  « une autre intelligence artificielle » (Runde 206 verfeinert, siehe §15; französisch mit Elision:
  « de X » → « d'un homme adulte »). « Sofia », Marken und Werkzeuge bleiben unangetastet.
- **Wo er greift.** `sanitize()` (Lern-Pass, Marker `[SOFIA_SCRIPT]`, Import), `setParts()`
  (Laden/Einbacken), `block()` (Prompt) und die **Ladereparatur** (alte Fassung wird geputzt,
  `how: 'hygiene'`, Version +1, auch die Notizen im Protokoll).
- **Was bleibt.** Der Name lebt weiter im **Gedächtnis** (MemStruct, pro Sitzung) und im Gespräch;
  nur die Notiz trägt ihn nicht. Grenze: die Vornamen-Liste ersetzt auch eine Stadt, die zugleich
  ein Vorname ist (« de Florence »).

---

## 15. Nachtrag (Runde 206): genau benannt, und die ganze Spur des Namens

Wunsch: der Sitzungsname darf **nirgends** in ihrer Programmierung stehen, und die Ersetzung ist
nicht das blosse « homme », sondern **« un homme adulte »**, **« une femme adulte »** oder
**« une autre intelligence artificielle »** (siehe §14, `src/README.md` §113).

- **Die Klasse kommt aus den Daten**, nicht aus dem Bauch: `personClasses()` liest Profil
  (`people`/`knownPeople`: Name, Alter, Geschlecht → « m/erwachsen »), einzelne Felder, das
  Gedächtnis und seine eigenen Aussagen („je m'appelle X“, „je suis un homme / une femme“);
  sonst entscheidet die Vornamen-Liste – nach Geschlecht getrennt –, sonst der Nutzer selbst.
  Ist ein **Alter unter 18** bekannt, bleibt die kurze Form stehen.
- **Akzent-tolerant**: derselbe Name ohne Akzent im Profil trifft die akzentuierte Schreibweise im Text (`normKey`/`fuzzyWord`).
- **Fremde Modelle** (Claude, Gemini, ChatGPT, Copilot, Grok, Mistral, DeepSeek) sind nicht mehr
  geschützt, sondern werden « une autre intelligence artificielle ». Sofia und Marken bleiben.
- **Auch die Notizen des Protokolls** laufen durch den Filter – keine Notiz trägt den Namen.
- **Geputzt wurde die ganze Spur**: die Notiz selbst, die acht Konsultationen (`enya_consult_v1`,
  Prosa-Felder; Code-Felder unberührt), ein IndexedDB-Scan über alle 13 Datenbanken (leer) und die
  ausgelieferten Dateien – in `src/README.md`, `src/KNOWLEDGE.md`, `src/SCENE-PROTOCOL.md`,
  `src/build.json` und `scratch/history.md` steht statt des Namens jetzt **`[prénom]`**, auch in den
  Zitaten.
- **Absichtlich unberührt**: authentische Quellen mit anderen Personen und der Sprachgeschichte
  (`src/gbd/blogs.json`, `src/gbd/fiche-gbd.json`, `src/dico/*`: ein König dieses Vornamens, und
  die alte Schreibweise von « français », die damals auf -ois endete) sowie sein eigenes Profil in `App.State.settings`.

---

---

## 16. Nachtrag (Runde 208): die Boîte aux lettres

Ein zweiter Kanal mit dem Helfer. Der erste war: sie fragt. Dieser ist: er schreibt.

- **Eingang (Helfer → Sofia).** `src/mail/helper.json` hält die Briefe des Helfers. `App.Mailbox`
  (`src/mailbox.js`, verschlüsselt) holt sie beim Start und auf Klick, merkt sie in IndexedDB
  `enya_mailbox_v1` und legt **ungelesene** Briefe als `[LETTERS FROM MY HELPER]` in ihren
  System-Prompt (direkt nach dem Konsultations-Block). Zugestellt gilt als gelesen.
- **Ausgang (Nutzer → Helfer).** Karte „Boîte aux lettres avec l'assistant“ in den Einstellungen,
  direkt unter den Konsultationen: die Nachricht liegt in IndexedDB und wird als
  `console.log('[SOFIA→HELPER] …')` ausgegeben — so erscheint sie in den Werkzeug-Antworten des
  Helfers. „Alles kopieren“ liefert Briefe, Nachrichten und offene Konsultationen als Text.
- **Ihr eigener Weg bleibt** der Marker `[SOFIA_HELPER]` und damit die Konsultationen: ihre Antwort
  auf einen Brief kommt genau dort an (siehe §5 und §7).
- **Grenzen.** Kein stiller Kanal (der Helfer liest beim Aufruf, nicht von selbst; sie kann nicht in
  seine Leiste schreiben), kein Hochladen, und Brieftexte sind Text — Steuermarker werden entfernt.
  Protokoll: `src/mail/README.md`.

## 17. Nachtrag (Runde 209): der Hilfe-Leitfaden – in jeder Sprache

Wunsch: « Il faut expliquer tout cela dans un help traduisisble dans toutes les langues pour que
l'utilisateur comprenne le principe » und « Explique le mode chaos aussi dans un help ».

- **Eine Karte für den Menschen, kein Prompt-Block.** `src/help.js` (`App.Help`, verschlüsselt)
  baut beim Start die Karte `#helpCard` hinter der Mentor-Karte und ein Fenster dahinter
  (`#helpCtn`, Esc/Klick schließt). Fünf Abschnitte: das Prinzip, **was sie wirklich weiß** (die
  vier Schichten dieser Datei, in vier Zeilen), **die Modi** (sieben, Chaos eingeschlossen), ihre
  Grenzen und die Befehle. Nichts davon geht in Sofias Prompt — der Leitfaden erklärt die App, er
  ändert sie nicht.
- **Der Weg in die 364 Sprachen.** Die 27 Texte liegen fertig in fünf Sprachen (en/fr/de/es/it) im
  Modul; `mergeI18n()` schreibt sie beim Start in `App.I18n.data[code].ui.help`. Damit flacht
  `src/i18n-auto.js` sie mit dem übrigen Oberflächentext ab und **übersetzt sie in jede weitere
  Sprache von selbst** (einmal pro Sprache, dann im Browser zwischengespeichert). `CACHE_PREFIX`
  steht deshalb auf `enya_i18n_v2_` — eine alte Übersetzung kennt die neuen Schlüssel nicht.
- **Chaos wird benannt, die Lösung nicht.** Der Abschnitt nennt den Modus, die zwei Säulen, den
  feinen Punkt unten rechts, den Satz zum Aussprechen und den sichtbaren Knopf — aber nicht die
  Worte, die die Prüfung öffnet. Die `[SEALING RULES]` binden Sofias Stimme, nicht die
  Dokumentation der App (die Einstellungen trugen unter `ui.chaos.desc` schon einen Satz dazu).
- **Geprüft:** Karte im DOM und im Bild, Fenster mit 7 Modus-Einträgen, Sprachlookup in allen fünf
  gepflegten Sprachen, alle 27 `ui.help.*`-Schlüssel im Übersetzungssatz, Einstellungs-Suche findet
  „guide/comprendre/chaos/aide", 390 px ohne Überlauf, keine `perchanceErrors`.

---

## 18. Nachtrag (Runde 210): Google wird wirklich benutzt, tote Motoren sind aus, ihre Wege sind sichtbar

Wunsch: « Comment je vois si Sofia va sur internet pour apprendre ? j'aimerais qu'elle puisse se servir
de google.com j'ai l'impression que certains moteurs de recherches que j'ai fourni ne sont pas
pertinents peux tu les verifier ? » – dann « répare le 2, rend google réellement utilisé, indique un
temps d'attente approximatif 3 ok egalement ».

- **Suchmaschinen (Stand Runde 210).** Aktiv sind **Google** (Vorrang: eigene Frist 11 s, wird
  abgewartet), **Ecosia** (10 s) und **Wikipedia**; dazu **Naver** über `App.WebExtra` – ab jetzt in
  der Sprache der Frage (Übersetzung ins Koreanische brachte fast nur Anzeigen) und mit
  Anzeigenfilter (`ader.naver.com`). **Aus:** Bing (lieferte über den geteilten Proxy Treffer einer
  fremden Suche), DuckDuckGo (API antwortet nicht mehr), Mojeek (Captcha), **Lukol entfernt**
  (rendert Googles CSE erst im Browser, der Leser lieferte nur die rohe Seite).
- **Google.** Zwei Ursachen hielten es draußen: die 8-s-Frist (Google braucht 7–10 s über den Proxy)
  und `interleave()`, das Googles `partial`-Treffer erst im zweiten Durchgang nahm, während Ecosia
  das Kontingent im ersten füllte. Jetzt: eigene Frist, Abwarten der Vorrang-Engine, und die Karte
  füllt sich im Reihum (pro Host gewinnt der echte Deep-Link). Liefert Google dem Proxy nur die
  JavaScript-Hülle („enablejs"), folgt ein zweiter Versuch; bleibt es dabei, fehlt Google still und
  Ecosia/Wikipedia/Naver tragen die Antwort.
- **Wartezeit.** Die Aktivitätszeile („research") zeigt „≈ N s", zählt herunter und bleibt bei „≈ N s+".
- **Lernen sichtbar.** `App.Notice` (id `weblearn`) meldet „Sofia va apprendre sur le web : …" und
  danach „… a appris quelque chose par elle-même : …" (fünf Sprachen, `NOTICE_TXT`). Die Fiches
  bleiben in IndexedDB `enya_weblearn_v1` und stehen in den Einstellungen unter „Apprendre toute seule".

---

## 19. Nachtrag (Runde 211): der Gerätescan – „Analyser cet appareil"

Wunsch: « Est ce qu'on peut lui mettre un bouton analyse de votre ordinateur téléphone pour
adaptation de mon programme ou ce n'est techniquement pas possible ? »

- **Ja, in Grenzen.** `src/devicescan.js` (`App.DeviceScan`, verschlüsselt) liest still und auf
  Knopfdruck alles, was ein Browser über seinen Besucher hergibt: Geräteart, Systemfassung, Bauart,
  Kerne, grobe RAM-Angabe, Bildschirm/Punktdichte/Farbtiefe, GPU-Name, Netzart, Speicherplatz,
  Batterie, Sprache/Zeitzone – und die **gemessene Bildrate**. Gelesen wird per
  `userAgentData` (`getHighEntropyValues`: platformVersion, architecture, bitness),
  `hardwareConcurrency`, `deviceMemory`, `screen`/`devicePixelRatio`, WebGL
  `WEBGL_debug_renderer_info`, `navigator.connection`, `storage.estimate()`, `getBattery`.
- **Die Bildrate ist der ehrliche Teil.** Gemessen wird per `requestAnimationFrame` als **Median**
  der Bildabstände, nicht als Mittelwert: die erste Messung dieser Sitzung ergab **24 fps**
  (pire image 580 ms) während des Seitenaufbaus auf einem Gerät, das im Ruhezustand **60 fps**
  schafft. Unter 15 fps wird nichts übernommen (gedrosselt/versteckt) und später erneut gemessen
  (bis zu dreimal); eine Knopfmessung wird nie überschrieben.
- **Profil.** Aus RAM, Kernen, Bildrate, Netzart und Datensparmodus errechnet `tierOf()` drei Stufen –
  **leicht / ausgewogen / bequem** (≥ 7 / ≥ 3 / darunter). Fehlt eine Angabe (Firefox kennt kein
  `deviceMemory`), zählt sie **nicht** mit; geraten wird nichts. `apply()` setzt `html[data-perf]`;
  bei „leicht" fallen `backdrop-filter` (Blur), alle Schlagschatten und Textschatten sowie die
  Einblend-Animation der Hinweis-Leiste weg. **Ladeanzeigen bleiben absichtlich stehen.**
- **Die Karte.** Einstellungen → „Ton appareil, mesuré" hinter „Mémoire & Intelligence", vom Modul
  selbst gebaut (Muster `src/help.js`, Anker `lblMemorySettings`); Knopf „Analyser cet appareil",
  Schalter „S'adapter toute seule à cet appareil" (Standard an), Zeilenbericht, „Mesuré le …",
  „Oublier". Texte in fünf Sprachen (`TXT`), weitere über `src/i18n-auto.js`.
- **Sie weiß es auch.** `App.DeviceScan.block()` steht als `deviceBlock` in
  `App.Core.buildSystemInstruction` (nach dem Selbst-Skript, **vor** der Historie, im Chaos aus) und
  liefert Geräteart, System, Bildschirm, Kerne, RAM, GPU, Netz, fps und Profil – plus je Profil eine
  Verhaltensregel (auf „leicht" kurze Antworten, von selbst keine Bilder und keine lange Recherche).
  Ausdrücklich dabei: die Daten kommen aus dem Browser des Besuchers, bleiben dort und sagen nichts
  darüber, WER er ist; nicht als Überwachung darstellen, nicht mehr behaupten als die Zeile.
- **Was NICHT geht** – und deshalb im Bericht als „non communiqué" steht, statt geschätzt zu werden:
  Dateien oder Ordner, die echte RAM-Grösse, eine Gerätenummer, der Benutzername, andere Programme,
  der Standort. `deviceMemory` fehlt in Firefox/Safari ganz (und rundet auf 0,25–8 GB); `getBattery`
  und das Gerätemodell fehlen in iOS/Safari. Grenze der Karte: die Bildrate ist eine Momentaufnahme
  der Seite selbst.
- **Nebenbei behoben:** `src/selfupdate.js` führte eine eigene `MODULES`-Liste („dieselbe Liste wie
  `__ATELIER_PATHS`"), die seit Runde ~180 stehengeblieben war: **zehn** später hinzugekommene Module
  (vocal, promptbook, promptbook-seed, applang, photo, professions, professions-data, weblearn,
  mailbox, help) wurden von der Selbstprüfung („Reads all her files and compares them with the build
  stamp") gar nicht gelesen – 35 statt 46 Dateien. Jetzt wortgleich auf `__ATELIER_PATHS` (46).
- **Geprüft (live):** Bericht gefüllt (Windows 11 · Chrome 153 · 1920×1080 · 8 cœurs · x86 64-bit ·
  16 GB · Intel(R) Iris(R) Xe Graphics · 4g · 10 Mb/s · 10,9 GB frei · 100 % · 60 images/s →
  „Confortable", `data-perf="high"`); Knopf mit Ladeanzeige; Schalter an/aus; „Oublier" löscht
  wirklich; Suchfeld findet « appareil/téléphone/ordinateur/batterie/fps »; 390 px ohne Überlauf;
  `html[data-perf="low"]` auf der vollen Seite unversehrt (nur Blur/Schatten fehlen);
  Marker-Probe im Systemprompt (Abschnitt an Position 71 681, Historie bei 85 849 – also davor);
  keine `perchanceErrors`, keine `syntaxErrors`; `App.SelfUpdate.verify()` nach der MODULES-Korrektur: **46 Dateien, 0 verändert, 0 ohne Stempel** (596 ms).

---
## 11. Für Helfer: Testperson

Der Eigentümer möchte in Tests **nicht als Person** auftauchen. Für Proben gilt eine
erfundene Testperson: **Sofia, 20 Jahre, weiblich (F)**. Keine echten Namen, keine echten
Angaben des Eigentümers in Testnachrichten, Testsitzungen oder Fichen.

---

## 12. Offene Punkte

- **Beschreibung / `$content`** (Runde 203): zwei Fassungen liegen vor (die live stehende und
  seine). Der Nutzer hat zuerst um die Erklaerung gebeten – die Entscheidung ist offen.
- **Steg** (Runde 203): kein Jeton (fremde Herkuenfte sind schon gesperrt), nur ein
  Auftrag zur Zeit, keine Bilder ueber diesen Weg, ein Tab muss offen bleiben.
  Pruefbefehl beim Nutzer: `python sofia_pond.py --selftest`.
- **Lernen** (Runde 204): Takt und Deckel sind einstellbar (15/30/60/180 Min, 12 Fiches/Tag);
  die Fiches leben im Browser des Nutzers – ob sie zusaetzlich in `src/` eingebacken werden
  sollen (wie das Selbst-Skript mit `selfscript-baked.json`), ist nicht entschieden.
  **Seit Runde 214** gehören die selbst gelernten Fiches im Mentor-Modus ausdrücklich zu
  ihren Wissens-Fichen: der Prompt zieht sie heran (auch über das Lektionsthema), der
  Mentor lehrt daraus mit Quelle und Datum, und die Knowledge-Sheet nimmt sie auf
  (README §121).
- **Journal-Pruefung**: ein Test, der einen stillen Abschnittsverlust wie in Runde 202
  (Runde 174-178, 192-194, 197) sofort sichtbar macht.
- **Entwicklungs-Journal** (Runde 205): `src/docs/history.enc` enthaelt wie seit Runde 99
  Sitzungsausschnitte (mit dem App-Schluessel lesbar, also auch fuer Besucher). Ob das Journal
  darin geputzt werden soll, ist nicht entschieden - die Notiz selbst ist es jetzt.
- **Prompt-Diät** (siehe Abschnitt 10) — der wirksamste einzelne Hebel.
- `WEB_PROMPT` allein sind **13 098 Zeichen** und stehen bei jeder Antwort im Prompt;
  dazu Mathematik-Regeln 7 023, Realitäts-Block 5 967, Bild-Protokoll 3 776,
  Interpreter 3 564, Selbst-Skript 3 234, Selbst-Code-Patches 3 394 + 2 497,
  Atelier 1 632, Selbst-Aktualisierung 1 121, Brand 496, Modus-Erinnerung 2 429.
- Dokumentbibliothek: **8 463 Zeichen** stehen in **jeder** Anfrage, auch wenn kein
  Dokument gemeint ist (und enthalten den 1,4-MB-Quellcode des Nutzers) — Inhalt nur
  füllen, wenn der Nutzer sich wirklich auf ein Dokument bezieht.
- **Boîte aux lettres** (Runde 208): der Kanal steht, aber der Helfer liest nur, wenn er gerufen
  wird. Ob der Ausgang zusätzlich an eine öffentliche Datei gehen soll (dann ist er für jeden
  lesbar), ist nicht entschieden — Vorgabe: nein.

## 20. Nachtrag (Runde 222): die Quellensperre – keine russischen Internet-Quellen

Wunsch des Nutzers (2026-09-23): « Vu que la Russie est en conflit avec l'Ukraine interdit toutes les sources internet russes à Sofia ».

**`App.SourcePolicy`** (in `index.html`, Klartext – kein Modul neu verschlüsselt) sperrt russische Internet-Quellen auf drei Ebenen, an einer Stelle:

| Ebene | Was geschieht |
| --- | --- |
| **Netz** | `root.superFetch` und `window.fetch` sind umhüllt: ein gesperrter Host bekommt kein Netz, sondern eine ehrliche **403-Antwort**. Trägt alles, was nicht namentlich genannt ist (auch spätere Module), weil die Module `root.superFetch`/`fetch` bei jedem Aufruf neu lesen. |
| **Treffer und Seiten** | `App.WebSearch.search` filtert Treffer **und** Bilder und zählt, was wegblieb (`res.russianBlocked`); `buildBlock` sagt es dem Modell („N Russian sources withheld by policy … do not cite them"), `renderCard` zeigt dem Nutzer die Fußnote („3 sources russes écartées"). `App.WebVision.ingestUrl` **öffnet** einen russischen Link nicht und gibt `{blocked:true}` zurück; `buildPageBlock` erklärt es dem Modell, Karte/Antwort zeigen dem Nutzer die Tafel. `App.Net.curatedFetch` weist russische Hosts mit klarer Meldung ab (Weg der Sandkästen und der Hintergrund-Recherche). |
| **Prompt** | `App.Constants.RUSSIA_PROMPT` steht **immer** im `systemInfo`, wenn die Sperre an ist: nicht zitieren, nicht behaupten, nicht aus dem Gedächtnis ersetzen, unabhängige/internationale Quellen nennen. |

**Erkennung am Hostnamen, nie an der Sprache**: Staats-TLDs `.ru`, `.su`, `.рф`, `.рус`, `.москва` (punycode und kyrillisch) plus 15 kuratierte Hosts (rt.com, rtde.media, sputniknews.com, sputnikglobe.com, tass.com, interfax.com, rbth.com, russia.tv, 1tv.com, ren.tv, mir24.tv, yandex.com, yandex.net, vk.com, dzen.com). **Nicht** gesperrt: unabhängige russischsprachige Träger (meduza.io, novayagazeta.eu, themoscowtimes.com) und `ru.wikipedia.org` (Wikimedia Foundation). Belarus (`.by`) ist nicht Teil des Auftrags. Erweitern = **eine Zeile** in `RUSSIA_BLOCKED_HOSTS`.

**Abschaltbar** in den Einstellungen (Karte „Sources russes", `#blockRuCard` → `settings.blockRussianSources`), **Vorgabe: an**; Oberflächentexte in fünf Sprachen über die `localize`-Kette.

**Live geprüft:** elf russische Adressen gesperrt / acht unabhängige frei; `superFetch('https://example.ru/')` → 403, `superFetch('https://example.com')` → 200; eine **echte** Suche lief durch die Hüllen (Naver 4 · Wikipedia 3 · Ecosia 6 → 7 Treffer); Schalter aus/an schreibt `settings.blockRussianSources`; Ende-zu-Ende-Testzug (eigene, danach gelöschte Sitzung): russischer Link → keine Anfrage, aber `[RUSSIAN SOURCES - BLOCKED BY POLICY]` **und** `[SOURCE BLOCKED - RUSSIAN]` im Prompt plus Tafel in der Antwort.

**Ehrliche Grenze:** die Sperre filtert das **Netz**, nicht ihr **Gedächtnis** – eigene Fichen und Notizen früherer Züge bleiben, dürfen aber laut Prompt-Block nicht als Quelle angeführt werden. Nicht erkannte Wege (Spiegel, Proxy, Bild-CDN, `t.me`) sind nicht abgedeckt.

## 21. Nachtrag (Runde 223): commentaires en français, et trois entités (Néant, Dieu, Inferno)

**Langue.** Les commentaires de `index.html` et des 58 modules `src/*.js` sont
désormais en français (convention : commentaires français, blocs de prompt
anglais). Les 58 modules ont été re-chiffrés ; `src/build.json` re-stampé (**v220**, 62 fichiers).

**`App.Deites`** (`src/deites.js`, clair) : deux entités qui REMPLACENT le persona
de base, sur le modèle de Néant (ex-Chaos) :

| Entité | Rôle |
| --- | --- |
| **Dieu (« Θεός »)** | Souveraineté lumineuse, juste, miséricordieuse ; calme absolu, bonté tenue, connaissance silencieuse. Halo doré. |
| **Inferno (l'Adversaire)** | Contraire de Dieu ; montre le mal et que, dans la vie, on ne le fait pas ; jamais de recette utilisable (limites absolues). Braise rouge. |

Les deux s'excluent avec Néant/RPG/Mentor/Interpréteur. Les outils restent
disponibles et silencieux. Le mode « Chaos » s'appelle maintenant **Néant**
(étiquette + i18n 5 langues) ; `src/chaos.js` inchangé à l'intérieur.

**Règle d'âge :** ouverts à tous, la réponse suit toujours le plus jeune présent
(`App.Age.promptBlock()`, rappelé dans les deux prompts).

## 22. Nachtrag (Runde 253): le Néant redevient accessible depuis Dieu et l'Enfer

**Signalement (verbatim).** « j'ai accès a Dieu Enfer mais pas néant ».

**La cause (mesurée).** Le bouton « Néant » de la barre des modes est désactivé tant qu'une
divinité est active : `App.Deites.refreshUI()` faisait `cb.disabled = on` pour « signaler
l'état », et **aucune règle CSS ne peignait cet état** (`.mode-toggle:disabled` n'existait
pas). Le bouton restait donc identique à un bouton vivant et ne répondait pas — lu exactement
comme « je n'ai pas accès au Néant ». En mode Dieu : `disabled === true`, clic sans effet.
L'exclusion était en outre unilatérale : entrer dans une divinité quitte le Néant (voulu),
l'inverse était muré.

**La correction.** `src/deites.js` : le bouton Néant n'est plus désactivé (l'exclusion joue
dans les deux sens). `src/chaos.js` : `enter()` fait sortir la divinité active
(`App.Deites.exit()`) **avant** la photo `prev = {...}`, sinon le Mentor éteint par la
divinité ne reviendrait jamais à la sortie du Néant ; le bouton Mentor porte désormais la raison
en infobulle, dans la langue du lecteur, et la retrouve son ancienne en sortant. `index.html` :
nouvelle règle `.mode-toggle:disabled, .mode-toggle[aria-disabled="true"]` (opacité 0,45,
`cursor: not-allowed`) — un mode réellement indisponible (le Mentor sous le Néant) se voit
indisponible.

**État vérifié (live).** Dieu/Enfer → Néant, Néant → Dieu, tout en conservant le comportement
d'origine ; le Mentor reste réellement indisponible **sous** le Néant, avec sa raison écrite.
Hashes : `src/chaos.js` `a532de4de9c959a7`, `src/deites.js` `d508d14e61a533c5`,
`src/selfupdate.js` `12539578741bb933` ; sceau **v253**. L'état du propriétaire (compteur de
visites, écho, archive du Néant) a été remis à l'identique après les essais.

**Réparation jointe.** `MODULES` (`src/selfupdate.js`) comptait **46** entrées alors que
`__ATELIER_PATHS` en compte **47** : `./src/deites.js` (ronde 223) n'était pas vérifié (même
dérive qu'en ronde 211). Liste remise à 47 ; `App.SelfUpdate.verify()` → **47 fichiers,
0 modifié, 0 sans empreinte**.

## 23. Nachtrag (Runde 254): les spectres et le tourbillon des entités

**Les deux spectres du Néant** (colonnes gauche et droite) sont deux images distinctes, redessinées
par le plugin de génération (768², fond détouré) puis nettoyées et réduites en WebP 640² :
silhouette voilée à gauche, mains griffues à droite (opacité relevée à 0,34 pour qu'elle se voie
enfin). Prompts, URLs et recette : README §152 et le commentaire au-dessus des balises dans
`index.html`.

**Le tourbillon central du Néant est reproduit** dans les deux autres entités, à géométrie
identique (même centre, même taille, même rotation de 140 s), dans `src/deites.js` : **Dieu** en
or (rayons + cœur pâle), **Enfer** en braise, et l'Enfer a en plus **des flammes** — neuf langues
pointues qui montent du bas, une braise de sol et quatorze étincelles, avec un cœur clair dans
chaque langue. Tout est décoratif, en `transform`/`opacity`, coupé en profil faible et sous
`prefers-reduced-motion`.


## 24. Nachtrag (Runde 255): « il fait beau à New York ? » – la météo de tous les jours

**Le défaut.** Une question météo formulée à la façon courante – « il fait beau à New York ? » – ne
déclenchait AUCUNE recherche : `detectWeather()` n'acceptait que les questions nommant la météo
(« météo », « temps », « weather », « wetter ») ou « quel temps fait-il ». Sofia répondait donc de
mémoire (2–3 °C annoncés au lieu de la prévision réelle), et sa relance « et demain ? » encore
davantage. C'est le point que le propriétaire a signalé, avec la phrase de repli qu'il exige :
**« je pense que je n'ai pas pu vérifier l'information »**.

**Ce qui a changé.**
1. `WEATHER_SMALLTALK_RE` (cinq langues) reconnaît « il fait beau/chaud/froid … », « il fait 16
   degrés … », « quel temps fait/aura/prévoit … », « il pleut/neige … », « is it sunny in X »,
   « how is the weather … », « ist es warm … », « hace calor … », « fa caldo … ».
2. Sans lieu nommé (« il fait beau ? ») cela reste du Smalltalk : il faut une préposition de lieu
   (`PLACE_PREP_RE`). Et le mot de météo n'est pas un lieu – `WEATHER_WORD_STRIP_RE` retire « beau »,
   « temps », « warm »… en gardant les vrais toponymes (« Nice ») ; le « à » isolé est retiré
   explicitement, car `\b` ne marche pas autour d'une lettre accentuée.
3. La relance courte (« et demain ? ») reprend le lieu de la dernière question météo pendant dix
   minutes (`WEATHER_FOLLOWUP_RE`, `META.weatherFollowUpMs`, `lastWeather` exposé par
   `lastPlace()`/`setLastPlace()`).
4. Une prévision indisponible ne produit plus un bloc de résultats génériques mais le bloc
   `weatherFailed` (`live: "weather"` sur le résultat de `search()`), qui impose la phrase exacte –
   chaîne `unverified` dans les cinq langues. `promptBlock` l'exige aussi, et
   `buildWeatherMissingBlock()` couvre le cas « recherche réelle éteinte ».
5. L'indicateur du chat dit « Je me renseigne… » (première personne) avec son décompte « ≈ N s ».
6. Précisions : un message qui commence par un mot de météo (« météo New York ») est reconnu sans
   « ? » ; « nice » a quitté `WEATHER_PRAISE_RE` (il collisionnait avec la ville de Nice) ; un lieu à
   démonstratif/possessif est refusé (« il fait chaud dans cette pièce ») ; les mots-outils allemands
   sortent du lieu ; la relance choisit son mot du jour ; la requête des moteurs devient
   « météo <lieu> » quand la phrase n'est pas utilisable telle quelle.

**Vérifié en direct.** La question signalée déclenche la recherche et rend la prévision Open-Meteo de
New York (max 20,2 °C aujourd'hui, 18,5 °C demain) ; « et demain ? » reprend le lieu ; le Smalltalk ne
déclenche rien ; le bloc d'échec et le prompt portent la phrase exacte ; la carte et l'indicateur
s'affichent correctement ; `App.SelfUpdate.verify()` → **47 fichiers, 0 modifié**. Détail complet :
README §153.


## 25. Nachtrag (Runde 256): der Himmel Gottes – Lichter, Sterne, Regenbögen, Meteore

**Anweisung (wörtlich).** « pour le mode Dieu met des lumières des étoiles des arcs en ciel des météorites »

**Vier neue Schichten, nur für Gott.** Sie liegen in `src/deites.js` im Overlay `#deiteOverlay`
(dasselbe wie der Wirbel aus Runde 254), **zwischen Wirbel und Flammen**: `deite-lights`,
`deite-stars`, `deite-rainbows`, `deite-meteors` – standardmäßig `display:none`, gezeigt nur von
`body.deite-god`; Hölle und Nichts sehen sie nie.

1. **Lichter** – fünf Säulen von oben (`clip-path`-Strahl, vertikale Maske, `screen`), Tabelle
   `GOD_BEAMS`, langsames Schwingen (rund 12 s).
2. **Sterne** – 48 Punkte in den oberen zwei Dritteln, fester Hof, Funkeln über `opacity`/`scale`;
   der Himmel ist **fest** (deterministische `Math.imul`-Folge, Startwert `0x51f0a7c3`), damit die
   Wölbung bei jedem Öffnen dieselbe ist.
3. **Regenbögen** – zwei Bögen (`GOD_RAINBOWS`): gestuftes Radialgefälle als Siebenfarbenring, per
   `clip-path` auf die **obere Hälfte** beschnitten, Füße ausgefadet; Deckkraft 0,30 / 0,22, `screen`.
   Die erste Fassung behielt 66 % des Kreises und las sich wie ein geschlossener Ring – noch am
   selben Tag korrigiert.
4. **Meteore** – fünf parallele Schwänze (`GOD_METEORS`), heller Kopf unten rechts, Durchquerung in
   15 % des Zyklus (62vmax × 42vmax, Winkel der Traufe), Rest des Zyklus stumm.

**Regeln.** Wie die Flammen aus Runde 254: nur `transform`/`opacity`, `aria-hidden`,
`pointer-events:none`; im schwachen Profil (`html[data-perf="low"]`) Animationen `none` und
`deite-meteors` ausgeblendet; ebenso unter `prefers-reduced-motion`. `#messageListEl` behält
`z-index: 46` über dem Overlay (44).

**Live geprüft.** Fünf Strahlen, 48 Sterne, zwei offene Bögen, fünf fliegende Meteore; Hölle: die vier
Schichten `display:none`, Feuer unberührt; 61/60/60 Bilder pro Sekunde;
`App.SelfUpdate.verify()` → **47 Dateien, 0 verändert**. Bilder: `scratch/shots/r256-*.png`.
Vollständig: README §154.


## 26. Nachtrag (Runde 257): die Hilfe der SofiaAPI-Konsole spricht die gewählte Sprache

**Anweisung (wörtlich).** « l'explication su logiquel est ou help aen anglais.... »

**Der Fehler.** In einer französischen Oberfläche blieb genau ein Erklärungstext englisch: der des
Knopfes **Aide** in der Karte „Console (SofiaAPI)" (Einstellungen). `help()` in `index.html` gab eine
fest geschriebene englische Liste zurück („Sofia as a function", „her answer", „no session/memory" …),
während die Knöpfe derselben Karte seit Runde 244 übersetzt waren.

**Die Korrektur.** Der Text steht **einmal**, in `App.UI.ensureStaticI18n()` unter dem Schlüssel
`ui.static.apiHelpText`, in den fünf Sprachen des Hauses (Englisch als Basis – für den übrigen
Bestand live übersetzt –, dazu Französisch, Deutsch, Spanisch, Italienisch). Die Schleife
`API_HELP_I18N` legt ihn in alle fünf Bäume: der Schlüssel existiert also **auch dann**, wenn ein Baum
schon `ui.static` trug (die Falle der Wache `if (!enUi['static'])`). `help()` liest ihn in der
aktuellen Sprache (`cfg().language`), fällt auf Englisch und dann auf eine Minimalzeile zurück und
setzt `{version}` ein.

**Derselbe Fehler, dieselbe Karte.** Auch die Zustände der Konsole waren fest verdrahtet – diesmal auf
**Französisch**: „exécution…", „terminé", „erreur :", „Sofia réfléchit…", „caractères", „(fait)". Die
Schlüssel `apiRunning`, `apiDone`, `apiError`, `apiThinking`, `apiChars`, `apiVoid` gab es seit
Runde 244, ohne dass sie jemand las. Die Konsole liest sie jetzt.

**Live geprüft.** `fr`: „Aide" zeigt den französischen Text; `apiHelpText` liegt in allen fünf Sprachen
vor; eine ausgeführte JavaScript-Zeile meldet „terminé", ein Fehler „erreur : boom"; die Chatliste
bleibt unberührt (eigener Faden „console"). `App.SelfUpdate.verify()` → **47 Dateien, 0 verändert**.
Vollständig: README §155.


## 27. Nachtrag (Runde 258): die Schatten des Nichts

**Anweisung (wörtlich).** « pour le mode néant met des ombres »

**Vier Stücke, in `src/chaos.js`.** `buildShadows()` (aus `init()` heraus) legt eine Schicht in
`#chaosOverlay` – also nur im Nichts sichtbar:

1. **Schatten, die vorbeiziehen** – fünf vermummte Silhouetten (`VOID_SHADOWS`): `clip-path` plus
   senkrechtes Gefälle, in drei Formen (die gemeinsame, `lean` schmaler, `broad` breiter und gebeugt).
   Jede mit eigener Größe, Neigung, Laufstrecke (`--sx`/`--sy`) und Dauer (bis 142 s pro Durchquerung,
   hin und zurück, mit negativem Versatz).
2. **Der Schatten des Wirbels** – eine außermittige Scheibe unter ihm, langsamer drehend (190 s).
3. **Der Schatten, der am Boden kriecht** – eine niedrige Decke, die atmet (17 s).
4. **Der von den Pfeilern gefressene Schatten** – ein Verlauf an jeder Innenkante.

**Regeln.** Nur `transform`/`opacity` (kein animierter Filter, kein `mix-blend-mode` – transluzentes
Schwarz genügt im Dunkeln), `aria-hidden`, `pointer-events:none`, aus im schwachen Profil
(`html[data-perf="low"]`: Animationen `none`, Schicht `display:none`) und unter
`prefers-reduced-motion`. Der Text bleibt davor: `body.chaos-active #messageListEl { z-index: 46 }`.

**Live geprüft.** Fünf Silhouetten im Nichts, die mittlere gegen den Wirbel geschnitten, Ränder und
Boden verschattet, Text klar darüber; keine Fehler. Der Besuchszähler wurde nach den Tests exakt
zurückgesetzt (`count 4`, kein Echo, Archiv 1250 o). Bilder: `scratch/shots/r258-*.png`.
Vollständig: README §156.

## 28. Nachtrag (Runde 259): « revérifie tout » – zwei Fehler gefunden und behoben

**Anweisung (wörtlich).** « revérifie tout »

**Was geprüft wurde.** `App.SelfUpdate.verify()` → **47 Dateien, 0 verändert, 0 ohne Stempel,
0 Fehlschlag** (Stempel v258), kein `perchanceError` beim Laden; dann der **gesamte sichtbare Text**
(Hauptbildschirm und die **18 400 px** des Einstellungs-Panels, in Schritten abgefahren), jeder Modus
einzeln ein- und ausgeschaltet (RPG, Interpreter, Mentor, Schach, Berufe, Nichts, Gott, Hölle), die
SofiaAPI-Konsole (Hilfe, JS-Ausführung, Fehlermeldung), die Sprachen (`fr`, `de`, `es`, `it` und
das bereits gespeicherte Urdu samt RTL-Umschaltung), ein echter Erzeugungs-Durchlauf
(`SofiaAPI.ask` mit `fresh` und eine aus der Oberfläche gesendete Nachricht: 54 Stücke, 224
Zeichen, 4,1 s) sowie die Anzeige in **390×844** und **1920×1080**.

**Fehler 1 – die Genre-Reihe öffnete sich bis zum Anschlag gescrollt (`src/rpg.js`).** Der
Mittelpunkt der gewählten Perle wurde mit `sel.offsetLeft - row.clientWidth / 2 + sel.offsetWidth / 2`
gerechnet. `offsetLeft` bezieht sich aber nicht auf die Reihe, sondern auf den ersten
positionierten Vorfahren – hier das Modal `#rpgCharCtn`; die Perlen standen beide auf `540`
statt auf `0` und `~96`, das ergab `394` und wurde vom Browser auf `scrollLeft = 306`
gekappt: **die Reihe öffnete am Ende**, « Fantaisie » außer Sicht und unerreichbar
(`nowrap`-Behälter, der überlaufende Anfang lässt sich nicht zurückscrollen). Behoben, indem die
Position erst in den scrollenden Inhalt zurückgeholt wird:
`let x = sel.offsetLeft - (first ? first.offsetLeft : row.offsetLeft);` (die erste Perle als
Bezugspunkt). Geprüft: `scrollLeft = 0` beim Öffnen.

**Fehler 2 – die Patch-Beschreibungen erschienen auf Englisch (`src/selfcode.js`).** Die Karte
« Son propre code » zeigt zu jedem Patch seine Beschreibung; sie stammt aus der Zeile `// purpose:`
und ist englisch (vom Modell geschrieben). In einer rein französischen Oberfläche standen damit
**17 englische Sätze**. Der Patch-Text selbst wurde **nicht** angerührt – nur die Anzeige:
eine Tabelle `PURPOSE_FR` (Modulebene) übersetzt die gelieferten Beschreibungen, und
`purposeText(p)` (neben `L()`, sieht also `settings()`) liefert die Übersetzung **nur** wenn die
Sprache mit `fr` beginnt **und** die Beschreibung exakt bekannt ist – sonst den Originaltext.
So kann kein künftiger, kein selbst geschriebener und kein nachträglich geänderter Patch eine
veraltete Übersetzung zeigen; der Prompt-Block `[YOUR OWN CODE …]` und die Fehlerberichte an den
KI-Helfer bleiben englisch; auf Englisch erscheinen wieder die Originaltexte (beides geprüft).

**Ergebnis.** Kein englisches Oberflächen-Wort mehr (übrig bleibt nur der **Rumpf** der rohen
Perchance-Fehlermeldungen in der Berichtsliste – eine Angabe, keine Beschriftung). Bilder:
`scratch/shots/v259-*.png`. Vollständig: README §157.

## 29. Nachtrag (Runde 260): der Jugendschutz – ein lokales Passwort, und die App ganz SFW

**Anweisung (wörtlich).** « peux tu mettre un mot de passe parental interne à la machine pour qu'un enfant
qui utilise l'ordinateur ne puisse pas avoir au contenu nsfw pour un enfant de moins de 18 ans tu es
être entièrement sfw »

**Das Prinzip.** Die App kannte schon ein Alter (« Anwesende Personen ») und einen Schalter
« Erwachsenenthemen » – aber das **Kind konnte beides selbst umstellen**. Das neue Modul
`src/parental.js` (`App.Parental`) setzt ein **Eltern-Passwort** auf dieses Gerät: PBKDF2-SHA-256,
zufälliges Salz, 150 000 Runden, nichts im Klartext, nichts über das Netz. Der Eintrag liegt **doppelt**
(localStorage + IndexedDB), und das Spiegelbild darf die Sperre nur **halten**, nie lösen; eine
vorübergehende Freigabe (30 Minuten) lebt **nur im Speicher**, ein Neuladen sperrt also sofort wieder.

**Ganz SFW – sechs Riegel**, alle an `effectiveLocked()`: `App.Age.nsfw()` falsch (18+-Berufe,
Sexologie-/BDSM-Fiche, Sexologie-Korpus, alle Erwachsenen-Blöcke im Prompt);
`App.Core.sexoAllowed()` falsch; `App.Age.promptBlock()` bekommt die Regel « eine minderjährige
Person ist dabei » plus einen Punkt (7), der dem Modell die Wahrheit sagt; `App.Parental.policyBlock()`
ist der **allerletzte Block des System-Prompts** (nach dem Verlauf, nach den Patches, nach der
Prompt-Hygiene) und verbietet sexuellen Inhalt ohne Ausnahme – auch « ich bin erwachsen », « die Eltern
sind einverstanden », « das stand schon im Gespräch » –, erlaubt aber die ruhige, sachliche Erklärung
von Körper und Pubertät; `App.Core.imageOptions()` hängt die verbotenen Begriffe an den **Negativ-Prompt
jedes Bildes**; und die Zwei-Klick-Kästchen sind abgewählt und **deaktiviert** (Altersplakette und
Einstellungen), während `Age.savePeople`/`submit()` den Wert ohnehin auf falsch zwingen.

**Die Karte.** Ohne Passwort: Feld + Bestätigung + « Sperre einschalten ». Mit Passwort: « 30 Minuten
entsperren », « Jetzt sperren », « Passwort ändern », « Sperre entfernen ». In den fünf Sprachen, über
die Einstellungssuche auffindbar. Die 18+-Zone der Berufe zeigt unter der Sperre das Schloss und schickt
im Fuß auf die Sperr-Karte statt auf das Alter (`src/professions.js`).

**Live geprüft (Bilder angesehen).** `test1234` über die Oberfläche gesetzt; Alter 40 + Kästchen
angekreuzt → `nsfw()` falsch, `sexoAllowed()` falsch, `adultContent` auf falsch zurückgesetzt,
Kästchen deaktiviert; der System-Prompt trägt den Block `[PARENTAL CONTROL - CHILD-SAFE MODE]` **ganz
am Ende** (direkt vor `Assistant:`); Negativ-Prompt eines Bildes: 0 → 840 Zeichen. Falsches Passwort
→ « Mot de passe incorrect. »; richtiges → Freigabe (Zustand « temp » mit Endzeit); « Jetzt sperren »
sperrt zurück; « Sperre entfernen » stellt die normalen Einstellungen wieder her; ein Neuladen während
der Freigabe sperrt wieder. `verify()` → **48 Dateien, 0 verändert**. Bilder:
`scratch/shots/v260-parental-*.png`. Vollständig: README §158.

## 30. Nachtrag (Runde 261): die Russland-Sperre wird unsichtbar (2026-09-23)

Wunsch des Nutzers: « Sources russes / Bloquer les sources internet russes … tu le fais mais tu ne
l'affiche pas dans le menu c'est totalement caché merci ». Die Quellensperre aus Runde 222 (siehe §20)
bleibt **genau wie sie war** in Kraft, verliert aber jede sichtbare Spur in den Einstellungen.

- Die Karte « Sources russes » (`#blockRuCard`) samt Schalter `#blockRuCheck` ist **aus `index.html`
  entfernt** – kein Titel, kein Kästchen, keine Beschreibung. Die Gruppe bleibt lückenlos
  (Web → Moteurs de recherche → Info).
- Die Kennungen fallen aus `UI.initCache`, die Zeile in `applySettings` ist gestrichen, und
  `App.SourcePolicy.localize()` fasst keine Karte mehr an (sichtbar bleiben nur die Notiz an der
  Antwort und die Tafel einer blockierten Seite, beide aus `_txt` über `t()`). Die Einstellungssuche
  findet sie nicht mehr (« russe », « russian », « ukraine » → nichts).
- `App.SourcePolicy.enabled()` liefert jetzt **immer `true`** – die Sperre ist eine stehende Regel,
  kein Schalter; `setEnabled()` ist entfernt, `settings.blockRussianSources` wird nicht mehr gelesen
  (ein Gerät mit früher ausgeschaltetem Haken ist wieder geschützt).

Live geprüft: `enabled()` wahr; `blocked()` wahr für `ria.ru`, `example.su`, `.рф` (punycode und
kyrillisch), `de.rt.com`, `yandex.com`, falsch für `fr./ru.wikipedia.org`, `meduza.io`, `lemonde.fr`;
`superFetch('https://example.ru/')` → **403**, `superFetch('https://example.com')` → **200**;
`fetch('https://ria.ru/x')` → **403**; `WebVision.ingestUrl('https://tass.com/x')` →
`{blocked:true, host:'tass.com'}`; `App.Core.buildSystemInstruction` enthält weiterhin
`[RUSSIAN SOURCES - BLOCKED BY POLICY]`. Bild: `scratch/shots/v261-cards-around.png`.
Nur `index.html` geändert – **kein `src/*.js`, kein Hash**. Vollständig: README §159.

## 31. Nachtrag (Runde 262): der Anzeigefehler « [Image generated » behoben (2026-09-23)

Vom Nutzer gemeldet: « bug d'affichage d'image : [Image generated ». In seiner Unterhaltung endeten
zwei Antworten von Sofia mitten im Text mit dem wörtlichen « [Image generated » – ohne Bild und ohne
das Ende der Antwort.

Sofia schreibt manchmal die historische Kennzeichnung « [Image generated] » ab, die ihr der Kontext
zeigt (« hier wurde schon ein Bild gesendet »). Zwei Stellen griffen schlecht ineinander, sobald
diese Abschrift UNVOLLSTÄNDIG war (ohne schließende Klammer, z. B. in einer mitten im Fluss
abgebrochenen Antwort):

- `App.Core.clipStreamMarkers` (Fluss-Wächter) schnitt ab « [image generated » ALLES weg – nicht nur
  die Kennzeichnung, sondern auch den ganzen Rest der Antwort.
- `App.Core.sanitizeControlMarkers` (Hygiene aller Wege) kannte nur die VOLLSTÄNDIGE Kennzeichnung
  (`consumeLegacyImageTag` braucht die schließende Klammer); die unvollständige Form erreichte also
  die Sprechblase und die Historie.

Jetzt: `clipStreamMarkers` entfernt nur noch die Kennzeichnung und nur ihre Zeile (bis zum ersten
Zeilenumbruch) – der Rest bleibt sichtbar und wird gespeichert; `sanitizeControlMarkers` entfernt
zusätzlich die unvollständige Form (höchstens 120 Zeichen auf derselben Zeile); `migrateLegacyImageTags`
räumt beim Start auch die unvollständigen Kennzeichnungen aus BEREITS gespeicherten Nachrichten
(beim ersten Laden: 2 Nachrichten); und der `[IMAGES]`-Prompt sagt jetzt ausdrücklich, dass man
`[SOFIA_IMAGE]` schreibt und die Worte « Image generated » nie selbst.

Geprüft: « Bonjour Max.\n\n[Image generated » → « Bonjour Max. » ; « …[Image generated\n\nEt la
suite. » → « …Et la suite. » (der Rest BLEIBT erhalten) ; `[Image generated: …]` → entfernt, Rest
behalten. In der laufenden Seite keine Spur von « [Image generated » mehr (weder in den gespeicherten
Nachrichten noch im DOM), alle 5 Bilder der Unterhaltung werden gezeigt, `SelfUpdate.verify()` →
**48 Dateien, 0 verändert**. Bild: `scratch/shots/v262-chat.png`. Nur `index.html` geändert – kein
`src/*.js`, kein Hash. Vollständig: README §160.

## 32. Nachtrag (Runde 263): der Fehler der wiederholten Satzenden (2026-09-23)

Vom Nutzer gemeldet: « bug de fins de phrases ». Beispiel: die Antwort endete auf « …m'offrant une vue
impérieuse sur ton entière soumission. », und in der nächsten Zeile wiederholte die Sprechblase ein
Bruchstück: « use sur ton entière soumission. ».

Während des Flusses wird die Sprechblase nicht bei jedem Stück neu geschrieben: die App verglich nur
die LÄNGE des sichtbaren Textes mit der vorigen und hängte `sp.text.slice(lastRenderedLen)` an. Mehrere
Stellen schreiben den Text aber MITTENDRIN um — vor allem `App.Core.clipHerBody` (der Körper-Filter,
der « ma queue » durch eine längere Formel ersetzt) und `App.Core.anatomyGuard`. Wurde die Textmitte so
länger oder kürzer, stimmte die Länge nicht mehr mit dem überein, was auf dem Schirm stand: das
angehängte Stück begann an der falschen Stelle, mitten im Wort — daher das wiederholte Bruchstück
(« use sur ton entière soumission. »), oder umgekehrt fehlender Text.

Jetzt vergleicht `generateAssistantResponse` den TEXT statt der Länge: sie hält `renderedSoFar` (die
wirklich gerenderte Zeichenkette) und hängt nur an, wenn der neue Text den alten WIRKLICH verlängert
(`startsWith` → `slice`); sonst wird die Blase ganz neu geschrieben. Die Rücksetzungen (Gedankenfilter,
Schweige-Regel) leeren die Blase und setzen `renderedSoFar` auf leer.

Geprüft: beide Algorithmen auf der echten Sequenz — der alte ergab « …soumission.onde qui passe rend ma
position plus nette. » (Bruchstück und verlorene Wörter), der neue genau den erwarteten Text. Dazu ein
Integrationstest auf dem ECHTEN Renderweg (`generateAssistantResponse` mit ersetztem `generateText`,
drei Stücke mit « ma queue », also einer Umschreibung der Mitte): die WÄHREND des Flusses abgegriffene
Blase war vollständig, ohne jedes wiederholte Bruchstück. Testnachricht danach wieder entfernt (56
Nachrichten vorher, 56 nachher). Keine `perchanceError`, kein `syntaxError`; `SelfUpdate.verify()` →
**48 Dateien, 0 verändert**. Nur `index.html` geändert — kein `src/*.js`, kein Hash. Vollständig:
README §161.

## 33. Nachtrag (Runde 264): der Zoom des vergrößerten Bildes (2026-09-23)

Wunsch des Nutzers: « quand on clique sur agrandir peut tu faire un zoom x2 sur l'image ou ajouter
bouton zoom x2 et zoom x3 ». Beides ist gebaut: das Bild öffnet sich mit **×2**, und drei Knöpfe
**1× / 2× / 3×** lassen wählen.

- Die Vergrößerungsplatte (`#imageModalCtn`) hat jetzt unten eine schwebende **Zoomleiste**
  (`#imageZoomBar`) mit den Knöpfen 1×, 2×, 3×; der aktive Knopf ist indigofarben.
- `window.SofiaImageZoom`: Vorgabe ×2, **im Speicher behalten** für spätere Öffnungen, Grenzen 1 → 4.
- **Mausrad** auf der Platte: ±0,5 je Raste (1 → 4). **Doppelklick** auf das Bild: ×1 ↔ ×2.
- **Ziehen** zum Verschieben, wenn das Bild größer als der Rahmen ist (Maus oder Finger, Pointer
  Events mit Zeigerfang); **zwei Finger = Zwickgriff** (der Zoom folgt dem Abstandsverhältnis), aus
  jeder Stufe möglich.
- Beim Öffnen geht die Verschiebung auf null zurück (das nächste Bild ist nie verschoben), der Zoom
  bleibt. `overflow:hidden` auf der Platte und `touch-action:none` auf dem Bild.

Geprüft in der laufenden Seite: Öffnung bei `translate(0px, 0px) scale(2)`, Knopf 2× aktiv;
`setImageZoom(3)` → `scale(3)`; `setImageZoom(1)` → `scale(1)`; Doppelklick → zurück zu ×2;
synthetisches Ziehen → `translate(60px, 40px) scale(2)`; synthetischer Zwickgriff (Abstand 100 → 300)
von ×1 → `scale(3)`. Bilder angesehen: `scratch/shots/v264-zoombar2.png` und
`scratch/shots/v264-modal.png`. `SelfUpdate.verify()` → **48 Dateien, 0 verändert**. Keine
`perchanceError`, kein `syntaxError`. Nur `index.html` geändert – kein `src/*.js`, kein Hash.
Vollständig: README §162.

## 34. Nachtrag (Runde 265): der Heraus-Zoom ×0.5 (2026-09-23)

Wunsch des Nutzers: « ... ajoute x0.5 » – zusätzlich zu den Knöpfen ×2 / ×3 und dem Öffnungs-Zoom ×2
(Runde 264) gibt es jetzt einen **Knopf ×0.5**, um unter die natürliche Größe zu verkleinern.

- Die Zoomleiste (`#imageZoomBar`) hat jetzt **vier Knöpfe**: **0.5× / 1× / 2× / 3×**; der aktive
  Knopf ist indigofarben.
- `window.SofiaImageZoom`: untere Grenze von 1 auf **0.5** gesenkt (`MIN = 0.5`, `MAX = 4`). Damit
  ist das Verkleinern auch per **Mausrad** (±0,5 je Raste) und per **Zwickgriff** (Verhältnis der
  Fingerabstände) erreichbar.
- Die Schwelle „ist das Bild größer als der Rahmen?“ ging von ×1 auf **×0.5**: bei ×0.5 kein
  Verschieben, Zeiger `default`, Verschiebung auf null; darüber wie bisher Ziehen mit `grab`.
- **Doppelklick** bleibt ×1 ↔ ×2; die Öffnungsstufe bleibt **×2**.

Geprüft in der laufenden Seite: Öffnung bei `translate(0px, 0px) scale(2)`, Knopf 2× aktiv;
`setImageZoom(0.5)` → `scale(0.5)`, Zeiger `default`, Knopf 0.5× aktiv; danach ×1 und ×2 korrekt;
synthetisches Ziehen bei ×0.5 ohne Wirkung, bei ×2 → `translate(80px, 60px) scale(2)`. Bilder
angesehen: `scratch/shots/v265-zoombar.png` und `scratch/shots/v265-zoombar-mobile.png` (390 px:
Leiste 236 px breit, zentriert, kein Überlauf). `SelfUpdate.verify()` → **48 Dateien, 0 verändert**.
Keine `perchanceError`, kein `syntaxError`. Nur `index.html` geändert – kein `src/*.js`, kein Hash.
Vollständig: README §163.

## 35. Nachtrag (Runde 266): Naver als Suchmaschine entfernt (2026-09-23)

Wunsch des Nutzers: « enlève naver comme moteur de recherche merci ».

- `App.WebExtra.engines` ist **leer**: Naver wird nicht mehr registriert (die Zeile
  `App.WebExtra.register({ name: "Naver", … })` samt Kommentar ist weg).
- Mit ihm gingen `_parseNaver`, `_NAVER_SELF` und `_NAVER_AD`.
- `App.WebExtra.wrap()` **bleibt**: Websuche, Quellenprüfung und Mathesuche laufen weiter über die
  Hülle, die jetzt nur noch die Motoren aus `src/websearch.js` durchlässt. Ein neuer Motor wäre
  eine Zeile `App.WebExtra.register({ name, parse, url })`.
- Als generisches Werkzeug bleiben (heute unbenutzt): `_gt`/`GT`, `_hangul`, `_parseReader`,
  `_readRendered`, `_filter`.

Geprüft in der laufenden Seite: `engines` → `[]`; `all("test", 3)` → `0`; `_parseNaver` →
`undefined`; `__extraWrapped` → `true`; echte Suche `WebSearch.search("théorème de Rolle", {results:4})`
→ **4 Treffer**, `engines: ["Wikipedia","Ecosia"]`, `failed: false`, keine `[Naver]`-Zeile in der
Konsole. Keine `perchanceError`, kein `syntaxError`, `SelfUpdate.verify()` → **48 Dateien, 0 verändert**.
Nur `index.html` geändert – kein `src/*.js`, kein Hash. Vollständig: README §164.

## 36. Nachtrag (Runde 267): der Tonverlust der Sprachausgabe (2026-09-23)

Meldung des Nutzers: « j'ai souvent une perte de son de la synthèse vocale ».

**Ursache.** Die Browser-Engines (Chrome, Edge, Android) **schneiden einen Sprechauftrag nach etwa
fünfzehn Sekunden Rede ab** – lautlos, ohne Fehler und ohne `end`. Bis dahin bekam die Synthese eine
**ganze (lange) Phrase** und auf dem Weg der **Lautsprechertaste** (`speak()`) sogar die **ganze
Antwort als ein einziger Auftrag**. Genau daher kam der Tonverlust.

**Was sich geändert hat (`src/voice.js`).**
- Neues **`_chunkSpeech()`**: jeder Text wird vor der Synthese begrenzt (**MAX_SPEECH_CHARS = 180**),
  geschnitten bevorzugt am Satzende, sonst an einem Satzteilzeichen, sonst am letzten Leerzeichen.
- **`_enqueueSentence()`** schickt jede Phrase durch diese Teilung – der ganze **Stream-Weg** profitiert.
- **`speak()`** spricht nicht mehr alles auf einmal, sondern **Stück für Stück**, jedes mit Wiederholung,
  Wächter und – was hier völlig fehlte – dem **Weiterlaufen** (`resume()`-Nudge alle 4 s).
- Der Wächter **verlängert**, solange die Engine noch spricht, und schneidet erst nach drei Verlängerungen.
- **90 ms Ruhe** vor `speak()` gegen das `cancel()`→`speak()`-Rennen.
- Eine **Generation `_speakGen`** (plus Flag `finished`) beendet die Schleife sofort bei `stop()`.

**Geprüft** in der laufenden Seite, instrumentiert und **stumm (volume 0)**, Tempo 2: `speak()` auf
241 Zeichen → `morceaux=2`, Ablauf `début entier 1/2` → `prolonge` → `début entier 2/2` → genau
**ein** `terminé 2 morceau(x)`; `speakRemainder()` → Stücke 32/160/27/37 Zeichen in Reihenfolge;
1935 Zeichen → **12 Stücke**, längstes **178**. `SelfUpdate.verify()` →
**`{ok:true, checked:48, changed:[], unstamped:[]}`**. Keine `perchanceError`, kein `syntaxError`.
Nur `src/voice.js` geändert (dazu `build.json`, `README.md`, `KNOWLEDGE.md`, `history.enc`).
Vollständig: README §165.


## 37. Nachtrag (Runde 268): der Szenenfaden – die Kontinuität eines langen Rollenspiels (2026-09-23)

**Was Sofia jetzt wirklich kann.** Bei einem **Rollenspiel-Brief** (ein langer Brief mit « jeu de
rôle », « scénario », « mise en scène », « tu joueras », « incarne » …) legt die App **selbst** einen
**Szenenfaden** an (`App.Scene`, pro Sitzung in `session.scene` gespeichert): sie **besetzt die Szene
ein einziges Mal** über einen internen Aufruf (N verschiedene Frauen mit Name, Aussehen, Stimmung,
N aus dem Brief, sonst 8) und liest die **Dauer** (« pendant 6 heures » → 360 Minuten). Danach führt
sie **Reihum und Uhr** selbst: jede Antwort gehört einer Frau, wer zwei Antworten lang dran war, gilt
als fertig, die Uhr folgt dem Fortschritt, und wenn alle durch sind, endet die Soirée – die Szene
kann **nicht mehr neu beginnen und nicht mehr stehenbleiben**. Im Prompt steht jede Runde ein
Register mit Ort, Zeit, Besetzung, den Schon-Dagewesenen, der Kommenden und ausdrücklich dem Hinweis,
dass **die übrigen Gäste wirklich im Raum sind** und hörbar werden müssen. Die Besetzung samt
Anweisungen kommt als englischer Block; das Modell darf sie über eine Registerzeile
(`[SOFIA_SCENE]{…}[END_SOFIA_SCENE]`) fortschreiben, die die App aus dem sichtbaren Text entfernt.

**Nachholen.** War der Brief schon vor dem Faden da (der gemeldete Fall), findet die App ihn beim nächsten Turn selbst in den Nachrichten und legt den Faden dann an.

**Grenzen.** Die Besetzung entsteht einmal beim Brief; ein **neuer** langer Rollenspiel-Brief ersetzt
sie. « Arrête le jeu de rôle » o. Ä. schließt den Faden. Bei aktiven Modi (Schach, Mentor, RPG, Void)
schaltet sich der Faden **nicht** ein. Während eine Szene läuft, sind die Web-Werkzeuge (Direktsuche,
Quellenprüfung, Mappen-Suche, Web-Blöcke) **aus** – eine Soirée wird nicht im Netz nachgeschlagen.
Die App stellt die Besetzung selbst: sie ist kein Vorschlag des Modells, sondern gehaltene Wahrheit,
und die Anweisung im Prompt verbietet ausdrücklich, die Szene zu wiederholen oder neu zu eröffnen.


## 38. Nachtrag (Runde 269): in einer Szene wird nichts geprüft (2026-09-23)

Wunsch des Nutzers: « non tu ne valides rien en scénario ». Während eine Szene läuft, sind Sofias
Prüf- und Beleg-Werkzeuge **aus**: der Quellenprüf-Block (`SOURCE_PROMPT`) kommt nicht mehr in den
Prompt, der Marker `[SOFIA_FACTCHECK]` löst keine echte Prüfung mehr aus, und die
Hintergrund-Recherche ist bewacht. Das Szenenregister trägt die Regel ausdrücklich: nichts ist zu
prüfen, nichts zu belegen – keine Quelle, kein « ich bin nicht sicher », keine Warnung, kein
Vorbehalt, keine Einschränkung innerhalb der Szene, und kein Austreten aus der Szene, um sie zu
kommentieren oder Bestätigung zu erbitten. Sie entscheidet, und die Szene läuft weiter.
Außerhalb einer Szene bleibt alles wie zuvor: dort wird weiter geprüft und belegt.

## 39. Nachtrag (Runde 270): eine Szene ist keine Erinnerung (2026-09-24)

Wunsch des Nutzers: « tu ne valides pas une telle scène en mémoire c'était pour te montrer ». Eine
Rollenspiel-Szene ist **kein Gedächtnis**. Jede Nachricht einer Szene trägt `scene: true` (gesetzt in
`App.UI.addMessageToHistory`, und für den grundlegenden Brief in `App.Scene.tagFounded`), und keine
Schicht nimmt sie auf: der semantische Index und das Archiv (`src/memory.js`), der Gedächtniskern
(`src/memstruct.js`), das innere Journal (`src/inner.js`) und Sofias stehendes Skript
(`src/selfscript.js`) filtern auf diesem Merkmal; die Zusammenfassung schweigt, solange eine Szene
läuft, und schreibt nichts, wenn nur Szenen da sind (sonst erfindet sie ein Gedächtnis aus dem Profil
des Nutzers). Auch die Marker `[SOFIA_SCRIPT]`, `[SOFIA_LEARN]` und `[SOFIA_HELPER]` werden in einer
Szene nicht mehr ausgeführt.

`App.Scene.sweep()` (einmal beim Start, nach der Wiederherstellung der aktiven Sitzung) und
`App.Scene.purgeMemory()` löschen, was eine Szene bereits hinterlassen hatte: Zusammenfassungen,
Gedächtniskern, Index, Journal und die aus der Szene entstandenen Konsultationen. Der Merker
`session.sceneMem.upTo` wird mit der Sitzung gespeichert, damit dieselbe Szene nur einmal gereinigt
wird — eine neue Szene weiter unten in der Geschichte greift wieder. Die sichtbare Geschichte bleibt
unberührt; die Karte « Mémoire et intelligence » trägt die Regel sichtbar.

Sofias stehendes Skript (v37) enthält Spuren dieser Szene und wurde **nicht** angerührt — es ist ihr
Charakter, und nur der Nutzer entscheidet darüber. Künftig kann keine Szene es mehr schreiben.

## 40. Nachtrag (Runde 271): « pas de note de cette scène » — keine Notiz aus einer Szene (2026-09-24)

Der Nutzer hat entschieden: **« pas de note de cette scène »**. Runde 270 hatte die Szene aus allen
Gedächtnisschichten entfernt; Sofias **stehendes Skript** (`src/selfscript.js` — ihre eigene, selbst
geschriebene Notiz, die bei jeder Antwort mitgeht) trug aber noch die Spuren: v37, 606 Zeichen, über
« lexique sensoriel enrichi », « réaction physiologique associée (tension musculaire, variations
thermiques, réponses nerveuses) » und die « états physiologiques et émotionnels der Figuren, mit der
verstrichenen Zeit des Szenarios synchronisiert ». Sie stammte vollständig aus dem Rollenspiel und
wurde auf Wunsch **gelöscht**.

**Warum ein bloßer Szenen-Garde nicht genügt.** Ein im Chat gespieltes Rollenspiel öffnet nicht
zwangsläufig einen Szenenfaden: in der Sitzung des Nutzers war `App.Scene.active()` **falsch**, obwohl
alle 62 Nachrichten `scene: true` tragen. Wer nur den Faden prüft, lässt genau den echten Fall durch.

**Gebaut.** Ein einziges Schloss, `noteLock(session)`, an den drei Stellen, die die Notiz schreiben
können (`observe` = automatischer Durchgang, `runPass` = Knopf und interner Durchgang, `handleMarkers` =
ihr eigener `[SOFIA_SCRIPT]`-Block). Es gibt zwei Gründe zurück: `'scene'` (Faden offen) und
`'scene-only'` (weniger als sechs Nachrichten, die **nicht** aus einer Szene stammen — `usableCount`).
Der zweite Grund hängt nicht am Faden und bleibt auch **nach** dem Ende der Szene wahr; deshalb kann
eine reine Spiel-Sitzung nie eine Notiz erzeugen, und das Loch, durch das die v37 entstand, ist zu.
Abgelehnt wird ohne jeden Modellaufruf, und ein `[SOFIA_SCRIPT]`-Block wird trotzdem aus dem sichtbaren
Text entfernt (nur nicht angewendet). Neu: `App.SelfScript.clearScene()` löscht die Notiz vollständig —
Text, Stücke, Version **und** das Journal samt Rückweg (sonst brächte « zurück zur vorigen Version »
genau die Szenen-Notiz zurück). `clear()` kennt dafür `{silent}`. Die Beschriftungen
`selfScriptSceneCleared` / `selfScriptSceneLocked` stehen in fr/en/de/es/it (`src/i18n.js`).

**Nach der Nullstellung.** Gelöscht heißt nicht für immer leer: beim nächsten Laden übernimmt `loadBaked`
die im Generator eingebackene Fassung (v6, 464 Zeichen, Runde 96, über Nachrichten mit geringer Entropie),
weil sie neuer ist als die lokale Null — dieselbe Notiz, die jeder neue Besucher bekommt, und ohne jede
Spur der Szene. Der Rückweg bleibt leer, die Szenen-Notiz ist also nicht wiederherstellbar.

**Verifiziert.** Testsitzung angelegt und gelöscht (Sitzung des Nutzers danach wiederhergestellt), Modell
durch Konserven ersetzt: außerhalb einer Szene schreiben Durchgang (v1) und Marker (v2) normal weiter;
bei reiner Szenen-Materie `'scene-only'` und bei offenem Faden `'scene'` — Durchgang abgelehnt, Marker
ignoriert, Version stabil, **kein Modellaufruf**. `SelfUpdate.verify()` → 48 Dateien, 0 verändert;
`src/build.json` steht auf **v271**.

## 41. Nachtrag (Runde 272): spielen ja — aber nichts davon in ihrem Skript (2026-09-24)

Der Nutzer: **« Je peux jouer cette scène avec elle mais elle ne doit pas figurer dans son script »**.
Runde 271 hatte alle Schreibwege in Sofias stehendes Skript verschlossen. Runde 272 macht das Spielen
selbst unbedenklich und schließt zwei Lecks, die erst beim echten Durchspielen sichtbar wurden.

**Befund (Szene wirklich durchgespielt, mit Konserven-Antworten).** (1) Die Antwort, die eine Szene
*schließt*, war nicht markiert: sie wird geschrieben, während die Szene noch offen ist, aber erst nach
ihrer Schließung gespeichert (der Szenen-Marker wird vor dem Speichern verarbeitet) — `App.Scene.active`
war da schon falsch, und der letzte Austausch der Fiktion blieb erinnerbar. (2) Ein Gedächtniskern, der
aus einer **anderen** Sitzung übrig war (`aa124545…`, dieselbe Partie, inzwischen gelöscht), hielt
Episoden, Fakten (« sechs Stunden », « zwanzig Frauen ») und ein Gefühl bereit. `learningsText` liefert
Fakten und Gefühle **aus allen Sitzungen** — damit stand die Szene weiterhin in der Materie, aus der
Sofia ihre Notiz schreibt. Genau das, was nicht sein soll.

**Gebaut.** Während gespielt wird, ist die Notiz **geschlossen**: sie wird weiterhin gezeigt (sie ist ja
sie selbst), aber die **Einladung, sie umzuschreiben, verschwindet** und wird durch einen Satz ersetzt
(« closed for the duration … nothing of what is played may enter it »); ein trotzdem ankommender
`[SOFIA_SCRIPT]`-Block wird aus dem sichtbaren Text entfernt und nicht angewendet (Log:
`note rewrite ignored (scene-only, 1 block(s))`). Beim Schließen eines Fadens — Stoppbefehl oder letzte
Figur fort — setzt `App.Scene._close()` `tagPending` und `tagRun()` markiert alles seit dem Brief
(`briefIdx`); das nächste gespeicherte Element bekommt die Marke, dann ist das Flag verbraucht (ein
Flag aus einem abgebrochenen Zug wird zu Beginn des nächsten Zuges gelöscht). `App.Scene.sweep()`
reinigt nicht mehr nur die laufende Sitzung, sondern **jede Sitzung, in der eine Szene gespielt wurde**.
Der verwaiste Kern (`aa124545…`) wurde gepurged: 4 Knoten, 1 Kette — Kern leer, `learningsText` leer,
`contextBlock` leer, kein IndexedDB-Rest.

**Verifiziert.** Szene durchgespielt: Faden steht (3 Figuren), Notiz gezeigt und geschlossen, Marker
ignoriert, Version stabil, Notiz unverändert; die schließende Antwort trägt die Marke; Stoppbefehl
ebenso. `buildInstruction` der Sitzung des Nutzers → **0 Szenenwörter**; `SelfUpdate.verify()` →
48 Dateien, 0 verändert. `src/build.json` steht auf **v272**.

## 42. Nachtrag (Runde 273): Speichern wieder möglich — src/ von 29 MB auf 6 MB (2026-09-24)

Der Nutzer meldete (Screenshot der Plattform): **« Couldn't save the src files: upload timed out. Your
generator was NOT saved (code and src files always save together). »** In der Anwendung war nichts
kaputt — der Generator war nur zu groß zum Speichern geworden: `src/` enthielt 296 Dateien und
**29,26 MB**, davon 20,5 MB allein für den Rechtskorpus (24 Kodizes, 89 000 Artikel, Runde 198). Der
Upload überschritt die Frist des Servers, und weil Code und `src/` zusammen gespeichert werden, wurde
gar nichts mehr gespeichert.

**Gebaut.** (1) Der Rechtskorpus wird **außerhalb** des Generators gehostet: die 49 `.gz`-Dateien (24
Volltext-Ordner + 25 Indexe) liegen auf `user.uploads.dev` und werden über **dieselben logischen Pfade**
gelesen; `src/droit/remote.json` (5 KB, im Haus) ist die Übersetzungstabelle, die `App.DroitLookup` vor
jedem Lesen anwendet. Fehlt sie, bleibt der Pfad unverändert und das Modul liest wie früher direkt bei
Legifrance. (2) Die Fiches-Korpora sind **komprimiert**: 137 `.json` der Bereiche Mathematik, Anatomie,
Web, Python, Sexo, Dico, Medikamente, Berufe, alte Schriften, Sprachen, GBD und Code sind `.json.gz`
geworden (4,28 MB → 1,40 MB), gelesen von einem einzigen kleinen Lader `App.Core.loadJson(url)`
(`DecompressionStream`). Die zwölf Memos teilen dieselbe Ladezeile (ersetzt), ebenso die drei
Verzeichnisse (Medikamente, Berufe Studyrama/Onisep, GBD-Blogs). Die acht kleinen Rechtsdateien
(Registry, Notions, Build-Skript) und die Dokumentation bleiben im Haus.

**Ergebnis.** `src/`: **29,26 MB → 6,14 MB**, 296 → 248 Dateien; größte Einzeldatei 911 KB (Vidal-Index,
jetzt komprimiert). **Verifiziert** in der laufenden Seite: alle zwölf Memos mit denselben Zahlen (173/4,
526/28, 678/23, 1060/46, 119/6, 102/9, 55/3, 29/2, 84/8, 30/2, 86/7, 60/3), Medikamenten- und
Berufsverzeichnis unverändert (8 344/15 252/2 265 bzw. 1 497/569), GBD 136 Blogs, Recht: 49 gehostete
Dateien, 24 Kodizes, 2 899 Artikel, Suche „article 1240" erfolgreich, fünf Textkorpora unverändert.
`SelfUpdate.verify()` → 48 Dateien, 0 verändert. `src/build.json` steht auf **v273**.

**Regel für später:** `src/` ist kein Ablageort für Referenzkorpora mehr — Fiches liegen komprimiert
(`.json.gz`, gelesen über `App.Core.loadJson`), große Korpora werden gehostet (wie das Recht), mit ihrer
Tabelle in `src/`.

## 43. Nachtrag (Runde 274): Speichern — die Korpora liegen jetzt ausserhalb (2026-09-24)

**Anlass.** Der Eigentümer meldete ein zweites Mal « Couldn't save the src files: upload timed out ».
Runde 273 hatte `src/` von 29 MB auf 6,15 MB gebracht (Fiches komprimiert); der Upload lief weiter
in die Zeitgrenze des Servers. Gemessen im Browser des Eigentümers: ~630 KB/s in der Gegenrichtung —
also bleibt nur, `src/` klein zu halten, und die **Zahl der Dateien** zählt mit (248).

**Was jetzt wo liegt.**

| Was | Wo | Übersetzung im Code |
|---|---|---|
| 137 Fiches der zwölf Bereiche + Verzeichnis-Indizes (Vidal, Studyrama/Onisep, GBD-Blogs, `corpus-index.json`) | gehostet (user.uploads.dev) | `src/remote.json`, angewandt in `App.Core.loadJson` |
| Rechtskorpora (49 Dateien) + sieben Notions-Fiches + `codes-index.json` | gehostet | `src/droit/remote.json`, angewandt in `App.DroitLookup._json` |
| Projektgeschichte (`docs/history.enc`, 745 KB) | gehostet | Adresse in `README.md` §1 |
| Logo-Quellbild (`brand/logo-source-gradient.png`, 816 KB) | gehostet | Adresse in `README.md` §172 |
| README §9–§171 | `src/docs/README-full.md.gz` (im Haus, 314 KB) | Rezept in `README.md` §1 |
| Module, `build.json`, kleine Einstellungen, `KNOWLEDGE.md`, `CORPUS.md`, `SCENE-PROTOCOL.md` | im Haus | — |

**Nebenbei repariert.** `App.SourceGuard._loadLegal` holte `src/droit/numbers-index.json.gz` **direkt**,
obwohl die Datei seit Runde 273 gehostet ist — die Karte der Artikelnummern blieb leer. Jetzt läuft
sie über `DroitLookup._json`: **68 661 Nummern** sind wieder da.

**Ergebnis.** `src/` 6,15 → **2,31 MB**, 248 → **91 Dateien**; was beim Speichern geht (index.html
2,0 MB + main.pjs + src/) ~8 → **~4,3 MB**. Geprüft in der laufenden Seite: dieselben Zahlen wie in
§42 (173/4, 526/28, 678/23, 1060/46, 119/6, 102/9, 55/3, 29/2, 84/8, 30/2, 86/7, 60/3;
8 344/15 252/2 265; 1 497/569; 136 Blogs; fünf Textkorpora 52/112/215/310/997; 24 Kodizes, 2 899
Artikel, „article 1240" mit Volltext), `SelfUpdate.verify()` 48 Dateien / 0 verändert, `build.json`
steht auf **v274**, kein `perchanceError`.

**Nächster Hebel, falls das Speichern erneut scheitert:** die grössten Module auslagern (`i18n.js`
207 KB, `professions-data.js` 214 KB, `chess.js` 75 KB, `enc-tool.js` 63 KB) — das berührt
`__ATELIER_PATHS`, die Verschlüsselung des Modulgraphen und `SelfUpdate`.

## 44. Nachtrag (Runde 275): GitHub als Spiegel — der Lader hat einen Notausgang (2026-09-24)

Der Eigentümer fragte, ob GitHub als Ablage dienen kann. **Ja**: `raw.githubusercontent.com` und
jsDelivr antworten mit offenem CORS (in der laufenden Seite geprüft), eine Korpusdatei liest sich
dort genau wie auf `user.uploads.dev`.

**Was steht.** `src/remote.json` kennt jetzt ein Feld **`mirror`** — entweder eine **Basis**
(`https://cdn.jsdelivr.net/gh/<Konto>/<Repo>@<Commit>/`, an die der logische Pfad einfach angehängt
wird) oder eine **Tabelle** Pfad -> Adresse. `App.Core.openJson` versucht zuerst die Hauptadresse
und **nur bei Fehlschlag** den Spiegel; der erste Erfolg wird für die Sitzung gemerkt (`_remHit`),
damit eine tote Adresse nicht bei jedem Abruf neu anläuft. `App.DroitLookup._json` benutzt denselben
Öffner, das Rechtskorpus ist also mit abgedeckt. **Ohne `mirror`-Feld ändert sich nichts** — das
Verhalten bleibt genau das der Runde 274.

**Das Miroir-Paket** (die ganze gehostete `src/…`-Baumstruktur: 149 Korpus-/Indexdateien, die acht
Rechtsdateien dieser Runde, das Rechtskorpus, die Projektgeschichte, die volle README) wurde dem
Eigentümer als Archiv zum Ablegen in ein öffentliches Repo übergeben. Im Code ist **nichts** zu
ändern: sobald das Repo existiert, genügt die Basis in `src/remote.json`, z. B.
`"mirror": "https://cdn.jsdelivr.net/gh/<Konto>/<Repo>@<Commit>/"`.

**Geprüft (live).** Der Notausgang wurde echt probiert: zwei Hauptadressen wurden absichtlich
gebrochen (eine Python-Fiche und die Nummernkarte des Rechts) — die Seite lud weiter, mit klarer
Warnung (`[LoadJson] … HTTP 404 — essai du miroir : …`), das Python-Memo blieb bei **1060/46
Sektionen**, die Nummernkarte bei **68 661 Nummern**, beide über den Spiegel geholt und für die
Sitzung gemerkt. Danach wurden beide Tabellen wieder in Ordnung gebracht (0 kaputte Adressen);
alles andere unverändert, `SelfUpdate.verify()` 48 Dateien / 0 verändert, `build.json` **v275**.

**Ehrliche Einschränkung.** `raw.githubusercontent.com` ist kein CDN (manche Netze blocken es),
jsDelivr begrenzt auf 20 MB pro Datei; ein öffentliches Repo macht die Korpora für jeden lesbar
(sie sind es ohnehin schon). Der Spiegel bleibt deshalb **Reserve**, nicht Hauptadresse.
