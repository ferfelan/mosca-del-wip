# Investigación Etapa 4.3 — "Mosca del WIP": qué respalda la evidencia, qué la matiza y qué no hay que decir

La evidencia real respalda la idea central del juego —tener más trabajo abierto no hace avanzar más rápido; desde cierto punto solo alarga la espera— pero la respalda la matemática de colas (Little, Factory Physics) y unos pocos estudios de campo con correlaciones o "experimentos naturales" (jueces italianos, reclutadores), no experimentos con equipos […]; el número exacto "2 a 4 tareas" es un resultado de nuestra simulación, no un hallazgo científico.

## TL;DR

- **Lo que sí está respaldado:** la ley de Little y las curvas de Factory Physics dicen lo mismo que nuestra mosca: hasta un "WIP crítico" más trabajo abierto sube lo terminado; pasado ese punto, solo aumenta el tiempo de espera de cada tarea. Estudios de campo (jueces italianos, Coviello et al. 2014; reclutadores, Aral et al. 2012; equipos de I+D, Bertolotti et al. 2015) muestran que hacer malabares con demasiadas cosas alarga los plazos o baja el rendimiento.
- **Lo que lo matiza:** la mayoría de las cifras famosas (eficiencia de flujo "típica" de 15 %, "40 % de productividad perdida", "23 minutos para retomar") son anécdotas, entrevistas o estimaciones, no mediciones; el libro de Modig & Åhlström es divulgación y tiene críticas académicas serias; DORA encontró que limitar el WIP *por sí solo* no predice fuerte el desempeño; y el costo de cambiar de tarea del juego (Weinberg) es una regla práctica sin datos, que es justo lo que hace que el WIP alto "castigue" tanto.
- **Qué hacer:** presentar el juego como "un experimento en el computador con supuestos rotulados", decir "el mejor límite depende de cuánto esperas" (sin esperas, nuestra propia simulación da 1), corregir varias citas (Lovallo sobre café contradice el uso que le damos; Shiu encontró que JO-F *no* activa bien el circuito de limpieza) y no usar los mitos de la sección 5.

---

## 1. Resumen en 10 líneas

1. **Respalda el norte:** la ley de Little (1961; 2011) es un teorema: WIP promedio = rendimiento × tiempo promedio en el sistema.\[1\] Si lo terminado no sube, más WIP solo significa más espera.
2. **Respalda H1/H2:** Factory Physics (Hopp & Spearman) define un "WIP crítico" desde el cual el rendimiento ya no sube; con variabilidad (bloqueos) hace falta algo más de WIP para llegar ahí.\[2\]\[3\]\[4\] Es exactamente la forma "saturación + espera" de nuestros resultados 4.1 y 4.2.
3. **Respalda H2 con datos de campo:** jueces italianos que, por sorteo de causas, hacían más malabares tardaron más en cerrar casos sin mejorar la calidad (Coviello, Ichino & Persico 2014, AER).\[5\] Reclutadores: relación en U invertida entre multitarea y productividad (Aral et al. 2012).\[6\] Equipos de I+D: U invertida entre pertenecer a varios equipos y desempeño (Bertolotti et al. 2015).\[7\]
4. **Respalda "sostenible":** Principio 8 del Manifiesto […]; Pencavel (2015): bajo 49 horas semanales la producción era proporcional a las horas (elasticidad 1,002) y desde 49 horas subía mucho menos (elasticidad 0,172); 70 horas producían casi lo mismo que 56.
5. **Matiza:** DORA/Accelerate: "WIP limits on their own do not strongly predict delivery performance"; funcionan combinados con tableros visibles y retroalimentación.\[8\]\[9\]\[10\]
6. **Matiza:** Modig & Åhlström es un libro de divulgación; una reseña académica (Bølviken & Koskela 2017) dice que sus conceptos son inconsistentes y que la idea no es nueva (Shingo).\[11\]
7. **Matiza:** Mark, Gudith & Klocke (2008): las personas interrumpidas terminaron *más rápido* pero con más estrés. Las interrupciones cuestan estrés, no necesariamente tiempo.\[12\]\[13\]
8. **Corrige:** Lovallo et al. (2005) encontraron que la cafeína, tras 5 días sin consumirla, causó "a robust increase in cortisol across the test day (p < .0001)", y Lovallo et al. (2006) que "Caffeine acted in concert with mental stress to further increase cortisol levels"; no sirven para decir que el café ayuda a bajar el estrés.
9. **Corrige:** en Shiu et al. (2024) el circuito de limpieza de antenas respondió a JO-C/E, "but not JO-F".\[14\] Nuestro estímulo incluye JO-F: hay que revisarlo o explicarlo.
10. **No decir:** "la multitarea cuesta 40 %", "23 minutos para retomar", "la eficiencia de flujo típica es 15 %", "20 % por proyecto" como dato, "usamos el 10 % del cerebro", "la mosca siente estrés".

---

## 2. Las 12 fuentes más útiles para el informe

| # | Fuente | Idea en una línea | Fuerza de la evidencia | Para qué sirve |
|---|---|---|---|---|
| 1 | Little 1961; Little 2011 (Operations Research) | WIP = rendimiento × tiempo en sistema (promedios de largo plazo)\[1\] | Teorema matemático (muy fuerte, pero solo para promedios) | H1, H3, "es matemática" |
| 2 | Hopp & Spearman, *Factory Physics* | Pasado el WIP crítico, más WIP no sube lo terminado; solo alarga el ciclo\[2\]\[15\] | Teoría de operaciones + casos de fábrica | H1, H2 (forma de la curva) |
| 3 | Coviello, Ichino & Persico 2014 (AER) | Hacer malabares con más casos alarga los plazos de un trabajador solo\[16\] | Estudio de campo con identificación causal (sorteo de causas) | H2, "una persona sola" |
| 4 | Aral, Brynjolfsson & Van Alstyne 2012 (ISR) | U invertida entre multitarea y productividad de reclutadores\[6\] | Observacional, correlacional | H2 ("ni una ni demasiadas") |
| 5 | Bertolotti et al. 2015 (Research Policy) | U invertida entre membresía en varios equipos y desempeño de equipos de I+D\[7\] | Observacional | H2 (a nivel equipo, por analogía) |
| 6 | DORA, capacidad "Work in process limits" + *Accelerate* (2018) | Límites de WIP ayudan, sobre todo junto a tableros visibles y retroalimentación\[8\]\[10\] | Encuestas grandes, correlacional\[17\] | Norte, alto desempeño |
| 7 | Modig & Åhlström 2012 + reseña Bølviken & Koskela 2017 | Eficiencia de recursos vs. de flujo; la paradoja\[11\] | Libro de práctica (divulgación); críticas académicas | Norte (con matices) |
| 8 | Mark, Gudith & Klocke 2008 (CHI) | Interrupciones: más rápido, pero más estrés y frustración\[18\] | Experimento de laboratorio (48 personas)\[19\] | Estrés (supuesto) |
| 9 | Sjøberg, Johnsen & Solberg 2012 (IEEE Software) | Pasar de Scrum a Kanban casi redujo a la mitad el lead time\[20\] | Estudio de caso (una empresa) | H4 / prueba de 2 semanas |
| 10 | Pencavel 2015 (Economic Journal) | Más de ~49 h/semana rinde cada vez menos\[21\] | Datos históricos de campo | Sostenible |
| 11 | Albulescu et al. 2022 (PLOS ONE) | Micro-pausas suben vigor y bajan fatiga; efecto en rendimiento no significativo\[22\] | Meta-análisis (22 estudios)\[23\] | Café / pausas |
| 12 | Shiu et al. 2024 (Nature) + Berg et al. 2026 (Cell) | Modelo LIF del cerebro acertó 91 % de 164 predicciones; MaleCNS = 166.700 neuronas\[24\]\[25\] | Modelo validado con experimentos; conectoma | Cerebro / mosca |

---

## 3. Fichas por tema

### A. La paradoja de la eficiencia y la eficiencia de flujo

**A1. Modig & Åhlström (2012)**
- **Idea en una línea:** se puede optimizar que la gente esté ocupada (eficiencia de recursos) o que el trabajo avance sin esperar (eficiencia de flujo); el lean prioriza la segunda.\[26\]
- **Qué dice exactamente:** según la reseña de Bølviken & Koskela (2017), que cita las páginas del libro: la eficiencia de recursos es "cuán eficientemente se usan los recursos" (p. 9); la de flujo, cuánto del tiempo total la unidad de flujo está siendo procesada (p. 13). La paradoja: enfocarse en usar bien los recursos tiende a *aumentar* la cantidad de trabajo por hacer (pp. 47–66), y es difícil o imposible combinar alta eficiencia de recursos con alta de flujo (pp. 16 y 45). Lean = "estrategia de operaciones que prioriza la eficiencia de flujo sobre la eficiencia de recursos" (pp. 117 y 127).\[11\] El libro tiene una "matriz de eficiencia" de 4 estados (en la traducción inglesa: "wasteland", "efficient islands", "efficient ocean" y "perfect state"); la variación es el gran enemigo.\[26\] Ejemplo central: Alison (42 días hasta el diagnóstico) vs. Sara (2 horas).\[11\]
- **Tipo y fuerza:** libro de divulgación / práctica. No es un estudio empírico.
- **Crítica importante (Bølviken & Koskela 2017, Lean Construction Journal, pp. 49–52):** "eficiencia de recursos" se usa con tres sentidos distintos; la primacía del flujo no es idea nueva (Shingo; Clark 1922); el libro primero dice que combinar ambas es "difícil, si no imposible" y luego que es una meta realista (p. 127); en el epílogo los autores dicen que ambas estrategias "both have their own advantages and disadvantages" (p. 156).\[11\]
- **Cita:** Modig, N., & Åhlström, P. (2012). *This is Lean: Resolving the Efficiency Paradox*. Stockholm: Rheologica Publishing. (Sin DOI; ISBN no verificado.)
- **Cómo usarla:** norte y H1, como *marco conceptual*, no como prueba.
- **Qué NO decir:** "Modig & Åhlström probaron…", ni que el libro dice que la eficiencia de recursos es mala.
- **Estado:** verificado en fuente secundaria académica (reseña con páginas); libro no revisado directamente.

