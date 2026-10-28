// La página "Créditos y licencias" (/creditos/, parte 5.2h, 2026-10-25).
// Una sola dirección para los dos idiomas (como el juego): ES | EN de la barra
// cambia los textos marcados con data-t ahí mismo, sin recargar, recuerda lo
// elegido y manda los enlaces al inicio, al juego y a las páginas en el mismo
// idioma. La barra de arriba es la de todo el sitio (src/barra.js): al
// cambiar de idioma se pone la barra en ese idioma. Lo común con el juego y
// la portada vive en src/idioma.js.
import { leerIdioma, marcarIdioma, rutaEnIdioma } from './idioma.js';
import { INGLES } from './creditos-textos.js';
import { iniciarBarra, ponerBarra } from './barra.js';

let idioma = leerIdioma();

// Cada texto fijo con su español, para volver a él exacto
const conTexto = [...document.querySelectorAll('[data-t]')].map((nodo) => ({ nodo, es: nodo.innerHTML }));
const conAria = [...document.querySelectorAll('[data-t-aria]')].map((nodo) => ({ nodo, es: nodo.getAttribute('aria-label') }));
const conTitulo = [...document.querySelectorAll('[data-t-title]')].map((nodo) => ({ nodo, es: nodo.getAttribute('title') }));
const TITULO_PESTANA = { es: document.title, en: INGLES.tituloPagina };
const idiomaDeLaBarra = () => document.querySelector('[data-barra] [data-idioma][aria-current]')?.dataset.idioma;

function ponerIdioma(nuevo) {
  idioma = nuevo;
  const en = idioma === 'en';
  if (idiomaDeLaBarra() !== idioma) ponerBarra({ idioma, pagina: 'creditos' });
  for (const { nodo, es } of conTexto) nodo.innerHTML = en ? (INGLES[nodo.dataset.t] ?? es) : es;
  for (const { nodo, es } of conAria) nodo.setAttribute('aria-label', en ? (INGLES[nodo.dataset.tAria] ?? es) : es);
  for (const { nodo, es } of conTitulo) nodo.setAttribute('title', en ? (INGLES[nodo.dataset.tTitle] ?? es) : es);
  document.title = TITULO_PESTANA[idioma];
  for (const enlace of document.querySelectorAll('[data-jugar]')) enlace.href = rutaEnIdioma('/jugar/', idioma);
  for (const enlace of document.querySelectorAll('[data-inicio]')) enlace.href = rutaEnIdioma('/', idioma);
  // las páginas con dirección propia en inglés (la guía, el informe, el taller)
  for (const enlace of document.querySelectorAll('[data-ruta]')) enlace.href = rutaEnIdioma(enlace.dataset.ruta, idioma);
  marcarIdioma(idioma);
  document.documentElement.classList.remove('traduciendo');
}

// ES | EN no cambia de página: traduce esta (la barra ya recordó lo elegido)
iniciarBarra({ alElegirIdioma: (nuevo) => ponerIdioma(nuevo) });
ponerIdioma(idioma);
