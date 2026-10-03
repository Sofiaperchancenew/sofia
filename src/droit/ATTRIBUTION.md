# Attribution — dossier « droit » (Code civil)

Ce dossier a été constitué le 21 septembre 2026 à partir de la source indiquée par
l'utilisateur : le Code civil français publié par **Légifrance** (Dila, Direction de
l'information légale et administrative).

- Page du code : https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721/
- Identifiant du texte : LEGITEXT000006070721
- Adresse demandée par l'utilisateur :
  https://www.legifrance.gouv.fr/download/file/pdf/LEGITEXT000006070721.pdf/LEGI
  (adresse de téléchargement du PDF : /download/ est exclu du robots.txt de
  Légifrance, et la réponse revient sous forme de page de visualisation, sans
  corps exploitable. Le texte a donc été relevé sur les pages HTML officielles
  du code, qui portent le même contenu et la même date de consultation.)

## Ce que contiennent les fichiers

- `plan-code-civil.json` — le plan officiel relevé dans l'arbre du code : 758
  sections (5 livres, 61 titres, 198 chapitres, 298 sections, 62 sous-sections,
  122 paragraphes) avec, pour chacune, le chemin complet, la ou les plages
  d'articles et la liste de ses articles.
- `articles-code-civil.json` — le texte **en vigueur** des articles, tel que
  Légifrance le publie, avec la date de la version et la mention de modification.
  Chaque article porte le chemin (livre > titre > chapitre > section) où il se
  trouve dans le code.
- `articles-index.json` — table de correspondance entre un numéro d'article et
  son identifiant Légifrance (`LEGIARTI…`) : 3037 articles en vigueur et 350
  articles abrogés que Légifrance conserve dans son arbre.
- `notions-droit-civil.json` — texte de synthèse rédigé pour l'utilisateur
  (définitions, méthode de lecture d'un article, vocabulaire, table des
  renumérotations de 2016, règles de travail). Ce texte n'est pas de Légifrance :
  il cite des articles dont le texte se trouve dans les fichiers ci-dessus.

## Statut juridique des textes

Les textes de loi sont des textes officiels, librement reproduits. La source est
citée sous chaque article (Légifrance, Code civil, article n°, version en vigueur
depuis le …). Le site Légifrance, sa présentation et ses bases sont produits par
la Dila ; l'adresse du PDF (`/download/…`) est exclue du robots.txt du site, les
pages de consultation (`/codes/…`) ne le sont pas. Aucune modification n'est
apportée aux textes : ils sont repris tels quels, avec leur date de version.

## Avertissement repris dans la fiche de travail

Sofia informe sur le droit ; elle ne donne pas de conseil juridique et ne
remplace ni un avocat, ni un notaire, ni un juriste. Pour un cas personnel, elle
renvoie aux professionnels et aux services compétents.

---

# Attribution — les six codes de la Runde 173 (22 septembre 2026)

La même provenance que le Code civil : **Légifrance** (Dila, Direction de l'information
légale et administrative). Le texte a été relevé sur les pages officielles de chaque code,
qui portent le contenu, la date de version et l'identifiant du texte.

| Code | Identifiant du texte | Page |
| --- | --- | --- |
| Code pénal | `LEGITEXT000006070719` | https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070719/ |
| Code de procédure pénale | `LEGITEXT000006071154` | https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006071154/ |
| Code de l'éducation | `LEGITEXT000006071191` | https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006071191/ |
| Code de l'entrée et du séjour des étrangers et du droit d'asile | `LEGITEXT000006070158` | https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070158/ |
| Code de la famille et de l'aide sociale | `LEGITEXT000006072637` | https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072637/ |
| Code de justice administrative | `LEGITEXT000006070933` | https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070933/ |

**Adresse à ne pas confondre.** Pour le « code de justice administrative », l'adresse
transmise portait l'identifiant `LEGITEXT000006071360` : c'est le **Code de justice
militaire**. Le Code de justice administrative est `LEGITEXT000006070933` (celui qui a été
construit). Un nom de code ne suffit pas à l'identifier : l'identifiant `LEGITEXT` est la
seule clé sûre.

## Ce que contiennent les fichiers de ces six codes

