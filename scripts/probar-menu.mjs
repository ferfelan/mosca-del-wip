// Revisión del menú de arriba en todo el sitio (2026-10-28). Pedido de Felipe:
// "el menú de arriba no es el mismo en todas las páginas"; ahora es un solo
// componente (src/barra.js y src/barra.css).
// En cada página (la portada, la guía, el informe, el taller, los créditos y
// la 404, en español y en inglés) y en cuatro pantallas (computador, tablet,
// celular y celular chico) revisa:
//  1. una sola barra, con los seis enlaces en orden y en el idioma de la
//     página: El juego · El cerebro · Guía · Informe · Taller · FAQ;
//  2. que cada enlace apunte donde dice (las secciones de la portada en el
//     mismo idioma: /#juego o /en/#juego) y que la página en la que estás
//     quede marcada (y ninguna otra);
//  3. que el logo lleve a la portada del mismo idioma, Jugar al juego en ese
//     idioma y ES | EN a la misma página en el otro idioma;
//  4. que la barra se vea igual en todas las páginas (mismo alto, mismas
//     posiciones y la misma letra) y quepa sin montarse ni salirse;
//  5. bajo 1100 px, que el botón del menú lo abra con los seis enlaces (de
//     44 px o más de alto), el idioma y el fondo, y que Esc lo cierre;
//  6. que el fondo blanco se pueda elegir desde la barra (en computador);
//  7. siguiendo cada enlace con un clic, en computador y en celular, que
//     llegue a la dirección que dice y, si es una sección, que la muestre;
//  8. que "Ver el kit" de la portada siga llevando al kit;
//  9. que no haya errores en la consola.
// Uso: node scripts/probar-menu.mjs [dirección]   (con npm run dev, con
// npx vite preview, o la dirección publicada; NAVEGADOR=webkit usa el motor
// de Safari; SIN_CLICS=1 se salta el punto 7). Capturas de la barra en
// capturas/menu/ (CAPTURAS=<carpeta>). Debe decir "menú: todo bien".
import { chromium, webkit } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:5173/').replace(/\/?$/, '/');
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const CAPTURAS = process.env.CAPTURAS ?? 'capturas/menu';
const ES_WEBKIT = process.env.NAVEGADOR === 'webkit';
mkdirSync(CAPTURAS, { recursive: true });

// Lo que pidió Felipe, escrito aquí aparte (no se lee del componente)
const ROTULOS = {
  es: ['El juego', 'El cerebro', 'Guía', 'Informe', 'Taller', 'FAQ'],
  en: ['The game', 'The brain', 'Guide', 'Report', 'Workshop', 'FAQ'],
};
const INICIO = { es: '/', en: '/en/' };
const PAGINA = {
  guia: { es: '/limite-wip/', en: '/en/wip-limit/' },
  informe: { es: '/informe/', en: '/en/report/' },
  taller: { es: '/taller/', en: '/en/workshop/' },
};
const SECCION = { juego: '#juego', cerebro: '#por-que-una-mosca', faq: '#faq' };
const NO_EXISTE = LOCAL ? '/404.html' : '/esta-pagina-no-existe/';
const PAGINAS = [
  { clave: 'portada', idioma: 'es', ruta: '/', otra: { es: '/', en: '/en/' } },
  { clave: 'portada', idioma: 'en', ruta: '/en/', otra: { es: '/', en: '/en/' } },
  { clave: 'guia', idioma: 'es', ruta: '/limite-wip/', otra: PAGINA.guia },
  { clave: 'guia', idioma: 'en', ruta: '/en/wip-limit/', otra: PAGINA.guia },
  { clave: 'informe', idioma: 'es', ruta: '/informe/', otra: PAGINA.informe },
  { clave: 'informe', idioma: 'en', ruta: '/en/report/', otra: PAGINA.informe },
  { clave: 'taller', idioma: 'es', ruta: '/taller/', otra: PAGINA.taller },
  { clave: 'taller', idioma: 'en', ruta: '/en/workshop/', otra: PAGINA.taller },
  { clave: 'creditos', idioma: 'es', ruta: '/creditos/', otra: { es: '/creditos/?lang=es', en: '/creditos/?lang=en' } },
  { clave: 'creditos', idioma: 'en', ruta: '/creditos/?lang=en', otra: { es: '/creditos/?lang=es', en: '/creditos/?lang=en' } },
  { clave: '404', idioma: 'es', ruta: NO_EXISTE, otra: { es: '/', en: '/en/' } },
];
const PANTALLAS = [
  { nombre: 'computador', ancho: 1440, alto: 900 },
  { nombre: 'tablet', ancho: 768, alto: 1024, tactil: true },
  { nombre: 'celular', ancho: 390, alto: 844, tactil: true },
  { nombre: 'celular-chico', ancho: 320, alto: 568, tactil: true },
];

