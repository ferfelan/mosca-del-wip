// Íconos del sitio. Desde el 2026-10-28, el logo «La asomada» que eligió
// Felipe (antes, del 25 al 28 de octubre, "la mosca del juego" vista desde
// arriba). A partir de public/favicon.svg (la mosca café de ojos rojos que se
// asoma por detrás de un post-it amarillo, agarrada del borde, con la trompa
// colgando; sin fondo) dibuja los íconos con la fecha de scripts/sello.mjs en
// el nombre (desde el 2026-10-29, porque WhatsApp y los demás guardan las
// imágenes por su nombre):
//  - public/favicon-<fecha>.ico: 16, 32 y 48 px, para Safari y todo lo que no
//    lee SVG, y public/favicon-<fecha>.svg, copia de public/favicon.svg;
//  - public/apple-touch-icon-<fecha>.png: 180 px, para la pantalla de inicio
//    del iPhone y el iPad. Fondo blanco lleno (el iPhone pinta de negro lo
//    transparente y le redondea las esquinas solo) y la mosca al 80 %, como la
//    vio Felipe en la página de propuestas;
//  - public/icono-192-<fecha>.png y public/icono-512-<fecha>.png: para Android
//    y los demás celulares (manifest.webmanifest, "any"). Lo mismo que el del
//    iPhone, con las esquinas ya redondeadas, para que se vea igual en todos
//    lados;
//  - public/icono-mascara-<fecha>.png: 512 px para Android ("maskable"). Cada
//    marca de Android le pone su forma (círculo, gota, cuadrado redondeado),
//    así que el blanco llega hasta el borde y la mosca queda dentro del círculo
//    seguro (el 80 % del centro), con aire: no se le corta nada con ninguna
//    forma.
// También deja public/favicon.ico y public/apple-touch-icon.png, los nombres de
// siempre, con el mismo dibujo: algunos navegadores y apps los piden así, sin
// leer la página. public/favicon.svg es la fuente y no se toca.
// Uso: node scripts/iconos.mjs (después de cambiar public/favicon.svg y la
// fecha de scripts/sello.mjs)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { ICONOS } from './sello.mjs';

const svg = readFileSync('public/favicon.svg', 'utf8');
const url = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

const browser = await chromium.launch();
// Dibuja la mosca sobre un cuadrado de `lado` px: `mosca` es su tamaño (en
// px), `fondo` el color del cuadrado (o transparente) y `radio` sus esquinas
async function dibujar(lado, { mosca = lado, fondo = 'transparent', radio = 0, dx = 0, dy = 0 } = {}) {
  const page = await browser.newPage({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;background:transparent}
    div{width:${lado}px;height:${lado}px;background:${fondo};border-radius:${radio}px;display:grid;place-items:center}
    img{display:block;width:${mosca}px;height:${mosca}px;transform:translate(${dx}px,${dy}px)}</style>
    <div><img src="${url}"></div>`);
  await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
  const png = await page.screenshot({ omitBackground: true });
  await page.close();
  return png;
}

// Dónde queda la mosca dentro de su cuadro (los puntos que no son
// transparentes): para centrarla de verdad y medir cuánto se aleja del centro
async function medirMosca() {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  await page.setContent(`<canvas width="512" height="512"></canvas><img src="${url}" width="512" height="512">`);
  await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
  const m = await page.evaluate(() => {
    const c = document.querySelector('canvas').getContext('2d');
    c.drawImage(document.images[0], 0, 0, 512, 512);
    const d = c.getImageData(0, 0, 512, 512).data;
    let x0 = 512, y0 = 512, x1 = 0, y1 = 0;
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) if (d[(y * 512 + x) * 4 + 3] > 8) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let r = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (d[(y * 512 + x) * 4 + 3] > 8) r = Math.max(r, Math.hypot(x - cx, y - cy));
    return { cx, cy, r };
  });
  await page.close();
  return { dx: 0.5 - m.cx / 512, dy: 0.5 - m.cy / 512, radio: m.r / 512 }; // en fracciones del cuadro
}
const medida = await medirMosca();

const tamanos = [16, 32, 48];
const pngs = [];
for (const lado of tamanos) pngs.push(await dibujar(lado));
// La mosca al 80 % sobre blanco, centrada por lo que se ve
const sobreBlanco = (lado, radio = 0) =>
  dibujar(lado, { mosca: lado * 0.8, fondo: '#ffffff', radio, dx: medida.dx * lado * 0.8, dy: medida.dy * lado * 0.8 });
const publico = (ruta) => `public${ruta}`;
const iphone = await sobreBlanco(180);
writeFileSync(publico(ICONOS.iphone), iphone);
writeFileSync('public/apple-touch-icon.png', iphone);
writeFileSync(publico(ICONOS.android), await sobreBlanco(192, 192 * 0.225));
writeFileSync(publico(ICONOS.androidGrande), await sobreBlanco(512, 512 * 0.225));
// Máscara: el punto más lejano de la mosca queda al 36 % del lado desde el
// centro (el círculo seguro de Android llega al 40 %)
const moscaMascara = (0.36 / medida.radio) * 512;
writeFileSync(publico(ICONOS.mascara), await dibujar(512, { mosca: moscaMascara, fondo: '#ffffff', dx: medida.dx * moscaMascara, dy: medida.dy * moscaMascara }));
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
const ico = Buffer.concat([indice, ...pngs]);
writeFileSync(publico(ICONOS.ico), ico);
writeFileSync('public/favicon.ico', ico);
writeFileSync(publico(ICONOS.svg), svg);
console.log(
  `íconos listos: ${ICONOS.ico} (16, 32 y 48 px), ${ICONOS.svg}, ${ICONOS.iphone} (180), ${ICONOS.android}, ${ICONOS.androidGrande} y ${ICONOS.mascara} (512; mosca de ${Math.round(moscaMascara)} px), más /favicon.ico y /apple-touch-icon.png con el mismo dibujo`,
);
console.log(`la mosca: centro corrido ${(medida.dx * 100).toFixed(1)} % y ${(medida.dy * 100).toFixed(1)} %; punto más lejano al ${(medida.radio * 100).toFixed(1)} % del centro`);
