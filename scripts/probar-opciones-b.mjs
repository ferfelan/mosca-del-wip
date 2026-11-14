// EN PRUEBA (Etapa 8.13, 2026-11-14). Prueba las opciones 4, 5 y 6 del inicio
// de la portada. Felipe vio las tres primeras (las prueba
// node scripts/probar-opciones.mjs) y pidió tres más con otro mensaje, porque
// el de 9 y 2 a la vez ya sale tres veces en la página. Cuando él elija, esta
// prueba se queda solo con la opción elegida o se borra.
// Revisa, en español y en inglés:
//  1. con ?portada=4, 5 o 6 se ve solo esa, con la barrita de seis;
//  2. opción 4 (tu número): parte en 1, los botones suman y quitan de 1 a 10,
//     también con el teclado; hay tantas tarjetas a la vista como dice el
//     número; al quedar quietas ninguna queda abajo al centro; el movimiento
//     dura menos de 5 segundos; el número se le avisa en una frase a quien usa
//     lector de pantalla; en 10 dice "10+" y no pasa de ahí;
//  3. opción 5 (un día en un minuto): parte sola, el cronómetro avanza a tiempo
//     de verdad, el botón pausa y sigue (también con el teclado), se detiene
//     cuando sale de la pantalla, termina en 1:00 y "Ver de nuevo" la repite;
//  4. opción 6 (¿te suena?): llegan los ocho pedidos, una vez, en menos de 5
//     segundos; la mosca pasa de tranquila a apurada y a colapsada; "Ver de
//     nuevo" lo repite, también con el teclado;
//  5. nada cambia de tamaño mientras se mueve;
//  6. con "reducir movimiento" no se mueve nada, y sin JavaScript se ve cada
//     dibujo quieto y sin botones que no sirven;
//  7. a 21 anchos de pantalla, nada se sale de su tarjeta ni hay desborde;
//  8. que no haya errores en la consola.
// Uso: node scripts/probar-opciones-b.mjs [dirección]   (con npm run dev, con
// npx vite preview o la dirección de prueba; NAVEGADOR=webkit usa el motor de
// Safari). Debe decir "opciones nuevas del inicio: todo bien".
import { chromium, webkit } from 'playwright';

const BASE = (process.argv[2] || 'http://localhost:5173/').replace(/\/?$/, '/');
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const ES_WEBKIT = process.env.NAVEGADOR === 'webkit';
const ESPERA = 30000;

const TEXTOS = {
  es: {
    ruta: '',
    barra: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4', 'Opción 5', 'Opción 6'],
    una: /^Tienes 1 cosa empezada\.$/,
    varias: (n) => new RegExp(`^Tienes ${n} cosas empezadas\\.$`),
    tope: /^Tienes 10 o más cosas empezadas\.$/,
    es: /^Ese número es tu WIP, tu trabajo en curso\.$/,
    pausar: 'Pausar',
    seguir: 'Seguir',
    deNuevo: 'Ver de nuevo',
    pedidos: ['¿Tienes un minuto?', 'Es urgente', '¿Cómo va lo mío?', 'Esto es para hoy', 'Una cosita rápida', '¿Lo viste?', 'También es urgente', '¿Y lo de ayer?'],
  },
  en: {
    ruta: 'en/',
    barra: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6'],
    una: /^You have 1 thing started\.$/,
    varias: (n) => new RegExp(`^You have ${n} things started\\.$`),
    tope: /^You have 10 or more things started\.$/,
    es: /^That number is your WIP, your work in progress\.$/,
    pausar: 'Pause',
    seguir: 'Resume',
    deNuevo: 'Watch again',
    pedidos: ['Got a minute?', 'It’s urgent', 'How’s mine going?', 'This is for today', 'One quick thing', 'Did you see it?', 'This is urgent too', 'And yesterday’s?'],
  },
};
const ANCHOS = [320, 344, 360, 375, 390, 414, 430, 480, 540, 600, 768, 820, 899, 900, 960, 1024, 1100, 1280, 1440, 1920, 2560];

