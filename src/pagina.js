// Lo que comparten las páginas de lectura (Etapa 7, 2026-10-28): la guía, el
// informe en la web, el taller, sus versiones en inglés y la página 404.
// La barra de arriba es la de todo el sitio (src/barra.js: el menú, el idioma
// y el fondo). El idioma de estas páginas lo decide su dirección (/en/...):
// el botón ES | EN es un enlace a la otra versión y al elegirlo se recuerda,
// para que el juego y los créditos abran en ese idioma. Lo común vive en
// src/idioma.js.
import { idiomaDeLaPagina, rutaEnIdioma } from './idioma.js';
import { iniciarBarra } from './barra.js';

const idioma = idiomaDeLaPagina() ?? 'es';

iniciarBarra();

// Los enlaces al juego y al inicio, en el idioma de la página
for (const enlace of document.querySelectorAll('[data-jugar]')) enlace.href = rutaEnIdioma('/jugar/', idioma);
for (const enlace of document.querySelectorAll('[data-inicio]')) enlace.href = rutaEnIdioma('/', idioma);

// En iPhone y iPad descargar un PDF falla (ver src/portada.js): el enlace lo abre
const enIPhoneOIPad =
  /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
if (enIPhoneOIPad) {
  for (const enlace of document.querySelectorAll('a[download]')) enlace.removeAttribute('download');
}
