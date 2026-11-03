// Prueba el modo celular del juego (Parte 5.2e, 2026-10-24): la opción B,
// "vertical, como una app". En varios teléfonos simulados (iPhone chico,
// mediano y grande, Android chico y grande, un iPad en vertical, iPhones con
// el "Zoom de pantalla" o la letra agrandada, y girados)
// revisa:
//  1. que el modo celular se encienda en teléfonos y en tablets en vertical, y
//     NO en un iPad girado ni en un computador con la ventana angosta (ahí
//     sigue el juego de siempre);
//  2. que nada se salga de la pantalla ni quede tapado: sin desplazamiento
//     hacia el lado (tampoco en la pestaña Días; desde 320 px la tabla cabe
//     entera), los botones de arriba sin chocar entre sí, los números de las
//     tarjetas sin cortarse, y letra de 11 px o más;
//  3. zona de toque de al menos 44 px en todo lo que se toca (medida de
//     verdad: dónde responde la pantalla al dedo);
//  4. que todo funcione con el dedo: pestañas, deslizador (tocar la barra y
//     arrastrar), pausa, velocidad, reiniciar, abrir y cerrar la hoja (sin
//     que la oficina cambie de tamaño), el fin del día y "Ver los días";
//  5. en inglés: nada en español a la vista y nada cortado;
//  6. girar el teléfono y agrandar la ventana (un iPad que deja de ser
//     "celular"): todo vuelve a su lugar, sin errores;
//  7. que no haya errores en la consola.
// Saca capturas de cada teléfono (oficina, cerebro, días, hoja abierta, fin
// del día e inglés) en capturas/celular/ (o CAPTURAS=<carpeta>).
// Requiere npm run dev. Uso: node scripts/probar-celular.mjs
//   NAVEGADOR=webkit  prueba con el motor de Safari (por defecto, Chromium)
//   TELEFONOS=iphone14,android-chico  solo esos
import { chromium, webkit, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { PAGINA, TEXTOS } from '../src/juego-textos.js';

const JUEGO = process.env.JUEGO ?? 'http://localhost:5173/jugar/';
const CAPTURAS = process.env.CAPTURAS ?? 'capturas/celular';
const MOTOR = process.env.NAVEGADOR === 'webkit' ? webkit : chromium;
mkdirSync(CAPTURAS, { recursive: true });

const telefono = (ancho, alto, dpr, ua) => ({
  viewport: { width: ancho, height: alto },
  deviceScaleFactor: dpr,
  isMobile: true,
  hasTouch: true,
  userAgent: ua,
});
const UA_IPHONE = devices['iPhone 14'].userAgent;
const UA_ANDROID = devices['Pixel 7'].userAgent;
const UA_IPAD = devices['iPad Mini'].userAgent;
// Los tamaños son lo que se ve con las barras del navegador puestas
const TELEFONOS = {
  'iphone-se': telefono(375, 548, 2, UA_IPHONE), // iPhone SE en Safari: el más bajo
  iphone14: telefono(390, 664, 3, UA_IPHONE),
  'iphone-pro-max': telefono(430, 739, 3, UA_IPHONE),
  'android-chico': telefono(360, 560, 3, UA_ANDROID),
  'android-angosto': telefono(320, 658, 4.5, UA_ANDROID), // Galaxy S9+
  pixel7: telefono(412, 839, 2.625, UA_ANDROID),
  'ipad-vertical': telefono(768, 954, 2, UA_IPAD), // iPad mini en Safari
  // Con el "Zoom de pantalla" del iPhone (Ajustes > Pantalla y brillo): todo
  // se ve más grande y la página ve 320 px de ancho
  'iphone14-zoom-pantalla': telefono(320, 545, 3.375, UA_IPHONE),
  'iphone-se-zoom-pantalla': telefono(320, 466, 2.34, UA_IPHONE),
  // iPhone 14 con la letra de Safari al 150 % (aA): la página ve 260 px
  'iphone14-letra-grande': telefono(260, 443, 4.5, UA_IPHONE),
  'iphone14-girado': telefono(750, 340, 3, UA_IPHONE),
  'iphone-se-girado': telefono(667, 329, 2, UA_IPHONE),
  'pixel7-girado': telefono(863, 360, 2.625, UA_ANDROID),
  'iphone14-zoom-girado': telefono(613, 279, 3.375, UA_IPHONE),
  'iphone-se-zoom-girado': telefono(568, 281, 2.34, UA_IPHONE),
};
const elegidos = process.env.TELEFONOS ? process.env.TELEFONOS.split(',') : Object.keys(TELEFONOS);

// ---------- Palabras en español que no deberían verse en inglés ----------
// (el mismo método de scripts/probar-ingles.mjs)
const COMUNES = 'de la el los las del al con por para que qué una uno un se su sus es está hay más menos sin muy ya hoy día días hora horas tarea tareas mosca cerebro estrés vez cada como cómo también todo otro otra nuevo vista mostrar ocultar pausa juego tecla clic doble terminado terminadas hecho curso hacer límite sostenible nivel neuronas encendidas reposo zona zonas datos licencia en oficina volver portada números';
const palabras = (t) => String(t).toLowerCase().match(/[a-záéíóúñü]{2,}/g) ?? [];
const juntar = (v, conjunto) => {
  if (typeof v === 'string') palabras(v).forEach((w) => conjunto.add(w));
  else if (typeof v === 'function') juntar(v('Qq', 'Zz', 3, 4, 5), conjunto);
  else if (Array.isArray(v)) v.forEach((x) => juntar(x, conjunto));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => juntar(x, conjunto));
};
const enEspanol = new Set(COMUNES.split(' '));
const enIngles = new Set();
for (const [es, en] of Object.entries(PAGINA)) {
  juntar(es, enEspanol);
  juntar(en, enIngles);
}
for (const { es, en } of Object.values(TEXTOS)) {
  juntar(es, enEspanol);
  juntar(en, enIngles);
}
for (const w of enIngles) if (!COMUNES.split(' ').includes(w)) enEspanol.delete(w);
['mosca', 'del', 'wip', 'male', 'cns', 'cc', 'by'].forEach((w) => enEspanol.delete(w));

