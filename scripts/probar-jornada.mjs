// Prueba el tablero del inicio de la portada (Etapa 8.13, 2026-11-14, pedido
// de Felipe: rediseñar el inicio "así tipo dibujo pero algo bacán") y que el
// cerebro, que bajó a "¿Por qué una mosca?", se pida recién al acercarse.
// Revisa, en español y en inglés:
//  1. al entrar, el tablero juega solo el día con 9 tareas a la vez y después
//     el día con 2, una sola vez, y queda quieto en el día con 2;
//  2. los números del cierre son los del juego (9 terminadas con 9 a la vez,
//     18 con 2) y las tareas terminadas nunca bajan mientras pasa el día;
//  3. la cara cambia a la del cigarro con 9 a la vez y con 2 queda con su café;
//  4. nada cambia de tamaño ni empuja lo de al lado mientras se mueve;
//  5. cada botón vuelve a jugar su día, también con el teclado, y la frase del
//     día se le avisa a quien usa lector de pantalla;
//  6. con "reducir movimiento" no se juega nada (se ve el día ya cerrado y los
//     botones lo cambian de inmediato);
//  7. sin JavaScript se ve el día con 9 ya cerrado, con las dos frases;
//  8. si el tablero no se ve al entrar (celular horizontal), espera a verse;
//  9. el cerebro no se baja al entrar: se pide al acercarse a su sección, se
//     enciende, y su consola sube sola de 2 a 10 cuando ya se ve;
// 10. que no haya errores en la consola.
// Los tiempos del dibujo contra el juego se comprueban aparte, con
// node scripts/medir-jornada.mjs
// Uso: node scripts/probar-jornada.mjs [dirección]   (con npm run dev, con npx
// vite preview, o la dirección publicada; NAVEGADOR=webkit usa el motor de
// Safari). Debe decir "tablero del inicio: todo bien".
import { chromium, webkit } from 'playwright';

const BASE = (process.argv[2] || 'http://localhost:5173/').replace(/\/?$/, '/');
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const ES_WEBKIT = process.env.NAVEGADOR === 'webkit';
const ESPERA = 90000; // con el computador ocupado el día del dibujo dura más

const TEXTOS = {
  es: { ruta: '', nueve: '9 a la vez', dos: '2 a la vez', frase9: /^Con 9 a la vez, tuvo qué hacer el 100\s%\sdel día y terminó 9\stareas\.$/, frase2: /^Con 2 a la vez, tuvo qué hacer el 96\s%\sdel día y terminó 18\stareas\.$/ },
  en: { ruta: 'en/', nueve: '9 at once', dos: '2 at once', frase9: /^With 9 at once, she had something to do 100% of the day and finished 9\stasks\.$/, frase2: /^With 2 at once, she had something to do 96% of the day and finished 18\stasks\.$/ },
};

let fallas = 0;
function revisar(bien, mensaje) {
  if (bien) return;
  fallas++;
  console.log(`  FALLA  ${mensaje}`);
}

const navegador = ES_WEBKIT
  ? await webkit.launch()
  : await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });

async function abrir(ruta, opciones = {}) {
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, ...opciones });
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

// Lo que se ve en el tablero en este momento
const leer = (pagina) =>
  pagina.evaluate(() => {
    const raiz = document.querySelector('.jornada');
    const seVe = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'; // (ocupa lugar y no está escondido)
    const caja = raiz.getBoundingClientRect();
    return {
      viva: raiz.classList.contains('viva'),
      estado: raiz.dataset.estado,
      caso: raiz.dataset.caso,
      cara: raiz.dataset.cara,
      hora: raiz.querySelector('[data-hora]').textContent,
      hechas: Number(raiz.querySelector('[data-hechas]').textContent),
      fichas: raiz.querySelectorAll('.pila-hecho i.hecha').length,
      enCurso: raiz.querySelector('[data-encurso]').textContent,
      tarjetas: raiz.querySelectorAll('.tarea:not(.libre)').length,
      frases: [...raiz.querySelectorAll('.jornada-resultado span')].filter(seVe).map((s) => s.textContent.replace(/\s+/g, ' ').trim()),
      avisa: raiz.querySelector('.jornada-resultado').getAttribute('aria-live'),
      apretados: [...raiz.querySelectorAll('[data-elegir]')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent.trim()),
      botonesVisibles: [...raiz.querySelectorAll('[data-elegir]')].filter(seVe).length,
      caja: [caja.x, caja.y, caja.width, caja.height].map((n) => Math.round(n * 10) / 10).join(' '),
    };
  });

