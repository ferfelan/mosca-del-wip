# Mosca del WIP: qué tiene respaldo científico, qué es metáfora y cómo preparar la Etapa 3

La idea central del juego tiene buen respaldo, pero la mayoría de los números no. Limitar el trabajo en curso (WIP) acorta el tiempo por tarea y reduce el estrés, y la ley de Little, la investigación sobre interrupciones y estudios de Kanban en equipos reales apoyan esa dirección. Casi todas las cifras exactas (la curva de rendimiento, los techos de estrés, el 3% por tarea, el "3 veces más rápido" del café) son decisiones de diseño, no datos medidos. Lo más urgente de la Etapa 3: según el modelo de Shiu et al. 2024, las neuronas JO-F (las que MaleCNS marca como "grooming") casi no activan la neurona clave aBN1. Si solo se estimulan JO-F, el circuito podría no "fumar".

## TL;DR

- **Bien fundado:** limitar el WIP baja el tiempo por tarea (ley de Little), interrumpirse sube el estrés, fumar no alivia el estrés de fondo y las micro-pausas reducen el cansancio. **Sin base medida:** la curva 100%→50% (Weinberg es una regla práctica, no un dato), los techos de estrés por número de tareas, el 3% por tarea esperando y el "×3 por 12 min" del café. Hay que presentarlos como valores ilustrativos.
- **Correcciones clave:**
  - El pico de cortisol (21–40 min desde el inicio del estresor) está bien citado, pero "cerca de una hora más para volver a lo normal" es una simplificación.
  - La cafeína sí sube el cortisol en bebedores habituales: el efecto se reduce, no desaparece, y se suma al del estrés.
  - Al juego le falta lo más potente de la teoría de colas. Hoy llegan 50 tareas al día y la capacidad máxima es de ~21,6, es decir, una utilización de ~230%. Por eso no puede mostrar la explosión de esperas cerca del 100% (Kingman).
- **Etapa 3, viable con MaleCNS (CC BY 4.0, descarga pública), con cuatro condiciones:**
  - estimular JO-C/E además de JO-F;
  - identificar aBN1 por su conectividad (no tiene ese nombre en la tabla);
  - sacar las neuronas de azúcar de la tabla S1 de Tastekin et al. 2026 (Cell);
  - imponer en el juego una regla de "uno gana" entre fumar y café, porque el modelo no trae esa competencia.

---

## 1. Resumen ejecutivo (10 líneas)

1. **Bien fundado:** menos WIP significa menos tiempo por tarea (Little 1961), y las interrupciones aumentan el estrés y la presión de tiempo (Mark, Gudith y Klocke 2008).\[1\]
2. **Bien fundado:** dejar de fumar se asocia con menos estrés (Taylor et al. 2014, BMJ).\[2\] La cafeína sube el cortisol incluso en bebedores habituales (Lovallo et al. 2005).\[3\]
3. **Bien fundado con matices:** el cortisol sube rápido y tarda más en volver (Dickerson y Kemeny 2004). El residuo atencional existe y se ha replicado (Leroy 2009). Las micro-pausas reducen la fatiga (Albulescu et al. 2022).
4. **Sin dato medido:** la curva de rendimiento por WIP. La tabla de Weinberg es una regla práctica que nadie ha validado empíricamente.
5. **Contradice en parte al juego:** en equipos de I+D, estar en muy pocos o en demasiados equipos a la vez rinde menos (curva en U invertida; Bertolotti et al. 2015). El óptimo real puede no ser WIP 1.
6. **Cambio 1:** etiquetar en pantalla todos los números como "ilustrativos" y dejar una nota de fuentes en el juego.
7. **Cambio 2:** agregar un modo "colas" con llegadas por debajo de la capacidad y tareas de tamaño variable, para mostrar cómo explotan las esperas cerca del 100% de utilización.
8. **Cambio 3:** agregar bloqueos (esperas por otros), para que WIP 2–3 pueda ganarle a WIP 1, como en la evidencia real.
9. **Cambio 4:** que fumar dé un alivio breve seguido de un rebote (el ciclo de abstinencia que describe Parrott 1999), en vez de "no hace nada".
10. **Cambio 5 (Etapa 3):** estimular JO-C/E+F, validar aDN1/aDN2 por conectividad y usar las neuronas de azúcar anotadas en Tastekin et al. 2026.

---

## 2. Tabla de veredictos

