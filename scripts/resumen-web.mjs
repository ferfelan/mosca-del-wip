// Arma la página del informe en la web (Etapa 8.12, 2026-11-13):
//   informe/index.html     (/informe/)
//   en/report/index.html   (/en/report/)
// Decisión de Felipe: "dejar solo el resumen ejecutivo en la web y que el
// informe largo sea para descargar. Así tenemos como lo esencial". Hasta la
// 8.11 esta página era el informe extenso, sección por sección (lo armaba
// scripts/informe-web.mjs, que ya no existe). Ahora es el resumen ejecutivo,
// para leer en dos minutos, con los botones para bajar el informe (PDF) y
// este mismo resumen (PDF), y el índice de lo que trae el informe.
// Nada se escribe dos veces:
//   - los textos salen del resumen en PDF (docs/contexto/resumen.html y
//     resumen-en.html): si el resumen cambia, esta página cambia sola;
//   - los dos tableros son los de la portada (index.html y en/index.html, que
//     scripts/generar-ingles.mjs arma justo antes): mismos dibujos y mismas
//     cargas (src/cargas.js);
//   - el índice del informe sale de sus fuentes (docs/contexto/compartir.html
//     y compartir-en.html): el rótulo y el título de cada página, con el
//     número que lleva en el PDF.
// Se corre solo antes de npm run dev y npm run build (package.json), o con
//   node scripts/resumen-web.mjs
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { pagina, migas, autor, enlacesKit, SITIO, AUTOR, RUTAS } from './plantilla.mjs';
import { vistaPrevia } from './sello.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

