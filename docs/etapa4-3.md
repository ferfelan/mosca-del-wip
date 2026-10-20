# Etapa 4.3 — Cruce entre el juego y los estudios

> Hecha el 2026-10-20. Pedido textual de Felipe al final de
> `docs/etapa4-plan.md`. Investigación de Felipe y su asesor:
> `docs/investigacion-etapa4.md` (copia en `~/Desktop/Mosca del WIP/`).
> **No se cambió nada del juego ni se repitió ninguna simulación**: es una
> lectura cruzada. PDF corto: "2026-10-20 Etapa 4.3 Cruce con los estudios
> v1.pdf" (`DOC=etapa4-3`).

## Veredicto en una línea

**Nada obliga a cambiar una regla del juego ni a repetir una simulación.**
Lo que es matemática calza con la teoría; lo demás ya estaba rotulado como
supuesto y la 4.2 ya lo había puesto a prueba. Lo que hay que corregir son
**textos**: atribuciones demasiado fuertes en los informes v1 y en las notas
del proyecto, y el crédito de MaleCNS, que no es copia exacta.

Las tres etiquetas:
- **Calza**: un estudio o la matemática dicen lo mismo que el juego.
- **Supuesto nuestro**: el número lo pusimos nosotros. A veces lo inspira un
  estudio, pero ningún estudio lo mide. Se dice así.
- **Corregir (texto)**: el juego está bien, pero lo explicamos mal en algún
  lado.

## 1. Lo que es matemática o teoría

| Regla o resultado | Qué dice la investigación | Veredicto |
|---|---|---|
| El tiempo por tarea sube con el número de tareas (60 min con 2; 9 h con 9) | Ley de Little (1961; 2011): es un teorema para promedios en un sistema estable | **Calza**. Ojo: Little no dice cuánto tarda en notarse un cambio (eso es H3, resultado de la simulación). Nuestras "tareas de ayer" son justo lo que hace que el día sea estable y Little se cumpla (±2,5 %). |
| La eficiencia de flujo baja de 73 % a 8 % (4.1) | Definición de Kanban University y DORA | **Calza**, pero es casi aritmética (≈ tiempo trabajando ÷ número de tareas). Sirve para explicar, no es un hallazgo. Ya estaba dicho en la 4.1. |
| "Desde 3 tareas ya tiene con qué hacer todo el día" (4.1; 4.2: desde 1/2/3/3/4 con 0/10/20/30/40 % de bloqueos) | WIP crítico de Factory Physics (Hopp y Spearman): con menos trabajo abierto que ese, se queda sin qué hacer; con variabilidad hace falta un poco más | **Calza en la forma**. Factory Physics habla de líneas de producción; aplicarlo a una persona sola es una analogía nuestra. |
| Pasado el mejor límite, lo terminado **baja** (de 18,0 a 8,2: −55 %) | La teoría de colas sólo dice que **deja de subir**. En terreno, Aral y otros (2012) ven que pasado un punto óptimo bajan los proyectos terminados (reclutadores); Coviello y otros (2014/2015) ven que con más causas a la vez cada una tarda más (jueces) | **La dirección tiene respaldo de terreno; el tamaño es supuesto nuestro.** Sin costo de cambiar, la caída es 21 %; con la tabla completa de Weinberg, 79 % (4.2, ya verificado con los datos). |

## 2. Las reglas del juego

