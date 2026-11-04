// Fotos del juego en vivo para la guía rápida del taller v5 (Etapa 8.5, 2026-11-04):
// las mismas tres fotos de la v2 (scripts/taller-fotos-v2.mjs), con la misma vista,
// el mismo momento, el mismo encuadre y el mismo tamaño, pero con el juego de hoy
// (desde la 8.1 en Exhibición no hay tarjeta de inicio y desde la 8.3 está el botón
// "Mándale una urgencia" mientras corre el día). Además comprueba en el juego real
// cómo parte el día en cada vista y lo imprime, para escribirlo en la guía:
//   taller-vivo-1.jpg  antes de empezar: Exhibición con 9 tareas a la vez elegidas
//   taller-vivo-2.jpg  el día con 9, a media tarde, con la mosca fumando
//   taller-vivo-3.jpg  el fin del segundo día (con 2): la tabla compara los dos días
// Van a docs/contexto/img/ (y sus recortes -recorte.jpg). Necesita npm run dev.
// Uso: node scripts/taller-fotos-v5.mjs [dirección]
import { chromium, devices } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const IMG = 'docs/contexto/img';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
const limpiar = async (pag) => {
  await pag.goto(`${BASE}/jugar/`, { waitUntil: 'networkidle' });
  await pag.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await pag.evaluate(() => {
    localStorage.removeItem('mosca-del-wip-dias');
    localStorage.removeItem('mosca-del-wip-cerebro-oculto');
    localStorage.removeItem('mosca-del-wip-controles-oculto');
    localStorage.setItem('mosca-idioma', 'es');
  });
  await pag.reload({ waitUntil: 'networkidle' });
  await pag.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await pag.waitForTimeout(1000);
};
await limpiar(p);
const visible = (pag, sel) => pag.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return false;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return !el.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
}, sel);
const estado = async (pag = p) => ({
  ...(await pag.evaluate(() => {
    const m = window.__mosca;
    const e = m.estado();
    return {
      wip: e.wip, empezado: m.empezado(), terminado: e.terminado, fumando: e.fumando,
      hora: document.getElementById('reloj-texto')?.textContent.trim(),
      exhibicion: document.body.classList.contains('exhibicion'),
      botonEmpezar: document.getElementById('btn-empezar')?.textContent.trim(),
    };
  })),
  tarjeta: await visible(pag, '#aviso-empezar'),
  botonUrgencia: await visible(pag, '#btn-urgencia'),
});
// Recortes para la guía (en píxeles CSS; la foto sale al 1,5), los mismos de la v2
const RECORTES = {
  1: { x: 290, y: 70, width: 1287, height: 830 },
  2: { x: 100, y: 120, width: 853, height: 569 },
  3: { x: 467, y: 493, width: 487, height: 325 },
};
const foto = async (n) => {
  await p.mouse.move(8, 450);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${IMG}/taller-vivo-${n}.jpg`, type: 'jpeg', quality: 88 });
  await p.screenshot({ path: `${IMG}/taller-vivo-${n}-recorte.jpg`, type: 'jpeg', quality: 88, clip: RECORTES[n] });
  console.log('foto', n);
};
const espera = (ms) => p.waitForTimeout(ms);

// 1. Tecla E (Exhibición) y tecla 9: antes de empezar. Desde la 8.1 no hay tarjeta en Exhibición.
await p.keyboard.press('e');
await espera(1800);
await p.keyboard.press('9');
await espera(700);
const e1 = await estado();
console.log('1. Exhibición, tras E y 9:', JSON.stringify(e1));
if (!e1.exhibicion) errores.push('la tecla E no dejó la vista Exhibición');
if (e1.wip !== 9) errores.push(`la tecla 9 no dejó 9 tareas a la vez (quedó ${e1.wip})`);
if (e1.empezado) errores.push('el día partió solo, antes de Espacio');
if (e1.tarjeta) errores.push('en Exhibición se ve la tarjeta de inicio (no debería, desde la 8.1)');
const barra = await p.evaluate(() => document.querySelector('.ex-barra, #ex-barra, .exhibicion-barra')?.innerText.replace(/\s+/g, ' ').trim() ?? '');
console.log('   barra de Exhibición:', JSON.stringify(barra.slice(0, 200)));
await foto(1);

// 2. Espacio parte el día en Exhibición. Lo adelantamos hasta media tarde con la mosca fumando
await p.keyboard.press('Space');
await espera(600);
const e2 = await estado();
console.log('2. tras Espacio:', JSON.stringify(e2));
if (!e2.empezado) errores.push('Espacio no hizo partir el día en Exhibición');
await p.evaluate(() => {
  const m = window.__mosca;
  m.detenerReloj(false);
  m.congelar(false);
  const ahora = () => 540 + m.estado().fraccionDelDia * 540;
  m.adelantar(Math.max(0, 13 * 60 + 30 - ahora()));
  for (let i = 0; i < 400 && !m.estado().fumando; i++) m.adelantar(0.5);
  m.detenerReloj(true);
  m.congelar(true);
  m.avanzar(0);
  m.avanzar(20);
  m.avanzar(2.3); // el cigarro en la trompita
});
const e2b = await estado();
console.log('   a media tarde:', JSON.stringify(e2b));
await foto(2);

// 3. Termina el día 1; tecla 2 y tecla R: el segundo día con 2 tareas a la vez
await p.evaluate(() => {
  const m = window.__mosca;
  m.detenerReloj(false);
  m.congelar(false);
  m.completarDia();
});
await espera(1500);
const e3 = await estado();
console.log('3. fin del día 1:', JSON.stringify(e3));
if (!e3.terminado) errores.push('el día 1 no terminó');
await p.keyboard.press('2');
await espera(500);
await p.keyboard.press('r');
await espera(900);
const e4 = await estado();
console.log('4. tras 2 y R:', JSON.stringify(e4));
if (e4.wip !== 2) errores.push(`tras 2 y R el límite no es 2 (es ${e4.wip})`);
if (e4.terminado) errores.push('tras R el día sigue terminado');
let rEspera = !e4.empezado;
if (rEspera) {
  console.log('   tras R el día ESPERA: hace falta Espacio de nuevo (anotarlo así en la guía)');
  await p.keyboard.press('Space');
  await espera(600);
  const e4b = await estado();
  console.log('   tras Espacio:', JSON.stringify(e4b));
  if (!e4b.empezado) errores.push('tras R, Espacio no hizo partir el día 2');
} else {
  console.log('   tras R el día 2 parte solo');
}
await p.evaluate(() => {
  const m = window.__mosca;
  m.detenerReloj(false);
  m.congelar(false);
  m.completarDia();
});
await espera(1800);
const e5 = await estado();
console.log('5. fin del día 2:', JSON.stringify(e5));
if (!e5.terminado) errores.push('el día 2 no terminó');
const filas = await p.evaluate(() => [...document.querySelectorAll('table tr')].map((tr) => tr.innerText.replace(/\s+/g, ' ').trim()).filter((t) => /WIP/.test(t)));
console.log('   tabla de días:', JSON.stringify(filas));
await foto(3);

// 6. Cómo parte el día en la vista normal (Control) y en el celular: la tarjeta y su botón
const c = await b.newPage({ viewport: { width: 1600, height: 900 } });
await limpiar(c);
const ec = await estado(c);
console.log('6. Control al entrar:', JSON.stringify(ec));
if (!ec.tarjeta || ec.botonEmpezar !== 'Empezar el día') errores.push('en Control no está la tarjeta con "Empezar el día"');
await c.click('#btn-empezar');
await c.waitForTimeout(500);
const ec2 = await estado(c);
console.log('   tras el botón:', JSON.stringify(ec2));
if (!ec2.empezado || ec2.tarjeta) errores.push('en Control el botón "Empezar el día" no partió el día');
await c.close();
const ctx = await b.newContext({ ...devices['iPhone 14'], locale: 'es-CL' });
const m = await ctx.newPage();
m.on('pageerror', (e) => errores.push(e.message));
await limpiar(m);
const em = await estado(m);
console.log('7. Celular al entrar:', JSON.stringify(em));
if (!em.tarjeta || em.botonEmpezar !== 'Empezar el día') errores.push('en el celular no está la tarjeta con "Empezar el día"');
await m.tap('#btn-empezar');
await m.waitForTimeout(500);
const em2 = await estado(m);
console.log('   tras el botón:', JSON.stringify(em2));
if (!em2.empezado || em2.tarjeta) errores.push('en el celular el botón "Empezar el día" no partió el día');
await ctx.close();
await b.close();
console.log(`RESUMEN: Exhibición parte con Espacio (sin tarjeta); tras R el día ${rEspera ? 'espera Espacio' : 'parte solo'}; Control y celular parten con el botón "Empezar el día" de la tarjeta.`);
if (errores.length) {
  console.log('taller-fotos-v5: errores', errores);
  process.exit(1);
}
console.log('taller-fotos-v5: 3 fotos en', IMG);
