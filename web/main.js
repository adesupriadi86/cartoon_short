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
  runway: texM(P.tarmac(3), 10, 1),
  grass: toon({ color: '#6fae5f' }),
  fuselage: texM(P.fuselageTex(1), 1, 1),
  fuselageComet: toon({ color: '#c9ced6' }),
  windowGlass: new THREE.MeshBasicMaterial({ map: P.tex(P.windowGlass(2), 1, 1) }),
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
  seatBlue: toon({ color: '#2f6fb2' }),
  cloud: toon({ color: '#ffffff' }),
  wood: toon({ color: '#9c6b43' }),
  hazard: texM(P.hazardStripe(), 8, 1),
  glass: new THREE.MeshToonMaterial({ gradientMap: grad, color: '#9ed8f5', transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }),
  blueprintBoard: new THREE.MeshBasicMaterial({ map: P.tex(P.blueprintStress(), 1, 1) }),
  labelSquare: new THREE.MeshBasicMaterial({ map: P.tex(P.warnLabel('SQUARE'), 1, 1) }),
  labelRound: new THREE.MeshBasicMaterial({ map: P.tex(P.textPlate('ROUND', '#2e9e4f', '#ffffff'), 1, 1) }),
  finalePlate: new THREE.MeshBasicMaterial({ map: P.tex(P.textPlate('A LESSON WRITTEN IN METAL', '#1f6fb2', '#ffffff'), 1, 1) }),
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
scene.fog = new THREE.Fog('#e6eef8', 24, 95);

// ---------- AIRFIELD: grass + runway strip + drifting clouds ----------
const world = new THREE.Group(); scene.add(world);
// grass field (big) + runway strip the jet sits on
add(box(240, 0.2, 240), M.grass, 0, -0.3, 0, world, { cast: false });
add(box(140, 0.2, 12), M.runway, 0, -0.1, 0, world, { cast: false });

// drifting cartoon clouds (3 puffs each)
const clouds = [];
for (let i = 0; i < 12; i++) {
  const g = new THREE.Group();
  const cx = -32 + (i * 5.7) % 64, cy = 9 + (i % 4) * 2.2, cz = -18 + (i * 3.1) % 26;
  g.position.set(cx, cy, cz);
  const s = 0.8 + (i % 3) * 0.35;
  add(new THREE.SphereGeometry(1.25 * s, 10, 8), M.cloud, 0, 0, 0, g, { cast: false });
  add(new THREE.SphereGeometry(0.9 * s, 10, 8), M.cloud, 1.3 * s, -0.15, 0.2, g, { cast: false });
  add(new THREE.SphereGeometry(0.8 * s, 10, 8), M.cloud, -1.2 * s, -0.2, -0.1, g, { cast: false });
  world.add(g);
  clouds.push({ g, baseX: cx });
}

