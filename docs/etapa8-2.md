# Etapa 8.2 — Las urgencias (H5a, H5b y H5c): resultados (2026-11-03)

La investigación que trajo Felipe: `docs/investigacion-urgencias.md` (copia
en `~/Desktop/Mosca del WIP/2026-11-03 Investigación urgencias.md`). Regla,
medidas y criterios fijados **antes de correr**: `docs/etapa8-2-criterios.md`
(commit `1d27a1f`). La regla en el juego: `src/brain.js`, opción
`urgenciasPorDia` (por defecto 0) y `urgencias: { entrada, duracion }` para
las variantes (commit `7e02c21`). Script de la corrida: `scripts/urgencias.mjs`
(170 combinaciones, 200 días cada una, semilla 2024 reiniciada en cada una,
paso 0,15). Números: `docs/etapa8-2-resultados.json`. PDF corto:
`~/Desktop/Mosca del WIP/2026-11-03 Etapa 8.2 Urgencias v1.pdf`.

**Veredicto H5a (cabe): SE CUMPLE.** Con 1 urgencia al día el mejor límite
sigue en 2 y se pierden 0,9 tareas normales, menos que las 1,1 que caben en
los 27 minutos que ocupó la urgencia (más 0,3 de ruido).
**Veredicto H5b (deja de servir): A MEDIAS, por la letra del criterio.** El
límite 2 se distingue de sus vecinos hasta con 5 urgencias al día; la ventaja
pasa de 1,1 a 1,0 tareas, una baja menor que el ruido. Leído en simple: el
límite **no** deja de servir (ver la sección H5b).
**Veredicto H5c (tratarlas como trabajo normal): SE CUMPLE.** Tratar la
urgencia como una tarea más (variante C) deja el tiempo por tarea normal y el
estrés iguales a los de un día sin urgencias, pero cada urgencia tarda el
doble en salir (1 h 22 min en vez de 41 min) y todas esperan.
Todo en la simulación: una mosca sola, sin holgura, un día.

Hoy no se tocó la pantalla: el juego sigue jugándose con 0 urgencias y da
exactamente la corrida oficial. Nada se subió al sitio.

## Controles (se corrieron primero; dieron lo esperado)

| Control | Resultado | |
|---|---|---|
| Con 0 urgencias, `simular-dias` da la corrida oficial | "Forma: todo bien"; `docs/corrida-oficial.json` byte a byte igual (`git diff` vacío) | ✅ |
| Con 0 urgencias, `urgencias.mjs` da la corrida oficial | Terminadas, tiempo por tarea, colillas, cafés y estrés iguales a 3 decimales en los 10 límites | ✅ |
| Invariantes de la regla (`scripts/probar-urgencias.mjs`: 4 variantes × límites 1, 2, 5, 10 × 1 y 5 al día × 20 días, 2,3 millones de pasos) | Llegan las sorteadas; nunca dos urgencias con prioridad a la vez; tareas normales en curso ≤ límite; en C todo en curso ≤ límite y ninguna con prioridad; tiempos nunca negativos; normales + urgentes = terminadas | ✅ |

## La regla, en corto (detalle en los criterios, sección 1)

Una urgencia es una tarea igual a las demás (15 a 35 minutos, se traba con
las mismas reglas) con dos diferencias: tiene prioridad total (la mosca
suelta lo que hacía y trabaja solo en ella hasta terminarla) y entra por
encima del límite, máximo una a la vez. Llega sin aviso en un minuto al azar
entre las 09:00 y las 18:00. Lo soltado queda a medias y sigue restando
concentración; el estrés sube porque hay una tarea abierta más. Nada de
estrés extra "por la interrupción". Si llega otra mientras hay una en curso,
espera al tope de "Por hacer" y entra cuando termina la anterior; se anota
cuánto esperó. Variantes ("supuesto nuestro"): **B** espera a que la mosca
termine la tarea que tiene en la mano; **C** entra al tope de "Por hacer" y
respeta el límite, como una tarea normal; **D** dura la mitad (8 a 18 min).

## Tabla principal: "con X urgencias al día, el mejor límite es Y"

Regla principal, en el mejor límite para las tareas normales. Intervalo del
95 % entre paréntesis. "Contando urgencias" suma las urgencias terminadas.

| Urgencias al día | Mejor límite | Terminadas normales (IC 95 %) | Contando urgencias | Tiempo por tarea normal | p85 | Estrés al cerrar | Cigarros | Cafés | Minutos del día en urgencias | Urgencias que esperaron |
|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | **2** | 18,0 (17,8–18,2) | 18,0 | 1 h 00 min | 1 h 24 min | 10 % | 0,0 | 5,0 | 0 | — |
| 1 | **2** | 17,1 (16,9–17,3) | 18,1 | 1 h 03 min | 1 h 33 min | 11 % | 0,0 | 5,0 | 27 | 0,0 de 1 |
| 2 | **2** | 16,2 (16,0–16,4) | 18,2 | 1 h 07 min | 1 h 41 min | 11 % | 0,0 | 5,0 | 53 | 0,1 de 2 |
| 3 | **2** | 15,1 (14,9–15,3) | 18,2 | 1 h 11 min | 1 h 47 min | 12 % | 0,0 | 5,0 | 80 | 0,4 de 3 |
| 5 | **2** | 13,5 (13,3–13,7) | 18,4 | 1 h 21 min | 2 h 03 min | 13 % | 0,0 | 5,0 | 132 | 1,2 de 5 |

Lectura simple: **el mejor límite es 2 con 0, 1, 2, 3 y 5 urgencias al día**,
y también en las tres variantes. Cada urgencia al día cuesta cerca de una
tarea normal (18,0 → 17,1 → 16,2 → 15,1 → 13,5): lo que se pierde es, casi
exacto, el tiempo que ocupa la urgencia. El total terminado (normales más
urgencias) se mantiene en 18. El estrés al cerrar sube de 10 % a 13 % con 5
al día y no hay cigarros en el límite 2. Lo que sí crece es el tiempo de cada
tarea normal (1 h 00 min → 1 h 21 min): las urgencias pasan por delante.

Terminadas normales por límite (la "U invertida" se mantiene con urgencias):

