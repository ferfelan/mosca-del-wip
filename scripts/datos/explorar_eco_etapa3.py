"""Etapa 3.2 · Exploración del "eco" (NO cambia los resultados oficiales).

Con el peso calibrado (0,692 mV) la red entera se enciende con muy poco
estímulo. Estas tres revisiones sirven para explicarlo y para proponer
opciones a Felipe; las pruebas oficiales están en pruebas_etapa3.py.

  persiste  azúcar sólo los primeros 300 ms: ¿la actividad sigue sola?
  pesos     el cerebro con pesos bajo el eco (0,15 y 0,20 mV)
  kenyon    ¿el eco desaparece si las neuronas Kenyon no hablan?

Uso:
    .venv-datos/bin/python scripts/datos/explorar_eco_etapa3.py persiste
    .venv-datos/bin/python scripts/datos/explorar_eco_etapa3.py pesos
    .venv-datos/bin/python scripts/datos/explorar_eco_etapa3.py kenyon
Guarda en scripts/datos/exploracion_eco_etapa3_2.json.
"""

import json
import sys
from pathlib import Path

import numpy as np
from numba import njit, prange

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
import modelo_etapa3 as M  # noqa: E402
import pruebas_etapa3 as P  # noqa: E402

SALIDA = AQUI / "exploracion_eco_etapa3_2.json"
W_OFICIAL = 0.692
CLAVES = ["MN9", "aDN1 (DNg62)", "aDN2 (DNge078)", "aBN1 (SAD093)", "aBN2 (trío LB23)"]


