// Arma public/sitemap.xml con todas las páginas del sitio (español e inglés,
// con sus alternativas hreflang) y los archivos que se descargan (PDF, PPTX,
// CSV), cada uno con su fecha real de último cambio: la del último commit
// que tocó el archivo (o sus fuentes). Si el archivo tiene cambios sin
// guardar en git, la fecha es la de hoy.
// Uso: node scripts/sitemap.mjs        (correrlo antes de cada publicación)
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const SITIO = 'https://mosca.deliverycraft.ai';
const HOY = new Date().toISOString().slice(0, 10);

// Cada entrada: la dirección, los archivos cuyo cambio la actualiza y, si
// existe en los dos idiomas, su par. "prioridad" es la orientación para los
// buscadores (la portada y la guía son lo más importante).
const PAGINAS = [
  { ruta: '/', en: '/en/', fuentes: ['index.html', 'src/portada-textos.js'], prioridad: '1.0' },
  { ruta: '/limite-wip/', en: '/en/wip-limit/', fuentes: ['limite-wip/index.html'], fuentesEn: ['en/wip-limit/index.html'], prioridad: '0.9' },
  { ruta: '/informe/', en: '/en/report/', fuentes: ['informe/index.html', 'docs/contexto/compartir.html'], fuentesEn: ['en/report/index.html', 'docs/contexto/compartir-en.html'], prioridad: '0.8' },
  { ruta: '/taller/', en: '/en/workshop/', fuentes: ['taller/index.html'], fuentesEn: ['en/workshop/index.html'], prioridad: '0.8' },
  { ruta: '/jugar/', fuentes: ['jugar/index.html', 'src/main.js', 'src/brain.js'], prioridad: '0.9' },
  { ruta: '/creditos/', fuentes: ['creditos/index.html'], prioridad: '0.3' },
];
const ARCHIVOS = [
  { ruta: '/Mosca-del-WIP-Informe.pdf', fuentes: ['public/Mosca-del-WIP-Informe.pdf'] },
  { ruta: '/Mosca-del-WIP-Report.pdf', fuentes: ['public/Mosca-del-WIP-Report.pdf'] },
  { ruta: '/Mosca-del-WIP-Resumen.pdf', fuentes: ['public/Mosca-del-WIP-Resumen.pdf'] }, // 8.6
  { ruta: '/Mosca-del-WIP-Summary.pdf', fuentes: ['public/Mosca-del-WIP-Summary.pdf'] }, // 8.6
  { ruta: '/taller/Mosca-del-WIP-Taller-Guia-rapida.pdf', fuentes: ['public/taller/Mosca-del-WIP-Taller-Guia-rapida.pdf'] },
  { ruta: '/taller/Mosca-del-WIP-Taller-Presentacion.pdf', fuentes: ['public/taller/Mosca-del-WIP-Taller-Presentacion.pdf'] },
  { ruta: '/taller/Mosca-del-WIP-Taller-Presentacion.pptx', fuentes: ['public/taller/Mosca-del-WIP-Taller-Presentacion.pptx'] },
  { ruta: '/taller/Mosca-del-WIP-Taller-Hoja-del-equipo.pdf', fuentes: ['public/taller/Mosca-del-WIP-Taller-Hoja-del-equipo.pdf'] },
  { ruta: '/datos/mosca-del-wip-1-a-10-tareas.csv', fuentes: ['public/datos/mosca-del-wip-1-a-10-tareas.csv'] },
  { ruta: '/datos/mosca-del-wip-1-to-10-tasks.csv', fuentes: ['public/datos/mosca-del-wip-1-to-10-tasks.csv'] },
  { ruta: '/datos/mosca-del-wip-urgencias.csv', fuentes: ['public/datos/mosca-del-wip-urgencias.csv'] },
  { ruta: '/datos/mosca-del-wip-urgent-tasks.csv', fuentes: ['public/datos/mosca-del-wip-urgent-tasks.csv'] },
];

function git(comando) {
  try {
    return execSync(`git ${comando}`, { cwd: RAIZ, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// La fecha del último cambio de un grupo de archivos: la más nueva entre los
// commits que los tocaron; hoy si alguno está sin guardar o no existe aún
function fechaDe(fuentes) {
  let fecha = '';
  for (const f of fuentes) {
    if (!existsSync(resolve(RAIZ, f))) return HOY;
    if (git(`status --porcelain -- "${f}"`)) return HOY;
    const ultima = git(`log -1 --format=%cs -- "${f}"`);
    if (!ultima) return HOY;
    if (ultima > fecha) fecha = ultima;
  }
  return fecha || HOY;
}

const escapar = (s) => s.replaceAll('&', '&amp;');
const url = (ruta) => escapar(SITIO + ruta);
const lineas = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.w3.org/1999/xmlns/sitemap-0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
// (el espacio de nombres correcto del sitemap)
lineas[1] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

for (const p of PAGINAS) {
  const pares = p.en
    ? [
        { loc: p.ruta, lang: 'es', fecha: fechaDe(p.fuentes), prioridad: p.prioridad },
        { loc: p.en, lang: 'en', fecha: fechaDe(p.fuentesEn ?? p.fuentes), prioridad: p.prioridad },
      ]
    : [{ loc: p.ruta, fecha: fechaDe(p.fuentes), prioridad: p.prioridad }];
  for (const q of pares) {
    lineas.push('  <url>');
    lineas.push(`    <loc>${url(q.loc)}</loc>`);
    lineas.push(`    <lastmod>${q.fecha}</lastmod>`);
    lineas.push(`    <priority>${q.prioridad}</priority>`);
    if (p.en) {
      lineas.push(`    <xhtml:link rel="alternate" hreflang="es" href="${url(p.ruta)}" />`);
      lineas.push(`    <xhtml:link rel="alternate" hreflang="en" href="${url(p.en)}" />`);
      lineas.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${url(p.ruta)}" />`);
    }
    lineas.push('  </url>');
  }
}
for (const a of ARCHIVOS) {
  if (!existsSync(resolve(RAIZ, 'public' + a.ruta))) continue;
  lineas.push('  <url>');
  lineas.push(`    <loc>${url(a.ruta)}</loc>`);
  lineas.push(`    <lastmod>${fechaDe(a.fuentes)}</lastmod>`);
  lineas.push('    <priority>0.5</priority>');
  lineas.push('  </url>');
}
lineas.push('</urlset>', '');
writeFileSync(resolve(RAIZ, 'public/sitemap.xml'), lineas.join('\n'));
console.log(`public/sitemap.xml: ${lineas.filter((l) => l.includes('<loc>')).length} direcciones`);
