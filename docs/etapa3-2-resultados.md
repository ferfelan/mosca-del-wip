# Etapa 3.2 · Bajar el mapa de conexiones y probar el cerebro

**Estado:** HECHA (2026-10-18). **El juego no se tocó.** La 3.3 parte sólo
con el OK de Felipe.

## En pocas líneas

- **Descarga:** los 2 archivos llegaron completos (tamaño y huella iguales
  al servidor). Todas las neuronas clave tienen sus conexiones, así que no
  hizo falta bajar la versión completa (1,05 GB). MaleCNS v1.0 (8 de junio de
  2026) es la versión más nueva.
- **Por conexiones:** aBN1 = **SAD093** (calza en todo, menos en estar entre
  las 5 que más reciben de la antena). aBN2 **no es GNG380**; es un **trío
  sin nombre de LB23**. **aDN2 le habla directo a aDN1** (183 sinapsis por
  lado). El azúcar llega a MN9 por un **camino indirecto** de 3 pasos;
  Dandelion recibe mucho azúcar pero frena y no llega a MN9.
- **El modelo**, calibrado como pidió Felipe, queda con un peso de **0,692
  mV por sinapsis** (2,5 veces el de Shiu). Con ese peso el cerebro entra en
  **"eco"**: con sólo 6 sensores de azúcar se encienden unas 28.000 neuronas
  (17 % del cerebro), y la actividad sigue sola aunque se apague el estímulo.
- **Pruebas:** 2 ✅, 2 ⚠️, 2 ❌. Casi todo lo que falla se explica por el eco.
- **Tabla del WIP:** la entrada del circuito de limpieza (aBN1, aBN2) sube
  clarito con el WIP, pero las neuronas que mandan a limpiarse (aDN1, aDN2)
  casi no responden (2 a 17 Hz) y MN9 está encendida sin azúcar. **No calza
  con el juego.** No se maquilló.
- **Exploración aparte (no cambia nada):** con un peso bajo (0,15 mV) el
  circuito de limpieza funciona limpio y se parece al juego, pero el azúcar
  no alcanza a encender MN9. Hay que decidir cómo seguir: opciones al final.

## Reglas fijadas ANTES de ver los resultados

Escritas y guardadas en git antes de correr la calibración y las pruebas
(también están arriba de todo en `scripts/datos/pruebas_etapa3.py`). No se
cambian para que algo calce.

**El modelo (igual que Shiu y otros, 2024).** Neuronas simples que "integran
y disparan": en reposo nada se enciende (actividad base 0); cada disparo suma
o resta según el neurotransmisor de la neurona que habla, y el peso de cada
conexión es su número de sinapsis. Mismos números que el código de Shiu:
reposo −52 mV, umbral −45 mV, 20 ms y 5 ms de constantes, 2,2 ms de descanso
tras disparar, 1,8 ms de retraso, estímulo de Poisson, paso de 0,1 ms. Toda
la red trazada de MaleCNS v1.0 (164.587 neuronas, 25,6 millones de
conexiones).
- Frenan: GABA y glutamato (como Shiu) e histamina (en la mosca frena; Shiu
  no tenía histamina en sus datos). Activan: acetilcolina, dopamina,
  serotonina y octopamina (como Shiu). Si el neurotransmisor no está claro:
  la predicción de la propia neurona; si tampoco, activa (2.012 neuronas).

**Calibración.** El único número libre es el peso por sinapsis (w_syn).
Azúcar del lado derecho (LB3b, 6 sensores) a 100 Hz → MN9 izquierda cerca del
80 % de su máximo. Shiu no dice qué es "máximo"; aquí es **el techo que
alcanza la MN9 izquierda al subir el peso** (rejilla de 0,10 a 2,00 mV). Se
toma el peso donde la curva cruza el 80 % de ese techo y no se vuelve a tocar.

