# Urgencias en la "Mosca del WIP": qué dicen los estudios y cómo modelarlas (Etapa 8.2)

Agregar urgencias tiene buen respaldo. Hay estudios de campo que muestran que las urgencias rompen el trabajo, y la práctica kanban tiene una regla conocida para ellas: la vía rápida o "expedite". Pero ningún estudio dice cuántas urgencias al día aguanta un sistema. Ese número lo tiene que mostrar la simulación, y el diseño tentativo necesita tres ajustes antes de correr.

## TL;DR

- **Respaldo:** Perlow (1999) siguió por nueve meses a un grupo de ingenieros de software. Solo el 10 % de las interacciones eran urgentes y el 86 % podía esperar. Cuando el grupo tuvo horas protegidas sin interrupciones ("quiet time"), la parte de ingenieros que se veía más productiva que lo normal subió de 41 % a 65 %. Mark y otros (2008) midieron que la gente interrumpida termina un poco antes, pero con más estrés. Anderson (2010) describe la vía rápida: una urgencia a la vez, fuera del límite WIP y con su uso muy restringido.
- **Lo que no existe:** no encontré ningún estudio empírico que diga cuántas urgencias aguanta un sistema. El "punto de inflexión" de Repenning y otros (2001) sale de un modelo de simulación. En ese modelo, una sobrecarga temporal de 20 % se recupera y una de 25 % no se recupera nunca, y el punto exacto depende de qué tan cargada está la gente. Podemos tomar prestada la forma de la idea, pero no los números.
- **Qué hacer:** separar H5 en tres partes. Medir siempre contra el escenario de 0 urgencias y comparar la vía rápida con la opción de tratar la urgencia como una tarea normal. Antes de correr hay que definir qué pasa si llega una segunda urgencia, y no hay que sumar "estrés extra por interrupción" en la corrida principal. Tampoco hay que usar las cifras "23 minutos por interrupción" ni "la multitarea cuesta 40 %".

---

## 1. Resumen en 10 líneas

1. **Lo que respalda la idea:** en el trabajo real las interrupciones y urgencias son constantes. Esto está medido en observación de campo (González y Mark 2004; Mark, González y Harris 2005; Perlow 1999).\[1\]\[2\]\[3\]
2. **Lo que respalda la regla:** la "vía rápida" (expedite) es práctica kanban documentada (Anderson 2010). Es una urgencia a la vez, que pasa por encima del límite y cuyo uso se restringe mucho.\[4\] Es práctica, no estudio.
3. **Lo que respalda el costo:** interrumpir en medio de una tarea cuesta más tiempo, más errores y más molestia que hacerlo entre tareas, según un experimento con 50 personas (Bailey y Konstan 2006).\[5\]
4. **Lo que respalda el estrés:** quienes fueron interrumpidos trabajaron más rápido pero con más estrés, frustración y apuro, según un experimento con 48 personas (Mark y otros 2008).\[6\]\[7\]
5. **Lo que matiza:** el 96 % de las interacciones que interrumpían a los ingenieros de Perlow les parecían útiles.\[8\] Hay interrupciones que ayudan (Jett y George 2003; Puranik y otros 2021).\[9\]
6. **Lo que matiza:** la gente elige lo urgente aunque valga menos (Zhu, Yang y Hsee 2018).\[10\]\[11\] Muchas "urgencias" pueden no ser urgentes de verdad.
7. **Lo que no se sabe:** ningún estudio mide cuántas urgencias aguanta un tablero kanban. La teoría de colas y el modelo de Repenning dan la forma ("todo empeora más rápido cuanto más cargado está el sistema"), pero no dan un número que sirva para la mosca.
8. **Lo que hay que ajustar:** definir qué pasa con una segunda urgencia, no duplicar el estrés y tener una comparación contra "la urgencia como tarea normal".
9. **Lo que no hay que decir:** "cada interrupción cuesta 23 minutos", "la multitarea cuesta 40 %", ni que la matriz urgente/importante es "de Eisenhower" o que tiene un estudio detrás.\[12\]\[13\]\[14\]
10. **Lo que hay que decir:** "En el juego, una urgencia al día ocupa cerca del 5 % del día. Cinco, cerca de un cuarto. Eso ya no es una excepción."

---

## 2. Las 10 fuentes más útiles

| # | Fuente | Idea en una línea | Tipo y fuerza | Para qué sirve |
|---|---|---|---|---|
| 1 | Perlow 1999, *Administrative Science Quarterly* | Solo el 10 % de las interrupciones era urgente, y proteger horas sin interrupciones subió la productividad percibida\[8\] | Estudio de caso de campo (9 meses, 17 personas) con una intervención. Fuerza media: un solo equipo y productividad autoinformada | Informe, guía, taller |
| 2 | Mark, Gudith y Klocke 2008, CHI | Con interrupciones se termina un poco antes, pero con más estrés\[6\]\[15\] | Experimento de laboratorio (48 personas). Fuerza media: tarea de correo y sesiones cortas | Regla (estrés), informe |
| 3 | Mark, González y Harris 2005, CHI | El 57 % del trabajo se interrumpe y se retoma en promedio unos 23 minutos después, con dos tareas o más entremedio\[1\] | Observación de campo (24 personas, más de 700 horas). Fuerza media-alta para describir, nula para causas | Regla (residuo), informe, mitos |
| 4 | González y Mark 2004, CHI | Unos 12 minutos por "esfera de trabajo" antes de cambiar. Las interrupciones importantes duran de 2 a 40 minutos\[16\] | Observación de campo (14 personas). Fuerza media | Regla (duración de la urgencia) |
| 5 | Bailey y Konstan 2006, *Computers in Human Behavior* | Interrumpir a mitad de tarea cuesta más que hacerlo entre tareas | Experimento controlado (50 personas).\[5\] Fuerza media-alta en laboratorio | Regla (cuándo entra la urgencia), taller |
| 6 | Monk, Trafton y Boehm-Davis 2008, *J. Exp. Psychol.: Applied* | A interrupción más larga y más exigente, más demora en retomar | Tres experimentos de laboratorio.\[17\] Fuerza alta para el mecanismo, baja para el día de oficina | Regla (residuo) |
| 7 | Zhu, Yang y Hsee 2018, *Journal of Consumer Research* | La gente elige lo urgente aunque pague menos | Cinco experimentos.\[10\] Fuerza media-alta | Informe, guía, taller |
| 8 | Anderson 2010, *Kanban* (Blue Hole Press) | Vía rápida: una a la vez, fuera del límite, uso muy restringido\[4\] | Libro de práctica. Sin datos experimentales | Regla, guía |
| 9 | Repenning 2001 (*JPIM*) y Repenning, Gonçalves y Black 2001 (*California Management Review*) | Hay un punto de inflexión: pasado cierto nivel, apagar incendios se vuelve la forma normal de trabajar\[18\] | Modelo de simulación (dinámica de sistemas) basado en casos. Fuerza media para la idea y baja para los números | Criterios de H5, informe |
| 10 | Puranik, Koopman y Vough 2020, *Journal of Management* | Revisión de 247 publicaciones: las interrupciones tienen costos y también beneficios\[19\] | Revisión integradora. Fuerza alta como mapa del tema, no da cifras únicas | Informe, matices |

---

## 3. Fichas por tema

### A. Qué cuesta una interrupción o una urgencia (estudios con personas)

