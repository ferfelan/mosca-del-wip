"""Etapa 3.2 · Calibrar el cerebro y correr las pruebas (sin tocar el juego).

Usa el modelo de modelo_etapa3.py (igual que Shiu et al. 2024) sobre la red
de MaleCNS v1.0 (CC BY 4.0) y los grupos de neuronas que deja
conexiones_etapa3.py en circuito_etapa3_2.json. Nada de FlyWire.

Partes (cada una guarda lo suyo en resultados_etapa3_2.json):
  calibrar  w_syn tal que azúcar derecha a 100 Hz → MN9 izquierda ≈ 80 % de su máximo
  pruebas   las 6 pruebas del cerebro
  wip       la tabla para el juego (WIP 1–10 → antena 20–220 Hz)
  extra     robustez: pruebas 1–3 con w_syn ±30 % (como hizo Shiu)

Uso (desde la carpeta del proyecto):
    .venv-datos/bin/python scripts/datos/pruebas_etapa3.py calibrar
    .venv-datos/bin/python scripts/datos/pruebas_etapa3.py pruebas
    .venv-datos/bin/python scripts/datos/pruebas_etapa3.py wip
    .venv-datos/bin/python scripts/datos/pruebas_etapa3.py extra
"""

import json
import sys
import time
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
import modelo_etapa3 as M  # noqa: E402

RAIZ = AQUI.parents[1]
CIRCUITO = AQUI / "circuito_etapa3_2.json"
RESULTADOS = AQUI / "resultados_etapa3_2.json"
TABLA_WIP = RAIZ / "docs" / "etapa3-2-tabla-wip.json"

# ===========================================================================
# REGLAS FIJADAS ANTES DE VER LOS RESULTADOS (2026-10-18).
# No se cambian para que algo calce (pedido de Felipe).
# ===========================================================================
# Calibración. Shiu: "azúcar a 100 Hz → ~80 % del disparo máximo de MN9".
# Shiu no dice qué es "máximo": aquí es el techo que alcanza la MN9 izquierda
# al subir w_syn en esta rejilla. Se elige el w_syn donde la curva cruza el
# 80 % de ese techo (interpolando en línea recta) y no se vuelve a tocar.
REJILLA_W = [0.10, 0.15, 0.20, 0.25, 0.275, 0.30, 0.35, 0.40, 0.45, 0.50,
             0.55, 0.60, 0.70, 0.80, 1.00, 1.25, 1.50, 2.00]  # mV por sinapsis
META = 0.80
HZ_AZUCAR = 100.0                                 # calibración y prueba 1
HZ_AZUCAR_CURVA = [10.0, 50.0, 100.0, 150.0, 200.0]  # rango de Shiu para el azúcar
HZ_ANTENA = 140.0       # pruebas 2–4 (Shiu activó la antena a 140 Hz al silenciar)
HZ_ANTENA_MAX = 220.0   # la prueba 3 también al máximo del rango de Shiu


def hz_por_wip(wip):
    """WIP 1 → 20 Hz … WIP 10 → 220 Hz, en línea recta (rango de Shiu para la antena)."""
    return 20.0 + (wip - 1) * 200.0 / 9.0


N_BARAJADAS = 10       # redes barajadas por cada forma de barajar (prueba 6)
ENCENDIDA = 10.0       # Hz: "se enciende" si el promedio llega a esto
APAGADA = 2.0          # Hz: "apagada" si el promedio queda bajo esto
CASI_APAGADA = 0.10    # bajo 10 % del caso de referencia = "casi apagada"
DUDOSO = 0.33          # entre 10 % y 33 % = dudoso; sobre 33 % = no pasó
# Lados: azúcar del lado DERECHO, se mide sobre todo la MN9 IZQUIERDA; antena
# del lado IZQUIERDO. Siempre se miden y se informan los dos lados.
# La tabla del WIP estimula la antena izquierda completa: JO-C + JO-E + JO-F.
# "Limpieza" = promedio de las 4 aDN (aDN1 y aDN2, de ambos lados).
# Para comparar con el juego (colillas por WIP, de simular-dias, 2026-10-15):
COLILLAS_JUEGO = [0, 0, 0, 1, 3, 6, 8, 11, 13, 15]
LIMPIEZA = ["aDN1 (DNg62)", "aDN2 (DNge078)"]
GRUPOS_LIMPIEZA = ["aBN1 (SAD093)", "aBN2 (trío LB23)", "aDN1 (DNg62)", "aDN2 (DNge078)"]
# ===========================================================================