// Mira el tablero muchas veces hasta que quede quieto y anota lo que pasó
async function mirarHastaQuieto(pagina, etiqueta) {
  await pagina.evaluate(() => {
    window.__corrimiento = 0;
    try {
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) if (!e.hadRecentInput) window.__corrimiento += e.value;
      }).observe({ type: 'layout-shift', buffered: false });
    } catch {}
  });
  const visto = { casos: [], caras: {}, cajas: new Set(), bajo: false, horas: {} };
  let antes = null;
  const tope = Date.now() + ESPERA;
  for (;;) {
    const ahora = await leer(pagina);
    if (visto.casos.at(-1) !== ahora.caso) visto.casos.push(ahora.caso);
    (visto.caras[ahora.caso] ||= new Set()).add(ahora.cara);
    (visto.horas[ahora.caso] ||= new Set()).add(ahora.hora);
    visto.cajas.add(ahora.caja);
    if (antes && antes.caso === ahora.caso && ahora.hechas < antes.hechas) visto.bajo = true;
    if (ahora.hechas !== ahora.fichas) revisar(false, `${etiqueta}: dice ${ahora.hechas} terminadas y hay ${ahora.fichas} fichas en Hecho (a las ${ahora.hora})`);
    antes = ahora;
    if (ahora.estado === 'quieta') break;
    if (Date.now() > tope) {
      revisar(false, `${etiqueta}: el tablero no quedó quieto en ${ESPERA / 1000} segundos (iba en ${ahora.caso}, ${ahora.hora})`);
      break;
    }
    await pagina.waitForTimeout(90);
  }
  visto.corrimiento = await pagina.evaluate(() => window.__corrimiento);
  visto.final = await leer(pagina);
  return visto;
}

function revisarCierre(final, caso, t, etiqueta) {
  const nueve = caso === 'muchas';
  revisar(final.caso === caso, `${etiqueta}: quedó en el día "${final.caso}" y debía ser "${caso}"`);
  revisar(final.hora === '18:00', `${etiqueta}: el reloj cerró en ${final.hora} y debía cerrar a las 18:00`);
  revisar(final.hechas === (nueve ? 9 : 18), `${etiqueta}: terminó ${final.hechas} y debían ser ${nueve ? 9 : 18}`);
  revisar(final.enCurso === (nueve ? '9' : '2') && final.tarjetas === (nueve ? 9 : 2), `${etiqueta}: En curso dice ${final.enCurso} y muestra ${final.tarjetas} tarjetas`);
  revisar(final.cara === (nueve ? 'colapsada' : 'tranquila'), `${etiqueta}: la cara quedó "${final.cara}"`);
  revisar(final.frases.length === 1 && (nueve ? t.frase9 : t.frase2).test(final.frases[0]), `${etiqueta}: la frase a la vista es ${JSON.stringify(final.frases)}`);
  revisar(final.apretados.length === 1 && final.apretados[0] === (nueve ? t.nueve : t.dos), `${etiqueta}: el botón marcado es ${JSON.stringify(final.apretados)}`);
}