const fallas = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? '✅' : '❌'} ${texto}`);
  if (!ok) fallas.push(texto);
};

// ---------- Ayudas que corren en la página ----------
// Zona de toque real: desde el centro, hasta dónde la pantalla sigue
// respondiendo al mismo botón (cuenta lo que agranda su zona con ::after)
const ZONA_TOQUE = (selector) => {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const es = (x, y) => {
    const t = document.elementFromPoint(x, y);
    return Boolean(t && (t === el || el.contains(t)));
  };
  if (!es(cx, cy)) return { ancho: 0, alto: 0, tapado: true };
  const medir = (dx, dy) => {
    let d = 0;
    while (d < 200 && es(cx + dx * (d + 1), cy + dy * (d + 1))) d++;
    return d;
  };
  return { ancho: medir(-1, 0) + medir(1, 0) + 1, alto: medir(0, -1) + medir(0, 1) + 1, tapado: false };
};

async function abrir(contexto) {
  const p = await contexto.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errores.push(m.text());
  });
  await p.goto(JUEGO, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  return { p, errores };
}

const caja = (p, selector) =>
  p.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const visible = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    return { x: r.left, y: r.top, w: r.width, h: r.height, derecha: r.right, abajo: r.bottom, visible };
  }, selector);
const chocan = (a, b) => a && b && a.visible && b.visible && a.x < b.derecha - 1 && b.x < a.derecha - 1 && a.y < b.abajo - 1 && b.y < a.abajo - 1;
const tocar = async (p, selector) => {
  await p.locator(selector).tap();
  await p.waitForTimeout(150);
};

// Arrastrar con el dedo (solo Chromium: touchscreen de Playwright no arrastra)
async function arrastrar(p, desde, hasta, pasos = 8) {
  const cdp = await p.context().newCDPSession(p);
  const punto = (x, y) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: punto(...desde) });
  for (let i = 1; i <= pasos; i++) {
    const x = desde[0] + ((hasta[0] - desde[0]) * i) / pasos;
    const y = desde[1] + ((hasta[1] - desde[1]) * i) / pasos;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: punto(x, y) });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(150);
}

// Lo que se ve escrito (y lo que lee el lector de pantalla) en el modo celular
const TEXTO_VISIBLE = () => {
  const textos = [];
  const visible = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const recorrido = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = recorrido.nextNode(); n; n = recorrido.nextNode()) {
    const t = n.nodeValue.trim();
    if (!t || !n.parentElement || n.parentElement.closest('script, style, .idioma')) continue;
    if (visible(n.parentElement)) textos.push(t);
  }
  for (const el of document.querySelectorAll('[aria-label], [title]'))
    if (visible(el) && !el.closest('.idioma'))
      for (const a of ['aria-label', 'title']) if (el.getAttribute(a)) textos.push(el.getAttribute(a));
  return textos;
};

// Letra de menos de 11 px a la vista (lo escondido para el lector de pantalla,
// de 1 px, no cuenta; los botones que muestran solo su dibujo tienen letra 0)
const LETRA_CHICA = () => {
  const chicas = [];
  const recorrido = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = recorrido.nextNode(); n; n = recorrido.nextNode()) {
    const t = n.nodeValue.trim();
    const el = n.parentElement;
    if (!t || !el || el.closest('script, style')) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    let oculto = false;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') oculto = true;
    }
    const tam = parseFloat(getComputedStyle(el).fontSize);
    if (!oculto && tam > 0 && tam < 11) chicas.push(`«${t.slice(0, 28)}» ${tam} px`);
  }
  return chicas;
};

// Antes de empezar (desde el 2026-10-25): el reloj no corre hasta tocar
// Empezar; la tarjeta se ve entera sobre la oficina, sin chocar con lo de
// arriba ni con la hoja, se toca con el dedo y hace partir el día
async function probarEmpezar(p, etiqueta, nombre) {
  await p.waitForTimeout(1200);
  const antes = await p.evaluate(() => ({ hora: window.__mosca.estado().hora, empezado: window.__mosca.empezado() }));
  revisar(antes.hora === '09:00' && !antes.empezado, etiqueta(`al entrar el reloj espera a Empezar (${antes.hora})`));
  const tarjeta = await caja(p, '#aviso-empezar');
  const vista = await p.evaluate(() => ({ ancho: innerWidth, alto: innerHeight }));
  revisar(
    tarjeta.visible && tarjeta.x >= 0 && tarjeta.derecha <= vista.ancho && tarjeta.y >= 0 && tarjeta.abajo <= vista.alto,
    etiqueta('la tarjeta de Empezar se ve entera')
  );
  const choques = [];
  for (const s of ['#cel-volver', '#cel-controles', '#ex-mosca', '#panel', '#cel-pestanas']) if (chocan(tarjeta, await caja(p, s))) choques.push(s);
  revisar(!choques.length, etiqueta(`la tarjeta de Empezar no choca con nada${choques.length ? ` (choca con ${choques.join(', ')})` : ''}`));
  const z = await p.evaluate(ZONA_TOQUE, '#btn-empezar');
  revisar(z && !z.tapado && z.ancho >= 44 && z.alto >= 44, etiqueta(`zona de toque de #btn-empezar: ${z ? `${z.ancho}×${z.alto}` : 'no está'}${z?.tapado ? ' (tapado)' : ''}`));
  // Desde la 8.1 la tarjeta presenta el juego: en un teléfono normal se ve
  // completa (título, tres líneas, botón y "¿Qué es esto?"); solo con el zoom
  // de pantalla o la letra agrandada puede perder partes. La hoja lleva solo
  // las tareas a la vez hasta empezar (los números aparecen al empezar).
  const partes = await p.evaluate(() => {
    const t = document.getElementById('aviso-empezar');
    const seVe = (s) => { const el = t.querySelector(s); return !!el && getComputedStyle(el).display !== 'none'; };
    return { clases: t.className, titulo: seVe('strong'), lineas: [...t.querySelectorAll('.aviso-texto p')].filter((e) => getComputedStyle(e).display !== 'none').length, boton: seVe('#btn-empezar'), enlace: seVe('#aviso-que-es'), numeros: !!document.querySelector('.bloque-numeros') && getComputedStyle(document.querySelector('.bloque-numeros')).display !== 'none' };
  });
  if (!/zoom|letra/.test(nombre)) revisar(partes.titulo && partes.lineas === 3 && partes.boton && partes.enlace, etiqueta(`la tarjeta de inicio se ve completa (${JSON.stringify(partes)})`));
  else console.log(`   ${nombre}: tarjeta ${partes.clases ? `recortada (${partes.clases})` : 'completa'}`);
  revisar(!partes.numeros, etiqueta('antes de empezar la hoja no muestra los números'));
  if (partes.enlace) {
    const ze = await p.evaluate(ZONA_TOQUE, '#aviso-que-es');
    revisar(ze && !ze.tapado && ze.alto >= 44, etiqueta(`zona de toque de "¿Qué es esto?": ${ze ? `${ze.ancho}×${ze.alto}` : 'no está'}${ze?.tapado ? ' (tapado)' : ''}`));
  }
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-0-empezar.png` });
  await tocar(p, '#btn-empezar');
  await p.waitForTimeout(1200);
  const despues = await p.evaluate(() => ({
    hora: window.__mosca.estado().hora,
    corre: window.__mosca.empezado() && !window.__mosca.pausado(),
    tarjeta: document.getElementById('aviso-empezar').hidden,
  }));
  revisar(despues.corre && despues.tarjeta && despues.hora !== '09:00', etiqueta(`Empezar hace correr el reloj y saca la tarjeta (${despues.hora})`));
  const numeros = await p.evaluate(() => getComputedStyle(document.querySelector('.bloque-numeros')).display !== 'none');
  revisar(numeros, etiqueta('al empezar aparecen los números de la hoja'));
}

// ---------- Un teléfono vertical ----------
async function probarVertical(nombre, navegador) {
  const contexto = await navegador.newContext({ ...TELEFONOS[nombre], locale: 'es-CL' });
  const { p, errores } = await abrir(contexto);
  const esChromium = MOTOR === chromium;
  const etiqueta = (t) => `${nombre}: ${t}`;

  const info = await p.evaluate(() => ({ ...window.__mosca.celular(), clase: document.documentElement.className }));
  revisar(info.activo && /celular/.test(info.clase), etiqueta('se enciende el modo celular'));
  revisar(info.ratio <= 1.5, etiqueta(`la oficina se dibuja a lo más a 1,5× (${info.ratio})`));
  await probarEmpezar(p, etiqueta, nombre);

  // Un momento del día con números de verdad (WIP 3, a media mañana)
  await p.evaluate(() => {
    window.__mosca.setWip(3);
    window.__mosca.adelantar(150);
  });
  await p.waitForTimeout(400);

  const medidas = await p.evaluate(() => ({
    ancho: document.documentElement.scrollWidth,
    vista: innerWidth,
    alto: innerHeight,
    escena: document.getElementById('escena').getBoundingClientRect().toJSON(),
    hoja: document.getElementById('panel').getBoundingClientRect().toJSON(),
    pestanas: document.getElementById('cel-pestanas').getBoundingClientRect().toJSON(),
  }));
  revisar(medidas.ancho <= medidas.vista, etiqueta(`sin desplazamiento hacia el lado (${medidas.ancho} de ${medidas.vista} px)`));
  revisar(Math.abs(medidas.pestanas.bottom - medidas.alto) <= 1, etiqueta('las pestañas quedan al pie'));
  // (280 px; en pantallas muy bajas, al menos un tercio de la pantalla)
  revisar(medidas.escena.height >= Math.min(280, medidas.alto / 3), etiqueta(`la oficina tiene espacio (${Math.round(medidas.escena.height)} px de alto)`));
  revisar(
    Math.abs(medidas.hoja.top - (medidas.escena.bottom - 20)) <= 1,
    etiqueta('la hoja tapa solo 20 px del borde de abajo de la oficina')
  );

  // Arriba: volver, la píldora y el estado de la mosca, sin chocar
  const volver = await caja(p, '#cel-volver');
  const pildora = await caja(p, '#cel-controles');
  const estado = await caja(p, '#ex-mosca');
  revisar(volver.visible && pildora.visible && estado.visible, etiqueta('se ven volver, la píldora y el estado de la mosca'));
  revisar(!chocan(volver, pildora) && !chocan(volver, estado) && !chocan(pildora, estado), etiqueta('volver, la píldora y el estado de la mosca no chocan'));

  // Las tarjetas: ningún número cortado
  const cortadas = await p.evaluate(() =>
    [...document.querySelectorAll('.bloque-numeros .metrica, .bloque-numeros > .bloque-fila, .bloque-numeros > .estres')]
      .filter((t) => t.getClientRects().length && t.scrollWidth > t.clientWidth + 1)
      .map((t) => t.textContent.trim().replace(/\s+/g, ' '))
  );
  revisar(!cortadas.length, etiqueta(`ningún número se corta en las tarjetas${cortadas.length ? ` (${cortadas.join(' | ')})` : ''}`));

  // Zonas de toque de lo que se toca en la oficina y la hoja
  const tocables = ['#cel-volver', '#btn-pausa', '#btn-velocidad', '#btn-reiniciar', '#cel-mas', '#wip', '#cel-pestana-oficina', '#cel-pestana-cerebro', '#cel-pestana-dias'];
  for (const s of tocables) {
    const z = await p.evaluate(ZONA_TOQUE, s);
    revisar(z && !z.tapado && z.ancho >= 44 && z.alto >= 44, etiqueta(`zona de toque de ${s}: ${z ? `${z.ancho}×${z.alto}` : 'no está'}${z?.tapado ? ' (tapado)' : ''}`));
  }
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-1-oficina.png` });

  // Girar la oficina con el dedo hace aparecer "Vista inicial", que la devuelve
  await p.evaluate(() => window.__mosca.camara([3.2, 3.4, 4.6]));
  await p.waitForTimeout(300);
  const vistaInicial = await caja(p, '#btn-vista-inicial');
  const zVista = await p.evaluate(ZONA_TOQUE, '#btn-vista-inicial');
  revisar(
    vistaInicial.visible && !chocan(vistaInicial, await caja(p, '#cel-controles')) && !chocan(vistaInicial, await caja(p, '#ex-mosca')),
    etiqueta('"Vista inicial" aparece sin chocar con la píldora ni con el estado de la mosca')
  );
  revisar(zVista && !zVista.tapado && zVista.ancho >= 44 && zVista.alto >= 44, etiqueta(`zona de toque de #btn-vista-inicial: ${zVista ? `${zVista.ancho}×${zVista.alto}` : 'no está'}`));
  // Ir al cerebro y volver no le quita el giro a la oficina (en pantallas
  // bajas la oficina cambia de tamaño al cambiar de pestaña)
  const camaraAntes = await p.evaluate(() => window.__mosca.camaraInfo().pos);
  await tocar(p, '#cel-pestana-cerebro');
  await tocar(p, '#cel-pestana-oficina');
  await p.waitForTimeout(300);
  const camaraDespues = await p.evaluate(() => window.__mosca.camaraInfo().pos);
  const corrida = Math.hypot(...camaraAntes.map((v, i) => v - camaraDespues[i]));
  revisar(corrida < 0.05 && (await caja(p, '#btn-vista-inicial')).visible, etiqueta('ir al cerebro y volver deja la oficina girada como estaba'));
  await tocar(p, '#btn-vista-inicial');
  await p.waitForTimeout(1500);
  revisar(await p.evaluate(() => document.getElementById('btn-vista-inicial').hidden), etiqueta('"Vista inicial" devuelve la oficina a su encuadre'));

  // Deslizador: tocar la barra en el 7 y arrastrar hasta el 2
  const r = await caja(p, '#wip');
  const xDe = (v) => r.x + 15 + ((v - 1) / 9) * (r.w - 30);
  await p.touchscreen.tap(xDe(7), r.y + r.h / 2);
  await p.waitForTimeout(150);
  const tras7 = await p.evaluate(() => [document.getElementById('wip').value, document.getElementById('wip-valor').textContent, window.__mosca.estado().wip]);
  revisar(tras7[0] === '7' && tras7[1] === '7' && tras7[2] === 7, etiqueta(`tocar la barra en el 7 lo deja en 7 (${tras7.join(', ')})`));
  if (esChromium) {
    await arrastrar(p, [xDe(7), r.y + r.h / 2], [xDe(2), r.y + r.h / 2]);
    const tras2 = await p.evaluate(() => [document.getElementById('wip').value, window.__mosca.estado().wip]);
    revisar(tras2[0] === '2' && tras2[1] === 2, etiqueta(`arrastrar del 7 al 2 lo deja en 2 (${tras2.join(', ')})`));
  }
  await p.evaluate(() => window.__mosca.setWip(3));

  // Pausa, velocidad y reiniciar desde la píldora
  await tocar(p, '#btn-pausa');
  const enPausa = await p.evaluate(() => [window.__mosca.pausado(), document.getElementById('btn-pausa').classList.contains('activo')]);
  revisar(enPausa[0] && enPausa[1], etiqueta('pausa: el juego se detiene y el botón se pinta'));
  await tocar(p, '#btn-pausa');
  revisar(!(await p.evaluate(() => window.__mosca.pausado())), etiqueta('reanudar'));
  await tocar(p, '#btn-velocidad');
  revisar((await p.textContent('#btn-velocidad')) === 'x2', etiqueta('velocidad: x1 → x2'));
  await tocar(p, '#btn-velocidad');
  await tocar(p, '#btn-velocidad');
  await tocar(p, '#btn-reiniciar');
  const hora = await p.evaluate(() => window.__mosca.estado().hora);
  revisar(/^09:0/.test(hora), etiqueta(`reiniciar vuelve a las 09:00 (${hora})`));
  await p.evaluate(() => window.__mosca.adelantar(150));

  // La hoja: se abre hacia arriba sin cambiar el tamaño de la oficina
  const escenaAntes = await caja(p, '#escena');
  const hojaAntes = await caja(p, '#panel');
  await tocar(p, '#cel-mas');
  const abierta = await p.evaluate(() => ({
    expandida: document.getElementById('cel-mas').getAttribute('aria-expanded'),
    extra: ['.bloque-numeros .metrica:nth-child(3)', '.bloque-numeros .eficiencia', '.bloque-numeros .estres'].map((s) => document.querySelector(s).getClientRects().length > 0),
  }));
  const escenaAbierta = await caja(p, '#escena');
  const hojaAbierta = await caja(p, '#panel');
  revisar(abierta.expandida === 'true' && abierta.extra.every(Boolean), etiqueta('la hoja se abre y muestra cafés, estrés y eficiencia'));
  revisar(escenaAbierta.h === escenaAntes.h && hojaAbierta.y < hojaAntes.y, etiqueta('abierta crece hacia arriba y la oficina no cambia de tamaño'));
  const cortadasAbierta = await p.evaluate(() =>
    [...document.querySelectorAll('.bloque-numeros .metrica, .bloque-numeros > .bloque-fila, .bloque-numeros > .estres')]
      .filter((t) => t.getClientRects().length && t.scrollWidth > t.clientWidth + 1)
      .map((t) => t.textContent.trim().replace(/\s+/g, ' '))
  );
  revisar(!cortadasAbierta.length, etiqueta(`abierta, ningún número se corta${cortadasAbierta.length ? ` (${cortadasAbierta.join(' | ')})` : ''}`));
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-4-hoja-abierta.png` });
  // Tocar la oficina la cierra
  await p.touchscreen.tap(escenaAntes.x + escenaAntes.w / 2, escenaAntes.y + escenaAntes.h * 0.55);
  await p.waitForTimeout(150);
  revisar((await p.getAttribute('#cel-mas', 'aria-expanded')) === 'false', etiqueta('tocar la oficina cierra la hoja'));
  if (esChromium) {
    const m = await caja(p, '#cel-mas');
    await arrastrar(p, [m.x + m.w / 2, m.y + m.h / 2], [m.x + m.w / 2, m.y - 80]);
    const tras = await p.getAttribute('#cel-mas', 'aria-expanded');
    await arrastrar(p, [m.x + m.w / 2, (await caja(p, '#cel-mas')).y + 10], [m.x + m.w / 2, m.y + 120]);
    const trasBajar = await p.getAttribute('#cel-mas', 'aria-expanded');
    revisar(tras === 'true' && trasBajar === 'false', etiqueta('arrastrar la manilla hacia arriba la abre y hacia abajo la cierra'));
  }

  // Pestaña Cerebro
  await tocar(p, '#cel-pestana-cerebro');
  await p.waitForTimeout(500);
  const cerebro = await p.evaluate(() => ({
    vista: document.documentElement.dataset.celVista,
    elegida: document.getElementById('cel-pestana-cerebro').getAttribute('aria-selected'),
    oficina: getComputedStyle(document.getElementById('escena')).visibility,
    panel: getComputedStyle(document.getElementById('cerebro')).visibility,
    credito: document.querySelector('.cerebro-credito').getBoundingClientRect().height > 0,
  }));
  revisar(cerebro.vista === 'cerebro' && cerebro.elegida === 'true' && cerebro.oficina === 'hidden' && cerebro.panel === 'visible', etiqueta('la pestaña Cerebro cambia la oficina por el cerebro'));
  revisar(cerebro.credito, etiqueta('se ve el crédito de los datos (Male CNS · CC BY 4.0)'));
  const ratioCerebro = await p.evaluate(() => {
    const c = document.getElementById('lienzo-cerebro');
    return c.width / c.clientWidth;
  });
  revisar(ratioCerebro <= 1.51, etiqueta(`el cerebro se dibuja a lo más a 1,5× (${ratioCerebro.toFixed(2)})`));
  const lectura = await caja(p, '.cerebro-lectura');
  const botonesCerebro = await caja(p, '.cerebro-botones');
  const zonas = await caja(p, '.cerebro-zonas');
  const pie = await caja(p, '.cerebro-pie');
  const pildoraCerebro = await caja(p, '#cel-controles');
  revisar(
    !chocan(lectura, botonesCerebro) && !chocan(lectura, zonas) && !chocan(zonas, pie) && !chocan(botonesCerebro, zonas) && !chocan(pildoraCerebro, botonesCerebro) && !chocan(botonesCerebro, pie) && !chocan(lectura, pie),
    etiqueta('en el cerebro, los números, los botones, las zonas y el crédito no chocan')
  );
  revisar(pie.abajo <= (await caja(p, '#panel')).y + 1, etiqueta('"¿Es real?" y el crédito quedan sobre la hoja'));
  for (const s of ['#btn-girar-cerebro', '#btn-centrar-cerebro', '#btn-es-real']) {
    const z = await p.evaluate(ZONA_TOQUE, s);
    revisar(z && !z.tapado && z.ancho >= 44 && z.alto >= 44, etiqueta(`zona de toque de ${s}: ${z ? `${z.ancho}×${z.alto}` : 'no está'}`));
  }
  await tocar(p, '#btn-es-real');
  const cajaInfo = await caja(p, '#cerebro-info');
  revisar(cajaInfo.visible && cajaInfo.x >= 0 && cajaInfo.derecha <= medidas.vista && cajaInfo.y >= 0, etiqueta('"¿Es real?" se abre entero dentro de la pantalla'));
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-2-cerebro-es-real.png` });
  await tocar(p, '#btn-cerrar-info');
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-2-cerebro.png` });
  const letraChica = new Set(await p.evaluate(LETRA_CHICA));

  // Pestaña Días
  await tocar(p, '#cel-pestana-dias');
  const dias = await p.evaluate(() => ({
    vista: document.documentElement.dataset.celVista,
    panel: getComputedStyle(document.getElementById('cel-dias')).visibility,
    grafico: document.getElementById('lienzo-dia').getBoundingClientRect().height,
    tabla: Boolean(document.querySelector('#cel-dias #tabla-dias')),
  }));
  revisar(dias.vista === 'dias' && dias.panel === 'visible' && dias.grafico >= 100 && dias.tabla, etiqueta('la pestaña Días muestra el estrés del día y la tabla'));
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-3-dias.png` });

  // Fin del día: aviso con "Ver los días" y "Reiniciar día" (en la oficina)
  await tocar(p, '#cel-pestana-oficina');
  await p.evaluate(() => window.__mosca.completarDia());
  await p.waitForTimeout(500);
  const aviso = await caja(p, '#banner-fin-dia');
  revisar(aviso.visible && aviso.y >= 0 && aviso.abajo <= (await caja(p, '#panel')).y + 1, etiqueta('fin del día: el aviso se ve sobre la oficina'));
  for (const s of ['#cel-ver-dias', '#cel-reiniciar']) {
    const z = await p.evaluate(ZONA_TOQUE, s);
    revisar(z && !z.tapado && z.ancho >= 44 && z.alto >= 44, etiqueta(`zona de toque de ${s}: ${z ? `${z.ancho}×${z.alto}` : 'no está'}`));
  }
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-5-fin-del-dia.png` });
  await tocar(p, '#cel-ver-dias');
  const finDias = await p.evaluate(() => ({
    vista: document.documentElement.dataset.celVista,
    filas: document.querySelectorAll('#tabla-dias-body tr:not(.vacia)').length,
    aviso: getComputedStyle(document.getElementById('banner-fin-dia')).display,
  }));
  revisar(finDias.vista === 'dias' && finDias.filas >= 1 && finDias.aviso === 'none', etiqueta('"Ver los días" lleva a la tabla con el día recién jugado'));
  for (const s of ['.quitar-fila', '#btn-borrar-historial', '.cel-idioma [data-idioma="en"]']) {
    await p.locator(s).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const z = await p.evaluate(ZONA_TOQUE, s);
    revisar(z && !z.tapado && z.ancho >= 44 && z.alto >= 44, etiqueta(`zona de toque de ${s}: ${z ? `${z.ancho}×${z.alto}` : 'no está'}`));
  }
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-6-dias-con-tabla.png` });
  // La pestaña nunca se desliza hacia el lado; desde 320 px la tabla cabe entera
  // (más angosto, con la letra agrandada, se desliza solo la tabla en su marco)
  const ancho = await p.evaluate(() => {
    const d = document.getElementById('cel-dias');
    const m = document.querySelector('.cel-tabla-marco');
    return { dias: d.scrollWidth <= d.clientWidth + 1, tabla: m.scrollWidth <= m.clientWidth + 1, marco: `${m.scrollWidth} de ${m.clientWidth} px` };
  });
  revisar(ancho.dias, etiqueta('la pestaña Días no se desliza hacia el lado'));
  if (medidas.vista >= 320) revisar(ancho.tabla, etiqueta(`la tabla de días cabe a lo ancho (${ancho.marco})`));
  for (const c of await p.evaluate(LETRA_CHICA)) letraChica.add(c);

  // En inglés (botón EN de la pestaña Días): nada en español y nada cortado
  await tocar(p, '.cel-idioma [data-idioma="en"]');
  await p.evaluate(() => window.__mosca.diaExhibicion(9));
  await p.evaluate(() => window.__mosca.adelantar(400));
  await tocar(p, '#cel-pestana-oficina');
  await tocar(p, '#cel-mas');
  await p.waitForTimeout(300);
  const restos = new Set();
  for (const pestana of ['oficina', 'cerebro', 'dias']) {
    await tocar(p, `#cel-pestana-${pestana}`);
    if (pestana === 'oficina') await tocar(p, '#cel-mas');
    for (const t of await p.evaluate(TEXTO_VISIBLE)) for (const w of palabras(t)) if (enEspanol.has(w)) restos.add(`${w} («${t.slice(0, 40)}»)`);
    for (const c of await p.evaluate(LETRA_CHICA)) letraChica.add(c);
    await p.screenshot({ path: `${CAPTURAS}/${nombre}-7-ingles-${pestana}.png` });
  }
  revisar(!restos.size, etiqueta(`en inglés no queda nada en español${restos.size ? `: ${[...restos].slice(0, 6).join('; ')}` : ''}`));
  revisar(!letraChica.size, etiqueta(`toda la letra mide 11 px o más${letraChica.size ? `: ${[...letraChica].slice(0, 6).join('; ')}` : ''}`));
  await tocar(p, '#cel-pestana-oficina');
  await tocar(p, '#cel-mas');
  const cortadasIngles = await p.evaluate(() =>
    [...document.querySelectorAll('.bloque-numeros .metrica, .bloque-numeros > .bloque-fila, .bloque-numeros > .estres, #wip-nota')]
      .filter((t) => t.getClientRects().length && t.scrollWidth > t.clientWidth + 1)
      .map((t) => t.textContent.trim().replace(/\s+/g, ' '))
  );
  revisar(!cortadasIngles.length, etiqueta(`en inglés nada se corta${cortadasIngles.length ? ` (${cortadasIngles.join(' | ')})` : ''}`));
  const sobre = await caja(p, '#ex-mosca');
  revisar(sobre.derecha <= medidas.vista && !chocan(sobre, await caja(p, '#cel-controles')), etiqueta('en inglés el estado de la mosca cabe'));

  // Bajar el límite a mitad del día: la nota más larga cabe en su línea
  await p.evaluate(() => window.__mosca.setWip(2));
  await p.waitForTimeout(300);
  const nota = await p.evaluate(() => {
    const n = document.getElementById('wip-nota');
    return { texto: n.textContent, cabe: n.scrollWidth <= n.clientWidth + 1 };
  });
  revisar(nota.cabe, etiqueta(`la nota "${nota.texto}" cabe en una línea`));
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-8-ingles-bajando.png` });

  revisar(!errores.length, etiqueta(`sin errores${errores.length ? `: ${errores.slice(0, 3).join(' | ')}` : ''}`));
  await contexto.close();
}

// ---------- Un teléfono girado ----------
async function probarGirado(nombre, navegador) {
  const contexto = await navegador.newContext({ ...TELEFONOS[nombre], locale: 'es-CL' });
  const { p, errores } = await abrir(contexto);
  const etiqueta = (t) => `${nombre}: ${t}`;
  await probarEmpezar(p, etiqueta, nombre);
  await p.evaluate(() => {
    window.__mosca.setWip(9);
    window.__mosca.adelantar(300);
  });
  await p.waitForTimeout(400);
  const m = await p.evaluate(() => ({
    activo: window.__mosca.celular().activo,
    ancho: document.documentElement.scrollWidth,
    vista: innerWidth,
    alto: innerHeight,
    escena: document.getElementById('escena').getBoundingClientRect().toJSON(),
    hoja: document.getElementById('panel').getBoundingClientRect().toJSON(),
    hojaDesborda: document.getElementById('panel').scrollHeight > document.getElementById('panel').clientHeight + 1,
  }));
  revisar(m.activo, etiqueta('se enciende el modo celular'));
  revisar(m.ancho <= m.vista, etiqueta(`sin desplazamiento hacia el lado (${m.ancho} de ${m.vista} px)`));
  revisar(Math.abs(m.escena.right - m.hoja.left) <= 1 && m.escena.height >= m.alto - 1, etiqueta(`la oficina a la izquierda a todo lo alto (${Math.round(m.escena.width)}×${Math.round(m.escena.height)})`));
  revisar(!m.hojaDesborda, etiqueta('los controles de la derecha caben sin desplazarse'));
  const pildora = await caja(p, '#cel-controles');
  revisar(pildora.visible && pildora.x >= m.hoja.left && pildora.abajo <= m.alto, etiqueta('la píldora del reloj queda al pie de la columna derecha'));
  const volver = await caja(p, '#cel-volver');
  const pestanas = await caja(p, '#cel-pestanas');
  const estado = await caja(p, '#ex-mosca');
  revisar(!chocan(volver, pestanas) && !chocan(pestanas, estado) && !chocan(volver, estado), etiqueta('volver, las pestañas y el estado de la mosca no chocan'));
  revisar(pestanas.derecha <= m.escena.right, etiqueta('las pestañas caben sobre la oficina'));
  for (const s of ['#cel-volver', '#cel-pestana-oficina', '#cel-pestana-cerebro', '#cel-pestana-dias', '#btn-pausa', '#btn-velocidad', '#btn-reiniciar', '#wip']) {
    const z = await p.evaluate(ZONA_TOQUE, s);
    revisar(z && !z.tapado && z.ancho >= 44 && z.alto >= 44, etiqueta(`zona de toque de ${s}: ${z ? `${z.ancho}×${z.alto}` : 'no está'}`));
  }
  const cortadas = await p.evaluate(() =>
    [...document.querySelectorAll('.bloque-numeros .metrica, .bloque-numeros > .bloque-fila, .bloque-numeros > .estres')]
      .filter((t) => t.getClientRects().length && t.scrollWidth > t.clientWidth + 1)
      .map((t) => t.textContent.trim().replace(/\s+/g, ' '))
  );
  revisar(!cortadas.length, etiqueta(`ningún número se corta${cortadas.length ? ` (${cortadas.join(' | ')})` : ''}`));
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-1-oficina.png` });
  await p.evaluate(() => window.__mosca.camara([3.2, 3.4, 4.6]));
  await p.waitForTimeout(300);
  const vistaInicial = await caja(p, '#btn-vista-inicial');
  const zVista = await p.evaluate(ZONA_TOQUE, '#btn-vista-inicial');
  revisar(
    vistaInicial.visible && vistaInicial.derecha <= m.escena.right && !chocan(vistaInicial, pestanas) && !chocan(vistaInicial, estado),
    etiqueta('"Vista inicial" aparece sin chocar con las pestañas ni con el estado de la mosca')
  );
  revisar(zVista && !zVista.tapado && zVista.ancho >= 44 && zVista.alto >= 44, etiqueta(`zona de toque de #btn-vista-inicial: ${zVista ? `${zVista.ancho}×${zVista.alto}` : 'no está'}`));
  await tocar(p, '#btn-vista-inicial');
  await tocar(p, '#cel-pestana-cerebro');
  await p.waitForTimeout(500);
  const lectura = await caja(p, '.cerebro-lectura');
  const botonesCerebro = await caja(p, '.cerebro-botones');
  const zonas = await caja(p, '.cerebro-zonas');
  const pie = await caja(p, '.cerebro-pie');
  revisar(!chocan(lectura, zonas) && !chocan(botonesCerebro, zonas) && !chocan(zonas, pie) && !chocan(lectura, botonesCerebro), etiqueta('en el cerebro nada choca'));
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-2-cerebro.png` });
  await tocar(p, '#cel-pestana-dias');
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-3-dias.png` });
  await tocar(p, '#cel-pestana-oficina');
  await p.evaluate(() => window.__mosca.completarDia());
  await p.waitForTimeout(400);
  const aviso = await caja(p, '#banner-fin-dia');
  revisar(aviso.visible && aviso.derecha <= m.escena.right + 1 && !chocan(aviso, estado), etiqueta('fin del día: el aviso cabe sobre la oficina'));
  await p.screenshot({ path: `${CAPTURAS}/${nombre}-5-fin-del-dia.png` });
  revisar(!errores.length, etiqueta(`sin errores${errores.length ? `: ${errores.slice(0, 3).join(' | ')}` : ''}`));
  await contexto.close();
}

