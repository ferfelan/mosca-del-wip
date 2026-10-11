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

export function texturaRayasAbdomen() {
  const { canvas, ctx } = lienzo(128, 256);
  const base = ctx.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, '#5c4d3c');
  base.addColorStop(0.35, '#9c8463');
  base.addColorStop(1, '#ab9471');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = '#463a2c';
  [
    [58, 22],
    [110, 26],
    [164, 24],
  ].forEach(([y, h]) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(70,58,44,0)');
    g.addColorStop(0.3, '#463a2c');
    g.addColorStop(0.7, '#463a2c');
    g.addColorStop(1, 'rgba(70,58,44,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, 128, h);
  });
  return aTextura(canvas);
}

export function texturaHumo() {
  const { canvas, ctx } = lienzo(128, 128);
  for (const [cx, cy, r, a] of [
    [64, 66, 52, 0.8],
    [48, 54, 34, 0.55],
    [82, 58, 30, 0.5],
  ]) {
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    g.addColorStop(0, `rgba(126,133,150,${a})`);
    g.addColorStop(0.5, `rgba(150,157,172,${a * 0.55})`);
    g.addColorStop(1, 'rgba(160,167,182,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return aTextura(canvas);
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
    { y: 14, n: 13 },
    { y: 42, n: 12 },
    { y: 70, n: 11 },
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
  g.addColorStop(0, '#dcd2e8');
  g.addColorStop(0.45, '#eadfd2');
  g.addColorStop(1, '#f3e7d8');
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
