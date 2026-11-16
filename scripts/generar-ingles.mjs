// Arma la portada en inglés, en/index.html, a partir de index.html (la
// portada en español) y de src/portada-textos.js (el inglés de cada texto).
// Desde la Etapa 7 (2026-10-28) cada idioma tiene su dirección: / y /en/.
//
// NO EDITAR en/index.html A MANO: se vuelve a armar solo antes de npm run dev
// y de npm run build (predev y prebuild en package.json), o a mano con
//   node scripts/generar-ingles.mjs
// Si un texto nuevo de index.html no tiene su inglés, el script se detiene y
// dice cuál falta.
//
// Qué cambia respecto del español:
//  - <html lang="en" data-idioma-pagina="en">, el título, la descripción, el
//    canonical (/en/), las vistas previas y los datos estructurados;
//  - cada [data-t] lleva su inglés; data-t-aria, data-t-title y data-t-alt
//    cambian ese atributo; las fotos con data-src-en usan esa foto;
//  - la consola del inicio (lo que portada.js reescribe al moverla: el
//    límite, el estrés, los números y lo que lee un lector de pantalla) ya
//    viene en inglés en el HTML, con los mismos textos de portada.js;
//  - el informe en PDF es el de inglés (Report), con su tapa;
//  - los enlaces van a las páginas en inglés (/en/wip-limit/, /en/report/,
//    /en/workshop/), al juego y a los créditos con ?lang=en;
//  - la barra de arriba es la de todo el sitio en inglés (src/barra.js, la
//    misma función que la pone en español con scripts/poner-barra.mjs).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { INGLES, DINAMICOS } from '../src/portada-textos.js';
import { conBarra } from './poner-barra.mjs';
import { vistaPrevia } from './sello.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const ORIGEN = join(RAIZ, 'index.html');
const DESTINO = join(RAIZ, 'en', 'index.html');
const SITIO = 'https://mosca.deliverycraft.ai';

// Desde la 8.7 (2026-11-07), el mensaje de la portada: la pregunta "Busy all
// day. So what did you finish?" y una bajada que dice qué hacer (en español,
// "Ocupado todo el día. ¿Y qué terminaste?" y "Mide cuántas cosas tiene
// empezadas tu equipo…"). El título de la pestaña sigue partiendo por "WIP
// limit", que es lo que la gente busca.
const TITULO = 'WIP limit · Busy all day. So what did you finish? · Mosca del WIP';
const DESCRIPCION =
  'Measure how many things your team has in progress and find the WIP limit that gets the most done. Start with a one-minute game. Free guide, report and workshop.';
const TITULO_COMPARTIR = 'Busy all day. So what did you finish? · Mosca del WIP';
const DESCRIPCION_COMPARTIR = INGLES.bajada;
const ALT_VISTA_PREVIA = `The fly from the game at her desk, with many tasks at once, next to the title ${INGLES.titulo.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')} A 1-minute game, mosca.deliverycraft.ai.`;
const DESCRIPCION_SITIO =
  'Busy all day. So what did you finish? A one-minute game with the real map of a fly’s brain to measure work in progress (WIP) and find the limit that lets your team finish the most, with a free guide, report and workshop.';
// Si existe la vista previa en inglés (scripts/vistas-previas.mjs), se usa esa
// (los nombres, con su fecha, salen de scripts/sello.mjs)
const VISTA_PREVIA = existsSync(join(RAIZ, 'public', vistaPrevia('en'))) ? vistaPrevia('en') : vistaPrevia();

// Los enlaces internos en inglés (los de a[data-idioma] no cambian)
const RUTAS = {
  '/jugar/': '/jugar/?lang=en',
  '/limite-wip/': '/en/wip-limit/',
  '/informe/': '/en/report/',
  '/taller/': '/en/workshop/',
  '/creditos/': '/creditos/?lang=en',
};
const INFORME_EN = { pdf: '/Mosca-del-WIP-Report.pdf', nombre: 'Mosca del WIP - Report.pdf', tapa: '/img/tapa-report.jpg' };
const RESUMEN_EN = { pdf: '/Mosca-del-WIP-Summary.pdf', nombre: 'Mosca del WIP - Summary.pdf' }; // 8.6: el resumen aparte (desde la 8.11, el resumen ejecutivo de 2 páginas)

let html = readFileSync(ORIGEN, 'utf8');

// ---------- Herramientas ----------
const VACIOS = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'track', 'wbr']);
const escaparAtributo = (v) => String(v).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/"/g, '&quot;');

