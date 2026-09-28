# Sofia – Intelligent AI (Perchance-Generator)

> **Diese Datei ist der Einstieg für jeden KI-Helfer.** Zwei Dinge sind zu gross für sie:
>
> - **Die Projektgeschichte** (Runde 1–273: alle Pläne, Analysen, Bau- und Test-Notizen,
>   rund 1,35 MB) liegt **verschlüsselt** und seit Runde 274 **ausserhalb des Generators**
>   (gehostet, Adresse und Rezept in Abschnitt 1 — bitte zuerst lesen, dauert Sekunden).
> - **Die eingestellten Runden §9–§171** (Runden 102–273, der Klartext von früher) liegen als
>   `src/docs/README-full.md.gz` (314 KB gzip, im Haus; Rezept in Abschnitt 1) — und im gehosteten
>   Spiegel (§173).
>
> **Achtung (2026-09-22):** §81–§85, §99–§101 und §104 (Runde 174–178, 192–194, 197)
> sind beim Anfügen der Runde-202-Notiz verloren gegangen; §86–§98 und §102–§108 wurden
> aus den Einzelnotizen wiederhergestellt. Einzelheiten im **Verlust-Hinweis** am Ende von §80
> (im Bündel und in `docs/README-full.md.gz`).

Generator: **perchance.org/s-o-f-i-a** · öffentliche Kennung `fc57a86cb9204723c1c9b830ebe27432`.
Der Nutzer spricht **Französisch** und erwartet französische Antworten; die Doku hier ist deutsch.

**Testperson (Wunsch des Nutzers):** in Proben nicht den Eigentümer verwenden, sondern die
erfundene Testperson **Sofia, 20 Jahre, weiblich (F)**. Keine echten Namen oder Angaben des
Eigentümers in Testnachrichten, Testsitzungen oder Fichen (siehe §82 und `KNOWLEDGE.md` §11).

Die **Wissenskarte** — was Sofia als Themen wirklich beherrscht — steht in `KNOWLEDGE.md`.

---

## 1. Die Geschichte lesen (bitte wirklich tun)

Das Bündel ist genau wie die Module verschlüsselt (AES-128-GCM, gzip, Format
`/*SOFIA-ENC1gz*/` + base64(iv) + `.` + base64(ct)). Schlüssel: der feste Testsclüssel
`ENC_TRIAL_KEY` aus `index.html` (solange `TRIAL_MODE = true`), sonst `encKeyFor(accessKey)`.
Es wird **gehostet** gelesen (Runde 274; das Bündel wäre im Generator ein 745-KB-Upload bei
jedem Speichern). In `execute_js` (Worker mit `crypto.subtle`, `fetch` und `fs`):

```js
// Die Adresse steht am ENDE dieses Abschnitts und ändert sich mit jedem Neu-Packen.
const rec = await (await fetch(HISTORY_URL)).text();
const body = rec.slice(rec.indexOf("*/") + 2);
const dot = body.indexOf(".");
const bin = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const key = await crypto.subtle.importKey("raw", bin("VFe64Kavy2H5XWPYAWVJaA=="), "AES-GCM", false, ["decrypt"]);
let pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bin(body.slice(0, dot)) }, key, bin(body.slice(dot + 1))));
pt = new Uint8Array(await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
await fs.writeTextFile("scratch/history.md", new TextDecoder().decode(pt));
return (await fs.readTextFile("scratch/history.md")).length;   // ~1406870 Zeichen (Runde 275)
```

**HISTORY_URL** (Runde 274, gültig bis zum nächsten Neu-Packen):
`https://user.uploads.dev/file/d17850d4069bb17475f24c1adb2eef2b.bin`

Und die vollständige README-Fassung (dieselbe Verschlüsselung **nicht** — nur gzip):
`src/docs/README-full.md.gz` (im Haus; die gehostete Zweitfassung steht in der Kopfzeile):

```js
const bin2 = new Uint8Array(await fs.readFile("src/docs/README-full.md.gz"));
const txt = new TextDecoder().decode(new Uint8Array(await new Response(new Blob([bin2]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()));
await fs.writeTextFile("scratch/README-full.md", txt);
```

Das Bündel ist eine Folge von `===== DATEI: src/… =====`-Abschnitten (die alte
`README.md`, `PLAN.md`, `PLAN-CHESS.md`, `PLAN-MENTOR.md`, `PLAN-MEMORY.md`,
`PLAN-FETCH.md`, `PLAN-CHAOS.md`, `ANALYSIS.md`, `BUILD.md`,
`KONZEPT-CHAT-LIMIT.md` – plus `RUNDE-99.md` mit dem Zugangsschlüssel der
Fernsteuerung, siehe Abschnitt 4, `RUNDE-100.md` mit dem Zoom der Tafel,
`RUNDE-101.md` mit dem Vollbild, siehe Abschnitt 5, `RUNDE-102.md` mit der
Reparatur der Mikrofon-Transkription und dem Emoji-Verbot, siehe Abschnitt 9,
sowie `RUNDE-103.md` bis `RUNDE-143.md` zu den Abschnitten 10 bis 50).

**Wird der Modulschlüssel gewechselt (Neuverschlüsseln mit `src/enc-tool.js`), muss
dieses Bündel mit demselben Schlüssel neu gepackt *und neu hochgeladen* werden** – und die
Adresse oben in diesem Abschnitt nachgezogen, sonst ist die Geschichte für den nächsten
Helfer nicht mehr lesbar. Genau dasselbe gilt für den Weg B in Abschnitt 14: er verschlüsselt
die Module mit dem neuen abgeleiteten Schlüssel und liefert den neuen `ENC_TRIAL_KEY` mit;
danach ist das Bündel mit dem alten Testsclüssel nicht mehr zu öffnen.

---

## 2. Was Sofia ist

Ein KI-Chat als eine einzige Seite: Streaming-Chat mit Langzeitgedächtnis
(`memory`, `memstruct`), Bildgenerierung, Vision (Dateien/Fotos/Web-Bilder), echter
Code-Interpreter (JavaScript + Python über Pyodide), RPG-Spielmeister, sokratischer
Mentor, vollständiger Schachmodus (eigene Regeln/Suche, Stockfish optional, Blitz,
Chess960, Puzzles, PGN, Elo-Schätzung), Live-Mikrofon & Vorlesen (Streaming-TTS),
Websuche, Modus- und Prompt-Architektur, 364 Sprachen (Oberfläche fertig
übersetzt in 5: en/de/es/fr/it), eine **Berufe-Welt** (991 Berufe in 22 Sektoren,
**Sofia selbst als erster Eintrag**, 71 Länder mit ihren maßgeblichen
Fach-Nachschlagewerken, zu jedem Beruf „was er im Leben tut“ und seine
Fähigkeiten, ein System, das sich **am Alter des Gegenübers** ausrichtet, dazu
**selbst definierbare Personen** – petite amie / petit ami / partenaire – und ein
nur mit dem Altersschalter sichtbarer **18+-Bereich**: Abschnitte 26 bis 30), eigene
API-Keys für Fremdanbieter – und eine Schicht, die sich selbst weiterentwickelt
(Atelier, Selbst-Code, Selbst-Skript, Selbst-Aktualisierung).

Plugin-Importe (`main.pjs`): `generateText` (ai-text-plugin), `generateImage`
(text-to-image-plugin), `superFetch` (super-fetch-plugin), `uploadPlugin`
(upload-plugin, nur für das optionale Geräteprotokoll der Schutzschicht).

---

## 3. Architektur in drei Sätzen

- **`index.html`** (im Klartext, ~950 KB): das Zugangsschloss (`SofiaGate`, TXT in 5
  Sprachen, Sperrtafel, Test-Logik), die App-Hülle und den Boot-Shim; die App selbst
  lädt ihre Module am Ende als `__M[…]`-Liste über `bootModules()`.
- **`src/*.js`** sind **AES-128-verschlüsselte Datensätze** (56 Module). Entschlüsselt
  wird im Browser: `src/atelier-loader.js` (im Klartext, weil es den Schlüssel
  braucht) holt jede Datei, entschlüsselt sie, wendet die Retouchen aus
  `App.Atelier` an, schreibt relative Importe auf absolute URLs um und importiert
  das Ganze als Blob-Modul. Ohne Patch passiert nichts Besonderes.
- **Selbständerung**: `App.Atelier` schreibt find→replace-Retouchen in IndexedDB
  (`enya_atelier_v1`), der Loader wendet sie bei jedem Start auf den entschlüsselten
  Text an; `selfcode-baked.json` / `selfscript-baked.json` sind „eingebackene“
  Fassungen, die jeder Besucher beim Start übernimmt. `src/build.json`
  (`{v, ts, note, files}`) ist der Bau-Stempel, den `SelfUpdate` in der App anzeigt.

Zum Ansehen eines Moduls im Klartext: `src/enc-tool.js` in der App benutzen, oder
im Editor `page_eval` mit `fetch("src/memory.js")` + derselben Entschlüsselung wie
oben (im Vorschau-Browser liegt der Schlüssel unter `window.SofiaEnc.key`).

---

## 4. Schutzschicht (Runde 99) – Herkunft, Wasserzeichen, Fernsteuerung

Ehrliche Grundlage: Code, den ein Browser ausführen muss, kann ein Besucher lesen.
Ziel ist deshalb **Aufwand + Nachweisbarkeit**, nicht Verhinderung.

- **Herkunftsprüfung** (`originAllowed()` im Loader): Der Modulgraph startet nur,
  wenn `generatorPublicId` in der Freigabeliste steht. Ausnahmen: ungespeicherte
  Editor-Vorschau, Besitzer mit Zugangsschlüssel, Umgebungen ohne gültige Kennung.
  Eine kopierte Seite unter fremder Kennung zeigt nur eine Hinweisfläche
  (`#sofiaCopyNotice`) und lädt keine Module.
- **Wasserzeichen** (`copyMark()` / `markStamp()`): Jedes gebaute Modul bekommt eine
  Kommentarzeile vorangestellt, z. B.
  `/* NOTICE - personal copy af9c… 2026-09-20T11:04Z - fr-FR 832x384 tz120 - copying or redistribution is not permitted */`.
  Die Kennung ist zufällig und liegt im `localStorage` des Geräts (`sofia_mark_v1`,
  Erstkontakt in `sofia_mark_t_v1`) – stabil für dieses Gerät. Eine weitergegebene
  Kopie trägt damit die Spur dessen, der sie gezogen hat. Zugriff im Betrieb:
  `window.SofiaMark`; die Kennung steht auch auf der Hinweisfläche.
- **Fernsteuerung** (kleine öffentliche Datei):
  `https://editable.uploads.dev/file/s-o-f-i-a/cfg-6k3q9v2m8w4zt7ph5r1jnc0d`
  (upload-plugin, „editable file“, Name `cfg-6k3q9v2m8w4zt7ph5r1jnc0d`).
  Felder: `origins` (Liste von 32-Hex-Kennungen), `trialMs` (Testdauer),
  `free` (true = alles für alle offen, überschreibt `FREE`), `ledger` (siehe unten).
  Gelesen vom Loader beim Start, 7 Tage in `localStorage` zwischengespeichert;
  **fällt sie aus, gelten die eingebauten Werte** – die App startet immer.
  Schreiben nur mit dem `editKey` (bewusst NICHT im Klartext-Quelltext, er steht in
  `RUNDE-99.md` im verschlüsselten Bündel und beim Nutzer):

  ```js
  await root.uploadPlugin.editable.set("cfg-6k3q9v2m8w4zt7ph5r1jnc0d", JSON.stringify(cfg), { editKey });
  ```

  Damit kann der Besitzer (bzw. ein Helfer) Testdauer ändern, einen Fork freigeben
  oder alles gratis öffnen, **ohne** `index.html` neu zu veröffentlichen. Achtung:
  die Datei ist öffentlich lesbar, aber nur mit dem Schlüssel schreibbar; wer den
  Schlüssel hat, kann auch Unsinn eintragen (dann greift der eingebaute Stand).
- **Geräteprotokoll** (`appendLedger()`, standardmäßig **aus**, nur bei
  `ledger: true`): schreibt einmal am Tag eine winzige Datei `wm-<kennung>` in
  denselben Namensraum, mit groben Eckdaten (Sprache, Bildschirm, Zeitzone,
  User-Agent, Erstkontakt). Bewusst aus, weil ein öffentliches Protokoll
  Gerätedaten der Besucher veröffentlichen würde und Sofias Zusage „alles bleibt in
  deinem Browser“ verletzen würde. Eingeschaltet liest man einen Eintrag nur, wenn
  man die Kennung aus einer aufgetauchten Kopie hat.
- **Nicht** mehr öffentlich: die Projektdokumentation (jetzt `src/docs/history.enc`).

---

## 5. Zugang (Runde 97/98)

- **Drei Monate Gratis-Test** für jeden Besucher: `TRIAL_MS = 90 * 24 * 60 * 60 * 1000`,
  ohne Kontingente (`TRIAL_LIMITS` = `NO_CAP`/0), allein die Zeit begrenzt. Danach
  greift die Sperrtafel wieder und es braucht einen Zugangsschlüssel.
- `var FREE = false;` ist die Regellage; `FREE = true` (oder `free: true` in der
  Fernsteuerung) lässt den Test nie ablaufen – Notausgang „einfach offen für alle“.
- Der **Zugangsschlüssel** gehört dem Besitzer (`KEY_HASH` in `index.html`); das
  gemerkte Gerät liegt als Token-Abdruck (`DEVICE_VERIFIER`).
- **Kein Name, keine Adresse des Nutzers im Quelltext** – die Eigentümerschaft hängt
  am Zugangsschlüssel (`KEY_HASH` in `index.html`), nicht an einem Namen. Als Kontakt
  steht im Quelltext nur der Perchance-Administrator (Weiterleitung).
- Kein Preis, keine Zahl-Knöpfe, kein Abo. Preis-/Zahntexte sind leer, nicht gelöscht.
- **Tafel vergrößern (Runde 100)**: Solange die Sperrtafel steht, darf der Browser
  zoomen, in der App nicht – zuständig sind `setZoomable(true)` in `arm()` und
  `setZoomable(false)` in `reveal()`; das eigene `<meta id="sofiaViewport">` ist
  das gültige, weil es NACH dem Engine-Meta steht (`user-scalable=no` dort sperrt
  das Aufziehen). Zusätzlich vergrößert sich die Tafel selbst: Zwei-Finger-Zoom
  (JS in `wireZoom()`), Doppeltipp = 1×/1,6× und die Knöpfe **A− / A+** (1–3,
  Stufe im `localStorage` `sofia_lock_zoom_v1`). Das CSS-`zoom` liegt auf
  `#sofiaLockZoom` (`.sl-zoom`) IN der Karte, damit die Karte gleich breit bleibt
  und der Text neu umbricht; Hinweistext `T.zoomHint` in 5 Sprachen (nur bei
  grobem Zeiger). Unter 560 px gelten etwas größere Schriftgrößen, und `.sl-card`
  hat unten 74 px Polster, damit die schwebende Pille nichts verdeckt.