// ---------- HERO JET BUILDER (fuselage along X, nose +X, windows on +Z side) ----------
const makeJet = ({ square = false, fuselageMat = M.fuselage } = {}) => {
  const g = new THREE.Group();
  // fuselage tube (axis along X) + nose + tail cone
  const tube = add(new THREE.CylinderGeometry(1.15, 1.15, 14, 24), fuselageMat, 0, 0, 0, g);
  tube.rotation.z = Math.PI / 2;
  const nose = add(new THREE.SphereGeometry(1.15, 20, 14), fuselageMat, 7, 0, 0, g);
  nose.scale.set(1.6, 1, 1);
  const tail = add(new THREE.CylinderGeometry(0.25, 1.15, 2.4, 16), fuselageMat, -8, 0, 0, g);
  tail.rotation.z = Math.PI / 2;
  // tail fin (swept) + horizontal stabilizers
  const fin = add(box(1.8, 2.8, 0.16), M.blue, -7.4, 1.3, 0, g);
  fin.rotation.z = -0.3;
  add(box(1.8, 0.12, 3.6), M.blue, -7.6, 0.35, 0, g);
  // swept wings (two halves) + engines
  for (const s of [-1, 1]) {
    const wing = add(box(3.4, 0.14, 5.2), M.steelBright, 0.2, -0.4, s * 2.9, g);
    wing.rotation.y = -s * 0.28;
    const eng = add(new THREE.CylinderGeometry(0.45, 0.45, 2.0, 14), M.steel, 0.6, -0.85, s * 2.3, g);
    eng.rotation.z = Math.PI / 2;
    const intake = add(new THREE.CircleGeometry(0.38, 14), M.handrail, 1.62, -0.85, s * 2.3, g, { cast: false });
    intake.rotation.y = Math.PI / 2;
  }
  // cockpit windows on the nose
  for (const s of [-1, 1]) {
    const cw = add(new THREE.PlaneGeometry(0.55, 0.38), M.windowGlass, 7.75, 0.45, s * 0.42, g, { cast: false });
    cw.rotation.y = s * 0.55;
  }
  // passenger windows along the fuselage side (y +0.35, z +1.16, slightly proud of the skin)
  for (let i = 0; i < 9; i++) {
    const x = -5.6 + i * 1.4;
    if (square) {
      add(new THREE.PlaneGeometry(0.6, 0.6), M.windowGlass, x, 0.35, 1.16, g, { cast: false });
      add(box(0.72, 0.08, 0.06), M.steelDark, x, 0.68, 1.16, g, { cast: false });
      add(box(0.72, 0.08, 0.06), M.steelDark, x, 0.02, 1.16, g, { cast: false });
      add(box(0.08, 0.72, 0.06), M.steelDark, x - 0.32, 0.35, 1.16, g, { cast: false });
      add(box(0.08, 0.72, 0.06), M.steelDark, x + 0.32, 0.35, 1.16, g, { cast: false });
    } else {
      const disc = add(new THREE.CircleGeometry(0.30, 20), M.windowGlass, x, 0.35, 1.16, g, { cast: false });
      const ring = add(new THREE.TorusGeometry(0.30, 0.07, 10, 20), M.steelBright, x, 0.35, 1.16, g, { cast: false });
    }
  }
  // pressure arrows (children of the jet, shown in balloon / thin-air / pressure shots)
  const arrows = new THREE.Group(); g.add(arrows);
  for (let i = 0; i < 6; i++) {
    const a = new THREE.Group();
    a.position.set(-5 + i * 2, 2.1, 0);
    add(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8), M.yellow, 0, 0, 0, a, { cast: false });
    const tip = add(new THREE.ConeGeometry(0.2, 0.5, 10), M.yellow, 0, -0.55, 0, a, { cast: false });
    tip.rotation.x = Math.PI;
    arrows.add(a);
  }
  g.userData.arrows = arrows;
  // landing gear (visible only on the ground)
  const gear = new THREE.Group(); g.add(gear);
  for (const [gx, gz] of [[4.6, 0.75], [4.6, -0.75], [-0.8, 0]]) {
    add(box(0.12, 1.15, 0.12), M.steelDark, gx, -1.72, gz, gear);
    const wheel = add(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12), M.handrail, gx, -2.3, gz, gear);
    wheel.rotation.x = Math.PI / 2;
  }
  g.userData.gear = gear;
  return g;
};

const jetGroup = makeJet({}); world.add(jetGroup);
const cometGroup = makeJet({ square: true, fuselageMat: M.fuselageComet });
cometGroup.position.set(-14, 7.5, -5); cometGroup.rotation.y = 0.5; cometGroup.scale.setScalar(0.85);
world.add(cometGroup); cometGroup.visible = false;

