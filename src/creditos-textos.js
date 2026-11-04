// Textos en inglés de la página "Créditos y licencias" (/creditos/, parte
// 5.2h, 2026-10-25). El español está en creditos/index.html: cada clave es el
// data-t (contenido) o el data-t-aria de un elemento. Lo que comparte con la
// portada (el pie) se toma de src/portada-textos.js, para que cambie en un
// solo lugar; la barra de arriba tiene los suyos en src/barra.js.
import { INGLES as PORTADA } from './portada-textos.js';

export const INGLES = {
  // El pie y el Jugar de abajo, iguales a la portada (la barra de arriba
  // tiene sus textos en src/barra.js)
  saltar: PORTADA.saltar,
  jugar: PORTADA.jugar,
  hechoPor: PORTADA.hechoPor,
  sinCookies: PORTADA.sinCookies,
  derechos: '© 2026 Felipe Fernández. All rights reserved. The brain data come from Male CNS v1.0, licensed CC BY 4.0.',
  pieMapa: PORTADA.pieMapa,
  pieJuego: PORTADA.pieJuego,
  pieGuia: PORTADA.pieGuia,
  pieInforme: PORTADA.pieInforme,
  pieTaller: PORTADA.pieTaller,
  pieInicio: 'Home',

  // La página
  tituloPagina: 'Credits and licenses · Mosca del WIP',
  rotulo: 'Mosca del WIP',
  titulo: 'Credits and licenses',
  intro:
    'Who made this game, where the brain data come from and what you can do with what’s here. In plain words, no fine print.',

  autorTitulo: 'Author and rights',
  autor1:
    'Mosca del WIP was made by <a href="https://www.linkedin.com/in/felipefernandezandrade/">Felipe Fernández</a> in 2026. © 2026 Felipe Fernández. All rights reserved over the game, the code, the images and the texts, including both reports.',
  autor2:
    'You can play for free, share the link and show the game to your team, in a class or in a talk. You may share the PDF report as is, crediting the author. To use the code, the images or the texts in something else, write to Felipe.',

  cerebroTitulo: 'The brain data',
  cerebro1:
    'The neurons that light up in the game come from <a href="https://male-cns.janelia.org">Male CNS v1.0</a>, the map of a male fly’s central nervous system, neuron by neuron. Its authors ask for this credit:',
  cerebro2:
    'The data are licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: they can be used and adapted as long as you say where they come from. We adapted them: the game shows only some of the neurons, and the lights you see are our simulation of how they would respond, not a recording of a real fly.',

  otrosTitulo: 'Software and fonts by others',
  otrosIntro: 'The site uses these things made by other people, each with its license:',
  otroThree:
    '<b>Three.js</b> (version 0.186.1) draws the office, the fly and the brain in 3D. <a href="https://github.com/mrdoob/three.js/blob/dev/LICENSE">MIT</a> license, © 2010–2026 three.js authors.',
  otroMona:
    '<b>Mona Sans</b> is the typeface of the home page and this page. Made by GitHub (© 2022 The Mona Sans Project Authors), licensed under the <a href="/fonts/LICENCIA-mona-sans-OFL.txt">SIL Open Font License 1.1</a>.',
  otroVite: '<b>Vite</b> builds the site for publishing. MIT license.',
  otroVercel: '<b>Vercel</b> hosts the site and counts visits with its Web Analytics, which only loads on the published site.',
  otrosNuestro: 'Everything else is ours: the fly, the office, the drawings, the game photos and the texts.',

  privacidadTitulo: 'Privacy',
  privacidad1:
    'No cookies. We only count visits with Vercel Web Analytics, which uses no cookies and identifies no one: it tells us how many people come in, nothing more.',
  privacidad2:
    'What you choose stays in your browser and never reaches us: the days played, the language, the background and which panels you left open. You delete it yourself, with “Clear history” in the game or by clearing this site’s data in your browser.',

  juegoTitulo: 'It’s a game',
  juego1:
    'Mosca del WIP is a game and a simulation. Its numbers come from the game, not from real people or teams, and it is not professional advice of any kind. It’s there to get your team talking about which limit to try. What you decide is up to you.',

  volver: 'Back to the home page',
};
