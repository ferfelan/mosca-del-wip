# Etapa 3.2c · Verificaciones del cigarro real y propuesta para la 3.3

**Estado:** HECHA (2026-10-18). El juego no se tocó. El peso elegido
(0,090 mV) **no se cambia** por estos resultados: sólo se informan. La 3.3
no se construye hasta que Felipe elija la opción.

## Reglas fijadas ANTES de correr

Guardadas en git antes de correr (también arriba de todo en
`scripts/datos/verificar_etapa3c.py` y `scripts/opciones-3-3.mjs`).

### a) ¿Es casualidad? (la limpieza con conexiones barajadas)
- Peso 0,090. Antena izquierda completa (JO-C + JO-E + JO-F) a **WIP 10
  (220 Hz)** y a **WIP 6 (131,1 Hz)**, con la regla de siempre.
- 10 redes barajadas de cada forma (**destinos** y **pesos**, las mismas de
  la prueba 6), 30 repeticiones cada una.
- Se mide la limpieza (promedio de las 4 aDN: aDN1 y aDN2 de ambos lados) y
  también aDN1 y aDN2 por separado.
- Se compara con la red real con el mismo estímulo (de la 3.2b: 77,7 Hz con
  WIP 10 y 61,4 Hz con WIP 6).
- **Pasa ✅** si en al menos 9 de 10 redes de cada forma, con los dos
  estímulos, la limpieza queda **bajo el 10 %** de la red real. ⚠️ si eso
  pasa en al menos 7 de 10 en todos los casos, o en 9 de 10 sólo en algunos.
  ❌ si no.

### b) Sensibilidad (pesos 0,070 y 0,080)
- La misma tabla del WIP (20–220 Hz, 30 repeticiones) con 0,070 y con 0,080.
- **Inicio de la limpieza** = el primer WIP con limpieza **sobre 1 Hz** (con
  0,090 es WIP 4). También se informa el primero con 10 Hz o más (con 0,090
  es WIP 5).
- **Pasa ✅** si con los dos pesos el inicio queda en WIP 3, 4 o 5. ⚠️ si con
  alguno queda en WIP 2 o 6. ❌ si con alguno queda en WIP 1, en 7 o más, o
  si nunca empieza.

### c) Por qué el peso de Shiu da eco en MaleCNS (posible explicación)
- Sólo **cifras publicadas** de FlyWire (Dorkenwald y otros 2024, Nature:
  139.255 neuronas, 54,5 millones de sinapsis, 2.700.513 conexiones de 5 o
  más sinapsis), nunca sus datos. De MaleCNS, nuestros datos.
- Se informa como posible explicación, sin afirmarla.

### Propuesta para la 3.3 (simulada, sin construir)
- **Actividad real:** la limpieza de la tabla de la 3.2b (peso 0,090) para 1
  a 10 tareas abiertas, dividida por la de 10: 0 · 0 · 0,001 · 0,042 · 0,362
  · 0,790 · 0,861 · 0,909 · 0,956 · 1 (0 tareas → 0).
- **A) El cerebro muestra, el juego decide:** las reglas del juego no cambian.
  En la 3.3 las luces del panel saldrían de la actividad real.
- **B) El cerebro decide si dan ganas, el estrés decide cuántas:** ganas de
  fumar por minuto = la fórmula de hoy × la actividad real según las tareas
  abiertas. Lo demás igual (sigue sin fumar estando "Tranqui").
- **C) El cerebro decide todo:** ganas por minuto = 4,2 × la actividad real
  según las tareas abiertas, sin depender del estrés. (4,2 = las ganas
  máximas de la fórmula de hoy, con estrés 100 %, leídas del juego.)
- Cada una se simula con `simular-dias` (200 días por WIP, con su misma
  revisión de forma) sobre una **copia temporal** del cerebro del juego con
  sólo esa línea cambiada, y con el azar a semilla fija para comparar parejo.
- Se informa: terminadas, colillas, cafés y estrés por WIP; si dice "Forma:
  todo bien"; la frase honesta para la pantalla y mi recomendación. Aparte de
  la forma, no hay "pasa / no pasa".

---

## Resultados

Reglas guardadas en git antes de correr (commit `29bcc1f`). Cálculo: ~13 min
las verificaciones y 3 s las opciones.

### Verificaciones

