// Fotos del juego en vivo para el manual del taller v2 (Etapa 6.0 v2, 2026-10-26):
// lo que ve el facilitador en el proyector, en la vista Exhibición, haciendo
// exactamente lo que dice el manual (teclas E, 9, Espacio, 2 y R). Además
// comprueba que esos pasos hagan lo que el manual promete y lo imprime.
//   taller-vivo-1.jpg  antes de empezar: Exhibición con 9 tareas a la vez elegidas
//   taller-vivo-2.jpg  el día con 9, a media tarde, con la mosca fumando
//   taller-vivo-3.jpg  el fin del segundo día (con 2): la tabla compara los dos días
// Van a docs/contexto/img/. Necesita npm run dev.
// Uso: node scripts/taller-fotos-v2.mjs [dirección]
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const IMG = 'docs/contexto/img';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto(`${BASE}/jugar/`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
await p.evaluate(() => {
  localStorage.removeItem('mosca-del-wip-dias');
  localStorage.removeItem('mosca-del-wip-cerebro-oculto');
  localStorage.removeItem('mosca-del-wip-controles-oculto');
  localStorage.setItem('mosca-idioma', 'es');
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
await p.waitForTimeout(1000);
const estado = () => p.evaluate(() => {
  const m = window.__mosca;
  const e = m.estado();
  const aviso = document.getElementById('aviso-empezar');
  return {
    wip: e.wip, empezado: m.empezado(), terminado: e.terminado, fumando: e.fumando,
    hora: document.getElementById('reloj-texto')?.textContent.trim(),
    exhibicion: document.documentElement.classList.contains('exhibicion') || !!document.querySelector('.ex-barra, #ex-mosca'),
    avisoEmpezar: !!aviso && getComputedStyle(aviso).display !== 'none' && getComputedStyle(aviso).visibility !== 'hidden',
  };
});
// Recortes para el manual (en píxeles CSS; la foto sale al 1,5): 1 la tarjeta Empezar con el panel
// de la derecha, 2 la oficina con la tarjeta de estado, 3 la tabla que compara los dos días
const RECORTES = {
  1: { x: 290, y: 70, width: 1287, height: 830 },
  2: { x: 100, y: 120, width: 853, height: 569 },
  3: { x: 467, y: 493, width: 487, height: 325 },
};
const foto = async (n) => {
  await p.mouse.move(8, 450);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${IMG}/taller-vivo-${n}.jpg`, type: 'jpeg', quality: 88 });
  if (RECORTES[n]) await p.screenshot({ path: `${IMG}/taller-vivo-${n}-recorte.jpg`, type: 'jpeg', quality: 88, clip: RECORTES[n] });
  console.log('foto', n);
};
const espera = (ms) => p.waitForTimeout(ms);

// 1. Tecla E (Exhibición) y tecla 9: antes de empezar
await p.keyboard.press('e');
await espera(1800);
await p.keyboard.press('9');
await espera(700);
const e1 = await estado();
console.log('1. tras E y 9:', JSON.stringify(e1));
if (e1.wip !== 9) errores.push(`la tecla 9 no dejó 9 tareas a la vez (quedó ${e1.wip})`);
if (e1.empezado) errores.push('el día partió solo, antes de Espacio');
await foto(1);

// 2. Espacio: parte el día. Lo adelantamos hasta media tarde y lo dejamos quieto con la mosca fumando
await p.keyboard.press('Space');
await espera(600);
const e2 = await estado();
console.log('2. tras Espacio:', JSON.stringify(e2));
if (!e2.empezado) errores.push('Espacio no hizo partir el día');
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
if (!e4.empezado) console.log('   OJO: tras R el día espera a Espacio o Empezar (anotarlo así en el manual)');
await p.evaluate(() => {
  const m = window.__mosca;
  if (!m.empezado()) m.empezar();
  m.completarDia();
});
await espera(1800);
const e5 = await estado();
console.log('5. fin del día 2:', JSON.stringify(e5));
if (!e5.terminado) errores.push('el día 2 no terminó');
const filas = await p.evaluate(() => [...document.querySelectorAll('#ex-resumen tr, .ex-resumen tr, .resumen-dias tr, table tr')].map((tr) => tr.innerText.replace(/\s+/g, ' ').trim()).filter((t) => /WIP/.test(t)));
console.log('   tabla de días:', JSON.stringify(filas));
await foto(3);
await b.close();
if (errores.length) {
  console.log('taller-fotos-v2: errores', errores);
  process.exit(1);
}
console.log('taller-fotos-v2: 3 fotos en', IMG);