**A2. Definición de eficiencia de flujo en Kanban**
- **Idea:** eficiencia de flujo = tiempo de trabajo activo ÷ tiempo total transcurrido (lead time o tiempo de ciclo).
- **Qué dice:** Kanban University (artículo de su sitio de recursos) la define como trabajo activo ÷ lead time × 100 % y dice que "work-in-progress isn't always actually in progress".\[27\] DORA, en su guía de entrega continua, pide medir "the actual elapsed time and the value-add time".\[28\]
- **Tipo:** definición de práctica, no hallazgo.
- **Qué NO decir:** que la eficiencia de flujo de la mosca (72,9 % con WIP 1 … 7,7 % con WIP 10) "se parece a los equipos reales": en nuestro modelo por turnos es casi aritmética (≈ tiempo trabajando ÷ número de tareas).
- **Estado:** verificado en Kanban University y DORA. La Guía de Kanban de Vacanti & Coleman (2020) **no se revisó**.

**A3. "Valores típicos" de eficiencia de flujo (5–15 %, 15–40 %)**
- **Idea:** las cifras circulan, pero vienen de la experiencia de consultores, no de estudios publicados con datos.
- **Qué dice exactamente:** David J. Anderson (blog de su escuela, djaa.com): "Typically, we expect flow efficiency to be in the range 1%-25%… Flow efficiency is seldom observed above 40%", y sin Kanban "usually less than 10% and as low as 1%".\[29\] La cifra "5–15 %" se atribuye a Daniel Vacanti (*Actionable […] Metrics for Predictability*) según blogs de proveedores (Businessmap).\[30\] Otros sitios dan "15–25 %" o "15–40 %" sin fuente original.\[31\]\[32\]
- **Tipo y fuerza:** opinión experta / anécdota de consultoría; no se encontró ningún conjunto de datos publicado.
- **Cómo usarla:** como mucho: "consultores de Kanban reportan que en su experiencia suele ser baja (a menudo bajo 25 %)".
- **Estado:** fuente secundaria; sin datos verificables.

### B. Teoría de colas y la forma "saturación + espera"

**B1. Little (1961) y Little (2011)**
- **Idea:** WIP promedio (L) = tasa de llegada/salida (λ) × tiempo promedio en el sistema (W).
- **Qué dice:** Little (2011) recuerda su artículo de 1961 "A proof for the queuing formula: L = λW" y que "Basically, it is a theorem in queuing theory"; repasa su uso en gestión de operaciones y arquitectura de computadores.\[1\] Vale para promedios de largo plazo en sistemas estables (lo que entra ≈ lo que sale).\[33\]
- **Tipo:** teorema matemático.
- **Citas:** Little (1961), *Operations Research*, 9(3), 383–387, DOI 10.1287/opre.9.3.383. — Little (2011), *Operations Research*, 59(3), 536–549, DOI 10.1287/opre.1110.0940.\[1\]\[34\]
- **Cómo usarla:** H1 y advertencia "es matemática".
- **Qué NO decir:** que Little *predice* cuánto tarda en notarse una baja de WIP (H3). Little habla de promedios estables, no de transiciones.
- **Estado:** datos bibliográficos verificados (INFORMS/ACM).

**B2. Hopp & Spearman, Factory Physics: WIP crítico y las tres curvas**
- **Idea:** existe un WIP mínimo con el que una línea sin variabilidad llega al máximo de lo terminado; más allá, solo crece el tiempo de ciclo.\[2\]
- **Qué dice exactamente (presentación de Wallace Hopp, "Factory Physics: The Science of Lean"):** tasa del cuello de botella (rb); tiempo de proceso bruto (T0); "Critical WIP (W0 = rb × T0): Minimum amount of WIP required for line to operate at full capacity".\[4\] Mejor caso: lo terminado = w/T0 si w ≤ W0, si no rb. Peor caso práctico (máxima aleatoriedad): TH = w·rb/(W0 + w − 1) y CT = T0 + (w − 1)/rb.\[2\]\[3\]\[15\]\[35\] En el caso real HAL, el WIP era 8,9 veces el crítico, el tiempo de ciclo 24,6 veces el de proceso y el rendimiento solo 36 % de la capacidad.\[36\]
- **¿Calza con "desde 3 tareas ya tiene con qué hacer todo el día"?** Sí, en la forma. Para una mosca sola (una "estación"), sin bloqueos W0 ≈ 1, y eso da nuestra simulación (saturación en 1 con 0 % bloqueos). Con bloqueos (variabilidad) hace falta más WIP para no quedarse sin trabajo (2 con 10 %, 3 con 20–30 %, 4 con 40 %), como predice la lógica del peor caso práctico. La diferencia: en Factory Physics, pasado W0, el rendimiento se queda plano; en nuestro juego *cae*, porque agregamos costo de cambio y residuo. Esa caída es un supuesto nuestro, no una ley.
- **CONWIP:** Spearman, Woodruff & Hopp (1990) proponen fijar un WIP total constante; **cita no verificada** (de memoria: *International Journal of Production Research*, 28(5), 879–894).
- **Cita:** Hopp, W. J., & Spearman, M. L. *Factory Physics* (1.ª ed. 1996; ediciones posteriores). Datos de edición no verificados.
- **Qué NO decir:** que Factory Physics dice que más WIP *baja* lo terminado. Dice que no lo sube (y que alarga los tiempos).
- **Estado:** verificado en presentación del propio Hopp y apuntes académicos; libro no revisado.

**B3. Kingman (1961), Reinertsen (2009), DeMarco (2001)**
- **Idea:** cuando la ocupación se acerca a 100 %, las colas crecen muy rápido; algo de holgura es económicamente sano.
- **Estado:** **no verificado en esta etapa**. Una página de práctica dice que con 90 % de ocupación los ítems esperan ~9 veces el tiempo de proceso\[37\] (relación ρ/(1−ρ) de la cola M/M/1): matemática estándar, no revisada en la fuente original. No citar páginas ni frases de Reinertsen sin verlas.

### C. Cambiar de tarea, multitarea y la U invertida (respaldo de H2)

**C1. Rubinstein, Meyer & Evans (2001)**
- **Idea:** cada cambio de tarea cuesta tiempo, y más cuanto más compleja o menos familiar es la tarea.\[38\]
- **Qué dice:** según la APA, los costos son "relatively small, sometimes just a few tenths of a second per switch", pero se suman cuando se cambia muchas veces.\[38\]
- **Tipo:** experimentos de laboratorio (4).\[39\]
- **Cita:** *Journal of Experimental Psychology: Human Perception and Performance*, 27(4), 763–797. DOI 10.1037/0096-1523.27.4.763.
- **Qué NO decir:** que este artículo mide "40 % de productividad perdida".\[40\]
- **Estado:** datos bibliográficos coinciden en varias fuentes secundarias; artículo no leído.

**C2. Leroy (2009) — residuo atencional**
- **Cita:** Leroy, S. (2009). Why is it so hard to do my work? The challenge of attention residue when switching between work tasks. *OBHDP*, 109(2), 168–181. DOI 10.1016/j.obhdp.2009.04.002.
- **Tipo:** experimentos de laboratorio. **Qué NO decir:** que Leroy midió "3 % por tarea": es un supuesto del juego.
- **Estado:** **no verificado en esta etapa** (de memoria).

**C3. Mark, Gudith & Klocke (2008) — interrupciones**
- **Idea:** las interrupciones hacen trabajar más rápido, pero con más estrés.\[41\]
- **Qué dice exactamente:** "people completed interrupted tasks in less time with no difference in quality"; "people compensate for interruptions by working faster, but this comes at a price: experiencing more stress, higher frustration, time pressure and effort".\[12\] "After only 20 minutes of interrupted performance people reported significantly higher stress, frustration, workload, effort, and pressure."\[42\] Fuentes secundarias reportan 48 participantes y tiempos de 20,31 y 20,60 min (interrumpidos) vs 22,77 min (sin interrupción).\[19\]
- **Tipo:** experimento de laboratorio, muestra mayoritariamente de estudiantes, tarea de correos.\[13\]\[43\]
- **Cita:** *Proceedings of CHI '08*, 107–110. DOI 10.1145/1357054.1357072.\[44\]
- **Qué NO decir:** que es la fuente de los "23 minutos"; que las interrupciones hacen más lento el trabajo; que más tareas abiertas = interrupciones.\[19\]
- **Estado:** verificado.

