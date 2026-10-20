// Juega muchos días completos por cada WIP (1 a 10) con las mismas reglas
// del juego (src/brain.js) y muestra los promedios. Revisa además:
//  - la FORMA: con bloqueos (≈20% de las tareas espera 30–60 min a otra
//    persona) las terminadas forman una U invertida: suben hasta el mejor WIP
//    y desde ahí bajan en cada escalón (Bertolotti y otros 2015). El script
//    dice dónde queda el mejor WIP; no se fuerza cuál es. El tiempo por tarea
//    sube en cada escalón; las colillas nunca bajan (y desde WIP 3 suben
//    siempre); WIP 1–3 no fuma y queda "Tranqui".
//  - la Ley de Little: WIP promedio ≈ terminadas por minuto × tiempo por tarea.
//  - bajar el WIP a mitad del día (10 → 2 a las 12:00): las tareas empezadas
//    drenan de a poco y el estrés pasa de Colapsada a Tranqui en 2 a 3,5
//    horas (con bloqueos, unas 3 h 10 min).
//  - la Eficiencia (de cada hora, cuántos minutos rinden de verdad): sale del
//    mismo cálculo del juego (los minutos que rinden = el avance que recibieron
//    las tareas en el día, diferencia < 0,5 %), es más alta en el mejor WIP y
//    baja en cada escalón desde ahí.
//
// Uso: node scripts/simular-dias.mjs            (200 días por WIP, semilla 2024:
//                                                 la CORRIDA OFICIAL, la misma de la
//                                                 4.1 y la 4.2 y de los dos informes;
//                                                 guarda docs/corrida-oficial.json)
//      SEMILLA=azar node scripts/simular-dias.mjs (otra semilla, elegida al azar y
//                                                 mostrada, para ver que la forma no
//                                                 depende de la semilla)
//      SEMILLA=7 DIAS=500 node scripts/simular-dias.mjs
// No necesita el navegador ni el servidor.
import { writeFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { DayBrain, nivelDeEstres } from '../src/brain.js';
import { sembrar } from './medicion.mjs'; // reemplaza Math.random por un azar con semilla (la misma fórmula de la 4.1 y la 4.2)

const DIAS = Number(process.env.DIAS ?? 200);
const PASO = Number(process.env.PASO ?? 0.15); // minutos simulados por cuadro: el juego a 60 cuadros/s y x1 (x4 = 0.6)
// Semilla del azar (Felipe, 2026-10-20: una sola corrida oficial y reproducible).
// 2024 es la de la Etapa 4; se reinicia en cada WIP (como jugarWip de la 4.1)
// y antes de la prueba de bajar el WIP (como bajarDe10a2 de la 4.2), así esta
// corrida da exactamente los mismos días que esas dos.
const SEMILLA = process.env.SEMILLA === 'azar' ? randomInt(1, 2 ** 31) : Number(process.env.SEMILLA ?? 2024);
const OFICIAL = SEMILLA === 2024 && DIAS === 200 && PASO === 0.15;

const filas = [];
for (let wip = 1; wip <= 10; wip++) {
  sembrar(SEMILLA);
  const t = { hechas: 0, medidas: 0, sumaTiempo: 0, minutos: 0, areaWip: 0, colillas: 0, cafes: 0, estres: 0, estresMax: 0, espera: 0, rinden: 0, avance: 0 };
  // Trabajo que les falta a todas las tareas (en curso y por hacer)
  const pendiente = (dia) => [...dia.enCurso, ...dia.porHacer].reduce((s, x) => s + Math.max(0, x.minutosRestantes), 0);
  for (let d = 0; d < DIAS; d++) {
    const dia = new DayBrain(wip);
    const alEmpezar = pendiente(dia);
    while (!dia.terminado) dia.tick(PASO);
    const m = dia.medidas();
    t.rinden += m.minutosRinden;
    t.avance += alEmpezar - pendiente(dia); // lo que avanzaron las tareas hoy
    t.hechas += m.hechas;
    t.medidas += m.tareasMedidas;
    t.sumaTiempo += m.sumaTiempoPorTarea;
    t.minutos += m.minutos;
    t.areaWip += m.wipPromedio * m.minutos;
    t.colillas += m.colillas;
    t.cafes += m.cafes;
    t.estres += m.estresPromedio;
    t.estresMax += dia.estresMax;
    t.espera += m.minutosEsperando;
  }
  const tiempoPorTarea = t.sumaTiempo / t.medidas;
  const porMinuto = t.hechas / t.minutos;
  const wipPromedio = t.areaWip / t.minutos;
  filas.push({
    wip,
    hechas: t.hechas / DIAS,
    tiempoPorTarea,
    colillas: t.colillas / DIAS,
    cafes: t.cafes / DIAS,
    estres: t.estres / DIAS,
    estresMax: t.estresMax / DIAS,
    espera: t.espera / DIAS,
    eficiencia: (t.rinden / t.minutos) * 60, // minutos de cada hora
    calce: (t.rinden - t.avance) / t.avance,
    wipPromedio,
    little: porMinuto * tiempoPorTarea,
  });
}

const f1 = (n) => n.toFixed(1).replace('.', ',');
const pad = (s, n) => String(s).padStart(n);
console.log(`\n${DIAS} días por cada WIP (promedio por día) · semilla ${SEMILLA}${OFICIAL ? ' (la corrida oficial)' : ''}\n`);
console.log(' WIP  Terminadas  Tiempo/tarea  Eficiencia**  Espera*  Colillas  Cafés  Estrés prom.  Nivel       │ Little: WIP prom.  terminadas/min × tiempo  diferencia');
for (const r of filas) {
  const dif = ((r.little - r.wipPromedio) / r.wipPromedio) * 100;
  console.log(
    `${pad(r.wip, 4)}  ${pad(f1(r.hechas), 10)}  ${pad(Math.round(r.tiempoPorTarea) + ' min', 12)}  ${pad(Math.round(r.eficiencia) + ' min/h', 12)}  ${pad(Math.round(r.espera) + ' min', 7)}  ${pad(f1(r.colillas), 8)}  ${pad(f1(r.cafes), 5)}  ${pad(Math.round(r.estres) + '%', 12)}  ${nivelDeEstres(r.estres).nombre.padEnd(10)}  │ ${pad(f1(r.wipPromedio), 17)}  ${pad(f1(r.little), 23)}  ${pad((dif >= 0 ? '+' : '') + f1(dif) + '%', 10)}`,
  );
}

console.log(' * Espera: minutos al día sin poder trabajar porque todas sus tareas en curso estaban bloqueadas.');
console.log(' ** Eficiencia: de cada hora, cuántos minutos rinden de verdad (descuenta cambios de tarea, fumar, café y esperas).');
const peorCalce = filas.reduce((a, b) => (Math.abs(b.calce) > Math.abs(a.calce) ? b : a));
console.log(`    Calza con el avance de las tareas en todos los WIP (la mayor diferencia: ${f1(Math.abs(peorCalce.calce) * 100)}%, WIP ${peorCalce.wip}).`);
const mejor = filas.reduce((a, b) => (b.hechas > a.hechas ? b : a));
console.log(`\n Mejor WIP: ${mejor.wip} (${f1(mejor.hechas)} terminadas al día). WIP 1: ${f1(filas[0].hechas)} · WIP 10: ${f1(filas[9].hechas)}.`);

// ---- Revisión de la forma ----
const problemas = [];
for (let i = 1; i < filas.length; i++) {
  const a = filas[i - 1];
  const b = filas[i];
  // U invertida: antes del mejor WIP las terminadas suben; desde ahí, bajan
  if (b.wip <= mejor.wip && !(b.hechas > a.hechas)) problemas.push(`WIP ${a.wip}→${b.wip}: las terminadas no suben antes del mejor WIP (${f1(a.hechas)} → ${f1(b.hechas)})`);
  if (b.wip > mejor.wip && !(b.hechas < a.hechas)) problemas.push(`WIP ${a.wip}→${b.wip}: las terminadas no bajan (${f1(a.hechas)} → ${f1(b.hechas)})`);
  if (!(b.tiempoPorTarea > a.tiempoPorTarea)) problemas.push(`WIP ${a.wip}→${b.wip}: el tiempo por tarea no sube`);
  if (b.colillas < a.colillas) problemas.push(`WIP ${a.wip}→${b.wip}: las colillas bajan`);
  if (a.wip >= 3 && !(b.colillas > a.colillas)) problemas.push(`WIP ${a.wip}→${b.wip}: las colillas no suben`);
  if (!(b.estres > a.estres)) problemas.push(`WIP ${a.wip}→${b.wip}: el estrés promedio no sube`);
}
// Eficiencia: sale del mismo cálculo del juego y sigue la misma U invertida
const mejorEficiencia = filas.reduce((a, b) => (b.eficiencia > a.eficiencia ? b : a));
if (mejorEficiencia.wip !== mejor.wip) problemas.push(`la eficiencia es más alta con WIP ${mejorEficiencia.wip}, no con el mejor WIP (${mejor.wip})`);
for (let i = mejor.wip; i < filas.length; i++) {
  if (!(filas[i].eficiencia < filas[i - 1].eficiencia)) problemas.push(`WIP ${filas[i - 1].wip}→${filas[i].wip}: la eficiencia no baja`);
}
for (const r of filas) if (Math.abs(r.calce) > 0.005) problemas.push(`WIP ${r.wip}: la eficiencia no calza con el avance de las tareas (${f1(r.calce * 100)}%)`);
for (const r of filas.slice(0, 3)) {
  if (r.colillas > 0) problemas.push(`WIP ${r.wip} fuma (${f1(r.colillas)} colillas)`);
  if (nivelDeEstres(r.estres).nombre !== 'Tranqui') problemas.push(`WIP ${r.wip} no queda Tranqui`);
}
const esperado = { 4: 'Ocupada', 5: 'Ocupada', 6: 'Estresada', 7: 'Estresada', 8: 'Colapsada', 9: 'Colapsada', 10: 'Colapsada' };
// el estrés parte en 10% cada mañana: se compara el máximo del día con el nivel esperado
for (const r of filas.slice(3)) {
  const nivel = nivelDeEstres(r.estresMax).nombre;
  if (nivel !== esperado[r.wip]) problemas.push(`WIP ${r.wip} llega a ${nivel} (se esperaba ${esperado[r.wip]})`);
}
for (const r of filas.slice(7)) if (r.cafes > 0) problemas.push(`WIP ${r.wip} toma café (${f1(r.cafes)})`);
for (const r of filas.slice(3, 5)) if (r.cafes <= 0) problemas.push(`WIP ${r.wip} nunca toma café`);
for (const r of filas) {
  const dif = Math.abs(r.little - r.wipPromedio) / r.wipPromedio;
  if (dif > 0.05) problemas.push(`WIP ${r.wip}: la Ley de Little se aleja ${f1(dif * 100)}%`);
}

// ---- Prueba: WIP 10 desde las 09:00 y a las 12:00 baja a 2 ----
// Lo empezado no desaparece: drena de a poco, y el estrés baja más lento de
// lo que subió (pero llega a Tranqui dentro del día).
const MARCAS = [9, 10, 11, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 17, 18].map((h) => h * 60);
const suma = MARCAS.map(() => ({ abiertas: 0, estres: 0, colillas: 0, cafes: 0 }));
// La curva cada 15 minutos (tareas en curso y estrés) para los gráficos de los informes
const MARCAS_CURVA = Array.from({ length: 37 }, (_, i) => 540 + 15 * i);
const curva = MARCAS_CURVA.map(() => ({ abiertas: 0, estres: 0 }));
const t = { drena: 0, saleColapsada: 0, tranqui: 0, cafeAntesTranqui: 0, subeAlto: false };
sembrar(SEMILLA);
for (let d = 0; d < DIAS; d++) {
  const dia = new DayBrain(10);
  let k = 0;
  let kc = 0;
  let drena = null;
  let sale = null;
  let tranqui = null;
  let primerCafe = null;
  let cafes12 = null;
  let maxAbiertasTras12 = 10;
  const anotar = () => {
    while (k < MARCAS.length && dia.minutoActual >= MARCAS[k] - 1e-9) {
      Object.assign(suma[k], {
        abiertas: suma[k].abiertas + dia.enCurso.length,
        estres: suma[k].estres + dia.estres,
        colillas: suma[k].colillas + dia.colillas,
        cafes: suma[k].cafes + dia.cafes,
      });
      k++;
    }
    while (kc < MARCAS_CURVA.length && dia.minutoActual >= MARCAS_CURVA[kc] - 1e-9) {
      curva[kc].abiertas += dia.enCurso.length;
      curva[kc].estres += dia.estres;
      kc++;
    }
  };
  anotar();
  while (!dia.terminado) {
    if (dia.minutoActual >= 720 && dia.wip === 10) {
      dia.setWip(2);
      cafes12 = dia.cafes;
    }
    dia.tick(PASO);
    anotar();
    if (dia.wip !== 2) continue;
    maxAbiertasTras12 = Math.max(maxAbiertasTras12, dia.enCurso.length);
    if (drena === null && dia.enCurso.length <= 2) drena = dia.minutoActual;
    if (sale === null && dia.estres < 75) sale = dia.minutoActual;
    if (tranqui === null && dia.estres < 25) tranqui = dia.minutoActual;
    if (primerCafe === null && dia.cafes > cafes12) primerCafe = dia.minutoActual;
  }
  if (maxAbiertasTras12 > 10) t.subeAlto = true;
  t.drena += drena ?? 1080;
  t.saleColapsada += sale ?? 1080;
  t.tranqui += tranqui ?? 1080;
  if (primerCafe !== null && tranqui !== null && primerCafe < tranqui) t.cafeAntesTranqui++;
}
const hora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
console.log(`\nPrueba: WIP 10 desde las 09:00 y a las 12:00 baja a 2 (promedio de ${DIAS} días)\n`);
console.log(' Hora   En curso  Estrés  Nivel       Colillas  Cafés');
MARCAS.forEach((m, i) => {
  const r = suma[i];
  const e = r.estres / DIAS;
  console.log(` ${hora(m)}  ${pad(f1(r.abiertas / DIAS), 8)}  ${pad(Math.round(e) + '%', 6)}  ${nivelDeEstres(e).nombre.padEnd(10)}  ${pad(f1(r.colillas / DIAS), 8)}  ${pad(f1(r.cafes / DIAS), 5)}`);
});
const mDrena = t.drena / DIAS;
const mSale = t.saleColapsada / DIAS;
const mTranqui = t.tranqui / DIAS;
console.log(`\n Vuelve a 2 tareas en curso: ~${hora(mDrena)} · deja "Colapsada": ~${hora(mSale)} · llega a "Tranqui": ~${hora(mTranqui)} (${f1((mTranqui - 720) / 60)} h después de bajar el WIP)`);
console.log(` Días con un café antes de quedar Tranqui (la pausa ayuda a recuperarse): ${Math.round((t.cafeAntesTranqui / DIAS) * 100)}%`);
const est1230 = suma[MARCAS.indexOf(750)].estres / DIAS;
if (t.subeAlto) problemas.push('al bajar el WIP aparecieron tareas nuevas en curso');
if (est1230 < 75) problemas.push(`a las 12:30 ya no está Colapsada (${Math.round(est1230)}%): se calma demasiado rápido`);
if (mTranqui - 720 < 120 || mTranqui - 720 > 210) problemas.push(`llega a Tranqui ${f1((mTranqui - 720) / 60)} h después (se busca 2 a 3,5 h)`);
if (suma[MARCAS.length - 1].abiertas / DIAS > 2.05) problemas.push('a las 18:00 todavía no vuelve al límite de 2');

console.log('');
if (problemas.length) {
  console.log('PROBLEMAS:');
  problemas.forEach((p) => console.log(' - ' + p));
  process.exitCode = 1;
} else {
  console.log(`Forma: todo bien (U invertida: el mejor WIP es ${mejor.wip}; desde ahí cada tarea extra suma costo).`);
  console.log('Ley de Little: se cumple en todos los WIP (diferencia < 5%).');
  console.log(`Eficiencia: sale del mismo cálculo del juego y es más alta en el mejor WIP (${Math.round(mejorEficiencia.eficiencia)} min de cada hora con WIP ${mejorEficiencia.wip}).`);
  console.log('Bajar el WIP: lo empezado drena de a poco y el estrés baja más lento de lo que sube (2 a 3,5 h).');
}

// ---- La corrida oficial queda guardada (sólo con la semilla 2024, 200 días y el paso de siempre) ----
if (OFICIAL) {
  const r3 = (x) => Number(x.toFixed(3));
  const salida = {
    que: 'Corrida oficial de scripts/simular-dias.mjs: la misma de la 4.1 y la 4.2 y la que usan los dos informes. Se repite igual con: node scripts/simular-dias.mjs',
    semilla: SEMILLA,
    dias: DIAS,
    paso: PASO,
    forma: problemas.length ? problemas : 'todo bien',
    filas: filas.map((r) => ({
      wip: r.wip,
      terminadas: r3(r.hechas),
      tiempo_por_tarea_min: r3(r.tiempoPorTarea),
      eficiencia_min_por_hora: r3(r.eficiencia),
      espera_min: r3(r.espera),
      colillas: r3(r.colillas),
      cafes: r3(r.cafes),
      estres_promedio: r3(r.estres),
      estres_maximo: r3(r.estresMax),
      nivel: nivelDeEstres(r.estres).nombre,
      wip_promedio: r3(r.wipPromedio),
      little: r3(r.little),
    })),
    bajar_de_10_a_2: {
      vuelve_a_2: hora(mDrena),
      deja_colapsada: hora(mSale),
      tranqui: hora(mTranqui),
      minutos_hasta_volver_a_2: r3(mDrena - 720),
      minutos_hasta_tranqui: r3(mTranqui - 720),
      dias_con_cafe_antes_de_tranqui: r3(t.cafeAntesTranqui / DIAS),
      curva_cada_15_min: {
        min: MARCAS_CURVA,
        enCurso: curva.map((c) => Number((c.abiertas / DIAS).toFixed(2))),
        estres: curva.map((c) => Number((c.estres / DIAS).toFixed(1))),
      },
    },
  };
  writeFileSync(new URL('../docs/corrida-oficial.json', import.meta.url), JSON.stringify(salida, null, 1) + '\n');
  console.log('\nGuardado en docs/corrida-oficial.json (la corrida oficial: semilla 2024, 200 días por WIP, paso 0,15).');
}
