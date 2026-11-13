// Registre dispositif -> fonctions — version SFW stricte (2026-11-07).
// Tout contenu sexuel/BDSM supprimé à la demande : plus d'organes intimes,
// plus de fonctions sexuelles, plus de dispositifs intimes/de contention,
// plus de trajets électriques pelviens. Fonctions neutres conservées
// (vue, ouïe, parole, gestes du quotidien) pour le jeu non sexuel.
// SFW-only : Sofia reste habillée, aucune scène sexuelle.
export const REG = {
ORGANS: ["yeux","paupieres","oreilles","nez","langue","bouche","machoire","gorge","peau","mains","doigts","pouces","ongles","poignets","coudes","bras","epaules","thorax","cou","tete","hanches","jambes","cuisses","genoux","chevilles","pieds","orteils"],
MODES: ["block","occlude","cover","hold","force_open","force_closed","force_extend","stim"],
FUNCS: {
// --- sensoriel
voir: { o:["yeux"], m:["cover","force_closed"], obj:"ta vue", ask:/(regarde|ouvre les yeux|mate|admire|vois)\b[^.]{0,40}(moi|mon|mes|m')|ouvre les yeux/, can:/tu peux (voir|regarder|ouvrir les yeux)/, en:"see", ns:1 },
cligner: { o:["paupieres"], m:["force_open"], obj:"ton clignement", tail:"pour te rendre le clignement", ask:/(ferme les yeux|cligne des yeux|cligne les yeux|cligne)/, can:null, en:"blink", ns:2 },
entendre: { o:["oreilles"], m:["block","cover"], obj:"ton ouie", ask:/(tu m'entends|m'entends-tu|ecoute-moi|ecoute moi|ecoute bien|tends l'oreille)/, can:/tu peux (ecouter|entendre)/, en:"hear", ns:1 },
sentir: { o:["nez"], m:["block","occlude"], obj:"ton odorat", ask:/(sens-moi|sens mon|respire-moi|hume|renifle)/, can:/tu peux (sentir|respirer|renifler)/, en:"smell", ns:1 },
gouter: { o:["langue","bouche"], m:["block","hold"], obj:"ton gout", ask:/(goute|goute-moi|dis-moi quel gout|quel gout a)/, can:/tu peux (gouter)/, en:"taste", ns:1 },
toucher: { o:["peau","mains","poignets"], m:["cover","hold"], obj:"ton toucher", ask:/(touche|caresse|passe).{0,40}(moi|mon|mes|ma\b|m')|utilise tes (mains|doigts)|avec tes (mains|doigts)|de tes (mains|doigts)/, can:/tu peux (toucher|prendre|utiliser tes mains)/, en:"touch", ns:1 },
equilibre: { o:["oreilles","yeux"], m:["block","cover"], obj:"ton equilibre", tail:"pour te rendre l'equilibre", ask:/(tiens-toi droit|marche droit|ne tombe pas|garde l'equilibre)/, can:null, en:"keep your balance", ns:1 },
// --- bouche / gorge
parler: { o:["bouche"], m:["block"], obj:"ta parole", ask:/(tu\b|tes\b|ton\b|ta\b|toi\b|t'|dis-moi|reponds-moi|est-ce que|couleur de tes yeux)/, can:/tu peux (parler|repondre)/, en:"speak", ns:1, q:true },
ouvrir_bouche: { o:["machoire"], m:["force_closed","block"], obj:"ta machoire", ask:/(ouvre (la|ta) bouche|ouvre bien grand|ecarte les machoires)/, can:/tu peux (ouvrir)/, en:"open your mouth", ns:1 },
mordre: { o:["bouche","machoire"], m:["block"], obj:"ta morsure", ask:/(mords|mords-moi|mord moi)/, can:null, en:"bite", ns:1 },
avaler: { o:["gorge"], m:["block","occlude"], obj:"ta deglutition", ask:/(avale|deglutis)/, can:null, en:"swallow", ns:1 },
boire: { o:["bouche"], m:["block"], obj:"ta soif", ask:/(bois|desaltere-toi|hydrate-toi)/, can:/tu peux (boire)/, en:"drink", ns:1 },
lecher: { o:["langue"], m:["block","hold"], obj:"ta langue", ask:/(leche|leche-moi)/, can:null, en:"lick", ns:1 },
cracher: { o:["bouche"], m:["block"], obj:"ta salive", ask:/(crache|crache-moi)/, can:null, en:"spit", ns:1 },
// --- respiration
respirer_nez: { o:["nez"], m:["block"], obj:"ton souffle nasal", ask:/(respire par le nez|renifle|souffle par le nez|souffle du nez)/, can:/tu peux (respirer|renifler)/, en:"breathe through your nose", ns:1 },
respirer_bouche: { o:["bouche"], m:["block","occlude"], obj:"ton souffle", ask:/(respire par la bouche|souffle par la bouche)/, can:null, en:"breathe through your mouth", ns:1 },
respirer_profond: { o:["thorax"], m:["hold"], obj:"ta respiration profonde", ask:/(respire profondement|prends une grande respiration|souffle un bon coup)/, can:null, en:"breathe deeply", ns:1 },
// --- tete / cou
tourner_tete: { o:["cou","tete"], m:["hold"], obj:"ton cou", ask:/(tourne la tete|hoche la tete|regarde autour de toi)/, can:/tu peux (bouger la tete|regarder)/, en:"move your head", ns:1 },
// --- membres superieurs
lever_bras: { o:["bras","epaules"], m:["hold"], obj:"tes bras", ask:/(leve les bras|bras en l'air|mains en l'air)/, can:null, en:"raise your arms", ns:2 },
plier_coude: { o:["coudes"], m:["hold"], obj:"tes coudes", ask:/(plie les bras|mains sur la tete)/, can:null, en:"bend your elbows", ns:2 },
saisir: { o:["mains","doigts","poignets"], m:["hold","cover"], obj:"ta prehension", ask:/(prends?|attrape|serre|enlace|tiens).{0,40}(moi|mon|mes|ma\b|m')/, can:/tu peux (prendre|attraper|toucher)/, en:"grasp", ns:2 },
pincer: { o:["doigts"], m:["hold","cover"], obj:"tes doigts", ask:/(pince|pince-moi)/, can:null, en:"pinch", ns:2 },
opposer_pouce: { o:["pouces"], m:["hold"], obj:"tes pouces", ask:/(avec tes pouces|tes pouces|du pouce)/, can:null, en:"use your thumbs", ns:2 },
gratter: { o:["ongles","doigts"], m:["cover","hold"], obj:"tes ongles", ask:/(gratte|gratte-moi)/, can:null, en:"scratch", ns:2 },
bouger_poignet: { o:["poignets","mains"], m:["hold"], obj:"tes poignets", ask:/(tourne les poignets|bouge les poignets)/, can:null, en:"move your wrists", ns:2 },
// --- membres inferieurs
marcher: { o:["jambes","pieds","chevilles"], m:["hold"], obj:"ta marche", ask:/\b(viens|approche|avance|recule|marche|suis-moi)\b/, can:/tu peux (marcher|venir|te lever|bouger)/, en:"walk", ns:1 },
se_lever: { o:["jambes","pieds"], m:["hold"], obj:"ta station debout", ask:/(leve-toi|mets-toi debout|releve-toi|\bdebout\b)/, can:/tu peux (te lever|bouger)/, en:"stand up", ns:1 },
ecarter_jambes: { o:["jambes","hanches"], m:["force_extend","hold"], obj:"tes jambes", ask:/(ecarte (les jambes|les cuisses)|ouvre les cuisses)/, can:null, en:"spread your legs", ns:2 },
serrer_jambes: { o:["cuisses","jambes"], m:["force_extend"], obj:"tes cuisses", ask:/(serre les jambes|referme|ferme les (cuisses|jambes))/, can:null, en:"close your legs", ns:2 },
s_agenouiller: { o:["genoux"], m:["hold"], obj:"tes genoux", ask:/(agenouille|a genoux|mets-toi a genoux)/, can:/tu peux (t'agenouiller)/, en:"kneel", ns:2 },
bouger_orteils: { o:["orteils"], m:["hold"], obj:"tes orteils", ask:/(remue les orteils|bouge les orteils)/, can:null, en:"wiggle your toes", ns:2 }
// SFW-only : fonctions sexuelles/excrémentielles supprimées (érection,
// émission, orgasme, pénétration, lactation, tétons, dispositifs intimes…).
},
DEVICES: {
// SFW-only : dispositifs intimes/de contention supprimés.
// Restent les neutres sensoriels (vue/ouïe/mains).
bandeau: { label:"bandeau", art:"le", t:["yeux","paupieres"], m:["cover","force_closed"], site:"tes yeux", prep:"sur", lock:false, duree:1, kw:["bandeau","blindfold","yeux bandes"] },
bouchons: { label:"bouchons d'oreille", art:"les", t:["oreilles"], m:["block"], site:"tes oreilles", prep:"dans", lock:false, duree:1, kw:["bouchons","earplugs","oreilles bouchees"] },
casque: { label:"casque antibruit", art:"le", t:["oreilles"], m:["block"], site:"tes oreilles", prep:"sur", lock:false, duree:1, kw:["casque antibruit"] },
gants: { label:"gants", art:"les", t:["mains","doigts","peau","ongles"], m:["cover"], site:"tes mains", prep:"sur", lock:false, duree:1, kw:["gants","gloves"], free:["mains"] }
},
// SFW-only : trajets électriques intimes supprimés.
TRAJETS: {
},
ESTM: { SEUIL_POL_INV:1, DECAY:8, RUIN:80, DENIAL:55, GAIN_N:0.3, PLAFOND:5 }
};
