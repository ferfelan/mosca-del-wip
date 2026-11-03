# Etapa 8.2 — Urgencias (H5): la regla y los criterios, fijados ANTES de correr

> Guardado en git el 2026-11-03, antes de correr cualquier simulación con
> urgencias. La regla, las medidas y los criterios son los del pedido de
> Felipe (copiado al final) y de la investigación que trajo
> (`docs/investigacion-urgencias.md`, secciones 4 y 5). Donde algo quedó
> abierto, aquí se elige lo más razonable, marcado como **decisión nuestra**,
> antes de ver un solo número. **Después de ver resultados no se cambia
> nada**: si un criterio resultó mal planteado, se dice tal cual y se propone
> otro para una segunda corrida, rotulada como tal.

**H5, en tres partes** (redacción de la investigación, sección 5):

- **H5a (cabe):** con pocas urgencias, el mejor límite para las tareas
  normales sigue en el mismo rango que sin urgencias (2 a 4 con esperas).
- **H5b (deja de servir):** a medida que suben las urgencias, la ventaja del
  mejor límite sobre sus vecinos se achica hasta no distinguirse.
- **H5c (tratarlas como trabajo normal):** con muchas urgencias, tratar la
  urgencia como una tarea normal más (variante C) da a las tareas normales un
  resultado igual o mejor que la vía rápida, a cambio de que las urgencias
  esperen más.
- **Pregunta descriptiva, sin criterio:** con urgencias, ¿subir el límite
  ayuda en algo o solo deja más cosas a medias? Es razonamiento nuestro a
  comprobar, no un estudio.

Dos cuidados con las fuentes (pedido de Felipe): el libro de Anderson (2010)
quedó verificado solo por un resumen de terceros, así que se cita como
**fuente secundaria**; el tiempo para retomar una tarea interrumpida se cita
como **"unos 20 y tantos minutos"** (Mark, González y Harris 2005), nunca como
23 ni 25 exactos. La cifra "25 interrupciones al día" no se usa (sin
verificar).

## 1. La regla principal (entra a `src/brain.js`, apagada por defecto)

Una opción nueva, `urgenciasPorDia`, que **por defecto es 0**. Con 0, el juego
tiene que dar **exactamente** los mismos números de la corrida oficial
(semilla 2024): la tabla de 1 a 10 idéntica y `simular-dias` en "Forma: todo
bien". Si no es idéntica, se para y se avisa a Felipe. La pantalla no se toca
hoy (eso es la 8.3).

1. **Qué es una urgencia.** Una tarea igual a las demás: dura de 15 a 35
   minutos (al azar, parejo) y puede trabarse esperando a otra persona con
   las mismas reglas (20 % de las tareas, de 30 a 60 minutos, una vez). Va
   marcada como urgente.
2. **Cuándo llega.** `urgenciasPorDia` momentos al azar, repartidos parejo
   entre las 09:00 y las 18:00, sin aviso. *Decisión nuestra:* las llegadas y
   el tamaño de cada urgencia se sortean al armar el día, **después** de
   sortear las tareas normales. Así, con 0 urgencias el azar es idéntico al de
   hoy, y con la misma semilla las variantes B, C y D reciben las mismas
   tareas normales, las mismas horas de llegada y los mismos tamaños (D los
   escala a su rango): se comparan entre sí con los mismos días.
3. **Cómo entra.** Por encima del límite, **máximo una a la vez**. Si no hay
   otra urgencia en curso, entra al tiro a "En curso"; la mosca **suelta lo
   que estaba haciendo y trabaja solo en ella hasta terminarla**.
4. **Cómo trabaja mientras hay una urgencia.** Con las reglas que ya existen:
   está enfocada en una sola tarea (no alterna), así que rinde el 100 % de
   "una tarea a la vez", **menos el 3 % por cada tarea abierta que quedó
   esperando** (el residuo de siempre: lo que soltó sigue restando
   concentración). El estrés sube porque hay **una tarea abierta más**
   (el techo de siempre según las tareas abiertas; con más de 10 abiertas, el
   techo es el de 10). **Nada de estrés extra "por la interrupción"** en la
   corrida principal.