OK, DUDA, NO = "✅", "⚠️", "❌"


def cargar():
    red = M.cargar_red()
    circuito = json.loads(CIRCUITO.read_text())
    tipo = red["anot"]["type"].fillna("").astype(str).to_numpy()
    red["kc"] = np.char.startswith(tipo.astype("U"), "KC")
    return red, circuito


def leer(red, tasas, grupos):
    """Hz promedio por grupo y lado (promedio de neuronas y repeticiones) y su variación."""
    salida = {}
    for nombre, lados in grupos.items():
        salida[nombre] = {}
        for lado, ids in lados.items():
            if not ids:
                continue
            por_rep = tasas[:, M.indices(red, ids)].mean(axis=1)
            salida[nombre][lado] = {"hz": round(float(por_rep.mean()), 2),
                                    "de": round(float(por_rep.std(ddof=1)), 2),
                                    "n": len(ids)}
    return salida


def esparcido(red, tasas):
    m = tasas.mean(axis=0)
    return {"neuronas_sobre_10hz": int((m > 10).sum()), "neuronas_con_algo": int((m > 0).sum()),
            "kenyon_sobre_10hz": int((m[red["kc"]] > 10).sum()), "kenyon_total": int(red["kc"].sum())}


def correr(red, w, estimulos, circuito, etiqueta, red_usada=None):
    t0 = time.time()
    tasas = M.simular(red_usada or red, w, estimulos)
    datos = {"grupos": leer(red, tasas, circuito["medir"]), "esparcido": esparcido(red, tasas),
             "segundos": round(time.time() - t0, 1)}
    print(f"   · {etiqueta}: {datos['segundos']} s | {datos['esparcido']['neuronas_sobre_10hz']} neuronas sobre 10 Hz")
    return datos, tasas


def hz(datos, grupo, lado):
    return datos["grupos"][grupo][lado]["hz"]


def guardar(parte, contenido):
    todo = json.loads(RESULTADOS.read_text()) if RESULTADOS.exists() else {}
    todo[parte] = contenido
    RESULTADOS.write_text(json.dumps(todo, indent=1, ensure_ascii=False) + "\n")


def w_calibrado():
    todo = json.loads(RESULTADOS.read_text())
    return todo["calibracion"]["w_syn"]


