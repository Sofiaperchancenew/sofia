// Sofia – Packer/dépacker pour le code source chiffré (Ronde 66)
//
// Ce qu'est ce module : une pure interface de commande. Il ne connaît ni le
// format des enregistrements ni la dérivation de clé – les deux viennent de
// src/atelier-loader.js (encryptText/decryptText/moduleClosure) et du verrou
// d'accès dans index.html (SofiaGate.encKeyFor). Ainsi l'émetteur (ici) et le
// récepteur (le chargeur) ne peuvent pas diverger.
//
// Utilisation : le panneau apparaît via `#pack` dans l'adresse, via le drapeau
// localStorage 'sofia_pack_ui' = '1', ou via window.SofiaPack.show() (c'est ainsi
// que l'assistant IA l'ouvre). La clé d'accès ne vit que dans un `const` local
// dans le gestionnaire de clic – jamais dans un objet global. Après le
// chiffrement, le résultat se trouve sous window.__packResult (uniquement les
// enregistrements, pas la clé) et dans IndexedDB 'sofia_pack_v1'.
//
// Important pour les sessions ultérieures : une fois la page déverrouillée, la
// clé de déchiffrement est en mémoire (window.SofiaEnc). Un assistant IA peut
// alors appeler dumpPlain() (le clair de tous les enregistrements) et repack()
// (tout rechiffrer) – sans jamais voir la clé d'accès, car la dérivation se fait
// exclusivement dans le navigateur de la propriétaire / du propriétaire.

import { encryptText, decryptText, moduleClosure, ENC_PREFIX } from './atelier-loader.js';

// Ces deux fichiers restent TOUJOURS en clair sur le disque : le chargeur est le
// déchiffreur (il ne peut pas se déchiffrer lui-même), et cet outil serait
// inutilisable sans lui.
const SKIP = ['atelier-loader.js', 'enc-tool.js'];

// Modules qui ne font PAS partie du graphe actif mais appartiennent quand même
// au code source (outils de développement). Sinon ils resteraient en clair.
const EXTRA = ['./src/continue.js', './src/chess-test.js', './src/brand/build-brand.mjs'];

const DB_NAME = 'sofia_pack_v1';
const STORE = 'state';
const KEY = 'result';
const REKEY_KEY = 'rekey';

