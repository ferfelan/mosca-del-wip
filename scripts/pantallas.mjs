// Capturas de ambas vistas en varias pantallas (tele 1920x1080, la ventana de
// Felipe 1906x830, Mac 1512x860, proyector 1280x720, ventana 1024x700) y
// revisa que nada se salga de su lugar ni quede cortado: con WIP 9, con café
// y al terminar el día (en Control, también con los controles ocultos, cuando
// el resumen suma los números). También que el panel de controles no necesite
// barra de desplazamiento, que el cerebro tenga espacio para verse y que las
// zonas ("De dónde viene la actividad") quepan enteras y sumen 100 %.
// Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
let total = 0;
for (const [w, h] of [[1920, 1080], [1906, 830], [1512, 860], [1280, 720], [1024, 700]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', (e) => console.log('ERROR', e.message));
  await p.goto('http://localhost:5173/jugar/', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate(() => window.__mosca.empezar()); // el juego parte detenido hasta apretar Empezar
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
    // Zonas: cada una entera dentro de su caja, sin montarse ni cortarse, y
    // los porcentajes suman 100
    const zonas = document.querySelector('.cerebro-zonas');
    if (getComputedStyle(zonas).display === 'none') fuera.push(`${vista}: no se ven las zonas`);
    else {
      const z = zonas.getBoundingClientRect();
      const filas = [...zonas.querySelectorAll('.grupo')];
      if (filas.length !== 5) fuera.push(`${vista}: hay ${filas.length} zonas (deberían ser 5)`);
      filas.forEach((li, i) => {
        const r = li.getBoundingClientRect();
        const nombre = li.querySelector('.grupo-nombre');
        const n = nombre.getBoundingClientRect();
        if (r.right > z.right + 1 || r.bottom > z.bottom + 1 || r.left < z.left - 1) fuera.push(`${vista}: la zona "${nombre.textContent}" se sale de su caja`);
        if (nombre.scrollWidth > nombre.clientWidth + 1 || n.right > r.right + 1) fuera.push(`${vista}: el nombre "${nombre.textContent}" no cabe`);
        const otra = filas[i + 1]?.getBoundingClientRect();
        if (otra && Math.abs(otra.top - r.top) < 2 && otra.left < r.right) fuera.push(`${vista}: las zonas "${nombre.textContent}" y la siguiente se montan`);
      });
      const valores = filas.map((li) => li.querySelector('.grupo-valor').textContent);
      const suma = valores.reduce((a, v) => a + (parseInt(v, 10) || 0), 0);
      if (!valores.every((v) => v === '–') && suma !== 100) fuera.push(`${vista}: las zonas suman ${suma}%`);
    }
    // El cerebro necesita espacio para verse (al terminar el día está apagado
    // y puede achicarse un poco para que quepa el resumen)
    const lienzo = document.getElementById('lienzo-cerebro').getBoundingClientRect();
    const minimo = vista.includes('fin del día') ? 120 : 170;
    if (lienzo.height < minimo) fuera.push(`${vista}: el cerebro queda muy bajo (${Math.round(lienzo.height)} px)`);
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
  const sinNumeros = await p.evaluate(() => [...document.querySelectorAll('.cifra')].filter((c) => getComputedStyle(c).display !== 'none').length);
  if (sinNumeros) problemas.push(`control fin del día: el resumen repite ${sinNumeros} números del panel derecho`);
  await p.screenshot({ path: `capturas/pantalla-${w}-control-fin.png` });
  // Con los controles ocultos (tecla C), el resumen suma los números
  await p.keyboard.press('c');
  await p.waitForTimeout(1200);
  const conNumeros = await p.evaluate(() => [...document.querySelectorAll('.cifra')].filter((c) => getComputedStyle(c).display !== 'none').length);
  if (conNumeros !== 5) problemas.push(`control fin del día sin controles: se ven ${conNumeros} números (deberían ser 5)`);
  problemas.push(...(await revisar('control fin del día sin controles')));
  await p.screenshot({ path: `capturas/pantalla-${w}-control-fin-sin-controles.png` });
  total += problemas.length;
  console.log(`${w}x${h}: ${problemas.length ? 'se sale: ' + problemas.join(', ') : 'todo dentro'}`);
  await p.close();
}
await b.close();
console.log(total ? `\n${total} problema(s)` : '\npantallas: todo dentro');
