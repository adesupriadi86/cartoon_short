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
  // palate / brain sets
  palatePink: toon({ color: '#f2a0b5' }),
  brainPink: toon({ color: '#ff8fb1' }),
  brainPinkDark: toon({ color: '#e56a92' }),
  vesselRed: toon({ color: '#d92632' }),
  vesselRedBright: new THREE.MeshBasicMaterial({ color: '#ff4d5e' }),
  tonguePink: toon({ color: '#e86e78' }),
  coldGlow: new THREE.MeshBasicMaterial({ color: '#7dd3fc' }),
  warmGlow: new THREE.MeshBasicMaterial({ color: '#ffb36b' }),
  nerveRed: toon({ color: '#ff3b30' }),
  nerveYellow: toon({ color: '#ffd60a' }),
  nerveGreen: toon({ color: '#4cd964' }),
  nerveCyan: toon({ color: '#4dd0e1' }),
  gaugeWhite: toon({ color: '#f8fafc' }),
  gaugeRed: toon({ color: '#e63946' }),
  nerveBoard: new THREE.MeshBasicMaterial({ map: P.tex(P.nerveDiagram(), 1, 1) }),
  referredBoard: new THREE.MeshBasicMaterial({ map: P.tex(P.referredPain(), 1, 1) }),
  freezePlate: new THREE.MeshBasicMaterial({ map: P.tex(P.textPlate('BRAIN FREEZE', '#ff3b30', '#ffffff'), 1, 1) }),
  finalePlate: new THREE.MeshBasicMaterial({ map: P.tex(P.textPlate('BACK TO GUARD DUTY', '#1f6fb2', '#ffffff'), 1, 1) }),
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

// ---------- PATIO: sidewalk floor + drifting clouds ----------
const world = new THREE.Group(); scene.add(world);
add(box(240, 0.2, 240), M.sidewalk, 0, -0.3, 0, world, { cast: false });

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

// ---------- CAFE SET: "BRAIN FREEZE" title plate on a stand behind the kid ----------
const cafeGroup = new THREE.Group(); world.add(cafeGroup); cafeGroup.visible = false;
add(box(2.9, 1.0, 0.12), M.steelDark, 0, 3.5, -0.5, cafeGroup);
add(new THREE.PlaneGeometry(2.7, 0.84), M.freezePlate, 0, 3.5, -0.43, cafeGroup, { cast: false });
for (const s of [-1.2, 1.2]) add(box(0.12, 2.6, 0.12), M.steelDark, s, 1.7, -0.5, cafeGroup);

// ---------- PALATE PANEL (macro cross-section of the roof of the mouth) ----------
const palateGroup = new THREE.Group(); world.add(palateGroup); palateGroup.visible = false;
add(box(3.4, 2.8, 0.15), M.panel, 0, 2.4, 0, palateGroup);
add(box(3.6, 0.18, 0.2), M.panelDark, 0, 0.95, 0, palateGroup);
add(box(3.6, 0.18, 0.2), M.panelDark, 0, 3.85, 0, palateGroup);
// palate roof arch (pink half-disc at the top of the panel)
const archGeo = new THREE.CircleGeometry(1.15, 24, 0, Math.PI);
const arch = add(archGeo, M.palatePink, 0, 2.95, 0.09, palateGroup, { cast: false });
// blood vessels: 4 horizontal red tubes just under the arch
const vessels = [];
for (const vy of [2.15, 2.4, 2.65, 2.9]) {
  const v = add(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 12), M.vesselRed, 0, vy, 0.12, palateGroup, { cast: false });
  v.rotation.z = Math.PI / 2;
  vessels.push(v);
}
// cold glow dots on the vessels
const coldDots = [];
for (let i = 0; i < 5; i++) {
  coldDots.push(add(new THREE.SphereGeometry(0.07, 8, 6), M.coldGlow, -0.9 + i * 0.45, 2.52, 0.18, palateGroup, { cast: false, ndSkip: true }));
}
// tongue: pink flattened blob that rises to press the roof during the fix
const tongue = add(new THREE.SphereGeometry(0.55, 16, 12), M.tonguePink, 0, 1.45, 0.15, palateGroup);
tongue.scale.set(1.5, 0.5, 0.7);

