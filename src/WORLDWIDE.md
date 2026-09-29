# Sofia weltweit – der Fahrplan

Wunsch des Nutzers (Runde 110): **„j'aimerais ouvrir Sofia au monde entier“** –
und ausdrücklich das dafür nötige Ingenieursprojekt, nicht nur die Übersetzung.
Diese Datei ist der Plan von Bestand: wer später weitermacht, findet hier den
Stand, die Zahlen und die Reihenfolge.

## 1. Die vier Schichten (und warum nur eine davon „5 Sprachen“ ist)

| Schicht | Umfang | Zustand |
| --- | --- | --- |
| **Ihre Sprache** | alles, was Sofia sagt | universell, nichts zu tun – `App.AppLang` erkennt, `[STRICT LANGUAGE CONSTRAINT]` erzwingt die Antwortsprache |
| **Der Prompt** | ein einziger englischer Block, in allen Sprachslots derselbe (19 343 Zeichen) | bewusst monolingual: eine Quelle der Wahrheit (zwei Kopien waren schon einmal auseinandergelaufen) |
| **Das Mobiliar** | 1 128 Zeichenketten (828 `ui`, 226 `rpg`, 44 `mentor`, 19 `welcomeScreen`, 8 `alerts`, 3 `prompts`) | 5 Sprachen handgeschrieben (`en/de/es/fr/it`); alles andere übersetzt `App.AutoI18n.ensure()` zur Laufzeit in Blöcken, wendet `ui.*` zuerst an und legt das Ergebnis in den Cache |
| **Die Oberfläche selbst** | Layout, Ausrichtung, Typografie | Layout: **Runde 110 erledigt** (RTL-Grundlage). Typografie/Formate: offen, siehe unten |

Die Sprachliste (`src/languages.js`) kennt **36 Sprachen**, davon **4 mit
Schreibrichtung von rechts nach links**: `ar`, `he`, `fa`, `ur`. Bis Runde 110
gab es dafür **null** CSS-Regeln.

## 2. Was Runde 110 gelegt hat

- Alle physischen CSS-Eigenschaften (Abstände, Ränder, Textausrichtung,
  `left/right`) sind logisch geschrieben. In LTR wirkungsgleich, in RTL kehrt es
  sich von selbst um. 17 physische Deklarationen bleiben absichtlich: Chaos-Bühne
  (Deko) und zentrierende `left: 50%`.
- `[dir="rtl"]`-Block am Ende des Haupt-`<style>`: technische Inhalte bleiben LTR
  (Code, Interpreter-Ausgabe, Modell-IDs, Schlüsselfelder, FEN/PGN,
  `.chess-board-host` – das Brett hat feste Koordinaten a1–h8), Panelschatten,
  Handy-Drawer fährt von rechts herein.
- Drei Menü-/Popover-Platzierungen spiegeln über `window.innerWidth - left - w`.
- `<html lang>` wird von `App.UI.applyLanguage` mitgeschrieben.

## 3. Was noch fehlt (in dieser Reihenfolge)

> Ein zweiter, unabhängiger Auftrag liegt daneben: das **Szenen-Protokoll** (Szene
> einfrieren, aus der Rolle heraustreten und wieder zurückfinden) – Wortlaut und
> Umsetzung in `src/SCENE-PROTOCOL.md`. Er kann jederzeit vorgezogen werden.

### R111 – RTL-Feinschliff der Sondermodi
Die Grundfläche steht; die Sonderoberflächen wurden noch nicht in RTL *gesehen*:
Schach (Panel + Brett-Ränder + Zugliste), RPG (HUD-Zeile, Seitenpanel,
Charakterbogen-Modal, Würfeltisch), Mentor-Panel, Chaos-Bühne, Einstellungen,
Willkommens-/Alters-/Schloss-Overlay, Galerie, Bild-Modal, Quellen-Popover.
Vorgehen: je Bildschirm `dir=rtl` erzwingen, `snapshot.js` + `vision`, dann
gezielt nachbessern. Symbole mit Richtung (Zurück-/Weiter-Pfeile, `sf-play`,
`sf-undo`) brauchen eine `[dir="rtl"] .rtl-flip { transform: scaleX(-1) }`-Hilfe.
Achtung beim Schach: Brett und Koordinaten nie spiegeln, nur die Panels drumherum.

### R112 – Schriften und Typografie
- Der RPG-Modus setzt `Georgia, 'Times New Roman', serif`, der Chaos-Modus
  ebenso – beide haben keine arabischen/hebräischen/CJK/Thai-Glyphen. Nötig sind
  Schriftketten je Schrift (`Noto Serif/Naskh Arabic`, `Noto Sans Hebrew`,
  `Noto Sans Devanagari/Bengali`, `Noto Sans Thai`, `Noto Sans SC/TC/JP/KR`).
- `:lang(ar)`/`:lang(th)`/`:lang(zh)`/`:lang(ja)`/`:lang(ko)`-Regeln für
  Zeilenhöhe, Laufweite und Worttrennung. Thai trennt ohne Leerzeichen – der
  Browser kann das nur, wenn `lang` korrekt steht (Runde 110 hat es gesetzt).
- Ziffern: entscheiden, ob arabisch-indische Ziffern erscheinen
  (`font-variant-numeric` / `-u-nu-`). Vorschlag: westliche Ziffern behalten,
  damit Spielstände, Uhr und FEN überall gleich aussehen.

### R113 – Formate, Plural, Prüfmatrix
- `Intl.NumberFormat`/`Intl.DateTimeFormat` an allen Stellen, die Zahlen und
  Daten drucken; `Intl.PluralRules` für Sätze wie „{n} Nachrichten“.
- Prüfmatrix als Skript: Sprachen × Ansichten (390 / 768 / 1440 px) ×
  Bildschirme, automatisch fotografiert und von `vision` beurteilt; dazu ein
  Test „kein unübersetzter Text“ (DOM-Texte gegen das Sprachpaket).

### R114 – Mobiliar vollständig
Entscheiden, ob der handgeschriebene Satz über 5 Sprachen hinaus wächst (jede
neue Sprache kostet 1 128 Zeichenketten von Hand) oder ob `AutoI18n` die
Erstübersetzung liefert und nur die sichtbaren Stellen nachpoliert werden.
Empfehlung: `AutoI18n` als Weg, die 5 als „garantiert auch ohne Modell korrekt“.

## 4. Was ausdrücklich **nicht** passiert

- Der Prompt wird nicht in 36 Sprachen übersetzt (englischer Einzelblock).
- Das Schachbrett und die Chaos-Bühne werden nicht gespiegelt.
- RTL wird nicht über `transform: scaleX(-1)` auf der ganzen Seite gelöst
  (spiegelt Schrift, Bilder, Schach – unbrauchbar).

## 5. Prüfrezepte (Kurz)

```js
// RTL erzwingen (ohne die Sprache umzustellen)
document.documentElement.dir = "rtl"; document.body.classList.add("rtl");
// zurück
document.documentElement.dir = "ltr"; document.body.classList.remove("rtl");
```

```js
// echte Sprache umstellen (prüft auch AutoI18n und <html lang>)
App.AppLang.apply({ code: "ar" });   // danach App.UI.applyLanguage("ar")
```