| Límite | 0 al día | 1 al día | 2 al día | 3 al día | 5 al día |
|---:|---:|---:|---:|---:|---:|
| 1 | 15,9 | 15,1 | 14,6 | 13,7 | 12,5 |
| **2** | **18,0** | **17,1** | **16,2** | **15,1** | **13,5** |
| 3 | 16,9 | 16,0 | 15,0 | 14,2 | 12,5 |
| 4 | 15,4 | 14,5 | 13,6 | 12,8 | 11,1 |
| 5 | 14,0 | 13,0 | 12,1 | 11,2 | 9,8 |
| 6 | 12,3 | 11,5 | 10,7 | 9,9 | 8,5 |
| 7 | 11,2 | 10,4 | 9,6 | 8,7 | 7,3 |
| 8 | 10,0 | 9,3 | 8,5 | 7,7 | 6,2 |
| 9 | 9,1 | 8,3 | 7,5 | 6,5 | 5,9 |
| 10 | 8,2 | 7,5 | 6,9 | 6,8 | 4,3 |

(Con 3 al día, el 10 termina 0,3 más que el 9: es la cola de la curva y la
diferencia está al borde del ruido, ±0,2 cada uno.)

## H5a (cabe): regla principal con 1 urgencia al día

- **(i) Dónde queda el mejor límite:** sigue en **2** → queda en el rango
  (2 a 4). No se movió.
- **(ii) La vara en el límite 2:** pérdida = 18,0 − 17,1 = **0,9** tareas
  normales. Las urgencias ocuparon **27 minutos** del día = **1,1** tareas
  normales de 25 min; ruido de la diferencia **0,3**; vara = **1,3**. La
  pérdida **no pasa la vara**: no hay pérdida extra por estrés ni cigarros
  (estrés al cerrar +0,8 puntos, cigarros 0,0 de más).
- En los 10 límites pasa lo mismo: la pérdida queda 0,2 a 0,7 tareas por
  debajo de lo que caben en los minutos de urgencia (tabla en el anexo). O
  sea, la mosca pierde un poco **menos** de lo que la aritmética predice,
  porque mientras trabaja la urgencia lo hace con toda la concentración.
- **Veredicto: SE CUMPLE.**

## H5b (deja de servir): regla principal con 1, 2, 3 y 5 urgencias al día

| Urgencias al día | Mejor | Vecinos | Ventaja (normales) | Intervalos que se traslapan | ¿Ya no se distinguen? |
|---:|---:|---|---:|---|---|
| 0 | 2 | 1 y 3 | 1,1 | ninguno | no |
| 1 | 2 | 1 y 3 | 1,1 | ninguno | no |
| 2 | 2 | 1 y 3 | 1,2 | ninguno | no |
| 3 | 2 | 1 y 3 | 0,9 | ninguno | no |
| 5 | 2 | 1 y 3 | 1,0 | ninguno | no |

- En ningún nivel los intervalos del mejor y de sus vecinos se traslapan: con
  5 urgencias al día el 2 (13,3–13,7) sigue separado del 1 (12,2–12,7) y del
  3 (12,3–12,7). **La simulación sigue distinguiendo el mejor límite.**
- Ventaja con 5 al día = 1,0; con 0 = 1,1. Como 1,0 < 1,1, **por la letra del
  criterio el veredicto es A MEDIAS** ("se achica sin traslaparse").
- **Lo que hay que decir con honestidad:** esa baja de 0,1 tareas es menor
  que el ruido de la diferencia (unos ±0,3). Leída con el ruido, la ventaja
  **no cambió**: la hipótesis de que "el límite deja de servir con muchas
  urgencias" **no se ve** hasta 5 al día. El criterio quedó mal planteado en
  un punto: cualquier baja, por chica que sea, cuenta como "se achica". No se
  cambia el veredicto de esta corrida. **Propuesta para una segunda corrida
  etiquetada, si Felipe la quiere:** "a medias" solo si la ventaja baja más
  que el ruido de la diferencia; con los mismos números daría **no se cumple**
  (la ventaja se mantiene). Otra lectura, con más urgencias (8 o 10 al día),
  pediría una corrida nueva.
- **Veredicto: A MEDIAS** (por la letra), con la lectura de arriba al lado.

## H5c (tratarlas como trabajo normal): variante C contra la regla principal

Comparación en el límite 2 (el mejor de la regla principal en los dos
niveles). "Ruido" = el de la diferencia; C "iguala o mejora" si no es peor
más allá del ruido.

| | 3 al día: principal → C | 5 al día: principal → C |
|---|---|---|
| Tiempo por tarea normal | 1 h 11 min → **1 h 00 min** (mejora; ruido 1,2 min) | 1 h 21 min → **1 h 01 min** (mejora; ruido 1,5 min) |
| Estrés al cerrar | 12 % → **10 %** (mejora; ruido 0,3 pts) | 13 % → **10 %** (mejora; ruido 0,3 pts) |
| Terminadas normales | 15,1 → 14,8 | 13,5 → 13,1 |
| Cada urgencia, de que llega a que termina | 41 min → **1 h 22 min** (p85: 1 h 12 min → 1 h 54 min) | 41 min → **1 h 23 min** (p85: 1 h 11 min → 1 h 54 min) |
| Espera de la urgencia hasta entrar | 4 min → 21 min | 6 min → 24 min |
| Urgencias que tuvieron que esperar | 14 % → 100 % | 24 % → 100 % |
| Urgencias sin terminar a las 18:00 | 0,2 → 0,4 | 0,4 → 0,8 |

- En los dos niveles C iguala o mejora las dos medidas → **se cumple** en
  cada nivel → **Veredicto global: SE CUMPLE.**
- Por qué: en C la urgencia respeta el límite, así que nunca hay 3 tareas
  abiertas; el tiempo por tarea normal (1 h 00 min) y el estrés (10 %) quedan
  **iguales a los de un día sin urgencias**. En la regla principal la urgencia
  entra por encima del límite y las normales esperan mientras ella pasa.
- **El precio, que siempre se informa:** en C **todas** las urgencias esperan
  y cada una tarda **el doble** en salir (1 h 22 min contra 41 min), con el
  doble de urgencias sin terminar al cierre. Las normales terminadas bajan un
  poco (0,3 a 0,4). No es gratis: es elegir a quién hacer esperar.
