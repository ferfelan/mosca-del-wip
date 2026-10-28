// La barra de arriba: UN SOLO COMPONENTE para todo el sitio (2026-10-28).
// Pedido de Felipe: "el menú de arriba no es el mismo en todas las páginas".
// La usan la portada (/ y /en/), la guía, el informe y el taller (y sus
// versiones en inglés), los créditos y la 404. El juego (/jugar/) tiene la suya.
//
// El menú tiene seis enlaces, en este orden:
//   El juego · El cerebro · Guía · Informe · Taller · FAQ
// El juego, El cerebro y FAQ son secciones de la portada: en la portada son
// anclas (#juego) y desde las otras páginas llevan a la portada del mismo
// idioma (/#juego o /en/#juego). Guía, Informe y Taller son páginas: la que
// estás leyendo queda marcada (aria-current="page"). El logo siempre lleva a
// la portada. Bajo 1100 px el menú, el idioma y el fondo van detrás del botón
// de las tres rayas (en todas las páginas igual).
//
// Este archivo tiene las dos mitades del componente:
//  1. barraHTML({ idioma, pagina }): el HTML de la barra. Lo ponen en cada
//     página los scripts que las arman (scripts/plantilla.mjs para la guía, el
//     informe, el taller y la 404; scripts/poner-barra.mjs para la portada y
//     los créditos; scripts/generar-ingles.mjs para la portada en inglés), así
//     el texto queda escrito en el HTML. Los créditos lo usan también al
//     cambiar de idioma (ponerBarra).
//  2. iniciarBarra(): lo que hace la barra en el navegador: abrir y cerrar el
//     menú, ES | EN y el fondo negro o blanco.
// Los estilos están en src/barra.css (entra con src/portada.css, que todas
// las páginas cargan). Para cambiar la barra se cambia aquí y en barra.css,
// nunca en el HTML ni en el CSS de una página.
import { elegirIdioma } from './idioma.js';

export const PAGINAS_BARRA = ['portada', 'guia', 'informe', 'taller', 'creditos', 'noEncontrada'];

// Los textos de la barra, en español e inglés (en un solo lugar)
export const TEXTOS_BARRA = {
  es: {
    logo: 'Mosca del WIP: ir al inicio',
    menu: 'Menú',
    nav: 'Menú del sitio',
    idioma: 'Idioma',
    fondo: 'Fondo',
    fondoNegro: 'Fondo negro',
    fondoBlanco: 'Fondo blanco',
    jugar: 'Jugar',
    juego: 'El juego',
    cerebro: 'El cerebro',
    guia: 'Guía',
    informe: 'Informe',
    taller: 'Taller',
    faq: 'FAQ',
  },
  en: {
    logo: 'Mosca del WIP: go to the home page',
    menu: 'Menu',
    nav: 'Site menu',
    idioma: 'Language',
    fondo: 'Background',
    fondoNegro: 'Dark background',
    fondoBlanco: 'Light background',
    jugar: 'Play',
    juego: 'The game',
    cerebro: 'The brain',
    guia: 'Guide',
    informe: 'Report',
    taller: 'Workshop',
    faq: 'FAQ',
  },
};

// La dirección de cada página en cada idioma. Los créditos son una sola
// dirección con ?lang= (como el juego); los demás tienen la suya en inglés.
const DIRECCIONES = {
  portada: { es: '/', en: '/en/' },
  guia: { es: '/limite-wip/', en: '/en/wip-limit/' },
  informe: { es: '/informe/', en: '/en/report/' },
  taller: { es: '/taller/', en: '/en/workshop/' },
  creditos: { es: '/creditos/?lang=es', en: '/creditos/?lang=en' },
  noEncontrada: { es: '/', en: '/en/' },
  juego: { es: '/jugar/', en: '/jugar/?lang=en' },
};

// Las secciones de la portada que están en el menú, con su ancla
const SECCIONES = { juego: 'juego', cerebro: 'por-que-una-mosca', faq: 'faq' };

