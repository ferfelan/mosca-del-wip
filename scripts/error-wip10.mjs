// El error de WIP 10 (sección 7 del Informe completo), ahora reproducible.
// El 19 de octubre se midió con un script temporal de 300 días por caso que no
// quedó en el proyecto; este lo reemplaza (pedido de Felipe, 2026-10-20) con la
// semilla oficial 2024, reiniciada en cada caso como en simular-dias.
//
// Qué mide: un día que parte con WIP 10, contra días que parten con WIP 3, 2 o 1
// y pasan a 10 a las 09:05. Antes del arreglo del 19 de octubre el juego hacía
// exactamente eso: traía las "tareas de ayer" del WIP inicial y tomaba 7, 8 o 9
// tareas nuevas de golpe, que avanzaban parejas y terminaban al final del día.
// Desde el arreglo, cambiar el WIP antes de las 09:15 rearma el día con ese WIP
// (src/main.js), así que en el juego de hoy ese caso ya no ocurre.
// NO toca el juego: usa DayBrain tal cual, con setWip(10) a las 09:05.
//
// Uso: node scripts/error-wip10.mjs           (200 días por caso; guarda docs/error-wip10.json)
//      DIAS=300 node scripts/error-wip10.mjs
import { writeFileSync } from 'node:fs';
import { DayBrain } from '../src/brain.js';
import { sembrar, SEMILLA, PASO } from './medicion.mjs';

const DIAS = Number(process.env.DIAS ?? 200);
const MINUTO_CAMBIO = 9 * 60 + 5; // 09:05: dentro de los 15 minutos que cuentan como "elegir el WIP del día"
const MINUTO_1559 = 15 * 60 + 59;
const CASOS = [
  { caso: 'WIP 10 desde el inicio', inicial: 10, cambia: false },
  { caso: 'WIP 3, cambiado a 10', inicial: 3, cambia: true },
  { caso: 'WIP 2, cambiado a 10', inicial: 2, cambia: true },
  { caso: 'WIP 1, cambiado a 10', inicial: 1, cambia: true },
];

const filas = [];
for (const c of CASOS) {
  sembrar(SEMILLA);
  let suma = 0, suma1559 = 0, cero1559 = 0, ceroFin = 0;
  for (let d = 0; d < DIAS; d++) {
    const dia = new DayBrain(c.inicial);
    let a1559 = null;
    while (!dia.terminado) {
      if (c.cambia && dia.wip !== 10 && dia.minutoActual >= MINUTO_CAMBIO) dia.setWip(10);
      dia.tick(PASO);
      if (a1559 === null && dia.minutoActual >= MINUTO_1559) a1559 = dia.hechas.length;
    }
    const hechas = dia.hechas.length;
    suma += hechas;
    suma1559 += a1559;
    if (a1559 === 0) cero1559++;
    if (hechas === 0) ceroFin++;
  }
  filas.push({
    caso: c.caso,
    wip_inicial: c.inicial,
    terminadas: suma / DIAS,
    terminadas_a_las_1559: suma1559 / DIAS,
    dias_en_0_a_las_1559: cero1559 / DIAS,
    dias_en_0_al_cierre: ceroFin / DIAS,
  });
}

const f1 = (n) => n.toFixed(1).replace('.', ',');
const pct = (x) => `${Math.round(x * 100)} %`;
console.log(`\nEl error de WIP 10: ${DIAS} días por caso, semilla ${SEMILLA} (el cambio a 10 es a las 09:05)\n`);
console.log(' Cómo partió el día         Terminadas  A las 15:59  Días en 0 a las 15:59  Días en 0 al cierre');
for (const r of filas) {
  console.log(` ${r.caso.padEnd(26)} ${f1(r.terminadas).padStart(10)}  ${f1(r.terminadas_a_las_1559).padStart(11)}  ${pct(r.dias_en_0_a_las_1559).padStart(21)}  ${pct(r.dias_en_0_al_cierre).padStart(19)}`);
}
console.log('\n Lectura: con 7, 8 o 9 tareas nuevas de golpe y 10 abiertas, cada una avanza un turno de cada 10 al 50 %:');
console.log(' todas avanzan parejas y terminan casi juntas al final del día. Por eso a media tarde hay días en 0.');
writeFileSync(
  new URL('../docs/error-wip10.json', import.meta.url),
  JSON.stringify({ que: 'El error de WIP 10 (sección 7 del Informe completo): scripts/error-wip10.mjs, cambio a 10 a las 09:05', dias: DIAS, semilla: SEMILLA, paso: PASO, filas }, null, 1) + '\n',
);
console.log(`\nGuardado en docs/error-wip10.json`);
