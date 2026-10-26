// Textos del juego en español e inglés (2026-10-24, pedido de Felipe: "que
// esté en español o inglés").
//
// Todo lo que se traduce está en este archivo, para revisar las dos versiones
// juntas:
// 1. PAGINA: los textos fijos de jugar/index.html. A la izquierda, el español
//    tal como está escrito allá; a la derecha, su inglés.
// 2. BLOQUES: trozos de la página que se cambian enteros, porque traen teclas
//    (<kbd>) o porque en inglés las palabras van en otro orden.
// 3. TEXTOS: los que arma el juego mientras se juega (el panel, el resumen,
//    el cerebro, el gráfico, el kanban, el póster y los post-its), con el
//    español y el inglés lado a lado.
// 4. NIVELES y ZONAS: el español viene de src/brain.js (niveles de estrés) y
//    de public/cerebro/malecns-info.json (zonas del cerebro); aquí va su inglés.
// El español nunca se traduce de vuelta: la página guarda sus textos tal como
// venían y los repone iguales. Las mismas palabras de la portada; glosario en
// docs/glosario-ingles.md.

// ---------- 1. Textos fijos de la página (español tal cual → inglés) ----------
export const PAGINA = {
  // Barra de la exhibición y rótulos sobre la escena
  'La misma partida, en grande': 'The same game, on the big screen',
  'Día terminado ·': 'Day over ·',
  'En vivo': 'Live',
  'Muchas tareas a la vez': 'Many tasks at once',
  'Vista inicial': 'Reset view',
  'Volver la oficina a su vista inicial (también con doble clic en la escena)':
    'Back to the starting view of the office (or double-click the scene)',
  // Tarjeta "Estado de la mosca" (exhibición)
  'Estado de la mosca': 'How the fly is doing',
  Tranquila: 'Calm',
  'Nivel de estrés': 'Stress level',
  Trabajando: 'Working',
  // Resumen del fin del día (exhibición)
  'Fin del día': 'End of the day',
  'Comparación de los días': 'Comparing the days',
  Terminadas: 'Finished',
  Tiempo: 'Time',
  'por tarea': 'per task',
  'Tiempo por tarea, en horas y minutos del juego': 'Time per task, in game hours and minutes',
  Colillas: 'Cigarettes',
  Cafés: 'Coffees',
  Estrés: 'Stress',
  // Panel de controles
  'Día de oficina · 09:00 a 18:00': 'Office day · 09:00 to 18:00',
  'Ocultar los controles (tecla C)': 'Hide the controls (key C)',
  'Ocultar el panel de controles': 'Hide the controls panel',
  'Tareas en curso a la vez': 'Tasks in progress at once',
  'Dentro del límite sostenible': 'Within the sustainable limit',
  Hora: 'Time',
  Pausa: 'Pause',
  Velocidad: 'Speed',
  'Reiniciar día': 'Restart day',
  'Tiempo por tarea': 'Time per task',
  'Tiempo promedio (del juego) desde que una tarea entra a «En curso» hasta que se termina. Con más tareas a la vez, cada una tarda más (Ley de Little).':
    'Average time (in the game) from when a task enters “In progress” until it’s finished. With more tasks at once, each one takes longer (Little’s Law).',
  Eficiencia: 'Efficiency',
  'de cada hora': 'of every hour',
  'De cada hora, cuántos minutos rinden de verdad: descuenta los cambios de tarea, el tiempo fumando o tomando café y las esperas por bloqueos (promedio desde las 09:00).':
    'Of every hour, how many minutes really get work done: it leaves out switching tasks, time spent smoking or having coffee, and waiting on blocked tasks (average since 09:00).',
  'Días jugados': 'Days played',
  'últimos 5': 'last 5',
  'Estrés máximo del día': 'Highest stress of the day',
  Eliminar: 'Remove',
  'Borrar historial': 'Clear history',
  'Atajos de teclado': 'Keyboard shortcuts',
  'Números del juego. Que cada tarea tarde más tiene respaldo; el estrés es un supuesto nuestro.':
    'Game numbers. That each task takes longer is backed by evidence; the stress is our assumption.',
  // Panel del cerebro
  'Cerebro de la mosca en vivo': 'The fly’s brain, live',
  'Cerebro en vivo': 'Live brain',
  'Arriba el cerebro; abajo, el cordón nervioso': 'The brain on top; the nerve cord below',
  Idioma: 'Language',
  Exhibición: 'Exhibition',
  'Vista exhibición: pantalla completa para mostrar (tecla E)': 'Exhibition view: full screen, to show it to others (key E)',
  'Ocultar el cerebro (tecla B)': 'Hide the brain (key B)',
  'Ocultar el panel del cerebro': 'Hide the brain panel',
  'Cerebro de la mosca: gira solo; un clic lo detiene y otro lo hace girar; detenido, arrastra para girarlo; rueda o pellizco para acercar':
    'The fly’s brain: it turns on its own; one click stops it and another starts it again; when stopped, drag to turn it; scroll or pinch to zoom',
  Detener: 'Stop',
  'Detener el giro del cerebro (también con un clic en el cerebro)': 'Stop the brain from turning (or click on the brain)',
  Centrar: 'Center',
  'Volver a la vista inicial y a girar solo (también doble clic en el cerebro)':
    'Back to the starting view, turning on its own (or double-click the brain)',
  'neuronas encendidas': 'neurons firing',
  'Neuronas reales de una mosca. Mientras más tareas tiene encima, más se enciende.':
    'Real neurons from a fly. The more tasks she has on her plate, the more her brain lights up.',
  'Hoy en la oficina': 'Today at the office',
  Carga: 'Workload',
  'Tareas abiertas a la vez, contra el límite sostenible (3)': 'Tasks open at once, against the sustainable limit (3)',
  'a la vez': 'at once',
  'límite sostenible 3': 'sustainable limit 3',
  'Tiempo promedio desde que una tarea entra a «En curso» hasta que se termina':
    'Average time from when a task enters “In progress” until it’s finished',
  'De cada hora, cuántos minutos rinden de verdad: descuenta los cambios de tarea, el tiempo fumando o tomando café y las esperas por bloqueos':
    'Of every hour, how many minutes really get work done: it leaves out switching tasks, time spent smoking or having coffee, and waiting on blocked tasks',
  'De dónde viene la actividad': 'Where the activity comes from',
  '% de las neuronas encendidas': '% of the neurons firing',
  'Estrés del día': 'Stress during the day',
  cigarro: 'cigarette',
  café: 'coffee',
  'Estrés de la mosca durante el día': 'The fly’s stress during the day',
  'Cómo leer el cerebro': 'How to read the brain',
  'en reposo': 'at rest',
  encendida: 'firing',
  'camino de la señal': 'signal path',
  '¿Es real?': 'Is it real?',
  'Datos: Male CNS v1.0 · CC BY 4.0': 'Data: Male CNS v1.0 · CC BY 4.0',
  'Créditos y licencias': 'Credits and licenses',
  // "¿Es real?"
  Cerrar: 'Close',
  'Las neuronas y sus conexiones son de una mosca real.': 'The neurons and their connections come from a real fly.',
  'Las tareas las traducimos en una señal y simulamos cómo responde su cerebro.':
    'We turn the tasks into a signal and simulate how her brain responds.',
  'Las zonas muestran por dónde pasa la señal que le damos. Que una zona esté en 0% (por ejemplo, Memoria) no significa que la mosca no la use: la señal no llega ahí.':
    'The zones show where the signal we give her travels. A zone at 0% (Memory, for example) doesn’t mean the fly doesn’t use it: the signal doesn’t reach it.',
  'Las moscas no fuman: el cigarro es un disfraz.': 'Flies don’t smoke: the cigarette is a disguise.',
  'Los números de la oficina son del juego. Que cada tarea tarde más y se termine menos tiene respaldo; que suba el estrés es un supuesto nuestro.':
    'The office numbers come from the game. That each task takes longer and fewer get finished is backed by evidence; that stress goes up is our own assumption.',
  'Datos: Male CNS v1.0. Una colaboración entre FlyEM (HHMI Janelia), the University of Cambridge (Dept. of Zoology), the MRC Laboratory of Molecular Biology y Google Research. Licencia CC BY 4.0 · male-cns.janelia.org':
    'Data: Male CNS v1.0. A collaboration between FlyEM (HHMI Janelia), the University of Cambridge (Dept. of Zoology), the MRC Laboratory of Molecular Biology, and Google Research. License CC BY 4.0 · male-cns.janelia.org',
  // Botones para volver a mostrar los paneles y aviso del fin del día
  Cerebro: 'Brain',
  'Mostrar el cerebro (tecla B)': 'Show the brain (key B)',
  Controles: 'Controls',
  'Mostrar los controles (tecla C)': 'Show the controls (key C)',
  'Fin del día.': 'End of the day.',
  // Antes de empezar el día (tarjeta sobre la oficina)
  'Un día de oficina en un minuto': 'An office day in one minute',
  'Elige cuántas tareas tiene la mosca a la vez y aprieta Empezar.':
    'Choose how many tasks the fly has at once, then press Start.',
  Empezar: 'Start',
  'Mira la tabla o reinicia para probar otro WIP.': 'Check the table, or restart to try another WIP.',
  // Celular (Parte 5.2e): volver, la píldora del reloj, la hoja de abajo, las
  // pestañas y el fin del día ("Cerebro", "Idioma" y "Reiniciar día" ya están)
  'Volver a la portada': 'Back to the home page',
  Inicio: 'Home', // "← Inicio" en Control y en la barra de Exhibición (5.2i)
  'Controles del día': 'Day controls',
  'Más números': 'More numbers',
  Vistas: 'Views',
  Oficina: 'Office',
  Días: 'Days',
  'Ver los días': 'See the days',
};

