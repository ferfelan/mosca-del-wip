import './style.css';
import * as THREE from 'three';
import { crearEscena, CAMARA_INICIAL } from './scene.js';
import { crearOficina } from './office.js';
import { crearMosca } from './fly.js';
import { DayBrain } from './brain.js';
import { revisarChoques } from './choques.js';
import { cargarDatosCerebro, crearCerebro, GRUPOS_VISUALES } from './cerebro.js';
import { sacarFoto } from './foto.js';
import { crearGraficoDia } from './grafico.js';
import { POS_CENICERO, POS_PILA, CENTRO_PANTALLA, ESCALA_MONITOR } from './layout.js';

const CLAVE_STORAGE = 'mosca-del-wip-dias';
const MIN_SIM_POR_SEG_REAL = 540 / 60; // día de 540 min simulados en 60s reales a x1

const canvas = document.getElementById('lienzo-3d');
const { scene, camera, renderer, controls } = crearEscena(canvas);
const oficina = crearOficina(scene, { anisotropia: renderer.capabilities.getMaxAnisotropy() });
const mosca = crearMosca(scene, {
  taza: { objeto: oficina.taza, reposo: oficina.reposoTaza, AGARRE: oficina.AGARRE_TAZA, BORDE: oficina.BORDE_TAZA },
});

const elWip = document.getElementById('wip');
const elWipValor = document.getElementById('wip-valor');
const elBtnPausa = document.getElementById('btn-pausa');
const elBtnVelocidad = document.getElementById('btn-velocidad');
const elBtnReiniciar = document.getElementById('btn-reiniciar');
const elReloj = document.getElementById('reloj-texto');
const elBarraDia = document.getElementById('barra-dia-relleno');
const elHechas = document.getElementById('m-hechas');
const elColillas = document.getElementById('m-colillas');
const elCafes = document.getElementById('m-cafes');
const elTiempo = document.getElementById('m-tiempo');
const elEstres = document.getElementById('m-estres');
const elBarraEstres = document.getElementById('barra-estres-relleno');
const elTablaBody = document.getElementById('tabla-dias-body');
const elBanner = document.getElementById('banner-fin-dia');
const elWipNota = document.getElementById('wip-nota');

const VELOCIDADES = [1, 2, 4];
let indiceVelocidad = 0;
let pausado = false;
let congelado = false; // sólo para capturas: deja la animación quieta
let diaYaRegistrado = false;
let colillasPintadas = 0;

let juego = new DayBrain(Number(elWip.value));

// ---------- Vistas: "control" y "exhibición" ----------
// Son dos formas de ver LA MISMA partida: mismo día, misma hora, misma pausa,
// mismo WIP y mismo historial. La exhibición tiene además un "modo demo"
// opcional (tecla D): juega solo y alterna un día con muchas tareas a la vez
// (WIP 9) y otro con pocas (WIP 2), para dejarlo corriendo en una tele.
const WIP_DEMO = { alto: 9, bajo: 2 };
const PAUSA_ENTRE_DIAS_DEMO = 7; // segundos mostrando el resumen antes de seguir
let modoDemo = false;
let esperaDemo = 0;

const elEscena = document.getElementById('escena');
const elVelo = document.getElementById('velo');
const elExWip = document.getElementById('ex-wip');
const elExHora = document.getElementById('ex-hora');
const elExHechas = document.getElementById('ex-hechas');
const elExColillas = document.getElementById('ex-colillas');
const elExCafes = document.getElementById('ex-cafes');
const elExTiempo = document.getElementById('ex-tiempo');
const elExTiempoCorto = document.getElementById('ex-tiempo-corto');
const elExEstres = document.getElementById('ex-estres');
const elExRitmo = document.getElementById('ex-ritmo');
const elRotulo = document.querySelector('.rotulo-escena');
const elExFin = document.getElementById('ex-fin');
const elExFinTexto = document.getElementById('ex-fin-texto');
const elExFinTitulo = document.getElementById('ex-fin-titulo');
const elExFinFilas = document.getElementById('ex-fin-filas');
const elExInicio = document.getElementById('ex-inicio');
const elExInicioTipo = document.getElementById('ex-inicio-tipo');
const elExInicioWip = document.getElementById('ex-inicio-wip');
const elExInicioTexto = document.getElementById('ex-inicio-texto');
const elExPausa = document.getElementById('ex-pausa');
const elExMosca = document.getElementById('ex-mosca');
const elExMoscaNivel = document.getElementById('ex-mosca-nivel');
const elExMoscaPct = document.getElementById('ex-mosca-pct');
const elExMoscaBarra = document.getElementById('ex-mosca-barra');
const elExMoscaHace = document.getElementById('ex-mosca-hace');
let vista = 'control';
let cambiandoVista = false;

// Historial de días: se guarda en el navegador (sobrevive a recargar la
// página) y sólo se conservan los últimos 5.
const MAX_DIAS = 5;
const elBtnBorrar = document.getElementById('btn-borrar-historial');

function cargarDias() {
  try {
    const dias = JSON.parse(localStorage.getItem(CLAVE_STORAGE)) || [];
    return Array.isArray(dias) ? dias.slice(-MAX_DIAS) : [];
  } catch {
    return [];
  }
}

function escribirDias(dias) {
  const recortados = dias.slice(-MAX_DIAS);
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(recortados));
  } catch {
    // sin almacenamiento disponible: la tabla igual se ve en esta sesión
  }
  pintarTabla(recortados);
}

