// Mise à jour mensuelle du catalogue vêtements (femme : Etam + RougeGorge, homme : Glamuse).
// Usage (session agent, une fois par mois) :
//   1. fetch_url chaque URL de CATS vers son fichier scratch/* (table ci-dessous).
//   2. execute_js : exécuter le contenu de ce fichier (lit les HTML scratch,
//      réécrit src/data/vetements-catalog.json).
//   3. page_eval : vérifier (await App.Core.imageVetementsBrief()).length > 100
//      après page_refresh.
//   4. Export github : attach_file / upload_file du JSON, commit dans le dépôt.
//      L'envoi direct sur GitHub n'est possible que si le propriétaire fournit
//      l'URL du dépôt + un token — jamais de secret dans src/.
const CATS_ETAM = [
  ['lingerie', 'Lingerie', 'https://www.etam.com/c/lingerie/', 'scratch/etam/lingerie.html'],
  ['collant-et-bas', 'Collants et bas', 'https://www.etam.com/c/lingerie/collant-et-bas/', 'scratch/etam/collant-et-bas.html'],
  ['pyjama', 'Pyjama', 'https://www.etam.com/c/pyjama/', 'scratch/etam/pyjama.html'],
  ['vetements-femme', 'Vêtements femme', 'https://www.etam.com/c/vetements-femme/', 'scratch/etam/vetements-femme.html'],
  ['maillot-de-bain', 'Maillots de bain', 'https://www.etam.com/c/maillot-de-bain/', 'scratch/etam/maillot-de-bain.html'],
];
const CATS_RG = [
  ['rg-sexy', 'RougeGorge — ultra sexy', 'https://www.rougegorge.com/fr-fr/lingerie-ultra-sexy/', 'scratch/rg/lingerie-ultra-sexy.html'],
  ['rg-culottes', 'RougeGorge — culottes', 'https://www.rougegorge.com/fr-fr/culottes/', 'scratch/rg/culottes.html'],
  ['rg-nuit', 'RougeGorge — nuit', 'https://www.rougegorge.com/fr-fr/lingerie-de-nuit/', 'scratch/rg/lingerie-de-nuit.html'],
  ['rg-soutiens-gorge', 'RougeGorge — soutiens-gorge', 'https://www.rougegorge.com/fr-fr/soutiens-gorge/', 'scratch/rg/soutiens-gorge.html'],
  ['rg-collants', 'RougeGorge — collants et bas', 'https://www.rougegorge.com/fr-fr/collants-et-bas/', 'scratch/rg/collants-et-bas.html'],
  ['rg-maillots', 'RougeGorge — maillots', 'https://www.rougegorge.com/fr-fr/maillots-de-bain/', 'scratch/rg/maillots-de-bain.html'],
  ['rg-vetements', 'RougeGorge — vêtements', 'https://www.rougegorge.com/fr-fr/vetement-femme/', 'scratch/rg/vetement-femme.html'],
];
const CATS_GL = [
  ['gl-boxer', 'Glamuse homme — boxers', 'https://www.glamuse.com/eu/fr/boxer-homme.html', 'scratch/gl/boxer-homme.html'],
  ['gl-string', 'Glamuse homme — strings', 'https://www.glamuse.com/eu/fr/string-homme.html', 'scratch/gl/string-homme.html'],
  ['gl-nuit', 'Glamuse homme — nuit & homewear', 'https://www.glamuse.com/eu/fr/nuit-homewear-homme.html', 'scratch/gl/nuit-homewear-homme.html'],
  ['gl-detente', 'Glamuse homme — détente', 'https://www.glamuse.com/eu/fr/ensemble-de-detente-homme.html', 'scratch/gl/ensemble-de-detente-homme.html'],
  ['gl-pull', 'Glamuse homme — pulls & gilets', 'https://www.glamuse.com/eu/fr/pull-gilet-homme.html', 'scratch/gl/pull-gilet-homme.html'],
  ['gl-calecon', 'Glamuse homme — caleçons', 'https://www.glamuse.com/eu/fr/calecon-homme.html', 'scratch/gl/calecon-homme.html'],
  ['gl-slip', 'Glamuse homme — slips', 'https://www.glamuse.com/eu/fr/slip-homme.html', 'scratch/gl/slip-homme.html'],
];
function decodeEnt(s) { return s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&euro;/g, '€').replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&agrave;/g, 'à').replace(/&egrave;/g, 'è').replace(/&acirc;/g, 'â').replace(/&ecirc;/g, 'ê').replace(/&icirc;/g, 'î').replace(/&ocirc;/g, 'ô').replace(/&ucirc;/g, 'û').replace(/&ccedil;/g, 'ç').replace(/&oelig;/g, 'œ').replace(/&aelig;/g, 'æ').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)); }
function stripTags(s) { return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function parseEtam(html) {
  const tiles = html.split('js-productTile');
  const items = []; const seen = new Set();
  for (let k = 1; k < tiles.length; k++) {
    const t = tiles[k].slice(0, 16000);
    const pid = (t.match(/data-pid="(\d+)"/) || [])[1];
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    const gamme = (t.match(/productNameGamme[^>]*>([^<]+)</) || [])[1];
    const link = t.match(/productCard__nameTitle[\s\S]{0,600}?href="([^"]+)"[\s\S]{0,300}?>([^<]+?)<\/a>/);
    const price = (t.match(/tuileProductPrice">\s*([^<]+?)\s*/) || [])[1];
    const colors = [...new Set([...t.matchAll(/data-color="([^"]+)"/g)].map(m => m[1]))];
    const imgs = [...t.matchAll(/https:\/\/images\.etam\.com[^"'\s&\\]+\.jpg/gi)].map(m => m[0]);
    const f = imgs.find(u => /_f\.jpg/i.test(u));
    let img = (f || imgs[0] || '').split('?')[0] || null;
    if (img) img += '?sw=600';
    const descm = t.match(/data-lazyload-txt="&quot;([\s\S]{0,800}?)&quot;"/);
    let desc = '';
    if (descm) { try { desc = stripTags(decodeEnt(descm[1])).slice(0, 300); } catch (e) {} }
    items.push({ pid, shop: 'etam', gamme: gamme ? stripTags(gamme).trim() : null,
      name: link ? stripTags(decodeEnt(link[2])).replace(/\s+/g, ' ').trim() : null,
      url: link ? ('https://www.etam.com' + link[1]) : null,
      price: price ? stripTags(decodeEnt(price)).replace(/\s+/g, ' ').trim() : null,
      colors, img, desc });
  }
  return items;
}
function parseRG(html) {
  const parts = html.split('<div class="product" data-pid="');
  const items = []; const seen = new Set();
  for (let k = 1; k < parts.length; k++) {
    const t = parts[k].slice(0, 12000);
    const pid = (parts[k].match(/^"?(\d+)/) || [])[1];
    if (!pid || seen.has(pid)) continue; seen.add(pid);
    const link = t.match(/pdp-title-link"[^>]*href="([^"]+)"[^>]*>\s*([^<]+?)\s*</);
    const brand = (t.match(/pdp-brand-title">\s*([^<]+?)\s*/) || [])[1];
    const price = (t.match(/ocs-price[^>]*>\s*<span[^>]*>\s*([^<]+?)\s*/) || [])[1];
    const imgm = t.match(/https:\/\/www\.rougegorge\.com\/dw\/image\/[^"'\s&]+?\.jpg/);
    const colors = [...new Set([...t.matchAll(/background-color:(#[0-9a-fA-F]{3,6})/g)].map(m => m[1]))];
    items.push({ pid, shop: 'rougegorge', brand: brand ? stripTags(brand) : null,
      name: link ? stripTags(decodeEnt(link[2])) : null,
      url: link ? ('https://www.rougegorge.com' + link[1]) : null,
      price: price ? stripTags(decodeEnt(price)) : null, colors,
      img: imgm ? imgm[0].replace(/&amp;/g, '&') : null, desc: '' });
    if (items.length >= 30) break;
  }
  return items;
}
function parseGL(html) {
  const parts = html.split('class="div_listings"');
  const items = []; const seen = new Set();
  for (let k = 1; k < parts.length; k++) {
    const t = parts[k].slice(0, 9000);
    let pid = (t.match(/data-parent-id="(\d+)"/) || [])[1];
    const urlm = t.match(/href="(https:\/\/www\.glamuse\.com[^"]+?)-p-(\d+)\.html[^"]*"/);
    if (urlm && !pid) pid = urlm[2];
    if (urlm && pid && urlm[2] !== pid) pid = urlm[2];
    if (!pid || seen.has(pid)) continue; seen.add(pid);
    const brand = (t.match(/<span class="gras">([^<]+)</) || [])[1];
    const nm = (t.match(/itemprop="name"\s+content="([^"]+)"/) || [])[1]
      || (t.match(/class="nom_produit"[^>]*title="([^"]+)"/) || [])[1]
      || (t.match(/listing_zone_image[\s\S]{0,3000}?alt="([^"]+)"/) || [])[1];
    const price = (t.match(/glam-price-final">\s*([^<]+?)\s*/) || [])[1];
    const imgm = t.match(/https:\/\/static\.glamu\.se\/[^"'\s]+\.jpg/);
    const colm = t.match(/listings_nom_collection">\s*([^<]+?)\s*/);
    items.push({ pid, shop: 'glamuse', brand: brand ? stripTags(brand) : null,
      name: nm ? stripTags(decodeEnt(nm)) : null,
      url: urlm ? urlm[1] + '-p-' + pid + '.html' : null,
      price: price ? stripTags(decodeEnt(price)) : null,
      colors: colm ? [stripTags(colm[1])] : [], img: imgm ? imgm[0] : null, desc: '' });
    if (items.length >= 32) break;
  }
  return items;
}
const catalog = { title: 'Catalogue vêtements — base roleplay', updated: new Date().toISOString().slice(0, 10), sources: ['etam.com', 'rougegorge.com', 'glamuse.com'], note: 'Femme : Etam + RougeGorge. Homme : Glamuse.', categories: {} };
for (const [id, label, url, path] of CATS_ETAM) {
  catalog.categories[id] = { label, url, shop: 'etam', sex: 'femme', items: parseEtam(await fs.readTextFile(path)) };
  catalog.categories[id].count = catalog.categories[id].items.length;
}
for (const [id, label, url, path] of CATS_RG) {
  catalog.categories[id] = { label, url, shop: 'rougegorge', sex: 'femme', items: parseRG(await fs.readTextFile(path)) };
  catalog.categories[id].count = catalog.categories[id].items.length;
}
for (const [id, label, url, path] of CATS_GL) {
  catalog.categories[id] = { label, url, shop: 'glamuse', sex: 'homme', items: parseGL(await fs.readTextFile(path)) };
  catalog.categories[id].count = catalog.categories[id].items.length;
}
await fs.writeTextFile('src/data/vetements-catalog.json', JSON.stringify(catalog, null, 1));
const all = Object.values(catalog.categories).flatMap(x => x.items);
return { total: all.length, noName: all.filter(i => !i.name).length, noImg: all.filter(i => !i.img).length };
