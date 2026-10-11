// Capturas de las dos vistas con WIP 2 y WIP 10 (y fumando en exhibición).
// Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
p.on('pageerror', (e) => console.log('ERROR', e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) console.log('CONSOLA', m.text()); });
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
const leer = () => p.evaluate(() => { const l = window.__mosca.cerebro(); return `${l.activas} activas · ${Math.round(l.nivel * 100)}%`; });

await p.evaluate(() => { window.__mosca.setWip(2); window.__mosca.forzar({ estres: 5, hechas: 5 }); });
await p.waitForTimeout(4000);
await p.screenshot({ path: 'capturas/vista-control-wip2.png' });
console.log('control WIP 2:', await leer());
await p.evaluate(() => { window.__mosca.setWip(10); window.__mosca.forzar({ estres: 96, colillas: 6 }); });
await p.waitForTimeout(4000);
await p.screenshot({ path: 'capturas/vista-control-wip10.png' });
console.log('control WIP 10:', await leer());

await p.evaluate(() => window.__mosca.vista('exhibicion'));
await p.evaluate(() => { window.__mosca.diaExhibicion(2); window.__mosca.forzar({ estres: 5, hechas: 3 }); });
await p.waitForTimeout(5000);
await p.screenshot({ path: 'capturas/vista-exhibicion-wip2.png' });
console.log('exhibición WIP 2:', await leer());
await p.evaluate(() => { window.__mosca.diaExhibicion(10); window.__mosca.forzar({ estres: 96, colillas: 5 }); });
await p.waitForTimeout(5000);
await p.screenshot({ path: 'capturas/vista-exhibicion-wip10.png' });
console.log('exhibición WIP 10:', await leer());
await p.evaluate(() => window.__mosca.forzar({ fumando: true }));
await p.waitForTimeout(3500);
await p.screenshot({ path: 'capturas/vista-exhibicion-fuma.png' });
console.log('exhibición fumando:', await leer());
await b.close();
