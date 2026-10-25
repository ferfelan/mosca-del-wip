// Prueba el juego en inglés (?lang=en) en tres pantallas: 1280x720
// (proyector), 1440x900 y 1920x1080 (tele). Abre dos copias de la misma
// partida, una en español y otra en inglés (mismo azar), juega parte del día
// y cambia EN → ES → EN con el botón ES | EN. Revisa:
//  1. que no haya errores;
//  2. que no quede nada en español: textos y títulos de la página (también lo
//     escondido, como "¿Es real?"), el cartelito del gráfico, la tarjetita de
//     una neurona y los textos de la escena 3D (kanban, póster y post-its);
//  3. que ningún texto se salga de su caja ni quede cortado donde en español
//     no pasa, también con las frases más largas que puede poner el juego;
//  4. que al volver a español todo diga EXACTAMENTE lo mismo que la copia que
//     se abrió en español (también la escena 3D), y al volver a inglés, lo
//     mismo que antes del cambio;
//  5. que cambiar de idioma no reinicie el día (misma hora, WIP y terminadas);
//  6. el botón (cuál está marcado), <html lang>, ?lang=en y que la página en
//     inglés no se vea un instante en español al cargar.
// Además saca capturas en inglés (paneles abiertos, panel del cerebro, más
// tarde con mucho WIP, bajando el límite y el resumen del fin del día) y los
// lienzos del kanban, el póster y los post-its, para mirarlos.
// Requiere npm run dev. Capturas en capturas/ingles/ (o CAPTURAS=<carpeta>).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PAGINA, TEXTOS } from '../src/juego-textos.js';

const JUEGO = 'http://localhost:5173/jugar/';
const CAPTURAS = process.env.CAPTURAS ?? 'capturas/ingles';
// TAMANOS=1440x900 prueba solo uno (para ir más rápido)
const TAMANOS = process.env.TAMANOS
  ? process.env.TAMANOS.split(',').map((t) => t.split('x').map(Number))
  : [
      [1280, 720],
      [1440, 900],
      [1920, 1080],
    ];
mkdirSync(CAPTURAS, { recursive: true });

// Todos los botones ES | EN marcan el mismo idioma (son tres desde el modo
// celular de la 5.2e: el del cerebro, el flotante y el de la hoja del celular;
// antes la prueba esperaba exactamente dos y fallaba aunque el juego estaba bien)
function marcaSolo(marcados, idioma) {
  const partes = marcados.split(' ');
  return partes.length >= 4 && partes.every((p) => {
    const [i, v] = p.split(':');
    return v === String(i === idioma);
  });
}

// ---------- Palabras en español que no deberían verse en inglés ----------
// Las del juego (todo lo que dice en español y no aparece en su inglés) más
// las más comunes del idioma. Se permiten el nombre del juego, MaleCNS y el
// autor; los botones ES | EN se saltan (cada uno dice su idioma).
const PERMITIDAS = ['Mosca del WIP', 'MaleCNS', 'Male CNS', 'Felipe Fernández'];
const COMUNES = 'de la el los las del al con por para que qué una uno un se su sus es está hay más menos sin muy ya hoy día días hora horas tarea tareas mosca cerebro estrés vez cada como cómo también todo otro otra nuevo vista mostrar ocultar pausa juego tecla clic doble terminado terminadas hecho curso hacer límite sostenible nivel neuronas encendidas reposo zona zonas datos licencia en';
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
function restosDeEspanol(texto) {
  let t = String(texto);
  for (const p of PERMITIDAS) t = t.split(p).join(' ');
  const malas = palabras(t).filter((w) => enEspanol.has(w));
  if (/[áéíóúñü¿¡]/i.test(t)) malas.push('(letras con tilde o ¿¡)');
  if (/(^|[^A-Za-z])y([^A-Za-z]|$)/.test(t)) malas.push('y');
  return malas;
}

