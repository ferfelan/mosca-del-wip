// Presentación del taller "Deja de empezar, empieza a terminar" (v8, revisión final v3, 2026-11-15).
// La v8 es la v7 (armar-v7.cjs, que se guarda tal cual) con lo que aprobó Felipe de la revisión
// final v2. M13, la lámina 10 y su nota dicen "En un equipo pueden ser días." (antes "son días",
// que sonaba a medido). M18, todo el texto de las láminas, las notas, los gráficos y los
// patrones queda marcado como español de Chile (es-CL). pptxgenjs 4.0.1 no usa pres.lang y
// marcaba todo como inglés (en-US), así que en PowerPoint casi todas las palabras salían
// subrayadas en rojo. Se cambia al final, dentro del .pptx (marcarEspanol). Y el tema del
// archivo (Propiedades) dice "Presentación del taller de 60 minutos" en vez de "(versión 7)".
// Las 14 láminas, su orden, los números, las fotos y la duración son los de la v7. Se arma con
//   NODE_PATH=node_modules node docs/contexto/taller-presentacion/armar-v8.cjs
// Sale "2026-11-15 Taller - Presentación v8.pptx" en ~/Desktop/Mosca del WIP/. Lo que sigue es
// el comentario de la v7.
// (Etapa 8.12 v7, 2026-11-13.)
// La v7 es la v6 (armar-v6.cjs, que se guarda tal cual) sin dos puntos en lo que se lee, ni en
// las láminas ni en las notas del presentador (Felipe, 13 nov. 2026, "elimina los : en todos
// lados"). Quedan solo los de una hora (13:30). Cada caso se resolvió con una coma, un punto,
// una palabra que une o una frase ("Después preguntas", "En la línea 2 dices"). La lámina 11
// dice lo mismo que la hoja del equipo v6 ("Nuestro límite para partir es ___", "vamos a ___").
// Las 14 láminas, su orden, los números, las fotos y la duración son los de la v6. Se arma con
//   NODE_PATH=node_modules node docs/contexto/taller-presentacion/armar-v7.cjs
// Sale "2026-11-13 Taller - Presentación v7.pptx" en ~/Desktop/Mosca del WIP/. Lo que sigue es
// el comentario de la v6.
// (Etapa 8.6 v6, 2026-11-06.)
// La v6 es la v5 (armar-v5.cjs, que se guarda tal cual) sin punto y coma en lo que se publica:
// el crédito del Male CNS de la lámina 14 ("FlyEM de HHMI Janelia, la Universidad de Cambridge,
// el MRC Laboratory of Molecular Biology y Google Research") y dos notas de la lámina 11. Y cada
// imagen lleva su texto alternativo (altText): sin él, pptxgenjs guardaba como descripción la
// ruta del archivo en este computador, que no debe salir publicada. Nada más cambia: las láminas, el guion, la duración y las fotos son las de la v5 (la presentación no
// usaba el mensaje viejo de la portada). Se arma con:
//   NODE_PATH=node_modules node docs/contexto/taller-presentacion/armar-v6.cjs
// Sale "2026-11-06 Taller - Presentación v6.pptx" en ~/Desktop/Mosca del WIP/. Lo que sigue es
// el comentario de la v5.
// (Etapa 8.5 v5, 2026-11-04.)
// La v5 es la v4 (armar-v4.cjs, que se guarda tal cual) con las notas puestas al día con el juego
// de hoy: desde la 8.1 en Exhibición no hay tarjeta de inicio (el día parte con Espacio) y
// tras R el día nuevo parte solo. Las láminas no cambian (las fotos de la oficina no muestran
// nada viejo). Se arma con: NODE_PATH=node_modules node docs/contexto/taller-presentacion/armar-v5.cjs
// Sale "2026-11-04 Taller - Presentación v5.pptx" en ~/Desktop/Mosca del WIP/. Lo que sigue es
// el comentario de la v4.
// (Etapa 6.0 v4, 2026-10-28.)
// La v4 parte de la v3 (armar-v3.cjs, que se guarda tal cual) con lo que pidió Felipe: la lámina
// 5 rehecha con dos tarjetas grandes y centradas, una por día, cada una con la foto de su día
// (9 y 2 tareas a la vez); la lámina 12 sin la tabla de las dos semanas (la prueba vive en el
// tablero de siempre, con Por hacer, En curso y Hecho, igual que en el juego), en tres tarjetas
// iguales; la pregunta de la lámina 8 en su caja, como en las otras ideas; la lámina 11 usando
// todo el alto; y ninguna mención a una tabla en las notas. Lo que sigue es de la v3:
// 14 láminas 16:9 en PowerPoint editable (se abre en Keynote y Google Slides), una idea por
// lámina, más visual y con menos texto que la v2: letra grande (texto principal de 24 pt o
// más) y alto contraste, para leerla desde el fondo de la sala. Las notas del presentador
// se quedan, cortas. Sigue el orden de la guía rápida (docs/contexto/taller-v4.html): la
// guía dice "lámina N" y aquí N es exactamente esa lámina.
//   1 portada · 2 lo que se llevan hoy · 3 ¿cuántas cosas tienes en curso hoy? (con la foto del
//   tablero lleno, sin post-it) · 4 el juego en vivo, dos días · 5 ¿a cuál de los dos días se
//   parece su semana? · 6 el promedio de 200 días · 7 a 10 las cuatro ideas · 11 la hoja del
//   equipo · 12 la prueba vive en su tablero de siempre · 13 el cierre · 14 el juego, el
//   informe y los créditos.
// Término genérico cuando se habla del equipo: "cosas en curso" / "trabajo en curso"; "tareas"
// solo cuando se habla de la mosca, porque así lo dice el juego.
// La v3 (armar-v3.cjs), la v2 (armar-v2.cjs) y la v1 (armar.cjs) se guardan tal cual.
// Letras: Lora (títulos) y Figtree (texto), las dos de Google Fonts (OFL): Google Slides las trae;
// en PowerPoint y Keynote hay que tenerlas instaladas (en este Mac están en ~/Library/Fonts).
// Tema: docs/contexto/tema-mosca.md (blanco, tinta #1d2532, teal #2f7579, papel #f3efe7).
// Se arma con (pptxgenjs está en node_modules del repo, instalado con --no-save):
//   NODE_PATH=node_modules node docs/contexto/taller-presentacion/armar-v4.cjs
// Sale "2026-10-28 Taller - Presentación v4.pptx" en ~/Desktop/Mosca del WIP/.
// Después: validar, convertir a PDF con a-pdf.sh y mirar cada lámina (ver docs/etapa6-0-v4.md).
const path = require('node:path');
const os = require('node:os');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');
const fs = require('node:fs');
const { applyTheme } = require(path.join(os.homedir(), '.claude/skills/synced/9dc43800-5819-4ce7-8c29-f48b447a1e71_7effb68f-fc54-42de-a806-382cfa514daf/pptx/scripts/apply_theme.js'));

