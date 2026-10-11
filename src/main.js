import './style.css';
import * as THREE from 'three';
import { crearEscena, CAMARA_INICIAL } from './scene.js';
import { crearOficina } from './office.js';
import { crearMosca } from './fly.js';
import { DayBrain } from './brain.js';
import { revisarChoques } from './choques.js';
import { cargarDatosCerebro, crearCerebro, GRUPOS_VISUALES } from './cerebro.js';
import { POS_CENICERO, CENTRO_PANTALLA, ESCALA_MONITOR } from './layout.js';

const CLAVE_STORAGE = 'mosca-del-wip-dias';
const MIN_SIM_POR_SEG_REAL = 540 / 60; // día de 540 min simulados en 60s reales a x1

const canvas = document.getElementById('lienzo-3d');
const { scene, camera, renderer, controls } = crearEscena(canvas);
const oficina = crearOficina(scene, { anisotropia: renderer.capabilities.getMaxAnisotropy() });
const mosca = crearMosca(scene);

const elWip = document.getElementById('wip');
const elWipValor = document.getElementById('wip-valor');
const elBtnPausa = document.getElementById('btn-pausa');
const elBtnVelocidad = document.getElementById('btn-velocidad');
const elBtnReiniciar = document.getElementById('btn-reiniciar');
const elReloj = document.getElementById('reloj-texto');
const elBarraDia = document.getElementById('barra-dia-relleno');
const elHechas = document.getElementById('m-hechas');
const elColillas = document.getElementById('m-colillas');
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

// ---------- Vistas: "control" (normal) y "exhibición" (pantalla completa) ----------
const WIP_EXHIBICION = 9;
const PAUSA_FIN_EXHIBICION = 5; // segundos mostrando el resumen antes de repetir
const elEscena = document.getElementById('escena');
const elVelo = document.getElementById('velo');
const elExWip = document.getElementById('ex-wip');
const elExHora = document.getElementById('ex-hora');
const elExHechas = document.getElementById('ex-hechas');
const elExColillas = document.getElementById('ex-colillas');
const elExEstres = document.getElementById('ex-estres');
const elExFin = document.getElementById('ex-fin');
const elExFinTexto = document.getElementById('ex-fin-texto');
let vista = 'control';
let guardadoControl = null; // el juego del usuario mientras se ve la exhibición
let finExhibicion = 0;
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

