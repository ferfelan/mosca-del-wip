// Presentación de apoyo del taller "¿Cuántas cosas a la vez?" (Etapa 6.0, 2026-10-26).
// 14 láminas 16:9 en PowerPoint editable (se abre en Keynote y Google Slides), con el guion
// del facilitador en las notas de cada lámina. Sigue el orden de la guía (docs/contexto/taller.html):
// la guía dice "lámina N" y aquí N es exactamente esa lámina.
//   1 portada · 2 la pregunta · 3 la misión y cómo jugar (QR) · 4 la apuesta · 5 ronda 2 y el gráfico
//   de la sala · 6 el promedio de 200 días · 7 a 10 las cuatro ideas · 11 el canvas · 12 el experimento
//   13 la cosecha · 14 para saber más y créditos.
// Letras: Lora (títulos) y Figtree (texto), las dos de Google Fonts (OFL): Google Slides las trae;
// en PowerPoint y Keynote hay que tenerlas instaladas (en este Mac están en ~/Library/Fonts).
// Estilo: el de los informes y la guía (blanco, tinta #1d2532, teal #2f7579, papel #f3efe7).
// Se arma con (pptxgenjs está en node_modules del repo, instalado con --no-save):
//   NODE_PATH=node_modules node docs/contexto/taller-presentacion/armar.cjs
// Sale "2026-10-26 Taller - Presentación v1.pptx" en ~/Desktop/Mosca del WIP/.
// Después: validar, convertir a PDF y mirar cada lámina (ver docs/etapa6-0.md).
const path = require('node:path');
const os = require('node:os');
const pptxgen = require('pptxgenjs');
const { applyTheme } = require(path.join(os.homedir(), '.claude/skills/synced/9dc43800-5819-4ce7-8c29-f48b447a1e71_7effb68f-fc54-42de-a806-382cfa514daf/pptx/scripts/apply_theme.js'));

const REPO = path.resolve(__dirname, '../../..');
const IMG = path.join(REPO, 'docs/contexto/img');
const IMG_PRES = path.join(__dirname, 'img');
const FECHA = process.env.FECHA || '2026-10-26';
const VERSION = process.env.VERSION || 'v1';
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
  portada: 'fcfaf6', postit: 'f6e27a', grisBarra: 'e8e4dc', verdeClaro: 'e6f2ea',
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
pres.title = '¿Cuántas cosas a la vez? Un taller de 60 minutos con la Mosca del WIP';
pres.subject = 'Presentación de apoyo del taller (Etapa 6.0)';
pres.lang = 'es-CL';
const C = pres.SchemeColor;

const ANCHO = 13.333;
const MARGEN = 0.7;
const PIE = '¿Cuántas cosas a la vez? · un taller con la Mosca del WIP';

// ---------- Los marcos (layouts): claro, claro con pregunta grande, oscuro, oscuro grande y portada ----------
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
      { placeholder: { options: { name: 'title', type: 'title', x: MARGEN, y: 0.95, w: grande ? 10.6 : ANCHO - 2 * MARGEN, h: grande ? 2.6 : 1.0, fontSize: grande ? 44 : 34, bold: true, color: tinta, margin: 0, valign: 'top', align: 'left' }, text: 'Título' } },
      { text: { text: PIE, options: { x: MARGEN, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: gris, margin: 0, align: 'left' } } },
    ],
    slideNumber: { x: ANCHO - MARGEN - 0.8, y: 7.0, w: 0.8, h: 0.3, fontSize: 10, color: gris, align: 'right' },
  });
}
marco('CLARA', false, false);
marco('CLARA_GRANDE', false, true);
marco('OSCURA', true, false);
marco('OSCURA_GRANDE', true, true);
pres.defineSlideMaster({
  title: 'PORTADA',
  background: { color: HEX.portada },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.9, y: 1.7, w: 6.6, h: 2.6, fontSize: 60, bold: true, color: C.text1, margin: 0, valign: 'top', align: 'left' }, text: 'Título' } },
  ],
});

// ---------- Ayudas ----------
const texto = (slide, t, o) => slide.addText(t, { isTextBox: true, margin: 0, valign: 'top', align: 'left', color: C.text1, fontSize: 18, ...o });
const sombra = () => ({ type: 'outer', color: '000000', blur: 6, offset: 2, angle: 90, opacity: 0.16 });
const nota = (slide, lineas) => slide.addNotes(lineas.join('\n\n'));
const subrayado = (n) => '_'.repeat(n);
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

