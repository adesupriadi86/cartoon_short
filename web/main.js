import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt, escY } from './story.js';

const W = 720, H = 1280;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.06, 300);
const rx = (a) => a * Math.PI / 180;

// ---------- cel-shaded toon materials ----------
const grad = (() => {
  const d = new Uint8Array([98, 98, 98, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });

const M = {
  sidewalk: texM(P.sidewalk(7), 20, 20),
  grass: toon({ color: '#6fae5f' }),
  panel: toon({ color: '#dfe6ec' }),
  panelDark: toon({ color: '#465260' }),
  steel: toon({ color: '#b0bcc8' }),
  steelDark: toon({ color: '#465260' }),
  steelBright: toon({ color: '#dde6ef' }),
  handrail: toon({ color: '#242730' }),
  yellow: toon({ color: '#f5c418' }),
  red: toon({ color: '#e63946' }),
  redGlow: new THREE.MeshBasicMaterial({ color: '#ff3b30' }),
  greenGlow: new THREE.MeshBasicMaterial({ color: '#4cd964' }),
  orange: toon({ color: '#f47b20' }),
  teal: toon({ color: '#28b8a8' }),
  white: toon({ color: '#f8fafc' }),
  blue: toon({ color: '#1f6fb2' }),
  cloud: toon({ color: '#ffffff' }),
  wood: toon({ color: '#9c6b43' }),
  hazard: texM(P.hazardStripe(), 8, 1),
  glass: new THREE.MeshToonMaterial({ gradientMap: grad, color: '#9ed8f5', transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }),
  // ocean sets
  sand: texM(P.sandTex(7), 20, 20),
  rock: toon({ color: '#7a7f8a' }),
  coralPink: toon({ color: '#ff7f9e' }),
  coralOrange: toon({ color: '#ff9f5a' }),
  coralPurple: toon({ color: '#b07fd4' }),
  seaweed: toon({ color: '#3f9e57' }),
  seaweedDark: toon({ color: '#2a7a42' }),
  sharkGray: toon({ color: '#8fa8bc' }),
  sharkBelly: toon({ color: '#e8eef2' }),
  sharkDark: toon({ color: '#5a7286' }),
  sharkFin: toon({ color: '#5a7286', side: THREE.DoubleSide }),
  rayBrown: toon({ color: '#b08d68' }),
  rayBelly: toon({ color: '#f0e2c8' }),
  rayWing: toon({ color: '#a08060', side: THREE.DoubleSide }),
  scallopShell: toon({ color: '#f2e6d8' }),
  turtleGreen: toon({ color: '#5a8a5a' }),
  turtleShell: toon({ color: '#6b8e5a' }),
  dugongGray: toon({ color: '#9aa5ad' }),
  fishYellow: toon({ color: '#f5c418' }),
  fishBlue: toon({ color: '#4dd0e1' }),
  fishOrange: toon({ color: '#ff8a3d' }),
  netWhite: toon({ color: '#e8e8e8' }),
  bubble: new THREE.MeshToonMaterial({ gradientMap: grad, color: '#dff3ff', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }),
  lightRay: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }),
  gaugeWhite: toon({ color: '#f8fafc' }),
  gaugeRed: toon({ color: '#e63946' }),
  foodBoard: new THREE.MeshBasicMaterial({ map: P.tex(P.foodChain(), 1, 1) }),
  mapBoard: new THREE.MeshBasicMaterial({ map: P.tex(P.coastMap(), 1, 1) }),
  chart71Board: new THREE.MeshBasicMaterial({ map: P.tex(P.chart71(), 1, 1) }),
  declineBoard: new THREE.MeshBasicMaterial({ map: P.tex(P.declineChart(), 1, 1) }),
  finalePlate: new THREE.MeshBasicMaterial({ map: P.tex(P.textPlate('NO SHARKS, NO BALANCE', '#1f6fb2', '#ffffff'), 1, 1) }),
  marketSign: new THREE.MeshBasicMaterial({ map: P.tex(P.textPlate('FISH MARKET', '#e05a47', '#ffffff'), 1, 1) }),
};

// ---------- ink / normal-depth contract ----------
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});

const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = opts.cast ?? true; m.receiveShadow = opts.recv ?? true;
  if (opts.ndSkip) m.userData.ndSkip = true;
  parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// ---------- sky dome ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(220, 24, 14), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .6)); gl_FragColor = linearToOutputTexel(vec4(c,1.)); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1.2); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2.2); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
