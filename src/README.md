# Catalogue vêtements — base roleplay

- Données : `vetements-catalog.json` (~210 Ko, 500+ pièces au 2026-10-01) :
  - Etam femme (5 rubriques) : lingerie, collants et bas, pyjama, vêtements femme, maillots.
  - RougeGorge femme (7 rubriques) : ultra sexy, culottes, nuit, soutiens-gorge, collants et bas, maillots, vêtements.
  - Glamuse homme (7 rubriques) : boxers, strings, nuit & homewear, détente, pulls & gilets, caleçons, slips.
  - Chaque pièce : pid, shop, brand, nom, url produit, prix, coloris, image (URL d'origine), description (Etam).
- Usage runtime : `App.Core.imageVetementsBrief()` (index.html) injecte un mix
  femmes (Etam + RougeGorge) + homme (Glamuse) dans le prompt d'image (`writeImagePrompt`).
- Images : seuls les descriptifs sont embarqués ; les photos restent
  hotlinkées (images.etam.com, rougegorge.com, static.glamu.se) pour ne pas peser sur le quota.

## Mise à jour mensuelle (recette agent)

1. `fetch_url` les URLs listées dans `update-catalog.js` (CATS_ETAM, CATS_RG, CATS_GL) vers `scratch/etam|rg|gl/*.html`.
2. `execute_js` : exécuter le contenu de `src/data/update-catalog.js`
   (lit les HTML scratch, réécrit `vetements-catalog.json`).
3. Vérifier : `noName = 0`, `noImg = 0` ; `page_eval`
   `(await App.Core.imageVetementsBrief()).length > 100` après `page_refresh`.
4. GitHub : `attach_file` ou `upload_file` du JSON puis commit dans le dépôt.
   L'envoi direct sur GitHub n'est possible que si le propriétaire fournit
   l'URL du dépôt + un token — jamais de secret dans `src/`.

## Menu intégré (envoi direct depuis Sofia)

Réglages → groupe « Catalogue vêtements → GitHub » (carte `catalogPushCard`,
module `App.CatalogPush` dans index.html) :
- Visible uniquement en mode concepteur (`App.Access.mode() === 'owner'`),
  verrouillé partout ailleurs.
- Token GitHub en localStorage (`sofia_cat_token_v1`) : jamais dans le code,
  envoyé uniquement à api.github.com. Boutons enregistrer / effacer / tester.
- « 1 · Rafraîchir » rescrape les 19 rubriques via `root.superFetch` ;
  « 2 · Envoyer vers GitHub » fait un PUT Contents API (crée ou met à jour).
  Repli : « Télécharger le JSON » pour commit manuel.

# Catalogue BDSM — base donjon

- Données : `bdsm-catalog.json` (~588 Ko, 1080 pièces) :
  - Eveselache (10 rubriques) : cages, urètre, contraintes, bâillons, fouets,
    cockrings, colliers, pinces, mobilier loveroom, crochets acier.
  - Univers BDSM (8 rubriques) : godes ceinture, cages, camisoles, latex,
    plugs anaux, dildos, sex machines, crochets anaux.
  - Sybian (1 produit) + F-Machine (catalogue machines).
  - Sinful (18 rubriques, 181 pièces via fiches produit JSON-LD + liés) :
    spéculums, chasteté, électro & médical, pinces & pompes, vêtements BDSM,
    machines, lingerie ouverte, soutiens & ensembles, bondage, guêpières &
    corsets, strings & culottes, combinaisons & catsuits, bas & collants,
    porte-jarretelles, anal, geisha, godes, lubrifiants & soins.
- Prénoms INSEE : `prenoms-insee.json` (98 femmes + 69 hommes, occurrences,
  source HuggingFace `eltorio/french_first_names_insee_2024`, MIT) : pool de
  repli du casting (`App.Scene._fallbackCast` via `_poolNames`, base moderne ×4
  + INSEE, accents corrigés) ; le casting principal reste génératif.
- Fiches mémos (v318) : `cuisine/cuisines-monde.json` (40 sections : hygiène,
  cuissons, sauces, pain/pâtisserie, conservation, 16 plats du monde),
  `physique/bases-physique.json` (41 : unités, mécanique, énergie, électricité,
  ondes, gravitation), `grammaire/grammaires-monde.json` (42 : français complet
  + 9 langues), `histoire-geo/monde-par-pays.json` (42 : méthode, 36 pays,
  frises). Savoirs stables, doses/temps familiaux usuels.
    Recette : `src/data/update-sinful.js` (sitemap + `sin-fetchmap.json` →
    `sinp-*.html`, JSON-LD Product ; liés décodés double-échapés, url=null,
    re-catégorisés par nom ; API Relewise 401 car clé restreinte à l'origine).
  - Chaque pièce : pid, shop, brand, nom, url produit, prix, image (UB),
    description (UB).
- Usage runtime : `App.Core.loadBDSMBrief()` (index.html) injecte un mix des
- Règle d'inventaire : jamais de prix dans le brief runtime (tout est déjà acheté : machines dans le donjon, objets dans son armoire, vêtements dans le dressing). Les prix restent dans le JSON brut, hors prompt.
  20 rubriques (2 rondes, ≤2000 caractères) dans `donjonBlock`
  (section REAL SHOP CATALOGUE). Huile pimentée du donjon (chili_oil) :
  Pepper X Special Reserve de Smokin' Ed (Capsicums, 60 ml).
- Recette mensuelle : `src/data/update-bdsm.js` (même recette que vêtements :
  fetch_url des 20 pages vers `scratch/bdsm/*.html`, exécution via
  AsyncFunction sur `fs`, vérification `noName = 0`).
- GitHub : même menu CatalogPush (changer le chemin vers
  `data/bdsm-catalog.json`).

- `dressingBlock` (index.html) : inventaire d'habillage par personnage — HER WARDROBE (femmes) / HIS WARDROBE (lui), sans prix, branché dans le prompt de scène comme donjonBlock.

- Disponibilité : `donjonBlock` / `donjonTail` / `dressingBlock` obéissent à deux règles : `dressingBlock` est actif dans toutes les scènes du jeu de rôle (`castLatched`) pour habiller chaque personnage n'importe quand ; `donjonBlock` / `donjonTail` (accessoires BDSM : plugs, etc.) uniquement en scène érotique (`sceneCraftActive`).

- `castIdentityTail` (index.html) : garde-fou d'identité actif dès `castLatched`, même hors scène érotique — les deux femmes verrouillées, jamais Sofia, pas d'anglais (corrige les tours où le mode scène ne se déclenche pas).

- `castRemember` (index.html) : les prénoms verrouillés sont mémorisés dans `session.sceneMem.cast` (persisté) — après un reload sans historique, `castLatched`/`sceneCastNames`/`castIdentityTail`/`dressingBlock` refonctionnent (corrige les tours « sans réponse » post-F5).

- `castMoveTail` (index.html) : règle anti-téléportation, active dès `castLatched` sur ordre/déplacement — réponse parlée + marche décrite (porte, pas, arrivée), pièce nommée avant reprise des caresses.

- Donjon = pièce chaleureuse (section THE ROOM ITSELF en tête de DONJON_SECTIONS : bois, cuir, lumière chaude — jamais pierre/caveau) ; `castIdentityTail` interdit l'ouverture méta (pas de « je ne sais pas », pas d'acronyme, la 1re réplique OUVRE la scène).

- Tête de distribution variable : `castParseCount` (1-20 en chiffres/lettres/dix-sept..dix-neuf, harem) + `castHeadcount` (message > scène en cours > mémorisé > tirage 1-20 ; « recommence » retire). `castBlock`/`castTail`/`castIdentityTail`/`castMoveTail` et les 3 relances parlent de toutes les femmes du nombre, 180-320 mots quel que soit le nombre. Défaut scène : tirage 1-20 (plus 8).

- La Boutique du Hard : 180 pièces via JSON-LD ItemList (connectés, hygiène/lubrifiants, électro, lingerie femme, nouveautés — prix EUR, images).

- Brief `loadBDSMBrief` : rotation quotidienne du point de départ (jour du mois % nb rubriques) pour que les 52 rubriques tournent dans les 2000 signes — jamais de prix (règle d'inventaire).

- Distribution mixte 1-20 : `castParseMix` (ex. « 3 femmes et 2 hommes », « harem de 2 hommes ») mémorisé dans `session.sceneMem.castMix` ; `castPlayerLine` (sexe joueur via `addresseeSex`) + `castOriLine` (hétéro/bi/gay selon demande, jamais imposé) injectés en fin de prompt via `castTailPlus` ; moteur `Scene._castWomen`/`_fallbackCast` avec prénoms et looks masculins ; dressing avec rayon hommes.
