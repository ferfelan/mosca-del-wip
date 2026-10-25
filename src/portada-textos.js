// Textos de la portada en inglés (2026-10-24). El español está en index.html:
// cada clave es el data-t (contenido) o el data-t-aria / data-t-title de un
// elemento. Mismo sentido y tono que el español, sin agregar ni quitar nada;
// los términos son los de docs/glosario-ingles.md (los mismos del juego).
export const INGLES = {
  // Barra de arriba
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
  gratis: 'Free, no sign-up. The report is in Spanish.',
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
// con su nombre del juego (Tranqui, Ocupada...), que no se toca.
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
    nivel: (nivel) => ({ Tranqui: 'Calm', Ocupada: 'Busy', Estresada: 'Stressed', Colapsada: 'Overwhelmed' })[nivel],
    resumen: (n, terminadas, nivel, cigarros) =>
      `With ${n} at once: ${terminadas} finished in the day, ${nivel.toLowerCase()} at the end of the day and ${cigarros} ${cigarros === 1 ? 'cigarette' : 'cigarettes'}.`,
  },
};
