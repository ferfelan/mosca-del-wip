// El tablero de la mosca, vivo (Etapa 8.13, 2026-11-14, pedido de Felipe:
// rediseñar el inicio de la portada "con el estilo que tenemos en ¿Qué ganó
// la mosca al limitar su WIP? o Lo que se lleva tu equipo, así tipo dibujo
// pero algo bacán"). Es el título dibujado ("Ocupado todo el día. ¿Y qué
// terminaste?"): un día de oficina de la mosca en su tablero, primero con 9
// tareas a la vez y después con 2. El reloj va de 9 a 18, cada tarea avanza en
// "En curso" y cae en "Hecho".
//
// Los tiempos son los del juego, no inventados: salen de MIRAR la corrida
// oficial (200 días por cada caso, semilla 2024, la misma de
// docs/corrida-oficial.json), sin cambiar ninguna regla ni tocar
// src/brain.js. "caen" es el minuto del día (desde las 09:00) en que, en
// promedio, ya cayó en "Hecho" la tarea 1, la 2, la 3… (el momento en que el
// promedio de terminadas pasa de k − 0,5); "porTarea", los minutos que tarda
// cada tarea (60 y 534: 1 hora y casi 9); "fuma", el minuto del primer
// cigarro (con 2 a la vez no fuma). Con 9 a la vez termina 9 y con 2 termina
// 18, como en el resto de la página. Para comprobar que siguen calzando con el
// juego: node scripts/medir-jornada.mjs (los mide de nuevo y avisa si cambió
// algo). Cómo se probó todo: docs/etapa8-13.md.
//
// Pasa una vez por visita, cuando el dibujo ya se ve: el día con 9 y después
// el día con 2. Después manda la persona, con los dos botones (cada uno vuelve
// a jugar su día). Solo se mueven la posición y la transparencia: nada cambia
// de tamaño ni empuja lo de al lado. Sin JavaScript queda el día de 9 ya
// cerrado, con las dos frases a la vista. Con "reducir movimiento" no se juega
// nada: los botones muestran cada día ya cerrado.
export const MINUTOS_DIA = 540; // de 09:00 a 18:00
export const DIAS = {
  muchas: { enCurso: 9, porTarea: 534, fuma: 74, caen: [23, 73, 129, 181, 248, 316, 381, 443, 505] },
  pocas: { enCurso: 2, porTarea: 60, fuma: null, caen: [14, 46, 75, 106, 135, 163, 195, 223, 253, 282, 313, 343, 374, 404, 434, 465, 494, 525] },
};
const DURA_DIA = 7600; // ms que dura un día en el dibujo (en el juego dura un minuto)
const PAUSA = 1700; // ms que queda a la vista el día cerrado antes de jugar el otro
const SE_VE = 0.45; // parte cuando ya se ve casi la mitad (como las cargas de más abajo)

// Cuánto lleva avanzada la tarea de un lugar de "En curso" en ese minuto.
// Cada lugar entrega una tarea cada cierto rato (las horas de "caen" se
// reparten por turno entre los lugares). La primera viene empezada de ayer,
// como en el juego, y la última queda a medias para mañana.
export function avance(dia, lugar, minuto) {
  let antes = null;
  for (let k = lugar; k < dia.caen.length; k += dia.enCurso) {
    const cae = dia.caen[k];
    if (minuto < cae) return antes === null ? 1 - (cae - minuto) / dia.porTarea : (minuto - antes) / (cae - antes);
    antes = cae;
  }
  return (minuto - (antes ?? 0)) / dia.porTarea;
}