**Cada prueba:** 30 repeticiones de 1 segundo, semilla fija (2024 + n.º de
repetición, la misma en todas las pruebas).

**Lados:** azúcar del lado derecho, se mide sobre todo la MN9 izquierda;
antena del lado izquierdo. Siempre se miden e informan los dos lados.

**Qué cuenta como encendida o apagada:** encendida = promedio de 10 Hz o más;
apagada = menos de 2 Hz; "casi apagada" = menos del 10 % del caso de
referencia; entre 10 % y 33 % = dudoso ⚠️.

| # | Prueba | Estímulo | Pasa ✅ si… |
|---|--------|----------|-------------|
| 1 | Azúcar → MN9 se enciende | LB3b der. a 100 Hz (y curva 10–200 Hz) | MN9 izq ≥ 10 Hz y sube con la frecuencia (⚠️ si se enciende pero no sube) |
| 2 | Antena → aBN1, aDN1, aDN2 | JO-C + JO-E izq. a 140 Hz (también 220) | aBN1 izq, aDN1 y aDN2 (en algún lado) ≥ 10 Hz (⚠️ si sólo aBN1) |
| 3 | JO-F sola → aBN1 casi apagada | JO-F izq. a 140 Hz (también 220) | aBN1 izq < 10 % de la prueba 2 o < 2 Hz (⚠️ 10–33 %) |
| 4 | Cada circuito hace lo suyo | los de las pruebas 1 y 2 | con azúcar, aBN1/aBN2/aDN1/aDN2 < 2 Hz; con antena, MN9 < 2 Hz (⚠️ entre 2 y 10) |
| 5 | Sin estímulo → todo apagado | nada | 0 disparos en todo el cerebro |
| 6 | Conexiones barajadas → MN9 casi apagada | azúcar der. a 100 Hz, 10 redes barajadas de 2 formas | en 9 de 10 redes de cada forma, MN9 izq < 10 % de la red real |

Formas de barajar (prueba 6): **destinos** (cada conexión conserva quién
habla y su peso, pero quién escucha se elige al azar: cada neurona sigue
dando y recibiendo lo mismo, con otras parejas) y **pesos** (mismas parejas,
pesos barajados entre todas las conexiones, como describe Shiu).

**Tabla para el juego.** WIP 1 → 10 = antena izquierda completa (JO-C + JO-E
+ JO-F) a 20 + (WIP − 1) × 200/9 Hz: 20, 42, 64, 87, 109, 131, 153, 176, 198
y 220 Hz (el rango que usó Shiu para la antena), en línea recta. Se guardan
aDN1, aDN2 y MN9 de ambos lados. "Limpieza" = promedio de las 4 aDN. Se
compara con el juego: ¿sube con el WIP? ¿casi nada con WIP 1–3, como las
colillas del juego (0, 0, 0, 1, 3, 6, 8, 11, 13, 15)?

**Neuronas que se miden** (de `scripts/datos/conexiones_etapa3.py`): MN9;
aDN1 = DNg62; aDN2 = DNge078; aBN1 = SAD093 (hallada por conexiones); aBN2 =
trío sin nombre de LB23 (hallado por conexiones); GNG380 (la candidata de la
3.1); el plan B (las 5 que más reciben de la antena); y las del camino del
azúcar.

Transparencia: antes de fijar estas reglas corrí 3 simulaciones sueltas de
azúcar (pesos 0,275, 0,6 y 1,0) sólo para revisar que el simulador
funcionara, y una red de juguete de 2 neuronas para comprobar que calcula
bien.

---

## 1. Descarga

| Archivo | Tamaño | Huella (md5) |
|---------|--------|--------------|
| Conexiones traced-only | 508,0 MB, 25,6 millones de conexiones | `6601d4ad0afa99fd03eb087965ef2423` ✅ igual al servidor |
| Neurotransmisores | 43,3 MB | `3d842b12fe5c49eefade528d7dd24a1f` ✅ igual al servidor |

