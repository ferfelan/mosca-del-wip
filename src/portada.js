// Portada, versión 2 (parte 5.2b, 2026-10-24).
// 1. El cerebro del juego en grande: las mismas neuronas reales (MaleCNS) y
//    la misma actividad simulada de src/cerebro.js, que se carga después de
//    dibujar la página. Mientras tanto se ve una foto fija del mismo cerebro.
// 2. La consola: de 1 a 10 tareas a la vez, con los números del informe.
//    Al entrar sube sola de 2 a 9 una vez; después manda la persona.
// 3. El clip del juego: se baja cuando está por verse, marca si son pocas o
//    muchas tareas y se detiene fuera de la pantalla.
// Con "reducir movimiento" el cerebro no gira, la consola no sube sola y el
// clip queda con sus controles.

// Tabla de 1 a 10 del informe (pág. 4): corrida oficial, 200 días por cada
// número de tareas, semilla 2024 (docs/corrida-oficial.json). Si la corrida
// cambia, se copian de nuevo, igual que en los informes.
const TERMINADAS = [15.9, 18.0, 16.9, 15.4, 14.0, 12.3, 11.2, 10.0, 9.1, 8.2];
const CIGARROS = [0, 0, 0, 1, 3, 6, 8, 11, 13, 15];
const ESTRES = ['Tranqui', 'Tranqui', 'Tranqui', 'Ocupada', 'Ocupada', 'Estresada', 'Estresada', 'Colapsada', 'Colapsada', 'Colapsada'];
// Neuronas encendidas en la simulación con 1 a 10 tareas
// (public/cerebro/actividad-real.json); se muestran mientras carga el cerebro.
const NEURONAS = [330, 423, 532, 633, 1026, 1114, 1184, 1247, 1328, 1398];

const COLOR_NIVEL = { Tranqui: 'var(--tranqui)', Ocupada: 'var(--ocupada)', Estresada: 'var(--estresada)', Colapsada: 'var(--colapsada)' };
// La carga, como en el juego: verde hasta 3, amarillo con 4 y 5, rojo desde 6
const colorCarga = (n) => (n <= 3 ? 'var(--tranqui)' : n <= 5 ? 'var(--ocupada)' : 'var(--colapsada)');
const coma = (x) => x.toFixed(1).replace('.', ',');
const miles = new Intl.NumberFormat('es-CL');
const quieto = matchMedia('(prefers-reduced-motion: reduce)');

// ---------- La consola ----------
const consola = document.querySelector('.consola');
const rango = document.getElementById('wip');
const $ = (sel) => consola.querySelector(sel);
const el = {
  wip: $('[data-wip]'),
  limite: $('[data-limite]'),
  terminadas: $('[data-terminadas]'),
  estres: $('[data-estres]'),
  cigarros: $('[data-cigarros]'),
  resumen: $('[data-resumen]'),
};
const cerebroCaja = document.querySelector('.cerebro');
const neuronasEl = document.querySelector('[data-neuronas]');

let tareas = Number(rango.value);
let tocado = false; // la persona ya movió el control: la subida sola se detiene
let introPaso = 0;
// Estado del cerebro (se llena en encenderCerebro)
const lienzo = cerebroCaja.querySelector('.cerebro-lienzo');
let cerebro = null;
let visible = true;
let raf = 0;
let ultimo = 0;
let hastaQuieto = 0; // con "reducir movimiento" solo se dibuja mientras cambia
let ultimaCuenta = -1;
let reanudar = 0;

// Un número que pasa al nuevo valor en un instante (no salta)
function contar(nodo, hasta, formato) {
  const desde = Number(nodo.dataset.valor ?? hasta);
  nodo.dataset.valor = hasta;
  cancelAnimationFrame(Number(nodo.dataset.raf || 0));
  if (quieto.matches || desde === hasta) {
    nodo.textContent = formato(hasta);
    return;
  }
  const inicio = performance.now();
  const paso = (t) => {
    const k = Math.min(1, (t - inicio) / 420);
    const suave = 1 - Math.pow(1 - k, 3);
    nodo.textContent = formato(desde + (hasta - desde) * suave);
    if (k < 1) nodo.dataset.raf = requestAnimationFrame(paso);
  };
  nodo.dataset.raf = requestAnimationFrame(paso);
}

function pintar(n) {
  const nivel = ESTRES[n - 1];
  consola.style.setProperty('--carga', colorCarga(n));
  consola.style.setProperty('--nivel', COLOR_NIVEL[nivel]);
  rango.style.setProperty('--v', n);
  rango.setAttribute('aria-valuetext', `${n} ${n === 1 ? 'tarea' : 'tareas'} a la vez`);
  el.wip.textContent = n;
  el.limite.textContent = n <= 3 ? 'Dentro del límite sostenible (3)' : 'Sobre el límite sostenible (3)';
  contar(el.terminadas, TERMINADAS[n - 1], coma);
  contar(el.cigarros, CIGARROS[n - 1], (x) => String(Math.round(x)));
  el.estres.textContent = nivel;
  if (!cerebro) neuronasEl.textContent = miles.format(NEURONAS[n - 1]);
}

