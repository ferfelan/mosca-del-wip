// Presentación del taller "Deja de empezar, empieza a terminar" (Etapa 6.0 v2, 2026-10-26).
// 13 láminas 16:9 en PowerPoint editable (se abre en Keynote y Google Slides), una idea por
// lámina, letra grande y poco texto, con el guion del facilitador en las notas de cada una
// (cuánto dura, qué haces, qué dices, qué preguntas). Sigue el orden del manual
// (docs/contexto/taller-v2.html): el manual dice "lámina N" y aquí N es exactamente esa lámina.
//   1 portada · 2 lo que se llevan hoy · 3 la pregunta del post-it · 4 el juego en vivo, dos días
//   5 ¿a cuál de los dos días se parece su semana? · 6 el promedio de 200 días · 7 a 10 las cuatro
//   ideas · 11 la hoja del equipo · 12 el cierre · 13 el juego, el informe y los créditos.
// La v1 (armar.cjs, "¿Cuántas cosas a la vez?") se guarda tal cual.
// Letras: Lora (títulos) y Figtree (texto), las dos de Google Fonts (OFL): Google Slides las trae;
// en PowerPoint y Keynote hay que tenerlas instaladas (en este Mac están en ~/Library/Fonts).
// Estilo: el de los informes y el manual (blanco, tinta #1d2532, teal #2f7579, papel #f3efe7).
// Se arma con (pptxgenjs está en node_modules del repo, instalado con --no-save):
//   NODE_PATH=node_modules node docs/contexto/taller-presentacion/armar-v2.cjs
// Sale "2026-10-26 Taller - Presentación v2.pptx" en ~/Desktop/Mosca del WIP/.
// Después: validar, convertir a PDF con a-pdf.sh y mirar cada lámina (ver docs/etapa6-0.md).
const path = require('node:path');
const os = require('node:os');
const pptxgen = require('pptxgenjs');
const { applyTheme } = require(path.join(os.homedir(), '.claude/skills/synced/9dc43800-5819-4ce7-8c29-f48b447a1e71_7effb68f-fc54-42de-a806-382cfa514daf/pptx/scripts/apply_theme.js'));

const REPO = path.resolve(__dirname, '../../..');
const IMG = path.join(REPO, 'docs/contexto/img');
const FECHA = process.env.FECHA || '2026-10-26';
const VERSION = process.env.VERSION || 'v2';
const SALIDA = path.join(os.homedir(), 'Desktop/Mosca del WIP', `${FECHA} Taller - Presentación ${VERSION}.pptx`);

// ---------- Números oficiales (corrida semilla 2024, 200 días; docs/corrida-oficial.json) ----------
const LIMITES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const TERMINADAS = [15.9, 18.0, 16.9, 15.4, 14.0, 12.3, 11.2, 10.0, 9.1, 8.2];
const SIN_ESPERAS = [21.2, 18.0, 16.6, 15.1, 13.8, 12.2, 10.9, 9.8, 9.1, 8.2]; // Etapa 4.2, ninguna tarea se traba
// 10 tareas desde las 09:00 y a las 12:00 baja a 2: tareas abiertas cada 15 minutos (promedio de 200 días)
const BAJAR = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 8.8, 8.05, 7.11, 6.15, 5.63, 4.93, 4.31, 3.81, 3.31, 2.88, 2.56, 2.29, 2.13, 2.06, 2.03, 2, 2, 2, 2, 2, 2, 2, 2, 2];
const HORAS = BAJAR.map((_, i) => (i % 4 === 0 ? `${9 + i / 4}:00` : ''));

// ---------- El tema: los colores de los informes ----------
const HEX = {
  tinta: '1d2532', blanco: 'FFFFFF', suave: '5b6472', papel: 'f3efe7', teal: '2f7579', verde: '4f9d6a',
  rojo: 'cc4a43', ambar: 'e08a3c', tealClaro: '8fd3d6', naranjo: 'b35a1d', linea: 'e2ddd2', tealSuave: '9dc3c5',
  postit: 'f6e27a', grisBarra: 'e8e4dc', verdeClaro: 'e6f2ea',
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
pres.subject = 'Presentación del taller (Etapa 6.0, versión 2)';
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
      { placeholder: { options: { name: 'kicker', type: 'body', x: MARGEN, y: 0.5, w: ANCHO - 2 * MARGEN, h: 0.4, fontSize: 15, color: kicker, margin: 0, valign: 'top' }, text: 'Momento de la sesión' } },
      { placeholder: { options: { name: 'title', type: 'title', x: MARGEN, y: 0.95, w: grande ? 10.8 : ANCHO - 2 * MARGEN, h: grande ? 2.6 : 1.0, fontSize: grande ? 44 : 34, bold: true, color: tinta, margin: 0, valign: 'top', align: 'left' }, text: 'Título' } },
      { text: { text: PIE, options: { x: MARGEN, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: gris, margin: 0, align: 'left' } } },
    ],
    slideNumber: { x: ANCHO - MARGEN - 0.8, y: 7.0, w: 0.8, h: 0.3, fontSize: 10, color: gris, align: 'right' },
  });
}
marco('CLARA', false, false);
marco('CLARA_GRANDE', false, true);
marco('OSCURA', true, false);
marco('OSCURA_GRANDE', true, true);
pres.defineSlideMaster({ title: 'PORTADA', background: { color: HEX.blanco }, objects: [] });

