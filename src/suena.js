// OPCIÓN 6 del inicio (Etapa 8.13, EN PRUEBA, 2026-11-14). "¿Te suena?".
// Felipe pidió tres propuestas con otro mensaje, porque el de 9 y 2 a la vez
// ya sale tres veces en la página. Esta no tiene ningún número: es el día que
// conoce cualquiera que trabaje en una oficina. A la mosca le llegan ocho
// pedidos, uno tras otro ("¿Tienes un minuto?", "Es urgente"…), y se le va
// notando en la cara. Es un dibujo de cómo se siente, no un resultado del
// juego.
//
// La primera vez que se ve, una sola vez: los pedidos llegan de a uno, en
// desorden, en menos de 5 segundos. Con el tercero le sale una gota de sudor y
// con el último queda con los ojos en cruz. Después queda quieto y el botón
// "Ver de nuevo" lo repite. El dibujo se mueve con CSS (src/opciones-b.css):
// aquí solo se dice qué pedidos llegaron y cómo está la mosca. Sin JavaScript
// o con "reducir movimiento" se ven los ocho pedidos y la mosca al final.
const ORDEN = [2, 5, 0, 7, 3, 1, 6, 4]; // en qué orden llegan (no de izquierda a derecha)
const PARTE = 420; // ms hasta el primer pedido
const CADA = 480; // ms entre un pedido y el siguiente (los 8 pedidos caben en menos de 5 segundos)
const SE_VE = 0.45;

export function iniciarSuena() {
  const raiz = document.querySelector('.suena');
  if (!raiz) return null;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const globos = [...raiz.querySelectorAll('[data-globo]')];
  const brillos = raiz.querySelector('[data-brillos]');
  const boton = raiz.querySelector('[data-denuevo]');
  let partio = false;
  let esperas = [];

  const despues = (ms, hacer) => esperas.push(setTimeout(hacer, ms));
  function cortar() {
    for (const espera of esperas) clearTimeout(espera);
    esperas = [];
  }

  // Cómo está la mosca cuando ya llegaron tantos pedidos
  function animo(llegaron) {
    raiz.dataset.animo = llegaron >= globos.length ? 'colapsada' : llegaron >= 3 ? 'apurada' : 'tranquila';
  }

  // La mosca mira hacia el pedido que acaba de llegar
  function mirar(globo) {
    if (!globo) {
      brillos.style.transform = '';
      return;
    }
    const caja = raiz.getBoundingClientRect();
    const g = globo.getBoundingClientRect();
    const lado = (g.left + g.width / 2 - (caja.left + caja.width / 2)) / (caja.width / 2);
    brillos.style.transform = `translate(${(lado * 3.2).toFixed(1)}px, -1.6px)`;
  }

  function mostrarCerrado() {
    partio = true;
    cortar();
    for (const globo of globos) globo.classList.add('llego');
    mirar(null);
    animo(globos.length);
    raiz.dataset.estado = 'quieta';
  }

  function jugar() {
    cortar();
    for (const globo of globos) globo.classList.remove('llego');
    mirar(null);
    animo(0);
    raiz.dataset.estado = 'andando';
    ORDEN.forEach((cual, k) => {
      despues(PARTE + k * CADA, () => {
        globos[cual].classList.add('llego');
        animo(k + 1);
        if (k + 1 < globos.length) mirar(globos[cual]);
        else mirar(null);
      });
    });
    despues(PARTE + ORDEN.length * CADA + 300, () => (raiz.dataset.estado = 'quieta'));
  }

  boton.addEventListener('click', () => {
    partio = true;
    if (quieto.matches) mostrarCerrado();
    else jugar();
  });
  // (si piden "reducir movimiento" mientras llegan los pedidos, quedan todos de una vez)
  quieto.addEventListener?.('change', () => {
    if (quieto.matches && raiz.dataset.estado !== 'quieta') mostrarCerrado();
  });

  if (quieto.matches || !('IntersectionObserver' in window)) {
    // (sin movimiento no hay nada que volver a ver: el botón no aparece)
    mostrarCerrado();
  } else {
    raiz.classList.add('viva');
    // Antes de que se vea: ningún pedido y la mosca tranquila
    raiz.dataset.estado = 'por-partir';
    animo(0);
    new IntersectionObserver(
      ([e], observador) => {
        const altoPantalla = e.rootBounds?.height || innerHeight;
        if (!partio && e.isIntersecting && (e.intersectionRatio >= SE_VE || e.intersectionRect.height >= altoPantalla * 0.5)) {
          partio = true;
          observador.disconnect();
          jugar();
        }
      },
      { rootMargin: '-64px 0px 0px 0px', threshold: [0, 0.2, SE_VE, 0.7, 1] },
    ).observe(raiz);
  }

  // (para las pruebas)
  return { mostrarCerrado, estado: () => raiz.dataset.estado, animo: () => raiz.dataset.animo };
}