| # | Regla | Veredicto | Confianza | Evidencia clave | Recomendación concreta |
|---|---|---|---|---|---|
| 1 | Costo de cambio que crece con el WIP (100%→50%) | **Parcialmente respaldada** | Media en la dirección, baja en los números | El costo de cambiar de tarea es real en laboratorio (Rubinstein, Meyer y Evans 2001; Monsell 2003), pero se mide en décimas de segundo por cambio.\[4\] La tabla de Weinberg (2 proyectos = 20% perdido; 3 = 40%; 4 = 60%; 5 = 75%) es heurística sin validación.\[5\] Bertolotti et al. 2015 encuentran una U invertida.\[6\] | Mantener la curva suave, pero llamarla "regla práctica inspirada en Weinberg". Agregar bloqueos aleatorios (p. ej. 20% de las tareas esperan 30–60 min a otra persona): con WIP 1 la mosca quedaría ociosa, y así WIP 2–3 sería el óptimo. |
| 2 | Techo de estrés según tareas abiertas | **Metáfora de diseño con dirección respaldada** | Media en la dirección, nula en los números | Las interrupciones aumentan el estrés, la frustración, la presión de tiempo y el esfuerzo (Mark et al. 2008).\[7\] Según los modelos de demanda-control (Karasek) y demandas-recursos (JD-R), el estrés depende de la carga y también del control y los recursos disponibles. | No existe una tabla "tareas → % de estrés". Mantener la curva y aclarar que es ilustrativa. Considerar que el techo baje un poco cuando quien juega decide el WIP (más control). |
| 3 | El estrés sube rápido y baja lento | **Respaldada (cualitativamente)** | Media-alta | Dickerson y Kemeny 2004: el pico de cortisol ocurre 21–40 min después del inicio del estresor. Con estresores incontrolables y de evaluación social, el cortisol sigue alto a los 41–60 min.\[8\] | Las constantes actuales (2/3 del camino en 40 min al subir y en 55 min al bajar; τ ≈ 36 y 50 min) son razonables. Se puede hacer más asimétrico (bajar con τ ≈ 60–90 min) si el estrés viene de tareas "fuera de control". |
| 4 | Lo empezado no desaparece y cada tarea sobre el límite resta 3% | **Parcialmente respaldada** | Alta en el fenómeno, nula en el 3% | Hay residuo atencional al cambiar de tarea dejando algo inconcluso (Leroy 2009), y se ha replicado.\[9\] El efecto Zeigarnik "de memoria" NO se sostiene: el metaanálisis de Ghibellini y Meier 2025 no encuentra ventaja de recuerdo. Sí se sostiene la tendencia a retomar lo interrumpido (efecto Ovsiankina).\[10\] | Mantener la regla, presentar el 3% como ilustrativo y citar a Leroy, no a Zeigarnik. Opción: un botón de "plan para retomar" que reduzca el residuo (Leroy y Glomb 2018). |
| 5 | Fumar NO baja el estrés | **Respaldada** | Alta | Parrott 1999: fumar solo alivia la tensión que genera la propia abstinencia. Taylor et al. 2014 (metaanálisis): dejar de fumar se asocia con menos estrés (diferencia estandarizada −0,27), ansiedad (−0,37) y depresión (−0,25). Son datos observacionales.\[2\] | Más fiel a la evidencia: alivio breve (p. ej. −5 puntos por 5 min) seguido de un rebote que lo anula. Así se enseña el "ciclo" sin decir que fumar "no hace nada". |
| 6 | Café como pausa sana (solo con estrés <55%; baja el estrés 3× más rápido por 12 min) | **Parcialmente respaldada** | Media en la pausa, baja en el ×3 | Las micro-pausas de ≤10 min aumentan el vigor y reducen la fatiga, pero no mejoran el rendimiento en general; las pausas más largas ayudan más al rendimiento (Albulescu et al. 2022).\[11\]\[12\] La cafeína sube el cortisol, menos en bebedores habituales pero sin desaparecer (Lovallo 2005), y potencia la respuesta de cortisol al estrés mental (Lovallo 2006).\[3\]\[13\]\[14\] | La regla de "solo con estrés bajo" queda mejor justificada por la evidencia de cafeína más estrés. Bajar el ×3 a ×1,5–2 por 10 min y llamarlo "pausa (con café)". |
| 7 | Ley de Little para el tiempo por tarea | **Respaldada como identidad contable; mal aplicada en un punto** | Alta | Little 1961/2011: L = λW se cumple exactamente en una ventana cerrada, mirando hacia atrás. Para predecir se necesitan supuestos estadísticos.\[15\] | Los números del juego son coherentes con Little (WIP 10: 8,4/540 × 637 ≈ 9,9). Pero un tiempo de 10 h 37 min no cabe en un día de 9 h que se reinicia: aclararlo o calcularlo por semana. |
| 8 | Límites de WIP funcionan en equipos reales | **Parcialmente respaldada** | Media | Sjøberg et al. 2012: el tiempo de entrega promedio cayó cerca de 50% al pasar de Scrum a Kanban en la empresa noruega Software Innovation (bugs: de 12 a 5 días; otras tareas: de 14 a 7), aunque la productividad en corrección de bugs bajó 11%. Middleton y Joyce 2012 (un equipo de 9 personas en BBC Worldwide): en 12 meses, −37% en tiempo de entrega, +47% en consistencia de entrega y −24% en defectos reportados por clientes. Ahmad et al. 2013 encontraron solo 19 estudios primarios.\[16\] En bienestar la evidencia es escasa. | Usar estos casos como "evidencia de campo", sin prometer efectos sobre el bienestar. |
| 9 | Cada día parte limpio | **Metáfora de diseño (simplificación)** | Media | El modelo esfuerzo-recuperación (Meijman y Mulder 1998) plantea que la recuperación incompleta se acumula entre días. | Válido para el modo diario. En un "modo semana", arrastrar p. ej. el 20–30% del estrés de cierre si el día terminó sobre 50%. |
| 10 | Cigarro = disfraz del grooming de antenas | **Metáfora de diseño** | Alta (que es un disfraz) | En la mosca, el grooming responde sobre todo a estímulos mecánicos como el polvo (Seeds 2014; Hampel 2015).\[17\] La aminas (dopamina, octopamina, serotonina) lo estimulan (Yellman et al. 1997).\[18\] En roedores, el autoaseo sí es un marcador de estrés (Kalueff et al. 2016).\[19\] | Presentarlo como "las tareas son polvo en las antenas": es más honesto que "estrés neuronal". |
| 11 | Café = disfraz de la extensión de probóscide (azúcar → MN9) | **Metáfora de diseño con circuito real** | Alta | Shiu et al. 2024 validaron experimentalmente el circuito azúcar → MN9.\[20\] | Viable con MaleCNS. Ver la sección 5. |

---

## 3. Correcciones a afirmaciones del documento actual

- **Dickerson y Kemeny 2004 (Psychological Bulletin 130(3):355–391):**
  - El pico de 21–40 min desde el inicio del estresor es correcto: es su hallazgo central.\[8\]
  - "Cerca de una hora más en volver a lo normal" no es una cifra del metaanálisis. El estudio analizó la recuperación en tramos de 21–40 y 41–60 min después del estresor. Las tareas incontrolables y con evaluación social seguían elevadas a los 41–60 min, mientras que otras volvían a la línea base antes.
  - Redacción sugerida: "el cortisol hace su pico entre 20 y 40 minutos después de empezar el estrés y suele tardar del orden de una hora en volver a lo normal; más si la situación se siente incontrolable o evaluada".
  - Ojo: el cortisol no es lo mismo que el estrés que uno siente.