// Los seis enlaces que debe tener una página: texto, dirección y a dónde llega
function esperados(clave, idioma) {
  const casa = clave === 'portada' ? '' : INICIO[idioma];
  const seccion = (cual, i) => ({ texto: ROTULOS[idioma][i], href: `${casa}${SECCION[cual]}`, ruta: INICIO[idioma], hash: SECCION[cual], actual: false });
  const pagina = (cual, i) => ({ texto: ROTULOS[idioma][i], href: PAGINA[cual][idioma], ruta: PAGINA[cual][idioma], hash: '', actual: clave === cual });
  return [seccion('juego', 0), seccion('cerebro', 1), pagina('guia', 2), pagina('informe', 3), pagina('taller', 4), seccion('faq', 5)];
}

const fallas = [];
const revisar = (ok, que) => {
  if (!ok) fallas.push(que);
};
const navegador = ES_WEBKIT ? await webkit.launch() : await chromium.launch();
async function nuevoContexto(p) {
  const contexto = await navegador.newContext({
    viewport: { width: p.ancho, height: p.alto },
    ...(p.tactil ? { hasTouch: true, ...(ES_WEBKIT ? {} : { isMobile: true }) } : {}),
  });
  // El contador de visitas de Vercel solo existe en el sitio publicado: en
  // npx vite preview respondería 404 (un error que no es del menú)
  if (LOCAL) await contexto.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  return contexto;
}

async function abrir(contexto, ruta) {
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  const respuesta = await pagina.goto(new URL(ruta.slice(1), BASE).href, { waitUntil: 'load', timeout: 60000 });
  await pagina.waitForSelector('[data-barra]');
  await pagina.evaluate(() => document.fonts.ready);
  return { pagina, errores, estado: respuesta?.status() };
}

// Lo que se mide de la barra (en el navegador)
function medirBarra() {
  const barras = document.querySelectorAll('[data-barra]');
  const barra = barras[0];
  const caja = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const e = getComputedStyle(el);
    return {
      x: Math.round(b.left),
      r: Math.round(b.right),
      y: Math.round(b.top),
      b: Math.round(b.bottom),
      w: Math.round(b.width),
      h: Math.round(b.height),
      visible: b.width > 0 && b.height > 0 && e.visibility !== 'hidden' && e.display !== 'none' && Number(e.opacity) > 0.5,
    };
  };
  const estilo = (sel, props) => {
    const el = barra.querySelector(sel);
    if (!el) return null;
    const e = getComputedStyle(el);
    return Object.fromEntries(props.map((p) => [p, e[p]]));
  };
  const jugar = barra.querySelector('.barra-jugar');
  return {
    cuantas: barras.length,
    lang: document.documentElement.lang,
    sobra: document.documentElement.scrollWidth - innerWidth,
    enlaces: [...barra.querySelectorAll('.menu-enlaces a')].map((a) => ({ texto: a.textContent.trim(), href: a.getAttribute('href'), actual: a.getAttribute('aria-current'), caja: caja(a) })),
    logo: { href: barra.querySelector('.logo')?.getAttribute('href'), caja: caja(barra.querySelector('.logo')) },
    jugar: { href: jugar?.getAttribute('href'), caja: caja(jugar) },
    boton: { caja: caja(barra.querySelector('.menu-boton')), abierto: barra.querySelector('.menu-boton')?.getAttribute('aria-expanded') },
    selectores: [...barra.querySelectorAll('.selector')].map(caja),
    idiomas: [...barra.querySelectorAll('[data-idioma]')].map((a) => ({ idioma: a.dataset.idioma, href: a.getAttribute('href'), actual: a.getAttribute('aria-current') })),
    abierta: barra.classList.contains('abierta'),
    // lo que tiene que ser igual en todas las páginas (mismo idioma y pantalla)
    firma: {
      alto: Math.round(barra.getBoundingClientRect().height),
      posicion: getComputedStyle(barra).position,
      dentro: estilo('.barra-dentro', ['maxWidth', 'height', 'paddingLeft', 'paddingRight', 'columnGap']),
      logo: estilo('.logo', ['columnGap', 'fontSize']),
      nombre: estilo('.logo-nombre', ['display', 'fontSize', 'fontWeight']),
      lista: estilo('.menu-enlaces', ['display', 'flexDirection', 'columnGap']),
      enlace: estilo('.menu-enlaces li:nth-child(3) a', ['fontSize', 'fontWeight', 'paddingLeft', 'paddingRight', 'minHeight']),
      menu: estilo('.menu', ['display', 'position']),
      boton: estilo('.menu-boton', ['display', 'width', 'height']),
      jugar: estilo('.barra-jugar', ['paddingLeft', 'paddingRight', 'fontSize', 'minHeight']),
      selector: estilo('.selector', ['display', 'paddingTop']),
      cajas: {
        logo: caja(barra.querySelector('.logo')),
        boton: caja(barra.querySelector('.menu-boton')),
        jugar: (({ visible, ...resto }) => resto)(caja(jugar)),
        lista: caja(barra.querySelector('.menu-enlaces')),
      },
    },
  };
}