**C4. Coviello, Ichino & Persico (2014) — jueces italianos**
- **Idea:** una persona que reparte su esfuerzo entre demasiados proyectos produce menos y cada proyecto tarda más.
- **Qué dice:** AER 2014 (modelo): "When the worker works on too many projects at the same time, the output rate decreases and the time it takes to complete each project grows."\[16\] Versión empírica (JEEA 2015): los jueces que, por razones externas (sorteo de causas), trabajaban más en paralelo "take longer to complete their portfolios of cases"; el juggling "seems to have no adverse effect on the quality of the judges' decisions" (medida por apelaciones).\[5\] La magnitud cambia según la versión del trabajo. En la de 2013 (21 jueces laborales de Milán, 50.412 causas, 2000–2005): "if an increasing future caseload induces judges to increase task juggling by 1% (approximately 5 more opened cases per year), the average duration of trials would increase by 2.4 day (0.9%)". Otro borrador da ≈2,1 %. Bray et al. lo resumen como "increasing judicial multitasking by 1% increases case flow times by 2%". No dar una cifra única sin confirmarla en la versión publicada (JEEA 13, 2015, 906–947).
- **Tipo:** modelo teórico + estudio de campo con identificación causal. Fuerte para una persona sola.
- **Citas:** *American Economic Review*, 104(2), 609–623, DOI 10.1257/aer.104.2.609.\[45\] — *Journal of the European Economic Association* (2015), DOI 10.1111/jeea.12129.\[5\]
- **Cómo usarla:** H2 y "la mosca es una persona sola": el estudio más parecido a la mosca.
- **Qué NO decir:** que muestra una U invertida; muestra que *más* malabares es peor.
- **Estado:** verificado (AER en sitios de los autores y Northwestern; JEEA en Wiley).

**C5. Aral, Brynjolfsson & Van Alstyne (2012) — reclutadores**
- **Qué dice:** "productivity is greatest for small amounts of multitasking but beyond an optimum, multitasking is associated with declining project completion rates and revenue generation". Los autores consideran poco probables las explicaciones alternativas\[46\] y dicen que los resultados son "consistent with simple models of queuing and multitasking".\[6\]
- **Tipo:** observacional (una empresa de reclutamiento), correlacional.
- **Cita:** *Information Systems Research*, 23(3, part 2), 849–867\[47\] (DOI 10.1287/isre.1110.0408, verificar).
- **Cómo usarla:** H2, la mejor evidencia de campo de una U invertida en trabajo del conocimiento.
- **Estado:** verificado (NBER/MIT; páginas en el PDF de INFORMS).

**C6. Bertolotti, Mattarelli, Vignoli & Macrì (2015) — varios equipos a la vez**
- **Qué dice:** "There is an inverted U-shaped relationship between MTM and R&D team performance" (MTM = miembros en varios equipos a la vez). Equipos de 6,38 personas en promedio (2 a 27).\[7\] Se apoya en O'Leary, Mortensen & Woolley (2011, *Academy of Management Review*, 36, 461–478).\[48\]
- **Tipo:** observacional, una organización de I+D.
- **Cita:** *Research Policy*, 44(4), 911–924. DOI 10.1016/j.respol.2015.01.019.\[7\]
- **Qué NO decir:** que Bertolotti midió bloqueos de 30–60 min o el 20 % de tareas trabadas: son supuestos nuestros.
- **Estado:** verificado.

**C7. Weinberg (1992) — 20 % por proyecto**
- **Qué es:** tabla de regla práctica de *Quality Software Management, Vol. 1: Systems Thinking* (Dorset House): con 2 proyectos se pierde ~20 % en cambios, y más con 3, 4, 5. No se encontró ningún conjunto de datos detrás.
- **Estado:** fuente secundaria; decir "regla práctica de Weinberg", nunca "estudio".

### D. Límites de WIP, flujo y equipos de alto desempeño

**D1. DORA — capacidad "Work in process limits" (dora.dev)**
- **Qué dice (texto oficial):** "rookie managers assign people to work on multiple tasks in the hope of increasing throughput. Unfortunately, the result is that tasks take longer to get done, and the team burns out in the process." "DevOps Research & Assessment research shows that WIP limits help drive improvements in software delivery performance, particularly when they are combined with the use of visual displays and feedback loops from monitoring." También: "Don't relax your WIP limits when people are idle"; "The ideal is single-piece flow… This ideal may not be achievable, but it acts as a 'true north'".\[10\]
- **Accelerate (2018), cap. 7 (vía notas secundarias):** "WIP limits on their own do not strongly predict delivery performance. It's only when they're combined with the use of visual displays and have a feedback loop from production monitoring tools back to delivery teams or the business that we see a strong effect."\[8\] Las prácticas de gestión lean se asocian a mejor cultura y menos burnout (cap. 7 y 9).\[49\]
- **Tipo:** encuestas de gran escala, correlacional. Según el resumen de getAbstract, el libro se basa en "four years of research and analysis of 23,000 survey responses"; otros resúmenes hablan de más de 2.000 organizaciones.
- **Cita:** Forsgren, Humble & Kim (2018), *Accelerate*, IT Revolution Press. — DORA, https://dora.dev/capabilities/wip-limits/ (CC BY 4.0).
- **Qué NO decir:** que DORA probó que limitar el WIP causa alto desempeño, o que el WIP solo basta.\[50\]\[51\]
- **Estado:** dora.dev verificado en fuente primaria; frase de Accelerate en fuente secundaria. Informes State of DevOps 2024–2025: **no revisados**.

**D2. Sjøberg, Johnsen & Solberg (2012) — Kanban vs Scrum**
- **Qué dice:** en una empresa noruega (Software Innovation), al pasar de Scrum a Kanban el lead time promedio bajó de 12 a 5 días para errores y de 14 a 7 para ítems del backlog; los errores ponderados bajaron 10 %; la variación del lead time fue mucho menor.\[52\]\[53\]
- **Tipo:** estudio de caso (una empresa, antes/después; los autores piden replicarlo).\[54\] Kanban cambió más cosas que solo el WIP.
- **Cita:** *IEEE Software*, 29(5), 47–53. DOI 10.1109/MS.2012.110.\[52\]
- **Estado:** verificado (versión del autor en uio.no).

**D3. Otros temas de D** (Middleton & Joyce 2012; Ahmad et al. 2013/2018; SPACE 2021; DevEx 2023; Meyer et al. "good day"; Amabile & Kramer 2011; Edmondson 1999; Project Aristotle; Team Topologies; Personal Kanban)
- **Estado: no verificados en esta etapa.** Mencionarlos solo como "otros ingredientes del alto desempeño" (seguridad psicológica, progreso en trabajo significativo, experiencia del desarrollador), sin cifras. Personal Kanban (Benson & Barry 2011) es libro de práctica; no se encontró evidencia empírica sobre límites de WIP individuales.

### E. Ritmo sostenible y recuperación

**E1. Principio 8 del Manifiesto […]**
- **Español oficial ([…].org/iso/es/principles.html):** "Los procesos […] promueven el desarrollo sostenible. Los promotores, desarrolladores y usuarios debemos ser capaces de mantener un ritmo constante de forma indefinida."\[55\]
- **Inglés:** "[…] processes promote sustainable development. The sponsors, developers, and users should be able to maintain a constant pace indefinitely." (no re-verificado).
- **Tipo:** declaración de principios. **Estado:** español verificado en fuente primaria.

**E2. Pencavel (2015) — horas largas**
- **Qué dice:** con trabajadores (sobre todo mujeres) de fábricas de municiones británicas en la Primera Guerra Mundial: "below an hours threshold, output is proportional to hours; above a threshold, output rises at a decreasing rate".\[56\] El corte del modelo está en 49 h/semana. Según un resumen del paper (soon.works, 122 observaciones semanales), la elasticidad de la producción respecto de las horas es 1,002 bajo 49 h y 0,172 desde 49 h. La producción con 70 h fue cercana a la de 56 h. El autor advierte que para otros trabajadores el umbral puede ser distinto.
- **Cita:** *The Economic Journal*, 125(589), 2052–2076. DOI 10.1111/ecoj.12166.\[56\]
- **Qué NO decir:** que aplica tal cual al trabajo del conocimiento o que "49 horas" es un límite universal.\[21\]
- **Estado:** verificado.

**E3. Meijman & Mulder 1998; Sonnentag; Maslach; Bakker & Demerouti 2007; Karasek 1979**
- **Estado: no verificados.** Usar solo para decir: "la psicología del trabajo tiene modelos que explican por qué la recuperación entre días importa; el juego mide un solo día y no los modela".

### F. Estrés, carga de trabajo y pausas