- **Cafeína y cortisol:** "sube un poco el cortisol" es defendible, pero se queda corto. Lovallo et al. 2005 (Psychosomatic Medicine 67(5):734–739) concluyen que la respuesta de cortisol a la cafeína se reduce, pero no se elimina, en personas que la consumen a diario.\[3\]\[13\] Lovallo et al. 2006 (Pharmacology Biochemistry and Behavior 83(3):441–447) encontraron que la cafeína potenció el cortisol ante estrés mental, más que duplicando la respuesta, tanto en consumidores habituales como en ligeros.\[14\] **Consecuencia:** la regla "café solo con estrés bajo" queda mejor apoyada de lo que el documento afirma.
- **Weinberg:** la tabla (0/20/40/60/75% perdido con 1–5 proyectos) se cita en todas partes, pero no encontré ningún estudio que la valide. Las fuentes secundarias ni siquiera coinciden en el año (1991 o 1992) ni en la página.\[5\]\[21\] Hay que presentarla como heurística de un consultor. Además, el famoso "20–40% de productividad perdida" atribuido a Rubinstein, Meyer y Evans viene de una entrevista de prensa de Meyer, no del artículo.\[22\]
- **"23 minutos para retomar la concentración":** se atribuye a menudo a Mark et al. 2008,\[23\] pero ese artículo (48 participantes, tarea de correos) encontró algo distinto: con interrupciones la gente terminó más rápido y sin peor calidad, pero con más estrés, frustración, presión de tiempo y esfuerzo.\[7\] No usar la cifra de 23 minutos con esa cita.
- **Zeigarnik:** no usarlo como base. Ghibellini y Meier 2025 (Humanities and Social Sciences Communications) no encuentran ventaja de memoria para las tareas inconclusas, y sí una tendencia general a retomarlas (Ovsiankina).\[24\]

---

## 4. Cosas que FALTAN en el modelo (por prioridad)

1. **Utilización y esperas (prioridad alta).**
   - Hoy entran 50 tareas al día de 15–35 min (media 25). La capacidad máxima con WIP 1 es 540/25 ≈ 21,6 tareas al día, así que la utilización es ≈ 230% y la cola "Por hacer" crece sin límite.
   - La fórmula de Kingman (cola de un servidor) aproxima la espera media como (ρ/(1−ρ)) × ((ca² + cs²)/2) × tiempo medio de servicio, y solo vale con ρ < 1.\[25\]\[26\]
   - Con llegadas y tamaños muy variables (CV = 1) y tareas de 25 min, la espera en cola sería de ≈ 58 min con utilización 0,70 (15 tareas al día), ≈ 122 min con 0,83 (18 al día) y ≈ 475 min con 0,95 (20,5 al día).
   - **Propuesta:** un deslizador de "tareas que llegan por día" (12–21) para que el público vea que las esperas se disparan cerca del 100%. Este es el mensaje central de Reinertsen, y hoy el juego no lo muestra.
2. **Variabilidad (alta).** Con un tamaño uniforme de 15–35 min, el coeficiente de variación del servicio es ≈ 0,23, muy bajo para trabajo de conocimiento. Con eso, Kingman da esperas de aproximadamente la mitad que con CV = 1. Conviene usar una distribución lognormal o exponencial.
3. **Bloqueos y dependencias (alta).** Sin bloqueos, WIP 1 siempre gana, y eso contradice la U invertida de Bertolotti et al. 2015.\[27\] Agregar esperas externas.
4. **Interrupciones externas (media).** Son la base de Mark et al. 2008. Hoy el estrés solo depende del WIP elegido; podrían llegar "urgencias" que se cuelan.
5. **Fatiga acumulada y modo semana (media).** Ver la regla 9.
6. **Control percibido (baja-media).** Karasek y JD-R: el mismo nivel de carga estresa menos si hay control. Así el juego premiaría "elegir" el límite.

---

## 5. Etapa 3: neurociencia

### a) El circuito de limpieza de antenas

**Hampel, Franconville, Simpson y Seeds 2015 (eLife 4:e08758)**
- Las neuronas mecanosensoriales del órgano de Johnston (JO) detectan desplazamientos de la antena\[28\] y excitan tres clases de neuronas interconectadas:\[29\]
  - dos interneuronas del cerebro, aBN1 y aBN2;\[30\]
  - neuronas descendentes, aDN (aDN1 y aDN2).\[30\]
- Según los autores, el circuito produce grooming persistente a través de aBN1 y aBN2.\[31\]
- aBN1 da entrada excitatoria a las aDN, pero no se sabía a cuál de ellas.\[31\]

**Hampel et al. 2020 (eLife 9:e59976)**
- Las subpoblaciones JO-C, JO-E y JO-F, cada una por separado, pueden provocar grooming de antenas.\[32\]
- Algunas además provocan aleteo o marcha hacia atrás.\[32\]
- JO-F (antes llamadas "aJO") responden a desplazamientos sostenidos.\[30\]

**Trabajos de conectoma posteriores (eLife 2025, Hampel/Seeds/Eichler)**
- Las JO y otros mecanorreceptores excitan dos tipos de interneuronas: **una aBN1 y tres aBN2**\[33\] (aBN2 pertenecen a la hemilinaje LB23 y reciben de aBN1).\[34\]
- Además excitan **tres aDN**.\[33\]
- Un trabajo sobre coordinación (redes centralizadas de grooming) ya habla de aBN1-3 y aDN1-3.\[35\]

**Hallazgo crítico para el proyecto (Shiu et al. 2024)**
- En FlyWire, JO-CE y JO-F hacen sinapsis sobre aBN1 (103 y 78 sinapsis respectivamente).\[36\]
- Aun así, el modelo identifica "una subpoblación de JON que, pese a su fuerte conectividad con aBN1, no logra activarla": JO-F.\[20\]
- Tu tabla de MaleCNS marca como "grooming" casi solo a JO-F, y deja JO-C/E como viento/gravedad.
- **Recomendación:** estimular JO-C + JO-E + JO-F y medir aBN1, aDN1 y aDN2 por separado. La etiqueta "grooming" de MaleCNS probablemente refleja a Hampel 2015 (aJO = JO-F), no al modelo de Shiu.