// Los seis enlaces del menú para una página y un idioma
export function enlacesMenu(idioma, pagina) {
  const t = TEXTOS_BARRA[idioma];
  const enPortada = pagina === 'portada';
  const seccion = (clave) => ({
    clave,
    texto: t[clave],
    href: `${enPortada ? '' : DIRECCIONES.portada[idioma]}#${SECCIONES[clave]}`,
    seccion: enPortada ? SECCIONES[clave] : null,
    actual: false,
  });
  const otra = (clave) => ({ clave, texto: t[clave], href: DIRECCIONES[clave][idioma], seccion: null, actual: pagina === clave });
  return [seccion('juego'), seccion('cerebro'), otra('guia'), otra('informe'), otra('taller'), seccion('faq')];
}

const escapar = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// La mosca del logo, dibujada aquí mismo (bajo el vidrio de la barra el iPhone
// pintaba borrosa una imagen). Igual a public/favicon.svg: si cambia el ícono,
// copiar sus grupos aquí.
const MARCA = `<svg class="marca" viewBox="0 0 32 32" width="34" height="34" aria-hidden="true" focusable="false">
  <g fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"><ellipse cx="8.9" cy="20.5" rx="3.3" ry="8.6" transform="rotate(32 8.9 20.5)"/><ellipse cx="23.1" cy="20.5" rx="3.3" ry="8.6" transform="rotate(-32 23.1 20.5)"/><ellipse cx="16" cy="7.8" rx="3.6" ry="3.2"/><circle cx="16" cy="13.4" r="4.4"/><ellipse cx="16" cy="21.9" rx="3.8" ry="6.3"/><ellipse cx="12.3" cy="6.7" rx="3.1" ry="3.8"/><ellipse cx="19.7" cy="6.7" rx="3.1" ry="3.8"/></g>
  <g fill="#e3eef8" stroke="#5a4c40" stroke-width="1.3"><ellipse cx="8.9" cy="20.5" rx="3.3" ry="8.6" transform="rotate(32 8.9 20.5)"/><ellipse cx="23.1" cy="20.5" rx="3.3" ry="8.6" transform="rotate(-32 23.1 20.5)"/></g>
  <g fill="#6f6052"><ellipse cx="16" cy="7.8" rx="3.6" ry="3.2"/><circle cx="16" cy="13.4" r="4.4"/><ellipse cx="16" cy="21.9" rx="3.8" ry="6.3"/></g>
  <g fill="#e8402c"><ellipse cx="12.3" cy="6.7" rx="3.1" ry="3.8"/><ellipse cx="19.7" cy="6.7" rx="3.1" ry="3.8"/></g>
</svg>`;
const RAYAS = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path class="raya raya-1" d="M4 7h16" /><path class="raya raya-2" d="M4 12h16" /><path class="raya raya-3" d="M4 17h16" /></svg>';
const LUNA = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>';
const SOL = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';

const sangrar = (texto, sangria) => texto.split('\n').map((l, i) => (i && l ? sangria + l : l)).join('\n');

