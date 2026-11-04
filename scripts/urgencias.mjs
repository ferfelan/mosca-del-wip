// Etapa 8.2 · Urgencias (H5a, H5b y H5c). La regla, las medidas y los criterios
// quedaron fijados ANTES de correr en docs/etapa8-2-criterios.md (commit
// 28a7668); aquí no se decide nada, sólo se mide y se aplican esos criterios.
//
// La misma simulación de simular-dias: 200 días por combinación, pasos de 0,15
// minutos, los 3 días previos en silencio, semilla 2024 reiniciada en cada
// combinación (variante × urgencias al día × límite). El juego de verdad
// (src/brain.js) con su opción `urgenciasPorDia`; las variantes B, C y D son
// las opciones `entrada` y `duracion` ("supuesto nuestro").
//
// Uso: node scripts/urgencias.mjs            → todo (guarda docs/etapa8-2-resultados.json)
//      node scripts/urgencias.mjs control    → sólo el control (0 urgencias = corrida oficial)
//      node scripts/urgencias.mjs tablas     → las tablas en Markdown desde el JSON guardado
//      DIAS=50 node scripts/urgencias.mjs    → menos días, para probar el script
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DayBrain, nivelDeEstres } from '../src/brain.js';
import { sembrar, SEMILLA, PASO } from './medicion.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'docs/etapa8-2-resultados.json');
const DIAS = Number(process.env.DIAS ?? 200);
const MODO = process.argv[2] ?? 'todo';
const DURACION_TAREA_PROMEDIO = 25; // minutos: tareas de 15 a 35, parejo (para la "vara" de H5a)
const RANGO_4_2 = [2, 4]; // el rango "con esperas" de la 4.2
const Z = 1.96; // intervalo del 95 %

// ===========================================================================
// LO QUE SE CORRE (docs/etapa8-2-criterios.md, sección 3)
// ===========================================================================
const VARIANTES = {
  principal: { nombre: 'Regla principal (suelta lo que hace)', opciones: { entrada: 'interrumpe' }, niveles: [0, 1, 2, 3, 5] },
  B: { nombre: 'B · termina lo que tiene en la mano', opciones: { entrada: 'termina-tarea' }, niveles: [1, 2, 3, 5] },
  C: { nombre: 'C · como una tarea normal más', opciones: { entrada: 'cola' }, niveles: [1, 2, 3, 5] },
  D: { nombre: 'D · duran la mitad (8–18 min)', opciones: { entrada: 'interrumpe', duracion: [8, 18] }, niveles: [1, 2, 3, 5] },
};
// ===========================================================================