**A1. González y Mark (2004), "Constant, constant, multi-tasking craziness"**
- **Idea en una línea:** el trabajo de oficina se parte en pedazos cortos y la gente salta entre unas diez "esferas de trabajo" al día.\[20\]
- **Qué dice exactamente:** observaron a 14 trabajadores de la información en tres roles, con unas 26 horas de observación formal por persona.\[16\] En promedio, la gente pasaba unos 3 minutos en cada actividad antes de cambiar y algo más de 2 minutos en cada herramienta.\[21\] En una "esfera de trabajo" (un proyecto o tema) pasaba en promedio 11 minutos y 28 segundos antes de cambiar, y algo más de 12 minutos si no se cuentan las interrupciones menores.\[1\] Las interrupciones "importantes" iban de 2 a 40 minutos.\[16\] Las clasificaron en internas (las inicia uno mismo) y externas.\[22\]
- **Tipo y fuerza:** observación de campo, descriptiva. Fuerza media: son pocas personas en una sola empresa.
- **Cita:** González, V. M. y Mark, G. (2004). "Constant, constant, multi-tasking craziness": Managing multiple working spheres. *Proceedings of CHI 2004*, ACM, pp. 113–120. Link: https://ics.uci.edu/~gmark/CHI2004.pdf
- **Cómo usarla:** para respaldar que una urgencia de 15 a 35 minutos está dentro del rango observado de interrupciones importantes (2 a 40 minutos).
- **Qué NO decir:** "la gente tiene 25 interrupciones al día, mitad internas y mitad externas". No encontré esa cifra en el texto que revisé.
- **Estado:** verificado en fuente primaria (PDF de la autora, por fragmentos). La cifra de "~25 interrupciones al día, mitad y mitad" queda **no verificada**. El DOI no lo verifiqué en esta búsqueda.

**A2. Mark, González y Harris (2005), "No task left behind?"**
- **Idea en una línea:** más de la mitad del trabajo se interrumpe, y lo interrumpido se retoma tarde y con otras tareas entremedio.
- **Qué dice exactamente:** 24 trabajadores de la información, más de 700 horas de observación. El 57,1 % de los segmentos de trabajo fue interrumpido.\[3\]\[23\] En promedio pasaban 11 minutos y 4 segundos en una esfera antes de cambiar.\[24\]\[25\]\[26\] En una presentación de 2008, la propia Mark resume estos datos así: el 81,9 % del trabajo interrumpido se retomó el mismo día, "en promedio en 23 min. 15 seg.", y antes de volver se hacía más de dos actividades intermedias.\[1\]
- **Tipo y fuerza:** observación de campo, descriptiva. Fuerza media-alta para describir cómo es el trabajo, nula para explicar causas.
- **Cita:** Mark, G., González, V. M. y Harris, J. (2005). No task left behind? Examining the nature of fragmented work. *Proceedings of CHI 2005*, ACM, pp. 321–330. Link: https://ics.uci.edu/~gmark/CHI2005.pdf
- **Cómo usarla:** para la regla del residuo, porque lo soltado no se retoma enseguida. También para corregir el mito de los "23 minutos" (ver G).
- **Qué NO decir:** que "se tarda 23 minutos en volver a concentrarse". Lo medido es cuánto tiempo pasa hasta *retomar* la tarea, con otras tareas en medio.
- **Estado:** verificado (PDF de la autora y presentación de Mark de 2008). **Diferencia sin resolver:** ustedes tenían "~25 minutos". Mark dice "23 min 15 s" en su presentación de 2008, y en una entrevista de UC Irvine de mayo de 2023 dice que "it takes about 25 and a half minutes to pick up that original interrupted project". Dos fuentes secundarias (tryhugo.app y un comentario de Hacker News de agosto de 2025) citan textual el artículo de 2005: "it took an average length of time of 25 min. 26 sec (sd=54 min.)", con 2,26 tareas intermedias. Según esas mismas fuentes, la cifra de "23 min 15 s" viene de una entrevista de Gallup de 2006. No pude abrir el PDF para confirmar el pasaje porque el sitio bloqueó el acceso automático. Recomiendo citar "unos 25 minutos según el artículo de 2005, a confirmar en el PDF" o, simplemente, "unos 20 y tantos minutos".

**A3. Mark, Gudith y Klocke (2008), "The cost of interrupted work: more speed and stress"**
- **Idea en una línea:** con interrupciones se trabaja más rápido, pero se paga en estrés.
- **Qué dice exactamente:** experimento con 48 personas que respondían correos y eran interrumpidas por teléfono o por mensajería. Hubo tres condiciones: sin interrupción, interrupción del mismo tema e interrupción de otro tema.\[7\]\[27\] Con interrupciones terminaron la tarea en menos tiempo y sin diferencias de calidad. Pero "después de solo 20 minutos" de trabajo interrumpido informaron significativamente más estrés, frustración, carga de trabajo, esfuerzo y presión de tiempo (escala NASA-TLX modificada).\[6\]\[27\]\[28\] Que el tema de la interrupción fuera el mismo u otro no cambió el resultado.\[15\]
- **Tipo y fuerza:** experimento de laboratorio. Fuerza media: tarea sencilla, sesiones cortas, estrés autoinformado.
- **Cita:** Mark, G., Gudith, D. y Klocke, U. (2008). The cost of interrupted work: more speed and stress. *Proceedings of CHI 2008*, ACM, pp. 107–110. DOI: 10.1145/1357054.1357072.\[29\] Link: https://ics.uci.edu/~gmark/chi08-mark.pdf
- **Cómo usarla:** como respaldo de que la interrupción sube el estrés. El juego ya lo captura con "una tarea abierta más".
- **Qué NO decir:** "las interrupciones no cuestan tiempo" (era una tarea rutinaria de correo) ni "las interrupciones bajan la calidad" (en este estudio no la bajaron).\[30\]
- **Estado:** verificado en fuente primaria (resumen y fragmentos del PDF).

**A4. Perlow (1999), "The time famine"** (ver también F)
- **Idea en una línea:** las interrupciones casi nunca eran urgentes y proteger horas sin interrupción ayudó, pero solo mientras duró el estudio.
- **Qué dice exactamente:** nueve meses de observación de un grupo de software de 17 personas (12 ingenieros), con 35 días registrados hora a hora. Algo más del 30 % del tiempo eran actividades con otros y cerca del 60 % trabajo solo. El 75 % de los bloques de trabajo solo sin interrupción duraba una hora o menos, y de esos, el 60 % duraba media hora o menos. De las interacciones, el 96 % se consideraba útil, solo el 10 % era urgente, el 86 % se podía haber dejado para después sin problema y el 95 % ocurría de forma espontánea.\[8\] En el experimento de "quiet time", la fase 1 (tres días a la semana sin interrupciones hasta mediodía) llevó a un 59 % de ingenieros a decir que su productividad estaba sobre el promedio. En la fase 2 (horario de interacción de 11 a 15 todos los días) fue 41 %, en la fase 3 (igual a la fase 1) 65 %, y un mes después del estudio 47 %. El vicepresidente atribuyó al estudio el lanzamiento a tiempo del producto, el segundo de la historia de la división. Nueve meses después los efectos eran "mínimos": el grupo volvió a los hábitos de siempre porque no cambió el sistema de premios a los "héroes".\[8\]
- **Tipo y fuerza:** estudio de caso cualitativo con una intervención. Fuerza media: un solo equipo, productividad autoinformada y sin grupo de control.
- **Cita:** Perlow, L. A. (1999). The time famine: Toward a sociology of work time. *Administrative Science Quarterly*, 44(1), 57–81. DOI: 10.2307/2667031.\[2\] Link: https://journals.sagepub.com/doi/10.2307/2667031
- **Cómo usarla:** es la mejor fuente para la guía ("la mayoría de lo que llega como urgente puede esperar") y para la idea de que las urgencias se alimentan a sí mismas (lo postergado se vuelve la próxima crisis).
- **Qué NO decir:** "el quiet time subió la productividad un 24 %". Lo que subió fue el porcentaje de personas que *decían* estar sobre el promedio. Tampoco que "funcionó para siempre".
- **Estado:** verificado en fuente primaria (texto completo).

