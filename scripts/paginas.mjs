// Arma las páginas de lectura del sitio (Etapa 7, 2026-10-28) a partir de sus
// fuentes en docs/paginas/ y de la plantilla común (scripts/plantilla.mjs):
//   docs/paginas/limite-wip.html → limite-wip/index.html   (/limite-wip/)
//   docs/paginas/wip-limit.html  → en/wip-limit/index.html (/en/wip-limit/)
//   docs/paginas/taller.html     → taller/index.html       (/taller/)
//   docs/paginas/workshop.html   → en/workshop/index.html  (/en/workshop/)
//   docs/paginas/404.html        → 404.html                (no encontrada)
// Cada fuente empieza con un comentario <!--meta { ... } --> (título,
// descripción, vista previa, migas, datos estructurados) y sigue con el
// cuerpo. En el cuerpo valen estos reemplazos:
//   {{migas}}            las migas (Inicio › página)
//   {{autor}}            el bloque "Quién escribe" (marcado para que Felipe lo revise)
//   {{kit}}              las tarjetas con las otras piezas del kit
//   {{tabla-datos}}      la tabla de 1 a 10 tareas, desde docs/corrida-oficial.json
//   {{descargas-taller}} los archivos del taller con su peso, desde public/taller/
//   {{fecha}}            la fecha de actualización, larga
// NO EDITAR las salidas a mano. Se corre solo antes de npm run dev y npm run
// build (package.json), o con: node scripts/paginas.mjs
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { pagina, migas, autor, enlacesKit, textos, SITIO, AUTOR, RUTAS, FECHAS } from './plantilla.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const FUENTES = [
  { archivo: 'docs/paginas/limite-wip.html', salida: 'limite-wip/index.html' },
  { archivo: 'docs/paginas/wip-limit.html', salida: 'en/wip-limit/index.html' },
  { archivo: 'docs/paginas/taller.html', salida: 'taller/index.html' },
  { archivo: 'docs/paginas/workshop.html', salida: 'en/workshop/index.html' },
  { archivo: 'docs/paginas/404.html', salida: '404.html' },
];

const corrida = JSON.parse(readFileSync(join(RAIZ, 'docs/corrida-oficial.json'), 'utf8'));
const NIVEL_EN = { Tranquila: 'Calm', Ocupada: 'Busy', Estresada: 'Stressed', Colapsada: 'Overwhelmed' };

