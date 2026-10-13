// Juega días normales (sin forzar nada) con WIP 2, 5, 7 y 10 y saca capturas
// a media jornada (13:30) en Control y Exhibición, y al final del día (panel
// con "Días jugados" y resumen de la exhibición). Imprime lo que marca el
// juego y los choques. Sirve para ver que el juego sea gradual.
// Requiere npm run dev. Uso: node scripts/capturas-wip.mjs  (WIPS=2,10 para elegir)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const WIPS = (process.env.WIPS ?? '2,5,7,10').split(',').map(Number);
mkdirSync('capturas', { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
p.on('pageerror', (e) => console.log('ERROR', e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) console.log('CONSOLA', m.text()); });
const abrir = async () => {
  await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
};
await abrir();
await p.evaluate(() => ['mosca-del-wip-dias', 'mosca-del-wip-cerebro-oculto', 'mosca-del-wip-controles-oculto'].forEach((k) => localStorage.removeItem(k)));
await abrir();

const leer = () => p.evaluate(() => {
  const e = window.__mosca.estado();
  const t = e.tiempoPorTarea === null ? '–' : Math.round(e.tiempoPorTarea);
  return `${e.hora} · ${e.hechas} terminadas · ${t} min por tarea · ${e.colillas} colillas · ${e.cafes} cafés · estrés ${Math.round(e.estres)}% (${e.nivel.nombre}) · panel: "${document.getElementById('m-tiempo').textContent}"`;
});
const choques = async () => {
  const c = await p.evaluate(() => window.__mosca.choques());
  return Object.keys(c).length ? JSON.stringify(c) : 'ninguno';
};

for (const w of WIPS) {
  await p.evaluate(() => window.__mosca.vista('control'));
  await p.waitForTimeout(800);
  await p.evaluate((w) => { window.__mosca.diaExhibicion(w); window.__mosca.adelantar(270); }, w);
  await p.evaluate(() => window.__mosca.avanzar(4)); // la mosca se acomoda a su estrés
  await p.waitForTimeout(1500);
  console.log(`WIP ${w} a media jornada: ${await leer()} · choques: ${await choques()}`);
  await p.screenshot({ path: `capturas/wip${w}-control-1330.png` });
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `capturas/wip${w}-exhibicion-1330.png` });
  await p.evaluate(() => window.__mosca.completarDia());
  await p.waitForTimeout(1200);
  console.log(`WIP ${w} fin del día:      ${await leer()}`);
  await p.screenshot({ path: `capturas/wip${w}-exhibicion-fin.png` });
}
await p.evaluate(() => window.__mosca.vista('control'));
await p.waitForTimeout(1200);
await p.screenshot({ path: 'capturas/dias-jugados-panel.png', clip: { x: 1512 - 290, y: 0, width: 290, height: 860 } });
console.log('Días jugados:', await p.evaluate(() => [...document.querySelectorAll('#tabla-dias-body tr')].map((tr) => [...tr.querySelectorAll('td')].slice(0, 6).map((td) => td.textContent).join(' | ')).join('  //  ')));
await b.close();