**A5. Czerwinski, Horvitz y Wilhite (2004), "A diary study of task switching and interruptions"**
- **Idea en una línea:** en una semana la gente cambia de tarea muchas veces, y volver a tareas complejas cuesta más.
- **Qué dice exactamente:** estudio de diario de una semana con 11 usuarios experimentados de Windows en Microsoft (3 mujeres). Se excluyó a un participante atípico y se analizó a los 10 restantes. En promedio informaron 50 cambios de tarea en la semana y 0,7 interrupciones por tarea. Las tareas duraban en promedio 53 minutos según lo que ellos mismos registraron, con una desviación estándar grande, de 90,9 minutos. Los plazos y las emergencias explicaron solo el 3 % de los cambios de tarea informados, un dato útil para H5. Las tareas a las que había que volver duraban cerca del doble que las otras.\[31\] Volver a las tareas complejas se calificó como más difícil.\[32\]
- **Tipo y fuerza:** diario autoinformado. Fuerza baja-media: pocas personas de una sola empresa.
- **Cita:** Czerwinski, M., Horvitz, E. y Wilhite, S. (2004). A diary study of task switching and interruptions. *Proceedings of CHI 2004*, ACM, pp. 175–182. DOI: 10.1145/985692.985715.\[33\] Link: https://www.microsoft.com/en-us/research/wp-content/uploads/2004/01/chi2004diarystudyfinal.pdf
- **Cómo usarla:** como apoyo de que lo interrumpido cuesta más de retomar. No da un número para la regla.
- **Qué NO decir:** que es una muestra representativa. Son 10 personas analizadas de una sola empresa.
- **Estado:** verificado en el PDF de Microsoft Research, incluido el número de participantes (11, de los cuales se analizaron 10).

**A6. Bailey y Konstan (2006), "On the need for attention-aware systems"**
- **Idea en una línea:** el momento de la interrupción importa: a mitad de tarea cuesta mucho más que entre tareas.
- **Qué dice exactamente:** experimento controlado con 50 personas. Cuando una tarea secundaria interrumpía *a mitad* de la tarea principal, en vez de aparecer *entre* tareas, la gente necesitó entre 3 % y 27 % más tiempo, cometió el doble de errores, sintió entre 31 % y 106 % más molestia y tuvo el doble de aumento de ansiedad.\[5\]
- **Tipo y fuerza:** experimento de laboratorio. Fuerza media-alta para el efecto del momento, pero con tareas de computador cortas.
- **Cita:** Bailey, B. P. y Konstan, J. A. (2006). On the need for attention-aware systems: Measuring effects of interruption on task performance, error rate, and affective state. *Computers in Human Behavior*, 22(4), 685–708. DOI: 10.1016/j.chb.2005.12.009.\[5\]
- **Cómo usarla:** es el mejor argumento para probar una variante en que la urgencia espere a que la mosca termine lo que tiene en la mano.
- **Qué NO decir:** "las interrupciones duplican los errores" en general. Es el doble *comparado con interrumpir entre tareas*, no comparado con no interrumpir.\[5\]
- **Estado:** resumen verificado (resumen de Elsevier vía Google Académico). No leí el texto completo.

**A7. Monk, Trafton y Boehm-Davis (2008)** y **Altmann y Trafton (2002, "memory for goals")**
- **Idea en una línea:** cuanto más larga y exigente es la interrupción, más cuesta retomar, porque el objetivo pendiente se "desvanece" de la memoria.
- **Qué dice exactamente:** tres experimentos con tareas intercaladas mostraron que las interrupciones más largas y más exigentes alargan el tiempo para retomar. Las duraciones probadas llegaban hasta 1 minuto. Los resultados apoyan el modelo de "memoria de objetivos" de Altmann y Trafton: el objetivo pendiente decae, y repasarlo mentalmente ayuda.\[17\]
- **Tipo y fuerza:** experimentos de laboratorio. Fuerza alta para el mecanismo, baja para extrapolar a interrupciones de 30 minutos.
- **Cita:** Monk, C. A., Trafton, J. G. y Boehm-Davis, D. A. (2008). The effect of interruption duration and demand on resuming suspended goals. *Journal of Experimental Psychology: Applied*, 14(4), 299–313. Link (ficha ERIC): https://eric.ed.gov/?id=EJ824572. \[17\] Altmann, E. M. y Trafton, J. G. (2002). Memory for goals: An activation-based model. *Cognitive Science*, 26(1), 39–83.
- **Cómo usarla:** respalda la *dirección* de la regla de residuo. No sirve para fijar el 3 %.
- **Qué NO decir:** "una interrupción de 30 minutos cuesta X segundos de retomar". El estudio llega a 1 minuto.\[17\]
- **Estado:** Monk 2008 verificado a nivel de resumen (ERIC). Los DOI no los verifiqué. Altmann y Trafton 2002 **no revisado directamente**: lo cito porque Monk 2008 lo cita.

**A8. Revisiones: Jett y George (2003) y Puranik, Koopman y Vough (2020)**
- **Idea en una línea:** "interrupción" no es una sola cosa, y no todas son malas.
- **Qué dice exactamente:** Jett y George distinguen cuatro tipos: intrusiones (otra persona trae una tarea), pausas, distracciones y discrepancias (algo no calza con lo esperado). Cada tipo tiene causas distintas y puede tener consecuencias positivas o negativas.\[9\]\[34\] Puranik y otros revisan 247 publicaciones, proponen una definición integrada de interrupción en el trabajo y limitan su revisión a interrupciones externas.\[19\]\[35\]
- **Tipo y fuerza:** revisión teórica (Jett y George) y revisión integradora (Puranik). Fuerza alta como mapa del tema, no dan cifras para la regla.
- **Cita:** Jett, Q. R. y George, J. M. (2003). Work interrupted: A closer look at the role of interruptions in organizational life. *Academy of Management Review*, 28(3), 494–507. DOI: 10.5465/AMR.2003.10196791.\[36\] Puranik, H., Koopman, J. y Vough, H. C. (2020). Pardon the interruption: An integrative review and future research agenda for research on work interruptions. *Journal of Management*, 46(6), 806–842. DOI: 10.1177/0149206319887428.\[37\]
- **Cómo usarla:** la urgencia del juego es una "intrusión" en el sentido de Jett y George.\[34\] Conviene decirlo así para no mezclarla con la pausa del café, que es otro tipo.
- **Qué NO decir:** "la ciencia dice que las interrupciones son malas". Las revisiones dicen que depende.
- **Estado:** verificado a nivel de resumen y metadatos.

**A9. Publicaciones 2024–2026:** encontré dos capítulos recientes de Springer: "Work Interruptions in Digital Information Work – A Scoping Review of Influencing Factors and Effects" y "How Do Digital Business Professionals Manage Work Interruptions? A Pilot Study on Coping Strategies".\[38\]\[39\] **No los revisé**: solo confirmé que existen. No encontré ninguna publicación 2024–2026 sobre urgencias en tableros kanban.

### B. La práctica kanban para urgencias: la vía rápida (expedite)