// La tabla de 1 a 10 tareas (los mismos números del informe, sin redondear a mano)
function tablaDatos(idioma) {
  const es = idioma === 'es';
  const num = (v, d = 1) => new Intl.NumberFormat(es ? 'es-CL' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  const horas = (m) => {
    const r = Math.round(m);
    return r < 60 ? `${r} min` : `${Math.floor(r / 60)} h ${String(r % 60).padStart(2, '0')} min`;
  };
  const cab = es
    ? ['Tareas a la vez', 'Terminadas en el día', 'Tiempo por tarea', 'Rinden, de cada hora', 'Esperando, por día', 'Cigarros', 'Cafés', 'Estrés al cerrar']
    : ['Tasks at once', 'Finished in the day', 'Time per task', 'Productive, of every hour', 'Idle, per day', 'Cigarettes', 'Coffees', 'Stress at close'];
  const filas = corrida.filas
    .map((f) => {
      const clase = f.wip === 2 ? ' class="mejor"' : f.wip === 9 ? ' class="sobre"' : '';
      const etiqueta = f.wip === 2 ? (es ? '2 · la que más termina' : '2 · finishes the most') : f.wip === 9 ? (es ? '9 · sobrecarga' : '9 · overload') : String(f.wip);
      const nivel = es ? f.nivel : NIVEL_EN[f.nivel];
      return `<tr${clase}><td>${etiqueta}</td><td class="numero"><b>${num(f.terminadas)}</b></td><td class="numero">${horas(f.tiempo_por_tarea_min)}</td><td class="numero">${Math.round(f.eficiencia_min_por_hora)} min</td><td class="numero">${Math.round(f.espera_min)} min</td><td class="numero">${f.colillas}</td><td class="numero">${f.cafes}</td><td class="nivel-${f.nivel.toLowerCase()}">${nivel}</td></tr>`;
    })
    .join('\n');
  return `<div class="tabla-marco ancho"><table class="tabla-dias">
  <caption>${es ? `En el juego: promedio de ${corrida.dias} días por cada número de tareas (simulación, semilla ${corrida.semilla}). Tiempo por tarea en horas de oficina, de que empieza a que termina. Con fondo, el 2 (verde, la que más termina) y el 9 (rojo, la sobrecarga).` : `In the game: average of ${corrida.dias} days per number of tasks (simulation, seed ${corrida.semilla}). Time per task in office hours, from start to finish. Shaded, 2 (green, finishes the most) and 9 (red, overload).`}</caption>
  <thead><tr>${cab.map((c, i) => `<th${i > 0 && i < 7 ? ' class="numero"' : ''}>${c}</th>`).join('')}</tr></thead>
  <tbody>
${filas}
  </tbody>
</table></div>`;
}

// Los archivos del taller, con su peso real
function descargasTaller(idioma) {
  const es = idioma === 'es';
  const archivos = [
    { ruta: '/taller/Mosca-del-WIP-Taller-Presentacion.pptx', nombre: 'Mosca del WIP - Taller - Presentación.pptx', titulo: es ? 'Presentación (PowerPoint, 14 láminas)' : 'Slides (PowerPoint, 14 slides, in Spanish)', texto: es ? 'Editable, con notas cortas para quien facilita.' : 'Editable, with short notes for the facilitator.' },
    { ruta: '/taller/Mosca-del-WIP-Taller-Presentacion.pdf', nombre: 'Mosca del WIP - Taller - Presentación.pdf', titulo: es ? 'Presentación (PDF)' : 'Slides (PDF, in Spanish)', texto: es ? 'La misma presentación, para proyectar sin PowerPoint.' : 'The same slides, to project without PowerPoint.' },
    { ruta: '/taller/Mosca-del-WIP-Taller-Guia-rapida.pdf', nombre: 'Mosca del WIP - Taller - Guía rápida del facilitador.pdf', titulo: es ? 'Guía rápida del facilitador (PDF, 5 hojas)' : 'Facilitator’s quick guide (PDF, 5 pages, in Spanish)', texto: es ? 'La sesión en una hoja, qué preparar, qué te van a preguntar y la hoja del equipo.' : 'The session on one page, what to prepare, what they’ll ask you and the team sheet.' },
    { ruta: '/taller/Mosca-del-WIP-Taller-Hoja-del-equipo.pdf', nombre: 'Mosca del WIP - Taller - Hoja del equipo.pdf', titulo: es ? 'Hoja del equipo (PDF, 1 hoja)' : 'Team sheet (PDF, 1 page, in Spanish)', texto: es ? 'Para imprimir, una por equipo: las cuatro líneas que salen escritas del taller.' : 'To print, one per team: the four lines the team writes during the workshop.' },
  ];
  return `<ul class="descargas-pagina">${archivos
    .map((a) => {
      const ruta = join(RAIZ, 'public', a.ruta);
      const peso = existsSync(ruta) ? `${(statSync(ruta).size / 1048576).toFixed(1).replace('.', es ? ',' : '.')} MB` : es ? 'pendiente' : 'pending';
      return `<li><a href="${a.ruta}" download="${a.nombre}"><b>${a.titulo}</b><span>${a.texto}</span><small>${peso}</small></a></li>`;
    })
    .join('')}</ul>`;
}

function datasetJsonLd(idioma) {
  const es = idioma === 'es';
  return {
    '@type': 'Dataset',
    '@id': `${SITIO}${RUTAS.guia[idioma]}#datos`,
    name: es ? 'Mosca del WIP: un día de oficina con 1 a 10 tareas a la vez (promedio de 200 días en el juego)' : 'Mosca del WIP: an office day with 1 to 10 tasks at once (average of 200 days in the game)',
    description: es
      ? 'Para cada número de tareas en curso a la vez, de 1 a 10: cuántas termina la mosca en el día, cuánto tarda cada tarea, cuántos minutos de cada hora rinden, cuánto espera, cigarros, cafés y estrés. Promedio de 200 días simulados por cada número (semilla 2024), en el juego Mosca del WIP. Es una simulación de una mosca sola, no mide personas ni equipos.'
      : 'For each number of tasks in progress at once, from 1 to 10: how many the fly finishes in the day, how long each task takes, how many minutes of every hour are productive, idle time, cigarettes, coffees and stress. Average of 200 simulated days per number (seed 2024), in the game Mosca del WIP. It is a simulation of a single fly; it does not measure people or teams.',
    url: `${SITIO}${RUTAS.guia[idioma]}#datos`,
    sameAs: `${SITIO}${RUTAS.guia[idioma === 'es' ? 'en' : 'es']}#datos`,
    inLanguage: idioma,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    creator: { '@type': 'Person', '@id': `${SITIO}/#felipe`, name: AUTOR.nombre, url: AUTOR.linkedin },
    publisher: { '@type': 'Organization', '@id': `${SITIO}/#deliverycraft`, name: 'Deliverycraft', url: 'https://deliverycraft.ai/' },
    datePublished: '2026-10-28',
    dateModified: '2026-10-28',
    keywords: es ? ['límite WIP', 'trabajo en curso', 'work in progress', 'kanban', 'eficiencia de flujo', 'ley de Little', 'multitarea', 'simulación'] : ['WIP limit', 'work in progress', 'kanban', 'flow efficiency', "Little's Law", 'multitasking', 'simulation'],
    variableMeasured: (es
      ? ['tareas a la vez', 'terminadas por día', 'minutos por tarea', 'minutos que rinden por hora', 'minutos esperando por día', 'cigarros', 'cafés', 'estrés promedio', 'estrés máximo', 'nivel de estrés al cerrar']
      : ['tasks at once', 'finished per day', 'minutes per task', 'productive minutes per hour', 'idle minutes per day', 'cigarettes', 'coffees', 'average stress', 'maximum stress', 'stress level at close']
    ).map((v) => ({ '@type': 'PropertyValue', name: v })),
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${SITIO}/datos/mosca-del-wip-1-a-10-tareas.csv`, inLanguage: 'es' },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${SITIO}/datos/mosca-del-wip-1-to-10-tasks.csv`, inLanguage: 'en' },
    ],
  };
}