const REPO = path.resolve(__dirname, '../../..');
const IMG = path.join(REPO, 'docs/contexto/img');
const FECHA = process.env.FECHA || '2026-11-15';
const VERSION = process.env.VERSION || 'v8';
const SALIDA = path.join(os.homedir(), 'Desktop/Mosca del WIP', `${FECHA} Taller - Presentación ${VERSION}.pptx`);

// ---------- Números oficiales (corrida semilla 2024, 200 días; docs/corrida-oficial.json) ----------
const LIMITES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const TERMINADAS = [15.9, 18.0, 16.9, 15.4, 14.0, 12.3, 11.2, 10.0, 9.1, 8.2];
const SIN_ESPERAS = [21.2, 18.0, 16.6, 15.1, 13.8, 12.2, 10.9, 9.8, 9.1, 8.2]; // Etapa 4.2, ninguna tarea se traba
// 10 tareas desde las 09:00 y a las 12:00 baja a 2: tareas abiertas cada 15 minutos (promedio de 200 días)
const BAJAR = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 8.8, 8.05, 7.11, 6.15, 5.63, 4.93, 4.31, 3.81, 3.31, 2.88, 2.56, 2.29, 2.13, 2.06, 2.03, 2, 2, 2, 2, 2, 2, 2, 2, 2];
const HORAS = BAJAR.map((_, i) => (i % 4 === 0 ? `${9 + i / 4}:00` : ''));

// ---------- El tema: los colores de los informes (docs/contexto/tema-mosca.md) ----------
const HEX = {
  tinta: '1d2532', blanco: 'FFFFFF', suave: '5b6472', papel: 'f3efe7', teal: '2f7579', verde: '4f9d6a',
  rojo: 'cc4a43', ambar: 'e08a3c', tealClaro: '8fd3d6', naranjo: 'b35a1d', linea: 'e2ddd2', tealSuave: '9dc3c5',
  grisBarra: 'e8e4dc', verdeClaro: 'e6f2ea',
};
const THEME = {
  name: 'Mosca del WIP',
  headFontFace: 'Lora',
  bodyFontFace: 'Figtree',
  colors: {
    dk1: HEX.tinta, lt1: HEX.blanco, dk2: HEX.suave, lt2: HEX.papel,
    accent1: HEX.teal, accent2: HEX.verde, accent3: HEX.rojo, accent4: HEX.ambar, accent5: HEX.tealClaro, accent6: HEX.naranjo,
    hlink: HEX.teal, folHlink: HEX.suave,
  },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13,33 × 7,5 pulgadas
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = 'Felipe Fernández';
pres.company = 'mosca.deliverycraft.ai';
pres.title = 'Deja de empezar, empieza a terminar. Taller de 60 minutos con la Mosca del WIP';
pres.subject = 'Presentación del taller de 60 minutos';
pres.lang = 'es-CL';
const C = pres.SchemeColor;

const ANCHO = 13.333;
const MARGEN = 0.7;
const PIE = 'Deja de empezar, empieza a terminar · un taller con la Mosca del WIP';

// ---------- Los marcos (layouts): claro, claro con título grande, oscuro, oscuro grande y portada ----------
function marco(nombre, oscuro, grande) {
  const fondo = oscuro ? HEX.tinta : HEX.blanco;
  const tinta = oscuro ? C.background2 : C.text1;
  const gris = oscuro ? 'a8b0ba' : C.text2;
  const kicker = oscuro ? C.accent5 : C.accent1;
  pres.defineSlideMaster({
    title: nombre,
    background: { color: fondo },
    margin: [0.5, MARGEN, 0.6, MARGEN],
    objects: [
      { placeholder: { options: { name: 'kicker', type: 'body', x: MARGEN, y: 0.45, w: ANCHO - 2 * MARGEN, h: 0.4, fontSize: 17, color: kicker, margin: 0, valign: 'top' }, text: 'Momento de la sesión' } },
      { placeholder: { options: { name: 'title', type: 'title', x: MARGEN, y: 0.9, w: grande ? 11.4 : ANCHO - 2 * MARGEN, h: grande ? 2.7 : 1.05, fontSize: grande ? 48 : 38, bold: true, color: tinta, margin: 0, valign: 'top', align: 'left' }, text: 'Título' } },
      { text: { text: PIE, options: { x: MARGEN, y: 7.02, w: 9, h: 0.3, fontSize: 11, color: gris, margin: 0, align: 'left' } } },
    ],
    slideNumber: { x: ANCHO - MARGEN - 0.8, y: 7.02, w: 0.8, h: 0.3, fontSize: 11, color: gris, align: 'right' },
  });
}
marco('CLARA', false, false);
marco('CLARA_GRANDE', false, true);
marco('OSCURA', true, false);
marco('OSCURA_GRANDE', true, true);
pres.defineSlideMaster({ title: 'PORTADA', background: { color: HEX.blanco }, objects: [] });

// ---------- Ayudas ----------
const texto = (slide, t, o) => slide.addText(t, { isTextBox: true, margin: 0, valign: 'top', align: 'left', color: C.text1, fontSize: 22, ...o });
const sombra = () => ({ type: 'outer', color: '000000', blur: 6, offset: 2, angle: 90, opacity: 0.16 });
const subrayado = (n) => '_'.repeat(n);
// Las notas del presentador: cortas, cuánto dura y qué dices
const nota = (slide, lineas) => slide.addNotes([].concat(lineas).join('\n\n'));
// La pregunta para la sala: una caja papel con la pregunta en Lora, igual en todas las ideas
const pregunta = (slide, t, { x, y, w, h = 1.3, fontSize = 22 }) => {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: 'Pregunta para la sala' });
  texto(slide, 'Pregunta para la sala', { x: x + 0.25, y: y + 0.14, w: w - 0.5, h: 0.3, fontSize: 13, color: C.text2 });
  texto(slide, t, { x: x + 0.25, y: y + 0.46, w: w - 0.5, h: h - 0.56, fontSize, fontFace: 'Lora', color: C.accent1, valign: 'top' });
};
// La misma pregunta en una franja baja de todo el ancho, cuando la lámina no tiene columna al lado
const preguntaLinea = (slide, t, { x, y, w, h = 0.78, fontSize = 24 }) => {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: 'Pregunta para la sala' });
  texto(slide, 'Pregunta para la sala', { x: x + 0.3, y, w: 2.4, h, fontSize: 13, color: C.text2, valign: 'middle' });
  texto(slide, t, { x: x + 2.75, y, w: w - 3.05, h, fontSize, fontFace: 'Lora', color: C.accent1, valign: 'middle' });
};
let numero = 0;
function lamina(masterName, sectionTitle, kicker, titulo) {
  numero++;
  const s = pres.addSlide({ masterName, sectionTitle });
  if (kicker !== null) s.addText(kicker, { placeholder: 'kicker' });
  s.addText(titulo, { placeholder: 'title' });
  return s;
}