// ---------- BRAIN CHAMBER (3D brain + dilating arteries + pressure gauge) ----------
const brainGroup = new THREE.Group(); world.add(brainGroup); brainGroup.visible = false;
// brain: cluster of pink lobes
const brainLobes = [];
const LOBES = [
  [0, 2.7, 0, 0.55], [-0.45, 2.75, 0.1, 0.42], [0.45, 2.75, 0.1, 0.42],
  [0, 3.15, 0, 0.4], [-0.3, 2.35, 0.15, 0.38], [0.3, 2.35, 0.15, 0.38], [0, 2.7, -0.35, 0.4],
];
for (const [lx, ly, lz, lr] of LOBES) {
  brainLobes.push(add(new THREE.SphereGeometry(lr, 14, 10), M.brainPink, lx, ly, lz, brainGroup));
}
// (brain wrinkles removed: the large torus arcs stuck out above the brain's
// silhouette and read as a red handle/arch under the amber light;
// the lobe seams already give the brain its texture)
// arteries: 3 red vessel tubes hugging the FRONT of the brain (no back half to peek over the top)
const mkArtery = (y, r) => {
  const pts = [];
  for (let i = -2; i <= 2; i++) {
    const a = i * Math.PI / 6; // -60° to +60° around the front (+Z)
    pts.push(new THREE.Vector3(r * Math.sin(a), 0, r * Math.cos(a)));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return add(new THREE.TubeGeometry(curve, 20, 0.05, 8), M.vesselRed, 0, y, 0, brainGroup, { cast: false });
};
const arteries = [mkArtery(2.45, 0.7), mkArtery(2.7, 0.85), mkArtery(2.95, 0.65)];
// warm blood flow dots rising around the brain
const flowDots = [];
for (let i = 0; i < 8; i++) {
  flowDots.push(add(new THREE.SphereGeometry(0.07, 8, 6), M.warmGlow, 0, 2.0, 0.3, brainGroup, { cast: false, ndSkip: true }));
}
// pressure gauge (upper right): white dial + red needle that spikes
const gaugeGroup = new THREE.Group(); gaugeGroup.position.set(1.35, 3.3, 0.2); brainGroup.add(gaugeGroup);
add(new THREE.CircleGeometry(0.42, 24), M.gaugeWhite, 0, 0, 0, gaugeGroup, { cast: false });
add(new THREE.TorusGeometry(0.42, 0.05, 8, 24), M.steelDark, 0, 0, 0, gaugeGroup, { cast: false });
const gaugeRedArc = add(new THREE.TorusGeometry(0.36, 0.04, 8, 12, Math.PI * 0.5), M.gaugeRed, 0, 0, 0.01, gaugeGroup, { cast: false });
gaugeRedArc.rotation.z = Math.PI * 0.75;
const needlePivot = new THREE.Group(); gaugeGroup.add(needlePivot);
add(box(0.05, 0.36, 0.02), M.gaugeRed, 0, 0.18, 0.02, needlePivot, { cast: false });
add(new THREE.SphereGeometry(0.06, 8, 6), M.steelDark, 0, 0, 0.03, needlePivot, { cast: false });

// ---------- NERVE BOARD STAND (trigeminal diagram / referred pain) ----------
const nerveGroup = new THREE.Group(); world.add(nerveGroup); nerveGroup.visible = false;
add(box(2.6, 3.4, 0.12), M.steelDark, 0, 1.9, 0, nerveGroup);
const diagramMesh = add(new THREE.PlaneGeometry(2.4, 3.2), M.nerveBoard, 0, 1.9, 0.075, nerveGroup, { cast: false });
const referredMesh = add(new THREE.PlaneGeometry(2.4, 3.2), M.referredBoard, 0, 1.9, 0.075, nerveGroup, { cast: false });
for (const s of [-0.95, 0.95]) add(box(0.12, 0.35, 0.65), M.steelDark, s, 0.18, 0, nerveGroup);
// crossed wires: two tubes forming an X in front of the board
const crossWiresGroup = new THREE.Group(); nerveGroup.add(crossWiresGroup); crossWiresGroup.visible = false;
const wireCurve1 = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.9, 1.2, 0.25), new THREE.Vector3(0, 1.9, 0.3), new THREE.Vector3(0.9, 2.6, 0.25),
]);
const wireCurve2 = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.9, 1.2, 0.25), new THREE.Vector3(0, 1.9, 0.32), new THREE.Vector3(-0.9, 2.6, 0.25),
]);
add(new THREE.TubeGeometry(wireCurve1, 20, 0.06, 8), M.nerveRed, 0, 0, 0, crossWiresGroup, { cast: false });
add(new THREE.TubeGeometry(wireCurve2, 20, 0.06, 8), M.nerveYellow, 0, 0, 0, crossWiresGroup, { cast: false });
add(new THREE.SphereGeometry(0.12, 10, 8), M.redGlow, 0, 1.9, 0.34, crossWiresGroup, { cast: false, ndSkip: true });

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
  // sets
  cafeGroup.visible = !!W_.cafe;
  palateGroup.visible = !!W_.palate;
  brainGroup.visible = !!W_.brain;
  nerveGroup.visible = !!W_.nerve;
  finaleGroup.visible = !!W_.finalePlate;
  // cafe: BRAIN FREEZE plate only on the intro shot
  cafeGroup.children.forEach((ch) => { if (ch !== cafeGroup) ch.visible = !!W_.freezePlate; });
  // palate panel: vessel constriction / dilation (radial scale only, length stays)
  const vs = W_.vesselScale || 1;
  vessels.forEach((v) => { v.scale.set(1, vs, vs); });
  coldDots.forEach((d, i) => { d.visible = !!W_.vesselCold; });
  coldLight.intensity = W_.vesselCold ? 3.0 + Math.sin(f * 0.4) * 0.8 : 0;
  // tongue rises to press the roof during the fix
  tongue.position.y = 1.45 + (W_.tongueUp || 0) * 0.75;
  // brain chamber: pulse, artery dilation follows the gauge, flow dots rise
  const pulse = 1 + 0.05 * (W_.brainPulse || 0);
  brainLobes.forEach((b) => { b.scale.setScalar(pulse); });
  const artScale = 1 + 0.3 * (W_.gauge || 0);
  arteries.forEach((a) => { a.scale.setScalar(artScale); });
  needlePivot.rotation.z = 0.9 - 1.8 * (W_.gauge || 0);
  flowDots.forEach((d, i) => {
    const t = ((f * 0.03 + i * 0.125) % 1);
    const a = i * Math.PI / 4;
    d.position.set(Math.cos(a) * 0.9, 1.9 + t * 1.7, 0.3 + Math.sin(a) * 0.25);
    d.visible = !!W_.flowDots;
  });
  warmLight.intensity = W_.warmGlow ? 3.2 : 0;
  // nerve board: diagram vs referred-pain texture, crossed wires
  diagramMesh.visible = W_.nerveBoard === 'diagram';
  referredMesh.visible = W_.nerveBoard === 'referred';
  crossWiresGroup.visible = !!W_.crossWires;
  // forehead flash: red point light at the kid's head during the explosion
  if (W_.foreheadFlash) {
    dangerLight.position.set(0, 2.0, 1.4);
    dangerLight.intensity = 4.0 * (0.7 + 0.3 * Math.sin(f * 0.6));
  } else {
    dangerLight.intensity = 0;
  }
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
