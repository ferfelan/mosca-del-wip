// Arma los PDF del proyecto. Los dos informes (regla de Felipe, 2026-10-19):
//  · "Informe completo": todo, para Felipe, para entender y retomar el
//    proyecto (fuente: docs/contexto/completo.html).
//  · "Para compartir": la historia corta (10 a 15 páginas), para cualquier
//    persona (fuente: docs/contexto/compartir.html).
// Y los cortos de la Etapa 4, que sólo se arman cuando se piden con DOC:
//  · "Norte del proyecto" (1 a 2 páginas; fuente: docs/contexto/norte.html).
//  · "Etapa 4.1 La paradoja" (1 a 3 páginas; fuente: docs/contexto/etapa4-1.html).
//  · "Etapa 4.2 Robustez" (1 a 3 páginas; fuente: docs/contexto/etapa4-2.html).
// Todos usan docs/contexto/estilo.css y las imágenes de docs/contexto/img/
// (todas sacadas del juego o del arte de portada: nada de referencias/).
//
// Van a la carpeta "Mosca del WIP" del Escritorio (regla de Felipe,
// 2026-10-20), con la fecha de hoy al inicio y la versión al final:
// "2026-10-19 Informe completo v1.pdf". Al cambiar el contenido de un
// informe, súbele la versión aquí abajo (20 oct., arreglos previos a la revisión
// independiente: compartir v4 y v5, completo v3 y v4; arreglos de la revisión
// independiente: compartir v6, completo v5).
//
// Uso: node scripts/documento.mjs                → los dos informes
//      DOC=compartir node scripts/documento.mjs  → sólo uno (completo, compartir,
//                                                  norte, etapa4-1 o etapa4-2)
//      FOTOS=1 node scripts/documento.mjs        → antes saca todas las imágenes
//                                                  del juego (requiere npm run dev)
//      FOTOS=paneles,cierre node …               → sólo esos grupos: holograma,
//        paneles, es-real, escenas, cerebros, mundo, monitor-limite, monitor-bloqueo, cierre
//      SALIDA=/otra/carpeta, FECHA=2026-10-19,   → otra carpeta, fecha o versión
//      VERSION=v2
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CARPETA = resolve('docs/contexto');
const IMG = join(CARPETA, 'img');
const SALIDA = process.env.SALIDA ?? join(homedir(), 'Desktop', 'Mosca del WIP');
const FECHA = process.env.FECHA ?? new Date().toLocaleDateString('sv-SE'); // 2026-10-20
const DOCUMENTOS = [
  { id: 'completo', html: 'completo.html', nombre: 'Informe completo', version: 'v6' },
  { id: 'compartir', html: 'compartir.html', nombre: 'Para compartir', version: 'v7', paginas: [15, 16] },
  { id: 'norte', html: 'norte.html', nombre: 'Norte del proyecto', version: 'v1', paginas: [1, 2], aparte: true },
  { id: 'etapa4-1', html: 'etapa4-1.html', nombre: 'Etapa 4.1 La paradoja', version: 'v1', paginas: [1, 3], aparte: true },
  { id: 'etapa4-2', html: 'etapa4-2.html', nombre: 'Etapa 4.2 Robustez', version: 'v1', paginas: [1, 3], aparte: true },
  { id: 'etapa4-3', html: 'etapa4-3.html', nombre: 'Etapa 4.3 Cruce con los estudios', version: 'v1', paginas: [1, 3], aparte: true },
  { id: 'maqueta', html: 'maqueta-v7.html', nombre: 'Maqueta compartir', version: 'v7', paginas: [3, 3], aparte: true },
];
const JUEGO = 'http://localhost:5173';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });

async function abrirJuego(p, { sinPaneles = false } = {}) {
  p.on('pageerror', (e) => console.log('ERROR', e.message));
  await p.goto(JUEGO, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate((sin) => {
    localStorage.removeItem('mosca-del-wip-dias');
    for (const k of ['mosca-del-wip-cerebro-oculto', 'mosca-del-wip-controles-oculto']) {
      if (sin) localStorage.setItem(k, '1');
      else localStorage.removeItem(k);
    }
  }, sinPaneles);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  if (sinPaneles) {
    // sólo la escena: sin botones ni avisos encima
    await p.addStyleTag({ content: '#btn-mostrar-cerebro,#btn-mostrar-controles,#banner-fin-dia,#ex-inicio,#btn-vista-inicial{display:none!important}' });
  }
}

// Juega el día de verdad (reglas normales) hasta esa hora y deja el reloj del
// juego detenido en ese momento. Con `momento` ('fumando' o 'tomandoCafe')
// espera a que salga a fumar o a tomar café y deja el cigarro o la taza en la
// trompita; si no, evita quedar a mitad de una pausa. `nuevo: false` sigue el
// día que ya va.
const jugar = (p, { wip = null, hora = '13:30', momento = null, segundos = 20 }) =>
  p.evaluate(
    ({ wip, hora, momento, segundos }) => {
      const m = window.__mosca;
      m.detenerReloj(false);
      m.congelar(false);
      if (wip) m.diaExhibicion(wip);
      const [h, mm] = hora.split(':').map(Number);
      const ahora = () => 540 + m.estado().fraccionDelDia * 540;
      m.adelantar(Math.max(0, h * 60 + mm - ahora()));
      if (!momento) {
        for (let i = 0; i < 40 && !m.estado().terminado && (m.estado().fumando || m.estado().tomandoCafe); i++) m.adelantar(1);
      }
      m.detenerReloj(true);
      m.congelar(true);
      m.avanzar(0); // la escena lee el estado nuevo (pila, post-its, estrés)
      m.avanzar(segundos); // y le da tiempo de llegar a su lugar (todo cambia suave)
      if (momento) {
        for (let i = 0; i < 400 && !m.estado()[momento]; i++) m.adelantar(0.5);
        m.avanzar(0);
        m.avanzar(momento === 'fumando' ? 2.3 : 1.9); // cigarro o taza en la trompita
      }
      return m.estado();
    },
    { wip, hora, momento, segundos },
  );

const enVista = async (p, v) => {
  await p.evaluate((v) => window.__mosca.vista(v), v);
  await p.waitForTimeout(1600);
};
const foto = async (p, nombre, opciones = {}) => {
  await p.mouse.move(8, 450); // lejos del cerebro (con el cursor encima gira más lento)
  await p.waitForTimeout(1600);
  const destino = { path: join(IMG, `${nombre}.jpg`), type: 'jpeg', quality: 88 };
  if (opciones.elemento) await p.locator(opciones.elemento).screenshot(destino);
  else await p.screenshot({ ...destino, ...(opciones.clip ? { clip: opciones.clip } : {}) });
  console.log('foto', nombre);
};
// El cerebro en su vista inicial y quieto, para comparar dos fotos parejas
const cerebroQuieto = async (p) => {
  await p.evaluate(() => document.getElementById('btn-centrar-cerebro').click());
  await p.waitForTimeout(150);
  await p.evaluate(() => document.getElementById('btn-girar-cerebro').click());
  await p.addStyleTag({ content: '.cerebro-botones{visibility:hidden!important}' }); // sin botones en la foto
};

// FOTOS=1 saca todas; FOTOS=a,b sólo esos grupos
const quiero = (nombre) => process.env.FOTOS === '1' || (process.env.FOTOS ?? '').split(',').includes(nombre);
if (process.env.FOTOS) {
  mkdirSync(IMG, { recursive: true });

  // Portada: la mosca en holograma con su cerebro real (docs/contexto/arte/)
  if (quiero('holograma')) {
    const p = await b.newPage({ viewport: { width: 1240, height: 1754 } });
    p.on('pageerror', (e) => console.log('ERROR', e.message));
    await p.goto(`${JUEGO}/docs/contexto/arte/holograma.html?w=1240&h=1754&dpr=2`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__listo, { timeout: 180000 });
    await p.locator('canvas').screenshot({ path: join(IMG, 'holograma.jpg'), type: 'jpeg', quality: 92 });
    console.log('foto holograma');
    await p.close();
  }

  // Las dos vistas con el panel final (v4), en días jugados de verdad: WIP 2 y
  // WIP 9 a las 13:30 y al terminar el día, "¿Es real?" y la tarjetita
  if (quiero('paneles')) {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
    await abrirJuego(p);
    await jugar(p, { wip: 2 });
    await foto(p, 'control-wip2');
    await enVista(p, 'exhibicion');
    await foto(p, 'exhibicion-wip2');
    await jugar(p, { hora: '18:00' });
    await enVista(p, 'control');
    await jugar(p, { wip: 9 }); // a las 13:30 fijas, la misma hora que WIP 2 (revisión independiente, I1)
    await foto(p, 'control-wip9');
    await enVista(p, 'exhibicion');
    await foto(p, 'exhibicion-wip9');
    await jugar(p, { hora: '18:00' });
    await foto(p, 'fin-exhibicion');
    await enVista(p, 'control');
    await foto(p, 'fin-control');
    await p.keyboard.press('c'); // sin el panel de la derecha, el resumen suma los números
    await p.waitForTimeout(1400);
    await foto(p, 'fin-sin-controles');
    await p.keyboard.press('c');
    await p.waitForTimeout(1200);
    // "¿Es real?" abierto en Control, con el día en curso (WIP 9)
    await jugar(p, { wip: 9 });
    await p.click('#btn-es-real');
    await p.waitForTimeout(500);
    await foto(p, 'es-real');
    await p.keyboard.press('Escape');
    // La tarjetita de aBN1 (clic sobre la neurona: queda fija) en Exhibición
    await enVista(p, 'exhibicion');
    const donde = await p.evaluate(() => window.__mosca.cerebroDonde(2));
    await p.mouse.move(donde.x, donde.y);
    await p.waitForTimeout(80);
    const donde2 = await p.evaluate(() => window.__mosca.cerebroDonde(2));
    await p.mouse.click(donde2.x, donde2.y);
    await p.waitForTimeout(400);
    await p.screenshot({ path: join(IMG, 'tarjetita.jpg'), type: 'jpeg', quality: 88 });
    console.log('foto tarjetita:', await p.evaluate(() => document.getElementById('cerebro-ficha').innerText.replace(/\n/g, ' | ')));
    await p.close();
  }

  // Solo el cuadro "¿Es real?" abierto en Control (WIP 9 a las 13:30), para
  // rehacer esa foto cuando cambia su texto sin repetir todo el grupo "paneles"
  if (quiero('es-real')) {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
    await abrirJuego(p);
    await jugar(p, { wip: 9 });
    await p.click('#btn-es-real');
    await p.waitForTimeout(500);
    await foto(p, 'es-real');
    await p.keyboard.press('Escape');
    await p.close();
  }

  // Escenas sin paneles (para el informe para compartir): la oficina con WIP 2
  // y con WIP 9 a la misma hora
  if (quiero('escenas')) {
    const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
    await abrirJuego(p, { sinPaneles: true });
    await jugar(p, { wip: 2 });
    await foto(p, 'escena-wip2');
    await jugar(p, { wip: 9 }); // a las 13:30 fijas, la misma hora que WIP 2 (revisión independiente, I1)
    await foto(p, 'escena-wip9');
    await p.close();
  }

  // El cerebro (vista inicial, quieto) con WIP 2 y WIP 9 a las 13:30, y el
  // estrés de cada día completo, sacados del panel de Exhibición
  if (quiero('cerebros')) {
    const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
    await abrirJuego(p);
    await enVista(p, 'exhibicion');
    for (const wip of [2, 9]) {
      const e = await jugar(p, { wip });
      await cerebroQuieto(p);
      await foto(p, `cerebro-wip${wip}`, { elemento: '#lienzo-cerebro' });
      console.log(`   WIP ${wip}: ${await p.evaluate(() => document.getElementById('c-activas').textContent)} neuronas encendidas (${e.enCurso.length ?? e.enCurso} abiertas)`);
      await jugar(p, { hora: '18:00' });
      await foto(p, `estres-wip${wip}`, { elemento: '.cerebro-dia' });
    }
    await p.close();
  }

  // La mosca y su tablero, de cerca y sin paneles (página 2 del informe para
  // compartir v3, pedido de Felipe: la captura con el panel tenía texto
  // ilegible). WIP 2 a media mañana; cámara más cerca que la oficial.
  if (quiero('mundo')) {
    const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
    await abrirJuego(p, { sinPaneles: true });
    await jugar(p, { wip: 2, hora: '10:10' });
    await p.evaluate(() => window.__mosca.camara([0.3, 2.1, 2.1], [-0.9, 1.4, -0.5]));
    await foto(p, 'mundo-wip2');
    await p.close();
  }

  // Monitor mientras drena: WIP 10, a las 12:00 baja a 2 (foto a las 12:45)
  if (quiero('monitor-limite')) {
    const p = await b.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 2 });
    await abrirJuego(p, { sinPaneles: true });
    await jugar(p, { wip: 10, hora: '12:00' });
    await p.evaluate(() => { const m = window.__mosca; m.setWip(2); m.adelantar(45); m.avanzar(0); m.avanzar(20); });
    await p.evaluate(() => window.__mosca.camara([-0.25, 1.75, 1.1], [-0.9, 1.72, -0.35]));
    await foto(p, 'monitor-limite', { clip: { x: 250, y: 80, width: 760, height: 560 } });
    await p.close();
  }

  // Monitor con una tarea bloqueada (WIP 3 a las 11:00; tarjeta roja con candado)
  if (quiero('monitor-bloqueo')) {
    const p = await b.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 2 });
    await abrirJuego(p, { sinPaneles: true });
    await jugar(p, { wip: 3, hora: '11:00' });
    await p.evaluate(() => { const m = window.__mosca; m.forzar({ bloqueadas: 1, minutosBloqueo: 600 }); m.adelantar(0.5); m.avanzar(0); m.avanzar(4); });
    await p.evaluate(() => window.__mosca.camara([-0.25, 1.75, 1.1], [-0.9, 1.72, -0.35]));
    await foto(p, 'monitor-bloqueo', { clip: { x: 250, y: 80, width: 760, height: 560 } });
    await p.close();
  }

  // Cierre: fin de un buen día (WIP 2), tomando café frente al kanban; y su
  // contraparte con la misma cámara: WIP 9 fumando a la misma hora
  if (quiero('cierre')) {
    const p = await b.newPage({ viewport: { width: 1400, height: 1120 }, deviceScaleFactor: 2 });
    await abrirJuego(p, { sinPaneles: true });
    for (const [nombre, wip, momento] of [['cierre', 2, 'tomandoCafe'], ['fumando', 9, 'fumando']]) {
      await jugar(p, { wip, hora: '16:35', momento });
      await p.evaluate(() => window.__mosca.camara([-2.7, 2.15, 1.45], [-0.62, 1.32, 0.12]));
      await foto(p, nombre);
    }
    await p.close();
  }
}

