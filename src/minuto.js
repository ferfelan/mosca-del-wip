// OPCIÓN 5 del inicio (Etapa 8.13, EN PRUEBA, 2026-11-14). "Un día de oficina
// en un minuto" (la frase es la del juego). Felipe pidió tres propuestas con
// otro mensaje, porque el de 9 y 2 a la vez ya sale tres veces en la página.
// Esta dice qué es esto y cuánto dura: la mosca trabaja en su escritorio y por
// la ventana pasa su día, de 9 a 18, en un minuto de verdad. El sol cruza, el
// cielo cambia, el reloj de la pared corre, el café deja de humear y al final
// se prende la lámpara. A media tarde pasa por fuera una mosca libre, y ella la
// mira. Arriba, el cronómetro.
//
// No hay ningún número del juego, salvo que su día va de 9 a 18 y dura un
// minuto. El cronómetro cuenta tiempo de verdad: si la pestaña queda atrás o el
// dibujo sale de la pantalla, se detiene y sigue cuando vuelve.
//
// Parte solo la primera vez que se ve. Como dura más de 5 segundos, el botón
// lo pausa y lo sigue, y al terminar lo repite. Solo cambian la posición y la
// transparencia. Sin JavaScript o con "reducir movimiento" queda quieto a las
// 18:00, con el cronómetro en 1:00.
const DURA = 60000; // un minuto de verdad
const SE_VE = 0.45;

const entre = (v) => Math.max(0, Math.min(1, v));

export function iniciarMinuto() {
  const raiz = document.querySelector('.minuto');
  if (!raiz) return null;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const uno = (s) => raiz.querySelector(s);
  const el = {
    crono: uno('[data-crono]'),
    boton: uno('[data-boton]'),
    sol: uno('[data-sol]'),
    mediodia: uno('[data-mediodia]'),
    tarde: uno('[data-tarde]'),
    nube1: uno('[data-nube1]'),
    nube2: uno('[data-nube2]'),
    libre: uno('[data-libre]'),
    hora: uno('[data-hora]'),
    minutero: uno('[data-minutero]'),
    vapor: uno('[data-vapor]'),
    luz: uno('[data-luz]'),
    brillos: uno('[data-brillos]'),
  };
  let t = 1; // qué parte del día va, de 0 (las 9) a 1 (las 18)
  let partio = false;
  let aLaVista = true;
  let ultimo = 0;
  let cuadro = 0;
  let dicho = '';

  // Deja el dibujo como está a esa altura del día
  function pintar() {
    raiz.style.setProperty('--dia', t.toFixed(4));
    const texto = t >= 1 ? '1:00' : `0:${String(Math.floor(t * 60 + 1e-6)).padStart(2, '0')}`;
    if (texto !== dicho) {
      dicho = texto;
      el.crono.textContent = texto;
    }
    // el sol sale por la izquierda de la ventana, sube y baja por la derecha
    el.sol.style.transform = `translate(${(62 + t * 226).toFixed(1)}px, ${(172 - 104 * Math.sin(Math.PI * t)).toFixed(1)}px)`;
    el.mediodia.style.opacity = entre(1 - Math.abs(t - 0.45) / 0.4).toFixed(3);
    el.tarde.style.opacity = entre((t - 0.62) / 0.38).toFixed(3);
    el.nube1.style.transform = `translate(${(-30 + t * 94).toFixed(1)}px, 0px)`;
    el.nube2.style.transform = `translate(${(-50 + t * 90).toFixed(1)}px, 0px)`;
    // el reloj: de las 9 a las 18, con el minutero dando sus nueve vueltas
    el.hora.style.transform = `rotate(${(270 + 270 * t).toFixed(2)}deg)`;
    el.minutero.style.transform = `rotate(${(t * 9 * 360).toFixed(2)}deg)`;
    el.vapor.style.opacity = (entre(1 - t / 0.3) * 0.75).toFixed(3);
    el.luz.style.opacity = (entre((t - 0.86) / 0.1) * 0.24).toFixed(3);
    // la mosca libre pasa por fuera, de derecha a izquierda, y la de adentro la mira
    const f = (t - 0.5) / 0.1;
    if (f > 0 && f < 1) {
      el.libre.style.opacity = entre(Math.min(f, 1 - f) * 12).toFixed(3);
      el.libre.style.transform = `translate(${(316 - f * 282).toFixed(1)}px, ${(108 + 12 * Math.sin(f * Math.PI * 7) - 22 * Math.sin(f * Math.PI)).toFixed(1)}px)`;
      el.brillos.style.transform = `translate(${(-3 * Math.sin(f * Math.PI)).toFixed(2)}px, ${(-1.2 * Math.sin(f * Math.PI)).toFixed(2)}px)`;
    } else {
      el.libre.style.opacity = '0';
      el.brillos.style.transform = '';
    }
  }

  function poner(estado) {
    raiz.dataset.estado = estado;
  }

  function paso(ahora) {
    cuadro = 0;
    if (raiz.dataset.estado !== 'andando' || !aLaVista || document.hidden) return;
    // (si hubo un corte largo, ese rato no cuenta: el minuto es de tiempo a la vista)
    t = Math.min(1, t + Math.min(1000, ahora - ultimo) / DURA);
    ultimo = ahora;
    pintar();
    if (t >= 1) {
      poner('quieta');
      el.crono.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
      return;
    }
    cuadro = requestAnimationFrame(paso);
  }

  function seguir() {
    if (cuadro || raiz.dataset.estado !== 'andando' || !aLaVista || document.hidden) return;
    ultimo = performance.now();
    cuadro = requestAnimationFrame(paso);
  }

  function jugar() {
    t = 0;
    pintar();
    poner('andando');
    seguir();
  }

  // Deja el día ya terminado, quieto (y ya no parte solo)
  function mostrarCerrado() {
    partio = true;
    cancelAnimationFrame(cuadro);
    cuadro = 0;
    t = 1;
    pintar();
    poner('quieta');
  }

  el.boton.addEventListener('click', () => {
    partio = true;
    const estado = raiz.dataset.estado;
    if (estado === 'andando') poner('pausada');
    else if (estado === 'pausada') {
      poner('andando');
      seguir();
    } else jugar();
  });
  document.addEventListener('visibilitychange', seguir);

  if (quieto.matches || !('IntersectionObserver' in window)) {
    mostrarCerrado();
  } else {
    raiz.classList.add('viva');
    // Antes de que se vea: las 9 de la mañana y el cronómetro en cero
    t = 0;
    pintar();
    poner('por-partir');
    new IntersectionObserver(
      ([e]) => {
        const altoPantalla = e.rootBounds?.height || innerHeight;
        aLaVista = e.isIntersecting;
        if (!partio && e.isIntersecting && (e.intersectionRatio >= SE_VE || e.intersectionRect.height >= altoPantalla * 0.5)) {
          partio = true;
          jugar();
        } else seguir();
      },
      { rootMargin: '-64px 0px 0px 0px', threshold: [0, 0.2, SE_VE, 0.7, 1] },
    ).observe(raiz);
  }

  // (para las pruebas: irA deja el día a esa altura, de 0 a 1, sin que corra)
  return {
    mostrarCerrado,
    estado: () => raiz.dataset.estado,
    va: () => t,
    irA(parte) {
      partio = true;
      cancelAnimationFrame(cuadro);
      cuadro = 0;
      t = entre(parte);
      pintar();
      poner(t >= 1 ? 'quieta' : 'pausada');
    },
  };
}