const dangerLight = new THREE.PointLight('#ff3b30', 0, 8); dangerLight.position.set(0, 3.0, 1.4); scene.add(dangerLight);
const coldLight = new THREE.PointLight('#7dd3fc', 0, 7); coldLight.position.set(0, 2.6, 1.6); scene.add(coldLight);
const warmLight = new THREE.PointLight('#ffb36b', 0, 8); warmLight.position.set(0, 2.7, 1.6); scene.add(warmLight);
scene.fog = new THREE.Fog('#e6eef8', 24, 95);

// ---------- OCEAN FLOOR: sand + rising bubbles + god-rays ----------
const world = new THREE.Group(); scene.add(world);
add(box(240, 0.2, 240), M.sand, 0, -0.3, 0, world, { cast: false });

// rising bubbles (replaces the drifting clouds)
const bubbles = [];
for (let i = 0; i < 14; i++) {
  const s = 0.06 + (i % 4) * 0.03;
  const b = add(new THREE.SphereGeometry(s, 10, 8), M.bubble, -3 + (i * 0.55) % 6, 0.5 + (i % 5), -1.5 + (i % 3), world, { cast: false, ndSkip: true });
  bubbles.push({ mesh: b, x: -3 + (i * 0.55) % 6, z: -1.5 + (i % 3), speed: 0.008 + (i % 3) * 0.004, phase: i * 0.7 });
}
// slanted god-rays from the surface
for (let i = 0; i < 4; i++) {
  const ray = add(new THREE.PlaneGeometry(0.7, 9), M.lightRay, -2.4 + i * 1.6, 5.5, -2.5, world, { cast: false, ndSkip: true });
  ray.rotation.z = 0.35;
}

// ---------- REEF SET: rocks, corals, swaying seaweed ----------
const reefGroup = new THREE.Group(); world.add(reefGroup); reefGroup.visible = false;
const ROCKS = [[-2.6, 0.25, -1.2, 0.8], [2.7, 0.3, -1.4, 1.0], [-1.8, 0.2, -2.2, 0.6], [1.9, 0.22, -2.4, 0.7], [0.3, 0.18, -2.8, 0.55]];
for (const [rx, ry, rz, rs] of ROCKS) {
  const rock = add(new THREE.SphereGeometry(rs, 10, 8), M.rock, rx, ry, rz, reefGroup);
  rock.scale.set(1.3, 0.6, 1);
}
const CORALS = [[-2.6, 0.6, -1.1, 'coralPink'], [2.7, 0.7, -1.3, 'coralOrange'], [-1.8, 0.5, -2.1, 'coralPurple'], [1.9, 0.5, -2.3, 'coralPink'], [0.3, 0.45, -2.7, 'coralOrange']];
for (const [cx, cy, cz, col] of CORALS) {
  add(new THREE.ConeGeometry(0.22, 0.7, 8), M[col], cx - 0.15, cy, cz, reefGroup);
  add(new THREE.SphereGeometry(0.18, 8, 6), M[col], cx + 0.2, cy + 0.05, cz, reefGroup);
}
const seaweedBlades = [];
for (let i = 0; i < 12; i++) {
  const bx = -3.2 + i * 0.58;
  seaweedBlades.push(add(new THREE.ConeGeometry(0.09, 1.6 + (i % 3) * 0.3, 6), i % 2 ? M.seaweed : M.seaweedDark, bx, 0.85, -1.8 - (i % 3) * 0.4, reefGroup));
}

