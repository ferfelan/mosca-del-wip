# Etapa 3.2c · Verificaciones del cigarro real y propuesta para la 3.3

**Estado:** en curso (2026-10-18). El juego no se toca. El peso elegido
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
