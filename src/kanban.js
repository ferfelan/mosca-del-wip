import * as THREE from 'three';

const ANCHO = 512;
const ALTO = 320;

const COLUMNAS = [
  { clave: 'porHacer', titulo: 'POR HACER', color: '#94a3b8' },
  { clave: 'enCurso', titulo: 'EN CURSO', color: '#60a5fa' },
  { clave: 'hechas', titulo: 'HECHO', color: '#4ade80' },
];

export function crearTexturaKanban() {
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return { canvas, ctx, textura };
}

function tarjeta(ctx, x, y, w, h, color) {
  const r = 6;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

export function dibujarKanban(ctx, estado) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, ANCHO, ALTO);

  const colW = ANCHO / 3;
  COLUMNAS.forEach((col, i) => {
    const x = i * colW;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 4, 4, colW - 8, 28);
    ctx.fillStyle = col.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(col.titulo, x + colW / 2, 24);

    const cantidad = estado[col.clave];
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`(${cantidad})`, x + colW / 2, 44);

    const maxTarjetas = 6;
    const visibles = Math.min(cantidad, maxTarjetas);
    for (let t = 0; t < visibles; t++) {
      tarjeta(ctx, x + 14, 56 + t * 30, colW - 28, 22, col.color + 'cc');
    }
    if (cantidad > maxTarjetas) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px sans-serif';
      ctx.fillText(`+${cantidad - maxTarjetas} más`, x + colW / 2, 56 + maxTarjetas * 30 + 14);
    }
  });

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(colW, 0, colW, ALTO);
  ctx.strokeRect(colW * 2, 0, colW, ALTO);
}
