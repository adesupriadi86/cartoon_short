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
  floor: texM(P.mallTile(1), 16, 16),
  wall: texM(P.mallWall(5, '#f5efe4', '#dfd1bc'), 4, 2),
  wallAccent: texM(P.mallWall(6, '#e3eef7', '#b8d0e6'), 3, 2),
  step: texM(P.stepMetal(2), 1, 1),
  skirt: texM(P.skirtMetal(3), 4, 1),
  bristle: texM(P.bristleTex(4), 10, 1),
  hazard: texM(P.hazardStripe(), 8, 1),
  steel: toon({ color: '#b0bcc8' }),
  steelDark: toon({ color: '#465260' }),
  steelBright: toon({ color: '#dde6ef' }),
  handrail: toon({ color: '#242730' }),
  yellow: toon({ color: '#f5c418' }),
  red: toon({ color: '#e63946' }),
  redGlow: new THREE.MeshBasicMaterial({ color: '#ff3b30' }),
  orange: toon({ color: '#f47b20' }),
  teal: toon({ color: '#28b8a8' }),
  white: toon({ color: '#f8fafc' }),
  wood: toon({ color: '#9c6b43' }),
  pot: toon({ color: '#c96f4a' }),
  leaf: toon({ color: '#3b8c52' }),
  leafLight: toon({ color: '#58ad66' }),
  glass: new THREE.MeshToonMaterial({ gradientMap: grad, color: '#9ed8f5', transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }),
  shopA: texM(P.shopFront('SNEAKERS', '#2b5d8a', '#f5c418'), 1, 1),
  shopB: texM(P.shopFront('COFFEE', '#7c4a32', '#f4d35e'), 1, 1),
  shopC: texM(P.shopFront('ARCADE', '#5e3c99', '#4cc9f0'), 1, 1),
  shopD: texM(P.shopFront('FASHION', '#b83b5e', '#f9ed69'), 1, 1),
  codeBoard: new THREE.MeshBasicMaterial({ map: P.tex(P.safetyCodeBoard(), 1, 1) }),
  warnGap: new THREE.MeshBasicMaterial({ map: P.tex(P.warnLabel('DANGER: GAP'), 1, 1) }),
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

// ---------- sky dome (visible through mall skylights) ----------
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
scene.fog = new THREE.Fog('#e6eef8', 24, 95);

// ---------- 3D SHOPPING MALL ATRIUM ----------
const world = new THREE.Group(); scene.add(world);
// lower floor
const floor = add(box(64, 0.4, 48), M.floor, 0, -0.2, 0, world, { cast: false });
// upper mezzanine (starts at x = 8.0, y = 6.4) + side balconies
add(box(24, 0.45, 44), M.floor, 20, 6.18, 0, world, { cast: false });
add(box(48, 0.45, 14), M.floor, -4, 6.18, -13, world, { cast: false });
add(box(48, 0.45, 14), M.floor, -4, 6.18, 13, world, { cast: false });
// mezzanine railing bars
for (const z of [-6.2, 6.2]) {
  add(box(26, 0.1, 0.14), M.steelBright, -5, 7.35, z, world);
  add(box(26, 0.9, 0.06), M.glass, -5, 6.88, z, world, { cast: false, ndSkip: true });
  for (let x = -16; x <= 8; x += 4) add(box(0.14, 1.0, 0.14), M.steelDark, x, 6.9, z, world);
}
// back mall walls & bright colorful storefronts
add(box(64, 15, 0.8), M.wall, 0, 7.5, -16, world, { cast: false });
add(box(64, 15, 0.8), M.wallAccent, 0, 7.5, 16, world, { cast: false });
add(box(0.8, 15, 34), M.wall, 24, 7.5, 0, world, { cast: false });
add(box(0.8, 15, 34), M.wallAccent, -24, 7.5, 0, world, { cast: false });

// storefronts on lower & upper levels (non-mirrored faces pointing into the atrium)
const addShop = (mat, x, y, z, ry = 0) => {
  const m = add(box(6.2, 4.2, 0.3), mat, x, y, z, world, { cast: false }); m.rotation.y = ry; return m;
};
addShop(M.shopA, -9, 2.2, -15.4, 0);
addShop(M.shopB, 0, 2.2, -15.4, 0);
addShop(M.shopC, 9, 2.2, -15.4, 0);
addShop(M.shopD, -7, 8.8, -15.4, 0);
addShop(M.shopA, 2, 8.8, -15.4, 0);
addShop(M.shopB, 11, 8.8, -15.4, 0);
addShop(M.shopC, 23.4, 8.8, -4.5, -Math.PI / 2);
addShop(M.shopD, 23.4, 8.8, 4.5, -Math.PI / 2);

