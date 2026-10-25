// Modo celular (Parte 5.2e, 2026-10-24; Felipe eligió la opción B, "vertical,
// como una app"). En el celular el juego se ve así: arriba la oficina (o el
// cerebro, o los días), abajo una hoja fija con el número de tareas y tres
// números, y al pie tres botones para cambiar lo de arriba. Girado: la
// oficina a la izquierda y los controles a la derecha.
//
// El computador no cambia: esto se enciende solo en pantallas táctiles chicas
// y en tablets en vertical (la misma condición que el script del <head> de
// jugar/index.html); sus reglas están en src/celular.css, todas bajo
// html.celular. Es la misma partida: los controles de siempre se cambian de
// lugar (no hay copias), así el reloj, la pausa y la tabla funcionan igual. Si
// la pantalla deja de serlo (un iPad que se gira), todo vuelve a su lugar.
import './celular.css';

// La misma condición que el script del <head> de jugar/index.html: táctil y
// angosta (celular), táctil y baja (celular girado) o táctil en vertical
// hasta 1100 px (iPad en vertical: con la vista de computador los paneles le
// tapan la oficina). Un iPad girado sigue con la vista de computador.
const CONSULTA_CELULAR =
  '(hover: none) and (pointer: coarse) and (max-width: 600px), (hover: none) and (pointer: coarse) and (max-height: 500px), (hover: none) and (pointer: coarse) and (orientation: portrait) and (max-width: 1100px)';
// Lo que la hoja tapa del borde de abajo de la oficina (igual que --cel-solape)
const SOLAPE_HOJA = 20;
// Cuánto hay que arrastrar la manilla para abrir o cerrar la hoja
const ARRASTRE_HOJA = 24;

const raiz = document.documentElement;
const consulta = matchMedia(CONSULTA_CELULAR);
const horizontal = matchMedia('(orientation: landscape)');
let activo = consulta.matches;
let vista = 'oficina';
let hojaAbierta = false;
let avisos = {};
raiz.classList.toggle('celular', activo);
raiz.dataset.celVista = vista;

export const esCelular = () => activo;
export const vistaCelular = () => vista;

// Lo que se cambia de lugar en el celular: [qué, a dónde]. La hora y los
// botones del día van a la píldora de arriba; el estrés del día y la tabla,
// a la pestaña Días.
const MOVIDOS = [
  ['#reloj-texto', '#cel-controles'],
  ['#btn-pausa', '#cel-controles'],
  ['#btn-velocidad', '#cel-controles'],
  ['#btn-reiniciar', '#cel-controles'],
  ['.cerebro-dia', '#cel-dias-grafico'],
  ['#panel .bloque.ultimo', '#cel-dias-tabla'],
];
let lugares = []; // dónde estaba cada uno, para devolverlo

// La tabla de días va en un marco propio: si en una pantalla muy angosta no
// cabe, se desliza hacia el lado solo la tabla (no toda la pestaña Días). En
// el computador la tabla vuelve a estar como siempre, sin marco.
const tablaDias = document.getElementById('tabla-dias');
const tituloTabla = tablaDias.closest('.bloque').querySelector('.etiqueta');
const marcoTabla = document.createElement('div');
marcoTabla.className = 'cel-tabla-marco';
marcoTabla.tabIndex = 0; // con teclado también se puede deslizar
marcoTabla.setAttribute('role', 'region');
marcoTabla.setAttribute('aria-labelledby', 'cel-tabla-titulo'); // "Días jugados", en su idioma

function mover() {
  lugares = MOVIDOS.map(([que, destino]) => {
    const el = document.querySelector(que);
    const lugar = { el, padre: el.parentNode, siguiente: el.nextSibling };
    document.querySelector(destino).appendChild(el);
    return lugar;
  });
  tituloTabla.id = 'cel-tabla-titulo';
  tablaDias.before(marcoTabla);
  marcoTabla.appendChild(tablaDias);
}