// Tiempo por tarea: en minutos hasta 60 y en horas y minutos sobre eso.
// Largo: "45 min" / "10 h 37 min". Corto (tablas): "45m" / "10h 37m".
function formatoTiempo(minutos, corto = false) {
  if (minutos === null || minutos === undefined) return corto ? '–' : '– min';
  const m = Math.round(minutos);
  if (m <= 60) return corto ? `${m}m` : `${m} min`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  if (corto) return resto ? `${h}h ${resto}m` : `${h}h`;
  return resto ? `${h} h ${resto} min` : `${h} h`;
}

function pintarTabla(dias) {
  elTablaBody.innerHTML = '';
  elBtnBorrar.hidden = !dias.length;
  if (!dias.length) {
    elTablaBody.innerHTML = '<tr class="vacia"><td colspan="7">Juega un día completo para comparar</td></tr>';
    return;
  }
  // El mejor día (más tareas terminadas) se destaca: ayuda a comparar
  const mejor = dias.length > 1 ? Math.max(...dias.map((d) => d.hechas)) : null;
  dias.forEach((d, i) => {
    const tr = document.createElement('tr');
    if (d.hechas === mejor) {
      tr.className = 'mejor-dia';
      tr.title = 'El día con más tareas terminadas';
    }
    tr.innerHTML = `<td>${d.wip}</td><td>${d.hechas}</td><td>${formatoTiempo(d.tiempoPorTarea, true)}</td><td>${d.colillas}</td><td>${d.cafes ?? '–'}</td><td>${d.estresMax}%</td>`;
    const celda = document.createElement('td');
    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'quitar-fila';
    quitar.textContent = '×';
    quitar.title = 'Eliminar este día';
    quitar.setAttribute('aria-label', `Eliminar el día ${i + 1} (WIP ${d.wip})`);
    quitar.addEventListener('click', () => {
      const actuales = cargarDias();
      actuales.splice(i, 1);
      escribirDias(actuales);
    });
    celda.appendChild(quitar);
    tr.appendChild(celda);
    elTablaBody.appendChild(tr);
  });
}

function guardarDia(resumen) {
  const dias = cargarDias();
  dias.push(resumen);
  escribirDias(dias);
}

// Borrar todo pide confirmar con un segundo toque (sin ventanas emergentes)
let esperandoConfirmacion = null;
elBtnBorrar.addEventListener('click', () => {
  if (esperandoConfirmacion) {
    clearTimeout(esperandoConfirmacion);
    esperandoConfirmacion = null;
    elBtnBorrar.textContent = 'Borrar historial';
    elBtnBorrar.classList.remove('confirmar');
    escribirDias([]);
    return;
  }
  elBtnBorrar.textContent = '¿Seguro? Toca de nuevo';
  elBtnBorrar.classList.add('confirmar');
  esperandoConfirmacion = setTimeout(() => {
    esperandoConfirmacion = null;
    elBtnBorrar.textContent = 'Borrar historial';
    elBtnBorrar.classList.remove('confirmar');
  }, 3000);
});

escribirDias(cargarDias());

function pintarWip() {
  const v = Number(elWip.value);
  elWipValor.textContent = v;
  elWip.style.setProperty('--relleno', `${((v - 1) / 9) * 100}%`);
  document.getElementById('panel').classList.toggle('wip-alto', v > 3);
  pintarNotaWip(v, juego.enCurso.length);
}

// Bajo el slider: si bajaron el límite y todavía tiene más tareas abiertas,
// avisa que está terminando lo empezado (no toma nuevas hasta quedar bajo él)
function pintarNotaWip(limite, enCurso) {
  const drenando = enCurso > limite;
  const texto = drenando
    ? `Terminando lo empezado: ${enCurso} en curso`
    : limite <= 3
      ? 'Dentro del límite sano'
      : 'Sobre el límite sano (3)';
  if (elWipNota.textContent !== texto) elWipNota.textContent = texto;
  elWipNota.classList.toggle('alerta', drenando || limite > 3);
}

// Un solo lugar para cambiar el WIP (slider, teclas 1–9/0 o modo demo)
function ponerWip(valor) {
  const v = Math.min(10, Math.max(1, Math.round(valor)));
  elWip.value = String(v);
  pintarWip();
  juego.setWip(v);
}
elWip.addEventListener('input', () => ponerWip(Number(elWip.value)));
pintarWip();

function alternarPausa() {
  pausado = !pausado;
  elBtnPausa.textContent = pausado ? 'Reanudar' : 'Pausa';
  elBtnPausa.classList.toggle('activo', pausado);
}
elBtnPausa.addEventListener('click', alternarPausa);

elBtnVelocidad.addEventListener('click', () => {
  indiceVelocidad = (indiceVelocidad + 1) % VELOCIDADES.length;
  elBtnVelocidad.textContent = `x${VELOCIDADES[indiceVelocidad]}`;
});

function reiniciarDia() {
  // Un día nuevo parte corriendo (si estaba en pausa, se reanuda)
  if (pausado) alternarPausa();
  juego = new DayBrain(Number(elWip.value));
  diaYaRegistrado = false;
  esperaDemo = 0;
  colillasPintadas = 0;
  elBanner.classList.add('oculto');
  elExFin.classList.add('oculto');
  oficina.limpiarColillas();
  empezarLimpio();
}
elBtnReiniciar.addEventListener('click', reiniciarDia);