| Regla (en `src/brain.js`) | Qué dice la investigación | Veredicto |
|---|---|---|
| **Costo de cambiar de tarea**: rinde 100 · 85 · 78 · 72 · 67 · 62 · 58 · 55 · 52 · 50 % con 1 a 10 tareas | Weinberg (1992) es una regla práctica sin datos detrás. Rubinstein, Meyer y Evans (2001) midieron en laboratorio costos de décimas de segundo por cambio, que se suman | **Supuesto nuestro** (inspirado en una regla práctica). La 4.2 ya lo probó sin costo y con Weinberg completo. El informe completo v1 ya decía "regla práctica, nunca medida" ✓. |
| **Residuo**: cada tarea esperando resta 3 % | Leroy (2009) muestra que lo que queda a medias sigue ocupando la cabeza (DOI verificado ahora) | **Supuesto nuestro** el 3 %. La 4.2 lo probó con 0 % y 6 %: casi no mueve nada. |
| **Bloqueos**: 20 % de las tareas espera 30–60 min a otra persona | Ningún estudio da ese número. Bertolotti y otros (2015) miden personas que están en varios equipos a la vez, no bloqueos | **Supuesto nuestro** (lo pidió Felipe). La 4.2 lo varió de 0 a 40 % y de 15 a 120 min. **Corregir (texto)**: el informe completo v1 (pág. de reglas y anexo) y el comentario de `brain.js` lo presentan como "la U invertida de Bertolotti"; mejor: "la U invertida aparece en terreno (Aral en reclutadores; Bertolotti en equipos, por analogía); el 20 % y los 30–60 min son nuestros". |
| **Estrés con techo** según tareas abiertas (5 a 100 %) | No se encontró ningún estudio que mida que más tareas abiertas suban el estrés. Mark, Gudith y Klocke (2008) miden **interrupciones**: los interrumpidos trabajaron más rápido, pero con más estrés | **Supuesto nuestro** (ya está así en el norte). **Corregir (texto)**: `CLAUDE.md` y el comentario de `brain.js` dicen "(Mark et al.)" como si de ahí saliera el techo; decir "inspirado en". |
| **Sube en ~40 min y baja en ~55 min** | Dickerson y Kemeny (2004), 208 estudios de laboratorio: el cortisol llega a su punto más alto entre 21 y 40 min después de empezar; con evaluación social tarda más en volver | **Inspiración razonable**, pero son estresores breves de laboratorio, no carga de tareas. Las ~3 h para quedar Tranqui dependen de esto; lo firme es que lo empezado tarda más de 2 h en salir (4.2). Meijman y Mulder (1998) no está verificado: no va al informe para compartir. |
| **Fumar no calma en neto** (−5 por 5 min y +5 los 5 siguientes) | Parrott (1999): el "alivio" de fumar es sobre todo alivio de la abstinencia (DOI verificado ahora). Taylor y otros (2014): quienes dejan de fumar tienen menos ansiedad y estrés | **Calza la dirección**; los 5 puntos y 5 minutos son nuestros. |
| **Fumar más con más estrés**; colillas 1, 3, 6 … 15 con 4 a 10 tareas | — | **Supuesto del juego** (y parte del disfraz, ver sección 3). |
| **Café sólo con estrés bajo 55 %** | Lovallo y otros (2005, 2006): la cafeína sube el cortisol, y más junto con estrés mental | **Calza** (decisión de Felipe y su asesor). La investigación lo marcó como "mal uso" porque entendió que lo usamos para decir que el café calma; no es así: lo usamos para explicar por qué la mosca **no** toma café estresada. Decirlo claro en los informes. |
| **El café acelera la calma** (1,75 veces por 10 min) | Albulescu y otros (2022), 22 estudios: las pausas cortas suben la energía y bajan la fatiga, pero no mejoran claramente el rendimiento; tras tareas muy agotadoras, 10 min pueden no bastar | **Calza**: lo que ayuda es **la pausa**, no la cafeína. En el juego el café no hace rendir más (cuesta minutos) y sólo pasa con poco estrés. El 1,75 es nuestro. |
| **Lo empezado no desaparece** al bajar el límite | Little no habla de transiciones | **Resultado de la simulación** (H3, 4.2), no de un estudio. |

## 3. El cerebro y la mosca

