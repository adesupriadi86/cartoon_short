// Shot plan for "Why Airplane Windows Are Round" — timed to voice.mp3 (47.24 s, 30 fps, 1417 frames).
import { M, clamp, lerp, lerp3, ramp, camFromKeys, idle, blinkAt, q } from './motion.js';

export const FPS = 30, TOTAL = 1417;
export const escY = () => 0;

export const SHOTS = [
  { id: 'hook_window',    a: 0,    b: 43,   light: 'skyDay' },
  { id: 'its_round',      a: 44,   b: 80,   light: 'skyDay' },
  { id: 'curve_reason',   a: 81,   b: 177,  light: 'skyDay' },
  { id: 'metal_balloon',  a: 178,  b: 239,  light: 'skyDay' },
  { id: 'thin_air',       a: 240,  b: 326,  light: 'techNight' },
  { id: 'pressure_push',  a: 327,  b: 440,  light: 'warningAmber' },
  { id: 'square_hole',    a: 441,  b: 606,  light: 'warningAmber' },
  { id: 'cracks_start',   a: 607,  b: 797,  light: 'warningAmber' },
  { id: 'comet_1954',     a: 798,  b: 927,  light: 'techNight' },
  { id: 'cracks_found',   a: 928,  b: 1021, light: 'blueprintCyan' },
  { id: 'engineers_fix',  a: 1022, b: 1085, light: 'blueprintCyan' },
  { id: 'no_corners',     a: 1086, b: 1152, light: 'blueprintCyan' },
  { id: 'stress_spreads', a: 1153, b: 1240, light: 'skyDay' },
  { id: 'why_round',      a: 1241, b: 1362, light: 'skyDay' },
  { id: 'lesson_finale',  a: 1363, b: 1416, light: 'finalePunch' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

// ---------- 5 Dynamic Lighting Moods ----------
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

// ---------- Cameras (all out front, +Z side, never inside the fuselage) ----------
const CAMS = {
  hook_window: [
    { f: 0,  pos: [11.5, 8.6, 7.5], look: [-1.0, 7.4, -2.0], fov: 44 },
    { f: 43, pos: [10.0, 8.4, 6.5], look: [-0.5, 7.4, -2.0], fov: 42, ease: 'smooth' },
  ],
  its_round: [
    { f: 44, pos: [17.2, 2.0, 6.2], look: [18.0, 1.8, -0.8], fov: 40 },
    { f: 80, pos: [17.4, 2.0, 5.6], look: [18.0, 1.8, -0.8], fov: 38, ease: 'smooth' },
  ],
  curve_reason: [
    { f: 81,  pos: [5.2, 3.8, 6.6],  look: [1.0, 2.9, 0.0], fov: 42 },
    { f: 177, pos: [3.6, 3.5, 5.6],  look: [0.4, 2.9, 0.0], fov: 38, ease: 'smooth' },
  ],
  metal_balloon: [
    { f: 178, pos: [-7.5, 9.6, 8.5], look: [0.0, 7.4, -2.0], fov: 44 },
    { f: 239, pos: [-5.8, 9.0, 7.2], look: [0.0, 7.4, -2.0], fov: 42, ease: 'smooth' },
  ],
  thin_air: [
    { f: 240, pos: [10.5, 10.8, 5.5], look: [1.5, 7.5, -2.0], fov: 44 },
    { f: 326, pos: [9.0, 10.2, 4.8],  look: [1.0, 7.5, -2.0], fov: 42, ease: 'smooth' },
  ],
  pressure_push: [
    { f: 327, pos: [-6.5, 3.8, 7.2], look: [-4.0, 2.9, 0.0], fov: 40 },
    { f: 440, pos: [-5.5, 3.6, 6.5], look: [-3.5, 2.9, 0.0], fov: 38, ease: 'smooth' },
  ],
  square_hole: [
    { f: 441, pos: [0.0, 3.2, 10.5], look: [0.0, 2.6, 0.0], fov: 42 },
    { f: 520, pos: [-0.5, 3.1, 9.6], look: [0.0, 2.6, 0.0], fov: 40, ease: 'smooth' },
    { f: 606, pos: [-0.8, 3.0, 9.0], look: [0.0, 2.6, 0.0], fov: 38, ease: 'smooth' },
  ],
  cracks_start: [
    { f: 607, pos: [0.7, 3.4, 5.4], look: [0.15, 2.8, 0.0], fov: 34 },
    { f: 797, pos: [0.6, 3.35, 5.0], look: [0.15, 2.8, 0.0], fov: 31, ease: 'smooth' },
  ],
  comet_1954: [
    { f: 798, pos: [-9.0, 8.6, 3.8],  look: [-14.0, 7.4, -5.0], fov: 40 },
    { f: 927, pos: [-10.5, 8.2, 2.8], look: [-14.0, 7.4, -5.0], fov: 36, ease: 'smooth' },
  ],
  cracks_found: [
    { f: 928,  pos: [-1.8, 3.4, 7.5], look: [-0.6, 2.0, 0.0], fov: 40 },
    { f: 1021, pos: [-1.5, 3.3, 6.9], look: [-0.6, 2.0, 0.0], fov: 38, ease: 'smooth' },
  ],
  engineers_fix: [
    { f: 1022, pos: [2.4, 2.4, 7.0],  look: [0.2, 1.9, 0.0], fov: 40 },
    { f: 1085, pos: [2.0, 2.3, 6.4],  look: [0.2, 1.9, 0.0], fov: 38, ease: 'smooth' },
  ],
  no_corners: [
    { f: 1086, pos: [0.5, 2.1, 7.5], look: [0.0, 1.9, 0.0], fov: 36 },
    { f: 1152, pos: [0.3, 2.0, 6.8], look: [0.0, 1.9, 0.0], fov: 34, ease: 'smooth' },
  ],
  stress_spreads: [
    { f: 1153, pos: [0.0, 3.0, 9.5], look: [0.0, 2.6, 0.0], fov: 40 },
    { f: 1240, pos: [0.0, 2.9, 8.6], look: [0.0, 2.6, 0.0], fov: 38, ease: 'smooth' },
  ],
  why_round: [
    { f: 1241, pos: [17.2, 2.0, 6.2], look: [18.0, 1.8, -0.8], fov: 40 },
    { f: 1362, pos: [17.4, 2.0, 5.6], look: [18.0, 1.8, -0.8], fov: 38, ease: 'smooth' },
  ],
  lesson_finale: [
    { f: 1363, pos: [0.5, 4.6, 16.0], look: [0.0, 2.9, 1.5], fov: 44 },
    { f: 1416, pos: [1.0, 4.8, 17.0], look: [0.0, 3.0, 1.5], fov: 46, ease: 'smooth' },
  ],
};

// Impact 7-frame flip-shakes synced to key dramatic beats
const KICKS = [
  { f: 60,   a: 0.04 },
  { f: 460,  a: 0.05 },
  { f: 630,  a: 0.045 },
  { f: 810,  a: 0.065 },
  { f: 1365, a: 0.06 },
];

export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { creep: 0.0008, kicks: KICKS });
  c.flash =
    (f >= 855 && f < 861) ? (1 - (f - 855) / 6) * 0.85 :
    (f >= 1022 && f < 1028) ? (1 - (f - 1022) / 6) * 0.6 :
    (f >= 1365 && f < 1369) ? (1 - (f - 1365) / 4) * 0.45 : 0;
  if (S.id === 'engineers_fix' || S.id === 'no_corners') c.shadowAt = [0, 1.6, 0];
  else if (S.id === 'square_hole' || S.id === 'cracks_start' || S.id === 'cracks_found' || S.id === 'stress_spreads') c.shadowAt = [0, 2.0, 0];
  else c.shadowAt = [0, 3.2, 0];
  return c;
};

