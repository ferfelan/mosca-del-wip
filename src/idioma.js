// Idioma de la portada, las páginas y el juego: español o inglés (2026-10-24).
// Desde la Etapa 7 (2026-10-28) la portada, la guía, el informe y el taller
// tienen su dirección propia en inglés (/en/, /en/wip-limit/, /en/report/,
// /en/workshop/): ahí el idioma lo decide la dirección, y el botón ES | EN
// lleva de una a la otra. El juego (/jugar/) y los créditos (/creditos/)
// siguen en una sola dirección con ?lang=en, y recuerdan lo elegido.
// Al llegar a / siempre es español (decisión de Felipe).
// Cada página trae sus propios textos en inglés; este archivo solo decide y
// recuerda el idioma.
const CLAVE = 'mosca-idioma';
export const IDIOMAS = ['es', 'en'];

// Las páginas que existen en los dos idiomas, con su dirección en cada uno
export const RUTAS_EN = {
  '/': '/en/',
  '/limite-wip/': '/en/wip-limit/',
  '/informe/': '/en/report/',
  '/taller/': '/en/workshop/',
};
const RUTAS_ES = Object.fromEntries(Object.entries(RUTAS_EN).map(([es, en]) => [en, es]));

export function leerIdioma() {
  const pedido = new URLSearchParams(location.search).get('lang');
  if (IDIOMAS.includes(pedido)) {
    recordar(pedido);
    return pedido;
  }
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (IDIOMAS.includes(guardado)) return guardado;
  } catch {
    // sin acceso al almacenamiento: queda en español
  }
  return 'es';
}

// En las páginas con dirección propia por idioma, el <html> trae
// data-idioma-pagina y el idioma no se cambia con JavaScript
export function idiomaDeLaPagina() {
  const fijo = document.documentElement.dataset.idiomaPagina;
  return IDIOMAS.includes(fijo) ? fijo : null;
}

// Deja la página marcada con el idioma: <html lang> y ?lang=en en la dirección
export function marcarIdioma(idioma) {
  document.documentElement.lang = idioma;
  const url = new URL(location.href);
  if (idioma === 'es') url.searchParams.delete('lang');
  else url.searchParams.set('lang', idioma);
  if (url.href !== location.href) history.replaceState(history.state, '', url);
}

// La persona eligió un idioma con el botón
export function elegirIdioma(idioma) {
  recordar(idioma);
  if (!idiomaDeLaPagina()) marcarIdioma(idioma);
}

// Dirección de otra página del sitio en el mismo idioma (ej. el botón Jugar):
// las que tienen dirección propia en inglés van a ella; las demás, con ?lang=en
export function rutaEnIdioma(ruta, idioma) {
  if (idioma === 'en') return RUTAS_EN[ruta] ?? `${ruta}?lang=en`;
  return RUTAS_ES[ruta] ?? ruta;
}

// Números como se escriben en cada idioma: 15,9 y 1.328 en español;
// 15.9 y 1,328 en inglés
export function formatoNumero(idioma, opciones) {
  return new Intl.NumberFormat(idioma === 'en' ? 'en-US' : 'es-CL', opciones);
}

function recordar(idioma) {
  try {
    localStorage.setItem(CLAVE, idioma);
  } catch {
    // sin almacenamiento: vale solo para esta visita
  }
}
