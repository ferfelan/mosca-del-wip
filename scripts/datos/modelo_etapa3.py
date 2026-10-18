"""Etapa 3.2 · El modelo del cerebro de la mosca (igual que Shiu et al. 2024).

Fuente de datos: Male CNS connectome v1.0 (FlyEM / HHMI Janelia, Cambridge,
MRC LMB, Google Research) — https://male-cns.janelia.org — licencia CC BY 4.0.
Nada de FlyWire.

Qué hace este archivo (lo usan conexiones_etapa3.py y pruebas_etapa3.py):
- Arma la red: las 164.587 neuronas "trazadas" y sus 25,6 millones de
  conexiones (archivo traced-only). El peso de cada conexión es su número de
  sinapsis; el signo sale del neurotransmisor de la neurona que habla
  (activa = suma, frena = resta).
- Simula esa red con neuronas simples "integra y dispara" (LIF), con los
  mismos números y las mismas ecuaciones del código de Shiu et al. 2024
  (github.com/philshiu/Drosophila_brain_model, model.py, hecho con Brian2).
  Aquí está escrito en Python + numba (sin Brian2), copiando paso a paso el
  orden en que Brian2 calcula cada instante.

Reglas del modelo (Shiu et al. 2024):
- En reposo nada se enciende: potencial de reposo −52 mV, disparo sobre
  −45 mV, vuelve a −52 mV.
- dv/dt = (v0 − v + g) / 20 ms ; dg/dt = −g / 5 ms (ambas "unless
  refractory": quietas mientras la neurona descansa tras disparar).
- Descanso tras disparar: 2,2 ms. Retraso de cada sinapsis: 1,8 ms.
- Cada disparo suma (o resta) w_syn × n.º de sinapsis a g de la que escucha.
  w_syn es el ÚNICO número libre: se calibra una vez (azúcar a 100 Hz →
  MN9 cerca del 80 % de su máximo) y no se vuelve a tocar.
- Estímulo: entrada de Poisson a las neuronas estimuladas (empujón de
  w_syn × 250 al potencial; sin descanso tras disparar), como en Shiu.
- Paso de tiempo 0,1 ms (el de Brian2 por defecto); 1 s por repetición.

Signo por neurotransmisor (columna consensus_nt; si dice "unclear", la
predicción de la propia neurona; si tampoco, activa, como en Shiu):
- Frenan: GABA, glutamato (Shiu) e histamina (en la mosca abre canales de
  cloruro, frena; Shiu no tenía histamina en sus datos).
- Activan: acetilcolina, dopamina, serotonina y octopamina (Shiu).
"""

import time
from pathlib import Path

import numpy as np
import pandas as pd
from numba import njit, prange

RAIZ = Path(__file__).resolve().parents[2]
CRUDOS = RAIZ / "datos-crudos"
PESOS = CRUDOS / "connectome-weights-male-cns-v1.0-minconf-0.5-traced-only.feather"
NEUROTRANSMISORES = CRUDOS / "body-neurotransmitters-male-cns-v1.0.feather"
ANOTACIONES = CRUDOS / "body-annotations-male-cns-v1.0-minconf-0.5.feather"

# Números de Shiu et al. 2024 (model.py, default_params). w_syn se calibra.
SHIU = {
    "v0": -52.0,       # mV, reposo
    "v_rst": -52.0,    # mV, vuelve aquí tras disparar
    "v_th": -45.0,     # mV, umbral de disparo
    "t_mbr": 20.0,     # ms, constante de la membrana
    "tau": 5.0,        # ms, constante de la sinapsis
    "t_rfc": 2.2,      # ms, descanso tras disparar
    "t_dly": 1.8,      # ms, retraso de la sinapsis
    "w_syn_shiu": 0.275,  # mV por sinapsis (el valor de Shiu, sólo para comparar)
    "f_poi": 250.0,    # el empujón del estímulo = w_syn × 250
    "dt": 0.1,         # ms, paso de tiempo (Brian2 por defecto)
    "t_run": 1000.0,   # ms por repetición
    "n_run": 30,       # repeticiones por prueba
}
SEMILLA = 2024  # semilla fija: repetición r usa SEMILLA + r (igual en todas las pruebas)

FRENAN = {"gaba", "glutamate", "histamine"}


