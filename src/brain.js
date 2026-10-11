// "Cerebro simple" de la mosca: reglas de negocio del juego (sin 3D, sin DOM).
// Todo lo visual lee el estado que produce esta clase.

export const NIVELES_ESTRES = [
  { max: 25, nombre: 'Tranqui', color: '#4f9d6a' },
  { max: 50, nombre: 'Ocupada', color: '#c99a1e' },
  { max: 75, nombre: 'Estresada', color: '#d9732e' },
  { max: 101, nombre: 'Colapsada', color: '#cc4a43' },
];

export function nivelDeEstres(estres) {
  return NIVELES_ESTRES.find((n) => estres < n.max);
}

const MINUTOS_DIA_INICIO = 9 * 60; // 09:00
const MINUTOS_DIA_FIN = 18 * 60; // 18:00
const DURACION_TAREA_MIN = 15;
const DURACION_TAREA_MAX = 35;
const TOTAL_TAREAS_BACKLOG = 50;
const EFICIENCIA_SIN_CAMBIO = 1; // WIP=1: nunca cambia de tarea, 100% de foco
const EFICIENCIA_CON_CAMBIO = 0.7; // cada cambio de tarea pierde 30% del minuto
const ESTRES_SUBE_POR_UNIDAD = 0.6; // por minuto, por cada unidad de WIP sobre 3
const ESTRES_BAJA = 1.0; // por minuto, cuando WIP <= 3
const URGENCIA_FUMAR_FACTOR = 0.02; // cuánta "urgencia" se acumula por minuto según el estrés
const DURACION_PITADO_MIN = 8; // minutos simulados que dura cada salida a fumar
const MAX_COLILLAS_VISIBLES = 20;

function tareaAleatoria(id) {
  return {
    id,
    minutosRestantes:
      DURACION_TAREA_MIN + Math.random() * (DURACION_TAREA_MAX - DURACION_TAREA_MIN),
  };
}

export class DayBrain {
  constructor(wip) {
    this.wip = wip;
    // Si mueven el slider a mitad del día, la tabla muestra el rango usado
    this.wipMin = wip;
    this.wipMax = wip;
    this.minutoActual = MINUTOS_DIA_INICIO;
    this.porHacer = [];
    for (let i = 1; i <= TOTAL_TAREAS_BACKLOG; i++) this.porHacer.push(tareaAleatoria(i));
    this.enCurso = [];
    this.hechas = [];
    this.punteroRoundRobin = 0;
    this.tareaAnterior = null;
    this.estres = 10;
    this.estresMax = 10;
    this.urgenciaFumar = 0;
    this.colillas = 0;
    this.fumando = false;
    this.minutosFumadaRestantes = 0;
    this.terminado = false;
    this.eventoEsteTick = null; // 'trabajando' | 'empieza_a_fumar' | 'fumando' | 'vuelve_a_trabajar'
  }

  setWip(wip) {
    this.wip = wip;
    if (this.minutoActual > MINUTOS_DIA_INICIO) {
      this.wipMin = Math.min(this.wipMin, wip);
      this.wipMax = Math.max(this.wipMax, wip);
    } else {
      this.wipMin = wip;
      this.wipMax = wip;
    }
  }

  get minutosDeDia() {
    return Math.min(this.minutoActual, MINUTOS_DIA_FIN) - MINUTOS_DIA_INICIO;
  }

  get fraccionDelDia() {
    return this.minutosDeDia / (MINUTOS_DIA_FIN - MINUTOS_DIA_INICIO);
  }

  horaTexto() {
    const m = Math.min(this.minutoActual, MINUTOS_DIA_FIN);
    const h = Math.floor(m / 60);
    const min = Math.floor(m % 60);
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  _rellenarEnCurso() {
    while (this.enCurso.length < this.wip && this.porHacer.length > 0) {
      this.enCurso.push(this.porHacer.shift());
    }
    if (this.punteroRoundRobin >= this.enCurso.length) this.punteroRoundRobin = 0;
  }

  // Avanza la simulación `dtMin` minutos simulados (puede ser fraccionario).
  tick(dtMin) {
    if (this.terminado || dtMin <= 0) return;

    this.eventoEsteTick = this.fumando ? 'fumando' : 'trabajando';

    const restanteDia = MINUTOS_DIA_FIN - this.minutoActual;
    const dt = Math.min(dtMin, Math.max(restanteDia, 0));
    if (dt <= 0) {
      this.terminado = true;
      return;
    }
    this.minutoActual += dt;

    this._rellenarEnCurso();

    if (this.fumando) {
      this.minutosFumadaRestantes -= dt;
      if (this.minutosFumadaRestantes <= 0) {
        this.fumando = false;
        this.eventoEsteTick = 'vuelve_a_trabajar';
      }
    } else if (this.enCurso.length > 0) {
      const tarea = this.enCurso[this.punteroRoundRobin % this.enCurso.length];
      const hayCambio = this.tareaAnterior !== null && this.tareaAnterior !== tarea.id;
      const eficiencia = hayCambio ? EFICIENCIA_CON_CAMBIO : EFICIENCIA_SIN_CAMBIO;
      tarea.minutosRestantes -= dt * eficiencia;
      this.tareaAnterior = tarea.id;

      if (tarea.minutosRestantes <= 0) {
        const idx = this.enCurso.indexOf(tarea);
        this.enCurso.splice(idx, 1);
        this.hechas.push(tarea);
        this.tareaAnterior = null;
        this._rellenarEnCurso();
      } else {
        this.punteroRoundRobin = (this.punteroRoundRobin + 1) % Math.max(this.enCurso.length, 1);
      }
    }

    // Estrés: sube si WIP > 3, baja si WIP <= 3. Fumar NO lo baja.
    if (this.wip > 3) {
      this.estres += ESTRES_SUBE_POR_UNIDAD * (this.wip - 3) * dt;
    } else {
      this.estres -= ESTRES_BAJA * dt;
    }
    this.estres = Math.max(0, Math.min(100, this.estres));
    this.estresMax = Math.max(this.estresMax, this.estres);

    // Urgencia de fumar: se acumula más rápido mientras más estrés hay.
    if (!this.fumando) {
      this.urgenciaFumar += this.estres * URGENCIA_FUMAR_FACTOR * dt;
      if (this.urgenciaFumar >= 100) {
        this.urgenciaFumar = 0;
        this.fumando = true;
        this.minutosFumadaRestantes = DURACION_PITADO_MIN;
        this.colillas += 1;
        this.eventoEsteTick = 'empieza_a_fumar';
      }
    }

    if (this.minutoActual >= MINUTOS_DIA_FIN) this.terminado = true;
  }

  estado() {
    return {
      hora: this.horaTexto(),
      fraccionDelDia: this.fraccionDelDia,
      porHacer: this.porHacer.length,
      enCurso: this.enCurso.length,
      hechas: this.hechas.length,
      estres: this.estres,
      estresMax: this.estresMax,
      nivel: nivelDeEstres(this.estres),
      colillas: this.colillas,
      colillasVisibles: Math.min(this.colillas, MAX_COLILLAS_VISIBLES),
      fumando: this.fumando,
      terminado: this.terminado,
      evento: this.eventoEsteTick,
    };
  }

  resumenFinal() {
    return {
      wip: this.wipMin === this.wipMax ? this.wip : `${this.wipMin}–${this.wipMax}`,
      hechas: this.hechas.length,
      colillas: this.colillas,
      estresMax: Math.round(this.estresMax), // siempre en % (0 a 100)
    };
  }
}
