// Prueba el cambio de vista (botón, tecla E, Escape) y el loop del día de
// ejemplo en exhibición. Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
const clase = () => p.evaluate(() => document.body.className || '(control)');
await p.click('#btn-exhibicion');
await p.waitForTimeout(150);
await p.screenshot({ path: 'capturas/transicion-medio.png' });
await p.waitForTimeout(900);
console.log('tras botón:', await clase());
await p.keyboard.press('e');
await p.waitForTimeout(1000);
console.log('tras tecla E:', await clase());
await p.keyboard.press('E');
await p.waitForTimeout(1000);
console.log('tras E otra vez:', await clase());
await p.keyboard.press('Escape');
await p.waitForTimeout(1000);
console.log('tras Escape:', await clase(), '| hora del juego del usuario:', await p.evaluate(() => window.__mosca.estado().hora), 'wip', await p.evaluate(() => window.__mosca.estado().wip));
// loop de exhibición: alterna WIP 9 y WIP 2 y compara al final de cada día
await p.keyboard.press('e');
await p.waitForTimeout(1000);
console.log('primer día:', await p.evaluate(() => [window.__mosca.estado().wip, document.getElementById('ex-inicio').className]));
for (let dia = 1; dia <= 2; dia++) {
  await p.evaluate(() => window.__mosca.casiFin());
  await p.waitForTimeout(1500);
  const fin = await p.evaluate(() => ({
    titulo: document.getElementById('ex-fin-titulo').textContent,
    filas: [...document.querySelectorAll('#ex-fin-filas tr')].map((tr) => tr.textContent.replace(/\s+/g, ' ').trim()),
    sigue: document.getElementById('ex-fin-texto').textContent,
  }));
  console.log(`fin del día ${dia}:`, JSON.stringify(fin));
  await p.screenshot({ path: `capturas/exhibicion-fin-dia${dia}.png` });
  await p.waitForTimeout(7500);
  console.log(`  luego empieza: WIP ${await p.evaluate(() => window.__mosca.estado().wip)}`);
}
console.log('errores:', errores.length ? errores : 'ninguno');
await b.close();