- En los 10 límites, C mejora el tiempo por tarea normal y el estrés (o lo
  deja igual en 6 y 10) y empeora mucho el tiempo de las urgencias: en el
  límite 10 con 5 al día, una urgencia tarda 12 h 27 min en C contra
  1 h 06 min en la principal (tabla en el anexo).

## La pregunta descriptiva: con urgencias, ¿subir el límite ayuda en algo?

**No.** Con 5 urgencias al día, regla principal:

| Límite | Terminadas normales | Contando urgencias | Cada urgencia tarda | Urgencias sin terminar al cierre | Tareas abiertas en promedio | Estrés al cerrar | Cigarros | Tiempo por tarea normal |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 12,5 | 17,4 | 40 min | 0,4 | 1,3 | 7 % | 0,0 | 43 min |
| **2** | **13,5** | **18,4** | **41 min** | 0,4 | 2,3 | 13 % | 0,0 | 1 h 21 min |
| 3 | 12,5 | 17,4 | 42 min | 0,4 | 3,3 | 23 % | 0,0 | 2 h 09 min |
| 5 | 9,8 | 14,8 | 47 min | 0,5 | 5,4 | 49 % | 4,0 | 4 h 38 min |
| 10 | 4,3 | 9,3 | 1 h 06 min | 0,7 | 10,5 | 100 % | 15,0 | 16 h 20 min |

La urgencia pasa por encima del límite de todos modos, así que un límite más
alto no la ayuda a pasar: **tarda más** (41 min con 2, 1 h 06 min con 10)
porque hay más cosas a medias restándole concentración, se terminan menos
normales (13,5 → 4,3), quedan más tareas abiertas (2,3 → 10,5), el estrés
llega al tope y aparecen los cigarros. Con 3 al día es igual (anexo). El
mensaje "subir el límite no reduce las esperas" **se refuerza** con urgencias.

## Las variantes (supuesto nuestro), en el límite 2

| Variante | Urgencias al día | Terminadas normales | Tiempo por tarea normal | Cada urgencia tarda | Esperaron | Estrés al cerrar |
|---|---:|---:|---:|---:|---:|---:|
| Principal (suelta lo que hace) | 1 · 2 · 3 · 5 | 17,1 · 16,2 · 15,1 · 13,5 | 1 h 03 · 1 h 07 · 1 h 11 · 1 h 21 | 34 · 37 · 41 · 41 min | 0 · 6 · 14 · 24 % | 11 · 11 · 12 · 13 % |
| B (termina lo que tiene en la mano) | 1 · 2 · 3 · 5 | 17,1 · 16,3 · 15,1 · 13,4 | 1 h 03 · 1 h 06 · 1 h 11 · 1 h 20 | 49 · 51 · 56 · 57 min | 95 · 96 · 95 · 97 % | 11 · 11 · 12 · 13 % |
| C (como una tarea normal más) | 1 · 2 · 3 · 5 | 17,1 · 16,0 · 14,8 · 13,1 | 1 h 00 · 1 h 00 · 1 h 00 · 1 h 01 | 1 h 17 · 1 h 18 · 1 h 22 · 1 h 23 | 99 · 99 · 100 · 100 % | 10 · 10 · 10 · 10 % |
| D (duran la mitad, 8–18 min) | 1 · 2 · 3 · 5 | 17,6 · 17,0 · 16,5 · 15,6 | 1 h 02 · 1 h 03 · 1 h 06 · 1 h 09 | 21 · 23 · 26 · 25 min | 0 · 5 · 10 · 15 % | 10 · 11 · 11 · 12 % |

- **B** termina lo mismo que la principal y con el mismo estrés; la única
  diferencia es que la urgencia espera unos 16 a 22 minutos a que la mosca
  cierre lo que tenía en la mano, así que tarda 15 minutos más. Terminar lo
  que se tiene en la mano **no cuesta nada en terminadas**; solo retrasa la
  urgencia. (Bailey y Konstan 2006 miden algo parecido con personas: la
  interrupción duele menos entre tareas que a mitad de una; aquí la mosca no
  "sufre" el corte, así que solo se ve el lado del tiempo.)
- **D**: si las urgencias duran la mitad, cuestan la mitad: con 5 al día se
  pierden 2,4 normales en vez de 4,5. Lo que cuesta es el tiempo que ocupan,
  no "la interrupción".
- El mejor límite es **2** en las tres variantes y en los cuatro niveles.

## Lo que hay que decir con cuidado

1. **Es una mosca sola, sin holgura, en un día.** Vale para una persona
   saturada con un tablero, no para un equipo. En un equipo las urgencias se
   reparten y hay más de una "vía rápida".
2. **Nadie midió esto con personas.** La regla se apoya en práctica kanban
   (Anderson 2010, verificado solo por una fuente secundaria), en que lo
   interrumpido se retoma unos 20 y tantos minutos después (Mark y otros
   2005) y en que interrumpir sube el estrés (Mark y otros 2008). Las
   variantes B, C y D son supuesto nuestro.
3. **El estrés sigue siendo el supuesto del juego** (sube con las tareas
   abiertas). En el límite 2 casi no se mueve con urgencias (10 % → 13 %)
   porque la urgencia agrega una tarea abierta por media hora. Nada de
   "estrés extra por la interrupción".
4. **H5c no dice que C sea mejor.** Dice que, si la urgencia hace fila, las
   normales no sufren; la cuenta la paga la urgencia (el doble de tiempo).
   Qué conviene depende de cuánto cuesta que una urgencia espere, y eso el
   juego no lo sabe.
5. **H5b quedó "a medias" por una letra chica del criterio** (ver arriba);
   el dato es que el límite sigue sirviendo con 5 al día.
6. **Las urgencias del juego son del mismo tamaño que las tareas normales.**
   Urgencias de 5 minutos o de 2 horas darían otra cosa (D muestra la
   dirección).
7. **El ruido de las diferencias se calculó como si las corridas fueran
   independientes**, aunque con la misma semilla comparten las llegadas.
   Es conservador: el ruido real es igual o menor.

## Lo que asumí (anotado también en los criterios)

1. **Los 3 días previos que el juego simula en silencio también traen
   urgencias** (con la misma regla): así la mañana puede empezar con una
   urgencia a medias de ayer, igual que con las tareas normales.
2. Las urgencias se sortean **después** de las tareas normales: con 0 el azar
   es idéntico al de siempre, y con la misma semilla las variantes reciben
   las mismas llegadas.