// ---------- SHARKS: hero shark (swims, then vanishes) + tiger shark (patrols) ----------
// Fins are flat DoubleSide triangles, NOT 4-sided cones: cones read as pyramids/diamonds.
const finTri = (w, h, lean) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(lean, h); s.closePath();
  return new THREE.ShapeGeometry(s);
};
const makeShark = (scale, tiger) => {
  const g = new THREE.Group();
  const body = add(new THREE.SphereGeometry(0.5, 16, 12), M.sharkGray, 0, 0, 0, g);
  body.scale.set(2.6, 0.62, 0.55);
  const belly = add(new THREE.SphereGeometry(0.45, 16, 12), M.sharkBelly, 0.1, -0.1, 0, g);
  belly.scale.set(2.3, 0.45, 0.5);
  const snout = add(new THREE.ConeGeometry(0.26, 0.6, 12), M.sharkGray, 1.35, 0, 0, g);
  snout.rotation.z = -Math.PI / 2;
  const dorsal = new THREE.Mesh(finTri(0.6, 0.55, 0.1), M.sharkFin);
  dorsal.position.set(-0.1, 0.22, 0); dorsal.rotation.z = -0.2; dorsal.castShadow = true; g.add(dorsal);
  const finL = new THREE.Mesh(finTri(0.4, 0.35, 0.05), M.sharkFin);
  finL.position.set(0.35, -0.12, 0.22); finL.rotation.set(0.7, 0, 2.6); finL.castShadow = true; g.add(finL);
  const finR = new THREE.Mesh(finTri(0.4, 0.35, 0.05), M.sharkFin);
  finR.position.set(0.35, -0.12, -0.22); finR.rotation.set(-0.7, 0, 2.6); finR.castShadow = true; g.add(finR);
  for (const ez of [0.26, -0.26]) add(new THREE.SphereGeometry(0.05, 8, 6), M.handrail, 1.0, 0.08, ez, g, { cast: false, ndSkip: true });
  const tailPivot = new THREE.Group(); tailPivot.position.set(-1.2, 0, 0); g.add(tailPivot);
  const tailUp = new THREE.Mesh(finTri(0.5, 0.7, 0.05), M.sharkFin);
  tailUp.position.set(-0.12, 0.05, 0); tailUp.castShadow = true; tailPivot.add(tailUp);
  const tailDn = new THREE.Mesh(finTri(0.4, 0.45, 0.05), M.sharkFin);
  tailDn.position.set(-0.12, -0.02, 0); tailDn.rotation.z = Math.PI; tailDn.castShadow = true; tailPivot.add(tailDn);
  if (tiger) { // 3 thin dark bands across the body where it is fullest
    for (const [sx, sh, sd] of [[0.3, 0.55, 0.5], [0.0, 0.6, 0.53], [-0.3, 0.55, 0.5]]) {
      const stripe = add(box(0.05, sh, sd), M.sharkDark, sx, 0.08, 0, g, { cast: false });
      stripe.rotation.z = 0.15;
    }
  }
  g.scale.setScalar(scale);
  return { group: g, tailPivot };
};
const heroShark = makeShark(0.85, false);
heroShark.group.position.set(0, 2.4, -1.2); world.add(heroShark.group); heroShark.group.visible = false;
const tigerShark = makeShark(0.95, true);
tigerShark.group.position.set(0, 3.0, -1.5); world.add(tigerShark.group); tigerShark.group.visible = false;

// ---------- BOARD STAND (food chain / coast map / -71% / decline) ----------
const boardGroup = new THREE.Group(); world.add(boardGroup); boardGroup.visible = false;
add(box(2.6, 3.4, 0.12), M.steelDark, 0, 1.9, 0, boardGroup);
const foodMesh = add(new THREE.PlaneGeometry(2.4, 3.2), M.foodBoard, 0, 1.9, 0.075, boardGroup, { cast: false });
const mapMesh = add(new THREE.PlaneGeometry(2.4, 3.2), M.mapBoard, 0, 1.9, 0.075, boardGroup, { cast: false });
const chart71Mesh = add(new THREE.PlaneGeometry(2.4, 3.2), M.chart71Board, 0, 1.9, 0.075, boardGroup, { cast: false });
const declineMesh = add(new THREE.PlaneGeometry(2.4, 3.2), M.declineBoard, 0, 1.9, 0.075, boardGroup, { cast: false });
for (const s of [-0.95, 0.95]) add(box(0.12, 0.35, 0.65), M.steelDark, s, 0.18, 0, boardGroup);

// ---------- DOMINOES (chain reaction, fall one by one) ----------
const dominoGroup = new THREE.Group(); world.add(dominoGroup); dominoGroup.visible = false;
add(box(4.6, 0.15, 0.9), M.wood, 0, 0.08, -0.8, dominoGroup, { cast: false });
const dominoes = [];
const DOMINO_COLORS = ['#e05a47', '#f08a2c', '#f5c418', '#3fa36c', '#2f6fb2'];
for (let i = 0; i < 5; i++) {
  const pivot = new THREE.Group(); pivot.position.set(-1.4 + i * 0.7, 0.15, -0.8); dominoGroup.add(pivot);
  add(box(0.14, 0.85, 0.5), toon({ color: DOMINO_COLORS[i] }), 0, 0.425, 0, pivot);
  add(new THREE.SphereGeometry(0.06, 8, 6), M.white, 0, 0.7, 0.26, pivot, { cast: false, ndSkip: true });
  dominoes.push(pivot);
}

