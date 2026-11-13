// Arma public/sitemap.xml con las direcciones principales del sitio: las
// páginas, en español e inglés, con sus alternativas hreflang. Cada una va
// escrita letra por letra igual que su etiqueta canónica, y este script lo
// comprueba antes de escribir (si una no calza, se detiene y lo dice).
// Los archivos que se descargan (PDF, PPTX y CSV) NO van en el sitemap desde
// el 2026-11-12 (docs/etapa8-10.md). Para los buscadores son copias de su
// página: la cabecera Link rel="canonical" de vercel.json manda los PDF del
// resumen ejecutivo y del taller y los CSV a /informe/, /en/report/, /taller/
// y /limite-wip/, y la presentación en PowerPoint es el mismo material que su
// PDF. Google los anotaba como "Página alternativa con etiqueta canónica
// adecuada". Se siguen encontrando por los enlaces de su página.
// Desde la 8.12 (2026-11-13) los dos PDF del informe ya no llevan esa
// cabecera: el informe extenso vive solo en su PDF (la página /informe/ es
// el resumen ejecutivo), y sin la cabecera los buscadores lo pueden leer por
// su cuenta. Igual no va en el sitemap (regla de Felipe: solo páginas).
// Tampoco van las direcciones con ?lang= o con ?v=, ni las que terminan en
// index.html: son la misma página con otra dirección.
// La fecha de cada página es la de su último cambio real: la del último
// commit que tocó sus fuentes. Si alguna tiene cambios sin guardar en git,
// la fecha es la de hoy.
// Uso: node scripts/sitemap.mjs        (correrlo antes de cada publicación)
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
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
  { ruta: '/informe/', en: '/en/report/', fuentes: ['informe/index.html', 'docs/contexto/resumen.html', 'docs/contexto/compartir.html'], fuentesEn: ['en/report/index.html', 'docs/contexto/resumen-en.html', 'docs/contexto/compartir-en.html'], prioridad: '0.8' },
  { ruta: '/taller/', en: '/en/workshop/', fuentes: ['taller/index.html'], fuentesEn: ['en/workshop/index.html'], prioridad: '0.8' },
  { ruta: '/jugar/', fuentes: ['jugar/index.html', 'src/main.js', 'src/brain.js'], prioridad: '0.9' },
  { ruta: '/creditos/', fuentes: ['creditos/index.html'], prioridad: '0.3' },
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

// Lo que dice el HTML de una página sobre su dirección: la etiqueta canónica
// y sus alternativas de idioma (sin contar lo que está dentro de comentarios)
function enlacesDe(ruta) {
  const archivo = resolve(RAIZ, ruta.slice(1), 'index.html');
  if (!existsSync(archivo)) return null;
  const html = readFileSync(archivo, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const enlaces = { canonicas: [], alternas: {} };
  for (const [etiqueta] of html.matchAll(/<link\b[^>]*>/gi)) {
    const atributo = (nombre) => etiqueta.match(new RegExp(`\\b${nombre}="([^"]*)"`, 'i'))?.[1];
    if (atributo('rel') === 'canonical') enlaces.canonicas.push(atributo('href'));
    if (atributo('rel') === 'alternate' && atributo('hreflang')) enlaces.alternas[atributo('hreflang')] = atributo('href');
  }
  return enlaces;
}

// Cada dirección del sitemap tiene que ser la principal de su página: igual,
// letra por letra, a su etiqueta canónica, y con su par de idioma bien puesto
const fallas = [];
for (const p of PAGINAS) {
  for (const loc of p.en ? [p.ruta, p.en] : [p.ruta]) {
    const enlaces = enlacesDe(loc);
    if (!enlaces) {
      fallas.push(`${loc}: no existe su index.html (¿falta npm run build?)`);
      continue;
    }
    if (enlaces.canonicas.length !== 1 || enlaces.canonicas[0] !== SITIO + loc) {
      fallas.push(`${loc}: su etiqueta canónica dice "${enlaces.canonicas.join('" y "') || 'nada'}" y debe decir "${SITIO + loc}"`);
    }
    const esperadas = p.en ? { es: SITIO + p.ruta, en: SITIO + p.en, 'x-default': SITIO + p.ruta } : { es: SITIO + p.ruta, 'x-default': SITIO + p.ruta };
    for (const idioma of new Set([...Object.keys(esperadas), ...Object.keys(enlaces.alternas)])) {
      if (enlaces.alternas[idioma] !== esperadas[idioma]) {
        fallas.push(`${loc}: hreflang "${idioma}" dice "${enlaces.alternas[idioma] ?? 'nada'}" y debe decir "${esperadas[idioma] ?? 'nada'}"`);
      }
    }
  }
}
if (fallas.length) {
  console.error('El sitemap NO se escribió. Cada dirección debe ser igual a la etiqueta canónica de su página:');
  for (const f of fallas) console.error('  ' + f);
  process.exit(1);
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
lineas.push('</urlset>', '');
writeFileSync(resolve(RAIZ, 'public/sitemap.xml'), lineas.join('\n'));
console.log(`public/sitemap.xml: ${lineas.filter((l) => l.includes('<loc>')).length} direcciones`);