3. Si la urgencia se traba (esperando a otra persona), la mosca sigue con las
   normales y retoma la urgencia apenas se destraba. Si está fumando o en el
   café cuando llega, termina la pausa primero.
4. "En la mano" (variante B) = cualquiera de las tareas que está rotando; la
   urgencia entra cuando termina una de ellas, o al tiro si no estaba a mitad
   de ninguna (todas trabadas, fumando o en el café).
5. En C la urgencia va al tope de "Por hacer" detrás de otras urgencias,
   respeta el límite, sin prioridad al rotar, y puede haber varias en curso.
6. "Mejor límite" = el que más tareas **normales** termina (empate exacto →
   el más bajo); como información, el mejor contando urgencias (también 2).
7. La vara de H5a usa 25 minutos (la duración promedio de una tarea normal) y
   se mira en el límite 2. "Se corre un lugar" = justo un lugar fuera del
   rango 2 a 4.
8. Una urgencia que a las 18:00 sigue sin terminar cuenta como "sin terminar"
   y queda a medias para el día siguiente, como cualquier tarea.
9. La espera de una urgencia que llegó ayer y no alcanzó a entrar se cuenta
   desde ayer, en tiempo de trabajo (la noche no cuenta).

## Dos cosas de la investigación para que Felipe las vea

- El TL;DR dice que con "quiet time" la parte de ingenieros que se veía más
  productiva **"subió de 41 % a 65 %"**. Según la propia ficha (Perlow
  1999), 41 % es la fase 2 (horario de interacción de 11 a 15) y 65 % la
  fase 3 (vuelta al quiet time); la fase 1 fue 59 % y un mes después 47 %.
  Es una comparación entre fases, no un antes y después. Si se cita, mejor:
  "con horas protegidas, 59 a 65 % se veía más productivo; con horario de
  interacción, 41 %".
- La frase "una urgencia al día ocupa cerca del 5 % del día; cinco, casi un
  cuarto" **se sostiene con los números simulados en el límite 2**: 27 min
  (5 %) y 132 min (24 %). Con límites altos sube (33 min y 169 min, 6 % y
  31 %) porque la urgencia también sufre el residuo de lo que está abierto.
  Conviene decirla "en el mejor límite".
- Lo demás (fuentes, mitos a evitar, "unos 20 y tantos minutos", Anderson
  como fuente secundaria, nada de "25 interrupciones al día") se siguió al
  pie de la letra.

## Archivos

- `docs/investigacion-urgencias.md` · la investigación (copia exacta).
- `docs/etapa8-2-criterios.md` · regla, medidas y criterios (commit `1d27a1f`,
  antes de correr).
- `src/brain.js` · la regla: `urgenciasPorDia`, `urgencias: { entrada, duracion }`,
  `ENTRADAS_URGENCIA`; `estado()`, `resumenFinal()` y `medidas()` con las
  cifras de urgencias (commit `7e02c21`).
- `scripts/simular-dias.mjs` · `URGENCIAS=n` para mirar la regla principal
  (no oficial; con 0 sigue siendo la corrida oficial).
- `scripts/urgencias.mjs` · la corrida (`control`, `tablas`, `DIAS=`).
- `scripts/probar-urgencias.mjs` · los invariantes de la regla.
- `docs/etapa8-2-resultados.json` · todos los números (170 combinaciones).
- `docs/contexto/etapa8-2.html` → PDF corto `2026-11-03 Etapa 8.2 Urgencias v1.pdf`
  (`DOC=etapa8-2 node scripts/documento.mjs`).

## Publicación

Nada se subió al sitio ni a GitHub (los commits están en `main`, locales).
La pantalla (8.3) espera el OK de Felipe.

## Anexo: todas las tablas (`node scripts/urgencias.mjs tablas`)

### Regla principal: con X urgencias al día (en el mejor límite)

| Urgencias al día | Mejor límite | Terminadas normales (IC 95 %) | Contando urgencias | Tiempo por tarea normal | p85 | Estrés al cerrar | Cigarros | Cafés | Minutos en urgencias | Urgencias que esperaron |
|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | **2** | 18,0 (17,8–18,2) | 18,0 | 1 h 00 min | 1 h 24 min | 10 % | 0,0 | 5,0 | 0 | 0,0 de 0 |
| 1 | **2** | 17,1 (16,9–17,3) | 18,1 | 1 h 03 min | 1 h 33 min | 11 % | 0,0 | 5,0 | 27 | 0,0 de 1 |
| 2 | **2** | 16,2 (16,0–16,4) | 18,2 | 1 h 07 min | 1 h 41 min | 11 % | 0,0 | 5,0 | 53 | 0,1 de 2 |
| 3 | **2** | 15,1 (14,9–15,3) | 18,2 | 1 h 11 min | 1 h 47 min | 12 % | 0,0 | 5,0 | 80 | 0,4 de 3 |
| 5 | **2** | 13,5 (13,3–13,7) | 18,4 | 1 h 21 min | 2 h 03 min | 13 % | 0,0 | 5,0 | 132 | 1,2 de 5 |

### Regla principal · 0 urgencias al día, límite por límite

| Límite | Normales (IC 95 %) | Contando urg. | Tiempo normal | p85 | Tiempo por urgencia | Esperaron | Estrés al cerrar | Cigarros | Cafés | Min. urg. | Abiertas prom. |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 15,9 (15,6–16,2) | 15,9 | 34 min | 1 h 02 min | — | 0,0 | 5 % | 0,0 | 6,0 | 0 | 1,0 |
| **2** | 18,0 (17,8–18,2) | 18,0 | 1 h 00 min | 1 h 24 min | — | 0,0 | 10 % | 0,0 | 5,0 | 0 | 2,0 |
| 3 | 16,9 (16,7–17,1) | 16,9 | 1 h 36 min | 2 h 08 min | — | 0,0 | 18 % | 0,0 | 4,0 | 0 | 3,0 |
| 4 | 15,4 (15,2–15,6) | 15,4 | 2 h 20 min | 3 h 01 min | — | 0,0 | 32 % | 1,0 | 3,0 | 0 | 4,0 |
| 5 | 14,0 (13,8–14,1) | 14,0 | 3 h 14 min | 4 h 07 min | — | 0,0 | 44 % | 3,0 | 1,0 | 0 | 5,0 |
| 6 | 12,3 (12,1–12,5) | 12,3 | 4 h 24 min | 5 h 36 min | — | 0,0 | 62 % | 6,0 | 0,0 | 0 | 6,0 |
| 7 | 11,2 (10,9–11,4) | 11,2 | 5 h 40 min | 7 h 13 min | — | 0,0 | 68 % | 8,0 | 0,0 | 0 | 7,0 |
| 8 | 10,0 (9,8–10,1) | 10,0 | 7 h 11 min | 9 h 08 min | — | 0,0 | 84 % | 11,0 | 0,0 | 0 | 8,0 |
| 9 | 9,1 (9,0–9,3) | 9,1 | 8 h 54 min | 11 h 21 min | — | 0,0 | 92 % | 13,0 | 0,0 | 0 | 9,0 |
| 10 | 8,2 (8,0–8,4) | 8,2 | 10 h 34 min | 13 h 38 min | — | 0,0 | 100 % | 15,0 | 0,0 | 0 | 10,0 |

