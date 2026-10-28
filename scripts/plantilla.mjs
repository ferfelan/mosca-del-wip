// La plantilla de las páginas de lectura del sitio (Etapa 7, 2026-10-28): la
// guía del límite WIP, el informe en la web, el taller, sus versiones en
// inglés y la página 404. La usan scripts/paginas.mjs y scripts/informe-web.mjs.
// Pone lo que todas comparten: el <head> completo (título, descripción,
// canonical, hreflang, vista previa, datos estructurados), la barra de la
// portada en corto (logo, Guía · Informe · Taller, ES | EN, fondo, Jugar) y el
// pie con las páginas del sitio. Los textos en inglés de la barra y el pie
// salen de src/portada-textos.js, para que cambien en un solo lugar.
import { INGLES } from '../src/portada-textos.js';

export const SITIO = 'https://mosca.deliverycraft.ai';
export const AUTOR = { nombre: 'Felipe Fernández', linkedin: 'https://www.linkedin.com/in/felipefernandezandrade/' };
export const FECHAS = { publicado: '2026-10-28', modificado: '2026-10-28' };

// Las direcciones de cada página en cada idioma (las mismas de src/idioma.js)
export const RUTAS = {
  inicio: { es: '/', en: '/en/' },
  guia: { es: '/limite-wip/', en: '/en/wip-limit/' },
  informe: { es: '/informe/', en: '/en/report/' },
  taller: { es: '/taller/', en: '/en/workshop/' },
  juego: { es: '/jugar/', en: '/jugar/?lang=en' },
  creditos: { es: '/creditos/', en: '/creditos/?lang=en' },
};