| | Verificación | Resultado | Qué significa |
|---|---|---|---|
| a | ¿Es casualidad? | ✅ | En las 40 redes barajadas (2 formas × 10 redes × WIP 10 y WIP 6) la limpieza queda en **0 Hz**; en el mapa real da 77,7 Hz (WIP 10) y 61,4 Hz (WIP 6). Las redes barajadas tampoco se encienden (unas 300 neuronas: los sensores y pocas más). **La limpieza sale del mapa real, no por casualidad.** |
| b | Sensibilidad | ⚠️ | **El inicio se mueve con el peso:** WIP 4 con 0,090, WIP 5 con 0,080 y **WIP 6 con 0,070** (por eso ⚠️). La fuerza también baja mucho: con WIP 10, 78 → 39 → 14 Hz. Con pesos más bajos la curva sube más pareja (sin aplanarse), pero más débil. |
| c | Por qué el peso de Shiu da eco | posible explicación | MaleCNS registra unas **1,7 veces más sinapsis por neurona** en el cerebro que FlyWire (ver abajo). |

**b) La limpieza (Hz) con cada peso:**

| WIP | 0,070 | 0,080 | 0,090 (elegido) |
|----:|------:|------:|----------------:|
| 1 | 0 | 0 | 0 |
| 2 | 0 | 0 | 0 |
| 3 | 0 | 0 | 0,1 |
| 4 | 0 | 0,7 | **3,3** |
| 5 | 0,3 | **3,9** | 28,1 |
| 6 | **2,7** | 7,5 | 61,4 |
| 7 | 4,3 | 14,0 | 66,9 |
| 8 | 6,0 | 20,9 | 70,6 |
| 9 | 10,0 | 30,8 | 74,3 |
| 10 | 14,1 | 39,3 | 77,7 |
| Empieza (sobre 1 Hz) | WIP 6 | WIP 5 | WIP 4 |
| Llega a 10 Hz | WIP 9 | WIP 7 | WIP 5 |

Con los 3 pesos: sube en cada escalón, casi nada con WIP 1–3 y MN9 en 0.

**c) Sinapsis por neurona** (FlyWire: sólo cifras publicadas, Dorkenwald y
otros 2024; MaleCNS: nuestros datos):

| | Neuronas | Sinapsis | Sinapsis por neurona | Conexiones de 5+ sinapsis por neurona |
|---|---:|---:|---:|---:|
| FlyWire, cerebro (publicado) | 139.255 | 54,5 millones | 391 | 19,4 |
| MaleCNS, sólo cerebro (aproximado) | 142.239 | 97,0 millones | 682 | 35,3 |
| MaleCNS, cerebro + cordón | 164.587 | 124,0 millones | 754 | 37,9 |

**Posible explicación (sin afirmarla):** MaleCNS registra cerca de 1,7
veces más sinapsis por neurona y 1,8 veces más conexiones fuertes. Con el
mismo peso por sinapsis, cada neurona recibe más empuje. Sólo por esto, el
0,275 de Shiu equivaldría a unos **0,16** en MaleCNS: cerca de donde el
azúcar empieza a dar eco (entre 0,150 y 0,175), pero todavía sobre el límite
sin eco con la antena fuerte (0,090). La densidad explicaría una parte, no
todo. Otras causas posibles, sin probar: el cordón nervioso (más circuitos
que se realimentan), la forma distinta de detectar sinapsis en cada mapa y
la asignación de neurotransmisores. Ojo: comparar conteos entre mapas hechos
con métodos distintos es sólo aproximado.

### Propuesta para la 3.3: las 3 opciones (200 días por WIP)

| WIP | Terminadas A (hoy) | B | C | Colillas A (hoy) | B | C |
|----:|---:|---:|---:|---:|---:|---:|
| 1 | 15,9 | 15,9 | 15,9 | 0 | 0 | 0 |
| 2 | **17,9** | **17,9** | **17,9** | 0 | 0 | 0 |
| 3 | 16,7 | 16,7 | 16,7 | 0 | 0 | 0 |
| 4 | 15,4 | 15,7 | 15,7 | 1 | **0** | **0** |
| 5 | 13,9 | 14,4 | 13,0 | 3 | 1 | 7 |
| 6 | 12,4 | 12,9 | 10,6 | 6 | 4 | 14 |
| 7 | 10,9 | 11,3 | 9,9 | 8 | 7 | 15 |
| 8 | 9,8 | 10,0 | 9,2 | 11 | 10 | 16 |
| 9 | 9,1 | 9,1 | 8,5 | 13 | 13 | **16** |
| 10 | 8,5 | 8,5 | 7,9 | 15 | 15 | 17 |

