# Attributions - dossier src/metiers/

Ce dossier alimente Sofia sur les metiers et l'orientation. Il reprend quatre sources publiques.

## 1. ONISEP - Le dico des metiers (edition 2019)
- URL : https://ifra.leolagrange-formation.fr/pluginfile.php/138626/mod_resource/content/2/ONISEP%20-%20Dico%20des%20m%C3%A9tiers%202019.pdf
- Editeur : ONISEP (Office national d'information sur les enseignements et les professions), novembre 2017.
- Droit : contenu proprietaire, (c) ONISEP. Reproduction interdite sans accord.
- Usage ici : seules des donnees factuelles sont reprises dans `onisep-metiers-index.json` (nom du metier, niveau d'etudes minimal, secteur professionnel GFE, centres d'interet associes) ; `orientation-france.json` est un resume redige, avec la source citee, sans reproduction du texte.

## 2. ONISEP - Le dico des metiers, Guide parents
- URL : https://www.onisep.fr/content/download/2523060/file/dico-des-metiers_guide%20parents.pdf
- Meme editeur et meme droit. Resume redige dans `orientation-france.json` (comment accompagner un jeune, stage de 3e, CIO, JPO, salons).

## 3. Dictionnaire interministeriel des competences des metiers de l'Etat (DICo), 2e edition 2017
- URL : https://www.fonction-publique.gouv.fr/files/files/Devenir%20agent%20public/Dictionnaire_interministeriel_des_competences_des_metiers-de-lEtat.pdf
- Editeur : ministere de l'Action et des Comptes publics.
- Droit : document public diffuse par l'administration francaise.
- Usage ici : les listes de libelles (127 savoir-faire, 24 savoir-etre, 36 domaines de connaissance), la grille des niveaux (Notions, Application, Maitrise, Expertise) et quelques definitions sont reprises dans `competences-etat.json` ; le reste est redige.

## 4. Studyrama - annuaire des fiches metiers
- URL : https://www.studyrama.com/formations/fiches-metiers
- Droit : contenu proprietaire de Studyrama ; robots.txt interdit /search/, /admin/, /user/, mais autorise /formations/fiches-metiers/.
- Usage ici : `studyrama-index.json` ne contient que les adresses publiques (issues de sitemap.xml). Sofia lit la fiche a la demande et en resume les rubriques, en citant Studyrama.

## Regle de fond
Sofia s'informe, elle ne decide pas a la place du jeune et ne promet ni salaire ni debouché. Pour un conseil d'orientation, elle renvoie au CIO et a son psychologue de l'Education nationale, a onisep.fr et, pour l'apres-bac, a Parcoursup.
