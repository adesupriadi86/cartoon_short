// Painted Canvas2D textures for the 3D Shopping Mall & Escalator world. All deterministic.
import * as THREE from './lib/three.module.js';

export const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
export const tex = (c, rx = 1, ry = 1) => {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

/** Bright warm-cream mall terrazzo floor tiles */
export function mallTile(seed = 1) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#efe6d5'; g.fillRect(0, 0, 512, 512);
  const sz = 128;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const x = col * sz, y = row * sz, alt = (row + col) % 2;
    g.fillStyle = alt ? '#f5ede0' : '#e6dac5';
    g.fillRect(x + 3, y + 3, sz - 6, sz - 6);
    // terrazzo flecks
    for (let k = 0; k < 22; k++) {
      g.fillStyle = ['#d4c2a6', '#c5d2dc', '#e2b89b', '#ffffff'][k % 4];
      g.beginPath(); g.ellipse(x + 8 + r() * (sz - 16), y + 8 + r() * (sz - 16), 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, 7); g.fill();
    }
    g.strokeStyle = '#c4b49c'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, sz - 3, sz - 3);
  }
  return c;
}

/** Ribbed silver-steel escalator tread with bright safety-yellow border stripes */
export function stepMetal(seed = 2) {
  const [c, g] = cv(512, 256), r = rng(seed);
  g.fillStyle = '#b8c3ce'; g.fillRect(0, 0, 512, 256);
  // metallic grooves running along travel direction
  for (let x = 0; x < 512; x += 14) {
    g.fillStyle = '#737f8c'; g.fillRect(x, 0, 5, 256);
    g.fillStyle = '#dce4ec'; g.fillRect(x + 5, 0, 4, 256);
  }
  // subtle brushed metallic sheen
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`;
    g.fillRect(0, r() * 256, 512, 3 + r() * 6);
  }
  // bright safety-yellow borders on left, right, and front edge
  g.fillStyle = '#f5c418';
  g.fillRect(0, 0, 42, 256);
  g.fillRect(470, 0, 42, 256);
  g.fillRect(0, 0, 512, 24);
  // crisp ink trim inside yellow border
  g.fillStyle = '#241726';
  g.fillRect(42, 0, 5, 256);
  g.fillRect(465, 0, 5, 256);
  g.fillRect(0, 24, 512, 4);
  return c;
}

/** Brushed stainless steel stationary skirt panel */
export function skirtMetal(seed = 3) {
  const [c, g] = cv(512, 256), r = rng(seed);
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#c8d2dc'); gr.addColorStop(0.5, '#9aa6b4'); gr.addColorStop(1, '#798594');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `rgba(255,255,255,${0.08 + r() * 0.14})`;
    g.lineWidth = 1 + r() * 2;
    const y = r() * 256;
    g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke();
  }
  // vertical panel seams
  g.fillStyle = '#38404c';
  g.fillRect(0, 0, 6, 256); g.fillRect(256, 0, 4, 256);
  return c;
}

/** Dense dark-charcoal nylon bristle brush texture */
export function bristleTex(seed = 4) {
  const [c, g] = cv(512, 128), r = rng(seed);
  g.fillStyle = '#22242c'; g.fillRect(0, 0, 512, 128);
  for (let x = 0; x < 512; x += 3) {
    const l = 16 + r() * 20;
    g.strokeStyle = hsl(225, 14, l);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + (r() - 0.5) * 5, 128);
    g.stroke();
  }
  // crisp highlight tips on bristles so they read clearly in 3D
  for (let x = 2; x < 512; x += 7) {
    g.fillStyle = '#5a6275';
    g.fillRect(x, 108, 3, 20);
  }
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

/** Mall wall plaster with warm architectural trim */
export function mallWall(seed = 5, base = '#f4efe6', accent = '#d9cbb6') {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 50; i++) {
    g.fillStyle = `rgba(180,165,145,${0.05 + r() * 0.08})`;
    g.fillRect(r() * 512, r() * 512, 30 + r() * 60, 20 + r() * 40);
  }
  // architectural dado rail & baseboard
  g.fillStyle = accent; g.fillRect(0, 390, 512, 18);
  g.fillStyle = '#8b7b68'; g.fillRect(0, 480, 512, 32);
  return c;
}

/** Colorful mall storefront facade (diegetic, non-mirrored) */
export function shopFront(title = 'SNEAKERS', bg = '#2b5d8a', trim = '#f2b830') {
  const [c, g] = cv(512, 384);
  g.fillStyle = bg; g.fillRect(0, 0, 512, 384);
  // shop display window
  const gr = g.createLinearGradient(0, 120, 0, 360);
  gr.addColorStop(0, '#9bd6f5'); gr.addColorStop(1, '#5d9ec4');
  g.fillStyle = gr; g.fillRect(34, 126, 444, 232);
  // window reflection diagonal streaks
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath(); g.moveTo(80, 126); g.lineTo(140, 126); g.lineTo(60, 358); g.lineTo(34, 358); g.fill();
  g.beginPath(); g.moveTo(260, 126); g.lineTo(300, 126); g.lineTo(200, 358); g.lineTo(160, 358); g.fill();
  g.strokeStyle = '#241726'; g.lineWidth = 8; g.strokeRect(34, 126, 444, 232);
  // awning / header banner
  g.fillStyle = trim; g.fillRect(24, 24, 464, 82);
  g.strokeStyle = '#241726'; g.lineWidth = 6; g.strokeRect(24, 24, 464, 82);
  g.fillStyle = '#241726'; g.font = '900 48px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(title, 256, 67);
  return c;
}

/** Diegetic Safety Code Blueprint Poster for Shot 11 ("SAFETY CODE: SKIRT DEFLECTOR") */
export function safetyCodeBoard() {
  const [c, g] = cv(768, 1024);
  // crisp blueprint blue background
  g.fillStyle = '#184e82'; g.fillRect(0, 0, 768, 1024);
  // blueprint grid
  g.strokeStyle = 'rgba(140,210,255,0.22)'; g.lineWidth = 2;
  for (let x = 0; x <= 768; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  for (let y = 0; y <= 1024; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(768, y); g.stroke(); }
  // bold white outer border
  g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(28, 28, 712, 968);
  // header bar
  g.fillStyle = '#f5c418'; g.fillRect(48, 52, 672, 118);
  g.strokeStyle = '#241726'; g.lineWidth = 6; g.strokeRect(48, 52, 672, 118);
  g.fillStyle = '#241726'; g.font = '900 58px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('SAFETY CODE', 384, 114);
  // subheading
  g.fillStyle = '#ffffff'; g.font = '900 46px Arial Black, sans-serif';
  g.fillText('SKIRT DEFLECTOR', 384, 232);
  // clean cross-section schematic diagram
  // stationary wall on left
  g.fillStyle = '#8fa3b8'; g.fillRect(96, 310, 110, 420);
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(96, 310, 110, 420);
  // moving step on right
  g.fillStyle = '#c8d6e5'; g.fillRect(268, 500, 390, 160);
  g.fillStyle = '#f5c418'; g.fillRect(268, 500, 40, 160);
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(268, 500, 390, 160);
  // red danger gap highlight
  g.fillStyle = '#ff3b30'; g.fillRect(210, 500, 54, 160);
  // brush deflector protruding from wall above gap
  g.fillStyle = '#241726'; g.fillRect(206, 400, 150, 54);
  g.strokeStyle = '#f5c418'; g.lineWidth = 5; g.strokeRect(206, 400, 150, 54);
  for (let y = 408; y < 450; y += 9) {
    g.strokeStyle = '#d8e4f2'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(212, y); g.lineTo(350, y); g.stroke();
  }
  // bold green SAFE arrow pushing foot away
  g.strokeStyle = '#4cd964'; g.lineWidth = 14; g.lineCap = 'round';
  g.beginPath(); g.moveTo(395, 427); g.lineTo(590, 427); g.stroke();
  g.beginPath(); g.moveTo(548, 392); g.lineTo(596, 427); g.lineTo(548, 462); g.stroke();
  // labels
  g.fillStyle = '#ffd60a'; g.font = 'bold 34px Arial, sans-serif'; g.textAlign = 'center';
  g.fillText('DEFLECTS FEET AWAY', 384, 800);
  g.fillStyle = '#9bd6ff'; g.font = 'bold 30px Arial, sans-serif';
  g.fillText('FROM SIDE GAP', 384, 855);
  // ASME / EN badge
  g.fillStyle = '#ffffff'; g.font = 'bold 28px monospace';
  g.fillText('CODE SPEC // A17.1', 384, 935);
  return c;
}

/** Mechanical cutaway wall sign */
export function warnLabel(text = 'DANGER: GAP') {
  const [c, g] = cv(512, 160);
  g.fillStyle = '#ff3b30'; g.fillRect(0, 0, 512, 160);
  g.strokeStyle = '#f5c418'; g.lineWidth = 14; g.strokeRect(10, 10, 492, 140);
  g.fillStyle = '#ffffff'; g.font = '900 48px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 84);
  return c;
}

export function radial(col = '0,0,0', a = 0.55) {
  const [c, g] = cv(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.55, `rgba(${col},${a * 0.6})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
}