- Las 164.587 neuronas del archivo están "trazadas" y entre ellas están
  **todas** las neuronas clave, con miles de conexiones cada una. Por eso no
  se bajó la versión completa (1,05 GB).
- Los archivos están en `datos-crudos/`, fuera de git (`.gitignore` ya tenía
  la carpeta; se agregó también `*.feather`).
- Se instaló **numba** (acelera Python, se usó para simular) y **scipy**
  (cálculo científico; quedó instalado, pero al final no se necesitó).

## 2. Qué tan completas están las neuronas clave y si hay versión nueva

| Neurona | Estado en la tabla | Sinapsis que recibe | Comentario |
|---------|--------------------|---------------------|------------|
| MN9 izquierda | Roughly traced | 6.012 | bien reconstruida |
| MN9 derecha | **RT Hard to trace** | **556** | 11 veces menos que la izquierda: bien elegido medir la izquierda |
| aDN1 (DNg62) izq / der | Prelim Roughly traced | 3.841 / 3.523 | reconstrucción preliminar, pero pareja |
| aDN2 (DNge078) izq / der | Prelim Roughly traced | 2.600 / 2.307 | ídem |
| aBN1 (SAD093) izq / der | Roughly traced | 3.710 / 3.158 | — |
| Sensores de la antena (JO) | RT Hard to trace (todos) | — | normal en sensores. El lado derecho tiene muchas menos sinapsis (JO-C: 3.857 contra 21.698) |
| Azúcar (LB3b, 11) | Prelim Roughly traced (2 "Reviewed") | — | una de la izquierda tiene sólo 42 sinapsis de salida |

**Versión:** la v1.0 (8 de junio de 2026) es la más nueva (notas de versión
de male-cns.janelia.org; en el servidor sólo hay v0.9, v0.11, v0.13 y v1.0).
Hay "versiones especiales" para quienes desarrollan herramientas; no sirven
para esto.

## 3. Verificación por conexiones (termina la 3.1)

| Qué | Resultado | Qué encontramos |
|-----|-----------|-----------------|
| aBN1 | ⚠️ candidata fuerte: **SAD093** | Única neurona del cerebro con 1 por lado que recibe de JO-C/E (644 sinapsis la izquierda), también directo de JO-F (74, como dice Shiu), es activadora (acetilcolina, 95 %) y le habla a aDN1 y aDN2 (332–380 sinapsis). Recibe de la antena de su lado y le habla a las aDN del otro lado. **No** está entre las 5 que más reciben de la antena: queda alrededor del puesto 40. La tabla no la llama "aBN1". |
| Plan B (las 5 que más reciben) | listo, por si acaso | Izq: AMMC012, DNg29, DNp73, AMMC013, WED203. Der: AMMC012, AMMC013, DNg29, DNg15, DNp18. **Casi no** le hablan a aDN1 ni a aDN2 (0 a 1 sinapsis). |
| aBN2 = GNG380 | ❌ no calza | GNG380 no recibe nada de la antena (0–5 sinapsis) ni de SAD093 (0), ni le habla a las aDN (0–3). Recibe de la trompita (pelitos y sabor). |
| aBN2, otra candidata | ⚠️ **trío sin nombre de LB23** | 3 por lado en LB23 (2 del tipo de FlyWire CB1740/CB1779 y 1 del CB2014/CB2039): reciben de SAD093 (22–65 sinapsis), casi todas de JO-F y de los pelitos de la cabeza, y le hablan a aDN1 (54–73) o a aDN2 (49–56). Izq: 15993, 24532, 29161 · der: 26873, 29485, 558912. GNG611 calza sólo a la derecha. |
| aDN2 → aDN1 directo | ✅ | DNge078 → DNg62: **183 sinapsis** en cada lado (y 14–22 al lado contrario). Calza con Braun 2024. |
| LB3b → MN9 | ⚠️ existe, indirecto | Sin conexión directa. Los caminos más fuertes (de 3 pasos): LB3b der → **ANXXX462b** / **Clavicle** / **FMIn** → **DNge062** / **Roundup** / **Roundtree** → MN9 izq. La MN9 izquierda recibe sobre todo del lado derecho, calza con "el azúcar enciende más la del lado contrario". No se buscó el plan B (pata) porque el camino sí apareció. |
| Dandelion (AN13B002) | dato nuevo | Recibe mucho del azúcar (251 sinapsis desde LB3b der), pero **frena** (GABA) y no le habla a MN9. |

