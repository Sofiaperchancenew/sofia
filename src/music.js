import { SOUND, PRESETS_FR, BANK_FR, JOURNEY_FR } from './music-data.js';
import { SUNO_FAM, familyFor, sunoExtra, SUNO_STRUCT, SUNO_ENERGY, sunoJoin, sunoVocalBracket, sunoChorusTag, sunoStyleVoice, SUNO_LEXICON, sunoMoments } from './music-suno.js';
import { TIME_SIGS, FEELS, POLYS, RHYTHM_PATTERNS, getPattern, meterById, feelById, polyById, patternLabel, rhythmSunoFragment, rhythmStructBracket, asciiRow, surpriseRhythm } from './music-rhythm.js';
import { buildCoverPrompt, COVER_STYLE_LABELS } from './music-cover.js';
import { BANK_DE, BANK_EN, BANK_ES, BANK_IT, BANK_PL, BANK_JA, BANK_ZH, BANK_ZH_CN, BANK_KO, BANK_HI } from './music-i18n.js';
var BANKS = { fr: BANK_FR, de: BANK_DE, en: BANK_EN, es: BANK_ES, it: BANK_IT, pl: BANK_PL, ja: BANK_JA, zh: BANK_ZH, 'zh-CN': BANK_ZH_CN, ko: BANK_KO, hi: BANK_HI };
var VL = { fr: 'accent France fr_fr, prononciation claire', de: 'Akzent Deutschland de_de, klare Aussprache', en: 'en_us accent, clear pronunciation', es: 'acento España es_es, pronunciación clara', it: 'accento Italia it_it, pronuncia chiara', pl: 'akcent Polska pl_pl, wyraźna wymowa', ja: 'アクセント 日本 ja_jp、明瞭な発音', zh: '口音 台灣 zh_tw，發音清晰', ko: '억양 대한민국 ko_kr, 명확한 발음', hi: 'लहजा भारत hi_in, स्पष्ट उच्चारण' };
var SV = { fr: 'Voix', de: 'Stimme', en: 'Voice', es: 'Voz', it: 'Voce', pl: 'Głos', ja: '声', zh: '聲音', ko: '음성', hi: 'आवाज़' };
var SEC = {
fr: { v1: 'Couplet 1', v2: 'Couplet 2', pre: 'Pré-refrain', ch: 'Refrain', chf: 'Refrain final', br: 'Pont', out: 'Final', intro: 'Intro', sec: 'Section', tex: 'Texture', up: 'Montée', drop: 'Explosion', calm: 'Accalmie', peak: 'Apogée', ins: 'Instrumental', choir: 'Chœur français euphorique' },
de: { v1: 'Strophe 1', v2: 'Strophe 2', pre: 'Pre-Refrain', ch: 'Refrain', chf: 'Schlussrefrain', br: 'Bridge', out: 'Finale', intro: 'Intro', sec: 'Teil', tex: 'Textur', up: 'Aufbau', drop: 'Explosion', calm: 'Ruhephase', peak: 'Höhepunkt', ins: 'Instrumental', choir: 'Euphorischer deutscher Chor' },
en: { v1: 'Verse 1', v2: 'Verse 2', pre: 'Pre-chorus', ch: 'Chorus', chf: 'Final chorus', br: 'Bridge', out: 'Outro', intro: 'Intro', sec: 'Section', tex: 'Texture', up: 'Build-up', drop: 'Drop', calm: 'Breakdown', peak: 'Peak', ins: 'Instrumental', choir: 'Euphoric English choir' },
es: { v1: 'Estrofa 1', v2: 'Estrofa 2', pre: 'Pre-estribillo', ch: 'Estribillo', chf: 'Estribillo final', br: 'Puente', out: 'Final', intro: 'Intro', sec: 'Sección', tex: 'Textura', up: 'Subida', drop: 'Explosión', calm: 'Calma', peak: 'Apogeo', ins: 'Instrumental', choir: 'Coro español eufórico' },
it: { v1: 'Strofa 1', v2: 'Strofa 2', pre: 'Pre-ritornello', ch: 'Ritornello', chf: 'Ritornello finale', br: 'Ponte', out: 'Finale', intro: 'Intro', sec: 'Sezione', tex: 'Tessitura', up: 'Salita', drop: 'Esplosione', calm: 'Calma', peak: 'Apice', ins: 'Strumentale', choir: 'Coro italiano euforico' },
pl: { v1: 'Zwrotka 1', v2: 'Zwrotka 2', pre: 'Przed-refren', ch: 'Refren', chf: 'Refren finalny', br: 'Most', out: 'Finał', intro: 'Intro', sec: 'Sekcja', tex: 'Tekstura', up: 'Narastanie', drop: 'Eksplozja', calm: 'Uspokojenie', peak: 'Apogeum', ins: 'Instrumental', choir: 'Euforyczny polski chór' },
ja: { v1: 'ヴァース1', v2: 'ヴァース2', pre: 'プレコーラス', ch: 'サビ', chf: '最終サビ', br: 'ブリッジ', out: 'アウトロ', intro: 'イントロ', sec: 'セクション', tex: 'テクスチャ', up: '盛り上がり', drop: '爆発', calm: '静寂', peak: '頂点', ins: 'インストゥルメンタル', choir: '歓喜の日本語コーラス' },
zh: { v1: '主歌1', v2: '主歌2', pre: '導副歌', ch: '副歌', chf: '最終副歌', br: '橋段', out: '結尾', intro: '前奏', sec: '段落', tex: '質地', up: '堆疊', drop: '爆發', calm: '沉澱', peak: '頂點', ins: '純音樂', choir: '歡騰華語合唱' }
};
var NLBL = { fr: ['INTENTION','SOMATIQUE','VOIX','MIX','ASTUCE SUNO'], de: ['INTENTION','SOMATIK','STIMME','MIX','SUNO-TIPP'], en: ['INTENTION','SOMATIC','VOICE','MIX','SUNO TIP'], es: ['INTENCIÓN','SOMÁTICO','VOZ','MEZCLA','CONSEJO SUNO'], it: ['INTENZIONE','SOMATICO','VOCE','MIX','CONSIGLIO SUNO'], pl: ['INTENCJA','SOMATYKA','GŁOS','MIKS','TRIK SUNO'], ja: ['意図','身体','声','ミックス','SUNOのコツ'], zh: ['意圖','身體','聲音','混音','SUNO訣竅'] };
var HDR = { fr: ['TITRE','STYLE','À EXCLURE','STRUCTURE','PAROLES'], de: ['TITEL','STYLE','AUSSCHLIESSEN','STRUKTUR','TEXTE'], en: ['TITLE','STYLE','EXCLUDE','STRUCTURE','LYRICS'], es: ['TÍTULO','STYLE','EXCLUIR','ESTRUCTURA','LETRA'], it: ['TITOLO','STYLE','ESCLUDERE','STRUTTURA','TESTO'], pl: ['TYTUŁ','STYL','WYKLUCZ','STRUKTURA','TEKST'], ja: ['タイトル','スタイル','除外','構成','歌詞'], zh: ['標題','風格','排除','結構','歌詞'] };
SEC['zh-CN'] = { v1: '主歌1', v2: '主歌2', pre: '导副歌', ch: '副歌', chf: '最终副歌', br: '桥段', out: '结尾', intro: '前奏', sec: '段落', tex: '质地', up: '堆叠', drop: '爆发', calm: '沉淀', peak: '顶点', ins: '纯音乐', choir: '欢腾华语合唱' };
SV['zh-CN'] = '声音'; VL['zh-CN'] = '口音 中国大陆 zh_cn，发音清晰'; NLBL['zh-CN'] = ['意图','身体','声音','混音','SUNO诀窍']; HDR['zh-CN'] = ['标题','风格','排除','结构','歌词'];
SEC['ko'] = { v1: '벌스1', v2: '벌스2', pre: '프리코러스', ch: '코러스', chf: '최종 코러스', br: '브릿지', out: '아웃트로', intro: '인트로', sec: '섹션', tex: '텍스처', up: '고조', drop: '폭발', calm: '가라앉음', peak: '정점', ins: '인스트루멘털', choir: '환희의 한국어 합창' };
SV['ko'] = '음성'; VL['ko'] = '억양 대한민국 ko_kr, 명확한 발음'; NLBL['ko'] = ['의도','신체','음성','믹스','SUNO 팁']; HDR['ko'] = ['제목','스타일','제외','구성','가사'];
SEC['hi'] = { v1: 'अंतरा 1', v2: 'अंतरा 2', pre: 'प्री-कोरस', ch: 'कोरस', chf: 'अंतिम कोरस', br: 'ब्रिज', out: 'आउट्रो', intro: 'इंट्रो', sec: 'खंड', tex: 'बनावट', up: 'उठान', drop: 'धमाका', calm: 'ठहराव', peak: 'चरम', ins: 'वाद्य', choir: 'उल्लासपूर्ण हिन्दी समूहगान' };
SV['hi'] = 'आवाज़'; VL['hi'] = 'लहजा भारत hi_in, स्पष्ट उच्चारण'; NLBL['hi'] = ['इरादा','देह','आवाज़','मिक्स','SUNO टिप']; HDR['hi'] = ['शीर्षक','स्टाइल','बाहर','संरचना','गीत'];
var CSS = '#musicModal{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);overflow:auto}' + '#musicModal .mz-wrap{max-width:1020px;margin:0 auto;padding:20px 16px 80px;text-align:left;background:#0a0812;color:#efe9ff;font-family:Inter,system-ui,sans-serif}' + '#musicModal h1{font-size:clamp(22px,4vw,36px);line-height:1.05;margin:8px 0}' + '#musicModal .mz-sub{color:#b9aef5;max-width:75ch;line-height:1.55}' + '#musicModal .mz-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}' + '@media(max-width:760px){#musicModal .mz-grid{grid-template-columns:1fr}}' + '#musicModal .mz-card{background:#151126;border:1px solid #2d2456;border-radius:14px;padding:12px}' + '#musicModal label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#b9aef5;margin:0 0 6px}' + '#musicModal select,#musicModal input[type=text],#musicModal textarea{width:100%;background:#0e0b1c;color:#fff;border:1px solid #3a2f73;border-radius:10px;padding:10px;font-size:14px;box-sizing:border-box}' + '#musicModal textarea{min-height:110px;resize:vertical;line-height:1.6;font-family:inherit}' + '#musicModal input[type=range]{width:100%;accent-color:#ff2e9a}' + '#musicModal .mz-presets{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}' + '#musicModal .mz-presets button{background:#1d1740;color:#fff;border:1px solid #4a3aa3;border-radius:999px;padding:8px 12px;cursor:pointer;font-size:13px}' + '#musicModal .mz-presets button.on{background:#ff2e9a;border-color:#ff2e9a}' + '#musicModal .mz-row{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;align-items:center}' + '#musicModal .mz-big{background:#ff2e9a;border:0;color:#fff;border-radius:12px;padding:12px 18px;font-weight:800;cursor:pointer;font-size:15px}' + '#musicModal .mz-ghost{background:#221c4d;border:1px solid #4a3aa3;color:#fff;border-radius:12px;padding:12px 14px;cursor:pointer}' + '#musicModal .mz-out{display:grid;grid-template-columns:1fr 1fr;gap:12px}' + '@media(max-width:760px){#musicModal .mz-out{grid-template-columns:1fr}}' + '#musicModal pre{background:#000;border:1px solid #333;border-radius:12px;padding:12px;white-space:pre-wrap;min-height:180px;font-size:13px;line-height:1.6;margin:8px 0;color:#efe9ff}' + '#musicModal .mz-count{font-size:12px;color:#b9aef5}' + '#musicModal .mz-count.bad{color:#ff6b6b}' + '#musicModal .mz-kv{font-size:13px;color:#d9d2ff;line-height:1.6}' + '#musicModal .mz-tip{background:#0e0b1c;border:1px dashed #4a3aa3;border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.6;color:#d9d2ff}' + '#musicModal canvas{width:100%;border-radius:12px;background:#000;border:1px solid #333}';
export function attachMusic(App) {
function gi(id){ return document.getElementById(id); }
function curLang(){ try{ var c = null; try{ c = App.State.currentSessionId; }catch(e){} try{ var ss = App.State.sessions || []; for (var i = 0; i < ss.length; i++){ if (ss[i] && ss[i].id === c && ss[i].lockedLanguage){ var l0 = String(ss[i].lockedLanguage).slice(0,2).toLowerCase(); if (l0 === 'zh' && String((App.State.settings && App.State.settings.zhScript) || 'trad').toLowerCase() === 'simp') return 'zh-CN'; if (BANKS[l0]) return l0; } } }catch(e){} }catch(e){} try{ var l = String((App.State.settings && App.State.settings.language) || 'fr').slice(0,2).toLowerCase(); if (l === 'zh' && String((App.State.settings && App.State.settings.zhScript) || 'trad').toLowerCase() === 'simp') return 'zh-CN'; if (BANKS[l]) return l; }catch(e){} return 'fr'; }
var EXTRA_SONG = {
  sq: { label: 'shqip (albanais)', langName: 'Albanian (shqip)', voice: 'sq_al' },
  pt: { label: 'portugu\u00eas', langName: 'Portuguese', voice: 'pt_pt' },
  ru: { label: '\u0440\u0443\u0441\u0441\u043a\u0438\u0439', langName: 'Russian', voice: 'ru_ru' },
  ar: { label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', langName: 'Arabic', voice: 'ar_sa' },
  tr: { label: 'T\u00fcrk\u00e7e', langName: 'Turkish', voice: 'tr_tr' },
  nl: { label: 'Nederlands', langName: 'Dutch', voice: 'nl_nl' },
  el: { label: '\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac', langName: 'Greek', voice: 'el_gr' },
  ro: { label: 'rom\u00e2n\u0103', langName: 'Romanian', voice: 'ro_ro' },
  uk: { label: '\u0443\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430', langName: 'Ukrainian', voice: 'uk_ua' },
  sv: { label: 'svenska', langName: 'Swedish', voice: 'sv_se' }
};
var SONGLBL = { fr:'Langue du chant', de:'Gesangssprache', en:'Song language', es:'Idioma del canto', it:'Lingua del canto', pl:'J\u0119zyk piosenki', ja:'\u6b4c\u8a9e', zh:'\u6b4c\u66f2\u8a9e\u8a00', 'zh-CN':'\u6b4c\u66f2\u8a9e\u8a00', ko:'\ub178\ub798 \uc5b8\uc5b4', hi:'\u0917\u093e\u0928\u0947 \u0915\u0940 \u092d\u093e\u0937\u093e' };
var SONGAUTO = { fr:'Auto (Sofia : ', de:'Auto (Sofia: ', en:'Auto (Sofia: ', es:'Auto (Sofia: ', it:'Auto (Sofia: ', pl:'Auto (Sofia: ', ja:'Auto (Sofia: ', zh:'Auto (Sofia: ', 'zh-CN':'Auto (Sofia: ', ko:'Auto (Sofia: ', hi:'Auto (Sofia: ' };
var _songSel = null;
function songLang(){ if (_songSel && (BANKS[_songSel] || EXTRA_SONG[_songSel])) return _songSel; return curLang(); }
function uiLang(){ var sl = songLang(); return (sl !== curLang()) ? 'en' : curLang(); }
function songCodeOk(c){ return (c && (BANKS[c] || EXTRA_SONG[c])) ? c : null; }
var _fbCache = {};
function fallbackBank(l){
  if (_fbCache[l]) return _fbCache[l];
  var x = EXTRA_SONG[l];
  if (!x) return BANK_FR;
  var b = {}, en = BANK_EN;
  for (var k in en) b[k] = en[k];
  b.meta = { langName: x.langName, voice: x.voice, country: '' };
  b.aiPrompt = 'Write song lyrics in ' + x.langName + ', family-friendly, sincere emotion. Ambiance: {genre}. Theme: {theme}. Voice: {tag}, clear singable pronunciation.\nSuno constraints: short lines of 6-9 syllables, simple rhymes, open vowels, no vulgarity. Exact structure (English brackets only, | stacking):\n[Verse 1 | {tag}]\n4 lines\n[Pre-Chorus | Build-up]\n2 lines\n[Chorus | Choir | Layered Harmonies]\n4 catchy lines\n[Verse 2 | {tag}]\n4 lines\n[Bridge | Stripped Back]\n2 intimate lines\n[Final Chorus | Choir | Anthemic]\n4 lines + 1 ad-lib line\n[Outro | Fade Out | Echo] or brutal [Outro | Cold End] or naked [Outro | A Cappella]\n2 lines\nEvoke only: gaze, breath, dance, light, night, skin, heartbeat. Every verse brings fresh images (no filler), flawless grammar, and the song ends on a proper closing line.';
  b.foreignWords = [];
  _fbCache[l] = b;
  return b;
}
function bankFor(l){ return BANKS[l] || fallbackBank(l); }
function BK(){ return bankFor(songLang()); }
function UI(){
  var b = BANKS[uiLang()] || BANK_EN;
  var u = b.ui;
  if (songLang() !== uiLang()) {
    var sb = bankFor(songLang());
    u = Object.assign({}, u, {
      sub: 'Copy-ready prompts for Suno: Style + Structure + singable ' + sb.meta.langName + ' lyrics, voice ' + sb.meta.voice + '.',
      vocal: 'Voice - sung in ' + sb.meta.langName + ' (' + sb.meta.voice + ')',
      lyricsBox: '3.Singable ' + sb.meta.langName + ' lyrics - paste into Suno lyrics (' + sb.meta.voice + ')'
    });
  }
  return u;
}
function SECL(){ var l = songLang(); return SEC[l] || SEC.en || SEC.fr; }
function M(name){ App.Music._m = App.Music._m || {}; return App.Music._m[name]; }
function SM(name, v){ App.Music._m = App.Music._m || {}; App.Music._m[name] = v; }
function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
function pickN(a, n){ var b = a.slice(); for (var i = b.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b.slice(0, n); }
// Styles avec leurs rythmes : chaque style listé impose sa couleur rythmique
// (liste Percussions) dès qu'on le choisit dans Genre — le rythme suit le style.
var GENRE_RHYTHM = {'moist tribal dance':'Polyrhythmic Afro-Latin percussion','humid tribal techno':'Polyrhythmic Afro-Latin percussion','tropical tribal house':'Quantized four-on-the-floor kick','sweaty percussion':'Syncopated congas and bongos','peak-time techno':'Heavy kick drum','futuristic techno':'Heavy kick drum','driving techno':'Heavy kick drum','high-tech minimal':'Heavy kick drum','EBM':'Heavy kick drum','dark electro':'Heavy kick drum','aggrotech':'Heavy kick drum','industrial dance':'Heavy kick drum','circuit house':'Punchy kick with dry claps','tribal circuit':'Punchy kick with dry claps','circuit party anthem':'Punchy kick with dry claps','energetic house':'Punchy kick with dry claps','afterhours':'Syncopated congas and bongos','late night electronic':'Syncopated congas and bongos','dark club':'Syncopated congas and bongos','deep midnight vibe':'Syncopated congas and bongos','vogue beat':'Rolling tribal drums','ballroom house':'Rolling tribal drums','vogue house':'Rolling tribal drums','runway music':'Rolling tribal drums','ha dance':'Rolling tribal drums','dark dungeon ambient':'Metallic industrial hits','medieval dark wave':'Metallic industrial hits','gothic dungeon':'Metallic industrial hits','dark gothic electro':'Metallic industrial hits','hard rock':'Driving rock backbeat','heavy hard rock':'Driving rock backbeat','80s hard rock':'Driving rock backbeat','hair metal':'Massive rock kit, double kick','tapping guitar solo':'Massive rock kit, double kick','glam metal':'Driving rock backbeat','neue deutsche härte':'Metallic industrial hits','german industrial metal':'Metallic industrial hits','heavy martial electro metal':'Metallic industrial hits','instrumental rock':'Massive rock kit, double kick','virtuoso guitar':'Massive rock kit, double kick','shred rock':'Massive rock kit, double kick','melodic hard rock':'Driving rock backbeat','guitar hero fusion':'Massive rock kit, double kick','classic hard rock':'Driving rock backbeat','blues hard rock':'Driving rock backbeat','driving rock riff':'Driving rock backbeat','australian hard rock':'Driving rock backbeat',
'Catchy modern pop':'Catchy four-on-the-floor pop beat',
'Driving electric rock':'Driving rock backbeat',
'Hard-hitting hip-hop':'Boom-bap hip-hop groove',
'Synthetic club EDM':'Synthetic EDM build-and-drop drums',
'Classic heavy metal':'Galloping double-kick metal drive',
'Improvised jazz combo':'Swinging jazz ride with brushes',
'Melancholic Delta blues':'Slow 12/8 blues shuffle',
'Groovy soul and funk':'Syncopated soul-funk groove',
'Laid-back roots reggae':'One-drop reggae groove',
'Full symphonic orchestra':'Orchestral percussion with timpani',
'Mozart-style classical':'Elegant Mozart orchestral pulse',
'Classic rock':'Driving rock backbeat',
'Punk rock':'Driving rock backbeat',
'Pop-punk':'Driving rock backbeat',
'Post-punk':'Driving rock backbeat',
'Garage rock':'Driving rock backbeat',
'Indie rock':'Driving rock backbeat',
'Alternative rock':'Driving rock backbeat',
'Psychedelic rock':'Driving rock backbeat',
'Progressive rock':'Driving rock backbeat',
'Math rock':'Driving rock backbeat',
'Post-rock':'Driving rock backbeat',
'Shoegaze':'Driving rock backbeat',
'Emo rock':'Driving rock backbeat',
'Screamo':'Driving rock backbeat',
'Surf rock':'Driving rock backbeat',
'Rockabilly':'Driving rock backbeat',
'Fifties rock\'n\'roll':'Driving rock backbeat',
'Blues rock':'Driving rock backbeat',
'Folk rock':'Driving rock backbeat',
'Arena rock':'Driving rock backbeat',
'Glam rock':'Driving rock backbeat',
'New wave':'Driving rock backbeat',
'Noise rock':'Driving rock backbeat',
'Space rock':'Driving rock backbeat',
'Krautrock':'Driving rock backbeat',
'Sludge rock':'Driving rock backbeat',
'J-rock':'Driving rock backbeat',
'Anatolian rock':'Driving rock backbeat',
'Southern rock':'Driving rock backbeat',
'Country rock':'Driving rock backbeat',
'Coldwave':'Driving rock backbeat',
'Gothic rock':'Driving rock backbeat',
'Dark wave':'Driving rock backbeat',
'Stoner rock':'Massive rock kit, double kick',
'Desert rock':'Massive rock kit, double kick',
'Dream pop':'Catchy four-on-the-floor pop beat',
'Synthpop':'Catchy four-on-the-floor pop beat',
'Electropop':'Catchy four-on-the-floor pop beat',
'Dance-pop':'Catchy four-on-the-floor pop beat',
'Chamber pop':'Catchy four-on-the-floor pop beat',
'Baroque pop':'Catchy four-on-the-floor pop beat',
'Indie pop':'Catchy four-on-the-floor pop beat',
'Bedroom pop':'Catchy four-on-the-floor pop beat',
'K-pop':'Catchy four-on-the-floor pop beat',
'J-pop':'Catchy four-on-the-floor pop beat',
'City pop':'Catchy four-on-the-floor pop beat',
'Hyperpop':'Catchy four-on-the-floor pop beat',
'Bubblegum pop':'Catchy four-on-the-floor pop beat',
'Teen pop':'Catchy four-on-the-floor pop beat',
'Pop rock':'Catchy four-on-the-floor pop beat',
'Power pop':'Catchy four-on-the-floor pop beat',
'Sophisti-pop':'Catchy four-on-the-floor pop beat',
'Art pop':'Catchy four-on-the-floor pop beat',
'Ambient pop':'Catchy four-on-the-floor pop beat',
'Future pop':'Catchy four-on-the-floor pop beat',
'French chanson pop':'Catchy four-on-the-floor pop beat',
'French variete':'Catchy four-on-the-floor pop beat',
'Trop pop':'Catchy four-on-the-floor pop beat',
'Country pop':'Catchy four-on-the-floor pop beat',
'Latin pop':'Catchy four-on-the-floor pop beat',
'C-pop':'Catchy four-on-the-floor pop beat',
'Thai pop':'Catchy four-on-the-floor pop beat',
'Arabic pop':'Catchy four-on-the-floor pop beat',
'Cartoon playful':'Catchy four-on-the-floor pop beat',
'Classic soul Motown':'Syncopated soul-funk groove',
'Neo-soul':'Syncopated soul-funk groove',
'Contemporary R&B':'Syncopated soul-funk groove',
'Quiet storm':'Syncopated soul-funk groove',
'Funk':'Syncopated soul-funk groove',
'P-funk':'Syncopated soul-funk groove',
'Funk rock':'Syncopated soul-funk groove',
'Boogie':'Syncopated soul-funk groove',
'Philly soul':'Syncopated soul-funk groove',
'Northern soul':'Syncopated soul-funk groove',
'Gospel soul':'Syncopated soul-funk groove',
'Doo-wop':'Syncopated soul-funk groove',
'Smooth jazz':'Syncopated soul-funk groove',
'French rap':'Syncopated soul-funk groove',
'Disco funk':'Quantized four-on-the-floor kick',
'Deep house':'Quantized four-on-the-floor kick',
'Tech house':'Quantized four-on-the-floor kick',
'Progressive house':'Quantized four-on-the-floor kick',
'UK garage':'Quantized four-on-the-floor kick',
'Vocal house':'Quantized four-on-the-floor kick',
'Uplifting trance':'Quantized four-on-the-floor kick',
'New beat':'Quantized four-on-the-floor kick',
'Chiptune 8-bit':'Quantized four-on-the-floor kick',
'Amapiano':'Quantized four-on-the-floor kick',
'Afro-house':'Quantized four-on-the-floor kick',
'Video game music':'Quantized four-on-the-floor kick',
'Minimal techno':'Heavy kick drum',
'Hard techno':'Heavy kick drum',
'Acid techno':'Heavy kick drum',
'Detroit techno':'Heavy kick drum',
'Melodic techno':'Heavy kick drum',
'Hardstyle':'Heavy kick drum',
'Hardcore gabber':'Heavy kick drum',
'Hardtekk':'Heavy kick drum',
'Psytrance':'Heavy kick drum',
'Cinematic trailer':'Heavy kick drum',
'Drum and bass':'Rolling drum\'n\'bass break',
'Jungle':'Rolling drum\'n\'bass break',
'Breakbeat':'Rolling drum\'n\'bass break',
'Dubstep':'Half-step dubstep wobble',
'Riddim':'Half-step dubstep wobble',
'Future bass':'Synthetic EDM build-and-drop drums',
'Trap EDM':'Synthetic EDM build-and-drop drums',
'Electro funk':'Synthetic EDM build-and-drop drums',
'Big beat':'Synthetic EDM build-and-drop drums',
'IDM':'Synthetic EDM build-and-drop drums',
'Glitch':'Synthetic EDM build-and-drop drums',
'Boom-bap':'Boom-bap hip-hop groove',
'Old-school hip-hop':'Boom-bap hip-hop groove',
'Cloud rap':'Boom-bap hip-hop groove',
'Mumble rap':'Boom-bap hip-hop groove',
'Conscious rap':'Boom-bap hip-hop groove',
'Gangsta rap':'Boom-bap hip-hop groove',
'Jazz rap':'Boom-bap hip-hop groove',
'Lo-fi hip-hop':'Boom-bap hip-hop groove',
'Grime':'Boom-bap hip-hop groove',
'Abstract hip-hop':'Boom-bap hip-hop groove',
'Alternative rap':'Boom-bap hip-hop groove',
'Downtempo':'Boom-bap hip-hop groove',
'Trip-hop':'Boom-bap hip-hop groove',
'Lo-fi chill':'Boom-bap hip-hop groove',
'Trap hip-hop':'Bouncy trap 808 groove',
'Drill':'Bouncy trap 808 groove',
'Crunk':'Bouncy trap 808 groove',
'Chopped and screwed':'Bouncy trap 808 groove',
'UK drill':'Bouncy trap 808 groove',
'Hyphy':'Bouncy trap 808 groove',
'Phonk rap':'Half-time phonk drive',
'Traditional jazz':'Swinging jazz ride with brushes',
'Dixieland':'Swinging jazz ride with brushes',
'Swing':'Swinging jazz ride with brushes',
'Big band':'Swinging jazz ride with brushes',
'Bebop':'Swinging jazz ride with brushes',
'Hard bop':'Swinging jazz ride with brushes',
'Cool jazz':'Swinging jazz ride with brushes',
'Modal jazz':'Swinging jazz ride with brushes',
'Free jazz':'Swinging jazz ride with brushes',
'Jazz fusion':'Swinging jazz ride with brushes',
'Acid jazz':'Swinging jazz ride with brushes',
'Nu-jazz':'Swinging jazz ride with brushes',
'Jazz manouche':'Swinging jazz ride with brushes',
'Ragtime':'Swinging jazz ride with brushes',
'Stride piano':'Swinging jazz ride with brushes',
'Bossa nova':'Brushed bossa-nova sway',
'Latin jazz':'Polyrhythmic Afro-Latin percussion',
'Salsa':'Polyrhythmic Afro-Latin percussion',
'Merengue':'Polyrhythmic Afro-Latin percussion',
'Bachata':'Polyrhythmic Afro-Latin percussion',
'Cumbia':'Polyrhythmic Afro-Latin percussion',
'Reggaeton':'Polyrhythmic Afro-Latin percussion',
'Latin trap':'Polyrhythmic Afro-Latin percussion',
'Tango':'Polyrhythmic Afro-Latin percussion',
'Bolero':'Polyrhythmic Afro-Latin percussion',
'Rumba':'Polyrhythmic Afro-Latin percussion',
'Mambo':'Polyrhythmic Afro-Latin percussion',
'Cha-cha-cha':'Polyrhythmic Afro-Latin percussion',
'Samba':'Polyrhythmic Afro-Latin percussion',
'MPB':'Polyrhythmic Afro-Latin percussion',
'Forro':'Polyrhythmic Afro-Latin percussion',
'Norteno':'Polyrhythmic Afro-Latin percussion',
'Mariachi':'Polyrhythmic Afro-Latin percussion',
'Banda':'Polyrhythmic Afro-Latin percussion',
'Flamenco':'Polyrhythmic Afro-Latin percussion',
'Rumba flamenca':'Polyrhythmic Afro-Latin percussion',
'Soca':'Polyrhythmic Afro-Latin percussion',
'Calypso':'Polyrhythmic Afro-Latin percussion',
'Kompa':'Polyrhythmic Afro-Latin percussion',
'Zouk':'Polyrhythmic Afro-Latin percussion',
'Bollywood playback':'Polyrhythmic Afro-Latin percussion',
'Chicago blues':'Slow 12/8 blues shuffle',
'Texas blues':'Slow 12/8 blues shuffle',
'Piedmont blues':'Slow 12/8 blues shuffle',
'Jump blues':'Slow 12/8 blues shuffle',
'Electric blues':'Slow 12/8 blues shuffle',
'Swamp blues':'Slow 12/8 blues shuffle',
'Gospel blues':'Slow 12/8 blues shuffle',
'Hill country blues':'Slow 12/8 blues shuffle',
'Classic country':'Campfire folk strum kit',
'Honky tonk':'Campfire folk strum kit',
'Outlaw country':'Campfire folk strum kit',
'Bluegrass':'Campfire folk strum kit',
'Newgrass':'Campfire folk strum kit',
'Americana':'Campfire folk strum kit',
'Alt-country':'Campfire folk strum kit',
'Western swing':'Campfire folk strum kit',
'Cajun':'Campfire folk strum kit',
'Zydeco':'Campfire folk strum kit',
'Nashville sound':'Campfire folk strum kit',
'Traditional folk':'Campfire folk strum kit',
'Indie folk':'Campfire folk strum kit',
'Freak folk':'Campfire folk strum kit',
'Psychedelic folk':'Campfire folk strum kit',
'French chanson a texte':'Campfire folk strum kit',
'Singer-songwriter':'Campfire folk strum kit',
'Celtic folk':'Campfire folk strum kit',
'Irish folk':'Campfire folk strum kit',
'Nordic folk':'Campfire folk strum kit',
'Medieval folk':'Campfire folk strum kit',
'Bardcore':'Campfire folk strum kit',
'Sea shanty':'Campfire folk strum kit',
'Intimate acoustic':'Campfire folk strum kit',
'Dancehall':'One-drop reggae groove',
'Dub':'One-drop reggae groove',
'Ska':'One-drop reggae groove',
'Rocksteady':'One-drop reggae groove',
'Reggae fusion':'One-drop reggae groove',
'Ragga':'One-drop reggae groove',
'Afrobeat':'Interlocking afrobeat groove',
'Afropop':'Interlocking afrobeat groove',
'Highlife':'Interlocking afrobeat groove',
'Juju':'Interlocking afrobeat groove',
'Fuji':'Interlocking afrobeat groove',
'Coupe-decale':'Interlocking afrobeat groove',
'Ndombolo':'Interlocking afrobeat groove',
'Soukous':'Interlocking afrobeat groove',
'Kizomba':'Interlocking afrobeat groove',
'Kuduro':'Interlocking afrobeat groove',
'Mbalax':'Interlocking afrobeat groove',
'Gamelan':'Interlocking afrobeat groove',
'Qawwali':'Interlocking afrobeat groove',
'Sufi':'Interlocking afrobeat groove',
'Gnawa':'Syncopated congas and bongos',
'Rai':'Syncopated congas and bongos',
'Chaabi':'Syncopated congas and bongos',
'Arabic maqam':'Syncopated congas and bongos',
'Gqom':'Rolling tribal drums',
'Thrash metal':'Galloping double-kick metal drive',
'Melodic death metal':'Galloping double-kick metal drive',
'Atmospheric black metal':'Galloping double-kick metal drive',
'Symphonic metal':'Galloping double-kick metal drive',
'Power metal':'Galloping double-kick metal drive',
'Speed metal':'Galloping double-kick metal drive',
'Doom metal':'Galloping double-kick metal drive',
'Stoner doom metal':'Galloping double-kick metal drive',
'Sludge metal':'Galloping double-kick metal drive',
'Gothic metal':'Galloping double-kick metal drive',
'Nu metal':'Galloping double-kick metal drive',
'Metalcore':'Galloping double-kick metal drive',
'Mathcore':'Galloping double-kick metal drive',
'Djent':'Galloping double-kick metal drive',
'Progressive metal':'Galloping double-kick metal drive',
'Folk metal':'Galloping double-kick metal drive',
'Viking metal':'Galloping double-kick metal drive',
'Groove metal':'Galloping double-kick metal drive',
'Alternative metal':'Galloping double-kick metal drive',
'Post-metal':'Galloping double-kick metal drive',
'Pirate metal':'Galloping double-kick metal drive',
'Funk metal':'Galloping double-kick metal drive',
'Rap metal':'Galloping double-kick metal drive',
'Crystal metal':'Galloping double-kick metal drive',
'Epic orchestral metal':'Galloping double-kick metal drive',
'Black metal':'Galloping double-kick metal drive',
'Death metal':'Galloping double-kick metal drive',
'Grindcore':'Blast beats and trashy cymbals',
'Brutal death metal':'Blast beats and trashy cymbals',
'Deathcore':'Blast beats and trashy cymbals',
'Industrial metal':'Metallic industrial hits',
'Industrial electro':'Metallic industrial hits',
'Electro-swing':'Punchy kick with dry claps',
'Moombahton':'Jersey club bounce',
'Jersey club':'Jersey club bounce',
'Synthwave':'Gated synthwave drums',
'Retrowave':'Gated synthwave drums',
'Outrun':'Gated synthwave drums',
'Vaporwave':'Gated synthwave drums',
'Baroque':'Orchestral percussion with timpani',
'Romantic classical':'Orchestral percussion with timpani',
'Impressionist classical':'Orchestral percussion with timpani',
'Contemporary classical':'Orchestral percussion with timpani',
'String orchestra':'Orchestral percussion with timpani',
'Opera':'Orchestral percussion with timpani',
'Choral sacred':'Orchestral percussion with timpani',
'Requiem':'Orchestral percussion with timpani',
'Ballet':'Orchestral percussion with timpani',
'Military march':'Orchestral percussion with timpani',
'Fanfare brass':'Orchestral percussion with timpani',
'National anthem':'Orchestral percussion with timpani',
'Christmas song':'Orchestral percussion with timpani',
'Wedding music':'Orchestral percussion with timpani',
'Epic cinematic orchestral':'Orchestral percussion with timpani',
'Epic hybrid trailer':'Orchestral percussion with timpani',
'Film score':'Orchestral percussion with timpani',
'Chamber music':'Solo piano with string swells',
'Solo piano classical':'Solo piano with string swells',
'Waltz':'Lilting 3/4 waltz pulse',
'Circus cabaret':'Lilting 3/4 waltz pulse',
'Burlesque':'Lilting 3/4 waltz pulse',
'alt rock':'Driving rock backbeat',
'big room EDM':'Synthetic EDM build-and-drop drums',
'modern R and B':'Syncopated soul-funk groove',
'chillwave':'Half-time phonk drive',
'witch house':'Half-time phonk drive',
'electro-pop':'Punchy kick with dry claps',
'gospel choir':'Syncopated soul-funk groove',
'gregorian chant fusion':'Lilting 3/4 waltz pulse',
'eurodance':'Quantized four-on-the-floor kick',
'neue deutsche welle':'Punchy kick with dry claps',
'goa trance':'Rolling tribal drums',
'austropop':'Driving rock backbeat',
'eurodisco':'Quantized four-on-the-floor kick',
'italo disco':'Quantized four-on-the-floor kick',
'italo dance':'Quantized four-on-the-floor kick',
'oktoberfest oompah':'Lilting 3/4 waltz pulse',
'wiesn schlager':'Lilting 3/4 waltz pulse',
'europop':'Catchy four-on-the-floor pop beat',
'reggae-pop':'One-drop reggae groove',
'french house':'Quantized four-on-the-floor kick',
'dansktop':'Catchy four-on-the-floor pop beat',
'psychobilly':'Driving rock backbeat',
'darkwave':'Gated synthwave drums',
'yacht rock':'Driving rock backbeat',
'folktronica':'Half-time phonk drive',
'darksynth':'Gated synthwave drums',
'spacesynth':'Gated synthwave drums',
'cold wave':'Metallic industrial hits',
'electroclash':'Punchy kick with dry claps',
'hi-NRG':'Quantized four-on-the-floor kick',
'madchester':'Driving rock backbeat',
'britpop':'Catchy four-on-the-floor pop beat',
'acid house':'Quantized four-on-the-floor kick',
'alpine folk':'Campfire folk strum kit',
'spaghetti western':'Driving rock backbeat',
'anatolian psych':'Driving rock backbeat',
'klezmer':'Campfire folk strum kit',
'cantopop':'Catchy four-on-the-floor pop beat',
'dansband':'Catchy four-on-the-floor pop beat',
'bubblegum dance':'Catchy four-on-the-floor pop beat',
'happy hardcore':'Heavy kick drum',
'bhangra':'Rolling tribal drums',
'fado':'Lilting 3/4 waltz pulse',
'dungeon synth':'Punchy kick with dry claps',
'chicago house':'Quantized four-on-the-floor kick',
'lovers rock':'One-drop reggae groove',
'trot':'Catchy four-on-the-floor pop beat',
'spoken word':'Boom-bap hip-hop groove',
'footwork':'Heavy kick drum',
'tavern folk':'Campfire folk strum kit',
'protest folk':'Campfire folk strum kit',
'celtic punk':'Driving rock backbeat',
'island folk':'Campfire folk strum kit',
'stadium rock':'Driving rock backbeat',
'eurotrance':'Synthetic EDM build-and-drop drums',
'chillout':'Half-time phonk drive',
'prog-rock':'Driving rock backbeat',
'synth-pop':'Punchy kick with dry claps',
'country folk':'Campfire folk strum kit',
'acid rock':'Driving rock backbeat',
'hardcore punk':'Massive rock kit, double kick',
'pub rock':'Driving rock backbeat',
'slowcore':'Half-time phonk drive',
'west coast hip hop':'Boom-bap hip-hop groove',
'east coast hip hop':'Boom-bap hip-hop groove',
'horrorcore':'Boom-bap hip-hop groove',
'pop rap':'Boom-bap hip-hop groove',
'alternative hip hop':'Boom-bap hip-hop groove',
'wagnerian rock':'Orchestral percussion with timpani',
'romantic orchestral':'Elegant Mozart orchestral pulse',
'cowpunk':'Driving rock backbeat',
'sunshine pop':'Catchy four-on-the-floor pop beat',
'merseybeat':'Driving rock backbeat',
'andean folk':'Campfire folk strum kit',
'indietronica':'Half-time phonk drive',
'pre-war country blues':'Slow 12/8 blues shuffle',
'animated-film musical showstopper':'Orchestral percussion with timpani',
'melodic rap':'Boom-bap hip-hop groove',
'lyrical rap':'Boom-bap hip-hop groove',
'tropical house':'Quantized four-on-the-floor kick',
'vocal jazz':'Swinging jazz ride with brushes',
'soul jazz':'Swinging jazz ride with brushes',
'alt rnb':'Half-time phonk drive',
'classic rnb':'Syncopated soul-funk groove',
'trap soul':'Bouncy trap 808 groove',
'modern country':'Driving rock backbeat',
'folk country':'Campfire folk strum kit',
'folk acoustic':'Campfire folk strum kit',
'anti-folk':'Campfire folk strum kit',
'indie acoustic':'Campfire folk strum kit',
'lofi indie':'Half-time phonk drive',
'melodic dubstep':'Half-step dubstep wobble',
'Trap':'Bouncy trap 808 groove',
'Dark cabaret':'Lilting 3/4 waltz pulse',
'Orchestral emo':'Orchestral percussion with timpani',
'Glitch-hop':'Boom-bap hip-hop groove',
'Country western':'Campfire folk strum kit',
'Jazz standard':'Swinging jazz ride with brushes',
'Disco':'Catchy four-on-the-floor pop beat',
'Industrial':'Metallic industrial hits',
'Ambient':'Solo piano with string swells',
'Trap metal':'Galloping double-kick metal drive',
'Aggressive battle rap':'Boom-bap hip-hop groove',
'Storytelling rap':'Boom-bap hip-hop groove',
'New-age trap':'Bouncy trap 808 groove',
'Old school boom bap':'Boom-bap hip-hop groove',
'R&B rap hybrid':'Syncopated soul-funk groove',
'Melodic trap':'Bouncy trap 808 groove',
'Phonk':'Half-time phonk drive',
};
function applyGenreRhythm(){ var g = val('mzGenre'); var p = GENRE_RHYTHM[g]; if(p){ var el = gi('mzPerc'); if(el){ for(var i=0;i<el.options.length;i++){ if(el.options[i].text === p){ el.selectedIndex = i; break; } } } } var fk = null; try{ fk = familyFor(g); }catch(e){} if(fk && SUNO_FAM[fk]){ var F = SUNO_FAM[fk]; var ce = gi('mzChords'); if(ce){ for(var j=0;j<ce.options.length;j++){ if(ce.options[j].text === F.chords){ ce.selectedIndex = j; break; } } } var be = gi('mzBpm'); if(be){ var bv = Math.max(parseInt(be.min || '60', 10) || 60, Math.min(parseInt(be.max || '180', 10) || 180, F.bpm)); be.value = bv; var bvl = gi('mzBpmVal'); if (bvl) bvl.textContent = bv + ' \u00b7 ' + tempoName(bv); } } return !!(p || fk); }
function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
async function clip(t){ try{ await navigator.clipboard.writeText(t); return; }catch(e){} try{ var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }catch(e){} }
function fillSel(id, arr){ var el = gi(id); if (!el) return 0; var keep = -1; try{ keep = el.selectedIndex; }catch(e){} el.innerHTML = arr.map(function(v){ return "<option>" + esc(v) + "</option>"; }).join(''); if (keep >= 0 && keep < arr.length){ try{ el.selectedIndex = keep; }catch(e){} } return arr.length; }
function val(id){ var el = gi(id); return el ? el.value : ''; }
function setVal(id, v){ var el = gi(id); if (el) el.value = v; }
function buildPanel(){
if (gi('musicModal')) return;
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
var d = document.createElement('div'); d.id = 'musicModal'; d.hidden = true;
d.innerHTML = "<div class='mz-wrap'>"
 + "<div class='mz-row' style='justify-content:space-between'><h1 id='mzTitle'></h1><button class='mz-ghost' id='mzClose'>\u2715</button></div>"
 + "<div class='mz-sub' id='mzSub'></div><div class='mz-tip' id='mzSunoGuide' style='margin:10px 0 2px;font-size:12.5px;line-height:1.55;color:#c7bfff;background:#151126;border:1px solid #2d2456;border-radius:10px;padding:10px 12px'>🎓 Sofia est devenue une pro de la génération de musiques sur Suno.ai grâce à son apprentissage : elle applique déjà cette formule, suis-la telle quelle.<br>Suno comprend mieux les prompts <b>en anglais</b>, en tags séparés par des virgules.<br>Formule : <b>[Époque / Genre] + [Sous-genre] + [Instruments] + [Voix] + [Ambiance]</b><br>Ex : <i>1980s dark synthpop, analog synths, gated drums, female falsetto vocals, atmospheric, melancholic</i><br>Instruments <b>en anglais</b> : <b>Style</b> = palette g\u00e9n\u00e9rale \u00b7 <b>[crochets]</b> dans les paroles = moment pr\u00e9cis (<i>[Guitar Solo]</i>). Introuvable en anglais ? \u00e9quivalent connu (<i>cornemuse \u2192 bagpipes \u00b7 irgye \u2192 erhu / kora / oud \u00b7 bigoudis \u2192 toy piano / kazoo</i>).</div><div class='mz-presets' id='mzPresets'></div><div class='mz-grid' id='mzGrid'></div>"
 + "<div class='mz-row'><button class='mz-big' id='mzGen'></button><button class='mz-ghost' id='mzRand'></button><button class='mz-ghost' id='mzCopyBoth'></button><button class='mz-ghost' id='mzCopyAll'></button><button class='mz-big' id='mzCopyPack'></button><button class='mz-ghost' id='mzExport'></button></div>"
 + "<div class='mz-out'><div class='mz-card'><label id='mzLStyle'></label><pre id='mzStyle'></pre><div class='mz-row'><span class='mz-count' id='mzChars'></span><button class='mz-ghost' id='mzCopyStyle'></button></div></div>"
 + "<div class='mz-card'><label id='mzLStruct'></label><pre id='mzStruct'></pre><div class='mz-row'><button class='mz-ghost' id='mzCopyStruct'></button></div></div></div>"
 + "<div class='mz-card' style='margin-top:12px;border-color:#ff2e9a'><label id='mzLLyrics'></label>"
 + "<pre id='mzLyrics' style='min-height:280px'></pre>"
 + "<div class='mz-row'><button class='mz-ghost' id='mzAiLyrics'></button><button class='mz-ghost' id='mzEdit'></button><button class='mz-ghost' id='mzWrap'></button><button class='mz-ghost' id='mzCopyLyrics'></button></div>"
 + "<div class='mz-kv' id='mzCheck' style='font-size:12px;margin-top:8px'></div><div class='mz-tip' id='mzTipVoice' style='margin-top:8px'></div></div>"
 + "<div class='mz-card' style='margin-top:12px;border-color:#4a3aa3'><label>🎺 Instruments Suno (tags anglais)</label>"
  + "<div class='mz-sub' style='font-size:12.5px'>Clic = copier. Colle dans <b>Style</b> (palette g\u00e9n\u00e9rale) ou entre <b>[crochets]</b> dans les paroles (moment pr\u00e9cis).</div>"
  + "<div class='mz-presets' id='mzInstruChips'></div>"
  + "<div class='mz-row'><span class='mz-count'>Moments \u2192 paroles :</span><button class='mz-ghost' data-brk='[Bagpipe Solo]'>+[Bagpipe Solo]</button><button class='mz-ghost' data-brk='[Accordion Interlude]'>+[Accordion Interlude]</button><button class='mz-ghost' data-brk='[Guitar Solo]'>+[Guitar Solo]</button><button class='mz-ghost' data-brk='[Trumpet Solo]'>+[Trumpet Solo]</button><button class='mz-ghost' data-brk='[Sax Solo]'>+[Sax Solo]</button><button class='mz-ghost' data-brk='[Violin Solo]'>+[Violin Solo]</button><button class='mz-ghost' data-brk='[Piano Solo]'>+[Piano Solo]</button><button class='mz-ghost' data-brk='[Flute Solo]'>+[Flute Solo]</button><button class='mz-ghost' data-brk='[Sitar Solo]'>+[Sitar Solo]</button><button class='mz-ghost' data-brk='[Erhu Solo]'>+[Erhu Solo]</button><button class='mz-ghost' data-brk='[Kora Solo]'>+[Kora Solo]</button><button class='mz-ghost' data-brk='[Drum Break]'>+[Drum Break]</button></div></div>"
  + "<div class='mz-card' style='margin-top:12px;border-color:#4a3aa3'><label>🥁 Batterie Suno (drums)</label>"
  + "<div class='mz-sub' style='font-size:12.5px'>La batterie donne <b>structure + tempo + genre</b>. Clic = copier vers Suno. Trop pr\u00e9sente ? <i>mellow drums, minimal percussion</i> \u00b7 Pas assez ? <i>heavy drum focus, dominant percussion</i>.</div>"
  + "<div class='mz-sub' style='font-size:12.5px'>Exemples pr\u00eats : <button class='mz-ghost' data-style='hard rock, driving acoustic drums, heavy snare, punchy kick, fast tempo'>Rock puissant</button> <button class='mz-ghost' data-style='synthwave, gated 80s drums, punchy 707 snare, electronic percussion'>Synthwave</button> <button class='mz-ghost' data-style='lo-fi hip hop, dusty drum breaks, slow tempo, 808 sub bass'>Lo-Fi</button> <button class='mz-ghost' data-style='trap, 808 drums, fast hi-hats, heavy drum focus'>Trap</button></div>"
  + "<div class='mz-presets' id='mzDrumChips'></div>"
  + "<div class='mz-row'><span class='mz-count'>Moments \u2192 paroles :</span><button class='mz-ghost' data-brk='[Drum Drop]'>+[Drum Drop]</button><button class='mz-ghost' data-brk='[Drum Solo]'>+[Drum Solo]</button><button class='mz-ghost' data-brk='[Build-up]'>+[Build-up]</button></div></div>"
  + "<div class='mz-card' style='margin-top:12px;border-color:#ff2e9a'><label>🥁 Laboratoire Rythme — la surprise technique</label>"
  + "<div class='mz-sub' style='font-size:12.5px'>Sofia maîtrise le rythme : mesures impaires, euclidien, polyrythmie, swing. <b>Écoute</b> le groove, puis <b>Applique à Suno</b> (Style + Structure en anglais).</div>"
  + "<div class='mz-grid' style='grid-template-columns:1fr 1fr;gap:8px;margin:10px 0'>"
  + "<div><label style='font-size:11px;color:#ff8ab5'>Mesure</label><select id='mzMeter'></select></div>"
  + "<div><label style='font-size:11px;color:#ff8ab5'>Pattern</label><select id='mzPattern'></select></div>"
  + "<div><label style='font-size:11px;color:#ff8ab5'>Feel</label><select id='mzFeel'></select></div>"
  + "<div><label style='font-size:11px;color:#ff8ab5'>Polyrythmie</label><select id='mzPoly'></select></div>"
  + "</div>"
  + "<div class='mz-row' id='mzEuclidRow'><span class='mz-count'>Euclidien K</span><input type='range' id='mzEuclidK' min='2' max='13' value='5' style='flex:1'><span class='mz-count' id='mzEuclidKVal'>5</span></div>"
  + "<div class='mz-kv' id='mzPatternView' style='font-family:monospace;font-size:12px;line-height:1.7;background:#000;border-radius:10px;padding:10px;min-height:64px'></div>"
  + "<div class='mz-row'><button class='mz-big' id='mzPlayBtn'>▶ Écouter</button><button class='mz-ghost' id='mzRhythmApply'>Appliquer à Suno</button><button class='mz-ghost' id='mzRhythmDice'>🎲 Surprends-moi</button></div>"
  + "<div class='mz-sub' id='mzRhythmStatus' style='font-size:12px'></div></div>"
  + "<div class='mz-card' style='margin-top:12px;border-color:#4a3aa3'><label>🎤 Voix Suno (formations + langue)</label>"
  + "<div class='mz-sub' style='font-size:12.5px'>Formation <b>en anglais</b> \u2192 champ <b>Style</b>. Paroles chant\u00e9es dans la <b>langue du chant : <span id='mzVoiceLang'></span></b> (s\u00e9lecteur en haut). <b>[crochets]</b> dans les paroles = qui chante la section.</div>"
  + "<div class='mz-presets' id='mzVoiceChips'></div>"
  + "<div class='mz-row'><span class='mz-count'>Qui chante \u2192 paroles :</span><button class='mz-ghost' data-brk='[Male Vocal]'>+[Male Vocal]</button><button class='mz-ghost' data-brk='[Female Vocal]'>+[Female Vocal]</button><button class='mz-ghost' data-brk='[Duet]'>+[Duet]</button><button class='mz-ghost' data-brk='[Choir]'>+[Choir]</button><button class='mz-ghost' data-brk='[Whisper]'>+[Whisper]</button></div></div>"
  + "<div class='mz-card' style='margin-top:12px;border-color:#ff2e9a'><label>📖 Lexique Suno — méta-tags [crochets] (anglais obligatoire)</label>"
  + "<div class='mz-sub' style='font-size:12.5px'>Suno ne comprend que l'anglais entre <b>[crochets]</b>. Combine avec <b>|</b> : <i>[Verse 1 | Spoken Word | Soft Piano]</i> · <i>[Chorus | Anthemic | Layered Harmonies | Big Drop]</i>. Clic = copier.</div>"
  + "<div class='mz-presets' id='mzLexiconChips'></div>"
  + "<div class='mz-row'><span class='mz-count'>Stacking \u2192 paroles :</span><button class='mz-ghost' data-brk='[Verse 1 | Male Vocal]'>+[Verse 1 | Male Vocal]</button><button class='mz-ghost' data-brk='[Chorus | Choir | Layered Harmonies]'>+[Chorus | Choir]</button><button class='mz-ghost' data-brk='[Bridge | Stripped Back]'>+[Bridge | Stripped Back]</button><button class='mz-ghost' data-brk='[Outro | Fade Out]'>+[Outro | Fade Out]</button></div></div>"
  + "<div class='mz-card' style='margin-top:12px'><label>🎨 Cover</label><div class='mz-row'><select id='mzCoverStyle' style='flex:1;min-width:0'></select><button class='mz-big' id='mzCoverGo'>🎨 Cover</button><button class='mz-ghost' id='mzCoverCopy'>Prompt</button></div><div class='mz-sub' id='mzCoverStatus' style='font-size:12px'></div><div id='mzCoverOut' style='margin-top:8px'></div></div>" + "<div class='mz-card' style='margin-top:12px'><label id='mzLGallery'></label><div class='mz-sub' style='font-size:13px' id='mzGalleryNote'></div>"
+ "<div id='mzGalleryCtn' style='margin-top:8px'></div><div class='mz-kv' id='mzPubStatus' style='font-size:12px;margin-top:8px'></div></div>"
 + "<div class='mz-card' style='margin-top:12px'><label id='mzLNotes'></label><div class='mz-kv' id='mzNotes'></div><div class='mz-tip' id='mzTipSuno' style='margin-top:8px'></div></div>"
 + "<div class='mz-card' style='margin-top:12px'><label id='mzLHist'></label><div class='mz-row'><button class='mz-ghost' id='mzSaveHist'></button><select id='mzHist' style='max-width:320px;flex:1;min-width:0'></select><button class='mz-ghost' id='mzDelHist'></button></div><div class='mz-kv' style='font-size:12px' id='mzHistNote'></div></div>"
 + "<div class='mz-card' style='margin-top:12px;border-color:#ff2e9a'><label id='mzLOneSong'></label><div class='mz-sub' style='font-size:13px' id='mzOneSongNote'></div>"
 + "<div class='mz-presets' id='mzThemeChips' style='margin-top:10px'></div>"
  + "<div class='mz-row'><input type='text' id='mzThemeFree' placeholder='Mon th\u00e8me personnalis\u00e9\u2026 (remplace le th\u00e8me choisi)' style='flex:2;min-width:0'><select id='mzRhyme' style='flex:1;min-width:0'><option value='rhyme'></option><option value='free'></option></select><button class='mz-ghost' id='mzThemeSave' style='flex:0 0 auto' title='Sauvegarder mon th\u00e8me'></button></div>"
  + "<div class='mz-presets' id='mzMyThemes' style='margin-top:8px'></div>"
  + "<textarea id='mzStoryFree' rows='3' placeholder='Ton histoire pour Sofia\u2026 ex. Halloween : une sorci\u00e8re perd son balai dans un cimeti\u00e8re, un enfant la suit avec une lanterne, etc.' style='margin-top:8px'></textarea>"
  + "<div class='mz-sub' id='mzRhymeHint' style='font-size:12px'>\u00c9cris ton th\u00e8me + ton histoire, puis \u00ab Sofia \u00e9crit \u00bb : les paroles IA suivent tes indications. Le choix rimes / vers libres pilote la forme. Tes paroles restent toujours utilisables telles quelles.</div>"
 + "<div class='mz-row'><button class='mz-big' id='mzStoryRhyme'></button><button class='mz-big' id='mzStoryLibre'></button></div>" + "<div class='mz-row'><label id='mzLEnding' style='align-self:center;font-size:12px;color:#b9aef5;white-space:nowrap'></label><select id='mzEnding' style='flex:2;min-width:0'><option value='auto'></option><option value='happy'></option><option value='tragic'></option></select></div>" + "<div class='mz-row'><button class='mz-big' id='mzModeAi'></button><button class='mz-ghost' id='mzModeMine'></button></div>"
 + "<label id='mzLCustom2'></label><textarea id='mzCustom' rows='8'></textarea>"
 + "<div class='mz-row'><button class='mz-big' id='mzWriteLyrics'></button><button class='mz-big' id='mzCompose'></button><button class='mz-big' id='mzTotal'></button><button class='mz-ghost' id='mzPublish'></button></div></div>"
 + "<div class='mz-card' style='margin-top:12px'><label id='mzLListen'></label><div class='mz-sub' style='font-size:13px' id='mzListenNote'></div>"
 + "<div id='mzListenCtn' style='margin-top:8px'></div><div class='mz-sub' style='font-size:12px;margin-top:8px'>Invitation Suno : <a href='https://suno.com/invite/@1813watt' target='_blank' rel='noopener'>suno.com/invite/@1813watt</a></div></div>"
 + "<div class='mz-sub' style='margin-top:12px;font-size:12px' id='mzFoot'></div></div>";
document.body.appendChild(d);
App.Music.buildGrid();
gi('mzClose').onclick = function(){ App.Music.close(); };
d.addEventListener('click', function(e){ if (e.target === d) App.Music.close(); });
gi('mzGen').onclick = function(){ App.Music.generate(); };
gi('mzRand').onclick = function(){ App.Music.surprise(); };
gi('mzCopyBoth').onclick = function(){ clip('STYLE:\n' + gi('mzStyle').textContent + '\n\nSTRUCTURE:\n' + gi('mzStruct').textContent); };
gi('mzCopyAll').onclick = function(){ App.Music.copyAll(); };
var _cp = gi('mzCopyPack'); if (_cp){ _cp.textContent = '\uD83D\uDCE6 Pack Suno complet'; _cp.onclick = function(){ App.Music.copyPack(); }; }
gi('mzExport').onclick = function(){ App.Music.exportTxt(); };
gi('mzCopyStyle').onclick = function(){ clip(gi('mzStyle').textContent); };
gi('mzCopyStruct').onclick = function(){ clip(gi('mzStruct').textContent); };
gi('mzCopyLyrics').onclick = function(){ clip(gi('mzLyrics').textContent); };
gi('mzCoverGo').onclick = function(){ App.Music.coverGo(); };
gi('mzCoverCopy').onclick = function(){ try{ clip(App.Music.coverPromptText().prompt); }catch(e){} };
gi('mzAiLyrics').onclick = function(){ App.Music.aiLyrics(); };
gi('mzEdit').onclick = function(){ App.Music.editLyrics(); };
gi('mzWrap').onclick = function(){ App.Music.wrapLyrics(); };
gi('mzCustom').oninput = function(){ try{ SM('lyrSrc', 'mine'); }catch(e){} App.Music.setLyricMode('mine', true); App.Music.refreshLyrics(false); };
 try{ renderInstruChips(); }catch(e){} try{ renderDrumChips(); }catch(e){} try{ renderVoiceChips(); }catch(e){} try{ renderLexiconChips(); }catch(e){} try{ renderRhythmLab(); }catch(e){} try{ wireBrkButtons(); }catch(e){} try{ stopRhythmPlay(); }catch(e){}
var _td = gi('mzTitreDice'); if (_td) _td.onclick = function(){ setVal('mzTitre', pick(BK().titles)); };
  var _ts = gi('mzThemeSave'); if (_ts){ _ts.textContent = '+ Mon th\u00e8me'; _ts.onclick = function(){ var v = ''; try{ v = val('mzThemeFree').trim(); }catch(e){ v = ''; } if (!v) return; App.Music.saveMyTheme(v); }; }
gi('mzSaveHist').onclick = function(){ App.Music.saveHist(); };
gi('mzHist').onchange = function(){ App.Music.loadHist(); };
gi('mzDelHist').onclick = function(){ App.Music.delHist(); };
gi('mzModeAi').onclick = function(){ App.Music.writeWithSofia(); };
gi('mzModeMine').onclick = function(){ App.Music.setLyricMode('mine'); };
gi('mzWriteLyrics').onclick = function(){ App.Music.aiLyrics(); };
gi('mzCompose').onclick = function(){ App.Music.composeSong(); };
gi('mzStoryRhyme').onclick = function(){ App.Music.storyRhyme(); };
gi('mzStoryLibre').onclick = function(){ App.Music.storyFree(); };
gi('mzTotal').onclick = function(){ App.Music.totalSong(); };
gi('mzPublish').onclick = function(){ App.Music.publishSong(); };
}
var VOICE_GROUPS = [['Homme', ['male vocal','male singer','deep male voice']], ['Femme', ['female vocal','female singer','soaring female voice']], ['Duo', ['duet','male and female duet','alternating male and female vocals']], ['Chorale / Ch\u0153ur', ['choir','choral harmonies','gospel choir','gregorian choir','backing vocals','male lead vocal with female choir','female lead vocal','male backing chorus']], ['Techniques & Timbres', ['falsetto','belting','growl','screamo','operatic','crooning','rap flow','autotune','whisper','raw vocal','raspy vocal','intimate vocals','soaring vocals','powerful vocals']]];
function renderVoiceChips(){ var box = gi('mzVoiceChips'); if (box && !box.children.length){ VOICE_GROUPS.forEach(function(gr){ var lb = document.createElement('span'); lb.textContent = gr[0]; lb.style.cssText = 'width:100%;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#8f86c9;margin:6px 0 -2px'; box.appendChild(lb); gr[1].forEach(function(tag){ var b = document.createElement('button'); b.type = 'button'; b.textContent = tag; b.title = 'Cliquer pour copier : ' + tag; b.onclick = function(){ try{ clip(tag); }catch(e){} var o = b.textContent; b.textContent = '\u2713 ' + tag; setTimeout(function(){ b.textContent = o; }, 900); }; box.appendChild(b); }); }); } try{ updateVoiceLang(); }catch(e){} }
function updateVoiceLang(){ var el = document.getElementById('mzVoiceLang'); if(!el) return; var m = null; try{ m = BK().meta; }catch(e){} el.textContent = m ? (m.langName + ' (' + m.voice + ')') : ''; }
var DRUM_GROUPS = [['Acoustique & Rock / Metal', ['acoustic drums','driving drums','heavy punchy drums','gated snare','80s drums','blast beats','double bass pedal','brushed drums','punchy kick','heavy snare','driving acoustic drums']], ['\u00c9lectro & Urbaine', ['808 drums','909 drums','breakbeat','amen break','trap beat','fast hi-hats','punchy 707 snare','electronic percussion','dusty drum breaks','808 sub bass']], ['Monde', ['tribal percussion','latin percussion','taiko drums','djembe','tabla','congas','hand claps','finger snaps']], ['Dosage mix', ['mellow drums','minimal percussion','heavy drum focus','dominant percussion']]];
function renderDrumChips(){ var box = gi('mzDrumChips'); if (box && !box.children.length){ DRUM_GROUPS.forEach(function(gr){ var lb = document.createElement('span'); lb.textContent = gr[0]; lb.style.cssText = 'width:100%;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#8f86c9;margin:6px 0 -2px'; box.appendChild(lb); gr[1].forEach(function(tag){ var b = document.createElement('button'); b.type = 'button'; b.textContent = tag; b.title = 'Cliquer pour copier : ' + tag; b.onclick = function(){ try{ clip(tag); }catch(e){} var o = b.textContent; b.textContent = '\u2713 ' + tag; setTimeout(function(){ b.textContent = o; }, 900); }; box.appendChild(b); }); }); } var ex = document.querySelectorAll('#musicModal [data-style]'); Array.prototype.forEach.call(ex, function(b){ if (b._wired) return; b._wired = 1; b.onclick = function(){ try{ clip(b.getAttribute('data-style')); }catch(e){} var o = b.textContent; b.textContent = '\u2713 copi\u00e9 !'; setTimeout(function(){ b.textContent = o; }, 900); }; }); }
var INSTRU_GROUPS = [['Cordes', ['violin','viola','cello','double bass','fiddle','string quartet','string ensemble','lush strings','staccato strings','pizzicato strings','tremolo strings','concert harp','celtic harp','lyre','autoharp','erhu','zhonghu','morin khuur','sarangi','kemenche','rebab','nyckelharpa','hurdy-gurdy','viola da gamba','hardanger fiddle','octave violin']], ['Guitares', ['acoustic guitar','nylon-string guitar','twelve-string guitar','acoustic fingerpicked guitar','flamenco guitar','classical guitar','gypsy jazz guitar','resonator guitar','dobro','lap steel','pedal steel','electric guitar','clean electric guitar','funky wah guitar','surf guitar','twangy telecaster','palm-muted guitar','distorted lead guitar','heavy guitar riffs','djent guitars','slide guitar','ebow guitar','baritone guitar','seven-string guitar','harp guitar','fretless guitar','banjo','tenor banjo','ukulele']], ['Basses', ['electric bass','fingered funk bass','slap bass','fretless bass','picked bass','upright bass','acoustic bass guitar','synth bass','deep sub bass','reese bass','acid bassline','808 bass slides','dub bass','tuba bass']], ['Pianos & Claviers', ['grand piano','upright piano','honky-tonk piano','prepared piano','toy piano','rhodes piano','wurlitzer','clavinet','harpsichord','clavichord','celesta','music box','mellotron','farfisa organ','hammond organ','pipe organ','church organ','bandoneon','melodica','harmonium','pump organ','calliope','keytar','accordion']], ['Synthes & Electro', ['analog synth pads','arpeggiated synth','supersaw lead','hoover synth','acid squelch','8-bit chiptune','fm electric piano','glitchy synths','granular textures','wavetable growl','modular bleeps','drone synth','berlin school sequence','sidechained pads','detuned saw chords','vocoder synth','talkbox','riser','tape strings']], ['Bois', ['piccolo','flute','alto flute','recorder','irish flute','bansuri flute','dizi','shakuhachi','quena','pan flute','ocarina','tin whistle','low whistle','clarinet','bass clarinet','oboe','english horn','bassoon','soprano sax','alto sax','tenor sax','baritone sax','duduk','zurna','kaval','hulusi','suona','shenai','harmonica','blues harmonica','chromatic harmonica']], ['Cuivres', ['trumpet','muted trumpet','piccolo trumpet','flugelhorn','cornet','french horn','trombone','bass trombone','tuba','sousaphone','euphonium','bugle','conch shell','didgeridoo','shofar','alphorn','mariachi horns','funk horns','fanfare trumpets','brass section']], ['Folk Europe', ['bagpipes','great highland bagpipes','uilleann pipes','gaita','zampogna','musette','diatonic accordion','concertina','cimbalom','hammered dulcimer','balalaika','domra','bouzouki','mandolin','mandola','zither','kantele','gusli','cowbells','jaw harp']], ['Afrique', ['kora','ngoni','kalimba','mbira','balafon','talking drum','dundun','sabar','udu','shekere','agogo bells','likembe','inanga','adungu']], ['Moyen-Orient', ['oud','saz','baglama','tar','setar','qanun','santur','riq','darbuka','daf','bendir','mijwiz','arghul','rababa','ney','joza']], ['Asie', ['guzheng','pipa','yangqin','ruan','sanxian','sheng','koto','shamisen','sho','hichiriki','biwa','sanshin','gayageum','geomungo','haegeum','piri','daegeum','sitar','sarod','veena','dilruba','esraj','santoor','khene','ranat','dan bau','dan tranh','gamelan','saron','bonang','kenong','gong ageng','angklung','kulintang','taiko ensemble','tabla','mridangam']], ['Ameriques', ['charango','cuatro','tres cubano','jarana','vihuela','guitarron','bandolim','cavaquinho','steelpan','marimba','vibraphone','bandoneon tango','vallenato accordion','berimbau']], ['Percussions melodiques', ['xylophone','glockenspiel','tubular bells','handbells','hang drum','handpan','tongue drum','singing bowls','crystal bowls','gong','tam-tam','chimes','mark tree','temple blocks','log drum','slit drum','timpani','crotales']], ['Insolites & Jouets', ['kazoo','slide whistle','otamatone','theremin','musical saw','glass armonica','waterphone','flexatone','stylophone','omnichord','daxophone','yaybahar','ondes martenot','toy accordion','rain stick','thunder sheet']]];
function renderInstruChips(){ var box = gi('mzInstruChips'); if (!box || box.children.length) return; INSTRU_GROUPS.forEach(function(gr){ var lb = document.createElement('span'); lb.textContent = gr[0]; lb.style.cssText = 'width:100%;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#8f86c9;margin:6px 0 -2px'; box.appendChild(lb); gr[1].forEach(function(tag){ var b = document.createElement('button'); b.type = 'button'; b.textContent = tag; b.title = 'Cliquer pour copier : ' + tag; b.onclick = function(){ try{ clip(tag); }catch(e){} var o = b.textContent; b.textContent = '\u2713 ' + tag; setTimeout(function(){ b.textContent = o; }, 900); }; box.appendChild(b); }); }); var brks = document.querySelectorAll('#musicModal [data-brk]'); Array.prototype.forEach.call(brks, function(b){ b.onclick = function(){ var cur = val('mzCustom'); setVal('mzCustom', (cur ? cur.replace(/\s+$/, '') + '\n' : '') + b.getAttribute('data-brk') + '\n'); App.Music.setLyricMode('mine', true); App.Music.refreshLyrics(false); }; }); }
function renderLexiconChips(){ var box = gi('mzLexiconChips'); if (!box || box.children.length) return; try{ SUNO_LEXICON.forEach(function(gr){ var lb = document.createElement('span'); lb.textContent = gr.g; lb.style.cssText = 'width:100%;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#ff8ab5;margin:6px 0 -2px'; box.appendChild(lb); gr.tags.forEach(function(tag){ var full = (tag.charAt(0) === '*') ? tag : '[' + tag + ']'; var b = document.createElement('button'); b.type = 'button'; b.textContent = full; b.title = 'Cliquer pour copier : ' + full; b.onclick = function(){ try{ clip(full); }catch(e){} var o = b.textContent; b.textContent = '✓ ' + tag; setTimeout(function(){ b.textContent = o; }, 900); }; box.appendChild(b); }); }); }catch(e){} }
function wireBrkButtons(){ var brks = document.querySelectorAll('#musicModal [data-brk]'); Array.prototype.forEach.call(brks, function(b){ if (b._brkWired) return; b._brkWired = 1; b.onclick = function(){ var cur = val('mzCustom'); setVal('mzCustom', (cur ? cur.replace(/\s+$/, '') + '\n' : '') + b.getAttribute('data-brk') + '\n'); try{ App.Music.setLyricMode('mine', true); }catch(e){} try{ App.Music.refreshLyrics(false); }catch(e){} }; }); }
function wireBrkButtons(){ var brks = document.querySelectorAll('#musicModal [data-brk]'); Array.prototype.forEach.call(brks, function(b){ if (b._brkWired) return; b._brkWired = 1; b.onclick = function(){ var cur = val('mzCustom'); setVal('mzCustom', (cur ? cur.replace(/\s+$/, '') + '\n' : '') + b.getAttribute('data-brk') + '\n'); try{ App.Music.setLyricMode('mine', true); }catch(e){} try{ App.Music.refreshLyrics(false); }catch(e){} }; }); }
// ---------------- Laboratoire Rythme ----------------
function curRhythm(){ try{ var m = gi('mzMeter'), p = gi('mzPattern'), f = gi('mzFeel'), py = gi('mzPoly'), k = gi('mzEuclidK'); var r = { meter: m ? m.value : '4/4', pattern: p ? p.value : 'straight', feel: f ? f.value : 'straight', poly: py ? py.value : 'none', k: k ? parseInt(k.value, 10) : 5 }; try{ SM('rhythm', r); }catch(e){} return r; }catch(e){ try{ return M('rhythm') || { meter: '4/4', pattern: 'straight', feel: 'straight', poly: 'none', k: 5 }; }catch(e2){ return { meter: '4/4', pattern: 'straight', feel: 'straight', poly: 'none', k: 5 }; } } }
function rhythmFrag(){ try{ return rhythmSunoFragment(curRhythm()); }catch(e){ return ''; } }
function rhythmBracket(){ try{ return rhythmStructBracket(curRhythm()); }catch(e){ return ''; } }
function renderRhythmLab(){ try{ var mm = gi('mzMeter'); if (mm && !mm.options.length){ mm.innerHTML = TIME_SIGS.map(function(t){ return '<option value="' + t.id + '">' + t.label + '</option>'; }).join(''); } }catch(e){} try{ var pp = gi('mzPattern'); if (pp && !pp.options.length){ pp.innerHTML = RHYTHM_PATTERNS.map(function(t){ return '<option value="' + t.id + '">' + t.label + '</option>'; }).join(''); } }catch(e){} try{ var ff = gi('mzFeel'); if (ff && !ff.options.length){ ff.innerHTML = FEELS.map(function(t){ return '<option value="' + t.id + '">' + t.label + '</option>'; }).join(''); } }catch(e){} try{ var py = gi('mzPoly'); if (py && !py.options.length){ py.innerHTML = POLYS.map(function(t){ return '<option value="' + t.id + '">' + t.label + '</option>'; }).join(''); } }catch(e){} try{ var r0 = null; try{ r0 = M('rhythm'); }catch(e){} if (r0){ if (gi('mzMeter')) gi('mzMeter').value = r0.meter || '4/4'; if (gi('mzPattern')) gi('mzPattern').value = r0.pattern || 'straight'; if (gi('mzFeel')) gi('mzFeel').value = r0.feel || 'straight'; if (gi('mzPoly')) gi('mzPoly').value = r0.poly || 'none'; if (gi('mzEuclidK')) gi('mzEuclidK').value = r0.k || 5; } }catch(e){} drawRhythm(); wireRhythmLab(); }
function wireRhythmLab(){ try{ ['mzMeter', 'mzPattern', 'mzFeel', 'mzPoly'].forEach(function(id){ var el = gi(id); if (el && !el._rhWired){ el._rhWired = 1; el.onchange = function(){ drawRhythm(); try{ App.Music.generate(); }catch(e){} }; } }); }catch(e){} try{ var k = gi('mzEuclidK'); if (k && !k._rhWired){ k._rhWired = 1; k.oninput = function(){ try{ gi('mzEuclidKVal').textContent = k.value; }catch(e){} drawRhythm(); }; k.onchange = function(){ drawRhythm(); try{ App.Music.generate(); }catch(e){} }; } }catch(e){} try{ var pb = gi('mzPlayBtn'); if (pb && !pb._rhWired){ pb._rhWired = 1; pb.onclick = function(){ toggleRhythmPlay(); }; } }catch(e){} try{ var ab = gi('mzRhythmApply'); if (ab && !ab._rhWired){ ab._rhWired = 1; ab.onclick = function(){ try{ App.Music.generate(); }catch(e){} var f = '', b = ''; try{ f = rhythmFrag(); b = rhythmBracket(); }catch(e){} var st = gi('mzRhythmStatus'); if (st) st.textContent = '✓ Appliqué à Suno — Style: ' + (f || '4/4 standard') + (b ? ' · Structure: [' + b + ']' : ''); }; } }catch(e){} try{ var db = gi('mzRhythmDice'); if (db && !db._rhWired){ db._rhWired = 1; db.onclick = function(){ surpriseRhythmUI(); }; } }catch(e){} }
function drawRhythm(){ try{ var r = curRhythm(); var pat = getPattern(r.meter, r.pattern, r.k, 0); var box = gi('mzPatternView'); if (!box) return; var kv = gi('mzEuclidKVal'); if (kv) kv.textContent = r.k; var er = gi('mzEuclidRow'); if (er) er.style.opacity = (r.pattern === 'euclid') ? '1' : '0.45'; function row(lbl, arr, col){ return '<div><span style="color:' + col + ';display:inline-block;width:36px">' + lbl + '</span>' + arr.map(function(v){ return v ? '<span style="color:#ff2e9a">●</span>' : '<span style="color:#3a3a44">○</span>'; }).join('') + '</div>'; } var f = '', b = ''; try{ f = rhythmSunoFragment(r); b = rhythmStructBracket(r); }catch(e){} box.innerHTML = row('KCK', pat.kick, '#8ef') + row('SNR', pat.snare, '#fc6') + row('HAT', pat.hat, '#9fb') + (pat.bell.some(function(v){ return v; }) ? row('BEL', pat.bell, '#c9f') : '') + '<div style="margin-top:6px;color:#b9aef5;font-family:Inter,system-ui;font-size:11.5px">' + r.meter + ' · ' + (function(){ try{ return patternLabel(r.pattern).label; }catch(e){ return r.pattern; } })() + ' · ' + (function(){ try{ return feelById(r.feel).label; }catch(e){ return r.feel; } })() + (r.poly !== 'none' ? ' · ' + r.poly : '') + (f ? '<br><span style="color:#7ee2a8">Suno Style: ' + f + '</span>' : '<br><span style="color:#71717a">4/4 standard — Style inchangé</span>') + (b ? '<br><span style="color:#7ee2a8">Structure: [' + b + ']</span>' : '') + '</div>'; }catch(e){} }
var _rhAudio = { ctx: null, playing: false, timer: null, step: 0, next: 0 };
function rhEnsureCtx(){ try{ if (!_rhAudio.ctx){ var AC = window.AudioContext || window.webkitAudioContext; _rhAudio.ctx = new AC(); } if (_rhAudio.ctx.state === 'suspended') _rhAudio.ctx.resume(); return _rhAudio.ctx; }catch(e){ return null; } }
function rhKick(ctx, t){ try{ var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.11); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.16); }catch(e){} }
function rhSnare(ctx, t){ try{ var len = 0.12, buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate), d = buf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); var src = ctx.createBufferSource(); src.buffer = buf; var f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1400; var g = ctx.createGain(); g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(t); var o = ctx.createOscillator(), g2 = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 190; g2.gain.setValueAtTime(0.35, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.09); o.connect(g2); g2.connect(ctx.destination); o.start(t); o.stop(t + 0.1); }catch(e){} }
function rhHat(ctx, t, open){ try{ var len = open ? 0.16 : 0.035, buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate), d = buf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); var src = ctx.createBufferSource(); src.buffer = buf; var f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500; var g = ctx.createGain(); g.gain.setValueAtTime(open ? 0.28 : 0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(t); }catch(e){} }
function rhBell(ctx, t){ try{ var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 840; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.08); }catch(e){} }
function toggleRhythmPlay(){ try{ if (_rhAudio.playing){ stopRhythmPlay(); return; } var ctx = rhEnsureCtx(); if (!ctx) return; var bpm = 124; try{ bpm = parseInt(val('mzBpm'), 10) || 124; }catch(e){} var r = curRhythm(); var pat = getPattern(r.meter, r.pattern, r.k, 0); var meter = meterById(r.meter); var barQuarters = meter.beats * 4 / meter.unit; var stepDur = barQuarters * 60 / bpm / pat.steps; _rhAudio.playing = true; _rhAudio.step = 0; _rhAudio.next = ctx.currentTime + 0.06; var pb = gi('mzPlayBtn'); if (pb) pb.textContent = '⏹ Stop'; var st = gi('mzRhythmStatus'); if (st) st.textContent = '▶ ' + r.meter + ' à ' + bpm + ' BPM — ' + pat.steps + ' pas'; _rhAudio.timer = setInterval(function(){ try{ if (!_rhAudio.playing) return; while (_rhAudio.next < ctx.currentTime + 0.18){ (function(s, t){ var swing = 0; if (r.feel === 'swing58') swing = 0.16; else if (r.feel === 'swing62') swing = 0.26; else if (r.feel === 'shuffle') swing = 0.33; var tt = t + ((s % 2 === 1 && swing) ? stepDur * swing : 0); if (pat.kick[s]) rhKick(ctx, tt); if (pat.snare[s]) rhSnare(ctx, tt); if (pat.hat[s]) rhHat(ctx, tt, (r.pattern === 'trap' && s % 4 === 3)); if (pat.bell[s]) rhBell(ctx, tt); })(_rhAudio.step % pat.steps, _rhAudio.next); _rhAudio.next += stepDur; _rhAudio.step++; if (_rhAudio.step > 512) _rhAudio.step = 0; } }catch(e){} }, 40); }catch(e){} }
function stopRhythmPlay(){ try{ _rhAudio.playing = false; if (_rhAudio.timer){ clearInterval(_rhAudio.timer); _rhAudio.timer = null; } var pb = gi('mzPlayBtn'); if (pb) pb.textContent = '▶ Écouter'; var st = gi('mzRhythmStatus'); if (st && /▶/.test(st.textContent || '')) st.textContent = ''; }catch(e){} }
function surpriseRhythmUI(){ try{ var r = surpriseRhythm(); try{ SM('rhythm', r); }catch(e){} if (gi('mzMeter')) gi('mzMeter').value = r.meter; if (gi('mzPattern')) gi('mzPattern').value = r.pattern; if (gi('mzFeel')) gi('mzFeel').value = r.feel; if (gi('mzPoly')) gi('mzPoly').value = r.poly; if (gi('mzEuclidK')) gi('mzEuclidK').value = r.k; drawRhythm(); try{ App.Music.generate(); }catch(e){} var st = gi('mzRhythmStatus'); if (st){ var f = ''; try{ f = rhythmSunoFragment(r); }catch(e){} st.textContent = '🎲 Sofia propose : ' + r.meter + ' + ' + r.pattern + ' + ' + r.feel + (r.poly !== 'none' ? ' + ' + r.poly : '') + (f ? ' → ' + f : ''); } }catch(e){} }
function buildGrid(){
var g = gi('mzGrid'); if (!g || g.children.length) return;
function card(lid, inner){ return "<div class='mz-card'><label id='" + lid + "'></label>" + inner + "</div>"; }
var h = '';
h += card('mzLSongLang', "<select id='mzSongLang'></select>");
h += card('mzLGenre', "<select id='mzGenre'></select>");
h += "<div class='mz-card' style='border-color:#ff2e9a'><label id='mzLFusion'></label><div class='mz-row' style='margin:0 0 8px'><label style='margin:0;text-transform:none;letter-spacing:0;font-size:13px;color:#efe9ff'><input type='checkbox' id='mzFusion' style='width:auto;margin-right:6px'><span id='mzFusionLbl'></span></label></div><div class='mz-row' style='margin:0'><select id='mzGenreC' style='flex:1;min-width:0'></select><button class='mz-ghost' id='mzGenreCDice' title='Sofia choisit'>\ud83c\udfb2</button></div><div class='mz-sub' id='mzFusionHint' style='font-size:11.5px'></div></div>";
h += card('mzLVocal', "<select id='mzVocal'></select>");
h += card('mzLTheme', "<select id='mzTheme'></select>");
 h += card('mzLMood', "<select id='mzMood'></select>");
h += card('mzLIntent', "<select id='mzIntent'></select>");
h += card('mzLBpm', "<input type='range' id='mzBpm' min='40' max='180' value='124'> <span class='mz-count' id='mzBpmVal'>124</span>");
h += card('mzLKey', "<select id='mzKey'></select>");
h += card('mzLChords', "<select id='mzChords'></select>");
h += card('mzLBass', "<select id='mzBass'></select>");
h += card('mzLPerc', "<select id='mzPerc'></select>");
h += card('mzLTex', "<select id='mzTex'></select>");
h += card('mzLSpat', "<select id='mzSpat'></select>");
h += card('mzLEnergy', "<select id='mzEnergy'></select>");
h += card('mzLSoma', "<select id='mzSoma'></select>");
h += card('mzLLen', "<select id='mzLen'></select>");
h += card('mzLLyrLen', "<select id='mzLyrLen'></select>");
h += card('mzLTitre', "<div class='mz-row' style='margin:0'><input type='text' id='mzTitre' style='flex:1;min-width:0'><button class='mz-ghost' id='mzTitreDice'>\uD83C\uDFB2</button></div>");
h += card('mzLSunoVer', "<select id='mzSunoVer'></select>");
h += card('mzLExclude', "<div class='mz-row' style='margin:0'><input type='text' id='mzExclude' style='flex:1;min-width:0'><button class='mz-ghost' id='mzExcludeDice' title='Exclude intelligent'>\u2728</button></div>");
g.innerHTML = h;
var bpm = gi('mzBpm'); if (bpm) bpm.oninput = function(e){ setBpmUI(e.target.value); };
var td = gi('mzTitreDice'); if (td) td.onclick = function(){ setVal('mzTitre', pick(BK().titles)); };
var cd = gi('mzGenreCDice'); if (cd && !cd._wired){ cd._wired = 1; cd.onclick = function(){ try{ var gv = val('mzGenre'); var cc = contrastGenre(gv); if (cc) setVal('mzGenreC', cc); var fc = gi('mzFusion'); if (fc) fc.checked = true; }catch(e){} try{ App.Music.generate(); }catch(e){} }; }
var ed = gi('mzExcludeDice'); if (ed && !ed._wired){ ed._wired = 1; ed.onclick = function(){ try{ var gf = null; try{ gf = familyFor(val('mzGenre')); }catch(e){} var ins = false; try{ ins = vocalInfo().v.instru; }catch(e){} var b0 = ''; try{ b0 = val('mzExclude').trim() || UI().excludeDef; }catch(e){} setVal('mzExclude', excludeFor(gf, ins, b0)); }catch(e){} try{ App.Music.generate(); }catch(e){} }; }
var al = gi('mzGrid'); if (al) al.querySelectorAll('select,input').forEach(function(el){ el.onchange = function(){ App.Music.generate(); }; });
var msl = gi('mzSongLang'); if (msl){ msl.onchange = function(){ try{ var v = msl.value; _songSel = (v && v !== 'auto') ? v : null; }catch(eSl){ _songSel = null; } try{ localize(); }catch(eL){} try{ App.Music.generate(); }catch(eG){} }; }
var mg = gi('mzGenre'); if (mg){ var _mgPrev = mg.onchange; mg.onchange = function(){ try{ App.Music.applyGenreRhythm(); }catch(e){} if (_mgPrev) _mgPrev.call(this); }; }
}
var LABELS = [['mzTitle','title'],['mzSub','sub'],['mzLGenre','genre'],['mzLMood','mood'],['mzLIntent','intent'],['mzLBpm','bpm'],['mzLKey','key'],['mzLBass','bass'],['mzLPerc','perc'],['mzLTex','tex'],['mzLSpat','spat'],['mzLEnergy','energy'],['mzLSoma','soma'],['mzLVocal','vocal'],['mzLTheme','theme'],['mzLLen','len'],['mzLLyrLen','lyrLen'],['mzLTitre','titre'],['mzLSunoVer','sunoVer'],['mzLExclude','exclude'],['mzGen','gen'],['mzRand','surprise'],['mzCopyBoth','copyBoth'],['mzCopyAll','copyAll'],['mzExport','export'],['mzLStyle','styleBox'],['mzLStruct','structBox'],['mzLLyrics','lyricsBox'],['mzLCustom2','customLbl'],['mzAiLyrics','aiLyrics'],['mzEdit','edit'],['mzWrap','wrap'],['mzCopyLyrics','copyLyrics'],['mzCopyStyle','copyStyle'],['mzCopyStruct','copyStruct'],['mzLNotes','notes'],['mzLHist','hist'],['mzSaveHist','saveHist'],['mzDelHist','delHist'],['mzHistNote','localOnly'],['mzLOneSong','oneSong'],['mzOneSongNote','oneSongNote'],['mzModeAi','modeAi'],['mzModeMine','modeMine'],['mzWriteLyrics','writeLyrics'],['mzCompose','compose'],['mzPublish','publish'],['mzLGallery','galleryT'],['mzGalleryNote','galleryNote'],['mzLListen','listenT'],['mzListenNote','listenNote'],['mzLChords','chords'],['mzTipVoice','tipVoice'],['mzTipSuno','tipSuno'],['mzFoot','foot'],['mzClose','close']];
function fillSongLang(){
  var el = gi('mzSongLang'); if (!el) return;
  var ul = uiLang(), cl = curLang();
  var autoT = (SONGAUTO[ul] || SONGAUTO.en) + (BANKS[cl] ? BANKS[cl].meta.langName : cl) + ')';
  var opts = [{v:'auto', t:autoT}];
  var bl = ['fr','de','en','es','it','pl','ja','zh','ko','hi'];
  for (var i = 0; i < bl.length; i++){ if (BANKS[bl[i]]) opts.push({v:bl[i], t:BANKS[bl[i]].meta.langName}); }
  for (var k in EXTRA_SONG) opts.push({v:k, t:EXTRA_SONG[k].label});
  var cur = _songSel || 'auto';
  el.innerHTML = opts.map(function(o){ return "<option value='" + o.v + "'" + (o.v === cur ? " selected" : "") + ">" + esc(o.t) + "</option>"; }).join('');
}
function localize(){
buildPanel(); App.Music.buildGrid();
var ui = UI(), bk = BK();
LABELS.forEach(function(p){ var el = gi(p[0]); if (el) el.textContent = ui[p[1]] || ''; });
try { var _slEl = gi('mzLSongLang'); if (_slEl) _slEl.textContent = SONGLBL[uiLang()] || SONGLBL.en; fillSongLang(); } catch(eSL2) {}
var first = !M('built'); SM('built', true);
fillSel('mzGenre', SOUND.genre);
(function(){ var el = gi('mzGenreC'); if (!el) return; var cur = ''; try{ cur = el.value; }catch(e){} var same = (uiLang() === 'fr') ? '\u2014 m\u00eame style \u2014' : '\u2014 same style \u2014'; el.innerHTML = '<option>' + esc(same) + '</option>' + SOUND.genre.map(function(v){ return '<option>' + esc(v) + '</option>'; }).join(''); var ix = 0; if (cur) for (var i = 1; i < el.options.length; i++){ if (el.options[i].text === cur){ ix = i; break; } } try{ el.selectedIndex = ix; }catch(e){} })();
try{ var _fe = gi('mzLFusion'); if (_fe) _fe.textContent = uiLang() === 'fr' ? '\uD83D\uDD00 Fusion 2 styles' : '\uD83D\uDD00 2-style fusion'; var _fl = gi('mzFusionLbl'); if (_fl) _fl.textContent = uiLang() === 'fr' ? 'Couplet \u2260 refrain' : 'Verse \u2260 chorus'; var _fh = gi('mzFusionHint'); if (_fh) _fh.textContent = uiLang() === 'fr' ? 'Couplets = style principal \u00b7 Refrains = 2e style \u00b7 Pont = m\u00e9lange des 2 \u00b7 Pr\u00e9-refrain = transition. \ud83c\udfb2 = Sofia choisit le 2e style.' : 'Verses = main style \u00b7 Choruses = 2nd style \u00b7 Bridge = both mixed \u00b7 Pre-chorus = transition. \ud83c\udfb2 = Sofia picks the 2nd style.'; }catch(e){} fillSel('mzMood', SOUND.mood); fillSel('mzIntent', SOUND.intent); fillSel('mzKey', SOUND.key); fillSel('mzBass', SOUND.bass); fillSel('mzPerc', SOUND.perc); fillSel('mzTex', SOUND.tex); fillSel('mzSpat', SOUND.spat); fillSel('mzEnergy', SOUND.energy); fillSel('mzSoma', SOUND.soma);
(function(){ var gz = gi('mzGenre'); var hints = ui.genreHints || {}; if (gz && hints) Array.prototype.forEach.call(gz.options, function(o){ if (hints[o.text]) o.title = hints[o.text]; }); })();
fillSel('mzVocal', bk.vocal.map(function(v){ return v.t; })); try{ updateVoiceLang(); }catch(eVL){}
fillSel('mzTheme', bk.themes); try{ localizeRhyme(); }catch(e){} fillSel('mzLen', ui.lenOpts); fillSel('mzLyrLen', ui.lyrOpts);
var sv = gi('mzSunoVer'); if (sv){ var ki = -1; try{ ki = sv.selectedIndex; }catch(e){} sv.innerHTML = ui.verOpts.map(function(p){ return "<option value='" + p[1] + "'>" + esc(p[0]) + "</option>"; }).join(''); if (ki >= 0 && ki < ui.verOpts.length){ try{ sv.selectedIndex = ki; }catch(e){} } }
fillSel('mzChords', SOUND.chords); fillSel('mzCoverStyle', COVER_STYLE_LABELS); App.Music.renderThemeChips(); App.Music.setLyricMode(M('lyrMode') || 'sofia', true); App.Music.mountGallery(); App.Music.renderListen();
var te = gi('mzTitre'); if (te) te.placeholder = ui.titrePh;
var ce = gi('mzCustom'); if (ce) ce.placeholder = ui.customPh;
if (first){ setVal('mzExclude', ui.excludeDef); }
var pc = gi('mzPresets'); if (pc){ pc.innerHTML = ''; var grps = [['\uD83D\uDD25 Univers originaux \u2014 vrais styles Suno', 0], ['🧬 Genres & formule Suno', 1]]; grps.forEach(function(gr){ var has = PRESETS_FR.some(function(p){ return (p[3] || 0) === gr[1]; }); if (!has) return; var hd = document.createElement('div'); hd.style.cssText = 'width:100%;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#b9aef5;margin:8px 0 2px'; hd.textContent = gr[0]; pc.appendChild(hd); ui.presetNames.forEach(function(n, i){ var p = PRESETS_FR[i]; if (!p || (p[3] || 0) !== gr[1]) return; var btn = document.createElement('button'); btn.textContent = n; try{ btn.title = String(p[2] || ''); }catch(e){} btn.onclick = function(){ App.Music.applyPreset(i); }; btn.dataset.i = i; pc.appendChild(btn); }); }); }
var tb = gi('musicToggleLabel'); if (tb) tb.textContent = ui.musicBtn;
var tbb = gi('musicToggleBtn'); if (tbb){ tbb.title = ui.title; tbb.setAttribute('aria-label', ui.musicBtn); }
App.Music.renderHist();
}
function vocalInfo(){ var bk = BK(); var el = gi('mzVocal'); var i = el ? el.selectedIndex : 0; if (i < 0 || i >= bk.vocal.length) i = 0; return { i: i, v: bk.vocal[i] }; }
function styleMax(){ var el = gi('mzSunoVer'); var v = el ? parseInt(el.value) : 200; return v || 200; }
function styleText(){ var ui = UI(); var g = val('mzGenre'), mo = val('mzMood'), bpm = val('mzBpm'), k = val('mzKey'), ch = val('mzChords'), ba = val('mzBass'), pe = val('mzPerc'), te = val('mzTex'), sp = val('mzSpat'), en = val('mzEnergy'); var vi = vocalInfo(); var max = styleMax(); var voixTag = ''; try{ var _m = BK().meta || {}; voixTag = sunoStyleVoice(vi.v, _m.langName, _m.voice, songLang()); }catch(e){ voixTag = 'female vocal, clear singable pronunciation'; } var ps0 = ''; try{ ps0 = M('presetSuno') || ''; }catch(e){} var fus = fusionOn(); var gC0 = fus ? genreC() : ''; var head = fus ? (g + ' meets ' + gC0 + ' fusion (verses ' + g + ', choruses ' + gC0 + ', bridge ' + g + ' x ' + gC0 + ')') : g; var peH = (fus && fusionGroove(g) && fusionGroove(gC0)) ? (fusionGroove(g) + ' in verses, ' + fusionGroove(gC0) + ' in choruses, both mixed in bridge') : pe; var psH = ps0; if (fus) psH += ', ' + g + ' meets ' + gC0 + ' fusion'; if (ps0){ var famX = ''; try{ famX = sunoExtra(familyFor(g), max); }catch(e){} var chX = ch ? ', ' + ch + ' chords' : ''; var s0 = ''; if (max > 200){ s0 = psH + ', ' + bpm + ' BPM, ' + k + chX + famX + ', ' + ba + ', ' + peH + ', ' + en + ', ' + voixTag; if (s0.length > max) s0 = psH + ', ' + bpm + ' BPM, ' + k + ', ' + ba + ', ' + peH + ', ' + en + ', ' + voixTag; } else { s0 = psH + ', ' + bpm + ' BPM, ' + k + ', ' + voixTag; if (s0.length > max) s0 = psH + ', ' + bpm + ' BPM, ' + voixTag; } if (s0.length > max) s0 = psH + ', ' + voixTag; if (s0.length > max + 50) s0 = s0.slice(0, max - 3) + '...'; return s0; }
  var chTag = ch ? ', ' + ch + ' chords' : ''; var fam = ''; try{ fam = sunoExtra(familyFor(g), max); }catch(e){} var rh = ''; try{ rh = rhythmFrag(); }catch(e){ rh = ''; } var rhTag = rh ? ', ' + rh : ''; var s = head + ', ' + (mo ? mo + ', ' : '') + bpm + ' BPM, ' + k + chTag + fam + ', ' + ba + ', ' + peH + rhTag + ', ' + te + ', ' + sp + ', ' + en + ', ' + voixTag; if (s.length > max) s = head + ', ' + (mo ? mo + ', ' : '') + bpm + ' BPM, ' + k + chTag + ', ' + ba + ', ' + peH + rhTag + ', ' + en + ', ' + voixTag; if (s.length > max) s = head + ', ' + (mo ? mo + ', ' : '') + bpm + ' BPM, ' + k + rhTag + ', ' + en + ', ' + voixTag; if (s.length > max + 50) s = s.slice(0, max - 3) + '...'; return s; }
