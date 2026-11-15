// Prueba nueva de la Etapa 8.14 (2026-11-14): en el juego, ningún texto se
// sale de su cuadro ni se monta sobre otro, ni siquiera con el peor día.
//
// Felipe vio en la vista grande ("La misma partida, en grande"), en una
// ventana ancha y baja de unos 1906 × 837, que el cuadro "Terminadas" del
// resumen del día se rompía con urgencias: "6 normales + 3 urgencias (1 quedó
// a medias)" se montaba sobre "Colillas" y "Cafés", y "Cada urgencia tardó
// 51 min desde que llegó" quedaba apretado en una columna angosta.
//
// El peor día: días anteriores con números largos en la tabla, y hoy el
// límite en 10 hasta las 17:05 y después en 3 (WIP 3–10), tres urgencias
// terminadas y una a medias, colillas y cafés de dos cifras y el tiempo por
// tarea más largo (más de 10 horas). Se revisa dos veces: a las 17:10, con el
// día andando, y al terminar el día, con el resumen y la tabla.
//
// En cada vista (Control, Control con el panel escondido, la vista grande y el
// celular con sus tres pestañas), en cada tamaño y en los dos idiomas, mira
// cada texto que se ve y falla si:
//  - se sale de su cuadro (el primer contenedor con fondo o borde),
//  - queda cortado por un contenedor que esconde lo que sobra,
//  - se monta sobre otro texto,
//  - o si dos cuadros que flotan sobre la oficina se montan entre sí.
//
// Uso: node scripts/probar-desbordes.mjs [dirección]
//   con npm run dev (usa window.__mosca, que solo existe ahí).
//   NAVEGADOR=webkit usa el motor de Safari. SOLO=1906,celular revisa solo los
//   tamaños cuyo nombre lleve eso. FOTOS=<carpeta> deja una foto de cada caso.
// Debe decir "desbordes: todo bien".
import { chromium, webkit } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:5173/').replace(/\/?$/, '/');
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const ES_WEBKIT = process.env.NAVEGADOR === 'webkit';
const FOTOS = process.env.FOTOS || '';
if (FOTOS) mkdirSync(FOTOS, { recursive: true });

// [nombre, ancho, alto, celular]
const TAMANOS = [
  ['1280x720', 1280, 720, false],
  ['1366x768', 1366, 768, false],
  ['1440x900', 1440, 900, false],
  ['macbook-felipe-1512x860', 1512, 860, false],
  ['ventana-felipe-1906x837', 1906, 837, false],
  ['1920x840', 1920, 840, false],
  ['1920x1080', 1920, 1080, false],
  ['2560x1440', 2560, 1440, false],
  ['celular-375x667', 375, 667, true],
  ['celular-393x852', 393, 852, true],
  ['iphone-felipe-430x932', 430, 932, true],
  ['android-412x915', 412, 915, true],
  ['celular-acostado-932x430', 932, 430, true],
  ['tablet-820x1180', 820, 1180, true],
];
const SOLO = process.env.SOLO ? process.env.SOLO.split(',') : null;
const CASOS = SOLO ? TAMANOS.filter(([n]) => SOLO.some((s) => n.includes(s))) : TAMANOS;

// Días anteriores, con los números más largos que puede haber en la tabla
const DIAS_ANTES = [
  { wip: 9, hechas: 9, colillas: 15, cafes: 0, tiempoPorTarea: 634, eficiencia: 23, estresMax: 100, hechasNormales: 9, urgencias: 0, tiempoPorTareaNormales: 634, urgenciasTardaron: null, urgenciasSinTerminar: 0 },
  { wip: '10–2', hechas: 14, colillas: 12, cafes: 10, tiempoPorTarea: 590, eficiencia: 31, estresMax: 100, hechasNormales: 11, urgencias: 3, tiempoPorTareaNormales: 634, urgenciasTardaron: 58, urgenciasSinTerminar: 1 },
  { wip: 2, hechas: 18, colillas: 0, cafes: 6, tiempoPorTarea: 60, eficiencia: 50, estresMax: 18, hechasNormales: 18, urgencias: 0, tiempoPorTareaNormales: 60, urgenciasTardaron: null, urgenciasSinTerminar: 0 },
  { wip: '3–10', hechas: 15, colillas: 13, cafes: 11, tiempoPorTarea: 600, eficiencia: 28, estresMax: 100, hechasNormales: 12, urgencias: 3, tiempoPorTareaNormales: 634, urgenciasTardaron: 51, urgenciasSinTerminar: 1 },
];