const IDIOMAS = {
  es: {
    resumenFuente: 'docs/contexto/resumen.html',
    informeFuente: 'docs/contexto/compartir.html',
    portada: 'index.html',
    salida: 'informe/index.html',
    actualizadoEl: '2026-11-15', // revisión final: el autor para las redes y los errores claros del inglés; antes 2026-11-14 (8.14, sin la bajada de "¿Qué ganó…?", la nota "En el juego…" y la ley de Little con su condición)
    pdf: { ruta: '/Mosca-del-WIP-Informe.pdf', nombre: 'Mosca del WIP - Informe.pdf', paginas: (n) => `${n} páginas` },
    resumen: { ruta: '/Mosca-del-WIP-Resumen.pdf', nombre: 'Mosca del WIP - Resumen.pdf' },
    tapa: '/img/tapa-informe.jpg',
    titulo: 'Informe del límite WIP con una mosca real · Mosca del WIP',
    descripcion: 'Resumen ejecutivo del informe del límite WIP. Qué ganó la mosca con 2 tareas a la vez, qué dicen los estudios y cuatro pasos para tu equipo. El informe entero, en PDF.',
    imagen: vistaPrevia('informe'),
    imagenAlt: 'La tapa del informe, con la mosca cargando una torre de carpetas, junto al título Estar siempre ocupado no es lo mismo que avanzar.',
    encabezado: 'Estar siempre ocupado no es lo mismo que avanzar',
    rotulo: 'Resumen ejecutivo',
    bajada: 'Lo esencial del informe, para leerlo en dos minutos. El informe entero, con cada número, sus fuentes y los estudios, se descarga en PDF.',
    miga: 'El informe',
    porAutor: 'Por',
    publicado: 'Publicado el',
    actualizado: 'Actualizado el',
    bajarPdf: 'Descargar el informe (PDF)',
    bajarResumen: 'Descargar este resumen (PDF, 2 páginas)',
    pdfNota: (p) => `El informe tiene ${p.paginas}${p.peso ? ` y pesa ${p.peso}` : ''}. Puedes compartirlo tal cual, citando al autor.`,
    // Lo que en el papel dice "página 2" y aquí está más abajo
    frases: [['están en la página 2.', 'están <a href="#cuatro-pasos">más abajo</a>.']],
    traeTitulo: 'Lo que trae el informe',
    traeTexto: (p) => `El informe son ${p.paginas} en PDF y se lee en unos 10 minutos. Esto es lo que trae, página por página.`,
    traeLista: 'Las páginas del informe',
    pag: 'pág.',
    anexo: /^Anexo ([ABC]) ·\s*/,
    anexoNombre: 'Anexo',
    kitTitulo: 'Lo que acompaña a este informe',
    palabrasClave: 'límite WIP, trabajo en curso, work in progress, kanban, eficiencia de flujo, ley de Little, multitarea',
  },
  en: {
    resumenFuente: 'docs/contexto/resumen-en.html',
    informeFuente: 'docs/contexto/compartir-en.html',
    portada: 'en/index.html',
    salida: 'en/report/index.html',
    actualizadoEl: '2026-11-15', // revisión final: el autor para las redes y los errores claros del inglés; antes 2026-11-14 (8.14, sin la bajada de "¿Qué ganó…?", la nota "En el juego…" y la ley de Little con su condición)
    pdf: { ruta: '/Mosca-del-WIP-Report.pdf', nombre: 'Mosca del WIP - Report.pdf', paginas: (n) => `${n} pages` },
    resumen: { ruta: '/Mosca-del-WIP-Summary.pdf', nombre: 'Mosca del WIP - Summary.pdf' },
    tapa: '/img/tapa-report.jpg',
    titulo: 'WIP limit report with a real fly brain · Mosca del WIP',
    descripcion: 'Executive summary of the WIP limit report. What the fly gained with 2 tasks at once, what the studies say and four steps for your team. The full report, as a PDF.',
    imagen: vistaPrevia('report'),
    imagenAlt: 'The report’s cover, with the fly carrying a tower of folders, next to the title Being busy all the time is not the same as making progress.',
    encabezado: 'Being busy all the time is not the same as making progress',
    rotulo: 'Executive summary',
    bajada: 'The essentials of the report, to read in two minutes. The full report, with every number, its sources and the studies, is a PDF download.',
    miga: 'The report',
    porAutor: 'By',
    publicado: 'Published on',
    actualizado: 'Updated on',
    bajarPdf: 'Download the report (PDF)',
    bajarResumen: 'Download this summary (PDF, 2 pages)',
    pdfNota: (p) => `The report has ${p.paginas}${p.peso ? ` and weighs ${p.peso}` : ''}. You can share it as is, crediting the author.`,
    frases: [['are on page 2.', 'are <a href="#cuatro-pasos">further down</a>.']],
    traeTitulo: 'What’s in the report',
    traeTexto: (p) => `The report is a PDF of ${p.paginas} and takes about 10 minutes to read. Here is what’s in it, page by page.`,
    traeLista: 'The pages of the report',
    pag: 'p.',
    anexo: /^Appendix ([ABC]) ·\s*/,
    anexoNombre: 'Appendix',
    kitTitulo: 'What goes with this report',
    palabrasClave: 'WIP limit, work in progress, kanban, flow efficiency, Little’s law, multitasking, fruit fly connectome',
  },
};

// Un elemento entero, con todo lo que tiene dentro (cuenta las etiquetas del
// mismo nombre que se abren y se cierran adentro)
function elemento(html, apertura, donde) {
  const m = apertura.exec(html);
  if (!m) throw new Error(`${donde}: no encontré ${apertura}`);
  const etiqueta = /^<([a-z0-9]+)/.exec(m[0])[1];
  const re = new RegExp(`<${etiqueta}\\b[^>]*>|</${etiqueta}>`, 'g');
  re.lastIndex = m.index;
  let nivel = 0;
  for (let x; (x = re.exec(html)); ) {
    if (x[0][1] !== '/') nivel++;
    else if (--nivel === 0) return { todo: html.slice(m.index, re.lastIndex), dentro: html.slice(m.index + m[0].length, x.index) };
  }
  throw new Error(`${donde}: ${apertura} no se cierra`);
}
const sinComentarios = (html) => html.replace(/<!--[\s\S]*?-->/g, '');
const texto = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const primero = (html, re, donde) => {
  const m = re.exec(html);
  if (!m) throw new Error(`${donde}: no encontré ${re}`);
  return m[1].trim();
};