// ---------- 1 · Portada ----------
{
  const s = pres.addSlide({ masterName: 'PORTADA', sectionTitle: 'Inicio' });
  numero++;
  s.addText('¿Cuántas cosas a la vez?', { placeholder: 'title' });
  texto(s, 'Un taller de 60 minutos con la Mosca del WIP', { x: 0.9, y: 4.5, w: 6.85, h: 0.6, fontSize: 21, fontFace: 'Lora', color: C.accent1 });
  texto(s, 'Una hora para que el equipo juegue, mire sus propios resultados y decida cuántas cosas va a tener abiertas a la vez desde mañana.', { x: 0.9, y: 5.35, w: 6.2, h: 1.0, fontSize: 16, color: C.text2 });
  texto(s, 'Felipe Fernández · mosca.deliverycraft.ai · se puede usar y adaptar, CC BY 4.0', { x: 0.9, y: 6.7, w: 7.0, h: 0.35, fontSize: 12, color: C.text2 });
  s.addImage({ path: path.join(IMG_PRES, 'torre-web.png'), x: 7.75, y: 0.35, h: 6.9, w: 6.9 * (1680 / 2376), objectName: 'La mosca con su torre de carpetas' });
  nota(s, [
    'Esta lámina queda puesta mientras llega la gente. No hace falta presentarla.',
    'Cuando estén todos, parte directo con la pregunta de la lámina 2. La presentación es un apoyo: la sesión completa, minuto a minuto, está en la guía.',
  ]);
}

// =====================================================================================
pres.addSection({ title: 'Conexión' });

// ---------- 2 · La pregunta poderosa ----------
{
  const s = lamina('CLARA_GRANDE', 'Conexión', 'Conexión · 0:00 · tres minutos', '¿Cuántas cosas tienes empezadas y sin terminar hoy?');
  texto(s, 'Cuenta todo: tareas, correos que debes, cosas que esperan tu respuesta, lo que empezaste la semana pasada y sigue abierto.', { x: MARGEN, y: 3.6, w: 7.4, h: 1.2, fontSize: 19, color: C.text2 });
  texto(s, 'Escribe el número en un post-it y guárdalo. Se usa más tarde.', { x: MARGEN, y: 4.9, w: 7.4, h: 0.8, fontSize: 19, color: C.text1, bold: true });
  // El post-it
  s.addShape(pres.ShapeType.rect, { x: 9.3, y: 2.3, w: 3.1, h: 3.1, fill: { color: HEX.postit }, line: { color: HEX.postit, width: 0 }, rotate: 4, shadow: sombra(), objectName: 'Post-it' });
  texto(s, 'Hoy tengo', { x: 9.65, y: 2.85, w: 2.5, h: 0.5, fontSize: 18, color: '6b5d1c', rotate: 4 });
  s.addShape(pres.ShapeType.line, { x: 9.7, y: 3.95, w: 2.2, h: 0, line: { color: '6b5d1c', width: 2.25 }, rotate: 4, objectName: 'Raya para el número' });
  texto(s, 'cosas abiertas', { x: 9.65, y: 4.35, w: 2.5, h: 0.5, fontSize: 18, color: '6b5d1c', rotate: 4 });
  nota(s, [
    'Reparte un post-it y un plumón a cada persona. Cada una escribe un número y se lo guarda; no se comparte todavía, se usa en la práctica.',
    'Qué dices: "¿Cuántas cosas tienes empezadas y sin terminar hoy? Cuenta todo: tareas, correos que debes, cosas que esperan tu respuesta, lo que empezaste la semana pasada y sigue abierto. Escribe el número y guárdalo."',
    'Habla poco. La pregunta hace el trabajo.',
  ]);
}

// ---------- 3 · La misión y cómo jugar ----------
{
  const s = lamina('CLARA', 'Conexión', 'Conexión · 0:03 · un minuto', 'La misión: que la mosca termine lo más posible antes de las 18:00');
  s.addImage({ path: path.join(IMG, 'mundo-wip2.jpg'), x: MARGEN, y: 2.35, w: 6.4, h: 4.0, sizing: { type: 'cover', w: 6.4, h: 4.0 }, shadow: sombra(), objectName: 'La mosca en su oficina con el tablero' });
  texto(s, [
    { text: 'Un tablero con tres columnas: por hacer, en curso, hecho.', options: { breakLine: true } },
    { text: 'El control de abajo dice cuántas tareas puede tener empezadas a la vez, de 1 a 10.', options: { breakLine: true } },
    { text: 'Un día de oficina dura un minuto. En x4, quince segundos.' },
  ], { x: 7.5, y: 2.35, w: 5.1, h: 2.3, fontSize: 17, color: C.text1, paraSpaceAfter: 10 });
  s.addShape(pres.ShapeType.roundRect, { x: 7.5, y: 4.8, w: 5.1, h: 1.55, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: 'Cómo se juega' });
  s.addImage({ path: path.join(IMG, 'qr-jugar.png'), x: 7.65, y: 4.93, w: 1.3, h: 1.3, objectName: 'QR al juego' });
  texto(s, [
    { text: 'Elijan su límite, pongan x4 y aprieten Empezar. A las 18:00, lean “Terminadas”.', options: { breakLine: true, color: C.text1 } },
    { text: 'mosca.deliverycraft.ai/jugar/', options: { bold: true, color: C.accent1 } },
  ], { x: 9.1, y: 4.93, w: 3.4, h: 1.3, fontSize: 14, valign: 'middle' });
  nota(s, [
    'Explica solo lo que hace falta para jugar. Lo demás sale solo cuando jueguen.',
    'Qué dices: "Esta mosca trabaja en una oficina con un tablero de tres columnas: por hacer, en curso, hecho. El control de abajo dice cuántas tareas puede tener empezadas a la vez, de 1 a 10. La misión es que termine lo más posible antes de las seis de la tarde. Un día de oficina dura un minuto."',
    'Deja esta lámina puesta mientras juegan la ronda 1: tiene el QR y los tres pasos. La duda más común es dónde está el control (en la hoja de abajo del celular) y cómo subir la velocidad (tocar "x1" dos veces, arriba a la derecha).',
  ]);
}

