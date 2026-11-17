// TOCATA SANTIAGO — Platanus Hack 26 Arcade
// Beat 'em up de músicos ambulantes. Todo el arte y el sonido se generan con código.

const W = 800, H = 600, Z = 4 / 3; // Z: escala de personajes (pixel de 4 px)

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u'], P1_2: ['i'], P1_3: ['o'],
  P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r'], P2_2: ['t'], P2_3: ['y'],
  P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};
const KEY_TO_ARCADE = {};
for (const [code, keys] of Object.entries(CABINET_KEYS))
  for (const k of keys) KEY_TO_ARCADE[k.length === 1 ? k.toLowerCase() : k] = code;

const held = Object.create(null);
let pressed = Object.create(null);
window.addEventListener('keydown', (e) => {
  const c = KEY_TO_ARCADE[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (c) { if (!held[c]) pressed[c] = 1; held[c] = true; }
});
window.addEventListener('keyup', (e) => {
  const c = KEY_TO_ARCADE[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (c) held[c] = false;
});

function getStorage() {
  if (window.platanusArcadeStorage) return window.platanusArcadeStorage;
  return {
    async get(k) {
      try {
        const r = window.localStorage.getItem(k);
        return r === null ? { found: false, value: null } : { found: true, value: JSON.parse(r) };
      } catch { return { found: false, value: null }; }
    },
    async set(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
}

// ---------- Datos ----------
const HERO = [
  { n: 'RAPERO', w: 'MICRÓFONO', sp: 'FREESTYLE', d: 'rápido y liviano', spd: 215, dmg: 2, cd: 200, rch: 66, c: '#ff7a4c' },
  { n: 'METALERO', w: 'GUITARRA', sp: 'RIFF INFERNAL', d: 'lento, pega fuerte', spd: 165, dmg: 4, cd: 400, rch: 88, c: '#c9c9dd' },
  { n: 'ROMÁNTICO', w: 'MICRÓFONO', sp: 'SERENATA', d: 'fan de Juan Gabriel', spd: 190, dmg: 3, cd: 290, rch: 68, c: '#ff6ec7' },
  { n: 'ANDINO', w: 'ZAMPOÑA', sp: 'VIENTO ANDINO', d: 'ataca a distancia', spd: 195, dmg: 2, cd: 330, rch: 0, c: '#5fe08a' },
];
// piel, pelo/gorro, torso, pantalón, zapato
const LK = [
  ['#c98a5e', '#d22', '#2b2b38', '#3b4a6b', '#fff'],
  ['#e0b08a', '#111', '#1b1b22', '#15151a', '#444'],
  ['#c98a5e', '#111', '#c2185b', '#16161c', '#fff'],
  ['#b5764a', '#c0392b', '#b8323a', '#2b2b2b', '#6b4423'],
  ['#c98a5e', '#2a6', '#f2c500', '#445', '#222'],
  ['#b5764a', '#27c', '#eee', '#357', '#222'],
  ['#e0b08a', '#421', '#e88', '#536', '#222'],
  ['#c98a5e', '#1f2a44', '#7db3e3', '#1f2a44', '#111'],
  ['#c98a5e', '#a11', '#33203a', '#33203a', '#111'],
];
const EN = {
  c: { k: 4, hp: 5, spd: 125, dmg: 6, rng: 52, say: '¡CHICLE A CIEN!' },
  a: { k: 5, hp: 6, spd: 95, dmg: 8, rng: 240, sh: 1, say: '¡AGÜITA A LUCA!' },
  d: { k: 6, hp: 10, spd: 85, dmg: 10, rng: 58, say: '¡DULCES, LLEVE!' },
  g: { k: 7, hp: 16, spd: 105, dmg: 14, rng: 62, say: '¡AQUÍ NO SE CANTA!' },
  B: { k: 8, hp: 110, spd: 95, dmg: 18, rng: 90, sc: 1.5, say: '¡DESALOJEN!' },
};
const ST = [
  { n: 'LA ALAMEDA', b: 'b0', f: 'f0', p: 1, a: 0, w: ['cc', 'ccac', 'cdcac'] },
  { n: 'ARRIBA DE LA MICRO', b: 'b0', f: 'f1', a: 260, w: ['cac', 'ccda', 'dacad'] },
  { n: 'AFUERA DEL SÚPER', b: 'b0', f: 'f2', a: 0, w: ['ddc', 'cadag', 'ddcaga'] },
  { n: 'ESTACIÓN LOS PLÁTANOS', b: 'b4', f: 'f3', a: 0, w: ['gcc', 'gaga', 'ggdac'] },
  { n: 'DENTRO DEL METRO', b: 'b4', f: 'f4', a: 700, w: ['ggc', 'gcaga', 'Bgga'] },
];
const MEL = [
  [0, , 3, 5, 7, , 7, 5, 3, , 0, 3, 5, , 3, , 7, , 10, 12, 10, , 7, 5, 7, , 5, 3, 0, , , ],
  [7, 7, 10, 7, 12, , 10, 7, 5, 5, 7, 5, 3, , 0, , 7, 7, 10, 7, 12, , 15, 12, 10, , 7, 5, 7, , , ],
];
const WAVE = ['square', 'sawtooth', 'triangle', 'sine'];

let S, bgB, bgF, bgP, bus, hudG, noiseBuf;
const G = { st: '', ui: [], hud: [], P: [], E: [], S: [], I: [], hs: [], score: 0, mt: 0, ms: 0, au: 0 };

// ---------- Arte procedural ----------
const R = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
// o = grosor del contorno oscuro (look arcade de los 90): dibuja en un lienzo aparte y lo rodea
function tex(k, w, h, fn, o) {
  const t = S.textures.createCanvas(k, w, h), x = t.context;
  if (o) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const y = c.getContext('2d'); y.translate(0, o); fn(y);
    [[-o, 0], [o, 0], [0, -o], [0, o]].forEach(([a, b]) => x.drawImage(c, a, b));
    x.globalCompositeOperation = 'source-in'; R(x, '#1c0b10', 0, 0, w, h);
    x.globalCompositeOperation = 'source-over'; x.drawImage(c, 0, 0);
  } else fn(x);
  t.refresh();
}
function txt(x, s, a, b, z, c) { x.font = 'bold ' + z + 'px monospace'; x.textAlign = 'center'; x.fillStyle = c || '#fff'; x.fillText(s, a, b); }

// oscurece (f<1) o aclara (f>1) un color '#rgb' o '#rrggbb'
function dk(c, f) {
  if (c.length == 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  return '#' + [1, 3, 5].map((i) => Math.min(255, parseInt(c.substr(i, 2), 16) * f | 0).toString(16).padStart(2, '0')).join('');
}
// cuadros: 0 quieto · 1 y 2 paso · 3 golpe · 4 dolor · 5 carga · 6 salto
function dude(x, k, f) {
  const [sk, hr, tp, pn, sh] = LK[k], A = f == 3, B = f == 5, J = f == 6, o = f == 4 ? -1 : 0;
  // bloque con sombreado de dibujo animado: lado de atrás y base más oscuros, borde de arriba con brillo
  const q = (a, b, w, h, c) => {
    const X = (a + 4) * 3, Y = b * 3; R(x, c, X, Y, w * 3, h * 3);
    if (c.length > 5 || c.length == 4 && c != '#000') {
      if (w > 2) R(x, dk(c, 0.72), X, Y, 3, h * 3);
      if (h > 2) R(x, dk(c, 0.8), X, Y + h * 3 - 3, w * 3, 3);
      if (h > 3 && w > 2) R(x, dk(c, 1.25), X + 3, Y, w * 3 - 3, 3);
    }
  };
  const u = (a, b, w, h, c) => q(a + o, b, w, h, c);
  // piernas
  if (J) { q(4, 16, 3, 4, pn); q(3, 20, 4, 2, sh); q(9, 16, 3, 3, pn); q(10, 18, 4, 2, sh); }
  else if (f == 1 || A) { q(3, 16, 3, 6, pn); q(2, 22, 4, 2, sh); q(9, 16, 3, 6, pn); q(9, 22, 4, 2, sh); }
  else if (f == 2) { q(5, 16, 3, 6, pn); q(5, 22, 4, 2, sh); q(7, 16, 3, 5, pn); q(7, 21, 4, 2, sh); }
  else { q(4, 16, 3, 6, pn); q(4, 22, 4, 2, sh); q(8, 16, 3, 6, pn); q(8, 22, 4, 2, sh); }
  // brazo de atrás, torso, cinturón, cuello y cabeza
  u(3, 9, 2, 6, dk(tp, 0.8)); u(4, 8, 8, 8, tp); u(4, 15, 8, 1, dk(pn, 0.6));
  u(7, 7, 3, 1, dk(sk, 0.8)); u(5, 2, 6, 6, sk); u(11, 4, 1, 1, sk);
  // ojo con blanco y pupila; cerrado si le pegan
  if (f == 4) u(8, 4, 2, 1, '#111'); else { u(8, 4, 1, 1, '#fff'); u(9, 4, 1, 1, '#111'); u(8, 3, 2, 1, '#3a2414'); }
  u(9, 6, A || f == 4 ? 2 : 1, 1, A || f == 4 ? '#822' : dk(sk, 0.7));
  if (k == 0) { // rapero: polerón ancho, gorra al revés, lentes oscuros, cadena
    u(3, 8, 10, 9, tp); u(3, 6, 3, 3, dk(tp, 0.85)); u(6, 9, 4, 1, '#fc3'); u(7, 10, 2, 2, '#fc3');
    u(4, 1, 7, 2, hr); u(1, 2, 4, 1, dk(hr, 0.6)); u(6, 1, 2, 1, '#fff'); u(8, 4, 3, 1, '#111'); u(10, 4, 1, 1, '#6af');
  }
  if (k == 1) { // metalero: melena, barba, polera con calavera, muñequera
    u(4, 1, 7, 2, hr); u(3, 2, 3, 10, hr); u(5, 2, 1, 3, hr); u(8, 6, 3, 2, '#1a1a1a');
    u(6, 8, 5, 2, '#ddd'); u(7, 10, 3, 1, '#ddd'); u(7, 8, 1, 1, '#111'); u(9, 8, 1, 1, '#111');
  }
  if (k == 2) { // romántico: jopo, patillas, bigote, chaqueta brillante con solapas
    u(4, 0, 8, 3, hr); u(10, 0, 2, 2, hr); u(5, 3, 1, 3, hr); u(9, 5, 2, 1, '#111');
    u(7, 8, 2, 7, '#fff'); u(6, 8, 1, 4, dk(tp, 0.65)); u(9, 8, 1, 4, dk(tp, 0.65));
    u(5, 10, 1, 1, '#fd6'); u(10, 12, 1, 1, '#fd6'); u(5, 14, 1, 1, '#fd6'); u(10, 9, 1, 1, '#fd6');
  }
  if (k == 3) { // andino: poncho a rayas, chullo con orejeras y pompón
    u(2, 8, 12, 7, tp); u(2, 10, 12, 1, '#f2c500'); u(2, 12, 12, 1, '#2a8'); u(2, 14, 12, 1, '#fff');
    u(4, 0, 7, 3, hr); u(4, 2, 7, 1, '#f2c500'); u(5, 3, 2, 4, hr); u(5, 7, 1, 2, '#f2c500'); u(6, -1, 3, 1, '#f2c500'); u(7, -1, 1, 1, '#fff');
  }
  if (k == 4) { u(4, 1, 7, 2, hr); u(10, 2, 3, 1, hr); u(8, 6, 3, 1, dk(sk, 0.8)); } // chiclero
  if (k == 5) { u(3, 2, 9, 1, hr); u(4, 0, 7, 2, hr); u(4, 9, 8, 6, '#eee'); } // agüita: sombrero de pescador
  if (k == 6) { u(4, 1, 7, 2, hr); u(2, 1, 3, 3, hr); u(4, 3, 1, 4, hr); u(6, 6, 1, 1, '#fd4'); u(5, 10, 6, 6, '#fff'); u(5, 10, 6, 1, '#f7a'); } // señora de los dulces
  if (k == 7) { // guardia: gorra con placa, lentes, chaleco reflectante
    u(4, 1, 7, 2, hr); u(10, 2, 3, 1, '#000'); u(6, 1, 1, 1, '#fc3'); u(8, 4, 3, 1, '#111');
    u(4, 9, 8, 5, '#c6e00a'); u(4, 11, 8, 1, '#ccc');
  }
  if (k == 8) { // inspector jefe: quepis con galón, bigotazo, terno, corbata
    u(3, 0, 9, 2, hr); u(3, 2, 9, 1, '#fc3'); u(10, 3, 3, 1, '#000'); u(8, 5, 4, 1, '#eee');
    u(7, 8, 2, 2, '#fff'); u(7, 10, 1, 4, '#d22'); u(5, 12, 1, 1, '#fc3'); u(10, 12, 1, 1, '#fc3');
  }
  // brazo de adelante según el cuadro
  if (A && k == 3) u(10, 8, 3, 2, tp);
  else if (A) { u(10, 9, 5, 2, tp); u(15, 9, 1, 2, sk); }
  else if (B) { u(1, 8, 3, 2, tp); u(0, 8, 1, 2, sk); }
  else if (J) { u(9, 5, 2, 4, tp); u(9, 4, 2, 1, sk); }
  else { u(9, 9, 2, 5, tp); u(9, 14, 2, 1, sk); }
  // instrumentos y objetos
  if (k == 0 || k == 2) {
    const m = k ? '#fd6' : '#bbb';
    if (A) { u(16, 8, 3, 1, '#333'); u(19, 7, 2, 3, m); } else if (!B && !J) { u(11, 10, 1, 4, '#333'); u(10, 8, 3, 2, m); }
  }
  if (k == 1) {
    if (A) { u(16, 9, 2, 1, '#853'); u(17, 6, 4, 7, '#c22'); u(18, 8, 2, 3, '#111'); }
    else { u(4, 11, 5, 5, '#c22'); u(5, 12, 2, 2, '#111'); u(9, 12, 6, 1, '#853'); u(15, 11, 2, 3, '#222'); }
    u(9, 13, 2, 1, '#888');
  }
  if (k == 3) {
    const a = A ? 11 : 10, b = A ? 5 : 10;
    u(a, b, 5, 4, '#d9b26a'); u(a + 1, b, 1, 4, '#a57c3a'); u(a + 3, b, 1, 4, '#a57c3a');
  }
  if (k == 4) { u(9, 12, 6, 2, '#eee'); u(10, 11, 1, 1, '#f4a'); u(12, 11, 1, 1, '#4cf'); u(14, 11, 1, 1, '#7d4'); }
  if (k == 5) { u(9, 12, 5, 5, '#27c'); u(9, 12, 5, 1, '#fff'); if (A) u(16, 7, 1, 3, '#8df'); }
  if (k == 6) { u(9, 12, 6, 3, '#a63'); u(10, 11, 1, 1, '#f44'); u(12, 11, 1, 1, '#fd4'); u(14, 11, 1, 1, '#4c8'); }
  if (k == 7) { if (A) u(16, 9, 5, 1, '#111'); else u(11, 12, 1, 5, '#111'); }
  if (k == 8 && !A) { u(10, 11, 3, 4, '#a63'); u(10, 11, 3, 3, '#fff'); }
}

function banana(x, c) {
  x.lineCap = 'round'; x.strokeStyle = '#6b4a12'; x.lineWidth = 9;
  x.beginPath(); x.arc(14, 0, 15, 0.5, 2.6); x.stroke();
  x.strokeStyle = c; x.lineWidth = 6; x.beginPath(); x.arc(14, 0, 15, 0.6, 2.5); x.stroke();
}

function art() {
  for (let k = 0; k < 9; k++) for (let f = 0; f < 7; f++) tex('d' + k + f, 78, 78, (x) => dude(x, k, f), 3);
  tex('nt', 18, 22, (x) => { R(x, '#fff', 11, 0, 3, 16); R(x, '#fff', 11, 0, 7, 4); x.fillStyle = '#fff'; x.beginPath(); x.arc(8, 16, 6, 0, 7); x.fill(); });
  tex('bt', 22, 10, (x) => { R(x, '#8df', 4, 1, 16, 8); R(x, '#fff', 0, 3, 4, 4); R(x, '#27c', 9, 1, 5, 8); });
  tex('wv', 30, 50, (x) => { x.strokeStyle = '#ffe14d'; x.lineWidth = 4; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(-8 + i * 9, 25, 20, -1, 1); x.stroke(); } });
  tex('cn', 20, 20, (x) => { x.translate(2, 0); x.fillStyle = '#b8860b'; x.beginPath(); x.arc(8, 8, 8, 0, 7); x.fill(); x.fillStyle = '#ffd24a'; x.beginPath(); x.arc(8, 8, 6, 0, 7); x.fill(); R(x, '#b8860b', 7, 4, 2, 8); }, 2);
  tex('bn', 34, 24, (x) => { x.translate(2, 0); banana(x, '#f5d400'); }, 2);
  tex('gb', 34, 24, (x) => { x.translate(2, 0); banana(x, '#fff7b0'); }, 2);
  tex('pl', 26, 12, (x) => { R(x, '#f5d400', 2, 6, 22, 4); R(x, '#f5d400', 10, 0, 5, 8); R(x, '#c9a800', 0, 9, 8, 3); R(x, '#c9a800', 18, 9, 8, 3); });

  // micros
  tex('bus0', 240, 100, (x) => {
    R(x, '#f4f1e8', 4, 8, 226, 40); R(x, '#f2c500', 0, 46, 236, 36); R(x, '#222', 0, 80, 236, 4);
    for (let i = 0; i < 5; i++) R(x, '#1c2f4a', 12 + i * 36, 16, 30, 24);
    R(x, '#3a3a3a', 194, 16, 30, 62); R(x, '#d22', 60, 54, 96, 16); txt(x, 'MATADERO', 108, 66, 11);
    x.fillStyle = '#111'; [52, 176].forEach((a) => { x.beginPath(); x.arc(a, 84, 14, 0, 7); x.fill(); });
    x.fillStyle = '#999'; [52, 176].forEach((a) => { x.beginPath(); x.arc(a, 84, 6, 0, 7); x.fill(); });
  });
  tex('bus1', 260, 100, (x) => {
    R(x, '#f5f5f5', 0, 6, 256, 40); R(x, '#d9231f', 0, 44, 256, 38); R(x, '#222', 0, 80, 256, 4);
    for (let i = 0; i < 6; i++) R(x, '#22303f', 8 + i * 41, 12, 36, 28);
    R(x, '#fff', 20, 54, 60, 12); R(x, '#fc3', 200, 10, 50, 10);
    x.fillStyle = '#111'; [50, 200].forEach((a) => { x.beginPath(); x.arc(a, 84, 14, 0, 7); x.fill(); });
    x.fillStyle = '#bbb'; [50, 200].forEach((a) => { x.beginPath(); x.arc(a, 84, 6, 0, 7); x.fill(); });
  });

  // fondo: atardecer, cordillera y skyline
  tex('b0', W, H, (x) => {
    // cielo de tarde santiaguina: azul arriba, rosado y dorado en el horizonte
    const g = x.createLinearGradient(0, 0, 0, 300);
    [['#2f5fb8', 0], ['#6fa0e0', 0.5], ['#f4b8b0', 0.85], ['#ffd8a0', 1]].forEach(([c, s]) => g.addColorStop(s, c));
    R(x, g, 0, 0, W, H);
    x.fillStyle = '#fff1c0'; x.beginPath(); x.arc(700, 236, 26, 0, 7); x.fill();
    for (let i = 0; i < 7; i++) { const a = (i * 151) % 740, b = 30 + (i * 43) % 120, w = 70 + (i * 37) % 90; R(x, '#fff', a, b, w, 12); R(x, '#fff', a + 14, b - 8, w - 34, 10); R(x, '#dfe8f8', a + 6, b + 10, w - 12, 4); }
    // cordillera de los Andes nevada
    const pk = [[0, 300], [80, 170], [170, 235], [260, 140], [380, 245], [470, 160], [600, 250], [700, 180], [800, 300]];
    x.fillStyle = '#9aa8d0'; x.beginPath(); pk.forEach((p) => x.lineTo(p[0] + 40, p[1] + 10)); x.lineTo(840, 400); x.lineTo(0, 400); x.fill();
    x.fillStyle = '#6a7bb0'; x.beginPath(); pk.forEach((p) => x.lineTo(p[0], p[1] + 30)); x.lineTo(800, 400); x.lineTo(0, 400); x.fill();
    x.fillStyle = '#fff';
    [1, 3, 5, 7].forEach((i) => { const p = pk[i]; x.beginPath(); x.moveTo(p[0], p[1] + 30); x.lineTo(p[0] - 30, p[1] + 66); x.lineTo(p[0] - 10, p[1] + 58); x.lineTo(p[0] + 6, p[1] + 68); x.lineTo(p[0] + 30, p[1] + 64); x.fill(); });
    // cerro San Cristóbal con la Virgen
    x.fillStyle = '#3f7a45'; x.beginPath(); x.ellipse(110, 310, 170, 150, 0, 0, 7); x.fill();
    x.fillStyle = '#56994f'; x.beginPath(); x.ellipse(90, 320, 120, 120, 0, 0, 7); x.fill();
    R(x, '#ccc', 102, 156, 16, 8); R(x, '#fff', 106, 124, 8, 32); R(x, '#fff', 105, 116, 10, 9); R(x, '#fff', 98, 132, 24, 4);
    // edificios de colores
    const bc = ['#d9c7a5', '#a9b4c2', '#c98d6a', '#e8e2d0', '#8a97a8'];
    for (let i = 4; i < 16; i++) {
      if (i > 3 && i < 8) continue;
      const h = 50 + (i * 53) % 80, a = i * 50;
      R(x, bc[i % 5], a, 300 - h, 48, h); R(x, '#0002', a + 40, 300 - h, 8, h);
      for (let j = 8; j < h - 6; j += 14) for (let m = 0; m < 3; m++) R(x, (i + j + m) % 4 ? '#3d5a80' : '#ffe39a', a + 6 + m * 12, 300 - h + j, 7, 7);
    }
    // Torre Entel
    R(x, '#c8ccd4', 388, 110, 14, 190); R(x, '#8a919c', 378, 132, 34, 34); R(x, '#aab0ba', 381, 136, 28, 8);
    for (let j = 0; j < 5; j++) R(x, j % 2 ? '#fff' : '#e33', 393, 70 + j * 8, 4, 8);
    // Costanera Center
    x.fillStyle = '#4f80c0'; x.beginPath(); x.moveTo(606, 300); x.lineTo(620, 54); x.lineTo(652, 54); x.lineTo(666, 300); x.fill();
    R(x, '#a8cdf0', 628, 60, 6, 240); R(x, '#36639e', 646, 60, 4, 240);
    for (let j = 0; j < 4; j++) R(x, '#36639e', 618 + j * 10, 40, 3, 16);
    // La Moneda con la bandera
    R(x, '#f2ede0', 210, 256, 150, 44); R(x, '#d8d0bc', 206, 250, 158, 8); R(x, '#d8d0bc', 262, 240, 46, 12);
    for (let i = 0; i < 12; i++) R(x, '#bfb5a0', 216 + i * 12, 264, 4, 30);
    R(x, '#7a5a3a', 275, 278, 20, 22); R(x, '#888', 284, 206, 2, 36);
    R(x, '#fff', 286, 206, 30, 9); R(x, '#d52b1e', 286, 215, 30, 9); R(x, '#0039a6', 286, 206, 10, 9); R(x, '#fff', 290, 209, 3, 3);
  });
  // calle
  tex('f0', W, H, (x) => {
    R(x, '#4b4b52', 0, 300, W, 95);
    for (let i = 0; i < 8; i++) R(x, '#eee', i * 100 + 20, 345, 50, 4);
    txt(x, 'SOLO BUS', 400, 384, 16, '#f2c500');
    R(x, '#c4c4cc', 0, 392, W, 8); R(x, '#9a9aa4', 0, 400, W, 200);
    for (let i = 0; i < W; i += 50) R(x, '#878792', i, 400, 2, 200);
    for (let j = 440; j < H; j += 50) R(x, '#878792', 0, j, W, 2);
  });
  tex('p0', W, H, (x) => {
    R(x, '#555', 70, 285, 190, 10); R(x, '#777', 80, 295, 6, 105); R(x, '#777', 244, 295, 6, 105);
    R(x, 'rgba(160,210,255,.35)', 90, 300, 150, 70); R(x, '#c33', 100, 372, 130, 8);
    R(x, '#777', 275, 270, 5, 130); R(x, '#1d6fd6', 258, 244, 40, 28); txt(x, 'BUS', 278, 263, 14);
    R(x, '#d22', 326, 346, 78, 34); R(x, '#eee', 330, 340, 70, 6); for (let i = 0; i < 6; i++) R(x, i % 2 ? '#fd3' : '#d22', 322 + i * 14, 318, 14, 10);
    R(x, '#999', 324, 328, 3, 18); R(x, '#999', 400, 328, 3, 18); txt(x, 'SOPAIPILLAS', 365, 368, 10);
    x.fillStyle = '#222'; [338, 392].forEach((a) => { x.beginPath(); x.arc(a, 386, 9, 0, 7); x.fill(); });
    R(x, '#444', 420, 170, 6, 230); R(x, '#444', 420, 170, 44, 5); R(x, '#ffe9a0', 452, 175, 16, 6);
    R(x, '#145c36', 510, 280, 150, 14); R(x, '#1f7a4a', 520, 294, 130, 106); R(x, '#fbe7a1', 530, 320, 110, 44);
    txt(x, 'KIOSCO', 585, 312, 14);
    ['#e33', '#39f', '#fc3', '#fff', '#f7a', '#6c6'].forEach((c, i) => R(x, c, 535 + i * 17, 326, 13, 18));
    R(x, '#2a7', 706, 362, 24, 38); R(x, '#185', 703, 358, 30, 6);
  });
  // interior de micro
  tex('f1', W, H, (x) => {
    R(x, '#cfc8b4', 0, 0, W, 400); R(x, '#b3ad9a', 0, 0, W, 72);
    const ad = ['NO HABLAR AL CHOFER', 'PARADA SOLICITADA', 'PAGUE SU PASAJE', 'TOQUE EL TIMBRE'];
    for (let i = 0; i < 4; i++) {
      const a = i * 200;
      x.clearRect(a + 20, 120, 160, 140); R(x, '#6d685a', a + 16, 116, 168, 4); R(x, '#6d685a', a + 16, 260, 168, 4);
      R(x, i % 2 ? '#1d6fd6' : '#d22', a + 22, 20, 156, 34); txt(x, ad[i], a + 100, 42, 12);
      R(x, '#2a5db0', a + 24, 285, 62, 62); R(x, '#234c92', a + 24, 345, 70, 50);
      R(x, '#2a5db0', a + 112, 285, 62, 62); R(x, '#234c92', a + 112, 345, 70, 50);
    }
    R(x, '#f2c500', 0, 92, W, 6);
    for (let i = 0; i < 8; i++) R(x, '#f2c500', 46 + i * 100, 98, 4, 20);
    R(x, '#f2c500', 196, 92, 7, 308); R(x, '#f2c500', 596, 92, 7, 308);
    R(x, '#4b4e57', 0, 400, W, 200); R(x, '#f2c500', 0, 400, W, 5);
    for (let j = 430; j < H; j += 36) R(x, '#42454d', 0, j, W, 3);
  });
  // supermercado
  tex('f2', W, H, (x) => {
    R(x, '#ece6d6', 0, 110, W, 290); R(x, '#1f5fa8', 0, 110, W, 76); R(x, '#ffd100', 0, 186, W, 8);
    txt(x, 'SUPER PLÁTANO', 400, 164, 46, '#ffd100');
    R(x, '#9fd3e6', 300, 230, 200, 170); R(x, '#567', 398, 230, 4, 170); R(x, '#567', 296, 226, 208, 5);
    txt(x, 'ENTRADA', 400, 222, 12, '#345');
    R(x, '#9fd3e6', 40, 220, 220, 120); R(x, '#9fd3e6', 540, 220, 220, 120);
    R(x, '#ffe14d', 56, 236, 94, 64); txt(x, 'OFERTA', 103, 262, 18, '#d22'); txt(x, 'PAN $990', 103, 286, 13, '#222');
    R(x, '#fff', 164, 236, 80, 64); txt(x, 'ABIERTO', 204, 274, 14, '#1a8a3a');
    R(x, '#fff', 556, 236, 188, 64); txt(x, 'PLÁTANOS $990 KG', 650, 274, 16, '#d22');
    x.strokeStyle = '#778'; x.lineWidth = 2;
    for (let i = 0; i < 5; i++) { x.strokeRect(556 + i * 20, 358, 34, 26); R(x, '#333', 560 + i * 20, 390, 6, 6); }
    R(x, '#b98a6a', 0, 400, W, 200);
    for (let i = 0; i < W; i += 40) R(x, '#a67a5c', i, 400, 2, 200);
    for (let j = 440; j < H; j += 40) R(x, '#a67a5c', 0, j, W, 2);
  });
  // estación de metro
  tex('f3', W, H, (x) => {
    R(x, '#e8e4d8', 0, 60, W, 340);
    for (let i = 0; i < W; i += 40) R(x, '#d2cdbf', i, 60, 2, 340);
    for (let j = 60; j < 400; j += 40) R(x, '#d2cdbf', 0, j, W, 2);
    R(x, '#22252b', 0, 0, W, 60);
    for (let i = 0; i < 4; i++) R(x, '#f8f8e0', 40 + i * 200, 42, 120, 8);
    R(x, '#e3001b', 0, 84, W, 36); txt(x, 'LOS PLÁTANOS', 400, 110, 24);
    x.fillStyle = '#fff'; x.beginPath(); x.arc(150, 102, 14, 0, 7); x.fill(); txt(x, '1', 150, 109, 18, '#e3001b');
    R(x, '#1a8a3a', 610, 150, 130, 34); txt(x, 'SALIDA >', 675, 173, 16);
    R(x, '#333', 76, 166, 158, 118); R(x, '#fff', 80, 170, 150, 110);
    ['#e3001b', '#ffc20e', '#7b4a2b', '#1f4e9c', '#00a651', '#7f3f98'].forEach((c, i) => {
      if (i % 2) R(x, c, 100 + i * 18, 178, 4, 94); else R(x, c, 88, 186 + i * 14, 134, 4);
    });
    R(x, '#111', 326, 166, 168, 118); R(x, '#e1ff00', 330, 170, 160, 110);
    txt(x, 'PLATANUS', 410, 214, 22, '#111'); txt(x, 'HACK 26', 410, 240, 22, '#111'); txt(x, '20-22 NOV', 410, 264, 13, '#111');
    R(x, '#888', 560, 350, 170, 10); R(x, '#666', 572, 360, 8, 40); R(x, '#666', 710, 360, 8, 40);
    R(x, '#6f727a', 0, 400, W, 200);
    for (let i = 0; i < W; i += 60) R(x, '#63666e', i, 400, 2, 200);
    R(x, '#f2c500', 0, 556, W, 16);
    for (let i = 0; i < W; i += 14) R(x, '#c9a300', i, 560, 6, 8);
  });
  // vagón (NS-74: crema y asientos naranjos)
  tex('f4', W, H, (x) => {
    R(x, '#f1ecd9', 0, 0, W, 400); R(x, '#d9d3bd', 0, 0, W, 80);
    for (let i = 0; i < 2; i++) {
      const a = i * 400;
      R(x, '#fff', a + 60, 62, 110, 8); R(x, '#fff', a + 260, 62, 110, 8);
      R(x, '#8ec9e8', a + 10, 100, 110, 300); R(x, '#4fa3d1', a + 64, 100, 3, 300);
      x.clearRect(a + 22, 130, 38, 110); x.clearRect(a + 70, 130, 38, 110);
      x.clearRect(a + 150, 130, 220, 120); R(x, '#8a8570', a + 146, 126, 228, 4); R(x, '#8a8570', a + 146, 250, 228, 4);
      R(x, '#e8761e', a + 150, 290, 220, 52); R(x, '#c45f12', a + 150, 342, 220, 52);
      R(x, '#fff', a + 150, 96, 220, 20); R(x, '#e3001b', a + 160, 105, 200, 3);
      for (let j = 0; j < 9; j++) R(x, '#e3001b', a + 162 + j * 24, 102, 6, 9);
      R(x, '#999', a + 134, 86, 6, 314);
    }
    R(x, '#999', 0, 86, W, 5);
    R(x, '#3b3e45', 0, 400, W, 200); R(x, '#f2c500', 0, 400, W, 4);
    for (let i = 0; i < 60; i++) R(x, '#4a4d55', (i * 97) % W, 410 + (i * 53) % 185, 4, 3);
  });
  tex('b4', W, H, (x) => {
    R(x, '#0b0b12', 0, 0, W, H);
    for (let i = 0; i < 8; i++) R(x, '#15151f', i * 100, 0, 5, 400);
    for (let i = 0; i < 4; i++) R(x, '#ffe9a0', i * 200 + 90, 150, 34, 6);
    R(x, '#2a2a33', 0, 184, W, 3); R(x, '#2a2a33', 0, 204, W, 2);
  });
}

// ---------- Sonido ----------
function tone(f, d, ty, v, sl) {
  const c = S.sound.context; if (!c || c.state != 'running') return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
  o.type = ty || 'square'; o.frequency.setValueAtTime(f, t);
  if (sl) o.frequency.exponentialRampToValueAtTime(sl, t + d);
  g.gain.setValueAtTime(v || 0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d);
}
function noise(d, v) {
  const c = S.sound.context; if (!c || c.state != 'running') return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
    const a = noiseBuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource(), g = c.createGain(), t = c.currentTime;
  s.buffer = noiseBuf; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  s.connect(g); g.connect(c.destination); s.start(t); s.stop(t + d);
}
function music(dt) {
  G.mt -= dt; if (G.mt > 0) return;
  const si = G.st == 'play' ? G.si : 0, m = MEL[si % 2], i = G.ms++ % 32, n = m[i];
  G.mt += 0.17 - si * 0.012;
  if (n != null) tone(440 * Math.pow(2, n / 12), 0.16, WAVE[G.P[0] ? G.P[0].h : 3], 0.035);
  if (i % 8 == 0) tone(110 * Math.pow(2, [0, 0, 3, -2][(G.ms >> 3) % 4] / 12), 0.3, 'triangle', 0.09);
  if (i % 4 == 0) tone(95, 0.12, 'sine', 0.12, 40);
  if (i % 4 == 2) noise(0.04, 0.03);
}

// ---------- Utilidades ----------
function T(x, y, s, z, c) {
  return S.add.text(x, y, s, { fontFamily: 'monospace', fontSize: z + 'px', fontStyle: 'bold', color: c || '#fff', stroke: '#000', strokeThickness: 4, align: 'center' }).setOrigin(0.5);
}
// título dorado: serif, degradado amarillo→naranjo→rojo, contorno café y sombra
function TG(x, y, s, z) {
  const t = T(x, y, s, z).setFontFamily('Georgia, serif').setStroke('#2a0e08', Math.max(6, z / 6)).setShadow(4, 5, '#000', 0, true, true);
  const g = t.context.createLinearGradient(0, 0, 0, t.height);
  g.addColorStop(0, '#fff6b0'); g.addColorStop(0.5, '#ffb22e'); g.addColorStop(1, '#d8361a');
  return t.setFill(g);
}
// fondo de tablas de madera para menús
function wood() {
  const g = U(S.add.graphics());
  g.fillStyle(0x3a1c0e, 0.94).fillRect(0, 0, W, H);
  for (let j = 0; j < H; j += 40) g.fillStyle(0x24100a).fillRect(0, j, W, 3).fillStyle(0x4a2814).fillRect(0, j + 3, W, 2);
}
const U = (o) => { G.ui.push(o); return o.setDepth(920); };
function clearUI() { G.ui.forEach((o) => o.destroy()); G.ui = []; }
function ft(x, y, s, c, z) {
  const t = T(x, y, s, z || 14, c).setDepth(900);
  S.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 900, onComplete: () => t.destroy() });
}
const onScr = (e) => Math.abs(e.x - S.cameras.main.scrollX - 400) < 430;
function setBg(i) {
  const s = ST[i];
  bgB.setTexture(s.b); bgF.setTexture(s.f); bgP.setVisible(!!s.p); bus.setVisible(!!s.p);}

// ---------- Pantallas ----------
function toTitle() {
  clearUI(); G.st = 'title'; S.cameras.main.scrollX = 0; setBg(0);
  U(TG(400, 150, 'TOCATA', 116));
  U(T(400, 232, 'S A N T I A G O', 30, '#ffe07a')).setFontFamily('Georgia, serif').setStroke('#5a1650', 8);
  U(S.add.rectangle(400, 280, 420, 28, 0x2a0e08, 0.8));
  U(T(400, 280, 'músicos ambulantes contra la ciudad', 16, '#fff')).setStroke('#2a0e08', 6);
  [0, 1, 2, 3].forEach((i) => U(S.add.image(250 + i * 100, 500, 'd' + i + '0').setOrigin(0.46, 1).setScale(1.5)));
  G.blink = U(T(400, 560, 'PRESIONA START', 22, '#fff'));
  if (G.hs.length) U(T(400, 330, 'MEJORES PROPINAS  ' + G.hs.map((n) => '$' + n).join('  '), 13, '#ffd76a'));
}
function toSelect() {
  clearUI(); G.st = 'sel'; G.sel = [{ h: 0, ok: 0 }, null];
  wood();
  U(TG(400, 56, 'ELIGE TU MÚSICO', 40));
  HERO.forEach((h, i) => {
    const a = 115 + i * 190;
    // cartel de "SE BUSCA" en papel viejo
    U(S.add.rectangle(a + 5, 296, 170, 330, 0, 0.5));
    U(S.add.rectangle(a, 290, 170, 330, 0xe6c48c).setStrokeStyle(4, 0x5a2e12));
    U(S.add.rectangle(a, 224, 140, 150, 0xc99a5e));
    U(T(a, 146, 'SE BUSCA', 20, '#5a2e12').setFontFamily('Georgia, serif').setStroke('#5a2e12', 0));
    U(S.add.image(a, 300, 'd' + i + '0').setOrigin(0.46, 1).setScale(1.85));
    U(T(a, 330, h.n, 18, h.c)); U(T(a, 356, h.d, 11, '#fff'));
    U(T(a, 386, 'ARMA: ' + h.w, 12, '#ffd76a')); U(T(a, 406, 'ESPECIAL', 11, '#fff')); U(T(a, 426, h.sp, 14, '#ffe07a'));
  });
  G.cur = [U(S.add.rectangle(0, 290, 178, 338).setStrokeStyle(4, 0xe1ff00)), U(S.add.rectangle(0, 290, 190, 350).setStrokeStyle(4, 0xff6ec7))];
  G.selT = U(T(400, 500, '', 14));
  U(T(400, 560, 'PALANCA: elegir   BOTÓN 1: confirmar\nBOTÓN 1 golpe · BOTÓN 2 salto · BOTÓN 3 especial', 14, '#fff'));
}
function upSel() {
  for (let i = 0; i < 2; i++) {
    const k = i ? 'P2_' : 'P1_', s = G.sel[i];
    if (!s) { if (pressed.START2 || pressed.P2_1) { G.sel[1] = { h: 1, ok: 0 }; tone(660, 0.1); } continue; }
    if (s.ok) continue;
    if (pressed[k + 'L']) { s.h = (s.h + 3) % 4; tone(330, 0.05); }
    if (pressed[k + 'R']) { s.h = (s.h + 1) % 4; tone(330, 0.05); }
    if (pressed[k + '1'] || pressed[i ? 'START2' : 'START1']) { s.ok = 1; tone(880, 0.15); }
  }
  G.sel.forEach((s, i) => { G.cur[i].setVisible(!!s); if (s) G.cur[i].x = 115 + s.h * 190; });
  G.selT.setText('P1: ' + (G.sel[0].ok ? 'LISTO' : 'eligiendo') + '     P2: ' + (G.sel[1] ? (G.sel[1].ok ? 'LISTO' : 'eligiendo') : 'PRESIONA START 2'));
  if (G.sel.every((s) => !s || s.ok)) startGame();
}
function startGame() {
  clearUI(); G.P = []; G.score = 0; G.st = 'play';
  hudG = S.add.graphics().setScrollFactor(0).setDepth(950);
  G.scT = T(400, 22, '', 18, '#ffd76a').setScrollFactor(0).setDepth(960);
  G.stT = T(400, 44, '', 11, '#ccc').setScrollFactor(0).setDepth(960);
  G.go = T(700, 300, 'SIGUE >>>', 28, '#e1ff00').setScrollFactor(0).setDepth(960);
  G.hud = [hudG, G.scT, G.stT, G.go];
  G.sel.forEach((s, i) => s && mkP(i, s.h));
  startStage(0);
}
function startStage(i) {
  G.si = i; setBg(i);
  const cam = S.cameras.main; cam.scrollX = 0; cam.fadeIn(400);
  [G.E, G.S, G.I].forEach((l) => l.forEach((o) => o.o.forEach((d) => d.destroy())));
  G.E = []; G.S = []; G.I = [];
  G.P.forEach((p, j) => { p.x = 110 + j * 50; p.y = 470 + j * 50; });
  G.wi = 0; G.camMax = 220; G.ph = 'walk'; G.au = 0;
  G.stT.setText('ETAPA ' + (i + 1) + ' · ' + ST[i].n);
  const t = TG(400, 250, 'ETAPA ' + (i + 1) + '\n' + ST[i].n, 36).setScrollFactor(0).setDepth(970);
  S.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 500, onComplete: () => t.destroy() });
}
function end(win) {
  G.st = 'end'; G.t = 1.2;
  [G.P, G.E, G.S, G.I].forEach((l) => l.forEach((o) => o.o.forEach((d) => d.destroy())));
  G.hud.forEach((o) => o.destroy());
  G.P = []; G.E = []; G.S = []; G.I = []; S.cameras.main.scrollX = 0;
  G.hs.push(G.score); G.hs.sort((a, b) => b - a); G.hs = G.hs.slice(0, 5);
  getStorage().set('tocata-hs', G.hs);
  wood();
  U(TG(400, 150, win ? '¡TOCATA COMPLETA!' : 'FIN DE LA TOCATA', 50));
  U(T(400, 215, win ? 'Llegaste a tocar a la Platanus Hack.\nTe pagaron en plátanos.' : 'Te sacaron del vagón. Mañana se toca de nuevo.', 16));
  U(T(400, 300, 'PROPINAS: $' + G.score, 32, '#ffd76a'));
  U(T(400, 390, 'MEJORES\n' + G.hs.map((n, i) => (i + 1) + '.  $' + n).join('\n'), 16, '#fff'));
  U(T(400, 550, 'START PARA VOLVER', 18, '#e6c48c'));
  if (win) [523, 659, 784, 1047].forEach((f, i) => S.time.delayedCall(i * 140, () => tone(f, 0.3, 'triangle', 0.1)));
}