- **Idea en una línea:** la vía rápida es una política explícita: una urgencia a la vez, que pasa por encima del límite y que se usa poco.
- **Qué dice exactamente:** según un resumen del libro de Anderson que reproduce el texto de la figura 11.3, el ejemplo es un sistema con límite WIP total de 20. Las tarjetas de vía rápida "no cuentan contra el límite WIP, pero están limitadas a un solo ítem a la vez. Por eso tienen un impacto de cinco por ciento en la capacidad total cuando están presentes, y suben el trabajo en curso efectivo a 21 ítems".\[4\] El mismo resumen describe la clase así: "interrumpe otro trabajo según sea necesario; las políticas deben restringir severamente su uso". También dice que un ítem con fecha fija que se atrasa puede "ascender" a vía rápida.\[4\]\[40\]\[41\] La **Kanban Guide** de Vacanti y Coleman (versiones de 2020 y la de mayo 2025) **no menciona** clases de servicio ni vía rápida. Solo dice que las excepciones al control del WIP deben quedar explícitas: "Any acceptable exceptions to controlling WIP should be made explicit as part of the DoW."\[42\] El *Open Guide to Kanban* (2025) las menciona solo como técnica opcional en un apéndice.\[43\] La guía oficial de Kanban University sí define la vía rápida como un tipo de clase de servicio.\[44\]\[45\]
- **Tipo y fuerza:** libro y guías de práctica. **No hay evidencia empírica.** Encontré una simulación (Tregubov y Lane 2015) que modela clases de servicio y deja que la vía rápida interrumpa el trabajo en curso,\[46\] pero no pude leer si mide el efecto sobre las tareas normales. No encontré ningún estudio que diga cuántas urgencias aguanta un tablero.
- **Cita:** Anderson, D. J. (2010). *Kanban: Successful Evolutionary Change for Your Technology Business*. Blue Hole Press, cap. 11. Vacanti, D. y Coleman, J. (2020, revisada 2025). *The Kanban Guide*. https://kanbanguides.org/the-kanban-guide/. Tregubov, A. y Lane, J. A. (2015). Simulation of Kanban-based scheduling for systems of systems: Initial results. *Procedia Computer Science*, 44, 224–233. DOI: 10.1016/j.procs.2015.03.004.\[47\]
- **Cómo usarla:** la regla "máximo una a la vez, por encima del límite" está bien respaldada *como práctica*. El ejemplo del 5 % sirve para el informe: en el juego, una urgencia al día ocupa algo parecido (ver H5).
- **Qué NO decir:** "está demostrado que la vía rápida funciona" ni "Anderson recomienda 5 % de urgencias". El 5 % es el efecto aritmético de su ejemplo (1 sobre 20), no una recomendación ni un dato medido.
- **Estado:** Anderson verificado **solo por fuente secundaria** (resumen de un tercero). Faltan los números de página. La expresión "silver bullet" queda **no verificada**. Kanban Guide verificada en fuente primaria. Anderson y Carmichael (2016), *Essential Kanban Condensed*, **no revisado**.

### C. Urgente vs. importante

**C1. Zhu, Yang y Hsee (2018), "The Mere Urgency Effect"**
- **Idea en una línea:** la gente elige la tarea urgente aunque la importante pague más, solo porque la urgente "vence pronto".\[10\]\[11\]
- **Qué dice exactamente:** cinco experimentos,\[48\] con estudiantes en laboratorio y trabajadores de Amazon MTurk. En el experimento 1 (124 estudiantes), elegir la tarea que pagaba menos (3 chocolates en vez de 5) subió de 13,3 % a 31,3 % cuando esa tarea "vencía en 10 minutos" en vez de en 24 horas, aunque se podía terminar a tiempo de todas formas. El efecto pasa por la atención: el plazo corto llama la atención y la saca del pago.\[48\] Se reduce cuando se hacen visibles los resultados de cada tarea (experimento 3)\[10\] y depende de cuán ocupada se siente la persona (experimento 4).\[10\]
- **Tipo y fuerza:** experimentos controlados. Fuerza media-alta, con tareas y premios pequeños.
- **Cita:** Zhu, M., Yang, Y. y Hsee, C. K. (2018). The mere urgency effect. *Journal of Consumer Research*, 45(3), 673–690. DOI: 10.1093/jcr/ucy008.\[10\]\[11\]
- **Cómo usarla:** en la guía y el taller: "antes de aceptar una urgencia, pregunten qué se gana y qué se pierde". Eso es justo lo que reduce el efecto.
- **Qué NO decir:** "la gente siempre elige lo urgente". En el experimento 1 lo hizo menos de un tercio.\[10\]
- **Estado:** verificado en fuente primaria (PDF). Cita y DOI confirmados.

**C2. La "matriz de Eisenhower"**
- **Idea en una línea:** la frase no es de Eisenhower y la matriz no tiene un estudio detrás.
- **Qué dice exactamente:** el 19 de agosto de 1954, en un discurso ante la Segunda Asamblea del Consejo Mundial de Iglesias en Evanston, Eisenhower citó a "un ex presidente de universidad": "Tengo dos tipos de problemas, los urgentes y los importantes. Los urgentes no son importantes, y los importantes nunca son urgentes."\[13\] La cuadrícula de 2x2 se popularizó después. Varias fuentes secundarias la atribuyen a Covey (1989).\[14\]\[49\]
- **Tipo y fuerza:** regla práctica sin estudio que la valide. La parte de Covey es fuente secundaria.
- **Cita:** Eisenhower, D. D. (1954). Address at the Second Assembly of the World Council of Churches, Evanston, Illinois, 19 de agosto.\[13\] The American Presidency Project: https://www.presidency.ucsb.edu/documents/address-the-second-assembly-the-world-council-churches-evanston-illinois
- **Cómo usarla:** como anécdota en un taller, nunca como evidencia.
- **Qué NO decir:** "Eisenhower inventó la matriz" ni "está probado que la matriz funciona".
- **Estado:** el discurso está verificado en fuente primaria. El origen de la matriz en Covey solo por fuentes secundarias.

### D. Cuántas urgencias aguanta un sistema

**D1. Teoría de colas con prioridad que interrumpe (prioridad "preventiva")**
- **Idea en una línea:** cuando lo urgente puede interrumpir, lo urgente casi no nota a lo normal, pero lo normal carga con toda la variabilidad, y su espera se dispara cuando el sistema se acerca a estar lleno.\[50\]
- **Qué dice exactamente (en simple):** en una cola de una sola persona con dos clases, donde la urgente interrumpe a la normal (modelo M/M/1 de los apuntes de Adan y Resing, TU Eindhoven), la clase urgente se comporta como si la normal no existiera. El tiempo de la clase normal tiene en el denominador el producto (1 − carga urgente) × (1 − carga total).\[51\] Cuando la carga total se acerca al 100 %, ese denominador se acerca a cero y el tiempo de lo normal crece sin freno.
- **Tipo y fuerza:** modelo matemático. Fuerza alta como lógica, pero supone llegadas y duraciones aleatorias de forma específica y una cola que puede quedar vacía.
- **Cita:** Adan, I. y Resing, J. *Queueing Systems* (apuntes), cap. 4, Eindhoven University of Technology. Link: https://iadan.win.tue.nl/que/h4.pdf
- **Cómo usarla:** para explicar por qué conviene medir el tiempo por tarea de las *normales* por separado. Ahí debería verse el costo.
- **Qué NO decir:** ningún número sacado de la fórmula. La mosca no es una cola M/M/1, porque siempre tiene trabajo esperando y tiene costos de cambio. Kingman **no lo verifiqué** en esta búsqueda.
- **Estado:** fórmula verificada en los apuntes (fuente académica de enseñanza).

