// Builder Sinful (sinful.fr) — complète le catalogue BDSM.
// Usage :
//   1. fetch_url les fiches de scratch/bdsm/sin-fetchmap.json vers scratch/bdsm/sinp-NNN.html
//   2. execute_js : charger ce fichier et l'exécuter :
//        const code = await fs.readTextFile('src/data/update-sinful.js');
//        const AF = Object.getPrototypeOf(async function(){}).constructor;
//        return await new AF('fs', code)(fs);
//   3. Le résultat (scratch/bdsm/sin-items.json) est fusionné dans bdsm-catalog.json.
// Données par fiche : JSON-LD Product (nom, marque, prix EUR, image, description FR,
// sku) + produits liés du flight-data Next.js (décodés du double-échapement :
// url=null, catégorisation par nom, descriptions $ref ignorées).
// NOTE : ce fichier ne contient volontairement aucun antislash littéral
// (utiliser BS = fromCharCode(92)) pour survivre aux couches de transport.
const BS = String.fromCharCode(92);
const QT = String.fromCharCode(34);
function sEnt(s) {
  return String(s).split('&amp;').join('&').split('&quot;').join(QT)
    .split('&#39;').join("'").split('&apos;').join("'")
    .split('&euro;').join('€').split('&nbsp;').join(' ')
    .split('&eacute;').join('é').split('&egrave;').join('è').split('&ecirc;').join('ê')
    .split('&agrave;').join('à').split('&ccedil;').join('ç').split('&oelig;').join('œ');
}
function sStrip(s) {
  let o = s;
  let a = o.indexOf('<');
  while (a !== -1) {
    const b = o.indexOf('>', a + 1);
    if (b === -1) break;
    o = o.slice(0, a) + ' ' + o.slice(b + 1);
    a = o.indexOf('<');
  }
  while (o.indexOf('  ') !== -1) o = o.split('  ').join(' ');
  return o.trim();
}
function sPrice(p) {
  if (p == null || p === '') return null;
  return String(p).split('.').join(',') + ' €';
}
const RULES_SRC = [
  ['sin-soins', 'lubrifiant|lubricant|glide|a-base-d-eau|lube|serum|nettoyant|cleaner|regenerante|lavement|preservatif|condom|capote'],
  ['sin-speculums', 'speculum|ecarteur|spreader|dilatateur'],
  ['sin-machines', 'machine|thruster|sybian|sexmachine|motoris|fuck'],
  ['sin-chastete', 'chastete|cage-de|cadenas|belt-de-chast'],
  ['sin-pinces', 'pince|pompe|pump|nipple|suceur|suce-'],
  ['sin-electro', 'electro|e-stim|estim|mystim|tens|uretre|uretral|sonde|vibromasseur|air-pulse|stimulateur'],
  ['sin-geisha', 'geisha|kegel|ben-wa|smartball|vaginal-ball'],
  ['sin-anaux', 'anal|butt|prostate|chaine-anale|dilatat|aneros|b-vibe|perle|plug'],
  ['sin-godes', 'gode|dildo|strap-on|dong'],
  ['sin-bondage', 'bondage|harnais|harness|menotte|handcuff|corde|rope|baillon|gag|fouet|whip|cravache|martinet|paddle|crop-|collier|laisse|bracelet|bandeau|restraint|attach|spread|ecarte|strap|fessee|spank|cuff|hogtie|sling|baston|slapper'],
  ['sin-ouverte', 'ouvert|crotchless|sans-entrejambe|open-crotch'],
  ['sin-guepieres', 'guepiere|guipiere|corset|bustier|serre-taille|waist|waspie'],
  ['sin-soutiens', 'soutien|bra-|push-up|balconnet|triangle-|babydoll|nuisette|negligee'],
  ['sin-catsuits', 'catsuit|bodystocking|combinaison|justaucorps|jumpsuit|overall|teddy|sexy-body|-body-'],
  ['sin-jarretelles', 'porte-jarretelles|suspender|garter'],
  ['sin-bas', 'collant|stocking|resille|stay-up|cuissarde|knee-high|thigh-high|-bas|bas-'],
  ['sin-strings', 'string|culotte|tanga|panty|slip'],
  ['sin-vetements', 'latex|vinyl|wetlook|uniforme|infirmiere|ecoliere|maid|soubrette|police|cuir|leather|-robe|pantalon|pants|veste|jacket|gant|glove|masque|mask|cagoule|hood|bottes|boots|casquette|kimono|chemise|peignoir|dress-|costume']
];
function sCatFor(slug) {
  const s = String(slug).toLowerCase();
  for (const r of RULES_SRC) {
    const alts = r[1].split('|');
    for (const a of alts) { if (s.indexOf(a) !== -1) return r[0]; }
  }
  return null;
}
function sSlug(u) {
  const parts = String(u).split('/p/');
  if (parts.length < 2) return '';
  return parts[1].split('/')[0];
}
function sReadEsc(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === BS) { out += c + (s[i + 1] || ''); i++; continue; }
    if (c === QT) return out;
  }
  return out;
}
function sValAt(t, field, maxAt) {
  const key = BS + QT + field + BS + QT + ':' + BS + QT;
  const i = t.indexOf(key);
  if (i === -1 || i > maxAt) return null;
  return sReadEsc(t.slice(i + key.length));
}
function sVal(t, field) {
  return sValAt(t, field, 3000);
}
function sNum(t, field) {
  const key = BS + QT + field + BS + QT + ':';
  const i = t.indexOf(key);
  if (i === -1) return null;
  const seg = t.slice(i + key.length, i + key.length + 24);
  let digits = '';
  for (const c of seg) {
    if (c >= '0' && c <= '9') digits += c;
    else break;
  }
  return digits || null;
}
function sUnesc(s) {
  if (!s) return s;
  try { return JSON.parse(QT + s + QT); } catch (e) { return s; }
}
function parseSIN(html, pageUrl) {
  const items = [];
  const tag = '<script type=' + QT + 'application/ld+json' + QT + '>';
  const endTag = '</' + 'script>';
  const parts = html.split(tag);
  for (let k = 1; k < parts.length; k++) {
    const e = parts[k].indexOf(endTag);
    if (e === -1) continue;
    const block = parts[k].slice(0, e);
    let j = null;
    try { j = JSON.parse(block); } catch (err) {}
    if (!j) continue;
    const arr = Array.isArray(j) ? j : [j];
    for (const x of arr) {
      if (!x || x['@type'] !== 'Product' || !x.name) continue;
      const sku = String(x.sku || '');
      let url = x.url ? ('https://www.sinful.fr' + x.url) : pageUrl;
      url = url.split('#')[0];
      items.push({ pid: 'sin-' + (sku || url), shop: 'sinful', main: true,
        brand: x.brand && x.brand.name ? sStrip(sEnt(x.brand.name)) : null,
        name: sStrip(sEnt(x.name)), url: url,
        price: sPrice(x.offers ? x.offers.price : null), colors: [],
        img: x.image ? String(x.image).split('&amp;').join('&') : null,
        desc: x.description ? sStrip(sEnt(x.description)).slice(0, 300) : '' });
    }
  }
  return items;
}
function parseSINRelated(html, skuMap) {
  const items = [];
  const marker = BS + QT + 'sku';
  const parts = html.split(marker);
  for (let k = 1; k < parts.length; k++) {
    const t = relUnesc(parts[k].slice(0, 1200));
    let j = 0;
    while (j < t.length && (t[j] === ' ' || t[j] === BS || t[j] === QT || t[j] === ':')) j++;
    let digits = '';
    while (j < t.length && t[j] >= '0' && t[j] <= '9') { digits += t[j]; j++; }
    if (!digits) continue;
    const nmJ = relVal(t, 'name');
    if (nmJ === null) continue;
    let nm = nmJ;
    try { nm = JSON.parse(QT + nmJ + QT); } catch (e) {}
    if (!nm) continue;
    const imgJ = relVal(t, 'image');
    let img = null;
    if (imgJ !== null) {
      try { img = JSON.parse(QT + imgJ + QT); } catch (e) { img = imgJ; }
    }
    const cents = relNum(t, 'price');
    let br = null;
    const bi = t.indexOf(QT + 'brand' + QT);
    if (bi !== -1) br = relVal(t.slice(bi, bi + 200), 'label');
    if (!img && !cents) continue;
    items.push({ pid: 'sin-' + digits, shop: 'sinful', main: false,
      brand: br ? sStrip(sEnt(br)) : null,
      name: sStrip(sEnt(nm)),
      url: null,
      price: cents ? ((parseInt(cents, 10) / 100).toFixed(2).split('.').join(',') + ' €') : null,
      colors: [], img: img ? img.split('&amp;').join('&') : null,
      desc: '' });
  }
  return items;
}
function relUnesc(s) {
  let pass = String(s);
  for (let r = 0; r < 2; r++) {
    let out = '';
    for (let i = 0; i < pass.length; i++) {
      const c = pass[i];
      if (c === BS && i + 1 < pass.length) {
        const n = pass[i + 1];
        if (n === BS || n === QT) { out += n; i++; continue; }
        if (n === 'u' && i + 5 < pass.length) {
          const h = pass.slice(i + 2, i + 6);
          let ok = h.length === 4;
          for (const ch of h) {
            if (!((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F'))) ok = false;
          }
          if (ok) { out += String.fromCharCode(parseInt(h, 16)); i += 5; continue; }
        }
      }
      out += c;
    }
    pass = out;
  }
  return pass;
}
function relVal(t, field) {
  const key = QT + field + QT + ':' + QT;
  const i = t.indexOf(key);
  if (i === -1) return null;
  let out = '';
  for (let j = i + key.length; j < t.length; j++) {
    const c = t[j];
    if (c === QT) return out;
    out += c;
  }
  return out;
}
function relNum(t, field) {
  const key = QT + field + QT + ':';
  const i = t.indexOf(key);
  if (i === -1) return null;
  let j = i + key.length;
  while (j < t.length && (t[j] === ' ' || t[j] === QT)) j++;
  let d = '';
  while (j < t.length && t[j] >= '0' && t[j] <= '9') { d += t[j]; j++; }
  return d || null;
}
const fetchMap = JSON.parse(await fs.readTextFile('scratch/bdsm/sin-fetchmap.json'));
const skuMap = {};
try { Object.assign(skuMap, JSON.parse(await fs.readTextFile('scratch/bdsm/sin-skumap.json'))); } catch (e) {}
const noCatNames = [];
const byCat = {};
const seen = new Set();
let nPages = 0, nNoProduct = 0, nRelated = 0, nRelatedKept = 0, nRelatedNoCat = 0;
for (const p of fetchMap) {
  let html = null;
  try { html = await fs.readTextFile(p.file); } catch (e) { continue; }
  nPages++;
  const mains = parseSIN(html, p.url);
  if (!mains.length) { nNoProduct++; continue; }
  for (const it of mains) {
    const key = it.url || it.pid;
    if (seen.has(key)) continue;
    seen.add(key);
    const trueCat = sCatFor(sSlug(it.url || '')) || p.cat;
    if (!byCat[trueCat]) byCat[trueCat] = [];
    byCat[trueCat].push(it);
  }
  const rels = parseSINRelated(html, skuMap);
  nRelated += rels.length;
  for (const it of rels) {
    if (!it.name) continue;
    const key = it.url || it.pid;
    if (seen.has(key)) continue;
    const slugGuess = it.name.toLowerCase().split(' ').join('-');
    const cat = sCatFor(slugGuess);
    if (!cat) { nRelatedNoCat++; if (noCatNames.length < 40) noCatNames.push(it.name); continue; }
    seen.add(key);
    nRelatedKept++;
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(it);
  }
}
await fs.writeTextFile('scratch/bdsm/sin-items.json', JSON.stringify(byCat, null, 1));
const perCat = Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, v.length]));
return { pages: nPages, noProduct: nNoProduct, related: nRelated, relatedKept: nRelatedKept, relatedNoCat: nRelatedNoCat, noCatNames, perCat };
