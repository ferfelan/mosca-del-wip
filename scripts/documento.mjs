// Arma el documento de contexto en PDF (22 páginas; máximo 25), para Felipe,
// un amigo técnico o para pasárselo a otro Claude.
// Fuente editable: docs/contexto/contexto.html (+ imágenes en docs/contexto/img/
// y el arte de portada en docs/contexto/arte/).
//
// Uso: node scripts/documento.mjs          → PDF en el Escritorio
//      FOTOS=1 node scripts/documento.mjs  → antes saca imágenes nuevas del
//                                            juego (requiere npm run dev)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CARPETA = resolve('docs/contexto');
const IMG = join(CARPETA, 'img');
const SALIDA = process.env.SALIDA ?? join(homedir(), 'Desktop', 'Mosca del WIP - Contexto completo.pdf');
const JUEGO = 'http://localhost:5173';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });

async function abrirJuego(p, { sinPaneles = false } = {}) {
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
    await p.addStyleTag({ content: '#btn-mostrar-cerebro,#btn-mostrar-controles,#banner-fin-dia,#ex-inicio{display:none!important}' });
  }
}

// Juega el día de verdad hasta `minutos` (y, si se pide, hasta que salga a
// fumar o a tomar café) y deja la escena quieta en ese momento.
const jugar = (p, { wip, minutos, hasta = null, bajarA = null, segundos = 20 }) =>
  p.evaluate(
    ({ wip, minutos, hasta, bajarA, segundos }) => {
      const m = window.__mosca;
      m.congelar(false);
      m.diaExhibicion(wip);
      m.adelantar(minutos);
      if (bajarA) m.setWip(bajarA);
      m.congelar(true);
      m.avanzar(0); // la escena lee el estado nuevo (pila, post-its, estrés)
      m.avanzar(segundos); // y le da tiempo de llegar a su lugar (todo cambia suave)
      if (hasta) {
        for (let i = 0; i < 300 && !m.estado()[hasta]; i++) m.adelantar(0.5);
        m.avanzar(0);
        m.avanzar(hasta === 'fumando' ? 2.3 : 1.9); // cigarro o taza en la trompita
      }
    },
    { wip, minutos, hasta, bajarA, segundos },
  );

if (process.env.FOTOS) {
  mkdirSync(IMG, { recursive: true });

  // Portada: la mosca en holograma con su cerebro real (docs/contexto/arte/)
  {
    const p = await b.newPage({ viewport: { width: 1240, height: 1754 } });
    p.on('pageerror', (e) => console.log('ERROR', e.message));
    await p.goto(`${JUEGO}/docs/contexto/arte/holograma.html?w=1240&h=1754&dpr=2`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__listo, { timeout: 180000 });
    await p.locator('canvas').screenshot({ path: join(IMG, 'holograma.jpg'), type: 'jpeg', quality: 92 });
    console.log('foto holograma');
    await p.close();
  }

  // Escenas del juego con los paneles (cómo se ve)
  {
    const p = await b.newPage({ viewport: { width: 1500, height: 853 } });
    p.on('pageerror', (e) => console.log('ERROR', e.message));
    await abrirJuego(p);
    const foto = async (nombre) => {
      await p.waitForTimeout(1200);
      await p.screenshot({ path: join(IMG, `${nombre}.jpg`), type: 'jpeg', quality: 86 });
      console.log('foto', nombre);
    };
    await jugar(p, { wip: 2, minutos: 270 });
    await foto('control-wip2');
    await jugar(p, { wip: 9, minutos: 300, hasta: 'fumando' });
    await foto('control-wip9');
    await p.evaluate(() => window.__mosca.vista('exhibicion'));
    await p.waitForTimeout(1500);
    await jugar(p, { wip: 6, minutos: 200, hasta: 'fumando' });
    await foto('exhibicion');
    await p.close();
  }

  // Monitor mientras drena: WIP 10, a las 12:00 baja a 2 (foto a las 12:45)
  {
    const p = await b.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 2 });
    await abrirJuego(p, { sinPaneles: true });
    await jugar(p, { wip: 10, minutos: 180, bajarA: 2 });
    await p.evaluate(() => { const m = window.__mosca; m.congelar(false); m.adelantar(45); m.congelar(true); m.avanzar(0); m.avanzar(20); });
    await p.evaluate(() => window.__mosca.camara([-0.25, 1.75, 1.1], [-0.9, 1.72, -0.35]));
    await p.waitForTimeout(900);
    await p.screenshot({ path: join(IMG, 'monitor-limite.jpg'), type: 'jpeg', quality: 88, clip: { x: 250, y: 80, width: 760, height: 560 } });
    console.log('foto monitor-limite');
    await p.close();
  }

  // Cierre: fin de un buen día (WIP 2), tomando café frente al kanban
  {
    const p = await b.newPage({ viewport: { width: 1400, height: 1120 }, deviceScaleFactor: 2 });
    await abrirJuego(p, { sinPaneles: true });
    await jugar(p, { wip: 2, minutos: 455, hasta: 'tomandoCafe' });
    await p.evaluate(() => window.__mosca.camara([-2.7, 2.15, 1.45], [-0.62, 1.32, 0.12]));
    await p.waitForTimeout(900);
    await p.screenshot({ path: join(IMG, 'cierre.jpg'), type: 'jpeg', quality: 88 });
    console.log('foto cierre');
    await p.close();
  }
}

const p = await b.newPage();
await p.goto(pathToFileURL(join(CARPETA, 'contexto.html')).href, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
// Revisión: ninguna página puede desbordarse (se cortaría el texto)
const desbordes = await p.evaluate(() =>
  [...document.querySelectorAll('.hoja')]
    .map((h, i) => ({ pagina: i + 1, sobra: h.scrollHeight - h.clientHeight }))
    .filter((x) => x.sobra > 1),
);
if (desbordes.length) console.log('OJO, páginas que se desbordan:', JSON.stringify(desbordes));
await p.pdf({ path: SALIDA, preferCSSPageSize: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
console.log('PDF listo:', SALIDA, `(${await p.evaluate(() => document.querySelectorAll('.hoja').length)} páginas)`);
await b.close();
