// Guarda las vistas previas de las páginas del sitio (Etapa 7, 2026-10-28):
// la imagen de 1200×630 que muestran LinkedIn, WhatsApp y los buscadores al
// pegar el enlace. Se dibujan en docs/contexto/vista-previa-pagina.html
// (?pagina=…) y quedan en public/img/vista-previa-<página>-<fecha>.jpg (la
// fecha es la de scripts/sello.mjs). La de la portada en español sigue siendo
// scripts/vista-previa.mjs.
// Necesita el servidor de prueba encendido (npm run dev).
// Uso: node scripts/vistas-previas.mjs [dirección] [solo una página]
import { chromium } from 'playwright';
import { vistaPrevia } from './sello.mjs';

const base = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '');
const solo = process.argv[3];
const PAGINAS = {
  guia: vistaPrevia('guia'),
  'guia-en': vistaPrevia('wip-limit'),
  informe: vistaPrevia('informe'),
  'informe-en': vistaPrevia('report'),
  taller: vistaPrevia('taller'),
  'taller-en': vistaPrevia('workshop'),
  juego: vistaPrevia('juego'),
  creditos: vistaPrevia('creditos'),
  'portada-en': vistaPrevia('en'),
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
const errores = [];
page.on('pageerror', (e) => errores.push(e.message));
for (const [clave, archivo] of Object.entries(PAGINAS)) {
  if (solo && solo !== clave) continue;
  await page.goto(`${base}/docs/contexto/vista-previa-pagina.html?pagina=${clave}`);
  await page.waitForSelector('body[data-listo]', { timeout: 60000 });
  await page.screenshot({ path: `public${archivo}`, type: 'jpeg', quality: 86, scale: 'css' });
  console.log(`public${archivo}`);
}
await browser.close();
if (errores.length) {
  console.error('errores en la página:', errores);
  process.exit(1);
}
