// Prueba que Control y Exhibición muestren SIEMPRE la misma partida: misma
// hora, pausa, WIP, fin del día e historial; teclas Espacio/R/1–9/D/E/Esc; y
// el modo demo. Requiere npm run dev.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) errores.push(m.text()); });
const fallas = [];
const revisar = (ok, texto) => { if (!ok) fallas.push(texto); console.log(`${ok ? 'ok   ' : 'FALLA'} ${texto}`); };
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
const leer = () => p.evaluate(() => ({
  vista: document.body.classList.contains('exhibicion') ? 'exhibición' : 'control',
  hora: window.__mosca.estado().hora,
  wip: window.__mosca.estado().wip,
  slider: document.getElementById('wip').value,
  cerebro: document.getElementById('c-estado').textContent,
  rotuloEstado: document.querySelector('.rotulo-escena').dataset.estado,
  rotuloWip: document.getElementById('ex-wip').textContent,
  aviso: document.getElementById('ex-inicio').textContent.replace(/\s+/g, ' ').trim(),
  finVisible: !document.getElementById('ex-fin').classList.contains('oculto'),
  bannerVisible: !document.getElementById('banner-fin-dia').classList.contains('oculto'),
  dias: document.querySelectorAll('#tabla-dias-body tr:not(.vacia)').length,
  sinColilla: window.__mosca.cigarrosSinColilla(),
}));
const esperar = (ms) => p.waitForTimeout(ms);

// 1. Pausa en control → la exhibición también está en pausa, misma hora
await p.keyboard.press('7');
await esperar(2500);
await p.keyboard.press('Space');
await esperar(4500); // la mosca termina lo que hacía y descansa
let c = await leer();
await p.keyboard.press('e');
await esperar(1000);
let x = await leer();
revisar(x.vista === 'exhibición', 'E abre la exhibición');
revisar(x.hora === c.hora, `misma hora en ambas vistas (${c.hora} / ${x.hora})`);
revisar(x.cerebro === 'En pausa' && x.rotuloEstado === 'pausa', `exhibición en pausa (cerebro: ${x.cerebro}, rótulo: ${x.rotuloEstado})`);
revisar(x.wip === 7 && x.rotuloWip === 'WIP 7', `mismo WIP 7 (${x.rotuloWip})`);
revisar(x.sinColilla === 0, `en pausa la mosca no sigue fumando (${x.sinColilla})`);
await esperar(1500);
revisar((await leer()).hora === c.hora, 'la hora no avanza en pausa');
await p.screenshot({ path: 'capturas/sincro-pausa-exhibicion.png' });

// 2. Reanudo en exhibición → avanza; vuelvo a control → la misma partida
await p.keyboard.press('Space');
await esperar(2000);
x = await leer();
revisar(x.hora !== c.hora && x.cerebro !== 'En pausa' && x.rotuloEstado === 'vivo', `reanuda en exhibición (${x.hora}, ${x.cerebro})`);
await p.keyboard.press('3');
await esperar(300);
x = await leer();
revisar(x.wip === 3 && x.aviso.includes('WIP 3'), `tecla 3 cambia el WIP en exhibición (${x.aviso})`);
await p.keyboard.press('Escape');
await esperar(1000);
c = await leer();
revisar(c.vista === 'control' && c.slider === '3', `vuelve a control con el slider en 3 (${c.slider})`);
revisar(c.hora >= x.hora, `la partida sigue, no se reinicia (${x.hora} → ${c.hora})`);
revisar(!c.cerebro.includes('pausa'), 'control no está en pausa');

// 3. Fin del día en control → la exhibición también lo muestra
await p.evaluate(() => window.__mosca.completarDia());
await esperar(1200);
c = await leer();
revisar(c.bannerVisible && c.cerebro === 'Descansa' && c.dias === 1, `fin del día en control (aviso, cerebro ${c.cerebro}, días ${c.dias})`);
await p.keyboard.press('e');
await esperar(1000);
x = await leer();
revisar(x.finVisible && x.rotuloEstado === 'terminado' && x.cerebro === 'Descansa', `fin del día en exhibición (resumen, rótulo ${x.rotuloEstado}, cerebro ${x.cerebro})`);
await p.screenshot({ path: 'capturas/sincro-fin-exhibicion.png' });

// 4. R en exhibición → día nuevo en ambas vistas
await p.keyboard.press('9');
await p.keyboard.press('r');
await esperar(1200);
x = await leer();
revisar(!x.finVisible && x.rotuloEstado === 'vivo' && x.wip === 9 && /^09:/.test(x.hora), `R empieza otro día con WIP 9 (${x.hora})`);
await p.keyboard.press('Escape');
await esperar(900);
c = await leer();
revisar(!c.bannerVisible && c.slider === '9' && c.dias === 1, `control ve el mismo día nuevo (slider ${c.slider}, días ${c.dias})`);

// 5. Modo demo: alterna solo y lo ven ambas vistas
await p.keyboard.press('e');
await esperar(900);
await p.keyboard.press('d');
await esperar(300);
revisar((await leer()).aviso.startsWith('Modo demo'), 'D activa el modo demo');
await p.evaluate(() => window.__mosca.completarDia());
await esperar(1000);
x = await leer();
revisar(x.finVisible && x.dias === 2, `el día de la demo se guarda en Días jugados (${x.dias})`);
await esperar(7500);
x = await leer();
revisar(x.wip === 2 && !x.finVisible && /^09:/.test(x.hora), `la demo sigue sola con WIP 2 (${x.wip}, ${x.hora})`);
await p.keyboard.press('Escape');
await esperar(900);
c = await leer();
revisar(c.slider === '2' && !c.aviso.startsWith('Modo demo'), 'al volver a control la demo se apaga y el slider muestra WIP 2');

console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\nsincronía: todo bien');
console.log('errores:', errores.length ? errores : 'ninguno');
await b.close();