// ---------- COWNOSE RAY SWARM (multiplies as sharks vanish) ----------
const makeRay = () => {
  const g = new THREE.Group();
  // Face the camera: a ray's wings span its sides, so swimming toward the
  // camera puts the diamond silhouette on screen (swimming across hides
  // the wings edge-on). Flap pivots then read as up/down on screen.
  g.rotation.y = Math.PI / 2;
  const body = add(new THREE.SphereGeometry(0.28, 12, 8), M.rayBrown, 0, 0, 0, g);
  body.scale.set(1.8, 0.35, 1.0);
  const belly = add(new THREE.SphereGeometry(0.24, 12, 8), M.rayBelly, 0, -0.05, 0, g);
  belly.scale.set(1.6, 0.22, 0.85);
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0); wingShape.lineTo(-0.35, 0.6); wingShape.lineTo(0.45, 0.6); wingShape.closePath();
  const wingGeo = new THREE.ShapeGeometry(wingShape);
  const pivR = new THREE.Group(); g.add(pivR);
  const wR = new THREE.Mesh(wingGeo, M.rayWing); wR.rotation.x = Math.PI / 2 - 0.6; wR.castShadow = true; pivR.add(wR);
  const pivL = new THREE.Group(); g.add(pivL);
  const wL = new THREE.Mesh(wingGeo, M.rayWing); wL.rotation.x = -Math.PI / 2 + 0.6; wL.castShadow = true; pivL.add(wL);
  return { group: g, pivR, pivL };
};
const rays = [];
const RAY_SPOTS = [[-2.2, 2.0, -0.3], [-1.2, 2.5, 0.3], [-0.3, 1.9, -0.4], [0.7, 2.6, 0.2], [1.6, 2.1, -0.2], [2.3, 2.7, 0.3], [-1.8, 2.8, 0.1], [0.2, 2.9, -0.3]];
for (const [rx, ry, rz] of RAY_SPOTS) {
  const r = makeRay();
  r.group.position.set(rx, ry, rz);
  r.baseX = rx; r.baseY = ry;
  world.add(r.group); r.group.visible = false;
  rays.push(r);
}

// ---------- SCALLOP BED (stripped bare by the rays) + empty net ----------
const scallopGroup = new THREE.Group(); world.add(scallopGroup); scallopGroup.visible = false;
const scallops = [];
for (let i = 0; i < 10; i++) {
  const sx = -2.2 + (i % 5) * 1.1, sz = 0.3 + Math.floor(i / 5) * 0.5;
  const shell = add(new THREE.SphereGeometry(0.22, 10, 8), i % 2 ? M.scallopShell : M.coralPink, sx, 0.12, sz, scallopGroup);
  shell.scale.set(1, 0.35, 1);
  scallops.push(shell);
}
add(box(2.2, 0.05, 0.06), M.netWhite, 0, 0.22, -0.02, scallopGroup, { cast: false });
add(box(2.2, 0.05, 0.06), M.netWhite, 0, 0.22, 1.12, scallopGroup, { cast: false });
add(box(0.06, 0.05, 1.2), M.netWhite, -1.07, 0.22, 0.55, scallopGroup, { cast: false });
add(box(0.06, 0.05, 1.2), M.netWhite, 1.07, 0.22, 0.55, scallopGroup, { cast: false });
for (let i = 0; i < 5; i++) add(box(0.03, 0.02, 1.14), M.steelDark, -0.88 + i * 0.44, 0.22, 0.55, scallopGroup, { cast: false });
for (let i = 0; i < 3; i++) add(box(2.14, 0.02, 0.03), M.steelDark, 0, 0.22, 0.28 + i * 0.27, scallopGroup, { cast: false });

