// Etapa 4.1 · Medir la paradoja (H1). Reglas y criterios fijados antes de
// medir en docs/etapa4-1-reglas.md (commit 8b13043); aquí no se decide nada.
//
// NO toca el juego: juega los mismos días que scripts/simular-dias.mjs (200
// por WIP, pasos de 0,15 min, con los 3 días previos de siempre) y sólo
// OBSERVA cada paso, envolviendo DayBrain.prototype.tick: mira el estado
// antes y después, sin cambiar números ni llamar al azar. Azar con semilla
// fija (la de scripts/opciones-3-3.mjs). Control: con la misma semilla, las
// terminadas salen idénticas con y sin la observación.
//
// Uso: node scripts/medir-paradoja.mjs     (guarda docs/etapa4-1-resultados.json)
import { writeFileSync } from 'node:fs';
import { DayBrain } from '../src/brain.js';

const DIAS = Number(process.env.DIAS ?? 200);
const PASO = 0.15; // igual que simular-dias
const SEMILLA = 2024;
const FIN_DIA = 18 * 60;

let s = 0;
const sembrar = (semilla) => { s = semilla >>> 0; };
Math.random = () => {
  s = (s + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------- La observación ----------
let observar = false;
let obs = null; // lo que se suma en el día principal (null en los días previos)
const tickDelJuego = DayBrain.prototype.tick;
DayBrain.prototype.tick = function (dtMin) {
  if (!observar || this.terminado || dtMin <= 0) return tickDelJuego.call(this, dtMin);
  // Tamaño de cada tarea antes de que la toque (las de "Por hacer" están enteras)
  for (const t of this.porHacer) if (t._tamano === undefined) { t._tamano = t.minutosRestantes; t._turnos = 0; }
  const dt = Math.min(dtMin, Math.max(FIN_DIA - this.minutoActual, 0));
  const fumaba = this.fumando;
  const cafe = this.tomandoCafe;
  // Las que puede avanzar en este paso, con la misma lógica del juego:
  // primero rellena "En curso" y después descuenta el tiempo a los bloqueos
  const entran = this.porHacer.slice(0, Math.max(0, this.wip - this.enCurso.length));
  const tareas = [...this.enCurso, ...entran];
  const puede = tareas.filter((t) => Math.max(0, t.minutosBloqueada - dt) <= 0).length;
  const antes = new Map(tareas.map((t) => [t, t.minutosRestantes]));

  tickDelJuego.call(this, dtMin);
  if (dt <= 0) return;

  let trabajo = false;
  for (const [t, r] of antes) {
    if (!(t.minutosRestantes < r)) continue;
    const avance = r - t.minutosRestantes;
    t._turnos += dt * Math.min(1, r / avance); // si la terminó a mitad del paso, sólo la parte usada
    trabajo = true;
    if (obs && t.minutosRestantes <= 0) {
      const enCurso = this.minutosDeDia - t.inicio; // el mismo tiempo por tarea del juego
      obs.tareas += 1;
      obs.sumaTurnos += t._turnos;
      obs.sumaEnCurso += enCurso;
      obs.sumaTamano += t._tamano;
      obs.promFlujo += t._turnos / enCurso;
      obs.promTamano += t._tamano / enCurso;
    }
  }
  if (!obs) return;
  obs.minutos += dt;
  if (puede > 0) obs.conQueHacer += dt;
  if (fumaba) obs.fumando += dt;
  else if (cafe) obs.cafe += dt;
  else if (this.esperando) obs.esperando += dt;
  else if (trabajo) obs.trabajando += dt;
  else obs.otro += dt;
  if (!fumaba && !cafe && (puede === 0) !== this.esperando) obs.descalces += 1;
};

function jugar(wip) {
  sembrar(SEMILLA);
  const t = {
    minutos: 0, conQueHacer: 0, trabajando: 0, fumando: 0, cafe: 0, esperando: 0, otro: 0, descalces: 0,
    tareas: 0, sumaTurnos: 0, sumaEnCurso: 0, sumaTamano: 0, promFlujo: 0, promTamano: 0,
    hechas: 0, sumaTiempoJuego: 0, medidasJuego: 0, rinden: 0, colillas: 0, cafes: 0,
  };
  for (let d = 0; d < DIAS; d++) {
    obs = null;
    const dia = new DayBrain(wip); // los días previos: se siguen los turnos, no se suman
    obs = t;
    while (!dia.terminado) dia.tick(PASO);
    obs = null;
    const m = dia.medidas();
    t.hechas += m.hechas;
    t.sumaTiempoJuego += m.sumaTiempoPorTarea;
    t.medidasJuego += m.tareasMedidas;
    t.rinden += m.minutosRinden;
    t.colillas += m.colillas;
    t.cafes += m.cafes;
  }
  return t;
}

// ---------- Control: la observación no cambia nada ----------
observar = false;
const sinMirar = [];
for (let wip = 1; wip <= 10; wip++) sinMirar.push(jugar(wip).hechas);

observar = true;
const filas = [];
const avisos = [];
for (let wip = 1; wip <= 10; wip++) {
  const t = jugar(wip);
  if (t.hechas !== sinMirar[wip - 1]) avisos.push(`WIP ${wip}: la observación cambió las terminadas (${sinMirar[wip - 1]} → ${t.hechas})`);
  if (t.descalces) avisos.push(`WIP ${wip}: "con qué hacer" no calza con "espera" del juego en ${t.descalces} pasos`);
  if (t.otro > 1e-6) avisos.push(`WIP ${wip}: ${t.otro.toFixed(2)} min sin clasificar`);
  if (t.tareas !== t.medidasJuego || Math.abs(t.sumaEnCurso - t.sumaTiempoJuego) > 1e-6 * t.sumaTiempoJuego) avisos.push(`WIP ${wip}: el tiempo en curso no calza con el del juego`);
  const pct = (x) => (100 * x) / t.minutos;
  filas.push({
    wip,
    con_que_hacer: pct(t.conQueHacer),
    trabajando: pct(t.trabajando),
    fumando: pct(t.fumando),
    cafe: pct(t.cafe),
    esperando_bloqueos: pct(t.esperando),
    eficiencia_flujo: (100 * t.sumaTurnos) / t.sumaEnCurso,
    esperando_su_turno: 100 - (100 * t.sumaTurnos) / t.sumaEnCurso,
    tamano_sobre_tiempo: (100 * t.sumaTamano) / t.sumaEnCurso,
    flujo_promedio_por_tarea: (100 * t.promFlujo) / t.tareas,
    tamano_promedio_por_tarea: (100 * t.promTamano) / t.tareas,
    terminadas: t.hechas / DIAS,
    tiempo_por_tarea_min: t.sumaEnCurso / t.tareas,
    minutos_rinden_por_hora: (60 * t.rinden) / t.minutos,
    colillas: t.colillas / DIAS,
    cafes: t.cafes / DIAS,
  });
}

// ---------- Criterios (docs/etapa4-1-reglas.md) ----------
const F = (w) => filas[w - 1];
const a = filas.filter((f) => f.wip >= 3).every((f) => f.con_que_hacer >= F(1).con_que_hacer + 15);
const escalones = [];
for (let w = 2; w < 10; w++) escalones.push({ de: w, a: w + 1, sube: F(w + 1).eficiencia_flujo - F(w).eficiencia_flujo });
const bBaja = escalones.every((e) => e.sube <= 1);
const bMitad = F(9).eficiencia_flujo < F(2).eficiencia_flujo / 2;
const b = bBaja && bMitad;
const c = F(9).terminadas < F(2).terminadas;
let veredicto;
if (!b) veredicto = 'No se cumple';
else if (a && c) veredicto = 'Se cumple';
else if (c) veredicto = 'A medias';
else veredicto = 'Caso no previsto en el plan (se cumple (b) pero falla (c)): decide Felipe';

// ---------- Salida ----------
const f1 = (n) => n.toFixed(1).replace('.', ',');
const pad = (x, n) => String(x).padStart(n);
console.log(`\n${DIAS} días por WIP, semilla ${SEMILLA} (% del día de oficina, salvo donde dice otra cosa)\n`);
console.log(' WIP  Con qué hacer  Trabajando  Fumando  Café  Esperando*  │ Ef. flujo  Esperando su turno  Tamaño/tiempo  │ Terminadas  Tiempo/tarea  Rinden  Colillas');
for (const f of filas) {
  console.log(
    `${pad(f.wip, 4)}  ${pad(f1(f.con_que_hacer), 13)}  ${pad(f1(f.trabajando), 10)}  ${pad(f1(f.fumando), 7)}  ${pad(f1(f.cafe), 4)}  ${pad(f1(f.esperando_bloqueos), 10)}  │ ${pad(f1(f.eficiencia_flujo), 9)}  ${pad(f1(f.esperando_su_turno), 18)}  ${pad(f1(f.tamano_sobre_tiempo), 13)}  │ ${pad(f1(f.terminadas), 10)}  ${pad(Math.round(f.tiempo_por_tarea_min) + ' min', 12)}  ${pad(Math.round(f.minutos_rinden_por_hora) + ' m/h', 6)}  ${pad(f1(f.colillas), 8)}`,
  );
}
console.log(' * Esperando: todas sus tareas en curso bloqueadas (no tiene con qué avanzar).');
console.log(' Promedio por tarea (sólo información): ' + filas.map((f) => `WIP ${f.wip} ${f1(f.flujo_promedio_por_tarea)}/${f1(f.tamano_promedio_por_tarea)}`).join(' · '));
console.log('\nCriterios:');
console.log(` (a) con qué hacer, WIP 3–10 ≥ WIP 1 + 15 (= ${f1(F(1).con_que_hacer + 15)}): ${a ? 'SÍ' : 'NO'} (el más bajo de 3–10: ${f1(Math.min(...filas.slice(2).map((f) => f.con_que_hacer)))})`);
console.log(` (b) flujo baja de 2 a 10 (±1): ${bBaja ? 'SÍ' : 'NO'} (mayor subida: ${f1(Math.max(...escalones.map((e) => e.sube)))} pts) · WIP 9 < mitad de WIP 2 (${f1(F(9).eficiencia_flujo)} < ${f1(F(2).eficiencia_flujo / 2)}): ${bMitad ? 'SÍ' : 'NO'}`);
console.log(` (c) WIP 9 termina menos que WIP 2 (${f1(F(9).terminadas)} < ${f1(F(2).terminadas)}): ${c ? 'SÍ' : 'NO'}`);
console.log(`\nVeredicto H1: ${veredicto}`);
console.log(avisos.length ? '\nAVISOS:\n - ' + avisos.join('\n - ') : '\nControles: la observación no cambió nada; "con qué hacer" calza con la espera del juego; el tiempo en curso calza con el del juego.');
if (avisos.length) process.exitCode = 1;

writeFileSync(
  new URL('../docs/etapa4-1-resultados.json', import.meta.url),
  JSON.stringify({ dias: DIAS, semilla: SEMILLA, paso: PASO, filas, criterios: { a, b: { baja: bBaja, mitad: bMitad, escalones }, c }, veredicto, avisos }, null, 1) + '\n',
);
