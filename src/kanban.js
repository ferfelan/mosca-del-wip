import * as THREE from 'three';

const ANCHO = 1024;
const ALTO = 620;
const LIMITE_SANO = 3;

const COLUMNAS = [
  { clave: 'porHacer', titulo: 'POR HACER', color: '#94a3b8', tarjeta: '#e2e8f0', barra: '#94a3b8' },
  { clave: 'enCurso', titulo: 'EN CURSO', color: '#2f7de1', tarjeta: '#dbeafe', barra: '#2f7de1' },
  { clave: 'hechas', titulo: 'HECHO', color: '#1f9d62', tarjeta: '#d7f2e3', barra: '#1f9d62' },
];

function rectRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function crearTexturaKanban(anisotropia = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = anisotropia;
  return { canvas, ctx, textura };
}

export function dibujarKanban(ctx, estado) {
  ctx.fillStyle = '#f4f6fa';
  ctx.fillRect(0, 0, ANCHO, ALTO);

  ctx.fillStyle = '#1f2a3a';
  ctx.fillRect(0, 0, ANCHO, 78);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px -apple-system, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TABLERO DEL DÍA', 34, 40);
  ctx.textAlign = 'right';
  ctx.font = 'bold 38px -apple-system, Helvetica, sans-serif';
  ctx.fillStyle = '#9fb3cd';
  ctx.fillText(estado.hora ?? '', ANCHO - 34, 40);

  const margen = 24;
  const colW = (ANCHO - margen * 4) / 3;
  const colY = 102;
  const colH = ALTO - colY - margen;

  COLUMNAS.forEach((col, i) => {
    const x = margen + i * (colW + margen);
    const cantidad = estado[col.clave] ?? 0;
    // Si bajaron el límite, lo empezado sigue abierto: "8 / 2" y aviso
    const limite = estado.wip ?? Infinity;
    const sobreLimite = col.clave === 'enCurso' && cantidad > limite;
    const excedido = col.clave === 'enCurso' && (cantidad > LIMITE_SANO || sobreLimite);
    const aviso = sobreLimite ? `SOBRE EL LÍMITE (${limite})` : excedido ? '¡WIP ALTO!' : null;

    ctx.fillStyle = '#e8ecf3';
    rectRedondo(ctx, x, colY, colW, colH, 18);
    ctx.fill();

    ctx.fillStyle = excedido ? '#e03b3b' : col.color;
    rectRedondo(ctx, x, colY, colW, 62, 18);
    ctx.fill();
    ctx.fillRect(x, colY + 40, colW, 22);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px -apple-system, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(col.titulo, x + 20, colY + 32);
    ctx.textAlign = 'right';
    ctx.font = 'bold 36px -apple-system, Helvetica, sans-serif';
    ctx.fillText(sobreLimite ? `${cantidad} / ${limite}` : String(cantidad), x + colW - 20, colY + 32);

    const altoTarjeta = 56;
    const sep = 12;
    // con aviso rojo abajo se deja su espacio (no se monta sobre "+N más")
    const maxVisibles = Math.floor((colH - 84 - (aviso ? 40 : 0)) / (altoTarjeta + sep));
    const visibles = Math.min(cantidad, maxVisibles);

    for (let t = 0; t < visibles; t++) {
      const ty = colY + 78 + t * (altoTarjeta + sep);
      ctx.fillStyle = 'rgba(31,42,58,0.10)';
      rectRedondo(ctx, x + 16, ty + 4, colW - 32, altoTarjeta, 12);
      ctx.fill();
      ctx.fillStyle = col.tarjeta;
      rectRedondo(ctx, x + 14, ty, colW - 32, altoTarjeta, 12);
      ctx.fill();
      ctx.fillStyle = col.barra;
      rectRedondo(ctx, x + 14, ty, 10, altoTarjeta, 5);
      ctx.fill();

      ctx.fillStyle = 'rgba(31,42,58,0.42)';
      ctx.fillRect(x + 40, ty + 17, colW - 90, 9);
      ctx.fillRect(x + 40, ty + 34, (colW - 90) * 0.55, 9);

      if (col.clave === 'hechas') {
        ctx.strokeStyle = '#1f9d62';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        const cx = x + colW - 46;
        const cy = ty + altoTarjeta / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 11, cy);
        ctx.lineTo(cx - 3, cy + 9);
        ctx.lineTo(cx + 12, cy - 10);
        ctx.stroke();
      }
    }

    if (cantidad > visibles) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 26px -apple-system, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${cantidad - visibles} más`, x + colW / 2, colY + colH - (aviso ? 62 : 26));
    }

    if (aviso) {
      ctx.fillStyle = '#e03b3b';
      ctx.font = `bold ${sobreLimite ? 24 : 26}px -apple-system, Helvetica, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(aviso, x + colW / 2, colY + colH - 24);
    }
  });
}
