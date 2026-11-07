// Prueba "el zoom" (Etapa 8.6, punto 8b; pedido de Felipe, 2026-11-06): en el
// celular, dos dedos sobre la oficina la acercan o la alejan (la escena 3D),
// con un tope para que la mosca nunca se pierda; "Vista inicial" la devuelve a
// su encuadre de partida (también después de un pellizco); y la página del
// juego misma nunca se acerca (ni con dos dedos ni con doble toque) ni se
// corre hacia el lado. La portada, la guía, el informe y el taller sí se dejan
// acercar (hay gente que lo necesita para leer).
//
// Qué se comprueba sin un iPhone de verdad:
//  - Pixel 7 (Chromium, el motor de Chrome en Android): pellizcos de verdad en
//    la pantalla táctil, armados por el navegador (Input.synthesizePinchGesture).
//    Sobre la hoja, la página no se acerca: con todo puesto, sin el
//    user-scalable=no (como en el iPhone, que lo ignora), solo con touch-action
//    y solo con los avisos de src/main.js; y sin ninguna de las tres, sí (así se
//    sabe que el pellizco simulado acercaría la página si nada lo frenara).
//    Sobre la oficina, la cámara se acerca y se aleja hasta sus topes sin
//    correrse hacia el lado. En la portada, la guía, el informe y el taller, el
//    mismo pellizco sí acerca la página.
//  - iPhones (WebKit, el motor de Safari): Playwright no sabe pellizcar en
//    WebKit, así que se revisa cada pieza: el viewport; el touch-action de cada
//    elemento tal como lo calcula WebKit (ninguno deja acercar ni el doble
//    toque); que los gestos de Safari (gesturestart, gesturechange) y el
//    movimiento con dos dedos se frenen en el juego y no en las otras páginas; y
//    un pellizco armado a mano con punteros sobre la oficina (lo mismo que recibe
//    la cámara del juego de un pellizco de verdad).
//  - En todos: "Vista inicial" aparece después de pellizcar y devuelve la
//    oficina a su encuadre; nada se sale hacia el lado y la página no se corre
//    (scrollX y visualViewport, también tras intentar deslizarla de lado); sin
//    errores. En el computador (sin pantalla táctil) y en un iPad girado (la
//    vista del computador) la cámara sigue con sus topes de siempre (1,6 a 7) y
//    en el computador los avisos de gestos no se frenan (el pellizco del
//    trackpad sigue como siempre).
// Lo que solo se ve en un iPhone de verdad: que Safari obedezca touch-action y
// los avisos de gestos con los dedos de verdad, y cómo se siente el pellizco.
// Requiere el servidor de desarrollo (npm run dev). Uso:
//   node scripts/probar-zoom.mjs          → debe decir "zoom: todo bien"
//   SITIO=http://localhost:5173/          la portada (el juego es SITIO + jugar/)
//   TELEFONOS=pixel7,iphone15promax       solo esos
//   CAPTURAS=docs/etapa8-6-capturas       dónde dejar la foto de los topes del
//                                         iPhone 15 Pro Max (por defecto capturas/zoom)
import { chromium, webkit, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const SITIO = (process.env.SITIO ?? 'http://localhost:5173/').replace(/\/?$/, '/');
const JUEGO = SITIO + 'jugar/';
const DIR = process.env.CAPTURAS ?? 'capturas/zoom';
mkdirSync(DIR, { recursive: true });

// Los topes del zoom en el celular (ZOOM_CELULAR en src/main.js): de la mitad
// al doble de la distancia de la vista inicial. Los del computador, en
// src/scene.js y en aplicarVista.
const CERCA = 0.5;
const LEJOS = 2;
const COMPUTADOR = [1.6, 7];
// Las otras páginas del sitio, que sí se dejan acercar
const OTRAS = { portada: '', guía: 'limite-wip/', informe: 'informe/', taller: 'taller/' };

const sinMotor = ({ defaultBrowserType, ...resto }) => resto;
const UA_IPHONE = devices['iPhone 15 Pro Max'].userAgent;
const TELEFONOS = {
  pixel7: { motor: 'chromium', celular: true, ...sinMotor(devices['Pixel 7']) },
  iphone15promax: { motor: 'webkit', celular: true, ...sinMotor(devices['iPhone 15 Pro Max']) },
  'iphone-375x667': {
    motor: 'webkit',
    celular: true,
    viewport: { width: 375, height: 667 },
    screen: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: UA_IPHONE,
  },
  'iphone15promax-girado': { motor: 'webkit', celular: true, ...sinMotor(devices['iPhone 15 Pro Max landscape']) },
  'ipad-girado': { motor: 'webkit', celular: false, ...sinMotor(devices['iPad Mini landscape']) },
  computador: { motor: 'chromium', celular: false, viewport: { width: 1440, height: 900 } },
};
const elegidos = process.env.TELEFONOS ? process.env.TELEFONOS.split(',') : Object.keys(TELEFONOS);

const navegadores = {};
const abrirMotor = async (motor) =>
  (navegadores[motor] ??=
    motor === 'webkit'
      ? await webkit.launch()
      : await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] }));