def calibrar(red, circuito):
    azucar = M.indices(red, circuito["sensores"]["LB3b_R"])
    mn9 = {l: M.indices(red, circuito["medir"]["MN9"][l])[0] for l in "LR"}
    curva = []
    print(f"Calibración: LB3b derecha a {HZ_AZUCAR:.0f} Hz, {M.SHIU['n_run']} repeticiones por peso")
    for w in REJILLA_W:
        t0 = time.time()
        tasas = M.simular(red, w, [(azucar, HZ_AZUCAR)])
        fila = {"w_syn": w, "MN9_L": round(float(tasas[:, mn9["L"]].mean()), 2),
                "MN9_L_de": round(float(tasas[:, mn9["L"]].std(ddof=1)), 2),
                "MN9_R": round(float(tasas[:, mn9["R"]].mean()), 2), **esparcido(red, tasas)}
        curva.append(fila)
        print(f"   w {w:5.3f} mV → MN9 izq {fila['MN9_L']:6.1f} Hz · der {fila['MN9_R']:6.1f} Hz · "
              f"{fila['neuronas_sobre_10hz']:6d} neuronas sobre 10 Hz ({time.time() - t0:.0f} s)")
    maximo = max(c["MN9_L"] for c in curva)
    meta = META * maximo
    w_cal = curva[0]["w_syn"]
    for a, b in zip(curva, curva[1:]):
        if a["MN9_L"] < meta <= b["MN9_L"]:
            w_cal = a["w_syn"] + (meta - a["MN9_L"]) * (b["w_syn"] - a["w_syn"]) / (b["MN9_L"] - a["MN9_L"])
            break
    w_cal = round(w_cal, 3)
    tasas = M.simular(red, w_cal, [(azucar, HZ_AZUCAR)])
    logrado = float(tasas[:, mn9["L"]].mean())
    print(f"   Techo de la MN9 izq: {maximo:.1f} Hz → meta 80 % = {meta:.1f} Hz → w_syn = {w_cal} mV "
          f"(Shiu usó {M.SHIU['w_syn_shiu']}) → con ese peso MN9 izq = {logrado:.1f} Hz ({logrado / maximo:.0%} del techo)")
    guardar("calibracion", {"curva": curva, "maximo_hz": maximo, "meta_hz": round(meta, 2), "w_syn": w_cal,
                            "mn9_izq_con_w": round(logrado, 2), "porcentaje_del_maximo": round(logrado / maximo, 3),
                            "w_syn_shiu": M.SHIU["w_syn_shiu"], "regla": "techo de la MN9 izq. en la rejilla; cruce del 80 %"})


