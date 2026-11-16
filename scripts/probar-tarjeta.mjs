// Prueba de la tarjeta de inicio (Etapa 8.1, 2026-11-03, pedido de Felipe:
// tres de cuatro lectores de la beta entraron al juego sin entender qué
// buscaban). Antes del primer día, la tarjeta dice que uno es el jefe de la
// mosca y cuál es la misión. Revisa, en español e inglés:
//  1. Control: al abrir, la tarjeta se ve entera (título, tres líneas, el
//     botón "Empezar el día" y "¿Qué es esto?"), entre el cerebro y el panel
//     sin taparlos, con el reloj en 09:00 y el foco en ella (es un diálogo con
//     nombre, para el lector de pantalla);
//  2. mover el control de tareas (tecla 9 y el deslizador) no la cierra ni
//     hace correr el reloj;
//  3. Tab recorre primero el botón y "¿Qué es esto?" y después "← Inicio";
//  4. Enter y Espacio empiezan el día igual que el botón; al empezar la
//     tarjeta se va, y con R o "Reiniciar día" no vuelve;
//  5. en Exhibición no se ve (el reloj igual espera) y al volver a Control
//     reaparece si no se ha empezado;
//  6. "¿Qué es esto?" lleva a la portada en el mismo idioma, sin preguntar;
//     el botón ES | EN la traduce entera;
//  7. celular (iPhone 14, iPhone SE y un Android angosto): entera y dentro de
//     la pantalla, sin chocar con los botones de arriba ni con la hoja, que
//     hasta empezar lleva solo las tareas a la vez; tocar el botón empieza y
//     aparecen los números.
//  8. (8.7, 2026-11-07, pedido de Felipe) la tarjeta dice también lo del
//     cigarro y el café y termina con una pregunta, y en 375 × 667 (y en el
//     iPhone 14 y el Android angosto) entra completa SIN TAPAR A LA MOSCA: la
//     oficina se achica arriba de ella hasta empezar el día, y al empezar la
//     mosca vuelve a su tamaño. En el iPhone SE con las barras de Safari
//     (375 × 548) no hay lugar para las dos: ahí la tarjeta va entera sobre la
//     oficina, como antes.
//  9. (8.8, 2026-11-09, pedido de Felipe: "puro texto duro", "más vivo e
//     infográfico", y "déjalo centrado") cada línea lleva su dibujo y las dos
//     frases largas quedaron en dos líneas cada una; en el computador la
//     tarjeta vuelve al centro del espacio libre entre el cerebro y el panel;
//     trae un segundo botón, "¿Dónde está cada cosa?", que abre el recorrido
//     (lo prueba scripts/probar-recorrido.mjs). En el celular, si arriba de la
//     tarjeta completa no queda lugar cómodo para la mosca, la tarjeta suelta
//     "¿Qué es esto?" y "Al final verás…" (sin-final) y, si todavía no, el
//     recuadro del cigarro y el café (sin-reglas): en los cuatro teléfonos de
//     esta prueba queda como dice ESPERADO, más abajo.
// Deja capturas (español e inglés, computador y celular) en
// docs/etapa8-1-capturas/ (o CAPTURAS=<carpeta>). Requiere npm run dev
// (JUEGO=<dirección> para otra; contra el sitio publicado también sirve).
// Uso: node scripts/probar-tarjeta.mjs   → debe decir "tarjeta: todo bien"
//   NAVEGADOR=webkit  usa el motor de Safari
import { chromium, webkit, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const JUEGO = process.env.JUEGO ?? 'http://localhost:5173/jugar/';
const DIR = process.env.CAPTURAS ?? 'docs/etapa8-1-capturas';
const MOTOR = process.env.NAVEGADOR === 'webkit' ? webkit : chromium;
mkdirSync(DIR, { recursive: true });
const b = await MOTOR.launch(MOTOR === chromium ? { args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] } : {});
const mal = [];
const ok = (cond, msg) => { if (!cond) mal.push(msg); };

