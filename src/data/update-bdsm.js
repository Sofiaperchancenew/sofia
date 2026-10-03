// Mise à jour du catalogue BDSM (Eveselache + Univers BDSM + Sybian + F-Machine + AgriExpo + Cage-Chasteté + Sophie Libertine).
// Usage (session agent, mensuel comme vetements) :
//   1. fetch_url chaque URL de CATS vers son fichier scratch/bdsm/* (table ci-dessous).
//   2. execute_js : charger ce fichier et l'exécuter :
//        const code = await fs.readTextFile('src/data/update-bdsm.js');
//        const AF = Object.getPrototypeOf(async function(){}).constructor;
//        return await new AF('fs', code)(fs);
//   3. page_eval : vérifier loadBDSMBrief + donjonBlock après page_refresh.
//   4. GitHub : même recette que vetements (CatalogPush, changer le chemin).
const CATS = [
  ['ev-cages', 'Eveselache — cages de chasteté', 'https://www.eveselache.fr/fr/331-cages-de-chastete', 'scratch/bdsm/ev-cages.html', 'ev'],
  ['ev-uretre', 'Eveselache — plugs urètre', 'https://www.eveselache.fr/fr/282-plug-d-uretre-stimulateur-penis', 'scratch/bdsm/ev-uretre.html', 'ev'],
  ['ev-contraintes', 'Eveselache — contraintes', 'https://www.eveselache.fr/fr/278-sm-contraintes', 'scratch/bdsm/ev-contraintes.html', 'ev'],
  ['ev-baillons', 'Eveselache — bâillons et cagoules', 'https://www.eveselache.fr/fr/280-baillons-cagoule-mors-ecarteurs', 'scratch/bdsm/ev-baillons.html', 'ev'],
  ['ev-fouets', 'Eveselache — tapettes et fouets', 'https://www.eveselache.fr/fr/281-tapettes-et-fouets-martinet-cravache', 'scratch/bdsm/ev-fouets.html', 'ev'],
  ['ev-cockring', 'Eveselache — cockrings', 'https://www.eveselache.fr/fr/283-cockring', 'scratch/bdsm/ev-cockring.html', 'ev'],
  ['ev-colliers', 'Eveselache — colliers', 'https://www.eveselache.fr/fr/293-colliers-bdsm', 'scratch/bdsm/ev-colliers.html', 'ev'],
  ['ev-pinces', 'Eveselache — pinces à seins', 'https://www.eveselache.fr/fr/284-pince-a-seins-et-suceurs-de-tetons', 'scratch/bdsm/ev-pinces.html', 'ev'],
  ['ev-mobilier', 'Eveselache — mobilier loveroom', 'https://www.eveselache.fr/fr/345-loveroom-mobilier-bdsm', 'scratch/bdsm/ev-mobilier.html', 'ev'],
  ['ev-crochets', 'Eveselache — crochets et écarteurs acier', 'https://www.eveselache.fr/fr/349-crochet-et-ecarteur-en-acier-sm', 'scratch/bdsm/ev-crochets.html', 'ev'],
  ['ub-gode', 'Univers BDSM — godes ceinture', 'https://univers-bdsm.com/collections/gode-ceinture', 'scratch/bdsm/ub-gode.html', 'ub'],
  ['ub-cage', 'Univers BDSM — cages de chasteté', 'https://univers-bdsm.com/collections/cage-de-chastete', 'scratch/bdsm/ub-cage.html', 'ub'],
  ['ub-camisole', 'Univers BDSM — camisoles de force', 'https://univers-bdsm.com/collections/camisole-de-force', 'scratch/bdsm/ub-camisole.html', 'ub'],
  ['ub-latex', 'Univers BDSM — combinaisons latex', 'https://univers-bdsm.com/collections/combinaison-latex', 'scratch/bdsm/ub-latex.html', 'ub'],
  ['ub-plug', 'Univers BDSM — plugs anaux', 'https://univers-bdsm.com/collections/plug-anal', 'scratch/bdsm/ub-plug.html', 'ub'],
  ['ub-dildo', 'Univers BDSM — dildos', 'https://univers-bdsm.com/collections/dildo', 'scratch/bdsm/ub-dildo.html', 'ub'],
  ['ub-machine', 'Univers BDSM — sex machines', 'https://univers-bdsm.com/collections/sex-machine', 'scratch/bdsm/ub-machine.html', 'ub'],
  ['ub-crochet', 'Univers BDSM — crochets anaux', 'https://univers-bdsm.com/collections/crochet-anal', 'scratch/bdsm/ub-crochet.html', 'ub'],
  ['sybian', 'Sybian — la machine originale', 'https://sybian.com/product/the-sybian/', 'scratch/bdsm/sybian.html', 'sybian'],
  ['fmachine', 'F-Machine — machines', 'https://f-machine.com/index.php/catalog/machines', 'scratch/bdsm/fmachine.html', 'fm'],
  ['agriexpo', 'AgriExpo — machines à traire', 'https://www.agriexpo.online/', 'scratch/bdsm/agri-yimeite.html', 'agri'],
  ['agriexpo', 'AgriExpo — machines à traire', 'https://www.agriexpo.online/', 'scratch/bdsm/agri-alper.html', 'agri'],
  ['agriexpo', 'AgriExpo — machines à traire', 'https://www.agriexpo.online/', 'scratch/bdsm/agri-lukas.html', 'agri'],
  ['cc-femme', 'Cage-Chasteté — ceintures femme', 'https://cage-chastete.fr/collections/ceinture-de-chastete-femme', 'scratch/bdsm/cc-femme.json', 'cc'],
  ['cc-estim', 'Cage-Chasteté — électroplay CBT e-stim', 'https://cage-chastete.fr/collections/electroplay-cbt-e-stim', 'scratch/bdsm/cc-estim.json', 'cc'],
  ['cc-homme', 'Cage-Chasteté — ceintures homme', 'https://cage-chastete.fr/collections/ceinture-de-chastete-homme', 'scratch/bdsm/cc-homme.json', 'cc'],
  ['sl-anal', 'Sophie Libertine — anal', 'https://www.sophielibertine.com/191-anal', 'scratch/bdsm/sl-anal.html', 'sl'],
  ['sl-geisha', 'Sophie Libertine — boules de geisha', 'https://www.sophielibertine.com/193-boules-de-geisha', 'scratch/bdsm/sl-geisha.html', 'sl'],
  ['sl-masturb', 'Sophie Libertine — masturbateurs homme', 'https://www.sophielibertine.com/199-masturbateurs-homme', 'scratch/bdsm/sl-masturb.html', 'sl'],
  ['sl-devf', 'Sophie Libertine — développeur féminin', 'https://www.sophielibertine.com/235-developpeur-feminin', 'scratch/bdsm/sl-devf.html', 'sl'],
  ['sl-devm', 'Sophie Libertine — développeur masculin', 'https://www.sophielibertine.com/236-developpeur-masculin', 'scratch/bdsm/sl-devm.html', 'sl'],
  ['lbh-connectes', 'Boutique du Hard — sextoys connectes', 'https://laboutiqueduhard.fr/377-sextoys-connectes', 'scratch/bdsm/lbh-connectes.html', 'lbh'],
  ['lbh-hygiene', 'Boutique du Hard — hygiene et lubrifiants', 'https://laboutiqueduhard.fr/331-hygiene-et-lubirifiants', 'scratch/bdsm/lbh-hygiene.html', 'lbh'],
  ['lbh-electro', 'Boutique du Hard — electro-stimulations', 'https://laboutiqueduhard.fr/23-electro-stimulations', 'scratch/bdsm/lbh-electro.html', 'lbh'],
  ['lbh-lingerie', 'Boutique du Hard — lingerie sexy femme', 'https://laboutiqueduhard.fr/518-lingerie-sexy-pour-femme', 'scratch/bdsm/lbh-lingerie.html', 'lbh'],
  ['lbh-nouveaux', 'Boutique du Hard — nouveaux produits', 'https://laboutiqueduhard.fr/nouveaux-produits', 'scratch/bdsm/lbh-nouveaux.html', 'lbh'],
];
function decodeEnt(s) { return s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&euro;|&#8364;/g, '€').replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&ecirc;/g, 'ê').replace(/&agrave;/g, 'à').replace(/&acirc;/g, 'â').replace(/&icirc;/g, 'î').replace(/&ocirc;/g, 'ô').replace(/&ucirc;/g, 'û').replace(/&ccedil;/g, 'ç').replace(/&oelig;/g, 'œ').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-fA-F]+);/g, (m, h) => String.fromCharCode(parseInt(h, 16))); }
function stripTags(s) { return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function unesc(s) { return s.replace(/\\"/g, '"').replace(/\\\//g, '/').replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16))); }
function parseEV(html) {
  const items = []; const seen = new Set();
  const re = /\{"item_name":"((?:[^"\\]|\\.)*)","item_id":"(\d+)","price":"([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) {
    const pid = m[2];
    if (seen.has(pid)) continue; seen.add(pid);
    const tail = html.slice(m.index, m.index + 600);
    const brand = (tail.match(/"item_brand":"((?:[^"\\]|\\.)*)"/) || [])[1];
    const cat2 = (tail.match(/"item_category2":"((?:[^"\\]|\\.)*)"/) || [])[1];
    items.push({ pid, shop: 'eveselache', brand: brand ? stripTags(decodeEnt(unesc(brand))) : null,
      name: stripTags(decodeEnt(unesc(m[1]))),
      url: null, price: m[3] ? m[3] + ' €' : null, colors: [], img: null,
      desc: cat2 ? stripTags(decodeEnt(unesc(cat2))) : '' });
  }
  return items;
}
function parseUB(html) {
  const parts = html.split(/(?=<div id="p\d+"class="product-list)/);
  const items = []; const seen = new Set();
  for (let k = 1; k < parts.length; k++) {
    const t = parts[k];
    const pid = (t.match(/^<div id="p(\d+)"/) || [])[1];
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    const urlm = t.match(/href="([^"]+?\/products\/[^"]+)"/);
    const nm = (t.match(/itemprop="name">([^<]+?)</) || [])[1];
    const desc = (t.match(/colllection_p">([\s\S]{0,600}?)(?:\.\.\.|<\/div)/) || [])[1];
    const price = (t.match(/collpagemain">([^<]+)/) || [])[1];
    const imgm = t.match(/data-src="([^"]+)"/) || t.match(/src="([^"]*?_[0-9]+x\.[a-z]+[^"]*)"/i);
    items.push({ pid, shop: 'univers-bdsm',
      brand: null, name: nm ? stripTags(decodeEnt(nm)) : null,
      url: urlm ? ('https://univers-bdsm.com' + urlm[1]) : null,
      price: price ? stripTags(decodeEnt(price)) : null, colors: [],
      img: imgm ? ('https:' + imgm[1]) : null,
      desc: desc ? stripTags(decodeEnt(desc)).slice(0, 300) : '' });
  }
  return items;
}
function parseFM(html) {
  const parts = html.split('data-hover="');
  const items = []; const seen = new Set();
  for (let k = 1; k < parts.length; k++) {
    const t = parts[k].slice(0, 6000);
    const nm = (t.match(/^([^"]{2,80})"/) || [])[1];
    const href = (t.match(/href="([^"]*detail[^"]*)"/) || [])[1];
    if (!nm || !href) continue;
    let url = href;
    if (url.startsWith('/')) url = 'https://f-machine.com' + url;
    if (seen.has(url)) continue; seen.add(url);
    const price = (t.match(/(£[0-9][0-9.,]*)/) || [])[1];
    items.push({ pid: url, shop: 'f-machine', brand: 'F-Machine',
      name: stripTags(decodeEnt(nm)), url,
      price: price ? price + ' GBP' : null, colors: [], img: null, desc: '' });
  }
  return items;
}
function parseSybian(html) {
  const m = html.match(/"@type":"Product"[\s\S]{0,3000}/);
  const t = m ? m[0] : html;
  const pick = (re) => { const x = t.match(re); return x ? unesc(x[1]) : null; };
  const name = pick(/"name":"((?:[^"\\]|\\.)*)"/);
  const price = pick(/"price":"([^"]*)"/);
  const cur = pick(/"priceCurrency":"([^"]*)"/);
  const img = pick(/"image":"((?:[^"\\]|\\.)*)"/);
  const desc = pick(/"description":"((?:[^"\\]|\\.)*)"/);
  return [{ pid: 'sybian-original', shop: 'sybian', brand: 'Sybian',
    name: name ? stripTags(decodeEnt(name)) : 'Sybian',
    url: 'https://sybian.com/product/the-sybian/',
    price: price ? price + ' ' + (cur || 'USD') : null,
    colors: [], img: img || null, desc: desc ? stripTags(decodeEnt(desc)).slice(0, 300) : '' }];
}
function parseAgri(html) {
  const ld = (html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i) || [])[1] || '';
  let j = {};
  try { j = JSON.parse(ld); } catch (e) {}
  const ogTitle = (html.match(/og:title" content="([^"]{1,200})/) || [])[1] || '';
  const brand = decodeEnt(((ogTitle.match(/by (.+?) \| AgriExpo/) || [])[1] || '').trim()) || null;
  const ident = (j.identifier || '').trim();
  const tags = (html.match(/<title[^>]*>([^<]{1,250})<\/title>/) || [])[1] || '';
  const hasPump = /transfer pump/i.test(tags);
  const name = ident ? 'Machine à traire ' + ident + ' (électrique, mobile)'
    : 'Machine à traire mobile (pompe à vide, 1-2 seaux)';
  let desc = j.description ? stripTags(decodeEnt(j.description)).slice(0, 300) : '';
  if (!desc || desc.length < 60) desc = 'Machine à traire électrique mobile pour vaches. Sur devis.' + (hasPump ? '' : '');
  const imgs = Array.isArray(j.image) ? j.image : [];
  const img0 = imgs[0];
  const img = img0 ? (typeof img0 === 'string' ? img0 : img0.contentUrl) : null;
  const url = (html.match(/og:url" content="([^"]+)/) || [])[1] || null;
  return [{ pid: url || brand || name, shop: 'agriexpo', brand,
    name, url, price: null, colors: [], img: img || null, desc }];
}
function parseCC(json) {
  let j = {};
  try { j = JSON.parse(json); } catch (e) { return []; }
  const items = [];
  for (const p of (j.products || [])) {
    const v = (p.variants || [])[0] || {};
    const img = (p.images || [])[0] || {};
    items.push({ pid: 'cc-' + p.id, shop: 'cage-chastete', brand: null,
      name: stripTags(decodeEnt(String(p.title || ''))),
      url: 'https://cage-chastete.fr/products/' + p.handle,
      price: v.price ? v.price + ' €' : null, colors: [], img: img.src || null,
      desc: stripTags(decodeEnt(String(p.body_html || ''))).slice(0, 300) });
  }
  return items;
}
function parseSL(html) {
  const parts = html.split('<article class="product-miniature');
  const items = []; const seen = new Set();
  for (let k = 1; k < parts.length; k++) {
    const t = parts[k].slice(0, 6000);
    const idm = t.match(/data-id-product="(\d+)"/);
    const pid = idm ? 'sl-' + idm[1] : null;
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    const nm = (t.match(/itemprop="name"[^>]*>([^<]{2,150})/) || [])[1];
    const um = t.match(/<a[^>]*href="(https:\/\/www\.sophielibertine\.com\/[\/\w\-.]+\.html)[^"]*"/);
    const pr = (t.match(/itemprop="price"[^>]*content="([^"]+)"/) || [])[1];
    const im = (t.match(/<img[^>]*src\s*=\s*"([^"]+)"/) || [])[1];
    items.push({ pid, shop: 'sophielibertine', brand: null,
      name: nm ? stripTags(decodeEnt(nm.trim())) : null,
      url: um ? um[1].split('#')[0] : null,
      price: pr ? pr.replace('.', ',') + ' €' : null, colors: [],
      img: im ? im.trim() : null, desc: '' });
  }
  return items;
}
function parseLBH(html) {
  const parts = html.split('"@type": "Product"');
  const items = []; const seen = new Set();
  for (let k = 1; k < parts.length; k++) {
    const t = parts[k].slice(0, 1500);
    const gi = (key) => { const a = t.indexOf('"' + key + '": "'); if (a === -1) return null; const b = t.indexOf('"', a + key.length + 5); return b === -1 ? null : t.slice(a + key.length + 5, b); };
    let url = gi('url');
    if (url && url.indexOf('#') !== -1) url = url.split('#')[0];
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const nm = gi('name');
    const img = gi('image');
    let price = null;
    const pa = t.indexOf('"price": ');
    if (pa !== -1) { const pe = t.indexOf(',', pa + 10); const raw = t.slice(pa + 10, pe === -1 ? pa + 20 : pe).trim(); const f = parseFloat(raw); if (f) price = String(raw).replace('.', ',') + ' EUR'; }
    items.push({ pid: url, shop: 'boutique-du-hard', brand: null,
      name: nm ? stripTags(decodeEnt(nm)) : null, url,
      price: price, colors: [], img: img || null, desc: '' });
  }
  return items;
}
const PARSERS = { ev: parseEV, ub: parseUB, fm: parseFM, sybian: parseSybian, agri: parseAgri, cc: parseCC, sl: parseSL, lbh: parseLBH };
const catalog = { title: 'Catalogue BDSM — base donjon', updated: new Date().toISOString().slice(0, 10),
  sources: ['eveselache.fr', 'univers-bdsm.com', 'sybian.com', 'f-machine.com', 'agriexpo.online', 'cage-chastete.fr', 'sophielibertine.com', 'laboutiqueduhard.fr'],
  note: 'Cages, urètre, contraintes, bâillons, fouets, cockrings, colliers, pinces, mobilier, crochets, godes ceinture, camisoles, latex, plugs, dildos, machines, trayeuses, ceintures, électro, anal, geisha, masturbateurs, développeurs.',
  categories: {} };
const SHOPS = { ev: 'eveselache', ub: 'univers-bdsm', fm: 'f-machine', sybian: 'sybian', agri: 'agriexpo', cc: 'cage-chastete', sl: 'sophielibertine', lbh: 'boutique-du-hard' };
for (const [id, label, url, path, kind] of CATS) {
  const html = await fs.readTextFile(path);
  const items = PARSERS[kind](html);
  if (!catalog.categories[id]) catalog.categories[id] = { label, url, shop: SHOPS[kind] || kind, items: [] };
  catalog.categories[id].items.push(...items);
  catalog.categories[id].count = catalog.categories[id].items.length;
}
{
  const fmItems = (catalog.categories.fmachine && catalog.categories.fmachine.items) || [];
  const alpha = fmItems.find(i => i.name === 'Alpha');
  if (alpha) {
    let alphaPrice = null;
    try {
      const d = await fs.readTextFile('scratch/bdsm/fmachine-alpha.html');
      const pm = d.match(/£[\d,]+(?:\.\d{2})?/);
      if (pm) alphaPrice = pm[0] + ' GBP';
    } catch (e) {}
    alpha.price = alphaPrice || '£995.00 GBP';
    alpha.desc = "Machine pilotable à distance en Bluetooth (appli F-Machine Connect, iPhone/Android) ou télécommande. Profondeur de poussée réglable 25-133 mm sans arrêt, moteur 280 tr/min 4 Nm, quasi silencieuse, pieds acier lestés. Livrée en mallette avec gode silicone 8 pouces.";
  }
}
await fs.writeTextFile('src/data/bdsm-catalog.json', JSON.stringify(catalog, null, 1));
const all = Object.values(catalog.categories).flatMap(x => x.items);
return { total: all.length, noName: all.filter(i => !i.name).length,
  perCat: Object.fromEntries(Object.entries(catalog.categories).map(([k, v]) => [k, v.items.length])) };