**D2. Repenning (2001) y Repenning, Gonçalves y Black (2001): el punto de inflexión de "apagar incendios"**
- **Idea en una línea:** apagar incendios se contagia, y pasado un umbral se vuelve la forma normal de trabajar y no se sale solo.\[18\]
- **Qué dice exactamente:** cinco años de estudio, con cuatro casos en cuatro industrias más 15 meses en una empresa. Con eso construyeron modelos de dinámica de sistemas. En su modelo simplificado, un aumento *temporal* de 20 % en la carga baja el desempeño, pero el sistema se recupera. Un aumento temporal de 25 % lo empuja más allá del punto de inflexión y "nunca se recupera". Dónde queda ese punto "lo determina la utilización de recursos": cuanto más cargada está la gente en tiempos normales, más chico es el golpe que basta para caer. Recomiendan dejar holgura ("un sistema totalmente utilizado está siempre al borde de caer en apagar incendios"), limitar el número de proyectos, revisar el plan completo cuando hay un problema en vez de "ponerse al día", y no premiar a los "bomberos".\[18\]
- **Tipo y fuerza:** modelo de simulación basado en casos. Fuerza media para la idea, **baja para los números** (20 % y 25 % son de un modelo estilizado).
- **Cita:** Repenning, N. P. (2001). Understanding fire fighting in new product development. *Journal of Product Innovation Management*, 18(5), 285–300. DOI: 10.1016/S0737-6782(01)00099-6.\[52\] Repenning, N. P., Gonçalves, P. y Black, L. J. (2001). Past the tipping point: The persistence of firefighting in product development. *California Management Review*, 43(4), 44–63. DOI: 10.2307/41166100.\[18\] Link: https://mitsloan.mit.edu/shared/ods/documents?PublicationDocumentID=2527
- **Cómo usarla:** tomar prestada la *forma*: "hay un punto en que las urgencias dejan de ser excepción". Y el criterio: el costo depende de cuán cargado está el sistema. **Ojo:** en el juego la mosca siempre tiene tareas esperando, así que no tiene holgura. Por eso el juego no puede mostrar el efecto "la holgura absorbe urgencias" (ver Advertencias).
- **Qué NO decir:** "pasado el 25 % de urgencias el equipo colapsa". El 25 % es un aumento de carga en un modelo de desarrollo de productos, no un umbral general. Tampoco hay que conectar ese 25 % con nuestras "5 urgencias ≈ 23 % del día": la cercanía es casualidad.
- **Estado:** CMR verificado en fuente primaria (texto completo de MIT). JPIM verificado a nivel de metadatos y fragmentos.

**D3. Bohn (2000), "Stop fighting fires"**
- **Idea en una línea:** artículo de práctica con síntomas de una organización atrapada en apagar incendios.
- **Qué dice exactamente:** "siempre hay más problemas que personas con tiempo para resolverlos". Cuando apagar incendios se vuelve crónico, la gente corre de una tarea a otra sin terminar ninguna y la resolución de problemas se degrada a "parches".\[53\] Según resúmenes de terceros, los síntomas son: no hay tiempo para resolver los problemas, las soluciones quedan incompletas, los problemas vuelven y se encadenan, lo urgente desplaza a lo importante y muchos problemas se vuelven crisis.\[54\]\[55\]
- **Tipo y fuerza:** artículo de práctica (Harvard Business Review), sin datos propios publicados.
- **Cita:** Bohn, R. (2000). Stop fighting fires. *Harvard Business Review*, 78(4), 83–91.\[56\] Link: https://hbr.org/2000/07/stop-fighting-fires
- **Cómo usarla:** para la guía y el taller, como lista de señales.
- **Qué NO decir:** "Bohn demostró…". Es un artículo de opinión experta.
- **Estado:** resumen de HBR verificado. La lista de síntomas solo por **fuente secundaria**.

### E. Cómo modelar la urgencia con honestidad

El detalle está en la sección 4. Lo central:
- **Lo que tiene respaldo:** que la urgencia llega sin aviso (Perlow: el 95 % de las interacciones eran espontáneas),\[8\] que pasa por encima del límite con máximo una a la vez (Anderson, práctica),\[4\] que deja residuo en lo soltado (Mark 2005; Monk 2008 para la dirección) y que sube el estrés (Mark 2008).\[28\]
- **Lo que es supuesto nuestro:** cuánto dura, qué pasa si llega una segunda, si suelta lo que está haciendo en ese mismo minuto y cualquier estrés extra por la interrupción en sí.
- **El riesgo principal:** contar el estrés dos veces. La regla actual ya sube el estrés por "una tarea abierta más". Sumar un extra "por interrumpir" basado en Mark 2008 sería un supuesto nuevo, porque Mark midió estrés autoinformado tras 20 minutos de laboratorio\[7\] y no un valor por interrupción.\[6\]

### F. Lo que contradice o matiza

Ver sección 6.

### G. Mitos y cifras que no hay que usar

Ver sección 7.

---

## 4. Recomendación para la regla del juego

| Supuesto del diseño tentativo | Respaldo | Etiqueta | Alternativas |
|---|---|---|---|
| Llega al azar durante el día (0, 1, 2, 3 o 5 por día) | Perlow: el 95 % de las interacciones eran espontáneas.\[8\] González y Mark: el trabajo se interrumpe todo el tiempo\[16\] | "según estudios" (que llegan sin aviso). La cantidad por día es **supuesto nuestro** (es lo que se prueba) | Horas repartidas parejo en 09:00–18:00. También se podría probar que se concentren en la mañana, pero no hay estudio que lo pida |
| Dura lo mismo que una tarea normal (15–35 min) | González y Mark: las interrupciones importantes duran de 2 a 40 minutos\[22\] | **supuesto nuestro**, dentro de un rango observado | Correr una vez con duración menor (por ejemplo, la mitad del rango) como prueba de sensibilidad, rotulada "supuesto nuestro" |
| Prioridad total hasta terminarla | Anderson: la vía rápida "interrumpe otro trabajo"\[4\] | "práctica" | — |
| Suelta lo que hace **en ese mismo minuto** | Práctica kanban, sí. Pero Bailey y Konstan muestran que interrumpir a mitad de tarea cuesta más que hacerlo entre tareas\[5\] | "práctica", con un estudio que la matiza | **Variante B:** la urgencia espera a que la mosca termine el tramo actual. Si se agrega, sería una sola variante, rotulada |
| Pasa por encima del límite, máximo 1 a la vez | Anderson (fuente secundaria): 1 a la vez y no cuenta contra el límite\[4\] | "práctica" | **Falta definir:** si llega una segunda mientras hay una en curso. Recomiendo que espere al tope de "Por hacer" (sin entrar por encima del límite) y que se registre cuántas esperaron y cuánto |
| Cuesta cambio de tarea y deja residuo con las reglas actuales | Mark 2005 (se retoma tarde), Monk 2008 (a interrupción más larga, más cuesta retomar)\[1\]\[17\] | "inspirado en estudios", como las reglas actuales | No cambiar el 3 % ni la curva de rendimiento: nada se ajusta para que "se vea" |
| Sube el estrés como una tarea abierta más | Mark 2008: el trabajo interrumpido da más estrés\[6\]\[28\] | "inspirado en estudios" | — |
| ¿Estrés extra por la interrupción en sí? | Mark 2008 midió estrés autoinformado en general, no un valor por interrupción | **supuesto nuestro** si se agrega | **No incluirlo en la corrida principal.** Si se quiere, una sola variante rotulada "supuesto nuestro" |
| La urgencia cuenta como terminada | — | decisión de medición | Informar siempre las dos cifras: con y sin urgencias |
| **Comparación que falta:** urgencia como tarea normal | H5 afirma que "conviene tratarlas como trabajo normal", así que hay que probarlo | necesaria para H5 | **Variante C:** la urgencia entra al tope de "Por hacer" y respeta el límite. Se compara su tiempo de espera y el efecto en las normales |

