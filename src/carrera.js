// OPCIÓN 2 del inicio (Etapa 8.13, EN PRUEBA, 2026-11-14). Felipe vio el
// tablero de la mosca (la opción 1, src/jornada.js) y pidió dos propuestas más
// del inicio para elegir. Esta es "El mismo día, dos veces": el mismo día de
// oficina corre a la vez en dos pistas, con un solo reloj. Arriba, con 9
// tareas a la vez; abajo, con 2. En cada pista, la cara de la mosca, lo que
// tiene En curso y los 18 lugares de Hecho.
//
// Los tiempos son los mismos de la opción 1: los de la corrida oficial del
// juego, sin cambiarle nada (DIAS y avance vienen de src/jornada.js, y
// node scripts/medir-jornada.mjs los comprueba). Con 9 a la vez termina 9 y
// con 2 termina 18.
//
// Corre una vez por visita, cuando el dibujo ya se ve, y queda quieto con el
// día cerrado. "Ver de nuevo" lo corre otra vez. Solo se mueven la posición y
// la transparencia. Sin JavaScript queda el día ya cerrado. Con "reducir
// movimiento" no corre nada y no hay botón.
import { DIAS, MINUTOS_DIA, avance } from './jornada.js';

const DURA_DIA = 9200; // ms que dura el día en el dibujo (en el juego dura un minuto)
const SE_VE = 0.45; // parte cuando ya se ve casi la mitad (como las cargas de más abajo)

export function iniciarCarrera() {
  const raiz = document.querySelector('.carrera');
  if (!raiz) return null;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const hora = raiz.querySelector('[data-hora]');
  const boton = raiz.querySelector('[data-denuevo]');
  const pistas = [...raiz.querySelectorAll('.pista')].map((pista) => ({
    pista,
    dia: DIAS[pista.dataset.caso],
    tareas: [...pista.querySelectorAll('.pista-tarea')],
    fichas: [...pista.querySelectorAll('.pista-meta i')],
    cuenta: pista.querySelector('[data-hechas]'),
    pintadas: -1,
  }));
  let transcurrido = 0;
  let ultimo = 0;
  let raf = 0;
  let andando = false;
  let visible = false;
  let partio = false;

  // Dibuja las dos pistas en ese minuto del día. Solo toca lo que cambió
  function pintar(minuto, conSalto = false) {
    raiz.style.setProperty('--dia', (minuto / MINUTOS_DIA).toFixed(4));
    for (const p of pistas) {
      const { dia } = p;
      p.tareas.forEach((tarea, i) => {
        tarea.style.setProperty('--p', Math.min(1, Math.max(0.03, avance(dia, i, minuto))).toFixed(3));
      });
      const terminadas = dia.caen.filter((cae) => cae <= minuto).length;
      if (terminadas !== p.pintadas) {
        p.fichas.forEach((ficha, i) => ficha.classList.toggle('hecha', i < terminadas));
        p.cuenta.textContent = terminadas;
        // La tarea que acaba de caer en "Hecho" salta en su lugar de "En curso"
        if (conSalto && terminadas > p.pintadas && p.pintadas >= 0) {
          p.tareas[(terminadas - 1) % dia.enCurso].animate?.(
            [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
            { duration: 380, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.3)' },
          );
        }
        p.pintadas = terminadas;
      }
      const cara = dia.fuma !== null && minuto >= dia.fuma ? 'colapsada' : 'tranquila';
      if (p.pista.dataset.cara !== cara) p.pista.dataset.cara = cara;
    }
    // El reloj avanza de a 10 minutos y cierra justo a las 18:00
    const m = minuto >= MINUTOS_DIA ? MINUTOS_DIA : Math.floor(minuto / 10) * 10;
    const texto = `${String(9 + Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    if (hora.textContent !== texto) hora.textContent = texto;
  }

  function cuadro(t) {
    raf = 0;
    if (!andando) return;
    // (si la pestaña quedó atrás un rato, el día sigue donde iba, no salta)
    transcurrido += ultimo ? Math.min(64, t - ultimo) : 0;
    ultimo = t;
    const minuto = Math.min(MINUTOS_DIA, (transcurrido / DURA_DIA) * MINUTOS_DIA);
    pintar(minuto, true);
    if (minuto >= MINUTOS_DIA) {
      andando = false;
      ultimo = 0;
      raiz.dataset.estado = 'quieta';
      // Al cerrar el día, las dos cuentas saltan una vez: 9 y 18
      for (const p of pistas) {
        p.cuenta.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }], {
          duration: 520,
          easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.3)',
        });
      }
    } else pedirCuadro();
  }
  function pedirCuadro() {
    if (!raf && andando && visible && !document.hidden) raf = requestAnimationFrame(cuadro);
    else if (!raf) ultimo = 0;
  }

  // Corre el día desde las 09:00
  function jugar() {
    transcurrido = 0;
    ultimo = 0;
    andando = true;
    raiz.dataset.estado = 'andando';
    for (const p of pistas) p.pintadas = -1;
    pintar(0);
    pedirCuadro();
  }

  // Deja a la vista el día ya cerrado, a las 18:00 (y ya no parte solo)
  function mostrarCerrado() {
    partio = true;
    cancelAnimationFrame(raf);
    raf = 0;
    andando = false;
    pintar(MINUTOS_DIA);
    raiz.dataset.estado = 'quieta';
  }

  boton.addEventListener('click', () => {
    partio = true;
    if (quieto.matches) mostrarCerrado();
    else jugar();
  });

  if (quieto.matches || !('IntersectionObserver' in window)) {
    // (sin movimiento no hay nada que volver a ver: el botón no aparece)
    mostrarCerrado();
  } else {
    raiz.classList.add('viva');
    // Antes de que se vea: las 09:00, detenido
    pintar(0);
    raiz.dataset.estado = 'por-partir';
    new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        const altoPantalla = e.rootBounds?.height || innerHeight;
        if (!partio && visible && (e.intersectionRatio >= SE_VE || e.intersectionRect.height >= altoPantalla * 0.5)) {
          partio = true;
          jugar();
        }
        pedirCuadro();
      },
      { rootMargin: '-64px 0px 0px 0px', threshold: [0, 0.2, SE_VE, 0.7, 1] },
    ).observe(raiz);
    document.addEventListener('visibilitychange', pedirCuadro);
  }

  // (para las pruebas: deja el dibujo quieto, con el día ya cerrado)
  return { mostrarCerrado, estado: () => raiz.dataset.estado };
}
