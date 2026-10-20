# Etapa 4.2 — Robustez (H2 y H3): reglas fijadas ANTES de correr

> Guardado en git el 2026-10-20, antes de correr cualquier escenario. Los
> escenarios, las medidas y los criterios son los del pedido de Felipe
> (`docs/etapa4-plan.md`, sección "4.2"), copiados sin cambios, más el
> agregado de Felipe de hoy (que sólo suma información). Aquí se precisa
> **cómo** se lee cada cosa; donde el plan deja algo abierto, se marca como
> *interpretación* y se fija ahora, antes de ver resultados.

**H2 (el límite sostenible):** con esperas a otros, el mejor número es bajo
pero no 1, y se mantiene aunque cambien los supuestos. Si se mueve según
cuánto se espera, eso también es un hallazgo.

**H3 (lo empezado no desaparece):** al bajar el límite, la mejora tarda
horas en notarse.

## Cómo se corre (sin tocar el juego)

- `src/brain.js` no se toca. Cada escenario es una **copia temporal** de
  `src/brain.js` (fuera del proyecto) con sólo las líneas de su supuesto
  cambiadas, como en `scripts/opciones-3-3.mjs`. Script:
  `scripts/robustez.mjs`.
- **200 días por WIP y escenario**, WIP 1 a 10, pasos de 0,15 min, con los 3
  días previos de siempre. **Semilla fija** (2024, la misma fórmula de la
  4.1), reiniciada en cada escenario y WIP.
- Las medidas salen de la misma observación de la 4.1 (se pasa a un módulo
  compartido, `scripts/medicion.mjs`; control: la 4.1 tiene que dar
  exactamente los mismos números que antes).
- **Control técnico**: la copia del escenario "hoy" (líneas reemplazadas por
  los mismos valores) tiene que dar exactamente las mismas terminadas que el
  juego de verdad con la misma semilla.

## Los escenarios (un supuesto a la vez desde el juego de hoy)

Juego de hoy: bloqueos 20 % de las tareas, de 30 a 60 min; costo de cambio
suave (rinde 100, 85, 78, 72, 67, 62, 58, 55, 52 y 50 % con 1 a 10 tareas);
tareas de 15 a 35 min; residuo 3 % por tarea que espera.

| Grupo | Valores | Qué se cambia en la copia |
|---|---|---|
| Bloqueos | 0, 10, 20, 30 y 40 % | `PROBABILIDAD_BLOQUEO` |
| Duración del bloqueo | 15–30, 30–60 y 60–120 min | `BLOQUEO_MIN`, `BLOQUEO_MAX` |
| Costo de cambiar de tarea | ninguno (100 % siempre), suave (hoy), Weinberg completo (100, 80, 60, 40, 25 % y 25 % desde 5 tareas) | `RENDIMIENTO_POR_WIP` |
| Tamaño de las tareas | 15–35 (hoy) y 5–45 min | `DURACION_TAREA_MIN`, `DURACION_TAREA_MAX` |
| Residuo por tarea esperando | 0, 3 % (hoy) y 6 % | `RESIDUO_POR_TAREA_ESPERANDO` |
| Cruce bloqueos × costo | 5 × 3 = 15 combinaciones | las dos cosas |

Varios escenarios se repiten entre grupos (por ejemplo "hoy" aparece en
todos los grupos y en el cruce). *Interpretación*: cada combinación distinta
se corre y se cuenta **una sola vez**. Quedan **20 escenarios distintos**:
17 con bloqueos y 3 sin bloqueos (0 % × los tres costos). Como información
aparte se da también la cuenta "como aparecen en las listas del plan" (31,
con repetidos).

## Lo que se mide en cada escenario y WIP

Terminadas por día, tiempo por tarea (tiempo de ciclo, como el juego),
eficiencia de flujo (turnos ÷ tiempo en curso, suma ÷ suma, como la 4.1),
estrés promedio del día, colillas, con qué hacer y trabajando (como la 4.1).

Por escenario se informa:
- **Mejor WIP** = el que más termina (si hay empate exacto, el más bajo).
- **Zona buena** = los WIP que terminan a menos de 5 % del mejor
  (terminadas > 95 % de las del mejor).
- Tiempo por tarea, eficiencia de flujo, estrés y colillas (en el mejor WIP
  en el resumen; todos los WIP en el JSON y en el anexo).
- **Agregado de Felipe (sólo información, no entra en criterios): "con qué
  hacer 99 % desde"** = el WIP más chico desde el cual, para ese WIP y todos
  los mayores, la mosca tiene con qué hacer al menos el 99 % del día. Si
  ninguno llega, "no llega".

## Controles (se revisan PRIMERO; si no dan, se para y se avisa a Felipe)

Se corren primero sólo los escenarios "hoy", "bloqueos 0 %" y "costo
ninguno"; recién si los controles dan, se corre el resto.

1. **Sin bloqueos, el mejor debería ser 1.** Se lee en el escenario
   "bloqueos 0 %" con todo lo demás como hoy. Los otros dos cruces sin
   bloqueos (0 % × ninguno y 0 % × Weinberg) se informan, pero no son este
   control.
2. **Sin costo de cambio, lo terminado debería bajar mucho menos con el
   WIP.** *Interpretación*: caída = (terminadas del mejor WIP − terminadas
   con WIP 10) ÷ terminadas del mejor WIP. Se cumple si la caída de "costo
   ninguno" es **a lo más la mitad** de la caída del juego de hoy. Además se
   muestra de dónde sale lo que baje (fumar, esperar por bloqueos y el
   residuo de las tareas que esperan), sólo como información.
3. **Técnico**: la copia "hoy" = el juego (terminadas idénticas con la
   misma semilla) y la 4.1 da los mismos números con el módulo compartido.

## Criterios (copiados del plan, sin cambios)

**H2**
- **Se cumple** si en al menos 80 % de los escenarios con bloqueos el mejor
  WIP está entre 2 y 4. (17 escenarios con bloqueos → hacen falta 14.)
- *Interpretación*: el plan no define "a medias" para H2; si no llega a 80
  %, es **no se cumple**, y se informa el porcentaje tal cual.
- Se revisa además si el **tiempo por tarea sube con el WIP en todos los
  escenarios** (cada escalón más alto que el anterior; debería: es Little).
- Tabla simple: **"con X % de bloqueos, el mejor límite es Y"** (con el
  costo de hoy, y como información con los otros dos costos), con su zona
  buena.

**H3**
- En el juego de hoy y en 4 escenarios extremos (sin bloqueos, 40 % de
  bloqueos, sin costo de cambio y Weinberg completo): WIP 10 desde las
  09:00 y a las 12:00 baja a 2, igual que en `simular-dias`.
- Medida: minutos desde las 12:00 hasta que el estrés baja de 25 (Tranqui)
  por primera vez; promedio de 200 días (un día que no llega cuenta hasta
  las 18:00, como en `simular-dias`). Como información: el día más rápido y
  la hora en que vuelve a 2 tareas en curso.
- **Se cumple** si en los 5 casos el promedio es de más de 1 hora. Si no,
  no se cumple (se dice en cuál).
