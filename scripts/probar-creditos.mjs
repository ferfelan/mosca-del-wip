// Revisión de la página "Créditos y licencias" (/creditos/, parte 5.2h, 2026-10-25):
//   1. se abre en cinco pantallas (celular, tablet, computador), con fondo negro y
//      blanco, en español y en inglés: nada se sale por el lado, el título se ve en
//      la primera pantalla, la barra (la de todo el sitio, src/barra.js) cabe sin
//      montarse y no hay errores en la consola;
//   2. en inglés, cada texto marcado (data-t) dice lo que dice src/creditos-textos.js,
//      los aria-label también, y la pestaña se llama "Credits and licenses · Mosca del WIP";
//   3. el botón ES | EN de la barra cambia el idioma sin recargar (también la
//      barra), lo muestra en la dirección (?lang=en) y lo recuerda al volver a entrar;
//   4. el logo, "Volver al inicio" e "Inicio" del pie llevan a la portada, y los tres
//      Jugar (barra, final y pie) al juego, en el mismo idioma; cada enlace del propio
//      sitio existe (responde 200);
//   5. la portada enlaza a /creditos/ desde el pie (en los dos idiomas) y el juego
//      desde el crédito del cerebro, con su título traducido.
// Uso: node scripts/probar-creditos.mjs [dirección]   (con npm run dev, o la dirección
// publicada; NAVEGADOR=webkit usa el motor de Safari). Capturas en capturas/creditos/.
// Debe decir "créditos: todo bien".
import { chromium, webkit } from 'playwright';
import { mkdirSync } from 'node:fs';
import { INGLES } from '../src/creditos-textos.js';

const DIRECCION = (process.argv[2] || 'http://localhost:5173/').replace(/\/?$/, '/');
// En el computador el contador de visitas de Vercel no existe (lo pone Vercel
// en el sitio publicado): con `npx vite preview` daría un 404 en cada revisión,
// que no es un error de la página. Aquí se responde vacío, igual que en
// portada-responsiva, probar-menu y probar-paginas (8.13, 2026-11-14)
const LOCAL = /localhost|127\.0\.0\.1/.test(DIRECCION);
const sinContador = async (contexto) => {
  if (LOCAL) await contexto.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
};
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
  await sinContador(contexto);
  const errores = [];
  const pagina = await contexto.newPage();
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  await pagina.goto(`${DIRECCION}creditos/${idioma === 'en' ? '?lang=en' : ''}`, { waitUntil: 'networkidle' });
  if (fondo === 'claro') {
    // bajo 1100 px el fondo está dentro del menú
    const menu = pagina.locator('.barra .menu-boton');
    const conMenu = await menu.isVisible();
    if (conMenu) {
      await menu.click();
      // como una persona: espera a que el menú termine de bajar (0,2 s). Si
      // Playwright aprieta en plena animación, en WebKit desliza la página para
      // "mostrar" el botón (un toque real no la mueve: comprobado el 2026-10-28)
      await pagina.waitForSelector('.barra.abierta [data-fondo="claro"]', { state: 'visible' });
      await pagina.waitForTimeout(300);
    }
    await pagina.locator('.barra [data-fondo="claro"]').click();
    if (conMenu) await pagina.keyboard.press('Escape');
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
          // (8.14) el rótulo "Mosca del WIP" sobre el título
          rotulo: document.querySelector('.creditos-main .rotulo')?.getBoundingClientRect().height ?? 0,
        };
      });
      // (8.14) La portada esconde su rótulo en el celular y este archivo carga
      // los estilos de la portada: una regla suelta (.rotulo) escondía este también
      revisar(estado.rotulo > 0, `${etiqueta}: no se ve el rótulo "Mosca del WIP" sobre el título`);
      revisar(estado.sobra <= 0, `${etiqueta}: la página se sale ${estado.sobra} px por el lado`);
      revisar(estado.tema === fondo, `${etiqueta}: el fondo es ${estado.tema}`);
      revisar(estado.lang === idioma, `${etiqueta}: <html lang> es ${estado.lang}`);
      revisar(!estado.escondida, `${etiqueta}: la página sigue escondida (traduciendo)`);
      revisar(
        estado.h1.ancho > 0 && estado.h1.top >= 0 && estado.h1.bottom <= alto,
        `${etiqueta}: el título no se ve entero en la primera pantalla`
      );

      // La barra (la de todo el sitio): desde 1100 px el logo, los seis enlaces,
      // el idioma, el fondo y Jugar en fila; más angosto, el logo, Jugar y el
      // botón del menú (el idioma y el fondo, dentro del menú)
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
          enlaces: medir('.barra .menu-enlaces'),
          idioma: medir('.barra .ajuste:nth-child(1) .selector'),
          fondo: medir('.barra .ajuste:nth-child(2) .selector'),
          jugar: medir('.barra .barra-jugar'),
          boton: medir('.barra .menu-boton'),
          seis: document.querySelectorAll('.barra .menu-enlaces a').length,
        };
      });
      const cabe = (b) => b && b.visible && b.left >= 0 && b.right <= ancho;
      revisar(barra.seis === 6, `${etiqueta}: el menú tiene ${barra.seis} enlaces (deben ser 6)`);
      if (ancho >= 1100) {
        revisar([barra.logo, barra.enlaces, barra.idioma, barra.fondo, barra.jugar].every(cabe), `${etiqueta}: algo de la barra no cabe o no se ve`);
        revisar(
          barra.logo.right <= barra.enlaces.left && barra.enlaces.right <= barra.idioma.left && barra.idioma.right <= barra.fondo.left && barra.fondo.right <= barra.jugar.left,
          `${etiqueta}: la barra se monta`
        );
      } else {
        revisar([barra.logo, barra.jugar, barra.boton].every(cabe), `${etiqueta}: el logo, Jugar o el botón del menú no caben o no se ven`);
        revisar(barra.logo.right <= barra.jugar.left && barra.jugar.right <= barra.boton.left, `${etiqueta}: la barra se monta`);
        revisar(!barra.idioma?.visible && !barra.enlaces?.visible, `${etiqueta}: con el menú cerrado se ven sus enlaces o el idioma`);
      }

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
      // tres al juego (Jugar de la barra, el botón del final y "El juego" del pie)
      // y tres al inicio (el logo, "Volver al inicio" e "Inicio" del pie; Etapa 7)
      revisar(enlaces.jugar.length === 3 && enlaces.jugar.every((h) => h === `/jugar/${sufijo}`), `${etiqueta}: Jugar lleva a ${enlaces.jugar.join(' y ')}`);
      // la portada en inglés tiene su dirección: /en/ (Etapa 7)
      const inicio = idioma === 'en' ? '/en/' : '/';
      revisar(enlaces.inicio.length === 3 && enlaces.inicio.every((h) => h === inicio), `${etiqueta}: el inicio lleva a ${enlaces.inicio.join(' y ')}`);
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
    marcado: document.querySelector('.barra [data-idioma="en"]').getAttribute('aria-current'),
    menu: [...document.querySelectorAll('.barra .menu-enlaces a')].map((a) => a.textContent).join(' · '),
  }));
  revisar(despues.menu === 'The game · The brain · Guide · Report · Workshop · FAQ', `ES | EN: en inglés el menú dice "${despues.menu}"`);
  revisar(
    despues.h1 === INGLES.titulo && despues.busqueda === '?lang=en' && despues.titulo === INGLES.tituloPagina && despues.marcado === 'page',
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
  await sinContador(contexto);
  for (const h of propios) {
    const respuesta = await contexto.request.get(new URL(h, DIRECCION).href);
    revisar(respuesta.ok(), `el enlace ${h} responde ${respuesta.status()}`);
  }
  await contexto.close();
}

