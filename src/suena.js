// El dibujo del inicio: "¿Te suena?" (Etapa 8.13, 2026-11-14). Felipe vio seis
// propuestas del inicio y eligió esta, porque el mensaje de 9 y 2 tareas a la
// vez ya sale más abajo en la página. No tiene ningún número: es el día que
// conoce cualquiera que trabaje en una oficina. A la mosca le van llegando
// pedidos, uno tras otro ("¿Tienes un minuto?", "Es urgente"…), y se le va
// notando en la cara. Es un dibujo de cómo se siente, no un resultado del
// juego.
//
// Se repite solo, sin fin y sin botones. Felipe primero sacó el botón "Ver de
// nuevo" y después el de pausa: "que sea un loop que siempre se repita". Los
// pedidos llegan de a uno, en desorden. Con el tercero a la mosca le sale una
// gota de sudor y cuando ya llegaron tres de cada cuatro queda con los ojos en
// cruz. Se quedan un rato, se van todos, la mosca respira y vuelven a llegar,
// en otro orden. Solo se detiene cuando nadie lo ve (fuera de la pantalla o con
// la pestaña escondida) y sigue donde quedó al volver.
//
// El dibujo se mueve con CSS (src/portada.css): aquí solo se dice qué pedidos
// llegaron y cómo está la mosca. En tarjetas angostas se ven menos pedidos (lo
// decide el CSS), así que en cada vuelta se cuentan los que se ven. Sin
// JavaScript o con "reducir movimiento" se ven todos los pedidos y la mosca al
// final, quietos.
const PARTE = 500; // ms antes del primer pedido de cada vuelta
const CADA = 430; // ms entre un pedido y el siguiente
const QUEDA = 3200; // ms con todos los pedidos a la vista (alcanza para leer la frase de abajo)
const SALE = 28; // ms entre un pedido y otro cuando se van
const RESPIRO = 900; // ms con la mosca tranquila antes de que vuelvan a llegar
const AL_SEGUIR = 320; // ms entre que vuelve a verse y lo próximo que toca
const SE_VE = 0.45; // parte cuando ya se ve casi la mitad (como las cargas de más abajo)

// En qué orden llegan los pedidos de esa vuelta: saltando por la lista (nunca
// de izquierda a derecha) y partiendo de otro lugar cada vez
function ordenDe(cuantos, vuelta) {
  const mcd = (a, b) => (b ? mcd(b, a % b) : a);
  const salto = [5, 3, 7, 11].find((s) => s < cuantos && mcd(s, cuantos) === 1) || 1;
  return Array.from({ length: cuantos }, (_, k) => (vuelta * 4 + k * salto) % cuantos);
}

