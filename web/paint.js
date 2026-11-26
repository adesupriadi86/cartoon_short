// Painted Canvas2D textures for the 3D airplane world. All deterministic.
import * as THREE from './lib/three.module.js';

export const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
export const tex = (c, rx = 1, ry = 1) => {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

/** White airliner fuselage skin: panel lines, rivet rows, blue cheatline band */
export function fuselageTex(seed = 1) {
  const [c, g] = cv(1024, 512), r = rng(seed);
  g.fillStyle = '#f2f5f7'; g.fillRect(0, 0, 1024, 512);
  // subtle brushed metal sheen
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`;
    g.fillRect(0, r() * 512, 1024, 2 + r() * 5);
  }
  // vertical panel seams + rivet rows
  for (let x = 0; x < 1024; x += 128) {
    g.fillStyle = '#b9c4cd'; g.fillRect(x, 0, 3, 512);
    for (let y = 8; y < 512; y += 22) {
      g.fillStyle = '#8d9aa6';
      g.beginPath(); g.arc(x + 8, y, 2.2, 0, 7); g.fill();
    }
  }
  // horizontal seam lines
  g.fillStyle = '#c3ced7';
  g.fillRect(0, 120, 1024, 3); g.fillRect(0, 390, 1024, 3);
  // airline cheatline: deep sky blue band running the LENGTH of the fuselage
  // (texture x = around the circumference; u 0..0.125 = the +Z side where the windows sit)
  g.fillStyle = '#1f6fb2'; g.fillRect(0, 0, 128, 512);
  g.fillStyle = '#f5c418'; g.fillRect(0, 0, 6, 512); g.fillRect(122, 0, 6, 512);
  return c;
}

/** Dark blue aircraft window glass with sky reflection streaks */
export function windowGlass(seed = 2) {
  const [c, g] = cv(256, 256), r = rng(seed);
  const gr = g.createLinearGradient(0, 0, 256, 256);
  gr.addColorStop(0, '#2c5f8a'); gr.addColorStop(0.55, '#16324e'); gr.addColorStop(1, '#0d1f33');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  // sky reflection streaks
  g.fillStyle = 'rgba(255,255,255,0.30)';
  g.beginPath(); g.moveTo(30, 0); g.lineTo(90, 0); g.lineTo(30, 256); g.lineTo(0, 256); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.beginPath(); g.moveTo(150, 0); g.lineTo(180, 0); g.lineTo(120, 256); g.lineTo(90, 256); g.fill();
  // tiny cloud flecks
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.3})`;
    g.beginPath(); g.ellipse(40 + r() * 176, 40 + r() * 176, 10 + r() * 18, 5 + r() * 7, 0, 0, 7); g.fill();
  }
  return c;
}

/** Runway tarmac: dark asphalt, centerline dashes, edge stripes */
export function tarmac(seed = 3) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#3a3f45'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${200 + r() * 55},${200 + r() * 55},${205 + r() * 50},${0.04 + r() * 0.08})`;
    g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2 + r() * 3);
  }
  // runway centerline dashes (run along X on the ground) + edge stripes
  g.fillStyle = '#f5f0dc';
  for (let x = 0; x < 512; x += 128) g.fillRect(x + 16, 248, 64, 16);
  // edge lines
  g.fillStyle = '#f5c418'; g.fillRect(0, 20, 512, 8); g.fillRect(0, 484, 512, 8);
  return c;
}

/** Industrial hazard stripes (yellow & dark plum-black) */
export function hazardStripe() {
  const [c, g] = cv(256, 256);
  g.fillStyle = '#f5c418'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#241726';
  for (let i = -256; i < 512; i += 64) {
    g.beginPath();
    g.moveTo(i, 0); g.lineTo(i + 32, 0); g.lineTo(i - 224, 256); g.lineTo(i - 256, 256);
    g.closePath(); g.fill();
  }
  return c;
}

