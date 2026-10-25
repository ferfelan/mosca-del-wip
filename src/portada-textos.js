// Textos de la portada en inglés (2026-10-24). El español está en index.html:
// cada clave es el data-t (contenido) o el data-t-aria / data-t-title de un
// elemento. Mismo sentido y tono que el español, sin agregar ni quitar nada;
// los términos son los de docs/glosario-ingles.md (los mismos del juego).
export const INGLES = {
  // Barra de arriba (la barra con el menú, parte 5.2f)
  saltar: 'Skip to content',
  logo: 'Mosca del WIP: go to the top',
  menu: 'Menu',
  secciones: 'Page sections',
  navJuego: 'The game',
  navCerebro: 'The brain',
  navInforme: 'The report',
  navPreguntas: 'FAQ',
  idioma: 'Language',
  fondo: 'Background',
  fondoNegro: 'Dark background',
  fondoBlanco: 'Light background',

  // Presentación y consola
  lema: 'Being busy all the time isn’t the same as making progress.',
  queEs:
    'A one-minute game with the brain of a real fly. You choose how many tasks she has open at once and watch what happens when there are too many: how much she finishes, how stressed she gets and how often she goes out for a smoke.',
  jugar: 'Play',
  descargar: 'Download the report (PDF)',
  gratis: 'Free, no sign-up. Plays on a computer, phone or tablet. The report is in Spanish.',
  neuronas: 'neurons firing',
  enSimulacion: 'in the simulation',
  consolaFrase: 'Real neurons from a fly. The more tasks she has on her plate, the more her brain lights up.',
  tareasLabel: 'Tasks in progress at once (WIP)',
  terminadas: 'finished in the day',
  estres: 'stress at the end of the day',
  cigarros: 'cigarettes',
  consolaNota: 'Average of 200 days played. These are numbers from the game, not from people.',

  // Lo que muestra el juego
  juegoTitulo: 'What the game shows',
  juegoTexto:
    'The same fly, the same day at the office, twice. With 2 tasks at once she finishes 18. With 9 she finishes half as many, even though she’s busy all day.',
  video: 'The fly in her office: first with 2 tasks at once, calm; then with 9, stressed and smoking.',
  pocas: 'Few tasks at once',
  muchas: 'Many tasks at once',
  figcaption: 'First with 2 tasks at once. Then with 9.',
  hecho: 'With 2 tasks at once she finishes 18. With 9 tasks at once she finishes 9, half as many.',
  dosALaVez: '2 at once',
  nueveALaVez: '9 at once',
  total18: '<span class="cifra">18</span> finished',
  total9: '<span class="cifra">9</span> half as many',
  hechoNota: 'Average of 200 days played.',

  // Por dentro
  creditoTitulo: 'Inside, a real fly brain',
  credito1:
    'The neurons that light up in the game come from <a href="https://male-cns.janelia.org">Male CNS v1.0</a>, the complete map of a fly’s nervous system, neuron by neuron. “This project is a collaboration between FlyEM (HHMI Janelia), the University of Cambridge (Dept. of Zoology), the MRC Laboratory of Molecular Biology, and Google Research.”',
  credito2:
    'Data licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, adapted for the game: only some of the neurons are shown, and the activity you see is simulated.',
  zonasTitulo: 'Brain colors',
  zonaVision: 'Vision',
  zonaCentral: 'Central brain',
  zonaMemoria: 'Memory',
  zonaMando: 'Command',
  zonaMovimiento: 'Movement',
  zonaReposo: 'At rest',

  // Preguntas frecuentes (parte 5.2f)
  preguntasTitulo: 'Frequently asked questions',
  pregunta1: 'What is Mosca del WIP?',
  respuesta1:
    'It’s a short game you play in the browser. A fly spends a day at the office, from 09:00 to 18:00, and you choose how many tasks she has open at once, from 1 to 10. Each day lasts about a minute, and when it ends you can compare it with the days you’ve already played.',
  pregunta2: 'What does WIP mean?',
  respuesta2:
    'It’s short for work in progress. It’s everything you’ve started and haven’t finished yet. In the game, it’s the tasks the fly has open at the same time.',
  pregunta3: 'How many tasks at once is best?',
  respuesta3:
    'In the game, the fly finishes the most with 2 at once, 18 a day on average. With each task added she finishes less, and with 9 she finishes half as many, even though she’s busy all day. Up to 3 she stays Calm and doesn’t go out for a smoke, which is why her sustainable limit is 3. The game doesn’t tell you your team’s number, because the fly works alone.',
  pregunta4: 'Is the brain from a real fly?',
  respuesta4:
    'The neurons and their connections are. They come from Male CNS v1.0, the map of a male fly’s central nervous system, neuron by neuron, licensed under CC BY 4.0. The activity you see is simulated. We translate the tasks into something a fly can feel, like dust on her antenna, and simulate how her brain responds. Only some of her neurons are shown.',
  pregunta5: 'Are the numbers about people?',
  respuesta5:
    'No. They come from the game, an experiment on a computer with a single fly, and each one is the average of 200 days played. That each task takes longer and fewer get finished is backed by evidence; that stress goes up is our own assumption. The report says where each number comes from.',
  pregunta6: 'Why does the fly smoke?',
  respuesta6:
    'Flies don’t smoke. The cigarette is a costume for something they really do, cleaning their antennae. The tasks reach her as dust on her antenna, which lights up the cleaning circuit in her brain, and the game draws that as going out for a smoke. The game decides how many cigarettes she smokes. When she’s Calm she never smokes, and each break is 8 minutes without working.',
  pregunta7: 'Can I play on my phone?',
  respuesta7:
    'Yes. It plays on a computer, phone or tablet. On a phone the office is at the top and the controls at the bottom, with tabs for the brain and the days played. You can also play with the phone turned sideways.',
  pregunta8: 'Does it cost anything? Do you keep my data?',
  respuesta8:
    'It’s free and needs no sign-up. We don’t use cookies and only count visits, without identifying anyone. Your days played and what you choose, like the language, are saved only in your browser.',
  pregunta9: 'How do I use it with my team?',
  respuesta9:
    'Play one day with 2 tasks at once and another with 9, and compare the Days played table. On a computer, the Exhibition view shows the game large, for a TV or a projector. The report, in Spanish, has four steps to try a limit with your team and takes 10 minutes to read.',

  // El informe, el cierre y el pie
  informeTitulo: 'The report',
  informeTexto:
    'It explains where each number comes from and gives four steps to try a limit with your team. It takes 10 minutes to read.',
  informeNota: '17 pages, 4 MB. Written in Spanish.',
  cierre: 'Closing',
  cierreFrase: 'A sustainable limit, not one thing at a time.',
  hechoPor:
    'Made by <a href="https://www.linkedin.com/in/felipefernandezandrade/">Felipe Fernández</a> · <a href="https://deliverycraft.ai">deliverycraft.ai</a>',
  sinCookies: 'No cookies. We only count visits, without identifying anyone.',
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
      `With ${n} at once: ${terminadas} finished in the day, ${nivel.toLowerCase()} at the end of the day and ${cigarros} ${cigarros === 1 ? 'cigarette' : 'cigarettes'}.`,
  },
};