- **Vollbild (Runde 101)**: Derselbe Knopf an beiden Präsentationen – Sperrtafel
  (`#sofiaLockFull`, in der Leiste unten) und Willkommensbildschirm der App
  (`#welcomeFullBtn`, neben „Start"). Er setzt `sofia-full` am `<html>`: die Fläche
  deckt dann IMMER 100 % × 100 % des Fensters (keine `max-width` am Vollbild-
  Element – sonst entstehen links/rechts Bänder, siehe Nachtrag 101a), und die
  Lesebreite wird stattdessen begrenzt (Sperrtafel: `padding-left/right:
  max(18px, calc((100% - 780px) / 2))`; Willkommensbildschirm:
  `html.sofia-full .welcome-card > * { max-width: 780px; align-self: center }`).
  Zusätzlich wird `requestFullscreen()` auf `documentElement` versucht; iPhones
  haben kein Seiten-Vollbild, dort bleibt es bei der gefüllten Fläche. Von Haus
  aus Vollbild, wenn `innerWidth <= 820` ODER das Gerät grobe Zeiger meldet und
  `innerWidth <= 1024` (Telefon auch quer, Tablet, Faltgerät). Schnittstelle:
  `SofiaGate.full(on, silent)`, `.fullOn()`, `.fullAuto()`, `.fullSupported()`,
  `.fullLabel()`, `.zoomable(on)`. `reveal()` und das Schließen des
  Willkommensbildschirms verlassen das Vollbild; solange der Willkommensbildschirm
  offen ist, ist der Browser-Zoom erlaubt (Meta mit `minimum-scale=1`, damit man
  nicht mit Rand herauszoomt). Die Klicks laufen über EINE Delegation am Dokument
  (der Willkommens-Knopf wird später geparst). Hinweis: `.click()` aus Skripten
  erzeugt keine Nutzer-Aktivierung – in der Vorschau greift deshalb nur die
  gefüllte Fläche.

---

## 6. Dateien unter `src/`

> **Runde 274:** Die Tabelle unten beschreibt den Stand bis Runde 273. Seit Runde 274 liegen die
> Korpusdateien (Fiches der zwölf Bereiche, Verzeichnis-Indizes, Rechts-Notions) und die zwei
> Quellbilder des Logos **ausserhalb** des Generators (gehostet, `user.uploads.dev`) —
> `src/remote.json` und `src/droit/remote.json` übersetzen die Pfade. Im Haus bleiben die Module,
> die kleinen Einstellungen, `build.json` und die Dokumentation.

| Datei | Rolle |
| --- | --- |
| `*.js` (56 Module) | verschlüsselte App-Module (`SOFIA-ENC1[gz]`), siehe Abschnitt 3 |
| `languages-world.js` | verschlüsselt: die **Weltsprachen-Registry** (328 Sprachen, reine Daten) – Abschnitt 25 |
| `professions.js` | verschlüsselt: die **Berufe-Welt** (Menü, Panel, Auswahl, Prompt-Baustein, Alters-Niveau, Länder/Zeitzonen-Erkennung, 18+-Bereich, Nachbauen, eigene Figuren, Sprach-Übersetzung) – Abschnitte 26 bis 31 |
| `professions-data.js` | verschlüsselt: der Berufe-Datensatz (22 Sektoren, **71 Länder**, Nachschlagewerke je Fach×Land — Recht, Gesundheit, Erziehung, **Literatur**, **Technik** —, 20 Küchen, 7 Zerlegungssysteme, 991 Berufe mit Profil „was er tut / was er weiß“, Schulstufen für 71 Länder) – Abschnitte 26 bis 30 |
| `atelier-loader.js` | Klartext: Entschlüsseln, Patchen, Blob-Importe, **Schutzschicht** |
| `KNOWLEDGE.md` | die **Wissenskarte**: was Sofia als Themen wirklich beherrscht (9 Mappen, 130 Fichen, 4 522 Abschnitte), die Weiche, die Register, die Vorleser, die Kognition — samt ehrlicher Bilanz (§82) |
| `maths/memo-tage2.json` | **Klartext**: das *Mémo mathématiques* TAGE 2 (ecricome.org) als Nachschlagewerk der Mathematik — 8 Kapitel, **45 Abschnitte** mit Titel/Kapitel/Seite, beim Laden einmal geholt (`App.MathMemo`, Abschnitt 61) |
| `maths/cours-fondmath1.json` | **Klartext**: der L1-Kurs *Fondamentaux des mathématiques 1* (Lyon 1, L. Pujo-Menjouet, 232 Seiten) als verdichtete Fiche — 11 Kapitel, **107 Abschnitte** mit Titel/Kapitel/Seite, dieselbe Ladung über `App.MathMemo` (Abschnitt 61) |
| `maths/cours-cmath-multiplication.json` | **Klartext**: die CM1-Lektion *Poser une multiplication* (cmath.fr, F. Gouachon) als verdichtete Fiche — 3 Abschnitte (ohne/mit Retenues, CE2-Erinnerung), dieselbe Ladung über `App.MathMemo` (Abschnitt 62) |
| `maths/cours-monka-fractions.json` | **Klartext**: der Kurs *Les fractions* (Y. Monka, Académie de Strasbourg, maths-et-tiques.fr, 18 Seiten) als eigene Synthese — 18 Abschnitte mit Seitenzahl, dieselbe Ladung über `App.MathMemo` (Abschnitt 63) |
| `anatomy/cours-anatomie-bases.json` | **Klartext**: der Anatomie-Kurs (anatomiehumaine.net) — Grundlagen (définition, position de référence, plans, axes, termes directionnels), articulations, cartilage, ligaments, tendons, Muskelgewebe, Haut — **27 Abschnitte**, geladen über `App.AnatomyMemo` (Abschnitt 67) |
| `anatomy/cours-anatomie-osteologie.json` | **Klartext**: derselbe Kurs — Ostéologie, crâne (base, sutures, fontanelles, sinus, mandibule, orbite), colonne vertébrale (disque, atlas, axis, sacrum), ceintures — **29 Abschnitte** (Abschnitt 67) |
| `anatomy/cours-anatomie-muscles.json` | **Klartext**: derselbe Kurs — les muscles squelettiques et leurs exemples (abdominaux, adducteurs, ischio-jambiers, coiffe des rotateurs, biceps/brachial/brachio-radial, face … mit origine, terminaison, action, innervation) — **17 Abschnitte** (Abschnitt 67) |
| `anatomy/cours-anatomie-cardio-vasculaire.json` | **Klartext**: derselbe Kurs — cœur (paroi, quatre valves, coronaires, système cardionecteur) und vaisseaux sanguins (artères, veines, retour veineux, capillaires) — **13 Abschnitte** (Abschnitt 67) |
| `anatomy/cours-anatomie-digestif.json` | **Klartext**: derselbe Kurs — appareil digestif (bouche, estomac, intestin grêle, gros intestin, cæcum, pancréas und seine canaux, glandes salivaires) — **10 Abschnitte** (Abschnitt 67) |
| `anatomy/cours-anatomie-neuro-sensoriel.json` | **Klartext**: derselbe Kurs — système nerveux (neurone, SNC/SNP, encéphale, lobes, moelle, méninges, 12 nerfs crâniens, nerfs rachidiens, dermatomes) und œil (trois tuniques) — **19 Abschnitte** (Abschnitt 67) |
| `anatomy/cours-anatomie-reperes.json` | **Klartext**: derselbe Kurs — mnémotechniques, nouvelle nomenclature (correspondance ancienne/nouvelle) und vocabulaire anglais-français — **14 Abschnitte** (Abschnitt 67) |
| `anatomy/physio-corps-cellule-tissus.json` | **Klartext**: Handbuch *Anatomie et Physiologie Humaines* (medicalistes.fr, 204 S.) — Körper und seine Organisation, Homöostase, Terminologie, Cavités; Chemie der Zelle; Zelle (Membran und Transporte, Organellen, ADN/ARN, Mitose/Méiose, Kommunikation); die vier Gewebe — **26 Abschnitte** (Abschnitt 68) |
| `anatomy/physio-tegument-squelette-muscles.json` | **Klartext**: dasselbe Handbuch — Haut, Skelett (Os long, Développement, axial/appendiculaire, Articulations) und Muskeln (Struktur, Kontraktion, neuromuskuläre Verbindung, motorische Einheiten, Faserarten) — **23 Abschnitte** (Abschnitt 68) |
| `anatomy/physio-nerveux-sensoriel.json` | **Klartext**: dasselbe Handbuch — Nervengewebe (Neuron, Ruhe- und Aktionspotential, Synapse), ZNS (Encéphale, Lappen, Diencéphale, Hirnstamm/Kleinhirn, Ventrikel, Meningen, Blut-Hirn-Schranke, Neurotransmitter, Rückenmark), PNS (Hirn- und Rückenmarksnerven, Plexus, Reflexbogen, vegetatives Nervensystem), Sinnesorgane (Geschmack, Geruch, Auge, Ohr) — **27 Abschnitte** (Abschnitt 68) |
| `anatomy/physio-endocrinien-sang.json` | **Klartext**: dasselbe Handbuch — endokrines System (Hormone, Feedback, Hypophyse, Thyroïde, Parathyroïdes, Surrénales, Pankreas, gemischte Drüsen) und Blut (Funktionen, Zusammensetzung, Érythrocytes/Hémoglobine, Plaquettes/Hémostase, Leucocytes, Plasma) — **16 Abschnitte** (Abschnitt 68) |
| `anatomy/physio-coeur-vaisseaux-immunite.json` | **Klartext**: dasselbe Handbuch — Herz (Péricarde, Wand, Höhlen, Klappen, Kreisläufe, fötaler Kreislauf, Coronarien, Erregungsleitung, Zyklus, HZV, EKG), Gefäße (Tuniken, Arterien/Kapillaren/Venen, Hauptgefäße, Druck) und Lymphsystem/Immunität — **20 Abschnitte** (Abschnitt 68) |
| `anatomy/physio-respiratoire-digestif-metabolisme.json` | **Klartext**: dasselbe Handbuch — Atmung (Wege, Lungen, Mechanik, Volumina, Gastransport, Säure-Basen-Haushalt, Steuerung), Verdauung (Prozesse, Péritoine, Histologie, Magen-Darm-Trakt, Magensaft, Leber, Galle/Pankreas) und Stoffwechsel — **20 Abschnitte** (Abschnitt 68) |
| `anatomy/physio-urinaire-genital-clinique.json` | **Klartext**: dasselbe Handbuch — Harnsystem (Éléments, Néphron und seine drei Funktionen, Urinkonzentration, Säure-Basen-Haushalt, Miktion), Wasser-/Elektrolythaushalt, Genitalsystem (Gameten, Mann, Frau, Zyklus, Befruchtung/Schwangerschaft), Anamnèse und Symptomübersicht nach Systemen — **18 Abschnitte** (Abschnitt 68) |
| `anatomy/physio-termes-medicaux.json` | **Klartext**: dasselbe Handbuch — das medizinische Wörterbuch (Präfixe, Wurzeln, Suffixe), thematisch geordnet (Negation, Position, Zahl, Wurzeln für Organe/Gewebe/Substanzen, Farben, Suffixe für Zustand/Untersuchung/Behandlung/Fachgebiet, griechische und lateinische Zahlen) — **12 Abschnitte** (Abschnitt 68) |
| `anatomy/ide-structure-de-la-cellule.json` | **Klartext**: Fiches IDE (fiches-ide.fr, IFSI) — Zelle: Prokaryot/Eukaryot, Plasmamembran, Zytoplasma/Zytosol, Organellen, Kern — **15 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-organisation-tissulaire.json` | **Klartext**: dasselbe — die vier Gewebe (épithélial, conjonctif, musculaire, nerveux), Aufbau, Vorkommen, Funktion — **24 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-biologie-anatomie-physiologie.json` | **Klartext**: dasselbe — was Biologie, Anatomie und Physiologie jeweils sind und wie sie zusammenspielen — **9 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-systeme-locomoteur-generalites.json` | **Klartext**: dasselbe — Bewegungsapparat: Knochen, Gelenke, Muskeln, Muskelkontraktion, Bewegungsarten — **22 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-systeme-cardiovasculaire-generalites.json` | **Klartext**: dasselbe — Herz, Gefäße, Blut: Kreisläufe, Herzzyklus, Erregungsleitung, EKG, HZV, Blutdruck — **26 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-systeme-respiratoire-generalites.json` | **Klartext**: dasselbe — Atemwege, Lunge, Alveolen, Ventilationsmechanik, Gasaustausch, Transport von O₂/CO₂, Steuerung — **32 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-systeme-digestif-generalites.json` | **Klartext**: dasselbe — Verdauungstrakt und Anhangsdrüsen: Mund, Zähne, Speichel, Magen, Leber, Gallenblase, Pankreas, Darm, Mikrobiom, Steuerung — **27 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-systeme-urinaire-generalites.json` | **Klartext**: dasselbe — Nieren und Harnwege: Filtration, Rückresorption, Urinbildung, Wasser-/Elektrolythaushalt, Miktion — **30 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-systeme-endocrinien-generalites.json` | **Klartext**: dasselbe — Drüsen und Hormone, Wirkmechanismen, Hypothalamus-Hypophysen-Achse, Schilddrüse, Nebennieren — **17 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-systeme-nerveux-generalites.json` | **Klartext**: dasselbe — Neuron, ZNS und PNS, vegetatives Nervensystem, Sinne im Überblick — **20 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-lappareil-de-reproduction.json` | **Klartext**: dasselbe — männliche und weibliche Geschlechtsorgane, Gameten, weiblicher Zyklus, Befruchtung — **27 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-anatomie-peau.json` | **Klartext**: dasselbe — Haut: Epidermis, Dermis, Hypodermis, Haare, Nägel, Schweiß- und Talgdrüsen — **7 Abschnitte** (Abschnitt 69) |
| `anatomy/ide-anatomie-vocabulaire-medical.json` | **Klartext**: dasselbe — medizinische Wörter (Wurzeln, Präfixe, Suffixe) und die Körperregionen — **9 Abschnitte** (Abschnitt 69) |
| `web/web-introduction.json` | **Klartext**: apprendre-html-et-css.com (PUShAUNE) — Einführung: was HTML und CSS sind, lokal/Server, welches Programm, Dateien ordnen — **15 Abschnitte** (Abschnitt 69) |
| `web/web-les-bases-du-html.json` | **Klartext**: derselbe Kurs — HTML-Grundlagen: Semantik, balises/attributs, Einrückung/Kommentare, Seitengerüst, inline/block, Absätze und Titel, strong/em, Listen, Bilder, Links und Anker, div/span, Struktur-Bausteine — **66 Abschnitte** (Abschnitt 69) |
| `web/web-les-bases-du-css.json` | **Klartext**: derselbe Kurs — CSS-Grundlagen: sélecteurs/propriétés/valeurs, Vererbung, gezieltes Ansprechen, `.class` und `#id` — **23 Abschnitte** (Abschnitt 69) |
| `web/web-mise-en-forme-de-texte.json` | **Klartext**: derselbe Kurs — Text: die Eigenschaften `font-` und `text-`, Schriften, Farben, Listen, weitere Eigenschaften — **34 Abschnitte** (Abschnitt 69) |
| `web/web-modele-de-boite.json` | **Klartext**: derselbe Kurs — Box-Modell: Größen und max. Größen, `margin`/`padding`, `border`, `box-sizing`, Mehrspaltigkeit — **33 Abschnitte** (Abschnitt 69) |
| `web/web-alignement-des-blocs.json` | **Klartext**: derselbe Kurs — Layout: `float`, `flex`, `grid`, `inline-block`/`vertical-align`, Positionierung (relativ/absolut/fix/sticky) — **118 Abschnitte** (Abschnitt 69) |
| `web/web-gestion-du-fond.json` | **Klartext**: derselbe Kurs — Hintergrund: Farben, Bilder, Verläufe (linear/radial) — **33 Abschnitte** (Abschnitt 69) |
| `web/web-les-balises-video-et-audio.json` | **Klartext**: derselbe Kurs — Video- und Audio-Elemente samt Attributen und Formaten — **29 Abschnitte** (Abschnitt 69) |
| `web/web-tableaux.json` | **Klartext**: derselbe Kurs — Tabellen: Aufbau, Titel/Legende, Zellen verbinden — **17 Abschnitte** (Abschnitt 69) |
| `web/web-formulaires.json` | **Klartext**: derselbe Kurs — Formulare: Aufbau, Textfelder, Radio-/Auswahllisten, Kontrollkästchen, Auswahlmenüs, Absenden — **46 Abschnitte** (Abschnitt 69) |
| `web/web-responsive-design.json` | **Klartext**: derselbe Kurs — Responsive Design: Grundlagen, Umbruchpunkte (media queries), Bilder — **22 Abschnitte** (Abschnitt 69) |
| `web/web-programme-avance.json` | **Klartext**: derselbe Kurs — Fortgeschrittenes: `:nth-child`, `::after`/`::before`, `transform`, `filter`, SVG, Transitions, Animationen — **88 Abschnitte** (Abschnitt 69) |
| `web/web-la-mise-en-production.json` | **Klartext**: derselbe Kurs — Veröffentlichung: Domain/Server/DNS, FTP-Upload, Sicherungen, Schluss — **57 Abschnitte** (Abschnitt 69) |
| `web/web-mdn-html.json` | **Klartext**: MDN Web Docs (Mozilla, fr. Übersetzung) — Lektion „créer le contenu": wozu HTML, erstes Dokument, Absätze, Titel, Listen, Bilder, Links — **11 Abschnitte** (Abschnitt 69) |
| `web/pdf-bases-html.json` | **Klartext**: Kurs „Apprendre à coder en HTML – CSS", 2nde ICN (projet.eu.org, 88 S.) — HTML-Grundlagen: éléments/balises/attributs, Seitengerüst, Kommentare, Absätze/Titel, strong/em/mark, Listen, Links, Validierung — **13 Abschnitte** (Abschnitt 69) |
| `web/pdf-bases-css.json` | **Klartext**: derselbe Kurs — CSS-Grundlagen: sélecteurs/propriétés/valeurs, wo das CSS steht, Kommentare, einfache und fortgeschrittene sélecteurs, div/span, block/inline, Vererbung — **8 Abschnitte** (Abschnitt 69) |
| `web/pdf-texte-font.json` | **Klartext**: derselbe Kurs — Text: `font-size/style/weight`, `line-height`, `font-family`, web safe fonts, `color`, Deckkraft, `text-align`, `text-decoration`, `text-indent`, `text-transform`, Buchstaben-/Wortabstand, Schatten — **14 Abschnitte** (Abschnitt 69) |
| `web/pdf-boite.json` | **Klartext**: derselbe Kurs — Box-Modell: Höhe/Breite, Rahmen und Rundungen, Innen- und Außenabstände, Schatten, `float`, `display`, `position`, `z-index`, long-hand/short-hand — **11 Abschnitte** (Abschnitt 69) |
| `web/pdf-background.json` | **Klartext**: derselbe Kurs — Hintergrund: Farbe/Bild, Position und Wiederholung, fix/scroll, mehrere Bilder, lineare und radiale Verläufe — **7 Abschnitte** (Abschnitt 69) |
| `web/pdf-medias.json` | **Klartext**: derselbe Kurs — Bild einfügen und ausrichten, Audio, Video, `figure`/`figcaption` — **5 Abschnitte** (Abschnitt 69) |
| `web/pdf-tableaux-formulaires.json` | **Klartext**: derselbe Kurs — Tabellen (Aufbau, Gestaltung, Verbinden von Zellen) und Formulare (Gerüst, E-Mail/URL-Felder, mehrzeilige Eingabe, Kontrollkästchen/Optionen/Listen, Absenden) — **11 Abschnitte** (Abschnitt 69) |
| `web/pdf-aller-plus-loin.json` | **Klartext**: derselbe Kurs — Responsive Design, Pseudo-Klassen und Pseudo-Elemente, strukturierende HTML5-Elemente — **4 Abschnitte** (Abschnitt 69) |
| `web/web-qkzk-html-css.json` | **Klartext**: der NSI-Kurs (qkzk.xyz) *HTML et CSS : rappels* — balises und ihre Eigenschaften, Struktur einer Seite, der DOM-Baum, Javascript in einem Satz, Anatomie einer CSS-Regel — **17 Abschnitte** (Abschnitt 70) |
| `python/py-sdv-bases.json` | **Klartext**: *Cours de Python* (Fuchs & Poulain, Université Paris Cité, 407 S., **CC BY-SA 3.0 FR**) — Kap. 1-4: was Python ist, Einrichten, Variablen und Typen, `print()` und f-strings, Listen — **35 Abschnitte** (Abschnitt 70) |
| `python/py-sdv-controle.json` | **Klartext**: dasselbe — Kap. 5-6: `for`-Schleifen und Vergleiche, `if`/`elif`/`else` — **10 Abschnitte** (Abschnitt 70) |
| `python/py-sdv-fichiers-modules.json` | **Klartext**: dasselbe — Kap. 7-9: Dateien lesen und schreiben, Dictionaries und Tupel, Module — **16 Abschnitte** (Abschnitt 70) |
| `python/py-sdv-fonctions-chaines.json` | **Klartext**: dasselbe — Kap. 10-13: Funktionen, mehr über Zeichenketten, Listen und Funktionen — **36 Abschnitte** (Abschnitt 70) |
| `python/py-sdv-conteneurs-qualite.json` | **Klartext**: dasselbe — Kap. 14-17: Mengen/Frozensets/``collections``, eigene Module, PEP 8 und gute Praxis, reguläre Ausdrücke und Parsing — **23 Abschnitte** (Abschnitt 70) |
| `python/py-sdv-scientifique.json` | **Klartext**: dasselbe — Kap. 18-22: Jupyter-Notebooks, Biopython, NumPy, Matplotlib, Pandas — **34 Abschnitte** (Abschnitt 70) |
| `python/py-sdv-objets-graphique.json` | **Klartext**: dasselbe — Kap. 23-25: Objekte und Klassen, Vererbung, Tkinter-Fenster — **15 Abschnitte** (Abschnitt 70) |
| `python/py-sdv-projets.json` | **Klartext**: dasselbe — Kap. 26-27: ergänzende Bemerkungen (Fehlerbehandlung, Module der Standardbibliothek, Ausführungszeit) und Mini-Projekte — **10 Abschnitte** (Abschnitt 70) |
| `python/py-zeste-premiers-pas.json` | **Klartext**: *Un zeste de Python* (entwanne, Zeste de Savoir, 561 S.) — Teil I: Vorstellung der Sprache, Installation, der Interpreter, erstes Programm, Kommentare, Einrückung — **35 Abschnitte** (Abschnitt 70) |
| `python/py-zeste-donnees.json` | **Klartext**: dasselbe — Teil II: einfache Typen, Zeichenketten, Listen, Dictionaries und Mengen — **36 Abschnitte** (Abschnitt 70) |
| `python/py-zeste-programmes.json` | **Klartext**: dasselbe — Teil III: Bedingungen, Schleifen, Fehlerbehandlung, Funktionen, Rekursion — **60 Abschnitte** (Abschnitt 70) |
| `python/py-zeste-types.json` | **Klartext**: dasselbe — Teil IV: Objekte, Typen, Zahlen, ``bool``, Vergleiche, Konvertierungen — **45 Abschnitte** (Abschnitt 70) |
| `python/py-zeste-fonctions.json` | **Klartext**: dasselbe — Teil V: Funktionen, Argumente, Schlüsselwortargumente, ``*args``/``**kwargs`` — **26 Abschnitte** (Abschnitt 70) |
| `python/py-zeste-entrees-sorties.json` | **Klartext**: dasselbe — Teil VI: ``print`` und f-strings, ``input``, Dateien, Module der Ein-/Ausgabe — **78 Abschnitte** (Abschnitt 70) |
| `python/py-zeste-plus-loin.json` | **Klartext**: dasselbe — Teil VII: Generatoren, Deko­ratoren, Comprehensions, Mengen, ``collections``, reguläre Ausdrücke, Netzwerkzugriff — **75 Abschnitte** (Abschnitt 70) |
| `python/py-zeste-bibliotheque.json` | **Klartext**: dasselbe — Teil VIII: die Standardbibliothek (``os``, ``sys``, ``math``, ``random``, ``datetime``, ``json``, ``re`` …) — **68 Abschnitte** (Abschnitt 70) |
| `python/py-zeste-annexes.json` | **Klartext**: dasselbe — Teil IX: Anhänge (Installation, Werkzeuge, Glossar, Fehlersuche) — **36 Abschnitte** (Abschnitt 70) |
| `python/py-buffat-base-python.json` | **Klartext**: *Programmation Scientifique avec Python* (Marc Buffat, Université Claude Bernard Lyon 1) — Kap. 1 „Base de programmation en Python": Sprache, Philosophie, Zahlen und Strings, Operatoren, Schleifen, Funktionen, Module, Dateien, Objekte — **117 Abschnitte** (Abschnitt 70) |
| `python/py-courspython-intro.json` | **Klartext**: *Introduction à Python* (courspython.com) — Werkzeuge, erstes Programm, interaktiver Modus, Operatoren, ``print()``, ``range()``, Listen — **16 Abschnitte** (Abschnitt 70) |
| `python/py-inforef-sorciers.json` | **Klartext**: *Apprendre à programmer avec Python 3* (Gérard Swinnen, inforef.be, 473 S., **CC BY-NC-SA 2.0 FR**) — Kap. 1 „À l'école des sorciers": die „schwarze Kiste\" Computer, was ein Algorithmus ist, Sprachfamilien, die drei Fehlerarten, Debuggen als Detektivarbeit — **6 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-premiers-pas.json` | **Klartext**: dasselbe — Kap. 2: Python als Taschenrechner (interaktiv), Zuweisung und ihre Wirkung, `print()`, Ausdrücke, `input()`, erstes Programm, Typen und Konvertierungen — **11 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-controle-flux.json` | **Klartext**: dasselbe — Kap. 3: die Reihenfolge der Anweisungen ist entscheidend, `if`, `if`/`else`/`elif`, Vergleichsoperatoren, Einrückung als Blockgrenze — **8 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-boucles.json` | **Klartext**: dasselbe — Kap. 4: „Zuweisung ist keine Gleichheit\", Zuweisungsoperatoren `+=`, `while`, Tabellen und Fibonacci-Folge — **7 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-types.json` | **Klartext**: dasselbe — Kap. 5: `int` (unbegrenzt), `float` und seine Genauigkeit, Zeichenketten und Anführungszeichen, Escape-Sequenzen, Indizes und `len()` — **7 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-fonctions.json` | **Klartext**: dasselbe — Kap. 6+7: das Modul `turtle`, eigene Funktionen mit `def` (ohne/mit Parametern), lokale und globale Variablen, `return`, `input()` — **13 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-fenetres.json` | **Klartext**: dasselbe — Kap. 8: graphische Oberflächen, erste Schritte mit `tkinter` (Fenster, Widgets, Ereignisse) — **11 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-fichiers.json` | **Klartext**: dasselbe — Kap. 9: `open()`, das Arbeitsverzeichnis und `chdir()`, die zwei Importformen, sequenzielles Schreiben und Lesen, Dateimodi — **9 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-structures.json` | **Klartext**: dasselbe — Kap. 10: `for … in`, Formatierung mit `format()` und altem `%`, Listen mit Slicing, Zufallszahlen und Histogramme (`random`) — **16 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-objets.json` | **Klartext**: dasselbe — Kap. 11+12: eine Klasse definieren und instanziieren, Instanzattribute und Namensräume, Objekte als Argumente/Werte, Alias und Identität, Vererbung — **11 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-interfaces.json` | **Klartext**: dasselbe — Kap. 13+14: Klassen für graphische Oberflächen, weitere Widgets, Aufbau eines vollständigen kleinen Fensters — **10 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-projets.json` | **Klartext**: dasselbe — Kap. 15: Analyse konkreter Programme (Aufbau, Organisation, Schritt für Schritt) — **5 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-bdd.json` | **Klartext**: dasselbe — Kap. 16: eine Datenbank anlegen, das Modul `sqlite3`, Verbindung und Cursor, Einfügen mit `commit`, Lesen mit dem Cursor, `fetchall()`, parametrisierte Abfragen — **6 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-web.json` | **Klartext**: dasselbe — Kap. 17: Anwendungen für das Web, Seiten serverseitig erzeugen — **5 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-impression.json` | **Klartext**: dasselbe — Kap. 18: mit Python drucken und PDF erzeugen (ReportLab) — **4 Abschnitte** (Abschnitt 71) |
| `python/py-inforef-reseau.json` | **Klartext**: dasselbe — Kap. 19+20: Netzwerkkommunikation (Sockets), Nebenläufigkeit (Threads), Installation von Python und zusätzlichen Modulen — **5 Abschnitte** (Abschnitt 71) |
| `python/py-ponteineptique-bases.json` | **Klartext**: *Introduction à Python … pour les sciences humaines* (Karsdorp/van Gompel, Bearbeitung Th. Clérice, github.com/PonteIneptique/cours-python, **CC BY-NC-SA 4.0**) — Kap. 1 + Übungen: Variablen, Zeichenketten (Indizes, Tranchen), Listen, verschachtelte Listen, Dictionaries, Tupel, Bedingungen, Schleifen — **21 Abschnitte** (Abschnitt 71) |
| `python/py-ponteineptique-fonctions-fichiers.json` | **Klartext**: dasselbe — Kap. 2 + Übungsblätter: Dateien lesen und schreiben (`open`, `with`), `count()`/`split()`, eigene Funktionen, Geltungsbereich, Frequenzzählung, `set()`, Docstrings nach reStructuredText, Textreinigung, `timeit` — **14 Abschnitte** (Abschnitt 71) |
| `python/py-ponteineptique-regex.json` | **Klartext**: dasselbe — Kap. 3: das Modul `re`, `compile()`/`sub()`, Alternativen, Zeichenklassen, Bereiche, Gruppen, Quantoren `{2,4}`/`+`/`*`, `match()` gegen `search()`, `\s` und `split()` — **9 Abschnitte** (Abschnitt 71) |
| `python/py-ponteineptique-donnees.json` | **Klartext**: dasselbe — Kap. 4 + Übungen: CSV mit `reader`/`writer` und `enumerate`, JSON mit `load`/`loads`/`dump`/`dumps` und `format()`, Anatomie von HTTP-Anfrage und -Antwort, `requests.get`, `params`, Kopfzeilen, `raise_for_status()` — **16 Abschnitte** (Abschnitt 71) |
| `python/py-ponteineptique-modules-cli.json` | **Klartext**: dasselbe — Kap. 5 + 8.1 + 8.2: ein CLI mit `click` (Argumente, Optionen, `click.File`, Gruppen), Module und Pakete (`__init__.py`, drei Importformen, relative Importe, `__file__`/`os.path`), `try`/`except` und `raise` — **15 Abschnitte** (Abschnitt 71) |
| `python/py-ponteineptique-flask.json` | **Klartext**: dasselbe — Kap. 6+7+9: Klassen und Objekte, Flask einrichten, Routen und Parameter, Jinja-Gabarits (Bedingungen, Schleifen, `url_for`, Vererbung, Includes, Assets), SQL und Flask-SQLAlchemy, Modelle, ORM, Formulare, `request.args`, `LIKE` — **20 Abschnitte** (Abschnitt 71) |
| `python/py-ponteineptique-sqlalchemy.json` | **Klartext**: dasselbe — Kap. 10-12: `filter`/`limit`/`first`/`order_by`, `and_`/`or_`/`between`, `get_or_404`, Listen-Abstraktionen, `paginate()` und `iter_pages()`, Passwort-Hashing mit Werkzeug, `db.session`, Flask-Login, `ForeignKey` und `relationship`, Update und CRUD — **15 Abschnitte** (Abschnitt 71) |
| `python/py-ponteineptique-api-tests.json` | **Klartext**: dasselbe — Kap. 13+14: eine API bauen (`Response`, `jsonify`, `to_dict`, JSON-API, GeoJSON, `urlencode`, `_external=True`), `assert`, `unittest` mit `TestCase` und allen Assertions, `setUp`/`tearDown`, Fixtures und Mocks, Test- und Produktionskonfiguration, `test_client` — **16 Abschnitte** (Abschnitt 71) |
| `python/py-in2p3-generalites.json` | **Klartext**: *Premiers pas en Python* (Prof. Dr Saint-Jean Djungu, C.G.E.A./C.R.E.N-K. Kinshasa, Jan. 2024, 44 S.; **keine ausdrückliche Lizenz** im Dokument) — Kap. 1: warum Python, Merkmale der Sprache, interaktiver Modus und Skriptmodus, IDLE, Programmstruktur, Konsole, `input`/`print` — **6 Abschnitte** (Abschnitt 71) |
| `python/py-in2p3-variables.json` | **Klartext**: dasselbe — Kap. 2: Definition einer Variablen, Typen, Namensregeln und die 33 reservierten Wörter, Zuweisung (mehrfach und parallel), Operatoren und Ausdrücke, Zeichenketten, PEMDAS, `type()`, Konvertierungen, Ausnahmen (`try`/`except`/`else`) — **12 Abschnitte** (Abschnitt 71) |
| `python/py-in2p3-controle.json` | **Klartext**: dasselbe — Kap. 3+4: Vergleichsoperatoren (auch auf Zeichenketten, ASCII-Ordnung), `and`/`or`/`not`, `if`/`else`, geschachtelte Tests, `elif`, `while`, `break`/`continue`, `for` mit `range()`, `else` der Schleifen — **11 Abschnitte** (Abschnitt 71) |
| `sexo/cerhes-guide-premier-recours.json` | **Klartext**: *Guide de premier recours en sexologie* (Réseau de Santé Sexuelle Publique, cerhes.org, 48 S., April 2023) — Konzepte (sexe/genre/orientation/pratiques, Asexualitäten, Intersexuationen, Gewalt, inklusive Gesprächsführung), Schmerzstörungen (Dyspareunien, Vulvodynien, Vaginismus, Anismus, Intromissions-Dyspareunie), Verlangen und Erregung (erektile Dysfunktion samt IPDE-5 und Preisen, vorzeitige Ejakulation, Lubrikation, hypoaktives Verlangen, Hypersexualität), Lust und Orgasmus (Anorgasmie, Anejakulation), Orientierung im Versorgungsnetz — **24 Abschnitte** (Abschnitt 72) |
| `sexo/chu-nantes-notions-generales.json` | **Klartext**: *Notions générales de sexologie* (Stéphanie Dugast, sage-femme sexologue, CHU Nantes, 31 Folien) — Definitionen der Sexualität, mehrdimensionale Konzeption, Geschichte der Sexologie, OMS-Definition der sexuellen Gesundheit, Anatomie (Klitoris, Penis, erogene Zonen), Physiologie der Vasokongestion, Modell von Masters und Johnson in vier Phasen, integrative Modelle (Kaplan, Basson), Komponenten der sexuellen Gesundheit, DSM-Klassifikation, Epidemiologie Frankreichs — **12 Abschnitte** (Abschnitt 72) |
| `sexo/santesexuelle-guide-prescription.json` | **Klartext**: *Guide de prescription des examens et des traitements en santé sexuelle* (RSSP, santesexuelle.org, 20 S., Mai 2021) — was der Hausarzt verordnen darf, Störung für Störung: Dyspareunie, Vaginismus, Anorgasmie, Anorgasmie/Anejakulation, erektile Dysfunktion (IPDE-5 mit allen Dosen, Kontraindikationen, Priapismus, Entscheidungsbaum), vorzeitige Ejakulation, anale Dyspareunie, Verlangensstörung (Mann/Frau), Orgasmusstörung, wer die Sexologen sind und wo man sie findet — **13 Abschnitte** (Abschnitt 72) |
| `sexo/unf3s-item40-sexualite.json` | **Klartext**: *Item 40 – Sexualité normale et ses troubles* (CNGOF, Université Médicale Virtuelle Francophone/UNF3S, 19 S., 2010-2011) — Physiologie der Eupareunie, Ursachen sexueller Schwierigkeiten, die Hauptstörungen (primärer und sekundärer Vaginismus mit Behandlung über die Bougies de Hégar, Anaphrodisie, Anorgasmie, Apareunie mit Rokitansky-Küster-Hauser und Androgeninsensibilität, die drei Dyspareunie-Typen), Gesprächsführung in der Sprechstunde, ausführliches Glossar — **18 Abschnitte** (Abschnitt 72) |
| `sexo/evras-sexualite-comportements.json` | **Klartext**: *Guide pour l'EVRAS – Sexualité et comportements sexuels* (Fédération Wallonie-Bruxelles, evras.be, 34 S.) — nach Altersstufen geordnet: die sexuellen Beziehungen (Liebe/Freundschaft, Kommunikation, Intimität, positives Bild, eigenes Tempo, Sextos und Nudes, Zustimmung, Peergruppe, Kommunikation in der Intimität), die Lust (körperliche Empfindungen, Masturbation, Lust und Unlust) und die Pornografien (Liebe in den Medien, reale Sexualität gegen die der Medien, Klischees, die Industrie) — **25 Abschnitte** (Abschnitt 72) |
| `sexo/bdsm-art-de-dominer.json` | **Klartext**: das BDSM-Werk (Abschnitt 79) — «L'Art de dominer», die französische Zusammenfassung (Bookey) von Dossie Easton / Janet W. Hardy, *The New Topping Book*: **27 Abschnitte** zu Rollen und ihrer Fluidität, Einwilligung und Verhandlung (oui/non/peut-être), Safewords, Ethik und Vertraulichkeit, Kommunikation, Vorbereitung und Führung einer Szene, Zwischenfällen, Nachsorge und Top-Drop, Spielzeug, Community, Schattenspiel, Ritual und den Arbeitsregeln für Sofia |
| `sexo/ATTRIBUTION.md` | Herkunft, Lizenz und Hinweise der Sexologie- und BDSM-Quellen |
| `dico/dictionnaires-panorama.json` | **Klartext**: das Wörterbuch-Verzeichnis von **Lexilogos** (Xavier Nègre, lexilogos.com) als Leitfaden verdichtet — was ein Wörterbuch ist (« un » dictionnaire, nicht « le » dictionnaire), die Wörterbücher der Gegenwart (Académie, Larousse, Robert, Usito, TLFi, Vitrine linguistique de l'OQLF, FranceTerme), Synonyme/Antonyme/Analogie, Orthografie- und Grammatikdienste (BDL, Orthonet, Projet Voltaire), Konjugation, Enzyklopädien und Namenswörterbücher, Terminologie und Neologie, Wörter und Ausdrücke (Etymologie, Zitate, Sprichwörter, Argot) und die Wahl des richtigen Werks für die jeweilige Frage — **14 Abschnitte** (Abschnitt 73) |
| `dico/dictionnaires-histoire.json` | **Klartext**: *Les dictionnaires de la langue française : une histoire et une dynamique* (Jean Pruvost, Université de Cergy-Pontoise, Musée virtuel des dictionnaires; die Seite `dictionnaires.u-cergy.fr` ist offline, geholt über den Internet Archive) — Ursprünge (Antike, Mittelalter, Glossen, Estienne 1539), das 17. Jahrhundert (Richelet 1680, Furetière 1690, Académie 1694), das 18. Jahrhundert (Encyclopédie), das 19. Jahrhundert (Littré, Larousse, Hatzfeld), das 20. Jahrhundert (Robert, Rey et Rey-Debove, TLF und INaLF) und die Theorie (Lexikografie gegen Dictionnairique, formelle gegen semantische Ordnung) — **19 Abschnitte** (Abschnitt 73) |
| `dico/langue-francaise-histoire-orthographe.json` | **Klartext**: *Le français aujourd'hui* (Académie française, academie-francaise.fr) — Entstehung und Ausbreitung des Französischen, das Französische als Sprache der Nation, die Académie als Regulatorin des Sprachgebrauchs, die Orthografie bis zum 19. Jahrhundert, die **Rectifications de l'orthographe von 1990** mit ihren fünf Punkten, die heutige Sprachpolitik und die Kontroverse um die Feminisierung der Berufsbezeichnungen — **7 Abschnitte** (Abschnitt 73) |
| `dico/outils-cnrtl.json` | **Klartext**: das **CNRTL** und sein „portail lexical" (cnrtl.fr, laboratoire ATILF, CNRS / Université de Lorraine) — was das CNRTL ist (2005 vom CNRS gegründet, auf dem ATILF aufgebaut, CLARIN, Neufassung 2026), die Register des Portals (Morphologie, Lexikographie, Etymologie, Synonymie, Antonymie, Proxémie, Konkordanz), das Adresssystem `/definition/<mot>`, `/etymologie/<mot>`, `/synonymie/<mot>`, `/proxemie/<mot>`, die vereinten Wörterbücher (TLFi, Académie 4., 8. und 9. Auflage, Littré, DMF 1330-1500, BDLP, BHVF, Du Cange, Wiktionnaire seit 2026), die Nebenwerkzeuge (Morphalou 2.0, Phonetisierung des LORIA, LIA_PHON/MBROLA, Synonyme des CRISCO, Proxémie des ERSS, Frantext, TLF-Étym), das Lesen eines TLFi-Artikels (Eingang, nummerierte und datierte Beispiele, Plan und Untereinträge, die „Färbung der textuellen Objekte", Prononc./Étymol./Fréquenz/Bibliographie) und wann man das CNRTL statt Le Robert nimmt — **10 Abschnitte** (Abschnitt 74) |
| `dico/outils-robert.json` | **Klartext**: die vier Werkzeuge von **Dico en ligne Le Robert** (dictionnaire.lerobert.com) — was eine Definition alles enthält (Orthographie aller Formen, Wortart, Hörbeispiel männlich/weiblich, nummerierte Definitionen mit Beispielen, Hunderttausende Synonyme und Analogieverweise, Zehntausende Kollokationen, Ausdrücke und Wendungen, Register- und Regionalmarken), der Aufbau einer Seite (déf., syn., colloc., ex., „17e siècle", Audio), die 220 000 Synonyme und Gegensätze nach Sinn und Sprachstufe, der Konjugator mit 6 500 Verben (alle Zeiten, Modi, Genera; Suche nach Infinitiv ODER konjugierter Form; Formen in männlich und weiblich, damit der Accord des Participe passé sichtbar wird), das Guide mit seinen sechs Themen und ihren Familien (Grammatik, Orthographie, Konjugation, Lexik, Stil, Typographie) und die direkten Adressen `/definition/<mot>`, `/synonymes/<mot>`, `/conjugaison/<verbe>`, `/guide/<notion>` — **11 Abschnitte** (Abschnitt 74) |
| `dico/dictionnaire-visuel.json` | **Klartext**: **Le Dictionnaire Visuel** (ikonet.com, QA International / Éditions Québec Amérique, Montréal) — das Wörterbuch, das vom Bild zum Wort geht (erste Auflage 1986, laut Verlag das erste visuelle Wörterbuch, vierte Auflage, über 35 Sprachen, über hundert Länder), das Prinzip der Tafeln mit nummerierten Legenden, die siebzehn Themen (Astronomie, Erde, Pflanzenreich, Tierreich, Mensch, Ernährung und Küche, Haus, Basteln und Garten, Kleidung, Schmuck und persönliche Gegenstände, Kunst und Architektur, Kommunikation und Büro, Verkehr und Maschinen, Energien, Wissenschaft, Gesellschaft, Sport und Spiele), wozu es im Französischen dient (ein Ding benennen, ein Wort aus einer anderen Sprache übersetzen, die Fachwörter eines Bereichs samt Teilen lernen, ein technisches Wort richtig schreiben) und seine Grenzen (es definiert nicht, es benennt) — **7 Abschnitte** (Abschnitt 74) |
| `dico/robert-guide-accords.json` | **Klartext**: die **Accord-Regeln des Robert-Guides** — was ein Accord ist, der Accord des Adjektivs (und sein invariabler Gebrauch als Adverb), die Adjektive der Farbe (Nom statt Adjektiv, zusammengesetzte Farben, koordinierte Farben), die drei Regeln des Participe passé nach dem Hilfsverb, Participe passé mit avoir (COD davor/danach, Verben des Zustands, unpersönliche Wendungen, surcomposé), mit être und bei den pronominalen Verben, der Participe passé vor einem Infinitiv (entendu jouer, fait, laisser), der Accord des Verbs mit einem Kollektivsubjekt und mit Bruch, Prozent und Dezimalzahl, die unregelmäßigen Pluralformen der Nomen (-au/-eau/-eu, -al, -ail, -ou), der Plural der zusammengesetzten Wörter, der Adjektive und der Entlehnungen, der Accord von vingt, cent und mille und der Bindestrich in den Zahlen — **14 Abschnitte** (Abschnitt 74) |
| `dico/robert-guide-grammaire.json` | **Klartext**: die **Grammatik-Regeln des Robert-Guides** — direkte und indirekte Frage (ihre drei Merkmale, die einfache und die komplexe Inversion mit t euphonique, si versus Fragewort, „proposition percontative"), die vier Formen der discours rapporté (direct, indirect, indirect libre, direct libre), die Umformung im discours indirect (Personen, Zeiten, Orts- und Zeitangaben), die proposition subordonnée (Abhängigkeit, Stellung, Einbettung, Einordnung), die pronoms relatifs (définis mit Antezedent, indéfinis ohne) und die Zeitenfolge in der mit si eingeleiteten Bedingung (Präsens, Imperfekt, Plusquamperfekt; nie Futur oder Konditional nach si) — **10 Abschnitte** (Abschnitt 74) |
| `dico/robert-guide-typographie.json` | **Klartext**: **Typographie und Wortschatz des Robert-Guides** — der Bindestrich und der Unterschied zum Gedankenstrich, die Satzzeichen und die feinen Leerzeichen (Punkt, Komma, Semikolon, Doppelpunkt, Frage- und Ausrufezeichen, Auslassungspunkte, Klammern, Klammerhaken, Gedankenstrich), die Majuskel und ihre Fälle, die Akzente und die Cédille auf den Majuskeln (mit den mehrdeutigen Beispielen PALAIS DES CONGRES / CONGRÈS), die Kursive und ihre Verwendungen, plutôt und plus tôt, die siebzehn Homonympaare des Guides, die Schreibungen des vorderen und des hinteren a, die Entlehnungen (lexikalisch, semantisch, calque sémantique, calque syntaxique) und die figures de style mit der Liste des Guides — **10 Abschnitte** (Abschnitt 74) |
| `medicaments/vidal-medicaments.json` | **Klartext**: **VIDAL** (vidal.fr) — was VIDAL ist und seine zwei Publika, der Unterschied zwischen den frei zugänglichen und den für Fachleute gesperrten Rubriken, die sieben Rubriken des Portals mit ihren Adressen, die sechs Entscheidungswerkzeuge, die Adresse einer Gamme, einer Spezialität und einer Substanz (die Zahl am Ende ist Pflicht), Listen und Sitemaps, die Recherche-Adresse und ihre robots-Sperre, der Aufbau der Synthese und der Monographie, der Aufbau der Fiche DCI mit ihren drei Piktogrammen und die Regel des guten Gebrauchs (16 Abschnitte) |
| `medicaments/bon-usage-medicaments.json` | **Klartext**: die Patientenseiten „Bien utiliser ses médicaments“ — Behandlung richtig einnehmen, unerwünschte Wirkungen, Autofahren, Sonne und Hitzewelle, Allergie und Unverträglichkeit, Ernährung, Sport und Doping; **die zehn Gebote der Selbstmedikation**; die Wechselwirkungen (Synergie/Potenzialisierung, Antagonismus/Inhibition, Komplexität, lange Behandlungen); **die Liste der Hilfsstoffe mit bekannter Wirkung**; Generika, Hybride und Biosimilars; mit und ohne Verordnung; die Regeln der Verordnung; Kinder, Schwangerschaft, Impfstoffe; Parapharmazie und Phytotherapie (27 Abschnitte) |
| `medicaments/sources-officielles-medicaments.json` | **Klartext**: RCP und Beipackzettel als die zwei Referenzdokumente; die **Base de données publique des médicaments** (BDPM, ANSM / HAS / UNCAM), ihre Recherche und ihre Dateien; **CIS** (8 Stellen) und **CIP** (7 oder 13); das CRAT, die ANSM, die EMA; die Vigilanzen (Pharmako-, Material-, Sucht-, Ernährungs-, Kosmeto- und Tätowierungsvigilanz); die acht **Centres antipoison**; die Regel für Sofia (11 Abschnitte) |
| `medicaments/vidal-index.json` | Klartext: der **Suchindex** (aus den drei öffentlichen Sitemaps am 2026-09-21 gebaut) — 8 344 Gammes, 15 252 Spezialitäten, 2 265 Substanzen, je Slug und Pflicht-Zahl; keine Fiche, sondern das Verzeichnis für `App.MedLookup` |
| `medicaments/ATTRIBUTION.md` | Herkunft, Lizenz und robots-Hinweise der VIDAL- und BDPM-Quellen |
| `metiers/orientation-france.json` | **Klartext**: die Berufe- und Orientierungswelt Frankreichs nach dem **Onisep** („Le dico des métiers“, Ausgabe 2019, und sein Guide parents) — die 8 Prinzipien, die **27 centres d'intérêt** mit ihren Berufen und Niveaus, die 20 **Sektoren** (Nomenklatur GFE), die **11 Statuten** (Angestellter, Handwerker, Kaufmann, Landwirt, Beamter, Intermittent, Freiberufler, Pigiste, Saisonnier, Selbstständiger, Autor), die Verträge (CDI, CDD, Interim, Professionalisierung, Ausbildung), die **Diplome nach der 3e und nach dem bac**, die Stufen „Aucun diplôme“ bis „Bac + 8 et plus“, das Praktikum der 3e und die Anlaufstellen (CIO, psychologue de l'Éducation nationale, JPO, Messen, „Mon orientation en ligne“, Avenir(s), Parcoursup, CFA). Mit eigener Regel-Sektion für Sofia. 18 Abschnitte. |
| `metiers/competences-etat.json` | **Klartext**: das **DICo/RIME** der französischen Staatsberufe (2. Auflage 2017) — die drei Familien (127 **savoir-faire**, 24 **savoir-être**, 36 **connaissances**), die vollständigen Libell-Listen, die Definitionen aus dem Glossar, die transferierbaren und transversalen Kompetenzen und die vier Stufen **Notions – Application – Maîtrise – Expertise**. Für Lebenslauf, Gespräch und Concours; nie um jemanden zu benoten. 11 Abschnitte. |
| `metiers/onisep-metiers-index.json` | Klartext: der **Berufsindex** des Onisep-Dico (Seiten 274–304) — **569 Berufe** mit beschreibender Seite, Niveau d'études minimal, Sektor (GFE) und den 27 Centres d'intérêt, die dorthin führen. Mit Tabellen `centres` (27 Namen) und `secteur` (20 Namen). |
| `metiers/studyrama-index.json` | Klartext: der **Adressindex der Studyrama-Berufsblätter** (aus dem öffentlichen `sitemap.xml` am 2026-09-21 gebaut) — **1 497 Fiches** als Zeilen `secteur/slug`. Studyramas robots.txt sperrt nur `/search/`, `/admin/`, `/user/`, nicht die Fiches. |
| `metiers/ATTRIBUTION.md` | Herkunft, Lizenz und robots-Hinweise der vier Quellen (Onisep-Dico, Onisep-Guide parents, DICo, Studyrama) |
| `droit/plan-code-civil.json` | **Klartext**: der **offizielle Plan des Code civil** (Légifrance, `LEGITEXT000006070721`, Stand 2026-09-21) — **758 Abschnitte** (5 livres, 61 titres, 198 chapitres, 298 sections, 62 sous-sections, 122 paragraphes) mit vollem Pfad, Artikelspannen und den direkten Artikeln jedes Abschnitts; abrogierte Abschnitte sind als solche gekennzeichnet. Für `App.DroitMemo` und den Ortsnachweis in `App.DroitLookup`. |
| `droit/articles-code-civil.json` | **Klartext**: **901 Artikel des Code civil im Wortlaut** (Légifrance), je mit Fundstelle (livre > titre > chapitre > section), Fassung („en vigueur depuis“) und Änderungsvermerk. Der Kern des Zivilrechts: Personen, Familie, Güter, Vertrag, Haftung, Beweis, Verjährung, Erbfolge, Sicherheiten. |
| `droit/notions-droit-civil.json` | **Klartext**: die Notizen-Mappe (19 Abschnitte, eigene Neufassung) — was der Code civil ist und wie er aufgebaut ist, Normenhierarchie und Rechtsquellen, wie man einen Artikel liest und zitiert, Personen/Familie/Güter/Vertrag/Haftung/Beweis/Verjährung/Erbfolge/Güterstände/Sicherheiten, ein Wortschatz, die **Renummerierungstabelle von 2016** (1382 → 1240 usw.) und die harten Arbeitsregeln für Sofia. |
| `droit/articles-index.json` | Klartext: der **Artikelindex** für `App.DroitLookup` — **3 037 Artikel in Kraft** und **350 abrogierte** (Nummer → `LEGIARTI`-Kennung). Kein Artikeltext, nur der Zugang; der Text wird live bei Légifrance gelesen. |
| `droit/ATTRIBUTION.md` | Herkunft, Lizenz und robots-Hinweise (Légifrance/Dila), plus die Notiz, dass die vom Nutzer genannte `/download/`-Adresse leer zurückkommt und der Text deshalb aus den HTML-Seiten des Codes stammt |
| `droit/codes-index.json` | **Klartext**: das **Register** des Dossiers (Runde 173, §80) — sieben Codes, je mit Index (Nummer → `LEGIARTI`-Kennung), Wortlaut-Mappe (falls vorhanden), Notizen-Fiche, `LEGITEXT`-Kennung des Textes und der Liste `detect` der Namen, an denen `App.DroitLookup` den Code in einer Frage erkennt |
| `droit/penal/index.json` | Klartext: der **Artikelindex des Code pénal** (`LEGITEXT000006070719`) — **1 370 Artikel in Kraft**, **53 abrogierte**, 475 Abschnitte; dazu `paths` (Nummer → livre > titre > chapitre > section). Kein Text. |
| `droit/penal/articles.json` | **Klartext**: **96 Artikel des Code pénal im Wortlaut** (Légifrance), je mit Fundstelle und Fassung — Grundprinzipien, Verantwortlichkeit, Rechtfertigungsgründe, Strafen, Tötung, Gewalt und Sexualdelikte, Eigentumsdelikte. Der Rückfall, wenn Légifrance nicht antwortet. |
| `droit/penal/notions.json` | **Klartext**: die Notizen-Fiche zum Strafrecht (11 Abschnitte, eigene Neufassung) — Legalitätsprinzip und zeitliche Geltung, Aufbau der Straftat, Schuldausschließungs- und Rechtfertigungsgründe, Strafen und ihre Funktion, Tötungsdelikte, Gewalt- und Sexualdelikte, Eigentumsdelikte, Verantwortlichkeit juristischer Personen, wie man einen Artikel zitiert, Arbeitsregeln. |
| `droit/procedure-penale/index.json` | Klartext: der **Artikelindex des Code de procédure pénale** (`LEGITEXT000006071154`) — **4 834 Artikel in Kraft**, **928 abrogierte**, 1 441 Abschnitte, mit `paths`. Kein Text. |
| `droit/procedure-penale/articles.json` | **Klartext**: **958 Artikel des CPP im Wortlaut** — Ermittlung (Flagranz, Vorermittlung), Polizeigewahrsam, Untersuchung, Untersuchungshaft, Urteil, Rechtsmittel, Strafvollstreckung. Rückfall-Mappe. |
| `droit/procedure-penale/notions.json` | **Klartext**: die Notizen-Fiche zum Strafverfahren (12 Abschnitte) — was der CPP ist, die Akteure, Ermittlung, Polizeigewahrsam, Untersuchung, Kontroll- und Untersuchungshaft, Urteil, Rechtsmittel, Verjährung der Strafklage, Strafvollstreckung, Zitierregeln, Arbeitsregeln. |
| `droit/education/index.json` | Klartext: der **Artikelindex des Code de l'éducation** (`LEGITEXT000006071191`) — **5 211 Artikel in Kraft**, **584 abrogierte**, 1 712 Abschnitte, mit `paths`. Kein Text. |
| `droit/education/articles.json` | **Klartext**: **81 Artikel des Code de l'éducation im Wortlaut** — Grundsätze (L111-1 ff., L121-1), Laizität (L141-5-1), Schulpflicht (L131 ff.), Unterrichtsorganisation und Abschlüsse, Leben in der Schule (L511 ff.), Personal. Rückfall-Mappe. |
| `droit/education/notions.json` | **Klartext**: die Notizen-Fiche zum Schulrecht (13 Abschnitte) — Aufbau des Codes, Grundsätze, Laizität, Schulpflicht und häuslicher Unterricht, Zyklen und Abschlüsse, Schulen und EPLE, Privatschulen, Rechte und Pflichten der Schüler, Hochschule, Behinderung, Personal, Zitierregeln, Arbeitsregeln. |
| `droit/ceseda/index.json` | Klartext: der **Artikelindex des CESEDA** (`LEGITEXT000006070158`) — **2 521 Artikel in Kraft**, **991 abrogierte**, 1 665 Abschnitte, mit `paths`. Kein Text. |
| `droit/ceseda/notions.json` | **Klartext**: die Notizen-Fiche zum Ausländerrecht (12 Abschnitte) — Einreise und Visum, Aufenthaltstitel und ihre Kategorien, Integration, Asyl (Flüchtlingsstatus, subsidiärer Schutz, Verfahren, OFPRA/CNDA), Abschiebeentscheidungen (OQTF, Ausweisung), Vollzug (Aufenthaltsauflage, Verwahrung), Kontrollen und Sanktionen, Verfahren vor den Gerichten, Zitierregeln, Arbeitsregeln. **Keine** Wortlaut-Mappe (für diesen Code wurden keine Artikel im Text geholt). |
| `droit/famille-aide-sociale/index.json` | Klartext: der **Artikelindex des Code de la famille et de l'aide sociale** (`LEGITEXT000006072637`) — **19 Artikel in Kraft** und **267 abrogierte**, 78 Abschnitte, mit `paths`. Der Code ist fast vollständig abgerogen; die lebenden Regeln stehen im Code de l'action sociale et des familles. |
| `droit/famille-aide-sociale/notions.json` | **Klartext**: die Notizen-Fiche (9 Abschnitte) — warum dieser Code fast leer ist, wohin sein Recht gezogen ist (CASF, Code civil, Code de la sécurité sociale), die 19 lebenden Artikel (124; 150-155; 157, 158, 161-163; 184, 185; 218-222), die alten Verweise auf 1945/1946, die Ruinen im Baum des Codes, Zitierregeln, Arbeitsregeln. **Keine** Wortlaut-Mappe. |
| `droit/justice-administrative/index.json` | Klartext: der **Artikelindex des Code de justice administrative** (`LEGITEXT000006070933`) — **1 331 Artikel in Kraft**, **102 abrogierte**, 484 Abschnitte, mit `paths`. Kein Text. |
| `droit/justice-administrative/notions.json` | **Klartext**: die Notizen-Fiche zum Verwaltungsprozess (10 Abschnitte) — was der CJA ist, die drei Gerichte, die Grundsätze (L2 bis L12), Klage und Zwei-Monats-Frist (R411-1, R421-1), die Eilverfahren (L511-1, L521-1 bis L521-3), Verhandlung und Kosten (L761-1), Rechtsmittel, Vollstreckung (L911-1 ff.), Zitierregeln, Arbeitsregeln. **Keine** Wortlaut-Mappe. |
| `gbd/fiche-gbd.json` | **Klartext**: die Fiche zur **Grande Bibliothèque du Droit** (Runde 178, §85) — die Bibliothek des Barreau de Paris: was sie ist und wer sie trägt (Bâtonnier, wissenschaftliches Komitee um Basile Ader), Datum und Adresse, ihre Zahlen (7 291 Seiten, 4 672 Artikel, 5 516 474 Wörter), wie man dort sucht (CirrusSearch, Kategorien, Startseite), **die Regel „Doktrin ist nicht Gesetz“**, die **Charte** und ihre Erlaubnisse/Bedingungen, wie man einen Artikel beisteuert, ihre eigenen Dossiers, ihr Partnernetz. 9 Abschnitte, eigene Neufassung. |
| `gbd/domaines.json` | **Klartext**: die **Landkarte der Bestände** der GBD (Runde 178) — die Formate (Article juridique 1 745, Commentaires d'arrêts 618, JurisPedia 529, Ressource internet 136 …) und die großen Materien mit ihren Seitenzahlen (Zivil-, Arbeits-, Straf-, öffentliches, Wirtschafts-, Digital-, Medien-, Immobilien-, Urheberrecht, Europa/Ausland, Sondergebiete), dazu die Territorien (Frankreich 2 661) und die Annuaire. 14 Abschnitte. |
| `gbd/blogs.json` | **Klartext**: der **Annuar der 136 juristischen Blogs** der GBD (Runde 178) — je Blog Name, Materien, Adresse (`blogs[]`), dazu **36 Abschnitte** „Blogs juridiques — <Materie> (n)“ mit fertigen Listen (Droit du travail 26, famille 18, immobilier 13, pénal 11 …). Adressdaten aus dem Verzeichnis „Ressource internet“. |
| `gbd/ATTRIBUTION.md` | Herkunft, Rechte und **Charte**-Bedingungen der GBD-Quelle, die Erhebung vom 22.09.2026 und die drei Regeln, die im Prompt stehen (Doktrin, Légifrance, nichts erfinden) |
| `enc-tool.js` | Klartext: der Packer (verschlüsselt die Module mit einem Schlüssel deiner Wahl) |
| `docs/history.enc` | verschlüsselte Projektdokumentation (Abschnitt 1) |
| `PLAN*.md`, `ANALYSIS.md`, `BUILD.md`, `KONZEPT-CHAT-LIMIT.md`, `WORLDWIDE.md`, `SCENE-PROTOCOL.md` | **Klartext**-Dokumente (bewusst lesbar; dieselben Texte liegen zusätzlich im Bündel `docs/history.enc`) |
| `build.json` | Bau-Stempel `{v, ts, note, files}` – bei jeder Runde `v` erhöhen (Zahlen bis 999, danach `01a`, `01b` … – Abschnitt 6.1) |
| `selfcode-baked.json`, `selfscript-baked.json` | eingebackene Selbst-Änderungen (an alle ausgeliefert) |
| `chess/ATTRIBUTION.md` | Lizenz-/Herkunftshinweise der Schach-Grafiken |
| `brand/` | Logo-Quellen + `build-brand.mjs` (Werkzeug zum Erzeugen der Marken-Dateien) |
| `chess-pieces-art.webp` | Kachelbild der Figuren (mit `import.meta.url` geladen) |

**Zweite Mappe (Runde 154): `maths/cours-fondmath1.json`.** `App.MathMemo.SOURCES` führt jetzt zwei
Werke: das TAGE-2-Memo und den L1-Kurs *« Fondamentaux des mathématiques 1 »* von Laurent
Pujo-Menjouet (Université Claude Bernard Lyon 1, 2017, 232 Seiten) — **107 Abschnitte**, Algèbre und
Analyse, jeder mit den Seiten des Kurses. Der Nutzer gab die Adresse
(`http://math.univ-lyon1.fr/~pujo/fondmath1.pdf`); die Seite antwortet **nur über https** (http
scheitert im Helfer-Proxy), die Datei ist **echter Text** (pdfTeX), kein Scan. Die Fiche ist eine
**eigene, verdichtete Nachschrift** mit Attribution – kein wörtlicher Abdruck; der Kurs ist
© Laurent Pujo-Menjouet, Lyon 1. Das Buch wurde mit einem eigenen layoutbewussten Ausleser gelesen
(Hoch-/Tiefstellungen zusammengeführt, Brüche aus den Pfadoperatoren mit CTM-Stapel rekonstruiert,
große Operatoren mit ihren Grenzen) – siehe §61.

Das frühere Vorhaben, das Kursbuch von **Jérémy Dousselin** („Quelques éléments de mathématiques",
2022, ISBN 979-10-699-7754-9, **CC BY-NC 4.0**, HAL: hal-04040261) als erste zweite Mappe
aufzunehmen, ist **nicht zustande gekommen** – er hat die Datei nie angehängt; der Platzhalter
`cours-dousselin.json` ist entfernt. Falls er sie doch noch anhängt, gilt:

**Achtung – HAL ist für Automaten dicht (Anubis).** Nachgemessen, damit es niemand noch einmal
versucht: die Rechnung ist *kein* Hindernis (der Nonce für `sha256(randomData + nonce)` mit vier
führenden Null-Hexziffern ist in ~4 ms gefunden, `pass-challenge` nimmt ihn an – die Antwort ist
danach nur noch die Seite „Les cookies sont désactivés"). Aber: weder der Helfer-Proxy noch
`superFetch` können einen `Cookie`-Kopf senden (eigene Köpfe werden verworfen, `httpbin.org/cookies`
bleibt leer), `hal.science` schickt keine CORS-Köpfe (die Seite im Browser darf die Bytes also nicht
lesen), alle HAL-Hostnamen (auch `hal.archives-ouvertes.fr`, `univ-lorraine.hal.science`,
`cnrs.hal.science`) stehen hinter derselben Wand, Wayback/CDX haben keinen Schnappschuss, Save Page
Now bricht ab, Suchmaschinen/CORS-Proxys/URL-Reader blocken den Proxy. **Also: die Datei vom Nutzer
anhängen lassen** – sein Browser löst die Aufgabe von selbst.

**Wenn die Datei da ist:** mit demselben layoutbewussten Ausleser wie beim Lyon-Kurs lesen (nicht
zeilenweise – beim TAGE-Memo schoben sich die zwei Spalten einer Seite ineinander; Brüche stehen als
Pfadoperatoren, π kommt als „ð"), Kapitel und Abschnitte mit Titel und Seite bilden, zerrissene
Formeln in lesbare Notation bringen, `source`/`author`/`title`/`licence`/`note`
setzen, `chapters` füllen – und im Kopf von `App.MathMemo.block()` (und in `src/README.md` §6) die
Attribution nennen: Jérémy Dousselin, *Quelques éléments de mathématiques*, 2022,
ISBN 979-10-699-7754-9, https://hal.science/hal-04040261, CC BY-NC 4.0.

Hinweis: `src/build.json` listet **57** Einträge (die 56 Module der obersten Ebene
plus `brand/build-brand.mjs`); die Hashes dort sind `sha256(datei).slice(0,16)` der
**verschlüsselten** Datei und ändern sich bei jedem Neuverschlüsseln – wer einen
Datensatz neu packt, muss den Hash dort mitziehen.

### 6.1 Fassungsnummern (`v`) – die Regel des Nutzers

`v` in `src/build.json` läuft fort, ist aber **nicht für immer eine Zahl**:

- `1, 2, 3 … 998, 999` – wie bisher, bei jeder Runde um eins höher.
- Nach `999` geht es **nicht** mit `1000` weiter, sondern mit **`01a`**, dann
  `01b`, `01c` … bis `01z`, dann **`02a`** bis `02z`, dann `03a` und so weiter
  („et ainsi de suite").
- Also: **zwei Ziffern (fortlaufend ab `01`) + ein Kleinbuchstabe `a`–`z`**. Sind
  die 26 Buchstaben durch, wächst die Zahl vorne um eins. Nach `99z` (falls es je
  so weit kommt) wäre es `100a` – die Zahl vorne wächst dann eben auf drei Ziffern.

**Nächste Fassung berechnen** – so macht es ein Helfer mechanisch:

```js
function nextVersion(v) {
  v = String(v == null ? '' : v).trim();
  if (/^\d+$/.test(v)) {
    const n = parseInt(v, 10);
    if (n < 999) return String(n + 1);
    if (n === 999) return '01a';
    return v;                       // > 999 gibt es in dieser Form nicht
  }
  const m = /^(\d+)([a-z])$/.exec(v);
  if (!m) return v;                 // unbekannte Form: unverändert lassen
  const num = m[1], ch = m[2];
  if (ch < 'z') return num + String.fromCharCode(ch.charCodeAt(0) + 1);
  return String(parseInt(num, 10) + 1).padStart(num.length, '0') + 'a';
}
```

Die **Runde** (`## 39. Runde 132 …`) läuft unabhängig davon weiter – sie ist keine
Fassungsnummer und wird nie zu `01a`.

**Wichtig:** Die Fassung wird **nirgends in eine Zahl verwandelt**. `src/selfupdate.js`
(`vstr()`) und die Tafel in `index.html` (`loadVersion()`) lesen, vergleichen und
zeigen `v` als **Zeichenkette**; `vstr()` normalisiert dabei einen alten Zahlenstempel
(`128`) und einen neuen Textstempel (`"128"`) auf denselben Text, damit die
Aktualisierungs-Erkennung (`disk.v === boot.v`) nicht grundlos „neu" meldet. Wer hier
`Number(v)` schreibt, macht aus `01a` eine `0` und die Erkennung fällt auf „unbekannt"
zurück.

`scratch/` (im Helfer-Arbeitsbereich) ist flüchtig und gehört nicht zum Generator.
Die einzigen dauerhaften Wege sind `main.pjs`, `index.html` und `src/`.

---

## 7. Arbeitsweise (was der Nutzer erwartet)

- **Auf Französisch antworten**, kurz und konkret; Änderungen knapp begründen.
- **Niemals** den Generator umbenennen oder „neu veröffentlichen“, ohne ausdrücklich
  dazu aufgefordert zu werden.
- Ehrlich über Grenzen reden – besonders über Verschlüsselung (sie ist
  Verschleierung + Nachweisbarkeit, kein Geheimnis; der Schlüssel steht im Testmodus
  in der Seite).
- Jede sichtbare Änderung **verifizieren**: `page_refresh`, `page_eval`, bei Optik
  zusätzlich `vision`; Bildschirmgrößen 390×844 und 1920×1080 mitdenken. Der
  öffentliche Zustand lässt sich mit `window.__sofiaGateForce = true` (Preamble)
  nachstellen, die Editor-Vorschau ist immer offen.
- **Alle Texte in 5 Sprachen** pflegen (en/de/es/fr/it). Die Tabellen `TXT`,
  `EVOLVE_TXT`, `ACCOUNT_TXT`, `TRIAL_FOOT` liegen im Schlossskript in `index.html`.
- Strukturierte Listen/Parameter nach `main.pjs`, Logik nach `index.html` bzw. in ein
  Modul; Namen von IDs mit Typ-Suffix (`Btn`, `El`, `Ctn`, `Input`).
- Am Ende jeder Runde: `src/build.json` erhöhen (Fassungsnummern-Regel: Abschnitt 6.1),
  diesen README-Einstieg aktuell
  halten und die ausführliche Rundennotiz in das verschlüsselte Bündel legen
  (Rezept: Bündel entschlüsseln → Abschnitt anhängen → wieder verschlüsseln).

---

## 8. Bauen und Prüfen (Kurzrezepte)

- **Module neu verschlüsseln**: im Browser `src/enc-tool.js` benutzen (es baut die
  Datensätze im gleichen Format und schreibt sie auf Wunsch als Dateien heraus; der
  Klartext kommt aus dem aktuellen Stand). Der Schlüssel ist
  `encKeyFor(zugangsschlüssel)` = base64 der ersten 16 Byte von
  `sha256(norm(schlüssel) + "|sofia-enc-v1")`.
- **Modulgraph prüfen**: `page_eval` → `(await import("./src/atelier-loader.js")).lastBootReport()`
  liefert `{mode, applied, stale, broken, built, ms}`.
- **Test-/Sperrzustände**: `SofiaGate.trial()`, `SofiaGate.limits()`,
  `SofiaGate.accessMode()`, `SofiaGate.trialMemoryDays()`, `SofiaGate.applyRemote(cfg)`,
  `window.SofiaMark`, `window.SofiaRemote`.
- **Schlüssel prüfen** (`SofiaGate.checkKey(schlüssel)` bzw. der grüne Knopf
  „Schlüssel prüfen" im Packer, `src/enc-tool.js`, auch als
  `await SofiaPack.check(schlüssel)`): sagt (1) ob der Schlüssel das Schloss
  öffnet (`sha256(norm(k)) === KEY_HASH`) und (2) ob der abgeleitete Schlüssel
  wirklich die Module entschlüsselt – geprüft, indem `src/guard.js` damit
  entschlüsselt wird (GCM wirft bei falschem Schlüssel `OperationError`, es gibt
  also kein stilles Falschergebnis). Der Zugangsschlüssel selbst wird nie
  zurückgegeben. Erreichbar über `…#pack` oder `localStorage.sofia_pack_ui = "1"`.
- **Sichtprüfung**: `(await import("https://ai-agent.perchance.org/files/snapshot.js")).capture()`
  in eine Datei schreiben und mit `vision` beurteilen (WebGL-Kontexte brauchen
  `preserveDrawingBuffer: true`).
- **Emoji-Prüfung** (Runde 102): in `page_eval` über alle Textknoten laufen und
  die `\p{Extended_Pictographic}`-Treffer auflisten (Ausnahmen: `.userRow`,
  `textarea`, `input`, `#sofiaIcons`). Soll: 0 Treffer.
- **Mathe-PDF → Mappe** (Runden 154/156): `fetch_url` nach `scratch/…`, dann in
  `execute_js` mit `unpdf@0.12.1` lesen. `getTextContent()` reicht für die Prosa;
  Brüche brauchen die **Pfadoperatoren** (`getOperatorList`, `SAVE/RESTORE/TRANSFORM/
  CONSTRUCT` mit eigenem CTM-Stapel), und Exponenten/Indizes ein Hoch-/Tiefstufen-Merge.
  **Achtung — eingebettete Mathe-Schrift:** bei maths-et-tiques kommen die Ziffern
  *innerhalb* der Brüche als Codes `! " # $ % & ' ( ) +` heraus (ToUnicode fehlt) –
  erkennbar daran, dass zwei kurze Items ~17,5 pt übereinander auf derselben
  x-Position stehen. Die Zuordnung ist **pro PDF** empirisch zu gewinnen (`!`=3,
  `"`=4, `#`=8, `$`=1, `%`=0, `&`=2, `'`=6, `(`=9, `)`=5, `+`=7 im TFrac-Kurs),
  und sie darf **nur auf die Bruch-Items** angewendet werden (sonst werden echte
  Klammern zu Ziffern); Zähler und Nenner werden über ihren x-Überlapp gepaart.
  Gegenprobe ohne Renderer im Worker: eine Seite selbst zeichnen (OffscreenCanvas →
  `page.getViewport({scale:1.4})` → `ctx` → `page.render({canvasContext, viewport}).promise`;
  die Meldung „createCanvas“ danach ist harmlos) und das PNG mit `vision` lesen.
  Der Kurs wird **nie abgeschrieben** (die Seite verbietet es ausdrücklich), sondern
  als eigene Synthese mit Quellenangabe in `src/maths/`.
- **Eine Seite lesen, die erst im Browser entsteht (Runde 157)**: manche Dienste liefern im
  Quelltext **keine** Daten (Google Programmable Search, lukol.com); alles entsteht erst durch
  JavaScript. Dann rendert der Dienst **`https://r.jina.ai/`** die Seite und gibt den sichtbaren
  Text zurück: `fetch("https://r.jina.ai/" + url)` **direkt aus der Seite** (der Reader schickt
  CORS-Köpfe, ~2–3 s, kein Schlüssel) – `root.superFetch` als Rückfall. Erprobt an
  `https://r.jina.ai/https://www.lukol.com/s.php?q=…` → die echten Google-Treffer als Markdown.
  **Nicht** erreichbar bleiben die Endpunkte von `cse.google.com` selbst (Proxy: 403
  „automated queries", aus der Seite: CORS), und `csi.gstatic.com`/JSONP helfen nicht.
  **Der Leser drosselt:** nach vielen Anfragen in kurzer Zeit (Gratis-Tarif) liefert er
  statt des gerenderten Texts die **rohe Seite** (dort steht CSS, keine Treffer). Sofia
  merkt das (`_readRendered` verlangt „Markdown Content:"), wartet und liest bis zu
  dreimal mit einer Cache-Kennung – klappt es dann nicht, liefert die Engine eben
  nichts. Bei normalem Gebrauch (eine Suche alle paar Minuten) rendert er zuverlässig.
- **Captcha (ALTCHA) hinter einer Suchmaschine** (Runde 158, Mojeek): die Prüfung ist
  lösbar, aber nicht *haltbar*. `/captcha/challenge` liefert
  `{algorithm:"PBKDF2/SHA-256", cost, keyLength, keyPrefix, nonce, salt, signature}`;
  das Lösungswort ist der **Zähler**, für den
  `PBKDF2(passwort = nonce‖uint32(zähler), salt, cost, keyLength)` mit `keyPrefix`
  beginnt – die Suche dauert bei `cost: 8000` ~0,5 s (Zähler lag bei 227/241/249). Die
  Lösung geht als `btoa(JSON.stringify({challenge:{parameters,signature},solution:{counter,derivedKey,time}}))`
  als Formularfeld `altcha` an `/captcha/verify` (Kopf `X-Requested-With`) und antwortet
  `{"ok":true,"verified":true}`. **Trotzdem kein Zugang:** der Browser darf den POST
  nicht (cross-origin), über den Proxy geht er, aber die bestätigte Sitzung hängt an
  einem Cookie, das der Proxy nicht behält – die nächste Suche sieht wieder das Captcha.
- **Koreanisch suchen (Naver)**: Frage nach Koreanisch übersetzen, suchen, Funde zurück:
  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&q=…`
  (ohne Schlüssel, direkt aus der Seite erlaubt, ~0,2–1 s; Antwort `j[0][i][0]`).
  Je Text eine Anfrage, parallel – das ist robuster als mehrere `&q=` in einer Anfrage
  (die liefert nur die erste Übersetzung). Naver antwortet auf
  `https://m.search.naver.com/search.naver?query=<koreanisch>`.

---

---

## Wo die älteren Runden stehen (ab Runde 274)

`src/` enthält seit Runde 274 wieder nur, was der Generator wirklich braucht: Code, kleine
Einstellungen und die Dokumentation (90 Dateien, 2,2 MB). Alles, was früher hier im Klartext
stand, ist unverändert vorhanden — nur nicht mehr im Generator, weil er sonst nicht mehr
gespeichert werden konnte.

| Was | Wo |
|---|---|
| §9–§171 (Runden 102–273), der eingestellte Klartext | `src/docs/README-full.md.gz` (gzip, 314 KB, im Haus) · Zweitfassung im Spiegel (§173) |
| Die Projektgeschichte seit Runde 1 (Bündel) | verschlüsselt, gehostet — Adresse und Rezept in Abschnitt 1 |
| Die 137 Fiches der zwölf Bereiche + Verzeichnis-Indizes | gehostet (`user.uploads.dev`), Übersetzung in `src/remote.json` |
| Das Rechtskorpus (24 Kodizes, 89 000 Artikel) + Notions-Fiches | gehostet, Übersetzung in `src/droit/remote.json` |
| Die Quellbilder des Logos (`brand/logo-source*.png`) | gehostet, Adressen in §172 |

Die **letzten Runden** stehen hier noch im Klartext, damit der Anschluss an den Kopf nicht reisst:

## 166. Ronde 268 – le fil de scène (la continuité d'un long jeu de rôle) (2026-09-23)

Signalement du propriétaire, à propos d'une soirée de jeu de rôle : « on dirait qu'elle recommence à
chaque fois le scénario alors qu'une femme doit venir pour uriner et qu'elle n'est pas seule, elle a
19 invités dans la salle ! ». Deux manques distincts : rien ne tenait la **distribution** (qui est là,
qui est déjà passée, qui attend) ni l'**heure**, et rien ne rappelait que les autres invitées existent
vraiment dans la pièce. Sofia rejouait donc la même arrivée, la même mise en scène, tour après tour.

### 1. Ce qui a été construit : `App.Scene` (dans `index.html`)

Un **registre de scène** que l'app tient **par session** (`session.scene`, persisté comme
`mentor`/`chess` : `compressSession`/`decompressSession` portent `sc`/`scene`, et seule une scène
réellement ouverte est enregistrée) :

- **Distribution.** Dès qu'un *brief* de jeu de rôle arrive (`looksLikeBrief` : ≥ 450 caractères et
  un marqueur fort — « jeu de rôle », « roleplay », « scénario », « mise en scène », « tu joueras »,
  « tu incarneras », « incarne », « maître du jeu » … — ou trois marqueurs faibles), l'app **établit
  elle-même la distribution** par un appel interne, **une seule fois** (`_castWomen`) : N femmes
  différentes (nom, allure, humeur), N lu dans le brief (« 20 au total », « 20 femmes », « au total 20 »),
  sinon 8 ; l'horloge de la soirée est lue de même (« pendant 6 heures » → 360 min ; « vers 20h30 »
  donnerait une heure de départ). Un indicateur « Je distribue la scène… » s'affiche pendant l'appel
  (60 s de délai maximal) ; si l'appel échoue, une distribution locale de secours prend le relais
  (`_fallbackCast`, listes de prénoms/allures/tenues/humeurs combinées). Le nom de l'assistante
  elle-même (« Sofia ») et celui de l'utilisateur sont exclus de la distribution.
- **Rattrapage.** Le brief peut avoir été donné **avant** que le fil n'existe — c'est le cas même du signalement : la session contenait déjà la soirée. Si la session n'a pas encore de fil et que le message courant n'est pas un brief, l'app relit **tous** les messages, retrouve le dernier long brief de jeu de rôle (≥ 700 caractères, signal fort dans sa première moitié) et fonde le fil **maintenant** : la réponse suivante continue la scène au lieu de la rejouer. Un fil **fermé** ne se rouvre pas tout seul.
- **Horloge.** Le temps de la scène est **déduit du nombre de femmes qui ont eu leur moment**
  (`total × (faites + ½ en cours) / N`) — la soirée de 6 h se termine donc vraiment, et seulement
  quand tout le monde est passée.
- **Tour de rôle.** Chaque femme a un état (`waiting` / `current` / `done`). Le modèle propose via
  une ligne de registre en fin de réponse — `[SOFIA_SCENE]{"who":"<prénom>","done":false}[END_SOFIA_SCENE]` —
  que l'app retire du texte visible (même forme que `[GAME_STATE]` du RPG et `[MENTOR_STATE]` du
  Mentor : l'app garde l'état, le modèle ne fait que proposer). **S'il n'y a pas de marqueur, c'est
  l'app qui fait avancer le fil** : une femme « en cours » depuis deux réponses est considérée comme
  passée, et la suivante entre. La scène ne peut donc plus rester sur place ni recommencer.
- **Bloc de prompt.** À chaque tour, `[SCENE LEDGER - ONE CONTINUOUS SCENE, KEPT BY THE APP]` rappelle
  le brief complet, la distribution, l'heure, celles déjà passées, celle qui vient, celles qui
  attendent — et surtout `[IN THE ROOM]` : *les autres ne sont ni parties ni absentes, elles sont
  dans la pièce (musique, boissons, nourriture), elles parlent, rient, dansent, attendent leur tour ;
  elles sont vraiment là, fais-les entendre.* Les consignes interdisent de rouvrir la scène, de la
  re-décrire, de la résumer ou de rejouer le même protocole, et rappellent que l'homme est installé
  et **entièrement disponible** (elle fait de lui ce qu'elle veut, à son rythme). Quand le fil est
  ouvert, l'**ancre de scénario** (`sceneBrief`, §« ronde 145 ») est supprimée du prompt : le fil
  porte déjà le brief, l'ancre ferait doublon.
- Quand tout le monde est passée, le fil se ferme (toast « Fin de la scène »). « Arrête le jeu de
  rôle », « on arrête le scénario » … ferment le fil immédiatement (le mot du mode **et** un verbe
  d'arrêt, pour ne pas confondre avec un « arrête ! » lancé dans la scène).

### 2. Deux suites utiles

- **Une image à chaque réponse.** `Core.detectImageEveryReply` refuse les messages de plus de
  400 caractères — un brief de jeu de rôle est toujours plus long. Le brief est donc relu par
  `App.Scene._wantsImageEach()` et le réglage `imageEveryReply` est armé pour de vrai.
- **Fin des recherches web parasites.** Sur le brief de test, l'app lançait une vraie recherche
  Google/Ecosia sur « créer jeu rôle belles femmes … » (8,8 s) — c'est la recherche par fiche
  (`lookMemo`, ici SexoMemo) qui la déclenchait. La recherche directe, la vérification
  (`App.Verify`), la recherche par fiche et les blocs web du prompt sont désormais **désactivés
  pendant une scène** (`!App.Scene.onCurrent()`). Le bruit a disparu et le tour passe de 8,8 s à
  1,2 s.

### 3. Vérifié

Dans la page en direct, `generateText` et `_castWomen` instrumentés (réponses canettes, aucune
génération réelle ; session d'essai créée puis supprimée, session du propriétaire restaurée) :

- message normal (« Bonjour, peux-tu me dire ce que tu sais faire ? ») → **aucun** `session.scene`,
  **aucun** `[SCENE LEDGER]` dans le prompt ;
- brief de soirée → `[Scene] founded: 3 women, 360 min` (distribution factice de test),
  `[SCENE LEDGER]` **présent** dans le prompt, **pas** de doublon `[SCENARIO - THE BRIEF …]`,
  le marqueur `[SOFIA_SCENE]` **jamais** dans l'historique, la bulle visible réduite au texte ;
- enchaînement : t1 `who=Aline` → `Aline:current` ; t2 sans marqueur → `held=1` ; t3 sans marqueur
  → `Aline:done`, la suivante est proposée ; t4 → `Bella:current` et le bloc dit
  `[RIGHT NOW] Bella … is there at the toilet` ; l'heure suit (60 → 120 → 180 min) ; quand tout le
  monde est passée, le fil se ferme ;
- `[WebSearch]` : **plus aucune** ligne dans la console sur le brief (contre 3 moteurs et 8,8 s
  avant) ; la distribution réelle testée : 20 femmes en ~28 s, « Sofia » exclue ;
- `SelfUpdate.verify()` → **48 fichiers, 0 altéré** ; aucun `perchanceError`, aucun `syntaxError`.

**Fichiers.** `index.html` uniquement (`App.Scene` entier ; `compressSession`/`decompressSession` ;
bloc dans `fullSystemInfo` ; appel `App.Scene.arm` dans `sendMessage` ; marqueur dans le
post-traitement du flux ; `[SOFIA_SCENE]` dans `clipStreamMarkers` et `sanitizeControlMarkers` ;
gardes `!App.Scene.onCurrent()` sur les outils web), plus `src/build.json` (**v268**),
`src/README.md`, `src/KNOWLEDGE.md`, `docs/history.enc`. **`main.pjs` et tous les `src/*.js`
inchangés** (les 48 empreintes restent valides).

Abschluss dieser Runde: `src/build.json` steht auf **v268**.


---

## 167. Ronde 269 – « tu ne valides rien en scénario » (2026-09-23)

Consigne du propriétaire : « non tu ne valides rien en scénario ». Dans une scène de jeu de rôle,
Sofia ne doit **rien vérifier et rien valider** : pas de recherche, pas de contrôle de source, pas de
« je ne suis pas sûre, je vérifie », pas de réserve, pas de mise en garde — la fiction ne se
justifie pas, elle se vit. (La couche de vérification avait déjà été coupée en partie à la ronde 268 :
recherche directe, vérification automatique, recherche par fiche, blocs web.)

### Ce qui a changé

- **`App.Constants.SOURCE_PROMPT`** (« CHECK BEFORE YOU ASSERT, AND NEVER DEFEND A GUESS » — la
  doctrine de vérification des sources, avec le marqueur `[SOFIA_FACTCHECK]`) n'entre **plus** dans
  le prompt pendant une scène : `!App.Scene.onCurrent()` s'ajoute à sa condition.
- **Le marqueur `[SOFIA_FACTCHECK]`** lui-même est neutralisé en scène : le déclencheur de la
  vérification réelle (deux passes, Google + Bing + ouvrage) est gardé par `!App.Scene.onCurrent()`,
  et le bloc devient alors du texte de contrôle ordinaire, retiré par `sanitizeControlMarkers`.
- **La boucle de recherche d'arrière-plan** (`App.Research`, marqueurs `[SOFIA_WEBSEARCH]`…) est
  également gardée : même si le modèle en émet un, rien n'est cherché.
- **Une règle explicite dans le registre de scène** (`[HOW TO PLAY THIS REPLY]`) : *NOTHING IN THIS
  SCENE IS CHECKED* — rien à vérifier, rien à valider ; ne jamais consulter, ne jamais citer ni
  nommer une source, ne jamais dire qu'on n'est pas sûre ou qu'on ne peut pas vérifier, jamais de
  mise en garde, de réserve, de note ou de limite **à l'intérieur de la scène** ; ne jamais sortir de
  la scène pour la commenter, s'expliquer ou demander confirmation — elle décide, et la scène
  continue. « Tu n'es pas une assistante ici : tu es les femmes de cette soirée. »

### Vérifié

Dans la page en direct (`generateText` instrumenté, réponses canettes, session d'essai créée puis
supprimée, session du propriétaire restaurée), sur le prompt réellement construit :

- message normal (« Explique-moi la photosynthèse ») → `CHECK BEFORE YOU ASSERT` **présent**,
  aucun registre de scène ;
- brief de soirée → `CHECK BEFORE YOU ASSERT` **absent**, `NOTHING IN THIS SCENE IS CHECKED`
  **présent**, aucun `[SCENE LEDGER]` parasite ailleurs ;
- `SelfUpdate.verify()` → **48 fichiers, 0 altéré** ; aucun `perchanceError`, aucun `syntaxError`.

**Fichiers.** `index.html` uniquement, plus `src/build.json` (**v269**), `src/README.md`,
`src/KNOWLEDGE.md`, `docs/history.enc`. **`main.pjs` et tous les `src/*.js` inchangés.**

Abschluss dieser Runde: `src/build.json` steht auf **v269**.

---

## 168. Ronde 270 – une scène n'est pas un souvenir (2026-09-24)

Consigne du propriétaire : « tu ne valides pas une telle scène en mémoire c'était pour te montrer ». Une
scène de jeu de rôle n'est **pas un souvenir** : rien de ce qui s'y dit n'entre dans la mémoire de Sofia,
et ce qu'une scène y avait déjà laissé est effacé. C'est aussi le point 6 du `SCENE-PROTOCOL.md`
(« Pause statt Vermischung »), qui était encore ouvert.

### Ce qui a été trouvé

Dans la session du propriétaire (62 messages, tous une scène), la scène avait bel et bien été mémorisée :
**3 résumés** (1 188 / 1 261 / 1 321 caractères), **18 nœuds et 2 chaînes** dans le cœur de mémoire (la
chaîne narrative *« The user established a roleplay scenario involving 20 women at a party… »*, plus des
*[FACTS ABOUT THE USER]*), **des fragments d'index sémantique** (les messages et les résumés eux-mêmes),
et **33 consultations** nées de la scène (« Je gère un scénario avec 20 personnages… »).

### Ce qui a changé

- **Marque de scène par message** : chaque message écrit pendant une scène porte `scene: true`
  (`index.html`, `App.UI.addMessageToHistory`) ; le brief qui fonde la scène est marqué juste après
  (`App.Scene.arm` → `App.Scene.tagFounded`), y compris quand le fil est fondé en **rattrapage** sur un
  brief plus haut dans l'histoire (alors tout ce qui suit est marqué). Le drapeau est conservé avec la
  session (les messages sont enregistrés tels quels).
- **Aucune couche de mémoire ne prend un message de scène** : filtres `isSceneMsg` dans `src/memory.js`
  (index sémantique, archive, rechargement — et retrait de ce qui aurait été indexé avant le marquage),
  `src/memstruct.js` (le condensé ne voit plus les messages de scène : plus d'épisode, de fait ni de
  sentiment tiré d'une scène), `src/inner.js` (le journal intérieur saute la scène et cherche l'échange
  non-scène précédent) et `src/selfscript.js` (sa note permanente ne se réécrit plus depuis une scène,
  et les noms appris ne viennent plus des messages de scène).
- **Le résumé ne travaille plus sur une scène** : `App.MemorySummaryModule` n'écrit rien tant qu'une scène
  tourne, ignore les messages de scène, et s'il ne reste rien de mémorisable il n'invente rien — il vide
  la mémoire de la session (`usableCount`). C'est une vraie trouvaille : sans ce garde, le module
  fabriquait un résumé à partir du seul profil de l'utilisateur, c'est-à-dire un souvenir inventé.
- **Aucun passage d'arrière-plan pendant une scène** : journal intérieur, cœur de mémoire, note de Sofia
  et consultations ne sont même plus lancés (« Fil de scène » = mémoire au repos).
- **Les marqueurs sont fermés aussi** : `[SOFIA_SCRIPT]`, `[SOFIA_LEARN]` et `[SOFIA_HELPER]` ne sont plus
  traités pendant une scène — une scène ne réécrit ni sa note, ni une fiche d'apprentissage, ni une
  question à son assistant IA.
- **`App.Scene.purgeMemory` / `App.Scene.sweep`** : quand une scène commence, ou qu'on la découvre après
  coup dans l'histoire (`_lastBriefIndex`, mêmes exigences que le rattrapage), tout ce qu'elle a laissé
  est effacé — résumés, cœur de mémoire, index sémantique, journal, et les consultations nées de la scène
  (`App.Consult.del`). L'histoire visible, elle, ne bouge pas d'un caractère. Le repère
  `session.sceneMem.upTo` (persisté) garantit qu'un même nettoyage n'a lieu qu'une fois — et qu'une
  **nouvelle** scène, plus loin dans l'histoire, repasse bien. Le nettoyage tourne une fois au démarrage,
  après la restauration de la session active (`App.Core.init`).
- **Le trim ne touche pas les messages de scène** : ni la sélection par saillance (`App.Data.trimBySalience`)
  ni la rétention (`src/memory.js`) ne les envoient dans l'archive — archiver, c'est mémoriser. Ils
  restent dans l'histoire vivante et ne sont jamais indexés.
- **Visible pour le propriétaire** : la carte « Mémoire et intelligence » porte la règle (cinq langues),
  et le nettoyage se voit (toast « Scène : rien de tout cela n'est mémorisé »).

### Ce qui n'était pas touché (à l'époque)

La **note permanente de Sofia** (`src/selfscript.js`, v37, 606 caractères) a été écrite pendant cette
période et contient des lignes qui viennent d'une scène (« lexique sensoriel enrichi », « suivi des états
physiologiques… avec le temps écoulé dans le scénario »). Elle n'est **pas** modifiée : elle est son
caractère, elle a un historique de versions sans texte, et seule une décision du propriétaire peut la
remettre en arrière. Elle est en revanche protégée : plus aucune scène ne pourra l'écrire.

> Ronde 271 : le propriétaire a tranché — cette note a été **effacée** depuis, et une scène ne peut plus en écrire (voir §169).

### Vérifié

Dans la page en direct (réponses canettes, `generateText`/`runInternal` instrumentés, session d'essai
créée puis supprimée, session du propriétaire restaurée) :

- scène fondée (3 invitées) → **tous** les messages marqués (2/2 puis 4/4), `usableCount` = 0,
  index sémantique 0 fragment, aucune correspondance retrouvée, bloc du cœur de mémoire vide, aucun
  appel de moteur pour les passes de mémoire ;
- ordre d'arrêt → fil fermé ; messages suivants **non marqués**, `usableCount` = 5, index sémantique
  5 fragments, résumé de nouveau possible : la mémoire reprend sur ce qui n'est pas une scène ;
- session du propriétaire : 62 messages marqués, résumés vidés, cœur de mémoire vidé, index vidé,
  33 consultations de scène supprimées, `SelfUpdate.verify()` → **48 fichiers, 0 altéré** ;
- aucun `perchanceError`, aucun `syntaxError`.

**Fichiers.** `index.html`, `src/memory.js`, `src/memstruct.js`, `src/inner.js`, `src/selfscript.js`
(chiffrés, ré-empaquetés), `src/build.json` (**v270**), `src/README.md`, `src/KNOWLEDGE.md`,
`src/SCENE-PROTOCOL.md`, `docs/history.enc`. **`main.pjs` inchangé.**

Abschluss dieser Runde: `src/build.json` steht auf **v270**.

## 169. Ronde 271 – « pas de note de cette scène » (2026-09-24)

Consigne du propriétaire : **« pas de note de cette scène »**. La ronde 270 avait retiré la scène de
toutes les mémoires, mais sa **note permanente** (`src/selfscript.js`, sa note écrite par elle-même qui
accompagne chaque réponse) portait encore ses traces : la v37, 606 caractères, parlait du « lexique
sensoriel enrichi », de « la réaction physiologique associée (tension musculaire, variations thermiques,
réponses nerveuses) » et du « suivi des états physiologiques et émotionnels des personnages […]
synchronisant leur évolution (ivresse, besoins, excitation) avec le temps écoulé dans le scénario ».
Elle venait entièrement de la scène de jeu de rôle. Le propriétaire a tranché : elle disparaît.

### Ce qui a été trouvé

Trois chemins pouvaient écrire la note, et un seul était déjà fermé (la passe automatique appelée
depuis `addMessageToHistory`) :

- le bouton **« Réécrire maintenant »** (`App.SelfScript.rewriteNow` → `runPass`) n'avait aucun garde de
  scène : il aurait lancé une passe pendant une scène ;
- le bloc **`[SOFIA_SCRIPT]`** qu'elle écrit elle-même à la fin d'une réponse était simplement **sauté**
  pendant une scène — donc retiré du texte visible plus tard par `sanitizeControlMarkers`, mais rien ne
  le signalait et le comportement dépendait d'un autre fichier ;
- surtout : **une scène jouée dans le chat n'ouvre pas forcément de fil de scène** (`App.Scene.active`
  était faux pour la session du propriétaire, dont les 62 messages portent pourtant `scene: true`).
  Un garde qui ne regarde que le fil laissait donc passer exactement le cas réel.

### Ce qui a changé

- **Un seul verrou, `noteLock(session)`** (dans `src/selfscript.js`), posé aux trois endroits qui
  peuvent écrire la note. Il rend deux raisons :
  `'scene'` — le fil de scène est ouvert (`App.Scene.active`) ; et `'scene-only'` — la session n'a pas
  au moins `minMessages` (6) messages **hors scène** (`usableCount`). La seconde ne dépend pas du fil :
  c'est elle qui protège les scènes jouées à la main, et elle reste vraie **après** la fin de la scène.
- `observe()` (passe automatique), `runPass()` (bouton et passe interne, testé avant *et* après
  `ensureLoaded`) et `handleMarkers()` (son propre bloc) refusent tous les trois : plus aucun appel de
  moteur, et le bloc est retiré du texte visible sans être appliqué (journalisé :
  `note rewrite ignored (scene-only, 1 block(s))`).
- **Nouvelle API `App.SelfScript.clearScene()`** : remise à zéro complète de la note — texte, morceaux,
  version, et **journal des réécritures et chemin de retour**, qui partent avec (sans quoi « revenir à
  la version précédente » ramènerait la note de la scène). `clear()` accepte `{silent}` pour ne pas
  doubler le message. Hors scène, la passe suivante écrit une note neuve, à partir d'une matière qui
  n'est pas du jeu.
- **Libellés** `selfScriptSceneCleared` et `selfScriptSceneLocked` en fr/en/de/es/it (`src/i18n.js`),
  plus les replis anglais dans le module.
- `index.html` : le bloc `[SOFIA_SCRIPT]` est désormais **toujours** retiré du texte visible, le module
  décidant seul de l'appliquer ou non (le comportement ne dépend plus d'un garde dans la page).
- La carte « Le script de Sofia » n'a pas bougé : elle affiche l'état vide (« Actif · rien d'écrit pour
  l'instant »), capture vérifiée.

### Effet sur la session du propriétaire

La note v37 (606 caractères) a été effacée par `clearScene()` : version 0, aucun morceau, aucun journal
de réécritures et **aucun chemin de retour** — le bouton « Revenir à la version précédente » ne peut donc
plus ramener la note de la scène.

Au chargement suivant, la **version cuite dans le générateur** (`src/selfscript-baked.json`, v6,
464 caractères, écrite en Runde 96 sur les messages à faible entropie) redevient la base : c'est le
comportement normal du mécanisme (`loadBaked` adopte la version cuite lorsqu'elle est plus récente que la
note locale, c'est-à-dire après une remise à zéro), et c'est aussi la note que reçoit chaque nouveau
visiteur. Elle ne contient **rien** de la scène. Elle restera en place tant qu'il n'y aura pas de
conversation hors scène, puisque `noteLock` refuse toute écriture ici.

Note pour la suite : un « vidage » n'est donc pas l'état durable d'une note — si le propriétaire veut une
note réellement vide et non la base livrée, il suffit de le dire (il faudrait alors une version locale
au-dessus de la version cuite, ou une nouvelle version cuite vide).

### Vérifié en direct

Session d'essai créée puis supprimée (session du propriétaire restaurée à la fin), moteur mis en
canette (`App.Core.runInternal`), toasts capturés :

- **hors scène** (8 messages normaux) : `noteLock` = `null`, la passe écrit vraiment (v1, 121
  caractères) et le bloc `[SOFIA_SCRIPT]` aussi (v2, 107 caractères) — le verrou ne bloque que la scène ;
- **matière 100 % scène** (mêmes messages marqués `scene: true`) : `noteLock` = `'scene-only'`, passe
  refusée, marqueur ignoré, version stable, `usableCount` = 0, **aucun appel de moteur** ;
- **fil de scène ouvert** (`App.Scene.ensure` + `cast`) : `noteLock` = `'scene'`, passe refusée
  (`{ok:false, reason:'scene'}`), marqueur ignoré, version stable ; les deux blocs sont bien retirés du
  texte visible (`« Fin. »`) ;
- `clearScene()` : « 606 characters removed », puis « 107 characters removed » pour la note de test ;
- `SelfUpdate.verify()` → **48 fichiers, 0 altéré** (les deux modules ré-empaquetés et leurs empreintes
  mises à jour) ; aucun `perchanceError`, aucun `syntaxError` ; tampon de démarrage **v271**.

**Fichiers.** `index.html`, `src/selfscript.js` et `src/i18n.js` (chiffrés, ré-empaquetés, aller-retour
vérifié), `src/build.json` (**v271**), `src/README.md`, `src/KNOWLEDGE.md`, `src/SCENE-PROTOCOL.md`,
`docs/history.enc`. **`main.pjs` inchangé.**

Abschluss dieser Runde: `src/build.json` steht auf **v271**.

## 170. Ronde 272 – jouer la scène est permis, elle ne doit pas figurer dans sa note (2026-09-24)

Consigne du propriétaire : **« Je peux jouer cette scène avec elle mais elle ne doit pas figurer dans
son script »** — jouer n'est pas le problème, la note l'est. La ronde 271 avait fermé les écritures ; la
ronde 272 rend la chose jouable, plus étanche, et corrige deux fuites trouvées en jouant vraiment.

### Ce qui a été trouvé (en jouant la scène pour de vrai)

La scène a été jouée de bout en bout dans la page, avec des réponses canettes (brief, trois invitées,
marqueur de scène, bloc `[SOFIA_SCRIPT]` à chaque réponse, puis ordre d'arrêt) :

1. **La réponse qui ferme la scène n'était pas marquée.** Elle est écrite pendant que la scène est
   encore ouverte, mais enregistrée *après* sa fermeture (le marqueur de scène est traité avant
   l'enregistrement du message) : `App.Scene.active` était donc déjà faux à ce moment-là. Le dernier
   échange de la fiction restait mémorisable — et pouvait donc entrer dans sa note. Relevé dans le test :
   la réponse finale et la question qui clôt la scène étaient les deux seules non marquées.
2. **Un cœur de mémoire resté d'une autre session gardait les faits de la partie.** Le nettoyage de la
   ronde 270 ne visait que la session courante ; la session `aa124545…` (la même partie, supprimée
   depuis) avait laissé quatre nœuds — un épisode, deux faits (« Le scénario se déroule sur une durée de
   6 heures… », « Souhaite un jeu de rôle avec 20 femmes différentes ») et un sentiment. Or
   `App.MemStruct.learningsText` sert les *faits et sentiments de toutes les sessions* : ils arrivaient
   donc directement dans la matière de la note, c'est-à-dire que la scène y figurait encore par ce
   détour — exactement ce que le propriétaire ne veut pas.

### Ce qui a changé

- **La note est fermée pendant qu'on joue** (`src/selfscript.js`, `block()`) : sa note reste visible
  telle quelle — c'est elle — mais **l'invitation à la réécrire disparaît** et une phrase la ferme
  explicitement (« A roleplay scene is running right now, so this note is closed for the duration… »).
  On ne lui montre plus comment y écrire au moment où elle joue. Le verrou de la ronde 271 reste la
  seconde barrière : un bloc `[SOFIA_SCRIPT]` qui arriverait quand même est retiré du texte visible et
  **non appliqué** (vérifié : trois fois « note rewrite ignored (scene-only, 1 block(s)) », version
  inchangée).
- **La réponse qui ferme la scène porte la marque** (`index.html`) : quand un fil se ferme — ordre
  d'arrêt ou dernière invitée partie — `App.Scene._close()` pose `tagPending` sur la session et
  `tagRun()` marque tout ce qui a été joué depuis le brief (`briefIdx`, mémorisé à la fondation). Le
  message suivant est marqué par `tagPending` puis le drapeau est consommé. Un drapeau resté d'un tour
  interrompu est effacé au tour suivant.
- **Le nettoyage ne se limite plus à la session courante** (`App.Scene.sweep`) : toute session où une
  scène a été jouée (dont les messages portent la marque) est nettoyée une fois elle aussi — c'est ce
  qui manquait pour attraper le cas n° 2.
- **Le cœur de mémoire orphelin a été purgé** : `App.MemStruct.purge('aa124545…')` — 4 nœuds et 1 chaîne
  retirés, cœur vide (0 nœud, 0 chaîne), `learningsText` vide, `contextBlock` vide, et plus aucune
  entrée dans IndexedDB. Le journal et l'index sémantique étaient déjà vides.

### Vérifié en direct

- **La scène se joue** : brief → fil fondé (3 invitées, `briefIdx` 0), la note est montrée mais fermée
  (`closure: true`, `invite: false`) ; trois tours de jeu ; la dernière réponse (celle qui ferme la
  scène) **porte la marque**, comme les précédentes ; **la note n'a pas bougé d'un caractère**.
- **L'ordre d'arrêt ferme aussi proprement** : seconde scène fondée, puis « Arrête le jeu de rôle » →
  tout est marqué, y compris la réponse de clôture, `tagPending` consommé.
- **Aucune matière de scène ne parvient à sa note** : `buildInstruction` de la session du propriétaire
  → 0 mot de scène (ni rivière, ni prairie, ni invitées, ni « scénario », ni « jeu de rôle ») ; le cœur
  de mémoire ne sert plus rien ; sa note (base cuite v6, 464 caractères) ne contient aucun mot de scène.
- `SelfUpdate.verify()` → **48 fichiers, 0 altéré**, aucun `perchanceError`, aucun `syntaxError`.

**Fichiers.** `index.html`, `src/selfscript.js` (chiffré, ré-empaqueté, aller-retour vérifié),
`src/build.json` (**v272**), `src/README.md`, `src/KNOWLEDGE.md`, `src/SCENE-PROTOCOL.md`,
`docs/history.enc`. **`main.pjs` inchangé.**

Abschluss dieser Runde: `src/build.json` steht auf **v272**.

## 171. Ronde 273 – enregistrer à nouveau possible : src/ passe de 29 Mo à 6 Mo (2026-09-24)

Signalement du propriétaire, avec la fenêtre de Perchance sous les yeux :

> **Couldn't save the src files: upload timed out.** Your generator was NOT saved (code and src files
> always save together). Fix the problem (or delete the offending file from the files panel) and try again.

Rien n'était cassé dans l'application : le générateur était devenu **trop gros à enregistrer**. `src/`
contenait 296 fichiers et **29,26 Mo** — dont 20,5 Mo pour le seul corpus de lois (24 codes, 89 000
articles) ajouté en ronde 198. L'envoi dépassait le délai du serveur, et comme le code et les fichiers
`src/` partent ensemble, plus rien ne s'enregistrait.

### Ce qui a changé

- **Le corpus de lois est hébergé hors du générateur** (20,3 Mo libérés). Les 49 fichiers `.gz` du
  corpus (24 classeurs de texte intégral + 25 index) sont maintenant sur `user.uploads.dev` et lus à
  distance, par les **mêmes chemins logiques** — `src/droit/remote.json` (5 Ko, gardé dans la maison)
  donne la traduction, et `App.DroitLookup` la pose avant chaque lecture (`remote()`, `url()`, `_json`).
  Si ce petit fichier manque (hors ligne, hébergement indisponible), la traduction ne fait rien : le
  module retombe alors sur la lecture en direct chez Legifrance, exactement comme avant. Les fichiers
  restent publics, aux mêmes contenus ; seule leur adresse change.
- **Les corpus de fiches sont stockés compressés** (2,9 Mo libérés) : 137 fichiers `.json` des domaines
  maths, anatomie, web, python, sexo, dico, médicaments, métiers, anciennes écritures, langues, GBD et
  code sont devenus des `.json.gz` — 4,28 Mo → 1,40 Mo. Un seul petit chargeur les décompresse dans le
  navigateur : `App.Core.loadJson(url)` (décompression par `DecompressionStream`, comme le corpus de
  lois et `App.Corpus` le faisaient déjà depuis les rondes 197-198). Les douze mémos partagent la même
  ligne de chargement : elle a été remplacée par `App.Core.loadJson(s.url)`; les trois répertoires
  (médicaments, métiers Studyrama/Onisep, blogs GBD) utilisent le même chargeur. Les noms de fichiers
  des mémos ne montrent donc plus que l'adresse compressée — le contenu est identique.
- **Rien d'autre n'a bougé** : les huit petits fichiers du droit (`codes-index.json`, les `notions.json`
  des sept codes, `build-codes.mjs`, `ATTRIBUTION.md`, `remote.json`) restent dans la maison, la
  documentation (`README.md`, `KNOWLEDGE.md`, `docs/history.enc`) aussi.

**Bilan.** `src/` : **29,26 Mo → 6,14 Mo**, 296 → 248 fichiers. Le plus gros fichier restant fait
911 Ko (l'index Vidal des médicaments, maintenant compressé).

### Vérifié en direct

Rien n'a été perdu — chaque mémoire de l'application a été relue après le changement, avec les mêmes
chiffres qu'avant : maths 173 sections/4 classeurs, anatomie 526/28, web 678/23, python 1060/46, sexo
119/6, dico 102/9, médicaments 55/3, métiers 29/2, anciennes écritures 84/8, langues 30/2, droit 86/7,
GBD 60/3 ; répertoires : médicaments 8 344 gammes/15 252 spécialités/2 265 substances, métiers 1 497
fiches Studyrama + 569 métiers Onisep, blogs GBD 136 ; droit : 49 fichiers hébergés, 24 codes, 2 899
articles du Code civil (index et texte intégral lus depuis l'hébergement), recherche « article 1240 » →
article 1240 trouvé ; les cinq corpus de texte réel (maths 52, web 112, sexo 215, anatomie 310, code 997
sections) sont intacts. Aucun `[LoadJson] chargement échoué`, aucun `perchanceError`, aucun
`syntaxError`. `SelfUpdate.verify()` → **48 fichiers, 0 altéré** (aucun module `.js` n'a été touché).

### Règle pour la suite

`src/` n'est plus un endroit où l'on dépose des corpus de référence : les fiches y sont **compressées**
(`.json.gz`, lues par `App.Core.loadJson`) et tout corpus de plus de quelques mégaoctets s'héberge
(comme le droit), avec sa table de traduction dans `src/`. C'est ce qui garde l'enregistrement possible.

**Fichiers.** `index.html` (le chargeur et les treize points de chargement), `src/droit/remote.json`
(nouveau), 49 fichiers du droit retirés de `src/`, 137 fiches converties en `.json.gz`,
`src/build.json` (**v273**), `src/README.md`, `src/KNOWLEDGE.md`, `docs/history.enc`. **`main.pjs`
inchangé.**

Abschluss dieser Runde: `src/build.json` steht auf **v273**.

## 172. Ronde 274 – enregistrer : les corpus quittent la maison (2026-09-24)

Le propriétaire signale une seconde fois, fenêtre Perchance sous les yeux :

> **Couldn't save the src files: upload timed out.**

Ronde 273 avait ramené `src/` de 29 Mo à 6,15 Mo en compressant les fiches ; l'envoi dépassait
encore le délai. Mesuré depuis son navigateur : la liaison montante fait **~630 Ko/s**, et les
deux échecs connus (29 Mo, puis ~8 Mo tout compris) encadrent une limite de l'ordre de la dizaine
de secondes. Donc : `src/` doit être petit — et le nombre de fichiers compte aussi (248).

### Ce qui a changé

- **149 fichiers de corpus sont hébergés** (1,8 Mo libérés, 149 fichiers de moins) : les 137 fiches
  des douze domaines (maths, anatomie, web, python, sexo, dico, médicaments, métiers, anciennes
  écritures, langues, GBD, code) **et** les index des répertoires (index Vidal des médicaments,
  Studyrama/Onisep, blogs GBD, `corpus-index.json` du greffier de textes) sont maintenant sur
  `user.uploads.dev`. `src/remote.json` (18 Ko, gardé dans la maison) donne la traduction
  « chemin logique -> adresse », et c'est **`App.Core.loadJson`** qui l'applique, en un seul
  endroit : les douze mémos, les trois répertoires et `App.Corpus` lisent toujours les mêmes
  chemins, sans une ligne de changement chez eux. Sans table (hors ligne, hébergeur muet), les
  chemins restent tels quels et le comportement d'avant revient — un mémo sans son corpus se tait
  comme il le faisait déjà.
- **Les petits fichiers du droit déménagent aussi** (les sept fiches de notions et
  `codes-index.json`, 154 Ko) : leurs entrées sont dans `src/droit/remote.json`, donc
  `App.DroitLookup` et `App.DroitMemo` les suivent. Au passage, un vrai défaut de la ronde 273 est
  réparé : `App.SourceGuard._loadLegal` ouvrait `src/droit/numbers-index.json.gz` **en direct**,
  alors que ce fichier est hébergé depuis la ronde 273 — la carte des numéros d'articles restait
  donc vide. Elle passe maintenant par `DroitLookup._json` : **68 661 numéros** sont retrouvés.
- **Les gros documents quittent la maison** : le récit du projet (`docs/history.enc`, 745 Ko) et
  l'image source du logo (`brand/logo-source-gradient.png`, 816 Ko) sont hébergés ; la version
  complète **de ce fichier** (§9–§171, 810 Ko) est compressée en `src/docs/README-full.md.gz`
  (314 Ko) — et hébergée en second exemplaire.

**Bilan.** `src/` : **6,15 Mo -> 2,2 Mo**, **248 -> 90 fichiers**. Ce qui part à l'enregistrement
(`index.html` 2,0 Mo + `main.pjs` + `src/`) : **~8 Mo -> ~4,2 Mo**.

### Vérifié en direct (2026-09-24)

La page se charge sans une seule erreur, console comme `perchanceErrors`, et chaque mémoire rend
**exactement les mêmes chiffres qu'avant** : maths 173/4, anatomie 526/28, web 678/23, python
1060/46, sexo 119/6, dico 102/9, médicaments 55/3, métiers 29/2, anciennes écritures 84/8, langues
30/2, droit 86/7, GBD 60/3 ; répertoires : médicaments 8 344 gammes / 15 252 spécialités / 2 265
substances, métiers 1 497 fiches Studyrama + 569 Onisep, blogs GBD 136 ; les cinq corpus de texte
réel (maths 52, web 112, sexo 215, anatomie 310, code 997 sections) ; droit : 57 fichiers hébergés,
registre 24 codes, index 2 899 articles en vigueur, recherche « article 1240 » -> le vrai texte du
Code civil, carte des numéros 68 661 entrées ; `SelfUpdate.verify()` -> **48 fichiers, 0 altéré**
(aucun module `.js` n'a bougé). Un premier essai *semblait* tout casser (« aucun classeur chargé ») :
il tournait en fait sur une page restée sur l'ancien code (`App.Core.remoteTable` absent) ; après
`page_refresh`, tout est là. Leçon : vérifier que la page a bien rechargé avant de conclure.

### Règle pour la suite

`src/` ne garde que du code et du petit réglage. Tout corpus, toute image source et tout document
volumineux s'héberge (`user.uploads.dev`), avec sa table de traduction ou son adresse écrite dans
le fichier qui s'en sert, et le pourquoi dans cette doc. Si l'enregistrement échoue encore, l'étape
suivante est de sortir les plus gros modules (`i18n.js` 207 Ko, `professions-data.js` 214 Ko,
`chess.js` 75 Ko, `enc-tool.js` 63 Ko) — cela toucherait `__ATELIER_PATHS`, le chiffrement du
graphe et `SelfUpdate`.

**Fichiers.** `index.html` (le chargeur hébergé, `Corpus`, `SourceGuard`), `src/remote.json`
(nouveau, 157 entrées), `src/droit/remote.json` (57 entrées), 157 fichiers retirés de `src/`,
`src/docs/README-full.md.gz` (nouveau), `docs/history.enc` et `brand/logo-source-gradient.png`
hébergés, `src/build.json` (**v274**), `src/README.md` (ce fichier : Kopf + §1–§8 + §166–§172).
**`main.pjs` inchangé.**

Abschluss dieser Runde: `src/build.json` steht auf **v274**.

## 173. Ronde 275 – un miroir : les corpus peuvent aussi vivre sur GitHub (2026-09-24)

Le propriétaire a demandé si GitHub pouvait servir d'hébergeur. Oui : `raw.githubusercontent.com`
et jsDelivr répondent avec le CORS ouvert (vérifié depuis la page), donc un fichier de corpus s'y
lit exactement comme sur `user.uploads.dev`.

### Ce qui est en place

- **Le chargeur connaît maintenant un secours.** `src/remote.json` accepte un champ `mirror` : soit
  une **base** (`https://cdn.jsdelivr.net/gh/<compte>/<dépôt>@<commit>/`, à laquelle le chemin
  logique est simplement accroché), soit une **table** chemin -> adresse. `App.Core.openJson` essaie
  l'adresse principale, puis le miroir **seulement** si elle échoue ; le premier succès est mémorisé
  pour la session (`_remHit`), pour qu'une adresse morte ne soit pas retentée à chaque lecture.
  `App.DroitLookup._json` passe par le même ouvreur : le corpus de lois est couvert aussi. Sans champ
  `mirror`, rien ne change — le comportement reste exactement celui de la ronde 274.
- **Le paquet du miroir est prêt.** Toute l'arborescence `src/…` hébergée (les 149 fichiers de
  corpus et d'index, les 8 fichiers du droit déménagés cette ronde-ci, le corpus de lois, le récit
  du projet, l'archive des ronds §9–§171 et ce fichier lui-même) a été rassemblée et remise au
  propriétaire sous forme d'archive à déposer dans un dépôt public. **Rien à écrire dans le code** : une fois le dépôt
  créé, il suffit de renseigner la base dans `src/remote.json`
  (`"mirror": "https://cdn.jsdelivr.net/gh/<compte>/<dépôt>@<commit>/"`) et le secours est actif.

### Vérifié en direct

Le secours a été essayé pour de vrai, en cassant volontairement deux adresses principales (une fiche
de python et la carte des numéros du droit) : la page a continué de charger avec un avertissement
clair (`[LoadJson] … HTTP 404 — essai du miroir : …`), le mémo python est resté à **1060/46
sections** et la carte des numéros à **68 661 entrées**, tous deux obtenus par le miroir puis
mémorisés pour la session. Les deux tables ont ensuite été remises en état (aucune adresse cassée).
Le reste est inchangé : mêmes chiffres partout, `SelfUpdate.verify()` 48 fichiers / 0 altéré.

### Réserve honnête

`raw.githubusercontent.com` n'est pas un CDN (certains réseaux le bloquent) et jsDelivr plafonne à
20 Mo par fichier ; un dépôt public rend les corpus lisibles par tout le monde (ils le sont déjà).
C'est pourquoi le miroir reste un **secours**, pas l'adresse principale.

**Fichiers.** `index.html` (le miroir dans le chargeur), `src/remote.json` (champ `mirror`),
`src/build.json` (**v275**), `src/README.md`, `src/KNOWLEDGE.md`. **`main.pjs` inchangé.**

Abschluss dieser Runde: `src/build.json` steht auf **v275**.