**Conclusión de la verificación:**
- **SAD093 = aBN1** (encontrada por sus conexiones).
- **GNG380 no era aBN2.** aBN2 es el trío sin nombre de LB23.
- **El azúcar de la trompita no es sólo LB3b: también LB3c** (Tastekin y
  otros). En la 3.2 faltó LB3c; se suma en la 3.2b (ver al final).

## 4. Calibración

Azúcar derecha (6 LB3b) a 100 Hz, MN9 izquierda, 30 repeticiones por peso:

| Peso (mV por sinapsis) | MN9 izq | Neuronas encendidas (>10 Hz) |
|------------------------|---------|------------------------------|
| 0,10 | 0 Hz | 8 |
| 0,15 | 0,3 Hz | 22 |
| 0,20 | 11,7 Hz | 78 |
| **0,25** | 9,8 Hz | **14.204** ← aquí parte el eco |
| 0,275 (el de Shiu) | 5,5 Hz | 15.473 |
| 0,40 | 6,6 Hz | 19.924 |
| 0,50 | 69,4 Hz | 23.009 |
| 0,60 | 110,0 Hz | 25.811 |
| 0,70 | 130,9 Hz | 28.083 |
| 1,00 | 107,7 Hz | 32.617 |
| 2,00 | 161,5 Hz (techo) | 40.343 |

Techo 161,5 Hz → 80 % = 129,2 Hz → **w_syn = 0,692 mV** (con 30 repeticiones
nuevas: MN9 izq = 122,9 Hz, 76 % del techo). Quedó fijo y no se volvió a
tocar. Ojo: la curva sube, baja y vuelve a subir, y a 2,00 todavía no se
aplana del todo.

## 5. Las pruebas (con w_syn = 0,692 mV)

| # | Prueba | Resultado | Qué significa |
|---|--------|-----------|---------------|
| 1 | Azúcar → MN9 | ⚠️ dudoso | MN9 se enciende fuerte (122,9 Hz izq, 57,7 der), pero **casi igual con 10 que con 200 Hz de azúcar** (119,5 → 117,9 → 122,9 → 142,2 → 145,5 Hz): no sigue al estímulo, la mueve el eco. |
| 2 | Antena JO-C+E → aBN1, aDN1, aDN2 | ⚠️ dudoso | aBN1 izq 307 Hz y el trío aBN2 izq 113 Hz ✅, pero aDN1 (máx. 5,2 Hz) y aDN2 (máx. 6,6 Hz) no llegan a 10. A 220 Hz, igual (7,7 y 9,1). La entrada del circuito funciona; la salida queda ahogada. |
| 3 | JO-F sola → aBN1 casi apagada | ✅ pasó | aBN1 izq 0,4 Hz contra 307 Hz con JO-C+E (0,1 %). A 220 Hz, 0,07 Hz. **Igual que Shiu**, aunque JO-F le da 74 sinapsis directas. |
| 4 | Cada circuito hace lo suyo | ❌ no pasó | Con azúcar, las de limpieza quedan casi apagadas (aBN1 der 4,8 Hz; aDN 0). Pero **la antena enciende MN9 a 85 Hz** (izq) y 48 (der). |
| 5 | Sin estímulo → todo apagado | ✅ pasó | 0 disparos en todo el cerebro. |
| 6 | Conexiones barajadas → MN9 casi apagada | ❌ no pasó | Las redes barajadas se encienden más todavía (66 % a 78 % del cerebro). MN9 quedó casi apagada sólo en 4 de 10 (barajando destinos) y en 1 de 10 (barajando pesos). Shiu: sólo 1 de 100 se encendía. |

