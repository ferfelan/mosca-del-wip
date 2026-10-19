// Capturas de ambas vistas en varias pantallas (tele 1920x1080, la ventana de
// Felipe 1906x830, Mac 1512x860, proyector 1280x720, ventana 1024x700) y
// revisa que nada se salga de su lugar ni quede cortado: con WIP 9, con café
// y al terminar el día. También que el panel de controles no necesite
// barra de desplazamiento y que el cerebro tenga espacio para verse.
// Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
let total = 0;
for (const [w, h] of [[1920, 1080], [1906, 830], [1512, 860], [1280, 720], [1024, 700]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', (e) => console.log('ERROR', e.message));
  await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate(() => { window.__mosca.diaExhibicion(9); window.__mosca.adelantar(240); });
  await p.waitForTimeout(2000);
  // ¿algún texto del panel del cerebro queda cortado o se sale? (en las dos vistas)
  const revisar = (vista) => p.evaluate((vista) => {
    const panel = document.getElementById('cerebro');
    const caja = panel.getBoundingClientRect();
    const fuera = [];
    if (caja.bottom > window.innerHeight - 2) fuera.push(`${vista}: el panel del cerebro es más alto que la pantalla`);
    panel.querySelectorAll('*').forEach((el) => {
      if (el.closest('svg')) return;
      // sólo los que tienen texto propio (no las cajas que ocupan todo el ancho)
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      const r = el.getBoundingClientRect();
      const estilo = getComputedStyle(el);
      if (!r.width || !r.height || estilo.display === 'none' || estilo.visibility === 'hidden') return;
      if (r.bottom > caja.bottom - 2 || r.right > caja.right - 2 || r.left < caja.left + 1) fuera.push(`${vista}: ${el.className || el.tagName} ("${el.textContent.trim().slice(0, 30)}")`);
      // texto cortado con "…" dentro de su caja
      if (el.scrollWidth > el.clientWidth + 1 && estilo.overflow === 'hidden') fuera.push(`${vista}: texto cortado en ${el.className || el.tagName} ("${el.textContent.trim()}")`);
    });
    // Los números de la oficina (Exhibición): cada uno entero dentro de su columna
    const cifras = document.querySelector('.cifras');
    if (getComputedStyle(cifras).display !== 'none') {
      const c = cifras.getBoundingClientRect();
      cifras.querySelectorAll('.cifra').forEach((el) => {
        if (getComputedStyle(el).display === 'none') return;
        const r = el.getBoundingClientRect();
        if (r.bottom > c.bottom + 1 || r.right > c.right + 1) fuera.push(`${vista}: no cabe "${el.querySelector('.cifra-label').textContent}"`);
        const v = el.querySelector('.cifra-valor').getBoundingClientRect();
        if (v.right > r.right - 4) fuera.push(`${vista}: el número de "${el.querySelector('.cifra-label').textContent}" se sale de su caja`);
      });
    }
    // El cerebro necesita espacio para verse
    const lienzo = document.getElementById('lienzo-cerebro').getBoundingClientRect();
    if (lienzo.height < 170) fuera.push(`${vista}: el cerebro queda muy bajo (${Math.round(lienzo.height)} px)`);
    if (vista.startsWith('control')) {
      const panel = document.getElementById('panel');
      if (panel.scrollHeight > panel.clientHeight + 1) fuera.push(`${vista}: el panel de controles necesita barra (${panel.scrollHeight} > ${panel.clientHeight})`);
    } else {
      const escena = document.getElementById('escena').getBoundingClientRect();
      const rotulo = document.querySelector('.rotulo-escena').getBoundingClientRect();
      if (rotulo.right > escena.right - 8) fuera.push(`${vista}: rótulo de la escena`);
    }
    return [...new Set(fuera)];
  }, vista);
  const problemas = await revisar('control');
  // También con café
  await p.evaluate(() => { window.__mosca.forzar({ cafe: true }); });
  await p.waitForTimeout(1200);
  problemas.push(...(await revisar('control con café')));
  await p.evaluate(() => { window.__mosca.forzar({ cafe: false }); });
  await p.screenshot({ path: `capturas/pantalla-${w}-control.png` });
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `capturas/pantalla-${w}-exhibicion.png` });
  problemas.push(...(await revisar('exhibición')));
  await p.evaluate(() => { window.__mosca.forzar({ cafe: true }); });
  await p.waitForTimeout(1200);
  problemas.push(...(await revisar('exhibición con café')));
  await p.evaluate(() => { window.__mosca.forzar({ cafe: false }); window.__mosca.completarDia(); });
  await p.waitForTimeout(1500);
  problemas.push(...(await revisar('exhibición fin del día')));
  await p.screenshot({ path: `capturas/pantalla-${w}-exhibicion-fin.png` });
  await p.evaluate(() => window.__mosca.vista('control'));
  await p.waitForTimeout(1500);
  problemas.push(...(await revisar('control fin del día')));
  await p.screenshot({ path: `capturas/pantalla-${w}-control-fin.png` });
  total += problemas.length;
  console.log(`${w}x${h}: ${problemas.length ? 'se sale: ' + problemas.join(', ') : 'todo dentro'}`);
  await p.close();
}
await b.close();
console.log(total ? `\n${total} problema(s)` : '\npantallas: todo dentro');