**Nomenclatura de aDN1/aDN2**
- Stürner et al. 2025 (Nature 643:158–172, descendentes en FAFB-FlyWire, FANC y MANC) agradecen a Seeds la identificación de aDN1 y aDN2.\[37\] Es decir, están emparejadas en los conectomas recientes.
- Tu hallazgo (aDN1 = DNg62, aDN2 = DNge078, anotadas como Hampel 2015) es coherente con un repositorio independiente que usa la misma equivalencia.\[38\]
- Otro proyecto aficionado usa en cambio DNg35/DNg84 como "descendentes de grooming".\[39\] Ninguna de las dos fuentes aficionadas tiene autoridad, así que hay que **confirmar por conectividad**.
- Braun et al. 2024 (Nature) muestran que **aDN2 se conecta directamente con aDN1**, y que aDN1 tiene conexiones monosinápticas con 26 otras DN.\[40\] Esto sirve como prueba.

**aBN1 en MaleCNS**
- No encontré su nombre sistemático en los conectomas recientes. Hay que identificarla por conectividad (lista abajo).

### b) Shiu et al. 2024 (Nature 634:210–219)

**El modelo**
- Leaky integrate-and-fire en Brian2 sobre todas las neuronas de FlyWire (más de 125.000 neuronas y 50 millones de conexiones sinápticas según el resumen en Nature; 127.400 neuronas revisadas según el State of Brain Emulation Report 2025).
- Pesos = número de sinapsis; signo = neurotransmisor predicho.
- Actividad base de 0 Hz y un solo parámetro libre (Wsyn).\[20\]

**Alimentación**
- Activar las neuronas gustativas de azúcar activa MN9 (y también MN6, 8 y 11), con más fuerza en el lado contrario al estímulo.\[20\]
- Con pesos barajados, solo 1 de 100 simulaciones activó MN9, frente a 100% con el conectoma real.\[20\]
- Se predijeron 47 neuronas sensibles al azúcar y suficientes para la alimentación; 14 de ellas también necesarias.\[20\]
- Las predicciones se validaron con optogenética y conducta.\[20\]
- Los propios autores reportan que, de 164 predicciones que pudieron probar experimentalmente, el 91% coincidió con sus resultados empíricos (84% sin los experimentos optogenéticos split-GAL4, según el preprint).

**Grooming**
- Según el resumen en Nature, activar las neuronas mecanosensoriales predice la activación de un pequeño conjunto de neuronas que forma el circuito de grooming de antenas; en el preprint, aBN1, aBN2, aDN1 y aDN2 se reconocieron por su morfología ya descrita tras activar las 147 JON.
- Solo cuatro neuronas además de aDN1 la activan: aBN1, aDN2 y dos débiles (<2 Hz).\[36\]

**Limitaciones (dichas por los autores o evidentes en el método)**
- Las tasas absolutas probablemente no son exactas.\[20\]
- No modela neuromodulación: dopamina, serotonina y octopamina se tratan como excitatorias.\[41\]
- No modela sinapsis eléctricas, estado de hambre ni dinámica de compuertas.
- Las descendentes estaban incompletas en FlyWire, una limitación que MaleCNS sí resuelve porque incluye cerebro y cordón nervioso.\[20\]

**Cómo replicarlo con MaleCNS**
- MaleCNS tiene 166.483 neuronas y 25,6 millones de pares conectados (124,2 millones de conexiones sinápticas).\[42\]
- Ya existen repositorios públicos que corren LIF sobre MaleCNS v1.0 (p. ej. fly_eat_project, malecns-lab, fly-connectome-lab).\[43\]\[44\]\[45\]
- En un MacBook Pro M5 de 16 GB, la matriz dispersa ocupa del orden de cientos de MB y es manejable. Para precomputar 10 niveles de WIP con varias repeticiones, conviene recortar a un subgrafo de 2–3 saltos alrededor del circuito, o usar matrices dispersas en PyTorch.

### c) Neuronas de azúcar en MaleCNS

- La fuente clave es **Tastekin et al. 2026 (Cell 189(18):5527–5551.e5)**, el conectoma gustativo completo en FAFB/FlyWire, MANC y MaleCNS.\[46\]
  - Los Body IDs de los tipos de neuronas gustativas (GRN) y motoneuronas están en su **Tabla S1**.\[46\]
  - Proponen que las GRN labelares **LB3b** expresan receptores de azúcar.\[47\]
  - En ala: **WG2**. En pata: **LgLG3** (probablemente Gr5a).\[47\]
  - Un socio clave es la ascendente "Dandelion" (**AN13B002** en MaleCNS, AN_GNG_68 en FlyWire).\[47\]
- **Macho vs hembra (Berg et al. 2026, Cell 189(18):5504–5526):**
  - La periferia sensorial y motora es mayormente igual entre sexos.\[48\]
  - En gusto, el dimorfismo del cerebro se concentra en 12 de 43 tipos de GRN del macho, y el procesamiento gustativo temprano es más dimórfico en el cordón nervioso que en el cerebro.\[42\]
  - Los conteos de GRN de "taste pegs" difieren por sexo.\[49\]
  - Se espera que el circuito labelar azúcar → MN9 se conserve, pero hay que comprobarlo en la simulación.

### d) ¿El grooming tiene que ver con el estrés?

- **En la mosca:** el grooming responde sobre todo a irritantes mecánicos, con un orden fijo (Seeds 2014).\[50\] Las aminas biogénicas lo estimulan; en moscas decapitadas, los agonistas D1 de dopamina estimulan selectivamente el grooming (Yellman et al. 1997, PNAS).\[18\] Su variabilidad se atribuye en parte al estado interno.\[51\]
- **En roedores:** Kalueff et al. 2016 (Nat Rev Neurosci 17:45–59) describen el autoaseo como marcador sensible de estrés, con una relación de U invertida según qué tan aversiva es la situación.\[19\]\[52\]
- **Veredicto:** la metáfora cigarro = estrés es plausible en mamíferos, pero débil para la mosca y, sobre todo, para la Etapa 3, donde la entrada sería mecánica. Es un disfraz. La forma honesta de contarlo es "las tareas son polvo en las antenas".