**Camino del azúcar en la simulación (prueba 1, 100 Hz):** las neuronas del
camino disparan poco (ANXXX462b der 2,6 Hz, DNge062 der 10,8, Roundup ~6,
Fdg ≤ 2). Lo que más empuja a la MN9 izquierda es GNG002 izq (271 Hz), que
es parte del eco. Dandelion dispara a 127 Hz en ambos lados.

**Robustez (el peso ±30 %, como hizo Shiu):** con 0,484 y 0,900 mV la foto es
la misma: aBN1 fuerte (277–328 Hz), JO-F no la enciende (0,1–1,3 Hz), aDN
bajo 10 Hz y la antena enciende MN9 (65–98 Hz). No depende del número exacto.

## 6. Tabla para el juego (WIP 1–10)

Antena izquierda completa (JO-C+E+F, 245 sensores), regla fijada antes,
w_syn = 0,692. Hz promedio de 30 repeticiones (izq/der). También en
`docs/etapa3-2-tabla-wip.json`.

| WIP | Antena | aDN1 | aDN2 | MN9 | Limpieza | aBN1 izq | aBN2 izq | Colillas del juego |
|----:|-------:|-----:|-----:|----:|---------:|---------:|---------:|-------------------:|
| 1 | 20 Hz | 1,8 / 3,7 | 1,8 / 2,7 | 114,6 / 53,9 | 2,5 | 43 | 6 | 0 |
| 2 | 42 Hz | 2,3 / 4,2 | 1,7 / 3,4 | 114,4 / 54,6 | 2,9 | 149 | 44 | 0 |
| 3 | 64 Hz | 2,7 / 4,2 | 1,7 / 4,3 | 121,1 / 59,5 | 3,2 | 226 | 92 | 0 |
| 4 | 87 Hz | 2,8 / 4,7 | 1,9 / 5,5 | 103,2 / 52,3 | 3,7 | 267 | 111 | 1 |
| 5 | 109 Hz | 2,8 / 5,3 | 2,2 / 7,1 | 96,8 / 49,4 | 4,3 | 290 | 122 | 3 |
| 6 | 131 Hz | 2,7 / 7,6 | 2,7 / 10,0 | 65,0 / 38,4 | 5,7 | 304 | 126 | 6 |
| 7 | 153 Hz | 2,4 / 6,4 | 1,6 / 8,2 | 61,3 / 37,9 | 4,7 | 313 | 127 | 8 |
| 8 | 176 Hz | 2,3 / 7,8 | 1,7 / 10,9 | 53,2 / 34,9 | 5,7 | 323 | 130 | 11 |
| 9 | 198 Hz | 2,2 / 13,5 | 4,3 / 17,5 | 39,7 / 29,8 | 9,4 | 335 | 135 | 13 |
| 10 | 220 Hz | 2,1 / 12,4 | 2,4 / 16,8 | 25,6 / 25,2 | 8,4 | 345 | 134 | 15 |

**¿Calza con el juego?**
- ¿La limpieza sube con el WIP? ❌ En general sí (se parece a las colillas:
  correlación 0,93), pero con altibajos: de WIP 6 a 7 baja 1,06 Hz (la
  tolerancia era 1) y de 9 a 10 baja 0,94.
- ¿Casi nada con WIP 1–3, como el juego? ❌ Con WIP 1–3 ya tiene un tercio
  de lo de WIP 10.
- Además, la limpieza es muy débil (2 a 17 Hz) y **MN9 está encendida sin
  nada de azúcar** (115 Hz con WIP 1) y baja a medida que sube el WIP.