// skylight atrium roof beams (open sky above!)
for (let x = -18; x <= 18; x += 6) {
  add(box(0.45, 0.5, 32), M.steelBright, x, 14.8, 0, world, { cast: false });
}
for (const z of [-10, -4, 4, 10]) {
  add(box(44, 0.35, 0.35), M.steel, 0, 14.8, z, world, { cast: false });
}
// mall columns
for (const x of [-14, -4, 8, 18]) for (const z of [-6.5, 6.5]) {
  add(new THREE.CylinderGeometry(0.42, 0.46, 14.8, 12), M.steelBright, x, 7.4, z, world);
}
// potted indoor mall trees & wooden benches
const addPlant = (x, y, z) => {
  const g = new THREE.Group(); g.position.set(x, y, z); world.add(g);
  add(new THREE.CylinderGeometry(0.48, 0.36, 0.72, 10), M.pot, 0, 0.36, 0, g);
  add(new THREE.CylinderGeometry(0.09, 0.12, 1.3, 8), M.wood, 0, 1.2, 0, g);
  add(new THREE.SphereGeometry(0.82, 10, 8), M.leaf, 0, 2.15, 0, g);
  add(new THREE.SphereGeometry(0.58, 10, 8), M.leafLight, 0.38, 2.55, 0.2, g);
  add(new THREE.SphereGeometry(0.52, 10, 8), M.leafLight, -0.35, 2.45, -0.2, g);
};
addPlant(-10.5, 0, -3.8); addPlant(-10.5, 0, 3.8); addPlant(2, 0, -4.5); addPlant(2, 0, 4.5);
addPlant(10.5, 6.4, -3.5); addPlant(10.5, 6.4, 3.5);
for (const [bx, bz] of [[-12, -1.8], [-12, 2.2], [5, -5.2]]) {
  const bg = new THREE.Group(); bg.position.set(bx, 0, bz); world.add(bg);
  add(box(2.0, 0.14, 0.65), M.wood, 0, 0.48, 0, bg);
  for (const s of [-0.8, 0.8]) add(box(0.14, 0.46, 0.56), M.steelDark, s, 0.23, 0, bg);
}

// ---------- WORKING 3D ESCALATOR (x: -8 -> +8, y: 0 -> 6.4) ----------
const ESC_LEN = Math.hypot(16, 6.4); // ~17.23m
const ESC_ANG = Math.atan2(6.4, 16); // ~0.3805 rad
const escGroup = new THREE.Group(); world.add(escGroup);

// lower & upper steel landing comb plates with yellow safety line
add(box(2.6, 0.12, 2.0), M.steel, -9.3, 0.06, 0, escGroup);
add(box(0.24, 0.14, 1.65), M.yellow, -8.08, 0.07, 0, escGroup);
add(box(2.6, 0.12, 2.0), M.steel, 9.3, 6.46, 0, escGroup);
add(box(0.24, 0.14, 1.65), M.yellow, 8.08, 6.47, 0, escGroup);

// inclined chassis truss underneath steps
const chassis = new THREE.Group();
chassis.position.set(0, 3.2, 0); chassis.rotation.z = ESC_ANG; escGroup.add(chassis);
add(box(ESC_LEN + 0.6, 1.05, 1.48), M.steelDark, 0, -0.78, 0, chassis);
// side outer casings
const frontCasing = add(box(ESC_LEN + 0.8, 1.15, 0.14), M.steel, 0, -0.68, 0.94, chassis);
add(box(ESC_LEN + 0.8, 1.15, 0.14), M.steel, 0, -0.68, -0.94, chassis);

// stationary stainless-steel SKIRT WALLS (z = ±0.84, leaving 0.06m razor-thin gap from steps at ±0.78!)
const backSkirt = add(box(ESC_LEN + 0.4, 0.42, 0.08), M.skirt, 0, 0.14, -0.84, chassis);
const frontSkirt = add(box(ESC_LEN + 0.4, 0.42, 0.08), M.skirt, 0, 0.14, 0.84, chassis);
// glowing red danger strip inside the razor-thin gap (z = ±0.80, visible in mechanical/danger shots)
const dangerGapStrip = add(box(ESC_LEN, 0.05, 0.055), M.redGlow, 0, -0.02, 0.80, chassis, { cast: false, ndSkip: true });
dangerGapStrip.visible = false;

