// Prueba los botones y enlaces que bajan archivos desde la portada, como lo
// haría una persona, en Chrome y en el motor de Safari (WebKit):
//   - el informe en PDF (los botones del kit, de "Qué es y qué no es" y del
//     cierre) y, desde la portada v2 (2026-10-26), los tres archivos del
//     taller en la tarjeta "El taller" del kit (la guía rápida en PDF, la
//     presentación en PowerPoint y en PDF);
//   - en computador y en Android, cada enlace visible baja el archivo entero,
//     con su nombre limpio ("Mosca del WIP - Informe.pdf", "Mosca del WIP -
//     Taller - Guía rápida del facilitador.pdf"…; con la dirección publicada; en npm
//     run dev el nombre lo pone el navegador);
//   - con la portada en inglés, los botones del informe y la tapa son los del
//     informe en inglés ("Mosca del WIP - Report.pdf"; 2026-10-25), también al
//     cambiar de idioma con el botón ES | EN; los del taller son los mismos en
//     los dos idiomas (por ahora el taller está solo en español);
//   - en iPhone y en iPad (que se presenta como Mac con pantalla táctil), cada
//     enlace abre el archivo en la misma pestaña en vez de "descargarlo" (ver
//     src/portada.js, "El informe en PDF");
//   - desde la Etapa 8.6 (2026-11-06), el resumen de 4 páginas del kit
//     ("Mosca del WIP - Resumen.pdf", y en inglés "- Summary.pdf"), con las
//     mismas exigencias que el informe;
//   - ningún enlace queda tapado por otra cosa;
//   - en el kit se ven todos los archivos del taller, y el aviso "Muy pronto"
//     / "Coming soon" no está en la página, ni siquiera escondido (el
//     interruptor que lo mostraba salió el 2026-10-29: el taller ya está
//     publicado y el texto escondido lo leían los buscadores).
// Necesita WebKit para Playwright la primera vez: npx playwright install webkit
// Uso (con npm run dev, o con la dirección publicada):
//   node scripts/probar-descargas.mjs [dirección]
import { chromium, webkit } from 'playwright';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DIRECCION = process.argv[2] || 'http://localhost:5173/';
const PUBLICADA = !/localhost|127\.0\.0\.1/.test(DIRECCION);
// El informe de cada idioma (igual que INFORMES en src/portada.js)
const INFORMES = {
  es: { pdf: '/Mosca-del-WIP-Informe.pdf', nombre: 'Mosca del WIP - Informe.pdf', tapa: '/img/tapa-informe.jpg' },
  en: { pdf: '/Mosca-del-WIP-Report.pdf', nombre: 'Mosca del WIP - Report.pdf', tapa: '/img/tapa-report.jpg' },
};
// El resumen ejecutivo de cada idioma (8.6, de 4 páginas; desde la 8.11, de 2; data-resumen-pdf en index.html
// y RESUMEN_EN en scripts/generar-ingles.mjs)
const RESUMENES = {
  es: { pdf: '/Mosca-del-WIP-Resumen.pdf', nombre: 'Mosca del WIP - Resumen.pdf' },
  en: { pdf: '/Mosca-del-WIP-Summary.pdf', nombre: 'Mosca del WIP - Summary.pdf' },
};
// Los archivos del taller (los mismos en los dos idiomas), como en index.html
const TALLER = [
  { ruta: '/taller/Mosca-del-WIP-Taller-Guia-rapida.pdf', nombre: 'Mosca del WIP - Taller - Guía rápida del facilitador.pdf' },
  { ruta: '/taller/Mosca-del-WIP-Taller-Presentacion.pptx', nombre: 'Mosca del WIP - Taller - Presentación.pptx' },
  { ruta: '/taller/Mosca-del-WIP-Taller-Presentacion.pdf', nombre: 'Mosca del WIP - Taller - Presentación.pdf' },
  { ruta: '/taller/Mosca-del-WIP-Taller-Hoja-del-equipo.pdf', nombre: 'Mosca del WIP - Taller - Hoja del equipo.pdf' }, // desde la Etapa 7
];
const enPublic = (ruta) => new URL(`../public${ruta}`, import.meta.url);
for (const informe of Object.values(INFORMES)) informe.tamano = statSync(enPublic(informe.pdf)).size;
for (const resumen of Object.values(RESUMENES)) resumen.tamano = statSync(enPublic(resumen.pdf)).size;
for (const archivo of TALLER) archivo.tamano = existsSync(enPublic(archivo.ruta)) ? statSync(enPublic(archivo.ruta)).size : 0;
const CARPETA = mkdtempSync(join(tmpdir(), 'probar-descargas-'));

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const tactil = { isMobile: true, hasTouch: true };
// Un iPhone o iPad de verdad dice que admite 5 toques a la vez; el WebKit de
// prueba dice 0 (y así el iPad se vería como un Mac)
const cincoToques = () => Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 });
// [motor, nombre, opciones, abre (true = lo abre en vez de bajarlo)]
const CASOS = [
  ['chromium', 'computador-1440x900', { viewport: { width: 1440, height: 900 } }, false],
  ['webkit', 'computador-1280x720', { viewport: { width: 1280, height: 720 } }, false],
  ['chromium', 'android-360x740', { viewport: { width: 360, height: 740 }, userAgent: ANDROID, ...tactil }, false],
  ['webkit', 'iphone-390x664', { viewport: { width: 390, height: 664 }, userAgent: IPHONE, ...tactil }, true],
  ['webkit', 'iphone-horizontal-844x340', { viewport: { width: 844, height: 340 }, userAgent: IPHONE, ...tactil }, true],
  ['webkit', 'ipad-820x1180', { viewport: { width: 820, height: 1180 }, userAgent: IPAD, ...tactil }, true],
  ['webkit', 'ipad-horizontal-1180x820', { viewport: { width: 1180, height: 820 }, userAgent: IPAD, ...tactil }, true],
];

