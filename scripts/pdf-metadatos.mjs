// Escribe adentro de cada PDF del sitio sus propiedades (Etapa 7, 2026-10-28):
// título, autor, tema, palabras clave e idioma. Son lo que leen los buscadores
// y lo que muestra el visor de PDF en "Propiedades". Usa pdf-lib (una
// biblioteca para leer y escribir PDF desde Node). Se corre después de copiar
// un PDF nuevo a public/: node scripts/pdf-metadatos.mjs
// Con rutas, solo esos PDF (los demás no cambian, ni su fecha):
//   node scripts/pdf-metadatos.mjs public/Mosca-del-WIP-Report.pdf
// Comprobar con: pdfinfo public/Mosca-del-WIP-Informe.pdf
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const AUTOR = 'Felipe Fernández';
const PDFS = [
  {
    ruta: 'public/Mosca-del-WIP-Informe.pdf',
    titulo: 'Mosca del WIP: estar siempre ocupado no es lo mismo que avanzar. Un informe con una mosca real sobre por qué limitar el trabajo en curso',
    tema: 'Por qué conviene limitar el trabajo en curso (WIP): lo que muestra un juego con el cerebro de una mosca real, la ley de Little, la eficiencia de flujo, los estudios con personas y qué pasa con las urgencias. Cuatro pasos para probar un límite con tu equipo.',
    claves: ['límite WIP', 'trabajo en curso', 'work in progress', 'kanban', 'eficiencia de flujo', 'ley de Little', 'multitarea', 'urgencias', 'interrupciones', 'simulación', 'cerebro de mosca', 'Male CNS'],
    idioma: 'es-CL',
  },
  {
    ruta: 'public/Mosca-del-WIP-Report.pdf',
    titulo: 'Mosca del WIP: being busy all the time is not the same as making progress. A report with a real fly brain on why to limit work in progress',
    tema: 'Why it pays to limit work in progress (WIP): what a game with a real fruit fly brain shows, Little’s Law, flow efficiency, the studies with people and what happens with urgent tasks. Four steps to try a limit with your team.',
    claves: ['WIP limit', 'work in progress', 'kanban', 'flow efficiency', "Little's Law", 'multitasking', 'urgent tasks', 'interruptions', 'simulation', 'fruit fly connectome', 'Male CNS'],
    idioma: 'en-US',
  },
  {
    ruta: 'public/taller/Mosca-del-WIP-Taller-Guia-rapida.pdf',
    titulo: 'Deja de empezar, empieza a terminar: guía rápida del facilitador. Taller de 60 minutos para encontrar el límite WIP de tu equipo, con la Mosca del WIP',
    tema: 'La sesión en una hoja (conexión, conceptos, práctica y cierre), qué preparar, el juego en vivo en tres pasos, las preguntas probables, cómo adaptarlo y la hoja del equipo para imprimir. Licencia CC BY 4.0.',
    claves: ['taller límite WIP', 'dinámica límite WIP', 'trabajo en curso', 'kanban', 'juego', 'facilitador', 'equipo', 'CC BY 4.0'],
    idioma: 'es-CL',
  },
  {
    ruta: 'public/taller/Mosca-del-WIP-Taller-Presentacion.pdf',
    titulo: 'Deja de empezar, empieza a terminar: presentación del taller (14 láminas). Taller de 60 minutos para encontrar el límite WIP de tu equipo, con la Mosca del WIP',
    tema: 'Las 14 láminas del taller: la pregunta inicial, los dos días del juego (9 y 2 tareas a la vez), los conceptos con sus preguntas, la práctica con la hoja del equipo y la prueba de dos semanas en el tablero. Licencia CC BY 4.0.',
    claves: ['taller límite WIP', 'presentación', 'trabajo en curso', 'kanban', 'juego', 'equipo', 'CC BY 4.0'],
    idioma: 'es-CL',
  },
  {
    ruta: 'public/taller/Mosca-del-WIP-Taller-Hoja-del-equipo.pdf',
    titulo: 'La hoja del equipo: taller Deja de empezar, empieza a terminar (Mosca del WIP)',
    tema: 'Una hoja para imprimir, una por equipo: cuántas cosas tienen en curso hoy, el límite para partir, qué hacen cuando algo queda esperando, cuántas urgencias llegaron en la semana y la fecha de la revisión a las dos semanas. Licencia CC BY 4.0.',
    claves: ['hoja del equipo', 'límite WIP', 'trabajo en curso', 'kanban', 'taller', 'CC BY 4.0'],
    idioma: 'es-CL',
  },
];

const SOLO = process.argv.slice(2).map((r) => r.replace(/^\.\//, ''));
const fuera = SOLO.filter((r) => !PDFS.some((p) => p.ruta === r));
if (fuera.length) throw new Error(`no conozco ${fuera.join(', ')}: los PDF del sitio son ${PDFS.map((p) => p.ruta).join(', ')}`);
for (const p of PDFS.filter((x) => !SOLO.length || SOLO.includes(x.ruta))) {
  const ruta = join(RAIZ, p.ruta);
  const doc = await PDFDocument.load(readFileSync(ruta), { updateMetadata: false });
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
