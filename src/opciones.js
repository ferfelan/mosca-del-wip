// EN PRUEBA (Etapa 8.13, 2026-11-14). Felipe pidió ver tres propuestas del
// inicio para elegir. Esta es la barrita para cambiar entre ellas en la página
// de prueba, abajo al centro. Solo aparece si alguien llegó con ?portada=1, 2 o
// 3 en la dirección (queda anotado mientras dure la pestaña; lo lee el script
// del <head> de index.html, que elige cuál se ve antes de dibujar). Quien
// entra sin eso ve la opción 1 y ninguna barrita, igual que antes. Cada botón
// recarga la página con su opción, para que su dibujo parta de cero.
// Esto, src/opciones.css y las dos opciones que no se elijan salen antes de
// subir al sitio.
export function iniciarOpciones() {
  let elegida = null;
  try {
    elegida = sessionStorage.getItem('mosca-portada');
  } catch {
    // (sin almacenamiento no hay barrita: se ve la opción 1)
  }
  if (!elegida) return;
  const ingles = document.documentElement.lang === 'en';
  const barra = document.createElement('nav');
  barra.className = 'opciones';
  barra.setAttribute('aria-label', ingles ? 'Options for the home page (test)' : 'Opciones del inicio (prueba)');
  const rotulo = document.createElement('span');
  rotulo.className = 'opciones-rotulo';
  rotulo.textContent = ingles ? 'Test' : 'Prueba';
  barra.append(rotulo);
  for (const n of ['1', '2', '3']) {
    const enlace = document.createElement('a');
    enlace.href = `?portada=${n}`;
    enlace.textContent = `${ingles ? 'Option' : 'Opción'} ${n}`;
    if (n === elegida) enlace.setAttribute('aria-current', 'true');
    barra.append(enlace);
  }
  document.body.append(barra);
}