// ---------- SHARK BAY: tall seagrass, turtle, dugong ----------
const seagrassGroup = new THREE.Group(); world.add(seagrassGroup); seagrassGroup.visible = false;
const tallBlades = [];
for (let i = 0; i < 14; i++) {
  const bx = -3.4 + i * 0.52;
  tallBlades.push(add(new THREE.ConeGeometry(0.07, 2.2 + (i % 3) * 0.4, 6), i % 2 ? M.seaweed : M.seaweedDark, bx, 1.1, -1.2 - (i % 4) * 0.3, seagrassGroup));
}
const turtleGroup = new THREE.Group(); turtleGroup.position.set(-2.0, 0.6, 0.3); turtleGroup.scale.setScalar(1.3); seagrassGroup.add(turtleGroup);
const tShell = add(new THREE.SphereGeometry(0.5, 14, 10), M.turtleShell, 0, 0, 0, turtleGroup);
tShell.scale.set(1.3, 0.55, 1.0);
add(new THREE.SphereGeometry(0.16, 10, 8), M.turtleGreen, 0.75, 0.05, 0, turtleGroup);
for (const [fx, fz] of [[0.4, 0.45], [0.4, -0.45], [-0.45, 0.45], [-0.45, -0.45]]) {
  const flip = add(new THREE.SphereGeometry(0.16, 8, 6), M.turtleGreen, fx, -0.1, fz, turtleGroup);
  flip.scale.set(1.2, 0.25, 0.7);
}
const dugongGroup = new THREE.Group(); dugongGroup.position.set(2.0, 0.65, -0.3); dugongGroup.scale.setScalar(1.3); seagrassGroup.add(dugongGroup);
const dBody = add(new THREE.SphereGeometry(0.5, 14, 10), M.dugongGray, 0, 0, 0, dugongGroup);
dBody.scale.set(1.9, 0.75, 0.7);
add(new THREE.SphereGeometry(0.2, 10, 8), M.dugongGray, 1.0, 0.1, 0, dugongGroup);
const dTail = add(new THREE.ConeGeometry(0.3, 0.6, 4), M.dugongGray, -1.1, 0, 0, dugongGroup);
dTail.rotation.z = Math.PI / 2; dTail.scale.set(1, 1, 0.3);

// ---------- FISH SCHOOL (baby fish circling / scattering) ----------
const fishSchoolGroup = new THREE.Group(); world.add(fishSchoolGroup); fishSchoolGroup.visible = false;
const schoolFish = [];
const FISH_COLS = [M.fishYellow, M.fishBlue, M.fishOrange];
for (let i = 0; i < 10; i++) {
  const fg = new THREE.Group();
  const fb = add(new THREE.SphereGeometry(0.12, 10, 8), FISH_COLS[i % 3], 0, 0, 0, fg);
  fb.scale.set(1.8, 0.7, 0.6);
  const ft = add(new THREE.ConeGeometry(0.08, 0.18, 4), FISH_COLS[i % 3], -0.24, 0, 0, fg, { cast: false });
  ft.rotation.z = Math.PI / 2; ft.scale.set(1, 1, 0.3);
  fishSchoolGroup.add(fg);
  schoolFish.push({ g: fg, a: (i / 10) * Math.PI * 2, r: 1.2 + (i % 3) * 0.3, y: 2.0 + (i % 4) * 0.35, sp: 0.02 + (i % 3) * 0.008 });
}

// ---------- FISH MARKET STALL ----------
const marketGroup = new THREE.Group(); world.add(marketGroup); marketGroup.visible = false;
add(box(2.6, 0.9, 1.0), M.wood, 0, 0.45, 0, marketGroup);
add(box(2.8, 0.12, 1.2), M.white, 0, 0.95, 0, marketGroup);
add(box(2.9, 1.0, 0.12), M.steelDark, 0, 3.3, -0.4, marketGroup);
add(new THREE.PlaneGeometry(2.7, 0.84), M.marketSign, 0, 3.3, -0.33, marketGroup, { cast: false });
for (const s of [-1.2, 1.2]) add(box(0.12, 2.4, 0.12), M.steelDark, s, 1.6, -0.4, marketGroup);
for (const s of [-1.25, 1.25]) add(box(0.08, 1.3, 0.08), M.steelDark, s, 1.6, 0.3, marketGroup);
for (let i = 0; i < 6; i++) {
  add(box(0.48, 0.06, 1.4), i % 2 ? M.white : M.red, -1.25 + i * 0.5, 2.2, 0, marketGroup, { cast: false });
}
for (let i = 0; i < 5; i++) {
  const fg = new THREE.Group(); fg.position.set(-1.0 + i * 0.5, 1.05, 0.1); marketGroup.add(fg);
  const fb = add(new THREE.SphereGeometry(0.12, 10, 8), FISH_COLS[i % 3], 0, 0, 0, fg);
  fb.scale.set(1.8, 0.7, 0.6);
}

