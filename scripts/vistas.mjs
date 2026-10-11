// Capturas de las dos vistas con WIP 2 y WIP 10, con el panel del cerebro
// visible y oculto, y prueba que "oculto" se recuerde al recargar.
// Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1512, height: 860 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('ERROR', e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) console.log('CONSOLA', m.text()); });
const abrir = async () => {
  await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
};
await abrir();
await p.evaluate(() => { localStorage.removeItem('mosca-del-wip-cerebro-oculto'); });
await abrir();
const leer = () => p.evaluate(() => { const l = window.__mosca.cerebro(); return `${l.activas} activas · ${Math.round(l.nivel * 100)}%`; });

for (const wip of [2, 10]) {
  await p.evaluate((w) => { window.__mosca.setWip(w); window.__mosca.forzar(w > 3 ? { estres: 96, colillas: 6 } : { estres: 5, hechas: 5 }); }, wip);
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `capturas/control-cerebro-visible-wip${wip}.png` });
  console.log(`control visible WIP ${wip}:`, await leer());
}
await p.click('#btn-ocultar-cerebro');
await p.waitForTimeout(1500);
await p.screenshot({ path: 'capturas/control-cerebro-oculto-wip10.png' });
await abrir();
console.log('tras recargar, ¿sigue oculto?', await p.evaluate(() => document.body.classList.contains('cerebro-oculto')));
await p.evaluate(() => { window.__mosca.setWip(2); window.__mosca.forzar({ estres: 5, hechas: 5 }); });
await p.waitForTimeout(2500);
await p.screenshot({ path: 'capturas/control-cerebro-oculto-wip2.png' });
await p.click('#btn-mostrar-cerebro');
await p.waitForTimeout(250);
await p.screenshot({ path: 'capturas/control-cerebro-transicion.png' });
await p.waitForTimeout(1300);
console.log('tras "mostrar", ¿oculto?', await p.evaluate(() => document.body.classList.contains('cerebro-oculto')));

await p.evaluate(() => window.__mosca.vista('exhibicion'));
for (const wip of [2, 10]) {
  await p.evaluate((w) => { window.__mosca.diaExhibicion(w); window.__mosca.forzar(w > 3 ? { estres: 96, colillas: 5 } : { estres: 5, hechas: 3 }); }, wip);
  await p.waitForTimeout(4500);
  await p.screenshot({ path: `capturas/vista-exhibicion-wip${wip}.png` });
  console.log(`exhibición WIP ${wip}:`, await leer());
}
// en exhibición se puede rotar con el mouse
const antes = await p.evaluate(() => window.__mosca.camaraInfo().pos);
await p.mouse.move(360, 450);
await p.mouse.down();
await p.mouse.move(470, 430, { steps: 8 });
await p.mouse.up();
await p.mouse.wheel(0, -300);
await p.waitForTimeout(800);
const despues = await p.evaluate(() => window.__mosca.camaraInfo().pos);
console.log('exhibición: la cámara se movió con el mouse:', JSON.stringify(antes) !== JSON.stringify(despues));
await p.screenshot({ path: 'capturas/vista-exhibicion-rotada.png' });
await b.close();
