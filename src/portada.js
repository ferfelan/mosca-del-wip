// Portada, versión 2 (parte 5.2b, 2026-10-24; portada v2 de la Parte A el
// 2026-10-26: la pregunta como título, "Cómo se juega", el kit, "¿Por qué una
// mosca?" y la FAQ; el cerebro, la consola, el clip, la barra y el idioma
// siguen igual).
// 1. El cerebro del juego en grande: las mismas neuronas reales (MaleCNS) y
//    la misma actividad simulada de src/cerebro.js, que se carga después de
//    dibujar la página. Mientras tanto se ve una foto fija del mismo cerebro.
// 2. La consola: de 1 a 10 tareas a la vez, con los números del informe.
//    Al entrar sube sola de 2 a 10 una vez (hasta 10 desde la portada v4,
//    2026-10-28: el tope del juego); después manda la persona.
// 3. El clip del juego: se baja cuando está por verse, marca si son pocas o
//    muchas tareas y se detiene fuera de la pantalla.
// 4. Idioma (español o inglés) y fondo (negro o blanco), en la barra de
//    arriba. Los dos se recuerdan en este navegador; el script corto del
//    <head> los aplica antes de dibujar. Al llegar, siempre en español y
//    fondo negro.
// 5. El informe en PDF: en iPhone y iPad el botón lo abre en vez de bajarlo.
// 6. La barra de arriba: es la misma de todo el sitio (src/barra.js abre y
//    cierra el menú y cambia el idioma y el fondo). Aquí solo lo propio de la
//    portada: el logo sube hasta arriba sin recargar, la barra toma fondo al
//    bajar, Jugar aparece cuando el grande ya no se ve y la sección que estás
//    leyendo queda marcada.
// Con "reducir movimiento" el cerebro no gira, la consola no sube sola, el
// clip queda con sus controles, los cambios de idioma y fondo no se funden y
// los saltos de la barra son directos.
import { leerIdioma, idiomaDeLaPagina, rutaEnIdioma, formatoNumero } from './idioma.js';
import { DINAMICOS } from './portada-textos.js';
import { iniciarBarra } from './barra.js';

// Tabla de 1 a 10 del informe (pág. 4): corrida oficial, 200 días por cada
// número de tareas, semilla 2024 (docs/corrida-oficial.json). Si la corrida
// cambia, se copian de nuevo, igual que en los informes.
const TERMINADAS = [15.9, 18.0, 16.9, 15.4, 14.0, 12.3, 11.2, 10.0, 9.1, 8.2];
const CIGARROS = [0, 0, 0, 1, 3, 6, 8, 11, 13, 15];
const ESTRES = ['Tranquila', 'Tranquila', 'Tranquila', 'Ocupada', 'Ocupada', 'Estresada', 'Estresada', 'Colapsada', 'Colapsada', 'Colapsada'];
// Neuronas encendidas en la simulación con 1 a 10 tareas
// (public/cerebro/actividad-real.json); se muestran mientras carga el cerebro.
const NEURONAS = [330, 423, 532, 633, 1026, 1114, 1184, 1247, 1328, 1398];

const COLOR_NIVEL = { Tranquila: 'var(--tranquila)', Ocupada: 'var(--ocupada)', Estresada: 'var(--estresada)', Colapsada: 'var(--colapsada)' };
// La carga, como en el juego: verde hasta 3, amarillo con 4 y 5, rojo desde 6
const colorCarga = (n) => (n <= 3 ? 'var(--tranquila)' : n <= 5 ? 'var(--ocupada)' : 'var(--colapsada)');
const quieto = matchMedia('(prefers-reduced-motion: reduce)');
// El idioma lo decide la dirección (Etapa 7, 2026-10-28): / es la portada en
// español y /en/ la portada en inglés, que scripts/generar-ingles.mjs arma a
// partir de index.html y de portada-textos.js. Si una copia de la portada no
// dijera su idioma, vale el recordado. Los números se escriben según el
// idioma: 15,9 y 1.328 en español; 15.9 y 1,328 en inglés (los pone ponerIdioma)
let idioma = idiomaDeLaPagina() ?? leerIdioma();
let decimal;
let miles;
const conDecimal = (x) => decimal.format(x);
const textos = () => DINAMICOS[idioma];
const avisosIdioma = []; // lo que además cambia con el idioma (el clip)

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
  rango.setAttribute('aria-valuetext', textos().tareas(n));
  el.wip.textContent = n;
  el.limite.textContent = textos().limite(n <= 3);
  contar(el.terminadas, TERMINADAS[n - 1], conDecimal);
  contar(el.cigarros, CIGARROS[n - 1], (x) => String(Math.round(x)));
  el.estres.textContent = textos().nivel(nivel);
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
  el.resumen.textContent = textos().resumen(n, conDecimal(TERMINADAS[n - 1]), textos().nivel(ESTRES[n - 1]), CIGARROS[n - 1]);
});

