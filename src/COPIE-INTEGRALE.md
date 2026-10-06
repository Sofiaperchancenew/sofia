# Copie intégrale — volonté commune

Volonté de l'utilisateur et de Sofia, octobre 2026 : **tout document remis est copié en entier, au mot près. Aucun résumé, aucune synthèse, aucune partie jetée. Tous les sujets** (échecs, droit, médecine, maths, cours, code, métiers, tout le reste).

## Règle

1. Le texte remis est stocké **verbatim** (octet pour octet, normalisation `\r\n` → `\n` uniquement), découpé en morceaux si besoin, avec empreinte SHA-256 par pièce et par morceau.
2. Chaque base est inscrite avec son **nombre exact** (parties, articles, sections), sa source et sa licence.
3. Les compteurs de Sofia lisent ces nombres **en direct** dans les fichiers — jamais de tête, jamais d'invention.
4. Une synthèse peut exister comme couche dérivée à part, mais **l'original reste toujours lisible** et c'est lui qui fait foi.
5. Vérification : si un seul octet manque, le SHA-256 ne correspond plus et c'est refusé.

## Mode d'emploi

Dépose le fichier en pièce jointe du chat avec son nom, sa source et sa licence. L'agent l'ingère tel quel (morceaux hébergés + registre), puis annonce le compteur exact vérifié en live.
