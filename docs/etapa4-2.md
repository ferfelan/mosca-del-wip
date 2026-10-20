# Etapa 4.2 — Robustez (H2 y H3): resultados (2026-10-20)

Reglas, controles y criterios fijados antes de correr:
`docs/etapa4-2-reglas.md` (commit `27c7724`). Script:
`scripts/robustez.mjs` (copias temporales de `src/brain.js` con un
supuesto cambiado; medición compartida `scripts/medicion.mjs`). Números:
`docs/etapa4-2-resultados.json`. PDF corto: `~/Desktop/Mosca del
WIP/2026-10-20 Etapa 4.2 Robustez v1.pdf`.

**Veredicto H2: SE CUMPLE** (16 de 17 escenarios con bloqueos, 94 %).
**Veredicto H3: SE CUMPLE** (más de 1 hora en los 5 casos; unas 3 horas).
Todo en la simulación.

## Controles (se corrieron primero; dieron lo esperado)

| Control | Resultado | |
|---|---|---|
| Sin bloqueos, el mejor debería ser 1 | Mejor = 1 (21,2 terminadas; WIP 2: 18,0) | ✅ |
| Sin costo de cambio, lo terminado baja mucho menos (caída a lo más la mitad de la de hoy) | Cae 21 % del mejor a WIP 10, contra 55 % hoy (mitad = 27 %) | ✅ |
| Técnico: la copia "hoy" = el juego; la 4.1 igual con el módulo compartido | Terminadas idénticas; JSON de la 4.1 sin cambios | ✅ |

Sin costo de cambio, lo que baja sale de fumar (0 % → 22,5 % del día) y del
residuo de las tareas que esperan: los minutos que rinden por hora pasan de
58 a 46.

## Tabla principal: "con X % de bloqueos, el mejor límite es Y"

Mejor límite (zona buena = terminan a menos de 5 % del mejor).

| Bloqueos | Costo de cambio de hoy (suave) | Sin costo de cambio | Weinberg completo | Con qué hacer 99 % desde (costo de hoy) |
|---:|---|---|---|---:|
| 0 % | **1** (1) | 2 (1 a 5) | 1 (1) | 1 |
| 10 % | **2** (1–2) | 3 (2 a 5) | 1 (1–2) | 2 |
| 20 % (hoy) | **2** (2) | 3 (2 a 5) | 2 (2) | 3 |
| 30 % | **2** (2–3) | 3 (3 a 5) | 2 (2) | 3 |
| 40 % | **3** (2–3) | 4 (3 a 5) | 2 (2) | 4 |

Lectura simple: **el mejor límite sube cuando hay más que esperar y baja
cuando cambiar de tarea cuesta más.** Con el costo de hoy, es 1 sin
esperas, 2 con 10 a 30 % de tareas trabadas y 3 con 40 % (empatado con 2:
16,9 contra 16,8). Sin costo de cambio la zona buena es ancha (de 2 o 3
hasta 5); con el costo fuerte de Weinberg, se angosta a 1 o 2.

## Los 20 escenarios distintos (valores en el mejor WIP)

| Escenario | Mejor | Zona buena | Terminadas | Tiempo por tarea | Ef. flujo | Estrés | Colillas | Con qué 99 % desde |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| Juego de hoy | 2 | 2 | 18,0 | 60 min | 47,2 % | 10 % | 0 | 3 |
| Bloqueos 0 % | 1 | 1 | 21,2 | 25 min | 97,9 % | 5 % | 0 | 1 |
| Bloqueos 10 % | 2 | 1–2 | 18,3 | 59 min | 48,6 % | 10 % | 0 | 2 |
| Bloqueos 30 % | 2 | 2–3 | 17,4 | 62 min | 45,6 % | 10 % | 0 | 3 |
| Bloqueos 40 % | 3 | 2–3 | 16,9 | 96 min | 32,3 % | 17 % | 0 | 4 |
| Bloqueos de 15–30 min | 2 | 1–2 | 18,3 | 59 min | 48,6 % | 10 % | 0 | 3 |
| Bloqueos de 60–120 min | 2 | 2–3 | 17,0 | 64 min | 43,6 % | 10 % | 0 | 4 |
| Sin costo de cambio | 3 | 2–5 | 21,0 | 77 min | 32,6 % | 17 % | 0 | 3 |
| Weinberg completo | 2 | 2 | 17,2 | 63 min | 47,4 % | 10 % | 0 | 3 |
| Tareas de 5–45 min | 2 | 2 | 18,1 | 60 min | 47,3 % | 10 % | 0 | 3 |
| Residuo 0 % | 2 | 2 | 18,2 | 59 min | 47,4 % | 10 % | 0 | 3 |
| Residuo 6 % | 2 | 2 | 17,9 | 60 min | 47,3 % | 10 % | 0 | 3 |
| Bloqueos 0 % · sin costo | 2 | 1–5 | 21,3 | 51 min | 49,1 % | 10 % | 0 | 1 |
| Bloqueos 0 % · Weinberg | 1 | 1 | 21,2 | 25 min | 97,9 % | 5 % | 0 | 1 |
| Bloqueos 10 % · sin costo | 3 | 2–5 | 21,2 | 77 min | 32,7 % | 17 % | 0 | 2 |
| Bloqueos 10 % · Weinberg | **1** | 1–2 | 18,1 | 30 min | 83,4 % | 5 % | 0 | 2 |
| Bloqueos 30 % · sin costo | 3 | 3–5 | 20,7 | 79 min | 32,4 % | 17 % | 0 | 4 |
| Bloqueos 30 % · Weinberg | 2 | 2 | 16,7 | 65 min | 45,7 % | 10 % | 0 | 3 |
| Bloqueos 40 % · sin costo | 4 | 3–5 | 20,5 | 106 min | 24,3 % | 30 % | 1 | 4 |
| Bloqueos 40 % · Weinberg | 2 | 2 | 16,2 | 67 min | 43,8 % | 10 % | 0 | 4 |