// ---------- Ayudas ----------
const texto = (slide, t, o) => slide.addText(t, { isTextBox: true, margin: 0, valign: 'top', align: 'left', color: C.text1, fontSize: 18, ...o });
const sombra = () => ({ type: 'outer', color: '000000', blur: 6, offset: 2, angle: 90, opacity: 0.16 });
const subrayado = (n) => '_'.repeat(n);
// Las notas: cuánto dura, qué haces, qué dices, qué preguntas (y algo más si hace falta)
const nota = (slide, { dura, haces, dices, preguntas, mas }) => {
  const lineas = [];
  if (dura) lineas.push(`Cuánto dura: ${dura}`);
  if (haces) lineas.push(`Qué haces: ${haces}`);
  if (dices) lineas.push(`Qué dices: ${dices}`);
  if (preguntas) lineas.push(`Qué preguntas: ${preguntas}`);
  if (mas) lineas.push(...[].concat(mas));
  slide.addNotes(lineas.join('\n\n'));
};
// La pregunta para la sala: una caja papel con la pregunta en Lora, igual en todas las ideas
const pregunta = (slide, t, { x, y, w, h = 1.15, fontSize = 19 }) => {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: 'Pregunta para la sala' });
  texto(slide, 'Pregunta para la sala', { x: x + 0.25, y: y + 0.12, w: w - 0.5, h: 0.28, fontSize: 11, color: C.text2 });
  texto(slide, t, { x: x + 0.25, y: y + 0.4, w: w - 0.5, h: h - 0.5, fontSize, fontFace: 'Lora', color: C.accent1, valign: 'top' });
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
  s.addImage({ path: path.join(IMG, 'escena-wip9.jpg'), x: -1.2, y: -0.79, w: 14.53, h: 9.08, objectName: 'La mosca en su oficina con 9 tareas a la vez' });
  s.addShape(pres.ShapeType.roundRect, { x: 7.4, y: 0.75, w: 5.3, h: 6.0, fill: { color: HEX.blanco }, line: { color: HEX.blanco, width: 0 }, rectRadius: 0.12, shadow: sombra(), objectName: 'Tarjeta del nombre' });
  texto(s, 'Un taller de 60 minutos', { x: 7.8, y: 1.15, w: 4.6, h: 0.4, fontSize: 15, color: C.accent1 });
  texto(s, 'Deja de empezar, empieza a terminar', { x: 7.8, y: 1.65, w: 4.6, h: 2.5, fontSize: 32, fontFace: 'Lora', bold: true, color: C.text1 });
  texto(s, 'Para encontrar el límite de tu equipo, con la Mosca del WIP', { x: 7.8, y: 3.5, w: 4.5, h: 1.0, fontSize: 17, color: C.text2 });
  texto(s, [
    { text: 'Felipe Fernández · mosca.deliverycraft.ai', options: { breakLine: true } },
    { text: 'Se puede usar y adaptar · CC BY 4.0' },
  ], { x: 7.8, y: 5.85, w: 4.6, h: 0.7, fontSize: 11.5, color: C.text2 });
  nota(s, {
    dura: 'queda puesta mientras llega la gente. No hace falta presentarla.',
    haces: 'Ten el juego abierto en otra ventana, en la vista Exhibición (tecla E) y con 9 tareas a la vez elegidas (tecla 9), sin empezar. Cuando estén todos, pasa a la lámina 2.',
    mas: 'La sesión completa, minuto a minuto, está en el manual del facilitador. Esta presentación es el apoyo: una idea por lámina y el guion en estas notas.',
  });
}

// =====================================================================================
pres.addSection({ title: 'Parte 1 · Conexión' });

// ---------- 2 · Lo que se llevan hoy ----------
{
  const s = lamina('CLARA', 'Parte 1 · Conexión', 'Para empezar · 1 minuto', 'Hoy salen con tres cosas escritas');
  const cosas = ['Su límite de tareas a la vez', 'Qué hacen cuando algo queda esperando', 'Una prueba de dos semanas, con fecha de revisión'];
  cosas.forEach((c, i) => {
    const y = 2.35 + i * 1.35;
    texto(s, String(i + 1), { x: MARGEN, y, w: 0.9, h: 1.0, fontSize: 36, fontFace: 'Lora', color: C.accent1, bold: true });
    texto(s, c, { x: MARGEN + 1.0, y: y + 0.12, w: 10.9, h: 1.0, fontSize: 26, color: C.text1 });
    if (i < cosas.length - 1) s.addShape(pres.ShapeType.line, { x: MARGEN, y: y + 1.15, w: ANCHO - 2 * MARGEN, h: 0, line: { color: HEX.linea, width: 0.75 } });
  });
  texto(s, 'Todo lo demás es para llegar ahí.', { x: MARGEN, y: 6.35, w: 11, h: 0.4, fontSize: 16, color: C.text2 });
  nota(s, {
    dura: '1 minuto (0:00 a 0:01).',
    haces: 'Lo primero que dices en la sala. Sin presentarte largo: una frase y a la pregunta.',
    dices: '"Hoy salen con tres cosas escritas: su límite de tareas a la vez, qué van a hacer cuando algo quede esperando y una prueba de dos semanas con fecha. Todo lo demás es para llegar ahí."',
  });
}