// ---------- Shallow Depth of Field ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  const FOCUS = {
    hook_window: [0.0, 7.4, -2.0], its_round: [18.2, 1.85, -0.8], curve_reason: [0.7, 2.9, 0.0],
    metal_balloon: [0.0, 7.4, -2.0], thin_air: [1.5, 7.5, -2.0], pressure_push: [-4.0, 2.9, 0.0],
    square_hole: [0.0, 2.5, 0.0], cracks_start: [0.15, 2.8, 0.0], comet_1954: [-14.0, 7.4, -5.0],
    cracks_found: [0.0, 2.3, 0.0], engineers_fix: [0.0, 1.9, 0.0], no_corners: [0.0, 1.9, 0.0],
    stress_spreads: [0.0, 2.5, 0.0], why_round: [18.2, 1.85, -0.8], lesson_finale: [0.0, 2.9, 1.5],
  };
  const CINF = { its_round: 8, cracks_start: 10, stress_spreads: 9, no_corners: 7, cracks_found: 8, curve_reason: 5, pressure_push: 5 };
  return { focus: dist(C.pos, FOCUS[S.id]), cinf: CINF[S.id] ?? 4 };
};

// ---------- World State ----------
export const worldAt = (f) => {
  const S = shotAt(f);
  const W = {
    jet: null, comet: false, cabin: false, panels: false, board: false, finalePlate: false,
    crack: 0, cornerGlow: false, flowDots: false, pressureArrows: false, clouds: true,
  };
  switch (S.id) {
    case 'hook_window': W.jet = 'fly'; break;
    case 'its_round': W.cabin = true; break;
    case 'curve_reason': W.jet = 'ground'; break;
    case 'metal_balloon': W.jet = 'fly'; W.pressureArrows = true; break;
    case 'thin_air': W.jet = 'fly'; W.pressureArrows = true; break;
    case 'pressure_push': W.jet = 'ground'; W.pressureArrows = true; break;
    case 'square_hole': W.panels = true; W.cornerGlow = true; break;
    case 'cracks_start':
      W.panels = true; W.cornerGlow = true;
      W.crack = M.smooth(ramp(f, 620, 780));
      break;
    case 'comet_1954': W.comet = true; break;
    case 'cracks_found': W.panels = true; W.cornerGlow = true; W.crack = 1; break;
    case 'engineers_fix': W.board = true; break;
    case 'no_corners': W.board = true; break;
    case 'stress_spreads': W.panels = true; W.roundPanel = true; W.flowDots = true; W.crack = 0; break;
    case 'why_round': W.cabin = true; break;
    case 'lesson_finale': W.jet = 'ground'; W.finalePlate = true; break;
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
    case 'its_round': {
      out.push(A(T, 'passenger', {
        seed: 5, expr: 'curious', L: 'hang', R: 'point', facing: -1, look: -0.4,
        blink: blinkAt(f, 5), bob: q(id1.bob, 3), tilt: q(id1.tilt + 2, 1), headTilt: q(id1.headTilt, 1),
      }, [17.7, 0, 0.55], { tint }));
      break;
    }
    case 'cracks_found': {
      out.push(A(T, 'engineer', {
        seed: 21, expr: 'stern', L: 'board', R: 'point', facing: 1, look: 0.3,
        blink: blinkAt(f, 21), bob: q(id2.bob, 3), headTilt: q(id2.headTilt, 1),
      }, [-1.8, 0, 1.0], { tint }));
      break;
    }
    case 'engineers_fix': {
      out.push(A(T, 'engineer', {
        seed: 21, expr: 'grin', L: 'board', R: 'point', facing: -1, look: -0.2,
        blink: blinkAt(f, 21), bob: q(id2.bob, 3), tilt: q(id2.tilt, 1),
      }, [1.5, 0, 0.9], { tint }));
      break;
    }
    case 'why_round': {
      out.push(A(T, 'passenger', {
        seed: 5, expr: 'grin', L: 'hip', R: 'thumb', facing: -1, look: -0.3,
        blink: blinkAt(f, 5), bob: q(id1.bob, 3), headTilt: q(id1.headTilt, 1),
      }, [17.7, 0, 0.55], { tint }));
      break;
    }
    case 'lesson_finale': {
      const twist = f >= 1365;
      out.push(A(T, 'passenger', {
        seed: 5, expr: twist ? 'shock' : 'grin', L: twist ? 'up' : 'hip', R: twist ? 'up' : 'thumb',
        facing: 0, look: 0, blink: twist ? 0 : blinkAt(f, 5), bob: q(id1.bob, 3),
      }, [-1.6, -0.2, 6.5], { tint }));
      out.push(A(T, 'pilot', {
        seed: 31, expr: 'knowing', L: 'hang', R: 'point', facing: 0, look: 0,
        blink: blinkAt(f, 31), bob: q(id2.bob, 3), headTilt: q(id2.headTilt, 1),
      }, [0.1, -0.2, 6.5], { tint }));
      out.push(A(T, 'engineer', {
        seed: 21, expr: 'grin', L: 'board', R: 'up', facing: 0, look: 0,
        blink: blinkAt(f, 21), bob: q(id3.bob, 3),
      }, [1.8, -0.2, 6.5], { tint }));
      break;
    }
  }
  return out;
};

