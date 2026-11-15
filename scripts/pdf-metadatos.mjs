// Escribe adentro de cada PDF del sitio sus propiedades (Etapa 7, 2026-10-28):
// título, autor, tema, palabras clave e idioma. Son lo que leen los buscadores
// y lo que muestra el visor de PDF en "Propiedades". Usa pdf-lib (una
// biblioteca para leer y escribir PDF desde Node). Se corre después de copiar
// un PDF nuevo a public/: node scripts/pdf-metadatos.mjs
// Con rutas, solo esos PDF (los demás no cambian, ni su fecha):
//   node scripts/pdf-metadatos.mjs public/Mosca-del-WIP-Report.pdf
// Comprobar con: pdfinfo public/Mosca-del-WIP-Informe.pdf
//
// Al final, cada PDF que tocó queda linealizado ("optimizado para la web",
// revisión final antes de compartir el sitio, 2026-11-15): el navegador
// muestra la primera página sin esperar a bajar el archivo entero, que en el
// informe son 4 MB. Lo hace qpdf (instalarlo una vez con "brew install
// qpdf"), porque pdf-lib guarda el PDF sin linealizar. qpdf no cambia lo que
// se ve ni las propiedades (título, autor, tema, palabras clave, idioma) y
// suma unos pocos KB. Si qpdf no está, el script se detiene con un aviso
// antes de tocar ningún PDF. pdfinfo dice entonces "Optimized: yes". Como
// pdf-lib pierde las propiedades de un PDF linealizado al leerlo (también la
// fecha de creación), si el PDF ya lo está, qpdf lo deja normal antes de
// leerlo. Así el script se puede correr las veces que haga falta.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const AUTOR = 'Felipe Fernández';
// qpdf, el que deja cada PDF linealizado (primero el del PATH y después los
// lugares donde lo deja Homebrew)
const QPDF = ['qpdf', '/opt/homebrew/bin/qpdf', '/usr/local/bin/qpdf'].find((q) => {
  try {
    execFileSync(q, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
});
if (!QPDF) {
  console.error('Falta qpdf, que deja cada PDF optimizado para la web (linealizado). Instalarlo una vez con "brew install qpdf" y volver a correr. No se tocó ningún PDF.');
  process.exit(1);
}
const PDFS = [
  {
    ruta: 'public/Mosca-del-WIP-Informe.pdf',
    titulo: 'Mosca del WIP. Estar siempre ocupado no es lo mismo que avanzar. Un informe con una mosca real sobre por qué limitar el trabajo en curso',
    tema: 'Por qué conviene limitar el trabajo en curso (WIP). Lo que muestra un juego con el cerebro de una mosca real, la ley de Little, la eficiencia de flujo, los estudios con personas y qué pasa con las urgencias. Cuatro pasos para probar un límite con tu equipo.',
    claves: ['límite WIP', 'trabajo en curso', 'work in progress', 'kanban', 'eficiencia de flujo', 'ley de Little', 'multitarea', 'urgencias', 'interrupciones', 'simulación', 'cerebro de mosca', 'Male CNS'],
    idioma: 'es-CL',
  },
  {
    ruta: 'public/Mosca-del-WIP-Report.pdf',
    titulo: 'Mosca del WIP. Being busy all the time is not the same as making progress. A report with a real fly brain on why to limit work in progress',
    tema: 'Why it pays to limit work in progress (WIP). What a game with a real fruit fly brain shows, Little’s Law, flow efficiency, the studies with people and what happens with urgent tasks. Four steps to try a limit with your team.',
    claves: ['WIP limit', 'work in progress', 'kanban', 'flow efficiency', "Little's Law", 'multitasking', 'urgent tasks', 'interruptions', 'simulation', 'fruit fly connectome', 'Male CNS'],
    idioma: 'en-US',
  },
  // Etapa 8.6 (2026-11-06): el resumen de 4 páginas, en español e inglés. Desde la 8.7 (2026-11-07), en prosa y con el título nuevo.
  // Desde la 8.11 (2026-11-12): el resumen ejecutivo, de 2 páginas, un PDF aparte del informe (sus claves son las cosas que nombra)
  {
    ruta: 'public/Mosca-del-WIP-Resumen.pdf',
    titulo: 'Mosca del WIP. Ocupado todo el día. ¿Y qué terminaste? Resumen ejecutivo',
    tema: 'Resumen ejecutivo de dos páginas de la Mosca del WIP, un juego de un minuto con una mosca de cerebro real. Qué ganó la mosca al limitar su trabajo en curso, lo que encontró la simulación de 1 a 10 tareas a la vez, qué dicen los estudios con personas, lo que se lleva tu equipo y cuatro pasos para probar un límite.',
    claves: ['resumen ejecutivo', 'límite WIP', 'trabajo en curso', 'work in progress', 'kanban', 'ley de Little', 'límite sostenible', 'urgencias', 'simulación', 'cerebro de mosca', 'Male CNS'],
    idioma: 'es-CL',
  },
  {
    ruta: 'public/Mosca-del-WIP-Summary.pdf',
    titulo: 'Mosca del WIP. Busy all day. So what did you finish? Executive summary',
    tema: 'A two-page executive summary of Mosca del WIP, a one-minute game with a real fly brain. What the fly gained by limiting her work in progress, what the simulation from 1 to 10 tasks at once found, what studies with people say, what your team takes away and four steps to try a limit.',
    claves: ['executive summary', 'WIP limit', 'work in progress', 'kanban', "Little's Law", 'sustainable limit', 'urgent tasks', 'simulation', 'fruit fly connectome', 'Male CNS'],
    idioma: 'en-US',
  },
  {
    ruta: 'public/taller/Mosca-del-WIP-Taller-Guia-rapida.pdf',
    titulo: 'Deja de empezar, empieza a terminar. Guía rápida del facilitador del taller de 60 minutos para encontrar el límite WIP de tu equipo, con la Mosca del WIP',
    tema: 'La sesión en una hoja (conexión, conceptos, práctica y cierre), qué preparar, el juego en vivo en tres pasos, las preguntas probables, cómo adaptarlo y la hoja del equipo para imprimir. Licencia CC BY 4.0.',
    claves: ['taller límite WIP', 'dinámica límite WIP', 'trabajo en curso', 'kanban', 'juego', 'facilitador', 'equipo', 'CC BY 4.0'],
    idioma: 'es-CL',
  },
  {
    ruta: 'public/taller/Mosca-del-WIP-Taller-Presentacion.pdf',
    titulo: 'Deja de empezar, empieza a terminar. Presentación (14 láminas) del taller de 60 minutos para encontrar el límite WIP de tu equipo, con la Mosca del WIP',
    tema: 'Las 14 láminas del taller, con la pregunta inicial, los dos días del juego (9 y 2 tareas a la vez), los conceptos con sus preguntas, la práctica con la hoja del equipo y la prueba de dos semanas en el tablero. Licencia CC BY 4.0.',
    claves: ['taller límite WIP', 'presentación', 'trabajo en curso', 'kanban', 'juego', 'equipo', 'CC BY 4.0'],
    idioma: 'es-CL',
  },
  {
    ruta: 'public/taller/Mosca-del-WIP-Taller-Hoja-del-equipo.pdf',
    titulo: 'La hoja del equipo del taller Deja de empezar, empieza a terminar (Mosca del WIP)',
    tema: 'Una hoja para imprimir, una por equipo, con cuántas cosas tienen en curso hoy, el límite para partir, qué hacen cuando algo queda esperando, cuántas urgencias llegaron en la semana y la fecha de la revisión a las dos semanas. Licencia CC BY 4.0.',
    claves: ['hoja del equipo', 'límite WIP', 'trabajo en curso', 'kanban', 'taller', 'CC BY 4.0'],
    idioma: 'es-CL',
  },
];

const SOLO = process.argv.slice(2).map((r) => r.replace(/^\.\//, ''));
const fuera = SOLO.filter((r) => !PDFS.some((p) => p.ruta === r));
if (fuera.length) throw new Error(`no conozco ${fuera.join(', ')}: los PDF del sitio son ${PDFS.map((p) => p.ruta).join(', ')}`);
const TOCAR = PDFS.filter((x) => !SOLO.length || SOLO.includes(x.ruta));
for (const p of TOCAR) {
  const ruta = join(RAIZ, p.ruta);
  // pdf-lib pierde las propiedades (y con ellas la fecha de creación) cuando
  // lee un PDF que ya está linealizado. Si lo está, qpdf lo entrega normal
  // antes de leerlo, sin cambiar nada más. Al final se vuelve a linealizar.
  const yaLineal = !execFileSync(QPDF, ['--check-linearization', ruta], { encoding: 'utf8' }).includes('is not linearized');
  const entrada = yaLineal ? execFileSync(QPDF, [ruta, '-'], { maxBuffer: 256 << 20 }) : readFileSync(ruta);
  const doc = await PDFDocument.load(entrada, { updateMetadata: false });
  doc.setTitle(p.titulo, { showInWindowTitleBar: true });
  doc.setAuthor(AUTOR);
  doc.setSubject(p.tema);
  doc.setKeywords([p.claves.join(', ')]); // separadas por coma (pdf-lib las uniría con espacios)
  doc.setCreator('Mosca del WIP (mosca.deliverycraft.ai)');
  doc.setProducer('Chromium + pdf-lib');
  doc.setModificationDate(new Date());
  // El idioma del documento (lo leen los lectores de pantalla y los buscadores)
  doc.catalog.set(PDFName.of('Lang'), PDFString.of(p.idioma));
  const bytes = await doc.save();
  writeFileSync(ruta, bytes);
  console.log(`${p.ruta}: ${(bytes.length / 1048576).toFixed(1)} MB · ${p.idioma} · "${p.titulo.slice(0, 60)}…"`);
}

// Al final, linealizar cada PDF que se tocó y comprobarlo (si qpdf avisa
// algo, el script se detiene y lo muestra). --check-linearization termina
// bien aunque el PDF no esté linealizado, así que se lee lo que responde.
for (const p of TOCAR) {
  const ruta = join(RAIZ, p.ruta);
  const antes = statSync(ruta).size;
  try {
    execFileSync(QPDF, ['--linearize', '--deterministic-id', ruta, '--replace-input'], { stdio: 'pipe' });
    execFileSync(QPDF, ['--check', ruta], { stdio: 'pipe' });
    const lineal = execFileSync(QPDF, ['--check-linearization', ruta], { encoding: 'utf8', stdio: 'pipe' });
    if (!lineal.includes('no linearization errors')) throw new Error(lineal);
  } catch (e) {
    console.error(`qpdf no pudo linealizar ${p.ruta}:\n${(e.stderr || e.stdout || e.message).toString().trim()}`);
    process.exit(1);
  }
  console.log(`${p.ruta}: linealizado (${Math.round(antes / 1024)} → ${Math.round(statSync(ruta).size / 1024)} KB)`);
}