// =====================================================================================
pres.addSection({ title: 'Inicio' });

// ---------- 1 · Portada: la escena del juego y una tarjeta blanca con el nombre ----------
{
  const s = pres.addSlide({ masterName: 'PORTADA', sectionTitle: 'Inicio' });
  numero++;
  // La foto llena la lámina y va corrida a la izquierda, para que la tarjeta no tape el tablero
  s.addImage({ path: path.join(IMG, 'escena-wip9.jpg'), x: -1.2, y: -0.79, w: 14.53, h: 9.08, objectName: 'La mosca en su oficina con 9 tareas a la vez', altText: 'La mosca en su oficina con 9 tareas a la vez' });
  s.addShape(pres.ShapeType.roundRect, { x: 7.4, y: 0.75, w: 5.3, h: 6.0, fill: { color: HEX.blanco }, line: { color: HEX.blanco, width: 0 }, rectRadius: 0.12, shadow: sombra(), objectName: 'Tarjeta del nombre' });
  texto(s, 'Un taller de 60 minutos', { x: 7.8, y: 1.15, w: 4.6, h: 0.4, fontSize: 16, color: C.accent1 });
  texto(s, 'Deja de empezar, empieza a terminar', { x: 7.8, y: 1.65, w: 4.6, h: 2.5, fontSize: 34, fontFace: 'Lora', bold: true, color: C.text1 });
  texto(s, 'Para encontrar el límite de trabajo en curso de tu equipo, con la Mosca del WIP', { x: 7.8, y: 3.75, w: 4.5, h: 1.2, fontSize: 18, color: C.text2 });
  texto(s, [
    { text: 'Felipe Fernández · mosca.deliverycraft.ai', options: { breakLine: true } },
    { text: 'Se puede usar y adaptar · CC BY 4.0' },
  ], { x: 7.8, y: 5.85, w: 4.6, h: 0.7, fontSize: 12, color: C.text2 });
  nota(s, [
    'Queda puesta mientras llega la gente. No hace falta presentarla.',
    'Ten el juego abierto en otra ventana, en la vista Exhibición (tecla E) y con 9 tareas a la vez elegidas (tecla 9), sin empezar. En Exhibición no aparece la tarjeta de inicio. Cuando estén todos, pasa a la lámina 2.',
  ]);
}

// =====================================================================================
pres.addSection({ title: 'Parte 1 · Conexión' });

// ---------- 2 · Lo que se llevan hoy ----------
{
  const s = lamina('CLARA', 'Parte 1 · Conexión', 'Para empezar · 1 minuto', 'Hoy salen con tres cosas escritas');
  const cosas = ['Su límite de cosas en curso', 'Qué hacen cuando algo queda esperando', 'Una prueba de dos semanas, con fecha de revisión'];
  cosas.forEach((c, i) => {
    const y = 2.3 + i * 1.4;
    texto(s, String(i + 1), { x: MARGEN, y, w: 0.9, h: 1.0, fontSize: 40, fontFace: 'Lora', color: C.accent1, bold: true });
    texto(s, c, { x: MARGEN + 1.1, y: y + 0.12, w: 10.8, h: 1.0, fontSize: 30, color: C.text1 });
    if (i < cosas.length - 1) s.addShape(pres.ShapeType.line, { x: MARGEN, y: y + 1.2, w: ANCHO - 2 * MARGEN, h: 0, line: { color: HEX.linea, width: 0.75 } });
  });
  texto(s, 'Todo lo demás es para llegar ahí.', { x: MARGEN, y: 6.4, w: 11, h: 0.45, fontSize: 20, color: C.text2 });
  nota(s, [
    '1 minuto. Es lo primero que dices en la sala, sin presentarte largo.',
    '"Hoy salen con tres cosas escritas, que son su límite de cosas en curso, qué van a hacer cuando algo quede esperando y una prueba de dos semanas con fecha. Todo lo demás es para llegar ahí."',
  ]);
}