export function iniciarJornada() {
  const raiz = document.querySelector('.jornada');
  if (!raiz) return null;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const el = {
    hora: raiz.querySelector('[data-hora]'),
    tareas: [...raiz.querySelectorAll('.tarea')],
    hechas: [...raiz.querySelectorAll('.pila-hecho i')],
    enCurso: raiz.querySelector('[data-encurso]'),
    cuenta: raiz.querySelector('[data-hechas]'),
    botones: [...raiz.querySelectorAll('[data-elegir]')],
    resultado: raiz.querySelector('.jornada-resultado'),
  };
  let caso = 'muchas';
  let transcurrido = 0;
  let ultimo = 0;
  let raf = 0;
  let andando = false;
  let visible = false;
  let enSerie = false; // la primera vez: el día con 9 y después el día con 2
  let partio = false;
  let espera = 0;
  let pintadas = -1;

  // Dibuja el día de ese caso en ese minuto. Solo toca lo que cambió
  function pintar(minuto, conSalto = false) {
    const dia = DIAS[caso];
    if (raiz.dataset.caso !== caso) {
      raiz.dataset.caso = caso;
      el.enCurso.textContent = dia.enCurso;
      el.tareas.forEach((tarea, i) => tarea.classList.toggle('libre', i >= dia.enCurso));
      for (const boton of el.botones) boton.setAttribute('aria-pressed', String(boton.dataset.elegir === caso));
      pintadas = -1;
    }
    raiz.style.setProperty('--dia', (minuto / MINUTOS_DIA).toFixed(4));
    for (let i = 0; i < dia.enCurso; i++) {
      el.tareas[i].style.setProperty('--p', Math.min(1, Math.max(0.03, avance(dia, i, minuto))).toFixed(3));
    }
    const terminadas = dia.caen.filter((cae) => cae <= minuto).length;
    if (terminadas !== pintadas) {
      el.hechas.forEach((ficha, i) => ficha.classList.toggle('hecha', i < terminadas));
      el.cuenta.textContent = terminadas;
      // La tarea que acaba de caer en "Hecho" salta en su lugar de "En curso"
      if (conSalto && terminadas > pintadas && pintadas >= 0) {
        el.tareas[(terminadas - 1) % dia.enCurso].animate?.(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }],
          { duration: 380, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.3)' },
        );
      }
      pintadas = terminadas;
    }
    // El reloj avanza de a 10 minutos y cierra justo a las 18:00
    const m = minuto >= MINUTOS_DIA ? MINUTOS_DIA : Math.floor(minuto / 10) * 10;
    const texto = `${String(9 + Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    if (el.hora.textContent !== texto) el.hora.textContent = texto;
    const cara = dia.fuma !== null && minuto >= dia.fuma ? 'colapsada' : 'tranquila';
    if (raiz.dataset.cara !== cara) raiz.dataset.cara = cara;
  }

  function cerrar() {
    andando = false;
    ultimo = 0;
    if (enSerie && caso === 'muchas') {
      espera = setTimeout(() => jugar('pocas'), PAUSA);
      return;
    }
    enSerie = false;
    raiz.dataset.estado = 'quieta';
  }

  function cuadro(t) {
    raf = 0;
    if (!andando) return;
    // (si la pestaña quedó atrás un rato, el día sigue donde iba, no salta)
    transcurrido += ultimo ? Math.min(64, t - ultimo) : 0;
    ultimo = t;
    const minuto = Math.min(MINUTOS_DIA, (transcurrido / DURA_DIA) * MINUTOS_DIA);
    pintar(minuto, true);
    if (minuto >= MINUTOS_DIA) cerrar();
    else pedirCuadro();
  }
  function pedirCuadro() {
    if (!raf && andando && visible && !document.hidden) raf = requestAnimationFrame(cuadro);
    else if (!raf) ultimo = 0;
  }

  // Juega el día de ese caso desde las 09:00
  function jugar(cual) {
    clearTimeout(espera);
    caso = cual;
    transcurrido = 0;
    ultimo = 0;
    andando = true;
    raiz.dataset.estado = 'andando';
    pintar(0);
    pedirCuadro();
  }

  // Deja a la vista el día de ese caso ya cerrado, a las 18:00 (y ya no parte
  // solo: quien lo pide quiere el dibujo quieto)
  function mostrarCerrado(cual) {
    partio = true;
    clearTimeout(espera);
    cancelAnimationFrame(raf);
    raf = 0;
    andando = false;
    enSerie = false;
    caso = cual;
    pintar(MINUTOS_DIA);
    raiz.dataset.estado = 'quieta';
  }

  for (const boton of el.botones) {
    boton.addEventListener('click', () => {
      enSerie = false;
      partio = true;
      // Desde que la persona elige, la frase del día se le lee a quien usa lector de pantalla
      el.resultado.setAttribute('aria-live', 'polite');
      if (quieto.matches) mostrarCerrado(boton.dataset.elegir);
      else jugar(boton.dataset.elegir);
    });
  }

  raiz.classList.add('viva');
  if (quieto.matches || !('IntersectionObserver' in window)) {
    mostrarCerrado('muchas');
  } else {
    // Antes de que se vea: el día con 9, detenido en las 09:00
    pintar(0);
    raiz.dataset.estado = 'por-partir';
    new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        const altoPantalla = e.rootBounds?.height || innerHeight;
        if (!partio && visible && (e.intersectionRatio >= SE_VE || e.intersectionRect.height >= altoPantalla * 0.5)) {
          partio = true;
          enSerie = true;
          jugar('muchas');
        }
        pedirCuadro();
      },
      { rootMargin: '-64px 0px 0px 0px', threshold: [0, 0.2, SE_VE, 0.7, 1] },
    ).observe(raiz);
    document.addEventListener('visibilitychange', pedirCuadro);
  }

  // (para las pruebas: deja el dibujo quieto, con un día ya cerrado)
  return { mostrarCerrado, estado: () => raiz.dataset.estado, caso: () => caso };
}