5. **Si la urgencia se traba.** Ocupa su lugar en "En curso" (suma estrés y
   residuo) y, mientras espera a la otra persona, la mosca vuelve a sus tareas
   normales; al destrabarse, la prioridad total vuelve. *Decisión nuestra:* es
   lo que hoy pasa con cualquier tarea trabada ("con las mismas reglas").
6. **Segunda urgencia mientras hay una en curso.** Espera al tope de "Por
   hacer" y entra apenas se termina la anterior. Se registra cuánto esperó.
7. **Fumar y café.** Si llega mientras la mosca fuma o toma café, entra a "En
   curso" (ya cuenta para el estrés) y la trabaja al volver; la pausa no se
   corta. *Decisión nuestra:* la regla pedida es que suelte la tarea, no la
   pausa (8 minutos un cigarro, 1,5 un café, como siempre).
8. **Al retomar.** Cuando termina la urgencia, la mosca sigue rotando entre
   sus tareas normales donde iba.
9. **Las urgencias cuentan como terminadas**, pero las tablas muestran
   **siempre las dos cifras**: terminadas sin contar urgencias y contándolas.
   Una urgencia que a las 18:00 no alcanzó a terminar queda como "sin
   terminar" ese día (se informa cuántas).
10. **Los 3 días previos** que el juego simula en silencio. *Decisión
    nuestra:* **también traen urgencias**, con la misma regla y la misma
    cantidad por día. La mosca vive en ese mundo: lo que amanece en "En curso"
    (incluida una urgencia a medias, o una que llegó tarde y espera) es lo de
    un día típico con urgencias, y el tiempo por tarea de las normales refleja
    ese mundo y no uno sin urgencias. Lo de ayer pasa con su tiempo acumulado,
    como hoy (la noche no cuenta). La alternativa (días previos sin
    urgencias) habría dejado el primer tramo del día "demasiado limpio".

## 2. Las variantes ("supuesto nuestro", solo para la sensibilidad; no entran al juego)

- **B · termina lo que tiene en la mano** (inspirada en Bailey y Konstan
  2006: interrumpir a mitad de tarea cuesta más que entre tareas). La
  urgencia espera a que la mosca termine la tarea que tiene en la mano y
  recién ahí entra. **Qué es "en la mano" en el juego:** la mosca alterna en
  cada paso entre las tareas que está rotando (hasta el límite), así que no
  hay una sola tarea "en la mano"; definimos "en la mano" como **ese conjunto**
  y "terminar la que tiene en la mano" como **el próximo momento en que
  termina una de ellas**: el primer momento en que está "entre tareas", que
  es lo que distingue Bailey y Konstan. Si al llegar la urgencia la mosca no
  está trabajando ninguna (todas trabadas, fumando o tomando café), no está a
  mitad de nada y entra al tiro. *Alternativa descartada:* esperar a que
  termine la tarea exacta del paso en que llegó; como la mosca sigue rotando y
  no se queda en esa, la espera sería larguísima (del orden de una hora y
  media con 5 tareas) y sin sentido. Lo demás, como la principal: una a la
  vez, por encima del límite, la segunda espera.
- **C · como una tarea normal más** (la que prueba H5c). La urgencia entra al
  tope de "Por hacer" (detrás de otras urgencias que ya esperen) y **respeta
  el límite**: pasa a "En curso" cuando se libera un lugar y desde ahí se
  trabaja en la rotación, sin prioridad. Como es una tarea normal más, no hay
  "una a la vez": puede haber varias en curso. Se informa cuánto esperan.
