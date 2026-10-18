"""Etapa 3.2 · Terminar la verificación de la 3.1 mirando las conexiones.

Fuente: Male CNS connectome v1.0 (CC BY 4.0), archivos en datos-crudos/:
conexiones traced-only (508 MB), neurotransmisores (43 MB) y anotaciones.
Nada de FlyWire.

Qué revisa (pedido de Felipe, 2026-10-18):
1. Qué tan completas están las neuronas clave (columna statusLabel) y
   cuántas sinapsis tienen en el archivo.
2. aBN1 por sus conexiones: intrínseca del cerebro, 1 por lado, recibe de
   JO-C/E y le habla a aDN1 (DNg62) y/o aDN2 (DNge078). Plan B: las 5 que
   más señal reciben de la antena.
3. GNG380 como aBN2: ¿recibe de la antena y de aBN1? Y quién sí calza en
   la familia LB23.
4. aDN2 → aDN1 directo.
5. El camino del azúcar LB3b → … → MN9, tal como salga (sin forzarlo).
6. Si hay una versión más nueva de MaleCNS (pregunta al servidor).

Deja los grupos de neuronas para las pruebas en
scripts/datos/circuito_etapa3_2.json.

Uso:
    .venv-datos/bin/python scripts/datos/conexiones_etapa3.py
"""

import json
import re
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
CRUDOS = RAIZ / "datos-crudos"
CANDIDATAS = AQUI / "candidatas_etapa3.json"
SALIDA = AQUI / "circuito_etapa3_2.json"
FRENAN = {"gaba", "glutamate", "histamine"}