### e) Competencia entre comportamientos

- Seeds et al. 2014 (eLife 3:e02951): las acciones de grooming compiten en una jerarquía de supresión (ojos > antenas > abdomen > alas > notum) con selección "uno gana".\[53\]
- El preprint de Shiu indica que el circuito de grooming **no se superpone** con los circuitos gustativos.\[54\]
- Por lo tanto, el LIF no generará solo la exclusión entre fumar y café. Hay que imponer una regla en el juego: gana el que tenga la mayor tasa normalizada de su descendente o motoneurona, con un periodo refractario.

### f) Licencias y descargas

- MaleCNS tiene licencia CC BY: lo dicen la página oficial de descarga y el artículo de Cell.\[42\]\[55\]
- Los archivos están en gs://flyem-male-cns/v1.0/connectome-data/flat-connectome/, sin cuenta: body-annotations…feather, body-neurotransmitters…feather (~42 MB) y connectome-weights…minconf-0.5.feather.\[44\]\[55\]\[56\]
- Un repositorio reporta ~1,1 GB para el archivo de pesos, frente a tus ~508 MB.\[57\] Verifica el tamaño y el hash al descargar.

### g) Lista de verificación para Claude Code (tabla de MaleCNS)

1. **JO:**
   - Filtrar por clase o tipo que contenga "JO".
   - Contar por subtipo (JO-A/B/C/E/F) y por lado.
   - Verificar el "superclass" sensorial.
2. **aBN1 (por conectividad):**
   - Buscar interneuronas intrínsecas del cerebro, en GNG/AMMC, con soma en el cerebro, que estén entre las 5 principales receptoras de JO-C/E/F sumadas.
   - Debe haber **1 por lado**, probablemente colinérgica (excitatoria).
   - Debe enviar sinapsis a DNg62 y/o DNge078.
   - Revisar la columna de sinónimos ("synonyms") y buscar "aBN".
3. **aBN2:**
   - Buscar en la columna de hemilinaje "LB23".
   - Esperar **3 por lado**, que reciban de la candidata a aBN1 y de JO.
4. **aDN1/aDN2:**
   - Confirmar que DNg62 y DNge078 reciben de JO y/o aBN1.
   - Confirmar una **conexión directa DNge078 → DNg62** (aDN2 → aDN1, como en Braun et al. 2024).
   - Confirmar que proyectan al neurómero protorácico (T1) del cordón.
   - Buscar si hay una tercera aDN.
5. **MN9:**
   - Confirmar 2 (una por lado).
   - Confirmar que recibe más de las GRN de azúcar contralaterales en la simulación.
6. **Azúcar:**
   - Cruzar los Body IDs de la Tabla S1 de Tastekin 2026 con la tabla; buscar tipos que contengan "LB3b".
   - Verificar el vínculo con AN13B002 (Dandelion).
7. **Simulación de prueba (antes del juego):**
   - azúcar sola → MN9 > 0 Hz;
   - JO-C/E → aBN1 > 0 Hz;
   - JO-F sola → aBN1 débil (replicar Shiu);
   - pesos barajados → MN9 ≈ 0.
8. **Precomputar:** para WIP 1–10, mapear WIP a la tasa de estimulación de JO (p. ej. 10–200 Hz, como en Shiu) y guardar las tasas de aDN1/aDN2/MN9.

### Riesgos y plan B

- **Riesgo 1:** que aBN1 no aparezca. Plan B: usar el conjunto de las 5 neuronas que más reciben de JO.
- **Riesgo 2:** que JO-F no active el circuito. Plan B: estimular JO-C/E.
- **Riesgo 3:** que el circuito de azúcar del macho difiera. Plan B: usar las GRN de pata (LgLG3).
- **Riesgo 4:** que la simulación no cree exclusión entre conductas. Plan B: la regla de "uno gana" descrita en e).
- **Plan C:** si nada funciona, presentar la Etapa 3 como "la mosca usa conexiones reales para decidir" solo en el café (el circuito validado), y mantener el cigarro ilustrativo.

---

## 6. Registro de fuentes y estado de verificación

V = verificada en esta investigación (texto o resumen leído). M = cita de memoria o fuente secundaria, a confirmar.

