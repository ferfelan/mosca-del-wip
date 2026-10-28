// Pone la barra de arriba (el componente de src/barra.js) en las páginas
// escritas a mano: la portada en español (index.html) y los créditos
// (creditos/index.html). Las demás la reciben de los scripts que las arman:
// la portada en inglés de scripts/generar-ingles.mjs y la guía, el informe,
// el taller y la 404 de scripts/plantilla.mjs.
//
// En esas dos páginas la barra va entre dos marcas:
//   <!-- BARRA: ... -->  ...  <!-- /BARRA -->
// y lo que hay entre ellas se reemplaza entero. NO editar la barra ahí: los
// cambios van en src/barra.js (HTML y comportamiento) y src/barra.css.
// Corre solo antes de npm run dev y npm run build (predev y prebuild en
// package.json), o a mano con
//   node scripts/poner-barra.mjs
// Solo escribe un archivo si la barra cambió (así npm run dev no recarga la
// página por nada).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { barraConSangria } from '../src/barra.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
export const INICIO_BARRA = '<!-- BARRA: la pone scripts/poner-barra.mjs con src/barra.js. No editar aquí: los cambios van en src/barra.js y src/barra.css -->';
export const FIN_BARRA = '<!-- /BARRA -->';

const PAGINAS = [
  { archivo: 'index.html', idioma: 'es', pagina: 'portada' },
  { archivo: 'creditos/index.html', idioma: 'es', pagina: 'creditos' },
];

// Devuelve el HTML con la barra de ese idioma y esa página entre las marcas
export function conBarra(html, opciones, archivo = 'la página') {
  const i = html.indexOf(INICIO_BARRA);
  const j = html.indexOf(FIN_BARRA, i);
  if (i < 0 || j < 0) throw new Error(`${archivo}: faltan las marcas de la barra (${INICIO_BARRA.slice(0, 14)}… y ${FIN_BARRA})`);
  if (html.indexOf(INICIO_BARRA, i + 1) >= 0) throw new Error(`${archivo}: las marcas de la barra están dos veces`);
  // la sangría de la marca de inicio
  const sangria = html.slice(html.lastIndexOf('\n', i) + 1, i);
  return html.slice(0, i + INICIO_BARRA.length) + '\n' + barraConSangria(opciones, sangria) + '\n' + sangria + html.slice(j);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const { archivo, idioma, pagina } of PAGINAS) {
    const ruta = join(RAIZ, archivo);
    const antes = readFileSync(ruta, 'utf8');
    const ahora = conBarra(antes, { idioma, pagina }, archivo);
    if (ahora !== antes) {
      writeFileSync(ruta, ahora);
      console.log(`barra puesta en ${archivo}`);
    } else console.log(`barra al día en ${archivo}`);
  }
}
