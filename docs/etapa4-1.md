# Etapa 4.1 — Medir la paradoja (H1): resultados (2026-10-20)

Reglas y criterios fijados antes de medir: `docs/etapa4-1-reglas.md`
(commit `73581af`). Script: `scripts/medir-paradoja.mjs` (sólo observa el
juego; `src/brain.js` sin tocar). Números: `docs/etapa4-1-resultados.json`.
PDF corto: `~/Desktop/Mosca del WIP/2026-10-20 Etapa 4.1 La paradoja v1.pdf`.

**Veredicto H1: SE CUMPLE** (a ✅, b ✅, c ✅), en la simulación.

## Tabla por WIP (200 días por WIP, semilla 2024)

% del día de oficina, salvo donde dice otra cosa.

| WIP | Con qué hacer | Trabajando | Fumando | Café | Esperando por bloqueos | Eficiencia de flujo | Tamaño ÷ tiempo | Terminadas/día | Tiempo por tarea |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 74,7 | 73,3 | 0,0 | 1,8 | 24,8 | 72,9 | 72,9 | 15,9 | 34 min |
| 2 | 96,3 | 94,8 | 0,0 | 1,5 | 3,7 | 47,2 | 41,4 | 18,0 | 60 min |
| 3 | 99,5 | 98,3 | 0,0 | 1,2 | 0,5 | 32,7 | 25,9 | 16,9 | 96 min |
| 4 | 100,0 | 97,6 | 1,5 | 0,9 | 0,0 | 24,3 | 17,7 | 15,4 | 140 min |
| 5 | 100,0 | 95,2 | 4,5 | 0,3 | 0,0 | 19,0 | 12,9 | 14,0 | 194 min |
| 6 | 100,0 | 91,1 | 8,9 | 0,0 | 0,0 | 15,1 | 9,5 | 12,3 | 264 min |
| 7 | 100,0 | 88,0 | 12,0 | 0,0 | 0,0 | 12,6 | 7,3 | 11,2 | 340 min |
| 8 | 100,0 | 83,5 | 16,5 | 0,0 | 0,0 | 10,4 | 5,8 | 10,0 | 431 min |
| 9 | 100,0 | 80,5 | 19,5 | 0,0 | 0,0 | 8,9 | 4,7 | 9,1 | 534 min |
| 10 | 100,0 | 77,5 | 22,5 | 0,0 | 0,0 | 7,7 | 3,9 | 8,2 | 634 min |

Trabajando + fumando + café + esperando = 100 % (± redondeo). Promedio por
tarea (sólo información; eficiencia de flujo / tamaño ÷ tiempo): WIP 1
85,8/85,8 · 2 53,6/47,8 · 3 34,5/27,6 · 4 24,9/18,2 · 5 19,2/13,0 · 6
15,2/9,5 · 7 12,6/7,4 · 8 10,4/5,8 · 9 9,0/4,7 · 10 7,8/3,9. Minutos que
rinden de cada hora (la Eficiencia del juego): 44, 50, 47, 43, 39, 34, 31,
28, 25, 23. Colillas: 0, 0, 0, 1, 3, 6, 8, 11, 13, 15.

## Criterios

| Criterio | Resultado | |
|---|---|---|
| (a) "Con qué hacer" de WIP 3 a 10 ≥ WIP 1 + 15 puntos (≥ 89,7) | El más bajo es WIP 3, con 99,5 | ✅ |
| (b) La eficiencia de flujo baja de 2 a 10 (±1 punto) | Baja en cada escalón (la "subida" más grande es −1,2) | ✅ |
| (b) WIP 9 < mitad de WIP 2 | 8,9 < 23,6 | ✅ |
| (c) WIP 9 termina menos que WIP 2 | 9,1 < 18,0 | ✅ |

Controles (todos bien): con la misma semilla, la observación no cambió las
terminadas de ningún WIP; "no tiene con qué" coincide paso a paso con la
"espera" del juego; el tiempo en curso coincide con el tiempo por tarea del
juego. `simular-dias` sigue en "Forma: todo bien".

## Lo que se ve

- **Desde 3 tareas ya nunca le falta qué hacer** (99,5 % con 3; 100 %
  desde 4). Con 2 ya tiene con qué el 96 % del día. Pasado eso, más tareas
  no le dan más trabajo para hacer: sólo hacen esperar más a cada tarea.
- **Con una tarea, la tarea vuela pero ella espera**: la tarea pasa el 73 %
  de su tiempo siendo trabajada, pero la mosca pasa un cuarto del día (25 %)
  sin poder hacer nada porque su única tarea está bloqueada.
- **Con muchas, las tareas esperan su turno casi todo el tiempo**: con 9,
  cada tarea es trabajada sólo el 9 % de su tiempo en curso (91 % esperando
  su turno) y termina la mitad que con 2 (9,1 contra 18,0 al día).
- **"Trabajando" baja desde 4 tareas** (de 98 % con 3 a 80 % con 9) porque
  sale a fumar: el plan lo anticipaba y no invalida la paradoja.

## Lo que hay que decir con cuidado (norte: "lo que NO es hipótesis")

1. **La eficiencia de flujo es, casi exacto, "% trabajando ÷ número de
   tareas"** (WIP 2: 94,8 ÷ 2 = 47,4 contra 47,2 medido; WIP 9: 80,5 ÷ 9 =
   8,9 contra 8,9). Es la ley de Little otra vez: si reparte su tiempo entre
   N tareas, cada una recibe más o menos 1/N. Que baje con el WIP es
   **matemática**, como el tiempo por tarea, no un hallazgo. El criterio (b)
   sólo podía fallar si "trabajando" creciera más rápido que el número de
   tareas.
2. **Lo que no es matemática viene de supuestos del juego**: que con 1
   tarea se quede sin qué hacer sale de los bloqueos (20 % de las tareas,
   30 a 60 min); que con muchas termine menos sale del costo de cambiar de
   tarea, del residuo y de fumar. Ninguno se ajustó para esta prueba; la 4.2
   prueba qué pasa si cambian.
3. **Lo valioso de la 4.1** es ver las tres piezas juntas y con números del
   mismo juego: estar ocupada sube hasta el techo con 2–3 tareas y se
   estanca; la espera de cada tarea sigue creciendo; las terminadas bajan.
   Eso es la paradoja de Modig y Åhlström, **en la simulación**. No dice
   nada todavía sobre personas (eso sería la 4.5).
4. "Tamaño ÷ tiempo" es más bajo que la eficiencia de flujo desde WIP 2
   porque los turnos incluyen lo que se pierde al cambiar de tarea: con 9
   tareas, de cada 9 % del tiempo en que la trabaja, sólo rinde ~4,7 %.

## Decisiones de medición (fijadas antes, ver reglas)

- Suma ÷ suma sobre todas las tareas terminadas en los 200 días (el
  promedio por tarea va sólo como información y da la misma forma).
- Las tareas que vienen de días anteriores cuentan su tiempo y sus turnos de
  esos días (igual que el tiempo por tarea del juego).
- La semilla se reinicia en cada WIP (la misma para todos).