| Fuente | Datos | Estado |
|---|---|---|
| Dickerson SS, Kemeny ME (2004) | Psychol Bull 130(3):355–391. DOI 10.1037/0033-2909.130.3.355 | V\[58\] |
| Shiu PK et al. (2024) | Nature 634:210–219. DOI 10.1038/s41586-024-07763-9 | V\[59\] |
| Hampel S, Franconville R, Simpson JH, Seeds AM (2015) | eLife 4:e08758. DOI 10.7554/eLife.08758 | V\[31\] |
| Hampel S et al. (2020) | eLife 9:e59976. DOI 10.7554/eLife.59976 | V\[32\] |
| Hampel S, McKellar CE, Simpson JH, Seeds AM (2017) | eLife 6:e28804. DOI 10.7554/eLife.28804 | V\[60\] |
| Seeds AM et al. (2014) | eLife 3:e02951. DOI 10.7554/eLife.02951 | V\[61\] |
| Zhang N, Guo L, Simpson JH (2020) | Curr Biol 30:988–1001 | M |
| Stürner T et al. (2025) | Nature 643:158–172. DOI 10.1038/s41586-025-08925-z | V |
| Braun J et al. (2024) | "Descending networks transform command signals into population motor control", Nature. DOI 10.1038/s41586-024-07523-9 | V |
| Berg S et al. (2026) | Cell 189(18):5504–5526.e15. DOI 10.1016/j.cell.2026.08.015 | V\[56\] |
| Tastekin I et al. (2026) | Cell 189(18):5527–5551.e5 | V (DOI por confirmar)\[46\]\[62\] |
| Eichler K et al. (2024) y conectoma mecanosensorial de cabeza (eLife 2025, reviewed preprint 108044) | — | V parcial |
| MaleCNS, página de descarga | male-cns.janelia.org/download (licencia CC BY) | V |
| Yellman C et al. (1997) | PNAS 94(8):4131 | V (título y resumen) |
| Kalueff AV et al. (2016) | Nat Rev Neurosci 17:45–59. DOI 10.1038/nrn.2015.8 | V\[63\] |
| Leroy S (2009) | OBHDP 109(2):168–181. DOI 10.1016/j.obhdp.2009.04.002 | V\[64\] |
| Leroy S, Glomb TM (2018) | Organization Science | M |
| Ghibellini R, Meier B (2025) | Humanit Soc Sci Commun. DOI 10.1057/s41599-025-05000-w | V\[65\] |
| Masicampo EJ, Baumeister RF (2011) | JPSP 101(4):667–683 | M |
| Lovallo WR et al. (2005) | Psychosom Med 67(5):734–739 | V\[66\]\[67\] |
| Lovallo WR et al. (2006) | Pharmacol Biochem Behav 83(3):441–447 | V\[13\] |
| Albulescu P et al. (2022) | PLOS ONE 17(8):e0272460. DOI 10.1371/journal.pone.0272460 | V\[68\] |
| Taylor G et al. (2014) | BMJ 348:g1151. DOI 10.1136/bmj.g1151 | V\[69\] |
| Parrott AC (1999) | Am Psychol 54(10):817–820 | M |
| Mark G, Gudith D, Klocke U (2008) | CHI '08:107–110. DOI 10.1145/1357054.1357072 | V\[23\] |
| Rubinstein JS, Meyer DE, Evans JE (2001) | JEP:HPP 27(4):763–797. DOI 10.1037/0096-1523.27.4.763 | V\[70\] |
| Monsell S (2003) | TiCS 7(3):134–140. DOI 10.1016/S1364-6613(03)00028-7 | V\[71\] |
| O'Leary MB, Mortensen M, Woolley AW (2011) | AMR 36(3):461–478. DOI 10.5465/AMR.2011.61031807 | V\[72\]\[73\] |
| Bertolotti F et al. (2015) | Research Policy 44(4):911–924. DOI 10.1016/j.respol.2015.01.019 | V\[6\] |
| Sjøberg DIK, Johnsen A, Solberg J (2012) | IEEE Software 29(5):47–53. DOI 10.1109/MS.2012.110 | V\[74\] |
| Middleton P, Joyce D (2012) | IEEE Trans Eng Manag 59(1):20–32 | V (DOI por confirmar)\[75\] |
| Ahmad MO, Markkula J, Oivo M (2013) | Euromicro SEAA:9–16. DOI 10.1109/SEAA.2013.28 | V\[16\] |
| Little JDC (1961) | Oper Res 9(3):383–387. DOI 10.1287/opre.9.3.383 | V\[76\] |
| Little JDC (2011) | Oper Res 59(3):536–549. DOI 10.1287/opre.1110.0940 | V\[77\] |
| Kingman JFC (1961) | Math Proc Camb Phil Soc 57(4):902–904. DOI 10.1017/S0305004100036094 | V cita; fórmula de memoria\[78\] |
| Weinberg GM (1992) | Quality Software Management Vol. 1, Dorset House | M |
| Karasek (1979); Bakker y Demerouti (2007); Sonnentag y Fritz (2007); Meijman y Mulder (1998); Brosschot et al. (2006); Reinertsen (2009); Anderson (2010); Vacanti (2015); Forsgren, Humble y Kim (2018) | — | M |

---

## 7. Frases honestas para charlas

- "La mosca y su cerebro de 25.000 puntos son reales: posiciones de neuronas de un conectoma público. Las luces, por ahora, son ilustrativas."
- "Que limitar el WIP acorte el tiempo por tarea no es opinión: es la ley de Little. Los porcentajes exactos del juego son ilustrativos."
- "La curva de pérdida por multitarea es una regla práctica de Weinberg, no una medición. La investigación muestra que el costo existe; el tamaño depende del trabajo."
- "En la vida real, WIP 1 no siempre gana: cuando hay bloqueos, un poco de paralelismo ayuda. El mensaje no es 'una cosa a la vez', sino 'un límite'."
- "Fumar no le baja el estrés a la mosca porque la evidencia dice que fumar solo alivia la abstinencia que el mismo cigarro provoca."
- "El café es en realidad una pausa: lo que recupera es el corte, no la cafeína."
- "En la Etapa 3, el 'cigarro' es un disfraz: la mosca se está limpiando las antenas, un circuito real y estudiado. Las tareas son polvo en sus antenas."

## Fuentes