def pruebas(red, circuito):
    w = w_calibrado()
    S = circuito["sensores"]
    azucar = M.indices(red, S["LB3b_R"])
    antena_ce = M.indices(red, S["JO-C_L"] + S["JO-E_L"])
    antena_f = M.indices(red, S["JO-F_L"])
    print(f"Pruebas con w_syn = {w} mV")
    res = {}

    # 1) Azúcar → MN9 (y la curva 10–200 Hz)
    curva = {}
    tasas_100 = None
    for f in HZ_AZUCAR_CURVA:
        datos, tasas = correr(red, w, [(azucar, f)], circuito, f"azúcar der {f:.0f} Hz")
        curva[f"{f:.0f}"] = datos
        if f == HZ_AZUCAR:
            tasas_100 = tasas
    mn9_curva = [hz(curva[f"{f:.0f}"], "MN9", "L") for f in HZ_AZUCAR_CURVA]
    sube = all(b >= a - 1.0 for a, b in zip(mn9_curva, mn9_curva[1:]))
    a100 = curva[f"{HZ_AZUCAR:.0f}"]
    m1 = hz(a100, "MN9", "L")
    v1 = OK if (m1 >= ENCENDIDA and sube) else (DUDA if m1 >= ENCENDIDA else NO)
    res["1"] = {"veredicto": v1, "MN9_L": m1, "MN9_R": hz(a100, "MN9", "R"), "curva_MN9_L": mn9_curva, "sube": sube,
                "detalle": curva}

    # Camino funcional: quién empuja (y quién frena) a la MN9 izquierda con azúcar a 100 Hz
    mn9l = M.indices(red, circuito["medir"]["MN9"]["L"])[0]
    entra = red["post"] == mn9l
    pre = red["pre"][entra]
    aporte = tasas_100.mean(axis=0)[pre] * red["pesos"][entra]   # Hz × sinapsis con signo
    anot = red["anot"]
    orden = np.argsort(aporte)
    def fila(i):
        b = int(red["ids"][pre[i]])
        return {"bodyId": b, "tipo": str(anot["type"].iloc[pre[i]]), "lado": str(anot["somaSide"].iloc[pre[i]]),
                "hz": round(float(tasas_100.mean(axis=0)[pre[i]]), 1), "sinapsis": int(red["sinapsis"][entra][i]),
                "signo": "+" if red["pesos"][entra][i] > 0 else "−"}
    res["1"]["empujan_MN9_L"] = [fila(i) for i in orden[::-1][:8] if aporte[i] > 0]
    res["1"]["frenan_MN9_L"] = [fila(i) for i in orden[:6] if aporte[i] < 0]

    # 2) Antena JO-C + JO-E izquierda → aBN1, aDN1, aDN2
    d2, _ = correr(red, w, [(antena_ce, HZ_ANTENA)], circuito, f"antena JO-C+E izq {HZ_ANTENA:.0f} Hz")
    d2b, _ = correr(red, w, [(antena_ce, HZ_ANTENA_MAX)], circuito, f"antena JO-C+E izq {HZ_ANTENA_MAX:.0f} Hz")
    abn1 = hz(d2, "aBN1 (SAD093)", "L")
    adn1 = max(hz(d2, "aDN1 (DNg62)", l) for l in "LR")
    adn2 = max(hz(d2, "aDN2 (DNge078)", l) for l in "LR")
    v2 = OK if (abn1 >= ENCENDIDA and adn1 >= ENCENDIDA and adn2 >= ENCENDIDA) else (DUDA if abn1 >= ENCENDIDA else NO)
    res["2"] = {"veredicto": v2, "aBN1_L": abn1, "aDN1_max_lado": adn1, "aDN2_max_lado": adn2,
                "detalle": d2, "detalle_220hz": d2b}

    # 3) JO-F sola → aBN1 casi apagada (comparada con la prueba 2)
    d3, _ = correr(red, w, [(antena_f, HZ_ANTENA)], circuito, f"antena JO-F izq {HZ_ANTENA:.0f} Hz")
    d3b, _ = correr(red, w, [(antena_f, HZ_ANTENA_MAX)], circuito, f"antena JO-F izq {HZ_ANTENA_MAX:.0f} Hz")
    f3 = hz(d3, "aBN1 (SAD093)", "L")
    if abn1 < ENCENDIDA:
        v3, razon = DUDA, None
    else:
        razon = f3 / abn1
        v3 = OK if (razon < CASI_APAGADA or f3 < APAGADA) else (DUDA if razon <= DUDOSO else NO)
    res["3"] = {"veredicto": v3, "aBN1_L_JOF": f3, "aBN1_L_JOCE": abn1, "proporcion": None if razon is None else round(razon, 3),
                "aBN1_L_JOF_220hz": hz(d3b, "aBN1 (SAD093)", "L"), "detalle": d3, "detalle_220hz": d3b}

    # 4) Cada circuito hace lo suyo
    limpieza_con_azucar = {g: {l: hz(a100, g, l) for l in "LR"} for g in GRUPOS_LIMPIEZA}
    peor_azucar = max(v for g in limpieza_con_azucar.values() for v in g.values())
    mn9_con_antena = {l: hz(d2, "MN9", l) for l in "LR"}
    peor_antena = max(mn9_con_antena.values())
    def nota(x):
        return OK if x < APAGADA else (DUDA if x < ENCENDIDA else NO)
    partes = [nota(peor_azucar), nota(peor_antena)]
    v4 = NO if NO in partes else (OK if partes == [OK, OK] else DUDA)
    res["4"] = {"veredicto": v4, "limpieza_con_azucar": limpieza_con_azucar, "MN9_con_antena": mn9_con_antena,
                "partes": {"azucar_no_limpia": partes[0], "antena_no_come": partes[1]}}

    # 5) Sin estímulo → todo apagado
    t0 = time.time()
    tasas0 = M.simular(red, w, [])
    total = int(tasas0.sum())
    res["5"] = {"veredicto": OK if total == 0 else NO, "disparos_totales": total}
    print(f"   · sin estímulo: {time.time() - t0:.0f} s | disparos en todo el cerebro: {total}")

    # 6) Conexiones barajadas al azar → MN9 casi apagada
    res["6"] = {"referencia_MN9_L": m1}
    pasan = {}
    for modo in ["destinos", "pesos"]:
        valores = []
        for k in range(N_BARAJADAS):
            rb = M.red_barajada(red, 1000 + k, modo)
            datos, _ = correr(red, w, [(azucar, HZ_AZUCAR)], circuito, f"barajada ({modo}) n.º {k + 1}", red_usada=rb)
            valores.append({"MN9_L": hz(datos, "MN9", "L"), "MN9_R": hz(datos, "MN9", "R"),
                            "neuronas_sobre_10hz": datos["esparcido"]["neuronas_sobre_10hz"]})
        pasan[modo] = sum(v["MN9_L"] < CASI_APAGADA * m1 for v in valores) / N_BARAJADAS
        res["6"][modo] = {"redes": valores, "fraccion_casi_apagada": pasan[modo]}
    ambos = [pasan["destinos"] >= 0.9, pasan["pesos"] >= 0.9]
    v6 = OK if all(ambos) else (DUDA if any(ambos) or min(pasan.values()) >= 0.7 else NO)
    res["6"]["veredicto"] = v6

    guardar("pruebas", {"w_syn": w, **res})
    print("\nResumen:")
    for k in "123456":
        print(f"   prueba {k}: {res[k]['veredicto']}")