// Lo que la animación de la mosca necesita saber del juego
// En pausa o al terminar el día la mosca termina lo que estaba haciendo
// (deja el cigarro o la taza) y descansa: no empieza nada nuevo.
function estadoMosca(estado) {
  const descansa = pausado || estado.terminado;
  return {
    fumando: estado.fumando && !descansa,
    tomandoCafe: estado.tomandoCafe && !descansa,
    estres: estado.estres / 100,
    descansa,
  };
}

function refrescarUI(estado, cigarroEnMano) {
  elReloj.textContent = estado.hora;
  elBarraDia.style.width = `${Math.round(estado.fraccionDelDia * 100)}%`;
  elHechas.textContent = estado.hechas;
  elColillas.textContent = estado.colillas;
  elCafes.textContent = estado.cafes;
  // Tiempo por tarea: "–" hasta que termine la primera tarea del día
  elTiempo.textContent = formatoTiempo(estado.tiempoPorTarea);
  elEstres.textContent = estado.nivel.nombre;
  elEstres.style.color = estado.nivel.color;
  elBarraEstres.style.width = `${Math.round(estado.estres)}%`;
  elBarraEstres.style.background = estado.nivel.color;

  oficina.actualizarKanban(estado);
  // Carga de trabajo: tareas en curso. La pila de papeles y los post-its
  // crecen y bajan juntos con ella.
  // (al terminar el día, el trabajo que quedó pendiente sigue en la mesa,
  // igual que en el kanban)
  const carga = estado.enCurso;
  oficina.actualizarPilaTareas(carga);
  oficina.actualizarPostits(carga);
  oficina.actualizarReloj(estado.fraccionDelDia);

  // El cigarro que la mosca tiene en la mano llega al cenicero cuando lo termina
  const colillasEnCenicero = Math.max(0, estado.colillasVisibles - mosca.cigarrosSinColilla());
  while (colillasPintadas < colillasEnCenicero) {
    oficina.agregarColilla();
    colillasPintadas++;
  }

  // Rótulo y avisos de la exhibición: siempre al día con la misma partida
  elExWip.textContent = `WIP ${estado.wip}`;
  elExHora.textContent = estado.hora;
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  elExHechas.textContent = plural(estado.hechas, 'terminada', 'terminadas');
  elExColillas.textContent = plural(estado.colillas, 'colilla', 'colillas');
  elExCafes.textContent = plural(estado.cafes, 'café', 'cafés');
  elExTiempo.textContent = formatoTiempo(estado.tiempoPorTarea);
  elExTiempoCorto.textContent = formatoTiempo(estado.tiempoPorTarea, true);
  elExEstres.textContent = estado.nivel.nombre;
  elExEstres.style.color = estado.nivel.color;
  // Tarjeta "Estado de la mosca" (exhibición): nivel, barra de estrés y qué
  // está haciendo (esto último se escribe junto al estado del cerebro)
  elExMosca.style.setProperty('--nivel', estado.nivel.color);
  elExMoscaNivel.textContent = estado.nivel.nombre;
  elExMoscaPct.textContent = `${Math.round(estado.estres)}%`;
  elExMoscaBarra.style.width = `${Math.round(estado.estres)}%`;
  elExMosca.classList.toggle('fin', estado.terminado);
  const velocidad = VELOCIDADES[indiceVelocidad];
  elExRitmo.hidden = velocidad === 1;
  elExRitmo.textContent = `x${velocidad}`;
  const situacion = estado.terminado ? 'terminado' : pausado ? 'pausa' : 'vivo';
  elRotulo.dataset.estado = situacion;
  elExPausa.hidden = situacion !== 'pausa';
  elExInicioTipo.textContent = modoDemo ? 'Modo demo' : pausado ? 'En pausa' : 'En vivo';
  elExInicioWip.textContent = `WIP ${estado.wip}`;
  const drenando = estado.enCurso > estado.wip && !estado.terminado;
  pintarNotaWip(estado.wip, estado.terminado ? 0 : estado.enCurso);
  elExInicioTexto.textContent = drenando
    ? `Terminando lo empezado · ${estado.enCurso} en curso`
    : estado.wip > 3
      ? 'Muchas tareas a la vez'
      : 'Pocas tareas a la vez';
  elExInicio.classList.toggle('alto', estado.wip > 3 || drenando);
  elExInicio.classList.toggle('oculto', estado.terminado);

  // Fin del día (en cualquier vista): se guarda en "Días jugados" y se
  // muestra el resumen
  if (estado.terminado && !diaYaRegistrado) {
    diaYaRegistrado = true;
    guardarDia(juego.resumenFinal());
    llenarResumenDelDia();
  }
  elBanner.classList.toggle('oculto', !estado.terminado);
  elExFin.classList.toggle('oculto', !estado.terminado);
}

// Resumen del día en la exhibición: el día recién jugado y los anteriores
// (los mismos de "Días jugados")
function llenarResumenDelDia() {
  const dias = cargarDias();
  const actual = dias[dias.length - 1];
  elExFinTitulo.textContent = `Fin del día con WIP ${actual.wip}`;
  elExFinFilas.innerHTML = '';
  dias.slice(-3).forEach((d, i, lista) => {
    const tr = document.createElement('tr');
    if (i === lista.length - 1) tr.className = 'actual';
    tr.innerHTML = `<th>WIP ${d.wip}</th><td>${d.hechas}</td><td>${formatoTiempo(d.tiempoPorTarea, true)}</td><td>${d.colillas}</td><td>${d.cafes ?? '–'}</td><td>${d.estresMax}%</td>`;
    elExFinFilas.appendChild(tr);
  });
  pintarSiguienteDia();
}