def cargar_red():
    """Lee los 3 archivos y arma la red en forma compacta (unos segundos)."""
    t0 = time.time()
    W = pd.read_feather(PESOS, columns=["body_pre", "body_post", "weight"])
    ids = np.union1d(W.body_pre.to_numpy(), W.body_post.to_numpy())
    pre = np.searchsorted(ids, W.body_pre.to_numpy())
    post = np.searchsorted(ids, W.body_post.to_numpy())
    peso = W.weight.to_numpy()

    nt = pd.read_feather(NEUROTRANSMISORES, columns=["body", "consensus_nt", "predicted_nt"]).set_index("body")
    cons = nt.consensus_nt.reindex(ids)
    pred = nt.predicted_nt.reindex(ids)
    usado = cons.where(cons.notna() & (cons != "unclear"), pred)
    origen = np.where(cons.notna() & (cons != "unclear"), "consenso",
                      np.where(pred.notna() & (pred != "unclear"), "propia", "sin dato (activa)"))
    usado = usado.where(usado.notna() & (usado != "unclear"), "sin dato")
    signo_neurona = np.where(usado.isin(FRENAN).to_numpy(), -1.0, 1.0)

    orden = np.argsort(pre, kind="stable")
    pre, post, peso = pre[orden], post[orden], peso[orden]
    indptr = np.zeros(len(ids) + 1, dtype=np.int64)
    np.cumsum(np.bincount(pre, minlength=len(ids)), out=indptr[1:])
    pesos = (peso * signo_neurona[pre]).astype(np.float32)

    anot = pd.read_feather(ANOTACIONES).set_index("bodyId").reindex(ids)
    red = {
        "ids": ids, "indptr": indptr, "post": post.astype(np.int32), "pesos": pesos,
        "pre": pre.astype(np.int32), "sinapsis": peso.astype(np.int32),
        "signo": signo_neurona, "nt": usado.to_numpy(), "nt_origen": origen,
        "anot": anot, "segundos": time.time() - t0,
    }
    return red


def indices(red, body_ids):
    """bodyId → posición en la red (avisa si falta alguno)."""
    body_ids = np.asarray(body_ids, dtype=np.int64)
    pos = np.searchsorted(red["ids"], body_ids)
    ok = (pos < len(red["ids"])) & (red["ids"][np.minimum(pos, len(red["ids"]) - 1)] == body_ids)
    if not ok.all():
        raise ValueError(f"faltan en la red: {body_ids[~ok].tolist()}")
    return pos.astype(np.int64)


def red_barajada(red, semilla, modo):
    """Copia de la red con las conexiones barajadas al azar (para la prueba 6).

    modo "destinos": cada conexión conserva quién habla, su peso y su signo,
    pero se le asigna al azar quién escucha (permutando la columna de
    destinos). Así cada neurona sigue dando y recibiendo lo mismo, pero con
    otras parejas.
    modo "pesos": se mantienen las parejas y se barajan los pesos con signo
    entre todas las conexiones (se conserva la distribución global de pesos,
    como dice Shiu).
    """
    rng = np.random.default_rng(semilla)
    if modo == "destinos":
        return {**red, "post": rng.permutation(red["post"])}
    if modo == "pesos":
        return {**red, "pesos": rng.permutation(red["pesos"])}
    raise ValueError(modo)


@njit(cache=True, inline="always")
def _siguiente(estado):
    # xorshift64*: números al azar rápidos y repetibles con la misma semilla
    x = estado[0]
    x ^= x >> np.uint64(12)
    x ^= x << np.uint64(25)
    x ^= x >> np.uint64(27)
    estado[0] = x
    return ((x * np.uint64(2685821657736338717)) >> np.uint64(11)) * (1.0 / 9007199254740992.0)


