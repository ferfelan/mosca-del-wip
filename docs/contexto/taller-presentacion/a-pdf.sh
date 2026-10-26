#!/bin/bash
# Pasa la presentación del taller a PDF con LibreOffice usando las letras instaladas
# en el Mac (Lora y Figtree en ~/Library/Fonts) y saca una imagen por lámina para
# revisarlas. LibreOffice en macOS busca las letras con fontconfig y por defecto solo
# ve las que trae adentro (por eso el primer PDF salió con Linux Libertine y Frank
# Ruhl en vez de Figtree y Lora): aquí se le pasa un fonts.conf propio con las
# carpetas de letras del Mac. No necesita npm run dev.
# Uso: bash docs/contexto/taller-presentacion/a-pdf.sh ["ruta del .pptx"]
set -euo pipefail
PPTX="${1:-$HOME/Desktop/Mosca del WIP/2026-10-26 Taller - Presentación v1.pptx}"
SALIDA="$(dirname "$PPTX")"
PDF="${PPTX%.pptx}.pdf"
REPO="$(cd "$(dirname "$0")/../../.." && pwd)"
TMP="$(mktemp -d)"
cat > "$TMP/fonts.conf" <<CONF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>$HOME/Library/Fonts</dir>
  <dir>/Library/Fonts</dir>
  <dir>/System/Library/Fonts</dir>
  <dir>/System/Library/Fonts/Supplemental</dir>
  <dir>/Applications/LibreOffice.app/Contents/Resources/fonts/truetype</dir>
  <cachedir>$TMP/cache</cachedir>
</fontconfig>
CONF
FONTCONFIG_FILE="$TMP/fonts.conf" /Applications/LibreOffice.app/Contents/MacOS/soffice \
  --headless --norestore --nologo --convert-to pdf --outdir "$SALIDA" "$PPTX" > /dev/null 2>&1
echo "PDF: $PDF"
printf 'letras del PDF: '
/opt/homebrew/bin/pdffonts "$PDF" | awk 'NR>2 {print $1}' | sed 's/^[A-Z]*+//' | sort -u | tr '\n' ' '
echo
mkdir -p "$REPO/capturas/_taller/pres"
find "$REPO/capturas/_taller/pres" -name 'l-*.png' -delete
/opt/homebrew/bin/pdftoppm -r 96 -png "$PDF" "$REPO/capturas/_taller/pres/l"
echo "imágenes: $REPO/capturas/_taller/pres/l-01.png … l-$(printf '%02d' "$(/opt/homebrew/bin/pdfinfo "$PDF" | awk '/Pages/ {print $2}')").png"
rm -rf "$TMP"
