// Prueba la barra de arriba de la portada y las preguntas frecuentes (parte
// 5.2f) como lo haría una persona, en celular, tablet y computador, en
// español e inglés:
//   - cada sección del menú: lleva a su sección, el título no queda tapado
//     por la barra, la dirección muestra la sección (#juego…), el menú queda
//     marcando esa sección y, en celular, se cierra solo;
//   - el logo vuelve arriba sin recargar, saca la sección de la dirección y
//     "atrás" devuelve a la sección;
//   - el nombre "Mosca del WIP" aparece en la barra al bajar, y bajo 1100 px
//     Jugar aparece cuando los botones grandes ya no se ven;
//   - el menú: abre, se cierra con Esc (el foco vuelve al botón) y tocando
//     fuera;
//   - "Saltar al contenido" aparece con la primera tecla Tab;
//   - las preguntas se abren y cierran con Enter;
//   - con "reducir movimiento" los saltos son directos;
//   - sin errores.
// Uso (con npm run dev, o con la dirección publicada):
//   node scripts/probar-barra.mjs [dirección]
// Con NAVEGADOR=webkit prueba con el motor de Safari (el del iPhone).
import { chromium, webkit } from 'playwright';

const DIRECCION = process.argv[2] || 'http://localhost:5173/';
const SECCIONES = ['juego', 'por-dentro', 'informe', 'preguntas'];
// [nombre, ancho, alto, táctil, reducir movimiento]
const CASOS = [
  ['celular-390x844', 390, 844, true],
  ['celular-320x568', 320, 568, true],
  ['tablet-horizontal-1024x768', 1024, 768, true],
  ['computador-1100x800', 1100, 800, false],
  ['computador-1440x900', 1440, 900, false],
  ['computador-1440x900-sin-movimiento', 1440, 900, false, true],
  ['computador-2560x1440', 2560, 1440, false],
];

const navegador = process.env.NAVEGADOR === 'webkit' ? await webkit.launch() : await chromium.launch();
// En Safari la tecla Tab sola no pasa por los enlaces (así viene en el Mac):
// se usa Opción+Tab, como lo haría una persona
const TAB = process.env.NAVEGADOR === 'webkit' ? 'Alt+Tab' : 'Tab';
let total = 0;

// Espera a que la página deje de deslizarse
async function quieta(pagina) {
  let antes = -1;
  for (let i = 0; i < 60; i++) {
    const y = await pagina.evaluate(() => scrollY);
    if (y === antes) return y;
    antes = y;
    await pagina.waitForTimeout(120);
  }
  return antes;
}