- `index.json` (dans chaque dossier) — la table **numéro d'article → identifiant
  Légifrance** (`LEGIARTI…`), avec, pour chaque numéro, le chemin complet dans le code
  (livre > titre > chapitre > section), et la liste des articles abrogés que Légifrance
  conserve dans son arbre. Aucun texte d'article : seulement l'accès.
- `articles.json` (pénal, procédure pénale, éducation) — le texte **en vigueur** des
  articles relevés, tel que Légifrance le publie, avec la date de la version. Il sert de
  secours quand Légifrance ne répond pas. Reproduits tels quels, sans modification.
- `notions.json` — texte de synthèse **rédigé pour l'utilisateur** (ce n'est pas du
  Légifrance) : principes, notions, méthode de lecture, pièges de numérotation, règles de
  travail. Il cite des articles dont le texte se trouve dans l'index et, quand elle
  existe, dans la mappe de textes.
- `../codes-index.json` — le registre qui relie les sept codes (identifiants, chemins des
  fichiers, et les noms par lesquels on les reconnaît dans une question).

## Remarques de méthode

- L'adresse `/download/` de Légifrance est exclue du `robots.txt` du site ; les pages de
  consultation `/codes/texte_lc/…`, `/codes/section_lc/…` et `/codes/article_lc/…` ne le
  sont pas. C'est de là que viennent les textes.
- Légifrance répond de façon irrégulière (page de contrôle au lieu de l'article) : le
  lecteur réessaie une fois. C'est signalé dans `index.html`.
- Les deux codes sans `articles.json` (famille et aide sociale, justice administrative)
  n'ont **pas** de texte local : pour ceux-là, l'article n'est lu que par lecture directe.
  Le bloc le dit quand Légifrance ne répond pas. Le CESEDA en a un depuis la Runde 197
  (voir plus bas).
- Le Code de la famille et de l'aide sociale est abrogé à environ 94 % (19 articles en
  vigueur, 267 abrogés) : sa fiche le dit et renvoie au Code de l'action sociale et des
  familles.

## Avertissement

Sofia informe sur le droit ; elle ne donne pas de conseil juridique et ne remplace ni un
avocat, ni un notaire, ni un juriste. Pour un cas personnel, elle renvoie aux
professionnels et aux services compétents.

---

# Attribution — le texte du CESEDA (Runde 197, 22 septembre 2026)

Le CESEDA n'avait, jusqu'à la Runde 197, qu'un index de numéros et une fiche de notions :
l'article n'apparaissait que s'il était **nommé** dans la question. Une question qui ne nomme
aucun article (par exemple « un étranger doit-il justifier de son identité ? ») ne recevait
donc aucun texte de loi. Le code entier a été relevé.

- **Source** : Légifrance (Dila), Code de l'entrée et du séjour des étrangers et du droit
  d'asile, identifiant `LEGITEXT000006070158`.
- **Pages relevées** (pages de consultation, hors des exclusions de `robots.txt`) :
  - Partie législative : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070158/LEGISCTA000042770748/
  - Partie réglementaire : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070158/LEGISCTA000042799742/
- **Résultat** : `src/droit/ceseda/articles.json` — **2 296 articles** de la partie
  législative et de la partie réglementaire, avec leur numéro (`Article L812-1`,
  `Article R425-1`…) et leur texte **en vigueur**, repris tel quel, sans modification.
  Format : `{"kind":"articles","sections":[{"t":"Article L812-1","c":"<chapitre>","x":"<texte>"}]}`.
- **Numéros manquants** : 225 numéros de l'index n'ont pas de texte dans ce fichier
  (surtout des articles `R9xx` et des annexes, absents des deux pages relevées). Pour
  ceux-là, la lecture reste directe (Legifrance), et la recherche thématique les
  complète au besoin par une lecture directe limitée à quatre articles.
- **Registre** : `../codes-index.json` porte désormais, pour le CESEDA, le champ
  `articles` et 31 termes de reconnaissance (`titre de séjour`, `étranger`, `asile`,
  `éloignement`, `rétention administrative`…), afin qu'une question de droit des
  étrangers soit reconnue comme telle.

## Comment la recherche a été construite (et pourquoi)