- **Cafés** (iguales en las 3): 6 · 5 · 4 · 3 · 1 · 0 · 0 · 0 · 0 · 0.
- **Estrés promedio** (igual en las 3, porque fumar no cambia el estrés en
  neto): 5 · 10 · 17 · 30 · 41 · 54 · 64 · 79 · 86 · 93 %.
- A es el juego de hoy con el azar a semilla fija (por eso WIP 1 da 15,9 y
  no 15,5). Las colillas salen enteras porque cada día con el mismo WIP fuma
  lo mismo.
- Actividad real usada: 0 · 0 · 0,001 · 0,043 · 0,362 · 0,790 · 0,861 ·
  0,909 · 0,956 · 1 (en las reglas escribí 0,042 por redondeo; el script usa
  el valor exacto).

| | A · el cerebro muestra, el juego decide | B · el cerebro decide si, el estrés cuántas | C · el cerebro decide todo |
|---|---|---|---|
| `simular-dias` | ✅ Forma: todo bien | ❌ 1 problema: con WIP 4 ya no fuma (colillas 0, no suben desde WIP 3) | ❌ 2 problemas: con WIP 4 no fuma, y WIP 8 y 9 fuman igual (16) |
| Mejor WIP | 2 | 2 | 2 |
| Bajar 10 → 2: Tranqui | ~15:10 | ~15:05 | ~15:20 |
| Qué cambia | Nada en los números; el panel usaría la actividad real | Fuma menos con WIP 4–8 (el primer cigarro aparece con WIP 5) y termina un poco más | Desde WIP 6 fuma casi el máximo (14–17) y se aplana; termina menos con WIP 5–10; el estrés deja de importar para fumar |
| Frase honesta para la pantalla | "Las luces del cerebro vienen de un circuito real de la mosca (MaleCNS), simulado: limpiarse las antenas. El cigarro es un disfraz de esa limpieza. Las colillas y el estrés siguen reglas del juego basadas en estudios. El café es ilustrativo." | "Las ganas de 'fumar' las enciende un circuito real de la mosca (MaleCNS, simulado): limpiarse las antenas. Cuántas veces fuma lo decide el estrés del juego, basado en estudios. El café es ilustrativo." | "Las colillas siguen directo a un circuito real de la mosca (MaleCNS, simulado): limpiarse las antenas. El café es ilustrativo." |

### Mi recomendación: A

1. Es la única que mantiene "Forma: todo bien", incluido el mensaje
   aprobado: con WIP 3 está el límite sano y desde WIP 4 ya fuma.
2. La verificación b) muestra que el inicio del circuito depende del peso
   (de WIP 4 a 6 con cambios de 10 a 20 % del peso). Con B o C, el WIP en que
   la mosca empieza a fumar dependería de un número que elegimos por una
   razón técnica (el más alto sin eco), no de la biología.
3. Queda claro qué viene de dónde: los números del juego, de los estudios de
   estrés; las luces del panel, del mapa real (y la verificación a) respalda
   decir que esa actividad "viene del mapa real").

Lo que se pierde con A: el panel y las colillas no siempre coinciden. Con
WIP 4 fuma 1 vez y el circuito apenas parte; desde WIP 6 el circuito casi se
aplana y las colillas siguen subiendo. La frase de A lo dice.

Si prefieres que el circuito sí decida algo, **B** es la segunda mejor:
cambia poco y respeta el resto de la forma. Pero implica aceptar que con
WIP 4 no fume, y cambiar esa regla de `simular-dias`. Esa sería una decisión
tuya, no un ajuste para que calce. No encontré una opción mejor que estas.

### Cómo repetirlo

    .venv-datos/bin/python scripts/datos/verificar_etapa3c.py barajadas      # ~9 min
    .venv-datos/bin/python scripts/datos/verificar_etapa3c.py sensibilidad   # ~3 min
    .venv-datos/bin/python scripts/datos/verificar_etapa3c.py densidad       # segundos
    node scripts/opciones-3-3.mjs                                            # 3 s

Resultados en `scripts/datos/resultados_etapa3_2c.json` y
`docs/etapa3-3-opciones.json`.
