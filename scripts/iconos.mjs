// Íconos de la pestaña (2026-10-24). A partir de public/favicon.svg (la mosca
// vista desde arriba: ojos rojos de mosca de la fruta y alas con los colores
// del cerebro) dibuja:
//  - public/favicon.ico: 16, 32 y 48 px, para Safari y todo lo que no lee SVG;
//  - public/apple-touch-icon.png: 180 px y cuadrado lleno (el iPhone le
//    redondea las esquinas solo), para la pantalla de inicio del celular.
// Uso: node scripts/iconos.mjs (después de cambiar public/favicon.svg)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('public/favicon.svg', 'utf8');
// Para el iPhone: sin esquinas redondas y la mosca con un poco más de aire
const svgCuadrado = svg.replace(' rx="14"', '').replace(/matrix\([^)]*\)/, 'matrix(1 0 0 1 0 -1)');

const browser = await chromium.launch();
async function dibujar(fuente, lado) {
  const page = await browser.newPage({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 });
  const url = 'data:image/svg+xml;base64,' + Buffer.from(fuente).toString('base64');
  await page.setContent(`<style>html,body{margin:0;background:transparent}img{display:block}</style><img src="${url}" width="${lado}" height="${lado}">`);
  await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
  const png = await page.screenshot({ omitBackground: true });
  await page.close();
  return png;
}
const tamanos = [16, 32, 48];
const pngs = [];
for (const lado of tamanos) pngs.push(await dibujar(svg, lado));
writeFileSync('public/apple-touch-icon.png', await dibujar(svgCuadrado, 180));
await browser.close();

// El .ico guarda los PNG tal cual (lo leen todos los navegadores de hoy)
const indice = Buffer.alloc(6 + 16 * pngs.length);
indice.writeUInt16LE(1, 2); // tipo: ícono
indice.writeUInt16LE(pngs.length, 4);
let lugar = indice.length;
pngs.forEach((png, i) => {
  const e = 6 + 16 * i;
  indice.writeUInt8(tamanos[i], e);
  indice.writeUInt8(tamanos[i], e + 1);
  indice.writeUInt16LE(1, e + 4); // planos
  indice.writeUInt16LE(32, e + 6); // bits por punto
  indice.writeUInt32LE(png.length, e + 8);
  indice.writeUInt32LE(lugar, e + 12);
  lugar += png.length;
});
writeFileSync('public/favicon.ico', Buffer.concat([indice, ...pngs]));
console.log('íconos listos: public/favicon.ico (16, 32 y 48 px) y public/apple-touch-icon.png (180 px)');
