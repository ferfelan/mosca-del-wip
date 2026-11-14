// Los tiempos del tablero del inicio de la portada (src/jornada.js, Etapa
// 8.13) salen de MIRAR la corrida oficial del juego: 200 días con 2 tareas a
// la vez y 200 con 9, semilla 2024, la misma de docs/corrida-oficial.json. Este
// archivo los mide de nuevo y avisa si el dibujo dejó de calzar con el juego.
// No cambia ninguna regla ni toca src/brain.js: solo juega los días y anota.
//
// Qué mide, por cada caso:
//   - "caen": el minuto del día (desde las 09:00) en que, en promedio, ya cayó
//     en "Hecho" la tarea 1, la 2, la 3… Es el primer minuto en que el promedio
//     de terminadas llega a k − 0,5.
//   - "fuma": el minuto del primer cigarro, con la misma cuenta (con 2 a la
//     vez no fuma, y queda en null).
//   - "porTarea": los minutos que tarda cada tarea, redondeados, tal como
//     están en docs/corrida-oficial.json.
//
// Uso: node scripts/medir-jornada.mjs
// Dice "igual" si src/jornada.js tiene esos mismos números, o muestra qué
// cambió (y termina con error). Si la corrida oficial cambia algún día, se
// copian los números nuevos a DIAS en src/jornada.js.
import { readFileSync } from 'node:fs';
import { sembrar, SEMILLA, PASO } from './medicion.mjs';
import { DayBrain } from '../src/brain.js';
import { DIAS, MINUTOS_DIA } from '../src/jornada.js';

const CUANTOS_DIAS = 200;
const INICIO = 9 * 60;
const oficial = JSON.parse(readFileSync(new URL('../docs/corrida-oficial.json', import.meta.url), 'utf8'));
const hora = (m) => `${String(9 + Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;

function medir(wip) {
  sembrar(SEMILLA);
  // por cada minuto del día (0 a 540), la suma de terminadas y de cigarros
  const hechas = new Float64Array(MINUTOS_DIA + 1);
  const colillas = new Float64Array(MINUTOS_DIA + 1);
  let totalHechas = 0;
  let totalColillas = 0;
  for (let d = 0; d < CUANTOS_DIAS; d++) {
    const dia = new DayBrain(wip);
    let proximo = 0; // el próximo minuto por anotar
    while (!dia.terminado) {
      dia.tick(PASO);
      const m = dia.minutoActual - INICIO;
      while (proximo <= MINUTOS_DIA && proximo <= m + 1e-9) {
        hechas[proximo] += dia.hechas.length;
        colillas[proximo] += dia.colillas;
        proximo++;
      }
    }
    while (proximo <= MINUTOS_DIA) {
      hechas[proximo] += dia.hechas.length;
      colillas[proximo] += dia.colillas;
      proximo++;
    }
    totalHechas += dia.hechas.length;
    totalColillas += dia.colillas;
  }
  // El primer minuto en que el promedio llega a k − 0,5
  const cruces = (suma, total) => {
    const minutos = [];
    for (let k = 1; k <= Math.round(total / CUANTOS_DIAS); k++) {
      minutos.push(suma.findIndex((x) => x / CUANTOS_DIAS >= k - 0.5));
    }
    return minutos;
  };
  const fila = oficial.filas.find((f) => f.wip === wip);
  const cigarros = cruces(colillas, totalColillas);
  return {
    enCurso: wip,
    porTarea: Math.round(fila.tiempo_por_tarea_min),
    fuma: cigarros.length ? cigarros[0] : null,
    caen: cruces(hechas, totalHechas),
    terminadas: totalHechas / CUANTOS_DIAS,
    oficial: fila.terminadas,
  };
}

let distintos = 0;
for (const [caso, wip] of [['muchas', 9], ['pocas', 2]]) {
  const medido = medir(wip);
  const dibujo = DIAS[caso];
  console.log(`\n${wip} tareas a la vez (en el dibujo, "${caso}")`);
  console.log(`  terminadas al cerrar, en promedio: ${medido.terminadas.toFixed(2)} (la corrida oficial dice ${medido.oficial})`);
  console.log(`  cada tarea cae en Hecho a las: ${medido.caen.map(hora).join(' ')}`);
  console.log(`  primer cigarro: ${medido.fuma === null ? 'no fuma' : hora(medido.fuma)}`);
  for (const clave of ['enCurso', 'porTarea', 'fuma', 'caen']) {
    const igual = JSON.stringify(medido[clave]) === JSON.stringify(dibujo[clave]);
    if (!igual) {
      distintos++;
      console.log(`  DISTINTO en "${clave}". El juego dice ${JSON.stringify(medido[clave])} y src/jornada.js tiene ${JSON.stringify(dibujo[clave])}`);
    }
  }
  if (Math.abs(medido.terminadas - medido.oficial) > 0.011) {
    distintos++;
    console.log('  DISTINTO. Esta medición no repite la corrida oficial');
  }
}
console.log(distintos ? `\n${distintos} cosas distintas: el dibujo del inicio ya no calza con el juego` : '\nigual: el tablero del inicio usa los tiempos del juego');
process.exit(distintos ? 1 : 0);
