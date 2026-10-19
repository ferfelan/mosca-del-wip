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
// Estrés con techo según las tareas REALMENTE abiertas (Mark, Gudith y
// Klocke 2008: más interrupciones = más estrés; Leroy 2009: lo que queda sin
// terminar sigue ocupando la cabeza). 1–3 abiertas Tranqui, 4–5 Ocupada,
// 6–7 Estresada, 8–10 Colapsada.
export const ESTRES_OBJETIVO_POR_WIP = [5, 10, 18, 32, 44, 57, 68, 84, 92, 100];
// Sube rápido y baja lento (Dickerson y Kemeny 2004; modelo
// Esfuerzo-Recuperación de Meijman y Mulder 1998). Minutos del juego en que
// recorre 2/3 del camino hacia su techo. Con esto, bajar de WIP 10 a 2 lleva
// de "Colapsada" a "Tranqui" en ~2 h 50 min del juego (ver simular-dias).
const MINUTOS_SUBE_ESTRES = 40;
const MINUTOS_BAJA_ESTRES = 55;
// Al bajar el límite, lo empezado sigue abierto: trabaja sólo en las más
// antiguas (tantas como el WIP), pero cada tarea que quedó esperando le
// resta un poco (residuo atencional, Leroy 2009).
const RESIDUO_POR_TAREA_ESPERANDO = 0.03;
// Bloqueos: algunas tareas quedan un rato esperando a otra persona (una
// respuesta, una revisión). Mientras tanto siguen ocupando su lugar en
// "En curso" y suman estrés, pero no se pueden trabajar. Con WIP 1, si su
// única tarea se bloquea, la mosca espera sin hacer nada; con 2 o 3 puede
// avanzar otra (Bertolotti y otros 2015: ni muy pocos ni demasiados frentes
// a la vez; la curva es una U invertida). Los valores son del pedido de
// Felipe y no se ajustan para forzar un resultado.
const PROBABILIDAD_BLOQUEO = 0.2; // ~20% de las tareas se bloquea una vez
const BLOQUEO_MIN = 30; // minutos del juego que queda bloqueada (al azar entre 30 y 60)
const BLOQUEO_MAX = 60;
// Fumar: sólo sobre "Tranqui"; las ganas crecen con el estrés que sobra, y
// más rápido mientras más alto (WIP 4 ≈ 1 colilla al día, WIP 9 ≈ 13).
const ESTRES_MIN_FUMAR = 25;
const URGENCIA_FUMAR_FACTOR = 0.04; // cuánta "urgencia" se acumula por minuto según el estrés
const URGENCIA_FUMAR_CURVA = 0.4; // cuánto se aceleran las ganas con estrés muy alto
const DURACION_PITADO_MIN = 8; // minutos simulados que dura cada salida a fumar
const MAX_COLILLAS_VISIBLES = 33; // 21 caben en el cenicero, el resto se desborda
// Fumar da un alivio breve y después un rebote que lo anula: en neto no baja
// el estrés (Parrott 1999: sólo alivia la abstinencia que el mismo cigarro
// provoca; Taylor y otros 2014: quienes dejan de fumar quedan con menos
// estrés). Al empezar a fumar: −5 puntos por 5 minutos y luego +5 por 5.
const ALIVIO_FUMAR_PUNTOS = 5;
const ALIVIO_FUMAR_MIN = 5;
// Café = "pausa sana": sólo con estrés bajo. Las ganas crecen más rápido
// mientras más tranquila está; con estrés alto se olvida del café.
const ESTRES_MAX_CAFE = 55;
const URGENCIA_CAFE_POR_MIN = 1.3; // con estrés 0: un café cada ~75 min (de vez en cuando)
const DURACION_CAFE_MIN = 1.5; // minutos simulados que dura cada sorbo
// Saliendo de una sobrecarga (estrés bajo 55 pero todavía 10 puntos o más
// sobre su techo) el cuerpo pide una pausa: un café cada ~40 min. Cada café
// hace que el estrés baje 1,75 veces más rápido durante 10 min: las
// micro-pausas ayudan, pero de forma modesta (Albulescu y otros 2022). Lo que
// recupera es la pausa, no la cafeína, que sube el cortisol y más aún con
// estrés (Lovallo y otros 2005 y 2006): por eso el café sólo con estrés bajo.
const URGENCIA_CAFE_RECUPERANDO = 2.5;
const MINUTOS_RECUPERA_CAFE = 10;
const FACTOR_RECUPERA_CAFE = 1.75;
// El tablero no parte vacío cada mañana: "En curso" trae lo que venía de
// días anteriores, a medio hacer. Se juegan en silencio estos días previos
// con el mismo WIP (así se cumple la Ley de Little también en un solo día).
const DIAS_PREVIOS = 3;
const PASO_DIAS_PREVIOS = 0.25; // minutos simulados por paso (rápido y parejo)

