// Prueba del recorrido (Etapa 8.8, 2026-11-09, pedido de Felipe: "en el juego
// hace falta como ese mini tutorial flash, dónde está cada cosa y para qué").
// El recorrido oscurece la pantalla, deja a la vista una cosa a la vez y la
// explica en una tarjeta chica con su título y una línea (src/recorrido.js;
// los pasos, en src/main.js; los textos, en src/juego-textos.js).
// Revisa, en español e inglés:
//  1. Computador: "¿Dónde está cada cosa?" de la tarjeta de inicio lo abre; la
//     tarjeta de inicio se esconde mientras tanto; son seis pasos (decidir, el
//     día, el tablero, cómo le va, el cerebro y los días), con su título y su
//     línea en el idioma de ahora y el contador "1 de 6"; en cada uno el foco
//     deja a la vista lo que corresponde, y la tarjeta del recorrido queda
//     entera en la pantalla y no tapa lo que muestra; el último botón dice
//     "Listo", cierra, vuelve la tarjeta de inicio y el foco del teclado queda
//     en el botón que lo abrió.
//  2. Teclado: flecha derecha avanza, flecha izquierda vuelve, Esc cierra; con
//     el recorrido abierto las teclas del juego no hacen nada (el 9 no cambia
//     las tareas, Espacio no empieza el día) y Tab no sale de la tarjeta.
//  3. El botón Ayuda (arriba a la izquierda) también lo abre; con el día
//     corriendo, el reloj se detiene mientras dura y sigue al cerrar; con los
//     paneles ocultos (B y C), los abre y muestra los seis pasos. En
//     Exhibición no hay Ayuda (ahí explica quien facilita).
//  4. Celular (375 × 667 y 390 × 844): el "?" de arriba mide 44 px o más y lo
//     abre; antes de empezar son cinco pasos (la hoja todavía no lleva los
//     números) y con el día empezado, seis; desde la pestaña Cerebro vuelve a
//     Oficina; la tarjeta queda entera y no tapa lo que muestra.
//  5. La primera vez (8.9, 2026-11-10, pedido de Felipe: "que al menos la
//     primera vez sea como obligatorio, te lo puedas saltar claro, y que
//     siempre esté ahí disponible en Ayuda igual"): a una persona que abre el
//     juego por primera vez el recorrido le sale solo, en el primer paso, con
//     la tarjeta de inicio escondida y el día detenido en las 09:00; "Saltar"
//     lo cierra, vuelve la tarjeta de inicio con el foco del teclado y el día
//     se puede empezar; el navegador recuerda que ya se vio y al recargar no
//     sale solo, pero Ayuda (o el "?" del celular) lo sigue abriendo. A un
//     navegador manejado por un programa (como el de todas las pruebas) no le
//     sale solo, y si lo abre con su botón también queda anotado como visto.
// Requiere npm run dev (usa window.__mosca).
// Uso: node scripts/probar-recorrido.mjs   → debe decir "recorrido: todo bien"
//   CAPTURAS=<carpeta> deja ahí una foto de cada paso
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { TEXTOS } from '../src/juego-textos.js';

const JUEGO = process.env.JUEGO ?? 'http://localhost:5173/jugar/';
const DIR = process.env.CAPTURAS;
if (DIR) mkdirSync(DIR, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const mal = [];
const ok = (cond, msg) => { if (!cond) mal.push(msg); };

const PASOS = ['tareas', 'reloj', 'tablero', 'numeros', 'cerebro', 'dias'];
// Lo que cada paso tiene que dejar a la vista (en el celular, el cerebro y los
// días son sus pestañas y el día, la píldora de arriba)
const DONDE = {
  computador: { tareas: '#panel .bloque-wip', reloj: '#panel .bloque-hora', numeros: '#panel .bloque-numeros', cerebro: '#cerebro', dias: '#tabla-dias' },
  celular: { tareas: '#panel .bloque-wip', reloj: '#cel-controles', numeros: '#panel .bloque-numeros', cerebro: '#cel-pestana-cerebro', dias: '#cel-pestana-dias' },
};

const leer = (p, selector) => p.evaluate((selector) => {
  const capa = document.getElementById('recorrido');
  const caja = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, d: r.right, b: r.bottom }; };
  const cosa = selector === 'tablero' ? (() => { const r = window.__mosca.rectTablero(); return r && { x: r[0], y: r[1], d: r[0] + r[2], b: r[1] + r[3] }; })() : selector ? caja(document.querySelector(selector)) : null;
  const aviso = document.getElementById('aviso-empezar');
  return {
    abierto: !capa.hidden,
    paso: document.getElementById('recorrido-paso').textContent,
    titulo: document.getElementById('recorrido-titulo').textContent,
    linea: document.getElementById('recorrido-texto').textContent,
    sigue: document.getElementById('recorrido-sigue').textContent.trim(),
    atras: !document.getElementById('recorrido-atras').hidden,
    saltar: document.getElementById('recorrido-saltar').textContent.trim(),
    foco: caja(document.getElementById('recorrido-foco')),
    tarjeta: caja(document.getElementById('recorrido-tarjeta')),
    cosa,
    interno: window.__mosca.recorrido(),
    avisoSeVe: !aviso.hidden && getComputedStyle(aviso).visibility === 'visible' && getComputedStyle(aviso).display !== 'none',
    hora: document.getElementById('reloj-texto').textContent.trim(),
    wip: document.getElementById('wip').value,
    activo: document.activeElement?.id,
    vw: innerWidth,
    vh: innerHeight,
  };
}, selector);