const fallas = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? '✅' : '❌'} ${texto}`);
  if (!ok) fallas.push(texto);
};
const f2 = (v) => v.toFixed(2);

// ---------- Lo que se mide en la página ----------
// (la página y también su cuerpo, que en el juego no se desplaza pero podría
// correrse por código si algo se le saliera hacia el lado)
const leerPagina = (p) =>
  p.evaluate(() => ({
    escala: +visualViewport.scale.toFixed(3),
    izq: +visualViewport.offsetLeft.toFixed(1),
    pageLeft: +visualViewport.pageLeft.toFixed(1),
    scrollX: scrollX + document.body.scrollLeft,
    desborde: Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - document.body.clientWidth),
  }));
const sinMoverse = (v) => v.escala === 1 && v.izq === 0 && v.pageLeft === 0 && v.scrollX === 0 && v.desborde <= 0;
const textoPagina = (v) => `zoom ${v.escala}, corrida ${v.pageLeft + v.scrollX} px, desborde ${v.desborde} px`;

const leerCamara = (p) =>
  p.evaluate(() => {
    const c = window.__mosca.camaraInfo();
    return { ...c, d: Math.hypot(...c.pos.map((v, i) => v - c.obj[i])) };
  });
const distancia = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
// Después de tocar "Vista inicial", la cámara vuelve con una transición suave
// que avanza por cuadros: con el computador ocupado (un juego abierto, por
// ejemplo) WebKit dibuja pocos cuadros por segundo y en 1,5 s no alcanza a
// llegar (pasó en la 8.7, igual con y sin sus cambios). Se espera hasta que la
// cámara deje de moverse, con un tope de 10 s; adónde llega se revisa igual.
async function esperarQueSeDetenga(p) {
  let antes = await leerCamara(p);
  const tope = Date.now() + 10000;
  while (Date.now() < tope) {
    await p.waitForTimeout(250);
    const ahora = await leerCamara(p);
    if (distancia(ahora.pos, antes.pos) < 0.0005 && distancia(ahora.obj, antes.obj) < 0.0005) return ahora;
    antes = ahora;
  }
  return antes;
}

const leerViewport = (p) => p.evaluate(() => document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '');
const viewportSinZoom = (c) => /user-scalable\s*=\s*no/.test(c) && /maximum-scale\s*=\s*1(\.0)?\b/.test(c);

// touch-action de cada elemento, tal como lo calcula el navegador: deja
// acercar la página si es auto, manipulation o trae pinch-zoom
const elementosQueDejanAcercar = (p) =>
  p.evaluate(() => {
    const deja = (v) => v === 'auto' || v === 'manipulation' || v.includes('pinch-zoom');
    const todos = [document.documentElement, ...document.querySelectorAll('body, body *')];
    const fuera = todos
      .filter((el) => deja(getComputedStyle(el).touchAction))
      .map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} (${getComputedStyle(el).touchAction})`);
    return { total: todos.length, fuera, raiz: getComputedStyle(document.documentElement).touchAction, cuerpo: getComputedStyle(document.body).touchAction };
  });

