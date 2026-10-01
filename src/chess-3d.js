// Sofia · Échecs 3D — plateau temps réel + export STL (modèles utilisateur,
// voir src/chess-3d-models/README.md ; extrusion Cburnett en repli)
// Couche Tech (src/) — n'est PAS évaluée comme template Perchance.
//
// Géométries : profils Cburnett (Colin M. L. Burnett, CC BY-SA 3.0 / GFDL —
// voir src/chess/ATTRIBUTION.md) extrudés ; le cavalier reprend la silhouette
// « Art » au socle fin (contour tracé du sprite, même recette que le 2D).
// three.js est chargé en LAZY (import dynamique à la première ouverture) :
// aucun coût réseau/CPU si le 3D n'est jamais ouvert.

const THREE_URL = 'https://esm.sh/three@0.160.0';
const ADDONS_URL = 'https://esm.sh/three@0.160.0/examples/jsm';

const SVG_WHITE = {
  K: '<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill="#fff"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>',
  Q: '<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/><path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none"/></g></svg>',
  R: '<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm-1-22V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M11 14h23" fill="none" stroke-linejoin="miter"/></g></svg>',
  B: '<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke-linejoin="miter"/></g></svg>',
  P: '<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>'
};

// Contour du cavalier « Art » (tracé du sprite 2D, espace 45, y vers le haut).
const KNIGHT_OUTLINE = [[28.71,37.5],[29.53,37.62],[30.59,36.09],[30.59,34.92],[30.35,34.69],[30.59,32.58],[33.4,29.3],[39.02,19.92],[39.73,18.05],[39.73,17.11],[39.26,16.17],[36.56,13.95],[35.63,13.48],[34.92,13.48],[31.64,15.82],[29.3,16.29],[25.08,16.29],[23.2,16.99],[21.8,16.99],[21.45,16.64],[21.45,15.23],[23.67,13.24],[25.31,12.3],[27.89,11.6],[28.59,11.13],[31.41,10.9],[31.99,9.61],[31.76,8.67],[31.17,8.09],[9.14,8.09],[7.38,10.31],[6.21,12.89],[5.27,15.94],[5.04,21.33],[6.21,26.02],[8.32,29.77],[10.78,32.46],[14.3,34.8],[16.88,35.74],[20.16,35.74],[21.8,36.21],[27.19,35.98],[28.59,37.38]];

const PIECE_HEIGHT = { K: 9.6, Q: 9.1, R: 7.4, B: 8.6, N: 8.8, P: 6.2 };
const SQ = 10;
const FILES = 'abcdefgh';

let LIB = null;
async function lib() {
  if (LIB) return LIB;
  const THREE = await import(THREE_URL);
  const oc = await import(ADDONS_URL + '/controls/OrbitControls.js');
  const svg = await import(ADDONS_URL + '/loaders/SVGLoader.js');
  const stl = await import(ADDONS_URL + '/exporters/STLExporter.js');
  const bgu = await import(ADDONS_URL + '/utils/BufferGeometryUtils.js');
  const stll = await import(ADDONS_URL + '/loaders/STLLoader.js');
  LIB = { THREE: THREE, OrbitControls: oc.OrbitControls, SVGLoader: svg.SVGLoader, STLExporter: stl.STLExporter, mergeGeometries: bgu.mergeGeometries, STLLoader: stll.STLLoader };
  return LIB;
}

function shapesFromSvg(L, svgStr) {
  const data = new L.SVGLoader().parse(svgStr);
  const shapes = [];
  for (const p of data.paths) {
    try {
      const st = (p.userData && p.userData.style) || {};
      if (st.fill === 'none') continue;
      const ss = L.SVGLoader.createShapes(p);
      for (const s of ss) shapes.push(s);
    } catch (e) {}
  }
  return shapes;
}

function knightShape(L) {
  const pts = KNIGHT_OUTLINE;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const ordered = area < 0 ? pts.slice().reverse() : pts;
  const sh = new L.THREE.Shape();
  for (let i = 0; i < ordered.length; i++) {
    if (i === 0) sh.moveTo(ordered[i][0], ordered[i][1]);
    else sh.lineTo(ordered[i][0], ordered[i][1]);
  }
  sh.closePath();
  return [sh];
}

