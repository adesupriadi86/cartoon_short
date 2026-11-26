// Shot plan for "Why Escalators Have Brushes on the Side" — timed to voice.mp3 (47.23 s, 30 fps, 1417 frames).
import { M, clamp, lerp, lerp3, ramp, camFromKeys, idle, blinkAt, q } from './motion.js';

export const FPS = 30, TOTAL = 1417;
export const escY = (x) => clamp((x + 8.0) / 16.0, 0, 1) * 6.4;

export const SHOTS = [
  { id: 'hook_brush',      a: 0,    b: 88,   light: 'mallDay' },
  { id: 'danger_reveal',   a: 89,   b: 170,  light: 'warningAmber' },
  { id: 'most_dangerous',  a: 171,  b: 248,  light: 'warningAmber' },
  { id: 'free_shine',      a: 249,  b: 335,  light: 'mallDay' },
  { id: 'silent_alarm',    a: 336,  b: 426,  light: 'techNight' },
  { id: 'moving_steps',    a: 427,  b: 536,  light: 'techNight' },
  { id: 'still_wall',      a: 537,  b: 638,  light: 'techNight' },
  { id: 'razor_gap',       a: 639,  b: 742,  light: 'techNight' },
  { id: 'entrapment',      a: 743,  b: 866,  light: 'warningAmber' },
  { id: 'gears_dont_stop', a: 867,  b: 924,  light: 'techNight' },
  { id: 'safety_codes',    a: 925,  b: 1018, light: 'blueprintCyan' },
  { id: 'bristles_tickle', a: 1019, b: 1098, light: 'mallDay' },
  { id: 'brain_flinch',    a: 1099, b: 1182, light: 'mallDay' },
  { id: 'next_time',       a: 1183, b: 1286, light: 'mallDay' },
  { id: 'twist_finale',    a: 1287, b: 1416, light: 'finalePunch' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

// ---------- 5 Dynamic Lighting Moods ----------
export const LIGHTS = {
  mallDay: {
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

// ---------- Unobstructed Dynamic Cameras (high 3/4 angles & inside-lane macros) ----------
const CAMS = {
  // Shot 1: High 3/4 inside-atrium angle looking cleanly down onto shopper + moving steps + side brush
  hook_brush: [
    { f: 0,   pos: [-1.4, 4.45, 2.55], look: [-4.0, 2.55, 0.25], fov: 38 },
    { f: 44,  pos: [-0.8, 4.85, 2.75], look: [-3.6, 2.85, 0.20], fov: 39, ease: 'smooth' },
    { f: 88,  pos: [-0.2, 5.20, 3.05], look: [-3.2, 3.15, 0.15], fov: 41, ease: 'smooth' },
  ],
  // Shot 2: Inside-lane low-angle push-in on shopper's panicked face + foot pressed right next to red-lit brush!
  danger_reveal: [
    { f: 89,  pos: [2.65, 5.25, 0.20], look: [-0.25, 4.05, 0.35], fov: 38 },
    { f: 130, pos: [2.25, 5.00, 0.15], look: [-0.25, 4.00, 0.38], fov: 35, roll: -3.0, ease: 'easeOut' },
    { f: 170, pos: [1.95, 4.85, 0.10], look: [-0.25, 3.98, 0.40], fov: 32, roll: -4.2, ease: 'smooth' },
  ],
  // Shot 3: Wide sweeping atrium crane shot (completely clear of z=6.5 columns!)
  most_dangerous: [
    { f: 171, pos: [-6.8, 5.4, 5.0],  look: [0.2, 3.5, 0.0], fov: 48 },
    { f: 248, pos: [-1.8, 7.6, 5.4],  look: [1.2, 3.8, 0.0], fov: 46, ease: 'smooth' },
  ],
  // Shot 4: Bright elevated tracking shot showing 3 shoppers happily buffing their shoes on the bristles
  free_shine: [
    { f: 249, pos: [2.8, 6.2, 3.5],   look: [-1.8, 3.5, 0.15], fov: 40 },
    { f: 335, pos: [4.2, 6.8, 3.8],   look: [-0.4, 3.9, 0.15], fov: 38, ease: 'smooth' },
  ],
  // Shot 5: Moody techNight push-in inside the escalator lane showing full shopper + pulsing silent-alarm rings!
  silent_alarm: [
    { f: 336, pos: [3.4, 5.85, 0.35], look: [-0.15, 4.20, 0.35], fov: 38, roll: 2.0 },
    { f: 380, pos: [2.85, 5.55, 0.25], look: [-0.15, 4.15, 0.38], fov: 35, roll: 3.5, ease: 'easeOut' },
    { f: 426, pos: [2.45, 5.35, 0.20], look: [-0.15, 4.12, 0.40], fov: 33, roll: 4.0, ease: 'smooth' },
  ],
  // Shot 6: Elevated cutaway showing ribbed yellow-bordered steps climbing + inspector pointing
  moving_steps: [
    { f: 427, pos: [-1.2, 5.5, 3.8],  look: [0.4, 3.5, -0.3], fov: 40 },
    { f: 536, pos: [2.0, 6.4, 3.6],   look: [1.2, 4.1, -0.3], fov: 38, ease: 'smooth' },
  ],
  // Shot 7: Inside-lane shot contrasting moving yellow-bordered steps on left vs stationary steel wall on right!
  still_wall: [
    { f: 537, pos: [2.4, 4.65, -0.15], look: [-0.6, 3.25, 0.65], fov: 36 },
    { f: 638, pos: [1.5, 4.30, -0.10], look: [-1.0, 3.15, 0.72], fov: 33, roll: -2.5, ease: 'smooth' },
  ],
  // Shot 8: Inside-lane macro push-in straight onto the glowing RED razor-thin gap between moving step & still skirt!
  razor_gap: [
    { f: 639, pos: [1.70, 4.30, 1.30], look: [-0.25, 3.16, 0.78], fov: 38, roll: 2.5 },
    { f: 742, pos: [1.20, 4.00, 1.50], look: [-0.25, 3.16, 0.80], fov: 32, roll: 4.0, ease: 'easeOut' },
  ],
  // Shot 9: Inside-lane macro close-up on the 3D sneaker + dangling red shoelace sliding toward the red glowing gap!
  entrapment: [
    { f: 743, pos: [1.90, 4.60, 2.30], look: [0.05, 3.40, 0.58], fov: 36 },
    { f: 810, pos: [1.60, 4.40, 2.40], look: [0.08, 3.34, 0.64], fov: 33, roll: -3.0, ease: 'smooth' },
    { f: 866, pos: [1.40, 4.25, 2.50], look: [0.08, 3.30, 0.70], fov: 33, roll: -4.2, ease: 'easeOut' },
  ],
  // Shot 10: Dramatic cutaway directly facing ALL 5 spinning interlocking 3D steel/orange/red/yellow gears!
  gears_dont_stop: [
    { f: 867, pos: [0.0, 2.20, 5.95],  look: [0.0, 2.15, 0.45], fov: 46, roll: 2.0 },
    { f: 924, pos: [0.05, 2.10, 4.90], look: [0.0, 2.10, 0.45], fov: 42, roll: -3.2, ease: 'easeOut' },
  ],
  // Shot 11: Crisp studio-like mezzanine framing showing FULL "SAFETY CODE: SKIRT DEFLECTOR" board + inspector!
  safety_codes: [
    { f: 925,  pos: [3.4, 8.2, -0.15], look: [10.2, 7.85, -0.25], fov: 44 },
    { f: 1018, pos: [4.2, 8.1, -0.15], look: [10.2, 7.85, -0.25], fov: 41, ease: 'smooth' },
  ],
  // Shot 12: Inside-lane macro close-up on 3D sneaker grazing the dark stiff bristles + electric yellow zap!
  bristles_tickle: [
    { f: 1019, pos: [1.90, 4.55, 2.20], look: [0.05, 3.40, 0.62], fov: 36 },
    { f: 1098, pos: [1.50, 4.30, 2.40],  look: [0.05, 3.38, 0.68], fov: 33, roll: 2.8, ease: 'easeOut' },
  ],
  // Shot 13: Elevated 3/4 reaction shot — pink brain bubble + shopper hopping to center (face 100% clear of handrail!)
  brain_flinch: [
    { f: 1099, pos: [3.6, 6.25, 2.45], look: [0.4, 4.65, 0.0], fov: 38 },
    { f: 1182, pos: [4.2, 6.55, 2.85], look: [0.4, 4.75, 0.0], fov: 40, ease: 'easeOut' },
  ],
  // Shot 14: Elevated push-in on shopper pausing mid-rub and looking straight at camera on "remember."
  next_time: [
    { f: 1183, pos: [4.2, 6.65, 2.65], look: [0.8, 4.85, 0.1], fov: 39 },
    { f: 1264, pos: [3.4, 6.35, 2.15], look: [0.8, 4.90, 0.1], fov: 35, ease: 'smooth' },
    { f: 1286, pos: [3.0, 6.20, 1.95], look: [0.8, 4.95, 0.1], fov: 32, ease: 'easeOut' },
  ],
  // Shot 15: Heroic punch finale — post-silence jump to safe center of step!
  twist_finale: [
    { f: 1287, pos: [3.6, 6.45, 2.35], look: [1.0, 5.00, 0.0], fov: 36 },
    { f: 1368, pos: [3.0, 6.25, 1.95], look: [1.0, 5.05, 0.0], fov: 32, roll: -2.0, ease: 'smooth' },
    { f: 1372, pos: [4.3, 6.85, 3.15], look: [1.0, 5.10, 0.0], fov: 40, roll: 0, ease: 'easeOut' },
    { f: 1416, pos: [5.5, 7.55, 4.35], look: [1.2, 5.30, 0.0], fov: 42, ease: 'smooth' },
  ],
};

// Impact 7-frame flip-shakes synced to key dramatic beats
const KICKS = [
  { f: 93,   a: 0.045 },
  { f: 371,  a: 0.04  },
  { f: 872,  a: 0.065 },
  { f: 1035, a: 0.035 },
  { f: 1110, a: 0.04  },
  { f: 1372, a: 0.06  },
];

export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { creep: 0.0008, kicks: KICKS });
  c.flash =
    (f >= 336 && f < 342) ? (1 - (f - 336) / 6) * 0.78 :
    (f >= 925 && f < 931) ? (1 - (f - 925) / 6) * 0.75 :
    (f >= 1372 && f < 1376) ? (1 - (f - 1372) / 4) * 0.45 : 0;
  if (S.id === 'safety_codes') c.shadowAt = [9.5, 6.8, -0.3];
  else if (S.id === 'gears_dont_stop') c.shadowAt = [0, 1.9, 0.4];
  else c.shadowAt = [0, 3.2, 0];
  return c;
};

// ---------- Shallow Depth of Field ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook_brush':      return { focus: dist(C.pos, [-3.8, 2.7, 0.3]), cinf: 6 };
    case 'danger_reveal':   return { focus: dist(C.pos, [-0.25, 4.0, 0.4]), cinf: 8 };
    case 'most_dangerous':  return { focus: dist(C.pos, [0.5, 3.5, 0.0]), cinf: 0 };
    case 'free_shine':      return { focus: dist(C.pos, [-1.2, 3.7, 0.15]), cinf: 4 };
    case 'silent_alarm':    return { focus: dist(C.pos, [-0.15, 4.15, 0.38]), cinf: 8 };
    case 'moving_steps':    return { focus: dist(C.pos, [0.5, 3.7, 0.0]), cinf: 4 };
    case 'still_wall':      return { focus: dist(C.pos, [-0.8, 3.2, 0.72]), cinf: 7 };
    case 'razor_gap':       return { focus: dist(C.pos, [-0.25, 3.16, 0.80]), cinf: 10 };
    case 'entrapment':      return { focus: dist(C.pos, [0.08, 3.34, 0.65]), cinf: 9 };
    case 'gears_dont_stop': return { focus: dist(C.pos, [0.0, 1.80, 0.45]), cinf: 5 };
    case 'safety_codes':    return { focus: dist(C.pos, [10.2, 7.8, -0.35]), cinf: 4 };
    case 'bristles_tickle': return { focus: dist(C.pos, [0.05, 3.38, 0.65]), cinf: 9 };
    case 'brain_flinch':    return { focus: dist(C.pos, [0.4, 4.7, 0.0]), cinf: 6 };
    case 'next_time':       return { focus: dist(C.pos, [0.8, 4.9, 0.1]), cinf: 6 };
    case 'twist_finale':    return { focus: dist(C.pos, [1.0, 5.1, 0.0]), cinf: lerp(7, 0, M.smooth(ramp(f, 1372, 1412))) };
  }
  return { focus: 6, cinf: 0 };
};

