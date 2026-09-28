// Miroir du corpus (le soir) : telecharge chaque fichier de data/corpus-manifest.json
// (adresse user.uploads.dev) vers son chemin logique (src/...), pour que jsDelivr serve le tout.
// Usage : node scripts/mirror-corpus.mjs  (ecrit sous ./, ne committe pas)
import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
const man = JSON.parse(await readFile("data/corpus-manifest.json", "utf8"));
let ok = 0, fail = [];
for (const [logical, url] of Object.entries(man.files)) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    await mkdir(dirname(logical), { recursive: true });
    await writeFile(logical, buf);
    ok++;
    if (ok % 20 === 0) console.log(ok + "/" + Object.keys(man.files).length);
  } catch (e) { fail.push(logical + " : " + String(e && e.message || e).slice(0, 120)); }
}
console.log("miroir : " + ok + " ok, " + fail.length + " echec");
if (fail.length) { await mkdir("data", { recursive: true }); await writeFile("data/mirror-failures.json", JSON.stringify({ at: new Date().toISOString(), fail }, null, 2)); }