// ---------- 3 · ¿Cuántas cosas tienes en curso hoy? (con la foto del tablero lleno) ----------
{
  const s = lamina('CLARA', 'Parte 1 · Conexión', 'Antes de jugar · 3 minutos', '¿Cuántas cosas tienes en curso hoy?');
  texto(s, [
    { text: 'Cuenta lo que pondrías como una tarjeta en tu tablero, por ejemplo una tarea, un requerimiento, un caso o un proyecto.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 10 } },
    { text: 'No cada correo ni cada subtarea.', options: { breakLine: true, color: C.text2 } },
  ], { x: MARGEN, y: 2.25, w: 6.3, h: 2.6, fontSize: 24 });
  texto(s, 'A mano alzada, ¿quién tiene más de cinco?', { x: MARGEN, y: 5.1, w: 6.3, h: 1.2, fontSize: 26, fontFace: 'Lora', color: C.accent1, bold: true });
  // El tablero de la mosca con 9 cosas en curso: la foto del juego a las 13:30
  const w = 5.2;
  const h = w * 1120 / 1520;
  s.addImage({ path: path.join(IMG, 'tablero-lleno.jpg'), x: ANCHO - MARGEN - w, y: 2.2, w, h, shadow: sombra(), objectName: 'El tablero de la mosca con 9 tareas en curso', altText: 'El tablero de la mosca con 9 tareas en curso' });
  texto(s, 'El tablero de la mosca a las 13:30, con 9 tareas en curso.', { x: ANCHO - MARGEN - w, y: 2.2 + h + 0.15, w, h: 0.4, fontSize: 15, color: C.text2 });
  nota(s, [
    '3 minutos. Se responde en voz alta o a mano alzada. Preguntas "¿Quién tiene más de cinco?". Nadie anota nada, porque el conteo del equipo se hace en la práctica, sobre su tablero.',
    'Si preguntan qué contar, es lo que pondrían como una tarjeta en su tablero (una tarea, un requerimiento, un caso o un proyecto, según el equipo), no cada correo ni cada subtarea.',
  ]);
}

// ---------- 4 · El juego en vivo: dos días ----------
{
  const s = lamina('CLARA', 'Parte 1 · Conexión', 'El juego en vivo · 5 minutos', 'Dos días de la misma mosca, en vivo');
  const dias = [
    { x: MARGEN, foto: 'escena-wip9.jpg', titulo: 'Día 1 · 9 tareas a la vez' },
    { x: 6.85, foto: 'escena-wip2.jpg', titulo: 'Día 2 · 2 tareas a la vez' },
  ];
  dias.forEach((d) => {
    const w = 5.8;
    s.addImage({ path: path.join(IMG, d.foto), x: d.x, y: 2.0, w, h: 3.2, sizing: { type: 'cover', w, h: 3.2 }, shadow: sombra(), objectName: `La oficina, ${d.titulo}`, altText: `La oficina, ${d.titulo}` });
    texto(s, d.titulo, { x: d.x, y: 5.3, w, h: 0.45, fontSize: 22, bold: true, color: C.text1 });
  });
  texto(s, 'Miren el estado de la mosca, los papelitos del monitor, la pila de carpetas y el cenicero.', { x: MARGEN, y: 5.9, w: 12.0, h: 0.45, fontSize: 20, color: C.text1 });
  texto(s, 'Un día de oficina dura un minuto. Cada cigarro son ocho minutos sin trabajar.', { x: MARGEN, y: 6.38, w: 12.0, h: 0.45, fontSize: 18, color: C.text2 });
  nota(s, [
    '5 minutos. Muestra esta lámina un momento y pasa al juego proyectado, a velocidad normal (un minuto por día). El día 1 va con 9 (Espacio, porque en Exhibición no hay tarjeta de inicio) y el día 2 con 2 (tecla 2 y después R, que parte solo, sin Espacio). Al final, lee la comparación de los dos días que muestra el juego, con las terminadas, el tiempo por tarea y los cigarros.',
    'En el día 1 dices "Esta mosca trabaja con un tablero que tiene por hacer, en curso y hecho. Hoy tiene 9 tareas a la vez. Miren cómo cambia su estado." En el día 2, "Misma mosca, mismo día, 2 tareas a la vez."',
    'Si un día sale raro (con 9 terminó más que con 2), dilo tal cual, porque un día no prueba nada y la lámina 6 tiene el promedio de 200 días. Sin internet, cuenta el día con estas dos fotos.',
  ]);
}

// ---------- 5 · ¿A cuál de los dos días se parece su semana? (rehecha en la v4) ----------
// Dos tarjetas grandes, iguales y centradas, una por día, que usan todo el ancho. Cada una con
// la foto de su día (recortes de escena-wip9.jpg y escena-wip2.jpg, sin el letrero de la pared)
// y los dos con los mismos colores: la lámina no dice cuál día es el bueno, eso lo dice la sala.
{
  const s = lamina('CLARA', 'Parte 1 · Conexión', 'Después del juego · 1 minuto', '¿A cuál de los dos días se parece su semana?');
  const SEP = 0.4;
  const w = (ANCHO - 2 * MARGEN - SEP) / 2;
  const y = 1.95;
  const h = 4.3;
  const dias = [
    { foto: 'taller-dia-9.jpg', dia: 'Día 1', tareas: '9 tareas a la vez' },
    { foto: 'taller-dia-2.jpg', dia: 'Día 2', tareas: '2 tareas a la vez' },
  ];
  dias.forEach((d, i) => {
    const x = MARGEN + i * (w + SEP);
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.1, objectName: `Tarjeta ${d.dia}` });
    const pad = 0.2;
    const fw = w - 2 * pad;
    s.addImage({ path: path.join(IMG, d.foto), x: x + pad, y: y + pad, w: fw, h: 2.85, objectName: `La oficina de la mosca, ${d.dia}, ${d.tareas}`, altText: `La oficina de la mosca, ${d.dia}, ${d.tareas}` });
    texto(s, d.dia, { x: x + pad, y: y + 3.17, w: fw, h: 0.34, fontSize: 16, color: C.accent1, align: 'center', bold: true });
    texto(s, d.tareas, { x: x + pad, y: y + 3.52, w: fw, h: 0.6, fontSize: 30, fontFace: 'Lora', bold: true, color: C.text1, align: 'center' });
  });
  texto(s, 'Mano alzada por cada día.', { x: MARGEN, y: 6.48, w: ANCHO - 2 * MARGEN, h: 0.42, fontSize: 20, color: C.text2, align: 'center' });
  nota(s, [
    '1 minuto. Mano alzada por cada día, o dos o tres respuestas en voz alta.',
    'No comentes todavía. Los conceptos vienen ahora.',
  ]);
}

// =====================================================================================
pres.addSection({ title: 'Parte 2 · Conceptos' });

// ---------- 6 · El promedio de 200 días ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'En el juego, en promedio · 3 minutos', 'Con 2 tareas a la vez termina 18.\nCon 9, la mitad.');
  const colores = TERMINADAS.map((_, i) => (i === 1 ? HEX.verde : i >= 7 ? HEX.rojo : HEX.teal));
  s.addChart(pres.ChartType.bar, [{ name: 'Terminadas en el día', labels: LIMITES, values: TERMINADAS }], {
    x: MARGEN, y: 2.2, w: 8.3, h: 4.6, barDir: 'col', barGapWidthPct: 45,
    chartColors: colores,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', dataLabelFontFace: '+mn-lt', dataLabelFontSize: 16, dataLabelColor: HEX.tinta,
    catAxisLabelFontFace: '+mn-lt', catAxisLabelFontSize: 16, catAxisLabelColor: HEX.tinta, catAxisLineShow: true,
    showCatAxisTitle: true, catAxisTitle: 'Tareas a la vez (el límite)', catAxisTitleFontFace: '+mn-lt', catAxisTitleFontSize: 15, catAxisTitleColor: HEX.tinta,
    valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 21, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
    showLegend: false, showTitle: false,
    objectName: 'Terminadas en el día según el límite, promedio de 200 días',
  });
  texto(s, [
    { text: 'Terminadas en el día, promedio de 200 días del juego por cada límite.', options: { breakLine: true, color: C.text1 } },
    { text: ' ', options: { breakLine: true, fontSize: 10 } },
    { text: 'El verde es el límite con el que termina más. Con los rojos termina el día colapsada.', options: { color: C.text2, fontSize: 17 } },
  ], { x: 9.3, y: 2.25, w: 3.3, h: 2.8, fontSize: 19 });
  pregunta(s, '¿Dónde pondrían a su equipo, del 1 al 10?', { x: 9.3, y: 5.0, w: 3.3, h: 1.8 });
  nota(s, [
    '3 minutos. Primera de cinco láminas, tres minutos cada una, cada una con su pregunta. Di lo justo y pregunta.',
    '"Un día no prueba nada. Este es el promedio de 200 días del juego con cada límite, de 1 a 10. Con 2 tareas a la vez la mosca termina 18 en el día. Con 9, la mitad, y está ocupada todo el día."',
    'Después preguntas "¿Dónde pondrían a su equipo, del 1 al 10?"',
  ]);
}

