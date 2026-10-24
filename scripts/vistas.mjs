// Capturas de las dos vistas con WIP 2 y WIP 10, con los paneles visibles y
// ocultos (cerebro, controles y ambos), y prueba que se recuerde al recargar.
// Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
p.on('pageerror', (e) => console.log('ERROR', e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) console.log('CONSOLA', m.text()); });
const abrir = async () => {
  await p.goto('http://localhost:5173/jugar/', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
};
await abrir();
await p.evaluate(() => { localStorage.removeItem('mosca-del-wip-cerebro-oculto'); localStorage.removeItem('mosca-del-wip-controles-oculto'); });
await abrir();
const ponerWip = (w) => p.evaluate((w) => { window.__mosca.setWip(w); window.__mosca.forzar(w > 3 ? { estres: 96, colillas: 8 } : { estres: 5, hechas: 5 }); }, w);
const clases = () => p.evaluate(() => document.body.className || '(nada oculto)');

for (const w of [2, 10]) {
  await ponerWip(w);
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `capturas/control-ambos-visibles-wip${w}.png` });
}
await p.keyboard.press('b'); // oculta el cerebro
await p.waitForTimeout(1500);
await p.screenshot({ path: 'capturas/control-sin-cerebro-wip10.png' });
await p.keyboard.press('b');
await p.click('#btn-ocultar-controles');
await p.waitForTimeout(1500);
await p.screenshot({ path: 'capturas/control-sin-controles-wip10.png' });
await p.keyboard.press('b');
await p.waitForTimeout(1500);
await p.screenshot({ path: 'capturas/control-sin-paneles-wip10.png' });
console.log('antes de recargar:', await clases());
await abrir();
console.log('después de recargar:', await clases());
await ponerWip(2);
await p.waitForTimeout(3000);
await p.screenshot({ path: 'capturas/control-sin-paneles-wip2.png' });
await p.click('#btn-mostrar-controles');
await p.waitForTimeout(250);
await p.screenshot({ path: 'capturas/control-transicion.png' });
await p.click('#btn-mostrar-cerebro');
await p.waitForTimeout(1500);
console.log('tras mostrar ambos:', await clases());

await p.evaluate(() => window.__mosca.vista('exhibicion'));
for (const w of [2, 10]) {
  await p.evaluate((w) => { window.__mosca.diaExhibicion(w); window.__mosca.forzar(w > 3 ? { estres: 96, colillas: 6 } : { estres: 5, hechas: 3 }); }, w);
  await p.waitForTimeout(4500);
  await p.screenshot({ path: `capturas/vista-exhibicion-wip${w}.png` });
}
const antes = await p.evaluate(() => window.__mosca.camaraInfo().pos);
await p.mouse.move(400, 450);
await p.mouse.down();
await p.mouse.move(520, 430, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(600);
console.log('exhibición: se rota con el mouse:', JSON.stringify(antes) !== JSON.stringify(await p.evaluate(() => window.__mosca.camaraInfo().pos)));
await b.close();
