// Portada, versión 2 (parte 5.2b, 2026-10-24).
// 1. El cerebro del juego en grande: las mismas neuronas reales (MaleCNS) y
//    la misma actividad simulada de src/cerebro.js, que se carga después de
//    dibujar la página. Mientras tanto se ve una foto fija del mismo cerebro.
// 2. La consola: de 1 a 10 tareas a la vez, con los números del informe.
//    Al entrar sube sola de 2 a 9 una vez; después manda la persona.
// 3. El clip del juego: se baja cuando está por verse, marca si son pocas o
//    muchas tareas y se detiene fuera de la pantalla.
// 4. Idioma (español o inglés) y fondo (negro o blanco), en la barra de
//    arriba. Los dos se recuerdan en este navegador; el script corto del
//    <head> los aplica antes de dibujar. Al llegar, siempre en español y
//    fondo negro.
// 5. El informe en PDF: en iPhone y iPad el botón lo abre en vez de bajarlo.
// 6. La barra de arriba (parte 5.2f): el logo lleva al inicio, el menú de las
//    secciones y la sección que estás leyendo marcada.
// Con "reducir movimiento" el cerebro no gira, la consola no sube sola, el
// clip queda con sus controles, los cambios de idioma y fondo no se funden y
// los saltos de la barra son directos.
import { leerIdioma, marcarIdioma, elegirIdioma, rutaEnIdioma, formatoNumero } from './idioma.js';
import { INGLES, DINAMICOS } from './portada-textos.js';

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
// El idioma y cómo se escriben los números en él: 15,9 y 1.328 en español;
// 15.9 y 1,328 en inglés (los pone ponerIdioma)
let idioma = leerIdioma();
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
// Cambio con un fundido corto, si el navegador lo permite
function conFundido(cambio) {
  if (document.startViewTransition && !quieto.matches) document.startViewTransition(cambio);
  else cambio();
}

// El español queda guardado tal como está en index.html; el inglés viene de
// portada-textos.js
const conTexto = [...document.querySelectorAll('[data-t]')].map((nodo) => ({ nodo, es: nodo.innerHTML }));
const conAria = [...document.querySelectorAll('[data-t-aria]')].map((nodo) => ({ nodo, es: nodo.getAttribute('aria-label') }));
const conTitulo = [...document.querySelectorAll('[data-t-title]')].map((nodo) => ({ nodo, es: nodo.getAttribute('title') }));
const botonesIdioma = document.querySelectorAll('[data-idioma]');
// El informe en PDF en el idioma de la página (2026-10-25, pedido de Felipe):
// en inglés se descarga su traducción, con su tapa
const INFORMES = {
  es: { pdf: '/Mosca-del-WIP-Informe.pdf', nombre: 'Mosca del WIP - Informe.pdf', tapa: '/img/tapa-informe.jpg' },
  en: { pdf: '/Mosca-del-WIP-Report.pdf', nombre: 'Mosca del WIP - Report.pdf', tapa: '/img/tapa-report.jpg' },
};

