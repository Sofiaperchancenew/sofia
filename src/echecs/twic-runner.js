const zipjs = await import('https://esm.sh/@zip.js/zip.js');
const FROM = 1544, TO = 1481, PER = 2000;
const enc = new TextEncoder();
const hex = (buf) => Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (s) => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
const man = JSON.parse(await fs.readTextFile("src/echecs/manifest.json"));
let twic = (man.bases || []).find((b) => b.id === "twic");
if (!twic) { twic = { id: "twic", nom: "The Week in Chess (archives)", source: "theweekinchess.com/zips (texte integral, numero par numero)", licence: "gratuit (Mark Crowther, usage personnel)", format: "pgn-verbatim-serie", games: 0, numeros: {} }; man.bases.push(twic); }
twic.numeros = twic.numeros || {};
const rem = JSON.parse(await fs.readTextFile("src/echecs/remote.json"));
rem.files = rem.files || {};
let nDone = 0, nDl = 0;
const failed = [];
for (let issue = FROM; issue >= TO; issue--) {
  if (twic.numeros[String(issue)]) continue;
  try {
    const zp = "scratch/chess/twic" + issue + "g.zip";
    let has = true;
    try { await fs.readFile(zp); } catch (e) { has = false; }
    if (!has) {
      const fr = await tools.fetch_url({ url: "https://theweekinchess.com/zips/twic" + issue + "g.zip", path: zp });
      const r2 = fr && fr.result ? fr.result : fr;
      if (!r2 || !(r2.status === 200 || r2.savedTo)) throw new Error("telechargement impossible " + issue);
      nDl++;
    }
    const data = await fs.readFile(zp);
    const reader = new zipjs.ZipReader(new zipjs.Uint8ArrayReader(data));
    const entries = (await reader.getEntries()).filter((e) => !e.directory);
    const pg = entries.find((e) => /\.pgn$/i.test(e.filename)) || entries[0];
    const rawPgn = await pg.getData(new zipjs.TextWriter());
    await reader.close();
    const text = String(rawPgn).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const blocks = text.split(/(?=^\[Event\s)/m).map((s) => s.replace(/\n+$/, "\n")).filter((s) => s.trim().length > 0 && s.includes("["));
    const games = [];
    for (let i = 0; i < blocks.length; i++) {
      const pgn = blocks[i];
      const hdrs = {};
      const hr = /\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]/g;
      let h;
      while ((h = hr.exec(pgn)) !== null) hdrs[h[1]] = h[2];
      games.push({ id: "twic-" + issue + "-" + String(i + 1).padStart(7, "0"), n: i + 1, pgn, h: hdrs, sha: await sha(pgn) });
    }
    const chunks = [];
    for (let i = 0; i < games.length; i += PER) {
      const part = games.slice(i, i + PER);
      const idx = String(Math.floor(i / PER) + 1).padStart(4, "0");
      const logical = "src/echecs/twic/" + issue + "/morceau-" + idx + ".json.gz";
      if (rem.files[logical]) { chunks.push({ logical, url: rem.files[logical], games: part.length, de: part[0].n, a: part[part.length - 1].n, octets: 0, sha: "reprise" }); continue; }
      const body = enc.encode(JSON.stringify({ base: "twic", numero: issue, morceau: idx, de: part[0].n, a: part[part.length - 1].n, parties: part }));
      const zs = new Blob([body]).stream().pipeThrough(new CompressionStream("gzip"));
      const bytes = new Uint8Array(await new Response(zs).arrayBuffer());
      const disk = "scratch/echecs/twic/" + issue + "/morceau-" + idx + ".json.gz";
      await fs.writeFile(disk, bytes);
      const up = await tools.upload_file({ path: disk });
      const u2 = up && up.result ? up.result : up;
      const url = (u2 && (u2.url || u2.href || u2.location)) || (up && (up.url || up.href || up.location));
      if (!url) throw new Error("hebergement echoue " + disk);
      rem.files[logical] = url;
      chunks.push({ logical, url, games: part.length, de: part[0].n, a: part[part.length - 1].n, octets: bytes.length, sha: hex(await crypto.subtle.digest("SHA-256", bytes)) });
    }
    twic.numeros[String(issue)] = { games: games.length, morceaux: chunks };
    twic.games = Object.values(twic.numeros).reduce((s, e) => s + (e.games || 0), 0);
    man.totalGames = man.bases.reduce((s, b) => s + (b.games || 0), 0);
    man.at = new Date().toISOString();
    await fs.writeTextFile("src/echecs/manifest.json", JSON.stringify(man));
    await fs.writeTextFile("src/echecs/remote.json", JSON.stringify(rem));
    nDone++;
  } catch (e) { failed.push(issue + ":" + String((e && e.message) || e).slice(0, 140)); }
}
return { nDone, nDl, failed, twicGames: twic.games, total: man.totalGames, numeros: Object.keys(twic.numeros).length };
