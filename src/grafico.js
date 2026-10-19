// Mini gráfico "Actividad del día": la Limpieza de antenas (qué tan encendidas
// están aDN1 y aDN2 en la simulación del cableado real, de 0 a 100 %, con
// 10 tareas en curso = 100 %) desde las 09:00 hasta ahora. Así se ve cuándo
// se encendió. Una sola serie (línea de 2 px + relleno suave), un punto en
// "ahora", eje con 09:00 · 13:30 · 18:00 y, al pasar el mouse, una línea
// vertical con la hora, la limpieza y el WIP de ese momento. Si la limpieza
// no se enciende en todo el día, lo dice en palabras.

const COLOR_LINEA = '#6a86ec'; // validado contra el fondo oscuro del panel
const SUPERFICIE = '#0c1122';
const TINTA_TENUE = '#6e778d';
const TINTA_SUAVE = '#9aa3b8';
const LINEA_GUIA = 'rgba(255, 255, 255, 0.08)';
const MUESTRAS = 108; // una cada 5 minutos simulados (09:00 → 18:00)
const ENCENDIDA = 0.01; // desde el 1 % se cuenta como encendida
const numero = new Intl.NumberFormat('es-CL');
const pct = (x) => `${Math.round(x * 100)}%`;

function horaDeFraccion(f) {
  const min = 9 * 60 + Math.round(f * 540);
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function crearGraficoDia({ lienzo, tooltip, elPico }) {
  const ctx = lienzo.getContext('2d');
  let datos = new Array(MUESTRAS).fill(null); // { limpieza, wip, tareas, activas }
  let ultimaFraccion = -1;
  let hover = null;
  let sucio = true;
  let diaTerminado = false;

  function reiniciar() {
    datos = new Array(MUESTRAS).fill(null);
    ultimaFraccion = -1;
    sucio = true;
  }

  // Guarda la limpieza del momento (0 a 1). Si el reloj volvió atrás, es otro día.
  function registrar(fraccion, dato) {
    if (fraccion + 1e-6 < ultimaFraccion) reiniciar();
    ultimaFraccion = fraccion;
    const i = Math.min(MUESTRAS - 1, Math.floor(fraccion * MUESTRAS));
    datos[i] = dato;
    sucio = true;
  }

  function resumen() {
    let pico = null;
    let suma = 0;
    let n = 0;
    let primera = null; // primera vez que se encendió
    datos.forEach((d, i) => {
      if (!d) return;
      suma += d.limpieza;
      n++;
      if (!pico || d.limpieza > pico.limpieza) pico = { ...d, i };
      if (primera === null && d.limpieza >= ENCENDIDA) primera = i;
    });
    return { pico, promedio: n ? suma / n : 0, n, primera };
  }

  function geometria() {
    const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    const w = lienzo.clientWidth;
    const h = lienzo.clientHeight;
    if (lienzo.width !== Math.round(w * ratio) || lienzo.height !== Math.round(h * ratio)) {
      lienzo.width = Math.round(w * ratio);
      lienzo.height = Math.round(h * ratio);
    }
    const margen = { izq: 2, der: 6, arr: 6, aba: 16 };
    return {
      ratio,
      w,
      h,
      x0: margen.izq,
      x1: w - margen.der,
      y0: margen.arr,
      y1: h - margen.aba,
    };
  }

  function dibujar(terminado = diaTerminado) {
    if (terminado !== diaTerminado) {
      diaTerminado = terminado;
      sucio = true;
    }
    if (!sucio) return;
    sucio = false;
    const g = geometria();
    if (g.w < 10 || g.h < 10) return;
    ctx.setTransform(g.ratio, 0, 0, g.ratio, 0, 0);
    ctx.clearRect(0, 0, g.w, g.h);
    const xDe = (i) => g.x0 + ((i + 0.5) / MUESTRAS) * (g.x1 - g.x0);
    const yDe = (v) => g.y1 - Math.min(1, Math.max(0, v)) * (g.y1 - g.y0);

    // Línea base (hairline), guía del 50 % y del 100 % (lo más que se enciende en el juego)
    ctx.lineWidth = 1;
    ctx.strokeStyle = LINEA_GUIA;
    ctx.beginPath();
    for (const v of [0, 0.5, 1]) {
      ctx.moveTo(g.x0, Math.round(yDe(v)) + 0.5);
      ctx.lineTo(g.x1, Math.round(yDe(v)) + 0.5);
    }
    ctx.stroke();

    // Eje: 09:00 · 13:30 · 18:00 (texto tenue) y "100%" arriba a la derecha
    ctx.fillStyle = TINTA_TENUE;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText('09:00', g.x0, g.h);
    ctx.textAlign = 'center';
    ctx.fillText('13:30', (g.x0 + g.x1) / 2, g.h);
    ctx.textAlign = 'right';
    ctx.fillText('18:00', g.x1, g.h);
    ctx.textBaseline = 'top';
    ctx.fillText('100%', g.x1, Math.round(yDe(1)) + 2);

    // Tramos con datos (la línea se corta si falta un pedazo)
    const tramos = [];
    let actual = [];
    datos.forEach((d, i) => {
      if (d) actual.push([xDe(i), yDe(d.limpieza)]);
      else if (actual.length) {
        tramos.push(actual);
        actual = [];
      }
    });
    if (actual.length) tramos.push(actual);

    tramos.forEach((t) => {
      if (t.length < 2) return;
      // Relleno suave (~12 %)
      ctx.beginPath();
      ctx.moveTo(t[0][0], g.y1);
      t.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(t[t.length - 1][0], g.y1);
      ctx.closePath();
      ctx.fillStyle = 'rgba(106, 134, 236, 0.14)';
      ctx.fill();
      // Línea de 2 px
      ctx.beginPath();
      t.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = COLOR_LINEA;
      ctx.stroke();
    });

    // Si la limpieza sigue en 0, se dice en palabras (sobre la línea apagada)
    const r = resumen();
    if (r.n && r.primera === null) {
      ctx.fillStyle = TINTA_SUAVE;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const texto = diaTerminado ? 'La limpieza no se encendió en todo el día (0%)' : 'La limpieza sigue apagada (0%)';
      ctx.fillText(texto, (g.x0 + g.x1) / 2, (g.y0 + g.y1) / 2);
    }

    // Punto de "ahora" con anillo del color del fondo
    const ultimo = tramos.length ? tramos[tramos.length - 1].at(-1) : null;
    if (ultimo) {
      ctx.beginPath();
      ctx.arc(ultimo[0], ultimo[1], 4, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_LINEA;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = SUPERFICIE;
      ctx.stroke();
    }

    // Línea del mouse
    if (hover !== null && datos[hover]) {
      const x = Math.round(xDe(hover)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, g.y0);
      ctx.lineTo(x, g.y1);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(233, 237, 247, 0.45)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(xDe(hover), yDe(datos[hover].limpieza), 4, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_LINEA;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = SUPERFICIE;
      ctx.stroke();
    }

    // Resumen: pico y promedio (texto en tinta normal, no del color de la línea)
    if (r.pico) {
      const hora = horaDeFraccion(r.pico.i / MUESTRAS);
      elPico.textContent = `pico ${pct(r.pico.limpieza)} · prom. ${pct(r.promedio)}`;
      elPico.title = r.primera === null
        ? 'La limpieza de antenas no se ha encendido: con 1 a 3 tareas en curso la señal llega al relevo, pero no a la limpieza.'
        : `Limpieza de antenas: pico de ${pct(r.pico.limpieza)} a las ${hora}; promedio del día ${pct(r.promedio)}. Se encendió por primera vez a las ${horaDeFraccion(r.primera / MUESTRAS)}.`;
      lienzo.setAttribute('aria-label', r.primera === null
        ? 'Limpieza de antenas durante el día: apagada (0%).'
        : `Limpieza de antenas durante el día: pico de ${pct(r.pico.limpieza)} a las ${hora}, promedio ${pct(r.promedio)}.`);
    } else {
      elPico.textContent = 'empieza a las 09:00';
      elPico.title = '';
    }
  }

  // ---- Mouse: la línea vertical busca la muestra más cercana con datos ----
  function alMover(e) {
    const g = geometria();
    const r = lienzo.getBoundingClientRect();
    const x = e.clientX - r.left;
    let i = Math.round(((x - g.x0) / (g.x1 - g.x0)) * MUESTRAS - 0.5);
    i = Math.max(0, Math.min(MUESTRAS - 1, i));
    // la más cercana con datos
    let mejor = null;
    for (let d = 0; d < MUESTRAS; d++) {
      if (datos[i - d]) {
        mejor = i - d;
        break;
      }
      if (datos[i + d]) {
        mejor = i + d;
        break;
      }
    }
    hover = mejor;
    sucio = true;
    if (mejor === null) {
      tooltip.hidden = true;
      return;
    }
    const dato = datos[mejor];
    // Si estaba terminando lo empezado (más tareas abiertas que el WIP), se dice
    const tareas = dato.tareas !== dato.wip && dato.tareas > 0 ? `${dato.tareas} en curso (WIP ${dato.wip})` : `WIP ${dato.wip}`;
    tooltip.innerHTML = `<strong>${horaDeFraccion(mejor / MUESTRAS)}</strong> · limpieza ${pct(dato.limpieza)} · ${tareas} · ${numero.format(dato.activas)} neuronas`;
    tooltip.hidden = false;
    const xPunto = g.x0 + ((mejor + 0.5) / MUESTRAS) * (g.x1 - g.x0);
    const ancho = tooltip.offsetWidth;
    const izquierda = Math.max(0, Math.min(g.w - ancho, xPunto - ancho / 2));
    tooltip.style.left = `${lienzo.offsetLeft + izquierda}px`;
  }
  function alSalir() {
    hover = null;
    sucio = true;
    tooltip.hidden = true;
  }
  lienzo.addEventListener('pointermove', alMover);
  lienzo.addEventListener('pointerleave', alSalir);
  new ResizeObserver(() => (sucio = true)).observe(lienzo);

  return { registrar, reiniciar, dibujar };
}