/** Mechanical cutaway wall sign */
export function warnLabel(text = 'DANGER') {
  const [c, g] = cv(512, 160);
  g.fillStyle = '#ff3b30'; g.fillRect(0, 0, 512, 160);
  g.strokeStyle = '#f5c418'; g.lineWidth = 14; g.strokeRect(10, 10, 492, 140);
  g.fillStyle = '#ffffff'; g.font = '900 48px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 84);
  return c;
}

/** Generic bold text plate: big centered text on a solid color */
export function textPlate(text = 'TEXT', bg = '#1f6fb2', fg = '#ffffff', sub = '') {
  const [c, g] = cv(1024, 320);
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 320);
  g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(14, 14, 996, 292);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 92;
  g.font = `900 ${fs}px Arial Black, sans-serif`;
  while (g.measureText(text).width > 940 && fs > 20) { fs -= 4; g.font = `900 ${fs}px Arial Black, sans-serif`; }
  g.fillText(text, 512, sub ? 132 : 164);
  if (sub) {
    g.font = 'bold 44px Arial, sans-serif';
    g.fillText(sub, 512, 240);
  }
  return c;
}

/** Blueprint poster: square window with red stress corners vs round window with green flow */
export function blueprintStress() {
  const [c, g] = cv(768, 1024);
  g.fillStyle = '#184e82'; g.fillRect(0, 0, 768, 1024);
  g.strokeStyle = 'rgba(140,210,255,0.22)'; g.lineWidth = 2;
  for (let x = 0; x <= 768; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  for (let y = 0; y <= 1024; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(768, y); g.stroke(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(28, 28, 712, 968);
  g.fillStyle = '#f5c418'; g.fillRect(48, 52, 672, 118);
  g.strokeStyle = '#241726'; g.lineWidth = 6; g.strokeRect(48, 52, 672, 118);
  g.fillStyle = '#241726'; g.font = '900 54px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('STRESS', 384, 112);
  g.fillStyle = '#ffffff'; g.font = '900 40px Arial Black, sans-serif';
  g.fillText('CONCENTRATION', 384, 222);
  // LEFT: square window, red corners, crack lines
  g.fillStyle = '#c8d6e5'; g.fillRect(90, 300, 220, 220);
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(90, 300, 220, 220);
  g.fillStyle = '#16324e'; g.fillRect(130, 340, 140, 140);
  for (const [cx, cy] of [[130, 340], [270, 340], [130, 480], [270, 480]]) {
    g.fillStyle = '#ff3b30';
    g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill();
    g.strokeStyle = '#ff3b30'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + (cx < 200 ? -42 : 42), cy + (cy < 410 ? -42 : 42)); g.stroke();
  }
  g.fillStyle = '#ff8a80'; g.font = 'bold 34px Arial, sans-serif';
  g.fillText('SQUARE', 200, 580);
  g.fillStyle = '#ffd60a'; g.font = 'bold 28px Arial, sans-serif';
  g.fillText('STRESS PILES UP', 200, 622);
  // RIGHT: round window, green flow arrows
  g.fillStyle = '#c8d6e5';
  g.beginPath(); g.arc(558, 410, 110, 0, 7); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 6;
  g.beginPath(); g.arc(558, 410, 110, 0, 7); g.stroke();
  g.fillStyle = '#16324e';
  g.beginPath(); g.arc(558, 410, 72, 0, 7); g.fill();
  g.strokeStyle = '#4cd964'; g.lineWidth = 9; g.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a0 = i * Math.PI / 2 + 0.5, a1 = a0 + 0.9;
    g.beginPath(); g.arc(558, 410, 132, a0, a1); g.stroke();
  }
  g.fillStyle = '#7dff9e'; g.font = 'bold 34px Arial, sans-serif';
  g.fillText('ROUND', 558, 580);
  g.fillStyle = '#7dff9e'; g.font = 'bold 28px Arial, sans-serif';
  g.fillText('STRESS SPREADS', 558, 622);
  // bottom line
  g.fillStyle = '#ffffff'; g.font = 'bold 30px monospace';
  g.fillText('ROUND THE CORNER // LIVE', 384, 700);
  // small pressure arrows pushing on the skin
  g.strokeStyle = '#ffd60a'; g.lineWidth = 10;
  for (const x of [150, 384, 618]) {
    g.beginPath(); g.moveTo(x, 800); g.lineTo(x, 880); g.stroke();
    g.beginPath(); g.moveTo(x - 18, 862); g.lineTo(x, 892); g.lineTo(x + 18, 862); g.stroke();
  }
  g.fillStyle = '#ffd60a'; g.font = 'bold 30px Arial, sans-serif';
  g.fillText('PRESSURE EVERY FLIGHT', 384, 940);
  return c;
}

export function radial(col = '0,0,0', a = 0.55) {
  const [c, g] = cv(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.55, `rgba(${col},${a * 0.6})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
}

/** Warm sidewalk tiles for the cafe patio floor */
export function sidewalk(seed = 7) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#c9b8a3'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(${120 + r() * 80},${100 + r() * 70},${80 + r() * 60},${0.05 + r() * 0.08})`;
    g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2 + r() * 3);
  }
  // tile grid + warm grout lines
  g.strokeStyle = '#8f7d68'; g.lineWidth = 4;
  for (let x = 0; x <= 512; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  for (let y = 0; y <= 512; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  // a sunny yellow center line like a patio border
  g.fillStyle = '#f5c418'; g.fillRect(0, 248, 512, 10);
  return c;
}

/** Blueprint poster: head profile with the three trigeminal nerve branches */
export function nerveDiagram() {
  const [c, g] = cv(768, 1024);
  g.fillStyle = '#184e82'; g.fillRect(0, 0, 768, 1024);
  g.strokeStyle = 'rgba(140,210,255,0.22)'; g.lineWidth = 2;
  for (let x = 0; x <= 768; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  for (let y = 0; y <= 1024; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(768, y); g.stroke(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(28, 28, 712, 968);
  // header band
  g.fillStyle = '#f5c418'; g.fillRect(48, 52, 672, 118);
  g.strokeStyle = '#241726'; g.lineWidth = 6; g.strokeRect(48, 52, 672, 118);
  g.fillStyle = '#241726'; g.font = '900 50px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('TRIGEMINAL NERVE', 384, 112);
  g.fillStyle = '#ffffff'; g.font = '900 34px Arial Black, sans-serif';
  g.fillText('ONE CABLE, THREE BRANCHES', 384, 210);
  // head profile (side view, facing left): big round skull + jaw
  g.strokeStyle = '#ffffff'; g.lineWidth = 9;
  g.beginPath();
  g.arc(400, 470, 190, Math.PI * 0.55, Math.PI * 1.95);
  g.lineTo(250, 700); g.lineTo(330, 700); g.lineTo(360, 760); g.lineTo(430, 760);
  g.stroke();
  // brain blob inside the skull
  g.fillStyle = '#ff8fb1';
  g.beginPath(); g.ellipse(400, 450, 110, 88, 0, 0, 7); g.fill();
  g.strokeStyle = '#c24b72'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(340, 430); g.quadraticCurveTo(400, 400, 460, 430); g.stroke();
  g.beginPath(); g.moveTo(340, 470); g.quadraticCurveTo(400, 445, 460, 470); g.stroke();
  // nerve trunk from the brainstem down to the cheek junction
  g.strokeStyle = '#ffd60a'; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(380, 540); g.lineTo(330, 640); g.stroke();
  g.fillStyle = '#ffd60a';
  g.beginPath(); g.arc(330, 640, 14, 0, 7); g.fill();
  // branch 1: ophthalmic -> forehead (red)
  g.strokeStyle = '#ff3b30'; g.lineWidth = 10;
  g.beginPath(); g.moveTo(330, 640); g.quadraticCurveTo(260, 560, 270, 420); g.stroke();
  g.fillStyle = '#ff3b30';
  g.beginPath(); g.arc(270, 420, 12, 0, 7); g.fill();
  g.font = 'bold 32px Arial, sans-serif'; g.textAlign = 'left';
  g.fillText('FOREHEAD', 300, 400);
  // branch 2: maxillary -> palate (green)
  g.strokeStyle = '#4cd964'; g.lineWidth = 10;
  g.beginPath(); g.moveTo(330, 640); g.quadraticCurveTo(300, 690, 380, 700); g.stroke();
  g.fillStyle = '#4cd964';
  g.beginPath(); g.arc(380, 700, 12, 0, 7); g.fill();
  g.fillText('PALATE', 410, 712);
  // branch 3: mandibular -> jaw (cyan)
  g.strokeStyle = '#4dd0e1'; g.lineWidth = 10;
  g.beginPath(); g.moveTo(330, 640); g.lineTo(420, 740); g.stroke();
  g.fillStyle = '#4dd0e1';
  g.beginPath(); g.arc(420, 740, 12, 0, 7); g.fill();
  g.fillText('JAW', 440, 752);
  // footer
  g.fillStyle = '#ffffff'; g.font = 'bold 30px monospace'; g.textAlign = 'center';
  g.fillText('SAME WIRE, WRONG ADDRESS', 384, 880);
  g.fillStyle = '#ffd60a'; g.font = 'bold 28px Arial, sans-serif';
  g.fillText('PAIN REPORTS TO THE FOREHEAD', 384, 930);
  return c;
}

/** Blueprint poster: cold in the mouth, pain in the forehead (referred pain) */
export function referredPain() {
  const [c, g] = cv(768, 1024);
  g.fillStyle = '#184e82'; g.fillRect(0, 0, 768, 1024);
  g.strokeStyle = 'rgba(140,210,255,0.22)'; g.lineWidth = 2;
  for (let x = 0; x <= 768; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  for (let y = 0; y <= 1024; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(768, y); g.stroke(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(28, 28, 712, 968);
  g.fillStyle = '#ff3b30'; g.fillRect(48, 52, 672, 118);
  g.strokeStyle = '#f5c418'; g.lineWidth = 6; g.strokeRect(48, 52, 672, 118);
  g.fillStyle = '#ffffff'; g.font = '900 52px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('REFERRED PAIN', 384, 112);
  g.fillStyle = '#ffffff'; g.font = '900 34px Arial Black, sans-serif';
  g.fillText('COLD HERE ...', 200, 240);
  g.fillText('... HURTS THERE', 560, 240);
  // left: ice cube in the mouth
  g.fillStyle = '#7dd3fc';
  g.beginPath(); g.moveTo(120, 330); g.lineTo(280, 330); g.lineTo(260, 470); g.lineTo(140, 470); g.closePath(); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#ffffff'; g.font = '900 44px Arial Black, sans-serif';
  g.fillText('COLD', 200, 540);
  g.fillStyle = '#bfe9ff'; g.font = 'bold 30px Arial, sans-serif';
  g.fillText('PALATE', 200, 580);
  // right: forehead with red pain star
  g.fillStyle = '#ff8a80';
  g.beginPath(); g.arc(568, 400, 90, 0, 7); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#ff3b30';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, r1 = 55, r2 = 22;
    g.beginPath();
    g.moveTo(568 + Math.cos(a) * r1, 400 + Math.sin(a) * r1);
    g.lineTo(568 + Math.cos(a + Math.PI / 8) * r2, 400 + Math.sin(a + Math.PI / 8) * r2);
    g.lineTo(568 + Math.cos(a + Math.PI / 4) * r1, 400 + Math.sin(a + Math.PI / 4) * r1);
    g.closePath(); g.fill();
  }
  g.fillStyle = '#ff3b30'; g.font = '900 44px Arial Black, sans-serif';
  g.fillText('OUCH!', 568, 540);
  g.fillStyle = '#ffb3ab'; g.font = 'bold 30px Arial, sans-serif';
  g.fillText('FOREHEAD', 568, 580);
  // big crossed arrow from cold to pain
  g.strokeStyle = '#ffd60a'; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(300, 400); g.lineTo(460, 400); g.stroke();
  g.beginPath(); g.moveTo(430, 372); g.lineTo(468, 400); g.lineTo(430, 428); g.stroke();
  // footer
  g.fillStyle = '#ffffff'; g.font = 'bold 30px monospace';
  g.fillText('THE BRAIN MIXES UP THE ADDRESS', 384, 700);
  g.fillStyle = '#ffd60a'; g.font = 'bold 28px Arial, sans-serif';
  g.fillText('SAME NERVE, WRONG SPOT', 384, 760);
  g.fillStyle = '#ffffff'; g.font = 'bold 26px Arial, sans-serif';
  g.fillText('NOT DANGEROUS - JUST CONFUSED', 384, 860);
  return c;
}

// ---------- Sharks: ocean boards & sand ----------
export function sandTex(seed = 7) {
  const [c, g] = cv(512, 512);
  const r = rng(seed);
  g.fillStyle = '#d9c39a'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const v = r();
    g.fillStyle = v < 0.5 ? 'rgba(120,90,50,0.25)' : 'rgba(255,240,200,0.30)';
    g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 2.5, 0, 7); g.fill();
  }
  for (let i = 0; i < 8; i++) { // a few tiny shells
    g.fillStyle = '#f8f2e4'; g.beginPath();
    g.arc(r() * 512, r() * 512, 6 + r() * 6, 0, 7); g.fill();
  }
  return c;
}

export function foodChain() {
  const [c, g] = cv(768, 1024);
  g.fillStyle = '#184e82'; g.fillRect(0, 0, 768, 1024);
  g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(28, 28, 712, 968);
  g.fillStyle = '#f5c418'; g.fillRect(48, 52, 672, 110);
  g.strokeStyle = '#241726'; g.lineWidth = 6; g.strokeRect(48, 52, 672, 110);
  g.fillStyle = '#241726'; g.font = '900 52px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('OCEAN FOOD CHAIN', 384, 108);
  const rows = [
    ['SHARKS', '#e05a47', 620], ['RAYS', '#f08a2c', 500],
    ['SMALL FISH', '#4dd0e1', 380], ['SCALLOPS', '#e8d5a8', 260],
  ];
  let y = 240;
  for (const [label, col, w] of rows) {
    g.fillStyle = col; g.fillRect(384 - w / 2, y, w, 110);
    g.strokeStyle = '#241726'; g.lineWidth = 6; g.strokeRect(384 - w / 2, y, w, 110);
    g.fillStyle = '#241726'; g.font = '900 44px Arial Black, sans-serif';
    g.fillText(label, 384, y + 56);
    y += 150;
  }
  g.fillStyle = '#ffffff'; g.font = '900 34px Arial Black, sans-serif';
  g.fillText('THE TOP CONTROLS', 384, 880);
  g.fillStyle = '#ffd60a'; g.font = '900 34px Arial Black, sans-serif';
  g.fillText('EVERYTHING BELOW', 384, 930);
  return c;
}

export function coastMap() {
  const [c, g] = cv(768, 1024);
  g.fillStyle = '#1e7cc9'; g.fillRect(0, 0, 768, 1024);
  g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(28, 28, 712, 968);
  g.fillStyle = '#f5c418'; g.fillRect(48, 52, 672, 110);
  g.strokeStyle = '#241726'; g.lineWidth = 6; g.strokeRect(48, 52, 672, 110);
  g.fillStyle = '#241726'; g.font = '900 52px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('US EAST COAST', 384, 108);
  // simplified coastline blob (land on the left)
  g.fillStyle = '#e8d5a8';
  g.beginPath();
  g.moveTo(120, 220); g.lineTo(300, 220); g.lineTo(340, 380); g.lineTo(300, 520);
  g.lineTo(330, 660); g.lineTo(260, 800); g.lineTo(140, 860); g.lineTo(90, 600); g.lineTo(110, 380);
  g.closePath(); g.fill();
  g.strokeStyle = '#241726'; g.lineWidth = 5; g.stroke();
  // red X: sharks decline
  g.strokeStyle = '#ff3b30'; g.lineWidth = 14; g.lineCap = 'round';
  g.beginPath(); g.moveTo(210, 280); g.lineTo(290, 360); g.moveTo(290, 280); g.lineTo(210, 360); g.stroke();
  g.fillStyle = '#ffffff'; g.font = '900 34px Arial Black, sans-serif'; g.textAlign = 'left';
  g.fillText('SHARKS', 400, 300); g.fillText('DECLINE', 400, 340);
  // rays burst
  g.fillStyle = '#ffd60a'; g.beginPath(); g.arc(500, 560, 90, 0, 7); g.fill();
  g.strokeStyle = '#241726'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#241726'; g.font = '900 30px Arial Black, sans-serif'; g.textAlign = 'center';
  g.fillText('RAYS', 500, 540); g.fillText('40 MILLION', 500, 580);
  // scallops gone
  g.fillStyle = '#ffffff'; g.font = '900 34px Arial Black, sans-serif'; g.textAlign = 'left';
  g.fillText('SCALLOPS', 400, 780); g.fillText('GONE', 400, 820);
  g.strokeStyle = '#ff3b30'; g.lineWidth = 8;
  g.beginPath(); g.moveTo(390, 800); g.lineTo(620, 760); g.stroke();
  g.fillStyle = '#ffffff'; g.font = 'bold 28px Arial, sans-serif'; g.textAlign = 'center';
  g.fillText('ONE CENTURY-OLD FISHERY', 384, 930);
  g.fillText('COLLAPSED', 384, 962);
  return c;
}

export function chart71() {
  const [c, g] = cv(768, 1024);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 768, 1024);
  g.strokeStyle = '#241726'; g.lineWidth = 10; g.strokeRect(28, 28, 712, 968);
  g.fillStyle = '#241726'; g.font = '900 48px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('OCEANIC SHARKS', 384, 100);
  g.fillText('& RAYS', 384, 160);
  g.fillStyle = '#ff3b30'; g.font = '900 200px Arial Black, sans-serif';
  g.fillText('-71%', 384, 380);
  // falling arrow 1970 -> 2018
  g.strokeStyle = '#ff3b30'; g.lineWidth = 22; g.lineCap = 'round';
  g.beginPath(); g.moveTo(140, 560); g.lineTo(600, 760); g.stroke();
  g.beginPath(); g.moveTo(520, 720); g.lineTo(610, 766); g.lineTo(520, 800); g.stroke();
  g.fillStyle = '#241726'; g.font = '900 44px Arial Black, sans-serif';
  g.fillText('1970', 170, 540);
  g.fillText('2018', 580, 840);
  g.fillStyle = '#5a6b7a'; g.font = 'bold 32px Arial, sans-serif';
  g.fillText('ALREADY GONE', 384, 920);
  return c;
}

export function declineChart() {
  const [c, g] = cv(768, 1024);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 768, 1024);
  g.strokeStyle = '#241726'; g.lineWidth = 10; g.strokeRect(28, 28, 712, 968);
  g.fillStyle = '#241726'; g.font = '900 48px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('BIG SHARKS', 384, 100);
  g.fillText('DECLINED', 384, 160);
  const bars = [560, 460, 360, 260, 160];
  const labels = ['1980', '1990', '2000', '2010', '2020'];
  bars.forEach((h, i) => {
    const x = 110 + i * 118;
    g.fillStyle = '#2f6fb2'; g.fillRect(x, 800 - h, 88, h);
    g.strokeStyle = '#241726'; g.lineWidth = 5; g.strokeRect(x, 800 - h, 88, h);
    g.fillStyle = '#241726'; g.font = 'bold 28px Arial, sans-serif';
    g.fillText(labels[i], x + 44, 840);
  });
  g.strokeStyle = '#ff3b30'; g.lineWidth = 16; g.lineCap = 'round';
  g.beginPath(); g.moveTo(150, 300); g.lineTo(640, 640); g.stroke();
  g.beginPath(); g.moveTo(580, 600); g.lineTo(650, 648); g.lineTo(560, 660); g.stroke();
  g.fillStyle = '#ff3b30'; g.font = '900 36px Arial Black, sans-serif';
  g.fillText('FEWER SHARKS', 384, 900);
  g.fillText('MORE RAYS', 384, 940);
  return c;
}
