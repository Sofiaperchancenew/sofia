# Coach echecs enfants (Valeria pour Sofia)

Couche pedagogique portable pour apprendre les echecs aux enfants dans l'app Sofia.

## Fichiers

- `sofia-chess-coach.json` : tout le coaching (prompts statiques, tranches d'age, echelle debutant, tactiques, methode puzzles, drop-in JS).
- `LICENSE` : MIT.

## Integration (resume)

1. Coller `coach_addon` dans le prompt systeme echecs, avant le bloc position/FEN.
2. Ajouter `mentor_addon` (une phrase d'enseignement apres chaque coup).
3. A chaque coup : detecter la tranche d'age et ajouter `sofiaChessCoachBlock(bande)`.
4. Mode demo : `watch_addon_demo_both_sides` (Sofia joue les deux camps).
5. Ne jamais affaiblir le jeu pour faire plaisir : enseigner a la place (expliquer, indice, reprises illimitees en mode coach).
6. Tokens/cache : par coup, seulement intro de bande + bloc commun (~4 ko) ; statique avant FEN, FEN/etat en dernier.

## Format des explications

IDEE (une phrase : ce que le coup fait vraiment) > PROJECTION (une mini-suite : « Si ... alors tu peux ... ») > QUESTION (une question avant de jouer). 2-3 phrases courtes max, jamais de chiffres moteur.

## Sources

Idees seulement, aucun document redistribue : ChessKid, GoStudent, kit BNP/Cigales, syllabus FEFB, kit Chess.com, apprendre-les-echecs.com, livres Creachess, Eduscol Class'Echecs.