let fallas = 0;
const vistos = new Set();
function revisar(bien, mensaje) {
  if (bien) return;
  fallas++;
  // (el mismo problema en varios momentos se cuenta una vez por caso)
  if (vistos.has(mensaje)) return;
  vistos.add(mensaje);
  console.log(`  FALLA  ${mensaje}`);
}

const navegador = ES_WEBKIT ? await webkit.launch() : await chromium.launch();

// El día hasta las 17:10: límite 10, tres urgencias terminadas, y a las 17:05
// el límite baja a 3 (lo empezado sigue abierto: "Terminando lo empezado")
async function armarHasta1710(pagina) {
  return pagina.evaluate(async () => {
    const M = window.__mosca;
    const cuadro = () => new Promise((r) => requestAnimationFrame(() => r()));
    const minuto = () => {
      const [h, m] = M.estado().hora.split(':').map(Number);
      return h * 60 + m;
    };
    const libre = () => {
      const u = M.estado().urgencias;
      return u.enCurso === 0 && u.esperando === 0;
    };
    M.diaExhibicion(10);
    await cuadro();
    M.empezar();
    M.pausar(true);
    await cuadro();
    M.adelantar(25);
    for (let i = 0; i < 3; i++) {
      M.mandarUrgencia();
      await cuadro();
      for (let k = 0; k < 60 && !libre(); k++) M.adelantar(5);
      M.adelantar(20);
      await cuadro();
    }
    if (minuto() < 17 * 60 + 5) M.adelantar(17 * 60 + 5 - minuto());
    M.setWip(3);
    M.adelantar(5);
    M.forzar({ colillas: 14, cafes: 12 });
    for (let i = 0; i < 4; i++) await cuadro();
    const e = M.estado();
    return { hora: e.hora, wip: e.wip, enCurso: e.enCurso, terminadas: e.urgencias.terminadas };
  });
}

// El cierre: una urgencia que no alcanza a terminar, y el día completo
async function terminarDia(pagina) {
  return pagina.evaluate(async () => {
    const M = window.__mosca;
    const cuadro = () => new Promise((r) => requestAnimationFrame(() => r()));
    const minuto = () => {
      const [h, m] = M.estado().hora.split(':').map(Number);
      return h * 60 + m;
    };
    const libre = () => {
      const u = M.estado().urgencias;
      return u.enCurso === 0 && u.esperando === 0;
    };
    for (let k = 0; k < 20 && !libre(); k++) M.adelantar(3);
    if (minuto() < 17 * 60 + 52) M.adelantar(17 * 60 + 52 - minuto());
    M.mandarUrgencia();
    await cuadro();
    M.forzar({ colillas: 14, cafes: 12 });
    M.completarDia();
    for (let i = 0; i < 6; i++) await cuadro();
    const e = M.estado();
    return {
      terminado: e.terminado,
      normales: e.hechasNormales,
      urgencias: e.urgencias.terminadas,
      aMedias: e.urgencias.llegadas - e.urgencias.terminadas,
      colillas: e.colillas,
      cafes: e.cafes,
      tiempo: Math.round(e.tiempoPorTareaNormales),
    };
  });
}