// Un paso: su título, su línea, el contador, el foco sobre la cosa y la tarjeta en su lugar
function revisarPaso(e, tag, idioma, clave, i, n) {
  const [titulo, linea] = TEXTOS.recorrido[idioma][clave];
  ok(e.abierto && e.interno?.clave === clave, `${tag}: el paso ${i} debía ser «${clave}» y es «${e.interno?.clave}»`);
  ok(e.titulo === titulo && e.linea === linea, `${tag}: el paso ${i} dice «${e.titulo}: ${e.linea}»`);
  ok(e.paso === TEXTOS.recorridoPaso[idioma](i, n), `${tag}: el contador del paso ${i} dice «${e.paso}»`);
  ok(e.atras === i > 1, `${tag}: en el paso ${i}, "Atrás" ${e.atras ? 'está' : 'no está'}`);
  ok(e.sigue === (i === n ? TEXTOS.recorridoListo[idioma] : TEXTOS.recorridoSigue[idioma]), `${tag}: en el paso ${i} el botón dice «${e.sigue}»`);
  ok(!e.avisoSeVe, `${tag}: en el paso ${i} se ve la tarjeta de inicio`);
  // el foco deja la cosa a la vista (lo que de ella cabe en la pantalla)
  const c = e.cosa;
  ok(!!c, `${tag}: en el paso ${i} no se encontró lo que debía mostrar`);
  if (c) {
    const dentro = e.foco.x <= Math.max(4, c.x) + 2 && e.foco.y <= Math.max(4, c.y) + 2 && e.foco.d >= Math.min(e.vw - 4, c.d) - 2 && e.foco.b >= Math.min(e.vh - 4, c.b) - 2;
    ok(dentro, `${tag}: en el paso ${i} el foco (${JSON.stringify(Object.values(e.foco).map(Math.round))}) no deja a la vista la cosa (${JSON.stringify(Object.values(c).map(Math.round))})`);
  }
  // la tarjeta, entera en la pantalla y sin tapar lo que muestra
  const t = e.tarjeta;
  ok(t.x >= 0 && t.y >= 0 && t.d <= e.vw && t.b <= e.vh, `${tag}: en el paso ${i} la tarjeta del recorrido se sale de la pantalla (${JSON.stringify(Object.values(t).map(Math.round))})`);
  const tapa = c && t.x < c.d - 2 && c.x + 2 < t.d && t.y < c.b - 2 && c.y + 2 < t.b;
  ok(!tapa, `${tag}: en el paso ${i} la tarjeta del recorrido tapa lo que muestra`);
}

