// La página "Créditos y licencias" (/creditos/, parte 5.2h, 2026-10-25).
// Hace lo mismo que la portada con el idioma y el fondo (src/portada.js), sin
// la consola, el cerebro ni el menú: cambia los textos marcados con data-t,
// recuerda lo elegido y manda los enlaces al inicio y al juego en el mismo
// idioma. Lo común con el juego y la portada vive en src/idioma.js.
import { leerIdioma, marcarIdioma, elegirIdioma, rutaEnIdioma } from './idioma.js';
import { INGLES } from './creditos-textos.js';

let idioma = leerIdioma();

// Cada texto fijo con su español, para volver a él exacto
const conTexto = [...document.querySelectorAll('[data-t]')].map((nodo) => ({ nodo, es: nodo.innerHTML }));
const conAria = [...document.querySelectorAll('[data-t-aria]')].map((nodo) => ({ nodo, es: nodo.getAttribute('aria-label') }));
const conTitulo = [...document.querySelectorAll('[data-t-title]')].map((nodo) => ({ nodo, es: nodo.getAttribute('title') }));
const TITULO_PESTANA = { es: document.title, en: INGLES.tituloPagina };
const botonesIdioma = document.querySelectorAll('[data-idioma]');
const botonesFondo = document.querySelectorAll('[data-fondo]');

function ponerIdioma(nuevo) {
  idioma = nuevo;
  const en = idioma === 'en';
  for (const { nodo, es } of conTexto) nodo.innerHTML = en ? (INGLES[nodo.dataset.t] ?? es) : es;
  for (const { nodo, es } of conAria) nodo.setAttribute('aria-label', en ? (INGLES[nodo.dataset.tAria] ?? es) : es);
  for (const { nodo, es } of conTitulo) nodo.setAttribute('title', en ? (INGLES[nodo.dataset.tTitle] ?? es) : es);
  document.title = TITULO_PESTANA[idioma];
  for (const enlace of document.querySelectorAll('[data-jugar]')) enlace.href = rutaEnIdioma('/jugar/', idioma);
  for (const enlace of document.querySelectorAll('[data-inicio]')) enlace.href = rutaEnIdioma('/', idioma);
  for (const boton of botonesIdioma) boton.setAttribute('aria-pressed', String(boton.dataset.idioma === idioma));
  marcarIdioma(idioma);
  document.documentElement.classList.remove('traduciendo');
}

for (const boton of botonesIdioma) {
  boton.addEventListener('click', () => {
    if (boton.dataset.idioma === idioma) return;
    elegirIdioma(boton.dataset.idioma);
    ponerIdioma(boton.dataset.idioma);
  });
}

// El fondo: negro (de noche, como el juego) o blanco. Igual que en la portada.
function ponerFondo(fondo) {
  const claro = fondo === 'claro';
  if (claro) document.documentElement.dataset.tema = 'claro';
  else delete document.documentElement.dataset.tema;
  document.querySelector('meta[name="theme-color"]').content = claro ? '#ffffff' : '#060a16';
  document.querySelector('meta[name="color-scheme"]').content = claro ? 'light' : 'dark';
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
ponerIdioma(idioma);
