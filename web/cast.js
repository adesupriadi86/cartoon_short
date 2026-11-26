// ---------------- Airplane Cast (built on toonbase.js Pen / blob / face helpers) ----------------
FACE.smug = { eye: ["lid", "lid"], brow: [-2, 3], mouth: "smirk" };
FACE.panic = { eye: ["shock", "shock"], brow: [-5, 5], mouth: "O" };
FACE.wince = { eye: ["squeeze", "squeeze"], brow: [-4, 4], mouth: "teeth" };
FACE.curious = { eye: ["dot", "dot"], brow: [-3, 2], mouth: "o" };
FACE.knowing = { eye: ["lid", "dot"], brow: [3, -4], mouth: "smirk" };

export const CAST = {
  passenger: { jacket: "#2f6fb2", pants: "#2b3648", shoes: "#f4f6f8", shoeTrim: "#f5c418", skin: SKIN,      hair: "#2b211c", hoodie: true },
  pilot:     { jacket: "#1f2a3a", pants: "#1f2a3a", shoes: "#241726", shoeTrim: "#f5c418", skin: "#f5c9a0", cap: "#1f2a3a" },
  engineer:  { jacket: "#f2c22e", pants: "#2b3648", shoes: "#3a2e28", shoeTrim: "#241726", skin: "#f5c9a0", hardhat: "#f5c418", vest: true, stout: true },
  travelerA: { jacket: "#e05a47", pants: "#383e4c", shoes: "#f2ece1", shoeTrim: "#28b8a8", skin: "#ecd0b6", hair: "#2b211c" },
  travelerB: { jacket: "#3fa36c", pants: "#434c5e", shoes: "#ffffff", shoeTrim: "#3b82f6", skin: "#f5c9a0", cap: "#f08a2c" },
  /** Brain-freeze hero: kid in a red hoodie with a slushie */
  kid:     { jacket: "#e05a47", pants: "#2b3648", shoes: "#f4f6f8", shoeTrim: "#28b8a8", skin: SKIN,      hair: "#2b211c", hoodie: true },
  /** Friendly doctor in a white coat for the nerve-board shots */
  doctor:  { jacket: "#f8fafc", pants: "#2b3648", shoes: "#3a2e28", shoeTrim: "#241726", skin: "#f5c9a0", hair: "#6b7280" },
};

/** Hard hat for the safety inspector */
const drawHardhat = (p, H, cx, hc, light, thick, ow, col, u) => {
  const bandY = hc - H.b * 0.44;
  const dome = ellPts(cx, bandY, H.a * 1.08, H.b * 0.72, 180, 360, 0, 44);
  p.shadedFill(dome, col, mul(col, [0.76, 0.70, 0.60]), light, H.a, 0.35);
  p.clip(dome, () => {
    // top ridge
    p.poly(rrect(cx - 12 * u, bandY - H.b * 0.74, cx + 12 * u, bandY - 2 * u, 6 * u), mul(col, [1.08, 1.06, 0.95]), 2.5 * u);
    p.stroke(ellPts(cx - 18 * u, bandY - 0.34 * H.b, 0.25 * H.a, 0.14 * H.b, 200, 310, 0, 14), 5 * u, "#ffffff77");
  });
  p.inkRing(dome, ow * 0.92, thick);
  // brim
  p.band([[cx - H.a * 1.24, bandY + 2 * u], [cx + H.a * 1.24, bandY + 2 * u]], col, 9 * u, 2.2 * u, "round");
};

