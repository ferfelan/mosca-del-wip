"""Etapa 3.3 · La actividad simulada REAL para el panel del cerebro (opción A).

Opción A (elegida por Felipe): el cerebro muestra, el juego decide. Las reglas
del juego (src/brain.js) no cambian; el panel muestra lo que dispara cada
neurona en la simulación del cableado real (MaleCNS v1.0, CC BY 4.0) con el
peso elegido en la 3.2b (0,090 mV). Nada de FlyWire.

Situaciones que se precalculan (30 repeticiones de 1 s, semilla fija):
- antena_n (n = 0 a 10 tareas abiertas): antena izquierda (JO-C + JO-E +
  JO-F) a 20 + (n − 1) × 200/9 Hz, la regla de siempre (n = 0: sin estímulo).
- cafe_n: lo mismo + el azúcar (LB3b + LB3c derecha) a 100 Hz.

Puntos que se dibujan:
- los mismos 25.000 de siempre (public/cerebro/malecns-puntos.bin, no cambia;
  lo usa también la portada holograma);
- más public/cerebro/puntos-extra.bin: las neuronas del circuito y todas las
  que disparan algo en alguna situación. Los sensores no tienen su cuerpo
  dentro del sistema nervioso: se dibujan en el centro de su esqueleto
  (archivos SWC de MaleCNS, ~10 KB cada uno, en datos-crudos/esqueletos/).

Deja en public/cerebro/: puntos-extra.bin, actividad-real.bin y
actividad-real.json. El juego sólo los lee.

Uso:
    .venv-datos/bin/python scripts/datos/preparar_cerebro_real.py simular   # ~5 min
    .venv-datos/bin/python scripts/datos/preparar_cerebro_real.py armar     # segundos (baja esqueletos la 1.ª vez)
"""

import json
import sys
import time
import urllib.request
import zlib
from pathlib import Path

import numpy as np
import pandas as pd

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
import modelo_etapa3 as M  # noqa: E402
import preparar_cerebro as PC  # noqa: E402
import pruebas_etapa3 as P  # noqa: E402

RAIZ = AQUI.parents[1]
CRUDOS = RAIZ / "datos-crudos"
PUBLICO = RAIZ / "public" / "cerebro"
SIMULADO = CRUDOS / "actividad-etapa3-3.npz"
ESQUELETOS = CRUDOS / "esqueletos"
URL_SWC = "https://storage.googleapis.com/flyem-male-cns/v1.0/segmentation/skeletons-malecns/skeletons-swc"

W = 0.090                 # el peso elegido en la 3.2b (no se cambia)
HZ_AZUCAR = 100.0         # el café: azúcar a 100 Hz (como la prueba 1)
HZ_TOPE = 300.0           # brillo = log(1 + Hz) / log(1 + 300), máximo 1
ESCALA = 2                # igual que malecns-puntos.bin (medio µm por unidad)
CONDICIONES = [f"antena_{n}" for n in range(11)] + [f"cafe_{n}" for n in range(11)]
# Papel de cada punto en el circuito (0 = ninguno)
ROLES = ["", "sensor de la antena", "aBN1 (SAD093)", "aBN2 (trío LB23)", "aDN1 (DNg62)", "aDN2 (DNge078)",
         "sensor de azúcar", "camino del azúcar", "MN9 (trompita)"]
CAMINO_AZUCAR = ["ANXXX462b", "Clavicle (ANXXX462a)", "FMIn (GNG197)", "Dandelion (AN13B002)", "DNge062",
                 "Roundup (GNG108)", "Roundtree (GNG120)", "Fdg (GNG588)"]


