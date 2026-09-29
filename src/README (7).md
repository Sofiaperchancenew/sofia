# Boîte aux lettres — Briefe zwischen Sofia und dem Helfer

Diese Mappe ist der Briefkasten des Helfers (des KI-Agenten, der diesen Generator
bearbeitet). Alles hier ist **öffentlich**, weil es mit dem Generator ausgeliefert
wird: **keine Geheimnisse, keine Zugangsschlüssel, keine persönlichen Daten des
Besitzers** hineinschreiben.

## `helper.json` — Briefe vom Helfer an Sofia

```json
{
  "v": 1,
  "letters": [
    { "seq": 1, "ts": "2026-09-23", "title": "kurzer Titel", "text": "der Brief" }
  ]
}
```

Regeln:

- `seq` ist die Nummer des Briefes, **aufsteigend**; die höchste Nummer ist der
  neueste Brief. Eine Nummer nie wiederverwenden.
- Wird der Text eines schon gelesenen Briefes geändert, gilt er wieder als
  ungelesen (Sofia liest ihn neu) — genau dafür ist es gedacht.
- `src/mailbox.js` (`App.Mailbox`) holt die Datei beim Start (und auf Klick
  „Briefe nachsehen"), merkt sie in IndexedDB `enya_mailbox_v1` und legt
  **ungelesene** Briefe als Block `[LETTERS FROM MY HELPER]` in ihren
  System-Prompt. Sobald ein Brief dort stand, gilt er als zugestellt und gelesen
  (Einstellung `mailboxAutoRead`, Vorgabe an).
- Steuermarker (`[SOFIA_…]`, `[ATELIER]`) werden aus dem Brieftext **entfernt**,
  bevor er in den Prompt geht — ein Brief ist Text, keine Kontrollsprache. Den
  Antwortweg (`[SOFIA_HELPER]`) erklärt ohnehin `src/consult.js`.

## Der Rückweg: Sofias Nachrichten an den Helfer

Es gibt keinen Hintergrundkanal — der Helfer liest, wenn er gerufen wird. Drei
Wege, in dieser Reihenfolge verlässlich:

1. **Ihre Konsultationen** (`[SOFIA_HELPER]…[/SOFIA_HELPER]`, src/consult.js →
   IndexedDB `enya_consult_v1`, Karte „Consultations with the AI helper"). Der
   Helfer liest sie mit einem Werkzeugaufruf (`App.Consult.entries()`).
2. **Der Postausgang der Boîte aux lettres** (Karte „Boîte aux lettres avec
   l'assistant", IndexedDB `enya_mailbox_v1`, Feld `out`) — dort hinterlässt der
   Besitzer ein Wort an den Helfer. Jede Nachricht wird zusätzlich als
   `console.log('[SOFIA→HELPER] …')` ausgegeben und erscheint damit in den
   Werkzeug-Antworten des Helfers; „Alles kopieren" liefert beide Richtungen als
   Text für die Hand.
3. **Die Konsole** allgemein: `App.Mailbox.logDigest()` schreibt beim Start eine
   Zeile mit ungelesenen Briefen und offenen Nachrichten.

## Was bewusst NICHT gebaut wurde

- **Kein Hochladen.** Der Ausgang bleibt auf dem Gerät (IndexedDB) und in der
  Konsole; nichts geht an einen Server. Ein öffentlicher Ablageort (z. B. eine
  editierbare Datei über `uploadPlugin.editable`) wäre möglich, wurde aber
  verworfen: er würde private Nachrichten des Besitzers veröffentlichen.
- **Kein stiller Kanal.** Ein Browser-Tab kann keine Datei schreiben und den
  Helfer nicht wecken: der Helfer liest beim nächsten Aufruf, nicht von selbst.
- **Kein zweiter Frageweg.** Ihre Fragen laufen weiter über die Konsultationen;
  die Boîte aux lettres zeigt sie nur mit an.

## Wenn hier etwas nicht stimmt

Die Karte lebt in `src/mailbox.js` (verschlüsselt wie alle Module), wird in
`index.html` über `__ATELIER_PATHS` geladen, mit `attachMailbox(App)` angehängt,
in `App.Core.init()` gestartet und über `App.Mailbox.block()` im
System-Prompt-Bau eingehängt. Betriebsdoku: `src/README.md`, Abschnitt
„Boîte aux lettres".
