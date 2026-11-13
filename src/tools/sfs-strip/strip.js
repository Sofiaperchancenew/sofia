// SFW-STRIP v2 — worker-runnable (global fs fourni par execute_js).
//   const run = new (Object.getPrototypeOf(async function(){}).constructor)(await fs.readTextFile("src/tools/sfw-strip/strip.js"));
//   await run();
// Applique registry.json sur une COPIE vers scratch/sfw-build/ (+ STRIP-REPORT.json).
// Ne touche JAMAIS src/ en place. Ordre : neuters par start DÉCROISSANT par fichier,
// puis dropLines (toutes occurrences), puis replace. Ancre manquante = erreur rapportée.
const REG = "src/tools/sfw-strip/registry.json";
const OUT = "scratch/sfw-build";
const reg = JSON.parse(await fs.readTextFile(REG));
const report = { build: reg.build, ops: [], errors: [] };
const buf = {};
async function load(f) {
  if (!buf[f]) buf[f] = (await fs.readTextFile(f)).split("\n");
  return buf[f];
}
for (const u of (reg.neuter || []).slice().sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : b.start - a.start))) {
  try {
    const lines = await load(u.file);
    const s = u.start - 1;
    const sig = lines[s];
    if (!new RegExp("^\\s*" + u.fn + "\\(").test(sig)) throw new Error("ancre signature absente (" + u.fn + " @ " + u.start + " = " + String(sig).slice(0, 70) + ")");
    const ind = sig.match(/^\s*/)[0];
    let e = -1;
    for (let i = s + 1; i < lines.length; i++) { if (lines[i] === ind + "},") { e = i; break; } }
    if (e < 0) throw new Error("fin de fonction introuvable (" + u.fn + ")");
    lines.splice(s, e - s + 1, sig, ind + "  try { return ''; } catch (e) { return ''; } // SFW-STRIP v2", ind + "},");
    report.ops.push({ op: "neuter", fn: u.fn, file: u.file, removed: e - s - 2 });
  } catch (err) { report.errors.push({ fn: u.fn, error: String(err).slice(0, 170) }); }
}
for (const u of (reg.dropLines || [])) {
  try {
    const lines = await load(u.file);
    let n = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes(u.contains)) { lines.splice(i, 1); n++; }
    }
    if (!n) throw new Error("aucune ligne (" + u.contains.slice(0, 50) + ")");
    report.ops.push({ op: "dropLines", contains: u.contains.slice(0, 60), file: u.file, n });
  } catch (err) { report.errors.push({ fn: u.contains.slice(0, 50), error: String(err).slice(0, 170) }); }
}
for (const u of (reg.replace || [])) {
  try {
    const lines = await load(u.file);
    const t = lines.join("\n");
    if (!t.includes(u.old)) throw new Error("old introuvable");
    report.ops.push({ op: "replace", file: u.file, count: t.split(u.old).length - 1 });
    buf[u.file] = t.split(u.old).join(u.new).split("\n");
  } catch (err) { report.errors.push({ fn: "replace", error: String(err).slice(0, 170) }); }
}
for (const k of Object.keys(buf)) {
  await fs.writeTextFile(OUT + "/" + k, buf[k].join("\n"));
  report.ops.push({ op: "wrote", file: OUT + "/" + k, chars: buf[k].join("\n").length });
}
await fs.writeTextFile(OUT + "/STRIP-REPORT.json", JSON.stringify(report, null, 1));
return report;