const porWip = (tabla, n) => tabla[Math.min(Math.max(Math.round(n), 1), tabla.length) - 1];

let siguienteId = 1;
function tareaAleatoria() {
  const minutos = DURACION_TAREA_MIN + Math.random() * (DURACION_TAREA_MAX - DURACION_TAREA_MIN);
  return {
    id: siguienteId++,
    minutosRestantes: minutos,
    inicio: null, // minuto del día en que entró a "En curso" (negativo = días anteriores)
    // Si le toca bloquearse: en qué momento de su trabajo (al azar) y por
    // cuántos minutos del juego. Se bloquea una sola vez.
    bloqueo:
      Math.random() < PROBABILIDAD_BLOQUEO
        ? {
            cuandoQuedan: minutos * Math.random(),
            minutos: BLOQUEO_MIN + Math.random() * (BLOQUEO_MAX - BLOQUEO_MIN),
          }
        : null,
    minutosBloqueada: 0, // > 0 mientras espera a otra persona
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
    // Eficiencia: minutos que rinden de verdad (el mismo avance que reciben
    // las tareas). No rinden los cambios de tarea, fumar, el café ni esperar
    // por bloqueos.
    this.minutosRinden = 0;
    this.estresBase = 10; // el estrés que ponen las tareas abiertas
    this.estres = 10; // el que se siente: el de base más el alivio o rebote de fumar
    this.estresMax = 10;
    this.minutosDesdeFumar = null; // para el alivio breve y el rebote
    this.esperando = false; // todas sus tareas en curso están bloqueadas
    this.minutosEsperando = 0; // minutos del día sin poder trabajar por bloqueos
    this.urgenciaFumar = 0;
    this.colillas = 0;
    this.fumando = false;
    this.urgenciaCafe = 0;
    this.cafes = 0;
    this.tomandoCafe = false;
    this.minutosCafeRestantes = 0;
    this.minutosRecuperando = 0; // después de un café, el estrés baja más rápido
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

  // Tiempo por tarea (tiempo de ciclo): minutos de oficina promedio que pasó
  // cada tarea terminada hoy en "En curso", desde que entró hasta que se
  // terminó (si venía de ayer, cuenta lo de ayer; la noche no cuenta).
  get tiempoPorTarea() {
    return this.tareasMedidas ? this.sumaTiempoPorTarea / this.tareasMedidas : null;
  }

  // Eficiencia: de cada hora, qué parte rinde de verdad (0 a 1; × 60 = minutos
  // de cada hora). Promedio desde las 09:00.
  get eficiencia() {
    return this.minutosDeDia >= 1 ? this.minutosRinden / this.minutosDeDia : null;
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
    this.esperando = false;

    const restanteDia = MINUTOS_DIA_FIN - this.minutoActual;
    const dt = Math.min(dtMin, Math.max(restanteDia, 0));
    if (dt <= 0) {
      this.terminado = true;
      return;
    }
    this.minutoActual += dt;

    this._rellenarEnCurso();

    // Los bloqueos corren solos (la otra persona responde a su ritmo),
    // haga lo que haga la mosca
    for (const t of this.enCurso) if (t.minutosBloqueada > 0) t.minutosBloqueada = Math.max(0, t.minutosBloqueada - dt);
    const trabajables = this.enCurso.filter((t) => t.minutosBloqueada <= 0);

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
    } else if (this.enCurso.length > 0 && trabajables.length === 0) {
      // Todas sus tareas en curso están bloqueadas: espera sin teclear. No
      // toma otras, porque las bloqueadas siguen ocupando su lugar.
      this.esperando = true;
      this.minutosEsperando += dt;
      this.eventoEsteTick = 'esperando';
    } else if (trabajables.length > 0) {
      // Va rotando entre las tareas que puede trabajar; mientras más alterna,
      // menos rinde cada minuto (costo de cambiar de tarea). Si bajaron el
      // límite y tiene más abiertas que el WIP, no toma nuevas y se enfoca en
      // terminar las más antiguas. Toda tarea abierta que no está trabajando
      // (por sobre el límite o bloqueada) igual le resta un poco: lo que queda
      // a medias sigue ocupando la cabeza (residuo, Leroy 2009).
      const enfoque = Math.min(trabajables.length, this.wip);
      const esperando = this.enCurso.length - enfoque;
      const tarea = trabajables[this.punteroRoundRobin % enfoque];
      const rinde = porWip(RENDIMIENTO_POR_WIP, enfoque) * (1 - RESIDUO_POR_TAREA_ESPERANDO) ** esperando;
      tarea.minutosRestantes -= dt * rinde;
      // (si la terminó a mitad del paso, lo que sobra no cuenta)
      this.minutosRinden += dt * rinde + Math.min(0, tarea.minutosRestantes);

      // A veces, a mitad de camino, queda esperando a otra persona
      if (tarea.bloqueo && tarea.minutosRestantes > 0 && tarea.minutosRestantes <= tarea.bloqueo.cuandoQuedan) {
        tarea.minutosBloqueada = tarea.bloqueo.minutos;
        tarea.bloqueo = null;
      }

      if (tarea.minutosRestantes <= 0) {
        const idx = this.enCurso.indexOf(tarea);
        this.enCurso.splice(idx, 1);
        this.hechas.push(tarea);
        this.sumaTiempoPorTarea += this.minutosDeDia - tarea.inicio;
        this.tareasMedidas += 1;
        this._rellenarEnCurso();
      } else {
        this.punteroRoundRobin = (this.punteroRoundRobin + 1) % Math.max(enfoque, 1);
      }
    }
    this.areaEnCurso += this.enCurso.length * dt;

    // Estrés: se acerca al techo que ponen las tareas abiertas (también las
    // bloqueadas); sube rápido y baja lento. Un café reciente ayuda a bajarlo.
    // Fumar da un alivio breve y un rebote que lo anula: en neto no lo baja.
    const objetivo = porWip(ESTRES_OBJETIVO_POR_WIP, this.enCurso.length);
    let minutos = MINUTOS_SUBE_ESTRES;
    if (objetivo < this.estresBase) {
      minutos = MINUTOS_BAJA_ESTRES / (this.minutosRecuperando > 0 ? FACTOR_RECUPERA_CAFE : 1);
    }
    this.minutosRecuperando = Math.max(0, this.minutosRecuperando - dt);
    this.estresBase += (objetivo - this.estresBase) * (1 - Math.exp(-dt / minutos));
    this.estresBase = Math.max(0, Math.min(100, this.estresBase));
    let ajusteFumar = 0;
    if (this.minutosDesdeFumar !== null) {
      this.minutosDesdeFumar += dt;
      if (this.minutosDesdeFumar < ALIVIO_FUMAR_MIN) ajusteFumar = -ALIVIO_FUMAR_PUNTOS;
      else if (this.minutosDesdeFumar < 2 * ALIVIO_FUMAR_MIN) ajusteFumar = ALIVIO_FUMAR_PUNTOS;
      else this.minutosDesdeFumar = null;
    }
    this.estres = Math.max(0, Math.min(100, this.estresBase + ajusteFumar));
    this.estresMax = Math.max(this.estresMax, this.estres);
    this.areaEstres += this.estres * dt;

    // Ganas de un café (sólo con estrés bajo)
    if (!this.fumando && !this.tomandoCafe) {
      if (this.estres < ESTRES_MAX_CAFE) {
        // Saliendo de una sobrecarga (el estrés todavía está bastante sobre
        // su techo) le pide el cuerpo una pausa: las ganas crecen más rápido
        const recuperando = objetivo < this.estres - 10;
        const ritmo = recuperando ? URGENCIA_CAFE_RECUPERANDO : URGENCIA_CAFE_POR_MIN * (1 - this.estres / ESTRES_MAX_CAFE);
        this.urgenciaCafe += ritmo * dt;
      }
      if (this.urgenciaCafe >= 100) {
        this.urgenciaCafe = 0;
        this.tomandoCafe = true;
        this.minutosCafeRestantes = DURACION_CAFE_MIN;
        this.minutosRecuperando = MINUTOS_RECUPERA_CAFE;
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
        this.minutosDesdeFumar = 0;
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
      // Para el kanban: cuáles de las tareas en curso (de la más antigua a la
      // más nueva) están bloqueadas
      enCursoBloqueadas: this.enCurso.map((t) => t.minutosBloqueada > 0),
      bloqueadas: this.enCurso.filter((t) => t.minutosBloqueada > 0).length,
      esperando: this.esperando,
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
      eficiencia: this.eficiencia,
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
      eficiencia: this.eficiencia === null ? null : Math.round(this.eficiencia * 60), // minutos de cada hora
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
      minutosEsperando: this.minutosEsperando,
      minutosRinden: this.minutosRinden,
    };
  }
}