function siguienteWipDemo() {
  return Number(elWip.value) > 3 ? WIP_DEMO.bajo : WIP_DEMO.alto;
}

function pintarSiguienteDia() {
  elExFinTexto.textContent = modoDemo
    ? `Modo demo · sigue un día con WIP ${siguienteWipDemo()}…`
    : 'R para jugar otro día · 1–9 cambia el WIP · D modo demo';
}

// ---------- Tamaño de los lienzos y encuadre ----------
// Resolución: en Control, la real de la pantalla (y se actualiza si la
// ventana pasa a otra pantalla); en Exhibición, siempre al doble (nítida
// aunque la pantalla no sea Retina).
function ratioEscena() {
  const dpr = window.devicePixelRatio || 1;
  return vista === 'exhibicion' ? 2 : Math.min(Math.max(dpr, 1), 2);
}
let dprAplicado = 0;
function ajustarEscena() {
  const w = Math.max(1, elEscena.clientWidth);
  const h = Math.max(1, elEscena.clientHeight);
  dprAplicado = window.devicePixelRatio;
  renderer.setPixelRatio(ratioEscena());
  renderer.setSize(w, h); // también fija el tamaño visible del lienzo
  camera.aspect = w / h;
  aplicarEspacioPanel();
}

// ---------- Panel del cerebro: mostrar / ocultar ----------
// Cuando el panel está visible en Control, la escena se corre a la derecha
// y se aleja un poco (sólo la imagen, sin mover la cámara) para que la
// mosca no quede tapada. Al ocultarlo, vuelve al encuadre oficial.
const CLAVE_CEREBRO_OCULTO = 'mosca-del-wip-cerebro-oculto';
const elCerebro = document.getElementById('cerebro');
const elPanelControl = document.getElementById('panel');
let cerebroOculto = false;
try {
  cerebroOculto = localStorage.getItem(CLAVE_CEREBRO_OCULTO) === '1';
} catch {
  // sin almacenamiento: empieza visible
}
const CLAVE_CONTROLES_OCULTO = 'mosca-del-wip-controles-oculto';
let controlesOculto = false;
try {
  controlesOculto = localStorage.getItem(CLAVE_CONTROLES_OCULTO) === '1';
} catch {
  // sin almacenamiento: empieza visible
}
// 1 = el panel ocupa su espacio; 0 = oculto (cambian de a poco)
let factorIzq = cerebroOculto ? 0 : 1;
let factorDer = controlesOculto ? 0 : 1;
const camBase = new THREE.PerspectiveCamera();
const _v = new THREE.Vector3();
// Silueta de la mosca: una muestra de puntos reales de su cuerpo (se
// renueva cada tanto porque la mosca se mueve un poco)
let silueta = [];
let cuadrosSilueta = 0;
function muestrearSilueta() {
  silueta = [];
  mosca.grupo.updateMatrixWorld(true);
  mosca.grupo.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.geometry?.attributes?.position) return;
    const pos = o.geometry.attributes.position;
    const paso = Math.max(1, Math.floor(pos.count / 24));
    for (let i = 0; i < pos.count; i += paso) silueta.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
  });
}

// Lo que no debe quedar tapado: la mosca, la pantalla con el kanban y la
// pila de trabajo. Sólo se cuenta lo que cae a la altura de cada panel.
const puntosFijos = [];
for (const sx of [-1, 1])
  for (const sy of [-1, 1])
    puntosFijos.push(
      CENTRO_PANTALLA.clone().add(new THREE.Vector3(sx * 0.49 * ESCALA_MONITOR, sy * 0.3 * ESCALA_MONITOR, 0))
    );
for (const sx of [-1, 1])
  for (const sz of [-1, 1])
    for (const alto of [0, 0.3]) puntosFijos.push(POS_PILA.clone().add(new THREE.Vector3(sx * 0.18, alto, sz * 0.16)));