// ---------- 5: la portada y el juego enlazan a los créditos ----------
{
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  await sinContador(contexto);
  const pagina = await contexto.newPage();
  await pagina.goto(DIRECCION, { waitUntil: 'networkidle' });
  // El pie enlaza a los créditos dos veces (la lista de páginas y la línea de
  // los derechos): todos sus enlaces a los créditos, en el idioma de la portada
  const creditosDelPie = () =>
    pagina.evaluate(() => [...document.querySelectorAll('.pie a[href*="/creditos/"]')].map((a) => a.getAttribute('href')));
  let delPie = await creditosDelPie();
  revisar(delPie.length >= 1 && delPie.every((h) => h === '/creditos/'), `la portada en español no enlaza a /creditos/ desde el pie (${delPie.join(', ') || 'ningún enlace'})`);
  // EN lleva a la portada en inglés, /en/ (Etapa 7)
  await pagina.locator('.barra [data-idioma="en"]').click();
  await pagina.waitForURL((u) => u.pathname === '/en/', { timeout: 15000 });
  await pagina.waitForFunction(() => document.documentElement.lang === 'en');
  delPie = await creditosDelPie();
  revisar(delPie.length >= 1 && delPie.every((h) => h === '/creditos/?lang=en'), `la portada en inglés no enlaza a /creditos/?lang=en desde el pie (${delPie.join(', ') || 'ningún enlace'})`);
  // El juego (queda en inglés: el idioma se recuerda)
  await pagina.goto(`${DIRECCION}jugar/`, { waitUntil: 'networkidle', timeout: 120000 });
  // en inglés va a /creditos/?lang=en, igual que el pie de /en/ (revisión final, S5)
  const credito = pagina.locator('a.cerebro-credito[href="/creditos/?lang=en"]');
  revisar((await credito.count()) === 1, 'el juego en inglés no enlaza a /creditos/?lang=en desde el crédito del cerebro');
  if (await credito.count()) {
    const en = await credito.evaluate((a) => ({ title: a.getAttribute('title'), texto: a.textContent.trim() }));
    revisar(en.title === 'Credits and licenses' && en.texto === 'Data from Male CNS v1.0 · CC BY 4.0', `el crédito del juego en inglés dice "${en.texto}" (${en.title})`);
  }
  await contexto.close();
  const limpio = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  await sinContador(limpio);
  const juego = await limpio.newPage();
  await juego.goto(`${DIRECCION}jugar/`, { waitUntil: 'networkidle', timeout: 120000 });
  const es = await juego.locator('a.cerebro-credito[href="/creditos/"]').evaluate((a) => ({ title: a.getAttribute('title'), texto: a.textContent.trim() }));
  revisar(es.title === 'Créditos y licencias' && es.texto === 'Datos del Male CNS v1.0 · CC BY 4.0', `el crédito del juego en español dice "${es.texto}" (${es.title})`);
  await limpio.close();
}

await navegador.close();
if (fallas.length) {
  console.log(`créditos: ${fallas.length} problema(s)`);
  for (const f of fallas) console.log(` - ${f}`);
  process.exit(1);
}
console.log(`créditos: todo bien (${PANTALLAS.length} pantallas × 2 fondos × 2 idiomas, ${propios.size} enlaces propios; capturas en ${CAPTURAS}/)`);
