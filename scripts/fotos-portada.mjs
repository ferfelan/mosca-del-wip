// Las fotos de "Cómo se juega" de la portada (portada v2, 2026-10-26),
// sacadas del juego en español y en inglés:
//   public/img/paso-1-elegir-tareas-a-la-vez.jpg y step-1-choose-tasks-at-once.jpg (Etapa 7: antes paso-1.jpg y paso-1-en.jpg)   el control de 1 a 10, antes de Empezar
//   public/img/paso-3-tabla-de-dias-jugados.jpg y step-3-days-played-table.jpg (antes paso-3.jpg y paso-3-en.jpg)   la tabla de días jugados: un día con 2 y otro con 9
// (paso-2-mosca-en-su-oficina.jpg, la mosca frente a su tablero a las 10:10, viene de la propuesta,
// docs/propuesta-portada/img/. De ahí venían también cerebro-mosca-2-tareas.jpg y cerebro-mosca-9-tareas.jpg,
// que salieron del sitio en la 8.13 y quedaron guardadas en el Escritorio.)
// Igual que "fotos" de scripts/propuesta-portada.mjs, pero en los dos idiomas.
// Necesita npm run dev. Uso: node scripts/fotos-portada.mjs [dirección]
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const IMG = 'public/img';
const ANCHO = 360;
const ALTO = 225; // 16:10, igual que el marco de la portada
const navegador = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const errores = [];
let fallas = 0;

for (const idioma of ['es', 'en']) {
  const sufijo = idioma === 'en' ? '-en' : '';
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  const pagina = await contexto.newPage();
  pagina.on('pageerror', (e) => errores.push(`${idioma}: ${e.message}`));
  const abrir = async () => {
    await pagina.goto(`${BASE}/jugar/?lang=${idioma}`, { waitUntil: 'networkidle' });
    await pagina.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  };
  await abrir();
  // Sin días guardados de otras pruebas
  await pagina.evaluate(() => localStorage.removeItem('mosca-del-wip-dias'));
  await abrir();
  await pagina.waitForTimeout(1200);
  const caja = async (sel) => pagina.locator(sel).first().boundingBox();
  const panel = await caja('#panel');
  const x = Math.min(panel.x - 42, 1440 - ANCHO);
  // Paso 1: el control de 1 a 10, con el título de la tarjeta (día de oficina)
  await pagina.screenshot({ path: `${IMG}/${idioma === 'en' ? 'step-1-choose-tasks-at-once' : 'paso-1-elegir-tareas-a-la-vez'}.jpg`, type: 'jpeg', quality: 90, clip: { x, y: Math.max(0, panel.y - 8), width: ANCHO, height: ALTO } });
  // Paso 3: la tabla de días jugados con dos días, 2 y 9 tareas a la vez
  await pagina.evaluate(() => window.__mosca.setWip(2));
  await pagina.evaluate(() => window.__mosca.empezar());
  await pagina.waitForTimeout(400);
  await pagina.evaluate(() => window.__mosca.completarDia());
  await pagina.waitForTimeout(800);
  await pagina.keyboard.press('r');
  await pagina.waitForTimeout(400);
  await pagina.evaluate(() => window.__mosca.setWip(9));
  await pagina.waitForTimeout(300);
  await pagina.evaluate(() => window.__mosca.completarDia());
  await pagina.waitForTimeout(1200);
  const filas = await pagina.locator('#tabla-dias tr').count();
  if (filas < 2) {
    fallas++;
    console.log(`  FALLA (${idioma}): la tabla de días tiene ${filas} fila(s), se esperaban 2`);
  }
  const ultimo = await caja('#panel .bloque.ultimo');
  await pagina.screenshot({ path: `${IMG}/${idioma === 'en' ? 'step-3-days-played-table' : 'paso-3-tabla-de-dias-jugados'}.jpg`, type: 'jpeg', quality: 90, clip: { x, y: Math.min(ultimo.y - 14, 900 - ALTO), width: ANCHO, height: ALTO } });
  console.log(`${idioma}: las fotos de los pasos 1 y 3 (${ANCHO * 3} × ${ALTO * 3}); la tabla dice: ${(await pagina.locator('#tabla-dias').innerText()).replace(/\s+/g, ' ').trim().slice(0, 120)}`);
  await contexto.close();
}
await navegador.close();
if (errores.length) {
  fallas += errores.length;
  console.log('errores en el juego:', errores);
}
console.log(fallas ? `fotos-portada: ${fallas} cosa(s) por revisar` : 'fotos-portada: listo');
process.exit(fallas ? 1 : 0);
