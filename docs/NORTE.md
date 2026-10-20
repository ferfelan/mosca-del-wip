# Norte del proyecto

> Lo fijó Felipe el 2026-10-20, al empezar la Etapa 4. Toda sesión lo lee
> antes de trabajar (el resumen está al inicio de `CLAUDE.md`). Si algo del
> proyecto choca con este norte, se le avisa a Felipe; el norte no se cambia
> por cuenta propia. El pedido completo de la Etapa 4, con los criterios de
> cada parte, está en `docs/etapa4-plan.md`.

## Qué es (tres cosas distintas; no mezclarlas)

| | Qué es | Hoy |
|---|---|---|
| **Un juego** | La forma de mostrarlo. | Sí |
| **Un experimento en el computador** | Una simulación con supuestos basados en estudios y un cerebro de mosca real. No mide personas ni equipos. | Sí |
| **Una prueba real** | Sólo cuando se lleve a equipos de verdad (parte 4.5). | Todavía no |

Por eso cada número dice de dónde sale: "en el juego", "en la simulación"
o "según estudios". Nada del proyecto dice "los equipos son así".

## La idea central: la paradoja de la eficiencia

Viene de Modig y Åhlström, *This is Lean* (2012). Hay dos formas de ser
"eficiente":

- **Eficiencia de recursos**: que las personas estén siempre ocupadas.
- **Eficiencia de flujo**: que el trabajo avance sin esperar.

Optimizar la primera destruye la segunda. Con muchas tareas la mosca nunca
está sin qué hacer, pero sus tareas esperan su turno casi todo el tiempo;
con una, la tarea vuela pero ella espera cuando se traba; con 2 o 3 se
equilibran.

(Esto es lo que mide la parte 4.1. Hasta entonces es lo que esperamos ver,
no un resultado.)

## Propósito

Mostrar, en un minuto y con una mosca de verdad, que **estar siempre ocupado
no es lo mismo que avanzar**, y ayudar a los equipos a encontrar su **límite
sostenible**.

- La **frase norte** es la del propósito: "estar siempre ocupado no es lo
  mismo que avanzar". En el informe para compartir aparece máximo 3 veces.
- **Límite sostenible** = el que se mantiene todo el día sin colapsar (el
  juego mide un solo día). En la parte 4.4 reemplaza a "límite sano" en los
  dos informes y en el panel de Carga del juego. Hasta entonces, el juego y
  los informes v1 siguen diciendo "sano".

## Hipótesis (lo que vamos a comprobar)

| | Hipótesis | Se prueba en | Estado |
|---|---|---|---|
| **H1** | **La paradoja**: con más tareas nunca le falta qué hacer, pero sus tareas pasan cada vez más tiempo esperando y termina menos. | 4.1 | Por probar |
| **H2** | **El límite sostenible**: con esperas a otros, el mejor número es bajo pero no 1, y se mantiene aunque cambien los supuestos. Si se mueve según cuánto se espera, eso también es un hallazgo. | 4.2 | Por probar |
| **H3** | **Lo empezado no desaparece**: al bajar el límite, la mejora tarda horas en notarse. | 4.2 | Por probar |
| **H4** | **Con personas**: ver la mosca ayuda a que un equipo entienda la paradoja y se anime a probar un límite. | 4.5 (sólo cuando Felipe lo pida) | Por probar |

Lo que ya se vio en el juego de hoy (con bloqueos, 2 tareas termina más que
1 o 9; al bajar de 10 a 2 a las 12:00 queda Tranqui recién a las ~15:10)
salió de una sola combinación de supuestos. No cuenta como prueba de H1, H2
ni H3: para eso están la 4.1 y la 4.2.

## Lo que NO es hipótesis (decirlo así siempre)

- **El estrés**: es un supuesto del juego basado en estudios. Que suba con
  las tareas lo pusimos nosotros.
- **Que cada tarea tarde más con más abiertas**: es matemática (ley de
  Little), no un hallazgo.
- **El cerebro**: no prueba nada sobre la oficina; nosotros elegimos
  tareas = polvo en la antena. Lo real es cómo reacciona una mosca a esa
  molestia.

## Advertencias

- **"Alto desempeño" es más grande que el WIP.** La mosca muestra un
  ingrediente, el flujo: "uno de los hábitos de los equipos de alto
  desempeño".
- **La mosca es una persona sola.** No mide traspasos de trabajo entre
  personas de un equipo.
- **Si una hipótesis no se cumple, se dice tal cual.** No se ajusta nada
  para que calce.

## Las partes de la Etapa 4

| Parte | Qué | Estado |
|---|---|---|
| 4.0 | Orden y norte | Hecha 2026-10-20, espera OK de Felipe |
| 4.1 | Medir la paradoja (H1) | Espera el OK de la 4.0 |
| 4.2 | Robustez: ¿se sostiene si cambian los supuestos? (H2 y H3) | Pendiente |
| 4.3 | Anclar en estudios: la hace Felipe con su asesor fuera de aquí; llega como `docs/investigacion-etapa4.md` | Pendiente (Felipe) |
| 4.4 | Rehacer el informe para compartir alrededor del norte. Al terminar: etiqueta git `etapa-4` | Pendiente |
| 4.5 | Kit para probar con equipos reales (H4) | Sólo cuando Felipe lo pida |

Reglas para todas las partes (detalle en `docs/etapa4-plan.md`):

- Una parte a la vez: se hace, se explica en simple y se espera el OK de
  Felipe antes de seguir.
- No se cambian las reglas del juego (`src/brain.js`) ni la pantalla (salvo
  la palabra "sostenible" en la 4.4). Las pruebas van en copias temporales,
  como en `scripts/opciones-3-3.mjs`. `simular-dias` tiene que seguir
  diciendo "Forma: todo bien".
- Antes de correr cada prueba se guarda en git qué se va a medir y qué
  cuenta como "se cumple", "a medias" o "no se cumple". Recién después se
  corre.
- Al cerrar cada parte: informe en `docs/etapa4-X.md`, un PDF corto (1 a 3
  páginas, en simple, con una tabla o gráfico) en la carpeta "Mosca del
  WIP" del Escritorio, `PROGRESO.md` al día, commit en español y un resumen
  de 5 líneas para Felipe.
- Siguen todas las reglas de `CLAUDE.md` (sólo MaleCNS, nunca FlyWire;
  avisar antes de instalar; nada importante se borra sin preguntar).
- Los datos de equipos reales (4.5) nunca van a git ni a los informes.

Ideas para después, no ahora: un equipo de moscas que se pasan trabajo;
tareas que llegan cada día (colas); mostrar la eficiencia de flujo en la
pantalla.
