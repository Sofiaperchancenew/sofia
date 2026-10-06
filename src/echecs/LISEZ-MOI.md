# Bases d'échecs — copie intégrale

Règle : quand tu donnes une base de données d'échecs, elle est copiée **en entier, au mot près**. Aucun résumé, aucune synthèse, aucune partie jetée.

## Comment donner ta base

1. Dépose ton fichier `.pgn` en pièce jointe du chat (ou dis où il est : `scratch/message-attachments/...`).
2. Donne son nom, sa source et sa licence (ex : « base Lichess 2024, CC0 »).
3. L'agent découpe le fichier en morceaux `morceau-*.json.gz` (500 parties max, ~4 Mo), chaque partie gardée avec son texte PGN complet + ses en-têtes, avec une empreinte SHA-256 par partie et par morceau.
4. Chaque morceau est hébergé (uploads.dev, miroir GitHub), inscrit dans `src/echecs/remote.json`, et la base est inscrite dans `src/echecs/manifest.json` avec son nombre exact de parties.
5. Vérification : le compteur `App.ChessDB` doit afficher exactement le nombre de parties de ton fichier. Si un seul octet manque, ça se voit (SHA-256) et c'est refusé.

Limites : 100 Mo par fichier, ~2 Go au total. Au-delà, on découpe en plusieurs bases nommées (ex : `lichess-2024-a`, `lichess-2024-b`).

Déjà ingérées (octobre 2026, texte intégral vérifié SHA-256) : table ECO française (ton PDF, 53 p. : 2365 lignes, 500 codes A00–E99, morceaux `src/echecs/eco-codes/` + PDF verbatim) ; Kasparov 2128, Fischer 827, Carlsen 7818, Capablanca 597, Nakamura 10220, Morphy 211, Tal 2431, Caruana 6499, Botvinnik 891, Judit Polgar 1825, Alekhine 1661 — plus le socle de 150 annotées — plus TWIC 920 à 1664 au complet (745 numéros, 3 595 925 parties ; total 3 631 183). Les numéros 1 à 919 n'ont aucun fichier sur le site (ni en direct, ni via les anciens chemins, ni via la Wayback) : série complète pour tout ce qui est téléchargeable. Suite éventuelle : reprendre `src/echecs/twic-runner.js` (bornes FROM/TO en tête), numeros suivis dans `manifest.json`.

## Sources évaluées (octobre 2026)

- chess.ceo : station d'analyse gratuite (Stockfish, opening explorer, DB, PGN, fiches /player en React) — appli web uniquement, aucun téléchargement en bloc, page /player vide sans JS.
- ajedrezdata.com OTB : vraies bases PGN gratuites (AJ-OTB-000 = 4 471 785 parties jusqu'en avril 2023, AJ-OTB-001 = 868 015 parties jusqu'en août 2024) mais liens via raccourcisseur l--l.top injoignable d'ici + plusieurs Go — non ingérable dans ces quotas.
- chesstempo.com : 5M+ parties mais appli web uniquement, aucun téléchargement en bloc.
- chessgames.com : aucun téléchargement en bloc (consultation page par page uniquement).
- database.chessbase.com : 8M parties derrière comptes/offre payante, aucun dump public (page = coquille React vide sans JS) ; shop.chessbase.com/en/openings/tree = boutique, produit/arborescence payante à acheter, pas un PGN libre.
- chessify (9M) : accès en ligne sur compte + abonnement, aucun téléchargement.
- Elite Chess Database (app iOS) : application seule, aucune donnée exportable.
