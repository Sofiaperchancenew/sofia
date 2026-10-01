# Der Szenen-Protokoll (eigene Runde, noch nicht gebaut)

Wunsch des Nutzers, wörtlich festgehalten. Auslöser war diese Beobachtung:

> „Erreur monumentale passer d'une tâche à une autre, dans un tel cas elle oublie
> le jeu de rôle précédent ; il est existant, palpable dans sa mémoire mais passe
> à autre chose de concret.“

Beispiel, vom Nutzer abgeschrieben: mitten in einer erotischen Szene schreibt er
*„Tu vas reprendre ton personnage après je souhaite que tu génères une image de
bouteille de haut médoc“* – Sofia liefert das Bild, **rahmt es aber in der Szene**
(„Voilà ta bouteille de Haut-Médoc, [prénom]. Un choix classique et robuste.“)
und springt dann zurück ins Rollenspiel.

## Warum das passiert (im Code nachgesehen, nicht geraten)

1. Der Grundprompt **verbietet ihr, die Szene zu verlassen**: `[BEHAVIOR]` sagt
   „never break the scene to explain yourself“, und `[AUTONOMOUS IMAGE
   GENERATION]` verlangt eine Bildunterschrift. Beides zusammen erzeugt genau die
   beobachtete Vermischung.
2. Es gibt **keinen Registerbegriff pro Nachricht**: `session.messages[].type`
   kennt nur `text` / `image` / `move`. Kein `session.scene`.
3. Der Szenenzustand lebt nur **implizit** in den letzten 20–50 Nachrichten
   (`maxMessages` in `buildSystemInstruction`) und in der Zusammenfassung. Eine
   konkrete Unterbrechung schiebt Szenenbeiträge aus dem Fenster – danach ist die
   Szene tatsächlich weg.
4. `App.MemStruct` fädelt alles in **eine** Erzählkette; das Konkrete verdünnt
   die Szene.

## Die vom Nutzer gewünschte Form (so bauen)

1. **Sie geht von selbst hinaus** – keine Erlaubnis, keine Assistentenstimme. Sie
   sagt es in ihrer eigenen Stimme, *im* Charakter. Verboten: „En tant qu’IA,
   voici votre image“.
2. **Bei mehrdeutigem Register fragt sie – im Charakter.** Die Zweideutigkeit
   betrifft nicht den Inhalt, sondern das Register: eine Flasche Crémant ist ein
   echtes Produkt (außerhalb der Szene) **oder** ein Requisit der Szene. Ihre
   Frage ist ausdrücklich zweisinnig, im Ton der Szene („tu me demandes
   concrètement une vraie image de crémant, ou c’est pour la mettre dans mon cul
   ou ma chatte ou boire avec toi ?“).
3. **Die Frage kommt *vor* dem Bild** – die Antwort ändert das Artefakt (neutrale
   Produktaufnahme vs. von der Fiktion getragene Aufnahme). Genau das ging beim
   Haut-Médoc schief: erst erzeugt, dann nachträglich in die Szene gekleidet.
4. **Nach der Lieferung gibt sie die Hand zurück:** „on reste dans le vrai, ou on
   reprend ?“ und **wartet**. Keine automatische Rückkehr.
5. **Die Szene wird eingefroren** (`session.scene`: Rahmen, Rollen, Ton,
   Intensität/„huit pour cent“, letzter Schlag, Stil) und beim Wiederaufnehmen
   wörtlich wieder eingesetzt, damit sie *genau dort* weitergeht.
6. **Pause statt Vermischung:** der konkrete Austausch wandert weder in die
   Zusammenfassung noch in die Erzählkette der Szene.
7. **Kontrollnachrichten zählen nicht:** die Antwort des Nutzers auf die
   Rückfrage („reprends“) ist Steuerung – sie darf weder als Szenenschlag noch
   als konkrete Frage gespeichert werden, sonst verdünnt sie wieder alles.
8. **Sie verliert nie ihren Charakter** – nur die Fiktion pausiert. Ton, Persona
   und Anrede bleiben.

## Umsetzung (Ort)

- Prompt: **ein englischer Regelblock**, angehängt in `buildSystemInstruction`
  (wie alle Marker-Protokolle) – bewusst nicht in den 5 Sprachfassungen, weil
  `prompts.system` in allen fünf identisch englisch ist.
- `session.scene` einführen (Feld + Frieren/Wiederherstellen), Anzeige des
  Registers pro Nachricht optional (vom Nutzer zunächst **nicht** verlangt – er
  wollte die *gesprochene* Lösung, nicht Farbe/Spalte).
- Eine feine „hors-scène“-Markierung kann später aus dem gesprochenen Satz
  abgeleitet werden; erst nach Praxis entscheiden.

## Nachtrag (Runde 270)

Punkt 6 („Pause statt Vermischung") ist jetzt gebaut – aber allgemeiner als hier notiert: **eine Szene
ist keine Erinnerung.** Jede Nachricht einer Szene trägt `scene: true` und bleibt aus
Zusammenfassung, Gedächtniskern, tiefem Gedächtnis, innerem Journal, Selbstskript und Konsultationen
heraus; was eine Szene schon hineingelegt hatte, löschen `App.Scene.sweep()` und
`App.Scene.purgeMemory()`. Die Punkte 1–5 und 7–8 (Rückfrage im Register *vor* dem Bild, eingefrorene
und wörtlich wieder eingesetzte Szene, Kontrollnachrichten zählen nicht) stehen weiterhin offen.

## Nachtrag (Runde 271)

Punkt 6 gilt jetzt auch für ihr eigenes Skript: **eine Szene hinterlässt keine Notiz.** Solange ein
Szenenfaden offen ist — und ebenso, solange eine Sitzung nichts als Szenen-Nachrichten enthält (was bei
einem im Chat gespielten Rollenspiel der Normalfall ist, ohne dass ein Faden geöffnet wird) — schreibt
kein Weg mehr in `src/selfscript.js`: nicht der automatische Durchgang, nicht der Knopf, nicht ihr
eigener `[SOFIA_SCRIPT]`-Block. Die Notiz, die noch aus der Szene stammte (v37), ist gelöscht worden;
eine neue entsteht erst wieder aus einer Unterhaltung, die keine Szene ist. Die Punkte 1–5 und 7–8
stehen weiterhin offen.

## Nachtrag (Runde 272)

Spielen ist ausdrücklich erlaubt — und genau dafür ist das Skript jetzt geschlossen: solange eine Szene
läuft (offener Faden, oder eine Sitzung, in der nur gespielt wurde), zeigt `block()` ihre Notiz, aber
ohne jede Einladung, sie umzuschreiben, und mit dem ausdrücklichen Satz, dass nichts aus der Fiktion
hineingehört; ein `[SOFIA_SCRIPT]`-Block bleibt wirkungslos. Schließt sich der Faden (Stoppbefehl oder
letzte Figur fort), trägt auch die schließende Antwort die Szenen-Marke — vorher blieb genau dieser
letzte Austausch erinnerbar. Und `App.Scene.sweep()` reinigt jede Sitzung mit Szenen-Nachrichten, nicht
nur die laufende. Punkt 6 gilt damit vollständig. Die Punkte 1–5 und 7–8 stehen weiterhin offen.
