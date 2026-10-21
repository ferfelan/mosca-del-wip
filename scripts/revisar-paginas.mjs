// Revisa página por página un informe HTML de docs/contexto/. No arma el
// PDF: sólo mide. Uso:
//   node scripts/revisar-paginas.mjs compartir      (o completo, etapa4-3…)
//
// Para "compartir" aplica las reglas de la parte 4.6 (docs/etapa4-6-estilo.md,
// 2026-10-21): cada hoja llena entre 70 y 90 %; máximo 150 palabras sin
// contar el rótulo (.kicker), el título (h1), los gráficos (svg) ni los
// visuales marcados con la clase "visual" (tablas de números y de reglas,
// tarjetas de la pág. 5, pasos de la pág. 10, diagramas); título de máximo
// 2 líneas; máximo un visual (dos sólo en la página de los dos días); frases
// de máximo 20 palabras. La portada, el separador y el cierre no se miden
// como páginas de contenido, y los anexos sólo informan (no avisan).
// Para los demás documentos siguen las reglas de la 4.4 (llenado 80–95 %,
// unas 180 palabras de texto corrido, máximo 2 gráficos).
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CARPETA = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'contexto');
const doc = process.argv[2] ?? 'compartir';
const REGLAS = doc === 'compartir'
  ? { llenado: [70, 90], palabras: 150, visuales: 1, lineasTitulo: 2, frase: 20, v7: true }
  : { llenado: [80, 95], palabras: 190, visuales: 2, lineasTitulo: 99, frase: 99, v7: false };
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(pathToFileURL(join(CARPETA, `${doc}.html`)).href, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
const filas = await p.evaluate((R) => [...document.querySelectorAll('.hoja')].map((h, i) => {
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
  const cuenta = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const clon = h.cloneNode(true);
  clon.querySelectorAll('.pie, svg, script').forEach((el) => el.remove());
  const todas = cuenta(clon.innerText);
  // 4.6: sin rótulo, título ni visuales. 4.4: texto corrido (párrafos y listas fuera de figuras, tablas y notas chicas)
  let palabras;
  if (R.v7) {
    const c2 = clon.cloneNode(true);
    c2.querySelectorAll('.kicker, h1, .visual').forEach((el) => el.remove());
    palabras = cuenta(c2.innerText);
  } else {
    palabras = [...clon.querySelectorAll('p, li, h3')].filter((el) => !el.closest('figure, table, .chico, .no, .escala, .creditos, .fuentes-simples') && !el.classList.contains('chico') && !el.querySelector('p, li')).reduce((n, el) => n + cuenta(el.innerText), 0);
  }
  const largas = [];
  if (R.v7) {
    const c3 = clon.cloneNode(true);
    c3.querySelectorAll('.kicker, h1, .visual, q').forEach((el) => el.remove()); // las citas textuales no se recortan
    for (const el of [...c3.querySelectorAll('p, li, figcaption, td')].filter((el) => !el.querySelector('p, li'))) {
      for (const f of el.innerText.split(/(?<=[.!?])\s+/)) { const n = cuenta(f); if (n > R.frase) largas.push(`${n}: ${f.slice(0, 70)}…`); }
    }
  }
  const t = h.querySelector('h1');
  const lineasTitulo = t ? Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)) : 0;
  const graficos = h.querySelectorAll('.grafico svg, figure img, img.banda').length;
  const tipo = h.classList.contains('portada') ? 'portada' : h.classList.contains('parte') ? 'separador' : h.classList.contains('cierre') ? 'cierre' : /anexo/i.test(h.querySelector('.kicker')?.textContent ?? '') ? 'anexo' : 'contenido';
  return {
    pagina: i + 1,
    tipo,
    titulo: (t?.textContent ?? '').slice(0, 55),
    llenado: Math.round(((fondo - arriba) / (limite - arriba)) * 100),
    sobra: Math.max(0, Math.round(fondo - limite)),
    palabras,
    todas,
    graficos,
    lineasTitulo,
    largas,
  };
}), REGLAS);
for (const f of filas) {
  const avisos = [];
  const mide = REGLAS.v7 ? f.tipo === 'contenido' : true;
  if (f.sobra > 0) avisos.push(`SE PASA ${f.sobra}px`);
  if (mide && f.llenado < REGLAS.llenado[0]) avisos.push('poco llena');
  if (mide && f.llenado > REGLAS.llenado[1]) avisos.push('muy llena');
  if (mide && f.palabras > REGLAS.palabras) avisos.push(`más de ${REGLAS.palabras} palabras`);
  if (mide && f.graficos > REGLAS.visuales && !/dos veces|dos fotos/i.test(f.titulo + ' ' + (f.kicker ?? '')) && f.graficos > 2) avisos.push('más de un visual');
  if (mide && f.lineasTitulo > REGLAS.lineasTitulo) avisos.push('título de 3 líneas');
  if (mide && f.largas.length) avisos.push(`${f.largas.length} frase(s) de más de ${REGLAS.frase} palabras`);
  const etiqueta = f.tipo === 'contenido' ? '' : ` [${f.tipo}]`;
  console.log(`${String(f.pagina).padStart(2)}  ${String(f.llenado).padStart(3)} %  ${String(f.palabras).padStart(3)} palabras (${String(f.todas).padStart(3)} en total)  ${f.graficos} visual  título ${f.lineasTitulo} líneas  ${f.titulo}${etiqueta}${avisos.length ? '   ← ' + avisos.join(', ') : ''}`);
  if (mide) for (const l of f.largas) console.log(`      frase larga, ${l}`);
}
await b.close();
