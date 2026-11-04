// Etapa 8.4 (2026-11-04), punto 0 de la 8.3: una comprobación por el camino
// real de la pantalla, no por simular-dias. Con Playwright, a la velocidad más
// rápida del juego (x4), juega 20 días con límite 2 apretando "Mándale una
// urgencia" a las 10:00 de cada día, como lo haría una persona (el reloj del
// juego corre de verdad; solo se lee el estado para saber la hora y leer el
// resumen). Debería dar cerca de 17 tareas normales terminadas (en la
// simulación de la 8.2, con 1 urgencia al día y límite 2, dio 17,1) y cada
// urgencia unos 30 a 40 minutos (34 en la simulación). Si se aleja mucho,
// termina con error y hay que avisar antes de seguir.
// Requiere npm run dev. Uso: node scripts/comprobar-urgencia-20-dias.mjs [días]
import { chromium } from 'playwright';

const JUEGO = process.env.JUEGO ?? 'http://localhost:5173/jugar/';
const DIAS = Number(process.argv[2] ?? 20);
const ESPERADO = { normales: 17.1, urgencia: 34, normalesTolerancia: 1.5, urgenciaRango: [30, 40] };

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1512, height: 860 }, locale: 'es-CL' });
const p = await ctx.newPage();
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto(JUEGO, { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
await p.waitForTimeout(500);

const estado = () => p.evaluate(() => window.__mosca.estado());
const minutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};
// Lo que haría una persona: el límite con la tecla 2, Empezar con el botón y la
// velocidad apretando x1 → x2 → x4
await p.keyboard.press('2');
await p.click('#btn-empezar');
for (let i = 0; i < 3 && (await p.textContent('#btn-velocidad')).trim() !== 'x4'; i++) await p.click('#btn-velocidad');
const velocidad = (await p.textContent('#btn-velocidad')).trim();
console.log(`límite ${(await estado()).wip} · velocidad ${velocidad} · ${DIAS} días, una urgencia a las 10:00 cada uno`);

const dias = [];
for (let d = 1; d <= DIAS; d++) {
  if (d > 1) {
    await p.keyboard.press('r'); // otro día (mismo límite y misma velocidad)
    await p.waitForTimeout(200);
    if (!(await p.evaluate(() => window.__mosca.empezado()))) await p.click('#btn-empezar');
  }
  // esperar las 10:00 del reloj real del juego y apretar el botón
  await p.waitForFunction((min) => {
    const e = window.__mosca.estado();
    const [h, m] = e.hora.split(':').map(Number);
    return !e.terminado && h * 60 + m >= min;
  }, 600, { timeout: 60000, polling: 40 });
  const horaBoton = (await estado()).hora;
  await p.click('#btn-urgencia');
  await p.waitForFunction(() => window.__mosca.estado().terminado, { timeout: 90000, polling: 100 });
  await p.waitForTimeout(300);
  const e = await estado();
  const cifra = (await p.textContent('#cf-hechas')).replace(/\s+/g, ' ').trim();
  const tardo = (await p.textContent('#cf-urgencias')).replace(/\s+/g, ' ').trim();
  const dia = { d, horaBoton, normales: e.hechasNormales, urgencias: e.urgencias.terminadas, llegadas: e.urgencias.llegadas, tardaron: e.urgencias.tardaron === null ? null : Math.round(e.urgencias.tardaron * 10) / 10, cifra, tardo };
  dias.push(dia);
  console.log(`día ${String(d).padStart(2)}: botón a las ${horaBoton} · ${dia.normales} normales + ${dia.urgencias} urgencia (llegó ${dia.llegadas}) · tardó ${dia.tardaron} min · pantalla: «${cifra}» «${tardo}»`);
}
await b.close();

const prom = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const normales = prom(dias.map((x) => x.normales));
const conTiempo = dias.filter((x) => x.tardaron !== null);
const urgencia = prom(conTiempo.map((x) => x.tardaron));
const sinTerminar = dias.filter((x) => x.urgencias === 0).length;
const sd = (xs) => Math.sqrt(prom(xs.map((x) => (x - prom(xs)) ** 2)) * (xs.length / (xs.length - 1)));
console.log(`\npromedio de ${DIAS} días: ${normales.toFixed(2)} normales terminadas (desvío ${sd(dias.map((x) => x.normales)).toFixed(2)}); cada urgencia tardó ${urgencia.toFixed(1)} min (desvío ${sd(conTiempo.map((x) => x.tardaron)).toFixed(1)}); ${sinTerminar} sin terminar`);
console.log(`esperado (simulación 8.2, límite 2, 1 al día): ${ESPERADO.normales} normales y ${ESPERADO.urgencia} min`);
const lejosNormales = Math.abs(normales - ESPERADO.normales) > ESPERADO.normalesTolerancia;
const lejosUrgencia = urgencia < ESPERADO.urgenciaRango[0] || urgencia > ESPERADO.urgenciaRango[1];
if (errores.length) console.log(`errores en la consola: ${errores.slice(0, 3).join(' | ')}`);
if (lejosNormales || lejosUrgencia || errores.length) {
  console.log(`\nSE ALEJA: ${lejosNormales ? `normales a más de ${ESPERADO.normalesTolerancia} de ${ESPERADO.normales}` : ''} ${lejosUrgencia ? `urgencia fuera de ${ESPERADO.urgenciaRango.join('–')} min` : ''}`);
  process.exit(1);
}
console.log('\n20 días por la pantalla: todo bien (cerca de lo que dio la simulación)');