const abrir = async (ctx, idioma, tag) => {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => mal.push(`error ${tag}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') mal.push(`consola ${tag}: ${m.text()}`); });
  await p.goto(JUEGO + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
  await p.waitForSelector('#btn-empezar', { state: 'visible' });
  await p.waitForTimeout(1200);
  return p;
};
const ESPERA = 950; // el foco llega deslizándose y sigue a su cosa un rato
const tel = (w, h) => ({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 14'].userAgent, locale: 'es-CL' });

// ---------- La primera vez: sale solo (8.9) ----------
// Las pruebas manejan el navegador (navigator.webdriver), y a un navegador
// manejado el recorrido no le sale solo: todas las demás pruebas y las fotos
// esperan la tarjeta de inicio. Aquí la prueba se hace pasar por una persona.
const comoPersona = () => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true });
const CLAVE_VISTO = 'mosca-del-wip-recorrido-visto';
const anotado = (p) => p.evaluate((clave) => localStorage.getItem(clave), CLAVE_VISTO);
const PRIMERA_VEZ = [
  ['computador', { viewport: { width: 1440, height: 900 } }, 'es'],
  ['computador', { viewport: { width: 1440, height: 900 } }, 'en'],
  ['iphone-se-667', tel(375, 667), 'es'],
  ['iphone-14', tel(390, 844), 'en'],
];
for (const [nombre, opciones, idioma] of PRIMERA_VEZ) {
  const tag = `primera vez, ${nombre} ${idioma}`;
  const enCelular = nombre !== 'computador';
  const pasos = enCelular ? PASOS.filter((c) => c !== 'numeros') : PASOS;
  const ctx = await b.newContext(opciones);
  await ctx.addInitScript(comoPersona);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => mal.push(`error ${tag}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') mal.push(`consola ${tag}: ${m.text()}`); });
  const cargar = async () => {
    await p.goto(JUEGO + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
    await p.waitForFunction(() => !!window.__mosca);
    await p.waitForTimeout(1200);
  };
  await cargar();
  if (enCelular) await p.waitForFunction(() => document.documentElement.classList.contains('celular'));
  // sale solo, en el primer paso, con la tarjeta de inicio escondida y el día sin empezar
  let e = await leer(p, DONDE[enCelular ? 'celular' : 'computador'].tareas);
  ok(e.abierto && e.interno?.indice === 0 && e.interno?.total === pasos.length, `${tag}: el recorrido debía salir solo, en el paso 1 de ${pasos.length} (abierto ${e.abierto}, paso ${e.interno?.indice}, de ${e.interno?.total})`);
  if (e.abierto) revisarPaso(e, tag, idioma, 'tareas', 1, pasos.length);
  ok(e.hora === '09:00', `${tag}: con el recorrido de la primera vez el día no debe empezar (${e.hora})`);
  ok((await anotado(p)) === '1', `${tag}: el navegador debía recordar que el recorrido ya se vio`);
  if (DIR) await p.screenshot({ path: `${DIR}/primera-vez-${nombre}-${idioma}.png` });
  // se puede saltar: vuelve la tarjeta de inicio, con el foco del teclado
  // (si no salió solo, ya quedó anotado arriba y no hay nada que saltar)
  if (e.abierto) {
    if (enCelular) await p.tap('#recorrido-saltar'); else await p.click('#recorrido-saltar');
    await p.waitForTimeout(500);
    e = await leer(p);
    ok(!e.abierto && e.avisoSeVe && e.activo === 'aviso-empezar' && e.hora === '09:00', `${tag}: "Saltar" debía cerrarlo y dejar la tarjeta de inicio a la vista, con el foco y el día en las 09:00 (abierto ${e.abierto}, tarjeta ${e.avisoSeVe}, foco en ${e.activo}, ${e.hora})`);
  }
  // la segunda vez ya no sale solo, y sigue en Ayuda
  await cargar();
  e = await leer(p);
  ok(!e.abierto && e.avisoSeVe, `${tag}: al volver a abrir el juego el recorrido no debe salir solo (abierto ${e.abierto}, tarjeta ${e.avisoSeVe})`);
  if (enCelular) await p.tap('#cel-ayuda'); else await p.click('#btn-ayuda');
  await p.waitForTimeout(ESPERA);
  e = await leer(p);
  ok(e.abierto && e.interno?.indice === 0, `${tag}: ${enCelular ? 'el "?"' : 'Ayuda'} debe seguir abriendo el recorrido`);
  // con el último paso ("Listo") se cierra y el día se puede empezar
  for (let i = 1; i <= pasos.length; i++) {
    if (enCelular) await p.tap('#recorrido-sigue'); else await p.click('#recorrido-sigue');
    await p.waitForTimeout(350);
  }
  if (enCelular) await p.tap('#btn-empezar'); else await p.click('#btn-empezar');
  await p.waitForTimeout(1500);
  e = await leer(p);
  ok(!e.abierto && e.hora !== '09:00', `${tag}: después del recorrido el día debe poder empezar (abierto ${e.abierto}, ${e.hora})`);
  await ctx.close();
  console.log(`${tag}: listo`);
}
// Un navegador manejado por un programa: no le sale solo y nada queda anotado;
// si lo abre con el botón de la tarjeta, queda anotado como visto
{
  const tag = 'navegador manejado';
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await abrir(ctx, 'es', tag);
  let e = await leer(p);
  ok(!e.abierto && e.avisoSeVe && (await anotado(p)) === null, `${tag}: a un navegador manejado el recorrido no le debe salir solo (abierto ${e.abierto}, tarjeta ${e.avisoSeVe}, anotado ${await anotado(p)})`);
  await p.click('#btn-recorrido');
  await p.waitForTimeout(ESPERA);
  e = await leer(p);
  ok(e.abierto && (await anotado(p)) === '1', `${tag}: al abrirlo con su botón debía quedar anotado como visto (abierto ${e.abierto}, anotado ${await anotado(p)})`);
  await ctx.close();
  console.log(`${tag}: listo`);
}

// ---------- Computador ----------
for (const idioma of ['es', 'en']) {
  const tag = `computador ${idioma}`;
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await abrir(ctx, idioma, tag);
  // 1. desde la tarjeta de inicio, los seis pasos con "Siguiente"
  await p.click('#btn-recorrido');
  await p.waitForTimeout(ESPERA);
  for (let i = 1; i <= PASOS.length; i++) {
    const clave = PASOS[i - 1];
    const e = await leer(p, clave === 'tablero' ? 'tablero' : DONDE.computador[clave]);
    revisarPaso(e, tag, idioma, clave, i, PASOS.length);
    if (DIR) await p.screenshot({ path: `${DIR}/recorrido-computador-${idioma}-${i}.png` });
    await p.click('#recorrido-sigue');
    await p.waitForTimeout(ESPERA);
  }
  let e = await leer(p);
  ok(!e.abierto && e.avisoSeVe && e.activo === 'btn-recorrido', `${tag}: después de "Listo" debía cerrarse, volver la tarjeta de inicio y quedar el foco en su botón (abierto ${e.abierto}, tarjeta ${e.avisoSeVe}, foco en ${e.activo})`);
  ok(e.hora === '09:00', `${tag}: el recorrido no debe empezar el día (${e.hora})`);

  // 2. con el teclado
  await p.click('#btn-ayuda');
  await p.waitForTimeout(ESPERA);
  e = await leer(p);
  ok(e.abierto && e.interno?.indice === 0, `${tag}: Ayuda debe abrir el recorrido en el primer paso`);
  const wipAntes = e.wip;
  await p.keyboard.press('9');
  await p.keyboard.press('Space');
  await p.waitForTimeout(600);
  e = await leer(p);
  ok(e.wip === wipAntes && e.hora === '09:00' && e.abierto, `${tag}: con el recorrido abierto las teclas del juego no deben hacer nada (tareas ${e.wip}, ${e.hora})`);
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(400);
  ok((await leer(p)).interno?.indice === 2, `${tag}: la flecha derecha debe avanzar`);
  await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(400);
  ok((await leer(p)).interno?.indice === 1, `${tag}: la flecha izquierda debe volver`);
  const tabs = [];
  for (let i = 0; i < 4; i++) { await p.keyboard.press('Tab'); tabs.push(await p.evaluate(() => document.activeElement?.id)); }
  ok(tabs.every((id) => ['recorrido-saltar', 'recorrido-atras', 'recorrido-sigue'].includes(id)) && new Set(tabs).size === 3, `${tag}: Tab debe recorrer los tres botones del recorrido y no salir de él (${tabs.join(' → ')})`);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  e = await leer(p);
  ok(!e.abierto && e.activo === 'btn-ayuda', `${tag}: Esc debe cerrarlo y dejar el foco en Ayuda (abierto ${e.abierto}, foco en ${e.activo})`);

  // 3. con el día corriendo: el reloj se detiene mientras dura y sigue al cerrar
  await p.click('#btn-empezar');
  await p.waitForTimeout(1500);
  await p.click('#btn-ayuda');
  await p.waitForTimeout(600);
  const h1 = (await leer(p)).hora;
  await p.waitForTimeout(1500);
  e = await leer(p);
  ok(e.abierto && e.hora === h1 && h1 !== '09:00', `${tag}: el reloj debe detenerse con el recorrido abierto (${h1} → ${e.hora})`);
  await p.click('#recorrido-saltar');
  await p.waitForTimeout(1500);
  e = await leer(p);
  ok(!e.abierto && e.hora !== h1, `${tag}: al cerrar el recorrido el día debe seguir (${h1} → ${e.hora})`);
  // con los paneles ocultos, los abre y muestra los seis pasos
  await p.keyboard.press('b');
  await p.keyboard.press('c');
  await p.waitForTimeout(900);
  await p.click('#btn-ayuda');
  await p.waitForTimeout(ESPERA + 300);
  e = await leer(p, DONDE.computador.tareas);
  const paneles = await p.evaluate(() => !document.body.classList.contains('cerebro-oculto') && !document.body.classList.contains('controles-oculto'));
  ok(e.abierto && e.interno?.total === 6 && paneles, `${tag}: con los paneles ocultos, el recorrido debe abrirlos y tener seis pasos (pasos ${e.interno?.total}, paneles abiertos ${paneles})`);
  revisarPaso(e, `${tag} (paneles ocultos)`, idioma, 'tareas', 1, 6);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  // en Exhibición no hay Ayuda
  await p.keyboard.press('e');
  await p.waitForTimeout(1300);
  const ayudaEnExhibicion = await p.evaluate(() => { const el = document.getElementById('btn-ayuda'); return el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible'; });
  ok(!ayudaEnExhibicion, `${tag}: en Exhibición no debe verse Ayuda`);
  await ctx.close();
  console.log(`${tag}: listo`);
}

// ---------- Celular ----------
for (const [nombre, w, h] of [['iphone-se-667', 375, 667], ['iphone-14', 390, 844]]) for (const idioma of nombre === 'iphone-14' ? ['es', 'en'] : ['es']) {
  const tag = `${nombre} ${idioma}`;
  const ctx = await b.newContext(tel(w, h));
  const p = await abrir(ctx, idioma, tag);
  await p.waitForFunction(() => document.documentElement.classList.contains('celular'));
  const ayuda = await p.evaluate(() => { const r = document.getElementById('cel-ayuda').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  ok(ayuda[0] >= 44 && ayuda[1] >= 44, `${tag}: el "?" mide ${ayuda.join('×')} px (debe ser de 44 o más)`);
  // antes de empezar: cinco pasos (sin los números)
  await p.tap('#btn-recorrido');
  await p.waitForTimeout(ESPERA);
  const antes = PASOS.filter((c) => c !== 'numeros');
  for (let i = 1; i <= antes.length; i++) {
    const clave = antes[i - 1];
    const e = await leer(p, clave === 'tablero' ? 'tablero' : DONDE.celular[clave]);
    revisarPaso(e, tag, idioma, clave, i, antes.length);
    if (DIR) await p.screenshot({ path: `${DIR}/recorrido-${nombre}-${idioma}-${i}.png` });
    await p.tap('#recorrido-sigue');
    await p.waitForTimeout(ESPERA);
  }
  ok(!(await leer(p)).abierto, `${tag}: después de "Listo" debía cerrarse`);
  // con el día empezado: seis pasos, y desde la pestaña Cerebro vuelve a Oficina
  await p.tap('#btn-empezar');
  await p.waitForTimeout(1500);
  await p.tap('#cel-pestana-cerebro');
  await p.waitForTimeout(500);
  await p.tap('#cel-ayuda');
  await p.waitForTimeout(ESPERA);
  let e = await leer(p, DONDE.celular.tareas);
  const vista = await p.evaluate(() => document.documentElement.dataset.celVista);
  ok(e.abierto && e.interno?.total === 6 && vista === 'oficina', `${tag}: con el día empezado y desde Cerebro, el "?" debe volver a Oficina y tener seis pasos (pasos ${e.interno?.total}, pestaña ${vista})`);
  for (let i = 1; i <= PASOS.length; i++) {
    const clave = PASOS[i - 1];
    e = await leer(p, clave === 'tablero' ? 'tablero' : DONDE.celular[clave]);
    revisarPaso(e, `${tag} (día empezado)`, idioma, clave, i, PASOS.length);
    await p.tap('#recorrido-sigue');
    await p.waitForTimeout(ESPERA);
  }
  await ctx.close();
  console.log(`${tag}: listo`);
}

await b.close();
if (mal.length) { console.log('PROBLEMAS:\n - ' + mal.join('\n - ')); process.exit(1); }
console.log('recorrido: todo bien');
