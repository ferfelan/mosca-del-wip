// Revisa la portada (/) en muchos tamaños de pantalla: celulares chicos y
// grandes (en vertical y en horizontal), tablets, notebooks y pantallas
// grandes. En cada tamaño mide que:
//   - no se pueda desplazar la página hacia el lado,
//   - ningún texto quede encima de otro ni cortado en el borde,
//   - ninguna letra baje de 12 px,
//   - en pantallas táctiles los botones y el control midan 44 px de alto,
//   - en celular vertical haya un Jugar en la primera pantalla: el grande
//     entero o, si no cabe (desde la 5.2g, por ejemplo en 320×568), el de la
//     barra,
//   - el dibujo del inicio ("¿Te suena?") parta y se lea bien (8.13),
//   - el cerebro se encienda (desde la 8.13 está en "¿Por qué una mosca?") y
//     no haya errores,
//   - al bajar por la página, cada dibujo se cargue (8.11: las fichas, las
//     barras, los números que cuentan) y ninguno quede a medio camino,
//   - en inglés no quede ningún texto en español (salvo nombres propios),
//   - las respuestas de las preguntas frecuentes (se revisan abiertas) y,
//     bajo 1100 px, el menú de la barra abierto (parte 5.2f) cumplan lo mismo,
// y saca una foto de la primera pantalla, otra de la página completa (con
// las respuestas abiertas) y, bajo 1100 px, otra con el menú abierto.
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

// Corre dentro de la página. Con "raiz" mide solo lo que está dentro de ese
// elemento (el menú abierto tapa la página a propósito).
function medir({ tactil, celularVertical, idioma, raiz }) {
  const problemas = [];
  const base = raiz ? document.querySelector(raiz) : document.body;
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
  const recorrido = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
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
    for (const el of base.querySelectorAll('.boton, input[type=range], .selector button, .menu-boton, .menu-enlaces a, .logo, .pregunta summary')) {
      if (!seVe(el)) continue;
      // (a la décima de píxel: mientras el menú baja, el motor de Safari mide
      // un enlace de 44 px en 43,99998, y eso no es un botón chico. Avisaba
      // "difícil de tocar (44 px de alto)" al azar, también en el sitio real)
      const alto = Math.round(el.getBoundingClientRect().height * 10) / 10;
      if (alto < 44) problemas.push(`difícil de tocar (${alto} px de alto): «${corto(el.textContent || el.id)}»`);
    }
  }
  if (celularVertical && !raiz) {
    const boton = [...document.querySelectorAll('.hero .boton.principal')].find(seVe);
    const abajo = boton ? boton.getBoundingClientRect().bottom + window.scrollY : Infinity;
    const enBarra = document.querySelector('.barra-jugar');
    if (abajo > window.innerHeight && !(enBarra && seVe(enBarra))) problemas.push(`el botón Jugar queda bajo la primera pantalla (${Math.round(abajo)} px de ${window.innerHeight}) y la barra no muestra el suyo`);
  }
  if (!raiz && !document.querySelector('.cerebro.vivo')) problemas.push('el cerebro no se encendió (queda la foto fija)');
  if (!raiz && !document.querySelector('.suena.viva')) problemas.push('el dibujo del inicio no partió (quedó sin su botón de pausa)');
  if (document.documentElement.lang !== idioma) problemas.push(`la página dice lang="${document.documentElement.lang}" y debía ser ${idioma}`);
  // En inglés: ninguna palabra en español a la vista ni en lo que lee un lector de pantalla
  if (idioma === 'en') {
    const ESPANOL = /\b(tareas?|terminadas?|estrés|cigarros|juego|informe|cerebro|neuronas|Descargar|Jugar|Promedio|límite|simulación|Hecho por|Sin cookies|Colores|Visión|Memoria|Mando|Movimiento|reposo|a la vez|Gratis|Fondo|Idioma|mosca|oficina|páginas|Preguntas|frecuentes|Saltar|contenido|Secciones|computador|celular|navegador|equipo|respaldo|supuesto|inicio|taller|presentación|minutos?|pronto|líderes|semanas|piezas|pasos|hojas|imprimir|antenas)\b|Menú/i;
    const textos = [];
    const recorrido = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
    while (recorrido.nextNode()) {
      const nodo = recorrido.currentNode;
      // (el nombre de la credencial de "¿Por qué una mosca?" es "Mosca" en los dos
      // idiomas, como en el nombre del sitio: un nombre propio no se traduce, 8.12)
      if (nodo.parentElement.closest('script, style, .credencial-nombre') || !seVe(nodo.parentElement)) continue;
      textos.push(nodo.textContent);
    }
    for (const el of base.querySelectorAll('[aria-label], [title], img[alt]')) textos.push(el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.getAttribute('alt') || '');
    for (const t of textos) {
      const limpio = t.replace(/Mosca del WIP|Mosca means fly in Spanish\.|mosca\.deliverycraft\.ai|Male CNS|Felipe Fernández|Español/g, ''); // (la línea en inglés bajo el título lleva "Mosca", 5.2h; la dirección del sitio lleva "mosca", portada v2)
      if (ESPANOL.test(limpio)) problemas.push(`en inglés quedó en español: «${corto(t)}»`);
    }
  }
  return problemas;
}