// SKIRT DEFLECTOR BRUSHES (black rail + protruding stiff dark nylon bristles on both sides!)
const brushGroup = new THREE.Group(); chassis.add(brushGroup);
for (const s of [-1, 1]) {
  // black aluminum deflector rail mounted on stationary skirt wall
  add(box(ESC_LEN + 0.2, 0.065, 0.06), M.handrail, 0, 0.17, s * 0.80, brushGroup);
  // stiff dark bristle strip jutting inward toward the step edge
  add(box(ESC_LEN + 0.2, 0.048, 0.12), M.bristle, 0, 0.17, s * 0.72, brushGroup);
  // subtle yellow highlight trim along top of deflector housing
  add(box(ESC_LEN + 0.2, 0.018, 0.04), M.yellow, 0, 0.21, s * 0.80, brushGroup);
}

// Glass balustrades & moving black handrails
const frontBalustrade = new THREE.Group(); chassis.add(frontBalustrade);
for (const [s, parent] of [[-1, chassis], [1, frontBalustrade]]) {
  add(box(ESC_LEN + 0.4, 0.62, 0.05), M.glass, 0, 0.62, s * 0.90, parent, { cast: false, ndSkip: true });
  add(box(ESC_LEN + 0.8, 0.08, 0.12), M.handrail, 0, 0.95, s * 0.90, parent);
  // curved end newels
  for (const ex of [-ESC_LEN / 2 - 0.35, ESC_LEN / 2 + 0.35]) {
    const nw = add(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 14), M.handrail, ex, 0.72, s * 0.90, parent);
    nw.rotation.x = Math.PI / 2;
  }
}

// 28 Animated 3D Escalator Steps (each step is level horizontally, climbing along the slope!)
const NUM_STEPS = 28;
const stepMeshes = [];
const stepGeo = box(0.60, 0.25, 1.54); // width 1.54 -> z from -0.77 to +0.77 (razor gap to skirt at ±0.84!)
for (let i = 0; i < NUM_STEPS; i++) {
  const sm = add(stepGeo, M.step, 0, 0, 0, escGroup);
  // bright yellow riser lip on front edge of each step
  add(box(0.05, 0.24, 1.54), M.yellow, -0.30, 0, 0, sm);
  stepMeshes.push(sm);
}

// ---------- EXPOSED 3D MECHANICAL GEAR CHAMBER (for Cutaway & "gears don't stop" shots) ----------
const gearChamber = new THREE.Group(); world.add(gearChamber); gearChamber.visible = false;
// dark industrial housing behind the gears
add(box(5.6, 3.4, 1.6), M.steelDark, 0, 1.85, -0.4, gearChamber);
add(box(5.8, 0.24, 1.8), M.hazard, 0, 0.3, -0.3, gearChamber);
// diegetic mechanical warning plate inside chamber
const warnPlate = add(box(2.2, 0.62, 0.08), M.warnGap, 0, 3.18, 0.52, gearChamber, { cast: false });

const makeGear = (radius, teeth, thick, mat) => {
  const g = new THREE.Group();
  add(new THREE.CylinderGeometry(radius, radius, thick, 20), mat, 0, 0, 0, g).rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(radius * 0.34, radius * 0.34, thick + 0.08, 12), M.steelBright, 0, 0, 0, g).rotation.x = Math.PI / 2;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const t = add(box(radius * 0.26, radius * 0.28, thick * 0.94), mat, Math.cos(a) * (radius + radius * 0.1), Math.sin(a) * (radius + radius * 0.1), 0, g);
    t.rotation.z = a;
  }
  return g;
};
const gears = [
  { g: makeGear(0.76, 12, 0.26, M.steel), x: -0.78, y: 1.55, z: 0.45, spd: 1.9 },
  { g: makeGear(0.58, 10, 0.28, M.orange), x: 0.18, y: 2.08, z: 0.48, spd: -2.5 },
  { g: makeGear(0.74, 12, 0.26, M.steel), x: 0.85, y: 1.15, z: 0.45, spd: 1.9 },
  { g: makeGear(0.50, 8, 0.28, M.red), x: -0.15, y: 0.95, z: 0.52, spd: 3.2 },
  { g: makeGear(0.48, 8, 0.26, M.yellow), x: -0.68, y: 2.52, z: 0.48, spd: -2.9 },
];
for (const it of gears) { it.g.position.set(it.x, it.y, it.z); gearChamber.add(it.g); }

