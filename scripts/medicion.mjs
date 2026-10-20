// Medición de la Etapa 4 (sin cambiar reglas): juega días del juego y sólo
// OBSERVA cada paso, envolviendo DayBrain.prototype.tick: mira el estado
// antes y después, sin cambiar números ni llamar al azar. Sirve con el juego
// de verdad (src/brain.js) y con sus copias temporales de la 4.2.
// Lo usan scripts/medir-paradoja.mjs (4.1) y scripts/robustez.mjs (4.2).
// Definiciones: docs/etapa4-1-reglas.md.

export const SEMILLA = 2024; // la misma fórmula y semilla de scripts/opciones-3-3.mjs
export const PASO = 0.15; // igual que simular-dias
const FIN_DIA = 18 * 60;

let s = 0;
export const sembrar = (semilla) => { s = semilla >>> 0; };
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
const envueltas = new WeakSet();
function envolver(DayBrain) {
  if (envueltas.has(DayBrain)) return;
  envueltas.add(DayBrain);
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
}

// Juega `dias` días con ese WIP (semilla reiniciada) y devuelve las sumas.
// Con mirar = false juega igual pero sin observar (para el control).
export function jugarWip(DayBrain, wip, { dias = 200, paso = PASO, semilla = SEMILLA, mirar = true } = {}) {
  envolver(DayBrain);
  observar = mirar;
  sembrar(semilla);
  const t = {
    minutos: 0, conQueHacer: 0, trabajando: 0, fumando: 0, cafe: 0, esperando: 0, otro: 0, descalces: 0,
    tareas: 0, sumaTurnos: 0, sumaEnCurso: 0, sumaTamano: 0, promFlujo: 0, promTamano: 0,
    hechas: 0, sumaTiempoJuego: 0, medidasJuego: 0, rinden: 0, colillas: 0, cafes: 0, estres: 0,
  };
  for (let d = 0; d < dias; d++) {
    obs = null;
    const dia = new DayBrain(wip); // los días previos: se siguen los turnos, no se suman
    obs = mirar ? t : null;
    while (!dia.terminado) dia.tick(paso);
    obs = null;
    const m = dia.medidas();
    t.hechas += m.hechas;
    t.sumaTiempoJuego += m.sumaTiempoPorTarea;
    t.medidasJuego += m.tareasMedidas;
    t.rinden += m.minutosRinden;
    t.colillas += m.colillas;
    t.cafes += m.cafes;
    t.estres += m.estresPromedio;
  }
  observar = false;
  return t;
}

// Avisos de los controles de la observación (vacío = todo bien)
export function revisar(t, wip, sinMirar = null) {
  const avisos = [];
  if (sinMirar !== null && t.hechas !== sinMirar) avisos.push(`WIP ${wip}: la observación cambió las terminadas (${sinMirar} → ${t.hechas})`);
  if (t.descalces) avisos.push(`WIP ${wip}: "con qué hacer" no calza con "espera" del juego en ${t.descalces} pasos`);
  if (t.otro > 1e-6) avisos.push(`WIP ${wip}: ${t.otro.toFixed(2)} min sin clasificar`);
  if (t.tareas !== t.medidasJuego || Math.abs(t.sumaEnCurso - t.sumaTiempoJuego) > 1e-6 * t.sumaTiempoJuego) avisos.push(`WIP ${wip}: el tiempo en curso no calza con el del juego`);
  return avisos;
}