const diferencias = (a, b, ruta = '') =>
  typeof a === 'object' && a && b
    ? Object.keys({ ...a, ...b }).flatMap((k) => diferencias(a[k], b[k], ruta ? `${ruta}.${k}` : k))
    : JSON.stringify(a) === JSON.stringify(b)
      ? []
      : [`${ruta}: ${JSON.stringify(a)} contra ${JSON.stringify(b)}`];
const errorEsperado = (pag, texto) => pag.clave === '404' && !LOCAL && /status of 404/.test(texto);

// ---------- 1 a 6 y 9: cada página en cada pantalla ----------
let revisadas = 0;
for (const p of PANTALLAS) {
  const contexto = await nuevoContexto(p);
  const firmas = {}; // por idioma: la de la portada
  for (const pag of PAGINAS) {
    const etiqueta = `${pag.ruta} ${p.nombre} ${p.ancho}×${p.alto}`;
    const { pagina, errores, estado } = await abrir(contexto, pag.ruta);
    if (pag.clave === '404') revisar(estado === (LOCAL ? 200 : 404), `${etiqueta}: la página no encontrada responde ${estado}`);
    const m = await pagina.evaluate(medirBarra);
    const esp = esperados(pag.clave, pag.idioma);
    revisar(m.cuantas === 1, `${etiqueta}: hay ${m.cuantas} barras`);
    revisar(m.lang === pag.idioma, `${etiqueta}: la página está en ${m.lang}`);
    revisar(m.sobra <= 0, `${etiqueta}: la página se sale ${m.sobra} px por el lado`);
    revisar(m.enlaces.length === 6, `${etiqueta}: el menú tiene ${m.enlaces.length} enlaces`);
    const textos = m.enlaces.map((e) => e.texto).join(' · ');
    revisar(textos === ROTULOS[pag.idioma].join(' · '), `${etiqueta}: el menú dice "${textos}"`);
    esp.forEach((e, i) => {
      const hay = m.enlaces[i];
      if (!hay) return;
      revisar(hay.href === e.href, `${etiqueta}: "${e.texto}" lleva a ${hay.href} (debía ser ${e.href})`);
      revisar((hay.actual === 'page') === e.actual, `${etiqueta}: "${e.texto}" ${e.actual ? 'no está marcada como la página actual' : 'está marcada como página actual'}`);
    });
    revisar(m.logo.href === INICIO[pag.idioma], `${etiqueta}: el logo lleva a ${m.logo.href}`);
    revisar(m.jugar.href === (pag.idioma === 'en' ? '/jugar/?lang=en' : '/jugar/'), `${etiqueta}: Jugar lleva a ${m.jugar.href}`);
    for (const otro of ['es', 'en']) {
      const enlace = m.idiomas.find((x) => x.idioma === otro);
      revisar(enlace?.href === pag.otra[otro], `${etiqueta}: ${otro.toUpperCase()} lleva a ${enlace?.href} (debía ser ${pag.otra[otro]})`);
      revisar((enlace?.actual === 'page') === (otro === pag.idioma), `${etiqueta}: ${otro.toUpperCase()} ${otro === pag.idioma ? 'no está marcado' : 'está marcado'}`);
    }
    // 4. igual en todas las páginas: se compara con la portada del mismo idioma
    if (pag.clave === 'portada') firmas[pag.idioma] = m.firma;
    else if (firmas[pag.idioma]) {
      const d = diferencias(firmas[pag.idioma], m.firma);
      revisar(d.length === 0, `${etiqueta}: la barra no es igual a la de la portada: ${d.slice(0, 4).join(' | ')}`);
    }
    const dentro = (c) => c && c.visible && c.x >= 0 && c.r <= p.ancho;
    if (p.ancho >= 1100) {
      revisar(m.enlaces.every((e) => dentro(e.caja)), `${etiqueta}: algún enlace del menú no se ve o se sale`);
      revisar(!m.boton.caja?.visible, `${etiqueta}: el botón del menú se ve en computador`);
      const [idioma, fondo] = m.selectores;
      revisar(
        dentro(m.logo.caja) && dentro(idioma) && dentro(fondo) && dentro(m.jugar.caja) &&
          m.logo.caja.r <= m.enlaces[0].caja.x && m.enlaces[5].caja.r <= idioma.x && idioma.r <= fondo.x && fondo.r <= m.jugar.caja.x,
        `${etiqueta}: la barra se monta o algo no se ve`
      );
    } else {
      revisar(m.enlaces.every((e) => !e.caja.visible), `${etiqueta}: con el menú cerrado se ven sus enlaces`);
      revisar(dentro(m.logo.caja) && dentro(m.boton.caja), `${etiqueta}: el logo o el botón del menú no se ven`);
      if (pag.clave !== 'portada') revisar(dentro(m.jugar.caja), `${etiqueta}: Jugar no se ve en la barra`);
      revisar(m.logo.caja.r <= m.jugar.caja.x && m.jugar.caja.r <= m.boton.caja.x, `${etiqueta}: la barra se monta`);
    }
    await pagina.screenshot({ path: `${CAPTURAS}/${pag.clave}-${pag.idioma}-${p.nombre}.png`, clip: { x: 0, y: 0, width: p.ancho, height: Math.min(p.alto, 200) } });

    // 5. el menú se abre y se cierra
    if (p.ancho < 1100) {
      await pagina.locator('.barra .menu-boton').click();
      await pagina.waitForSelector('.barra.abierta .menu-enlaces a', { state: 'visible' });
      await pagina.waitForTimeout(260); // la animación de bajada dura 0,2 s
      const a = await pagina.evaluate(medirBarra);
      revisar(a.boton.abierto === 'true', `${etiqueta}: el botón no dice que el menú está abierto`);
      revisar(a.enlaces.every((e) => dentro(e.caja) && e.caja.h >= 44), `${etiqueta}: con el menú abierto algún enlace no se ve, se sale o mide menos de 44 px`);
      revisar(a.selectores.length === 2 && a.selectores.every(dentro), `${etiqueta}: con el menú abierto no se ven el idioma o el fondo`);
      revisar(a.sobra <= 0, `${etiqueta}: con el menú abierto la página se sale ${a.sobra} px`);
      await pagina.screenshot({ path: `${CAPTURAS}/${pag.clave}-${pag.idioma}-${p.nombre}-abierto.png` });
      await pagina.keyboard.press('Escape');
      await pagina.waitForFunction(() => !document.querySelector('[data-barra]').classList.contains('abierta'));
      const foco = await pagina.evaluate(() => document.activeElement?.classList.contains('menu-boton'));
      revisar(foco, `${etiqueta}: después de Esc el foco no volvió al botón del menú`);
    }

    // 6. el fondo blanco, desde la barra
    if (p.ancho >= 1100) {
      await pagina.locator('.barra [data-fondo="claro"]').click();
      await pagina.waitForFunction(() => document.documentElement.dataset.tema === 'claro');
      const marcado = await pagina.locator('.barra [data-fondo="claro"]').getAttribute('aria-pressed');
      revisar(marcado === 'true', `${etiqueta}: el botón del fondo blanco no queda marcado`);
      await pagina.locator('.barra [data-fondo="oscuro"]').click();
      await pagina.waitForFunction(() => !document.documentElement.dataset.tema);
    }

    const malos = errores.filter((e) => !errorEsperado(pag, e));
    revisar(malos.length === 0, `${etiqueta}: errores en la consola: ${malos.join(' | ')}`);
    await pagina.close();
    revisadas++;
  }
  await contexto.close();
}