// ---------- 3 · La pregunta del post-it ----------
{
  const s = lamina('CLARA_GRANDE', 'Parte 1 · Conexión', 'Antes de jugar · 3 minutos', '¿Cuántas tareas tienes empezadas hoy?');
  texto(s, 'Cuenta a nivel de tarea: una tarjeta del tablero, no cada correo ni cada subtarea.', { x: MARGEN, y: 3.6, w: 7.4, h: 1.0, fontSize: 20, color: C.text2 });
  texto(s, 'Escribe el número en un post-it y guárdalo.', { x: MARGEN, y: 4.7, w: 7.4, h: 0.6, fontSize: 20, color: C.text1, bold: true });
  texto(s, 'Después, mano alzada: ¿quién tiene más de cinco?', { x: MARGEN, y: 5.4, w: 7.4, h: 0.6, fontSize: 20, color: C.text1 });
  // El post-it
  s.addShape(pres.ShapeType.rect, { x: 9.3, y: 2.3, w: 3.1, h: 3.1, fill: { color: HEX.postit }, line: { color: HEX.postit, width: 0 }, rotate: 4, shadow: sombra(), objectName: 'Post-it' });
  texto(s, 'Hoy tengo', { x: 9.65, y: 2.85, w: 2.5, h: 0.5, fontSize: 18, color: '6b5d1c', rotate: 4 });
  s.addShape(pres.ShapeType.line, { x: 9.7, y: 3.95, w: 2.2, h: 0, line: { color: '6b5d1c', width: 2.25 }, rotate: 4, objectName: 'Raya para el número' });
  texto(s, 'tareas empezadas', { x: 9.65, y: 4.35, w: 2.5, h: 0.5, fontSize: 18, color: '6b5d1c', rotate: 4 });
  nota(s, {
    dura: '3 minutos (0:01 a 0:04).',
    haces: 'Reparte un post-it y un plumón a cada persona. Cada una escribe un número y se lo guarda, porque se usa en la práctica. Cuando todos tengan el número, pide mano alzada.',
    dices: '"¿Cuántas tareas tienes empezadas hoy? Cuenta a nivel de tarea: una tarjeta del tablero, no cada correo ni cada subtarea. Escribe el número en el post-it y guárdalo." Y después: "Levante la mano quien tiene más de cinco."',
    preguntas: 'Si alguien pregunta qué cuenta como tarea: lo que tu equipo pondría como una tarjeta en su tablero.',
  });
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
    s.addImage({ path: path.join(IMG, d.foto), x: d.x, y: 2.0, w, h: 3.2, sizing: { type: 'cover', w, h: 3.2 }, shadow: sombra(), objectName: `La oficina, ${d.titulo}` });
    texto(s, d.titulo, { x: d.x, y: 5.3, w, h: 0.4, fontSize: 19, bold: true, color: C.text1 });
  });
  texto(s, 'Qué mirar: el estado de la mosca, los post-its del monitor, la pila de carpetas y el cenicero.', { x: MARGEN, y: 5.85, w: 12.0, h: 0.4, fontSize: 16, color: C.text1 });
  texto(s, 'Un día de oficina dura un minuto. En el juego, cada cigarro son ocho minutos sin trabajar.', { x: MARGEN, y: 6.3, w: 12.0, h: 0.4, fontSize: 14, color: C.text2 });
  nota(s, {
    dura: '5 minutos (0:04 a 0:09): un minuto por día, más lo que comentes y la tabla.',
    haces: 'Muestra esta lámina un momento (qué mirar) y pasa al juego, proyectado. Día 1: tecla 9 ya elegida, aprieta Espacio (o el botón Empezar) y el día parte a las 09:00. A velocidad normal dura un minuto: no uses x4, la sala tiene que ver cómo se estresa de a poco. A las 18:00 termina solo. Día 2: tecla 2 y después tecla R, y parte el segundo día con 2 tareas a la vez. Al terminar, la tabla de abajo compara los dos días: terminadas, tiempo por tarea y colillas. Los pasos con fotos están en la página 2 del manual.',
    dices: 'Día 1: "Esta mosca trabaja en una oficina con un tablero: por hacer, en curso, hecho. Hoy tiene 9 tareas a la vez. Miren cómo cambia su estado, los post-its que se le pegan al monitor, la pila de carpetas y el cenicero. En el juego, cada cigarro son ocho minutos sin trabajar." Día 2: "Misma mosca, mismo día, 2 tareas a la vez." Con la tabla: "Lean los tres números de cada día: cuántas terminó, cuánto tardó cada tarea y cuántos cigarros."',
    mas: 'Si un día sale raro (con 9 terminó más que con 2), dilo tal cual: un día no prueba nada. La lámina 6 muestra el promedio de 200 días. Si falla el internet, cuenta el día con estas dos fotos y pasa a la lámina 6.',
  });
}