// ---------------------------------------------------------------------------
// Langue du panneau (Ronde 106)
// ---------------------------------------------------------------------------
// Cinq langues comme dans le reste de l'app (en/de/es/fr/it). Ordre : la langue
// de l'app en cours, sinon la langue du propriétaire issue du verrou
// (sofia_owner_lang_v1), sinon la langue du navigateur, sinon le français – qui
// a la clé d'accès est français (souhait de l'utilisateur).
const PANEL_TXT = {
  de: {
    title: 'Verschlüsselung · src/*.js',
    note: 'Der Zugangsschlüssel wird nur zum Ableiten des Entschlüsselungsschlüssels benutzt und nirgends gespeichert (außer du häkst „entsperrt lassen“ an). Er steht nie im Quelltext.',
    key: 'Zugangsschlüssel',
    remember: 'Dieses Gerät entsperrt lassen',
    check: 'Schlüssel prüfen',
    pack: 'Verschlüsseln',
    repack: 'Neu verschlüsseln (ohne Eingabe)',
    dump: 'Klartext auslesen',
    save: 'Ergebnis herunterladen (JSON)',
    needKey: 'Bitte den Zugangsschlüssel eingeben.',
    checking: 'Prüfe den Schlüssel …',
    keyOk: '✔ Zugangsschlüssel gültig – das Schloss öffnet damit.',
    keyBad: '✖ Zugangsschlüssel ungültig – das Schloss bleibt zu.',
    noGate: '· SofiaGate.checkKey fehlt – es läuft nur die harte Probe.',
    noDerive: '✖ Aus diesem Schlüssel lässt sich kein Entschlüsselungsschlüssel ableiten.',
    derived: '· Entschlüsselungsschlüssel: {x}… (nie der Zugangsschlüssel selbst)',
    sameKey: '✔ Genau der Schlüssel, mit dem diese Seite gerade entschlüsselt.',
    otherKey: '· Anders als der Schlüssel dieser Sitzung – das ist in Ordnung, wenn du damit NEU verschlüsseln willst.',
    plainProbe: '· {p} liegt im Klartext – keine Probe möglich.',
    probeOk: '✔ Probe: entschlüsselt {p} ({n} Zeichen).',
    probeFail: '✖ Probe: entschlüsselt {p} NICHT.',
    probeFailHint: '   → Dieser Schlüssel passt nicht zu den ausgelieferten Modulen.',
    probeErr: '✖ Probe fehlgeschlagen: {e}',
    noResult: 'Noch kein Ergebnis vorhanden.',
    fileWritten: 'Datei geschrieben: sofia-enc-pack.json',
    gateMissing: 'SofiaGate fehlt.',
    deriveFailed: 'Ableitung fehlgeschlagen.',
    reading: 'Lese Module …',
    encrypting: 'Verschlüssele {i}/{n} · {rel}',
    decrypting: 'Entschlüssele {i}/{n} · {rel}',
    doneMs: 'Fertig in {ms} ms',
    repackedMs: 'Neu verschlüsselt in {ms} ms',
    countEncrypted: '{n} Module verschlüsselt · Klartext {p} → Datensatz {c}',
    countModules: '{n} Module · Klartext {p} → Datensatz {c}',
    skipped: 'Übersprungen: {list}',
    resultHint: 'Ergebnis: window.__packResult (und IndexedDB sofia_pack_v1)',
    resultHintShort: 'Ergebnis: window.__packResult',
    error: 'Fehler: {e}',
    noKeyInMemory: 'Kein Schlüssel im Speicher – bitte einmal mit dem Zugangsschlüssel entsperren.',
    plainSummary: 'Klartext: {a} Datensätze · im Klartext gefunden: {b}',
    plainBad: ' · nicht lesbar: {n}',
    whyLoadable: 'nicht ladbar',
    whyEncrypted: 'schon verschlüsselt',
    whyUnreadable: 'nicht lesbar (falscher alter Schlüssel)'
  },
  en: {
    title: 'Encryption · src/*.js',
    note: 'The access key is used only to derive the decryption key and is never stored (unless you tick “keep unlocked”). It never appears in the source.',
    key: 'Access key',
    remember: 'Keep this device unlocked',
    check: 'Check key',
    pack: 'Encrypt',
    repack: 'Re-encrypt (without typing it)',
    dump: 'Read plain text',
    save: 'Download result (JSON)',
    needKey: 'Please enter the access key.',
    checking: 'Checking the key …',
    keyOk: '✔ Access key valid – it opens the lock.',
    keyBad: '✖ Access key invalid – the lock stays shut.',
    noGate: '· SofiaGate.checkKey is missing – only the hard probe runs.',
    noDerive: '✖ No decryption key can be derived from this key.',
    derived: '· Decryption key: {x}… (never the access key itself)',
    sameKey: '✔ Exactly the key this page is decrypting with right now.',
    otherKey: '· Different from this session’s key – fine if you want to re-encrypt with it.',
    plainProbe: '· {p} is plain text – no probe possible.',
    probeOk: '✔ Probe: {p} decrypted ({n} characters).',
    probeFail: '✖ Probe: {p} NOT decrypted.',
    probeFailHint: '   → This key does not match the shipped modules.',
    probeErr: '✖ Probe failed: {e}',
    noResult: 'No result yet.',
    fileWritten: 'File written: sofia-enc-pack.json',
    gateMissing: 'SofiaGate is missing.',
    deriveFailed: 'Derivation failed.',
    reading: 'Reading modules …',
    encrypting: 'Encrypting {i}/{n} · {rel}',
    decrypting: 'Decrypting {i}/{n} · {rel}',
    doneMs: 'Done in {ms} ms',
    repackedMs: 'Re-encrypted in {ms} ms',
    countEncrypted: '{n} modules encrypted · plain {p} → record {c}',
    countModules: '{n} modules · plain {p} → record {c}',
    skipped: 'Skipped: {list}',
    resultHint: 'Result: window.__packResult (and IndexedDB sofia_pack_v1)',
    resultHintShort: 'Result: window.__packResult',
    error: 'Error: {e}',
    noKeyInMemory: 'No key in memory – please unlock once with the access key.',
    plainSummary: 'Plain text: {a} records · found as plain text: {b}',
    plainBad: ' · unreadable: {n}',
    whyLoadable: 'not loadable',
    whyEncrypted: 'already encrypted',
    whyUnreadable: 'unreadable (wrong old key)'
  },
  es: {
    title: 'Cifrado · src/*.js',
    note: 'La clave de acceso solo se usa para derivar la clave de descifrado y no se guarda en ningún sitio (salvo que marques «mantener desbloqueado»). Nunca aparece en el código.',
    key: 'Clave de acceso',
    remember: 'Mantener este dispositivo desbloqueado',
    check: 'Comprobar la clave',
    pack: 'Cifrar',
    repack: 'Volver a cifrar (sin escribir nada)',
    dump: 'Leer el texto claro',
    save: 'Descargar el resultado (JSON)',
    needKey: 'Introduce la clave de acceso.',
    checking: 'Comprobando la clave …',
    keyOk: '✔ Clave de acceso válida: abre el bloqueo.',
    keyBad: '✖ Clave de acceso no válida: el bloqueo sigue cerrado.',
    noGate: '· Falta SofiaGate.checkKey: solo se ejecuta la prueba real.',
    noDerive: '✖ Con esta clave no se puede derivar ninguna clave de descifrado.',
    derived: '· Clave de descifrado: {x}… (nunca la clave de acceso)',
    sameKey: '✔ Es justo la clave con la que esta página está descifrando ahora.',
    otherKey: '· Distinta de la clave de esta sesión: no pasa nada si quieres volver a cifrar con ella.',
    plainProbe: '· {p} está en texto claro: no se puede probar.',
    probeOk: '✔ Prueba: {p} descifrado ({n} caracteres).',
    probeFail: '✖ Prueba: {p} NO se descifra.',
    probeFailHint: '   → Esta clave no corresponde a los módulos entregados.',
    probeErr: '✖ La prueba ha fallado: {e}',
    noResult: 'Todavía no hay resultado.',
    fileWritten: 'Archivo escrito: sofia-enc-pack.json',
    gateMissing: 'Falta SofiaGate.',
    deriveFailed: 'La derivación ha fallado.',
    reading: 'Leyendo módulos …',
    encrypting: 'Cifrando {i}/{n} · {rel}',
    decrypting: 'Descifrando {i}/{n} · {rel}',
    doneMs: 'Listo en {ms} ms',
    repackedMs: 'Cifrado de nuevo en {ms} ms',
    countEncrypted: '{n} módulos cifrados · claro {p} → registro {c}',
    countModules: '{n} módulos · claro {p} → registro {c}',
    skipped: 'Omitidos: {list}',
    resultHint: 'Resultado: window.__packResult (e IndexedDB sofia_pack_v1)',
    resultHintShort: 'Resultado: window.__packResult',
    error: 'Error: {e}',
    noKeyInMemory: 'No hay clave en memoria: desbloquea una vez con la clave de acceso.',
    plainSummary: 'Texto claro: {a} registros · encontrados en claro: {b}',
    plainBad: ' · ilegibles: {n}',
    whyLoadable: 'no cargable',
    whyEncrypted: 'ya cifrado',
    whyUnreadable: 'ilegible (clave antigua incorrecta)'
  },
  fr: {
    title: 'Chiffrement · src/*.js',
    note: 'La clé d’accès sert uniquement à dériver la clé de déchiffrement et n’est jamais enregistrée (sauf si tu coches « laisser déverrouillé »). Elle n’apparaît jamais dans le code.',
    key: 'Clé d’accès',
    remember: 'Laisser cet appareil déverrouillé',
    check: 'Vérifier la clé',
    pack: 'Chiffrer',
    repack: 'Chiffrer à nouveau (sans saisir la clé)',
    dump: 'Extraire le texte en clair',
    save: 'Enregistrer le résultat (JSON)',
    needKey: 'Entre la clé d’accès.',
    checking: 'Vérification de la clé …',
    keyOk: '✔ Clé d’accès valide – elle ouvre le verrou.',
    keyBad: '✖ Clé d’accès invalide – le verrou reste fermé.',
    noGate: '· SofiaGate.checkKey est absent – seule l’épreuve réelle s’exécute.',
    noDerive: '✖ Impossible de dériver une clé de déchiffrement à partir de cette clé.',
    derived: '· Clé de déchiffrement : {x}… (jamais la clé d’accès elle-même)',
    sameKey: '✔ Exactement la clé avec laquelle cette page déchiffre en ce moment.',
    otherKey: '· Différente de la clé de cette session – c’est normal si tu veux rechiffrer avec.',
    plainProbe: '· {p} est en clair – aucune épreuve possible.',
    probeOk: '✔ Épreuve : {p} déchiffré ({n} caractères).',
    probeFail: '✖ Épreuve : {p} NON déchiffré.',
    probeFailHint: '   → Cette clé ne correspond pas aux modules livrés.',
    probeErr: '✖ Épreuve échouée : {e}',
    noResult: 'Aucun résultat pour l’instant.',
    fileWritten: 'Fichier écrit : sofia-enc-pack.json',
    gateMissing: 'SofiaGate est absent.',
    deriveFailed: 'Échec de la dérivation.',
    reading: 'Lecture des modules …',
    encrypting: 'Chiffrement {i}/{n} · {rel}',
    decrypting: 'Déchiffrement {i}/{n} · {rel}',
    doneMs: 'Terminé en {ms} ms',
    repackedMs: 'Rechiffré en {ms} ms',
    countEncrypted: '{n} modules chiffrés · clair {p} → enregistrement {c}',
    countModules: '{n} modules · clair {p} → enregistrement {c}',
    skipped: 'Ignorés : {list}',
    resultHint: 'Résultat : window.__packResult (et IndexedDB sofia_pack_v1)',
    resultHintShort: 'Résultat : window.__packResult',
    error: 'Erreur : {e}',
    noKeyInMemory: 'Aucune clé en mémoire – déverrouille une fois avec la clé d’accès.',
    plainSummary: 'Texte en clair : {a} enregistrements · trouvés en clair : {b}',
    plainBad: ' · illisibles : {n}',
    whyLoadable: 'non chargeable',
    whyEncrypted: 'déjà chiffré',
    whyUnreadable: 'illisible (ancienne clé incorrecte)'
  },
  it: {
    title: 'Cifratura · src/*.js',
    note: 'La chiave di accesso serve solo a derivare la chiave di decifratura e non viene mai salvata (tranne se spunti «lascia sbloccato»). Non compare mai nel codice.',
    key: 'Chiave di accesso',
    remember: 'Lascia sbloccato questo dispositivo',
    check: 'Verifica la chiave',
    pack: 'Cifra',
    repack: 'Cifra di nuovo (senza digitare nulla)',
    dump: 'Leggi il testo in chiaro',
    save: 'Scarica il risultato (JSON)',
    needKey: 'Inserisci la chiave di accesso.',
    checking: 'Verifico la chiave …',
    keyOk: '✔ Chiave di accesso valida: apre il blocco.',
    keyBad: '✖ Chiave di accesso non valida: il blocco resta chiuso.',
    noGate: '· Manca SofiaGate.checkKey: si esegue solo la prova reale.',
    noDerive: '✖ Da questa chiave non si può derivare alcuna chiave di decifratura.',
    derived: '· Chiave di decifratura: {x}… (mai la chiave di accesso stessa)',
    sameKey: '✔ È proprio la chiave con cui questa pagina sta decifrando adesso.',
    otherKey: '· Diversa dalla chiave di questa sessione: va bene se vuoi cifrare di nuovo con essa.',
    plainProbe: '· {p} è in chiaro: nessuna prova possibile.',
    probeOk: '✔ Prova: {p} decifrato ({n} caratteri).',
    probeFail: '✖ Prova: {p} NON decifrato.',
    probeFailHint: '   → Questa chiave non corrisponde ai moduli distribuiti.',
    probeErr: '✖ Prova non riuscita: {e}',
    noResult: 'Nessun risultato per ora.',
    fileWritten: 'File scritto: sofia-enc-pack.json',
    gateMissing: 'Manca SofiaGate.',
    deriveFailed: 'Derivazione non riuscita.',
    reading: 'Leggo i moduli …',
    encrypting: 'Cifro {i}/{n} · {rel}',
    decrypting: 'Decifro {i}/{n} · {rel}',
    doneMs: 'Fatto in {ms} ms',
    repackedMs: 'Cifrato di nuovo in {ms} ms',
    countEncrypted: '{n} moduli cifrati · chiaro {p} → record {c}',
    countModules: '{n} moduli · chiaro {p} → record {c}',
    skipped: 'Saltati: {list}',
    resultHint: 'Risultato: window.__packResult (e IndexedDB sofia_pack_v1)',
    resultHintShort: 'Risultato: window.__packResult',
    error: 'Errore: {e}',
    noKeyInMemory: 'Nessuna chiave in memoria: sblocca una volta con la chiave di accesso.',
    plainSummary: 'Testo in chiaro: {a} record · trovati in chiaro: {b}',
    plainBad: ' · illeggibili: {n}',
    whyLoadable: 'non caricabile',
    whyEncrypted: 'già cifrato',
    whyUnreadable: 'illeggibile (vecchia chiave errata)'
  }
};

