// Comprobación del juego PUBLICADO, sin los enganches window.__mosca (solo existen con
// `npm run dev`, así que probar-inicio y probar-celular no sirven contra el sitio real).
// Revisa el botón "← Inicio" en Control (con los paneles abiertos y cerrados, teclas B y C) y
// en Exhibición, en español e inglés; que lleve a la portada en el mismo idioma sin preguntar;
// que la portada diga "Creado por Felipe Fernández" y "9 terminadas (la mitad)"; y que en el
// celular no se vea la píldora (ahí sigue la flecha). Nació en la 5.2i (docs/etapa5-2i.md).
//   node scripts/probar-sitio-juego.mjs            → contra https://mosca.deliverycraft.ai
//   SITIO=http://localhost:4173 node scripts/...   → contra otra dirección (sin / al final)
//   CAPTURAS=<carpeta>                             → dónde dejar las capturas (capturas/sitio-juego)
// Debe terminar con "sitio juego: todo bien".
import { mkdirSync } from 'node:fs';
import { chromium, devices } from 'playwright';
const U = (process.env.SITIO ?? 'https://mosca.deliverycraft.ai').replace(/\/$/, '');
const C = process.env.CAPTURAS ?? 'capturas/sitio-juego';
mkdirSync(C, { recursive: true });
const problemas = [];
const mal = (m) => problemas.push(m);
const b = await chromium.launch();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const caja = (p, sel) => p.evaluate((s) => { const el = document.querySelector(s); if (!el || !el.getClientRects().length) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, texto: el.textContent.trim(), href: el.getAttribute('href'), title: el.getAttribute('title') }; }, sel);

