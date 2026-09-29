# Attribution — dossier « code » (Runde 199, 22 septembre 2026)

Ce dossier a été constitué le 22 septembre 2026 à la demande de l'utilisateur :
« apprends-lui le codage, le java, le css, le html, le python et je serais un programmeur
comblé … donne-lui ton script en intégration ou des cours ». HTML/CSS et Python avaient
déjà leurs cours (`src/web/`, `src/python/`) ; **Java** et **JavaScript** n'avaient rien.
Ils ont maintenant un cours **en texte intégral**, chapitre par chapitre.

## Sources

| Document | Source | Auteur | Licence |
| --- | --- | --- | --- |
| Programmation Java | https://fr.wikibooks.org/wiki/Programmation_Java | Wikilivre (contributeurs) | CC BY-SA 4.0 / GFDL |
| Programmation JavaScript | https://fr.wikibooks.org/wiki/Programmation_JavaScript | Wikilivre (contributeurs) | CC BY-SA 4.0 / GFDL |

Les deux livres ont été pris dans leur **version imprimable** (toutes les pages du livre
d'un seul tenant), puis convertis du HTML rendu vers du texte en conservant les
**blocs de code** (c'est le point important d'un cours de programmation) — voir
`src/docs/wiki-to-text.mjs`. Découpage par chapitre, puis compression gzip :
`src/code/texte.json.gz` (**997 sections**, 457 chapitres de Java, 386 de JavaScript,
8 pages du guide d'intégration).

## Troisième document — le guide d'intégration

`src/code/integration.md` est un **texte rédigé pour ce projet** : un cours d'intégration
(HTML décrit, CSS habille, JavaScript agit ; les cinq gestes du DOM ; structurer en
fonctions ; Java face à JavaScript ; la méthode pour ajouter une fonctionnalité à une
application existante ; comment lire du code qu'on n'a pas écrit). Il est repris dans le
même bestand (`texte.json.gz`) pour que Sofia puisse s'en servir quand on lui demande
d'apprendre à programmer ou d'améliorer un programme.

## Licence et reproduction

Les cours de Wikilivre sont repris **tels quels**, sans modification, sous licence
Creative Commons BY-SA 4.0 (et GFDL pour les versions anciennes), avec citation de la
source. Le guide d'intégration est un texte original écrit pour ce projet. Aucune
modification n'est apportée aux cours : chaque passage du bestand dit le chapitre et le
livre d'où il vient.

## Ce que fait Sofia avec ces cours

`App.CodeMemo` (index.html) ouvre la porte quand la question porte sur Java, JavaScript,
la programmation en général ou l'intégration ; `App.Corpus` met alors les **chapitres
réels** du cours dans le prompt, avec l'ordre d'expliquer, de nommer le chapitre, de
citer la phrase du cours et d'écrire le code **complet**. HTML/CSS reste le cours de
`src/web/`, Python celui de `src/python/`.

## Avertissement

Sofia apprend à programmer ; elle n'est pas un environnement de développement. Le code
qu'elle écrit doit être **testé** : elle donne le fichier, la commande de compilation ou
d'exécution, et signale ce qu'elle n'a pas pu vérifier elle-même.
