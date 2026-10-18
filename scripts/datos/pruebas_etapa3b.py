"""Etapa 3.2b · Más azúcar (LB3b + LB3c), la prueba del eco y la escalera del peso.

Pedido de Felipe (2026-10-18). La causa probable del eco de la 3.2: se
estimularon sólo 6 sensores de azúcar (LB3b) y Shiu estimula 21 (su
example.ipynb, hemisferio derecho, 0,275 mV). Según Tastekin y otros (bioRxiv
2025.08.25.671814), LB3c también es de dulce: "Both LB3b and LB3c projection
patterns matched the Gr64f-GAL4 positive neurons".

Sin tocar el juego. Mismo modelo (modelo_etapa3.py), mismas 6 pruebas
(pruebas_etapa3.seis_pruebas) con el azúcar nuevo, y la prueba 7 (eco).
Datos: MaleCNS v1.0 (CC BY 4.0). Nada de FlyWire.

Partes (cada una guarda lo suyo en resultados_etapa3_2b.json):
  calibrar         peso (b): azúcar a 100 Hz → MN9 izquierda ≈ 80 % (regla de la 3.2)
  pesos shiu       pruebas 7 y 1–6 con 0,275 mV (peso a)
  pesos calibrado  pruebas 7 y 1–6 con el peso (b)
  escalera         elige el peso (si hace falta, busca el más alto sin eco)
  pesos elegido    pruebas 7 y 1–6 con el peso elegido, si es otro
  wip              tabla WIP 1–10 con el peso elegido (misma regla 20–220 Hz)
  resumen          la tabla final y qué usa el juego según la escalera

Uso (desde la carpeta del proyecto):
    .venv-datos/bin/python scripts/datos/pruebas_etapa3b.py calibrar
    .venv-datos/bin/python scripts/datos/pruebas_etapa3b.py pesos shiu
    .venv-datos/bin/python scripts/datos/pruebas_etapa3b.py pesos calibrado
    .venv-datos/bin/python scripts/datos/pruebas_etapa3b.py escalera
    .venv-datos/bin/python scripts/datos/pruebas_etapa3b.py pesos elegido
    .venv-datos/bin/python scripts/datos/pruebas_etapa3b.py wip
    .venv-datos/bin/python scripts/datos/pruebas_etapa3b.py resumen
"""

import json
import sys
import time
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
import modelo_etapa3 as M  # noqa: E402
import pruebas_etapa3 as P  # noqa: E402

RAIZ = AQUI.parents[1]
RESULTADOS = AQUI / "resultados_etapa3_2b.json"
TABLA_WIP = RAIZ / "docs" / "etapa3-2b-tabla-wip.json"

# ===========================================================================
# REGLAS DE LA 3.2b FIJADAS ANTES DE VER LOS RESULTADOS (2026-10-18).
# No se cambian después (pedido de Felipe). Lo demás, igual que la 3.2.
# ===========================================================================
# Azúcar: LB3b + LB3c del lado DERECHO (se mide la MN9 izquierda; se informan ambas).
AZUCAR = ["LB3b_R", "LB3c_R"]
SHIU_SENSORES_AZUCAR = 21           # los de example.ipynb de Shiu, para comparar
W_SHIU = 0.275                      # peso (a): el de Shiu, sin ajustar nada
REJILLA_CALIBRAR = [0.05, 0.075] + P.REJILLA_W   # peso (b): misma regla que la 3.2

