// Los datos del juego para descargar (Etapa 7, 2026-10-28): la tabla de 1 a
// 10 tareas a la vez de la corrida oficial (docs/corrida-oficial.json: 200
// días por cada número, semilla 2024), como CSV en español y en inglés, con
// licencia CC BY 4.0. Los enlaza la guía (/limite-wip/#datos) y los describe
// como Dataset (schema.org). Se corre con: node scripts/datos-csv.mjs
// 8.4 (2026-11-04): también la segunda tabla, las urgencias de la Etapa 8.2
// (docs/etapa8-2-resultados.json, regla principal: 0, 1, 2, 3 y 5 urgencias
// al día × límite 1 a 10, 200 días por combinación, semilla 2024), como
// mosca-del-wip-urgencias.csv y mosca-del-wip-urgent-tasks.csv.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const corrida = JSON.parse(readFileSync(join(RAIZ, 'docs/corrida-oficial.json'), 'utf8'));
mkdirSync(join(RAIZ, 'public/datos'), { recursive: true });

const NIVEL_EN = { Tranquila: 'Calm', Ocupada: 'Busy', Estresada: 'Stressed', Colapsada: 'Overwhelmed' };
const VERSIONES = {
  es: {
    archivo: 'mosca-del-wip-1-a-10-tareas.csv',
    cabecera: ['tareas_a_la_vez', 'terminadas_por_dia', 'minutos_por_tarea', 'minutos_que_rinden_por_hora', 'minutos_esperando_por_dia', 'cigarros', 'cafes', 'estres_promedio', 'estres_maximo', 'nivel_al_cerrar'],
    nivel: (n) => n,
    notas: [
      '# Mosca del WIP, un día de oficina con 1 a 10 tareas a la vez. Promedio de 200 días por cada número, en el juego (simulación, semilla 2024).',
      '# Cada fila trae cuántas tareas tiene la mosca en curso a la vez · cuántas termina en el día · minutos de oficina que tarda cada tarea de que empieza a que termina ·',
      '# minutos de cada hora que rinden de verdad · minutos del día sin nada que hacer · cigarros · cafés · estrés promedio y máximo (0 a 100) · nivel de estrés al cerrar.',
      '# De Felipe Fernández, con licencia CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). La fuente es https://mosca.deliverycraft.ai/limite-wip/#datos',
    ],
  },
  en: {
    archivo: 'mosca-del-wip-1-to-10-tasks.csv',
    cabecera: ['tasks_at_once', 'finished_per_day', 'minutes_per_task', 'productive_minutes_per_hour', 'idle_minutes_per_day', 'cigarettes', 'coffees', 'average_stress', 'max_stress', 'stress_level_at_close'],
    nivel: (n) => NIVEL_EN[n] ?? n,
    notas: [
      '# Mosca del WIP, an office day with 1 to 10 tasks at once. Average of 200 days per number, in the game (simulation, seed 2024).',
      '# Each row gives how many tasks the fly has in progress at once · how many she finishes per day · office minutes each task takes from start to finish ·',
      '# minutes of every hour that really get work done · idle minutes per day · cigarettes · coffees · average and maximum stress (0 to 100) · stress level at the end of the day.',
      '# By Felipe Fernández, under the CC BY 4.0 license (https://creativecommons.org/licenses/by/4.0/). The source is https://mosca.deliverycraft.ai/en/wip-limit/#datos',
    ],
  },
};

for (const [idioma, V] of Object.entries(VERSIONES)) {
  const filas = corrida.filas.map((f) =>
    [f.wip, f.terminadas, f.tiempo_por_tarea_min, f.eficiencia_min_por_hora, f.espera_min, f.colillas, f.cafes, f.estres_promedio, f.estres_maximo, V.nivel(f.nivel)].join(','),
  );
  const csv = [...V.notas, V.cabecera.join(','), ...filas].join('\n') + '\n';
  writeFileSync(join(RAIZ, 'public/datos', V.archivo), csv);
  console.log(`public/datos/${V.archivo}: ${filas.length} filas (${idioma})`);
}

// La segunda tabla: las urgencias (8.4). Solo la regla principal (la urgencia
// pasa por encima del límite y la mosca la hace primero, de a una); las
// variantes B, C y D quedan en docs/etapa8-2.md.
const urgencias = JSON.parse(readFileSync(join(RAIZ, 'docs/etapa8-2-resultados.json'), 'utf8'));
const principales = urgencias.celdas
  .filter((c) => c.variante === 'principal')
  .sort((a, b) => a.urgencias_por_dia - b.urgencias_por_dia || a.wip - b.wip);
const num = (v) => (v == null ? '' : String(v));
const URGENCIAS = {
  es: {
    archivo: 'mosca-del-wip-urgencias.csv',
    cabecera: ['urgencias_al_dia', 'limite', 'normales_terminadas_por_dia', 'terminadas_contando_urgencias', 'minutos_por_tarea_normal', 'minutos_por_urgencia', 'estres_al_cerrar'],
    notas: [
      `# Mosca del WIP, un día de oficina con 0, 1, 2, 3 o 5 urgencias al día y un límite de 1 a 10 tareas a la vez. Promedio de ${urgencias.dias} días por combinación, en la simulación (semilla ${urgencias.semilla}).`,
      '# Una urgencia llega sin aviso, pasa por encima del límite y la mosca la hace primero, de a una. Cada fila trae urgencias al día · el límite (tareas normales a la vez) · tareas normales terminadas en el día ·',
      '# terminadas contando las urgencias · minutos de oficina por tarea normal, de que empieza a que termina · minutos por urgencia, de que llega a que termina (vacío sin urgencias) · estrés al cerrar (0 a 100).',
      '# De Felipe Fernández, con licencia CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). La fuente es https://mosca.deliverycraft.ai/limite-wip/#datos',
    ],
  },
  en: {
    archivo: 'mosca-del-wip-urgent-tasks.csv',
    cabecera: ['urgent_tasks_per_day', 'limit', 'regular_tasks_finished_per_day', 'finished_counting_urgent_tasks', 'minutes_per_regular_task', 'minutes_per_urgent_task', 'stress_at_close'],
    notas: [
      `# Mosca del WIP, an office day with 0, 1, 2, 3 or 5 urgent tasks a day and a limit of 1 to 10 tasks at once. Average of ${urgencias.dias} days per combination, in the simulation (seed ${urgencias.semilla}).`,
      '# An urgent task arrives unannounced, jumps over the limit and the fly does it first, one at a time. Each row gives urgent tasks per day · the limit (regular tasks at once) · regular tasks finished per day ·',
      '# finished counting the urgent ones · office minutes per regular task, from start to finish · minutes per urgent task, from arrival to finish (empty with no urgent tasks) · stress at the end of the day (0 to 100).',
      '# By Felipe Fernández, under the CC BY 4.0 license (https://creativecommons.org/licenses/by/4.0/). The source is https://mosca.deliverycraft.ai/en/wip-limit/#datos',
    ],
  },
};
for (const [idioma, V] of Object.entries(URGENCIAS)) {
  const filas = principales.map((c) =>
    [c.urgencias_por_dia, c.wip, num(c.terminadas_normales), num(c.terminadas_total), num(c.tiempo_normal_min), num(c.tiempo_urgencia_min), num(c.estres_cierre)].join(','),
  );
  const csv = [...V.notas, V.cabecera.join(','), ...filas].join('\n') + '\n';
  writeFileSync(join(RAIZ, 'public/datos', V.archivo), csv);
  console.log(`public/datos/${V.archivo}: ${filas.length} filas (${idioma})`);
}