def main():
    W = pd.read_feather(CRUDOS / "connectome-weights-male-cns-v1.0-minconf-0.5-traced-only.feather",
                        columns=["body_pre", "body_post", "weight"])
    NT = pd.read_feather(CRUDOS / "body-neurotransmitters-male-cns-v1.0.feather").set_index("body")
    A = pd.read_feather(CRUDOS / "body-annotations-male-cns-v1.0-minconf-0.5.feather").set_index("bodyId")
    C = json.loads(CANDIDATAS.read_text())
    tipo = A["type"]
    lado = A["somaSide"].fillna(A["rootSide"])
    entrada = W.groupby("body_post").weight.sum()
    salida = W.groupby("body_pre").weight.sum()
    cuenta = A.groupby("type").somaSide.value_counts().unstack(fill_value=0)

    def de(pre, post):
        return int(W[W.body_pre.isin(pre) & W.body_post.isin(post)].weight.sum())

    def ids_tipo(t, l=None):
        m = tipo == t
        if l:
            m &= lado == l
        return [int(b) for b in A.index[m]]

    def n_lr(t):
        if not isinstance(t, str) or t not in cuenta.index:
            return "?"
        return f"{cuenta.loc[t].get('L', 0)}/{cuenta.loc[t].get('R', 0)}"

    JO = {f"{g}_{l}": C[g][l] for g in ["JO-C", "JO-E", "JO-F"] for l in "LR"}
    JOCE = sum([JO[f"{g}_{l}"] for g in ["JO-C", "JO-E"] for l in "LR"], [])
    JOF = JO["JO-F_L"] + JO["JO-F_R"]
    aDN = ids_tipo("DNg62") + ids_tipo("DNge078")
    informe = {}

    print("1) Qué tan completas están (statusLabel) y cuántas sinapsis tienen")
    fichas = []
    for t in ["MN9", "DNg62", "DNge078", "SAD093", "GNG380", "AN13B002", "LB3b"]:
        for b in ids_tipo(t):
            fichas.append({"tipo": t, "bodyId": b, "lado": lado[b], "estado": A.loc[b, "statusLabel"],
                           "sinapsis_entrada": int(entrada.get(b, 0)), "sinapsis_salida": int(salida.get(b, 0))})
    f = pd.DataFrame(fichas)
    print(f.to_string(index=False))
    for g, ids in JO.items():
        print(f"   {g}: {len(ids)} | estado {A.loc[ids, 'statusLabel'].astype(str).value_counts().to_dict()} | "
              f"sinapsis de salida {int(salida.reindex(ids).fillna(0).sum())}")
    informe["fichas"] = fichas

    print("\n2) aBN1 por conexiones (intrínseca del cerebro, ≥30 sinapsis de JO-C/E, ≥20 hacia aDN1/aDN2)")
    cb = A.index[A.superclass == "cb_intrinsic"]
    t = pd.DataFrame(index=cb)
    t["de_JOCE"] = W[W.body_pre.isin(JOCE)].groupby("body_post").weight.sum().reindex(cb).fillna(0).astype(int)
    t["de_JOF"] = W[W.body_pre.isin(JOF)].groupby("body_post").weight.sum().reindex(cb).fillna(0).astype(int)
    t["a_aDN"] = W[W.body_post.isin(aDN)].groupby("body_pre").weight.sum().reindex(cb).fillna(0).astype(int)
    t = t[(t.de_JOCE >= 30) & (t.a_aDN >= 20)].copy()
    t["tipo"] = tipo.reindex(t.index)
    t["lado"] = lado.reindex(t.index)
    t["NT"] = NT.consensus_nt.reindex(t.index)
    t["n_L/R"] = [n_lr(x) for x in t.tipo]
    print(t.sort_values("de_JOCE", ascending=False).to_string())
    sad = {l: ids_tipo("SAD093", l) for l in "LR"}
    for l in "LR":
        b = sad[l][0]
        jo = W[W.body_pre.isin(JO[f"JO-C_{l}"] + JO[f"JO-E_{l}"] + JO[f"JO-F_{l}"])].groupby("body_post").weight.sum()
        jo = jo[~jo.index.isin(A.index[tipo.fillna("").str.startswith("JO")])]
        puesto = int(jo.rank(ascending=False, method="min")[b])
        print(f"   SAD093_{l}: recibe {int(jo[b])} sinapsis de la antena de su lado "
              f"({jo[b] / entrada[b]:.0%} de su entrada) → puesto {puesto} de {len(jo)}; "
              f"a DNg62 {de([b], ids_tipo('DNg62'))}, a DNge078 {de([b], ids_tipo('DNge078'))}")
    informe["aBN1"] = {"tipo": "SAD093", "ids": sad,
                       "candidatas": t.reset_index().rename(columns={"index": "bodyId"}).to_dict("records")}

    print("\n   Plan B: las 5 que más señal reciben de la antena (sin contar otros sensores JO)")
    planB = {}
    for l in "LR":
        jo = W[W.body_pre.isin(JO[f"JO-C_{l}"] + JO[f"JO-E_{l}"] + JO[f"JO-F_{l}"])].groupby("body_post").weight.sum()
        jo = jo[~jo.index.isin(A.index[tipo.fillna("").str.startswith("JO")])].sort_values(ascending=False).head(5)
        planB[l] = [int(b) for b in jo.index]
        print(f"   {l}: " + ", ".join(f"{tipo[b]}_{lado[b]} ({int(w)})" for b, w in jo.items()))
    informe["planB_top5"] = planB

    print("\n3) GNG380 como aBN2")
    g380 = {l: ids_tipo("GNG380", l) for l in "LR"}
    todos_sad = sad["L"] + sad["R"]
    for l in "LR":
        for b in g380[l]:
            print(f"   GNG380_{l} {b}: de JO-C/E {de(JOCE, [b])}, de JO-F {de(JOF, [b])}, de SAD093 {de(todos_sad, [b])}, "
                  f"a aDN {de([b], aDN)} (entrada total {int(entrada[b])})")
    lb = A.index[(A.itoleeHl == "LB23") | (A.trumanHl == "23B")]
    u = pd.DataFrame(index=lb)
    u["de_SAD093"] = W[W.body_pre.isin(todos_sad)].groupby("body_post").weight.sum().reindex(lb).fillna(0).astype(int)
    u["de_JOF"] = W[W.body_pre.isin(JOF)].groupby("body_post").weight.sum().reindex(lb).fillna(0).astype(int)
    u["de_JOCE"] = W[W.body_pre.isin(JOCE)].groupby("body_post").weight.sum().reindex(lb).fillna(0).astype(int)
    u["a_DNg62"] = W[W.body_post.isin(ids_tipo("DNg62"))].groupby("body_pre").weight.sum().reindex(lb).fillna(0).astype(int)
    u["a_DNge078"] = W[W.body_post.isin(ids_tipo("DNge078"))].groupby("body_pre").weight.sum().reindex(lb).fillna(0).astype(int)
    u["tipo"] = tipo.reindex(lb).fillna("(sin nombre)")
    u["FlyWire"] = A.flywireType.reindex(lb)
    u["lado"] = lado.reindex(lb)
    calzan = u[(u.de_SAD093 >= 20) & ((u.a_DNg62 + u.a_DNge078) >= 40)]
    print(f"   En LB23 ({len(lb)} neuronas), las que reciben ≥20 de SAD093 y le dan ≥40 a aDN1/aDN2:")
    print(calzan.sort_values(["lado", "de_SAD093"], ascending=[True, False]).to_string())
    # El trío: las de los mismos 2 tipos de FlyWire en ambos lados (2 hablan a aDN1, 1 a aDN2).
    # GNG611 calza sólo a la derecha (la izquierda recibe 11 de SAD093): queda fuera.
    trio = calzan[calzan.FlyWire.isin(["CB1740,CB1779", "CB2014,CB2039"])]
    aBN2 = {l: [int(b) for b in trio.index[trio.lado == l]] for l in "LR"}
    print(f"   Trío (mismos tipos de FlyWire en ambos lados): izq {aBN2['L']} · der {aBN2['R']}")
    informe["aBN2_trio_LB23"] = {"ids": aBN2, "tabla": trio.reset_index().rename(columns={"index": "bodyId"}).to_dict("records")}

    print("\n4) aDN2 → aDN1 directo")
    for l in "LR":
        for m in "LR":
            w = de(ids_tipo("DNge078", l), ids_tipo("DNg62", m))
            if w:
                print(f"   DNge078_{l} → DNg62_{m}: {w} sinapsis")
    informe["aDN2_a_aDN1"] = {f"{l}->{m}": de(ids_tipo("DNge078", l), ids_tipo("DNg62", m)) for l in "LR" for m in "LR"}

    print("\n5) Camino del azúcar LB3b → … → MN9 (fuerza = producto de 'qué parte de la entrada de cada una viene de la anterior')")

    def nombre(b):
        syn = A.loc[b, "synonyms"] if isinstance(A.loc[b, "synonyms"], str) else ""
        m = re.search(r"Shiu 2022: ([^;]+)", syn)
        nt = NT.consensus_nt.get(b, "?")
        return f"{tipo.get(b)}{'(' + m.group(1).strip() + ')' if m else ''}_{lado.get(b)}[{'−' if nt in FRENAN else '+'}]"

    caminos = {}
    for origen, mn in [("R", "L"), ("R", "R"), ("L", "L")]:
        src = C["LB3b"][origen]
        dst = ids_tipo("MN9", mn)[0]
        a = W[W.body_pre.isin(src)].groupby("body_post").weight.sum()
        y = W[W.body_post == dst].set_index("body_pre").weight
        xy = W[W.body_pre.isin(a.index) & W.body_post.isin(y.index)].copy()
        xy["fuerza"] = (a.reindex(xy.body_pre).to_numpy() / entrada.reindex(xy.body_pre).to_numpy()
                        * xy.weight.to_numpy() / entrada.reindex(xy.body_post).to_numpy()
                        * y.reindex(xy.body_post).to_numpy() / entrada[dst])
        top = xy.sort_values("fuerza", ascending=False).head(6)
        filas = [{"camino": f"LB3b_{origen} → {nombre(p)} → {nombre(q)} → MN9_{mn}",
                  "sinapsis": [int(a[p]), int(w), int(y[q])], "fuerza": float(fz)}
                 for p, q, w, fz in zip(top.body_pre, top.body_post, top.weight, top.fuerza)]
        directo = de(src, [dst])
        print(f"   LB3b_{origen} → MN9_{mn}: directo {directo} sinapsis; caminos de 3 pasos más fuertes:")
        for c in filas:
            print(f"      {c['camino']}  sinapsis {c['sinapsis']}")
        caminos[f"LB3b_{origen}->MN9_{mn}"] = {"directo": directo, "top": filas}
    dand = ids_tipo("AN13B002")
    print(f"   Dandelion (AN13B002, frena): recibe {de(C['LB3b']['R'], dand)} de LB3b_R y {de(C['LB3b']['L'], dand)} "
          f"de LB3b_L; le da {de(dand, ids_tipo('MN9'))} a MN9")
    informe["caminos_azucar"] = caminos

    print("\n6) ¿Hay una versión más nueva de MaleCNS?")
    try:
        with urllib.request.urlopen("https://storage.googleapis.com/storage/v1/b/flyem-male-cns/o?delimiter=/&fields=prefixes", timeout=20) as r:
            versiones = sorted(p for p in json.load(r)["prefixes"] if re.match(r"v\d", p))
        with urllib.request.urlopen("https://male-cns.janelia.org/release/", timeout=20) as r:
            texto = re.sub(r"<[^>]+>", " ", r.read().decode("utf-8", "replace"))
        notas = re.findall(r"v\d+\.\d+ \([A-Z][a-z]+ \d+, \d{4}\)", re.sub(r"\s+", " ", texto))
        print(f"   carpetas en el servidor: {versiones} | notas de versión: {notas}")
        informe["versiones"] = {"carpetas": versiones, "notas": notas}
    except Exception as e:  # sin internet: lo demás sigue sirviendo
        print(f"   no se pudo consultar ({e})")

    circuito = {
        # LB3c se sumó en la 3.2b (Tastekin: LB3b y LB3c coinciden con Gr64f, dulce)
        "sensores": {"LB3b_R": C["LB3b"]["R"], "LB3b_L": C["LB3b"]["L"],
                     "LB3c_R": ids_tipo("LB3c", "R"), "LB3c_L": ids_tipo("LB3c", "L"), **JO},
        "medir": {
            "MN9": {l: ids_tipo("MN9", l) for l in "LR"},
            "aDN1 (DNg62)": {l: ids_tipo("DNg62", l) for l in "LR"},
            "aDN2 (DNge078)": {l: ids_tipo("DNge078", l) for l in "LR"},
            "aBN1 (SAD093)": sad,
            "aBN2 (trío LB23)": aBN2,
            "GNG380": g380,
            "plan B: 5 que más reciben de la antena": planB,
            "Dandelion (AN13B002)": {l: ids_tipo("AN13B002", l) for l in "LR"},
            "DNge062": {l: ids_tipo("DNge062", l) for l in "LR"},
            "Roundup (GNG108)": {l: ids_tipo("GNG108", l) for l in "LR"},
            "Roundtree (GNG120)": {l: ids_tipo("GNG120", l) for l in "LR"},
            "ANXXX462b": {l: ids_tipo("ANXXX462b", l) for l in "LR"},
            "Clavicle (ANXXX462a)": {l: ids_tipo("ANXXX462a", l) for l in "LR"},
            "FMIn (GNG197)": {l: ids_tipo("GNG197", l) for l in "LR"},
            "Fdg (GNG588)": {l: ids_tipo("GNG588", l) for l in "LR"},
        },
        "informe_conexiones": informe,
    }
    SALIDA.write_text(json.dumps(circuito, indent=1, ensure_ascii=False, default=lambda o: o.item() if hasattr(o, "item") else str(o)) + "\n")
    print(f"\nGrupos guardados en {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