// ---------- Entidades ----------
function mkP(i, h) {
  const p = { i, h, x: S.cameras.main.scrollX + 110 + i * 50, y: 470 + i * 50, z: 0, vz: 0, f: 1, hp: 100, sp: 0, lv: 3, cd: 0, at: 0, hurt: 0, inv: 1.5, dead: 0, rt: 0 };
  p.sh = S.add.ellipse(0, 0, 56, 14, 0, 0.35).setDepth(1);
  p.spr = S.add.image(0, 0, 'd' + h + '0').setOrigin(0.46, 1).setScale(Z);
  p.tag = T(0, 0, 'P' + (i + 1), 12, i ? '#ff6ec7' : '#e1ff00');
  p.nm = T(i ? 780 : 20, 16, 'P' + (i + 1) + ' ' + HERO[h].n, 13, HERO[h].c).setOrigin(i ? 1 : 0, 0.5).setScrollFactor(0).setDepth(960);
  p.o = [p.sh, p.spr, p.tag, p.nm];
  G.P.push(p); return p;
}
function spawn(str) {
  const sx = S.cameras.main.scrollX;
  [...str].forEach((ch, j) => {
    const d = EN[ch], L = j % 2;
    const e = { d, x: sx + (L ? -50 - j * 30 : 850 + j * 30), y: 425 + Math.random() * 140, f: L ? 1 : -1, hp: d.hp, stun: 0, kx: 0, wind: 0, cool: 0.6 + Math.random(), oy: Math.random() * 24 - 12, dead: 0 };
    e.sh = S.add.ellipse(0, 0, 56 * (d.sc || 1), 14, 0, 0.35).setDepth(1);
    e.spr = S.add.image(0, 0, 'd' + d.k + '0').setOrigin(0.46, 1).setScale((d.sc || 1) * Z);
    e.o = [e.sh, e.spr]; G.E.push(e);
    if (ch == 'B') { ft(sx + 400, 220, '¡EL INSPECTOR JEFE!', '#f55', 34); S.cameras.main.shake(400, 0.01); }
  });
}
function shot(x, y, z, vx, dmg, foe, key, pc, l) {
  const spr = S.add.image(x, y - z, key).setFlipX(vx < 0);
  G.S.push({ x, y, z, vx, dmg, foe, pc, l, hit: [], spr, o: [spr] });
}
function drop(x, y, key) {
  const spr = S.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
  G.I.push({ x, y, key, spr, o: [spr], t: 0 });
}
function hitE(e, dmg, dir, p) {
  if (e.dead) return;
  e.hp -= dmg; e.stun = Math.max(e.stun, 0.35); e.kx = dir * (e.d.sc ? 90 : 240); e.wind = 0;
  e.spr.setTintFill(0xffffff); S.time.delayedCall(70, () => e.spr.active && e.spr.clearTint());
  noise(0.08, 0.12); tone(180, 0.08, 'square', 0.05, 70);
  if (p) p.sp = Math.min(100, p.sp + 7);
  G.score += 10;
  if (e.hp <= 0) {
    e.dead = 1; e.sh.destroy(); G.score += e.d.hp * 20;
    S.tweens.add({ targets: e.spr, x: e.spr.x + dir * 140, y: e.spr.y - 50, angle: dir * 100, alpha: 0, duration: 600, onComplete: () => e.spr.destroy() });
    drop(e.x, e.y, 'cn'); if (e.d.hp > 8) drop(e.x + 20, e.y + 6, 'cn');
    const r = Math.random();
    if (r < 0.06 || e.d.sc) drop(e.x - 20, e.y, 'gb'); else if (r < 0.17) drop(e.x - 20, e.y, 'bn');
  }
}
function hurtP(p, dmg, dir) {
  if (p.inv > 0 || p.dead) return;
  p.hp -= dmg; p.hurt = 0.3; p.inv = 0.9; p.x += dir * 24;
  S.cameras.main.shake(120, 0.006); noise(0.12, 0.15); tone(120, 0.15, 'sawtooth', 0.06, 50);
  if (p.hp <= 0) { p.dead = 1; p.lv--; p.rt = 1.8; p.hp = 0; ft(p.x, p.y - 100, p.lv > 0 ? '¡AY!' : '¡FUERA!', '#f55', 22); }
}
function attack(p) {
  const h = HERO[p.h]; p.cd = h.cd; p.at = p.am = 170;
  tone(p.h == 1 ? 160 : 520, 0.07, WAVE[p.h], 0.05, p.h == 1 ? 90 : 260);
  if (!h.rch) { shot(p.x + p.f * 34, p.y, 44, p.f * 430, h.dmg, 0, 'nt', 0, 0.6); tone(880 + Math.random() * 300, 0.12, 'sine', 0.07); return; }
  G.E.forEach((e) => {
    const dx = (e.x - p.x) * p.f;
    if (dx > -14 && dx < h.rch + (e.d.sc ? 20 : 0) && Math.abs(e.y - p.y) < 28) hitE(e, p.z > 0 ? h.dmg + 1 : h.dmg, p.f, p);
  });
}
function special(p) {
  const h = p.h; p.sp = 0; p.at = p.am = 300; p.inv = Math.max(p.inv, 0.8);
  ft(p.x, p.y - 140, '¡' + HERO[h].sp + '!', HERO[h].c, 22);
  S.cameras.main.flash(180, 255, 255, 200);
  [330, 440, 660].forEach((f, i) => S.time.delayedCall(i * 60, () => tone(f * (h + 2) / 2, 0.25, WAVE[h], 0.08)));
  if (h == 0) for (let i = -1; i < 2; i++) shot(p.x + p.f * 30, p.y + i * 30, 40, p.f * 480, 5, 0, 'wv', 1, 1);
  if (h == 1) { S.cameras.main.shake(400, 0.014); G.E.forEach((e) => onScr(e) && hitE(e, 7, e.x > p.x ? 1 : -1, p)); }
  if (h == 2) {
    G.E.forEach((e) => { if (onScr(e)) { e.stun = 3; e.wind = 0; ft(e.x, e.y - 90, '♥', '#ff6ec7', 26); } });
    G.P.forEach((q) => { if (!q.dead) { q.hp = Math.min(100, q.hp + 30); ft(q.x, q.y - 90, '+30', '#7f7'); } });
  }
  if (h == 3) G.E.forEach((e) => { if (onScr(e)) { hitE(e, 4, e.x > p.x ? 1 : -1, p); e.kx *= 3.5; e.stun = 0.9; } });
  p.sp = 0;
}