def wip(red, circuito):
    w = w_calibrado()
    S = circuito["sensores"]
    antena = M.indices(red, S["JO-C_L"] + S["JO-E_L"] + S["JO-F_L"])
    print(f"Tabla por WIP con w_syn = {w} mV (antena izq JO-C+E+F, {len(antena)} sensores)")
    filas, detalle = [], {}
    for k in range(1, 11):
        f = hz_por_wip(k)
        datos, _ = correr(red, w, [(antena, f)], circuito, f"WIP {k} → {f:.1f} Hz")
        detalle[str(k)] = datos
        g = datos["grupos"]
        fila = {"wip": k, "hz_antena": round(f, 1),
                **{f"{n.split()[0]}_{l}": g[n][l]["hz"] for n in ["aDN1 (DNg62)", "aDN2 (DNge078)", "MN9"] for l in "LR"}}
        fila["limpieza"] = round(float(np.mean([g[n][l]["hz"] for n in LIMPIEZA for l in "LR"])), 2)
        filas.append(fila)
    limp = [f["limpieza"] for f in filas]
    sube = all(b >= a - 1.0 for a, b in zip(limp, limp[1:]))
    bajo = float(np.mean(limp[:3])) < CASI_APAGADA * limp[-1] if limp[-1] > 0 else False
    corr = float(np.corrcoef(limp, COLILLAS_JUEGO)[0, 1]) if np.std(limp) > 0 else None
    comparacion = {"sube_con_el_wip": OK if sube else NO, "casi_nada_con_wip_1_a_3": OK if bajo else NO,
                   "correlacion_con_colillas": None if corr is None else round(corr, 3)}
    print("\n WIP   Hz   aDN1 izq/der   aDN2 izq/der   MN9 izq/der   limpieza")
    for f in filas:
        print(f"  {f['wip']:2d}  {f['hz_antena']:5.1f}  {f['aDN1_L']:6.1f}/{f['aDN1_R']:<6.1f}  {f['aDN2_L']:6.1f}/{f['aDN2_R']:<6.1f}"
              f"  {f['MN9_L']:5.1f}/{f['MN9_R']:<5.1f}  {f['limpieza']:6.1f}")
    print(f" ¿sube con el WIP? {comparacion['sube_con_el_wip']} · ¿casi nada con WIP 1–3, como el juego? "
          f"{comparacion['casi_nada_con_wip_1_a_3']} · parecido con las colillas del juego (correlación): {comparacion['correlacion_con_colillas']}")
    guardar("wip", {"w_syn": w, "tabla": filas, "comparacion": comparacion, "detalle": detalle})
    TABLA_WIP.write_text(json.dumps({
        "que_es": "Etapa 3.2: respuesta del circuito real de limpieza de antenas (MaleCNS v1.0) para cada WIP. "
                  "Todavía NO la usa el juego: cómo se traduce se decide en la Etapa 3.3.",
        "fuente": "Male CNS connectome v1.0 (FlyEM / HHMI Janelia, Cambridge, MRC LMB, Google Research), CC BY 4.0",
        "modelo": f"LIF como Shiu et al. 2024; w_syn = {w} mV calibrado con azúcar (LB3b der.) a 100 Hz → MN9 izq. al 80 % de su máximo",
        "regla_wip": "antena izquierda (JO-C + JO-E + JO-F) a 20 + (WIP − 1) × 200/9 Hz (20 → 220 Hz), fijada antes de ver resultados",
        "unidades": "Hz (disparos por segundo), promedio de 30 repeticiones de 1 s",
        "columnas": "aDN1 = DNg62, aDN2 = DNge078, MN9 = sacar la trompita; _L izquierda, _R derecha; limpieza = promedio de las 4 aDN",
        "tabla": filas,
        "comparacion_con_el_juego": comparacion,
    }, indent=1, ensure_ascii=False) + "\n")
    print(f" Tabla chica guardada en {TABLA_WIP.relative_to(RAIZ)}")


