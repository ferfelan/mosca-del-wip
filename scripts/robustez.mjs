// Etapa 4.2 · Robustez (H2 y H3). Reglas y criterios fijados antes de correr
// en docs/etapa4-2-reglas.md (commit c293155); aquí no se decide nada.
//
// NO toca el juego: cada escenario es una copia temporal de src/brain.js con
// sólo las líneas de su supuesto cambiadas (como scripts/opciones-3-3.mjs).
// Las medidas salen de la misma observación de la 4.1 (scripts/medicion.mjs):
// 200 días por WIP y escenario, semilla fija reiniciada en cada uno.
//
// Uso: node scripts/robustez.mjs controles   → sólo los controles (se miran primero)
//      node scripts/robustez.mjs             → todo (si los controles no dan, para)
//      (guarda docs/etapa4-2-resultados.json)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DayBrain as DayBrainDelJuego } from '../src/brain.js';
import { jugarWip, revisar, sembrar, SEMILLA, PASO } from './medicion.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const BRAIN = readFileSync(join(RAIZ, 'src/brain.js'), 'utf8');
const DIAS = Number(process.env.DIAS ?? 200);
const SOLO_CONTROLES = process.argv[2] === 'controles';

// ===========================================================================
// ESCENARIOS (docs/etapa4-2-reglas.md)
// ===========================================================================
const COSTOS = {
  ninguno: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  suave: [1, 0.85, 0.78, 0.72, 0.67, 0.62, 0.58, 0.55, 0.52, 0.5], // el de hoy
  weinberg: [1, 0.8, 0.6, 0.4, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25], // Weinberg completo
};
const HOY = { bloqueo: 0.2, duracion: [30, 60], costo: 'suave', tamano: [15, 35], residuo: 0.03 };
const LINEAS = {
  bloqueo: (v) => [['PROBABILIDAD_BLOQUEO', v]],
  duracion: ([a, b]) => [['BLOQUEO_MIN', a], ['BLOQUEO_MAX', b]],
  costo: (c) => [['RENDIMIENTO_POR_WIP', `[${COSTOS[c].join(', ')}]`]],
  tamano: ([a, b]) => [['DURACION_TAREA_MIN', a], ['DURACION_TAREA_MAX', b]],
  residuo: (v) => [['RESIDUO_POR_TAREA_ESPERANDO', v]],
};
const GRUPOS = {
  bloqueos: [0, 0.1, 0.2, 0.3, 0.4].map((bloqueo) => ({ bloqueo })),
  duracion: [[15, 30], [30, 60], [60, 120]].map((duracion) => ({ duracion })),
  costo: ['ninguno', 'suave', 'weinberg'].map((costo) => ({ costo })),
  tamano: [[15, 35], [5, 45]].map((tamano) => ({ tamano })),
  residuo: [0, 0.03, 0.06].map((residuo) => ({ residuo })),
  cruce: [0, 0.1, 0.2, 0.3, 0.4].flatMap((bloqueo) => ['ninguno', 'suave', 'weinberg'].map((costo) => ({ bloqueo, costo }))),
};
const NOMBRE_COSTO = { ninguno: 'sin costo de cambio', suave: 'costo suave', weinberg: 'Weinberg completo' };
// ===========================================================================

const pct0 = (v) => `${Math.round(v * 100)} %`;
function nombre(sup) {
  const partes = [];
  if (sup.bloqueo !== HOY.bloqueo) partes.push(`bloqueos ${pct0(sup.bloqueo)}`);
  if (sup.duracion.join() !== HOY.duracion.join()) partes.push(`bloqueos de ${sup.duracion.join('–')} min`);
  if (sup.costo !== HOY.costo) partes.push(NOMBRE_COSTO[sup.costo]);
  if (sup.tamano.join() !== HOY.tamano.join()) partes.push(`tareas de ${sup.tamano.join('–')} min`);
  if (sup.residuo !== HOY.residuo) partes.push(`residuo ${pct0(sup.residuo)}`);
  return partes.length ? partes.join(' · ') : 'juego de hoy';
}

