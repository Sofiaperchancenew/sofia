# Miroir des corpus de Sofia (générateur Perchance `s-o-f-i-a`)

Ce dépôt est le **miroir de secours** des fichiers que le générateur lit à distance. Il ne remplace
pas l'adresse principale (`user.uploads.dev`) : il permet à l'application de continuer à fonctionner
si celle-ci tombe, et il sert de copie de sauvegarde hors Perchance.

## Mise en place (une seule fois)

1. Créer un dépôt **public** sur GitHub (nom libre) et y déposer **tout le contenu de l'archive** :
   l'arborescence `src/` doit se trouver **à la racine** du dépôt.
2. Dans le générateur, ouvrir `src/remote.json` et remplir la ligne `"mirror"` — la base, avec le
   `/` final :

   ```json
   "mirror": "https://cdn.jsdelivr.net/gh/<compte>/<depot>@<commit>/"
   ```

   `@<commit>` (ou `@<tag>`) fige la version — c'est recommandé. On peut aussi utiliser
   `https://raw.githubusercontent.com/<compte>/<depot>/<commit>/` à la place de jsDelivr.
3. Enregistrer. C'est tout : le chargeur essaie l'adresse principale, puis le miroir si elle
   échoue (avertissement `[LoadJson] … essai du miroir : …`), et garde en mémoire l'adresse qui a
   marché.

## Contenu

- `src/<domaine>/…json.gz` — les fiches et index des douze domaines (maths, anatomie, web, python,
  sexo, dico, médicaments, métiers, anciennes écritures, langues, GBD, code).
- `src/droit/…` — le corpus de lois (24 codes, ~89 000 articles) et les fiches de notions.
- `src/docs/history.enc` — le récit complet du projet (chiffré AES-128-GCM, clé dans `index.html`).
- `src/docs/README-full.md.gz` — l'archive des sections §9–§171 de la documentation (gzip).
- `src/README.md`, `src/KNOWLEDGE.md`, `src/CORPUS.md`, `src/remote.json`,
  `src/droit/remote.json` — la documentation et les tables de traduction, pour que ce dépôt se
  suffise à lui-même.

## Quoi mettre à jour

- À chaque ronde qui repacke la documentation, seuls changent `src/docs/history.enc` et parfois
  `src/docs/README-full.md.gz` et `src/README.md` : remplacer ces fichiers, un commit suffit.
- Une **nouvelle** fiche de domaine reçoit, comme aujourd'hui, une entrée dans la table `files` de
  `src/remote.json` (le nom du fichier doit correspondre, caractère pour caractère, à la clé). Pour
  le miroir, rien à ajouter : le chemin logique est accroché à la base.

## Note

Tout ceci est public — les mêmes fichiers le sont déjà chez `user.uploads.dev`. N'y déposer ni clé,
ni secret, ni donnée personnelle. Les modules chiffrés du générateur (`src/*.js`) ne sont **pas**
dans ce miroir : ce dépôt ne contient que des corpus et de la documentation.