### Regla principal · 1 urgencia al día, límite por límite

| Límite | Normales (IC 95 %) | Contando urg. | Tiempo normal | p85 | Tiempo por urgencia | Esperaron | Estrés al cerrar | Cigarros | Cafés | Min. urg. | Abiertas prom. |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 15,1 (14,7–15,4) | 16,0 | 36 min | 1 h 04 min | 34 min | 0,0 | 5 % | 0,0 | 6,0 | 26 | 1,1 |
| **2** | 17,1 (16,9–17,3) | 18,1 | 1 h 03 min | 1 h 33 min | 34 min | 0,0 | 11 % | 0,0 | 5,0 | 27 | 2,1 |
| 3 | 16,0 (15,8–16,1) | 16,9 | 1 h 41 min | 2 h 16 min | 35 min | 0,0 | 19 % | 0,0 | 4,0 | 27 | 3,1 |
| 4 | 14,5 (14,4–14,7) | 15,5 | 2 h 28 min | 3 h 13 min | 37 min | 0,0 | 33 % | 1,0 | 2,4 | 28 | 4,1 |
| 5 | 13,0 (12,8–13,1) | 13,9 | 3 h 26 min | 4 h 25 min | 39 min | 0,0 | 46 % | 3,1 | 1,0 | 29 | 5,1 |
| 6 | 11,5 (11,3–11,6) | 12,4 | 4 h 38 min | 5 h 56 min | 41 min | 0,0 | 59 % | 6,0 | 0,0 | 30 | 6,1 |
| 7 | 10,4 (10,2–10,6) | 11,4 | 6 h 01 min | 7 h 42 min | 44 min | 0,0 | 70 % | 8,1 | 0,0 | 31 | 7,1 |
| 8 | 9,3 (9,1–9,4) | 10,2 | 7 h 42 min | 9 h 54 min | 46 min | 0,0 | 84 % | 11,5 | 0,0 | 31 | 8,1 |
| 9 | 8,3 (8,1–8,5) | 9,3 | 9 h 35 min | 12 h 08 min | 50 min | 0,0 | 93 % | 13,1 | 0,0 | 32 | 9,1 |
| 10 | 7,5 (7,3–7,8) | 8,5 | 11 h 38 min | 14 h 50 min | 52 min | 0,0 | 100 % | 15,0 | 0,0 | 33 | 10,1 |

### Regla principal · 2 urgencias al día, límite por límite

| Límite | Normales (IC 95 %) | Contando urg. | Tiempo normal | p85 | Tiempo por urgencia | Esperaron | Estrés al cerrar | Cigarros | Cafés | Min. urg. | Abiertas prom. |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 14,6 (14,3–14,8) | 16,6 | 37 min | 1 h 05 min | 36 min | 0,1 | 6 % | 0,0 | 6,0 | 51 | 1,1 |
| **2** | 16,2 (16,0–16,4) | 18,2 | 1 h 07 min | 1 h 41 min | 37 min | 0,1 | 11 % | 0,0 | 5,0 | 53 | 2,1 |
| 3 | 15,0 (14,9–15,2) | 17,0 | 1 h 47 min | 2 h 27 min | 37 min | 0,1 | 20 % | 0,0 | 4,0 | 54 | 3,1 |
| 4 | 13,6 (13,5–13,8) | 15,6 | 2 h 37 min | 3 h 28 min | 39 min | 0,1 | 34 % | 1,0 | 2,0 | 56 | 4,1 |
| 5 | 12,1 (12,0–12,3) | 14,1 | 3 h 40 min | 4 h 45 min | 41 min | 0,1 | 46 % | 3,4 | 1,0 | 58 | 5,1 |
| 6 | 10,7 (10,5–10,9) | 12,7 | 5 h 00 min | 6 h 25 min | 43 min | 0,2 | 59 % | 6,0 | 0,0 | 59 | 6,2 |
| 7 | 9,6 (9,4–9,8) | 11,6 | 6 h 35 min | 8 h 22 min | 46 min | 0,1 | 71 % | 8,4 | 0,0 | 61 | 7,2 |
| 8 | 8,5 (8,3–8,7) | 10,5 | 8 h 37 min | 10 h 57 min | 50 min | 0,2 | 87 % | 12,0 | 0,0 | 63 | 8,2 |
| 9 | 7,5 (7,3–7,7) | 9,4 | 10 h 33 min | 13 h 34 min | 53 min | 0,2 | 93 % | 13,8 | 0,0 | 65 | 9,2 |
| 10 | 6,9 (6,7–7,1) | 8,9 | 12 h 59 min | 16 h 23 min | 55 min | 0,2 | 100 % | 15,0 | 0,0 | 67 | 10,2 |

### Regla principal · 3 urgencias al día, límite por límite