def extra(red, circuito):
    w = w_calibrado()
    S = circuito["sensores"]
    azucar = M.indices(red, S["LB3b_R"])
    antena_ce = M.indices(red, S["JO-C_L"] + S["JO-E_L"])
    antena_f = M.indices(red, S["JO-F_L"])
    print(f"Robustez: pruebas 1–3 con w_syn ±30 % (base {w} mV)")
    salida = {}
    for factor in [0.7, 1.3]:
        wf = round(w * factor, 4)
        a, _ = correr(red, wf, [(azucar, HZ_AZUCAR)], circuito, f"×{factor} azúcar")
        b, _ = correr(red, wf, [(antena_ce, HZ_ANTENA)], circuito, f"×{factor} JO-C+E")
        c, _ = correr(red, wf, [(antena_f, HZ_ANTENA)], circuito, f"×{factor} JO-F")
        salida[str(factor)] = {
            "w_syn": wf, "MN9_L_azucar": hz(a, "MN9", "L"),
            "aBN1_L_JOCE": hz(b, "aBN1 (SAD093)", "L"),
            "aDN1_max_JOCE": max(hz(b, "aDN1 (DNg62)", l) for l in "LR"),
            "aDN2_max_JOCE": max(hz(b, "aDN2 (DNge078)", l) for l in "LR"),
            "aBN1_L_JOF": hz(c, "aBN1 (SAD093)", "L"),
            "limpieza_con_azucar_max": max(hz(a, g, l) for g in GRUPOS_LIMPIEZA for l in "LR"),
            "MN9_con_antena_max": max(hz(b, "MN9", l) for l in "LR"),
            "esparcido_azucar": a["esparcido"], "esparcido_antena": b["esparcido"]}
        print(f"   ×{factor}: {json.dumps({k: v for k, v in salida[str(factor)].items() if not k.startswith('esparcido')}, ensure_ascii=False)}")
    guardar("extra", salida)


if __name__ == "__main__":
    parte = sys.argv[1] if len(sys.argv) > 1 else ""
    if parte not in {"calibrar", "pruebas", "wip", "extra"}:
        sys.exit(__doc__)
    t0 = time.time()
    red, circuito = cargar()
    {"calibrar": calibrar, "pruebas": pruebas, "wip": wip, "extra": extra}[parte](red, circuito)
    print(f"({(time.time() - t0) / 60:.1f} min)")