**F1. Dickerson & Kemeny (2004) — cortisol**
- **Qué dice:** meta-análisis de 208 estudios de laboratorio; "the peak cortisol response occurs 21–40 min from onset"; con evaluación social las respuestas duraron "at least 40 min longer";\[57\] "Tasks containing both uncontrollable and social-evaluative elements were associated with the largest cortisol and adrenocorticotropin hormone changes and the longest times to recovery"; los resultados "contradict the belief that cortisol is responsive to all types of stressors".\[58\]
- **Tipo:** meta-análisis de estresores agudos de laboratorio.
- **Cita:** *Psychological Bulletin*, 130(3), 355–391. DOI 10.1037/0033-2909.130.3.355.\[59\]
- **Cómo usarla:** inspiración de "sube rápido y baja lento" (τ 40 / 55 min).
- **Qué NO decir:** que más tareas abiertas suben el cortisol, o que el techo de estrés por WIP viene de aquí.
- **Estado:** verificado.

**F2. Fumar: Parrott (1999); Taylor et al. (2014); Taylor et al. (2021, Cochrane)**
- **Taylor 2014 (BMJ):** quienes dejaron de fumar, frente a quienes siguieron, tuvieron menos ansiedad (SMD −0,37), depresión (−0,25), ansiedad y depresión mixtas (−0,31) y estrés (−0,27), y más afecto positivo (+0,40); "The effect sizes are equal or larger than those of antidepressant treatment for mood and anxiety disorders".\[60\] DOI 10.1136/bmj.g1151 (errata: BMJ 2014;348:g2216).\[61\]
- **Taylor 2021 (Cochrane, CD013522):** "mental health does not worsen as a result of quitting smoking, and very low‐ to moderate‐certainty evidence that smoking cessation is associated with small to moderate improvements in mental health".\[62\] DOI 10.1002/14651858.CD013522.pub2.\[63\] (Cifras exactas no verificadas.)
- **Parrott (1999)** "Does cigarette smoking cause stress?", *American Psychologist*, 54(10), 817–820: el "alivio" de fumar sería sobre todo alivio de la abstinencia. **No re-verificado.**
- **Cómo usarla:** "alivio breve y rebote" calza con Parrott y Taylor.

**F3. Café: Albulescu et al. (2022) y Lovallo et al. (2005, 2006)**
- **Albulescu 2022:** meta-análisis de 22 estudios experimentales; micro-pausas (≤10 min) suben el vigor (d = 0,36) y bajan la fatiga (d = 0,35); efecto en rendimiento no significativo (d = 0,16, p = 0,116); "recovering from highly depleting tasks may need more than 10-minute breaks".\[23\]\[64\] *PLOS ONE*, 17(8), e0272460. DOI 10.1371/journal.pone.0272460.\[64\] **Verificado.**
- **Lovallo 2005 y 2006 — ALERTA:**
  - **Lovallo et al. 2005** (*Psychosomatic Medicine* 67(5):734–739, DOI 10.1097/01.psy.0000181270.20036.06; 48 hombres y 48 mujeres, doble ciego, diseño cruzado): "After 5 days of caffeine abstinence, caffeine challenge doses caused a robust increase in cortisol across the test day (p < .0001)… Cortisol responses to caffeine are reduced, but not eliminated" en quienes la toman a diario.
  - **Lovallo et al. 2006** (*Pharmacology Biochemistry and Behavior* 83(3):441–447, DOI 10.1016/j.pbb.2006.03.005): "Caffeine acted in concert with mental stress to further increase cortisol levels (p = .011)".
  - **No sirven para decir que el café ayuda a recuperarse.** Usarlos solo como contrapunto: "la pausa ayuda; la cafeína en sí no baja el estrés".
- **Cómo usarla:** el beneficio del café del juego viene de la *pausa* (Albulescu), no de la cafeína.

**F4. ¿Más tareas simultáneas suben el estrés?**
- Evidencia encontrada: interrupciones → más estrés percibido (Mark et al. 2008).\[41\] No se encontró un estudio que mida que *tener más tareas abiertas* sube el estrés fisiológico. DORA afirma, sin cifras en esa página, que asignar varias tareas lleva a que "the team burns out".\[10\] **El techo de estrés por WIP sigue siendo un supuesto del juego.**

### G. La mosca de la fruta
Ver sección 6.

### H. El modelo de neuronas

**H1. Shiu et al. (2024)**
- **Qué hizo:** un modelo "leaky integrate-and-fire" de todo el cerebro de la mosca (conectoma FlyWire, ~127.400 neuronas en la versión del preprint, más de 50 millones de sinapsis), usando solo conexiones y tipo de neurotransmisor.\[25\]\[65\] Estudió alimentación (azúcar/agua → MN9) y limpieza de antenas.\[66\]\[67\]
- **Qué tan acertado:** "Across 164 predictions we were able to test empirically, 91% of predictions were consistent with our empirical results"; sin los experimentos optogenéticos split-GAL4, la precisión es 84 %.\[14\] Validado con optogenética, imágenes de calcio y conducta.\[66\]\[68\]
- **Limitaciones reconocidas:** cada neurona se trata igual; se ignoran morfología y dinámica de receptores;\[68\] "The baseline firing of each neuron in our model is 0 Hz", así que la inhibición no tiene efecto sin otra entrada.\[25\]\[67\] Un solo parámetro libre: el peso sináptico global.\[69\]
- **Hallazgo clave para nosotros:** las neuronas del circuito de limpieza "robustly respond to JO-CE, but not JO-F activation" (preprint).\[14\] **Nuestro estímulo incluye JO-F; revisar o explicar.**
- **Cita:** Shiu, P. K., Sterne, G. R., Spiller, N., et al. (2024). *Nature*, 634(8032), 210–219. DOI 10.1038/s41586-024-07763-9.\[70\]
- **Qué NO decir:** "el modelo es el cerebro de la mosca". Decir: "un modelo simplificado que, en el cerebro de FlyWire, acertó 9 de cada 10 predicciones probadas; nosotros lo aplicamos a otro mapa (MaleCNS) con otro peso, sin validación experimental propia".
- **Estado:** verificado.

**H2. El circuito de limpieza de antenas**
- **Hampel et al. 2015:** "Mechanosensory chordotonal neurons detect displacements of the antennae and excite three different classes of functionally connected interneurons… This multilayered circuit is organized such that neurons within each layer are sufficient to specifically elicit antennal grooming."\[71\] Neuronas: aBN1, aBN2 (cerebro) y aDN (descendente); "aBN1 provides excitatory input for aDN".\[72\] eLife 4:e08758, DOI 10.7554/eLife.08758.\[73\]
- **Hampel et al. 2020:** "Distinct subpopulations of mechanosensory chordotonal organ neurons elicit grooming of the fruit fly antennae", eLife 9:e59976, DOI 10.7554/eLife.59976: subpoblaciones del órgano de Johnston que provocan limpieza de antenas; algunas también aleteo o caminar hacia atrás.\[74\]
- **Braun et al. 2024:** "Descending networks transform command signals into population motor control", *Nature* 630(8017), 686–694, DOI 10.1038/s41586-024-07523-9 (laboratorio de Pavan Ramdya, EPFL): las neuronas "de comando" co-activan redes de neuronas descendentes; "aDN2 antennal grooming neurons connect directly to aDN1 neurons".\[75\]\[76\]
- **Estado:** verificado. La equivalencia "aBN1 = SAD093" es anotación nuestra; no verificada.

**H3. Simulaciones 2024–2026**
- El "State of Brain Emulation Report 2025" (arXiv 2510.15745) resume a Shiu como uno de los primeros modelos de cerebro completo con un solo parámetro libre.\[69\] Fuentes secundarias reportan una demostración de Eon Systems (marzo 2026) que conecta el modelo de Shiu a un cuerpo virtual (NeuroMechFly en MuJoCo) con "~91 %" de exactitud autoinformada:\[77\] **anuncio de empresa, sin revisión por pares; no usar como evidencia**. NeuroMechFly v2 y Lappalainen et al. (2024): **no verificados**.

**H4. Metáfora "vaso con un agujerito"**
- Correcta para "leaky integrate-and-fire": el vaso se llena con las señales que llegan (integra), se vacía solo por el agujerito (fuga) y al llegar a la marca se vuelca de una vez (dispara) y queda vacío un momento. Agregar: "algunas señales sacan agua (inhibición)".

### I. Aprender con juegos y simulaciones (H4 y kit 4.5)
- **Wouters et al. (2013), *Journal of Educational Psychology*, 105(2), 249–265:** meta-análisis; de memoria, los juegos serios superaron a la enseñanza convencional en aprendizaje y retención, pero *no* fueron más motivadores. **No verificado.**
- **Sitzmann (2011), *Personnel Psychology*, 64(2), 489–528:** meta-análisis de juegos de simulación en formación laboral; de memoria, mejoras en conocimiento y autoeficacia, mayores cuando el juego no es la única instrucción. **No verificado.**
- **Juegos de Kanban/flujo (Penny game, getKanban, Ball Point, Kanban pizza):** no se encontraron evaluaciones publicadas. Decir: "son muy usados; no conocemos estudios que midan si funcionan".
- **Medir en una charla:** pre/post simple (nivel 2 de Kirkpatrick), p. ej.: "¿qué pasa con el tiempo de cada tarea si duplico las tareas abiertas y termino lo mismo?".
- **Prueba de 2 semanas:** medir lo que recomienda DORA: lead time medio y su variabilidad,\[10\] más lo terminado por semana, el WIP y la edad del trabajo en curso; comparar con 2 semanas previas. Es un estudio de caso, no un experimento.

