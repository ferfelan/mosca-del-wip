// Lo que comparten las páginas de lectura (Etapa 7, 2026-10-28): la guía, el
// informe en la web, el taller, sus versiones en inglés y la página 404.
// Hace lo mismo que la portada con el fondo (negro o blanco) y marca el
// idioma; el idioma de estas páginas lo decide su dirección (/en/...), así
// que el botón ES | EN es un enlace a la otra versión y aquí solo se recuerda
// lo elegido para el juego y los créditos. Lo común vive en src/idioma.js.
import { idiomaDeLaPagina, elegirIdioma, rutaEnIdioma } from './idioma.js';

const idioma = idiomaDeLaPagina() ?? 'es';

// Los enlaces al juego y al inicio, en el idioma de la página
for (const enlace of document.querySelectorAll('[data-jugar]')) enlace.href = rutaEnIdioma('/jugar/', idioma);
for (const enlace of document.querySelectorAll('[data-inicio]')) enlace.href = rutaEnIdioma('/', idioma);

// El botón ES | EN: al elegir, se recuerda (para el juego) y se sigue el enlace
for (const enlace of document.querySelectorAll('a[data-idioma]')) {
  enlace.addEventListener('click', () => elegirIdioma(enlace.dataset.idioma));
}

// El fondo: negro (de noche, como el juego) o blanco. Igual que en la portada.
const botonesFondo = document.querySelectorAll('[data-fondo]');
function ponerFondo(fondo) {
  const claro = fondo === 'claro';
  if (claro) document.documentElement.dataset.tema = 'claro';
  else delete document.documentElement.dataset.tema;
  const color = document.querySelector('meta[name="theme-color"]');
  const esquema = document.querySelector('meta[name="color-scheme"]');
  if (color) color.content = claro ? '#ffffff' : '#060a16';
  if (esquema) esquema.content = claro ? 'light' : 'dark';
  for (const boton of botonesFondo) boton.setAttribute('aria-pressed', String(boton.dataset.fondo === fondo));
}
for (const boton of botonesFondo) {
  boton.addEventListener('click', () => {
    try {
      localStorage.setItem('mosca-fondo', boton.dataset.fondo);
    } catch {
      // sin almacenamiento: vale solo para esta visita
    }
    ponerFondo(boton.dataset.fondo);
  });
}
ponerFondo(document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro');

// En iPhone y iPad descargar un PDF falla (ver src/portada.js): el enlace lo abre
const enIPhoneOIPad =
  /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
if (enIPhoneOIPad) {
  for (const enlace of document.querySelectorAll('a[download]')) enlace.removeAttribute('download');
}
