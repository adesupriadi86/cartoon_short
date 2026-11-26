// Shot plan for "Why Brain Freeze Happens" — timed to voice.mp3 (47.23 s, 30 fps, 1417 frames).
// Phrase boundaries from tools/timing.py (silence-align, cost 2.50).
import { M, clamp, lerp, lerp3, ramp, camFromKeys, idle, blinkAt, q } from './motion.js';

export const FPS = 30, TOTAL = 1417;
export const escY = () => 0;

export const SHOTS = [
  { id: 'hook_gulp',          a: 0,    b: 79,   light: 'skyDay' },
  { id: 'forehead_explodes',  a: 80,   b: 146,  light: 'warningAmber' },
  { id: 'brain_freeze_intro', a: 147,  b: 252,  light: 'skyDay' },
  { id: 'cold_palate',        a: 253,  b: 380,  light: 'techNight' },
  { id: 'vessels_shut',       a: 381,  b: 446,  light: 'techNight' },
  { id: 'brain_picky',        a: 447,  b: 514,  light: 'warningAmber' },
  { id: 'blood_rush',         a: 515,  b: 598,  light: 'warningAmber' },
  { id: 'vessels_open',       a: 599,  b: 654,  light: 'warningAmber' },
  { id: 'pressure_spike',     a: 655,  b: 740,  light: 'warningAmber' },
  { id: 'weird_part',         a: 741,  b: 788,  light: 'skyDay' },
  { id: 'trigeminal_cable',   a: 789,  b: 934,  light: 'blueprintCyan' },
  { id: 'wires_crossed',      a: 935,  b: 1078, light: 'blueprintCyan' },
  { id: 'referred_pain',      a: 1079, b: 1148, light: 'blueprintCyan' },
  { id: 'fix_simple',         a: 1149, b: 1262, light: 'skyDay' },
  { id: 'calm_down',          a: 1263, b: 1345, light: 'skyDay' },
  { id: 'guard_finale',       a: 1346, b: 1416, light: 'finalePunch' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

// ---------- 5 Dynamic Lighting Moods (same as airplane) ----------
export const LIGHTS = {
  skyDay: {
    az: 135, el: 58, sky: '#d8ecff', ground: '#b8a892', hemi: 1.35, sun: '#fff4df', sunI: 2.3,
    fog: '#e4f0fb', fogNear: 26, fogFar: 90, skyTop: '#3e8ae0', skyHor: '#cbe4fc',
    sat: 1.15, gain: '#ffffff', lift: '#000000', vig: 0.16, shadowExt: 16,
  },
  warningAmber: {
    az: 35, el: 34, sky: '#ffc78c', ground: '#7a4a3a', hemi: 1.15, sun: '#ff9f45', sunI: 2.75,
    fog: '#e8a87c', fogNear: 22, fogFar: 75, skyTop: '#a64d32', skyHor: '#ffc278',
    sat: 1.22, gain: '#fff0dc', lift: '#0a0300', vig: 0.26, shadowExt: 16,
  },
  techNight: {
    az: 160, el: 44, sky: '#5c88c9', ground: '#1c2b47', hemi: 1.15, sun: '#a8ceff', sunI: 2.25,
    fog: '#172947', fogNear: 16, fogFar: 58, skyTop: '#0d1b36', skyHor: '#233f6b',
    sat: 1.20, gain: '#dcecff', lift: '#020612', vig: 0.30, shadowExt: 14,
  },
  blueprintCyan: {
    az: 125, el: 52, sky: '#bce8ff', ground: '#7fa2b8', hemi: 1.38, sun: '#ffffff', sunI: 2.35,
    fog: '#cfe9f7', fogNear: 24, fogFar: 82, skyTop: '#2474b5', skyHor: '#bfe5fa',
    sat: 1.16, gain: '#f2fbff', lift: '#00050a', vig: 0.16, shadowExt: 16,
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
  hook_gulp: [
    { f: 0,  pos: [0.7, 2.1, 6.6], look: [0, 1.6, 0.5], fov: 40 },
    { f: 79, pos: [0.5, 2.0, 6.0], look: [0, 1.6, 0.5], fov: 38, ease: 'smooth' },
  ],
  forehead_explodes: [
    { f: 80,  pos: [0.5, 2.2, 5.6], look: [0, 1.7, 0.5], fov: 38 },
    { f: 146, pos: [0.4, 2.1, 5.2], look: [0, 1.7, 0.5], fov: 36, ease: 'smooth' },
  ],
  brain_freeze_intro: [
    { f: 147, pos: [0.7, 2.1, 6.6], look: [0, 1.7, 0.5], fov: 40 },
    { f: 252, pos: [0.5, 2.0, 6.0], look: [0, 1.7, 0.5], fov: 38, ease: 'smooth' },
  ],
  cold_palate: [
    { f: 253, pos: [0.0, 2.5, 10.5], look: [0, 2.4, 0], fov: 38 },
    { f: 380, pos: [0.0, 2.4, 10.0], look: [0, 2.4, 0], fov: 38, ease: 'smooth' },
  ],
  vessels_shut: [
    { f: 381, pos: [0.0, 2.5, 10.5], look: [0, 2.4, 0], fov: 36 },
    { f: 446, pos: [0.0, 2.4, 10.0], look: [0, 2.4, 0], fov: 36, ease: 'smooth' },
  ],
  brain_picky: [
    { f: 447, pos: [0.5, 3.0, 9.2], look: [0.15, 2.6, 0], fov: 40 },
    { f: 514, pos: [0.3, 2.9, 8.6], look: [0.15, 2.6, 0], fov: 40, ease: 'smooth' },
  ],
  blood_rush: [
    { f: 515, pos: [0.5, 3.0, 9.2], look: [0.15, 2.6, 0], fov: 40 },
    { f: 598, pos: [0.2, 2.9, 8.6], look: [0.15, 2.6, 0], fov: 40, ease: 'smooth' },
  ],
  vessels_open: [
    { f: 599, pos: [0.0, 2.5, 10.5], look: [0, 2.4, 0], fov: 36 },
    { f: 654, pos: [0.0, 2.4, 10.0], look: [0, 2.4, 0], fov: 36, ease: 'smooth' },
  ],
  pressure_spike: [
    { f: 655, pos: [0.5, 3.0, 9.2], look: [0.15, 2.6, 0], fov: 40 },
    { f: 740, pos: [0.3, 2.9, 8.6], look: [0.15, 2.6, 0], fov: 40, ease: 'smooth' },
  ],
  weird_part: [
    { f: 741, pos: [0.7, 2.1, 6.6], look: [0, 1.6, 0.5], fov: 40 },
    { f: 788, pos: [0.5, 2.0, 6.0], look: [0, 1.6, 0.5], fov: 38, ease: 'smooth' },
  ],
  trigeminal_cable: [
    { f: 789,  pos: [2.0, 2.4, 9.5], look: [0.3, 1.9, 0], fov: 42 },
    { f: 934,  pos: [1.6, 2.3, 9.0], look: [0.3, 1.9, 0], fov: 42, ease: 'smooth' },
  ],
  wires_crossed: [
    { f: 935,  pos: [2.0, 2.4, 9.5], look: [0.3, 1.9, 0], fov: 42 },
    { f: 1078, pos: [1.6, 2.3, 9.0], look: [0.3, 1.9, 0], fov: 42, ease: 'smooth' },
  ],
  referred_pain: [
    { f: 1079, pos: [2.0, 2.4, 9.5], look: [0.3, 1.9, 0], fov: 42 },
    { f: 1148, pos: [1.6, 2.3, 9.0], look: [0.3, 1.9, 0], fov: 42, ease: 'smooth' },
  ],
  fix_simple: [
    { f: 1149, pos: [0.7, 2.1, 6.6], look: [0, 1.6, 0.5], fov: 40 },
    { f: 1262, pos: [0.5, 2.0, 6.0], look: [0, 1.6, 0.5], fov: 38, ease: 'smooth' },
  ],
  calm_down: [
    { f: 1263, pos: [0.0, 2.5, 10.5], look: [0, 2.4, 0], fov: 38 },
    { f: 1345, pos: [0.0, 2.4, 10.0], look: [0, 2.4, 0], fov: 38, ease: 'smooth' },
  ],
  guard_finale: [
    { f: 1346, pos: [0.5, 4.0, 13.5], look: [0.0, 2.6, 2.0], fov: 46 },
    { f: 1416, pos: [1.0, 4.2, 14.5], look: [0.0, 2.7, 2.0], fov: 46, ease: 'smooth' },
  ],
};

// Impact 7-frame flip-shakes synced to key dramatic beats
const KICKS = [
  { f: 87,   a: 0.06 },
  { f: 398,  a: 0.06 },
  { f: 667,  a: 0.06 },
  { f: 1357, a: 0.06 },
];

export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { creep: 0.0008, kicks: KICKS });
  c.flash =
    (f >= 87 && f < 93) ? (1 - (f - 87) / 6) * 0.85 :
    (f >= 1357 && f < 1361) ? (1 - (f - 1357) / 4) * 0.45 : 0;
  if (S.id === 'trigeminal_cable' || S.id === 'wires_crossed' || S.id === 'referred_pain') c.shadowAt = [0, 1.6, 0];
  else if (S.id === 'cold_palate' || S.id === 'vessels_shut' || S.id === 'vessels_open' || S.id === 'calm_down') c.shadowAt = [0, 2.0, 0];
  else c.shadowAt = [0, 3.2, 0];
  return c;
};

// ---------- Shallow Depth of Field ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  const FOCUS = {
    hook_gulp: [0.0, 1.6, 0.5], forehead_explodes: [0.0, 1.7, 0.5], brain_freeze_intro: [0.0, 1.7, 0.5],
    cold_palate: [0.0, 2.4, 0.0], vessels_shut: [0.0, 2.6, 0.0], brain_picky: [0.0, 2.7, 0.0],
    blood_rush: [0.0, 2.7, 0.0], vessels_open: [0.0, 2.5, 0.0], pressure_spike: [0.0, 2.7, 0.0],
    weird_part: [0.0, 1.6, 0.5], trigeminal_cable: [0.0, 1.9, 0.0], wires_crossed: [0.0, 1.9, 0.0],
    referred_pain: [0.0, 1.9, 0.0], fix_simple: [0.0, 1.6, 0.5], calm_down: [0.0, 2.4, 0.0],
    guard_finale: [0.0, 2.9, 1.5],
  };
  const CINF = { vessels_shut: 10, cold_palate: 8, vessels_open: 8, pressure_spike: 9, blood_rush: 7, calm_down: 6, forehead_explodes: 6 };
  return { focus: dist(C.pos, FOCUS[S.id]), cinf: CINF[S.id] ?? 4 };
};