var SFXM = ['*wind blowing*','*rain falling*','*distant thunder*','*soft drumroll*','*ocean waves*','*crowd cheering*'];
function tempoName(b){ b = parseInt(b, 10) || 0; if (b < 60) return 'Largo'; if (b < 70) return 'Adagio'; if (b < 90) return 'Andante'; if (b < 110) return 'Moderato'; if (b < 130) return 'Allegro'; if (b < 160) return 'Vivace'; return 'Presto'; }
function setBpmUI(v){ try{ var b = gi('mzBpm'); if (b) b.value = v; var l = gi('mzBpmVal'); if (l) l.textContent = v + ' \u00b7 ' + tempoName(v); }catch(e){} }
function excludeFor(fam, instru, base){ var e = String(base || ''); try{ var extra = ''; if (instru) extra = 'vocals, singing, harsh synths'; else if (fam === 'hiphop') extra = 'acoustic guitar, choir, slow ballad'; else if (fam === 'edm') extra = 'acoustic, country, ballad'; else if (fam === 'rock' || fam === 'metal') extra = 'synths, autotune, soft piano'; else if (fam === 'classical') extra = 'pop drums, electric guitar, lead vocals'; else if (fam === 'rnb') extra = 'rock guitars, EDM drops'; else if (fam === 'folk' || fam === 'country') extra = 'electric instruments, autotune, synths'; else if (fam === 'pop') extra = 'rap, heavy drums, autotune'; else if (fam === 'jazz' || fam === 'blues') extra = 'EDM drops, autotune, heavy distortion'; else extra = 'autotune, harsh noise'; if (extra && e.toLowerCase().indexOf(extra.split(',')[0].trim().toLowerCase()) < 0) e = (e ? e + ', ' : '') + extra; }catch(e2){} return e; }
function shortTag(){ var vi = vocalInfo(); return vi.v.short || vi.v.t; }
function fusionOn(){ try{ var c = gi('mzFusion'); var x = gi('mzGenreC'); return !!(c && c.checked && x && x.selectedIndex > 0); }catch(e){ return false; } }
function genreV(){ return val('mzGenre'); }
function genreC(){ try{ if (fusionOn()) return val('mzGenreC'); }catch(e){} return val('mzGenre'); }
function rockish(l){ return /rock|m.tal|guitare|guitar|metal|grunge|screamo|shoegaze|djent|grind|mathcore|coldwave|dark wave|punk/i.test(String(l || '')); }
function fusionGroove(g){ try{ return GENRE_RHYTHM[g] || ''; }catch(e){ return ''; } }
function contrastGenre(g){ try{ var fam = null; try{ fam = familyFor(g); }catch(e){} for (var k = 0; k < 24; k++){ var c = pick(SOUND.genre); if (!c || c === g) continue; var cf = null; try{ cf = familyFor(c); }catch(e2){} if (!fam || cf !== fam) return c; } for (var j = 0; j < SOUND.genre.length; j++){ var d = SOUND.genre[(SOUND.genre.indexOf(g) + 1 + Math.floor(SOUND.genre.length / 2) + j) % SOUND.genre.length]; if (d && d !== g) return d; } }catch(e){} return null; }
// Bracket vocal Suno canonique (anglais) pour la voix courante.
// Tout ce qui part vers Suno passe par ici — jamais de français dans les [].
function sunoVoice(){ try{ return sunoVocalBracket(vocalInfo().v); }catch(e){ return 'Female Vocal'; } }
function sunoChorus(){ try{ return sunoChorusTag(sunoVoice()); }catch(e){ return 'Choir | Layered Harmonies'; } }
function structText(){ var ui = UI(); var bpm = val('mzBpm'), g = val('mzGenre'), ba = val('mzBass'), pe = val('mzPerc'), te = val('mzTex'), so = val('mzSoma'), len = val('mzLen'); var vi = vocalInfo(); var vb = sunoVoice(); var rhB = ''; try{ rhB = rhythmBracket(); }catch(e){ rhB = ''; } var rhLine = rhB ? sunoJoin(rhB) + '\n\n' : ''; var ext = (len === ui.lenOpts[1]) ? sunoJoin(SUNO_ENERGY.build, '16 bars') + '\n\n' : ''; var tool = (len === ui.lenOpts[2]) ? sunoJoin(SUNO_STRUCT.out, '16 bars, percussion') : sunoJoin(SUNO_STRUCT.out, SUNO_ENERGY.fadeOut); var isTool = (len === ui.lenOpts[2]); var fusS = fusionOn(); var gC0s = fusS ? genreC() : ''; var mm = null; try{ mm = sunoMoments(fusS ? gC0s : g, vb); }catch(e){ mm = null; } var _grV = ''; try{ _grV = fusionGroove(g) || ''; }catch(e){} var _grC = ''; try{ _grC = fusionGroove(gC0s) || ''; }catch(e){} var peH = (fusS && _grV && _grC) ? (_grV + ' in verses, ' + _grC + ' in choruses, both mixed in bridge') : pe; var soloBr = mm ? sunoJoin(mm.solo) : ''; var bridgeBr = mm ? sunoJoin(SUNO_STRUCT.br, SUNO_ENERGY.stripped, mm.bridgeFx, (fusS ? (g + ' x ' + gC0s + ' fusion') : '')) : sunoJoin(SUNO_STRUCT.br, SUNO_ENERGY.stripped, (fusS ? (g + ' x ' + gC0s + ' fusion') : '')); var outBr = sunoJoin.apply(null, ((mm && mm.outro && mm.outro.parts) || [SUNO_STRUCT.out, SUNO_ENERGY.fadeOut, 'Echo'])); var liftBr = (mm && mm.lift) ? sunoJoin(mm.lift) : ''; var bloc = vi.v.instru ? sunoJoin(SUNO_STRUCT.ins) : sunoJoin(vb); var chLine = val('mzChords') ? '[Chords: ' + val('mzChords') + ']\n\n' : ''; return bloc + '\n\n' + sunoJoin(SUNO_STRUCT.intro, bpm + ' BPM') + '\n\n' + chLine + sunoJoin(SUNO_STRUCT.brk, (fusS ? peH : pe)) + '\n\n' + rhLine + sunoJoin(SUNO_STRUCT.inter, te) + '\n\n' + sunoJoin(SUNO_ENERGY.build, so) + '\n\n' + sunoJoin(SUNO_ENERGY.drop, ba) + '\n\n' + sunoJoin('Verse', g) + '\n\n' + (fusS ? sunoJoin(SUNO_STRUCT.pre, SUNO_ENERGY.build, g + ' to ' + gC0s + ' transition') + '\n\n' : '') + (fusS ? sunoJoin(SUNO_STRUCT.ch, gC0s) + '\n\n' : '') + (soloBr ? soloBr + '\n\n' : '') + sunoJoin(SUNO_STRUCT.brk, SUNO_ENERGY.stripped) + '\n\n' + bridgeBr + '\n\n' + ext + (liftBr ? liftBr + '\n\n' : '') + sunoJoin(SUNO_ENERGY.build, 'drums') + '\n\n' + (fusS ? sunoJoin(SUNO_ENERGY.drop, g + ' x ' + gC0s + ' fusion') : sunoJoin(SUNO_ENERGY.drop)) + '\n\n' + (isTool ? tool : outBr); }
function lyricsText(){ var ui = UI(), bk = BK(); var theme = effTheme(); var complet = false; try{ complet = gi('mzLyrLen').selectedIndex === 1; }catch(e){} var vi = vocalInfo(); var vb = sunoVoice(), chTag = sunoChorus(); if (vi.v.instru){ var mmI = null; try{ mmI = sunoMoments(val('mzGenre'), vb); }catch(e){ mmI = null; } var soloI = (mmI && mmI.solo) || 'Instrumental Break'; return sunoJoin(SUNO_STRUCT.ins) + '\n(' + ui.themeOf + ' : ' + theme + ')\n[' + ui.breathAllow + ' : ' + pickN(bk.excla, 3).join(' \u2026 ') + ']\n\n' + sunoJoin(soloI) + '\n\n' + ui.instruTip; } var gVv = genreV(), gCc = fusionOn() ? genreC() : genreV(); var fusL = (gCc !== gVv); var rkV = rockish(gVv) && bk.coupletRock; var rk = rockish(val('mzGenre')) && bk.coupletRock; var rkC = rockish(gCc) && bk.coupletRock; var _free = false; try{ _free = isFreeVerse(); }catch(eF){} var pk = function(pool, nn){ try{ return _free ? pickUnrhymed(pool, nn) : pickN(pool, nn); }catch(e){ return pickN(pool, nn); } }; var c1 = pk(rkV ? bk.coupletRock : bk.couplet, 4), c2 = pk(rkV ? bk.coupletRock : bk.couplet, 4), r = pk(rkC && bk.refrainRock ? bk.refrainRock : bk.refrain, 4), p = pk(rkV && bk.pontRock ? bk.pontRock : bk.pont, 2); try{ var _g=0; while(_g++<5 && c2.some(function(x){ return c1.indexOf(x)>=0; })){ c2 = pk(rkV ? bk.coupletRock : bk.couplet, 4); } }catch(e){} var ex = pickN(bk.excla, 2).join(' \u2026 ');
var sfxL = Math.random() < 0.6 ? pick(SFXM) : ''; var t = (fusL ? sunoJoin(SUNO_STRUCT.v1, vb, gVv) : sunoJoin(SUNO_STRUCT.v1, vb)) + '\n' + c1.join('\n') + '\n(' + theme + storyTag() + ')\n\n' + (fusL ? sunoJoin(SUNO_STRUCT.pre, SUNO_ENERGY.build, gVv + ' to ' + gCc + ' transition') : sunoJoin(SUNO_STRUCT.pre, SUNO_ENERGY.build)) + '\n' + ex + ' \u2026\n\n' + (fusL ? sunoJoin(SUNO_STRUCT.ch, chTag, gCc) : sunoJoin(SUNO_STRUCT.ch, chTag)) + '\n' + r.join('\n') + '\n'; if (!complet){ t += '\n' + sunoJoin(SUNO_STRUCT.post, 'Echo') + '\n' + ex + ' \u2026 (echo\u2026)\n'; } if (complet){ var mmL = null; try{ mmL = sunoMoments(val('mzGenre'), vb); }catch(e){ mmL = null; } var soloL = (mmL && mmL.solo) || 'Guitar Solo'; var ch2L = (mmL && mmL.chorus2) || chTag; var brFxL = (mmL && mmL.bridgeFx) || 'Whispered'; var v2tagL = (mmL && mmL.duetV2) || vb; var lastC1 = c1[c1.length-1] || ''; var stopL = (mmL && mmL.stopBreak) ? sunoJoin(SUNO_STRUCT.brk, 'Silence') + '\n\n' : ''; var liftL = (mmL && mmL.lift) ? sunoJoin(mmL.lift) + '\n\n' : ''; var outKindL = (mmL && mmL.outro && mmL.outro.kind) || 'fade'; var outTagL = sunoJoin.apply(null, ((mmL && mmL.outro && mmL.outro.parts) || [SUNO_STRUCT.out, SUNO_ENERGY.fadeOut, 'Echo'])); var outBodyL = (outKindL === 'fade') ? (ex + ' \u2026 (echo fading\u2026)') : (c1[0] || r[0] || ex); t += '\n' + (fusL ? sunoJoin(SUNO_STRUCT.v2, v2tagL, gVv) : sunoJoin(SUNO_STRUCT.v2, v2tagL)) + '\n' + c2.join('\n') + '\n\n' + (fusL ? sunoJoin(SUNO_STRUCT.ch, ch2L, gCc) : sunoJoin(SUNO_STRUCT.ch, ch2L)) + '\n' + r.slice().reverse().join('\n') + '\n\n' + sunoJoin(soloL) + '\n\n' + (fusL ? sunoJoin(SUNO_STRUCT.br, SUNO_ENERGY.stripped, brFxL, gVv + ' x ' + gCc + ' fusion') : sunoJoin(SUNO_STRUCT.br, SUNO_ENERGY.stripped, brFxL)) + '\n' + p.join('\n') + '\n' + lastC1 + ' \u2026 (echo\u2026)' + '\n\n' + stopL + liftL + (sfxL ? sfxL + '\n\n' : '') + (fusL ? sunoJoin(SUNO_STRUCT.chf, chTag, 'Anthemic', gVv + ' x ' + gCc + ' fusion') : sunoJoin(SUNO_STRUCT.chf, chTag, 'Anthemic')) + '\n' + r.join('\n') + '\n' + ex.toUpperCase() + ' \u2026 (ad-lib\u2026)' + '\n\n' + outTagL + '\n' + outBodyL + '\n'; } return t; }
function notesText(){ var ui = UI(), nl =  (NLBL[songLang()] || NLBL[uiLang()] || NLBL.en || NLBL.fr); var cur = M('preset'); var s = nl[0] + ' : ' + val('mzIntent') + ' \u00b7 ' + val('mzMood') + ' \u00b7 ' + (cur || '') + '<br>' + 'BPM ' + val('mzBpm') + ' \u00b7 ' + val('mzKey') + ' \u00b7 ' + val('mzGenre') + '<br>' + nl[1] + ' : ' + val('mzSoma') + ' — ' + val('mzBass') + '.<br>' + nl[2] + ' ' + BK().meta.voice + ' : ' + shortTag() + ' — ' + ui.vocalClause + '. ' + ui.theme + ' : ' + effTheme() + '.<br>' + nl[3] + ' : kick + prioritaire, mono <120 Hz.<br>' + nl[4] + ' : Style < ' + styleMax() + ' ' + ui.chars + '.'; return s; }
function syllables(line, lang){ var tot = 0; var words = String(line).toLowerCase().replace(/[\u2019']/g, ' ').replace(/[^a-z\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f6\u00f9\u00fb\u00fc\u00ff\u0153\u00e6\u00e7\u00e1\u00ed\u00f3\u00fa\u00f1\u00e0\u00e8\u00ec\u00f2\u00f9\u0105\u0107\u0119\u0142\u0144\u015b\u017a\u017c]+/g, ' ').trim().split(/\s+/); for (var k = 0; k < words.length; k++){ var w = words[k]; if (!w) continue; var groups = w.match(/[aeiouy\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f6\u00f9\u00fb\u00fc\u00e1\u00ed\u00f3\u00fa\u00f1\u00e0\u00e8\u00ec\u00f2\u0105\u0119]+/g); var n = groups ? groups.length : 0; if (lang === 'fr'){ if (n > 1 && /e$/.test(w)) n--; if (n > 1 && /ent$/.test(w) && w.length > 4) n--; } tot += Math.max(n, 1); } return tot; }
function checker(){ var ui = UI(), bk = BK(), l = songLang(); var el = gi('mzCheck'); if (!el) return; var raw = gi('mzLyrics').textContent; var lines = raw.split('\n').map(function(s){ return s.trim(); }).filter(function(s){ return s && !/^\[.+\]$/.test(s) && !/^\(.+\)$/.test(s) && !/^\*.+\*$/.test(s); }); if (!lines.length){ el.textContent = ui.chkNone; return; } var counts = lines.map(function(s){ return syllables(s, l); }); var avg = counts.reduce(function(a, b){ return a + b; }, 0) / counts.length; var longs = []; counts.forEach(function(c, i){ if (c > 10) longs.push((i + 1) + ' (' + c + ')'); }); var low = ' ' + raw.toLowerCase().replace(/[^a-z\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f6\u00f9\u00fb\u00fc\u00ff\u0153\u00e6\u00e7\u00e1\u00ed\u00f3\u00fa\u00f1\u00e0\u00e8\u00ec\u00f2\u0105\u0107\u0119\u0142\u0144\u015b\u017a\u017c]+/g, ' ') + ' '; var found = []; bk.foreignWords.forEach(function(w){ if (low.indexOf(' ' + w + ' ') >= 0 && found.indexOf(w) < 0) found.push(w); }); var h = ui.chkVerses + ' : ' + lines.length + ' \u00b7 ' + avg.toFixed(1) + ' ' + ui.chkAvg; if (longs.length) h += '\n\u26a0\ufe0f ' + ui.chkLong + ' (>10) : ' + longs.join(', '); else h += '\n\u2705 ' + ui.chkLongOk; if (found.length) h += '\n\u26a0\ufe0f ' + ui.chkForeign + ' : ' + found.join(', '); else h += '\n\u2705 ' + ui.chkForeignOk; el.textContent = h; }
function generate(){ var ui = UI(), bk = BK();
try{ var _exEl = gi('mzExclude'); if (_exEl && !String(_exEl.value).trim()){ var _gf0 = null; try{ _gf0 = familyFor(val('mzGenre')); }catch(e){} var _ins0 = false; try{ _ins0 = vocalInfo().v.instru; }catch(e){} _exEl.value = excludeFor(_gf0, _ins0, ui.excludeDef); } }catch(e){} if (!val('mzTitre').trim()) setVal('mzTitre', pick(bk.titles)); var s = styleText(); gi('mzStyle').textContent = s; var max = styleMax(); var c = gi('mzChars'); c.textContent = '\u00b7 ' + s.length + '/' + max + ' ' + ui.chars; try{ c.classList.toggle('bad', s.length > max); }catch(e){} gi('mzStruct').textContent = structText(); gi('mzNotes').innerHTML = notesText(); App.Music.refreshLyrics(false); }
function surprise(){ var ids = ['mzGenre','mzGenreC','mzMood','mzKey','mzChords','mzBass','mzPerc','mzTex','mzSpat','mzEnergy','mzSoma','mzVocal','mzIntent','mzTheme']; ids.forEach(function(id){ var el = gi(id); if (el && el.options.length) el.selectedIndex = Math.floor(Math.random() * el.options.length); }); var bpm = gi('mzBpm'); if (bpm){ bpm.value = 40 + Math.floor(Math.random() * 141); setBpmUI(bpm.value); } try{ var _fc = gi('mzFusion'); if (_fc) _fc.checked = Math.random() < 0.45; if (_fc && _fc.checked){ var _cg = contrastGenre(val('mzGenre')); if (_cg) setVal('mzGenreC', _cg); } }catch(eF){} setVal('mzTitre', pick(BK().titles)); SM('preset', ''); SM('presetSuno', ''); var pc = gi('mzPresets'); if (pc) Array.prototype.forEach.call(pc.children, function(x){ x.classList.remove('on'); }); generate(); }
function applyPreset(i){ var ui = UI(); var pr = PRESETS_FR[i]; if (!pr) return; SM('preset', ui.presetNames[i] || pr[0]); SM('presetSuno', (pr[2] || '')); var p = pr[1]; setVal('mzGenre', p[0]); var bpm = gi('mzBpm'); if (bpm){ bpm.value = p[1]; setBpmUI(p[1]); } setVal('mzKey', p[2]); setVal('mzBass', p[3]); setVal('mzPerc', p[4]); setVal('mzTex', p[5]); setVal('mzSpat', p[6]); setVal('mzEnergy', p[7]); setVal('mzSoma', p[8]); var vo = gi('mzVocal'); if (vo && p[9] < vo.options.length) vo.selectedIndex = p[9]; var pc = gi('mzPresets'); if (pc) Array.prototype.forEach.call(pc.children, function(x){ try{ x.classList.toggle('on', String(x.dataset.i) === String(i)); }catch(e){} }); generate(); }
function effTheme(){ var f = ''; try{ f = val('mzThemeFree').trim(); }catch(e){} return f || val('mzTheme'); }
var RHYME_TXT = {fr:{rhyme:'Avec rimes',free:'Vers libres',ph:'Ton histoire pour Sofia... ex. Halloween : une sorcière perd son balai dans un cimetière, un enfant la suit avec une lanterne, etc.',hint:'Écris ton thème + ton histoire, puis « Sofia écrit » : les paroles racontent ton histoire, avec rimes ou en vers libres. Tes paroles restent toujours utilisables telles quelles.'},de:{rhyme:'Mit Reimen',free:'Freie Verse',ph:'Deine Geschichte fuer Sofia... z. B. Halloween: Eine Hexe verliert ihren Besen auf dem Friedhof, ein Kind folgt ihr mit einer Laterne usw.',hint:'Schreib Thema + Geschichte, dann Sofia schreibt: Der Song erzaehlt deine Geschichte - mit Reimen oder in freien Versen.'},en:{rhyme:'With rhymes',free:'Free verse',ph:'Your story for Sofia... e.g. Halloween: a witch loses her broom in a graveyard, a child follows her with a lantern, etc.',hint:'Write your theme + your story, then Sofia writes: the lyrics tell your story, rhymed or in free verse. Your own lyrics are always kept.'},es:{rhyme:'Con rimas',free:'Verso libre',ph:'Tu historia para Sofia... ej. Halloween: una bruja pierde su escoba en un cementerio, un nino la sigue con una linterna, etc.',hint:'Escribe tu tema + tu historia, luego Sofia escribe: la letra cuenta tu historia, con rimas o en verso libre.'},it:{rhyme:'Con rime',free:'Versi liberi',ph:'La tua storia per Sofia... es. Halloween: una strega perde la scopa nel cimitero, un bambino la segue con una lanterna, ecc.',hint:'Scrivi tema + storia, poi Sofia scrive: il testo racconta la tua storia, in rima o in versi liberi.'},pl:{rhyme:'Z rymami',free:'Wiersz wolny',ph:'Twoja historia dla Sofii... np. Halloween: czarownica gubi miotle na cmentarzu, dziecko idzie za nia z latarnia itd.',hint:'Napisz temat + historie, potem Sofia pisze: tekst opowiada twoja historie - z rymami lub wierszem wolnym.'},ja:{rhyme:'Rhyme',free:'Free verse',ph:'Story for Sofia... e.g. Halloween: a witch loses her broom, a child follows with a lantern.',hint:'Write theme + story, then Sofia writes: the lyrics tell your story, rhymed or free.'},zh:{rhyme:'Rhyme',free:'Free verse',ph:'Story for Sofia... e.g. Halloween: witch loses broom, child follows with lantern.',hint:'Write theme + story, then Sofia writes: the lyrics tell your story, rhymed or free.'},ko:{rhyme:'Rhymed',free:'Free verse',ph:'Story for Sofia... e.g. Halloween: witch loses broom, child follows.',hint:'Write theme + story, then Sofia writes: rhymed or free.'},hi:{rhyme:'Rhymed',free:'Free verse',ph:'Story for Sofia... e.g. Halloween: witch loses broom, child follows.',hint:'Write theme + story, then Sofia writes: rhymed or free.'}};
function isFreeVerse(){ try{ var e=gi('mzRhyme'); return !!(e && e.selectedIndex===1); }catch(e){ return false; } }
function rhymeKey(line){ try{ var w=String(line||'').toLowerCase().replace(/[^a-z ]/g,' ').trim().split(/\s+/); var l=w[w.length-1]||''; return l.slice(-3); }catch(e){ return ''; } }
function pickUnrhymed(pool,n){ var b=(pool||[]).slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } var out=[], used={}; for(var k=0;k<b.length && out.length<n;k++){ var key=rhymeKey(b[k]); if(used[key]) continue; used[key]=1; out.push(b[k]); } if(out.length<n){ for(var k2=0;k2<b.length && out.length<n;k2++){ if(out.indexOf(b[k2])<0) out.push(b[k2]); } } return out.slice(0,n); }
function storySnippet(mx){ try{ var st=''; try{ st=val('mzStoryFree').trim(); }catch(e){ st=''; } if(!st) return ''; var parts=st.split(/[.!?;\n]+/).map(function(x){ return x.trim(); }).filter(function(x){ return x.length>3; }); var two=parts.slice(0,2).join(' - '); if(!two) two=st; return two.slice(0,mx||90); }catch(e){ return ''; } }
function storyTag(){ try{ var st=storySnippet(90); return st ? ' - ' + st : ''; }catch(e){ return ''; } }
function localizeRhyme(){ try{ var l=uiLang(); var t=RHYME_TXT[l]||RHYME_TXT.en; var sel=gi('mzRhyme'); var keep=0; try{ keep=sel.selectedIndex; }catch(e){ keep=0; } var saved=null; try{ saved=localStorage.getItem('sofia-musique-rhyme-v1'); }catch(e){} if(saved==='free') keep=1; else if(saved==='rhyme') keep=0; if(sel && sel.options.length>1){ sel.options[0].text=t.rhyme; sel.options[1].text=t.free; try{ sel.selectedIndex=(keep===1?1:0); }catch(e){} sel.onchange=function(){ try{ localStorage.setItem('sofia-musique-rhyme-v1', sel.selectedIndex===1?'free':'rhyme'); }catch(e){} }; } var sf=gi('mzStoryFree'); if(sf){ try{ sf.placeholder=t.ph; }catch(e){} } var h=gi('mzRhymeHint'); if(h){ try{ h.textContent=t.hint; }catch(e){} } var u=STORY_TXT[l]||STORY_TXT.en; var sr=gi('mzStoryRhyme'); if(sr){ try{ sr.textContent=u.storyRhyme; }catch(e){} } var sl2=gi('mzStoryLibre'); if(sl2){ try{ sl2.textContent=u.storyFree; }catch(e){} } var tt=gi('mzTotal'); if(tt){ try{ tt.textContent=u.total; }catch(e){} } var le=gi('mzLEnding'); if(le){ try{ le.textContent=u.endingLbl; }catch(e){} } var eo=gi('mzEnding'); if(eo && eo.options.length>2){ var ek=0; try{ ek=eo.selectedIndex; }catch(e){} var esv=null; try{ esv=localStorage.getItem('sofia-musique-ending-v1'); }catch(e){} if(esv==='happy') ek=1; else if(esv==='tragic') ek=2; else if(esv==='auto') ek=0; try{ eo.options[0].text=u.endAuto; eo.options[1].text=u.endHappy; eo.options[2].text=u.endTragic; eo.selectedIndex=ek; }catch(e){} eo.onchange=function(){ try{ var vv=(eo.options[eo.selectedIndex]&&eo.options[eo.selectedIndex].value)||'auto'; localStorage.setItem('sofia-musique-ending-v1', vv); }catch(e){} }; } }catch(e){} }
function rhymeLbl(){ try{ var e=gi('mzRhyme'); if(e && e.selectedIndex===1) return (e.options[1] && e.options[1].text) || 'free verse'; return (e && e.options[0] && e.options[0].text) || 'rhymed'; }catch(e){ return 'rhymed'; } }
function copyPack(){ var hd = (HDR[songLang()] || HDR[uiLang()] || HDR.en || HDR.fr); var ver = ''; try{ ver = gi('mzSunoVer').selectedOptions[0].text; }catch(e){} var meta = null; try{ meta = BK().meta; }catch(e){} var sunoVb = ''; try{ sunoVb = sunoVocalBracket(vocalInfo().v); }catch(e){ sunoVb = shortTag(); } var voiceLine = sunoVb + (meta ? ' — chanté en ' + meta.langName + ' (' + meta.voice + ')' : ''); var src = ''; try{ src = M('lyrSrc') || ''; }catch(e){} var hasCustom = false; try{ hasCustom = !!val('mzCustom').trim(); }catch(e){} var srcLbl = (src === 'ai') ? 'paroles IA' : (hasCustom ? 'mes paroles' : 'paroles IA (\u00e0 g\u00e9n\u00e9rer)'); var txt = '\uD83C\uDFB5 ' + (val('mzTitre') || '') + ' \u2014 PACK SUNO COMPLET\n\nVOIX : ' + voiceLine + '\n\n' + hd[1] + ' (' + ver + ') :\n' + gi('mzStyle').textContent + '\n\n' + hd[2] + ' :\n' + val('mzExclude') + '\n\n' + hd[3] + ' :\n' + gi('mzStruct').textContent + '\n\n' + hd[4] + ' [' + srcLbl + ' \u00b7 th\u00e8me : ' + effTheme() + ' \u00b7 ' + rhymeLbl() + '] ' + (meta ? meta.voice : '') + ' :\n' + gi('mzLyrics').textContent; try{ clip(txt); }catch(e){} var b = gi('mzCopyPack'); if (b){ var o = b.textContent; b.textContent = '\u2713 Pack copi\u00e9 !'; setTimeout(function(){ b.textContent = o; }, 1200); } }
function copyAll(){ var ui = UI(), hd = (HDR[songLang()] || HDR[uiLang()] || HDR.en || HDR.fr); var ver = ''; try{ ver = gi('mzSunoVer').selectedOptions[0].text; }catch(e){} clip(hd[0] + ':\n' + val('mzTitre') + '\n\n' + hd[1] + ' (' + ver + '):\n' + gi('mzStyle').textContent + '\n\n' + hd[2] + ':\n' + val('mzExclude') + '\n\n' + hd[3] + ':\n' + gi('mzStruct').textContent + '\n\n' + hd[4] + ' ' + BK().meta.voice + ':\n' + gi('mzLyrics').textContent); }
function exportTxt(){ var ui = UI(), hd = (HDR[songLang()] || HDR[uiLang()] || HDR.en || HDR.fr); var ver = ''; try{ ver = gi('mzSunoVer').selectedOptions[0].text; }catch(e){} var slug = (val('mzTitre') || 'morceau').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'morceau'; var d = new Date(); function pad(n){ return String(n).padStart(2, '0'); } var txt = (val('mzTitre') || '') + '\nPack Suno — ' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' — ' + ver + '\n\n=== ' + hd[1] + ' ===\n' + gi('mzStyle').textContent + '\n\n=== ' + hd[2] + ' ===\n' + val('mzExclude') + '\n\n=== ' + hd[3] + ' ===\n' + gi('mzStruct').textContent + '\n\n=== ' + hd[4] + ' ' + BK().meta.voice + ' ===\n' + gi('mzLyrics').textContent + '\n'; var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); a.download = 'suno-' + slug + '.txt'; a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000); }
var HIST_KEY = 'sofia-musique-suno-hist-v1';
function loadHistArr(){ try{ return JSON.parse(localStorage.getItem(HIST_KEY)) || []; }catch(e){ return []; } }
function storeHistArr(h){ try{ localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 30))); }catch(e){} }
function renderHist(){ var ui = UI(); var sel = gi('mzHist'); if (!sel) return; var h = loadHistArr(); sel.innerHTML = h.length ? h.map(function(e, i){ return "<option value='" + i + "'>" + esc((e.titre || ui.emptyHist).slice(0, 40)) + '</option>'; }).join('') : '<option>' + esc(ui.emptyHist) + '</option>'; }
function saveHist(){ var ui = UI(); var h = loadHistArr(); h.unshift({ t: new Date().toISOString(), lang: songLang(), titre: val('mzTitre'), style: gi('mzStyle').textContent, struct: gi('mzStruct').textContent, lyrics: gi('mzLyrics').textContent, exclude: val('mzExclude'), ver: val('mzSunoVer') }); storeHistArr(h); var back = loadHistArr(); renderHist(); var sel = gi('mzHist'); if (sel) sel.value = '0'; var note = gi('mzHistNote'); if (note) note.textContent = (back.length ? '\u2713 ' + ui.saveHist + ' (\u00b7 ' + back.length + '/30)' : '\u26a0\ufe0f stockage local bloqu\u00e9 — sauvegarde impossible (mode priv\u00e9 ?)'); }
function loadHistSel(){ var ui = UI(); var sel = gi('mzHist'); if (!sel) return; var h = loadHistArr(); var e = h[parseInt(sel.value)]; if (!e) return; setVal('mzTitre', e.titre || ''); setVal('mzCustom', e.lyrics || ''); App.Music.setLyricMode('mine', true); try{ SM('lyrSrc', 'mine'); }catch(e){} if (e.exclude != null) setVal('mzExclude', e.exclude); if (e.ver) setVal('mzSunoVer', e.ver); generate(); }
function delHist(){ var ui = UI(); var sel = gi('mzHist'); if (!sel) return; var h = loadHistArr(); var i = parseInt(sel.value); if (isNaN(i) || !h[i]) return; h.splice(i, 1); storeHistArr(h); renderHist(); var note = gi('mzHistNote'); if (note) note.textContent = '\u2713 ' + ui.delHist + ' (\u00b7 ' + h.length + '/30)'; }
var STORY_TXT = {fr:{storyRhyme:'Histoire rimée',storyFree:'Histoire libre',endingLbl:'Fin :',endAuto:'Sofia choisit',endHappy:'Heureuse',endTragic:'Tragique',total:'La totale Suno'},de:{storyRhyme:'Geschichte mit Reimen',storyFree:'Freie Geschichte',endingLbl:'Schluss:',endAuto:'Sofia wählt',endHappy:'Glücklich',endTragic:'Tragisch',total:'Alles für Suno'},en:{storyRhyme:'Rhymed story',storyFree:'Free story',endingLbl:'Ending:',endAuto:'Sofia chooses',endHappy:'Happy',endTragic:'Tragic',total:'Full Suno pack'},es:{storyRhyme:'Historia con rima',storyFree:'Historia libre',endingLbl:'Final:',endAuto:'Sofia elige',endHappy:'Feliz',endTragic:'Trágico',total:'Pack Suno total'},it:{storyRhyme:'Storia in rima',storyFree:'Storia libera',endingLbl:'Finale:',endAuto:'Sofia sceglie',endHappy:'Lieto',endTragic:'Tragico',total:'Pack Suno totale'},pl:{storyRhyme:'Rymowana historia',storyFree:'Wolna historia',endingLbl:'Finał:',endAuto:'Sofia wybiera',endHappy:'Szczęśliwy',endTragic:'Tragiczny',total:'Pełny pakiet Suno'}};
STORY_TXT.ja=STORY_TXT.en; STORY_TXT.zh=STORY_TXT.en; STORY_TXT['zh-CN']=STORY_TXT.en; STORY_TXT.ko=STORY_TXT.en; STORY_TXT.hi=STORY_TXT.en;
function setRhyme(i){ try{ var s=gi('mzRhyme'); if(s){ s.selectedIndex=(i===1?1:0); try{ localStorage.setItem('sofia-musique-rhyme-v1', i===1?'free':'rhyme'); }catch(e){} } }catch(e){} }
async function storyRhyme(){ setRhyme(0); return writeWithSofia(); }
async function storyFree(){ setRhyme(1); return writeWithSofia(); }
async function totalSong(){ try{ var ll=gi('mzLyrLen'); if(ll && ll.options.length>1) ll.selectedIndex=1; }catch(e){} try{ await writeWithSofia(); }catch(e){} try{ generate(); }catch(e){} try{ copyPack(); }catch(e){} try{ var y=gi('mzLyrics'); if(y && y.scrollIntoView) y.scrollIntoView({block:'center'}); }catch(e){} }
async function writeWithSofia(){ setLyricMode('sofia', true); try{ await aiLyrics(); }catch(e){} try{ generate(); }catch(e){} try{ var y = gi('mzLyrics'); if (y && y.scrollIntoView) y.scrollIntoView({ block: 'center' }); }catch(e){} }
function setLyricMode(m, silent){ SM('lyrMode', m); var a = gi('mzModeAi'), b = gi('mzModeMine'); if (a) a.className = (m === 'mine') ? 'mz-ghost' : 'mz-big'; if (b) b.className = (m === 'mine') ? 'mz-big' : 'mz-ghost'; if (!silent && m === 'mine'){ var c = gi('mzCustom'); if (c){ try{ c.scrollIntoView({ block: 'center' }); }catch(eS){} try{ c.focus({ preventScroll: true }); }catch(eF){ try{ c.focus(); }catch(eF2){} } } } }
var MYTH_KEY = 'sofia-musique-mythemes-v1';
function loadMyThemes(){ try{ var a = JSON.parse(localStorage.getItem(MYTH_KEY)) || []; return a.filter(function(x){ return typeof x === 'string' && x.trim(); }).slice(0, 12); }catch(e){ return []; } }
function storeMyThemes(a){ try{ localStorage.setItem(MYTH_KEY, JSON.stringify(a.slice(0, 12))); }catch(e){} }
function saveMyTheme(v){ var a = loadMyThemes(); v = String(v).trim(); if (!v) return; a = [v].concat(a.filter(function(x){ return x !== v; })).slice(0, 12); storeMyThemes(a); setVal('mzThemeFree', v); App.Music.renderMyThemes(); }
function delMyTheme(v){ storeMyThemes(loadMyThemes().filter(function(x){ return x !== v; })); App.Music.renderMyThemes(); }
function renderMyThemes(){ var pc = gi('mzMyThemes'); if (!pc) return; pc.innerHTML = ''; var a = loadMyThemes(); if (!a.length) return; var hd = document.createElement('span'); hd.textContent = 'Mes th\u00e8mes'; hd.style.cssText = 'width:100%;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#ff9ec7;margin:6px 0 -2px'; pc.appendChild(hd); a.forEach(function(ct){ var b = document.createElement('button'); b.type = 'button'; b.title = ct + ' \u2014 cliquer pour utiliser'; b.style.borderColor = '#ff2e9a'; var lb = document.createElement('span'); lb.textContent = ct; b.appendChild(lb); b.onclick = function(){ setVal('mzThemeFree', ct); }; var x = document.createElement('span'); x.textContent = ' \u00d7'; x.title = 'Supprimer'; x.style.cssText = 'font-weight:800;margin-left:6px;color:#ff9ec7'; x.onclick = function(ev){ try{ if (ev) ev.stopPropagation(); }catch(e){} delMyTheme(ct); }; b.appendChild(x); pc.appendChild(b); }); }
function renderThemeChips(){ var pc = gi('mzThemeChips'); if (!pc) return; pc.innerHTML = ''; var cur = val('mzTheme'); BK().themes.forEach(function(t){ var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = t; btn.title = t; if (t === cur) btn.classList.add('on'); btn.onclick = function(){ setVal('mzTheme', t); Array.prototype.forEach.call(pc.children, function(x){ x.classList.remove('on'); }); btn.classList.add('on'); }; pc.appendChild(btn); }); }
async function composeSong(){ try{ var ll = gi('mzLyrLen'); if (ll && ll.options.length > 1) ll.selectedIndex = 1; }catch(e){} var mode = M('lyrMode') || 'sofia'; if (mode === 'sofia'){ if (val('mzCustom').trim()){ setLyricMode('mine', true); } else { try{ await aiLyrics(); }catch(e){} } } else { setLyricMode('mine', true); } generate(); renderThemeChips(); try{ var y = gi('mzStyle'); if (y && y.scrollIntoView) y.scrollIntoView({ block: 'start' }); }catch(e){} }
var SONG_CHANNEL = 'sofia-chansons';
var SONG_ADMIN_HASH = '04bb44deb93d0e331c908a13c8b1e6ef1fda8548312e6b198da927f71c1cf311';
function mountGallery(){
  try {
    var ctn = gi('mzGalleryCtn'); if (!ctn) return;
    var ui = UI();
    ctn.innerHTML = '';
    var com = null;
    try { com = root.commentsPlugin({ channel: SONG_CHANNEL, channelLabel: '🎵 Sofia chansons', newestCommentsAtTop: true, height: 420, forceColorScheme: 'dark', commentPlaceholderText: ui.pubPh, submitButtonText: ui.pubSend, adminPasswordHash: SONG_ADMIN_HASH }); } catch(e) { ctn.textContent = ui.pubFail; return; }
    SM('songCom', com);
    try { ctn.innerHTML = com; } catch(e2) { ctn.textContent = String(com); }
  } catch(e) {}
}
var SUNO_TRACKS = [{ t: 'Czuj Więcej — 1813Watt', id: 'adefcf2b-94fe-43fc-b3da-79078e063f3a' }, { t: 'Isabel und Valeria das gleiche Ziel — 1813Watt', id: 'ea851d4a-d933-44f0-bb2e-fd988e322cd7' }, { t: 'Sulla Riva Setosa (version 2) — 1813Watt', id: 'cdd94818-028e-4932-a9c4-87f5986a17ff' }, { t: 'Eine Frau an meiner Seite (version 2) — 1813Watt', id: 'f88c9097-2d6f-4126-8f71-5af240405497' }, { t: 'Primal Pulse — 1813Watt', id: '83456d63-684b-4188-b39e-2c2eb1043382' }, { t: 'La Rose au Beau Contour (version 2) — 1813Watt', id: '85cae89f-fa6d-46c7-a450-306d152b8293' }, { t: 'Apogé en Écho (version 2) — 1813Watt', id: 'ce4a34a9-648f-4ac2-b381-7c65a66123d2' }, { t: 'C\u0027est pour cela que je t\u0027aime si étrange version hard rock — 1813Watt', id: '72ad8415-0e85-4af7-a6c5-b1708498aa18' }, { t: 'Mi Último Imperio — 1813Watt', id: '4e90aa51-1fd5-4402-81e4-a525e7e8969f' }, { t: 'Sulla Riva Setosa — 1813Watt', id: 'd11301f0-772b-4fc7-b19b-ef74104442ba' }, { t: 'Le paradis \u2014 1813Watt', id: '83b9e3bb-423b-45a2-b04e-5e384c8c8f16' }, { t: 'C\u0027est pour cela que je t\u0027aime si \u00e9trange remix techno \u2014 1813Watt', id: '704dbbc6-b101-4435-b573-59c3eb086c17' }, { t: 'Apog\u00e9 en \u00c9cho \u2014 1813Watt', id: 'cdb82cd4-816b-4242-b68a-cadf1eb5bf83' }, { t: 'Deep G Minor Pulse \u2014 1813Watt', id: '4d3a51f1-f1aa-4e92-ad11-903b249bae93' }, { t: 'La Rose au Beau Contour \u2014 1813Watt', id: '77fecd57-8747-4f29-8ad4-c1a6a23b2d03' }, { t: 'A Rose with a Beautiful \u2014 1813Watt', id: 'ed0d5e91-7ade-45d7-911a-8017dc350b59' }, { t: 'Eine Frau an meiner Seite \u2014 1813Watt', id: 'e958bf3e-87e8-4d39-a898-060af91462c1' }, { t: 'She', mp3: 'src/music/she.mp3' }];
function renderListen(){
  try {
    var ctn = gi('mzListenCtn'); if (!ctn) return;
    ctn.innerHTML = '';
    SUNO_TRACKS.forEach(function(tr){
      var cap = document.createElement('div'); cap.className = 'mz-sub'; cap.style.fontSize = '13px'; cap.style.margin = '8px 0 4px'; cap.textContent = '\uD83C\uDFB5 ' + tr.t;
      if (tr.mp3){
        var au = document.createElement('audio');
        au.controls = true; au.preload = 'none'; au.src = tr.mp3;
        au.style.width = '100%'; au.style.margin = '4px 0 12px';
        ctn.appendChild(cap); ctn.appendChild(au);
      } else {
        var fr = document.createElement('iframe');
        fr.src = 'https://suno.com/embed/' + tr.id;
        fr.width = '100%'; fr.height = '240';
        fr.setAttribute('frameborder', '0');
        fr.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
        fr.allowFullscreen = true; fr.loading = 'lazy';
        fr.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        fr.style.width = '100%'; fr.style.border = '0'; fr.style.borderRadius = '8px';
        ctn.appendChild(cap); ctn.appendChild(fr);
      }
    });
  } catch(e) {}
}
function coverPromptText(){ var si = gi('mzCoverStyle'); var style = si ? si.value : 'Cinematic'; try{ return buildCoverPrompt(val('mzTitre') || 'Untitled', val('mzGenre'), style); }catch(e){ return { prompt: '', negative: '' }; } }
async function coverGo(){ var st = gi('mzCoverStatus'), box = gi('mzCoverOut'); var say = function(x){ if(st) st.textContent = x; }; var btn = gi('mzCoverGo'); var timer = null; try{ var b = coverPromptText(); if(!b.prompt){ say(''); return; } if(box) box.innerHTML = ''; if(btn) btn.disabled = true; var k = 0; timer = setInterval(function(){ k++; var d = ''; for(var i = 0; i < k % 4; i++) d += '.'; say('\uD83C\uDFA8' + d); }, 350); var r = await root.generateImage({ prompt: b.prompt, negativePrompt: b.negative, resolution: '768x768' }); var url = (r && r.dataUrl) || String(r || ''); if(timer) clearInterval(timer); timer = null; if(btn) btn.disabled = false; if(!url){ say(''); return; } say(''); if(box){ box.innerHTML = ''; var img = document.createElement('img'); img.src = url; img.alt = 'cover'; img.style.cssText = 'max-width:100%;border-radius:12px'; box.appendChild(img); } }catch(e){ if(timer) clearInterval(timer); if(btn) btn.disabled = false; say(''); } }
async function publishSong(){
  var ui = UI();
  var st = gi('mzPubStatus');
  var say = function(t){ if (st) st.textContent = t; };
  var title = val('mzTitre').trim(), lyrics = val('mzCustom').trim();
  if (!title || !lyrics){ say(ui.pubEmpty); return; }
  var ok = false;
  try { ok = window.confirm(ui.pubConfirm); } catch(e) { ok = true; }
  if (!ok) return;
  say(ui.aiWriting);
  var txt = '🎵 ' + title + '\n\nSTYLE:\n' + gi('mzStyle').textContent + '\n\nSTRUCTURE:\n' + gi('mzStruct').textContent + '\n\nPAROLES:\n' + lyrics;
  try {
    var com = M('songCom');
    if (!com || !com.submit) throw new Error('no-instance');
    try { if (com.setNicknameForNextComment) { var _nr = com.setNicknameForNextComment('🎵 ' + title.slice(0, 40)); if (_nr && _nr.catch) _nr.catch(function(){}); } } catch(eN) {}
    await Promise.race([com.submit(txt), new Promise(function(_, rej){ setTimeout(function(){ rej(new Error('timeout')); }, 60000); })]);
    say(ui.pubOk);
  } catch(e) { say(ui.pubFail); }
}
function refreshLyrics(force){ var ui = UI(); var c = val('mzCustom').trim(); gi('mzLyrics').textContent = c || ui.customEmpty; checker(); }
async function aiLyrics(){ var ui = UI(), bk = BK(); if (val('mzCustom').trim()){ var keep = true; try{ keep = window.confirm('Remplacer tes paroles par des paroles IA ?'); }catch(eC){ keep = true; } if (!keep) return; } var tag = sunoVoice(); var prompt = bk.aiPrompt.split('{genre}').join(val('mzGenre')).split('{theme}').join(effTheme()).split('{tag}').join(tag); prompt += '\nRhyme rule: ' + (isFreeVerse() ? 'FREE VERSE, story first: natural phrasing, no forced end rhymes, varied line lengths ok (keep 6-9 syllables per line), concrete images carry the rhythm.' : 'RHYMED STORY, story first: simple singable end rhymes (AA/BB), open vowels, never twist the story to force a rhyme.'); prompt += '\nSUNO META-TAGS (mandatory, English only, brackets with | stacking): use ONLY [Intro], [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Post-Chorus], [Hook], [Bridge], [Interlude], [Break], [Outro], [Instrumental], [Instrumental Break], [Guitar Solo], [Piano Solo], [Drum Solo], [Percussion Break], [Drum Break], [Drum Drop], [Bass Solo], [Sax Solo], [Saxophone Solo], [Synth Solo], [Synthesizer Solo], [Drum Fill], [Breakdown], [Bagpipe Solo], [Accordion Interlude], [Verse], [Male Vocal], [Female Vocal], [Duet], [Choir], [Harmonies], [Layered Vocals], [Ad-lib], [Call and Response], [Background Harmonies], [Whispered Backing], [Echoing Vocals], [Whisper], [Whispered], [Spoken Word], [Belted], [Falsetto], [Screaming], [Shout], [Gospel Choir], [Child Vocal], [Echo], [Vocal Echo], [Delay], [Reverb], [Whispered Echo], [Build], [Build-up], [Drop], [Bass Drop], [Tempo Drop], [Half-time], [Double-time], [Slowdown], [Stripped Back], [Acoustic], [Key Change], [Modulation], [Fade Out], [Cold End], [Abrupt Ending], [Silence], [Stop], [Pause], [A Cappella], [Applause], [Crowd Cheering], [Anthemic], [Euphoric]. Example: [Verse 1 | ' + tag + '], [Pre-Chorus | Build-up], [Chorus | Choir | Layered Harmonies], [Bridge | Stripped Back | Whispered], [Final Chorus | Choir | Anthemic], [Outro | Fade Out | Echo]. NEVER use French tags like [Couplet], [Refrain], [Pont], [Pré-refrain], [Final]. NEVER use "—" or ":" inside brackets, use " | ".';
  prompt += '\nBE EXCEPTIONAL — SURPRISE MOMENTS (mandatory, rotate, never the same twice): (1) SOLO: after the 2nd chorus insert exactly ONE solo bracket fitting {genre} — rock=Guitar Solo/Drum Fill/Breakdown, metal=Drum Solo/Drum Fill, jazz/blues=Sax Solo, edm=Synth Solo or Drum Drop, hiphop=Percussion Break or Drum Drop, pop=Guitar Solo or Piano Solo, reggae/afro=Percussion Break. (2) DUET: in 1 song out of 3, make Verse 2 a duet ([Verse 2 | Duet] or [Verse 2 | Call and Response]) so a 2nd voice enters. (3) VOICE: Chorus 2 differs from Chorus 1 (Choir vs Call and Response vs Ad-lib vs Whispered); Bridge is a fragile voice solo ([Bridge | Stripped Back | Whispered/Spoken Word/Falsetto]) ending \u2026 (echo\u2026). (4) LIFT: in 1 song out of 3, insert before the Final Chorus alone on its line: [Key Change] (pop/rock), [Double-time] or [Tempo Drop] (edm/hiphop), [Half-time] (rock/metal). (5) STOP-BREAK: in 1 song out of 4, insert [Break | Silence] alone on its line right before the Final Chorus, then the final hits harder. (6) OUTRO — 3 faces, pick ONE: usually [Outro | Fade Out | Echo] ending \u2026 (echo fading\u2026); sometimes brutal [Outro | Cold End] ending directly on a sung chorus line with NO fade line; sometimes [Outro | A Cappella] ending on one naked voice line. ECHO MASTERY: Final Chorus adds one ad-lib line (oh-oh\u2026). Brackets stand alone on their own lines; lyric lines NEVER contain brackets.' +
  '\nPRO VOCAL DELIVERY (mandatory, use at least TWO every song): (1) CAPS = vocal intensity — write the 1-2 climax lines of the Final Chorus in ALL CAPS (e.g. I WILL NEVER LET YOU GO). (2) PARENS = vocal layers — add backing harmonies in parentheses on 2-4 lines (e.g. You hold me (always and forever)). (3) SFX = living scene — add one or two *sound effects* on their own (e.g. *wind blowing*, *rain falling*, *distant thunder*, *soft drumroll*, *crowd cheering*), plus matching tags like [Background Harmonies] or [Whispered Backing]. (4) STRETCH = raw emotion — stretch one key vowel once per song (e.g. lo-o-o-ove, free-ee).'; +
  '\nDYNAMICS (mandatory): shape a crescendo through every Pre-Chorus into the Chorus; verses stay intimate and stripped, choruses explode.';
  try{ if (fusionOn()){ var _gV = genreV(), _gC = genreC(), _grV = fusionGroove(_gV), _grC = fusionGroove(_gC); if (_gC && _gC !== _gV) prompt += '\nFUSION 2 STYLES \u2014 FULL-SONG MIX (MANDATORY, surprise me): verses are ' + _gV + ' (' + (_grV || 'own groove') + '), choruses are ' + _gC + ' (' + (_grC || 'own groove') + '). Mix BOTH styles in ONE song, never two songs glued: tag every verse [Verse N | ' + tag + ' | ' + _gV + '], every chorus [Chorus | Choir | Layered Harmonies | ' + _gC + '], the pre-chorus [Pre-Chorus | Build-up | ' + _gV + ' to ' + _gC + ' transition], the bridge [Bridge | Stripped Back | Whispered | ' + _gV + ' x ' + _gC + ' fusion] (sing half in each style), the final chorus [Final Chorus | Choir | Anthemic | ' + _gV + ' x ' + _gC + ' fusion]. Contrast energies: darker stripped verses, explosive choruses, plus one Sofia surprise (unexpected stop, key change, or whispered break).'; } }catch(eF){}
  prompt += '\nSTORY ARC — A REAL SHORT STORY IN A SONG (mandatory): the lyrics must tell ONE complete condensed story like a "nouvelle": (1) EXPOSITION — Verse 1: who, where, when. One concrete image, names and places allowed, zero abstraction. (2) TENSION — Pre-Chorus: desire vs obstacle, something urgent at stake. (3) THESIS — Chorus: the emotional core of the story in simple singable words, repeated and slightly varied, never decorative. (4) COMPLICATION — Verse 2: NEW facts only, never repeat Verse 1; stakes rise, time runs out. (5) REVELATION — Bridge: the fragile truth, the twist seed, whispered (a hummed bridge, mm-mm-mm, is allowed once in a while). (6) CHUTE — Final Chorus + Outro: a real ending, either TRAGIC (loss, farewell, death, irreversible choice — a devastating last line) or LUMINOUS and MAGNIFICENT (reunion, salvation, dawn, transcendence — a breathtaking last line). Choose the chute that fits the theme and mood; never a flat moral, never a lecture. The very last lyric line must land like the final sentence of a great short story. Continuity: same characters and places throughout, concrete nouns, no filler lines. If a rhyme would force an unnatural sentence, drop the rhyme — story first.';
  prompt += '\nOPENING INTRO (mandatory): start the lyrics with [Intro] on its own line, then 1-2 whispered scene-setting lines (place, character, moment) that open the story like the first page of a novel. Never start directly with Verse 1.';
var endMode = 'auto'; try{ endMode = val('mzEnding'); }catch(eEM){}
if (endMode === 'happy') prompt += '\nCHUTE IMPOSED - HAPPY ENDING (mandatory): the Final Chorus + Outro MUST end luminous and magnificent (reunion, salvation, dawn, transcendence) with a breathtaking last line. No tragedy, no farewell.';
else if (endMode === 'tragic') prompt += '\nCHUTE IMPOSED - TRAGIC ENDING (mandatory): the Final Chorus + Outro MUST end tragic (loss, farewell, death, irreversible choice) with a devastating last line. No happy rescue.';
var story = ''; try{ story = val('mzStoryFree').trim().slice(0, 1500); }catch(eS){ story = ''; }
  if (story) prompt += '\nUSER STORY (use its characters, setting and events as the lyrics\u2019 backbone, in the song language):\n' + story; gi('mzLyrics').textContent = ui.aiWriting; try{ var res = await App.Core.generateText({ instruction: prompt, onChunk: function(d){ try{ var c = (d && (d.fullTextSoFar || d.textChunk)) || ''; if (c) gi('mzLyrics').textContent = c; }catch(e){} } }); var txt = String((res && res.text) || '').trim(); if (txt){ gi('mzLyrics').textContent = txt; setVal('mzCustom', txt); setLyricMode('mine', true); try{ SM('lyrSrc', 'ai'); }catch(e){} } checker(); }catch(e){ gi('mzLyrics').textContent = ui.aiFail + '\n\n' + lyricsText(); checker(); } }
