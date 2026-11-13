# SFW strip-build v1

But : produire un **arbre strippé prouvé 100 % SFW** (zéro string érotique
*générative*) sans toucher l'arbre live.

## Pièces

- `registry.json` — registre des unités : `neuter` (14 fonctions de `src/app.js`,
  corps → `return ''`, appelants vérifiés falsy-safe le 2026-11-13),
  `dropLine` (1 entrée corpus bdsm), `keep` (gardes, détection, médical, SFW —
  avec raison).
- `strip.js` — script worker (global `fs` d'`execute_js`) : applique le registre
  sur une **copie** vers `scratch/sfw-build/` + `STRIP-REPORT.json`. Vérifie les
  ancres avant chaque op ; toute ancre manquante = erreur rapportée, pas de
  bricolage silencieux.
- `scan.js` — scanner de preuve : marqueurs de prose érotique (ancres exactes,
  pas de lexique flou qui casse sur « tenue »/« 69 »). Attendu : live N>0
  (unités au registre), strippé N≈0.

## Résultat v2 (2026-11-13, vérifié)

- Run : **25 ops, 0 erreur** (16 neuters + 5 dropLines + 2 replace).
- Scanner : **live 104 → strippé 3**, les 3 résidus étant des keeps documentés
  (regex de détection `SCENE_WORDS_RE`, 2 gardes anti-fusion `herBody`).
- Boot-test de l'arbre strippé (swap en place + `page_refresh` + restore) :
  `booted:true`, blocs OK, tails neutrés → `''`, prompt neutre **42936 car
  byte-identique** au live, invariants OK. Live restauré et revérifié.
- Preuve : `scratch/sfw-build/` + `STRIP-REPORT.json`.
  Backup du live au moment du test : `scratch/sfw-backup-2026-11-13/`.

## Procédure

1. `execute_js` : charger + exécuter `strip.js` (via AsyncFunction du contenu,
   le worker n'a pas d'import de fichier).
2. `execute_js` : exécuter `scan.js` sur `src` (référence) puis
   `scratch/sfw-build` (preuve), comparer.
3. Boot-test : sauvegarder `src/app.js` + `src/app-b1.js` vers
   `scratch/sfw-backup-YYYY-MM-DD/`, copier les versions strippées en place,
   `page_refresh`, vérifier `booted:true` + build prompt 42936 car + invariants,
   puis **restaurer** et revérifier. (Le prompt neutre doit être byte-identique :
   les tails neutrés rendent déjà `''` hors scène.)
4. Ne jamais commiter l'arbre strippé par-dessus `src/` sans ordre explicite :
   c'est une preuve + une base de build, pas (encore) le live.

## Garde-fous

- Aucune string de garde/refus/détection/médicale n'est retirée (voir `keep`).
- Toute erreur d'ancre bloque l'op correspondante avec rapport (pas de splice
  aveugle — cf. incident splice 2026-11-13).
- Le scanner ne prouve que les marqueurs listés ; tout nouveau contenu adulte
  doit d'abord entrer au registre.