// Los PDF. Revisión: ninguna página puede desbordarse (se cortaría el texto),
// ninguna imagen puede faltar, y cada uno debe quedar en su rango de páginas.
const pedido = process.env.DOC;
mkdirSync(SALIDA, { recursive: true });
for (const doc of DOCUMENTOS.filter((d) => (pedido ? d.id === pedido : !d.aparte))) {
  const p = await b.newPage();
  await p.goto(pathToFileURL(join(CARPETA, doc.html)).href, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const revision = await p.evaluate(() => ({
    desbordes: [...document.querySelectorAll('.hoja')]
      .map((h, i) => ({ pagina: i + 1, sobra: h.scrollHeight - h.clientHeight }))
      .filter((x) => x.sobra > 1),
    sinImagen: [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute('src')),
    hojas: document.querySelectorAll('.hoja').length,
  }));
  if (revision.desbordes.length) console.log(`OJO (${doc.id}), páginas que se desbordan:`, JSON.stringify(revision.desbordes));
  if (revision.sinImagen.length) console.log(`OJO (${doc.id}), imágenes que no cargan:`, revision.sinImagen.join(', '));
  if (doc.paginas && (revision.hojas < doc.paginas[0] || revision.hojas > doc.paginas[1])) {
    console.log(`OJO (${doc.id}): tiene ${revision.hojas} páginas y debe tener entre ${doc.paginas[0]} y ${doc.paginas[1]}`);
  }
  const salida = join(SALIDA, `${FECHA} ${doc.nombre} ${process.env.VERSION ?? doc.version}.pdf`);
  await p.pdf({ path: salida, preferCSSPageSize: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  console.log('PDF listo:', salida, `(${revision.hojas} páginas)`);
  await p.close();
}
await b.close();
