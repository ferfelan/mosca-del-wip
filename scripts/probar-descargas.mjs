// Prueba los botones del informe en PDF de la portada, como lo haría una
// persona, en Chrome y en el motor de Safari (WebKit):
//   - en computador y en Android, cada botón visible baja el PDF entero, con
//     el nombre "Mosca del WIP - Informe.pdf" (con la dirección publicada; en
//     npm run dev el nombre lo pone el navegador),
//   - con la portada en inglés, todos los botones y la tapa son los del informe
//     en inglés ("Mosca del WIP - Report.pdf"; 2026-10-25), también al cambiar
//     de idioma con el botón ES | EN,
//   - en iPhone y en iPad (que se presenta como Mac con pantalla táctil), cada
//     botón abre el PDF en la misma pestaña en vez de "descargarlo" (ver
//     src/portada.js, "El informe en PDF"),
//   - ningún botón queda tapado por otra cosa,
// en español y en inglés. Necesita WebKit para Playwright la primera vez:
// npx playwright install webkit
// Uso (con npm run dev, o con la dirección publicada):
//   node scripts/probar-descargas.mjs [dirección]
import { chromium, webkit } from 'playwright';
import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DIRECCION = process.argv[2] || 'http://localhost:5173/';
const PUBLICADA = !/localhost|127\.0\.0\.1/.test(DIRECCION);
// El informe de cada idioma (igual que INFORMES en src/portada.js)
const INFORMES = {
  es: { pdf: '/Mosca-del-WIP-Informe.pdf', nombre: 'Mosca del WIP - Informe.pdf', tapa: '/img/tapa-informe.jpg' },
  en: { pdf: '/Mosca-del-WIP-Report.pdf', nombre: 'Mosca del WIP - Report.pdf', tapa: '/img/tapa-report.jpg' },
};
for (const informe of Object.values(INFORMES)) informe.tamano = statSync(new URL(`../public${informe.pdf}`, import.meta.url)).size;
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

for (const [motor, nombre, opciones, abre] of CASOS) for (const idioma of ['es', 'en']) {
  const contexto = await (await abrir(motor)).newContext({ ...opciones, acceptDownloads: true });
  if (opciones.userAgent === IPHONE || opciones.userAgent === IPAD) await contexto.addInitScript(cincoToques);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(DIRECCION + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'load' });
  await pagina.waitForTimeout(1200);
  const antes = problemas;
  const informe = INFORMES[idioma];
  const tapa = await pagina.locator('[data-tapa]').getAttribute('src');
  if (tapa !== informe.tapa) mal(`la tapa es ${tapa} y no ${informe.tapa}`);
  const total = await pagina.locator('a[href$=".pdf"]').count();
  let probados = 0;
  for (let i = 0; i < total; i++) {
    const enlace = pagina.locator('a[href$=".pdf"]').nth(i);
    if (!(await enlace.isVisible())) continue;
    probados++;
    const cual = `botón ${i + 1} (${(await enlace.getAttribute('class')) || ''})`;
    const ruta = new URL(await enlace.evaluate((el) => el.href)).pathname;
    if (ruta !== informe.pdf) mal(`${cual} lleva a ${ruta} y no al informe en ${idioma === 'en' ? 'inglés' : 'español'}`);
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
      if (conDescarga) mal(`${cual} todavía tiene "download": en ${nombre} debía abrir el PDF`);
      const [pedido] = await Promise.all([
        pagina.waitForRequest((r) => r.isNavigationRequest() && r.url().endsWith(informe.pdf), { timeout: 15000 }).catch(() => null),
        tocar(),
      ]);
      if (!pedido) mal(`${cual} no abrió el PDF`);
      await pagina.goto(DIRECCION + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'load' });
      await pagina.waitForTimeout(600);
    } else {
      if (!conDescarga) mal(`${cual} no tiene "download"`);
      const [descarga] = await Promise.all([pagina.waitForEvent('download', { timeout: 15000 }).catch(() => null), tocar()]);
      if (!descarga) {
        mal(`${cual} no bajó el PDF`);
        continue;
      }
      const destino = join(CARPETA, `${nombre}-${idioma}-${i}.pdf`);
      await descarga.saveAs(destino);
      const bytes = readFileSync(destino);
      if (bytes.subarray(0, 5).toString() !== '%PDF-' || bytes.length !== informe.tamano) mal(`${cual} bajó un archivo raro (${bytes.length} bytes)`);
      if (PUBLICADA && descarga.suggestedFilename() !== informe.nombre) mal(`${cual} lo guarda como «${descarga.suggestedFilename()}»`);
      if (conDescarga && (await enlace.getAttribute('download')) !== informe.nombre) mal(`${cual} propone el nombre «${await enlace.getAttribute('download')}»`);
    }
  }
  if (!probados) mal('no hay ningún botón del PDF a la vista');
  // En español, pasar a inglés con el botón ES | EN cambia todos los enlaces y
  // la tapa al informe en inglés (y volver, al de español)
  if (idioma === 'es') {
    for (const [otro, boton] of [['en', 'en'], ['es', 'es']]) {
      const visible = pagina.locator(`[data-idioma="${boton}"]:visible`).first();
      if (!(await visible.count())) {
        await pagina.evaluate((b) => document.querySelector(`[data-idioma="${b}"]`).click(), boton);
      } else await (opciones.hasTouch ? visible.tap() : visible.click());
      await pagina.waitForTimeout(700);
      const ahora = await pagina.evaluate(() => ({
        rutas: [...document.querySelectorAll('[data-informe]')].map((a) => new URL(a.href).pathname),
        nombres: [...document.querySelectorAll('[data-informe]')].map((a) => a.getAttribute('download')),
        tapa: document.querySelector('[data-tapa]').getAttribute('src'),
      }));
      const esperado = INFORMES[otro];
      if (ahora.rutas.some((r) => r !== esperado.pdf) || ahora.tapa !== esperado.tapa) mal(`al pasar a ${otro} con el botón, los enlaces son ${[...new Set(ahora.rutas)].join(', ')} y la tapa ${ahora.tapa}`);
      if (ahora.nombres.some((n) => (abre ? n !== null : n !== esperado.nombre))) mal(`al pasar a ${otro} con el botón, el nombre para guardar es ${[...new Set(ahora.nombres)].join(', ')}`);
    }
  }
  for (const e of errores) mal(`error: ${e}`);
  console.log(`${problemas === antes ? 'ok     ' : 'REVISAR'} ${motor} ${nombre} ${idioma}: ${probados} botones, ${abre ? 'lo abren' : 'lo bajan'}`);
  await contexto.close();
}
for (const n of Object.values(navegadores)) await n.close();
console.log(problemas ? `\n${problemas} cosas para revisar` : '\ndescargas: todo bien');
