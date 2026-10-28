// Revisión de la página "Créditos y licencias" (/creditos/, parte 5.2h, 2026-10-25):
//   1. se abre en cinco pantallas (celular, tablet, computador), con fondo negro y
//      blanco, en español y en inglés: nada se sale por el lado, el título se ve en
//      la primera pantalla, la barra cabe sin montarse y no hay errores en la consola;
//   2. en inglés, cada texto marcado (data-t) dice lo que dice src/creditos-textos.js,
//      los aria-label también, y la pestaña se llama "Credits and licenses · Mosca del WIP";
//   3. el botón ES | EN cambia el idioma sin recargar, lo muestra en la dirección
//      (?lang=en) y lo recuerda al volver a entrar;
//   4. el logo y "Volver al inicio" llevan a la portada y Jugar al juego, en el mismo
//      idioma; cada enlace del propio sitio existe (responde 200);
//   5. la portada enlaza a /creditos/ desde el pie (en los dos idiomas) y el juego
//      desde el crédito del cerebro, con su título traducido.
// Uso: node scripts/probar-creditos.mjs [dirección]   (con npm run dev, o la dirección
// publicada; NAVEGADOR=webkit usa el motor de Safari). Capturas en capturas/creditos/.
// Debe decir "créditos: todo bien".
import { chromium, webkit } from 'playwright';
import { mkdirSync } from 'node:fs';
import { INGLES } from '../src/creditos-textos.js';

const DIRECCION = (process.argv[2] || 'http://localhost:5173/').replace(/\/?$/, '/');
const CAPTURAS = process.env.CAPTURAS ?? 'capturas/creditos';
const PANTALLAS = [
  ['celular', 320, 568],
  ['celular-grande', 390, 844],
  ['tablet', 768, 1024],
  ['computador-chico', 1024, 640],
  ['computador', 1440, 900],
];
const TITULO_ES = 'Créditos y licencias · Mosca del WIP';
mkdirSync(CAPTURAS, { recursive: true });

const fallas = [];
const revisar = (ok, que) => {
  if (!ok) fallas.push(que);
};
const navegador = process.env.NAVEGADOR === 'webkit' ? await webkit.launch() : await chromium.launch();
const propios = new Set(); // enlaces del propio sitio que aparecen en la página

async function abrir(ancho, alto, idioma, fondo) {
  const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, hasTouch: ancho < 900 });
  const errores = [];
  const pagina = await contexto.newPage();
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  await pagina.goto(`${DIRECCION}creditos/${idioma === 'en' ? '?lang=en' : ''}`, { waitUntil: 'networkidle' });
  if (fondo === 'claro') {
    await pagina.locator('[data-fondo="claro"]').click();
    await pagina.waitForTimeout(400); // el cambio de color dura 0,2 s
  }
  await pagina.evaluate(() => document.fonts.ready);
  return { contexto, pagina, errores };
}

