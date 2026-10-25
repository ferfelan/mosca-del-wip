// Mini gráfico "Estrés del día": el estrés de la mosca desde las 09:00 hasta
// ahora (0 a 100 %, el mismo de la tarjeta "Estado de la mosca"), con la línea
// del color de su nivel (Tranquila, Ocupada, Estresada, Colapsada) y una marca
// por cada cigarro y cada café, en una franja bajo la línea. Así se ve en
// 3 segundos que con más estrés fuma más. Al pasar el mouse: la hora, el
// nivel y las tareas a la vez de ese momento.
// Los datos vienen del juego (main.js los registra en cada paso del reloj).
import { nivelDeEstres, NIVELES_ESTRES } from './brain.js';
import { tx, nombreNivel } from './juego-textos.js';

const SUPERFICIE = '#0c1122';
const TINTA_TENUE = '#6e778d';
const LINEA_GUIA = 'rgba(255, 255, 255, 0.08)';
const COLOR_PAPEL = '#ece6dc'; // el cigarro (igual que en la leyenda)
const COLOR_BRASA = '#ff7043';
const COLOR_CAFE = '#c8915e';
const MUESTRAS = 180; // una cada 3 minutos del juego (09:00 → 18:00)
const FUENTE = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function horaDeFraccion(f) {
  const min = 9 * 60 + Math.round(f * 540);
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function crearGraficoDia({ lienzo, tooltip }) {
  const ctx = lienzo.getContext('2d');
  let datos = new Array(MUESTRAS).fill(null); // { estres, enCurso, wip }
  let marcas = []; // { f, tipo: 'cigarro' | 'cafe' }
  let ultimaFraccion = -1;
  let hover = null;
  let sucio = true;

  function reiniciar() {
    datos = new Array(MUESTRAS).fill(null);
    marcas = [];
    ultimaFraccion = -1;
    sucio = true;
  }

  // El estrés del momento. Si el reloj volvió atrás, es otro día.
  function registrar(fraccion, dato) {
    if (fraccion + 1e-6 < ultimaFraccion) reiniciar();
    ultimaFraccion = fraccion;
    const i = Math.min(MUESTRAS - 1, Math.floor(fraccion * MUESTRAS));
    const antes = datos[i];
    if (antes && antes.estres === dato.estres && antes.enCurso === dato.enCurso) return;
    datos[i] = dato;
    sucio = true;
  }

  // Un cigarro o un café que empieza en ese momento del día
  function marcar(fraccion, tipo) {
    marcas.push({ f: fraccion, tipo });
    sucio = true;
  }

  function geometria() {
    const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    const w = lienzo.clientWidth;
    const h = lienzo.clientHeight;
    if (lienzo.width !== Math.round(w * ratio) || lienzo.height !== Math.round(h * ratio)) {
      lienzo.width = Math.round(w * ratio);
      lienzo.height = Math.round(h * ratio);
    }
    // Con espacio (Exhibición), los nombres de los niveles a la derecha. Su
    // margen es de 66 px; sólo crece si el nombre más largo no cabe
    // ("Overwhelmed" en inglés; los de español caben siempre)
    const nombres = h >= 90 && w >= 360;
    let margen = 66;
    if (nombres) {
      ctx.font = `10px ${FUENTE}`;
      const largo = Math.max(...NIVELES_ESTRES.map((n) => ctx.measureText(nombreNivel(n.nombre)).width));
      margen = Math.max(66, Math.ceil(largo) + 12);
    }
    const franja = h >= 90 ? 16 : 12; // donde van los cigarros y los cafés
    const eje = 13;
    return { ratio, w, h, nombres, x0: 2, x1: w - (nombres ? margen : 4), y0: 5, y1: h - eje - franja, franja: h - eje - franja / 2 };
  }

  function dibujarCigarro(x, y, escala) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(escala, escala);
    ctx.fillStyle = COLOR_PAPEL;
    ctx.beginPath();
    ctx.roundRect(-5.5, -1.6, 8.5, 3.2, 1);
    ctx.fill();
    ctx.fillStyle = COLOR_BRASA;
    ctx.beginPath();
    ctx.roundRect(3, -1.6, 2.8, 3.2, 1);
    ctx.fill();
    ctx.restore();
  }

  function dibujarCafe(x, y, escala) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(escala, escala);
    ctx.fillStyle = COLOR_CAFE;
    ctx.beginPath();
    ctx.moveTo(-4, -3);
    ctx.lineTo(2.6, -3);
    ctx.lineTo(2.6, 1);
    ctx.arcTo(2.6, 3.4, 0.2, 3.4, 2.2);
    ctx.lineTo(-1.6, 3.4);
    ctx.arcTo(-4, 3.4, -4, 1, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLOR_CAFE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(3.4, 0, 1.6, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.restore();
  }

  function dibujar() {
    if (!sucio) return;
    sucio = false;
    const g = geometria();
    if (g.w < 10 || g.h < 10) return;
    ctx.setTransform(g.ratio, 0, 0, g.ratio, 0, 0);
    ctx.clearRect(0, 0, g.w, g.h);
    const xDe = (f) => g.x0 + f * (g.x1 - g.x0);
    const xMuestra = (i) => xDe((i + 0.5) / MUESTRAS);
    const yDe = (e) => g.y1 - (Math.min(100, Math.max(0, e)) / 100) * (g.y1 - g.y0);

    // Guías en el cambio de cada nivel (25, 50 y 75 %) y línea base
    ctx.lineWidth = 1;
    ctx.strokeStyle = LINEA_GUIA;
    ctx.beginPath();
    for (const e of [0, 25, 50, 75]) {
      ctx.moveTo(g.x0, Math.round(yDe(e)) + 0.5);
      ctx.lineTo(g.x1, Math.round(yDe(e)) + 0.5);
    }
    ctx.stroke();
    if (g.nombres) {
      ctx.font = `10px ${FUENTE}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      let desde = 0;
      for (const n of NIVELES_ESTRES) {
        const hasta = Math.min(100, n.max);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.85;
        ctx.fillText(nombreNivel(n.nombre), g.x1 + 8, yDe((desde + hasta) / 2));
        desde = hasta;
      }
      ctx.globalAlpha = 1;
    }

    // Eje: 09:00 · 13:30 · 18:00
    ctx.fillStyle = TINTA_TENUE;
    ctx.font = `10px ${FUENTE}`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText('09:00', g.x0, g.h);
    ctx.textAlign = 'center';
    ctx.fillText('13:30', (g.x0 + g.x1) / 2, g.h);
    ctx.textAlign = 'right';
    ctx.fillText('18:00', g.x1, g.h);

    // Tramos con datos (la línea se corta si falta un pedazo)
    const tramos = [];
    let actual = [];
    datos.forEach((d, i) => {
      if (d) actual.push({ x: xMuestra(i), y: yDe(d.estres), d });
      else if (actual.length) {
        tramos.push(actual);
        actual = [];
      }
    });
    if (actual.length) tramos.push(actual);

    for (const t of tramos) {
      if (t.length < 2) continue;
      // Relleno suave bajo la línea
      ctx.beginPath();
      ctx.moveTo(t[0].x, g.y1);
      t.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(t[t.length - 1].x, g.y1);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      // Línea de 2 px del color del nivel de cada momento
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let k = 1; k < t.length; k++) {
        ctx.beginPath();
        ctx.moveTo(t[k - 1].x, t[k - 1].y);
        ctx.lineTo(t[k].x, t[k].y);
        ctx.strokeStyle = nivelDeEstres(t[k].d.estres).color;
        ctx.stroke();
      }
    }

    // Una marca por cada cigarro y cada café, en la franja bajo la línea
    const escala = g.h >= 90 ? 1.5 : 1.1;
    for (const m of marcas) {
      if (m.tipo === 'cigarro') dibujarCigarro(xDe(m.f), g.franja, escala);
      else dibujarCafe(xDe(m.f), g.franja, escala);
    }

    // Punto de "ahora" con anillo del color del fondo
    const ultimo = tramos.length ? tramos[tramos.length - 1].at(-1) : null;
    const punto = (p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = nivelDeEstres(p.d.estres).color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = SUPERFICIE;
      ctx.stroke();
    };
    if (ultimo) punto(ultimo);

    // Línea del mouse
    if (hover !== null && datos[hover]) {
      const x = Math.round(xMuestra(hover)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, g.y0);
      ctx.lineTo(x, g.y1);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(233, 237, 247, 0.45)';
      ctx.stroke();
      punto({ x: xMuestra(hover), y: yDe(datos[hover].estres), d: datos[hover] });
    }

    const cigarros = marcas.filter((m) => m.tipo === 'cigarro').length;
    const cafes = marcas.length - cigarros;
    const ahora = ultimo ? tx('graficoAhora', nombreNivel(nivelDeEstres(ultimo.d.estres).nombre)) : tx('graficoEmpieza');
    lienzo.setAttribute('aria-label', tx('graficoResumen', ahora, cigarros, cafes));
  }

  // ---- Mouse: la línea vertical busca la muestra más cercana con datos ----
  function alMover(e) {
    const g = geometria();
    const r = lienzo.getBoundingClientRect();
    const x = e.clientX - r.left;
    let i = Math.round(((x - g.x0) / (g.x1 - g.x0)) * MUESTRAS - 0.5);
    i = Math.max(0, Math.min(MUESTRAS - 1, i));
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
    const nivel = nombreNivel(nivelDeEstres(dato.estres).nombre);
    // ¿empezó un cigarro o un café cerca de esa hora? (± 6 minutos)
    const cerca = marcas.filter((m) => Math.abs(m.f - (mejor + 0.5) / MUESTRAS) < 6 / 540);
    const evento = cerca.some((m) => m.tipo === 'cigarro') ? tx('graficoFuma') : cerca.length ? tx('graficoCafe') : '';
    tooltip.innerHTML = tx('graficoCartel', horaDeFraccion(mejor / MUESTRAS), nivel, Math.round(dato.estres), dato.enCurso, evento);
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

  // Al cambiar de idioma: se vuelve a dibujar (nombres de los niveles y lo
  // que lee el lector de pantalla); el cartelito vuelve con el mouse
  function refrescarTextos() {
    if (!tooltip.hidden) alSalir();
    sucio = true;
  }

  return { registrar, marcar, reiniciar, dibujar, refrescarTextos };
}