// ---------- 2. Bloques que se cambian enteros (dónde está → inglés) ----------
// Las letras de las teclas no cambian; "Espacio" sí, porque es su nombre.
export const BLOQUES = {
  // <kbd>Espacio</kbd> pausa <kbd>R</kbd> otro día … · doble clic: vista inicial
  '#barra-exhibicion .atajo':
    '<kbd>Space</kbd> pause <kbd>R</kbd> new day <kbd>1–9</kbd> WIP <kbd>D</kbd> demo <kbd>E</kbd> back <span class="atajo-extra">· double-click: reset view</span>',
  // <kbd>Espacio</kbd> pausa · <kbd>R</kbd> reinicia · … <kbd>C</kbd> controles
  '#panel .atajos':
    '<kbd>Space</kbd>&nbsp;pause · <kbd>R</kbd>&nbsp;restart · <kbd>1–9</kbd>&nbsp;WIP · <kbd>E</kbd>&nbsp;exhibition · <kbd>B</kbd>&nbsp;brain · <kbd>C</kbd>&nbsp;controls',
  // Estrés<br />máx. (en inglés el orden se da vuelta)
  '#ex-fin thead th:nth-child(6)': 'Max<br />stress',
};

// ---------- 3. Textos que arma el juego mientras se juega ----------
export const TEXTOS = {
  // "Días jugados"
  tablaVacia: { es: 'Juega un día completo para comparar', en: 'Play a full day to compare' },
  mejorDia: { es: 'El día con más tareas terminadas', en: 'The day with the most tasks finished' },
  quitarDia: { es: 'Eliminar este día', en: 'Remove this day' },
  quitarDiaNombre: { es: (n, wip) => `Eliminar el día ${n} (WIP ${wip})`, en: (n, wip) => `Remove day ${n} (WIP ${wip})` },
  borrarHistorial: { es: 'Borrar historial', en: 'Clear history' },
  confirmarBorrado: { es: '¿Seguro? Toca de nuevo', en: 'Sure? Press again' },
  // Bajo el slider
  notaTerminando: { es: (n) => `Terminando lo empezado: ${n} en curso`, en: (n) => `Finishing what’s started: ${n} in progress` },
  notaDentro: { es: (n) => `Dentro del límite sostenible (${n})`, en: (n) => `Within the sustainable limit (${n})` },
  notaSobre: { es: (n) => `Sobre el límite sostenible (${n})`, en: (n) => `Over the sustainable limit (${n})` },
  // Botón de pausa
  pausa: { es: 'Pausa', en: 'Pause' },
  reanudar: { es: 'Reanudar', en: 'Resume' },
  // ...y antes de empezar el día, el mismo botón lo empieza
  empezar: { es: 'Empezar', en: 'Start' },
  // Qué está haciendo la mosca (tarjeta de la exhibición)
  queHace: {
    es: {
      Trabaja: 'Trabajando en el kanban',
      Fuma: 'Salió a fumar: pierde tiempo',
      Café: 'Pausa sana: toma café',
      Espera: 'Espera: sus tareas están bloqueadas',
      'En pausa': 'Juego en pausa',
      Lista: 'Lista para empezar',
      Descansa: 'Día terminado: descansa',
    },
    en: {
      Trabaja: 'Working on the kanban',
      Fuma: 'Out for a smoke: losing time',
      Café: 'Healthy break: having a coffee',
      Espera: 'Waiting: her tasks are blocked',
      'En pausa': 'Game paused',
      Lista: 'Ready to start',
      Descansa: 'Day over: resting',
    },
  },
  // Aviso de arriba: en vivo o en pausa, y si son pocas o muchas tareas
  modoDemo: { es: 'Modo demo', en: 'Demo mode' },
  enPausa: { es: 'En pausa', en: 'Paused' },
  porEmpezar: { es: 'Por empezar', en: 'Not started' },
  enVivo: { es: 'En vivo', en: 'Live' },
  avisoTerminando: {
    es: (n) => `Terminando lo empezado · nuevo límite ${n}`,
    en: (n) => `Finishing what’s started · new limit ${n}`,
  },
  muchasTareas: { es: 'Muchas tareas a la vez', en: 'Many tasks at once' },
  pocasTareas: { es: 'Pocas tareas a la vez', en: 'Few tasks at once' },
  // Números de la oficina en el panel del cerebro
  resumenDelDia: { es: 'Resumen del día', en: 'Day summary' },
  hoyEnLaOficina: { es: 'Hoy en la oficina', en: 'Today at the office' },
  // Resumen del fin del día (exhibición)
  finDelDiaWip: { es: (wip) => `Fin del día con WIP ${wip}`, en: (wip) => `End of the day with WIP ${wip}` },
  hoy: { es: 'hoy', en: 'today' },
  demoSigue: { es: (wip) => `Modo demo · sigue un día con WIP ${wip}…`, en: (wip) => `Demo mode · next up: a day with WIP ${wip}…` },
  otroDia: {
    es: 'R para jugar otro día · 1–9 cambia el WIP · D modo demo',
    en: 'R to play another day · 1–9 changes the WIP · D demo mode',
  },
  // Cerebro: la frase bajo "neuronas encendidas"
  frase: {
    es: 'Neuronas reales de una mosca. Mientras más tareas tiene encima, más se enciende.',
    en: 'Real neurons from a fly. The more tasks she has on her plate, the more her brain lights up.',
  },
  fraseFin: {
    es: 'Día terminado: la mosca descansa y su cerebro se apaga.',
    en: 'Day over: the fly rests and her brain switches off.',
  },
  // Zonas: de dónde viene la actividad
  zonasAhora: { es: 'De dónde viene la actividad', en: 'Where the activity comes from' },
  zonasDia: { es: 'De dónde vino la actividad', en: 'Where the activity came from' },
  zonasSubAhora: { es: '% de las neuronas encendidas', en: '% of the neurons firing' },
  zonasSubDia: { es: 'promedio del día', en: 'average for the day' },
  zonaSinActividad: {
    es: (nombre, detalle) => `${nombre} (${detalle}): sin neuronas encendidas`,
    en: (nombre, detalle) => `${nombre} (${detalle}): no neurons firing`,
  },
  zonaPromedio: {
    es: (nombre, detalle, pct) => `${nombre} (${detalle}): ${pct}% de las neuronas encendidas, en promedio durante el día`,
    en: (nombre, detalle, pct) => `${nombre} (${detalle}): ${pct}% of the neurons firing, on average over the day`,
  },
  zonaAhora: {
    es: (nombre, detalle, activas, total) => `${nombre} (${detalle}): ${activas} de las ${total} neuronas encendidas`,
    en: (nombre, detalle, activas, total) => `${nombre} (${detalle}): ${activas} of the ${total} neurons firing`,
  },
  // Botón Detener / Girar del cerebro
  detener: { es: 'Detener', en: 'Stop' },
  girar: { es: 'Girar', en: 'Rotate' },
  detenerTitulo: {
    es: 'Detener el giro del cerebro (también con un clic en el cerebro)',
    en: 'Stop the brain from turning (or click on the brain)',
  },
  girarTitulo: {
    es: 'Volver a girar el cerebro (también con un clic en el cerebro)',
    en: 'Start the brain turning again (or click on the brain)',
  },
  // Tarjetita de una neurona: [rol general, qué hace]
  roles: {
    es: {
      antenaSensor: ['Sensor', 'siente lo que mueve la antena.'],
      antenaRelevo: ['Relevo', 'pasa la señal de la antena a otras neuronas.'],
      ordenPatas: ['Lleva órdenes al cuerpo', 'le manda una orden a las patas.'],
      dulceSensor: ['Sensor', 'siente el dulce.'],
      dulceRelevo: ['Relevo', 'pasa la señal del dulce.'],
      trompita: ['Mueve un músculo', 'el de la trompita.'],
      baja: ['Lleva órdenes al cuerpo', 'conecta el cerebro con el cuerpo.'],
      sube: ['Trae avisos del cuerpo', 'conecta el cuerpo con el cerebro.'],
      motora: ['Mueve un músculo', 'de una pata o del cuerpo.'],
      cordon: ['Coordina el cuerpo', 'parte del cordón nervioso.'],
      sensor: ['Sensor', 'trae información del cuerpo.'],
      vision: ['Visión', 'procesa lo que ve.'],
      procesa: ['Procesa', 'junta información dentro del cerebro.'],
      neurona: ['Neurona', 'parte del sistema nervioso de la mosca.'],
    },
    en: {
      antenaSensor: ['Sensor', 'feels what moves the antenna.'],
      antenaRelevo: ['Relay', 'passes the antenna’s signal on to other neurons.'],
      ordenPatas: ['Carries orders to the body', 'sends an order to the legs.'],
      dulceSensor: ['Sensor', 'tastes sweetness.'],
      dulceRelevo: ['Relay', 'passes on the sweet signal.'],
      trompita: ['Moves a muscle', 'the one in the proboscis.'],
      baja: ['Carries orders to the body', 'connects the brain to the body.'],
      sube: ['Brings news from the body', 'connects the body to the brain.'],
      motora: ['Moves a muscle', 'in a leg or the body.'],
      cordon: ['Coordinates the body', 'part of the nerve cord.'],
      sensor: ['Sensor', 'brings in information from the body.'],
      vision: ['Vision', 'processes what she sees.'],
      procesa: ['Processing', 'brings information together inside the brain.'],
      neurona: ['Neuron', 'part of the fly’s nervous system.'],
    },
  },
  neuronaSinNombre: { es: 'Neurona sin nombre', en: 'Unnamed neuron' },
  encendidaAhora: { es: 'Encendida ahora', en: 'Firing now' },
  enReposoAhora: { es: 'En reposo ahora', en: 'At rest now' },
  // Gráfico "Estrés del día" (lo que lee un lector de pantalla y el cartelito)
  graficoAhora: { es: (nivel) => `ahora ${nivel}`, en: (nivel) => `now ${nivel}` },
  graficoEmpieza: { es: 'el día empieza a las 09:00', en: 'the day starts at 09:00' },
  graficoResumen: {
    es: (ahora, cigarros, cafes) =>
      `Estrés de la mosca durante el día: ${ahora}; ${cigarros} ${cigarros === 1 ? 'cigarro' : 'cigarros'} y ${cafes} ${cafes === 1 ? 'café' : 'cafés'}.`,
    en: (ahora, cigarros, cafes) =>
      `The fly’s stress during the day: ${ahora}; ${cigarros} ${cigarros === 1 ? 'cigarette' : 'cigarettes'} and ${cafes} ${cafes === 1 ? 'coffee' : 'coffees'}.`,
  },
  graficoCartel: {
    es: (hora, nivel, pct, enCurso, evento) => `<strong>${hora}</strong> · ${nivel} (${pct}%) · ${enCurso} a la vez${evento}`,
    en: (hora, nivel, pct, enCurso, evento) => `<strong>${hora}</strong> · ${nivel} (${pct}%) · ${enCurso} at once${evento}`,
  },
  graficoFuma: { es: ' · sale a fumar', en: ' · out for a smoke' },
  graficoCafe: { es: ' · toma café', en: ' · having coffee' },
  // Kanban del monitor (escena 3D)
  tablero: { es: 'TABLERO DEL DÍA', en: 'TODAY’S BOARD' },
  porHacer: { es: 'POR HACER', en: 'TO DO' },
  enCurso: { es: 'EN CURSO', en: 'IN PROGRESS' },
  hecho: { es: 'HECHO', en: 'DONE' },
  sobreLimite: { es: (n) => `SOBRE EL LÍMITE (${n})`, en: (n) => `OVER THE LIMIT (${n})` },
  wipAlto: { es: '¡WIP ALTO!', en: 'HIGH WIP!' },
  masTarjetas: { es: (n) => `+${n} más`, en: (n) => `+${n} more` },
  // Póster de la pared (las dos líneas bajo "WIP ≤ 3")
  poster: { es: ['menos cosas a la vez', '= más cosas listas'], en: ['fewer things at once', '= more things done'] },
  // Post-its del monitor, en el orden en que aparecen (dos líneas cada uno)
  postits: {
    es: [
      ['WIP ≤ 3', ':)'],
      ['¡urgente!', 'cliente'],
      ['revisar', 'informe'],
      ['reunión', '11:00'],
      ['pagar', 'facturas'],
      ['llamar', 'cliente'],
      ['bug', '#42'],
      ['¡hoy!', ''],
      ['ASAP', ''],
      ['¿y esto?', ''],
      ['feedback', 'equipo'],
      ['presu-', 'puesto'],
      ['deploy', 'viernes'],
      ['pendiente', ''],
    ],
    en: [
      ['WIP ≤ 3', ':)'],
      ['urgent!', 'client'],
      ['review', 'report'],
      ['meeting', '11:00'],
      ['pay', 'invoices'],
      ['call', 'client'],
      ['bug', '#42'],
      ['today!', ''],
      ['ASAP', ''],
      ['and this?', ''],
      ['team', 'feedback'],
      ['budget', ''],
      ['deploy', 'Friday'],
      ['pending', ''],
    ],
  },
};

