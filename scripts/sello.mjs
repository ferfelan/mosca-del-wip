// Los nombres de los íconos y de las vistas previas del sitio llevan la fecha
// en que se hicieron (2026-10-29). WhatsApp, LinkedIn y los demás guardan su
// copia de una imagen por su nombre y no siempre miran el ?v=: el 2026-10-29
// WhatsApp seguía mostrando el logo antiguo con el ?v=5. Un dibujo nuevo
// necesita un nombre nuevo.
// Si cambia el logo o una vista previa: cambiar SELLO, correr iconos.mjs,
// vista-previa.mjs y vistas-previas.mjs, cambiar la fecha a mano en index.html,
// jugar/index.html, creditos/index.html y public/manifest.webmanifest (no se
// generan) y revisar con scripts/probar-iconos.mjs.
export const SELLO = '2026-10-29';

// Lo que enlazan las páginas. /favicon.ico y /apple-touch-icon.png siguen
// existiendo con el mismo dibujo, porque algunos navegadores y apps los piden
// por ese nombre sin leer la página.
export const ICONOS = {
  ico: `/favicon-${SELLO}.ico`,
  svg: `/favicon-${SELLO}.svg`,
  iphone: `/apple-touch-icon-${SELLO}.png`,
  android: `/icono-192-${SELLO}.png`,
  androidGrande: `/icono-512-${SELLO}.png`,
  mascara: `/icono-mascara-${SELLO}.png`,
};

// La vista previa de cada página (1200×630): vistaPrevia() es la de la portada
// en español (también la de la 404); vistaPrevia('en'), la de la portada en
// inglés, y así.
export const VISTAS_PREVIAS = ['portada', 'en', 'juego', 'creditos', 'guia', 'wip-limit', 'informe', 'report', 'taller', 'workshop'];
// Las vistas previas que cambiaron de dibujo después tienen su propia fecha:
// desde la 8.6 (2026-11-06), las dos de la portada (español e inglés) dicen el
// mensaje nuevo ("Termina más empezando menos" / "Finish more by starting
// less") en vez de la pregunta "Ocupado todo el día. ¿Y qué terminaste?".
// Si cambia otra, se agrega aquí con la fecha del cambio.
export const SELLO_VISTA = { portada: '2026-11-06', en: '2026-11-06' };
export function vistaPrevia(pagina = 'portada') {
  if (!VISTAS_PREVIAS.includes(pagina)) throw new Error(`no hay vista previa "${pagina}" (son: ${VISTAS_PREVIAS.join(', ')})`);
  return `/img/vista-previa${pagina === 'portada' ? '' : `-${pagina}`}-${SELLO_VISTA[pagina] ?? SELLO}.jpg`;
}