// En orden: el título, los tres pasos (decide, mira, al final verás), el
// cigarro y el café, la pregunta, los dos botones y "¿Qué es esto?"
const TEXTOS = {
  es: ['Tú eres el jefe de la mosca.', 'Decide cuántas tareas puede tener empezadas a la vez, de 1 a 10.', 'Mira su día de oficina en un minuto.', 'Al final verás cuánto terminó, cuánto tardó cada tarea y cómo quedó de estrés.', 'Si se estresa, sale a fumar y pierde tiempo.', 'Si no está tan estresada, se toma un café.', 'Prueba un día con 9 y otro con 2. ¿Con cuál crees que termina más?', 'Empezar el día', '¿Dónde está cada cosa?', '¿Qué es esto?'],
  en: ['You’re the fly’s boss.', 'Choose how many tasks she can have started at once, from 1 to 10.', 'Watch her office day in one minute.', 'At the end you’ll see how much she finished, how long each task took and how stressed she ended up.', 'If she gets stressed, she goes out for a smoke and loses time.', 'If she isn’t too stressed, she has a coffee.', 'Try one day with 9 and another with 2. Which one do you think gets more done?', 'Start the day', 'Where is everything?', 'What is this?'],
};
// Lo que se ve de la tarjeta según lo que soltó (las clases que le pone
// src/main.js): las posiciones que quedan en null
const FALTA = { 'sin-final': [3, 9], 'sin-reglas': [4, 5], 'sin-detalle': [3, 4, 5, 9] };
const textosCon = (idioma, clases) => {
  const fuera = new Set(clases.split(' ').filter(Boolean).flatMap((c) => FALTA[c] ?? []));
  return TEXTOS[idioma].map((t, i) => (fuera.has(i) ? null : t));
};
const PORTADA = { es: '/', en: '/en/' };