// ---------- World State ----------
export const worldAt = (f) => {
  const S = shotAt(f);
  const W = { cutaway: false, hideFrontSkirt: false, showGears: false, showBrushes: true, dangerGlow: false, sneaker: null, codeStand: false };
  if (S.id === 'danger_reveal' || S.id === 'most_dangerous' || S.id === 'silent_alarm') {
    W.dangerGlow = true;
  }
  if (S.id === 'moving_steps' || S.id === 'still_wall' || S.id === 'razor_gap') {
    W.cutaway = true;
    W.dangerGlow = S.id === 'razor_gap';
    W.showBrushes = false;
  }
  if (S.id === 'entrapment') {
    W.cutaway = true; W.dangerGlow = true; W.showBrushes = false; W.hideFrontSkirt = true;
    const t = M.smooth(ramp(f, 748, 855));
    W.sneaker = { x: 0.05, y: escY(0.05) + 0.04, z: lerp(0.32, 0.64, t), ry: 0.14, scale: 1.05, lacePull: t };
  }
  if (S.id === 'gears_dont_stop') {
    W.cutaway = true; W.hideFrontSkirt = true; W.showGears = true; W.dangerGlow = true; W.showBrushes = false;
  }
  if (S.id === 'safety_codes') {
    W.codeStand = true;
  }
  if (S.id === 'bristles_tickle') {
    W.cutaway = true; W.hideFrontSkirt = true;
    const t = ramp(f, 1019, 1098);
    const zPos = t < 0.45 ? lerp(0.38, 0.60, M.easeOut(t / 0.45)) : 0.60 - Math.sin((t - 0.45) * 14) * 0.04;
    W.sneaker = { x: 0.05, y: escY(0.05) + 0.04, z: zPos, ry: 0.10, scale: 1.05, lacePull: 0 };
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
    case 'hook_brush': {
      const x = lerp(-4.3, -3.2, ramp(f, 0, 88));
      const rub = q((f * 0.09) % 1, 2);
      out.push(A(T, 'shopper', {
        seed: 5, expr: 'smug', L: 'hip', R: 'hang', rub, facing: 1, look: 0.4,
        blink: blinkAt(f, 5), bob: q(id1.bob, 3), tilt: q(id1.tilt + 3, 1), headTilt: q(id1.headTilt, 1),
      }, [x, escY(x), 0.36], { tint }));
      const x2 = lerp(1.5, 2.6, ramp(f, 0, 88));
      out.push(A(T, 'mallA', { seed: 11, expr: 'neutral', blink: blinkAt(f, 11), bob: q(id2.bob, 3) }, [x2, escY(x2), -0.25], { tint }));
      break;
    }
    case 'danger_reveal': {
      const shocked = f >= 98;
      const rub = shocked ? 0 : q((f * 0.1) % 1, 2);
      out.push(A(T, 'shopper', {
        seed: 5, expr: shocked ? 'panic' : 'smug', L: shocked ? 'cheek' : 'hip', R: shocked ? 'cheek' : 'hang',
        rub, facing: 0, look: 0, blink: shocked ? 0 : blinkAt(f, 5),
        bob: q(id1.bob, 3), tilt: q(shocked ? -4 + (f % 2 ? 1 : -1) : 2, 1),
      }, [-0.25, escY(-0.25), 0.36], { tint }));
      break;
    }
    case 'most_dangerous': {
      const t = ramp(f, 171, 248);
      const x1 = lerp(-2.5, -0.4, t), x2 = lerp(2.0, 4.1, t), x3 = lerp(-6.2, -4.1, t);
      out.push(A(T, 'shopper', { seed: 5, expr: 'nervous', L: 'panic', R: 'panic', blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [x1, escY(x1), 0.36], { tint }));
      out.push(A(T, 'mallA', { seed: 11, expr: 'neutral', blink: blinkAt(f, 11), bob: q(id2.bob, 3) }, [x2, escY(x2), -0.2], { tint }));
      out.push(A(T, 'mallB', { seed: 12, expr: 'neutral', blink: blinkAt(f, 12), bob: q(id3.bob, 3) }, [x3, escY(x3), 0.15], { tint }));
      break;
    }
    case 'free_shine': {
      const t = ramp(f, 249, 335);
      const rub = q((f * 0.11) % 1, 2);
      const x1 = lerp(-2.8, -1.2, t), x2 = lerp(-0.2, 1.4, t), x3 = lerp(-5.0, -3.4, t);
      out.push(A(T, 'shopper', { seed: 5, expr: 'grin', L: 'hip', R: 'thumb', rub, blink: blinkAt(f, 5), bob: q(id1.bob, 3) }, [x1, escY(x1), 0.36], { tint }));
      out.push(A(T, 'mallB', { seed: 12, expr: 'laugh', L: 'hip', R: 'hang', rub, blink: blinkAt(f, 12), bob: q(id2.bob, 3) }, [x2, escY(x2), 0.34], { tint }));
      out.push(A(T, 'mallC', { seed: 13, expr: 'grin', L: 'hang', R: 'hip', rub, blink: blinkAt(f, 13), bob: q(id3.bob, 3) }, [x3, escY(x3), 0.35], { tint }));
      break;
    }
    case 'silent_alarm': {
      out.push(A(T, 'shopper', {
        seed: 5, expr: f > 371 ? 'shock' : 'curious', L: f > 371 ? 'cheek' : 'hang', R: f > 371 ? 'cheek' : 'hang',
        facing: 0, look: 0, blink: f > 371 ? 0 : blinkAt(f, 5), bob: q(id1.bob, 3),
      }, [-0.15, escY(-0.15), 0.34], { tint }));
      break;
    }
    case 'moving_steps': {
      out.push(A(T, 'inspector', {
        seed: 21, expr: 'stern', L: 'board', R: 'pointDown', facing: -1, look: -0.4,
        blink: blinkAt(f, 21), bob: q(id2.bob, 3), headTilt: q(id2.headTilt, 1),
      }, [1.2, escY(1.2) - 0.05, -1.35], { tint }));
      break;
    }
    case 'still_wall': {
      out.push(A(T, 'inspector', {
        seed: 21, expr: 'stern', L: 'board', R: 'pointDown', facing: -1, look: -0.3,
        blink: blinkAt(f, 21), bob: q(id2.bob, 3),
      }, [-1.2, escY(-1.2), -0.35], { tint }));
      break;
    }
    case 'safety_codes': {
      // Inspector standing right next to the Safety Code board so both are 100% visible!
      out.push(A(T, 'inspector', {
        seed: 21, expr: 'grin', L: 'board', R: 'point', facing: -1, look: -0.2,
        blink: blinkAt(f, 21), bob: q(id2.bob, 3), tilt: q(id2.tilt, 1),
      }, [9.6, 6.4, 0.52], { tint }));
      break;
    }
    case 'brain_flinch': {
      const t = ramp(f, 1099, 1182);
      const jump = t > 0.25 && t < 0.65 ? Math.sin(((t - 0.25) / 0.40) * Math.PI) : 0;
      const zPos = t < 0.25 ? 0.42 : lerp(0.42, -0.05, M.back(clamp((t - 0.25) / 0.40)));
      const expr = t < 0.25 ? 'wince' : t < 0.65 ? 'shock' : 'relief';
      out.push(A(T, 'shopper', {
        seed: 5, expr, L: jump > 0.1 ? 'up' : 'hang', R: jump > 0.1 ? 'up' : 'hang',
        hop: q(jump, 2), blink: jump > 0.1 ? 0 : blinkAt(f, 5), bob: q(id1.bob, 3),
        tilt: q(jump > 0.1 ? -8 : 0, 1),
      }, [0.4, escY(0.4), zPos], { tint }));
      break;
    }
    case 'next_time': {
      const paused = f >= 1255;
      const rub = paused ? 0 : q((f * 0.08) % 1, 2);
      out.push(A(T, 'shopper', {
        seed: 5, expr: paused ? 'knowing' : 'grin', L: 'hip', R: paused ? 'up' : 'hang',
        rub, facing: paused ? 0 : 1, look: 0, blink: paused ? 0 : blinkAt(f, 5),
        bob: q(id1.bob, 3), headTilt: q(paused ? 6 : id1.headTilt, 1),
      }, [0.8, escY(0.8), paused ? 0.24 : 0.36], { tint }));
      break;
    }
    case 'twist_finale': {
      const twist = f >= 1372;
      const tJump = M.back(clamp((f - 1372) / 14));
      const jump = twist && f < 1388 ? Math.sin(((f - 1372) / 16) * Math.PI) : 0;
      const zPos = twist ? lerp(0.32, 0.0, tJump) : 0.32;
      const shake = !twist ? 8 * Math.sin((f - 1287) * 0.4) : 0;
      out.push(A(T, 'shopper', {
        seed: 5, expr: twist ? 'shock' : 'stern', L: twist ? 'up' : 'cross', R: twist ? 'up' : 'cross',
        hop: q(jump, 2), facing: 0, look: 0, blink: twist ? 0 : blinkAt(f, 5),
        bob: q(id1.bob, 3), headTilt: q(twist ? 0 : shake, 1),
      }, [1.0, escY(1.0), zPos], { tint }));
      out.push(A(T, 'mallA', { seed: 11, expr: 'neutral', blink: blinkAt(f, 11), bob: q(id2.bob, 3) }, [-2.8, escY(-2.8), 0.0], { tint }));
      out.push(A(T, 'mallB', { seed: 12, expr: 'smile', blink: blinkAt(f, 12), bob: q(id3.bob, 3) }, [4.2, escY(4.2), 0.0], { tint }));
      break;
    }
  }
  return out;
};

// ---------- 2D Cartoon FX Cards ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });

export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'hook_brush') {
    const t = q((f * 0.04) % 1, 2);
    const x = lerp(-4.1, -3.0, ramp(f, 0, 88));
    out.push(FX('sp' + t, (p) => T.fxSparkle(p, t), [x + 0.3, escY(x) + 0.18, 0.65], 0.42));
  }
  if (S.id === 'danger_reveal' && f >= 95) {
    const t = q(((f - 95) * 0.045) % 1, 2);
    out.push(FX('al' + t, (p) => T.fxAlert(p, t), [0.15, escY(0.15) + 0.38, 0.66], 0.48));
  }
  if (S.id === 'free_shine') {
    const t = q((f * 0.05) % 1, 2);
    out.push(FX('sp1' + t, (p) => T.fxSparkle(p, t), [-1.8, escY(-1.8) + 0.25, 0.66], 0.45));
    out.push(FX('sp2' + t, (p) => T.fxSparkle(p, (t + 0.4) % 1), [0.8, escY(0.8) + 0.25, 0.66], 0.42));
  }
  if (S.id === 'silent_alarm' && f >= 355) {
    const t = q(((f - 355) * 0.04) % 1, 2);
    out.push(FX('sa' + t, (p) => T.fxAlert(p, t), [0.25, escY(0.25) + 0.40, 0.66], 0.50));
  }
  if (S.id === 'entrapment' && f >= 780) {
    const t = q(((f - 780) * 0.04) % 1, 2);
    out.push(FX('sw' + t, (p) => T.fxSweat(p, t), [0.05, escY(0.05) + 0.72, 0.48], 0.42));
  }
  if (S.id === 'bristles_tickle' && f >= 1042) {
    const t = q(((f - 1042) * 0.08) % 1, 2);
    out.push(FX('zp' + t, (p) => T.fxZap(p, t), [0.18, escY(0.18) + 0.24, 0.68], 0.40));
  }
  if (S.id === 'brain_flinch') {
    const t = q(ramp(f, 1099, 1170), 2);
    out.push(FX('br' + t, (p) => T.fxBrain(p, t), [0.35, escY(0.35) + 1.85, -0.15], 0.62));
    if (f >= 1118 && f <= 1152) {
      const tm = q((f - 1118) / 34, 2);
      out.push(FX('mo' + tm, (p) => T.fxMotion(p, tm), [0.4, escY(0.4) + 0.7, 0.45], 0.55));
    }
  }
  if (S.id === 'twist_finale' && f >= 1372) {
    const t = q(((f - 1372) * 0.05) % 1, 2);
    out.push(FX('fa' + t, (p) => T.fxAlert(p, t), [1.15, escY(1.15) + 0.30, 0.72], 0.50));
  }
  return out;
};