@njit(cache=True)
def _con_corte(indptr, post, pesos, w_syn, estim, prob, n_pasos, pasos_estim, semilla,
               v0, v_rst, v_th, a_mbr, c_g, a_tau, pasos_rfc, pasos_dly, empujon, pasos_ventana):
    # Igual que modelo_etapa3._una_repeticion, pero el estímulo dura sólo
    # pasos_estim y se cuentan los disparos en ventanas de tiempo.
    n = len(indptr) - 1
    v = np.full(n, v0)
    g = np.zeros(n)
    libre = np.full(n, -1, dtype=np.int64)
    rfc = np.full(n, pasos_rfc, dtype=np.int64)
    for j in range(len(estim)):
        rfc[estim[j]] = 0
    ran = pasos_dly + 1
    disp = np.empty((ran, n), dtype=np.int32)
    nd = np.zeros(ran, dtype=np.int64)
    cuenta = np.zeros((n_pasos // pasos_ventana, n), dtype=np.int32)
    estado = np.empty(1, dtype=np.uint64)
    estado[0] = np.uint64(semilla) * np.uint64(0x9E3779B97F4A7C15) + np.uint64(0x2545F4914F6CDD1D)
    for _ in range(10):
        M._siguiente(estado)
    for k in range(n_pasos):
        r = k % ran
        m = 0
        for i in range(n):
            if k >= libre[i]:
                gi = g[i]
                if gi != 0.0 or v[i] != v0:
                    v[i] = v0 + (v[i] - v0) * a_mbr + gi * c_g
                    g[i] = gi * a_tau
                if v[i] > v_th:
                    disp[r, m] = i
                    m += 1
        nd[r] = m
        if k >= pasos_dly:
            s = (k - pasos_dly) % ran
            for j in range(nd[s]):
                p = disp[s, j]
                for e in range(indptr[p], indptr[p + 1]):
                    g[post[e]] += pesos[e] * w_syn
        if k < pasos_estim:
            for j in range(len(estim)):
                if M._siguiente(estado) < prob[j]:
                    v[estim[j]] += empujon
        for j in range(m):
            i = disp[r, j]
            v[i] = v_rst
            g[i] = 0.0
            libre[i] = k + rfc[i]
            cuenta[k // pasos_ventana, i] += 1
    return cuenta


@njit(parallel=True, cache=True)
def _varias_con_corte(indptr, post, pesos, w_syn, estim, prob, n_pasos, pasos_estim, semillas,
                      v0, v_rst, v_th, a_mbr, c_g, a_tau, pasos_rfc, pasos_dly, empujon, pasos_ventana):
    n = len(indptr) - 1
    out = np.zeros((len(semillas), n_pasos // pasos_ventana, n), dtype=np.int32)
    for r in prange(len(semillas)):
        out[r] = _con_corte(indptr, post, pesos, w_syn, estim, prob, n_pasos, pasos_estim, semillas[r],
                            v0, v_rst, v_th, a_mbr, c_g, a_tau, pasos_rfc, pasos_dly, empujon, pasos_ventana)
    return out


def persiste(red, c):
    p, dt = M.SHIU, M.SHIU["dt"]
    estim = M.indices(red, c["sensores"]["LB3b_R"])
    a_mbr, a_tau = np.exp(-dt / p["t_mbr"]), np.exp(-dt / p["tau"])
    c_g = p["tau"] / (p["tau"] - p["t_mbr"]) * (a_tau - a_mbr)
    out = _varias_con_corte(red["indptr"], red["post"], red["pesos"], W_OFICIAL, estim,
                            np.full(len(estim), 100.0 * dt / 1000.0), 10000, 3000,
                            np.arange(M.SEMILLA, M.SEMILLA + 10), p["v0"], p["v_rst"], p["v_th"],
                            a_mbr, c_g, a_tau, 22, 18, W_OFICIAL * p["f_poi"], 1000)
    hz = out.mean(axis=0) * 10.0
    mn9 = M.indices(red, c["medir"]["MN9"]["L"])[0]
    filas = [{"ventana_ms": f"{b * 100}-{b * 100 + 100}", "neuronas_sobre_10hz": int((hz[b] > 10).sum()),
              "kenyon_sobre_10hz": int((hz[b, red["kc"]] > 10).sum()), "MN9_L": round(float(hz[b, mn9]), 1)}
             for b in range(hz.shape[0])]
    print(f"w_syn {W_OFICIAL}, azúcar der. a 100 Hz sólo los primeros 300 ms (10 repeticiones):")
    for f in filas:
        print(f"   {f['ventana_ms']:>8} ms: {f['neuronas_sobre_10hz']:6d} encendidas · Kenyon {f['kenyon_sobre_10hz']} · MN9 izq {f['MN9_L']} Hz")
    return filas


def pesos(red, c):
    S = c["sensores"]
    est = {"azúcar der 100 Hz": [(M.indices(red, S["LB3b_R"]), 100.0)],
           "JO-C+E izq 140 Hz": [(M.indices(red, S["JO-C_L"] + S["JO-E_L"]), 140.0)],
           "JO-F izq 140 Hz": [(M.indices(red, S["JO-F_L"]), 140.0)]}
    todo = M.indices(red, S["JO-C_L"] + S["JO-E_L"] + S["JO-F_L"])
    for hz in [20.0, 120.0, 220.0]:
        est[f"antena izq {hz:.0f} Hz"] = [(todo, hz)]
    salida = {}
    for w in [0.15, 0.20]:
        print(f"w_syn {w} (izquierda/derecha, Hz):")
        salida[str(w)] = {}
        for nombre, e in est.items():
            d, _ = P.correr(red, w, e, c, nombre)
            g = d["grupos"]
            print("      " + " | ".join(f"{k.split()[0]} {g[k]['L']['hz']:.1f}/{g[k]['R']['hz']:.1f}" for k in CLAVES))
            salida[str(w)][nombre] = {"grupos": {k: g[k] for k in CLAVES}, "esparcido": d["esparcido"]}
    return salida


def kenyon(red, c):
    kc, pre, post = red["kc"], red["pre"], red["post"]
    S = c["sensores"]
    est = {"azúcar der 100 Hz": [(M.indices(red, S["LB3b_R"]), 100.0)],
           "JO-C+E izq 140 Hz": [(M.indices(red, S["JO-C_L"] + S["JO-E_L"]), 140.0)]}
    salida = {}
    for nombre, mascara in [("sin Kenyon→Kenyon", kc[pre] & kc[post]), ("sin ninguna salida de las Kenyon", kc[pre])]:
        r2 = {**red, "pesos": np.where(mascara, 0.0, red["pesos"]).astype(np.float32)}
        salida[nombre] = {}
        for en, e in est.items():
            d, _ = P.correr(red, W_OFICIAL, e, c, f"{nombre} · {en}", red_usada=r2)
            salida[nombre][en] = {"grupos": {k: d["grupos"][k] for k in CLAVES}, "esparcido": d["esparcido"]}
    return salida


if __name__ == "__main__":
    parte = sys.argv[1] if len(sys.argv) > 1 else ""
    if parte not in {"persiste", "pesos", "kenyon"}:
        sys.exit(__doc__)
    red, c = P.cargar()
    resultado = {"persiste": persiste, "pesos": pesos, "kenyon": kenyon}[parte](red, c)
    todo = json.loads(SALIDA.read_text()) if SALIDA.exists() else {}
    todo[parte] = resultado
    SALIDA.write_text(json.dumps(todo, indent=1, ensure_ascii=False) + "\n")