// ---------- 5 · ¿A cuál de los dos días se parece su semana? ----------
{
  const s = lamina('CLARA_GRANDE', 'Parte 1 · Conexión', 'Después del juego · 1 minuto', '¿A cuál de los dos días se parece su semana?');
  const cajas = [
    { x: MARGEN, t: 'Día 1', b: '9 tareas a la vez' },
    { x: MARGEN + 4.2, t: 'Día 2', b: '2 tareas a la vez' },
  ];
  cajas.forEach((c) => {
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 3.85, w: 3.9, h: 1.6, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: c.t });
    texto(s, c.t, { x: c.x + 0.3, y: 4.05, w: 3.3, h: 0.5, fontSize: 16, color: C.text2 });
    texto(s, c.b, { x: c.x + 0.3, y: 4.5, w: 3.3, h: 0.7, fontSize: 24, fontFace: 'Lora', color: C.accent1, bold: true });
  });
  texto(s, 'Mano alzada por cada día.', { x: MARGEN, y: 5.85, w: 8, h: 0.5, fontSize: 20, color: C.text1 });
  nota(s, {
    dura: '1 minuto (0:09 a 0:10).',
    haces: 'Mano alzada por cada día, o dos o tres respuestas en voz alta. No comentes todavía: los conceptos vienen ahora.',
    preguntas: '"¿A cuál de los dos días se parece su semana?"',
  });
}

// =====================================================================================
pres.addSection({ title: 'Parte 2 · Conceptos' });

// ---------- 6 · El promedio de 200 días ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'Lo que vimos, en promedio · 3 minutos', 'En el juego, con 2 tareas a la vez termina 18.\nCon 9, la mitad.');
  const colores = TERMINADAS.map((_, i) => (i === 1 ? HEX.verde : i >= 7 ? HEX.rojo : HEX.teal));
  s.addChart(pres.ChartType.bar, [{ name: 'Terminadas en el día', labels: LIMITES, values: TERMINADAS }], {
    x: MARGEN, y: 2.0, w: 8.3, h: 4.75, barDir: 'col', barGapWidthPct: 45,
    chartColors: colores,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', dataLabelFontFace: '+mn-lt', dataLabelFontSize: 13, dataLabelColor: HEX.tinta,
    catAxisLabelFontFace: '+mn-lt', catAxisLabelFontSize: 13, catAxisLabelColor: HEX.tinta, catAxisLineShow: true,
    showCatAxisTitle: true, catAxisTitle: 'Tareas a la vez (el límite)', catAxisTitleFontFace: '+mn-lt', catAxisTitleFontSize: 12, catAxisTitleColor: HEX.suave,
    valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 21, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
    showLegend: false, showTitle: false,
    objectName: 'Terminadas en el día según el límite, promedio de 200 días',
  });
  texto(s, [
    { text: 'Terminadas en el día, promedio de 200 días por cada límite. La misma mosca, las mismas reglas.', options: { breakLine: true, color: C.text1 } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Verde: el límite con el que más termina. Rojo: con esos límites termina el día colapsada.', options: { color: C.text2, fontSize: 14 } },
  ], { x: 9.3, y: 2.1, w: 3.3, h: 2.9, fontSize: 16 });
  pregunta(s, '¿Dónde pondrían a su equipo, del 1 al 10?', { x: 9.3, y: 5.1, w: 3.3, h: 1.6 });
  nota(s, {
    dura: '3 minutos (0:10 a 0:13).',
    haces: 'Es la primera de cinco láminas, tres minutos cada una, cada una con su pregunta. El riesgo de esta parte es dar una clase: di lo justo y pregunta.',
    dices: '"Un día no prueba nada, así que aquí está el promedio de 200 días del juego con cada límite, de 1 a 10. Con 2 tareas a la vez la mosca termina 18 en el día. Con 9 termina la mitad, y está ocupada todo el día."',
    preguntas: '"¿Dónde pondrían a su equipo en esta tira del 1 al 10?"',
    mas: 'Si alguien pregunta por qué con 1 termina menos que con 2: en el juego, una de cada cinco tareas se traba esperando a otra persona, y con una sola cosa abierta la mosca se queda parada una cuarta parte del día. Viene en la lámina 9.',
  });
}