/** Front-facing modern bean-head character with expressive arms, foot rub/hop, and dangling shoelace */
export const mallFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? CAST[key] : key;
  const {
    expr = "neutral", blink = 0, look = 0, facing = 0, seed = 5,
    L = "hang", R = "hang", tilt = 0, headTilt = 0, bob = 0,
    light = rad(-120), step = 0, rub = 0, hop = 0,
  } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  let cupDraw = null; // slushie cup is drawn after the head so it sits in front of the face
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.10 : 1.06, legsL = 1.38, sole = 975 - hop * 95;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = O.pants, armCol = mix(O.jacket, INK, 0.32);
  p.rot = null;

  // ---- legs & chunky sneakers ----
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 28 * (step ? 1 : 0);
    const isRubLeg = side === 1 && rub !== 0;
    const rubX = isRubLeg ? Math.sin(rub * Math.PI * 2) * 18 * u + 22 * u : 0;
    const rubY = isRubLeg ? -12 * u : 0;
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u + rubX, fy = sole - 6 * u - up + rubY;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 4 * u, (hipY + fy) / 2], [fx, fy]), 7.2 * u, legCol);
    // chunky sneaker
    const sx0 = fx - side * 5 * u, sx1 = fx + side * 18 * u;
    p.stroke([[sx0, fy], [sx1, fy + 1 * u]], 10.5 * u + 4, INK);
    p.stroke([[sx0, fy], [sx1, fy + 1 * u]], 10.5 * u, O.shoes || "#ffffff");
    p.stroke([[sx0 + side * 2 * u, fy + 3 * u], [sx1 - side * 2 * u, fy + 3.5 * u]], 3.2 * u, O.shoeTrim || "#28b8a8");
    // dangling red shoelace on hero's right sneaker
    if (O.lace && side === 1) {
      const lx = (sx0 + sx1) / 2, ly = fy + 2 * u;
      p.stroke(curve([lx, ly], [lx + 14 * u, ly + 18 * u], [lx + 24 * u, ly + 6 * u]), 2.6 * u, "#ff3b30");
    }
  }

  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = {
    a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1),
    b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
    nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.16 : 0.11, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7
  };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.12 * HH]], front: false, finger: true };
      case "pointDown": return { pts: [s, [X(24), s[1] + 0.22 * HH], [X(54), s[1] + 0.45 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(16), s[1] - 0.28 * HH], [X(24), s[1] - 0.72 * HH]], front: false };
      case "panic": return { pts: [s, [X(22), s[1] - 0.22 * HH], [X(32), s[1] - 0.65 * HH]], front: false };
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.24 * H.b]], front: false };
      case "drink": return { pts: [s, [X(16), s[1] - 0.02 * HH], [cx + side * (H.a * 0.6), hc + 0.35 * H.b]], front: true, cup: true };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.28 * HH]], front: false };
      case "cross": return { pts: [s, [X(2), s[1] + 0.36 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "board": return { pts: [s, [X(10), s[1] + 0.38 * HH], [tcx + side * 0.4 * T.a, torsoBot - 0.25 * HH]], front: true, clipboard: true };
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.02 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.4 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.6 * u);
    if (a.cup) cupDraw = { hx, hy };
    if (a.finger) {
      const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy) || 1;
      p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u);
    }
    if (a.thumb) p.stroke([[hx, hy], [hx + Math.sign(hx - cx) * 6 * u, hy - 12 * u]], 2.6 * u);
    if (a.clipboard) {
      const cb = rrect(hx - 14 * u, hy - 22 * u, hx + 18 * u, hy + 18 * u, 3 * u);
      p.poly(cb, "#8a5a34", 2.4 * u);
      p.poly(rrect(hx - 10 * u, hy - 16 * u, hx + 14 * u, hy + 14 * u, 1.5 * u), "#f6f8fa", 1.4 * u);
      p.stroke([[hx - 6 * u, hy - 8 * u], [hx + 10 * u, hy - 8 * u]], 1.8 * u, "#3b82f6");
      p.stroke([[hx - 6 * u, hy], [hx + 8 * u, hy]], 1.8 * u, "#64748b");
    }
  };

  for (const a of arms) if (!a.front) drawArm(a);

  // torso / dress
  if (O.dress) {
    const D = { a: 0.5 * W * 0.96, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.32, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  p.gradFill(tp, O.jacket, mul(O.jacket, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.hoodie) {
      // hoodie pocket + drawstrings
      p.poly(rrect(tcx - 0.45 * T.a, torsoBot - 0.45 * HH, tcx + 0.45 * T.a, torsoBot - 0.08 * HH, 6 * u), mul(O.jacket, [0.88, 0.86, 0.9]), 2 * u);
      p.stroke([[tcx - 0.16 * T.a, chin + 0.06 * HH], [tcx - 0.16 * T.a, chin + 0.34 * HH]], 2.4 * u, "#ffffff");
      p.stroke([[tcx + 0.16 * T.a, chin + 0.06 * HH], [tcx + 0.16 * T.a, chin + 0.34 * HH]], 2.4 * u, "#ffffff");
    }
    if (O.vest) {
      // high-vis safety reflective stripes
      p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], "#e2e8f0", 8 * u, 1.5 * u);
      p.band([[tcx - 0.48 * T.a, chin - 0.1 * HH], [tcx - 0.48 * T.a, torsoBot - 0.28 * HH]], "#e2e8f0", 7 * u, 1.4 * u);
      p.band([[tcx + 0.48 * T.a, chin - 0.1 * HH], [tcx + 0.48 * T.a, torsoBot - 0.28 * HH]], "#e2e8f0", 7 * u, 1.4 * u);
    }
  });
  p.inkRing(tp, ow, thick);
  for (const a of arms) if (a.front) drawArm(a);

  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  const hp = blobPts(cx, hc, H);
  if (O.hair && !O.hardhat) {
    const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.04, b: H.b * 1.05 });
    p.poly(hb, O.hair, 0);
  }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (O.hardhat) {
    drawHardhat(p, H, cx, hc, light, thick, ow, O.hardhat, u);
  } else if (O.cap) {
    hatOn(p, { hat: "cap", cap: O.cap, jacket: O.jacket }, hp, H, cx, hc, light, seed, facing, false);
  } else if (O.hair) {
    hatOn(p, { hat: "hair", hair: O.hair, jacket: O.jacket }, hp, H, cx, hc, light, seed, facing, false);
  }
  faceFront(p, cx, hc, W, expr, facing, look, lid, !!O.hardhat, skin, null, !!O.stout);
  p.rot = null;

  // slushie cup held to the mouth — drawn last so it sits in front of the face
  if (cupDraw) {
    const { hx, hy } = cupDraw;
    const side = Math.sign(hx - cx) || 1;
    const oldRot = p.rot;
    p.rot = [rad(-16 * side), hx, hy];
    // cup body (big icy-blue trapezoid)
    p.poly([[hx - 28 * u, hy - 8 * u], [hx + 28 * u, hy - 8 * u], [hx + 21 * u, hy + 58 * u], [hx - 21 * u, hy + 58 * u]], "#7dd3fc", 3 * u);
    // pink slushie dome on top
    p.ell(hx, hy - 8 * u, 28 * u, 15 * u, "#ff8fb1", 2.6 * u);
    // white highlight on the cup
    p.stroke([[hx - 19 * u, hy + 8 * u], [hx - 15 * u, hy + 44 * u]], 3 * u, "#ffffff");
    // straw: drawn last so it sits on top, reaching left past the dome to the mouth
    p.stroke([[hx - 4 * u * side, hy - 10 * u], [hx - 45 * u * side, hy - 2 * u]], 3.6 * u, "#ffffff");
    p.stroke([[hx - 4 * u * side, hy - 10 * u], [hx - 25 * u * side, hy - 6 * u]], 1.8 * u, "#ff3b30");
    p.rot = oldRot;
  }
};

