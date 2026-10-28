// Prueba de la pregunta "¿Seguro que quieres salir del juego?" (2026-10-28,
// pedido de Felipe): "← Inicio" en Control y en Exhibición y la flecha del
// celular preguntan antes de ir a la portada, también antes de empezar; el foco
// queda en "Seguir jugando"; mientras pregunta el reloj no avanza y las teclas
// del juego no hacen nada; Esc, "Seguir jugando" o un clic en el fondo cierran
// y el día vuelve a correr; "Salir del juego" lleva a la portada en el mismo
// idioma; en el celular la tarjeta cabe en la pantalla. Requiere npm run dev.
// Uso: node scripts/probar-salir.mjs   → debe decir "salir: todo bien"
//   JUEGO=<dirección> (http://localhost:5173/jugar/ por defecto), CAPTURAS=<carpeta>,
//   NAVEGADOR=webkit (el motor de Safari; por defecto, Chromium)
import { chromium, webkit, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
const C = process.env.CAPTURAS ?? 'capturas/salir';
const U = process.env.JUEGO ?? 'http://localhost:5173/jugar/';
mkdirSync(C, { recursive: true });
const b = process.env.NAVEGADOR === 'webkit'
  ? await webkit.launch()
  : await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const mal = []; const ok = (c, m) => { if (!c) mal.push(m); };
const estado = (p) => p.evaluate(() => ({ abierto: document.getElementById('salir-juego').open, texto: document.getElementById('salir-texto').textContent, boton: document.getElementById('btn-pausa').textContent.trim(), hora: document.getElementById('reloj-texto').textContent, foco: document.activeElement?.id, href: document.getElementById('btn-salir-juego').getAttribute('href'), url: location.pathname + location.search }));
for (const idioma of ['es', 'en']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => mal.push(`error ${idioma}: ${e.message}`));
  p.on('dialog', (d) => { mal.push(`diálogo del navegador: ${d.message()}`); d.dismiss(); });
  await p.goto(U + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
  // (sin window.__mosca, que solo existe con npm run dev: así también corre contra el sitio publicado)
  await p.waitForSelector('#btn-empezar', { state: 'visible' });
  await p.waitForTimeout(800);
  // Antes de empezar: pregunta igual, texto sin día a medias
  await p.click('#volver-inicio'); await p.waitForTimeout(300);
  let e = await estado(p);
  ok(e.abierto, `${idioma}: antes de empezar no preguntó`);
  ok(e.foco === 'btn-seguir-jugando', `${idioma}: el foco está en ${e.foco}`);
  ok(e.href === (idioma === 'en' ? '/?lang=en' : '/'), `${idioma}: Salir lleva a ${e.href}`);
  console.log(idioma, 'antes de empezar:', e.texto);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  e = await estado(p); ok(!e.abierto, `${idioma}: Esc no cerró`); ok(e.url.startsWith('/jugar/'), `${idioma}: salió con Esc`);
  // Jugando: pausa mientras pregunta, sigue al cerrar
  await p.click('#btn-empezar'); await p.waitForTimeout(2500);
  await p.click('#volver-inicio'); await p.waitForTimeout(400);
  const h1 = (await estado(p)).hora; await p.waitForTimeout(1500); e = await estado(p);
  ok(e.abierto && e.hora === h1, `${idioma}: el reloj siguió con la pregunta abierta (${h1} → ${e.hora})`);
  ok(/(Reanudar|Resume)/.test(e.boton), `${idioma}: el botón de pausa dice ${e.boton}`);
  console.log(idioma, 'jugando:', e.texto);
  await p.screenshot({ path: `${C}/salir-control-${idioma}.png` });
  // tecla E no hace nada con la pregunta abierta
  await p.keyboard.press('e'); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => document.body.classList.contains('exhibicion'))), `${idioma}: la E cambió de vista con la pregunta abierta`);
  await p.click('#btn-seguir-jugando'); await p.waitForTimeout(1500);
  e = await estado(p); ok(!e.abierto && e.hora !== h1 && /(Pausa|Pause)/.test(e.boton), `${idioma}: no volvió a correr (${JSON.stringify(e)})`);
  // Clic en el fondo oscuro = seguir jugando
  await p.click('#volver-inicio'); await p.waitForTimeout(300);
  await p.mouse.click(30, 450); await p.waitForTimeout(300);
  ok(!(await estado(p)).abierto, `${idioma}: el clic afuera no cerró`);
  // Exhibición: el enlace de la barra también pregunta
  await p.keyboard.press('e'); await p.waitForTimeout(1200);
  await p.click('.volver-inicio-barra'); await p.waitForTimeout(400);
  ok((await estado(p)).abierto, `${idioma}: en Exhibición no preguntó`);
  await p.mouse.move(700, 500); await p.waitForTimeout(300);
  await p.screenshot({ path: `${C}/salir-exhibicion-${idioma}.png` });
  // Salir del juego → portada en el mismo idioma
  await p.click('#btn-salir-juego');
  await p.waitForURL((u) => u.pathname === '/', { timeout: 10000 });
  const u = new URL(p.url()); ok(u.search === (idioma === 'en' ? '?lang=en' : ''), `${idioma}: llegó a ${u.pathname}${u.search}`);
  await ctx.close();
}
// Celular: la flecha también pregunta y la tarjeta cabe
for (const idioma of ['es', 'en']) {
  const ctx = await b.newContext({ ...devices['iPhone 14'], viewport: { width: 390, height: 664 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => mal.push(`error celular ${idioma}: ${e.message}`));
  await p.goto(U + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.documentElement.classList.contains('celular'));
  await p.tap('#btn-empezar'); await p.waitForTimeout(2000);
  await p.tap('#cel-volver'); await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const d = document.querySelector('#salir-juego .salir-tarjeta').getBoundingClientRect(); return { abierto: document.getElementById('salir-juego').open, x: d.left, y: d.top, w: d.width, h: d.height }; });
  ok(r.abierto && r.x >= 0 && r.x + r.w <= 390 && r.y >= 0 && r.y + r.h <= 664, `celular ${idioma}: ${JSON.stringify(r)}`);
  await p.screenshot({ path: `${C}/salir-celular-${idioma}.png` });
  await p.tap('#btn-seguir-jugando'); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => document.getElementById('salir-juego').open)), `celular ${idioma}: no cerró`);
  await ctx.close();
}
await b.close();
console.log(mal.length ? 'PROBLEMAS:\n- ' + mal.join('\n- ') : 'salir: todo bien');
