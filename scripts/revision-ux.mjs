// Revisión UX/UI de punta a punta: juega un día completo como un usuario
// (sin enganches de prueba), revisa textos, botones, foco con teclado,
// solapes y errores de consola. Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
const errores = [];
p.on('pageerror', (e) => errores.push('página: ' + e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) errores.push('consola: ' + m.text()); });
const problemas = [];
const revisar = (ok, texto) => { if (!ok) problemas.push(texto); };

await p.goto('http://localhost:5173/jugar/', { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(2500);

// 0. Antes de empezar (desde el 2026-10-25): el reloj espera a Empezar; la
// tarjeta va entre los dos paneles sin taparlos; elegir el WIP no lo hace
// correr; Empezar lo hace correr y saca la tarjeta
const inicio0 = await p.evaluate(() => {
  const r = (id) => document.getElementById(id).getBoundingClientRect();
  const cruza = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
  const t = r('aviso-empezar');
  return {
    hora: document.getElementById('reloj-texto').textContent,
    boton: document.getElementById('btn-pausa').textContent,
    visible: !document.getElementById('aviso-empezar').hidden && t.width > 0,
    tapaPanel: cruza(t, r('cerebro')) || cruza(t, r('panel')),
  };
});
revisar(inicio0.hora === '09:00' && inicio0.boton === 'Empezar' && inicio0.visible, `al entrar debe esperar a Empezar: ${JSON.stringify(inicio0)}`);
revisar(!inicio0.tapaPanel, 'la tarjeta de Empezar tapa un panel');
await p.$eval('#wip', (el) => { el.value = '4'; el.dispatchEvent(new Event('input')); });
await p.waitForTimeout(1500);
revisar((await p.textContent('#reloj-texto')) === '09:00', 'elegir el WIP antes de empezar hizo correr el reloj');
await p.screenshot({ path: 'capturas/ux-empezar.png' });
await p.click('#btn-empezar');
await p.waitForTimeout(1500);
revisar((await p.textContent('#reloj-texto')) !== '09:00' && (await p.isHidden('#aviso-empezar')), 'Empezar no hizo correr el reloj o no sacó la tarjeta');
revisar((await p.textContent('#btn-pausa')) === 'Pausa', 'tras Empezar el botón debe decir Pausa');

// 1. Botones con nombre accesible
const sinNombre = await p.$$eval('button', (bs) => bs.filter((x) => x.offsetParent && !(x.textContent.trim() || x.getAttribute('aria-label') || x.title)).map((x) => x.id || x.className));
revisar(!sinNombre.length, `botones sin nombre: ${sinNombre}`);

// 2. Foco con teclado: cada control alcanzable muestra un anillo de foco
const sinAnillo = [];
for (let i = 0; i < 12; i++) {
  await p.keyboard.press('Tab');
  const info = await p.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const anillo = cs.boxShadow !== 'none' || (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0);
    return { id: el.id || el.className || el.tagName, anillo };
  });
  if (info && !info.anillo && !/wip/.test(info.id)) sinAnillo.push(info.id);
}
revisar(!sinAnillo.length, `sin anillo de foco: ${[...new Set(sinAnillo)]}`);
await p.mouse.click(700, 820);

// 3. Un día completo con WIP 5 a velocidad x4
await p.$eval('#wip', (el) => { el.value = '5'; el.dispatchEvent(new Event('input')); });
await p.click('#btn-reiniciar'); // parte el día desde las 09:00 con WIP 5
await p.click('#btn-velocidad');
await p.click('#btn-velocidad');
revisar((await p.textContent('#btn-velocidad')) === 'x4', 'velocidad no llegó a x4');
const inicio = Date.now();
while (Date.now() - inicio < 30000) {
  if (await p.isVisible('#banner-fin-dia')) break;
  await p.waitForTimeout(500);
}
revisar(await p.isVisible('#banner-fin-dia'), 'el aviso de fin del día no apareció');
await p.waitForTimeout(1500);
const fin = await p.evaluate(() => ({
  hora: document.getElementById('reloj-texto').textContent,
  estado: document.getElementById('ex-mosca').dataset.hace,
  filas: document.querySelectorAll('#tabla-dias-body tr:not(.vacia)').length,
  grafico: document.getElementById('lienzo-dia').getAttribute('aria-label'),
}));
revisar(fin.hora === '18:00', `hora al final: ${fin.hora}`);
revisar(fin.estado === 'Descansa', `la mosca al final: ${fin.estado}`);
revisar(fin.filas === 1, `filas en días jugados: ${fin.filas}`);
revisar(/^Estrés de la mosca durante el día, ahora/.test(fin.grafico), `resumen del gráfico: ${fin.grafico}`);
await p.screenshot({ path: 'capturas/ux-fin-del-dia.png' });