// ---------- World State ----------
export const worldAt = (f) => {
  const S = shotAt(f);
  const W = {
    cafe: false, palate: false, brain: false, nerve: false, nerveBoard: 'diagram', crossWires: false,
    finalePlate: false, freezePlate: false,
    vesselScale: 1, vesselCold: false, tongueUp: 0, warmGlow: false,
    flowDots: false, gauge: 0, brainPulse: 0, foreheadFlash: false, clouds: true,
  };
  switch (S.id) {
    case 'hook_gulp': W.cafe = true; break;
    case 'forehead_explodes': W.cafe = true; W.foreheadFlash = true; break;
    case 'brain_freeze_intro': W.cafe = true; W.freezePlate = true; break;
    case 'cold_palate': W.palate = true; W.vesselCold = true; break;
    case 'vessels_shut':
      W.palate = true; W.vesselCold = true;
      W.vesselScale = 1 - 0.75 * M.smooth(ramp(f, 398, 430));
      break;
    case 'brain_picky': W.brain = true; W.gauge = 0.3; break;
    case 'blood_rush':
      W.brain = true; W.flowDots = true; W.warmGlow = true;
      W.gauge = 0.3 + 0.4 * M.smooth(ramp(f, 530, 590));
      break;
    case 'vessels_open':
      W.palate = true; W.warmGlow = true;
      W.vesselScale = 0.25 + 1.2 * M.smooth(ramp(f, 616, 650));
      break;
    case 'pressure_spike':
      W.brain = true; W.flowDots = true; W.warmGlow = true; W.gauge = 1;
      W.brainPulse = 0.5 + 0.5 * Math.sin(f * 0.5);
      break;
    case 'weird_part': W.cafe = true; break;
    case 'trigeminal_cable': W.nerve = true; W.nerveBoard = 'diagram'; break;
    case 'wires_crossed': W.nerve = true; W.nerveBoard = 'diagram'; W.crossWires = true; break;
    case 'referred_pain': W.nerve = true; W.nerveBoard = 'referred'; break;
    case 'fix_simple': W.cafe = true; break;
    case 'calm_down':
      W.palate = true; W.warmGlow = true;
      W.tongueUp = M.smooth(ramp(f, 1263, 1300));
      W.vesselScale = 1.45 - 0.45 * M.smooth(ramp(f, 1263, 1320));
      break;
    case 'guard_finale': W.finalePlate = true; break;
  }
  return W;
};

