// Etapa 3.3 · PROPUESTA (sin construir): 3 maneras de conectar el circuito
// real de limpieza de antenas (Etapa 3.2b, peso 0,090 mV) al juego.
//
// NO toca el juego: lee src/brain.js, arma copias temporales con SÓLO la
// línea de las ganas de fumar cambiada y les corre el mismo
// scripts/simular-dias.mjs (200 días por WIP, con su revisión de la forma).
// El azar va con semilla fija para comparar las opciones parejo.
//
// Uso: node scripts/opciones-3-3.mjs        (guarda docs/etapa3-3-opciones.json)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const BRAIN = readFileSync(join(RAIZ, 'src/brain.js'), 'utf8');
const TABLA = JSON.parse(readFileSync(join(RAIZ, 'docs/etapa3-2b-tabla-wip.json'), 'utf8'));
const SALIDA = join(RAIZ, 'docs/etapa3-3-opciones.json');

// ===========================================================================
// REGLAS FIJADAS ANTES DE SIMULAR (2026-10-18)
// ===========================================================================
// Actividad real: la "limpieza" (promedio de aDN1 y aDN2) de la tabla de la
// 3.2b para 1–10 tareas abiertas, dividida por la de 10 (0 tareas → 0).
const limpieza = TABLA.tabla.map((f) => f.limpieza);
const ACTIVIDAD_REAL = [0, ...limpieza.map((x) => x / limpieza[9])];
// Las ganas máximas de la fórmula actual (con estrés 100 %), leídas de brain.js
const constante = (n) => Number(BRAIN.match(new RegExp(`const ${n} = ([\\d.]+)`))[1]);
const sobraMax = 100 - constante('ESTRES_MIN_FUMAR');
const GANAS_MAX = sobraMax * constante('URGENCIA_FUMAR_FACTOR') * (1 + constante('URGENCIA_FUMAR_CURVA'));
const SEMILLA = 2024;
const LINEA = 'this.urgenciaFumar += sobra * URGENCIA_FUMAR_FACTOR * curva * dt;';
const OPCIONES = {
  A: {
    nombre: 'El cerebro muestra, el juego decide',
    regla: 'Sin cambios en las reglas; en la 3.3 las luces del panel saldrían de la actividad real.',
    linea: LINEA,
    frase: 'Las luces del cerebro vienen de un circuito real de la mosca (MaleCNS), simulado: limpiarse las antenas. ' +
      'El cigarro es un disfraz de esa limpieza. Las colillas y el estrés siguen reglas del juego basadas en estudios. ' +
      'El café es ilustrativo.',
  },
  B: {
    nombre: 'El cerebro decide si dan ganas, el estrés decide cuántas',
    regla: 'Ganas por minuto = fórmula actual × actividad real (normalizada) según las tareas abiertas.',
    linea: 'this.urgenciaFumar += sobra * URGENCIA_FUMAR_FACTOR * curva * dt * __ACTIVIDAD_REAL[Math.min(this.enCurso.length, 10)];',
    frase: 'Las ganas de "fumar" las enciende un circuito real de la mosca (MaleCNS, simulado): limpiarse las antenas. ' +
      'Cuántas veces fuma lo decide el estrés del juego, basado en estudios. El café es ilustrativo.',
  },
  C: {
    nombre: 'El cerebro decide todo',
    regla: `Ganas por minuto = ${GANAS_MAX.toFixed(1)} × actividad real (normalizada) según las tareas abiertas, sin depender del estrés ` +
      `(${GANAS_MAX.toFixed(1)} = las ganas máximas de la fórmula actual).`,
    linea: 'this.urgenciaFumar += __GANAS_MAX * __ACTIVIDAD_REAL[Math.min(this.enCurso.length, 10)] * dt;',
    frase: 'Las colillas siguen directo a un circuito real de la mosca (MaleCNS, simulado): limpiarse las antenas. ' +
      'El café es ilustrativo.',
  },
};
// ===========================================================================

if (BRAIN.split(LINEA).length !== 2) throw new Error('La línea de las ganas de fumar cambió en src/brain.js: revisar el script');

const base = mkdtempSync(join(tmpdir(), 'mosca-opciones-'));
writeFileSync(
  join(base, 'semilla.mjs'),
  `let s = ${SEMILLA} >>> 0;\nMath.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); ` +
    `t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };\n`,
);

const numero = (s) => Number(s.replace(',', '.'));
const resultados = { actividad_real: ACTIVIDAD_REAL.map((x) => Math.round(x * 1000) / 1000), ganas_max: GANAS_MAX, opciones: {} };
for (const [clave, op] of Object.entries(OPCIONES)) {
  const dir = join(base, clave);
  mkdirSync(join(dir, 'src'), { recursive: true });
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  const cabeza = `const __ACTIVIDAD_REAL = ${JSON.stringify(ACTIVIDAD_REAL)};\nconst __GANAS_MAX = ${GANAS_MAX};\n`;
  writeFileSync(join(dir, 'src/brain.js'), cabeza + BRAIN.replace(LINEA, op.linea));
  copyFileSync(join(RAIZ, 'scripts/simular-dias.mjs'), join(dir, 'scripts/simular-dias.mjs'));
  const r = spawnSync(process.execPath, ['--import', pathToFileURL(join(base, 'semilla.mjs')).href, join(dir, 'scripts/simular-dias.mjs')],
    { encoding: 'utf8' });
  const texto = r.stdout + r.stderr;
  const filas = [];
  for (const l of texto.split('\n')) {
    const m = l.match(/^\s+(\d+)\s+([\d,]+)\s+(\d+) min\s+(\d+) min\s+([\d,]+)\s+([\d,]+)\s+(\d+)%\s+(\S+)/);
    if (m) filas.push({ wip: +m[1], terminadas: numero(m[2]), tiempo_min: +m[3], colillas: numero(m[5]), cafes: numero(m[6]), estres: +m[7], nivel: m[8] });
  }
  const forma = texto.includes('Forma: todo bien');
  const problemas = texto.includes('PROBLEMAS:') ? texto.split('PROBLEMAS:')[1].trim().split('\n').map((s) => s.replace(/^ - /, '')) : [];
  const tranqui = (texto.match(/llega a "Tranqui": ~(\d\d:\d\d)/) || [])[1] ?? null;
  resultados.opciones[clave] = { ...op, filas, forma_todo_bien: forma, problemas, bajar_wip_tranqui: tranqui };
  console.log(`\n=== Opción ${clave}: ${op.nombre} ===`);
  console.log(` ${op.regla}`);
  console.log(' WIP  Terminadas  Colillas  Cafés  Estrés');
  for (const f of filas) console.log(` ${String(f.wip).padStart(3)}  ${String(f.terminadas).padStart(10)}  ${String(f.colillas).padStart(8)}  ${String(f.cafes).padStart(5)}  ${String(f.estres).padStart(5)}%`);
  console.log(` simular-dias: ${forma ? 'Forma: todo bien' : 'PROBLEMAS: ' + problemas.join(' · ')} · bajar 10→2: Tranqui ~${tranqui}`);
}
writeFileSync(SALIDA, JSON.stringify(resultados, null, 1) + '\n');
console.log(`\nGuardado en docs/etapa3-3-opciones.json (copias temporales en ${base})`);