---

## 4. Lo que contradice o matiza nuestro norte

1. **El número "2 a 4" es nuestro, no de la ciencia.** Ningún estudio da un WIP óptimo universal. Sin bloqueos, nuestra simulación da 1; el óptimo sube con las esperas y baja con el costo de cambio. Frase honesta: "el mejor límite depende de cuánto esperas".
2. **La caída de lo terminado con WIP alto la ponemos nosotros.** Sin costo de cambio, lo terminado cae solo 21 % a WIP 10 (vs 55 % con nuestras reglas). La teoría de colas solo dice que el rendimiento *deja de subir*; la caída fuerte depende de la tabla de Weinberg, regla práctica sin datos.
3. **La eficiencia de flujo de la mosca es casi aritmética** (≈ tiempo trabajando ÷ número de tareas). No mostrarla como hallazgo.
4. **DORA no dice que el WIP solo baste**, y su ideal ("single-piece flow") es más extremo que nuestro "no una cosa a la vez": DORA propone atacar las esperas en vez de subir el límite ("Don't relax your WIP limits when people are idle").\[10\] Nuestra frase vale para *una persona con esperas que no puede ayudar a otros*; en un equipo, la respuesta lean a las esperas es ayudar a destrabar, no abrir más trabajo.\[10\]
5. **Modig & Åhlström tiene críticas académicas.** Usarlo como marco, no como prueba.
6. **La evidencia de campo es correlacional o de un caso** (Aral, Bertolotti, Sjøberg, DORA). La más fuerte (Coviello) es sobre jueces, no equipos […].
7. **Interrupción ≠ WIP.** En Mark et al. 2008 los interrumpidos fueron *más rápidos* (con más estrés).\[78\]
8. **Little no habla de transiciones.** H3 es un resultado de simulación.
9. **Café y cortisol:** el beneficio del "café" del juego debe atribuirse a la pausa, no a la cafeína.
10. **Cerebro:** Shiu encontró que JO-F no activa bien el circuito de limpieza;\[14\] usamos JO-C/E/F, otro conectoma (MaleCNS) y otro peso (0,090 vs 0,275 mV) sin validación experimental: es una adaptación exploratoria.
11. **"Experimento" puede confundir.** Usar "experimento en el computador (simulación)", nunca "estudio" o "evidencia" para los resultados del juego.
12. **Cuándo más WIP puede ser razonable:** muchas esperas externas que no se pueden reducir, cambios de tarea casi gratis, o trabajos con esperas largas (aprobaciones). Aral y Bertolotti sugieren beneficios de *algo* de multitarea (aprendizaje, uso de tiempos muertos).\[7\]\[46\]

---

## 5. Mitos y cifras que no hay que usar

| Mito | De dónde sale realmente | Cómo decirlo bien |
|---|---|---|
| "La multitarea cuesta 40 % de la productividad" | Página de la APA (2006): "Meyer has said that even brief mental blocks created by shifting between tasks can cost as much as 40 percent of someone's productive time". Es una declaración, no un resultado medido; el artículo de 2001 midió décimas de segundo por cambio.\[38\]\[39\] | "Cada cambio de tarea cuesta un poco de tiempo, y esos costos se suman (Rubinstein, Meyer & Evans 2001)."\[79\] |
| "Se necesitan 23 minutos para retomar una tarea" | Entrevista de Gloria Mark en Gallup (2006): el trabajo interrumpido se retomaba, en promedio, 23 min 15 s después, tras ~2 tareas intermedias. El artículo revisado (Mark, González & Harris, CHI 2005) da 25 min 26 s, con una desviación muy grande.\[19\]\[80\]\[81\] No es "tiempo para concentrarse de nuevo", y no está en Mark et al. 2008.\[19\]\[82\] | "En oficinas observadas, el trabajo interrumpido se retomaba en promedio unos 25 minutos después, con otras tareas entre medio (Mark et al. 2005)."\[81\] |
| "20 % por proyecto extra" | Tabla de regla práctica de Weinberg (1992), sin datos. | "Una regla práctica muy citada (Weinberg) sugiere…; usamos una versión más suave como supuesto." |
| "La eficiencia de flujo típica es 15 %" | Opinión de consultores (Anderson: "1–25 %"; Vacanti, citado por blogs: "5–15 %").\[29\]\[30\] Sin datos publicados. | "Consultores de Kanban reportan que suele ser baja." |
| "Usamos el 10 % del cerebro" | Mito popular sin base científica. | No usar. |
| "La mosca se estresa / fuma / siente dolor" | El circuito simulado es el de limpieza de antenas, provocado por polvo o tacto (Seeds 2014; Hampel 2015).\[71\]\[83\] No se verificó un vínculo entre limpieza y estrés en moscas. | "El cigarro es un disfraz de limpiarse las antenas: la mosca no fuma ni se estresa." |
| "Accelerate prueba que limitar el WIP da alto desempeño" | DORA: sola, la práctica no predice fuerte.\[8\] | "Limitar el WIP ayuda, sobre todo junto a tableros visibles y retroalimentación (DORA)."\[9\]\[10\] |
| "El cerebro de la mosca = 166.000 neuronas" | 139.255 es el *cerebro* (FlyWire); 166.700 es *todo el sistema nervioso central* macho (cerebro + cordón nervioso).\[24\]\[84\] | Ver sección 6. |

---

## 6. Datos verificados de la mosca para la página de contexto

- **Neuronas del cerebro:** 139.255 neuronas y 5 × 10⁷ sinapsis químicas en el cerebro de una hembra adulta (FlyWire; Dorkenwald et al. 2024, *Nature* 634:124–138, DOI 10.1038/s41586-024-07558-y).\[84\] **Verificado.**
- **Sistema nervioso central completo (macho):** 166.700 neuronas (cerebro + cordón nervioso ventral), revisadas y anotadas, 11.710 tipos; más del 95 % ligadas a tipos ya descritos (Berg et al. 2026, *Cell* 189(18):5504–5526.e15, online 3 sept. 2026, DOI 10.1016/j.cell.2026.08.015, PMID 42691995).\[24\]\[85\] **Verificado.** Nuestra simulación usó 164.587: explicar la diferencia (probablemente un filtrado en neuPrint `male-cns:v1.0`; **confirmar el motivo**).
- **Diferencias por sexo:** neuronas específicas de sexo o dimórficas son 4,8 % de las del cerebro central del macho y 2,4 % de la hembra (Berg et al. 2026).\[85\] **Verificado.**
- **Cerebro humano:** 86,1 ± 8,1 mil millones de neuronas (Azevedo et al. 2009, *J Comp Neurol* 513(5):532–541, DOI 10.1002/cne.21974; solo 4 cerebros).\[86\]\[87\] **Verificado.** El cerebro humano tiene unas 600.000 veces más neuronas que el de la mosca (86.000 millones ÷ 139.255 ≈ 618.000).
- **Tamaño ("semilla de amapola"):** **no verificado**; usar solo si aparece en un comunicado oficial.
- **Genes de enfermedades humanas:** de 929 genes de enfermedades humanas buscados, 714 (77 %) tuvieron una secuencia parecida en la mosca (Reiter et al. 2001, *Genome Research* 11(6):1114–1125, DOI 10.1101/gr.169101).\[88\]\[89\] Son coincidencias de secuencia, no siempre "el mismo gen". Decir "unas tres cuartas partes de los genes de enfermedades humanas estudiados tienen un pariente en la mosca". **Verificado.**
- **Premios Nobel (Fisiología o Medicina) ligados a la mosca:** Morgan 1933 (cromosomas y herencia); Muller 1946 (mutaciones por rayos X); Lewis, Nüsslein-Volhard y Wieschaus 1995 (control genético del desarrollo embrionario); Hoffmann 2011 (inmunidad innata; compartido con Beutler y Steinman, que no trabajaban con moscas); Hall, Rosbash y Young 2017 (reloj circadiano).\[90\]\[91\]\[92\] **Verificados.** Algunas fuentes suman Axel y Buck 2004, cuyo trabajo fue solo en parte con moscas.\[93\]
- **Hitos de mapas:** hemibrain (Scheffer et al. 2020, *eLife* 9:e57443; medio cerebro central);\[94\] FlyWire (2024, cerebro completo de hembra); Male CNS (2026, sistema nervioso central completo de macho).\[95\] Tastekin et al. 2026: **no verificado**.
- **Limpieza:** las moscas cubiertas de polvo se limpian en un orden fijo, primero los ojos y luego antenas y cabeza: "Dust-covered flies follow a predictable sequence of cleaning tasks: beginning by using their front legs to clean their eyes, they then clean their antennae and head". Jerarquía: "eyes > antennae > abdomen > wings > thorax" (Seeds et al. 2014, *eLife* 3:e02951, DOI 10.7554/eLife.02951).\[83\]\[96\] **Verificado.** Corrige "antenas primero": son los *ojos* primero.
- **Limpieza y estrés en moscas:** **no se verificó** que sea una respuesta al estrés (como en roedores). Decir: "en la mosca, este circuito es de *limpieza*; lo usamos como disfraz".
- **Licencia y crédito MaleCNS:** datos públicos en neuPrint como `male-cns:v1.0`.\[97\] El texto exacto de crédito **no se verificó**; copiarlo de la página oficial del dataset antes de publicar.
- **Nosotros NO simulamos dolor.** (Tracey et al. 2003 y Khuong et al. 2019 no se revisaron.)