Le principe est la **recherche**, pas la mémorisation : Sofia n'apprend pas les codes par
cœur, l'application retrouve l'article et met son **texte exact** dans le prompt, avec
l'ordre de le citer. Deux difficultés ont dû être traitées séparément :

1. **La langue.** La question dit « justifier de son identité », le code dit « présenter
   les pièces ou documents … à toute réquisition ». Une table de correspondance de
   vocabulaire (`LEX` dans `index.html`, 17 lignes, sans aucun contenu juridique) relie
   les mots de la question aux mots du code ; ces mots venus de la table comptent pour
   moitié moins que les mots réellement écrits par l'utilisateur.
2. **La place dans le code.** Le code est un plan : quand un article parle du sujet, ses
   voisins du même chapitre le précisent souvent (« à l'occasion d'un contrôle mentionné
   à l'article L. 812-2 »). Les renvois entre articles sont donc suivis dans les deux
   sens, et les articles du même chapitre que les meilleurs résultats sont ajoutés.

## Avertissement

Sofia informe sur le droit ; elle ne donne pas de conseil juridique et ne remplace ni un
avocat, ni un notaire, ni un juriste. Pour un cas personnel, elle renvoie aux
professionnels et aux services compétents.


---

# Attribution — les 24 codes en texte intégral (Runde 198, 22 septembre 2026)

Jusqu'à la Runde 197, seuls trois codes avaient leur **texte** en local ; les autres
n'avaient qu'un index de numéros et une fiche de notions, et l'article n'apparaissait que
s'il était **nommé** dans la question. La Runde 198 a relevé le **texte intégral** de
**24 codes**, comme pour le CESEDA — c'est ce que l'utilisateur appelle « le traitement
CESEDA », et c'est désormais la règle pour tout texte de loi qu'il donne.

- **Source** : `https://codes.droit.org/` — miroir public du fonds **Légifrance/Dila**
  (textes officiels, champ `lastup` = date de dernière mise à jour du code). Une
  adresse par code : `https://codes.droit.org/payloads/<Nom du code>.xml` (XML).
  Légifrance reste la source de référence ; `codes.droit.org` en est la copie
  exploitable (le `robots.txt` de Légifrance bloque le téléchargement en masse).
- **Textes officiels** : libres de droits au sens de l'article L122-5 du CPI (les lois
  et règlements ne sont pas protégés par le droit d'auteur). Repris **tels quels**, sans
  aucune modification, avec la date de chaque version.
- **Résultat** : **90 101 articles en vigueur** dans **24 codes**, avec, pour chaque
  article, sa numérotation, son texte et son **date de version** (et la mention
  « abrogé » le cas échéant). Les 350 / 53 / 928 / 582 / 991 / 267 / 102 articles abrogés
  des sept premiers codes sont conservés dans l'index (repérage) sans être proposés comme
  texte en vigueur.

## Les 24 codes

| Code | Identifiant Légifrance | Articles en vigueur |
| --- | --- | --- |
| Code civil | `LEGITEXT000006070721` | 2 899 |
| Code pénal | `LEGITEXT000006070719` | 1 301 |
| Code de procédure pénale | `LEGITEXT000006071154` | 4 631 |
| Code de l'éducation | `LEGITEXT000006071191` | 5 010 |
| Code de l'entrée et du séjour des étrangers et du droit d'asile (CESEDA) | `LEGITEXT000006070158` | 2 496 |
| Code de la famille et de l'aide sociale | `LEGITEXT000006072637` | 12 |
| Code de justice administrative | `LEGITEXT000006070933` | 1 279 |
| Code du travail | `LEGITEXT000006072050` | 11 592 |
| Code de la santé publique | `LEGITEXT000006072665` | 13 661 |
| Code de la sécurité sociale | `LEGITEXT000006073189` | 7 421 |
| Code de l'action sociale et des familles | `LEGITEXT000006074069` | 3 689 |
| Code de la consommation | `LEGITEXT000006069565` | 2 104 |
| Code de la route | `LEGITEXT000006074228` | 1 174 |
| Code de procédure civile | `LEGITEXT000006070716` | 2 085 |
| Code de la justice pénale des mineurs | `LEGITEXT000039086952` | 560 |
| Code de commerce | `LEGITEXT000005634379` | 7 255 |
| Code de la propriété intellectuelle | `LEGITEXT000006069414` | 1 896 |
| Code des relations entre le public et l'administration | `LEGITEXT000031366350` | 476 |
| Code de l'environnement | `LEGITEXT000006074220` | 7 277 |
| Code de l'urbanisme | `LEGITEXT000006074075` | 2 459 |
| Code de la construction et de l'habitation | `LEGITEXT000006074096` | 4 114 |
| Code du sport | `LEGITEXT000006071318` | 1 915 |
| Code de la sécurité intérieure | `LEGITEXT000025503132` | 2 927 |
| Code pénitentiaire | `LEGITEXT000045476241` | 1 868 |

## Ce que contiennent les fichiers (nouveau format)

- `<slug>/articles.json.gz` — le **texte en vigueur** des articles :
  `{num, texte, etat, debut, fin}`, plus la date de version. Compressé en **gzip**
  (obligatoire : 150 Mo en clair, 20 Mo compressés ; le navigateur lit avec
  `DecompressionStream("gzip")`).
- `<slug>/index.json.gz` — la table **numéro d'article → accès**, y compris les
  articles abrogés (repérage seulement).
- `numbers-index.json.gz` — une seule petite carte (234 Ko) de **68 661 numéros** de
  tous les codes : « cette numérotation existe-t-elle dans le fonds ? ». Elle sert à
  `_loadLegal()` pour refuser une numérotation inventée.
- `codes-index.json` — le registre des 24 codes : nom, identifiant `LEGITEXT`, date de
  mise à jour, nombre d'articles, chemins des fichiers, et le champ `words` (20 à 68
  **termes d'usage courant** par code) qui sert à **router** une question vers le bon
  code. Le routage ne se fait plus par chemins de plan (il se trompait) mais par mots,
  avec la flexion des préfixes à partir de 5 lettres.

## Remplacement des anciens fichiers

Les fichiers en clair `articles-code-civil.json`, `plan-code-civil.json` et
`articles-index.json` (Runde 173–197) ont été **remplacés** par le format compressé
ci-dessus. `notions-droit-civil.json` (texte rédigé pour l'utilisateur) est conservé tel
quel. Le lecteur (`App.DroitLookup`) et la fiche (`App.DroitMemo`, 86 sections au lieu
de 1 746) ont été adaptés dans `index.html`.

## Avertissement

Sofia informe sur le droit ; elle ne donne pas de conseil juridique et ne remplace ni un
avocat, ni un notaire, ni un juriste. Pour un cas personnel, elle renvoie aux
professionnels et aux services compétents.

---

# Attribution — les documents en texte intégral (Runde 198)

Les documents que l'utilisateur a remis (sexologie, mathématiques, HTML/CSS, anatomie et
physiologie) ont reçu le même traitement que les codes : leur **texte intégral** est en
local (`src/<domaine>/texte.json.gz`), découpé par page, avec source, auteur, licence et
page sous chaque passage cité. Sources et auteurs respectifs :

- **Sexologie** : Guide de premier recours en sexologie (RSSP, 2023) ; Guide de
  prescription des examens et des traitements en santé sexuelle (RSSP, 2021) ; Guide pour
  l'EVRAS — Sexualité et comportements sexuels (Fédération Wallonie-Bruxelles) ; Notions
  générales de sexologie (CHU de Nantes) ; Item 40 — Sexualité normale et ses troubles
  (CNGOF / UNF3S).
- **Mathématiques** : TAGE 2 — Mémo mathématique (ECRICOME) ; Les fractions
  (maths-et-tiques.fr, Yvan Monka).
- **HTML et CSS** : Apprendre à coder en HTML et CSS — cours de 2nde ICN (projet.eu.org,
  PUShAUNE).
- **Anatomie et physiologie** : Anatomie et Physiologie Humaines (medicalistes.fr).

Reprise du texte des documents remis par le propriétaire, avec citation de la source.
Droits des auteurs respectifs. La manière de les incorporer (lecture du PDF, découpage,
gzip, registre) est décrite dans `src/CORPUS.md`.

---

# Attribution — la jurisprudence administrative (Runde 279, 24 septembre 2026)

Deux sources publiques, toutes deux du **Conseil d'État**, réunies dans le dossier
`src/droit/jurisprudence/` et hébergées comme le corpus de lois.

## 1. ArianeWeb — la sélection jurisprudentielle

- **Source** : ArianeWeb, la base publique de jurisprudence administrative du Conseil
  d'État — https://www.conseil-etat.fr/ressources/decisions-contentieuses/arianeweb2
- **Ce qui en a été pris** : les pages officielles présentant la juridiction
  administrative (organisation, formations de jugement, voie de recours), la base
  ArianeWeb elle-même, les analyses de jurisprudence, et les **75 grandes décisions
  depuis 1873** avec, pour chacune, les faits et le sens et la portée.
- **Fichier** : `jurisprudence/notions.json.gz` — 164 sections, texte du Conseil d'État
  repris tel quel, avec l'adresse de chaque page sous la section (`u`).
- **Usage en direct** : `App.JuriLookup` interroge ArianeWeb à l'exécution (deux appels :
  `xsearch` pour la recherche, `Service.downloadFilePagePlugin` pour lire le document) et
  met dans le prompt le **texte des décisions trouvées**, jamais un souvenir de modèle.
  Les conclusions du rapporteur public sont des PDF, lus par pdf.js.

