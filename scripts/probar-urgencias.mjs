// Etapa 8.2 · Los invariantes de la regla de las urgencias (src/brain.js),
// paso a paso: 4 variantes × límites 1, 2, 5 y 10 × 1 y 5 urgencias al día ×
// 20 días (unos 2,3 millones de pasos). Revisa que lleguen las sorteadas, que
// nunca haya dos urgencias con prioridad a la vez, que las normales en curso
// no pasen el límite (en C, nada lo pasa y ninguna tiene prioridad), que los
// tiempos no sean negativos y que normales + urgentes = terminadas.
// Uso: node scripts/probar-urgencias.mjs   → termina en "invariantes: todo bien"
import { DayBrain } from '../src/brain.js';
import { sembrar } from './medicion.mjs';
const VARIANTES = { principal: { entrada: 'interrumpe' }, B: { entrada: 'termina-tarea' }, C: { entrada: 'cola' }, D: { entrada: 'interrumpe', duracion: [8, 18] } };
let fallas = 0, ticks = 0;
const falla = (msg) => { if (fallas++ < 15) console.log('FALLA', msg); };
for (const [nombre, op] of Object.entries(VARIANTES)) {
  for (const wip of [1, 2, 5, 10]) {
    for (const porDia of [1, 5]) {
      sembrar(2024);
      let llegadas = 0, terminadas = 0, sinTerminar = 0, esperaron = 0, minUrg = 0, bloq = 0;
      for (let d = 0; d < 20; d++) {
        const dia = new DayBrain(wip, { urgenciasPorDia: porDia, urgencias: op });
        while (!dia.terminado) {
          dia.tick(0.15); ticks++;
          const prio = dia.enCurso.filter((t) => t.prioridad).length;
          const dentro = dia.enCurso.filter((t) => !t.prioridad).length;
          if (nombre === 'C') { if (dia.enCurso.length > wip) falla(`${nombre} wip ${wip}: en curso ${dia.enCurso.length} > límite`); if (prio) falla(`${nombre}: urgencia con prioridad`); }
          else { if (prio > 1) falla(`${nombre} wip ${wip}: ${prio} urgencias con prioridad en curso`); if (dentro > wip) falla(`${nombre} wip ${wip}: ${dentro} normales en curso > límite`); }
          for (const t of dia.enCurso) if (t.urgente && t.inicio === null) falla('urgencia en curso sin inicio');
          if (dia.urgencias.porLlegar.some((t) => t.llegada < dia.minutosDeDia - 1e-9)) falla('urgencia que ya debió llegar');
        }
        const m = dia.medidas();
        if (m.urgenciasLlegadas !== porDia) falla(`${nombre}: llegaron ${m.urgenciasLlegadas}, se esperaban ${porDia}`);
        if (m.hechasNormales + m.hechasUrgentes !== m.hechas) falla('terminadas no suman');
        for (const t of m.tareas) { if (t.urgente && (t.desdeLlegada < 0 || t.espera < -1e-9)) falla(`tiempos negativos ${JSON.stringify(t)}`); if (t.enCurso < 0) falla('enCurso negativo'); if (t.urgente && t.espero && t.espera < 0.149) falla(`esperó pero espera ${t.espera}`); if (t.urgente && !t.espero && t.espera > 0.2501) falla(`no esperó pero espera ${t.espera}`); }
        llegadas += m.urgenciasLlegadas; terminadas += m.hechasUrgentes; sinTerminar += m.urgenciasSinTerminar; esperaron += m.tareas.filter((t) => t.urgente && t.espero).length; minUrg += m.minutosUrgencias;
        bloq += dia.hechas.filter((t) => t.urgente && t.bloqueo === null && t.minutosBloqueada === 0).length; // (trabadas alguna vez)
      }
      console.log(`${nombre.padEnd(9)} límite ${String(wip).padStart(2)} · ${porDia}/día → llegan ${(llegadas / 20).toFixed(2)}, terminan ${(terminadas / 20).toFixed(2)}, sin terminar al cierre ${(sinTerminar / 20).toFixed(2)}, esperaron ${(esperaron / 20).toFixed(2)}, min urg ${(minUrg / 20).toFixed(0)}`);
    }
  }
}
console.log(fallas ? `FALLAS: ${fallas}` : `invariantes: todo bien (${ticks} pasos revisados)`);
