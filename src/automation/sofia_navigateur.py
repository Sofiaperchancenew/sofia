#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""sofia_navigateur.py — les yeux de Sofia dans TON navigateur.

POURQUOI CE SCRIPT EXISTE
  Sofia tourne dans une page du navigateur. Une page du navigateur n'a pas le droit de
  piloter ta souris ni ton clavier : c'est une regle de securite du web, pas une limite de
  Perchance. Elle ne peut donc PAS cliquer a ta place, et elle ne peut pas non plus lire
  Google : interroge par son propre acces, Google lui rend une page vide (une coquille
  JavaScript), et beaucoup de sites refusent de la laisser entrer.

  Toi, tu as un vrai navigateur, avec tes connexions et tes droits : chez toi, Google marche.
  Ce script fait le pont dans le bon sens :
      il OUVRE la page dans TON navigateur,
      il COPIE le texte de la page (Ctrl+A puis Ctrl+C — ou toi, a la main),
      il ECRIT ce texte dans un fichier que tu donnes a Sofia.
  Sofia lit alors la vraie page, sans jamais pretendre a ce qu'elle n'a pas vu.

USAGE (trois facons, de la plus sure a la plus automatique)
  1. Lire la page que tu as DEJA ouverte (rien n'est ouvert ni clique) :
         python sofia_navigateur.py --ici
  2. Ouvrir une page ou lancer une recherche, puis te laisser copier toi-meme :
         python sofia_navigateur.py "retenue GAV etranger" --moteur google
         python sofia_navigateur.py --url https://www.legifrance.gouv.fr/... --url https://...
  3. Laisser le script copier lui-meme (il envoie Ctrl+A / Ctrl+C pour toi) :
         python sofia_navigateur.py "retenue GAV etranger" --moteur google --mode auto

  Aide complete :  python sofia_navigateur.py --aide

SECURITE
  * En mode auto, le script NE BOUGE PAS la souris : il n'envoie que des touches au fenetre
    active. Ne touche ni au clavier ni a la souris pendant les quelques secondes de copie.
  * Sortie de secours (pyautogui) : lance la souris dans un COIN de l'ecran, tout s'arrete.
  * Le script n'ecrit rien d'autre qu'un fichier .txt dans le dossier que tu indiques, et il
    ne se connecte a aucun serveur : tout passe par ton navigateur.

INSTALLATION
  Obligatoire : Python 3 (https://www.python.org) — le module pyautogui seulement pour les
  modes --mode auto, --ocr et --image  :   pip install pyautogui pillow
  (--ocr demande en plus Tesseract : https://github.com/tesseract-ocr/tesseract )
"""

import argparse
import datetime as _dt
import os
import re
import subprocess
import sys
import time
import unicodedata
import webbrowser
from pathlib import Path

VERSION = "1.0"
COPIE = "command" if sys.platform == "darwin" else "ctrl"      # macOS : Cmd, ailleurs : Ctrl
try:
    ICI = Path(__file__).resolve().parent                  # dossier de ce script
except NameError:                                          # importe ou execute a la volee
    ICI = Path.cwd()

# ---------------------------------------------------------------- moteurs de recherche ---
MOTEURS = {
    "google":      "https://www.google.com/search?hl=fr&num=20&q={q}",
    "bing":        "https://www.bing.com/search?setlang=fr&q={q}",
    "brave":       "https://search.brave.com/search?q={q}",
    "qwant":       "https://www.qwant.com/?t=web&q={q}",
    "duckduckgo":  "https://duckduckgo.com/?kl=fr-fr&q={q}",
    "ecosia":      "https://www.ecosia.org/search?q={q}",
    "startpage":   "https://www.startpage.com/sp/search?query={q}",
    "wikipedia":   "https://fr.wikipedia.org/w/index.php?search={q}",
    "legifrance":  "https://www.legifrance.gouv.fr/recherche/resultats?query={q}",
    "service-public": "https://www.service-public.gouv.fr/particuliers/recherche?keyword={q}",
}

# ---------------------------------------------------------------- navigateur ------------
NAVIGATEURS = {
    "chrome":   {"darwin": ["Google Chrome"],   "win32": ["chrome"],   "autre": ["google-chrome", "chrome"]},
    "chromium": {"darwin": ["Chromium"],        "win32": ["chromium"], "autre": ["chromium", "chromium-browser"]},
    "brave":    {"darwin": ["Brave Browser"],   "win32": ["brave"],    "autre": ["brave-browser", "brave"]},
    "edge":     {"darwin": ["Microsoft Edge"],  "win32": ["msedge"],   "autre": ["microsoft-edge"]},
    "firefox":  {"darwin": ["Firefox"],         "win32": ["firefox"],  "autre": ["firefox"]},
    "safari":   {"darwin": ["Safari"],          "win32": [],           "autre": []},
}


def _p(texte=""):
    """Affiche une ligne (et force l'affichage immediat)."""
    print(texte, flush=True)


def _slug(texte, maximum=48):
    t = unicodedata.normalize("NFKD", str(texte or "")).encode("ascii", "ignore").decode("ascii")
    t = re.sub(r"[^A-Za-z0-9]+", "-", t).strip("-").lower()
    return (t[:maximum].rstrip("-") or "page")


def url_depuis_moteur(moteur, requete):
    """Construit l'adresse de recherche d'un moteur connu (ou prend l'adresse telle quelle)."""
    m = str(moteur or "google").strip().lower()
    if m not in MOTEURS:
        raise SystemExit("Moteur inconnu : %s\nConnus : %s" % (moteur, ", ".join(sorted(MOTEURS))))
    from urllib.parse import quote_plus
    return MOTEURS[m].format(q=quote_plus(str(requete)))


# ---------------------------------------------------------------- presse-papiers --------
def lire_presse_papiers():
    """Lit le presse-papiers sans rien installer d'autre que Python (tkinter, sinon outils du systeme)."""
    # 1) tkinter (livre avec Python)
    try:
        import tkinter
        racine = tkinter.Tk()
        racine.withdraw()
        try:
            texte = racine.clipboard_get()
        finally:
            racine.destroy()
        if texte:
            return str(texte)
    except Exception:
        pass
    # 2) pyperclip, s'il est la
    try:
        import pyperclip
        texte = pyperclip.paste()
        if texte:
            return str(texte)
    except Exception:
        pass
    # 3) outils du systeme
    outils = {
        "darwin": ["pbpaste"],
        "win32": ["powershell", "-NoProfile", "-Command", "Get-Clipboard -Raw"],
    }.get(sys.platform, None)
    if outils is None:                                    # Linux : Wayland puis X11
        for cmd in (["wl-paste"], ["xclip", "-selection", "clipboard", "-o"], ["xsel", "--clipboard", "--output"]):
            try:
                sortie = subprocess.run(cmd, capture_output=True, timeout=10)
                if sortie.returncode == 0 and sortie.stdout:
                    return sortie.stdout.decode("utf-8", "replace")
            except Exception:
                continue
    else:
        try:
            sortie = subprocess.run(outils, capture_output=True, timeout=10)
            if sortie.returncode == 0 and sortie.stdout:
                return sortie.stdout.decode("utf-8", "replace")
        except Exception:
            pass
    return ""


# ---------------------------------------------------------------- navigateur ------------
def ouvrir(url, navigateur="defaut"):
    """Ouvre l'adresse dans le navigateur de l'utilisateur (le sien, avec ses sessions)."""
    nav = str(navigateur or "defaut").strip().lower()
    if nav in ("defaut", "default", "auto", ""):
        webbrowser.open(url)
        return "navigateur par defaut"
    if nav not in NAVIGATEURS:
        raise SystemExit("Navigateur inconnu : %s\nConnus : defaut, %s" % (navigateur, ", ".join(sorted(NAVIGATEURS))))
    entrees = NAVIGATEURS[nav]
    if sys.platform == "darwin":
        for app in entrees["darwin"]:
            if subprocess.run(["open", "-a", app, url], capture_output=True).returncode == 0:
                return app
        webbrowser.open(url)
        return "navigateur par defaut"
    for cmd in entrees["win32" if sys.platform == "win32" else "autre"]:
        try:
            subprocess.Popen([cmd, url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return cmd
        except Exception:
            continue
    webbrowser.open(url)
    return "navigateur par defaut"


# ---------------------------------------------------------------- pyautogui -------------
def charger_pyautogui():
    try:
        import pyautogui
    except Exception as e:
        raise SystemExit(
            "pyautogui n'est pas installe (necessaire pour --mode auto, --ocr, --image).\n"
            "Installe-le avec :  pip install pyautogui pillow\n"
            "Detail : %s" % e)
    pyautogui.FAILSAFE = True        # souris dans un coin de l'ecran = arret immediat
    pyautogui.PAUSE = 0.4
    return pyautogui


def compte_a_rebours(secondes, quoi):
    _p("")
    _p("  %s dans %d s — NE TOUCHE PAS au clavier ni a la souris." % (quoi, secondes))
    _p("  (Arret d'urgence : lance la souris dans un COIN de l'ecran.)")
    for s in range(secondes, 0, -1):
        print("\r  %d..." % s, end="", flush=True)
        time.sleep(1)
    print("\r  c'est parti.      ")


def copier_page(pyautogui, attente=2.0):
    """Envoie Ctrl+A puis Ctrl+C a la fenetre active. Ne bouge JAMAIS la souris."""
    time.sleep(float(attente))
    pyautogui.hotkey(COPIE, "a")
    time.sleep(0.6)
    pyautogui.hotkey(COPIE, "c")
    time.sleep(0.8)


def avertir_si_inchange(avant, texte, automatique):
    """Le presse-papiers n'a pas bouge : le dire, plutot que de faire croire a une lecture."""
    if automatique and avant and avant.strip() and avant.strip() == (texte or "").strip():
        _p("[!] Le presse-papiers n'a pas change : la copie n'a peut-etre pas fonctionne.")
        _p("    Essaie en mode manuel (sans --mode auto), ou --ocr pour lire l'ecran.")


def lire_ecran(pyautogui, zone=None, ocr=False):
    """Capture l'ecran (et le lit par OCR si pytesseract est la). Renvoie (texte, image)."""
    region = None
    if zone:
        try:
            x1, y1, x2, y2 = [int(v) for v in re.split(r"[,; ]+", zone.strip())]
            region = (min(x1, x2), min(y1, y2), abs(x2 - x1), abs(y2 - y1))
        except Exception:
            raise SystemExit("--zone attend quatre nombres : x1,y1,x2,y2 (exemple : --zone 0,0,1440,900)")
    image = pyautogui.screenshot(region=region)
    texte = ""
    if ocr:
        try:
            import pytesseract
            texte = pytesseract.image_to_string(image, lang="fra+eng")
        except Exception as e:
            _p("[!] OCR impossible (%s)." % e)
            _p("    Installe Tesseract puis :  pip install pytesseract")
    return texte, image


# ---------------------------------------------------------------- ecriture -------------
def ecrire_fichier(dossier, nom, requete, sources, mode, texte, image=None):
    dossier = Path(dossier).expanduser().resolve()
    dossier.mkdir(parents=True, exist_ok=True)
    horodate = _dt.datetime.now().strftime("%Y-%m-%d-%H%M")
    nom = nom or ("sofia-page-%s-%s" % (horodate, _slug(requete or (sources[0] if sources else "page"))))
    chemin = dossier / (nom + ".txt")
    entete = [
        "# Sofia — page lue dans TON navigateur",
        "# mode      : %s" % mode,
        "# demande   : %s" % (requete or "(aucune)"),
        "# source(s) : %s" % (", ".join(sources) if sources else "(page deja ouverte)"),
        "# date      : %s" % _dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "# ---------------------------------------------------------------",
        "",
    ]
    chemin.write_text("\n".join(entete) + (texte or "").strip() + "\n", encoding="utf-8")
    if image is not None:
        png = dossier / (nom + ".png")
        try:
            image.save(str(png))
        except Exception:
            png = None
    else:
        png = None
    return chemin, png


def main(argv=None):
    p = argparse.ArgumentParser(
        description="Fait lire une page a Sofia par TON navigateur : ouvre, copie, ecrit un fichier.",
        epilog="Exemples :  python sofia_navigateur.py --ici\n"
               "           python sofia_navigateur.py \"retenue GAV etranger\" --moteur google\n"
               "           python sofia_navigateur.py --url https://example.com --mode auto",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        add_help=False)
    p.add_argument("requete", nargs="?", default=None, help="ce qu'il faut chercher (avec --moteur)")
    p.add_argument("--moteur", default="google", help="moteur de recherche (%s)" % ", ".join(sorted(MOTEURS)))
    p.add_argument("--url", action="append", default=[], help="adresse a ouvrir (repetable)")
    p.add_argument("--liste", default=None, help="fichier texte contenant une adresse par ligne")
    p.add_argument("--ici", action="store_true", help="lire la page DEJA ouverte (n'ouvre rien)")
    p.add_argument("--mode", choices=["manuel", "auto"], default="manuel",
                   help="manuel (toi, tu copies) ou auto (le script envoie Ctrl+A / Ctrl+C)")
    p.add_argument("--attente", type=float, default=8.0,
                   help="secondes accordees a la page pour s'afficher avant la copie (defaut 8)")
    p.add_argument("--navigateur", default="defaut",
                   help="defaut, %s" % ", ".join(sorted(NAVIGATEURS)))
    p.add_argument("--ocr", action="store_true", help="lire l'ECRAN par reconnaissance de texte (pages ou la copie est bloquee)")
    p.add_argument("--image", action="store_true", help="enregistrer aussi une capture d'ecran (.png) — Sofia sait regarder les images")
    p.add_argument("--zone", default=None, help="zone de la capture, pour --ocr/--image : x1,y1,x2,y2")
    p.add_argument("--dossier", default=str(ICI),
                   help="ou ecrire le fichier (defaut : le dossier de ce script)")
    p.add_argument("--nom", default=None, help="nom du fichier, sans extension")
    p.add_argument("--rebours", type=int, default=3, help="compte a rebours avant les touches automatiques (defaut 3)")
    p.add_argument("--version", action="store_true", help="afficher la version")
    p.add_argument("-h", "--aide", "--help", action="help", help="cette aide")
    args = p.parse_args(argv)

    if args.version:
        _p("sofia_navigateur.py %s" % VERSION)
        return 0

    # ---- ce qu'il faut lire -------------------------------------------------
    sources = []
    if args.liste:
        try:
            for ligne in Path(args.liste).expanduser().read_text(encoding="utf-8").splitlines():
                ligne = ligne.strip()
                if ligne and not ligne.startswith("#"):
                    sources.append(ligne)
        except Exception as e:
            raise SystemExit("--liste illisible : %s" % e)
    sources += [u.strip() for u in args.url if u.strip()]
    if args.requete and not args.ici and not sources:
        sources = [url_depuis_moteur(args.moteur, args.requete)]
    if not sources and not args.ici:
        p.print_help()
        raise SystemExit("\nRien a lire : donne une recherche, ou --url, ou --ici.")

    automatique = args.mode == "auto" or args.ocr or args.image
    pyautogui = charger_pyautogui() if automatique else None

    # ---- le travail ---------------------------------------------------------
    blocs, images, ouverts, avant = [], [], [], ""
    if args.ici:
        avant = lire_presse_papiers()
        if automatique:
            compte_a_rebours(args.rebours, "Copie de la page ouverte (clique d'abord DANS la page, pour lui donner le focus)")
            copier_page(pyautogui, args.attente)
        else:
            _p("")
            _p("  Va sur la page voulue, puis :  Ctrl+A  (tout selectionner)  et  Ctrl+C  (copier).")
            _p("  (Sur macOS : Cmd+A puis Cmd+C.)")
            input("  Quand c'est copie, appuie sur Entree ici... ")
        texte = lire_presse_papiers()
        avertir_si_inchange(avant, texte, automatique)
        if args.ocr or args.image:
            ocr_texte, image = lire_ecran(pyautogui, args.zone, args.ocr)
            if ocr_texte and len(ocr_texte.strip()) > len(texte.strip()):
                texte = ocr_texte
            images.append(image)
        blocs.append(texte)
        ouverts.append("(page deja ouverte)")
    else:
        for i, url in enumerate(sources):
            _p("")
            _p("[%d/%d] %s" % (i + 1, len(sources), url))
            ouverts.append(ouvrir(url, args.navigateur))
            avant = lire_presse_papiers() if automatique else ""
            if automatique:
                compte_a_rebours(args.rebours, "Copie de la page (ne touche plus au clavier)")
                copier_page(pyautogui, args.attente)
            else:
                input("  Regarde la page dans ton navigateur, puis copie-la toi-meme\n"
                      "  (Ctrl+A  puis  Ctrl+C — sur macOS : Cmd+A puis Cmd+C),\n"
                      "  et appuie sur Entree ici quand c'est fait... ")
                time.sleep(0.5)
            texte = lire_presse_papiers()
            avertir_si_inchange(avant, texte, automatique)
            if args.ocr or args.image:
                ocr_texte, image = lire_ecran(pyautogui, args.zone, args.ocr)
                if ocr_texte and len(ocr_texte.strip()) > len(texte.strip()):
                    texte = ocr_texte
                images.append(image)
            blocs.append(texte)

    # ---- ce qu'on ecrit -----------------------------------------------------
    mode = ("lecture de l'ecran (OCR)" if args.ocr
            else ("copie automatique (Ctrl+A / Ctrl+C)" if args.mode == "auto" else "copie manuelle (Ctrl+A / Ctrl+C)"))
    corps = ""
    for i, bloc in enumerate(blocs):
        if len(blocs) > 1:
            corps += "\n\n===== page %d/%d : %s =====\n\n" % (i + 1, len(blocs), sources[i] if i < len(sources) else "")
        corps += (bloc or "").strip() + "\n"
    chemin, png = ecrire_fichier(args.dossier, args.nom, args.requete, sources, mode, corps,
                                 images[0] if images else None)

    _p("")
    _p("  Fichier ecrit : %s  (%d caracteres)" % (chemin, len(corps.strip())))
    if png:
        _p("  Capture       : %s" % png)
    if not corps.strip():
        _p("  [!] Le texte est vide : la copie n'a rien rapporte.")
        _p("      Essaie : --mode manuel (copie toi-meme), ou --ocr pour lire l'ecran.")
    else:
        _p("  Apercu :")
        for ligne in [l for l in corps.strip().splitlines() if l.strip()][:6]:
            _p("    " + ligne[:110])
    _p("")
    _p("  POUR SOFIA : joins ce fichier a la conversation (le trombone), ou colle son contenu.")
    _p("              Elle lira la vraie page, avec son adresse et l'heure.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