function ponerTareas(n) {
  tareas = n;
  rango.value = String(n);
  pintar(n);
  despertar(1800);
}

rango.addEventListener('input', () => {
  tocado = true;
  clearTimeout(introPaso);
  ponerTareas(Number(rango.value));
});
rango.addEventListener('change', () => {
  const n = tareas;
  el.resumen.textContent = `Con ${n} a la vez: ${coma(TERMINADAS[n - 1])} terminadas en el día, estrés ${ESTRES[n - 1]} al cerrar y ${CIGARROS[n - 1]} cigarros.`;
});
pintar(tareas);

// Al entrar, una sola vez: sube de 2 a 9 tareas para mostrar qué pasa
function subidaSola() {
  if (quieto.matches || tocado) return;
  const paso = () => {
    if (tocado || tareas >= 9) return;
    ponerTareas(tareas + 1);
    introPaso = setTimeout(paso, 340);
  };
  introPaso = setTimeout(paso, 1100);
}

// ---------- El cerebro ----------

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function debeDibujar(t) {
  return visible && !document.hidden && (!quieto.matches || t < hastaQuieto);
}

function despertar(ms = 0) {
  if (quieto.matches) hastaQuieto = Math.max(hastaQuieto, performance.now() + ms);
  if (!raf && cerebro && visible && !document.hidden) raf = requestAnimationFrame(cuadro);
}

function cuadro(t) {
  raf = 0;
  const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
  ultimo = t;
  cerebro.actualizar(dt, { enCurso: tareas, cafe: false, apagado: false });
  cerebro.renderizar();
  if (!cerebroCaja.classList.contains('vivo')) {
    cerebroCaja.classList.add('vivo');
    subidaSola();
  }
  const { activas } = cerebro.lectura();
  if (activas !== ultimaCuenta) {
    neuronasEl.textContent = miles.format(activas);
    ultimaCuenta = activas;
  }
  if (debeDibujar(t)) raf = requestAnimationFrame(cuadro);
  else ultimo = 0;
}

async function encenderCerebro() {
  if (!hayWebGL()) {
    subidaSola();
    return;
  }
  try {
    const { cargarDatosCerebro, cargarActividadReal, crearCerebro } = await import('./cerebro.js');
    const datos = await cargarDatosCerebro();
    const real = await cargarActividadReal(datos);
    cerebro = crearCerebro(lienzo, datos, real);
  } catch (error) {
    console.warn('El cerebro no cargó; queda la foto fija.', error);
    subidaSola();
    return;
  }
  // En la portada la rueda del mouse mueve la página (en el juego hace zoom)
  // y en pantallas táctiles se puede deslizar hacia abajo sobre el cerebro.
  cerebroCaja.addEventListener('wheel', (e) => e.stopPropagation(), { capture: true });
  lienzo.style.touchAction = 'pan-y';
  // Arrastrarlo lo detiene; a los 4 segundos de soltarlo vuelve a girar solo
  lienzo.addEventListener('pointerup', () => {
    clearTimeout(reanudar);
    if (!quieto.matches) reanudar = setTimeout(() => cerebro.girar(), 4000);
  });
  lienzo.addEventListener('pointerdown', () => {
    clearTimeout(reanudar);
    despertar(4000);
  });
  if (quieto.matches) cerebro.detener();
  despertar(1800);
}

new IntersectionObserver(([e]) => {
  visible = e.isIntersecting;
  if (visible) despertar(400);
}).observe(cerebroCaja);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) despertar(400);
});

// Después de dibujar la página: así el texto y los botones salen primero
const despues = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
if (document.readyState === 'complete') despues(encenderCerebro, { timeout: 1200 });
else addEventListener('load', () => despues(encenderCerebro, { timeout: 1200 }), { once: true });

// ---------- El clip del juego ----------
const seccionJuego = document.querySelector('.juego');
const video = seccionJuego?.querySelector('video');
if (video) {
  const grande = matchMedia('(min-width: 900px)');
  const cambio = Number(video.dataset.cambio || 6); // segundo en que pasa de 2 a 9 tareas
  const fuente = () => (grande.matches && video.dataset.srcGrande ? video.dataset.srcGrande : video.dataset.src);
  const cargar = () => {
    if (video.getAttribute('src')) return;
    video.src = fuente();
    if (quieto.matches) video.controls = true;
  };
  // Si el clip grande no está, el de celular sirve igual
  video.addEventListener('error', () => {
    if (video.dataset.srcGrande && video.currentSrc.endsWith(video.dataset.srcGrande)) {
      video.dataset.srcGrande = '';
      video.src = video.dataset.src;
      if (!quieto.matches) video.play().catch(() => (video.controls = true));
    }
  });
  video.addEventListener('timeupdate', () => {
    seccionJuego.dataset.fase = video.currentTime < cambio ? 'pocas' : 'muchas';
  });
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) cargar();
  }, { rootMargin: '400px 0px' }).observe(video);
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) {
      video.pause();
      return;
    }
    cargar();
    if (!quieto.matches) video.play().catch(() => (video.controls = true));
  }, { threshold: 0.35 }).observe(video);
}