// Lo que mira en la página: cada texto que se ve, su cuadro, lo que lo corta
// y si se monta sobre otro
const medir = (pagina) =>
  pagina.evaluate(() => {
    const problemas = [];
    const describir = (el) => {
      if (!el || el === document.body) return 'body';
      const id = el.id ? `#${el.id}` : '';
      const clases = [...el.classList].slice(0, 2).map((c) => `.${c}`).join('');
      return `${el.tagName.toLowerCase()}${id}${clases}`;
    };
    const seVe = (el) => {
      if (el.checkVisibility) return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true });
      for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      }
      return true;
    };
    const transparente = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0(\.0+)?\)$/.test(c);
    // El cuadro de un texto: el primer contenedor con fondo, borde o sombra
    const esCuadro = (el) => {
      const cs = getComputedStyle(el);
      if (!transparente(cs.backgroundColor) || cs.backgroundImage !== 'none') return true;
      if (cs.boxShadow !== 'none') return true;
      return ['Top', 'Right', 'Bottom', 'Left'].some((l) => parseFloat(cs[`border${l}Width`]) > 0 && !transparente(cs[`border${l}Color`]));
    };
    const textos = [];
    const caminar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    for (let n = caminar.nextNode(); n; n = caminar.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest('script, style, noscript, template, svg, canvas, title, [aria-hidden="true"][hidden]')) continue;
      if (!seVe(el)) continue;
      const caja = el.getBoundingClientRect();
      // (los textos solo para lectores de pantalla miden 1 px)
      if (caja.width <= 2 || caja.height <= 2) continue;
      const rango = document.createRange();
      rango.selectNodeContents(n);
      const rects = [...rango.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
      if (!rects.length) continue;
      const texto = n.textContent.replace(/\s+/g, ' ').trim().slice(0, 48);
      // Lo que se ve de cada línea: fuera de la pantalla, o fuera de un
      // contenedor que se desliza (una lista que se baja con el dedo), no se
      // revisa, porque se ve al deslizar. Lo que un contenedor que no se
      // desliza deja afuera queda cortado: eso sí es un problema
      const aLaVista = [];
      let cortadoPor = null;
      for (const r of rects) {
        if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
        let seVeEntera = true;
        for (let e = el; e && e !== document.body; e = e.parentElement) {
          const cs = getComputedStyle(e);
          if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
          const c = e.getBoundingClientRect();
          const holguraV = 2 + r.height * 0.2;
          const fueraX = r.left < c.left - 1 || r.right > c.right + 1;
          const fueraY = r.top < c.top - holguraV || r.bottom > c.bottom + holguraV;
          const deslizaX = cs.overflowX === 'auto' || cs.overflowX === 'scroll';
          const deslizaY = cs.overflowY === 'auto' || cs.overflowY === 'scroll';
          if ((fueraX && cs.overflowX !== 'visible' && !deslizaX) || (fueraY && (cs.overflowY === 'hidden' || cs.overflowY === 'clip'))) {
            cortadoPor = cortadoPor || e;
            seVeEntera = false;
            break;
          }
          if ((fueraX && deslizaX) || (fueraY && deslizaY)) {
            seVeEntera = false;
            break;
          }
        }
        if (seVeEntera) aLaVista.push(r);
      }
      if (cortadoPor) textos.push({ n, el, texto, rects: [], cortadoPor });
      else if (aLaVista.length) textos.push({ n, el, texto, rects: aLaVista });
    }
    for (const t of textos) {
      // 1. dentro de su cuadro (con tolerancia por el aire de las letras)
      let cuadro = null;
      for (let e = t.el; e && e !== document.body; e = e.parentElement) {
        if (esCuadro(e)) {
          cuadro = e;
          break;
        }
      }
      if (cuadro) {
        const c = cuadro.getBoundingClientRect();
        for (const r of t.rects) {
          const holguraV = 2 + r.height * 0.2;
          if (r.left < c.left - 1.5 || r.right > c.right + 1.5 || r.top < c.top - holguraV || r.bottom > c.bottom + holguraV) {
            problemas.push({ tipo: 'sale', texto: t.texto, donde: describir(t.el), cuadro: describir(cuadro), r: [r.left, r.top, r.right, r.bottom].map(Math.round), c: [c.left, c.top, c.right, c.bottom].map(Math.round) });
            break;
          }
        }
      }
      // 2. cortado por un contenedor que esconde lo que sobra
      if (t.cortadoPor) problemas.push({ tipo: 'cortado', texto: t.texto, donde: describir(t.el), por: describir(t.cortadoPor) });
      if (t.el.scrollWidth > t.el.clientWidth + 1 && getComputedStyle(t.el).textOverflow === 'ellipsis') {
        problemas.push({ tipo: 'cortado', texto: t.texto, donde: describir(t.el), por: 'puntos suspensivos' });
      }
    }
    // 3. textos montados (se mira el centro de cada línea, sin el aire de las letras)
    const nucleo = (r) => ({ l: r.left + 1, r: r.right - 1, t: r.top + r.height * 0.22, b: r.bottom - r.height * 0.22 });
    for (let i = 0; i < textos.length; i++) {
      for (let j = i + 1; j < textos.length; j++) {
        const a = textos[i];
        const b = textos[j];
        let choca = false;
        for (const ra of a.rects) {
          const x = nucleo(ra);
          for (const rb of b.rects) {
            const y = nucleo(rb);
            if (Math.min(x.r, y.r) - Math.max(x.l, y.l) > 1.5 && Math.min(x.b, y.b) - Math.max(x.t, y.t) > 1.5) choca = true;
          }
        }
        if (choca) problemas.push({ tipo: 'montados', texto: `«${a.texto}» y «${b.texto}»`, donde: `${describir(a.el)} y ${describir(b.el)}` });
      }
    }
    // 4. cuadros que flotan sobre la oficina, montados entre sí
    const flotantes = [...document.querySelectorAll('body *')].filter((el) => {
      if (el.closest('svg, canvas') || !seVe(el)) return false;
      const cs = getComputedStyle(el);
      if (cs.position !== 'absolute' && cs.position !== 'fixed') return false;
      if (!esCuadro(el)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && el.textContent.trim();
    });
    for (let i = 0; i < flotantes.length; i++) {
      for (let j = i + 1; j < flotantes.length; j++) {
        const a = flotantes[i];
        const b = flotantes[j];
        if (a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const ancho = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const alto = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        // (si uno se está desvaneciendo, lo dice: así se distingue un cambio de vista a medias de un choque de verdad)
        const op = (el) => (parseFloat(getComputedStyle(el).opacity) < 1 ? ` (opacidad ${parseFloat(getComputedStyle(el).opacity).toFixed(2)})` : '');
        if (ancho > 2 && alto > 2) problemas.push({ tipo: 'cuadros', texto: `${Math.round(ancho)} × ${Math.round(alto)} px`, donde: `${describir(a)}${op(a)} y ${describir(b)}${op(b)}` });
      }
    }
    // 5. una tabla o un cuadro que hay que deslizar hacia el lado para leerlo entero
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') continue;
      if (!seVe(el) || !el.textContent.trim()) continue;
      const sobra = el.scrollWidth - el.clientWidth;
      if (sobra > 4) problemas.push({ tipo: 'desliza', texto: `${sobra} px`, donde: describir(el) });
    }
    const transiciones = document.getAnimations().filter((a) => 'transitionProperty' in a && a.playState === 'running').map((a) => `${describir(a.effect?.target ?? document.body)} ${a.transitionProperty}`);
    return { problemas, transiciones, textos: textos.length, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });

async function revisarMomento(pagina, etiqueta, foto) {
  await pagina.waitForTimeout(250);
  // Espera a que terminen las transiciones (hasta 5 s). Con el computador
  // ocupado y la oficina en 2560 × 1440, el botón de idioma que se desvanece al
  // volver de la vista grande todavía se veía al medir, encima del cerebro, y
  // la prueba lo contaba como un choque (14 de noviembre, con un juego abierto)
  await pagina
    .waitForFunction(() => !document.getAnimations().some((a) => 'transitionProperty' in a && a.playState === 'running'), null, { timeout: 5000 })
    .catch(() => {});
  const m = await medir(pagina);
  revisar(m.textos > 10, `${etiqueta}: casi no hay textos a la vista (${m.textos})`);
  revisar(m.desborde <= 0, `${etiqueta}: la página se sale ${m.desborde} px hacia el lado`);
  for (const p of m.problemas) {
    const que =
      p.tipo === 'sale'
        ? `«${p.texto}» se sale de su cuadro (${p.donde} en ${p.cuadro}; texto ${p.r.join(',')}, cuadro ${p.c.join(',')})`
        : p.tipo === 'cortado'
          ? `«${p.texto}» queda cortado (${p.donde}, lo corta ${p.por})`
          : p.tipo === 'montados'
            ? `se montan ${p.texto} (${p.donde})`
            : p.tipo === 'desliza'
              ? `hay que deslizar ${p.donde} ${p.texto} hacia el lado para leerlo entero`
              : `dos cuadros se montan ${p.texto} (${p.donde})`;
    revisar(false, `${etiqueta}: ${que}${m.transiciones.length ? ` [transiciones a medio camino: ${m.transiciones.slice(0, 4).join(', ')}]` : ''}`);
  }
  if (FOTOS && foto) await pagina.screenshot({ path: `${FOTOS}/${foto}.png` });
}

async function cambiarVista(pagina, vista, panelEscondido = false) {
  await pagina.evaluate(
    ({ vista, panelEscondido }) => {
      window.__mosca.vista(vista);
      window.__mosca.ocultarControles(panelEscondido);
    },
    { vista, panelEscondido },
  );
  await pagina.waitForTimeout(1100);
}