// Los textos de la barra y el pie (el español tal como está en index.html)
const T = {
  es: {
    saltar: 'Saltar al contenido',
    logo: 'Mosca del WIP: ir al inicio',
    idioma: 'Idioma',
    fondo: 'Fondo',
    fondoNegro: 'Fondo negro',
    fondoBlanco: 'Fondo blanco',
    jugar: 'Jugar',
    paginas: 'Páginas del sitio',
    navGuia: 'Guía',
    navInforme: 'Informe',
    navTaller: 'Taller',
    hechoPor: 'Hecho por <a href="https://www.linkedin.com/in/felipefernandezandrade/">Felipe Fernández</a> · <a href="https://deliverycraft.ai">deliverycraft.ai</a>',
    sinCookies: 'Sin cookies. Solo contamos visitas, sin identificar a nadie.',
    pieJuego: 'El juego',
    pieGuia: 'Guía del límite WIP',
    pieInforme: 'El informe',
    pieTaller: 'El taller',
    pieCreditos: 'Créditos y licencias',
    pieInicio: 'Inicio',
    derechos: '© 2026 Felipe Fernández. Todos los derechos reservados. Los datos del cerebro son del Male CNS v1.0, con licencia CC BY 4.0.',
    fechaLarga: (iso) => {
      const [a, m, d] = iso.split('-').map(Number);
      return `${d} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][m - 1]} de ${a}`;
    },
  },
  en: {
    saltar: INGLES.saltar,
    logo: INGLES.logo,
    idioma: INGLES.idioma,
    fondo: INGLES.fondo,
    fondoNegro: INGLES.fondoNegro,
    fondoBlanco: INGLES.fondoBlanco,
    jugar: INGLES.jugar,
    paginas: INGLES.pieMapa,
    navGuia: INGLES.navGuia,
    navInforme: INGLES.navInforme,
    navTaller: INGLES.navTaller,
    hechoPor: INGLES.hechoPor,
    sinCookies: INGLES.sinCookies,
    pieJuego: INGLES.pieJuego,
    pieGuia: INGLES.pieGuia,
    pieInforme: INGLES.pieInforme,
    pieTaller: INGLES.pieTaller,
    pieCreditos: INGLES.pieCreditos,
    pieInicio: 'Home',
    derechos: '© 2026 Felipe Fernández. All rights reserved. The brain data come from Male CNS v1.0, licensed CC BY 4.0.',
    fechaLarga: (iso) => {
      const [a, m, d] = iso.split('-').map(Number);
      return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${d}, ${a}`;
    },
  },
};
export const textos = (idioma) => T[idioma];

export const escapar = (v) => String(v).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// La mosca del logo (la misma de index.html)
const MARCA = `<svg class="marca" viewBox="0 0 32 32" width="34" height="34" aria-hidden="true" focusable="false">
            <g fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"><ellipse cx="8.9" cy="20.5" rx="3.3" ry="8.6" transform="rotate(32 8.9 20.5)"/><ellipse cx="23.1" cy="20.5" rx="3.3" ry="8.6" transform="rotate(-32 23.1 20.5)"/><ellipse cx="16" cy="7.8" rx="3.6" ry="3.2"/><circle cx="16" cy="13.4" r="4.4"/><ellipse cx="16" cy="21.9" rx="3.8" ry="6.3"/><ellipse cx="12.3" cy="6.7" rx="3.1" ry="3.8"/><ellipse cx="19.7" cy="6.7" rx="3.1" ry="3.8"/></g>
            <g fill="#e3eef8" stroke="#5a4c40" stroke-width="1.3"><ellipse cx="8.9" cy="20.5" rx="3.3" ry="8.6" transform="rotate(32 8.9 20.5)"/><ellipse cx="23.1" cy="20.5" rx="3.3" ry="8.6" transform="rotate(-32 23.1 20.5)"/></g>
            <g fill="#6f6052"><ellipse cx="16" cy="7.8" rx="3.6" ry="3.2"/><circle cx="16" cy="13.4" r="4.4"/><ellipse cx="16" cy="21.9" rx="3.8" ry="6.3"/></g>
            <g fill="#e8402c"><ellipse cx="12.3" cy="6.7" rx="3.1" ry="3.8"/><ellipse cx="19.7" cy="6.7" rx="3.1" ry="3.8"/></g>
          </svg>`;

// La barra: logo, las tres páginas (en pantallas anchas), ES | EN, el fondo y Jugar
function barra(idioma, actual) {
  const t = T[idioma];
  const otro = idioma === 'es' ? 'en' : 'es';
  const enlace = (clave, texto) =>
    `<li><a href="${RUTAS[clave][idioma]}"${actual === clave ? ' aria-current="page"' : ''}>${texto}</a></li>`;
  return `    <header class="barra desplazada con-nombre con-jugar" data-barra>
      <div class="barra-dentro">
        <a class="logo" href="${RUTAS.inicio[idioma]}" data-inicio aria-label="${escapar(t.logo)}">
          ${MARCA}
          <span class="logo-nombre">Mosca del WIP</span>
        </a>
        <ul class="menu-enlaces barra-paginas" aria-label="${escapar(t.paginas)}">
          ${enlace('guia', t.navGuia)}
          ${enlace('informe', t.navInforme)}
          ${enlace('taller', t.navTaller)}
        </ul>
        <div class="pagina-ajustes">
          <div class="selector" role="group" aria-label="${escapar(t.idioma)}">
            <a href="${idioma === 'es' ? '#' : RUTAS[actual]?.es ?? '/'}" data-idioma="es" lang="es" aria-label="ES: español" title="Español" hreflang="es"${idioma === 'es' ? ' aria-current="page"' : ''}>ES</a>
            <a href="${idioma === 'en' ? '#' : RUTAS[actual]?.en ?? '/en/'}" data-idioma="en" lang="en" aria-label="EN: English" title="English" hreflang="en"${idioma === 'en' ? ' aria-current="page"' : ''}>EN</a>
          </div>
          <div class="selector" role="group" aria-label="${escapar(t.fondo)}">
            <button type="button" data-fondo="oscuro" aria-pressed="true" aria-label="${escapar(t.fondoNegro)}" title="${escapar(t.fondoNegro)}">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>
            </button>
            <button type="button" data-fondo="claro" aria-pressed="false" aria-label="${escapar(t.fondoBlanco)}" title="${escapar(t.fondoBlanco)}">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <a class="boton principal barra-jugar" href="${RUTAS.juego[idioma]}" data-jugar>${t.jugar}</a>
      </div>
    </header>`.replace(`href="#" data-idioma="${idioma}"`, `href="${RUTAS[actual]?.[idioma] ?? RUTAS.inicio[idioma]}" data-idioma="${idioma}"`);
}

function pie(idioma) {
  const t = T[idioma];
  return `    <footer class="pie">
      <p>${t.hechoPor}</p>
      <p>${t.sinCookies}</p>
      <ul class="pie-mapa" aria-label="${escapar(t.paginas)}">
        <li><a href="${RUTAS.juego[idioma]}" data-jugar>${t.pieJuego}</a></li>
        <li><a href="${RUTAS.guia[idioma]}">${t.pieGuia}</a></li>
        <li><a href="${RUTAS.informe[idioma]}">${t.pieInforme}</a></li>
        <li><a href="${RUTAS.taller[idioma]}">${t.pieTaller}</a></li>
        <li><a href="${RUTAS.creditos[idioma]}">${t.pieCreditos}</a></li>
        <li><a href="${RUTAS.inicio[idioma]}" data-inicio>${t.pieInicio}</a></li>
      </ul>
      <p class="pie-derechos">${t.derechos}</p>
    </footer>`;
}

// Las migas: Inicio › (página)
export function migas(idioma, pasos) {
  const t = T[idioma];
  const items = [{ nombre: 'Mosca del WIP', ruta: RUTAS.inicio[idioma] }, ...pasos];
  const lista = items
    .map((p, i) => (i === items.length - 1 ? `<li aria-current="page">${p.nombre}</li>` : `<li><a href="${p.ruta}">${p.nombre}</a></li>`))
    .join('');
  return { html: `<nav class="migas" aria-label="${idioma === 'es' ? 'Dónde estás' : 'Where you are'}"><ol>${lista}</ol></nav>`, jsonLd: {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.nombre, item: SITIO + p.ruta })),
  }, t };
}

// Quien escribe: el bloque corto para la guía y el informe. Marcado con
// data-revisar="felipe": Felipe pidió revisar este texto antes de publicar.
export function autor(idioma) {
  const es = idioma === 'es';
  return `<aside class="autor" data-revisar="felipe" aria-label="${es ? 'Sobre el autor' : 'About the author'}">
  <!-- REVISAR (Felipe): este texto lo escribí yo con lo que había en el proyecto. Sin nombres de empresas donde trabaja. -->
  <div class="inicial" aria-hidden="true">F</div>
  <div>
    <h2>${es ? 'Quién escribe' : 'Who writes this'}</h2>
    <p>${es
      ? `<a href="${AUTOR.linkedin}">Felipe Fernández</a>, coach de equipos con más de seis años de experiencia y cofundador de <a href="https://deliverycraft.ai">Deliverycraft</a>. Hizo el juego, la simulación y este sitio.`
      : `<a href="${AUTOR.linkedin}">Felipe Fernández</a>, a team coach with more than six years of experience and cofounder of <a href="https://deliverycraft.ai">Deliverycraft</a>. He made the game, the simulation and this site.`}</p>
  </div>
</aside>`;
}

// Las tres piezas del kit, como tarjetas enlazadas (sin la actual)
export function enlacesKit(idioma, sin) {
  const es = idioma === 'es';
  const piezas = {
    juego: { ruta: RUTAS.juego[idioma], titulo: es ? 'El juego' : 'The game', texto: es ? 'Un día de oficina en un minuto, con 1 a 10 tareas a la vez.' : 'An office day in one minute, with 1 to 10 tasks at once.' },
    guia: { ruta: RUTAS.guia[idioma], titulo: es ? 'La guía del límite WIP' : 'The WIP limit guide', texto: es ? 'Qué es, cómo elegir el de tu equipo y qué hacer cuando algo espera.' : 'What it is, how to pick your team’s and what to do when something waits.' },
    informe: { ruta: RUTAS.informe[idioma], titulo: es ? 'El informe' : 'The report', texto: es ? 'De dónde sale cada número y qué dicen los estudios.' : 'Where each number comes from and what the studies say.' },
    taller: { ruta: RUTAS.taller[idioma], titulo: es ? 'El taller' : 'The workshop', texto: es ? 'Una dinámica de 60 minutos para que tu equipo elija su límite.' : 'A 60-minute session for your team to pick its limit.' },
  };
  return `<ul class="enlaces-kit">${Object.entries(piezas)
    .filter(([k]) => k !== sin)
    .map(([k, p]) => `<li><a href="${p.ruta}"${k === 'juego' ? ' data-jugar' : ''}><b>${p.titulo}</b><span>${p.texto}</span></a></li>`)
    .join('')}</ul>`;
}

// La página completa
export function pagina({ idioma, clave, titulo, descripcion, imagen, imagenAlt, jsonLd = [], cuerpo, claseBody = '', cssExtra = [], sinIndexar = false }) {
  const t = T[idioma];
  const rutas = RUTAS[clave] ?? { es: '/', en: '/en/' };
  const ruta = rutas[idioma];
  const otra = rutas[idioma === 'es' ? 'en' : 'es'];
  const grafo = { '@context': 'https://schema.org', '@graph': jsonLd };
  return `<!doctype html>
<!-- GENERADO por scripts/${clave === 'informe' ? 'informe-web.mjs' : 'paginas.mjs'} (Etapa 7). NO EDITAR A MANO: los cambios van en la fuente que dice ese script. -->
<html lang="${idioma}" data-idioma-pagina="${idioma}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapar(titulo)}</title>
    <meta name="description" content="${escapar(descripcion)}" />
    <meta name="theme-color" content="#060a16" />
    <meta name="color-scheme" content="dark" />${sinIndexar ? '\n    <meta name="robots" content="noindex" />' : ''}
    <!-- Antes de dibujar: el fondo que la persona eligió (como en la portada).
         El idioma lo decide la dirección; un enlace viejo con ?lang= va a la otra versión. -->
    <script>
      (function () {
        var raiz = document.documentElement;
        var lang = new URLSearchParams(location.search).get('lang');
        if ((lang === 'en' || lang === 'es') && lang !== raiz.getAttribute('data-idioma-pagina')) {
          location.replace(${JSON.stringify(otra)} + location.hash);
        }
        var fondo;
        try {
          fondo = localStorage.getItem('mosca-fondo');
        } catch (e) {}
        if (fondo === 'claro') {
          raiz.setAttribute('data-tema', 'claro');
          document.querySelector('meta[name="theme-color"]').content = '#ffffff';
          document.querySelector('meta[name="color-scheme"]').content = 'light';
        }
      })();
    </script>
    <link rel="icon" href="/favicon.ico?v=4" sizes="32x32" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=4" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" />
    <link rel="manifest" href="/manifest.webmanifest" />
${sinIndexar ? '' : `    <link rel="canonical" href="${SITIO}${ruta}" />
    <link rel="alternate" hreflang="es" href="${SITIO}${rutas.es}" />
    <link rel="alternate" hreflang="en" href="${SITIO}${rutas.en}" />
    <link rel="alternate" hreflang="x-default" href="${SITIO}${rutas.es}" />
`}
    <!-- Vista previa al compartir el enlace -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Mosca del WIP" />
    <meta property="og:locale" content="${idioma === 'es' ? 'es_CL' : 'en_US'}" />
    <meta property="og:locale:alternate" content="${idioma === 'es' ? 'en_US' : 'es_CL'}" />
${sinIndexar ? '' : `    <meta property="og:url" content="${SITIO}${ruta}" />
`}    <meta property="og:title" content="${escapar(titulo)}" />
    <meta property="og:description" content="${escapar(descripcion)}" />
    <meta property="og:image" content="${SITIO}${imagen}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapar(imagenAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapar(titulo)}" />
    <meta name="twitter:description" content="${escapar(descripcion)}" />
    <meta name="twitter:image" content="${SITIO}${imagen}" />

    <!-- La tipografía vive en el mismo sitio (no se pide a otro servidor) -->
    <link rel="preload" href="/fonts/mona-sans-latin-wdth.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/src/portada.css" />
    <link rel="stylesheet" href="/src/paginas.css" />${cssExtra.map((c) => `\n    <link rel="stylesheet" href="${c}" />`).join('')}
    <script type="module" src="/src/pagina.js"></script>
    <script type="module" src="/src/visitas.js"></script>
${jsonLd.length ? `    <!-- Datos estructurados (schema.org), solo tipos estándar -->
    <script type="application/ld+json">
${JSON.stringify(grafo, null, 2).replace(/</g, '\\u003c')}
    </script>` : '    <!-- Sin datos estructurados: esta página no se indexa -->'}
  </head>
  <body class="portada lectura-pagina ${claseBody}">
    <a class="saltar solo-lector" href="#contenido">${t.saltar}</a>
${barra(idioma, clave)}

${cuerpo}

${pie(idioma)}
  </body>
</html>
`;
}