function ponerIdioma(nuevo, alEntrar = false) {
  idioma = nuevo;
  const en = idioma === 'en';
  if (!(alEntrar && !en)) {
    for (const { nodo, es } of conTexto) nodo.innerHTML = en ? (INGLES[nodo.dataset.t] ?? es) : es;
    for (const { nodo, es } of conAria) nodo.setAttribute('aria-label', en ? (INGLES[nodo.dataset.tAria] ?? es) : es);
    for (const { nodo, es } of conTitulo) nodo.setAttribute('title', en ? (INGLES[nodo.dataset.tTitle] ?? es) : es);
  }
  for (const enlace of document.querySelectorAll('[data-jugar]')) enlace.href = rutaEnIdioma('/jugar/', idioma);
  document.querySelector('[data-logo]').href = rutaEnIdioma('/', idioma);
  // (el nombre con que se guarda, solo si el enlace descarga: en iPhone y iPad
  // lo abre, ver "El informe en PDF")
  const informe = INFORMES[idioma];
  for (const enlace of document.querySelectorAll('[data-informe]')) {
    enlace.href = informe.pdf;
    if (enlace.hasAttribute('download')) enlace.download = informe.nombre;
  }
  document.querySelector('[data-tapa]').src = informe.tapa;
  for (const boton of botonesIdioma) boton.setAttribute('aria-pressed', String(boton.dataset.idioma === idioma));
  decimal = formatoNumero(idioma, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  miles = formatoNumero(idioma);
  ultimaCuenta = -1; // el contador de neuronas se vuelve a escribir con el formato nuevo
  pintar(tareas);
  avisosIdioma.forEach((aviso) => aviso());
  marcarIdioma(idioma);
  document.documentElement.classList.remove('traduciendo');
}

for (const boton of botonesIdioma) {
  boton.addEventListener('click', () => {
    if (boton.dataset.idioma === idioma) return;
    elegirIdioma(boton.dataset.idioma);
    conFundido(() => ponerIdioma(boton.dataset.idioma));
  });
}

const botonesFondo = document.querySelectorAll('[data-fondo]');
function ponerFondo(fondo) {
  const claro = fondo === 'claro';
  if (claro) document.documentElement.dataset.tema = 'claro';
  else delete document.documentElement.dataset.tema;
  document.querySelector('meta[name="theme-color"]').content = claro ? '#ffffff' : '#060a16';
  document.querySelector('meta[name="color-scheme"]').content = claro ? 'light' : 'dark';
  for (const boton of botonesFondo) boton.setAttribute('aria-pressed', String(boton.dataset.fondo === fondo));
  despertar(600); // con fondo blanco el cerebro va en un recuadro: se dibuja de nuevo
}
for (const boton of botonesFondo) {
  boton.addEventListener('click', () => {
    const fondo = boton.dataset.fondo;
    try {
      localStorage.setItem('mosca-fondo', fondo);
    } catch {
      // sin almacenamiento: vale solo para esta visita
    }
    conFundido(() => ponerFondo(fondo));
  });
}

ponerFondo(document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro');
ponerIdioma(idioma, true);

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
// Siempre a la vista. Bajo 1100 px las secciones, el idioma y el fondo van en
// un menú que abre el botón de las tres rayas. La barra se marca con:
//  - desplazada: ya bajaste un poco (toma el fondo de la página);
//  - con-nombre: el título grande pasó bajo la barra (aparece "Mosca del WIP");
//  - con-jugar: los botones de arriba ya no se ven (bajo 1100 px aparece Jugar);
//  - abierta: el menú está abierto.
const barra = document.querySelector('[data-barra]');
const menuBoton = barra.querySelector('.menu-boton');
const enlacesSeccion = [...barra.querySelectorAll('[data-seccion]')];

const menuAbierto = () => barra.classList.contains('abierta');
function abrirMenu(abrir) {
  barra.classList.toggle('abierta', abrir);
  menuBoton.setAttribute('aria-expanded', String(abrir));
}
menuBoton.addEventListener('click', () => abrirMenu(!menuAbierto()));
// Se cierra con Esc (el foco vuelve al botón), al tocar fuera de la barra, al
// elegir una sección y si la ventana se agranda hasta la barra completa
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !menuAbierto()) return;
  abrirMenu(false);
  menuBoton.focus();
});
// (la sombra de atrás es parte de la barra: tocarla también cuenta como fuera)
addEventListener('pointerdown', (e) => {
  if (menuAbierto() && (e.target === barra || !barra.contains(e.target))) abrirMenu(false);
});
for (const enlace of enlacesSeccion) enlace.addEventListener('click', () => abrirMenu(false));
matchMedia('(max-width: 1099px)').addEventListener('change', () => abrirMenu(false));

// El logo siempre lleva al inicio. En la portada sube hasta arriba sin
// recargar (abrirlo en otra pestaña sigue funcionando); si venías de una
// sección, "atrás" te devuelve a ella
barra.querySelector('[data-logo]').addEventListener('click', (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  abrirMenu(false);
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
// contenido queda justo ahí). Al final de la página, la última sección.
const secciones = enlacesSeccion.map((a) => ({ a, el: document.getElementById(a.dataset.seccion), aire: 0 }));
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
// Al girar el celular o cambiar el tamaño de la ventana, el cerebro se dibuja
// de nuevo a su tamaño (con "reducir movimiento" no se dibuja solo)
addEventListener('resize', () => despertar(400));

// Después de dibujar la página: así el texto y los botones salen primero
const despues = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
if (document.readyState === 'complete') despues(encenderCerebro, { timeout: 1200 });
else addEventListener('load', () => despues(encenderCerebro, { timeout: 1200 }), { once: true });

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