let fallas = 0;
function revisar(bien, mensaje) {
  if (bien) return;
  fallas++;
  console.log(`  FALLA  ${mensaje}`);
}

const navegador = ES_WEBKIT ? await webkit.launch() : await chromium.launch();

async function abrir(ruta, opciones = {}) {
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, ...opciones });
  if (LOCAL) await contexto.route('**/_vercel/insights/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await pagina.goto(BASE + ruta, { waitUntil: 'load' });
  return { contexto, pagina, errores };
}

const queSeVe = (pagina) =>
  pagina.evaluate(() => ({
    visibles: [...document.querySelectorAll('.escena[data-opcion]')].filter((e) => e.getClientRects().length > 0).map((e) => e.dataset.opcion),
    barra: [...document.querySelectorAll('.opciones a')].map((a) => a.textContent),
    marcada: document.querySelector('.opciones a[aria-current="true"]')?.textContent ?? null,
  }));

// Lo que se ve en la opción 4 en este momento
const leerCuenta = (pagina) =>
  pagina.evaluate(() => {
    const raiz = document.querySelector('.cuenta');
    const seVe = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const caja = raiz.getBoundingClientRect();
    const cartas = [...raiz.querySelectorAll('[data-carta]')].filter((c) => !c.classList.contains('fuera'));
    return {
      viva: raiz.classList.contains('viva'),
      estado: raiz.dataset.estado,
      llama: raiz.hasAttribute('data-llama'),
      numero: raiz.querySelector('[data-numero]').textContent,
      cartas: cartas.length,
      // dónde está cada tarjeta, en las unidades del dibujo
      lugares: cartas.map((c) => (c.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/) || []).slice(1).map(Number)),
      quitar: raiz.querySelector('[data-quitar]').getAttribute('aria-disabled'),
      sumar: raiz.querySelector('[data-sumar]').getAttribute('aria-disabled'),
      mando: seVe(raiz.querySelector('.cuenta-mando')),
      frases: [...raiz.querySelectorAll('[data-forma]')].filter((f) => f.getClientRects().length > 0).map((f) => f.textContent.trim().replace(/\s+/g, ' ')),
      avisa: raiz.querySelector('[data-resultado]').getAttribute('aria-live'),
      es: raiz.querySelector('.cuenta-es').textContent.trim().replace(/\s+/g, ' '),
      reto: seVe(raiz.querySelector('.cuenta-reto')),
      caja: `${Math.round(caja.width)}x${Math.round(caja.height)}`,
    };
  });

// Lo que se ve en la opción 5 en este momento
const leerMinuto = (pagina) =>
  pagina.evaluate(() => {
    const raiz = document.querySelector('.minuto');
    const seVe = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const caja = raiz.getBoundingClientRect();
    return {
      viva: raiz.classList.contains('viva'),
      estado: raiz.dataset.estado,
      crono: raiz.querySelector('[data-crono]').textContent,
      va: window.__mosca?.minuto?.va() ?? null,
      boton: seVe(raiz.querySelector('[data-boton]')),
      dice: [...raiz.querySelectorAll('.minuto-boton-cara')].filter(seVe).map((c) => c.textContent.trim()),
      dia: raiz.style.getPropertyValue('--dia'),
      hora: raiz.querySelector('[data-hora]').style.transform,
      caja: `${Math.round(caja.width)}x${Math.round(caja.height)}`,
    };
  });

// Lo que se ve en la opción 6 en este momento
const leerSuena = (pagina) =>
  pagina.evaluate(() => {
    const raiz = document.querySelector('.suena');
    const seVe = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const caja = raiz.getBoundingClientRect();
    const globos = [...raiz.querySelectorAll('[data-globo]')];
    return {
      viva: raiz.classList.contains('viva'),
      estado: raiz.dataset.estado,
      animo: raiz.dataset.animo,
      llegaron: globos.filter((g) => g.classList.contains('llego')).length,
      opacos: globos.filter((g) => Number(getComputedStyle(g).opacity) > 0.5).length,
      pedidos: globos.map((g) => g.textContent.trim()),
      lista: raiz.querySelector('.globos').getAttribute('aria-label'),
      boton: seVe(raiz.querySelector('[data-denuevo]')),
      caja: `${Math.round(caja.width)}x${Math.round(caja.height)}`,
    };
  });