for (const [idioma, t] of Object.entries(TEXTOS)) {
  // ---------- 1 a 5: computador, con movimiento ----------
  {
    const { contexto, pagina, errores, pedidos } = await abrir(t.ruta);
    const etiqueta = `${idioma} computador`;
    await pagina.waitForFunction(() => document.querySelector('.jornada.viva'), null, { timeout: 15000 }).catch(() => {});
    const alEntrar = await leer(pagina);
    revisar(alEntrar.viva, `${etiqueta}: el tablero no partió`);
    revisar(alEntrar.botonesVisibles === 2, `${etiqueta}: se ven ${alEntrar.botonesVisibles} botones y debían ser 2`);
    revisar(alEntrar.avisa === null, `${etiqueta}: la frase se anuncia sola al entrar (aria-live="${alEntrar.avisa}")`);
    const serie = await mirarHastaQuieto(pagina, etiqueta);
    revisar(serie.casos.join(' ') === 'muchas pocas', `${etiqueta}: jugó "${serie.casos.join(' ')}" y debía jugar el día con 9 y después el día con 2`);
    revisar(!serie.bajo, `${etiqueta}: las terminadas bajaron en medio de un día`);
    revisar(serie.caras.muchas?.has('tranquila') && serie.caras.muchas?.has('colapsada'), `${etiqueta}: con 9 a la vez la cara no pasó de tranquila a colapsada (${[...(serie.caras.muchas || [])].join(', ')})`);
    revisar(serie.caras.pocas?.size === 1 && serie.caras.pocas.has('tranquila'), `${etiqueta}: con 2 a la vez la cara no se quedó tranquila (${[...(serie.caras.pocas || [])].join(', ')})`);
    revisar((serie.horas.muchas?.size || 0) >= 8 && (serie.horas.pocas?.size || 0) >= 8, `${etiqueta}: el reloj casi no avanzó (${serie.horas.muchas?.size} y ${serie.horas.pocas?.size} horas distintas)`);
    revisar(serie.cajas.size === 1, `${etiqueta}: el tablero cambió de tamaño o de lugar mientras se movía (${[...serie.cajas].join(' | ')})`);
    revisar(serie.corrimiento < 0.005, `${etiqueta}: algo se corrió en la página mientras se movía (${serie.corrimiento.toFixed(4)})`);
    revisarCierre(serie.final, 'pocas', t, `${etiqueta}, al terminar la serie`);
    // No vuelve a partir solo
    await pagina.waitForTimeout(2600);
    revisar((await leer(pagina)).estado === 'quieta', `${etiqueta}: el tablero volvió a moverse solo`);
    // El botón del día con 9 lo juega de nuevo (con un clic)
    await pagina.getByRole('button', { name: t.nueve, exact: true }).click();
    const alApretar = await leer(pagina);
    revisar(alApretar.estado === 'andando' && alApretar.caso === 'muchas', `${etiqueta}: el botón "${t.nueve}" no jugó su día (${alApretar.estado}, ${alApretar.caso})`);
    revisar(alApretar.avisa === 'polite', `${etiqueta}: al elegir un día la frase no se avisa (aria-live="${alApretar.avisa}")`);
    const conNueve = await mirarHastaQuieto(pagina, `${etiqueta}, botón de 9`);
    revisar(conNueve.casos.join(' ') === 'muchas', `${etiqueta}: después del botón de 9 jugó "${conNueve.casos.join(' ')}"`);
    revisarCierre(conNueve.final, 'muchas', t, `${etiqueta}, botón de 9`);
    // El botón del día con 2, con el teclado
    await pagina.getByRole('button', { name: t.dos, exact: true }).focus();
    const conFoco = await pagina.evaluate(() => {
      const b = document.activeElement;
      const cs = getComputedStyle(b);
      return { es: b.dataset.elegir, borde: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' };
    });
    revisar(conFoco.es === 'pocas', `${etiqueta}: el botón "${t.dos}" no recibe el foco del teclado`);
    await pagina.keyboard.press('Enter');
    const conDos = await mirarHastaQuieto(pagina, `${etiqueta}, botón de 2 con teclado`);
    revisarCierre(conDos.final, 'pocas', t, `${etiqueta}, botón de 2 con teclado`);

    // ---------- 9: el cerebro se pide al acercarse ----------
    const delCerebro = () => pedidos.filter((u) => /\/cerebro\/[^/]+\.(bin|json)/.test(u)).length;
    revisar(delCerebro() === 0, `${etiqueta}: el cerebro se bajó al entrar (${delCerebro()} archivos) y debía esperar`);
    revisar(!(await pagina.evaluate(() => document.querySelector('.cerebro.vivo'))), `${etiqueta}: el cerebro se encendió sin que nadie llegara a su sección`);
    const antesDeBajar = await pagina.evaluate(() => ({ tareas: document.getElementById('wip').value, neuronas: document.querySelector('[data-neuronas]').textContent }));
    revisar(antesDeBajar.tareas === '2', `${etiqueta}: la consola del cerebro partió en ${antesDeBajar.tareas} tareas y debía partir en 2`);
    await pagina.evaluate(() => document.querySelector('.cerebro').scrollIntoView({ block: 'center', behavior: 'instant' }));
    const encendio = await pagina.waitForFunction(() => document.querySelector('.cerebro.vivo'), null, { timeout: 40000 }).then(() => true, () => false);
    revisar(encendio, `${etiqueta}: el cerebro no se encendió al llegar a su sección`);
    revisar(delCerebro() >= 5, `${etiqueta}: el cerebro pidió ${delCerebro()} archivos y debían ser 5`);
    const subio = await pagina.waitForFunction(() => document.getElementById('wip').value === '10', null, { timeout: 30000 }).then(() => true, () => false);
    revisar(subio, `${etiqueta}: la consola del cerebro no subió sola hasta 10 (quedó en ${await pagina.evaluate(() => document.getElementById('wip').value)})`);
    await pagina.waitForTimeout(1500);
    const consola = await pagina.evaluate(() => ({
      neuronas: Number(document.querySelector('[data-neuronas]').textContent.replace(/\D/g, '')),
      dentro: Boolean(document.querySelector('#por-que-una-mosca .cerebro') && document.querySelector('#por-que-una-mosca .consola')),
      enInicio: Boolean(document.querySelector('.hero .cerebro, .hero .consola')),
      credencial: Boolean(document.querySelector('#por-que-una-mosca .credencial')),
    }));
    revisar(consola.dentro && !consola.enInicio, `${etiqueta}: el cerebro y su consola no están en "¿Por qué una mosca?" (o siguen en el inicio)`);
    revisar(consola.credencial, `${etiqueta}: falta la credencial de la mosca en "¿Por qué una mosca?"`);
    revisar(consola.neuronas > 800, `${etiqueta}: con 10 tareas se encienden ${consola.neuronas} neuronas (muy pocas)`);
    revisar(errores.length === 0, `${etiqueta}: errores en la consola: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
    console.log(`  listo  ${etiqueta}`);
  }

  // ---------- 6: con "reducir movimiento" ----------
  {
    const { contexto, pagina, errores } = await abrir(t.ruta, { reducedMotion: 'reduce' });
    const etiqueta = `${idioma} sin movimiento`;
    await pagina.waitForFunction(() => document.querySelector('.jornada.viva'), null, { timeout: 15000 }).catch(() => {});
    await pagina.waitForTimeout(600);
    const quieto = await leer(pagina);
    revisar(quieto.estado === 'quieta', `${etiqueta}: el tablero se mueve (${quieto.estado})`);
    revisarCierre(quieto, 'muchas', t, etiqueta);
    await pagina.getByRole('button', { name: t.dos, exact: true }).click();
    const alTiro = await leer(pagina);
    revisar(alTiro.estado === 'quieta', `${etiqueta}: el botón "${t.dos}" hizo moverse el tablero`);
    revisarCierre(alTiro, 'pocas', t, `${etiqueta}, botón de 2`);
    revisar(errores.length === 0, `${etiqueta}: errores en la consola: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
    console.log(`  listo  ${etiqueta}`);
  }

  // ---------- 7: sin JavaScript ----------
  {
    const { contexto, pagina } = await abrir(t.ruta, { javaScriptEnabled: false });
    const etiqueta = `${idioma} sin JavaScript`;
    const fijo = await pagina.locator('.jornada').evaluate((raiz) => {
      const seVe = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'; // (ocupa lugar y no está escondido)
      return {
        hora: raiz.querySelector('[data-hora]').textContent,
        hechas: raiz.querySelector('[data-hechas]').textContent,
        fichas: raiz.querySelectorAll('.pila-hecho i.hecha').length,
        frases: [...raiz.querySelectorAll('.jornada-resultado span')].filter(seVe).map((s) => s.textContent.replace(/\s+/g, ' ').trim()),
        botones: [...raiz.querySelectorAll('[data-elegir]')].filter(seVe).length,
        cara: raiz.dataset.cara,
      };
    });
    revisar(fijo.hora === '18:00' && fijo.hechas === '9' && fijo.fichas === 9 && fijo.cara === 'colapsada', `${etiqueta}: no se ve el día con 9 ya cerrado (${JSON.stringify(fijo)})`);
    revisar(fijo.frases.length === 2 && t.frase9.test(fijo.frases[0]) && t.frase2.test(fijo.frases[1]), `${etiqueta}: no se leen las dos frases (${JSON.stringify(fijo.frases)})`);
    revisar(fijo.botones === 0, `${etiqueta}: se ven ${fijo.botones} botones que sin JavaScript no hacen nada`);
    await contexto.close();
    console.log(`  listo  ${etiqueta}`);
  }

  // ---------- 8: si no se ve al entrar, espera ----------
  {
    const { contexto, pagina, errores } = await abrir(t.ruta, { viewport: { width: 667, height: 375 }, hasTouch: true, isMobile: true });
    const etiqueta = `${idioma} celular horizontal`;
    await pagina.waitForFunction(() => document.querySelector('.jornada.viva'), null, { timeout: 15000 }).catch(() => {});
    await pagina.waitForTimeout(1200);
    const sinVerse = await leer(pagina);
    revisar(sinVerse.estado === 'por-partir' && sinVerse.hora === '09:00' && sinVerse.hechas === 0, `${etiqueta}: el tablero partió sin verse (${sinVerse.estado}, ${sinVerse.hora}, ${sinVerse.hechas} terminadas)`);
    await pagina.evaluate(() => document.querySelector('.jornada').scrollIntoView({ block: 'center', behavior: 'instant' }));
    const partio = await pagina.waitForFunction(() => document.querySelector('.jornada').dataset.estado === 'andando', null, { timeout: 10000 }).then(() => true, () => false);
    revisar(partio, `${etiqueta}: el tablero no partió al verse`);
    const altos = await pagina.evaluate(() => [...document.querySelectorAll('.jornada [data-elegir]')].map((b) => Math.round(b.getBoundingClientRect().height * 10) / 10));
    revisar(altos.every((a) => a >= 44), `${etiqueta}: los botones del día miden ${altos.join(' y ')} px de alto (difíciles de tocar)`);
    revisar(errores.length === 0, `${etiqueta}: errores en la consola: ${errores.slice(0, 3).join(' | ')}`);
    await contexto.close();
    console.log(`  listo  ${etiqueta}`);
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} cosas para revisar` : '\ntablero del inicio: todo bien');
process.exit(fallas ? 1 : 0);
