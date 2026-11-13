// SFW-PROOF SCANNER v2 — worker-runnable (global fs fourni par execute_js).
//   const scan = new (Object.getPrototypeOf(async function(){}).constructor)("ROOT", await fs.readTextFile("src/tools/sfw-strip/scan.js"));
//   await scan("src");                  // référence live
//   await scan("scratch/sfw-build");    // preuve strippée
// Marqueurs = phrases de génération érotique (ancres exactes). Ignore ses propres
// commentaires (SFW-STRIP) et son rapport. Attendu : live N>0, strippé N=0.
async function walk(prefix) {
  const out = [];
  for (const f of (await fs.listFiles())) {
    if (!f.path.startsWith(prefix + "/")) continue;
    if (/\.(gz|webp|png|jpg|jpeg|gif|mp3|wav|wasm|woff2?|ttf)$/.test(f.path)) continue;
    if (f.path.endsWith("STRIP-REPORT.json")) continue;
    if (f.bytes > 8_000_000) continue;
    out.push(f.path);
  }
  return out;
}
const MARKERS = [
  "SOLO INTIMACY", "DRESSING TRY-ON", "CURIOSITY - ASK MAX", "SCENARIO LOCK",
  "HE IS ASKING - YOU ANSWER", "FORCED DRINKING", "GAGGED MOUTH",
  "THE CRAFT OF DOMINANCE", "A LIVE WOMAN - SHE MOVES", "ACTION, APPETITE, NO STILLNESS",
  "YOUR DONJON IS REAL", "THE WOMEN, THEIR HOME, THEIR INVITATION",
  "STAY THE WOMEN", "CHAIN OF WOMEN", "SOLO MISTRESS", "SOLO NEWCOMER", "SOLO CONTIN",
  "Tender lovemaking", "unbridled sexuality", "lovers of the headcount",
  "bdsm-art-de-dominer", "shows her body in different photo poses",
  "You take your own pleasure in front of him", "you milk yourself",
  "name the material, say where it goes", "Her donjon from the catalogue",
  "gynecological chair with stirrups", "torn frenulum", "17cm x 4cm",
  "You are the lovers", "touch beginning", "contact beginning",
  "le pilori, la chaise gyn", "fuck machine", "machine à traire",
  "He is asking, not playing: this reply explains", "plugs anaux et vaginaux"
];
async function scan(root) {
  const files = await walk(root);
  const hits = [];
  for (const f of files) {
    let t;
    try { t = await fs.readTextFile(f); } catch (e) { continue; }
    const lines = t.split("\n");
    lines.forEach((l, i) => {
      if (l.includes("SFW-STRIP v")) return;
      for (const m of MARKERS) {
        if (l.includes(m)) { hits.push({ f, line: i + 1, marker: m, ctx: l.trim().slice(0, 110) }); }
      }
    });
  }
  const byFile = {};
  hits.forEach((h) => { byFile[h.f] = (byFile[h.f] || 0) + 1; });
  return { root, files: files.length, total: hits.length, byFile, hits: hits.slice(0, 150) };
}
return await scan(typeof ROOT !== "undefined" ? ROOT : "src");
