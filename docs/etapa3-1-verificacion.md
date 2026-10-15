# Etapa 3.1 · Verificar sin descargar (2026-10-15)

Revisión hecha sólo con la tabla de anotaciones de MaleCNS v1.0 que ya
teníamos (`datos-crudos/body-annotations-male-cns-v1.0-minconf-0.5.feather`,
14,5 MB; su huella md5 es igual a la del servidor, así que es la versión
vigente). No se bajó nada nuevo: del servidor sólo se consultaron tamaños y
huellas. Se repite con:

    .venv-datos/bin/python scripts/datos/verificar_etapa3.py

Los bodyId de cada candidata quedan en `scripts/datos/candidatas_etapa3.json`
(para la 3.2).

## Resultado

| # | Qué | Estado | Qué encontramos | Qué significa para el plan |
|---|-----|--------|-----------------|----------------------------|
| 1 | Sensores JO-C, JO-E, JO-F | ✅ (lados desparejos) | JO-C 68 (46 izq / 22 der) · JO-E 267 (157 / 110) · JO-F 78 (42 / 36). Hay además 102 JO "sin clasificar", 95 del lado derecho. Etiquetas: JO-F casi todas "grooming" (64 de 78); JO-C/E "viento y gravedad". | Hay sensores de sobra para estimular. El lado derecho tiene muchas sin clasificar, así que hay menos JO-C/E/F identificadas a la derecha. En la 3.2 se estimula y se mide **por lado**, para que el desbalance no parezca un resultado. |
| 2 | aBN2 (LB23, 3 por lado) | ⚠️ candidata fuerte | En LB23 hay 43 neuronas. Un solo tipo tiene exactamente 3 por lado: **GNG380** (6, en FlyWire se llama CB2820). La tabla no la llama "aBN2". | Muy probablemente es aBN2, pero el nombre no lo dice. En la 3.2 se confirma si recibe de los sensores JO y de aBN1. |
| 3 | aDN1 = DNg62, aDN2 = DNge078 | ✅ | DNg62: 2 (1 por lado), sinónimo "Hampel 2015: aDN1". DNge078: 2 (1 por lado), sinónimo "Hampel 2015: aDN2". Ambas son descendentes de **pata delantera** ("fl") y su reconstrucción es "preliminar". | Confirmadas por nombre. Que sean de pata delantera calza: con esas patas se limpian las antenas. En la 3.2 falta confirmar que aDN2 le habla directo a aDN1. Posible 3.ª aDN: hay otras descendentes de pata delantera de la misma familia (DNge029, DNge123); se revisan por conexiones. |
| 4 | aBN1 por sinónimo | ❌ (esperado) | Ninguna fila dice "aBN". | Como estaba previsto, queda para la 3.2: se busca por conexiones (1 por lado, entre las 5 que más reciben de JO y que le hable a DNg62/DNge078). Si no aparece, plan B: el grupo de las 5 que más reciben. |
| 5 | MN9 | ✅ | 2, una por lado. Es motora de la trompita y sale por el nervio faríngeo. La derecha está marcada "difícil de reconstruir". | Confirmada. Si en la 3.2 la derecha responde menos, puede ser por la reconstrucción y no por el circuito: se mira cada lado por separado. |
| 6 | Azúcar: LB3b y AN13B002 | ✅ existen · ⚠️ "azúcar" | **LB3b**: 11 sensores del gusto de la trompita (5 izq / 6 der). **AN13B002**: 2, sinónimo "Shiu 2022: Dandelion"; su nombre en FlyWire es AN_GNG_68, igual que dice Tastekin. Además, la tabla tiene 22 neuronas del circuito de comer con nombre de Shiu 2022 (por ejemplo Fdg, la que manda a sacar la trompita). Plan B, sensores de la pata LgLG3: 162. | Las dos existen. Pero la tabla **no dice** que LB3b sea de azúcar: eso viene del artículo de Tastekin (no leímos su tabla S1). En la 3.2 se comprueba por conexiones que LB3b llegue a Dandelion, Fdg y MN9. Si no llega, plan B: LgLG3. |
| 7 | Licencia y tamaños | ✅ | La página oficial dice "The Male CNS dataset is licensed under CC-BY" con enlace a CC BY 4.0. Tamaños en el servidor: conexiones traced-only **508,0 MB** (md5 `6601d4ad0afa99fd03eb087965ef2423`), neurotransmisores **43,3 MB** (md5 `3d842b12fe5c49eefade528d7dd24a1f`); la completa pesa 1.051 MB y no se baja. | En la 3.2 se bajan unos 551 MB y se comparan las huellas. Ojo: la página de descarga no explica "traced-only" (sólo nombra la completa). Por el nombre serían las conexiones entre neuronas completas ("Traced"), y **todas** nuestras candidatas lo son. En la 3.2 se comprueba que aparezcan en el archivo; si falta alguna, se usa la completa. |

## Cosas que no calzan del todo (tal cual)

- **Lados desparejos en la antena**: 245 JO-C/E/F a la izquierda y 168 a la
  derecha. No es biología: a la derecha hay 95 sin clasificar.
- **aBN2 sin nombre**: GNG380 calza en familia y cantidad, pero falta la
  prueba de conexiones.
- **LB3b = azúcar** es la propuesta de Tastekin 2026; la tabla no lo dice.
- **Otra "aDN" en la tabla**: AOTU103m tiene el sinónimo "aDN" de otros
  estudios (cortejo del macho). Es otra neurona con el mismo apodo: no
  confundir.
- **DNg84 está en LB23**, la misma familia que GNG380. Un proyecto
  aficionado la usaba como "descendente de limpieza". No cambia el plan,
  pero se mira en la 3.2.

## Para la 3.2 (cuando Felipe diga)

1. Avisar y bajar los 2 archivos (551 MB), comprobar tamaño y md5.
2. Avisar e instalar scipy en `.venv-datos/`.
3. Confirmar que todas las candidatas aparecen en traced-only.
4. Conexiones: JO → GNG380 (aBN2) · buscar aBN1 · aDN2 → aDN1 directo ·
   LB3b → Dandelion / Fdg → MN9.
5. Las 4 pruebas del cerebro (azúcar → MN9; JO-C/E → aBN1; JO-F sola
   débil; barajado → MN9 casi apagada), midiendo por lado. Sin tocar el juego.
