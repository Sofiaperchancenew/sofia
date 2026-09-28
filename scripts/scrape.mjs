import { writeFile, mkdir } from "fs/promises";
const out = {
  updated: new Date().toISOString(),
  wikipedia: null,
  meteo: null
};
try {
  const w = await fetch("https://fr.wikipedia.org/api/rest_v1/page/summary/Intelligence_artificielle").then(r => r.json());
  out.wikipedia = { title: w.title, extract: w.extract?.slice(0, 2000) };
} catch (e) { out.wikipedia = { error: String(e).slice(0, 200) }; }
try {
  const m = await fetch("https://api.open-meteo.com/v1/forecast?latitude=48.85&longitude=2.35&current=temperature_2m").then(r => r.json());
  out.meteo = m.current;
} catch (e) { out.meteo = { error: String(e).slice(0, 200) }; }
await mkdir("data", { recursive: true });
await writeFile("data/sofia-data.json", JSON.stringify(out, null, 2));
console.log("ok");