// ---------- 7 · Idea 1: qué es WIP y qué es un límite ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'Idea 1 · 3 minutos', 'WIP es trabajo en curso: lo que ya empezaste y no has terminado');
  texto(s, [
    { text: 'Un límite de WIP es un número: cuántas cosas pueden estar empezadas a la vez.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Cuando se llega al número, no se empieza otra hasta terminar una.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Es lo que le pusimos a la mosca.', options: { color: C.text2 } },
  ], { x: MARGEN, y: 2.4, w: 5.4, h: 2.6, fontSize: 19 });
  pregunta(s, '¿Cuántas tarjetas hay hoy en su columna En curso?', { x: MARGEN, y: 5.1, w: 5.4, h: 1.5 });
  // Un tablero en chico: por hacer, en curso (límite 3), hecho
  const columnas = [
    { titulo: 'Por hacer', x: 6.75, cartas: 5, estilo: 'gris' },
    { titulo: 'En curso', x: 8.75, cartas: 3, estilo: 'teal', badge: '3 de 3' },
    { titulo: 'Hecho', x: 10.75, cartas: 4, estilo: 'verde' },
  ];
  columnas.forEach((c) => {
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 2.1, w: 1.85, h: 4.5, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: `Columna ${c.titulo}` });
    texto(s, c.titulo, { x: c.x + 0.15, y: 2.22, w: 1.55, h: 0.3, fontSize: 13, bold: true, color: c.estilo === 'teal' ? C.accent1 : C.text1 });
    if (c.badge) texto(s, `límite 3 · ${c.badge}`, { x: c.x + 0.15, y: 2.5, w: 1.6, h: 0.25, fontSize: 10, color: C.accent1 });
    for (let k = 0; k < c.cartas; k++) {
      const y = 2.85 + k * 0.62;
      s.addShape(pres.ShapeType.roundRect, {
        x: c.x + 0.15, y, w: 1.55, h: 0.5, rectRadius: 0.05,
        fill: { color: c.estilo === 'verde' ? HEX.verdeClaro : HEX.blanco },
        line: { color: c.estilo === 'teal' ? HEX.teal : c.estilo === 'verde' ? HEX.verde : HEX.linea, width: c.estilo === 'teal' ? 1.5 : 0.75 },
        objectName: `Tarjeta ${c.titulo} ${k + 1}`,
      });
      s.addShape(pres.ShapeType.line, { x: c.x + 0.3, y: y + 0.25, w: c.estilo === 'verde' ? 0.9 : 1.1, h: 0, line: { color: c.estilo === 'verde' ? HEX.verde : HEX.linea, width: 2 } });
      if (c.estilo === 'verde') texto(s, '✓', { x: c.x + 1.3, y: y + 0.08, w: 0.35, h: 0.35, fontSize: 14, color: C.accent2, bold: true, align: 'center' });
    }
  });
  nota(s, {
    dura: '3 minutos (0:13 a 0:16).',
    haces: 'El tablero de la derecha es el mismo del juego: por hacer, en curso con su límite, hecho. Si el grupo ya trabaja con un tablero, pregunta dónde pondrían el número.',
    dices: '"WIP es trabajo en curso, en inglés: todo lo que ya está empezado y no está terminado. Un límite de WIP es un número, cuántas cosas pueden estar empezadas a la vez. Cuando se llega al número, no se empieza otra hasta terminar una. Es lo que le pusimos a la mosca."',
    preguntas: '"¿Cuántas tarjetas hay hoy en su columna En curso?"',
  });
}

// ---------- 8 · Idea 2: estar ocupado no es avanzar ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'Idea 2 · 3 minutos', 'Estar ocupado no es lo mismo que avanzar');
  const casos = [
    { x: MARGEN, foto: 'escena-wip2.jpg', titulo: '2 tareas a la vez', avanza: 0.47, frase: 'Cada tarea avanza el 47 % de su tiempo. Tarda una hora.' },
    { x: 6.85, foto: 'escena-wip9.jpg', titulo: '9 tareas a la vez', avanza: 0.09, frase: 'Cada tarea avanza el 9 % de su tiempo. Tarda casi nueve horas.' },
  ];
  casos.forEach((c) => {
    const w = 5.8;
    s.addImage({ path: path.join(IMG, c.foto), x: c.x, y: 1.95, w, h: 2.45, sizing: { type: 'cover', w, h: 2.45 }, shadow: sombra(), objectName: `La oficina con ${c.titulo}` });
    texto(s, c.titulo, { x: c.x, y: 4.48, w, h: 0.35, fontSize: 17, bold: true, color: C.text1 });
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 4.88, w, h: 0.36, fill: { color: HEX.grisBarra }, line: { color: HEX.grisBarra, width: 0 }, rectRadius: 0.05, objectName: `Tiempo de la tarea con ${c.titulo}` });
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 4.88, w: w * c.avanza, h: 0.36, fill: { color: C.accent1 }, line: { color: HEX.teal, width: 0 }, rectRadius: 0.05, objectName: `Tiempo que avanza con ${c.titulo}` });
    // Con 9 tareas la parte teal es angosta: el rótulo va afuera, a su derecha, en teal
    if (c.avanza >= 0.2) texto(s, 'avanza', { x: c.x + 0.1, y: 4.88, w: 1.2, h: 0.36, fontSize: 11, color: C.background1, valign: 'middle', bold: true });
    else texto(s, 'avanza', { x: c.x + w * c.avanza + 0.08, y: 4.88, w: 1.2, h: 0.36, fontSize: 11, color: C.accent1, valign: 'middle', bold: true });
    texto(s, 'espera', { x: c.x + w - 1.0, y: 4.88, w: 0.9, h: 0.36, fontSize: 11, color: C.text2, valign: 'middle', align: 'right' });
    texto(s, c.frase, { x: c.x, y: 5.32, w, h: 0.55, fontSize: 15, color: C.text2 });
  });
  texto(s, 'Eficiencia de flujo: cuánto del tiempo avanza la tarea y cuánto espera. Números del juego, promedio de 200 días.', { x: MARGEN, y: 5.95, w: 12.3, h: 0.4, fontSize: 13, color: C.text2 });
  texto(s, '¿Qué parte de su trabajo está esperando hoy?', { x: MARGEN, y: 6.35, w: 12.3, h: 0.5, fontSize: 19, fontFace: 'Lora', color: C.accent1 });
  nota(s, {
    dura: '3 minutos (0:16 a 0:19).',
    haces: 'Dos fotos del mismo juego a la misma hora. La barra de abajo de cada una es la vida de una tarea: cuánto avanza (teal) y cuánto espera (gris).',
    dices: '"Hay dos formas de mirar un día. Una mira a la persona: cuánto estuvo ocupada. La otra mira a la tarea: cuánto de su tiempo avanzó y cuánto esperó. A eso se le llama eficiencia de flujo. En el juego, con 2 tareas a la vez cada tarea avanza el 47 por ciento de su tiempo y tarda una hora. Con 9 avanza el 9 por ciento y tarda casi nueve horas. El resto del tiempo, espera." Y: "Con 9 cosas abiertas la mosca está ocupadísima, y aun así el trabajo pasa más tiempo esperando que avanzando."',
    preguntas: '"¿Qué parte de su trabajo está esperando hoy?"',
  });
}