function aplicarEspacioPanel() {
  const fi = factorIzq;
  const fd = factorDer;
  if (vista === 'exhibicion' || (fi < 0.002 && fd < 0.002)) {
    // Sin paneles: la escena ocupa toda la pantalla con el encuadre oficial
    camera.zoom = 1;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    return;
  }
  const w = elEscena.clientWidth;
  const h = elEscena.clientHeight;
  // ¿Dónde quedaría cada cosa con el encuadre normal?
  camera.updateMatrixWorld();
  camBase.fov = camera.fov;
  camBase.aspect = camera.aspect;
  camBase.near = camera.near;
  camBase.far = camera.far;
  camBase.updateProjectionMatrix();
  if (cuadrosSilueta-- <= 0) {
    muestrearSilueta();
    cuadrosSilueta = 120;
  }
  const arribaIzq = elCerebro.offsetTop - 8;
  const abajoIzq = elCerebro.offsetTop + elCerebro.offsetHeight + 8;
  const arribaDer = elPanelControl.offsetTop - 8;
  const abajoDer = elPanelControl.offsetTop + elPanelControl.offsetHeight + 8;
  let xMin = Infinity;
  let xMax = -Infinity;
  const medir = (p) => {
    _v.copy(p).applyMatrix4(camera.matrixWorldInverse);
    // lo que queda detrás de la cámara (al rotarla) no cuenta
    if (_v.z > -camera.near) return;
    _v.applyMatrix4(camBase.projectionMatrix);
    if (Math.abs(_v.x) > 1.6 || Math.abs(_v.y) > 1.6) return;
    const x = ((_v.x + 1) / 2) * w;
    const y = ((1 - _v.y) / 2) * h;
    if (y > arribaIzq && y < abajoIzq) xMin = Math.min(xMin, x);
    if (y > arribaDer && y < abajoDer) xMax = Math.max(xMax, x);
  };
  silueta.forEach(medir);
  puntosFijos.forEach(medir);

  // Espacio libre entre los paneles (crece de a poco al ocultar uno)
  const L = fi * (elCerebro.offsetLeft + elCerebro.offsetWidth + 16);
  const R = w - fd * (w - (elPanelControl.offsetLeft - 12));
  const c = w / 2;
  let zoom = 1;
  if (Number.isFinite(xMin) && Number.isFinite(xMax) && xMax - xMin > R - L) {
    zoom = Math.max(0.7, (R - L) / (xMax - xMin));
  }
  // Movimiento mínimo para que nada quede tapado
  const desde = Number.isFinite(xMin) ? L - c - (xMin - c) * zoom : -Infinity;
  const hasta = Number.isFinite(xMax) ? R - c - (xMax - c) * zoom : Infinity;
  const limite = w * 0.35;
  const dx = Math.max(-limite, Math.min(limite, desde > hasta ? (desde + hasta) / 2 : Math.min(Math.max(0, desde), hasta)));
  const dy = (1 - zoom) * h * 0.3;
  camera.zoom = zoom;
  camera.setViewOffset(w, h, -dx, -dy, w, h);
  camera.updateProjectionMatrix();
}

function pintarCerebroOculto() {
  document.body.classList.toggle('cerebro-oculto', cerebroOculto);
  document.getElementById('btn-ocultar-cerebro').setAttribute('aria-expanded', String(!cerebroOculto));
}

function pintarControlesOculto() {
  document.body.classList.toggle('controles-oculto', controlesOculto);
  document.getElementById('btn-ocultar-controles').setAttribute('aria-expanded', String(!controlesOculto));
}

function alternarControles(ocultar = !controlesOculto) {
  if (vista !== 'control') return;
  controlesOculto = ocultar;
  try {
    localStorage.setItem(CLAVE_CONTROLES_OCULTO, ocultar ? '1' : '0');
  } catch {
    // sin almacenamiento: sólo dura esta sesión
  }
  pintarControlesOculto();
}
document.getElementById('btn-ocultar-controles').addEventListener('click', () => alternarControles(true));
document.getElementById('btn-mostrar-controles').addEventListener('click', () => alternarControles(false));
pintarControlesOculto();

function alternarCerebro(ocultar = !cerebroOculto) {
  if (vista !== 'control') return;
  cerebroOculto = ocultar;
  try {
    localStorage.setItem(CLAVE_CEREBRO_OCULTO, ocultar ? '1' : '0');
  } catch {
    // sin almacenamiento: sólo dura esta sesión
  }
  pintarCerebroOculto();
}
document.getElementById('btn-ocultar-cerebro').addEventListener('click', () => alternarCerebro(true));
document.getElementById('btn-mostrar-cerebro').addEventListener('click', () => alternarCerebro(false));
pintarCerebroOculto();
new ResizeObserver(() => {
  ajustarEscena();
  if (vista === 'exhibicion') encuadrarExhibicion();
}).observe(elEscena);
ajustarEscena();

// En exhibición la cámara mira desde el mismo ángulo oficial, pero se
// acerca o aleja para que la mosca, el monitor y el cenicero entren bien en
// el recuadro (que es más angosto que la pantalla completa).
const _caja = new THREE.Box3();
const _p = new THREE.Vector3();
function puntosVisibles(objeto, porPieza = 24) {
  const puntos = [];
  objeto.updateMatrixWorld(true);
  objeto.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    for (let n = o; n; n = n.parent) if (!n.visible) return;
    const pos = o.geometry.attributes.position;
    const paso = Math.max(1, Math.floor(pos.count / porPieza));
    for (let i = 0; i < pos.count; i += paso) puntos.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
  });
  return puntos;
}

function encuadrarExhibicion() {
  // Lo que debe verse completo: la mosca (sin la silla), la pantalla con el
  // kanban y el cenicero. Se usan puntos reales de la mosca (no su caja), así
  // la cámara queda lo más cerca posible.
  const puntos = puntosVisibles(mosca.figura);
  const anchoPantalla = 0.49 * ESCALA_MONITOR;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      puntos.push(CENTRO_PANTALLA.clone().add(new THREE.Vector3(sx * anchoPantalla, sy * 0.33 * ESCALA_MONITOR, 0)));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) puntos.push(POS_CENICERO.clone().add(new THREE.Vector3(sx * 0.17, 0.06, sz * 0.17)));
  const caja = new THREE.Box3().setFromPoints(puntos);
  const centro = caja.getCenter(new THREE.Vector3());
  const direccion = CAMARA_INICIAL.posicion.clone().sub(CAMARA_INICIAL.objetivo).normalize();
  // Me acerco hasta que algo se saldría del recuadro (dejando espacio abajo
  // para el rótulo)
  const entra = () =>
    puntos.every((e) => {
      _p.copy(e).applyMatrix4(camera.matrixWorldInverse);
      if (_p.z > -camera.near) return false;
      _p.applyMatrix4(camera.projectionMatrix);
      return Math.abs(_p.x) < 0.96 && _p.y < 0.94 && _p.y > -0.8;
    });
  let d = 14;
  for (; d > 1.2; d -= 0.02) {
    camera.position.copy(centro).addScaledVector(direccion, d - 0.02);
    camera.lookAt(centro);
    camera.updateMatrixWorld();
    if (!entra()) break;
  }
  camera.position.copy(centro).addScaledVector(direccion, d);
  camera.lookAt(centro);
  controls.target.copy(centro);
  controls.update();
}

