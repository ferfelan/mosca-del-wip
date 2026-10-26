// Fotos del juego en el celular para la guía y la presentación del taller
// (Etapa 6.0, 2026-10-26): lo que ve una pareja en su teléfono.
//   taller-cel-1.jpg  antes de Empezar: elegir el límite (1 a 10)
//   taller-cel-2.jpg  la velocidad en x4 (un día en 15 segundos)
//   taller-cel-3.jpg  el fin del día: las terminadas
//   taller-cel-4.jpg  la pestaña Días: la tabla con dos días jugados
// Van a docs/contexto/img/. Necesita npm run dev.
// Uso: node scripts/taller-fotos.mjs [dirección]
import { chromium, devices } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const IMG = 'docs/contexto/img';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
// iPhone 14 con Safari (lo que queda a la vista con las barras del navegador)
const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 14'].userAgent });
const p = await ctx.newPage();
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto(`${BASE}/jugar/`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
await p.evaluate(() => localStorage.removeItem('mosca-del-wip-dias'));
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
await p.waitForTimeout(1200);
const foto = (n) => p.screenshot({ path: `${IMG}/taller-cel-${n}.jpg`, type: 'jpeg', quality: 88 });
// 1. Elegir el límite antes de Empezar (la hoja de abajo, con 3 por defecto)
await foto(1);
// 2. La velocidad: dos toques, x1 → x2 → x4
await p.locator('#btn-velocidad').tap();
await p.locator('#btn-velocidad').tap();
if ((await p.locator('#btn-velocidad').textContent()).trim() !== 'x4') errores.push('la velocidad no quedó en x4');
await foto(2);
// 3. El fin del día con el límite 3
await p.evaluate(() => window.__mosca.empezar());
await p.waitForFunction(() => document.getElementById('reloj-texto').textContent.trim() === '18:00', null, { timeout: 90000 });
await p.waitForTimeout(1500);
await foto(3);
// 4. Un segundo día con 9 y la pestaña Días
await p.keyboard.press('r');
await p.waitForTimeout(400);
await p.evaluate(() => window.__mosca.setWip(9));
await p.waitForTimeout(300);
await p.evaluate(() => window.__mosca.completarDia());
await p.waitForTimeout(1200);
await p.locator('#cel-pestana-dias').tap();
await p.waitForTimeout(800);
await foto(4);
await b.close();
if (errores.length) {
  console.log('taller-fotos: errores', errores);
  process.exit(1);
}
console.log('taller-fotos: 4 fotos en', IMG);
