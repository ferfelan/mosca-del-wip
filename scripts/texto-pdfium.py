# El texto de cada PDF tal como lo copia el visor de PDF de Chrome, que usa
# PDFium (Etapa 8.14, 2026-11-14). Lo usa scripts/revisar-coherencia.mjs para
# comparar ese texto con el de pdftotext y avisar si quedaron palabras pegadas:
# Felipe copió el texto del resumen desde ese visor y los títulos salieron
# pegados ("Ocupadotodoeldía."), y ese texto es el que leen Google y las IA.
#
# Uso: .venv-datos/bin/python scripts/texto-pdfium.py a.pdf b.pdf …
# Escribe un JSON {ruta: texto}.
# Se instala una vez con: uv pip install --python .venv-datos/bin/python pypdfium2
import json
import sys

import pypdfium2 as pdfium

salida = {}
for ruta in sys.argv[1:]:
    pdf = pdfium.PdfDocument(ruta)
    salida[ruta] = '\n'.join(pdf[i].get_textpage().get_text_range() for i in range(len(pdf)))
    pdf.close()
json.dump(salida, sys.stdout, ensure_ascii=False)