// 4. Solapes: el aviso de fin no debe quedar bajo los paneles
const solapes = await p.evaluate(() => {
  const r = (id) => document.getElementById(id).getBoundingClientRect();
  const cruza = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
  const ban = r('banner-fin-dia');
  return { conCerebro: cruza(ban, r('cerebro')), conControles: cruza(ban, r('panel')) };
});
revisar(!solapes.conCerebro && !solapes.conControles, `aviso de fin tapado por un panel: ${JSON.stringify(solapes)}`);

// 5. Otro día con WIP 2 (Espacio y R desde el teclado)
await p.$eval('#wip', (el) => { el.value = '2'; el.dispatchEvent(new Event('input')); });
await p.keyboard.press('r');
await p.waitForTimeout(300);
revisar(!(await p.isVisible('#banner-fin-dia')), 'el aviso de fin sigue visible tras reiniciar');
revisar(/^09:[0-2]/.test(await p.textContent('#reloj-texto')), 'R no reinició el día');
await p.keyboard.press('Space');
const h1 = await p.textContent('#reloj-texto');
await p.waitForTimeout(1200);
revisar(h1 === (await p.textContent('#reloj-texto')), 'Espacio no pausó');
revisar((await p.evaluate(() => document.getElementById('ex-mosca').dataset.hace)) === 'En pausa', 'la mosca no queda "En pausa"');
await p.keyboard.press('Space');
const inicio2 = Date.now();
while (Date.now() - inicio2 < 30000) {
  if (await p.isVisible('#banner-fin-dia')) break;
  await p.waitForTimeout(500);
}
await p.waitForTimeout(800);
const tabla = await p.$$eval('#tabla-dias-body tr', (t) => t.map((r) => ({ texto: r.textContent.replace(/\s+/g, ' ').trim(), mejor: r.classList.contains('mejor-dia') })));
revisar(tabla.length === 2, `días en la tabla: ${tabla.length}`);
const celdas = await p.$$eval('#tabla-dias-body tr', (t) => t.map((r) => ({ wip: r.cells[0].textContent, mejor: r.classList.contains('mejor-dia') })));
revisar(celdas.some((t) => t.mejor && t.wip === '2'), `el mejor día no es el de WIP 2: ${JSON.stringify(celdas)}`);
revisar(celdas[0]?.wip === '5', `el primer día debería decir WIP 5: ${JSON.stringify(celdas)}`);
await p.screenshot({ path: 'capturas/ux-dos-dias.png' });

// 6. Textos que se salen de su caja
const cortados = await p.evaluate(() => {
  const malos = [];
  document.querySelectorAll('#panel *, #cerebro *').forEach((el) => {
    if (!el.offsetParent || el.children.length || el.classList.contains('solo-lector')) return;
    const cs = getComputedStyle(el);
    if (cs.textOverflow === 'ellipsis') return;
    if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible') malos.push(el.id || el.className || el.textContent.slice(0, 20));
  });
  return malos;
});
revisar(!cortados.length, `textos cortados: ${cortados}`);

console.log('resultado del día con WIP 5 y WIP 2:', JSON.stringify(tabla));
console.log(problemas.length ? 'PROBLEMAS:\n- ' + problemas.join('\n- ') : 'revisión UX: sin problemas');
console.log('errores:', errores.length ? errores : 'ninguno');
await b.close();
