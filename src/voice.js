import { LANGUAGES, normLang, isKnownLang } from "./languages.js";

export function attachVoice(App, deps = {}) {
  const win = typeof window !== "undefined" ? window : {};
  const speech = win.speechSynthesis || null;
  const SR = win.SpeechRecognition || win.webkitSpeechRecognition || null;

  // Ronde 131 : pour chaque langue, un tag BCP-47 complet AVEC région. Les
  // langues nucléaires apportent leur région entretenue ; les langues mondiales ne portent
  // souvent que l'abréviation ("sw"). Intl complète alors la région probable
  // (sw -> sw-Latn-KE -> sw-KE), afin que la sortie vocale trouve la voix
  // nationale appropriée, au lieu de revenir à en-US.
  function likelyTag(code) {
    try {
      const parts = String(new Intl.Locale(String(code)).maximize().baseName).split("-");
      const out = [parts[0]];
      for (const p of parts.slice(1)) { if (p.length === 2 || /^[0-9]{3}$/.test(p)) { out.push(p); break; } }
      return out.join("-");
    } catch (e) { return String(code || ""); }
  }
  const LANG_MAP = {};
  for (const l of LANGUAGES) {
    let tag = String(l.bcp47 || "").trim();
    if (!tag || tag.indexOf("-") === -1) tag = likelyTag(l.code) || tag || l.code;
    LANG_MAP[l.code] = tag;
  }
  const TEST_PHRASE = {
    en: "Hello, I'm Sofia. This is how I sound.",
    de: "Hallo, ich bin Sofia. So klinge ich.",
    es: "Hola, soy Sofia. Así suena mi voz.",
    fr: "Bonjour, je suis Sofia. Voici ma voix.",
    it: "Ciao, sono Sofia. Questa è la mia voce.",
    pt: "Olá, sou a Sofia. É assim que eu soo.",
    nl: "Hallo, ik ben Sofia. Zo klink ik.",
    pl: "Cześć, jestem Sofia. Tak brzmi mój głos.",
    cs: "Ahoj, jsem Sofia. Tak zní můj hlas.",
    sk: "Ahoj, som Sofia. Takto znie môj hlas.",
    hu: "Szia, Sofia vagyok. Így hangzik a hangom.",
    ro: "Bună, sunt Sofia. Așa sună vocea mea.",
    bg: "Здравей, аз съм Sofia. Така звучи гласът ми.",
    hr: "Bok, ja sam Sofia. Ovako zvuči moj glas.",
    sr: "Здраво, ја сам Sofia. Овако звучи мој глас.",
    el: "Γεια σου, είμαι η Sofia. Έτσι ακούγεται η φωνή μου.",
    tr: "Merhaba, ben Sofia. Sesim böyle.",
    ru: "Привет, я Sofia. Вот как звучит мой голос.",
    uk: "Привіт, я Sofia. Ось як звучить мій голос.",
    sv: "Hej, jag är Sofia. Så här låter jag.",
    da: "Hej, jeg er Sofia. Sådan lyder jeg.",
    nb: "Hei, jeg er Sofia. Sånn høres jeg ut.",
    fi: "Hei, olen Sofia. Tältä ääneni kuulostaa.",
    ar: "مرحبًا، أنا صوفيا. هكذا يبدو صوتي.",
    he: "שלום, אני סופיה. כך נשמע הקול שלי.",
    fa: "سلام، من سوفیا هستم. صدای من اینگونه است.",
    ur: "سلام، میں صوفیہ ہوں۔ میری آواز ایسی ہے۔",
    hi: "नमस्ते, मैं सोफिया हूँ। मेरी आवाज़ ऐसी है।",
    bn: "হ্যালো, আমি সোফিয়া। আমার কণ্ঠস্বর এমন।",
    zh: "你好，我是 Sofia。这就是我的声音。",
    ja: "こんにちは、Sofiaです。これが私の声です。",
    ko: "안녕하세요, 저는 Sofia입니다. 제 목소리는 이렇습니다.",
    vi: "Xin chào, tôi là Sofia. Giọng tôi nghe như thế này.",
    th: "สวัสดี ฉันคือ Sofia เสียงของฉันเป็นแบบนี้",
    id: "Halo, saya Sofia. Beginilah suara saya.",
    ms: "Helo, saya Sofia. Beginilah bunyi suara saya."
  };
  const FEMALE_HINTS = ["female", "femme", "zira", "samantha", "victoria", "karen", "moira", "tessa", "fiona", "serena", "allison", "ava", "susan", "catherine", "amelie", "amélie", "anna", "aria", "jenny", "michelle", "sonia", "natasha", "clara", "emma", "milena", "elsa", "helena", "sara", "laura"];
  const MALE_HINTS = ["male", "homme", "david", "daniel", "mark", "alex", "fred", "thomas", "diego", "jorge", "luca", "xander", "rishi", "yuri", "george", "james", "oliver", "ryan", "paul", "pierre", "marco", "juan", "carlos"];

  // ---------------------------------------------------------------------------
  //  Reconnaissance de la langue pour la sortie vocale (Ronde 80)
  //  Sofia répond dans la langue de l'utilisateur – c'est précisément cette
  //  réponse qui doit être lue, même si l'interface est actuellement dans une
  //  autre langue (réponse polonaise avec interface française). C'est pourquoi la
  //  langue est déterminée PHRASE PAR PHRASE à partir du texte, et non à partir des paramètres : une
  //  phrase polonaise obtient la voix polonaise, la suivante française
  //  à nouveau la voix française – tout cela automatiquement. D'abord le système d'écriture
  //  (cyrillique, arabe, CJK …), puis pour l'écriture latine, les mots fréquents
  //  plus les lettres caractéristiques. Si la certitude ne suffit pas, on conserve
  //  la voix de l'interface (et donc le volume/la voix précédents).
  // ---------------------------------------------------------------------------
  const SPEECH_WORDS = {
    en: "the and you that have for not with this but his from they her she will your would there their what about which them could should does please thank hello today tomorrow yesterday because always never good very much well something anything everything really maybe okay sorry thanks".split(" "),
    fr: "les des une est que qui dans pour pas plus avec sur elle nous vous ils elles mon ton son notre votre leur mais donc très bien bonjour merci être avoir faire aller oui non comme tout tous aussi quand pourquoi comment moi toi lui sont était étaient suis sommes êtes avez ont avons cette ces peut veux veut sais sait chose toujours jamais maintenant demain hier beaucoup trop peu encore déjà voilà alors depuis pendant vraiment".split(" "),
    es: "los las del que por con pero como para todo muy más usted este esta estos estas hola gracias bueno bien mal hoy mañana ayer cuando donde porque también siempre nunca ahora aquí estoy está están tengo tener quiero hacer puedo poder saber decir ver ser estar haber tiene tienes favor entiendo entonces algo nada mucho poco".split(" "),
    it: "gli che chi cui dove come quando perché anche non uno una ciao grazie buongiorno bene male molto oggi domani ieri essere avere fare potere volere sapere dire vedere andare venire questo questa questi queste quello quella sono siamo siete abbiamo avete hanno cosa stare vero bello bella amico amica allora niente qualcosa sempre ancora".split(" "),
    pt: "que não uma com para como mas muito você vocês obrigado obrigada bom boa hoje amanhã ontem quando onde porque também sempre nunca agora aqui estou está estão tenho quero fazer posso saber dizer ver ser estar então algo nada tudo isso aquilo".split(" "),
    nl: "het een van dat niet met voor aan zijn ook maar door naar bij uit over dan nog wel geen kan moet wil zeer goed slecht hallo dank bedankt nee wat hoe waar wanneer waarom wie dit deze mijn jouw haar ons hun wij jullie zij iets niets alles altijd nooit nu hier daar vandaag morgen gisteren".split(" "),
    pl: "nie tak jest się jak ale dla tym już tylko bardzo może kiedy gdzie dlaczego więc też jeszcze tutaj ona oni ten mój twój nasz wasz czy był była było być mam masz dziękuję cześć dobry dzień dobranoc proszę przepraszam który która które jestem jesteś albo gdy żeby dlatego właśnie zawsze nigdy teraz potem jakiś coś nic wszystko prawda kocham lubię wiem wiesz chcę chcesz mogę możesz jutro dzisiaj wczoraj świetnie wspaniale naprawdę dzięki pozdrawiam oczywiście".split(" "),
    cs: "jsem jsi není ale jako tak jen velmi může když kde proč protože také ještě tady ona oni ten můj tvůj náš děkuji ahoj dobrý prosím který která které něco nic všechno vždy nikdy teď potom dnes zítra včera mám máš chci chceš můžu můžeš proto".split(" "),
    sk: "som si nie ale ako tak len veľmi môže keď kde prečo pretože tiež ešte ona oni ten môj tvoj náš ďakujem ahoj dobrý prosím ktorý ktorá ktoré niečo nič všetko vždy nikdy teraz potom dnes zajtra včera mám máš chcem chceš môžem môžeš preto".split(" "),
    hu: "hogy nem egy van meg mint még csak már nagyon lehet ha hol miért mert vagy itt ott én vagyok ő mi ti ők jó rossz szia köszönöm igen ma holnap tegnap amikor ahol így úgy valami semmi minden mindig soha most aztán".split(" "),
    ro: "este sunt nu dar sau care ceva nimic tot mereu niciodată acum astăzi mâine ieri când unde pentru mulțumesc bună salut da bine rău foarte poate aici acolo vreau vrei pot poți știu știi avem aveți".split(" "),
    tr: "bir için ile çok ama değil ben sen biz siz onlar evet hayır merhaba teşekkür iyi kötü bugün yarın dün nasıl nerede neden çünkü şimdi burada orada hiçbir herşey herzaman asla istiyorum biliyorum teşekkürler".split(" "),
    sv: "och att det som ett är för med den har inte jag han hon men eller när var varför hur också bara redan mycket bra dålig hej tack nej idag imorgon igår något inget allt alltid aldrig nu här där vill vet kan måste".split(" "),
    da: "og at det som er for med den har ikke jeg han hun men eller når hvor hvorfor hvordan også kun allerede meget god dårlig hej tak nej idag imorgon igår noget intet alt altid aldrig nu her der vil ved kan skal".split(" "),
    nb: "og at det som er for med den har ikke jeg han hun men eller når hvor hvorfor hvordan også bare allerede veldig bra dårlig hei takk nei idag imorgon igår noe ingenting alt alltid aldri nå her der vil vet kan må".split(" "),
    fi: "ja on ei että joka mutta tai kun missä miksi koska myös vain jo hyvin voi olen olet olemme olette ovat minä sinä hän me te he tämä tuo hyvä paha hei kiitos kyllä tänään huomenna eilen nyt täällä siellä jotain kaikki aina sinulle kuuluu iloinen nähdä kuinka paljon vielä sitten".split(" "),
    vi: "và là của có không một trong cho với này đó được người tôi bạn anh chị em chúng họ nhưng khi đâu tại vì cũng chỉ rất tốt xấu cảm ơn vâng hôm nay mai qua bây giờ đây kia gì thì mà".split(" "),
    id: "dan yang dengan ini itu tidak ada saya kamu dia kami kita mereka tetapi atau karena juga hanya sudah sangat baik buruk halo terima kasih hari besok kemarin sekarang sini sana sesuatu semua selalu".split(" "),
    ms: "dan yang dengan ini itu tidak ada saya kamu dia kami kita mereka tetapi atau kerana juga hanya sudah sangat baik buruk helo terima kasih hari esok semalam sekarang sini sana sesuatu semua selalu".split(" ")
  };
  // Lettres qui n'existent que dans une seule langue (ou presque) : elles pèsent lourd.
  const SPEECH_SIGNS = [
    [/[ąćęłńśźż]/g, "pl", 3],
    [/[řěů]/g, "cs", 3],
    [/[ľĺŕ]/g, "sk", 3],
    [/[őű]/g, "hu", 3],
    [/[ăâîșț]/g, "ro", 3],
    [/[ğış]/g, "tr", 3],
    [/[ãõ]/g, "pt", 3],
    [/[ơưđ]/g, "vi", 3],
    [/[ñ¿¡]/g, "es", 4],
    [/[åø]/g, "sv", 1],
    [/[àâçéèêëîïôùûÿœ]/g, "fr", 1]
  ];
  const SPEECH_WORD_SETS = {};
  for (const c in SPEECH_WORDS) SPEECH_WORD_SETS[c] = new Set(SPEECH_WORDS[c]);
  const SPEECH_MIN_SCORE = 2;    // ce n'est qu'à partir de deux correspondances que c'est un jugement
  const SPEECH_MIN_REL = 0.14;   // ... et cela doit être une proportion perceptible des mots

  // Seulement le système d'écriture – sans ambiguïté, dès qu'il s'applique.
  function speechScriptLang(s) {
    if (/[\u3040-\u30ff]/.test(s)) return "ja";
    if (/[\uac00-\ud7af\u1100-\u11ff]/.test(s)) return "ko";
    if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(s)) return "zh";
    if (/[\u0e00-\u0e7f]/.test(s)) return "th";
    if (/[\u0980-\u09ff]/.test(s)) return "bn";
    if (/[\u0900-\u097f]/.test(s)) return "hi";
    if (/[\u0590-\u05ff]/.test(s)) return "he";
    if (/[\u0370-\u03ff\u1f00-\u1fff]/.test(s)) return "el";
    if (/[\u0400-\u04ff]/.test(s)) {
      if (/[іїєґ]/.test(s)) return "uk";
      if (/[јљњћџђ]/.test(s)) return "sr";
      if (/[ыэё]/.test(s)) return "ru";
      if (/ъ/.test(s)) return "bg";
      return "ru";
    }
    if (/[\u0600-\u06ff\ufb50-\ufdff\ufe70-\ufeff]/.test(s)) {
      if (/[ٹڈڑںھہ]/.test(s)) return "ur";
      if (/[پچژگک]/.test(s)) return "fa";
      return "ar";
    }
    return null;
  }

  // La langue D'UNE phrase – ou zéro, si la certitude ne suffit pas.
  function detectSpeechLang(text) {
    const s = String(text || "");
    if (!s.trim()) return null;
    const script = speechScriptLang(s);
    if (script) return script;
    const words = s.toLowerCase().replace(/[^\p{L}]+/gu, " ").split(" ").filter((w) => w.length >= 3);
    if (!words.length) return null;
    const scores = {};
    for (const w of words) {
      for (const c in SPEECH_WORD_SETS) {
        if (SPEECH_WORD_SETS[c].has(w)) scores[c] = (scores[c] || 0) + 1;
      }
    }
    for (const sign of SPEECH_SIGNS) {
      const m = s.match(sign[0]);
      if (m) scores[sign[1]] = (scores[sign[1]] || 0) + m.length * sign[2];
    }
    let best = null, bestScore = 0;
    for (const c in scores) if (scores[c] > bestScore) { bestScore = scores[c]; best = c; }
    if (!best) return null;
    const rel = bestScore / words.length;
    if (bestScore >= SPEECH_MIN_SCORE && rel >= SPEECH_MIN_REL) return best;
    // Phrase très courte, mais sans ambiguïté ("Oui.", "Tak.") : une seule correspondance
    // pour un seul mot est suffisante, dès lors qu'elle représente la majorité.
    if (bestScore >= 1 && rel >= 0.5) return best;
    return null;
  }

  // Temps d'attente après l'apparition de la phrase avant l'envoi automatique.
  // La détection du silence (stt.js) a déjà attendu ~1,2 s auparavant, c'est pourquoi
  // une courte pause ici n'est pas une coupure en milieu de phrase.
  const AUTO_SEND_PAUSE_MS = 1200;
  // La correction du sens suspend l'envoi – mais pas plus longtemps que nécessaire : la
  // durée est définie par le temps de réponse mesuré dernièrement (voir _waitForCorrectionMs).
  // Ce chiffre est seulement le minimum de ce délai de grâce.
  const CORRECT_SEND_GRACE_MS = 1200;
  // Garde du clavier : durée pendant laquelle le micro reste silencieux après la dernière frappe.
  const TYPING_HOLD_MS = 1400;
  const TYPING_KEY = /^(Backspace|Delete|Enter|Space|Spacebar)$/;
  // Correction de la transcription, niveau 2 (modèle). Le moteur intégré
  // répond généralement en ~2 s, mais présente des pics de charge de 15 s ou plus. L'ancienne
  // valeur (attente de 6,5 s, limite de temps de 15 s) a coupé précisément ces pics :
  // la version corrigée uniquement localement a alors été envoyée – donc own fait
  // presque toujours la moins bonne, ce qui donne l'impression que « la correction ne fonctionne pas ».
  // La durée d'attente est un compromis : trop courte, et la phrase n'est envoyée
  // qu'avec la correction locale ; trop longue, et une pause d'élocution perceptible
  // apparaît après chaque phrase. C'est pourquoi le temps de réponse mesuré est extrapolé (multiplié par 1,4
  // plus réserve) plutôt que de deviner un chiffre fixe – avec une limite supérieure généreuse.
  const CORRECT_MAX_WAIT_MS = 15000;      // Limite supérieure pour retarder l'envoi
  const CORRECT_FIRST_WAIT_MS = 10000;    // première correction : pas encore de mesure
  const CORRECT_FAIL_FORGIVE_MS = 45000;  // après ce repos, une série d'erreurs expire
  const AI_CORRECT_MS = 30000;            // Limite de temps de l'appel au modèle (démarrage à froid !)
  const AI_CORRECT_CACHE_MAX = 60;
  const AI_CORRECT_PROMPT = [
    "You are a post-editor for automatic speech recognition.",
    "Below is a raw transcript of one spoken utterance. Rewrite it as exactly what the speaker said, but written correctly.",
    "Rules:",
    "- Fix spelling, missing accents, apostrophes, punctuation and capitalisation.",
    "- Replace obviously mis-heard words with the word the sentence clearly requires. Never invent content.",
    "- Remove involuntary repetitions, stutters and filler sounds.",
    "- Keep the speaker's language ({lang}) and register. Never translate, never paraphrase, never answer a question that appears in the text.",
    "- Add no information and drop none. If the transcript is already correct, repeat it unchanged.",
    "- Output only the corrected text: a single line, no quotes, no explanation, no preamble.",
    "",
    "Raw transcript:",
    "{text}"
  ].join("\n");
  const LANG_NAMES = {};
  for (const l of LANGUAGES) LANG_NAMES[l.code] = l.name;

  function withTimeout(p, ms) {
    return new Promise((resolve, reject) => {
      let done = false;
      const t = setTimeout(() => { if (!done) { done = true; reject(new Error("timeout")); } }, ms);
      Promise.resolve(p).then(
        (v) => { if (!done) { done = true; clearTimeout(t); resolve(v); } },
        (e) => { if (!done) { done = true; clearTimeout(t); reject(e); } }
      );
    });
  }
  // Pour que la vérification ci-dessous détecte si le modèle a changé de langue.
  function scriptClass(t) {
    const s = String(t || "");
    const counts = {
      latin: (s.match(/\p{Script=Latin}/gu) || []).length,
      cyrillic: (s.match(/\p{Script=Cyrillic}/gu) || []).length,
      greek: (s.match(/\p{Script=Greek}/gu) || []).length,
      arabic: (s.match(/\p{Script=Arabic}/gu) || []).length,
      han: (s.match(/\p{Script=Han}/gu) || []).length,
      hangul: (s.match(/\p{Script=Hangul}/gu) || []).length,
      devanagari: (s.match(/\p{Script=Devanagari}/gu) || []).length,
      hiragana: (s.match(/\p{Script=Hiragana}/gu) || []).length,
      katakana: (s.match(/\p{Script=Katakana}/gu) || []).length
    };
    let best = "none", n = 0;
    for (const k in counts) { if (counts[k] > n) { n = counts[k]; best = k; } }
    return n ? best : "none";
  }
  function normTokens(t) {
    return String(t == null ? "" : t)
      .toLowerCase().normalize("NFD").replace(/\p{M}+/gu, "")
      .split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  }
  // Mots qui se répètent légitimement dans le discours réel (« oui oui », « très très
  // bien ») – lors de la fusion de deux segments de reconnaissance, ils ne doivent PAS être
  // absorbés comme un chevauchement (voir Voice._mergeSpoken).
  const MERGE_KEEP_WORDS = new Set([
    "oui", "non", "si", "no", "yes", "tres", "bien", "vraiment", "encore", "merci",
    "plus", "moins", "tout", "rien", "peu", "beaucoup", "maintenant", "alors",
    "la", "le", "les", "des", "de", "du", "un", "une", "et", "ou", "a", "au", "aux",
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles", "ce", "cette",
    "ca", "est", "sont", "etait", "pas", "que", "qui", "quoi", "dans", "sur", "pour",
    "avec", "mais", "donc", "car", "or", "ni", "en", "y", "se", "sa", "son", "mon",
    "the", "of", "to", "and", "in", "is", "it", "that", "this", "very", "so", "you"
  ]);

  function voiceLabel(v) {
    return (v.name || "") + (v.lang ? " (" + v.lang + ")" : "");
  }

  function strings() {
    let t = App.I18n.get(App.State.settings.language) || {};
    return (t.ui && t.ui.voice) || {};
  }

  // Ronde 142 : Le seul cas où la lecture à voix haute dépend réellement du navigateur.
  // Il est signalé de manière visible au lieu de rester silencieux (toutes les cinq langues de l'
  // interface ; toute autre langue reçoit l'anglais).
  const TTS_BLOCKED = {
    fr: "La lecture à voix haute est bloquée par le navigateur. Clique une fois dans la page, puis vérifie le volume et que l'onglet n'est pas en sourdine.",
    de: "Der Browser blockiert die Sprachausgabe. Einmal in die Seite klicken, dann Lautstärke und Stummschaltung des Tabs prüfen.",
    en: "Speech out is blocked by the browser. Click once inside the page, then check the volume and that the tab is not muted.",
    es: "El navegador bloquea la voz. Haz clic una vez en la página y comprueba el volumen y que la pestaña no esté silenciada.",
    it: "Il browser blocca la voce. Fai un clic nella pagina e controlla il volume e che la scheda non sia muta."
  };
  function ttsBlockedText() {
    let code = String((App.State.settings && App.State.settings.language) || "en").slice(0, 2).toLowerCase();
    return TTS_BLOCKED[code] || TTS_BLOCKED.en;
  }

  function settings() {
    return (App.State && App.State.settings) || {};
  }

  // Il existe deux moteurs de reconnaissance (voir src/stt.js) : la reconnaissance
  // intégrée au navigateur – qui est bloquée par la directive `speech` dans un cadre Perchance
  // et ne fait alors RIEN en silence – et Whisper directement dans la page,
  // qui n'a besoin que de `getUserMedia` (ce qui est autorisé dans le cadre).
  function sttEngine() {
    const S = App.STT;
    if (S && typeof S.engine === "function") return S.engine();
    return SR ? "native" : "none";
  }
  function usingLocal() { return sttEngine() === "local"; }

  function clampPitch(v) {
    let p = parseFloat(v);
    if (!isFinite(p)) p = 1;
    return Math.min(2, Math.max(0.5, Math.round(p * 10) / 10));
  }

  // Les voix Windows intégrées (SAPI) ne modulent le tempo que très faiblement :
  // mesuré 1,4 → 1,9 est seulement ~10 % plus court, c'est seulement au-dessus de 2 que la
  // différence devient nette (1 → 4 ≈ 1,9x, 1 → 10 ≈ 2,9x). C'est pourquoi le curseur
  // va jusqu'à 4 ; au-delà, cela n'en vaut guère la peine et semble précipité.
  const MAX_TTS_RATE = 4;
  function clampRate(v) {
    let r = parseFloat(v);
    if (!isFinite(r)) r = 1;
    return Math.min(MAX_TTS_RATE, Math.max(0.5, Math.round(r * 10) / 10));
  }

  const Voice = {
    _voices: [],
    _activeBtn: null,
    _recognition: null,
    _listening: false,
    _manualStop: false,
    _baseText: "",
    _finalText: "",
    _onceFinalBase: "",
    _voicesHooked: false,
    _lastSpeech: null,     // dernière langue de texte détectée {code, at} – voir _speechLangFor

    _live: false,
    _liveArmed: false,
    _liveSuspended: false,
    _liveRec: null,
    _liveWatchdog: null,   // Gardien : remarque quand le micro est devenu muet
    _liveBase: "",
    _liveFinal: "",
    _liveFinalBase: "",    // texte terminés issus de sessions de reconnaissance précédentes
    _liveSessFinal: "",    // résultats définitifs de la session en cours
    _liveDisplay: "",      // exactement ce qui se trouve actuellement dans le champ (sans _liveBase)
    _liveTimer: null,
    _liveManualStop: false,
    _liveResumePending: false,
    _speaking: false,
    _suppressAutoSpeak: false,
    // Lecture streaming (Ronde 34) : Sofia lit sa réponse phrase par phrase,
    // dès que la première phrase terminée apparaît dans le chat – au lieu d'attendre la fin.
    _streamOn: false,        // Streaming vocal actif pour ce tour
    _streamEnded: false,     // la génération est terminée, seule la file d'attente est encore en cours
    _streamBuf: "",          // phrase encore incomplète
    _streamQueue: [],        // phrases terminées qui doivent encore être prononcées
    _streamBusy: false,      // une phrase est en cours de prononciation
    _streamSpoke: false,     // au moins une phrase a été prononcée
    _spokeThisTurn: false,   // une parole a déjà été émise durant CE tour (survit à _finishStreamSpeak)
    _lastSpokenText: "",     // Ronde 138 : le texte de réponse prononcé en dernier (jamais deux fois)
    _spokenSents: null,      // Ronde 139 : phrases déjà prononcées durant CE tour
    _trace: [],              // Ronde 142 : chaîne de traces de la lecture (autodiagnostic)
    _turnText: "",           // Ronde 142 : le texte de réponse du tour qui vient de se terminer
    _turnEndedAt: 0,         // ... et quand il s'est terminé (la garde ne lit que les nouveautés)
    _primeHooked: false,     // Ronde 142 : déverrouillage au premier clic/appui de touche
    _primed: false,          // ... et si cela est déjà déverrouillé
    _stuckNoticeShown: false, // Ronde 142 : notification unique "le navigateur bloque la voix"
    _speakGuardTimer: null,  // Ronde 138 : garde retardataire, pour qu'aucune réponse ne reste muette
    _streamLastText: "",     // dernier texte visible observé (détection delta/reset)
    _streamEmittedEnd: 0,    // offset dans le texte visible jusqu'à la dernière phrase injectée
    _streamStale: "",        // texte du bloc précédent (mises à jour tardives après restartStreamText)
    _streamGen: 0,           // compteur : interrompt les anciennes chaînes vocales
    _streamUtterance: null,
    _streamKeepAlive: null,
    _speakGen: 0,            // Ronde 267 : génération de la lecture par morceaux
    _speakDelay: null,       // ... le petit délai avant que le morceau ne parte
    _speakWatch: null,       // ... le chien de garde du morceau en cours
    _sttPhase: "idle",     // idle | listening | recording | transcribing | paused
    _sttPct: null,         // téléchargement du modèle en pourcentage (moteur local uniquement)
    _sttNotice: null,      // dernière erreur du moteur local
    _noiseNotice: null,    // « c'était juste un bruit » (voir _flagNoise)
    _noiseTimer: null,
    _typingUntil: 0,       // garde clavier : jusqu'à quand « l'utilisateur tape » est valable
    _typingPaused: false,  // ... et que le microphone est donc en pause
    _typingTimer: null,
    _typingGuardEl: null,  // champ de saisie auquel la garde est rattachée
    _localNotified: false,
    _correcting: false,    // le niveau de correction 2 est en cours (ligne d'état)
    _correctQueue: 0,
    _sendGraceUntil: 0,    // jusqu'à lors, la correction sémantique peut interrompre l'envoi
    _correctChain: null,   // les corrections s'exécutent séquentiellement, jamais en parallèle
    _correctDeadline: 0,
    _correctEpoch: 0,      // augmente à l'envoi/à l'arrêt : les anciennes corrections expirent
    _correctCache: null,   // Map : phrases déjà corrigées (pas de second appel au modèle)
    _correctWarmAt: 0,     // moment du dernier préchauffage de l'engine
    _correctWarm: null,    // appel de préchauffage en cours (la correction attend celui-ci)
    _correctLatency: 0,    // durée lissée des dernières corrections sémantiques (ms)
    _correctFailStreak: 0, // dépassements de délai/erreurs consécutifs
    _correctBackoffUntil: 0, // ne plus tenter de correction sémantique jusqu'à lors
    _lastSoundAt: 0,       // moment du dernier bruit reconnu (mode sounds)
    _lastSoundMeta: null,

    isTtsSupported() { return !!(speech && typeof speech.speak === "function"); },
    isSttSupported() {
      const S = App.STT;
      if (S && typeof S.supported === "function") return S.supported();
      return !!SR;
    },
    sttEngine() { return sttEngine(); },
    currentLangCode() { return normLang((App.State.settings && App.State.settings.language) || "en"); },
    // Ronde 131 : Pays/Région de la voix. Sans choix spécifique, la région de la
    // Registry est appliquée ; le choix est accepté seulement s'il correspond à la langue.
    regionSetting() { return String(settings().voiceRegion || ""); },
    setRegion(tag) {
      settings().voiceRegion = tag ? String(tag) : "";
      App.Data.saveSettings();
      this.populateVoiceSelect();
    },
    currentSpeechLang() {
      let reg = this.regionSetting();
      if (reg && normLang(reg) === this.currentLangCode()) return reg;
      return LANG_MAP[this.currentLangCode()] || "en-US";
    },
    // les régions que cet appareil propose pour une langue : la directive de la
    // Registry d'abord, puis les voix réellement installées.
    regionsFor(code) {
      let c = normLang(code);
      let core = LANG_MAP[c] || "";
      let seen = {};
      let out = [];
      if (core) { out.push(core); seen[core.toLowerCase()] = true; }
      let voices = this._voices.length ? this._voices : this.loadVoices();
      for (let vv of voices) {
        let tag = String(vv.lang || "").replace(/_/g, "-");
        if (!tag || seen[tag.toLowerCase()]) continue;
        if (tag.toLowerCase().split("-")[0] !== c) continue;
        seen[tag.toLowerCase()] = true;
        out.push(tag);
      }
      return out;
    },
    liveLangSetting() { return settings().liveListenLang || "auto"; },
    liveLang() {
      let s = this.liveLangSetting();
      return (s === "auto") ? this.currentSpeechLang() : s;
    },

    loadVoices() {
      if (!this.isTtsSupported()) return [];
      try { this._voices = speech.getVoices() || []; } catch (e) { this._voices = []; }
      return this._voices;
    },

    _genderPool(pool, wantFemale) {
      if (!pool.length) return pool;
      let isFemale = (v) => {
        let n = (v.name || "").toLowerCase();
        return FEMALE_HINTS.some((h) => n.indexOf(h) !== -1) && !MALE_HINTS.some((h) => n.indexOf(h) !== -1);
      };
      let isMale = (v) => {
        let n = (v.name || "").toLowerCase();
        return MALE_HINTS.some((h) => n.indexOf(h) !== -1) && !FEMALE_HINTS.some((h) => n.indexOf(h) !== -1);
      };
      let want = pool.filter(wantFemale ? isFemale : isMale);
      return want.length ? want : pool;
    },

    pickVoice() {
      let voices = this._voices.length ? this._voices : this.loadVoices();
      if (!voices.length) return null;
      let uri = settings().ttsVoiceURI || "";
      if (uri) {
        let m = voices.find(v => (v.voiceURI || v.name) === uri);
        if (m) return m;
      }
      let code = this.currentLangCode();
      // Ronde 131 : la voix nationale choisie l'emporte sur la simple langue.
      let reg = this.regionSetting();
      if (reg) {
        let low = reg.toLowerCase();
        let exact = voices.find(v => String(v.lang || "").toLowerCase().replace(/_/g, "-") === low);
        if (exact) return exact;
      }
      let langVoices = voices.filter(v => (v.lang || "").toLowerCase().replace(/_/g, "-").startsWith(code));
      let pool = langVoices.length ? langVoices : voices;
      let gendered = this._genderPool(pool, settings().ttsFemale !== false);
      if (gendered.length) return gendered.find(v => v.default) || gendered[0];
      return pool.find(v => v.default) || pool[0] || null;
    },

    // voix appartenant à UNE langue (ex. "pl"). Même ordre
    // et même préférence pour une voix féminine que dans pickVoice().
    voicesFor(code) {
      let voices = this._voices.length ? this._voices : this.loadVoices();
      let c = normLang(code);
      return voices.filter(v => String(v.lang || "").toLowerCase().replace(/_/g, "-").startsWith(c));
    },
    voiceForCode(code) {
      let pool = this.voicesFor(code);
      if (!pool.length) return null;
      let gendered = this._genderPool(pool, settings().ttsFemale !== false);
      return gendered.find(v => v.default) || gendered[0] || pool.find(v => v.default) || pool[0] || null;
    },
    // la langue dans laquelle cette phrase doit être lue. Une reconnaissance fraîche
    // l'emporte sur tout souvenir ; si la phrase est trop courte/imprécise, nous conservons la
    // langue reconnue précédemment (voir _lastSpeech).
    _speechLangFor(text) {
      let code = detectSpeechLang(text);
      if (code && isKnownLang(code)) { this._lastSpeech = { code: code, at: Date.now() }; return code; }
      let last = this._lastSpeech;
      if (last && (Date.now() - last.at) < 120000) return last.code;
      return null;
    },

    populateVoiceSelect() {
      let sel = App.UI && App.UI.cache && App.UI.cache.ttsVoiceSelect;
      if (!sel || !this.isTtsSupported()) return;
      let voices = this.loadVoices();
      let code = this.currentLangCode();
      let rank = (v) => (v.lang || "").toLowerCase().startsWith(code) ? 0 : 1;
      let sorted = voices.slice().sort((a, b) => {
        let ra = rank(a), rb = rank(b);
        if (ra !== rb) return ra - rb;
        return (a.name || "").localeCompare(b.name || "");
      });
      let saved = settings().ttsVoiceURI || "";
      let prev = sel.value;
      sel.innerHTML = "";
      let auto = document.createElement("option");
      auto.value = "";
      auto.textContent = strings().voiceAuto || "Automatic";
      sel.appendChild(auto);
      let found = false;
      for (const v of sorted) {
        let opt = document.createElement("option");
        opt.value = v.voiceURI || v.name;
        opt.textContent = voiceLabel(v);
        if (opt.value === saved) found = true;
        sel.appendChild(opt);
      }
      sel.value = found ? saved : (saved ? "" : (prev || ""));
      if (sel.value === "" && !saved) sel.value = "";
      this.populateRegionSelect();
    },

    // Ronde 131 : le nom de la région dans la langue de l'interface.
    regionLabel(tag) {
      let t = String(tag || "");
      let parts = t.split("-");
      let region = parts[1] || "";
      let ui = normLang((App.State.settings && App.State.settings.language) || "en");
      try {
        let langName = new Intl.DisplayNames([ui], { type: "language" }).of(parts[0]) || parts[0];
        if (!region) return langName;
        let regName = new Intl.DisplayNames([ui], { type: "region" }).of(region.toUpperCase()) || region;
        return langName + " · " + regName;
      } catch (e) { return t; }
    },

    populateRegionSelect() {
      let sel = document.getElementById("ttsRegionSelect");
      if (!sel) return;
      let code = this.currentLangCode();
      let keep = this.regionSetting();
      let regions = this.regionsFor(code);
      if (keep && regions.indexOf(keep) === -1) regions.push(keep);
      sel.innerHTML = "";
      let o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = (strings().voiceAuto || "Automatic") + " (" + (LANG_MAP[code] || code) + ")";
      sel.appendChild(o0);
      for (let tag of regions) {
        let o = document.createElement("option");
        o.value = tag;
        o.textContent = this.regionLabel(tag);
        sel.appendChild(o);
      }
      sel.value = keep;
      if (sel.value !== keep) sel.value = "";
    },

    ensureVoicesHook() {
      if (this._voicesHooked || !this.isTtsSupported()) return;
      this._voicesHooked = true;
      try { speech.addEventListener("voiceschanged", () => this.populateVoiceSelect()); } catch (e) {}
      this.loadVoices();
    },

    setVoice(uri) {
      settings().ttsVoiceURI = uri || "";
      App.Data.saveSettings();
    },

    setRate(val) {
      let r = clampRate(val);
      settings().ttsRate = r;
      App.Data.saveSettings();
      let el = App.UI && App.UI.cache && App.UI.cache.ttsRateValueEl;
      if (el) el.textContent = String(r);
      let input = App.UI && App.UI.cache && App.UI.cache.ttsRateInput;
      if (input) input.value = String(r);
    },

    setPitch(val) {
      let p = clampPitch(val);
      settings().ttsPitch = p;
      App.Data.saveSettings();
      let el = App.UI && App.UI.cache && App.UI.cache.ttsPitchValueEl;
      if (el) el.textContent = String(p);
      let input = App.UI && App.UI.cache && App.UI.cache.ttsPitchInput;
      if (input) input.value = String(p);
    },

    setFemale(on) {
      settings().ttsFemale = !!on;
      App.Data.saveSettings();
      this.populateVoiceSelect();
      let v = strings();
      App.UI.showToast(on ? (v.femaleOn || "Female voice preferred") : (v.femaleOff || "Female voice preference off"), "info");
    },

    setAutoSpeak(on) {
      settings().ttsAutoSpeak = !!on;
      App.Data.saveSettings();
      let v = strings();
      if (!on) this.stop();
      App.UI.showToast(on ? (v.speakOn || "Replies are read aloud") : (v.speakOff || "Replies are no longer read aloud"), "info");
    },

    testVoice() {
      let v = strings();
      if (!this.isTtsSupported()) { App.UI.showToast(v.unsupported || "Speech output is not available in this browser.", "error"); return; }
      let phrase = TEST_PHRASE[this.currentLangCode()] || TEST_PHRASE.en;
      this.speak(phrase, null);
    },

    _cleanText(raw) {
      let s = String(raw == null ? "" : raw);
      s = s.replace(/\[FICHE_STATE\][\s\S]*?\[END_FICHE_STATE\]/g, " ");
      s = (function (t) {
        let out = "", i = 0;
        for (;;) {
          let k = t.indexOf("[FICHE_STATE]", i);
          if (k === -1) { out += t.slice(i); break; }
          out += t.slice(i, k);
          let e = t.indexOf("[END_FICHE_STATE]", k);
          if (e !== -1) { i = e + 18; continue; }
          let b = t.indexOf("{", k);
          if (b === -1) { i = k + 13; continue; }
          let depth = 0, inS = false, esc = false, m = -1;
          for (let j = b; j < t.length; j++) {
            let ch = t[j];
            if (inS) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inS = false; }
            else if (ch === '"') inS = true;
            else if (ch === "{" || ch === "[") depth++;
            else if (ch === "}" || ch === "]") { depth--; if (depth === 0) { m = j + 1; break; } }
          }
          i = (m === -1) ? t.length : m;
        }
        return out;
      })(s);
      s = s.replace(/^\s*\{"sheets"\s*:[\s\S]*$/g, " ");
      s = s.replace(/\[SOFIA_SCENE\][\s\S]*?(\[END_SOFIA_SCENE\]|$)/g, " ");
      s = s.replace(/\[MENTOR_STATE\][\s\S]*?(\[END_MENTOR_STATE\]|$)/g, " ");
      s = s.replace(/\[SOFIA_IMAGE\][^\n]*/g, " ");
      s = s.replace(/\[(?:SOFIA_(?:SCRIPT|LEARN|HELPER|VISION|FILEREAD|FACTCHECK|WEBIMG|EDIT|UPDATE|WORKSHOP|LOGO)|CHESS_(?:MOVE|STATE)|END_FICHE_STATE|END_SOFIA_SCENE|END_MENTOR_STATE)\][^\n]*/g, " ");
      s = s.replace(/\[Image generated[^\n\]]*\]?/gi, " ");
      s = s.replace(/```[\s\S]*?```/g, " ");
      s = s.replace(/`([^`]+)`/g, "$1");
      s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
      s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
      s = s.replace(/https?:\/\/\S+/g, " ");
      s = s.replace(/^[ \t]*[-*+]\s+/gm, " ");
      s = s.replace(/^#{1,6}\s+/gm, " ");
      s = s.replace(/[*_~>|]/g, " ");
      s = s.replace(/\s+/g, " ").trim();
      // les guillemets/puces orphelins aux extrémités (ex. le « »»
      // après une fin de phrase) n'appartiennent pas à la voix parlée.
      s = s.replace(/^[«»“”„"'’\-–—•\s]+/, "").replace(/[«»“”„"'’\s]+$/, "");
      return s;
    },

    _newUtterance(clean) {
      let u = new SpeechSynthesisUtterance(clean);
      // la voix suit la langue de la PHRASE, et non les paramètres : Sofia
      // répond dans la langue de l'utilisateur, et c'est ainsi qu'elle doit sonner.
      // langue de l'interface -> comportement actuel (incluant la voix souhaitée
      // choisie par l'utilisateur). Autre langue -> une voix dédiée.
      let appCode = this.currentLangCode();
      let lang = this._speechLangFor(clean);
      let useCode = (lang && normLang(lang) !== appCode) ? normLang(lang) : appCode;
      let voice = (useCode === appCode) ? this.pickVoice() : this.voiceForCode(useCode);
      let bcp = (useCode === appCode) ? this.currentSpeechLang() : (LANG_MAP[useCode] || this.currentSpeechLang());
      if (voice) { u.voice = voice; u.lang = voice.lang || bcp; }
      else { u.lang = bcp; }
      u.rate = settings().ttsRate || 1;
      u.pitch = clampPitch(settings().ttsPitch);
      return u;
    },

    // Ronde 267 : la « perte de son ». Les moteurs du navigateur coupent un énoncé
    // au bout d'une quinzaine de secondes de parole (Chrome, Edge, Android), sans
    // erreur ni `end` : le milieu et la fin d'une longue réponse n'étaient alors
    // jamais entendus. Chaque morceau remis à la synthèse est donc borné en longueur,
    // coupé de préférence à une fin de phrase, sinon à une ponctuation de clause,
    // sinon à un espace.
    MAX_SPEECH_CHARS: 180,
    _chunkSpeech(text) {
      let src = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
      let out = [];
      if (!src) return out;
      let max = this.MAX_SPEECH_CHARS || 180;
      while (src.length > max) {
        let floor = Math.floor(max * 0.55);
        let cut = -1;
        for (let k = max; k > floor; k--) {
          let ch = src[k];
          if (!ch) continue;
          if (",;:—–)»\"'".indexOf(ch) !== -1) { cut = k + 1; break; }
          if ((".!?…。！？".indexOf(ch) !== -1) && /\s/.test(src[k + 1] || " ")) { cut = k + 1; break; }
        }
        if (cut === -1) {
          let sp = src.lastIndexOf(" ", max);
          cut = sp > floor ? sp + 1 : max;
        }
        let head = src.slice(0, cut).trim();
        if (head) out.push(head);
        src = src.slice(cut).trim();
      }
      if (src) out.push(src);
      return out;
    },

    speak(rawText, btn) {
      let v = strings();
      if (!this.isTtsSupported()) { App.UI.showToast(v.unsupported || "Speech output is not available in this browser.", "error"); return; }
      if (this._activeBtn && this._activeBtn === btn && btn) { this.stop(); return; }
      let clean = this._cleanText(rawText);
      if (!clean) return;
      this._lastSpokenText = clean;
      this.stop();
      let finish = () => {
        if (this._swapTimer) { clearTimeout(this._swapTimer); this._swapTimer = null; }
        this._speaking = false;
        this._syncSpeakBadge();
        if (this._activeBtn === btn) this._resetActive();
        this._afterSpeech();
      };
      this._activeBtn = btn;
      if (btn) {
        btn.classList.add("speaking");
        btn.innerHTML = App.ICONS.speakStop || App.ICONS.speak || "";
        btn.title = v.stop || "Stop";
        let wrap = btn.closest(".msgWrapper");
        if (wrap) wrap.classList.add("speaking");
      }
      this._suspendLive();
      this._speaking = true;
      this._syncSpeakBadge();
      // Ronde 142 : le même échec silencieux que dans le parcours par phrase est également
      // reconnu ici et répété exactement une fois (voir `_pumpStreamSpeak`).
      // Ronde 267 : et le texte n'est plus dit d'un seul bloc : un long énoncé est coupé
      // par le moteur du navigateur au bout d'une quinzaine de secondes, sans erreur ni
      // `end` – c'était la « perte de son ». Les morceaux courts de `_chunkSpeech` sont
      // dits l'un après l'autre, chacun avec sa relance, son chien de garde et le
      // maintien de la lecture (le nudge qui empêche Chrome de s'endormir).
      let self = this;
      let parts = this._chunkSpeech(clean);
      // Pause d'une demi-seconde à chaque retour de ligne : le texte nettoyé
      // ayant perdu les sauts de ligne, on redécoupe ligne par ligne et on
      // marque le dernier morceau de chaque ligne (sauf la dernière).
      let lineBreakAfter = null;
      try {
        let rawLines = String(rawText == null ? "" : rawText).split(/\r?\n/);
        let groups = [];
        for (let ln of rawLines) {
          let cl = this._cleanText(ln);
          if (cl) groups.push(this._chunkSpeech(cl));
        }
        if (groups.length > 1) {
          parts = [];
          lineBreakAfter = {};
          for (let g = 0; g < groups.length; g++) {
            for (let c of groups[g]) parts.push(c);
            if (g < groups.length - 1) lineBreakAfter[parts.length - 1] = true;
          }
        }
      } catch (e) { lineBreakAfter = null; }
      if (!parts.length) { finish(); return; }
      let q = 0;
      let doneCount = 0;
      let tries = 0;
      let seq = 0;
      let lastLive = Date.now();
      let gen = this._speakGen || 0;
      let alive = () => gen === (self._speakGen || 0);
      let finished = false;
      let clearTimers = () => {
        if (self._speakDelay) { clearTimeout(self._speakDelay); self._speakDelay = null; }
        if (self._swapTimer) { clearTimeout(self._swapTimer); self._swapTimer = null; }
        if (self._speakWatch) { clearTimeout(self._speakWatch); self._speakWatch = null; }
      };
      let keepAlive = setInterval(() => {
        if (!alive() || !self._speaking) { clearInterval(keepAlive); return; }
        try { if (speech && speech.paused) speech.resume(); } catch (e) {}
      }, 4000);
      let end = () => {
        if (finished) return;
        finished = true;
        seq = -1;
        clearInterval(keepAlive);
        clearTimers();
        finish();
      };
      let checkEnd = () => {
        if (!finished && doneCount >= parts.length) {
          self._traceAdd("parle-entier", "terminé " + parts.length + " morceau(x)");
          end();
        }
      };
      let enqueue = () => {
        if (finished || !alive()) return;
        if (q >= parts.length) return;
        if (q > 0 && lineBreakAfter && lineBreakAfter[q - 1]) {
          let mySeq = ++seq;
          self._traceAdd("pause-ligne", "500 ms avant morceau " + (q + 1) + "/" + parts.length);
          self._speakDelay = setTimeout(() => {
            self._speakDelay = null;
            if (mySeq !== seq || finished || !alive()) return;
            enqueue();
            pump();
          }, 500);
          return;
        }
        let myQ = q;
        let part = parts[myQ] || "";
        let u = self._newUtterance(part);
        u.onstart = () => {
          if (finished || !alive()) return;
          tries = 0;
          lastLive = Date.now();
          if (self._swapTimer) { clearTimeout(self._swapTimer); self._swapTimer = null; }
          self._traceAdd("début", "entier " + (myQ + 1) + "/" + parts.length + " len=" + part.length);
          pump();
        };
        u.onend = () => {
          if (finished || !alive()) return;
          lastLive = Date.now();
          if (myQ + 1 > doneCount) doneCount = myQ + 1;
          pump();
          checkEnd();
        };
        u.onerror = (e) => {
          if (finished || !alive()) return;
          let kind = self._speakErrorKind(e);
          self._traceAdd("erreur", kind + " morceau " + (myQ + 1));
          if (kind === "interrupted" || kind === "canceled" || kind === "cancelled") { end(); return; }
          lastLive = Date.now();
          if (myQ + 1 > doneCount) doneCount = myQ + 1;
          pump();
          checkEnd();
        };
        q++;
        try {
          if (speech.paused) speech.resume();
          speech.speak(u);
        } catch (e) { self._traceAdd("exception", String(e)); self._noticeSpeakBlocked("throw"); end(); return; }
        self._swapTimer = setTimeout(() => {
          self._swapTimer = null;
          if (finished || !alive()) return;
          if (speech.speaking || speech.pending) return;
          if (tries < 2) {
            tries++;
            try { speech.cancel(); } catch (e) {}
            try { speech.resume(); } catch (e) {}
            q = doneCount;
            self._speakDelay = setTimeout(() => { self._speakDelay = null; if (!finished && alive()) pump(); }, 120);
            return;
          }
          self._noticeSpeakBlocked("sans-demarrage");
          end();
        }, 2800);
      };
      let pump = () => {
        if (finished || !alive()) return;
        let guard = 0;
        while (q - doneCount < 2 && q < parts.length && guard++ < 4) {
          if (q > 0 && lineBreakAfter && lineBreakAfter[q - 1]) { enqueue(); break; }
          enqueue();
        }
        if (q >= parts.length && doneCount < parts.length && !(speech.speaking || speech.pending) && Date.now() - lastLive > 8000) {
          self._traceAdd("coupe", "reprise à " + (doneCount + 1) + "/" + parts.length);
          q = doneCount;
          enqueue();
        }
        checkEnd();
      };
      this._traceAdd("parle-entier", "len=" + clean.length + " morceaux=" + parts.length);
      pump();

    },

    stop() {
      // Ronde 267 : chaque boucle de lecture (par morceaux) meurt avec cette génération.
      this._speakGen = (this._speakGen || 0) + 1;
      if (this.isTtsSupported()) { try { speech.cancel(); } catch (e) {} }
      this._speaking = false;
      this._syncSpeakBadge();
      this.stopStreamSpeak();
      this._resetActive();
      this._afterSpeech();
    },

    _afterSpeech() {
      this._liveResumePending = false;
      // après l'élocution, c'est l'état RÉEL qui compte : si le micro doit être actif,
      // la reconnaissance doit tourner (ne pas se contenter de supprimer le flag Pausé).
      if (this._live) this._ensureLiveRestored();
    },

    _resetActive() {
      let btn = this._activeBtn;
      this._activeBtn = null;
      if (!btn) return;
      let v = strings();
      btn.classList.remove("speaking");
      btn.innerHTML = App.ICONS.speak || "";
      btn.title = v.play || "Read aloud";
      let wrap = btn.closest(".msgWrapper");
      if (wrap) wrap.classList.remove("speaking");
    },

    // --- Lecture en streaming (Ronde 34) -----------------------------------------
    // La réponse visible est décomposée en phrases ; chaque phrase complète passe
    // immédiatement dans la file d'attente de synthèse vocale. Dès que la génération se termine, le
    // reste est prononcé – une seconde lecture de l'ensemble de la réponse est alors inutile.
    _stopKeepAlive() {
      if (this._streamKeepAlive) { clearInterval(this._streamKeepAlive); this._streamKeepAlive = null; }
    },

    _startKeepAlive(gen) {
      if (this._streamKeepAlive) return;
      // Chrome/Edge mettent la lecture vocale en pause après environ 15 s ; le
      // Resume-Nudge maintient les réponses longues actives.
      this._streamKeepAlive = setInterval(() => {
        if (gen !== this._streamGen || !this._streamBusy) { this._stopKeepAlive(); return; }
        try { if (speech && speech.paused) speech.resume(); } catch (e) {}
        this._syncSpeakBadge();
      }, 4000);
    },

    beginStreamSpeak() {
      this.stopStreamSpeak();
      let want = settings().ttsAutoSpeak !== false && !this._suppressAutoSpeak && this.isTtsSupported();
      // Ronde 142 : La raison figure dans la trace – on peut voir plus tard POURQUOI
      // un tour n'a pas été lu (paramétrage, suppression, pas de TTS).
      this._traceAdd("début", "on=" + !!want
        + (settings().ttsAutoSpeak === false ? " (auto off)" : "")
        + (this._suppressAutoSpeak ? " (supprimé)" : "")
        + (!this.isTtsSupported() ? " (pas de TTS)" : "")
        + " voices=" + (this._voices.length ? this._voices.length : this.loadVoices().length));
      this._streamGen++;
      this._streamOn = !!want;
      this._streamEnded = false;
      this._streamBuf = "";
      this._streamQueue.length = 0;
      this._streamBusy = false;
      this._streamSpoke = false;
      this._spokeThisTurn = false;
      this._spokenSents = {};
      this._streamLastText = "";
      this._streamEmittedEnd = 0;
      this._streamStale = "";
      return this._streamOn;
    },

    stopStreamSpeak() {
      this._streamGen++;
      this._streamOn = false;
      this._streamEnded = false;
      this._streamBusy = false;
      this._streamSpoke = false;
      this._streamBuf = "";
      this._streamLastText = "";
      this._streamEmittedEnd = 0;
      this._streamStale = "";
      this._streamUtterance = null;
      if (this._streamQueue) this._streamQueue.length = 0;
      this._stopKeepAlive();
    },

    // Un nouveau bloc visible commence au sein du même tour (par ex. la
    // réponse de l'interpréteur après le texte principal). Réinitialiser uniquement l'ancre delta –
    // les phrases déjà prononcées continuent, le nouveau bloc est lu depuis le début.
    restartStreamText() {
      if (!this._streamOn) return;
      let before = this._streamLastText || "";
      // Prononcer le reste encore ouvert du bloc précédent comme dernière phrase,
      // pour éviter par exemple que la courte ligne d'introduction ne soit perdue.
      if (this._streamBuf) {
        let r = this._splitSentences(this._streamBuf, true);
        if (r.sentences.length) {
          for (const s of r.sentences) this._enqueueSentence(s);
          this._pumpStreamSpeak();
        }
      }
      this._streamBuf = "";
      this._streamLastText = "";
      this._spokenSents = {};
      // Les mises à jour rAF tardives du bloc précédent ne doivent pas relancer la lecture du
      // nouveau bloc depuis le début (sinon le texte se répète).
      this._streamStale = before;
      this._streamEmittedEnd = 0;
    },

    // Appelé par la génération à chaque mise à jour du texte visible.
    feedStreamText(visible) {
      if (!this._streamOn) return;
      let text = String(visible == null ? "" : visible);
      let prev = this._streamLastText || "";
      if (text === prev) return;
      // Ignorer une mise à jour tardive du bloc précédent (après restartStreamText).
      if (this._streamStale) {
        if (text === this._streamStale || (text.length < this._streamStale.length && this._streamStale.slice(0, text.length) === text)) return;
        this._streamStale = "";
      }
      let delta = "";
      if (text.length > prev.length && text.slice(0, prev.length) === prev) {
        delta = text.slice(prev.length);
      } else if (text.length < prev.length && prev.slice(0, text.length) === text) {
        // Le texte visible a été retiré (filtre de pensée/règle de silence) :
        // rejeter les phrases non encore prononcées, ne rien lire à l'envers.
        this._streamBuf = "";
        this._streamQueue.length = 0;
        this._streamEmittedEnd = Math.min(this._streamEmittedEnd || 0, text.length);
        this._streamLastText = text;
        return;
      } else {
        // Pas d'une simple extension/réduction (petit échange, résolution de marqueur) :
        // continuer la lecture uniquement à partir de la fin de la dernière phrase injectée. Ce qui a déjà
        // été entendu n'est jamais répété, les phrases en attente restent dans la file d'attente.
        let resume = this._streamEmittedEnd || 0;
        if (resume > text.length) resume = text.length;
        this._streamBuf = "";
        delta = text.slice(resume);
      }
      this._streamLastText = text;
      if (!delta) return;
      this._traceAdd("flux", "len=" + text.length);
      this._streamBuf += delta;
      let r = this._splitSentences(this._streamBuf, false);
      this._streamBuf = r.rest;
      if (r.sentences.length) {
        this._streamEmittedEnd = text.length - r.rest.length;
        for (const s of r.sentences) this._enqueueSentence(s);
        this._pumpStreamSpeak();
      }
    },

    // Appelé lors de onGenerationEnd : libérer le reste et le comparer avec le
    // texte de réponse (complet), au cas où la dernière mise à jour rAF
    // ne serait pas passée.
    endStreamSpeak(finalText) {
      if (!this._streamOn) return false;
      this._streamEnded = true;
      let raw = this._cleanText(finalText);
      // Ronde 142 : L'échelle est le texte de réponse ENREGISTRÉ – et non plus le delta
      // du flux visible. Le texte visible peut différer du texte enregistré
      // (étiquette du marqueur de mentor, règle de silence, auto-code,
      // mises à jour rAF perdues). L'ancien calcul du préfixe n'avait alors pas de
      // suite et laissait le RESTE de la réponse muet ; maintenant, tout arrive encore
      // phrases non prononcées du texte complet dans la file d'attente
      // (Les doublons sont empêchés par `_enqueueSentence`).
      let r = this._splitSentences(raw || this._streamBuf, true);
      for (const s of r.sentences) this._enqueueSentence(s);
      this._streamBuf = "";
      // Important : mémoriser l'état AVANT le pompage. `_pumpStreamSpeak` appelle
      // `_finishStreamSpeak()` en cas de file d'attente vide, ce qui réinitialise
      // `_streamSpoke` – après cela, il semblerait que rien n'ait été prononcé, et
      // `onGenerationEnd` relirait toute la réponse une seconde fois.
      let spokeBefore = !!(this._streamSpoke || this._streamBusy || this._streamQueue.length > 0);
      this._traceAdd("fin", "text=" + raw.length + " attente=" + this._streamQueue.length + " déjà=" + spokeBefore);
      this._pumpStreamSpeak();
      return spokeBefore || this._streamBusy || this._streamQueue.length > 0;
    },

    _pumpStreamSpeak() {
      if (this._streamBusy) return;
      if (!this.isTtsSupported()) { this._finishStreamSpeak(); return; }
      if (!this._streamQueue.length) {
        if (this._streamEnded) this._finishStreamSpeak();
        return;
      }
      if (!this._streamOn && !this._streamEnded) return;
      let sentence = this._streamQueue.shift();
      let clean = this._cleanText(sentence);
      if (!clean) { this._pumpStreamSpeak(); return; }
      // Ronde 139 : une phrase n'est prononcée qu'une seule fois par tour. La
      // phase d'image à la fin d'un tour (isGenerating true->false) peut
      // alimenter à nouveau le tampon du flux ; sans ce verrou, la première
      // phrase était lue une seconde fois ensuite.
      if (!this._spokenSents) this._spokenSents = {};
      if (this._wasSpoken(clean)) { this._pumpStreamSpeak(); return; }
      this._spokenSents[this._normSent(clean)] = true;
      let gen = this._streamGen;
      this._streamUtterance = null;
      this._streamBusy = true;
      this._streamSpoke = true;
      this._spokeThisTurn = true;
      this._speaking = true;
      this._syncSpeakBadge();
      let fired = false;
      let wd = null;
      let heard = false;
      let attempts = 0;
      let done = () => {
        if (fired) return;
        fired = true;
        if (wd) { clearTimeout(wd); wd = null; }
        if (this._swapTimer) { clearTimeout(this._swapTimer); this._swapTimer = null; }
        if (gen !== this._streamGen) return;
        this._streamUtterance = null;
        this._streamBusy = false;
        this._speaking = false;   // Intervalle entre deux phrases : rien ne sonne actuellement
        this._stopKeepAlive();
        this._pumpStreamSpeak();
        this._syncSpeakBadge();   // seulement après le réapprovisionnement : pas de scintillement entre les phrases
      };
      // Ronde 142 : Une commande silencieusement rejetée par le navigateur ne produit pas d'événement
      // `start` (classiquement : sans activation utilisateur, ou derrière une
      // file d'attente suspendue). Elle est répétée exactement UNE FOIS ; ce n'est que lorsque
      // la répétition ne démarre pas non plus que la voix est considérée comme bloquée – avec une
      // indication visible au lieu d'un silence total.
      let self = this;
      let emit = () => {
        attempts++;
        heard = false;
        let myAttempt = attempts;
        let u = self._newUtterance(clean);
        self._streamUtterance = u;
        u.onstart = () => {
          if (myAttempt !== attempts) return;
          heard = true;
          if (self._swapTimer) { clearTimeout(self._swapTimer); self._swapTimer = null; }
          self._traceAdd("début", "len=" + clean.length);
        };
        u.onend = () => { if (myAttempt !== attempts) return; done(); };
        u.onerror = (e) => {
          if (myAttempt !== attempts) return;
          let kind = self._speakErrorKind(e);
          self._traceAdd("erreur", kind);
          if (kind === "interrupted" || kind === "canceled" || kind === "cancelled") return;
          self._noticeSpeakBlocked(kind);
          done();
        };
        try {
          if (speech.paused) speech.resume();
          speech.speak(u);
        } catch (e) { self._traceAdd("exception", String(e)); self._noticeSpeakBlocked("throw"); done(); return; }
        let waits = 0;
        let check = () => {
          self._swapTimer = null;
          if (fired || heard || myAttempt !== attempts) return;
          // Si quelque chose s'exécute déjà dans le moteur (notre énoncé ou un précédent),
          // alors rien n'a été rejeté – on vérifie simplement patiemment.
          if (speech.speaking || speech.pending) {
            if (waits < 4) { waits++; self._swapTimer = setTimeout(check, 4000); }
            return;
          }
          self._traceAdd("pas-de-début", "essai=" + attempts + (speech.paused ? " en pause" : ""));
          if (attempts < 2) {
            // D'abord supprimer la file d'attente suspendue, puis recommencer la même phrase.
            // (Un court répit : `cancel()` suivi de `speak()` dans le même tick est avalé par Chrome.)
            try { speech.cancel(); } catch (e) {}
            try { speech.resume(); } catch (e) {}
            setTimeout(emit, 120);
            return;
          }
          self._noticeSpeakBlocked("sans-demarrage");
          done();
        };
        self._swapTimer = setTimeout(check, 2600);
      };
      // Filet de sécurité : un onend muet/perdu ne doit pas bloquer le microphone
      // de façon permanente (la reconnaissance vocale attend `_speaking === false`).
      // Le tempo ne croît pas linéairement — les voix système l'atténuent fortement (1 → 4
      // ne représentent que ~1,9x) —, c'est pourquoi le délai ne compte qu'un facteur 2 au maximum, sinon
      // une réponse longue avec un tempo élevé serait coupée prématurément.
      let effRate = Math.min(2, Math.max(0.5, settings().ttsRate || 1));
      let budget = Math.max(5000, Math.min(60000, Math.round(clean.length / effRate * 90)));
      wd = setTimeout(done, budget);
      this._startKeepAlive(gen);
      this._traceAdd("parle", "len=" + clean.length + " \"" + clean.slice(0, 34) + "\"");
      emit();
    },

    _finishStreamSpeak() {
      this._stopKeepAlive();
      this._streamOn = false;
      this._streamEnded = false;
      this._streamBusy = false;
      this._streamSpoke = false;
      this._streamBuf = "";
      this._streamLastText = "";
      if (this._streamQueue) this._streamQueue.length = 0;
      this._speaking = false;
      this._syncSpeakBadge();
      this._resetActive();
      this._afterSpeech();
    },

    // Décompose le texte visible en phrases. À la fin d'un flux, on ne prononce que jusqu'à
    // la dernière fin de phrase *sûre*, le reste reste dans le tampon.
    _splitSentences(buf, isFinal) {
      let out = [];
      let src = String(buf || "");
      let start = 0;
      let i = 0;
      const ABBR = /(?:^|[\s("'\[])(?:e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|Prof|Sgt|St|No|Fig|pp?|ca|cf|resp|approx|z\.B|u\.a|d\.h|bzw|usw|Mme|Mlle)\.$/i;
      const SENT = "…。！？";
      while (i < src.length) {
        let ch = src[i];
        if (ch === "\n") {
          let seg = src.slice(start, i);
          let t = seg.trim();
          if (t && (/[.!?…。！？]["')\]}»”’]?$/.test(t))) {
            out.push(seg);
            start = i + 1;
          }
          i += 1;
          continue;
        }
        if (ch === "." || ch === "!" || ch === "?" || SENT.indexOf(ch) !== -1) {
          let j = i + 1;
          while (j < src.length && ")]}«»\"'”’".indexOf(src[j]) !== -1) j++;
          if (j >= src.length) {
            if (isFinal) {
              let seg = src.slice(start);
              if (seg.trim()) out.push(seg);
              return { sentences: out, rest: "" };
            }
            i += 1;
            continue;
          }
          if (/\s/.test(src[j])) {
            let head = src.slice(start, i + 1).trim();
            if (!ABBR.test(head)) {
              let seg = src.slice(start, j);
              if (seg.trim()) out.push(seg);
              start = j;
              i = j;
              continue;
            }
          }
          i += 1;
          continue;
        }
        i += 1;
      }
      let rest = src.slice(start);
      if (isFinal && rest.trim()) { out.push(rest); return { sentences: out, rest: "" }; }
      // Phrase très longue sans fin : diviser à une limite de clause, pour que la
      // voix n'ait pas à attendre une fin de phrase pendant des minutes.
      if (rest.length > 260) {
        let cut = -1;
        for (let k = Math.min(rest.length - 1, 260); k > 160; k--) {
          if (",;:—–".indexOf(rest[k]) !== -1) { cut = k + 1; break; }
        }
        if (cut === -1) {
          let sp = rest.lastIndexOf(" ", 260);
          if (sp > 80) cut = sp + 1;
        }
        if (cut > 0) {
          let seg = rest.slice(0, cut);
          if (seg.trim()) out.push(seg);
          rest = rest.slice(cut);
        }
      }
      return { sentences: out, rest };
    },

    // --- Autodiagnostic, détection des échecs muets (Ronde 142) -------------
    // L'utilisateur signale depuis plusieurs rondes que « elle ne lit pas sa réponse ».
    // Dans cet environnement, la voix fonctionne de manière prouvée (vraie voix système, vrais
    // `start` et `end` events). Ce qui manquait, c'était la DÉTECTION d'un échec
    // silencieux : une commande rejetée par le navigateur ne livre ni `start` ni
    // erreur que le code aurait pu voir jusqu'ici. Chaque énoncé est désormais
    // surveillé, répété exactement une fois, et la raison se retrouve dans une
    // chaîne de traces qui affiche `App.Voice.ttsReport()` sous forme de texte.
    _traceAdd(kind, detail) {
      try {
        this._trace.push({ t: Date.now(), k: String(kind || "?"), d: String(detail == null ? "" : detail).slice(0, 80) });
        if (this._trace.length > 240) this._trace.splice(0, this._trace.length - 240);
      } catch (e) {}
    },
    ttsReport() {
      let t0 = this._trace.length ? this._trace[0].t : Date.now();
      return this._trace.map(e => ((e.t - t0) + " " + e.k + (e.d ? " " + e.d : ""))).join("\n");
    },
    clearTtsReport() { this._trace = []; return true; },
    _speakErrorKind(e) {
      let k = (e && (e.error || e.type)) ? (e.error || e.type) : "unknown";
      return String(k).toLowerCase();
    },
    // Un indicateur visible si le navigateur bloque réellement la voix –
    // exactement une fois par chargement de page, pour ne pas être importun.
    _noticeSpeakBlocked(kind) {
      this._traceAdd("bloqué", String(kind || ""));
      try { console.warn("[Voice] Sortie vocale bloquée :", kind); } catch (e) {}
      if (this._stuckNoticeShown) return;
      this._stuckNoticeShown = true;
      try { App.UI.showToast(ttsBlockedText(), "error"); } catch (e) {}
    },
    // Déverrouillage au premier clic/appui sur une touche : certains navigateurs n'autorisent la
    // sortie vocale qu'après une interaction utilisateur réelle. Une commande vide
    // (volume 0 – inaudible) ouvre la porte avant que la première phrase ne doive arriver.
    ensureVoiceUnlock() {
      if (this._primeHooked || !this.isTtsSupported()) return;
      this._primeHooked = true;
      let once = () => {
        try {
          document.removeEventListener("pointerdown", once, true);
          document.removeEventListener("keydown", once, true);
          document.removeEventListener("touchstart", once, true);
        } catch (e) {}
        if (this._primed) return;
        this._primed = true;
        try { this.loadVoices(); } catch (e) {}
        try {
          if (speech.paused) speech.resume();
          let u = new SpeechSynthesisUtterance(" ");
          u.volume = 0; u.rate = 2; u.pitch = 1;
          speech.speak(u);
          this._traceAdd("débloqué", "voix=" + this._voices.length);
        } catch (e) {}
      };
      try {
        document.addEventListener("pointerdown", once, true);
        document.addEventListener("keydown", once, true);
        document.addEventListener("touchstart", once, true);
      } catch (e) {}
    },
    _normSent(s) {
      return String(s == null ? "" : s)
        .replace(/\s+/g, " ")
        .replace(/^[\s«»“”„"'’\-–—•]+/, "")
        .replace(/[\s«»“”„"'’]+$/, "")
        .trim();
    },
    // Ronde 142 : Le signe pulsant en bas à gauche indique qu'une parole est en cours.
    // Le but est l'autodiagnostic : s'il pulse mais qu'on n'entend rien, le problème vient
    // de la sortie audio de l'appareil (mode muet, volume, sortie),
    // et non de Sofia.
    _syncSpeakBadge() {
      try {
        let el = document.getElementById("ttsLiveBadge");
        if (!el) return;
        let want = this._speaking ? "flex" : "none";
        if (el.style.display !== want) el.style.display = want;
      } catch (e) {}
    },
    // Cette phrase est-elle déjà considérée comme prononcée dans ce tour ? Exactement ou (avec
    // une longueur presque identique) comme faisant partie – le flux visible peut légèrement
    // différer du texte enregistré (étiquette, règle de silence).
    _wasSpoken(clean) {
      let c = this._normSent(clean);
      if (!c) return true;
      let sp = this._spokenSents || (this._spokenSents = {});
      if (sp[c]) return true;
      if (c.length < 14) return false;
      for (let k in sp) {
        if (!k || k.length < 14) continue;
        if (k.indexOf(c) === -1 && c.indexOf(k) === -1) continue;
        let lo = Math.min(k.length, c.length), hi = Math.max(k.length, c.length);
        if (hi > 0 && lo / hi >= 0.8) return true;
      }
      return false;
    },
    // N'enfiler que ce qui n'est pas déjà prononcé et qui n'est pas déjà en attente.
    // Ronde 267 : une phrase trop longue est scindée ici en morceaux courts
    // (voir `_chunkSpeech`) – c'est ce qui empêche le moteur du navigateur de couper
    // la voix au bout d'une quinzaine de secondes.
    _enqueueSentence(s) {
      let c = this._cleanText(s);
      if (!c) return false;
      let parts = this._chunkSpeech(c);
      if (!parts.length) return false;
      let q = this._streamQueue || (this._streamQueue = []);
      let added = false;
      for (const p of parts) {
        if (this._wasSpoken(p)) continue;
        let n = this._normSent(p);
        let dup = false;
        for (let i = 0; i < q.length; i++) {
          if (this._normSent(this._cleanText(q[i])) === n) { dup = true; break; }
        }
        if (dup) continue;
        q.push(p);
        added = true;
      }
      return added;
    },
    // Ronde 142 : lire le RESTE d'une réponse, sans répétitions. Toutes les phrases
    // qui n'ont pas encore été prononcées dans ce tour entrent dans la file d'attente
    // et passent par le même chemin (phrase par phrase, avec chaîne de traces).
    speakRemainder(text) {
      let r = this._splitSentences(this._cleanText(text), true);
      let added = 0;
      for (const s of r.sentences) { if (this._enqueueSentence(s)) added++; }
      this._traceAdd("reste", "nouveaux=" + added);
      if (!added) return false;
      if (!this._spokenSents) this._spokenSents = {};
      this._streamOn = true;        // `_pumpStreamSpeak` ne fonctionne que comme ça
      this._streamEnded = true;
      this._streamSpoke = true;
      if (!this._streamBusy) this._pumpStreamSpeak();
      return true;
    },

    // --- lecture automatique ------------------------------------------------
    suppressNextAutoSpeak() {
      this._suppressAutoSpeak = true;
      if (this._speaking || this._streamOn) this.stop();
    },

    _lastAssistantText() {
      try {
        let session = ((App.State.sessions) || []).find(s => s.id === App.State.currentSessionId);
        if (!session || !session.messages || !session.messages.length) return "";
        // Ronde 140 : Pour « une image pour chaque réponse », la carte image se trouve
        // TOUJOURS derrière son texte. C'est pourquoi la recherche se fait par arrière : les cartes
        // image et tour sont ignorées, mais PAS au-delà du dernier message utilisateur –
        // sinon une réponse antérieure serait relue.
        for (let i = session.messages.length - 1; i >= 0; i--) {
          let m = session.messages[i];
          if (!m) continue;
          if (m.role === "user") return "";
          if (m.role !== "assistant") continue;
          if (m.type === "image" || m.type === "move") continue;
          let c = String(m.content || "");
          if (c.trim()) return c;
        }
        return "";
      } catch (e) { return ""; }
    },

    onGenerationStart() {
      // Chaque réponse commence linguistiquement à nouveau : la langue du texte dernièrement
      // reconnue ne doit pas déborder sur la réponse suivante (voir _speechLangFor).
      this._lastSpeech = null;
      // Une valeur de limitation rAF bloquée empêcherait définitivement l'injection du texte
      // visible (et donc la lecture phrase par phrase).
      try { if (App.State) App.State._scrollThrottle = false; } catch (e) {}
      if (this._liveTimer) { clearTimeout(this._liveTimer); this._liveTimer = null; }
      if (this._speaking) this.stop();
      this._suspendLive();
      this.beginStreamSpeak();
    },

    onGenerationEnd() {
      // Peu importe la branche active (Streaming, Fallback, pas de parole) : à la fin,
      // le micro doit réellement fonctionner à nouveau – et pas seulement avoir l'air de
      // « ne pas être en pause ». Voir Ronde 51 / `_ensureLiveRestored`.
      try { this._runGenerationEnd(); } finally { this._ensureLiveRestored(); }
    },

    _runGenerationEnd() {
      this._resetLiveText();
      let wantSpeak = settings().ttsAutoSpeak !== false && !this._suppressAutoSpeak;
      this._suppressAutoSpeak = false;
      let supported = this.isTtsSupported();
      // Ronde 142 : Le texte de CE tour est conservé. La garde-fou des retardataires
      // lit plus tard précisément celui-ci – et non ce qui se trouve « dernièrement » dans la
      // session (changement de session, tests écourtés).
      let turnText = this._lastAssistantText();
      if (turnText && turnText.trim()) { this._turnText = turnText; this._turnEndedAt = Date.now(); }
      // Chemin Streaming : la réponse a déjà été prononcée phrase par phrase (ou la
      // file d'attente tourne encore) -> libérer seulement le reste, ne rien lire en double.
      if (this._streamOn && supported && wantSpeak) {
        let spoke = this.endStreamSpeak(turnText);
        if (spoke) return;              // tourne / expire
        this._streamOn = false;         // rien d'exploitable n'a été streamé -> lire toute la réponse
      }
      if (this._streamOn) this.stopStreamSpeak();
      if (!wantSpeak || !supported) {
        this._traceAdd("fin", "muet : " + (!supported ? "pas de TTS" : "réglage/suppression"));
        this._resumeLive();
        return;
      }
      let text = turnText;
      if (!text.trim()) { this._traceAdd("fin", "pas de texte"); this._resumeLive(); return; }
      // Ronde 49 : Dans ce tour, il y a déjà eu une parole (chemin Streaming) –
      // même si `_finishStreamSpeak` a déjà nettoyé la fin. Sinon, le
      // Fallback lirait toute la réponse une DEUXIÈME fois.
      if (this._spokeThisTurn) {
        // Ronde 142 : « déjà prononcé » ne s'applique que si chaque phrase de la
        // réponse a été prononcée. S'il manque quelque chose (parce que le flux visible
        // divergeait du texte enregistré), alors précisément le reste est lu.
        if (this.speakRemainder(text)) return;
        this._traceAdd("fin", "déjà parlé, rien en attente");
        this._resumeLive();
        return;
      }
      this._traceAdd("fin", "entier len=" + text.length);
      this.speak(text, null);
    },

    // Ronde 138 : La garantie qu'une réponse ne reste pas muette. Le chemin
    // normal passe par la commutation Generating (onGenerationStart/End). Si celle-ci
    // est sautée une fois – phase image/photo, lecture supprimée, un
    // tour dont le dernier message est une carte image – la réponse
    // restait jusqu'ici muette pour toujours. Cette garde-fou la lit ultérieurement une seule fois.
    ensureSpokenTurn(delayMs) {
      if (this._speakGuardTimer) clearTimeout(this._speakGuardTimer);
      this._speakGuardTimer = setTimeout(() => {
        this._speakGuardTimer = null;
        try { this._runSpeakGuard(); } catch (e) {}
      }, Math.max(400, delayMs || 1600));
    },

    _runSpeakGuard() {
      if (!App.State || App.State.isGenerating) return;
      if (settings().ttsAutoSpeak === false) return;
      if (this._suppressAutoSpeak) return;
      if (!this.isTtsSupported()) return;
      if (this._speaking) return;
      // Ronde 142 : Lire uniquement le texte du tour qui vient de se terminer – et seulement
      // tant qu'il est réellement le dernier texte de la session. Sinon, la
      // garde-fou lirait une ANCIENNE réponse (vue en direct dans cet environnement)
      // après un changement de session ou un raccourcissement.
      let text = this._turnText;
      if (!text || !text.trim()) return;
      if (!this._turnEndedAt || (Date.now() - this._turnEndedAt) > 25000) return;
      if (this._lastAssistantText() !== text) return;
      if (this._lastSpokenText && this._lastSpokenText === this._cleanText(text)) return;
      // Un état de streaming bloqué (parce que onGenerationEnd
      // a été sauté) ne doit pas laisser la réponse muette pour toujours :
      // libérer d'abord le reste, sinon lire toute la réponse.
      if (this._streamOn) {
        if (this._streamBusy) return;
        if (this._streamQueue.length) {
          try { this._pumpStreamSpeak(); } catch (e) {}
          if (this._streamBusy || this._streamQueue.length) return;
        }
        let spoke = false;
        try { spoke = this.endStreamSpeak(text); } catch (e) { spoke = false; }
        if (spoke) return;
        try { this.stopStreamSpeak(); } catch (e) {}
      }
      // Ronde 142: A déjà été parlé durant ce tour, mais pas toute la
      // réponse, alors seul le reste manque – pas toute la réponse à nouveau.
      if (this._spokeThisTurn) {
        if (this.speakRemainder(text)) return;
        return;
      }
      this._traceAdd("réveil", "entier len=" + String(text).length);
      this.speak(text, null);
    },

    onSend() {
      this._correctEpoch++;
      this._spokeThisTurn = false;
      this._spokenSents = {};
      // Ronde 140: Une nouvelle requête n'est pas un tour d'image. Une marque d'image
      // (elle coupe le son de la lecture) ne doit pas rendre la réponse suivante
      // muette de façon permanente.
      try { if (App.State) App.State._silentVoiceTurn = false; } catch (e) {}
      // Ronde 138: Une nouvelle requête n'est pas un arrêt. Une suppression
      // ("ne pas lire à voix haute") issue d'une interruption antérieure ne doit pas
      // rendre une réponse ultérieure muette de façon permanente.
      this._suppressAutoSpeak = false;
      if (this._listening) this.stopListening();
      if (this._live) {
        if (this._liveTimer) { clearTimeout(this._liveTimer); this._liveTimer = null; }
        this._liveBase = "";
        this._liveFinal = "";
        this._liveFinalBase = "";
        this._liveSessFinal = "";
        this._liveDisplay = "";
        let input = App.UI.cache.promptInputEl;
        if (input) input.classList.remove("liveInterim");
      }
      this._updateLiveButton();
    },

    setVoiceMode(on) {
      settings().voiceMode = !!on;
      App.Data.saveSettings();
      let v = strings();
      if (on && !this.isSttSupported()) {
        settings().voiceMode = false;
        App.Data.saveSettings();
        App.UI.showToast(v.sttUnsupported || "Speech recognition is not available in this browser.", "error");
      } else {
        App.UI.showToast(on ? (v.modeOn || "Voice mode enabled") : (v.modeOff || "Voice mode disabled"), "info");
      }
      if (settings().voiceMode) this._prefetchStt();
      this.refreshUI();
    },

    // --- Micro en direct ---------------------------------------------------------
    isLiveEnabled() { return settings().liveListen === true; },
    isLiveActive() { return !!this._live; },

    setLiveEnabled(on) {
      let v = strings();
      if (on && !this.isSttSupported()) {
        settings().liveListen = false;
        App.Data.saveSettings();
        App.UI.showToast(v.sttUnsupported || "Speech recognition is not available in this browser.", "error");
        this.refreshUI();
        return;
      }
      settings().liveListen = !!on;
      App.Data.saveSettings();
      if (on) {
        this._prefetchStt();
        this._liveArmed = true;
        if (!this._live && !App.State.isGenerating) {
          this.refreshUI();
          this.startLive();
        } else {
          App.UI.showToast(v.liveOn || "Live microphone enabled", "success");
          this.refreshUI();
        }
      } else {
        this._liveArmed = false;
        this.stopLive();
        App.UI.showToast(v.liveOff || "Live microphone disabled", "info");
        this.refreshUI();
      }
    },

    setLiveLang(value) {
      settings().liveListenLang = value || "auto";
      App.Data.saveSettings();
      let sel = App.UI && App.UI.cache && App.UI.cache.liveListenLangSelect;
      if (sel) sel.value = this.liveLangSetting();
      if (this._live) { this._restartLive(); }
    },

    setLiveAutoSend(on) {
      settings().liveAutoSend = !!on;
      App.Data.saveSettings();
      let v = strings();
      App.UI.showToast(on ? (v.liveAutoSendOn || "Sent automatically after a pause") : (v.liveAutoSendOff || "Review before sending"), "info");
    },

    toggleLive() {
      let v = strings();
      if (!this.isSttSupported()) { App.UI.showToast(v.sttUnsupported || "Speech recognition is not available in this browser.", "error"); return; }
      if (this._live) { this.stopLive(); return; }
      if (App.State.isGenerating) { App.UI.showToast(v.busy || "Sofia is still answering…", "info"); return; }
      if (!this.isLiveEnabled()) { this.setLiveEnabled(true); return; }
      this.startLive();
    },

    validateLive() {
      let v = strings();
      let input = App.UI.cache.promptInputEl;
      let text = input ? (input.value || "").trim() : "";
      if (!text) { App.UI.showToast(v.liveNothing || "Nothing to send yet — speak first.", "info"); return; }
      if (this._liveTimer) { clearTimeout(this._liveTimer); this._liveTimer = null; }
      this._liveBase = "";
      this._liveFinal = "";
      this._liveFinalBase = "";
      this._liveSessFinal = "";
      this._liveDisplay = "";
      if (input) input.classList.remove("liveInterim");
      this._updateLiveButton();
      try {
        if (App.Core && App.Core.toggleGeneration) App.Core.toggleGeneration();
        else if (App.Core && App.Core.sendMessage) App.Core.sendMessage();
      } catch (e) {
        console.warn("[Voice] live validation failed", e);
      }
    },

    // --- «[Musique]» ne doit jamais figurer dans le champ de saisie ---------------------------------
    // Whisper fournit des tags comme «[Musique]»,
    // «(applause)», «♪», «*laughter*» – ou même des crédits de sous-titres – en cas de musique, de silence ou de bruits parasites. Ceux-ci
    // sont filtrés ici. Ce qui reste vide après cela n'était pas du langage : Sofia
    //  n'écrit alors rien dans le champ et n'y répond pas non plus.
    _cleanTranscript(raw) {
      const S = App.STT;
      // `bare: true` concerne UNIQUEMENT les transcriptions : une réponse qui ne consiste
      // qu'en mots de bruitage («Musique», «bruit de fond»), est un tag.
      let t = String(raw == null ? "" : raw);
      if (S && typeof S.stripNonSpeech === "function") { try { t = S.stripNonSpeech(t, { bare: true }); } catch (e) {} }
      // Les chaînes de débuts croissants («Donc», «donc en», «donc en changeant», …)
      // sont une boucle de répétition de la reconnaissance, pas une phrase : seul le dernier
      // fragment, le plus long, est conservé. Cela s'applique aux DEUX moteurs et indépendamment
      // du fait que la correction soit activée ou non (Ronde 102).
      if (S && typeof S.collapseChained === "function") { try { t = S.collapseChained(t); } catch (e) {} }
      return String(t == null ? "" : t).trim();
    },
    _noSpeech(raw) {
      const S = App.STT;
      if (S && typeof S.isNonSpeech === "function") { try { return S.isNonSpeech(raw); } catch (e) {} }
      return !String(raw == null ? "" : raw).trim();
    },
    _joinSpoken(a, b) {
      if (!a) return b || "";
      if (!b) return a;
      return /\s$/.test(a) ? a + b : a + " " + b;
    },
    // Les mots d'un texte ainsi que leur position dans l'original (pour les chevauchements).
    _scanWords(t) {
      const s = String(t == null ? "" : t), out = [];
      const re = /[\p{L}\p{N}]+/gu;
      let m;
      while ((m = re.exec(s)) !== null) {
        out.push({ w: m[0].toLowerCase().normalize("NFD").replace(/\p{M}+/gu, ""), start: m.index });
      }
      return out;
    },
    /**
     * Fusionner deux fragments parlés sans jamais rien écrire en double.
     * La reconnaissance fournit, selon le moteur et la position, soit uniquement la NOUVELLE partie
     * (segment), l'intégralité de l'état actuel (état intermédiaire) ou les deux
     * ensemble (boucle). Les trois cas arrivent ici correctement :
     *   • le nouveau est un début de l'existant ⇒ l'existant reste,
     *   • l'existant est un début du nouveau  ⇒ le nouveau le remplace,
     *   • ils se chevauchent à la fin/au début du mot ⇒ seul le reste est ajouté,
     *   • sinon                                  ⇒ simplement juxtaposés.
     */
    _mergeSpoken(a, b) {
      const prev = String(a == null ? "" : a).trim();
      const next = String(b == null ? "" : b).trim();
      if (!prev) return next;
      if (!next) return prev;
      const wa = this._scanWords(prev), wb = this._scanWords(next);
      if (wa.length && wb.length) {
        const prefixOf = (p, q) => {
          if (p.length > q.length) return false;
          for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) return false;
          return true;
        };
        const A = wa.map((x) => x.w), B = wb.map((x) => x.w);
        if (prefixOf(B, A)) return prev;          // seulement un état intermédiaire précédent
        if (prefixOf(A, B)) return next;          // l'état actuel est le début
        const max = Math.min(A.length, B.length);
        for (let n = max; n >= 2; n--) {
          let ok = true;
          for (let i = 0; i < n; i++) { if (A[A.length - n + i] !== B[i]) { ok = false; break; } }
          if (!ok) continue;
          if (n >= B.length) return prev;      // «next» est déjà contenu dans «prev»
          return this._joinSpoken(prev.replace(/\s+$/, ""), next.slice(wb[n].start));
        }
        // Un SEUL mot chevauchant n'est supprimé que s'il
        // est long et sans ambiguïté («…l'image» / «image de ce verre») :
        // les mots courts du quotidien peuvent légitimement se répéter («oui oui»).
        const last = A[A.length - 1];
        if (A.length >= 2 && B.length >= 2 && last === B[0] && last.length >= 5 && !MERGE_KEEP_WORDS.has(last)) {
          return this._joinSpoken(prev.replace(/\s+$/, ""), next.slice(wb[1].start));
        }
      }
      return this._joinSpoken(prev, next);
    },
    _flagNoise() {
      let v = strings();
      // En mode sons (soundsMode = on), un bruit non linguistique
      // n'est pas une erreur, mais un événement évalué par src/vocal.js. Alors
      // l'indication «c'était un bruit de fond» n'apparaît pas — le protocole
      // affiche à la place ce qui a été reconnu ou rejeté.
      if (settings().soundMode === "on") return true;
      this._noiseNotice = v.sttHeardNoise || "That was background noise, not speech — I'm still listening.";
      if (this._noiseTimer) clearTimeout(this._noiseTimer);
      this._noiseTimer = setTimeout(() => {
        this._noiseTimer = null;
        this._noiseNotice = null;
        this._updateSttStatus();
      }, 5000);
      this._updateSttStatus();
      return true;
    },

    // --- Correction de la transcription : Orthographe + Sens -------------------
    // Niveau 1 (toujours, sans réseau) : App.STT.correctText – apostrophes, ponctuation,
    // majuscules, a/à, et/est, ou/où, ca/ça, «[musique]» …
    // Niveau 2 («smart») : un bref appel de modèle sur le canal propre de Sofia
    // (App.Core.generateText → le fournisseur configuré par l'utilisateur, sinon le
    // moteur Perchance intégré). Il voit la phrase déjà nettoyée localement
    // et répare
    // les mots mal reconnus – sans traduire et sans inventer.
    // Le résultat n'est adopté que s'il est plausible (longueur, écriture,
    // chevauchement de mots) ; sinon, le niveau 1 est maintenu. Si le modèle échoue,
    // la correction n'est donc jamais pire que sans elle.
    correctMode() {
      const m = settings().sttCorrect;
      return (m === "off" || m === "local" || m === "ai") ? m : "ai";
    },
    setSttCorrect(value) {
      settings().sttCorrect = (value === "off" || value === "local" || value === "ai") ? value : "ai";
      App.Data.saveSettings();
      this.refreshUI();
    },
    isCorrecting() { return !!this._correcting; },
    // Le premier appel au modèle après le chargement est nettement plus lent que tous
    // les suivants (démarrage à froid du moteur). C'est pourquoi il est
    // préchauffé en arrière-plan dès le début de l'écoute – ainsi, la première
    // correction est aussi rapide que les suivantes.
    _warmCorrector() {
      try {
        if (this.correctMode() !== "ai") return;
        if (App.Providers && App.Providers.isExternal && App.Providers.isExternal()) return;
        if (this._correctWarm) return;
        if (this._correctWarmAt && Date.now() - this._correctWarmAt < 90000) return;
        const Core = App.Core;
        if (!Core || typeof Core.generateText !== "function") return;
        this._correctWarmAt = Date.now();
        const settle = Promise.resolve(
          Core.generateText({ instruction: "Reply with the single word: ready", temperature: 0, maxTokens: 4 })
        ).then(() => {}, () => {});
        this._correctWarm = settle;
        settle.then(() => { if (this._correctWarm === settle) this._correctWarm = null; });
      } catch (e) {}
    },
    _localCorrect(text) {
      const S = App.STT;
      if (!S || typeof S.correctText !== "function") return String(text == null ? "" : text).trim();
      try { return S.correctText(text, this.liveLang() || this.currentSpeechLang()); } catch (e) { return text; }
    },
    // Combien de temps l'auto-envoi peut-il attendre la correction du sens ? Le moteur
    // intégré termine parfois en 1,2 s, parfois en 55 s (charge partagée). Au lieu de deviner
    // un chiffre fixe, la dernière durée mesurée est extrapolée – et si le
    // moteur a été trop lent deux fois de suite, on n'attend plus du tout.
    _waitForCorrectionMs() {
      if (settings().liveAutoSend === false) return 0;
      // Deux pannes consécutives signifient : le moteur est actuellement bloqué. Alors on n'attend
      // plus – mais seulement pendant un certain temps. Sans cette expiration, la
      // correction du sens serait désactivée pour le reste de la session après deux pics de charge, et
      // chaque phrase suivante partirait sans correction.
      if (this._correctFailAt && Date.now() - this._correctFailAt > CORRECT_FAIL_FORGIVE_MS) this._correctFailStreak = 0;
      if ((this._correctFailStreak || 0) >= 2) return 0;
      const lat = this._correctLatency;
      if (!lat) return CORRECT_FIRST_WAIT_MS;
      return Math.max(3000, Math.min(CORRECT_MAX_WAIT_MS, Math.round(lat * 1.8 + 1800)));
    },
    _correct(text) {
      const raw = String(text == null ? "" : text).trim();
      if (this.correctMode() === "off") return Promise.resolve(raw);
      const local = this._localCorrect(raw);
      if (!local) return Promise.resolve("");
      if (this.correctMode() !== "ai") return Promise.resolve(local);
      this._correctQueue = (this._correctQueue || 0) + 1;
      if (this._correctQueue === 1) this._correctDeadline = Date.now() + this._waitForCorrectionMs();
      this._correcting = true;
      this._updateSttStatus();
      const prev = this._correctChain || Promise.resolve();
      const run = prev.then(() => this._aiCorrect(local), () => this._aiCorrect(local));
      this._correctChain = run.then(() => {}, () => {});
      const finish = () => {
        this._correctQueue = Math.max(0, (this._correctQueue || 1) - 1);
        if (!this._correctQueue) { this._correcting = false; this._correctDeadline = 0; }
        this._updateSttStatus();
      };
      return run.then(
        (fixed) => { finish(); return fixed || local; },
        () => { finish(); return local; }
      );
    },
    async _aiCorrect(local) {
      const Core = App.Core;
      if (!Core) return local;
      const cache = this._correctCache || (this._correctCache = new Map());
      const lang = this.liveLang() || this.currentSpeechLang() || "";
      const key = String(lang) + "\u0000" + local;
      if (cache.has(key)) return cache.get(key);
      // Le moteur était récemment surchargé (une ressource partagée) : pendant un certain temps
      // ne pas demander du tout, plutôt que de faire attendre chaque phrase pendant 15 s.
      if (Date.now() < (this._correctBackoffUntil || 0)) return local;
      // Le démarrage à froid est déjà en cours (voir _warmCorrector) : attendre d'abord qu'il se termine,
      // sinon les deux appels se bloqueraient mutuellement.
      if (this._correctWarm) { try { await withTimeout(this._correctWarm, 6000); } catch (e) {} }
      const started = Date.now();
      try {
        const code = String(lang).slice(0, 2).toLowerCase();
        const instruction = AI_CORRECT_PROMPT
          .replace("{lang}", LANG_NAMES[code] || "the language of the transcript")
          .replace("{text}", local);
        const params = { instruction: instruction, temperature: 0.2, maxTokens: 200 };
        const call = (typeof Core.generateText === "function")
          ? Core.generateText(params)
          : (typeof Core.runInternal === "function" ? Core.runInternal(params) : null);
        if (!call) return local;
        const out = await withTimeout(Promise.resolve(call), AI_CORRECT_MS);
        const fixed = this._sanitizeCorrection(out, local) || local;
        const dt = Date.now() - started;
        this._correctLatency = this._correctLatency
          ? Math.round(this._correctLatency * 0.6 + dt * 0.4)
          : dt;
        this._correctFailStreak = 0;
        this._correctBackoffUntil = 0;
        if (fixed !== local) {
          cache.set(key, fixed);
          if (cache.size > AI_CORRECT_CACHE_MAX) cache.delete(cache.keys().next().value);
        }
        return fixed;
      } catch (e) {
        const msg = (e && e.message) || String(e);
        try { console.warn("[Voice] smart correction failed", msg); } catch (e2) {}
        this._correctFailStreak = (this._correctFailStreak || 0) + 1;
        this._correctFailAt = Date.now();
        // Un délai d'expiration signifie « le moteur est actuellement lent », et non
        // « cassé » : on attend alors simplement un peu moins longtemps et on marque une pause silencieuse –
        // sans le message qui apparaît habituellement lors du réglage du micro.
        const timedOut = /timeout/i.test(msg);
        if (timedOut && this._correctFailStreak >= 3 && !this._correctBackoffUntil) {
          this._correctBackoffUntil = Date.now() + 60000;
        } else if (!timedOut && this._correctFailStreak >= 3 && !this._correctBackoffUntil) {
          this._correctBackoffUntil = Date.now() + 120000;
          try { App.UI.showToast(strings().sttCorrectFallback || "Sofia's model is busy right now — for the moment the spelling is corrected here on this device.", "info"); } catch (e3) {}
        }
        return local;
      }
    },
    _sanitizeCorrection(out, local) {
      let s = "";
      if (out == null) return "";
      if (typeof out === "string") s = out;
      else if (typeof out.text === "string") s = out.text;
      else if (typeof out.content === "string") s = out.content;
      else s = String(out);
      s = s.replace(/\r/g, "\n");
      s = s.replace(/```[a-z]*/gi, " ").replace(/<\/?[a-z][^>]{0,60}>/gi, " ");
      s = s.split(/\n+/).map((x) => x.trim()).filter(Boolean).join(" ").trim();
      s = s.replace(/^[«"'“”‘’\s]+/, "").replace(/[»"'“”‘’\s]+$/, "").trim();
      s = s.replace(/^(?:voici|voilà|voila|correction|texte corrigé|texte corrige|transcription corrigée|transcription corrigee|corrected (?:text|transcript)|here is)[^:.!?]{0,40}[:.]\s*/i, "").trim();
      s = s.replace(/\s{2,}/g, " ").trim();
      // Les boucles de répétition de la reconnaissance (chaînes de débuts croissants) ne doivent
      // pas être insérées dans le champ comme une « correction » – sinon l'erreur de
      // reconnaissance apparaîtrait comme texte de l'utilisateur (Ronde 102).
      const S = App.STT;
      if (S && typeof S.collapseChained === "function") { try { const c = S.collapseChained(s); if (c !== s) s = c; } catch (e) {} }
      if (!s) return "";
      if (s.length > 2.4 * local.length) return "";
      if (s.length / Math.max(1, local.length) < 0.5) return "";
      const cls = scriptClass(local);
      if (cls !== "none" && scriptClass(s) !== cls) return "";
      const a = normTokens(s), b = normTokens(local);
      if (!a.length) return "";
      if (b.length >= 3) {
        const set = new Set(b);
        let shared = 0;
        for (const w of a) if (set.has(w)) shared++;
        if (shared / a.length < 0.4) return "";
      }
      if (S && typeof S.isNonSpeech === "function") { try { if (S.isNonSpeech(s)) return ""; } catch (e) {} }
      return s;
    },

    // --- Garde du clavier --------------------------------------------------------
    // Celui qui tape ne parle pas. Tant que les touches cliquettent, le micro reste
    // muet : sinon les bruits de claquement finiraient en « [Musique] » dans le champ de saisie,
    // et la reconnaissance écrirait à l'utilisateur au milieu de sa phrase. Après la
    // dernière frappe, Sofia écoute à nouveau après TYPING_HOLD_MS.
    _typingActive() { return Date.now() < (this._typingUntil || 0); },
    _bindTypingGuard() {
      let input = App.UI && App.UI.cache && App.UI.cache.promptInputEl;
      if (!input || this._typingGuardEl === input) return;
      this._typingGuardEl = input;
      this._typingKeyHandler = (e) => this._onPromptKey(e);
      try { input.addEventListener("keydown", this._typingKeyHandler); } catch (e) {}
    },
    _onPromptKey(e) {
      if (!this._live && !this._listening) return;
      if (!e) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;   // Les raccourcis (Copier …) ne sont pas de la frappe
      const k = e.key;
      const typed = typeof k === "string" && (k.length === 1 || TYPING_KEY.test(k));
      if (!typed) return;
      this._noteTyping();
    },
    _noteTyping() {
      this._typingUntil = Date.now() + TYPING_HOLD_MS;
      // Celui qui tape veut envoyer lui-même – et non être envoyé sous ses doigts.
      if (this._liveTimer) { clearTimeout(this._liveTimer); this._liveTimer = null; }
      if (!this._typingPaused) {
        this._typingPaused = true;
        this._syncPause();
        this._updateSttStatus();
        this._updateLiveButton();
      }
      if (this._typingTimer) clearTimeout(this._typingTimer);
      this._typingTimer = setTimeout(() => {
        this._typingTimer = null;
        this._typingPaused = false;
        this._typingUntil = 0;
        this._syncPause();
        this._updateSttStatus();
        this._updateLiveButton();
      }, TYPING_HOLD_MS);
    },
    // Ne mettre le micro en pause que si quelque chose est réellement entendu en pause : Sofia
    // répond (la réponse est lue) OU l'utilisateur est en train de taper.
    _syncPause() {
      if (!this._live || !usingLocal() || !App.STT) return;
      try { App.STT.setPaused(!!this._liveSuspended || !!this._typingPaused); } catch (e) {}
    },
    _clearTyping() {
      if (this._typingTimer) { clearTimeout(this._typingTimer); this._typingTimer = null; }
      this._typingPaused = false;
      this._typingUntil = 0;
    },

    _wireRecognition(rec) {
      rec.lang = this.liveLang();
      rec.continuous = true;
      rec.interimResults = true;
      // Chaque nouvelle session de la reconnaissance intégrée commence avec une liste
      // `results` vide : c'est ici que le texte terminé jusqu'à présent est repris,
      // afin qu'il ne soit pas perdu lors du redémarrage (Ronde 102).
      rec.onstart = () => { try { this._commitLiveSession(); } catch (e) {} };
      rec.onresult = (e) => this._onLiveResult(e);
      rec.onerror = (e) => {
        let code = e && e.error;
        if (code === "not-allowed" || code === "service-not-allowed") {
          // D'abord fermer l'état en cours (sinon `onend` redémarre la
          // reconnaissance immédiatement), puis `_nativeRefused` prend le relais : soit le
          // moteur local, soit le message « Micro refusé ».
          this._liveManualStop = true;
          this._live = false;
          this._updateLiveButton();
          this._nativeRefused(code, "live");
        }
      };
      rec.onend = () => {
        if (this._live && !this._liveManualStop && !this._liveSuspended) {
          try { rec.start(); return; } catch (e) {
            // Le même objet ne peut pas être redémarré indéfiniment (InvalidStateError).
            // Alors le rejeter – le gardien en construit un nouveau immédiatement, plutôt que de
            // laisser le micro muet.
            if (this._liveRec === rec) this._liveRec = null;
          }
        }
        if (this._liveManualStop) { this._live = false; this._updateLiveButton(); }
      };
    },

    _beginRecognition() {
      if (!this.isSttSupported()) return;
      try {
        let rec = new SR();
        this._wireRecognition(rec);
        this._liveRec = rec;
        this._liveManualStop = false;
        rec.start();
      } catch (err) {
        console.error("[Voice] live microphone failed to start", err);
        App.UI.showToast(strings().sttUnsupported || "Speech recognition is not available in this browser.", "error");
        this._live = false;
        this._updateLiveButton();
      }
    },
    // La reconnaissance intégrée peut être honnêtement [limitée] par un cadre d'intégration
    // être refusé (`not-allowed` / `service-not-allowed`). L'important est de savoir
    // QUI refuse : la page dans son ensemble (autorisation du micro) ou seulement la
    // reconnaissance vocale. Seulement dans le second cas, Sofia bascule vers le moteur de la
    // page — si le micro est bloqué, aucun moteur n'aide, le message alors reste
    // affiché. Le changement d'état se produit déjà SYNCHRONEMENT dans le gestionnaire onerror
    // (voir ci-dessus), ici seulement la décision et la transition.
    async _nativeRefused(code, mode) {
      const S = App.STT;
      let v = strings();
      if (!S || typeof S.markNativeBlocked !== "function") {
        App.UI.showToast(v.micDenied || "Microphone access was denied.", "error");
        return false;
      }
      let mic = "unknown";
      try { if (S.micPermission) mic = await S.micPermission(); } catch (e) {}
      if (mic === "denied") {
        App.UI.showToast(v.micDenied || "Microphone access was denied.", "error");
        return false;
      }
      const next = S.markNativeBlocked(code);
      if (next !== "local") {
        App.UI.showToast(v.sttUnsupported || "Speech recognition is not available in this browser.", "error");
        return false;
      }
      App.UI.showToast(v.sttNativeFallback || "Browser recognition is refused here — continuing with the in-page model.", "info");
      this._recognition = null;
      this._liveRec = null;
      if (mode === "live") {
        // Le moteur local prend le contenu actuel du champ comme base — la partie déjà
        // dictée reste donc en place et la suite s'effectue sans couture.
        this._liveArmed = true;
        this.refreshUI();
        this._startLocalLive();
      } else {
        this.refreshUI();
        this._startLocalOnce();
      }
      return true;
    },

    startLive() {
      if (!this.isSttSupported()) { App.UI.showToast(strings().sttUnsupported || "Speech recognition is not available in this browser.", "error"); return; }
      if (usingLocal()) { this._startLocalLive(); return; }
      this._bindTypingGuard();
      let input = App.UI.cache.promptInputEl;
      this._liveBase = input ? (input.value || "") : "";
      if (this._liveBase && !/\s$/.test(this._liveBase)) this._liveBase += " ";
      this._liveFinal = "";
      this._liveFinalBase = "";
      this._liveSessFinal = "";
      this._liveDisplay = "";
      this._liveSuspended = false;
      this._liveResumePending = false;
      this._live = true;
      this._liveArmed = true;
      this._warmCorrector();
      this._beginRecognition();
      this._updateLiveButton();
      this._startLiveWatchdog();
      let v = strings();
      App.UI.showToast(v.liveListeningOn || "Live microphone: listening", "success");
    },

    // En direct avec le moteur local : écoute permanente, découpage au silence,
    // écriture de chaque phrase terminée dans le champ de saisie (et comme d'habitude,
    // envoi automatique si « envoyer après une pause » est activé).
    async _startLocalLive() {
      let v = strings();
      const S = App.STT;
      if (!S) return;
      if (this._live) { this.stopLive(); return; }
      this._bindTypingGuard();
      let input = App.UI.cache.promptInputEl;
      this._liveBase = input ? (input.value || "") : "";
      if (this._liveBase && !/\s$/.test(this._liveBase)) this._liveBase += " ";
      this._liveFinal = "";
      this._liveFinalBase = "";
      this._liveSessFinal = "";
      this._liveDisplay = "";
      this._liveSuspended = false;
      this._liveResumePending = false;
      this._liveManualStop = false;
      this._live = true;
      this._liveArmed = true;
      this._sttNotice = null;
      this._updateLiveButton();
      this._startLiveWatchdog();
      this._notifyLocalEngine();
      this._warmCorrector();
      try {
        const liveOpts = {
          lang: this.liveLang(),
          onState: (s) => this._sttState(s),
          onProgress: (p) => this._sttProgress(p),
          onError: (e) => this._sttFail(e),
          onFrame: (f) => { try { if (App.Vocal) App.Vocal.frame(f); } catch (e) {} },
          wantFrames: () => { try { return !!(App.Vocal && App.Vocal.isOn()); } catch (e) { return false; } },
          onText: (text) => {
            if (this._typingActive()) return;      // Surveillance du clavier : l'utilisateur est en train de taper
            let clean = this._cleanTranscript(text);
            if (!clean) { if (this._noSpeech(text)) this._flagNoise(); return; }
            const epoch = this._correctEpoch;
            const off = this.correctMode() === "off";
            // Afficher immédiatement la version corrigée localement (l'utilisateur voit que
            // cela a été entendu – mais jamais à l'état brut, sans ponctuation et avec a au lieu de à) …
            const shown = off ? clean : (this._localCorrect(clean) || clean);
            this._writeLive(this._mergeSpoken(this._liveDisplay, shown), false);
            this._liveFinal = this._liveDisplay;
            // Lancer immédiatement la pause d'envoi : la validation ne doit pas s'effectuer sur le
            // Attente du modèle. Si la correction sémantique arrive pendant la courte pause
            // est encore en cours, elle remplace tout de même la phrase avant l'envoi.
            this._armLiveSend();
            if (off) return;
            // … et dès que la correction sémantique est là, la phrase est remplacée.
            this._correct(clean).then((fixed) => {
              if (fixed && fixed !== shown && !this._typingActive() && !App.State.isGenerating && epoch === this._correctEpoch) {
                this._replaceShown(shown, fixed);
                this._liveFinal = this._liveDisplay;
              }
            });
          }
        };
        this._lastLiveOpts = liveOpts;
        this._liveMicDenied = false;
        this._lastReviveAt = 0;
        const liveOk = await S.startLive(liveOpts);
        // Coupé entre-temps (ou démarrage annulé) : ne pas afficher « j'écoute ».
        if (!this._live) return;
        if (liveOk === false) {
          let dead = true;
          try { const inf = (S.info && S.info()) || {}; dead = !inf.live; } catch (e) {}
          if (dead) {
            this._live = false;
            this._updateLiveButton();
            this._sttState({ phase: "idle" });
            return;
          }
        }
        App.UI.showToast(v.liveListeningOn || "Live microphone: listening", "success");
      } catch (e) {
        this._live = false;
        this._liveMicDenied = true;
        this._updateLiveButton();
        this._sttState({ phase: "idle" });
        App.UI.showToast(v.micDenied || "Microphone access was denied.", "error");
      }
    },

    stopLive() {
      this._correctEpoch++;
      this._liveManualStop = true;
      this._live = false;
      this._stopLiveWatchdog();
      this._liveSuspended = false;
      this._liveResumePending = false;
      if (this._liveTimer) { clearTimeout(this._liveTimer); this._liveTimer = null; }
      if (this._noiseTimer) { clearTimeout(this._noiseTimer); this._noiseTimer = null; }
      this._noiseNotice = null;
      this._clearTyping();
      if (App.Vocal) { try { App.Vocal.reset(); } catch (e) {} }
      if (usingLocal() && App.STT) { try { App.STT.stopLive(); } catch (e) {} }
      let rec = this._liveRec;
      this._liveRec = null;
      if (rec) { try { rec.stop(); } catch (e) {} }
      this._liveBase = "";
      this._liveFinal = "";
      this._liveFinalBase = "";
      this._liveSessFinal = "";
      this._liveDisplay = "";
      this._liveArmed = this.isLiveEnabled();
      let input = App.UI.cache.promptInputEl;
      if (input) input.classList.remove("liveInterim");
      this._updateLiveButton();
    },

    _suspendLive() {
      if (!this._live || this._liveSuspended) return;
      this._liveSuspended = true;
      if (this._liveTimer) { clearTimeout(this._liveTimer); this._liveTimer = null; }
      if (usingLocal()) {
        this._syncPause();
        this._updateLiveButton();
        return;
      }
      let rec = this._liveRec;
      this._liveRec = null;
      if (rec) { try { rec.stop(); } catch (e) {} }
      this._updateLiveButton();
    },

    _resumeLive() {
      this._ensureLiveRestored();
    },

    // Ronde 51 : l'état vert « j'écoute » ne devait pas mentir.
    // Auparavant, « _liveSuspended = false » était considéré comme « micro actif » – mais la
    // détection intégrée n'était redémarrée que tant qu'elle était en pause
    // ET que Sofia ne répondait plus. Si la parole s'achevait encore PENDANT la
    // génération (typiquement : la dernière phrase était prononcée, puis venait la
    // phase d'image/nettoyage – `_silentVoiceTurn` supprime alors même
    // `onGenerationEnd`), alors `_afterSpeech` remettait `_liveSuspended` à false,
    // mais ne redémarrait pas la détection (isGenerating était encore true). Plus tard,
    // `_liveSuspended` était déjà false, donc `_resumeLive()` ne faisait plus rien :
    // le bouton indiquait « écoute », alors que `_liveRec` était null – le micro
    // était sourd. Cette méthode rétablit l'état réel (pas seulement le flag).
    _ensureLiveRestored() {
      if (!this._live) return;
      if (this._typingPaused) { this._updateLiveButton(); return; }
      if (App.State.isGenerating || this._speaking) { this._updateLiveButton(); return; }
      if (this._liveSuspended) this._liveSuspended = false;
      if (usingLocal()) {
        this._syncPause();
        this._updateLiveButton();
        try { this._maybeReviveLocalLive(); } catch (e) {}
        return;
      }
      if (!this._liveRec) this._beginRecognition();
      this._updateLiveButton();
    },

    _startLiveWatchdog() {
      if (this._liveWatchdog) return;
      // Le gardien est le filet de sécurité : transitions d'état (réponse terminée,
      // tour d'image silencieux, fin perdue) ne doivent jamais laisser le microphone
      // sourd.
      this._liveWatchdog = setInterval(() => {
        try { if (!this._live) { this._stopLiveWatchdog(); return; } this._ensureLiveRestored(); } catch (e) {}
      }, 1500);
    },

    _stopLiveWatchdog() {
      if (this._liveWatchdog) { clearInterval(this._liveWatchdog); this._liveWatchdog = null; }
    },

    // Redémarrage PROPRE : l'arrêt (qui peut attendre la fin d'une
    // transcription) est vraiment retombé avant de redémarrer — sinon l'arrêt
    // tardif tue le nouveau micro et le bouton reste vert sur un micro sourd.
    async _restartLive() {
      try {
        const want = this._live || this._liveArmed;
        const enabled = this.isLiveEnabled();
        this.stopLive();
        try {
          const S = App.STT;
          if (S && S.waitQuiescent) { try { await S.waitQuiescent(2500); } catch (e) {} }
        } catch (e) {}
        if (want && enabled && this.isLiveEnabled()) this.startLive();
      } catch (e) {}
    },

    // Filet de sécurité : si le moteur local est mort (piste coupée, arrêt
    // resté en travers) alors que le bouton dit « j'écoute » et que rien ne
    // parle ni ne génère réellement, on relance — une fois toutes les 20 s
    // max, et jamais si le micro a été refusé (pas de harcèlement d'autorisation).
    _maybeReviveLocalLive() {
      try {
        if (!this._live || this._liveSuspended || this._typingPaused) return;
        if (!usingLocal()) return;
        if ((App.State && App.State.isGenerating) || this._speaking) return;
        if (this._liveMicDenied) return;
        const S = App.STT;
        if (!S || typeof S.info !== "function" || !this._lastLiveOpts) return;
        let inf = null;
        try { inf = S.info(); } catch (e) { return; }
        if (inf && (inf.live || inf.active || inf.speaking || inf.stopping)) return;
        const now = Date.now();
        if (now - (this._lastReviveAt || 0) < 20000) return;
        this._lastReviveAt = now;
        const opts = Object.assign({}, this._lastLiveOpts);
        Promise.resolve().then(async () => {
          try {
            if (!this._live || this._liveSuspended || this._typingPaused) return;
            if ((App.State && App.State.isGenerating) || this._speaking) return;
            if (this._liveMicDenied) return;
            await S.startLive(opts);
          } catch (e) {
            try {
              const m = String((e && e.message) || e);
              if (/denied|not-allowed|permission/i.test(m)) this._liveMicDenied = true;
            } catch (e2) {}
          }
        }).catch(() => {});
      } catch (e) {}
    },

    _resetLiveText() {
      this._correctEpoch++;
      this._liveBase = "";
      this._liveFinal = "";
      this._liveFinalBase = "";
      this._liveSessFinal = "";
      this._liveDisplay = "";
      if (this._liveTimer) { clearTimeout(this._liveTimer); this._liveTimer = null; }
      let input = App.UI.cache.promptInputEl;
      if (input) input.classList.remove("liveInterim");
      this._updateLiveButton();
    },

    // Une nouvelle session de reconnaissance commence (onstart) : le texte
    // terminé jusqu'ici est repris, la session elle-même est remise à zéro – la
    // liste `results` de la reconnaissance intégrée recommence à 0.
    _commitLiveSession() {
      this._liveFinalBase = String(this._liveFinal || "");
      this._liveSessFinal = "";
    },

    _onLiveResult(e) {
      if (this._typingActive()) return;          // garde de clavier
      // Le texte terminé n'est PAS écrit de manière persistante, mais est
      // construit à nouveau à chaque événement à partir de la liste `results`.
      // Certains navigateurs signalent à nouveau des résultats déjà terminés – en les
      // additionnant, on obtiendrait exactement l'erreur vue par l'utilisateur : le même
      // début de phrase répété sans cesse („Donc", „donc en", „donc en changeant", …).
      // Construit à nouveau, rien ne peut se doubler (Ronde 102).
      let interim = "", sess = "", added = "";
      for (let i = 0; i < e.results.length; i++) {
        let r = e.results[i];
        if (!r || !r[0]) continue;
        const seg = String((r[0] && r[0].transcript) || "");
        if (!seg) continue;
        if (r.isFinal) { sess = this._mergeSpoken(sess, seg); if (i >= e.resultIndex) added = this._mergeSpoken(added, seg); }
        else if (i >= e.resultIndex) interim = this._mergeSpoken(interim, seg);
      }
      this._liveSessFinal = sess;
      const base = String(this._liveFinalBase || "");
      const final = this._mergeSpoken(base, sess);
      let heard = this._cleanTranscript(final);
      let partial = this._cleanTranscript(interim);
      if (!heard && !partial) {
        if (this._noSpeech(this._joinSpoken(final, interim))) this._flagNoise();
        return;
      }
      this._liveFinal = final;
      // Afficher d'abord la version corrigée localement (ponctuation, a/à, …) – le
      // champ n'est ainsi jamais brut pendant que la correction sémantique s'exécute.
      const off = this.correctMode() === "off";
      const shown = off ? heard : (this._localCorrect(heard) || heard);
      this._writeLive(this._mergeSpoken(shown, partial), !!partial);
      this._armLiveSend();
      // Reconnaissance navigateur : corriger uniquement en fin de phrase, jamais au milieu d'un intérim.
      if (added && !partial && !off) {
        const epoch = this._correctEpoch;
        this._correct(heard).then((fixed) => {
          if (!fixed || fixed === shown) return;
          if (this._typingActive() || App.State.isGenerating || epoch !== this._correctEpoch) return;
          this._replaceShown(shown, fixed);
        });
      }
    },

    _writeLive(text, hasInterim) {
      let input = App.UI.cache.promptInputEl;
      if (!input) return;
      if (App.State.isGenerating) return;
      this._liveDisplay = text;
      input.value = this._liveBase + text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.scrollTop = input.scrollHeight;
      input.classList.toggle("liveInterim", !!hasInterim);
      this._updateLiveButton();
    },

    // Remplacer une section déjà affichée dans le champ par la meilleure version
    // (correction locale ou sémantique). Retourne true si l'opération a réussi.
    _replaceShown(from, to) {
      if (!from || !to || from === to) return false;
      const cur = (this._liveDisplay != null && this._liveDisplay !== "")
        ? this._liveDisplay
        : (() => {
            const input = App.UI.cache.promptInputEl;
            if (!input) return "";
            const v = String(input.value || "");
            const base = this._liveBase || "";
            return v.startsWith(base) ? v.slice(base.length) : v;
          })();
      const at = cur.indexOf(from);
      if (at < 0) return false;
      this._liveDisplay = cur.slice(0, at) + to + cur.slice(at + from.length);
      this._writeLive(this._liveDisplay, false);
      return true;
    },

    _armLiveSend() {
      if (this._liveTimer) clearTimeout(this._liveTimer);
      this._sendGraceUntil = 0;
      if (settings().liveAutoSend === false) return;
      this._liveTimer = setTimeout(() => this._maybeAutoSend(), AUTO_SEND_PAUSE_MS);
    },

    _maybeAutoSend() {
      this._liveTimer = null;
      if (!this._live || App.State.isGenerating || this._speaking) return;
      if (this._typingActive()) return;          // Tastatur-Wache
      // La correction sémantique peut retarder brièvement la phrase – mais seulement
      // pendant un court délai de grâce. Ensuite, l'envoi se fait avec la version
      // corrigée localement ; une réponse tardive du modèle est ignorée (Epoch augmente dans onSend).
      if (this._correcting) {
        const grace = this._sendGraceUntil || (this._sendGraceUntil = Date.now() + Math.max(CORRECT_SEND_GRACE_MS, this._waitForCorrectionMs()));
        if (Date.now() < grace) { this._liveTimer = setTimeout(() => this._maybeAutoSend(), 150); return; }
      }
      let input = App.UI.cache.promptInputEl;
      if (!input) return;
      let text = (input.value || "").trim();
      if (!text) return;
      // Ne jamais envoyer de transcriptions de pur bruit (« [Musique] » & Co.).
      if (this._noSpeech(text)) { this._flagNoise(); return; }
      this._liveBase = "";
      this._liveFinal = "";
      this._liveFinalBase = "";
      this._liveSessFinal = "";
      this._liveDisplay = "";
      input.classList.remove("liveInterim");
      this._updateLiveButton();
      try {
        if (App.Core && App.Core.sendMessage) App.Core.sendMessage();
      } catch (e) {
        console.warn("[Voice] live auto-send failed", e);
      }
    },

    _liveHasText() {
      let input = App.UI.cache.promptInputEl;
      return !!(this._live && input && (input.value || "").trim());
    },

    _updateLiveButton() {
      let c = (App.UI && App.UI.cache) || {};
      let v = strings();
      let supported = this.isSttSupported();
      if (c.liveMicBtn) {
        let btn = c.liveMicBtn;
        btn.hidden = !supported;
        btn.classList.toggle("listening", !!this._live && !this._liveSuspended);
        btn.classList.toggle("armed", !!this._liveArmed && !this._live && !this._liveSuspended);
        btn.classList.toggle("suspended", !!this._liveSuspended);
        btn.setAttribute("aria-pressed", (this._live && !this._liveSuspended) ? "true" : "false");
        let label = (this._live && !this._liveSuspended) ? (v.liveListening || "Live microphone: listening")
          : (this._liveSuspended ? (v.liveSuspended || "Live microphone: paused") : (v.liveTap || "Live microphone: off"));
        btn.title = label;
        btn.setAttribute("aria-label", label);
      }
      if (c.liveSendBtn) {
        c.liveSendBtn.hidden = !supported || !this._liveHasText();
        c.liveSendBtn.title = v.liveValidate || "Validate and send";
        c.liveSendBtn.setAttribute("aria-label", c.liveSendBtn.title);
      }
      if (c.liveHintEl && c.liveHintText) {
        let show = supported && !!this._live;
        c.liveHintEl.hidden = !show;
        if (show) {
          c.liveHintText.textContent = this._typingPaused
            ? (v.sttTypingPause || "Microphone paused while you type — it resumes by itself.")
            : (this._liveSuspended
              ? (v.liveHintSuspended || "Live microphone paused while Sofia answers…")
              : (settings().liveAutoSend === false
                ? (v.liveHintListening || "Listening… speak now, then tap ✓ to send.")
                : (v.liveHintAuto || "Listening… speak now — sent automatically after a pause.")));
        }
      }
    },

    // --- Paramétrer le moteur de reconnaissance (voir src/stt.js) ------------------------
    setSttEngine(value) {
      const S = App.STT;
      if (!S || typeof S.setEngine !== "function") return;
      const chosen = S.setEngine(value);
      this._sttNotice = null;
      let v = strings();
      if (value === "native" && typeof S.nativeAvailable === "function" && !S.nativeAvailable()) {
        App.UI.showToast(v.sttNativeBlocked || "Browser recognition is refused here — Sofia keeps using the in-page model.", "info");
      } else if (chosen === "native" && settings().soundMode === "on") {
        // La reconnaissance du navigateur ne fournit que du texte — les soupirs et la respiration
        // nécessitent le moteur local.
        App.UI.showToast(v.soundNativeWarn || "With browser recognition, sighs and other sounds are no longer picked up — words only.", "info");
      } else if (chosen === "local") { this._notifyLocalEngine(); this._prefetchStt(); }
      if (this._live) { this._restartLive(); }
      this.refreshUI();
    },

    setSttModel(value) {
      const S = App.STT;
      if (!S || typeof S.setModel !== "function") return;
      S.setModel(value);
      this.refreshUI();
      this._prefetchStt();   // charger le nouveau modèle en arrière-plan (s'exécute dans le Worker)
    },

    setSttMic(value) {
      const S = App.STT;
      if (!S || typeof S.setMic !== "function") return;
      S.setMic(value || "");
      this.refreshUI();
      if (this._live) { this._restartLive(); }
      App.UI.showToast(strings().sttMicChanged || "Microphone switched — it applies from the next recording on.", "info");
    },

    // Lister les périphériques d'entrée. Le navigateur ne donne les noms qu'après
    // l'autorisation du microphone — ils sont disponibles après le premier enregistrement,
    // c'est pourquoi la liste est récupérée à chaque ouverture des paramètres.
    refreshMics() {
      const S = App.STT;
      const sel = App.UI && App.UI.cache && App.UI.cache.sttMicSelect;
      if (!sel || !S || typeof S.listMics !== "function") return;
      Promise.resolve(S.listMics()).then((list) => {
        if (!sel) return;
        const saved = settings().sttMic || "";
        sel.innerHTML = "";
        const def = document.createElement("option");
        def.value = "";
        def.textContent = strings().sttMicDefault || "System default";
        sel.appendChild(def);
        let found = false;
        for (const m of (list || [])) {
          const opt = document.createElement("option");
          opt.value = m.id;
          opt.textContent = m.label;
          if (m.id === saved) found = true;
          sel.appendChild(opt);
        }
        sel.value = found ? saved : "";
      }).catch(() => {});
    },

    // Télécharger déjà le modèle Whisper pendant que l'utilisateur lit encore –
    // sinon, il devra attendre un téléchargement après la première phrase.
    _prefetchStt() {
      const S = App.STT;
      if (!S || typeof S.loadModel !== "function" || !usingLocal()) return;
      let loaded = false;
      try { loaded = !!S.info().modelLoaded; } catch (e) {}
      if (loaded) return;
      S.loadModel({ onProgress: (p) => this._sttProgress(p) })
        .then(() => { this._sttPct = null; this._updateSttStatus(); })
        .catch((e) => {
          this._sttPct = null;
          this._sttNotice = null;
          this._updateSttStatus();
          console.warn("[Voice] speech model prefetch failed", e);
        });
    },

    _notifyLocalEngine() {
      if (this._localNotified) return;
      this._localNotified = true;
      let v = strings();
      App.UI.showToast(v.sttLocalOn || "Speech now runs inside the page (Whisper). The first sentence downloads the model once — after that it works offline.", "info");
    },

    _sttState(s) {
      if (!s || !s.phase) return;
      this._sttPhase = s.phase;
      if (s.phase === "idle" || s.phase === "recording" || s.phase === "listening") this._sttPct = null;
      if (s.phase === "idle") this._setListening(false);
      else if (s.phase === "recording") this._setListening(true);
      this._updateSttStatus();
    },

    _sttFail(e) {
      let msg = e && (e.message || String(e));
      this._sttNotice = msg || "error";
      this._updateSttStatus();
      if (this._sttFailTimer) clearTimeout(this._sttFailTimer);
      this._sttFailTimer = setTimeout(() => {
        this._sttFailTimer = null;
        this._sttNotice = null;
        this._updateSttStatus();
      }, 8000);
    },

    _sttProgress(p) {
      if (!p) return;
      const total = Number(p.total), loaded = Number(p.loaded);
      let pct = null;
      if (typeof p.progress === "number" && isFinite(p.progress)) pct = p.progress;
      else if (total > 0 && isFinite(loaded)) pct = (loaded / total) * 100;
      if (pct == null) return;
      this._sttPct = Math.max(0, Math.min(100, Math.round(pct)));
      this._updateSttStatus();
    },

    _updateSttStatus() {
      let c = (App.UI && App.UI.cache) || {};
      const el = c.sttStatusEl;
      if (!el) return;
      let v = strings();
      let text = "";
      // N'afficher la progression que tant que le modèle n'est pas réellement prêt –
      // le rappel de progression s'active également pour les correspondances provenant du cache.
      let modelReady = false;
      try { modelReady = !!(App.STT && App.STT.info && App.STT.info().modelLoaded); } catch (e) {}
      if (this._correcting) text = v.sttCorrecting || "Polishing what I heard…";
      else if (this._sttPct != null && !modelReady) text = (v.sttModelLoading || "Loading speech model… {p}%").replace("{p}", String(this._sttPct));
      else if (this._sttPhase === "recording") text = v.sttRecording || "Listening… speak now.";
      else if (this._sttPhase === "transcribing") text = v.sttTranscribing || "Transcribing…";
      else if (this._sttPhase === "paused") text = this._typingPaused
        ? (v.sttTypingPause || "Microphone paused while you type — it resumes by itself.")
        : (v.liveHintSuspended || "Microphone paused.");
      else if (this._sttPhase === "listening") {
        text = settings().liveAutoSend === false
          ? (v.liveHintListening || "Listening… then tap ✓ to send.")
          : (v.liveHintAuto || "Listening… sent automatically after a pause.");
      }
      const notice = this._sttNotice;
      if (this._noiseNotice && !this._typingPaused && this._sttPct == null && this._sttPhase !== "transcribing") text = this._noiseNotice;
      if (!text && notice) text = notice;
      el.hidden = !text;
      if (!text) return;
      if (c.sttStatusText) c.sttStatusText.textContent = text;
      const busy = this._sttPct != null || this._sttPhase === "transcribing" || this._correcting;
      el.classList.toggle("busy", !!busy);
      el.classList.toggle("error", !!notice && this._sttPhase === "idle");
      el.dataset.phase = this._sttPhase || "idle";
    },

    refreshUI() {
      let c = (App.UI && App.UI.cache) || {};
      let v = strings();
      this._bindTypingGuard();
      let on = !!settings().voiceMode;
      if (c.listenBtn) {
        c.listenBtn.hidden = !on;
        c.listenBtn.title = this._listening ? (v.listening || "Listening…") : (v.listen || "Listen");
        c.listenBtn.setAttribute("aria-label", c.listenBtn.title);
      }
      if (c.voiceModeCheck) c.voiceModeCheck.checked = on;
      if (c.ttsRateInput) c.ttsRateInput.value = clampRate(settings().ttsRate);
      if (c.ttsRateValueEl) c.ttsRateValueEl.textContent = String(clampRate(settings().ttsRate));
      let pitch = clampPitch(settings().ttsPitch);
      if (c.ttsPitchInput) c.ttsPitchInput.value = String(pitch);
      if (c.ttsPitchValueEl) c.ttsPitchValueEl.textContent = String(pitch);
      if (c.autoSpeakCheck) c.autoSpeakCheck.checked = settings().ttsAutoSpeak !== false;
      if (c.femaleVoiceCheck) c.femaleVoiceCheck.checked = settings().ttsFemale !== false;
      if (c.liveListenCheck) c.liveListenCheck.checked = this.isLiveEnabled();
      if (c.liveListenLangSelect) {
        c.liveListenLangSelect.value = this.liveLangSetting();
        let autoOpt = c.liveListenLangSelect.querySelector('option[value="auto"]');
        if (autoOpt) autoOpt.textContent = v.liveLangAuto || "Automatic (app language)";
      }
      if (c.liveAutoSendCheck) c.liveAutoSendCheck.checked = settings().liveAutoSend !== false;
      if (this._live && this._liveRec) {
        try { this._liveRec.lang = this.liveLang(); } catch (e) {}
      }
      if (c.sttEngineSelect) c.sttEngineSelect.value = settings().sttEngine || "auto";
      if (c.sttModelSelect) {
        const m = (App.STT && App.STT.modelChoice) ? App.STT.modelChoice() : "base";
        c.sttModelSelect.value = m;
      }
      if (c.sttCorrectSelect) c.sttCorrectSelect.value = this.correctMode();
      if (c.sttModelRow) c.sttModelRow.hidden = !usingLocal();
      if (c.sttMicRow) {
        c.sttMicRow.hidden = !usingLocal();
        if (usingLocal()) this.refreshMics();
      }
      this._updateLiveButton();
      this._updateSttStatus();
      this.ensureVoicesHook();
      this.populateVoiceSelect();
      if (!on && this._listening) this.stopListening();
    },

    toggleListening() {
      let v = strings();
      if (!this.isSttSupported()) { App.UI.showToast(v.sttUnsupported || "Speech recognition is not available in this browser.", "error"); return; }
      if (this._listening) this.stopListening();
      else this.startListening();
    },

    startListening() {
      let v = strings();
      if (usingLocal()) { this._startLocalOnce(); return; }
      try {
        let rec = new SR();
        rec.lang = this.liveLang();
        rec.continuous = true;
        rec.interimResults = true;
        let input = App.UI.cache.promptInputEl;
        this._baseText = input ? (input.value || "") : "";
        if (this._baseText && !/\s$/.test(this._baseText)) this._baseText += " ";
        this._finalText = "";
        this._onceFinalBase = "";
        rec.onstart = () => { this._onceFinalBase = String(this._finalText || ""); };
        rec.onresult = (e) => {
          // Comme en mode live : reconstruire le texte final à chaque événement à partir de
          // la liste `results` – pas d'écriture continue, donc pas de
          // doublement si un navigateur signale à nouveau des résultats finis.
          let interim = "", sess = "";
          for (let i = 0; i < e.results.length; i++) {
            let r = e.results[i];
            if (!r || !r[0]) continue;
            const seg = String((r[0] && r[0].transcript) || "");
            if (!seg) continue;
            if (r.isFinal) sess = this._mergeSpoken(sess, seg);
            else if (i >= e.resultIndex) interim = this._mergeSpoken(interim, seg);
          }
          const base = String(this._onceFinalBase || "");
          const final = this._mergeSpoken(base, sess);
          this._finalText = final;
          this._applyTranscript(this._joinSpoken(final, interim));
        };
        rec.onerror = (e) => {
          let code = e && e.error;
          if (code === "not-allowed" || code === "service-not-allowed") {
            // Terminer l'exécution de manière synchrone (sinon `onend` redémarre immédiatement), puis
            // `_nativeRefused` décide qui a refusé : la page
            // (microphone) ou seulement la reconnaissance vocale.
            this._manualStop = true;
            this._listening = false;
            this._recognition = null;
            this._setListening(false);
            this._nativeRefused(code, "once");
          }
        };
        rec.onend = () => {
          if (this._listening && !this._manualStop) {
            try { rec.start(); return; } catch (e) {}
          }
          this._setListening(false);
        };
        this._recognition = rec;
        this._manualStop = false;
        rec.start();
        this._setListening(true);
      } catch (err) {
        console.error("[Voice] speech recognition failed to start", err);
        App.UI.showToast(v.sttUnsupported || "Speech recognition is not available in this browser.", "error");
        this._setListening(false);
      }
    },

    // --- Bruitages (sounds mode) ----------------------------------------------
    // Un bruit reconnu par src/vocal.js (soupir, gémissement, respiration, exclamation).
    // Il est traité comme une phrase parlée : il migre vers le champ de saisie et
    // est envoyé automatiquement après la pause d'envoi. Si une dictée est en cours,
    // il s'ajoute à la phrase (une phrase + un son = UN message). Comme
    // la correction sémantique ne remplace que la partie dictée, le modèle ne peut
    // jamais reformuler l'onomatopée.
    _onSound(text, meta) {
      if (!text) return;
      if (settings().soundMode !== "on") return;
      this._lastSoundAt = Date.now();
      this._lastSoundMeta = meta || null;
      this._updateSttStatus();
      if (App.State && App.State.isGenerating) return;   // Réponse en cours : ne pas écrire dedans
      if (!this._live && this._listening) {
        // Mode unique : le bruit est mémorisé et, à l'arrivée du
        // transcrit, est ajouté à la phrase reconnue (voir _applyTranscript).
        if (!this._onceSounds) this._onceSounds = [];
        this._onceSounds.push(text);
        return;
      }
      const shown = this._live ? (this._liveDisplay || "") : "";
      this._writeLive(this._mergeSpoken(shown, text), false);
      if (this._live) this._liveFinal = this._liveDisplay;
      this._armLiveSend();
    },

    _onSoundMeta() { return this._lastSoundMeta; },

    _applyTranscript(text, alreadyCorrected) {
      let input = App.UI.cache.promptInputEl;
      if (!input) return;
      let clean = this._cleanTranscript(text);
      const sounds = (this._onceSounds && this._onceSounds.length) ? this._onceSounds.slice() : [];
      if (!clean) {
        if (sounds.length) { this._onceSounds = []; return; }
        this._flagNoise(); return;
      }
      if (!alreadyCorrected && this.correctMode() !== "off") {
        const fixed = this._localCorrect(clean);
        if (fixed) clean = fixed;
      }
      this._onceSounds = [];
      input.value = this._baseText + clean + (sounds.length ? " " + sounds.join(" ") : "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.scrollTop = input.scrollHeight;
    },

    stopListening() {
      this._manualStop = true;
      this._onceSounds = [];
      if (App.Vocal) { try { App.Vocal.reset(); } catch (e) {} }
      if (usingLocal() && App.STT) { try { App.STT.stopCapture(); } catch (e) {} }
      let rec = this._recognition;
      this._recognition = null;
      if (rec) { try { rec.stop(); } catch (e) {} }
      this._setListening(false);
      // La reconnaissance du navigateur ne connaît pas de correction de fin de phrase comme le moteur local –
      // ici, la phrase finale est donc améliorée lors de l'arrêt.
      if (!usingLocal()) this._correctFieldText();
    },

    // Corriger a posteriori la phrase (brute) déjà présente dans le champ.
    _correctFieldText() {
      if (this.correctMode() === "off") return;
      let input = App.UI.cache.promptInputEl;
      if (!input) return;
      const base = this._baseText || "";
      const cur = input.value || "";
      if (!cur.startsWith(base)) return;
      const raw = cur.slice(base.length).trim();
      if (!raw) return;
      const epoch = this._correctEpoch;
      this._correct(raw).then((fixed) => {
        if (!fixed || fixed === raw) return;
        if (this._typingActive() || App.State.isGenerating || epoch !== this._correctEpoch) return;
        const now = input.value || "";
        if (!now.startsWith(base)) return;
        if (now.slice(base.length).trim() !== raw) return;
        input.value = base + fixed;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.scrollTop = input.scrollHeight;
      });
    },

    // Enregistrement unique avec le moteur local : enregistrer → Whisper → champ de saisie.
    async _startLocalOnce() {
      let v = strings();
      const S = App.STT;
      if (!S) return;
      if (this._listening) { this.stopListening(); return; }
      let input = App.UI.cache.promptInputEl;
      this._baseText = input ? (input.value || "") : "";
      if (this._baseText && !/\s$/.test(this._baseText)) this._baseText += " ";
      this._manualStop = false;
      this._sttNotice = null;
      this._onceSounds = [];
      try {
        this._setListening(true);
        this._notifyLocalEngine();
        this._warmCorrector();
        const onceHandle = await S.captureOnce({
          lang: this.liveLang(),
          onState: (s) => this._sttState(s),
          onProgress: (p) => this._sttProgress(p),
          onError: (e) => this._sttFail(e),
          onFrame: (f) => { try { if (App.Vocal) App.Vocal.frame(f); } catch (e) {} },
          wantFrames: () => { try { return !!(App.Vocal && App.Vocal.isOn()); } catch (e) { return false; } },
          onText: (text) => {
            this._setListening(false);
            let clean = this._cleanTranscript(text);
            if (!clean) {
              // Un bruit était déjà présent (sounds mode) : alors « rien
              // compris » est le résultat attendu, pas une erreur.
              if (this._onceSounds && this._onceSounds.length) { this._onceSounds = []; return; }
              App.UI.showToast(v.sttNoSpeech || "I didn't catch anything — please try again.", "info");
              return;
            }
            this._applyTranscript(clean);
            if (this.correctMode() === "off") return;
            const epoch = this._correctEpoch;
            this._correct(clean).then((fixed) => {
              if (!fixed || fixed === clean) return;
              if (this._typingActive() || App.State.isGenerating || epoch !== this._correctEpoch) return;
              this._applyTranscript(fixed, true);
            });
          }
        });
        // Démarrage annulé entre-temps (micro coupé pendant l'ouverture) :
        // ne pas rester affiché « j'écoute » sur un micro mort.
        if (!onceHandle || onceHandle.done) {
          this._setListening(false);
          this._sttState({ phase: "idle" });
          return;
        }
      } catch (e) {
        this._setListening(false);
        this._sttState({ phase: "idle" });
        App.UI.showToast(v.micDenied || "Microphone access was denied.", "error");
      }
    },

    _setListening(on) {
      this._listening = !!on;
      let btn = App.UI && App.UI.cache && App.UI.cache.listenBtn;
      let v = strings();
      if (btn) {
        btn.classList.toggle("listening", !!on);
        btn.title = on ? (v.listening || "Listening…") : (v.listen || "Listen");
        btn.setAttribute("aria-label", btn.title);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
  };

  App.Voice = Voice;
  Voice.ensureVoicesHook();
  // Ronde 142 : débloquer la sortie vocale au premier clic/appui sur touche.
  try { Voice.ensureVoiceUnlock(); } catch (e) {}
  // L'utilisateur a déjà activé le microphone -> précharger le modèle de reconnaissance en
  // arrière-plan, afin que la première phrase n'attende pas le téléchargement.
  // La correction sémantique est préchauffée en même temps : le premier appel au modèle d'une
  // session dure plusieurs fois plus longtemps (démarrage à froid), et c'est précisément lui qui dépassait
  // la limite de temps – la toute première phrase parlée arrivait donc non corrigée.
  try {
    setTimeout(() => {
      try {
        if (Voice.isLiveEnabled() || settings().voiceMode) { Voice._prefetchStt(); Voice._warmCorrector(); }
      } catch (e) {}
    }, 4000);
  } catch (e) {}
  return Voice;
}