// Los avisos de gestos de Safari y el movimiento con dos dedos, armados a mano:
// ¿alguien los frena (preventDefault)? Un dedo nunca se frena (deslizar la
// lista de días)
const avisosFrenados = (p, selectores) =>
  p.evaluate((selectores) => {
    const r = {};
    for (const s of selectores) {
      const el = document.querySelector(s);
      if (!el) continue;
      for (const tipo of ['gesturestart', 'gesturechange']) {
        const e = new Event(tipo, { bubbles: true, cancelable: true });
        el.dispatchEvent(e);
        r[`${tipo} en ${s}`] = e.defaultPrevented;
      }
      for (const dedos of [2, 1]) {
        const e = new Event('touchmove', { bubbles: true, cancelable: true });
        Object.defineProperty(e, 'touches', { value: { length: dedos } });
        el.dispatchEvent(e);
        r[`${dedos === 2 ? 'dos dedos' : 'un dedo'} en ${s}`] = e.defaultPrevented;
      }
    }
    return r;
  }, selectores);

// ---------- Pellizcos ----------
// Chromium: el navegador arma el pellizco con dos toques de verdad
async function pellizcoChromium(p, x, y, factor) {
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Input.synthesizePinchGesture', { x, y, scaleFactor: factor, relativeSpeed: 600, gestureSourceType: 'touch' });
  await cdp.detach();
  await p.waitForTimeout(400);
}
// WebKit: dos punteros táctiles armados a mano sobre la oficina (los mismos
// avisos que recibe la cámara del juego de un pellizco). El navegador no los
// conoce, así que "capturarlos" fallaría: en esta página se apaga la captura
// (solo la prueba)
async function pellizcoArmado(p, factor) {
  await p.evaluate((factor) => {
    const c = document.getElementById('lienzo-3d');
    c.setPointerCapture = () => {};
    c.releasePointerCapture = () => {};
    const r = c.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.45;
    const inicio = 50;
    const fin = inicio * factor;
    const aviso = (tipo, id, x) =>
      c.dispatchEvent(
        new PointerEvent(tipo, { pointerId: id, pointerType: 'touch', isPrimary: id === 101, clientX: x, clientY: cy, button: 0, buttons: tipo === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true })
      );
    aviso('pointerdown', 101, cx - inicio);
    aviso('pointerdown', 102, cx + inicio);
    for (let i = 1; i <= 16; i++) {
      const s = inicio + ((fin - inicio) * i) / 16;
      aviso('pointermove', 101, cx - s);
      aviso('pointermove', 102, cx + s);
    }
    aviso('pointerup', 102, cx + fin);
    aviso('pointerup', 101, cx - fin);
  }, factor);
  await p.waitForTimeout(400);
}
async function centroOficina(p) {
  return p.evaluate(() => {
    const r = document.getElementById('lienzo-3d').getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height * 0.45];
  });
}
// Un punto de la hoja con texto: los números del día (no el deslizador, que
// tiene su propio touch-action)
async function puntoHoja(p) {
  return p.evaluate(() => {
    const el = [...document.querySelectorAll('#panel .bloque-numeros, #panel')].find((x) => x.getBoundingClientRect().height > 20);
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  });
}

async function abrirJuego(contexto) {
  const p = await contexto.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  await p.goto(JUEGO);
  await p.waitForFunction(() => window.__mosca);
  await p.waitForTimeout(800);
  // El día empieza (la hoja muestra sus números y la oficina se vuelve a
  // encuadrar) y se pausa: la cámara no depende del reloj
  await p.evaluate(() => {
    window.__mosca.empezar();
    window.__mosca.pausar(true);
  });
  await p.waitForTimeout(800);
  return { p, errores };
}

