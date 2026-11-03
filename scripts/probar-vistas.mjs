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
await p.goto('http://localhost:5173/jugar/', { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
const leer = () => p.evaluate(() => ({
  vista: document.body.classList.contains('exhibicion') ? 'exhibición' : 'control',
  hora: window.__mosca.estado().hora,
  wip: window.__mosca.estado().wip,
  slider: document.getElementById('wip').value,
  cerebro: document.getElementById('ex-mosca').dataset.hace, // qué hace la mosca (Trabaja, En pausa, Descansa…)
  rotuloEstado: document.querySelector('.rotulo-escena').dataset.estado,
  carga: document.getElementById('cf-carga').textContent,
  enCurso: window.__mosca.estado().enCurso,
  pausado: window.__mosca.pausado(),
  aviso: document.getElementById('ex-inicio').textContent.replace(/\s+/g, ' ').trim(),
  finVisible: !document.getElementById('ex-fin').classList.contains('oculto'),
  bannerVisible: !document.getElementById('banner-fin-dia').classList.contains('oculto'),
  dias: document.querySelectorAll('#tabla-dias-body tr:not(.vacia)').length,
  sinColilla: window.__mosca.cigarrosSinColilla(),
}));
const esperar = (ms) => p.waitForTimeout(ms);

// 0. Antes de empezar (desde el 2026-10-25): en las dos vistas el reloj espera
// a Empezar y se ve la tarjeta; elegir el WIP no lo hace correr; Espacio empieza
await esperar(1500);
let c0 = await leer();
const tarjeta = () => p.evaluate(() => {
  const t = document.getElementById('aviso-empezar');
  const r = t.getBoundingClientRect();
  return { visible: !t.hidden && r.width > 0, dentro: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, derecha: r.right };
});
let t0 = await tarjeta();
revisar(c0.hora === '09:00' && c0.pausado && c0.cerebro === 'Lista' && c0.aviso.startsWith('Por empezar') && t0.visible && t0.dentro, `control: espera a Empezar (${c0.hora}, ${c0.cerebro}, «${c0.aviso}»)`);
await p.keyboard.press('e');
await esperar(1000);
let x0 = await leer();
t0 = await tarjeta();
// (desde la 8.1 la tarjeta de inicio no va en Exhibición: ahí explica quien facilita; el reloj igual espera)
revisar(x0.vista === 'exhibición' && x0.hora === '09:00' && !t0.visible && x0.aviso.startsWith('Por empezar'), `exhibición: espera a Empezar sin la tarjeta (${x0.hora}, «${x0.aviso}»)`);
await p.keyboard.press('Escape');
await esperar(800);
await p.keyboard.press('7');
await esperar(1500);
revisar((await leer()).hora === '09:00', 'elegir el WIP antes de empezar no hace correr el reloj');
await p.keyboard.press('Space');
await esperar(1500);
c0 = await leer();
t0 = await tarjeta();
revisar(!c0.pausado && c0.hora !== '09:00' && !t0.visible && c0.wip === 7, `Espacio empieza el día con WIP 7 (${c0.hora})`);

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
revisar(x.wip === 7 && x.carga === '7', `mismo WIP 7 (carga ${x.carga} a la vez)`);
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
revisar(x.wip === 3 && x.aviso.includes('nuevo límite 3'), `tecla 3 cambia el WIP en exhibición (${x.aviso})`);
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

// 6. Elegir el WIP antes de las 09:15 rearma el día con ese WIP (con sus
//    tareas de ayer) y respeta la pausa; después de las 09:15 es un cambio a
//    mitad del día (lo empezado sigue abierto)
await p.keyboard.press('r');
await p.keyboard.press('Space');
await esperar(200);
await p.keyboard.press('0');
await esperar(300);
c = await leer();
revisar(c.wip === 10 && c.enCurso === 10 && c.hora === '09:00' && c.pausado, `antes de las 09:15, el WIP 10 rearma el día (hora ${c.hora}, ${c.enCurso} en curso, en pausa: ${c.pausado})`);
await p.keyboard.press('Space');
await p.evaluate(() => window.__mosca.adelantar(30));
await p.keyboard.press('2');
await esperar(300);
c = await leer();
revisar(c.wip === 2 && c.enCurso > 2 && c.hora >= '09:30', `después de las 09:15 no se rearma: lo empezado sigue abierto (hora ${c.hora}, ${c.enCurso} en curso)`);

console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\nsincronía: todo bien');
console.log('errores:', errores.length ? errores : 'ninguno');
await b.close();