// ---------- FINALE TITLE PLATE STAND (guard_finale) ----------
const finaleGroup = new THREE.Group(); world.add(finaleGroup); finaleGroup.visible = false;
add(box(4.8, 1.5, 0.12), M.steelDark, 0, 3.4, 3.2, finaleGroup);
add(new THREE.PlaneGeometry(4.6, 1.44), M.finalePlate, 0, 3.4, 3.27, finaleGroup, { cast: false });
for (const s of [-1.9, 1.9]) add(box(0.12, 2.7, 0.12), M.steelDark, s, 1.35, 3.2, finaleGroup);

// ---------- 2D CHARACTER & FX CARDS ----------
const CW = 1200, CH = 2000, CM = 2.15;
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.55));
class Card {
  constructor() {
    const c = document.createElement('canvas'); c.width = CW; c.height = CH;
    this.c = c; this.g = c.getContext('2d');
    this.t = new THREE.CanvasTexture(c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post (Ink + Fast 16-tap DOF) ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 0 });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H);
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };

const inkU = {
  col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) },
  px: { value: 2.3 }, sat: { value: 1.12 }, lift: { value: new THREE.Color(0, 0, 0) },
  gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.2 }, flash: { value: 0 },
};
const inkScene = fs(new THREE.ShaderMaterial({
  uniforms: inkU,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(6./d, .65, 1.25);
    for (int i=0;i<8;i++){ float a = float(i)*.785398;
      vec2 o = vec2(cos(a), sin(a))*rr/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;
      if (card) ds = 1e4;
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.008, .024, (ds - d)/d));
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.86, .70, dot(n, ns)) * .92);
    }
    return e * (1. - smoothstep(45., 140., d)*.75);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.018,.012,.022), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.1;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = linearToOutputTexel(vec4(c,1.)); }`
}));

const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({
  uniforms: dofU,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 500.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.3); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .7) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<8;i++){ float fi = float(i); float r = sqrt((fi+.5)/8.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }`
}));
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame update ----------
const tmpV = new THREE.Vector3();
function applyLight(L) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor);
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  inkU.vig.value = L.vig ?? 0.2;
}
function placeSun(L, focus) {
  const az = rx(L.az), el = rx(L.el);
  tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  sun.position.copy(focus).addScaledVector(tmpV, 28); sun.target.position.copy(focus);
  const ext = L.shadowExt || 16, sc = sun.shadow.camera;
  sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 90; sc.updateProjectionMatrix();
}