1. [\[PDF\] The cost of interrupted work: more speed and stress](https://www.semanticscholar.org/paper/The-cost-of-interrupted-work:-more-speed-and-stress-Mark-Gudith/b8da65570a3955db52b117b9bedd8f131316501d)
2. [\[PDF\] Change in mental health after smoking cessation: systematic review and meta-analysis](https://www.semanticscholar.org/paper/Change-in-mental-health-after-smoking-cessation:-Taylor-McNeill/3703d81b9205cf1f768bd3f9373aa417a477e5cd)
3. [Caffeine Stimulation of Cortisol Secretion Across the Waking Hours in Relation to Caffeine Intake Levels](https://www.semanticscholar.org/paper/Caffeine-Stimulation-of-Cortisol-Secretion-Across-Lovallo-Whitsett/9677248d730e4e6b77d9fa03a35c04d1a1d0508b)
4. [Multitasking: Switching costs](https://www.apa.org/topics/research/multitasking)
5. [Context switching FAQ: 20 questions on focus, meetings, and interruption cost (2026)](https://contextcost.com/faq)
6. [EconPapers: Exploring the relationship between multiple team membership and team performance: The role of social networks and collaborative technology](https://econpapers.repec.org/article/eeerespol/v_3a44_3ay_3a2015_3ai_3a4_3ap_3a911-924.htm)
7. [Executive Task Switching and Decision Latency: Evidence Review](https://remoteexecutivesupport.com/research/executive-task-switching-decision-latency)
8. [(PDF) Acute Stressors and Cortisol Responses: A Theoretical Integration and Synthesis of Laboratory Research](https://www.researchgate.net/publication/8582418_Acute_Stressors_and_Cortisol_Responses_A_Theoretical_Integration_and_Synthesis_of_Laboratory_Research)
9. [Taking Engagement to Task: The Nature and Functioning of Task Engagement Across Transitions - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8827296/)
10. [Interruption, recall and resumption: a meta-analysis of the Zeigarnik and Ovsiankina effects](https://www.semanticscholar.org/paper/Interruption,-recall-and-resumption:-a-of-the-and-Ghibellini-Meier/c98a41f13fd6f3b0b86047ecf92eeb03ac458626)
11. ["Give me a break!" A systematic review and meta-analysis on the efficacy of micro-breaks for increasing well-being and performance](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0272460)
12. [The productivity of game breaks: what the research says\<!-- --\>](https://guul.games/blog/boosting-productivity-with-game-breaks-the-benefits-of-short-play-sessions)
13. [What Your Morning Coffee Is Actually Doing to Your Hormones (You Don't Have to Quit — You Have to Move It 90 Minutes)](https://victorfitfleet.substack.com/p/what-your-morning-coffee-is-actually)
14. [Habitual Caffeine Use Is Associated With Heightened Cortisol Reactivity to Lab-Based Stress in Two Samples](https://www.researchgate.net/publication/382296638_Habitual_Caffeine_Use_is_Associated_with_Heightened_Cortisol_Reactivity_to_Lab-Based_Stress_in_Two_Samples)
15. [Reprint: Little’s Law as Viewed on Its 50th Anniversary - Project Production Institute](https://projectproduction.org/journal/reprint-littles-law-as-viewed-on-its-50th-anniversary/)
16. [Kanban in Software Development](https://dl.acm.org/doi/10.1109/SEAA.2013.28)
17. [Somatotopic organization among parallel sensory pathways that promote a grooming sequence in Drosophila](https://elifesciences.org/reviewed-preprints/87602)
18. [Conserved and sexually dimorphic behavioral responses to biogenic amines in decapitated Drosophila](https://pnas.org/content/94/8/4131)
19. ['Stressing' rodent self-grooming for neuroscience research](https://www.nature.com/articles/nrn.2016.103)
20. [A Drosophila computational brain model reveals sensorimotor processing - Nature](https://www.nature.com/articles/s41586-024-07763-9)
21. [The research on context switching: Weinberg, Mark, Csikszentmihalyi, Leroy, DORA (2026)](https://contextcost.com/the-research)
22. [Is Multitasking Really Possible? - The Fountain Magazine](https://web.fountainmagazine.com/all-issues/2025/issue-163-jan-feb-2025/is-multitasking-really-possible)
23. [The Cost of Interrupted Work: More Speed and Stress - High Performance Routines](https://www.highperformanceroutines.com/the-cost-of-interrupted-work-more-speed-and-stress/)
24. [Zeigarnik effect](https://en.wikipedia.org/wiki/Zeigarnik_effect)
25. [Kingman’s Formula](https://blog.mikebowler.ca/2026/09/28/kingmans-formula/)
26. [1 queue](https://en.wikipedia.org/wiki/G/G/1_queue)
27. [Exploring the relationship between multiple team membership and team performance: The role of social networks and collaborative technology - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0048733315000219)
28. [A comprehensive mechanosensory connectome reveals a somatotopically organized neural circuit architecture controlling stimulus-aimed grooming of the Drosophila head](https://elifesciences.org/reviewed-preprints/108044v1)
29. [FlyBase Reference Report: Hampel et al., 2015, eLife 4: e08758](https://flybase.org/reports/FBrf0229838.html)
30. [Distinct subpopulations of mechanosensory chordotonal organ neurons elicit grooming of the fruit fly antennae](https://elifesciences.org/articles/59976)
31. [A neural command circuit for grooming movement control](https://elifesciences.org/articles/08758)
32. [Distinct subpopulations of mechanosensory chordotonal organ neurons elicit grooming of the fruit fly antennae](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7652415/)
33. [A comprehensive mechanosensory connectome reveals a somatotopically organized neural circuit architecture controlling stimulus-aimed grooming of the Drosophila head - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13246004/)
34. [-figure supplement 3. Distribution of JON synapses in the aBN1...](https://www.researchgate.net/figure/figure-supplement-3-Distribution-of-JON-synapses-in-the-aBN1-dendrite-dendrogram-A_fig16_342058339)
35. [Centralized brain networks controlling antennal grooming coordination - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13314972/)
36. [A leaky integrate-and-fire computational model based on the connectome of the entire adult Drosophila brain reveals insights into sensorimotor processing - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10187186/)
37. [Comparative connectomics of Drosophila descending and ascending neurons](https://www.nature.com/articles/s41586-025-08925-z)
38. [GitHub - IrohAmca/NeuroPest: Desktop fly pet driven by a FlyWire-based reduced neural circuit · GitHub](https://github.com/IrohAmca/NeuroPest)
39. [GitHub - mpvasilis/flywire-playground: Whole fruit-fly brain (FlyWire v783, 139k neurons) simulated in the browser with a 3D fly that listens to music, trades, grooms and escapes, driven by real descending neuron firing · GitHub](https://github.com/mpvasilis/flywire-playground)
40. [Descending networks transform command signals into population motor control](https://www.nature.com/articles/s41586-024-07523-9)
41. [State of Brain Emulation Report 2025](https://arxiv.org/pdf/2510.15745)
42. [Sexual dimorphism in the complete Drosophila male central nervous system connectome: Cell](<https://www.cell.com/cell/fulltext/S0092-8674(26)00942-6>)
43. [GitHub - shyoon-devops/fly-connectome-lab: Interactive MaleCNS connectome and NeuroMechFly browser lab. · GitHub](https://github.com/shyoon-devops/fly-connectome-lab)
44. [GitHub - JustSlash43/fly\_eat\_project · GitHub](https://github.com/JustSlash43/fly_eat_project)
45. [GitHub - merolaagi/malecns-lab: Measured MaleCNS connectome subsets with assumed dynamics: locomotion LIF model, odor-learning module and circuit atlas · GitHub](https://github.com/merolaagi/malecns-lab)
46. [The complete gustatory connectome of adult Drosophila reveals how taste guides feeding, foraging, and social behavior: Cell](<https://www.cell.com/cell/fulltext/S0092-8674(26)00943-8>)
47. [The complete gustatory connectome of adult Drosophila reveals how taste guides feeding, foraging, and social behavior - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0092867426009438)
48. [The Connectome and the Quest for the Functional Logic of the Drosophila Early Olfactory System](https://arxiv.org/pdf/2608.19290)
49. [From Sensory Detection to Motor Action: The Comprehensive \*Drosophila\* Taste-Feeding Connectome](https://www.biorxiv.org/content/10.1101/2025.08.25.671814.full.pdf)
50. [A suppression hierarchy among competing motor programs drives sequential grooming in Drosophila](https://elifesciences.org/articles/02951)
51. [Frontiers](https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2021.769372/full)
52. [\- Document - Meanings of self-grooming depend on an inverted U-shaped function with aversiveness](https://go.gale.com/ps/anonymous?id=GALE%7CA460952141&issn=1471003X&it=r&linkaccess=abs&p=AONE&sid=googleScholar&sw=w&v=2.1)
53. [Simultaneous activation of parallel sensory pathways promotes a grooming sequence in Drosophila](https://elifesciences.org/articles/28804)
54. [A leaky integrate-and-fire computational model based on the connectome of the entire adult Drosophila brain reveals insights into sensorimotor processing - PubMed](https://pubmed.ncbi.nlm.nih.gov/37205514/)
55. [Download - MaleCNS connectome](https://male-cns.janelia.org/download/)
56. [Humanoid Locomotion with a Fly-Inspired Recurrent Controller](https://arxiv.org/pdf/2609.27001)
57. [GitHub - avisharm-alt/connectome-lab: Reproducible fly-connectome experiments: sparse graph analysis, perturbation controls, and MaleCNS data adapters. · GitHub](https://github.com/avisharm-alt/connectome-lab)
58. [Are Preschoolers’ Neurobiological Stress Systems Responsive to Culturally Relevant Contexts? - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8641131/)
59. [A Drosophila computational brain model reveals sensorimotor processing](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11446845/)
60. [Andrew Seeds - Publications](https://neurotree.org/beta/publications.php?pid=678306)
61. [A suppression hierarchy among competing motor programs drives sequential grooming in Drosophila - PubMed](https://pubmed.ncbi.nlm.nih.gov/25139955/)
62. [First complete connectome of male fly central nervous system allows for unprecedented male-female brain comparison](https://mrclmb.ac.uk/news-events/articles/first-complete-connectome-of-male-fly-central-nervous-system-allows-for-unprecedented-male-female-brain-comparison/)
63. [Neurobiology of rodent self-grooming and its value for translational neuroscience](https://www.nature.com/articles/nrn.2015.8)
64. [Why is it so hard to do my work? The challenge of attention residue when switching between work tasks](https://www.semanticscholar.org/paper/Why-is-it-so-hard-to-do-my-work-The-challenge-of-Leroy/58a602c378da63993ab19b514e1bd57817bc18e5)
65. [REVIEW ARTICLE Interruption, recall and resumption: a meta-analysis](https://www.nature.com/articles/s41599-025-05000-w.pdf)
66. [Caffeine stimulation of cortisol secretion across the waking hours in relation to caffeine intake levels - Experts@Minnesota](https://experts.umn.edu/en/publications/caffeine-stimulation-of-cortisol-secretion-across-the-waking-hour/)
67. [Caffeine Stimulation of Cortisol Secretion Across the Waking Hours in Relation to Caffeine Intake Levels](https://www.researchgate.net/publication/7561673_Caffeine_Stimulation_of_Cortisol_Secretion_Across_the_Waking_Hours_in_Relation_to_Caffeine_Intake_Levels)
68. ['Micro-breaks' from tasks show promise in boosting wellbeing](https://www.sciencedaily.com/releases/2022/08/220831152754.htm)
69. [Change in mental health after smoking cessation: Systematic review and meta-analysis - the University of Bath's research portal](https://researchportal.bath.ac.uk/en/publications/change-in-mental-health-after-smoking-cessation-systematic-review/)
70. <https://www.apa.org/pubs/journals/releases/xhp274763.pdf>
71. [Task switching - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S1364661303000287)
72. [Multiple Team Membership: A Theoretical Model of its Effects on Productivity and Learning for Individuals, Teams, and Organizations](https://dspace.mit.edu/entities/publication/80089f93-4b5a-4ed4-90b3-00cae1efdc0c)
73. [Communications of the IIMA Communications of the IIMA Volume 15 Issue 1](https://scholarworks.lib.csusb.edu/cgi/viewcontent.cgi?article=1366&context=ciima)
74. [Annals of Computer Science and Information Systems, Volume 15](https://annals-csis.org/Volume_15/drp/53.html)
75. [pureadmin.qub.ac.uk](https://pureadmin.qub.ac.uk/ws/files/724967/Lean%20Software%20Management%20BBC%20Worldwide%20Case%20Study%20Feb%202011.pdf)
76. [A Proof for the Queuing Formula: L = λW](https://pubsonline.informs.org/doi/10.1287/opre.9.3.383)
77. [OR FORUM—Little's Law as Viewed on Its 50th Anniversary](https://pubsonline.informs.org/doi/10.1287/opre.1110.0940)
78. [Kingman, J. F. C. (1961) The single server queue in heavy traffic. Mathematical Proceedings of the Cambridge Philosophical Society, 57 (4). 902-904 doi:10.1017/s0305004100036094](https://www.mindat.org/reference.php?id=7917667)
