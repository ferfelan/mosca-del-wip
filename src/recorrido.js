// El recorrido (Etapa 8.8, 2026-11-09, pedido de Felipe: "en el juego hace
// falta como ese mini tutorial flash, dónde está cada cosa y para qué").
//
// Oscurece la pantalla, deja a la vista una cosa a la vez (el foco) y la
// explica en una tarjeta chica a su lado: un título y una línea. Se avanza con
// "Siguiente" (o la flecha derecha, o Enter), se vuelve con "Atrás" (o la
// flecha izquierda) y se sale con "Saltar" o Esc. El foco pasa de una cosa a
// la otra deslizándose, para que se vea a dónde se fue (con "reducir
// movimiento" cambia de golpe).
//
// Este archivo no sabe nada del juego: quien lo usa (src/main.js) le dice
// qué pasos hay y dónde está cada cosa en la pantalla, los textos en el
// idioma de ahora y qué hacer al abrir y al cerrar (pausar el día y seguirlo).
// La capa y sus botones están en jugar/index.html (#recorrido) y sus estilos,
// en src/style.css.

const MARGEN = 12; // aire entre la tarjeta y el borde de la pantalla
const AIRE = 8; // lo que el foco sobra alrededor de la cosa que muestra
const SEPARACION = 14; // entre el foco y la tarjeta
const SIGUE_MS = 700; // después de cada paso, el foco sigue a su cosa (los paneles se acomodan de a poco)

/**
 * @param {object} o
 * @param {() => {clave: string, donde: () => (DOMRect | null)}[]} o.pasos  los pasos de ahora (los que no se ven se saltan)
 * @param {(clave: string) => [string, string]} o.texto  título y línea de un paso, en el idioma de ahora
 * @param {() => {paso: (i: number, n: number) => string, sigue: string, listo: string}} o.rotulos
 * @param {() => void} [o.alAbrir]
 * @param {() => void} [o.alCerrar]
 */