function upP(p, dt) {
  const k = p.i ? 'P2_' : 'P1_', h = HERO[p.h], cam = S.cameras.main, now = S.time.now;
  if (p.dead) {
    p.spr.setAngle(-90).setAlpha(p.lv > 0 ? 0.6 : 0); p.tag.setVisible(false); p.sh.setVisible(false);
    p.rt -= dt;
    if (p.lv > 0 && p.rt <= 0) { p.dead = 0; p.hp = 100; p.inv = 2.5; p.x = cam.scrollX + 120; p.spr.setAngle(0); p.tag.setVisible(true); p.sh.setVisible(true); }
    return;
  }
  p.cd -= dt * 1000; p.at -= dt * 1000; p.inv -= dt; p.hurt -= dt;
  let mx = 0, my = 0;
  if (p.hurt <= 0) {
    mx = (held[k + 'R'] ? 1 : 0) - (held[k + 'L'] ? 1 : 0); my = (held[k + 'D'] ? 1 : 0) - (held[k + 'U'] ? 1 : 0);
    const s = p.at > 0 ? 0.35 : 1;
    p.x += mx * h.spd * s * dt; p.y += my * h.spd * 0.65 * s * dt;
    if (mx) p.f = mx;
    if (pressed[k + '2'] && p.z == 0) { p.vz = 520; tone(300, 0.12, 'square', 0.04, 600); }
    if (pressed[k + '1'] && p.cd <= 0) attack(p);
    if (pressed[k + '3']) { if (p.sp >= 100) special(p); else tone(90, 0.08, 'square', 0.04); }
  }
  if (p.z > 0 || p.vz > 0) { p.vz -= 1500 * dt; p.z += p.vz * dt; if (p.z <= 0) { p.z = 0; p.vz = 0; } }
  p.x = Phaser.Math.Clamp(p.x, cam.scrollX + 26, cam.scrollX + 774); p.y = Phaser.Math.Clamp(p.y, 412, 578);
  const wk = (now / 110 | 0) % 4, fr = p.hurt > 0 ? 4 : p.at > 0 ? (p.at > p.am - 40 ? 5 : 3) : p.z > 0 ? 6 : (mx || my) ? [1, 0, 2, 0][wk] : 0;
  const bob = (mx || my) && !p.z && p.at <= 0 && wk % 2 ? 4 : 0;
  p.spr.setTexture('d' + p.h + fr).setPosition(p.x, p.y - p.z - bob).setFlipX(p.f < 0).setDepth(p.y).setAlpha(p.inv > 0 && now % 160 < 80 ? 0.4 : 1);
  p.sh.setPosition(p.x, p.y); p.tag.setPosition(p.x, p.y - p.z - 112).setDepth(p.y);
  // recoger
  if (p.z < 24) G.I.forEach((it) => {
    if (it.gone || it.key == 'pl' || Math.abs(it.x - p.x) > 28 || Math.abs(it.y - p.y) > 22) return;
    it.gone = 1;
    if (it.key == 'cn') { G.score += 100; tone(1320, 0.1, 'square', 0.05); ft(it.x, it.y - 30, '+$100', '#ffd76a'); }
    if (it.key == 'bn') { p.hp = Math.min(100, p.hp + 25); tone(660, 0.2, 'triangle', 0.08, 990); ft(it.x, it.y - 30, 'PLÁTANO +25', '#f5d400'); drop(p.x - p.f * 36, p.y, 'pl'); }
    if (it.key == 'gb') { p.sp = 100; tone(880, 0.3, 'triangle', 0.08, 1760); ft(it.x, it.y - 30, '¡PLÁTANO DE ORO!', '#fff7b0', 18); }
  });
}
function upE(e, dt) {
  const d = e.d, now = S.time.now;
  e.stun -= dt; e.x += e.kx * dt; e.kx *= 0.86;
  let fr = 0, tint = 0;
  // cáscaras
  if (!d.sc && e.stun <= 0) G.I.forEach((it) => {
    if (it.key == 'pl' && !it.gone && Math.abs(it.x - e.x) < 20 && Math.abs(it.y - e.y) < 16) {
      it.gone = 1; ft(e.x, e.y - 90, '¡RESBALÓN!', '#f5d400', 16); hitE(e, 3, -e.f, null); e.stun = 1.4; tone(700, 0.3, 'sine', 0.07, 150);
    }
  });
  if (e.dead) return;
  const al = G.P.filter((p) => !p.dead);
  if (e.stun > 0) fr = 4;
  else if (al.length) {
    const t = al.reduce((a, p) => (Math.abs(p.x - e.x) < Math.abs(a.x - e.x) ? p : a));
    const dx = t.x - e.x, dy = t.y - e.y;
    if (e.wind > 0) {
      e.wind -= dt; tint = 1; fr = e.wind < 0.14 ? 3 : 5;
      if (e.wind <= 0) {
        e.cool = 1 + Math.random() * 1.2;
        if (d.sh) { shot(e.x + e.f * 30, e.y, 40, e.f * 300, d.dmg, 1, 'bt', 0, 2.4); tone(500, 0.1, 'sine', 0.05, 250); }
        else if (Math.abs(dx) < d.rng + 26 && Math.abs(dy) < 28 && t.z < 34) hurtP(t, d.dmg, e.f);
      }
    } else {
      e.f = dx > 0 ? 1 : -1; e.cool -= dt;
      const sx = S.cameras.main.scrollX, gx = Phaser.Math.Clamp(t.x - e.f * (d.rng - 12), sx + 40, sx + 760), gy = t.y + (d.sh ? 0 : e.oy), ax = gx - e.x, ay = gy - e.y, m = Math.hypot(ax, ay);
      if (m > 12) { e.x += (ax / m) * d.spd * dt; e.y += (ay / m) * d.spd * 0.7 * dt; fr = [1, 0, 2, 0][(now / 140 | 0) % 4]; }
      if (Math.abs(ax) < 30 && Math.abs(dy) < 22 && e.cool <= 0 && onScr(e)) {
        // un solo grito a la vez, para que los globos no se pisen
        e.wind = 0.42; if (now > (G.say || 0) && Math.random() < 0.5) { G.say = now + 1400; ft(e.x, e.y - 124 * (d.sc || 1), d.say, '#fff', 13); }
      }
    }
  }
  e.y = Phaser.Math.Clamp(e.y, 412, 578);
  e.spr.setTexture('d' + d.k + fr).setPosition(e.x, e.y).setFlipX(e.f < 0).setDepth(e.y);
  if (tint && now % 120 < 60) e.spr.setTint(0xff7777); else if (!e.spr.isTinted || tint || e.stun <= 0.28) e.spr.clearTint();
  e.sh.setPosition(e.x, e.y);
}
function upS(s, dt) {
  s.x += s.vx * dt; s.l -= dt; s.spr.setPosition(s.x, s.y - s.z).setDepth(s.y);
  if (s.foe) G.P.forEach((p) => {
    if (!s.gone && !p.dead && p.inv <= 0 && Math.abs(p.x - s.x) < 22 && Math.abs(p.y - s.y) < 20 && p.z < 40) { hurtP(p, s.dmg, Math.sign(s.vx)); s.gone = 1; }
  });
  else G.E.forEach((e) => {
    if (!s.gone && !e.dead && !s.hit.includes(e) && Math.abs(e.x - s.x) < 28 && Math.abs(e.y - s.y) < 26) {
      hitE(e, s.dmg, Math.sign(s.vx), G.P[0]); s.hit.push(e); if (!s.pc) s.gone = 1;
    }
  });
  if (s.l <= 0) s.gone = 1;
}