def simular():
    red, c = P.cargar()
    S = c["sensores"]
    antena = M.indices(red, S["JO-C_L"] + S["JO-E_L"] + S["JO-F_L"])
    azucar = M.indices(red, S["LB3b_R"] + S["LB3c_R"])
    n = len(red["ids"])
    tasas = np.zeros((len(CONDICIONES), n), dtype=np.float32)
    for k, nombre in enumerate(CONDICIONES):
        tipo, cuantas = nombre.split("_")
        cuantas = int(cuantas)
        est = [(antena, P.hz_por_wip(cuantas))] if cuantas > 0 else []
        if tipo == "cafe":
            est.append((azucar, HZ_AZUCAR))
        t0 = time.time()
        tasas[k] = M.simular(red, W, est).mean(axis=0) if est else 0.0
        print(f"   {nombre:9s}: {int((tasas[k] > 0).sum()):5d} neuronas con algo · "
              f"{int((tasas[k] > 10).sum()):5d} sobre 10 Hz ({time.time() - t0:.0f} s)")
    np.savez_compressed(SIMULADO, ids=red["ids"], tasas=tasas, condiciones=np.array(CONDICIONES))
    print(f"Guardado en {SIMULADO.relative_to(RAIZ)}")


def puntos_base(anot):
    """Repite la selección de preparar_cerebro.py para saber qué neurona es cada punto."""
    df = anot[anot["somaLocation"].notna()].copy()
    df["grupo"] = df.apply(PC.grupo_de, axis=1)
    df = df[df["grupo"].notna()]
    xyz = np.stack(df["somaLocation"].to_numpy()).astype(np.float64) * 8 / 1000
    centro = (xyz.min(axis=0) + xyz.max(axis=0)) / 2
    dib = np.stack([xyz[:, 0] - centro[0], -(xyz[:, 2] - centro[2]), -(xyz[:, 1] - centro[1])], axis=1)
    rng = np.random.default_rng(PC.SEMILLA)
    grupos = [dict(g) for g in PC.GRUPOS]
    elegidos = []
    for i, g in enumerate(grupos):
        idx = np.flatnonzero(df["grupo"].to_numpy() == g["id"])
        elegidos.append((i, rng.choice(idx, size=min(g["muestra"], len(idx)), replace=False)))
    tipos = df["type"].fillna(df["instance"]).fillna("").to_numpy()
    pos, grupo, tono, cuerpo = [], [], [], []
    for i, idx in elegidos:
        pos.append(dib[idx])
        grupo.append(np.full(len(idx), i, dtype=np.uint8))
        tono.append(np.array([zlib.crc32(str(t).encode()) % 256 for t in tipos[idx]], dtype=np.uint8))
        cuerpo.append(df["bodyId"].to_numpy()[idx])
    pos, grupo, tono, cuerpo = map(np.concatenate, (pos, grupo, tono, cuerpo))
    orden = rng.permutation(len(pos))
    pos, grupo, tono, cuerpo = pos[orden], grupo[orden], tono[orden], cuerpo[orden]
    q = np.round(pos * ESCALA).astype(np.int16)
    binario = q.tobytes(order="C") + grupo.tobytes() + tono.tobytes()
    if binario != (PUBLICO / "malecns-puntos.bin").read_bytes():
        raise SystemExit("La selección repetida NO coincide con malecns-puntos.bin: revisar antes de seguir")
    return cuerpo, centro, [g["id"] for g in grupos]


def centro_esqueleto(body):
    ESQUELETOS.mkdir(parents=True, exist_ok=True)
    archivo = ESQUELETOS / f"{body}.swc"
    if not archivo.exists():
        with urllib.request.urlopen(f"{URL_SWC}/{body}.swc", timeout=30) as r:
            archivo.write_bytes(r.read())
    nodos = np.loadtxt(archivo, comments="#", usecols=(2, 3, 4), ndmin=2)
    return nodos.mean(axis=0)  # vóxeles de 8 nm, como somaLocation