// ---------- Día nuevo ----------
// La mosca, el cerebro y el gráfico parten del estado real del juego (sin
// arrastrar el día anterior)
function empezarLimpio() {
  mosca.reiniciar(juego.estado().estres / 100);
  cerebro?.reiniciar();
  graficoDia?.reiniciar();
}

// ---------- Cambio de vista: sólo cambia cómo se ve, no la partida ----------
function alternarDemo(activar = !modoDemo) {
  if (vista !== 'exhibicion') return;
  modoDemo = activar;
  esperaDemo = 0;
  if (juego.terminado) pintarSiguienteDia();
}

function aplicarVista(nueva) {
  if (nueva === vista) return;
  if (nueva === 'exhibicion') {
    // Se puede rotar y hacer zoom con el mouse, igual que en Control
    controls.maxDistance = 12;
  } else {
    modoDemo = false;
    controls.maxDistance = 7;
    camera.position.copy(CAMARA_INICIAL.posicion);
    controls.target.copy(CAMARA_INICIAL.objetivo);
  }
  vista = nueva;
  document.body.classList.toggle('exhibicion', nueva === 'exhibicion');
  ajustarEscena();
  if (nueva === 'exhibicion') encuadrarExhibicion();
  controls.update();
  if (juego.terminado) pintarSiguienteDia();
}

// Transición suave: se funde a oscuro, cambia, y vuelve a aparecer
function cambiarVista(nueva = vista === 'control' ? 'exhibicion' : 'control', inmediato = false) {
  if (cambiandoVista || nueva === vista) return;
  if (inmediato) {
    aplicarVista(nueva);
    return;
  }
  cambiandoVista = true;
  elVelo.classList.add('activo');
  setTimeout(() => {
    aplicarVista(nueva);
    requestAnimationFrame(() => {
      elVelo.classList.remove('activo');
      setTimeout(() => (cambiandoVista = false), 350);
    });
  }, 330);
}

document.getElementById('btn-exhibicion').addEventListener('click', () => cambiarVista('exhibicion'));
// Un botón apretado con el mouse suelta el foco: así Espacio pausa el juego
// en vez de volver a apretar ese botón (con teclado, el foco se mantiene)
document.addEventListener('click', (e) => {
  const boton = e.target.closest?.('button');
  if (boton && e.detail > 0) boton.blur();
});

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement && e.key !== 'Escape') {
    if (e.target.type !== 'range') return;
  }
  if (e.key === 'e' || e.key === 'E') cambiarVista();
  if (e.key === 'b' || e.key === 'B') alternarCerebro();
  if (e.key === 'c' || e.key === 'C') alternarControles();
  if (e.key === 'Escape' && vista === 'exhibicion') cambiarVista('control');
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  // Para presentar (en las dos vistas): Espacio pausa/reanuda, R día nuevo,
  // 1–9 y 0 (=10) cambian el WIP; en exhibición, D activa el modo demo
  if (e.code === 'Space' && !(e.target instanceof HTMLButtonElement)) {
    e.preventDefault();
    alternarPausa();
  }
  if (e.key === 'r' || e.key === 'R') reiniciarDia();
  if (/^[0-9]$/.test(e.key)) ponerWip(e.key === '0' ? 10 : Number(e.key));
  if (e.key === 'd' || e.key === 'D') alternarDemo();
});

// En exhibición el cursor se esconde si no se mueve (para mostrar en una tele)
let temporizadorCursor = null;
window.addEventListener('mousemove', () => {
  document.body.classList.remove('sin-cursor');
  clearTimeout(temporizadorCursor);
  temporizadorCursor = setTimeout(() => document.body.classList.add('sin-cursor'), 2000);
});

// ---------- Cerebro ----------
let cerebro = null;
const elActivas = document.getElementById('c-activas');
const elNivel = document.getElementById('c-nivel');
const elEstado = document.getElementById('c-estado');
// Lo que está haciendo la mosca, en palabras (tarjeta de la exhibición)
const QUE_HACE = {
  Trabaja: 'Trabajando en el kanban',
  Fuma: 'Salió a fumar: pierde tiempo',
  Café: 'Pausa sana: toma café',
  'En pausa': 'Juego en pausa',
  Descansa: 'Día terminado: descansa',
};
const elGrupos = document.getElementById('cerebro-grupos');
const filasGrupo = {};
const formato = new Intl.NumberFormat('es-CL');

