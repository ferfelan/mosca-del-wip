// Juega días normales (sin forzar nada) con WIP 2, 5, 7 y 10 y saca capturas
// a media jornada (13:30) en Control y Exhibición, y al final del día (panel
// con "Días jugados" y resumen de la exhibición). Después juega un día con
// WIP 10 que a las 12:00 baja a 2 (capturas a las 12, 13, 14 y 15 h) y un
// día con WIP 3 y tareas bloqueadas (una, y después todas: la mosca espera).
// Imprime lo que marca el juego y los choques.
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
  await p.goto('http://localhost:5173/jugar/', { waitUntil: 'networkidle' });
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
// Bajar el WIP a mitad del día: 10 desde las 09:00 y a las 12:00 baja a 2.
// Lo empezado sigue abierto y drena; el estrés baja de a poco.
if (!process.env.WIPS) {
  await p.evaluate(() => window.__mosca.vista('control'));
  await p.waitForTimeout(800);
  await p.evaluate(() => { window.__mosca.diaExhibicion(10); window.__mosca.adelantar(180); window.__mosca.setWip(2); });
  for (const hora of ['1200', '1300', '1400', '1500']) {
    // adelanta justo hasta esa hora y congela la escena ahí (el reloj del
    // juego sigue corriendo mientras se saca la foto)
    await p.evaluate((h) => {
      const m = window.__mosca;
      m.congelar(false);
      const falta = Number(h.slice(0, 2)) * 60 - (m.estado().fraccionDelDia * 540 + 540);
      if (falta > 0) m.adelantar(falta);
      m.congelar(true);
      m.avanzar(0);
      m.avanzar(4); // la mosca y la pila se acomodan a ese momento
    }, hora);
    await p.waitForTimeout(300);
    console.log(`Bajar WIP 10 → 2, ${hora.slice(0, 2)}:00: ${await leer()} · en curso ${await p.evaluate(() => window.__mosca.estado().enCurso)} · nota: "${await p.evaluate(() => document.getElementById('wip-nota').textContent)}" · choques: ${await choques()}`);
    await p.screenshot({ path: `capturas/bajar-wip-${hora}.png` });
    if (hora === '1200' || hora === '1400') {
      await p.evaluate(() => window.__mosca.camara([-0.25, 1.75, 1.1], [-0.9, 1.72, -0.35]));
      await p.waitForTimeout(600);
      await p.screenshot({ path: `capturas/bajar-wip-${hora}-monitor.png` });
      await p.evaluate(() => window.__mosca.reencuadrar());
    }
  }
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(1800);
  await p.screenshot({ path: 'capturas/bajar-wip-1500-exhibicion.png' });
  await p.evaluate(() => { window.__mosca.congelar(false); window.__mosca.completarDia(); });
}

// Bloqueos: WIP 3 a las 11:00 con una tarea bloqueada (tarjeta roja con
// candado) y después con las tres (la mosca espera tamborileando)
if (!process.env.WIPS) {
  await p.evaluate(() => window.__mosca.vista('control'));
  await p.waitForTimeout(800);
  for (const n of [1, 3]) {
    await p.evaluate((n) => {
      const m = window.__mosca;
      m.congelar(false);
      m.diaExhibicion(3);
      m.adelantar(120);
      m.forzar({ bloqueadas: n, minutosBloqueo: 600 });
      m.adelantar(0.5);
      m.congelar(true);
      m.avanzar(0);
      m.avanzar(4);
    }, n);
    await p.waitForTimeout(300);
    const e = await p.evaluate(() => { const e = window.__mosca.estado(); return `bloqueadas ${e.bloqueadas} de ${e.enCurso} · esperando: ${e.esperando} · mosca: "${document.getElementById('ex-mosca').dataset.hace}"`; });
    console.log(`Bloqueos (WIP 3, ${n} bloqueada${n > 1 ? 's' : ''}): ${await leer()} · ${e} · choques: ${await choques()}`);
    await p.screenshot({ path: `capturas/bloqueo-${n}.png` });
    await p.evaluate(() => window.__mosca.camara([-0.25, 1.75, 1.1], [-0.9, 1.72, -0.35]));
    await p.waitForTimeout(600);
    await p.screenshot({ path: `capturas/bloqueo-${n}-monitor.png` });
    await p.evaluate(() => window.__mosca.reencuadrar());
  }
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(1800);
  await p.screenshot({ path: 'capturas/bloqueo-3-exhibicion.png' });
  console.log(`Exhibición con todas bloqueadas: "${await p.evaluate(() => document.getElementById('ex-mosca-hace')?.textContent ?? document.querySelector('#ex-mosca').textContent)}"`);
  await p.evaluate(() => { window.__mosca.congelar(false); window.__mosca.completarDia(); });
}

await p.evaluate(() => window.__mosca.vista('control'));
await p.waitForTimeout(1200);
await p.screenshot({ path: 'capturas/dias-jugados-panel.png', clip: { x: 1512 - 290, y: 0, width: 290, height: 860 } });
console.log('Días jugados:', await p.evaluate(() => [...document.querySelectorAll('#tabla-dias-body tr')].map((tr) => [...tr.querySelectorAll('td')].slice(0, 6).map((td) => td.textContent).join(' | ')).join('  //  ')));
await b.close();