function pintarTabla(dias) {
  elTablaBody.innerHTML = '';
  elBtnBorrar.hidden = !dias.length;
  if (!dias.length) {
    elTablaBody.innerHTML = '<tr class="vacia"><td colspan="5">Juega un día completo para comparar</td></tr>';
    return;
  }
  dias.forEach((d, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.wip}</td><td>${d.hechas}</td><td>${d.colillas}</td><td>${d.estresMax}%</td>`;
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
  const sano = v <= 3;
  elWipNota.textContent = sano ? 'Dentro del límite sano' : 'Sobre el límite sano (3)';
  elWipNota.classList.toggle('alerta', !sano);
  document.getElementById('panel').classList.toggle('wip-alto', !sano);
}

elWip.addEventListener('input', () => {
  pintarWip();
  juego.setWip(Number(elWip.value));
});
pintarWip();

elBtnPausa.addEventListener('click', () => {
  pausado = !pausado;
  elBtnPausa.textContent = pausado ? 'Reanudar' : 'Pausa';
  elBtnPausa.classList.toggle('activo', pausado);
});

elBtnVelocidad.addEventListener('click', () => {
  indiceVelocidad = (indiceVelocidad + 1) % VELOCIDADES.length;
  elBtnVelocidad.textContent = `x${VELOCIDADES[indiceVelocidad]}`;
});

elBtnReiniciar.addEventListener('click', () => {
  juego = new DayBrain(Number(elWip.value));
  diaYaRegistrado = false;
  colillasPintadas = 0;
  elBanner.classList.add('oculto');
  oficina.limpiarColillas();
});

function refrescarUI(estado, cigarroEnMano) {
  elReloj.textContent = estado.hora;
  elBarraDia.style.width = `${Math.round(estado.fraccionDelDia * 100)}%`;
  elHechas.textContent = estado.hechas;
  elColillas.textContent = estado.colillas;
  elEstres.textContent = estado.nivel.nombre;
  elEstres.style.color = estado.nivel.color;
  elBarraEstres.style.width = `${Math.round(estado.estres)}%`;
  elBarraEstres.style.background = estado.nivel.color;

  oficina.actualizarKanban(estado);
  oficina.actualizarPilaTareas(estado.terminado ? 0 : estado.enCurso);
  oficina.actualizarReloj(estado.fraccionDelDia);

  // El cigarro que la mosca tiene en la mano llega al cenicero cuando lo termina
  const colillasEnCenicero = Math.max(0, estado.colillasVisibles - (cigarroEnMano ? 1 : 0));
  while (colillasPintadas < colillasEnCenicero) {
    oficina.agregarColilla();
    colillasPintadas++;
  }

  if (vista === 'exhibicion') {
    elExWip.textContent = `WIP ${estado.wip ?? WIP_EXHIBICION}`;
    elExHora.textContent = estado.hora;
    elExHechas.textContent = `${estado.hechas} terminadas`;
    elExColillas.textContent = `${estado.colillas} colillas`;
    elExEstres.textContent = estado.nivel.nombre;
    elExEstres.style.color = estado.nivel.color;
    return;
  }

  if (estado.terminado && !diaYaRegistrado) {
    diaYaRegistrado = true;
    guardarDia(juego.resumenFinal());
    elBanner.classList.remove('oculto');
  }
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
let factorPanel = cerebroOculto ? 0 : 1; // 1 = el panel ocupa su espacio
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

function aplicarEspacioPanel() {
  if (vista === 'exhibicion' || factorPanel < 0.002) {
    camera.zoom = 1;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    return;
  }
  const w = elEscena.clientWidth;
  const h = elEscena.clientHeight;
  // ¿Dónde quedaría el borde izquierdo de la mosca con el encuadre normal?
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
  let xMin = Infinity;
  for (const e of silueta) {
    _v.copy(e).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camBase.projectionMatrix);
    xMin = Math.min(xMin, ((_v.x + 1) / 2) * w);
  }
  const izquierda = elCerebro.offsetLeft + elCerebro.offsetWidth + 16;
  const derecha = elPanelControl.getBoundingClientRect().left - 8;
  const c = w / 2;
  let zoom = 1;
  let dx = 0;
  if (xMin < izquierda && derecha > izquierda) {
    zoom = Math.min(1, Math.max(0.7, (derecha - izquierda) / (derecha - xMin)));
    dx = izquierda - c - (xMin - c) * zoom;
  }
  const dy = (1 - zoom) * h * 0.3;
  const f = factorPanel;
  camera.zoom = 1 + (zoom - 1) * f;
  camera.setViewOffset(w, h, -dx * f, -dy * f, w, h);
  camera.updateProjectionMatrix();
}

function pintarCerebroOculto() {
  document.body.classList.toggle('cerebro-oculto', cerebroOculto);
  document.getElementById('btn-ocultar-cerebro').setAttribute('aria-expanded', String(!cerebroOculto));
}

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
function encuadrarExhibicion() {
  // La mosca (sin la silla), la pantalla con el kanban y el cenicero
  _caja.setFromObject(mosca.figura);
  const anchoPantalla = 0.49 * ESCALA_MONITOR;
  _caja.expandByPoint(_p.copy(CENTRO_PANTALLA).add(new THREE.Vector3(anchoPantalla, 0.36 * ESCALA_MONITOR, 0)));
  _caja.expandByPoint(_p.copy(CENTRO_PANTALLA).add(new THREE.Vector3(-anchoPantalla, 0.36 * ESCALA_MONITOR, 0)));
  _caja.expandByPoint(_p.copy(POS_CENICERO).add(new THREE.Vector3(0.12, 0, 0.12)));
  const centro = _caja.getCenter(new THREE.Vector3());
  const direccion = CAMARA_INICIAL.posicion.clone().sub(CAMARA_INICIAL.objetivo).normalize();
  const esquinas = [];
  for (const x of [_caja.min.x, _caja.max.x])
    for (const y of [_caja.min.y, _caja.max.y]) for (const z of [_caja.min.z, _caja.max.z]) esquinas.push(new THREE.Vector3(x, y, z));
  // El rótulo de abajo ocupa un poco: dejo más margen abajo
  for (let d = 1.5; d < 14; d += 0.02) {
    camera.position.copy(centro).addScaledVector(direccion, d);
    camera.lookAt(centro);
    camera.updateMatrixWorld();
    const entra = esquinas.every((e) => {
      _p.copy(e).project(camera);
      return Math.abs(_p.x) < 0.97 && _p.y < 0.95 && _p.y > -0.84;
    });
    if (entra) break;
  }
  controls.target.copy(centro);
  controls.update();
}

// ---------- Cambio de vista ----------
function reponerCenicero() {
  oficina.limpiarColillas();
  colillasPintadas = 0;
}

function nuevoDiaExhibicion() {
  juego = new DayBrain(WIP_EXHIBICION);
  reponerCenicero();
  finExhibicion = 0;
  elExFin.classList.add('oculto');
}

function aplicarVista(nueva) {
  if (nueva === vista) return;
  if (nueva === 'exhibicion') {
    guardadoControl = { juego, diaYaRegistrado };
    nuevoDiaExhibicion();
    // Se puede rotar y hacer zoom con el mouse, igual que en Control
    controls.maxDistance = 12;
  } else {
    ({ juego, diaYaRegistrado } = guardadoControl);
    guardadoControl = null;
    reponerCenicero();
    controls.maxDistance = 7;
    camera.position.copy(CAMARA_INICIAL.posicion);
    controls.target.copy(CAMARA_INICIAL.objetivo);
  }
  vista = nueva;
  document.body.classList.toggle('exhibicion', nueva === 'exhibicion');
  ajustarEscena();
  if (nueva === 'exhibicion') encuadrarExhibicion();
  controls.update();
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
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement && e.key !== 'Escape') {
    if (e.target.type !== 'range') return;
  }
  if (e.key === 'e' || e.key === 'E') cambiarVista();
  if (e.key === 'b' || e.key === 'B') alternarCerebro();
  if (e.key === 'Escape' && vista === 'exhibicion') cambiarVista('control');
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
function refrescarCerebro(dt, estado, fumandoVisible, ahora) {
  if (!cerebro) return;
  cerebro.actualizar(dt, {
    enCurso: estado.enCurso,
    estres: estado.estres / 100,
    fumando: fumandoVisible,
    terminado: estado.terminado,
    hechas: estado.hechas,
  });
  // Oculto (y ya fuera de la pantalla): no se dibuja, así no gasta nada
  if (vista === 'control' && cerebroOculto && factorPanel === 0) return;
  cerebro.renderizar();
  // Los números se actualizan unas 8 veces por segundo (más se vería nervioso)
  if (ahora - ultimaLectura < 125) return;
  ultimaLectura = ahora;
  const l = cerebro.lectura();
  elActivas.textContent = formato.format(l.activas);
  elNivel.textContent = `${Math.round(l.nivel * 100)}%`;
  const estadoTexto = estado.terminado ? 'Descansa' : fumandoVisible ? 'Fuma' : 'Trabaja';
  elEstado.textContent = estadoTexto;
  elEstado.classList.toggle('fuma', estadoTexto === 'Fuma');
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
let ultimoCuadro = 0;

function animar(ahora = performance.now()) {
  requestAnimationFrame(animar);
  if (ahora - ultimoCuadro < CUADRO_MINIMO) return;
  ultimoCuadro = ahora;
  const dtReal = Math.min((ahora - ultimoTiempo) / 1000, 0.1);
  ultimoTiempo = ahora;

  if (window.devicePixelRatio !== dprAplicado) ajustarEscena();
  const enExhibicion = vista === 'exhibicion';
  if (enExhibicion) {
    if (!juego.terminado) juego.tick(dtReal * MIN_SIM_POR_SEG_REAL);
    else {
      // Día de ejemplo terminado: muestro el resumen y empiezo otro
      if (finExhibicion === 0) {
        const r = juego.resumenFinal();
        elExFinTexto.textContent = `${r.hechas} tareas terminadas · ${r.colillas} colillas · estrés máximo ${r.estresMax}%. Empieza otro día…`;
        elExFin.classList.remove('oculto');
      }
      finExhibicion += dtReal;
      if (finExhibicion > PAUSA_FIN_EXHIBICION) nuevoDiaExhibicion();
    }
  } else if (!pausado && !juego.terminado) {
    juego.tick(dtReal * MIN_SIM_POR_SEG_REAL * VELOCIDADES[indiceVelocidad]);
  }

  const estado = juego.estado();
  if (!congelado) {
    mosca.update(dtReal, { fumando: estado.fumando, estres: estado.estres / 100 });
    oficina.actualizar(dtReal);
  }
  refrescarUI(estado, mosca.cigarroEnMano());

  controls.update();
  // El espacio que ocupa el panel del cerebro cambia de a poco (transición suave)
  const objetivoPanel = enExhibicion || cerebroOculto ? 0 : 1;
  factorPanel += (objetivoPanel - factorPanel) * (1 - Math.exp(-7 * dtReal));
  if (Math.abs(objetivoPanel - factorPanel) < 0.002) factorPanel = objetivoPanel;
  aplicarEspacioPanel();
  renderer.render(scene, camera);
  refrescarCerebro(dtReal, estado, mosca.cigarroEnMano(), ahora);
}

animar();

if (import.meta.env.DEV) {
  window.__mosca = {
    escena: scene,
    estado: () => juego.estado(),
    setWip(v) {
      elWip.value = String(v);
      elWip.dispatchEvent(new Event('input'));
    },
    forzar({ estres, fumando, colillas, hechas } = {}) {
      if (estres !== undefined) {
        juego.estres = estres;
        juego.estresMax = Math.max(juego.estresMax, estres);
      }
      if (fumando !== undefined) {
        juego.fumando = fumando;
        juego.minutosFumadaRestantes = fumando ? 1e6 : 0;
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
        mosca.update(paso, { fumando: estado.fumando, estres: estado.estres / 100 });
        oficina.actualizar(paso);
      }
      refrescarUI(estado, mosca.cigarroEnMano());
    },
    choques: (opciones) => revisarChoques(scene, opciones),
    vista: (v) => cambiarVista(v, true),
    ocultarCerebro: (v) => alternarCerebro(v),
    // Salta casi al final del día (para probar el loop de exhibición)
    posCabeza: () => mosca.cabeza.getWorldPosition(new THREE.Vector3()).toArray(),
    diaExhibicion: (w) => {
      juego = new DayBrain(w);
      reponerCenicero();
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
