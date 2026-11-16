// Revisa que todo lo público diga lo mismo (Etapa 8.6, 2026-11-06).
//
// Busca en todo lo que se publica, en español y en inglés:
//   1. las frases retiradas de docs/frases-retiradas.txt,
//   2. las palabras prohibidas ([…], […], […], scrum, sprint, daily, retro),
//   3. el punto y coma en el texto que se lee,
//   4. los dos puntos en el texto que se lee (Etapa 8.12, 2026-11-13: "elimina
//      los : en todos lados"). No cuentan los de una hora (09:00), los de una
//      dirección (https://) ni los de los archivos que leen las máquinas
//      (robots.txt, el sitemap y el manifest, donde solo se revisan sus textos),
//   5. las palabras pegadas en los PDF del sitio (Etapa 8.14, 2026-11-14): el
//      texto de cada PDF según el visor de Chrome (PDFium) y según pdftotext.
//      Necesita pypdfium2 en .venv-datos (ver scripts/texto-pdfium.py),
//   6. los nombres y los metadatos (revisión final, fase 2, 2026-11-15): el
//      autor y el título de los PDF y de la presentación del sitio, los autores
//      del JSON-LD, el autor de las páginas, "FlyWire" (nunca) y los nombres de
//      empresas que no se nombran (detalle en la sección 6, más abajo).
// Dónde: el sitio construido (dist/: cada página con su texto, sus atributos que
// se leen y su JSON-LD, el manifest, el sitemap, los CSV, los PDF y la
// presentación del taller), los textos del juego y de la portada (src/), los
// borradores de difusión (los 8 de la sección 3 de docs/etapa7-difusion.md) y,
// si existe, lo vigente suelto en ~/Desktop/Mosca del WIP (salvo el Informe
// completo, que cuenta la historia y por eso cita textos viejos).
// Lo interno del Escritorio (los PDF de cada etapa y el de los borradores, que
// trae las reglas con las palabras prohibidas y el nombre del foro r/[…]) se
// revisa solo por frases retiradas: el texto de los borradores se revisa
// entero desde docs/etapa7-difusion.md. Los datos del cerebro (public/cerebro)
// no se tocan (regla de la 8.6) y su texto de origen no se muestra: no cuentan
// para el punto y coma.
//
// Uso: node scripts/revisar-coherencia.mjs              (construye el sitio primero)
//      node scripts/revisar-coherencia.mjs --sin-construir   (usa el dist/ que ya está)
//      node scripts/revisar-coherencia.mjs --mapa        (además, dónde aparece cada mensaje clave,
//                                                         y lo escribe en docs/mapa-de-contenidos.md)
// Corre antes de cada publicación (definición de terminado en CLAUDE.md).
// Termina con código 1 si encuentra algo.
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { execSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { join, relative, extname, basename } from 'node:path';

const R = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const ESCRITORIO = join(homedir(), 'Desktop', 'Mosca del WIP');

if (!args.includes('--sin-construir')) {
  process.stdout.write('Construyendo el sitio (npm run build)… ');
  execSync('npm run build', { cwd: R, stdio: 'pipe' });
  console.log('listo');
}
if (!existsSync(join(R, 'dist', 'index.html'))) throw new Error('Falta dist/: corre npm run build');

// ---------- Normalizar: sin mayúsculas, comillas rectas, espacios simples ----------
const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·', thinsp: ' ', shy: '' };
function decodificar(t) {
  return t
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENTIDADES[n.toLowerCase()] ?? m);
}
const normal = (t) =>
  t
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘´`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[   \s]+/g, ' ')
    .trim();

// ---------- Lo que se busca ----------
const RETIRADAS = readFileSync(join(R, 'docs', 'frases-retiradas.txt'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));
const PROHIBIDAS = /(?<![\p{L}\p{N}])([…](es)?|[…](es|idad)?|[…]|[…]|scrum|sprints?|daily|dailies|retros?)(?![\p{L}\p{N}])/giu;

// ---------- Juntar los textos públicos: { donde, texto } ----------
const piezas = [];
// solo: 'frases' = revisar solo frases retiradas (lo interno); 'sin-punto-y-coma' = todo menos el punto y
// coma y los dos puntos; 'sin-dos-puntos' = todo menos los dos puntos (archivos que leen las máquinas)
const agregar = (donde, texto, solo) => { if (texto && texto.trim()) piezas.push({ donde, texto: decodificar(texto), solo }); };

function archivos(dir) {
  const salida = [];
  for (const n of readdirSync(dir)) {
    const ruta = join(dir, n);
    const st = statSync(ruta);
    if (st.isDirectory()) salida.push(...archivos(ruta));
    else salida.push(ruta);
  }
  return salida;
}

// Una página HTML: el texto que se lee, los atributos que se leen y el JSON-LD
const META_TEXTO = /description|title|image:alt|site_name|keywords|application-name/i;
function textosJson(v, salida = []) {
  if (typeof v === 'string') { if (!/^(https?:|\/|data:)/.test(v)) salida.push(v); }
  else if (Array.isArray(v)) v.forEach((x) => textosJson(x, salida));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => textosJson(x, salida));
  return salida;
}
function pagina(donde, html) {
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    agregar(`${donde} (JSON-LD)`, textosJson(JSON.parse(m[1])).join(' · '));
  }
  for (const m of html.matchAll(/<meta\s[^>]*>/g)) {
    const nombre = /(?:name|property)="([^"]*)"/.exec(m[0])?.[1] ?? '';
    const contenido = /content="([^"]*)"/.exec(m[0])?.[1];
    if (contenido && META_TEXTO.test(nombre)) agregar(`${donde} (meta ${nombre})`, contenido);
  }
  const limpio = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<head[\s\S]*?<\/head>/, (h) => (/<title>([^<]*)<\/title>/.exec(h)?.[1] ?? ''));
  const atributos = [...limpio.matchAll(/\s(?:alt|title|aria-label|aria-description|placeholder|data-titulo|data-texto)="([^"]*)"/g)].map((m) => m[1]);
  if (atributos.length) agregar(`${donde} (atributos)`, atributos.join(' · '));
  agregar(donde, limpio.replace(/<[^>]+>/g, ' '));
}

// Un PDF: su texto (pdftotext) y sus metadatos
function pdf(donde, ruta, solo) {
  agregar(donde, execFileSync('pdftotext', ['-enc', 'UTF-8', ruta, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 }), solo);
}
// Una presentación: el texto de cada lámina y de sus notas
function pptx(donde, ruta, solo) {
  const lista = execFileSync('unzip', ['-Z1', ruta], { encoding: 'utf8' }).split('\n').filter((n) => /^ppt\/(slides|notesSlides)\/[^/]+\.xml$/.test(n));
  for (const n of lista) {
    const xml = execFileSync('unzip', ['-p', ruta, n], { encoding: 'utf8', maxBuffer: 64 << 20 });
    const parrafos = [...xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map((p) => [...p[1].matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((t) => t[1]).join(''));
    agregar(`${donde} › ${n.replace('ppt/', '')}`, parrafos.join(' \n'), solo);
  }
}

// 1. El sitio construido
const DIST = join(R, 'dist');
for (const ruta of archivos(DIST)) {
  const donde = 'sitio: /' + relative(DIST, ruta);
  const ext = extname(ruta).toLowerCase();
  // (el archivo con que Google comprueba de quién es el sitio lo lee una máquina: no es texto del sitio)
  if (/^google[0-9a-f]+\.html$/.test(basename(ruta))) continue;
  if (ext === '.html') pagina(donde, readFileSync(ruta, 'utf8'));
  else if (ext === '.pdf') pdf(donde, ruta);
  else if (ext === '.pptx') pptx(donde, ruta);
  else if (ext === '.csv') agregar(donde, readFileSync(ruta, 'utf8'));
  else if (['.webmanifest', '.txt', '.xml'].includes(ext)) {
    // Los leen las máquinas y su formato lleva dos puntos: ahí cuentan solo sus textos
    agregar(donde, readFileSync(ruta, 'utf8'), 'sin-dos-puntos');
    if (ext === '.webmanifest') agregar(`${donde} (textos)`, textosJson(JSON.parse(readFileSync(ruta, 'utf8'))).join(' · '));
  }
  else if (ext === '.json' && statSync(ruta).size < 2e6)
    agregar(donde, textosJson(JSON.parse(readFileSync(ruta, 'utf8'))).join(' · '), ruta.includes(`${DIST}/cerebro/`) ? 'sin-punto-y-coma' : undefined);
}

// 2. Los textos del juego, la portada y los créditos (en el JS del sitio): cada
// texto entre comillas de src/, sin comentarios y sin lo que es código o CSS
function textosDeCodigo(fuente) {
  const sinComentarios = fuente
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    // (los avisos para quien programa, new Error(...) y console.*(...), no los lee nadie en el sitio)
    .replace(/(?:new Error|console\.\w+)\(\s*(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, ' ');
  const textos = [];
  for (const m of sinComentarios.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    let t = (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, '0').replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(.)/g, '$1');
    const sinEtiquetas = t.replace(/<[^>]+>/g, ' ');
    const palabras = sinEtiquetas.match(/\p{L}{2,}/gu) ?? [];
    // (también es código una consulta de pantalla, como "(max-width: 899px)" o "(prefers-reduced-motion: reduce)")
    const pareceCodigo = /[{}=]|=>|\w\(\)|^[.#\[]|[a-z-]+\s*:\s*[^;]+;\s*[a-z-]+\s*:|^\s*(?:\([a-z-]+\s*:\s*[^()]*\)\s*(?:and|,)?\s*)+$/.test(sinEtiquetas);
    if (palabras.length >= 2 && /\s/.test(sinEtiquetas.trim()) && !pareceCodigo) textos.push(sinEtiquetas);
  }
  return textos;
}
for (const n of readdirSync(join(R, 'src')).filter((n) => n.endsWith('.js'))) {
  agregar(`textos: src/${n}`, textosDeCodigo(readFileSync(join(R, 'src', n), 'utf8')).join(' ¦ '));
}

// 3. Los borradores de difusión (los mismos 8 que arma scripts/borradores.mjs)
const md = readFileSync(join(R, 'docs', 'etapa7-difusion.md'), 'utf8');
const sec3 = md.slice(md.indexOf('## 3. Borradores'), md.indexOf('## 4. Subir'));
[...sec3.matchAll(/```text\n([\s\S]*?)\n```/g)].forEach((m, i) => agregar(`borradores: docs/etapa7-difusion.md, borrador ${i + 1}`, m[1]));

// 4. Lo vigente en la carpeta del Escritorio (si está en este computador)
if (existsSync(ESCRITORIO)) {
  for (const n of readdirSync(ESCRITORIO)) {
    const ruta = join(ESCRITORIO, n);
    if (!statSync(ruta).isFile() || /Informe completo/i.test(n)) continue;
    const solo = /Etapa|Borradores/i.test(n) ? 'frases' : undefined;
    if (/\.pdf$/i.test(n)) pdf(`escritorio: ${n}`, ruta, solo);
    else if (/\.pptx$/i.test(n)) pptx(`escritorio: ${n}`, ruta, solo);
  }
}

// ---------- Revisar ----------
const hallazgos = [];
const contexto = (texto, i, largo) => texto.slice(Math.max(0, i - 50), i + largo + 50).replace(/\s+/g, ' ').trim();
for (const { donde, texto, solo } of piezas) {
  const n = normal(texto);
  for (const frase of RETIRADAS) {
    const f = normal(frase);
    let i = n.indexOf(f);
    if (i >= 0) hallazgos.push({ tipo: 'frase retirada', donde, que: frase, ver: contexto(n, i, f.length) });
  }
  if (solo === 'frases') continue;
  for (const m of texto.matchAll(PROHIBIDAS)) {
    hallazgos.push({ tipo: 'palabra prohibida', donde, que: m[0], ver: contexto(texto, m.index, m[0].length) });
  }
  if (solo === 'sin-punto-y-coma') continue;
  for (const m of texto.matchAll(/;/g)) {
    hallazgos.push({ tipo: 'punto y coma', donde, que: ';', ver: contexto(texto, m.index, 1) });
  }
  if (solo === 'sin-dos-puntos') continue;
  for (const m of texto.matchAll(/:/g)) {
    const antes = texto[m.index - 1] ?? '', despues = texto[m.index + 1] ?? '';
    if (/\d/.test(antes) && /\d/.test(despues)) continue; // una hora: 09:00
    if (texto.startsWith('//', m.index + 1)) continue; // una dirección: https://
    hallazgos.push({ tipo: 'dos puntos', donde, que: ':', ver: contexto(texto, m.index, 1) });
  }
}

// ---------- 5. Palabras pegadas en los PDF del sitio (Etapa 8.14, 2026-11-14) ----------
// Felipe copió el texto del resumen desde el visor de PDF de Chrome y los
// títulos salieron pegados ("Ocupadotodoeldía.", "Unlímite sostenible,
// nounacosaalavez."). Ese texto es el que leen Google y las IA. Los lectores
// de PDF no leen los espacios, los deducen de dónde queda cada letra, y cada
// uno lo hace a su manera. Aquí se saca el texto de cada PDF del sitio con dos
// lectores, PDFium (el del visor de Chrome, con scripts/texto-pdfium.py) y
// pdftotext, y una palabra de uno que en el otro sale como dos o más palabras
// separadas cuenta como pegada (en el que la tiene junta). Las letras sueltas
// no cuentan como palabra, salvo a, e, i, o, u, y. Las líneas con tres o más
// letras sueltas (otras que esas) no se revisan: son rótulos en mayúsculas con
// las letras muy separadas, que todos los lectores sacan con letras sueltas
// ("G U ÍA RÁP IDA"), y eso es otro problema (bitácora de la 8.14).
const PDF_DEL_SITIO = archivos(DIST).filter((r) => extname(r).toLowerCase() === '.pdf');
const LETRA_SOLA = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
const ESPACIOS = /[\s\u00a0\u2009\u202f]+/u;
const palabrasDe = (t) =>
  t
    .normalize('NFC')
    .replace(/\u0002/g, '-')
    .split(/\r\n|\r|\n/)
    .map((linea) => linea.split(ESPACIOS).map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase()).filter(Boolean))
    .filter((linea) => linea.filter((w) => w.length === 1 && /\p{L}/u.test(w) && !LETRA_SOLA.has(w)).length < 3)
    .flat();
// Una palabra pegada en un lector es la que en el otro sale como dos a diez
// palabras seguidas (se comparan sin signos: "sostenible,nounacosa" calza con
// "sostenible, no una cosa"). Cuenta solo si al menos una de ellas tiene dos
// letras o más: "1h" o "1/2" se leen igual que "1 h" o "1 / 2".
const sinSignos = (w) => w.replace(/[^\p{L}\p{N}]/gu, '');
function seguidas(palabras) {
  const juntas = new Map();
  for (let i = 0; i < palabras.length; i++) {
    let clave = sinSignos(palabras[i]);
    for (let k = 1; k < 10 && i + k < palabras.length; k++) {
      clave += sinSignos(palabras[i + k]);
      if (!juntas.has(clave)) juntas.set(clave, palabras.slice(i, i + k + 1));
    }
  }
  return juntas;
}
let textosPdfium = null;
try {
  textosPdfium = JSON.parse(
    execFileSync(join(R, '.venv-datos', 'bin', 'python'), [join(R, 'scripts', 'texto-pdfium.py'), ...PDF_DEL_SITIO], { encoding: 'utf8', maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'pipe'] }),
  );
} catch {
  hallazgos.push({ tipo: 'palabras pegadas', donde: 'PDF del sitio', que: 'no pude leerlos con PDFium', ver: 'instalar una vez con "uv pip install --python .venv-datos/bin/python pypdfium2" y volver a correr' });
}
if (textosPdfium) {
  for (const ruta of PDF_DEL_SITIO) {
    const lectores = {
      'visor de Chrome': palabrasDe(textosPdfium[ruta] ?? ''),
      pdftotext: palabrasDe(execFileSync('pdftotext', ['-enc', 'UTF-8', ruta, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 })),
    };
    const nombres = Object.keys(lectores);
    for (const lector of nombres) {
      const otro = nombres.find((n) => n !== lector);
      const vocab = new Set(lectores[otro].map(sinSignos));
      const juntas = seguidas(lectores[otro]);
      const vistas = new Set();
      for (const w of lectores[lector]) {
        const clave = sinSignos(w);
        if (!clave || vocab.has(clave) || vistas.has(clave)) continue;
        vistas.add(clave);
        const partes = juntas.get(clave);
        if (partes && partes.some((x) => (x.match(/\p{L}/gu) ?? []).length >= 2)) hallazgos.push({ tipo: 'palabras pegadas', donde: `sitio: /${relative(DIST, ruta)} (${lector})`, que: w, ver: `en ${otro} son «${partes.join(' ')}»` });
      }
    }
  }
}

// ---------- 6. Nombres y metadatos (revisión final, fase 2, 2026-11-15) ----------
// Quién firma cada cosa y los nombres que no van (hallazgo A13 de la revisión
// final: hasta aquí nada de esto se revisaba solo).
//  - Los PDF del sitio llevan de autor "Felipe Fernández" (definición de
//    terminado, "metadatos limpios"), también en sus metadatos XMP si los
//    tienen (algunos lectores muestran esos), y su título, su tema y sus
//    palabras clave van sin dos puntos (regla de la 8.12, que en la 8.12 se
//    aplicó también a las propiedades de los PDF).
//  - La presentación del taller (PPTX), igual: autor y "modificado por"
//    "Felipe Fernández" y el título sin dos puntos.
//  - En el JSON-LD de cada página, cada author y creator es la persona "Felipe
//    Fernández", también cuando apunta con @id a otra parte de la página.
//  - El autor de cada página (<meta name="author">): si alguna página lo tiene,
//    todas lo llevan una vez y con "Felipe Fernández". Si ninguna lo tiene, se
//    avisa y no se cuenta (el 2026-11-15 lo agregó a todas la rama
//    fase2-sitio, que todavía no estaba en main: al juntarse, se exige solo).
//  - "FlyWire" no aparece en nada público: el mapa del juego es el Male CNS
//    (MaleCNS), y de FlyWire no se usa nada (regla desde la Etapa 5).
//  - Las empresas que el proyecto decidió no nombrar: EmpresaX ("Por qué lo hice",
//    Etapa 8.8, sección 7 de docs/etapa8-8.md). No se agregan otras sin que
//    estén decididas así en CLAUDE.md o en las bitácoras.
// Como en las revisiones 2 a 4, lo interno del Escritorio no cuenta.
const AUTOR = 'Felipe Fernández';
const EMPRESAS_QUE_NO_SE_NOMBRAN = ['EmpresaX'];
const esAutor = (t) => typeof t === 'string' && t.normalize('NFC').trim() === AUTOR.normalize('NFC');
const avisos = [];
const malNombre = (donde, que, ver) => hallazgos.push({ tipo: 'nombres y metadatos', donde, que, ver });
// Los PDF: sus propiedades (pdfinfo) y sus metadatos XMP (pdfinfo -meta)
for (const ruta of PDF_DEL_SITIO) {
  const donde = `sitio: /${relative(DIST, ruta)}`;
  const info = execFileSync('pdfinfo', ['-enc', 'UTF-8', ruta], { encoding: 'utf8' });
  const campo = (n) => new RegExp(`^${n}:[ \\t]*(.*)$`, 'm').exec(info)?.[1].trim() ?? '';
  if (!esAutor(campo('Author'))) malNombre(`${donde} (propiedades)`, campo('Author') || 'sin autor', `el autor tiene que ser «${AUTOR}»`);
  if (!campo('Title')) malNombre(`${donde} (propiedades)`, 'sin título', 'cada PDF del sitio lleva su título');
  for (const [n, nombre] of [['Title', 'título'], ['Subject', 'tema'], ['Keywords', 'palabras clave']])
    if (campo(n).includes(':')) malNombre(`${donde} (propiedades)`, ':', `dos puntos en el ${nombre}, ${campo(n)}`);
  const xmp = execFileSync('pdfinfo', ['-meta', ruta], { encoding: 'utf8' });
  const lista = (etiqueta) => [...(new RegExp(`<${etiqueta}>([\\s\\S]*?)</${etiqueta}>`).exec(xmp)?.[1] ?? '').matchAll(/<rdf:li[^>]*>([^<]*)<\/rdf:li>/g)].map((m) => decodificar(m[1]));
  for (const c of lista('dc:creator')) if (!esAutor(c)) malNombre(`${donde} (XMP)`, c || 'sin autor', `el autor tiene que ser «${AUTOR}»`);
  for (const t of lista('dc:title')) if (t.includes(':')) malNombre(`${donde} (XMP)`, ':', `dos puntos en el título, ${t}`);
}
// La presentación del taller: sus propiedades (docProps/core.xml)
for (const ruta of archivos(DIST).filter((r) => extname(r).toLowerCase() === '.pptx')) {
  const donde = `sitio: /${relative(DIST, ruta)} (propiedades)`;
  let core = '';
  try { core = execFileSync('unzip', ['-p', ruta, 'docProps/core.xml'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch { /* sin propiedades */ }
  const etiqueta = (n) => { const m = new RegExp(`<${n}>([^<]*)</${n}>`).exec(core); return m ? decodificar(m[1]) : null; };
  if (!esAutor(etiqueta('dc:creator'))) malNombre(donde, etiqueta('dc:creator') || 'sin autor', `el autor tiene que ser «${AUTOR}»`);
  const modifico = etiqueta('cp:lastModifiedBy');
  if (modifico !== null && !esAutor(modifico)) malNombre(donde, modifico || 'vacío', `"modificado por" tiene que ser «${AUTOR}»`);
  if ((etiqueta('dc:title') ?? '').includes(':')) malNombre(donde, ':', `dos puntos en el título, ${etiqueta('dc:title')}`);
}
// Las páginas: los autores del JSON-LD y el autor de la página
const PAGINAS_HTML = archivos(DIST).filter((r) => extname(r).toLowerCase() === '.html' && !/^google[0-9a-f]+\.html$/.test(basename(r)));
const recorrer = (v, visitar) => {
  if (Array.isArray(v)) v.forEach((x) => recorrer(x, visitar));
  else if (v && typeof v === 'object') { visitar(v); Object.values(v).forEach((x) => recorrer(x, visitar)); }
};
const metaAutor = [];
for (const ruta of PAGINAS_HTML) {
  const donde = 'sitio: /' + relative(DIST, ruta);
  const html = readFileSync(ruta, 'utf8');
  const bloques = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const porId = new Map();
  bloques.forEach((b) => recorrer(b, (o) => { if (o['@id'] && Object.keys(o).length > 1) porId.set(o['@id'], o); }));
  bloques.forEach((b) => recorrer(b, (o) => {
    for (const clave of ['author', 'creator']) for (const a of [].concat(o[clave] ?? [])) {
      const soloId = a && typeof a === 'object' && a['@id'] && Object.keys(a).length === 1;
      const quien = soloId ? porId.get(a['@id']) : a;
      if (typeof quien === 'string' ? esAutor(quien) : esAutor(quien?.name) && [].concat(quien['@type'] ?? []).includes('Person')) continue;
      const que = soloId && !quien ? a['@id'] : typeof quien === 'string' ? quien : quien?.name ?? 'sin nombre';
      const por = soloId && !quien ? ', que no está en la página' : typeof quien === 'object' && quien && ![].concat(quien['@type'] ?? []).includes('Person') ? `, que no es una persona (${[].concat(quien['@type'] ?? 'sin tipo').join(', ')})` : '';
      malNombre(`${donde} (JSON-LD)`, que, `${clave}${por}. Tiene que ser la persona «${AUTOR}»`);
    }
  }));
  const autores = [...html.matchAll(/<meta\s[^>]*name="author"[^>]*>/gi)].map((m) => decodificar(/content="([^"]*)"/.exec(m[0])?.[1] ?? ''));
  metaAutor.push({ donde, autores });
}
if (metaAutor.some((p) => p.autores.length)) {
  for (const { donde, autores } of metaAutor)
    if (autores.length !== 1 || !esAutor(autores[0])) malNombre(`${donde} (meta author)`, autores.length ? autores.join(' y ') : 'sin <meta name="author">', `cada página lleva uno solo, «${AUTOR}»`);
} else avisos.push(`Ninguna de las ${PAGINAS_HTML.length} páginas tiene <meta name="author">. No se cuenta. Cuando una lo tenga, se exige en todas.`);
// "FlyWire" y las empresas que no se nombran, en todo lo público (no en lo interno del Escritorio)
const EMPRESAS = new RegExp(`(?<![\\p{L}\\p{N}])(?:${EMPRESAS_QUE_NO_SE_NOMBRAN.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
for (const { donde, texto, solo } of piezas) {
  if (solo === 'frases') continue;
  for (const m of texto.matchAll(/fly[\s_-]*wire/giu)) malNombre(donde, m[0], `${contexto(texto, m.index, m[0].length)} (nunca FlyWire, el mapa del juego es el Male CNS)`);
  for (const m of texto.matchAll(EMPRESAS)) malNombre(donde, m[0], `${contexto(texto, m.index, m[0].length)} (una empresa que no se nombra)`);
}

const porTipo = (t) => hallazgos.filter((h) => h.tipo === t);
console.log(`\nRevisé ${piezas.length} textos públicos (${new Set(piezas.map((p) => p.donde.split(' (')[0].split(' › ')[0])).size} archivos), las palabras de ${PDF_DEL_SITIO.length} PDF con dos lectores y los autores y metadatos de esos PDF, de la presentación y de ${PAGINAS_HTML.length} páginas.`);
const TITULOS = { 'frase retirada': 'Frases retiradas', 'palabra prohibida': 'Palabras prohibidas', 'punto y coma': 'Punto y coma', 'dos puntos': 'Dos puntos', 'palabras pegadas': 'Palabras pegadas en los PDF', 'nombres y metadatos': 'Nombres y metadatos' };
for (const tipo of Object.keys(TITULOS)) {
  const lista = porTipo(tipo);
  console.log(`\n${TITULOS[tipo]}: ${lista.length}`);
  for (const h of lista) console.log(`  ✗ ${h.donde}\n      «${h.que}» … ${h.ver}`);
  if (tipo === 'nombres y metadatos') for (const a of avisos) console.log(`  (aviso) ${a}`);
}

// ---------- Mapa: dónde aparece cada mensaje clave (escribe docs/mapa-de-contenidos.md) ----------
if (args.includes('--mapa')) {
  // Cada pieza clave: lo que dice en los dos idiomas y las frases que la delatan
  // (en minúsculas o mayúsculas da igual). Si una pieza cambia de texto, se
  // cambian aquí sus frases, o el mapa dirá "(en ningún lado)".
  const CLAVES = [
    // (8.7, 2026-11-07) la portada vuelve a la pregunta; hasta la 8.6 era "Termina más empezando menos"
    { pieza: 'Mensaje de la portada', es: 'Ocupado todo el día. ¿Y qué terminaste?', en: 'Busy all day. So what did you finish?',
      // ("busy all day" solo no sirve: la guía y el taller en inglés dicen "she is busy all day")
      buscar: ['Ocupado todo el día', 'what did you finish'] },
    { pieza: 'Frase norte del problema', es: 'Estar siempre ocupado no es lo mismo que avanzar', en: 'Being busy all the time isn’t the same as making progress',
      buscar: ['Estar siempre ocupado no es lo mismo que avanzar', 'Being busy all the time isn’t the same as making progress'] },
    { pieza: 'Frase norte de la respuesta', es: 'Un límite sostenible, no una cosa a la vez', en: 'A sustainable limit, not one thing at a time',
      buscar: ['Un límite sostenible, no una cosa a la vez', 'A sustainable limit, not one thing at a time'] },
    { pieza: 'Corrida oficial: cuántas terminó', es: 'En el juego, con 2 a la vez termina 18 (17,99) y con 9, la mitad (9,14). Promedio de 200 días', en: 'In the game, with 2 at once she finishes 18 (17.99) and with 9, half as many (9.14). Average of 200 days',
      // (8.8) el dato del inicio dice "termina el doble" y la prueba dibujada, "18 terminadas al día"
      buscar: ['17,99', '17.99', '9,14', '9.14', '18 terminadas', 'termina 18', 'terminó la mitad', 'termina la mitad', 'termina el doble', '18 tasks', 'finishes 18', '18 finished', 'finished half as many', 'finishes half as many', 'finishes twice as many'] },
    { pieza: 'Corrida oficial: cuánto tardó cada tarea', es: 'Con 2 a la vez, 1 hora. Con 9, 8 h 54 (casi nueve veces más)', en: 'With 2 at once, 1 hour. With 9, 8 h 54 (almost nine times longer)',
      // (8.8) en la portada, "1 h cada una" y "casi 9 h cada una"
      buscar: ['8 h 54', '534', 'nueve veces', 'nine times', 'casi 9 h cada una', 'almost 9 h each'] },
    { pieza: 'Corrida oficial: eficiencia de flujo', es: 'En el juego, 47 % con 2 a la vez y 9 % con 9', en: 'In the game, 47% with 2 at once and 9% with 9',
      // (8.8) en la portada también en palabras: "espera 9 de cada 10 minutos"
      buscar: ['47 %', '47%', '9 de cada 10 minutos', '9 out of every 10 minutes'] },
    // (8.11, 2026-11-12) "Las cuatro ideas" eran de la página "Si solo lees una página" del informe, que ya no
    // existe. En su lugar, los tres hallazgos del resumen ejecutivo (el tercero está en "Urgencias: el resultado")
    { pieza: 'Lo que encontramos (resumen ejecutivo)', es: 'Una sola tarea a la vez no fue lo mejor. Lo empezado no desaparece. Cada urgencia costó una tarea normal.',
      en: 'One task at a time wasn’t the best. What’s started doesn’t disappear. Each urgent task cost one regular task.',
      buscar: ['Una sola tarea a la vez no fue lo mejor', 'One task at a time wasn’t the best', 'Lo empezado no desaparece', 'What’s started doesn’t disappear'] },
    // (8.7) reemplaza a "Lo que busca un límite" de la 8.6. (8.9) En la portada
    // los números son de la mosca y se dice antes de mostrarlos; la primera
    // línea habla de ella ("Termina más, y cada tarea sale antes")
    // (8.11) el título es una pregunta sobre la mosca. (8.14) Felipe borró la
    // bajada ("En el juego, con 2 tareas a la vez en lugar de 9, ganó esto…") y
    // la nota de abajo del tablero dice de dónde salen los números
    { pieza: '¿Qué ganó la mosca al limitar su WIP?', es: 'Termina más, y cada tarea sale antes. El trabajo avanza en vez de esperar. Menos sobrecarga. En el juego, promedio de 200 días jugados. Cuánto gana tu equipo, lo dice su prueba.',
      en: 'She finishes more, and each task is done sooner. Work moves forward instead of waiting. Less overload. In the game, average of 200 days played. Your team’s own test will show how much it gains.',
      buscar: ['Qué ganó la mosca', 'What did the fly gain', 'en vez de esperar', 'instead of waiting', 'Cuánto gana', 'own test will show how much it gains'] }, // (revisión final v3, N10) antes "How much your team gains, its own test will show"
    { pieza: 'Lo que se lleva tu equipo', es: 'Su carga a la vista. Dónde se queda esperando el trabajo. Un límite acordado, escrito en el tablero. Sus propios datos después de dos semanas.',
      en: 'Their load in plain sight. Where the work sits waiting. An agreed limit, written on the board. Their own data after two weeks.',
      buscar: ['carga a la vista', 'load in plain sight', 'límite acordado', 'agreed limit'] },
    { pieza: 'Las preguntas del juego (8.7)', es: 'En la tarjeta: ¿Con cuál crees que termina más? Al fin del día: ¿Y tú, cuántas cosas tienes empezadas hoy?',
      en: 'On the card: Which one do you think gets more done? At the end of the day: What about you? How many things do you have in progress today?',
      buscar: ['¿Con cuál crees que termina más?', 'Which one do you think gets more done?', 'cuántas cosas tienes empezadas hoy', 'How many things do you have in progress today'] },
    // (8.8, 2026-11-09)
    { pieza: 'El recorrido del juego (8.8)', es: '¿Dónde está cada cosa? Aquí mandas tú. El día. Su tablero. Cómo le va. Su cerebro, en vivo. Tus días jugados.',
      en: 'Where is everything? You’re in charge here. The day. Her board. How she’s doing. Her brain, live. Your days played.',
      buscar: ['¿Dónde está cada cosa?', 'Where is everything?', 'Aquí mandas tú', 'You’re in charge here'] },
    { pieza: 'El aviso de la mosca del mapa (8.8)', es: 'Ninguna mosca salió herida ni fue obligada a trabajar de verdad. Salvo la del mapa, a esa le sacaron el sistema nervioso y lo cortaron en 66 láminas.',
      en: 'No fly was harmed or made to do any real work. Except the one in the map, whose nervous system was taken out and cut into 66 slices.', // (8.11) sin dos puntos
      buscar: ['Ninguna mosca salió herida', 'No fly was harmed', '66 láminas', '66 slices'] },
    { pieza: 'Los cuatro pasos', es: '1. Pongan el trabajo a la vista. 2. Cuenten lo abierto y pónganle un límite. 3. Cuando alguien queda esperando, ataquen la espera. 4. Prueben dos semanas y midan.',
      en: '1. Make the work visible. 2. Count what’s open and set a limit. 3. When someone is left waiting, go after the wait. 4. Try it for two weeks and measure.',
      buscar: ['Pongan el trabajo a la vista', 'Make the work visible', 'Prueben dos semanas y midan', 'Try it for two weeks and measure'] },
    { pieza: 'Urgencias: el botón', es: 'Mándale una urgencia', en: 'Send an urgent task',
      buscar: ['Mándale una urgencia', 'Send an urgent task'] },
    { pieza: 'Urgencias: el resultado', es: 'En la simulación, con límite 2, cada urgencia costó una tarea normal', en: 'In the simulation, with limit 2, each urgent task cost one (a) regular task',
      buscar: ['costó una tarea normal', 'cuesta una tarea normal', 'cost a regular task', 'cost one regular task', 'costs a regular task', 'costs one regular task'] },
    { pieza: 'FAQ de la portada (las respuestas nuevas de la 8.6 y la 8.7)', es: '¿Qué es la Mosca del WIP? ¿Cuántas tareas a la vez es lo mejor? ¿Qué se lleva mi equipo? ¿Y las urgencias?',
      en: 'What is Mosca del WIP? How many tasks at once is best? What does my team take away? What about urgent tasks?',
      buscar: ['Es un juego de un minuto que también es un experimento', 'It’s a one-minute game that is also a computer experiment', 'No hay un número para todos', 'There’s no number for everyone', '¿Qué se lleva mi equipo?', 'What does my team take away?', 'pasa por encima del límite, de a una', 'jumps over the limit, one at a time'] },
  ];
  // Dónde se edita cada cosa (lo demás sale de aquí al construir o al rehacer los PDF)
  const FUENTES = {
    'index.html': 'la portada en español, con su title, meta, og y JSON-LD',
    'src/portada-textos.js': 'la portada en inglés',
    'scripts/generar-ingles.mjs': 'title, meta, og y JSON-LD de la portada en inglés',
    'jugar/index.html': 'el juego',
    'src/juego-textos.js': 'los textos del juego (español e inglés)',
    'docs/paginas/limite-wip.html': 'la guía',
    'docs/paginas/wip-limit.html': 'la guía en inglés',
    'docs/paginas/taller.html': 'el taller',
    'docs/paginas/workshop.html': 'el taller en inglés',
    'scripts/paginas.mjs': 'title, meta y JSON-LD de la guía y el taller',
    'docs/contexto/compartir.html': 'el informe (PDF, y el índice de sus páginas en la web)',
    'docs/contexto/compartir-en.html': 'el informe en inglés (PDF, y el índice de sus páginas en la web)',
    'scripts/resumen-web.mjs': 'title y meta de la página del resumen ejecutivo (/informe/ y /en/report/)',
    'docs/contexto/resumen.html': 'el resumen ejecutivo (PDF y web)',
    'docs/contexto/resumen-en.html': 'el resumen ejecutivo en inglés (PDF y web)',
    'docs/contexto/taller-v9.html': 'la guía rápida del taller (PDF)',
    'docs/contexto/taller-hoja-equipo.html': 'la hoja del equipo (PDF)',
    'docs/contexto/taller-presentacion/armar-v7.cjs': 'la presentación del taller (PPTX y PDF)',
    'scripts/datos-csv.mjs': 'los CSV de /datos/',
    'docs/contexto/vista-previa.html': 'la imagen para redes de la portada',
    'docs/contexto/vista-previa-pagina.html': 'la imagen para redes de las páginas',
    'public/manifest.webmanifest': 'el manifest',
    'docs/etapa7-difusion.md': 'los borradores de difusión (su PDF lo arma scripts/borradores.mjs)',
  };
  const textoFuente = (ruta) => {
    const t = readFileSync(join(R, ruta), 'utf8');
    if (ruta.endsWith('.md')) return t.slice(t.indexOf('## 3. Borradores'), t.indexOf('## 4. Subir'));
    // en HTML, sin comentarios, salvo el de arriba de docs/paginas/ (el JSON con title y meta)
    if (ruta.endsWith('.html')) return decodificar(t.replace(/<!--([\s\S]*?)-->/g, (m, c) => (/^(meta)?\s*\{/.test(c) ? c : ' ')).replace(/<[^>]+>/g, ' ')).replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
    // (los textos de JS con &nbsp; o \u00a0 se leen con espacios, como en la página)
    if (/\.(m|c)?js$/.test(ruta)) return decodificar(t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')).replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
    return t;
  };
  const fuentes = Object.keys(FUENTES).filter((r) => existsSync(join(R, r))).map((r) => ({ r, n: normal(textoFuente(r)) }));
  // Cómo se muestra cada lugar: las páginas como su dirección, los archivos por su nombre
  const lugar = (d) => {
    const [tipo, ...resto] = d.split(': ');
    let q = resto.join(': ');
    if (tipo === 'sitio') q = q.replace(/(^|\/)index\.html$/, '$1').replace(/^$/, '/');
    return { tipo, q };
  };
  const GRUPOS = [['sitio', 'Sitio'], ['textos', 'Código del sitio'], ['escritorio', 'Escritorio (lo vigente suelto)'], ['borradores', 'Borradores']];
  const filas = [];
  console.log('\nMapa de mensajes clave (dónde aparecen):');
  for (const c of CLAVES) {
    const frases = c.buscar.map(normal);
    const donde = new Set();
    for (const { donde: d, texto } of piezas) {
      const n = normal(texto);
      if (frases.some((f) => n.includes(f))) donde.add(d.split(' (')[0].split(' › ')[0]);
    }
    const lista = [...donde].sort();
    console.log(`\n  ${c.pieza}:\n    ${lista.join('\n    ') || '(en ningún lado)'}`);
    const editar = fuentes.filter(({ n }) => frases.some((f) => n.includes(f))).map(({ r }) => `\`${r}\``);
    const porGrupo = GRUPOS.map(([g, titulo]) => {
      const qs = lista.map(lugar).filter((x) => x.tipo === g).map((x) => x.q)
        .sort((x, y) => (x === '/' ? -1 : y === '/' ? 1 : x.localeCompare(y, 'es')));
      return qs.length ? `**${titulo}:** ${qs.join(', ')}` : '';
    }).filter(Boolean);
    filas.push(`| ${c.pieza} | ${c.es} | ${c.en} | ${editar.join(', ') || '(ninguno)'} | ${porGrupo.join('<br>') || '(en ningún lado)'} |`);
  }
  const hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(new Date());
  const doc = `# Mapa de contenidos: dónde vive cada mensaje

Al día el ${hoy}. Lo escribe solo \`node scripts/revisar-coherencia.mjs --mapa\`
(no se edita a mano: si algo está mal, se corrige en el script).

**Para qué sirve.** Cuando cambia uno de estos mensajes, aquí está cada lugar
donde hay que cambiarlo, en español y en inglés (regla de terminado de
\`CLAUDE.md\`).

**Cómo se lee.** "Se cambia en" es el archivo fuente que se edita. Lo demás
sale de ahí al construir el sitio (\`npm run build\`) o al rehacer el PDF
(\`DOC=<id> node scripts/documento.mjs\`). "Dónde aparece" lo busca el script
en lo que se publica de verdad: el sitio construido (\`dist/\`, con sus PDF, la
presentación del taller y los CSV), los textos del código del sitio (\`src/\`),
lo vigente suelto en \`~/Desktop/Mosca del WIP/\` (menos el Informe completo,
que cuenta la historia) y los borradores de difusión. Las páginas se anotan
por su dirección (\`/\` es la portada, \`/en/\` la portada en inglés).

**Cómo se actualiza.** Después de cambiar un mensaje: construir, rehacer los
PDF que correspondan y correr el comando de arriba. Si una pieza cambió de
texto, se cambian sus frases en \`CLAVES\` del script.

| Pieza | Español | Inglés | Se cambia en | Dónde aparece |
|---|---|---|---|---|
${filas.join('\n')}

Dónde se edita cada archivo fuente:

${Object.entries(FUENTES).map(([r, q]) => `- \`${r}\`: ${q}.`).join('\n')}
`;
  writeFileSync(join(R, 'docs', 'mapa-de-contenidos.md'), doc);
  console.log('\nMapa escrito en docs/mapa-de-contenidos.md');
}

if (hallazgos.length) {
  console.log(`\n✗ ${hallazgos.length} cosa(s) por arreglar. No publicar hasta que esto diga 0.`);
  process.exit(1);
}
console.log('\n✓ Coherencia: 0 frases retiradas, 0 palabras prohibidas, 0 punto y coma, 0 dos puntos, 0 palabras pegadas en los PDF, 0 en nombres y metadatos.');