// ---------- 3D HERO SNEAKER + DANGLING RED SHOELACE PROP (for close-up shots) ----------
const sneaker = new THREE.Group(); world.add(sneaker); sneaker.visible = false;
// chunky white cartoon sneaker with teal trim & red dangling shoelace
add(box(0.56, 0.11, 0.28), M.white, 0, 0.055, 0, sneaker);           // sole
add(box(0.46, 0.18, 0.25), M.teal, -0.03, 0.19, 0, sneaker);         // upper
add(box(0.20, 0.12, 0.25), M.white, 0.21, 0.15, 0, sneaker);         // toe cap
add(box(0.18, 0.18, 0.22), M.white, -0.14, 0.34, 0, sneaker);        // ankle cuff / sock
add(new THREE.CylinderGeometry(0.085, 0.095, 0.55, 12), toon({ color: '#2f4b7c' }), -0.14, 0.62, 0, sneaker); // pant leg
// dangling red shoelace segments
const laceSegs = [];
for (let i = 0; i < 6; i++) {
  const seg = add(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 6), M.red, 0.05 + i * 0.02, 0.16 - i * 0.055, 0.15 + i * 0.025, sneaker);
  laceSegs.push(seg);
}

// ---------- 3D SAFETY CODE BLUEPRINT STAND (Shot 11) ----------
const codeStand = new THREE.Group(); codeStand.position.set(10.6, 6.4, -1.0); codeStand.rotation.y = -Math.PI / 2; world.add(codeStand); codeStand.visible = false;
add(box(1.95, 2.55, 0.12), M.steelDark, 0, 1.55, 0, codeStand);
add(new THREE.PlaneGeometry(1.82, 2.42), M.codeBoard, 0, 1.55, 0.075, codeStand, { cast: false });
for (const s of [-0.72, 0.72]) add(box(0.12, 0.35, 0.65), M.steelDark, s, 0.18, 0, codeStand);

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
  // Continuously climbing escalator steps!
  const speed = 0.042; // cycles/sec * length
  const phase = (f / 30) * 1.15;
  for (let i = 0; i < NUM_STEPS; i++) {
    const u = ((i + phase) % NUM_STEPS) / NUM_STEPS; // 0..1 along escalator
    const x = -8.0 + u * 16.0;
    const y = u * 6.4 - 0.125;
    stepMeshes[i].position.set(x, y, 0);
  }
  // Cutaway mode: hide front glass & casing to reveal spinning gears underneath!
  const cut = !!W_.cutaway;
  frontBalustrade.visible = !cut;
  frontCasing.visible = !cut;
  frontSkirt.visible = !W_.hideFrontSkirt;
  brushGroup.visible = W_.showBrushes !== false;
  gearChamber.visible = !!W_.showGears;
  chassis.visible = !W_.showGears;
  for (const sm of stepMeshes) sm.visible = !W_.showGears;
  dangerGapStrip.visible = !!W_.dangerGlow;
  if (W_.dangerGlow) {
    const pulse = 0.65 + 0.35 * Math.sin(f * 0.45);
    M.redGlow.color.setRGB(1.0, 0.15 * pulse, 0.12 * pulse);
    dangerLight.intensity = 3.5 * pulse;
  } else {
    dangerLight.intensity = 0;
  }
  // Spin interlocking gears relentlessly
  if (W_.showGears) {
    for (const it of gears) it.g.rotation.z = (f / 30) * it.spd;
  }
  // 3D Sneaker + dangling shoelace prop
  sneaker.visible = !!W_.sneaker;
  if (W_.sneaker) {
    const s = W_.sneaker;
    sneaker.position.set(s.x, s.y, s.z);
    sneaker.rotation.set(s.rx || 0, s.ry || 0, s.rz || 0);
    sneaker.scale.setScalar(s.scale || 1);
    const pull = s.lacePull || 0;
    laceSegs.forEach((seg, idx) => {
      seg.position.set(0.06 + idx * 0.025, 0.16 - idx * (0.048 + pull * 0.02), 0.14 + idx * (0.025 + pull * 0.03));
      seg.rotation.z = Math.sin(f * 0.35 + idx) * 0.18 + pull * 0.4;
    });
  }
  // Safety code board
  codeStand.visible = !!W_.codeStand;
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