# Prueba 7 · eco. Cada repetición dura 1 s: estímulo de 0 a 500 ms y nada de
# 500 a 1.000 ms. Actividad = disparos por segundo de todo el cerebro, sin
# contar las neuronas estimuladas. SIN ECO = en las 30 repeticiones, desde 100
# ms después de apagar el estímulo (600–1.000 ms) la actividad queda en 1 % o
# menos de la que había en los últimos 100 ms con estímulo (400–500 ms).
ECO_MS_ESTIMULO = 500.0
ECO_REFERENCIA = 4                  # ventana 400–500 ms (ventanas de 100 ms)
ECO_DESPUES = slice(6, 10)          # ventanas 600–1.000 ms
ECO_TOPE = 0.01
# Un peso TIENE ECO si lo tiene con cualquiera de estos 3 estímulos (los más
# fuertes que usaría el juego). La prueba 7 pasa ✅ sólo sin eco en los 3.
ECO_ESTIMULOS = [("azúcar der 100 Hz", "azucar", 100.0),
                 ("azúcar der 200 Hz", "azucar", 200.0),
                 ("antena izq 220 Hz (WIP 10)", "antena", 220.0)]

# Escalera para elegir el peso:
#  1. Si el calibrado (b) no tiene eco → se usa (b).
#  2. Si (b) tiene eco y el de Shiu (a) no → se usa (a).
#  3. Si los dos tienen eco → el peso más alto SIN eco según la prueba 7 (nunca
#     "el que más se parezca al juego"): se revisa la rejilla de 0,025 en 0,025
#     (0,025 … 0,275) de arriba hacia abajo hasta el primero sin eco, y se afina
#     de 0,005 en 0,005 entre ese y el siguiente de la rejilla (también de arriba
#     hacia abajo); queda el más alto sin eco.
#  Con el peso que quede (en cualquiera de los 3 casos):
#   - el cigarro usa el circuito real si la prueba 2 pasa (✅);
#   - el café usa el circuito real sólo si la prueba 1 pasa (✅); si no, queda
#     ilustrativo y se dice en pantalla;
#   - si la prueba 2 no pasa (⚠️ o ❌) → opción 3 (el mapa sin simulación).
#  Con ese peso se recalcula la tabla del WIP con la misma regla (20–220 Hz).
#  Si la escalera termina en la opción 3, la tabla igual se calcula, sólo como
#  información.
BUSQUEDA_GRUESA = [round(0.025 * k, 3) for k in range(11, 0, -1)]   # 0,275 → 0,025
PASO_FINO = 0.005
# ===========================================================================

OK, DUDA, NO = P.OK, P.DUDA, P.NO


def leer_resultados():
    return json.loads(RESULTADOS.read_text()) if RESULTADOS.exists() else {}


def guardar(clave, valor):
    todo = leer_resultados()
    todo[clave] = valor
    RESULTADOS.write_text(json.dumps(todo, indent=1, ensure_ascii=False) + "\n")


def guardar_peso(w, clave, valor):
    todo = leer_resultados()
    todo.setdefault("pesos", {}).setdefault(f"{w:.3f}", {})[clave] = valor
    RESULTADOS.write_text(json.dumps(todo, indent=1, ensure_ascii=False) + "\n")


def grupos_entrada(red, c):
    S = c["sensores"]
    azucar = M.indices(red, sum((S[k] for k in AZUCAR), []))
    antena = M.indices(red, S["JO-C_L"] + S["JO-E_L"] + S["JO-F_L"])
    return azucar, antena


def contar_azucar(red, c):
    S = c["sensores"]
    sinapsis = {}
    for k in AZUCAR:
        ix = M.indices(red, S[k])
        sinapsis[k] = int(sum(red["indptr"][i + 1] - red["indptr"][i] for i in ix))
    salida_sin = {k: int(np.abs(red["pesos"][np.concatenate(
        [np.arange(red["indptr"][i], red["indptr"][i + 1]) for i in M.indices(red, S[k])])]).sum()) for k in AZUCAR}
    datos = {"por_tipo": {k: len(S[k]) for k in AZUCAR}, "total": sum(len(S[k]) for k in AZUCAR),
             "shiu": SHIU_SENSORES_AZUCAR, "sinapsis_de_salida": salida_sin,
             "conexiones_de_salida": sinapsis}
    print(f"Azúcar derecha: {datos['por_tipo']} = {datos['total']} sensores (Shiu: {SHIU_SENSORES_AZUCAR}) · "
          f"sinapsis de salida {salida_sin}")
    return datos