function upPlay(dt) {
  const cam = S.cameras.main, st = ST[G.si];
  if (G.P.length < 2 && !G.P.some((p) => p.i) && (pressed.START2 || pressed.P2_1)) { mkP(1, (G.P[0].h + 1) % 4); tone(660, 0.15); }
  G.P.forEach((p) => upP(p, dt));
  G.E.forEach((e) => upE(e, dt)); G.E = G.E.filter((e) => !e.dead);
  G.S.forEach((s) => upS(s, dt));
  G.S = G.S.filter((s) => { if (s.gone) s.spr.destroy(); return !s.gone; });
  G.I = G.I.filter((it) => { it.t += dt; if (it.t > 12) it.gone = 1; if (it.gone) it.spr.destroy(); return !it.gone; });
  const al = G.P.filter((p) => !p.dead);
  if (G.ph == 'walk') {
    if (al.length) cam.scrollX = Math.max(cam.scrollX, Math.min(al.reduce((a, p) => a + p.x, 0) / al.length - 330, G.camMax));
    if (cam.scrollX >= G.camMax - 1) { G.ph = 'fight'; spawn(st.w[G.wi]); }
  } else if (G.ph == 'fight' && !G.E.length) {
    G.wi++;
    if (G.wi >= st.w.length) {
      G.ph = 'clear'; G.t = 2.2; G.score += 500;
      const t = TG(400, 260, G.si == 4 ? '¡LLEGASTE!' : '¡ETAPA SUPERADA!', 46).setScrollFactor(0).setDepth(970);
      S.tweens.add({ targets: t, alpha: 0, delay: 1500, duration: 500, onComplete: () => t.destroy() });
      [523, 659, 784].forEach((f, i) => S.time.delayedCall(i * 120, () => tone(f, 0.2, 'triangle', 0.09)));
    } else { G.ph = 'walk'; G.camMax += 520; }
  } else if (G.ph == 'clear') {
    G.t -= dt;
    if (G.t <= 0) { if (G.si == 4) return end(1); startStage(G.si + 1); }
  }
  G.go.setVisible(G.ph == 'walk' && G.wi > 0 && S.time.now % 600 < 380);
  G.au += st.a * dt;
  if (st.p) {
    bus.x += bus.v * dt;
    if (Math.abs(bus.x - cam.scrollX - 400) > 900) {
      bus.v = (Math.random() < 0.5 ? 1 : -1) * (160 + Math.random() * 120);
      bus.setTexture(Math.random() < 0.5 ? 'bus0' : 'bus1').setFlipX(bus.v < 0); bus.x = cam.scrollX + 400 - Math.sign(bus.v) * 700;
    }
  }
  // HUD
  hudG.clear(); hudG.fillStyle(0x2a140c, 0.88).fillRect(0, 0, W, 68).fillStyle(0xffb22e).fillRect(0, 68, W, 3).fillStyle(0x5a2e12).fillRect(0, 71, W, 2);
  G.P.forEach((p) => {
    const a = p.i ? 580 : 20;
    hudG.fillStyle(0, 0.6).fillRect(a - 2, 26, 204, 26);
    hudG.fillStyle(p.hp > 35 ? 0x4cd964 : 0xff3b30).fillRect(a, 28, p.hp * 2, 12);
    hudG.fillStyle(p.sp >= 100 && S.time.now % 300 < 150 ? 0xffffff : 0x33c8ff).fillRect(a, 42, p.sp * 2, 8);
    for (let i = 0; i < p.lv; i++) hudG.fillStyle(0xf5d400).fillRect(a + i * 14, 56, 10, 6);
  });
  G.scT.setText('PROPINAS $' + G.score);
  if (G.P.every((p) => p.dead && p.lv <= 0)) end(0);
}

