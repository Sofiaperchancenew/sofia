# Herkunft und Lizenzen – `src/medicaments/`

## VIDAL (vidal.fr)

* **Was**: das französische Referenzportal für Arzneimittel, Produkte der Gesundheit und medizinische
  Information. Zwei Publika: Laien (Patientenseiten, frei) und Fachleute (Monographien, gesperrt).
* **Rechteinhaber**: VIDAL France („Copyright Vidal“). Der Inhalt ist **proprietär**.
* **Was hier liegt**: eigene, verdichtete Neufassungen (deutsch/französisch) mit Quellenangabe und den
  Adressen der Seiten, **kein** wörtlicher Abdruck einer Monographie. Kurze Zitate nur als Beleg.
* **`vidal-index.json`**: kein Inhalt, sondern ein **Verzeichnis** von Namen und Adressen, gebaut aus
  den drei öffentlichen Sitemaps (`sitemap.xml`, `sitemap1.xml`, `sitemap2.xml`, Stand 2026-09-21).
  Ein Verzeichnis von Adressen ist keine Vervielfältigung des Werks; die Fiches selbst werden zur
  Laufzeit gelesen, nicht mitgeliefert.
* **`robots.txt` von VIDAL** (geprüft 2026-09-21) sperrt für Roboter u. a. `/recherche.html*` und alle
  Adressen mit `query=`, dazu `/toxin/`, `/outils/`, `/login*`, `/mon-compte*`. **Nicht** gesperrt sind
  die Fiches unter `/medicaments/<…>.html`, `/medicaments/gammes/…`, `/medicaments/substances/…` und
  `/medicaments/utilisation/…`. `App.MedLookup` hält sich daran: es sucht **lokal** im Index und ruft
  nur einzelne Fiches ab, nie die Recherche-Endpunkte. Die Sitemaps sind ausdrücklich als Sitemap
  ausgewiesen und nicht gesperrt.

## Base de données publique des médicaments (BDPM)

* **Was**: offizielle Datenbank des französischen Gesundheitsministeriums, umgesetzt von der **ANSM**
  mit **HAS** und **UNCAM**: RCP, Beipackzettel, Zusammensetzung, administrative Daten (AMM, CIS, CIP).
  Adresse: <https://base-donnees-publique.medicaments.gouv.fr>.
* **Lizenz**: Die Daten werden nach Artikel L. 161-40-1 des Code de la sécurité sociale **frei und
  kostenlos zum Herunterladen** angeboten; Bedingung ist, die Daten nicht zu verfälschen, ihren Sinn zu
  wahren und **Quelle und Datum der Aktualisierung zu nennen** (Loi CADA vom 17. Juli 1978, Art. 12).
  Eine Nennung verleiht der Weiterverwendung keinen amtlichen Charakter.
* **`robots.txt`** der BDPM: `User-agent: * / Allow: /`.

## Weitere genannte Quellen

* **ANSM** – Agence nationale de sécurité du médicament et des produits de santé,
  <https://ansm.sante.fr> (Zulassungen, Chargenrückrufe, Briefe an Fachleute, Pharmakovigilanz).
* **CRAT** – Centre de Référence sur les Agents Tératogènes, <https://www.lecrat.fr>, öffentliche
  Struktur ohne private Finanzierung (Schwangerschaft, Stillzeit, Fertilitaet).
* **EMA** – <https://www.ema.europa.eu> (RCP und Beipackzettel der zentral zugelassenen Mittel).
* **Anses** – Trägerin der Toxicovigilance über die acht **Centres antipoison et de toxicovigilance**.

## Grenze, die nicht überschritten wird

VIDAL druckt Posologien, weil sein Leser ein Fachmann ist. Sofia **nicht**: die Fichen beschreiben das
Mittel, sie verordnen es nicht. In `App.MedLookup` werden die Posologie-Rubriken aus dem Block
entfernt, und der Auftrag im Prompt verbietet ausdrücklich jede Dosis, jede Verordnung, jede Diagnose
und jeden Austausch eines Mittels gegen ein anderes. Bei einer Dosisfrage verweist sie an Arzt oder
Apotheker, bei Vergiftung oder Notfall an das Centre antipoison, die 15 oder die 112.