def prueba_eco(red, c, w):
    """Prueba 7: ¿la actividad se apaga sola al quitar el estímulo?"""
    azucar, antena = grupos_entrada(red, c)
    n = len(red["ids"])
    salida, todas_sin_eco = {}, True
    for nombre, cual, hz in ECO_ESTIMULOS:
        ix = azucar if cual == "azucar" else antena
        t0 = time.time()
        cuentas = M.simular_con_corte(red, w, [(ix, hz)], ECO_MS_ESTIMULO)   # rep × ventana × neurona
        resto = np.ones(n, dtype=bool)
        resto[ix] = False
        cuentas = cuentas[:, :, resto]
        por_s = cuentas.sum(axis=2, dtype=np.int64) * 10.0                    # disparos/s por ventana
        ref = por_s[:, ECO_REFERENCIA]
        despues = por_s[:, ECO_DESPUES].mean(axis=1)
        con_eco = despues > ECO_TOPE * ref
        activas = (cuentas > 0).sum(axis=2).mean(axis=0)                      # neuronas que disparan, por ventana
        sin_eco = not bool(con_eco.any())
        todas_sin_eco &= sin_eco
        salida[nombre] = {
            "sin_eco": sin_eco, "repeticiones_con_eco": int(con_eco.sum()),
            "actividad_con_estimulo": round(float(ref.mean()), 1),
            "actividad_despues": round(float(despues.mean()), 1),
            "proporcion": round(float(despues.mean() / ref.mean()), 4) if ref.mean() > 0 else None,
            "neuronas_disparando_por_ventana": [round(float(a), 1) for a in activas],
            "segundos": round(time.time() - t0, 1)}
        print(f"   · eco {nombre}: {'sin eco' if sin_eco else f'ECO en {int(con_eco.sum())}/30'} | "
              f"con estímulo {ref.mean():,.0f} disparos/s → después {despues.mean():,.0f} "
              f"({salida[nombre]['proporcion']}) | {salida[nombre]['segundos']} s")
    return {"veredicto": OK if todas_sin_eco else NO, "tiene_eco": not todas_sin_eco, "estimulos": salida}


def peso(cual):
    r = leer_resultados()
    if cual == "shiu":
        return W_SHIU
    if cual == "calibrado":
        return r["calibracion"]["w_syn"]
    if cual == "elegido":
        return r["escalera"]["w"]
    raise ValueError(cual)


def calibrar(red, c):
    guardar("azucar", contar_azucar(red, c))
    azucar, _ = grupos_entrada(red, c)
    guardar("calibracion", P.calibrar_con(red, c, azucar, REJILLA_CALIBRAR, "LB3b + LB3c derecha"))


def pesos(red, c, cual):
    w = peso(cual)
    todo = leer_resultados()
    hecho = todo.get("pesos", {}).get(f"{w:.3f}", {})
    if "eco" in hecho and "pruebas" in hecho:
        print(f"El peso {w} ya tiene sus pruebas ({cual}); no se repiten.")
        return
    print(f"Peso {cual}: {w} mV")
    guardar_peso(w, "etiqueta", cual)
    guardar_peso(w, "eco", prueba_eco(red, c, w))
    azucar, _ = grupos_entrada(red, c)
    guardar_peso(w, "pruebas", P.seis_pruebas(red, c, w, azucar))