function updateWorld(W_, f) {
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  // sets
  reefGroup.visible = !!W_.reef;
  boardGroup.visible = W_.board !== 'none';
  foodMesh.visible = W_.board === 'food';
  mapMesh.visible = W_.board === 'map';
  chart71Mesh.visible = W_.board === 'chart71';
  declineMesh.visible = W_.board === 'decline';
  dominoGroup.visible = !!W_.dominoes;
  scallopGroup.visible = !!W_.scallops;
  seagrassGroup.visible = !!W_.seagrass;
  fishSchoolGroup.visible = !!W_.fishSchool;
  marketGroup.visible = !!W_.market;
  finaleGroup.visible = !!W_.finalePlate;
  // hero shark: swims left->right across the reef, then vanishes
  if (W_.shark) {
    heroShark.group.visible = true;
    if (W_.fishSchool) { // it_is_fear: shadow passes overhead
      heroShark.group.position.set(-3 + 6 * ((f - 204) / 26), 3.8, -0.3);
      heroShark.group.scale.setScalar(1.1);
    } else { // hook_vanish: swim across, then vanish
      heroShark.group.position.set(-4 + 8 * (f / 79), 2.4 + Math.sin(f * 0.1) * 0.15, -1.2);
      heroShark.group.scale.setScalar(Math.max(0.001, 0.85 * (1 - (W_.sharkVanish || 0))));
    }
    heroShark.tailPivot.rotation.y = Math.sin(f * 0.18) * 0.4;
  } else {
    heroShark.group.visible = false;
  }
  // tiger shark: slow patrol back and forth over the seagrass
  tigerShark.group.visible = !!W_.tiger;
  if (W_.tiger) {
    tigerShark.group.position.set(Math.sin(f * 0.02) * 1.2, 3.0 + Math.sin(f * 0.08) * 0.1, -1.5);
    tigerShark.group.rotation.y = Math.cos(f * 0.02) > 0 ? 0 : Math.PI;
    tigerShark.tailPivot.rotation.y = Math.sin(f * 0.18) * 0.4;
  }
  // dominoes fall one by one
  dominoes.forEach((pv, i) => {
    const t = clamp01((W_.dominoFall || 0) * 5 - i);
    pv.rotation.z = -smooth(t) * 1.35;
  });
  // rays multiply + flap (symmetric: both wings up together; dihedral base in the mesh)
  rays.forEach((r, i) => {
    const vis = (W_.rayCount || 0) * 8;
    r.group.visible = i < vis;
    if (r.group.visible) {
      const s = 0.5 + 0.5 * clamp01(vis - i);
      r.group.scale.setScalar(s);
      const flap = Math.sin(f * 0.25 + i * 1.3) * 0.45;
      r.pivR.rotation.x = -flap; r.pivL.rotation.x = flap;
      r.group.position.y = r.baseY + Math.sin(f * 0.05 + i * 2) * 0.15;
      r.group.position.x = r.baseX + Math.sin(f * 0.02 + i) * 0.2;
    }
  });
  // scallops shrink away as the rays strip the bed
  scallops.forEach((s, i) => {
    const t = clamp01((W_.scallopBare || 0) * 1.4 - i * 0.05);
    const k = 1 - smooth(t) * 0.92;
    s.scale.set(k, 0.35 * k, k);
  });
  // seagrass sways; turtle & dugong flee from the tiger shark's path
  seaweedBlades.forEach((b, i) => { b.rotation.z = 0.08 * Math.sin(f * 0.05 + i * 1.7); });
  tallBlades.forEach((b, i) => { b.rotation.z = 0.06 * Math.sin(f * 0.04 + i * 1.3); });
  const flee = W_.flee || 0;
  turtleGroup.position.x = -2.0 - flee * 1.3;
  dugongGroup.position.x = 2.0 + flee * 1.3;
  turtleGroup.position.y = 0.6 + Math.sin(f * 0.06) * 0.05;
  dugongGroup.position.y = 0.65 + Math.sin(f * 0.05 + 1) * 0.05;
  // fish school circles
  schoolFish.forEach((sf) => {
    const ang = sf.a + f * sf.sp;
    sf.g.position.set(Math.cos(ang) * sf.r, sf.y + Math.sin(f * 0.1 + sf.a) * 0.1, Math.sin(ang) * 0.4);
    sf.g.rotation.y = -ang - Math.PI / 2;
  });
  // bubbles rise
  for (const b of bubbles) {
    const t = ((f * b.speed + b.phase) % 1);
    b.mesh.position.set(b.x + Math.sin(f * 0.03 + b.phase) * 0.15, 0.3 + t * 7, b.z);
    b.mesh.visible = !!W_.bubbles;
  }
  // lights: red pulse while "it is fear", warm glow on the finale
  coldLight.intensity = 0;
  warmLight.intensity = W_.finalePlate ? 3.2 : 0;
  if (W_.fearGlow) {
    dangerLight.position.set(0, 2.0, 1.4);
    dangerLight.intensity = 2.5 + Math.sin(f * 0.5) * 1.0;
  } else {
    dangerLight.intensity = 0;
  }
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false) {
      c.blob.visible = true;
      c.blob.position.set(a.x, (a.ground ?? a.y) + 0.02, a.z);
      c.blob.scale.set(0.85 * s, 0.55 * s, 1);
    }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip || o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0;
      if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); updateWorld(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  // pass A: color
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const ds = fs(new THREE.MeshBasicMaterial({ map: rtNd.texture })); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // pass C: ink + color grade directly to screen (sRGB)
  inkU.px.value = 1.6; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0);
  renderer.setRenderTarget(null); renderer.render(inkScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
