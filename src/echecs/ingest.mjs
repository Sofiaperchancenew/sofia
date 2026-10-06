export async function ingestPgn(opts, fs, tools) {
  const src = opts.src;
  const base = opts.base;
  const nom = opts.nom || base;
  const source = opts.source || "";
  const licence = opts.licence || "";
  const perChunk = opts.perChunk || 500;
  const raw = await fs.readTextFile(src);
  const text = String(raw).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const marks = [];
  const re = /(^|\n)(?=\[Event\s)/g;
  let m;
  while ((m = re.exec(text)) !== null) marks.push(m.index + (m[1] ? m[1].length : 0));
  const blocks = [];
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1] : text.length;
    const b = text.slice(marks[i], end).replace(/\n+$/, "\n");
    if (/\[(White|Black|Result|FEN|SetUp)/.test(b) || /1\.\s*[eNd]/.test(b)) blocks.push(b);
  }
  if (!blocks.length) throw new Error("aucune partie trouvee dans " + src);
  const enc = new TextEncoder();
  const sha = async (s) => {
    const d = await crypto.subtle.digest("SHA-256", enc.encode(s));
    return Array.from(new Uint8Array(d)).map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  const games = [];
  for (let i = 0; i < blocks.length; i++) {
    const pgn = blocks[i];
    const hdrs = {};
    const hr = /\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]/g;
    let h;
    while ((h = hr.exec(pgn)) !== null) hdrs[h[1]] = h[2];
    games.push({ id: base + "-" + String(i + 1).padStart(7, "0"), n: i + 1, pgn, h: hdrs, sha: await sha(pgn) });
  }
  const gz = async (obj) => {
    const bytes = enc.encode(JSON.stringify(obj));
    const zs = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(zs).arrayBuffer());
  };
  const chunks = [];
  for (let i = 0; i < games.length; i += perChunk) {
    const part = games.slice(i, i + perChunk);
    const idx = String(Math.floor(i / perChunk) + 1).padStart(4, "0");
    const logical = "src/echecs/" + base + "/morceau-" + idx + ".json.gz";
    const body = { base, morceau: idx, de: part[0].n, a: part[part.length - 1].n, parties: part };
    const bytes = await gz(body);
    const disk = "scratch/echecs/" + base + "/morceau-" + idx + ".json.gz";
    await fs.writeFile(disk, bytes);
    const up = await tools.upload_file({ path: disk });
    const url = up.url || up.href || up.location;
    if (!url) throw new Error("hebergement echoue pour " + disk + " : " + JSON.stringify(up).slice(0, 200));
    const csha = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((x) => x.toString(16).padStart(2, "0")).join("");
    chunks.push({ logical, url, games: part.length, de: part[0].n, a: part[part.length - 1].n, octets: bytes.length, sha: csha });
  }
  const man = JSON.parse(await fs.readTextFile("src/echecs/manifest.json"));
  man.bases = (man.bases || []).filter((b) => b.id !== base);
  man.bases.push({ id: base, nom, source, licence, format: "pgn-verbatim", games: games.length, morceaux: chunks, premier: games[0].id, dernier: games[games.length - 1].id });
  man.totalGames = man.bases.reduce((s, b) => s + (b.games || 0), 0);
  man.at = new Date().toISOString();
  await fs.writeTextFile("src/echecs/manifest.json", JSON.stringify(man));
  const rem = JSON.parse(await fs.readTextFile("src/echecs/remote.json"));
  rem.files = rem.files || {};
  for (const c of chunks) rem.files[c.logical] = c.url;
  await fs.writeTextFile("src/echecs/remote.json", JSON.stringify(rem));
  return { base, games: games.length, morceaux: chunks.length, total: man.totalGames };
}