// ---------- 7 · Idea 1: qué es WIP y qué es un límite ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'Idea 1 · 3 minutos', 'WIP es trabajo en curso, lo que ya empezaste y no has terminado');
  texto(s, [
    { text: 'Un límite de WIP es un número que dice cuántas cosas pueden estar en curso a la vez.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 10 } },
    { text: 'Al llegar al número, no se empieza otra hasta terminar una.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 10 } },
    { text: 'Es lo que le pusimos a la mosca.', options: { color: C.text2 } },
  ], { x: MARGEN, y: 2.4, w: 5.5, h: 2.7, fontSize: 23 });
  pregunta(s, '¿Cuántas tarjetas hay hoy en su columna En curso?', { x: MARGEN, y: 5.15, w: 5.5, h: 1.65 });
  // Un tablero en chico: por hacer, en curso (límite 3), hecho
  const columnas = [
    { titulo: 'Por hacer', x: 6.75, cartas: 5, estilo: 'gris' },
    { titulo: 'En curso', x: 8.75, cartas: 3, estilo: 'teal', badge: '3 de 3' },
    { titulo: 'Hecho', x: 10.75, cartas: 4, estilo: 'verde' },
  ];
  columnas.forEach((c) => {
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 2.1, w: 1.85, h: 4.7, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: `Columna ${c.titulo}` });
    texto(s, c.titulo, { x: c.x + 0.15, y: 2.22, w: 1.6, h: 0.35, fontSize: 15, bold: true, color: c.estilo === 'teal' ? C.accent1 : C.text1 });
    if (c.badge) texto(s, `límite 3 · ${c.badge}`, { x: c.x + 0.15, y: 2.56, w: 1.6, h: 0.3, fontSize: 12, color: C.accent1 });
    for (let k = 0; k < c.cartas; k++) {
      const y = 2.95 + k * 0.68;
      s.addShape(pres.ShapeType.roundRect, {
        x: c.x + 0.15, y, w: 1.55, h: 0.55, rectRadius: 0.05,
        fill: { color: c.estilo === 'verde' ? HEX.verdeClaro : HEX.blanco },
        line: { color: c.estilo === 'teal' ? HEX.teal : c.estilo === 'verde' ? HEX.verde : HEX.linea, width: c.estilo === 'teal' ? 1.5 : 0.75 },
        objectName: `Tarjeta ${c.titulo} ${k + 1}`,
      });
      s.addShape(pres.ShapeType.line, { x: c.x + 0.3, y: y + 0.28, w: c.estilo === 'verde' ? 0.9 : 1.1, h: 0, line: { color: c.estilo === 'verde' ? HEX.verde : HEX.linea, width: 2 } });
      if (c.estilo === 'verde') texto(s, '✓', { x: c.x + 1.3, y: y + 0.1, w: 0.35, h: 0.35, fontSize: 14, color: C.accent2, bold: true, align: 'center' });
    }
  });
  nota(s, [
    '3 minutos. El tablero de la derecha es el del juego, con por hacer, en curso con su límite y hecho.',
    '"WIP es trabajo en curso, en inglés. Es lo que ya está empezado y no terminado. Un límite de WIP es un número que dice cuántas cosas pueden estar en curso a la vez. Al llegar al número no se empieza otra hasta terminar una. Es lo que le pusimos a la mosca."',
    'Después preguntas "¿Cuántas tarjetas hay hoy en su columna En curso?"',
  ]);
}

// ---------- 8 · Idea 2: estar ocupado no es avanzar ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'Idea 2 · 3 minutos', 'Estar ocupado no es lo mismo que avanzar');
  const casos = [
    { x: MARGEN, foto: 'escena-wip2.jpg', titulo: '2 tareas a la vez', avanza: 0.47, frase: 'Cada tarea avanza el 47 % de su tiempo y tarda una hora.' },
    { x: 6.85, foto: 'escena-wip9.jpg', titulo: '9 tareas a la vez', avanza: 0.09, frase: 'Cada tarea avanza el 9 % de su tiempo y tarda casi nueve horas.' },
  ];
  casos.forEach((c) => {
    const w = 5.8;
    s.addImage({ path: path.join(IMG, c.foto), x: c.x, y: 1.95, w, h: 2.2, sizing: { type: 'cover', w, h: 2.2 }, shadow: sombra(), objectName: `La oficina con ${c.titulo}`, altText: `La oficina con ${c.titulo}` });
    texto(s, c.titulo, { x: c.x, y: 4.23, w, h: 0.4, fontSize: 20, bold: true, color: C.text1 });
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 4.7, w, h: 0.42, fill: { color: HEX.grisBarra }, line: { color: HEX.grisBarra, width: 0 }, rectRadius: 0.05, objectName: `Tiempo de la tarea con ${c.titulo}` });
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 4.7, w: w * c.avanza, h: 0.42, fill: { color: C.accent1 }, line: { color: HEX.teal, width: 0 }, rectRadius: 0.05, objectName: `Tiempo que avanza con ${c.titulo}` });
    // Con 9 tareas la parte teal es angosta: el rótulo va afuera, a su derecha, en teal
    if (c.avanza >= 0.2) texto(s, 'avanza', { x: c.x + 0.12, y: 4.7, w: 1.4, h: 0.42, fontSize: 14, color: C.background1, valign: 'middle', bold: true });
    else texto(s, 'avanza', { x: c.x + w * c.avanza + 0.1, y: 4.7, w: 1.4, h: 0.42, fontSize: 14, color: C.accent1, valign: 'middle', bold: true });
    texto(s, 'espera', { x: c.x + w - 1.2, y: 4.7, w: 1.1, h: 0.42, fontSize: 14, color: C.text1, valign: 'middle', align: 'right' });
    texto(s, c.frase, { x: c.x, y: 5.2, w, h: 0.7, fontSize: 18, color: C.text1 });
  });
  preguntaLinea(s, '¿Qué parte de su trabajo está esperando hoy?', { x: MARGEN, y: 6.02, w: ANCHO - 2 * MARGEN });
  nota(s, [
    '3 minutos. Dos fotos del mismo juego a la misma hora. La barra de abajo es la vida de una tarea, con cuánto avanza (teal) y cuánto espera (gris). Números del juego, promedio de 200 días.',
    '"Hay dos formas de mirar un día. Una es cuánto estuvo ocupada la persona. La otra es cuánto de su tiempo avanzó cada tarea y cuánto esperó. A eso se le llama eficiencia de flujo. En el juego, con 2 tareas a la vez cada tarea avanza el 47 por ciento de su tiempo y tarda una hora. Con 9 avanza el 9 por ciento y tarda casi nueve horas. El resto del tiempo, espera."',
    'Después preguntas "¿Qué parte de su trabajo está esperando hoy?"',
  ]);
}