- Lo que sí sigue al WIP de forma clara y pareja es la **entrada** del
  circuito: aBN1 (43 → 345 Hz) y aBN2 (6 → 134 Hz).

## 7. El "eco" (lo que no calza, tal cual)

- **Dónde parte:** entre 0,20 y 0,25 mV la red pasa de tener 78 neuronas
  encendidas a 14.204. El peso de Shiu (0,275) ya queda del lado del eco en
  este mapa, y el calibrado (0,692) bien adentro.
- **Sigue solo:** con el azúcar prendido sólo los primeros 300 ms, el
  cerebro sigue encendido igual hasta el final del segundo (unas 27.800
  neuronas, MN9 izq entre 81 y 152 Hz). Es como una convulsión. En una
  mosca real eso no pasa.
- **No nace en una zona puntual:** las 4.064 neuronas Kenyon (memoria) se
  encienden todas, pero si se apagan sus conexiones el eco sigue igual
  (27.200–28.600 neuronas). Es el cerebro entero, que con un peso tan alto
  pasa su punto de equilibrio. Por eso las redes barajadas explotan más.
- **Por qué pasa (lo más probable):** el azúcar entra por sólo 6 sensores
  con unas 2.200 sinapsis de salida, contra 245 sensores de la antena con
  unas 145.000. Para que una entrada tan débil lleve a MN9 al 80 %, el peso
  tiene que ser alto, y con ese peso el resto del cerebro se enciende.

## 8. Exploración con pesos bajo el eco (NO cambia los resultados)

Sólo para tener datos al elegir opciones (`scripts/datos/explorar_eco_etapa3.py
pesos`). Hz izq/der.

| Peso | Estímulo | aBN1 | aDN1 | aDN2 | MN9 | Encendidas |
|------|----------|------|------|------|-----|------------|
| 0,15 | azúcar der 100 Hz | 0 / 0 | 0 / 0 | 0 / 0 | **0,3** / 0 | 22 |
| 0,15 | JO-C+E izq 140 Hz | 181 / 39 | **141 / 163** | **95 / 117** | 1,1 / 0 | 2.952 |
| 0,15 | JO-F izq 140 Hz | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 145 |
| 0,15 | antena izq 20 Hz (WIP 1) | 23 / 0 | **0 / 0** | **0 / 0** | 0 / 0 | 316 |
| 0,15 | antena izq 120 Hz | 164 / 28 | 142 / 164 | 100 / 120 | 0 / 0 | 2.351 |
| 0,15 | antena izq 220 Hz (WIP 10) | 219 / 2 | 46 / 140 | 34 / 96 | 0,3 / 0 | 10.647 (el eco asoma) |
| 0,20 | azúcar der 100 Hz | 0 / 0 | 0 / 0 | 0 / 0 | 11,7 / 0 | 78 |
| 0,20 | JO-C+E izq 140 Hz | 206 / 27 | 64 / 105 | 44 / 71 | 0,1 / 0 | 13.402 (eco) |
| 0,20 | antena izq 20 Hz (WIP 1) | 75 / 50 | 129 / 123 | 99 / 95 | 0 / 0 | 3.610 |

Con **0,15** el circuito de limpieza hace lo que dicen los estudios: la
antena enciende aBN1 y las aDN, JO-F sola no, MN9 queda apagada, y con poca
señal (WIP 1) las aDN quedan en 0, igual que el juego. Pero con ese peso **el
azúcar no enciende MN9**. Con 0,20 el azúcar ya enciende MN9 un poco, pero
la antena dispara el eco.

## 9. Opciones para decidir (planes B y C)

Nada de esto está hecho. La traducción al juego se decide en la 3.3.

