// Revisa que todo lo público diga lo mismo (Etapa 8.6, 2026-11-06).
//
// Busca en todo lo que se publica, en español y en inglés:
//   1. las frases retiradas de docs/frases-retiradas.txt,
//   2. las palabras prohibidas ([…], […], […], scrum, sprint, daily, retro),
//   3. el punto y coma en el texto que se lee.
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
import { join, relative, extname } from 'node:path';

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
// solo: 'frases' = revisar solo frases retiradas (lo interno); 'sin-punto-y-coma' = todo menos el punto y coma
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
  if (ext === '.html') pagina(donde, readFileSync(ruta, 'utf8'));
  else if (ext === '.pdf') pdf(donde, ruta);
  else if (ext === '.pptx') pptx(donde, ruta);
  else if (['.webmanifest', '.csv', '.txt', '.xml'].includes(ext)) agregar(donde, readFileSync(ruta, 'utf8'));
  else if (ext === '.json' && statSync(ruta).size < 2e6)
    agregar(donde, textosJson(JSON.parse(readFileSync(ruta, 'utf8'))).join(' · '), ruta.includes(`${DIST}/cerebro/`) ? 'sin-punto-y-coma' : undefined);
}

// 2. Los textos del juego, la portada y los créditos (en el JS del sitio): cada
// texto entre comillas de src/, sin comentarios y sin lo que es código o CSS
function textosDeCodigo(fuente) {
  const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const textos = [];
  for (const m of sinComentarios.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    let t = (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, '0').replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(.)/g, '$1');
    const sinEtiquetas = t.replace(/<[^>]+>/g, ' ');
    const palabras = sinEtiquetas.match(/\p{L}{2,}/gu) ?? [];
    const pareceCodigo = /[{}=]|=>|\w\(\)|^[.#\[]|[a-z-]+\s*:\s*[^;]+;\s*[a-z-]+\s*:/.test(sinEtiquetas);
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
}

const porTipo = (t) => hallazgos.filter((h) => h.tipo === t);
console.log(`\nRevisé ${piezas.length} textos públicos (${new Set(piezas.map((p) => p.donde.split(' (')[0].split(' › ')[0])).size} archivos).`);
for (const tipo of ['frase retirada', 'palabra prohibida', 'punto y coma']) {
  const lista = porTipo(tipo);
  console.log(`\n${tipo === 'frase retirada' ? 'Frases retiradas' : tipo === 'palabra prohibida' ? 'Palabras prohibidas' : 'Punto y coma'}: ${lista.length}`);
  for (const h of lista) console.log(`  ✗ ${h.donde}\n      «${h.que}» … ${h.ver}`);
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
    { pieza: 'Las cuatro ideas', es: '1. Estar siempre ocupado no es avanzar. 2. Un límite bajo, pero no 1. 3. Lo empezado no desaparece. 4. Las urgencias, de a una.',
      en: '1. Being busy all the time isn’t making progress. 2. A low limit, but not 1. 3. What’s started doesn’t disappear. 4. Urgent tasks, one at a time.',
      buscar: ['Un límite bajo, pero no 1', 'A low limit, but not 1', 'Lo empezado no desaparece', 'What’s started doesn’t disappear'] },
    // (8.7) reemplaza a "Lo que busca un límite" de la 8.6. (8.9) En la portada
    // los números son de la mosca y se dice antes de mostrarlos; la primera
    // línea habla de ella ("Termina más, y cada tarea sale antes")
    { pieza: 'Para qué sirve un límite', es: 'En el juego, al limitar sus tareas a la vez, la mosca gana esto. Son sus números, no los de tu equipo. Termina más, y cada tarea sale antes. El trabajo avanza en vez de esperar. Menos sobrecarga. Cuánto gana tu equipo, lo dice su prueba.',
      en: 'In the game, by limiting how many tasks she has at once, the fly gains this. These are her numbers, not your team’s. She finishes more, and each task is done sooner. Work moves forward instead of waiting. Less overload. How much your team gains, its own test will show.',
      buscar: ['Para qué sirve un límite', 'What a limit is for', 'en vez de esperar', 'instead of waiting', 'Cuánto gana', 'How much your team gains', 'How much the team gains'] },
    { pieza: 'Lo que se lleva tu equipo', es: 'Su carga a la vista. Dónde se queda esperando el trabajo. Un límite acordado, escrito en el tablero. Sus propios datos después de dos semanas.',
      en: 'Their load in plain sight. Where the work sits waiting. An agreed limit, written on the board. Their own data after two weeks.',
      buscar: ['carga a la vista', 'load in plain sight', 'límite acordado', 'agreed limit'] },
    { pieza: 'Las preguntas del juego (8.7)', es: 'En la tarjeta: ¿Con cuál crees que termina más? Al fin del día: ¿Y tú, cuántas cosas tienes empezadas hoy?',
      en: 'On the card: Which one do you think she’ll finish more with? At the end of the day: And you, how many things do you have started today?',
      buscar: ['¿Con cuál crees que termina más?', 'Which one do you think she’ll finish more with?', 'cuántas cosas tienes empezadas hoy', 'how many things do you have started today'] },
    // (8.8, 2026-11-09)
    { pieza: 'El recorrido del juego (8.8)', es: '¿Dónde está cada cosa? Aquí mandas tú. El día. Su tablero. Cómo le va. Su cerebro, en vivo. Tus días jugados.',
      en: 'Where is everything? You’re in charge here. The day. Her board. How she’s doing. Her brain, live. Your days played.',
      buscar: ['¿Dónde está cada cosa?', 'Where is everything?', 'Aquí mandas tú', 'You’re in charge here'] },
    { pieza: 'El aviso de la mosca del mapa (8.8)', es: 'Ninguna mosca salió herida ni fue obligada a trabajar de verdad. Salvo la del mapa: a esa le sacaron el sistema nervioso y lo cortaron en 66 láminas.',
      en: 'No fly was harmed or made to do any real work. Except the one in the map: its nervous system was taken out and cut into 66 slices.',
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
    'docs/contexto/compartir.html': 'el informe (PDF y web)',
    'docs/contexto/compartir-en.html': 'el informe en inglés (PDF y web)',
    'scripts/informe-web.mjs': 'title y meta del informe web',
    'docs/contexto/resumen.html': 'el resumen (PDF)',
    'docs/contexto/resumen-en.html': 'el resumen en inglés (PDF)',
    'docs/contexto/taller-v7.html': 'la guía rápida del taller (PDF)',
    'docs/contexto/taller-hoja-equipo.html': 'la hoja del equipo (PDF)',
    'docs/contexto/taller-presentacion/armar-v6.cjs': 'la presentación del taller (PPTX y PDF)',
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
console.log('\n✓ Coherencia: 0 frases retiradas, 0 palabras prohibidas, 0 punto y coma.');