// ---------- El juego en un teléfono ----------
async function probarCelular(nombre, contexto, motor) {
  const { p, errores } = await abrirJuego(contexto);
  const et = (t) => `${nombre}: ${t}`;
  const enChromium = motor === 'chromium';
  const pellizcar = async (factor) => (enChromium ? pellizcoChromium(p, ...(await centroOficina(p)), factor) : pellizcoArmado(p, factor));

  // La página no se deja acercar
  const vp = await leerViewport(p);
  revisar(viewportSinZoom(vp), et(`el viewport del juego no deja acercar la página (Android): "${vp}"`));
  const ta = await elementosQueDejanAcercar(p);
  revisar(
    !ta.fuera.length,
    et(`ningún elemento deja acercar la página con los dedos ni con doble toque (touch-action de ${ta.total} elementos; la página: ${ta.raiz})${ta.fuera.length ? `: ${ta.fuera.slice(0, 6).join(' | ')}` : ''}`)
  );
  const avisos = await avisosFrenados(p, ['#panel', '#lienzo-3d', 'body']);
  const malos = Object.entries(avisos).filter(([k, v]) => v !== !k.startsWith('un dedo'));
  revisar(!malos.length, et(`los gestos de Safari y los dos dedos se frenan en la hoja, la oficina y la página; un dedo no (${Object.keys(avisos).length} avisos)${malos.length ? `: ${malos.map(([k, v]) => `${k} → ${v}`).join(' | ')}` : ''}`));

  // La vista inicial y los topes del zoom
  const casa = await leerCamara(p);
  revisar(
    !casa.correr && Math.abs(casa.zoom[0] / casa.d - CERCA) < 0.01 && Math.abs(casa.zoom[1] / casa.d - LEJOS) < 0.01,
    et(`los dos dedos solo acercan o alejan (no corren la oficina); topes ${f2(casa.zoom[0])} a ${f2(casa.zoom[1])} con la vista inicial a ${f2(casa.d)}`)
  );
  revisar(await p.evaluate(() => document.getElementById('btn-vista-inicial').hidden), et('al empezar no se ve "Vista inicial"'));

  // Pellizcar sobre la oficina: se acerca la oficina, no la página
  await pellizcar(1.5);
  let c = await leerCamara(p);
  let v = await leerPagina(p);
  revisar(c.d < casa.d - 0.3 && distancia(c.obj, casa.obj) < 0.001 && sinMoverse(v), et(`abrir los dedos sobre la oficina la acerca (${f2(casa.d)} → ${f2(c.d)}) sin correrla hacia el lado; la página sigue igual (${textoPagina(v)})`));
  revisar(!(await p.evaluate(() => document.getElementById('btn-vista-inicial').hidden)), et('después del pellizco aparece "Vista inicial"'));
  for (let i = 0; i < 3; i++) await pellizcar(4);
  c = await leerCamara(p);
  v = await leerPagina(p);
  revisar(Math.abs(c.d - casa.zoom[0]) < 0.01 && distancia(c.obj, casa.obj) < 0.001 && sinMoverse(v), et(`por más que se abran los dedos, se detiene en el tope de cerca (${f2(c.d)}; tope ${f2(casa.zoom[0])}); ${textoPagina(v)}`));
  const fotoCerca = nombre === 'iphone15promax' ? await p.screenshot({ scale: 'css', type: 'jpeg', quality: 80 }) : null;

  // "Vista inicial" la devuelve
  await p.locator('#btn-vista-inicial').tap();
  await p.waitForTimeout(1500);
  c = await esperarQueSeDetenga(p);
  revisar(
    distancia(c.pos, casa.pos) < 0.01 && distancia(c.obj, casa.obj) < 0.01 && (await p.evaluate(() => document.getElementById('btn-vista-inicial').hidden)),
    et(`"Vista inicial" la devuelve a su encuadre después del pellizco (a ${distancia(c.pos, casa.pos).toFixed(3)}) y se esconde`)
  );
  const fotoInicial = nombre === 'iphone15promax' ? await p.screenshot({ scale: 'css', type: 'jpeg', quality: 80 }) : null;

  // Cerrar los dedos la aleja, hasta su tope
  for (let i = 0; i < 3; i++) await pellizcar(0.5);
  c = await leerCamara(p);
  v = await leerPagina(p);
  revisar(Math.abs(c.d - casa.zoom[1]) < 0.01 && distancia(c.obj, casa.obj) < 0.001 && sinMoverse(v), et(`cerrar los dedos la aleja hasta el tope de lejos (${f2(c.d)}; tope ${f2(casa.zoom[1])}) y la mosca sigue al centro; ${textoPagina(v)}`));
  const fotoLejos = nombre === 'iphone15promax' ? await p.screenshot({ scale: 'css', type: 'jpeg', quality: 80 }) : null;
  await p.locator('#btn-vista-inicial').tap();
  await p.waitForTimeout(1500);
  c = await esperarQueSeDetenga(p);
  revisar(distancia(c.pos, casa.pos) < 0.01, et(`y "Vista inicial" la vuelve a traer (a ${distancia(c.pos, casa.pos).toFixed(3)})`));

  // Intentar correr la página hacia el lado: en Chromium, deslizando el dedo
  // sobre la hoja; en WebKit (que no sabe deslizar), por código: no hay nada
  // que correr
  if (enChromium) {
    const hoja = await puntoHoja(p);
    const cdp = await contexto.newCDPSession(p);
    await cdp.send('Input.synthesizeScrollGesture', { x: hoja[0], y: hoja[1], xDistance: -250, yDistance: 0, gestureSourceType: 'touch', speed: 800 });
    await cdp.detach();
  } else {
    await p.evaluate(() => {
      window.scrollTo(400, 0);
      document.body.scrollLeft = 400;
    });
  }
  await p.waitForTimeout(400);
  v = await leerPagina(p);
  revisar(sinMoverse(v), et(`${enChromium ? 'deslizar la hoja hacia el lado' : 'empujar la página hacia el lado'} no la corre (${textoPagina(v)})`));

  if (fotoCerca) await guardarTopes(nombre, [fotoCerca, fotoInicial, fotoLejos], [`Lo más cerca (${f2(casa.zoom[0])})`, `Vista inicial (${f2(casa.d)})`, `Lo más lejos (${f2(casa.zoom[1])})`]);
  revisar(!errores.length, et(`sin errores${errores.length ? `: ${errores.slice(0, 3).join(' | ')}` : ''}`));
  await p.close();
}

