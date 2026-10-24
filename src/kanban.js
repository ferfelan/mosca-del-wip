import * as THREE from 'three';
import { tx } from './juego-textos.js';

const ANCHO = 1024;
const ALTO = 620;
const LIMITE_SANO = 3;

// titulo: su texto en src/juego-textos.js (POR HACER / TO DO…)
const COLUMNAS = [
  { clave: 'porHacer', titulo: 'porHacer', color: '#94a3b8', tarjeta: '#e2e8f0', barra: '#94a3b8' },
  { clave: 'enCurso', titulo: 'enCurso', color: '#2f7de1', tarjeta: '#dbeafe', barra: '#2f7de1' },
  { clave: 'hechas', titulo: 'hecho', color: '#1f9d62', tarjeta: '#d7f2e3', barra: '#1f9d62' },
];

// Candado simple (tarea bloqueada esperando a otra persona)
function candado(ctx, cx, cy, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 8, Math.PI, 0);
  ctx.lineTo(cx + 8, cy + 2);
  ctx.moveTo(cx - 8, cy - 4);
  ctx.lineTo(cx - 8, cy + 2);
  ctx.stroke();
  ctx.fillStyle = color;
  rectRedondo(ctx, cx - 13, cy, 26, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy + 9, 3, 0, Math.PI * 2);
  ctx.fill();
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

// Devuelve los textos que escribió (las pruebas revisan que estén en el idioma
// elegido)
export function dibujarKanban(ctx, estado) {
  const escritos = [];
  const escribir = (texto, x, y) => {
    escritos.push(texto);
    ctx.fillText(texto, x, y);
  };
  ctx.fillStyle = '#f4f6fa';
  ctx.fillRect(0, 0, ANCHO, ALTO);

  ctx.fillStyle = '#1f2a3a';
  ctx.fillRect(0, 0, ANCHO, 78);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px -apple-system, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  escribir(tx('tablero'), 34, 40);
  ctx.textAlign = 'right';
  ctx.font = 'bold 38px -apple-system, Helvetica, sans-serif';
  ctx.fillStyle = '#9fb3cd';
  escribir(estado.hora ?? '', ANCHO - 34, 40);

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
    const aviso = sobreLimite ? tx('sobreLimite', limite) : excedido ? tx('wipAlto') : null;

    ctx.fillStyle = '#e8ecf3';
    rectRedondo(ctx, x, colY, colW, colH, 18);
    ctx.fill();

    ctx.fillStyle = excedido ? '#e03b3b' : col.color;
    rectRedondo(ctx, x, colY, colW, 62, 18);
    ctx.fill();
    ctx.fillRect(x, colY + 40, colW, 22);

    ctx.fillStyle = '#ffffff';
    const titulo = tx(col.titulo);
    const textoCantidad = sobreLimite ? `${cantidad} / ${limite}` : String(cantidad);
    // El título se achica sólo si no deja lugar para el número ("10" a 32 px,
    // o "10 / 2" a 26 px si bajaron el límite). Pasa con "IN PROGRESS" en
    // inglés; en español todos caben y quedan a 34 px, como siempre.
    ctx.font = `bold ${sobreLimite ? 26 : 32}px -apple-system, Helvetica, sans-serif`;
    const reserva = ctx.measureText(sobreLimite ? textoCantidad : '10').width;
    ctx.font = 'bold 34px -apple-system, Helvetica, sans-serif';
    let anchoTitulo = ctx.measureText(titulo).width;
    const maximoTitulo = colW - 40 - 16 - reserva;
    if (anchoTitulo > maximoTitulo) {
      ctx.font = `bold ${Math.floor((34 * maximoTitulo) / anchoTitulo)}px -apple-system, Helvetica, sans-serif`;
      anchoTitulo = ctx.measureText(titulo).width;
    }
    ctx.textAlign = 'left';
    escribir(titulo, x + 20, colY + 32);
    ctx.textAlign = 'right';
    // "10 / 2" no cabe al lado del título a 36 px: se achica lo justo
    ctx.font = 'bold 36px -apple-system, Helvetica, sans-serif';
    const libre = colW - 40 - anchoTitulo - 16;
    const tamano = Math.min(36, Math.floor((36 * libre) / ctx.measureText(textoCantidad).width));
    ctx.font = `bold ${tamano}px -apple-system, Helvetica, sans-serif`;
    escribir(textoCantidad, x + colW - 20, colY + 32);

    const altoTarjeta = 56;
    const sep = 12;
    // con aviso rojo abajo se deja su espacio (no se monta sobre "+N más")
    const maxVisibles = Math.floor((colH - 84 - (aviso ? 40 : 0)) / (altoTarjeta + sep));
    const visibles = Math.min(cantidad, maxVisibles);

    for (let t = 0; t < visibles; t++) {
      const ty = colY + 78 + t * (altoTarjeta + sep);
      // En curso: la tarjeta bloqueada (espera a otra persona) va en rojo y
      // con candado
      const bloqueada = col.clave === 'enCurso' && estado.enCursoBloqueadas?.[t];
      ctx.fillStyle = 'rgba(31,42,58,0.10)';
      rectRedondo(ctx, x + 16, ty + 4, colW - 32, altoTarjeta, 12);
      ctx.fill();
      ctx.fillStyle = bloqueada ? '#fde2e2' : col.tarjeta;
      rectRedondo(ctx, x + 14, ty, colW - 32, altoTarjeta, 12);
      ctx.fill();
      if (bloqueada) {
        ctx.strokeStyle = '#e03b3b';
        ctx.lineWidth = 3;
        rectRedondo(ctx, x + 15.5, ty + 1.5, colW - 35, altoTarjeta - 3, 11);
        ctx.stroke();
      }
      ctx.fillStyle = bloqueada ? '#e03b3b' : col.barra;
      rectRedondo(ctx, x + 14, ty, 10, altoTarjeta, 5);
      ctx.fill();

      ctx.fillStyle = bloqueada ? 'rgba(160,40,40,0.45)' : 'rgba(31,42,58,0.42)';
      ctx.fillRect(x + 40, ty + 17, colW - (bloqueada ? 110 : 90), 9);
      ctx.fillRect(x + 40, ty + 34, (colW - 90) * 0.55, 9);
      if (bloqueada) candado(ctx, x + colW - 46, ty + altoTarjeta / 2 - 8, '#e03b3b');

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
      escribir(tx('masTarjetas', cantidad - visibles), x + colW / 2, colY + colH - (aviso ? 62 : 26));
    }

    if (aviso) {
      ctx.fillStyle = '#e03b3b';
      ctx.font = `bold ${sobreLimite ? 24 : 26}px -apple-system, Helvetica, sans-serif`;
      ctx.textAlign = 'center';
      escribir(aviso, x + colW / 2, colY + colH - 24);
    }
  });
  return escritos;
}