// ---------- 7: cada enlace con un clic, en computador y en celular ----------
let seguidos = 0;
if (!process.env.SIN_CLICS) {
  for (const p of PANTALLAS.filter((x) => x.nombre === 'computador' || x.nombre === 'celular')) {
    const contexto = await nuevoContexto(p);
    for (const pag of PAGINAS) {
      const esp = esperados(pag.clave, pag.idioma);
      for (let i = 0; i < esp.length; i++) {
        const e = esp[i];
        const etiqueta = `${pag.ruta} ${p.nombre}: "${e.texto}"`;
        const { pagina, errores } = await abrir(contexto, pag.ruta);
        if (p.ancho < 1100) {
          await pagina.locator('.barra .menu-boton').click();
          await pagina.waitForSelector('.barra.abierta .menu-enlaces a', { state: 'visible' });
        }
        await pagina.locator('.barra .menu-enlaces a').nth(i).click();
        const llego = await pagina
          .waitForURL((u) => u.pathname === e.ruta && u.hash === e.hash, { timeout: 20000, waitUntil: 'domcontentloaded' })
          .then(() => true, () => false);
        const donde = new URL(pagina.url());
        revisar(llego, `${etiqueta} llegó a ${donde.pathname}${donde.hash} (debía ser ${e.ruta}${e.hash})`);
        if (llego && e.hash) {
          const seVe = await pagina
            .waitForFunction(
              (id) => {
                const el = document.getElementById(id);
                if (!el) return false;
                const t = el.getBoundingClientRect().top;
                return t >= -4 && t <= innerHeight * 0.6;
              },
              e.hash.slice(1),
              { timeout: 6000 }
            )
            .then(() => true, () => false);
          revisar(seVe, `${etiqueta}: la sección ${e.hash} no quedó a la vista`);
        }
        if (llego && !e.hash) {
          const h1 = await pagina.locator('h1').count();
          revisar(h1 === 1, `${etiqueta}: la página de destino no tiene su título`);
        }
        if (llego) {
          const cerrado = await pagina.evaluate(() => !document.querySelector('[data-barra]')?.classList.contains('abierta'));
          revisar(cerrado, `${etiqueta}: al llegar el menú quedó abierto`);
        }
        const malos = errores.filter((x) => !errorEsperado(pag, x));
        revisar(malos.length === 0, `${etiqueta}: errores en la consola: ${malos.join(' | ')}`);
        await pagina.close();
        seguidos++;
      }
    }
    await contexto.close();
  }
}