// ---------- CABIN INTERIOR SET (x ~18, for its_round / why_round) ----------
const cabinGroup = new THREE.Group(); world.add(cabinGroup); cabinGroup.visible = false;
add(box(6, 0.1, 3.4), M.panel, 18, 0.05, 0.2, cabinGroup, { cast: false });
add(box(5.5, 3.2, 0.15), M.panel, 18, 1.6, -0.9, cabinGroup, { cast: false });
add(box(5.5, 0.5, 0.18), M.seatBlue, 18, 0.35, -0.82, cabinGroup, { cast: false });
add(box(5.0, 0.55, 0.9), M.steelBright, 18, 2.95, -0.55, cabinGroup);
// round cabin window + frame
add(new THREE.TorusGeometry(0.55, 0.09, 10, 24), M.white, 18.3, 1.9, -0.80, cabinGroup, { cast: false });
add(new THREE.CircleGeometry(0.55, 24), M.windowGlass, 18.3, 1.9, -0.79, cabinGroup, { cast: false });
// seat backs flanking the passenger
for (const sx of [16.4, 19.9]) {
  add(box(0.9, 1.0, 0.25), M.seatBlue, sx, 0.85, 0.5, cabinGroup);
  add(box(0.7, 0.3, 0.28), M.steelBright, sx, 1.45, 0.5, cabinGroup);
}

// ---------- COMPARISON PANEL (one stand, swaps square <-> round window) ----------
const panelsGroup = new THREE.Group(); world.add(panelsGroup); panelsGroup.visible = false;
add(box(3.4, 2.8, 0.15), M.panel, 0, 2.4, 0, panelsGroup);
add(box(3.6, 0.18, 0.2), M.panelDark, 0, 0.95, 0, panelsGroup);
add(box(3.6, 0.18, 0.2), M.panelDark, 0, 3.85, 0, panelsGroup);
// label plates above the panel (toggle square / round)
const labelSquareMesh = add(new THREE.PlaneGeometry(1.7, 0.53), M.labelSquare, 0, 4.35, 0.12, panelsGroup, { cast: false });
const labelRoundMesh = add(new THREE.PlaneGeometry(1.7, 0.53), M.labelRound, 0, 4.35, 0.12, panelsGroup, { cast: false });
// --- square window assembly ---
const squareAssembly = new THREE.Group(); panelsGroup.add(squareAssembly);
add(new THREE.PlaneGeometry(0.95, 0.95), M.windowGlass, 0, 2.5, 0.09, squareAssembly, { cast: false });
add(box(1.07, 0.08, 0.06), M.steelDark, 0, 3.0, 0.1, squareAssembly, { cast: false });
add(box(1.07, 0.08, 0.06), M.steelDark, 0, 2.0, 0.1, squareAssembly, { cast: false });
add(box(0.08, 1.07, 0.06), M.steelDark, -0.52, 2.5, 0.1, squareAssembly, { cast: false });
add(box(0.08, 1.07, 0.06), M.steelDark, 0.52, 2.5, 0.1, squareAssembly, { cast: false });
// red corner glow spheres + growing crack lines (one per corner, 45 deg outward)
const cornerGlows = [];
const crackMeshes = [];
const crackGeo = box(0.75, 0.05, 0.02); crackGeo.translate(0.375, 0, 0);
const CORNERS = [
  { x: -0.52, y: 3.0, a: Math.PI * 0.75 }, { x: 0.52, y: 3.0, a: Math.PI * 0.25 },
  { x: -0.52, y: 2.0, a: Math.PI * 1.25 }, { x: 0.52, y: 2.0, a: Math.PI * 1.75 },
];
for (const c of CORNERS) {
  cornerGlows.push(add(new THREE.SphereGeometry(0.09, 10, 8), M.redGlow, c.x, c.y, 0.16, squareAssembly, { cast: false, ndSkip: true }));
  const cm = add(crackGeo, M.handrail, c.x, c.y, 0.14, squareAssembly, { cast: false });
  cm.rotation.z = c.a; cm.scale.x = 0.05; crackMeshes.push(cm);
}
// --- round window assembly ---
const roundAssembly = new THREE.Group(); panelsGroup.add(roundAssembly); roundAssembly.visible = false;
add(new THREE.TorusGeometry(0.55, 0.09, 10, 24), M.steelBright, 0, 2.5, 0.1, roundAssembly, { cast: false });
add(new THREE.CircleGeometry(0.55, 24), M.windowGlass, 0, 2.5, 0.09, roundAssembly, { cast: false });
// stress flow dots orbiting the round window
const flowDots = [];
for (let i = 0; i < 8; i++) {
  flowDots.push(add(new THREE.SphereGeometry(0.07, 8, 6), M.greenGlow, 0, 2.5, 0.16, roundAssembly, { cast: false, ndSkip: true }));
}

