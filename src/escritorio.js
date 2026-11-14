// OPCIÓN 3 del inicio (Etapa 8.13, EN PRUEBA, 2026-11-14). Felipe vio el
// tablero de la mosca (la opción 1, src/jornada.js) y pidió dos propuestas más
// del inicio para elegir. Esta es "El escritorio de la mosca al cerrar el
// día": la mosca, grande, en su escritorio a las 18:00. El escritorio es su
// tablero: a la izquierda la pila de Por hacer, al medio lo que tiene En curso
// y a la derecha la torre de Hecho.
//
// Los números son los de la corrida oficial del juego (docs/corrida-oficial.json):
// con 9 tareas a la vez cierra el día Colapsada, con 13 cigarros (las 13
// colillas están dibujadas una por una) y 9 terminadas; con 2 a la vez cierra
// Tranquila, sin fumar y con 18 terminadas.
//
// La primera vez que se ve, una sola vez: el día con 9 se arma sobre el
// escritorio (caen las tareas, sube la torre hasta 9) y después cambia al día
// con 2 (siete tareas vuelven a la pila, la torre sube a 18). Después manda la
// persona, con los dos botones. El dibujo se mueve con CSS (src/opciones.css):
// aquí solo se dice qué día se ve y se lleva la cuenta. Solo cambian la
// posición y la transparencia. Sin JavaScript queda el día con 9, con las dos
// frases a la vista. Con "reducir movimiento" los botones cambian el día de
// una vez.
const HECHAS = { muchas: 9, pocas: 18 };
const EN_CURSO = { muchas: 9, pocas: 2 };
const CARA = { muchas: 'colapsada', pocas: 'tranquila' };
const SE_VE = 0.45; // parte cuando ya se ve casi la mitad (como las cargas de más abajo)
const PAUSA = 3600; // ms que queda a la vista el día con 9 antes de cambiar al de 2 (alcanza para leer su frase)

export function iniciarEscritorio() {
  const raiz = document.querySelector('.escritorio');
  if (!raiz) return null;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const el = {
    enCurso: raiz.querySelector('[data-encurso]'),
    cuenta: raiz.querySelector('[data-hechas]'),
    botones: [...raiz.querySelectorAll('[data-elegir]')],
    resultado: raiz.querySelector('.escritorio-resultado'),
  };
  let caso = 'muchas';
  let partio = false;
  let esperas = [];
  let hechas = HECHAS.muchas;

  const despues = (ms, hacer) => esperas.push(setTimeout(hacer, ms));
  function cortar() {
    for (const espera of esperas) clearTimeout(espera);
    esperas = [];
  }

  // Lleva el número de "Hecho" hasta ese valor, de a una, al ritmo de la torre
  function contar(hasta, paso, desde = 0) {
    if (!paso || hasta === hechas) {
      hechas = hasta;
      el.cuenta.textContent = hechas;
      return;
    }
    const sentido = hasta > hechas ? 1 : -1;
    let n = 0;
    for (let v = hechas + sentido; v !== hasta + sentido; v += sentido) {
      const valor = v;
      despues(desde + n * paso, () => {
        hechas = valor;
        el.cuenta.textContent = valor;
      });
      n++;
    }
  }

  // Deja a la vista el día de ese caso (el dibujo se mueve solo, con CSS)
  function poner(cual, conMovimiento) {
    caso = cual;
    raiz.dataset.caso = cual;
    raiz.dataset.cara = CARA[cual];
    el.enCurso.textContent = EN_CURSO[cual];
    for (const boton of el.botones) boton.setAttribute('aria-pressed', String(boton.dataset.elegir === cual));
    // (la torre sube de a una cada 60 ms y baja de a una cada 26 ms: opciones.css)
    if (conMovimiento) contar(HECHAS[cual], cual === 'pocas' ? 60 : 26, cual === 'pocas' ? 340 : 0);
    else contar(HECHAS[cual], 0);
  }

  // La primera vez: se arma el día con 9 y después cambia al de 2
  function partir() {
    raiz.dataset.estado = 'andando';
    // (la torre sube de a una cada 90 ms, desde los 200 ms: opciones.css)
    contar(HECHAS.muchas, 90, 420);
    // con la cuarta tarea encima, se le nota en la cara
    despues(420, () => (raiz.dataset.cara = 'colapsada'));
    despues(200 + 9 * 90 + 400 + PAUSA, () => {
      poner('pocas', true);
      despues(1500, () => (raiz.dataset.estado = 'quieta'));
    });
  }

  // Deja a la vista el día de ese caso, quieto (y ya no parte solo)
  function mostrarCerrado(cual) {
    partio = true;
    cortar();
    raiz.dataset.estado = 'quieta';
    poner(cual, false);
  }

  for (const boton of el.botones) {
    boton.addEventListener('click', () => {
      partio = true;
      cortar();
      // Desde que la persona elige, la frase del día se le lee a quien usa lector de pantalla
      el.resultado.setAttribute('aria-live', 'polite');
      raiz.dataset.estado = 'quieta';
      poner(boton.dataset.elegir, !quieto.matches);
    });
  }

  raiz.classList.add('viva');
  if (quieto.matches || !('IntersectionObserver' in window)) {
    mostrarCerrado('muchas');
  } else {
    // Antes de que se vea: el escritorio vacío, la mosca tranquila y la cuenta en 0
    raiz.dataset.estado = 'por-partir';
    raiz.dataset.cara = 'tranquila';
    hechas = 0;
    el.cuenta.textContent = 0;
    new IntersectionObserver(
      ([e], observador) => {
        const altoPantalla = e.rootBounds?.height || innerHeight;
        if (!partio && e.isIntersecting && (e.intersectionRatio >= SE_VE || e.intersectionRect.height >= altoPantalla * 0.5)) {
          partio = true;
          observador.disconnect();
          partir();
        }
      },
      { rootMargin: '-64px 0px 0px 0px', threshold: [0, 0.2, SE_VE, 0.7, 1] },
    ).observe(raiz);
  }

  // (para las pruebas: deja el dibujo quieto, con un día ya cerrado)
  return { mostrarCerrado, estado: () => raiz.dataset.estado, caso: () => caso };
}