// ---------- 9 · Idea 3: el límite depende de las esperas ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'Idea 3 · 3 minutos', 'El límite depende de las esperas');
  s.addChart(pres.ChartType.line, [
    { name: 'Sin ninguna espera', labels: LIMITES, values: SIN_ESPERAS },
    { name: 'Con las esperas del juego (1 de cada 5 tareas se traba)', labels: LIMITES, values: TERMINADAS },
  ], {
    x: MARGEN, y: 2.0, w: 7.4, h: 4.8, chartColors: ['9aa5b1', HEX.teal], lineSize: 3.5, lineDataSymbol: 'circle', lineDataSymbolSize: 9,
    catAxisLabelFontFace: '+mn-lt', catAxisLabelFontSize: 14, catAxisLabelColor: HEX.tinta,
    showCatAxisTitle: true, catAxisTitle: 'Tareas a la vez (el límite)', catAxisTitleFontFace: '+mn-lt', catAxisTitleFontSize: 14, catAxisTitleColor: HEX.tinta,
    valAxisLabelFontFace: '+mn-lt', valAxisLabelFontSize: 13, valAxisLabelColor: HEX.suave, valAxisMinVal: 0, valAxisMaxVal: 24, valAxisMajorUnit: 6,
    showValAxisTitle: true, valAxisTitle: 'Terminadas en el día', valAxisTitleFontFace: '+mn-lt', valAxisTitleFontSize: 14, valAxisTitleColor: HEX.tinta,
    valGridLine: { color: HEX.linea, size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontFace: '+mn-lt', legendFontSize: 14, legendColor: HEX.tinta,
    objectName: 'Terminadas según el límite, con y sin esperas (simulación)',
  });
  texto(s, 'En el juego, una de cada cinco tareas se traba entre 30 y 60 minutos esperando a otra persona. Por eso el mejor límite no es 1.', { x: 8.45, y: 2.05, w: 4.2, h: 1.7, fontSize: 18, color: C.text1 });
  s.addShape(pres.ShapeType.roundRect, { x: 8.45, y: 3.75, w: 4.2, h: 1.55, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: 'La regla de las esperas' });
  texto(s, 'Reducir las esperas permite bajar el límite. Subir el límite no reduce las esperas.', { x: 8.7, y: 3.85, w: 3.7, h: 1.35, fontSize: 19, fontFace: 'Lora', color: C.accent1, valign: 'middle' });
  pregunta(s, '¿A quién o a qué esperan más?', { x: 8.45, y: 5.45, w: 4.2, h: 1.35 });
  nota(s, [
    '3 minutos. El gráfico es de la simulación. La línea gris es el juego sin ninguna tarea trabada y la teal es el juego de hoy.',
    '"En el juego, una de cada cinco tareas se traba entre 30 y 60 minutos esperando a otra persona. Por eso el mejor límite no es 1. En la simulación quedó entre 2 y 4. De ahí sale la regla. Reducir las esperas permite bajar el límite. Subir el límite no reduce las esperas."',
    'Después preguntas "¿A quién o a qué esperan más?" Esa respuesta alimenta la línea 3 de la hoja del equipo.',
  ]);
}