// ---------- Girar, y dejar de ser celular (un iPad que agranda su ventana) ----------
async function probarCambios(navegador) {
  const contexto = await navegador.newContext({ ...TELEFONOS.iphone14, locale: 'es-CL' });
  const { p, errores } = await abrir(contexto);
  await p.evaluate(() => window.__mosca.empezar()); // el juego parte detenido hasta apretar Empezar
  await p.evaluate(() => window.__mosca.adelantar(120));
  const lugares = () =>
    p.evaluate(() => ({
      activo: window.__mosca.celular().activo,
      reloj: document.getElementById('reloj-texto').parentElement.closest('[id]').id,
      pausa: document.getElementById('btn-pausa').parentElement.className,
      tabla: document.querySelector('.bloque.ultimo').parentElement.id,
      grafico: document.querySelector('.cerebro-dia').parentElement.className,
    }));
  await p.setViewportSize({ width: 664, height: 390 });
  await p.waitForTimeout(400);
  const girado = await p.evaluate(() => ({ activo: window.__mosca.celular().activo, ancho: document.documentElement.scrollWidth, vista: innerWidth }));
  revisar(girado.activo && girado.ancho <= girado.vista, 'girar el iPhone: sigue en modo celular, sin desplazamiento');
  await p.setViewportSize({ width: 390, height: 664 });
  await p.waitForTimeout(400);
  const hoja = await p.evaluate(() => ({
    var: getComputedStyle(document.documentElement).getPropertyValue('--cel-hoja'),
    escena: document.getElementById('escena').getBoundingClientRect().bottom,
    panel: document.getElementById('panel').getBoundingClientRect().top,
  }));
  revisar(Math.abs(hoja.panel - (hoja.escena - 20)) <= 1, `volver a vertical: la hoja vuelve a su lugar (--cel-hoja ${hoja.var})`);
  const antes = await lugares();
  await p.setViewportSize({ width: 1024, height: 768 });
  await p.waitForTimeout(500);
  const despues = await lugares();
  revisar(antes.activo && antes.reloj === 'cel-controles' && antes.tabla === 'cel-dias-tabla', 'en el celular, la hora y la tabla están en su lugar del celular');
  revisar(
    !despues.activo && despues.reloj === 'panel' && /controles/.test(despues.pausa) && despues.tabla === 'panel' && despues.grafico === 'cerebro-cuerpo',
    `al dejar de ser celular todo vuelve a su lugar (${JSON.stringify(despues)})`
  );
  const camara = await p.evaluate(() => window.__mosca.camaraInfo());
  // La cámara oficial: CAMARA_INICIAL de src/layout.js
  const lejos = Math.hypot(camara.pos[0] - 1.55, camara.pos[1] - 2.7, camara.pos[2] - 3.45);
  revisar(lejos < 0.05, `al dejar de ser celular, la oficina vuelve a la cámara oficial (a ${lejos.toFixed(2)})`);
  await p.setViewportSize({ width: 390, height: 664 });
  await p.waitForTimeout(500);
  revisar((await lugares()).reloj === 'cel-controles', 'y al volver a celular, de nuevo como app');
  revisar(!errores.length, `cambios de tamaño sin errores${errores.length ? `: ${errores.slice(0, 3).join(' | ')}` : ''}`);
  await contexto.close();
}