// ---------- 1, 2 y 4: cada pantalla, fondo e idioma ----------
for (const [nombre, ancho, alto] of PANTALLAS)
  for (const idioma of ['es', 'en'])
    for (const fondo of ['oscuro', 'claro']) {
      const etiqueta = `${nombre} ${ancho}×${alto} ${idioma} ${fondo}`;
      const { contexto, pagina, errores } = await abrir(ancho, alto, idioma, fondo);
      const estado = await pagina.evaluate(() => {
        const h1 = document.querySelector('h1').getBoundingClientRect();
        return {
          sobra: document.documentElement.scrollWidth - innerWidth,
          tema: document.documentElement.dataset.tema ?? 'oscuro',
          lang: document.documentElement.lang,
          titulo: document.title,
          h1: { top: h1.top, bottom: h1.bottom, ancho: h1.width },
          escondida: document.documentElement.classList.contains('traduciendo'),
        };
      });
      revisar(estado.sobra <= 0, `${etiqueta}: la página se sale ${estado.sobra} px por el lado`);
      revisar(estado.tema === fondo, `${etiqueta}: el fondo es ${estado.tema}`);
      revisar(estado.lang === idioma, `${etiqueta}: <html lang> es ${estado.lang}`);
      revisar(!estado.escondida, `${etiqueta}: la página sigue escondida (traduciendo)`);
      revisar(
        estado.h1.ancho > 0 && estado.h1.top >= 0 && estado.h1.bottom <= alto,
        `${etiqueta}: el título no se ve entero en la primera pantalla`
      );

      // La barra: el logo, los dos selectores y (desde 600 px) Jugar, en fila y sin montarse
      const barra = await pagina.evaluate(() => {
        const medir = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const b = el.getBoundingClientRect();
          const estilo = getComputedStyle(el);
          return { left: b.left, right: b.right, visible: b.width > 0 && b.height > 0 && estilo.visibility !== 'hidden' && estilo.display !== 'none' };
        };
        return {
          logo: medir('.barra .logo'),
          idioma: medir('.creditos-ajustes .selector:nth-child(1)'),
          fondo: medir('.creditos-ajustes .selector:nth-child(2)'),
          jugar: medir('.barra .barra-jugar'),
        };
      });
      const cabe = (b) => b && b.visible && b.left >= 0 && b.right <= ancho;
      revisar(cabe(barra.logo) && cabe(barra.idioma) && cabe(barra.fondo), `${etiqueta}: algo de la barra no cabe o no se ve`);
      revisar(
        barra.logo && barra.idioma && barra.fondo && barra.logo.right <= barra.idioma.left && barra.idioma.right <= barra.fondo.left,
        `${etiqueta}: la barra se monta`
      );
      if (ancho >= 600) revisar(cabe(barra.jugar) && barra.fondo.right <= barra.jugar.left, `${etiqueta}: Jugar de la barra no se ve o se monta`);
      else revisar(!barra.jugar?.visible, `${etiqueta}: en celular Jugar no va en la barra`);

      // Los textos
      if (idioma === 'en') {
        const sinIngles = await pagina.evaluate((INGLES) => {
          const texto = (html) => {
            const d = document.createElement('div');
            d.innerHTML = html;
            return d.textContent.replace(/\s+/g, ' ').trim();
          };
          return [...document.querySelectorAll('[data-t]')]
            .filter((el) => INGLES[el.dataset.t] !== undefined && texto(el.innerHTML) !== texto(INGLES[el.dataset.t]))
            .map((el) => el.dataset.t);
        }, INGLES);
        revisar(sinIngles.length === 0, `${etiqueta}: textos que no están en inglés: ${sinIngles.join(', ')}`);
        const ariaEspanol = await pagina.evaluate(() =>
          [...document.querySelectorAll('[data-t-aria]')]
            .filter((el) => /inicio|Idioma|Fondo/.test(el.getAttribute('aria-label')))
            .map((el) => el.dataset.tAria)
        );
        revisar(ariaEspanol.length === 0, `${etiqueta}: aria-label en español: ${ariaEspanol.join(', ')}`);
        revisar(estado.titulo === INGLES.tituloPagina, `${etiqueta}: la pestaña dice "${estado.titulo}"`);
      } else {
        revisar(estado.titulo === TITULO_ES, `${etiqueta}: la pestaña dice "${estado.titulo}"`);
      }

      // Los enlaces, en el mismo idioma
      const enlaces = await pagina.evaluate(() => ({
        jugar: [...document.querySelectorAll('[data-jugar]')].map((a) => a.getAttribute('href')),
        inicio: [...document.querySelectorAll('[data-inicio]')].map((a) => a.getAttribute('href')),
        propios: [...new Set([...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')))],
      }));
      const sufijo = idioma === 'en' ? '?lang=en' : '';
      revisar(enlaces.jugar.length === 2 && enlaces.jugar.every((h) => h === `/jugar/${sufijo}`), `${etiqueta}: Jugar lleva a ${enlaces.jugar.join(' y ')}`);
      revisar(enlaces.inicio.length === 2 && enlaces.inicio.every((h) => h === `/${sufijo}`), `${etiqueta}: el inicio lleva a ${enlaces.inicio.join(' y ')}`);
      for (const h of enlaces.propios) propios.add(h);
      revisar(errores.length === 0, `${etiqueta}: errores en la consola: ${errores.join(' | ')}`);

      await pagina.screenshot({ path: `${CAPTURAS}/${nombre}-${idioma}-${fondo}.png`, fullPage: ancho < 900 });
      await contexto.close();
    }

// ---------- 3: ES | EN sin recargar, y lo recuerda ----------
{
  const { contexto, pagina } = await abrir(1440, 900, 'es', 'oscuro');
  await pagina.locator('[data-idioma="en"]').click();
  await pagina.waitForFunction(() => document.documentElement.lang === 'en');
  const despues = await pagina.evaluate(() => ({
    h1: document.querySelector('h1').textContent.trim(),
    busqueda: location.search,
    titulo: document.title,
    presionado: document.querySelector('[data-idioma="en"]').getAttribute('aria-pressed'),
  }));
  revisar(
    despues.h1 === INGLES.titulo && despues.busqueda === '?lang=en' && despues.titulo === INGLES.tituloPagina && despues.presionado === 'true',
    `ES | EN: al apretar EN queda "${despues.h1}", "${despues.titulo}", ${despues.busqueda || 'sin ?lang'}`
  );
  await pagina.locator('[data-idioma="es"]').click();
  await pagina.waitForFunction(() => document.documentElement.lang === 'es');
  const vuelta = await pagina.evaluate(() => ({ h1: document.querySelector('h1').textContent.trim(), busqueda: location.search, titulo: document.title }));
  revisar(
    vuelta.h1 === 'Créditos y licencias' && vuelta.busqueda === '' && vuelta.titulo === TITULO_ES,
    `ES | EN: al volver a ES queda "${vuelta.h1}", "${vuelta.titulo}", ${vuelta.busqueda || 'sin ?lang'}`
  );
  await pagina.locator('[data-idioma="en"]').click();
  await pagina.waitForFunction(() => document.documentElement.lang === 'en');
  await pagina.goto(`${DIRECCION}creditos/`, { waitUntil: 'networkidle' });
  revisar((await pagina.evaluate(() => document.documentElement.lang)) === 'en', 'ES | EN: no recuerda el inglés al volver a entrar sin ?lang');
  await contexto.close();
}

// ---------- 4: cada enlace del propio sitio existe ----------
{
  const contexto = await navegador.newContext();
  for (const h of propios) {
    const respuesta = await contexto.request.get(new URL(h, DIRECCION).href);
    revisar(respuesta.ok(), `el enlace ${h} responde ${respuesta.status()}`);
  }
  await contexto.close();
}

// ---------- 5: la portada y el juego enlazan a los créditos ----------
{
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await contexto.newPage();
  await pagina.goto(DIRECCION, { waitUntil: 'networkidle' });
  revisar((await pagina.locator('.pie a[href="/creditos/"]').count()) === 1, 'la portada en español no enlaza a /creditos/ desde el pie');
  // EN lleva a la portada en inglés, /en/ (Etapa 7)
  await pagina.locator('.barra [data-idioma="en"]').click();
  await pagina.waitForURL((u) => u.pathname === '/en/', { timeout: 15000 });
  await pagina.waitForFunction(() => document.documentElement.lang === 'en');
  revisar((await pagina.locator('.pie a[href="/creditos/?lang=en"]').count()) === 1, 'la portada en inglés no enlaza a /creditos/?lang=en desde el pie');
  // El juego (queda en inglés: el idioma se recuerda)
  await pagina.goto(`${DIRECCION}jugar/`, { waitUntil: 'networkidle', timeout: 120000 });
  const credito = pagina.locator('a.cerebro-credito[href="/creditos/"]');
  revisar((await credito.count()) === 1, 'el juego no enlaza a /creditos/ desde el crédito del cerebro');
  if (await credito.count()) {
    const en = await credito.evaluate((a) => ({ title: a.getAttribute('title'), texto: a.textContent.trim() }));
    revisar(en.title === 'Credits and licenses' && en.texto === 'Data: Male CNS v1.0 · CC BY 4.0', `el crédito del juego en inglés dice "${en.texto}" (${en.title})`);
  }
  await contexto.close();
  const limpio = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const juego = await limpio.newPage();
  await juego.goto(`${DIRECCION}jugar/`, { waitUntil: 'networkidle', timeout: 120000 });
  const es = await juego.locator('a.cerebro-credito[href="/creditos/"]').evaluate((a) => ({ title: a.getAttribute('title'), texto: a.textContent.trim() }));
  revisar(es.title === 'Créditos y licencias' && es.texto === 'Datos: Male CNS v1.0 · CC BY 4.0', `el crédito del juego en español dice "${es.texto}" (${es.title})`);
  await limpio.close();
}

await navegador.close();
if (fallas.length) {
  console.log(`créditos: ${fallas.length} problema(s)`);
  for (const f of fallas) console.log(` - ${f}`);
  process.exit(1);
}
console.log(`créditos: todo bien (${PANTALLAS.length} pantallas × 2 fondos × 2 idiomas, ${propios.size} enlaces propios; capturas en ${CAPTURAS}/)`);