---

## 5. Recomendación para la hipótesis H5 y sus criterios

**Problema de la redacción actual:** "Una urgencia de vez en cuando cabe; cuando llegan todos los días, el límite deja de servir y conviene tratarlas como trabajo normal" mezcla tres afirmaciones. Además, "todos los días" ya está en el escenario de 1 por día. Recomiendo separarla y redactarla así **antes de correr**:

- **H5a (cabe):** con pocas urgencias, el mejor límite para las tareas normales sigue en el mismo rango que sin urgencias (2 a 4 con esperas, 1 sin esperas).
- **H5b (deja de servir):** a medida que suben las urgencias, la ventaja del mejor límite sobre los demás se achica hasta no distinguirse.
- **H5c (tratarlas como trabajo normal):** con muchas urgencias, la variante C (urgencia como tarea normal) da a las tareas normales un resultado igual o mejor que la vía rápida, a cambio de que las urgencias esperen más.

**Qué medir (por combinación de urgencias × límite, 200 días):**
1. Tareas terminadas al día **sin contar** urgencias y **contando** urgencias.
2. Tiempo por tarea de las **normales** (promedio y percentil 85). Ahí la teoría de colas dice que se nota el costo.
3. Tiempo desde que llega cada urgencia hasta que se termina, y cuántas tuvieron que esperar porque ya había una en curso.
4. Estrés al cerrar el día, cigarros y cafés.
5. Mejor límite (según la misma regla de "mejor" que usaron en las etapas anteriores, sin cambiarla).
6. Minutos del día ocupados por urgencias ("en el juego").

**Criterios de "se cumple / a medias / no se cumple", sin números inventados:** usen comparaciones contra la línea base de 0 urgencias y el ruido de la propia simulación (intervalos de confianza de los 200 días), no umbrales sacados de la nada.
- **H5a se cumple** si con 1 urgencia al día el mejor límite queda dentro del mismo rango que con 0, y la pérdida de tareas normales no es mayor que el tiempo que ocuparon las urgencias más su costo de cambio según las reglas ya existentes. Es una "vara" calculable desde el juego, no inventada. **A medias** si el mejor límite se corre un lugar. **No se cumple** si se sale del rango.
- **H5b se cumple** si en algún nivel de urgencias los intervalos del mejor límite y de los límites vecinos se traslapan, es decir, si la simulación ya no puede distinguirlos. **A medias** si se achican pero no se traslapan. **No se cumple** si la ventaja se mantiene con 5 urgencias.
- **H5c se cumple** si la variante C iguala o mejora a la vía rápida en tiempo por tarea normal y en estrés. **A medias** si mejora una cosa y empeora otra. Siempre hay que informar cuánto más esperan las urgencias en la variante C.

**Dato aritmético útil (en el juego, no en estudios):** si las tareas duran entre 15 y 35 minutos repartidas parejo, una urgencia promedia 25 minutos. Sobre un día de 540 minutos, 1 urgencia ocupa cerca del 5 %, 2 cerca del 9 %, 3 cerca del 14 % y 5 cerca del 23 %, sin contar el costo de cambio. El 5 % coincide con el ejemplo de Anderson, pero es coincidencia y no validación.

**Lo que no hay que hacer:** fijar "más de X urgencias = colapso" con un X que venga de Repenning (20–25 %) o del 5 % de Anderson. Ninguno de los dos es un umbral medido para una persona con un tablero.

---

## 6. Lo que contradice o matiza

- **Muchas interrupciones ayudan.** En Perlow, el 96 % de las interacciones parecían útiles, aunque solo el 10 % fuera urgente.\[8\] Jett y George describen consecuencias positivas de las intrusiones (información, ayuda).\[9\]\[57\] Puranik, Koopman y Vough (2021, "Excuse Me, Do You Have a Minute?", *Journal of Applied Psychology*, 106(12), DOI: 10.1037/apl0000875) encontraron que las interrupciones de colegas también dan sensación de pertenencia: según el resumen de LSE Business Review (julio de 2021), "the social interactions necessitated by work interruptions help interrupted employees fulfil their need to belong". En el juego la urgencia solo cuesta, y hay que decirlo en el informe: "en el juego no modelamos lo que la urgencia aporta".
- **"Cero urgencias" no es la meta.** Perlow advierte el extremo opuesto: si las interacciones se reducen demasiado, el grupo pierde capacidad. Y su "quiet time" no duró porque no cambió el sistema de premios.\[8\] Un equipo que no responde nunca también falla.
- **Una mosca no es un equipo.** En un equipo, otra persona puede tomar la urgencia, o el equipo puede rotar quién la atiende. La mosca está sola, así que el juego muestra el peor caso para una persona. No sirve para concluir cuántas urgencias aguanta un equipo.
- **Sin holgura el juego exagera el costo.** La mosca siempre tiene tareas esperando (utilización completa). Repenning dice justamente que la holgura es lo que absorbe los golpes.\[18\] Así, el juego mostrará que *cada* urgencia resta tareas normales. Eso es honesto para una persona saturada, pero no para un equipo con margen.
- **Subir el límite y las urgencias.** Esto es razonamiento nuestro, a comprobar en la simulación, no un estudio: la urgencia pasa por encima del límite de todos modos, así que un límite más alto no la ayuda a pasar. Solo deja más cosas a medias cuando llega, y con eso más residuo y más estrés. Si la simulación lo confirma, el mensaje "subir el límite no reduce las esperas" se refuerza con urgencias. Si no lo confirma, hay que decirlo.
- **Mucho de lo que llega como urgente no lo es.** Perlow (10 % urgente) y Zhu y otros (la urgencia aparente atrae) sugieren que el primer filtro está en preguntar "¿qué pasa si esto espera hasta mañana?", no en el tablero.\[8\]\[10\]\[58\]

---

## 7. Mitos y cifras que no hay que usar

| Mito | De dónde sale | Cómo decirlo bien |
|---|---|---|
| "Cada interrupción cuesta 23 minutos (y 15 segundos)" | Gloria Mark lo dijo en entrevistas y lo muestra en una presentación de 2008. Según sus diapositivas, es el tiempo promedio hasta **retomar** el trabajo interrumpido (estudio de 2005), con más de dos actividades entremedio. No es "tiempo para volver a concentrarse", y un blog que rastreó el origen no encontró la cifra en un artículo publicado\[1\]\[12\]\[59\] | "En un estudio de observación, el trabajo interrumpido se retomaba, en promedio, unos 20 y tantos minutos después, y antes se hacían otras dos tareas." |
| "La multitarea cuesta hasta 40 % de productividad" | Página de la APA (2006): David Meyer "ha dicho" que los bloqueos al cambiar de tarea "pueden costar hasta 40 %" del tiempo productivo. No es un resultado medido de Rubinstein, Meyer y Evans (2001), que midieron costos de décimas de segundo en laboratorio\[60\]\[61\] | No usarla. Si aparece: "Es una frase de un investigador citada por la APA, no un dato medido."\[62\] |
| "La matriz de Eisenhower" | Eisenhower citó en 1954 a un ex presidente de universidad. La cuadrícula es posterior\[13\]\[14\] | "Una regla práctica popular, sin estudio detrás." |
| "El 80/20 de las urgencias" | No encontré ninguna fuente | No usarla. |
| "Interrumpido se trabaja peor" | Mark 2008 encontró lo contrario en velocidad: más rápido, igual calidad, más estrés\[30\] | "Se puede ir más rápido, pero se paga en estrés." |
| "Pasado el 25 % el sistema colapsa" | Número de un modelo estilizado de Repenning (aumento temporal de carga)\[18\] | "En un modelo de simulación hay un punto de no retorno, y depende de cuán cargada está la gente." |
| "Anderson recomienda 5 % de urgencias" | El 5 % es la aritmética de su ejemplo (1 sobre 20)\[4\] | "En el ejemplo del libro, una urgencia sobre veinte tareas equivale a 5 % más de carga." |

