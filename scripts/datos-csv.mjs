// Los datos del juego para descargar (Etapa 7, 2026-10-28): la tabla de 1 a
// 10 tareas a la vez de la corrida oficial (docs/corrida-oficial.json: 200
// días por cada número, semilla 2024), como CSV en español y en inglés, con
// licencia CC BY 4.0. Los enlaza la guía (/limite-wip/#datos) y los describe
// como Dataset (schema.org). Se corre con: node scripts/datos-csv.mjs
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
      '# Mosca del WIP: un día de oficina con 1 a 10 tareas a la vez. Promedio de 200 días por cada número, en el juego (simulación, semilla 2024).',
      '# Cada fila: cuántas tareas tiene la mosca en curso a la vez; cuántas termina en el día; minutos de oficina que tarda cada tarea de que empieza a que termina;',
      '# minutos de cada hora que rinden de verdad; minutos del día sin nada que hacer; cigarros; cafés; estrés promedio y máximo (0 a 100); nivel de estrés al cerrar.',
      '# Autor: Felipe Fernández. Licencia CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Fuente: https://mosca.deliverycraft.ai/limite-wip/#datos',
    ],
  },
  en: {
    archivo: 'mosca-del-wip-1-to-10-tasks.csv',
    cabecera: ['tasks_at_once', 'finished_per_day', 'minutes_per_task', 'productive_minutes_per_hour', 'idle_minutes_per_day', 'cigarettes', 'coffees', 'average_stress', 'max_stress', 'stress_level_at_close'],
    nivel: (n) => NIVEL_EN[n] ?? n,
    notas: [
      '# Mosca del WIP: an office day with 1 to 10 tasks at once. Average of 200 days per number, in the game (simulation, seed 2024).',
      '# Each row: how many tasks the fly has in progress at once; how many she finishes in the day; office minutes each task takes from start to finish;',
      '# minutes of every hour that really get work done; idle minutes per day; cigarettes; coffees; average and maximum stress (0 to 100); stress level at the end of the day.',
      '# Author: Felipe Fernández. License CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Source: https://mosca.deliverycraft.ai/en/wip-limit/#datos',
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
