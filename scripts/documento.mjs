// Arma los PDF del proyecto. Los dos informes (regla de Felipe, 2026-10-19):
//  · "Informe completo": todo, para Felipe, para entender y retomar el
//    proyecto (fuente: docs/contexto/completo.html).
//  · "Para compartir": la historia corta (10 a 15 páginas), para cualquier
//    persona (fuente: docs/contexto/compartir.html). Y su traducción al inglés
//    (2026-10-25: la portada en inglés descarga el informe en inglés), con las
//    mismas hojas y números (fuente: docs/contexto/compartir-en.html; sus fotos
//    del juego, en inglés, van a docs/contexto/img-en/ con IDIOMA=en).
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
// independiente: compartir v6, completo v5; 21 oct., parte 4.6: compartir v7,
// completo v6; parte 4.7: compartir v8, 16 a 17 hojas; 22 oct., parte 4.8:
// compartir v9, solo la portada ilustrada; v10: páginas en blanco puro, el tono
// papel solo en la portada; v11: en la portada, el café nivelado en la taza
// inclinada y la gota de sudor apoyada en la cabeza; v12: gotas que salen de la
// cabeza y hojas que caen desde la torre; v13: gotas corriendo por la cabeza y
// hojas desparramadas para varios lados; 24 oct., primeros lectores: compartir v14,
// el feedback de tres lectores junto, y completo v7; revisión de Felipe del v14, el mismo
// día: compartir v15 ("Dato freak", sin "[…]", pág. 8 con cinco tarjetas, pág. 9 en dos
// filas, gráfico de la pág. 5 con valores en 2 y 9) y completo v8; arreglos de Felipe al
// v15, el mismo día: compartir v16, datos freak nuevos y "Regla nuestra" en la pág. 2; v17, mismo
// día: la tarjeta de DORA de la pág. 8 sin la frase del ideal, que ya está en el dato freak de la pág. 6;
// v18: la dirección del juego publicado; 25 oct.: compartir v19 y completo v9, el nivel "Tranqui"
// pasa a llamarse "Tranquila", con las fotos de los grupos paneles y estres sacadas de nuevo;
// completo v10, la Etapa 5 en la sección 27, con las fotos del grupo sitio; "Para compartir en
// inglés" v19, la traducción del v19, con las fotos del juego en inglés; completo v11, la parte
// 5.2g: el botón Empezar, el informe en inglés y la portada al día; completo v12, el logo nítido
// de la 5.2g, que se había caído del v11, y el cierre de la presentación; compartir v20 (ES y EN) y
// completo v13, los detalles de la 5.2h; 26 oct., 5.2i: compartir v21 (ES y EN), la pág. 1 sin la caja
// "Qué es", y completo v14, con el botón "← Inicio", la línea "Creado por" y las columnas 18/9 de la portada;
// 28 oct.: compartir v22 (ES y EN), la pág. 11 con el paso 4 igual a la prueba del taller y la línea del kit, y
// completo v15, las Etapas 6 y 7 en la sección 28; completo v16, la Etapa 7 publicada, con el menú único y el logo nuevo; completo v17, Google Search Console listo; completo v18, Bing Webmaster Tools listo);
// 29 oct.: compartir en inglés v23, solo dos frases más naturales ("Tasks finished per day" y "It’s a computer experiment."); el español sigue en v22;
// completo v19, los seis detalles después de publicar en una página nueva de la sección 28; y completo v20, la vista
// previa de WhatsApp (íconos y vistas previas con la fecha en el nombre) en otra página nueva de la sección 28.
//
// Uso: node scripts/documento.mjs                → los dos informes (y el de
//                                                  compartir en inglés)
//      DOC=compartir node scripts/documento.mjs  → sólo uno (completo, compartir,
//                                                  compartir-en, norte, etapa4-1
//                                                  o etapa4-2)
//      FOTOS=1 node scripts/documento.mjs        → antes saca todas las imágenes
//                                                  del juego (requiere npm run dev)
//      FOTOS=paneles,cierre node …               → sólo esos grupos: holograma,
//        paneles, es-real, escenas, cerebros, estres, mundo, monitor-limite, monitor-bloqueo, cierre,
//        sitio (la portada publicada y el juego en modo celular, para la sección 27)
//      IDIOMA=en FOTOS=mundo,escenas,cerebros,cierre node …
//                                                → las fotos con el juego en
//                                                  inglés, a docs/contexto/img-en/
//                                                  (las del informe en inglés)
//      SALIDA=/otra/carpeta, FECHA=2026-10-19,   → otra carpeta, fecha o versión
//      VERSION=v2
import { chromium, devices } from 'playwright';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PDFDocument } from 'pdf-lib';