| Límite | Normales (IC 95 %) | Contando urg. | Tiempo normal | p85 | Tiempo por urgencia | Esperaron | Estrés al cerrar | Cigarros | Cafés | Min. urg. | Abiertas prom. |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 13,7 (13,4–13,9) | 16,7 | 40 min | 1 h 08 min | 40 min | 0,4 | 6 % | 0,0 | 6,0 | 78 | 1,2 |
| **2** | 15,1 (14,9–15,3) | 18,2 | 1 h 11 min | 1 h 47 min | 41 min | 0,4 | 12 % | 0,0 | 5,0 | 80 | 2,2 |
| 3 | 14,2 (14,0–14,4) | 17,2 | 1 h 55 min | 2 h 38 min | 42 min | 0,4 | 21 % | 0,0 | 4,0 | 83 | 3,2 |
| 4 | 12,8 (12,6–12,9) | 15,8 | 2 h 50 min | 3 h 46 min | 44 min | 0,4 | 35 % | 1,2 | 2,0 | 85 | 4,2 |
| 5 | 11,2 (11,0–11,4) | 14,2 | 4 h 00 min | 5 h 15 min | 46 min | 0,5 | 47 % | 3,9 | 1,0 | 88 | 5,2 |
| 6 | 9,9 (9,8–10,1) | 13,0 | 5 h 26 min | 7 h 01 min | 49 min | 0,5 | 60 % | 6,0 | 0,0 | 91 | 6,2 |
| 7 | 8,7 (8,5–8,9) | 11,7 | 7 h 15 min | 9 h 22 min | 51 min | 0,5 | 72 % | 8,9 | 0,0 | 93 | 7,3 |
| 8 | 7,7 (7,5–7,8) | 10,7 | 9 h 30 min | 12 h 09 min | 56 min | 0,5 | 87 % | 12,0 | 0,0 | 96 | 8,3 |
| 9 | 6,5 (6,3–6,8) | 9,5 | 11 h 43 min | 15 h 05 min | 59 min | 0,6 | 95 % | 13,9 | 0,0 | 99 | 9,3 |
| 10 | 6,8 (6,6–7,0) | 9,8 | 14 h 35 min | 18 h 14 min | 1 h 02 min | 0,6 | 100 % | 15,0 | 0,0 | 102 | 10,3 |

### Regla principal · 5 urgencias al día, límite por límite

| Límite | Normales (IC 95 %) | Contando urg. | Tiempo normal | p85 | Tiempo por urgencia | Esperaron | Estrés al cerrar | Cigarros | Cafés | Min. urg. | Abiertas prom. |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 12,5 (12,2–12,7) | 17,4 | 43 min | 1 h 13 min | 40 min | 1,2 | 7 % | 0,0 | 5,7 | 128 | 1,3 |
| **2** | 13,5 (13,3–13,7) | 18,4 | 1 h 21 min | 2 h 03 min | 41 min | 1,2 | 13 % | 0,0 | 5,0 | 132 | 2,3 |
| 3 | 12,5 (12,3–12,7) | 17,4 | 2 h 09 min | 3 h 03 min | 42 min | 1,2 | 23 % | 0,0 | 4,0 | 136 | 3,3 |
| 4 | 11,1 (10,9–11,2) | 16,0 | 3 h 14 min | 4 h 25 min | 44 min | 1,3 | 37 % | 1,7 | 2,0 | 141 | 4,3 |
| 5 | 9,8 (9,6–10,0) | 14,8 | 4 h 38 min | 6 h 14 min | 47 min | 1,3 | 49 % | 4,0 | 0,9 | 145 | 5,4 |
| 6 | 8,5 (8,2–8,7) | 13,4 | 6 h 24 min | 8 h 29 min | 50 min | 1,4 | 62 % | 6,5 | 0,0 | 149 | 6,4 |
| 7 | 7,3 (7,1–7,5) | 12,3 | 8 h 52 min | 11 h 32 min | 54 min | 1,5 | 76 % | 9,3 | 0,0 | 154 | 7,4 |
| 8 | 6,2 (6,0–6,4) | 11,2 | 11 h 38 min | 15 h 05 min | 59 min | 1,6 | 88 % | 12,1 | 0,0 | 159 | 8,4 |
| 9 | 5,9 (5,7–6,1) | 10,9 | 15 h 16 min | 19 h 11 min | 1 h 03 min | 1,7 | 96 % | 14,0 | 0,0 | 164 | 9,5 |
| 10 | 4,3 (4,1–4,5) | 9,3 | 16 h 20 min | 20 h 48 min | 1 h 06 min | 1,8 | 100 % | 15,0 | 0,0 | 169 | 10,5 |

### H5a · la vara, límite por límite (0 contra 1 urgencia al día)

| Límite | Pérdida de normales | Caben en los minutos de urgencia | Ruido | Vara | ¿Pasa la vara? | De más (pérdida − caben) | Cigarros de más | Estrés al cerrar de más |
|---:|---:|---:|---:|---:|---|---:|---:|---:|
| 1 | 0,8 | 1,0 | 0,4 | 1,5 | no | -0,2 | 0,0 | 0,5 pts |
| **2** | 0,9 | 1,1 | 0,3 | 1,3 | no | -0,2 | 0,0 | 0,8 pts |
| 3 | 0,9 | 1,1 | 0,2 | 1,3 | no | -0,2 | 0,0 | 1,4 pts |
| 4 | 0,9 | 1,1 | 0,2 | 1,4 | no | -0,2 | 0,0 | 1,3 pts |
| 5 | 1,0 | 1,2 | 0,2 | 1,4 | no | -0,2 | 0,1 | 1,5 pts |
| 6 | 0,9 | 1,2 | 0,3 | 1,4 | no | -0,3 | 0,0 | -3,4 pts |
| 7 | 0,7 | 1,2 | 0,3 | 1,5 | no | -0,5 | 0,1 | 1,9 pts |
| 8 | 0,7 | 1,3 | 0,3 | 1,5 | no | -0,6 | 0,5 | -0,4 pts |
| 9 | 0,8 | 1,3 | 0,3 | 1,6 | no | -0,5 | 0,1 | 0,8 pts |
| 10 | 0,6 | 1,3 | 0,3 | 1,6 | no | -0,7 | 0,0 | 0,0 pts |

### H5b · el mejor y sus vecinos

| Urgencias al día | Mejor | Vecinos | Ventaja (normales) | Se traslapa con | ¿Ya no se distinguen? |
|---:|---:|---|---:|---|---|
| 0 | 2 | 1 y 3 | 1,1 | ninguno | no |
| 1 | 2 | 1 y 3 | 1,1 | ninguno | no |
| 2 | 2 | 1 y 3 | 1,2 | ninguno | no |
| 3 | 2 | 1 y 3 | 0,9 | ninguno | no |
| 5 | 2 | 1 y 3 | 1,0 | ninguno | no |