// ---------- 4 · La apuesta ----------
{
  const s = lamina('CLARA_GRANDE', 'Conexión', 'Conexión · 0:04 · dos minutos · la apuesta', '¿Con cuántas tareas a la vez termina más la mosca?');
  const paso = (ANCHO - 2 * MARGEN - 9 * 0.14) / 10;
  LIMITES.forEach((n, i) => {
    const x = MARGEN + i * (paso + 0.14);
    s.addShape(pres.ShapeType.roundRect, { x, y: 3.6, w: paso, h: 1.1, fill: { color: C.background2 }, line: { color: HEX.linea, width: 0.75 }, rectRadius: 0.08, objectName: `Número ${n}` });
    texto(s, n, { x, y: 3.6, w: paso, h: 1.1, fontSize: 30, fontFace: 'Lora', color: C.text1, align: 'center', valign: 'middle' });
  });
  texto(s, 'Un número por pareja, en un post-it. Va a la zona “Apuesta” de la pizarra. Nadie pierde nada: es para comparar después.', { x: MARGEN, y: 5.1, w: 11.9, h: 1.0, fontSize: 19, color: C.text2 });
  nota(s, [
    'Arma las parejas. Cada pareja escribe en un post-it el número con el que cree que la mosca termina más tareas en el día, de 1 a 10, y lo pega en la pizarra, en una zona aparte que diga "Apuesta". Esta es la medición "antes"; se repite al final (lámina 13).',
    'Qué dices: "Antes de jugar, apuesten. ¿Con cuántas tareas a la vez creen que la mosca termina más en el día? Un número por pareja. Nadie pierde nada, es para comparar después."',
    'Si una pareja dice "depende", pide un número igual: la gracia es compararlo después con lo que vieron.',
  ]);
}

