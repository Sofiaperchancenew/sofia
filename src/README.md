# Modèles 3D des échecs (fournis par l'utilisateur, 30.09.2026)

STL binaires, utilisés par `src/chess-3d.js` (rendu 3D + export STL).
Doubles permanents en ligne — si un fichier `src/` venait à manquer,
le re-télécharger depuis son URL avec `fetch_url` vers `scratch/`,
puis le recopier dans ce dossier.

| Pièce | Fichier local | Taille | URL permanente |
|---|---|---|---|
| Fou | `bishop.stl` | 2819384 | https://user.uploads.dev/file/2b522397b29b8e8c601d0334c237339f.bin |
| Roi (corps) | `king-body.stl` | 2623984 | https://user.uploads.dev/file/5421e5337979018b8f3b21ec34dbb62e.bin |
| Roi (croix) | `king-cross.stl` | 35884 | https://user.uploads.dev/file/871ea3db1a7f8b65ebd3ce0cc2485d64.bin |
| Cavalier | `knight.stl` | 4104884 | https://user.uploads.dev/file/affa4fe2ee54ce486f07428477f06e11.bin |
| Pion | `pawn.stl` | 2706784 | https://user.uploads.dev/file/ad7336e61450d25516f1ca53119871db.bin |
| Dame | `queen.stl` | 2556384 | https://user.uploads.dev/file/1da0a4d7db0aa57062a31e990fb1a878.bin |
| Tour | `rook.stl` | 2479984 | https://user.uploads.dev/file/119f0cab6d5de910da61cd406d52c68a.bin |

Le roi = `king-body.stl` + `king-cross.stl` fusionnés. Les six pièces
extrudées Cburnett restent en repli si un STL ne charge pas.
