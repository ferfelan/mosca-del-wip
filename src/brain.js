// "Cerebro simple" de la mosca: reglas de negocio del juego (sin 3D, sin DOM).
// Todo lo visual lee el estado que produce esta clase.

export const NIVELES_ESTRES = [
  { max: 25, nombre: 'Tranquila', color: '#4f9d6a' },
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
// terminar sigue ocupando la cabeza). 1–3 abiertas Tranquila, 4–5 Ocupada,
// 6–7 Estresada, 8–10 Colapsada.
export const ESTRES_OBJETIVO_POR_WIP = [5, 10, 18, 32, 44, 57, 68, 84, 92, 100];
// Sube rápido y baja lento (Dickerson y Kemeny 2004; modelo
// Esfuerzo-Recuperación de Meijman y Mulder 1998). Minutos del juego en que
// recorre 2/3 del camino hacia su techo. Con esto, bajar de WIP 10 a 2 lleva
// de "Colapsada" a "Tranquila" en ~2 h 50 min del juego (ver simular-dias).
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
// Fumar: sólo sobre "Tranquila"; las ganas crecen con el estrés que sobra, y
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
// Urgencias (Etapa 8.2, 2026-11-03): tareas que llegan sin aviso, en un momento
// al azar del día, y pasan por encima del límite, una a la vez: la mosca suelta
// lo que hacía y trabaja sólo en ella hasta terminarla ("vía rápida" de la
// práctica kanban, Anderson 2010, citado por fuente secundaria). Lo que soltó
// queda abierto y resta su residuo; el estrés sube porque hay una tarea abierta
// más. Nada extra. APAGADAS POR DEFECTO (0 al día): el juego de siempre da
// exactamente los mismos números. Cuántas llegan por día y las variantes
// ('termina-tarea' = B, 'cola' = C, duración corta = D) son supuestos nuestros,
// sólo para la simulación: regla, decisiones y criterios en
// docs/etapa8-2-criterios.md.
export const ENTRADAS_URGENCIA = ['interrumpe', 'termina-tarea', 'cola'];

const porWip = (tabla, n) => tabla[Math.min(Math.max(Math.round(n), 1), tabla.length) - 1];

let siguienteId = 1;
function tareaAleatoria(duracionMin = DURACION_TAREA_MIN, duracionMax = DURACION_TAREA_MAX) {
  const minutos = duracionMin + Math.random() * (duracionMax - duracionMin);
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
  constructor(wip, { tareasDeAyer = true, urgenciasPorDia = 0, urgencias = {} } = {}) {
    this.wip = wip;
    // Si mueven el slider a mitad del día, la tabla muestra el rango usado
    this.wipMin = wip;
    this.wipMax = wip;
    this.minutoActual = MINUTOS_DIA_INICIO;
    // Urgencias (Etapa 8.2): cuántas llegan al día y cómo entran ('interrumpe'
    // es la regla principal; 'termina-tarea' y 'cola' son las variantes B y C;
    // `duracion` [min, max] en minutos, por defecto la de una tarea). Con 0 al
    // día (lo normal del juego) nada de esto hace nada.
    this.urgencias = {
      porDia: urgenciasPorDia,
      entrada: urgencias.entrada ?? 'interrumpe',
      duracion: urgencias.duracion ?? [DURACION_TAREA_MIN, DURACION_TAREA_MAX],
      porLlegar: [], // las de hoy que todavía no llegaron, por hora de llegada
      enEspera: [], // llegaron y esperan al tope de "Por hacer" (principal y B)
      llegadas: 0,
      terminadas: 0,
    };
    this.minutosUrgencias = 0; // minutos del día en que trabajó una urgencia
    this.porHacer = [];
    for (let i = 1; i <= TOTAL_TAREAS_BACKLOG; i++) this.porHacer.push(tareaAleatoria());
    const ayer = tareasDeAyer ? DayBrain.tareasQueVienenDeAyer(wip, this.urgencias) : { enCurso: [], urgenciasEnEspera: [] };
    this.enCurso = ayer.enCurso;
    this._recibirUrgenciasDeAyer(ayer.urgenciasEnEspera);
    this._sortearUrgencias(); // después de las tareas normales: con 0 el azar queda idéntico
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
  // con el mismo WIP (con sus mismas reglas, también las urgencias: la mosca
  // vive en ese mundo). Su "inicio" (y la "llegada" de una urgencia) queda en
  // negativo: minutos de trabajo antes de las 09:00 de hoy. También devuelve
  // las urgencias que llegaron ayer y no alcanzaron a entrar.
  static tareasQueVienenDeAyer(wip, urgencias = null) {
    const opciones = urgencias ? { urgenciasPorDia: urgencias.porDia, urgencias: { entrada: urgencias.entrada, duracion: urgencias.duracion } } : {};
    const deAyer = (t) => ({ ...t, inicio: t.inicio === null ? null : t.inicio - MINUTOS_DIA, ...(t.urgente ? { llegada: t.llegada - MINUTOS_DIA } : {}) });
    let quedaron = [];
    let esperaban = [];
    for (let d = 0; d < DIAS_PREVIOS; d++) {
      const dia = new DayBrain(wip, { tareasDeAyer: false, ...opciones });
      dia.enCurso = quedaron;
      dia._recibirUrgenciasDeAyer(esperaban);
      while (!dia.terminado) dia.tick(PASO_DIAS_PREVIOS);
      quedaron = dia.enCurso.map(deAyer);
      esperaban = [...dia.urgencias.enEspera, ...dia.porHacer.filter((t) => t.urgente)].map(deAyer);
    }
    return { enCurso: quedaron, urgenciasEnEspera: esperaban };
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
    // Una urgencia con prioridad va por encima del límite: no ocupa lugar
    let dentroDelLimite = 0;
    for (const t of this.enCurso) if (!t.prioridad) dentroDelLimite++;
    while (dentroDelLimite < this.wip && this.porHacer.length > 0) {
      const tarea = this.porHacer.shift();
      tarea.inicio = this.minutosDeDia;
      this.enCurso.push(tarea);
      dentroDelLimite++;
    }
    if (this.punteroRoundRobin >= this.enCurso.length) this.punteroRoundRobin = 0;
  }

  // ---- Urgencias (Etapa 8.2; la regla y las decisiones, en docs/etapa8-2-criterios.md) ----

  // Sortea las urgencias de hoy: cuándo llega cada una (al azar, parejo entre
  // las 09:00 y las 18:00) y su tamaño. Van después de las tareas normales,
  // así con 0 urgencias el azar es idéntico al de siempre y, con la misma
  // semilla, las variantes reciben las mismas llegadas.
  _sortearUrgencias() {
    const u = this.urgencias;
    for (let i = 0; i < u.porDia; i++) {
      const llegada = Math.random() * MINUTOS_DIA; // minuto del día (0 = 09:00)
      const t = tareaAleatoria(u.duracion[0], u.duracion[1]);
      t.urgente = true;
      t.llegada = llegada;
      t.prioridad = u.entrada !== 'cola'; // en la variante C es una tarea normal más
      t.espero = false;
      u.porLlegar.push(t);
    }
    u.porLlegar.sort((a, b) => a.llegada - b.llegada);
  }

  // Urgencias que ayer llegaron y no alcanzaron a entrar: hoy esperan primero
  // (y quedan anotadas como que tuvieron que esperar)
  _recibirUrgenciasDeAyer(lista) {
    if (!lista.length) return;
    for (const t of lista) t.espero = true;
    if (this.urgencias.entrada === 'cola') this.porHacer.unshift(...lista);
    else this.urgencias.enEspera.push(...lista);
  }

  // Las que llegan en este paso. Principal y B: esperan al tope de "Por hacer"
  // y la primera entra si puede. C: al tope de "Por hacer", detrás de otras
  // urgencias, y entra cuando se libera un lugar, como cualquier tarea.
  // Devuelve las recién llegadas (para anotar si tuvieron que esperar).
  _llegarUrgencias(esperaba) {
    const u = this.urgencias;
    const llegan = [];
    while (u.porLlegar.length && u.porLlegar[0].llegada <= this.minutosDeDia) {
      const t = u.porLlegar.shift();
      u.llegadas += 1;
      llegan.push(t);
      if (u.entrada === 'cola') {
        let i = 0;
        while (i < this.porHacer.length && this.porHacer[i].urgente) i++;
        this.porHacer.splice(i, 0, t);
      } else {
        u.enEspera.push(t);
      }
    }
    if (u.enEspera.length) this._dejarEntrarUrgencia({ entreTareas: !this._aMitadDeTarea(esperaba) });
    return llegan;
  }

  // Variante B: ¿está a mitad de una tarea? Sí, si en el paso anterior estaba
  // trabajando (ni fumando, ni café, ni esperando por bloqueos) y tiene alguna
  // tarea normal que puede avanzar. "En la mano" = las que está rotando; está
  // "entre tareas" cuando termina una de ellas.
  _aMitadDeTarea(esperaba) {
    if (this.fumando || this.tomandoCafe || esperaba) return false;
    return this.enCurso.some((t) => !t.prioridad && t.minutosBloqueada <= 0);
  }

  // ¿Puede entrar la primera urgencia que espera? Sólo si no hay otra con
  // prioridad en curso (máximo una a la vez). En B, además, sólo "entre
  // tareas": al terminar una, o si no está a mitad de ninguna.
  _dejarEntrarUrgencia({ entreTareas }) {
    const u = this.urgencias;
    if (u.entrada === 'cola' || !u.enEspera.length) return;
    if (this.enCurso.some((t) => t.prioridad)) return;
    if (u.entrada === 'termina-tarea' && !entreTareas) return;
    const t = u.enEspera.shift();
    t.inicio = this.minutosDeDia;
    this.enCurso.push(t); // por encima del límite: _rellenarEnCurso no la cuenta
  }

  // Avanza la simulación `dtMin` minutos simulados (puede ser fraccionario).
  tick(dtMin) {
    if (this.terminado || dtMin <= 0) return;

    const esperaba = this.esperando; // (variante B: ¿estaba a mitad de una tarea al llegar una urgencia?)
    this.eventoEsteTick = this.fumando ? 'fumando' : this.tomandoCafe ? 'cafe' : 'trabajando';
    this.esperando = false;

    const restanteDia = MINUTOS_DIA_FIN - this.minutoActual;
    const dt = Math.min(dtMin, Math.max(restanteDia, 0));
    if (dt <= 0) {
      this.terminado = true;
      return;
    }
    this.minutoActual += dt;

    const recienLlegadas = this._llegarUrgencias(esperaba);
    this._rellenarEnCurso();

    // Los bloqueos corren solos (la otra persona responde a su ritmo),
    // haga lo que haga la mosca
    for (const t of this.enCurso) if (t.minutosBloqueada > 0) t.minutosBloqueada = Math.max(0, t.minutosBloqueada - dt);
    const trabajables = this.enCurso.filter((t) => t.minutosBloqueada <= 0);
    // Una urgencia con prioridad que se puede trabajar: la mosca se dedica sólo a ella
    const urgente = trabajables.find((t) => t.prioridad);

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
      // Con una urgencia (Etapa 8.2): prioridad total, no alterna (rinde como
      // con una sola tarea) y todo lo demás queda esperando, restando su residuo.
      let enfoque;
      let tarea;
      if (urgente) {
        enfoque = 1;
        tarea = urgente;
      } else {
        enfoque = Math.min(trabajables.length, this.wip);
        tarea = trabajables[this.punteroRoundRobin % enfoque];
      }
      const esperando = this.enCurso.length - enfoque;
      const rinde = porWip(RENDIMIENTO_POR_WIP, enfoque) * (1 - RESIDUO_POR_TAREA_ESPERANDO) ** esperando;
      tarea.minutosRestantes -= dt * rinde;
      // (si la terminó a mitad del paso, lo que sobra no cuenta)
      this.minutosRinden += dt * rinde + Math.min(0, tarea.minutosRestantes);
      if (tarea.urgente) this.minutosUrgencias += dt;

      // A veces, a mitad de camino, queda esperando a otra persona
      if (tarea.bloqueo && tarea.minutosRestantes > 0 && tarea.minutosRestantes <= tarea.bloqueo.cuandoQuedan) {
        tarea.minutosBloqueada = tarea.bloqueo.minutos;
        tarea.bloqueo = null;
      }

      if (tarea.minutosRestantes <= 0) {
        const idx = this.enCurso.indexOf(tarea);
        this.enCurso.splice(idx, 1);
        tarea.fin = this.minutosDeDia;
        this.hechas.push(tarea);
        this.sumaTiempoPorTarea += this.minutosDeDia - tarea.inicio;
        this.tareasMedidas += 1;
        if (tarea.urgente) this.urgencias.terminadas += 1;
        this._dejarEntrarUrgencia({ entreTareas: true }); // la urgencia que esperaba (si hay) entra ahora
        this._rellenarEnCurso();
      } else if (!urgente) {
        // (trabajando una urgencia no se mueve la rotación: después retoma donde iba)
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

    // Urgencia de fumar: sólo sobre "Tranquila", y crece más rápido mientras
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

    // Si una urgencia recién llegada no entró dentro de este mismo paso, tuvo que esperar
    for (const t of recienLlegadas) t.espero = t.inicio === null;

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
      // Urgencias (Etapa 8.2; con 0 al día todo queda en 0)
      hechasNormales: this.hechas.length - this.urgencias.terminadas,
      urgencias: {
        porDia: this.urgencias.porDia,
        enCurso: this.enCurso.reduce((n, t) => n + (t.urgente ? 1 : 0), 0),
        esperando: this.urgencias.enEspera.length + this.porHacer.reduce((n, t) => n + (t.urgente ? 1 : 0), 0),
        llegadas: this.urgencias.llegadas,
        terminadas: this.urgencias.terminadas,
      },
      enCursoUrgentes: this.enCurso.map((t) => !!t.urgente),
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
      hechasNormales: this.hechas.length - this.urgencias.terminadas, // (Etapa 8.2) sin contar urgencias
      urgencias: this.urgencias.terminadas,
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
      // Urgencias (Etapa 8.2)
      hechasNormales: this.hechas.length - this.urgencias.terminadas,
      hechasUrgentes: this.urgencias.terminadas,
      urgenciasLlegadas: this.urgencias.llegadas,
      urgenciasSinTerminar: this.enCurso.filter((t) => t.urgente).length + this.urgencias.enEspera.length + this.porHacer.filter((t) => t.urgente).length,
      minutosUrgencias: this.minutosUrgencias,
      estresFinal: this.estres,
      // Cada tarea terminada hoy: minutos en "En curso" (lo de ayer cuenta, la
      // noche no) y, si es urgencia, desde que llegó y cuánto esperó para entrar
      tareas: this.hechas.map((t) => ({
        urgente: !!t.urgente,
        enCurso: t.fin - t.inicio,
        desdeLlegada: t.urgente ? t.fin - t.llegada : null,
        espera: t.urgente ? t.inicio - t.llegada : null,
        espero: !!t.espero,
      })),
    };
  }
}