// ---------- 4. Niveles de estrés y zonas del cerebro (su inglés) ----------
const NIVELES_EN = { Tranquila: 'Calm', Ocupada: 'Busy', Estresada: 'Stressed', Colapsada: 'Overwhelmed' };
const ZONAS_EN = {
  vision: { nombre: 'Vision', detalle: 'optic lobes' },
  central: { nombre: 'Central brain', detalle: 'integrates and decides' },
  memoria: { nombre: 'Memory', detalle: 'mushroom bodies' },
  mando: { nombre: 'Command', detalle: 'connects brain and body' },
  movimiento: { nombre: 'Movement', detalle: 'nerve cord and motor neurons' },
};

// ---------- Cómo se usan ----------
let idioma = 'es';
export const idiomaJuego = () => idioma;
export function ponerIdiomaJuego(nuevo) {
  idioma = nuevo === 'en' ? 'en' : 'es';
}

// Un texto del juego en el idioma de ahora (con sus datos, si los lleva)
export function tx(clave, ...datos) {
  const texto = TEXTOS[clave][idioma];
  return typeof texto === 'function' ? texto(...datos) : texto;
}

// Nombre de un nivel de estrés ("Tranquila" → "Calm")
export const nombreNivel = (nombre) => (idioma === 'en' ? (NIVELES_EN[nombre] ?? nombre) : nombre);