// El HTML de la barra. En la portada parte sin fondo (lo toma al bajar, lo
// marca src/portada.js) y Jugar aparece cuando el Jugar grande ya no se ve;
// en las demás páginas no hay título grande: la barra va siempre con fondo y
// con Jugar.
export function barraHTML({ idioma = 'es', pagina = 'portada' } = {}) {
  const t = TEXTOS_BARRA[idioma];
  if (!t) throw new Error(`barraHTML: idioma desconocido «${idioma}»`);
  if (!PAGINAS_BARRA.includes(pagina)) throw new Error(`barraHTML: página desconocida «${pagina}»`);
  const clases = pagina === 'portada' ? 'barra' : 'barra desplazada con-jugar';
  const enlaces = enlacesMenu(idioma, pagina)
    .map(
      (e) =>
        `<li><a href="${e.href}"${e.seccion ? ` data-seccion="${e.seccion}"` : ''}${e.actual ? ' aria-current="page"' : ''}>${e.texto}</a></li>`
    )
    .join('\n');
  const idiomaEnlace = (cual, sigla, nombre, etiqueta) =>
    `<a href="${DIRECCIONES[pagina][cual]}" data-idioma="${cual}"${cual === idioma ? ' aria-current="page"' : ''} lang="${cual}" hreflang="${cual}" aria-label="${etiqueta}" title="${nombre}">${sigla}</a>`;
  return `<header class="${clases}" data-barra="${pagina}">
  <div class="barra-dentro">
    <a class="logo" href="${DIRECCIONES.portada[idioma]}" data-logo data-inicio aria-label="${escapar(t.logo)}">
      ${sangrar(MARCA, '      ')}
      <span class="logo-nombre">Mosca del WIP</span>
    </a>
    <button class="menu-boton" type="button" aria-expanded="false" aria-controls="menu" aria-label="${escapar(t.menu)}">
      ${RAYAS}
    </button>
    <div class="menu" id="menu">
      <nav class="secciones" aria-label="${escapar(t.nav)}">
        <ul class="menu-enlaces">
          ${sangrar(enlaces, '          ')}
        </ul>
      </nav>
      <div class="ajustes">
        <div class="ajuste">
          <span class="ajuste-nombre">${t.idioma}</span>
          <div class="selector" role="group" aria-label="${escapar(t.idioma)}">
            ${idiomaEnlace('es', 'ES', 'Español', 'ES: español')}
            ${idiomaEnlace('en', 'EN', 'English', 'EN: English')}
          </div>
        </div>
        <div class="ajuste">
          <span class="ajuste-nombre">${t.fondo}</span>
          <div class="selector" role="group" aria-label="${escapar(t.fondo)}">
            <button type="button" data-fondo="oscuro" aria-pressed="true" aria-label="${escapar(t.fondoNegro)}" title="${escapar(t.fondoNegro)}">
              ${LUNA}
            </button>
            <button type="button" data-fondo="claro" aria-pressed="false" aria-label="${escapar(t.fondoBlanco)}" title="${escapar(t.fondoBlanco)}">
              ${SOL}
            </button>
          </div>
        </div>
      </div>
    </div>
    <a class="boton principal barra-jugar" href="${DIRECCIONES.juego[idioma]}" data-jugar>${t.jugar}</a>
  </div>
</header>`;
}

// La barra con una sangría inicial (para ponerla dentro de un HTML ya sangrado)
export const barraConSangria = (opciones, sangria = '    ') => sangria + sangrar(barraHTML(opciones), sangria);

// ---------- En el navegador ----------
const laBarra = () => document.querySelector('[data-barra]');
const clicSimple = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

// Los botones del fondo marcan el fondo de ahora
function marcarFondo() {
  const claro = document.documentElement.dataset.tema === 'claro';
  for (const boton of document.querySelectorAll('[data-barra] [data-fondo]')) {
    boton.setAttribute('aria-pressed', String((boton.dataset.fondo === 'claro') === claro));
  }
}

// Cambia la barra por la de otro idioma (los créditos, que cambian de idioma
// sin recargar). Lo que hace la barra sigue andando: escucha desde document.
export function ponerBarra(opciones) {
  const vieja = laBarra();
  if (!vieja) return;
  // si el foco estaba en la barra (se eligió el idioma con el teclado), vuelve
  // al mismo botón en la barra nueva; si quedó escondido en el menú cerrado,
  // al botón del menú
  const enfocado = vieja.contains(document.activeElement) ? document.activeElement : null;
  const molde = document.createElement('template');
  molde.innerHTML = barraHTML(opciones).trim();
  const nueva = molde.content.firstElementChild;
  vieja.replaceWith(nueva);
  marcarFondo();
  if (enfocado) {
    const cual = enfocado.dataset.idioma
      ? `[data-idioma="${enfocado.dataset.idioma}"]`
      : enfocado.dataset.fondo
        ? `[data-fondo="${enfocado.dataset.fondo}"]`
        : '.menu-boton';
    const destino = nueva.querySelector(cual);
    (destino?.getClientRects().length ? destino : nueva.querySelector('.menu-boton'))?.focus();
  }
}

