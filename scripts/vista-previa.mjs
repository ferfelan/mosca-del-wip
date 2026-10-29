// Guarda la vista previa para compartir de la portada en español
// (public/img/vista-previa-<fecha>.jpg, 1200×630; la fecha es la de
// scripts/sello.mjs) desde docs/contexto/vista-previa.html. Necesita el
// servidor de prueba encendido (npm run dev).
// Uso: node scripts/vista-previa.mjs [dirección] [archivo] [opciones de la página]
//   ej.: node scripts/vista-previa.mjs http://localhost:5173 /tmp/prueba.jpg "t=8&cuenta=0"
import { chromium } from 'playwright';
import { vistaPrevia } from './sello.mjs';

const base = process.argv[2] || 'http://localhost:5173';
const archivo = process.argv[3] || `public${vistaPrevia()}`;
const opciones = process.argv[4] || '';

const browser = await chromium.launch();
// Al doble de resolución y achicada al guardar: puntos y letras más suaves
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
const errores = [];
page.on('pageerror', (e) => errores.push(e.message));
await page.goto(`${base}/docs/contexto/vista-previa.html${opciones ? '?' + opciones : ''}`);
await page.waitForSelector('body[data-listo]', { timeout: 60000 });
await page.screenshot({ path: archivo, type: 'jpeg', quality: 88, scale: 'css' });
await browser.close();
if (errores.length) {
  console.error('errores en la página:', errores);
  process.exit(1);
}
console.log('vista previa guardada en', archivo);