export function iniciarSuena() {
  const raiz = document.querySelector('.suena');
  if (!raiz) return null;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const todos = [...raiz.querySelectorAll('[data-globo]')];
  const brillos = raiz.querySelector('[data-brillos]');
  let globos = todos; // los pedidos que se ven en este ancho
  let orden = [];
  let llegaron = 0; // cuántos pedidos de esta vuelta ya llegaron
  let vuelta = 0;
  let reloj = 0; // un solo reloj: lo próximo que toca
  let toca = null; // lo que toca cuando corra el reloj (o cuando se siga)
  let aLaVista = false;
  let partio = false;

  const corre = () => raiz.dataset.estado === 'andando' && aLaVista && !document.hidden;

  // Deja anotado lo próximo que toca y, si el dibujo está corriendo, lo hace en ese rato
  function luego(ms, hacer) {
    clearTimeout(reloj);
    reloj = 0;
    toca = hacer;
    if (!corre()) return;
    reloj = setTimeout(() => {
      reloj = 0;
      const ahora = toca;
      toca = null;
      ahora();
    }, ms);
  }
  function detener() {
    clearTimeout(reloj);
    reloj = 0;
  }
  // Sigue donde quedó (al volver a verse o al volver a la pestaña)
  function seguir() {
    if (reloj || !toca || !corre()) return;
    luego(AL_SEGUIR, toca);
  }

  // Cómo está la mosca cuando ya llegaron tantos pedidos
  function animo() {
    const colapsa = Math.ceil(globos.length * 0.75);
    raiz.dataset.animo = llegaron >= colapsa ? 'colapsada' : llegaron >= 3 ? 'apurada' : 'tranquila';
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

  // Una vuelta: llegan de a uno, se quedan un rato, se van y la mosca respira
  function empezarVuelta() {
    globos = todos.filter((g) => getComputedStyle(g).display !== 'none');
    orden = ordenDe(globos.length, vuelta);
    llegaron = 0;
    for (const globo of todos) globo.classList.remove('llego');
    animo();
    mirar(null);
    luego(PARTE, llega);
  }
  function llega() {
    const globo = globos[orden[llegaron]];
    globo.style.removeProperty('--sale');
    globo.classList.add('llego');
    llegaron++;
    animo();
    mirar(raiz.dataset.animo === 'colapsada' ? null : globo);
    if (llegaron < globos.length) luego(CADA, llega);
    else luego(QUEDA, seVan);
  }
  function seVan() {
    orden.forEach((cual, k) => globos[cual].style.setProperty('--sale', `${k * SALE}ms`));
    for (const globo of todos) globo.classList.remove('llego');
    llegaron = 0;
    vuelta++;
    animo();
    mirar(null);
    luego(globos.length * SALE + 220 + RESPIRO, empezarVuelta);
  }

  // Deja a la vista todos los pedidos y la mosca al final, quietos
  function mostrarCerrado() {
    partio = true;
    detener();
    toca = null;
    globos = todos.filter((g) => getComputedStyle(g).display !== 'none');
    for (const globo of todos) {
      globo.style.removeProperty('--sale');
      globo.classList.add('llego');
    }
    llegaron = globos.length;
    animo();
    mirar(null);
    raiz.dataset.estado = 'quieta';
  }

  function partir() {
    partio = true;
    raiz.dataset.estado = 'andando';
    empezarVuelta();
  }

  // Con la pestaña escondida nadie lo ve: se detiene y sigue al volver
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) detener();
    else seguir();
  });

  function encender() {
    raiz.classList.add('viva');
    // Antes de que se vea: ningún pedido y la mosca tranquila
    raiz.dataset.estado = 'por-partir';
    for (const globo of todos) globo.classList.remove('llego');
    llegaron = 0;
    animo();
    mirar(null);
  }
  // (si piden "reducir movimiento" con la página abierta, queda todo a la vista y quieto)
  quieto.addEventListener?.('change', () => {
    if (quieto.matches) {
      mostrarCerrado();
      raiz.classList.remove('viva');
    } else if ('IntersectionObserver' in window) {
      encender();
      if (aLaVista) partir();
      else partio = false;
    }
  });

  if (quieto.matches || !('IntersectionObserver' in window)) {
    mostrarCerrado();
  } else {
    encender();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([e]) => {
        aLaVista = e.isIntersecting;
        if (!aLaVista) {
          detener();
          return;
        }
        if (quieto.matches) return;
        const altoPantalla = e.rootBounds?.height || innerHeight;
        if (!partio && (e.intersectionRatio >= SE_VE || e.intersectionRect.height >= altoPantalla * 0.5)) partir();
        else seguir();
      },
      { rootMargin: '-64px 0px 0px 0px', threshold: [0, 0.2, SE_VE, 0.7, 1] },
    ).observe(raiz);
  }

  // (para las pruebas: mostrarCerrado deja el dibujo quieto, con todos los pedidos)
  return {
    mostrarCerrado,
    estado: () => raiz.dataset.estado,
    animo: () => raiz.dataset.animo,
    vuelta: () => vuelta,
    llegaron: () => llegaron,
    cuantos: () => globos.length,
  };
}