function armar(idioma) {
  const C = IDIOMAS[idioma];
  const leer = (ruta) => sinComentarios(readFileSync(join(RAIZ, ruta), 'utf8'));

  // 1. Los textos del resumen en PDF
  let resumen = leer(C.resumenFuente);
  for (const [de, a] of C.frases) {
    if (!resumen.includes(de)) console.warn(`OJO ${C.resumenFuente}: no está la frase "${de}"`);
    resumen = resumen.split(de).join(a);
  }
  const R = C.resumenFuente;
  const entrada = elemento(resumen, /<div class="entrada">/, R).dentro.trim();
  const sirve = elemento(resumen, /<section class="bloque sirve">/, R).dentro;
  const hallamos = elemento(resumen, /<section class="bloque hallamos">/, R).dentro;
  const dos = elemento(resumen, /<div class="bloque dos">/, R).dentro;
  const gana = elemento(resumen, /<section class="bloque gana">/, R).dentro;
  const cuatro = elemento(resumen, /<section class="bloque cuatro">/, R).dentro;
  const norte = primero(resumen, /<p class="norte">([\s\S]*?)<\/p>/, R);
  const h2 = (bloque) => primero(bloque, /<h2>([\s\S]*?)<\/h2>/, R).replace(/<br\s*\/?>\s*/g, ' ');
  const bajada = (bloque) => primero(bloque, /<p class="bajada[^"]*">([\s\S]*?)<\/p>/, R);
  // Los tres hallazgos: el tercero es el de las urgencias (lleva el ancla de antes)
  const hallazgos = [...elemento(hallamos, /<ul class="hallazgos">/, R).dentro.matchAll(/<li>\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/g)];
  if (hallazgos.length !== 3) throw new Error(`${R}: esperaba 3 hallazgos y hay ${hallazgos.length}`);
  const puente = primero(hallamos, /<p class="puente">([\s\S]*?)<\/p>/, R);
  // Los estudios y los cuidados: dos textos, lado a lado
  const lados = [...dos.matchAll(/<section>\s*<h2>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>\s*<\/section>/g)];
  if (lados.length !== 2) throw new Error(`${R}: esperaba 2 textos en "dos" y hay ${lados.length}`);
  // Los cuatro pasos
  const pasos = [...elemento(cuatro, /<ol class="pasos">/, R).dentro.matchAll(/<li>[\s\S]*?<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>[\s\S]*?<\/li>/g)];
  if (pasos.length !== 4) throw new Error(`${R}: esperaba 4 pasos y hay ${pasos.length}`);

  // 2. Los dos tableros de la portada, tal cual
  const portada = leer(C.portada);
  const tableroSirve = elemento(elemento(portada, /<section class="sirve" id="para-que-sirve"[^>]*>/, C.portada).dentro, /<div class="tablero-marco">/, C.portada).todo;
  const tableroLleva = elemento(elemento(portada, /<section class="gana" id="lo-que-se-lleva"[^>]*>/, C.portada).dentro, /<ul class="gana-tablero lleva-tablero">/, C.portada).todo;
  const sangria = (html) => html.replace(/\n {6}/g, '\n');

  // 3. El informe: sus hojas, para el índice y para decir cuántas páginas tiene
  const informe = leer(C.informeFuente);
  const hojas = informe.split(/<section class="hoja/).slice(1).map((h) => {
    const clases = /^([^"]*)"/.exec(h)[1].trim().split(/\s+/).filter(Boolean);
    return {
      clases,
      k: (/^[^>]*data-k="([^"]+)"/.exec(h) || [])[1],
      rotulo: texto((/<div class="kicker">([\s\S]*?)<\/div>/.exec(h) || ['', ''])[1]),
      titulo: texto((/<h1>([\s\S]*?)<\/h1>/.exec(h) || ['', ''])[1]),
    };
  });
  // (el pie del PDF numera solo el contenido: ni la portada ni el separador de los anexos)
  const numeradas = hojas.filter((h) => !h.clases.includes('portada') && !h.clases.includes('parte'));
  const indice = numeradas
    .filter((h) => h.k)
    .map((h) => {
      const n = numeradas.indexOf(h) + 1;
      const anexo = C.anexo.exec(h.rotulo);
      const rotulo = anexo ? `${C.anexoNombre} ${anexo[1]}, ${h.rotulo.replace(C.anexo, '').toLowerCase()}` : h.rotulo;
      return `<li id="pdf-${h.k}"><span class="trae-pag">${C.pag}&nbsp;${n}</span><span class="trae-que"><b>${rotulo}</b> ${h.titulo}</span></li>`;
    })
    .join('\n      ');
  const rutaPdf = join(RAIZ, 'public', C.pdf.ruta);
  const pdfDatos = { paginas: C.pdf.paginas(hojas.length), peso: existsSync(rutaPdf) ? `${Math.max(1, Math.round(statSync(rutaPdf).size / 1e6))} MB` : '' };
  if (!pdfDatos.peso) console.warn(`OJO ${C.salida}: no está public${C.pdf.ruta}, la página queda sin el peso del PDF`);
  const lema = texto((/<p class="lema">([\s\S]*?)<\/p>/.exec(informe) || ['', C.encabezado])[1]);

  // 4. La página
  const m = migas(idioma, [{ nombre: C.miga, ruta: RUTAS.informe[idioma] }]);
  const fechaLarga = m.t.fechaLarga;
  const botones = `<div class="acciones-pagina">
        <a class="boton principal" href="${C.pdf.ruta}" download="${C.pdf.nombre}">${C.bajarPdf}</a>
        <a class="boton" href="${C.resumen.ruta}" download="${C.resumen.nombre}">${C.bajarResumen}</a>
      </div>
      <p class="nota">${C.pdfNota(pdfDatos)}</p>`;
  const cuerpo = `<main class="lectura" id="contenido" tabindex="-1">
  ${m.html}
  <div class="cabeza-informe">
    <div>
      <p class="kicker">${C.rotulo}</p>
      <h1>${lema}</h1>
      <p class="pagina-bajada">${C.bajada}</p>
      <p class="pagina-meta"><span>${C.porAutor} <a href="${AUTOR.linkedin}">${AUTOR.nombre}</a></span><span>${C.publicado} <time datetime="2026-10-24">${fechaLarga('2026-10-24')}</time></span><span>${C.actualizado} <time datetime="${C.actualizadoEl}">${fechaLarga(C.actualizadoEl)}</time></span></p>
      ${botones}
    </div>
    <img class="tapa-informe" src="/img/portada-torre.svg" width="520" height="640" alt="" aria-hidden="true" decoding="async" />
  </div>

<div class="entrada">
  ${entrada}
</div>

<section class="sirve" id="que-gano">
  <h2>${h2(sirve)}</h2>
  ${sangria(tableroSirve)}
  <p class="nota sirve-origen">${primero(sirve, /<p class="nota sirve-origen">([\s\S]*?)<\/p>/, R)}</p>
</section>

<section id="hallazgos" class="ancha">
  <h2>${h2(hallamos)}</h2>
  <ul class="hallazgos ancho">
    ${hallazgos.map((h, i) => `<li${i === 2 ? ' id="urgencias"' : ''}><h3>${h[1].trim()}</h3><p>${h[2].trim()}</p></li>`).join('\n    ')}
  </ul>
  <p>${puente}</p>
</section>

<section id="estudios" class="ancha">
  <div class="dos-textos ancho">
    ${lados.map((l) => `<div><h2>${l[1].replace(/<br\s*\/?>\s*/g, ' ').trim()}</h2><p>${l[2].trim()}</p></div>`).join('\n    ')}
  </div>
</section>

<section class="gana" id="que-se-lleva">
  <h2>${h2(gana)}</h2>
  <p class="sirve-bajada">${bajada(gana)}</p>
  ${sangria(tableroLleva)}
</section>

<section id="cuatro-pasos" class="ancha">
  <h2>${h2(cuatro)}</h2>
  <p class="sirve-bajada">${bajada(cuatro)}</p>
  <ol class="cuatro-pasos ancho">
    ${pasos.map((p, i) => `<li><span class="paso-n" aria-hidden="true">${i + 1}</span><div><h3>${p[1].trim()}</h3><p>${p[2].trim()}</p></div></li>`).join('\n    ')}
  </ol>
  <p class="norte">${norte}</p>
</section>

<section id="numeros" class="trae ancha">
  <h2>${C.traeTitulo}</h2>
  <p>${C.traeTexto(pdfDatos)}</p>
  <ol class="trae-lista ancho" aria-label="${C.traeLista}">
      ${indice}
  </ol>
  ${botones}
</section>

<section class="kit-informe">
  <h2>${C.kitTitulo}</h2>
  ${enlacesKit(idioma, 'informe')}
</section>

${autor(idioma)}
</main>`;

  // 5. Datos estructurados: la página como artículo, con sus dos PDF
  const jsonLd = [
    {
      '@type': 'Article',
      '@id': `${SITIO}${RUTAS.informe[idioma]}#articulo`,
      headline: lema,
      alternativeHeadline: C.titulo.split(' · ')[0],
      description: C.descripcion,
      inLanguage: idioma,
      url: `${SITIO}${RUTAS.informe[idioma]}`,
      mainEntityOfPage: `${SITIO}${RUTAS.informe[idioma]}`,
      image: `${SITIO}${C.tapa}`,
      datePublished: '2026-10-24',
      dateModified: C.actualizadoEl,
      isAccessibleForFree: true,
      author: { '@type': 'Person', '@id': `${SITIO}/#felipe`, name: AUTOR.nombre, url: AUTOR.linkedin, sameAs: [AUTOR.linkedin] },
      publisher: { '@type': 'Organization', '@id': `${SITIO}/#deliverycraft`, name: 'Deliverycraft', url: 'https://deliverycraft.ai/' },
      isPartOf: { '@type': 'WebSite', '@id': `${SITIO}/#sitio`, name: 'Mosca del WIP', url: `${SITIO}/` },
      about: { '@type': 'VideoGame', '@id': `${SITIO}/jugar/#juego`, name: 'Mosca del WIP', url: `${SITIO}/jugar/`, inLanguage: ['es', 'en'] },
      encoding: [
        { '@type': 'MediaObject', contentUrl: `${SITIO}${C.pdf.ruta}`, encodingFormat: 'application/pdf', name: C.pdf.nombre },
        { '@type': 'MediaObject', contentUrl: `${SITIO}${C.resumen.ruta}`, encodingFormat: 'application/pdf', name: C.resumen.nombre },
      ],
      keywords: C.palabrasClave,
    },
    m.jsonLd,
  ];

  const html = pagina({
    idioma,
    clave: 'informe',
    titulo: C.titulo,
    descripcion: C.descripcion,
    imagen: C.imagen,
    imagenAlt: C.imagenAlt,
    jsonLd,
    cuerpo,
    claseBody: 'informe-web',
    css: '/src/informe.css',
  });
  mkdirSync(join(RAIZ, C.salida, '..'), { recursive: true });
  writeFileSync(join(RAIZ, C.salida), html);
  console.log(`${C.salida}: el resumen ejecutivo, 2 tableros, ${hallazgos.length} hallazgos, ${pasos.length} pasos y el índice del informe (${numeradas.filter((h) => h.k).length} páginas de ${hojas.length}) (${(html.length / 1024).toFixed(0)} KB)`);
}

armar('es');
armar('en');