// ---------- 5 · Ronda 2 y el gráfico de la sala ----------
{
  const s = lamina('CLARA', 'Conexión', 'Conexión · 0:10 · cinco minutos', 'Ronda 2: esta vez el límite lo reparto yo');
  texto(s, 'Entre las dos rondas quedan cubiertos el 1, el 10 y varios del medio. Si una pareja ya jugó con un número, no se lo repito.', { x: MARGEN, y: 2.1, w: 5.6, h: 1.0, fontSize: 17, color: C.text1 });
  const celda = (t, o = {}) => ({ text: t, options: { fontFace: 'Figtree', fontSize: 15, color: HEX.tinta, margin: [0.06, 0.1, 0.06, 0.1], valign: 'middle', ...o } });
  s.addTable([
    [celda('Parejas en la sala', { bold: true, color: HEX.teal, fill: { color: HEX.papel } }), celda('Límites de la ronda 2', { bold: true, color: HEX.teal, fill: { color: HEX.papel } })],
    [celda('3 parejas'), celda('1 · 5 · 10')],
    [celda('4 o 5 parejas'), celda('1 · 3 · 6 · 8 · 10')],
    [celda('6 parejas'), celda('1 · 2 · 4 · 6 · 8 · 10')],
  ], { x: MARGEN, y: 3.25, w: 5.6, colW: [2.2, 3.4], rowH: 0.46, border: { type: 'solid', pt: 0.75, color: HEX.linea }, objectName: 'Reparto de límites' });
  texto(s, 'Un post-it por día: el límite y las terminadas. Los dos van al gráfico de la sala.', { x: MARGEN, y: 5.5, w: 5.6, h: 0.9, fontSize: 17, color: C.text1, bold: true });
  // El gráfico de la sala en chico: el límite abajo, las terminadas en la altura
  const gx = 7.5, gy = 2.15, gw = 5.1, gh = 3.6;
  const col = gw / 10;
  for (let i = 0; i <= 10; i++) s.addShape(pres.ShapeType.line, { x: gx + i * col, y: gy, w: 0, h: gh, line: { color: i === 0 ? HEX.tinta : HEX.linea, width: i === 0 ? 1.25 : 0.75 } });
  for (let j = 0; j <= 4; j++) {
    const y = gy + gh - (j * gh) / 4;
    s.addShape(pres.ShapeType.line, { x: gx, y, w: gw, h: 0, line: { color: j === 0 ? HEX.tinta : HEX.linea, width: j === 0 ? 1.25 : 0.75 } });
    texto(s, String(j * 6), { x: gx - 0.45, y: y - 0.12, w: 0.35, h: 0.25, fontSize: 11, color: C.text2, align: 'right' });
  }
  LIMITES.forEach((n, i) => texto(s, n, { x: gx + i * col, y: gy + gh + 0.06, w: col, h: 0.25, fontSize: 12, color: C.text1, align: 'center', bold: true }));
  // Un post-it de ejemplo: 2 tareas a la vez, 17 terminadas
  const ex = gx + 1 * col + col / 2 - 0.26, ey = gy + gh - (17 / 24) * gh - 0.26;
  s.addShape(pres.ShapeType.rect, { x: ex, y: ey, w: 0.52, h: 0.52, fill: { color: HEX.postit }, line: { color: HEX.postit, width: 0 }, rotate: -5, shadow: sombra(), objectName: 'Post-it de ejemplo' });
  texto(s, '2 · 17', { x: ex, y: ey, w: 0.52, h: 0.52, fontSize: 10, color: '6b5d1c', align: 'center', valign: 'middle', rotate: -5, bold: true });
  texto(s, 'Tareas a la vez (el límite) abajo. Terminadas en el día, en la altura. El post-it de ejemplo dice “2 tareas, 17 terminadas”.', { x: gx - 0.45, y: gy + gh + 0.4, w: gw + 0.45, h: 0.6, fontSize: 12, color: C.text2 });
  texto(s, 'Terminadas', { x: gx - 0.45, y: gy - 0.35, w: 2, h: 0.25, fontSize: 11, color: C.text2 });
  nota(s, [
    'Asigna a cada pareja un número para que entre las dos rondas queden cubiertos el 1 y el 10 y varios del medio. Si una pareja ya jugó con 2, no le repitas el 2.',
    'Cuando terminen, cada pareja pega sus dos post-its en el gráfico de la pared: el número de tareas a la vez va en la línea de abajo y las terminadas, en la altura. Deja que lo miren un momento antes de decir nada.',
    'Qué dices: "Miren la forma. ¿Dónde está lo más alto? ¿Qué pasa hacia la derecha? ¿Alguien quedó sorprendido con su apuesta?"',
    'Si sale un resultado raro (con 8 alguien terminó más que con 3), sirve: "Un día no prueba nada. Por eso el promedio del juego sale de 200 días, y por eso el experimento de ustedes dura dos semanas."',
  ]);
}

// =====================================================================================
pres.addSection({ title: 'Conceptos' });

// ---------- 6 · El promedio de 200 días ----------
{
  const s = lamina('CLARA', 'Conceptos', 'Conceptos · 0:15', 'En el juego, con 2 tareas a la vez termina 18.\nCon 9, la mitad.');
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
    { text: 'Comparen la forma con su gráfico de la pared.', options: { breakLine: true, bold: true, color: C.text1 } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Verde: el límite con el que más termina. Rojo: con esos límites la mosca termina el día colapsada, en el juego.', options: { color: C.text2, fontSize: 14 } },
  ], { x: 9.3, y: 2.1, w: 3.3, h: 4.6, fontSize: 16 });
  nota(s, [
    'Pon esta lámina al lado del gráfico de la sala. En el juego, con 2 tareas a la vez la mosca termina 18 en el día; con 9 termina 9, aunque está ocupada todo el día. Con 1 termina 15,9, porque a veces se queda sin qué hacer mientras espera.',
    'Qué dices: "Comparen su gráfico con el del juego. ¿Se parece la forma? Con 2 tareas a la vez termina 18 y con 9 termina la mitad."',
    'Pregunta para la sala: ¿al número de qué pareja se parece más su trabajo de verdad?',
    'Si alguien pregunta por qué el 1 termina menos que el 2: en el juego una de cada cinco tareas se traba esperando a otra persona; con una sola cosa abierta, la mosca se queda parada una cuarta parte del día.',
  ]);
}