1. **Recalibrar evitando el eco (la que recomiendo).** Una regla nueva,
   fijada antes de correr: "el peso más alto con el que el cerebro se apaga
   solo al quitar el estímulo y la antena a 220 Hz no lo enciende entero".
   Luego repetir las 6 pruebas y la tabla del WIP. Por la exploración, el
   circuito de limpieza saldría limpio y parecido al juego, y el café
   quedaría ilustrativo (el azúcar no alcanza). Es apartarse de la
   calibración de Shiu, que en este mapa no funciona por la razón de la
   sección 7. Unos 45 minutos de cálculo.
2. **Plan B: más azúcar.** Sumar los LB3b de ambos lados y los sensores de
   la pata (LgLG3) al estímulo de azúcar y volver a calibrar con el 80 %.
   Podría hacer que el café funcione con un peso menor, pero el eco podría
   seguir. Además, que LgLG3 sea de azúcar no está comprobado.
3. **Plan C: el mapa sin simulación.** Usar las conexiones reales (quién le
   habla a quién y con cuántas sinapsis) para encender el panel, y que la
   intensidad la ponga el juego. Simple y honesto ("conexiones reales,
   actividad ilustrativa"), pero ya no es un circuito real reaccionando.

No recomiendo seguir con 0,692 tal cual: el cerebro se enciende entero,
MN9 dispara sin azúcar y no se podría decir que el circuito real decide.

## 10. Para corregir en el PDF (en la 3.3, una sola vez al final)

- Para la antena, Shiu usó **20–220 Hz**; los **10–200 Hz** eran para el
  azúcar.
- Página 20 ("Qué hay que verificar"): poner esta tabla (SAD093, trío LB23,
  GNG380 descartada, aDN2 → aDN1, camino del azúcar, Dandelion frena).
- Agregar el hallazgo del eco y la decisión que se tome.

## 11. Cómo repetirlo

Desde la carpeta del proyecto (los 3 archivos en `datos-crudos/`):

    .venv-datos/bin/python scripts/datos/conexiones_etapa3.py          # verificación por conexiones (~10 s)
    .venv-datos/bin/python scripts/datos/pruebas_etapa3.py calibrar    # ~5 min
    .venv-datos/bin/python scripts/datos/pruebas_etapa3.py pruebas     # ~20 min
    .venv-datos/bin/python scripts/datos/pruebas_etapa3.py wip         # ~3 min
    .venv-datos/bin/python scripts/datos/pruebas_etapa3.py extra       # ~2 min
    .venv-datos/bin/python scripts/datos/explorar_eco_etapa3.py persiste|pesos|kenyon

Resultados completos en `scripts/datos/resultados_etapa3_2.json` y
`scripts/datos/exploracion_eco_etapa3_2.json`. El modelo está en
`scripts/datos/modelo_etapa3.py`: mismas ecuaciones y números que el
`model.py` de Shiu (Brian2), escrito en Python + numba. Se comprobó con una
red de juguete de 2 neuronas: dispara justo sobre el umbral teórico, su techo
es 454 Hz (teoría 454,5) y frenar deja todo en 0. Con la misma semilla da
exactamente lo mismo.

---

# Etapa 3.2b · Más azúcar, prueba del eco y escalera para elegir el peso

**Estado:** en curso (2026-10-18). El juego no se tocó.

## Por qué (la causa probable que encontró Felipe)

- En el código de Shiu (`example.ipynb`) se estimulan **21 sensores de
  azúcar del hemisferio derecho** con el modelo de siempre (0,275 mV).
  Comprobado: la lista `neu_sugar` tiene 21 y el texto dice "in the right
  hemisphere". (Detalle: el artículo dice que estimularon el hemisferio
  izquierdo; para nosotros no cambia nada.)
- En la 3.2 usamos sólo 6 (LB3b). Con tan poca entrada, la calibración subió
  el peso 2,5 veces y el cerebro entró en eco.