// Cambia un texto que tiene que estar una sola vez
function unaVez(desde, hasta) {
  const n = html.split(desde).length - 1;
  if (n !== 1) throw new Error(`"${desde.slice(0, 70)}" aparece ${n} veces en index.html y debía aparecer 1`);
  html = html.replace(desde, hasta);
}

// Dónde cierra la etiqueta abierta en "desde" (cuenta las anidadas del mismo nombre)
function cierreDe(texto, desde, nombre) {
  const re = new RegExp(`<(/?)${nombre}\\b[^>]*>`, 'gi');
  re.lastIndex = desde;
  let profundidad = 1;
  let m;
  while ((m = re.exec(texto))) {
    if (m[0].endsWith('/>')) continue;
    if (m[1] === '/') {
      profundidad--;
      if (profundidad === 0) return m.index;
    } else profundidad++;
  }
  throw new Error(`no encontré el cierre de <${nombre}> (desde el carácter ${desde})`);
}

// Reemplaza el contenido de cada etiqueta que tiene atributo="clave" por lo
// que devuelva valor(clave); si devuelve null, no cambia
function reemplazarContenido(atributo, valor) {
  const re = new RegExp(`<([a-zA-Z][\\w-]*)\\b[^>]*?\\s${atributo}="([^"]*)"[^>]*>`, 'g');
  let salida = '';
  let pos = 0;
  let m;
  while ((m = re.exec(html))) {
    const [etiqueta, nombre, clave] = m;
    if (VACIOS.has(nombre.toLowerCase()) || etiqueta.endsWith('/>')) continue;
    const nuevo = valor(clave);
    if (nuevo == null) continue;
    const finEtiqueta = m.index + etiqueta.length;
    const cierre = cierreDe(html, finEtiqueta, nombre);
    salida += html.slice(pos, finEtiqueta) + nuevo;
    pos = cierre;
    re.lastIndex = cierre;
  }
  html = salida + html.slice(pos);
}

// Aplica fn a cada etiqueta de apertura que cumpla el patrón (fn recibe la
// etiqueta y el resultado del patrón y devuelve la etiqueta nueva)
function enEtiquetas(patron, fn) {
  html = html.replace(/<[a-zA-Z][\w-]*\b[^>]*>/g, (etiqueta) => {
    const m = etiqueta.match(patron);
    return m ? fn(etiqueta, m) : etiqueta;
  });
}

function ponerAtributo(etiqueta, nombre, valor) {
  const v = escaparAtributo(valor);
  const re = new RegExp(`\\s${nombre}="[^"]*"`);
  if (re.test(etiqueta)) return etiqueta.replace(re, ` ${nombre}="${v}"`);
  return etiqueta.replace(/\s*\/?>$/, (fin) => ` ${nombre}="${v}"${fin}`);
}
const quitarAtributo = (etiqueta, nombre) => etiqueta.replace(new RegExp(`\\s${nombre}(="[^"]*")?(?=[\\s/>])`), '');

const ingles = (clave) => {
  if (!(clave in INGLES)) throw new Error(`falta el inglés de "${clave}" en src/portada-textos.js`);
  return INGLES[clave];
};

// ---------- El <head> ----------
unaVez('<html lang="es" data-idioma-pagina="es">', '<html lang="en" data-idioma-pagina="en">');
unaVez(/<title>[^<]*<\/title>/.exec(html)[0], `<title>${TITULO}</title>`);
unaVez(/<meta name="description" content="[^"]*" \/>/.exec(html)[0], `<meta name="description" content="${escaparAtributo(DESCRIPCION)}" />`);
unaVez(`<link rel="canonical" href="${SITIO}/" />`, `<link rel="canonical" href="${SITIO}/en/" />`);
unaVez('<meta property="og:locale" content="es_CL" />\n    <meta property="og:locale:alternate" content="en_US" />',
  '<meta property="og:locale" content="en_US" />\n    <meta property="og:locale:alternate" content="es_CL" />');
unaVez(`<meta property="og:url" content="${SITIO}/" />`, `<meta property="og:url" content="${SITIO}/en/" />`);
unaVez(/<meta property="og:title" content="[^"]*" \/>/.exec(html)[0], `<meta property="og:title" content="${escaparAtributo(TITULO_COMPARTIR)}" />`);
unaVez(/<meta name="twitter:title" content="[^"]*" \/>/.exec(html)[0], `<meta name="twitter:title" content="${escaparAtributo(TITULO_COMPARTIR)}" />`);
unaVez(/<meta property="og:description" content="[^"]*" \/>/.exec(html)[0], `<meta property="og:description" content="${escaparAtributo(DESCRIPCION_COMPARTIR)}" />`);
unaVez(/<meta name="twitter:description" content="[^"]*" \/>/.exec(html)[0], `<meta name="twitter:description" content="${escaparAtributo(DESCRIPCION_COMPARTIR)}" />`);
unaVez(/<meta property="og:image:alt" content="[^"]*" \/>/.exec(html)[0], `<meta property="og:image:alt" content="${escaparAtributo(ALT_VISTA_PREVIA)}" />`);
for (const propiedad of ['property="og:image"', 'name="twitter:image"']) {
  unaVez(`<meta ${propiedad} content="${SITIO}${vistaPrevia()}" />`, `<meta ${propiedad} content="${SITIO}${VISTA_PREVIA}" />`);
}

