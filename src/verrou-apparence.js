/* ============================================================================
   Sofia — VERROU D'APPARENCE.  Aucune donnée figée.
   La fiche est la seule source. Un appel au modèle, une seule fois, la traduit
   en un verrou anglais figé : ancrage, rappel, négatifs, assertions.
   Ensuite : concaténation pure. Aucun dictionnaire, aucune regex de genre,
   aucune liste de parties du corps.
   ========================================================================== */
(function () {
  "use strict";
  var F = window.SofiaFiches;
  if (!F || F.verrou) return;

  var META = ["cle", "cree", "maj", "vu", "hist", "source", "verrou", "ancrage",
              "rappel", "portrait", "portraitPrompt", "correctifs", "seed", "traductions"];

  var CONSIGNE = [
    "Tu reçois la fiche complète d'un personnage de fiction, dans une langue quelconque.",
    "Tu produis son VERROU D'APPARENCE : de quoi le décrire à un modèle d'image toujours de la",
    "même façon, mot pour mot, pendant toute l'histoire.",
    "",
    "Règles absolues :",
    "1. Tu n'inventes RIEN. Un champ absent reste ouvert, tu ne le combles pas.",
    "2. Tu ne présupposes aucun âge, aucune couleur, aucune morphologie non écrite.",
    "3. Le personnage peut être n'importe quoi : humain, enfant, vieillard, androgyne, trans,",
    "   intersexe, robot, animal, créature, plante, objet animé. Tu t'adaptes à la fiche,",
    "   jamais à un modèle préétabli. S'il a quatre bras, des ailes ou une queue, tu le dis.",
    "4. L'ancrage est en ANGLAIS, figé, du trait le plus identifiant au moins identifiant. 30 à 70 mots.",
    "5. Les négatifs listent en anglais ce que ce personnage ne doit JAMAIS avoir, en incluant les",
    "   confusions probables. Si la fiche n'exclut rien, tu n'exclus que ce qui la contredirait.",
    "6. Les assertions sont les 3 à 8 traits qu'un œil doit pouvoir vérifier sur une image.",
    "   Chacune a un attendu et un interdit, en français simple. C'est la base du contrôle visuel.",
    "7. Si la fiche est muette sur un point nécessaire (souvent le sexe), tu déduis du nom et du",
    "   reste, et tu listes ce que tu as déduit dans deductions.",
    "",
    "Réponds uniquement par ce JSON compact, sans texte autour :",
    '{"sexe_apparent":"libellé court et libre, ex: homme, femme, androgyne, robot, enfant",',
    ' "deductions":["ce que tu as dû supposer"],',
    ' "ancrage":"...",',
    ' "rappel":"4 à 8 mots anglais, à replacer en fin de prompt",',
    ' "negatifs":"...",',
    ' "tenue_en":"tenue actuelle en anglais, ou null si la fiche n en dit rien",',
    ' "traductions":{"valeur de la fiche":"english"},',
    ' "assertions":[{"id":"court","attendu":"...","interdit":"..."}]}'
  ].join("\n");

  function payload(f) {
    var o = {};
    Object.keys(f).forEach(function (k) { if (META.indexOf(k) === -1) o[k] = f[k]; });
    return JSON.stringify(o, null, 1);
  }
  function empreinte(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function json(txt) {
    try { return JSON.parse(String(txt).replace(/^[^{]*/, "").replace(/[^}]*$/, "")); }
    catch (e) { return null; }
  }
  async function patch(nom, obj) {
    var f = await F.get(nom);
    if (!f) return null;
    Object.keys(obj).forEach(function (k) { f[k] = obj[k]; });
    f.maj = Date.now();
    return F.upsert(f);
  }

  async function forger(nom, o) {
    o = o || {};
    if (!o.llm) throw new Error("il faut fournir o.llm (appel texte)");
    var f = await F.get(nom);
    if (!f) return null;
    var p = payload(f);
    var v = json(await o.llm(CONSIGNE + "\n\nFICHE :\n" + p));
    if (!v || !v.ancrage) throw new Error("verrou illisible pour " + nom);
    v._empreinte = empreinte(p);
    await patch(nom, {
      verrou: v,
      ancrage: v.ancrage,
      rappel: v.rappel,
      negatifs_figes: v.negatifs || "",
      traductions: Object.assign({}, f.traductions || {}, v.traductions || {}),
      seed: f.seed == null ? Math.floor(Math.random() * 4294967295) : f.seed
    });
    return v;
  }

  async function verrouAJour(nom, o) {
    var f = await F.get(nom);
    if (!f) return null;
    var emp = empreinte(payload(f));
    if (f.verrou && f.verrou._empreinte === emp) return f.verrou;
    return forger(nom, o);
  }

  async function trad(f, val, llm) {
    val = String(val == null ? "" : val).trim();
    if (!val) return "";
    var t = f.traductions || {};
    if (t[val]) return t[val];
    var out = await llm("Traduis en anglais pour un prompt d'image, 2 à 6 mots, sans ponctuation finale, sans phrase : " + val);
    var en = String(out).trim().replace(/^["']|["'.]$/g, "");
    t[val] = en;
    await patch(f.nom, { traductions: t });
    return en;
  }

  async function composer(nom, action, decor, o) {
    o = o || {};
    var f = await F.get(nom);
    if (!f) return null;
    var v = f.verrou || await verrouAJour(nom, o);
    f = await F.get(nom);

    var bouts = [v.ancrage];

    var vet = (f.vetements || []).map(function (x) {
      return [x.couleur, x.nom, x.etat].filter(Boolean).join(" ");
    }).filter(Boolean).join(", ");
    var tenue = o.tenue || vet || v.tenue_en;
    if (tenue) bouts.push(await trad(f, tenue, o.llm));
    if (action) bouts.push(await trad(f, action, o.llm));
    if (decor) bouts.push("in " + await trad(f, decor, o.llm));
    if (o.cadrage) bouts.push(o.cadrage);
    if (o.lumiere) bouts.push(o.lumiere);
    if (o.style) bouts.push(o.style);
    bouts.push(v.rappel);

    var neg = [v.negatifs].concat(f.correctifs || []).filter(Boolean).join(", ");
    return { prompt: bouts.filter(Boolean).join(", ").replace(/\s*,\s*/g, ", "), negative: neg };
  }

  var Q = 'Vérifie chaque affirmation sur la personne de cette image. Réponds uniquement par un JSON '
        + 'compact : {"resultats":[{"id":"...","etat":"vrai|faux|invisible"}],"coherent":true|false} '
        + 'coherent=false dès qu une affirmation est fausse. Affirmations : ';

  async function controler(mediaId, f, vision) {
    var a = (f.verrou && f.verrou.assertions) || [];
    if (!a.length || !vision) return null;
    return json(await vision(mediaId, Q + JSON.stringify(a)));
  }

  function reparer(f, rap) {
    var a = (f.verrou && f.verrou.assertions) || [], c = f.correctifs || [];
    ((rap && rap.resultats) || []).forEach(function (r) {
      if (r.etat !== "faux") return;
      var ass = a.filter(function (x) { return x.id === r.id; })[0];
      if (ass && ass.interdit) c.push(ass.interdit);
      else if (ass) c.push("pas " + ass.attendu);
    });
    f.correctifs = c.filter(function (x, i) { return c.indexOf(x) === i; }).slice(-8);
    return f.correctifs;
  }

  async function planche(nom, o) {
    o = o || {};
    var f = await F.get(nom);
    if (!f) return null;
    var v = f.verrou || await verrouAJour(nom, o);
    f = await F.get(nom);
    var p = [
      v.ancrage,
      o.cadre || "character reference sheet, one single person, no duplicate",
      o.pose || "neutral standing pose, arms slightly away from the body",
      o.plan || "full body shot, head to toe, centered",
      o.fond || "plain mid-grey studio background, even soft lighting",
      o.style || "photorealistic, sharp focus, no props, no text",
      v.rappel
    ].filter(Boolean).join(", ");
    var neg = [v.negatifs].concat(f.correctifs || []).filter(Boolean).join(", ");
    var img = await (o.generer || genererImage)({ prompt: p, negative: neg, seed: f.seed });
    if (o.vision && o.verifier !== false) {
      var rap = await controler(img, f, o.vision);
      if (rap && rap.coherent === false) { reparer(f, rap); await patch(nom, { correctifs: f.correctifs }); }
    }
    await patch(nom, { portrait: img, portraitPrompt: p });
    return img;
  }

  async function generer(nom, action, decor, o) {
    o = o || {};
    var f = await F.get(nom);
    if (!f) return null;
    var p = await composer(nom, action, decor, o);
    var img = await (o.generer || genererImage)({ prompt: p.prompt, negative: p.negative, seed: f.seed, mediaId: f.portrait });
    if (o.vision && o.verifier !== false) {
      f = await F.get(nom);
      var rap = await controler(img, f, o.vision);
      if (rap && rap.coherent === false) {
        reparer(f, rap);
        await patch(nom, { correctifs: f.correctifs });
        var p2 = await composer(nom, action, decor, o);
        img = await (o.generer || genererImage)({ prompt: p2.prompt, negative: p2.negative, seed: f.seed, mediaId: f.portrait, retry: true });
      }
    }
    return img;
  }

  async function genererImage(o) {
    var r = await fetch("https://api.venice.ai/api/v1/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + (window.VENICE_API_KEY || "") },
      body: JSON.stringify({
        model: o.model || "flux-dev",
        prompt: o.prompt,
        negative_prompt: o.negative,
        seed: o.seed,
        width: o.width || 768,
        height: o.height || 1152,
        format: "webp"
      })
    });
    var j = await r.json();
    return j && j.images && j.images[0];
  }

  F.verrou = {
    forger: forger,
    maj: verrouAJour,
    composer: composer,
    controler: controler,
    reparer: reparer,
    planche: planche,
    generer: generer,
    trad: trad,
    oublier: function (nom) { return patch(nom, { correctifs: [] }); },
    refaire: function (nom, o) { return patch(nom, { verrou: null, ancrage: null }).then(function () { return forger(nom, o); }); },
    CONSIGNE: CONSIGNE
  };
})();