// ---------- 9 · Idea 3: el límite depende de las esperas ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'Idea 3 · 3 minutos', 'El límite depende de las esperas');
  s.addChart(pres.ChartType.line, [
    { name: 'Sin ninguna espera', labels: LIMITES, values: SIN_ESPERAS },
    { name: 'Con las esperas del juego (1 de cada 5 tareas se traba)', labels: LIMITES, values: TERMINADAS },
  ], {
    x: MARGEN, y: 2.0, w: 7.4, h: 4.7, chartColors: ['9aa5b1', HEX.teal], lineSize: 3, lineDataSymbol: 'circle', lineDataSymbolSize: 8,
    catAxisLabelFontFace: '+mn-lt', catAxisLabelFontSize: 12, catAxisLabelColor: HEX.tinta,
    showCatAxisTitle: true, catAxisTitle: 'Tareas a la vez (el límite)', catAxisTitleFontFace: '+mn-lt', catAxisTitleFontSize: 12, catAxisTitleColor: HEX.suave,
    valAxisLabelFontFace: '+mn-lt', valAxisLabelFontSize: 11, valAxisLabelColor: HEX.suave, valAxisMinVal: 0, valAxisMaxVal: 24, valAxisMajorUnit: 6,
    showValAxisTitle: true, valAxisTitle: 'Terminadas en el día', valAxisTitleFontFace: '+mn-lt', valAxisTitleFontSize: 12, valAxisTitleColor: HEX.suave,
    valGridLine: { color: HEX.linea, size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontFace: '+mn-lt', legendFontSize: 12, legendColor: HEX.tinta,
    objectName: 'Terminadas según el límite, con y sin esperas (simulación)',
  });
  texto(s, 'En el juego, una de cada cinco tareas se traba entre 30 y 60 minutos esperando a otra persona. Por eso el mejor límite no es 1.', { x: 8.45, y: 2.05, w: 4.2, h: 1.5, fontSize: 15, color: C.text1 });
  s.addShape(pres.ShapeType.roundRect, { x: 8.45, y: 3.6, w: 4.2, h: 1.5, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: 'La regla de las esperas' });
  texto(s, 'Reducir las esperas permite bajar el límite. Subir el límite no reduce las esperas.', { x: 8.7, y: 3.7, w: 3.7, h: 1.3, fontSize: 17, fontFace: 'Lora', color: C.accent1, valign: 'middle' });
  pregunta(s, '¿A quién o a qué esperan más?', { x: 8.45, y: 5.3, w: 4.2, h: 1.4 });
  nota(s, {
    dura: '3 minutos (0:19 a 0:22).',
    haces: 'El gráfico es de la simulación: la línea gris es el juego sin ninguna tarea trabada, la teal es el juego de hoy. Son terminadas en el día, promedio de 200 días.',
    dices: '"En el juego, una de cada cinco tareas se traba entre 30 y 60 minutos esperando a otra persona. Por eso el mejor límite no es 1: en la simulación quedó entre 2 y 4 en 16 de 17 casos. De ahí sale la regla que más sirve: reducir las esperas permite bajar el límite. Subir el límite no reduce las esperas." Y: "Cuando alguien queda esperando y abre otra cosa para aprovechar el tiempo, la espera sigue ahí, y ahora hay una cosa más abierta."',
    preguntas: '"¿A quién o a qué esperan más?" Esa respuesta alimenta la pregunta 3 de la hoja del equipo.',
  });
}