function devolver() {
  marcoTabla.before(tablaDias);
  marcoTabla.remove();
  tituloTabla.removeAttribute('id');
  for (const { el, padre, siguiente } of lugares.reverse()) padre.insertBefore(el, siguiente);
  lugares = [];
}

// ---------- Pestañas: Oficina, Cerebro y Días ----------
const pestanas = [...document.querySelectorAll('#cel-pestanas [role="tab"]')];
const PANELES = ['escena', 'cerebro', 'cel-dias'];

function ponerVista(nueva, { foco = false } = {}) {
  vista = nueva;
  raiz.dataset.celVista = nueva;
  for (const pestana of pestanas) {
    const elegida = pestana.dataset.vista === nueva;
    pestana.setAttribute('aria-selected', String(elegida));
    pestana.tabIndex = elegida ? 0 : -1;
    if (elegida && foco) pestana.focus();
  }
  abrirHoja(false);
  avisos.alCambiarVista?.(nueva);
}

for (const pestana of pestanas) {
  pestana.addEventListener('click', () => ponerVista(pestana.dataset.vista));
  // Con teclado: flechas para ir de una a otra (como las pestañas de siempre)
  pestana.addEventListener('keydown', (e) => {
    const paso = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (!paso) return;
    e.preventDefault();
    const i = (pestanas.indexOf(pestana) + paso + pestanas.length) % pestanas.length;
    ponerVista(pestanas[i].dataset.vista, { foco: true });
  });
}

// En el celular la oficina, el cerebro y los días son paneles de las pestañas
// (en el computador no: ahí cada uno es lo que era)
function marcarPaneles(si) {
  PANELES.forEach((id, i) => {
    const panel = document.getElementById(id);
    if (si) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', pestanas[i].id);
    } else {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-labelledby');
    }
  });
}

// ---------- La hoja de abajo: un toque o arrastrar la manilla la abre ----------
// Abierta muestra el resto de los números (cafés, eficiencia y estrés). Crece
// hacia arriba sobre la oficina: la oficina no cambia de tamaño.
const panel = document.getElementById('panel');
const manilla = document.getElementById('cel-mas');

function abrirHoja(abrir = !hojaAbierta) {
  hojaAbierta = abrir && activo && !horizontal.matches;
  panel.classList.toggle('cel-abierta', hojaAbierta);
  manilla.setAttribute('aria-expanded', String(hojaAbierta));
}

let arrastreHoja = null;
let ignorarToque = false;
manilla.addEventListener('pointerdown', (e) => {
  arrastreHoja = { id: e.pointerId, y: e.clientY };
  manilla.setPointerCapture(e.pointerId);
});
manilla.addEventListener('pointerup', (e) => {
  if (arrastreHoja?.id !== e.pointerId) return;
  const dy = e.clientY - arrastreHoja.y;
  arrastreHoja = null;
  if (Math.abs(dy) < ARRASTRE_HOJA) return; // fue un toque: lo resuelve el click
  ignorarToque = true;
  abrirHoja(dy < 0);
});
manilla.addEventListener('pointercancel', () => (arrastreHoja = null));
manilla.addEventListener('click', () => {
  if (ignorarToque) {
    ignorarToque = false;
    return;
  }
  abrirHoja();
});
// Tocar la oficina, el cerebro o los días con la hoja abierta la cierra
for (const id of PANELES)
  document.getElementById(id).addEventListener('pointerdown', () => {
    if (hojaAbierta) abrirHoja(false);
  });

