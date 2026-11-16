// Prueba el dibujo del inicio de la portada: "¿Te suena?" (Etapa 8.13,
// 2026-11-14). Felipe vio seis propuestas del inicio, eligió esta y pidió que
// se repita sola (sin el botón "Ver de nuevo") y con más pedidos. Después sacó
// también el botón de pausa: "que sea un loop que siempre se repita".
// Revisa, en español y en inglés:
//  1. en el inicio hay un solo dibujo: no queda ninguna de las otras
//     propuestas, ni la barrita para cambiar, ni ?portada= hace algo;
//  2. parte solo: los pedidos llegan de a uno, en desorden, y la mosca pasa de
//     tranquila a apurada y a colapsada; cuando están todos se quedan un rato,
//     se van, la mosca vuelve a estar tranquila y empieza otra vuelta sola, en
//     otro orden;
//  3. no tiene botones (ni "Ver de nuevo" ni pausa) y un clic en el dibujo no
//     lo detiene;
//  4. se detiene cuando sale de la pantalla y sigue al volver;
//  5. nada cambia de tamaño mientras se mueve;
//  6. con "reducir movimiento" no se mueve nada y sin JavaScript se ve quieto,
//     con todos los pedidos y la mosca al final;
//  7. a 21 anchos de pantalla se ven 14, 10 u 8 pedidos según el ancho de la
//     lámina, ninguno se sale de ella y no hay desborde hacia el lado;
//  8. en el computador la lámina cabe entera en la primera pantalla (también
//     en la ventana de Felipe, 1906 × 830), y en celular y tablet los pedidos
//     y la mosca caben juntos bajo la barra;
//  9. que no haya errores en la consola;
// 10. el cerebro en 3D, que desde la 8.13 vive en "¿Por qué una mosca?", no se
//     baja al entrar: se pide al acercarse a su sección, se enciende, y su
//     consola sube sola de 2 a 10 cuando ya se ve.
// Desde la 8.14 (2026-11-14), la primera pantalla del celular:
// 11. mientras el dibujo espera a verse (o carga) muestra la escena completa y
//     quieta, nunca una caja vacía. Cuando se ve, se queda un momento, los
//     pedidos se van y vuelven a llegar de a uno;
// 12. en celulares (también con las barras de Safari a la vista y acostados)
//     la primera pantalla es el título, la bajada y Jugar: el rótulo chico no
//     está y el dibujo empieza justo después, sin asomarse. En las tablets
//     altas el dibujo cabe entero junto al texto, y en las otras va después.
//     En el computador el rótulo sigue y la flecha no se ve;
// 13. la flecha chica lleva al dibujo y ahí se mueve de verdad (con
//     NAVEGADOR=webkit, en el motor de Safari).
// Uso: node scripts/probar-suena.mjs [dirección]   (con npm run dev, con
// npx vite preview o la dirección publicada; NAVEGADOR=webkit usa el motor de
// Safari). Debe decir "dibujo del inicio: todo bien".
import { chromium, webkit } from 'playwright';

const BASE = (process.argv[2] || 'http://localhost:5173/').replace(/\/?$/, '/');
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const ES_WEBKIT = process.env.NAVEGADOR === 'webkit';

