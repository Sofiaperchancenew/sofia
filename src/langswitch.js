// Bascule de langue en langage naturel (demande du propriétaire) :
// "mets Sofia en allemand", "passe tout en allemand", "parle-moi en anglais",
// "switch to German", "stell mich auf Deutsch um" ... basculent TOUT :
// interface (choix explicite, comme les réglages), langue des réponses de
// Sofia, voix de lecture et micro en direct. D'une langue à l'autre.
//
// Intercepte AVANT la radio (src/medias.js) : "mets ... en allemand"
// déclenchait sinon une recherche de station allemande.
export function attachLangSwitch(App) {
  const CODES = ["en", "de", "es", "fr", "it", "pl"];
  // Noms et adjectifs reconnus par langue cible (minuscules, sans accents).
  const NAMES = {
    de: ["allemand", "allemande", "german", "deutsch", "aleman", "tedesco"],
    en: ["anglais", "anglaise", "english", "englisch", "ingles", "inglese"],
    fr: ["francais", "français", "francaise", "française", "french", "franzosisch", "französisch", "frances", "francés", "francese"],
    es: ["espagnol", "espagnole", "spanish", "spanisch", "espanol", "español", "spagnolo"],
    it: ["italien", "italienne", "italian", "italienisch", "italiano"],
    pl: ["polonais", "polonaise", "polish", "polski", "polnisch", "polaco", "polacco", "polszczyzna"]
  };
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Variante insensible aux accents pour construire les motifs.
  const alt = (code) => NAMES[code].map((w) => norm(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

  // Ce qui N'EST PAS une bascule : traductions, médias, cours, définitions.
  // (testés sur le texte normalisé : sans accents, minuscules)
  const NOT_SWITCH = [
    /traduis|traduire|traduction|translate|ubersetz|traduc/i,
    /radio|station|musique|music|chanson|podcast|playlist/i,
    /cours|lecon|apprendre|apprends|learn|unterricht/i,
    /comment|dit-on|how do you say|veut dire|what does/i,
    /(cette|ce|cet)\s+(phrase|texte|mot)\b/i
  ];

  function codeInText(t, namesAlt) {
    for (const c of CODES) {
      if (new RegExp("(^|\\W)(" + alt(c) + ")(\\W|$)", "i").test(t)) {
        // Vérifie que le nom trouvé est bien celui attendu pour ce motif.
        if (new RegExp("(^|\\W)(" + namesAlt + ")(\\W|$)", "i").test(t)) return c;
      }
    }
    return null;
  }

  // Motif reconnu, mais commande FRAÎCHE ? Une ligne recréée par un
  // rechargement d'historique (changement de langue, navigation) porte un
  // message déjà ancien : on l'ignore. Seule une demande vraiment tapée
  // (message utilisateur horodaté de quelques secondes) bascule la langue.
  // Sans ça, les vieux « mets en allemand » de l'historique rebasculent
  // tout seuls à chaque rechargement — boucle.
  function freshCommand(n) {
    try {
      const st = App.State, now = Date.now();
      const cur = st && st.sessions && st.sessions.find(function (s) { return s.id === st.currentSessionId; });
      const msgs = (cur && cur.messages) || [];
      for (let i = msgs.length - 1; i >= 0 && i >= msgs.length - 8; i--) {
        const m = msgs[i];
        if (m && m.role === "user" && typeof m.content === "string"
            && String(m.content).trim().slice(0, 300) === n.slice(0, 300)) {
          const age = now - (+m.ts || 0);
          return age >= 0 && age < 20000;
        }
      }
    } catch (e) {}
    return false;
  }

  // Le texte ressemble-t-il à une bascule, fraîche ou non ? Sert à avaler les
  // vieux doublons d'historique (ni langue, ni radio) dans src/medias.js.
  function claims(text) {
    const t = String(text || "").trim();
    if (!t || t.length > 220) return null;
    const n = norm(t);
    for (const ex of NOT_SWITCH) {
      try { if (ex.test(n)) return null; } catch (e) {}
    }
    const ALL = CODES.map(alt).join("|");
    const pats = [
      // FR : "mets Sofia en allemand", "passe tout en allemand", "met en langue allemande"
      new RegExp("(mets?|mettez|passe|passez|bascule|basculer|change|changer|switch)\\b[^?!;]{0,60}\\ben\\s+(langue\\s+)?(" + ALL + ")\\b", "i"),
      // FR : "parle-moi en allemand", "parle en anglais"
      new RegExp("parle?(?:-moi|\\s+moi)?\\s+en\\s+(langue\\s+)?(" + ALL + ")\\b", "i"),
      // FR : "tout en allemand", "sofia en allemand"
      new RegExp("(tout|toute|sofia)\\s+en\\s+(langue\\s+)?(" + ALL + ")\\b", "i"),
      // EN : "switch to German", "speak to me in German", "everything in German"
      new RegExp("(switch|change|put|set)\\b[^?!;]{0,50}\\b(to|into)\\s+(" + ALL + ")\\b", "i"),
      new RegExp("speak\\s+(to\\s+me\\s+)?in\\s+(" + ALL + ")\\b", "i"),
      new RegExp("everything\\s+in\\s+(" + ALL + ")\\b", "i"),
      // DE : "stell mich auf Deutsch um", "sprich auf Deutsch"
      new RegExp("(stell|stelle|wechsel|wechsle|schalte)\\b[^?!;]{0,50}\\bauf\\s+(" + ALL + ")\\b", "i"),
      new RegExp("sprich\\s+(mit\\s+mir\\s+)?auf\\s+(" + ALL + ")\\b", "i"),
      new RegExp("sofia\\s+auf\\s+(" + ALL + ")\\b", "i"),
      // ES : "cambia al alemán", "háblame en alemán"
      new RegExp("cambia\\b[^?!;]{0,50}\\bal\\s+(" + ALL + ")\\b", "i"),
      new RegExp("habla(me)?\\s+en\\s+(" + ALL + ")\\b", "i"),
      // IT : "cambia in tedesco", "parlami in tedesco"
      new RegExp("cambia\\b[^?!;]{0,50}\\bin\\s+(" + ALL + ")\\b", "i"),
      new RegExp("parla(mi)?\\s+in\\s+(" + ALL + ")\\b", "i")
    ];
    for (const p of pats) {
      let m = null;
      try { m = n.match(p); } catch (e) { continue; }
      if (m) {
        const code = codeInText(n, ALL);
        if (code) return { code: code };
      }
    }
    return null;
  }

  // Bascule effective : motif reconnu ET commande fraîchement tapée.
  function detect(text) {
    const t = String(text || "").trim();
    if (!t) return null;
    const hit = claims(t);
    if (!hit) return null;
    try {
      if (freshCommand(norm(t))) return hit;
    } catch (e) {}
    return null;
  }

  const CONFIRM = {
    de: "Verstanden — alles ist jetzt auf Deutsch: Oberfläche, meine Antworten und die Stimme (falls aktiviert). Zum Zurückwechseln sag z. B. « Stell mich auf Französisch um ».",
    en: "Got it — everything is now in English: interface, my replies and the voice (if enabled). To switch back, say e.g. « Mets-moi en français ».",
    fr: "Compris — tout est en français : interface, mes réponses et la voix (si activée). Pour changer, dis par ex. « Mets-moi en allemand ».",
    es: "Entendido — todo está ahora en español: interfaz, mis respuestas y la voz (si está activada). Para volver, di por ej. « Mets-moi en français ».",
    it: "Capito — ora è tutto in italiano: interfaccia, risposte e voce (se attiva). Per tornare indietro, di' ad es. « Mets-moi en français ».",
    pl: "Rozumiem — wszystko jest teraz po polsku: interfejs, moje odpowiedzi i głos (jeśli włączony). Aby zmienić, powiedz np. « Ustaw francuski »."
  };
  const FLAG = { de: "🇩🇪", en: "🇬🇧", fr: "🇫🇷", es: "🇪🇸", it: "🇮🇹", pl: "🇵🇱" };

  function postConfirm(code) {
    try {
      const list = document.querySelector("#messageListEl");
      if (!list) return;
      const row = document.createElement("div");
      row.className = "messageRow assistantRow";
      const wrap = document.createElement("div");
      wrap.className = "msgWrapper";
      const body = document.createElement("div");
      body.className = "messageContent markdown-content";
      const p = document.createElement("div");
      p.textContent = (FLAG[code] || "") + " " + (CONFIRM[code] || CONFIRM.en);
      body.appendChild(p);
      wrap.appendChild(body);
      row.appendChild(wrap);
      list.appendChild(row);
      const sc = document.querySelector("#chatHistoryCtn");
      if (sc) sc.scrollTop = sc.scrollHeight;
    } catch (e) {}
  }

  function apply(code) {
    if (!code || CODES.indexOf(code) < 0) return false;
    // Coupe-circuit anti-boucle (vaut aussi pour un appelant sans garde) :
    // pendant le rechargement d'historique qui suit une bascule, tout
    // ré-appel est un écho — on l'ignore.
    try { if (Date.now() < (App.LangSwitch._quietUntil || 0)) return false; } catch (e) {}
    let prev = "";
    try { prev = String((App.State.settings && App.State.settings.language) || "en").slice(0, 2).toLowerCase(); } catch (e) {}
    if (prev === code) { postConfirm(code); return true; }
    // Garde anti-retraitement : setLanguage recharge l'historique (lignes
    // recréées sans marque) — l'observateur médias les reverrait comme neuves.
    // Sans garde, l'ancien message rebascule à chaque fois (boucle).
    App.LangSwitch._quietUntil = Date.now() + 10000;
    try { App.UI.setLanguage(code); } catch (e) { return false; }
    try {
      const st = App.State.settings || {};
      // Voix épinglée manuellement vers l'ancienne langue : retour en auto (suit la langue).
      const uri = String(st.ttsVoiceURI || "");
      if (uri && App.Voice && typeof App.Voice.loadVoices === "function") {
        let vs = null;
        try { vs = App.Voice.loadVoices() || []; } catch (eV) { vs = []; }
        let found = null;
        for (const v of vs) { if ((v.voiceURI || v.name) === uri) { found = v; break; } }
        const vl = found ? String(found.lang || "").slice(0, 2).toLowerCase() : "";
        if (vl && vl !== code) {
          st.ttsVoiceURI = "";
          try { if (typeof App.Voice.populateVoiceSelect === "function") App.Voice.populateVoiceSelect(); } catch (eP) {}
        }
      }
      // Région vocale épinglée vers l'ancienne langue : on libère.
      const reg = String(st.voiceRegion || "");
      if (reg && reg.slice(0, 2).toLowerCase() !== code) st.voiceRegion = "";
      // Micro en direct épinglé sur l'ancienne langue : retour en auto (suit l'appli).
      const ll = String(st.liveListenLang || "auto");
      if (ll !== "auto" && ll.slice(0, 2).toLowerCase() === prev && prev !== code
          && App.Voice && typeof App.Voice.setLiveLang === "function") {
        App.Voice.setLiveLang("auto");
      }
      try { if (App.Data && typeof App.Data.saveSettings === "function") App.Data.saveSettings(); } catch (eS) {}
    } catch (e) {}
    postConfirm(code);
    return true;
  }

  App.LangSwitch = { detect: detect, claims: claims, apply: apply, _quietUntil: 0 };
  try { globalThis.SofiaLangSwitch = App.LangSwitch; } catch (e) {}
}