function extrudeNormalized(L, shapes, targetH) {
  const THREE = L.THREE;
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 4.2, bevelEnabled: true, bevelThickness: 1.1, bevelSize: 0.9, bevelSegments: 2, curveSegments: 10
  });
  geo.scale(1, -1, 1);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const sx = (bb.max.x - bb.min.x) || 1, sy = (bb.max.y - bb.min.y) || 1, sz = (bb.max.z - bb.min.z) || 1;
  const k = targetH / sy;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  geo.scale(k, k, k);
  geo.computeBoundingBox();
  const bb2 = geo.boundingBox;
  geo.translate(0, -bb2.min.y, 0);
  geo.computeVertexNormals();
  return geo;
}

function sculptKnight(geo, targetH) {
  try {
    const pos = geo.attributes.position;
    const H = targetH || 8.8;
    const headBase = 0.52 * H;
    const XN = 0.55;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const t = y / H;
      x *= XN;
      if (t < 0.28) {
        const k = t / 0.28;
        const s = k * k * (3 - 2 * k);
        z *= 0.55 + 0.45 * s;
        x *= 0.9 + 0.1 * s;
      }
      if (y > headBase) {
        const k = Math.min(1, (y - headBase) / (0.30 * H));
        const s = k * k * (3 - 2 * k);
        y = headBase + (y - headBase) * (1 + 0.35 * s);
        x *= 1 + 0.35 * s;
        z *= 1 + 0.30 * s;
      }
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    geo.translate(0, -bb.min.y, 0);
    geo.computeVertexNormals();
  } catch (e) {}
  return geo;
}

const GEO_CACHE = {};
const STL_GEO = {};
let STL_FAILED = false;
const MODEL_FILES = { K: ['king-body.stl', 'king-cross.stl'], Q: ['queen.stl'], R: ['rook.stl'], B: ['bishop.stl'], N: ['knight.stl'], P: ['pawn.stl'] };

async function loadStlModels(L, onStep) {
  if (STL_FAILED) return false;
  const kinds = Object.keys(MODEL_FILES);
  if (kinds.every((k) => STL_GEO[k])) return true;
  try {
    const loader = new L.STLLoader();
    const geos = {};
    for (const kind of kinds) {
      const parts = [];
      for (const f of MODEL_FILES[kind]) {
        const buf = await (await fetch('src/chess-3d-models/' + f)).arrayBuffer();
        const g = loader.parse(buf);
        g.rotateX(-Math.PI / 2);
        g.computeBoundingBox();
        parts.push(g);
      }
      geos[kind] = parts.length > 1 ? L.mergeGeometries(parts.map((g) => g.index ? g.toNonIndexed() : g), false) : parts[0];
      if (onStep) onStep(kind);
    }
    let refH = 0;
    try {
      geos.K.computeBoundingBox();
      const bb = geos.K.boundingBox;
      refH = bb.max.y - bb.min.y;
      if (!(refH > 0)) {
        const sz = new L.THREE.Vector3();
        geos.K.boundingBox.getSize(sz);
        refH = Math.max(sz.x, sz.y, sz.z);
      }
    } catch (e) {}
    if (!(refH > 0)) throw new Error('king vide');
    const k = (PIECE_HEIGHT.K || 9.6) / refH;
    for (const kind of kinds) {
      const g = geos[kind];
      g.computeBoundingBox();
      const bb = g.boundingBox;
      g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
      g.scale(k, k, k);
      g.computeBoundingBox();
      const b2 = g.boundingBox;
      const w = b2.max.x - b2.min.x, d = b2.max.z - b2.min.z;
      const over = Math.max(w, d) / 9.2;
      if (over > 1) g.scale(1 / over, 1, 1 / over);
      g.computeBoundingBox();
      const b3 = g.boundingBox;
      g.translate(0, -b3.min.y, 0);
      if (kind === 'N') tuneKnight(g);
      else g.computeVertexNormals();
      STL_GEO[kind] = g;
    }
    return true;
  } catch (e) {
    STL_FAILED = true;
    return false;
  }
}
function pieceGeometry(L, kind) {
  if (STL_GEO[kind]) return STL_GEO[kind];
  if (GEO_CACHE[kind]) return GEO_CACHE[kind];
  const shapes = kind === 'N' ? knightShape(L) : shapesFromSvg(L, SVG_WHITE[kind]);
  if (!shapes.length) return null;
  const g = extrudeNormalized(L, shapes, PIECE_HEIGHT[kind] || 8);
  if (kind === 'N') { sculptKnight(g, PIECE_HEIGHT.N); tuneKnight(g); }
  GEO_CACHE[kind] = g;
  return g;
}