Terminadas por WIP de cada escenario: en el JSON.

## H2

- **Criterio**: en al menos 80 % de los escenarios con bloqueos, el mejor
  WIP entre 2 y 4. **Resultado: 16 de 17 (94 %) → SE CUMPLE.** (Contando
  como aparecen en las listas del plan, con repetidos: 26 de 27.)
- La única excepción: **bloqueos 10 % con Weinberg completo → mejor 1**
  (zona 1–2): con pocas esperas y un costo de cambio muy alto, una sola
  tarea gana por poco (18,1 contra 17,3).
- **El tiempo por tarea sube con el WIP en los 20 escenarios** (como debía:
  es Little).
- "Si se mueve según cuánto se espera, eso también es un hallazgo": **se
  mueve**, y en la dirección esperada (ver la tabla principal).
- Los cambios de tamaño de las tareas (5–45 min) y de residuo (0 % o 6 %)
  casi no mueven nada: el mejor sigue en 2 y las terminadas cambian ±0,3.

## Agregado de Felipe: ¿"desde 3, más tareas no dan más qué hacer" se mantiene?

**Depende de cuánto espera, y de nada más.** Con qué hacer el 99 % del día
se alcanza desde 1 tarea sin bloqueos, desde 2 con 10 %, desde 3 con 20 o
30 % (hoy), y desde 4 con 40 % o con bloqueos largos (60–120 min). El costo
de cambio, el tamaño de las tareas y el residuo no lo mueven (sigue en 3).

Además, **con costo de cambio (el de hoy o Weinberg), el mejor límite queda
en ese número o por debajo** (hasta dos menos, en los 15 escenarios con
costo); **sin costo de cambio queda en ese número o a un paso** (uno más o
uno menos, en los 5). O sea, el mejor límite es el equilibrio de dos fuerzas: las esperas empujan
hacia más tareas (para tener siempre con qué) y el costo de cambiar empuja
hacia menos. Sin esperas y sin costo de cambio, da casi lo mismo tener de 1
a 5 (21,2 a 21,3 terminadas).

## H3

WIP 10 desde las 09:00 y a las 12:00 baja a 2 (200 días, semilla fija).

| Escenario | Queda Tranqui después de | Día más rápido | Días con más de 1 h | Vuelve a 2 tareas en curso después de |
|---|---:|---:|---:|---:|
| Juego de hoy | 3 h 07 min | 2 h 01 min | 100 % | 2 h 35 min |
| Sin bloqueos | 3 h 07 min | 2 h 04 min | 100 % | 2 h 33 min |
| 40 % de bloqueos | 3 h 08 min | 2 h 00 min | 100 % | 2 h 32 min |
| Sin costo de cambio | 2 h 53 min | 1 h 54 min | 100 % | 2 h 14 min |
| Weinberg completo | 3 h 52 min | 2 h 18 min | 100 % | 3 h 25 min |

**Criterio: más de 1 hora en los 5 → SE CUMPLE** (el más rápido en
promedio tarda 2 h 53 min; ningún día baja de 1 h 54 min).

## Lo que hay que decir con cuidado

1. **H3 se apoya en el supuesto del estrés**, que no se varió (el plan no lo
   pedía): sube en ~40 min y baja en ~55 min hacia su techo. Por eso los 5
   casos dan parecido. Lo que **no** depende del estrés es que las tareas
   empezadas tardan de 2 h 14 min a 3 h 25 min en volver a 2: eso es la
   prueba más limpia de "lo empezado no desaparece".
2. **Que el tiempo por tarea suba con el WIP es matemática** (Little), igual
   que la eficiencia de flujo de la 4.1; no es un hallazgo.
3. **Los escenarios son todos del mismo juego**: una mosca sola, con estas
   reglas. Que el mejor límite quede entre 2 y 4 dice que el resultado no
   depende de un número elegido a dedo; no dice cuál es el límite de un
   equipo real. Lo útil para equipos es la dirección: **mientras más se
   espera a otros, más alto conviene el límite; mientras más cuesta cambiar
   de tarea, más bajo.**
4. **WIP 3 con 40 % de bloqueos "gana" por 0,1 tarea** (16,9 contra 16,8):
   en la práctica es un empate. Por eso la zona buena dice más que el
   "mejor".
5. Con **Weinberg completo** las terminadas se desploman desde 3 tareas
   (13,6 con 3; 5,4 con 5; 3,5 con 10): un costo de cambio así de fuerte
   hace que el límite importe muchísimo más.