// Los datos estructurados: la página en inglés, el juego y el autor
html = html.replace(/\{\s*"@type": "WebPage"[\s\S]*?\n        \}/, (bloque) =>
  bloque
    .replace(`"@id": "${SITIO}/#pagina"`, `"@id": "${SITIO}/en/#pagina"`)
    .replace(`"url": "${SITIO}/"`, `"url": "${SITIO}/en/"`)
    .replace(/"name": "[^"]*"/, `"name": ${JSON.stringify(TITULO)}`)
    .replace(/"description": "[^"]*"/, `"description": ${JSON.stringify(DESCRIPCION)}`)
    .replace('"inLanguage": "es"', '"inLanguage": "en"')
    .replace(`"primaryImageOfPage": "${SITIO}${vistaPrevia()}"`, `"primaryImageOfPage": "${SITIO}${VISTA_PREVIA}"`),
);
html = html.replace(/\{\s*"@type": "WebSite"[\s\S]*?\n        \}/, (bloque) =>
  bloque.replace(
    /"description": "[^"]*"/,
    `"description": ${JSON.stringify(DESCRIPCION_SITIO)}`,
  ),
);
html = html.replace(/\{\s*"@type": "VideoGame"[\s\S]*?\n        \}/, (bloque) =>
  bloque
    .replace(
      /"description": "[^"]*"/,
      `"description": ${JSON.stringify('An office fly with a real brain spends a day at the office. You choose how many tasks she has in progress at once, from 1 to 10, and see how many she finishes, how long each one takes and how stressed she gets. A one-minute game to teach the WIP limit.')}`,
    )
    // La tapa del juego tiene el tablero en español: en /en/ va la vista
    // previa en inglés (revisión final v3, M16)
    .replace(`"image": "${SITIO}/img/tapa-juego.jpg"`, `"image": "${SITIO}${VISTA_PREVIA}"`),
);
unaVez('"jobTitle": "Coach de equipos"', '"jobTitle": "Team coach"');

// ---------- Los textos ----------
reemplazarContenido('data-t', ingles);
enEtiquetas(/\sdata-t-aria="([^"]*)"/, (etiqueta, m) => ponerAtributo(etiqueta, 'aria-label', ingles(m[1])));
enEtiquetas(/\sdata-t-title="([^"]*)"/, (etiqueta, m) => ponerAtributo(etiqueta, 'title', ingles(m[1])));
enEtiquetas(/\sdata-t-alt="([^"]*)"/, (etiqueta, m) => ponerAtributo(etiqueta, 'alt', ingles(m[1])));
// Las fotos sacadas del juego en inglés (data-src-en) y el video (lo elige portada.js)
enEtiquetas(/^<img\b[^>]*\sdata-src-en="([^"]*)"/, (etiqueta, m) => ponerAtributo(etiqueta, 'src', m[1]));
// El informe en inglés, con su tapa
enEtiquetas(/\sdata-informe(?=[\s/>])/, (etiqueta) => {
  let e = ponerAtributo(etiqueta, 'href', INFORME_EN.pdf);
  if (/\sdownload="/.test(e)) e = ponerAtributo(e, 'download', INFORME_EN.nombre);
  return e;
});
enEtiquetas(/\sdata-tapa(?=[\s/>])/, (etiqueta) => ponerAtributo(etiqueta, 'src', INFORME_EN.tapa));
// El resumen en inglés (8.6: de 4 páginas. 8.11: el resumen ejecutivo, de 2)
enEtiquetas(/\sdata-resumen-pdf(?=[\s/>])/, (etiqueta) => ponerAtributo(ponerAtributo(etiqueta, 'href', RESUMEN_EN.pdf), 'download', RESUMEN_EN.nombre));
// ES | EN: marca EN
enEtiquetas(/\sdata-idioma="es"/, (etiqueta) => quitarAtributo(etiqueta, 'aria-current'));
enEtiquetas(/\sdata-idioma="en"/, (etiqueta) => ponerAtributo(etiqueta, 'aria-current', 'page'));
// Los enlaces internos
enEtiquetas(/^<a\b[^>]*\shref="([^"]*)"/, (etiqueta, m) => {
  if (/\sdata-idioma=/.test(etiqueta)) return etiqueta;
  if (/\sdata-logo(?=[\s/>])/.test(etiqueta)) return ponerAtributo(etiqueta, 'href', '/en/');
  return m[1] in RUTAS ? ponerAtributo(etiqueta, 'href', RUTAS[m[1]]) : etiqueta;
});

