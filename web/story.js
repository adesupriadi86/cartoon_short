// Shot plan for "What If Sharks Disappeared" — timed to voice.mp3 (47.21 s, 30 fps, 1416 frames).
// Phrase boundaries from tools/timing.py (silence-align, cost 2.44).
import { M, clamp, lerp, lerp3, ramp, camFromKeys, idle, blinkAt, walk, q } from './motion.js';

export const FPS = 30, TOTAL = 1417;
export const escY = () => 0;

export const SHOTS = [
  { id: 'hook_vanish',      a: 0,    b: 79,   light: 'reefDay' },
  { id: 'top_predator',     a: 80,   b: 146,  light: 'reefDay' },
  { id: 'real_power',       a: 147,  b: 203,  light: 'deepBlue' },
  { id: 'it_is_fear',       a: 204,  b: 230,  light: 'deepBlue' },
  { id: 'off_coast',        a: 231,  b: 280,  light: 'reefDay' },
  { id: 'chain_reaction',   a: 281,  b: 342,  light: 'reefDay' },
  { id: 'sharks_declined',  a: 343,  b: 387,  light: 'warningAmber' },
  { id: 'rays_explode',     a: 388,  b: 468,  light: 'warningAmber' },
  { id: 'scallops_gone',    a: 469,  b: 625,  light: 'reefDay' },
  { id: 'shark_bay',        a: 626,  b: 736,  light: 'sharkBay' },
  { id: 'fear_zones',       a: 737,  b: 850,  light: 'sharkBay' },
  { id: 'seagrass_value',   a: 851,  b: 942,  light: 'sharkBay' },
  { id: 'seventy_one',      a: 943,  b: 1085, light: 'warningAmber' },
  { id: 'dominoes_fall',    a: 1086, b: 1170, light: 'reefDay' },
  { id: 'fish_we_eat',      a: 1171, b: 1252, light: 'reefDay' },
  { id: 'no_sharks',        a: 1253, b: 1312, light: 'deepBlue' },
  { id: 'guard_finale',     a: 1313, b: 1416, light: 'finalePunch' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

// ---------- 5 Dynamic Lighting Moods (ocean-tuned) ----------
export const LIGHTS = {
  reefDay: {
    az: 135, el: 58, sky: '#d8ecff', ground: '#c9b183', hemi: 1.35, sun: '#fff4df', sunI: 2.3,
    fog: '#9fd4ec', fogNear: 24, fogFar: 85, skyTop: '#1e7cc9', skyHor: '#bfe6f7',
    sat: 1.15, gain: '#ffffff', lift: '#000000', vig: 0.16, shadowExt: 16,
  },
  deepBlue: {
    az: 150, el: 48, sky: '#7db8e8', ground: '#274b66', hemi: 1.1, sun: '#a8ceff', sunI: 2.0,
    fog: '#123f63', fogNear: 16, fogFar: 60, skyTop: '#0d2f5e', skyHor: '#2a6ea8',
    sat: 1.18, gain: '#dcecff', lift: '#020612', vig: 0.28, shadowExt: 14,
  },
  sharkBay: {
    az: 125, el: 55, sky: '#d8f4ec', ground: '#b8a888', hemi: 1.38, sun: '#fff8e0', sunI: 2.4,
    fog: '#a8e0d8', fogNear: 24, fogFar: 82, skyTop: '#1fa8a0', skyHor: '#c8f0e8',
    sat: 1.16, gain: '#f2fbff', lift: '#00050a', vig: 0.16, shadowExt: 16,
  },
  warningAmber: {
    az: 35, el: 34, sky: '#ffc78c', ground: '#7a4a3a', hemi: 1.15, sun: '#ff9f45', sunI: 2.75,
    fog: '#e8a87c', fogNear: 22, fogFar: 75, skyTop: '#a64d32', skyHor: '#ffc278',
    sat: 1.22, gain: '#fff0dc', lift: '#0a0300', vig: 0.26, shadowExt: 16,
  },
  finalePunch: {
    az: 110, el: 52, sky: '#d4eaff', ground: '#a69682', hemi: 1.38, sun: '#fff0cc', sunI: 2.65,
    fog: '#dfeefa', fogNear: 28, fogFar: 95, skyTop: '#2e78d4', skyHor: '#c9e4ff',
    sat: 1.20, gain: '#fffcf5', lift: '#000000', vig: 0.20, shadowExt: 18,
  },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- Cameras (all out front, +Z side, never inside a set) ----------
const CAMS = {
  hook_vanish: [
    { f: 0,  pos: [0.7, 2.6, 7.8], look: [0, 2.2, 0], fov: 40 },
    { f: 79, pos: [0.5, 2.5, 7.2], look: [0, 2.2, 0], fov: 38, ease: 'smooth' },
  ],
  top_predator: [
    { f: 80,  pos: [0.5, 2.6, 11.5], look: [0, 2.1, 0], fov: 42 },
    { f: 146, pos: [0.3, 2.5, 11.0], look: [0, 2.1, 0], fov: 42, ease: 'smooth' },
  ],
  real_power: [
    { f: 147, pos: [0.5, 2.6, 11.5], look: [0, 2.1, 0], fov: 42 },
    { f: 203, pos: [0.3, 2.5, 11.0], look: [0, 2.1, 0], fov: 42, ease: 'smooth' },
  ],
  it_is_fear: [
    { f: 204, pos: [0.5, 2.4, 6.2], look: [0, 2.2, 0], fov: 40 },
    { f: 230, pos: [0.4, 2.3, 5.8], look: [0, 2.2, 0], fov: 38, ease: 'smooth' },
  ],
  off_coast: [
    { f: 231, pos: [0.5, 2.6, 11.5], look: [0, 2.1, 0], fov: 42 },
    { f: 280, pos: [0.3, 2.5, 11.0], look: [0, 2.1, 0], fov: 42, ease: 'smooth' },
  ],
  chain_reaction: [
    { f: 281, pos: [0.6, 2.4, 7.4], look: [0, 1.9, 0], fov: 40 },
    { f: 342, pos: [0.4, 2.3, 6.8], look: [0, 1.9, 0], fov: 38, ease: 'smooth' },
  ],
  sharks_declined: [
    { f: 343, pos: [0.5, 2.6, 11.0], look: [0, 2.1, 0], fov: 42 },
    { f: 387, pos: [0.3, 2.5, 10.5], look: [0, 2.1, 0], fov: 42, ease: 'smooth' },
  ],
  rays_explode: [
    { f: 388, pos: [0.6, 2.8, 7.6], look: [0, 2.3, 0], fov: 42 },
    { f: 468, pos: [0.4, 2.7, 7.0], look: [0, 2.3, 0], fov: 40, ease: 'smooth' },
  ],
  scallops_gone: [
    { f: 469, pos: [0.6, 2.4, 7.2], look: [0, 1.8, 0], fov: 40 },
    { f: 625, pos: [0.4, 2.3, 6.6], look: [0, 1.8, 0], fov: 38, ease: 'smooth' },
  ],
  shark_bay: [
    { f: 626, pos: [0.7, 2.6, 7.2], look: [0, 2.2, 0], fov: 40 },
    { f: 736, pos: [0.5, 2.5, 6.6], look: [0, 2.2, 0], fov: 38, ease: 'smooth' },
  ],
  fear_zones: [
    { f: 737, pos: [0.7, 2.6, 7.2], look: [0, 2.2, 0], fov: 40 },
    { f: 850, pos: [0.5, 2.5, 6.6], look: [0, 2.2, 0], fov: 38, ease: 'smooth' },
  ],
  seagrass_value: [
    { f: 851, pos: [0.6, 2.4, 7.0], look: [0, 2.0, 0], fov: 40 },
    { f: 942, pos: [0.4, 2.3, 6.4], look: [0, 2.0, 0], fov: 38, ease: 'smooth' },
  ],
  seventy_one: [
    { f: 943,  pos: [0.5, 2.6, 11.5], look: [0, 2.1, 0], fov: 42 },
    { f: 1085, pos: [0.3, 2.5, 11.0], look: [0, 2.1, 0], fov: 42, ease: 'smooth' },
  ],
  dominoes_fall: [
    { f: 1086, pos: [0.6, 2.4, 7.4], look: [0, 1.9, 0], fov: 40 },
    { f: 1170, pos: [0.4, 2.3, 6.8], look: [0, 1.9, 0], fov: 38, ease: 'smooth' },
  ],
  fish_we_eat: [
    { f: 1171, pos: [0.7, 2.6, 8.0], look: [0, 2.0, 0], fov: 40 },
    { f: 1252, pos: [0.5, 2.5, 7.4], look: [0, 2.0, 0], fov: 38, ease: 'smooth' },
  ],
  no_sharks: [
    { f: 1253, pos: [0.6, 2.6, 7.0], look: [0, 2.2, 0], fov: 40 },
    { f: 1312, pos: [0.4, 2.5, 6.4], look: [0, 2.2, 0], fov: 38, ease: 'smooth' },
  ],
  guard_finale: [
    { f: 1313, pos: [0.5, 4.0, 13.5], look: [0.0, 2.6, 2.0], fov: 46 },
    { f: 1416, pos: [1.0, 4.2, 14.5], look: [0.0, 2.7, 2.0], fov: 46, ease: 'smooth' },
  ],
};

// Impact 7-frame flip-shakes synced to key dramatic beats
const KICKS = [
  { f: 214, a: 0.06 },
  { f: 395, a: 0.06 },
  { f: 958, a: 0.06 },
  { f: 1325, a: 0.06 },
];

export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { creep: 0.0008, kicks: KICKS });
  c.flash =
    (f >= 214 && f < 220) ? (1 - (f - 214) / 6) * 0.85 :
    (f >= 1325 && f < 1329) ? (1 - (f - 1325) / 4) * 0.45 : 0;
  if (S.id === 'top_predator' || S.id === 'real_power' || S.id === 'off_coast' || S.id === 'sharks_declined' || S.id === 'seventy_one') c.shadowAt = [0, 1.6, 0];
  else if (S.id === 'chain_reaction' || S.id === 'scallops_gone' || S.id === 'dominoes_fall' || S.id === 'fish_we_eat') c.shadowAt = [0, 2.0, 0];
  else c.shadowAt = [0, 3.2, 0];
  return c;
};

// ---------- Shallow Depth of Field ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  const FOCUS = {
    hook_vanish: [0.0, 2.2, 0.5], top_predator: [0.0, 2.1, 0.0], real_power: [0.0, 2.1, 0.0],
    it_is_fear: [0.0, 2.2, 0.5], off_coast: [0.0, 2.1, 0.0], chain_reaction: [0.0, 1.9, 0.0],
    sharks_declined: [0.0, 2.1, 0.0], rays_explode: [0.0, 2.3, 0.0], scallops_gone: [0.0, 1.8, 0.0],
    shark_bay: [0.0, 2.2, 0.0], fear_zones: [0.0, 2.2, 0.0], seagrass_value: [0.0, 2.0, 0.0],
    seventy_one: [0.0, 2.1, 0.0], dominoes_fall: [0.0, 1.9, 0.0], fish_we_eat: [0.0, 2.0, 0.0],
    no_sharks: [0.0, 2.2, 0.5], guard_finale: [0.0, 2.9, 1.5],
  };
  const CINF = { rays_explode: 9, it_is_fear: 8, sharks_declined: 8, seventy_one: 8, scallops_gone: 7, fear_zones: 7, seagrass_value: 6 };
  return { focus: dist(C.pos, FOCUS[S.id]), cinf: CINF[S.id] ?? 4 };
};

