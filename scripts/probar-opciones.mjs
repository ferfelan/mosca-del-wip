// EN PRUEBA (Etapa 8.13, 2026-11-14). Prueba las opciones 2 y 3 del inicio de
// la portada (Felipe pidió ver tres propuestas para elegir; la 1 es el tablero
// de la mosca y la prueba node scripts/probar-jornada.mjs). Después pidió tres
// más con otro mensaje (4, 5 y 6): esas las prueba
// node scripts/probar-opciones-b.mjs, y la barrita tiene seis botones. Cuando
// él elija, esta prueba se queda solo con la opción elegida o se borra.
// Revisa, en español y en inglés:
//  1. sin ?portada= se ve la opción 1 y no hay barrita; con ?portada=2 o 3 se
//     ve solo esa, con la barrita, y la elección dura mientras dure la pestaña;
//  2. opción 2: el día corre una vez, de 09:00 a 18:00, en las dos pistas a la
//     vez, y cierra con 9 y 18 terminadas; las terminadas nunca bajan; la cara
//     de la pista de 9 pasa a la del cigarro; "Ver de nuevo" lo corre otra vez;
//  3. opción 3: el escritorio arma el día con 9 (cuenta hasta 9) y después
//     cambia al de 2 (cuenta hasta 18), una vez, y queda quieto; los botones
//     cambian el día, también con el teclado, y la frase se le avisa a quien
//     usa lector de pantalla; las colillas dibujadas son 13;
//  4. nada cambia de tamaño mientras se mueve;
//  5. con "reducir movimiento" no se mueve nada, y sin JavaScript se ve el día
//     ya cerrado (en la 3, con las dos frases);
//  6. a 21 anchos de pantalla, nada se sale de su tarjeta ni hay desborde;
//  7. que no haya errores en la consola.
// Uso: node scripts/probar-opciones.mjs [dirección]   (con npm run dev, con npx
// vite preview o la dirección de prueba; NAVEGADOR=webkit usa el motor de
// Safari). Debe decir "opciones del inicio: todo bien".
import { chromium, webkit } from 'playwright';

const BASE = (process.argv[2] || 'http://localhost:5173/').replace(/\/?$/, '/');
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const ES_WEBKIT = process.env.NAVEGADOR === 'webkit';
const ESPERA = 90000; // con el computador ocupado el dibujo dura más

