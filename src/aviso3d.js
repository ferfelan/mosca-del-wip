// El aviso del juego cuando no hay 3D (revisión final v3, M8, 2026-11-15).
// En computadores sin aceleración o en escritorios remotos el navegador no
// puede crear el dibujo 3D, y la oficina quedaba vacía sin explicación:
// "Empezar el día" no hacía nada. Ahora sale un aviso en el idioma elegido,
// con enlaces a la guía y al informe. Lo mismo si el dibujo 3D se pierde a
// mitad del día (un celular que vuelve de otra app): el aviso pide recargar,
// y se cierra solo si el navegador recupera el dibujo.
// El cuadro está en jugar/index.html (#aviso-3d) y sus textos en inglés en
// src/juego-textos.js (PAGINA), como los demás textos fijos del juego.

// three.js necesita WebGL 2 (la portada revisa lo mismo antes del cerebro).
// La prueba se suelta al tiro: los celulares admiten pocos lienzos 3D a la vez.
export function hayWebGL2() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

const cuadro = () => document.getElementById('aviso-3d');

export function prepararAviso3D() {
  const d = cuadro();
  if (!d) return;
  // Detrás no hay oficina: Esc no lo cierra
  d.addEventListener('cancel', (e) => e.preventDefault());
  document.getElementById('btn-recargar-3d')?.addEventListener('click', () => location.reload());
}

// caso: 'sin' (el navegador no puede dibujar en 3D) o 'perdido' (se perdió)
export function mostrarAviso3D(caso) {
  const d = cuadro();
  if (!d) return;
  const perdido = caso === 'perdido';
  document.getElementById('aviso-3d-sin').hidden = perdido;
  document.getElementById('aviso-3d-perdido').hidden = !perdido;
  document.getElementById('btn-recargar-3d').hidden = !perdido;
  d.setAttribute('aria-labelledby', perdido ? 'aviso-3d-titulo-perdido' : 'aviso-3d-titulo');
  d.setAttribute('aria-describedby', perdido ? 'aviso-3d-texto-perdido' : 'aviso-3d-texto');
  if (d.open) return;
  try {
    d.showModal();
  } catch {
    d.setAttribute('open', '');
  }
}

export function cerrarAviso3D() {
  const d = cuadro();
  if (d?.open) d.close();
}
