// Prueba del botón "← Inicio" (5.2i, pedido de Felipe): saca capturas de Control
// con los paneles abiertos y cerrados (teclas B y C) y de Exhibición, en español
// e inglés y en dos tamaños (1440×900 y la ventana de Felipe, 1906×830), y
// comprueba que el enlace se vea en la esquina, no se monte con la tarjeta del
// cerebro ni con el botón Cerebro, sea lo primero con la tecla Tab, lleve a la
// portada en el mismo idioma sin ningún cuadro de confirmación y que los días
// jugados sigan iguales al volver. Requiere npm run dev.
// Uso: node scripts/probar-inicio.mjs   → debe decir "inicio: todo bien"
//   CAPTURAS=<carpeta> (docs/etapa5-2i-capturas por defecto), JUEGO=<dirección>,
//   TAMANOS=1440x900,1906x830
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const DIR = process.env.CAPTURAS ?? 'docs/etapa5-2i-capturas';
const JUEGO = process.env.JUEGO ?? 'http://localhost:5173/jugar/';
mkdirSync(DIR, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const problemas = [];
const ok = (cond, msg) => { if (!cond) problemas.push(msg); };
const TAMANOS = (process.env.TAMANOS ?? '1440x900,1906x830').split(',').map((t) => t.split('x').map(Number));
for (const [w, h] of TAMANOS) for (const idioma of ['es', 'en']) {
  const tag = `${idioma}-${w}x${h}`;
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => problemas.push(`error ${tag}: ${e.message}`));
  p.on('dialog', (d) => { problemas.push(`${tag}: apareció un diálogo: ${d.message()}`); d.dismiss(); });
  await p.goto(JUEGO, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate((idioma) => { localStorage.clear(); localStorage.setItem('mosca-idioma', idioma); }, idioma);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.waitForTimeout(800);
  // un día jugado con 2 (queda en la tabla) y el de hoy con 9 hasta las 13:30
  await p.evaluate(() => { const m = window.__mosca; m.empezar(); m.diaExhibicion(2); m.adelantar(540); m.completarDia(); });
  await p.waitForTimeout(600);
  await p.evaluate(() => { const m = window.__mosca; m.diaExhibicion(9); m.adelantar(270); m.detenerReloj(true); m.avanzar(0); m.avanzar(3); });
  await p.waitForTimeout(1500);
  const foto = async (nombre, clip) => {
    await p.mouse.move(Math.round(w / 2), h - 4);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${DIR}/${nombre}-${tag}.png`, ...(clip ? { clip } : {}) });
  };
  const medir = (sel) => p.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), vis: el.getClientRects().length > 0 && cs.visibility === 'visible' && cs.opacity !== '0', texto: el.textContent.trim(), href: el.getAttribute('href'), title: el.getAttribute('title') };
  }, sel);
  const esperado = idioma === 'en' ? { texto: 'Home', href: '/?lang=en', title: 'Back to the home page' } : { texto: 'Inicio', href: '/', title: 'Volver a la portada' };
  const revisarEnlace = async (sel, estado) => {
    const e = await medir(sel);
    ok(e && e.vis, `${tag} ${estado}: ${sel} no se ve`);
    if (!e) return null;
    ok(e.texto === esperado.texto, `${tag} ${estado}: texto "${e.texto}" (esperaba "${esperado.texto}")`);
    ok(e.href === esperado.href, `${tag} ${estado}: href "${e.href}" (esperaba "${esperado.href}")`);
    ok(e.title === esperado.title, `${tag} ${estado}: title "${e.title}"`);
    ok(e.x >= 0 && e.y >= 0 && e.x + e.w <= w && e.y + e.h <= h, `${tag} ${estado}: el enlace se sale de la pantalla ${JSON.stringify(e)}`);
    return e;
  };
  // --- Control, paneles abiertos ---
  const c0 = await revisarEnlace('#volver-inicio', 'control');
  const cer = await medir('#cerebro');
  ok(cer && cer.y >= c0.y + c0.h + 4, `${tag}: la tarjeta del cerebro (y=${cer?.y}) se monta sobre el enlace (hasta y=${c0.y + c0.h})`);
  ok(cer && cer.y + cer.h <= h - 8, `${tag}: la tarjeta del cerebro se sale por abajo (${cer?.y + cer?.h} > ${h})`);
  ok(c0.x === 16 && c0.y === 16, `${tag}: el enlace no está en la esquina (${c0.x},${c0.y})`);
  await foto('control');
  await foto('control-zoom', { x: 0, y: 0, width: 400, height: 110 });
  // primer Tab: el enlace es lo primero con el teclado
  await p.keyboard.press('Tab');
  const foco = await p.evaluate(() => document.activeElement?.id);
  ok(foco === 'volver-inicio', `${tag}: el primer Tab va a "${foco}", no al enlace`);
  await p.mouse.click(Math.round(w / 2), h - 4); // suelta el foco
  // --- Control sin cerebro (B) ---
  await p.keyboard.press('b');
  await p.waitForTimeout(1200);
  await revisarEnlace('#volver-inicio', 'sin cerebro');
  const bc = await medir('#btn-mostrar-cerebro');
  ok(bc && bc.vis && bc.x >= c0.x + c0.w + 4, `${tag} sin cerebro: el botón Cerebro (x=${bc?.x}) no queda a la derecha del enlace`);
  await foto('control-sin-cerebro');
  await foto('control-sin-cerebro-zoom', { x: 0, y: 0, width: 400, height: 110 });
  // --- Control sin cerebro ni controles (B + C) ---
  await p.keyboard.press('c');
  await p.waitForTimeout(1200);
  await revisarEnlace('#volver-inicio', 'sin paneles');
  await foto('control-sin-paneles');
  // --- Control sin controles (C) con cerebro ---
  await p.keyboard.press('b');
  await p.waitForTimeout(1200);
  await revisarEnlace('#volver-inicio', 'sin controles');
  await foto('control-sin-controles');
  await p.keyboard.press('c');
  await p.waitForTimeout(1200);
  // --- Exhibición ---
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(1800);
  const ctrlOculto = await medir('#volver-inicio');
  ok(!ctrlOculto || !ctrlOculto.vis, `${tag} exhibición: la píldora de Control sigue visible`);
  const ex = await revisarEnlace('.volver-inicio-barra', 'exhibición');
  const marca = await medir('.marca');
  ok(ex && marca && marca.x >= ex.x + ex.w + 8, `${tag} exhibición: la marca (x=${marca?.x}) se monta sobre el enlace`);
  await foto('exhibicion');
  await foto('exhibicion-zoom', { x: 0, y: 0, width: 520, height: 80 });
  const primero = await p.evaluate(() => {
    const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible';
    return [...document.querySelectorAll('a[href], button, input, [tabindex]')].find((el) => visible(el) && el.tabIndex >= 0)?.className;
  });
  ok(String(primero).includes('volver-inicio-barra'), `${tag} exhibición: lo primero con Tab es "${primero}"`);
  // --- Clic: lleva a la portada en el mismo idioma, sin preguntar, y los días siguen ---
  const tablaAntes = await p.evaluate(() => document.getElementById('tabla-dias-body').textContent.replace(/\s+/g, ''));
  ok(tablaAntes.trim().length > 0, `${tag}: la tabla de días está vacía antes del clic`);
  await p.click('.volver-inicio-barra');
  await p.waitForURL((u) => u.pathname === '/', { timeout: 10000 });
  await p.waitForTimeout(500);
  const url1 = new URL(p.url());
  ok(url1.search === (idioma === 'en' ? '?lang=en' : ''), `${tag} exhibición: llegó a ${url1.pathname}${url1.search}`);
  ok((await p.evaluate(() => document.documentElement.lang)) === idioma, `${tag}: la portada no está en ${idioma}`);
  await p.goto(JUEGO + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.waitForTimeout(800);
  const tablaDespues = await p.evaluate(() => document.getElementById('tabla-dias-body').textContent.replace(/\s+/g, ''));
  ok(tablaAntes === tablaDespues, `${tag}: la tabla de días cambió al volver:\n${tablaAntes}\n---\n${tablaDespues}`);
  // y el de Control
  await p.click('#volver-inicio');
  await p.waitForURL((u) => u.pathname === '/', { timeout: 10000 });
  const url2 = new URL(p.url());
  ok(url2.search === (idioma === 'en' ? '?lang=en' : ''), `${tag} control: llegó a ${url2.pathname}${url2.search}`);
  await ctx.close();
  console.log(`${tag}: listo`);
}
await b.close();
if (problemas.length) { console.log('PROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
console.log('inicio: todo bien');