// Cuánto espera en cada paso al bajar por la página (milisegundos). Con el
// computador ocupado (un juego abierto, por ejemplo) los navegadores dibujan
// más lento y un dibujo puede no alcanzar a cargarse en 140 ms: ahí se corre
// con PAUSA_AL_BAJAR=450 (8.12, 2026-11-13)
const PAUSA_AL_BAJAR = Number(process.env.PAUSA_AL_BAJAR) || 140;
const ALTO_MAXIMO_FOTO = 16000;
const SOLO = process.argv[4] && process.argv[4] !== 'todos' ? process.argv[4].split(',') : null;
const COMBINACIONES = (process.argv[5] || 'oscuro-es,claro-es,oscuro-en,claro-en').split(',').map((c) => c.split('-'));
const REVISAR = SOLO ? TAMANOS.filter(([nombre]) => SOLO.some((s) => nombre.includes(s))) : TAMANOS;
// En el computador el contador de visitas de Vercel no existe (src/visitas.js lo
// pide solo en el sitio armado, y ese archivo lo pone Vercel): con `npx vite
// preview` daría un 404 en cada revisión. Aquí se responde vacío, igual que en
// probar-menu y probar-paginas (8.12, 2026-11-13)
const LOCAL = /localhost|127\.0\.0\.1/.test(DIRECCION);

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
  if (LOCAL) await contexto.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  // El fondo y el idioma como si la persona los hubiera elegido antes
  await contexto.addInitScript(([f, i]) => {
    localStorage.setItem('mosca-fondo', f);
    localStorage.setItem('mosca-idioma', i);
  }, [fondo, idioma]);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  // La portada en inglés vive en /en/ (Etapa 7); lo recordado solo vale para el juego y los créditos
  await pagina.goto(DIRECCION + (idioma === 'en' ? 'en/' : ''), { waitUntil: 'load' });
  // (8.13) El dibujo del inicio ("¿Te suena?") se repite solo: a la mosca le
  // llegan pedidos, se van y vuelven a llegar. Aquí se deja quieto para
  // medirlo y para las fotos, con todos los pedidos a la vista y la mosca al
  // final. Que se mueva bien se prueba aparte, en scripts/probar-suena.mjs
  await pagina.waitForFunction(() => window.__mosca?.suena, null, { timeout: 15000 }).catch(() => {});
  const problemasInicio = await pagina.evaluate(async () => {
    const suena = window.__mosca?.suena;
    if (!suena) return ['el dibujo del inicio no partió'];
    suena.mostrarCerrado();
    await new Promise((listo) => setTimeout(listo, 500));
    return [];
  });
  // El cerebro solo se dibuja cuando se ve (desde la 8.13 está más abajo, en
  // "¿Por qué una mosca?", y se pide cuando falta poco para llegar a él)
  // (los saltos son directos: con la página deslizándose sola, la barra de
  // arriba quedaría encima del texto en la medición)
  await pagina.evaluate(() => document.querySelector('.cerebro').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await pagina.waitForFunction(() => document.querySelector('.cerebro.vivo'), null, { timeout: 25000 }).catch(() => {});
  await pagina.waitForTimeout(4800); // la consola sube sola hasta 10 (la palabra más larga: "Colapsada")
  await pagina.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await pagina.screenshot({ path: join(CARPETA, `${nombre}-pantalla.png`) });
  // (8.11) Como una persona: baja de a poco por toda la página, para que cada
  // dibujo se cargue la primera vez que se ve, y espera a que terminen. Así
  // la medición y la foto de la página completa son las de la página ya
  // cargada, que es como queda al leerla
  const altoPagina = await pagina.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < altoPagina; y += Math.round(alto * 0.5)) {
    await pagina.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await pagina.waitForTimeout(PAUSA_AL_BAJAR);
  }
  await pagina.waitForFunction(() => !document.querySelector('[data-carga]:not(.cargado), [data-ahora]'), null, { timeout: 8000 }).catch(() => {});
  await pagina.waitForTimeout(700); // lo último que entró termina de dibujarse
  const cargas = await pagina.evaluate(() => ({
    partieron: document.documentElement.classList.contains('con-carga'),
    sinCargar: [...document.querySelectorAll('[data-carga]:not(.cargado)')].map((el) => el.className || el.tagName.toLowerCase()),
    contando: [...document.querySelectorAll('[data-ahora]')].map((el) => `${el.textContent} (iba en ${el.dataset.ahora})`),
  }));
  await pagina.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  // Las preguntas frecuentes, todas abiertas
  await pagina.evaluate(() => document.querySelectorAll('.pregunta').forEach((d) => (d.open = true)));
  await pagina.waitForTimeout(400);
  const problemas = await pagina.evaluate(medir, { tactil, celularVertical: tactil && ancho < 600 && alto > ancho, idioma });
  // (el motor de Chrome no saca fotos de más de 16.384 px de alto. Desde la
  // 8.12, en un celular de 320 px con todas las preguntas abiertas la página
  // mide un poco más: ahí va en dos fotos)
  const altoCompleto = await pagina.evaluate(() => document.documentElement.scrollHeight);
  if (altoCompleto <= ALTO_MAXIMO_FOTO) await pagina.screenshot({ path: join(CARPETA, `${nombre}-completa.png`), fullPage: true });
  else {
    await pagina.screenshot({ path: join(CARPETA, `${nombre}-completa.png`), fullPage: true, clip: { x: 0, y: 0, width: ancho, height: ALTO_MAXIMO_FOTO } });
    await pagina.screenshot({ path: join(CARPETA, `${nombre}-completa-2.png`), fullPage: true, clip: { x: 0, y: ALTO_MAXIMO_FOTO, width: ancho, height: altoCompleto - ALTO_MAXIMO_FOTO } });
  }
  // Bajo 1100 px, el menú de la barra abierto
  if (ancho < 1100) {
    await pagina.click('.menu-boton');
    await pagina.waitForTimeout(350);
    const abierto = await pagina.evaluate(() => document.querySelector('.barra').classList.contains('abierta'));
    if (!abierto) problemas.push('el botón del menú no abre el menú');
    else problemas.push(...(await pagina.evaluate(medir, { tactil, idioma, raiz: '.barra' })).map((p) => `(menú abierto) ${p}`));
    await pagina.screenshot({ path: join(CARPETA, `${nombre}-menu.png`) });
    await pagina.keyboard.press('Escape');
  }
  problemas.push(...problemasInicio.map((p) => `(inicio) ${p}`));
  if (!cargas.partieron) problemas.push('las cargas no partieron (la página no tiene "con-carga")');
  for (const c of cargas.sinCargar) problemas.push(`no se cargó al bajar por la página: «${c}»`);
  for (const c of cargas.contando) problemas.push(`un número quedó a medio contar: ${c}`);
  problemas.push(...errores.map((e) => `error: ${e}`));
  total += problemas.length;
  console.log(`${problemas.length ? 'REVISAR' : 'ok     '} ${nombre}`);
  for (const p of problemas) console.log(`        - ${p}`);
  await contexto.close();
}
await navegador.close();
console.log(`\nFotos en ${CARPETA}`);
console.log(total ? `${total} cosas para revisar` : `portada: todo bien en los ${REVISAR.length} tamaños, con ${COMBINACIONES.length} combinaciones de fondo e idioma`);
