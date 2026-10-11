import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:5173';
const SALIDA = 'capturas';
const SOLO = process.env.SOLO; // ej. SOLO=01,04 para sacar sólo algunas

mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'],
});
const pagina = await navegador.newPage({ viewport: { width: 1512, height: 860 } });

pagina.on('pageerror', (e) => console.log('ERROR DE PAGINA:', e.message));
pagina.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') console.log('CONSOLA:', m.text());
});

await pagina.goto(URL, { waitUntil: 'networkidle' });
await pagina.waitForFunction(() => window.__mosca !== undefined, { timeout: 15000 });
await pagina.evaluate(() => {
  localStorage.removeItem('mosca-del-wip-dias');
  window.__mosca.pausar(true);
  window.__mosca.congelar(true);
});

const M = (fn, arg) => pagina.evaluate(fn, arg);

async function captura(nombre) {
  if (SOLO && !SOLO.split(',').some((p) => nombre.startsWith(p))) return;
  await pagina.waitForTimeout(250);
  await pagina.screenshot({ path: `${SALIDA}/${nombre}.png` });
  const choques = await M(() => window.__mosca.choques());
  const n = Object.keys(choques).length;
  console.log(`guardada ${nombre}  | choques: ${n ? JSON.stringify(choques) : 'ninguno'}`);
}

// La mosca está en x≈-0.9, z≈1.2 y mira hacia el fondo (-z)
const VISTAS = {
  general: null,
  cara: [[-0.55, 1.6, 0.25], [-0.9, 1.38, 1.15]],
  lado: [[0.5, 1.5, 1.15], [-0.9, 1.15, 1.0]],
  manos: [[-0.35, 1.45, 0.55], [-0.9, 1.0, 0.3]],
  atras: [[-1.9, 1.9, 2.7], [-0.9, 1.1, 1.0]],
  arriba: [[-0.55, 3.2, 1.7], [-0.9, 1.0, 0.85]],
  cenicero: [[0.45, 1.45, 1.0], [-0.02, 1.0, 0.36]],
  monitor: [[-0.25, 1.75, 1.1], [-0.9, 1.72, -0.35]],
};

async function vista(nombre) {
  await M((v) => (v ? window.__mosca.camara(v[0], v[1]) : window.__mosca.reencuadrar()), VISTAS[nombre]);
}

// ----- WIP 2: tranquila -----
await M(() => {
  window.__mosca.setWip(2);
  window.__mosca.forzar({ estres: 8, hechas: 6, fumando: false });
  window.__mosca.avanzar(3);
});
for (const v of ['general', 'cara', 'lado', 'manos', 'atras', 'arriba']) {
  await vista(v);
  await captura(`wip2-${v}`);
}

// ----- WIP 9: colapsada, tecleando -----
await M(() => {
  window.__mosca.setWip(9);
  window.__mosca.forzar({ estres: 97, colillas: 9 });
  window.__mosca.avanzar(3);
});
for (const v of ['general', 'cara', 'manos']) {
  await vista(v);
  await captura(`wip9-${v}`);
}

// ----- WIP 9: fumando (cigarro en reposo y en la boca) -----
await M(() => {
  window.__mosca.forzar({ fumando: true });
  window.__mosca.avanzar(1.6);
});
for (const v of ['general', 'cara', 'lado']) {
  await vista(v);
  await captura(`wip9-fuma-boca-${v}`);
}
await M(() => window.__mosca.avanzar(1.3));
for (const v of ['general', 'cara', 'lado', 'atras']) {
  await vista(v);
  await captura(`wip9-fuma-baja-${v}`);
}

// ----- Cenicero lleno -----
await M(() => {
  window.__mosca.forzar({ fumando: false, colillas: 20 });
  window.__mosca.avanzar(4);
});
await vista('cenicero');
await captura('cenicero-lleno');
await vista('general');
await captura('wip9-general-cenicero');
await vista('monitor');
await captura('monitor');

await navegador.close();
console.log('listo');