// ---------- Phaser ----------
new Phaser.Game({
  type: Phaser.AUTO, width: W, height: H, parent: 'game-root', backgroundColor: '#0b0b1a',
  render: { pixelArt: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: { create, update },
});

function create() {
  S = this; art();
  bgB = S.add.tileSprite(0, 0, W, H, 'b0').setOrigin(0).setScrollFactor(0).setDepth(-30);
  bgF = S.add.tileSprite(0, 0, W, H, 'f0').setOrigin(0).setScrollFactor(0).setDepth(-20);
  bus = S.add.image(-300, 394, 'bus0').setOrigin(0.5, 1).setDepth(-15); bus.v = 200;
  bgP = S.add.tileSprite(0, 0, W, H, 'p0').setOrigin(0).setScrollFactor(0).setDepth(-10);
  const cam = S.cameras.main; if (cam.postFX) cam.postFX.addVignette(0.5, 0.5, 1, 0.15);
  getStorage().get('tocata-hs').then((r) => {
    if (r.found && Array.isArray(r.value)) G.hs = r.value.filter((n) => typeof n == 'number').slice(0, 5);
    if (G.st == 'title') toTitle();
  });
  toTitle();
}

function update(time, delta) {
  const dt = Math.min(delta, 50) / 1000, sx = S.cameras.main.scrollX;
  if (G.st == 'title') {
    G.blink.setVisible(time % 800 < 500); S.cameras.main.scrollX = 0; G.au += 30 * dt;
    if (pressed.START1 || pressed.START2 || pressed.P1_1) { tone(660, 0.15); toSelect(); }
  } else if (G.st == 'sel') upSel();
  else if (G.st == 'play') upPlay(dt);
  else if (G.st == 'end') { G.t -= dt; if (G.t < 0 && (pressed.START1 || pressed.START2 || pressed.P1_1)) toTitle(); }
  bgB.tilePositionX = sx * 0.3 + G.au; bgF.tilePositionX = sx; bgP.tilePositionX = sx;
  music(dt);
  pressed = Object.create(null);
}