- **D · duran la mitad.** Igual que la principal, pero cada urgencia dura de 8
  a 18 minutos (el bloqueo igual: 20 %, de 30 a 60 minutos).

## 3. Cómo se corre

- Script nuevo `scripts/urgencias.mjs`, con **la misma simulación de
  `simular-dias`**: 200 días por combinación, pasos de 0,15 minutos, los 3
  días previos, **semilla 2024 reiniciada en cada combinación** (variante ×
  urgencias al día × límite).
- Combinaciones: regla principal con 0, 1, 2, 3 y 5 urgencias al día ×
  límites de 1 a 10; variantes B, C y D con 1, 2, 3 y 5 × límites de 1 a 10.
  Son 170 combinaciones.
- `simular-dias` gana una opción `URGENCIAS=n` solo para mirar la tabla con
  urgencias; con ella no revisa la forma ni escribe la corrida oficial.
- Resultados en `docs/etapa8-2-resultados.json`; informe en
  `docs/etapa8-2.md`.

## 4. Controles (se revisan primero; si no dan, se para y se avisa)

1. **Idéntico con 0.** `node scripts/simular-dias.mjs` sigue diciendo "Forma:
   todo bien" y `docs/corrida-oficial.json` **no cambia ni en un decimal**
   (`git diff` vacío).
2. **El script nuevo con 0 urgencias** da exactamente las terminadas, el
   tiempo por tarea, las colillas, los cafés y el estrés de la corrida
   oficial, límite por límite.
3. **Aritmética de las urgencias** (en una corrida de control con los días
   revisados paso a paso): llegan `urgenciasPorDia` por día; con la regla
   principal, B y D nunca hay más de una urgencia con prioridad en curso y las
   tareas normales en curso nunca pasan del límite; con C, "En curso" nunca
   pasa del límite.

## 5. Lo que se mide (por combinación, 200 días)

1. **Terminadas** sin contar urgencias y contándolas (promedio por día). Para
   las normales, también el **intervalo de confianza del 95 %**.
2. **Tiempo por tarea de las normales**: promedio (suma ÷ suma, como el juego)
   y **percentil 85** de todas las normales terminadas en los 200 días. En
   minutos de oficina en "En curso", contando lo de días anteriores; la noche
   no cuenta (igual que el juego).
3. **Urgencias**: tiempo desde que llega hasta que termina (promedio y
   percentil 85, minutos de oficina), cuántas por día **tuvieron que esperar**
   para entrar (y cuánto, en promedio) y cuántas quedaron sin terminar al
   cerrar.
4. **Estrés al cerrar**: el % de estrés a las 18:00, promedio de los 200 días
   (con su intervalo del 95 %). Como información, el estrés promedio y el
   máximo del día. **Cigarros y cafés** por día.
5. **Minutos del día ocupados por urgencias**: los minutos en que el turno de
   la mosca fue a una urgencia.
6. **Mejor límite** = el que más termina (la regla de siempre; empate exacto →
   el más bajo). *Decisión nuestra:* se cuenta con las **terminadas normales**,
   porque H5 pregunta por el límite para las tareas normales; como
   información, también el mejor contando urgencias.
7. **Intervalo de confianza del 95 %** = promedio ± 1,96 × desviación estándar
   de los 200 días ÷ √200. Para una diferencia entre dos combinaciones, el
   ruido = 1,96 × √(EE₁² + EE₂²), con EE el error estándar de cada una.

## 6. Criterios

### H5a (cabe): regla principal con 1 urgencia al día

Referencia: con 0 urgencias el mejor límite es 2 (corrida oficial) y el rango
"con esperas" de la 4.2 es **2 a 4**.