// La fila de la oficina termina donde empieza la hoja cerrada (menos lo que
// la hoja la tapa). Se mide la hoja cerrada; abierta no cuenta.
function medirHoja() {
  if (!activo || hojaAbierta || horizontal.matches) return;
  const alto = `${Math.round(panel.offsetHeight - SOLAPE_HOJA)}px`;
  if (raiz.style.getPropertyValue('--cel-hoja') !== alto) raiz.style.setProperty('--cel-hoja', alto);
}
// (se mide en el cuadro siguiente: cambiar la fila dentro del aviso de
// tamaño le cambia el tamaño a la oficina en el mismo cuadro, y Safari avisa
// "ResizeObserver loop completed with undelivered notifications")
let medicion = 0;
new ResizeObserver(() => {
  cancelAnimationFrame(medicion);
  medicion = requestAnimationFrame(medirHoja);
}).observe(panel);
horizontal.addEventListener('change', () => {
  abrirHoja(false);
  medirHoja();
});

// ---------- El deslizador de tareas con el dedo ----------
// En el iPhone solo se puede arrastrar la perilla; aquí también sirve tocar
// cualquier punto de la barra (y arrastrar desde ahí). Cambia el valor igual
// que el deslizador de siempre (el juego escucha su evento "input").
const deslizador = document.getElementById('wip');
const RADIO_PERILLA = 15; // la perilla mide 30 px en el celular
let dedoEnDeslizador = null;
function valorEn(x) {
  const r = deslizador.getBoundingClientRect();
  const min = Number(deslizador.min);
  const max = Number(deslizador.max);
  const f = (x - r.left - RADIO_PERILLA) / Math.max(1, r.width - 2 * RADIO_PERILLA);
  return String(Math.round(min + Math.min(1, Math.max(0, f)) * (max - min)));
}
function ponerDesdeDedo(x) {
  const v = valorEn(x);
  if (deslizador.value === v) return;
  deslizador.value = v;
  deslizador.dispatchEvent(new Event('input', { bubbles: true }));
}
deslizador.addEventListener('pointerdown', (e) => {
  if (!activo || e.pointerType !== 'touch') return;
  e.preventDefault();
  dedoEnDeslizador = e.pointerId;
  deslizador.setPointerCapture(e.pointerId);
  ponerDesdeDedo(e.clientX);
});
deslizador.addEventListener('pointermove', (e) => {
  if (e.pointerId === dedoEnDeslizador) ponerDesdeDedo(e.clientX);
});
for (const fin of ['pointerup', 'pointercancel'])
  deslizador.addEventListener(fin, (e) => {
    if (e.pointerId === dedoEnDeslizador) dedoEnDeslizador = null;
  });

// ---------- Gráfico del estrés: tocarlo también muestra el cartelito ----------
// (con el mouse aparece al pasar por encima; con el dedo, al tocar y arrastrar)
const lienzoDia = document.getElementById('lienzo-dia');
lienzoDia.addEventListener('pointerdown', (e) => {
  if (!activo || e.pointerType !== 'touch') return;
  lienzoDia.dispatchEvent(new PointerEvent('pointermove', { clientX: e.clientX, clientY: e.clientY, pointerType: 'touch', bubbles: true }));
});

// ---------- Fin del día: ver los días o jugar otro ----------
document.getElementById('cel-ver-dias').addEventListener('click', () => ponerVista('dias'));
document.getElementById('cel-reiniciar').addEventListener('click', () => document.getElementById('btn-reiniciar').click());

// ---------- Encender y apagar el modo celular ----------
function aplicar(si) {
  activo = si;
  raiz.classList.toggle('celular', si);
  if (si) {
    mover();
    marcarPaneles(true);
    ponerVista(vista);
    medirHoja();
  } else {
    abrirHoja(false);
    devolver();
    marcarPaneles(false);
    raiz.style.removeProperty('--cel-hoja');
  }
  avisos.alCambiar?.(si);
}

// El juego avisa qué hacer al encender o apagar el modo celular (encuadrar la
// oficina, dejar de dibujar lo que no se ve). Se llama una vez, ya armado.
export function iniciarCelular(alAvisar) {
  avisos = alAvisar;
  if (activo) aplicar(true);
  consulta.addEventListener('change', (e) => {
    if (e.matches !== activo) aplicar(e.matches);
  });
}
