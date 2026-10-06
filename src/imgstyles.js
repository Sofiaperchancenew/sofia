import { IMG_STYLES } from "./imgstyles-data.js";
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
      if (det && det.frag) s = s.replace(/\s+$/, "") + ", " + det.frag;
      try { const bf = bustFrag(String(prompt || "")); if (bf && s.toLowerCase().indexOf("breast") < 0) s = s.replace(/\s+$/, "") + ", " + bf; } catch (eB) {}
      let o = options || {};
      if (det && det.neg) o = Object.assign({}, o, {negativePrompt: o.negativePrompt ? (o.negativePrompt + ", " + det.neg) : det.neg});
      return {prompt: s, options: o};
    }
  };
}
