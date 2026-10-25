// Revisa la portada (/) en muchos tamaños de pantalla: celulares chicos y
// grandes (en vertical y en horizontal), tablets, notebooks y pantallas
// grandes. En cada tamaño mide que:
//   - no se pueda desplazar la página hacia el lado,
//   - ningún texto quede encima de otro ni cortado en el borde,
//   - ninguna letra baje de 12 px,
//   - en pantallas táctiles los botones y el control midan 44 px de alto,
//   - en celular vertical el botón Jugar quede en la primera pantalla,
//   - el cerebro se encienda y no haya errores,
//   - en inglés no quede ningún texto en español (salvo nombres propios),
// y saca una foto de la primera pantalla y otra de la página completa.
// Lo hace con cada fondo (negro y blanco) y cada idioma (español e inglés).
// Uso (con npm run dev, o con la dirección publicada):
//   node scripts/portada-responsiva.mjs [dirección] [carpeta de fotos] [solo] [combinaciones]
// "solo" revisa únicamente los tamaños cuyo nombre contiene alguno de esos
// textos, separados por coma (por ejemplo: computador-9,1024x768); "todos"
// revisa todos. "combinaciones" elige fondo e idioma (por omisión
// oscuro-es,claro-es,oscuro-en,claro-en).
// Con NAVEGADOR=webkit revisa con el motor de Safari, el que usan todos los
// navegadores del iPhone (la primera vez: npx playwright install webkit).
import { chromium, webkit } from 'playwright';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DIRECCION = process.argv[2] || 'http://localhost:5173/';
const CARPETA = process.argv[3] || join(tmpdir(), 'portada-responsiva');
mkdirSync(CARPETA, { recursive: true });

// [nombre, ancho, alto, táctil]
const TAMANOS = [
  ['celular-320x568', 320, 568, true],
  ['celular-360x800', 360, 800, true],
  ['celular-375x667', 375, 667, true],
  ['celular-390x844', 390, 844, true],
  ['celular-414x896', 414, 896, true],
  ['celular-430x932', 430, 932, true],
  ['celular-horizontal-667x375', 667, 375, true],
  ['celular-horizontal-844x390', 844, 390, true],
  ['celular-horizontal-932x430', 932, 430, true],
  ['tablet-600x960', 600, 960, true],
  ['tablet-768x1024', 768, 1024, true],
  ['tablet-820x1180', 820, 1180, true],
  ['tablet-horizontal-1024x768', 1024, 768, true],
  ['tablet-horizontal-1180x820', 1180, 820, true],
  ['tablet-horizontal-1366x1024', 1366, 1024, true],
  ['computador-900x700', 900, 700, false],
  ['computador-1024x640', 1024, 640, false],
  ['computador-1280x720', 1280, 720, false],
  ['computador-1366x768', 1366, 768, false],
  ['computador-1440x900', 1440, 900, false],
  ['computador-1536x864', 1536, 864, false],
  ['computador-1906x830', 1906, 830, false],
  ['computador-1920x1080', 1920, 1080, false],
  ['computador-2560x1440', 2560, 1440, false],
];