// Chromium: cada defensa de la página por separado, con pellizcos de verdad
// sobre la hoja
async function probarDefensas(nombre, contexto) {
  const et = (t) => `${nombre}: ${t}`;
  const casos = [
    ['con todo puesto', {}],
    ['sin el user-scalable=no (como en el iPhone, que lo ignora)', { viewport: true }],
    ['sin user-scalable=no ni los avisos de src/main.js (solo touch-action)', { viewport: true, avisos: true }],
    ['sin user-scalable=no ni touch-action (solo los avisos de src/main.js)', { viewport: true, touchAction: true }],
  ];
  for (const [texto, quitar] of [...casos, ['sin ninguna de las tres (control: así el pellizco sí acerca)', { viewport: true, avisos: true, touchAction: true }]]) {
    const { p } = await abrirJuego(contexto);
    await p.evaluate((quitar) => {
      if (quitar.viewport) document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
      if (quitar.touchAction) document.head.insertAdjacentHTML('beforeend', '<style>html, body, body * { touch-action: auto !important }</style>');
      // (antes de que lleguen a los avisos del juego, que escuchan en document)
      if (quitar.avisos) for (const tipo of ['touchmove', 'gesturestart', 'gesturechange']) window.addEventListener(tipo, (e) => e.stopImmediatePropagation(), { capture: true });
    }, quitar);
    await p.waitForTimeout(300);
    const hoja = await puntoHoja(p);
    await pellizcoChromium(p, hoja[0], hoja[1], 2);
    const v = await leerPagina(p);
    const control = quitar.viewport && quitar.avisos && quitar.touchAction;
    revisar(control ? v.escala > 1.3 : sinMoverse(v), et(`pellizco sobre la hoja ${texto}: ${control ? `la página se acerca (zoom ${v.escala})` : textoPagina(v)}`));
    await p.close();
  }
}

// La vista del computador, con o sin pantalla táctil
async function probarComputador(nombre, contexto, tactil) {
  const p = await contexto.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));
  await p.goto(JUEGO);
  await p.waitForFunction(() => window.__mosca);
  await p.waitForTimeout(800);
  const et = (t) => `${nombre}: ${t}`;
  const c = await leerCamara(p);
  const activo = await p.evaluate(() => window.__mosca.celular().activo);
  revisar(!activo && c.correr && c.zoom[0] === COMPUTADOR[0] && c.zoom[1] === COMPUTADOR[1], et(`vista del computador con sus topes de siempre (${c.zoom.join(' a ')}; los dos dedos o el botón derecho corren la oficina: ${c.correr})`));
  const vp = await leerViewport(p);
  revisar(viewportSinZoom(vp), et('el viewport del juego no deja acercar la página'));
  const avisos = await avisosFrenados(p, ['#panel', 'body']);
  const malos = Object.entries(avisos).filter(([k, v]) => v !== (tactil && !k.startsWith('un dedo')));
  revisar(
    !malos.length,
    et(tactil ? 'con pantalla táctil, los gestos de Safari y los dos dedos se frenan; un dedo no' : 'sin pantalla táctil, los avisos de gestos no se frenan (el pellizco del trackpad sigue como siempre)') +
      (malos.length ? `: ${malos.map(([k, v]) => `${k} → ${v}`).join(' | ')}` : '')
  );
  if (tactil) {
    const ta = await elementosQueDejanAcercar(p);
    revisar(!ta.fuera.length, et(`ningún elemento deja acercar la página con los dedos (${ta.total} elementos)${ta.fuera.length ? `: ${ta.fuera.slice(0, 6).join(' | ')}` : ''}`));
  }
  revisar(!errores.length, et(`sin errores${errores.length ? `: ${errores.slice(0, 3).join(' | ')}` : ''}`));
  await p.close();
}

