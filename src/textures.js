import * as THREE from 'three';

function lienzo(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

function aTextura(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function rectRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function texturaBrillo(color = '255,150,60') {
  const { canvas, ctx } = lienzo(64, 64);
  const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  g.addColorStop(0, `rgba(${color},0.95)`);
  g.addColorStop(0.4, `rgba(${color},0.35)`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return aTextura(canvas);
}

export function texturaCielo() {
  const { canvas, ctx } = lienzo(256, 220);
  const g = ctx.createLinearGradient(0, 0, 0, 220);
  g.addColorStop(0, '#9ed4f5');
  g.addColorStop(0.55, '#c9e8fb');
  g.addColorStop(1, '#f2e6d2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 220);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  for (const [cx, cy, r] of [
    [70, 70, 26],
    [96, 62, 32],
    [124, 72, 22],
    [186, 122, 20],
    [206, 116, 26],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(167,205,160,0.9)';
  ctx.beginPath();
  ctx.ellipse(40, 215, 70, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(190, 218, 90, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  return aTextura(canvas);
}

export function texturaPoster() {
  const { canvas, ctx } = lienzo(420, 540);
  ctx.fillStyle = '#fdf6e6';
  ctx.fillRect(0, 0, 420, 540);
  ctx.strokeStyle = '#e0a94f';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, 380, 500);

  ctx.fillStyle = '#b4521f';
  ctx.font = 'bold 110px -apple-system, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WIP', 210, 200);
  ctx.font = 'bold 128px -apple-system, Helvetica, sans-serif';
  ctx.fillText('≤ 3', 210, 330);

  ctx.fillStyle = '#8a6a3a';
  ctx.font = '26px -apple-system, Helvetica, sans-serif';
  ctx.fillText('menos cosas a la vez', 210, 410);
  ctx.fillText('= más cosas listas', 210, 446);

  ctx.strokeStyle = '#e0a94f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(140, 370);
  ctx.lineTo(280, 370);
  ctx.stroke();
  return aTextura(canvas);
}

export function texturaTeclado() {
  const { canvas, ctx } = lienzo(320, 128);
  ctx.fillStyle = '#2f343d';
  ctx.fillRect(0, 0, 320, 128);
  ctx.fillStyle = '#4b5361';
  const filas = [
    { y: 12, n: 11 },
    { y: 40, n: 10 },
    { y: 68, n: 9 },
  ];
  filas.forEach(({ y, n }) => {
    const w = (300 - (n - 1) * 4) / n;
    for (let i = 0; i < n; i++) {
      rectRedondo(ctx, 10 + i * (w + 4), y, w, 22, 4);
      ctx.fill();
    }
  });
  rectRedondo(ctx, 80, 98, 160, 20, 5);
  ctx.fill();
  return aTextura(canvas);
}

export function texturaCaraReloj() {
  const { canvas, ctx } = lienzo(256, 256);
  ctx.fillStyle = '#fdfbf6';
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#43505f';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const largo = i % 3 === 0 ? 20 : 11;
    ctx.lineWidth = i % 3 === 0 ? 7 : 4;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104);
    ctx.lineTo(128 + Math.cos(a) * (104 - largo), 128 + Math.sin(a) * (104 - largo));
    ctx.stroke();
  }
  return aTextura(canvas);
}

export function texturaFondo() {
  const { canvas, ctx } = lienzo(16, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#d5dde3');
  g.addColorStop(0.45, '#e2e6dc');
  g.addColorStop(1, '#ece8dc');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  return aTextura(canvas);
}

export function texturaMadera() {
  const { canvas, ctx } = lienzo(512, 512);
  ctx.fillStyle = '#d7a86a';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(160,110,62,0.22)';
  for (let i = 0; i < 26; i++) {
    const y = Math.random() * 512;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(140, y + 8, 300, y - 10, 512, y + 4);
    ctx.stroke();
  }
  return aTextura(canvas);
}

// ---------- Mosca de la fruta ----------

// Abdomen de Drosophila: café amarillento con una banda oscura al final de
// cada segmento y la punta oscura. Las filas del lienzo se vuelven anillos.
export function texturaAbdomenDrosophila() {
  const { canvas, ctx } = lienzo(256, 512);
  const base = ctx.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, '#78685a');
  base.addColorStop(1, '#6a5a4b');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 512);

  // Bandas finas café oscuro al final de cada segmento (no negras)
  [0.24, 0.37, 0.5, 0.63, 0.76].forEach((inicio, i) => {
    const y = inicio * 512;
    const h = (0.032 + i * 0.004) * 512;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(48,37,28,0)');
    g.addColorStop(0.45, '#30251c');
    g.addColorStop(1, 'rgba(48,37,28,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, 256, h);
  });
  const punta = ctx.createLinearGradient(0, 0.86 * 512, 0, 512);
  punta.addColorStop(0, 'rgba(48,37,28,0)');
  punta.addColorStop(1, '#3a2d22');
  ctx.fillStyle = punta;
  ctx.fillRect(0, 0.86 * 512, 256, 0.14 * 512);

  // Pelitos cortos y oscuros en filas, sobre todo en el borde de cada banda
  ctx.strokeStyle = 'rgba(25,19,14,0.5)';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 1300; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 1.5, y + 3 + Math.random() * 2);
    ctx.stroke();
  }
  return aTextura(canvas);
}