// ---------- 8: "Ver el kit" de la portada sigue llevando al kit ----------
for (const idioma of ['es', 'en']) {
  const contexto = await nuevoContexto(PANTALLAS[0]);
  const { pagina } = await abrir(contexto, INICIO[idioma]);
  await pagina.locator('.hero .acciones a[href="#kit"]').click();
  const ok = await pagina
    .waitForFunction(() => {
      const t = document.getElementById('kit')?.getBoundingClientRect().top;
      return location.hash === '#kit' && t >= -4 && t <= innerHeight * 0.6;
    }, null, { timeout: 6000 })
    .then(() => true, () => false);
  revisar(ok, `${INICIO[idioma]}: "Ver el kit" no llevó al kit`);
  // y "El kit" ya no está en el menú
  const kitEnMenu = await pagina.locator('.barra .menu-enlaces a[href$="#kit"]').count();
  revisar(kitEnMenu === 0, `${INICIO[idioma]}: "El kit" sigue en el menú`);
  await contexto.close();
}

await navegador.close();
if (fallas.length) {
  console.log(`menú: ${fallas.length} problema(s)`);
  for (const f of fallas) console.log(` - ${f}`);
  process.exit(1);
}
console.log(
  `menú: todo bien (${revisadas} revisiones = ${PAGINAS.length} páginas × ${PANTALLAS.length} pantallas, ${seguidos} enlaces seguidos con un clic${ES_WEBKIT ? ', WebKit' : ''}; capturas en ${CAPTURAS}/)`
);