// ---------- Actors ----------
const A = (T, who, o, pos, extra = {}) => ({
  key: who + JSON.stringify(o),
  draw: (p) => T.mallFront(p, who, o),
  x: pos[0], y: pos[1], z: pos[2],
  ...extra,
});

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'warningAmber' ? '#ffe0c4' : S.light === 'techNight' ? '#c8e0ff' : '#ffffff';
  const id1 = idle(f, 1), id2 = idle(f, 2), id3 = idle(f, 3);

  switch (S.id) {
    case 'hook_gulp': {
      out.push(A(T, 'kid', {
        seed: 5, expr: 'grin', L: 'hang', R: 'drink', facing: 0, look: 0,
        blink: blinkAt(f, 5), bob: q(id1.bob, 3), tilt: q(id1.tilt + 2, 1), headTilt: q(id1.headTilt, 1),
      }, [0, 0, 0.5], { tint }));
      break;
    }
    case 'forehead_explodes': {
      out.push(A(T, 'kid', {
        seed: 5, expr: 'shock', L: 'cheek', R: 'cheek', facing: 0, look: 0,
        blink: 0, bob: q(id1.bob, 3), tilt: q(id1.tilt, 1),
      }, [0, 0, 0.5], { tint }));
      break;
    }
    case 'brain_freeze_intro': {
      out.push(A(T, 'kid', {
        seed: 5, expr: 'wince', L: 'hip', R: 'point', facing: 0, look: -0.3,
        blink: blinkAt(f, 5), bob: q(id1.bob, 3), headTilt: q(id1.headTilt, 1),
      }, [0, 0, 0.5], { tint }));
      break;
    }
    case 'weird_part': {
      out.push(A(T, 'kid', {
        seed: 5, expr: 'dazed', L: 'hip', R: 'up', facing: 0, look: 0,
        blink: blinkAt(f, 5), bob: q(id1.bob, 3), headTilt: q(id1.headTilt, 1),
      }, [0, 0, 0.5], { tint }));
      break;
    }
    case 'trigeminal_cable': {
      out.push(A(T, 'doctor', {
        seed: 21, expr: 'knowing', L: 'board', R: 'point', facing: -1, look: -0.2,
        blink: blinkAt(f, 21), bob: q(id2.bob, 3), tilt: q(id2.tilt, 1),
      }, [1.5, 0, 0.9], { tint }));
      break;
    }
    case 'wires_crossed': {
      out.push(A(T, 'doctor', {
        seed: 21, expr: 'stern', L: 'board', R: 'point', facing: -1, look: -0.2,
        blink: blinkAt(f, 21), bob: q(id2.bob, 3),
      }, [1.5, 0, 0.9], { tint }));
      break;
    }
    case 'referred_pain': {
      out.push(A(T, 'doctor', {
        seed: 21, expr: 'knowing', L: 'board', R: 'point', facing: -1, look: -0.2,
        blink: blinkAt(f, 21), bob: q(id2.bob, 3), headTilt: q(id2.headTilt, 1),
      }, [1.5, 0, 0.9], { tint }));
      break;
    }
    case 'fix_simple': {
      out.push(A(T, 'kid', {
        seed: 5, expr: 'lick', L: 'hip', R: 'thumb', facing: 0, look: 0,
        blink: blinkAt(f, 5), bob: q(id1.bob, 3), headTilt: q(id1.headTilt, 1),
      }, [0, 0, 0.5], { tint }));
      break;
    }
    case 'guard_finale': {
      out.push(A(T, 'kid', {
        seed: 5, expr: 'grin', L: 'hip', R: 'thumb', facing: 0, look: 0,
        blink: blinkAt(f, 5), bob: q(id1.bob, 3),
      }, [-1.2, -0.2, 5.5], { tint }));
      out.push(A(T, 'doctor', {
        seed: 21, expr: 'grin', L: 'board', R: 'up', facing: 0, look: 0,
        blink: blinkAt(f, 21), bob: q(id2.bob, 3),
      }, [1.3, -0.2, 5.5], { tint }));
      break;
    }
  }
  return out;
};