const CARPETA = resolve('docs/contexto');
// El idioma del juego en las fotos: español (img/) o inglés (img-en/)
const IDIOMA = process.env.IDIOMA === 'en' ? 'en' : 'es';
const IMG = join(CARPETA, IDIOMA === 'en' ? 'img-en' : 'img');
const SALIDA = process.env.SALIDA ?? join(homedir(), 'Desktop', 'Mosca del WIP');
const FECHA = process.env.FECHA ?? new Date().toLocaleDateString('sv-SE'); // 2026-10-20
const DOCUMENTOS = [
  // 4 nov. 2026, 8.4: compartir v23 (ES) y v24 (EN), las urgencias y el recorte del 28 %; completo v21, la Etapa 8 en la sección 29.
  // 4 nov. 2026, arreglos chicos de Felipe (8.4, sección 9): compartir v24 (ES) y v25 (EN), solo texto (Perlow, DORA, "empeora", fecha)
  // 7 nov. 2026, 8.7: completo v24, la sección 31 (la portada que pregunta, los dos bloques, el juego que pregunta y el resumen en prosa).
  // 10 nov. 2026, 8.8: completo v25, la sección 32 (la portada y el juego más vivos, el recorrido, el saltito y el panel) y las fotos del grupo paneles de nuevo.
  { id: 'completo', html: 'completo.html', nombre: 'Informe completo', version: 'v25' },
  // 6 nov. 2026, 8.6: compartir v25 (ES) y v26 (EN), el mensaje nuevo en la portada, la pág. 1 y la pág. 11.
  // 7 nov. 2026, 8.7: compartir v26 (ES) y v27 (EN), sin "Termina más empezando menos" y la pág. 11 con para qué sirve un límite.
  // 12 nov. 2026, 8.11: compartir v27 (ES) y v28 (EN), el informe vuelve a ser "el extenso": el texto del v22 (v23 en inglés) más la página de las urgencias, 18 hojas. El resumen va aparte.
  // 13 nov. 2026, 8.12: compartir v28 (ES) y v29 (EN), sin dos puntos en nada de lo que se lee ("elimina los : en todos lados"), salvo las horas del reloj. Mismas 18 hojas y misma paginación, ningún número ni fuente cambia. Las fuentes anteriores quedan en docs/contexto/v27/ y v28/.
  // 14 nov. 2026, 8.14: compartir v29 (ES) y v30 (EN), con la ley de Little y su condición, "al mismo ritmo de salida" ("at the same output rate"), en el dato freak de la pág. 5, la tabla de reglas de la pág. 2 y la tabla "Cada número y de dónde sale" del anexo B (pág. 14). Mismas 18 hojas y misma paginación, ningún número ni fuente cambia. Las fuentes anteriores quedan en docs/contexto/v28/compartir.html y v29/compartir-en.html.
  { id: 'compartir', html: 'compartir.html', nombre: 'Para compartir', version: 'v29', paginas: [18, 18] },
  { id: 'compartir-en', html: 'compartir-en.html', nombre: 'Para compartir en inglés', version: 'v30', paginas: [18, 18] },
  // Etapa 8.6 (2026-11-06): el resumen de 4 páginas con el mensaje nuevo, en español e inglés (DOC=resumen y DOC=resumen-en)
  // Etapa 8.7 (2026-11-07): el v2, de nuevo desde cero, en prosa: una columna de 4 páginas en primera persona
  // 12 nov. 2026, 8.11: el v3, el resumen ejecutivo, aparte del informe: 2 hojas con la identidad de la portada (los dos tableros de noche sobre blanco y Mona Sans; estilo en docs/contexto/resumen.css; el v2 quedó en docs/contexto/resumen-v2/)
  // 14 nov. 2026, 8.14: el v4, sin la bajada de "¿Qué ganó la mosca…?", con "al mismo ritmo de salida" en la ley de Little y con la letra fija (letrasFijas): al copiar el texto, los títulos ya no salen pegados
  { id: 'resumen', html: 'resumen.html', nombre: 'Resumen', version: 'v4', paginas: [2, 2], aparte: true, letrasFijas: true },
  { id: 'resumen-en', html: 'resumen-en.html', nombre: 'Summary', version: 'v4', paginas: [2, 2], aparte: true, letrasFijas: true },
  { id: 'norte', html: 'norte.html', nombre: 'Norte del proyecto', version: 'v1', paginas: [1, 2], aparte: true },
  { id: 'etapa4-1', html: 'etapa4-1.html', nombre: 'Etapa 4.1 La paradoja', version: 'v1', paginas: [1, 3], aparte: true },
  { id: 'etapa4-2', html: 'etapa4-2.html', nombre: 'Etapa 4.2 Robustez', version: 'v1', paginas: [1, 3], aparte: true },
  { id: 'etapa4-3', html: 'etapa4-3.html', nombre: 'Etapa 4.3 Cruce con los estudios', version: 'v1', paginas: [1, 3], aparte: true },
  // Etapa 8.2 (2026-11-03): las urgencias (H5a, H5b, H5c), 3 hojas (DOC=etapa8-2)
  { id: 'etapa8-2', html: 'etapa8-2.html', nombre: 'Etapa 8.2 Urgencias', version: 'v1', paginas: [2, 3], aparte: true },
  { id: 'maqueta', html: 'maqueta-v7.html', nombre: 'Maqueta compartir', version: 'v7', paginas: [3, 3], aparte: true },
  // Etapa 6.0 (2026-10-26): la guía del taller, 16 hojas (se arma con DOC=taller)
  { id: 'taller', html: 'taller.html', nombre: 'Taller - Guía', version: 'v1', paginas: [14, 16], aparte: true },
  // Etapa 6.0 v2 (2026-10-26): el manual del facilitador del taller "Deja de empezar, empieza a terminar", 12 hojas (DOC=taller-v2)
  { id: 'taller-v2', html: 'taller-v2.html', nombre: 'Taller - Manual del facilitador', version: 'v2', paginas: [11, 12], aparte: true },
  { id: 'taller-v3', html: 'taller-v3.html', nombre: 'Taller - Guía rápida del facilitador', version: 'v3', paginas: [8, 8], aparte: true },
  { id: 'taller-v4', html: 'taller-v4.html', nombre: 'Taller - Guía rápida del facilitador', version: 'v4', paginas: [5, 5], aparte: true },
  // Etapa 8.5 (2026-11-04): la guía v4 al día con el juego de hoy (fotos, Espacio, urgencias), 5 hojas (DOC=taller-v5)
  { id: 'taller-v5', html: 'taller-v5.html', nombre: 'Taller - Guía rápida del facilitador', version: 'v5', paginas: [5, 5], aparte: true },
  // Arreglo chico (2026-11-04): "Informe, págs. 8 y 9" en "¿Esto es real?" (DOC=taller-v6)
  { id: 'taller-v6', html: 'taller-v6.html', nombre: 'Taller - Guía rápida del facilitador', version: 'v6', paginas: [5, 5], aparte: true },
  // 7 nov. 2026, 8.7: guía v7, solo la foto 3 (la tabla del fin del día con la pregunta nueva)
  { id: 'taller-v7', html: 'taller-v7.html', nombre: 'Taller - Guía rápida del facilitador', version: 'v7', paginas: [5, 5], aparte: true },
  // 12 nov. 2026, 8.11: guía v8, solo "Informe, págs. 8 y 10" en "¿Esto es real?" (con el informe extenso, el cerebro vuelve a la pág. 10) y el número de versión en la portada y en los créditos (DOC=taller-v8)
  { id: 'taller-v8', html: 'taller-v8.html', nombre: 'Taller - Guía rápida del facilitador', version: 'v8', paginas: [5, 5], aparte: true },
  // 13 nov. 2026, 8.12: guía v9, sin dos puntos en el texto que se lee ("elimina los : en todos lados"); la hoja del equipo dice "Nuestro límite para partir es ___" y "vamos a ___" (DOC=taller-v9)
  { id: 'taller-v9', html: 'taller-v9.html', nombre: 'Taller - Guía rápida del facilitador', version: 'v9', paginas: [5, 5], aparte: true },
  // Etapa 7 (2026-10-28): la hoja del equipo sola, 1 hoja, para descargar aparte (DOC=hoja-equipo)
  // 13 nov. 2026, 8.12: hoja v6, sin dos puntos, igual que la última hoja de la guía v9
  { id: 'hoja-equipo', html: 'taller-hoja-equipo.html', nombre: 'Taller - Hoja del equipo', version: 'v6', paginas: [1, 1], aparte: true },
  // Etapa 7 (2026-10-28): los borradores de difusión de docs/etapa7-difusion.md, para leerlos en PDF (DOC=borradores)
  // 7 nov. 2026, 8.7: borradores v3, sin "termina más empezando menos" (los borradores 1 y 6 vuelven a su texto de antes de la 8.6)
  // 10 nov. 2026, 8.8: borradores v4, el artículo dice "Sí, la pusimos a chambear." donde decía "Nadie le preguntó." (igual que la portada)
  // 13 nov. 2026, 8.12: borradores v5, sin dos puntos (los rótulos Título, URL y Text van solos en su línea) y con el informe como descarga
  // 14 nov. 2026, 8.14: borradores v6, el borrador 1 con la ley de Little y su condición ("Que, al mismo ritmo de salida, cada tarea tarde más…")
  { id: 'borradores', html: 'borradores.html', nombre: 'Borradores de difusión', version: 'v6', paginas: [9, 10], aparte: true },
];
const SITIO = 'http://localhost:5173'; // raíz del sitio (portada, docs)
const JUEGO = `${SITIO}/jugar/`; // el juego vive en /jugar/ desde la Etapa 5.1
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });

async function abrirJuego(p, { sinPaneles = false } = {}) {
  p.on('pageerror', (e) => console.log('ERROR', e.message));
  await p.goto(JUEGO, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate(({ sin, idioma }) => {
    localStorage.removeItem('mosca-del-wip-dias');
    localStorage.setItem('mosca-idioma', idioma); // el juego abre en ese idioma al recargar
    for (const k of ['mosca-del-wip-cerebro-oculto', 'mosca-del-wip-controles-oculto']) {
      if (sin) localStorage.setItem(k, '1');
      else localStorage.removeItem(k);
    }
  }, { sin: sinPaneles, idioma: IDIOMA });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate(() => window.__mosca.empezar()); // el juego parte detenido hasta apretar Empezar
  if (sinPaneles) {
    // sólo la escena: sin botones ni avisos encima (ni el ES | EN que aparece
    // con el cerebro oculto, desde la 5.2c)
    await p.addStyleTag({ content: '#btn-mostrar-cerebro,#btn-mostrar-controles,#banner-fin-dia,#ex-inicio,#btn-vista-inicial,#idioma-flotante{display:none!important}' });
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
    await p.goto(`${SITIO}/docs/contexto/arte/holograma.html?w=1240&h=1754&dpr=2`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__listo, { timeout: 180000 });
    await p.locator('canvas').screenshot({ path: join(IMG, 'holograma.jpg'), type: 'jpeg', quality: 92 });
    console.log('foto holograma');
    await p.close();
  }

  // El sitio (Etapa 5, sección 27 del informe completo): la portada en un
  // computador con fondo negro, la portada en un iPhone 14 con el menú
  // abierto, las preguntas frecuentes con fondo blanco y el juego en modo
  // celular con 9 tareas a las 13:30 (pestañas Oficina y Cerebro). El iPhone
  // es el de scripts/probar-celular.mjs: 390 × 664, lo que se ve con las
  // barras de Safari.
  if (quiero('sitio')) {
    const iphone = { viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 14'].userAgent };
    const portada = async (opciones, fondo) => {
      const c = await b.newContext(opciones);
      await c.addInitScript((fondo) => {
        localStorage.setItem('mosca-idioma', 'es');
        localStorage.setItem('mosca-fondo', fondo);
      }, fondo);
      const p = await c.newPage();
      p.on('pageerror', (e) => console.log('ERROR', e.message));
      await p.goto(`${SITIO}/`, { waitUntil: 'networkidle' });
      // (8.13) En el inicio ya no está el cerebro: está el dibujo "¿Te suena?",
      // los pedidos que le van llegando a la mosca, que se repite solo. Para la
      // foto se deja quieto, con todos los pedidos y la mosca al final
      await p.waitForFunction(() => window.__mosca?.suena, null, { timeout: 15000 }).catch(() => {});
      await p.evaluate(() => window.__mosca?.suena?.mostrarCerrado());
      await p.waitForTimeout(900);
      return p;
    };
    let p = await portada({ viewport: { width: 1440, height: 800 }, deviceScaleFactor: 1.5 }, 'oscuro');
    await p.mouse.move(8, 790);
    await p.screenshot({ path: join(IMG, 'sitio-portada.jpg'), type: 'jpeg', quality: 88 });
    console.log('foto sitio-portada');
    await p.context().close();

    p = await portada(iphone, 'oscuro');
    await p.evaluate(() => scrollTo({ top: document.getElementById('juego').offsetTop, behavior: 'instant' }));
    await p.waitForTimeout(1200);
    await p.click('.menu-boton');
    await p.waitForTimeout(900);
    await p.screenshot({ path: join(IMG, 'sitio-celular-menu.jpg'), type: 'jpeg', quality: 88 });
    console.log('foto sitio-celular-menu');
    await p.context().close();

    p = await portada({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 }, 'claro');
    await p.evaluate(() => {
      const preguntas = [...document.querySelectorAll('.pregunta')];
      preguntas[2].open = true; // ¿Cuántas tareas a la vez es lo mejor?
      scrollTo({ top: document.getElementById('preguntas').offsetTop, behavior: 'instant' });
    });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: join(IMG, 'sitio-preguntas.jpg'), type: 'jpeg', quality: 88 });
    console.log('foto sitio-preguntas');
    await p.context().close();

    const c = await b.newContext(iphone);
    await c.addInitScript(() => localStorage.setItem('mosca-idioma', 'es'));
    p = await c.newPage();
    await abrirJuego(p);
    console.log('   modo celular:', JSON.stringify(await p.evaluate(() => window.__mosca.celular())));
    await jugar(p, { wip: 9 });
    await foto(p, 'celular-oficina');
    await p.click('#cel-pestana-cerebro');
    await p.waitForTimeout(1500);
    await foto(p, 'celular-cerebro');
    await c.close();
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

  // Solo el estrés de cada día completo (WIP 2 y WIP 9), sin volver a sacar el
  // cerebro: para cuando cambia algo del gráfico (2026-10-25: "Tranquila")
  if (quiero('estres') && !quiero('cerebros')) {
    const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
    await abrirJuego(p);
    await enVista(p, 'exhibicion');
    for (const wip of [2, 9]) {
      await jugar(p, { wip, hora: '18:00' });
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

// (8.14, 2026-11-14) La letra fija del resumen. Felipe copió el texto del
// resumen desde el visor de PDF de Chrome y los títulos salieron pegados
// ("Ocupadotodoeldía."). Los lectores de PDF no ven los espacios, miran dónde
// queda cada letra y su ancho. Los títulos tienen las letras más juntas
// (letter-spacing negativo), así que el hueco entre palabras parece el de dos
// letras seguidas. Además Mona Sans es una letra variable, y Chrome la guarda
// como "Type 3", con la que pdftotext -raw pega todo el texto. Aquí, antes de
// imprimir, cada texto en Mona Sans pasa a una copia fija de la letra con su
// grueso y su ancho, y con el espaciado entre letras ya incluido en el ancho
// de cada una (las arma scripts/letras-pdf.py en docs/contexto/letras-pdf/).
// Cada letra queda donde estaba, y eso se comprueba: si algo se mueve más de
// una décima de píxel, el PDF no se arma (las copias redondean el ancho de cada
// letra a la milésima de em, y eso mueve algunos textos hasta 0,03 px, menos
// de una centésima de milímetro).
// La holgura: con eso solo, el visor de Chrome todavía pegaba "El trabajo" y
// "your team". Ese visor pone un espacio entre dos palabras solo si el hueco es
// más ancho que la mitad de la letra más ancha de las dos que lo rodean, cuando
// las dos son angostas (menos de 0,4 em, como la l, la r o la t). En los
// títulos con las letras más juntas el espacio mide 0,18 a 0,19 em, y la r o la
// t, 0,39. Por eso, en los textos con espaciado negativo, la copia lleva
// HOLGURA milésimas de em menos por letra y el CSS se las devuelve con
// letter-spacing. Cada letra sigue en su lugar, pero el PDF muestra después de
// cada letra un hueco de 0,04 em (ningún lector lo toma por un espacio, todos
// piden más de 0,07 em) y entre palabras uno de 0,22 em o más (más que la
// mitad de cualquier letra angosta).
const HOLGURA = 40;
const LETRAS_PDF = join(CARPETA, 'letras-pdf');
const PYTHON_LETRAS = resolve('.venv-datos/bin/python');
const claveLetra = ({ wght, wdth, track }) => `w${wght}-d${String(wdth).replace('.', '_')}-t${track < 0 ? 'm' : track > 0 ? 'p' : ''}${String(Math.abs(track)).padStart(3, '0')}`;
const letraDe = (t) => ({ wght: t.wght, wdth: t.wdth, track: t.track - t.holgura });
async function fijarLetras(p) {
  // 1. Qué letra usa cada texto (antes de cambiar nada)
  const textos = await p.evaluate(() => {
    const lista = [];
    const vistos = new Set();
    const caminante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = caminante.nextNode(); n; n = caminante.nextNode()) {
      const el = n.parentElement;
      if (!n.textContent.trim() || vistos.has(el)) continue;
      vistos.add(el);
      const cs = getComputedStyle(el);
      if (!/Mona Sans/.test(cs.fontFamily)) continue;
      const tam = parseFloat(cs.fontSize);
      el.dataset.letraPdf = String(lista.length);
      const r = el.getBoundingClientRect();
      lista.push({ wght: Math.round(parseFloat(cs.fontWeight)), wdth: parseFloat(cs.fontStretch), estilo: cs.fontStyle, espaciado: (parseFloat(cs.letterSpacing) || 0) / tam, ligaduras: cs.fontVariantLigatures, caja: [r.left, r.top, r.width, r.height] });
    }
    // las letras que Mona Sans muestra con ::before o ::after, o con las viñetas, quedarían sin copia fija
    const sueltos = [...document.querySelectorAll('*')].filter((el) => ['::before', '::after', '::marker'].some((ps) => {
      const cs = getComputedStyle(el, ps);
      return /Mona Sans/.test(cs.fontFamily) && /["'][^"']*\S[^"']*["']/.test(cs.content ?? '') && (ps !== '::marker' || getComputedStyle(el).display === 'list-item');
    })).length;
    return { lista, sueltos };
  });
  if (textos.sueltos) throw new Error(`letra fija: ${textos.sueltos} textos de ::before, ::after o viñetas en Mona Sans, que este paso no sabe cambiar`);
  const raras = textos.lista.filter((t) => t.estilo !== 'normal' || Math.abs(t.espaciado * 1000 - Math.round(t.espaciado * 1000)) > 0.05);
  if (raras.length) throw new Error(`letra fija: estilos que no sé copiar (cursiva o espaciado que no es de milésimas de em): ${JSON.stringify(raras.slice(0, 3))}`);
  for (const t of textos.lista) {
    t.track = Math.round(t.espaciado * 1000) || 0;
    t.holgura = t.track < 0 ? HOLGURA : 0;
  }
  // 2. Las copias que faltan, con scripts/letras-pdf.py
  const combinaciones = [...new Map(textos.lista.map((t) => [claveLetra(letraDe(t)), letraDe(t)])).values()];
  const faltan = combinaciones.filter((c) => !existsSync(join(LETRAS_PDF, `letra-pdf-${claveLetra(c)}.woff2`)));
  if (faltan.length) {
    try {
      execFileSync(PYTHON_LETRAS, ['scripts/letras-pdf.py', JSON.stringify(faltan)], { stdio: 'inherit' });
    } catch {
      throw new Error(`letra fija: faltan ${faltan.length} copias de la letra y no se pudieron armar. Instalar una vez con "uv pip install --python .venv-datos/bin/python fonttools brotli" y volver a correr`);
    }
  }
  // 3. Ponerlas: cada texto con su copia, y de espaciado solo la holgura (el
  // resto ya va dentro de la letra)
  const css = combinaciones
    .map((c) => `@font-face { font-family: 'Letra PDF ${claveLetra(c)}'; src: url('${pathToFileURL(join(LETRAS_PDF, `letra-pdf-${claveLetra(c)}.woff2`)).href}') format('woff2'); font-weight: ${c.wght}; font-stretch: ${c.wdth}%; font-style: normal; }`)
    .concat(
      textos.lista.map(
        (t, i) =>
          `[data-letra-pdf="${i}"] { font-family: 'Letra PDF ${claveLetra(letraDe(t))}' !important; letter-spacing: ${t.holgura ? `${t.holgura / 1000}em` : '0'} !important;${t.track ? ' font-variant-ligatures: no-common-ligatures !important;' : ''} }`,
      ),
    )
    .join('\n');
  await p.addStyleTag({ content: css });
  await p.evaluate(async (familias) => {
    await Promise.all(familias.map((f) => document.fonts.load(`16px '${f}'`)));
    await document.fonts.ready;
  }, combinaciones.map((c) => `Letra PDF ${claveLetra(c)}`));
  // 4. Que nada se haya movido
  const despues = await p.evaluate((n) => {
    const fuera = [];
    for (let i = 0; i < n; i++) {
      const el = document.querySelector(`[data-letra-pdf="${i}"]`);
      const r = el.getBoundingClientRect();
      const familia = getComputedStyle(el).fontFamily;
      fuera.push({ caja: [r.left, r.top, r.width, r.height], familia });
    }
    return fuera;
  }, textos.lista.length);
  const movidos = textos.lista
    .map((t, i) => ({ i, d: Math.max(...t.caja.map((v, k) => Math.abs(v - despues[i].caja[k]))) }))
    .filter((x) => x.d > 0.001);
  const masMovido = Math.max(0, ...movidos.map((x) => x.d));
  if (masMovido > 0.1) throw new Error(`letra fija: ${movidos.length} textos se movieron (el más, ${masMovido.toFixed(3)} px)`);
  const usadas = await p.evaluate(() => [...document.fonts].filter((f) => f.family.startsWith('Letra PDF') && f.status !== 'loaded').map((f) => f.family));
  if (usadas.length) throw new Error(`letra fija: no cargaron ${usadas.join(', ')}`);
  console.log(`letra fija: ${textos.lista.length} textos con ${combinaciones.length} copias de Mona Sans (${movidos.length ? `${movidos.length} se corrieron hasta ${masMovido.toFixed(3)} px` : 'ninguno se movió'})`);
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
  if (doc.letrasFijas) await fijarLetras(p);
  const salida = join(SALIDA, `${FECHA} ${doc.nombre} ${process.env.VERSION ?? doc.version}.pdf`);
  await p.pdf({ path: salida, preferCSSPageSize: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  // Etapa 8.6 (punto 9): todo PDF nuevo lleva en sus propiedades el autor,
  // Felipe Fernández (Chromium no pone autor; el título es el <title> de la
  // hoja). Los del sitio reciben además tema y palabras clave con
  // scripts/pdf-metadatos.mjs al copiarlos a public/.
  const conAutor = await PDFDocument.load(readFileSync(salida), { updateMetadata: false });
  conAutor.setAuthor('Felipe Fernández');
  writeFileSync(salida, await conAutor.save());
  console.log('PDF listo:', salida, `(${revision.hojas} páginas)`);
  await p.close();
}
await b.close();