export function crearRecorrido({ pasos, texto, rotulos, alAbrir, alCerrar }) {
  const capa = document.getElementById('recorrido');
  const foco = document.getElementById('recorrido-foco');
  const tarjeta = document.getElementById('recorrido-tarjeta');
  const elPaso = document.getElementById('recorrido-paso');
  const elTitulo = document.getElementById('recorrido-titulo');
  const elTexto = document.getElementById('recorrido-texto');
  const btnSaltar = document.getElementById('recorrido-saltar');
  const btnAtras = document.getElementById('recorrido-atras');
  const btnSigue = document.getElementById('recorrido-sigue');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');

  let lista = [];
  let indice = 0;
  let abierto = false;
  let volverA = null; // lo que tenía el foco del teclado al abrir
  let sigueHasta = 0;
  let cuadro = 0;

  const seVe = (r) => !!r && r.width > 1 && r.height > 1;
  const limitar = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

  // Pone el foco sobre la cosa del paso y la tarjeta a su lado, donde quepa
  function ubicar() {
    const r = lista[indice]?.donde();
    if (!seVe(r)) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = Math.max(4, r.left - AIRE);
    const y = Math.max(4, r.top - AIRE);
    const w = Math.min(vw - 4, r.right + AIRE) - x;
    const h = Math.min(vh - 4, r.bottom + AIRE) - y;
    foco.style.width = `${Math.round(w)}px`;
    foco.style.height = `${Math.round(h)}px`;
    foco.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;

    const tw = tarjeta.offsetWidth;
    const th = tarjeta.offsetHeight;
    // Cuánto sobra a cada lado del foco con la tarjeta puesta ahí
    const sobra = {
      der: vw - (x + w) - SEPARACION - tw - MARGEN,
      izq: x - SEPARACION - tw - MARGEN,
      abajo: vh - (y + h) - SEPARACION - th - MARGEN,
      arriba: y - SEPARACION - th - MARGEN,
    };
    // En pantallas angostas, primero arriba o abajo; en las anchas, al lado
    const orden = vw < 700 ? ['abajo', 'arriba', 'der', 'izq'] : ['der', 'izq', 'abajo', 'arriba'];
    const lado = orden.find((l) => sobra[l] >= 0) ?? orden.reduce((a, b) => (sobra[b] > sobra[a] ? b : a));
    let tx;
    let ty;
    if (lado === 'der' || lado === 'izq') {
      tx = lado === 'der' ? x + w + SEPARACION : x - SEPARACION - tw;
      ty = y + Math.min(0, h - th) / 2; // arriba con arriba; si la cosa es más baja que la tarjeta, centradas
      if (h > th) ty = y + Math.min(24, (h - th) / 2);
    } else {
      tx = x + (w - tw) / 2;
      ty = lado === 'abajo' ? y + h + SEPARACION : y - SEPARACION - th;
    }
    tx = limitar(tx, MARGEN, vw - tw - MARGEN);
    ty = limitar(ty, MARGEN, vh - th - MARGEN);
    tarjeta.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`;
  }

  // Un rato después de cada paso, el foco sigue a su cosa: los paneles y la
  // oficina se acomodan de a poco (medio segundo) y la cosa se mueve con ellos
  function seguir() {
    cancelAnimationFrame(cuadro);
    sigueHasta = performance.now() + SIGUE_MS;
    const paso = () => {
      if (!abierto) return;
      ubicar();
      if (performance.now() < sigueHasta) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
  }

  function mostrar(i) {
    indice = limitar(i, 0, lista.length - 1);
    const [titulo, linea] = texto(lista[indice].clave);
    const r = rotulos();
    elPaso.textContent = r.paso(indice + 1, lista.length);
    elTitulo.textContent = titulo;
    elTexto.textContent = linea;
    btnAtras.hidden = indice === 0;
    btnSigue.textContent = indice === lista.length - 1 ? r.listo : r.sigue;
    ubicar();
    seguir();
  }

  function abrir() {
    if (abierto) return;
    volverA = document.activeElement;
    alAbrir?.();
    lista = pasos().filter((p) => seVe(p.donde()));
    if (!lista.length) {
      alCerrar?.();
      return;
    }
    abierto = true;
    capa.hidden = false;
    document.body.classList.add('en-recorrido');
    // El primer paso aparece en su lugar; los siguientes llegan deslizándose
    capa.classList.remove('con-movimiento');
    mostrar(0);
    if (!quieto.matches) requestAnimationFrame(() => requestAnimationFrame(() => abierto && capa.classList.add('con-movimiento')));
    tarjeta.focus({ preventScroll: true });
  }

  function cerrar() {
    if (!abierto) return;
    abierto = false;
    cancelAnimationFrame(cuadro);
    capa.hidden = true;
    capa.classList.remove('con-movimiento');
    document.body.classList.remove('en-recorrido');
    alCerrar?.();
    // El foco del teclado vuelve a donde estaba (si todavía se ve)
    if (volverA?.isConnected && volverA.getClientRects().length) volverA.focus({ preventScroll: true });
    volverA = null;
  }

  const siguiente = () => (indice >= lista.length - 1 ? cerrar() : mostrar(indice + 1));
  const anterior = () => indice > 0 && mostrar(indice - 1);

  btnSaltar.addEventListener('click', cerrar);
  btnAtras.addEventListener('click', anterior);
  btnSigue.addEventListener('click', siguiente);

  // Mientras está abierto, el teclado es del recorrido (las teclas del juego,
  // como Espacio o los números, no hacen nada): por eso escucha antes que nadie
  window.addEventListener(
    'keydown',
    (e) => {
      if (!abierto) return;
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrar();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        siguiente();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        anterior();
      } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        siguiente();
      } else if (e.key === 'Tab') {
        // El foco del teclado no sale de la tarjeta
        const botones = [btnSaltar, btnAtras, btnSigue].filter((b) => !b.hidden);
        const actual = botones.indexOf(document.activeElement);
        e.preventDefault();
        const paso = e.shiftKey ? -1 : 1;
        // (desde la tarjeta, el primer Tab va al botón principal)
        const proximo = actual === -1 ? botones.length - 1 : (actual + paso + botones.length) % botones.length;
        botones[proximo].focus();
      }
    },
    true,
  );
  // Si cambia el tamaño de la ventana (o se gira el teléfono), todo a su lugar
  window.addEventListener('resize', () => abierto && seguir());

  return {
    abrir,
    cerrar,
    abierto: () => abierto,
    // (para las pruebas y para repintar al cambiar de idioma)
    paso: () => (abierto ? { indice, total: lista.length, clave: lista[indice].clave } : null),
    repintar: () => abierto && mostrar(indice),
  };
}