function wrapLyrics(){ var ui = UI(); var vb = sunoVoice(), chTag = sunoChorus(); var gVw = genreV(); var gCw = fusionOn() ? genreC() : genreV(); var fusW = (gCw !== gVw); var raw = val('mzCustom').trim() || gi('mzLyrics').textContent.trim(); if (!raw) return; var lines = raw.split('\n').map(function(s){ return s.trim(); }).filter(function(s){ return s && !/^\[.+\]$/.test(s); }); if (!lines.length) return; var out = ''; if (lines.length <= 4) out = (fusW ? sunoJoin(SUNO_STRUCT.v1, vb, gVw) : sunoJoin(SUNO_STRUCT.v1, vb)) + '\n' + lines.join('\n'); else if (lines.length <= 8) out = (fusW ? sunoJoin(SUNO_STRUCT.v1, vb, gVw) : sunoJoin(SUNO_STRUCT.v1, vb)) + '\n' + lines.slice(0, 4).join('\n') + '\n\n' + (fusW ? sunoJoin(SUNO_STRUCT.ch, chTag, gCw) : sunoJoin(SUNO_STRUCT.ch, chTag)) + '\n' + lines.slice(4).join('\n'); else out = (fusW ? sunoJoin(SUNO_STRUCT.v1, vb, gVw) : sunoJoin(SUNO_STRUCT.v1, vb)) + '\n' + lines.slice(0, 4).join('\n') + '\n\n' + (fusW ? sunoJoin(SUNO_STRUCT.ch, chTag, gCw) : sunoJoin(SUNO_STRUCT.ch, chTag)) + '\n' + lines.slice(4, 8).join('\n') + '\n\n' + (fusW ? sunoJoin(SUNO_STRUCT.v2, vb, gVw) : sunoJoin(SUNO_STRUCT.v2, vb)) + '\n' + lines.slice(8).join('\n'); setVal('mzCustom', out); setLyricMode('mine', true); try{ SM('lyrSrc', 'mine'); }catch(e){} gi('mzLyrics').textContent = out; checker(); }
function editLyrics(){ var ui = UI(); var t = gi('mzLyrics').textContent; setVal('mzCustom', t); setLyricMode('mine', true); checker(); var c = gi('mzCustom'); if (c){ try{ c.focus(); }catch(e){} } }
function triad(){ var a = (val('mzTrigA') || 'sombre').trim(), b = (val('mzTrigB') || 'ouvre').trim(), c = (val('mzTrigC') || 'br\u00fble').trim(); return { a: a, b: b, c: c }; }
function triHash(t){ var s = t.a + '|' + t.b + '|' + t.c, h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function friction(){ var t = triad(); var h = triHash(t); var f = 30 + (h % 61); var distinct = {}; distinct[t.a.toLowerCase()] = 1; distinct[t.b.toLowerCase()] = 1; distinct[t.c.toLowerCase()] = 1; var n = Object.keys(distinct).length; if (n < 3) f -= 15; var el = gi('mzFriction'); if (el) el.innerHTML = 'triade <b>' + esc(t.a) + ' \u00b7 ' + esc(t.b) + ' \u00b7 ' + esc(t.c) + '</b> — 120\u00b0<br>friction ' + f + '/100 \u00b7 spirale \u2192 porte HSP90 \u2192 projection'; return f; }
function maStyle(v, bpm, m1, m2, f){ var heat = f > 66 ? 'air heurt\u00e9, frapp\u00e9 des trois c\u00f4t\u00e9s' : (f > 33 ? 'air tendu entre les tractions' : 'air laiss\u00e9 large, \u00e0 peine troubl\u00e9'); return 'm\u00e9lancolie ' + v.genre + ', ' + bpm + ' BPM senti comme pouls sous la peau, ' + m1 + ', ' + m2 + ', ' + heat + ', sans paroles chant\u00e9es'; }
function storyBrackets(i, n, ctx){ var green2 = 'vert veut dire encore, jaune ralentit, rouge stoppe tout'; var wlist = (ctx.words || []).map(function(w, k){ return (k + 1) + ':' + String(w).split(' — ')[0]; }).join(' > '); var spiral = '[Triade : ' + ctx.tri.a + ' x ' + ctx.tri.b + ' x ' + ctx.tri.c + ' — 120 degr\u00e9s][Spirale : ' + wlist + '][Porte : pli HSP90 — ' + ctx.gate + '][Projection vers avant]'; var body = '[Combat somatique : ' + ctx.combat.pair + ' — friction ' + ctx.combat.force + '][Vide Ma : ' + ctx.maV + '][Racine : ' + ctx.root + ']'; var head = (i === 0) ? ('[Intro : ' + ctx.bpm + ' BPM — ' + ctx.beat + '][Seuil : ' + ctx.god + ' regarde, ' + ctx.mania + ' commence][Transe : ' + ctx.tri.a + ' / ' + ctx.tri.b + ' / ' + ctx.tri.c + ' — ' + ctx.nlp + ']') : ('[Chapitre : ' + ctx.bpm + ' BPM — ' + ctx.beat + '][Possession : ' + ctx.god + ', ' + ctx.mania + '][Transe : ' + ctx.nlp + ']'); var tail = (i === n - 1) ? ('[Apaisement : poids chaud, eau, couverture][Forme ouverte : ' + ctx.geo + ' ' + ctx.site + '][Final : fondu sub tenu]') : ('[Forme : ' + ctx.geo + ' ' + ctx.site + '][Explosion : d\u00e9ferlante sentie dans le corps]'); return ((ctx.sung ? '[Paroles chantées]' : '[Instrumental, sans paroles chant\u00e9es, sans voix]') + '\n' + head + '\n' + spiral + '\n' + body + '\n' + tail); }
var SOMA27 = ['plantes','chevilles','poplit\u00e9','int\u00e9rieur cuisses','plancher pelvien','sacrum','p\u00e9rin\u00e9e','pli fessier','bas-ventre','lombaires','plexus solaire','diaphragme','intercostaux','sternum','pectoraux','omoplates','clavicules','gorge','cervicales','m\u00e2choire','l\u00e8vres','nasal','temporal','occiput','sommet','poignets-paume','doigts'];
var BRANCH5 = ['R1 racine 1-5 ancre sous-pelvienne','R2 tronc 6-11 pompe visc\u00e9rale','R3 anneau 12-17 bois agoniste','R4 \u00e9corce 18-22 coque dissidente','R5 canop\u00e9e 23-27 feuilles apex'];
function combatPair(i, seed){ var k = (seed + i * 5) % 27; var k2 = (k + 13) % 27; return { k: k + 1, k2: k2 + 1, pair: SOMA27[k] + ' vs ' + SOMA27[k2], v1: 'V' + (k + 1) + '/32', v2: 'V' + (k2 + 1) + '/32', force: '100/117', branch: BRANCH5[Math.min(4, Math.floor(k / 5.5))] }; }
function nineWords(seed){ var pool = JOURNEY_FR.doubles.slice(); var h = seed >>> 0; var arr = pool.slice(); for (var i = arr.length - 1; i > 0; i--){ h = (h * 1103515245 + 12345) >>> 0; var j = h % (i + 1); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; } return arr.slice(0, 9); }
function drawGeo(trackWords){ var cv = gi('mzGeo'); if (!cv) return; var x = cv.getContext('2d'), t = triad(), f = friction() / 100; var W = cv.width, H = cv.height; x.fillStyle = '#000'; x.fillRect(0, 0, W, H); var cx = W / 2, cy = H / 2 + 12, R = Math.min(W, H) * 0.36; var hue = (f * 120) % 360; var angs = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6]; var labels = [t.a, t.b, t.c]; var pts = angs.map(function(a){ return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; }); x.strokeStyle = 'hsla(' + hue + ',60%,40%,.5)'; x.lineWidth = 1; x.beginPath(); pts.forEach(function(p, i){ if (i === 0) x.moveTo(p[0], p[1]); else x.lineTo(p[0], p[1]); }); x.closePath(); x.stroke(); pts.forEach(function(p, i){ x.fillStyle = 'hsla(' + hue + ',95%,65%,1)'; x.beginPath(); x.arc(p[0], p[1], 5, 0, 7); x.fill(); x.fillStyle = '#efe9ff'; x.font = '12px sans-serif'; x.fillText(labels[i], Math.min(Math.max(p[0] - 20, 4), W - 60), p[1] - 10); }); x.strokeStyle = 'hsla(' + hue + ',100%,65%,.9)'; x.lineWidth = 1.6; x.beginPath(); var steps = 200; for (var s = 0; s <= steps; s++){ var th = s * 0.075; var r = R * (1 - s / (steps * 0.9)); var px = cx + Math.cos(th) * r, py = cy + Math.sin(th) * r * 0.72; if (s === 0) x.moveTo(px, py); else x.lineTo(px, py); } x.stroke(); x.fillStyle = '#b9aef5'; x.font = '11px sans-serif'; x.fillText('triade \u00e9quilat\u00e9rale \u00b7 spirale \u00b7 porte HSP90 \u2192 projection', 8, 16); var words = trackWords || nineWords(triHash(t)); x.fillStyle = '#8f86c9'; words.slice(0, 9).forEach(function(w, i){ x.fillText((i + 1) + ':' + String(w).split(' — ')[0], 8 + (i % 3) * 150, H - 34 + Math.floor(i / 3) * 12); }); }
function drawTree(pairs, lift){ var cv = gi('mzTree'); if (!cv) return; var x = cv.getContext('2d'); var W = cv.width, H = cv.height; x.fillStyle = '#000'; x.fillRect(0, 0, W, H); var cx = W / 2, base = H - 14; x.strokeStyle = '#5a4a9a'; x.lineWidth = 10 - Math.min(6, lift); x.beginPath(); x.moveTo(cx, base); x.lineTo(cx, 70); x.stroke(); x.lineWidth = 2; var zones = ['RACINE 1-5', 'TRONC 6-11', 'ANNEAU 12-17', 'ECORCE 18-22', 'CANOP\u00c9E 23-27']; zones.forEach(function(z, j){ var y = base - 14 - j * 30; x.strokeStyle = 'hsla(' + (280 - j * 22) + ',80%,' + (55 + j * 4) + '%,.9)'; x.beginPath(); x.moveTo(cx - 70 + j * 6, y); x.lineTo(cx + 70 - j * 6, y - 14); x.stroke(); x.fillStyle = '#efe9ff'; x.font = '11px sans-serif'; x.fillText(z, 8, y - 4); }); x.fillStyle = '#b9aef5'; x.font = '11px sans-serif'; x.fillText('mont\u00e9e arborescente \u00b7 ' + pairs.slice(0, 3).map(function(p){ return p.pair; }).join(' / '), 8, 14); }
async function aiStory(n){ var J = JOURNEY_FR; var god = val('mzGod'), mania = val('mzMania'), t = triad(), f = friction(); var beats = J.ritual.slice(0, n).map(function(v){ return v.arc + ' (' + v.genre + '): ' + v.primal; }).join('\n'); var task = 'T\u00c2CHE : \u00c9cris ' + n + ' temps forts num\u00e9rot\u00e9s, en fran\u00e7ais, 1-2 phrases chacun, non-explicites, consentis. Voix : ' + god + '. Mania : ' + mania + '. Triade ' + t.a + ' / ' + t.b + ' / ' + t.c + '. Sortie : temps num\u00e9rot\u00e9s uniquement.'; var prompt = 'Tu \u00e9cris une histoire musicale en fran\u00e7ais : tout public, \u00e9motion sinc\u00e8re, jamais vulgaire.\nMORCEAUX :\n' + beats + '\n' + task; gi('mzStory').innerHTML = '<i>\u2728 IA…</i>'; try{ var res = await App.Core.generateText({ instruction: prompt, onChunk: function(d){ try{ var c = (d && (d.fullTextSoFar || d.textChunk)) || ''; if (c) gi('mzStory').innerHTML = '<b>HISTOIRE IA :</b><br>' + esc(c).replace(/\n/g, '<br>'); }catch(e){} } }); var txt = String((res && res.text) || ''); gi('mzStory').innerHTML = '<b>HISTOIRE IA :</b><br>' + esc(txt).replace(/\n/g, '<br>'); return txt.split('\n').map(function(s){ return s.replace(/^\d+[\)\.:]\s*/, '').trim(); }).filter(Boolean); }catch(e){ gi('mzStory').innerHTML = '<b>IA indisponible.</b>'; return []; } }
async function genJourney(useAI){ var J = JOURNEY_FR; var n = parseInt(val('mzTrackCount')) || 5; var god = val('mzGod'), mania = val('mzMania'), t = triad(), f = friction(); var beats = useAI === false ? [] : await aiStory(n); var sung = false; try { sung = !!(gi('mzSung') && gi('mzSung').checked); } catch (eSg) {} var _fullRock = false; try { _fullRock = /rock|m.tal|guitare|guitar|metal|grunge|screamo|shoegaze|djent|grind|mathcore|coldwave|dark wave/i.test(val('mzGenre')); } catch (eFR) {} if (!beats.length){ for (var i = 0; i < n; i++){ var v0 = J.ritual[i % J.ritual.length]; beats.push(((_fullRock && v0.primalRock) ? v0.primalRock : v0.primal) + ' — sous le regard de ' + god.split(' — ')[0]); } } var phases = J.phases.slice(); while (phases.length < n) phases = phases.concat(phases); var nlpPool = val('mzNlp').split('/').map(function(s){ return s.trim(); }).filter(Boolean); var out = '', pairs = []; for (var i = 0; i < n; i++){ var ph = phases[i % phases.length]; var nlp = nlpPool.length ? nlpPool[i % nlpPool.length] : 'laisse-toi sombrer'; var words = nineWords(triHash(t) + i * 101 + 7); var gate = (i === n - 1) ? 'lib\u00e9ration apais\u00e9e finale' : ('pli chaperon HSP90 ' + (i + 1) + '/' + n); var combat = combatPair(i, triHash(t)); pairs.push(combat); var maV = pick(J.maVoids), rootP = pick(J.roots); var geo = pick(J.geo), site = pick(J.sites); var ma1 = pick(J.maSpaces), ma2 = pick(J.maSpaces); var v = J.ritual[i % J.ritual.length]; try { var _sg = val('mzGenre') || '', _sb = parseInt(val('mzBpm')) || 0; if ((_fullRock || /rock|m.tal|guitare|guitar|grunge|screamo|shoegaze|djent|grind|mathcore|coldwave|dark wave/i.test(v.genre || '')) && /rock|m.tal|guitare|guitar|metal|grunge|screamo|shoegaze|djent|grind|mathcore|coldwave|dark wave/i.test(_sg) && _sg !== v.genre) { v = Object.assign({}, v, { genre: _sg }); if (_sb >= 100 && _sb <= 200) v.bpm = _sb; v._sel = true; } } catch (eSg) {} var snd = J.geo2sound[geo] || ['ligne de basse puls\u00e9e roulante']; var bpm = v.bpm + Math.round((f / 100) * 8) + (i === n - 1 ? -6 : 0); var style = maStyle(v, bpm, ma1, ma2, f); try { if (/rock|m.tal|guitare|guitar|grunge|screamo|shoegaze|djent|grind|mathcore|coldwave|dark wave/i.test(v.genre || '')) style = style.replace(/^m[^ ]+ /, 'rage '); } catch (eRg) {} try { if (sung) { var _vt = ''; try { _vt = shortTag(); } catch(eV){} style = style.replace(/sans paroles chantées/, _vt ? ('paroles chantées : ' + _vt) : 'paroles chantées'); } } catch (eSg2) {} if (style.length > 200) style = style.slice(0, 197) + '...'; try { if (v._sel) { var _pn = ''; try { _pn = M('preset') || ''; } catch (eP) {} if (_pn) style += ' · preset « ' + _pn + ' »'; } } catch (ePm) {} var struct = storyBrackets(i, n, { bpm: bpm, geo: geo, nlp: nlp, site: site, snd: snd, beat: beats[i % beats.length], sung: sung, god: god.split(' — ')[0], mania: mania, f: f, tri: t, words: words, gate: gate, combat: combat, maV: maV, root: rootP }); try { if (sung) { var _raw = ''; try { _raw = gi('mzLyrics').textContent || ''; } catch(eLR){} var _vl = _raw.split('\n').map(function(s){ return s.trim(); }).filter(function(s){ return s && s[0] !== '[' && s[0] !== '('; }); if (!_vl.length) { try { _vl = lyricsText().split('\n').map(function(s){ return s.trim(); }).filter(function(s){ return s && s[0] !== '[' && s[0] !== '('; }); } catch(eLG){} } if (_vl.length) { var _tg2 = ''; try { _tg2 = shortTag(); } catch(eT2){} var _take = []; for (var _k = 0; _k < 4; _k++) _take.push(_vl[(i * 4 + _k) % _vl.length]); struct += '\n[Paroles' + (_tg2 ? ' — ' + _tg2 : '') + ']\n' + _take.join('\n'); } } } catch(eSu) {} out += 'MORCEAU ' + (i + 1) + ' \u00b7 ' + String(ph).toUpperCase() + ' — ' + v.arc + ' \u00b7 friction ' + f + '\nTRIADE : ' + t.a + ' x ' + t.b + ' x ' + t.c + '\nSTYLE : ' + style + '\nSTRUCTURE :\n' + struct + '\n\n'; } gi('mzJourney').textContent = out.trim(); gi('mzChain').textContent = 'CHA\u00ceNE : triade ' + t.a + ' x ' + t.b + ' x ' + t.c + ' \u2192 ' + (sung ? n + ' morceaux chantés.' : n + ' instrumentaux.'); drawGeo(nineWords(triHash(t) + 7)); gi('mzBody').innerHTML = pairs.map(function(p, i){ return 'T' + (i + 1) + ': ' + esc(p.pair) + ' \u2192 ' + esc(p.branch); }).join('<br>'); drawTree(pairs, f / 25); }
/* ---- Ronde musique-chat : une demande de chanson dans la fenêtre principale
   utilise le mode musique (banques procédurales fr/en/de/es/it/pl) et rapatrie
   le pack Suno (Style + Structure + Paroles) directement dans le chat. */
