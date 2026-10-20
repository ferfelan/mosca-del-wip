"""¿Hasta dónde llega la señal? Neuronas motoras y descendentes que disparan
con cada cantidad de tareas abiertas (0 a 10), en la simulación de la 3.3.

Respaldo de la frase para charlas: "en la simulación, con 2 tareas la señal
casi no llega a las neuronas que mueven el cuerpo; con 9, enciende 65".

Lee la simulación guardada por preparar_cerebro_real.py (datos-crudos/
actividad-etapa3-3.npz, peso 0,090 mV, 30 repeticiones) y la tabla de
anotaciones de MaleCNS v1.0. Motoras = superclass vnc_motor o cb_motor;
descendentes = descending_neuron. No simula nada nuevo.

Uso:
    .venv-datos/bin/python scripts/datos/motoras_por_wip.py
"""

from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parents[2]
CRUDOS = RAIZ / "datos-crudos"


def main():
    sim = np.load(CRUDOS / "actividad-etapa3-3.npz")
    ids, tasas, condiciones = sim["ids"], sim["tasas"], [str(c) for c in sim["condiciones"]]
    anot = pd.read_feather(CRUDOS / "body-annotations-male-cns-v1.0-minconf-0.5.feather",
                           columns=["bodyId", "superclass"])
    clase = pd.Series(anot["superclass"].values, index=anot["bodyId"].values).reindex(ids)
    motora = clase.isin(["vnc_motor", "cb_motor"]).values
    descendente = (clase == "descending_neuron").values
    print(f"Simuladas: {motora.sum()} motoras y {descendente.sum()} descendentes\n")
    print(" Tareas  Motoras >0 Hz  >10 Hz  máx. Hz │ Descendentes >0 Hz  >10 Hz")
    for n in range(11):
        t = tasas[condiciones.index(f"antena_{n}")]
        m, d = t[motora], t[descendente]
        print(f" {n:6d}  {int((m > 0).sum()):13d}  {int((m > 10).sum()):6d}  {m.max():7.1f} │"
              f" {int((d > 0).sum()):18d}  {int((d > 10).sum()):6d}")


if __name__ == "__main__":
    main()