for (const [nombre, ancho, alto, tactil, sinMovimiento] of CASOS) for (const idioma of ['es', 'en']) {
  const contexto = await navegador.newContext({
    viewport: { width: ancho, height: alto },
    isMobile: tactil,
    hasTouch: tactil,
    reducedMotion: sinMovimiento ? 'reduce' : 'no-preference',
  });
  await contexto.addInitScript((i) => localStorage.setItem('mosca-idioma', i), idioma);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  const problemas = [];
  const mal = (texto) => problemas.push(texto);
  await pagina.goto(DIRECCION, { waitUntil: 'load' });
  await pagina.waitForTimeout(800);
  const conMenu = ancho < 1100;
  const estado = () =>
    pagina.evaluate(() => {
      const barra = document.querySelector('.barra');
      const jugar = barra.querySelector('.barra-jugar');
      return {
        clases: barra.className,
        jugarSeVe: getComputedStyle(jugar).visibility === 'visible' && Number(getComputedStyle(jugar).opacity) > 0.5,
        menuBotonSeVe: getComputedStyle(barra.querySelector('.menu-boton')).display !== 'none',
        expandido: barra.querySelector('.menu-boton').getAttribute('aria-expanded'),
      };
    });

  // Arriba de todo
  let e = await estado();
  if (e.clases.includes('con-nombre')) mal('arriba de todo la barra ya muestra el nombre');
  if (conMenu && e.jugarSeVe && alto > ancho) mal('arriba de todo la barra repite Jugar (los botones grandes se ven)');
  if (!conMenu && !e.jugarSeVe) mal('en computador la barra no muestra Jugar');
  if (conMenu !== e.menuBotonSeVe) mal(conMenu ? 'falta el botón del menú' : 'en computador sobra el botón del menú');

  // Saltar al contenido: con la primera tecla Tab
  if (!tactil) {
    await pagina.keyboard.press(TAB);
    const salto = await pagina.evaluate(() => {
      const el = document.activeElement;
      const r = el.getBoundingClientRect();
      return { clase: el.className, ancho: r.width, alto: r.height };
    });
    if (!salto.clase.includes('saltar') || salto.ancho < 40 || salto.alto < 20) mal(`la primera tecla Tab no muestra "Saltar al contenido" (${salto.clase})`);
    await pagina.keyboard.press('Enter');
    await pagina.waitForTimeout(300);
    const foco = await pagina.evaluate(() => document.activeElement.id);
    if (foco !== 'inicio') mal(`"Saltar al contenido" deja el foco en «${foco}» y no en el inicio`);
  }

  // Cada sección del menú
  for (const id of SECCIONES) {
    if (conMenu) {
      await pagina.click('.menu-boton');
      await pagina.waitForTimeout(250);
      if ((await estado()).expandido !== 'true') mal(`el menú no abre (antes de ir a #${id})`);
    }
    const inicio = Date.now();
    await pagina.click(`.menu-enlaces a[href="#${id}"]`);
    if (sinMovimiento) {
      await pagina.waitForTimeout(60);
      const y1 = await pagina.evaluate(() => scrollY);
      await pagina.waitForTimeout(400);
      const y2 = await pagina.evaluate(() => scrollY);
      if (y1 !== y2) mal(`con "reducir movimiento" el salto a #${id} se desliza en vez de ser directo`);
    }
    await quieta(pagina);
    await pagina.waitForTimeout(250);
    const r = await pagina.evaluate((id) => {
      const barra = document.querySelector('.barra').getBoundingClientRect();
      const seccion = document.getElementById(id);
      const primero = [...seccion.children].find((h) => h.getBoundingClientRect().height > 0);
      const titulo = seccion.querySelector('h2').getBoundingClientRect();
      const enlace = document.querySelector(`.menu-enlaces a[href="#${id}"]`);
      return {
        abajoBarra: barra.bottom,
        arribaPrimero: primero.getBoundingClientRect().top,
        tituloArriba: titulo.top,
        tituloAbajo: titulo.bottom,
        hash: location.hash,
        marcado: enlace.getAttribute('aria-current'),
        abierto: document.querySelector('.barra').classList.contains('abierta'),
        alto: innerHeight,
        alFinal: scrollY + innerHeight >= document.documentElement.scrollHeight - 2,
      };
    }, id);
    if (r.hash !== `#${id}`) mal(`la dirección dice «${r.hash}» después de ir a #${id}`);
    if (r.arribaPrimero < r.abajoBarra - 1) mal(`#${id}: lo primero de la sección queda tapado por la barra (${Math.round(r.arribaPrimero)} < ${Math.round(r.abajoBarra)})`);
    // (al final de la página la última sección no puede subir más: vale)
    if (r.arribaPrimero > r.abajoBarra + 60 && !r.alFinal) mal(`#${id}: la sección queda lejos de la barra (${Math.round(r.arribaPrimero - r.abajoBarra)} px)`);
    if (r.tituloArriba < r.abajoBarra - 1 || r.tituloAbajo > r.alto) mal(`#${id}: el título no se ve entero`);
    if (r.marcado !== 'true') mal(`el menú no marca la sección #${id} al llegar`);
    if (r.abierto) mal(`el menú sigue abierto después de ir a #${id}`);
    if (Date.now() - inicio > 6000) mal(`ir a #${id} tardó más de 6 s`);
  }
  e = await estado();
  if (!e.clases.includes('con-nombre')) mal('abajo, la barra no muestra el nombre "Mosca del WIP"');
  if (!e.clases.includes('desplazada')) mal('abajo, la barra no toma el fondo de la página');
  if (!e.jugarSeVe) mal('abajo, la barra no muestra Jugar');

  // El logo vuelve arriba, sin recargar; "atrás" devuelve a la sección
  await pagina.evaluate(() => (window.__sinRecargar = true));
  await pagina.click('[data-logo]');
  await quieta(pagina);
  const arriba = await pagina.evaluate(() => ({ y: scrollY, hash: location.hash, igual: window.__sinRecargar === true, busqueda: location.search }));
  if (arriba.y !== 0) mal(`el logo no vuelve arriba (queda en ${arriba.y} px)`);
  if (arriba.hash) mal(`después del logo la dirección sigue con «${arriba.hash}»`);
  if (!arriba.igual) mal('el logo recarga la página');
  if (idioma === 'en' && arriba.busqueda !== '?lang=en') mal(`después del logo la dirección perdió el idioma («${arriba.busqueda}»)`);
  await pagina.goBack();
  await pagina.waitForTimeout(500);
  const atras = await pagina.evaluate(() => location.hash);
  if (atras !== '#preguntas') mal(`"atrás" después del logo lleva a «${atras}» y no a #preguntas`);
  await quieta(pagina);
  await pagina.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await pagina.waitForTimeout(400);
  if ((await estado()).clases.includes('con-nombre')) mal('al volver arriba, el nombre no se esconde');

  // El menú: Esc y tocar fuera
  if (conMenu) {
    await pagina.click('.menu-boton');
    await pagina.waitForTimeout(250);
    await pagina.keyboard.press('Escape');
    const tras = await pagina.evaluate(() => ({
      abierto: document.querySelector('.barra').classList.contains('abierta'),
      foco: document.activeElement.className,
    }));
    if (tras.abierto) mal('Esc no cierra el menú');
    if (!tras.foco.includes('menu-boton')) mal(`después de Esc el foco queda en «${tras.foco}» y no en el botón del menú`);
    await pagina.click('.menu-boton');
    await pagina.waitForTimeout(250);
    if (tactil) await pagina.touchscreen.tap(ancho / 2, alto - 20);
    else await pagina.mouse.click(ancho / 2, alto - 20);
    await pagina.waitForTimeout(250);
    if ((await estado()).clases.includes('abierta')) mal('tocar fuera no cierra el menú');
  }

  // Las preguntas con el teclado (todas cerradas antes)
  await pagina.evaluate(() => document.querySelectorAll('.pregunta').forEach((d) => (d.open = false)));
  await pagina.evaluate(() => document.querySelector('.pregunta summary').focus());
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(200);
  const abierta = await pagina.evaluate(() => document.querySelector('.pregunta').open);
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(200);
  const cerrada = await pagina.evaluate(() => !document.querySelector('.pregunta').open);
  if (!abierta || !cerrada) mal('las preguntas no se abren y cierran con Enter');

  for (const err of errores) mal(`error: ${err}`);
  total += problemas.length;
  console.log(`${problemas.length ? 'REVISAR' : 'ok     '} ${nombre} ${idioma}`);
  for (const p of problemas) console.log(`        - ${p}`);
  await contexto.close();
}
await navegador.close();
console.log(total ? `\n${total} cosas para revisar` : '\nbarra: todo bien');
