// Capturas de las dos vistas (control con WIP 2 y 9, exhibición trabajando y
// fumando). Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
p.on('pageerror', (e) => console.log('ERROR', e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) console.log('CONSOLA', m.text()); });
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
await p.evaluate(() => { window.__mosca.setWip(2); window.__mosca.forzar({ estres: 8, hechas: 5 }); });
await p.waitForTimeout(2500);
await p.screenshot({ path: 'capturas/vista-control-wip2.png' });
await p.evaluate(() => { window.__mosca.setWip(9); window.__mosca.forzar({ estres: 90, colillas: 6 }); });
await p.waitForTimeout(2500);
await p.screenshot({ path: 'capturas/vista-control-wip9.png' });
await p.evaluate(() => window.__mosca.vista('exhibicion'));
await p.evaluate(() => window.__mosca.forzar({ estres: 70, hechas: 3, colillas: 4 }));
await p.waitForTimeout(3000);
await p.screenshot({ path: 'capturas/vista-exhibicion.png' });
await p.evaluate(() => window.__mosca.forzar({ fumando: true, estres: 95 }));
await p.waitForTimeout(3500);
await p.screenshot({ path: 'capturas/vista-exhibicion-fuma.png' });
console.log(JSON.stringify(await p.evaluate(() => window.__mosca.cerebro())));
await b.close();
