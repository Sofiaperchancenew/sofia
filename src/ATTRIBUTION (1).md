# Herkunft und Rechte — `src/gbd/` (Runde 178)

## Quelle

**La Grande Bibliothèque du Droit (GBD)** — die juristische Online-Bibliothek des
**Ordre des avocats de Paris** (Barreau de Paris), seit dem 2. April 2014 online.
Adresse: <https://www.lagbd.org/> (das Wiki antwortet auch auf `lagbd.fr`).
Herausgeber: Ordre des avocats de Paris; wissenschaftliches Komitee unter Vorsitz von
Basile Ader (ehemaliger Vizepräsident der Anwaltskammer); Kontakt `lagbd@avocatparis.org`.
Erhebung für diese Mappe: **22.09.2026** (Seite, „Qui sommes-nous ?“, Charte, API `api.php`).

## Was hier gespeichert ist — und was nicht

Gespeichert sind **Tatsachen und Verweise**, keine fremden Texte:

| Datei | Inhalt | Art |
| --- | --- | --- |
| `fiche-gbd.json` | Was die GBD ist, wer sie trägt, ihre Charte, ihre Regeln | von der Anwendung **selbst verfasst**, aus den Fakten der Seite |
| `domaines.json` | Die Landkarte der Bestände (Kategorienamen + Seitenzahlen) | Zählungen aus der öffentlichen API |
| `blogs.json` | Verzeichnis der 136 juristischen Blogs (Name, Fachgebiet, Adresse) | Adressdaten aus dem Verzeichnis „Ressource internet“ |

Der **Volltext der Artikel liegt NICHT hier.** Er wird — wie bei Légifrance und VIDAL —
zur Laufzeit von der Seite gelesen (`App.GbdLookup`, MediaWiki-API), auf die Frage hin
ausgewertet und im Prompt als gelesene Quelle zitiert (Autor, Datum, Link). Es wird keine
Artikelkopie im Generator gespeichert.

## Rechte (Charte der GBD)

- „L'ensemble des Données mises à la disposition de l'Utilisateur dans le cadre du Service
  GBD est protégé par le droit d'auteur et par le droit des bases de données.“
- Die Charte räumt dem Nutzer **kostenlos und nicht-exklusiv** das Recht ein, die Daten zu
  vervielfältigen, öffentlich zugänglich zu machen und **wesentliche Teile zu entnehmen
  (extraire ou réutiliser des parties substantielles)** — vorbehaltlich der Zustimmung der
  Autoren.
- **Bedingungen**: Quelle nennen; eine Kopie oder die Adresse der Charte beifügen; die
  Bezeichnungen „La Grande Bibliothèque du Droit“ und „GBD“ nicht ohne Erlaubnis in Werbung
  oder Handel verwenden; **keine kommerzielle Nutzung**; die Veröffentlichungen der Autoren
  **nicht verändern** (sie sind im Wiki gesperrt).
- Charte: <https://www.lagbd.org/La_Grande_Biblioth%C3%A8que_du_Droit_:_la_Charte>
  (auch als PDF auf Englisch, Deutsch, Spanisch, Arabisch, Russisch, Chinesisch).

## Wie Sofia es benutzt (Regeln, die im Prompt stehen)

1. Ein GBD-Artikel ist **signierte Doktrin** (Meinung/Analyse eines Autors), **keine Norm**:
   Autor und Blog nennen, Datum nennen, sagen **dass** es Doktrin ist; die These eines Autors
   nie als geltende Regel ausgeben.
2. Für den **geltenden Wortlaut** bleibt Légifrance (bzw. die Fiche) die Referenz.
3. Nichts zitieren, was nicht gelesen wurde; das Verzeichnis der Blogs ist ein **Verzeichnis**
   — nur Blogs nennen, die darin stehen, mit ihrer genauen Adresse.
