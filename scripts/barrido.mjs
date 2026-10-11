// Recorre las animaciones (tipeo, fumar, volver a teclear) en pasos de 0,05 s
// y revisa en cada paso que ninguna pieza atraviese otra. Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 800, height: 500 } });
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca);
const r = await p.evaluate(() => {
  const m = window.__mosca; m.pausar(true); m.congelar(true);
  const malos = []; let pasos = 0;
  const tramo = (nombre, seg, conf) => {
    m.forzar(conf);
    for (let t = 0; t < seg; t += 0.05) { pasos++; m.avanzar(0.05); const c = m.choques(); if (Object.keys(c).length) malos.push([nombre, t.toFixed(2), c]); }
  };
  m.setWip(2); tramo('tipeo-tranqui', 3, { estres: 5, fumando: false });
  m.setWip(9); tramo('tipeo-colapsada', 3, { estres: 98, fumando: false });
  for (let k = 0; k < 3; k++) { tramo('fumando', 6, { estres: 98, fumando: true }); tramo('vuelve-a-teclear', 4, { fumando: false }); }
  tramo('fuma-y-se-calma', 6, { estres: 10, fumando: true });
  tramo('final', 4, { fumando: false, colillas: 20 });
  return { malos, pasos };
});
console.log(`${r.pasos} momentos revisados`);
console.log(r.malos.length ? JSON.stringify(r.malos.slice(0, 10), null, 1) + `\n...total ${r.malos.length}` : 'sin choques en todo el recorrido');
await b.close();