// ---------- 7 · Idea 1: qué es el WIP y qué es un límite ----------
{
  const s = lamina('CLARA', 'Conceptos', 'Conceptos · idea 1 · tres minutos', 'WIP: lo que ya empezaste y todavía no terminas');
  texto(s, [
    { text: 'WIP es la sigla en inglés de trabajo en curso.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Un límite de WIP es un número: cuántas cosas pueden estar empezadas al mismo tiempo. Cuando se llega al número, no se empieza otra hasta terminar una.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Es lo que le pusieron a la mosca con el control.', options: { color: C.text2 } },
  ], { x: MARGEN, y: 2.1, w: 5.4, h: 4.4, fontSize: 18 });
  // Un tablero en chico: por hacer, en curso (límite 3), hecho
  const columnas = [
    { titulo: 'Por hacer', x: 6.75, cartas: 5, estilo: 'gris' },
    { titulo: 'En curso', x: 8.75, cartas: 3, estilo: 'teal', badge: '3 de 3' },
    { titulo: 'Hecho', x: 10.75, cartas: 4, estilo: 'verde' },
  ];
  columnas.forEach((c) => {
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 2.1, w: 1.85, h: 4.4, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: `Columna ${c.titulo}` });
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
  nota(s, [
    'Qué dices: "WIP es la sigla en inglés de trabajo en curso: todo lo que ya empezaste y todavía no terminas. Un límite de WIP es un número, cuántas cosas pueden estar empezadas al mismo tiempo. Cuando se llega al número, no se empieza otra hasta terminar una. Eso es lo que ustedes le pusieron a la mosca con el control."',
    'El tablero de la derecha es el mismo del juego: por hacer, en curso con su límite, hecho. Si el grupo ya trabaja con un tablero, pregunta dónde pondrían el número.',
    'Máximo tres minutos. El riesgo de esta parte es dar una clase.',
  ]);
}

// ---------- 8 · Idea 2: estar ocupado no es lo mismo que avanzar ----------
{
  const s = lamina('CLARA', 'Conceptos', 'Conceptos · idea 2 · cuatro minutos', 'Estar siempre ocupado no es lo mismo que avanzar');
  const casos = [
    { x: MARGEN, foto: 'escena-wip2.jpg', titulo: '2 tareas a la vez', avanza: 0.47, frase: 'Cada tarea avanza el 47 % de su tiempo. Tarda una hora.' },
    { x: 6.85, foto: 'escena-wip9.jpg', titulo: '9 tareas a la vez', avanza: 0.09, frase: 'Cada tarea avanza el 9 % de su tiempo. Tarda casi nueve horas.' },
  ];
  casos.forEach((c) => {
    const w = 5.8;
    s.addImage({ path: path.join(IMG, c.foto), x: c.x, y: 2.0, w, h: 2.7, sizing: { type: 'cover', w, h: 2.7 }, shadow: sombra(), objectName: `La oficina con ${c.titulo}` });
    texto(s, c.titulo, { x: c.x, y: 4.8, w, h: 0.35, fontSize: 17, bold: true, color: C.text1 });
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 5.22, w, h: 0.36, fill: { color: HEX.grisBarra }, line: { color: HEX.grisBarra, width: 0 }, rectRadius: 0.05, objectName: `Tiempo de la tarea con ${c.titulo}` });
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 5.22, w: w * c.avanza, h: 0.36, fill: { color: C.accent1 }, line: { color: HEX.teal, width: 0 }, rectRadius: 0.05, objectName: `Tiempo que avanza con ${c.titulo}` });
    texto(s, 'avanza', { x: c.x + 0.1, y: 5.22, w: 1.2, h: 0.36, fontSize: 11, color: C.background1, valign: 'middle', bold: true });
    texto(s, 'espera', { x: c.x + w - 1.0, y: 5.22, w: 0.9, h: 0.36, fontSize: 11, color: C.text2, valign: 'middle', align: 'right' });
    texto(s, c.frase, { x: c.x, y: 5.68, w, h: 0.7, fontSize: 15, color: C.text2 });
  });
  texto(s, 'En los dos casos la mosca está ocupada todo el día. Lo que cambia es cuánto espera el trabajo. Números del juego, promedio de 200 días.', { x: MARGEN, y: 6.45, w: 12.3, h: 0.4, fontSize: 13, color: C.text2 });
  nota(s, [
    'Qué dices: "Hay dos formas de mirar un día de trabajo. Una mira a la persona: cuánto de su hora estuvo ocupada. La otra mira a la tarea: cuánto de su vida avanzó y cuánto esperó. En el juego, con 9 tareas a la vez la mosca está ocupada todo el día y cada tarea avanza el 9 por ciento de su tiempo. El resto espera. Con 2 a la vez, cada tarea avanza el 47 por ciento de su tiempo y tarda una hora en vez de casi nueve."',
    '"Con 9 cosas abiertas la mosca no está floja. Está ocupadísima. Pero el trabajo pasa más tiempo esperando que avanzando."',
    'Pregunta para la sala: piensen en la última cosa que terminaron. De todo el tiempo que estuvo abierta, ¿cuánto fue trabajo y cuánto fue espera?',
  ]);
}