@njit(cache=True)
def _una_repeticion(indptr, post, pesos, w_syn, estim, prob, n_pasos, semilla,
                    v0, v_rst, v_th, a_mbr, c_g, a_tau, pasos_rfc, pasos_dly, empujon):
    n = len(indptr) - 1
    v = np.full(n, v0)
    g = np.zeros(n)
    libre_desde = np.full(n, -1, dtype=np.int64)   # paso desde el que ya no descansa
    rfc = np.full(n, pasos_rfc, dtype=np.int64)
    for j in range(len(estim)):
        rfc[estim[j]] = 0                           # las estimuladas no descansan (Shiu)
    ranuras = pasos_dly + 1
    disparos = np.empty((ranuras, n), dtype=np.int32)
    n_disp = np.zeros(ranuras, dtype=np.int64)
    cuenta = np.zeros(n, dtype=np.int32)
    estado = np.empty(1, dtype=np.uint64)
    estado[0] = np.uint64(semilla) * np.uint64(0x9E3779B97F4A7C15) + np.uint64(0x2545F4914F6CDD1D)
    for _ in range(10):
        _siguiente(estado)

    for k in range(n_pasos):
        r = k % ranuras
        m = 0
        # 1) cada neurona que no está descansando avanza 0,1 ms (solución exacta,
        #    como el método "linear" de Brian2) y 2) se revisa si dispara
        for i in range(n):
            if k >= libre_desde[i]:
                gi = g[i]
                if gi != 0.0 or v[i] != v0:
                    v[i] = v0 + (v[i] - v0) * a_mbr + gi * c_g
                    g[i] = gi * a_tau
                if v[i] > v_th:
                    disparos[r, m] = i
                    m += 1
        n_disp[r] = m
        # 3) llegan los disparos de hace 1,8 ms (sinapsis) y el estímulo (Poisson)
        if k >= pasos_dly:
            s = (k - pasos_dly) % ranuras
            for j in range(n_disp[s]):
                p = disparos[s, j]
                for e in range(indptr[p], indptr[p + 1]):
                    g[post[e]] += pesos[e] * w_syn
        for j in range(len(estim)):
            if _siguiente(estado) < prob[j]:
                v[estim[j]] += empujon
        # 4) las que dispararon vuelven a reposo y descansan
        for j in range(m):
            i = disparos[r, j]
            v[i] = v_rst
            g[i] = 0.0
            libre_desde[i] = k + rfc[i]
            cuenta[i] += 1
    return cuenta


@njit(parallel=True, cache=True)
def _repeticiones(indptr, post, pesos, w_syn, estim, prob, n_pasos, semillas,
                  v0, v_rst, v_th, a_mbr, c_g, a_tau, pasos_rfc, pasos_dly, empujon):
    n = len(indptr) - 1
    salida = np.zeros((len(semillas), n), dtype=np.int32)
    for r in prange(len(semillas)):
        salida[r] = _una_repeticion(indptr, post, pesos, w_syn, estim, prob, n_pasos, semillas[r],
                                    v0, v_rst, v_th, a_mbr, c_g, a_tau, pasos_rfc, pasos_dly, empujon)
    return salida


def simular(red, w_syn, estimulos, n_rep=SHIU["n_run"], t_ms=SHIU["t_run"], semilla=SEMILLA):
    """Corre n_rep repeticiones. estimulos = lista de (índices, Hz).

    Devuelve la tasa de disparo (Hz) de cada neurona en cada repetición:
    matriz n_rep × n_neuronas.
    """
    p = SHIU
    dt = p["dt"]
    estim = [np.asarray(ix, dtype=np.int64) for ix, _ in estimulos]
    prob = [np.full(len(ix), hz * dt / 1000.0) for ix, hz in estimulos]
    estim = np.concatenate(estim) if estim else np.zeros(0, dtype=np.int64)
    prob = np.concatenate(prob) if prob else np.zeros(0)
    if len(np.unique(estim)) != len(estim):
        raise ValueError("una neurona aparece en dos estímulos")
    a_mbr = np.exp(-dt / p["t_mbr"])
    a_tau = np.exp(-dt / p["tau"])
    c_g = p["tau"] / (p["tau"] - p["t_mbr"]) * (a_tau - a_mbr)   # efecto de g sobre v en un paso
    pasos_rfc = int(round(p["t_rfc"] / dt))
    pasos_dly = int(round(p["t_dly"] / dt))
    semillas = np.arange(semilla, semilla + n_rep, dtype=np.int64)
    cuentas = _repeticiones(red["indptr"], red["post"], red["pesos"], float(w_syn), estim, prob,
                            int(round(t_ms / dt)), semillas, p["v0"], p["v_rst"], p["v_th"],
                            a_mbr, c_g, a_tau, pasos_rfc, pasos_dly, float(w_syn) * p["f_poi"])
    return cuentas.astype(np.float64) * (1000.0 / t_ms)