// ---------- 2D Cartoon FX Cards ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });

export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'hook_gulp') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('mo' + t, (p) => T.fxMotion(p, t), [0.5, 0.9, 0.9], 0.45));
  }
  if (S.id === 'forehead_explodes' && f >= 87) {
    const t = q(((f - 87) * 0.05) % 1, 2);
    out.push(FX('al' + t, (p) => T.fxAlert(p, t), [0, 2.3, 0.9], 0.46));
    out.push(FX('sw' + t, (p) => T.fxSweat(p, t), [0, 2.1, 0.9], 0.42));
  }
  if (S.id === 'brain_freeze_intro') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('br' + t, (p) => T.fxBrain(p, t), [1.0, 2.6, 0.9], 0.5));
  }
  if (S.id === 'cold_palate') {
    const t = q((f * 0.04) % 1, 2);
    out.push(FX('sn' + t, (p) => T.fxSnow(p, t), [0, 2.4, 0.5], 0.9));
  }
  if (S.id === 'vessels_shut' && f >= 398) {
    const t = q(((f - 398) * 0.05) % 1, 2);
    out.push(FX('al2' + t, (p) => T.fxAlert(p, t), [0, 3.2, 0.5], 0.42));
  }
  if (S.id === 'pressure_spike') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('zp' + t, (p) => T.fxZap(p, t), [0, 3.4, 0.5], 0.5));
  }
  if (S.id === 'weird_part') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('qu' + t, (p) => T.fxQuestion(p, t), [0.9, 2.5, 0.9], 0.45));
  }
  if (S.id === 'wires_crossed') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('zp2' + t, (p) => T.fxZap(p, t), [0, 3.1, 0.5], 0.45));
  }
  if (S.id === 'fix_simple') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('sp' + t, (p) => T.fxSparkle(p, t), [0.9, 2.4, 0.9], 0.42));
  }
  if (S.id === 'calm_down') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('sp2' + t, (p) => T.fxSparkle(p, t), [0, 3.2, 0.5], 0.42));
  }
  if (S.id === 'guard_finale' && f >= 1357) {
    const t = q(((f - 1357) * 0.05) % 1, 2);
    out.push(FX('sp3' + t, (p) => T.fxSparkle(p, t), [0, 4.8, 2.6], 0.5));
  }
  return out;
};