---

## 8. Frases listas para el informe y la guía

1. "Una urgencia de vez en cuando entra por la vía rápida: una a la vez y por encima del límite." (Práctica kanban, Anderson 2010)\[4\]
2. "En el juego, una urgencia al día ocupa cerca del 5 % del día. Cinco, casi un cuarto. Eso ya no es una excepción: es parte del trabajo." (En el juego, aritmética)
3. "En un equipo de ingenieros, solo 1 de cada 10 interrupciones era urgente, y casi 9 de cada 10 podían esperar." (Perlow 1999)\[8\]
4. "Con interrupciones la gente terminó un poco antes, pero con más estrés, frustración y apuro." (Mark, Gudith y Klocke 2008)\[6\]\[7\]
5. "Interrumpir a mitad de una tarea cuesta más que hacerlo entre tareas: más tiempo, más errores y más molestia." (Bailey y Konstan 2006)\[5\]
6. "Lo que se suelta no se retoma enseguida: en un estudio, se volvía a eso más de 20 minutos después y con otras tareas entremedio." (Mark, González y Harris 2005)\[1\]
7. "Lo urgente atrae aunque valga menos. Antes de decir que sí, pregunten qué se pierde si espera." (Zhu, Yang y Hsee 2018)\[10\]\[58\]
8. "Cuanto más cargado está un sistema, más chico es el golpe que lo hace vivir apagando incendios." (Repenning, Gonçalves y Black 2001, modelo de simulación)\[18\]
9. "Que una urgencia entre no es el problema. El problema es que entre todos los días y nadie lo mire en la revisión." (Guía del sitio, apoyada en Perlow 1999 y Repenning 2001)
10. "No toda interrupción es mala: muchas traen ayuda o información. En el juego solo modelamos su costo." (Jett y George 2003; Perlow 1999)\[9\]
11. "Nadie ha medido cuántas urgencias aguanta un tablero. Lo que mostramos sale de nuestra simulación, no de un estudio." (Honestidad del método)

---

## 9. Referencias

Las citas completas (autores, año, título, revista o editorial, volumen, páginas, DOI y link cuando lo verifiqué) están dentro de cada ficha de la sección 3, con su estado de verificación. Para el archivo docs/investigacion-urgencias.md, conviene copiarlas desde ahí en orden alfabético.

---

## Advertencias

- **Anderson (2010) está verificado solo por un resumen de terceros.** Antes de citar textual, confirmar con el libro impreso (capítulo 11, figura 11.3) y anotar la página.
- **Diferencia sobre el tiempo para retomar:** 23 min 15 s (Mark, presentación de 2008; según fuentes secundarias, la cifra viene de una entrevista de Gallup de 2006) contra 25 min 26 s, que es lo que dice el artículo de 2005 según dos fuentes secundarias que lo citan textual. Esto coincide con los ~25 minutos que ustedes tenían y con los "25 minutos y medio" de Mark en 2023. Falta confirmar el pasaje en el PDF de 2005.
- **No verificado:** "~25 interrupciones al día, mitad internas y mitad externas" (González y Mark 2004), DOI de varias actas de CHI y de Monk 2008, Kingman, *Essential Kanban Condensed*, y el contenido de los capítulos 2024–2026.
- **El juego no tiene holgura.** Cualquier resultado de H5 vale para una persona que siempre tiene trabajo esperando. No se puede generalizar a equipos.
- **Todo lo que respalda "cuántas urgencias aguanta" es modelo o práctica, no medición.** El informe debe decir explícitamente que la respuesta numérica es "en la simulación".

## Fuentes