// ---------- World State ----------
export const worldAt = (f) => {
  const S = shotAt(f);
  const W = {
    reef: false, shark: false, sharkVanish: 0, board: 'none', dominoes: false, dominoFall: 0,
    rays: false, rayCount: 0, scallops: false, scallopBare: 0, seagrass: false,
    tiger: false, turtle: false, dugong: false, flee: 0, fishSchool: false,
    gauge: 0, market: false, finalePlate: false, fearGlow: false, bubbles: true,
  };
  switch (S.id) {
    case 'hook_vanish':
      W.reef = true; W.shark = true;
      W.sharkVanish = M.smooth(ramp(f, 62, 76));
      break;
    case 'top_predator': W.reef = true; W.board = 'food'; break;
    case 'real_power': W.reef = true; W.board = 'food'; W.fearGlow = true; break;
    case 'it_is_fear': W.reef = true; W.shark = true; W.fishSchool = true; break;
    case 'off_coast': W.reef = true; W.board = 'map'; break;
    case 'chain_reaction': W.reef = true; W.dominoes = true; W.dominoFall = M.smooth(ramp(f, 300, 335)); break;
    case 'sharks_declined': W.reef = true; W.board = 'decline'; W.gauge = 1 - 0.6 * M.smooth(ramp(f, 350, 385)); break;
    case 'rays_explode':
      W.reef = true; W.rays = true;
      W.rayCount = M.smooth(ramp(f, 395, 460));
      break;
    case 'scallops_gone':
      W.reef = true; W.scallops = true; W.rays = true; W.rayCount = 1;
      W.scallopBare = M.smooth(ramp(f, 500, 600));
      break;
    case 'shark_bay': W.reef = true; W.seagrass = true; W.tiger = true; W.turtle = true; W.dugong = true; break;
    case 'fear_zones':
      W.reef = true; W.seagrass = true; W.tiger = true; W.turtle = true; W.dugong = true;
      W.flee = M.smooth(ramp(f, 745, 830));
      break;
    case 'seagrass_value': W.reef = true; W.seagrass = true; W.turtle = true; W.dugong = true; W.fishSchool = true; break;
    case 'seventy_one': W.reef = true; W.board = 'chart71'; break;
    case 'dominoes_fall': W.reef = true; W.dominoes = true; W.dominoFall = M.smooth(ramp(f, 1100, 1160)); break;
    case 'fish_we_eat': W.reef = true; W.market = true; break;
    case 'no_sharks': W.reef = true; break;
    case 'guard_finale': W.reef = true; W.finalePlate = true; break;
  }
  return W;
};

