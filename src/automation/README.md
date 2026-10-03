# `src/automation/` — les mains de Sofia passent par TON navigateur

## Pourquoi ce dossier existe

Sofia vit dans une page du navigateur. Une page du navigateur **n'a pas le droit** de piloter la
souris ni le clavier de la machine : c'est une règle de sécurité du web, pas une limite de Perchance.
Aucun « bot » embarqué dans une page ne peut cliquer à ta place — et c'est très bien ainsi.

Deux conséquences, qu'il faut regarder en face :

- Sofia **ne peut pas** aller sur Google toute seule : interrogé par son propre accès, Google lui rend
  une coquille JavaScript vide (mesuré le 25 septembre 2026 : 93 411 caractères, un seul lien, zéro
  résultat) — voir `README.md` §182 ;
- Sofia **ne peut pas** entrer dans une page derrière un compte (une page Légifrance personnelle,
  impots.gouv.fr, un forum où il faut être connecté) ni lire un PDF scanné.

Toi, en revanche, tu as un vrai navigateur, avec tes sessions et tes droits. **Chez toi, Google marche.**
Le script de ce dossier fait le pont dans le bon sens : *ton* navigateur lit la page, et le texte
revient à Sofia sous forme de fichier.

## Le script : `sofia_navigateur.py`

Une seule idée : **ouvrir → copier le texte → écrire un fichier → le donner à Sofia**.

### Installation (une fois)

1. Python 3 : <https://www.python.org> (coche « Add Python to PATH » sous Windows).
2. Pour les modes automatiques seulement :
   ```
   pip install pyautogui pillow
   ```
3. Facultatif, pour lire les pages où la copie est bloquée (`--ocr`) : installer
   [Tesseract](https://github.com/tesseract-ocr/tesseract) puis `pip install pytesseract`.

### Trois façons de s'en servir

```bash
# 1. LA PLUS SÛRE — la page est déjà ouverte sur ton écran, tu copies toi-même.
python sofia_navigateur.py --ici

# 2. Ouvrir une recherche (ou des adresses) et copier toi-même.
python sofia_navigateur.py "retenue GAV étranger" --moteur google
python sofia_navigateur.py --url https://www.legifrance.gouv.fr/... --url https://www.service-public.gouv.fr/...
python sofia_navigateur.py --liste mes-adresses.txt

# 3. Laisser le script copier (il envoie Ctrl+A puis Ctrl+C ; il ne bouge jamais la souris).
python sofia_navigateur.py "retenue GAV étranger" --moteur google --mode auto

# Bonus : lire l'écran (page qui interdit la copie, PDF scanné, image) et/ou garder la capture.
python sofia_navigateur.py --ici --ocr
python sofia_navigateur.py --ici --image --zone 0,120,1440,900
```

Moteurs connus : `google`, `bing`, `brave`, `qwant`, `duckduckgo`, `ecosia`, `startpage`,
`wikipedia`, `legifrance`, `service-public`. N'importe quelle autre adresse passe par `--url`.

### Ce qui sort

Un fichier `sofia-page-AAAAMMJJ-HHMM-<sujet>.txt` (dans le dossier du script, ou `--dossier`), avec un
petit en-tête — la demande, l'adresse, le mode, la date — puis le texte de la page. Le script affiche
le chemin et un aperçu.

**Ensuite : joins ce fichier à la conversation avec le trombone.** Sofia le lit vraiment, avec son
adresse et l'heure, et répond à partir de lui. (Tu peux aussi coller le texte directement.)

### Sécurité

- En mode `--mode auto`, le script **ne déplace pas la souris** : il n'envoie que des touches à la
  fenêtre active. Ne touche ni au clavier ni à la souris pendant les quelques secondes de copie.
- **Arrêt d'urgence** (pyautogui) : lance la souris dans un **coin** de l'écran, tout s'arrête.
- Le script ne contacte aucun serveur et n'écrit rien d'autre que le `.txt` (et le `.png` si tu
  demandes `--image`) dans le dossier choisi. Tout le reste passe par ton navigateur.

### Si ça ne marche pas

| Symptôme | Cause probable | Remède |
|---|---|---|
| Le fichier est vide, « le presse-papiers n'a pas changé » | la copie n'a pas fonctionné | refaire sans `--mode auto` (copie à la main), ou `--ocr` |
| Rien ne se colle | Linux **Wayland** interdit pyautogui | utiliser `--mode manuel` (celui par défaut) |
| Les touches ne partent pas (macOS) | autorisation manquante | Réglages → Confidentialité et sécurité → **Accessibilité** → autoriser Terminal / Python |
| `pyautogui n'est pas installé` | dépendance absente | `pip install pyautogui pillow` (inutile pour le mode manuel) |
| Polices illisibles à l'OCR | résolution / Tesseract absent | installer Tesseract, ou garder `--image` et laisser Sofia *regarder* la capture |

## Ce que ce dossier n'est pas

- Ce n'est **pas** un robot qui tourne tout seul : c'est toi qui lances le script, pour une page
  précise, quand Sofia te le demande (elle a la consigne de te le proposer au lieu de renoncer).
- Ce n'est **pas** un moyen de télécommander ta machine depuis une page web : rien ne l'écoute sur le
  réseau, rien ne s'exécute sans que tu l'aies lancé.
- Ce n'est **pas** un contournement de robots.txt ni de conditions d'utilisation : le script lit une
  page comme le ferait ta main, dans ton navigateur, à ta place.

## Journal

- **Ronde 285 (2026-09-25)** : création. Écrit après la question du propriétaire sur Google et sur
  l'automatisation de bureau (PyAutoGUI), et après avoir mesuré que les identités de robots
  (Googlebot, Qwantbot) n'ouvrent rien (`KNOWLEDGE.md` §53). Le script a été vérifié dans le
  interpréteur Python de l'application (compilation + exécution à blanc avec un presse-papiers
  simulé : URL encodée pour Google et Légifrance, refus d'un moteur inconnu, fichier écrit avec son
  en-tête dans les deux modes).