const media = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const desvio = (a) => { const m = media(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const errorEstandar = (a) => desvio(a) / Math.sqrt(a.length);
const percentil = (a, p) => { if (!a.length) return null; const o = [...a].sort((x, y) => x - y); return o[Math.min(o.length - 1, Math.max(0, Math.ceil(p * o.length) - 1))]; };
const r2 = (x) => (x === null || x === undefined || Number.isNaN(x) ? null : Number(x.toFixed(2)));
const r3 = (x) => (x === null || x === undefined || Number.isNaN(x) ? null : Number(x.toFixed(3)));
const ruidoDiferencia = (ee1, ee2) => Z * Math.sqrt(ee1 ** 2 + ee2 ** 2);

// Juega 200 días con ese límite, esa cantidad de urgencias y esa variante
function jugar(wip, porDia, opciones) {
  sembrar(SEMILLA);
  const dia_ = { normales: [], totales: [], estresFinal: [], estresProm: [], estresMax: [], colillas: [], cafes: [], minUrg: [], tiempoNormal: [], urgTerm: [], urgLleg: [], urgSin: [], urgEsp: [], abiertas: [], rinden: [], esperaBloq: [] };
  const tiemposNormales = []; // minutos en "En curso" de cada normal terminada
  const tiemposUrg = []; // desde que llega hasta que termina
  const esperasUrg = []; // hasta entrar a "En curso"
  const esperasDeLasQueEsperaron = [];
  for (let d = 0; d < DIAS; d++) {
    const dia = new DayBrain(wip, { urgenciasPorDia: porDia, urgencias: opciones });
    while (!dia.terminado) dia.tick(PASO);
    const m = dia.medidas();
    dia_.normales.push(m.hechasNormales);
    dia_.totales.push(m.hechas);
    dia_.estresFinal.push(m.estresFinal);
    dia_.estresProm.push(m.estresPromedio);
    dia_.estresMax.push(dia.estresMax);
    dia_.colillas.push(m.colillas);
    dia_.cafes.push(m.cafes);
    dia_.minUrg.push(m.minutosUrgencias);
    dia_.urgTerm.push(m.hechasUrgentes);
    dia_.urgLleg.push(m.urgenciasLlegadas);
    dia_.urgSin.push(m.urgenciasSinTerminar);
    dia_.abiertas.push(m.wipPromedio);
    dia_.rinden.push((60 * m.minutosRinden) / m.minutos);
    dia_.esperaBloq.push(m.minutosEsperando);
    const normalesHoy = m.tareas.filter((t) => !t.urgente).map((t) => t.enCurso);
    if (normalesHoy.length) dia_.tiempoNormal.push(media(normalesHoy));
    tiemposNormales.push(...normalesHoy);
    let esperaron = 0;
    for (const t of m.tareas) {
      if (!t.urgente) continue;
      tiemposUrg.push(t.desdeLlegada);
      esperasUrg.push(t.espera);
      if (t.espero) { esperaron++; esperasDeLasQueEsperaron.push(t.espera); }
    }
    dia_.urgEsp.push(esperaron);
  }
  const ee = errorEstandar(dia_.normales);
  const eeEstres = errorEstandar(dia_.estresFinal);
  const eeTiempo = dia_.tiempoNormal.length > 1 ? errorEstandar(dia_.tiempoNormal) : null;
  const n = media(dia_.normales);
  const ec = media(dia_.estresFinal);
  return {
    terminadas_normales: n,
    terminadas_normales_ee: ee,
    terminadas_normales_ic: [n - Z * ee, n + Z * ee],
    terminadas_total: media(dia_.totales),
    urgencias_llegadas: media(dia_.urgLleg),
    urgencias_terminadas: media(dia_.urgTerm),
    urgencias_sin_terminar: media(dia_.urgSin),
    tiempo_normal_min: tiemposNormales.length ? media(tiemposNormales) : null, // suma ÷ suma, como el juego
    tiempo_normal_p85: percentil(tiemposNormales, 0.85),
    tiempo_normal_ee: eeTiempo, // error estándar de los promedios diarios
    tiempo_urgencia_min: tiemposUrg.length ? media(tiemposUrg) : null,
    tiempo_urgencia_p85: percentil(tiemposUrg, 0.85),
    urgencias_esperaron: media(dia_.urgEsp), // por día
    urgencias_esperaron_pct: tiemposUrg.length ? (100 * esperasDeLasQueEsperaron.length) / tiemposUrg.length : null,
    espera_urgencia_min: esperasUrg.length ? media(esperasUrg) : null, // promedio de todas las terminadas
    espera_de_las_que_esperaron_min: esperasDeLasQueEsperaron.length ? media(esperasDeLasQueEsperaron) : null,
    estres_cierre: ec,
    estres_cierre_ee: eeEstres,
    estres_cierre_ic: [ec - Z * eeEstres, ec + Z * eeEstres],
    estres_promedio: media(dia_.estresProm),
    estres_maximo: media(dia_.estresMax),
    colillas: media(dia_.colillas),
    cafes: media(dia_.cafes),
    minutos_urgencias: media(dia_.minUrg),
    abiertas_promedio: media(dia_.abiertas),
    eficiencia_min_por_hora: media(dia_.rinden),
    espera_bloqueos_min: media(dia_.esperaBloq),
  };
}

function redondear(c) {
  const salida = {};
  for (const [k, v] of Object.entries(c)) salida[k] = Array.isArray(v) ? v.map(r3) : typeof v === 'number' ? r3(v) : v;
  return salida;
}

// El mejor límite: el que más termina (empate exacto → el más bajo), con las
// terminadas normales (criterios, sección 5, punto 6)
function mejorDe(filas, clave = 'terminadas_normales') {
  let mejor = filas[0];
  for (const f of filas) if (f[clave] > mejor[clave]) mejor = f;
  return mejor;
}
const traslapan = (a, b) => Math.abs(a.terminadas_normales - b.terminadas_normales) <= Z * (a.terminadas_normales_ee + b.terminadas_normales_ee);

const f1 = (x) => (x === null || x === undefined ? '—' : x.toFixed(1).replace('.', ','));
const f0 = (x) => (x === null || x === undefined ? '—' : String(Math.round(x)));
const minutos = (m) => { if (m === null || m === undefined) return '—'; const r = Math.round(m); return r < 60 ? `${r} min` : `${Math.floor(r / 60)} h ${String(r % 60).padStart(2, '0')} min`; };
const pad = (s, n) => String(s).padStart(n);

// ---------------------------------------------------------------------------
// 1. Control: 0 urgencias = la corrida oficial, límite por límite
// ---------------------------------------------------------------------------
function control() {
  const oficial = JSON.parse(readFileSync(join(RAIZ, 'docs/corrida-oficial.json'), 'utf8'));
  const avisos = [];
  const filas = [];
  for (let wip = 1; wip <= 10; wip++) {
    const c = jugar(wip, 0, VARIANTES.principal.opciones);
    const o = oficial.filas[wip - 1];
    const pares = [['terminadas', c.terminadas_normales, o.terminadas], ['tiempo por tarea', c.tiempo_normal_min, o.tiempo_por_tarea_min], ['colillas', c.colillas, o.colillas], ['cafés', c.cafes, o.cafes], ['estrés promedio', c.estres_promedio, o.estres_promedio]];
    for (const [que, mio, suyo] of pares) if (r3(mio) !== suyo) avisos.push(`límite ${wip}: ${que} ${r3(mio)} ≠ ${suyo} (corrida oficial)`);
    if (c.terminadas_total !== c.terminadas_normales) avisos.push(`límite ${wip}: con 0 urgencias las terminadas totales no son las normales`);
    if (c.urgencias_terminadas !== 0 || c.minutos_urgencias !== 0) avisos.push(`límite ${wip}: con 0 urgencias hay urgencias`);
    filas.push(c);
  }
  return { avisos, filas, dias_oficial: oficial.dias };
}

// ---------------------------------------------------------------------------
// 2. Todo
// ---------------------------------------------------------------------------
async function todo() {
  const inicio = Date.now();
  console.log(`\nEtapa 8.2 · Urgencias · ${DIAS} días por combinación · semilla ${SEMILLA} · paso ${PASO}\n`);

  // Control
  const ctl = control();
  const controlBien = !ctl.avisos.length && DIAS === ctl.dias_oficial;
  console.log(`Control: con 0 urgencias ${controlBien ? 'da EXACTAMENTE la corrida oficial (terminadas, tiempo por tarea, colillas, cafés y estrés, límite por límite).' : 'NO calza con la corrida oficial:'}`);
  for (const a of ctl.avisos) console.log(' - ' + a);
  if (DIAS !== ctl.dias_oficial) console.log(` (con DIAS=${DIAS} no se puede comparar con la corrida oficial de ${ctl.dias_oficial} días: sólo es una prueba del script)`);
  if (!controlBien && DIAS === ctl.dias_oficial) {
    console.log('\nSE PARA AQUÍ: hay que avisar a Felipe antes de seguir.');
    process.exitCode = 1;
    return;
  }

  // Las 170 combinaciones
  const celdas = [];
  for (const [variante, v] of Object.entries(VARIANTES)) {
    for (const porDia of v.niveles) {
      const filas = [];
      for (let wip = 1; wip <= 10; wip++) {
        const c = variante === 'principal' && porDia === 0 ? ctl.filas[wip - 1] : jugar(wip, porDia, v.opciones);
        filas.push({ variante, urgencias_por_dia: porDia, wip, ...c });
      }
      celdas.push(...filas);
      process.stdout.write(`  ${variante} · ${porDia} al día: listo (${((Date.now() - inicio) / 1000).toFixed(0)} s)\n`);
    }
  }
  const de = (variante, porDia) => celdas.filter((c) => c.variante === variante && c.urgencias_por_dia === porDia);
  const celda = (variante, porDia, wip) => celdas.find((c) => c.variante === variante && c.urgencias_por_dia === porDia && c.wip === wip);

  // ---- Resumen por nivel (regla principal) ----
  const porNivel = VARIANTES.principal.niveles.map((L) => {
    const filas = de('principal', L);
    const mejor = mejorDe(filas);
    const mejorTotal = mejorDe(filas, 'terminadas_total');
    const vecinos = [mejor.wip - 1, mejor.wip + 1].filter((w) => w >= 1 && w <= 10).map((w) => filas[w - 1]);
    const mejorVecino = mejorDe(vecinos);
    return {
      urgencias_por_dia: L,
      mejor_wip: mejor.wip,
      mejor_wip_contando_urgencias: mejorTotal.wip,
      vecinos: vecinos.map((v) => v.wip),
      ventaja: mejor.terminadas_normales - mejorVecino.terminadas_normales,
      traslapa_con: vecinos.filter((v) => traslapan(mejor, v)).map((v) => v.wip),
      se_traslapan: vecinos.every((v) => traslapan(mejor, v)),
      en_el_mejor: mejor,
    };
  });

  // ---- H5a ----
  const n0 = porNivel[0], n1 = porNivel[1];
  const m = n1.mejor_wip;
  const donde = m >= RANGO_4_2[0] && m <= RANGO_4_2[1] ? 'en el rango' : m === RANGO_4_2[0] - 1 || m === RANGO_4_2[1] + 1 ? 'se corre un lugar' : 'se sale del rango';
  const vara = [];
  for (let wip = 1; wip <= 10; wip++) {
    const c0 = celda('principal', 0, wip), c1 = celda('principal', 1, wip);
    const perdida = c0.terminadas_normales - c1.terminadas_normales;
    const caben = c1.minutos_urgencias / DURACION_TAREA_PROMEDIO;
    const ruido = ruidoDiferencia(c0.terminadas_normales_ee, c1.terminadas_normales_ee);
    vara.push({ wip, perdida, caben, ruido, vara: caben + ruido, pasa_la_vara: perdida > caben + ruido, de_mas: perdida - caben, colillas_de_mas: c1.colillas - c0.colillas, estres_cierre_de_mas: c1.estres_cierre - c0.estres_cierre, minutos_urgencias: c1.minutos_urgencias });
  }
  const varaEn2 = vara[1];
  const h5a = {
    mejor_con_0: n0.mejor_wip,
    mejor_con_1: m,
    se_movio: m !== n0.mejor_wip,
    donde,
    perdida_en_2: varaEn2.perdida,
    vara_en_2: varaEn2.vara,
    caben_en_2: varaEn2.caben,
    ruido_en_2: varaEn2.ruido,
    pasa_la_vara_en_2: varaEn2.pasa_la_vara,
    veredicto: donde === 'en el rango' && !varaEn2.pasa_la_vara ? 'se cumple' : donde === 'se sale del rango' || (donde === 'se corre un lugar' && varaEn2.pasa_la_vara) ? 'no se cumple' : 'a medias',
    por_limite: vara,
  };

  // ---- H5b ----
  const niveles = porNivel.filter((n) => n.urgencias_por_dia > 0);
  const primerTraslape = niveles.find((n) => n.se_traslapan);
  const ventaja0 = n0.ventaja, ventaja5 = porNivel[porNivel.length - 1].ventaja;
  const h5b = {
    ventaja_por_nivel: porNivel.map((n) => ({ urgencias_por_dia: n.urgencias_por_dia, mejor_wip: n.mejor_wip, vecinos: n.vecinos, ventaja: n.ventaja, traslapa_con: n.traslapa_con, se_traslapan: n.se_traslapan })),
    primer_nivel_con_traslape: primerTraslape ? primerTraslape.urgencias_por_dia : null,
    ventaja_con_0: ventaja0,
    ventaja_con_5: ventaja5,
    veredicto: primerTraslape ? 'se cumple' : ventaja5 < ventaja0 ? 'a medias' : 'no se cumple',
  };

  // ---- H5c ----
  const h5cNiveles = [3, 5].map((L) => {
    const nivel = porNivel.find((n) => n.urgencias_por_dia === L);
    const w = nivel.mejor_wip;
    const P = celda('principal', L, w), C = celda('C', L, w);
    const comparar = (clave, eeClave) => {
      const dif = C[clave] - P[clave];
      const ruido = ruidoDiferencia(P[eeClave] ?? 0, C[eeClave] ?? 0);
      return { principal: P[clave], c: C[clave], diferencia: dif, ruido, resultado: dif <= ruido ? (dif < -ruido ? 'mejora' : 'iguala') : 'empeora' };
    };
    const tiempo = comparar('tiempo_normal_min', 'tiempo_normal_ee');
    const estres = comparar('estres_cierre', 'estres_cierre_ee');
    const malas = [tiempo, estres].filter((x) => x.resultado === 'empeora').length;
    return {
      urgencias_por_dia: L,
      wip: w,
      tiempo_por_tarea_normal: tiempo,
      estres_al_cerrar: estres,
      terminadas_normales: { principal: P.terminadas_normales, c: C.terminadas_normales },
      urgencias: {
        tiempo_desde_llegada: { principal: P.tiempo_urgencia_min, c: C.tiempo_urgencia_min },
        p85_desde_llegada: { principal: P.tiempo_urgencia_p85, c: C.tiempo_urgencia_p85 },
        espera_hasta_entrar: { principal: P.espera_urgencia_min, c: C.espera_urgencia_min },
        esperaron_pct: { principal: P.urgencias_esperaron_pct, c: C.urgencias_esperaron_pct },
        sin_terminar_al_cierre: { principal: P.urgencias_sin_terminar, c: C.urgencias_sin_terminar },
      },
      veredicto: malas === 0 ? 'se cumple' : malas === 2 ? 'no se cumple' : 'a medias',
      por_limite: Array.from({ length: 10 }, (_, i) => {
        const p = celda('principal', L, i + 1), c = celda('C', L, i + 1);
        return { wip: i + 1, tiempo_normal: { principal: p.tiempo_normal_min, c: c.tiempo_normal_min }, estres_cierre: { principal: p.estres_cierre, c: c.estres_cierre }, terminadas_normales: { principal: p.terminadas_normales, c: c.terminadas_normales }, tiempo_urgencia: { principal: p.tiempo_urgencia_min, c: c.tiempo_urgencia_min } };
      }),
    };
  });
  const cumplen = h5cNiveles.filter((n) => n.veredicto === 'se cumple').length;
  const noCumplen = h5cNiveles.filter((n) => n.veredicto === 'no se cumple').length;
  const h5c = { niveles: h5cNiveles, veredicto: cumplen === 2 ? 'se cumple' : noCumplen === 2 ? 'no se cumple' : 'a medias' };

  // ---- Variantes: el mejor por nivel ----
  const variantes = {};
  for (const [variante, v] of Object.entries(VARIANTES)) {
    variantes[variante] = { nombre: v.nombre, por_nivel: v.niveles.map((L) => { const filas = de(variante, L); const mejor = mejorDe(filas); return { urgencias_por_dia: L, mejor_wip: mejor.wip, en_el_mejor: redondear(mejor) }; }) };
  }

  // ---------------- Pantalla ----------------
  console.log('\nREGLA PRINCIPAL · con X urgencias al día (en el mejor límite para las tareas normales)');
  console.log(' Urg./día  Mejor  Term. normales (IC 95 %)  Contando urg.  Tiempo/tarea normal  p85       Estrés al cerrar  Cigarros  Cafés  Min. en urgencias  Urg. terminadas  Esperaron');
  for (const n of porNivel) {
    const c = n.en_el_mejor;
    console.log(` ${pad(n.urgencias_por_dia, 8)}  ${pad(n.mejor_wip, 5)}  ${pad(f1(c.terminadas_normales), 6)} (${f1(c.terminadas_normales_ic[0])}–${f1(c.terminadas_normales_ic[1])})${' '.repeat(Math.max(0, 11 - f1(c.terminadas_normales_ic[0]).length - f1(c.terminadas_normales_ic[1]).length))}  ${pad(f1(c.terminadas_total), 13)}  ${pad(minutos(c.tiempo_normal_min), 19)}  ${pad(minutos(c.tiempo_normal_p85), 9)} ${pad(f0(c.estres_cierre) + ' %', 16)}  ${pad(f1(c.colillas), 8)}  ${pad(f1(c.cafes), 5)}  ${pad(f0(c.minutos_urgencias), 17)}  ${pad(f1(c.urgencias_terminadas), 15)}  ${pad(f1(c.urgencias_esperaron), 9)}`);
  }
  for (const L of VARIANTES.principal.niveles) {
    console.log(`\n Regla principal · ${L} urgencia${L === 1 ? '' : 's'} al día · por límite`);
    console.log('  Límite  Normales (IC 95 %)        Total  Tiempo normal  p85       Tiempo urg.  Esperaron  Estrés cierre  Cigarros  Cafés  Min. urg.  Abiertas prom.');
    for (const c of de('principal', L)) console.log(`  ${pad(c.wip, 6)}  ${pad(f1(c.terminadas_normales), 5)} (${f1(c.terminadas_normales_ic[0])}–${f1(c.terminadas_normales_ic[1])})${' '.repeat(Math.max(0, 11 - f1(c.terminadas_normales_ic[0]).length - f1(c.terminadas_normales_ic[1]).length))}  ${pad(f1(c.terminadas_total), 5)}  ${pad(minutos(c.tiempo_normal_min), 13)}  ${pad(minutos(c.tiempo_normal_p85), 9)}  ${pad(minutos(c.tiempo_urgencia_min), 11)}  ${pad(f1(c.urgencias_esperaron), 9)}  ${pad(f0(c.estres_cierre) + ' %', 13)}  ${pad(f1(c.colillas), 8)}  ${pad(f1(c.cafes), 5)}  ${pad(f0(c.minutos_urgencias), 9)}  ${pad(f1(c.abiertas_promedio), 14)}`);
  }

  console.log(`\nH5a (cabe), 1 urgencia al día: el mejor límite ${h5a.se_movio ? `se movió de ${h5a.mejor_con_0} a ${h5a.mejor_con_1}` : `sigue en ${h5a.mejor_con_1}`} → ${h5a.donde}.`);
  console.log(` La vara en el límite 2: pérdida ${f1(h5a.perdida_en_2).replace(',', ',')} normales; caben ${f1(h5a.caben_en_2)} (${f0(varaEn2.minutos_urgencias)} min de urgencias ÷ 25) + ruido ${f1(h5a.ruido_en_2)} = vara ${f1(h5a.vara_en_2)} → ${h5a.pasa_la_vara_en_2 ? 'PASA LA VARA (hay algo más)' : 'no pasa la vara'}.`);
  console.log('  Límite  Pérdida  Caben  Ruido  Vara   ¿Pasa?  De más (pérdida − caben)  Cigarros de más  Estrés al cerrar de más');
  for (const v of vara) console.log(`  ${pad(v.wip, 6)}  ${pad(f1(v.perdida), 7)}  ${pad(f1(v.caben), 5)}  ${pad(f1(v.ruido), 5)}  ${pad(f1(v.vara), 5)}  ${pad(v.pasa_la_vara ? 'SÍ' : 'no', 6)}  ${pad(f1(v.de_mas), 24)}  ${pad(f1(v.colillas_de_mas), 15)}  ${pad(f1(v.estres_cierre_de_mas) + ' pts', 23)}`);
  console.log(` → H5a: ${h5a.veredicto.toUpperCase()}`);

  console.log('\nH5b (deja de servir): ¿los intervalos del mejor y de sus vecinos se traslapan?');
  for (const n of porNivel) console.log(`  ${n.urgencias_por_dia} al día: mejor ${n.mejor_wip}, vecinos ${n.vecinos.join(' y ')}, ventaja ${f1(n.ventaja)} normales, se traslapa con ${n.traslapa_con.length ? n.traslapa_con.join(' y ') : 'ninguno'} → ${n.se_traslapan ? 'YA NO SE DISTINGUEN' : 'se distinguen'}`);
  console.log(` → H5b: ${h5b.veredicto.toUpperCase()}${h5b.primer_nivel_con_traslape ? ` (desde ${h5b.primer_nivel_con_traslape} al día)` : ` (ventaja con 0: ${f1(ventaja0)}; con 5: ${f1(ventaja5)})`}`);

  console.log('\nH5c (tratarlas como trabajo normal): variante C contra la regla principal, en el mejor límite de la principal');
  for (const n of h5cNiveles) {
    console.log(`  ${n.urgencias_por_dia} al día, límite ${n.wip}: tiempo por tarea normal ${minutos(n.tiempo_por_tarea_normal.principal)} → ${minutos(n.tiempo_por_tarea_normal.c)} (${n.tiempo_por_tarea_normal.resultado}; ruido ${f1(n.tiempo_por_tarea_normal.ruido)} min) · estrés al cerrar ${f0(n.estres_al_cerrar.principal)} % → ${f0(n.estres_al_cerrar.c)} % (${n.estres_al_cerrar.resultado}; ruido ${f1(n.estres_al_cerrar.ruido)} pts) → ${n.veredicto}`);
    console.log(`     normales ${f1(n.terminadas_normales.principal)} → ${f1(n.terminadas_normales.c)} · las urgencias en C: de llegar a terminar ${minutos(n.urgencias.tiempo_desde_llegada.principal)} → ${minutos(n.urgencias.tiempo_desde_llegada.c)} (p85 ${minutos(n.urgencias.p85_desde_llegada.principal)} → ${minutos(n.urgencias.p85_desde_llegada.c)}); espera hasta entrar ${minutos(n.urgencias.espera_hasta_entrar.principal)} → ${minutos(n.urgencias.espera_hasta_entrar.c)}; esperaron ${f0(n.urgencias.esperaron_pct.principal)} % → ${f0(n.urgencias.esperaron_pct.c)} %; sin terminar al cierre ${f1(n.urgencias.sin_terminar_al_cierre.principal)} → ${f1(n.urgencias.sin_terminar_al_cierre.c)}`);
  }
  console.log(` → H5c: ${h5c.veredicto.toUpperCase()}`);

  console.log('\nVARIANTES · el mejor límite por nivel (terminadas normales en el mejor)');
  for (const [variante, v] of Object.entries(variantes)) console.log(`  ${v.nombre.padEnd(40)} ${v.por_nivel.map((n) => `${n.urgencias_por_dia}/día: mejor ${n.mejor_wip} (${f1(n.en_el_mejor.terminadas_normales)})`).join(' · ')}`);

  const salida = {
    que: 'Etapa 8.2 · Urgencias. Resultados de scripts/urgencias.mjs: la misma simulación de simular-dias (200 días por combinación, paso 0,15, semilla 2024 reiniciada en cada combinación). Regla, medidas y criterios fijados antes de correr en docs/etapa8-2-criterios.md.',
    fecha: new Date().toISOString().slice(0, 10),
    dias: DIAS,
    semilla: SEMILLA,
    paso: PASO,
    control: { con_0_urgencias_es_la_corrida_oficial: controlBien, avisos: ctl.avisos },
    regla_principal_por_nivel: porNivel.map((n) => ({ ...n, ventaja: r3(n.ventaja), en_el_mejor: redondear(n.en_el_mejor) })),
    h5a: { ...h5a, perdida_en_2: r3(h5a.perdida_en_2), vara_en_2: r3(h5a.vara_en_2), caben_en_2: r3(h5a.caben_en_2), ruido_en_2: r3(h5a.ruido_en_2), por_limite: vara.map(redondear) },
    h5b: { ...h5b, ventaja_con_0: r3(ventaja0), ventaja_con_5: r3(ventaja5), ventaja_por_nivel: h5b.ventaja_por_nivel.map((n) => ({ ...n, ventaja: r3(n.ventaja) })) },
    h5c: JSON.parse(JSON.stringify(h5c, (k, v) => (typeof v === 'number' ? r3(v) : v))),
    variantes,
    celdas: celdas.map(redondear),
  };
  writeFileSync(SALIDA, JSON.stringify(salida, null, 1) + '\n');
  console.log(`\nGuardado en docs/etapa8-2-resultados.json (${celdas.length} combinaciones, ${((Date.now() - inicio) / 1000).toFixed(0)} s).`);
}

// ---------------------------------------------------------------------------
// 3. Tablas en Markdown (desde el JSON guardado), para docs/etapa8-2.md
// ---------------------------------------------------------------------------
function tablas() {
  const R = JSON.parse(readFileSync(SALIDA, 'utf8'));
  const de = (variante, porDia) => R.celdas.filter((c) => c.variante === variante && c.urgencias_por_dia === porDia);
  const ic = (c) => `${f1(c.terminadas_normales)} (${f1(c.terminadas_normales_ic[0])}–${f1(c.terminadas_normales_ic[1])})`;
  console.log('### Regla principal: con X urgencias al día (en el mejor límite)\n');
  console.log('| Urgencias al día | Mejor límite | Terminadas normales (IC 95 %) | Contando urgencias | Tiempo por tarea normal | p85 | Estrés al cerrar | Cigarros | Cafés | Minutos en urgencias | Urgencias que esperaron |');
  console.log('|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const n of R.regla_principal_por_nivel) { const c = n.en_el_mejor; console.log(`| ${n.urgencias_por_dia} | **${n.mejor_wip}** | ${ic(c)} | ${f1(c.terminadas_total)} | ${minutos(c.tiempo_normal_min)} | ${minutos(c.tiempo_normal_p85)} | ${f0(c.estres_cierre)} % | ${f1(c.colillas)} | ${f1(c.cafes)} | ${f0(c.minutos_urgencias)} | ${f1(c.urgencias_esperaron)} de ${n.urgencias_por_dia} |`); }
  for (const L of [0, 1, 2, 3, 5]) {
    console.log(`\n### Regla principal · ${L} urgencia${L === 1 ? '' : 's'} al día, límite por límite\n`);
    console.log('| Límite | Normales (IC 95 %) | Contando urg. | Tiempo normal | p85 | Tiempo por urgencia | Esperaron | Estrés al cerrar | Cigarros | Cafés | Min. urg. | Abiertas prom. |');
    console.log('|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    const mejor = R.regla_principal_por_nivel.find((n) => n.urgencias_por_dia === L).mejor_wip;
    for (const c of de('principal', L)) console.log(`| ${c.wip === mejor ? `**${c.wip}**` : c.wip} | ${ic(c)} | ${f1(c.terminadas_total)} | ${minutos(c.tiempo_normal_min)} | ${minutos(c.tiempo_normal_p85)} | ${minutos(c.tiempo_urgencia_min)} | ${f1(c.urgencias_esperaron)} | ${f0(c.estres_cierre)} % | ${f1(c.colillas)} | ${f1(c.cafes)} | ${f0(c.minutos_urgencias)} | ${f1(c.abiertas_promedio)} |`);
  }
  console.log('\n### H5a · la vara, límite por límite (0 contra 1 urgencia al día)\n');
  console.log('| Límite | Pérdida de normales | Caben en los minutos de urgencia | Ruido | Vara | ¿Pasa la vara? | De más (pérdida − caben) | Cigarros de más | Estrés al cerrar de más |');
  console.log('|---:|---:|---:|---:|---:|---|---:|---:|---:|');
  for (const v of R.h5a.por_limite) console.log(`| ${v.wip === 2 ? '**2**' : v.wip} | ${f1(v.perdida)} | ${f1(v.caben)} | ${f1(v.ruido)} | ${f1(v.vara)} | ${v.pasa_la_vara ? 'sí' : 'no'} | ${f1(v.de_mas)} | ${f1(v.colillas_de_mas)} | ${f1(v.estres_cierre_de_mas)} pts |`);
  console.log('\n### H5b · el mejor y sus vecinos\n');
  console.log('| Urgencias al día | Mejor | Vecinos | Ventaja (normales) | Se traslapa con | ¿Ya no se distinguen? |');
  console.log('|---:|---:|---|---:|---|---|');
  for (const n of R.h5b.ventaja_por_nivel) console.log(`| ${n.urgencias_por_dia} | ${n.mejor_wip} | ${n.vecinos.join(' y ')} | ${f1(n.ventaja)} | ${n.traslapa_con.length ? n.traslapa_con.join(' y ') : 'ninguno'} | ${n.se_traslapan ? 'sí' : 'no'} |`);
  for (const n of R.h5c.niveles) {
    console.log(`\n### H5c · ${n.urgencias_por_dia} al día, límite por límite (regla principal → variante C)\n`);
    console.log('| Límite | Normales | Tiempo normal | Estrés al cerrar | Tiempo por urgencia |');
    console.log('|---:|---|---|---|---|');
    for (const f of n.por_limite) console.log(`| ${f.wip === n.wip ? `**${f.wip}**` : f.wip} | ${f1(f.terminadas_normales.principal)} → ${f1(f.terminadas_normales.c)} | ${minutos(f.tiempo_normal.principal)} → ${minutos(f.tiempo_normal.c)} | ${f0(f.estres_cierre.principal)} % → ${f0(f.estres_cierre.c)} % | ${minutos(f.tiempo_urgencia.principal)} → ${minutos(f.tiempo_urgencia.c)} |`);
  }
  console.log('\n### Variantes · el mejor límite por nivel\n');
  console.log('| Variante | Urgencias al día | Mejor | Normales | Tiempo normal | Tiempo por urgencia | Esperaron | Estrés al cerrar | Cigarros | Sin terminar al cierre |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const [variante, v] of Object.entries(R.variantes)) for (const n of v.por_nivel) { const c = n.en_el_mejor; console.log(`| ${variante === 'principal' ? 'Principal' : variante} | ${n.urgencias_por_dia} | ${n.mejor_wip} | ${f1(c.terminadas_normales)} | ${minutos(c.tiempo_normal_min)} | ${minutos(c.tiempo_urgencia_min)} | ${f0(c.urgencias_esperaron_pct)} % | ${f0(c.estres_cierre)} % | ${f1(c.colillas)} | ${f1(c.urgencias_sin_terminar)} |`); }
  for (const variante of ['B', 'C', 'D']) {
    console.log(`\n### Variante ${variante} · por nivel y límite (normales · tiempo por urgencia · estrés al cerrar)\n`);
    console.log('| Límite | ' + [1, 2, 3, 5].map((L) => `${L} al día`).join(' | ') + ' |');
    console.log('|---:|' + [1, 2, 3, 5].map(() => '---').join('|') + '|');
    for (let wip = 1; wip <= 10; wip++) console.log(`| ${wip} | ` + [1, 2, 3, 5].map((L) => { const c = de(variante, L)[wip - 1]; return `${f1(c.terminadas_normales)} · ${minutos(c.tiempo_urgencia_min)} · ${f0(c.estres_cierre)} %`; }).join(' | ') + ' |');
  }
}

if (MODO === 'control') {
  const ctl = control();
  console.log(ctl.avisos.length ? 'CONTROL: NO calza con la corrida oficial:\n - ' + ctl.avisos.join('\n - ') : `Control: con 0 urgencias el script da exactamente la corrida oficial (${DIAS} días, límite por límite).`);
  if (ctl.avisos.length) process.exitCode = 1;
} else if (MODO === 'tablas') {
  tablas();
} else {
  await todo();
}