// ---------- Donde NO debe encenderse ----------
async function probarSinCelular(navegador) {
  for (const [nombre, opciones] of [
    ['computador con ventana angosta (390×844, mouse)', { viewport: { width: 390, height: 844 } }],
    ['iPad mini girado (1024×768, táctil)', { ...devices['iPad Mini landscape'] }],
    ['iPad Air girado (1180×820, táctil)', { ...devices['iPad Mini landscape'], viewport: { width: 1180, height: 820 } }],
  ]) {
    const contexto = await navegador.newContext(opciones);
    const { p, errores } = await abrir(contexto);
    const activo = await p.evaluate(() => window.__mosca.celular().activo || document.documentElement.classList.contains('celular'));
    revisar(!activo && !errores.length, `${nombre}: sigue el juego de siempre`);
    await contexto.close();
  }
}

const navegador = await MOTOR.launch({ args: MOTOR === chromium ? ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] : [] });
console.log(`Motor: ${MOTOR === webkit ? 'WebKit (Safari)' : 'Chromium'}`);
for (const nombre of elegidos) {
  console.log(`\n— ${nombre} —`);
  if (/girado/.test(nombre)) await probarGirado(nombre, navegador);
  else await probarVertical(nombre, navegador);
}
if (!process.env.TELEFONOS) {
  console.log('\n— cambios de tamaño —');
  await probarCambios(navegador);
  console.log('\n— donde no va —');
  await probarSinCelular(navegador);
}
await navegador.close();
console.log(fallas.length ? `\ncelular: ${fallas.length} falla(s)` : '\ncelular: todo bien');
process.exit(fallas.length ? 1 : 0);