## 2. L'open data de la justice administrative — toutes les décisions

- **Plateforme** : https://opendata.justice-administrative.fr/
- **Ce qu'elle publie** : l'ensemble des décisions des **tribunaux administratifs**
  (depuis le 30 juin 2022), des **cours administratives d'appel** (depuis le 31 mars 2022)
  et du **Conseil d'État** (depuis le 30 septembre 2021), en XML, regroupées en archives
  « zip » par juridiction, année et mois (`/DCE/`, `/DCA/`, `/DTA/`).
- **Fichier** : `jurisprudence/opendata.json.gz` — 12 sections décrivant la plateforme :
  ce qu'elle publie et depuis quand, la façon de télécharger les archives, les balises
  XML, le sens des codes de publication (A, B, C, D, Z), le moteur de recherche, la
  licence et ses obligations, la pseudonymisation, et la différence avec ArianeWeb.
- **Usage en direct** : `App.OpenDataLookup` interroge le moteur public de la plateforme
  (`/recherche/api/Simple_Search/openData/<requête>/<n>`, la requête en **ET** « +mot1
  +mot2 ») et lit le **texte intégral** d'une décision par la vue publique
  (`/recherche/api/testView/openData/unHighlight/<fichier>/<code>/<numéro>`). Les
  décisions lues sont citées avec leur juridiction, leur numéro de dossier, leur date de
  lecture, leur classement, et le nom de l'archive mensuelle qui les contient.

