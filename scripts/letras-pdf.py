# Letras fijas para los PDF del resumen ejecutivo (Etapa 8.14, 2026-11-14).
#
# Por qué existe: Felipe copió el texto del resumen desde el visor de PDF de
# Chrome y los títulos salieron pegados ("Ocupadotodoeldía.",
# "Unlímite sostenible,nounacosaalavez."). Ese texto es el que leen Google y
# las IA. Pasaba por dos cosas juntas.
#   1. Los títulos tienen las letras más juntas (letter-spacing negativo). Los
#      lectores de PDF no ven los espacios, solo dónde queda cada letra, y
#      deciden que hay un espacio cuando el hueco entre dos letras es grande.
#      Con las letras más juntas el hueco entre palabras se achica y algunos
#      (el de Chrome, por ejemplo) lo toman por letras de una misma palabra.
#   2. Mona Sans es una letra "variable" (un solo archivo con todos los gruesos
#      y anchos), y Chrome la guarda en el PDF de una forma especial (Type 3)
#      con la que pdftotext -raw pega todas las palabras, no solo las de los
#      títulos.
# El arreglo, sin que cambie nada a la vista: para imprimir el resumen se usa
# una copia fija de Mona Sans para cada grueso y ancho, y en las que van con
# las letras más juntas ese espaciado ya viene dentro de cada letra (su ancho
# es el de siempre más el espaciado). Así cada letra queda exactamente donde
# estaba, pero el PDF dice el ancho verdadero de cada una y los lectores ven
# el hueco entre palabras. scripts/documento.mjs las pone al imprimir
# (DOC=resumen y DOC=resumen-en) y comprueba que nada se mueva.
# En los textos con las letras más juntas, la copia lleva además 40 milésimas
# de em menos por letra (la "holgura") y documento.mjs se las devuelve con
# letter-spacing al imprimir. Sin eso, el visor de Chrome seguía pegando "El
# trabajo" y "your team", porque pide entre dos palabras un hueco mayor que la
# mitad de las letras angostas que lo rodean (explicado en documento.mjs).
# Por eso el nombre de cada copia dice el espaciado que lleva dentro (por
# ejemplo, w760-d106-tm064 es un título con -24 más la holgura).
#
# Mona Sans tiene la licencia SIL Open Font License 1.1 (permite modificarla)
# con el nombre reservado "Mona": las copias modificadas no pueden llamarse
# así, por eso se llaman "Letra PDF …". La licencia va en la misma carpeta.
#
# Uso: lo llama scripts/documento.mjs cuando falta alguna. A mano:
#   .venv-datos/bin/python scripts/letras-pdf.py '[{"wght":800,"wdth":105,"track":-30}]'
# (track en milésimas de em, que en Mona Sans son unidades de la letra).
# Se instala una vez con: uv pip install --python .venv-datos/bin/python fonttools brotli
import json
import pathlib
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FUENTE = RAIZ / 'public' / 'fonts' / 'mona-sans-latin-wdth.woff2'
CARPETA = RAIZ / 'docs' / 'contexto' / 'letras-pdf'


def clave(wght, wdth, track):
    """El nombre de cada copia: grueso, ancho y espaciado (m = menos, p = más)"""
    signo = 'm' if track < 0 else ('p' if track > 0 else '')
    ancho = f'{wdth:g}'.replace('.', '_')
    return f'w{wght}-d{ancho}-t{signo}{abs(track):03d}'


def armar(wght, wdth, track):
    salida = CARPETA / f'letra-pdf-{clave(wght, wdth, track)}.woff2'
    if salida.exists():
        return salida, False
    letra = instancer.instantiateVariableFont(TTFont(FUENTE), {'wght': wght, 'wdth': wdth})
    upm = letra['head'].unitsPerEm
    if upm != 1000:
        raise SystemExit(f'Mona Sans cambió de unidades ({upm}): revisar el espaciado')
    # El espaciado dentro de cada letra (las marcas de acento, que no avanzan, no cambian)
    if track:
        hmtx = letra['hmtx'].metrics
        for glifo, (avance, izquierda) in list(hmtx.items()):
            if avance > 0:
                hmtx[glifo] = (max(0, avance + track), izquierda)
    # Nombre propio (no puede decir "Mona")
    familia = f'Letra PDF {clave(wght, wdth, track)}'
    postscript = 'LetraPDF-' + clave(wght, wdth, track).replace('-', '').replace('_', '')
    nombres = letra['name']
    for registro in list(nombres.names):
        if registro.nameID in (1, 2, 3, 4, 6, 16, 17, 21, 22, 25):
            nombres.removeNames(nameID=registro.nameID)
    for nid, texto in ((1, familia), (2, 'Regular'), (3, f'{postscript};mosca-del-wip'), (4, familia), (6, postscript)):
        nombres.setName(texto, nid, 3, 1, 0x409)
    nombres.setName(
        'Copia de Mona Sans (SIL Open Font License 1.1) con un grueso y un ancho fijos '
        f'(wght {wght}, wdth {wdth:g}) y {track} milésimas de em de espaciado entre letras, '
        'solo para imprimir los PDF de Mosca del WIP.',
        10, 3, 1, 0x409,
    )
    letra['OS/2'].usWeightClass = max(1, min(1000, wght))
    CARPETA.mkdir(parents=True, exist_ok=True)
    letra.flavor = 'woff2'
    letra.save(salida)
    return salida, True


if __name__ == '__main__':
    pedidas = json.loads(sys.argv[1]) if len(sys.argv) > 1 else []
    for p in pedidas:
        ruta, nueva = armar(int(p['wght']), float(p['wdth']), int(p['track']))
        print(('nueva ' if nueva else 'ya estaba ') + str(ruta.relative_to(RAIZ)))
