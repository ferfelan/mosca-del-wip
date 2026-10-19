// Capturas de ambas vistas en varias pantallas (tele 1920x1080, proyector
// 1280x720, ventana 1024x700) y revisa que nada se salga de su lugar.
// Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
for (const [w, h] of [[1920, 1080], [1512, 860], [1280, 720], [1024, 700]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', (e) => console.log('ERROR', e.message));
  await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate(() => { localStorage.removeItem('mosca-del-wip-cerebro-oculto'); localStorage.removeItem('mosca-del-wip-controles-oculto'); });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate(() => { window.__mosca.setWip(9); window.__mosca.forzar({ estres: 90, colillas: 5 }); });
  await p.waitForTimeout(2000);
  // ¿algún texto del panel del cerebro queda cortado o se sale? (en las dos vistas)
  const revisar = (vista) => p.evaluate((vista) => {
    const panel = document.getElementById('cerebro');
    const caja = panel.getBoundingClientRect();
    const fuera = [];
    if (caja.bottom > window.innerHeight - 2) fuera.push(`${vista}: el panel es más alto que la pantalla`);
    panel.querySelectorAll('*').forEach((el) => {
      if (el.closest('.cerebro-etiquetas') || el.closest('svg')) return;
      // sólo los que tienen texto propio (no las cajas que ocupan todo el ancho)
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      const r = el.getBoundingClientRect();
      const estilo = getComputedStyle(el);
      if (!r.width || !r.height || estilo.display === 'none' || estilo.visibility === 'hidden') return;
      if (r.bottom > caja.bottom - 2 || r.right > caja.right - 2 || r.left < caja.left + 1) fuera.push(`${vista}: ${el.className || el.tagName}`);
    });
    if (vista === 'exhibición') {
      const escena = document.getElementById('escena').getBoundingClientRect();
      const rotulo = document.querySelector('.rotulo-escena').getBoundingClientRect();
      if (rotulo.right > escena.right - 8) fuera.push('rótulo de la escena');
    }
    return [...new Set(fuera)];
  }, vista);
  const problemas = await revisar('control');
  await p.screenshot({ path: `capturas/pantalla-${w}-control.png` });
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `capturas/pantalla-${w}-exhibicion.png` });
  problemas.push(...(await revisar('exhibición')));
  console.log(`${w}x${h}: ${problemas.length ? 'se sale: ' + problemas.join(', ') : 'todo dentro'}`);
  await p.close();
}
await b.close();