// Lo que se ve de la tarjeta y dónde está
const leer = (p) => p.evaluate(() => {
  const t = document.getElementById('aviso-empezar');
  const caja = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, d: r.right, b: r.bottom }; };
  // (8.7: sin mirar el atributo hidden, sino si de verdad se dibuja: una regla
  // del celular le ganaba a [hidden] y la tarjeta seguía a la vista)
  const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && el.getBoundingClientRect().width > 0;
  const partes = [t.querySelector('strong'), ...t.querySelectorAll('.aviso-texto p'), ...['#btn-empezar', '#btn-recorrido', '#aviso-que-es'].map((s) => t.querySelector(s))];
  // (8.8) el espacio libre entre el cerebro y el panel, y si cada línea lleva su dibujo
  const borde = (s, lado) => { const el = document.querySelector(s); return visible(el) ? el.getBoundingClientRect()[lado] : null; };
  const libre = [borde('#cerebro', 'right') ?? 0, borde('#panel', 'left') ?? innerWidth];
  const r = caja(t);
  const cruza = (s) => { const el = document.querySelector(s); if (!visible(el)) return false; const q = caja(el); return r.x < q.d && q.x < r.d && r.y < q.b && q.y < r.b; };
  return {
    visible: visible(t),
    textos: partes.map((el) => (visible(el) ? el.textContent.replace(/\s+/g, ' ').trim() : null)),
    dentro: r.x >= 0 && r.y >= 0 && r.d <= innerWidth && r.b <= innerHeight,
    caja: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) },
    // cuánto se aleja su centro del centro del espacio libre (a lo ancho) y del de la pantalla (a lo alto)
    descentrada: [Math.round(r.x + r.w / 2 - (libre[0] + libre[1]) / 2), Math.round(r.y + r.h / 2 - innerHeight / 2)],
    dibujos: [...t.querySelectorAll('.aviso-pasos li, .aviso-reglas li')].filter(visible).every((li) => visible(li.querySelector('.aviso-icono svg'))),
    choca: ['#cerebro', '#panel', '#arriba-izq', '#cel-volver', '#cel-controles', '#cel-pestanas'].filter(cruza),
    foco: document.activeElement?.id,
    rol: t.getAttribute('role'),
    nombre: document.getElementById(t.getAttribute('aria-labelledby') ?? '')?.textContent.trim(),
    describe: !!document.getElementById(t.getAttribute('aria-describedby') ?? ''),
    hora: document.getElementById('reloj-texto').textContent.trim(),
    wip: document.getElementById('wip').value,
    href: document.getElementById('aviso-que-es').getAttribute('href'),
    exhibicion: document.body.classList.contains('exhibicion'),
    numeros: getComputedStyle(document.querySelector('.bloque-numeros')).display !== 'none',
    clases: t.className,
    // (8.7) la caja de la mosca en el último cuadro dibujado (el juego la anota
    // en desarrollo si la prueba prendió window.__cuadrosMosca)
    mosca: (window.__cuadrosMosca || []).filter((c) => c.tipo === 'cuadro').at(-1)?.mosca ?? null,
  };
});
// ¿La tarjeta tapa a la mosca? (con 4 px de holgura)
const tapaMosca = (e) => !!e.mosca && e.caja.x < e.mosca[2] - 4 && e.mosca[0] + 4 < e.caja.x + e.caja.w && e.caja.y < e.mosca[3] - 4 && e.mosca[1] + 4 < e.caja.y + e.caja.h;
const abrir = async (ctx, idioma, tag) => {
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__cuadrosMosca = []; });
  p.on('pageerror', (e) => mal.push(`error ${tag}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') mal.push(`consola ${tag}: ${m.text()}`); });
  p.on('dialog', (d) => { mal.push(`${tag}: apareció un diálogo del navegador: ${d.message()}`); d.dismiss(); });
  await p.goto(JUEGO + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
  await p.waitForSelector('#btn-empezar', { state: 'visible' });
  await p.waitForTimeout(1200);
  return p;
};
const esperarQueCorra = async (p, h0 = '09:00') => {
  await p.waitForTimeout(1800);
  return (await leer(p)).hora !== h0;
};

// ---------- Computador ----------
for (const idioma of ['es', 'en']) {
  const tag = `computador ${idioma}`;
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  let p = await abrir(ctx, idioma, tag);
  let e = await leer(p);
  ok(e.visible && e.dentro && !e.choca.length, `${tag}: la tarjeta debe verse entera y sin tapar los paneles (${JSON.stringify(e.caja)}, choca con ${e.choca.join(', ') || 'nada'})`);
  ok(JSON.stringify(e.textos) === JSON.stringify(TEXTOS[idioma]), `${tag}: textos de la tarjeta: ${JSON.stringify(e.textos)}`);
  // (8.8) al centro del espacio libre y cada línea con su dibujo
  ok(Math.abs(e.descentrada[0]) <= 2 && Math.abs(e.descentrada[1]) <= 2, `${tag}: la tarjeta debe ir al centro del espacio libre (se aleja ${e.descentrada[0]} px a lo ancho y ${e.descentrada[1]} px a lo alto)`);
  ok(e.dibujos, `${tag}: cada línea de la tarjeta debe llevar su dibujo`);
  ok(e.hora === '09:00', `${tag}: al entrar el reloj debe estar en 09:00 (${e.hora})`);
  ok(e.foco === 'aviso-empezar' && e.rol === 'dialog' && e.nombre === TEXTOS[idioma][0] && e.describe, `${tag}: el foco debe estar en la tarjeta, un diálogo con nombre (foco: ${e.foco}, rol: ${e.rol}, nombre: ${e.nombre})`);
  ok(e.href === PORTADA[idioma], `${tag}: "¿Qué es esto?" lleva a ${e.href}, no a ${PORTADA[idioma]}`);
  console.log(`${tag}: tarjeta de ${e.caja.w}×${e.caja.h} en (${e.caja.x}, ${e.caja.y})`);
  await p.screenshot({ path: `${DIR}/control-${idioma}.png` });
  // 2. el control de tareas se mueve sin cerrarla
  await p.keyboard.press('9'); await p.waitForTimeout(600);
  await p.$eval('#wip', (el) => { el.value = '8'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(1500);
  e = await leer(p);
  ok(e.visible && e.wip === '8' && e.hora === '09:00', `${tag}: mover el control de tareas no debe cerrar la tarjeta ni hacer correr el reloj (wip ${e.wip}, ${e.hora}, visible ${e.visible})`);
  // 3. Tab: botón, "¿Dónde está cada cosa?" (8.8), "¿Qué es esto?", "← Inicio"
  const tabs = [];
  for (let i = 0; i < 4; i++) { await p.keyboard.press(MOTOR === webkit ? 'Alt+Tab' : 'Tab'); tabs.push(await p.evaluate(() => document.activeElement?.id)); }
  ok(tabs.join(' ') === 'btn-empezar btn-recorrido aviso-que-es volver-inicio', `${tag}: con Tab se esperaba botón → ¿Dónde está cada cosa? → ¿Qué es esto? → ← Inicio y fue ${tabs.join(' → ')}`);
  // 5. Exhibición: no se ve; el reloj espera; al volver reaparece
  await p.mouse.click(720, 880); await p.waitForTimeout(300);
  await p.keyboard.press('e'); await p.waitForTimeout(1200);
  e = await leer(p);
  ok(e.exhibicion && !e.visible && e.hora === '09:00', `${tag}: en Exhibición la tarjeta no va y el reloj espera (exhibición ${e.exhibicion}, visible ${e.visible}, ${e.hora})`);
  if (idioma === 'es') { await p.mouse.move(700, 880); await p.waitForTimeout(400); await p.screenshot({ path: `${DIR}/exhibicion-sin-tarjeta.png` }); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(1200);
  e = await leer(p);
  ok(!e.exhibicion && e.visible && e.hora === '09:00', `${tag}: al volver a Control la tarjeta reaparece (${e.visible}, ${e.hora})`);
  // 4a. Enter empieza el día (con el foco fuera de los botones)
  await p.evaluate(() => document.getElementById('aviso-empezar').focus());
  await p.keyboard.press('Enter');
  ok(await esperarQueCorra(p), `${tag}: Enter debe empezar el día`);
  e = await leer(p);
  ok(!e.visible, `${tag}: al empezar la tarjeta debe irse`);
  // 4b. R y "Reiniciar día": no vuelve
  await p.keyboard.press('r'); await p.waitForTimeout(800);
  ok(!(await leer(p)).visible, `${tag}: con R la tarjeta no debe volver`);
  await p.click('#btn-reiniciar'); await p.waitForTimeout(800);
  ok(!(await leer(p)).visible, `${tag}: con "Reiniciar día" la tarjeta no debe volver`);
  // 4c. Espacio empieza; el botón también
  await p.close();
  p = await abrir(ctx, idioma, tag);
  await p.keyboard.press('Space');
  ok(await esperarQueCorra(p), `${tag}: Espacio debe empezar el día`);
  await p.close();
  p = await abrir(ctx, idioma, tag);
  await p.click('#btn-empezar');
  ok(await esperarQueCorra(p), `${tag}: el botón debe empezar el día`);
  ok(!(await leer(p)).visible, `${tag}: el botón debe sacar la tarjeta`);
  // 6. ES | EN traduce la tarjeta entera; "¿Qué es esto?" lleva a la portada sin preguntar
  await p.close();
  p = await abrir(ctx, idioma, tag);
  const otro = idioma === 'es' ? 'en' : 'es';
  await p.click(`#cerebro [data-idioma="${otro}"]`); await p.waitForTimeout(800);
  e = await leer(p);
  ok(JSON.stringify(e.textos) === JSON.stringify(TEXTOS[otro]) && e.href === PORTADA[otro] && e.visible, `${tag}: con el botón ES | EN la tarjeta debe quedar en ${otro} (${JSON.stringify(e.textos)}, ${e.href})`);
  await p.click(`#cerebro [data-idioma="${idioma}"]`); await p.waitForTimeout(800);
  await p.click('#aviso-que-es');
  await p.waitForURL((u) => u.pathname === '/' || u.pathname === '/en/', { timeout: 10000 }).catch(() => {});
  const u = new URL(p.url());
  ok(u.pathname === PORTADA[idioma] && !(await p.evaluate(() => !!document.getElementById('salir-juego')?.open)), `${tag}: "¿Qué es esto?" debía llevar a ${PORTADA[idioma]} sin preguntar y llegó a ${u.pathname}`);
  await ctx.close();
}

// ---------- Celular ----------
const tel = (w, h, dpr, ua) => ({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, userAgent: ua, locale: 'es-CL' });
const TELEFONOS = {
  iphone14: tel(390, 664, 3, devices['iPhone 14'].userAgent),
  'iphone-se-667': tel(375, 667, 2, devices['iPhone 14'].userAgent), // (8.7) el tamaño del pedido
  'iphone-se': tel(375, 548, 2, devices['iPhone 14'].userAgent),
  'android-angosto': tel(320, 658, 4.5, devices['Pixel 7'].userAgent),
};
// dónde la tarjeta no debe tapar a la mosca (en el iPhone SE con las barras de Safari no cabe)
const SIN_TAPAR = ['iphone14', 'iphone-se-667', 'android-angosto'];
// (8.8) lo que la tarjeta suelta en cada teléfono para dejarle su lugar a la
// mosca (en el iPhone SE con las barras de Safari no hay lugar para las dos:
// ahí va sobre la oficina, como siempre, con lo más que cabe entre los botones
// de arriba y la hoja)
const ESPERADO = { iphone14: 'sin-final', 'iphone-se-667': 'sin-final', 'iphone-se': 'sin-final', 'android-angosto': 'sin-final sin-reglas' };
for (const [nombre, d] of Object.entries(TELEFONOS)) for (const idioma of ['iphone14', 'iphone-se-667'].includes(nombre) ? ['es', 'en'] : ['es']) {
  const tag = `${nombre} ${idioma}`;
  const ctx = await b.newContext(d);
  const p = await abrir(ctx, idioma, tag);
  await p.waitForFunction(() => document.documentElement.classList.contains('celular'));
  let e = await leer(p);
  const altoConTarjeta = e.mosca ? e.mosca[3] - e.mosca[1] : 0;
  ok(e.visible && e.dentro && !e.choca.length, `${tag}: la tarjeta debe verse entera y sin chocar (${JSON.stringify(e.caja)}, choca con ${e.choca.join(', ') || 'nada'})`);
  ok(e.clases === ESPERADO[nombre] && JSON.stringify(e.textos) === JSON.stringify(textosCon(idioma, e.clases)), `${tag}: la tarjeta debía quedar «${ESPERADO[nombre]}» con sus textos (quedó «${e.clases}»: ${JSON.stringify(e.textos)})`);
  ok(e.dibujos, `${tag}: cada línea de la tarjeta debe llevar su dibujo`);
  ok(!e.numeros, `${tag}: hasta empezar la hoja lleva solo las tareas a la vez`);
  ok(e.hora === '09:00' && e.href === PORTADA[idioma], `${tag}: reloj ${e.hora}, enlace ${e.href}`);
  if (SIN_TAPAR.includes(nombre)) ok(e.mosca && !tapaMosca(e), `${tag}: la tarjeta no debe tapar a la mosca (tarjeta ${JSON.stringify(e.caja)}, mosca ${JSON.stringify(e.mosca)})`);
  console.log(`${tag}: tarjeta de ${e.caja.w}×${e.caja.h} en (${e.caja.x}, ${e.caja.y}) de ${d.viewport.width}×${d.viewport.height}; mosca en ${JSON.stringify(e.mosca?.map(Math.round))}`);
  await p.screenshot({ path: `${DIR}/celular-${nombre}-${idioma}.png` });
  // mover el deslizador con el dedo no la cierra
  const r = await p.$eval('#wip', (el) => el.getBoundingClientRect());
  await p.touchscreen.tap(r.x + r.width * 0.9, r.y + r.height / 2); await p.waitForTimeout(1200);
  e = await leer(p);
  ok(e.visible && e.wip !== '3' && e.hora === '09:00', `${tag}: tocar el deslizador no debe cerrar la tarjeta (wip ${e.wip}, ${e.hora}, visible ${e.visible})`);
  await p.tap('#btn-empezar');
  ok(await esperarQueCorra(p), `${tag}: tocar "Empezar el día" debe empezar`);
  e = await leer(p);
  ok(!e.visible && e.numeros, `${tag}: al empezar se va la tarjeta y aparecen los números (visible ${e.visible}, números ${e.numeros})`);
  // (8.7) y la mosca vuelve a su tamaño: más alta que con la tarjeta
  if (SIN_TAPAR.includes(nombre)) {
    await p.waitForTimeout(700);
    const despues = await leer(p);
    const alto = despues.mosca ? despues.mosca[3] - despues.mosca[1] : 0;
    // (8.8: con la tarjeta sin el recuadro del cigarro y el café, en el Android
    // angosto la mosca ya parte más grande: crece 1,7 veces, antes 1,8 o más)
    ok(alto > 1.5 * altoConTarjeta, `${tag}: al empezar la mosca debe volver a su tamaño (de ${Math.round(altoConTarjeta)} a ${Math.round(alto)} px de alto)`);
  }
  if (nombre === 'iphone14' && idioma === 'es') await p.screenshot({ path: `${DIR}/celular-iphone14-empezado.png` });
  await ctx.close();
}

await b.close();
if (mal.length) { console.log('PROBLEMAS:\n - ' + mal.join('\n - ')); process.exit(1); }
console.log('tarjeta: todo bien');