// Las otras páginas siguen dejando acercar
async function probarOtras(nombre, contexto, motor) {
  for (const [pagina, ruta] of Object.entries(OTRAS)) {
    const p = await contexto.newPage();
    await p.goto(SITIO + ruta);
    await p.waitForTimeout(600);
    const vp = await leerViewport(p);
    const ta = await p.evaluate(() => [getComputedStyle(document.documentElement).touchAction, getComputedStyle(document.body).touchAction]);
    const avisos = await avisosFrenados(p, ['body']);
    let texto = `${nombre}: ${pagina} (/${ruta}) se sigue pudiendo acercar: viewport "${vp}", touch-action ${ta.join(' / ')}, gestos sin frenar`;
    let ok = !/user-scalable\s*=\s*no|maximum-scale/.test(vp) && ta.every((x) => x === 'auto') && !Object.values(avisos).some(Boolean);
    if (motor === 'chromium') {
      const tam = p.viewportSize();
      await pellizcoChromium(p, tam.width / 2, tam.height / 2, 2);
      const v = await leerPagina(p);
      texto += `, y el pellizco la acerca (zoom ${v.escala})`;
      ok &&= v.escala > 1.3;
    }
    revisar(ok, texto);
    await p.close();
  }
}

// La foto de los topes (iPhone 15 Pro Max): lo más cerca, la vista inicial y lo más lejos
async function guardarTopes(nombre, fotos, rotulos) {
  const navegador = await abrirMotor('chromium');
  const pagina = await navegador.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: 1 });
  const celdas = fotos
    .map((f, i) => `<figure><img src="data:image/jpeg;base64,${f.toString('base64')}"><figcaption>${rotulos[i]}</figcaption></figure>`)
    .join('');
  await pagina.setContent(`<style>
    body { margin: 0; padding: 14px; background: #fff; font: 13px -apple-system, 'Segoe UI', sans-serif; color: #33291e; display: inline-block; }
    h1 { margin: 0 0 4px; font-size: 16px; } p { margin: 0 0 10px; color: #7d6d59; }
    main { display: flex; gap: 12px; } figure { margin: 0; } img { display: block; width: 300px; border-radius: 6px; border: 1px solid #ddd3c2; }
    figcaption { padding: 4px 2px; font-weight: 600; }
  </style><h1>Mosca del WIP · el zoom con dos dedos · ${nombre}</h1>
  <p>Los dos topes del pellizco sobre la oficina (distancia de la cámara al centro de la mosca y su tablero) y la vista inicial, que vuelve con su botón.</p>
  <main>${celdas}</main>`);
  const archivo = `${DIR}/zoom-${nombre}.jpg`;
  await pagina.locator('body').screenshot({ path: archivo, type: 'jpeg', quality: 70 });
  await pagina.close();
  console.log(`   foto de los topes: ${archivo}`);
}

for (const nombre of elegidos) {
  const { motor, celular, ...opciones } = TELEFONOS[nombre];
  const navegador = await abrirMotor(motor);
  console.log(`\n— ${nombre} (${opciones.viewport.width} × ${opciones.viewport.height}, ${motor})`);
  const contexto = await navegador.newContext(opciones);
  if (celular) await probarCelular(nombre, contexto, motor);
  else await probarComputador(nombre, contexto, Boolean(opciones.hasTouch));
  if (nombre === 'pixel7') await probarDefensas(nombre, contexto);
  if (nombre === 'pixel7' || nombre === 'iphone15promax') await probarOtras(nombre, contexto, motor);
  await contexto.close();
}
for (const n of Object.values(navegadores)) await n.close();

console.log(fallas.length ? `\nzoom: ${fallas.length} problema(s)` : '\nzoom: todo bien');
process.exit(fallas.length ? 1 : 0);