// Portage v299 (rondes 298-299, ancien moteur) : tête du cavalier +12 %,
// socle −15 %, lissage smoothstep — appliqué au modèle STL comme au repli.
function tuneKnight(geo) {
  try {
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const H = (bb.max.y - bb.min.y) || 1;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const t = (y - bb.min.y) / H;
      if (t < 0.28) {
        const k = t / 0.28, s = k * k * (3 - 2 * k);
        const f = 0.85 + 0.15 * s;
        x *= f; z *= f;
      } else if (t > 0.55) {
        const k = Math.min(1, (t - 0.55) / 0.30);
        const s = k * k * (3 - 2 * k);
        x *= 1 + 0.12 * s; z *= 1 + 0.12 * s;
      }
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    geo.computeBoundingBox();
    const b2 = geo.boundingBox;
    geo.translate(-(b2.min.x + b2.max.x) / 2, 0, -(b2.min.z + b2.max.z) / 2);
    geo.computeVertexNormals();
  } catch (e) {}
  return geo;
}

function parseBoard(fen) {
  const out = {};
  try {
    const rows = String(fen || '').split(' ')[0].split('/');
    for (let r = 0; r < 8 && r < rows.length; r++) {
      let f = 0;
      for (const ch of rows[r]) {
        if (/\d/.test(ch)) f += parseInt(ch, 10);
        else if (f < 8) { out[FILES[f] + (8 - r)] = ch; f++; }
      }
    }
  } catch (e) {}
  return out;
}

function sqToXZ(sq) {
  const f = FILES.indexOf(sq[0]), r = parseInt(sq[1], 10);
  return [(f - 3.5) * SQ, (3.5 - (r - 1)) * SQ];
}

