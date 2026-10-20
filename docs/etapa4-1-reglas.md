# Etapa 4.1 — Medir la paradoja (H1): reglas fijadas ANTES de medir

> Guardado en git el 2026-10-20, antes de correr cualquier medición. Los
> criterios son los del pedido de Felipe (`docs/etapa4-plan.md`, sección
> "4.1"), copiados sin cambios. Aquí sólo se precisa **cómo** se mide cada
> cosa, para que no haya que decidir nada después de ver los números.

**H1 (la paradoja):** con más tareas nunca le falta qué hacer, pero sus
tareas pasan cada vez más tiempo esperando y termina menos.

## Cómo se mide (sin cambiar reglas)

- **La simulación**: la misma de `scripts/simular-dias.mjs`: el juego de
  hoy (`src/brain.js` sin tocar), 200 días por cada WIP de 1 a 10, pasos de
  0,15 minutos, cada día con sus 3 días previos jugados en silencio (como
  siempre). El azar va con **semilla fija** (la misma fórmula y semilla 2024
  de `scripts/opciones-3-3.mjs`) para que se pueda repetir igual.
- **Sólo se observa**: el script nuevo `scripts/medir-paradoja.mjs` envuelve
  el `tick` del juego para mirar qué pasó en cada paso (antes y después),
  sin cambiar ningún número ni llamar al azar. Control: con la misma
  semilla, las terminadas por WIP tienen que salir **idénticas** con y sin
  la observación; si no, la medición no vale y se avisa.
- **Base de tiempo**: minutos de oficina (09:00 a 18:00 = 540 por día).

### Las tres medidas de Felipe

1. **Con qué hacer** = % del día en que la mosca tiene al menos una tarea en
   curso que puede avanzar (no bloqueada), haga lo que haga en ese momento
   (también mientras fuma o toma café). Se calcula en cada paso con la misma
   lógica del juego: después de rellenar "En curso" y de descontar el tiempo
   a los bloqueos. Control: en los pasos en que no fuma ni toma café, "no
   tiene con qué" tiene que coincidir exactamente con "espera" del juego.
2. **Trabajando** = % del día en que de verdad avanza una tarea: pasos en
   que no fuma, no toma café y no espera por bloqueos. Cuenta el paso
   entero, aunque por cambiar de tarea rinda menos (eso se ve aparte en la
   Eficiencia del juego, "minutos que rinden de cada hora", que se muestra
   como referencia).
3. **Eficiencia de flujo** = de todo el tiempo que las tareas terminadas
   estuvieron en curso (minutos de oficina, el mismo "tiempo por tarea" del
   juego, contando lo de días anteriores), qué parte la mosca las estuvo
   trabajando: la suma de sus turnos (los pasos en que esa tarea fue la que
   avanzó, contando lo que pierde al cambiar de tarea; también los turnos de
   días anteriores) dividida por la suma de sus tiempos en curso. Es el
   total de todas las tareas terminadas en los 200 días (suma ÷ suma). En el
   paso en que la termina, cuenta sólo la parte del paso que usó.
   - **Dato aparte** (no entra en los criterios): el tamaño de la tarea
     (sus minutos de trabajo, 15 a 35) dividido por su tiempo en curso,
     también suma ÷ suma.
   - También se informa, sólo como información, el promedio por tarea de
     las dos (no entra en los criterios).

Además se muestran, tal cual: **terminadas** por día, cómo se reparte el día
(trabajando / fumando / café / esperando por bloqueos; suman 100 %),
tiempo por tarea, colillas y "esperando su turno" (100 % − eficiencia de
flujo).

## Criterios (copiados del plan, sin cambios)

- **(a)** "Con qué hacer" desde WIP 3 es al menos 15 puntos más alto que en
  WIP 1. *Se lee así*: cada uno de los WIP 3 a 10 tiene "con qué hacer" ≥
  el de WIP 1 + 15 puntos.
- **(b)** La eficiencia de flujo baja de WIP 2 a WIP 10 (se permite ±1
  punto de ruido) y en WIP 9 es menos de la mitad que en WIP 2. *Se lee
  así*: en cada escalón de 2→3 hasta 9→10, la eficiencia de flujo del WIP
  mayor no supera en más de 1 punto a la del anterior; y flujo(9) <
  flujo(2) ÷ 2.
- **(c)** Con WIP 9 termina menos que con WIP 2.

**Veredicto:**
- **Se cumple** si se cumplen (a), (b) y (c).
- **A medias** si se cumplen (b) y (c) pero no (a).
- **No se cumple** si falla (b).
- Caso que el plan no cubre (se cumple (b) pero falla (c)): se informa tal
  cual y decide Felipe; no se le pone nombre.

**Ojo (del plan):** con WIP alto fuma mucho, así que "trabajando" puede
bajar. Eso no invalida la paradoja; se muestra tal cual.