// ---------- La consola del inicio ----------
// portada.js escribe estos textos al mover la consola, pero el HTML tiene que
// llegar ya en inglés: lo leen los buscadores, los lectores de pantalla y
// quien todavía no tiene el JavaScript (2026-10-29: /en/ decía "Dentro del
// límite sostenible (3)" y "Tranquila" hasta que corría el script). Se
// traduce el estado de partida del español con los mismos textos de
// portada.js (DINAMICOS) y los números con el formato inglés (18.0, 1,328).
const ES = DINAMICOS.es;
const EN = DINAMICOS.en;
const NIVELES = ['Tranquila', 'Ocupada', 'Estresada', 'Colapsada'];
const numeroEspanol = (texto) => Number(texto.trim().replace(/\./g, '').replace(',', '.'));
const enIngles = (decimales) => (texto) => {
  const n = numeroEspanol(texto);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n);
};
// Cambia el texto de la etiqueta que lleva el atributo (una sola en la página)
function textoDeConsola(atributo, traducir) {
  const re = new RegExp(`(<[a-zA-Z][\\w-]*\\b[^>]*\\s${atributo}(?=[\\s>=])[^>]*>)([^<]*)(</)`, 'g');
  const encontrados = [...html.matchAll(re)];
  if (encontrados.length !== 1) throw new Error(`[${atributo}] aparece ${encontrados.length} veces en index.html y debía aparecer 1`);
  const [, abre, texto] = encontrados[0];
  const nuevo = traducir(texto);
  if (nuevo == null) throw new Error(`el texto de partida de [${atributo}], "${texto}", no es uno de los que escribe portada.js`);
  html = html.replace(re, () => `${abre}${nuevo}</`);
}
textoDeConsola('data-limite', (t) => (t === ES.limite(true) ? EN.limite(true) : t === ES.limite(false) ? EN.limite(false) : null));
textoDeConsola('data-estres', (t) => (NIVELES.includes(t) ? EN.nivel(t) : null));
textoDeConsola('data-terminadas', enIngles(1));
textoDeConsola('data-neuronas', enIngles(0));
// El control: lo que dice un lector de pantalla ("2 tasks at once")
enEtiquetas(/^<input\b[^>]*\sid="wip"/, (etiqueta) => {
  const valor = Number(etiqueta.match(/\svalue="(\d+)"/)?.[1]);
  const actual = etiqueta.match(/\saria-valuetext="([^"]*)"/)?.[1];
  if (actual !== ES.tareas(valor)) throw new Error(`el control de la consola dice "${actual}" y portada.js escribiría "${ES.tareas(valor)}"`);
  return ponerAtributo(etiqueta, 'aria-valuetext', EN.tareas(valor));
});

// La barra de arriba: el componente común, en inglés (reemplaza la del español)
html = conBarra(html, { idioma: 'en', pagina: 'portada' }, 'en/index.html');

// ---------- Revisión ----------
const sobras = [...html.matchAll(/\sdata-t="([^"]*)"/g)].map((m) => m[1]).filter((k) => !(k in INGLES));
if (sobras.length) throw new Error(`quedaron textos sin inglés: ${sobras.join(', ')}`);
if (/lang="es"/.test(html.slice(0, 80))) throw new Error('la página sigue diciendo lang="es"');
// Nada de la consola en español (ni en lo que lee un lector de pantalla)
for (const resto of [ES.limite(true), ES.limite(false), ...NIVELES.map((n) => `>${n}<`), ...Array.from({ length: 10 }, (_, i) => `"${ES.tareas(i + 1)}"`)]) {
  if (html.includes(resto)) throw new Error(`en/index.html todavía dice ${resto} (la consola en español)`);
}

html = html.replace(
  '<!doctype html>\n',
  '<!doctype html>\n<!-- GENERADO por scripts/generar-ingles.mjs a partir de index.html y src/portada-textos.js. NO EDITAR A MANO: los cambios van en esos dos archivos. -->\n',
);
mkdirSync(join(RAIZ, 'en'), { recursive: true });
writeFileSync(DESTINO, html);
console.log(`en/index.html armado (${(html.length / 1024).toFixed(0)} KB, vista previa ${VISTA_PREVIA})`);
