// Idioma de la portada y del juego: español o inglés (2026-10-24).
// Al llegar, siempre en español (decisión de Felipe). Se cambia con el botón
// ES | EN, la elección se recuerda en este navegador y la dirección la muestra
// (?lang=en), así un enlace copiado abre en el mismo idioma.
// Cada página trae sus propios textos en inglés; este archivo solo decide y
// recuerda el idioma. El script corto del <head> de cada página hace lo mismo
// antes de dibujar, para que no se vea un instante en el otro idioma.
const CLAVE = 'mosca-idioma';
export const IDIOMAS = ['es', 'en'];

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
  marcarIdioma(idioma);
}

// Dirección de otra página del sitio en el mismo idioma (ej. el botón Jugar)
export function rutaEnIdioma(ruta, idioma) {
  return idioma === 'es' ? ruta : `${ruta}?lang=${idioma}`;
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