// Corre dentro de la página
function medir({ tactil, celularVertical, idioma }) {
  const problemas = [];
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw) {
    problemas.push(`se puede desplazar hacia el lado (${document.documentElement.scrollWidth} px en ${vw} px)`);
  }
  const seVe = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const corto = (t) => t.trim().replace(/\s+/g, ' ').slice(0, 32);

  // Cada línea de texto, con su caja real
  const lineas = [];
  const recorrido = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let nodo; (nodo = recorrido.nextNode()); ) {
    const el = nodo.parentElement;
    if (!nodo.textContent.trim() || el.closest('.solo-lector, script, style') || !seVe(el)) continue;
    const tamano = parseFloat(getComputedStyle(el).fontSize);
    if (tamano < 12) problemas.push(`letra de ${tamano} px: «${corto(nodo.textContent)}»`);
    const rango = document.createRange();
    rango.selectNodeContents(nodo);
    for (const r of rango.getClientRects()) {
      if (r.width < 2 || r.height < 2) continue;
      // El bloque de texto al que pertenece (dentro de un mismo párrafo las
      // líneas pueden ir apretadas a propósito, como el título o una cifra
      // grande con su etiqueta)
      const bloque = el.closest('p, h1, h2, h3, li, dt, dd, label, figcaption, output, a');
      lineas.push({ nodo, bloque, r, texto: corto(nodo.textContent) });
      if (r.left < -1 || r.right > vw + 1) problemas.push(`texto cortado en el borde: «${corto(nodo.textContent)}»`);
    }
  }
  // Textos encima de otros (se ignoran roces de 1 o 2 px entre líneas juntas)
  const vistos = new Set();
  for (let i = 0; i < lineas.length; i++) {
    for (let j = i + 1; j < lineas.length; j++) {
      const a = lineas[i];
      const b = lineas[j];
      if (a.nodo === b.nodo || (a.bloque && a.bloque === b.bloque)) continue;
      // La caja de una línea incluye el aire de arriba de la letra: se le quita
      const arriba = (x) => x.r.top + 0.15 * x.r.height;
      const ancho = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const alto = Math.min(a.r.bottom, b.r.bottom) - Math.max(arriba(a), arriba(b));
      if (ancho > 3 && alto > 0.3 * Math.min(a.r.height, b.r.height)) {
        const clave = `${a.texto}|${b.texto}`;
        if (!vistos.has(clave)) problemas.push(`texto encima de otro: «${a.texto}» y «${b.texto}»`);
        vistos.add(clave);
      }
    }
  }
  if (tactil) {
    for (const el of document.querySelectorAll('.boton, input[type=range], .selector button')) {
      if (!seVe(el)) continue;
      const alto = el.getBoundingClientRect().height;
      if (alto < 44) problemas.push(`difícil de tocar (${Math.round(alto)} px de alto): «${corto(el.textContent || el.id)}»`);
    }
  }
  if (celularVertical) {
    const boton = [...document.querySelectorAll('.hero .boton.principal')].find(seVe);
    const abajo = boton ? boton.getBoundingClientRect().bottom + window.scrollY : Infinity;
    if (abajo > window.innerHeight) problemas.push(`el botón Jugar queda bajo la primera pantalla (${Math.round(abajo)} px de ${window.innerHeight})`);
  }
  if (!document.querySelector('.cerebro.vivo')) problemas.push('el cerebro no se encendió (queda la foto fija)');
  if (document.documentElement.lang !== idioma) problemas.push(`la página dice lang="${document.documentElement.lang}" y debía ser ${idioma}`);
  // En inglés: ninguna palabra en español a la vista ni en lo que lee un lector de pantalla
  if (idioma === 'en') {
    const ESPANOL = /\b(tareas?|terminadas?|estrés|cigarros|juego|informe|cerebro|neuronas|Descargar|Jugar|Promedio|límite|simulación|Hecho por|Sin cookies|Colores|Visión|Memoria|Mando|Movimiento|reposo|a la vez|Gratis|Fondo|Idioma|mosca|oficina|páginas)\b/i;
    const textos = [];
    const recorrido = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (recorrido.nextNode()) {
      const nodo = recorrido.currentNode;
      if (nodo.parentElement.closest('script, style') || !seVe(nodo.parentElement)) continue;
      textos.push(nodo.textContent);
    }
    for (const el of document.querySelectorAll('[aria-label], [title], img[alt]')) textos.push(el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.getAttribute('alt') || '');
    for (const t of textos) {
      const limpio = t.replace(/Mosca del WIP|Male CNS|Felipe Fernández|Español/g, '');
      if (ESPANOL.test(limpio)) problemas.push(`en inglés quedó en español: «${corto(t)}»`);
    }
  }
  return problemas;
}

const SOLO = process.argv[4] && process.argv[4] !== 'todos' ? process.argv[4].split(',') : null;
const COMBINACIONES = (process.argv[5] || 'oscuro-es,claro-es,oscuro-en,claro-en').split(',').map((c) => c.split('-'));
const REVISAR = SOLO ? TAMANOS.filter(([nombre]) => SOLO.some((s) => nombre.includes(s))) : TAMANOS;

const navegador =
  process.env.NAVEGADOR === 'webkit'
    ? await webkit.launch()
    : await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
let total = 0;
for (const [fondo, idioma] of COMBINACIONES) for (const [nombreTamano, ancho, alto, tactil] of REVISAR) {
  const nombre = `${fondo}-${idioma}-${nombreTamano}`;
  const contexto = await navegador.newContext({
    viewport: { width: ancho, height: alto },
    deviceScaleFactor: 1,
    isMobile: tactil,
    hasTouch: tactil,
  });
  // El fondo y el idioma como si la persona los hubiera elegido antes
  await contexto.addInitScript(([f, i]) => {
    localStorage.setItem('mosca-fondo', f);
    localStorage.setItem('mosca-idioma', i);
  }, [fondo, idioma]);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await pagina.goto(DIRECCION, { waitUntil: 'load' });
  // El cerebro solo se dibuja cuando se ve (en celular horizontal queda más abajo)
  await pagina.evaluate(() => document.querySelector('.cerebro').scrollIntoView({ block: 'center' }));
  await pagina.waitForFunction(() => document.querySelector('.cerebro.vivo'), null, { timeout: 25000 }).catch(() => {});
  await pagina.waitForTimeout(4800); // la consola sube sola hasta 9 (la palabra más larga: "Colapsada")
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForTimeout(300);
  const problemas = await pagina.evaluate(medir, { tactil, celularVertical: tactil && ancho < 600 && alto > ancho, idioma });
  problemas.push(...errores.map((e) => `error: ${e}`));
  await pagina.screenshot({ path: join(CARPETA, `${nombre}-pantalla.png`) });
  await pagina.screenshot({ path: join(CARPETA, `${nombre}-completa.png`), fullPage: true });
  total += problemas.length;
  console.log(`${problemas.length ? 'REVISAR' : 'ok     '} ${nombre}`);
  for (const p of problemas) console.log(`        - ${p}`);
  await contexto.close();
}
await navegador.close();
console.log(`\nFotos en ${CARPETA}`);
console.log(total ? `${total} cosas para revisar` : `portada: todo bien en los ${REVISAR.length} tamaños, con ${COMBINACIONES.length} combinaciones de fondo e idioma`);
