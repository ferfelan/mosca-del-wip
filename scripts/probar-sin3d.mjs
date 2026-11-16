// Prueba del aviso cuando el navegador no puede mostrar la oficina en 3D
// (revisión final v3, M8, 2026-11-15). Nunca una oficina vacía sin
// explicación.
// 1. Sin 3D (Chromium con --disable-3d-apis, en español y en inglés, en
//    computador y en dos celulares): el aviso sale solo, es un cuadro que
//    tapa la página, dice "Tu navegador no puede mostrar la oficina en 3D."
//    en el idioma elegido, enlaza la guía y el informe de ese idioma, el
//    botón de idioma marca el elegido, Esc no lo cierra y no hay errores.
// 2. El 3D se pierde y vuelve (WEBGL_lose_context): con 3D no sale nada, al
//    perderse sale "Se perdió el dibujo 3D." con "Recargar la página", y al
//    volver el aviso se cierra solo.
// No usa window.__mosca: corre con npm run dev y contra el sitio publicado
// (responde vacío a /_vercel/, así no suma visitas al contador de Vercel).
// Uso: node scripts/probar-sin3d.mjs   → debe decir "sin 3D: todo bien" y
//   salir con 0 (con 1 si encuentra algo).
//   JUEGO=<dirección> (http://localhost:5173/jugar/ por defecto),
//   CAPTURAS=<carpeta> (capturas/sin3d por defecto),
//   NAVEGADOR=webkit hace la parte 2 en el motor de Safari (la parte 1 va
//   siempre en Chromium: WebKit no deja apagar el 3D)
import { chromium, webkit } from 'playwright';
import { mkdirSync } from 'node:fs';

const U = process.env.JUEGO ?? 'http://localhost:5173/jugar/';
const C = process.env.CAPTURAS ?? 'capturas/sin3d';
mkdirSync(C, { recursive: true });
const mal = [];
const ok = (c, m) => { if (!c) mal.push(m); };
const CON_3D = ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'];

const ESPERADO = {
  es: { titulo: 'Tu navegador no puede mostrar la oficina en 3D.', enlaces: [['Leer la guía', '/limite-wip/'], ['Leer el informe', '/informe/']], perdido: 'Se perdió el dibujo 3D.', recargar: 'Recargar la página' },
  en: { titulo: 'Your browser can’t show the office in 3D.', enlaces: [['Read the guide', '/en/wip-limit/'], ['Read the report', '/en/report/']], perdido: 'The 3D view was lost.', recargar: 'Reload the page' },
};

// 1. Sin 3D
const sin = await chromium.launch({ args: ['--disable-3d-apis'] });
for (const [idioma, ancho, alto] of [['es', 1280, 800], ['en', 1280, 800], ['es', 375, 740], ['en', 320, 568]]) {
  const tag = `sin 3D ${idioma} ${ancho}×${alto}`;
  const ctx = await sin.newContext({ viewport: { width: ancho, height: alto } });
  await ctx.route('**/_vercel/**', (r) => r.fulfill({ status: 204, body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => mal.push(`${tag}: error ${e.message}`));
  p.on('dialog', (d) => { mal.push(`${tag}: diálogo del navegador ${d.message()}`); d.dismiss(); });
  await p.goto(U + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.getElementById('aviso-3d')?.open, null, { timeout: 15000 }).catch(() => {});
  const r = await p.evaluate(() => {
    const d = document.getElementById('aviso-3d');
    if (!d) return null;
    const ve = (el) => Boolean(el) && !el.hidden && el.getClientRects().length > 0;
    const t = d.querySelector('.salir-tarjeta').getBoundingClientRect();
    return {
      abierto: d.open, modal: d.matches(':modal'),
      titulo: document.getElementById('aviso-3d-titulo').textContent.trim(),
      sin: ve(document.getElementById('aviso-3d-sin')),
      perdido: ve(document.getElementById('aviso-3d-perdido')),
      recargar: ve(document.getElementById('btn-recargar-3d')),
      enlaces: [...d.querySelectorAll('a')].filter(ve).map((a) => [a.textContent.trim(), a.getAttribute('href')]),
      botones: [...document.querySelectorAll('[data-idioma]')].map((b) => `${b.dataset.idioma}=${b.getAttribute('aria-pressed')}`),
      dentro: t.left >= 0 && t.top >= 0 && t.right <= innerWidth && t.bottom <= innerHeight,
    };
  });
  if (!r) { ok(false, `${tag}: la página no tiene el aviso`); await ctx.close(); continue; }
  ok(r.abierto && r.modal, `${tag}: el aviso no salió como cuadro`);
  ok(r.titulo === ESPERADO[idioma].titulo, `${tag}: título "${r.titulo}"`);
  ok(r.sin && !r.perdido && !r.recargar, `${tag}: se ve una parte que no corresponde (${JSON.stringify(r)})`);
  ok(JSON.stringify(r.enlaces) === JSON.stringify(ESPERADO[idioma].enlaces), `${tag}: enlaces ${JSON.stringify(r.enlaces)}`);
  ok(r.botones.every((b) => b.endsWith(String(b.startsWith(`${idioma}=`)))), `${tag}: botones de idioma ${r.botones.join(' ')}`);
  ok(r.dentro, `${tag}: la tarjeta no cabe en la pantalla`);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.getElementById('aviso-3d').open), `${tag}: Esc lo cerró`);
  await p.screenshot({ path: `${C}/sin3d-${idioma}-${ancho}.png` });
  await ctx.close();
}
await sin.close();