cargarDatosCerebro()
  .then((datos) => {
    cerebro = crearCerebro(document.getElementById('lienzo-cerebro'), datos);
    const { info } = datos;
    datos.info.grupos.forEach((g) => {
      const li = document.createElement('li');
      li.className = 'grupo';
      li.style.setProperty('--c', GRUPOS_VISUALES[g.id].color);
      li.innerHTML = `<span class="grupo-nombre"><span class="grupo-punto"></span>${g.nombre}</span><span class="grupo-valor">0%</span><span class="grupo-barra"><span></span></span><span class="grupo-detalle">${g.detalle}</span>`;
      elGrupos.appendChild(li);
      filasGrupo[g.id] = { valor: li.querySelector('.grupo-valor'), barra: li.querySelector('.grupo-barra span') };
    });
    document.getElementById('cerebro-credito').textContent =
      `Datos: Male CNS v1.0 (Janelia, Cambridge, MRC LMB y Google) · CC BY 4.0 · ` +
      `${formato.format(info.puntos)} de ${formato.format(info.neuronas_con_posicion)} neuronas`;
    document.getElementById('chip-datos').textContent =
      `Male CNS v1.0 · ${formato.format(info.neuronas_con_posicion)} neuronas con posición · muestra de ${formato.format(info.puntos)}`;
  })
  .catch((err) => console.error('No se pudo cargar el cerebro', err));

let ultimaLectura = 0;
const graficoDia = crearGraficoDia({
  lienzo: document.getElementById('lienzo-dia'),
  tooltip: document.getElementById('cerebro-dia-tooltip'),
  elPico: document.getElementById('cerebro-dia-pico'),
});
// Lectura en palabras simples de lo que se enciende más ahora
const elLectura = document.getElementById('cerebro-lectura');
let grupoDestacado = null;
function frasePara(id, { fumando, cafe }) {
  if (id === 'vision') return 've muchas tareas abiertas en la pantalla';
  if (id === 'central') return 'el estrés la tiene pensando de más';
  if (id === 'memoria') return 'guarda lo que acaba de terminar';
  if (id === 'mando') return fumando ? 'el cerebro ordena al cuerpo ir por el cigarro' : 'el cerebro le da órdenes al cuerpo';
  if (fumando) return 'mueve la pata para fumar';
  if (cafe) return 'mueve la pata para tomar café';
  return 'mueve las patas para teclear';
}
function escribirLectura(l, estado, fumando, cafe) {
  let html;
  if (estado.terminado) html = 'Día terminado: el cerebro descansa.';
  else if (pausado) html = 'En pausa.';
  else if (l.nivel < 0.16) html = 'Cerebro tranquilo: pocas neuronas encendidas.';
  else {
    // cambia de zona sólo si otra la supera claramente (no parpadea)
    const orden = [...l.porGrupo].sort((a, b) => b.actividad - a.actividad);
    const actual = l.porGrupo.find((g) => g.id === grupoDestacado);
    if (!actual || orden[0].actividad > actual.actividad + 0.06) grupoDestacado = orden[0].id;
    const g = l.porGrupo.find((x) => x.id === grupoDestacado);
    html = `Se enciende más <span class="lectura-zona" style="--c: ${GRUPOS_VISUALES[g.id].color}"><span class="grupo-punto"></span>${g.nombre}</span>: ${frasePara(g.id, { fumando, cafe })}.`;
  }
  if (elLectura.innerHTML !== html) elLectura.innerHTML = html;
}
function refrescarCerebro(dt, estado, fumandoVisible, cafeVisible, ahora) {
  if (!cerebro) return;
  cerebro.actualizar(dt, {
    enCurso: estado.enCurso,
    estres: estado.estres / 100,
    fumando: fumandoVisible,
    cafe: cafeVisible,
    terminado: estado.terminado || pausado,
    hechas: estado.hechas,
  });
  // Oculto (y ya fuera de la pantalla): no se dibuja, así no gasta nada
  if (vista === 'control' && cerebroOculto && factorIzq === 0) return;
  cerebro.renderizar();
  // Los números se actualizan unas 8 veces por segundo (más se vería nervioso)
  if (ahora - ultimaLectura < 125) return;
  ultimaLectura = ahora;
  const l = cerebro.lectura();
  elActivas.textContent = formato.format(l.activas);
  elNivel.textContent = `${Math.round(l.nivel * 100)}%`;
  // El borde del panel también brilla más con más actividad
  elCerebro.style.setProperty('--actividad', l.nivel.toFixed(3));
  const estadoTexto = estado.terminado
    ? 'Descansa'
    : pausado
      ? 'En pausa'
      : fumandoVisible
        ? 'Fuma'
        : cafeVisible
          ? 'Café'
          : 'Trabaja';
  elEstado.textContent = estadoTexto;
  elExMoscaHace.textContent = QUE_HACE[estadoTexto];
  elEstado.classList.toggle('fuma', estadoTexto === 'Fuma');
  elEstado.classList.toggle('cafe', estadoTexto === 'Café');
  escribirLectura(l, estado, fumandoVisible, cafeVisible);
  if (!pausado) graficoDia.registrar(estado.fraccionDelDia, l.nivel, estado.wip);
  graficoDia.dibujar();
  l.porGrupo.forEach((g) => {
    const fila = filasGrupo[g.id];
    if (!fila) return;
    const pct = Math.round(g.actividad * 100);
    fila.valor.textContent = `${pct}%`;
    fila.barra.style.width = `${pct}%`;
  });
}

// ---------- Bucle principal (máximo 60 cuadros por segundo: fluido y sin calentar) ----------
const CUADRO_MINIMO = 1000 / 61;
let ultimoTiempo = performance.now();
let fotoLista = false;
let ultimoCuadro = 0;