// Lo que hace la barra. Opciones:
//  - alCambiarFondo(fondo): algo más que hacer al cambiar el fondo (la portada
//    vuelve a dibujar el cerebro);
//  - alElegirIdioma(idioma): si está, ES | EN no cambia de página y llama a
//    esta función (los créditos traducen la página ahí mismo).
// Devuelve abrirMenu y cerrarMenu (la portada cierra el menú al tocar el logo).
export function iniciarBarra({ alCambiarFondo, alElegirIdioma } = {}) {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const abierta = () => laBarra()?.classList.contains('abierta') ?? false;
  function abrirMenu(abrir) {
    const barra = laBarra();
    if (!barra) return;
    barra.classList.toggle('abierta', abrir);
    barra.querySelector('.menu-boton')?.setAttribute('aria-expanded', String(abrir));
  }

  function ponerFondo(fondo) {
    const claro = fondo === 'claro';
    if (claro) document.documentElement.dataset.tema = 'claro';
    else delete document.documentElement.dataset.tema;
    const color = document.querySelector('meta[name="theme-color"]');
    const esquema = document.querySelector('meta[name="color-scheme"]');
    if (color) color.content = claro ? '#ffffff' : '#060a16';
    if (esquema) esquema.content = claro ? 'light' : 'dark';
    marcarFondo();
    alCambiarFondo?.(fondo);
  }
  function elegirFondo(fondo) {
    try {
      localStorage.setItem('mosca-fondo', fondo);
    } catch {
      // sin almacenamiento: vale solo para esta visita
    }
    // con un fundido corto, si el navegador lo permite
    if (document.startViewTransition && !quieto.matches) document.startViewTransition(() => ponerFondo(fondo));
    else ponerFondo(fondo);
  }

  document.addEventListener('click', (e) => {
    const barra = laBarra();
    if (!barra || !(e.target instanceof Element) || !barra.contains(e.target)) return;
    if (e.target.closest('.menu-boton')) {
      abrirMenu(!abierta());
      return;
    }
    const enlaceIdioma = e.target.closest('a[data-idioma]');
    if (enlaceIdioma) {
      const nuevo = enlaceIdioma.dataset.idioma;
      if (enlaceIdioma.hasAttribute('aria-current')) {
        // ya estás en este idioma: no recarga la página
        if (clicSimple(e)) e.preventDefault();
        return;
      }
      // se recuerda, para que el juego y los créditos abran en ese idioma
      elegirIdioma(nuevo);
      if (alElegirIdioma && clicSimple(e)) {
        e.preventDefault();
        abrirMenu(false);
        alElegirIdioma(nuevo);
      }
      return;
    }
    const botonFondo = e.target.closest('[data-fondo]');
    if (botonFondo) {
      elegirFondo(botonFondo.dataset.fondo);
      return;
    }
    // elegir una sección o una página cierra el menú
    if (e.target.closest('.menu a')) abrirMenu(false);
  });
  // Esc cierra el menú y el foco vuelve al botón
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !abierta()) return;
    abrirMenu(false);
    laBarra()?.querySelector('.menu-boton')?.focus();
  });
  // Tocar fuera de la barra lo cierra (la sombra de atrás es parte de la
  // barra: tocarla también cuenta como fuera)
  addEventListener('pointerdown', (e) => {
    const barra = laBarra();
    if (barra && abierta() && (e.target === barra || !barra.contains(e.target))) abrirMenu(false);
  });
  // Si la ventana se agranda hasta la barra completa, el menú se cierra
  matchMedia('(max-width: 1099px)').addEventListener('change', () => abrirMenu(false));

  marcarFondo();
  return { abrirMenu, cerrarMenu: () => abrirMenu(false), ponerFondo };
}