// 2. El 3D se pierde y vuelve
const webkitPedido = process.env.NAVEGADOR === 'webkit';
const b = webkitPedido ? await webkit.launch() : await chromium.launch({ args: CON_3D });
const motor = webkitPedido ? 'webkit' : 'chromium';
for (const idioma of ['es', 'en']) {
  const tag = `3D perdido ${motor} ${idioma}`;
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route('**/_vercel/**', (r) => r.fulfill({ status: 204, body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => mal.push(`${tag}: error ${e.message}`));
  await p.goto(U + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
  await p.waitForSelector('#btn-empezar', { state: 'visible' });
  await p.waitForTimeout(800);
  if (!(await p.$('#aviso-3d'))) { ok(false, `${tag}: la página no tiene el aviso`); await ctx.close(); continue; }
  ok(!(await p.evaluate(() => document.getElementById('aviso-3d').open)), `${tag}: con 3D salió el aviso`);
  await p.evaluate(() => {
    window.__perder3d = document.getElementById('lienzo-3d').getContext('webgl2').getExtension('WEBGL_lose_context');
    window.__perder3d.loseContext();
  });
  await p.waitForFunction(() => document.getElementById('aviso-3d').open, null, { timeout: 5000 }).catch(() => {});
  const r = await p.evaluate(() => ({
    abierto: document.getElementById('aviso-3d').open,
    titulo: document.getElementById('aviso-3d-titulo-perdido').textContent.trim(),
    recargar: document.getElementById('btn-recargar-3d').hidden ? '' : document.getElementById('btn-recargar-3d').textContent.trim(),
    sin: !document.getElementById('aviso-3d-sin').hidden,
    describe: document.getElementById('aviso-3d').getAttribute('aria-labelledby'),
  }));
  ok(r.abierto && !r.sin && r.titulo === ESPERADO[idioma].perdido && r.recargar === ESPERADO[idioma].recargar && r.describe === 'aviso-3d-titulo-perdido', `${tag}: ${JSON.stringify(r)}`);
  await p.screenshot({ path: `${C}/perdido-${motor}-${idioma}.png` });
  await p.evaluate(() => window.__perder3d.restoreContext());
  await p.waitForFunction(() => !document.getElementById('aviso-3d').open, null, { timeout: 5000 }).catch(() => {});
  ok(!(await p.evaluate(() => document.getElementById('aviso-3d').open)), `${tag}: al volver el 3D el aviso no se cerró`);
  await ctx.close();
}
await b.close();

console.log(mal.length ? 'PROBLEMAS:\n- ' + mal.join('\n- ') : 'sin 3D: todo bien');
if (mal.length) process.exitCode = 1;