const navegadores = {};
const abrir = async (motor) => (navegadores[motor] ??= await (motor === 'webkit' ? webkit : chromium).launch());
let problemas = 0;
const mal = (texto) => { problemas++; console.log(`        - ${texto}`); };
const conIdioma = (idioma) => DIRECCION + (idioma === 'en' ? 'en/' : ''); // la portada en inglés vive en /en/ (Etapa 7)

for (const archivo of TALLER) if (!archivo.tamano) mal(`falta public${archivo.ruta} (se copia desde la Parte B, el taller v2)`);

for (const [motor, nombre, opciones, abre] of CASOS) for (const idioma of ['es', 'en']) {
  const contexto = await (await abrir(motor)).newContext({ ...opciones, acceptDownloads: true });
  // (revisión final, fase 2, 2026-11-15) El contador de visitas de Vercel no se
  // carga nunca. Contra el sitio publicado se cargaba en cada portada que abre
  // esta prueba, y no sumaba visitas solo si el contador notaba que el navegador
  // es automático. Se responde vacío todo /_vercel/, antes de abrir páginas.
  await contexto.route('**/_vercel/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  if (opciones.userAgent === IPHONE || opciones.userAgent === IPAD) await contexto.addInitScript(cincoToques);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(conIdioma(idioma), { waitUntil: 'load' });
  await pagina.waitForTimeout(1200);
  const antes = problemas;
  const informe = INFORMES[idioma];
  const resumen = RESUMENES[idioma];
  let probadoResumen = false;
  const tapa = await pagina.locator('[data-tapa]').getAttribute('src');
  if (tapa !== informe.tapa) mal(`la tapa es ${tapa} y no ${informe.tapa}`);
  // Los archivos del taller, todos a la vista, y nada del antiguo "Muy pronto"
  const tallerVisibles = await pagina.locator('[data-taller-archivo]:visible').count();
  if (tallerVisibles !== TALLER.length) mal(`en el kit se ven ${tallerVisibles} archivos del taller y debían ser ${TALLER.length}`);
  const pronto = await pagina.evaluate(() => /muy pronto|coming soon/i.test(document.querySelector('.kit').textContent) || !!document.querySelector('.muy-pronto, .kit[data-taller]'));
  if (pronto) mal('el kit todavía trae el aviso "Muy pronto" / "Coming soon" o su interruptor');

  const enlaces = pagina.locator('a[href$=".pdf"], a[href$=".pptx"]');
  const total = await enlaces.count();
  let probados = 0;
  const probadosTaller = new Set();
  for (let i = 0; i < total; i++) {
    const enlace = enlaces.nth(i);
    if (!(await enlace.isVisible())) continue;
    probados++;
    const cual = `enlace ${i + 1} (${(await enlace.getAttribute('class')) || (await enlace.textContent()).trim()})`;
    const ruta = new URL(await enlace.evaluate((el) => el.href)).pathname;
    // Qué archivo debía ser: el informe del idioma o uno del taller
    let esperado;
    if ((await enlace.getAttribute('data-informe')) !== null) {
      esperado = { ruta: informe.pdf, nombre: informe.nombre, tamano: informe.tamano };
      if (ruta !== informe.pdf) mal(`${cual} lleva a ${ruta} y no al informe en ${idioma === 'en' ? 'inglés' : 'español'}`);
    } else if ((await enlace.getAttribute('data-resumen-pdf')) !== null) {
      esperado = { ruta: resumen.pdf, nombre: resumen.nombre, tamano: resumen.tamano };
      probadoResumen = true;
      if (ruta !== resumen.pdf) mal(`${cual} lleva a ${ruta} y no al resumen en ${idioma === 'en' ? 'inglés' : 'español'}`);
    } else if ((await enlace.getAttribute('data-taller-archivo')) !== null) {
      esperado = TALLER.find((a) => a.ruta === ruta);
      if (!esperado) mal(`${cual} lleva a ${ruta}, que no es ninguno de los tres archivos del taller`);
      else probadosTaller.add(ruta);
    } else mal(`${cual} lleva a ${ruta} y no se sabe qué archivo es (sin data-informe, data-resumen-pdf ni data-taller-archivo)`);
    if (!esperado) continue;
    await enlace.scrollIntoViewIfNeeded();
    await pagina.waitForTimeout(250);
    const tapado = await enlace.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return arriba && !el.contains(arriba) ? `${arriba.tagName.toLowerCase()}.${arriba.className}` : '';
    });
    if (tapado) mal(`${cual} queda tapado por ${tapado}`);
    const conDescarga = (await enlace.getAttribute('download')) !== null;
    const tocar = () => (opciones.hasTouch ? enlace.tap() : enlace.click());
    if (abre) {
      if (conDescarga) mal(`${cual} todavía tiene "download": en ${nombre} debía abrir el archivo`);
      const [pedido] = await Promise.all([
        pagina.waitForRequest((r) => r.isNavigationRequest() && r.url().endsWith(esperado.ruta), { timeout: 15000 }).catch(() => null),
        tocar(),
      ]);
      if (!pedido) mal(`${cual} no abrió ${esperado.ruta}`);
      await pagina.goto(conIdioma(idioma), { waitUntil: 'load' });
      await pagina.waitForTimeout(600);
    } else {
      if (!conDescarga) mal(`${cual} no tiene "download"`);
      const [descarga] = await Promise.all([pagina.waitForEvent('download', { timeout: 15000 }).catch(() => null), tocar()]);
      if (!descarga) {
        mal(`${cual} no bajó ${esperado.ruta}`);
        continue;
      }
      const destino = join(CARPETA, `${nombre}-${idioma}-${i}${ruta.slice(ruta.lastIndexOf('.'))}`);
      await descarga.saveAs(destino);
      const bytes = readFileSync(destino);
      const cabeza = ruta.endsWith('.pptx') ? 'PK' : '%PDF-';
      if (bytes.subarray(0, cabeza.length).toString() !== cabeza || bytes.length !== esperado.tamano) mal(`${cual} bajó un archivo raro (${bytes.length} bytes, se esperaban ${esperado.tamano})`);
      // WebKit en Mac entrega el nombre con las tildes descompuestas (NFD, "i" + acento);
      // se comparan los dos en la misma forma (NFC) para no marcar como raro un nombre igual
      if (PUBLICADA && descarga.suggestedFilename().normalize('NFC') !== esperado.nombre.normalize('NFC')) mal(`${cual} lo guarda como «${descarga.suggestedFilename()}»`);
      if (conDescarga && (await enlace.getAttribute('download')) !== esperado.nombre) mal(`${cual} propone el nombre «${await enlace.getAttribute('download')}»`);
    }
  }
  if (!probados) mal('no hay ningún enlace de descarga a la vista');
  if (probadosTaller.size !== TALLER.length) mal(`se probaron ${probadosTaller.size} archivos del taller y no ${TALLER.length}`);
  if (!probadoResumen) mal('no se probó el resumen ejecutivo (no hay un enlace data-resumen-pdf a la vista)');
  // En español, ES | EN lleva a la portada en inglés (/en/), donde todos los
  // enlaces y la tapa son del informe en inglés, y ES devuelve a la de
  // español (desde la Etapa 7 cada idioma tiene su dirección); los del taller no cambian
  if (idioma === 'es') {
    for (const [otro, boton, ruta] of [['en', 'en', '/en/'], ['es', 'es', '/']]) {
      const visible = pagina.locator(`[data-idioma="${boton}"]:visible`).first();
      if (!(await visible.count())) {
        await pagina.evaluate((b) => document.querySelector(`[data-idioma="${b}"]`).click(), boton);
      } else await (opciones.hasTouch ? visible.tap() : visible.click());
      await pagina.waitForURL((u) => u.pathname === ruta, { timeout: 15000 }).catch(() => {});
      await pagina.waitForTimeout(700);
      if (new URL(pagina.url()).pathname !== ruta) mal(`al apretar ${boton.toUpperCase()} la dirección es ${new URL(pagina.url()).pathname} y no ${ruta}`);
      const ahora = await pagina.evaluate(() => ({
        rutas: [...document.querySelectorAll('[data-informe]')].map((a) => new URL(a.href).pathname),
        nombres: [...document.querySelectorAll('[data-informe]')].map((a) => a.getAttribute('download')),
        tapa: document.querySelector('[data-tapa]').getAttribute('src'),
        taller: [...document.querySelectorAll('[data-taller-archivo]')].map((a) => new URL(a.href).pathname),
        resumen: [...document.querySelectorAll('[data-resumen-pdf]')].map((a) => [new URL(a.href).pathname, a.getAttribute('download')]),
      }));
      const esperado = INFORMES[otro];
      if (ahora.rutas.some((r) => r !== esperado.pdf) || ahora.tapa !== esperado.tapa) mal(`al pasar a ${otro} con el botón, los enlaces son ${[...new Set(ahora.rutas)].join(', ')} y la tapa ${ahora.tapa}`);
      if (ahora.nombres.some((n) => (abre ? n !== null : n !== esperado.nombre))) mal(`al pasar a ${otro} con el botón, el nombre para guardar es ${[...new Set(ahora.nombres)].join(', ')}`);
      if (ahora.taller.join() !== TALLER.map((a) => a.ruta).join()) mal(`al pasar a ${otro} con el botón, los archivos del taller son ${ahora.taller.join(', ')}`);
      const resumenOtro = RESUMENES[otro];
      if (!ahora.resumen.length || ahora.resumen.some(([r, n]) => r !== resumenOtro.pdf || n !== (abre ? null : resumenOtro.nombre)))
        mal(`al pasar a ${otro} con el botón, el resumen es ${JSON.stringify(ahora.resumen)}`);
    }
  }
  for (const e of errores) mal(`error: ${e}`);
  console.log(`${problemas === antes ? 'ok     ' : 'REVISAR'} ${motor} ${nombre} ${idioma}: ${probados} enlaces, ${abre ? 'lo abren' : 'lo bajan'}`);
  await contexto.close();
}
for (const n of Object.values(navegadores)) await n.close();
console.log(problemas ? `\n${problemas} cosas para revisar` : '\ndescargas: todo bien');
process.exit(problemas ? 1 : 0);