1. [Mark KM Forum08](https://isr.uci.edu/events/KM-Forum-2008/presentations/Mark-KM-Forum08.pdf)
2. [The Time Famine: Toward a Sociology of Work Time - Leslie A. Perlow, 1999](https://journals.sagepub.com/doi/10.2307/2667031)
3. [\[PDF\] No task left behind?: examining the nature of fragmented work](https://www.semanticscholar.org/paper/No-task-left-behind:-examining-the-nature-of-work-Mark-Gonz%C3%A1lez/b8e863b9f099a2fe1263885f825a669dca463d43)
4. [[…] - Russ Wangler's Blog: Kanban Summary 3 of 7: WIP Limits and Classes of Service](https://[…].blogspot.com/p/this-is-summary-of-book-kanban.html)
5. [Google Scholar](https://scholar.google.com/scholar_lookup?title=On+the+need+for+attention-aware+systems:+Measuring+effects+of+interruption+on+task+performance,+error+rate,+and+affective+state&amp=&author=B.+P.+Bailey&amp=&author=J.+A.+Konstan&amp=&publication_year=2006&amp=&journal=Computers+in+Human+Behavior&amp=&pages=685-708&amp=&doi=10.1016/j.chb.2005.12.009)
6. [Category Archives: Articles](https://www.informatics.uci.edu/category/articles/page/29)
7. [(PDF) The cost of interrupted work: more speed and stress](https://www.academia.edu/22394457/The_cost_of_interrupted_work_more_speed_and_stress)
8. <https://interruptions.net/literature/Perlow-ASQ99.pdf>
9. [(PDF) Work Interrupted: A Closer Look at the Role of Interruptions in Organizational Life](https://www.academia.edu/50340669/Work_Interrupted_A_Closer_Look_at_the_Role_of_Interruptions_in_Organizational_Life)
10. [The Mere Urgency Effect MENG ZHU YANG YANG CHRISTOPHER K. HSEE](http://www1.psych.purdue.edu/~gfrancis/Classes/PSY392/ZhuEtAl2018.pdf)
11. [Mere Urgency Effect](https://academic.oup.com/jcr/article-abstract/45/3/673/4847790)
12. [Interruptions cost 23 minutes 15 seconds, right?](https://blog.oberien.de/2023/11/05/23-minutes-15-seconds.html)
13. [Address at the Second Assembly of the World Council of Churches, Evanston, Illinois](https://www.presidency.ucsb.edu/documents/address-the-second-assembly-the-world-council-churches-evanston-illinois)
14. [Eisenhower Matrix: Time Management Tool With Real Results](https://tomorrowdesk.com/info/eisenhower-matrix)
15. [\[PDF\] The cost of interrupted work: more speed and stress](https://www.semanticscholar.org/paper/The-cost-of-interrupted-work:-more-speed-and-stress-Mark-Gudith/b8da65570a3955db52b117b9bedd8f131316501d)
16. [“Constant, Constant, Multi-tasking Craziness”: Managing ...](https://ics.uci.edu/~gmark/CHI2004.pdf)
17. [ERIC - EJ824572 - The Effect of Interruption Duration and Demand on Resuming Suspended Goals, Journal of Experimental Psychology: Applied, 2008-Dec](https://eric.ed.gov/?id=EJ824572)
18. <https://mitsloan.mit.edu/shared/ods/documents?PublicationDocumentID=2527>
19. [Pardon the Interruption: An Integrative Review and Future Research Agenda for Research on Work Interruptions](https://www.semanticscholar.org/paper/Pardon-the-Interruption:-An-Integrative-Review-and-Puranik-Koopman/b2167b393e5923f14504cfdde39a3abef1740000)
20. [2004](https://hcic.org/archive/2004/)
21. ["Constant, constant, multi-tasking craziness": Managing multiple working spheres - Research Explorer The University of Manchester](https://research.manchester.ac.uk/en/publications/constant-constant-multi-tasking-craziness-managing-multiple-worki/)
22. [(PDF) "Constant, constant, multi-tasking craziness": Managing multiple working spheres](https://www.researchgate.net/publication/221518315_Constant_constant_multi-tasking_craziness_Managing_multiple_working_spheres)
23. [No Task Left Behind? Examining the Nature of Fragmented ...](https://ics.uci.edu/~gmark/CHI2005.pdf)
24. [inc you could be your own biggest interruption heres how to stop and find your focus gloria mark cited](https://ics.uci.edu/2019/08/12/inc-you-could-be-your-own-biggest-interruption-heres-how-to-stop-and-find-your-focus-gloria-mark-cited/)
25. [Inc.: “You Could Be Your Own Biggest Interruption. Here’s How to Stop and Find Your Focus” (Gloria Mark cited)](https://www.informatics.uci.edu/?p=5854)
26. [No task left behind?: examining the nature of fragmented work](https://www.academia.edu/1000032/No_task_left_behind_examining_the_nature_of_fragmented_work)
27. [The cost of interrupted work](https://dl.acm.org/doi/epdf/10.1145/1357054.1357072)
28. [The Cost of Interrupted Work: More Speed and Stress Gloria Mark](https://ics.uci.edu/~gmark/chi08-mark.pdf)
29. [The cost of interrupted work](https://dl.acm.org/doi/abs/10.1145/1357054.1357072)
30. [The cost of interrupted work is stress, not speed](https://useclocked.app/research/mark-2008-cost-of-interrupted-work/)
31. [(PDF) A Diary Study of Task Switching and Interruptions](https://www.researchgate.net/publication/2893248_A_Diary_Study_of_Task_Switching_and_Interruptions)
32. [CHAPTER 4 Task Interruptions By J. Gregory Trafton & Christopher A. Monk](https://www.interruptions.net/literature/Trafton-Reviews_HFE-3.pdf)
33. [\[PDF\] A diary study of task switching and interruptions](https://www.semanticscholar.org/paper/A-diary-study-of-task-switching-and-interruptions-Czerwinski-Horvitz/2a9b446d2b6ee8bea1149abfc23767983c1e1b84)
34. [Don’t Interrupt Me! An Examination of the](https://www.apa.org/pubs/journals/features/str-a0031637.pdf)
35. [(PDF) Pardon the Interruption: An Integrative Review and Future Research Agenda for Research on Work Interruptions](https://www.researchgate.net/publication/336837187_Pardon_the_Interruption_An_Integrative_Review_and_Future_Research_Agenda_for_Research_on_Work_Interruptions)
36. [\[PDF\] Work Interrupted: A Closer Look at the Role of Interruptions in Organizational Life](https://www.semanticscholar.org/paper/Work-Interrupted:-A-Closer-Look-at-the-Role-of-in-Jett-George/2bc388c61a80c5cc44b98849d8a6309aa34f7879)
37. [Extrinsic versus Intrinsic Sources of Interruptions in ...](https://www.tandfonline.com/doi/pdf/10.1080/15700763.2024.2448698)
38. [Work Interruptions in Digital Information Work - A Scoping Review of Influencing Factors and Effects](https://link.springer.com/chapter/10.1007/978-981-96-9330-6_61)
39. [How Do Digital Business Professionals Manage Work Interruptions? A Pilot Study on Coping Strategies](https://link.springer.com/chapter/10.1007/978-3-031-92826-0_13)
40. [Kanban — Classes of Service. How do you use the expedite swim lane?](https://medium.com/@chris.sheldon/kanban-classes-of-service-94554b2330c4)
41. [Class of Service and Work Item Type in Kanban Explained](https://[…].com/one-class-of-service-and-work-item-type-in-kanban-[…]/)
42. [The Kanban Guide | May 2025 (latest) | Kanban Guides](https://kanbanguides.org/the-kanban-guide/)
43. [Open Guide to Kanban - In the Context of Knowledge Work](https://kanbanguides.org/open-guide-to-kanban/2025.7/)
44. [Work Item Types vs Classes of Service in Kanban: Definitions, Examples & Practical Tips - Pawel Rola: […] Leader and Business Transformation Expert](https://pawelrola.com/work-item-types-vs-classes-of-service-in-kanban-definitions-examples-practical-tips/)
45. [Official Guide to The Kanban Method](https://kanban.university/wp-content/uploads/2023/04/The-Official-Kanban-Guide_A4.pdf)
46. [Simulation-of-Kanban-based-Scheduling-for-Systems-of- ...](https://www.researchgate.net/publication/273641116_Simulation_of_Kanban-based_Scheduling_for_Systems_of_Systems_Initial_Results/fulltext/550a45450cf26198a63a4fea/Simulation-of-Kanban-based-Scheduling-for-Systems-of-Systems-Initial-Results.pdf)
47. [Simulation of Kanban-based Scheduling for Systems of Systems: Initial Results - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1877050915002409)
48. [The Mere Urgency Effect](https://www.researchgate.net/publication/327103626_The_Mere_Urgency_Effect)
49. [Eisenhower Matrix: urgent vs. important](https://birdtask.com/en/blog/eisenhower-matrix/)
50. [Preemptive-Priority Queuing System](https://www.emergentmind.com/topics/preemptive-priority-queuing-system)
51. [4 The M/M/1 queue](https://iadan.win.tue.nl/que/h4.pdf)
52. [Understanding Fire Fighting in New Product Development](https://www.researchgate.net/publication/37595255_Understanding_Fire_Fighting_in_New_Product_Development)
53. [Stop Fighting Fires](https://hbr.org/2000/07/stop-fighting-fires)
54. [Firefighting in Business Process](https://www.linkedin.com/pulse/firefighting-business-process-ivan-luizio-magalh%C3%A3es)
55. [Evidence Based Educational Leadership: March 2018](https://evidencebasededucationalleadership.blogspot.com/2018/03/)
56. [Stop fighting fires](https://www.researchgate.net/publication/292657899_Stop_fighting_fires)
57. [A Closer Look at the Role of Interruptions in Organizational Life](https://www.interruptions.net/literature/Jett-AMR03.pdf)
58. [Resolving the “Mere Urgency Effect”](https://www.aretecoach.io/post/resolving-the-mere-urgency-effect)
59. [The Cost of Context Switching: What the Studies Really Measured](https://thetabextension.com/blog/cost-of-context-switching)
60. [Context Switching Statistics: What the Studies Measured](https://www.tryhugo.app/blog/context-switching-statistics)
61. [Multitasking: Switching costs](https://www.apa.org/topics/research/multitasking)
62. [Task Switching Statistics: The Real Numbers (2026) - The Blog Timer](https://theblogtimer.com/guides/task-switching-statistics)