### H5c · 3 al día, límite por límite (regla principal → variante C)

| Límite | Normales | Tiempo normal | Estrés al cerrar | Tiempo por urgencia |
|---:|---|---|---|---|
| 1 | 13,7 → 12,5 | 40 min → 35 min | 6 % → 5 % | 40 min → 1 h 01 min |
| **2** | 15,1 → 14,8 | 1 h 11 min → 1 h 00 min | 12 % → 10 % | 41 min → 1 h 22 min |
| 3 | 14,2 → 13,7 | 1 h 55 min → 1 h 36 min | 21 % → 18 % | 42 min → 2 h 03 min |
| 4 | 12,8 → 12,3 | 2 h 50 min → 2 h 21 min | 35 % → 32 % | 44 min → 2 h 54 min |
| 5 | 11,2 → 10,7 | 4 h 00 min → 3 h 15 min | 47 % → 44 % | 46 min → 3 h 53 min |
| 6 | 9,9 → 9,2 | 5 h 26 min → 4 h 23 min | 60 % → 62 % | 49 min → 5 h 10 min |
| 7 | 8,7 → 8,0 | 7 h 15 min → 5 h 42 min | 72 % → 68 % | 51 min → 6 h 32 min |
| 8 | 7,7 → 7,0 | 9 h 30 min → 7 h 16 min | 87 % → 84 % | 56 min → 8 h 18 min |
| 9 | 6,5 → 6,2 | 11 h 43 min → 8 h 58 min | 95 % → 92 % | 59 min → 10 h 01 min |
| 10 | 6,8 → 5,3 | 14 h 35 min → 10 h 35 min | 100 % → 100 % | 1 h 02 min → 11 h 57 min |

### H5c · 5 al día, límite por límite (regla principal → variante C)

| Límite | Normales | Tiempo normal | Estrés al cerrar | Tiempo por urgencia |
|---:|---|---|---|---|
| 1 | 12,5 → 10,9 | 43 min → 34 min | 7 % → 5 % | 40 min → 1 h 02 min |
| **2** | 13,5 → 13,1 | 1 h 21 min → 1 h 01 min | 13 % → 10 % | 41 min → 1 h 23 min |
| 3 | 12,5 → 11,9 | 2 h 09 min → 1 h 36 min | 23 % → 18 % | 42 min → 2 h 04 min |
| 4 | 11,1 → 10,5 | 3 h 14 min → 2 h 21 min | 37 % → 32 % | 44 min → 2 h 54 min |
| 5 | 9,8 → 9,0 | 4 h 38 min → 3 h 14 min | 49 % → 44 % | 47 min → 3 h 55 min |
| 6 | 8,5 → 7,4 | 6 h 24 min → 4 h 25 min | 62 % → 62 % | 50 min → 5 h 16 min |
| 7 | 7,3 → 5,9 | 8 h 52 min → 5 h 43 min | 76 % → 68 % | 54 min → 6 h 41 min |
| 8 | 6,2 → 4,8 | 11 h 38 min → 7 h 16 min | 88 % → 84 % | 59 min → 8 h 28 min |
| 9 | 5,9 → 3,9 | 15 h 16 min → 9 h 02 min | 96 % → 92 % | 1 h 03 min → 10 h 20 min |
| 10 | 4,3 → 3,1 | 16 h 20 min → 10 h 30 min | 100 % → 100 % | 1 h 06 min → 12 h 27 min |

### Variantes · el mejor límite por nivel

| Variante | Urgencias al día | Mejor | Normales | Tiempo normal | Tiempo por urgencia | Esperaron | Estrés al cerrar | Cigarros | Sin terminar al cierre |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Principal | 0 | 2 | 18,0 | 1 h 00 min | — | — % | 10 % | 0,0 | 0,0 |
| Principal | 1 | 2 | 17,1 | 1 h 03 min | 34 min | 0 % | 11 % | 0,0 | 0,1 |
| Principal | 2 | 2 | 16,2 | 1 h 07 min | 37 min | 6 % | 11 % | 0,0 | 0,1 |
| Principal | 3 | 2 | 15,1 | 1 h 11 min | 41 min | 14 % | 12 % | 0,0 | 0,2 |
| Principal | 5 | 2 | 13,5 | 1 h 21 min | 41 min | 24 % | 13 % | 0,0 | 0,4 |
| B | 1 | 2 | 17,1 | 1 h 03 min | 49 min | 95 % | 11 % | 0,0 | 0,1 |
| B | 2 | 2 | 16,3 | 1 h 06 min | 51 min | 96 % | 11 % | 0,0 | 0,2 |
| B | 3 | 2 | 15,1 | 1 h 11 min | 56 min | 95 % | 12 % | 0,0 | 0,3 |
| B | 5 | 2 | 13,4 | 1 h 20 min | 57 min | 97 % | 13 % | 0,0 | 0,5 |
| C | 1 | 2 | 17,1 | 1 h 00 min | 1 h 17 min | 99 % | 10 % | 0,0 | 0,2 |
| C | 2 | 2 | 16,0 | 1 h 00 min | 1 h 18 min | 99 % | 10 % | 0,0 | 0,3 |
| C | 3 | 2 | 14,8 | 1 h 00 min | 1 h 22 min | 100 % | 10 % | 0,0 | 0,4 |
| C | 5 | 2 | 13,1 | 1 h 01 min | 1 h 23 min | 100 % | 10 % | 0,0 | 0,8 |
| D | 1 | 2 | 17,6 | 1 h 02 min | 21 min | 0 % | 10 % | 0,0 | 0,0 |
| D | 2 | 2 | 17,0 | 1 h 03 min | 23 min | 5 % | 11 % | 0,0 | 0,1 |
| D | 3 | 2 | 16,5 | 1 h 06 min | 26 min | 10 % | 11 % | 0,0 | 0,1 |
| D | 5 | 2 | 15,6 | 1 h 09 min | 25 min | 15 % | 12 % | 0,0 | 0,3 |

### Variante B · por nivel y límite (normales · tiempo por urgencia · estrés al cerrar)

