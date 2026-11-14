// EN PRUEBA (Etapa 8.13, 2026-11-14). Felipe pidió ver varias propuestas del
// inicio para elegir: primero tres (1, 2 y 3, con el mensaje de 9 y 2 a la vez)
// y después tres más con otro mensaje (4, 5 y 6). Esta es la barrita para
// cambiar entre las seis en la página de prueba, abajo al centro. Solo aparece
// si alguien llegó con ?portada=1 a 6 en la dirección (queda anotado mientras
// dure la pestaña; lo lee el script del <head> de index.html, que elige cuál
// se ve antes de dibujar). Quien entra sin eso ve la opción 1 y ninguna
// barrita, igual que antes. Cada botón recarga la página con su opción, para
// que su dibujo parta de cero. En pantallas angostas cada botón muestra solo
// su número. Esto, src/opciones.css, src/opciones-b.css y las cinco opciones
// que no se elijan salen antes de subir al sitio.
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
  for (const n of ['1', '2', '3', '4', '5', '6']) {
    const enlace = document.createElement('a');
    enlace.href = `?portada=${n}`;
    const palabra = document.createElement('span');
    palabra.className = 'opciones-palabra';
    palabra.textContent = `${ingles ? 'Option' : 'Opción'} `;
    enlace.append(palabra, n);
    if (n === elegida) enlace.setAttribute('aria-current', 'true');
    barra.append(enlace);
  }
  document.body.append(barra);
}
