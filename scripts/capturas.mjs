import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:5173';
const SALIDA = 'capturas';

mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'],
});
const pagina = await navegador.newPage({ viewport: { width: 1512, height: 860 } });

pagina.on('pageerror', (e) => console.log('ERROR DE PAGINA:', e.message));
pagina.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLA:', m.text());
});

await pagina.goto(URL, { waitUntil: 'networkidle' });
await pagina.waitForFunction(() => window.__mosca !== undefined, { timeout: 15000 });
await pagina.evaluate(() => localStorage.removeItem('mosca-del-wip-dias'));
await pagina.waitForTimeout(1200);

async function captura(nombre, segundos = 0.4) {
  await pagina.waitForTimeout(segundos * 1000);
  await pagina.screenshot({ path: `${SALIDA}/${nombre}.png` });
  console.log('guardada', nombre);
}

// 1. Vista general, día tranquilo
await pagina.evaluate(() => {
  window.__mosca.setWip(2);
  window.__mosca.forzar({ estres: 12, hechas: 5 });
});
await captura('01-general-tranquila', 1.2);

// 2. Primer plano de la mosca tranquila
await pagina.evaluate(() => window.__mosca.camara([-0.35, 1.52, 0.35], [-1.12, 1.35, -0.95]));
await captura('02-mosca-cerca', 0.8);

// 3. Colapsada con WIP alto
await pagina.evaluate(() => {
  window.__mosca.setWip(9);
  window.__mosca.forzar({ estres: 97, colillas: 6 });
});
await captura('03-mosca-colapsada', 1.4);

// 4. Fumando (humo acumulado)
await pagina.evaluate(() => window.__mosca.forzar({ fumando: true }));
await captura('04-fumando-cerca', 3.0);

// 5. Vista general fumando + cenicero desbordado
await pagina.evaluate(() => {
  window.__mosca.reencuadrar();
  window.__mosca.forzar({ colillas: 14 });
});
await captura('05-general-colapsada', 2.2);

// 6. Primer plano del cenicero
await pagina.evaluate(() => window.__mosca.camara([0.1, 1.4, 1.15], [-0.35, 1.0, 0.3]));
await captura('06-cenicero', 0.8);

// 7. Primer plano del monitor
await pagina.evaluate(() => window.__mosca.camara([0.45, 1.75, 1.5], [0.15, 1.6, -0.15]));
await captura('07-kanban', 0.8);

// 8. Vista trasera para revisar alas
await pagina.evaluate(() => window.__mosca.camara([-2.2, 2.2, -0.2], [-1.12, 1.3, -1.0]));
await captura('08-mosca-atras', 0.8);

await navegador.close();
console.log('listo');