var SONGBANK_NAMES = {
pl: ["polonais","polonaise","polish","polski","polska","polskie","polsku","polszczyzna","polnisch","polaco","polacco"],
fr: ["francais","français","francaise","française","french","franzosisch","französisch","frances","francés","francese","francusku","francuski","francuska","francuskie"],
en: ["anglais","anglaise","english","englisch","ingles","inglese","angielsku","angielski","angielska","angielskie"],
de: ["allemand","allemande","german","deutsch","aleman","tedesco","niemiecku","niemiecki","niemiecka","niemieckie"],
es: ["espagnol","espagnole","spanish","spanisch","espanol","español","spagnolo","hiszpansku","hiszpanski","hiszpanska","hiszpanskie"],
it: ["italien","italienne","italian","italienisch","italiano","italiana","wlosku","wloski","wloska","wloskie"],
ja: ["japonais","japonaise","japanese","japanisch","japones","giapponese","japonsku","japonski","japonska","japonskie","nihongo","nihon","japan","にほんご","にほん","日本語","日文","日语"],
zh: ["chinois","chinoise","chinese","chinesisch","chino","cinese","chinsku","chinski","chinska","chinskie","mandarin","putonghua","zhongwen","hanyu","guoyu","huayu","中文","普通话","國語","国语","華語","华语","漢語","汉语"],
ko: ["coreen","coreenne","korean","koreanisch","coreano","coreana","koreansku","koreanski","koreanska","koreanskie","hangugeo","hangugmal","hangul","한국어","한국말","한글"],
hi: ["hindi","hindie","hindou","hindoue","hindoustani","hindustani","indien","indienne","hind","hindoustan","हिन्दी","हिन्दुस्तानी","हिंदू"],
sq: ["albanais","albanaise","albanian","shqip","shqipe","albanisch","albanes","albanese"],
pt: ["portugais","portugaise","portuguese","portugues","portugiesisch","portoghese"],
ru: ["russe","russian","russisch","ruso","russo","rosyjsku","rosyjski"],
ar: ["arabe","arabic","arabisch","arabo"],
tr: ["turc","turque","turkish","turkisch","turco","turecku","turecki"],
nl: ["neerlandais","neerlandaise","dutch","nederlands","hollandais","niederlandisch","olandese"],
el: ["grec","grecque","greek","griechisch","griego","greco"],
ro: ["roumain","roumaine","romanian","rumano","rumeno","rumunsku"],
uk: ["ukrainien","ukrainienne","ukrainian","ucraniano","ucraino"],
sv: ["suedois","suede","swedish","schwedisch","sueco","svedese"]
};
function songNorm(s){ return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function songTargetLang(text){
  var n = " " + songNorm(text) + " ";
  var nraw = " " + String(text || "") + " ";
  var codes = ["pl","fr","en","de","es","it","ja","zh","ko","hi","sq","pt","ru","ar","tr","nl","el","ro","uk","sv"];
  var CJKJ = ["にほんご","にほん","日本語","日文","日语"];
  var CJKZ = ["中文","普通话","國語","国语","華語","华语","漢語","汉语"];
  var CJKK = ["한국어","한국말","한글"];
  if (CJKJ.some(function(w){ return nraw.indexOf(w) >= 0; })) return "ja";
  if (CJKZ.some(function(w){ return nraw.indexOf(w) >= 0; })) return "zh";
  if (CJKK.some(function(w){ return nraw.indexOf(w) >= 0; })) return "ko";
  if (/[\u0900-\u097F]/.test(nraw)) return "hi";
  var SONGN = "(?:chanson|song|lied|piosenk|utwor|musique|music|muzyk|cancion|canzone|brano|lyrics|paroles|piosenka)\\w*";
  for (var k = 0; k < codes.length; k++){
    var names = SONGBANK_NAMES[codes[k]];
    for (var i = 0; i < names.length; i++){
      var w = songNorm(names[i]);
      if (new RegExp("(en|in)\\s+(langue|language|lingua|sprache|lengua|jezyk)\\s+" + w).test(n)) return codes[k];
      if (new RegExp("(^|\\W)(en|in|auf|po|em|na)\\s+" + w + "\\w*(\\W|$)").test(n)) return codes[k];
      if (new RegExp("\\b" + SONGN + "\\s+" + w + "\\w*").test(n)) return codes[k];
      if (new RegExp("\\b" + w + "\\w*\\s+" + SONGN).test(n)) return codes[k];
    }
  }
  var vm = n.match(/(?:la\s+|en\s+)?version\s+(francaise|anglaise|allemande|espagnole|italienne|polonaise|portugaise|russe|arabe|turque|neerlandaise|grecque|roumaine|ukrainienne|suedoise|albanaise|chinoise|japonaise|coreenne|indienne|hindoue|hindi|hindie|hindou|fr|en|de|es|it|pl|hi|sq|pt|ru|ar|tr|nl|el|ro|uk|sv)\b/);
  if (vm) { var vv = vm[1]; if (/^fr/.test(vv)) return "fr"; if (/^anglaise$|^en$/.test(vv)) return "en"; if (/^allemande$|^de$/.test(vv)) return "de"; if (/^espagnole$|^es$/.test(vv)) return "es"; if (/^italienne$|^it$/.test(vv)) return "it"; if (/^polonaise$|^pl$/.test(vv)) return "pl"; if (/^indienne$|^hindoue$|^hindi$|^hindie$|^hindou$|^hi$/.test(vv)) return "hi"; if (/^albanaise$|^sq$/.test(vv)) return "sq"; if (/^portugaise$|^pt$/.test(vv)) return "pt"; if (/^russe$|^ru$/.test(vv)) return "ru"; if (/^arabe$|^ar$/.test(vv)) return "ar"; if (/^turque$|^tr$/.test(vv)) return "tr"; if (/^neerlandaise$|^nl$/.test(vv)) return "nl"; if (/^grecque$|^el$/.test(vv)) return "el"; if (/^roumaine$|^ro$/.test(vv)) return "ro"; if (/^ukrainienne$|^uk$/.test(vv)) return "uk"; if (/^suedoise$|^sv$/.test(vv)) return "sv"; }
  return null;
}
var SONG_VERBS = "cree\\w*|crea\\w*|compose\\w*|compos\\w*|ecris|ecriv\\w*|chante\\w*|fais\\w*|fait\\w*|fair\\w*|donn\\w*|gener\\w*|make\\w*|creat\\w*|sing\\w*|write\\w*|writ\\w*|canta\\w*|escrib\\w*|escriv\\w*|scriv\\w*|scrivi|compon\\w*|haz\\w*|fammi|fai|napisz|stworz|skomponuj|utworz|zrob|wymysl|spiewaj|zaspiewaj|uloz|banao|banaiye|likho|gao|sunao|rache";
var SONG_NOUNS = "lied\\w*|songs?|musik\\w*|melod\\w*|chanson\\w*|musique\\w*|morceau\\w*|music\\w*|tunes?|anthem\\w*|cancion\\w*|canzone\\w*|brano\\w*|paroles\\w*|lyrics|piosenk\\w*|utwor\\w*|muzyk\\w*|kawalek|kawalka|kawalki|szlagier\\w*|hymn\\w*|gana|gan[ae]|geet|sangeet|dhun";
function isSongRequest(text){
  var t = String(text || "").trim();
  if (!t || t.length > 2000) return false;
  var head = t.length > 600 ? t.slice(0, 600) : t;
  var n = " " + songNorm(head) + " ";
  var nraw = " " + head + " ";
  if (/traduis|traduire|traduction|translate|ubersetz|traduc|przetlumacz|tlumacz/i.test(n)) return false;
  if (/cours|lecon|apprendre|apprends|learn|unterricht|lekcj|naucz/i.test(n)) return false;
  if (/comment|dit-on|how do you say|veut dire|what does|co to znaczy|jak sie mowi/i.test(n)) return false;
  if (/(cette|ce|cet|this|that|ten|ta|to)\s+(phrase|texte|mot|text|word|zdanie|slowo)/i.test(n)) return false;
  if (/翻訳|翻译|번역|課程|课程|授業|レッスン|수업|教えて|教我|어떻게 말해|どう言う|怎么说|怎麼說/.test(nraw)) return false;
  if (/(この|その|这个|這個|이|그|저)\s*(歌詞|歌词|가사)/.test(nraw)) return false;
  if (/聴かせて|聞かせて|かけて|流して|播放|听歌|聽歌|放一首|틀어줘|재생|[^만]들어줘/.test(nraw)) return false;
  if (/बजाओ|बजाइए|चलाओ|प्ले करो/.test(nraw)) return false;
  if (/\bsuno\b/i.test(n) && new RegExp(SONG_VERBS + "|musique|music|chanson|song|piosenk|muzyk").test(n)) return true;
  if (/(mets?|joue|jouer|lance|lancer|ecoute|ecouter|listen|sluchaj|posluchaj|odtworz|puszcz|wlacz)\b[^?!;]{0,30}\b(chanson|musique|music|piosenk|song)\b/i.test(n)) return false;
  if (new RegExp("\\b(" + SONG_VERBS + ")\\b[^?!;]{0,40}\\b(" + SONG_NOUNS + ")\\b").test(n)) return true;
  var CJKV = "作って|作る|書いて|書く|歌って|歌う|創って|創る|作曲|创作|創作|作詞|作词|编曲|編曲|写|寫|唱|编|編|来一首|來一首|만들어줘|만들어|써줘|지어줘|불러줘|작곡해줘|작곡|지어|써|불러";
  var CJKN = "メロディー|メロディ|音楽|ソング|歌曲|歌|曲|音乐|音樂|曲子|旋律|멜로디|음악|노래|곡";
  if (new RegExp("(" + CJKV + ")[^?!;。！？]{0,40}(" + CJKN + ")|(" + CJKN + ")[^?!;。！？]{0,40}(" + CJKV + ")").test(nraw)) return true;
  var HIV = "बनाओ|बनाइए|बना दो|लिखो|लिखिए|लिख दो|गाओ|गाइए|सुनाओ|रचो|कंपोज़ करो|तैयार करो";
  var HIN = "गाना|गाने|गीत|संगीत|धुन|तराना|नग़मा";
  if (new RegExp("(" + HIV + ")[^?!;।]{0,40}(" + HIN + ")|(" + HIN + ")[^?!;।]{0,40}(" + HIV + ")").test(nraw)) return true;
  if (/\bmach\w*\b[^?!;]{0,20}\b(mir|uns|ein\w*|neue\w*|eigen\w*)\b[^?!;]{0,20}\b(lied\w*|songs?|musik\w*|melodie\w*)\b/.test(n)) return true;
  if (/\b(lied\w*|songs?|musik\w*)\b[^?!;]{0,30}\b(mach\w*|erstell\w*|komponier\w*|schreib\w*|dicht\w*)\b/.test(n)) return true;
  if (/^\s*(une?|a|the|eine?|one)?\s*(chanson|song|piosenka|piosenke|utwor|melodia|lied|cancion|canzone)\s+(sur|about|o|na|uber|sobre|su|di|von)\b/.test(n)) return true;
  return false;
}
var SONG_VERSION_WORDS = "francaise|anglaise|allemande|espagnole|italienne|polonaise|portugaise|russe|chinoise|japonaise|coreenne|indienne|hindoue|hindi|hindie|hindou|fr|en|de|es|it|pl|hi";
function isSongVersionRequest(text){
  var t = String(text || "").trim();
  if (!t || t.length > 300) return false;
  try { if (isSongRequest(t)) return false; } catch(e){}
  if (!new RegExp("(remets?\\s+(la\\s+)?version|version\\s+(" + SONG_VERSION_WORDS + "))", "i").test(t)) return false;
  try { return !!songTargetLang(t); } catch(e2) { return false; }
}
function curSessionM(){
  try { var st = App.State; var ss = st.sessions || []; for (var i = 0; i < ss.length; i++){ if (ss[i] && ss[i].id === st.currentSessionId) return ss[i]; } } catch(e){}
  return null;
}
function answerSongVersion(txt){
  var target = songTargetLang(txt);
  var lang = songCodeOk(target) || curLang();
  try { if (target === "zh" && curLang() === "zh-CN") lang = "zh-CN"; } catch(eZ) {}
  try { if (songCodeOk(target) && target !== curLang()) _songSel = target; } catch(eSS1) {}
  var s = curSessionM();
  var prev = s && s._lastSong;
  if (!prev || !prev.names || !prev.names.length) { answerSong(txt); return; }
  var personTxt = prev.names.join(" ") + " : " + (prev.facts || "");
  var pack = generatePack(lang, prev.genre || genreFromText(txt), personTxt);
  postSong(pack, pack.lang);
}
function songBlocked(txt){
  try{
    if (App.RPG && App.RPG.state && App.RPG.state.active) return true;
    if (App.Deites && App.Deites.isActive && App.Deites.isActive()) return true;
    var s = null;
    try{ var ss = App.State.sessions || []; for (var i = 0; i < ss.length; i++){ if (ss[i] && ss[i].id === App.State.currentSessionId){ s = ss[i]; break; } } }catch(eS){}
    void s;
  }catch(e){}
  return false;
}
function freshSongMsg(text){
  try{
    var st = App.State, now = Date.now();
    var cur = st && st.sessions && st.sessions.find(function(s){ return s.id === st.currentSessionId; });
    var msgs = (cur && cur.messages) || [];
    var want = String(text).trim().slice(0, 300);
    for (var i = msgs.length - 1; i >= 0 && i >= msgs.length - 8; i--){
      var m = msgs[i];
      if (m && m.role === "user" && typeof m.content === "string" && String(m.content).trim().slice(0, 300) === want){
        var age = now - (+m.ts || 0);
        return age >= 0 && age < 20000;
      }
    }
  }catch(e){}
  return false;
}
/* Bâtisseurs hors-panneau (même format que le panneau) : P = {lang,bk,ui,se,
   genre,bpm,key,bass,perc,tex,spat,energy,soma,intent,vocal,tag,theme,titre,
   full,lenIdx,max,exclude}. */
function packStyle(P){
  var voixTag = ''; try{ voixTag = sunoStyleVoice(P.vocal, P.bk.meta.langName, P.bk.meta.voice, P.lang); }catch(e){ voixTag = 'female vocal, clear singable pronunciation'; }
  var rh = ''; try{ rh = rhythmSunoFragment(P.rhythm || { meter: '4/4', pattern: 'straight', feel: 'straight', poly: 'none', k: 5 }); }catch(e){ rh = ''; }
  var rhTag = rh ? ', ' + rh : '';
  var chTag = P.chords ? ", " + P.chords + " chords" : "";
  var fusP = !!(P.genreC && P.genreC !== P.genre); var gCp = fusP ? P.genreC : P.genre; var grVp = ''; try{ grVp = GENRE_RHYTHM[P.genre] || ''; }catch(e){} var grCp = ''; try{ grCp = GENRE_RHYTHM[gCp] || ''; }catch(e){} var peP = (fusP && grVp && grCp) ? (grVp + ' in verses, ' + grCp + ' in choruses, both mixed in bridge') : P.perc; var headP = fusP ? (P.genre + ' meets ' + gCp + ' fusion (verses ' + P.genre + ', choruses ' + gCp + ', bridge ' + P.genre + ' x ' + gCp + ')') : P.genre;
  var s = headP + ", " + (P.mood ? P.mood + ", " : "") + P.bpm + " BPM, " + P.key + chTag + ", " + P.bass + ", " + peP + rhTag + ", " + P.tex + ", " + P.spat + ", " + P.energy + ", " + voixTag;
  if (s.length > P.max) s = headP + ", " + (P.mood ? P.mood + ", " : "") + P.bpm + " BPM, " + P.key + chTag + ", " + P.bass + ", " + peP + rhTag + ", " + P.energy + ", " + voixTag;
  if (s.length > P.max) s = headP + ", " + (P.mood ? P.mood + ", " : "") + P.bpm + " BPM, " + P.key + rhTag + ", " + P.energy + ", " + voixTag;
  if (s.length > P.max + 50) s = s.slice(0, P.max - 3) + "...";
  return s;
}
function packStruct(P){
  var vb = ''; try{ vb = sunoVocalBracket(P.vocal); }catch(e){ vb = 'Female Vocal'; }
  var rhB = ''; try{ rhB = rhythmStructBracket(P.rhythm || { meter: '4/4', pattern: 'straight', feel: 'straight', poly: 'none', k: 5 }); }catch(e){ rhB = ''; }
  var rhLine = rhB ? sunoJoin(rhB) + "\n\n" : "";
  var ext = (P.lenIdx === 1) ? sunoJoin(SUNO_ENERGY.build, '16 bars') + "\n\n" : "";
  var tool = (P.lenIdx === 2) ? sunoJoin(SUNO_STRUCT.out, '16 bars, percussion') : sunoJoin(SUNO_STRUCT.out, SUNO_ENERGY.fadeOut);
  var fusQ = !!(P.genreC && P.genreC !== P.genre); var gCq = fusQ ? P.genreC : P.genre; var mmP = P.mm || null; try{ if (!mmP) mmP = sunoMoments(fusQ ? gCq : P.genre, vb); }catch(e){ mmP = null; }
  var soloP = mmP ? sunoJoin(mmP.solo) : '';
  var _grVp = ''; try{ _grVp = GENRE_RHYTHM[P.genre] || ''; }catch(e){} var _grCp = ''; try{ _grCp = GENRE_RHYTHM[gCq] || ''; }catch(e){} if (fusQ && _grVp && _grCp) P.perc = _grVp + ' in verses, ' + _grCp + ' in choruses, both mixed in bridge'; var bridgeP = mmP ? sunoJoin(SUNO_STRUCT.br, SUNO_ENERGY.stripped, mmP.bridgeFx, (fusQ ? (P.genre + ' x ' + gCq + ' fusion') : '')) : sunoJoin(SUNO_STRUCT.br, SUNO_ENERGY.stripped, (fusQ ? (P.genre + ' x ' + gCq + ' fusion') : ''));
  var outP = (P.lenIdx === 2) ? tool : sunoJoin.apply(null, ((mmP && mmP.outro && mmP.outro.parts) || [SUNO_STRUCT.out, SUNO_ENERGY.fadeOut, 'Echo']));
  var liftP = (mmP && mmP.lift) ? sunoJoin(mmP.lift) + "\n\n" : "";
  var bloc = P.vocal.instru ? sunoJoin(SUNO_STRUCT.ins) : sunoJoin(vb);
  var chLine = P.chords ? "[Chords: " + P.chords + "]\n\n" : "";
  return bloc + "\n\n" + sunoJoin(SUNO_STRUCT.intro, P.bpm + ' BPM') + "\n\n" + chLine + sunoJoin(SUNO_STRUCT.brk, P.perc) + "\n\n" + rhLine + sunoJoin(SUNO_STRUCT.inter, P.tex) + "\n\n" + sunoJoin(SUNO_ENERGY.build, P.soma) + "\n\n" + sunoJoin(SUNO_ENERGY.drop, P.bass) + "\n\n" + sunoJoin('Verse', P.genre) + "\n\n" + (fusQ ? sunoJoin(SUNO_STRUCT.pre, SUNO_ENERGY.build, P.genre + ' to ' + gCq + ' transition') + "\n\n" : "") + (fusQ ? sunoJoin(SUNO_STRUCT.ch, gCq) + "\n\n" : "") + (soloP ? soloP + "\n\n" : "") + sunoJoin(SUNO_STRUCT.brk, SUNO_ENERGY.stripped) + "\n\n" + bridgeP + "\n\n" + ext + liftP + sunoJoin(SUNO_ENERGY.build, 'drums') + "\n\n" + (fusQ ? sunoJoin(SUNO_ENERGY.drop, P.genre + ' x ' + gCq + ' fusion') : sunoJoin(SUNO_ENERGY.drop)) + "\n\n" + outP;
}
function varyLines(arr, all){ var b = (arr || []).slice(); var s = all ? 0 : 1; for (var i = b.length - 1; i > s; i--){ var j = s + Math.floor(Math.random() * (i - s + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
function packLyrics(P){
  var bk = P.bk, ui = P.ui, theme = P.theme;
  var vb = ''; try{ vb = sunoVocalBracket(P.vocal); }catch(e){ vb = 'Female Vocal'; }
  var chTag = ''; try{ chTag = sunoChorusTag(vb); }catch(e){ chTag = 'Choir | Layered Harmonies'; }
  if (P.vocal.instru){ var mmI2 = P.mm || null; try{ if (!mmI2) mmI2 = sunoMoments(P.genre, vb); }catch(e){ mmI2 = null; } var soloI2 = (mmI2 && mmI2.solo) || 'Instrumental Break'; return sunoJoin(SUNO_STRUCT.ins) + "\n(" + ui.themeOf + " : " + theme + ")\n\n" + sunoJoin(soloI2) + "\n\n" + ui.instruTip; }
  var gVq = P.genre, gCq = (P.genreC && P.genreC !== P.genre) ? P.genreC : P.genre; var fusQ2 = (gCq !== gVq); var rkQv = rockish(gVq) && bk.coupletRock; var rkQc = rockish(gCq) && bk.coupletRock;
  var c1 = pickN(rkQv ? bk.coupletRock : bk.couplet, 4), c2 = pickN(rkQv ? bk.coupletRock : bk.couplet, 4);
  var r = pickN(rkQc && bk.refrainRock ? bk.refrainRock : bk.refrain, 4);
  var p = pickN(rkQv && bk.pontRock ? bk.pontRock : bk.pont, 2);
  var ex = pickN(bk.excla, 2).join(" … ");
var sfxQ = Math.random() < 0.6 ? pick(SFXM) : "";
  var pers = null;
  try { if (P.F && P.F.names && P.F.names.length) pers = personalSongBlock(P.lang, P.F); } catch (ePers) { pers = null; }
  var vv1 = (pers && pers.v1) || c1, vv2 = (pers && pers.v2) || c2, cc = (pers && pers.ch) || r;
  if (pers) { vv1 = varyLines(pers.v1); vv2 = varyLines(pers.v2); cc = varyLines(pers.ch, true); }
  var ccFin = (Math.random() < 0.5) ? cc.slice().reverse() : varyLines(cc, true);
  var themeLine = (P.F && P.F.facts) ? "" : "\n(" + theme + ")";
  var t = (fusQ2 ? sunoJoin(SUNO_STRUCT.v1, vb, gVq) : sunoJoin(SUNO_STRUCT.v1, vb)) + "\n" + vv1.join("\n") + themeLine + "\n\n" + (fusQ2 ? sunoJoin(SUNO_STRUCT.pre, SUNO_ENERGY.build, gVq + ' to ' + gCq + ' transition') : sunoJoin(SUNO_STRUCT.pre, SUNO_ENERGY.build)) + "\n" + ex + " …\n\n" + (fusQ2 ? sunoJoin(SUNO_STRUCT.ch, chTag, gCq) : sunoJoin(SUNO_STRUCT.ch, chTag)) + "\n" + cc.join("\n") + "\n";
  if (P.full){ var mmQ = P.mm || null; try{ if (!mmQ) mmQ = sunoMoments(P.genre, vb); }catch(e){ mmQ = null; } var soloQ = (mmQ && mmQ.solo) || 'Guitar Solo'; var ch2Q = (mmQ && mmQ.chorus2) || chTag; var brFxQ = (mmQ && mmQ.bridgeFx) || 'Whispered'; var v2tagQ = (mmQ && mmQ.duetV2) || vb; var lastV = (vv1[vv1.length-1] || ''); var stopQ = (mmQ && mmQ.stopBreak) ? sunoJoin(SUNO_STRUCT.brk, 'Silence') + "\n\n" : ""; var liftQ = (mmQ && mmQ.lift) ? sunoJoin(mmQ.lift) + "\n\n" : ""; var outKindQ = (mmQ && mmQ.outro && mmQ.outro.kind) || 'fade'; var outTagQ = sunoJoin.apply(null, ((mmQ && mmQ.outro && mmQ.outro.parts) || [SUNO_STRUCT.out, SUNO_ENERGY.fadeOut, 'Echo'])); var outBodyQ = (outKindQ === 'fade') ? (ex + " \u2026 (echo fading\u2026)") : ((ccFin[0] || cc[0] || ex)); t += "\n" + (fusQ2 ? sunoJoin(SUNO_STRUCT.v2, v2tagQ, gVq) : sunoJoin(SUNO_STRUCT.v2, v2tagQ)) + "\n" + vv2.join("\n") + "\n\n" + (fusQ2 ? sunoJoin(SUNO_STRUCT.ch, ch2Q, gCq) : sunoJoin(SUNO_STRUCT.ch, ch2Q)) + "\n" + cc.slice().reverse().join("\n") + "\n\n" + sunoJoin(soloQ) + "\n\n" + (fusQ2 ? sunoJoin(SUNO_STRUCT.br, SUNO_ENERGY.stripped, brFxQ, gVq + ' x ' + gCq + ' fusion') : sunoJoin(SUNO_STRUCT.br, SUNO_ENERGY.stripped, brFxQ)) + "\n" + p.join("\n") + "\n" + lastV + " \u2026 (echo\u2026)" + "\n\n" + stopQ + liftQ + (sfxQ ? sfxQ + "\n\n" : '') + (fusQ2 ? sunoJoin(SUNO_STRUCT.chf, chTag, 'Anthemic', gVq + ' x ' + gCq + ' fusion') : sunoJoin(SUNO_STRUCT.chf, chTag, 'Anthemic')) + "\n" + ccFin.join("\n") + "\n" + ex.toUpperCase() + " \u2026 (ad-lib\u2026)" + "\n\n" + outTagQ + "\n" + outBodyQ + "\n"; }
  return t;
}
function songStats(bk, lang, lyrics){
  var lines = String(lyrics).split("\n").map(function(s){ return s.trim(); }).filter(function(s){ return s && !/^\[.+\]$/.test(s) && !/^\(.+\)$/.test(s) && !/^\*.+\*$/.test(s); });
  if (!lines.length) return { n: 0, avg: 0, longs: [], foreign: [] };
  var counts = lines.map(function(s){ return syllables(s, lang); });
  var avg = counts.reduce(function(a, b){ return a + b; }, 0) / counts.length;
  var longs = [];
  counts.forEach(function(c, i){ if (c > 10) longs.push((i + 1) + " (" + c + ")"); });
  var low = " " + String(lyrics).toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüÿœæçáíóúñàèìòąćęłńśźż]+/g, " ") + " ";
  var foreign = [];
  bk.foreignWords.forEach(function(w){ if (low.indexOf(" " + w + " ") >= 0 && foreign.indexOf(w) < 0) foreign.push(w); });
  return { n: lines.length, avg: avg, longs: longs, foreign: foreign };
}
function extractSongFacts(txt){
  var raw = String(txt == null ? "" : txt);
  var low = "";
  try { low = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) { low = String(raw).toLowerCase(); }
  var stop = { fais:1, faites:1, fait:1, faire:1, pour:1, avec:1, alors:1, elle:1, nous:1, ils:1, elles:1, mais:1, comme:1, quand:1, suis:1, est:1, sont:1, une:1, des:1, les:1, qui:1, que:1, ans:1, rock:1, pop:1, soul:1, polonais:1, polonaise:1, langue:1, musique:1, chanson:1, francais:1, homme:1, femme:1, fille:1, famille:1, vie:1, chemin:1, etudes:1, moments:1, aime:1, bien:1, plus:1, moins:1, mon:1, ma:1, mes:1, son:1, sa:1, ses:1, notre:1, votre:1, leur:1, leurs:1, dans:1, sur:1, par:1, pas:1,Hend:1 };
  var names = [], seen = {};
  var re = /[A-Z\u00C0-\u00DE\u0104\u0106\u0118\u0141\u0143\u00D3\u015A\u0179\u017B][a-z\u00E0-\u00FF\u0105\u0107\u0119\u0142\u0144\u00F3\u015B\u017A\u017C'\-]{2,}/g;
  var m;
  while ((m = re.exec(raw))) {
    var w = String(m[0]).replace(/['\-.,;:!?]+$/, "");
    if (w.length < 3) continue;
    var wl = "";
    try { wl = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e2) { wl = w.toLowerCase(); }
    if (stop[wl]) continue; try { var _w0 = String(wl).split(/['\-]/)[0]; if (_w0 && stop[_w0]) continue; } catch (eW0) {}
    if (/^(janv|fevr|mars|avr|mai|juin|juil|aout|sept|oct|nov|dec|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|rock|pop|soul|funk|metal|rap|jazz|blues)/.test(wl)) continue;
    if (!seen[wl]) { seen[wl] = 1; names.push(w); }
    if (names.length >= 5) break;
  }
  var facts = raw.replace(/\s+/g, " ").trim();
  var ci = facts.indexOf(":");
  if (ci >= 0 && ci < 200) facts = facts.slice(ci + 1).trim();
  facts = facts.slice(0, 160);
  return { names: names, facts: facts, low: low, raw: raw };
}
var SONG_TITLE_JOIN = { fr: " et ", en: " and ", de: " und ", es: " y ", it: " e ", pl: " i ", hi: " और ", ja: "\u3068", zh: "\u8207", "zh-CN": "\u4E0E", ko: "\uC640 " };

function personalSongBlock(lang, F) {
  var N = (F && F.names) || [];
  var n1 = N[0] || "", n2 = N[1] || "";
  var pair = n1 && n2;
  if (lang === "pl") {
    return {
      v1: [pair ? n1 + " spotkał " + n2 + ", serce zabiło mocniej" : (n1 ? n1 + " odnalazł drogę do serca" : "Spotkaliśmy się, gdy serce chciało znów żyć"), "Po latach ciszy serce budzi się", "Miłość, która trwa, zostaje w sercu", "Każda chwila razem to cud"],
      v2: ["Każdy telefon to most, każdy weekend to święto", "Twoja dłoń w mojej dłoni, to cały mój świat", "Osobno nie z wyboru, blisko sercem", "Każdy powrót jak pierwszy raz"],
      ch: [pair ? n2 + ", idziemy razem jedną drogą" : "Idziemy razem jedną drogą", "Choć daleko, serce zna drogę", "Piękne chwile, miłość niesie", "Kochać i być kochanym"]
    };
  }
  if (lang === "fr") {
    return {
      v1: [pair ? n1 + " a rencontré " + n2 + ", le cœur a chanté" : "Un cœur qui voulait croire au bonheur", "Après les silences, un chemin nouveau", "Un amour vrai reste dans le cœur", "Chaque instant ensemble est un miracle"],
      v2: ["Chaque appel est un pont, chaque week-end une fête", "Ta main dans la mienne, c'est mon univers", "Loin des yeux, mais proches par le cœur", "Et chaque retour a le goût de la première fois"],
      ch: [pair ? n2 + ", marchons ensemble sur le même chemin" : "Marchons ensemble sur le même chemin", "Malgré la distance, nos cœurs se retrouvent", "De beaux moments à partager", "Aimer et être aimé, simplement"]
    };
  }
  if (lang === "en") {
    return {
      v1: [pair ? n1 + " met " + n2 + ", and the heart sang" : "A heart that wanted to believe again", "After the silence, a brand-new road", "A love that's true stays in the heart", "Every moment together is a miracle"],
      v2: ["Every call's a bridge, every weekend a feast", "Your hand in mine is my whole world", "Far apart, but close at heart", "And each return tastes like the first time"],
      ch: [pair ? n2 + ", we walk together down one road" : "We walk together down one road", "Miles apart, our hearts still meet", "Beautiful moments to share", "To love and be loved, that's all"]
    };
  }
  if (lang === "de") {
    return {
      v1: [pair ? n1 + " traf " + n2 + ", und das Herz sang" : "Ein Herz, das wieder glauben wollte", "Nach der Stille ein völlig neuer Weg", "Wahre Liebe bleibt im Herzen", "Jeder Moment zu zweit ist ein Wunder"],
      v2: ["Jeder Anruf eine Brücke, jedes Wochenende ein Fest", "Deine Hand in meiner ist meine Welt", "Fern und doch im Herzen nah", "Und jede Rückkehr schmeckt wie das erste Mal"],
      ch: [pair ? n2 + ", wir gehen gemeinsam einen Weg" : "Wir gehen gemeinsam einen Weg", "Trotz der Ferne finden sich die Herzen", "Schöne Momente, Seite an Seite", "Lieben und geliebt werden, einfach so"]
    };
  }
  if (lang === "es") {
    return {
      v1: [pair ? n1 + " conoció a " + n2 + ", y el corazón cantó" : "Un corazón que quería volver a creer", "Tras el silencio, un camino nuevo", "Un amor verdadero queda en el corazón", "Cada instante juntos es un milagro"],
      v2: ["Cada llamada es un puente, cada finde una fiesta", "Tu mano en la mía es mi universo", "Lejos de vista, cerca de corazón", "Y cada regreso sabe a primera vez"],
      ch: [pair ? n2 + ", caminamos juntos el mismo camino" : "Caminamos juntos el mismo camino", "Pese a la distancia, el corazón se encuentra", "Hermosos momentos para compartir", "Amar y ser amado, sin más"]
    };
  }
  if (lang === "it") {
    return {
      v1: [pair ? n1 + " ha incontrato " + n2 + ", e il cuore ha cantato" : "Un cuore che voleva tornare a credere", "Dopo il silenzio, una strada nuova", "Un amore vero resta nel cuore", "Ogni istante insieme è un miracolo"],
      v2: ["Ogni chiamata è un ponte, ogni weekend una festa", "La tua mano nella mia è il mio mondo", "Lontani dagli occhi, vicini di cuore", "E ogni ritorno sa di prima volta"],
      ch: [pair ? n2 + ", camminiamo insieme sulla stessa strada" : "Camminiamo insieme sulla stessa strada", "Nonostante la distanza, i cuori si ritrovano", "Bei momenti da condividere", "Amare ed essere amati, semplicemente"]
    };
  }
  if (lang === "ja") {
    var j1 = pair ? n1 + "と" + n2 + "の出会い" : (n1 ? n1 + "の物語" : "幸せを願う心");
    return { v1: [j1 + "、新しい光", "沈黙の後に新しい道", "小さな光が家を照らす", "一緒の時間は奇跡"], v2: ["毎電話が橋", "家族と共に家", "心はいつも近く", "帰るたび初めての味"], ch: [pair ? n2 + "と一緒に呼吸して" : "一緒に呼吸して", "心は道を知っている", "家族の奇跡", "愛し愛されること"] };
  }
  if (lang === "hi") {
    var h1 = pair ? n1 + " और " + n2 + " की मुलाकात" : (n1 ? n1 + " की कहानी" : "खुशी चाहने वाला दिल");
    return { v1: [h1 + ", नई रोशनी", "ख़ामोशी के बाद नई राह", "दो नन्ही रूहें", "साथ बिताया हर पल चमत्कार"], v2: ["हर फ़ोन एक पुल", "परिवार के साथ घर", "दिल हमेशा पास", "हर वापसी पहली सी"], ch: [pair ? n2 + ", साथ साँस लेते एक राह" : "साथ साँस लेते एक राह", "दिल राह जानता है", "परिवार का चमत्कार", "प्यार करना और पाना"] };
  }
  if (lang === "zh" || lang === "zh-CN") {
    var simp = lang === "zh-CN";
    var meet = simp ? "遇见" : "遇見", love = simp ? "爱" : "愛";
    var z1 = pair ? n1 + meet + n2 : (n1 ? n1 + "的故事" : "幸福的心");
    var L1 = simp ? ["新的光", "沉默之后的新路", "两颗小心点亮家", "相聚的每一刻都是奇迹"] : ["新的光", "沉默之後的新路", "兩顆小心點亮家", "相聚的每一刻都是奇蹟"];
    var L2 = simp ? ["每通电话都是桥", "与家人在家", "心永远接近", "每次回来像第一次"] : ["每通電話都是橋", "與家人在家", "心永遠接近", "每次回來像第一次"];
    var LC = simp ? ["一起呼吸同一路", "心知道路", "家庭的奇迹", "相爱的人"] : ["一起呼吸同一路", "心知道路", "家庭的奇蹟", "相愛的人"];
    return { v1: [z1 + "，" + L1[0], L1[1], L1[2], L1[3]], v2: L2, ch: [pair ? n2 + "，" + LC[0] : LC[0], LC[1], LC[2], LC[3]] };
  }
  if (lang === "ko") {
    var k1 = pair ? n1 + "와 " + n2 + "의 만남" : (n1 ? n1 + "의 이야기" : "행복을 바라는 마음");
    return { v1: [k1 + ", 새로운 빛", "침묵 뒤에 새 길", "두 작은 영혼", "함께한 시간은 기적"], v2: ["매 전화마다 다리", "가족과 함께 집", "마음은 언제나 가까워", "돌아올 때마다 처음처럼"], ch: [pair ? n2 + ", 함께 숨쉬는 하나의 길" : "함께 숨쉬는 하나의 길", "마음은 길을 알아", "가족의 기적", "사랑하고 사랑받는 것"] };
  }
  return null;
}
function extractUserLyrics(txt){
  try {
    var t = String(txt || "").replace(/\r/g, "");
    var m = t.match(/paroles?\s*:\s*([\s\S]+)/i);
    var body = m ? m[1] : null;
    if (!body){
      var lines = t.split("\n");
      if (lines.length < 4) return null;
      body = lines.slice(1).join("\n");
    }
    body = body.replace(/^[\u0022\u00ab\u201c\s]+|[\u0022\u00bb\u201d\s]+$/g, "").trim();
    var bl = body.split("\n").map(function(x){ return x.trim(); }).filter(Boolean);
    if (bl.length < 3) return null;
    var tot = bl.join(" ").length;
    if (tot < 30 || tot > 4000) return null;
    return bl.join("\n");
  } catch(e){ return null; }
}
function generatePack(lang, forceGenre, personTxt, forceChorus){
  lang = songCodeOk(lang) || curLang();
  var fg = (typeof forceGenre === "string" && SOUND.genre.indexOf(forceGenre) >= 0) ? forceGenre : null;
  var bk = bankFor(lang), ui = bk.ui, se = SEC[lang] || SEC.en || SEC.fr;
  var sung = [];
  bk.vocal.forEach(function(v, i){ if (!v.instru) sung.push(i); });
  var vi = sung.length ? sung[Math.floor(Math.random() * sung.length)] : 0;
  var vocal = bk.vocal[vi] || bk.vocal[0];
  var _fgFam = null; try{ _fgFam = familyFor(fg); }catch(e){}
    var fc0 = (typeof forceChorus === "string" && SOUND.genre.indexOf(forceChorus) >= 0) ? forceChorus : null; var P = { lang: lang, bk: bk, ui: ui, se: se,
    genre: (fg || pick(SOUND.genre)), mood: pick(SOUND.mood), bpm: (function(){ try{ var _fk = familyFor(fg || ''); if(_fk && SUNO_FAM[_fk]) return String(Math.max(40, Math.min(180, SUNO_FAM[_fk].bpm))); }catch(e){} return String(40 + Math.floor(Math.random() * 141)); })(),
    key: pick(SOUND.key), chords: (function(){ try{ var _fk2 = familyFor(fg || ''); if(_fk2 && SUNO_FAM[_fk2]) return SUNO_FAM[_fk2].chords; }catch(e){} return (SOUND.chords ? pick(SOUND.chords) : ''); })(), bass: pick(SOUND.bass), perc: (function(){ try{ var _gv = GENRE_RHYTHM[fg] || ''; if (fc0 && fc0 !== fg && _gv && GENRE_RHYTHM[fc0]) return _gv + ' in verses, ' + GENRE_RHYTHM[fc0] + ' in choruses'; if (fg && _gv) return _gv; }catch(e){} return pick(SOUND.perc); })(),
    tex: pick(SOUND.tex), spat: pick(SOUND.spat), energy: pick(SOUND.energy),
    soma: pick(SOUND.soma), intent: pick(SOUND.intent),
    vocal: vocal, tag: vocal.short || vocal.t, theme: pick(bk.themes), titre: pick(bk.titles), genreC: null, fusion: false,
    rhythm: (function(){ try{ if (Math.random() < 0.45) return surpriseRhythm(); }catch(e){} return { meter: '4/4', pattern: 'straight', feel: 'straight', poly: 'none', k: 5 }; })(),
    full: true, lenIdx: 0, max: 200, exclude: excludeFor(_fgFam, !!((vocal || {}).instru), ui.excludeDef), F: null };
  try {
    if (typeof personTxt === "string" && personTxt.trim()) {
      var _F = extractSongFacts(personTxt);
      P.F = _F;
      if (_F.facts) P.theme = _F.facts;
      if (_F.names && _F.names.length >= 2) {
        var _j = SONG_TITLE_JOIN[lang] || " & ";
        P.titre = _F.names[0] + _j + _F.names[1];
      } else if (_F.names && _F.names.length === 1) { P.titre = _F.names[0]; }
    }
  } catch (ePF) {}
  try{ if (fc0 && fc0 !== P.genre){ P.genreC = fc0; P.fusion = true; } }catch(e){} try{ P.mm = sunoMoments(P.fusion ? P.genreC : P.genre, sunoVocalBracket(P.vocal)); }catch(e){ P.mm = null; }
  var _userLyr = extractUserLyrics(personTxt); var lyrics = _userLyr || packLyrics(P);
  var st = songStats(bk, lang, lyrics);
  return { lang: lang, title: P.titre, genre: P.genre, genreC: P.genreC, fusion: P.fusion, bpm: P.bpm, theme: P.theme, vocalTag: P.tag,
    style: packStyle(P), struct: packStruct(P), lyrics: lyrics, exclude: P.exclude, stats: st };
}
var SONG_INTRO = {
fr: "Voilà ta chanson, prête pour Suno 🎵 — copie chaque bloc ci-dessous, ou ouvre le panneau pour la retravailler.",
en: "Here is your song, ready for Suno 🎵 — copy each block below, or open the panel to rework it.",
de: "Hier ist dein Song, fertig für Suno 🎵 — kopiere die Blöcke unten oder öffne das Panel zum Bearbeiten.",
es: "Aquí tienes tu canción, lista para Suno 🎵 — copia cada bloque o abre el panel para retocarla.",
it: "Ecco la tua canzone, pronta per Suno 🎵 — copia i blocchi qui sotto o apri il pannello per rielaborarla.",
pl: "Oto twoja piosenka, gotowa do Suno 🎵 — skopiuj bloki poniżej albo otwórz panel, by ją dopracować.",
ja: "あなたの曲ができたよ、Suno用だよ🎵 — 下のブロックをコピーしてね、パネルで手直しもできるよ。",
zh: "你的歌曲準備好了，可直接用於 Suno🎵 — 複製下方區塊，或打開面板繼續打磨。",
"zh-CN": "你的歌曲准备好了，可直接用于 Suno🎵 — 复制下方区块，或打开面板继续打磨。",
ko: "네 노래 완성됐어, Suno용이야🎵 — 아래 블록을 복사하거나 패널에서 다듬어 봐。",
hi: "तुम्हारा गाना तैयार है, Suno के लिए 🎵 — नीचे के ब्लॉक कॉपी करो, या पैनल में सँवारो।"
};
function convoLang(){
  try{
    var s = null, ss = App.State.sessions || [];
    for (var i = 0; i < ss.length; i++){ if (ss[i] && ss[i].id === App.State.currentSessionId){ s = ss[i]; break; } }
    var l = String((s && s.lockedLanguage) || (App.State.settings && App.State.settings.language) || "en").slice(0, 2).toLowerCase();
    if (SONG_INTRO[l]) return l;
  }catch(e){}
  return "en";
}
function copyAllText(pack){
  var hd = HDR[pack.lang] || HDR.fr;
  var bk = BANKS[pack.lang] || BANK_FR;
  return hd[0] + ":\n" + pack.title + "\n\n" + hd[1] + ":\n" + pack.style + "\n\n" + hd[2] + ":\n" + pack.exclude + "\n\n" + hd[3] + ":\n" + pack.struct + "\n\n" + hd[4] + " " + bk.meta.voice + ":\n" + pack.lyrics;
}
function ensureSongCss(){
  if (document.getElementById("smusicCss")) return;
  var st = document.createElement("style");
  st.id = "smusicCss";
  st.textContent = ".smusic-intro{color:#d4d4d8;margin-bottom:6px}"
  + ".smusic-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#b9aef5;margin:12px 0 6px}"
  + ".smusic-pre{background:#000;border:1px solid #333;border-radius:12px;padding:12px;white-space:pre-wrap;font-size:13px;line-height:1.6;color:#efe9ff;margin:0;font-family:inherit}"
  + ".smusic-chk{font-size:12px;color:#8e8e96;margin-top:8px;white-space:pre-line}"
  + ".smusic-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}"
  + ".smusic-btn{background:#221c4d;border:1px solid #4a3aa3;color:#fff;border-radius:12px;padding:9px 14px;cursor:pointer;font-size:13px;font-family:inherit;min-height:38px}"
  + ".smusic-btn:hover{background:#2d2560}";
  document.head.appendChild(st);
}
function postSong(pack, cl){
  var bk = BANKS[pack.lang] || BANK_FR, ui = bk.ui;
  ensureSongCss();
  var list = document.querySelector("#messageListEl");
  if (!list) return null;
  var row = document.createElement("div");
  row.className = "messageRow assistantRow";
  var wrap = document.createElement("div");
  wrap.className = "msgWrapper";
  var body = document.createElement("div");
  body.className = "messageContent markdown-content";
  var intro = document.createElement("div");
  intro.className = "smusic-intro";
  intro.textContent = SONG_INTRO[cl] || SONG_INTRO.en;
  body.appendChild(intro);
  var h = document.createElement("h3");
  h.style.margin = "8px 0";
  h.textContent = "🎵 " + pack.title + (pack.fusion ? "  🔀 " + pack.genre + " / " + pack.genreC : "");
  body.appendChild(h);
  function block(lbl, txt){
    var l = document.createElement("div");
    l.className = "smusic-lbl";
    l.textContent = lbl;
    body.appendChild(l);
    var pre = document.createElement("pre");
    pre.className = "smusic-pre";
    pre.textContent = txt;
    body.appendChild(pre);
  }
  block(ui.styleBox, pack.style);
  block(ui.structBox, pack.struct);
  block(ui.lyricsBox, pack.lyrics);
  var chk = document.createElement("div");
  chk.className = "smusic-chk";
  var sl = ui.chkVerses + " : " + pack.stats.n + " · " + pack.stats.avg.toFixed(1) + " " + ui.chkAvg;
  if (pack.stats.longs.length) sl += "\n⚠️ " + ui.chkLong + " (>10) : " + pack.stats.longs.join(", ");
  else sl += "\n✅ " + ui.chkLongOk;
  if (pack.stats.foreign.length) sl += "\n⚠️ " + ui.chkForeign + " : " + pack.stats.foreign.join(", ");
  else sl += "\n✅ " + ui.chkForeignOk;
  chk.textContent = sl;
  body.appendChild(chk);
  var btns = document.createElement("div");
  btns.className = "smusic-btns";
  function btn(lbl, fn){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "smusic-btn";
    b.textContent = lbl;
    b.onclick = fn;
    btns.appendChild(b);
  }
  btn(ui.copyStyle, function(){ clip(pack.style); });
  btn(ui.copyStruct, function(){ clip(pack.struct); });
  btn(ui.copyLyrics, function(){ clip(pack.lyrics); });
  btn(ui.copyAll, function(){ clip(copyAllText(pack)); });
  btn("🎵 " + ui.musicBtn, function(){ App.Music.openWith(pack); });
  body.appendChild(btns);
  wrap.appendChild(body);
  row.appendChild(wrap);
  list.appendChild(row);
  var sc = document.querySelector("#chatHistoryCtn");
  if (sc) sc.scrollTop = sc.scrollHeight;
  return row;
}
var _FUS_IDX = null, _FUS_REP = {};
function fusNorm(x){ try{ return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }catch(e){ return String(x || '').toLowerCase(); } }
function fusIdx(){ if (_FUS_IDX) return _FUS_IDX; _FUS_IDX = SOUND.genre.map(function(lbl){ var n = fusNorm(lbl); return { lbl: lbl, toks: n.split(/[^a-z0-9]+/).filter(function(t){ return t.length >= 3; }), norm: n }; }); return _FUS_IDX; }
function matchSide(side){ var sn = fusNorm(side).trim(); if (!sn) return null; var stoks = sn.split(/[^a-z0-9]+/).filter(function(t){ return t.length >= 4; }); if (!stoks.length) stoks = sn.split(/[^a-z0-9]+/).filter(function(t){ return t.length >= 3; }); var best = null, bestScore = 0; fusIdx().forEach(function(e){ var sc = 0; stoks.forEach(function(t){ if (e.toks.indexOf(t) >= 0) sc += 2; else if (e.norm.indexOf(t) >= 0) sc += 1; }); if (e.norm === sn) sc += 5; if (sc > bestScore || (sc === bestScore && sc > 0 && best && e.lbl.length < best.length)){ bestScore = sc; best = e.lbl; } }); if (best && bestScore > 0) return best; var fam = null; try{ fam = familyFor(side); }catch(e){} if (fam){ if (!_FUS_REP[fam]){ for (var i = 0; i < SOUND.genre.length; i++){ var _f = null; try{ _f = familyFor(SOUND.genre[i]); }catch(e2){} if (_f === fam){ _FUS_REP[fam] = SOUND.genre[i]; break; } } } return _FUS_REP[fam] || null; } return null; }
function fusionFromText(txt){ var raw = String(txt || ''); var low = ' ' + fusNorm(raw) + ' '; function cut(a, b){ var x = matchSide(a), y = matchSide(b); if (x && y && x !== y) return { v: x, c: y }; return null; } var m = low.match(/couplet[s]?\s*[:\-]?\s*([a-z0-9 +&'\'\-]{2,60}?)\s*(?:\/|,|;|\set\s+)?\s*refrain[s]?\s*[:\-]?\s*([a-z0-9 +&'\'\-()]{2,60})/); if (m){ var r0 = cut(m[1], m[2]); if (r0) return r0; } var m2 = low.match(/verse[s]?\s*[:\-]?\s*([a-z0-9 +&'\'\-]{2,60}?)\s*(?:\/|,|;|\sand\s+)?\s*chorus(?:es)?\s*[:\-]?\s*([a-z0-9 +&'\'\-()]{2,60})/); if (m2){ var r1 = cut(m2[1], m2[2]); if (r1) return r1; } var seps = [' + ', ' x ', ' vs ', ' versus ', ' meets ', ' meet ', ' fusion ', ' melange ', ' mix ', ' medley ']; for (var i = 0; i < seps.length; i++){ var p = low.indexOf(seps[i]); if (p > 0){ var rr = cut(low.slice(0, p), low.slice(p + seps[i].length).split(/[.\n?!]/)[0]); if (rr) return rr; } } var m3 = low.match(/([a-z0-9 +&'\'\-()]{2,40}?)\s+en\s+couplet[s]?\s*[,]?\s*([a-z0-9 +&'\'\-()]{2,40}?)\s+en\s+refrain/); if (m3){ var r3 = cut(m3[1], m3[2]); if (r3) return r3; } var stop = { une:1, des:1, les:1, pour:1, avec:1, chanson:1, chansons:1, musique:1, fais:1, fait:1, faire:1, moi:1, nous:1, vous:1, elle:1, elles:1, comme:1, dans:1, avec2:1, and:1, the:1, song:1, music:1, make:1, with:1, style:1, entre:1, deux:1, two:1, mixe:1, svp:1, plait:1 }; var words = low.split(/[^a-z0-9]+/).filter(function(w){ return w.length >= 3 && !stop[w]; }); var found = []; for (var k = 0; k < words.length; k++){ for (var L = 2; L >= 1; L--){ var cand = words.slice(k, k + L).join(' '); if (!cand) continue; var hit = matchSide(cand); if (hit && found.indexOf(hit) < 0){ found.push(hit); break; } } if (found.length >= 2) break; } if (found.length >= 2) return { v: found[0], c: found[1] }; return null; }
function genreFromText(txt){
  var n = " " + songNorm(txt) + " ";
  var r = " " + String(txt || "") + " ";
  var SUBG = [/trap metal|metal trap/,"Trap metal",/melodic trap/,"Melodic trap",/new.?age trap/,"New-age trap",/old.?school boom/,"Old school boom bap",/r&b rap|rnb rap|rap r&b|rap rnb|r and b rap/,"R&B rap hybrid",/storytelling/,"Storytelling rap",/battle rap|rap battle|aggressive rap|rap agressif/,"Aggressive battle rap",/country western|western country/,"Country western",/western(?! swing)/,"Country western",/jazz standard|standard jazz/,"Jazz standard",/orchestral emo|emo orchestral|emo symphonique/,"Orchestral emo",/dark cabaret|cabaret noir/,"Dark cabaret",/glitch-hop|glitch hop/,"Glitch-hop",/ambient pop/,"Ambient pop",/ambient techno|techno ambient/,"Ambient techno",/dark ambient|ambient sombre/,"Dark ambient",/ambient/,"Ambient",/industrial electro|electro indus/,"Industrial electro",/industrial metal|metal industriel/,"Industrial metal",/industrial(?! (electro|metal))|industriel/,"Industrial",/symphonic metal|metal symphonique/,"Symphonic metal",/folk metal|metal folk/,"Folk metal",/gothic metal|metal gothique/,"Gothic metal",/nu metal|nu-metal/,"Nu metal",/groove metal/,"Groove metal",/rap metal|metal rap/,"Rap metal",/funk metal|metal funk/,"Funk metal",/post-metal|post metal/,"Post-metal",/speed metal/,"Speed metal",/brutal death|death brutal/,"Brutal death metal",/melodic death|death melodique/,"Melodic death metal",/atmospheric black|black.*atmospherique/,"Atmospheric black metal",/stoner doom|doom stoner/,"Stoner doom metal",/thrash/,"Thrash metal",/deathcore/,"Deathcore",/metalcore/,"Metalcore",/mathcore/,"Mathcore",/djent/,"Djent",/grind/,"Grindcore",/viking/,"Viking metal",/pirate/,"Pirate metal",/doom/,"Doom metal",/sludge metal|metal sludge/,"Sludge metal",/sludge/,"Sludge rock",/stoner/,"Stoner rock",/desert rock|rock du desert/,"Desert rock",/black metal/,"Black metal",/death metal/,"Death metal",/power metal|metal power/,"Power metal",/epic metal|metal epique|orchestral metal/,"Epic orchestral metal",/alternative metal|metal alternatif/,"Alternative metal",/industrial metal|metal industriel/,"Industrial metal",/progressive metal|metal progressif|prog metal/,"Progressive metal",/pop-punk|pop punk/,"Pop-punk",/post-punk|post punk/,"Post-punk",/ska-punk|skapunk/,"Punk rock",/punk/,"Punk rock",/grunge/,"Grunge",/screamo/,"Screamo",/emo(?!ji)/,"Emo rock",/shoegaze|shoe gaze/,"Shoegaze",/dream pop|dreampop/,"Dream pop",/math rock|rock math/,"Math rock",/post-rock|post rock/,"Post-rock",/garage rock|rock garage/,"Garage rock",/indie rock|rock inde/,"Indie rock",/alternative rock|rock alternatif/,"Alternative rock",/psych folk|folk psych|freak folk/,"Psychedelic folk",/psychedelic rock|rock psychedelique|psych rock/,"Psychedelic rock",/surf rock|rock surf/,"Surf rock",/rockabilly/,"Rockabilly",/rock.?n.?roll|fifties|50s|rock 50/,"Fifties rock'n'roll",/southern rock|rock sudiste/,"Southern rock",/blues rock|rock blues/,"Blues rock",/folk rock|rock folk/,"Folk rock",/country rock|rock country/,"Country rock",/arena rock/,"Arena rock",/glam rock|rock glam/,"Glam rock",/coldwave|cold wave/,"Coldwave",/dark wave|darkwave/,"Dark wave",/new wave/,"New wave",/noise rock|rock bruitiste/,"Noise rock",/space rock|rock spatial/,"Space rock",/kraut/,"Krautrock",/goth rock|rock gothique/,"Gothic rock",/synthpop|synth-pop|synth pop/,"Synthpop",/electropop|electro-pop/,"Electropop",/hyperpop|hyper pop/,"Hyperpop",/k-pop|kpop/,"K-pop",/j-pop|jpop/,"J-pop",/city pop|citypop/,"City pop",/dance-pop|dance pop/,"Dance-pop",/chamber pop/,"Chamber pop",/baroque pop/,"Baroque pop",/indie pop|pop inde/,"Indie pop",/bedroom pop/,"Bedroom pop",/bubblegum|bubblegum pop/,"Bubblegum pop",/teen pop/,"Teen pop",/pop rock|rock pop/,"Pop rock",/power pop/,"Power pop",/sophisti-pop|sophisti pop/,"Sophisti-pop",/art pop/,"Art pop",/ambient pop/,"Ambient pop",/future pop/,"Future pop",/trop pop/,"Trop pop",/chanson a texte/,"French chanson a texte",/chanson pop|variete|chanson francaise/,"French chanson pop",/neo-soul|neo soul|soul moderne/,"Neo-soul",/quiet storm/,"Quiet storm",/p-funk|pfunk|parliament/,"P-funk",/philly soul|soul philly/,"Philly soul",/northern soul/,"Northern soul",/doo-wop|doowop/,"Doo-wop",/gospel/,"Gospel soul",/smooth jazz/,"Smooth jazz",/r&b|rnb/,"Contemporary R&B",/boogie/,"Boogie",/disco/,"Disco funk",/funk rock/,"Funk rock",/boom bap|boombap/,"Boom-bap",/old school|old-school/,"Old-school hip-hop",/uk drill/,"UK drill",/drill/,"Drill",/cloud rap/,"Cloud rap",/mumble rap/,"Mumble rap",/conscious rap|rap conscient/,"Conscious rap",/gangsta/,"Gangsta rap",/g-funk|g funk/,"G-funk",/jazz rap|rap jazz/,"Jazz rap",/lofi|lo-fi/,"Lo-fi hip-hop",/phonk/,"Phonk rap",/grime/,"Grime",/crunk/,"Crunk",/chopped and screwed|chopped|screwed/,"Chopped and screwed",/abstract hip|hip hop abstrait/,"Abstract hip-hop",/alternative rap|rap alternatif/,"Alternative rap",/rap francais|rap fr /,"French rap",/hyphy/,"Hyphy",/trap/,"Trap hip-hop",/deep house|house profonde/,"Deep house",/tech house/,"Tech house",/progressive house|house progressive/,"Progressive house",/uk garage|garage uk/,"UK garage",/vocal house|house vocale/,"Vocal house",/afro-house|afro house|afrohouse/,"Afro-house",/minimal techno|techno minimale/,"Minimal techno",/hard techno|techno hard/,"Hard techno",/acid techno|techno acid/,"Acid techno",/detroit techno/,"Detroit techno",/melodic techno|techno melodique/,"Melodic techno",/psytrance|psy-trance|psy trance|goa/,"Psytrance",/uplifting trance|trance /,"Uplifting trance",/hardstyle/,"Hardstyle",/gabber|hardcore techno|hardcore electro/,"Hardcore gabber",/hardtekk|hardtek|tekk/,"Hardtekk",/drum and bass|drum.?n.?bass|\bDNB\b/,"Drum and bass",/jungle/,"Jungle",/breakbeat|break beat/,"Breakbeat",/riddim/,"Riddim",/dubstep/,"Dubstep",/future bass/,"Future bass",/trap edm|edm trap/,"Trap EDM",/electro funk|funk electro/,"Electro funk",/big beat/,"Big beat",/\bidm\b/,"IDM",/glitch/,"Glitch",/downtempo|down tempo/,"Downtempo",/trip-hop|trip hop|triphop/,"Trip-hop",/dark ambient|ambient sombre/,"Dark ambient",/ambient techno|techno ambient/,"Ambient techno",/drone/,"Drone",/synthwave|synth wave/,"Synthwave",/retrowave|retro wave/,"Retrowave",/outrun/,"Outrun",/vaporwave|vapor wave/,"Vaporwave",/chiptune|8-bit|8bit|chip music/,"Chiptune 8-bit",/electro-swing|electro swing|electroswing/,"Electro-swing",/moombahton/,"Moombahton",/jersey club|jersey/,"Jersey club",/new beat/,"New beat",/industrial electro|electro indus/,"Industrial electro",/bebop|bop /,"Bebop",/hard bop/,"Hard bop",/big band/,"Big band",/dixieland|dixie /,"Dixieland",/cool jazz|jazz cool/,"Cool jazz",/modal jazz|jazz modal/,"Modal jazz",/free jazz/,"Free jazz",/acid jazz/,"Acid jazz",/nu-jazz|nu jazz/,"Nu-jazz",/latin jazz|jazz latin/,"Latin jazz",/manouche|gypsy|gipsy|gitan/,"Jazz manouche",/jazz fusion|fusion jazz/,"Jazz fusion",/bossa/,"Bossa nova",/ragtime|rag /,"Ragtime",/stride/,"Stride piano",/swing occidental|western swing/,"Western swing",/swing/,"Swing",/chicago blues|blues chicago/,"Chicago blues",/texas blues|blues texas/,"Texas blues",/piedmont/,"Piedmont blues",/jump blues/,"Jump blues",/swamp blues|swamp/,"Swamp blues",/hill country/,"Hill country blues",/electric blues|blues electrique/,"Electric blues",/delta blues|blues delta/,"Melancholic Delta blues",/honky tonk|honkytonk/,"Honky tonk",/outlaw country|country outlaw/,"Outlaw country",/bluegrass/,"Bluegrass",/newgrass/,"Newgrass",/americana/,"Americana",/alt-country|alt country|country alternatif/,"Alt-country",/cajun/,"Cajun",/zydeco/,"Zydeco",/nashville/,"Nashville sound",/country pop|pop country/,"Country pop",/country /,"Classic country",/singer-songwriter|auteur interprete|chanson a texte/,"Singer-songwriter",/celtic|celtique/,"Celtic folk",/irish|irlandais/,"Irish folk",/nordic|nordique|viking folk/,"Nordic folk",/medieval|medieval folk/,"Medieval folk",/bardcore/,"Bardcore",/shanty|chant marin/,"Sea shanty",/intimate acoustic|acoustique intimiste|unplugged/,"Intimate acoustic",/indie folk|folk inde/,"Indie folk",/folk /,"Traditional folk",/dancehall/,"Dancehall",/rocksteady/,"Rocksteady",/reggae fusion|fusion reggae/,"Reggae fusion",/ragga/,"Ragga",/soca/,"Soca",/calypso/,"Calypso",/kompa/,"Kompa",/zouk/,"Zouk",/ska/,"Ska",/dub /,"Dub",/salsa/,"Salsa",/merengue/,"Merengue",/bachata/,"Bachata",/cumbia/,"Cumbia",/reggaeton/,"Reggaeton",/latin trap|trap latin/,"Latin trap",/latin pop|pop latine/,"Latin pop",/tango/,"Tango",/bolero/,"Bolero",/rumba flamenca/,"Rumba flamenca",/rumba/,"Rumba",/mambo/,"Mambo",/cha-cha|chacha/,"Cha-cha-cha",/samba/,"Samba",/\bmpb\b/,"MPB",/forro/,"Forro",/norteno|norteño/,"Norteno",/mariachi/,"Mariachi",/banda /,"Banda",/flamenco/,"Flamenco",/afropop|afro pop/,"Afropop",/afrobeat|afro beat/,"Afrobeat",/amapiano|piano /,"Amapiano",/highlife|high life/,"Highlife",/juju/,"Juju",/fuji /,"Fuji",/coupe-decale|coupe decale/,"Coupe-decale",/ndombolo/,"Ndombolo",/soukous/,"Soukous",/kizomba/,"Kizomba",/kuduro/,"Kuduro",/mbalax/,"Mbalax",/gnawa|gnaoua/,"Gnawa",/desert blues|blues du desert/,"Desert blues",/ethio/,"Ethio-jazz",/chaabi/,"Chaabi",/gqom/,"Gqom",/rai /,"Rai",/j-rock|jrock/,"J-rock",/enka/,"Enka",/c-pop|cpop|mandopop/,"C-pop",/bollywood|playback indien/,"Bollywood playback",/qawwali/,"Qawwali",/sufi/,"Sufi",/maqam|makam/,"Arabic maqam",/anatolien|anadolu/,"Anatolian rock",/thai |thai pop|musique thai/,"Thai pop",/gamelan/,"Gamelan",/arab pop|pop arabe|musique arabe/,"Arabic pop",/baroque/,"Baroque",/romantique classique|musique romantique|romantic classical/,"Romantic classical",/impressionnisme|impressionist/,"Impressionist classical",/contemporary classical|classique contemporain/,"Contemporary classical",/chambre|chamber music/,"Chamber music",/piano solo|piano seul/,"Solo piano classical",/string orchestra|orchestre a cordes/,"String orchestra",/opera/,"Opera",/choral|chorale|choeur/,"Choral sacred",/requiem/,"Requiem",/ballet/,"Ballet",/marche militaire|military march/,"Military march",/valse|waltz/,"Waltz",/neo-class|neoclassical/,"Neo-classical",/minimalis/,"Minimalist classical",/film |score|bande originale|cinema|film score/,"Film score",/epic trailer|trailer epique|hybrid trailer/,"Epic hybrid trailer",/cinematic trailer|bande annonce/,"Cinematic trailer",/epic|cinematique|cinematic/,"Epic cinematic orchestral",/new age/,"New age",/meditation|relaxation/,"Relaxation meditation",/soundscape|field recording/,"Soundscape",/concrete|musique concrete/,"Musique concrete",/noise experimental|bruitiste/,"Noise experimental",/lofi chill|chill lofi|lo-fi chill/,"Lo-fi chill",/jeu video|video game|game music/,"Video game music",/cirque|circus|cabaret/,"Circus cabaret",/burlesque/,"Burlesque",/noel|christmas/,"Christmas song",/mariage|wedding/,"Wedding music",/hymne|anthem/,"National anthem",/cartoon/,"Cartoon playful",/fanfare/,"Fanfare brass",/italo disco/,"italo disco",/italo dance/,"italo dance",/eurodisco/,"eurodisco",/hi[\s-]*nrg/,"hi-NRG",/goa/,"goa trance",/eurotrance/,"eurotrance",/darkwave/,"darkwave",/cold wave/,"cold wave",/new beat/,"new beat",/outrun/,"outrun",/spacesynth/,"spacesynth",/darksynth/,"darksynth",/fado/,"fado",/klezmer/,"klezmer",/dungeon synth/,"dungeon synth",/spoken word/,"spoken word",/\btrot\b/,"trot",/enka/,"enka",/dansband/,"dansband",/dansktop/,"dansktop",/doo-wop|doo wop/,"doo-wop",/bhangra/,"bhangra",/\bsoca\b/,"soca",/merengue/,"merengue",/bachata/,"bachata",/samba/,"samba",/cumbia/,"cumbia",/cajun/,"cajun",/gnawa/,"gnawa",/highlife/,"highlife",/tango/,"tango nuevo",/lovers rock/,"lovers rock",/reggae.pop/,"reggae-pop",/newgrass/,"newgrass",/merseybeat|mersey/,"merseybeat",/madchester/,"madchester",/chillwave/,"chillwave",/chillout/,"chillout",/slowcore/,"slowcore",/footwork|\bjuke\b/,"footwork",/horrorcore/,"horrorcore",/psychobilly/,"psychobilly",/anatolian/,"anatolian psych",/spaghetti/,"spaghetti western",/alpine folk/,"alpine folk",/tavern folk/,"tavern folk",/protest folk/,"protest folk",/island folk/,"island folk",/andean folk/,"andean folk",/country folk/,"country folk",/celtic punk/,"celtic punk",/cowpunk/,"cowpunk",/hardcore punk/,"hardcore punk",/gospel choir/,"gospel choir",/gregorian/,"gregorian chant fusion",/alt rnb|alternative rnb/,"alt rnb",/classic rnb/,"classic rnb",/trap soul/,"trap soul",/r and b|\brnb\b/,"modern R and B",/melodic dubstep/,"melodic dubstep",/tropical house|tropical/,"tropical house",/vocal jazz/,"vocal jazz",/soul jazz/,"soul jazz",/folk acoustic/,"folk acoustic",/anti-folk|antifolk/,"anti-folk",/indie acoustic/,"indie acoustic",/lofi indie|lo-fi indie/,"lofi indie",/modern country/,"modern country",/folk country/,"folk country",/melodic rap/,"melodic rap",/lyrical rap/,"lyrical rap",/showstopper/,"animated-film musical showstopper",/wagnerian/,"wagnerian rock",/oktoberfest|oompah/,"oktoberfest oompah",/wiesn|schlager/,"wiesn schlager",/austropop/,"austropop",];
  for (var sg = 0; sg < SUBG.length; sg += 2) { if (SUBG[sg].test(n)) return SUBG[sg+1]; }
  if (/\bmetal\b|\bheavy\b/.test(n)) return "Classic heavy metal";
  if (/\brock\b/.test(n)) return "Driving electric rock";
  if (/\bsoul\b|\bfunk\b|\bdisco\b/.test(n)) return "Groovy soul and funk";
  if (/\bpop\b/.test(n)) return "Catchy modern pop";
  if (/\bhip\b|\brap\b|\bboom\b/.test(n)) return "Hard-hitting hip-hop";
  if (/\belectro\b|\bedm\b|\btechno\b|\bhouse\b|\bdance\b|\bclub\b/.test(n)) return "Synthetic club EDM";
  if (/\bjazz\b/.test(n)) return "Improvised jazz combo";
  if (/\bblues\b/.test(n)) return "Melancholic Delta blues";
  if (/\breggae\b/.test(n)) return "Laid-back roots reggae";
  if (/\bmozart\b/.test(n)) return "Mozart-style classical";
  if (/\bclassique\b|\bclassical\b|\borchestr|\bsymphon/.test(n)) return "Full symphonic orchestra";
  if (/ロック|摇滚|搖滾|록/.test(r)) return "Driving electric rock";
  if (/ポップ|流行|팝/.test(r)) return "Catchy modern pop";
  if (/ソウル|ファンク|灵魂|靈魂|放克|소울|펑크/.test(r)) return "Groovy soul and funk";
  if (/メタル|金属|메탈/.test(r)) return "Classic heavy metal";
  if (/ヒップホップ|ラップ|嘻哈|说唱|說唱|힙합|랩/.test(r)) return "Hard-hitting hip-hop";
  if (/エレクトロ|テクノ|ダンス|电子|電子|일렉트로|테크노|댄스/.test(r)) return "Synthetic club EDM";
  if (/ジャズ|爵士|재즈/.test(r)) return "Improvised jazz combo";
  if (/ブルース|蓝调|藍調|블루스/.test(r)) return "Melancholic Delta blues";
  if (/レゲエ|雷鬼|레게/.test(r)) return "Laid-back roots reggae";
  if (/クラシック|オーケストラ|交響|古典|交响|管弦|클래식|오케스트라|교향/.test(r)) return "Full symphonic orchestra";
  if (/रॉक/.test(r)) return "Driving electric rock";
  if (/पॉप/.test(r)) return "Catchy modern pop";
  if (/मेटल/.test(r)) return "Classic heavy metal";
  if (/हिप-हॉप|हिपहॉप|रैप/.test(r)) return "Hard-hitting hip-hop";
  if (/इलेक्ट्रो|टेक्नो|डांस|हाउस/.test(r)) return "Synthetic club EDM";
  if (/जैज|जैज़/.test(r)) return "Improvised jazz combo";
  if (/ब्लूज|ब्लूज़/.test(r)) return "Melancholic Delta blues";
  if (/रेग्गे/.test(r)) return "Laid-back roots reggae";
  if (/सोल|फंक|डिस्को/.test(r)) return "Groovy soul and funk";
  if (/शास्त्रीय|कर्नाटक|ध्रुपद|खयाल|ख़याल|सिम्फनी|ऑर्केस्ट्रा/.test(r)) return "Full symphonic orchestra";
  return null;
}
function answerSong(txt){
  var target = songTargetLang(txt);
  var lang = songCodeOk(target) || curLang();
  try { if (target === "zh" && curLang() === "zh-CN") lang = "zh-CN"; } catch(eZh) {}
  try { if (songCodeOk(target) && target !== curLang()) _songSel = target; } catch(eSS2) {}
  var _fu = null; try{ _fu = fusionFromText(txt); }catch(e){ _fu = null; }
  try{ if (!_fu && /fusion|m\u00e9lange|melange|\bmix\b|medley|2 styles|deux styles|surpren|surpris/i.test(txt || '')){ var _g1 = genreFromText(txt); if (_g1){ var _cg2 = contrastGenre(_g1); if (_cg2 && _cg2 !== _g1) _fu = { v: _g1, c: _cg2 }; } } }catch(e){}
  var pack = generatePack(lang, _fu ? _fu.v : genreFromText(txt), txt, _fu ? _fu.c : null);
  postSong(pack, pack.lang);
  try { var F0 = extractSongFacts(txt); var s0 = curSessionM(); if (s0 && F0 && F0.names && F0.names.length){ s0._lastSong = { names: F0.names.slice(0, 5), facts: F0.facts || "", genre: pack.genre + (pack.fusion ? ' + ' + pack.genreC : '') }; } } catch(eLS) {} }
function watchSongChat(){
  var list = document.querySelector("#messageListEl");
  if (!list){ setTimeout(watchSongChat, 500); return; }
  if (list.dataset.smusicWatch === "1") return;
  list.dataset.smusicWatch = "1";
  var obs = new MutationObserver(function(muts){
    for (var mi = 0; mi < muts.length; mi++){
      var added = muts[mi].addedNodes;
      for (var ni = 0; ni < added.length; ni++){
        var n = added[ni];
        if (!(n instanceof HTMLElement)) continue;
        var isUser = n.classList && n.classList.contains("userRow");
        if (!isUser || n.dataset.smusicAnswered) continue;
        if (n.dataset.smediaAnswered) continue;
        var txt = n.innerText || n.textContent || "";
        if (songBlocked(txt)) continue;
        var _isV = false; try { _isV = isSongVersionRequest(txt); } catch(eV) {}
        if (!isSongRequest(txt) && !_isV) continue;
        n.dataset.smusicAnswered = "1";
        n.dataset.smediaAnswered = "1";
        if (!freshSongMsg(txt)) continue;
        try{ if (_isV) answerSongVersion(txt); else answerSong(txt); }catch(e){ console.warn("[Music] song-in-chat failed", e); }
      }
    }
  });
  obs.observe(list, { childList: true, subtree: false });
}
App.Music = {
open: function(){ buildPanel(); App.Music.buildGrid(); localize(); try{ renderRhythmLab(); }catch(e){} var d = gi('musicModal'); if (d) d.hidden = false; App.Music.generate(); },
close: function(){ try{ stopRhythmPlay(); }catch(e){} var d = gi('musicModal'); if (d) d.hidden = true; },
toggle: function(){ var d = gi('musicModal'); if (d && !d.hidden) App.Music.close(); else App.Music.open(); },
localize: function(){ try{ if (!gi('musicModal')) return; localize(); var d = gi('musicModal'); if (d && !d.hidden) App.Music.generate(); }catch(e){} },
buildGrid: buildGrid, generate: generate, surprise: surprise, applyPreset: applyPreset, applyGenreRhythm: applyGenreRhythm, sunoFamily: function(){ try{ return familyFor(val('mzGenre')); }catch(e){ return null; } }, copyAll: copyAll, copyPack: copyPack, exportTxt: exportTxt,
refreshLyrics: refreshLyrics, checker: checker, aiLyrics: aiLyrics, editLyrics: editLyrics, wrapLyrics: wrapLyrics,
setLyricMode: setLyricMode, writeWithSofia: writeWithSofia, storyRhyme: storyRhyme, storyFree: storyFree, totalSong: totalSong, renderThemeChips: renderThemeChips, renderMyThemes: renderMyThemes, saveMyTheme: saveMyTheme, delMyTheme: delMyTheme, composeSong: composeSong, publishSong: publishSong, coverGo: coverGo, coverPromptText: coverPromptText, mountGallery: mountGallery, renderListen: renderListen,
saveHist: saveHist, loadHist: loadHistSel, delHist: delHist, renderHist: renderHist,
genJourney: genJourney, drawGeo: function(){ drawGeo(); }, lang: curLang, voiceTag: function(){ return BK().meta.voice; },
pack: generatePack, detectSong: isSongRequest, songLang: songTargetLang, songChoice: songLang, uiLang: uiLang, setSongLang: function(l){ try{ _songSel = songCodeOk(l) || null; }catch(e){ _songSel = null; } }, answerSong: answerSong,
openWith: function(pack){ try{ if (pack && pack.lang && songCodeOk(pack.lang) && pack.lang !== curLang()) _songSel = pack.lang; }catch(eSO){} App.Music.open(); try{ if (pack){ if (pack.title) setVal("mzTitre", pack.title); if (pack.lyrics){ setVal("mzCustom", pack.lyrics); App.Music.setLyricMode('mine', true); } if (pack.exclude != null) setVal("mzExclude", pack.exclude); App.Music.generate(); } }catch(e){ console.warn("[Music] openWith failed", e); } },
_m: {}
};
try{ var ctn = document.getElementById('modeTogglesCtn'); if (ctn && !document.getElementById('musicToggleBtn')){ var b = document.createElement('button'); b.id = 'musicToggleBtn'; b.className = 'mode-toggle'; b.onclick = function(){ App.Music.toggle(); }; var sp = document.createElement('span'); sp.className = 'mode-toggle-icon'; sp.textContent = '\uD83C\uDFB5'; b.appendChild(sp); var lb = document.createElement('span'); lb.id = 'musicToggleLabel'; lb.className = 'mode-toggle-label'; lb.textContent = 'Musique'; b.appendChild(lb); ctn.appendChild(b); } }catch(e){}
try{ if (App.UI && App.UI.setLanguage){} }catch(e){}
try{ watchSongChat(); }catch(e){ console.warn("[Music] watch failed", e); }
}
