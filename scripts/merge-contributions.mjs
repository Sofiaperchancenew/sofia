// Assemble les contributions acceptees en src/contributions/texte.json.gz (quarantaine :
// contributions d'utilisateurs, pas corpus verifie). Tourne dans le workflow du soir.
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { gzipSync } from "zlib";
let files = [];
try { files = (await readdir("data/contributions")).filter(f => f.endsWith(".json")); } catch (e) {}
const sections = [];
const docs = [];
for (const f of files.sort()) {
  try {
    const r = JSON.parse(await readFile("data/contributions/" + f, "utf8"));
    const m = /^issue-(\d+)\.json$/.exec(f);
    docs.push({ label: "Contribution #" + (m ? m[1] : f) + " par " + (r.by || "?"), date: r.at || "" });
    sections.push({ t: String(r.title || f).slice(0, 140), p: m ? Number(m[1]) : 0, x: String(r.body || "").slice(0, 1500) });
  } catch (e) {}
}
await mkdir("src/contributions", { recursive: true });
const out = { title: "Contributions des utilisateurs (non verifiees)", docs, sections };
await writeFile("src/contributions/texte.json.gz", gzipSync(JSON.stringify(out)));
console.log("contributions : " + sections.length + " fiche(s)");