// ---------- 9 · Idea 3: el límite depende de las esperas ----------
{
  const s = lamina('CLARA', 'Conceptos', 'Conceptos · idea 3 · cuatro minutos', 'El límite depende de las esperas');
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
  texto(s, [
    { text: 'En el juego, una de cada cinco tareas se traba entre 30 y 60 minutos esperando a otra persona.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Sin esperas, el mejor límite es 1. Con las esperas del juego, 2. En la simulación, con esperas el mejor límite quedó entre 2 y 4 en 16 de 17 casos.', options: { color: C.text2 } },
  ], { x: 8.45, y: 2.05, w: 4.2, h: 2.6, fontSize: 15 });
  s.addShape(pres.ShapeType.roundRect, { x: 8.45, y: 4.75, w: 4.2, h: 1.95, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: 'La regla de las esperas' });
  texto(s, 'Reducir las esperas permite bajar el límite. Subir el límite no reduce las esperas.', { x: 8.7, y: 4.85, w: 3.7, h: 1.75, fontSize: 19, fontFace: 'Lora', color: C.accent1, valign: 'middle' });
  nota(s, [
    'Qué dices: "En el juego, una de cada cinco tareas se traba entre 30 y 60 minutos: la mosca necesita algo de otra persona y espera. Por eso tener solo una cosa abierta no es lo mejor para ella. En la simulación, con esas esperas el mejor límite está entre 2 y 4 en 16 de los 17 casos que se probaron. Sin ninguna espera, el mejor límite es 1."',
    '"De ahí sale la regla que más sirve: reducir las esperas permite bajar el límite. Subir el límite no reduce las esperas. Cuando alguien queda esperando y abre otra cosa para aprovechar el tiempo, la espera sigue ahí, y ahora hay una cosa más abierta."',
    'Pregunta para la sala: ¿dónde esperan más sus tareas? ¿A quién o a qué? Esa respuesta alimenta el punto 2 del canvas.',
    'El gráfico es de la simulación: la curva gris es el juego sin ninguna tarea trabada; la teal, el juego de hoy. Son terminadas en el día, promedio de 200 días.',
  ]);
}

// ---------- 10 · Idea 4: lo empezado no desaparece ----------
{
  const s = lamina('CLARA', 'Conceptos', 'Conceptos · idea 4 · tres minutos', 'Lo empezado no desaparece');
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
    { text: 'La mosca pasa la mañana con 10 tareas abiertas. A las 12:00 baja el límite a 2.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'No pasa nada de inmediato. Vuelve a tener 2 cosas abiertas a las 14:35 y está tranquila a las 15:07.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'En un equipo son días: la primera semana con un límite se siente más lenta, porque primero se termina lo que ya estaba empezado.', options: { breakLine: true, bold: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Simulación, promedio de 200 días.', options: { color: C.text2, fontSize: 13 } },
  ], { x: 8.85, y: 2.05, w: 3.8, h: 4.6, fontSize: 15 });
  nota(s, [
    'Qué dices: "En la simulación, si a las 12 del día la mosca baja el límite de 10 a 2, no pasa nada de inmediato. Sigue con 10 cosas abiertas hasta que termina 8. Recién a las 2 y 35 de la tarde queda con 2, y a las 3 y 7 vuelve a estar tranquila. El cambio tarda más de dos horas en notarse."',
    '"En un equipo pasa lo mismo. La primera semana con un límite se siente más lenta, porque primero hay que terminar lo que ya estaba empezado. Eso no es que el límite falle. Es que lo empezado no desaparece."',
    'Pregunta para la sala: si mañana ponen un límite, ¿cuántos días tardarían en bajar hasta él?',
    'Cierre de los conceptos, un minuto: "Dos frases para llevarse. Estar siempre ocupado no es lo mismo que avanzar. Y la meta no es una cosa a la vez: es un límite sostenible para ustedes, con las esperas que tienen hoy." Si alguien pide el número correcto, no lo des: viene en los veinte minutos de práctica.',
  ]);
}

// =====================================================================================
pres.addSection({ title: 'Práctica' });