const TEXTOS = {
  es: {
    ruta: '',
    titulo: 'Un día cualquiera en la oficina',
    deNuevo: /ver de nuevo/i,
    lista: 'Lo que le piden a la mosca',
    pie: 'Todo urgente, todo empezado. ¿Te suena?',
    pedidos: [
      '¿Tienes un minuto?', 'Es urgente', '¿Cómo va lo mío?', 'Esto es para hoy', 'Una cosita rápida', '¿Lo viste?', 'También es urgente',
      '¿Y lo de ayer?', '¿Te llegó mi correo?', 'Lo necesito ya', 'Te sumé a una reunión', 'Solo una pregunta', '¿Me ayudas con esto?', '¿Puedes verlo ahora?',
    ],
  },
  en: {
    ruta: 'en/',
    titulo: 'Any day at the office',
    deNuevo: /watch again/i,
    lista: 'What people ask the fly for',
    pie: 'Everything urgent, everything started. Sound familiar?',
    pedidos: [
      'Got a minute?', 'It’s urgent', 'Any update on mine?', 'I need this today', 'One quick thing', 'Did you see it?', 'This is urgent too',
      'What about yesterday’s?', 'Did you get my email?', 'I need it now', 'I added you to a meeting', 'Quick question', 'Can you help me with this?', 'Can you look at it now?',
    ],
  },
};
const ANCHOS = [320, 344, 360, 375, 390, 414, 430, 480, 540, 600, 768, 820, 899, 900, 960, 1024, 1100, 1280, 1440, 1920, 2560];
// La primera pantalla en celulares y tablets (8.14): nombre, ancho, alto y qué
// se espera. "celular" y "acostado" = el dibujo empieza justo después de la
// primera pantalla; "tablet-alta" = el texto y el dibujo entero en la primera
// pantalla; "tablet" = el dibujo después; "computador" = como siempre. Los
// altos "barras" son los de Safari con sus barras a la vista
const PRIMERA = [
  ['iphone-se', 375, 667, 'celular'], ['iphone-se-barras', 375, 548, 'celular'],
  ['iphone-15', 393, 852, 'celular'], ['iphone-15-barras', 393, 659, 'celular'],
  ['iphone-felipe', 430, 932, 'celular'], ['iphone-felipe-barras', 430, 739, 'celular'],
  ['android', 412, 915, 'celular'], ['android-chico', 360, 640, 'celular'],
  ['acostado', 852, 393, 'acostado'], ['acostado-grande', 932, 430, 'acostado'],
  ['tablet', 820, 1180, 'tablet-alta'], ['tablet-barras', 820, 1106, 'tablet-alta'],
  ['tablet-768', 768, 1024, 'tablet'], ['tablet-600', 600, 960, 'tablet'],
  ['computador', 1440, 900, 'computador'], ['macbook-felipe', 1512, 860, 'computador'], ['ventana-felipe', 1906, 837, 'computador'],
];
// Pantallas donde el dibujo tiene que caber (ancho, alto, táctil)
const ENTERAS = [
  [320, 568, true], [360, 800, true], [375, 667, true], [390, 844, true], [430, 932, true], [768, 1024, true],
  [1280, 720, false], [1366, 768, false], [1440, 900, false], [1536, 864, false], [1906, 830, false], [1920, 1080, false],
];

let fallas = 0;
function revisar(bien, mensaje) {
  if (bien) return;
  fallas++;
  console.log(`  FALLA  ${mensaje}`);
}

const navegador = ES_WEBKIT ? await webkit.launch() : await chromium.launch();

async function abrir(ruta, opciones = {}) {
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, ...opciones });
  // (el contador de visitas solo existe en Vercel)
  if (LOCAL) await contexto.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  const pagina = await contexto.newPage();
  const errores = [];
  const pedidos = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  pagina.on('request', (r) => pedidos.push(r.url()));
  await pagina.goto(BASE + ruta, { waitUntil: 'load' });
  return { contexto, pagina, errores, pedidos };
}

// Lo que se ve del dibujo en este instante
const mirar = (pagina) =>
  pagina.evaluate(() => {
    const raiz = document.querySelector('.suena');
    const visibles = [...raiz.querySelectorAll('[data-globo]')].filter((g) => getComputedStyle(g).display !== 'none');
    return {
      estado: raiz.dataset.estado,
      animo: raiz.dataset.animo,
      llegaron: visibles.filter((g) => g.classList.contains('llego')).length,
      cuantos: visibles.length,
      vuelta: window.__mosca?.suena?.vuelta() ?? -1,
    };
  });

// Anota lo que pasa en el dibujo, cada 50 ms, hasta que se le pida
async function anotar(pagina) {
  await pagina.evaluate(() => {
    const raiz = document.querySelector('.suena');
    const todos = [...raiz.querySelectorAll('[data-globo]')];
    window.__muestras = [];
    window.__anotador = setInterval(() => {
      const visibles = todos.filter((g) => getComputedStyle(g).display !== 'none');
      window.__muestras.push({
        t: performance.now(),
        estado: raiz.dataset.estado,
        animo: raiz.dataset.animo,
        llegados: visibles.map((g, i) => (g.classList.contains('llego') ? i : -1)).filter((i) => i >= 0),
        cuantos: visibles.length,
        vuelta: window.__mosca.suena.vuelta(),
        alto: raiz.getBoundingClientRect().height,
        ancho: raiz.getBoundingClientRect().width,
      });
    }, 50);
  });
}
const leerNotas = (pagina) =>
  pagina.evaluate(() => {
    clearInterval(window.__anotador);
    return window.__muestras;
  });