// La copia de src/brain.js con las líneas de ese supuesto cambiadas
function copiaDeBrain(sup) {
  let texto = BRAIN;
  for (const [clave, valor] of Object.entries(sup)) {
    for (const [constante, v] of LINEAS[clave](valor)) {
      const re = new RegExp(`^((?:export )?const ${constante} = )[^;]+;`, 'gm');
      const veces = (texto.match(re) || []).length;
      if (veces !== 1) throw new Error(`${constante} aparece ${veces} veces en src/brain.js: revisar el script`);
      texto = texto.replace(re, `$1${v};`);
    }
  }
  return texto;
}
// Control: la copia de "hoy" es letra por letra el juego (así los valores de
// HOY y COSTOS.suave son los que de verdad tiene src/brain.js)
if (copiaDeBrain(HOY) !== BRAIN) throw new Error('Los valores de HOY no son los de src/brain.js: revisar el script');

// Escenarios distintos (cada combinación una sola vez) y en qué grupos aparecen
const escenarios = new Map();
for (const [grupo, lista] of Object.entries(GRUPOS)) {
  for (const cambio of lista) {
    const sup = { ...HOY, ...cambio };
    const clave = JSON.stringify(sup);
    if (!escenarios.has(clave)) escenarios.set(clave, { nombre: nombre(sup), sup, grupos: [] });
    escenarios.get(clave).grupos.push(grupo);
  }
}
const CLAVE = (cambio) => JSON.stringify({ ...HOY, ...cambio });
const K_HOY = CLAVE({});
const K_SIN_BLOQUEOS = CLAVE({ bloqueo: 0 });
const K_SIN_COSTO = CLAVE({ costo: 'ninguno' });

const base = mkdtempSync(join(tmpdir(), 'mosca-robustez-'));
let n = 0;
async function cargar(sup) {
  const archivo = join(base, `escenario-${++n}.mjs`);
  writeFileSync(archivo, copiaDeBrain(sup));
  return (await import(pathToFileURL(archivo).href)).DayBrain;
}

function resumen(filas) {
  const max = Math.max(...filas.map((f) => f.terminadas));
  const mejor = filas.find((f) => f.terminadas === max); // empate: el más bajo
  const zona = filas.filter((f) => f.terminadas > 0.95 * max).map((f) => f.wip);
  let con99 = null;
  for (let w = 10; w >= 1 && filas[w - 1].con_que_hacer >= 99; w--) con99 = w;
  const littleSube = filas.every((f, i) => i === 0 || f.tiempo_por_tarea_min > filas[i - 1].tiempo_por_tarea_min);
  const caida = (max - filas[9].terminadas) / max;
  return { mejor_wip: mejor.wip, zona_buena: zona, con_que_hacer_99_desde: con99, tiempo_sube_con_wip: littleSube, caida_mejor_a_10: caida, en_el_mejor: mejor };
}

async function correr(e) {
  const DayBrain = await cargar(e.sup);
  const filas = [];
  const avisos = [];
  for (let wip = 1; wip <= 10; wip++) {
    const t = jugarWip(DayBrain, wip, { dias: DIAS });
    avisos.push(...revisar(t, wip));
    const pct = (x) => (100 * x) / t.minutos;
    filas.push({
      wip,
      terminadas: t.hechas / DIAS,
      tiempo_por_tarea_min: t.sumaEnCurso / t.tareas,
      eficiencia_flujo: (100 * t.sumaTurnos) / t.sumaEnCurso,
      estres: t.estres / DIAS,
      colillas: t.colillas / DIAS,
      con_que_hacer: pct(t.conQueHacer),
      trabajando: pct(t.trabajando),
      fumando: pct(t.fumando),
      esperando_bloqueos: pct(t.esperando),
      minutos_rinden_por_hora: (60 * t.rinden) / t.minutos,
      hechas_total: t.hechas,
    });
  }
  Object.assign(e, { filas, avisos, ...resumen(filas) });
  return e;
}