| Límite | 1 al día | 2 al día | 3 al día | 5 al día |
|---:|---|---|---|---|
| 1 | 15,1 · 41 min · 5 % | 14,6 · 44 min · 6 % | 13,7 · 49 min · 6 % | 12,7 · 49 min · 7 % |
| 2 | 17,1 · 49 min · 11 % | 16,3 · 51 min · 11 % | 15,1 · 56 min · 12 % | 13,4 · 57 min · 13 % |
| 3 | 16,0 · 56 min · 20 % | 15,1 · 59 min · 20 % | 14,2 · 1 h 01 min · 21 % | 12,5 · 1 h 02 min · 24 % |
| 4 | 14,5 · 1 h 00 min · 33 % | 13,7 · 1 h 03 min · 34 % | 12,7 · 1 h 09 min · 35 % | 11,1 · 1 h 07 min · 37 % |
| 5 | 13,0 · 1 h 05 min · 45 % | 12,2 · 1 h 04 min · 46 % | 11,2 · 1 h 12 min · 47 % | 9,8 · 1 h 13 min · 50 % |
| 6 | 11,6 · 1 h 03 min · 59 % | 10,8 · 1 h 06 min · 59 % | 9,9 · 1 h 11 min · 60 % | 8,5 · 1 h 12 min · 62 % |
| 7 | 10,4 · 1 h 04 min · 70 % | 9,7 · 1 h 06 min · 71 % | 8,8 · 1 h 11 min · 72 % | 7,2 · 1 h 14 min · 76 % |
| 8 | 9,2 · 1 h 02 min · 83 % | 8,5 · 1 h 06 min · 87 % | 7,7 · 1 h 11 min · 87 % | 6,2 · 1 h 13 min · 88 % |
| 9 | 8,4 · 1 h 05 min · 93 % | 7,5 · 1 h 06 min · 93 % | 6,5 · 1 h 12 min · 95 % | 5,8 · 1 h 17 min · 96 % |
| 10 | 7,6 · 1 h 04 min · 100 % | 6,9 · 1 h 07 min · 100 % | 6,8 · 1 h 14 min · 100 % | 4,4 · 1 h 20 min · 100 % |

### Variante C · por nivel y límite (normales · tiempo por urgencia · estrés al cerrar)

| Límite | 1 al día | 2 al día | 3 al día | 5 al día |
|---:|---|---|---|---|
| 1 | 14,8 · 56 min · 5 % | 13,8 · 57 min · 5 % | 12,5 · 1 h 01 min · 5 % | 10,9 · 1 h 02 min · 5 % |
| 2 | 17,1 · 1 h 17 min · 10 % | 16,0 · 1 h 18 min · 10 % | 14,8 · 1 h 22 min · 10 % | 13,1 · 1 h 23 min · 10 % |
| 3 | 15,9 · 2 h 00 min · 18 % | 14,9 · 2 h 00 min · 18 % | 13,7 · 2 h 03 min · 18 % | 11,9 · 2 h 04 min · 18 % |
| 4 | 14,5 · 2 h 47 min · 32 % | 13,6 · 2 h 46 min · 32 % | 12,3 · 2 h 54 min · 32 % | 10,5 · 2 h 54 min · 32 % |
| 5 | 12,9 · 3 h 47 min · 44 % | 12,0 · 3 h 43 min · 44 % | 10,7 · 3 h 53 min · 44 % | 9,0 · 3 h 55 min · 44 % |
| 6 | 11,3 · 4 h 57 min · 62 % | 10,2 · 5 h 01 min · 62 % | 9,2 · 5 h 10 min · 62 % | 7,4 · 5 h 16 min · 62 % |
| 7 | 10,1 · 6 h 23 min · 68 % | 9,2 · 6 h 24 min · 68 % | 8,0 · 6 h 32 min · 68 % | 5,9 · 6 h 41 min · 68 % |
| 8 | 9,0 · 8 h 13 min · 84 % | 7,9 · 7 h 51 min · 84 % | 7,0 · 8 h 18 min · 84 % | 4,8 · 8 h 28 min · 84 % |
| 9 | 8,2 · 9 h 52 min · 92 % | 7,1 · 9 h 45 min · 92 % | 6,2 · 10 h 01 min · 92 % | 3,9 · 10 h 20 min · 92 % |
| 10 | 7,4 · 11 h 49 min · 100 % | 6,3 · 11 h 41 min · 100 % | 5,3 · 11 h 57 min · 100 % | 3,1 · 12 h 27 min · 100 % |

### Variante D · por nivel y límite (normales · tiempo por urgencia · estrés al cerrar)

| Límite | 1 al día | 2 al día | 3 al día | 5 al día |
|---:|---|---|---|---|
| 1 | 15,3 · 21 min · 5 % | 15,2 · 23 min · 5 % | 14,5 · 26 min · 6 % | 14,2 · 25 min · 6 % |
| 2 | 17,6 · 21 min · 10 % | 17,0 · 23 min · 11 % | 16,5 · 26 min · 11 % | 15,6 · 25 min · 12 % |
| 3 | 16,4 · 22 min · 19 % | 15,9 · 24 min · 19 % | 15,4 · 27 min · 20 % | 14,5 · 26 min · 22 % |
| 4 | 14,9 · 23 min · 33 % | 14,6 · 24 min · 33 % | 14,1 · 28 min · 34 % | 13,1 · 26 min · 35 % |
| 5 | 13,3 · 23 min · 45 % | 13,0 · 26 min · 45 % | 12,3 · 29 min · 46 % | 11,7 · 28 min · 48 % |
| 6 | 11,9 · 25 min · 58 % | 11,5 · 27 min · 58 % | 10,9 · 30 min · 59 % | 10,4 · 30 min · 60 % |
| 7 | 10,8 · 27 min · 69 % | 10,3 · 28 min · 70 % | 9,9 · 32 min · 71 % | 9,1 · 31 min · 73 % |
| 8 | 9,6 · 28 min · 85 % | 9,2 · 30 min · 84 % | 8,7 · 34 min · 85 % | 8,1 · 33 min · 87 % |
| 9 | 8,9 · 29 min · 92 % | 8,4 · 31 min · 92 % | 7,8 · 35 min · 93 % | 7,0 · 35 min · 95 % |
| 10 | 8,0 · 30 min · 100 % | 7,3 · 33 min · 100 % | 7,0 · 36 min · 100 % | 6,9 · 36 min · 100 % |