function animar(ahora = performance.now()) {
  requestAnimationFrame(animar);
  if (ahora - ultimoCuadro < CUADRO_MINIMO) return;
  ultimoCuadro = ahora;
  const dtReal = Math.min((ahora - ultimoTiempo) / 1000, 0.1);
  ultimoTiempo = ahora;

  if (window.devicePixelRatio !== dprAplicado) ajustarEscena();
  const enExhibicion = vista === 'exhibicion';

  // Un solo reloj para las dos vistas (respeta la pausa y la velocidad)
  if (!pausado && !juego.terminado) {
    juego.tick(dtReal * MIN_SIM_POR_SEG_REAL * VELOCIDADES[indiceVelocidad]);
  }
  // Modo demo: al terminar el día, espera un poco y juega el siguiente con el
  // WIP contrario
  if (modoDemo && juego.terminado && !pausado) {
    esperaDemo += dtReal;
    if (esperaDemo > PAUSA_ENTRE_DIAS_DEMO) {
      ponerWip(siguienteWipDemo());
      reiniciarDia();
    }
  }

  const estado = juego.estado();
  if (!congelado) {
    mosca.update(dtReal, estadoMosca(estado));
    oficina.actualizar(dtReal, estado.estres / 100);
  }
  refrescarUI(estado, mosca.cigarroEnMano());

  controls.update();
  // La foto del escritorio se saca una vez, cuando la mosca ya tiene su pose
  if (!fotoLista) {
    fotoLista = true;
    oficina.ponerFoto(sacarFoto(renderer, mosca.figura));
  }
  // El espacio que ocupa el panel del cerebro cambia de a poco (transición suave)
  const acercar = (actual, objetivo) => {
    const nuevo = actual + (objetivo - actual) * (1 - Math.exp(-7 * dtReal));
    return Math.abs(objetivo - nuevo) < 0.002 ? objetivo : nuevo;
  };
  factorIzq = acercar(factorIzq, enExhibicion || cerebroOculto ? 0 : 1);
  factorDer = acercar(factorDer, enExhibicion || controlesOculto ? 0 : 1);
  aplicarEspacioPanel();
  renderer.render(scene, camera);
  refrescarCerebro(dtReal, estado, mosca.cigarroEnMano(), mosca.tomandoCafe(), ahora);
}

animar();

if (import.meta.env.DEV) {
  window.__mosca = {
    escena: scene,
    estado: () => juego.estado(),
    setWip(v) {
      ponerWip(v);
    },
    forzar({ estres, fumando, cafe, colillas, hechas } = {}) {
      if (estres !== undefined) {
        juego.estres = estres;
        juego.estresMax = Math.max(juego.estresMax, estres);
      }
      if (fumando !== undefined) {
        juego.fumando = fumando;
        juego.minutosFumadaRestantes = fumando ? 1e6 : 0;
      }
      if (cafe !== undefined) {
        juego.tomandoCafe = cafe;
        juego.minutosCafeRestantes = cafe ? 1e6 : 0;
      }
      if (colillas !== undefined) juego.colillas = colillas;
      if (hechas !== undefined) {
        while (juego.hechas.length < hechas && juego.porHacer.length) juego.hechas.push(juego.porHacer.shift());
      }
    },
    pausar(v) {
      pausado = v;
    },
    congelar(v) {
      congelado = v;
    },
    camara(pos, objetivo) {
      camera.position.set(...pos);
      controls.target.set(...(objetivo ?? CAMARA_INICIAL.objetivo.toArray()));
      controls.update();
    },
    // Avanza sólo la animación de la mosca (sin el reloj del juego), útil para
    // capturas en un navegador lento.
    avanzar(segundos, paso = 1 / 60) {
      const estado = juego.estado();
      for (let t = 0; t < segundos; t += paso) {
        mosca.update(paso, estadoMosca(estado));
        oficina.actualizar(paso, estado.estres / 100);
      }
      refrescarUI(estado, mosca.cigarroEnMano());
    },
    choques: (opciones) => revisarChoques(scene, opciones),
    vista: (v) => cambiarVista(v, true),
    ocultarCerebro: (v) => alternarCerebro(v),
    ocultarControles: (v) => alternarControles(v),
    calorCafe: () => oficina.calorCafe(),
    holguraManilla: () => mosca.holguraManilla(),
    cigarrosSinColilla: () => mosca.cigarrosSinColilla(),
    // Salta casi al final del día (para probar el loop de exhibición)
    posCabeza: () => mosca.cabeza.getWorldPosition(new THREE.Vector3()).toArray(),
    diaExhibicion: (w) => {
      ponerWip(w);
      reiniciarDia();
    },
    demo: (v) => alternarDemo(v),
    pausado: () => pausado,
    // Juega el resto del día de una vez (para probar resúmenes)
    completarDia: () => {
      while (!juego.terminado) juego.tick(1);
    },
    // Juega N minutos del día de una vez, con las reglas normales (para
    // capturas a media jornada sin forzar nada)
    adelantar: (minutos) => {
      const fin = juego.minutoActual + minutos;
      while (!juego.terminado && juego.minutoActual < fin) juego.tick(0.15);
    },
    casiFin: () => (juego.minutoActual = 18 * 60 - 2),
    camaraInfo: () => ({ pos: camera.position.toArray(), obj: controls.target.toArray(), aspect: camera.aspect }),
    cerebro: () => cerebro?.lectura(),
    reencuadrar() {
      camera.position.copy(CAMARA_INICIAL.posicion);
      controls.target.copy(CAMARA_INICIAL.objetivo);
      controls.update();
    },
  };
}