// ---------- 10 · Idea 4: lo empezado no desaparece ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'Idea 4 · 3 minutos', 'Lo empezado no desaparece');
  s.addChart(pres.ChartType.line, [{ name: 'Tareas abiertas', labels: HORAS, values: BAJAR }], {
    x: MARGEN, y: 2.0, w: 7.8, h: 4.8, chartColors: [HEX.teal], lineSize: 4, lineDataSymbol: 'none',
    catAxisLabelFontFace: '+mn-lt', catAxisLabelFontSize: 14, catAxisLabelColor: HEX.tinta,
    showCatAxisTitle: true, catAxisTitle: 'Hora del día en el juego', catAxisTitleFontFace: '+mn-lt', catAxisTitleFontSize: 14, catAxisTitleColor: HEX.tinta,
    valAxisLabelFontFace: '+mn-lt', valAxisLabelFontSize: 13, valAxisLabelColor: HEX.suave, valAxisMinVal: 0, valAxisMaxVal: 10, valAxisMajorUnit: 2,
    showValAxisTitle: true, valAxisTitle: 'Tareas abiertas', valAxisTitleFontFace: '+mn-lt', valAxisTitleFontSize: 14, valAxisTitleColor: HEX.tinta,
    valGridLine: { color: HEX.linea, size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false,
    objectName: 'Tareas abiertas al bajar el límite de 10 a 2 a las 12:00 (simulación)',
  });
  texto(s, [
    { text: 'A las 12:00 la mosca baja el límite de 10 a 2. Recién a las 14:35 queda con 2 abiertas.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 10 } },
    { text: 'En un equipo pueden ser días. La primera semana con un límite se siente más lenta.', options: { breakLine: true, bold: true } },
    { text: ' ', options: { breakLine: true, fontSize: 10 } },
    { text: 'Simulación, promedio de 200 días.', options: { color: C.text2, fontSize: 15 } },
  ], { x: 8.85, y: 2.05, w: 3.8, h: 3.2, fontSize: 18 });
  pregunta(s, '¿Qué tendrían que terminar antes de empezar algo nuevo?', { x: 8.85, y: 5.15, w: 3.8, h: 1.65, fontSize: 20 });
  nota(s, [
    '3 minutos. Si vas atrasado, sáltala y di solo la frase de la primera semana.',
    '"Si a las 12 del día la mosca baja el límite de 10 a 2, sigue con 10 cosas abiertas hasta terminar 8. Recién a las 2 y 35 queda con 2. En un equipo pueden ser días. La primera semana con un límite se siente más lenta, porque primero se termina lo que ya estaba empezado."',
    'Después preguntas "¿Qué tendrían que terminar antes de empezar algo nuevo?" Y cierras los conceptos con "Estar siempre ocupado no es lo mismo que avanzar. Y la meta no es una cosa a la vez, sino un límite que puedan sostener."',
  ]);
}

// =====================================================================================
pres.addSection({ title: 'Parte 3 · Práctica' });

// ---------- 11 · La hoja del equipo ----------
{
  const s = lamina('CLARA', 'Parte 3 · Práctica', 'La hoja del equipo · 25 minutos', 'Tres preguntas y una fecha');
  const filas = [
    `Hoy tenemos ${subrayado(5)} cosas en curso, contadas como tarjetas del tablero.`,
    `Nuestro límite para partir es ${subrayado(5)}`,
    `Cuando algo quede esperando, en vez de empezar otra cosa, vamos a ${subrayado(14)}`,
    `Lo probamos 2 semanas y lo revisamos el ${subrayado(12)}`,
  ];
  // La línea 3 ocupa dos renglones (la frase y su espacio para escribir): su fila es más alta,
  // y las cuatro filas llenan el alto de la lámina
  const altos = [1.0, 1.0, 1.45, 1.0];
  let y = 2.0;
  filas.forEach((f, i) => {
    texto(s, String(i + 1), { x: MARGEN, y, w: 0.7, h: 0.9, fontSize: 34, fontFace: 'Lora', color: C.accent1, bold: true });
    texto(s, f, { x: MARGEN + 0.9, y: y + 0.08, w: 11.0, h: altos[i] - 0.15, fontSize: 24, color: C.text1 });
    if (i < filas.length - 1) s.addShape(pres.ShapeType.line, { x: MARGEN, y: y + altos[i] - 0.1, w: ANCHO - 2 * MARGEN, h: 0, line: { color: HEX.linea, width: 0.75 } });
    y += altos[i] + 0.1;
  });
  nota(s, [
    '25 minutos, que son 5 para contar, 8 para el límite, 7 para qué hacen cuando algo espera y 5 para la fecha. Deja esta lámina puesta toda la práctica. Tú guías con el reloj y con preguntas. No propones el número.',
    'En la línea 1 cuentan en su tablero, tal cual, sin arreglarlo. Sin tablero, cada persona dice cuántas cosas tiene en curso y se suman. Si dos comparten una, cuenta una vez.',
    'En la línea 2 dices "No busquen el número perfecto. Busquen uno un poco menor que el de hoy, que les incomode un poco y que puedan sostener dos semanas." La línea 3 va escrita como una acción. La línea 4, en una reunión que ya tengan.',
  ]);
}

// =====================================================================================
pres.addSection({ title: 'Parte 4 · Cierre' });

// ---------- 12 · La prueba vive en su tablero de siempre (rehecha en la v4) ----------
// Sin tabla aparte: la prueba vive en el tablero del equipo, el tradicional (Por hacer, En
// curso y Hecho, igual que en el juego). Tres tarjetas iguales y centradas, cada una con un
// dibujo chico de lo que se ve en el tablero.
{
  const s = lamina('CLARA', 'Parte 4 · Cierre', 'Después de hoy · 2 minutos', 'La prueba vive en su tablero de siempre');
  const SEP = 0.35;
  const w = (ANCHO - 2 * MARGEN - 2 * SEP) / 3;
  const y = 1.95;
  const h = 4.3;
  const pasos = [
    { n: '1', t: 'El límite en la columna En curso', p: 'Escrito arriba de la columna, a la vista de todos.' },
    { n: '2', t: 'Las fechas en cada tarjeta', p: 'El día que empezó y el día que terminó.' },
    { n: '3', t: 'A las dos semanas, decidir', p: 'Cuentan cuántas terminaron y miran cuánto tardó cada una.' },
  ];
  pasos.forEach((paso, i) => {
    const x = MARGEN + i * (w + SEP);
    const pad = 0.35;
    const iw = w - 2 * pad;
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.1, objectName: `Paso ${paso.n}` });
    texto(s, paso.n, { x: x + pad, y: y + 0.25, w: 1, h: 0.8, fontSize: 44, fontFace: 'Lora', color: C.accent1, bold: true });
    texto(s, paso.t, { x: x + pad, y: y + 1.1, w: iw, h: 0.85, fontSize: 22, bold: true, color: C.text1 });
    texto(s, paso.p, { x: x + pad, y: y + 1.95, w: iw, h: 1.0, fontSize: 18, color: C.text1 });
    // El dibujo chico, abajo de cada tarjeta, todos a la misma altura
    const dy = y + 3.1;
    if (paso.n === '1') {
      s.addShape(pres.ShapeType.roundRect, { x: x + pad, y: dy, w: iw, h: 0.82, fill: { color: HEX.blanco }, line: { color: HEX.teal, width: 1.5 }, rectRadius: 0.06, objectName: 'Encabezado de la columna En curso' });
      texto(s, [
        { text: 'En curso', options: { bold: true, color: C.accent1 } },
        { text: '   límite 3', options: { color: C.text1 } },
      ], { x: x + pad + 0.2, y: dy + 0.12, w: iw - 0.4, h: 0.58, fontSize: 18, valign: 'middle' });
    } else if (paso.n === '2') {
      s.addShape(pres.ShapeType.roundRect, { x: x + pad, y: dy, w: iw, h: 0.82, fill: { color: HEX.blanco }, line: { color: HEX.linea, width: 0.75 }, rectRadius: 0.06, shadow: sombra(), objectName: 'Una tarjeta con sus fechas' });
      texto(s, [
        { text: 'Empezó el lunes', options: { breakLine: true } },
        { text: 'Terminó el jueves' },
      ], { x: x + pad + 0.2, y: dy + 0.1, w: iw - 0.4, h: 0.62, fontSize: 14, color: C.text2, valign: 'middle' });
    } else {
      // Mantener, bajar o subir el límite: tres píldoras, la primera más ancha por su palabra
      const opciones = [['Mantener', 1.3], ['Bajar', 0.8], ['Subir', 0.8]];
      const gap = (iw - opciones.reduce((a, [, ow]) => a + ow, 0)) / 2;
      let ox = x + pad;
      opciones.forEach(([o, ow]) => {
        s.addShape(pres.ShapeType.roundRect, { x: ox, y: dy + 0.16, w: ow, h: 0.5, fill: { color: HEX.blanco }, line: { color: HEX.teal, width: 1 }, rectRadius: 0.25, objectName: `Decisión de ${o.toLowerCase()}` });
        texto(s, o, { x: ox, y: dy + 0.16, w: ow, h: 0.5, fontSize: 14, color: C.accent1, bold: true, align: 'center', valign: 'middle' });
        ox += ow + gap;
      });
    }
  });
  texto(s, 'Sin reuniones nuevas. Todo queda en su tablero, con Por hacer, En curso y Hecho, igual que en el juego.', { x: MARGEN, y: 6.42, w: ANCHO - 2 * MARGEN, h: 0.45, fontSize: 18, color: C.text2, align: 'center' });
  nota(s, [
    '2 minutos. La prueba no suma trabajo, porque vive en el tablero que ya usan, con Por hacer, En curso y Hecho, igual que en el juego.',
    '"Escriban el límite arriba de la columna En curso. En cada tarjeta, anoten el día que empezó y el día que terminó. En la revisión, cuenten cuántas terminaron, miren cuánto tardó cada una y decidan si mantienen, bajan o suben el límite. Cuatro semanas si son líderes."',
  ]);
}