// Sigue el dibujo mientras se mueve: junta cada cambio (con su hora) hasta que queda como se espera
async function seguir(pagina, leer, clave, listo) {
  const pasos = [];
  const desde = Date.now();
  let ultimo = '';
  while (Date.now() - desde < ESPERA) {
    const v = await leer(pagina);
    const k = clave(v);
    if (k !== ultimo) pasos.push({ ...v, ms: Date.now() - desde });
    ultimo = k;
    if (listo(v)) return pasos;
    await pagina.waitForTimeout(40);
  }
  return pasos;
}

for (const [idioma, t] of Object.entries(TEXTOS)) {
  console.log(`\n${idioma === 'es' ? 'Español' : 'Inglés'}`);

  // 1. Cuál se ve
  {
    const { contexto, pagina, errores } = await abrir(t.ruta);
    for (const n of ['4', '5', '6']) {
      await pagina.goto(`${BASE}${t.ruta}?portada=${n}`, { waitUntil: 'load' });
      const v = await queSeVe(pagina);
      revisar(v.visibles.join() === n, `con ?portada=${n} se ve ${v.visibles.join() || 'ninguna'}`);
      revisar(v.barra.join() === t.barra.join() && v.marcada === t.barra[n - 1], `con ?portada=${n} la barrita dice ${v.barra.join(' · ')} y marca ${v.marcada}`);
    }
    revisar(errores.length === 0, `errores al cambiar de opción: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
  }

  // 2 y 5. Opción 4: tu número
  {
    const { contexto, pagina, errores } = await abrir(`${t.ruta}?portada=4`);
    const cajas = new Set();
    // la primera vez da su vuelta y queda quieta en menos de 5 segundos
    let pasos = await seguir(pagina, leerCuenta, (v) => `${v.estado}|${v.llama}`, (v) => v.estado === 'quieta' && v.llama);
    const anduvo = pasos.find((p) => p.estado === 'andando');
    const quedo = pasos[pasos.length - 1];
    revisar(Boolean(anduvo) && quedo.estado === 'quieta', `opción 4: al verse no dio su vuelta (estados ${pasos.map((p) => p.estado).join(' → ')})`);
    if (anduvo) revisar(quedo.ms - anduvo.ms < 5000, `opción 4: la primera vuelta duró ${quedo.ms - anduvo.ms} ms (tiene que durar menos de 5 segundos)`);
    let v = await leerCuenta(pagina);
    cajas.add(v.caja);
    revisar(v.viva && v.numero === '1' && v.cartas === 1 && v.quitar === 'true' && v.sumar === 'false' && v.mando, `opción 4 al partir: número ${v.numero}, ${v.cartas} tarjetas, quitar apagado ${v.quitar}, sumar apagado ${v.sumar}`);
    revisar(t.es.test(v.es) && v.reto, `opción 4, frase del WIP: "${v.es}"`);
    // quitar en 1 no hace nada (el botón está apagado: el clic se le da igual, a la fuerza)
    await pagina.click('.cuenta [data-quitar]', { force: true });
    v = await leerCuenta(pagina);
    revisar(v.numero === '1' && v.cartas === 1, `opción 4: quitar en 1 dejó ${v.numero}`);
    // sumar con clic hasta 4
    for (let k = 0; k < 3; k++) await pagina.click('.cuenta [data-sumar]');
    v = await leerCuenta(pagina);
    cajas.add(v.caja);
    revisar(v.numero === '4' && v.cartas === 4 && !v.llama && v.quitar === 'false', `opción 4 tras sumar tres: número ${v.numero}, ${v.cartas} tarjetas`);
    revisar(v.avisa === 'polite' && v.frases.length === 1 && t.varias(4).test(v.frases[0]), `opción 4: la frase para el lector dice "${v.frases.join(' / ')}" y avisa ${v.avisa}`);
    pasos = await seguir(pagina, leerCuenta, (x) => x.estado, (x) => x.estado === 'quieta');
    revisar(pasos[pasos.length - 1].ms < 5000, `opción 4: tras el toque siguió moviéndose ${pasos[pasos.length - 1].ms} ms`);
    v = await leerCuenta(pagina);
    // quietas: repartidas igual a los dos lados y ninguna abajo al centro
    const suma = v.lugares.reduce((a, [x]) => a + (x - 300), 0);
    const abajo = v.lugares.filter(([x, y]) => Math.abs(x - 300) < 14 && y > 96).length;
    revisar(Math.abs(suma) < 2 && abajo === 0, `opción 4 con 4 quietas: desequilibrio ${suma.toFixed(1)}, ${abajo} abajo al centro (${v.lugares.map((l) => l.join(',')).join(' · ')})`);
    // con el teclado hasta 10, y no pasa de ahí
    await pagina.focus('.cuenta [data-sumar]');
    for (let k = 0; k < 8; k++) await pagina.keyboard.press('Enter');
    v = await leerCuenta(pagina);
    cajas.add(v.caja);
    revisar(v.numero === '10+' && v.cartas === 10 && v.sumar === 'true' && v.frases.length === 1 && t.tope.test(v.frases[0]), `opción 4 en el tope: número ${v.numero}, ${v.cartas} tarjetas, sumar apagado ${v.sumar}, frase "${v.frases.join(' / ')}"`);
    const enfocado = await pagina.evaluate(() => document.activeElement?.hasAttribute('data-sumar'));
    revisar(enfocado, 'opción 4: al llegar a 10 el botón de sumar perdió el foco del teclado');
    // quitar con el teclado hasta 1
    await pagina.focus('.cuenta [data-quitar]');
    for (let k = 0; k < 9; k++) await pagina.keyboard.press('Space');
    v = await leerCuenta(pagina);
    cajas.add(v.caja);
    revisar(v.numero === '1' && v.cartas === 1 && v.quitar === 'true' && t.una.test(v.frases[0] || ''), `opción 4 de vuelta en 1: número ${v.numero}, ${v.cartas} tarjetas, frase "${v.frases.join(' / ')}"`);
    await pagina.click('.cuenta [data-sumar]');
    await pagina.click('.cuenta [data-sumar]');
    pasos = await seguir(pagina, leerCuenta, (x) => x.estado, (x) => x.estado === 'quieta');
    v = await leerCuenta(pagina);
    const arriba = v.lugares.filter(([x, y]) => Math.abs(x - 300) < 2 && y < 40).length;
    revisar(v.cartas === 3 && arriba === 1, `opción 4 con 3 quietas: ${arriba} arriba al centro (${v.lugares.map((l) => l.join(',')).join(' · ')})`);
    revisar(cajas.size === 1, `opción 4: la tarjeta cambió de tamaño (${[...cajas].join(' · ')})`);
    revisar(errores.length === 0, `errores en la opción 4: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
  }

  // 3 y 5. Opción 5: un día de oficina en un minuto
  {
    const { contexto, pagina, errores } = await abrir(`${t.ruta}?portada=5`);
    const cajas = new Set();
    await pagina.waitForFunction(() => document.querySelector('.minuto').dataset.estado === 'andando', null, { timeout: ESPERA }).catch(() => {});
    let a = await leerMinuto(pagina);
    cajas.add(a.caja);
    revisar(a.viva && a.estado === 'andando' && a.boton && a.dice.join() === t.pausar, `opción 5 al partir: ${a.estado}, botón "${a.dice.join()}"`);
    // el cronómetro va a tiempo de verdad
    const t0 = Date.now();
    await pagina.waitForTimeout(3000);
    let b = await leerMinuto(pagina);
    const real = (Date.now() - t0) / 60000;
    const razon = (b.va - a.va) / real;
    revisar(razon > 0.8 && razon < 1.12, `opción 5: en ${Math.round(real * 60000)} ms el día avanzó ${((b.va - a.va) * 60).toFixed(2)} s (razón ${razon.toFixed(2)}, tiene que ser cerca de 1)`);
    revisar(/^0:0[2-5]$/.test(b.crono), `opción 5: a los 3 segundos el cronómetro dice ${b.crono}`);
    // pausa con clic
    await pagina.click('.minuto [data-boton]');
    a = await leerMinuto(pagina);
    await pagina.waitForTimeout(700);
    b = await leerMinuto(pagina);
    cajas.add(b.caja);
    revisar(b.estado === 'pausada' && b.va === a.va && b.dice.join() === t.seguir, `opción 5 en pausa: ${b.estado}, avanzó ${(b.va - a.va).toFixed(4)}, botón "${b.dice.join()}"`);
    // sigue con el teclado
    await pagina.focus('.minuto [data-boton]');
    await pagina.keyboard.press('Enter');
    await pagina.waitForTimeout(500);
    a = await leerMinuto(pagina);
    revisar(a.estado === 'andando' && a.va > b.va && a.dice.join() === t.pausar, `opción 5 al seguir: ${a.estado}, botón "${a.dice.join()}"`);
    // fuera de la pantalla se detiene, y sigue al volver
    await pagina.evaluate(() => scrollTo({ top: 2600, behavior: 'instant' }));
    await pagina.waitForTimeout(400);
    a = await leerMinuto(pagina);
    await pagina.waitForTimeout(800);
    b = await leerMinuto(pagina);
    revisar(b.va - a.va < 0.002, `opción 5 fuera de la pantalla: siguió avanzando ${((b.va - a.va) * 60).toFixed(2)} s`);
    await pagina.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await pagina.waitForTimeout(900);
    a = await leerMinuto(pagina);
    revisar(a.va > b.va && a.estado === 'andando', `opción 5 al volver a la pantalla: no siguió (${a.estado})`);
    // el final del día
    await pagina.evaluate(() => window.__mosca.minuto.irA(0.996));
    await pagina.click('.minuto [data-boton]');
    await pagina.waitForFunction(() => document.querySelector('.minuto').dataset.estado === 'quieta', null, { timeout: ESPERA }).catch(() => {});
    b = await leerMinuto(pagina);
    cajas.add(b.caja);
    revisar(b.estado === 'quieta' && b.crono === '1:00' && Number(b.dia) === 1 && b.hora === 'rotate(540deg)' && b.dice.join() === t.deNuevo, `opción 5 al terminar: ${b.estado}, cronómetro ${b.crono}, día ${b.dia}, reloj ${b.hora}, botón "${b.dice.join()}"`);
    // de nuevo
    await pagina.click('.minuto [data-boton]');
    await pagina.waitForTimeout(600);
    a = await leerMinuto(pagina);
    cajas.add(a.caja);
    revisar(a.estado === 'andando' && a.va < 0.05 && /^0:0[01]$/.test(a.crono), `opción 5 al ver de nuevo: ${a.estado}, cronómetro ${a.crono}`);
    revisar(cajas.size === 1, `opción 5: la tarjeta cambió de tamaño (${[...cajas].join(' · ')})`);
    revisar(errores.length === 0, `errores en la opción 5: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
  }

  // 4 y 5. Opción 6: ¿te suena?
  {
    const { contexto, pagina, errores } = await abrir(`${t.ruta}?portada=6`);
    const cajas = new Set();
    let pasos = await seguir(pagina, leerSuena, (v) => `${v.estado}|${v.llegaron}|${v.animo}`, (v) => v.estado === 'quieta');
    for (const p of pasos) cajas.add(p.caja);
    const cuentas = pasos.map((p) => p.llegaron);
    const anduvo = pasos.find((p) => p.estado === 'andando');
    const fin = pasos[pasos.length - 1];
    revisar(cuentas.every((c, i) => i === 0 || c >= cuentas[i - 1]) && fin.llegaron === 8, `opción 6: los pedidos no llegaron de a uno hasta 8 (${cuentas.join(' ')})`);
    revisar(Boolean(anduvo) && fin.ms - anduvo.ms < 5000, `opción 6: duró ${anduvo ? fin.ms - anduvo.ms : '?'} ms (tiene que durar menos de 5 segundos)`);
    const animos = [...new Set(pasos.map((p) => p.animo))].join(' → ');
    revisar(animos === 'tranquila → apurada → colapsada', `opción 6: la mosca pasó por ${animos}`);
    await pagina.waitForTimeout(500);
    let v = await leerSuena(pagina);
    cajas.add(v.caja);
    revisar(v.opacos === 8 && v.boton && v.animo === 'colapsada', `opción 6 al quedar quieta: ${v.opacos} pedidos a la vista, botón ${v.boton ? 'a la vista' : 'escondido'}, ${v.animo}`);
    revisar(v.pedidos.join('|') === t.pedidos.join('|') && Boolean(v.lista), `opción 6, pedidos: ${v.pedidos.join(' | ')}`);
    // de nuevo, con el teclado
    await pagina.focus('.suena [data-denuevo]');
    await pagina.keyboard.press('Enter');
    pasos = await seguir(pagina, leerSuena, (x) => `${x.estado}|${x.llegaron}`, (x) => x.estado === 'quieta' && x.llegaron === 8);
    for (const p of pasos) cajas.add(p.caja);
    revisar(pasos.some((p) => p.llegaron <= 1) && pasos[pasos.length - 1].llegaron === 8, `opción 6 al ver de nuevo: ${pasos.map((p) => p.llegaron).join(' ')}`);
    revisar(cajas.size === 1, `opción 6: la tarjeta cambió de tamaño (${[...cajas].join(' · ')})`);
    revisar(errores.length === 0, `errores en la opción 6: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
  }

  // 6. Con "reducir movimiento" y sin JavaScript
  {
    const { contexto, pagina } = await abrir(`${t.ruta}?portada=4`, { reducedMotion: 'reduce' });
    await pagina.waitForTimeout(500);
    let c = await leerCuenta(pagina);
    revisar(c.viva && c.estado === 'quieta' && c.numero === '1' && !c.llama, `opción 4 con reducir movimiento: ${c.estado}, número ${c.numero}`);
    await pagina.click('.cuenta [data-sumar]');
    c = await leerCuenta(pagina);
    revisar(c.estado === 'quieta' && c.numero === '2' && c.cartas === 2, `opción 4 con reducir movimiento, tras sumar: ${c.estado}, número ${c.numero} (tiene que cambiar de una vez)`);
    await pagina.goto(`${BASE}${t.ruta}?portada=5`, { waitUntil: 'load' });
    await pagina.waitForTimeout(500);
    const m = await leerMinuto(pagina);
    revisar(m.estado === 'quieta' && m.crono === '1:00' && !m.boton, `opción 5 con reducir movimiento: ${m.estado}, cronómetro ${m.crono}, botón ${m.boton ? 'a la vista' : 'escondido'}`);
    await pagina.goto(`${BASE}${t.ruta}?portada=6`, { waitUntil: 'load' });
    await pagina.waitForTimeout(500);
    const s = await leerSuena(pagina);
    revisar(s.estado === 'quieta' && s.opacos === 8 && s.animo === 'colapsada' && !s.boton, `opción 6 con reducir movimiento: ${s.estado}, ${s.opacos} pedidos, ${s.animo}, botón ${s.boton ? 'a la vista' : 'escondido'}`);
    await contexto.close();
  }
  {
    // (sin JavaScript no corre el script que elige la opción: se muestran a mano, para ver cómo quedan quietas)
    const { contexto, pagina } = await abrir(t.ruta, { javaScriptEnabled: false });
    await pagina.evaluate(() => {
      const estilo = document.createElement('style');
      estilo.textContent = '.escena[data-opcion="1"]{display:none!important}.escena:is([data-opcion="4"],[data-opcion="5"],[data-opcion="6"]){display:block!important}';
      document.head.append(estilo);
    });
    const c = await leerCuenta(pagina);
    revisar(!c.viva && !c.mando && c.cartas === 1 && c.frases.length === 0 && t.es.test(c.es) && c.reto, `opción 4 sin JavaScript: botones ${c.mando ? 'a la vista' : 'escondidos'}, ${c.cartas} tarjeta, frases sueltas ${c.frases.length}, "${c.es}"`);
    const m = await leerMinuto(pagina);
    revisar(!m.viva && m.crono === '1:00' && !m.boton, `opción 5 sin JavaScript: cronómetro ${m.crono}, botón ${m.boton ? 'a la vista' : 'escondido'}`);
    const s = await leerSuena(pagina);
    revisar(!s.viva && s.opacos === 8 && s.animo === 'colapsada' && !s.boton, `opción 6 sin JavaScript: ${s.opacos} pedidos, ${s.animo}, botón ${s.boton ? 'a la vista' : 'escondido'}`);
    await contexto.close();
  }

  // 7. A 21 anchos: nada se sale de su tarjeta
  for (const opcion of ['4', '5', '6']) {
    const { contexto, pagina } = await abrir(`${t.ruta}?portada=${opcion}`, { reducedMotion: 'reduce' });
    const malos = [];
    for (const ancho of ANCHOS) {
      await pagina.setViewportSize({ width: ancho, height: ancho < 900 ? 800 : 900 });
      await pagina.waitForTimeout(60);
      if (opcion === '4') await pagina.evaluate(() => window.__mosca.vueltas.poner(10));
      const m = await pagina.evaluate((n) => {
        const escena = document.querySelector(`.escena[data-opcion="${n}"]`);
        const tarjeta = escena.firstElementChild.getBoundingClientRect();
        const fuera = [];
        for (const el of escena.firstElementChild.querySelectorAll('p, b, span, button, li, svg')) {
          if (el.closest('svg') && el.tagName !== 'svg') continue;
          if (el.closest('.solo-lector')) continue;
          const c = el.getBoundingClientRect();
          if (!c.width || getComputedStyle(el).visibility === 'hidden') continue;
          if (c.left < tarjeta.left - 0.5 || c.right > tarjeta.right + 0.5) fuera.push(el.className?.baseVal ?? el.className ?? el.tagName);
        }
        // los textos que se cortan
        const cortados = [...escena.querySelectorAll('.lamina-boton, .globo, .cuenta-cifra, .minuto-crono')].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim());
        // los pedidos, dentro de su celda (giran un poco, así que se mide su caja ya girada)
        const celda = escena.querySelector('.suena-escena')?.getBoundingClientRect();
        const pedidos = celda ? [...escena.querySelectorAll('.globo')].filter((g) => { const c = g.getBoundingClientRect(); return c.left < celda.left || c.right > celda.right || c.top < celda.top; }).length : 0;
        // el número y los dos botones no se montan
        const mando = [...escena.querySelectorAll('.cuenta-mando > *')].map((e) => e.getBoundingClientRect());
        const montados = mando.length === 3 && (mando[0].right > mando[1].left || mando[1].right > mando[2].left) ? 1 : 0;
        const cifra = escena.querySelector('.cuenta-cifra');
        // (en angosto el número va arriba y su rótulo debajo: cada uno tiene que caber en su columna)
        const cajaCifra = cifra?.getBoundingClientRect();
        const cifraAncha = cifra ? [...cifra.children].some((e) => { const c = e.getBoundingClientRect(); return c.left < cajaCifra.left - 1 || c.right > cajaCifra.right + 1; }) : false;
        return { desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, fuera, cortados, pedidos, montados, cifraAncha };
      }, opcion);
      if (m.desborde > 0 || m.fuera.length || m.cortados.length || m.pedidos || m.montados || m.cifraAncha) malos.push(`${ancho}px (desborde ${m.desborde}, fuera ${m.fuera.slice(0, 3).join(',') || 'nada'}, cortados ${m.cortados.slice(0, 3).join(',') || 'nada'}, pedidos fuera ${m.pedidos}, botones montados ${m.montados}, número apretado ${m.cifraAncha})`);
    }
    revisar(malos.length === 0, `opción ${opcion}: ${malos.join(' · ')}`);
    await contexto.close();
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} fallas en las opciones nuevas del inicio` : '\nopciones nuevas del inicio: todo bien');
process.exit(fallas ? 1 : 0);