for (const idioma of ['es', 'en']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-CL' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => mal(`error de página (${idioma}): ${e.message}`));
  p.on('dialog', (d) => { mal(`${idioma}: apareció un diálogo: ${d.message()}`); d.dismiss(); });
  const juego = idioma === 'es' ? `${U}/jugar/` : `${U}/jugar/?lang=en`;
  const esperado = idioma === 'es'
    ? { texto: 'Inicio', href: '/', title: 'Volver a la portada', lang: 'es', ruta: '/' }
    : { texto: 'Home', href: '/en/', title: 'Back to the home page', lang: 'en', ruta: '/en/' }; // la portada en inglés vive en /en/ (Etapa 7)

  const abrir = async () => {
    await p.goto(juego, { waitUntil: 'networkidle' });
    await p.waitForSelector('#btn-empezar', { state: 'visible' });
    await p.click('#btn-empezar');
    await esperar(2500);
  };
  await abrir();

  // Control con los paneles abiertos
  const pill = await caja(p, '#volver-inicio');
  if (!pill) mal(`${idioma}: la píldora #volver-inicio no se ve en Control`);
  else {
    if (pill.texto !== esperado.texto) mal(`${idioma}: la píldora dice "${pill.texto}" y no "${esperado.texto}"`);
    if (pill.href !== esperado.href) mal(`${idioma}: href "${pill.href}" y no "${esperado.href}"`);
    if (pill.title !== esperado.title) mal(`${idioma}: title "${pill.title}" y no "${esperado.title}"`);
    if (Math.round(pill.x) !== 16 || Math.round(pill.y) !== 16) mal(`${idioma}: la píldora está en (${pill.x}, ${pill.y}) y no en (16, 16)`);
    const cerebro = await caja(p, '#cerebro');
    if (!cerebro) mal(`${idioma}: no se ve la tarjeta del cerebro`);
    else if (cerebro.y < pill.y + pill.h + 4) mal(`${idioma}: la tarjeta del cerebro (y=${cerebro.y}) se monta sobre la píldora (hasta ${pill.y + pill.h})`);
  }
  await p.screenshot({ path: `${C}/control-${idioma}.png` });
  // Sin cerebro (B)
  await p.keyboard.press('b'); await esperar(400);
  const btnCerebro = await caja(p, '#btn-mostrar-cerebro');
  const pill2 = await caja(p, '#volver-inicio');
  if (!pill2) mal(`${idioma}: sin cerebro, la píldora desaparece`);
  if (!btnCerebro) mal(`${idioma}: sin cerebro, no aparece el botón "Cerebro"`);
  else if (pill2 && btnCerebro.x < pill2.x + pill2.w) mal(`${idioma}: el botón Cerebro (x=${btnCerebro.x}) se monta sobre la píldora`);
  await p.screenshot({ path: `${C}/control-sin-cerebro-${idioma}.png` });
  await p.keyboard.press('b'); await esperar(300);
  // Sin controles (C)
  await p.keyboard.press('c'); await esperar(400);
  if (!(await caja(p, '#volver-inicio'))) mal(`${idioma}: sin controles, la píldora desaparece`);
  await p.screenshot({ path: `${C}/control-sin-controles-${idioma}.png` });
  // Sin los dos
  await p.keyboard.press('b'); await esperar(400);
  if (!(await caja(p, '#volver-inicio'))) mal(`${idioma}: sin paneles, la píldora desaparece`);
  await p.screenshot({ path: `${C}/control-sin-paneles-${idioma}.png` });
  await p.keyboard.press('b'); await p.keyboard.press('c'); await esperar(300);
  // Exhibición (E)
  await p.keyboard.press('e'); await esperar(1200);
  const barra = await caja(p, '.volver-inicio-barra');
  if (!barra) mal(`${idioma}: en Exhibición no se ve el enlace de la barra`);
  else {
    if (barra.texto !== esperado.texto) mal(`${idioma}: la barra dice "${barra.texto}"`);
    if (barra.href !== esperado.href) mal(`${idioma}: href de la barra "${barra.href}"`);
  }
  if (await caja(p, '#volver-inicio')) mal(`${idioma}: en Exhibición sigue visible la píldora de Control`);
  await p.screenshot({ path: `${C}/exhibicion-${idioma}.png` });
  // Clic desde Exhibición → portada en el mismo idioma
  await p.click('.volver-inicio-barra');
  await p.waitForSelector('#salir-juego[open]');
  await p.click('#btn-salir-juego');
  await p.waitForURL((u) => u.pathname === '/', { timeout: 10000 });
  await p.waitForLoadState('networkidle');
  let u = new URL(p.url());
  let lang = await p.evaluate(() => document.documentElement.lang);
  if (u.pathname !== esperado.ruta || lang !== esperado.lang) mal(`${idioma}: desde Exhibición llegó a ${u.pathname}${u.search} (lang=${lang})`);
  // Clic desde Control → portada en el mismo idioma
  await abrir();
  await p.click('#volver-inicio');
  await p.waitForSelector('#salir-juego[open]');
  await p.click('#btn-salir-juego');
  await p.waitForURL((u) => u.pathname === '/', { timeout: 10000 });
  await p.waitForLoadState('networkidle');
  u = new URL(p.url());
  lang = await p.evaluate(() => document.documentElement.lang);
  if (u.pathname !== esperado.ruta || lang !== esperado.lang) mal(`${idioma}: desde Control llegó a ${u.pathname}${u.search} (lang=${lang})`);
  const creado = await p.evaluate(() => document.querySelector('.nota-autor')?.textContent.trim());
  const col9 = await p.evaluate(() => document.querySelector('[data-t="total9"]')?.textContent.replace(/\s+/g, ' ').trim());
  const esperadoCreado = idioma === 'es' ? 'Creado por Felipe Fernández' : 'Created by Felipe Fernández';
  const esperadoCol9 = idioma === 'es' ? '9 terminadas (la mitad)' : '9 finished (half)';
  if (creado !== esperadoCreado) mal(`${idioma}: la portada dice "${creado}" y no "${esperadoCreado}"`);
  if (col9 !== esperadoCol9) mal(`${idioma}: la columna dice "${col9}" y no "${esperadoCol9}"`);
  const linkedin = await p.evaluate(() => { const a = document.querySelector('.nota-autor a'); return a && { href: a.href, target: a.target, rel: a.rel }; });
  if (!linkedin || linkedin.href !== 'https://www.linkedin.com/in/felipefernandezandrade/' || linkedin.target !== '_blank') mal(`${idioma}: el enlace a LinkedIn está mal: ${JSON.stringify(linkedin)}`);
  await ctx.close();
}

// Celular: la píldora no se ve, sigue la flecha
for (const idioma of ['es', 'en']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 14'].userAgent, locale: 'es-CL' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => mal(`error de página (celular ${idioma}): ${e.message}`));
  await p.goto(idioma === 'es' ? `${U}/jugar/` : `${U}/jugar/?lang=en`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.documentElement.classList.contains('celular'));
  await p.waitForSelector('#btn-empezar', { state: 'visible' });
  await p.tap('#btn-empezar'); await esperar(2500);
  if (await caja(p, '#volver-inicio')) mal(`celular ${idioma}: se ve la píldora de computador`);
  const flecha = await caja(p, '#cel-volver');
  if (!flecha) mal(`celular ${idioma}: no se ve la flecha para volver`);
  else if (flecha.href !== (idioma === 'es' ? '/' : '/en/')) mal(`celular ${idioma}: la flecha lleva a "${flecha.href}"`);
  await p.screenshot({ path: `${C}/celular-${idioma}.png` });
  await ctx.close();
}
await b.close();
if (problemas.length) { console.log('PROBLEMAS:\n- ' + problemas.join('\n- ')); process.exit(1); }
console.log(`sitio juego: todo bien (Control con paneles abiertos y cerrados, Exhibición, vuelta a la portada en es y en, celular; capturas en ${C}/)`);
