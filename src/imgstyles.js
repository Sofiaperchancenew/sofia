import { IMG_STYLES } from "./imgstyles-data.js";
import { REG } from "./contraintes-data.js";
const EN_STOP = new Set(["style", "styles", "with", "and", "the", "for", "from", "masterpiece", "masterpieces", "experimental", "classic", "modern", "general", "character", "true", "real"]);
const FR_STOP = ["le", "la", "les", "un", "une", "des", "du", "de", "et", "est", "sont", "dans", "avec", "pour", "sur", "par", "pas", "plus", "mon", "ma", "mes", "son", "sa", "ces", "cette", "qui", "que", "quoi", "comment", "fille", "homme", "femme", "maison", "chat", "chien", "ciel", "mer", "fleur", "arbre", "montagne", "ville", "village", "portrait", "paysage", "image", "photo", "style", "faire", "fais", "donne", "voici", "tres", "foret", "nuit", "jour", "soleil", "lune", "enfant", "bebe", "oiseau", "cheval", "dragon", "chateau", "robot"];
const FR_ALIAS = [
  {fr: ["photo", "photos", "realiste", "realistes", "photorealiste"], en: ["photorealistic", "realistic picture", "professional photo", "casual photo", "documentary"]},
  {fr: ["cinema", "cinematique", "film"], en: ["cinematic", "anamorphic", "imax"]},
  {fr: ["anime", "animes"], en: ["anime"]},
  {fr: ["manga", "mangas"], en: ["manga"]},
  {fr: ["aquarelle", "aquarelles"], en: ["watercolor"]},
  {fr: ["huile"], en: ["oil painting"]},
  {fr: ["crayon", "croquis", "esquisse"], en: ["sketch", "pencil", "line art", "drawing"]},
  {fr: ["encre", "encrage", "calligraphie"], en: ["sumi", "ink"]},
  {fr: ["fusain", "charbon"], en: ["charcoal"]},
  {fr: ["pastel", "pastels"], en: ["pastel"]},
  {fr: ["pixel", "pixels"], en: ["pixel art"]},
  {fr: ["bd", "comics", "comic", "bande dessinee"], en: ["comic", "tintin", "herge"]},
  {fr: ["dessin anime", "cartoon", "disney"], en: ["cartoon", "disney"]},
  {fr: ["cyberpunk"], en: ["cyberpunk"]},
  {fr: ["steampunk"], en: ["steampunk"]},
  {fr: ["fantasy", "fantastique", "heroic fantasy"], en: ["fantasy"]},
  {fr: ["science fiction", "sf", "futuriste", "futur"], en: ["sci-fi", "scifi", "futuristic", "space"]},
  {fr: ["portrait", "portraits"], en: ["portrait"]},
  {fr: ["paysage", "paysages"], en: ["landscape"]},
  {fr: ["chibi"], en: ["chibi"]},
  {fr: ["kawaii", "mignon"], en: ["kawaii"]},
  {fr: ["gothique"], en: ["gothic", "dark academia", "dark fantasy"]},
  {fr: ["vintage", "retro"], en: ["vintage", "retro"]},
  {fr: ["pop art"], en: ["pop art"]},
  {fr: ["impressionnisme", "impressionniste"], en: ["impressionism"]},
  {fr: ["surrealiste", "surrealisme"], en: ["surreal"]},
  {fr: ["cubisme", "cubiste"], en: ["cubism"]},
  {fr: ["graffiti", "street art"], en: ["graffiti", "street art"]},
  {fr: ["3d"], en: ["3d", "unreal"]},
  {fr: ["vitrail", "vitraux"], en: ["stained glass"]},
  {fr: ["mosaique"], en: ["mosaic"]},
  {fr: ["art nouveau"], en: ["art nouveau"]},
  {fr: ["art deco", "deco"], en: ["art deco"]},
  {fr: ["baroque"], en: ["baroque"]},
  {fr: ["renaissance"], en: ["renaissance"]},
  {fr: ["medieval", "moyen age"], en: ["medieval"]},
  {fr: ["affiche", "poster"], en: ["poster"]},
  {fr: ["logo", "icone"], en: ["logo", "icon"]},
  {fr: ["origami", "papier", "quilling"], en: ["origami", "paper", "quilling"]},
  {fr: ["ukiyo", "estampe"], en: ["ukiyo", "japanese"]},
  {fr: ["egyptien", "hieroglyphe"], en: ["egyptian"]},
  {fr: ["tatouage", "tattoo"], en: ["tattoo"]},
  {fr: ["broderie"], en: ["embroidery"]},
  {fr: ["collage"], en: ["collage"]}
];
function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function wbHit(hay, kw) {
  try {
    return new RegExp("\\b" + esc(kw) + "\\b").test(hay);
  } catch (e) {
    return hay.indexOf(kw) >= 0;
  }
}
function nameKeys(name) {
  let out = [];
  for (const w of norm(name).split(" ")) {
    if (w.length >= 4 || w === "oil" || w === "ink" || w === "3d") {
      if (/^[0-9]+s?$/.test(w)) continue;
      if (!EN_STOP.has(w) && out.indexOf(w) < 0) out.push(w);
    }
  }
  return out;
}
for (const st of IMG_STYLES) {
  let keys = nameKeys(st.n);
  let fr = [];
  const nn = norm(st.n);
  for (const a of FR_ALIAS) {
    for (const kw of a.en) {
      if (wbHit(nn, kw)) {
        for (const f of a.fr) if (fr.indexOf(f) < 0) fr.push(f);
        break;
      }
    }
  }
  st.k = keys;
  st.f = fr;
}
function looksFrench(s) {
  if (/[àâäéèêëîïôöùûüçœæ]/i.test(s)) return true;
  const n = " " + norm(s) + " ";
  let hits = 0;
  for (const w of FR_STOP) {
    if (n.indexOf(" " + w + " ") >= 0) {
      hits++;
      if (hits >= 2) return true;
    }
  }
  return false;
}
const PHOTO_FRAG = "ultra photorealistic professional photograph, shot on Canon EOS R5, Canon RF 50mm f/1.2L lens, HDR, natural skin texture, true to life, sharp focus, 8k";
const PHOTO_NEG = "cartoon, manga, anime, drawing, painting, illustration, sketch, watercolor, oil painting, 3d render, cgi, digital art, stylized, comic, pixel art, flat colors, unrealistic, deformed";
// Correctif anti-artefacts : le modele ne comprend pas la negation dans le prompt
// positif. "no penis" / "NEVER the man" / "no second woman" contiennent les mots
// "penis", "man", "woman" et les DECLENCHENT (futanari + sosies). On retire donc
// ces negations du positif (elles restent dans le negatif) et on ajoute une
// formulation affirmative : ce qui DOIT etre la, jamais ce qui ne doit pas etre.
const ANATOMY_NEG_FIRST = "penis on a woman, male genitalia on a female body, futanari, shemale, dickgirl, duplicate person, identical women, two identical women, cloned woman, twins, same face twice, extra person, extra woman, fused bodies, conjoined bodies, extra genitalia, ambiguous genitalia, hermaphrodite";
// Decence par defaut (demande utilisateur) : sauf nudite ou scenario sexuel
// EXPLICITE dans le prompt, toute image generee montre des personnages habilles
// de vetements ordinaires. Complementaire de imageSfwPrompt (index.html), qui
// n'agit que quand le verrou global SFW est actif : ici la decence est forcee
// par prompt, meme en mode NSFW global, sauf demande explicite.
const DECENT_NEG_FIRST = "nude, naked, topless, bare breasts, exposed breasts, exposed chest, exposed genitalia, sheer clothing, see-through clothing, transparent clothes, sexualized, erotic, pornographic";
function wantsExplicitNudity(text) {
  try {
    const s = String(text == null ? '' : text);
    if (!s) return false;
    return /(naked|nude|\bnues?\b|\bnu\b|\bnus\b|topless|d[eé]shabill[eé]|d[eé]v[eê]tu|sans v[eê]tement|wearing nothing|sans rien|birth suit|seins?\s+nus?|bare (breasts?|chest|chested)|poitrine (nue|d[eé]voil[eé]e)|vulv|pussy|chatte|p[eé]nis|dick|\bbite\b|testes|testicules|couilles|clitoris|\banus\b|\banal\b|e?rection|gland|e?jaculat|sperm|s[eé]mence|fellation|blowjob|cunnilingus|sodomie|masturbat|p[eé]n[eé]tration|orgie|orgy|bdsm|f[eé]tiche|fetish|kinky|hentai|porn|e?roti|making love|having sex|oiled|huile|lingerie|underwear|sous-v[eê]tement)/i.test(s);
  } catch (e) { return false; }
}
function decentClean(p) {
  try {
    let s = String(p == null ? '' : p);
    if (!s) return s;
    const strips = [
      /\bsexy\b[^.,;]*/gi, /\bseductive\b[^.,;]*/gi, /\bsensuali[sz]ed\b[^.,;]*/gi, /\bsensual\b[^.,;]*/gi,
      /\bsensuel(le)?s?\b[^.,;]*/gi, /\b[eé]rotique\b[^.,;]*/gi, /\berotic\b[^.,;]*/gi,
      /\boiled\b[^.,;]*/gi, /\bhuil[eé](e)?s?\b[^.,;]*/gi,
      /\bsheer\b[^.,;]*/gi, /\bsee-through\b[^.,;]*/gi, /\btransparent(e)?s?\b[^.,;]*/gi,
      /\bexplicit\b[^.,;]*/gi, /\bexplicite\b[^.,;]*/gi
    ];
    for (const re of strips) s = s.replace(re, '');
    s = s.replace(/\s*,\s*,/g, ',').replace(/\s+,/g, ',').replace(/ {2,}/g, ' ').replace(/,\s*,/g, ',').trim();
    return s;
  } catch (e) { return p; }
}
function positiveClean(p, decent) {
  try {
    let s = String(p == null ? '' : p);
    if (!s) return s;
    const strips = [
      /,\s*absolutely no penis[^.,;]*/gi, /\babsolutely no penis[^.,;]*/gi,
      /,\s*no penis[^.,;]*/gi, /\bno penis[^.,;]*/gi,
      /\bsans p[eé]nis[^.,;]*/gi, /\bpas de p[eé]nis[^.,;]*/gi,
      /,\s*no testes[^.,;]*/gi, /\bno testes[^.,;]*/gi,
      /,\s*no testicles[^.,;]*/gi, /\bno testicles[^.,;]*/gi,
      /,\s*no bulge[^.,;]*/gi, /\bno bulge[^.,;]*/gi,
      /,\s*no male genitalia[^.,;]*/gi, /\bno male genitalia[^.,;]*/gi,
      /,\s*no female genitalia[^.,;]*/gi, /\bno female genitalia[^.,;]*/gi,
      /,\s*no vulva[^.,;]*/gi, /\bno vulva[^.,;]*/gi,
      /,\s*no second woman[^.,;]*/gi, /\bno second woman[^.,;]*/gi,
      /,\s*no two women[^.,;]*/gi, /\bno two women[^.,;]*/gi,
      /,\s*no third person[^.,;]*/gi, /\bno third person[^.,;]*/gi,
      /,\s*no other person[^.,;]*/gi, /\bno other person[^.,;]*/gi,
      /,\s*no extra[^.,;]*/gi, /\bno extra[^.,;]*/gi,
      /,\s*never a second man[^.,;]*/gi, /\bnever a second man[^.,;]*/gi,
      /,\s*never two men[^.,;]*/gi, /\bnever two men[^.,;]*/gi,
      /,\s*only the man has a penis[^.,;]*/gi, /\bonly the man has a penis[^.,;]*/gi,
      /,\s*only the man has[^.,;]*/gi,
      /;\s*only the man has[^.;]*/gi,
      /;\s*[^;]*has breasts and a smooth female groin[^;]*/gi,
      /,\s*anatomy mapping:[^.,]*[.,]?/gi, /\banatomy mapping:[^.,]*[.,]?/gi,
      /Every woman is anatomically correct:[^.]*\./gi,
      /Only one woman total in the frame[^.]*\./gi,
      /every woman in the frame an anatomically correct adult woman with breasts and a vulva[^.,]*/gi,
      /she is an anatomically correct adult woman with breasts and a vulva[^.,]*/gi,
      /with breasts and a vulva and no penis/gi,
      /has breasts and a vulva and no penis/gi,
      /with natural breasts and a single vulva, no penis on her/gi,
      /with exactly one penis and testes/gi
    ];
    for (const re of strips) s = s.replace(re, '');
    // "NEVER ..." : toutes des negations -> au negatif uniquement. On les retire
    // du positif pour ne pas activer "man / woman / couple / penis".
    s = s.replace(/,\s*NEVER[^.,;]*/gi, '');
    s = s.replace(/\bNEVER[^.,;]*/gi, '');
    // "and no man" contient "man" -> remplace par scene 100% feminine.
    s = s.replace(/,\s*and no man\b/gi, '');
    s = s.replace(/\band no man\b/gi, ' all-female scene');
    s = s.replace(/,\s*no man\b[^.,]*/gi, '');
    s = s.replace(/\s*,\s*,/g, ',').replace(/\s+,/g, ',').replace(/ {2,}/g, ' ').replace(/,\s*,/g, ',').trim();
    let wN = 0, mN = 0;
    try {
      const lm = s.match(/exactly (\d+) (?:women|woman)\s*\([^)]*\)(?: plus (\d+) (?:men|man)\s*\([^)]*\))?/i);
      if (lm) {
        wN = Number(lm[1]) || 0;
        if (lm[2]) mN = Number(lm[2]) || 0;
        if (/all-female/i.test(s)) mN = 0;
      } else {
        if (/(one single adult woman alone|HER ALONE|alone, no man in the frame|exactly one woman\s*\()/i.test(s)) wN = 1;
        else if (/exactly one woman/i.test(s)) wN = 1;
        else if (/\btwo\b[^.,;]{0,40}\bwomen\b|both women|deux femmes|2 femmes/i.test(s)) wN = 2;
        else if (/\bthree\b[^.,;]{0,40}\bwomen\b/i.test(s)) wN = 3;
        else if (/\bfour\b[^.,;]{0,40}\bwomen\b/i.test(s)) wN = 4;
        else if (/\b2 women\b|\b3 women\b/i.test(s)) { const nn = s.match(/\b([234]) women\b/i); wN = nn ? Number(nn[1]) : 2; }
        else if (/\bsolo\b|\balone\b|\bsingle (?:adult )?woman\b|\bone woman\b|\b1 woman\b|\blone (?:naked )?woman\b/i.test(s) && !/\btwo\b|\bthree\b|\bfour\b|\b2 women\b|\b3 women\b|deux femmes/i.test(s)) wN = 1;
        if (/\bplus \d+ (?:men|man)\b/i.test(s)) {
          const mm = s.match(/plus (\d+) (?:men|man)/i);
          mN = mm ? (Number(mm[1]) || 1) : 1;
        } else if (/\bnaked man\b|\bmale body\b|exactly one (?:adult )?man\b|one single adult man alone/i.test(s)) mN = 1;
        else if (/\b(man|men|male|homme|hommes|masculin)\b/i.test(s) && !/\b(woman|women|female|femme|femmes|fille|mistress|girl)\b/i.test(s) && /\b(solo|alone|single|one|portrait|face|visage|photo|photographie)\b/i.test(s)) mN = 1;
        if (/all-female/i.test(s)) mN = 0;
      }
      if (/ and no woman/i.test(s)) wN = 0;
    } catch (e) {}
    let add = '';
    if (!decent) {
    if (wN === 1 && mN === 0) {
      add = 'Solo portrait of one single adult woman alone, one person only, one face, one body, feminine soft features, anatomically correct female body with breasts and smooth female groin';
    } else if (wN >= 2 && mN === 0) {
      add = 'Group portrait of exactly ' + wN + ' distinct adult women standing side by side with clear space between them, different faces, different hairstyles, different body details, natural variation between them, separate bodies, anatomically correct female bodies with breasts and smooth female groins';
    } else if (wN >= 1 && mN >= 1) {
      add = 'Woman with feminine anatomy and man with masculine anatomy, two separate bodies with clear separation between torsos, each body whole and distinct, no body fusion';
      if (wN >= 2) add += ', each woman visually distinct with a different face and hairstyle';
    } else if (wN === 0 && mN >= 1) {
      add = 'Solo portrait of one single adult man alone, one person only, masculine anatomy, separate whole body';
    }
    } else {
    // Mode decent : meme separation des corps, sans vocabulaire anatomique
    // (inutile sous des vetements, et chaque mot declencheur compte).
    if (wN === 1 && mN === 0) {
      add = 'Solo portrait of one single adult woman alone, one person only, one face, one body, feminine soft features';
    } else if (wN >= 2 && mN === 0) {
      add = 'Group portrait of exactly ' + wN + ' distinct adult women standing side by side with clear space between them, different faces, different hairstyles, different body details, natural variation between them, separate bodies';
    } else if (wN >= 1 && mN >= 1) {
      add = 'Woman and man, two separate bodies with clear separation between torsos, each body whole and distinct, no body fusion';
      if (wN >= 2) add += ', each woman visually distinct with a different face and hairstyle';
    } else if (wN === 0 && mN >= 1) {
      add = 'Solo portrait of one single adult man alone, one person only, separate whole body';
    }
    }
    if (add && s.toLowerCase().indexOf(add.toLowerCase().slice(0, 30)) < 0) s = s.replace(/\s+$/, '') + ', ' + add;
    return s.replace(/\s*,\s*,/g, ',').replace(/ {2,}/g, ' ').trim();
  } catch (e) { return p; }
}
function bustFrag(text) {
  const n = norm(text);
  const has = (re) => re.test(n);
  const bust = has(/\bsein|\bseins|\bpoitrine|\bboobs|\bbreast|\btits\b/);
  if (!bust) return "";
  if (has(/enorme|enormes|gigantesque|immense|demesure|huge|gigantic/)) return "huge natural breasts";
  if (has(/gros|grosse|genereuse|genereuses|forte|fortes|opulente|volumineuse|large|larges|big|large/)) return "large natural pear-shaped breasts";
  if (has(/petit|petite|petits|petites|menu|small|tiny/)) return "small natural breasts";
  if (has(/moyen|moyenne|medium/)) return "medium natural breasts";
  return "";
}
function detect(text) {
  const n = norm(text);
  let best = null;
  function consider(st, score, strip) {
    if (score > 0 && (!best || score > best.score)) best = {frag: st.p, neg: st.g, name: st.n, strip: strip || null, score: score};
  }
  const m = String(text).match(/(?:style|façon|facon|manière|maniere|version|esprit|genre)\s+([a-zàâäéèêëîïôöùûüçœæ0-9][a-zàâäéèêëîïôöùûüçœæ0-9 \/-]{1,36}?)(?=[,.;]|$)/i) || String(text).match(/in(?:\s+the)?\s+style\s+of\s+([a-z0-9][a-z0-9 \-]{1,36}?)(?=[,.;]|$)/i);
  if (m) {
    const cand = norm(m[1]);
    const cw = cand.split(" ").filter(w => w.length > 2);
    let found = null;
    let fs = 0;
    for (const st of IMG_STYLES) {
      const hay = norm(st.n) + " " + st.k.join(" ") + " " + st.f.join(" ");
      let sc = 0;
      if (cand.length >= 3 && hay.indexOf(cand) >= 0) sc += 100 + cand.length;
      for (const w of cw) if (wbHit(hay, w)) sc += w.length;
      if (sc > fs) {
        fs = sc;
        found = st;
      }
    }
    if (found) {
      const strip = String(text).replace(m[0], " ").replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();
      consider(found, 1000 + fs, strip);
      return best;
    }
  }
  for (const st of IMG_STYLES) {
    let sc = 0;
    for (const k of st.k) if (wbHit(n, k)) sc += k.length;
    for (const f of st.f) if (wbHit(n, f)) sc += f.length + 20;
    consider(st, sc, null);
  }
  return best;
}
export function attachImgStyles(App) {
  App.ImgStyles = {
    STYLES: IMG_STYLES,
    detect: detect,
    looksFrench: looksFrench,
    async translate(text) {
      const s = String(text || "");
      if (!s || !looksFrench(s)) return s;
      try {
        const r = await App.Core.runInternal("Translate to English. Output ONLY the translation, no quotes, no commentary:\n" + s);
        let t = (typeof r === "string") ? r : String((r && r.text) || "");
        t = t.trim().replace(/^["«“']+|["»”']+$/g, "").trim();
        if (t && /[a-zA-Z]{3,}/.test(t)) return t;
      } catch (e) {}
      return s;
    },
    async prepare(prompt, options) {
      let s = String(prompt || "");
      const det = detect(s) || {frag: PHOTO_FRAG, neg: PHOTO_NEG, strip: null};
      if (det && det.strip) s = det.strip;
      s = s.replace(/\s*,\s*,+/g, ",").replace(/\s*,\s*$/g, "").replace(/^\s*,\s*/g, "");
      s = await App.ImgStyles.translate(s);
      // Decence par defaut : sauf demande explicite, on habille.
      let __wantNude = false;
      try { __wantNude = wantsExplicitNudity(s) || wantsExplicitNudity(prompt); } catch (eWN) {}
      if (!__wantNude) { try { s = decentClean(s); } catch (eDC0) {} }
      // Nettoyage affirmatif AVANT d'ajouter le style : retire les negations
      // a declencheurs ("no penis", "NEVER the man", ...) et ajoute la version
      // affirmative (solo / duo distinct / corps separes).
      try { s = positiveClean(s, !__wantNude); } catch (ePC) {}
      if (det && det.frag) s = s.replace(/\s+$/, "") + ", " + det.frag;
      try { const bf = bustFrag(String(prompt || "")); if (bf && s.toLowerCase().indexOf("breast") < 0) s = s.replace(/\s+$/, "") + ", " + bf; } catch (eB) {}
      // Personnages habilles de vetements ordinaires (formulation affirmative
      // uniquement : pas de "no nudity" dans le positif, chaque negation est
      // un declencheur). Compatible avec le garde imageSfwPrompt d'index.html.
      try {
        if (!__wantNude && !/(fully clothed|habill[ée]e?s?|v[êe]tus?|dressed in|wearing (an? )?(jeans|shirt|dress|t-shirt|pull|sweater|jacket|manteau|robe\b|pantalon|jupe|uniforme|costume|clothes|habits|tenue))/i.test(s)) {
          if (/(beach|plage|pool|piscine|sauna|swim|bain|bord de mer|seaside|hot tub|jacuzzi)/i.test(s)) s = s.replace(/\s+$/, "") + ", fully clothed in modest attire (decent modest swimwear appropriate for a beach or pool scene, tasteful and wholesome)";
          else s = s.replace(/\s+$/, "") + ", fully clothed in modest everyday clothing (ordinary real-life outfit with jeans shirt or dress), decent wholesome family-friendly portrait";
        }
      } catch (eDC1) {}
      let o = options || {};
      // Negatifs critiques D'ABORD (le modele tronque la fin) : decence, anatomie + sosies.
      o = Object.assign({}, o, {negativePrompt: o.negativePrompt ? (ANATOMY_NEG_FIRST + ", " + o.negativePrompt) : ANATOMY_NEG_FIRST});
      try {
        if (!__wantNude) o = Object.assign({}, o, {negativePrompt: o.negativePrompt ? (DECENT_NEG_FIRST + ", " + o.negativePrompt) : DECENT_NEG_FIRST});
      } catch (eDN) {}
      if (det && det.neg) o = Object.assign({}, o, {negativePrompt: o.negativePrompt ? (o.negativePrompt + ", " + det.neg) : det.neg});
      // Duo / groupe : imposer le format large pour eviter la fusion des corps.
      try {
        if (!o.resolution && /exactly \d+ (?:women|woman|men|man)|two\b[^.,;]{0,40}\bwomen|plus \d+ (?:men|man)|three\b[^.,;]{0,40}\bwomen|four\b[^.,;]{0,40}\bwomen|group of|exactly 2 distinct adult women/i.test(s)) o.resolution = '768x512';
      } catch (eRes) {}
      // Duo mixte : filet large meme sans la formulation "exactly N ..." (le
      // prompt photo peut decrire les corps autrement) : deux corps separes
      // ne tiennent pas dans un carre.
      try {
        if (!o.resolution && /(plus \d+ (?:men|man)|naked man|(?<!fe)male body|Woman with feminine anatomy and man with masculine anatomy)/i.test(s)) o.resolution = '768x512';
      } catch (eRes2) {}
      // Solo femme : forcer l'exclusion du masculin dans le negatif (le positif
      // ne contient plus aucun mot declencheur, le negatif fait le travail).
      try {
        if (/(one single adult woman alone|all-female scene|exactly 1 woman|Solo portrait of one single adult woman)/i.test(s) && !/(plus \d+ (?:men|man)|naked man|(?<!fe)male body)/i.test(s)) {
          o.negativePrompt = (o.negativePrompt ? (o.negativePrompt + ", ") : "") + "man, male body, naked man, male person, two people, second person, penis, testes, male genitalia, two women, duplicate person";
        }
      } catch (eSolo) {}
      // Solo femme NUE : activer la verification vision (comptage W/M + EPS,
      // voir _verifyImageAnatomy) comme pour les duos mixtes. Sans cela un
      // solo rate (sosie + futanari) part tel quel, sans 2e essai. Limite aux
      // prompts denudes pour ne pas ralentir les portraits SFW.
      try {
        if (!o._verifyAnatomy && /(one single adult woman alone|all-female scene|Solo portrait of one single adult woman)/i.test(s) && !/(plus \d+ (?:men|man)|naked man|(?<!fe)male body)/i.test(s) && /(naked|nude|\bnue?\b|topless|seins?\s*nus?|bare (breasts?|chest)|vulv|pussy|penis|dick|oiled|huil|erection|membre|gland)/i.test(s)) {
          o._verifyAnatomy = { w: 1, m: 0, apt: /apartment|appartement|parquet/i.test(s) };
        }
      } catch (eVerSolo) {}
      return {prompt: s, options: o};
    }
  };
  // Anti-doublon intra-reponse : quand la reflexion puis la reprise du fil
  // renvoient le meme bloc, la bulle contient deux fois le meme texte avec
  // une micro-transition entre les deux ("Emma; Lieu: ...", "Emma reprend le
  // fil"). loopClip ne voit que les phrases immediates (ecart <= 90), donc il
  // laisse passer un bloc de 700 signes repete. On enveloppe loopClip pour
  // couper aussi les gros blocs quasi identiques dans la MEME reponse.
  try {
    if (App.Core && typeof App.Core.loopClip === 'function' && !App.Core.loopClip._dedupPatched) {
      const __origLoopClip = App.Core.loopClip.bind(App.Core);
      const __normDup = (t) => {
        try {
          let x = String(t || '').toLowerCase();
          x = x.normalize ? x.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : x;
          x = x.replace(/[«»“”‘’]/g, (m) => (/[«»“”]/.test(m) ? '"' : "'"));
          x = x.replace(/…/g, '...').replace(/[—–]/g, '-');
          x = x.replace(/\s+([?!:;,.)\]])/g, '$1');
          x = x.replace(/["']+/g, '"').replace(/\s+/g, ' ').trim();
          return x;
        } catch (e) { return String(t || '').toLowerCase().trim(); }
      };
      const __splitDup = (s) => {
        const out = [];
        const n = s.length;
        let start = 0, i = 0;
        const push = (end) => {
          const raw = s.slice(start, end);
          const norm = __normDup(raw);
          if (raw.trim()) out.push({ raw: raw, norm: norm, start: start, end: end });
          start = end;
        };
        while (i < n) {
          const c = s[i];
          if (c === '\n') { push(i + 1); i++; continue; }
          if (c === '.' || c === '!' || c === '?' || c === '…') {
            let j = i + 1;
            while (j < n && (s[j] === '.' || s[j] === '!' || s[j] === '?' || s[j] === '…')) j++;
            while (j < n && ('"\'”’»)]}'.indexOf(s[j]) !== -1)) j++;
            if (j >= n || /\s/.test(s[j])) { push(j); i = j; continue; }
            i = j; continue;
          }
          i++;
        }
        if (n > start) push(n);
        return out.filter((u) => u.norm.length >= 20);
      };
      const __dedupSameReply = (s) => {
        try {
          s = String(s == null ? '' : s);
          if (s.length < 400 || s.length > 15000) return { text: s, cut: -1, reason: '' };
          let units = __splitDup(s);
          if (units.length < 6) return { text: s, cut: -1, reason: '' };
          // Plafond : seul le dernier tiers compte (le doublon est toujours a la fin).
          if (units.length > 80) units = units.slice(units.length - 80);
          // Index par premiere phrase : on ne compare que les paires qui
          // commencent par la meme phrase normalisee (au lieu de tout x tout).
          const byFirst = new Map();
          for (let i = 0; i < units.length; i++) {
            const k = units[i].norm;
            if (!byFirst.has(k)) byFirst.set(k, []);
            byFirst.get(k).push(i);
          }
          let best = null, budget = 0;
          for (const idxs of byFirst.values()) {
            if (idxs.length < 2) continue;
            for (let x = 0; x < idxs.length && budget < 2000; x++) {
              for (let y = x + 1; y < idxs.length && budget < 2000; y++) {
                const a = idxs[x], b = idxs[y];
                budget++;
                let k = 0;
                while ((a + k) < b && (b + k) < units.length && units[a + k].norm === units[b + k].norm && k < 40) k++;
                if (k >= 3) {
                  let chars = 0;
                  for (let q = 0; q < k; q++) chars += units[b + q].raw.length;
                  if (chars >= 200 && (!best || chars > best.chars)) {
                    best = { a: a, b: b, len: k, chars: chars, cut: units[b].start };
                  }
                }
              }
            }
            if (best && best.chars >= 600) break;
          }
          if (!best) return { text: s, cut: -1, reason: '' };
          let cut = best.cut;
          // Si une micro-transition precede le doublon ("Emma; Lieu: ...",
          // "Emma reprend le fil"), couper des son debut.
          try {
            const before = s.slice(Math.max(0, cut - 200), cut);
            const lines = before.split('\n');
            const last = lines[lines.length - 1];
            if (last && last.trim().length <= 120 && /lieu\s*:|reprend (le fil|du d|les sc|la sc)|recommence|continue|poursuit|encha[iî]ne/i.test(last)) {
              cut = cut - last.length;
            } else {
              const m = before.match(/\n[^\n]{1,120}(?:lieu\s*:|reprend (?:le fil|du d|les sc|la sc)|recommence|continue|poursuit)[^\n]*\s*$/i);
              if (m && m.index != null) cut = Math.max(0, cut - 200 + m.index + 1);
            }
          } catch (eH) {}
          cut = Math.max(0, cut);
          if (cut < 100) return { text: s, cut: -1, reason: '' };
          let out = s.slice(0, cut).replace(/[ \t]+$/gm, '').replace(/\s+$/, '');
          return { text: out, cut: cut, reason: 'same-block' };
        } catch (e) { return { text: String(s || ''), cut: -1, reason: '' }; }
      };
      // Anti-doublon keepRetryText : les gardes (Opener, Fiche, Brief, Song,
      // Sofia...) recollent ancien buf + tour corrige via
      // `buf = keepRetryText(session, buf, newText)` => `base + '\n\n' + nw`.
      // Le test d'origine (`base.indexOf(nw) >= 0`) est EXACT : des
      // micro-differences ("Max ?" vs "Max?", "…" vs "...", accents) le
      // font echouer et la bulle affiche 2x le meme bloc (mobile comme PC,
      // c'est bien dans le script). Quand l'ancien et le nouveau sont
      // quasi identiques, le retry REMPLACE au lieu de CONCATENER.
      const __stripDupHeader = (s) => {
        try {
          return String(s || '').split('\n').filter((ln) => {
            const t = String(ln || '').trim();
            if (!t) return true;
            if (t.length <= 130 && /lieu\s*:|reprend (le fil|du d|les sc|la sc)|recommence|continue|poursuit|encha[iî]ne/i.test(t)) return false;
            if (/^[^:;]{1,30};\s*lieu\s*:/i.test(t)) return false;
            return true;
          }).join('\n');
        } catch (e) { return String(s || ''); }
      };
      const __isNearDup = (a, b) => {
        try {
          a = String(a == null ? '' : a);
          b = String(b == null ? '' : b);
          if (a.length < 120 || b.length < 120) return false;
          const an = __normDup(__stripDupHeader(a));
          const bn = __normDup(__stripDupHeader(b));
          if (!an || !bn) return false;
          const shortLen = Math.min(an.length, bn.length);
          if (shortLen >= 200 && (an.indexOf(bn) >= 0 || bn.indexOf(an) >= 0)) return true;
          let ua = [], ub = [];
          try { ua = __splitDup(__stripDupHeader(a)); } catch (e) { ua = []; }
          try { ub = __splitDup(__stripDupHeader(b)); } catch (e) { ub = []; }
          if (ua.length < 3 || ub.length < 3) return false;
          const setA = new Set();
          for (const u of ua) setA.add(u.norm);
          let hit = 0;
          for (const u of ub) if (setA.has(u.norm)) hit++;
          const denom = Math.min(ua.length, ub.length);
          if (hit >= 3 && (hit / denom >= 0.6 || hit >= denom - 1)) return true;
          return false;
        } catch (e) { return false; }
      };
      // Épissure anti-réécriture avec perte : quand le retry recommence au
      // début en paraphrasant (ex. "Oh... tu abandonnes déjà, Max?" devenu
      // "tu abandonnes déjà, Max?", yeux inventés), le REMPLACEMENT pur
      // perd le texte déjà vu par l'utilisateur. Ici on garde l'original
      // (rogné à sa dernière phrase complète, comme l'original) et on ne
      // rajoute que les phrases VRAIMENT inédites du retry.
      const __unitWords = (nu) => {
        try {
          return String(nu || '').split(' ').map((w) => String(w || '').replace(/[^a-z]/g, '')).filter((w) => w.length >= 3);
        } catch (e) { return []; }
      };
      const __fuzzyUnitSame = (a, b) => {
        try {
          if (!a || !b) return false;
          if (a === b) return true;
          if (a.length >= 60 && (a.indexOf(b) >= 0 || b.indexOf(a) >= 0)) return true;
          const wa = __unitWords(a), wb = __unitWords(b);
          if (!wa.length || !wb.length) return false;
          const setA = new Set(wa);
          let inter = 0;
          for (const w of wb) if (setA.has(w)) inter++;
          const union = wa.length + wb.length - inter;
          if (union <= 0) return false;
          return (inter / union) >= 0.7;
        } catch (e) { return false; }
      };
      const __spliceRewrite = (oldText, newText) => {
        try {
          const oFull = String(oldText == null ? '' : oldText).trim();
          const nFull = String(newText == null ? '' : newText).trim();
          if (!oFull || !nFull) return { did: false };
          let base = oFull;
          try {
            const sb = String(base).match(/^([\s\S]*[.!?…])([^.!?…\n]+)$/);
            if (sb && sb[1].replace(/\s+/g, ' ').trim().length >= 40) base = sb[1].trim();
          } catch (e) {}
          let ou = [], nu = [];
          try { ou = __splitDup(__stripDupHeader(base)); } catch (e) { ou = []; }
          try { nu = __splitDup(__stripDupHeader(nFull)); } catch (e) { nu = []; }
          if (!ou.length || !nu.length) return { did: false };
          // Ouverture commune (le retry réécrit depuis le début) ?
          let k = 0;
          while (k < ou.length && k < nu.length && __fuzzyUnitSame(ou[k].norm, nu[k].norm) && k < 40) k++;
          let start = k;
          if (k < 2) {
            // Pas d'ouverture commune : le retry peut être dans un autre
            // ordre. On coupe à la première unité inédite.
            const baseNorms = ou.map((u) => u.norm);
            start = -1;
            for (let i = 0; i < nu.length; i++) {
              let seen = false;
              for (const b of baseNorms) {
                if (b === nu[i].norm || __fuzzyUnitSame(b, nu[i].norm)) { seen = true; break; }
              }
              if (!seen) { start = i; break; }
            }
            if (start === -1) return { did: false, text: base };
          }
          const baseNorms2 = ou.map((u) => u.norm);
          const fresh = [];
          for (let i = start; i < nu.length; i++) {
            const u = nu[i];
            let seen = false;
            for (const b of baseNorms2) {
              if (b === u.norm || __fuzzyUnitSame(b, u.norm)) { seen = true; break; }
            }
            if (!seen) fresh.push(u);
          }
          if (!fresh.length) return { did: false, text: base };
          let tailRaw = fresh.map((u) => u.raw).join('').trim();
          if (!tailRaw || tailRaw.length < 30) return { did: false, text: base };
          let out = base.replace(/\s+$/, '') + ' ' + tailRaw;
          out = out.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
          if (out.length < 80) return { did: false };
          return { did: true, text: out };
        } catch (e) { return { did: false }; }
      };
      // Anti-boucle de mot : "propre propre propre ..." x300. Le decoupeur
      // de loopClip ne voit que des fins de phrase, donc une rafale d'un
      // meme mot separes par des espaces ne forme qu'UNE seule unite et
      // n'est jamais coupee. Ici on ecrase lineairement : 4e repetition et
      // suivantes supprimees (triple "oui oui oui" / "oh oh oh" garde).
      const __collapseWordRuns = (s) => {
        try {
          s = String(s == null ? '' : s);
          if (s.length < 60 || s.length > 30000) return { text: s, cut: -1, reason: '' };
          const normTok = (w) => {
            let x = String(w || '').toLowerCase();
            try { x = x.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
            return x.replace(/[^a-z]/g, '');
          };
          const parts = s.split(/(\s+)/);
          let kept = [], prev = '', run = 0, cut = -1, keptLen = 0;
          for (let k = 0; k < parts.length; k++) {
            const p = parts[k];
            if (p === '' || /^\s+$/.test(p)) { kept.push(p); keptLen += p.length; continue; }
            const n = normTok(p);
            if (n.length >= 2 && prev && n === prev) {
              run++;
              if (run >= 3) {
                if (cut === -1) cut = keptLen;
                // Ne pas empiler les espaces des mots supprimes : retire le
                // separateur precedent, sinon "propre x300" laisse des blancs.
                if (kept.length && /^\s+$/.test(kept[kept.length - 1])) { keptLen -= kept[kept.length - 1].length; kept.pop(); }
                continue;
              }
              kept.push(p); keptLen += p.length;
            } else {
              prev = (n.length >= 2) ? n : '';
              run = 0;
              kept.push(p); keptLen += p.length;
            }
          }
          if (cut === -1) return { text: s, cut: -1, reason: '' };
          return { text: kept.join(''), cut: cut, reason: 'word-run' };
        } catch (e) { return { text: String(s || ''), cut: -1, reason: '' }; }
      };
      // Anti-rappel de fiche : le personnage termine parfois sa bulle par un
      // pense-bete de fiche entre parentheses, ex :
      // (Max: homme, 55 ans, ... / Emma: femme, ... / Lieu: appartement /
      // Les gardes ligne-a-ligne (ficheDumpCut / FL) ne le voient pas car
      // tout tient sur une seule parenthese finale. On coupe la parenthese
      // quand elle cumule : Nom: d'entree, 2+ separateurs "/", et 3+
      // indices fiche (ans, cm, yeux, poitrine, vulve, penis, lieu...).
      const __ficheTailCut = (s) => {
        try {
          s = String(s == null ? '' : s);
          if (s.length < 140) return { text: s, cut: -1, reason: '' };
          const tailStart = Math.max(0, s.length - 1500);
          const tail = s.slice(tailStart);
          const openRel = tail.search(/\([A-ZÀ-ÞĀ-Ž][A-Za-zÀ-ÿĀ-ž'’\-]{1,24}\s*:/);
          if (openRel === -1) return { text: s, cut: -1, reason: '' };
          const openAbs = tailStart + openRel;
          const cand = s.slice(openAbs);
          if (cand.length < 120 || cand.length > 1500) return { text: s, cut: -1, reason: '' };
          const slashes = (cand.match(/\//g) || []).length;
          if (slashes < 2) return { text: s, cut: -1, reason: '' };
          let norm = cand;
          try { norm = __normDup(cand); } catch (e) {}
          const vocab = ['ans', 'cm', 'kg', 'yeux', 'cheveux', 'poitrine', 'seins', 'vulve', 'clitoris', 'penis', 'testicule', 'couille', 'lieu', 'appartement', 'taille', 'poids', 'crane rase', 'tenue', 'lingerie', 'metier', 'frein', 'gland', 'huile'];
          let hits = 0;
          for (const w of vocab) { if (norm.indexOf(w) !== -1) hits++; }
          if (hits < 3) return { text: s, cut: -1, reason: '' };
          let out = s.slice(0, openAbs).replace(/[ \t]+$/gm, '').replace(/\s+$/, '');
          if (out.length < 40) return { text: s, cut: -1, reason: '' };
          return { text: out, cut: openAbs, reason: 'fiche-tail' };
        } catch (e) { return { text: String(s || ''), cut: -1, reason: '' }; }
      };
      // Variante SANS parentheses ni "/" : pense-bete fiche en ligne, ex :
      // Emma: femme, svelte, yeux bruns-verts, ... Max: homme, 55 ans, ...
      // act: ... place: appartement.
      // On remonte la serie contigue d'entetes "Nom:" (sans dialogue, sans
      // question) et on coupe si ca cumule attributs virgules + marqueurs
      // fiche (act/place/lieu, mesures, vocab intime). Les dialogues
      // ("Emma: « ... »") et les vraies repliques sont exclus.
      const __ficheInlineCut = (s) => {
        try {
          s = String(s == null ? '' : s);
          if (s.length < 140) return { text: s, cut: -1, reason: '' };
          const vocabSub = ['yeux', 'cheveux', 'poitrine', 'seins', 'vulve', 'clitoris', 'penis', 'testicule', 'couille', 'appartement', 'taille', 'poids', 'lingerie', 'metier', 'gland', 'huile', 'svelte', 'vagin', 'levre', 'entonnoir', 'poilu', 'frein', 'charnu', 'sensible', 'menotte', 'baille', 'attache'];
          const normOf = (x) => {
            try { return __normDup(x); } catch (e) { return String(x || '').toLowerCase(); }
          };
          const tailStart = Math.max(0, s.length - 1500);
          const tail = s.slice(tailStart);
          const hdrRe = /\b[A-ZÀ-ÞĀ-Ž][A-Za-zÀ-ÿĀ-ž'’\-]{1,24}\s*:/g;
          let hs = [], mm;
          while ((mm = hdrRe.exec(tail))) hs.push(tailStart + mm.index);
          if (!hs.length) return { text: s, cut: -1, reason: '' };
          // Remonte la serie contigue : l'ecart entre deux entetes doit
          // ressembler a de la fiche (virgules, pas de dialogue/question).
          let start = hs[hs.length - 1];
          for (let k = hs.length - 1; k > 0; k--) {
            const gap = s.slice(hs[k - 1], hs[k]);
            if (gap.length > 500 || /[«»"“”?]/.test(gap)) break;
            if (!/[,;\/]/.test(gap)) break;
            const gn = normOf(gap);
            let gh = false;
            for (const w of vocabSub) { if (gn.indexOf(w) !== -1) { gh = true; break; } }
            if (!gh && !/\b(act|place|lieu)\s*:/i.test(gap) && !/\b\d+\s*(ans|cm|kg)\b/.test(gn)) break;
            start = hs[k - 1];
          }
          const cand = s.slice(start);
          if (cand.length < 100 || cand.length > 1500) return { text: s, cut: -1, reason: '' };
          if (/[«»"“”]/.test(cand) || cand.indexOf('?') !== -1) return { text: s, cut: -1, reason: '' };
          const headers = cand.match(/\b[A-ZÀ-ÞĀ-Ž][A-Za-zÀ-ÿĀ-ž'’\-]{1,24}\s*:/g) || [];
          const hasAct = /\b(act|place|lieu|action)\s*:/i.test(cand);
          if (!(headers.length >= 2 || (headers.length >= 1 && hasAct))) return { text: s, cut: -1, reason: '' };
          const commas = (cand.match(/[,;]/g) || []).length;
          if (commas < 3) return { text: s, cut: -1, reason: '' };
          const cn = normOf(cand);
          let distinct = 0;
          for (const w of vocabSub) { if (cn.indexOf(w) !== -1) distinct++; }
          const hasMeasure = /\b\d+\s*(ans|cm|kg)\b/.test(cn);
          const hasNu = /\bnues?\b/.test(cn);
          if (!(hasAct || hasMeasure || hasNu || distinct >= 4)) return { text: s, cut: -1, reason: '' };
          let out = s.slice(0, start).replace(/[ \t]+$/gm, '').replace(/\s+$/, '');
          if (out.length < 40) return { text: s, cut: -1, reason: '' };
          return { text: out, cut: start, reason: 'fiche-inline' };
        } catch (e) { return { text: String(s || ''), cut: -1, reason: '' }; }
      };
      App.Core.loopClip = function (text) {
        let r;
        try { r = __origLoopClip(text); } catch (e) { r = { text: String(text == null ? '' : text), cut: -1, reason: '' }; }
        try {
          let t = r.text, wcut = -1, wreason = '';
          try {
            const f = __ficheTailCut(t);
            if (f && f.cut !== -1 && f.text !== t) { t = f.text; wcut = f.cut; wreason = 'fiche-tail'; }
          } catch (e) {}
          try {
            const g = __ficheInlineCut(t);
            if (g && g.cut !== -1 && g.text !== t) { t = g.text; if (wcut === -1) { wcut = g.cut; wreason = 'fiche-inline'; } }
          } catch (e) {}
          try {
            const w = __collapseWordRuns(t);
            if (w && w.cut !== -1 && w.text !== t) { t = w.text; if (wcut === -1) { wcut = w.cut; wreason = 'word-run'; } }
          } catch (e) {}
          const d = __dedupSameReply(t);
          if (d && d.cut !== -1) return d;
          if (t !== r.text) return { text: t, cut: wcut, reason: wreason || 'word-run' };
        } catch (e) {}
        return r;
      };
      App.Core.loopClip._dedupPatched = true;
      // Meme filet sur keepRetryText : le retry corrige remplace, il ne
      // s'ajoute jamais en double quand c'est le meme bloc.
      try {
        if (App.Core && typeof App.Core.keepRetryText === 'function' && !App.Core.keepRetryText._nearDupPatched) {
          const __origKeep = App.Core.keepRetryText.bind(App.Core);
          App.Core.keepRetryText = function (session, oldBuf, newText) {
            let nw = '', old = '';
            try { nw = String(newText == null ? '' : newText).trim(); } catch (e) { nw = ''; }
            try { old = String(oldBuf == null ? '' : oldBuf).trim(); } catch (e) { old = ''; }
            try {
              if (!nw) return old;
              if (!old) return nw;
              // Nettoie d'abord un doublon interne au retry lui-meme.
              let nwClean = nw;
              try {
                const dd = __dedupSameReply(nw);
                if (dd && dd.cut !== -1 && dd.text && dd.text.length >= 80) nwClean = dd.text;
              } catch (e) {}
              // Meme bloc a micro-differences pres (+ transition "Lieu:" /
              // "reprend le fil" eventuelle) : le retry corrige remplace.
              try {
                if (__isNearDup(old, nwClean)) {
                  // ... sauf quand l'ancien est SAIN : le retry est alors une
                  // réécriture avec perte (pensée coupée en plein milieu puis
                  // reprise paraphrasée : "Oh..." perdu, détails inventés).
                  // On épisse : original préservé + seule la suite inédite.
                  try {
                    let _bad = false;
                    try {
                      const _C = App.Core;
                      if (_C) {
                        if (_C.selfIntroShape && _C.selfIntroShape(old)) _bad = true;
                        else if (_C.scenePitchShape && _C.scenePitchShape(old)) _bad = true;
                        else if (_C.soloTwoVoicesDrift && _C.soloTwoVoicesDrift(old, session, true)) _bad = true;
                        else if (_C.remoteContactDrift && _C.remoteContactDrift(old, session, true)) _bad = true;
                        else if (_C.briefViolationHit && _C.briefViolationHit(old)) _bad = true;
                      }
                    } catch (eB) {}
                    if (!_bad) {
                      const _sp = __spliceRewrite(old, nwClean);
                      if (_sp && _sp.did && _sp.text && _sp.text.length >= 80) {
                        try { console.warn('[Dedup] keepRetryText: réécriture détectée - original préservé + suite inédite'); } catch (e) {}
                        return _sp.text;
                      }
                      try { console.warn('[Dedup] keepRetryText: retry quasi identique sans suite - original préservé'); } catch (e) {}
                      return old;
                    }
                  } catch (eS) {}
                  try { console.warn('[Dedup] keepRetryText: retry quasi identique - remplacement sans concatenation'); } catch (e) {}
                  return nwClean;
                }
              } catch (e) {}
              let r = '';
              try { r = __origKeep(session, oldBuf, nwClean); }
              catch (e) { r = __origKeep(session, oldBuf, newText); }
              // Filet : si la concatenation a quand meme fabrique un double
              // bloc, on garde la version corrigee (le retry).
              try {
                if (typeof r === 'string' && r.length > Math.max(old.length, nwClean.length) + 100) {
                  const d = __dedupSameReply(r);
                  if (d && d.cut !== -1 && __isNearDup(old, nwClean)) {
                    try {
                      const _sp2 = __spliceRewrite(old, nwClean);
                      if (_sp2 && _sp2.did && _sp2.text && _sp2.text.length >= 80) return _sp2.text;
                      if (_sp2 && _sp2.text && _sp2.text.length >= 80) return _sp2.text;
                    } catch (eS2) {}
                    return nwClean;
                  }
                }
              } catch (e) {}
              return r;
            } catch (e) {
              try { return __origKeep(session, oldBuf, newText); }
              catch (e2) { return String(newText == null ? '' : newText); }
            }
          };
          App.Core.keepRetryText._nearDupPatched = true;
        }
      } catch (eKeep) {}
      // Retouche du 2e essai anatomie : la correction ("no penis on any
      // woman", "exactly 1 penis...", "exactly 1 women" au pluriel !)
      // reintroduit le declencheur "penis" dans le POSITIF du retry. On
      // reformule sans le mot declencheur et au singulier, sens inchange.
      try {
        if (App.Core && typeof App.Core._verifyImageAnatomy === 'function' && !App.Core._verifyImageAnatomy._rewordPatched) {
          const __origVerify = App.Core._verifyImageAnatomy.bind(App.Core);
          App.Core._verifyImageAnatomy = async function (r, prompt, v) {
            let bad = '';
            try { bad = await __origVerify(r, prompt, v); } catch (e) { return ''; }
            try {
              bad = String(bad || '');
              if (!bad) return bad;
              bad = bad.replace(/\bpenises\b/gi, 'male organs').replace(/\bpenis\b/gi, 'male organ');
              bad = bad.replace(/\bexactly 1 women\b/gi, 'exactly 1 woman');
              bad = bad.replace(/\bexactly (\d+) mans\b/gi, 'exactly $1 men');
              bad = bad.replace(/no male organ on any woman/gi, 'all women strictly without male anatomy');
            } catch (e) {}
            return bad;
          };
          App.Core._verifyImageAnatomy._rewordPatched = true;
        }
      } catch (eVer2) {}
      // Anglais résiduel + question "couleur des yeux" déjà en fiche.
      // engRepair d'origine ne couvre que des mots isolés (et transforme
      // même "creating" en "creant" !) : "how le seed de Max a coated her
      // skin..." passe tel quel. Et le modèle demande parfois la couleur
      // des yeux de Max alors qu'elle est dans sa fiche. On étend engRepair
      // (mots + locutions + "creant" réparé + mots collés), et on remplace
      // la question par une phrase qui utilise la fiche (cache synchrone
      // rempli au passage par getSheet, car les réparations sont sync).
      try {
        if (App.Core && typeof App.Core.engRepair === 'function' && !App.Core.engRepair._engPlusPatched) {
          const __origEng = App.Core.engRepair.bind(App.Core);
          const __ENG_PHRASES = [
            [/a sticky, pearlescent glaze over her clitoris/gi, 'un voile collant et nacré sur son clitoris'],
            [/sticky, pearlescent glaze/gi, 'voile collant et nacré'],
            [/sticky glaze/gi, 'voile collant'],
            [/le surrounding folds de her vulve/gi, 'les replis environnants de sa vulve'],
            [/les surrounding folds/gi, 'les replis environnants'],
            [/surrounding folds/gi, 'replis environnants'],
            [/over her clitoris/gi, 'sur son clitoris'],
            [/excitement peaking/gi, "l'excitation à son comble"],
            [/her clitoris/gi, 'son clitoris'],
            [/her skin/gi, 'sa peau'],
            [/over her/gi, 'sur sa'],
            [/le seed de/gi, 'la semence de'],
            [/du seed/gi, 'de la semence'],
            [/her thighs framing/gi, 'ses cuisses encadrant'],
            [/le limp member/gi, 'le membre flasque'],
            [/limp member/gi, 'membre flasque'],
            [/her thighs/gi, 'ses cuisses'],
            [/her breasts/gi, 'ses seins'],
            [/her breast/gi, 'son sein'],
            [/her dominance/gi, 'sa domination']
          ];
          const __ENG_WORDS = [
            [/\bcreating\b/gi, 'créant'],
            [/\bcoated\b/gi, 'recouvert'],
            [/\bsticky\b/gi, 'collant'],
            [/\bpearlescent\b/gi, 'nacré'],
            [/\bglaze\b/gi, 'voile'],
            [/\bsurrounding\b/gi, 'environnant'],
            [/\bfolds\b/gi, 'replis'],
            [/\bover\b/gi, 'sur'],
            [/\bseed\b/gi, 'semence'],
            [/\bexcitement\b/gi, 'excitation'],
            [/\bpeaking\b/gi, 'à son comble'],
            [/\bhow\b/gi, 'comment'],
            [/\bher\b/gi, 'sa'],
            [/\bprecisely\b/gi, 'précisément'],
            [/\benhancing\b/gi, 'renforçant'],
            [/\benhancers\b/gi, 'renforce'],
            [/\benhances\b/gi, 'renforce'],
            [/\benhanced\b/gi, 'renforcé'],
            [/\benhance\b/gi, 'renforcer'],
            [/\bdominance\b/gi, 'domination'],
            [/\bthighs\b/gi, 'cuisses'],
            [/\bthigh\b/gi, 'cuisse'],
            [/\bframing\b/gi, 'encadrant'],
            [/\blimp\b/gi, 'flasque'],
            [/\bmember\b/gi, 'membre'],
            [/\bbreasts\b/gi, 'seins'],
            [/\bbreast\b/gi, 'sein'],
            [/\bagain\b/gi, 'de nouveau'],
            [/\btongue\b/gi, 'langue'],
            [/\blips\b/gi, 'lèvres'],
            [/\blip\b/gi, 'lèvre'],
            [/\bmouth\b/gi, 'bouche'],
            [/\bskin\b/gi, 'peau'],
            [/\bneck\b/gi, 'cou'],
            [/\bhands\b/gi, 'mains'],
            [/\bhand\b/gi, 'main'],
            [/\bfingers\b/gi, 'doigts'],
            [/\bfinger\b/gi, 'doigt'],
            [/\bmoaning\b/gi, 'en gémissant'],
            [/\bmoaned\b/gi, 'gémit'],
            [/\bmoans\b/gi, 'gémit'],
            [/\bmoan\b/gi, 'gémissement'],
            [/\bwhimpering\b/gi, 'gémissant'],
            [/\bwhimper\b/gi, 'plainte'],
            [/\bgasping\b/gi, 'haletant'],
            [/\bgasps\b/gi, 'halète'],
            [/\bgasp\b/gi, 'halètement'],
            [/\bpanting\b/gi, 'haletant'],
            [/\bpant\b/gi, 'halètement'],
            [/\bsweaty\b/gi, 'en sueur'],
            [/\bsweat\b/gi, 'sueur'],
            [/\bdripping\b/gi, 'ruisselant'],
            [/\bdrips\b/gi, 'goutte'],
            [/\bdrip\b/gi, 'goutte'],
            [/\btight\b/gi, 'serré'],
            [/\bwet\b/gi, 'mouillé'],
            [/\bthrusting\b/gi, 'en poussant'],
            [/\bthrusts\b/gi, 'pousse'],
            [/\bthrust\b/gi, 'poussée'],
            [/\btrembling\b/gi, 'tremblant'],
            [/\bshivering\b/gi, 'frissonnant'],
            [/\bshivers\b/gi, 'frissonne'],
            [/\bshiver\b/gi, 'frisson'],
            [/\bslowly\b/gi, 'lentement'],
            [/\bgently\b/gi, 'doucement'],
            [/\bdeeply\b/gi, 'profondément'],
            [/\broughly\b/gi, 'rudement'],
            [/\bharder\b/gi, 'plus fort'],
            [/\bfaster\b/gi, 'plus vite'],
            [/\bslower\b/gi, 'plus lentement'],
            [/\bdeeper\b/gi, 'plus profondément'],
            [/\bhelpless\b/gi, 'sans défense'],
            [/\bvulnerable\b/gi, 'vulnérable'],
            [/\bmercy\b/gi, 'pitié'],
            [/\bbegging\b/gi, 'suppliant'],
            [/\bbegs\b/gi, 'supplie'],
            [/\bbeg\b/gi, 'supplier'],
            [/\bobeys\b/gi, 'obéit'],
            [/\bobey\b/gi, 'obéir'],
            [/\bMistress\b/g, 'Maîtresse'],
            [/\bbetween\b/gi, 'entre'],
            [/\bagainst\b/gi, 'contre'],
            [/\bcollapsed\b/gi, 'effondré'],
            [/\bcollapses\b/gi, "s'effondre"]
          ];
          App.Core.engRepair = function (s) {
            let t = '';
            try { t = __origEng(s); } catch (e) { t = String(s == null ? '' : s); }
            try {
              t = String(t == null ? s : t);
              for (let pi = 0; pi < __ENG_PHRASES.length; pi++) t = t.replace(__ENG_PHRASES[pi][0], __ENG_PHRASES[pi][1]);
              // "creant" (sans accent) est fabriqué par l'original ci-dessus.
              t = t.replace(/\bcreant\b/gi, 'créant');
              for (let wi = 0; wi < __ENG_WORDS.length; wi++) t = t.replace(__ENG_WORDS[wi][0], __ENG_WORDS[wi][1]);
              // Après "créant", un "a" est forcément l'article anglais.
              t = t.replace(/(créant)\s+a\b/gi, '$1 un');
              // Mots collés par le streaming.
              t = t.replace(/plusma[iî]tre/gi, 'plus maître');
              // Question dont la réponse est déjà en fiche : ses yeux.
              try {
                const y = String((App && App.__moiYeux) || '').trim();
                const yOk = y && y.length >= 2 && y.length <= 40 && y.indexOf('?') === -1 && !/inconnu|ind[eé]fini|variable|[{}$/\\]/.test(y);
                if (yOk && !App.__gagged && /couleur de tes yeux|de quelle couleur sont tes yeux|tes yeux sont de quelle couleur/i.test(t)) {
                  const stmtTail = 'Je connais par cœur tes yeux ' + y + ", et j'adore sentir ce regard se poser sur moi.";
                  const keepSpk = (m, lead, spk) => lead + (spk || '') + stmtTail;
                  t = t.replace(/(^|[.!?…]["'”’»\s]*)([A-ZÀ-ÞĀ-Ž][A-Za-zÀ-ÿĀ-ž'’\-]{1,24}\s*:\s*(?:«\s*)?)?[^.!?…\n]*couleur de tes yeux[^.!?…\n]*[.?!…]+/gi, keepSpk);
                  t = t.replace(/(^|[.!?…]["'”’»\s]*)([A-ZÀ-ÞĀ-Ž][A-Za-zÀ-ÿĀ-ž'’\-]{1,24}\s*:\s*(?:«\s*)?)?[^.!?…\n]*je veux savoir[^.!?…\n]*regard[^.!?…\n]*[.?!…]+/gi, (m, lead) => (lead || ''));
                  t = t.replace(/[ \t]{2,}/g, ' ');
                }
              } catch (eY) {}
              // Contraintes : chaque acte exige sa liberation. Table generique :
              // fonction demandee + bloquee -> "Elle retire X pour liberer Y".
              // E-stim (spec fin) : materiel inactif + ordre -> rebrancher ;
              // montee narree -> reactions ; jauge -> climax ; coupe -> consequence.
              try {
                const __st2 = (App && App.__state) || null;
                const __bl2 = (__st2 && __st2.blocked) || [];
                if (__bl2.length) {
                  const __n = (x) => { try { return __cnorm(x); } catch (e) { return String(x || ''); } };
                  const __nt = __n(t);
                  const __narr3 = (se) => /^ *(elle|il|on|ils|elles)\b/.test(__n(se));
                  const __findSent = (pred) => {
                    try {
                      const re = /[^.!?…\n]+[.!?…]+/g;
                      let m;
                      while ((m = re.exec(t))) {
                        if (m[0].length >= 4 && pred(m[0])) return m.index;
                      }
                      const ld = Math.max(t.lastIndexOf('.'), t.lastIndexOf('!'), t.lastIndexOf('?'), t.lastIndexOf('…'), t.lastIndexOf('\n'));
                      const tail = t.slice(ld + 1);
                      if (tail.length >= 4 && pred(tail)) return ld + 1;
                    } catch (e) {}
                    return -1;
                  };
                  const __dwords = (d) => {
                    const out = [];
                    const pw = (x) => { for (const w of __n(x).split(/[^a-z]+/)) if (w.length >= 4 && out.indexOf(w) < 0) out.push(w); };
                    pw(d.label); pw(d.site || ''); for (const f of (d.free || [])) pw(f);
                    return out;
                  };
                  const __removed = (devId) => {
                    try {
                      const d = REG.DEVICES[devId];
                      const ws = __dwords(d).map(__escrx).join('|');
                      if (!ws) return false;
                      const rx = new RegExp('(retire|retirer|ote|enleve|libere|detache|ouvre|deverrouille)[^.]{0,60}(' + ws + ')|(' + ws + ')[^.]{0,40}(retire|ote|enleve|libere|detache)', 'i');
                      if (rx.test(__nt)) return true;
                    } catch (e) {}
                    return false;
                  };
                  const __need = [];
                  const __doneDev = {};
                  for (const b of __bl2) {
                    const fn = REG.FUNCS[b.func];
                    if (!fn || !fn.ask) continue;
                    if (b.statut === 'contournee') {
                      if (/envoie le courant|du courant|electro|estim/.test(__nt)) continue;
                      const cpred = (se) => {
                        if (__narr3(se)) return false;
                        const ns = __n(se);
                        if (!fn.ask.test(ns)) return false;
                        return true;
                      };
                      const cat = __findSent(cpred);
                      if (cat === -1) continue;
                      if (__doneDev['~' + b.func]) continue;
                      __doneDev['~' + b.func] = true;
                      const __cv = (b.via && b.via[0]) || (b.blockers[0] && b.blockers[0].device);
                      __need.push({ at: cat, s: __contourLine(__cv, b.func) });
                      continue;
                    }
                    if (b.func === 'ecarter_jambes' && b.blockers.every((x) => x.mode === 'force_extend')) continue;
                    // Materiel e-stim present mais inactif + ordre bypassable -> rebrancher.
                    try {
                      if (fn.bypass && fn.bypass.indexOf('stim') !== -1) {
                        const __G2 = (__st2.gender || 'M');
                        const __pcs = __circuits(__st2.worn, __G2, 99, false, {});
                        let __hw = null;
                        for (const __pc of __pcs) {
                          for (const __o of (__pc.organes || [])) {
                            if ((fn.o || []).indexOf(__o) !== -1) { __hw = __pc; break; }
                          }
                          if (__hw) break;
                        }
                        if (__hw) {
                          const rpred = (se) => {
                            if (__narr3(se)) return false;
                            const ns = __n(se);
                            if (!fn.ask.test(ns)) return false;
                            if (fn.can && fn.can.test(ns)) return false;
                            return true;
                          };
                          const rat = __findSent(rpred);
                          if (rat !== -1 && !(fn.q && t.indexOf('?', rat) === -1) && !__doneDev['~' + b.func]) {
                            __doneDev['~' + b.func] = true;
                            __need.push({ at: rat, s: __rebranchLine([__hw.a, __hw.c], b.func) });
                            continue;
                          }
                        }
                      }
                    } catch (eH) {}
                    const usable = b.blockers.filter((bk) => !__removed(bk.device));
                    if (!usable.length) continue;
                    const pred = (se) => {
                      if (__narr3(se)) return false;
                      const ns = __n(se);
                      if (!fn.ask.test(ns)) return false;
                      if (fn.can && fn.can.test(ns)) return false;
                      return true;
                    };
                    const at = __findSent(pred);
                    if (at === -1) continue;
                    if (fn.q && t.indexOf('?', at) === -1) continue;
                    const bk = usable[0];
                    if (__doneDev[bk.device]) continue;
                    __doneDev[bk.device] = true;
                    __need.push({ at: at, s: __releaseLine(bk.device, b.func, bk.side === 'BOTH' ? null : bk.side) });
                  }
                  if (__need.length) {
                    __need.sort((x, y) => x.at - y.at);
                    const at = __need[0].at;
                    const ins = __need.map((x) => x.s).join(' ');
                    let ls = at;
                    while (ls > 0 && t[ls - 1] !== '\n') ls--;
                    t = t.slice(0, ls) + ins + ' ' + t.slice(ls).replace(/^[ \t]+/, '');
                  }
                }
                // E-stim : montee, reactions, jauge, climax, coupe (spec fin).
                try {
                  const __stE = (App && App.__state) || null;
                  if (__stE && __stE.worn && __stE.worn.length) {
                    const __E = (REG && REG.ESTM) || {};
                    const __PLAF = (typeof __E.PLAFOND === 'number') ? __E.PLAFOND : 5;
                    const __DEC = (typeof __E.DECAY === 'number') ? __E.DECAY : 8;
                    const __GN = (typeof __E.GAIN_N === 'number') ? __E.GAIN_N : 0.3;
                    const __G = __stE.gender || 'M';
                    const __ntE = __cnorm(t);
                    let __cur = (__stE.intensite || 0), __cut = false;
                    try {
                      const __seE = __ntE.split(/(?<=[.!?…\n])/);
                      for (let __s0 of __seE) {
                        const __se = (__s0 || '').trim();
                        if (!__se) continue;
                        if (/(coupe|eteint) (le courant|l'electro|tout)/.test(__se)) { __cur = 0; __cut = true; continue; }
                        const __mA = /intensite[^.\d]{0,14}(\d)/.exec(__se);
                        if (__mA) { __cur = Math.max(0, Math.min(__PLAF, parseInt(__mA[1], 10) || 0)); continue; }
                        if (/monte l'intensite|augmente l'intensite|monte d'un cran|pousse l'intensite/.test(__se)) { __cur = Math.min(__PLAF, __cur + 1); continue; }
                        if (/baisse l'intensite|descend l'intensite|diminue l'intensite|baisse d'un cran/.test(__se)) { __cur = Math.max(0, __cur - 1); continue; }
                      }
                    } catch (eI) {}
                    const __rose = __cur > (__stE.intensite || 0);
                    const __int = __cur;
                    const __inv = !!__stE.inv, __dbr = (__stE.debranch || {});
                    const __ap = [];
                    const __exc0 = (() => { try { const __es = __estimGet(); return (typeof __es.exc === 'number') ? __es.exc : 0; } catch (e) { return 0; } })();
                    const __covAt = (ii) => {
                      const out = [];
                      try {
                        for (const __fid of Object.keys(REG.FUNCS)) {
                          const __fn = REG.FUNCS[__fid];
                          if (!__fn || !__fn.bypass || __fn.bypass.indexOf('stim') === -1) continue;
                          if (__fn.g && __fn.g !== __G) continue;
                          const __c = __circuitFor(__stE.worn, __G, ii, __inv, __dbr, __fn);
                          if (__c) out.push({ f: __fid, seuil: __c.seuil });
                        }
                      } catch (eC) {}
                      return out;
                    };
                    if (__cut) {
                      __ap.push(__couperLine(__exc0));
                      try { __estimSet(0, 'cut' + String(t.length)); } catch (eX) {}
                    } else {
                      try {
                        const __key = String(t.length) + '|' + __ntE.slice(0, 60);
                        const __last = (() => { try { return __estimGet().key || ''; } catch (e) { return ''; } })();
                        if (__key !== __last) {
                          let __exc = __exc0;
                          const __cov = __covAt(__int);
                          if (__int > 0 && __cov.length) __exc = Math.min(100, __exc + __int * (1 + __cov.length * __GN));
                          else __exc = Math.max(0, __exc - __DEC);
                          __estimSet(__exc, __key);
                          if (__exc >= 100) {
                            const __emF = __G === 'F' ? 'emission_F' : 'emission';
                            const __orF = __G === 'F' ? 'jouir_F' : 'orgasme';
                            let __sE = false, __sO = false;
                            try {
                              for (const bb of (__stE.blocked || [])) {
                                if (bb.func === __emF && bb.statut === 'bloquee') __sE = true;
                                if (bb.func === __orF && bb.statut === 'bloquee') __sO = true;
                              }
                            } catch (eB) {}
                            __ap.push(__climaxLine(__G, __sE, __sO));
                            try { __estimSet(0, __key); } catch (eX2) {}
                          }
                        }
                      } catch (eT) {}
                      if (__rose) {
                        try {
                          const __oldI = (__stE.intensite || 0);
                          const __hasReact = /(contract|crisp|cambr|halet|fremi|trembl|durci|coule|jailli|gicl|spasme|convuls|secou|vibr|bourdonn|tremble)/.test(__ntE);
                          const __curNarr = /envoie le courant|repond malgre/.test(__ntE);
                          let __any = false;
                          try { __any = __covAt(__int).length > 0; } catch (eA) {}
                          if (!__any && !__hasReact) {
                            __ap.push('Rien ne répond à ce niveau.');
                          } else if (__any && !__hasReact && !__curNarr) {
                            const __newC = [];
                            try {
                              for (const __cc of __covAt(__int)) {
                                const __fn = REG.FUNCS[__cc.f];
                                if (!__fn) continue;
                                if (__fn.ask && __fn.ask.test(__ntE)) continue;
                                const __cO = __circuitFor(__stE.worn, __G, __oldI, __inv, __dbr, __fn);
                                if (__cO) continue;
                                let __said = false;
                                try {
                                  for (const __w of String((__fn && __fn.obj) || '').toLowerCase().split(/[^a-zà-ÿ]+/)) {
                                    if (__w.length >= 6 && __ntE.indexOf(__w) !== -1) { __said = true; break; }
                                  }
                                } catch (eW) {}
                                if (__said) continue;
                                __newC.push(__cc);
                              }
                            } catch (eN) {}
                            __newC.sort((a, b) => a.seuil - b.seuil);
                            for (let __k = 0; __k < __newC.length && __k < 2; __k++) {
                              const __sl = __stimLine(__newC[__k].f, __int, __newC[__k].seuil);
                              if (__sl) __ap.push(__sl);
                            }
                          }
                        } catch (eS) {}
                      }
                    }
                    if (__ap.length) t = t.replace(/\s+$/, '') + ' ' + __ap.join(' ') + ' ';
                  }
                } catch (eE) {}
              } catch (eG) {}






              t = t.replace(/[ \t]+$/gm, '');
            } catch (e) {
              try { console.warn('[EngPlus] repair failed, fallback brut:', String((e && e.message) || e).slice(0, 160)); } catch (_) {}
              try { t = String(s == null ? '' : s); } catch (_) {}
            }
            return (t == null ? String(s == null ? '' : s) : t);
          };
          App.Core.engRepair._engPlusPatched = true;
        }
      } catch (eEngPlus) {}
      // Cache synchrone des yeux de "moi" : getSheet est async mais les
      // réparations de texte sont sync. On mémorise au passage (le prompt se
      // construit avant la génération, le cache est donc frais).
      try {
        if (App.Sheets && typeof App.Sheets.getSheet === 'function' && !App.Sheets.getSheet._yeuxCached) {
          const __origGet = App.Sheets.getSheet.bind(App.Sheets);
          App.Sheets.getSheet = async function () {
            const args = Array.prototype.slice.call(arguments);
            const r = await __origGet.apply(null, args);
            try {
              const id = String(args[0] || '').toLowerCase();
              if (id === 'moi' && r && typeof r === 'object') {
                const y = String(r.yeux || '').trim();
                if (y && y.length >= 2 && y.length <= 40 && y.indexOf('?') === -1 && !/inconnu|ind[eé]fini|variable|[{}$/\\]/.test(y)) App.__moiYeux = y;
                try { const gg = String(r.genre || r.sexe || ""); App.__moiGenre = /^f/i.test(gg) ? "F" : "M"; } catch (eG2) {}
              }
            } catch (e) {}
            return r;
          };
          App.Sheets.getSheet._yeuxCached = true;
        }
      } catch (eGetCache) {}
      // Détection "bouche prise" : l'entonnoir/le bâillon vit dans
      // l'historique, pas dans la fiche. On scanne le message courant + les
      // derniers messages (le plus récent tranche : mise puis retrait).
      // Moteur dispositif -> fonctions (registre src/contraintes-data.js).
      // Un dispositif bloque les fonctions dont cibles et modes se recouvrent
      // (spec : resolve). needs_sides:2 exige les deux cotes (null = les deux).
      // E-stim (spec fin) : le bypass ne joue qu'organe par organe le long d'un
      // trajet (paire de contacts). Poles dynamiques lus dans le recit.
      const __cnorm = (s) => {
        try { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim(); }
        catch (e) { return String(s == null ? '' : s).toLowerCase(); }
      };
      const __escrx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const __kwRx = (k) => {
        let n = __cnorm(k).replace(/s$/, '');
        return new RegExp('\\b' + __escrx(n) + 's?\\b');
      };
      // Detecteurs compiles une fois par dispositif.
      const __DEVX = {};
      try {
        for (const __id of Object.keys(REG.DEVICES)) {
          const __d = REG.DEVICES[__id];
          const __kws = (__d.kw || []).map(__kwRx);
          const __pat = __d.pat ? new RegExp(__d.pat, 'i') : null;
          const __words = [];
          const __pushW = (x) => { for (const w of __cnorm(x).split(/[^a-z]+/)) if (w.length >= 4 && __words.indexOf(w) < 0) __words.push(w); };
          __pushW(__d.label); __pushW(__d.site || ''); for (const f of (__d.free || [])) __pushW(f);
          const __wAlt = __words.map(__escrx).join('|') || 'xxxxxxxx';
          const __vb = 'retire|retirer|ote|oter|enleve|enlever|libere|liberer|detache|detacher|ouvre|ouvrir|deverrouille|dess serre';
          const __off = new RegExp('(' + __vb + ')[^.]{0,60}(' + __wAlt + ')|(' + __wAlt + ')[^.]{0,40}(retiree|enlevee|liberee|detachee|' + __vb + ')', 'i');
          __DEVX[__id] = { kws: __kws, pat: __pat, off: __off };
        }
      } catch (eDX) {}
      // Mots d'un dispositif (label + site), pour "debranche X / rebranche X".
      const __devWords = (d) => {
        const out = [];
        try {
          const pw = (x) => { for (const w of __cnorm(x).split(/[^a-z]+/)) if (w.length >= 4 && out.indexOf(w) < 0) out.push(w); };
          pw(d.label); pw(d.site || '');
        } catch (e) {}
        return out;
      };
      // Retraits generiques (sans nom de dispositif) : valent pour ces listes.
      const __BARE_OFFS = [
        { rx: /te (detache|libere|delivre)|(mains|poignets) liberes?/, devs: ['menottes','liens','fers','entrave','mitaines','gants','camisole','menottes_doigts','menottes_pouce','menottes_coude','armbinder','barre_ecartement','sangles_cuisses','ceinture_hanches','sleepsack'] },
        { rx: /bouche liberee/, devs: ['baille_boule','baille_anneau','baille_plein','ruban','museau','entonnoir'] },
        { rx: /tu peux (parler|repondre)/, devs: ['baille_boule','baille_anneau','baille_plein','ruban','museau','entonnoir'] },
        { rx: /tu peux (toucher|prendre|utiliser tes mains)/, devs: ['menottes','liens','mitaines','gants','camisole','armbinder','menottes_doigts','menottes_pouce'] },
        { rx: /tu peux (voir|regarder|ouvrir les yeux)/, devs: ['bandeau','cagoule','lentilles_op'] },
        { rx: /tu peux (marcher|venir|te lever|bouger)/, devs: ['fers','entrave','barre_ecartement','liens','sleepsack','camisole','menottes_genoux'] }
      ];
      const __sideOf = (sent) => {
        const l = /gauch/.test(sent), r = /droit/.test(sent);
        if (l && !r) return 'L';
        if (r && !l) return 'R';
        return null;
      };
      // Historique recent, le plus recent d'abord (message courant en tete).
      const __histMsgs = (session, text, n) => {
        const msgs = [];
        try {
          const all = (session && Array.isArray(session.messages)) ? session.messages : [];
          const max = n || 12;
          for (let i = all.length - 1; i >= 0 && msgs.length < max; i--) {
            const m = all[i];
            if (!m || typeof m.content !== 'string') continue;
            if (m.type && m.type !== 'text') continue;
            msgs.push(m.content);
          }
        } catch (e) {}
        try { if (typeof text === 'string' && text) msgs.unshift(text); } catch (e) {}
        return msgs;
      };
      // Etat porte : [{id, side}] — side null = les deux cotes. Le plus recent tranche.
      const __detectWorn = (session, text) => {
        try {
          const G = (App && App.__moiGenre) || 'M';
          const msgs = __histMsgs(session, text, 12);
          const normMsgs = msgs.map(__cnorm);
          const worn = [];
          const seen = {};
          for (const id of Object.keys(REG.DEVICES)) {
            const d = REG.DEVICES[id];
            if (d.g && d.g !== G) continue;
            const dx = __DEVX[id];
            if (!dx) continue;
            let decided = null;
            for (let mi = 0; mi < normMsgs.length && !decided; mi++) {
              const nm = normMsgs[mi];
              let bareOff = false;
              try {
                for (const bo of __BARE_OFFS) {
                  if (bo.devs.indexOf(id) !== -1 && bo.rx.test(nm)) { bareOff = true; break; }
                }
              } catch (e) {}
              if (bareOff) { decided = { off: true }; break; }
              const sents = nm.split(/(?<=[.!?…\n])/);
              for (let si = sents.length - 1; si >= 0; si--) {
                const se = sents[si];
                let offHit = false;
                try { offHit = dx.off.test(se); } catch (e) {}
                if (offHit) { decided = { off: true }; break; }
                let hit = null;
                try {
                  for (const rx of dx.kws) {
                    const m = rx.exec(se);
                    if (m) { hit = { index: m.index }; break; }
                  }
                  if (!hit && dx.pat) {
                    const m2 = dx.pat.exec(se);
                    if (m2) hit = { index: m2.index };
                  }
                } catch (e) {}
                if (hit) {
                  let near = false;
                  try {
                    const ctx = se.slice(Math.max(0, hit.index - 30), hit.index + 50);
                    for (const nw of (d.neg || [])) if (ctx.indexOf(__cnorm(nw)) !== -1) { near = true; break; }
                  } catch (e) { near = true; }
                  if (near) continue;
                  decided = { side: d.side ? (__sideOf(se) || null) : null };
                  break;
                }
              }
            }
            if (decided && !decided.off && !seen[id]) { seen[id] = true; worn.push({ id: id, side: decided.side }); }
          }
          return worn;
        } catch (e) { return []; }
      };
      // E-stim : intensite + poles debranches + polarite, lus dans le recit
      // (chronologique : le plus recent tranche). base0 = 1 si du contact porte.
      const __parseEstim = (seqOld, base0) => {
        const out = { intensite: (base0 || 0), debranch: {}, inv: false };
        try {
          const E = (REG && REG.ESTM) || {};
          const PLAF = (typeof E.PLAFOND === 'number') ? E.PLAFOND : 5;
          let inten = null;
          const debranch = {};
          let allOff = false, inv = false;
          for (const nm of (seqOld || [])) {
            if (!nm) continue;
            const sents = String(nm).split(/(?<=[.!?…\n])/);
            for (let s of sents) {
              s = (s || '').trim();
              if (!s) continue;
              const mAbs = /intensite[^.\d]{0,14}(\d)/.exec(s);
              if (mAbs) { inten = Math.max(0, Math.min(PLAF, parseInt(mAbs[1], 10) || 0)); continue; }
              if (/(coupe|eteint) (le courant|l'electro|tout)/.test(s)) { inten = 0; continue; }
              const base = (inten == null ? (base0 || 0) : inten);
              if (/monte l'intensite|augmente l'intensite|monte d'un cran|pousse l'intensite/.test(s)) { inten = Math.min(PLAF, base + 1); continue; }
              if (/baisse l'intensite|descend l'intensite|diminue l'intensite|baisse d'un cran/.test(s)) { inten = Math.max(0, base - 1); continue; }
              if (/debranche/.test(s)) {
                if (/poles|tout|electrodes|le courant/.test(s)) { allOff = true; continue; }
                for (const id of Object.keys(REG.DEVICES)) {
                  const dd = REG.DEVICES[id];
                  if (!dd || !dd.c) continue;
                  for (const w of __devWords(dd)) {
                    if (s.indexOf(w) !== -1) { debranch[id] = true; break; }
                  }
                }
                continue;
              }
              if (/rebranche/.test(s)) {
                if (/poles|tout|electrodes|le courant/.test(s)) { allOff = false; for (const k of Object.keys(debranch)) delete debranch[k]; continue; }
                for (const id of Object.keys(REG.DEVICES)) {
                  const dd = REG.DEVICES[id];
                  if (!dd || !dd.c) continue;
                  for (const w of __devWords(dd)) {
                    if (s.indexOf(w) !== -1) { delete debranch[id]; break; }
                  }
                }
                continue;
              }
              if (/inverse les poles|poles inverses/.test(s)) { inv = true; continue; }
              if (/remet les poles|poles normaux|poles d'origine/.test(s)) { inv = false; continue; }
            }
          }
          out.intensite = (inten == null ? (base0 || 0) : inten);
          out.debranch = debranch;
          if (allOff) out.debranch['*'] = true;
          out.inv = inv;
        } catch (e) {}
        return out;
      };
      // Cle de trajet : paire de contacts triee.
      const __trajetKey = (a, b) => [a, b].sort().join('|');
      // Circuits entre paires de contacts portes (spec fin : circuits()).
      // inten = intensite, inv = polarite inversee (+seuil), debranch = poles coupes.
      const __circuits = (worn, G, inten, inv, debranch) => {
        const out = [];
        try {
          const T = (REG && REG.TRAJETS) || {};
          const E = (REG && REG.ESTM) || {};
          const pinv = (E.SEUIL_POL_INV == null) ? 1 : E.SEUIL_POL_INV;
          const ids = [];
          for (const w of (worn || [])) {
            const d = REG.DEVICES[w.id];
            if (!d || !d.c) continue;
            if (d.g && d.g !== G) continue;
            if (debranch && (debranch['*'] || debranch[w.id])) continue;
            ids.push(w.id);
          }
          for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
            const a = REG.DEVICES[ids[i]], c = REG.DEVICES[ids[j]];
            if (!a || !c || !a.c || !c.c) continue;
            const key = __trajetKey(a.c, c.c);
            const t = T[key];
            if (!t) continue;
            const seuil = t.s + (inv ? pinv : 0);
            out.push({ a: ids[i], c: ids[j], trajet: t.id, seuil: seuil, organes: t.o, actif: (inten || 0) >= seuil });
          }
        } catch (e) {}
        return out;
      };
      // Meilleur circuit actif couvrant la fonction (seuil le plus bas).
      const __circuitFor = (worn, G, inten, inv, debranch, fn) => {
        let best = null;
        try {
          for (const c of __circuits(worn, G, inten, inv, debranch)) {
            if (!c.actif) continue;
            let hit = false;
            for (const o of (c.organes || [])) if ((fn.o || []).indexOf(o) !== -1) { hit = true; break; }
            if (!hit) continue;
            if (!best || c.seuil < best.seuil) best = c;
          }
        } catch (e) {}
        return best;
      };
      // Fonctions bloquees : [{func, blockers, statut, via, trajet, seuil}].
      // statut : bloquee | contournee (bloquee mais circuit) | stimulee (circuit seul).
      const __resolveBlocked = (worn, gender, estim) => {
        const res = [];
        try {
          const G = gender || 'M';
          const inten = (estim && estim.intensite) || 0;
          const inv = !!(estim && estim.inv);
          const debranch = (estim && estim.debranch) || {};
          for (const fid of Object.keys(REG.FUNCS)) {
            const fn = REG.FUNCS[fid];
            if (fn.g && fn.g !== G) continue;
            const blockers = [];
            for (const w of worn) {
              const d = REG.DEVICES[w.id];
              if (!d) continue;
              if (d.g && d.g !== G) continue;
              let hit = false;
              for (const t of (d.t || [])) if (fn.o.indexOf(t) !== -1) { hit = true; break; }
              if (!hit) continue;
              let mode = null;
              for (const m of (d.m || [])) if (fn.m.indexOf(m) !== -1) { mode = m; break; }
              if (!mode) continue;
              blockers.push({ device: w.id, mode: mode, side: d.side ? (w.side || 'BOTH') : null });
            }
            const circ = (fn.bypass && fn.bypass.indexOf('stim') !== -1)
              ? __circuitFor(worn, G, inten, inv, debranch, fn) : null;
            if (!blockers.length) {
              if (circ) res.push({ func: fid, blockers: [], statut: 'stimulee', via: [circ.a, circ.c], trajet: circ.trajet, seuil: circ.seuil });
              continue;
            }
            if (fn.ns === 2) {
              const sides = new Set();
              for (const b of blockers) {
                if (!b.side || b.side === 'BOTH') { sides.add('L'); sides.add('R'); }
                else sides.add(b.side);
              }
              if (sides.size < 2) continue;
            }
            if (circ) res.push({ func: fid, blockers: blockers, statut: 'contournee', via: [circ.a, circ.c], trajet: circ.trajet, seuil: circ.seuil });
            else res.push({ func: fid, blockers: blockers, statut: 'bloquee', via: [] });
          }
        } catch (e) {}
        return res;
      };
      const __artOf = (d) => d.art + (String(d.art).slice(-1) === "'" ? '' : ' ');
      const __cote = (s) => s === 'L' ? ' gauche' : s === 'R' ? ' droit' : '';
      const __releaseLine = (devId, funcId, side) => {
        try {
          const d = REG.DEVICES[devId], fn = REG.FUNCS[funcId];
          return 'Elle retire ' + __artOf(d) + d.label + __cote(side) + ' ' + (fn.tail || ('pour libérer ' + fn.obj)) + '.';
        } catch (e) { return ''; }
      };
      const __contourLine = (devId, funcId) => {
        try {
          const d = REG.DEVICES[devId], fn = REG.FUNCS[funcId];
          return 'Elle envoie le courant : ' + fn.obj + ' répond malgré ' + __artOf(d) + d.label + '.';
        } catch (e) { return ''; }
      };
      // Gradation spec (monter) : 0 cran au-dessus du seuil -> commence, 1-2 -> se met, 3+ -> n'arrete plus.
      const __gradOf = (inten, seuil) => {
        const d = (inten || 0) - (seuil || 1);
        return d <= 0 ? 'commence à' : d >= 3 ? 'n\u2019arrête plus de' : 'se met à';
      };
      // Ligne de reaction e-stim (spec fin : stimLine).
      const __stimLine = (funcId, inten, seuil) => {
        try {
          const fn = REG.FUNCS[funcId];
          return 'Elle monte l\u2019intensité : ' + fn.obj + ' ' + __gradOf(inten, seuil) + ' ' + (fn.v || 'réagir') + '.';
        } catch (e) { return ''; }
      };
      // Materiel present mais inactif (intensite 0 / debranche) + ordre -> rebrancher, pas retirer.
      const __rebranchLine = (viaIds, funcId) => {
        try {
          const fn = REG.FUNCS[funcId];
          const labs = [];
          for (const vid of (viaIds || [])) {
            const vd = REG.DEVICES[vid];
            if (vd) { const lb = __artOf(vd) + vd.label; if (labs.indexOf(lb) < 0) labs.push(lb); }
          }
          return 'Elle rebranche l\u2019électro et envoie le courant : ' + fn.obj + ' répond malgré ' + (labs.join(' + ') || 'tes liens') + '.';
        } catch (e) { return ''; }
      };
      // Climax en 4 issues (spec fin) : emission/orgasme mecaniquement bloques ou non.
      const __climaxLine = (gender, sansEm, sansOr) => {
        const F = (gender === 'F');
        if (!sansEm && !sansOr) return F ? 'Elle maintient : tu jouis, la fontaine et le plaisir d\u2019un seul coup.' : 'Elle maintient : tu jouis, l\u2019émission et le plaisir d\u2019un seul coup.';
        if (!sansEm && sansOr) return F ? 'Elle maintient : tu gicles sans rien ressentir, l\u2019émission part seule.' : 'Elle maintient : tu éjacules sans rien ressentir, l\u2019émission part seule.';
        if (sansEm && !sansOr) return 'Elle maintient : l\u2019orgasme te submerge sans une goutte.';
        return 'Elle maintient : tout est verrouillé, le plaisir reflue.';
      };
      // Coupe manuelle (spec fin : couper) : consequence selon la jauge.
      const __couperLine = (exc) => {
        try {
          const E = (REG && REG.ESTM) || {};
          const RUIN = (E.RUIN == null) ? 80 : E.RUIN;
          const DEN = (E.DENIAL == null) ? 55 : E.DENIAL;
          if ((exc || 0) >= RUIN) return 'Elle coupe au bord : émission ruinée, le plaisir retombe sans se vider.';
          if ((exc || 0) >= DEN) return 'Elle coupe : denial, tu redescends frustré.';
          return 'Elle coupe le courant, tu retombes au calme.';
        } catch (e) { return 'Elle coupe le courant.'; }
      };
      // Jauge d'excitation e-stim : closure locale (jamais sur App : le chemin
      // de reparation ne doit rien ecrire sur l'objet applicatif reactif).
      let __estimStore = { exc: 0, key: '' };
      const __estimGet = () => __estimStore;
      const __estimSet = (exc, key) => { __estimStore = { exc: exc, key: key }; };
      // Compat : bouche prise + drapeaux historiques, desormais derives de l'etat.
      const __detectGag = (session, text) => {
        try {
          const gender = (App && App.__moiGenre) || 'M';
          const worn = __detectWorn(session, text);
          let base0 = 0;
          try { base0 = worn.some((w) => REG.DEVICES[w.id] && REG.DEVICES[w.id].c) ? 1 : 0; } catch (e) {}
          const seq = __histMsgs(session, text, 12).slice().reverse().map(__cnorm);
          const estim = __parseEstim(seq, base0);
          const blocked = __resolveBlocked(worn, gender, estim);
          const isB = (f) => blocked.some((b) => b.func === f);
          const firstDev = (fs) => {
            for (const f of fs) {
              const b = blocked.find((x) => x.func === f);
              if (b && b.blockers.length) return b.blockers[0];
            }
            return null;
          };
          const wordOf = (b) => {
            if (!b) return '';
            const d = REG.DEVICES[b.device];
            return __artOf(d) + d.label + (b.side && b.side !== 'BOTH' ? __cote(b.side) : '');
          };
          const gb = (fs) => { const b = firstDev(fs); return b ? { on: true, word: wordOf(b) } : { on: false, word: '' }; };
          const st = {
            worn: worn, blocked: blocked, gender: gender,
            intensite: estim.intensite, debranch: estim.debranch, inv: estim.inv,
            mouth: gb(['parler']), hands: gb(['toucher','saisir']), eyes: gb(['voir']),
            legs: gb(['marcher','se_lever']), cock: gb(['uriner','emission','orgasme','erection']),
            anus: gb(['defequer','gaz']), nose: gb(['sentir','respirer_nez']), ear: gb(['entendre'])
          };
          st.body = st.legs;
          try {
            App.__state = st;
            App.__blocks = { mouth: st.mouth, hands: st.hands, eyes: st.eyes, legs: st.legs, body: st.body, cock: st.cock, anus: st.anus, nose: st.nose, ear: st.ear };
          } catch (e) {}
          return st.mouth;
        } catch (e) { return { on: false, word: '' }; }
      };
      // Validation du registre au boot (spec : attrape organes/modes orphelins).
      try {
        const __errs = [];
        const __O = new Set(REG.ORGANS), __M = new Set(REG.MODES);
        for (const __fid of Object.keys(REG.FUNCS)) {
          const __fn = REG.FUNCS[__fid];
          for (const o of (__fn.o || [])) if (!__O.has(o)) __errs.push('FUNC ' + __fid + ' organe inconnu ' + o);
          for (const m of (__fn.m || [])) if (!__M.has(m)) __errs.push('FUNC ' + __fid + ' mode inconnu ' + m);
          if (__fn.bypass && __fn.bypass.indexOf('stim') !== -1 && !__fn.v) __errs.push('FUNC ' + __fid + ' bypass stim sans verbe');
        }
        for (const __id of Object.keys(REG.DEVICES)) {
          const __dd = REG.DEVICES[__id];
          for (const t of (__dd.t || [])) if (!__O.has(t)) __errs.push('DEV ' + __id + ' cible inconnue ' + t);
          for (const m of (__dd.m || [])) if (!__M.has(m)) __errs.push('DEV ' + __id + ' mode inconnu ' + m);
          if (__dd.c && !__O.has(__dd.c)) __errs.push('DEV ' + __id + ' contact inconnu ' + __dd.c);
          if (!(__dd.kw || []).length && !__dd.pat) __errs.push('DEV ' + __id + ' inatteignable');
        }
        const __T = (REG && REG.TRAJETS) || {};
        for (const __k of Object.keys(__T)) {
          const __te = __T[__k];
          const __ps = String(__k).split('|');
          if (__ps.length !== 2 || __trajetKey(__ps[0], __ps[1]) !== __k) __errs.push('TRAJET cle non triee ' + __k);
          for (const o of (__te.o || [])) if (!__O.has(o)) __errs.push('TRAJET ' + __k + ' organe inconnu ' + o);
          if (!(typeof __te.s === 'number' && __te.s >= 1 && __te.s <= 5)) __errs.push('TRAJET ' + __k + ' seuil hors 1-5');
        }
        if (!REG.ESTM) __errs.push('ESTM manquant');
        if (__errs.length) { try { console.warn('[Contraintes] registre: ' + __errs.slice(0, 8).join(' | ')); } catch (e) {} }
      } catch (eV) {}

      // Fiches tenues a jour : le chemin "leger" (chaque reponse) tronque le
      // bloc Sheets a 2500 signes, et la regle [MISE A JOUR] (derniere de
      // promptBlock, apres les donnees fiches) est coupee -> le modele ne
      // sait plus qu'il doit finir chaque reponse par la ligne JSON
      // [FICHE_STATE]{...} et Action reste a "?". On remonte les deux
      // derniers paragraphes (REGLES D'ETAT + [MISE A JOUR]) en TETE du
      // bloc : ils survivent a la troncature, les donnees suivent.
      try {
        if (App.Sheets && typeof App.Sheets.promptBlock === 'function' && !App.Sheets.promptBlock._frontPatched) {
          const __origPB = App.Sheets.promptBlock.bind(App.Sheets);
          App.Sheets.promptBlock = async function (session, text) {
            let s = '';
            try { s = await __origPB(session, text); } catch (e) { return ''; }
            let gag = null;
            try { gag = __detectGag(session, text); } catch (e) {}
            try {
              if (gag && gag.on) { App.__gagged = true; App.__gagWord = gag.word; }
              else { App.__gagged = false; App.__gagWord = ''; }
              try {
                const __bb = App.__blocks || {};
                App.__handsBound = !!(__bb.hands && __bb.hands.on);
                App.__eyesCovered = !!(__bb.eyes && __bb.eyes.on);
                App.__legsBound = !!(__bb.legs && __bb.legs.on);
                App.__bodyTied = !!(__bb.body && __bb.body.on);
                App.__cockCaged = !!(__bb.cock && __bb.cock.on);
                App.__anusPlugged = !!(__bb.anus && __bb.anus.on);
                App.__nosePlugged = !!(__bb.nose && __bb.nose.on);
              } catch (e2) {}
            } catch (e) {}
            try {
              s = String(s || '');
              if (s && s.length > 2500) {
                const key = "RÈGLES D'ÉTAT";
                const k = s.indexOf(key);
                if (k > 200 && k > s.length - 2000) {
                  const tail = s.slice(k).trim();
                  if (tail.indexOf('[MISE À JOUR]') !== -1 && tail.indexOf('[FICHE_STATE]') !== -1) {
                    const head = s.slice(0, k).replace(/\s+$/, '');
                    if (head.length > 500) s = tail + '\n' + head;
                  }
                }
              }
            } catch (e) {}
            // Contraintes : regle en TETE, derivee de l'etat (dispositif -> fonctions).
            // Logique : jamais demander/attendre un acte impossible ; D'ABORD
            // retirer/liberer (narre dans la reponse meme), puis demander.
            try {
              const __st = (App && App.__state) || null;
              const __bl = (__st && __st.blocked) || [];
              const __clauses = [];
              for (const b of __bl) {
                if (b.func === 'ecarter_jambes' && b.blockers.length && b.blockers.every((x) => x.mode === 'force_extend')) continue;
                const fn = REG.FUNCS[b.func];
                if (!fn) continue;
                if (b.statut === 'contournee') {
                  const vls = [];
                  for (const vid of (b.via || [])) { const vd = REG.DEVICES[vid]; if (vd && vls.indexOf(vd.label) < 0) vls.push(__artOf(vd) + vd.label); }
                  if (__clauses.length < 8) __clauses.push('He CAN ' + fn.en + ' anyway (e-stim via ' + (vls.join(' + ') || 'electrodes') + ').');
                  continue;
                }
                if (b.statut === 'stimulee') {
                  if (__clauses.length < 8) __clauses.push('E-stim CAN trigger ' + fn.en + ' (via ' + (b.trajet || 'circuit') + ').');
                  continue;
                }
                const labs = [];
                for (const bk of b.blockers) {
                  const d = REG.DEVICES[bk.device];
                  if (!d) continue;
                  let lb = __artOf(d) + d.label;
                  if (bk.side === 'L' || bk.side === 'R') lb += __cote(bk.side) + ' (un seul cote)';
                  if (labs.indexOf(lb) < 0) labs.push(lb);
                }
                if (labs.length && __clauses.length < 8) __clauses.push('He CANNOT ' + fn.en + ' (' + labs.join(' + ') + ').');
              }
              if (__clauses.length) {
                s = '[PHYSICAL CONSTRAINTS - LOGIC, REMOVE BEFORE ASKING] ' + __clauses.join(' ') + ' If you want him to do something his restraints make impossible, FIRST remove/free it in this very reply - narrate it clearly (you remove it) - and only THEN ask. Never ask for, or wait for, an act he cannot do while still restrained. Once he has obeyed (in a later turn), you may restrain him again whenever you like.\n' + String(s || '');
              }
            } catch (e) {}

            return s;
          };
          App.Sheets.promptBlock._frontPatched = true;
        }
      } catch (ePB) {}
      // §16 — Parametres : versions visibles, patchs par NUMERO.
      // Demande utilisateur (precisee ensuite) : dans les reglages, les
      // PATCHS n'affichent ni noms ni contenu (noms + buts, diffs, code
      // source...) : chaque entree n'affiche qu'un numero. En revanche la
      // VERSION des mises a jour reste visible et continue d'augmenter a
      // chaque modification, comme avant : journal -> "Ronde 772" (sans la
      // description entre parentheses), statuts -> "v772 · Ronde 772"
      // (parentheses retirees). Les modules d'affichage sont chiffres sur le disque, on retouche donc le
      // DOM APRES leur rendu (balayage + MutationObserver). Les controles
      // restent intacts (cases, boutons) ; seuls noms et contenus sont
      // retires. Les compteurs ("3 installes", "v772", "2/50") sont des
      // nombres : on les garde.
      try {
        let __pnOff = false;
        try { __pnOff = !!window.__PN_OFF || localStorage.getItem('sofia_numoff_v1') === '1'; } catch (e) {}
        if (!__pnOff && !App.__paramsNumPatched) {
          App.__paramsNumPatched = true;
          const __PN = { suffix: '', lastFetch: 0, busy: false };
          // Textes "vide" (5 langues) : on ne les numerote jamais.
          const __PN_EMPTY = [
            'Nothing yet.', 'Noch nichts.', 'Nada todavía.',
            'Rien pour l’instant.', 'Ancora nulla.',
            'No patch installed yet', 'Noch kein Patch installiert',
            'Aún no hay ningún parche instalado',
            'Aucun patch installé pour l’instant',
            'Nessuna patch installata per ora',
            'No patch yet.', 'Noch kein Patch.',
            'Todavía no hay parche.',
            'Aucun correctif pour le moment.', 'Ancora nessuna patch.'
          ];
          const __pnFlat = (s) => {
            try {
              s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
              return s.length > 90 ? s.slice(0, 89) + '…' : s;
            } catch (e) { return ''; }
          };
          // La note ("Ronde 772 (...)") vient de src/build.json, lue comme
          // l'app le fait. Une fois connue, on balaye les textes.
          const __pnNote = () => {
            try {
              if (__PN.suffix) return;
              if (__PN.lastFetch && Date.now() - __PN.lastFetch < 30000) return;
              __PN.lastFetch = Date.now();
              fetch('./src/build.json?v=' + Date.now(), { cache: 'no-store' }).then((r) => {
                if (!r || !r.ok) return null;
                return r.json();
              }).then((j) => {
                try {
                  const n = __pnFlat(j && j.note);
                  if (n) {
                    __PN.suffix = ' · ' + n;
                    // La version reste visible ("Ronde 772"), seule la
                    // description entre parentheses est retiree.
                    let h = n;
                    try { const ci = n.indexOf(' ('); if (ci > 0) h = n.slice(0, ci).trim(); } catch (e) {}
                    __PN.keep = ' · ' + h;
                    __pnStripTexts();
                  }
                } catch (e) {}
              }).catch(() => {});
            } catch (e) {}
          };
          // #updateStatus + #updateMeta : garde versions / dates / compteurs
          // (des nombres, pas des noms), retire seulement la description
          // entre parentheses (" · Ronde 772 (...)..." -> " · Ronde 772").
          const __pnStripTexts = () => {
            try {
              if (!__PN.suffix) return;
              const ids = ['updateStatus', 'updateMeta'];
              for (let k = 0; k < ids.length; k++) {
                const el = document.getElementById(ids[k]);
                if (!el) continue;
                const t = el.textContent;
                if (t && t.indexOf(__PN.suffix) >= 0) el.textContent = t.split(__PN.suffix).join(__PN.keep || '');
              }
            } catch (e) {}
          };
          // Version d'une ligne du journal ("Ronde 771 (...) ..." ->
          // "Ronde 771"). Tolerant : Ronde NNN, vNNN ou version NNN.
          const __pnVersion = (t) => {
            try {
              const m = String(t == null ? '' : t).match(/Ronde\s+\d+|v\s*\d+|version\s+\d+/i);
              if (m) return m[0].replace(/\s+/g, ' ').trim();
            } catch (e) {}
            return null;
          };
          // Une ligne de patch (vues correctifs / atelier) -> numero.
          // head : [point?, nom, (chemin), etat] ; on numerote le premier
          // span non vide qui n'est pas le chemin ("· ..."), on retire le
          // chemin, puis toutes les sous-lignes sauf celles qui portent un
          // controle (boutons activer/retirer, cases).
          const __pnRow = (row, n) => {
            try {
              const head = row ? row.firstElementChild : null;
              if (!head || head.tagName !== 'DIV') return false;
              const spans = head.getElementsByTagName('span');
              let name = null;
              for (let i = 0; i < spans.length; i++) {
                const t = spans[i].textContent;
                if (t && t.trim() && t.trim().charAt(0) !== '·') { name = spans[i]; break; }
              }
              if (!name) return false;
              const w = String(n);
              if (name.textContent !== w) name.textContent = w;
              for (let i = spans.length - 1; i >= 0; i--) {
                try {
                  if (spans[i] !== name && /^\s*·/.test(spans[i].textContent)) spans[i].remove();
                } catch (e) {}
              }
              const kids = row.children;
              for (let i = kids.length - 1; i >= 1; i--) {
                const c = kids[i];
                try {
                  if (c.querySelector && (c.querySelector('button') || c.querySelector('input'))) continue;
                  c.remove();
                } catch (e) {}
              }
              return true;
            } catch (e) { return false; }
          };
          const __pnRows = (box, complex, keepVer) => {
            try {
              if (!box) return;
              let n = 0;
              const kids = box.children;
              for (let i = 0; i < kids.length; i++) {
                const k = kids[i];
                try {
                  if (__PN_EMPTY.indexOf(k.textContent) >= 0) continue;
                  if (!complex) {
                    if (k.querySelector && (k.querySelector('input') || k.querySelector('button'))) continue;
                    n++;
                    // Journal des mises a jour : la version reste visible
                    // ("Ronde 772") et augmente a chaque modification, comme
                    // avant. Les journaux de patchs restent numerotes.
                    let w = String(n);
                    if (keepVer) { try { const v = __pnVersion(k.textContent); if (v) w = v; } catch (e) {} }
                    if (k.textContent !== w) k.textContent = w;
                    continue;
                  }
                  if (__pnRow(k, n + 1)) n++;
                } catch (e) {}
              }
            } catch (e) {}
          };
          const __pnApply = () => {
            try {
              __pnNote();
              __pnRows(document.getElementById('updateLog'), false, true);
              __pnRows(document.getElementById('selfCodeLog'), false);
              __pnRows(document.getElementById('atelierLog'), false);
              __pnRows(document.getElementById('selfCodeView'), true);
              __pnRows(document.getElementById('atelierView'), true);
              __pnRows(document.getElementById('atelierStageView'), true);
              __pnStripTexts();
            } catch (e) {}
          };
          try {
            const __pnMo = new MutationObserver(() => {
              if (__PN.busy) return;
              __PN.busy = true;
              try { __pnApply(); } catch (e) {}
              __PN.busy = false;
            });
            const __pnIds = ['updateLog', 'updateStatus', 'updateMeta', 'selfCodeLog', 'selfCodeView', 'atelierLog', 'atelierView', 'atelierStageView'];
            for (let i = 0; i < __pnIds.length; i++) {
              try {
                const el = document.getElementById(__pnIds[i]);
                if (el) __pnMo.observe(el, { childList: true });
              } catch (e) {}
            }
          } catch (e) {}
          try { __pnApply(); } catch (e) {}
          try { const __pnDbgFn = function () { return { suffix: __PN.suffix, keep: __PN.keep }; }; window.__paramsNumDbg = __pnDbgFn; App.__paramsNumDbg = __pnDbgFn; } catch (e) {}
        }
      } catch (ePN) {}
      // §17 — Mode maintenance : gele les auto-modifications.
      // Demande utilisateur : quand ce mode est ACTIF, l'app ne peut plus
      // modifier son propre code, quel que soit le declencheur : observes
      // automatiques (SelfScript.observe, SelfCode.observeUser/endTurn),
      // marqueurs [SOFIA_*] du modele (handleMarkers), install / selfEdit,
      // reecritures manuelles (rewriteNow, writeFromUI), verifications et
      // mises a jour (SelfUpdate.check/restart/resume). Les lectures et
      // diagnostics restent intacts (verify, viewFile, block, applyPrompt,
      // shapeReply, syncUI, localize...). Chaque enveloppe lit le flag A
      // L'APPEL, donc on()/off() prend effet sans recharger.
      // Le flag est LOCAL au navigateur comme les patches eux-memes :
      // localStorage 'sofia_maint_v1' = '1'. Sur un autre ordi, l'app garde
      // son comportement tant qu'on ne l'y active pas aussi.
      // API : window.__maintFreeze.on() / .off() / .toggle() / .isOn() /
      // .status() (+ .rescan()), + petit bouton flottant en bas a droite.
      // L'API vit sur window (objet ordinaire) et PAS sur App : l'app
      // materialise/remplace ses propres cles (App.__maint existe deja comme
      // fonction, et un objet pose sur App y est shadowé au re-rendu).
      // Garde d'installation en scope module + window (pas de lecture App).
      try {
        let __mtSkip = false;
        try { __mtSkip = !!window.__MAINT_OFF || !!window.__sofiaMaintFZ; } catch (e) {}
        if (!__mtSkip) {
          try { window.__sofiaMaintFZ = true; } catch (e) {}
          const __MT = { key: 'sofia_maint_v1', counts: {}, seen: {}, timer: null, btn: null };
          const __mtOn = () => {
            try {
              if (window.__SOFIA_MAINT === false) return false;
              if (window.__SOFIA_MAINT === true) return true;
            } catch (e) {}
            try { return localStorage.getItem(__MT.key) === '1'; } catch (e) { return false; }
          };
          const __mtPaintBtn = () => {
            try {
              const b = (typeof document === 'undefined') ? null : (document.getElementById('sofiaMaintBtn') || null);
              if (!b) return;
              __MT.btn = b;
              const on = __mtOn();
              b.textContent = 'Maintenance : ' + (on ? 'ON' : 'OFF');
              try { b.style.borderColor = on ? '#f59e0b' : '#52525b'; b.style.color = on ? '#fde68a' : '#e4e4e7'; } catch (e) {}
            } catch (e) {}
          };
          const __mtSet = (on) => {
            try { localStorage.setItem(__MT.key, on ? '1' : '0'); } catch (e) {}
            try { console.info('[Maintenance] ' + (on ? 'ON : auto-modifs gelees (ce navigateur)' : 'OFF : comportement normal')); } catch (e) {}
            try { __mtPaintBtn(); } catch (e) {}
          };
          const __mtCount = (k) => {
            try {
              __MT.counts[k] = (__MT.counts[k] || 0) + 1;
              if (!__MT.seen[k]) { __MT.seen[k] = true; try { console.info('[Maintenance] gelee : ' + k + ' (appel ignore)'); } catch (e) {} }
            } catch (e) {}
          };
          const __mtRepl = (kind, args) => {
            if (kind === 'identity') return args[0];
            if (kind === 'noop') return undefined;
            if (kind === 'asyncFalse') { try { return Promise.resolve(false); } catch (e) { return false; } }
            return false;
          };
          const __mtWrap = (modName, meth, kind) => {
            try {
              const mod = App[modName];
              if (!mod || typeof mod[meth] !== 'function') return false;
              if (mod[meth]._maintWrapped) return true;
              const orig = mod[meth];
              const tag = modName + '.' + meth;
              const fn = function () {
                const a = Array.prototype.slice.call(arguments);
                if (!__mtOn()) return orig.apply(this, a);
                __mtCount(tag);
                return __mtRepl(kind, a);
              };
              try { fn._maintWrapped = true; } catch (e) {}
              mod[meth] = fn;
              return true;
            } catch (e) { return false; }
          };
          const __MT_JOBS = [
            ['SelfScript', 'observe', 'noop'],
            ['SelfScript', 'handleMarkers', 'identity'],
            ['SelfScript', 'rewriteNow', 'false'],
            ['SelfCode', 'observeUser', 'noop'],
            ['SelfCode', 'endTurn', 'noop'],
            ['SelfCode', 'install', 'false'],
            ['Atelier', 'handleMarkers', 'identity'],
            ['Atelier', 'selfEdit', 'false'],
            ['Atelier', 'writeFromUI', 'false'],
            ['SelfUpdate', 'check', 'asyncFalse'],
            ['SelfUpdate', 'restart', 'asyncFalse'],
            ['SelfUpdate', 'resume', 'asyncFalse']
          ];
          const __mtRescan = () => {
            try { for (let i = 0; i < __MT_JOBS.length; i++) __mtWrap(__MT_JOBS[i][0], __MT_JOBS[i][1], __MT_JOBS[i][2]); } catch (e) {}
            // Re-essaie aussi le bouton : au boot, body n'existe pas encore
            // quand ce module s'attache (bouton absent en live sans cela).
            try { __mtMkBtn(); } catch (e) {}
          };
          const __mtMkBtn = () => {
            try {
              if (typeof document === 'undefined' || !document.body) return;
              if (!document.getElementById('sofiaMaintBtn')) {
                const b = document.createElement('button');
                b.id = 'sofiaMaintBtn';
                b.type = 'button';
                b.title = 'Gele les auto-modifications (correctifs, atelier, mises a jour). Persiste dans ce navigateur.';
                try { b.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483647;font-size:11px;font-weight:600;padding:6px 10px;border-radius:8px;border:1px solid #52525b;background:#27272a;color:#e4e4e7;opacity:0.85;cursor:pointer;'; } catch (e) {}
                b.addEventListener('click', () => { try { window.__maintFreeze.toggle(); } catch (e) {} });
                try { document.body.appendChild(b); } catch (e) { return; }
                __MT.btn = b;
              }
              __mtPaintBtn();
            } catch (e) {}
          };
          try {
            window.__maintFreeze = {
              isOn: __mtOn,
              on: () => __mtSet(true),
              off: () => __mtSet(false),
              toggle: () => { const v = !__mtOn(); __mtSet(v); return v; },
              rescan: __mtRescan,
              status: () => ({ on: __mtOn(), blocked: Object.assign({}, __MT.counts) })
            };
          } catch (e) {}
          try { __mtRescan(); } catch (e) {}
          try { __mtMkBtn(); } catch (e) {}
          // Les modules auto-modifiants peuvent etre reinstalles plus tard
          // (c'est leur metier) : on re-pose les enveloppes manquantes.
          // Pass-through quand le mode est OFF (cout negligeable).
          try {
            if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof setInterval === 'function' && __MT.timer === null) {
              __MT.timer = setInterval(() => { try { __mtRescan(); } catch (e) {} }, 4000);
            }
          } catch (e) {}
          try { console.info('[Maintenance] pret, etat : ' + (__mtOn() ? 'ON (auto-modifs gelees)' : 'OFF')); } catch (e) {}
        }
      } catch (eMT) {}
    }
  } catch (ePatch) {}
}