// ---------- 10 · Idea 4: lo empezado no desaparece ----------
{
  const s = lamina('CLARA', 'Parte 2 · Conceptos', 'Idea 4 · 3 minutos', 'Lo empezado no desaparece');
  s.addChart(pres.ChartType.line, [{ name: 'Tareas abiertas', labels: HORAS, values: BAJAR }], {
    x: MARGEN, y: 2.0, w: 7.8, h: 4.7, chartColors: [HEX.teal], lineSize: 3.5, lineDataSymbol: 'none',
    catAxisLabelFontFace: '+mn-lt', catAxisLabelFontSize: 12, catAxisLabelColor: HEX.tinta,
    showCatAxisTitle: true, catAxisTitle: 'Hora del día en el juego', catAxisTitleFontFace: '+mn-lt', catAxisTitleFontSize: 12, catAxisTitleColor: HEX.suave,
    valAxisLabelFontFace: '+mn-lt', valAxisLabelFontSize: 11, valAxisLabelColor: HEX.suave, valAxisMinVal: 0, valAxisMaxVal: 10, valAxisMajorUnit: 2,
    showValAxisTitle: true, valAxisTitle: 'Tareas abiertas', valAxisTitleFontFace: '+mn-lt', valAxisTitleFontSize: 12, valAxisTitleColor: HEX.suave,
    valGridLine: { color: HEX.linea, size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false,
    objectName: 'Tareas abiertas al bajar el límite de 10 a 2 a las 12:00 (simulación)',
  });
  texto(s, [
    { text: 'A las 12:00 la mosca baja el límite de 10 a 2. Recién a las 14:35 queda con 2 cosas abiertas.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'En un equipo son días: la primera semana con un límite se siente más lenta.', options: { breakLine: true, bold: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Simulación, promedio de 200 días.', options: { color: C.text2, fontSize: 13 } },
  ], { x: 8.85, y: 2.05, w: 3.8, h: 3.1, fontSize: 15 });
  pregunta(s, '¿Qué tendrían que terminar antes de empezar algo nuevo?', { x: 8.85, y: 5.1, w: 3.8, h: 1.6, fontSize: 17 });
  nota(s, {
    dura: '3 minutos (0:22 a 0:25). Si vas atrasado, salta esta lámina y di solo la frase de la primera semana.',
    haces: 'Es la última idea. Cierra los conceptos con dos frases: "Estar siempre ocupado no es lo mismo que avanzar. Y la meta no es una cosa a la vez, es un límite que puedan sostener." Si alguien pide el número correcto, no lo des: sale en la práctica.',
    dices: '"En la simulación, si a las 12 del día la mosca baja el límite de 10 a 2, sigue con 10 cosas abiertas hasta terminar 8. Recién a las 2 y 35 de la tarde queda con 2. En un equipo son días: la primera semana con un límite se siente más lenta, porque primero se termina lo que ya estaba empezado."',
    preguntas: '"¿Qué tendrían que terminar antes de empezar algo nuevo?"',
  });
}

// =====================================================================================
pres.addSection({ title: 'Parte 3 · Práctica' });

// ---------- 11 · La hoja del equipo ----------
{
  const s = lamina('CLARA', 'Parte 3 · Práctica', 'La hoja del equipo · 25 minutos', 'Tres preguntas y una fecha');
  const filas = [
    `Hoy tenemos ${subrayado(6)} tareas empezadas (contadas como tarjetas del tablero).`,
    `Nuestro límite para partir: ${subrayado(6)}`,
    `Cuando algo quede esperando, en vez de empezar otra cosa, vamos a: ${subrayado(18)}`,
    `Lo probamos 2 semanas y lo revisamos el ${subrayado(14)}`,
  ];
  filas.forEach((f, i) => {
    const y = 2.1 + i * 1.15;
    texto(s, String(i + 1), { x: MARGEN, y, w: 0.6, h: 0.9, fontSize: 30, fontFace: 'Lora', color: C.accent1, bold: true });
    texto(s, f, { x: MARGEN + 0.8, y: y + 0.08, w: 11.1, h: 0.95, fontSize: 21, color: C.text1 });
    if (i < filas.length - 1) s.addShape(pres.ShapeType.line, { x: MARGEN, y: y + 1.06, w: ANCHO - 2 * MARGEN, h: 0, line: { color: HEX.linea, width: 0.75 } });
  });
  nota(s, {
    dura: '25 minutos (0:25 a 0:50): 5 para la pregunta 1, 8 para la 2, 7 para la 3 y 5 para la fecha.',
    haces: 'Aquí se decide si la sesión sirvió. El equipo deja la mosca y trabaja sobre su propio trabajo, en la hoja impresa (página 10 del manual). Tú guías con el reloj y haces preguntas. No propongas el número. Deja esta lámina puesta toda la práctica.',
    dices: 'Pregunta 1: "Saquen el post-it. Juntemos las tareas empezadas del equipo, contadas como tarjetas del tablero: si dos personas tienen la misma, cuenta una vez. Escríbanlo tal cual, sin arreglarlo." Pregunta 2: "No busquen el número perfecto. Busquen uno un poco menor que el de hoy, que les incomode un poco y que puedan sostener dos semanas. Después lo ajustan con sus datos." Dilo así: la simulación es de una mosca sola y no da un número para equipos. Para una persona sola: 1 o 2 si casi nada espera, 2 si algo espera y 3 si mucho espera. Pregunta 3: "Cuando lleguen al límite y lo suyo esté esperando, ¿qué van a hacer en vez de empezar otra cosa? Escríbanlo como una acción": ayudar a destrabar, pedir ayuda o terminar algo empezado. La fecha: "Dos semanas y una fecha, en una reunión que ya tengan."',
    preguntas: 'Según el grupo: con 5 a 6 personas, una sola hoja. Con 10 a 12, dos grupos proponen un límite y el equipo elige uno. Si empatan, el más bajo. Con líderes, sus tareas son proyectos o iniciativas, la mosca es una analogía (dilo así) y la prueba dura cuatro semanas. Si discuten mucho el número, pide el más bajo que todos acepten probar dos semanas.',
  });
}

// =====================================================================================
pres.addSection({ title: 'Parte 4 · Cierre' });

// ---------- 12 · El cierre ----------
{
  const s = lamina('OSCURA_GRANDE', 'Parte 4 · Cierre', 'Para cerrar · 10 minutos', 'La hoja en voz alta.\nUna frase por persona.\nLa fecha al calendario.');
  texto(s, [
    { text: '¿Qué vas a hacer distinto mañana? Una frase cada uno, sin explicar.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Foto a la hoja y la revisión al calendario, antes de salir de la sala.', options: { bold: true, color: C.accent5 } },
  ], { x: MARGEN, y: 4.0, w: 10.6, h: 2.3, fontSize: 21, color: C.background2 });
  nota(s, {
    dura: '10 minutos (0:50 a 1:00): 2 para leer la hoja, 4 para la frase de cada uno, 2 para la fecha y la foto, 2 para la lámina 13.',
    haces: 'Una persona del equipo lee la hoja completa, las tres respuestas y la fecha. Después, una ronda: cada persona dice en una frase qué hará distinto mañana, sin explicar y sin discutir (en equipos grandes, una por grupo). La revisión se agenda ahí mismo, con todos invitados, y alguien le saca una foto a la hoja y la manda al grupo del equipo.',
    dices: '"Léanla entera, tal cual quedó." Luego: "Una frase cada uno: ¿qué vas a hacer distinto mañana?" Y al final: "Foto a la hoja y la revisión al calendario ahora. Si sale de la sala sin fecha, no pasa."',
    mas: 'Si se acabó el tiempo con la hoja a medias, cierra igual con la lectura y la fecha. Un límite escrito y una fecha valen más que una hoja perfecta sin fecha.',
  });
}

// ---------- 13 · Para saber más y créditos ----------
{
  const s = lamina('OSCURA', 'Parte 4 · Cierre', 'Para saber más · 2 minutos', 'El juego y el informe');
  const tarjetas = [
    { x: MARGEN, qr: 'qr-jugar.png', titulo: 'El juego', texto: 'Un día de oficina en un minuto. Gratis, sin registro, en el computador, el celular o la tablet.', url: 'mosca.deliverycraft.ai/jugar/' },
    { x: MARGEN + 3.6, qr: 'qr-informe.png', titulo: 'El informe', texto: 'De dónde sale cada número, los estudios con personas y cuatro pasos para probar un límite. Se lee en diez minutos.', url: 'mosca.deliverycraft.ai, botón “Descargar el informe”' },
  ];
  tarjetas.forEach((t) => {
    s.addShape(pres.ShapeType.roundRect, { x: t.x, y: 2.05, w: 3.35, h: 4.55, fill: { color: HEX.blanco }, line: { color: HEX.blanco, width: 0 }, rectRadius: 0.1, objectName: `Tarjeta ${t.titulo}` });
    s.addImage({ path: path.join(IMG, t.qr), x: t.x + 0.55, y: 2.3, w: 2.25, h: 2.25, objectName: `QR ${t.titulo}` });
    texto(s, t.titulo, { x: t.x + 0.3, y: 4.65, w: 2.75, h: 0.4, fontSize: 20, fontFace: 'Lora', bold: true, color: C.text1 });
    texto(s, t.texto, { x: t.x + 0.3, y: 5.05, w: 2.75, h: 0.9, fontSize: 11.5, color: C.text2 });
    texto(s, t.url, { x: t.x + 0.3, y: 5.95, w: 2.75, h: 0.55, fontSize: 11.5, bold: true, color: C.accent1 });
  });
  texto(s, [
    { text: 'El taller “Deja de empezar, empieza a terminar” es de Felipe Fernández, con licencia CC BY 4.0. Puedes usar y adaptar este taller, también en talleres pagados, citando a Felipe Fernández (mosca.deliverycraft.ai).', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Las cuatro partes de la sesión vienen de Sharon L. Bowman, Training from the BACK of the Room! 65 Ways to Step Aside and Let Them Learn (Pfeiffer, 2009).', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Los números del juego son el promedio de 200 días por cada límite, con la misma mosca y las mismas reglas. El juego no mide personas ni equipos: el número de tu equipo lo mide tu equipo.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Las neuronas del juego vienen del Male CNS v1.0 (FlyEM, HHMI Janelia; Universidad de Cambridge; MRC Laboratory of Molecular Biology; Google Research), con licencia CC BY 4.0. La actividad que se ve es simulada.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Si facilitas el taller y quieres contar cómo te fue: linkedin.com/in/felipefernandezandrade', options: { color: C.accent5 } },
  ], { x: 8.05, y: 2.05, w: 4.6, h: 4.6, fontSize: 12.5, color: 'c9d1d9' });
  nota(s, {
    dura: '2 minutos (0:58 a 1:00). Déjala puesta mientras se van: tiene los dos códigos.',
    dices: '"Lo que vieron hoy es un juego con una mosca. Lo que vale es su hoja y dos semanas de datos. Quien quiera saber de dónde sale cada número tiene el informe, que se lee en diez minutos, y el juego para volver a probar."',
    mas: 'Para ti, al salir: anota las preguntas que no supiste responder y los números de los dos días del juego. Confirma que la foto de la hoja llegó al grupo y que la revisión quedó en el calendario con todos invitados.',
  });
}

// ---------- Guardar y aplicar el tema ----------
(async () => {
  await pres.writeFile({ fileName: SALIDA });
  await applyTheme(SALIDA, THEME);
  console.log(`presentación lista: ${SALIDA} (${numero} láminas)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
