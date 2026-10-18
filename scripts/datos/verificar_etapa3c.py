"""Etapa 3.2c · Dos verificaciones del cigarro real y una posible explicación del eco.

Pedido de Felipe (2026-10-18). Sin tocar el juego y SIN cambiar el peso
elegido (0,090 mV): sólo se informa.

Partes (cada una guarda lo suyo en resultados_etapa3_2c.json):
  barajadas     a) ¿es casualidad? Limpieza (aDN1/aDN2) con conexiones barajadas,
                   antena a WIP 10 y a WIP 6
  sensibilidad  b) la tabla del WIP con pesos 0,070 y 0,080: ¿la limpieza sigue
                   empezando cerca de WIP 4?
  densidad      c) posible explicación del eco con el peso de Shiu (sinapsis por
                   neurona: cifras publicadas de FlyWire contra datos de MaleCNS)

Uso:
    .venv-datos/bin/python scripts/datos/verificar_etapa3c.py barajadas
    .venv-datos/bin/python scripts/datos/verificar_etapa3c.py sensibilidad
    .venv-datos/bin/python scripts/datos/verificar_etapa3c.py densidad
"""

import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
import modelo_etapa3 as M  # noqa: E402
import pruebas_etapa3 as P  # noqa: E402

RESULTADOS = AQUI / "resultados_etapa3_2c.json"
RESULTADOS_3_2B = AQUI / "resultados_etapa3_2b.json"

# ===========================================================================
# REGLAS DE LA 3.2c FIJADAS ANTES DE VER LOS RESULTADOS (2026-10-18).
# ===========================================================================
W_ELEGIDO = 0.090                     # no se cambia por estos resultados
# a) ¿Es casualidad? Antena izq. completa (JO-C+E+F) a WIP 10 y WIP 6.
WIP_BARAJADAS = [10, 6]               # → 220 Hz y 131,1 Hz (regla 20–220 Hz)
N_REDES = 10                          # por cada forma de barajar (destinos, pesos)
SEMILLA_REDES = 1000                  # las mismas redes de la prueba 6
FRACCION_LIMITE = 0.10                # "mucho más baja" = bajo el 10 % de la red real
# Pasa ✅ si en ≥ 9 de 10 redes de cada forma, con los dos estímulos, la
# limpieza (promedio de las 4 aDN) queda bajo el 10 % de la red real con el
# mismo estímulo. ⚠️ si eso pasa en ≥ 7 de 10 en todos los casos, o en ≥ 9 de
# 10 sólo en algunos. ❌ si no.
# b) Sensibilidad: la tabla del WIP con estos pesos (misma regla 20–220 Hz).
PESOS_SENSIBILIDAD = [0.070, 0.080]
INICIO_HZ = 1.0                       # inicio = primer WIP con limpieza > 1 Hz (con 0,090: WIP 4)
INICIO_FUERTE_HZ = 10.0               # también se informa el primero con ≥ 10 Hz (con 0,090: WIP 5)
# Pasa ✅ si con los dos pesos el inicio queda en WIP 3, 4 o 5. ⚠️ si con
# alguno queda en WIP 2 o 6. ❌ si con alguno queda en WIP 1, en 7 o más, o
# nunca empieza.
# c) Sólo cifras publicadas de FlyWire (nunca sus datos): Dorkenwald y otros
# 2024, Nature 634:124 — 139.255 neuronas, 54,5 millones de sinapsis,
# 2.700.513 conexiones de 5 o más sinapsis.
FLYWIRE = {"neuronas": 139255, "sinapsis": 54_500_000, "conexiones_5_o_mas": 2_700_513}
# ===========================================================================

OK, DUDA, NO = P.OK, P.DUDA, P.NO
LIMPIEZA = P.LIMPIEZA


def guardar(clave, valor):
    todo = json.loads(RESULTADOS.read_text()) if RESULTADOS.exists() else {}
    todo[clave] = valor
    RESULTADOS.write_text(json.dumps(todo, indent=1, ensure_ascii=False) + "\n")


def limpieza(d):
    g = d["grupos"]
    return float(np.mean([g[n][l]["hz"] for n in LIMPIEZA for l in "LR"]))


def barajadas(red, c):
    S = c["sensores"]
    antena = M.indices(red, S["JO-C_L"] + S["JO-E_L"] + S["JO-F_L"])
    real = json.loads(RESULTADOS_3_2B.read_text())["wip"]["detalle"]
    salida, fracciones = {}, []
    for wip in WIP_BARAJADAS:
        hz = P.hz_por_wip(wip)
        ref = limpieza(real[str(wip)])
        salida[f"WIP {wip}"] = {"hz": round(hz, 1), "limpieza_red_real": round(ref, 2)}
        print(f"WIP {wip} ({hz:.1f} Hz): limpieza en la red real {ref:.1f} Hz")
        for modo in ["destinos", "pesos"]:
            redes = []
            for k in range(N_REDES):
                rb = M.red_barajada(red, SEMILLA_REDES + k, modo)
                d, _ = P.correr(red, W_ELEGIDO, [(antena, hz)], c, f"WIP {wip} · barajada ({modo}) n.º {k + 1}", red_usada=rb)
                g = d["grupos"]
                redes.append({"limpieza": round(limpieza(d), 2),
                              "aDN1": {l: g["aDN1 (DNg62)"][l]["hz"] for l in "LR"},
                              "aDN2": {l: g["aDN2 (DNge078)"][l]["hz"] for l in "LR"},
                              "neuronas_sobre_10hz": d["esparcido"]["neuronas_sobre_10hz"]})
            f = sum(r["limpieza"] < FRACCION_LIMITE * ref for r in redes) / N_REDES
            fracciones.append(f)
            salida[f"WIP {wip}"][modo] = {"redes": redes, "fraccion_mucho_mas_baja": f,
                                          "limpieza_promedio": round(float(np.mean([r["limpieza"] for r in redes])), 2)}
            print(f"   {modo}: limpieza promedio {salida[f'WIP {wip}'][modo]['limpieza_promedio']} Hz · "
                  f"bajo el 10 % en {round(f * N_REDES)} de {N_REDES}")
    v = OK if min(fracciones) >= 0.9 else (DUDA if (min(fracciones) >= 0.7 or max(fracciones) >= 0.9) else NO)
    salida["veredicto"] = v
    print(f"a) ¿Es casualidad? → {v}")
    guardar("barajadas", salida)


