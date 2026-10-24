#!/usr/bin/env bash
# Graba el clip del juego que muestra la portada, en español o en inglés
# (2026-10-24; son los mismos pasos con que se grabó el clip de la parte 5.2b).
# Con npm run dev encendido:
#   bash scripts/grabar-clip.sh en
# Toma 1: el día de exhibición con 2 tareas a la vez, desde las 13:30. Toma 2:
# el mismo día con 9 tareas a la vez, también desde las 13:30. Se unen con un
# fundido de 0,4 s en el segundo 5,6 (por eso data-cambio="5.8" en index.html).
# Salen en public/video/:
#   es: clip-computador.mp4, clip-celular.mp4 y clip-inicio.jpg
#   en: clip-computador-en.mp4, clip-celular-en.mp4 y clip-inicio-en.jpg
# Las tomas sin cortar quedan en una carpeta temporal para revisarlas.
set -euo pipefail
IDIOMA="${1:-es}"
case "$IDIOMA" in
  es) SUFIJO="" ;;
  en) SUFIJO="-en" ;;
  *) echo "Uso: bash scripts/grabar-clip.sh es|en"; exit 1 ;;
esac
TOMAS="${TMPDIR:-/tmp}/mosca-clip-$IDIOMA"
mkdir -p "$TOMAS"
export AGENT_BROWSER_SESSION="clip-mosca-$IDIOMA"

agent-browser set viewport 1600 900 1 >/dev/null
agent-browser open "http://127.0.0.1:5173/jugar/?lang=$IDIOMA" >/dev/null
agent-browser wait --fn "window.__mosca && document.readyState === 'complete'" >/dev/null
sleep 3
# Solo la oficina: sin paneles, sin botones (tampoco el ES | EN) y sin el aviso de inicio
agent-browser eval "(() => { const m = window.__mosca; m.ocultarCerebro(true); m.ocultarControles(true); const css = document.createElement('style'); css.textContent = '#btn-mostrar-cerebro,#btn-mostrar-controles,#ex-inicio,#btn-vista-inicial,.idioma{display:none!important}'; document.head.appendChild(css); return 'listo'; })()" >/dev/null
sleep 2
agent-browser eval "(() => { __mosca.diaExhibicion(2); __mosca.adelantar(270); return 'ok'; })()" >/dev/null
sleep 2
agent-browser record start "$TOMAS/toma-2.webm" --fps 30 >/dev/null
sleep 8
agent-browser record stop >/dev/null
agent-browser eval "(() => { __mosca.diaExhibicion(9); __mosca.adelantar(270); return 'ok'; })()" >/dev/null
sleep 2
agent-browser record start "$TOMAS/toma-9.webm" --fps 30 >/dev/null
sleep 12
agent-browser record stop >/dev/null
agent-browser close >/dev/null 2>&1 || true

ffmpeg -v error -y -ss 0.8 -t 6 -i "$TOMAS/toma-2.webm" -ss 0.6 -t 9 -i "$TOMAS/toma-9.webm" \
  -filter_complex "[0:v]fps=30,settb=AVTB,setpts=PTS-STARTPTS[a];[1:v]fps=30,settb=AVTB,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=0.4:offset=5.6,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -crf 14 -preset medium -an "$TOMAS/maestro.mp4"
ffmpeg -v error -y -i "$TOMAS/maestro.mp4" -vf "scale=1280:720:flags=lanczos" -c:v libx264 -profile:v high -crf 26 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an "public/video/clip-computador$SUFIJO.mp4"
ffmpeg -v error -y -i "$TOMAS/maestro.mp4" -vf "scale=720:-2:flags=lanczos" -c:v libx264 -profile:v high -crf 28 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an "public/video/clip-celular$SUFIJO.mp4"
ffmpeg -v error -y -ss 3 -i "public/video/clip-computador$SUFIJO.mp4" -frames:v 1 -q:v 5 "public/video/clip-inicio$SUFIJO.jpg"
ls -la "public/video/clip-computador$SUFIJO.mp4" "public/video/clip-celular$SUFIJO.mp4" "public/video/clip-inicio$SUFIJO.jpg"
echo "Tomas sin cortar en $TOMAS"
