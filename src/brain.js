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
const MINUTOS_DIA = MINUTOS_DIA_FIN - MINUTOS_DIA_INICIO;
const DURACION_TAREA_MIN = 15;
const DURACION_TAREA_MAX = 35;
const TOTAL_TAREAS_BACKLOG = 50;

// Cada tarea extra suma un costo (los números son del juego; lo respaldado
// por la evidencia es la tendencia, ver "Por qué funciona así" en el
// documento de contexto).
//
// Costo de cambiar de tarea (Weinberg 1992, en versión suave): qué parte
// del tiempo rinde de verdad según cuántas tareas alterna. WIP 1 = 100%.
export const RENDIMIENTO_POR_WIP = [1, 0.85, 0.78, 0.72, 0.67, 0.62, 0.58, 0.55, 0.52, 0.5];
// Estrés con techo según el WIP (Mark, Gudith y Klocke 2008: más
// interrupciones = más estrés). El estrés sube o baja suave hacia este
// nivel: WIP 1–3 Tranqui, 4–5 Ocupada, 6–7 Estresada, 8–10 Colapsada.
export const ESTRES_OBJETIVO_POR_WIP = [5, 10, 18, 32, 44, 57, 68, 84, 92, 100];
const MINUTOS_ACOMODO_ESTRES = 40; // en ~40 min recorre 2/3 del camino al objetivo
// Fumar: sólo sobre "Tranqui"; las ganas crecen con el estrés que sobra, y
// más rápido mientras más alto (WIP 4 ≈ 1 colilla al día, WIP 9 ≈ 13).
const ESTRES_MIN_FUMAR = 25;
const URGENCIA_FUMAR_FACTOR = 0.04; // cuánta "urgencia" se acumula por minuto según el estrés
const URGENCIA_FUMAR_CURVA = 0.4; // cuánto se aceleran las ganas con estrés muy alto
const DURACION_PITADO_MIN = 8; // minutos simulados que dura cada salida a fumar
const MAX_COLILLAS_VISIBLES = 33; // 21 caben en el cenicero, el resto se desborda
// Café = "pausa sana": sólo con estrés bajo. Las ganas crecen más rápido
// mientras más tranquila está; con estrés alto se olvida del café.
const ESTRES_MAX_CAFE = 55;
const URGENCIA_CAFE_POR_MIN = 1.3; // con estrés 0: un café cada ~75 min (de vez en cuando)
const DURACION_CAFE_MIN = 1.5; // minutos simulados que dura cada sorbo
// El tablero no parte vacío cada mañana: "En curso" trae lo que venía de
// días anteriores, a medio hacer. Se juegan en silencio estos días previos
// con el mismo WIP (así se cumple la Ley de Little también en un solo día).
const DIAS_PREVIOS = 3;
const PASO_DIAS_PREVIOS = 0.25; // minutos simulados por paso (rápido y parejo)

const porWip = (tabla, n) => tabla[Math.min(Math.max(Math.round(n), 1), tabla.length) - 1];

let siguienteId = 1;
function tareaAleatoria() {
  return {
    id: siguienteId++,
    minutosRestantes:
      DURACION_TAREA_MIN + Math.random() * (DURACION_TAREA_MAX - DURACION_TAREA_MIN),
    inicio: null, // minuto del día en que entró a "En curso" (negativo = días anteriores)
  };
}

export class DayBrain {
  constructor(wip, { tareasDeAyer = true } = {}) {
    this.wip = wip;
    // Si mueven el slider a mitad del día, la tabla muestra el rango usado
    this.wipMin = wip;
    this.wipMax = wip;
    this.minutoActual = MINUTOS_DIA_INICIO;
    this.porHacer = [];
    for (let i = 1; i <= TOTAL_TAREAS_BACKLOG; i++) this.porHacer.push(tareaAleatoria());
    this.enCurso = tareasDeAyer ? DayBrain.tareasQueVienenDeAyer(wip) : [];
    this.hechas = [];
    this.punteroRoundRobin = 0;
    // Para "Tiempo por tarea" y la Ley de Little
    this.sumaTiempoPorTarea = 0; // minutos en "En curso" de las tareas terminadas hoy
    this.tareasMedidas = 0;
    this.areaEnCurso = 0; // tareas en curso × minutos (para el WIP promedio)
    this.areaEstres = 0; // estrés × minutos (para el estrés promedio)
    this.estres = 10;
    this.estresMax = 10;
    this.urgenciaFumar = 0;
    this.colillas = 0;
    this.fumando = false;
    this.urgenciaCafe = 0;
    this.cafes = 0;
    this.tomandoCafe = false;
    this.minutosCafeRestantes = 0;
    this.minutosFumadaRestantes = 0;
    this.terminado = false;
    this.eventoEsteTick = null; // 'trabajando' | 'empieza_a_fumar' | 'fumando' | 'vuelve_a_trabajar'
  }

  // Lo que quedó "En curso" al final de unos días previos jugados en silencio
  // con el mismo WIP (con sus mismas reglas). Su "inicio" queda en negativo:
  // minutos de trabajo antes de las 09:00 de hoy.
  static tareasQueVienenDeAyer(wip) {
    let quedaron = [];
    for (let d = 0; d < DIAS_PREVIOS; d++) {
      const dia = new DayBrain(wip, { tareasDeAyer: false });
      dia.enCurso = quedaron;
      while (!dia.terminado) dia.tick(PASO_DIAS_PREVIOS);
      quedaron = dia.enCurso.map((t) => ({ ...t, inicio: t.inicio - MINUTOS_DIA }));
    }
    return quedaron;
  }

