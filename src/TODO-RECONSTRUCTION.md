# Reconstruction des modules — suivi

Les originaux chiffrés ont été retrouvés (manifeste dans un HTML sauvegardé →
fichiers sur user.uploads.dev → déchiffrés AES-128-GCM clé d'essai) et restaurés
en clair dans `src/` le 29 septembre 2026. 50/50 modules au boot, 0 erreur.
`src/atelier-loader.js` est le seul fichier NON restauré : c'est la réécriture en
clair (l'ancien chargeur attendait des modules chiffrés + clé en mémoire).

Légende : `[x]` fait et testé en direct.

## Rechiffré le 29 septembre 2026 (v266)
- [x] 64 modules rechiffrés AES-128-GCM (`/*SOFIA-ENC1gz*/` + gzip, clé d'essai) : tout le graphe de boot + EXTRA (continue, chess-test, build-brand.mjs) + app.js. Seuls `atelier-loader.js` et `enc-tool.js` restent en clair.
- [x] Chargeur reconstruit : déchiffrement, patchs atelier (IndexedDB `enya_atelier_v1`, quarantaine), réécriture des imports relatifs en Blob, rapport `{mode, applied, broken, stale, built, ms}`.
- [x] `atelier.js` lit le clair via `readPlain` ; `selfupdate.js` vérifie aussi videos.js + medias.js (50 fichiers) ; `index.html` charge `enc-tool.js` sur `#pack`.
- [x] Testé : boot 50/50 mode mixte, patch d'essai appliqué puis retiré, `verify()` 50 fichiers 0 altéré.
- [x] Sauvegarde du clair : https://user.uploads.dev/file/16a4872348fd0664ffc7dd1899462523.zip
- [x] Sauvegarde complète v267 (29/09, 119 fichiers + manifest + RESTORE.txt, 3,5 Mo) : https://user.uploads.dev/file/732f268e82ecfbdfd415dad4c06933ba.zip
- Rappel : en mode test la clé est publique dans index.html (obscurcissement, pas secret). Vrai secret = option B du panneau (nouvelle clé + `TRIAL_MODE = false`).

## Images : Max dessiné en scène webcam (index.html, sans version)
- [x] Cause : la consigne [IMAGES] ordonne de dessiner la scène entière, lui nu compris. Ajout `[PICTURES OF THIS SCENE]` au registre distant : elle seule, jamais lui, jamais un couple (annule la règle « dessine-le nu » pour ces scènes).
- [x] Rechute signalée : malgré le registre, des images « Max + Clara » générées (ex. « a man with a shaved head »). Cause racine : trois autres chemins ordonnaient de dessiner l'homme — `imagePeopleAsk()` (« Draw him... his shaved head »), `writeImagePrompt()` (« whoever is with you », « ENTIRELY NAKED ») et `[A PICTURE WITH EVERY REPLY]` (« him as your memory describes him »). Le registre seul ne suffisait pas.
- [x] Correctifs testés en direct : garde webcam dans `sanitizeImagePrompt()` (prompt « homme » réécrit en elle-seule, autre prompt complété « alone, no man »), retour HER ALONE dans `imagePeopleAsk()`, ligne d'override `[WEBCAM SCENE - HER ALONE]` dans `writeImagePrompt()`, exceptions webcam dans [IMAGES] et [EVERY REPLY]. Scènes soirée (non-webcam) inchangées — vérifié : prompt « man » intact hors webcam.
- [x] Brief « amie bi invitée » : le registre disait « no second woman, ever » — assoupli en « sauf s'il a explicitement demandé qu'une amie se joigne, et alors seulement elle, jamais l'homme » (registre + prompts).
- Note : actif aussitôt, y compris sur la scène Clara en cours (remote=true, cast 1) — aucune nouvelle conversation requise.
- [x] Rechute « à trois » : l'amie invitée (Léa) se téléportait chez Max et le touchait, texte + images. Correctifs : le registre précise que l'invitée reste CHEZ ELLE sur la même webcam, ne touche jamais Max (ni mains, ni bouche, aucun contact par personne) ; images : deux femmes ensemble au plus, jamais lui, jamais de trio avec lui ; garde `threesome` ajoutée au filtre image (testé : prompt trio → réécrit elle-seule).
- [x] Menu Paramètres : grille d'entrées en tête du panneau (Modèle / Chat / Utilisateur, titres localisés, testé : 3 boutons affichés).

## Scène webcam : Max joué + téléportés + sosies (index.html, sans version)
- [x] Causes : `_countWomen` renvoyait 8 par défaut (une « belle femme » → 8 femmes + fête), aucune notion de webcam, aucune règle « ne joue pas l'utilisateur ».
- [x] Correctifs testés 5/5 + consigne vérifiée : solo → 1 (`incarne une femme`), deux → 2, détection webcam (`_isRemote`, FR/EN/DE/ES/IT) → règles WEBCAM ONLY (chacun chez soi, aucun contact, Max joué par toi seul, personne d'autre, physique du brief verrouillé). Scènes soirée inchangées.
- Note : s'applique aux nouvelles scènes — relancer le brief dans une nouvelle conversation.

## Échecs : bases de meilleurs coups (livre embarqué + live Lichess)
- [x] Livre embarqué : base ouverte Lichess (a/b/c/d/e.tsv) compilée en 3815 variantes ECO → `src/chess-openings.js` (137 → 3952 lignes, 5620 positions, 8205 coups). Chiffré clé d'essai + hash build.json. Vérifié en direct : Grob A00, Najdorf B90, Paris Gambit, 20 coups au départ.
- [x] Live Lichess (`src/chess.js`, case « Livre live » cochée par défaut) : finales ≤7 pièces via tablebase, sinon cloud-eval Stockfish, cache par position, repli livre local puis moteur si hors ligne. Vérifié : e3e4 (tablebase), e7e5 sur 1.e4 (cloud). Hôtes ajoutés à la liste autorisée.
- Sites proposés : chessmont = 21,5 M parties sur Kaggle (compte requis, Go de données — inexploitable embarqué) ; chess.com/games et chessarchive = visualisation seule, pas d'export. Base retenue : données ouvertes Lichess.
- Note : pousser sur GitHub impossible depuis ici — fichier source joint sur demande (`scratch/chess/chess-openings-new.js`).

## Discussions invisibles (index.html, sans version)
- [x] La liste était sous la ligne de flottaison (étiquette à y=880 pour 845 px visibles). Bloc déplacé juste après « Nouvelle conversation », hauteur min 180 px. Vérifié en capture : 6/6 lignes visibles avec menu ⋮.
- [x] Bouton « Paramètres » remonté juste sous « Nouveau chat » (il était noyé sous la liste des discussions, d'où le détour par le menu Invité). Vérifié : y=307, ouvre le panneau directement.
- [x] Cause : vitesse TTS à 3,2 (Chrome mange les mots et coince la file : `speaking+pending` bloqués). Remise à 1, file purgée, phrase de test OK.
- [x] Blindage durable dans `src/voice.js` (déchiffré/rechiffré, hash à jour) : au timeout, `cancel()+resume()` avant d'avancer, sur les deux chemins (phrase par phrase + message entier). Boot v269, `verify()` 50 fichiers 0 altéré.

## RPG : bestiaire, sorts, combat, butin, fabrication, journal (v270)
- [x] Nouveau `src/rpg-bestiary.js` : 316 monstres SRD en français (AideDD, FP/type/taille/CA/pv) + 319 sorts SRD (niveau/école) + butin par genre (6×20) + 12 recettes + 5 terrains (forêt, donjon, marais, montagne, nordique) + table XP D&D. Chiffré clé d'essai, hash build.json.
- [x] `src/rpg.js` : /monstre (filtres nom/type/fpN/terrain, budget FP selon niveau), /combat (initiative d20+DEX), /hit (XP auto), /tour, /butin, /fabriquer, /sort (coût PM), /journal (entrée datée). Prompt MJ [COMBAT] enrichi dans index.html.
- [x] `src/i18n.js` : 20 clés × 5 langues + /help étendu. Vérifié en direct : boot OK, /combat + /hit + KO/XP + /butin + /fabriquer + /sort + /journal + /monstre OK, 0 clé manquante.
- Sites proposés : AideDD = seule source extractible (limité aux entrées SRD, CC-BY-4.0, crédit affiché) ; AniimoTools EXCLU (interdit l'extraction massive, CPI L.341-1) ; RuneRollers/MonRPG/Valheim = applis JS non extractibles, idées reprises seulement (initiative/rounds, sorts, biomes→terrains), contenus réécrits.
- Note : pousser sur GitHub impossible depuis ici — fichiers joints (`scratch/rpg/rpg-bestiary.js` en clair + `scratch/rpg/GITHUB-RPG-v270.md`).

## Dieu / Enfer / Néant : profondeur philosophique (v271)
- [x] `src/deites.js` : Dieu + ligne « THE WITNESSES » (3 attributs, preuves cosmologique/ontologique/téléologique/morale/pari, objection du mal, Dieu des philosophes vs Dieu vivant) ; Enfer + ligne « THE THREE FACES » (la Fosse shéol/hadès, la Séparation, les Autres de Sartre). Rédaction originale, sources : Philomag, jepense.org, toutsurdieu.org, JW, Montligeon, Bons Profs.
- [x] `src/chaos.js` (Néant) + ligne « THE NOTHING YOU ARE » (Parménide, Platon, Hegel, Bergson, Heidegger, Sartre en synthèse originale ; sources : Philomag, la-philosophie.com).
- [x] Vérifié en direct : boot v271, prompts Dieu/Enfer relus via enter/exit, Néant confirmé par déchiffrement du fichier livré. Aucun texte copié des articles.

## Modes Dieu / Enfer / Néant adaptés à l'âge (v273)
- [x] `src/chaos.js` (Néant) : nouvelle règle d'âge (enfant ou âge inconnu = entité adoucie, jamais de mensonge du secret — l'enfant sait qu'un adulte qui l'aime peut tout entendre et que sortir est facile ; adultes confirmés = entité complète) + phrase d'accueil enfant en 5 langues (`childOpening`).
- [x] `src/deites.js` : Dieu = père doux, réponses courtes, jamais de colère/punition/enfer pour un petit ; Enfer = petit enfant → pas de spectacle + proposition de sortir, ado → fable sombre, âge inconnu → fable la plus douce.
- [x] Vérifié en direct : boot v273, accueil enfant du Néant affiché (FR, âge inconnu), blocs Dieu/Enfer relus via enter/exit. Rechiffré + hash `build.json` à jour.
- [x] Miroir GitHub remis en ordre (29/29 aux bons chemins, parasite `src/bridge` supprimé) : codes de secours retirés (`index.html` : script fallback + favicons vers `src/brand/`), `src/brand.js` (DEFAULT_SRC vers le miroir, rechiffré), hash `chess.js` réaligné sur le fichier (identique au miroir). Vérifié : 50 fichiers 0 altéré, 8 images miroir OK, 0 uploads.dev.

## Échecs : 150 parties de maîtres embarquées (v272)
- [x] ChessArchive.net testé OK : zips PGN libres (Carlsen 3563 parties, Kasparov 2163). ChessTempo = appli JS sans téléchargement ; ChessCorpus = appli JS, données CC BY-SA mais sans accès en masse.
- [x] Nouveau `src/chess-games.js` : 150 parties décisives (80 Kasparov + 70 Carlsen, classique, 40–140 plis, ECO équilibré 30×A/B/C/D/E). Coups = faits de parties, pas de texte copié.
- [x] `src/chess.js` : bouton « Maîtres » + liste filtrable (joueur/ouverture/année) branchée sur le visualiseur PGN existant ; commande `/masters [recherche]` ; labels EN. `src/i18n.js` : labels DE/ES/FR/IT.
- [x] Vérifié en direct : boot v272, 150/150 parties rejouées par le moteur de règles (0 échec), recherche « karpov » OK, bouton traduit.
- Fichiers GitHub à pousser : voir `scratch/github/LISEZMOI.md` (en attente).

## Voix Chrome coupée (v269)

## Option B (rechiffrement, en attente du propriétaire)
- [x] Testé à blanc le 29/09 avec une clé jetable : panneau `#pack` → B → « Terminé en 3822 ms · 63 modules », 63/63 enregistrements `SOFIA-ENC1gz`, aucune fuite de la clé dans le JSON. Seul « ignoré » : `src/src/chess-test.js` (fantôme : un `import` dans un commentaire de chess-test.js, le vrai module est bien inclus). Trace jetable effacée (IDB + reload).
- Marche à suivre (2 min, dans TON navigateur, la clé ne voyage jamais) : 1) ouvrir `…#pack`, 2) taper 2× la nouvelle clé + « B. Changer le verrou ET rechiffrer », « Oui, exécuter », 3) copier les lignes de verrou dans index.html, 4) « Télécharger les modules rechiffrés (JSON) » et me donner le JSON + les lignes → j'applique, je vérifie (boot + 0 altéré), tu recharges avec la NOUVELLE clé puis Save.

## Tempo 60 min (v268)
- [x] `src/weblearn.js` déchiffré (clé d'essai), `DEFAULTS.everyMin` 30 → 60, rechiffré, hash `build.json` à jour ; boot v268, `verify()` 50 fichiers 0 altéré.
- [x] `index.html` : sélecteur sur 60 par défaut, aides FR/EN à jour. Porte d'entrée (30 min de connexion) inchangée.
- [x] Mur des sujets : 15 messages (5 langues) précisent « public, visible par tous, jamais d'infos personnelles ».

## Réparé (v267) — recherche web pour le texte des images- [x] `imageSearchQuery` manquait dans index.html : `researchImageText` levait `TypeError` à chaque fois, seule la dérivation interne tournait. Fonction ajoutée (requête formulée par le modèle + repli cité).
- [x] Vérifié : « Haut-Médoc » → 6 résultats Google → lignes HAUT-MÉDOC | APPELLATION CONTRÔLÉE | 75 CL [French] ; « chianti » → dérivation CHIANTI CLASSICO | DOCG | 75 CL [Italian].
- Limite honnête : le modèle de dessin ajoute parfois des lettres parasites en petit ; la boucle (5 essais, vision) garde le meilleur.

## Restaurés depuis le chiffré (originaux, plus mes réécritures)
- [x] Tous les `src/*.js` : memstruct, selfscript, weblearn, consult, selfupdate, research, selfcode, atelier, workshop, notice, think-filter, stt, dictionary, promptbook, promptbook-seed (100000 entrées), photo, webvision, medias, videos, chaos, deites, mentor, professions (988 métiers), brand, applang, i18n-auto, mailbox, feedback, errorreport, help, vision, voice, websearch, devicescan, parental + rpg, vocal, providers, modes, inner, guard, memory, languages, languages-world, language-detector, interpreter, python, chess (+12 sous-modules), continue, enc-tool.
- [x] `src/professions-data.js` d'origine (516 Ko, 988 métiers).
- [x] `src/selfcode-baked.json`, `src/selfscript-baked.json`, `src/build.json`, `src/corpus-index.json`, `src/brand/*`, `src/bridge/*`, `src/mail/*`, `src/docs/*.mjs`, `src/droit/build-codes.mjs`, `src/WORLDWIDE.md`, `src/SCENE-PROTOCOL.md`.
- [x] Clé d'accès du propriétaire notée le 29/09 (hex 16 octets) — les modules étaient en fait chiffrés avec la clé d'essai `ENC_TRIAL_KEY`, elle a suffi.