export function attachChess3d(App) {
  const S = {
    open: false, built: false, renderer: null, scene: null, camera: null,
    controls: null, board3d: null, pieces: null, rings: null, raf: 0,
    timer: 0, selected: null, lastFen: '', lastOri: '', downXY: null,
    loadingEl: null, promoEl: null, resizeObs: null
  };

  function $(id) { return document.getElementById(id); }
  function status(t) { try { const el = $('chess3dStatus'); if (el) el.textContent = t || ''; } catch (e) {} }

  function showLoading() {
    try {
      const host = $('chess3dHost');
      if (!host || S.loadingEl) return;
      const d = document.createElement('div');
      d.className = 'chess3d-loading';
      d.textContent = 'Chargement 3D…';
      host.appendChild(d);
      S.loadingEl = d;
    } catch (e) {}
  }
  function hideLoading() {
    try { if (S.loadingEl) { S.loadingEl.remove(); S.loadingEl = null; } } catch (e) {}
  }

  function matFor(L, color) {
    if (color === 'w') return new L.THREE.MeshStandardMaterial({ color: 0xe4e8ed, roughness: 0.25, metalness: 0.45 });
    return new L.THREE.MeshStandardMaterial({ color: 0x2e2e38, roughness: 0.42, metalness: 0.18 });
  }

  async function ensure() {
    if (S.built) return true;
    const L = await lib();
    const THREE = L.THREE;
    const host = $('chess3dHost');
    if (!host) return false;
    const w = host.clientWidth || 600, h = host.clientHeight || 600;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'chess3d-canvas';
    host.appendChild(renderer.domElement);
    S.renderer = renderer;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0e14);
    scene.fog = new THREE.Fog(0x0c0e14, 160, 320);
    S.scene = scene;
    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 600);
    camera.position.set(0, 62, 78);
    S.camera = camera;
    const controls = new L.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, -2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 30;
    controls.maxDistance = 170;
    controls.maxPolarAngle = 1.35;
    S.controls = controls;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3348, 1.35));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(34, 52, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -55; sun.shadow.camera.right = 55;
    sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55;
    sun.shadow.camera.far = 160;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
    rim.position.set(-30, 24, -40);
    scene.add(rim);
    const board3d = new THREE.Group();
    scene.add(board3d);
    S.board3d = board3d;
    const plateGeo = new THREE.BoxGeometry(88, 2, 88);
    const plate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.7 }));
    plate.position.y = -2;
    plate.receiveShadow = true;
    board3d.add(plate);
    const sqGeo = new THREE.BoxGeometry(SQ, 1, SQ);
    S.sqMeshes = {};
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
      const light = (f + r) % 2 === 1;
      const m = new THREE.Mesh(sqGeo, new THREE.MeshStandardMaterial({ color: light ? 0xf0d9b5 : 0xb58863, roughness: 0.6 }));
      m.position.set((f - 3.5) * SQ, -0.5, (3.5 - r) * SQ);
      m.receiveShadow = true;
      const sq = FILES[f] + (r + 1);
      m.userData.sq = sq;
      board3d.add(m);
      S.sqMeshes[sq] = m;
    }
    S.pieces = new THREE.Group();
    board3d.add(S.pieces);
    S.rings = new THREE.Group();
    board3d.add(S.rings);
    renderer.domElement.addEventListener('pointerdown', (e) => { S.downXY = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', (e) => {
      try {
        if (!S.downXY) return;
        const dx = e.clientX - S.downXY[0], dy = e.clientY - S.downXY[1];
        S.downXY = null;
        if (dx * dx + dy * dy > 36) return;
        pick(e);
      } catch (err) {}
    });
    try {
      S.resizeObs = new ResizeObserver(() => {
        if (!S.open || !S.renderer) return;
        const hh = $('chess3dHost');
        if (!hh || !hh.clientWidth) return;
        S.renderer.setSize(hh.clientWidth, hh.clientHeight);
        S.camera.aspect = hh.clientWidth / hh.clientHeight;
        S.camera.updateProjectionMatrix();
      });
      S.resizeObs.observe(host);
    } catch (e) {}
    S.built = true;
    return true;
  }

  function state() {
    try { return App.Chess.getState(); } catch (e) { return null; }
  }
  function fenOf(st) {
    try { return st.fen || (st.state && st.state.fen) || ''; } catch (e) { return ''; }
  }
  function oriOf() {
    try {
      const b = App.Chess.getBoard();
      const o = b.getOrientation();
      return (o === 'b' || o === 'black') ? 'b' : 'w';
    } catch (e) { return 'w'; }
  }

  function rebuild() {
    const L = LIB, THREE = L.THREE;
    const st = state();
    const fen = fenOf(st);
    while (S.pieces.children.length) {
      const m = S.pieces.children.pop();
      S.pieces.remove(m);
    }
    clearRings();
    S.selected = null;
    const pos = parseBoard(fen);
    for (const sq in pos) {
      const ch = pos[sq];
      const kind = ch.toUpperCase();
      const geo = pieceGeometry(L, kind);
      if (!geo) continue;
      const isW = ch === kind;
      const mesh = new THREE.Mesh(geo, matFor(L, isW ? 'w' : 'b'));
      const xz = sqToXZ(sq);
      mesh.position.set(xz[0], 0, xz[1]);
      if (!isW) mesh.rotation.y = Math.PI;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.sq = sq;
      mesh.userData.piece = ch;
      S.pieces.add(mesh);
    }
    const ori = oriOf();
    S.board3d.rotation.y = ori === 'b' ? Math.PI : 0;
    S.lastFen = fen;
    S.lastOri = ori;
    try {
      const active = !!(st && st.session);
      if (!active) status('Démarrez « Nouvelle partie » pour jouer — la 3D suit le plateau.');
      else {
        const turn = String(fen.split(' ')[1] || 'w') === 'b' ? 'Noirs' : 'Blancs';
        status('Trait aux ' + turn);
      }
    } catch (e) {}
  }

  function clearRings() {
    try {
      while (S.rings.children.length) {
        const m = S.rings.children.pop();
        S.rings.remove(m);
        if (m.geometry) m.geometry.dispose();
      }
    } catch (e) {}
    hidePromo();
  }

  function showRings(L, squares, isCapture) {
    clearRings();
    const THREE = L.THREE;
    for (const sq of squares) {
      const xz = sqToXZ(sq);
      const g = new THREE.RingGeometry(2.6, 3.6, 28);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(xz[0], 0.15, xz[1]);
      m.userData.sq = sq;
      S.rings.add(m);
    }
  }

  function movable() {
    try {
      const b = App.Chess.getBoard();
      return b.getMovable() || {};
    } catch (e) { return {}; }
  }

  function pick(e) {
    const L = LIB, THREE = L.THREE;
    const rect = S.renderer.domElement.getBoundingClientRect();
    const nd = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(nd, S.camera);
    const hitsPieces = ray.intersectObjects(S.pieces.children, false);
    const hitsRings = ray.intersectObjects(S.rings.children, false);
    const hitsSq = ray.intersectObjects(Object.values(S.sqMeshes), false);
    const st = state();
    const fen = fenOf(st);
    const turn = String(fen.split(' ')[1] || 'w') === 'b' ? 'b' : 'w';
    if (hitsRings.length) {
      doMove(hitsRings[0].object.userData.sq);
      return;
    }
    let sq = null, piece = null;
    if (hitsPieces.length) { sq = hitsPieces[0].object.userData.sq; piece = hitsPieces[0].object.userData.piece; }
    else if (hitsSq.length) sq = hitsSq[0].object.userData.sq;
    if (!sq) { deselect(); return; }
    const mv = movable();
    if (S.selected && (mv[S.selected] || []).indexOf(sq) >= 0) { doMove(sq); return; }
    const isOwn = piece && ((turn === 'w' && piece === piece.toUpperCase()) || (turn === 'b' && piece === piece.toLowerCase()));
    if (isOwn && (mv[sq] || []).length) select(sq);
    else deselect();
  }

  function select(sq) {
    deselect(true);
    S.selected = sq;
    try {
      for (const m of S.pieces.children) {
        if (m.userData.sq === sq) { m.material.emissive = new LIB.THREE.Color(0x7a5c00); break; }
      }
    } catch (e) {}
    showRings(LIB, movable()[sq] || []);
  }

  function deselect(keep) {
    S.selected = null;
    try {
      for (const m of S.pieces.children) {
        if (m.material && m.material.emissive) m.material.emissive.setHex(0x000000);
      }
    } catch (e) {}
    if (!keep) clearRings();
  }

  function hidePromo() {
    try { if (S.promoEl) { S.promoEl.remove(); S.promoEl = null; } } catch (e) {}
  }

  function needPromo(from, to) {
    try {
      const pos = parseBoard(fenOf(state()));
      const ch = pos[from];
      if (!ch || (ch !== 'P' && ch !== 'p')) return false;
      const r = parseInt(to[1], 10);
      return (ch === 'P' && r === 8) || (ch === 'p' && r === 1);
    } catch (e) { return false; }
  }

  function doMove(to) {
    const from = S.selected;
    if (!from) return;
    if (needPromo(from, to)) {
      showPromo((letter) => {
        hidePromo();
        sendMove(from + to + letter);
      });
      return;
    }
    sendMove(from + to);
  }

  function sendMove(uci) {
    deselect();
    try {
      const r = App.Chess.tryUserMoveText(uci);
      if (!r || !r.ok) { try { App.Chess.getBoard().flashIllegal(); } catch (e2) {} }
    } catch (e) {}
    setTimeout(refresh, 120);
  }

  function showPromo(cb) {
    hidePromo();
    try {
      const host = $('chess3dHost');
      if (!host) { cb('q'); return; }
      const d = document.createElement('div');
      d.className = 'chess3d-promo';
      const opts = [['q', '♕'], ['r', '♖'], ['b', '♗'], ['n', '♘']];
      for (const o of opts) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = o[1];
        b.title = o[0].toUpperCase();
        b.addEventListener('click', (ev) => { ev.stopPropagation(); cb(o[0]); });
        d.appendChild(b);
      }
      host.appendChild(d);
      S.promoEl = d;
    } catch (e) { cb('q'); }
  }

  function refresh() {
    if (!S.open || !S.built) return;
    const st = state();
    const fen = fenOf(st);
    const ori = oriOf();
    if (fen !== S.lastFen || ori !== S.lastOri) rebuild();
  }

  function loop() {
    if (!S.open) return;
    try {
      S.controls.update();
      S.renderer.render(S.scene, S.camera);
    } catch (e) {}
    S.raf = requestAnimationFrame(loop);
  }

  async function open() {
    const ov = $('chess3dOverlay');
    if (ov) ov.hidden = false;
    S.open = true;
    showLoading();
    status('Chargement 3D…');
    try {
      const ok = await ensure();
      if (!ok) { status('3D indisponible.'); hideLoading(); return true; }
      hideLoading();
      try {
        status('Chargement des modèles…');
        await loadStlModels(LIB);
      } catch (e) {}
      rebuild();
      try {
        const host = $('chess3dHost');
        if (host && host.clientWidth) {
          S.renderer.setSize(host.clientWidth, host.clientHeight);
          S.camera.aspect = host.clientWidth / host.clientHeight;
          S.camera.updateProjectionMatrix();
        }
      } catch (e) {}
      cancelAnimationFrame(S.raf);
      loop();
      if (!S.timer) S.timer = setInterval(refresh, 400);
      return true;
    } catch (e) {
      hideLoading();
      status('3D indisponible (' + String((e && e.message) || e).slice(0, 80) + ').');
      return true;
    }
  }

  function close() {
    S.open = false;
    try { cancelAnimationFrame(S.raf); } catch (e) {}
    try { if (S.timer) { clearInterval(S.timer); S.timer = 0; } } catch (e) {}
    hidePromo();
    try { const ov = $('chess3dOverlay'); if (ov) ov.hidden = true; } catch (e) {}
  }

  async function exportStl() {
    status('Préparation STL…');
    try {
      const L = await lib();
      const THREE = L.THREE;
      const parts = [];
      const order = ['K', 'Q', 'R', 'B', 'N', 'P'];
      for (let i = 0; i < order.length; i++) {
        const g = pieceGeometry(L, order[i]);
        if (!g) continue;
        const c = g.index ? g.toNonIndexed() : g.clone();
        c.translate(i * 56 - 140, 0, 0);
        parts.push(c);
      }
      if (!parts.length) { status('STL impossible.'); return null; }
      const merged = L.mergeGeometries(parts, false);
      const mesh = new THREE.Mesh(merged);
      const data = new L.STLExporter().parse(mesh, { binary: true });
      const blob = new Blob([data], { type: 'model/stl' });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sofia-echecs-6-pieces.stl';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { try { URL.revokeObjectURL(url); a.remove(); } catch (e) {} }, 8000);
      } catch (e) {}
      const tris = Math.max(0, Math.floor((blob.size - 84) / 50));
      status('STL : 6 pièces, ' + tris + ' facettes.');
      try { if (App.UI && App.UI.showToast) App.UI.showToast('STL téléchargé : 6 pièces.', 'success'); } catch (e2) {}
      return { bytes: blob.size, tris: tris };
    } catch (e) {
      status('STL impossible (' + String((e && e.message) || e).slice(0, 60) + ').');
      return null;
    }
  }

  App.Chess.toggle3d = function () { if (S.open) close(); else open(); return S.open; };
  App.Chess.toggle3D = App.Chess.toggle3d;
  App.Chess.open3d = open;
  App.Chess.open3D = open;
  App.Chess.close3d = close;
  App.Chess.close3D = close;
  App.Chess.export3dStl = exportStl;
  App.Chess.export3DStl = exportStl;
  App.Chess.is3dOpen = function () { return S.open; };
  App.Chess.refresh3d = refresh;
  App.Chess3d = { open: open, close: close, exportStl: exportStl, refresh: refresh, debug: S, lib: function () { return LIB; } };
}