for (const [nombre, ancho, alto, celular] of CASOS) {
  for (const idioma of ['es', 'en']) {
    const contexto = await navegador.newContext({
      viewport: { width: ancho, height: alto },
      deviceScaleFactor: celular ? 2 : 1,
      isMobile: celular,
      hasTouch: celular,
    });
    await contexto.addInitScript((dias) => {
      try {
        localStorage.setItem('mosca-del-wip-dias', JSON.stringify(dias));
        localStorage.setItem('mosca-del-wip-recorrido-visto', '1');
        localStorage.removeItem('mosca-del-wip-controles-oculto');
        localStorage.removeItem('mosca-del-wip-cerebro-oculto');
      } catch {}
    }, DIAS_ANTES);
    if (LOCAL) await contexto.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    const pagina = await contexto.newPage();
    const errores = [];
    pagina.on('pageerror', (e) => errores.push(e.message));
    await pagina.goto(`${BASE}jugar/${idioma === 'en' ? '?lang=en' : ''}`, { waitUntil: 'load' });
    const listo = await pagina.waitForFunction(() => window.__mosca?.estado, null, { timeout: 30000 }).then(() => true, () => false);
    if (!listo) {
      revisar(false, `${nombre} ${idioma}: el juego no cargó (¿npm run dev encendido? window.__mosca solo existe ahí)`);
      await contexto.close();
      continue;
    }
    const esCel = await pagina.evaluate(() => window.__mosca.celular().activo);
    const caso = `${nombre} ${idioma}`;
    console.log(`${caso}${esCel ? ' (celular)' : ''}`);

    const tarde = await armarHasta1710(pagina);
    revisar(tarde.wip === 3 && tarde.terminadas === 3 && tarde.enCurso > 3, `${caso}: no se armó el día de prueba (${JSON.stringify(tarde)})`);
    if (esCel) {
      await revisarMomento(pagina, `${caso} · celular a las 17:10`, `${nombre}-${idioma}-1-tarde`);
    } else {
      await cambiarVista(pagina, 'control');
      await revisarMomento(pagina, `${caso} · Control a las 17:10`, `${nombre}-${idioma}-1-control-tarde`);
      await cambiarVista(pagina, 'exhibicion');
      await revisarMomento(pagina, `${caso} · vista grande a las 17:10`, `${nombre}-${idioma}-2-grande-tarde`);
    }

    const fin = await terminarDia(pagina);
    revisar(fin.terminado && fin.urgencias === 3 && fin.aMedias === 1 && fin.colillas >= 10 && fin.cafes >= 10 && fin.tiempo >= 600, `${caso}: el día de prueba no quedó como el peor día (${JSON.stringify(fin)})`);
    if (esCel) {
      await pagina.waitForTimeout(900);
      await revisarMomento(pagina, `${caso} · celular, fin del día`, `${nombre}-${idioma}-3-fin`);
      for (const pestana of ['cerebro', 'dias']) {
        const hay = await pagina.locator(`#cel-pestana-${pestana}`).isVisible().catch(() => false);
        if (!hay) continue;
        await pagina.locator(`#cel-pestana-${pestana}`).click();
        await pagina.waitForTimeout(900);
        await revisarMomento(pagina, `${caso} · celular, pestaña ${pestana}`, `${nombre}-${idioma}-4-${pestana}`);
      }
    } else {
      await cambiarVista(pagina, 'exhibicion');
      await revisarMomento(pagina, `${caso} · vista grande, resumen del día`, `${nombre}-${idioma}-3-grande-fin`);
      // las cifras del resumen: el número grande son las normales y abajo las urgencias
      const cifras = await pagina.evaluate(() => ({
        hechas: document.getElementById('cf-hechas').textContent.trim(),
        urgencias: document.getElementById('cf-urgencias').textContent.replace(/\s+/g, ' ').trim(),
        tardaron: document.getElementById('cf-tardaron')?.textContent.trim() ?? '',
      }));
      revisar(cifras.hechas === String(fin.normales), `${caso}: en "Terminadas" el número grande debía ser ${fin.normales} (las normales) y dice «${cifras.hechas}»`);
      const esperado = idioma === 'es' ? `+ 3 urgencias · 1 a medias` : `+ 3 urgent · 1 unfinished`;
      revisar(cifras.urgencias === esperado, `${caso}: bajo "Terminadas" debía decir «${esperado}» y dice «${cifras.urgencias}»`);
      revisar(cifras.tardaron && /\d+ min/.test(cifras.tardaron), `${caso}: falta cuánto tardó cada urgencia bajo "Tiempo por tarea" («${cifras.tardaron}»)`);
      await cambiarVista(pagina, 'control');
      await revisarMomento(pagina, `${caso} · Control, fin del día`, `${nombre}-${idioma}-4-control-fin`);
      await cambiarVista(pagina, 'control', true);
      await revisarMomento(pagina, `${caso} · Control con el panel escondido, fin del día`, `${nombre}-${idioma}-5-control-sin-panel`);
    }
    revisar(errores.length === 0, `${caso}: errores en la página ${errores.slice(0, 2).join(' | ')}`);
    await contexto.close();
  }
}
await navegador.close();
console.log('');
console.log(fallas ? `desbordes: ${fallas} cosas por revisar` : 'desbordes: todo bien');
process.exit(fallas ? 1 : 0);