def sensibilidad(red, c):
    salida, notas = {}, []
    for w in PESOS_SENSIBILIDAD:
        filas, comparacion, _ = P.tabla_wip(red, c, w)
        limp = [f["limpieza"] for f in filas]
        inicio = next((f["wip"] for f in filas if f["limpieza"] > INICIO_HZ), None)
        fuerte = next((f["wip"] for f in filas if f["limpieza"] >= INICIO_FUERTE_HZ), None)
        if inicio is not None and 3 <= inicio <= 5:
            nota = OK
        elif inicio in (2, 6):
            nota = DUDA
        else:
            nota = NO
        notas.append(nota)
        salida[f"{w:.3f}"] = {"tabla": filas, "comparacion": comparacion, "limpieza": limp,
                              "inicio_mas_de_1hz": inicio, "primero_10hz_o_mas": fuerte, "nota": nota}
        print(f"Peso {w}: limpieza {limp} → empieza en WIP {inicio} (≥ 10 Hz en WIP {fuerte}) {nota}")
    v = NO if NO in notas else (OK if all(n == OK for n in notas) else DUDA)
    salida["veredicto"] = v
    print(f"b) Sensibilidad → {v}")
    guardar("sensibilidad", salida)


def densidad(red, c):
    anot = red["anot"]
    sup = anot["superclass"].fillna("").to_numpy().astype(str)
    cerebro = ~np.char.startswith(sup.astype("U"), "vnc") & (sup != "ascending_neuron") & (sup != "")
    pre, post, syn = red["pre"], red["post"], red["sinapsis"]
    n = len(red["ids"])
    ambos = cerebro[pre] & cerebro[post]
    datos = {
        "MaleCNS (todo el sistema nervioso, trazadas)": {
            "neuronas": int(n), "sinapsis": int(syn.sum()),
            "sinapsis_por_neurona": round(float(syn.sum() / n), 1),
            "conexiones_5_o_mas": int((syn >= 5).sum()),
            "conexiones_5_o_mas_por_neurona": round(float((syn >= 5).sum() / n), 1),
            "sinapsis_por_conexion_5_o_mas": round(float(syn[syn >= 5].mean()), 1)},
        "MaleCNS (sólo cerebro, aproximado)": {
            "neuronas": int(cerebro.sum()), "sinapsis": int(syn[ambos].sum()),
            "sinapsis_por_neurona": round(float(syn[ambos].sum() / cerebro.sum()), 1),
            "conexiones_5_o_mas": int((ambos & (syn >= 5)).sum()),
            "conexiones_5_o_mas_por_neurona": round(float((ambos & (syn >= 5)).sum() / cerebro.sum()), 1),
            "sinapsis_por_conexion_5_o_mas": round(float(syn[ambos & (syn >= 5)].mean()), 1)},
        "FlyWire (cifras publicadas)": {
            "neuronas": FLYWIRE["neuronas"], "sinapsis": FLYWIRE["sinapsis"],
            "sinapsis_por_neurona": round(FLYWIRE["sinapsis"] / FLYWIRE["neuronas"], 1),
            "conexiones_5_o_mas": FLYWIRE["conexiones_5_o_mas"],
            "conexiones_5_o_mas_por_neurona": round(FLYWIRE["conexiones_5_o_mas"] / FLYWIRE["neuronas"], 1)},
    }
    for k, v in datos.items():
        print(f"{k}: {json.dumps(v, ensure_ascii=False)}")
    cer = datos["MaleCNS (sólo cerebro, aproximado)"]["sinapsis_por_neurona"]
    razon = cer / datos["FlyWire (cifras publicadas)"]["sinapsis_por_neurona"]
    datos["razon_sinapsis_por_neurona_cerebro"] = round(razon, 2)
    datos["peso_shiu_ajustado_por_densidad"] = round(M.SHIU["w_syn_shiu"] / razon, 3)
    print(f"Sinapsis por neurona en el cerebro: MaleCNS / FlyWire = {razon:.2f} → el peso de Shiu (0,275) "
          f"equivaldría a ~{datos['peso_shiu_ajustado_por_densidad']} en MaleCNS (sólo como orden de magnitud)")
    guardar("densidad", datos)


if __name__ == "__main__":
    parte = sys.argv[1] if len(sys.argv) > 1 else ""
    if parte not in {"barajadas", "sensibilidad", "densidad"}:
        sys.exit(__doc__)
    t0 = time.time()
    red, circuito = P.cargar()
    {"barajadas": barajadas, "sensibilidad": sensibilidad, "densidad": densidad}[parte](red, circuito)
    print(f"({(time.time() - t0) / 60:.1f} min)")
