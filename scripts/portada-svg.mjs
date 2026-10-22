// Exporta el arte de portada del informe para compartir como SVG.
// Abre docs/contexto/portada-torre.html (la opción 1, la que eligió Felipe el
// 2026-10-22), saca el <svg> y lo guarda en docs/contexto/img/portada-torre.svg,
// que compartir.html muestra como imagen de fondo de la portada.
//   node scripts/portada-svg.mjs
// Después, para rehacer el PDF: DOC=compartir node scripts/documento.mjs
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const FUENTE = join(RAIZ, 'docs/contexto/portada-torre.html');
const SALIDA = join(RAIZ, 'docs/contexto/img/portada-torre.svg');
const OPCION = process.env.OPCION ?? '1';

const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (e) => console.log('ERROR', e.message));
await p.goto(pathToFileURL(FUENTE).href + `?grande=${OPCION}`, { waitUntil: 'networkidle' });
let svg = await p.evaluate(() => document.querySelector('#grande svg.escena').outerHTML);
await b.close();
// Tamaño propio (840 × 1188 = 210 × 297 mm) para que el <img> lo mida bien
svg = svg.replace('<svg class="escena" viewBox="0 0 840 1188"', '<svg width="840" height="1188" viewBox="0 0 840 1188"');
const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
if (ids.length !== new Set(ids).size) throw new Error('ids repetidos en el svg');
const cabecera = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Arte de portada del informe para compartir (v9, 2026-10-22): la mosca con su torre.\n     Se genera con docs/contexto/portada-torre.html (opción ${OPCION}) y scripts/portada-svg.mjs. No editar a mano. -->\n`;
writeFileSync(SALIDA, cabecera + svg);
console.log('SVG listo:', SALIDA, `(${svg.length} bytes)`);