- **(i) Dónde queda el mejor límite** con 1 urgencia al día:
  - en 2, 3 o 4 → **queda en el rango**;
  - en 1 o en 5 → **se corre un lugar** (justo un lugar fuera del rango);
  - en 6 o más → **se sale del rango**.
  *Interpretación* del pedido ("queda en el mismo rango → se cumple; se corre
  un lugar → a medias; se sale del rango → no se cumple"): leído al pie de la
  letra, un mejor en 3 sería a la vez "en el rango" y "corrido un lugar"
  respecto del 2; por eso "se corre un lugar" se lee como un lugar **fuera**
  del rango. Como información se dice si el mejor se movió respecto del 2.
- **(ii) La vara.** Se mira en el límite 2 (el mejor con 0 urgencias):
  **pérdida** = terminadas normales con 0 urgencias − terminadas normales con
  1 urgencia, las dos en el límite 2. **Vara** = minutos del día ocupados por
  urgencias (con 1 al día, límite 2) ÷ 25 (la duración promedio de una tarea
  normal: de 15 a 35 repartido parejo) **+ el ruido** de la simulación (el de
  la diferencia, punto 7 de la sección 5). Si la pérdida es mayor que la
  vara, hay algo más (estrés, cigarros, residuo) y se dice de dónde sale. Como
  información se muestran pérdida y vara en los 10 límites.
- **Veredicto:**
  - **Se cumple** si (i) queda en el rango y (ii) la pérdida no pasa la vara.
  - **A medias** si (i) se corre un lugar y (ii) se cumple, o si (i) queda en
    el rango pero (ii) la pérdida pasa la vara.
  - **No se cumple** si (i) se sale del rango, o si fallan (i) y (ii).

### H5b (deja de servir): regla principal con 1, 2, 3 y 5 urgencias al día

- Para cada nivel L: el mejor límite m (por terminadas normales) y sus
  vecinos m − 1 y m + 1 (si m = 1 solo hay vecino de arriba; si m = 10, solo
  de abajo).
- **"Se traslapan" en L:** el intervalo del 95 % de las terminadas normales
  del mejor se traslapa con el intervalo de **cada** vecino (si solo se
  traslapa con uno, no cuenta como traslape, y se informa).
- **Ventaja(L)** = terminadas normales del mejor − las del mejor de sus
  vecinos. Ventaja(0) es la referencia (con 0 urgencias).
- **Veredicto:**
  - **Se cumple** si hay un nivel entre 1, 2, 3 y 5 en que se traslapan
    (la simulación ya no los distingue); se informa el primer nivel en que
    pasa.
  - **A medias** si en ningún nivel se traslapan, pero la ventaja con 5 al día
    es menor que con 0 (se achica sin traslaparse).
  - **No se cumple** si la ventaja con 5 al día es igual o mayor que con 0 (la
    ventaja se mantiene).

### H5c (tratarlas como trabajo normal): variante C contra la regla principal, con 3 y con 5 al día

- Se compara en el **mejor límite de la regla principal** de ese nivel, el
  mismo límite para C; como información, en los 10 límites.
- Dos medidas: **tiempo por tarea normal** (promedio) y **estrés al cerrar**.
  "C iguala o mejora" en una medida = su valor no es peor más allá del ruido:
  C − principal ≤ ruido de la diferencia. "C empeora" = C − principal > ruido.
- **Por nivel** (3 y 5): **se cumple** si C iguala o mejora las dos medidas;
  **a medias** si mejora o iguala una y empeora la otra; **no se cumple** si
  empeora las dos.
- **Veredicto global:** **se cumple** si los dos niveles se cumplen; **no se
  cumple** si en los dos niveles no se cumple; **a medias** en cualquier otro
  caso.
- **Siempre se informa cuánto más esperan las urgencias en C**: el tiempo
  desde que llega hasta que termina y la espera hasta entrar, contra la regla
  principal.

### La pregunta descriptiva (sin criterio)

Con 3 y con 5 urgencias al día, por límite de 1 a 10: terminadas normales,
tiempo por tarea normal, tiempo por urgencia, estrés al cerrar, cigarros y
tareas abiertas en promedio. Nuestro razonamiento a comprobar: la urgencia
pasa por encima del límite de todos modos, así que un límite más alto no la
ayuda a pasar; solo deja más cosas a medias cuando llega (más residuo y más
estrés). Si la simulación lo confirma, el mensaje "subir el límite no reduce
las esperas" se refuerza con urgencias; si no, se dice.

## 7. Los límites de todo esto (van en el informe)

- Es **una mosca sola, sin holgura** (siempre tiene trabajo esperando: la pila
  de pendientes no se acaba), **un día** de 9 horas.
- Vale para **una persona saturada**, no para un equipo: en un equipo otra
  persona puede tomar la urgencia o el equipo puede rotar quién la atiende.
- **Nadie ha medido esto con personas.** Lo que respalda "cuántas urgencias
  aguanta" es modelo o práctica, no medición; la respuesta numérica es "en la
  simulación".
- En el juego la urgencia solo cuesta: no modelamos lo que aporta (en Perlow
  1999, el 96 % de las interrupciones les parecía útil a los ingenieros).

## 8. El pedido de Felipe (2026-11-03, copia textual)

Lee CLAUDE.md, PROGRESO.md, docs/NORTE.md y docs/etapa4-plan.md (para repetir el método). Sigue la Etapa 8, parte 8.2: las urgencias. Hoy no se toca la pantalla: solo la regla, los criterios en git y la simulación. Trabaja solo; si algo no está claro, elige lo más razonable y anótalo.

1. LA INVESTIGACIÓN
En ~/Downloads hay un archivo .md cuyo nombre empieza con "Urgencias en la Mosca del WIP". Cópialo a docs/investigacion-urgencias.md y a la carpeta del Escritorio como "2026-11-03 Investigación urgencias.md" (actualiza el LEEME). Léelo entero. Salió de una herramienta que busca en internet: tómalo como referencia y, si algo te parece mal, dímelo. Usa su sección 4 (recomendación para la regla) y su sección 5 (H5 y criterios) como base de lo que sigue.
Dos cuidados que pide: el libro de Anderson quedó verificado solo por un resumen de terceros (cítalo como "fuente secundaria"), y el tiempo para retomar una tarea interrumpida se cita como "unos 20 y tantos minutos" (Mark y otros, 2005), no como 23 ni 25 exactos. No uses la cifra "25 interrupciones al día": quedó sin verificar.

2. LA REGLA (una sola, con opción apagada por defecto)
Agrega las urgencias a src/brain.js como una opción que por defecto está en 0 urgencias al día. Con 0, el juego tiene que dar exactamente los mismos números de la corrida oficial (semilla 2024): comprueba que la tabla de 1 a 10 sea idéntica y que simular-dias siga en "Forma: todo bien". Si no es idéntica, no sigas y avísame.
Una urgencia es una tarea igual a las demás (dura de 15 a 35 minutos y puede trabarse esperando a otra persona, con las mismas reglas), con dos diferencias: tiene prioridad total (la mosca suelta lo que estaba haciendo y trabaja solo en ella hasta terminarla) y entra por encima del límite, máximo una a la vez. Llega sin aviso, en un momento al azar entre las 09:00 y las 18:00. Lo que la mosca soltó queda a medias y sigue restando concentración, y el estrés sube porque es una tarea abierta más: todo con las reglas que ya existen. Nada de estrés extra "por la interrupción" en la corrida principal. Si llega una segunda urgencia mientras hay una en curso, espera al tope de "Por hacer" y entra apenas se termina la anterior; se registra cuánto esperó. Las urgencias cuentan como terminadas, pero las tablas muestran siempre las dos cifras: terminadas sin contar urgencias y contándolas. Decide tú si los 3 días previos que el juego simula en silencio también traen urgencias; lo que elijas, anótalo.
Variantes, rotuladas "supuesto nuestro", para la sección de sensibilidad:
- B: la urgencia espera a que la mosca termine la tarea que tiene en la mano en ese momento y recién ahí entra (inspirada en Bailey y Konstan, 2006). Define qué es "en la mano" en el juego y anótalo.
- C: la urgencia entra al tope de "Por hacer" y respeta el límite, como una tarea normal más. Es la que prueba H5c.
- D: igual que la principal, pero las urgencias duran la mitad (de 8 a 18 minutos).

3. H5 Y SUS CRITERIOS, EN GIT ANTES DE CORRER
Escribe docs/etapa8-2-criterios.md y haz commit antes de correr cualquier simulación. Después de ver resultados no se cambian: si un criterio resultó mal planteado, se dice tal cual y se propone otro para una segunda corrida, rotulada.
- H5a (cabe): con 1 urgencia al día (regla principal), el mejor límite para las tareas normales queda en el mismo rango que con 0 (2 a 4 con esperas) → se cumple; se corre un lugar → a medias; se sale del rango → no se cumple. Además, la pérdida de tareas normales no puede ser mayor que la "vara": las tareas normales que caben en los minutos que ocuparon las urgencias (minutos de urgencia dividido por la duración promedio de una tarea normal), más el ruido de la simulación. Si se pierde más que eso, hay algo más (estrés, cigarros) y se dice.
- H5b (deja de servir): se cumple en el nivel de urgencias (1, 2, 3 o 5 al día) en que los intervalos de confianza del 95 % de las terminadas normales del mejor límite y de sus vecinos (uno más y uno menos) se traslapan, es decir, cuando la simulación ya no los distingue. Se achican sin traslaparse → a medias. La ventaja se mantiene con 5 al día → no se cumple.
- H5c (tratarlas como trabajo normal): con 3 y con 5 urgencias al día, la variante C iguala o mejora a la regla principal en tiempo por tarea normal y en estrés al cerrar → se cumple; mejora una cosa y empeora la otra → a medias; empeora las dos → no se cumple. Siempre se informa cuánto más esperan las urgencias en C.
- Pregunta descriptiva, sin criterio: con urgencias, ¿subir el límite ayuda en algo o solo deja más cosas a medias? Es nuestro razonamiento a comprobar, no un estudio.

4. LA SIMULACIÓN
Con simular-dias, 200 días por combinación, semilla fija: regla principal con 0, 1, 2, 3 y 5 urgencias al día, límites de 1 a 10; variantes B, C y D con 1, 2, 3 y 5. Por combinación, mide: terminadas sin contar y contando urgencias; tiempo por tarea de las normales (promedio y percentil 85); tiempo de cada urgencia desde que llega hasta que termina, y cuántas esperaron; estrés al cerrar, cigarros y cafés; minutos del día ocupados por urgencias; y el mejor límite, con la misma regla de "mejor" de las etapas anteriores, sin cambiarla. Intervalos de confianza del 95 % con los 200 días.

5. AL TERMINAR
- docs/etapa8-2.md con las tablas, los veredictos de H5a, H5b y H5c según los criterios, y los límites: una mosca sola, sin holgura (siempre tiene trabajo esperando), un día; vale para una persona saturada, no para un equipo; nadie ha medido esto con personas.
- Un PDF corto (2 a 3 páginas, en simple, con una tabla y un gráfico) en la carpeta del Escritorio: "2026-11-03 Etapa 8.2 Urgencias v1.pdf". Actualiza el LEEME.
- Los resultados en docs/etapa8-2-resultados.json.
- PROGRESO.md y CLAUDE.md al día. Commit en español. Nada se publica.
- Dame: resumen de 5 líneas; la tabla "con X urgencias al día: mejor límite, terminadas normales, tiempo por tarea normal, estrés al cerrar" de la regla principal; la comparación entre la regla principal y la variante C con 3 y 5 al día; los tres veredictos; y lo que asumiste. Espera mi OK antes de la 8.3 (la pantalla).