| Tema | Qué dice la investigación | Veredicto |
|---|---|---|
| **Modelo de Shiu** (vaso con agujerito) | En FlyWire acertó 91 % de 164 predicciones probadas en moscas | **Calza**, con un cuidado: nosotros lo usamos en otro mapa (MaleCNS) y con otro peso (0,090 en vez de 0,275), sin validación propia. Es una adaptación exploratoria (ya dicho en la 3.2c). |
| **JO-F en el estímulo** | Shiu: el circuito de limpieza responde a JO-C/E "pero no a JO-F" (en el modelo). Hampel y otros (2020), resumen: "Although activation of each subpopulation elicits antennal grooming, distinct subpopulations also elicit the additional behaviors of wing flapping or backward locomotion." En el texto: JO-F provoca una limpieza más corta (termina antes que el estímulo) y además caminar hacia atrás; JO-C/E, limpieza y aleteo | **Calza**: en moscas reales **JO-F también provoca limpieza**, así que estimularla es fiel. En el modelo (Shiu y nuestra 3.2) **la señal del circuito viene sobre todo de JO-C y JO-E**: a la neurona de relevo (aBN1) le llegan 644 conexiones de JO-C/E y sólo 74 de JO-F. No hay que repetir nada. **Corregir (texto)**: el informe completo v1 dice "JO-C, JO-E y JO-F, cada una por separado"; en Hampel 2020 se probaron JO-C/E juntas y JO-F. |
| **166.700 vs 164.587 neuronas** | Berg y otros (2026): 166.700 neuronas en el sistema nervioso central del macho | **Calza.** En la tabla de MaleCNS hay exactamente 166.700 cuerpos con clase de neurona (lo que cuenta Berg); nosotros simulamos el archivo de conexiones "sólo trazadas": 164.403 de esas neuronas + 184 trozos trazados sin clase = 164.587. Quedan fuera 2.297, casi todas (1.989) sensores de la vista sin marca de trazado. |
| **aBN1 = SAD093** | La investigación dice "no verificada" | **Matiz**: la encontramos nosotros por sus conexiones en la 3.2 (se verificó en los datos), pero ningún estudio publicado la confirma. Decir "identificada por nosotros por sus conexiones". |
| **Seeds 2014: el orden de la limpieza** | Con polvo, la mosca se limpia primero los ojos y después las antenas | **Calza**: buscamos "antenas primero" en todo el proyecto y no aparece. Cuidarlo en la 4.4. |
| **La mosca no se estresa** | No se verificó que la limpieza sea una respuesta al estrés en moscas | **Calza**: siempre dijimos "disfraz". |
| **Crédito de MaleCNS** | Página oficial (male-cns.janelia.org, revisada hoy): "This project is a collaboration between FlyEM (HHMI Janelia), the University of Cambridge (Dept. of Zoology), the MRC Laboratory of Molecular Biology, and Google Research." y "The Male CNS dataset is licensed under CC-BY." (enlace a CC BY 4.0). No pide una cita formal; el artículo es Berg y otros (2026), Cell | **Corregir (texto)**. El juego dice "Male CNS v1.0 (FlyEM / HHMI Janelia, Univ. de Cambridge, MRC LMB y Google Research), licencia CC BY 4.0": dice lo mismo, pero abreviado y sin "(Dept. of Zoology)". Los informes v2 copian el texto oficial exacto. **El texto de la pantalla no lo toco**: Felipe decide si también se cambia (sería un cambio de pantalla). |

## 4. Textos de los informes v1 y de la pantalla

- **Mitos**: en los informes v1 no aparecen "40 % de productividad",
  "23 minutos", "15 % de eficiencia de flujo" ni "10 % del cerebro" ✓. El
  único "40 %" es el de la tabla de Weinberg con 3 proyectos, rotulado como
  regla práctica.
- **Para compartir v1, página "¿Esto es real?"**: "Hay estudios detrás de
  cada una" (de las tendencias) es demasiado fuerte: el estrés es supuesto nuestro. Se
  corrige en la v2.
- **Pantalla** ("¿Es real?"): "Los números de la oficina son ilustrativos;
  la tendencia tiene respaldo en estudios". Se sostiene en lo grueso (Little,
  Aral, Coviello, DORA), pero la parte del estrés es supuesto. No se toca
  (regla de la pantalla); queda anotado por si Felipe lo quiere más exacto.
- **Notas del proyecto** (`CLAUDE.md`): se corrigen las atribuciones de Mark
  (estrés) y Bertolotti (bloqueos) para que digan "inspirado en". Los
  comentarios de `src/brain.js` no se tocan en la Etapa 4 (regla: no tocar
  ese archivo).

## 5. Lo que la investigación dice y yo corregiría

La investigación es buena y útil. Estos puntos no los compraría tal cual:

1. **Lovallo "mal uso"**: no lo es (ver sección 2; ya resuelto con el asesor).
2. **"Hay que revisar JO-F"**: Hampel 2020 muestra que JO-F sí provoca
   limpieza en moscas reales. No hay que revisar: hay que explicarlo.
3. **Frase 8, "Reducir las esperas permite bajar el límite; subir el límite
   no reduce las esperas"**, citada como de DORA: es **nuestra**, inspirada
   en DORA. Lo que dice DORA (revisado hoy en dora.dev): "Don't relax your
   WIP limits when people are idle. Instead, those people should be helping
   in other parts of the value stream, addressing the problems that are
   leading to constraints elsewhere." Citar como "idea de DORA, en nuestras
   palabras".
