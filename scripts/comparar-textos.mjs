// Compara el texto visible de dos informes HTML de docs/contexto/ (por ejemplo, la
// fuente guardada de una versión anterior contra la actual): qué números y qué
// citas "Autor (año)" salen y cuáles entran, contando repeticiones. Sirve para
// comprobar la regla "ningún número del juego cambia" entre dos versiones del
// informe para compartir (en la 4.9 se hizo a mano; desde el v15 queda aquí).
// Uso: node scripts/comparar-textos.mjs docs/contexto/v14/compartir.html docs/contexto/compartir.html
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [antes, despues] = process.argv.slice(2);
if (!antes || !despues) { console.log('Uso: node scripts/comparar-textos.mjs <antes.html> <despues.html>'); process.exit(1); }
const b = await chromium.launch();
async function texto(ruta) {
  const p = await b.newPage();
  await p.goto(pathToFileURL(resolve(ruta)).href, { waitUntil: 'networkidle' });
  const hojas = await p.evaluate(() => [...document.querySelectorAll('.hoja')].map((h) => h.innerText));
  await p.close();
  return hojas.join('\n');
}
const numeros = (t) => (t.match(/\d+(?:[.,]\d+)*/g) ?? []);
const citas = (t) => [
  ...(t.match(/[A-ZÁÉÍÓÚÑ][\p{L}]*(?: y otros| [A-ZÁÉÍÓÚÑ][\p{L}]+| y [A-ZÁÉÍÓÚÑ][\p{L}]+|, [A-ZÁÉÍÓÚÑ][\p{L}]+)* \(\d{4}(?:[,;] ?\d{4})*\)/gu) ?? []),
  ...(t.match(/\([^()]*?, \d{4}\)/g) ?? []),
];
const cuenta = (lista) => lista.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
const diferencia = (ma, mb) => [...ma].filter(([k, n]) => n > (mb.get(k) ?? 0)).map(([k, n]) => `${k}${n - (mb.get(k) ?? 0) > 1 ? ` ×${n - (mb.get(k) ?? 0)}` : ''}`);
const A = await texto(antes), B = await texto(despues);
for (const [nombre, f] of [['Números', numeros], ['Citas', citas]]) {
  const ca = cuenta(f(A)), cb = cuenta(f(B));
  console.log(`${nombre} que salen (${diferencia(ca, cb).length}): ${diferencia(ca, cb).join(' · ') || 'ninguno'}`);
  console.log(`${nombre} que entran (${diferencia(cb, ca).length}): ${diferencia(cb, ca).join(' · ') || 'ninguno'}`);
}
await b.close();