// Cutícula gris canela con pelitos cortos (cabeza)
export function texturaCuticula() {
  const { canvas, ctx } = lienzo(256, 128);
  ctx.fillStyle = '#6f6052';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = 'rgba(30,23,17,0.25)';
  for (let i = 0; i < 500; i++) ctx.fillRect(Math.random() * 256, Math.random() * 128, 0.9, 1.8);
  return aTextura(canvas);
}

// Ojo compuesto: panal de facetas. Cada fila tiene menos facetas hacia los
// polos para que en la esfera se vean todas del mismo tamaño.
export function texturaOjoFacetas() {
  const W = 1024;
  const H = 512;
  const color = lienzo(W, H);
  const relieve = lienzo(W, H);
  color.ctx.fillStyle = '#8f0f14';
  color.ctx.fillRect(0, 0, W, H);
  relieve.ctx.fillStyle = '#000';
  relieve.ctx.fillRect(0, 0, W, H);

  const filas = 22;
  const porVuelta = 46;
  const altoFila = H / filas;
  for (let f = 0; f < filas; f++) {
    const lat = (0.5 - (f + 0.5) / filas) * Math.PI;
    const n = Math.max(4, Math.round(porVuelta * Math.cos(lat)));
    const ancho = W / n;
    const y = (f + 0.5) * altoFila;
    const desfase = (f % 2) * ancho * 0.5;
    for (let i = -1; i <= n; i++) {
      const x = i * ancho + desfase + ancho / 2;
      const rx = ancho * 0.47;
      const ry = altoFila * 0.5;
      const hexagono = (ctx) => {
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
          ctx.lineTo(x + Math.cos(a) * rx, y + Math.sin(a) * ry);
        }
        ctx.closePath();
      };
      const g = color.ctx.createRadialGradient(x - rx * 0.2, y - ry * 0.25, 1, x, y, Math.max(rx, ry));
      g.addColorStop(0, '#ff6a4f');
      g.addColorStop(0.55, '#e0302a');
      g.addColorStop(1, '#a8151a');
      color.ctx.fillStyle = g;
      hexagono(color.ctx);
      color.ctx.fill();

      const gr = relieve.ctx.createRadialGradient(x, y, 1, x, y, Math.max(rx, ry));
      gr.addColorStop(0, '#fff');
      gr.addColorStop(0.7, '#bbb');
      gr.addColorStop(1, '#222');
      relieve.ctx.fillStyle = gr;
      hexagono(relieve.ctx);
      relieve.ctx.fill();
    }
  }
  const mapa = aTextura(color.canvas);
  mapa.anisotropy = 8;
  const bump = new THREE.CanvasTexture(relieve.canvas);
  bump.anisotropy = 8;
  return { mapa, bump };
}

// Contorno del ala de Drosophila en (u, v): u va de la base (0) a la punta (1),
// v es el ancho (positivo = borde de adelante).
export const ALA_V_MIN = -0.22;
export const ALA_V_MAX = 0.2;
export const CONTORNO_ALA = [
  [0, 0.0],
  [0.12, 0.05],
  [0.35, 0.12],
  [0.62, 0.165],
  [0.85, 0.15],
  [0.97, 0.08],
  [1.0, 0.0],
  [0.97, -0.08],
  [0.86, -0.16],
  [0.66, -0.2],
  [0.42, -0.17],
  [0.2, -0.09],
  [0.06, -0.035],
];

