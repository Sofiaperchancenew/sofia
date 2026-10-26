// Cover art d'un morceau — prompt builder vendu depuis music-cover-studio
// (GENRE_SNIPPETS + STYLE_SNIPPETS + garde anti-texte), condense en regles mot-cle
// pour couvrir les 334 libelles SOUND.genre sans embarquer 40+40 tables.
// Usage : buildCoverPrompt(titre, genreLabel, styleLabel) -> {prompt, negative}.
// Generation : root.generateImage({prompt, negativePrompt, resolution:'768x768'}).
const COVER_RULES = [
  ['black metal', 'black metal, raw, cold forest, monochrome'], ['death metal', 'death metal, brutal, dark, extreme'],
  ['doom', 'doom metal, slow, heavy, occult'], ['thrash', 'thrash metal, aggressive, moshpit'],
  ['power metal', 'power metal, epic, fantasy battle'], ['symphonic metal', 'symphonic metal, orchestral, dramatic'],
  ['nu metal', 'nu metal, urban decay, red lights'], ['metalcore', 'metalcore, dark stage, strobes'],
  ['djent', 'djent, geometric, mechanical'], ['grind', 'grindcore, chaotic collage'],
  ['sludge', 'sludge, swamp, dirty texture'], ['viking', 'viking metal, longship, stormy sea'],
  ['pirate', 'pirate metal, galleon, kraken'], ['metal', 'metal, dark aggressive, fire, intricate detail'],
  ['punk', 'punk, DIY collage, rebellion'], ['grunge', 'grunge, dirty flannel, rain'],
  ['rock', 'rock music, electric guitar, raw energy, stage lights'],
  ['hip-hop', 'hip hop, 808 bass, street aesthetic, urban'], ['hip hop', 'hip hop, 808 bass, street aesthetic, urban'],
  ['rap', 'rap, microphone, city night'], ['trap', 'trap music, neon city, luxury cars'],
  ['drill', 'drill, dark estate, night'], ['boom-bap', 'boom bap, vinyl, basketball court'],
  ['lo-fi', 'lofi, cozy room, vinyl crackle, warm tones'], ['lofi', 'lofi, cozy room, vinyl crackle, warm tones'],
  ['house', 'house music, club scene, warm groove'], ['techno', 'techno, industrial, dark warehouse'],
  ['trance', 'trance, cosmic euphoria, lasers'], ['dubstep', 'dubstep, bass drop, dark gritty texture'],
  ['drum & bass', 'drum and bass, jungle patterns, energetic'], ['drum and bass', 'drum and bass, jungle patterns, energetic'],
  ['synthwave', 'synthwave, 80s retro, neon grids, chrome sunset'], ['vapor', 'vaporwave, statues, pastel grid'],
  ['cyber', 'cyberpunk, neon city, rain, holographic'], ['ebm', 'industrial EBM, steel, smoke'],
  ['edm', 'edm festival, main stage, fireworks'], ['club', 'club night, lasers, crowd'],
  ['ambient', 'ambient, ethereal landscape, soft clouds'], ['jazz', 'jazz, smoky bar, saxophone, vintage'],
  ['soul', 'soul music, warm tones, vintage vinyl'], ['funk', 'funk, groove, purple lights'],
  ['blues', 'blues, dusty road, neon bar sign'], ['reggae', 'reggae, island, sunset, lion'],
  ['country', 'country, desert highway, pickup'], ['folk', 'folk, forest, campfire, acoustic'],
  ['chanson', 'chanson, paris rooftops, accordion'], ['gospel', 'gospel, church light, choir robes'],
  ['classical', 'classical, concert hall, strings'], ['symphonic', 'symphonic, orchestra, golden hall'],
  ['opera', 'opera, red curtain, drama'], ['pop', 'pop music, colorful, bright, glossy'],
  ['comedy', 'comedy, circus, confetti']
];