// ---------- Actors ----------
// Characters are flat toon cards in a 3D world. "Active" = walk across frame,
// point, turn heads, react. Walkers use walk() + step phase so legs actually move.
const A = (T, who, o, pos, extra = {}) => ({
  key: who + JSON.stringify(o),
  draw: (p) => T.mallFront(p, who, o),
  x: pos[0], y: pos[1], z: pos[2],
  ...extra,
});
// Walker: character crossing the frame left->right starting at shot start.
const WK = (f, S, x0, speed = 1.0) => {
  const w = walk(f, S.a, speed, 0.8);
  return { x: x0 + w.dist, step: q(w.phase, 2) };
};
// Head turn: look sweeps from a to b across the shot.
const TURN = (f, S, a, b, d0 = 8, d1 = 30) => q(a + (b - a) * M.smooth(ramp(f, S.a + d0, S.a + d1)), 2);

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'warningAmber' ? '#ffe0c4' : S.light === 'deepBlue' ? '#c8e0ff' : '#ffffff';
  const id1 = idle(f, 1), id2 = idle(f, 2), id3 = idle(f, 3), id4 = idle(f, 4);
  const bg = (who, o, pos, seed) => A(T, who, { ...o, seed, blink: blinkAt(f, seed), bob: q(idle(f, seed).bob, 3) }, pos, { tint, s: 0.72 });

  switch (S.id) {
    case 'hook_vanish': {
      const wk = WK(f, S, -2.4, 1.0);
      out.push(A(T, 'diver', { seed: 5, expr: 'grin', L: 'hang', R: 'point', facing: 0, look: 0, blink: blinkAt(f, 5), bob: q(id1.bob, 3), tilt: q(id1.tilt, 1) }, [0.9, 0, 0.5], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'curious', L: 'hang', R: 'hang', facing: 0, look: TURN(f, S, -0.4, 0.3), blink: blinkAt(f, 11), bob: q(id2.bob, 3), step: wk.step, tilt: q(id2.tilt, 1) }, [wk.x, 0, 0.6], { tint }));
      out.push(A(T, 'diver', { seed: 7, expr: 'grin', L: 'up', R: 'up', facing: 0, look: 0, blink: blinkAt(f, 7), bob: q(id3.bob, 3) }, [-1.3, 0, 0.5], { tint }));
      out.push(bg('kid', { expr: 'grin', L: 'hang', R: 'point', facing: 0, look: 0 }, [-1.8, 0, -0.6], 9));
      break;
    }
    case 'top_predator': {
      const wk = WK(f, S, -2.2, 0.9);
      out.push(A(T, 'doctor', { seed: 21, expr: 'knowing', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id2.bob, 3), tilt: q(id2.tilt, 1) }, [1.5, 0, 0.9], { tint }));
      out.push(A(T, 'kid', { seed: 5, expr: 'curious', L: 'hip', R: 'point', facing: 0, look: TURN(f, S, -0.3, 0.4), blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [-1.4, 0, 0.6], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'grin', L: 'hang', R: 'hang', facing: 0, look: 0, blink: blinkAt(f, 11), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('diver', { expr: 'grin', L: 'hang', R: 'up', facing: 0, look: 0 }, [1.8, 0, -0.6], 13));
      break;
    }
    case 'real_power': {
      const wk = WK(f, S, -2.2, 0.9);
      out.push(A(T, 'doctor', { seed: 21, expr: 'stern', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id2.bob, 3) }, [1.5, 0, 0.9], { tint }));
      out.push(A(T, 'kid', { seed: 5, expr: 'shock', L: 'cheek', R: 'cheek', facing: 0, look: 0, blink: 0, bob: q(id1.bob, 3) }, [-1.4, 0, 0.6], { tint }));
      out.push(A(T, 'diver', { seed: 7, expr: 'panic', L: 'panic', R: 'panic', facing: 0, look: TURN(f, S, 0.3, -0.3), blink: blinkAt(f, 7), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('marine', { expr: 'curious', L: 'hang', R: 'point', facing: 0, look: 0 }, [1.8, 0, -0.6], 15));
      break;
    }
    case 'it_is_fear': {
      out.push(A(T, 'diver', { seed: 5, expr: 'panic', L: 'panic', R: 'panic', facing: 0, look: 0, blink: 0, bob: q(id1.bob, 3) }, [0.9, 0, 0.5], { tint }));
      out.push(A(T, 'diver', { seed: 7, expr: 'shock', L: 'cheek', R: 'cheek', facing: 0, look: 0, blink: 0, bob: q(id2.bob, 3) }, [-1.3, 0, 0.5], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'panic', L: 'up', R: 'up', facing: 0, look: TURN(f, S, -0.3, 0.3, 2, 12), blink: blinkAt(f, 11), bob: q(id3.bob, 3) }, [0, 0, 0.7], { tint }));
      out.push(bg('kid', { expr: 'shock', L: 'cheek', R: 'cheek', facing: 0, look: 0 }, [-1.8, 0, -0.6], 9));
      break;
    }
    case 'off_coast': {
      const wk = WK(f, S, -2.2, 0.9);
      out.push(A(T, 'doctor', { seed: 21, expr: 'knowing', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id2.bob, 3), tilt: q(id2.tilt, 1) }, [1.5, 0, 0.9], { tint }));
      out.push(A(T, 'kid', { seed: 5, expr: 'curious', L: 'hip', R: 'point', facing: 0, look: TURN(f, S, -0.3, 0.4), blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [-1.4, 0, 0.6], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'grin', L: 'hang', R: 'hang', facing: 0, look: 0, blink: blinkAt(f, 11), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('fisherman', { expr: 'grin', L: 'hang', R: 'thumb', facing: 0, look: 0 }, [1.8, 0, -0.6], 17));
      break;
    }
    case 'chain_reaction': {
      const wk = WK(f, S, -2.2, 1.0);
      out.push(A(T, 'doctor', { seed: 21, expr: 'knowing', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id2.bob, 3) }, [1.5, 0, 0.9], { tint }));
      out.push(A(T, 'kid', { seed: 5, expr: 'curious', L: 'hip', R: 'point', facing: 0, look: TURN(f, S, -0.4, 0.4), blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [-1.4, 0, 0.6], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'grin', L: 'hang', R: 'hang', facing: 0, look: 0, blink: blinkAt(f, 11), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('diver', { expr: 'grin', L: 'hang', R: 'point', facing: 0, look: 0 }, [1.8, 0, -0.6], 13));
      break;
    }
    case 'sharks_declined': {
      const wk = WK(f, S, -2.2, 0.9);
      out.push(A(T, 'fisherman', { seed: 17, expr: 'wince', L: 'hip', R: 'cheek', facing: 0, look: 0, blink: blinkAt(f, 17), bob: q(id1.bob, 3) }, [-1.4, 0, 0.6], { tint }));
      out.push(A(T, 'doctor', { seed: 21, expr: 'stern', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id2.bob, 3) }, [1.5, 0, 0.9], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'curious', L: 'hang', R: 'hang', facing: 0, look: TURN(f, S, -0.3, 0.3), blink: blinkAt(f, 11), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('kid', { expr: 'wince', L: 'cheek', R: 'cheek', facing: 0, look: 0 }, [1.8, 0, -0.6], 9));
      break;
    }
    case 'rays_explode': {
      const wk = WK(f, S, -2.4, 1.1);
      out.push(A(T, 'fisherman', { seed: 17, expr: 'shock', L: 'point', R: 'point', facing: 0, look: 0, blink: 0, bob: q(id1.bob, 3) }, [0.9, 0, 0.5], { tint }));
      out.push(A(T, 'doctor', { seed: 21, expr: 'stern', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id2.bob, 3) }, [1.5, 0, 0.9], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'shock', L: 'hang', R: 'hang', facing: 0, look: TURN(f, S, -0.4, 0.4), blink: blinkAt(f, 11), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('diver', { expr: 'shock', L: 'up', R: 'up', facing: 0, look: 0 }, [-1.8, 0, -0.6], 13));
      break;
    }
    case 'scallops_gone': {
      const wk = WK(f, S, -2.4, 0.9);
      out.push(A(T, 'fisherman', { seed: 17, expr: 'wince', L: 'hip', R: 'point', facing: 0, look: 0, blink: blinkAt(f, 17), bob: q(id1.bob, 3) }, [0.9, 0, 0.5], { tint }));
      out.push(A(T, 'fisherman', { seed: 19, expr: 'stern', L: 'hang', R: 'hang', facing: 0, look: TURN(f, S, 0.3, -0.3), blink: blinkAt(f, 19), bob: q(id2.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(A(T, 'doctor', { seed: 21, expr: 'knowing', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id3.bob, 3) }, [1.5, 0, 0.9], { tint }));
      out.push(bg('marine', { expr: 'wince', L: 'cheek', R: 'cheek', facing: 0, look: 0 }, [-1.8, 0, -0.6], 15));
      break;
    }
    case 'shark_bay': {
      const wk = WK(f, S, -2.4, 1.0);
      out.push(A(T, 'diver', { seed: 5, expr: 'grin', L: 'hang', R: 'point', facing: 0, look: 0, blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [0.9, 0, 0.5], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'curious', L: 'hang', R: 'hang', facing: 0, look: TURN(f, S, -0.3, 0.3), blink: blinkAt(f, 11), bob: q(id2.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(A(T, 'diver', { seed: 7, expr: 'grin', L: 'up', R: 'up', facing: 0, look: 0, blink: blinkAt(f, 7), bob: q(id3.bob, 3) }, [-1.3, 0, 0.5], { tint }));
      out.push(bg('kid', { expr: 'grin', L: 'hang', R: 'point', facing: 0, look: 0 }, [-1.8, 0, -0.6], 9));
      break;
    }
    case 'fear_zones': {
      const wk = WK(f, S, -2.4, 1.0);
      out.push(A(T, 'diver', { seed: 5, expr: 'curious', L: 'hang', R: 'point', facing: 0, look: 0, blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [0.9, 0, 0.5], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'grin', L: 'hang', R: 'hang', facing: 0, look: TURN(f, S, -0.4, 0.4), blink: blinkAt(f, 11), bob: q(id2.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(A(T, 'doctor', { seed: 21, expr: 'knowing', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id3.bob, 3) }, [1.5, 0, 0.9], { tint }));
      out.push(bg('diver', { expr: 'curious', L: 'hang', R: 'point', facing: 0, look: 0 }, [-1.8, 0, -0.6], 13));
      break;
    }
    case 'seagrass_value': {
      const wk = WK(f, S, -2.4, 0.9);
      out.push(A(T, 'doctor', { seed: 21, expr: 'knowing', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id2.bob, 3) }, [1.5, 0, 0.9], { tint }));
      out.push(A(T, 'diver', { seed: 5, expr: 'grin', L: 'hang', R: 'point', facing: 0, look: TURN(f, S, -0.3, 0.3), blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [-1.4, 0, 0.6], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'grin', L: 'hang', R: 'hang', facing: 0, look: 0, blink: blinkAt(f, 11), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('kid', { expr: 'grin', L: 'up', R: 'up', facing: 0, look: 0 }, [1.8, 0, -0.6], 9));
      break;
    }
    case 'seventy_one': {
      const wk = WK(f, S, -2.4, 1.0);
      out.push(A(T, 'doctor', { seed: 21, expr: 'stern', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id2.bob, 3) }, [1.5, 0, 0.9], { tint }));
      out.push(A(T, 'fisherman', { seed: 17, expr: 'wince', L: 'cheek', R: 'cheek', facing: 0, look: 0, blink: 0, bob: q(id1.bob, 3) }, [-1.4, 0, 0.6], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'shock', L: 'hang', R: 'hang', facing: 0, look: TURN(f, S, -0.3, 0.3), blink: blinkAt(f, 11), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('kid', { expr: 'shock', L: 'cheek', R: 'cheek', facing: 0, look: 0 }, [1.8, 0, -0.6], 9));
      break;
    }
    case 'dominoes_fall': {
      const wk = WK(f, S, -2.2, 1.0);
      out.push(A(T, 'doctor', { seed: 21, expr: 'knowing', L: 'board', R: 'point', facing: -1, look: -0.2, blink: blinkAt(f, 21), bob: q(id2.bob, 3) }, [1.5, 0, 0.9], { tint }));
      out.push(A(T, 'kid', { seed: 5, expr: 'curious', L: 'hip', R: 'point', facing: 0, look: TURN(f, S, -0.4, 0.4), blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [-1.4, 0, 0.6], { tint }));
      out.push(A(T, 'marine', { seed: 11, expr: 'grin', L: 'hang', R: 'hang', facing: 0, look: 0, blink: blinkAt(f, 11), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('diver', { expr: 'curious', L: 'hang', R: 'point', facing: 0, look: 0 }, [1.8, 0, -0.6], 13));
      break;
    }
    case 'fish_we_eat': {
      const wk = WK(f, S, -2.0, 0.9);
      out.push(A(T, 'fisherman', { seed: 17, expr: 'grin', L: 'hip', R: 'point', facing: 0, look: 0, blink: blinkAt(f, 17), bob: q(id1.bob, 3) }, [0.9, 0, 0.85], { tint }));
      out.push(A(T, 'vendor', { seed: 23, expr: 'grin', L: 'board', R: 'thumb', facing: 0, look: 0, blink: blinkAt(f, 23), bob: q(id2.bob, 3) }, [-1.4, 0, 0.85], { tint }));
      out.push(A(T, 'kid', { seed: 5, expr: 'grin', L: 'hang', R: 'hang', facing: 0, look: TURN(f, S, -0.3, 0.3), blink: blinkAt(f, 5), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.85], { tint }));
      out.push(bg('marine', { expr: 'grin', L: 'hang', R: 'point', facing: 0, look: 0 }, [1.8, 0, -0.6], 15));
      break;
    }
    case 'no_sharks': {
      const wk = WK(f, S, -2.4, 1.0);
      out.push(A(T, 'diver', { seed: 5, expr: 'dazed', L: 'up', R: 'up', facing: 0, look: 0, blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [0.9, 0, 0.5], { tint }));
      out.push(A(T, 'diver', { seed: 7, expr: 'dazed', L: 'hip', R: 'hip', facing: 0, look: TURN(f, S, -0.4, 0.4), blink: blinkAt(f, 7), bob: q(id2.bob, 3) }, [-1.3, 0, 0.5], { tint }));
      out.push(A(T, 'doctor', { seed: 21, expr: 'knowing', L: 'hip', R: 'point', facing: 0, look: 0, blink: blinkAt(f, 21), bob: q(id3.bob, 3), step: wk.step }, [wk.x, 0, 0.7], { tint }));
      out.push(bg('marine', { expr: 'dazed', L: 'up', R: 'up', facing: 0, look: 0 }, [-1.8, 0, -0.6], 15));
      break;
    }
    case 'guard_finale': {
      const wk = WK(f, S, -2.6, 1.0);
      out.push(A(T, 'diver', { seed: 5, expr: 'grin', L: 'hip', R: 'thumb', facing: 0, look: 0, blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [-1.6, -0.2, 5.5], { tint }));
      out.push(A(T, 'doctor', { seed: 21, expr: 'grin', L: 'board', R: 'up', facing: 0, look: 0, blink: blinkAt(f, 21), bob: q(id2.bob, 3) }, [1.3, -0.2, 5.5], { tint }));
      out.push(A(T, 'fisherman', { seed: 17, expr: 'grin', L: 'hang', R: 'thumb', facing: 0, look: TURN(f, S, -0.3, 0.3), blink: blinkAt(f, 17), bob: q(id3.bob, 3), step: wk.step }, [wk.x, -0.2, 5.5], { tint }));
      out.push(A(T, 'kid', { seed: 9, expr: 'grin', L: 'up', R: 'up', facing: 0, look: 0, blink: blinkAt(f, 9), bob: q(id4.bob, 3) }, [2.2, -0.2, 5.5], { tint }));
      break;
    }
  }
  return out;
};

// ---------- 2D Cartoon FX Cards ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });

export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'hook_vanish') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('mo' + t, (p) => T.fxMotion(p, t), [0.5, 2.2, 0.9], 0.45));
    if (f >= 62) out.push(FX('sp' + t, (p) => T.fxSparkle(p, t), [0, 2.6, 0.9], 0.5));
  }
  if (S.id === 'it_is_fear') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('al' + t, (p) => T.fxAlert(p, t), [0, 3.0, 0.9], 0.46));
    out.push(FX('sw' + t, (p) => T.fxSweat(p, t), [0, 2.4, 0.9], 0.42));
  }
  if (S.id === 'real_power') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('qu' + t, (p) => T.fxQuestion(p, t), [0.9, 3.0, 0.9], 0.45));
  }
  if (S.id === 'rays_explode') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('mo2' + t, (p) => T.fxMotion(p, t), [0, 2.8, 0.9], 0.5));
  }
  if (S.id === 'seventy_one' && f >= 958) {
    const t = q(((f - 958) * 0.05) % 1, 2);
    out.push(FX('al2' + t, (p) => T.fxAlert(p, t), [0, 3.4, 0.5], 0.42));
  }
  if (S.id === 'dominoes_fall' && f >= 1100) {
    const t = q(((f - 1100) * 0.05) % 1, 2);
    out.push(FX('zp' + t, (p) => T.fxZap(p, t), [0, 3.1, 0.5], 0.45));
  }
  if (S.id === 'seagrass_value') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('sp2' + t, (p) => T.fxSparkle(p, t), [0, 3.0, 0.5], 0.42));
  }
  if (S.id === 'scallops_gone') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('qu2' + t, (p) => T.fxQuestion(p, t), [0.9, 2.8, 0.9], 0.45));
  }
  if (S.id === 'guard_finale' && f >= 1325) {
    const t = q(((f - 1325) * 0.05) % 1, 2);
    out.push(FX('sp3' + t, (p) => T.fxSparkle(p, t), [0, 4.8, 2.6], 0.5));
  }
  return out;
};