- Según Tastekin y otros (bioRxiv 2025.08.25.671814), el azúcar de la
  trompita también es **LB3c**: "Both LB3b and LB3c projection patterns
  matched the Gr64f-GAL4 positive neurons" (Gr64f = receptor de dulce).
  Comprobado en el texto. Ojo: lo deducen por la forma de los axones, no lo
  midieron directamente.

## LB3c en la tabla

LB3c sí está: **23 sensores** (12 izq / 11 der), todos trazados,
activadores (acetilcolina) y del tipo "labellar bristle gustatory".

| Azúcar del lado derecho | Sensores | Sinapsis de salida |
|-------------------------|---------:|-------------------:|
| LB3b | 6 | ~2.200 |
| LB3c | 11 | ~6.000 |
| **Total 3.2b** | **17** | **~8.300** (3,7 veces lo de la 3.2) |
| Shiu (FlyWire) | 21 | — |

## Reglas de la 3.2b fijadas ANTES de ver los resultados

Escritas y guardadas en git antes de correr (también arriba de todo en
`scripts/datos/pruebas_etapa3b.py`). Lo que no se nombra aquí queda igual que
en la 3.2 (modelo, 30 repeticiones, semilla, criterios de las pruebas 1–6,
lados).

**Azúcar:** LB3b + LB3c del lado derecho (17 sensores) en las pruebas 1, 4
y 6 y en la calibración.

**Dos pesos:** (a) el de Shiu, **0,275 mV**, sin ajustar nada; (b) el
**calibrado** como Shiu: azúcar a 100 Hz → MN9 izquierda ≈ 80 % de su techo
(misma regla de la 3.2; la rejilla ahora parte en 0,05).

**Prueba 7 · eco.** Cada repetición dura 1 s: estímulo encendido de 0 a
500 ms y apagado de 500 a 1.000 ms. Actividad = disparos por segundo de todo
el cerebro, sin contar las neuronas estimuladas.
- **Sin eco** = en las 30 repeticiones, desde 100 ms después de apagar
  (600–1.000 ms), la actividad queda en **1 % o menos** de la que había en
  los últimos 100 ms con estímulo (400–500 ms).
- Se prueba con los 3 estímulos más fuertes que usaría el juego: azúcar der.
  a 100 Hz, azúcar der. a 200 Hz (el tope de Shiu) y la antena izq. completa a
  220 Hz (WIP 10). **Un peso tiene eco si lo tiene con cualquiera de los 3.**
  La prueba 7 pasa ✅ sólo si no hay eco en ninguno.

**Escalera para elegir el peso:**
1. Si el calibrado (b) no tiene eco → se usa (b).
2. Si (b) tiene eco y el de Shiu (a) no → se usa (a).
3. Si los dos tienen eco → **el peso más alto SIN eco** según la prueba 7,
   nunca "el que más se parezca al juego". Se revisa de 0,025 en 0,025
   (0,275, 0,250 … 0,025) de arriba hacia abajo hasta el primero sin eco, y
   se afina de 0,005 en 0,005 entre ese y el siguiente (de arriba hacia
   abajo). Queda el más alto sin eco, y con él se corren las pruebas 1–6.

**Qué usa el juego con el peso que quede** (en cualquiera de los 3 pasos;
así leí tu escalera):
- El cigarro usa el circuito real si la prueba 2 (limpieza) pasa ✅.
- El café usa el circuito real sólo si la prueba 1 (azúcar → MN9) pasa ✅.
  Si no, queda ilustrativo y se dice en pantalla.
- Si la prueba 2 no pasa (⚠️ o ❌) → **opción 3** (el mapa sin simulación).
- "Pasar" es ✅; ⚠️ no cuenta como pasar.

**Tabla del WIP:** con el peso elegido, misma regla de la 3.2 (antena izq.
JO-C + JO-E + JO-F, 20 → 220 Hz en línea recta), sin cambiarla. Si la
escalera termina en la opción 3, la tabla igual se calcula, sólo como
información. Queda en `docs/etapa3-2b-tabla-wip.json`.