const TEXTOS = {
  es: {
    ruta: '',
    carrera: /^La mosca trabajó el mismo día de oficina dos veces\. Con 9 tareas a la vez terminó 9\. Con 2 a la vez, terminó 18\.$/,
    frase9: /^Con 9 a la vez, cerró el día Colapsada, con 13\scigarros y 9\stareas terminadas\.$/,
    frase2: /^Con 2 a la vez, cerró el día Tranquila, sin fumar y con 18\stareas terminadas\.$/,
    barra: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4', 'Opción 5', 'Opción 6'],
  },
  en: {
    ruta: 'en/',
    carrera: /^The fly worked the same office day twice\. With 9 tasks at once she finished 9\. With 2 at once, she finished 18\.$/,
    frase9: /^With 9 at once, she ended the day Overwhelmed, with 13\scigarettes and 9\stasks finished\.$/,
    frase2: /^With 2 at once, she ended the day Calm, without smoking and with 18\stasks finished\.$/,
    barra: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6'],
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

// Cuál de las tres se ve y si está la barrita
const queSeVe = (pagina) =>
  pagina.evaluate(() => ({
    visibles: [...document.querySelectorAll('.escena[data-opcion]')].filter((e) => e.getClientRects().length > 0).map((e) => e.dataset.opcion),
    barra: [...document.querySelectorAll('.opciones a')].map((a) => a.textContent),
    marcada: document.querySelector('.opciones a[aria-current="true"]')?.textContent ?? null,
  }));

// Lo que se ve en la opción 2 en este momento
const leerCarrera = (pagina) =>
  pagina.evaluate(() => {
    const raiz = document.querySelector('.carrera');
    const caja = raiz.getBoundingClientRect();
    const boton = raiz.querySelector('[data-denuevo]');
    return {
      estado: raiz.dataset.estado,
      hora: raiz.querySelector('[data-hora]').textContent,
      pistas: [...raiz.querySelectorAll('.pista')].map((p) => ({
        caso: p.dataset.caso,
        cara: p.dataset.cara,
        hechas: Number(p.querySelector('[data-hechas]').textContent),
        fichas: p.querySelectorAll('.pista-meta i.hecha').length,
        tareas: p.querySelectorAll('.pista-tarea').length,
      })),
      boton: boton.getClientRects().length > 0,
      frase: raiz.querySelector('.carrera-resultado').textContent.trim().replace(/\s+/g, ' '),
      caja: `${Math.round(caja.width)}x${Math.round(caja.height)}`,
    };
  });

// Lo que se ve en la opción 3 en este momento
const leerEscritorio = (pagina) =>
  pagina.evaluate(() => {
    const raiz = document.querySelector('.escritorio');
    const seVe = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const opaco = (el) => Number(getComputedStyle(el).opacity) > 0.5;
    const caja = raiz.getBoundingClientRect();
    return {
      viva: raiz.classList.contains('viva'),
      estado: raiz.dataset.estado,
      caso: raiz.dataset.caso,
      cara: raiz.dataset.cara,
      hechas: Number(raiz.querySelector('[data-hechas]').textContent),
      enCurso: raiz.querySelector('[data-encurso]').textContent,
      losas: [...raiz.querySelectorAll('.e-losa')].filter(opaco).length,
      hojas: [...raiz.querySelectorAll('.e-hoja')].filter(opaco).length,
      colillas: raiz.querySelectorAll('.e-cenicero g[transform^="translate"]').length,
      apretado: [...raiz.querySelectorAll('[data-elegir]')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.elegir),
      botones: [...raiz.querySelectorAll('[data-elegir]')].filter(seVe).length,
      frases: [...raiz.querySelectorAll('.escritorio-resultado [data-de]')].filter(seVe).map((f) => f.textContent.trim().replace(/\s+/g, ' ')),
      avisa: raiz.querySelector('.escritorio-resultado').getAttribute('aria-live'),
      caja: `${Math.round(caja.width)}x${Math.round(caja.height)}`,
    };
  });

// Sigue el dibujo mientras se mueve: junta cada cambio hasta que queda quieto
async function seguir(pagina, leer, clave, listo) {
  const pasos = [];
  const desde = Date.now();
  let ultimo = '';
  while (Date.now() - desde < ESPERA) {
    const v = await leer(pagina);
    const k = clave(v);
    if (k !== ultimo) pasos.push(v);
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
    let v = await queSeVe(pagina);
    revisar(v.visibles.join() === '1' && v.barra.length === 0, `sin ?portada= se ve ${v.visibles.join()} y la barrita tiene ${v.barra.length} botones (se esperaba la 1 y ninguna barrita)`);
    for (const n of ['2', '3', '1']) {
      await pagina.goto(`${BASE}${t.ruta}?portada=${n}`, { waitUntil: 'load' });
      v = await queSeVe(pagina);
      revisar(v.visibles.join() === n, `con ?portada=${n} se ve ${v.visibles.join() || 'ninguna'}`);
      revisar(v.barra.join() === t.barra.join() && v.marcada === t.barra[n - 1], `con ?portada=${n} la barrita dice ${v.barra.join(' · ')} y marca ${v.marcada}`);
    }
    await pagina.goto(`${BASE}${t.ruta}?portada=3`, { waitUntil: 'load' });
    await pagina.goto(BASE + t.ruta, { waitUntil: 'load' });
    v = await queSeVe(pagina);
    revisar(v.visibles.join() === '3', `la elección no duró en la pestaña: sin ?portada= después de elegir la 3 se ve ${v.visibles.join()}`);
    revisar(errores.length === 0, `errores al cambiar de opción: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
  }

  // 2 y 4. Opción 2: el día corre una vez
  {
    const { contexto, pagina, errores } = await abrir(`${t.ruta}?portada=2`);
    const pasos = await seguir(pagina, leerCarrera, (v) => `${v.estado}|${v.hora}|${v.pistas.map((p) => `${p.hechas}${p.cara}`).join()}`, (v) => v.estado === 'quieta');
    const fin = pasos.at(-1);
    revisar(fin.estado === 'quieta' && fin.hora === '18:00', `la opción 2 no cerró el día: ${fin.estado}, ${fin.hora}`);
    revisar(fin.pistas[0].hechas === 9 && fin.pistas[0].fichas === 9 && fin.pistas[1].hechas === 18 && fin.pistas[1].fichas === 18, `la opción 2 cierra con ${fin.pistas.map((p) => `${p.hechas} (${p.fichas} fichas)`).join(' y ')}`);
    revisar(fin.pistas[0].tareas === 9 && fin.pistas[1].tareas === 2, `En curso tiene ${fin.pistas.map((p) => p.tareas).join(' y ')} tareas`);
    revisar(pasos.some((p) => p.hora < '10:00' && p.pistas[0].hechas === 0) || pasos[0].hora === '09:00', `la opción 2 no partió de las 09:00 (primer paso ${pasos[0].hora})`);
    for (const n of [0, 1]) {
      const cuentas = pasos.map((p) => p.pistas[n].hechas);
      revisar(cuentas.every((c, i) => i === 0 || c >= cuentas[i - 1]), `en la pista ${n + 1} las terminadas bajaron: ${cuentas.join(' ')}`);
    }
    revisar(pasos.some((p) => p.pistas[0].cara === 'tranquila') && fin.pistas[0].cara === 'colapsada', 'la cara de la pista de 9 no pasó de tranquila a colapsada');
    revisar(pasos.every((p) => p.pistas[1].cara === 'tranquila'), 'la cara de la pista de 2 dejó de estar tranquila');
    revisar(new Set(pasos.map((p) => p.caja)).size === 1, `la opción 2 cambió de tamaño mientras corría: ${[...new Set(pasos.map((p) => p.caja))].join(' ')}`);
    revisar(t.carrera.test(fin.frase), `frase de la opción 2: "${fin.frase}"`);
    revisar(fin.boton, 'no se ve "Ver de nuevo"');
    // "Ver de nuevo", con el teclado
    await pagina.focus('.carrera [data-denuevo]');
    await pagina.keyboard.press('Enter');
    await pagina.waitForTimeout(700);
    const otra = await leerCarrera(pagina);
    revisar(otra.estado === 'andando' && otra.hora < '12:00' && otra.pistas[1].hechas < 9, `"Ver de nuevo" no volvió a correr el día: ${otra.estado}, ${otra.hora}`);
    revisar(errores.length === 0, `errores en la opción 2: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
  }

  // 3 y 4. Opción 3: se arma el día con 9 y cambia al de 2
  {
    const { contexto, pagina, errores } = await abrir(`${t.ruta}?portada=3`);
    const pasos = await seguir(pagina, leerEscritorio, (v) => `${v.estado}|${v.caso}|${v.cara}|${v.hechas}`, (v) => v.estado === 'quieta');
    const fin = pasos.at(-1);
    const cuentas = pasos.map((p) => p.hechas);
    revisar(fin.caso === 'pocas' && fin.hechas === 18 && fin.enCurso === '2' && fin.cara === 'tranquila', `la opción 3 quedó en ${fin.caso}, ${fin.hechas} hechas, ${fin.enCurso} en curso, ${fin.cara}`);
    revisar(cuentas[0] <= 1 && cuentas.includes(9) && cuentas.every((c, i) => i === 0 || c >= cuentas[i - 1]), `la cuenta de la opción 3 no fue de 0 a 9 y a 18: ${cuentas.join(' ')}`);
    revisar(pasos.some((p) => p.caso === 'muchas' && p.cara === 'colapsada' && p.hechas === 9), 'no se vio el día con 9 cerrado (Colapsada, 9 hechas)');
    revisar(new Set(pasos.map((p) => p.caja)).size === 1, `la opción 3 cambió de tamaño mientras se movía: ${[...new Set(pasos.map((p) => p.caja))].join(' ')}`);
    await pagina.waitForTimeout(1500);
    let v = await leerEscritorio(pagina);
    revisar(v.losas === 18 && v.hojas === 2, `con 2 a la vez se ven ${v.losas} losas en la torre y ${v.hojas} tareas sobre el escritorio`);
    revisar(v.frases.length === 1 && t.frase2.test(v.frases[0]), `frase con 2: "${v.frases.join(' / ')}"`);
    revisar(v.colillas === 13, `hay ${v.colillas} colillas dibujadas (son 13 cigarros)`);
    // El botón de 9, con el teclado
    await pagina.focus('.escritorio [data-elegir="muchas"]');
    await pagina.keyboard.press('Enter');
    await pagina.waitForTimeout(1800);
    v = await leerEscritorio(pagina);
    revisar(v.caso === 'muchas' && v.hechas === 9 && v.enCurso === '9' && v.cara === 'colapsada' && v.apretado.join() === 'muchas', `tras elegir 9 quedó ${v.caso}, ${v.hechas} hechas, ${v.enCurso} en curso, ${v.cara}`);
    revisar(v.losas === 9 && v.hojas === 9, `con 9 a la vez se ven ${v.losas} losas y ${v.hojas} tareas`);
    revisar(v.frases.length === 1 && t.frase9.test(v.frases[0]), `frase con 9: "${v.frases.join(' / ')}"`);
    revisar(v.avisa === 'polite', 'la frase no se avisa a quien usa lector de pantalla');
    revisar(v.caja === fin.caja, `la opción 3 cambió de tamaño al elegir: ${fin.caja} y ${v.caja}`);
    await pagina.click('.escritorio [data-elegir="pocas"]');
    await pagina.waitForTimeout(2200);
    v = await leerEscritorio(pagina);
    revisar(v.caso === 'pocas' && v.hechas === 18 && v.losas === 18 && v.hojas === 2, `tras elegir 2 quedó ${v.caso}, ${v.hechas} hechas, ${v.losas} losas, ${v.hojas} tareas`);
    revisar(errores.length === 0, `errores en la opción 3: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
  }

  // 5. Con "reducir movimiento" y sin JavaScript
  {
    const { contexto, pagina } = await abrir(`${t.ruta}?portada=2`, { reducedMotion: 'reduce' });
    await pagina.waitForTimeout(600);
    const v = await leerCarrera(pagina);
    revisar(v.hora === '18:00' && v.pistas[0].hechas === 9 && v.pistas[1].hechas === 18 && !v.boton, `opción 2 con reducir movimiento: ${v.hora}, ${v.pistas.map((p) => p.hechas).join(' y ')}, botón ${v.boton ? 'a la vista' : 'escondido'}`);
    await pagina.goto(`${BASE}${t.ruta}?portada=3`, { waitUntil: 'load' });
    await pagina.waitForTimeout(600);
    let e = await leerEscritorio(pagina);
    revisar(e.caso === 'muchas' && e.hechas === 9 && e.losas === 9 && e.hojas === 9 && e.estado === 'quieta', `opción 3 con reducir movimiento: ${e.caso}, ${e.hechas} hechas, ${e.losas} losas, ${e.estado}`);
    await pagina.click('.escritorio [data-elegir="pocas"]');
    await pagina.waitForTimeout(120);
    e = await leerEscritorio(pagina);
    revisar(e.caso === 'pocas' && e.hechas === 18 && e.losas === 18 && e.hojas === 2, `opción 3 con reducir movimiento, tras elegir 2: ${e.hechas} hechas, ${e.losas} losas, ${e.hojas} tareas (tiene que cambiar de una vez)`);
    await contexto.close();
  }
  {
    // (sin JavaScript no corre el script que elige la opción: se muestran a mano, para ver cómo quedan quietas)
    const { contexto, pagina } = await abrir(t.ruta, { javaScriptEnabled: false });
    const v = await queSeVe(pagina);
    revisar(v.visibles.join() === '1', `sin JavaScript se ve ${v.visibles.join()} (se esperaba la 1)`);
    await pagina.evaluate(() => {
      const estilo = document.createElement('style');
      estilo.textContent = '.escena[data-opcion="1"]{display:none!important}.escena[data-opcion="2"],.escena[data-opcion="3"]{display:block!important}';
      document.head.append(estilo);
    });
    const c = await leerCarrera(pagina);
    revisar(c.hora === '18:00' && c.pistas[0].hechas === 9 && c.pistas[1].hechas === 18 && !c.boton && t.carrera.test(c.frase), `opción 2 sin JavaScript: ${c.hora}, ${c.pistas.map((p) => p.hechas).join(' y ')}, botón ${c.boton ? 'a la vista' : 'escondido'}`);
    const e = await leerEscritorio(pagina);
    revisar(!e.viva && e.caso === 'muchas' && e.hechas === 9 && e.losas === 9 && e.hojas === 9 && e.botones === 0, `opción 3 sin JavaScript: ${e.caso}, ${e.hechas} hechas, ${e.losas} losas, ${e.botones} botones`);
    revisar(e.frases.length === 2 && t.frase9.test(e.frases[0]) && t.frase2.test(e.frases[1]), `opción 3 sin JavaScript, frases: "${e.frases.join(' / ')}"`);
    await contexto.close();
  }

  // 6. A 21 anchos: nada se sale de su tarjeta
  for (const opcion of ['2', '3']) {
    const { contexto, pagina } = await abrir(`${t.ruta}?portada=${opcion}`, { reducedMotion: 'reduce' });
    const malos = [];
    for (const ancho of ANCHOS) {
      await pagina.setViewportSize({ width: ancho, height: ancho < 900 ? 800 : 900 });
      await pagina.waitForTimeout(60);
      if (opcion === '3') await pagina.evaluate(() => window.__mosca.escritorio.mostrarCerrado('pocas'));
      const m = await pagina.evaluate((n) => {
        const escena = document.querySelector(`.escena[data-opcion="${n}"]`);
        const tarjeta = escena.firstElementChild.getBoundingClientRect();
        const fuera = [];
        for (const el of escena.firstElementChild.querySelectorAll('p, b, span, button, i, .pista-caras, svg')) {
          const c = el.getBoundingClientRect();
          if (!c.width || getComputedStyle(el).visibility === 'hidden') continue;
          if (c.left < tarjeta.left - 0.5 || c.right > tarjeta.right + 0.5) fuera.push(el.className?.baseVal ?? el.className ?? el.tagName);
        }
        // los textos que se cortan o se montan
        const cortados = [...escena.querySelectorAll('.pista-rotulo, .pista-caso b, .escritorio-zonas p, .carrera-denuevo, .escritorio-selector button')].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim());
        const rotulos = [...escena.querySelectorAll('.pista-fila')].filter((f) => {
          const [a, b] = f.children;
          return a.getBoundingClientRect().right > b.getBoundingClientRect().left - 3;
        }).length;
        return { desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, fuera, cortados, rotulos };
      }, opcion);
      if (m.desborde > 0 || m.fuera.length || m.cortados.length || m.rotulos) malos.push(`${ancho}px (desborde ${m.desborde}, fuera ${m.fuera.slice(0, 3).join(',') || 'nada'}, cortados ${m.cortados.slice(0, 3).join(',') || 'nada'}, rótulos encima ${m.rotulos})`);
    }
    revisar(malos.length === 0, `opción ${opcion}: ${malos.join(' · ')}`);
    await contexto.close();
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} fallas en las opciones del inicio` : '\nopciones del inicio: todo bien');
process.exit(fallas ? 1 : 0);
