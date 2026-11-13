// Las cargas: cada dibujo se llena la primera vez que se ve (8.11, 2026-11-12).
// Desde la 8.12 (2026-11-13) vive aquí, en su propio archivo, porque la usan
// la portada (src/portada.js) y las páginas de lectura (src/pagina.js: el
// resumen ejecutivo de /informe/ trae los mismos tableros).
// Pedido de Felipe (2026-11-12): "que la primera vez que los veas como que se
// carguen esas barritas" y "como que se vaya cargando". Todo lo que lleva
// data-carga en la página parte vacío y se llena una sola vez por visita,
// cuando su dibujo ya se ve en la pantalla: las fichas, las barras, las caras,
// los cuatro dibujos del equipo, las dos columnas de "Hecho", los tres pasos,
// los dos cerebros y sus colores. Los estilos están en src/portada.css ("Las
// cargas"); aquí se decide cuándo parte cada uno y se cuentan los números
// (data-cuenta) al paso de su dibujo:
//  - data-paso: milisegundos por unidad (el mismo paso que en los estilos);
//  - data-cuenta="der": va en medio de una frase o a la derecha: crece hacia
//    la izquierda y frena al llegar, como su barra; los demás suben de a uno,
//    con cada ficha;
//  - data-espera: milisegundos que aguarda antes de partir.
// El número de verdad nunca se borra de la página: mientras cuenta, encima se
// dibuja el del momento (el atributo data-ahora). Sin IntersectionObserver o
// con "reducir movimiento" no se toca nada: todo está completo desde el HTML.
export function iniciarCargas() {
  const cargas = [...document.querySelectorAll('[data-carga]')];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  // (tampoco con los colores forzados de Windows: ahí el número de verdad no se
  // puede esconder mientras cuenta el otro)
  if (!cargas.length || !('IntersectionObserver' in window) || quieto.matches || matchMedia('(forced-colors: active)').matches) return;
  const ESCALON = 170; // ms entre dos dibujos que entran juntos a la pantalla (van de izquierda a derecha)
  // Parte cuando ya se ve casi la mitad del dibujo. Lo que no es un dibujo sino
  // un paso con su foto (data-carga="pronto") parte antes, apenas asoma
  const SE_VE = 0.45;
  const PRONTO = 0.2;
  // El número del momento se escribe como el de verdad: 1.328 en español y 1,328 en inglés
  const escribir = (final, n) => {
    const separador = final.match(/\d([.,\s])\d{3}/)?.[1];
    return separador ? String(n).replace(/\B(?=(\d{3})+$)/g, separador) : String(n);
  };
  const dibujoDe = new Map(); // de cada cosa que se carga, lo que se vigila: su dibujo
  const duenoDe = new Map();
  const cuentasDe = new Map();
  const avisos = new Map(); // el dibujo se ve a medias y la persona se quedó ahí: se carga igual
  const umbralDe = (el) => (el.dataset.carga === 'pronto' ? PRONTO : SE_VE);
  for (const el of cargas) {
    const dibujo = el.querySelector('.prueba, .dibujo') ?? el;
    dibujoDe.set(el, dibujo);
    duenoDe.set(dibujo, el);
    cuentasDe.set(
      el,
      [...el.querySelectorAll('[data-cuenta]')].map((nodo) => {
        const final = nodo.textContent;
        const hasta = Number(final.replace(/\D/g, ''));
        const paso = Number(nodo.dataset.paso) || 60;
        const suave = nodo.dataset.cuenta === 'der';
        nodo.dataset.ahora = '0';
        return { nodo, final, hasta, paso, suave, espera: Number(nodo.dataset.espera) || 0, dura: suave ? hasta * paso : (hasta - 1) * paso, lista: false };
      }),
    );
  }
  document.documentElement.classList.add('con-carga');

  const cargar = (el, espera) => {
    if (el.classList.contains('cargado')) return;
    clearTimeout(avisos.get(el));
    vigia.unobserve(dibujoDe.get(el));
    el.style.setProperty('--espera', `${espera}ms`);
    el.classList.add('cargado');
    el.closest('section')?.classList.add('visto'); // la mosca del logo se asoma con el primero
    const cuentas = cuentasDe.get(el);
    if (!cuentas.length) return;
    const terminar = () => {
      for (const c of cuentas) {
        c.lista = true;
        c.nodo.removeAttribute('data-ahora');
      }
    };
    const inicio = performance.now() + espera;
    const cuadro = (t) => {
      let falta = false;
      for (const c of cuentas) {
        if (c.lista) continue;
        const x = t - inicio - c.espera;
        if (x >= c.dura) {
          c.lista = true;
          c.nodo.removeAttribute('data-ahora'); // queda el número de verdad
          continue;
        }
        falta = true;
        if (x < 0) continue;
        const n = c.suave ? Math.round(c.hasta * (1 - (1 - x / c.dura) ** 3)) : Math.floor(x / c.paso) + 1;
        const texto = escribir(c.final, Math.min(c.hasta, n));
        if (c.nodo.dataset.ahora !== texto) c.nodo.dataset.ahora = texto;
      }
      if (falta) requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
    // Por si el navegador deja de dibujar a mitad de camino (la pestaña quedó
    // atrás): el número de verdad vuelve igual
    setTimeout(terminar, espera + Math.max(...cuentas.map((c) => c.espera + c.dura)) + 1500);
  };

  const vigia = new IntersectionObserver(
    (entradas) => {
      let juntos = 0;
      for (const e of entradas) {
        const el = duenoDe.get(e.target);
        if (!el || el.classList.contains('cargado')) continue;
        clearTimeout(avisos.get(el));
        if (!e.isIntersecting) continue;
        const altoPantalla = e.rootBounds?.height || innerHeight;
        if (e.intersectionRatio >= umbralDe(el) || e.intersectionRect.height >= altoPantalla * 0.5) cargar(el, juntos++ * ESCALON);
        // (con una orilla a la vista no se carga: la persona se lo perdería)
        else if (e.intersectionRatio >= PRONTO) avisos.set(el, setTimeout(() => cargar(el, 0), 1600));
      }
    },
    // (la barra de arriba tapa 64 px: lo que queda debajo de ella no cuenta)
    { rootMargin: '-64px 0px 0px 0px', threshold: [0, PRONTO, 0.3, SE_VE, 0.6, 0.8, 1] },
  );
  for (const dibujo of duenoDe.keys()) vigia.observe(dibujo);
}
