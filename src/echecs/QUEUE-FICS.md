# File d'attente FICS (quota upload journalier atteint)

Politique : GitHub d'abord (miroir jsDelivr en priorite, repli local, uploads.dev en dernier). Tout morceau reheberge est pousse vers Sofiaperchancenew/sofia au chemin de son `logical`.

## A refaire en premier (33 numeros, 1 020 011 parties non hebergees — quota coupe pendant l'upload)

2000-std2000, 2000-titled, 2001-std2000, 2002-std2000, 2003-std2000, 2004-std2000, 2004-titled (partiel), 2005-std2000, 2005-titled (partiel), 2006-std2000, 2006-titled, 2007-std2000, 2007-titled, 2008-titled, 2009-std2000, 2009-titled, 2010-titled, 2011-titled, 2012-titled, 2013-titled, 2014-titled, 2015-titled, 2016-titled, 2017-titled, 2018-titled, 2019-titled (+ suite tronquee : voir manifest `fics.numeros[].pending`). Reprendre par : GET https://www.ficsgames.org/cgi-bin/download.cgi?gametype=GT&year=YYYY&month=0&movetimes=0&download=Download puis /dl/ obtenu, pipeline morceaux 2000 + upload + manifest.

- [ ] std2000 2010-2018 (bz2 pre-telecharges, quota atteint)
- [ ] gt4 2019-2026
- [ ] gt12 2000-2025
- [ ] gt13 2000-2025
- [ ] gt6 2000-2025
- [ ] gt8 2000-2025
- [ ] gt9 2009-2025
- [ ] gt2 mensuels
- [ ] pgn-chess-files IA (13 PGN)