// ---------------- Custom 2D FX Cards ----------------
/** Shiny 4-point cartoon sparkles for the "free shoe shine" beat */
export const fxSparkle = (p, t) => {
  const g = p.g; g.save();
  const pts = [[210, 420, 0.9, 0], [390, 340, 0.65, 0.35], [320, 560, 0.75, 0.65]];
  for (const [x, y, sc, ph] of pts) {
    const k = Math.sin(((t + ph) % 1) * Math.PI);
    if (k <= 0.05) continue;
    const r = 68 * sc * k, ri = 18 * sc * k;
    const poly = [];
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, rr = i % 2 === 0 ? r : ri;
      poly.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    p.poly(poly, "#fff394", 10);
  }
  g.restore();
};

/** Bold cartoon "!" warning & pulsing silent-alarm rings */
export const fxAlert = (p, t) => {
  const g = p.g; g.save();
  for (let i = 0; i < 2; i++) {
    const k = (t + i * 0.5) % 1;
    g.globalAlpha = Math.max(0, 1 - k);
    g.strokeStyle = i === 0 ? "#ff3b30" : "#ffd60a";
    g.lineWidth = 18 * (1 - k * 0.5);
    g.beginPath(); g.arc(300, 480, 70 + k * 210, 0, Math.PI * 2); g.stroke();
  }
  g.globalAlpha = 1;
  // bold "!" exclamation mark
  const s = 1 + 0.12 * Math.sin(t * Math.PI * 6);
  g.translate(300, 480); g.scale(s, s); g.translate(-300, -480);
  p.poly([[272, 330], [328, 330], [316, 495], [284, 495]], "#ff3b30", 14);
  p.ell(300, 548, 26, 26, "#ff3b30", 14);
  g.restore();
};

