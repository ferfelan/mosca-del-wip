# Etapa 3.2 · Bajar el mapa de conexiones y probar el cerebro

**Estado:** en curso (2026-10-18). El juego no se tocó.

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
