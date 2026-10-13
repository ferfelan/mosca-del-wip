// Juega muchos días completos por cada WIP (1 a 10) con las mismas reglas
// del juego (src/brain.js) y muestra los promedios. Revisa además:
//  - la FORMA: en cada escalón de WIP las terminadas bajan y el tiempo por
//    tarea sube; las colillas nunca bajan (y desde WIP 3 suben siempre);
//    WIP 1–3 no fuma y queda "Tranqui".
//  - la Ley de Little: WIP promedio ≈ terminadas por minuto × tiempo por tarea.
//
// Uso: node scripts/simular-dias.mjs            (200 días por WIP)
//      DIAS=500 node scripts/simular-dias.mjs
// No necesita el navegador ni el servidor.
import { DayBrain, nivelDeEstres } from '../src/brain.js';

const DIAS = Number(process.env.DIAS ?? 200);
const PASO = Number(process.env.PASO ?? 0.15); // minutos simulados por cuadro: el juego a 60 cuadros/s y x1 (x4 = 0.6)

const filas = [];
for (let wip = 1; wip <= 10; wip++) {
  const t = { hechas: 0, medidas: 0, sumaTiempo: 0, minutos: 0, areaWip: 0, colillas: 0, cafes: 0, estres: 0, estresMax: 0 };
  for (let d = 0; d < DIAS; d++) {
    const dia = new DayBrain(wip);
    while (!dia.terminado) dia.tick(PASO);
    const m = dia.medidas();
    t.hechas += m.hechas;
    t.medidas += m.tareasMedidas;
    t.sumaTiempo += m.sumaTiempoPorTarea;
    t.minutos += m.minutos;
    t.areaWip += m.wipPromedio * m.minutos;
    t.colillas += m.colillas;
    t.cafes += m.cafes;
    t.estres += m.estresPromedio;
    t.estresMax += dia.estresMax;
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
    wipPromedio,
    little: porMinuto * tiempoPorTarea,
  });
}

const f1 = (n) => n.toFixed(1).replace('.', ',');
const pad = (s, n) => String(s).padStart(n);
console.log(`\n${DIAS} días por cada WIP (promedio por día)\n`);
console.log(' WIP  Terminadas  Tiempo/tarea  Colillas  Cafés  Estrés prom.  Nivel       │ Little: WIP prom.  terminadas/min × tiempo  diferencia');
for (const r of filas) {
  const dif = ((r.little - r.wipPromedio) / r.wipPromedio) * 100;
  console.log(
    `${pad(r.wip, 4)}  ${pad(f1(r.hechas), 10)}  ${pad(Math.round(r.tiempoPorTarea) + ' min', 12)}  ${pad(f1(r.colillas), 8)}  ${pad(f1(r.cafes), 5)}  ${pad(Math.round(r.estres) + '%', 12)}  ${nivelDeEstres(r.estres).nombre.padEnd(10)}  │ ${pad(f1(r.wipPromedio), 17)}  ${pad(f1(r.little), 23)}  ${pad((dif >= 0 ? '+' : '') + f1(dif) + '%', 10)}`,
  );
}

// ---- Revisión de la forma ----
const problemas = [];
for (let i = 1; i < filas.length; i++) {
  const a = filas[i - 1];
  const b = filas[i];
  if (!(b.hechas < a.hechas)) problemas.push(`WIP ${a.wip}→${b.wip}: las terminadas no bajan (${f1(a.hechas)} → ${f1(b.hechas)})`);
  if (!(b.tiempoPorTarea > a.tiempoPorTarea)) problemas.push(`WIP ${a.wip}→${b.wip}: el tiempo por tarea no sube`);
  if (b.colillas < a.colillas) problemas.push(`WIP ${a.wip}→${b.wip}: las colillas bajan`);
  if (a.wip >= 3 && !(b.colillas > a.colillas)) problemas.push(`WIP ${a.wip}→${b.wip}: las colillas no suben`);
  if (!(b.estres > a.estres)) problemas.push(`WIP ${a.wip}→${b.wip}: el estrés promedio no sube`);
}
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

console.log('');
if (problemas.length) {
  console.log('PROBLEMAS:');
  problemas.forEach((p) => console.log(' - ' + p));
  process.exitCode = 1;
} else {
  console.log('Forma: todo bien (cada tarea extra suma costo; WIP 1–3 sigue siendo lo mejor).');
  console.log('Ley de Little: se cumple en todos los WIP (diferencia < 5%).');
}