/** Electric neon-yellow tactile reflex zaps when bristles tickle the ankle */
export const fxZap = (p, t) => {
  const g = p.g; g.save();
  const s = 0.75 + 0.45 * Math.sin(t * Math.PI);
  g.translate(300, 500); g.scale(s, s); g.translate(-300, -500);
  const bolts = [
    [[300, 500], [210, 410], [250, 390], [160, 290]],
    [[300, 500], [390, 400], [350, 380], [440, 280]],
    [[300, 500], [190, 560], [220, 595], [140, 660]],
    [[300, 500], [410, 550], [380, 590], [455, 650]],
  ];
  for (const b of bolts) {
    p.stroke(b, 22, INK);
    p.stroke(b, 12, "#ffe600");
  }
  p.ell(300, 500, 36, 36, "#ffffff", 10);
  g.restore();
};

/** Cartoon thought-bubble showing a pink brain firing a reflex lightning bolt */
export const fxBrain = (p, t) => {
  const g = p.g; g.save();
  const pop = Math.min(1, t * 4);
  g.translate(300, 460); g.scale(pop, pop); g.translate(-300, -460);
  // cloud bubble
  p.ell(300, 420, 175, 130, "#ffffff", 14);
  p.ell(210, 580, 28, 24, "#ffffff", 10);
  p.ell(170, 640, 16, 14, "#ffffff", 8);
  // pink cartoon brain lobes
  p.ell(255, 425, 68, 56, "#ff8fb1", 10);
  p.ell(345, 425, 68, 56, "#ff8fb1", 10);
  p.ell(300, 390, 62, 46, "#ff8fb1", 10);
  p.stroke([[300, 355], [300, 475]], 8, "#c24b72");
  p.stroke([[230, 415], [275, 430]], 6, "#c24b72");
  p.stroke([[325, 430], [370, 415]], 6, "#c24b72");
  // flashing yellow reflex bolt out of the brain
  if (Math.floor(t * 16) % 2 === 0) {
    const bolt = [[300, 330], [355, 250], [315, 250], [375, 170]];
    p.stroke(bolt, 20, INK);
    p.stroke(bolt, 11, "#ffe600");
  }
  g.restore();
};

/** Panic sweat drops */
export const fxSweat = (p, t) => {
  const g = p.g; g.save();
  const drops = [[220, 420, -1], [385, 400, 1], [300, 340, 0]];
  for (const [x, y, dir] of drops) {
    const dx = dir * t * 70, dy = -t * 50 + t * t * 140;
    p.ell(x + dx, y + dy, 22, 34, "#7dd3fc", 10);
  }
  g.restore();
};

/** Comic speed/motion lines when shopper hops back to safety */
export const fxMotion = (p, t) => {
  const g = p.g; g.save();
  g.globalAlpha = Math.max(0, 1 - t);
  for (let i = 0; i < 5; i++) {
    const y = 340 + i * 75, len = 120 + (i % 2) * 70;
    p.stroke([[120 + t * 90, y], [120 + len + t * 90, y]], 14, "#ffffff");
    p.stroke([[120 + t * 90, y], [120 + len + t * 90, y]], 7, INK);
  }
  g.restore();
};

/** Floating bold "?" marks for the "weird part" beat */
export const fxQuestion = (p, t) => {
  const g = p.g; g.save();
  const marks = [[230, 380, 1.0, 0], [320, 300, 0.8, 0.3], [390, 420, 0.65, 0.55]];
  for (const [x, y, sc, ph] of marks) {
    const k = Math.sin(((t + ph) % 1) * Math.PI);
    const bob = Math.sin((t + ph) * Math.PI * 2) * 22;
    g.globalAlpha = 0.35 + 0.65 * k;
    g.fillStyle = "#241726";
    g.font = `900 ${Math.round(150 * sc)}px Arial Black, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("?", x, y + bob);
  }
  g.restore();
};

/** Drifting snowflakes for the cold palate macro */
export const fxSnow = (p, t) => {
  const g = p.g; g.save();
  for (let i = 0; i < 6; i++) {
    const x = 120 + i * 78, y = 120 + ((t * 520 + i * 137) % 640);
    const sway = Math.sin(t * Math.PI * 2 + i * 1.7) * 18;
    g.globalAlpha = 0.9;
    g.strokeStyle = "#dff3ff"; g.lineWidth = 9; g.lineCap = "round";
    for (let a = 0; a < 3; a++) {
      const ang = a * Math.PI / 3 + 0.3;
      const dx = Math.cos(ang) * 26, dy = Math.sin(ang) * 26;
      g.beginPath(); g.moveTo(x + sway - dx, y - dy); g.lineTo(x + sway + dx, y + dy); g.stroke();
    }
  }
  g.restore();
};
