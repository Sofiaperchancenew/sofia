# Sofia — miroir GitHub (secours du corpus)

Ce depot est le **miroir de secours** du corpus de Sofia (lui-meme heberge sur
`user.uploads.dev`). L'application lit d'abord l'adresse principale, puis ce
miroir **seulement si elle echoue** (`App.Core.openJson`, ronde 275).

Base jsDelivr (a renseigner dans `src/remote.json` du generateur) :

```
https://cdn.jsdelivr.net/gh/Sofiaperchancenew/sofia@main/
```

Le chemin logique est simplement accroche : `src/python/py-sdv-bases.json.gz` ->
`https://cdn.jsdelivr.net/gh/Sofiaperchancenew/sofia@main/src/python/py-sdv-bases.json.gz`.

## Le soir : ce qui part tout seul

Le workflow `.github/workflows/scrape.yml` tourne **tous les soirs a 20h UTC**
(22h Paris en ete) + a la main (`workflow_dispatch`) :

1. `scripts/scrape.mjs` -> `data/sofia-data.json` (petites donnees du jour, lues par `App.GitHubData`).
2. `scripts/mirror-corpus.mjs` -> `src/...` (les 200+ fichiers de `data/corpus-manifest.json`).
3. commit + push automatiques.

Rien a faire a la main : pousser ce dossier une fois, le soir fait le reste.

## Premier depot manuel (une fois)

```bash
cd sofia-miroir
 git init -b main
 git add .
 git commit -m "miroir initial"
 git remote add origin https://github.com/Sofiaperchancenew/sofia.git
 git push -u origin main --force
```

Puis lancer le workflow a la main (onglet Actions -> donnees-du-soir -> Run)
pour remplir `src/...` des le premier soir. Quand jsDelivr repond
(`https://cdn.jsdelivr.net/gh/Sofiaperchancenew/sofia@main/data/sofia-data.json`),
renseigner la base dans `src/remote.json` : le secours est actif.