---

## 7. Frases listas para el informe

1. "Estar siempre ocupado no es lo mismo que avanzar: si terminas lo mismo y abres más, cada tarea espera más." (Little 1961)
2. "Hay un punto desde el cual más trabajo abierto ya no hace terminar más; solo alarga la espera." (Hopp & Spearman, *Factory Physics*)\[2\]\[15\]
3. "En jueces italianos, hacer malabares con más causas a la vez alargó los plazos sin mejorar la calidad." (Coviello, Ichino & Persico 2014/2015)\[5\]
4. "En reclutadores, un poco de multitarea ayudó; demasiada, bajó lo terminado." (Aral, Brynjolfsson & Van Alstyne 2012)\[46\]
5. "Limitar el trabajo abierto ayuda más cuando el trabajo está a la vista y hay retroalimentación." (DORA; Forsgren, Humble & Kim 2018)\[8\]\[10\]
6. "Cuando las personas son interrumpidas, trabajan más rápido, pero con más estrés." (Mark, Gudith & Klocke 2008)\[12\]
7. "El mejor límite depende de cuánto esperas: sin esperas, en nuestra simulación el mejor es 1." (Simulación Mosca del WIP, Etapa 4.2 — supuesto, no prueba)
8. "Reducir las esperas permite bajar el límite; subir el límite no reduce las esperas." (DORA, capacidad WIP limits)\[10\]
9. "Pasadas cierta cantidad de horas, trabajar más rinde cada vez menos." (Pencavel 2015)\[98\]
10. "Las pausas cortas suben la energía y bajan la fatiga, aunque no siempre mejoran el rendimiento." (Albulescu et al. 2022)\[99\]
11. "Dejar de fumar no empeora la salud mental; más bien la mejora un poco." (Taylor et al. 2014; Cochrane 2021)\[62\]
12. "El cerebro de la mosca tiene unas 139 mil neuronas; su sistema nervioso central completo, unas 167 mil." (Dorkenwald et al. 2024; Berg et al. 2026)\[84\]\[100\]
13. "Un modelo simple de este cerebro acertó 9 de cada 10 predicciones probadas en moscas reales." (Shiu et al. 2024)\[25\]
14. "La mosca no fuma ni se estresa: el cigarro es un disfraz del circuito real con que se limpia las antenas." (Hampel et al. 2015; Seeds et al. 2014)
15. "Este juego es un experimento en el computador con supuestos rotulados; todavía no es una prueba con personas." (Norte del proyecto)

---

## 8. Verificación de las citas que ya usamos

| Cita | Estado | Correcciones / DOI |
|---|---|---|
| Little 1961, Operations Research 9(3):383–387 | Correcta | DOI 10.1287/opre.9.3.383 (de memoria) |
| Rubinstein, Meyer & Evans 2001, JEP:HPP 27(4):763–797 | Correcta (fuentes secundarias)\[19\] | DOI 10.1037/0096-1523.27.4.763 (de memoria) |
| Weinberg 1992, Quality Software Management Vol. 1 | Libro real; tabla = regla práctica | Subtítulo *Systems Thinking*; Dorset House |
| Leroy 2009, OBHDP 109(2):168–181 | No verificado | DOI 10.1016/j.obhdp.2009.04.002 (de memoria) |
| Mark, Gudith & Klocke 2008, CHI '08, 107–110 | Correcta | DOI 10.1145/1357054.1357072; no es la fuente de los "23 min"\[19\]\[44\] |
| Bertolotti et al. 2015, Research Policy 44(4):911–924 | Correcta | DOI 10.1016/j.respol.2015.01.019; mide membresía en varios equipos, no bloqueos |
| Dickerson & Kemeny 2004, Psych. Bull. 130(3):355–391 | Correcta | DOI 10.1037/0033-2909.130.3.355 |
| Parrott 1999, Am. Psychologist 54(10):817–820 | No re-verificado | DOI 10.1037/0003-066X.54.10.817 (de memoria) |
| Taylor et al. 2014, BMJ 348:g1151 | Correcta | DOI 10.1136/bmj.g1151; errata g2216\[61\] |
| Albulescu et al. 2022, PLOS ONE | Correcta | 17(8):e0272460; DOI 10.1371/journal.pone.0272460\[101\] |
| Lovallo et al. 2005 (Psychosom. Med.) y 2006 (Pharmacol. Biochem. Behav.) | **Datos correctos; mal uso en el juego** | 2005: 67(5):734–739, DOI 10.1097/01.psy.0000181270.20036.06 ("robust increase in cortisol", p < .0001). 2006: 83(3):441–447, DOI 10.1016/j.pbb.2006.03.005 ("Caffeine acted in concert with mental stress to further increase cortisol levels", p = .011). No respaldan "café = recuperación" |
| Meijman & Mulder 1998 | No verificado | Capítulo en *Handbook of Work and Organizational Psychology* (Vol. 2) (de memoria) |
| Hampel et al. 2015, eLife 4:e08758 | Correcta | DOI 10.7554/eLife.08758 |
| Hampel et al. 2020, eLife 9:e59976 | Correcta | DOI 10.7554/eLife.59976 |
| Seeds et al. 2014, eLife 3:e02951 | Correcta | DOI 10.7554/eLife.02951; primero ojos, luego antenas |
| Shiu et al. 2024, Nature 634:210–219 | Correcta | DOI 10.1038/s41586-024-07763-9 |
| Braun et al. 2024, Nature | Correcta, completar | 630(8017):686–694; DOI 10.1038/s41586-024-07523-9\[75\]\[76\] |
| Tastekin et al. 2026, Cell 189(18) | No verificado | Confirmar en Cell/PubMed |
| Dorkenwald et al. 2024, Nature | Correcta | 634(8032):124–138; DOI 10.1038/s41586-024-07558-y\[102\]\[103\] |
| Berg et al. 2026, Cell 189(18) | Correcta | 5504–5526.e15; DOI 10.1016/j.cell.2026.08.015; 166.700 neuronas\[24\] |

---

## 9. Referencias completas

- Albulescu, P., et al. (2022). "Give me a break!" A systematic review and meta-analysis on the efficacy of micro-breaks for increasing well-being and performance. *PLOS ONE*, 17(8), e0272460. DOI 10.1371/journal.pone.0272460\[23\]
- Aral, S., Brynjolfsson, E., & Van Alstyne, M. (2012). Information, technology, and information worker productivity. *Information Systems Research*, 23(3, part 2), 849–867.
- Azevedo, F. A. C., et al. (2009). *Journal of Comparative Neurology*, 513(5), 532–541. DOI 10.1002/cne.21974
- Berg, S., et al. (2026). Sexual dimorphism in the complete *Drosophila* male central nervous system connectome. *Cell*, 189(18), 5504–5526.e15. DOI 10.1016/j.cell.2026.08.015
- Bertolotti, F., Mattarelli, E., Vignoli, M., & Macrì, D. M. (2015). *Research Policy*, 44(4), 911–924. DOI 10.1016/j.respol.2015.01.019
- Bølviken, T., & Koskela, L. (2017). Book review: This is Lean. *Lean Construction Journal*, 49–52.
- Braun, J., Hurtak, F., Wang-Chen, S., & Ramdya, P. (2024). *Nature*, 630(8017), 686–694. DOI 10.1038/s41586-024-07523-9
- Coviello, D., Ichino, A., & Persico, N. (2014). Time allocation and task juggling. *American Economic Review*, 104(2), 609–623. DOI 10.1257/aer.104.2.609
- Coviello, D., Ichino, A., & Persico, N. (2015). The inefficiency of worker time use. *JEEA*. DOI 10.1111/jeea.12129
- Dickerson, S. S., & Kemeny, M. E. (2004). *Psychological Bulletin*, 130(3), 355–391. DOI 10.1037/0033-2909.130.3.355
- DORA. Capabilities: Work in process limits. https://dora.dev/capabilities/wip-limits/
- Dorkenwald, S., et al. (2024). Neuronal wiring diagram of an adult brain. *Nature*, 634(8032), 124–138. DOI 10.1038/s41586-024-07558-y
- Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate*. IT Revolution Press.\[104\]
- Hampel, S., et al. (2015). A neural command circuit for grooming movement control. *eLife*, 4, e08758. DOI 10.7554/eLife.08758
- Hampel, S., et al. (2020). *eLife*, 9, e59976. DOI 10.7554/eLife.59976
- Hopp, W. J., & Spearman, M. L. *Factory Physics*. McGraw-Hill (1.ª ed. 1996).
- Little, J. D. C. (1961). *Operations Research*, 9(3), 383–387.
- Little, J. D. C. (2011). *Operations Research*, 59(3), 536–549. DOI 10.1287/opre.1110.0940
- Mark, G., Gudith, D., & Klocke, U. (2008). *CHI '08*, 107–110. DOI 10.1145/1357054.1357072\[44\]
- Mark, G., González, V. M., & Harris, J. (2005). No task left behind? *CHI '05*, 321–330.\[105\]
- Modig, N., & Åhlström, P. (2012). *This is Lean: Resolving the Efficiency Paradox*. Rheologica Publishing.
- Pencavel, J. (2015). *The Economic Journal*, 125(589), 2052–2076. DOI 10.1111/ecoj.12166\[56\]
- Reiter, L. T., et al. (2001). *Genome Research*, 11(6), 1114–1125. DOI 10.1101/gr.169101
- Rubinstein, J. S., Meyer, D. E., & Evans, J. E. (2001). *JEP: HPP*, 27(4), 763–797.\[19\]
- Seeds, A. M., et al. (2014). *eLife*, 3, e02951. DOI 10.7554/eLife.02951
- Shiu, P. K., et al. (2024). *Nature*, 634(8032), 210–219. DOI 10.1038/s41586-024-07763-9
- Sjøberg, D. I. K., Johnsen, A., & Solberg, J. (2012). *IEEE Software*, 29(5), 47–53. DOI 10.1109/MS.2012.110\[52\]
- Taylor, G., et al. (2014). *BMJ*, 348, g1151. DOI 10.1136/bmj.g1151
- Taylor, G. M. J., et al. (2021). Smoking cessation for improving mental health. *Cochrane Database of Systematic Reviews*, CD013522. DOI 10.1002/14651858.CD013522.pub2
- Weinberg, G. M. (1992). *Quality Software Management, Vol. 1: Systems Thinking*. Dorset House.
- […] Manifesto. Principios del Manifiesto […]. https://[…].org/iso/es/principles.html