// H3: WIP 10 desde las 09:00 y a las 12:00 baja a 2 (igual que simular-dias)
async function bajarDe10a2(e) {
  const DayBrain = await cargar(e.sup);
  sembrar(SEMILLA);
  let suma = 0, sumaDrena = 0, minimo = Infinity, masDeUnaHora = 0;
  for (let d = 0; d < DIAS; d++) {
    const dia = new DayBrain(10);
    let tranqui = null, drena = null;
    while (!dia.terminado) {
      if (dia.minutoActual >= 720 && dia.wip === 10) dia.setWip(2);
      dia.tick(PASO);
      if (dia.wip !== 2) continue;
      if (drena === null && dia.enCurso.length <= 2) drena = dia.minutoActual;
      if (tranqui === null && dia.estres < 25) tranqui = dia.minutoActual;
    }
    const minutos = (tranqui ?? 1080) - 720;
    suma += minutos;
    sumaDrena += (drena ?? 1080) - 720;
    minimo = Math.min(minimo, minutos);
    if (minutos > 60) masDeUnaHora++;
  }
  return { escenario: e.nombre, minutos_hasta_tranqui: suma / DIAS, dia_mas_rapido_min: minimo, dias_mas_de_1_hora: masDeUnaHora / DIAS, minutos_hasta_volver_a_2: sumaDrena / DIAS };
}

// ---------- Salida ----------
const f1 = (x) => x.toFixed(1).replace('.', ',');
const hhmm = (m) => { const r = Math.round(m); return `${Math.floor(r / 60)} h ${String(r % 60).padStart(2, '0')} min`; };
const linea = (e) => {
  const m = e.en_el_mejor;
  return ` ${e.nombre.padEnd(46)} mejor ${String(e.mejor_wip).padStart(2)}  zona ${e.zona_buena.join(',').padEnd(9)} ${f1(m.terminadas).padStart(5)} term.  ${String(Math.round(m.tiempo_por_tarea_min)).padStart(4)} min/tarea  flujo ${f1(m.eficiencia_flujo).padStart(5)} %  estrés ${String(Math.round(m.estres)).padStart(3)} %  colillas ${f1(m.colillas).padStart(4)}  │ con qué 99 % desde ${e.con_que_hacer_99_desde ?? 'no llega'}  │ caída a WIP 10 ${Math.round(e.caida_mejor_a_10 * 100)} %${e.tiempo_sube_con_wip ? '' : '  ⚠ tiempo/tarea no sube siempre'}`;
};

