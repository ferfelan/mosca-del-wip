// Deriva la ilustración para la WEB (public/img/portada-torre.svg) desde la del
// informe (docs/contexto/img/portada-torre.svg), que no se toca:
//   - sin la viñeta de fondo (el borde oscuro que dibujaba un recuadro), para
//     que la mosca se funda con el fondo de la página;
//   - el piso y su línea se desvanecen en los costados, para que no marquen
//     el borde de la imagen.
// Uso: node scripts/portada-svg-web.mjs   (repetir si cambia la ilustración)
import { readFileSync, writeFileSync } from 'node:fs';

const origen = new URL('../docs/contexto/img/portada-torre.svg', import.meta.url);
const destino = new URL('../public/img/portada-torre.svg', import.meta.url);
let svg = readFileSync(origen, 'utf8');

const vineta = '<rect width="840" height="1188" fill="url(#avin)"></rect>';
if (!svg.includes(vineta)) throw new Error('No encontré la viñeta de fondo (#avin)');
svg = svg.replace(vineta, '');

const piso =
  '<rect x="0" y="1000" width="840" height="70" fill="url(#apiso)"></rect>' +
  '<line x1="60" y1="1000" x2="780" y2="1000" stroke="#d9d3c6" stroke-width="1.6"></line>';
if (!svg.includes(piso)) throw new Error('No encontré el piso (#apiso) y su línea');
svg = svg.replace(piso, `<g mask="url(#afade)">${piso}</g>`);

const desvanecido =
  '<linearGradient id="afadeX" x1="0" y1="0" x2="1" y2="0">' +
  '<stop offset="0" stop-color="#fff" stop-opacity="0"></stop>' +
  '<stop offset=".16" stop-color="#fff"></stop>' +
  '<stop offset=".84" stop-color="#fff"></stop>' +
  '<stop offset="1" stop-color="#fff" stop-opacity="0"></stop></linearGradient>' +
  '<mask id="afade" maskUnits="userSpaceOnUse" x="0" y="0" width="840" height="1188">' +
  '<rect width="840" height="1188" fill="url(#afadeX)"></rect></mask></defs>';
svg = svg.replace('</defs>', desvanecido);

svg = svg.replace(
  'No editar a mano. -->',
  'No editar a mano. -->\n<!-- Versión para la web (portada del sitio): la genera scripts/portada-svg-web.mjs\n     a partir de la del informe, sin la viñeta de fondo y con el piso desvanecido en los costados. -->'
);
writeFileSync(destino, svg);
console.log(`listo: public/img/portada-torre.svg (${svg.length} caracteres)`);