export const COVER_STYLES = {
  'Cinematic': 'cinematic, film still, dramatic lighting',
  'Photorealistic': 'photorealistic, hyperrealistic, highly detailed',
  'Anime': 'anime style, cel shaded, vibrant',
  'Synthwave': 'synthwave, neon grids, chrome',
  'Oil Painting': 'oil painting, textured brushstrokes',
  'Watercolor': 'watercolor, soft edges, paper texture',
  'Minimal': 'minimalist, clean, geometric, negative space',
  'Luxury': 'luxury, gold accents, elegant',
  'Gothic': 'gothic, dark, mysterious',
  'Vaporwave': 'vaporwave, pastel, retro statue',
  'Comic': 'comic book style, bold lines, halftone',
  '3D Render': '3d render, octane, dimensional',
  'Dark Fantasy': 'dark fantasy, gothic, mysterious, dramatic shadows',
  'Fantasy': 'fantasy art, magical, ethereal, mystical',
  'Cyberpunk': 'cyberpunk, neon lights, futuristic city, blade runner aesthetic',
  'Sci-Fi': 'science fiction, futuristic, space, advanced technology',
  'Manga': 'manga style, black and white, dramatic ink, japanese comic',
  'Modern': 'modern, contemporary, sleek, clean design',
  'Abstract': 'abstract, non-representational, shapes, colors, forms',
  'Digital Painting': 'digital painting, concept art, artstation quality',
  'Ink': 'ink art, bold strokes, black and white, sumi-e style',
  'Sketch': 'pencil sketch, hand-drawn, rough lines, artistic',
  'Clay': 'clay render, soft 3d, plastic material, soft shadows',
  'Octane Render': 'octane render, photorealistic 3d, ray tracing, glass material',
  'Cinema4D': 'cinema 4d, 3d render, smooth surfaces, studio lighting',
  'Unreal Engine': 'unreal engine 5, ultra realistic, nanite, lumen',
  'Blender': 'blender render, 3d, cycles render, procedural',
  'Low Poly': 'low poly, geometric, faceted, minimal 3d',
  'Pixel Art': 'pixel art, 8-bit, retro game, blocky pixels',
  'Paper Cut': 'paper cut, layered paper, craft, handmade texture',
  'Collage': 'collage, mixed media, torn paper, layered',
  'Neon': 'neon, glowing lights, vibrant, electric colors',
  'Retro': 'retro, vintage, 80s, nostalgia, aged',
  'Vintage': 'vintage, aged, faded, retro film, old photograph',
  'Grunge': 'grunge, distressed, dirty, raw, punk aesthetic',
  'Steampunk': 'steampunk, brass, gears, victorian, mechanical',
  'Surrealism': 'surrealism, dreamlike, impossible, salvador dali inspired',
  'Dreamcore': 'dreamcore, ethereal, soft, pastel, dreamy atmosphere',
  'Y2K': 'y2k, early 2000s, chrome, holographic, bubble',
  'Brutalism': 'brutalism, raw concrete, harsh, bold, architectural',
  'Minimalism': 'minimalism, extreme simplicity, clean, white space'
};
export const COVER_STYLE_LABELS = Object.keys(COVER_STYLES);

function coverGenre(label) {
  var s = String(label || '').toLowerCase();
  for (var i = 0; i < COVER_RULES.length; i++) {
    if (s.indexOf(COVER_RULES[i][0]) !== -1) return COVER_RULES[i][1];
  }
  return 'eclectic music, colorful abstraction';
}

function dedupe(str) {
  var seen = {};
  return String(str).split(',').map(function (p) { return p.trim(); }).filter(function (p) {
    var k = p.toLowerCase();
    if (!k || seen[k]) return false;
    seen[k] = 1;
    return true;
  }).join(', ');
}

export function buildCoverPrompt(title, genreLabel, styleLabel) {
  var g = coverGenre(genreLabel);
  var s = COVER_STYLES[styleLabel] || COVER_STYLES['Cinematic'];
  // Volontairement : le titre n'est JAMAIS injecté dans le prompt visuel,
  // sinon le modèle dessine du lettrage dans l'image. Aucun texte requis.
  void title;
  var prompt = dedupe('album cover art with no text, no typography, no letters, no words, no lettering, ' + g + ', ' + s + ', moody lighting, professional artwork, high detail, sharp focus, balanced composition, no text anywhere in the image').slice(0, 900);
  var negative = dedupe('text, typography, letters, words, lettering, captions, titles, title card, watermark, logo, signature, label, subtitle, blur, low quality, distorted, text artifacts').slice(0, 500);
  return { prompt: prompt, negative: negative };
}