// 0. El diccionario: cada texto tiene su inglés y su inglés no tiene español
const fallas = [];
const revisar = (ok, texto) => {
  if (!ok) fallas.push(texto);
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${texto}`);
};
{
  const sinIngles = Object.entries(TEXTOS).filter(([, v]) => v.es === undefined || v.en === undefined).map(([k]) => k);
  const conEspanol = [];
  const mirar = (clave, v) => {
    if (typeof v === 'string') {
      if (/[áéíóúñü¿¡]/i.test(v.split('Felipe Fernández').join(''))) conEspanol.push(clave);
      else if (palabras(v).some((w) => COMUNES.split(' ').includes(w))) conEspanol.push(clave);
    } else if (typeof v === 'function') mirar(clave, v('Qq', 'Zz', 3, 4, 5));
    else if (Array.isArray(v)) v.forEach((x, i) => mirar(`${clave}[${i}]`, x));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => mirar(`${clave}.${k}`, x));
  };
  Object.entries(TEXTOS).forEach(([k, v]) => mirar(k, v.en));
  Object.entries(PAGINA).forEach(([es, en]) => mirar(`«${es.slice(0, 25)}»`, en));
  revisar(!sinIngles.length && !conEspanol.length, `diccionario: ${Object.keys(TEXTOS).length + Object.keys(PAGINA).length} textos, todos con su inglés${sinIngles.length ? ` (faltan: ${sinIngles})` : ''}${conEspanol.length ? ` (con español: ${conEspanol})` : ''}`);
}

// ---------- Lo que se lee de una página ----------
// Todos los textos y títulos (con su "ruta" en la página, para comparar las
// dos copias), lo que dice la escena 3D y la partida
function leerTodo() {
  const ruta = (el) => {
    if (el.id) return '#' + el.id;
    if (el === document.body) return 'body';
    const pa = el.parentElement;
    return ruta(pa) + '>' + el.tagName.toLowerCase() + ':' + [...pa.children].indexOf(el);
  };
  const textos = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const pa = n.parentElement;
    if (!pa || ['SCRIPT', 'STYLE'].includes(pa.tagName)) continue;
    const t = n.nodeValue.replace(/\s+/g, ' ').trim();
    if (t) textos.push([ruta(pa), t]);
  }
  for (const el of document.body.querySelectorAll('*'))
    for (const a of ['title', 'aria-label', 'alt', 'placeholder', 'aria-valuetext']) {
      const v = el.getAttribute(a);
      if (v) textos.push([ruta(el) + '@' + a, v]);
    }
  textos.push(['document.title', document.title]);
  const e = window.__mosca.estado();
  return {
    textos,
    escena: window.__mosca.textosEscena(),
    partida: { hora: e.hora, wip: e.wip, enCurso: e.enCurso, hechas: e.hechas, colillas: e.colillas, terminado: e.terminado },
  };
}

// Textos que se ven en inglés pero están en español (se saltan los botones
// ES | EN: cada uno dice su propio idioma)
function textosParaRevisar() {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const pa = n.parentElement;
    if (!pa || ['SCRIPT', 'STYLE'].includes(pa.tagName) || pa.closest('[data-idioma]')) continue;
    if (n.nodeValue.trim()) out.push(n.nodeValue.trim());
  }
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('[data-idioma]')) continue;
    for (const a of ['title', 'aria-label', 'alt', 'placeholder', 'aria-valuetext']) {
      const v = el.getAttribute(a);
      if (v) out.push(`${v}`);
    }
  }
  out.push(document.title);
  return out;
}

// Textos que se salen de su caja o quedan cortados, cuántas líneas ocupa cada
// uno y si algún panel necesita barra. La caja es el botón, la celda o la
// tarjeta donde está el texto, sin su relleno: el texto debe quedar adentro.
function medir() {
  const ruta = (el) => {
    if (el.id) return '#' + el.id;
    if (el === document.body) return 'body';
    const pa = el.parentElement;
    return ruta(pa) + '>' + el.tagName.toLowerCase() + ':' + [...pa.children].indexOf(el);
  };
  const CAJAS = '#panel, #cerebro, #ex-mosca, #ex-fin, #ex-inicio, .rotulo-escena, #barra-exhibicion, #cerebro-info, #cerebro-ficha, #banner-fin-dia, #btn-mostrar-cerebro, #btn-mostrar-controles, #idioma-flotante, #btn-vista-inicial, .cerebro-dia-tooltip';
  const interior = (caja) => {
    const r = caja.getBoundingClientRect();
    const cs = getComputedStyle(caja);
    return { left: r.left + parseFloat(cs.paddingLeft), right: r.right - parseFloat(cs.paddingRight), top: r.top, bottom: r.bottom };
  };
  const problemas = {};
  const lineas = {};
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg, script, style')) continue;
    const propios = [...el.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (!propios.length || !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const r = ruta(el);
    const cs = getComputedStyle(el);
    if (el.scrollWidth > el.clientWidth + 1 && /hidden|clip/.test(cs.overflowX)) problemas[`cortado: ${r}`] = el.textContent.trim();
    const tops = new Set();
    for (const n of propios) {
      const rango = document.createRange();
      rango.selectNodeContents(n);
      const t = rango.getBoundingClientRect();
      if (!t.width) continue;
      [...rango.getClientRects()].forEach((c) => c.width && tops.add(Math.round(c.top / 4)));
      const cajas = [el.closest('button, th, td, li, label, kbd'), el.closest(CAJAS)].filter(Boolean);
      for (const caja of cajas) {
        const c = interior(caja);
        if (t.left < c.left - 1 || t.right > c.right + 1 || t.top < c.top - 1 || t.bottom > c.bottom + 1)
          problemas[`se sale de ${caja.id || caja.className || caja.tagName}: ${r}`] = n.nodeValue.trim();
      }
      if (t.right > innerWidth + 1 || t.bottom > innerHeight + 1 || t.left < -1 || t.top < -1) problemas[`fuera de la pantalla: ${r}`] = n.nodeValue.trim();
    }
    lineas[r] = tops.size;
  }
  const panel = document.getElementById('panel');
  if (panel.checkVisibility() && panel.scrollHeight > panel.clientHeight + 1) problemas['el panel de controles necesita barra'] = `${panel.scrollHeight} > ${panel.clientHeight}`;
  const cerebro = document.getElementById('cerebro');
  if (cerebro.checkVisibility() && cerebro.getBoundingClientRect().bottom > innerHeight - 2) problemas['el panel del cerebro es más alto que la pantalla'] = '';
  return { problemas, lineas };
}

// Cada frase que el juego puede poner en un lugar, de a una: ¿cabe ella y
// cabe todo lo que la acompaña en su tarjeta? (se mide y se vuelve a dejar lo
// que había). "fijos" pone antes los textos más largos de al lado (100 %).
function probarFrases({ variantes, fijos }) {
  const CAJAS = '#panel, #cerebro, #ex-mosca, #ex-fin, #ex-inicio, .rotulo-escena';
  const cabe = (el) => {
    const caja = el.closest('button, th, td, li, label') ?? el.closest(CAJAS);
    if (!caja) return true;
    const r = caja.getBoundingClientRect();
    const cs = getComputedStyle(caja);
    const rango = document.createRange();
    rango.selectNodeContents(el);
    const t = rango.getBoundingClientRect();
    if (!t.width) return true;
    const cortado = el.scrollWidth > el.clientWidth + 1 && /hidden|clip/.test(getComputedStyle(el).overflowX);
    return !cortado && t.left >= r.left + parseFloat(cs.paddingLeft) - 1 && t.right <= r.right - parseFloat(cs.paddingRight) + 1 && t.bottom <= r.bottom + 1;
  };
  const conTexto = (raiz) => [...raiz.querySelectorAll('*')].filter((x) => [...x.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()) && x.checkVisibility());
  const restaurar = Object.entries(fijos).map(([id, texto]) => {
    const el = document.getElementById(id);
    const antes = el.textContent;
    el.textContent = texto;
    return [el, antes];
  });
  const resultado = {};
  for (const [id, frases] of Object.entries(variantes)) {
    const el = document.getElementById(id);
    if (!el || !el.checkVisibility()) continue;
    const antes = el.textContent;
    // lo de al lado que ya no cabía antes no cuenta (no es culpa de la frase)
    const vecinos = conTexto(el.closest(CAJAS) ?? el.parentElement).filter((v) => v !== el && cabe(v));
    let peor = { lineas: 0, sale: false, frase: '' };
    for (const frase of frases) {
      el.textContent = frase;
      const rango = document.createRange();
      rango.selectNodeContents(el);
      const lineas = new Set([...rango.getClientRects()].filter((c) => c.width).map((c) => Math.round(c.top / 4))).size;
      const sale = !cabe(el) || vecinos.some((v) => !cabe(v));
      if (sale && !peor.sale) peor = { lineas, sale, frase };
      else if (!peor.sale && lineas > peor.lineas) peor = { lineas, sale, frase };
    }
    el.textContent = antes;
    resultado[id] = peor;
  }
  restaurar.forEach(([el, antes]) => (el.textContent = antes));
  return resultado;
}

// Todas las frases que puede poner el juego en los lugares más justos
function frasesDe(idioma) {
  const t = (clave, ...datos) => {
    const v = TEXTOS[clave][idioma];
    return typeof v === 'function' ? v(...datos) : v;
  };
  const niveles = idioma === 'en' ? ['Calm', 'Busy', 'Stressed', 'Overwhelmed'] : ['Tranquila', 'Ocupada', 'Estresada', 'Colapsada'];
  return {
    'ex-mosca-hace': Object.values(t('queHace')),
    'ex-mosca-nivel': niveles,
    'm-estres': niveles,
    'ex-inicio-tipo': [t('modoDemo'), t('enPausa'), t('enVivo'), t('porEmpezar')],
    'ex-inicio-texto': [t('avisoTerminando', 10), t('muchasTareas'), t('pocasTareas')],
    'wip-nota': [t('notaTerminando', 10), t('notaDentro', 3), t('notaSobre', 3)],
    'btn-pausa': [t('pausa'), t('reanudar'), t('empezar')],
    'btn-borrar-historial': [t('borrarHistorial'), t('confirmarBorrado')],
    'btn-girar-texto': [t('detener'), t('girar')],
    'cifras-titulo': [t('resumenDelDia'), t('hoyEnLaOficina')],
    'zonas-titulo': [t('zonasAhora'), t('zonasDia')],
    'zonas-sub': [t('zonasSubAhora'), t('zonasSubDia')],
    'ex-fin-texto': [t('demoSigue', 10), t('otroDia')],
    'ex-fin-titulo': [t('finDelDiaWip', 10)],
    'cerebro-frase': [t('frase'), t('fraseFin')],
  };
}

const esperar = (p, ms) => p.waitForTimeout(ms);
// Espera a que los textos se queden quietos (el contador del cerebro baja suave)
async function quieto(p) {
  let antes = '';
  for (let i = 0; i < 30; i++) {
    await esperar(p, 350);
    const ahora = JSON.stringify(await p.evaluate(leerTodo));
    if (ahora === antes) return JSON.parse(ahora);
    antes = ahora;
  }
  return JSON.parse(antes);
}

async function abrir(b, w, h, consulta) {
  const contexto = await b.newContext({ viewport: { width: w, height: h } });
  const p = await contexto.newPage();
  // El mismo azar en las dos copias; y cómo estaba la página al cargar (el
  // script del <head> la esconde mientras se pone en inglés)
  await p.addInitScript(() => {
    let s = 12345;
    Math.random = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    window.__semilla = (v) => {
      s = v >>> 0;
    };
    new MutationObserver(() => {
      const raiz = document.documentElement;
      if (raiz.classList.contains('traduciendo')) window.__escondida = true;
      else if (window.__escondida && window.__alMostrar === undefined) window.__alMostrar = document.getElementById('btn-pausa')?.textContent.trim();
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  p.errores = [];
  p.on('pageerror', (e) => p.errores.push(e.message));
  p.on('console', (m) => {
    if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) p.errores.push(m.text());
  });
  await p.goto(JUEGO + consulta, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  return p;
}

// Día nuevo con WIP 9, en pausa a las 13:00, con el mismo azar en las dos copias
const prepararDia = () => {
  const m = window.__mosca;
  m.diaExhibicion(2);
  m.pausar(true);
  window.__semilla(1);
  m.setWip(9);
  m.adelantar(240);
};

const comparar = (a, b) => {
  const x = a.map((e) => e.join(' = '));
  const y = b.map((e) => e.join(' = '));
  if (JSON.stringify(x) === JSON.stringify(y)) return '';
  const solo = x.filter((e) => !y.includes(e)).slice(0, 3);
  const otro = y.filter((e) => !x.includes(e)).slice(0, 3);
  return ` · antes: ${solo.join(' | ')} · ahora: ${otro.join(' | ')}`;
};

async function guardarLienzos(p, nombre) {
  const imgs = await p.evaluate(() => {
    const out = { postits: [] };
    const vistos = new Set();
    window.__mosca.escena.traverse((o) => {
      const mapa = o.material?.map;
      const img = mapa?.image;
      if (!(img instanceof HTMLCanvasElement) || vistos.has(img)) return;
      vistos.add(img);
      if (img.width === 1024 && img.height === 620) out.kanban = img.toDataURL();
      else if (mapa.userData.redibujar) out.poster = img.toDataURL();
      else if (mapa.userData.escribir) out.postits.push(img);
    });
    // los post-its, en una sola imagen
    const hoja = document.createElement('canvas');
    hoja.width = 7 * 136;
    hoja.height = 2 * 136;
    const ctx = hoja.getContext('2d');
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, hoja.width, hoja.height);
    out.postits.forEach((img, i) => ctx.drawImage(img, (i % 7) * 136 + 4, Math.floor(i / 7) * 136 + 4));
    out.postits = hoja.toDataURL();
    return out;
  });
  for (const [k, url] of Object.entries(imgs)) writeFileSync(`${CAPTURAS}/lienzo-${k}${nombre}.png`, Buffer.from(url.split(',')[1], 'base64'));
}

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const avisos = [];
for (const [w, h] of TAMANOS) {
  console.log(`\n${w}x${h}`);
  const es = await abrir(b, w, h, '');
  const en = await abrir(b, w, h, '?lang=en');

  // 6. Al cargar: inglés desde el primer momento
  const carga = await en.evaluate(() => ({
    lang: document.documentElement.lang,
    url: location.search,
    escondida: window.__escondida === true,
    alMostrar: window.__alMostrar,
    sigue: document.documentElement.classList.contains('traduciendo'),
    idioma: window.__mosca.idioma(),
    marcados: [...document.querySelectorAll('[data-idioma]')].map((x) => `${x.dataset.idioma}:${x.getAttribute('aria-pressed')}`).join(' '),
  }));
  revisar(
    carga.lang === 'en' && carga.url.includes('lang=en') && carga.escondida && carga.alMostrar === 'Start' && !carga.sigue && carga.idioma === 'en',
    `abre en inglés: <html lang="${carga.lang}">, ${carga.url}, escondida mientras se traduce (${carga.escondida}) y al mostrarse ya decía "${carga.alMostrar}"`
  );
  revisar(marcaSolo(carga.marcados, 'en'), `el botón marca EN (${carga.marcados})`);
  // La tarjeta de Empezar (el juego parte detenido) ya está en inglés
  const tarjeta = await en.evaluate(() => document.getElementById('aviso-empezar').innerText.replace(/\s+/g, ' ').trim());
  revisar(
    tarjeta === 'An office day in one minute Choose how many tasks the fly has at once, then press Start. Start',
    `la tarjeta de Empezar en inglés («${tarjeta}»)`
  );
  const cargaEs = await es.evaluate(() => ({ lang: document.documentElement.lang, escondida: window.__escondida === true }));
  revisar(cargaEs.lang === 'es' && !cargaEs.escondida, `sin ?lang abre en español y no se esconde (lang="${cargaEs.lang}")`);

  // Los mismos momentos en las dos copias; en cada uno: nada en español, nada
  // que se salga, ES igual a la copia en español y vuelta a EN igual que antes
  const momentos = [
    ['control 13:00 con WIP 9', prepararDia, '#cerebro .idioma'],
    ['exhibición', () => window.__mosca.vista('exhibicion'), '#idioma-flotante'],
    ['exhibición fin del día', () => { window.__semilla(2); window.__mosca.completarDia(); }, '#idioma-flotante'],
    ['control fin del día', () => window.__mosca.vista('control'), '#cerebro .idioma'],
    ['control fin del día sin controles', () => window.__mosca.ocultarControles(true), '#cerebro .idioma'],
    ['control con el cerebro oculto', () => { window.__mosca.ocultarControles(false); window.__mosca.ocultarCerebro(true); }, '#idioma-flotante'],
  ];
  for (const [nombre, paso, boton] of momentos) {
    await Promise.all([es.evaluate(paso), en.evaluate(paso)]);
    const [refEs, ingles] = await Promise.all([quieto(es), quieto(en)]);
    // 2. Nada en español (página y escena 3D)
    const restos = [];
    for (const t of await en.evaluate(textosParaRevisar)) {
      const malas = restosDeEspanol(t);
      if (malas.length) restos.push(`«${t.slice(0, 60)}» (${malas.join(', ')})`);
    }
    const escena = [...ingles.escena.kanban, ...ingles.escena.poster, ...ingles.escena.postits.flat()];
    for (const t of escena) {
      const malas = restosDeEspanol(t);
      if (malas.length) restos.push(`escena 3D «${t}» (${malas.join(', ')})`);
    }
    revisar(!restos.length, `${nombre}: nada en español${restos.length ? ': ' + [...new Set(restos)].slice(0, 6).join(' · ') : ''}`);
    // 3. Nada que se salga (comparado con la copia en español)
    const [mEs, mEn] = await Promise.all([es.evaluate(medir), en.evaluate(medir)]);
    const nuevos = Object.entries(mEn.problemas).filter(([k]) => !(k in mEs.problemas));
    revisar(!nuevos.length, `${nombre}: ningún texto se sale ni se corta${nuevos.length ? ': ' + nuevos.map(([k, v]) => `${k} («${v}»)`).join(' · ') : ''}`);
    for (const [r, n] of Object.entries(mEn.lineas)) if (mEs.lineas[r] && n > mEs.lineas[r]) avisos.push(`${w}x${h} ${nombre}: ${r} ocupa ${n} líneas (en español ${mEs.lineas[r]})`);

    // 4 y 5. EN → ES: igual a la copia en español; ES → EN: igual que antes
    await en.click(`${boton} [data-idioma="es"]`);
    const vuelta = await quieto(en);
    const estadoEs = await en.evaluate(() => ({
      lang: document.documentElement.lang,
      url: location.search,
      guardado: localStorage.getItem('mosca-idioma'),
      marcados: [...document.querySelectorAll('[data-idioma]')].map((x) => `${x.dataset.idioma}:${x.getAttribute('aria-pressed')}`).join(' '),
    }));
    const difTextos = comparar(refEs.textos, vuelta.textos);
    const escenaIgual = JSON.stringify(refEs.escena) === JSON.stringify(vuelta.escena);
    revisar(!difTextos && escenaIgual, `${nombre}: EN → ES dice exactamente lo mismo que la copia en español (${vuelta.textos.length} textos${escenaIgual ? ', escena 3D igual' : ', LA ESCENA 3D CAMBIA'})${difTextos}`);
    revisar(
      estadoEs.lang === 'es' && !estadoEs.url.includes('lang') && estadoEs.guardado === 'es' && marcaSolo(estadoEs.marcados, 'es'),
      `${nombre}: en español: lang="${estadoEs.lang}", dirección sin ?lang, recordado "${estadoEs.guardado}", botón ${estadoEs.marcados}`
    );
    await en.click(`${boton} [data-idioma="en"]`);
    const otraVez = await quieto(en);
    const difEn = comparar(ingles.textos, otraVez.textos);
    const escenaEn = JSON.stringify(ingles.escena) === JSON.stringify(otraVez.escena);
    revisar(!difEn && escenaEn, `${nombre}: ES → EN vuelve a decir lo mismo que antes${difEn}${escenaEn ? '' : ' · la escena 3D cambia'}`);
    const partidas = [ingles.partida, vuelta.partida, otraVez.partida, refEs.partida].map((x) => JSON.stringify(x));
    revisar(new Set(partidas).size === 1, `${nombre}: cambiar de idioma no toca la partida (${ingles.partida.hora}, WIP ${ingles.partida.wip}, ${ingles.partida.hechas} terminadas)`);

    // 3b. Cada frase que el juego puede poner en los lugares más justos, de a una
    const fijos = { 'ex-mosca-pct': '100%' };
    const [fEs, fEn] = await Promise.all([es.evaluate(probarFrases, { variantes: frasesDe('es'), fijos }), en.evaluate(probarFrases, { variantes: frasesDe('en'), fijos })]);
    const largas = Object.entries(fEn).filter(([id, f]) => (f.sale && !fEs[id]?.sale) || (fEs[id] && f.lineas > fEs[id].lineas));
    revisar(!largas.some(([, f]) => f.sale), `${nombre}: las frases más largas del juego caben${largas.filter(([, f]) => f.sale).map(([id, f]) => ` · no cabe en #${id}: «${f.frase}»`).join('')}`);
    largas.filter(([, f]) => !f.sale).forEach(([id, f]) => avisos.push(`${w}x${h} ${nombre}: #${id} «${f.frase}» ocupa ${f.lineas} líneas (en español hasta ${fEs[id].lineas})`));
  }
  await en.evaluate(() => window.__mosca.ocultarCerebro(false));
  await es.close();

  // ---------- Capturas en inglés (la partida corriendo) ----------
  const foto = (nombre) => en.screenshot({ path: `${CAPTURAS}/${nombre}-${w}.png` });
  await en.evaluate(() => {
    const m = window.__mosca;
    m.diaExhibicion(9);
    m.adelantar(240);
  });
  await esperar(en, 2500);
  await foto('control');
  if (w === 1440) await guardarLienzos(en, '-wip9');
  // Panel del cerebro: la tarjetita de una neurona (un clic la deja fija) y
  // el cartelito del gráfico
  await en.keyboard.press('c');
  await esperar(en, 900);
  const neurona = await en.evaluate(() => window.__mosca.cerebroDonde(2));
  if (neurona) await en.mouse.click(neurona.x, neurona.y);
  await esperar(en, 400);
  const ficha = await en.evaluate(() => (document.getElementById('cerebro-ficha').hidden ? '' : document.getElementById('cerebro-ficha').textContent));
  const caja = await en.locator('#lienzo-dia').boundingBox();
  await en.mouse.move(caja.x + caja.width * 0.45, caja.y + caja.height * 0.4);
  await esperar(en, 300);
  const cartel = await en.evaluate(() => (document.getElementById('cerebro-dia-tooltip').hidden ? '' : document.getElementById('cerebro-dia-tooltip').textContent));
  await foto('cerebro');
  const malasFicha = restosDeEspanol(ficha);
  const malasCartel = restosDeEspanol(cartel);
  revisar(ficha && !malasFicha.length, `tarjetita de una neurona en inglés: «${ficha}»`);
  revisar(cartel && !malasCartel.length, `cartelito del gráfico en inglés: «${cartel}»`);
  await en.click('#btn-es-real');
  await esperar(en, 400);
  await foto('es-real');
  const dialogo = await en.evaluate(medir);
  const fueraDialogo = Object.keys(dialogo.problemas).filter((k) => k.includes('cerebro-info'));
  revisar(!fueraDialogo.length, `"Is it real?" cabe en su cuadro${fueraDialogo.length ? ': ' + fueraDialogo.join(' · ') : ''}`);
  await en.click('#btn-cerrar-info');
  await en.click('#btn-girar-cerebro'); // vuelve a girar y suelta la tarjetita
  await en.keyboard.press('c');
  await en.keyboard.press('b');
  await esperar(en, 1200);
  await foto('cerebro-oculto');
  await en.keyboard.press('b');
  // Más tarde y con mucho WIP, en Exhibición
  await en.evaluate(() => {
    const m = window.__mosca;
    m.vista('exhibicion');
    m.diaExhibicion(10);
    m.adelantar(390);
  });
  await esperar(en, 2500);
  await foto('exhibicion-wip10');
  // Bajando el límite: lo empezado sigue abierto
  await en.keyboard.press('2');
  await esperar(en, 1500);
  await foto('exhibicion-bajando');
  if (w === 1440) await guardarLienzos(en, '-bajando');
  const bajando = await en.evaluate(() => ({ aviso: document.getElementById('ex-inicio').textContent.replace(/\s+/g, ' ').trim(), kanban: window.__mosca.textosEscena().kanban }));
  revisar(bajando.aviso.includes('new limit 2') && bajando.kanban.includes('OVER THE LIMIT (2)'), `bajando el límite: «${bajando.aviso}» y en el kanban «${bajando.kanban.filter((t) => /LIMIT|\//.test(t)).join(' · ')}»`);
  // Fin del día, en las dos vistas
  await en.evaluate(() => window.__mosca.completarDia());
  await esperar(en, 1500);
  await foto('fin-exhibicion');
  await en.evaluate(() => window.__mosca.vista('control'));
  await esperar(en, 1500);
  await foto('fin-control');
  const errores = [...en.errores, ...es.errores];
  revisar(!errores.length, `sin errores${errores.length ? ': ' + errores.join(' · ') : ''}`);
  await en.close();
}
await b.close();

if (avisos.length) {
  console.log('\nTextos que en inglés ocupan más líneas que en español (no es falla; mirar las capturas):');
  avisos.forEach((a) => console.log('  ' + a));
}
console.log(`\nCapturas en ${CAPTURAS}/`);
console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\ninglés: todo bien');
console.log('errores:', fallas.some((f) => f.startsWith('sin errores')) ? 'sí (ver arriba)' : 'ninguno');
