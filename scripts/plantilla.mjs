// La plantilla de las páginas de lectura del sitio (Etapa 7, 2026-10-28): la
// guía del límite WIP, el informe en la web, el taller, sus versiones en
// inglés y la página 404. La usan scripts/paginas.mjs y scripts/informe-web.mjs.
// Pone lo que todas comparten: el <head> completo (título, descripción,
// canonical, hreflang, vista previa, datos estructurados), la barra de arriba
// (la misma de todo el sitio: src/barra.js) y el pie con las páginas del
// sitio. Los textos en inglés del pie salen de src/portada-textos.js, para que
// cambien en un solo lugar.
import { INGLES } from '../src/portada-textos.js';
import { barraConSangria } from '../src/barra.js';
import { ICONOS } from './sello.mjs';

export const SITIO = 'https://mosca.deliverycraft.ai';
export const AUTOR = { nombre: 'Felipe Fernández', linkedin: 'https://www.linkedin.com/in/felipefernandezandrade/' };
export const FECHAS = { publicado: '2026-10-28', modificado: '2026-11-07' }; // 2026-11-07 (8.7): la guía y el taller con para qué sirve un límite y lo que se lleva el equipo; antes 2026-11-06 (8.6), 2026-11-04 (8.4) y 2026-10-29

// Las direcciones de cada página en cada idioma (las mismas de src/idioma.js)
export const RUTAS = {
  inicio: { es: '/', en: '/en/' },
  guia: { es: '/limite-wip/', en: '/en/wip-limit/' },
  informe: { es: '/informe/', en: '/en/report/' },
  taller: { es: '/taller/', en: '/en/workshop/' },
  juego: { es: '/jugar/', en: '/jugar/?lang=en' },
  creditos: { es: '/creditos/', en: '/creditos/?lang=en' },
};

// Los textos del pie (el español tal como está en index.html)
const T = {
  es: {
    saltar: 'Saltar al contenido',
    paginas: 'Páginas del sitio',
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
    paginas: INGLES.pieMapa,
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

// Quien escribe: el bloque corto para la guía, el informe y el taller
// (revisado por Felipe el 2026-10-28: queda tal como está).
export function autor(idioma) {
  const es = idioma === 'es';
  return `<aside class="autor" aria-label="${es ? 'Sobre el autor' : 'About the author'}">
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
export function pagina({ idioma, clave, titulo, descripcion, imagen, imagenAlt, jsonLd = [], cuerpo, claseBody = '', css = '/src/paginas.css', sinIndexar = false }) {
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
    <link rel="icon" href="${ICONOS.ico}" sizes="32x32" />
    <link rel="icon" type="image/svg+xml" href="${ICONOS.svg}" />
    <link rel="apple-touch-icon" href="${ICONOS.iphone}" />
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
    <!-- Un solo CSS por página (importa src/portada.css y la barra): así el
         orden de las reglas es el mismo en desarrollo y publicado -->
    <link rel="stylesheet" href="${css}" />
    <script type="module" src="/src/pagina.js"></script>
    <script type="module" src="/src/visitas.js"></script>
${jsonLd.length ? `    <!-- Datos estructurados (schema.org), solo tipos estándar -->
    <script type="application/ld+json">
${JSON.stringify(grafo, null, 2).replace(/</g, '\\u003c')}
    </script>` : '    <!-- Sin datos estructurados: esta página no se indexa -->'}
  </head>
  <body class="portada lectura-pagina ${claseBody}">
    <a class="saltar solo-lector" href="#contenido">${t.saltar}</a>
${barraConSangria({ idioma, pagina: clave }, '    ')}

${cuerpo}

${pie(idioma)}
  </body>
</html>
`;
}
