// Accepte automatiquement une contribution [FICHE] : controle de forme uniquement
// (titre, taille), aucun tri humain. Stocke en quarantaine sous data/contributions/.
import { writeFile, mkdir } from "fs/promises";
const n = process.env.ISSUE_NUMBER || "0";
const title = String(process.env.ISSUE_TITLE || "").slice(0, 140);
const body = String(process.env.ISSUE_BODY || "").slice(0, 20000);
const by = String(process.env.ISSUE_USER || "?").slice(0, 80);
if (!title.startsWith("[FICHE]") || body.trim().length < 40) { console.log("rejetee (forme)"); process.exit(0); }
const rec = { issue: Number(n), by, at: new Date().toISOString(), title: title.replace(/^\[FICHE\]\s*/, ""), body };
await mkdir("data/contributions", { recursive: true });
await writeFile("data/contributions/issue-" + n + ".json", JSON.stringify(rec, null, 2));
console.log("acceptee : issue-" + n);