  setWip(wip) {
    this.wip = wip;
    // Cambiarlo en los primeros 15 minutos cuenta como elegir el WIP del día
    // (no como un día "mixto")
    if (this.minutoActual > MINUTOS_DIA_INICIO + 15) {
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
    return this.minutosDeDia / MINUTOS_DIA;
  }

  // Tiempo por tarea (lead time): minutos promedio que pasó cada tarea
  // terminada hoy en "En curso", desde que entró hasta que se terminó.
  get tiempoPorTarea() {
    return this.tareasMedidas ? this.sumaTiempoPorTarea / this.tareasMedidas : null;
  }

  horaTexto() {
    const m = Math.min(this.minutoActual, MINUTOS_DIA_FIN);
    const h = Math.floor(m / 60);
    const min = Math.floor(m % 60);
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  _rellenarEnCurso() {
    while (this.enCurso.length < this.wip && this.porHacer.length > 0) {
      const tarea = this.porHacer.shift();
      tarea.inicio = this.minutosDeDia;
      this.enCurso.push(tarea);
    }
    if (this.punteroRoundRobin >= this.enCurso.length) this.punteroRoundRobin = 0;
  }

  // Avanza la simulación `dtMin` minutos simulados (puede ser fraccionario).
  tick(dtMin) {
    if (this.terminado || dtMin <= 0) return;

    this.eventoEsteTick = this.fumando ? 'fumando' : this.tomandoCafe ? 'cafe' : 'trabajando';

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
    } else if (this.tomandoCafe) {
      this.minutosCafeRestantes -= dt;
      if (this.minutosCafeRestantes <= 0) {
        this.tomandoCafe = false;
        this.eventoEsteTick = 'vuelve_a_trabajar';
      }
    } else if (this.enCurso.length > 0) {
      // Va rotando entre las tareas en curso; mientras más alterna, menos
      // rinde cada minuto (costo de cambiar de tarea)
      const tarea = this.enCurso[this.punteroRoundRobin % this.enCurso.length];
      tarea.minutosRestantes -= dt * porWip(RENDIMIENTO_POR_WIP, this.enCurso.length);

      if (tarea.minutosRestantes <= 0) {
        const idx = this.enCurso.indexOf(tarea);
        this.enCurso.splice(idx, 1);
        this.hechas.push(tarea);
        this.sumaTiempoPorTarea += this.minutosDeDia - tarea.inicio;
        this.tareasMedidas += 1;
        this._rellenarEnCurso();
      } else {
        this.punteroRoundRobin = (this.punteroRoundRobin + 1) % Math.max(this.enCurso.length, 1);
      }
    }
    this.areaEnCurso += this.enCurso.length * dt;

    // Estrés: sube o baja suave hacia el techo que pone el WIP elegido.
    // Fumar NO lo baja (sólo bajar el WIP lo baja).
    const objetivo = porWip(ESTRES_OBJETIVO_POR_WIP, this.wip);
    this.estres += (objetivo - this.estres) * (1 - Math.exp(-dt / MINUTOS_ACOMODO_ESTRES));
    this.estres = Math.max(0, Math.min(100, this.estres));
    this.estresMax = Math.max(this.estresMax, this.estres);
    this.areaEstres += this.estres * dt;

    // Ganas de un café (sólo con estrés bajo)
    if (!this.fumando && !this.tomandoCafe) {
      if (this.estres < ESTRES_MAX_CAFE) {
        this.urgenciaCafe += URGENCIA_CAFE_POR_MIN * (1 - this.estres / ESTRES_MAX_CAFE) * dt;
      }
      if (this.urgenciaCafe >= 100) {
        this.urgenciaCafe = 0;
        this.tomandoCafe = true;
        this.minutosCafeRestantes = DURACION_CAFE_MIN;
        this.cafes += 1;
        this.eventoEsteTick = 'empieza_cafe';
      }
    }

    // Urgencia de fumar: sólo sobre "Tranqui", y crece más rápido mientras
    // más estrés hay (WIP 9 ≈ 13 colillas al día).
    if (!this.fumando && !this.tomandoCafe) {
      const sobra = Math.max(0, this.estres - ESTRES_MIN_FUMAR);
      const curva = 1 + URGENCIA_FUMAR_CURVA * (sobra / (100 - ESTRES_MIN_FUMAR)) ** 2;
      this.urgenciaFumar += sobra * URGENCIA_FUMAR_FACTOR * curva * dt;
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
      wip: this.wip,
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
      cafes: this.cafes,
      tomandoCafe: this.tomandoCafe,
      tiempoPorTarea: this.tiempoPorTarea,
      terminado: this.terminado,
      evento: this.eventoEsteTick,
    };
  }

  resumenFinal() {
    return {
      wip: this.wipMin === this.wipMax ? this.wip : `${this.wipMin}–${this.wipMax}`,
      hechas: this.hechas.length,
      colillas: this.colillas,
      cafes: this.cafes,
      tiempoPorTarea: this.tiempoPorTarea === null ? null : Math.round(this.tiempoPorTarea),
      estresMax: Math.round(this.estresMax), // siempre en % (0 a 100)
    };
  }

  // Promedios del día (para validar el juego; ver scripts/simular-dias.mjs)
  medidas() {
    const minutos = Math.max(this.minutosDeDia, 1e-9);
    return {
      hechas: this.hechas.length,
      tareasMedidas: this.tareasMedidas,
      sumaTiempoPorTarea: this.sumaTiempoPorTarea,
      wipPromedio: this.areaEnCurso / minutos,
      estresPromedio: this.areaEstres / minutos,
      minutos,
      colillas: this.colillas,
      cafes: this.cafes,
    };
  }
}