4. **Pencavel**: las cifras 1,002 y 0,172 vienen de un resumen en un blog;
   no las encontré en el trabajo del autor. Sí verifiqué en su propio texto
   (versión IZA 2014): bajo 49 horas a la semana la producción sube parejo
   con las horas; desde 49 sube cada vez menos, tope cerca de 63 horas, y
   "Output at 70 hours differs little from output at 56 hours". Usar eso,
   no las elasticidades. Recordar: obreras de fábricas de municiones en la
   Primera Guerra Mundial, no trabajo de oficina.
5. **"Sin mejorar la calidad"** (jueces): el estudio dice que hacer
   malabares no la empeoró ("no adverse effect"). Decir "y la calidad no
   cambió".
6. **"Peor caso práctico" de Factory Physics**: es una fórmula para líneas
   de fábrica; para una persona sola es una analogía, no una predicción.
7. **DORA "solos no bastan"**: la frase exacta ("WIP limits on their own do
   not strongly predict delivery performance") es del libro *Accelerate* y
   sólo la vimos en notas de terceros. Para el informe para compartir uso
   la de dora.dev (verificada): "WIP limits help drive improvements in
   software delivery performance, particularly when they are combined with
   the use of visual displays and feedback loops from monitoring."

## 6. Fuentes verificadas hoy

Por DOI (Crossref) o en la página oficial:
- **Verificadas ahora** (antes "no verificado" o "de memoria"): Little
  1961 (Operations Research 9(3):383–387), Rubinstein, Meyer y Evans 2001
  (JEP:HPP 27(4):763–797), Leroy 2009 (OBHDP 109(2):168–181), Parrott 1999
  (American Psychologist 54(10):817–820), Aral y otros 2012 (ISR
  23(3-parte 2):849–867, DOI 10.1287/isre.1110.0408), Tastekin y otros 2026
  (Cell 189(18):5527–5551.e5, DOI 10.1016/j.cell.2026.08.016), Hampel y
  otros 2020 (resumen), Pencavel (texto del autor), DORA (página oficial),
  Principio 8 del Manifiesto […] (texto oficial en español: "Los procesos
  […] promueven el desarrollo sostenible. Los promotores, desarrolladores
  y usuarios debemos ser capaces de mantener un ritmo constante de forma
  indefinida."), crédito de MaleCNS (página oficial).
- **Confirmadas** (ya estaban verificadas): Coviello y otros 2014 (AER
  104(2):609–623) y 2015 (JEEA 13(5):906–947), Berg y otros 2026, Bertolotti
  y otros 2015, Mark y otros 2008, Albulescu y otros 2022, Sjøberg y otros
  2012.
- **Siguen sin verificar** (no van al informe para compartir): Meijman y
  Mulder 1998, Kingman, Reinertsen, DeMarco, CONWIP, Wouters, Sitzmann,
  Personal Kanban, SPACE/DevEx y los demás de la sección D3 de la
  investigación. Libros sin ISBN verificado (Modig y Åhlström; Hopp y
  Spearman; Weinberg; *Accelerate*): se citan por autor, título y año.

## 7. Lo que cambia en el mensaje (decisiones de Felipe)

Copia textual en `docs/etapa4-plan.md`; resumen también en `docs/NORTE.md`.
- "Desde 3 tareas ya tiene con qué hacer todo el día" se apoya en el WIP
  crítico de Factory Physics; pasado ese punto la teoría dice que lo
  terminado **deja de subir**; que en el juego **baje** viene de nuestros
  supuestos.
- "2 a 4" es resultado de la simulación, no un número científico. Sin
  esperas, el mejor límite es 1. (Detalle de la 4.2: si además cambiar de
  tarea no costara nada, daría casi lo mismo tener de 1 a 5.)
- Consejo para equipos: **"Reducir las esperas permite bajar el límite;
  subir el límite no reduce las esperas."** La mosca necesita un límite un
  poco más alto cuando espera mucho porque trabaja sola; un equipo puede
  ayudar a destrabar.
- "Un límite sostenible, no una cosa a la vez" se mantiene: vale cuando hay
  esperas que no se pueden evitar; mientras menos esperas, más cerca de una.
- Evidencia con personas: jueces, reclutadores, equipos de I+D y DORA, en
  una página "No es solo la mosca".
- Sostenible: Principio 8 y Pencavel, con sus límites; el juego mide un
  solo día.
- Eficiencia de flujo: para explicar, no como hallazgo. Mitos de la
  sección 5: nunca.
