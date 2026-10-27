// Foto para la presentación del taller v3 (Etapa 6.0 v3, 2026-10-27): el monitor
// de la mosca lleno, con 9 tareas en curso a las 13:30, de cerca y sin paneles.
// Va en la lámina 3 ("¿Cuántas cosas tienes en curso hoy?") en vez del post-it
// que Felipe pidió sacar. Misma cámara que la foto "monitor-limite" del informe.
//   docs/contexto/img/tablero-lleno.jpg  (1520 × 1120)
// Necesita npm run dev. Uso: node scripts/taller-fotos-v3.mjs [dirección]
import { chromium } from 'playwright';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:5173';
const IMG = 'docs/contexto/img';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 2 });
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto(`${BASE}/jugar/`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
await p.evaluate(() => {
  localStorage.removeItem('mosca-del-wip-dias');
  localStorage.setItem('mosca-idioma', 'es');
  localStorage.setItem('mosca-del-wip-cerebro-oculto', '1');
  localStorage.setItem('mosca-del-wip-controles-oculto', '1');
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
await p.evaluate(() => window.__mosca.empezar());
await p.addStyleTag({ content: '#btn-mostrar-cerebro,#btn-mostrar-controles,#banner-fin-dia,#ex-inicio,#btn-vista-inicial,#idioma-flotante{display:none!important}' });
// Juega el día con 9 hasta las 13:30 y deja el reloj detenido (como "jugar" de documento.mjs)
const estado = await p.evaluate(() => {
  const m = window.__mosca;
  m.detenerReloj(false);
  m.congelar(false);
  m.diaExhibicion(9);
  const ahora = () => 540 + m.estado().fraccionDelDia * 540;
  m.adelantar(Math.max(0, 13 * 60 + 30 - ahora()));
  for (let i = 0; i < 40 && !m.estado().terminado && (m.estado().fumando || m.estado().tomandoCafe); i++) m.adelantar(1);
  m.detenerReloj(true);
  m.congelar(true);
  m.avanzar(0);
  m.avanzar(20);
  return m.estado();
});
await p.evaluate(() => window.__mosca.camara([-0.25, 1.75, 1.1], [-0.9, 1.72, -0.35]));
await p.mouse.move(8, 450);
await p.waitForTimeout(1600);
await p.screenshot({ path: join(IMG, 'tablero-lleno.jpg'), type: 'jpeg', quality: 90, clip: { x: 250, y: 80, width: 760, height: 560 } });
await b.close();
console.log(`foto tablero-lleno.jpg: wip ${estado.wip}, en curso ${estado.enCurso ?? '?'}, terminadas ${estado.terminadas ?? '?'}`);
if (errores.length) {
  console.log('errores en el juego:', errores);
  process.exit(1);
}