// ---------------------------------------------------------------------------
// Mode d'emploi et « Changer la clé » (Ronde 107)
// ---------------------------------------------------------------------------
// La ronde 106 a traduit le panneau, mais les boutons restaient à expliquer. La
// ronde 107 apporte le mode d'emploi (ce que font les cinq boutons et dans quel
// ordre, et ce qui est réellement écrit sur le disque – à savoir rien) ainsi
// qu'un champ propre « Changer la clé », car ce sont deux choses différentes :
//   A) le VERROU (KEY_HASH/DEVICE_VERIFIER dans index.html) – la trappe que
//      l'app ouvre, et
//   B) le CHIFFREMENT (encKeyFor) – avec quoi les modules reposent sur le disque.
// Seul A est rapide ; B rechiffre tout et fournit le nouveau ENC_TRIAL_KEY. Tout
// se calcule dans le navigateur de la propriétaire / du propriétaire.
const GUIDE_TXT = {
  de: {
    helpSummary: 'Anleitung (einmal lesen)',
    helpIntro: 'Alles unter src/*.js liegt verschlüsselt auf der Platte. Dieses Feld verschlüsselt oder entschlüsselt es. Der Schlüssel wird nie gespeichert und steht nie im Quelltext.',
    helpHowTitle: 'Die fünf Knöpfe, in dieser Reihenfolge',
    helpHow: [
      '1. Zugangsschlüssel eintippen (Groß-/Kleinschreibung, Leerzeichen und Striche sind egal).',
      '2. „Schlüssel prüfen“: nur ein Test — es wird NICHTS geändert. Grün = die Klappe passt.',
      '3. „Verschlüsseln“: verschlüsselt alle Module mit dem eingegebenen Schlüssel neu. Das Schloss bleibt unberührt (siehe „Schlüssel ändern“).',
      '4. „Ergebnis herunterladen (JSON)“: legt das Ergebnis als Datei sofia-enc-pack.json ab.',
      '5. Diese Datei muss danach die Module unter src/ ersetzen (das macht der Helfer). Bis dahin ist im Projekt NICHTS geändert.'
    ],
    helpBtnTitle: 'Was die einzelnen Knöpfe tun',
    helpButtons: [
      ['Schlüssel prüfen', 'Testet nur: Öffnet der Schlüssel das Schloss (ja/nein) und lässt sich ein echtes Modul damit entschlüsseln?'],
      ['Verschlüsseln', 'Verschlüsselt alle Module mit dem eingegebenen Schlüssel. Es wird nichts automatisch gespeichert.'],
      ['Neu verschlüsseln (ohne Eingabe)', 'Dasselbe, aber mit dem Schlüssel, der schon im Speicher liegt (Seite ist entsperrt).'],
      ['Klartext auslesen', 'Gibt alles wieder als lesbaren Text aus (Kontrolle oder Sicherung).'],
      ['Ergebnis herunterladen (JSON)', 'Lädt das zuletzt erzeugte Ergebnis als Datei herunter.']
    ],
    helpKeyTitle: 'Schlüssel ändern',
    helpKey: 'Zu ändern sind zwei verschiedene Dinge: (1) das SCHLOSS — welcher Zugangsschlüssel die App öffnet — und (2) die VERSCHLÜSSELUNG — womit die Module auf der Platte liegen. Beides steht unten unter „Schlüssel ändern“.',
    trialNote: 'Zur Lage: im Testmodus (TRIAL_MODE) wird immer mit ENC_TRIAL_KEY entschlüsselt. Darum genügt A, wenn du nur den Zugang ändern willst.',
    rekeySummary: 'Schlüssel ändern',
    rekeyNote: 'Neuen Zugangsschlüssel festlegen. Er wird nur zum Rechnen benutzt und nirgends gespeichert.',
    rekeyNew: 'Neuer Zugangsschlüssel',
    rekeyNew2: 'Neuen Schlüssel wiederholen',
    rekeyLockBtn: 'A. Nur das Schloss ändern (schnell)',
    rekeyFullBtn: 'B. Schloss ändern UND Module neu verschlüsseln (komplett)',
    rekeyHint: 'A: die alte Klappe öffnet die App nicht mehr; der verschlüsselte Inhalt bleibt unverändert (Testmodus). B: der Inhalt hängt danach wirklich an der neuen Klappe — dauert ein paar Sekunden, Ergebnis separat herunterladen.',
    rekeyNeed: 'Bitte den neuen Schlüssel zweimal eingeben.',
    rekeyShort: 'Bitte mindestens 4 Zeichen.',
    rekeyMismatch: 'Die beiden Eingaben sind nicht gleich.',
    rekeyConfirmLock: 'Wirklich das Schloss auf diese Klappe umstellen?',
    rekeyConfirmFull: 'Wirklich das Schloss umstellen UND alle Module neu verschlüsseln?',
    rekeyConfirmBtn: 'Ja, ausführen',
    rekeyCancel: 'Abbrechen',
    rekeyCodesTitle: 'Diese Zeilen in index.html ersetzen:',
    rekeySteps: [
      '1. Die Zeilen oben in index.html einsetzen (Schloss-Skript, ganz oben).',
      '2. Nur bei B: die neu verschlüsselten Module herunterladen und die Dateien unter src/ damit ersetzen — die JSON dem Helfer geben.',
      '3. Seite neu laden und mit dem NEUEN Schlüssel öffnen.',
      '4. Den Generator speichern (Knopf „Speichern“ im Editor).'
    ],
    rekeyBusy: 'Verschlüssele neu …',
    rekeyDone: 'Fertig in {ms} ms · {n} Module',
    rekeyDoneLock: 'Codes berechnet. Es wurde nichts neu verschlüsselt.',
    copyBtn: 'Kopieren',
    copied: 'Kopiert.',
    rekeyDownload: 'Neu verschlüsselte Module herunterladen (JSON)',
    rekeyNoArtifacts: 'SofiaGate.keyArtifacts fehlt — Seite einmal neu laden.',
    saveHint: 'Datei sofia-enc-pack.json gespeichert. Im Projekt hat sich dadurch NICHTS geändert: diese Datei muss erst die Module unter src/ ersetzen.',
    packHintOther: 'Diese Klappe ist nicht die des aktuellen Schlosses. Wenn du den Zugang wirklich ändern willst, nimm unten „Schlüssel ändern“.',
    packHint: 'Noch ist nichts geschrieben: „Ergebnis herunterladen (JSON)“ klicken und die Datei in src/ einsetzen.',
    dumpHint: 'Nur gelesen — es wurde nichts geändert.',
    checkHint: '→ Nichts wurde geändert: „Schlüssel prüfen“ testet nur. Zum Anwenden „Verschlüsseln“ (Knopf 3) benutzen.'
  },
  en: {
    helpSummary: 'Instructions (read once)',
    helpIntro: 'Everything under src/*.js is stored encrypted. This panel encrypts or decrypts it. The key is never stored and never appears in the source.',
    helpHowTitle: 'The five buttons, in order',
    helpHow: [
      '1. Type the access key (case, spaces and dashes do not matter).',
      '2. “Check key”: a test only — NOTHING is changed. Green = the key fits.',
      '3. “Encrypt”: re-encrypts all modules with the key you typed. It does not touch the lock (see “Change the key”).',
      '4. “Download result (JSON)”: saves the result as sofia-enc-pack.json.',
      '5. That file must then replace the modules under src/ (the assistant does that). Until then NOTHING in the project has changed.'
    ],
    helpBtnTitle: 'What each button does',
    helpButtons: [
      ['Check key', 'Test only: does the key open the lock (yes/no), and does a real module decrypt with it?'],
      ['Encrypt', 'Encrypts all modules with the key you typed. Nothing is saved automatically.'],
      ['Re-encrypt (without typing it)', 'Same, but with the key already in memory (page unlocked).'],
      ['Read plain text', 'Gives everything back as readable text (check or backup).'],
      ['Download result (JSON)', 'Downloads the last result as a file.']
    ],
    helpKeyTitle: 'Changing the key',
    helpKey: 'Two different things can change: (1) the LOCK — which access key opens the app — and (2) the ENCRYPTION — what the modules on disk are encrypted with. Both are below under “Change the key”.',
    trialNote: 'Note: in trial mode (TRIAL_MODE) decryption always uses ENC_TRIAL_KEY. That is why A is enough if you only want to change access.',
    rekeySummary: 'Change the key',
    rekeyNote: 'Set a new access key. It is used only for computing and is never stored.',
    rekeyNew: 'New access key',
    rekeyNew2: 'Repeat the new key',
    rekeyLockBtn: 'A. Change only the lock (fast)',
    rekeyFullBtn: 'B. Change the lock AND re-encrypt the modules (full)',
    rekeyHint: 'A: the old key no longer opens the app; the encrypted content is untouched (trial mode). B: the content then really depends on the new key — takes a few seconds, download the result separately.',
    rekeyNeed: 'Please enter the new key twice.',
    rekeyShort: 'At least 4 characters.',
    rekeyMismatch: 'The two entries are not identical.',
    rekeyConfirmLock: 'Really move the lock to this new key?',
    rekeyConfirmFull: 'Really change the lock AND re-encrypt all modules?',
    rekeyConfirmBtn: 'Yes, run it',
    rekeyCancel: 'Cancel',
    rekeyCodesTitle: 'Replace these lines in index.html:',
    rekeySteps: [
      '1. Put the lines above into index.html (lock script, at the top).',
      '2. B only: download the re-encrypted modules and replace the files under src/ — hand the JSON to the assistant.',
      '3. Reload the page and open it with the NEW key.',
      '4. Save the generator (the editor’s “Save” button).'
    ],
    rekeyBusy: 'Re-encrypting …',
    rekeyDone: 'Done in {ms} ms · {n} modules',
    rekeyDoneLock: 'Codes computed. Nothing was re-encrypted.',
    copyBtn: 'Copy',
    copied: 'Copied.',
    rekeyDownload: 'Download the re-encrypted modules (JSON)',
    rekeyNoArtifacts: 'SofiaGate.keyArtifacts is missing — reload the page once.',
    saveHint: 'File sofia-enc-pack.json saved. Nothing in the project has changed: this file must first replace the modules under src/.',
    packHintOther: 'This key is not the current lock’s key. If you really want to change access, use “Change the key” below.',
    packHint: 'Nothing is written yet: click “Download result (JSON)” and put the file into src/.',
    dumpHint: 'Read-only — nothing was changed.',
    checkHint: '→ Nothing was changed: “Check key” only tests. To apply it, use “Encrypt” (button 3).'
  },
  es: {
    helpSummary: 'Instrucciones (leer una vez)',
    helpIntro: 'Todo lo que está bajo src/*.js está cifrado en el disco. Este panel lo cifra o lo descifra. La clave nunca se guarda y nunca aparece en el código.',
    helpHowTitle: 'Los cinco botones, en orden',
    helpHow: [
      '1. Escribe la clave de acceso (mayúsculas, espacios y guiones dan igual).',
      '2. «Comprobar la clave»: solo una prueba — NO se cambia nada. Verde = la clave encaja.',
      '3. «Cifrar»: vuelve a cifrar todos los módulos con la clave escrita. No toca el bloqueo (ver «Cambiar la clave»).',
      '4. «Descargar el resultado (JSON)»: guarda el resultado como sofia-enc-pack.json.',
      '5. Ese archivo debe después sustituir los módulos de src/ (lo hace el asistente). Hasta entonces NO ha cambiado nada en el proyecto.'
    ],
    helpBtnTitle: 'Qué hace cada botón',
    helpButtons: [
      ['Comprobar la clave', 'Solo prueba: ¿abre la clave el bloqueo (sí/no) y se descifra un módulo real con ella?'],
      ['Cifrar', 'Cifra todos los módulos con la clave escrita. No se guarda nada automáticamente.'],
      ['Volver a cifrar (sin escribir nada)', 'Igual, pero con la clave que ya está en memoria (página desbloqueada).'],
      ['Leer el texto claro', 'Devuelve todo como texto legible (control o copia de seguridad).'],
      ['Descargar el resultado (JSON)', 'Descarga el último resultado como archivo.']
    ],
    helpKeyTitle: 'Cambiar la clave',
    helpKey: 'Hay dos cosas distintas: (1) el BLOQUEO — qué clave de acceso abre la app — y (2) el CIFRADO — con qué están cifrados los módulos del disco. Ambas están abajo en «Cambiar la clave».',
    trialNote: 'Nota: en modo prueba (TRIAL_MODE) el descifrado usa siempre ENC_TRIAL_KEY. Por eso basta A si solo quieres cambiar el acceso.',
    rekeySummary: 'Cambiar la clave',
    rekeyNote: 'Define una nueva clave de acceso. Solo se usa para calcular y no se guarda.',
    rekeyNew: 'Nueva clave de acceso',
    rekeyNew2: 'Repite la nueva clave',
    rekeyLockBtn: 'A. Cambiar solo el bloqueo (rápido)',
    rekeyFullBtn: 'B. Cambiar el bloqueo Y volver a cifrar los módulos (completo)',
    rekeyHint: 'A: la clave antigua ya no abre la app; el contenido cifrado no se toca (modo prueba). B: el contenido depende entonces de la nueva clave — tarda unos segundos, descarga el resultado aparte.',
    rekeyNeed: 'Escribe la nueva clave dos veces.',
    rekeyShort: 'Al menos 4 caracteres.',
    rekeyMismatch: 'Las dos entradas no son iguales.',
    rekeyConfirmLock: '¿Seguro que quieres poner el bloqueo en esta nueva clave?',
    rekeyConfirmFull: '¿Seguro que quieres cambiar el bloqueo Y volver a cifrar todos los módulos?',
    rekeyConfirmBtn: 'Sí, ejecutar',
    rekeyCancel: 'Cancelar',
    rekeyCodesTitle: 'Sustituye estas líneas en index.html:',
    rekeySteps: [
      '1. Pon las líneas de arriba en index.html (script del bloqueo, arriba).',
      '2. Solo en B: descarga los módulos recifrados y sustituye los archivos de src/ — dale el JSON al asistente.',
      '3. Recarga la página y ábrela con la NUEVA clave.',
      '4. Guarda el generador (botón «Guardar» del editor).'
    ],
    rekeyBusy: 'Volviendo a cifrar …',
    rekeyDone: 'Listo en {ms} ms · {n} módulos',
    rekeyDoneLock: 'Códigos calculados. No se ha vuelto a cifrar nada.',
    copyBtn: 'Copiar',
    copied: 'Copiado.',
    rekeyDownload: 'Descargar los módulos recifrados (JSON)',
    rekeyNoArtifacts: 'Falta SofiaGate.keyArtifacts — recarga la página una vez.',
    saveHint: 'Archivo sofia-enc-pack.json guardado. En el proyecto NO ha cambiado nada: este archivo debe primero sustituir los módulos de src/.',
    packHintOther: 'Esta clave no es la del bloqueo actual. Si de verdad quieres cambiar el acceso, usa «Cambiar la clave» abajo.',
    packHint: 'Todavía no se ha escrito nada: pulsa «Descargar el resultado (JSON)» y pon el archivo en src/.',
    dumpHint: 'Solo lectura — no se ha cambiado nada.',
    checkHint: '→ No se ha cambiado nada: «Comprobar la clave» solo prueba. Para aplicarla, usa «Cifrar» (botón 3).'
  },
  fr: {
    helpSummary: 'Mode d’emploi (à lire une fois)',
    helpIntro: 'Tout ce qui est sous src/*.js est chiffré sur le disque. Ce panneau le chiffre ou le déchiffre. La clé n’est jamais enregistrée et n’apparaît jamais dans le code.',
    helpHowTitle: 'Les cinq boutons, dans l’ordre',
    helpHow: [
      '1. Saisis la clé d’accès (majuscules, espaces et tirets n’ont pas d’importance).',
      '2. « Vérifier la clé » : un test seulement — RIEN n’est modifié. Vert = la clé convient.',
      '3. « Chiffrer » : rechiffre tous les modules avec la clé saisie. Cela ne touche pas le verrou (voir « Changer la clé »).',
      '4. « Enregistrer le résultat (JSON) » : écrit le résultat dans le fichier sofia-enc-pack.json.',
      '5. Ce fichier doit ensuite remplacer les modules de src/ (l’assistant s’en charge). Avant cela, RIEN n’a changé dans le projet.'
    ],
    helpBtnTitle: 'Ce que fait chaque bouton',
    helpButtons: [
      ['Vérifier la clé', 'Teste seulement : la clé ouvre-t-elle le verrou (oui/non) et un vrai module se déchiffre-t-il avec elle ?'],
      ['Chiffrer', 'Chiffre tous les modules avec la clé saisie. Rien n’est enregistré automatiquement.'],
      ['Chiffrer à nouveau (sans saisir la clé)', 'Pareil, mais avec la clé déjà en mémoire (page déverrouillée).'],
      ['Extraire le texte en clair', 'Redonne tout sous forme de texte lisible (contrôle ou sauvegarde).'],
      ['Enregistrer le résultat (JSON)', 'Télécharge le dernier résultat sous forme de fichier.']
    ],
    helpKeyTitle: 'Changer la clé',
    helpKey: 'Deux choses différentes se changent : (1) le VERROU — la clé d’accès qui ouvre l’app — et (2) le CHIFFREMENT — avec quoi les modules du disque sont chiffrés. Les deux se trouvent ci-dessous, dans « Changer la clé ».',
    trialNote: 'À savoir : en mode test (TRIAL_MODE), le déchiffrement utilise toujours ENC_TRIAL_KEY. C’est pourquoi A suffit si tu veux seulement changer l’accès.',
    rekeySummary: 'Changer la clé',
    rekeyNote: 'Définis une nouvelle clé d’accès. Elle sert uniquement à calculer, elle n’est jamais enregistrée.',
    rekeyNew: 'Nouvelle clé d’accès',
    rekeyNew2: 'Répéter la nouvelle clé',
    rekeyLockBtn: 'A. Changer seulement le verrou (rapide)',
    rekeyFullBtn: 'B. Changer le verrou ET rechiffrer les modules (complet)',
    rekeyHint: 'A : l’ancienne clé n’ouvre plus l’app ; le contenu chiffré n’est pas touché (mode test). B : le contenu dépend alors vraiment de la nouvelle clé — quelques secondes, résultat à télécharger séparément.',
    rekeyNeed: 'Saisis la nouvelle clé deux fois.',
    rekeyShort: 'Au moins 4 caractères.',
    rekeyMismatch: 'Les deux saisies ne sont pas identiques.',
    rekeyConfirmLock: 'Confirmer : mettre le verrou sur cette nouvelle clé ?',
    rekeyConfirmFull: 'Confirmer : changer le verrou ET rechiffrer tous les modules ?',
    rekeyConfirmBtn: 'Oui, exécuter',
    rekeyCancel: 'Annuler',
    rekeyCodesTitle: 'Remplace ces lignes dans index.html :',
    rekeySteps: [
      '1. Colle les lignes ci-dessus dans index.html (script du verrou, tout en haut).',
      '2. B seulement : télécharge les modules rechiffrés et remplace les fichiers de src/ — donne le JSON à l’assistant.',
      '3. Recharge la page, puis ouvre-la avec la NOUVELLE clé.',
      '4. Enregistre le générateur (bouton « Enregistrer » de l’éditeur).'
    ],
    rekeyBusy: 'Rechiffrement …',
    rekeyDone: 'Terminé en {ms} ms · {n} modules',
    rekeyDoneLock: 'Codes calculés. Rien n’a été rechiffré.',
    copyBtn: 'Copier',
    copied: 'Copié.',
    rekeyDownload: 'Télécharger les modules rechiffrés (JSON)',
    rekeyNoArtifacts: 'SofiaGate.keyArtifacts manque — recharge la page une fois.',
    saveHint: 'Fichier sofia-enc-pack.json téléchargé. Le projet, lui, n’a PAS changé : ce fichier doit d’abord remplacer les modules de src/.',
    packHintOther: 'Cette clé n’est pas celle du verrou actuel. Si tu veux vraiment changer l’accès, utilise « Changer la clé » ci-dessous.',
    packHint: 'Rien n’est encore écrit : clique « Enregistrer le résultat (JSON) » puis remets le fichier dans src/.',
    dumpHint: 'Lecture seule — rien n’a été modifié.',
    checkHint: '→ Rien n’a été modifié : « Vérifier la clé » ne fait que tester. Pour l’appliquer, utilise « Chiffrer » (bouton 3).'
  },
  it: {
    helpSummary: 'Istruzioni (leggi una volta)',
    helpIntro: 'Tutto ciò che sta sotto src/*.js è cifrato su disco. Questo pannello lo cifra o lo decifra. La chiave non viene mai salvata e non compare mai nel codice.',
    helpHowTitle: 'I cinque pulsanti, in ordine',
    helpHow: [
      '1. Digita la chiave di accesso (maiuscole, spazi e trattini non contano).',
      '2. «Verifica la chiave»: solo una prova — NON si cambia nulla. Verde = la chiave va bene.',
      '3. «Cifra»: ricifra tutti i moduli con la chiave digitata. Non tocca il blocco (vedi «Cambiare la chiave»).',
      '4. «Scarica il risultato (JSON)»: salva il risultato nel file sofia-enc-pack.json.',
      '5. Quel file deve poi sostituire i moduli in src/ (lo fa l’assistente). Fino ad allora NON è cambiato nulla nel progetto.'
    ],
    helpBtnTitle: 'Cosa fa ogni pulsante',
    helpButtons: [
      ['Verifica la chiave', 'Solo prova: la chiave apre il blocco (sì/no) e un modulo vero si decifra con essa?'],
      ['Cifra', 'Cifra tutti i moduli con la chiave digitata. Nulla viene salvato automaticamente.'],
      ['Cifra di nuovo (senza digitare nulla)', 'Come sopra, ma con la chiave già in memoria (pagina sbloccata).'],
      ['Leggi il testo in chiaro', 'Restituisce tutto come testo leggibile (controllo o backup).'],
      ['Scarica il risultato (JSON)', 'Scarica l’ultimo risultato come file.']
    ],
    helpKeyTitle: 'Cambiare la chiave',
    helpKey: 'Sono due cose diverse: (1) il BLOCCO — quale chiave di accesso apre l’app — e (2) la CIFRATURA — con cosa sono cifrati i moduli su disco. Entrambe sono qui sotto in «Cambiare la chiave».',
    trialNote: 'Nota: in modalità prova (TRIAL_MODE) la decifratura usa sempre ENC_TRIAL_KEY. Per questo A basta se vuoi cambiare solo l’accesso.',
    rekeySummary: 'Cambiare la chiave',
    rekeyNote: 'Imposta una nuova chiave di accesso. Serve solo a calcolare e non viene mai salvata.',
    rekeyNew: 'Nuova chiave di accesso',
    rekeyNew2: 'Ripeti la nuova chiave',
    rekeyLockBtn: 'A. Cambiare solo il blocco (veloce)',
    rekeyFullBtn: 'B. Cambiare il blocco E ricifrare i moduli (completo)',
    rekeyHint: 'A: la vecchia chiave non apre più l’app; il contenuto cifrato resta invariato (modalità prova). B: il contenuto dipende davvero dalla nuova chiave — pochi secondi, scarica il risultato a parte.',
    rekeyNeed: 'Digita due volte la nuova chiave.',
    rekeyShort: 'Almeno 4 caratteri.',
    rekeyMismatch: 'Le due voci non sono identiche.',
    rekeyConfirmLock: 'Confermi di spostare il blocco su questa nuova chiave?',
    rekeyConfirmFull: 'Confermi di cambiare il blocco E ricifrare tutti i moduli?',
    rekeyConfirmBtn: 'Sì, esegui',
    rekeyCancel: 'Annulla',
    rekeyCodesTitle: 'Sostituisci queste righe in index.html:',
    rekeySteps: [
      '1. Metti le righe qui sopra in index.html (script del blocco, in alto).',
      '2. Solo per B: scarica i moduli ricifrati e sostituisci i file in src/ — dai il JSON all’assistente.',
      '3. Ricarica la pagina e aprila con la NUOVA chiave.',
      '4. Salva il generatore (pulsante «Salva» dell’editor).'
    ],
    rekeyBusy: 'Ricifratura …',
    rekeyDone: 'Fatto in {ms} ms · {n} moduli',
    rekeyDoneLock: 'Codici calcolati. Nulla è stato ricifrato.',
    copyBtn: 'Copia',
    copied: 'Copiato.',
    rekeyDownload: 'Scarica i moduli ricifrati (JSON)',
    rekeyNoArtifacts: 'Manca SofiaGate.keyArtifacts — ricarica la pagina una volta.',
    saveHint: 'File sofia-enc-pack.json scaricato. Nel progetto NON è cambiato nulla: questo file deve prima sostituire i moduli in src/.',
    packHintOther: 'Questa chiave non è quella del blocco attuale. Se vuoi davvero cambiare l’accesso, usa «Cambiare la chiave» qui sotto.',
    packHint: 'Non è ancora scritto nulla: premi «Scarica il risultato (JSON)» e rimetti il file in src/.',
    dumpHint: 'Solo lettura — non è cambiato nulla.',
    checkHint: '→ Non è cambiato nulla: «Verifica la chiave» fa solo una prova. Per applicarla usa «Cifra» (pulsante 3).'
  }
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
// Même normalisation que le verrou (norm dans index.html) : tout sauf A–Z/0–9
// est retiré, majuscules. Ici, uniquement pour les tests de longueur et d'égalité.
function normKey(s) { return String(s == null ? '' : s).replace(/[^A-Za-z0-9]/g, '').toUpperCase(); }
function GL() { return GUIDE_TXT[panelLang()] || GUIDE_TXT.fr; }
function G(key, vars) {
  const g = GL();
  let s = (g && g[key] != null) ? g[key] : key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

function panelLang() {
  let code = '';
  try { code = (window.App && App.State && App.State.settings && App.State.settings.language) || ''; } catch (e) {}
  if (!code) { try { code = localStorage.getItem('sofia_owner_lang_v1') || ''; } catch (e) {} }
  if (!code) { try { code = navigator.language || ''; } catch (e) {} }
  code = String(code).slice(0, 2).toLowerCase();
  return PANEL_TXT[code] ? code : 'fr';
}
function L() { return PANEL_TXT[panelLang()]; }
// Texte issu des deux tables (le mode d'emploi d'abord), avec des espaces
// réservés : T('derived', { x: 'ab12cd34' }).
function TX(key) {
  const g = GL();
  if (g && g[key] != null) return g[key];
  const t = L();
  if (t[key] != null) return t[key];
  return PANEL_TXT.en[key] != null ? PANEL_TXT.en[key] : (PANEL_TXT.fr[key] != null ? PANEL_TXT.fr[key] : String(key));
}
function T(key, vars) {
  let s = TX(key);
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

function basePath() {
  try { return new URL('.', location.href).pathname; } catch (e) { return '/'; }
}

// Transformer l'URL absolue d'un module en chemin de fichier dans le générateur ("src/x.js").
function absToRel(abs) {
  let p = abs;
  try { p = new URL(abs).pathname; } catch (e) {}
  const i = p.indexOf('/src/');
  if (i >= 0) return p.slice(i + 1);
  const base = basePath();
  if (base !== '/' && p.indexOf(base) === 0) p = p.slice(base.length);
  else p = p.replace(/^\/+/, '');
  return p;
}

function openDb() {
  return new Promise((resolve, reject) => {
    let req;
    try { req = indexedDB.open(DB_NAME, 1); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(value, k) {
  return openDb().then((d) => new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, k || KEY);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  })).catch(() => false);
}

function idbGet(k) {
  return openDb().then((d) => new Promise((resolve, reject) => {
    const r = d.transaction(STORE, 'readonly').objectStore(STORE).get(k || KEY);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  })).catch(() => null);
}

function download(name, text) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { try { URL.revokeObjectURL(url); a.remove(); } catch (e) {} }, 5000);
  } catch (e) {}
}

async function fetchText(abs) {
  try {
    const r = await fetch(abs, { cache: 'no-store' });
    if (r && r.ok) return await r.text();
  } catch (e) {}
  return null;
}

async function rootsList() {
  const roots = (window.__sofiaRoots || []).slice();
  if (!roots.length) throw new Error('window.__sofiaRoots absent – la liste des modules n\'a pas pu être lue.');
  const all = await moduleClosure(roots.concat(EXTRA));
  return all.filter((a) => {
    const rel = absToRel(a);
    return rel && rel.indexOf('src/') === 0 && !SKIP.some((s) => rel.slice(-s.length) === s);
  });
}

// Chiffre tout le graphe. keyB64 est la clé DÉJÀ dérivée – la clé d'accès
// elle-même n'est jamais vue ici.
async function packAll(keyB64, onStep, slot, fromKey) {
  const list = await rootsList();
  const items = {};
  const skipped = [];
  let plainBytes = 0;
  let cipherChars = 0;
  let n = 0;
  for (const abs of list) {
    const rel = absToRel(abs);
    n++;
    if (onStep) onStep(n, list.length, rel);
    let text = await fetchText(abs);
    if (text == null) { skipped.push({ path: rel, why: T('whyLoadable') }); continue; }
    // Si un enregistrement existe déjà, le rechiffrement a besoin de l'ANCIENNE
    // clé (fromKey) – sinon seul le clair est chiffré.
    if (text.indexOf(ENC_PREFIX) === 0) {
      if (!fromKey) { skipped.push({ path: rel, why: T('whyEncrypted') }); continue; }
      let pt = null;
      try { pt = await decryptText(text, fromKey); } catch (e) { pt = null; }
      if (!pt) { skipped.push({ path: rel, why: T('whyUnreadable') }); continue; }
      text = pt;
    }
    const rec = await encryptText(text, keyB64);
    items[rel] = rec;
    plainBytes += text.length;
    cipherChars += rec.length;
  }
  const result = {
    v: 1,
    ts: Date.now(),
    enc: true,
    count: Object.keys(items).length,
    plainBytes: plainBytes,
    cipherChars: cipherChars,
    skipped: skipped,
    items: items
  };
  if (slot === 'rekey') {
    window.__rekeyResult = result;
    await idbPut(result, REKEY_KEY);
  } else {
    window.__packResult = result;
    await idbPut(result);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Panneau
// ---------------------------------------------------------------------------

let panel = null;
let statusEl = null;
let keyInput = null;
let panelLangUsed = '';

function fmtBytes(b) {
  if (b > 1048576) return (b / 1048576).toFixed(2) + ' MB';
  if (b > 1024) return (b / 1024).toFixed(1) + ' kB';
  return b + ' B';
}

function buildPanel() {
  if (panel) return;
  panel = document.createElement('div');
  panel.id = 'sofiaPackPanel';
  panel.hidden = true;
  panel.style.cssText = [
    'position:fixed', 'inset:auto 12px 12px 12px', 'z-index:2147483000',
    'max-width:640px', 'max-height:78vh', 'overflow:auto', 'margin:0 auto',
    'background:#15151b', 'color:#e8e8ef', 'border:1px solid #3a3a4a',
    'border-radius:14px', 'box-shadow:0 18px 60px rgba(0,0,0,.6)',
    'padding:16px 18px', 'font:14px/1.5 system-ui,sans-serif', 'text-align:left'
  ].join(';');
  const inpStyle = 'display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:8px 10px;border-radius:8px;border:1px solid #3a3a4a;background:#0e0e13;color:#fff';
  const btnA = 'padding:8px 14px;border-radius:8px;border:1px solid #4a6cf7;background:#2b3f9e;color:#fff;cursor:pointer';
  const btnB = 'padding:8px 14px;border-radius:8px;border:1px solid #3a3a4a;background:#22222c;color:#ddd;cursor:pointer';
  const btnC = 'padding:8px 14px;border-radius:8px;border:1px solid #2f7d4f;background:#1d4a30;color:#d8ffe4;cursor:pointer';
  const box = 'margin:0 0 12px;border:1px solid #2c2c38;border-radius:10px;padding:8px 12px;background:#101017';
  panel.innerHTML = [
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">',
    '<strong style="flex:1;font-size:15px" data-t="title"></strong>',
    '<button id="encPackClose" type="button" style="background:none;border:0;color:#9a9ab0;font-size:18px;cursor:pointer">\u2715</button>',
    '</div>',
    '<p style="margin:0 0 10px;color:#9a9ab0" data-t="note"></p>',
    // ---- Mode d'emploi (Ronde 107) ----
    '<details id="encPackHelp" style="' + box + '">',
    '<summary data-t="helpSummary" style="cursor:pointer;color:#cdd3ff;font-weight:600"></summary>',
    '<div id="encPackHelpBody" style="margin-top:8px;font-size:13px;line-height:1.6"></div>',
    '</details>',
    '<label style="display:block;margin-bottom:6px"><span data-t="key"></span>',
    '<input id="encPackKey" type="password" autocomplete="new-password" spellcheck="false" style="' + inpStyle + '">',
    '</label>',
    '<label style="display:flex;align-items:center;gap:8px;margin:8px 0 12px;color:#9a9ab0"><input id="encPackRemember" type="checkbox" checked> <span data-t="remember"></span></label>',
    '<div style="display:flex;flex-wrap:wrap;gap:8px">',
    '<button id="encPackCheck" type="button" data-t="check" style="' + btnC + '"></button>',
    '<button id="encPackRun" type="button" data-t="pack" style="' + btnA + '"></button>',
    '<button id="encPackRepack" type="button" data-t="repack" style="' + btnB + '"></button>',
    '<button id="encPackDump" type="button" data-t="dump" style="' + btnB + '"></button>',
    '<button id="encPackSave" type="button" data-t="save" style="' + btnB + '"></button>',
    '</div>',
    // ---- Changer la clé (Ronde 107) ----
    '<details id="encPackRekey" style="' + box + 'margin-top:12px">',
    '<summary data-t="rekeySummary" style="cursor:pointer;color:#cdd3ff;font-weight:600"></summary>',
    '<p style="margin:8px 0;color:#9a9ab0;font-size:13px" data-t="rekeyNote"></p>',
    '<label style="display:block;margin-bottom:6px"><span data-t="rekeyNew"></span>',
    '<input id="encPackNewKey" type="password" autocomplete="new-password" spellcheck="false" style="' + inpStyle + '">',
    '</label>',
    '<label style="display:block;margin-bottom:8px"><span data-t="rekeyNew2"></span>',
    '<input id="encPackNewKey2" type="password" autocomplete="new-password" spellcheck="false" style="' + inpStyle + '">',
    '</label>',
    '<div id="encPackRekeyMsg" style="margin:0 0 8px;color:#ffd479;font-size:13px;white-space:pre-wrap"></div>',
    '<div id="encPackRekeyConfirmRow" hidden style="gap:8px;margin:0 0 8px">',
    '<button id="encPackRekeyConfirm" type="button" style="' + btnA + '"></button>',
    '<button id="encPackRekeyCancel" type="button" style="' + btnB + 'margin-left:8px"></button>',
    '</div>',
    '<div style="display:flex;flex-wrap:wrap;gap:8px">',
    '<button id="encPackRekeyLock" type="button" data-t="rekeyLockBtn" style="' + btnB + '"></button>',
    '<button id="encPackRekeyFull" type="button" data-t="rekeyFullBtn" style="' + btnA + '"></button>',
    '</div>',
    '<div id="encPackRekeyHint" style="margin:8px 0 0;color:#8f8fa3;font-size:12px"></div>',
    '<div id="encPackRekeyOut" hidden style="margin-top:10px;border-top:1px solid #2c2c38;padding-top:10px">',
    '<div data-t="rekeyCodesTitle" style="color:#e8e8ef;font-weight:600;margin-bottom:6px"></div>',
    '<textarea id="encPackCodes" readonly spellcheck="false" style="width:100%;box-sizing:border-box;height:74px;background:#0e0e13;color:#9fe6a0;border:1px solid #3a3a4a;border-radius:8px;padding:8px;font:12px/1.5 ui-monospace,monospace;resize:vertical"></textarea>',
    '<div style="display:flex;gap:8px;margin:6px 0 8px;flex-wrap:wrap">',
    '<button id="encPackCopy" type="button" data-t="copyBtn" style="' + btnB + '"></button>',
    '<button id="encPackRekeyDownload" type="button" data-t="rekeyDownload" hidden style="' + btnA + '"></button>',
    '</div>',
    '<div id="encPackRekeySteps" style="color:#c9c9d6;font-size:13px;line-height:1.6"></div>',
    '</div>',
    '</details>',
    '<pre id="encPackStatus" style="margin:12px 0 0;white-space:pre-wrap;color:#9fe6a0;font:12px/1.5 ui-monospace,monospace"></pre>'
  ].join('');
  document.body.appendChild(panel);
  localizePanel();
  statusEl = panel.querySelector('#encPackStatus');
  keyInput = panel.querySelector('#encPackKey');

  const q = (id) => panel.querySelector('#' + id);
  q('encPackClose').addEventListener('click', hide);
  q('encPackCheck').addEventListener('click', () => { checkKey(); });
  q('encPackRun').addEventListener('click', () => {
    const key = keyInput.value;
    if (!key) { say(T('needKey')); return; }
    runWithKey(key);
  });
  q('encPackSave').addEventListener('click', async () => {
    const r = window.__packResult || await idbGet(KEY);
    if (!r) { say(T('noResult')); return; }
    download('sofia-enc-pack.json', JSON.stringify(r));
    say(T('fileWritten') + '\n' + G('saveHint'));
  });
  q('encPackRepack').addEventListener('click', repackFromMemory);
  q('encPackDump').addEventListener('click', () => dumpPlain(true));
  q('encPackRekeyLock').addEventListener('click', () => rekeyStart(false));
  q('encPackRekeyFull').addEventListener('click', () => rekeyStart(true));
  q('encPackRekeyConfirm').addEventListener('click', rekeyRun);
  q('encPackRekeyCancel').addEventListener('click', rekeyCancel);
  q('encPackCopy').addEventListener('click', copyCodes);
  q('encPackRekeyDownload').addEventListener('click', () => {
    const r = window.__rekeyResult || null;
    if (!r) { q('encPackRekeyMsg').textContent = T('noResult'); return; }
    download('sofia-enc-modules.json', JSON.stringify(r));
  });
}

// Poser les textes visibles du panneau à partir de la table de langue. S'exécute
// à la construction et chaque fois que la langue a changé (show() reconstruit
// alors).
function localizePanel() {
  if (!panel) return;
  const put = (key) => {
    const el = panel.querySelector('[data-t="' + key + '"]');
    if (el) el.textContent = String(TX(key));
  };
  ['title', 'note', 'key', 'remember', 'check', 'pack', 'repack', 'dump', 'save',
    'helpSummary', 'rekeySummary', 'rekeyNew', 'rekeyNew2', 'rekeyLockBtn',
    'rekeyFullBtn', 'rekeyCodesTitle', 'copyBtn', 'rekeyDownload'].forEach(put);
  const g = GL();
  const body = panel.querySelector('#encPackHelpBody');
  if (body) {
    const step = (s) => '<div style="margin:2px 0">' + esc(s) + '</div>';
    const btn = (p) => '<div style="margin:4px 0"><b style="color:#cdd3ff">' + esc(p[0]) + '</b> — <span style="color:#c9c9d6">' + esc(p[1]) + '</span></div>';
    body.innerHTML =
      '<div style="color:#c9c9d6">' + esc(g.helpIntro) + '</div>' +
      '<div style="margin:10px 0 2px;color:#e8e8ef"><b>' + esc(g.helpHowTitle) + '</b></div>' + (g.helpHow || []).map(step).join('') +
      '<div style="margin:10px 0 2px;color:#e8e8ef"><b>' + esc(g.helpBtnTitle) + '</b></div>' + (g.helpButtons || []).map(btn).join('') +
      '<div style="margin:10px 0 2px;color:#e8e8ef"><b>' + esc(g.helpKeyTitle) + '</b></div>' +
      '<div style="color:#c9c9d6">' + esc(g.helpKey) + '</div>' +
      '<div style="color:#8f8fa3;margin-top:6px">' + esc(g.trialNote) + '</div>';
  }
  const hint = panel.querySelector('#encPackRekeyHint');
  if (hint) hint.innerHTML = '<div>' + esc(g.rekeyHint) + '</div>';
  const steps = panel.querySelector('#encPackRekeySteps');
  if (steps) steps.innerHTML = (g.rekeySteps || []).map((s) => '<div style="margin:2px 0">' + esc(s) + '</div>').join('');
  panelLangUsed = panelLang();
}

function say(txt) {
  if (statusEl) statusEl.textContent = txt;
}

function currentKey() {
  try { return (window.SofiaEnc && window.SofiaEnc.key) || ''; } catch (e) { return ''; }
}

// Ronde 101 (complément b) : vérifier la clé AVANT de chiffrer quoi que ce soit.
// Deux questions, deux réponses : (1) cette clé ouvre-t-elle le verrou d'accès ?
// (2) la clé qui en est dérivée déchiffre-t-elle vraiment les modules ? La
// seconde question est vérifiée durement – un vrai module est déchiffré avec.
// On ne renvoie jamais qu'un rapport (jamais la clé d'accès elle-même).
async function checkKey(rawArg) {
  const panel = document.getElementById('sofiaPackPanel');
  const input = panel ? panel.querySelector('#encPackKey') : null;
  const raw = rawArg != null ? String(rawArg) : (input ? input.value : (keyInput ? keyInput.value : ''));
  const rep = { given: !!String(raw).trim(), accessKey: null, derived: '', session: false, trial: false, probe: 'none', plainLen: 0, lines: [] };
  const push = (s) => rep.lines.push(s);
  if (!rep.given) { push(T('needKey')); say(rep.lines.join('\n')); return rep; }
  if (rawArg == null) say(T('checking'));
  let info = null;
  try { info = (window.SofiaGate && window.SofiaGate.checkKey) ? window.SofiaGate.checkKey(raw) : null; } catch (err) {}
  if (info) {
    rep.accessKey = info.accessKey === true;
    rep.derived = info.derived || '';
    rep.session = !!info.derivedMatchesSession;
    rep.trial = !!info.derivedMatchesTrial;
    push(info.accessKey ? T('keyOk') : T('keyBad'));
  } else {
    push(T('noGate'));
    try { rep.derived = (window.SofiaGate && window.SofiaGate.encKeyFor) ? window.SofiaGate.encKeyFor(raw) : ''; } catch (err) {}
  }
  if (!rep.derived) { push(T('noDerive')); say(rep.lines.join('\n')); return rep; }
  push(T('derived', { x: rep.derived.slice(0, 8) }));
  if (rep.session || rep.trial) push(T('sameKey'));
  else push(T('otherKey'));
  const probe = 'src/guard.js';
  try {
    const res = await fetch(probe + '?v=' + Date.now(), { cache: 'no-store' });
    const rec = res && res.ok ? await res.text() : '';
    if (!rec || rec.indexOf(ENC_PREFIX) !== 0) push(T('plainProbe', { p: probe }));
    else {
      const plain = await decryptText(rec, rep.derived);
      rep.plainLen = plain ? plain.length : 0;
      rep.probe = plain && plain.length ? 'ok' : 'fail';
      push(plain && plain.length ? T('probeOk', { p: probe, n: plain.length }) : T('probeFail', { p: probe }));
    }
  } catch (err) {
    const name = (err && (err.name || err.message)) ? String(err.name || err.message) : String(err);
    if (/Operation(Error)?|DataError/i.test(name)) { rep.probe = 'fail'; push(T('probeFail', { p: probe })); }
    else { rep.probe = 'error'; push(T('probeErr', { e: name })); }
  }
  if (rep.probe === 'fail') push(T('probeFailHint'));
  push(G('checkHint'));
  say(rep.lines.join('\n'));
  return rep;
}

function show() {
  // Langue changée ? Reconstruire alors le panneau avec les nouveaux textes.
  if (panel && panelLangUsed !== panelLang()) {
    try { panel.remove(); } catch (e) {}
    panel = null; statusEl = null; keyInput = null;
  }
  buildPanel();
  panel.hidden = false;
}
function hide() {
  if (panel) panel.hidden = true;
}

async function runWithKey(key) {
  try {
    if (!(window.SofiaGate && window.SofiaGate.encKeyFor)) { say(T('gateMissing')); return; }
    const keyB64 = window.SofiaGate.encKeyFor(key);
    if (!keyB64) { say(T('deriveFailed')); return; }
    const remember = !!(panel && panel.querySelector('#encPackRemember') && panel.querySelector('#encPackRemember').checked);
    say(T('reading'));
    const t0 = Date.now();
    const r = await packAll(keyB64, (i, n, rel) => say(T('encrypting', { i: i, n: n, rel: rel })), null, currentKey());
    if (remember && window.SofiaGate.encStore) window.SofiaGate.encStore(keyB64, true);
    const lines = [
      T('doneMs', { ms: Date.now() - t0 }),
      T('countEncrypted', { n: r.count, p: fmtBytes(r.plainBytes), c: fmtBytes(r.cipherChars) })
    ];
    if (r.skipped.length) lines.push(T('skipped', { list: r.skipped.map((s) => s.path + ' (' + s.why + ')').join(', ') }));
    lines.push(T('resultHint'));
    if (keyB64 !== currentKey()) lines.push(G('packHintOther'));
    lines.push(G('packHint'));
    say(lines.join('\n'));
  } catch (e) {
    say(T('error', { e: (e && e.message) || e }));
  }
}

async function repackFromMemory() {
  const keyB64 = currentKey();
  if (!keyB64) { say(T('noKeyInMemory')); return; }
  try {
    say(T('reading'));
    const t0 = Date.now();
    const r = await packAll(keyB64, (i, n, rel) => say(T('encrypting', { i: i, n: n, rel: rel })), null, keyB64);
    say(
      T('repackedMs', { ms: Date.now() - t0 }) + '\n' +
      T('countModules', { n: r.count, p: fmtBytes(r.plainBytes), c: fmtBytes(r.cipherChars) }) + '\n' +
      (r.skipped.length ? T('skipped', { list: r.skipped.map((s) => s.path + ' (' + s.why + ')').join(', ') }) + '\n' : '') +
      T('resultHintShort')
    );
  } catch (e) {
    say(T('error', { e: (e && e.message) || e }));
  }
}

// Clair de tous les enregistrements présents sur le disque. N'a besoin que de la
// clé déjà en mémoire après le déverrouillage. Avec `downloadIt`, un fichier est
// en plus écrit.
async function dumpPlain(downloadIt) {
  const keyB64 = currentKey();
  if (!keyB64) { say(T('noKeyInMemory')); return null; }
  try {
    const list = await rootsList();
    const items = {};
    const plain = {};
    let bad = 0;
    let i = 0;
    for (const abs of list) {
      const rel = absToRel(abs);
      i++;
      say(T('decrypting', { i: i, n: list.length, rel: rel }));
      const text = await fetchText(abs);
      if (text == null) { bad++; continue; }
      if (text.indexOf(ENC_PREFIX) !== 0) { items[rel] = text; continue; }
      const pt = await decryptText(text, keyB64);
      if (pt == null) { bad++; continue; }
      plain[rel] = pt;
    }
    const out = { v: 1, ts: Date.now(), plain: plain, notEncrypted: items, failed: bad };
    window.__packPlain = out;
    say(T('plainSummary', { a: Object.keys(plain).length, b: Object.keys(items).length }) + (bad ? T('plainBad', { n: bad }) : '') + '\n' + G('dumpHint'));
    if (downloadIt) download('sofia-plain.json', JSON.stringify(out));
    return out;
  } catch (e) {
    say(T('error', { e: (e && e.message) || e }));
    return null;
  }
}

// ---------------------------------------------------------------------------
// Changer la clé (Ronde 107)
// ---------------------------------------------------------------------------
// Deux étapes, toutes deux sans boîtes de dialogue natives (un confirm()
// bloquerait l'aperçu) : clic -> vérification -> avertissement + « Oui, exécuter »
// -> résultat.
//   A ('lock')  : seulement les codes pour KEY_HASH/DEVICE_VERIFIER, rien n'est chiffré.
//   B ('full')  : en plus, chiffrer tous les modules avec la nouvelle clé ;
//                 le résultat se trouve sous window.__rekeyResult et dans IndexedDB.
// Rien n'est JAMAIS écrit sur le disque – le propriétaire (ou l'assistant)
// insère les codes ou le fichier JSON.
let rekeyMode = null;

function rekeyStart(full) {
  if (!panel) return null;
  const msg = panel.querySelector('#encPackRekeyMsg');
  const row = panel.querySelector('#encPackRekeyConfirmRow');
  const k1 = panel.querySelector('#encPackNewKey').value;
  const k2 = panel.querySelector('#encPackNewKey2').value;
  const n1 = normKey(k1);
  if (!k1 || !k2) { msg.textContent = G('rekeyNeed'); row.hidden = true; return null; }
  if (n1.length < 4) { msg.textContent = G('rekeyShort'); row.hidden = true; return null; }
  if (n1 !== normKey(k2)) { msg.textContent = G('rekeyMismatch'); row.hidden = true; return null; }
  if (!(window.SofiaGate && window.SofiaGate.keyArtifacts)) { msg.textContent = G('rekeyNoArtifacts'); row.hidden = true; return null; }
  rekeyMode = full ? 'full' : 'lock';
  msg.textContent = full ? G('rekeyConfirmFull') : G('rekeyConfirmLock');
  panel.querySelector('#encPackRekeyConfirm').textContent = G('rekeyConfirmBtn');
  panel.querySelector('#encPackRekeyCancel').textContent = G('rekeyCancel');
  row.hidden = false;
  return rekeyMode;
}

function rekeyCancel() {
  rekeyMode = null;
  if (!panel) return;
  panel.querySelector('#encPackRekeyConfirmRow').hidden = true;
  panel.querySelector('#encPackRekeyMsg').textContent = '';
}

// Les lignes dont le verrou a besoin dans index.html – uniquement des valeurs dérivées.
function codesFor(art, full) {
  const lines = [
    'var KEY_HASH = "' + art.keyHash + '";',
    'var DEVICE_VERIFIER = "' + art.deviceVerifier + '";'
  ];
  if (full) lines.push('var ENC_TRIAL_KEY = "' + art.encKey + '";');
  return lines.join('\n');
}

async function rekeyRun() {
  if (!panel) return null;
  const msg = panel.querySelector('#encPackRekeyMsg');
  const row = panel.querySelector('#encPackRekeyConfirmRow');
  const full = rekeyMode === 'full';
  if (!rekeyMode) { msg.textContent = G('rekeyNeed'); return null; }
  const art = window.SofiaGate.keyArtifacts(panel.querySelector('#encPackNewKey').value);
  if (!art) { msg.textContent = G('rekeyNoArtifacts'); row.hidden = true; return null; }
  row.hidden = true;
  const out = panel.querySelector('#encPackRekeyOut');
  panel.querySelector('#encPackCodes').value = codesFor(art, full);
  panel.querySelector('#encPackRekeySteps').innerHTML = (GL().rekeySteps || []).map((s) => '<div style="margin:2px 0">' + esc(s) + '</div>').join('');
  out.hidden = false;
  panel.querySelector('#encPackRekeyDownload').hidden = !full;
  try { out.scrollIntoView({ block: 'nearest' }); } catch (e) {}
  if (!full) {
    window.__rekeyCodes = { keyHash: art.keyHash, deviceVerifier: art.deviceVerifier, encKey: art.encKey, fingerprint: art.fingerprint, mode: 'lock' };
    msg.textContent = G('rekeyDoneLock');
    rekeyMode = null;
    return window.__rekeyCodes;
  }
  msg.textContent = G('rekeyBusy');
  try {
    const t0 = Date.now();
    const r = await packAll(art.encKey, (i, n, rel) => { msg.textContent = T('encrypting', { i: i, n: n, rel: rel }); }, 'rekey', currentKey());
    r.rekey = { keyHash: art.keyHash, deviceVerifier: art.deviceVerifier, encKey: art.encKey, fingerprint: art.fingerprint, mode: 'full' };
    window.__rekeyResult = r;
    await idbPut(r, REKEY_KEY);
    msg.textContent = G('rekeyDone', { ms: Date.now() - t0, n: r.count });
  } catch (e) {
    msg.textContent = T('error', { e: (e && e.message) || e });
  }
  rekeyMode = null;
  return window.__rekeyResult || null;
}

function copyCodes() {
  if (!panel) return '';
  const el = panel.querySelector('#encPackCodes');
  const txt = el ? el.value : '';
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt); } catch (e) {}
  try { el.focus(); el.select(); document.execCommand('copy'); } catch (e) {}
  const msg = panel.querySelector('#encPackRekeyMsg');
  if (msg) msg.textContent = G('copied');
  return txt;
}

window.SofiaPack = {
  show: show,
  check: checkKey,
  hide: hide,
  pack: runWithKey,
  repack: repackFromMemory,
  dumpPlain: dumpPlain,
  result: async () => window.__packResult || await idbGet(KEY),
  ready: () => !!(document.getElementById('sofiaPackPanel')),
  // Ronde 106 : quelle langue le panneau utilise actuellement (case à cocher + test).
  lang: () => panelLang(),
  locales: () => Object.keys(PANEL_TXT),
  text: (key) => T(key),
  // Ronde 107 : mode d'emploi + « Changer la clé ».
  guide: (key) => (key == null ? GL() : G(key)),
  help: () => (panel ? panel.querySelector('#encPackHelpBody').textContent : ''),
  artifacts: (k) => (window.SofiaGate && window.SofiaGate.keyArtifacts) ? window.SofiaGate.keyArtifacts(k) : null,
  codes: (k, full) => { const a = (window.SofiaGate && window.SofiaGate.keyArtifacts) ? window.SofiaGate.keyArtifacts(k) : null; return a ? codesFor(a, !!full) : ''; },
  rekey: rekeyStart,
  rekeyRun: rekeyRun,
  rekeyCancel: rekeyCancel,
  rekeyCodes: () => window.__rekeyCodes || null,
  rekeyResult: () => window.__rekeyResult || null
};

(function auto() {
  try {
    const wantHash = String(location.hash || '').indexOf('pack') >= 0;
    let wantFlag = false;
    try { wantFlag = localStorage.getItem('sofia_pack_ui') === '1'; } catch (e) {}
    if (wantHash || wantFlag) {
      const go = () => show();
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
      else go();
    }
  } catch (e) {}
})();
