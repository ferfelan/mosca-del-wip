// Arma el informe para leer en la web (Etapa 7, 2026-10-28):
//   informe/index.html     ← docs/contexto/compartir.html     (/informe/)
//   en/report/index.html   ← docs/contexto/compartir-en.html  (/en/report/)
// Son los mismos textos, tablas, gráficos e imágenes del PDF "Para
// compartir", página por página, pero como una sola página larga con una
// sección por página del PDF (cada una con su ancla) y un botón para bajar
// el PDF. Nada se reescribe: si cambia el informe, se corre esto de nuevo.
// Se corre solo antes de npm run dev y npm run build (package.json), o con
//   node scripts/informe-web.mjs
// Las imágenes del informe están en public/img/informe/ (y en/ para el
// inglés), reducidas a 1600 px desde docs/contexto/img e img-en.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import vm from 'node:vm';
import { pagina, migas, autor, enlacesKit, SITIO, AUTOR, RUTAS } from './plantilla.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
// Esta página es igual al PDF "Para compartir v22" (en inglés, v23 desde el
// 2026-10-29: dos frases más naturales). Ese número es interno y no se
// muestra (pedido de Felipe, 2026-10-28): la página dice solo la fecha, la
// del último cambio de cada idioma (actualizado en IDIOMAS).

const IDIOMAS = {
  es: {
    fuente: 'docs/contexto/compartir.html',
    salida: 'informe/index.html',
    actualizadoEl: '2026-10-28',
    img: '/img/informe/',
    pdf: { ruta: '/Mosca-del-WIP-Informe.pdf', nombre: 'Mosca del WIP - Informe.pdf', peso: '4 MB', paginas: '17 páginas' },
    tapa: '/img/tapa-informe.jpg',
    titulo: 'Informe del límite WIP con una mosca real · Mosca del WIP',
    descripcion: 'Qué pasa en el juego con 1 a 10 tareas a la vez, qué dicen los estudios con personas y cuatro pasos para probar un límite WIP con tu equipo. En la web o en PDF.',
    imagen: '/img/vista-previa-informe.jpg',
    imagenAlt: 'La tapa del informe: la mosca cargando una torre de carpetas, junto al título Estar siempre ocupado no es lo mismo que avanzar.',
    encabezado: 'Estar siempre ocupado no es lo mismo que avanzar',
    bajada: 'Un informe con una mosca real sobre por qué conviene limitar el trabajo en curso (WIP). Es el mismo informe del PDF, para leer en la web, con una sección por página.',
    miga: 'El informe',
    porAutor: 'Por',
    publicado: 'Publicado el',
    actualizado: 'Actualizado el',
    bajarPdf: 'Descargar el informe (PDF)',
    pdfNota: (p) => `El PDF tiene ${p.paginas} y pesa ${p.peso}. Puedes compartirlo tal cual, citando al autor.`,
    enEstaPagina: 'En esta página',
    anexo: 'Anexo',
    seccion: 'sección',
    anexos: 'Anexos: para quien quiere revisar',
    cierreTitulo: 'Para terminar',
    kitTitulo: 'Lo que acompaña a este informe',
    datoFreak: 'Dato freak',
    palabra: /(página|Página) <span data-pag="([a-z]+)">\d*<\/span>/g,
    frases: [
      ['está en la página siguiente, a la derecha.', 'está en la <a href="#dia">sección siguiente</a>, a la derecha.'],
      ['La página siguiente explica por qué.', 'La <a href="#tabla">sección siguiente</a> explica por qué.'],
      ['los dos días de la página anterior:', 'los dos días de la <a href="#dia">sección anterior</a>:'],
      ['Lo que la tabla de la página 4 no muestra', 'Lo que la tabla de la <a href="#tabla">sección 4</a> no muestra'],
      ['Las columnas que faltan en la página 4,', 'Las columnas que faltan en la sección 4,'],
      ['son las dos curvas de la página 5.', 'son las dos curvas de la <a href="#paradoja">sección 5</a>.'],
      ['Cómo se probó está en la página 1:', 'Cómo se probó está en la <a href="#gancho">sección 1</a>:'],
      ['Estas tres páginas son para revisar', 'Estos tres anexos son para revisar'],
    ],
    cerebroAlto: 804,
  },
  en: {
    fuente: 'docs/contexto/compartir-en.html',
    salida: 'en/report/index.html',
    actualizadoEl: '2026-10-29',
    img: '/img/informe/en/',
    pdf: { ruta: '/Mosca-del-WIP-Report.pdf', nombre: 'Mosca del WIP - Report.pdf', peso: '4 MB', paginas: '17 pages' },
    tapa: '/img/tapa-report.jpg',
    titulo: 'WIP limit report with a real fly brain · Mosca del WIP',
    descripcion: 'What happens in the game with 1 to 10 tasks at once, what studies with people say and four steps to try a WIP limit with your team. On the web or as a PDF.',
    imagen: '/img/vista-previa-report.jpg',
    imagenAlt: 'The report’s cover: the fly carrying a tower of folders, next to the title Being busy all the time is not the same as making progress.',
    encabezado: 'Being busy all the time is not the same as making progress',
    bajada: 'A report with a real fly about why it pays to limit work in progress (WIP). It’s the same report as the PDF, to read on the web, one section per page.',
    miga: 'The report',
    porAutor: 'By',
    publicado: 'Published on',
    actualizado: 'Updated on',
    bajarPdf: 'Download the report (PDF)',
    pdfNota: (p) => `The PDF has ${p.paginas} and weighs ${p.peso}. You can share it as is, crediting the author.`,
    enEstaPagina: 'On this page',
    anexo: 'Appendix',
    seccion: 'section',
    anexos: 'Appendices: for whoever wants to check',
    cierreTitulo: 'To finish',
    kitTitulo: 'What goes with this report',
    datoFreak: 'Fun fact',
    palabra: /(page|Page) <span data-pag="([a-z]+)">\d*<\/span>/g,
    frases: [
      ['is on the next page, on the right.', 'is in the <a href="#dia">next section</a>, on the right.'],
      ['The next page explains why.', 'The <a href="#tabla">next section</a> explains why.'],
      ['the two days from the previous page:', 'the two days from the <a href="#dia">previous section</a>:'],
      ['What the table on page 4 doesn’t show', 'What the table in <a href="#tabla">section 4</a> doesn’t show'],
      ['The columns missing from page 4,', 'The columns missing from section 4,'],
      ['are the two curves on page 5.', 'are the two curves in <a href="#paradoja">section 5</a>.'],
      ['How it was tested is on page 1:', 'How it was tested is in <a href="#gancho">section 1</a>:'],
      ['These three pages are for checking', 'These three appendices are for checking'],
    ],
    cerebroAlto: 850,
  },
};