// Nombre y detalle de una zona del cerebro (g = la zona de malecns-info.json)
export const zona = (g) =>
  idioma === 'en' && ZONAS_EN[g.id] ? ZONAS_EN[g.id] : { nombre: g.nombre, detalle: g.detalle };

// ---------- La página: guardar el español y ponerle el inglés ----------
// Se llama una vez al cargar, antes de que el juego escriba nada. Guarda cada
// texto y atributo fijo de la página tal como viene, para volver a él exacto.
// Lo que el juego escribe después (la hora, los números, los avisos) lo
// vuelve a escribir el juego en el idioma nuevo.
const ATRIBUTOS = ['title', 'aria-label', 'alt', 'placeholder', 'aria-valuetext'];
let fijos = null;

export function prepararPagina(raiz = document.body) {
  fijos = { bloques: [], textos: [], atributos: [] };
  for (const [donde, en] of Object.entries(BLOQUES))
    for (const el of raiz.querySelectorAll(donde)) fijos.bloques.push({ el, es: el.innerHTML, en });
  const enBloque = (nodo) => fijos.bloques.some((b) => b.el.contains(nodo));
  const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  for (let nodo = recorrido.nextNode(); nodo; nodo = recorrido.nextNode()) {
    const limpio = nodo.nodeValue.trim();
    const en = PAGINA[limpio];
    if (!limpio || en === undefined || enBloque(nodo)) continue;
    // conserva los espacios de los bordes (separan el texto de lo que lo rodea)
    const antes = nodo.nodeValue.match(/^\s*/)[0];
    const despues = nodo.nodeValue.match(/\s*$/)[0];
    fijos.textos.push({ nodo, es: nodo.nodeValue, en: antes + en + despues });
  }
  for (const el of raiz.querySelectorAll('*'))
    for (const nombre of ATRIBUTOS) {
      const valor = el.getAttribute(nombre);
      const en = valor === null ? undefined : PAGINA[valor.trim()];
      if (en !== undefined) fijos.atributos.push({ el, nombre, es: valor, en });
    }
}

export function traducirPagina(nuevo) {
  if (!fijos) return;
  const ingles = nuevo === 'en';
  for (const b of fijos.bloques) b.el.innerHTML = ingles ? b.en : b.es;
  // un texto que el juego ya reemplazó no se toca (lo escribe el juego)
  for (const t of fijos.textos) if (t.nodo.isConnected) t.nodo.nodeValue = ingles ? t.en : t.es;
  // un atributo se cambia solo si sigue siendo el fijo (en el otro idioma)
  for (const a of fijos.atributos)
    if (a.el.getAttribute(a.nombre) === (ingles ? a.es : a.en)) a.el.setAttribute(a.nombre, ingles ? a.en : a.es);
}
