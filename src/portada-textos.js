// Textos de la portada en inglés (2026-10-24; portada v2 el 2026-10-26). El
// español está en index.html: cada clave es el data-t (contenido), el
// data-t-aria / data-t-title o el data-t-alt (imágenes) de un elemento. Mismo
// sentido y tono que el español, sin agregar ni quitar nada; los términos son
// los de docs/glosario-ingles.md (los mismos del juego y del informe en inglés).
export const INGLES = {
  // La barra de arriba tiene sus textos en los dos idiomas en src/barra.js
  // (es un solo componente para todo el sitio, 2026-10-28)
  saltar: 'Skip to content',

  // El inicio y la consola. Desde la 8.7 (2026-11-07): la pregunta de
  // siempre como título y una bajada que dice qué hacer, partiendo por el
  // juego. Desde la 8.8 (2026-11-09) vuelve arriba el rótulo con la frase del
  // problema, como en la 8.6, y el dato del juego es otro, más corto
  // (el mismo título que la pág. 1 del informe en inglés; en computador corta
  // después de "day.", como el español, y no después de "So"; "you finish?"
  // va junto para que "finish?" no quede sola en la tercera línea)
  rotulo: 'Being busy all the time isn’t the same as making progress',
  titulo: 'Busy all day.<br class="corte" /> So what did you&nbsp;finish?',
  bajada:
    'Measure how many things your team has in progress and find the limit that gets the most done. Start with a one-minute game about an office fly with a real brain.',
  // 8.13 (2026-11-14, pedido de Felipe): el dato chico del juego salió del
  // inicio y, en vez del cerebro, va un dibujo. Felipe vio seis propuestas y
  // eligió "¿Te suena?": los pedidos que le van llegando a la mosca en un día
  // cualquiera, sin números. Se repite solo, sin fin y sin botones
  suenaTitulo: 'Any day at the office',
  suenaLista: 'What people ask the fly for',
  globo1: 'Got a minute?',
  globo2: 'It’s urgent',
  globo3: 'Any update on mine?',
  globo4: 'I need this today',
  globo5: 'One quick thing',
  globo6: 'Did you see it?',
  globo7: 'This is urgent too',
  globo8: 'What about yesterday’s?',
  globo9: 'Did you get my email?',
  globo10: 'I need it now',
  globo11: 'I added you to a meeting',
  globo12: 'Quick question',
  globo13: 'Can you help me with this?',
  globo14: 'Can you look at it now?',
  suenaPie: 'Everything urgent, everything started. Sound familiar?',
  suenaNota: 'The game shows what that costs the fly, in one minute.',
  jugar: 'Play',
  jugarMinuto: 'Play (1 minute)',
  verKit: 'See the kit',
  descargar: 'Download the report (PDF)',
  descargarResumen: 'Executive summary (PDF, 2 pages)', // 8.6: el resumen aparte; desde la 8.11 es el resumen ejecutivo, de 2 páginas
  leerInforme: 'Read the summary', // 8.12: en la web se lee el resumen ejecutivo
  gratis: 'Free, no sign-up. Plays on a computer, phone or tablet.',
  creadoPor: 'Created by <a href="https://www.linkedin.com/in/felipefernandezandrade/" target="_blank" rel="noopener">Felipe Fernández</a>', // 5.2i
  bajar: 'Scroll down to the drawing', // 8.14: la flecha chica del celular, al final de la primera pantalla
  neuronas: 'neurons firing',
  enSimulacion: 'in the simulation',
  consolaFrase: 'Real neurons from a fly. The more tasks she has on her plate, the more her brain lights up.',
  tareasLabel: 'Tasks in progress at once (WIP)',
  terminadas: 'finished per day',
  estres: 'stress at the end of the day',
  cigarros: 'cigarettes',
  consolaNota: 'Average of 200 days played. These are numbers from the game, not from people.',

  // Lo que vas a ver
  juegoTitulo: 'What you’ll see',
  juegoTexto:
    'The same fly, the same day at the office, twice. In the game, with 2 tasks at once she finishes 18. With 9 she finishes half as many, even though she’s busy all day.',
  video: 'The fly in her office, first with 2 tasks at once, calm, and then with 9, stressed and smoking.',
  pocas: 'Few tasks at once',
  muchas: 'Many tasks at once',
  figcaption: 'First with 2 tasks at once. Then with 9.',
  hecho: 'In the game, with 2 tasks at once she finishes 18. With 9 tasks at once she finishes 9, half as many.',
  dosALaVez: '2 at once',
  nueveALaVez: '9 at once',
  total18: '<span class="cifra" data-cuenta data-paso="60">18</span> finished',
  total9: '<span class="cifra" data-cuenta data-paso="60">9</span> finished (half)', // 5.2i: las dos columnas dicen lo mismo
  hechoNota: 'Average of 200 days in the game.',

  // Cómo se juega
  pasosTitulo: 'How to play',
  paso1: 'You choose how many tasks she can have started at once, from 1 to 10. That’s called a work-in-progress (WIP) limit.',
  paso2: 'You watch her day at the office, from 9 to 6, in one minute.',
  paso3: 'You compare how much she finished, how long each task took and how many times she went out for a smoke.',
  paso1Alt: 'The game’s control, with the tasks in progress at once, from 1 to 10, within the sustainable limit.',
  paso2Alt: 'The fly in front of her board for the day, with 2 tasks in progress, at 10:10.',
  paso3Alt: 'The Days played table, with one day at 2 tasks at once and another at 9.',

  // ¿Qué ganó la mosca al limitar su WIP? (hasta la 8.11, "Para qué sirve un
  // límite") y Lo que se lleva tu equipo (8.7, 2026-11-07;
  // rediseñadas en la 8.8, 2026-11-09): tres líneas en grande, cada una con
  // la prueba de la mosca dibujada (un día con 2 a la vez y otro con 9), y
  // cuatro frases cortas, cada una con un dibujo del tablero del equipo.
  // Desde la 8.9 (2026-11-10) una bajada dice de quién son los números antes
  // de mostrarlos (de la mosca, en el juego), y la primera línea habla de ella
  // ("She finishes more, and each task is done sooner": con "is done" queda
  // en dos líneas en el computador, como la de antes, "You finish more, and
  // each thing gets done sooner"; con "gets done" se iba a tres)
  sirveTitulo: 'What did the fly gain by limiting her WIP?', // 8.11: el título es una pregunta sobre la mosca
  carril2: 'with 2 tasks at once',
  carril9: 'with 9 tasks at once',
  sirve1: 'She finishes more, and each task is done sooner.',
  sirve1Dato2: '<b data-cuenta data-paso="55">18</b> finished per day, 1&nbsp;h each',
  sirve1Dato9: '<b data-cuenta data-paso="55">9</b> finished per day, almost 9&nbsp;h each',
  sirve2: 'Work moves forward instead of waiting.',
  avance47: '<span data-cuenta="der" data-paso="26">47</span>%',
  avance9: '<span data-cuenta="der" data-paso="26">9</span>%',
  sirve2Dato2: 'each task moves forward almost half the time',
  sirve2Dato9: 'each task waits 9 out of every 10&nbsp;minutes',
  sirve3: 'Less overload.',
  sirve3Dato2: 'she ends the day <b>Calm</b>, without smoking',
  sirve3Dato9: 'she ends the day <b>Overwhelmed</b>, with <span data-cuenta="der" data-paso="70" data-espera="450">13</span>&nbsp;cigarettes',
  sirveOrigen: 'In the game, average of 200 days played.', // 8.14: dice de dónde salen los números (la bajada de arriba salió)
  sirveCierre: 'According to DORA, limiting work in progress is a habit of high-performing teams. Your team’s own test will show how much it gains.',
  ganaTitulo: 'What your team takes away',
  // (8.11) con coma, como el español y como el resumen ejecutivo en inglés (antes llevaba dos puntos)
  lleva1: 'Their load in plain sight, how many things each person has started.',
  lleva2: 'Where the work sits waiting.',
  lleva3: 'An agreed limit, written on the board.',
  lleva4: 'Their own data after two weeks.',
  // (lo que dicen los dibujos del tablero del equipo)
  dibujoEnCurso: 'In progress',
  dibujoMax: 'max. 3',
  dibujoSemana1: 'week 1',
  dibujoSemana2: 'week 2',
  ganaNota: 'How to choose the limit and test it is in the <a href="/en/wip-limit/">WIP limit guide</a>.',

  // El kit para tu equipo
  kitTitulo: 'The kit for your team',
  kitBajada: 'Three pieces, from 1 minute to 60. Free.',
  kitJuego: 'The game',
  kitJuegoTiempo: '1 minute',
  kitJuegoTexto: 'Play it online on any device, and watch a fly at work.', // 8.8
  kitInforme: 'The report',
  // 8.12: en la web se lee el resumen ejecutivo y el informe entero se descarga
  kitInformeTiempo: '2 to 10 minutes',
  kitInformeTexto: 'Read the executive summary on the web. The full report, with every number, its sources and the studies, is a PDF download.',
  kitInformeLeer: 'Read the summary',
  kitInformePdf: 'Report (PDF, 18 pages)',
  kitTaller: 'The workshop',
  kitTallerTiempo: '60 minutes',
  kitTallerTexto: 'Slides, a quick guide and the team sheet to print, so your team finds its limit and tries it for 2 weeks.',
  kitTallerVer: 'See the workshop',
  kitTallerIdioma: 'For now, the workshop is in Spanish.', // en español no hay línea
  kitGuia: 'Quick guide (PDF, in Spanish)',
  kitPptx: 'Slides (PowerPoint, in Spanish)',
  kitPdf: 'Slides (PDF, in Spanish)',
  kitHoja: 'Team sheet (PDF, in Spanish)',
  // (8.12) lo que dicen los dibujos del kit: el día del juego, las páginas del
  // resumen y del informe, y las cuatro partes del taller (los mismos nombres
  // de la página del taller en inglés)
  dibujoDiaDesde: '9 am',
  dibujoDiaHasta: '6 pm',
  dibujoPorHacer: 'To do',
  dibujoHecho: 'Done',
  dibujoResumen: '<span>The summary, on the web</span><b><span data-cuenta data-paso="60">2</span> pages</b>',
  dibujoInforme: '<span>The report, as a PDF</span><b><span data-cuenta data-paso="60">18</span> pages</b>',
  parteConexion: 'Connection',
  parteConceptos: 'Concepts',
  partePractica: 'Practice',
  parteCierre: 'Closing',
  partesTotal: '<b data-cuenta data-paso="20">60</b> minutes',
  kitCierre: 'Use it and adapt it, also in paid workshops, crediting the author.',

  // ¿Por qué una mosca?
  creditoTitulo: 'Why a fly?',
  significa: 'Mosca means fly in Spanish.', // al empezar la sección; en español no hay línea
  // 8.12: las mismas frases, en un tablero. Desde la 8.13 (2026-11-14) la
  // primera y la tercera van juntas, sobre el cerebro del juego en 3D, que
  // bajó desde el inicio; la segunda, sobre la credencial
  mosca1: 'Scientists mapped a fly’s central nervous system.',
  laminasQuien: 'Janelia, Cambridge and Google, among others',
  laminasDato: '<b data-cuenta="der" data-paso="0.0075">166,700</b> neurons and their connections, in <b data-cuenta data-paso="19">66</b>&nbsp;slices',
  mosca2: 'We gave her an office job. Yes, we put her to work.',
  credencialNombre: 'Mosca',
  credencialCargo: 'Office worker',
  credencialJornada: 'Hours',
  credencialHorario: '9 to 6',
  credencialTareas: 'Tasks at once',
  credencialRango: '1 to 10',
  mosca3: 'The neurons that light up in the game come from that map.',
  // 8.8: el aviso de las películas, con lo que le pasó de verdad a la mosca
  // del mapa (Berg y otros, 2025, Métodos: le sacaron el sistema nervioso
  // entero y lo cortaron en 66 láminas de 20 micrones)
  creditoAviso:
    'No fly was harmed or made to do any real work. Except the one in the map, whose nervous system was taken out and cut into 66&nbsp;slices.', // 8.11: sin dos puntos (pedido de Felipe: "es muy IA")
  credito1:
    'The map is <a href="https://male-cns.janelia.org">Male CNS v1.0</a>. “This project is a collaboration between FlyEM (HHMI Janelia), the University of Cambridge (Dept. of Zoology), the MRC Laboratory of Molecular Biology, and Google Research.”',
  credito2:
    'Data licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, adapted for the game. Only some of the neurons are shown, and the activity you see is simulated.',
  zonasTitulo: 'Brain colors',
  zonaVision: 'Vision',
  zonaCentral: 'Central brain',
  zonaMemoria: 'Memory',
  zonaMando: 'Command',
  zonaMovimiento: 'Movement',
  zonaReposo: 'At rest',

  // FAQ (parte 5.2f; tres preguntas más con la portada v2)
  preguntasTitulo: 'FAQ',
  pregunta1: 'What is Mosca del WIP?',
  respuesta1:
    'It’s a one-minute game that is also a computer experiment. You’re the boss of an office fly. You decide how many tasks she has started at once and watch how many she finishes, how long each one takes and how stressed she is at the end of the day. The rules are inspired by studies with real people, and the neurons that light up come from a real fly. It shows you, simply, what it costs to have everything started.',
  pregunta2: 'What does WIP mean?',
  respuesta2:
    'It’s short for work in progress. It’s everything you’ve started and haven’t finished yet. In the game, it’s the tasks the fly has open at the same time.',
  pregunta3: 'How many tasks at once is best?',
  respuesta3:
    'There’s no number for everyone. In the game, the fly finishes the most with 2 and her sustainable limit is 3, because up to 3 she stays Calm. With more, her stress goes up, and with 9 she ends the day Overwhelmed. But the fly works alone, and the game doesn’t tell you your team’s number. It depends on how much your work waits, and you find it by trying a limit. How to do it is in the guide <a href="/en/wip-limit/">What a WIP limit is and how to find your team’s</a>.',
  pregunta4: 'Is the brain from a real fly?',
  respuesta4:
    'The neurons and their connections are. They come from Male CNS v1.0, the map of a male fly’s central nervous system, neuron by neuron, licensed under CC BY 4.0. The activity you see is simulated. We translate the tasks into something a fly can feel, like dust on her antenna, and simulate how her brain responds. Only some of her neurons are shown.',
  pregunta5: 'Are the numbers about people?',
  respuesta5:
    'No. They come from the game, a computer experiment with a single fly, and each one is the average of 200 days played. That each task takes longer and fewer get finished is backed by evidence. That stress goes up is our own assumption. The report says where each number comes from.',
  pregunta6: 'Why does the fly smoke?',
  respuesta6:
    'Flies don’t smoke. The cigarette is a disguise for something they really do, cleaning their antennae. The tasks reach her as dust on her antenna, which lights up the cleaning circuit in her brain, and the game draws that as going out for a smoke. The game decides how many cigarettes she smokes. When she’s Calm she never smokes, and each break is 8 minutes without working.',
  pregunta7: 'Can I play on my phone?',
  respuesta7:
    'Yes. It plays on a computer, phone or tablet. On a phone the office is at the top and the controls at the bottom, with tabs for the brain and the days played. You can also play with the phone turned sideways.',
  pregunta8: 'Does it cost anything? Do you store my data?',
  respuesta8:
    'It’s free and needs no sign-up. We don’t use cookies and only count visits, without identifying anyone. Your days played and what you choose, like the language, are saved only in your browser.',
  pregunta9: 'How do I use it with my team?',
  respuesta9:
    'Play one day with 2 tasks at once and another with 9, and compare the Days played table. On a computer, the Exhibition view shows the game large, for a TV or a projector. The kit on this page has the <a href="/en/report/">report</a>, with four steps to try a limit, and a <a href="/en/workshop/">60-minute workshop</a> with its guide to facilitate it.',
  pregunta10: 'What does my team take away?',
  respuesta10:
    'A limit helps you finish more, keeps work moving instead of waiting, and means less overload. Your team leaves with its load in plain sight, a clear view of where the work sits waiting, an agreed limit and its own data after two weeks. Your team’s own test will show how much it gains.',
  pregunta11: 'Can I use the workshop with my team, or in paid workshops?',
  respuesta11:
    'Yes. The workshop (the quick guide, the slides and the team sheet) is licensed CC BY 4.0. You can use it and adapt it, also in paid workshops, crediting Felipe Fernández (mosca.deliverycraft.ai). For now it’s in Spanish. The report can be shared as it is, crediting the author, and the game is played on this page.',
  pregunta12: 'Do I need to know about WIP to facilitate it?',
  respuesta12:
    'No. For each part, the quick guide has the minutes, one or two tips and the question for the room, plus the answers to what you’ll be asked. Read it once and, before the session, play the two days you’ll show, one with 9 tasks at once and one with 2.',
  pregunta13: 'What about urgent tasks?',
  respuesta13:
    'The game has a Send an urgent task button. The urgent task jumps over the limit, one at a time. In the simulation, with limit 2, each one cost one regular task. The gist is in the <a href="/en/report/#urgencias">summary</a>, and the numbers are on page 11 of the report.',

  // Qué es y qué no es, por qué lo hice, el cierre y el pie
  informeTitulo: 'What it is and what it isn’t',
  informeDestacado:
    'It’s a game and a computer experiment, with rules based on studies. It doesn’t measure people or teams. Your number is yours to measure.',
  informeTexto:
    'The report explains where each number comes from and gives four steps to try a limit with your team. It takes 10 minutes to read and comes as a PDF. Its summary is on the web and takes 2 minutes.',
  informeNota: 'The report is 18 pages, 4 MB.',
  motivoTitulo: 'Why I made it',
  motivoTexto:
    'I work with teams and I see the same thing over and over. They commit without knowing how much load they carry. They don’t know where to start or what’s really urgent, because everything is urgent and a priority. You feel you work all day and get nowhere, and the list of pending work keeps getting longer.',
  motivoTexto2: 'It happens to me too, in my own job. I wanted to show it in one minute, by playing, before debating it.', // 8.8
  cierre: 'Closing',
  cierreFrase: 'A sustainable limit, not one thing at a time.',
  hechoPor:
    'Made by <a href="https://www.linkedin.com/in/felipefernandezandrade/">Felipe Fernández</a> · <a href="https://deliverycraft.ai">deliverycraft.ai</a>',
  sinCookies: 'No cookies. We only count visits, without identifying anyone.',
  pieMapa: 'Pages on this site',
  pieJuego: 'The game',
  pieGuia: 'WIP limit guide',
  pieInforme: 'The report',
  pieTaller: 'The workshop',
  pieCreditos: 'Credits and licenses',
  derechos:
    '© 2026 Felipe Fernández. All rights reserved. The brain data come from Male CNS v1.0, licensed CC BY 4.0. <a href="/creditos/?lang=en">Credits and licenses</a>',
};