// ---------- Idioma y fondo ----------
// Los textos fijos de la página ya vienen en su idioma desde el HTML (el
// inglés lo arma scripts/generar-ingles.mjs). Aquí solo se ajusta lo que se
// escribe mientras se usa la página: la consola, el clip, los números y los
// enlaces que le pasan el idioma al juego. ES | EN y el fondo son de la barra
// (src/barra.js); al cambiar el fondo, el cerebro se dibuja de nuevo (con
// fondo blanco va en un recuadro).
function ponerIdioma(nuevo) {
  idioma = nuevo;
  for (const enlace of document.querySelectorAll('[data-jugar]')) enlace.href = rutaEnIdioma('/jugar/', idioma);
  decimal = formatoNumero(idioma, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  miles = formatoNumero(idioma);
  ultimaCuenta = -1; // el contador de neuronas se vuelve a escribir con el formato nuevo
  pintar(tareas);
  avisosIdioma.forEach((aviso) => aviso());
}

const barraUI = iniciarBarra({ alCambiarFondo: () => despertar(600) });
ponerIdioma(idioma);

// ---------- El informe en PDF ----------
// En el computador y en Android el botón lo descarga. En iPhone y iPad (todos
// sus navegadores usan el motor de Safari) descargar un PDF falla: Safari
// pregunta "Ver o Descargar" y lo deja escondido en la app Archivos, y en el
// navegador de otras apps (LinkedIn, Instagram, Gmail) a veces no pasa nada.
// Ahí el botón abre el informe, que se lee al tiro y se guarda con "Compartir".
// (El iPad se presenta como Mac: se lo reconoce porque tiene pantalla táctil.)
const enIPhoneOIPad =
  /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
if (enIPhoneOIPad) {
  for (const enlace of document.querySelectorAll('a[download]')) enlace.removeAttribute('download');
}

// ---------- La barra de arriba ----------
// La misma de todo el sitio (src/barra.js: el menú, el idioma y el fondo). En
// la portada además se marca con:
//  - desplazada: ya bajaste un poco (toma el fondo de la página);
//  - con-nombre: el título grande pasó bajo la barra;
//  - con-jugar: los botones de arriba ya no se ven (bajo 1100 px aparece Jugar).
const barra = document.querySelector('[data-barra]');
const enlacesSeccion = [...barra.querySelectorAll('[data-seccion]')];

// El logo siempre lleva al inicio. En la portada sube hasta arriba sin
// recargar (abrirlo en otra pestaña sigue funcionando); si venías de una
// sección, "atrás" te devuelve a ella
barra.querySelector('[data-logo]').addEventListener('click', (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  barraUI.cerrarMenu();
  if (location.hash) history.pushState(history.state, '', location.pathname + location.search);
  scrollTo({ top: 0, behavior: quieto.matches ? 'auto' : 'smooth' });
});

let desplazada;
function marcarDesplazada() {
  const ahora = scrollY > 2;
  if (ahora !== desplazada) barra.classList.toggle('desplazada', (desplazada = ahora));
}
addEventListener('scroll', marcarDesplazada, { passive: true });
marcarDesplazada();

// El nombre aparece en la barra cuando el título grande pasa bajo ella, y
// Jugar cuando el botón Jugar grande no se ve entero: apenas empieza a
// esconderse bajo la barra (2026-10-25: antes se esperaba a que se fuera
// también el del PDF y en el celular quedaba un tramo sin ningún Jugar) o si
// queda cortado abajo o más abajo de la primera pantalla (celular chico o
// girado: ahí la barra lo muestra de entrada).
const vigilar = (elemento, alCambiar, umbrales = 0) =>
  new IntersectionObserver(([e]) => alCambiar(e), { rootMargin: '-64px 0px 0px 0px', threshold: umbrales }).observe(elemento);
vigilar(document.querySelector('.hero h1'), (e) =>
  barra.classList.toggle('con-nombre', !e.isIntersecting && e.boundingClientRect.top < 64)
);
vigilar(
  document.querySelector('.hero .acciones [data-jugar]'),
  (e) => barra.classList.toggle('con-jugar', !e.isIntersecting || e.intersectionRatio < 0.99),
  [0, 0.99]
);

// La sección que estás leyendo queda marcada en el menú: la última cuyo
// contenido ya llegó cerca de la barra (al elegir una en el menú, su
// contenido queda justo ahí). Al final de la página, la última sección. El
// kit no está en el menú (desde 2026-10-28 son la guía, el informe y el
// taller): mientras lo lees no se marca nada, en vez de seguir "El juego".
const secciones = [
  ...enlacesSeccion.map((a) => ({ a, el: document.getElementById(a.dataset.seccion), aire: 0 })),
  { a: null, el: document.getElementById('kit'), aire: 0 },
]
  .filter((s) => s.el)
  .sort((x, y) => (x.el.compareDocumentPosition(y.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
const medirAire = () => secciones.forEach((s) => (s.aire = parseFloat(getComputedStyle(s.el).paddingTop) || 0));
let marcaPendiente = 0;
function marcarSeccion() {
  marcaPendiente = 0;
  const linea = barra.getBoundingClientRect().bottom + Math.max(48, innerHeight * 0.2);
  let actual = null;
  for (const s of secciones) if (s.el.getBoundingClientRect().top + s.aire <= linea) actual = s.a;
  const ultima = secciones.at(-1);
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4 && ultima.el.getBoundingClientRect().top < innerHeight) actual = ultima.a;
  for (const { a } of secciones) {
    if (!a) continue;
    if (a === actual) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
}
const pedirMarca = () => (marcaPendiente ||= requestAnimationFrame(marcarSeccion));
addEventListener('scroll', pedirMarca, { passive: true });
addEventListener('resize', () => {
  medirAire();
  pedirMarca();
});
medirAire();
marcarSeccion();

// ---------- "Para qué sirve un límite": la prueba de la mosca, al llegar (8.8) ----------
// Una sola vez, cuando la sección entra a la pantalla: la mosca del logo se
// asoma al tablero, las fichas terminadas llegan de a una y las barras se
// llenan (los estilos, en src/portada.css). Sin IntersectionObserver o con
// "reducir movimiento" no se toca nada: todo está en su lugar desde el HTML.
const seccionSirve = document.querySelector('.sirve');
if (seccionSirve && 'IntersectionObserver' in window && !quieto.matches) {
  seccionSirve.classList.add('animar');
  const alVer = new IntersectionObserver(
    (entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      seccionSirve.classList.add('visto');
      alVer.disconnect();
    },
    { threshold: 0.3 },
  );
  alVer.observe(seccionSirve.querySelector('.sirve-tablero'));
}

// Al entrar, una sola vez: sube de 2 a 10 tareas (el tope del juego) para
// mostrar qué pasa. Con 10 quedan los números del juego para 10 (8,2
// terminadas, Colapsada, 15 cigarros) y el cerebro de 10 tareas
const TOPE_SUBIDA = 10;
function subidaSola() {
  if (quieto.matches || tocado) return;
  const paso = () => {
    if (tocado || tareas >= TOPE_SUBIDA) return;
    ponerTareas(tareas + 1);
    introPaso = setTimeout(paso, 340);
  };
  introPaso = setTimeout(paso, 1100);
}

// ---------- El cerebro ----------

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    // La prueba se suelta al tiro: los celulares admiten pocos lienzos 3D a la vez
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
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

// Si la persona se va de la portada mientras el cerebro todavía baja (tocó un
// enlace que cambia de página), la descarga se corta ahí mismo: así no quedan
// cargas a medias, que Safari anota como errores en la consola (Etapa 7).
// Los enlaces que no cambian de página (anclas, descargas, otra pestaña, o
// los que el propio JavaScript frena) no cortan nada.
let corte = new AbortController();
document.addEventListener('click', (e) => {
  const enlace = e.target.closest?.('a[href]');
  if (!enlace || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (enlace.target === '_blank' || enlace.hasAttribute('download') || enlace.getAttribute('href').startsWith('#')) return;
  corte.abort();
});
addEventListener('pagehide', () => corte.abort());
// Si vuelve con "atrás" y el navegador trae la página guardada tal cual, la
// carga que se había cortado parte de nuevo
addEventListener('pageshow', (e) => {
  if (!e.persisted || !corte.signal.aborted || cerebro) return;
  corte = new AbortController();
  despues(encenderCerebro, { timeout: 1200 });
});

async function encenderCerebro() {
  const senal = corte.signal;
  if (senal.aborted) return;
  if (!hayWebGL()) {
    subidaSola();
    return;
  }
  try {
    const { cargarDatosCerebro, cargarActividadReal, crearCerebro } = await import('./cerebro.js');
    const datos = await cargarDatosCerebro({ signal: senal });
    const real = await cargarActividadReal(datos, { signal: senal });
    cerebro = crearCerebro(lienzo, datos, real);
  } catch (error) {
    if (senal.aborted) return; // la página se está yendo: no hay nada que mostrar
    console.warn('El cerebro no cargó. Queda la foto fija.', error);
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
// Al girar el celular o cambiar el tamaño de la ventana, el cerebro se dibuja
// de nuevo a su tamaño (con "reducir movimiento" no se dibuja solo)
addEventListener('resize', () => despertar(400));

// Después de dibujar la página: así el texto y los botones salen primero.
// En celulares y tablets (puntero grueso) el cerebro en 3D pesa unos 600 KB y
// armarlo ocupa el procesador justo cuando la página recién aparece (Etapa 7,
// medido con Lighthouse): ahí parte con el primer toque, desplazamiento o
// tecla, o a los 3 segundos si nadie toca nada. Mientras tanto se ve la foto
// del cerebro. En el computador parte apenas la página está dibujada.
const despues = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
const tactil = matchMedia('(pointer: coarse)').matches;
let cerebroPedido = false;
function pedirCerebro() {
  if (cerebroPedido) return;
  cerebroPedido = true;
  despues(encenderCerebro, { timeout: 1200 });
}
function programarCerebro() {
  if (!tactil) {
    pedirCerebro();
    return;
  }
  const senales = ['scroll', 'pointerdown', 'touchstart', 'keydown'];
  let espera = 0;
  const alTocar = () => {
    clearTimeout(espera);
    for (const s of senales) removeEventListener(s, alTocar);
    pedirCerebro();
  };
  for (const s of senales) addEventListener(s, alTocar, { passive: true });
  espera = setTimeout(alTocar, 3000);
}
if (document.readyState === 'complete') programarCerebro();
else addEventListener('load', programarCerebro, { once: true });

// ---------- El clip del juego ----------
const seccionJuego = document.querySelector('.juego');
const video = seccionJuego?.querySelector('video');
if (video) {
  const grande = matchMedia('(min-width: 900px)');
  const d = video.dataset;
  // En inglés va el clip grabado con el juego en inglés (data-src-en...), si está
  const enIngles = () => idioma === 'en' && Boolean(d.srcEn);
  const cambio = () => Number((enIngles() && d.cambioEn) || d.cambio || 6); // segundo en que pasa de 2 a 9 tareas
  const fuente = () => {
    if (enIngles()) return grande.matches && d.srcGrandeEn ? d.srcGrandeEn : d.srcEn;
    return grande.matches && d.srcGrande ? d.srcGrande : d.src;
  };
  // La imagen del clip (data-poster) se pone desde aquí y no en el HTML: así,
  // en inglés no se baja también la de español
  const ponerPoster = () => video.setAttribute('poster', enIngles() && d.posterEn ? d.posterEn : d.poster);
  ponerPoster();
  const cargar = () => {
    if (video.getAttribute('src')) return;
    video.src = fuente();
    if (quieto.matches) video.controls = true;
  };
  // Si el clip grande no está, el de celular sirve igual
  video.addEventListener('error', () => {
    const clave = enIngles() ? 'srcGrandeEn' : 'srcGrande';
    if (d[clave] && video.currentSrc.endsWith(d[clave])) {
      d[clave] = '';
      video.src = fuente();
      if (!quieto.matches) video.play().catch(() => (video.controls = true));
    }
  });
  video.addEventListener('timeupdate', () => {
    seccionJuego.dataset.fase = video.currentTime < cambio() ? 'pocas' : 'muchas';
  });
  // Al cambiar de idioma, el mismo momento del clip en el otro idioma
  avisosIdioma.push(() => {
    ponerPoster();
    if (!video.getAttribute('src') || video.currentSrc.endsWith(fuente())) return;
    const momento = video.currentTime;
    const seguia = !video.paused;
    video.src = fuente();
    video.addEventListener(
      'loadedmetadata',
      () => {
        video.currentTime = momento;
        if (seguia) video.play().catch(() => (video.controls = true));
      },
      { once: true }
    );
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
