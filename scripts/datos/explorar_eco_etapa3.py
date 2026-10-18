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

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
import modelo_etapa3 as M  # noqa: E402
import pruebas_etapa3 as P  # noqa: E402

SALIDA = AQUI / "exploracion_eco_etapa3_2.json"
W_OFICIAL = 0.692
CLAVES = ["MN9", "aDN1 (DNg62)", "aDN2 (DNge078)", "aBN1 (SAD093)", "aBN2 (trío LB23)"]


def persiste(red, c):
    estim = M.indices(red, c["sensores"]["LB3b_R"])
    out = M.simular_con_corte(red, W_OFICIAL, [(estim, 100.0)], ms_estimulo=300.0, n_rep=10)
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