// Lo que cambia con la consola, en los dos idiomas. El nivel de estrés llega
// con su nombre del juego (Tranquila, Ocupada...), que no se toca.
export const DINAMICOS = {
  es: {
    limite: (dentro) => (dentro ? 'Dentro del límite sostenible (3)' : 'Sobre el límite sostenible (3)'),
    tareas: (n) => `${n} ${n === 1 ? 'tarea' : 'tareas'} a la vez`,
    nivel: (nivel) => nivel,
    resumen: (n, terminadas, nivel, cigarros) =>
      `Con ${n} a la vez, ${terminadas} terminadas en el día, estrés ${nivel} al cerrar y ${cigarros} ${cigarros === 1 ? 'cigarro' : 'cigarros'}.`,
  },
  en: {
    limite: (dentro) => (dentro ? 'Within the sustainable limit (3)' : 'Over the sustainable limit (3)'),
    tareas: (n) => `${n} ${n === 1 ? 'task' : 'tasks'} at once`,
    nivel: (nivel) => ({ Tranquila: 'Calm', Ocupada: 'Busy', Estresada: 'Stressed', Colapsada: 'Overwhelmed' })[nivel],
    resumen: (n, terminadas, nivel, cigarros) =>
      `With ${n} at once, ${terminadas} finished per day, ${nivel.toLowerCase()} at the end of the day and ${cigarros} ${cigarros === 1 ? 'cigarette' : 'cigarettes'}.`,
  },
};
