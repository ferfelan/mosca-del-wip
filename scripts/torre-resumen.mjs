// La ilustración de la mosca con su torre de carpetas, más chica, para la
// primera página del resumen (Etapa 8.7, 2026-11-07). Sale de la misma
// docs/contexto/img/portada-torre.svg (la portada del informe para compartir),
// sin la viñeta oscura del fondo (el resumen va en hoja blanca) y recortada a
// la mosca, la torre, las hojas que caen y la carpeta terminada.
//   node scripts/torre-resumen.mjs
// Si cambia portada-torre.svg (node scripts/portada-svg.mjs), se corre de nuevo.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const FUENTE = join(RAIZ, 'docs/contexto/img/portada-torre.svg');
const SALIDA = join(RAIZ, 'docs/contexto/img/torre-resumen.svg');
// x, y, ancho y alto del recorte, en el dibujo de 840 × 1188
const [X, Y, ANCHO, ALTO] = [110, 296, 630, 778];

let svg = readFileSync(FUENTE, 'utf8');
svg = svg.slice(svg.indexOf('<svg'));
const VINETA = '<rect width="840" height="1188" fill="url(#avin)"></rect>';
const MARCO = '<svg width="840" height="1188" viewBox="0 0 840 1188"';
if (!svg.includes(VINETA) || !svg.includes(MARCO)) throw new Error('portada-torre.svg cambió: revisar la viñeta y el marco');
svg = svg.replace(VINETA, '').replace(MARCO, `<svg width="${ANCHO}" height="${ALTO}" viewBox="${X} ${Y} ${ANCHO} ${ALTO}"`);
const cabecera = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- La mosca con su torre, recortada y sin la viñeta del fondo, para el resumen (8.7, 2026-11-07).\n     Sale de portada-torre.svg con scripts/torre-resumen.mjs. No editar a mano. -->\n`;
writeFileSync(SALIDA, cabecera + svg);
console.log('SVG listo:', SALIDA, `(${svg.length} bytes)`);
