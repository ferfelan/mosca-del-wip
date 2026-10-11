"""Prepara la nube de puntos del cerebro + cordón nervioso para el juego.

Fuente: Male CNS connectome v1.0 (FlyEM / HHMI Janelia, Cambridge, MRC LMB,
Google Research) — https://male-cns.janelia.org — licencia CC BY 4.0.
Se usa sólo la tabla pública de anotaciones (no requiere cuenta ni token):
la posición real del cuerpo celular (soma) de cada neurona y su tipo.

Uso (una sola vez; el resultado queda guardado en public/cerebro/):
    uv venv .venv-datos --python 3.12
    uv pip install --python .venv-datos/bin/python pandas pyarrow numpy
    .venv-datos/bin/python scripts/datos/preparar_cerebro.py
"""

import json
import urllib.request
import zlib
from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parents[2]
CRUDOS = RAIZ / "datos-crudos"
SALIDA = RAIZ / "public" / "cerebro"
ARCHIVO = "body-annotations-male-cns-v1.0-minconf-0.5.feather"
URL = f"https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/{ARCHIVO}"
SEMILLA = 7

# Grupos que se encienden en el juego. "muestra" = cuántos puntos dibujar.
GRUPOS = [
    {"id": "vision", "nombre": "Visión", "detalle": "lóbulos ópticos", "muestra": 10500},
    {"id": "central", "nombre": "Cerebro central", "detalle": "integra y decide", "muestra": 5500},
    {"id": "memoria", "nombre": "Memoria", "detalle": "cuerpos fungiformes", "muestra": 2000},
    {"id": "mando", "nombre": "Mando", "detalle": "conecta cerebro y cuerpo", "muestra": 2500},
    {"id": "movimiento", "nombre": "Movimiento", "detalle": "cordón nervioso y motoras", "muestra": 4500},
]

VISION = {"ol_intrinsic", "visual_projection", "visual_centrifugal", "ol_sensory", "visual_projection_tbc"}
MANDO = {
    "descending_neuron", "descending_neuron_tbc", "ascending_neuron", "sensory_ascending",
    "sensory_ascending_tbc", "sensory_descending", "efferent_ascending", "efferent_descending",
}
MEMORIA_CLASES = {"Kenyon_Cell", "MBON", "DAN"}


def grupo_de(fila):
    sc = fila["superclass"]
    if not isinstance(sc, str):
        return None
    if sc in VISION:
        return "vision"
    if sc in MANDO:
        return "mando"
    if sc.startswith("vnc_") or sc == "cb_motor":
        return "movimiento"  # cordón nervioso + motoras de la trompa
    if fila["class"] in MEMORIA_CLASES:
        return "memoria"
    if sc.startswith("cb_") or sc == "ENS":
        return "central"
    return None


def main():
    CRUDOS.mkdir(exist_ok=True)
    origen = CRUDOS / ARCHIVO
    if not origen.exists():
        print("Descargando", URL)
        urllib.request.urlretrieve(URL, origen)

    df = pd.read_feather(origen)
    total_cuerpos = len(df)
    df = df[df["somaLocation"].notna()].copy()
    df["grupo"] = df.apply(grupo_de, axis=1)
    df = df[df["grupo"].notna()]
    xyz = np.stack(df["somaLocation"].to_numpy()).astype(np.float64) * 8 / 1000  # µm

    # Ejes de los datos: x = izquierda-derecha, y = dorsal(-)/ventral(+),
    # z = adelante(-)/atrás(+). Para dibujar: ancho = x, alto = -z (el cerebro
    # arriba y el cordón nervioso colgando abajo), profundidad = -y.
    centro = (xyz.min(axis=0) + xyz.max(axis=0)) / 2
    dib = np.stack([xyz[:, 0] - centro[0], -(xyz[:, 2] - centro[2]), -(xyz[:, 1] - centro[1])], axis=1)

    rng = np.random.default_rng(SEMILLA)
    elegidos = []
    for i, g in enumerate(GRUPOS):
        idx = np.flatnonzero(df["grupo"].to_numpy() == g["id"])
        g["real"] = int(len(idx))
        n = min(g["muestra"], len(idx))
        g["muestra"] = int(n)
        elegidos.append((i, rng.choice(idx, size=n, replace=False)))

    pos, grupo, tono = [], [], []
    tipos = df["type"].fillna(df["instance"]).fillna("").to_numpy()
    for i, idx in elegidos:
        pos.append(dib[idx])
        grupo.append(np.full(len(idx), i, dtype=np.uint8))
        # Mismo tipo de neurona = mismo matiz (como los colores por tipo de FlyWire)
        tono.append(np.array([zlib.crc32(str(t).encode()) % 256 for t in tipos[idx]], dtype=np.uint8))
    pos = np.concatenate(pos)
    grupo = np.concatenate(grupo)
    tono = np.concatenate(tono)

    # Mezclo el orden para que ningún grupo se dibuje siempre encima
    orden = rng.permutation(len(pos))
    pos, grupo, tono = pos[orden], grupo[orden], tono[orden]

    ESCALA = 2  # guardo medio micrómetro por unidad (enteros de 16 bits)
    q = np.round(pos * ESCALA).astype(np.int16)
    SALIDA.mkdir(parents=True, exist_ok=True)
    with open(SALIDA / "malecns-puntos.bin", "wb") as f:
        f.write(q.tobytes(order="C"))  # x,y,z intercalados
        f.write(grupo.tobytes())
        f.write(tono.tobytes())

    info = {
        "fuente": "Male CNS connectome v1.0 — FlyEM (HHMI Janelia), University of Cambridge, MRC LMB y Google Research",
        "url": "https://male-cns.janelia.org",
        "licencia": "CC BY 4.0",
        "tabla": ARCHIVO,
        "cuerpos_en_tabla": int(total_cuerpos),
        "neuronas_con_posicion": int(len(df)),
        "puntos": int(len(pos)),
        "escala": ESCALA,
        "unidad": "µm",
        "tamano_um": [round(float(v), 1) for v in (pos.max(axis=0) - pos.min(axis=0))],
        "grupos": GRUPOS,
    }
    (SALIDA / "malecns-info.json").write_text(json.dumps(info, ensure_ascii=False, indent=2))
    peso = (SALIDA / "malecns-puntos.bin").stat().st_size
    print(f"{len(pos)} puntos · {peso / 1024:.0f} KB · tamaño {info['tamano_um']} µm")
    for g in GRUPOS:
        print(f"  {g['nombre']:<16} {g['muestra']:>6} de {g['real']}")


if __name__ == "__main__":
    main()