def armar():
    d = np.load(SIMULADO)
    ids, tasas = d["ids"], d["tasas"]
    anot = pd.read_feather(M.ANOTACIONES)
    anot_id = anot.set_index("bodyId")
    c = json.loads((AQUI / "circuito_etapa3_2.json").read_text())
    S, Med = c["sensores"], c["medir"]

    base, centro, zonas = puntos_base(anot)
    print(f"Los 25.000 puntos de siempre: selección repetida idéntica ✅")

    # Papel en el circuito de cada neurona (bodyId → rol)
    rol = {}
    for b in S["JO-C_L"] + S["JO-E_L"] + S["JO-F_L"]:
        rol[b] = 1
    for k, r in [("aBN1 (SAD093)", 2), ("aBN2 (trío LB23)", 3), ("aDN1 (DNg62)", 4), ("aDN2 (DNge078)", 5)]:
        for b in Med[k]["L"] + Med[k]["R"]:
            rol[b] = r
    for b in S["LB3b_R"] + S["LB3c_R"]:
        rol[b] = 6
    for k in CAMINO_AZUCAR:
        for b in Med[k]["L"] + Med[k]["R"]:
            rol[b] = 7
    for b in Med["MN9"]["L"] + Med["MN9"]["R"]:
        rol[b] = 8

    # Extra: circuito + todas las que disparan algo, que no estén ya dibujadas
    activa = (tasas > 0).any(axis=0)
    en_base = set(int(b) for b in base)
    extra = [int(b) for b in ids[activa] if int(b) not in en_base]
    extra += [b for b in rol if b not in en_base and b not in set(extra)]
    pos, grupo, tono, sin_soma = [], [], [], 0
    zona_de = {z: i for i, z in enumerate(zonas)}
    for b in extra:
        fila = anot_id.loc[b]
        if isinstance(fila["somaLocation"], (list, np.ndarray)):
            xyz = np.asarray(fila["somaLocation"], dtype=np.float64)
        else:
            xyz = centro_esqueleto(b)
            sin_soma += 1
        xyz = xyz * 8 / 1000
        pos.append([xyz[0] - centro[0], -(xyz[2] - centro[2]), -(xyz[1] - centro[1])])
        z = PC.grupo_de(fila)
        grupo.append(zona_de[z] if z else zona_de["central"])
        t = fila["type"] if isinstance(fila["type"], str) else (fila["instance"] if isinstance(fila["instance"], str) else "")
        tono.append(zlib.crc32(str(t).encode()) % 256)
    q = np.round(np.asarray(pos) * ESCALA).astype(np.int16)
    (PUBLICO / "puntos-extra.bin").write_bytes(q.tobytes(order="C") + np.asarray(grupo, np.uint8).tobytes()
                                              + np.asarray(tono, np.uint8).tobytes())
    print(f"Puntos extra: {len(extra)} ({sin_soma} sin cuerpo en el sistema nervioso, dibujados en el centro de su esqueleto)")

    # Actividad de cada punto dibujado en cada situación (brillo de 0 a 255)
    todos = np.concatenate([base, np.asarray(extra, dtype=base.dtype)])
    pos_en_red = np.minimum(np.searchsorted(ids, todos), len(ids) - 1)
    simulado = ids[pos_en_red] == todos
    # Algunos de los 25.000 de siempre no son neuronas "trazadas" (no están en
    # el archivo de conexiones): no se pueden simular y quedan siempre apagados.
    print(f"Puntos sin simular (no están en las conexiones trazadas): {int((~simulado).sum())} de {len(todos)}")
    brillo = np.round(255 * np.minimum(1, np.log1p(tasas[:, pos_en_red]) / np.log1p(HZ_TOPE))).astype(np.uint8)
    brillo[:, ~simulado] = 0
    con_algo = np.flatnonzero(brillo.any(axis=0)).astype(np.uint32)
    roles = np.array([rol.get(int(b), 0) for b in todos], dtype=np.uint8)
    # Los Hz exactos de los puntos con actividad (× 10, para la tarjetita)
    hz10 = np.round(np.minimum(tasas[:, pos_en_red[con_algo]], 6553) * 10).astype(np.uint16)
    hz10[:, ~simulado[con_algo]] = 0
    (PUBLICO / "actividad-real.bin").write_bytes(roles.tobytes() + con_algo.tobytes()
                                                + np.ascontiguousarray(brillo[:, con_algo]).tobytes()
                                                + np.ascontiguousarray(hz10).tobytes())

    # Ficha de cada punto que dispara o es del circuito: id, tipo, lado, superclase, zona
    def texto(v):
        return v if isinstance(v, str) else ""
    fichas = {}
    for i in sorted(set(con_algo.tolist()) | set(np.flatnonzero(roles > 0).tolist())):
        b = int(todos[i])
        f = anot_id.loc[b]
        lado = texto(f["somaSide"]) or texto(f["rootSide"])
        fichas[str(i)] = [b, texto(f["type"]), lado, texto(f["superclass"]), PC.grupo_de(f) or "central"]

    # Recorrido de la señal: sólo conexiones que existen en MaleCNS (≥ 20 sinapsis,
    # salvo la entrada de la antena), en orden antena → aBN1 → aDN1/aDN2 → cordón
    Wc = pd.read_feather(M.PESOS, columns=["body_pre", "body_post", "weight"])
    punto_de = {int(b): i for i, b in enumerate(todos)}
    def sinapsis(pre, post):
        return int(Wc[(Wc.body_pre == pre) & (Wc.body_post == post)].weight.sum())
    jo_izq = S["JO-C_L"] + S["JO-E_L"] + S["JO-F_L"]
    abn1 = Med["aBN1 (SAD093)"]["L"][0]          # la del lado estimulado
    adn = Med["aDN1 (DNg62)"]["L"] + Med["aDN1 (DNg62)"]["R"] + Med["aDN2 (DNge078)"]["L"] + Med["aDN2 (DNge078)"]["R"]
    adn1 = set(Med["aDN1 (DNg62)"]["L"] + Med["aDN1 (DNg62)"]["R"])
    trio = Med["aBN2 (trío LB23)"]["L"]
    aristas = []
    entrada = Wc[Wc.body_pre.isin(jo_izq) & (Wc.body_post == abn1)].sort_values("weight", ascending=False).head(6)
    for pre, w in zip(entrada.body_pre, entrada.weight):
        aristas.append([punto_de[int(pre)], punto_de[abn1], int(w), 0])
    for b in adn + trio:
        w = sinapsis(abn1, b)
        if w >= 20:
            aristas.append([punto_de[abn1], punto_de[b], w, 1])
    for b in adn:
        for b2 in adn1:
            w = sinapsis(b, b2) if b not in adn1 else 0
            if w >= 20:
                aristas.append([punto_de[b], punto_de[b2], w, 2])
    for t in trio:
        for b in adn:
            w = sinapsis(t, b)
            if w >= 20:
                aristas.append([punto_de[t], punto_de[b], w, 2])
    vnc = set(anot_id.index[anot_id["superclass"].fillna("").str.startswith("vnc")])
    for b in adn:
        d = Wc[(Wc.body_pre == b) & Wc.body_post.isin(vnc) & (Wc.weight >= 20)].sort_values("weight", ascending=False)
        d = d[[tasas[:, np.searchsorted(ids, x)].max() > 1 for x in d.body_post]].head(2)
        for post, w in zip(d.body_post, d.weight):
            aristas.append([punto_de[b], punto_de[int(post)], int(w), 3])
    etiquetas = [
        {"texto": "antena", "puntos": [punto_de[b] for b in jo_izq]},
        {"texto": "aBN1", "puntos": [punto_de[abn1]]},
        {"texto": "aBN2", "puntos": [punto_de[b] for b in trio]},
    ] + [{"texto": n, "puntos": [punto_de[b]]} for n, k in [("aDN1", "aDN1 (DNg62)"), ("aDN2", "aDN2 (DNge078)")] for l in "LR" for b in Med[k][l]]
    print(f"Recorrido: {len(aristas)} conexiones reales · " +
          ", ".join(f"nivel {n}: {sum(a[3] == n for a in aristas)}" for n in range(4)))

    # Contadores por situación, sobre TODA la red simulada (164.587 neuronas)
    anot_red = anot_id.reindex(ids)
    zona_red = np.array([PC.grupo_de(f) for _, f in anot_red[["superclass", "class"]].iterrows()], dtype=object)
    idx = lambda lista: np.searchsorted(ids, np.asarray(lista, dtype=ids.dtype))
    def hz(lista, t):
        return round(float(t[idx(lista)].mean()), 1) if lista else 0.0
    situaciones = {}
    for k, nombre in enumerate(CONDICIONES):
        t = tasas[k]
        circuito = {
            "sensores_antena": hz(S["JO-C_L"] + S["JO-E_L"] + S["JO-F_L"], t),
            "sensores_azucar": hz(S["LB3b_R"] + S["LB3c_R"], t),
        }
        for clave in ["aBN1 (SAD093)", "aBN2 (trío LB23)", "aDN1 (DNg62)", "aDN2 (DNge078)", "MN9"] + CAMINO_AZUCAR:
            circuito[clave] = {l: hz(Med[clave][l], t) for l in "LR"}
        situaciones[nombre] = {
            "activas": int((t > 0).sum()),
            "sobre_10hz": int((t > 10).sum()),
            "zonas": {z: {"activas": int(((t > 0) & (zona_red == z)).sum()), "total": int((zona_red == z).sum())} for z in zonas},
            "circuito": circuito,
            "limpieza": round(float(np.mean([circuito[k][l] for k in ["aDN1 (DNg62)", "aDN2 (DNge078)"] for l in "LR"])), 1),
        }
    meta = {
        "que_es": "Etapa 3.3 (opción A): actividad simulada del cableado real para el panel del cerebro. "
                  "Las reglas del juego no la usan: el cerebro muestra, el juego decide.",
        "fuente": "Male CNS connectome v1.0 (FlyEM / HHMI Janelia, Cambridge, MRC LMB, Google Research), CC BY 4.0",
        "modelo": f"LIF como Shiu et al. 2024; w_syn = {W} mV (Etapa 3.2b); 30 repeticiones de 1 s, semilla fija",
        "regla_antena": "n tareas abiertas → antena izquierda (JO-C + JO-E + JO-F) a 20 + (n − 1) × 200/9 Hz; 0 tareas = sin estímulo",
        "cafe": f"además, azúcar (LB3b + LB3c derecha, 17 sensores) a {HZ_AZUCAR:.0f} Hz",
        "brillo": f"log(1 + Hz) / log(1 + {HZ_TOPE:.0f}), de 0 a 255",
        "neuronas_simuladas": int(len(ids)),
        "puntos_base": int(len(base)),
        "puntos_extra": int(len(extra)),
        "puntos_con_actividad": int(len(con_algo)),
        "condiciones": CONDICIONES,
        "roles": ROLES,
        "zonas": zonas,
        "situaciones": situaciones,
        "fichas": fichas,
        "recorrido": {"aristas": aristas, "columnas": ["desde", "hasta", "sinapsis", "nivel"],
                      "regla": "sólo conexiones reales de MaleCNS: los 6 sensores de la antena que más le dan a aBN1 izq, "
                               "y de ahí ≥ 20 sinapsis; nivel 0 antena → aBN1, 1 aBN1 → aDN/aBN2, 2 aDN2 → aDN1 y "
                               "aBN2 → aDN, 3 aDN → cordón (las 2 del cordón que más reciben y que disparan)"},
        "etiquetas": etiquetas,
    }
    (PUBLICO / "actividad-real.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1) + "\n")
    peso = sum((PUBLICO / f).stat().st_size for f in ["puntos-extra.bin", "actividad-real.bin", "actividad-real.json"])
    print(f"Archivos para el juego: {peso / 1024:.0f} KB en public/cerebro/ · {len(con_algo)} puntos con actividad")
    for nombre in ["antena_2", "antena_9", "cafe_2"]:
        s = situaciones[nombre]
        print(f"   {nombre}: {s['activas']} activas · limpieza {s['limpieza']} Hz · aBN1 {s['circuito']['aBN1 (SAD093)']} · "
              f"MN9 {s['circuito']['MN9']} · Clavicle {s['circuito']['Clavicle (ANXXX462a)']}")


if __name__ == "__main__":
    parte = sys.argv[1] if len(sys.argv) > 1 else ""
    if parte not in {"simular", "armar"}:
        sys.exit(__doc__)
    {"simular": simular, "armar": armar}[parte]()