// ---------- 1. Controles (primero) ----------
const avisos = [];
const hoy = await correr(escenarios.get(K_HOY));
const sinBloqueos = await correr(escenarios.get(K_SIN_BLOQUEOS));
const sinCosto = await correr(escenarios.get(K_SIN_COSTO));
// Técnico: la copia "hoy" da exactamente lo mismo que el juego de verdad
for (let wip = 1; wip <= 10; wip++) {
  const real = jugarWip(DayBrainDelJuego, wip, { dias: DIAS }).hechas;
  if (real !== hoy.filas[wip - 1].hechas_total) avisos.push(`WIP ${wip}: la copia "hoy" no da lo mismo que el juego (${hoy.filas[wip - 1].hechas_total} vs ${real})`);
}
for (const e of [hoy, sinBloqueos, sinCosto]) avisos.push(...e.avisos.map((a) => `${e.nombre}: ${a}`));
const control1 = sinBloqueos.mejor_wip === 1;
const control2 = sinCosto.caida_mejor_a_10 <= hoy.caida_mejor_a_10 / 2;
console.log(`\nControles (${DIAS} días por WIP, semilla ${SEMILLA})`);
[hoy, sinBloqueos, sinCosto].forEach((e) => console.log(linea(e)));
console.log(`\n 1. Sin bloqueos, el mejor debería ser 1: mejor = ${sinBloqueos.mejor_wip} → ${control1 ? 'SÍ' : 'NO'}`);
console.log(`    (terminadas WIP 1–4: ${sinBloqueos.filas.slice(0, 4).map((f) => f1(f.terminadas)).join(' · ')})`);
console.log(` 2. Sin costo de cambio, la caída (mejor → WIP 10) debería ser a lo más la mitad de la de hoy: ${Math.round(sinCosto.caida_mejor_a_10 * 100)} % contra ${Math.round(hoy.caida_mejor_a_10 * 100)} % (mitad = ${f1(hoy.caida_mejor_a_10 * 50)} %) → ${control2 ? 'SÍ' : 'NO'}`);
const s10 = sinCosto.filas[9], s1 = sinCosto.en_el_mejor;
console.log(`    De dónde sale lo que baja sin costo de cambio (mejor WIP ${s1.wip} → WIP 10): trabajando ${f1(s1.trabajando)} → ${f1(s10.trabajando)} %, fumando ${f1(s1.fumando)} → ${f1(s10.fumando)} %, esperando por bloqueos ${f1(s1.esperando_bloqueos)} → ${f1(s10.esperando_bloqueos)} %, minutos que rinden por hora ${f1(s1.minutos_rinden_por_hora)} → ${f1(s10.minutos_rinden_por_hora)}`);
console.log(` 3. Técnico: ${avisos.length ? 'PROBLEMAS:\n - ' + avisos.join('\n - ') : 'la copia "hoy" da lo mismo que el juego y la observación calza.'}`);
const controlesBien = control1 && control2 && !avisos.length;

const resultado = { dias: DIAS, semilla: SEMILLA, paso: PASO, controles: { sin_bloqueos_mejor_1: control1, sin_costo_cae_a_lo_mas_la_mitad: control2, tecnico: avisos } };
if (SOLO_CONTROLES || !controlesBien) {
  console.log(controlesBien ? '\nControles: todo bien. Se puede correr el resto.' : '\nCONTROLES: NO DAN LO ESPERADO. Se para aquí y se avisa a Felipe antes de seguir.');
  if (!controlesBien) process.exitCode = 1;
  process.exit();
}

// ---------- 2. Todos los escenarios ----------
const todos = [];
for (const e of escenarios.values()) todos.push(e.filas ? e : await correr(e));
for (const e of todos) avisos.push(...e.avisos.map((a) => `${e.nombre}: ${a}`));
console.log(`\nLos ${todos.length} escenarios distintos (en el mejor WIP):`);
todos.forEach((e) => console.log(linea(e)));

