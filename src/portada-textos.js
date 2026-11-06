// Textos de la portada en inglés (2026-10-24; portada v2 el 2026-10-26). El
// español está en index.html: cada clave es el data-t (contenido), el
// data-t-aria / data-t-title o el data-t-alt (imágenes) de un elemento. Mismo
// sentido y tono que el español, sin agregar ni quitar nada; los términos son
// los de docs/glosario-ingles.md (los mismos del juego y del informe en inglés).
export const INGLES = {
  // La barra de arriba tiene sus textos en los dos idiomas en src/barra.js
  // (es un solo componente para todo el sitio, 2026-10-28)
  saltar: 'Skip to content',

  // El inicio y la consola. Desde la 8.6 (2026-11-06): la frase del problema
  // arriba, lo que logra quien limita su trabajo en curso en el título y el
  // párrafo, y el dato del juego en chico (antes: "For teams and leaders · a
  // 1-minute game", "Busy all day. So what did you finish?" y "Play for a
  // minute and watch what happens to an office fly…")
  rotulo: 'Being busy all the time isn’t the same as making progress',
  titulo: 'Finish more by starting less',
  bajada:
    'When you have everything started, each thing waits its turn and takes longer to get done. In one minute, an office fly with a real brain shows you why. Then we explain how to find your team’s limit.',
  datoInicio: 'In the game, with 9 tasks at once the fly finished half as many as with 2, and each one took almost nine times longer.',
  jugar: 'Play',
  jugarMinuto: 'Play (1 minute)',
  verKit: 'See the kit',
  descargar: 'Download the report (PDF)',
  descargarCorto: 'Download the PDF',
  descargarResumen: 'Four-page summary (PDF)', // 8.6: el resumen de 4 páginas
  leerInforme: 'Read the report on the web',
  gratis: 'Free, no sign-up. Plays on a computer, phone or tablet.',
  creadoPor: 'Created by <a href="https://www.linkedin.com/in/felipefernandezandrade/" target="_blank" rel="noopener">Felipe Fernández</a>', // 5.2i
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
  video: 'The fly in her office: first with 2 tasks at once, calm, and then with 9, stressed and smoking.',
  pocas: 'Few tasks at once',
  muchas: 'Many tasks at once',
  figcaption: 'First with 2 tasks at once. Then with 9.',
  hecho: 'In the game, with 2 tasks at once she finishes 18. With 9 tasks at once she finishes 9, half as many.',
  dosALaVez: '2 at once',
  nueveALaVez: '9 at once',
  total18: '<span class="cifra">18</span> finished',
  total9: '<span class="cifra">9</span> finished (half)', // 5.2i: las dos columnas dicen lo mismo
  hechoNota: 'Average of 200 days in the game.',

  // Cómo se juega
  pasosTitulo: 'How to play',
  paso1: 'You choose how many tasks she can have started at once, from 1 to 10. That’s called a work-in-progress limit (WIP).',
  paso2: 'You watch her day at the office, from 9 to 6, in one minute.',
  paso3: 'You compare how much she finished, how long each task took and how many times she went out for a smoke.',
  paso1Alt: 'The game’s control: tasks in progress at once, from 1 to 10, within the sustainable limit.',
  paso2Alt: 'The fly in front of her board for the day, with 2 tasks in progress, at 10:10.',
  paso3Alt: 'The Days played table, with one day at 2 tasks at once and another at 9.',

  // Lo que se lleva tu equipo. Desde la 8.6 (2026-11-06) parte por lo que
  // busca un límite, con su respaldo, y después, más cortos, lo que el equipo
  // se lleva del taller. "Capacity" para capacidad (pedido de Felipe, v4)
  ganaTitulo: 'What your team takes away',
  ganaBajada: 'What a limit on work in progress aims for.',
  busca1Titulo: 'Each thing gets done sooner',
  busca1: 'At the same pace, fewer things open means less time for each one.',
  busca1Respaldo: 'Math, Little’s Law.',
  busca2Titulo: 'Work waits less',
  busca2: 'Flow efficiency goes up, the share of time something actually moves forward.',
  busca2Respaldo: 'In the game, 47% with 2 at once and 9% with 9.',
  busca3Titulo: 'A pace you can keep',
  busca3: 'You get to the end of the day without being overwhelmed.',
  busca3Respaldo: 'In the game, with 2 she ended the day Calm and with 9, Overwhelmed.',
  ganaDora: 'According to DORA, limiting work in progress is a habit of high-performing teams.',
  ganaAdemasTitulo: 'And from the workshop they take',
  gana3: 'A written agreement, with their limit and what to do when something waits.',
  gana2: 'Where their work waits and who they’re waiting on, in plain sight.',
  gana4: 'Their own numbers, in two weeks.',
  ganaNota:
    'It’s what a limit aims for, not a guarantee. How much, in your case, your test will tell. How to choose the limit and test it is in the <a href="/en/wip-limit/">WIP limit guide</a>.',

  // El kit para tu equipo
  kitTitulo: 'The kit for your team',
  kitBajada: 'Three pieces, from 1 minute to 60. Free.',
  kitJuego: 'The game',
  kitJuegoTiempo: '1 minute',
  kitJuegoTexto: 'To see it.',
  kitInforme: 'The report',
  kitInformeTiempo: '10 minutes',
  kitInformeTexto: 'Where each number comes from and what the studies say.',
  kitInformeLeer: 'Read it on the web',
  kitTaller: 'The workshop',
  kitTallerTiempo: '60 minutes',
  kitTallerTexto: 'Slides, a quick guide and the team sheet to print, so your team finds its limit and tries it for 2 weeks.',
  kitTallerVer: 'See the workshop (60 minutes)',
  kitTallerIdioma: 'For now, the workshop is in Spanish.', // en español no hay línea
  kitGuia: 'Quick guide (PDF, in Spanish)',
  kitPptx: 'Slides (PowerPoint, in Spanish)',
  kitPdf: 'Slides (PDF, in Spanish)',
  kitHoja: 'Team sheet (PDF, in Spanish)',
  tapaJuegoAlt: 'The fly from the game at her office, in front of her kanban board.',
  tapaInformeAlt: 'The report’s cover: the fly carrying a tower of folders.',
  tapaTallerAlt: 'The cover of the workshop’s quick guide: the fly with 9 tasks in progress.',
  kitCierre: 'Use it and adapt it, also in paid workshops, crediting the author.',

  // ¿Por qué una mosca?
  creditoTitulo: 'Why a fly?',
  significa: 'Mosca means fly in Spanish.', // al empezar la sección; en español no hay línea
  creditoDestacado:
    'Scientists at Janelia, Cambridge and Google, among others, mapped a fly’s central nervous system, 166,700 neurons and their connections. We gave her an office job. Nobody asked her. And no, she doesn’t smoke. The cigarette is a disguise for cleaning her antennae.',
  cerebro2Alt: 'The brain with 2 tasks at once: few neurons firing.',
  cerebro9Alt: 'The brain with 9 tasks at once: many more neurons firing.',
  cerebro2Pie: '2 tasks at once: <span class="cifra">423</span> neurons firing in the simulation',
  cerebro9Pie: '9 at once: <span class="cifra">1,328</span> neurons firing in the simulation',
  credito1:
    'The neurons that light up in the game come from <a href="https://male-cns.janelia.org">Male CNS v1.0</a>. “This project is a collaboration between FlyEM (HHMI Janelia), the University of Cambridge (Dept. of Zoology), the MRC Laboratory of Molecular Biology, and Google Research.”',
  credito2:
    'Data licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, adapted for the game: only some of the neurons are shown, and the activity you see is simulated.',
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
    'It shows you, in one minute, why you finish more by starting less. You choose how many tasks an office fly with a real brain has at once, from 1 to 10, and watch her day at the office. Then the guide, the report and the workshop help you find your team’s limit.',
  pregunta2: 'What does WIP mean?',
  respuesta2:
    'It’s short for work in progress. It’s everything you’ve started and haven’t finished yet. In the game, it’s the tasks the fly has open at the same time.',
  pregunta3: 'How many tasks at once is best?',
  respuesta3:
    'There’s no number for everyone. In the game, the fly finishes the most with 2 and her sustainable limit is 3, because up to 3 she stays Calm. With more, her stress goes up, and with 9 she ends the day Overwhelmed. But the fly works alone, and the game doesn’t tell you your team’s number. It depends on how much your work waits, and you find it by trying a limit. How to do it is in the guide <a href="/en/wip-limit/">WIP limit: what it is and how to find your team’s</a>.',
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
    'What a limit aims for: each thing getting done sooner, work waiting less and a pace you can keep. From the workshop they also take a written agreement and, in two weeks, their own numbers. How much the limit achieves in your case, your test will tell.',
  pregunta11: 'Can I use the workshop with my team, or in paid workshops?',
  respuesta11:
    'Yes. The workshop (the quick guide, the slides and the team sheet) is licensed CC BY 4.0: you can use it and adapt it, also in paid workshops, crediting Felipe Fernández (mosca.deliverycraft.ai). For now it’s in Spanish. The report can be shared as it is, crediting the author, and the game is played on this page.',
  pregunta12: 'Do I need to know about WIP to facilitate it?',
  respuesta12:
    'No. For each part, the quick guide has the minutes, one or two tips and the question for the room, plus the answers to what you’ll be asked. Read it once and, before the session, play the two days you’ll show: one with 9 tasks at once and one with 2.',
  pregunta13: 'What about urgent tasks?',
  respuesta13:
    'The game has a Send an urgent task button. The urgent task jumps over the limit, one at a time. In the simulation, with limit 2, each one cost one regular task. The numbers are in the <a href="/en/report/#urgencias">report</a>.',

  // Qué es y qué no es, por qué lo hice, el cierre y el pie
  informeTitulo: 'What it is and what it isn’t',
  informeDestacado:
    'It’s a game and a computer experiment, with rules based on studies. It doesn’t measure people or teams: your number is yours to measure.',
  informeTexto:
    'The report explains where each number comes from and gives four steps to try a limit with your team. It takes 10 minutes to read.',
  informeNota: '17 pages, 4 MB.',
  motivoTitulo: 'Why I made it',
  motivoTexto:
    'I work with teams and I see the same thing over and over: many things started and few finished. I wanted to show it in one minute, by playing, before arguing about it.',
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
      `Con ${n} a la vez: ${terminadas} terminadas en el día, estrés ${nivel} al cerrar y ${cigarros} cigarros.`,
  },
  en: {
    limite: (dentro) => (dentro ? 'Within the sustainable limit (3)' : 'Over the sustainable limit (3)'),
    tareas: (n) => `${n} ${n === 1 ? 'task' : 'tasks'} at once`,
    nivel: (nivel) => ({ Tranquila: 'Calm', Ocupada: 'Busy', Estresada: 'Stressed', Colapsada: 'Overwhelmed' })[nivel],
    resumen: (n, terminadas, nivel, cigarros) =>
      `With ${n} at once: ${terminadas} finished per day, ${nivel.toLowerCase()} at the end of the day and ${cigarros} ${cigarros === 1 ? 'cigarette' : 'cigarettes'}.`,
  },
};