// ---------- 11 · El canvas ----------
{
  const s = lamina('CLARA', 'Práctica', 'Práctica · 0:30 · veinte minutos · el canvas', 'Nuestro límite');
  const filas = [
    `Hoy tenemos ${subrayado(6)} cosas empezadas y sin terminar.`,
    `De esas, ${subrayado(6)} están esperando a otra persona o a otro equipo. Dónde esperan más: ${subrayado(16)}`,
    `Nuestro límite inicial: ${subrayado(6)}`,
    `Nuestra regla cuando algo queda esperando: en vez de empezar otra cosa, vamos a ${subrayado(22)}`,
    `Nuestro experimento: lo probamos hasta el ${subrayado(12)} y lo revisamos en ${subrayado(16)}`,
  ];
  filas.forEach((f, i) => {
    const y = 2.05 + i * 0.92;
    texto(s, String(i + 1), { x: MARGEN, y, w: 0.6, h: 0.8, fontSize: 28, fontFace: 'Lora', color: C.accent1, bold: true });
    texto(s, f, { x: MARGEN + 0.75, y: y + 0.05, w: 11.15, h: 0.8, fontSize: 18, color: C.text1 });
    if (i < filas.length - 1) s.addShape(pres.ShapeType.line, { x: MARGEN, y: y + 0.86, w: ANCHO - 2 * MARGEN, h: 0, line: { color: HEX.linea, width: 0.75 } });
  });
  nota(s, [
    'Aquí se decide si la sesión sirvió. El equipo deja la mosca y trabaja sobre su propio trabajo abierto, con los post-its del inicio y el canvas impreso (página 13 de la guía). Tú guías con el reloj y haces preguntas; no propongas el número.',
    '0:30, lo que hay abierto hoy (3 min): "Saquen el post-it. Sumen. Ese número es lo que el equipo tiene empezado y sin terminar hoy. Escríbanlo tal cual."',
    '0:33, lo que está esperando (4 min): "De esas cosas, ¿cuántas no avanzan porque esperan a alguien? ¿Y cuál es la espera que más se repite?"',
    '0:37, el límite inicial (5 min): la simulación es de una mosca sola y no da un número para equipos. Para un equipo, el punto de partida es lo que tienen abierto hoy, un poco menos, y bajarlo de a poco con datos. Para una persona sola, la simulación da un punto de partida: 1 o 2 si casi nada espera, 2 si algo espera y 3 si mucho espera. "No busquen el número perfecto. Busquen uno que puedan sostener dos semanas."',
    '0:42, la regla (4 min): "Cuando lleguen al límite y lo suyo esté esperando, ¿qué van a hacer en vez de abrir otra cosa? Escríbanlo como una acción": ayudar a destrabar, pedir ayuda, terminar algo ya empezado.',
    '0:46, el experimento (4 min): hasta qué fecha y en qué reunión lo revisan. Lo normal es dos semanas y la revisión que ya tienen. Pasa a la lámina 12. Equipos de 10 a 12: dos o tres subgrupos proponen un límite y el equipo elige uno; si empatan, el más bajo. Líderes: su trabajo abierto son proyectos, la mosca es una analogía y el experimento dura cuatro semanas.',
  ]);
}

// ---------- 12 · El experimento ----------
{
  const s = lamina('CLARA', 'Práctica', 'Después del taller · dos semanas', 'El experimento, dentro de lo que ya hacen');
  const pasos = [
    'El límite escrito en la columna “En curso” del tablero, a la vista de todos.',
    'En la reunión diaria, diez segundos: ¿cuántas cosas hay abiertas? El número va a la tabla.',
    'Al empezar algo, la fecha. Al terminarlo, cuántos días tardó. Si algo esperó, a quién.',
    'En la revisión de cada dos semanas se decide con la tabla: mantener, bajar o subir.',
  ];
  pasos.forEach((p, i) => {
    const y = 2.05 + i * 1.08;
    texto(s, String(i + 1), { x: MARGEN, y, w: 0.6, h: 0.9, fontSize: 28, fontFace: 'Lora', color: C.accent1, bold: true });
    texto(s, p, { x: MARGEN + 0.75, y: y + 0.05, w: 6.9, h: 0.95, fontSize: 18, color: C.text1 });
    if (i < pasos.length - 1) s.addShape(pres.ShapeType.line, { x: MARGEN, y: y + 1.0, w: 7.65, h: 0, line: { color: HEX.linea, width: 0.75 } });
  });
  s.addShape(pres.ShapeType.roundRect, { x: 8.9, y: 2.1, w: 3.75, h: 1.5, fill: { color: C.background2 }, line: { color: HEX.papel, width: 0 }, rectRadius: 0.08, objectName: 'Qué esperar' });
  texto(s, [
    { text: 'Qué esperar', options: { bold: true, breakLine: true, color: C.accent1 } },
    { text: 'La primera semana puede sentirse más lenta. Primero se termina lo que ya estaba empezado.', options: {} },
  ], { x: 9.15, y: 2.3, w: 3.3, h: 1.2, fontSize: 15, color: C.text1 });
  texto(s, [
    { text: 'Para la revisión', options: { bold: true, breakLine: true, color: C.text1 } },
    { text: '¿Cuántos días pasamos el límite, y por qué? ¿Cuánto tardó cada cosa en salir, comparado con antes? Cuando algo esperó, ¿qué hicimos de verdad? ¿Qué espera se repitió más?', options: { color: C.text2 } },
  ], { x: 9.15, y: 3.9, w: 3.3, h: 2.2, fontSize: 14 });
  nota(s, [
    'El experimento no agrega reuniones. Usa el tablero que el equipo ya tiene, su reunión diaria y su revisión de cada dos semanas. Entrégales la tabla del experimento (página 15 de la guía): diez días hábiles, con abiertas hoy, terminadas hoy, si algo esperó y una nota.',
    'Qué dices: "Esto entra en lo que ya hacen. El límite escrito en el tablero, diez segundos en la reunión diaria para contar cuántas cosas hay abiertas, y la fecha al empezar y los días al terminar. En dos semanas, en su revisión, deciden con la tabla sobre la mesa."',
    'Avisa que la primera semana puede sentirse más lenta: en la simulación, bajar de 10 a 2 a mediodía tarda dos horas y media en volver a 2 cosas abiertas. En un equipo son días.',
    'La decisión al final: si el límite se pasó muchas veces por razones reales, subirlo en uno y anotar las razones; si nunca se llegó al límite, bajarlo en uno; si se cumplió y las cosas tardaron menos, mantenerlo dos semanas más y después probar uno menos. Para líderes, cuatro semanas y dos copias de la tabla.',
  ]);
}