// Los colores fijos de los gráficos del PDF pasan a variables, para que se
// vean bien con fondo negro y con fondo blanco (src/informe.css)
const COLORES = {
  '#2f7579': 'var(--inf-teal)',
  '#1d2532': 'var(--inf-tinta)',
  '#fcfaf6': 'var(--inf-papel)',
  '#e2ddd2': 'var(--inf-linea)',
  '#8a93a0': 'var(--inf-tenue)',
  '#556070': 'var(--inf-suave)',
  '#2c3442': 'var(--inf-texto)',
  '#86b8bb': 'var(--inf-claro)',
  '#143537': 'var(--inf-oscuro)',
  '#4f9d6a': 'var(--tranquila)',
  '#9aa1ab': 'var(--inf-gris)',
  '#cc4a43': 'var(--colapsada)',
};
const TAMANOS = { 'mundo-wip2': [1600, 1000], 'escena-wip2': [1600, 1000], 'escena-wip9': [1600, 1000], 'cierre': [1600, 1280] };

function armar(idioma) {
  const C = IDIOMAS[idioma];
  const fuente = readFileSync(join(RAIZ, C.fuente), 'utf8');

  // 1. Las hojas del PDF
  const hojas = [...fuente.matchAll(/<section class="hoja([^"]*)"([^>]*)>([\s\S]*?)<\/section>/g)].map((m) => ({
    clases: m[1].trim().split(/\s+/).filter(Boolean),
    k: (m[2].match(/data-k="([^"]+)"/) || [])[1],
    html: m[3],
  }));
  const portada = hojas.find((h) => h.clases.includes('portada'));
  const separador = hojas.find((h) => h.clases.includes('parte'));
  const cierre = hojas.find((h) => h.clases.includes('cierre'));
  const contenido = hojas.filter((h) => h.k);
  const anexos = contenido.filter((h) => ['real', 'numeros', 'fuentes'].includes(h.k));
  const paginas = contenido.filter((h) => !anexos.includes(h));

  // 2. Las tablas y los gráficos: el script del PDF corre aquí, con un
  //    "document" de mentira que guarda lo que escribe en cada id
  const script = fuente.match(/<script>([\s\S]*)<\/script>/)[1];
  const escrito = {};
  const documento = {
    getElementById: (id) => ({
      set innerHTML(v) {
        escrito[id] = v;
      },
      get innerHTML() {
        return escrito[id] ?? '';
      },
    }),
    querySelectorAll: () => [],
  };
  vm.runInNewContext(script, { document: documento });
  for (const id of Object.keys(escrito)) {
    escrito[id] = escrito[id].replace(/#[0-9a-f]{6}\b/gi, (hex) => COLORES[hex.toLowerCase()] ?? hex);
  }

  // 3. Dónde queda cada hoja en la web: 1 a 11 y los anexos A, B y C
  const numero = (k) => {
    const i = paginas.findIndex((h) => h.k === k);
    if (i >= 0) return `${C.seccion} ${i + 1}`;
    const j = anexos.findIndex((h) => h.k === k);
    return `${C.anexo.toLowerCase()} ${'ABC'[j]}`;
  };
  const texto = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  // 4. Cada hoja como sección de la página
  function seccion(h, indice) {
    let s = h.html;
    const kicker = texto((s.match(/<div class="kicker">([\s\S]*?)<\/div>/) || ['', ''])[1]).replace(/^(Anexo|Appendix) ([ABC]) · /, '');
    s = s.replace(/<div class="kicker">[\s\S]*?<\/div>\s*/, '');
    const rotulo = indice.tipo === 'anexo' ? `${C.anexo} ${indice.letra} · ${kicker}` : `${indice.n} · ${kicker}`;
    s = s.replace(/<h1>([\s\S]*?)<\/h1>/, `<p class="kicker">${rotulo}</p>\n  <h2>$1</h2>`);
    s = s.replace(/<div class="pie">[\s\S]*?<\/div>\s*/g, '');
    s = s.replace(/<div class="sobremesa"><span class="rotulo">[^<]*<\/span><span>([\s\S]*?)<\/span><\/div>/g, `<aside class="dato-freak"><span class="rotulo">${C.datoFreak}</span><span>$1</span></aside>`);
    s = s.replace('<div class="rotulo" style="grid-column:1/-1;text-align:center;margin:1.6mm 0 0">', '<div class="rotulo rotulo-ancho">');
    s = s.replace(/ style="[^"]*"/g, '');
    s = s.replace(/<table class="numeros[^"]*">[\s\S]*?<\/table>/g, (m) => `<div class="tabla-marco">${m}</div>`);
    s = s.replace(/<(\/?)h4>/g, '<$1h3>'); // en la web el anexo C va bajo un h2: sus grupos son h3
    // Una lista por grupo: en el PDF los títulos de grupo van dentro del <ul>
    // (ahorra espacio), pero una lista solo puede tener <li> adentro.
    s = s.replace(/<ul class="fuentes-simples">([\s\S]*?)<\/ul>/g, (_, dentro) =>
      dentro
        .split(/(?=<h3>)/)
        .map((grupo) => grupo.trim())
        .filter(Boolean)
        .map((grupo) => {
          const m = grupo.match(/^<h3>([\s\S]*?)<\/h3>([\s\S]*)$/);
          const items = (m ? m[2] : grupo).trim();
          return `${m ? `<h3 class="fuentes-grupo">${m[1]}</h3>\n` : ''}<ul class="fuentes-simples">\n${items}\n</ul>`;
        })
        .join('\n'),
    );
    s = s.replace(/<(tbody|div) id="([a-z-]+)"><\/\1>/g, (m, tag, id) => `<${tag} id="${id}">${escrito[id] ?? ''}</${tag}>`);
    s = s.replace(C.palabra, (m, palabra, k) => `<a href="#${k}">${numero(k)}</a>`);
    for (const [de, a] of C.frases) s = s.split(de).join(a);
    s = s.replace(/<img class="foto([^"]*)" src="img(?:-en)?\/([a-z0-9-]+)\.jpg"/g, (m, extra, nombre) => {
      const [w, hh] = TAMANOS[nombre] ?? [1600, 1000];
      return `<img class="foto${extra}" src="${C.img}${nombre}.jpg" width="${w}" height="${hh}" loading="lazy" decoding="async"`;
    });
    s = s.replace(/<img src="img(?:-en)?\/(cerebro-wip[29])\.jpg"/g, (m, nombre) => `<img src="${C.img}${nombre}.jpg" width="610" height="${C.cerebroAlto}" loading="lazy" decoding="async"`);
    return `<section id="${h.k}" class="${indice.tipo}">\n  ${s.trim()}\n</section>`;
  }
  const cuerpoSecciones = paginas.map((h, i) => seccion(h, { tipo: 'pagina', n: i + 1 })).join('\n\n');
  const cuerpoAnexos = anexos.map((h, j) => seccion(h, { tipo: 'anexo', letra: 'ABC'[j] })).join('\n\n');

  // El separador de los anexos, en corto (sin números de página)
  for (const [de, a] of C.frases) separador.html = separador.html.split(de).join(a);
  const sepTitulo = texto((separador.html.match(/<h1>([\s\S]*?)<\/h1>/) || ['', ''])[1]);
  const sepTexto = texto((separador.html.match(/<p>([\s\S]*?)<\/p>/) || ['', ''])[1]);
  const sepLista = [...separador.html.matchAll(/<li><span class="letra">([ABC])<\/span><div><b>([^<]*)<\/b>([\s\S]*?)<\/div>/g)]
    .map((m) => `<li><a href="#${anexos['ABC'.indexOf(m[1])].k}"><b>${C.anexo} ${m[1]} · ${m[2]}</b><span>${texto(m[3])}</span></a></li>`)
    .join('');

  // El cierre
  let cierreHtml = cierre.html.replace(/<div class="pie">[\s\S]*?<\/div>\s*/g, '').replace(/ style="[^"]*"/g, '');
  cierreHtml = cierreHtml.replace(/<img src="img(?:-en)?\/cierre\.jpg"/, `<img src="${C.img}cierre.jpg" width="1600" height="1280" loading="lazy" decoding="async"`);
  cierreHtml = cierreHtml.replace(/<p class="juega">[\s\S]*?<\/p>\s*/, '');
  cierreHtml = cierreHtml.replace(/<div class="texto">/, '<div class="cierre-texto">');

  // 5. El índice
  const etiqueta = (h) => texto((h.html.match(/<div class="kicker">([\s\S]*?)<\/div>/) || ['', ''])[1]).replace(/^(Anexo|Appendix) ([ABC]) · /, '');
  const indice =
    paginas.map((h, i) => `<li><a href="#${h.k}">${i + 1}. ${etiqueta(h)}</a></li>`).join('') +
    anexos.map((h, j) => `<li><a href="#${h.k}">${C.anexo} ${'ABC'[j]}. ${etiqueta(h)}</a></li>`).join('') +
    `<li><a href="#cierre">${C.cierreTitulo}</a></li>`;

  // 6. La cabeza: lema del PDF como título, subtítulo, autor, fecha y el PDF
  const lema = texto((portada.html.match(/<p class="lema">([\s\S]*?)<\/p>/) || ['', C.encabezado])[1]);
  const m = migas(idioma, [{ nombre: C.miga, ruta: RUTAS.informe[idioma] }]);
  const fechaLarga = m.t.fechaLarga;
  const cabeza = `<main class="lectura" id="contenido" tabindex="-1">
  ${m.html}
  <div class="cabeza-informe">
    <div>
      <h1>${lema}</h1>
      <p class="pagina-bajada">${C.bajada}</p>
      <p class="pagina-meta"><span>${C.porAutor} <a href="${AUTOR.linkedin}">${AUTOR.nombre}</a></span><span>${C.publicado} <time datetime="2026-10-24">${fechaLarga('2026-10-24')}</time></span><span>${C.actualizado} <time datetime="${C.actualizadoEl}">${fechaLarga(C.actualizadoEl)}</time></span></p>
      <div class="acciones-pagina">
        <a class="boton principal" href="${C.pdf.ruta}" download="${C.pdf.nombre}">${C.bajarPdf}</a>
      </div>
      <p class="nota">${C.pdfNota(C.pdf)}</p>
    </div>
    <img class="tapa-informe" src="/img/portada-torre.svg" width="520" height="640" alt="" aria-hidden="true" decoding="async" />
  </div>
  <nav class="indice" aria-label="${C.enEstaPagina}">
    <h2>${C.enEstaPagina}</h2>
    <ul class="sin-numeros">${indice}</ul>
  </nav>

${cuerpoSecciones}

<section id="anexos" class="separador-anexos">
  <p class="kicker">${C.anexos.split(':')[0]}</p>
  <h2>${sepTitulo}</h2>
  <p>${sepTexto}</p>
  <ul class="enlaces-kit">${sepLista}</ul>
</section>

${cuerpoAnexos}

<section id="cierre" class="cierre-informe">
  <p class="kicker">${C.cierreTitulo}</p>
  ${cierreHtml.trim()}
</section>

<section class="kit-informe">
  <h2>${C.kitTitulo}</h2>
  ${enlacesKit(idioma, 'informe')}
</section>

${autor(idioma)}
</main>`;

  // 7. Datos estructurados: el informe como artículo, con su PDF
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
      encoding: { '@type': 'MediaObject', contentUrl: `${SITIO}${C.pdf.ruta}`, encodingFormat: 'application/pdf', name: C.pdf.nombre },
      keywords: idioma === 'es' ? 'límite WIP, trabajo en curso, work in progress, kanban, eficiencia de flujo, ley de Little, multitarea' : 'WIP limit, work in progress, kanban, flow efficiency, Little’s Law, multitasking, fruit fly connectome',
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
    cuerpo: cabeza,
    claseBody: 'informe-web',
    css: '/src/informe.css',
  });
  mkdirSync(join(RAIZ, C.salida, '..'), { recursive: true });
  writeFileSync(join(RAIZ, C.salida), html);
  console.log(`${C.salida}: ${paginas.length} secciones, ${anexos.length} anexos, ${Object.keys(escrito).length} tablas o gráficos (${(html.length / 1024).toFixed(0)} KB)`);
}

armar('es');
armar('en');
