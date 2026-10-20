// Revisa página por página un informe HTML de docs/contexto/ con las reglas
// de la Etapa 4.4: cuánto se llena cada hoja (debe quedar entre 80 y 95 %),
// cuántas palabras tiene (máximo unas 180) y cuántos gráficos (máximo 2).
// No arma el PDF: sólo mide. Uso:
//   node scripts/revisar-paginas.mjs compartir      (o completo, etapa4-3…)
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CARPETA = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'contexto');
const doc = process.argv[2] ?? 'compartir';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(pathToFileURL(join(CARPETA, `${doc}.html`)).href, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
const filas = await p.evaluate(() => [...document.querySelectorAll('.hoja')].map((h, i) => {
  const r = h.getBoundingClientRect();
  const est = getComputedStyle(h);
  const arriba = r.top + parseFloat(est.paddingTop);
  const abajo = r.bottom - parseFloat(est.paddingBottom);
  const pie = h.querySelector('.pie');
  const limite = pie ? pie.getBoundingClientRect().top - 2 : abajo; // el pie es fijo: el contenido debe quedar sobre él
  let fondo = arriba;
  for (const el of h.querySelectorAll('*')) {
    if (el === pie || pie?.contains(el)) continue;
    if (getComputedStyle(el).position === 'absolute') continue;
    const q = el.getBoundingClientRect();
    if (q.height > 0 && q.bottom > fondo) fondo = q.bottom;
  }
  const texto = [...h.querySelectorAll('*')].filter((el) => !pie?.contains(el) && !['SCRIPT', 'STYLE', 'SVG'].includes(el.tagName)).map(() => '').length;
  const clon = h.cloneNode(true);
  clon.querySelectorAll('.pie, svg, script').forEach((el) => el.remove());
  const cuenta = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const palabras = cuenta(clon.innerText);
  // texto corrido: párrafos y listas fuera de figuras, tablas, leyendas y notas chicas
  const cuerpo = [...clon.querySelectorAll('p, li, h3')].filter((el) => !el.closest('figure, table, .chico, .no, .escala, .creditos, .fuentes-simples') && !el.classList.contains('chico') && !el.querySelector('p, li')).reduce((n, el) => n + cuenta(el.innerText), 0);
  const graficos = h.querySelectorAll('.grafico svg, figure img, img.banda').length;
  return {
    pagina: i + 1,
    titulo: (h.querySelector('h1')?.textContent ?? '').slice(0, 60),
    llenado: Math.round(((fondo - arriba) / (limite - arriba)) * 100),
    sobra: Math.max(0, Math.round(fondo - limite)),
    palabras,
    cuerpo,
    graficos,
  };
}));
for (const f of filas) {
  const avisos = [];
  if (f.llenado < 80) avisos.push('poco llena');
  if (f.llenado > 95) avisos.push('muy llena');
  if (f.sobra > 0) avisos.push(`SE PASA ${f.sobra}px`);
  if (f.cuerpo > 190) avisos.push('mucho texto corrido');
  if (f.graficos > 2) avisos.push('más de 2 gráficos');
  console.log(`${String(f.pagina).padStart(2)}  ${String(f.llenado).padStart(3)} %  ${String(f.palabras).padStart(3)} palabras (${String(f.cuerpo).padStart(3)} corridas)  ${f.graficos} gráf.  ${f.titulo}${avisos.length ? '   ← ' + avisos.join(', ') : ''}`);
}
await b.close();