// =====================================================================================
pres.addSection({ title: 'Conclusión' });

// ---------- 13 · La cosecha ----------
{
  const s = lamina('OSCURA_GRANDE', 'Conclusión', 'Conclusión · 0:50 · diez minutos · la cosecha', `Nuestro límite es ${subrayado(6)}\ny cuando algo espere\nvamos a ${subrayado(14)}`);
  texto(s, [
    { text: 'Una frase por persona, sin explicar.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Después, la apuesta otra vez: ¿con cuántas tareas a la vez termina más la mosca? El post-it nuevo va al lado del primero.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Foto al canvas y la revisión al calendario, antes de salir de la sala.', options: { bold: true, color: C.accent5 } },
  ], { x: MARGEN, y: 3.8, w: 10.4, h: 2.5, fontSize: 19, color: C.background2 });
  nota(s, [
    '0:50, la cosecha (4 min): una ronda rápida. Cada persona completa la frase en voz alta. En equipos grandes, una persona por subgrupo. "Nuestro límite es… y cuando algo espere vamos a… Una frase por persona, sin explicar."',
    '0:54, la apuesta otra vez (2 min): repite la pregunta del inicio. Cada pareja escribe de nuevo con qué límite cree que la mosca termina más y lo pega al lado de su primer post-it. Cuenta en voz alta cuántas parejas cambiaron su número: ese es el antes y después de la sesión.',
    '0:56, la foto y la fecha (2 min): alguien del equipo le saca una foto al canvas y la manda al grupo del equipo. La fecha de revisión se agenda ahí mismo, antes de que se paren. "Si sale de la sala sin fecha, no pasa."',
    'Si se acabó el tiempo y el canvas está a medias, cierra igual con la cosecha y la fecha. Un límite escrito y una fecha valen más que un canvas perfecto sin fecha.',
  ]);
}

// ---------- 14 · Para saber más y créditos ----------
{
  const s = lamina('OSCURA', 'Conclusión', 'Para saber más · 0:58', 'El juego, el informe y los créditos');
  const tarjetas = [
    { x: MARGEN, qr: 'qr-jugar.png', titulo: 'El juego', texto: 'Un día de oficina en un minuto. Gratis, sin registro, en el computador o el celular.', url: 'mosca.deliverycraft.ai/jugar/' },
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
    { text: 'El taller “¿Cuántas cosas a la vez?” es de Felipe Fernández, con licencia CC BY 4.0. Puedes usar y adaptar este taller, también en talleres pagados, citando a Felipe Fernández (mosca.deliverycraft.ai).', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Las cuatro partes de la sesión vienen de Sharon L. Bowman, Training from the BACK of the Room! 65 Ways to Step Aside and Let Them Learn (Pfeiffer, 2009).', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Los números del juego son el promedio de 200 días por cada límite, con la misma mosca y las mismas reglas. El juego no mide personas ni equipos: el número de tu equipo lo mide tu equipo.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Las neuronas del juego vienen del Male CNS v1.0 (FlyEM, HHMI Janelia; Universidad de Cambridge; MRC Laboratory of Molecular Biology; Google Research), con licencia CC BY 4.0. La actividad que se ve es simulada.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 7 } },
    { text: 'Si facilitas el taller y quieres compartir los resultados de la apuesta, sin nombres: linkedin.com/in/felipefernandezandrade', options: { color: C.accent5 } },
  ], { x: 8.05, y: 2.05, w: 4.6, h: 4.6, fontSize: 12.5, color: 'c9d1d9' });
  nota(s, [
    'Qué dices: "Lo que probaron hoy es un juego con una mosca. Lo que vale es lo que escribieron: su límite, su regla y dos semanas de datos. Quien quiera saber de dónde sale cada número tiene el informe en el QR, se lee en diez minutos."',
    'Deja esta lámina puesta mientras se van: tiene los dos QR.',
    'Para ti, al salir: anota cuántas parejas cambiaron su apuesta y los números de las dos rondas; confirma que la foto del canvas llegó al grupo y que la revisión quedó en el calendario.',
  ]);
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