// ---------- 13 · El cierre ----------
{
  const s = lamina('OSCURA_GRANDE', 'Parte 4 · Cierre', 'Para cerrar · 8 minutos', 'La hoja en voz alta.\nUna frase por persona.\nLa fecha al calendario.');
  texto(s, [
    { text: '¿Qué vas a hacer distinto mañana? Una frase cada uno, sin explicar.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 10 } },
    { text: 'Foto a la hoja y la revisión al calendario, antes de salir de la sala.', options: { bold: true, color: C.accent5 } },
  ], { x: MARGEN, y: 4.1, w: 11.2, h: 2.4, fontSize: 24, color: C.background2 });
  nota(s, [
    '8 minutos, que son la hoja en voz alta (2), una frase por persona (4) y la fecha al calendario con la foto (2).',
    '"Léanla entera, tal cual quedó." Luego dices "Una frase cada uno, ¿qué vas a hacer distinto mañana?" Y al final, "Foto a la hoja y la revisión al calendario ahora. Si sale de la sala sin fecha, no pasa."',
    'Si se acabó el tiempo con la hoja a medias, cierra igual con la lectura y la fecha.',
  ]);
}

// ---------- 14 · Para saber más y créditos ----------
{
  const s = lamina('OSCURA', 'Parte 4 · Cierre', 'Para saber más · mientras se van', 'El juego y el informe');
  const tarjetas = [
    { x: MARGEN, qr: 'qr-jugar.png', titulo: 'El juego', texto: 'Un día de oficina en un minuto. Gratis, sin registro, en el computador, el celular o la tablet.', url: 'mosca.deliverycraft.ai/jugar/' },
    { x: MARGEN + 3.6, qr: 'qr-informe.png', titulo: 'El informe', texto: 'De dónde sale cada número, los estudios con personas y cuatro pasos para probar un límite. Se lee en diez minutos.', url: 'mosca.deliverycraft.ai, botón “Descargar el informe”' },
  ];
  tarjetas.forEach((t) => {
    s.addShape(pres.ShapeType.roundRect, { x: t.x, y: 2.05, w: 3.35, h: 4.55, fill: { color: HEX.blanco }, line: { color: HEX.blanco, width: 0 }, rectRadius: 0.1, objectName: `Tarjeta ${t.titulo}` });
    s.addImage({ path: path.join(IMG, t.qr), x: t.x + 0.55, y: 2.3, w: 2.25, h: 2.25, objectName: `QR ${t.titulo}`, altText: `Código QR para abrir ${t.titulo.toLowerCase()}` });
    texto(s, t.titulo, { x: t.x + 0.3, y: 4.65, w: 2.75, h: 0.4, fontSize: 20, fontFace: 'Lora', bold: true, color: C.text1 });
    texto(s, t.texto, { x: t.x + 0.3, y: 5.05, w: 2.75, h: 0.9, fontSize: 11.5, color: C.text2 });
    texto(s, t.url, { x: t.x + 0.3, y: 5.95, w: 2.75, h: 0.55, fontSize: 11.5, bold: true, color: C.accent1 });
  });
  texto(s, [
    { text: 'El taller “Deja de empezar, empieza a terminar” es de Felipe Fernández, con licencia CC BY 4.0. Puedes usar y adaptar este taller, también en talleres pagados, citando a Felipe Fernández (mosca.deliverycraft.ai).', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Las cuatro partes de la sesión vienen de Sharon L. Bowman, Training from the BACK of the Room! 65 Ways to Step Aside and Let Them Learn (Pfeiffer, 2009).', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Los números del juego son el promedio de 200 días por cada límite, con la misma mosca y las mismas reglas. El juego no mide personas ni equipos. El número de tu equipo lo mide tu equipo.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Las neuronas del juego vienen del Male CNS v1.0 (FlyEM de HHMI Janelia, la Universidad de Cambridge, el MRC Laboratory of Molecular Biology y Google Research), con licencia CC BY 4.0. La actividad que se ve es simulada.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Si facilitas el taller y quieres contar cómo te fue, escríbeme por LinkedIn, en linkedin.com/in/felipefernandezandrade', options: { color: C.accent5 } },
  ], { x: 8.05, y: 2.05, w: 4.6, h: 4.6, fontSize: 12.5, color: 'c9d1d9' });
  nota(s, [
    'Déjala puesta mientras se van, porque tiene los dos códigos.',
    '"Lo que vieron hoy es un juego con una mosca. Lo que vale es su hoja y dos semanas de datos. Quien quiera saber de dónde sale cada número tiene el informe, que se lee en diez minutos."',
    'Para ti, al salir, anota las preguntas que no supiste responder y los números de los dos días del juego. Confirma que la foto llegó al grupo y que la revisión quedó en el calendario.',
  ]);
}

// ---------- Todo el texto en español (M18) ----------
// pptxgenjs marca cada texto como inglés (lang="en-US") y no usa pres.lang. Aquí se cambia a
// es-CL en las láminas, las notas, los patrones y los gráficos, y el archivo dice su idioma.
async function marcarEspanol(archivo) {
  const zip = await JSZip.loadAsync(fs.readFileSync(archivo));
  let cambios = 0;
  for (const nombre of Object.keys(zip.files).filter((n) => /^ppt\/.*\.xml$/.test(n))) {
    const xml = await zip.file(nombre).async('string');
    const nuevo = xml.replace(/ lang="en-US"/g, () => (cambios++, ' lang="es-CL"')).replace(/<c:lang val="en-US"\/>/g, () => (cambios++, '<c:lang val="es-CL"/>'));
    if (nuevo !== xml) zip.file(nombre, nuevo);
  }
  const core = await zip.file('docProps/core.xml').async('string');
  if (!core.includes('<dc:language>')) zip.file('docProps/core.xml', core.replace('</dc:creator>', '</dc:creator>\n\t\t<dc:language>es-CL</dc:language>'));
  fs.writeFileSync(archivo, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  const quedan = [];
  for (const nombre of Object.keys(zip.files).filter((n) => n.endsWith('.xml'))) if (/lang="en-US"|<c:lang val="en-US"/.test(await zip.file(nombre).async('string'))) quedan.push(nombre);
  if (quedan.length) throw new Error(`siguen marcados como inglés: ${quedan.join(', ')}`);
  console.log(`texto marcado como es-CL (${cambios} marcas)`);
}

// ---------- Guardar y aplicar el tema ----------
(async () => {
  await pres.writeFile({ fileName: SALIDA });
  await applyTheme(SALIDA, THEME);
  await marcarEspanol(SALIDA);
  console.log(`presentación lista: ${SALIDA} (${numero} láminas)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