// ---------- BLUEPRINT BOARD STAND (engineers_fix / no_corners) ----------
const boardGroup = new THREE.Group(); world.add(boardGroup); boardGroup.visible = false;
add(box(2.6, 3.4, 0.12), M.steelDark, 0, 1.9, 0, boardGroup);
add(new THREE.PlaneGeometry(2.4, 3.2), M.blueprintBoard, 0, 1.9, 0.075, boardGroup, { cast: false });
for (const s of [-0.95, 0.95]) add(box(0.12, 0.35, 0.65), M.steelDark, s, 0.18, 0, boardGroup);

// ---------- FINALE TITLE PLATE STAND (lesson_finale) ----------
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
  // hero jet: flying high or parked on the runway
  jetGroup.visible = !!W_.jet;
  if (W_.jet === 'fly') {
    jetGroup.position.set(0, 7.5, -2);
    jetGroup.rotation.set(0, 0, 0.05 + Math.sin(f * 0.02) * 0.015);
    jetGroup.userData.gear.visible = false;
  } else if (W_.jet === 'ground') {
    jetGroup.position.set(0, 2.6, 0);
    jetGroup.rotation.set(0, 0, 0);
    jetGroup.userData.gear.visible = true;
  }
  jetGroup.userData.arrows.visible = !!W_.pressureArrows;
  if (W_.pressureArrows) {
    jetGroup.userData.arrows.children.forEach((a, i) => {
      a.scale.setScalar(1 + 0.18 * Math.sin(f * 0.28 + i * 1.1));
    });
  }
  // 1950s Comet in the sky, gentle bob
  cometGroup.visible = !!W_.comet;
  if (W_.comet) cometGroup.position.y = 7.5 + Math.sin(f * 0.05) * 0.15;
  // sets
  cabinGroup.visible = !!W_.cabin;
  panelsGroup.visible = !!W_.panels;
  boardGroup.visible = !!W_.board;
  finaleGroup.visible = !!W_.finalePlate;
  // square vs round window on the comparison panel
  const round = !!W_.roundPanel;
  squareAssembly.visible = !round;
  roundAssembly.visible = round;
  labelSquareMesh.visible = !round;
  labelRoundMesh.visible = round;
  // red corner glow pulse on the square window
  const glow = !!W_.cornerGlow && !round;
  cornerGlows.forEach((cg) => { cg.visible = glow; });
  if (glow) {
    const pulse = 0.65 + 0.35 * Math.sin(f * 0.45);
    M.redGlow.color.setRGB(1.0, 0.15 * pulse, 0.12 * pulse);
    dangerLight.position.set(0, 2.6, 1.6);
    dangerLight.intensity = 3.5 * pulse;
  } else {
    dangerLight.intensity = 0;
  }
  // cracks grow from the square corners
  const crack = W_.crack || 0;
  crackMeshes.forEach((cm) => { cm.scale.x = 0.05 + crack * 0.95; cm.visible = crack > 0.01; });
  // green stress-flow dots orbit the round window
  flowDots.forEach((d, i) => {
    const a = f * 0.05 + i * Math.PI / 4;
    d.position.set(Math.cos(a) * 0.85, 2.5 + Math.sin(a) * 0.85, 0.16);
    d.visible = !!W_.flowDots;
  });
  // clouds drift slowly across the sky
  for (const c of clouds) {
    c.g.position.x = ((c.baseX + f * 0.008 + 35) % 70) - 35;
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
