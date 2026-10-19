// Capturas del panel del cerebro (Etapa 3.3): WIP 2 y WIP 9 a media jornada
// (13:30) en Control y en Exhibición, y un momento de café. Guarda la pantalla
// completa y el panel recortado, e imprime lo que dicen los contadores.
// Requiere npm run dev.
// Uso: ETIQUETA=antes node scripts/capturas-cerebro.mjs   (o ETIQUETA=despues)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const ETIQUETA = process.env.ETIQUETA ?? 'despues';
const DIR = `capturas/etapa3-3/${ETIQUETA}`;
mkdirSync(DIR, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
p.on('pageerror', (e) => console.log('ERROR', e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) console.log('CONSOLA', m.text()); });
const abrir = async () => {
  await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
};
await abrir();
await p.evaluate(() => ['mosca-del-wip-dias', 'mosca-del-wip-cerebro-oculto', 'mosca-del-wip-controles-oculto'].forEach((k) => localStorage.removeItem(k)));
await abrir();

const leer = () => p.evaluate(() => {
  const t = (id) => document.getElementById(id)?.textContent.trim();
  const zonas = [...document.querySelectorAll('#cerebro-grupos .grupo')].map((li) => `${li.querySelector('.grupo-nombre').textContent.trim()} ${li.querySelector('.grupo-valor').textContent.trim()}`);
  return `activas ${t('c-activas')} · actividad ${t('c-nivel')} · estado ${t('c-estado')} · zonas [${zonas.join(' · ')}]\n     lectura: "${t('cerebro-lectura')}"`;
});
const panel = (nombre) => p.locator('#cerebro').screenshot({ path: `${DIR}/${nombre}-panel.png` });

for (const w of [2, 9]) {
  await p.evaluate(() => window.__mosca.vista('control'));
  await p.waitForTimeout(800);
  await p.evaluate((w) => { window.__mosca.diaExhibicion(w); window.__mosca.adelantar(270); }, w);
  await p.evaluate(() => window.__mosca.avanzar(4));
  await p.waitForTimeout(2500);
  console.log(`WIP ${w} · control 13:30 → ${await leer()}`);
  await p.screenshot({ path: `${DIR}/wip${w}-control.png` });
  await panel(`wip${w}-control`);
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(2500);
  console.log(`WIP ${w} · exhibición   → ${await leer()}`);
  await p.screenshot({ path: `${DIR}/wip${w}-exhibicion.png` });
  await panel(`wip${w}-exhibicion`);
}

// Café (pausa sana, sólo con poco estrés): WIP 2 y un café forzado
await p.evaluate(() => window.__mosca.vista('control'));
await p.waitForTimeout(800);
await p.evaluate(() => { window.__mosca.diaExhibicion(2); window.__mosca.adelantar(200); window.__mosca.forzar({ cafe: true }); });
await p.evaluate(() => window.__mosca.avanzar(1.2));
await p.waitForTimeout(1500);
console.log(`WIP 2 · café            → ${await leer()}`);
await p.screenshot({ path: `${DIR}/wip2-cafe-control.png` });
await panel('wip2-cafe-control');
await p.evaluate(() => window.__mosca.vista('exhibicion'));
await p.waitForTimeout(2500);
await p.evaluate(() => window.__mosca.forzar({ cafe: true }));
await p.waitForTimeout(1500);
console.log(`WIP 2 · café exhibición → ${await leer()}`);
await p.screenshot({ path: `${DIR}/wip2-cafe-exhibicion.png` });
await panel('wip2-cafe-exhibicion');
// La tarjetita de una neurona del circuito (aBN1), en Exhibición con WIP 9
await p.evaluate(() => window.__mosca.vista('exhibicion'));
await p.waitForTimeout(800);
await p.evaluate(() => { window.__mosca.diaExhibicion(9); window.__mosca.adelantar(270); window.__mosca.avanzar(2); });
await p.waitForTimeout(2500);
await p.evaluate(() => window.__mosca.congelar(true));
await p.waitForTimeout(300);
const donde = await p.evaluate(() => window.__mosca.cerebroDonde(2));
if (donde) {
  await p.mouse.click(donde.x, donde.y);
  await p.waitForTimeout(400);
  console.log(`tarjetita: "${await p.evaluate(() => document.getElementById('cerebro-ficha').innerText.replace(/\n/g, ' | '))}"`);
  await p.screenshot({ path: `${DIR}/tarjetita-exhibicion.png` });
  await p.locator('#cerebro').screenshot({ path: `${DIR}/tarjetita-exhibicion-panel.png` });
}
await b.close();
console.log(`Capturas en ${DIR}/`);