## Statut juridique et obligations de réutilisation

La plateforme d'open data est soumise à la **licence ouverte de réutilisation
d'informations publiques version 2.0** (licence Etalab), complétée par les **conditions
générales d'utilisation** du Conseil d'État (version du 18 janvier 2022). Ces conditions
imposent en particulier :

- de **mentionner la source** : les données proviennent de la base de données ouvertes
  tenue par le Conseil d'État — c'est ce que fait le bloc de prompt, qui cite
  `opendata.justice-administrative.fr` sous chaque décision et donne l'adresse de
  l'archive mensuelle ;
- de **mentionner la date de la dernière mise à jour** des données réutilisées ;
- de **ne pas dénaturer ni falsifier** le sens des décisions ;
- de respecter les personnes concernées — les décisions sont **pseudonymisées** avant
  leur diffusion (articles L. 10 et R. 741-13 à R. 741-15 du code de justice
  administrative) ;
- de s'abstenir de tout **profilage des magistrats et des greffes**, formellement interdit
  par le quatrième alinéa de l'article L. 10 du code de justice administrative.

Les décisions de justice sont des documents administratifs librement réutilisables dans
ce cadre ; elles sont reprises **telles quelles**, sans aucune modification.

## Avertissement

Sofia informe sur le droit ; elle ne donne pas de conseil juridique et ne remplace ni un
avocat, ni un notaire, ni un juriste. Pour un cas personnel, elle renvoie aux
professionnels et aux services compétents.