// Venas del ala: costa, L2-L5 y las dos venas cruzadas.
export function texturaAla() {
  const W = 512;
  const H = 256;
  const { canvas, ctx } = lienzo(W, H);
  const px = (u, v) => [u * W, ((ALA_V_MAX - v) / (ALA_V_MAX - ALA_V_MIN)) * H];

  ctx.beginPath();
  const curva = new THREE.SplineCurve(CONTORNO_ALA.concat([CONTORNO_ALA[0]]).map(([u, v]) => new THREE.Vector2(u, v)));
  curva.getPoints(80).forEach((p, i) => {
    const [x, y] = px(p.x, p.y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(210,222,242,0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(96,74,52,0.75)';
  ctx.lineWidth = 3;
  ctx.stroke();

  const vena = (puntos, grosor = 3.2) => {
    ctx.beginPath();
    puntos.forEach(([u, v], i) => {
      const [x, y] = px(u, v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'rgba(70,52,36,0.95)';
    ctx.lineWidth = grosor * 1.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  vena([[0.02, 0.01], [0.15, 0.055], [0.4, 0.125], [0.65, 0.16], [0.87, 0.145]], 4);
  vena([[0.08, 0.03], [0.35, 0.08], [0.6, 0.12], [0.8, 0.15]]);
  vena([[0.08, 0.015], [0.4, 0.03], [0.7, 0.035], [0.995, 0.01]]);
  vena([[0.08, 0.0], [0.4, -0.04], [0.7, -0.08], [0.94, -0.115]]);
  vena([[0.08, -0.015], [0.35, -0.08], [0.6, -0.14], [0.78, -0.185]]);
  vena([[0.43, 0.031], [0.42, -0.044]], 2.6);
  vena([[0.63, -0.074], [0.6, -0.14]], 2.6);

  const t = aTextura(canvas);
  t.anisotropy = 8;
  return t;
}

// Corbata azul intenso con rayas diagonales doradas.
export function texturaCorbata() {
  const { canvas, ctx } = lienzo(128, 128);
  ctx.fillStyle = '#1f4fc4';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 9;
  for (let i = -128; i < 256; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 128);
    ctx.lineTo(i + 128, 0);
    ctx.stroke();
  }
  const t = aTextura(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Volutas de humo: manchas suaves e irregulares (varias variantes).
export function texturasHumo(cantidad = 4) {
  const lista = [];
  for (let k = 0; k < cantidad; k++) {
    const { canvas, ctx } = lienzo(128, 128);
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * 26;
      const cx = 64 + Math.cos(a) * d;
      const cy = 64 + Math.sin(a) * d;
      const r = 14 + Math.random() * 26;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const alfa = 0.2 + Math.random() * 0.18;
      g.addColorStop(0, `rgba(255,255,255,${alfa})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }
    // borde suave para que nunca se note el cuadrado
    ctx.globalCompositeOperation = 'destination-in';
    const borde = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    borde.addColorStop(0, 'rgba(0,0,0,1)');
    borde.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = borde;
    ctx.fillRect(0, 0, 128, 128);
    lista.push(aTextura(canvas));
  }
  return lista;
}

// Brillo de ojo: centro nítido y borde suave
export function texturaBrilloOjo() {
  const { canvas, ctx } = lienzo(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.38, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.62, 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return aTextura(canvas);
}

// Tórax de mosca: gris café oscuro con franjas longitudinales en el lomo
// (u = 0.75 es el lomo en la esfera del tórax) y pelitos cortos.
export function texturaTorax() {
  const W = 512;
  const H = 256;
  const { canvas, ctx } = lienzo(W, H);
  const base = ctx.createLinearGradient(0, 0, W, 0);
  base.addColorStop(0, '#6c5d4f');
  base.addColorStop(0.75, '#776757');
  base.addColorStop(1, '#6c5d4f');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  [-0.11, -0.04, 0.04, 0.11].forEach((d) => {
    const x = (0.75 + d) * W;
    const ancho = 0.028 * W;
    const g = ctx.createLinearGradient(x - ancho, 0, x + ancho, 0);
    g.addColorStop(0, 'rgba(52,41,32,0)');
    g.addColorStop(0.5, 'rgba(52,41,32,0.85)');
    g.addColorStop(1, 'rgba(52,41,32,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - ancho, H * 0.12, ancho * 2, H * 0.78);
  });
  ctx.strokeStyle = 'rgba(25,19,14,0.45)';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5), y + 2.5);
    ctx.stroke();
  }
  return aTextura(canvas);
}
