// Etapa 8.3 (2026-11-03) · La urgencia en la pantalla: el botón "Mándale una
// urgencia". Parte un día con límite 2, aprieta el botón a las 10:00 y
// comprueba que la tarjeta urgente aparece arriba de las en curso con su
// rótulo, que el tablero avisa, que la mosca trabaja en ella (las normales no
// avanzan), que el botón queda apagado mientras dura, que al terminar pasa a
// "Terminadas" con su rótulo y que el resumen muestra las dos cifras y el
// tiempo de las urgencias. Lo mismo en Exhibición, en el celular (iPhone 14)
// y en inglés. Además: sin apretar el botón el resumen es el de siempre; con
// 5 el botón dice "Hoy ya llegaron 5"; cambiar el límite antes de las 09:15
// rearma el día sin urgencias. Capturas en docs/etapa8-3-capturas/.
// Requiere npm run dev. Uso: node scripts/probar-urgencia.mjs → "urgencia: todo bien"
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const JUEGO = process.env.JUEGO ?? 'http://localhost:5173/jugar/';
const DIR = process.env.CAPTURAS ?? 'docs/etapa8-3-capturas';
mkdirSync(DIR, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const fallas = [];
const revisar = (ok, texto) => {
  if (!ok) fallas.push(texto);
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${texto}`);
};

// Lo que tiene que decir cada cosa, en los dos idiomas (src/juego-textos.js)
const T = {
  es: {
    boton: 'Mándale una urgencia', enCurso: 'Hay una urgencia en curso', tope: 'Hoy ya llegaron 5', llego: 'Llegó una urgencia', urgente: 'Urgente', normales: ' (normales)',
    hechas: (n, u) => `${n} normales + ${u} ${u === 1 ? 'urgencia' : 'urgencias'}`,
    tardo: (m, u) => `${u === 1 ? 'La urgencia tardó' : 'Cada urgencia tardó'} ${m} min desde que llegó`,
  },
  en: {
    boton: 'Send an urgent task', enCurso: 'An urgent task is in progress', tope: '5 already arrived today', llego: 'An urgent task arrived', urgente: 'Urgent', normales: ' (regular)',
    hechas: (n, u) => `${n} regular + ${u} urgent`,
    tardo: (m, u) => `${u === 1 ? 'The urgent task took' : 'Each urgent task took'} ${m} min from arrival`,
  },
};

async function abrir(contexto, idioma) {
  const p = await contexto.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => {
    if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) errores.push(m.text());
  });
  await p.goto(JUEGO + (idioma === 'en' ? '?lang=en' : ''), { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.waitForTimeout(800);
  return { p, errores };
}

// Lo que se ve: el botón, el tablero, los números y el resumen
const leer = (p) =>
  p.evaluate(() => {
    const el = (id) => document.getElementById(id);
    const btn = el('btn-urgencia');
    const r = btn.getBoundingClientRect();
    const e = window.__mosca.estado();
    const texto = (id) => el(id).textContent.replace(/\s+/g, ' ').trim();
    return {
      visible: !btn.hidden && r.width > 0 && r.height > 0,
      apagado: btn.disabled,
      texto: btn.textContent.trim(),
      caja: r.toJSON(),
      hora: e.hora,
      wip: e.wip,
      urg: e.urgencias,
      enCurso: e.enCurso,
      hechas: e.hechas,
      hechasNormales: e.hechasNormales,
      terminado: e.terminado,
      kanban: window.__mosca.kanban(),
      textosKanban: window.__mosca.textosEscena().kanban,
      mHechas: texto('m-hechas'),
      mHechasTitulo: el('m-hechas').getAttribute('title'),
      mTiempoNota: el('m-tiempo-nota').textContent,
      cfHechas: texto('cf-hechas'),
      cfUrg: el('cf-urgencias').hidden ? null : texto('cf-urgencias'),
      cfTiempoNota: el('cf-tiempo-nota').textContent,
      // las dos líneas del aviso de fin del día (van una bajo la otra)
      banner: el('banner-urgencias').hidden ? null : `${texto('banner-urgencias-hechas')} ${texto('banner-urgencias-tardo')}`,
      bannerVisible: !el('banner-fin-dia').classList.contains('oculto'),
      tabla: [...document.querySelectorAll('#tabla-dias-body tr:not(.vacia) td:nth-child(2)')].map((td) => [td.textContent, td.getAttribute('title')]),
      exFin: [...document.querySelectorAll('#ex-fin-filas tr td:first-of-type')].map((td) => [td.textContent, td.getAttribute('title')]),
    };
  });
const caja = (p, sel) =>
  p.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { ...r.toJSON(), visible: !el.hidden && r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0' };
  }, sel);
const chocan = (a, c) => a && c && a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
const tareas = (p) => p.evaluate(() => window.__mosca.tareas());
// Juega hasta que terminen `cuantas` urgencias (de a 3 minutos; a lo más el resto del día)
const terminarUrgencia = (p, cuantas) =>
  p.evaluate((n) => {
    let pasos = 0;
    while (window.__mosca.estado().urgencias.terminadas < n && !window.__mosca.estado().terminado && pasos++ < 200) window.__mosca.adelantar(3);
  }, cuantas);
// Cuánto tardó cada urgencia terminada desde que llegó (promedio redondeado, como lo escribe el juego)
const tardoEsperado = (p) =>
  p.evaluate(() => {
    const u = window.__mosca.medidas().tareas.filter((t) => t.urgente);
    return Math.round(u.reduce((s, t) => s + t.desdeLlegada, 0) / u.length);
  });

// ---------- Computador: Control y Exhibición ----------
async function probarComputador(idioma) {
  const t = T[idioma];
  const eti = (s) => `${idioma} · computador: ${s}`;
  const contexto = await b.newContext({ viewport: { width: 1512, height: 860 }, locale: 'es-CL' });
  const { p, errores } = await abrir(contexto, idioma);

  let v = await leer(p);
  revisar(!v.visible, eti('antes de empezar el botón no se ve'));

  // Día con límite 2 hasta las 10:00 (el reloj de la pantalla se detiene para mirar con calma)
  await p.evaluate(() => {
    window.__mosca.setWip(2);
    window.__mosca.empezar();
    window.__mosca.detenerReloj(true);
    window.__mosca.adelantar(60);
  });
  await p.waitForTimeout(300);
  v = await leer(p);
  revisar(v.hora === '10:00' && v.wip === 2, eti(`día con límite 2 a las ${v.hora}`));
  revisar(v.visible && !v.apagado && v.texto === t.boton, eti(`el botón se ve y dice «${v.texto}»`));
  revisar(!chocan(v.caja, await caja(p, '#ex-inicio')), eti('el botón no tapa el aviso de arriba'));
  revisar(!v.kanban.enCurso.some((c) => c.urgente) && !v.textosKanban.includes(t.urgente), eti('sin apretar, el tablero no tiene tarjetas urgentes'));

  // Apretar: entra una urgencia, arriba de las en curso, con su rótulo y el aviso
  const antes = await tareas(p);
  await p.click('#btn-urgencia');
  await p.waitForTimeout(250);
  v = await leer(p);
  revisar(v.urg.llegadas === 1 && v.urg.enCurso === 1 && v.enCurso === antes.length + 1, eti('al apretar entra una urgencia por encima del límite'));
  revisar(v.kanban.enCurso.length >= 2 && v.kanban.enCurso[0].urgente && v.kanban.enCurso.slice(1).every((c) => !c.urgente), eti(`la tarjeta urgente va arriba de las en curso (${v.kanban.enCurso.length} tarjetas)`));
  revisar(v.textosKanban.includes(t.urgente), eti(`la tarjeta lleva el rótulo «${t.urgente}»`));
  revisar(v.textosKanban.includes(t.llego), eti(`el tablero avisa «${t.llego}»`));
  revisar(v.textosKanban.includes('2 + 1'), eti('En curso cuenta "2 + 1"'));
  revisar(!v.textosKanban.some((x) => /L[ÍI]MITE|LIMIT/.test(x)), eti('la urgencia no cuenta como "sobre el límite"'));
  revisar(v.apagado && v.texto === t.enCurso, eti(`mientras dura, el botón queda apagado y dice «${v.texto}»`));
  await p.screenshot({ path: `${DIR}/${idioma}-control-urgencia.png` });

  // La mosca trabaja en ella: la urgente avanza y las normales quedan como
  // estaban (si justo está fumando o con café, se espera un poco más)
  const urgAntes = (await tareas(p)).find((x) => x.urgente);
  let avanzo = false;
  let normalesQuietas = true;
  for (let i = 0; i < 20 && !avanzo; i++) {
    await p.evaluate(() => window.__mosca.adelantar(3));
    const ahora = await tareas(p);
    const u1 = ahora.find((x) => x.urgente);
    avanzo = !!u1 && u1.restante < urgAntes.restante - 1e-9;
    for (const a of antes) {
      const d = ahora.find((x) => x.id === a.id);
      if (d && Math.abs(d.restante - a.restante) > 1e-9) normalesQuietas = false;
    }
  }
  revisar(avanzo, eti('la mosca trabaja en la urgencia (le baja lo que falta)'));
  revisar(normalesQuietas, eti('lo que soltó queda a medias (las normales no avanzan)'));

  // En Exhibición: el mismo botón, dentro de la escena, apagado mientras dura
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(1600);
  v = await leer(p);
  const escena = await caja(p, '#escena');
  const dentro = v.caja.left >= escena.left && v.caja.right <= escena.right && v.caja.top >= escena.top && v.caja.bottom <= escena.bottom;
  revisar(v.visible && dentro && v.apagado && v.texto === t.enCurso, eti(`en Exhibición el botón está en la escena y dice «${v.texto}»`));
  revisar(!chocan(v.caja, await caja(p, '#ex-mosca')) && !chocan(v.caja, await caja(p, '#ex-inicio')), eti('en Exhibición no tapa el estado de la mosca ni el aviso'));

  // Termina: pasa a "Terminadas" con su rótulo y el botón vuelve
  await terminarUrgencia(p, 1);
  await p.waitForTimeout(250);
  v = await leer(p);
  revisar(v.urg.terminadas === 1 && v.urg.enCurso === 0, eti(`la urgencia se terminó a las ${v.hora}`));
  revisar(v.kanban.hechas.length >= 1 && v.kanban.hechas[0].urgente && v.textosKanban.includes(t.urgente), eti('pasa a Terminadas arriba y con su rótulo'));
  revisar(!v.kanban.enCurso.some((c) => c.urgente), eti('En curso queda sin urgentes'));
  revisar(v.visible && !v.apagado && v.texto === t.boton, eti(`el botón vuelve a decir «${v.texto}»`));
  revisar(v.mHechas === `${v.hechasNormales} + 1` && v.mHechasTitulo === t.hechas(v.hechasNormales, 1), eti(`Terminadas del panel: «${v.mHechas}» (${v.mHechasTitulo})`));
  revisar(v.cfHechas === t.hechas(v.hechasNormales, 1) && v.cfUrg === null, eti(`Terminadas en grande: «${v.cfHechas}», sin la línea del tiempo hasta terminar el día`));
  revisar(v.mTiempoNota === t.normales && v.cfTiempoNota === t.normales, eti(`el rótulo del tiempo por tarea dice «${v.mTiempoNota.trim()}»`));

  // Segunda urgencia, apretada en Exhibición (con su aviso), y captura
  await p.click('#btn-urgencia');
  await p.waitForTimeout(250);
  v = await leer(p);
  revisar(v.urg.llegadas === 2 && v.urg.enCurso === 1 && v.textosKanban.includes(t.llego) && v.kanban.enCurso[0]?.urgente, eti('en Exhibición también manda una urgencia'));
  await p.screenshot({ path: `${DIR}/${idioma}-exhibicion-urgencia.png` });
  await terminarUrgencia(p, 2);

  // Fin del día: las dos cifras y cuánto tardó cada urgencia
  await p.evaluate(() => window.__mosca.completarDia());
  await p.waitForTimeout(600);
  v = await leer(p);
  const m = await tardoEsperado(p);
  revisar(v.terminado && !v.visible, eti('al cierre el botón no se ve'));
  revisar(v.cfHechas === t.hechas(v.hechasNormales, 2), eti(`Resumen del día · Terminadas: «${v.cfHechas}»`));
  revisar(v.cfUrg === t.tardo(m, 2), eti(`Resumen del día: «${v.cfUrg}»`));
  revisar(v.exFin[v.exFin.length - 1]?.[0] === `${v.hechasNormales} + 2`, eti(`la tabla del fin del día dice «${v.exFin[v.exFin.length - 1]?.[0]}»`));
  await p.screenshot({ path: `${DIR}/${idioma}-exhibicion-resumen.png` });
  await p.evaluate(() => window.__mosca.vista('control'));
  await p.waitForTimeout(1600);
  v = await leer(p);
  revisar(v.bannerVisible && v.banner === `${t.hechas(v.hechasNormales, 2)}. ${t.tardo(m, 2)}.`, eti(`el aviso de fin del día dice «${v.banner}»`));
  revisar(v.tabla.length === 1 && v.tabla[0][0] === `${v.hechasNormales} + 2` && v.tabla[0][1] === t.hechas(v.hechasNormales, 2), eti(`Días jugados: «${v.tabla[0]?.[0]}»`));
  await p.screenshot({ path: `${DIR}/${idioma}-control-resumen.png` });

  // Día 2: cinco urgencias → "Hoy ya llegaron 5"; el resumen en plural
  await p.keyboard.press('r');
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__mosca.adelantar(30));
  for (let i = 1; i <= 5; i++) {
    await p.waitForTimeout(150);
    v = await leer(p);
    revisar(v.visible && !v.apagado && v.texto === t.boton, eti(`día 2, urgencia ${i}: el botón está listo`));
    await p.click('#btn-urgencia');
    await terminarUrgencia(p, i);
  }
  await p.waitForTimeout(250);
  v = await leer(p);
  revisar(v.urg.llegadas === 5 && v.urg.terminadas === 5 && v.apagado && v.texto === t.tope, eti(`después de la quinta: «${v.texto}»`));
  await p.evaluate(() => window.__mosca.completarDia());
  await p.waitForTimeout(600);
  v = await leer(p);
  const m5 = await tardoEsperado(p);
  revisar(v.banner === `${t.hechas(v.hechasNormales, 5)}. ${t.tardo(m5, 5)}.`, eti(`día 2 · aviso: «${v.banner}»`));
  revisar(v.mHechas === `${v.hechasNormales} + 5`, eti(`día 2 · Terminadas del panel: «${v.mHechas}»`));
  if (idioma === 'es') await p.screenshot({ path: `${DIR}/control-resumen-5-urgencias.png` });

  // Día 3, sin apretar el botón: el resumen de siempre (números solos, nada más)
  await p.keyboard.press('r');
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__mosca.completarDia());
  await p.waitForTimeout(600);
  v = await leer(p);
  revisar(/^\d+$/.test(v.mHechas) && v.mHechasTitulo === null && /^\d+$/.test(v.cfHechas) && v.cfUrg === null && v.banner === null && v.mTiempoNota === '' && v.cfTiempoNota === '', eti('sin urgencias, el resumen es el de siempre'));
  revisar(v.tabla.length === 3 && /^\d+$/.test(v.tabla[2][0]) && v.tabla[2][1] === null, eti('sin urgencias, la tabla es la de siempre'));

  // Día 4: una urgencia a las 09:05 y cambiar el límite antes de las 09:15 rearma sin urgencias
  await p.keyboard.press('r');
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__mosca.adelantar(5));
  await p.click('#btn-urgencia');
  await p.waitForTimeout(200);
  v = await leer(p);
  revisar(v.urg.llegadas === 1, eti('día 4: una urgencia a las 09:05'));
  await p.evaluate(() => window.__mosca.setWip(3));
  await p.waitForTimeout(300);
  v = await leer(p);
  revisar(v.wip === 3 && v.urg.llegadas === 0 && v.urg.enCurso === 0 && !v.apagado && v.texto === t.boton && !v.textosKanban.includes(t.urgente), eti('cambiar el límite antes de las 09:15 rearma el día sin urgencias'));

  revisar(!errores.length, eti(`sin errores en la consola${errores.length ? `: ${errores.slice(0, 3).join(' | ')}` : ''}`));
  await contexto.close();
}
// ---------- Celular (iPhone 14): el botón abajo, sobre la hoja ----------
const tel = (w, h, dpr, ua) => ({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, userAgent: ua, locale: 'es-CL' });
async function probarCelular(idioma) {
  const t = T[idioma];
  const eti = (s) => `${idioma} · celular: ${s}`;
  const contexto = await b.newContext(tel(390, 664, 3, devices['iPhone 14'].userAgent));
  const { p, errores } = await abrir(contexto, idioma);
  const cel = await p.evaluate(() => window.__mosca.celular());
  revisar(cel.activo, eti('se enciende el modo celular'));
  let v = await leer(p);
  revisar(!v.visible, eti('antes de empezar el botón no se ve'));

  await p.evaluate(() => {
    window.__mosca.setWip(2);
    window.__mosca.empezar();
    window.__mosca.detenerReloj(true);
    window.__mosca.adelantar(60);
  });
  await p.waitForTimeout(400);
  v = await leer(p);
  revisar(v.visible && !v.apagado && v.texto === t.boton, eti(`a las ${v.hora} el botón se ve y dice «${v.texto}»`));
  revisar(v.caja.height >= 44 && v.caja.width >= 44, eti(`zona de toque ${Math.round(v.caja.width)}×${Math.round(v.caja.height)}`));
  const escena = await caja(p, '#escena');
  const hoja = await caja(p, '#panel');
  revisar(v.caja.top >= escena.top && v.caja.bottom <= escena.bottom && v.caja.bottom <= hoja.top, eti('está dentro de la oficina y sobre la hoja'));
  revisar(v.caja.top >= escena.top + escena.height * 0.6, eti('va abajo, lejos del tablero (que está arriba)'));
  for (const s of ['#ex-mosca', '#cel-controles', '#cel-volver', '#panel', '#cel-pestanas']) revisar(!chocan(v.caja, await caja(p, s)), eti(`no choca con ${s}`));

  await p.tap('#btn-urgencia');
  await p.waitForTimeout(300);
  v = await leer(p);
  revisar(v.urg.llegadas === 1 && v.urg.enCurso === 1 && v.kanban.enCurso[0]?.urgente, eti('al tocar entra una urgencia, arriba de las en curso'));
  revisar(v.textosKanban.includes(t.urgente) && v.textosKanban.includes(t.llego), eti(`el tablero dice «${t.urgente}» y «${t.llego}»`));
  revisar(v.apagado && v.texto === t.enCurso, eti(`mientras dura: «${v.texto}»`));
  await p.screenshot({ path: `${DIR}/${idioma}-celular-urgencia.png` });

  await terminarUrgencia(p, 1);
  await p.waitForTimeout(250);
  v = await leer(p);
  revisar(v.urg.terminadas === 1 && v.kanban.hechas[0]?.urgente && !v.apagado && v.texto === t.boton, eti('termina, pasa a Terminadas y el botón vuelve'));
  revisar(v.mHechas === `${v.hechasNormales} + 1`, eti(`Terminadas de la hoja: «${v.mHechas}»`));

  await p.evaluate(() => window.__mosca.completarDia());
  await p.waitForTimeout(700);
  v = await leer(p);
  const m = await tardoEsperado(p);
  revisar(!v.visible && v.bannerVisible, eti('al cierre el botón no se ve y sale el aviso de fin del día'));
  revisar(v.banner === `${t.hechas(v.hechasNormales, 1)}. ${t.tardo(m, 1)}.`, eti(`el aviso dice «${v.banner}»`));
  const banner = await caja(p, '#banner-fin-dia');
  revisar(banner.visible && banner.bottom <= hoja.top + 1 && banner.right <= 390 && banner.left >= 0, eti('el aviso cabe sobre la hoja'));
  await p.screenshot({ path: `${DIR}/${idioma}-celular-resumen.png` });
  revisar(!errores.length, eti(`sin errores en la consola${errores.length ? `: ${errores.slice(0, 3).join(' | ')}` : ''}`));
  await contexto.close();
}

for (const idioma of ['es', 'en']) await probarComputador(idioma);
for (const idioma of ['es', 'en']) await probarCelular(idioma);
await b.close();
if (fallas.length) {
  console.log(`\nFALLAS (${fallas.length}):\n- ${fallas.join('\n- ')}`);
  process.exit(1);
}
console.log('\nurgencia: todo bien');