## Fuentes

1. [OR FORUM—Little's Law as Viewed on Its 50th Anniversary](https://pubsonline.informs.org/doi/10.1287/opre.1110.0940)
2. [\[PDF\] Basic Factory Dynamics - Free Download PDF](https://silo.tips/download/basic-factory-dynamics)
3. [0% found this document useful (0 votes)](https://www.scribd.com/document/561264080/Chapter07)
4. [Factory Physics: The Science of Lean Wallace Hopp Ross School of Business](https://leanenterprise.org.uk/wp-content/uploads/2018/12/4.-Wally-Hopp-Factory-Physics-The-Science-of-Lean.pdf)
5. [THE INEFFICIENCY OF WORKER TIME USE - Coviello - 2015 - Journal of the European Economic Association - Wiley Online Library](https://onlinelibrary.wiley.com/doi/abs/10.1111/jeea.12129)
6. [Information, Technology and Information Worker Productivity: Task Level Evidence](https://www.nber.org/papers/w13172)
7. [Exploring the relationship between multiple team membership and team performance: The role of social networks and collaborative technology - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0048733315000219)
8. ['Accelerate' Book Notes And Quotes](https://www.softwaremeadows.com/devops/accelerate_notes_and_quotes/)
9. ["Accelerate" by Forsgren, Humble, and Kim - Software Meadows](https://www.softwaremeadows.com/posts/one_sheet_summary-_accelerate-_the_science_of_lean_software_and_devop/images/accelerate.pdf)
10. <https://dora.dev/capabilities/wip-limits/>
11. <https://leanconstruction.org/wp-content/uploads/2022/08/LCJ_17_003.pdf>
12. [\[PDF\] The cost of interrupted work: more speed and stress](https://www.semanticscholar.org/paper/The-cost-of-interrupted-work:-more-speed-and-stress-Mark-Gudith/b8da65570a3955db52b117b9bedd8f131316501d)
13. [The cost of interrupted work is stress, not speed](https://useclocked.app/research/mark-2008-cost-of-interrupted-work/)
14. [A leaky integrate-and-fire computational model based on the connectome of the](https://www.biorxiv.org/content/10.1101/2023.05.02.539144v1.full.pdf)
15. [Factory Physics \[PDF\] \[2ju4r20ul9k0\]](https://vdoc.pub/documents/factory-physics-2ju4r20ul9k0)
16. [Time Allocation and Task Juggling∗ Decio Coviello HEC Montreal Andrea Ichino](https://www.andreaichino.it/wp-content/uploads/2019/02/continuous_giudici.pdf)
17. [Accelerate by Nicole Forsgren, Jez Humble, Gene Kim](https://www.zhuk.fi/books/accelerate-book/)
18. [(PDF) The cost of interrupted work: More speed and stress](https://www.researchgate.net/publication/221518077_The_cost_of_interrupted_work_More_speed_and_stress)
19. [Task Switching Statistics: The Real Numbers (2026) - The Blog Timer](https://theblogtimer.com/guides/task-switching-statistics)
20. [1 Quantifying the Effect of Using Kanban vs. Scrum: A Case Study1](https://www.mn.uio.no/ifi/personer/vit/dagsj/sjoberg.johnsen.solberg.ieee.sw.pdf)
21. [Do longer hours produce more output?](https://soon.works/research/do-longer-hours-produce-more-output)
22. [\[PDF\] "Give me a break!" A systematic review and meta-analysis on the efficacy of micro-breaks for increasing well-being and performance](https://www.semanticscholar.org/paper/%22Give-me-a-break!%22-A-systematic-review-and-on-the-Albulescu-Macsinga/c8adf55059d9d444f99fa13da599e6a2b536e271)
23. ["Give me a break!" A systematic review and meta-analysis on the efficacy of micro-breaks for increasing well-being and performance](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0272460)
24. [Sexual dimorphism in the complete Drosophila male central nervous system connectome - PubMed](https://pubmed.ncbi.nlm.nih.gov/42691995)
25. [A leaky integrate-and-fire computational model based on the connectome of the entire adult Drosophila brain reveals insights into sensorimotor processing - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10187186/)
26. [A book review of This is Lean! - better operations](https://better-operations.com/2013/06/30/this-is-lean/)
27. [Flow Efficiency: A great metric you probably aren’t using](https://resources.kanban.university/flow-efficiency-a-great-metric-you-probably-arent-using/)
28. [DORA](https://dora.dev/capabilities/continuous-delivery/)
29. [What We Know About Duration: Workflows - David J. Anderson School of Management](https://djaa.com/what-we-know-about-duration-workflows/)
30. [How to Measure Flow Efficiency on a Kanban Board](https://businessmap.io/blog/how-to-measure-the-flow-efficiency-of-a-process-on-a-kanban-board)
31. [What Is Flow Efficiency?](https://enji.ai/glossary/flow-efficiency/)
32. [Flow Efficiency: Formula, Benchmarks & How to Improve It](https://www.em-tools.io/engineering-metrics/flow-efficiency)
33. [OR FORUM - Little's Law as Viewed on Its 50th Anniversary.](https://www.researchgate.net/publication/220243668_OR_FORUM_-_Little's_Law_as_Viewed_on_Its_50th_Anniversary)
34. [Little’s Law](https://link.springer.com/rwe/10.1007/978-1-4419-1153-7_200407)
35. [Teaching Factory Physics Flow Benchmarking with R and Many-Objective Visuals](https://www.r-bloggers.com/2019/04/teaching-factory-physics-flow-benchmarking-with-r-and-many-objective-visuals/)
36. [Basic Factory Dynamics - ppt download](https://slideplayer.com/slide/16582447/)
37. [Flow Efficiency vs Resource Efficiency: Why High Utilization Destroys Flow — ResumeLens Kanban Blog](https://www.resumelens.org/blog/kanban/flow-efficiency-vs-resource-efficiency)
38. [Multitasking: Switching costs](https://www.apa.org/topics/research/multitasking)
39. [Context Switching Statistics 2026: The Cost of Distraction](https://www.usecarly.com/blog/context-switching-statistics/)
40. [Single-Tasking vs. Multitasking: A Data Breakdown of What the Research Actually Shows in 2026 - CEOtudent](https://ceotudent.com/en/single-tasking-vs-multitasking-data-breakdown-what-research-shows-2026)
41. [The cost of interrupted work: more speed and stress](https://newsletter.getdx.com/p/the-cost-of-interrupted-work-more)
42. [The Cost of Interrupted Work: More Speed and Stress (Conference Paper) - Studocu](https://www.studocu.com/row/document/ted-ankara-college/design-technology-sl/the-cost-of-interrupted-work-more-speed-and-stress-conference-paper/134344821)
43. [Deep Work Statistics: The Real Numbers (2026) - The Blog Timer](https://theblogtimer.com/guides/deep-work-statistics)
44. [Gloria Mark, Daniela Gudith, & Ulrich Klocke (2008)](https://www.textbookofusability.com/references/mark2008.html)
45. [Time allocation and task juggling - Northwestern Scholars](https://www.scholars.northwestern.edu/en/publications/time-allocation-and-task-juggling/)
46. [Information, Technology and Information Worker Productivity](https://ide.mit.edu/wp-content/uploads/2016/04/2011.09_Aral_Brynjolfsson_Van-Alstyne_Information-Technology-and-Information-Worker-Productivity_277.pdf)
47. [(PDF) Information, Technology and Information Worker Productivity](https://www.researchgate.net/publication/256069447_Information_Technology_and_Information_Worker_Productivity)
48. [Multiple team membership and its mechanism](https://ouci.dntb.gov.ua/en/works/lRjJJYKl/)
49. [Book Summary: Accelerate - Medium](https://tdevroome.medium.com/book-summary-accelerate-c531efe4c34c)
50. [Book notes: Accelerate, building and scaling high performing technology organizations](https://danlebrero.com/2020/01/22/accelerate-high-performing-technology-orgs-summary/)
51. [Accelerate—Nicole Forsgren, Jez Humble, Gene Kim](https://notes.blairnangle.com/accelerate)
52. [TinySwEng - R. Feldt](https://www.cse.chalmers.se/~feldt/tinysweng/121001.html)
53. [Quantifying the Effect of Using Kanban versus Scrum:](https://mediaweb.saintleo.edu/Courses/COM430/M2Readings/Quantifying%20the%20effect%20KanbanvScrum.pdf)
54. [A statistical analysis of the effects of Scrum and Kanban on software development projects - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0736584515301599)
55. [Principios del Manifiesto […]](https://[…].org/iso/es/principles.html)
56. [The Productivity of Working Hours - Pencavel - 2015 - The Economic Journal - Wiley Online Library](https://onlinelibrary.wiley.com/doi/abs/10.1111/ecoj.12166)
57. [(PDF) Acute Stressors and Cortisol Responses: A Theoretical Integration and Synthesis of Laboratory Research](https://www.researchgate.net/publication/8582418_Acute_Stressors_and_Cortisol_Responses_A_Theoretical_Integration_and_Synthesis_of_Laboratory_Research)
58. [Google Scholar](https://scholar.google.com/scholar_lookup?title=Acute+stressors+and+cortisol+responses:+A+theoretical+integration+and+synthesis+of+laboratory+research&amp=&author=S.+S.+Dickerson&amp=&author=M.+E.+Kemeny&amp=&publication_year=2004&amp=&journal=Psychological+Bulletin&amp=&pages=355-391&amp=&doi=10.1037/0033-2909.130.3.355&amp=&pmid=15122924)
59. [Are Preschoolers’ Neurobiological Stress Systems Responsive to Culturally Relevant Contexts? - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8641131/)
60. [Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1136%2Fbmj.g1151&amp=&pmid=24524926)
61. [Low Nicotine Content Cigarettes in Vulnerable Populations: Affective Disorders](https://cdn.clinicaltrials.gov/large-docs/79/NCT04090879/Prot_SAP_000.pdf)
62. [Smoking cessation for improving mental health - Taylor, GMJ - 2021](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013522.pub2/full)
63. [Scopus - Document Details](https://www.scopus.com/pages/publications/85102690274)
64. ["Give me a break!" A systematic review and meta-analysis on the efficacy of micro-breaks for increasing well-being and performance](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9432722/)
65. [(PDF) A leaky integrate-and-fire computational model based on the connectome of the entire adult Drosophila brain reveals insights into sensorimotor processing](https://www.researchgate.net/publication/370593212_A_leaky_integrate-and-fire_computational_model_based_on_the_connectome_of_the_entire_adult_Drosophila_brain_reveals_insights_into_sensorimotor_processing)
66. [A leaky integrate-and-fire computational model based on the connectome of the entire adult \*Drosophila\* brain reveals insights into sensorimotor processing](https://www.biorxiv.org/content/10.1101/2023.05.02.539144.full.pdf)
67. [A Drosophila computational brain model reveals sensorimotor processing](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11446845/)
68. [A Drosophila computational brain model reveals sensorimotor processing](https://www.nature.com/articles/s41586-024-07763-9)
69. [State of Brain Emulation Report 2025](https://arxiv.org/pdf/2510.15745)
70. [A Drosophila computational brain model reveals sensorimotor processing](https://aspirationalneuroscience.org/nomination/a-drosophila-computational-brain-model-reveals-sensorimotor-processing/)
71. [FlyBase Reference Report: Hampel et al., 2015, eLife 4: e08758](https://flybase.org/reports/FBrf0229838.html)
72. [A neural command circuit for grooming movement control](https://elifesciences.org/articles/08758)
73. [Seeds, Andrew, PhD - Department of Anatomy & Neurobiology](https://md.rcm.upr.edu/anatomyneurobiology/dt_team/dr-andrew-seeds/)
74. [Distinct subpopulations of mechanosensory chordotonal organ neurons elicit grooming of the fruit fly antennae](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7652415/)
75. [Descending networks transform command signals into population motor control](https://www.nature.com/articles/s41586-024-07523-9)
76. [FlyBase Reference Report: Braun et al., 2024, Nature 630(8017): 686--694](https://flybase.org/reports/FBrf0259864)
77. [(PDF) A Drosophila computational brain model reveals sensorimotor processing](https://www.researchgate.net/publication/384573114_A_Drosophila_computational_brain_model_reveals_sensorimotor_processing)
78. [(PDF) The cost of interrupted work: more speed and stress](https://www.academia.edu/22394457/The_cost_of_interrupted_work_more_speed_and_stress)
79. [Is Multitasking Real? The Hidden Cost of Multitasking at Work — Therapy Now](https://www.therapynowsf.com/blog/is-multitasking-real-the-hidden-cost-of-multitasking-at-work)
80. [The 23-minute interruption figure is not a recovery time · Mo RezaAli](https://therezaali.com/writing/interruption-recovery-time-measured/)
81. [How Long to Refocus After an Interruption? Real Data - Hugo](https://www.tryhugo.app/blog/how-long-to-refocus-after-interruption)
82. [How long does it take to get back to a task after an interruption? (20–26 min)](https://evy.so/facts/time-to-resume-after-interruption/)
83. [elife-02951-v1.xml](https://cdn.elifesciences.org/articles/02951/elife-02951-v1.xml)
84. [Neuronal wiring diagram of an adult brain](https://www.nature.com/articles/s41586-024-07558-y)
85. [Sexual dimorphism in the complete Drosophila male central nervous system connectome: Cell](<https://www.cell.com/cell/fulltext/S0092-8674(26)00942-6>)
86. [Eighty-six billion and counting: do we know the number of neurons in the human brain?](https://academic.oup.com/brain/article/148/3/689/7909879)
87. [Equal numbers of neuronal and nonneuronal cells make the human brain an isometrically scaled-up primate brain](https://www.ovid.com/jnls/jocn/abstract/10.1002/cne.21974~equal-numbers-of-neuronal-and-nonneuronal-cells-make-the?redirectionsource=fulltextview)
88. [(PDF) Homophila: Human disease gene cognates in Drosophila](https://www.researchgate.net/publication/11605602_Homophila_Human_disease_gene_cognates_in_Drosophila)
89. [\[PDF\] A systematic analysis of human disease-associated gene sequences in Drosophila melanogaster.](https://www.semanticscholar.org/paper/A-systematic-analysis-of-human-disease-associated-Reiter-Potocki/bc6714e0ac1dc19bb52b469d51a9b527119e5c24)
90. [Drosophilist](https://en.wikipedia.org/wiki/Drosophilist)
91. [With a little help from our (insect) friends - NobelPrize.org](https://www.nobelprize.org/drosophila/)
92. [\[Solved\] How many Nobel prizes are attributed to research using the fruit - World of Insects (11:370:202) - Studocu](https://www.studocu.com/en-us/messages/question/9639803/how-many-nobel-prizes-are-attributed-to-research-using-the-fruit-flygroup-of-answer)
93. [FlyDEGdb knowledge base on differentially expressed genes of Drosophila melanogaster, a model object in biomedicine](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12795857/)
94. [Towards Generalized Synapse Detection Across Invertebrate Species](https://arxiv.org/pdf/2509.17041)
95. [Researchers Unveil Complete Fruit Fly Connectome](https://www.sci.news/biology/complete-fruit-fly-connectome-15053.html)
96. [A suppression hierarchy among competing motor programs drives sequential grooming in Drosophila](https://elifesciences.org/articles/02951)
97. [The organization of visual pathways in the Drosophila brain: Cell](<https://www.cell.com/cell/fulltext/S0092-8674(26)00941-4>)
98. [The Productivity Of Working Hours](https://siepr.stanford.edu/publications/working-paper/productivity-working-hours)
99. [Regular 'micro breaks' at work could boost energy levels, study suggests](https://www.fox5dc.com/news/regular-micro-breaks-work-boost-energy-levels-study-2022)
100. [Microscopy and AI Decipher Fruit Fly Neural Architecture - Neuroscience News](https://neurosciencenews.com/ai-fly-connectome-31217/)
101. [The productivity of game breaks: what the research says\<!-- --\>](https://guul.games/blog/boosting-productivity-with-game-breaks-the-benefits-of-short-play-sessions)
102. [Neuronal wiring diagram of an adult brain - ORA - Oxford University Research Archive](https://ora.ox.ac.uk/objects/uuid:df8b9c06-87f4-4ab8-bee8-105579816b14)
103. [Neuronal wiring diagram of an adult brain - ADS](https://ui.adsabs.harvard.edu/abs/2024Natur.634..124D/abstract)
104. [DevOps Research and Assessment](https://en.wikipedia.org/wiki/DevOps_Research_and_Assessment)
105. [Focused, Aroused, but so Distractible: A Temporal ...](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/10/p903-mark.pdf)