// ---------- 2D Cartoon FX Cards ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });

export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'hook_window') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('mo' + t, (p) => T.fxMotion(p, t), [1.0, 7.6, 0.5], 0.55));
  }
  if (S.id === 'its_round' && f >= 52) {
    const t = q(((f - 52) * 0.04) % 1, 2);
    out.push(FX('sp' + t, (p) => T.fxSparkle(p, t), [18.2, 2.6, 0.2], 0.42));
  }
  if (S.id === 'square_hole' && f >= 470) {
    const t = q(((f - 470) * 0.045) % 1, 2);
    out.push(FX('al' + t, (p) => T.fxAlert(p, t), [0.0, 3.6, 0.5], 0.46));
  }
  if (S.id === 'cracks_start' && f >= 640) {
    const t = q(((f - 640) * 0.04) % 1, 2);
    out.push(FX('al2' + t, (p) => T.fxAlert(p, t), [0.0, 3.6, 0.5], 0.44));
  }
  if (S.id === 'stress_spreads') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('sp2' + t, (p) => T.fxSparkle(p, t), [0.0, 3.4, 0.5], 0.42));
  }
  if (S.id === 'why_round') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('sp3' + t, (p) => T.fxSparkle(p, t), [18.2, 2.6, 0.2], 0.42));
  }
  if (S.id === 'lesson_finale' && f >= 1365) {
    const t = q(((f - 1365) * 0.05) % 1, 2);
    out.push(FX('fa' + t, (p) => T.fxAlert(p, t), [0.0, 4.6, 2.6], 0.50));
  }
  return out;
};