for (const fuente of FUENTES) {
  const crudo = readFileSync(join(RAIZ, fuente.archivo), 'utf8');
  const m = crudo.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`${fuente.archivo}: falta el comentario <!--meta {...} --> al inicio`);
  const meta = JSON.parse(m[1]);
  let cuerpo = crudo.slice(m[0].length);
  const { idioma, clave } = meta;
  const t = textos(idioma);
  const jsonLd = [];
  const mg = meta.miga ? migas(idioma, [{ nombre: meta.miga, ruta: RUTAS[clave][idioma] }]) : null;
  if (meta.articulo) {
    jsonLd.push({
      '@type': 'Article',
      '@id': `${SITIO}${RUTAS[clave][idioma]}#articulo`,
      headline: meta.articulo.headline,
      description: meta.descripcion,
      inLanguage: idioma,
      url: `${SITIO}${RUTAS[clave][idioma]}`,
      mainEntityOfPage: `${SITIO}${RUTAS[clave][idioma]}`,
      image: `${SITIO}${meta.imagen}`,
      datePublished: FECHAS.publicado,
      dateModified: FECHAS.modificado,
      isAccessibleForFree: true,
      author: { '@type': 'Person', '@id': `${SITIO}/#felipe`, name: AUTOR.nombre, url: AUTOR.linkedin, sameAs: [AUTOR.linkedin] },
      publisher: { '@type': 'Organization', '@id': `${SITIO}/#deliverycraft`, name: 'Deliverycraft', url: 'https://deliverycraft.ai/' },
      isPartOf: { '@type': 'WebSite', '@id': `${SITIO}/#sitio`, name: 'Mosca del WIP', url: `${SITIO}/` },
      keywords: meta.articulo.keywords,
      ...(meta.articulo.license ? { license: meta.articulo.license } : {}),
    });
  }
  if (mg) jsonLd.push(mg.jsonLd);
  if (meta.dataset) jsonLd.push(datasetJsonLd(idioma));
  cuerpo = cuerpo
    .replace('{{migas}}', () => (mg ? mg.html : ''))
    .replace('{{autor}}', () => autor(idioma))
    .replace('{{kit}}', () => enlacesKit(idioma, clave))
    .replace('{{tabla-datos}}', () => tablaDatos(idioma))
    .replace('{{descargas-taller}}', () => descargasTaller(idioma))
    .replaceAll('{{fecha}}', () => t.fechaLarga(FECHAS.modificado));
  if (/\{\{[a-z-]+\}\}/.test(cuerpo)) throw new Error(`${fuente.archivo}: quedó un marcador sin reemplazar: ${cuerpo.match(/\{\{[a-z-]+\}\}/)[0]}`);
  const html = pagina({ ...meta, jsonLd, cuerpo, cssExtra: meta.cssExtra ?? [] });
  mkdirSync(dirname(join(RAIZ, fuente.salida)), { recursive: true });
  writeFileSync(join(RAIZ, fuente.salida), html);
  console.log(`${fuente.salida} (${(html.length / 1024).toFixed(0)} KB)`);
}
