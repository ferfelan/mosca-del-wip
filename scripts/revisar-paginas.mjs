// Revisa página por página un informe HTML de docs/contexto/. No arma el
// PDF: sólo mide. Uso:
//   node scripts/revisar-paginas.mjs compartir      (o completo, etapa4-3…)
//
// Para "compartir" aplica las reglas del v8 (parte 4.7, 2026-10-21, sobre la
// guía docs/etapa4-6-estilo.md): cada hoja llena entre 80 y 95 % (el tope del
// contenido es la línea "Para la sobremesa", que es fija sobre el pie); hasta
// 200 palabras sin contar el rótulo (.kicker), el título (h1), los gráficos
// (svg) ni los visuales marcados con la clase "visual" (tablas de números y
// de reglas, tarjetas de la pág. 8, pasos de la pág. 11, diagramas); la línea
// de sobremesa sí cuenta y se informa aparte; título de máximo 2 líneas;
// máximo un visual (dos sólo en la página de los dos días); frases de máximo
// 20 palabras; ningún signo de exclamación. La portada, el separador y el
// cierre no se miden como páginas de contenido, y los anexos sólo informan
// (no avisan). Para los demás documentos siguen las reglas de la 4.4
// (llenado 80–95 %, unas 180 palabras de texto corrido, máximo 2 gráficos).
//
// v14 (2026-10-24, primeros lectores): para "compartir" ya no hay tope de 20
// palabras por frase (la voz nueva une las ideas con palabras, no con signos)
// y se cuentan por página las señales de texto de IA que pidió sacar Felipe:
// punto y coma (máximo uno por página), rayas (ninguna), dos puntos que no
// sean de hora, signos de pregunta y negritas dentro del texto corrido
// (ninguna; las de títulos, etiquetas, visuales y la frase norte no cuentan).
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CARPETA = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'contexto');
const doc = process.argv[2] ?? 'compartir';
const REGLAS = doc.startsWith('compartir') // también compartir-en, el mismo informe en inglés (2026-10-25)
  ? { llenado: [80, 95], palabras: 200, visuales: 1, lineasTitulo: 2, frase: 99, v7: true, voz: true }
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
  const sobremesa = h.querySelector('.sobremesa'); // v8: la línea fija sobre el pie; el contenido debe quedar sobre ella
  const tope = sobremesa ?? pie;
  const limite = tope ? tope.getBoundingClientRect().top - 2 : abajo; // el pie es fijo: el contenido debe quedar sobre él
  let fondo = arriba;
  for (const el of h.querySelectorAll('*')) {
    if (el === pie || pie?.contains(el) || el === sobremesa || sobremesa?.contains(el)) continue;
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
  const deSobremesa = sobremesa ? cuenta(sobremesa.innerText) : 0;
  const exclamaciones = (clon.innerText.match(/[!¡]/g) ?? []).length;
  // v14: señales de texto de IA, contadas sobre todo el texto de la hoja (visuales incluidos; la sobremesa no)
  const c4 = clon.cloneNode(true);
  c4.querySelectorAll('.sobremesa').forEach((el) => el.remove());
  const texto = c4.innerText;
  const puntoComa = (texto.match(/;/g) ?? []).length;
  const rayas = (texto.match(/—/g) ?? []).length;
  const dosPuntos = (texto.match(/(?<!\d):(?!\d)/g) ?? []).length;
  const preguntas = (texto.match(/¿/g) ?? []).length;
  const negritas = [...clon.querySelectorAll('p strong, p b')].filter((el) => !el.closest('.visual, .limites, .fuentes-simples, .creditos, .cierre-pagina, .recuadro, .chico, .sobremesa, figure')).length;
  const graficos = h.querySelectorAll('.grafico svg, figure img, img.banda').length;
  const tipo = h.classList.contains('portada') ? 'portada' : h.classList.contains('parte') ? 'separador' : h.classList.contains('cierre') ? 'cierre' : /anexo|appendix/i.test(h.querySelector('.kicker')?.textContent ?? '') ? 'anexo' : 'contenido';
  return {
    pagina: i + 1,
    tipo,
    titulo: (t?.textContent ?? '').slice(0, 55),
    llenado: Math.round(((fondo - arriba) / (limite - arriba)) * 100),
    sobra: Math.max(0, Math.round(fondo - limite)),
    palabras,
    todas,
    deSobremesa,
    exclamaciones,
    graficos,
    lineasTitulo,
    largas,
    puntoComa,
    rayas,
    dosPuntos,
    preguntas,
    negritas,
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
  if (mide && REGLAS.v7 && f.exclamaciones) avisos.push(`${f.exclamaciones} signo(s) de exclamación`);
  if (mide && REGLAS.v7 && !f.deSobremesa) avisos.push('sin línea de sobremesa');
  if (REGLAS.voz && f.tipo !== 'portada' && f.tipo !== 'separador' && f.tipo !== 'cierre') {
    if (f.puntoComa > 1) avisos.push(`${f.puntoComa} punto y coma`);
    if (f.rayas) avisos.push(`${f.rayas} raya(s)`);
    if (f.negritas) avisos.push(`${f.negritas} negrita(s) en el texto`);
  }
  const etiqueta = f.tipo === 'contenido' ? '' : ` [${f.tipo}]`;
  const sobremesa = REGLAS.v7 && f.deSobremesa ? `, ${String(f.deSobremesa).padStart(2)} de sobremesa` : '';
  const voz = REGLAS.voz ? `  ;${f.puntoComa} —${f.rayas} :${f.dosPuntos} ¿${f.preguntas} b${f.negritas}` : '';
  console.log(`${String(f.pagina).padStart(2)}  ${String(f.llenado).padStart(3)} %  ${String(f.palabras).padStart(3)} palabras (${String(f.todas).padStart(3)} en total${sobremesa})  ${f.graficos} visual  título ${f.lineasTitulo} líneas${voz}  ${f.titulo}${etiqueta}${avisos.length ? '   ← ' + avisos.join(', ') : ''}`);
  if (mide) for (const l of f.largas) console.log(`      frase larga, ${l}`);
}
await b.close();
