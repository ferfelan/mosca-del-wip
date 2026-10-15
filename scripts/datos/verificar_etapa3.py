"""Etapa 3.1 · Verificar sin descargar: qué neuronas del plan existen en MaleCNS.

Fuente: Male CNS connectome v1.0 (FlyEM / HHMI Janelia, Cambridge, MRC LMB,
Google Research) — https://male-cns.janelia.org — licencia CC BY 4.0.
Usa SÓLO la tabla de anotaciones que ya está en datos-crudos/ (14 MB). No baja
las conexiones: del servidor sólo pregunta tamaños y huellas (md5) de los
archivos que se bajarían en la Etapa 3.2.

Revisa los 7 puntos que pidió Felipe (plan: sección 5 de
docs/investigacion-etapa3.md) y guarda los bodyId de las candidatas en
scripts/datos/candidatas_etapa3.json para usarlos en la 3.2.

Uso:
    .venv-datos/bin/python scripts/datos/verificar_etapa3.py
"""

import base64
import hashlib
import json
import urllib.request
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[2]
CRUDOS = RAIZ / "datos-crudos"
ANOTACIONES = CRUDOS / "body-annotations-male-cns-v1.0-minconf-0.5.feather"
SALIDA = Path(__file__).resolve().parent / "candidatas_etapa3.json"
LISTADO = (
    "https://storage.googleapis.com/storage/v1/b/flyem-male-cns/o"
    "?prefix=v1.0/connectome-data/flat-connectome/&fields=items(name,size,md5Hash)"
)
# Lo que se bajaría en la 3.2 (y el completo, sólo para comparar tamaños)
A_BAJAR = [
    "connectome-weights-male-cns-v1.0-minconf-0.5-traced-only.feather",
    "body-neurotransmitters-male-cns-v1.0.feather",
]
COMPLETO = "connectome-weights-male-cns-v1.0-minconf-0.5.feather"


def lados(d, col="somaSide"):
    c = d[col].fillna("?").value_counts()
    return f"{c.get('L', 0)} izq / {c.get('R', 0)} der" + (f" / {c['?']} sin lado" if "?" in c else "")


def ids(d):
    return {lado: sorted(int(b) for b in g["bodyId"]) for lado, g in d.groupby(d["_lado"])}


def main():
    df = pd.read_feather(ANOTACIONES)
    # Lado: el del soma; los sensores no tienen soma en el sistema nervioso, usan el de la raíz
    df["_lado"] = df["somaSide"].fillna(df["rootSide"]).fillna("?")
    tipo = df["type"].fillna("")
    candidatas = {}

    print("1) Sensores de la antena (órgano de Johnston)")
    for g in ["C", "E", "F"]:
        d = df[tipo.str.startswith(f"JO-{g}")]
        etiquetas = d["subclass"].fillna("sin etiqueta").value_counts().to_dict()
        print(f"   JO-{g}: {len(d)} ({lados(d, '_lado')})  etiquetas: {etiquetas}")
        candidatas[f"JO-{g}"] = ids(d)
    sin = df[tipo == "JO-unclear"]
    print(f"   JO sin clasificar: {len(sin)} ({lados(sin, '_lado')})")

    print("2) aBN2: hemilinaje LB23")
    lb23 = df[df["itoleeHl"].fillna("") == "LB23"]
    print(f"   {len(lb23)} neuronas en LB23; tipos con 3 por lado:")
    for t, d in lb23.groupby("type"):
        c = d["_lado"].value_counts()
        if c.get("L", 0) == 3 and c.get("R", 0) == 3:
            print(f"   {t}: {lados(d)}  (FlyWire: {d['flywireType'].iloc[0]})")
            candidatas[f"aBN2? {t}"] = ids(d)

    print("3) aDN1 y aDN2")
    for t in ["DNg62", "DNge078"]:
        d = df[tipo == t]
        print(f"   {t}: {lados(d)}  sinónimo: {d['synonyms'].iloc[0]}  subclase: {d['subclass'].iloc[0]}")
        candidatas[t] = ids(d)

    print("4) aBN1 por sinónimo")
    m = pd.Series(False, index=df.index)
    for c in df.columns:
        if df[c].dtype == object or str(df[c].dtype).startswith("str"):
            m |= df[c].astype(str).str.contains("aBN", regex=False)
    print(f"   filas con 'aBN': {int(m.sum())}")

    print("5) MN9")
    d = df[tipo == "MN9"]
    print(f"   MN9: {lados(d)}  nervio de salida: {d['exitNerve'].iloc[0]}")
    candidatas["MN9"] = ids(d)

    print("6) Azúcar")
    for t in ["LB3b", "AN13B002", "LgLG3"]:
        d = df[tipo == t]
        print(f"   {t}: {len(d)} ({lados(d, '_lado')})  sinónimo: {d['synonyms'].dropna().unique().tolist()}")
        candidatas[t] = ids(d)
    shiu = df[df["synonyms"].fillna("").str.contains("Shiu 2022")]
    print(f"   neuronas del circuito de comer con nombre de Shiu 2022: {shiu['synonyms'].nunique()} tipos")

    print("7) Licencia y tamaños (sin bajar)")
    local = hashlib.md5(ANOTACIONES.read_bytes()).hexdigest()
    try:
        with urllib.request.urlopen(LISTADO, timeout=20) as r:
            items = {i["name"].split("/")[-1]: i for i in json.load(r)["items"]}
        for nombre in A_BAJAR + [COMPLETO, ANOTACIONES.name]:
            i = items[nombre]
            md5 = base64.b64decode(i["md5Hash"]).hex()
            extra = ""
            if nombre == ANOTACIONES.name:
                extra = "  (igual a la nuestra)" if md5 == local else "  (OJO: la nuestra es distinta)"
            print(f"   {int(i['size']) / 1e6:8.1f} MB  {nombre}  md5 {md5}{extra}")
    except Exception as e:  # sin internet: lo demás sigue sirviendo
        print(f"   no se pudo consultar el servidor ({e})")

    no_traced = {k: v for k, v in candidatas.items() for b in sum(v.values(), [])
                 if df.loc[df["bodyId"] == b, "status"].iloc[0] != "Traced"}
    print("   todas las candidatas están 'Traced':", "sí" if not no_traced else f"NO: {list(no_traced)}")

    SALIDA.write_text(json.dumps(candidatas, indent=1, ensure_ascii=False) + "\n")
    print(f"Candidatas guardadas en {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
