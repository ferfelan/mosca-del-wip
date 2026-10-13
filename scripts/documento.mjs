// Arma el documento de contexto en PDF (para pasárselo a otro Claude).
// Fuente editable: docs/contexto/contexto.html (+ capturas en docs/contexto/img/).
//
// Uso: node scripts/documento.mjs          → PDF en el Escritorio
//      FOTOS=1 node scripts/documento.mjs  → antes saca capturas nuevas del
//                                            juego (requiere npm run dev)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CARPETA = resolve('docs/contexto');
const SALIDA = process.env.SALIDA ?? join(homedir(), 'Desktop', 'Mosca del WIP - Contexto completo.pdf');
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });

if (process.env.FOTOS) {
  mkdirSync(join(CARPETA, 'img'), { recursive: true });
  const p = await b.newPage({ viewport: { width: 1500, height: 853 } });
  p.on('pageerror', (e) => console.log('ERROR', e.message));
  const abrir = async () => {
    await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  };
  await abrir();
  await p.evaluate(() => ['mosca-del-wip-dias', 'mosca-del-wip-cerebro-oculto', 'mosca-del-wip-controles-oculto'].forEach((k) => localStorage.removeItem(k)));
  await abrir();
  const foto = async (nombre) => {
    await p.waitForTimeout(1200);
    await p.screenshot({ path: join(CARPETA, 'img', `${nombre}.jpg`), type: 'jpeg', quality: 84 });
    console.log('foto', nombre);
  };
  // Juega el día de verdad hasta `minutos` y, si se pide, hasta que salga a
  // fumar; deja la mosca con el cigarro en la trompita.
  const jugar = (wip, minutos, fumando) =>
    p.evaluate(
      ({ wip, minutos, fumando }) => {
        const m = window.__mosca;
        m.congelar(false);
        m.diaExhibicion(wip);
        m.adelantar(minutos);
        m.congelar(true);
        m.avanzar(0); // avisa a la escena el estado nuevo (pila, post-its, estrés)
        m.avanzar(20); // y les da tiempo de llegar a su lugar (cambian suave)
        if (fumando) {
          for (let i = 0; i < 200 && !m.estado().fumando; i++) m.adelantar(1);
          m.avanzar(2.3); // el cigarro llega a la trompita
        }
      },
      { wip, minutos, fumando },
    );

  await jugar(9, 240, true);
  await foto('portada');
  await jugar(2, 270, false);
  await foto('control-wip2');
  await jugar(9, 300, true);
  await foto('control-wip9');
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(1500);
  await jugar(6, 200, true);
  await foto('exhibicion');
  for (const w of [9, 5, 2]) {
    await p.evaluate((w) => { window.__mosca.congelar(false); window.__mosca.diaExhibicion(w); window.__mosca.completarDia(); }, w);
    await p.waitForTimeout(400);
  }
  await p.evaluate(() => window.__mosca.avanzar(3));
  await foto('exhibicion-fin');
  const dias = await p.evaluate(() => JSON.parse(localStorage.getItem('mosca-del-wip-dias')));
  writeFileSync(join(CARPETA, 'img', 'dias-de-la-foto.json'), JSON.stringify(dias, null, 2));
  console.log('días de la foto final:', JSON.stringify(dias));
  await p.close();
}

const p = await b.newPage();
await p.goto(pathToFileURL(join(CARPETA, 'contexto.html')).href, { waitUntil: 'networkidle' });
await p.pdf({
  path: SALIDA,
  format: 'A4',
  printBackground: true,
  margin: { top: '16mm', bottom: '18mm', left: '17mm', right: '17mm' },
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate:
    '<div style="width:100%;margin:0 17mm;display:flex;justify-content:space-between;font:7px Helvetica Neue,Helvetica,Arial,sans-serif;color:#6b7686"><span>Mosca del WIP · Contexto completo</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>',
});
console.log('PDF listo:', SALIDA);
await b.close();