// ---------- 3. H2 ----------
const conBloqueos = todos.filter((e) => e.sup.bloqueo > 0);
const enRango = conBloqueos.filter((e) => e.mejor_wip >= 2 && e.mejor_wip <= 4);
const porcentaje = (100 * enRango.length) / conBloqueos.length;
const h2 = porcentaje >= 80;
// Como información: contando como aparecen en las listas del plan (con repetidos)
const listados = Object.values(GRUPOS).flatMap((lista) => lista.map((c) => escenarios.get(CLAVE(c)))).filter((e) => e.sup.bloqueo > 0);
const listadosEnRango = listados.filter((e) => e.mejor_wip >= 2 && e.mejor_wip <= 4).length;
const todosSuben = todos.every((e) => e.tiempo_sube_con_wip);
console.log(`\nH2: escenarios con bloqueos con el mejor WIP entre 2 y 4: ${enRango.length} de ${conBloqueos.length} (${f1(porcentaje)} %) → ${h2 ? 'SE CUMPLE' : 'NO SE CUMPLE'}`);
const fuera = conBloqueos.filter((e) => !(e.mejor_wip >= 2 && e.mejor_wip <= 4));
if (fuera.length) console.log(`    Fuera de 2–4: ${fuera.map((e) => `${e.nombre} (mejor ${e.mejor_wip})`).join(' · ')}`);
console.log(`    (como aparecen en las listas del plan, con repetidos: ${listadosEnRango} de ${listados.length})`);
console.log(`    Tiempo por tarea sube con el WIP en todos los escenarios: ${todosSuben ? 'SÍ' : 'NO (' + todos.filter((e) => !e.tiempo_sube_con_wip).map((e) => e.nombre).join(', ') + ')'}`);
console.log('\n Con X % de bloqueos, el mejor límite es Y (zona buena entre paréntesis):');
console.log('   Bloqueos   Costo de hoy (suave)   Sin costo de cambio   Weinberg completo   │ Con qué hacer 99 % desde (costo de hoy)');
const tabla = [];
for (const bloqueo of [0, 0.1, 0.2, 0.3, 0.4]) {
  const celdas = ['suave', 'ninguno', 'weinberg'].map((costo) => escenarios.get(CLAVE({ bloqueo, costo })));
  tabla.push({ bloqueo, ...Object.fromEntries(['suave', 'ninguno', 'weinberg'].map((c, i) => [c, { mejor: celdas[i].mejor_wip, zona: celdas[i].zona_buena }])), con99: celdas[0].con_que_hacer_99_desde });
  console.log(`   ${pct0(bloqueo).padStart(8)}   ${celdas.map((e) => `${e.mejor_wip} (${e.zona_buena.join(',')})`.padEnd(20)).join('   ')}│ ${celdas[0].con_que_hacer_99_desde ?? 'no llega'}`);
}

// ---------- 4. H3 ----------
const extremos = [K_HOY, K_SIN_BLOQUEOS, CLAVE({ bloqueo: 0.4 }), K_SIN_COSTO, CLAVE({ costo: 'weinberg' })].map((k) => escenarios.get(k));
const h3filas = [];
for (const e of extremos) h3filas.push(await bajarDe10a2(e));
const h3 = h3filas.every((r) => r.minutos_hasta_tranqui > 60);
console.log('\nH3: WIP 10 y a las 12:00 baja a 2 (promedio de días)');
for (const r of h3filas) console.log(`   ${r.escenario.padEnd(24)} queda Tranqui ${hhmm(r.minutos_hasta_tranqui)} después (día más rápido ${hhmm(r.dia_mas_rapido_min)}; ${Math.round(r.dias_mas_de_1_hora * 100)} % de los días > 1 h) · vuelve a 2 en curso ${hhmm(r.minutos_hasta_volver_a_2)} después`);
console.log(`   → ${h3 ? 'SE CUMPLE' : 'NO SE CUMPLE'} (más de 1 hora en los 5)`);
console.log(avisos.length ? '\nAVISOS:\n - ' + avisos.join('\n - ') : '\nControles técnicos: todo bien en los 20 escenarios.');
if (avisos.length) process.exitCode = 1;

Object.assign(resultado, {
  escenarios: todos.map(({ nombre, sup, grupos, filas, mejor_wip, zona_buena, con_que_hacer_99_desde, tiempo_sube_con_wip, caida_mejor_a_10 }) => ({ nombre, supuestos: sup, grupos, mejor_wip, zona_buena, con_que_hacer_99_desde, tiempo_sube_con_wip, caida_mejor_a_10, filas })),
  h2: { con_bloqueos: conBloqueos.length, mejor_entre_2_y_4: enRango.length, porcentaje, se_cumple: h2, listados_con_repetidos: { total: listados.length, en_rango: listadosEnRango }, tiempo_sube_en_todos: todosSuben, tabla_bloqueos: tabla },
  h3: { filas: h3filas, se_cumple: h3 },
  avisos,
});
writeFileSync(join(RAIZ, 'docs/etapa4-2-resultados.json'), JSON.stringify(resultado, null, 1) + '\n');
console.log('\nGuardado en docs/etapa4-2-resultados.json');
