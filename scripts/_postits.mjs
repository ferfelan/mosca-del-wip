import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
p.on('pageerror', (e) => console.log('ERROR', e.message));
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
await p.evaluate(() => { window.__mosca.ocultarCerebro(true); window.__mosca.ocultarControles(true); });
for (const w of [1, 4, 10]) {
  await p.evaluate((w) => { window.__mosca.setWip(w); window.__mosca.forzar({ estres: w > 3 ? 90 : 5 }); }, w);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `capturas/postits-wip${w}.png`, clip: { x: 500, y: 100, width: 520, height: 330 } });
}
// transición: de 10 a 1, a la mitad
await p.evaluate(() => window.__mosca.setWip(1));
await p.waitForTimeout(180);
await p.screenshot({ path: 'capturas/postits-transicion.png', clip: { x: 500, y: 100, width: 520, height: 330 } });
await p.evaluate(() => { window.__mosca.ocultarCerebro(false); window.__mosca.ocultarControles(false); });
await b.close();