async function probarIdioma(idioma) {
  const T = TEXTOS[idioma];
  console.log(idioma === 'es' ? 'Español' : 'Inglés');

  // ---------- 1. Un solo dibujo, sin restos de las propuestas ----------
  {
    const { contexto, pagina, errores } = await abrir(`${T.ruta}?portada=2`);
    const hay = await pagina.evaluate(() => ({
      escenas: document.querySelectorAll('.hero .escena').length,
      laminas: document.querySelectorAll('.hero .lamina').length,
      suena: !!document.querySelector('.hero .lamina.suena'),
      barrita: !!document.querySelector('.opciones'),
      opciones: document.querySelectorAll('[data-opcion]').length,
      marca: document.documentElement.hasAttribute('data-portada'),
      restos: ['.jornada', '.carrera', '.escritorio', '.cuenta', '.minuto'].filter((s) => document.querySelector(s)),
      titulo: document.querySelector('#t-suena')?.textContent.trim(),
      pie: document.querySelector('.suena .lamina-pie')?.textContent.trim(),
      lista: document.querySelector('.suena .globos')?.getAttribute('aria-label'),
      pedidos: [...document.querySelectorAll('.suena [data-globo]')].map((g) => g.textContent.trim()),
      textoInicio: document.querySelector('.hero').textContent,
      // (sin botones: ni "Ver de nuevo" ni pausa, ni nada que se pueda apretar)
      botones: document.querySelectorAll('.escena :is(button, a, input, [tabindex], [role="button"], [data-pausa])').length,
    }));
    revisar(hay.escenas === 1 && hay.laminas === 1 && hay.suena, `en el inicio debía haber un solo dibujo y hay ${hay.escenas} escenas y ${hay.laminas} láminas`);
    revisar(!hay.barrita && hay.opciones === 0 && !hay.marca, `quedan restos de las propuestas (barrita ${hay.barrita}, data-opcion ${hay.opciones}, data-portada ${hay.marca})`);
    revisar(hay.restos.length === 0, `quedan dibujos de otras propuestas: ${hay.restos.join(', ')}`);
    revisar(hay.titulo === T.titulo, `el título del dibujo dice "${hay.titulo}"`);
    revisar(hay.pie === T.pie, `la frase de abajo dice "${hay.pie}"`);
    revisar(hay.lista === T.lista, `la lista se llama "${hay.lista}"`);
    revisar(JSON.stringify(hay.pedidos) === JSON.stringify(T.pedidos), `los pedidos no son los esperados: ${hay.pedidos.join(' | ')}`);
    revisar(!T.deNuevo.test(hay.textoInicio), 'en el inicio todavía dice "Ver de nuevo"');
    revisar(hay.botones === 0, `el dibujo tiene ${hay.botones} botones y no debía tener ninguno`);
    revisar(!/[:;—–]/.test(hay.pedidos.join(' ') + hay.pie + hay.titulo), 'hay dos puntos, punto y coma o rayas en los textos del dibujo');
    revisar(errores.length === 0, `errores al abrir: ${errores.join(' | ')}`);
    await contexto.close();
  }

  // ---------- 2 a 5. Computador: se repite solo, sin botones, y se detiene fuera de la pantalla ----------
  {
    const { contexto, pagina, errores } = await abrir(T.ruta);
    await pagina.waitForFunction(() => window.__mosca?.suena, null, { timeout: 15000 });
    await anotar(pagina);
    // dos vueltas: la primera completa y el comienzo de la segunda
    await pagina.waitForFunction(() => window.__mosca.suena.vuelta() >= 1 && window.__mosca.suena.llegaron() >= 3, null, { timeout: 40000 }).catch(() => {});
    const notas = await leerNotas(pagina);
    const N = notas.at(-1)?.cuantos ?? 0;
    revisar(N === 14, `en el computador debían verse 14 pedidos y se ven ${N}`);
    // (desde la 8.14 la primera vuelta parte con la escena completa, que se
    // queda un momento y se va: se mide desde que no queda ningún pedido)
    const vuelta0 = notas.filter((m) => m.vuelta === 0);
    const vaciaEn = vuelta0.findIndex((m) => m.llegados.length === 0);
    const primera = vaciaEn >= 0 ? vuelta0.slice(vaciaEn) : [];
    const segunda = notas.filter((m) => m.vuelta === 1);
    revisar(vaciaEn >= 0, 'en la primera vuelta la escena completa nunca se fue');
    revisar(primera.length > 0 && segunda.length > 0, 'el dibujo no llegó a dar una vuelta y empezar otra solo');
    if (primera.length && segunda.length) {
      // llegan de a uno y ninguno se va antes de tiempo
      let antes = 0;
      let deAUno = true;
      for (const m of primera) {
        if (m.llegados.length < antes || m.llegados.length - antes > 2) deAUno = false;
        antes = m.llegados.length;
      }
      revisar(deAUno, 'en la primera vuelta los pedidos no llegaron de a uno');
      const llenas = primera.filter((m) => m.llegados.length === N);
      revisar(llenas.length > 0, `en la primera vuelta no llegaron los ${N} pedidos`);
      if (llenas.length) {
        const empieza = primera.find((m) => m.llegados.length >= 1).t;
        const llegada = (llenas[0].t - empieza) / 1000;
        const quedan = (llenas.at(-1).t - llenas[0].t) / 1000;
        revisar(llegada > 3 && llegada < 8, `los pedidos tardan ${llegada.toFixed(1)} s en llegar (debía ser entre 3 y 8)`);
        revisar(quedan >= 2.4, `con todos a la vista se quedan ${quedan.toFixed(1)} s (debía ser al menos 2,4)`);
      }
      // el orden: no de izquierda a derecha
      const orden = [];
      for (const m of primera) for (const i of m.llegados) if (!orden.includes(i)) orden.push(i);
      revisar(orden.join() !== [...orden].sort((a, b) => a - b).join(), `los pedidos llegaron en el orden de la lista (${orden.join(' ')})`);
      // la cara
      const animos = [];
      for (const m of primera) if (animos.at(-1) !== m.animo) animos.push(m.animo);
      revisar(animos.join(' ') === 'tranquila apurada colapsada', `en la primera vuelta la mosca pasó por "${animos.join(' ')}"`);
      // al irse: nadie queda y la mosca respira
      const vacia = segunda.find((m) => m.llegados.length === 0);
      revisar(!!vacia && vacia.animo === 'tranquila', 'al irse los pedidos la mosca no volvió a estar tranquila');
      // la segunda vuelta parte por otro pedido
      const primero2 = segunda.find((m) => m.llegados.length === 1)?.llegados[0];
      revisar(primero2 != null && primero2 !== orden[0], `la segunda vuelta empezó por el mismo pedido que la primera (${orden[0]})`);
      // nada cambia de tamaño
      const altos = notas.map((m) => m.alto);
      const anchos = notas.map((m) => m.ancho);
      revisar(Math.max(...altos) - Math.min(...altos) < 0.6 && Math.max(...anchos) - Math.min(...anchos) < 0.6, `la lámina cambia de tamaño mientras se mueve (alto de ${Math.min(...altos).toFixed(1)} a ${Math.max(...altos).toFixed(1)})`);
      // (las primeras notas pueden ser de antes de partir: "por-partir")
      const desdeQuePartio = notas.slice(notas.findIndex((m) => m.estado === 'andando'));
      revisar(desdeQuePartio.length > 0 && desdeQuePartio.every((m) => m.estado === 'andando'), `el dibujo se detuvo solo (pasó por ${[...new Set(notas.map((m) => m.estado))].join(', ')})`);
    }

    // un clic en el dibujo no lo detiene: siempre se repite
    // (se espera hasta que cambie algo: con todos a la vista se quedan 3,2 s)
    await pagina.locator('.suena').click();
    const alClic = await mirar(pagina);
    const siguio = await pagina
      .waitForFunction((a) => window.__mosca.suena.llegaron() !== a.llegaron || window.__mosca.suena.vuelta() !== a.vuelta, alClic, { timeout: 6000 })
      .then(() => true, () => false);
    const trasClic = await mirar(pagina);
    revisar(siguio && trasClic.estado === 'andando', `después de un clic el dibujo quedó "${trasClic.estado}" y no siguió llegando nada`);

    // fuera de la pantalla se detiene, y sigue al volver
    await pagina.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await pagina.waitForTimeout(700);
    const fuera1 = await mirar(pagina);
    await pagina.waitForTimeout(1800);
    const fuera2 = await mirar(pagina);
    revisar(fuera1.llegaron === fuera2.llegaron && fuera1.vuelta === fuera2.vuelta, `fuera de la pantalla siguió moviéndose (de ${fuera1.llegaron} a ${fuera2.llegaron})`);
    await pagina.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await pagina.waitForTimeout(1900);
    const vuelve = await mirar(pagina);
    revisar(vuelve.llegaron !== fuera2.llegaron || vuelve.vuelta !== fuera2.vuelta, 'al volver a la vista no siguió');
    revisar(errores.length === 0, `errores en el computador: ${errores.join(' | ')}`);
    await contexto.close();
  }

  // ---------- 6. Reducir movimiento ----------
  {
    const { contexto, pagina, errores } = await abrir(T.ruta, { reducedMotion: 'reduce' });
    await pagina.waitForFunction(() => window.__mosca?.suena, null, { timeout: 15000 });
    await pagina.waitForTimeout(400);
    const a = await mirar(pagina);
    await pagina.waitForTimeout(1800);
    const b = await mirar(pagina);
    revisar(a.estado === 'quieta' && a.animo === 'colapsada' && a.llegaron === a.cuantos && a.cuantos === 14, `con "reducir movimiento" quedó ${JSON.stringify(a)}`);
    revisar(JSON.stringify(a) === JSON.stringify(b), 'con "reducir movimiento" algo se movió');
    const ve = await pagina.evaluate(() => ({
      opacos: [...document.querySelectorAll('.suena [data-globo]')].filter((g) => getComputedStyle(g).display !== 'none' && getComputedStyle(g).opacity !== '1').length,
    }));
    revisar(ve.opacos === 0, `con "reducir movimiento" hay ${ve.opacos} pedidos que no se ven`);
    revisar(errores.length === 0, `errores con "reducir movimiento": ${errores.join(' | ')}`);
    await contexto.close();
  }

  // ---------- 6. Sin JavaScript ----------
  {
    const { contexto, pagina } = await abrir(T.ruta, { javaScriptEnabled: false });
    const cajas = await pagina.locator('.suena [data-globo]').evaluateAll((globos) => globos.map((g) => ({ display: getComputedStyle(g).display, opacidad: getComputedStyle(g).opacity })));
    revisar(cajas.length === 14 && cajas.every((c) => c.display !== 'none' && c.opacidad === '1'), 'sin JavaScript no se ven los 14 pedidos');
    revisar((await pagina.locator('.suena').getAttribute('data-animo')) === 'colapsada', 'sin JavaScript la mosca no está al final');
    await contexto.close();
  }

  // ---------- 7. A 21 anchos ----------
  {
    const { contexto, pagina, errores } = await abrir(T.ruta);
    await pagina.waitForFunction(() => window.__mosca?.suena, null, { timeout: 15000 });
    for (const ancho of ANCHOS) {
      await pagina.setViewportSize({ width: ancho, height: 900 });
      await pagina.evaluate(() => window.__mosca.suena.mostrarCerrado());
      await pagina.waitForTimeout(120);
      const m = await pagina.evaluate(() => {
        const raiz = document.querySelector('.suena');
        const caja = raiz.getBoundingClientRect();
        const celda = raiz.querySelector('.suena-escena').getBoundingClientRect();
        const visibles = [...raiz.querySelectorAll('[data-globo]')].filter((g) => getComputedStyle(g).display !== 'none');
        const fuera = visibles.filter((g) => {
          const c = g.getBoundingClientRect();
          return c.left < caja.left - 0.5 || c.right > caja.right + 0.5 || c.top < celda.top - 0.5;
        }).length;
        const titulo = raiz.querySelector('.lamina-titulo');
        const pie = raiz.querySelector('.lamina-pie');
        return {
          ancho: caja.width,
          cuantos: visibles.length,
          fuera,
          desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          tituloCortado: titulo.scrollWidth > titulo.clientWidth + 1 || titulo.getBoundingClientRect().right > caja.right + 0.5,
          pieCortado: pie.scrollWidth > pie.clientWidth + 1,
          letra: Math.min(...visibles.map((g) => parseFloat(getComputedStyle(g).fontSize))),
          mosca: raiz.querySelector('.suena-dibujo').getBoundingClientRect().height,
          // (los ojos de la mosca: ningún pedido los puede tapar)
          tapan: (() => {
            const ojos = raiz.querySelector('.s-de-colapsada:not(.s-antenas)').getBoundingClientRect();
            return visibles.filter((g) => {
              const c = g.getBoundingClientRect();
              return c.bottom > ojos.top + 2 && c.right > ojos.left && c.left < ojos.right;
            }).length;
          })(),
          ojosFuera: (() => {
            const ojos = raiz.querySelector('.s-de-colapsada:not(.s-antenas)').getBoundingClientRect();
            return ojos.height < 8 || ojos.bottom > celda.bottom + 0.5 || ojos.top < celda.top;
          })(),
        };
      });
      const esperados = m.ancho <= 330 ? 8 : m.ancho <= 470 ? 10 : 14;
      revisar(m.cuantos === esperados, `a ${ancho} px (lámina de ${Math.round(m.ancho)}) se ven ${m.cuantos} pedidos y debían ser ${esperados}`);
      revisar(m.fuera === 0, `a ${ancho} px hay ${m.fuera} pedidos fuera de la lámina`);
      revisar(m.desborde <= 0, `a ${ancho} px la página se sale ${m.desborde} px hacia el lado`);
      revisar(!m.tituloCortado, `a ${ancho} px el título del dibujo se corta`);
      revisar(!m.pieCortado, `a ${ancho} px la frase de abajo se corta`);
      revisar(m.letra >= 12, `a ${ancho} px la letra de los pedidos mide ${m.letra} px`);
      revisar(m.mosca >= 90, `a ${ancho} px la mosca mide ${Math.round(m.mosca)} px de alto`);
      revisar(m.tapan === 0, `a ${ancho} px hay ${m.tapan} pedidos que tapan los ojos de la mosca`);
      revisar(!m.ojosFuera, `a ${ancho} px los ojos de la mosca no se ven enteros`);
    }
    revisar(errores.length === 0, `errores al cambiar de ancho: ${errores.join(' | ')}`);
    await contexto.close();
  }

  // ---------- 8. Cabe en la pantalla ----------
  // En el computador, la lámina entera en la primera pantalla. En pantallas
  // táctiles (celular y tablet) el dibujo va más abajo: ahí lo que tiene que
  // caber junto bajo la barra son los pedidos y la mosca
  for (const [ancho, alto, tactil] of ENTERAS) {
    const { contexto, pagina } = await abrir(T.ruta, { viewport: { width: ancho, height: alto }, hasTouch: tactil, deviceScaleFactor: tactil ? 2 : 1 });
    await pagina.waitForFunction(() => window.__mosca?.suena, null, { timeout: 15000 });
    await pagina.evaluate(() => window.__mosca.suena.mostrarCerrado());
    await pagina.waitForTimeout(150);
    const m = await pagina.evaluate(() => {
      const caja = document.querySelector('.suena').getBoundingClientRect();
      const celda = document.querySelector('.suena .suena-escena').getBoundingClientRect();
      const barra = document.querySelector('.barra')?.getBoundingClientRect().bottom ?? 0;
      return { arriba: caja.top, abajo: caja.bottom, alto: caja.height, celda: celda.height, barra, pantalla: innerHeight };
    });
    if (tactil) {
      revisar(m.celda <= m.pantalla - m.barra - 8, `en ${ancho} × ${alto} los pedidos y la mosca no caben juntos (miden ${Math.round(m.celda)} y hay ${Math.round(m.pantalla - m.barra)} px bajo la barra)`);
    } else {
      revisar(m.arriba >= m.barra - 1 && m.abajo <= m.pantalla + 1, `en ${ancho} × ${alto} la lámina no cabe entera en la primera pantalla (va de ${Math.round(m.arriba)} a ${Math.round(m.abajo)} y la pantalla mide ${m.pantalla})`);
    }
    await contexto.close();
  }

  // ---------- 11 a 13. La primera pantalla en el celular (8.14) ----------
  for (const [nombre, ancho, alto, tipo] of PRIMERA) {
    const tactil = tipo !== 'computador';
    const { contexto, pagina, errores } = await abrir(T.ruta, {
      viewport: { width: ancho, height: alto },
      hasTouch: tactil,
      isMobile: tactil,
      deviceScaleFactor: tactil ? 2 : 1,
    });
    await pagina.waitForFunction(() => window.__mosca?.suena, null, { timeout: 15000 });
    await pagina.waitForTimeout(600);
    const m = await pagina.evaluate(() => {
      const raiz = document.querySelector('.suena');
      const caja = raiz.getBoundingClientRect();
      const barra = document.querySelector('.barra')?.getBoundingClientRect().bottom ?? 0;
      const rotulo = document.querySelector('.hero .rotulo');
      const jugar = document.querySelector('.hero [data-jugar]').getBoundingClientRect();
      const h1 = document.querySelector('.hero h1').getBoundingClientRect();
      const flecha = document.querySelector('.hero .bajar');
      const fr = flecha?.getBoundingClientRect();
      const visibles = [...raiz.querySelectorAll('[data-globo]')].filter((g) => getComputedStyle(g).display !== 'none');
      return {
        arriba: caja.top,
        abajo: caja.bottom,
        barra,
        pantalla: innerHeight,
        rotulo: rotulo ? getComputedStyle(rotulo).display !== 'none' && rotulo.getBoundingClientRect().height > 0 : false,
        jugarAbajo: jugar.bottom,
        tituloArriba: h1.top,
        // (el dibujo de la flecha, 22 px, va al medio de su zona de 44 px para el dedo)
        flecha: flecha && getComputedStyle(flecha).display !== 'none' ? { arriba: fr.top, abajo: flecha.querySelector('svg').getBoundingClientRect().bottom, ancho: fr.width, alto: fr.height } : null,
        estado: raiz.dataset.estado,
        animo: raiz.dataset.animo,
        llegaron: visibles.filter((g) => g.classList.contains('llego')).length,
        cuantos: visibles.length,
        opacos: visibles.filter((g) => getComputedStyle(g).opacity !== '1').length,
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    const donde = `${nombre} (${ancho} × ${alto})`;
    revisar(m.desborde <= 0, `${donde}: la página se sale ${m.desborde} px hacia el lado`);
    if (tipo === 'computador') {
      revisar(m.rotulo, `${donde}: en el computador el rótulo chico tiene que seguir arriba del título`);
      revisar(!m.flecha, `${donde}: en el computador no va la flecha hacia el dibujo`);
      revisar(m.arriba >= m.barra - 1 && m.abajo <= m.pantalla + 1, `${donde}: el dibujo no cabe entero en la primera pantalla (de ${Math.round(m.arriba)} a ${Math.round(m.abajo)})`);
    } else {
      revisar(!m.rotulo, `${donde}: el rótulo chico sigue en la primera pantalla y repite el título`);
      revisar(m.tituloArriba >= m.barra - 1, `${donde}: el título queda bajo la barra`);
      revisar(m.jugarAbajo <= m.pantalla, `${donde}: "Jugar" no cabe en la primera pantalla (termina en ${Math.round(m.jugarAbajo)} y la pantalla mide ${m.pantalla})`);
      if (tipo === 'tablet-alta') {
        revisar(m.arriba >= m.barra - 1 && m.abajo <= m.pantalla + 1, `${donde}: en la tablet alta el dibujo debía caber entero junto al texto (va de ${Math.round(m.arriba)} a ${Math.round(m.abajo)})`);
      } else {
        // nunca asoma a medias: empieza después de la primera pantalla
        revisar(m.arriba >= m.pantalla, `${donde}: el dibujo asoma en la primera pantalla (empieza en ${Math.round(m.arriba)} y la pantalla mide ${m.pantalla})`);
        // mientras espera, la escena completa y quieta (nunca una caja vacía)
        revisar(m.estado === 'por-partir' && m.llegaron === m.cuantos && m.opacos === 0 && m.animo === 'colapsada', `${donde}: mientras espera, el dibujo no muestra la escena completa (${m.estado}, ${m.llegaron} de ${m.cuantos} pedidos, ${m.opacos} sin ver, mosca ${m.animo})`);
        if (tipo === 'celular' || tipo === 'tablet') {
          revisar(!!m.flecha && m.flecha.abajo <= m.pantalla && m.flecha.ancho >= 44 && m.flecha.alto >= 44, `${donde}: falta la flecha hacia el dibujo, o no se ve entera, o mide menos de 44 px (${JSON.stringify(m.flecha)})`);
        }
      }
    }
    // la flecha lleva al dibujo y ahí se mueve de verdad: la escena completa
    // se va y los pedidos vuelven a llegar
    if (m.flecha && m.flecha.abajo <= m.pantalla && tactil) {
      await pagina.locator('.hero .bajar').tap();
      const partio = await pagina.waitForFunction(() => document.querySelector('.suena').dataset.estado === 'andando', null, { timeout: 6000 }).then(() => true, () => false);
      revisar(partio, `${donde}: después de la flecha el dibujo no partió`);
      // (la página baja suave: se mide cuando se detiene)
      await pagina.waitForFunction(
        () =>
          new Promise((listo) => {
            let antes = scrollY;
            let quieta = 0;
            const vez = setInterval(() => {
              quieta = scrollY === antes ? quieta + 1 : 0;
              antes = scrollY;
              if (quieta >= 4) {
                clearInterval(vez);
                listo(true);
              }
            }, 80);
          }),
        null,
        { timeout: 8000 },
      );
      const lugar = await pagina.evaluate(() => {
        const c = document.querySelector('.suena').getBoundingClientRect();
        return { arriba: c.top, abajo: c.bottom, pantalla: innerHeight, barra: document.querySelector('.barra')?.getBoundingClientRect().bottom ?? 0 };
      });
      revisar(lugar.arriba >= lugar.barra - 1 && lugar.arriba < lugar.pantalla / 2, `${donde}: la flecha no dejó el dibujo a la vista bajo la barra (empieza en ${Math.round(lugar.arriba)})`);
      const seFueron = await pagina.waitForFunction(() => window.__mosca.suena.llegaron() === 0, null, { timeout: 5000 }).then(() => true, () => false);
      const llegan = await pagina.waitForFunction(() => window.__mosca.suena.llegaron() >= 2, null, { timeout: 6000 }).then(() => true, () => false);
      revisar(seFueron && llegan, `${donde}: el dibujo no se mueve (se fueron ${seFueron}, llegan ${llegan})`);
      // y se ve moverse: el pedido que llegó se ve entero y el que falta, no
      await pagina.waitForTimeout(600);
      const se = await pagina.evaluate(() => {
        const visibles = [...document.querySelectorAll('.suena [data-globo]')].filter((g) => getComputedStyle(g).display !== 'none');
        return {
          llegados: visibles.filter((g) => g.classList.contains('llego')).map((g) => getComputedStyle(g).opacity),
          faltan: visibles.filter((g) => !g.classList.contains('llego')).map((g) => getComputedStyle(g).opacity),
        };
      });
      revisar(se.llegados.length >= 2 && se.llegados.some((o) => o === '1') && se.faltan.every((o) => o === '0'), `${donde}: los pedidos no se ven llegar (${JSON.stringify(se)})`);
    }
    revisar(errores.length === 0, `${donde}: errores ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
  }

  // ---------- 10. El cerebro, más abajo, se pide recién al acercarse ----------
  // (desde la 8.13 el cerebro en 3D y su consola viven en "¿Por qué una
  // mosca?": no se bajan al entrar, se encienden al llegar y la consola sube
  // sola de 2 a 10)
  {
    const { contexto, pagina, errores, pedidos } = await abrir(T.ruta);
    await pagina.waitForFunction(() => window.__mosca?.suena, null, { timeout: 15000 });
    await pagina.waitForTimeout(1500);
    const delCerebro = () => pedidos.filter((u) => /\/cerebro\/[^/]+\.(bin|json)/.test(u)).length;
    revisar(delCerebro() === 0, `el cerebro se bajó al entrar (${delCerebro()} archivos) y debía esperar`);
    revisar(!(await pagina.evaluate(() => document.querySelector('.cerebro.vivo'))), 'el cerebro se encendió sin que nadie llegara a su sección');
    const tareasAlEntrar = await pagina.evaluate(() => document.getElementById('wip').value);
    revisar(tareasAlEntrar === '2', `la consola del cerebro partió en ${tareasAlEntrar} tareas y debía partir en 2`);
    await pagina.evaluate(() => document.querySelector('.cerebro').scrollIntoView({ block: 'center', behavior: 'instant' }));
    const encendio = await pagina.waitForFunction(() => document.querySelector('.cerebro.vivo'), null, { timeout: 40000 }).then(() => true, () => false);
    revisar(encendio, 'el cerebro no se encendió al llegar a su sección');
    revisar(delCerebro() >= 5, `el cerebro pidió ${delCerebro()} archivos y debían ser 5`);
    const subio = await pagina.waitForFunction(() => document.getElementById('wip').value === '10', null, { timeout: 30000 }).then(() => true, () => false);
    revisar(subio, `la consola del cerebro no subió sola hasta 10 (quedó en ${await pagina.evaluate(() => document.getElementById('wip').value)})`);
    await pagina.waitForTimeout(1500);
    const consola = await pagina.evaluate(() => ({
      neuronas: Number(document.querySelector('[data-neuronas]').textContent.replace(/\D/g, '')),
      dentro: Boolean(document.querySelector('#por-que-una-mosca .cerebro') && document.querySelector('#por-que-una-mosca .consola')),
      enInicio: Boolean(document.querySelector('.hero .cerebro, .hero .consola')),
      credencial: Boolean(document.querySelector('#por-que-una-mosca .credencial')),
    }));
    revisar(consola.dentro && !consola.enInicio, 'el cerebro y su consola no están en "¿Por qué una mosca?" (o siguen en el inicio)');
    revisar(consola.credencial, 'falta la credencial de la mosca en "¿Por qué una mosca?"');
    revisar(consola.neuronas > 800, `con 10 tareas se encienden ${consola.neuronas} neuronas (muy pocas)`);
    revisar(errores.length === 0, `errores al llegar al cerebro: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
  }
}

await probarIdioma('es');
console.log('');
await probarIdioma('en');
await navegador.close();
console.log('');
console.log(fallas ? `dibujo del inicio: ${fallas} cosas por revisar` : 'dibujo del inicio: todo bien');
process.exit(fallas ? 1 : 0);