def escalera(red, c):
    r = leer_resultados()
    wa, wb = W_SHIU, r["calibracion"]["w_syn"]
    eco_a = r["pesos"][f"{wa:.3f}"]["eco"]["tiene_eco"]
    eco_b = r["pesos"][f"{wb:.3f}"]["eco"]["tiene_eco"]
    busqueda = []
    if not eco_b:
        paso, w, razon = 1, wb, f"el calibrado ({wb}) no tiene eco"
    elif not eco_a:
        paso, w, razon = 2, wa, f"el calibrado ({wb}) tiene eco y el de Shiu ({wa}) no"
    else:
        print(f"Los dos tienen eco ({wa} y {wb}): busco el peso más alto sin eco")
        conocido = {wa: eco_a, wb: eco_b}

        def tiene_eco(x):
            x = round(x, 3)
            if x not in conocido:
                print(f" probando {x} mV")
                e = prueba_eco(red, c, x)
                conocido[x] = e["tiene_eco"]
                busqueda.append({"w": x, "tiene_eco": e["tiene_eco"], "detalle": e["estimulos"]})
            return conocido[x]

        grueso = next((x for x in BUSQUEDA_GRUESA if not tiene_eco(x)), None)
        if grueso is None:
            paso, w, razon = 3, None, "ningún peso de la rejilla está sin eco"
        else:
            arriba = round(grueso + 0.025, 3)
            finos = [round(arriba - PASO_FINO * k, 3) for k in range(1, int(round(0.025 / PASO_FINO)))]
            fino = next((x for x in finos if x < W_SHIU + 1e-9 and not tiene_eco(x)), None)
            w = fino if fino is not None else grueso
            paso, razon = 3, f"los dos tienen eco; el más alto sin eco es {w} mV"
    print(f"Escalera → paso {paso}: {razon}")
    guardar("escalera", {"paso": paso, "w": w, "razon": razon, "eco_shiu": eco_a, "eco_calibrado": eco_b,
                         "busqueda": busqueda})


def wip(red, c):
    w = peso("elegido")
    filas, comparacion, detalle = P.tabla_wip(red, c, w)
    guardar("wip", {"w_syn": w, "tabla": filas, "comparacion": comparacion, "detalle": detalle})
    paso = leer_resultados()["escalera"]["paso"]
    P.escribir_tabla_chica(TABLA_WIP, w, filas, comparacion, "Etapa 3.2b",
                           modelo=f"LIF como Shiu et al. 2024; w_syn = {w} mV elegido con la escalera de la 3.2b "
                                  f"(paso {paso}); azúcar = LB3b + LB3c derecha")


def resumen(red, c):
    r = leer_resultados()
    e = r["escalera"]
    filas = []
    for clave, d in r["pesos"].items():
        p = d["pruebas"]
        filas.append((clave, d.get("etiqueta"), [p[k]["veredicto"] for k in "123456"] + [d["eco"]["veredicto"]]))
    print("Peso      | etiqueta   | 1  2  3  4  5  6  7(eco)")
    for clave, et, v in filas:
        print(f"{clave:9s} | {et:10s} | " + "  ".join(v))
    decision = {"paso": e["paso"], "w": e["w"], "razon": e["razon"]}
    if e["w"] is not None:
        p = r["pesos"][f"{e['w']:.3f}"]["pruebas"]
        limpia = p["2"]["veredicto"] == OK
        decision["cigarro"] = "circuito real" if limpia else "opción 3 (mapa sin simulación)"
        decision["cafe"] = ("circuito real" if p["1"]["veredicto"] == OK else
                            "ilustrativo (se dice en pantalla)") if limpia else "opción 3 (mapa sin simulación)"
    else:
        decision["cigarro"] = decision["cafe"] = "opción 3 (mapa sin simulación)"
    print(f"Escalera: paso {decision['paso']} → peso {decision['w']} ({decision['razon']})")
    print(f"Cigarro: {decision['cigarro']} · Café: {decision['cafe']}")
    guardar("decision", decision)


if __name__ == "__main__":
    parte = sys.argv[1] if len(sys.argv) > 1 else ""
    if parte not in {"calibrar", "pesos", "escalera", "wip", "resumen"} or \
            (parte == "pesos" and (len(sys.argv) < 3 or sys.argv[2] not in {"shiu", "calibrado", "elegido"})):
        sys.exit(__doc__)
    t0 = time.time()
    red, circuito = P.cargar()
    if parte == "pesos":
        pesos(red, circuito, sys.argv[2])
    else:
        {"calibrar": calibrar, "escalera": escalera, "wip": wip, "resumen": resumen}[parte](red, circuito)
    print(f"({(time.time() - t0) / 60:.1f} min)")
