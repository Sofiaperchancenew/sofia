# Attributionen — Chess-Modus

## Figuren (`src/chess-pieces.js`)

Das Figuren-Set ist das **„Cburnett"-Set** von **Colin M. L. Burnett**.

- Quelle: Wikimedia Commons, Kategorie *Chess pieces (Cburnett)*
  (<https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces>)
- Lizenz: **CC BY-SA 3.0** (und GFDL) — Weitergabe unter gleicher Lizenz,
  Namensnennung erforderlich.
- Abgerufen wurden die Rohdaten aus dem npm-Paket **`chessground`**
  (`assets/chessground.cburnett.css`), in dem die Figuren als Base64-kodierte
  SVG-Data-URIs eingebettet sind. Diese wurden einmalig extrahiert, von den
  `<svg>`-Wurzelattributen befreit und als reine SVG-Formen in
  `src/chess-pieces.js` eingebettet (keine Laufzeit-Abhängigkeit, kein CDN).

Die Figuren dürfen im Rahmen des Generators frei verwendet werden; bei einer
Weiterverbreitung des Sets (z. B. als eigenes Paket) ist die Nennung nach
CC BY-SA 3.0 beizubehalten.

## Figuren-Set „Art" (`src/chess-pieces-art.webp`)

Eigenes, vom Generator-Autor erstelltes 3D-Render-Set (weiß + schwarz, alle 12
Figuren). Keine fremde Lizenz, keine externe Quelle — das Sprite-Sheet ist aus
der Original-Vektorgrafik des Autors abgeleitet (Aufbereitungsrezept siehe
Kopfkommentar von `src/chess-piece-art.js`).

Das Cburnett-Set bleibt als Stil „Klassisch" erhalten und ist der Fallback.

## Überarbeitung Springer („Art", 30.09.2026)

Beide Springer-Zellen (`N` weiß, `n` schwarz) wurden neu komponiert: Kopf ~×3
um den Halsansatz skaliert (weiche 18-px-Blende als Übergang), Sockel/Hals
horizontal ×0,5 gestaucht, Ergebnis in die Zelle eingepasst (FIT 150 px).
Rezept/Skript beim Helfer (OffscreenCanvas-Compositing, WebP q0.92).
Hinweis: Die Vorversion liegt nur noch in der publizierten Fassung vor —
nach dem nächsten Speichern ist sie überschrieben.

## Springer 3D/STL (`src/chess-3d.js`, 30.09.2026)

Der 3D-Springer nutzt dieselbe „Art"-Silhouette (Kontur des 2D-Sprites),
aber als stehende Figur proportioniert: Breite ×0,55 (passt ins Feld),
Kopf ×1,35 (Höhe und Breite, weicher Übergang), Sockel in der Tiefe ×0,55.
Der STL-Export (`⬇ STL`) enthält dieselbe Geometrie. Die anderen fünf
Figuren sind extrudierte Cburnett-Profile (Quelle/Lizenz siehe oben).

## Nur Test-Orakel (nicht ausgeliefert!)

Diese Bibliotheken werden **ausschließlich während der Entwicklung** benutzt, um
die eigene Regel-Engine zu verifizieren. Sie sind **nicht** Teil des
ausgelieferten Generators und werden zur Laufzeit nie geladen.

| Werkzeug | Zweck | Lizenz |
|---|---|---|
| `chess.js@1.0.0` | Differentialtest (Standard-Schach: legale Zugmengen + SAN über Tausende Zufallspartien) | MIT |
| **Stockfish** (`stockfish.js@10.0.2`, Niklas Fiekas' Emscripten-Build, Multi-Variant-Branch) | Referenz für `perft` und legale Zugmengen — Standard **und** Chess960 (via `UCI_Chess960`), inkl. Rochade-Sonderfällen | GPL v3 |

Die eigene Engine (`src/chess-rules.js`, `src/chess-engine.js`) ist eine
unabhängige Implementierung und enthält keinen Code dieser Projekte.
