// Dibuja el mapa de verdad para la portada ("¿Por qué una mosca?", celda 1):
// las 25.000 neuronas de muestra del Male CNS v1.0 que ya usa el sitio, cada
// una en su lugar real y con el color de su zona (los mismos del cerebro del
// juego y de la leyenda "Colores del cerebro").
//
// Solo LEE public/cerebro/malecns-info.json y malecns-puntos.bin. No toca el
// cerebro ni sus datos. No necesita el sitio encendido.
//
// Uso:  node scripts/mapa-cerebro.mjs [salida.jpg]
// Deja: capturas/cerebro-mosca-mapa.jpg (720 px de ancho). Hasta la 8.13 la
// dejaba en public/img/ y se veía en "¿Por qué una mosca?". Desde la 8.13 ahí
// va el cerebro en 3D y el sitio ya no usa esta foto. La última que se vio en
// el sitio quedó guardada en el Escritorio, en "Mosca del WIP/Versiones
// anteriores/Imágenes del sitio" (pedido de Felipe, "las fotos guárdalas por
// ahí").
//
// Qué es dato y qué no: la posición y la zona de cada punto son del Male CNS.
// El tamaño, el brillo y la inclinación de la vista (la misma del cerebro del
// juego) son solo para que se vea.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = process.argv[2] || join(RAIZ, 'capturas/cerebro-mosca-mapa.jpg');

// Los mismos de src/cerebro.js (GRUPOS_VISUALES, FONDO e INCLINACION)
const COLORES = { vision: '#2fe3ff', central: '#8b5cff', memoria: '#ffd84d', mando: '#ff4fd8', movimiento: '#ff7f66' };
const FONDO = '#060a16';
const INCLINACION = 0.32;

const ANCHO = 720;
const MARGEN = 0.06; // aire alrededor, como parte del ancho
// Cuánto pesa cada zona en la foto. La visión tiene 10.500 de los 25.000
// puntos, muy juntos: con el mismo brillo taparía a las demás
const BRILLO = { vision: 0.4, central: 1, memoria: 0.42, mando: 1.1, movimiento: 1.6 };

const info = JSON.parse(readFileSync(join(RAIZ, 'public/cerebro/malecns-info.json'), 'utf8'));
const binario = readFileSync(join(RAIZ, 'public/cerebro/malecns-puntos.bin'));
const n = info.puntos;
const enteros = new Int16Array(binario.buffer, binario.byteOffset, n * 3);
const grupos = new Uint8Array(binario.buffer, binario.byteOffset + n * 6, n);
const tonos = new Uint8Array(binario.buffer, binario.byteOffset + n * 7, n);

// El centro, y la vista inclinada hacia la cámara (giro sobre el eje x)
let cx = 0, cy = 0, cz = 0;
for (let i = 0; i < n; i++) { cx += enteros[i * 3]; cy += enteros[i * 3 + 1]; cz += enteros[i * 3 + 2]; }
cx /= n; cy /= n; cz /= n;
const cos = Math.cos(INCLINACION), sen = Math.sin(INCLINACION);
const puntos = [];
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (let i = 0; i < n; i++) {
  const x = (enteros[i * 3] - cx) / info.escala;
  const y0 = (enteros[i * 3 + 1] - cy) / info.escala;
  const z0 = (enteros[i * 3 + 2] - cz) / info.escala;
  const y = y0 * cos - z0 * sen;
  const z = y0 * sen + z0 * cos;
  puntos.push([x, y, z, grupos[i], tonos[i]]);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const escala = (ANCHO * (1 - MARGEN * 2)) / (maxX - minX);
const ALTO = Math.round((maxY - minY) * escala + ANCHO * MARGEN * 2);
// De atrás hacia adelante, para que lo de adelante quede encima
puntos.sort((a, b) => a[2] - b[2]);
const datos = puntos.map(([x, y, z, g, t]) => [
  +((x - minX) * escala + ANCHO * MARGEN).toFixed(2),
  +((maxY - y) * escala + ANCHO * MARGEN).toFixed(2), // el cerebro arriba
  +((z - minZ) / (maxZ - minZ)).toFixed(3),
  g,
  t,
]);

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1 });
await pagina.setContent(`<!doctype html><html><body style="margin:0;background:${FONDO}"><canvas id="c" width="${ANCHO}" height="${ALTO}" style="display:block"></canvas></body></html>`);
await pagina.evaluate(({ datos, colores, brillos, fondo, ancho, alto }) => {
  const lienzo = document.getElementById('c');
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ancho, alto);
  // Un resplandor suave detrás, como en las fotos del juego. En los bordes
  // queda el color exacto del recuadro, para que la foto no se note cortada
  // (es un óvalo que se apaga antes de llegar a los cuatro bordes)
  ctx.save();
  ctx.translate(ancho / 2, alto * 0.46);
  ctx.scale(1, (alto * 0.46) / (ancho * 0.48));
  const luz = ctx.createRadialGradient(0, 0, 0, 0, 0, ancho * 0.48);
  luz.addColorStop(0, 'rgba(46, 60, 130, 0.30)');
  luz.addColorStop(0.6, 'rgba(30, 40, 95, 0.10)');
  luz.addColorStop(1, 'rgba(6, 10, 22, 0)');
  ctx.fillStyle = luz;
  ctx.fillRect(-ancho, -alto * 2, ancho * 2, alto * 4);
  ctx.restore();

  // Un punto de luz por zona, dibujado una vez
  const R = 16;
  const sellos = colores.map((color) => {
    const s = document.createElement('canvas');
    s.width = s.height = R * 2;
    const c = s.getContext('2d');
    const g = c.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, color);
    g.addColorStop(0.22, color + 'cc');
    g.addColorStop(0.55, color + '44');
    g.addColorStop(1, color + '00');
    c.fillStyle = g;
    c.fillRect(0, 0, R * 2, R * 2);
    return s;
  });
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, z, g, t] of datos) {
    const radio = 2.1 + z * 1.5; // lo de adelante, un poco más grande
    ctx.globalAlpha = Math.min(1, (0.2 + z * 0.5) * (0.75 + (t / 255) * 0.25) * brillos[g]);
    ctx.drawImage(sellos[g], x - radio, y - radio, radio * 2, radio * 2);
  }
}, {
  datos,
  colores: info.grupos.map((g) => COLORES[g.id]),
  brillos: info.grupos.map((g) => BRILLO[g.id]),
  fondo: FONDO,
  ancho: ANCHO,
  alto: ALTO,
});
await pagina.locator('#c').screenshot({ path: SALIDA, type: 'jpeg', quality: 88 });
await navegador.close();
console.log(`${SALIDA.replace(RAIZ + '/', '')}: ${ANCHO}×${ALTO} px, ${n} neuronas en ${info.grupos.length} zonas`);
