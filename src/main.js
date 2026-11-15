import './style.css';
import * as THREE from 'three';
import { crearEscena, CAMARA_INICIAL } from './scene.js';
import { crearOficina } from './office.js';
import { crearMosca } from './fly.js';
import { DayBrain } from './brain.js';
import { revisarChoques } from './choques.js';
import { cargarDatosCerebro, cargarActividadReal, crearCerebro, GRUPOS_VISUALES } from './cerebro.js';
import { sacarFoto } from './foto.js';
import { crearGraficoDia } from './grafico.js';
import { POS_CENICERO, POS_PILA, CENTRO_PANTALLA, ESCALA_MONITOR } from './layout.js';
import { leerIdioma, marcarIdioma, elegirIdioma, formatoNumero, rutaEnIdioma } from './idioma.js';
import { tx, ponerIdiomaJuego, nombreNivel, zona, prepararPagina, traducirPagina } from './juego-textos.js';
import { iniciarCelular, esCelular, vistaCelular } from './celular.js';
import { crearRecorrido } from './recorrido.js';

// ---------- Idioma: español (siempre al llegar) o inglés ----------
// Se decide antes de armar la oficina, así el kanban, el póster y los
// post-its se dibujan desde el principio en el idioma elegido. La página
// guarda antes sus textos en español, para volver a ellos exactos.
let idioma = leerIdioma();
marcarIdioma(idioma);
ponerIdiomaJuego(idioma);
prepararPagina();
if (idioma === 'en') traducirPagina('en');
ponerEnlacesInicio();
// Números como se escriben en cada idioma: 1.328 en español, 1,328 en inglés
let miles = formatoNumero(idioma);

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
const elTiempoNota = document.getElementById('m-tiempo-nota'); // " (normales)" con urgencias (8.3)
const elEficiencia = document.getElementById('m-eficiencia');
const elEstres = document.getElementById('m-estres');
const elBarraEstres = document.getElementById('barra-estres-relleno');
const elTablaBody = document.getElementById('tabla-dias-body');
const elBanner = document.getElementById('banner-fin-dia');
const elBannerUrgencias = document.getElementById('banner-urgencias');
const elBannerUrgenciasHechas = document.getElementById('banner-urgencias-hechas');
const elBannerUrgenciasTardo = document.getElementById('banner-urgencias-tardo');
const elWipNota = document.getElementById('wip-nota');
const elAvisoEmpezar = document.getElementById('aviso-empezar');

const VELOCIDADES = [1, 2, 4];
let indiceVelocidad = 0;
// El día parte detenido: el reloj corre recién al apretar Empezar (pedido de
// Felipe, 2026-10-25: antes partía solo al entrar)
let pausado = true;
let empezado = false;
// (8.7) En el celular, antes de empezar, la oficina se achica sobre la tarjeta
// de inicio: ver medirEncajeAviso, más abajo
let encajeAviso = null; // { zoom, dx, dy } en píxeles de la escena, o null
let soltandoEncaje = 0; // cuándo empezó a volver (performance.now())
const SOLTAR_ENCAJE_MS = 450;
const ALTO_MINIMO_ENCAJE = 90; // menos que esto, la mosca quedaría muy chica
let congelado = false; // sólo para capturas: deja la animación quieta
let relojDetenido = false; // sólo para capturas: el reloj del juego no avanza (la mosca sí se anima)
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
const elExHora = document.getElementById('ex-hora');
const elExRitmo = document.getElementById('ex-ritmo');
const elRotulo = document.querySelector('.rotulo-escena');
const elExFin = document.getElementById('ex-fin');
const elExFinTexto = document.getElementById('ex-fin-texto');
const elExFinTitulo = document.getElementById('ex-fin-titulo');
const elExFinFilas = document.getElementById('ex-fin-filas');
const elExInicio = document.getElementById('ex-inicio');
const elExInicioTipo = document.getElementById('ex-inicio-tipo');
const elExInicioTexto = document.getElementById('ex-inicio-texto');
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

// Copia en memoria de los días para cuando el navegador no deja guardar
// (por ejemplo, con todas las cookies bloqueadas). Así la tabla y el resumen
// del final tienen todos los días de esta visita, no solo el último.
let diasEnMemoria = null;

function cargarDias() {
  if (diasEnMemoria) return diasEnMemoria.slice(-MAX_DIAS);
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
    diasEnMemoria = null;
  } catch {
    // sin almacenamiento disponible: la tabla igual se ve en esta sesión
    diasEnMemoria = recortados;
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

let diasPintados = []; // los de la tabla (para repintarla en otro idioma)
function pintarTabla(dias) {
  diasPintados = dias;
  elTablaBody.innerHTML = '';
  elBtnBorrar.hidden = !dias.length;
  if (!dias.length) {
    elTablaBody.innerHTML = `<tr class="vacia"><td colspan="7">${tx('tablaVacia')}</td></tr>`;
    return;
  }
  // El mejor día (más tareas terminadas en total, normales más urgencias:
  // decisión de Felipe del 2026-11-04, docs/etapa8-4.md sección 9) se destaca
  const mejor = dias.length > 1 ? Math.max(...dias.map((d) => d.hechas)) : null;
  dias.forEach((d, i) => {
    const tr = document.createElement('tr');
    if (d.hechas === mejor) {
      tr.className = 'mejor-dia';
      tr.title = tx('mejorDia');
    }
    tr.innerHTML = `<td>${d.wip}</td>${celdaHechas(d)}<td>${formatoTiempo(tiempoDelDia(d), true)}</td><td>${d.colillas}</td><td>${d.cafes ?? '–'}</td><td>${d.estresMax}%</td>`;
    const celda = document.createElement('td');
    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'quitar-fila';
    quitar.textContent = '×';
    quitar.title = tx('quitarDia');
    quitar.setAttribute('aria-label', tx('quitarDiaNombre', i + 1, d.wip));
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

// Un día con urgencias terminadas (8.3): en las tablas, "15 + 3" (y al pasar
// el mouse, "15 normales + 3 urgencias"); su tiempo por tarea es el de las
// normales. Sin urgencias, lo mismo de siempre.
// (8.4) Si alguna urgencia quedó sin terminar a las 18:00, la celda lo dice:
// "10 + 2 (1 a medias)" (los días guardados antes de la 8.4 no traen el dato).
// (8.14) "(1 a medias)" va debajo y en chico, para que la tabla quepa en el panel
const aMediasDe = (d) => d.urgenciasSinTerminar ?? 0;
const celdaHechas = (d) =>
  d.urgencias > 0 || aMediasDe(d) > 0
    ? `<td title="${tx('hechasConUrgencias', d.hechasNormales, d.urgencias, aMediasDe(d))}">${d.hechasNormales} + ${d.urgencias}${aMediasDe(d) ? `<small class="celda-nota">${tx('aMediasCorto', aMediasDe(d))}</small>` : ''}</td>`
    : `<td>${d.hechas}</td>`;
const tiempoDelDia = (d) => (d.urgencias > 0 ? d.tiempoPorTareaNormales : d.tiempoPorTarea);

// "Terminadas" en el panel: un número; con urgencias terminadas, "15 + 3" y
// al pasar el mouse "15 normales + 3 urgencias" (8.3)
// (8.14) Con urgencias, "11 + 5" con el "+ 5" en chico, como en la vista
// grande. En el cuadro del panel (computador) "11 + 5" se partía en "11 +" y
// "5": ahora cabe en una línea (con un espacio fino antes del "+") y, si
// alguna vez no cupiera, baja entero "+ 5"
function pintarHechas(el, estado) {
  const urgentes = estado.urgencias.terminadas;
  const aMedias = urgenciasAMedias(estado);
  const conUrgencias = urgentes > 0 || aMedias > 0;
  const texto = conUrgencias ? `${estado.hechasNormales} + ${urgentes}` : String(estado.hechas);
  if (el.textContent !== texto) {
    if (conUrgencias) el.innerHTML = `${estado.hechasNormales} <span class="metrica-extra">+ ${urgentes}</span>`;
    else el.textContent = texto;
  }
  const titulo = urgentes || aMedias ? tx('hechasConUrgencias', estado.hechasNormales, urgentes, aMedias) : null;
  if (titulo === null) {
    if (el.hasAttribute('title')) el.removeAttribute('title');
  } else if (el.getAttribute('title') !== titulo) el.setAttribute('title', titulo);
}

// El rótulo "Tiempo por tarea" dice " (normales)" cuando hubo urgencias (8.3)
function pintarNotaNormales(el, hubo) {
  const texto = hubo ? tx('soloNormales') : '';
  if (el.textContent !== texto) el.textContent = texto;
  if (el.hidden !== !hubo) el.hidden = !hubo;
}

// Borrar todo pide confirmar con un segundo toque (sin ventanas emergentes)
let esperandoConfirmacion = null;
elBtnBorrar.addEventListener('click', () => {
  if (esperandoConfirmacion) {
    clearTimeout(esperandoConfirmacion);
    esperandoConfirmacion = null;
    elBtnBorrar.textContent = tx('borrarHistorial');
    elBtnBorrar.classList.remove('confirmar');
    escribirDias([]);
    return;
  }
  elBtnBorrar.textContent = tx('confirmarBorrado');
  elBtnBorrar.classList.add('confirmar');
  esperandoConfirmacion = setTimeout(() => {
    esperandoConfirmacion = null;
    elBtnBorrar.textContent = tx('borrarHistorial');
    elBtnBorrar.classList.remove('confirmar');
  }, 3000);
});

escribirDias(cargarDias());

// Carga: tareas a la vez contra el límite sostenible (3). Verde hasta 3, amarillo
// con 4 o 5 y rojo desde 6 (los mismos cortes del estrés: Tranquila, Ocupada,
// Estresada o más).
const LIMITE_SANO = 3;
const nivelCarga = (n) => (n <= LIMITE_SANO ? 'ok' : n <= 5 ? 'medio' : 'alto');

function pintarWip() {
  const v = Number(elWip.value);
  elWipValor.textContent = v;
  elWip.style.setProperty('--relleno', `${((v - 1) / 9) * 100}%`);
  document.getElementById('panel').dataset.carga = nivelCarga(v);
  pintarNotaWip(v, juego.enCurso.length);
}

// Bajo el slider: dentro o sobre el límite sostenible. Si bajaron el límite y
// todavía tiene más tareas abiertas, avisa que está terminando lo empezado (no
// toma nuevas hasta quedar bajo él)
function pintarNotaWip(limite, enCurso) {
  const drenando = enCurso > limite;
  const carga = drenando ? enCurso : limite;
  const texto = drenando
    ? tx('notaTerminando', enCurso)
    : limite <= LIMITE_SANO
      ? tx('notaDentro', LIMITE_SANO)
      : tx('notaSobre', LIMITE_SANO);
  if (elWipNota.textContent !== texto) elWipNota.textContent = texto;
  elWipNota.dataset.carga = nivelCarga(carga);
}

// Un solo lugar para cambiar el WIP (slider, teclas 1–9/0 o modo demo).
// Cambiarlo antes de las 09:15 rearma el día con ese WIP (con sus propias
// tareas de ayer); después, es un cambio a mitad del día. Así un día anotado
// como "WIP 10" de verdad partió con 10 tareas de ayer.
const MINUTO_ELEGIR_WIP = 9 * 60 + 15;
function ponerWip(valor) {
  const v = Math.min(10, Math.max(1, Math.round(valor)));
  elWip.value = String(v);
  if (v !== juego.wip && !juego.terminado && juego.minutoActual <= MINUTO_ELEGIR_WIP) armarDia({ reanudar: false });
  else juego.setWip(v);
  pintarWip();
}
elWip.addEventListener('input', () => ponerWip(Number(elWip.value)));
pintarWip();

// Lo primero que hace correr el reloj ("Empezar el día", Enter, la pausa,
// Espacio, Reiniciar día o el modo demo) empieza el día y saca la tarjeta de
// inicio, que no vuelve a salir en los días siguientes (8.1)
function alternarPausa() {
  pausado = !pausado;
  if (!pausado && !empezado) {
    empezado = true;
    // Si el foco estaba en la tarjeta que se va, pasa al botón de pausa, lo
    // siguiente útil, para que el teclado no vuelva al comienzo (revisión
    // final, S13)
    const focoEnTarjeta = elAvisoEmpezar.contains(document.activeElement);
    elAvisoEmpezar.hidden = true;
    document.documentElement.classList.remove('por-empezar');
    soltarEncajeAviso();
    if (focoEnTarjeta) elBtnPausa.focus({ preventScroll: true });
  }
  pintarBotonPausa();
}
function pintarBotonPausa() {
  elBtnPausa.textContent = tx(!empezado ? 'empezar' : pausado ? 'reanudar' : 'pausa');
  elBtnPausa.classList.toggle('activo', pausado);
}
document.documentElement.classList.add('por-empezar');
pintarBotonPausa();
elBtnPausa.addEventListener('click', alternarPausa);
document.getElementById('btn-empezar').addEventListener('click', () => {
  if (pausado) alternarPausa();
});

// En el celular la tarjeta de inicio va sobre la oficina, entre los botones
// de arriba y la hoja (el estado de la mosca se esconde hasta empezar: todavía
// no tiene nada que contar, y la hoja lleva solo las tareas a la vez). Desde
// la 8.8 cada línea lleva su dibujo y la tarjeta completa es más alta, así que
// se acomoda sola, soltando de a poco lo que menos falta hace (los niveles de
// más abajo; las reglas, en src/celular.css):
// 1. Primero busca dejarle a la mosca su lugar arriba de la tarjeta: completa
//    si cabe; si no, sin "¿Qué es esto?" ni la línea "Al final verás…"
//    (sin-final); si todavía no, también sin el recuadro del cigarro y el café
//    (sin-reglas).
// 2. Si la mosca no cabe de ninguna forma (un iPhone SE con las barras de
//    Safari, el teléfono girado), la tarjeta va sobre la oficina, como
//    siempre, con lo más que quepa entre los botones de arriba y la hoja: de
//    completa hasta, con el zoom de pantalla o la letra muy agrandada, solo el
//    botón.
const TAPAN_AVISO = ['cel-volver', 'cel-controles', 'cel-pestanas', 'panel'].map((id) => document.getElementById(id));
const ALTO_COMODO_MOSCA = 100; // el lugar que se busca dejarle a la mosca sobre la tarjeta (con 110, en inglés y en 390 × 664 quedaba a 2 px de soltar una línea más)
const NIVELES_AVISO = [[], ['sin-final'], ['sin-final', 'sin-reglas'], ['sin-detalle'], ['sin-detalle', 'sin-titulo'], ['sin-detalle', 'sin-titulo', 'solo-boton']];
function ajustarAvisoEmpezar() {
  const poner = (nivel) => {
    elAvisoEmpezar.classList.remove('sin-final', 'sin-reglas', 'sin-detalle', 'sin-titulo', 'solo-boton');
    elAvisoEmpezar.classList.add(...nivel);
  };
  poner([]);
  if (!esCelular() || elAvisoEmpezar.hidden) return medirEncajeAviso();
  const lugarMosca = () => {
    const [arriba, abajo] = lugarSobreAviso();
    return abajo - arriba;
  };
  const choca = () => {
    const a = elAvisoEmpezar.getBoundingClientRect();
    return TAPAN_AVISO.some((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    });
  };
  // 1. con la mosca arriba: un lugar cómodo y, si no se puede, el mínimo
  for (const minimo of [ALTO_COMODO_MOSCA, ALTO_MINIMO_ENCAJE])
    for (const nivel of NIVELES_AVISO.slice(0, 3)) {
      poner(nivel);
      if (lugarMosca() >= minimo && !choca()) return medirEncajeAviso();
    }
  // 2. sobre la oficina: lo más que quepa sin chocar
  for (const nivel of NIVELES_AVISO) {
    poner(nivel);
    if (!choca()) break;
  }
  medirEncajeAviso();
}
// El lugar libre sobre la tarjeta de inicio, en píxeles de la oficina: desde
// los botones de arriba hasta la tarjeta, con 10 px de aire en cada borde
function lugarSobreAviso() {
  const escena = document.getElementById('escena').getBoundingClientRect();
  const aviso = elAvisoEmpezar.getBoundingClientRect();
  const arriba = Math.max(...['cel-volver', 'cel-controles'].map((id) => document.getElementById(id).getBoundingClientRect().bottom)) - escena.top + 10;
  return [arriba, aviso.top - escena.top - 10];
}
// (cuando cambia la oficina o la tarjeta: al girar, al medir la hoja, al
// volver a la pestaña Oficina o al cambiar de idioma; en el cuadro siguiente,
// como medirHoja en src/celular.js)
let ajusteAviso = 0;
const vigiaAviso = new ResizeObserver(() => {
  cancelAnimationFrame(ajusteAviso);
  ajusteAviso = requestAnimationFrame(ajustarAvisoEmpezar);
});
vigiaAviso.observe(document.getElementById('escena'));
vigiaAviso.observe(elAvisoEmpezar);

elBtnVelocidad.addEventListener('click', () => {
  indiceVelocidad = (indiceVelocidad + 1) % VELOCIDADES.length;
  elBtnVelocidad.textContent = `x${VELOCIDADES[indiceVelocidad]}`;
});

// Día nuevo con el WIP del slider. Con R (y en el modo demo) parte corriendo:
// si estaba en pausa, se reanuda. Al elegir el WIP antes de las 09:15 se
// respeta la pausa.
function armarDia({ reanudar = true } = {}) {
  if (reanudar && pausado) alternarPausa();
  juego = new DayBrain(Number(elWip.value));
  diaYaRegistrado = false;
  esperaDemo = 0;
  colillasPintadas = 0;
  avisoUrgenciaHasta = 0; // (8.3) el día nuevo parte sin urgencias
  elBanner.classList.add('oculto');
  elExFin.classList.add('oculto');
  oficina.limpiarColillas();
  empezarLimpio();
}
const reiniciarDia = () => armarDia();
elBtnReiniciar.addEventListener('click', reiniciarDia);

// ---------- La urgencia desde la pantalla (Etapa 8.3, 2026-11-03) ----------
// El botón "Mándale una urgencia" manda una tarea urgente con la regla
// principal de la 8.2 (src/brain.js, mandarUrgencia): entra por encima del
// límite, la mosca suelta lo que hacía y trabaja sólo en ella hasta terminarla.
// Se ve sólo mientras corre el día (de 09:00 a 18:00, también en pausa); una a
// la vez (apagado mientras dura) y a lo más 5 al día, que es lo que se simuló.
// Al rearmar el día (el WIP antes de las 09:15, R) parte sin urgencias.
const URGENCIAS_POR_DIA_MAX = 5;
const AVISO_URGENCIA_MS = 4000; // cuánto dura "Llegó una urgencia" en el tablero
const elBtnUrgencia = document.getElementById('btn-urgencia');
let avisoUrgenciaHasta = 0;
let urgenciaPintada = '';
function puedeMandarUrgencia(estado) {
  const u = estado.urgencias;
  return empezado && !estado.terminado && u.enCurso === 0 && u.esperando === 0 && u.llegadas < URGENCIAS_POR_DIA_MAX;
}
function mandarUrgencia() {
  if (!puedeMandarUrgencia(juego.estado())) return false;
  juego.mandarUrgencia();
  avisoUrgenciaHasta = performance.now() + AVISO_URGENCIA_MS;
  refrescarUI(juego.estado(), mosca.cigarroEnMano());
  return true;
}
elBtnUrgencia.addEventListener('click', mandarUrgencia);
function pintarBotonUrgencia(estado) {
  const u = estado.urgencias;
  const visible = empezado && !estado.terminado;
  const enCurso = u.enCurso > 0 || u.esperando > 0;
  const tope = u.llegadas >= URGENCIAS_POR_DIA_MAX;
  const texto = enCurso ? tx('urgenciaEnCurso') : tope ? tx('urgenciaTope', URGENCIAS_POR_DIA_MAX) : tx('urgenciaBoton');
  const clave = `${visible} ${texto}`;
  if (clave === urgenciaPintada) return;
  urgenciaPintada = clave;
  elBtnUrgencia.hidden = !visible;
  // Apagado con aria-disabled y no con disabled, para que el foco del teclado
  // no se pierda mientras dura la urgencia (revisión final, S13). Se ve igual
  // y el clic no hace nada, porque mandarUrgencia revisa la misma regla.
  if (enCurso || tope) elBtnUrgencia.setAttribute('aria-disabled', 'true');
  else elBtnUrgencia.removeAttribute('aria-disabled');
  elBtnUrgencia.textContent = texto;
}

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
    // Todas sus tareas en curso están bloqueadas: espera sin teclear
    espera: estado.esperando && !descansa,
  };
}

function refrescarUI(estado, cigarroEnMano) {
  elReloj.textContent = estado.hora;
  elBarraDia.style.width = `${Math.round(estado.fraccionDelDia * 100)}%`;
  pintarHechas(elHechas, estado);
  elColillas.textContent = estado.colillas;
  elCafes.textContent = estado.cafes;
  // Tiempo por tarea: "–" hasta que termine la primera tarea del día (con
  // urgencias, el de las normales; el rótulo lo dice)
  elTiempo.textContent = formatoTiempo(estado.tiempoPorTareaNormales);
  pintarNotaNormales(elTiempoNota, estado.urgencias.terminadas > 0);
  elEficiencia.textContent = formatoEficiencia(estado.eficiencia);
  elEstres.textContent = nombreNivel(estado.nivel.nombre);
  elEstres.style.color = estado.nivel.color;
  elBarraEstres.style.width = `${Math.round(estado.estres)}%`;
  elBarraEstres.style.background = estado.nivel.color;

  // (el tablero muestra "Llegó una urgencia" unos segundos después del botón,
  // mientras la urgencia siga en curso y el día no haya cerrado)
  const avisoUrgencia = performance.now() < avisoUrgenciaHasta && estado.urgencias.enCurso > 0 && !estado.terminado;
  oficina.actualizarKanban(avisoUrgencia ? { ...estado, avisoUrgencia: true } : estado);
  pintarBotonUrgencia(estado);
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

  // Rótulo de la exhibición: sólo la hora (los números de la oficina van
  // grandes en el panel de la derecha; cada número aparece una sola vez)
  elExHora.textContent = estado.hora;
  // Tarjeta "Estado de la mosca" (exhibición): nivel, barra de estrés y qué
  // está haciendo
  elExMosca.style.setProperty('--nivel', estado.nivel.color);
  elExMoscaNivel.textContent = nombreNivel(estado.nivel.nombre);
  elExMoscaPct.textContent = `${Math.round(estado.estres)}%`;
  elExMoscaBarra.style.width = `${Math.round(estado.estres)}%`;
  elExMosca.classList.toggle('fin', estado.terminado);
  const queHace = estado.terminado
    ? 'Descansa'
    : !empezado
      ? 'Lista'
      : pausado
        ? 'En pausa'
        : cigarroEnMano
          ? 'Fuma'
          : mosca.tomandoCafe()
            ? 'Café'
            : estado.esperando
              ? 'Espera'
              : 'Trabaja';
  if (elExMosca.dataset.hace !== queHace) {
    elExMosca.dataset.hace = queHace;
    elExMoscaHace.textContent = tx('queHace')[queHace];
  }
  const velocidad = VELOCIDADES[indiceVelocidad];
  elExRitmo.hidden = velocidad === 1;
  elExRitmo.textContent = `x${velocidad}`;
  const situacion = estado.terminado ? 'terminado' : pausado ? 'pausa' : 'vivo';
  elRotulo.dataset.estado = situacion;
  // Aviso de arriba: en vivo o en pausa, y si son pocas o muchas tareas a la
  // vez (el número está en la Carga)
  elExInicioTipo.textContent = tx(modoDemo ? 'modoDemo' : !empezado ? 'porEmpezar' : pausado ? 'enPausa' : 'enVivo');
  // (una urgencia va por encima del límite: no cuenta como "sobre el límite", 8.3)
  const normalesEnCurso = estado.enCurso - estado.urgencias.enCurso;
  const drenando = normalesEnCurso > estado.wip && !estado.terminado;
  pintarNotaWip(estado.wip, estado.terminado ? 0 : normalesEnCurso);
  const textoAviso = drenando
    ? tx('avisoTerminando', estado.wip)
    : estado.wip > LIMITE_SANO
      ? tx('muchasTareas')
      : tx('pocasTareas');
  if (elExInicioTexto.textContent !== textoAviso) elExInicioTexto.textContent = textoAviso;
  elExInicio.dataset.carga = nivelCarga(drenando ? normalesEnCurso : estado.wip);
  elExInicio.classList.toggle('oculto', estado.terminado);
  pintarCifras(estado);

  // Fin del día (en cualquier vista): se guarda en "Días jugados" y se
  // muestra el resumen
  if (estado.terminado && !diaYaRegistrado) {
    diaYaRegistrado = true;
    // (8.4) con cuántas urgencias quedaron sin terminar al cierre
    guardarDia({ ...juego.resumenFinal(), urgenciasSinTerminar: urgenciasAMedias(estado) });
    llenarResumenDelDia();
  }
  document.body.classList.toggle('dia-terminado', estado.terminado);
  elBanner.classList.toggle('oculto', !estado.terminado);
  elExFin.classList.toggle('oculto', !estado.terminado);
  anunciarFinDelDia(estado.terminado);
}

// El fin del día también se le dice al lector de pantalla (revisión final,
// S14). El aviso se ve pero no es región viva, así que su texto, que ya está
// traducido, se copia a una región escondida que sí lo es. En Exhibición lo
// dice su propio resumen (#ex-fin).
const elAnuncio = document.getElementById('anuncio-juego');
let finAnunciado = false;
function anunciarFinDelDia(terminado) {
  if (!terminado) {
    if (finAnunciado) {
      finAnunciado = false;
      elAnuncio.textContent = '';
    }
    return;
  }
  if (finAnunciado || vista === 'exhibicion') return;
  finAnunciado = true;
  // un momento después, cuando el aviso ya tiene sus líneas de urgencias
  setTimeout(() => {
    if (!finAnunciado) return;
    const partes = [...elBanner.querySelectorAll('p')]
      .filter((p) => !p.hidden)
      .map((p) => p.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    elAnuncio.textContent = partes.join(' ');
  }, 300);
}

// Eficiencia: de cada hora, cuántos minutos rinden de verdad ("38 min")
function formatoEficiencia(e) {
  return e === null || e === undefined ? '–' : `${Math.round(e * 60)} min`;
}

// ---------- Números de la oficina en el panel del cerebro ----------
// En Exhibición van grandes junto al cerebro (todo el día). En Control ya
// están en el panel de la derecha: aquí sólo aparecen al terminar el día,
// como resumen, en lugar del cerebro apagado.
const elCifrasTitulo = document.getElementById('cifras-titulo');
const elCifraCarga = document.getElementById('cifra-carga');
const cifras = {
  carga: document.getElementById('cf-carga'),
  hechas: document.getElementById('cf-hechas'),
  urgencias: document.getElementById('cf-urgencias'), // (8.14) "+ 3 urgencias · 1 a medias", bajo las normales
  tardaron: document.getElementById('cf-tardaron'), // (8.14) cuánto tardó cada urgencia, bajo el tiempo por tarea
  tiempo: document.getElementById('cf-tiempo'),
  tiempoNota: document.getElementById('cf-tiempo-nota'), // (8.3) " (normales)"
  eficiencia: document.getElementById('cf-eficiencia'),
  colillas: document.getElementById('cf-colillas'),
  cafes: document.getElementById('cf-cafes'),
};
const elEficienciaBarra = document.getElementById('cf-eficiencia-barra');
const segmentosCarga = [...document.querySelectorAll('#carga-segmentos i')];
const conUnidades = (el, texto) => {
  // (8.4) una nota entre paréntesis, como "(1 quedó a medias)", va entera en chico
  const [principal, nota] = texto.split(/ (?=\()/);
  let html = principal.replace(/ ?([a-záéíóúñ]+)/g, '<small> $1</small>');
  if (nota) html += `<small> ${nota}</small>`;
  if (el.innerHTML !== html) el.innerHTML = html;
};
// (8.4) Urgencias que quedaron a medias: las que llegaron y no terminaron,
// contadas solo cuando el día ya cerró (durante el día están en curso)
const urgenciasAMedias = (estado) => (estado.terminado ? estado.urgencias.llegadas - estado.urgencias.terminadas : 0);
const escribir = (el, texto) => {
  if (el.textContent !== texto) el.textContent = texto;
};
// (8.14) "+ 3 urgencias · 1 a medias": cada parte va entera y, si no caben en
// una línea, la segunda baja completa (el punto queda al final de la primera)
const elCifras = document.querySelector('.cifras');
function sinCortar(el, texto) {
  const partes = texto.split(' · ');
  if (el.textContent !== partes.join('\u00a0· ')) {
    el.innerHTML = partes.map((parte, i) => `<span class="sin-corte">${parte}${i < partes.length - 1 ? '\u00a0·' : ''}</span>`).join(' ');
  }
  if (el.hidden !== !texto) el.hidden = !texto;
}
function pintarCifras(estado) {
  escribir(elCifrasTitulo, tx(estado.terminado ? 'resumenDelDia' : 'hoyEnLaOficina'));
  escribir(cifras.carga, String(estado.enCurso));
  elCifraCarga.dataset.carga = nivelCarga(estado.enCurso);
  segmentosCarga.forEach((s, i) => s.classList.toggle('lleno', i < estado.enCurso));
  // Con urgencias (8.3), el número grande son las normales y, en chico, "+ 3
  // urgencias · 1 a medias" (8.14: antes iba todo en una línea, "15 normales +
  // 3 urgencias (1 quedó a medias)", y en la vista grande se montaba sobre
  // Colillas y Cafés). Al terminar el día, cuánto tardó cada urgencia desde
  // que llegó va como segunda línea de "Tiempo por tarea"
  const urgentes = estado.urgencias.terminadas;
  const aMedias = urgenciasAMedias(estado);
  const conUrgencias = urgentes > 0 || aMedias > 0;
  escribir(cifras.hechas, String(conUrgencias ? estado.hechasNormales : estado.hechas));
  sinCortar(cifras.urgencias, conUrgencias ? tx('urgenciasExtra', urgentes, aMedias) : '');
  if (elCifras.classList.contains('con-urgencias') !== conUrgencias) elCifras.classList.toggle('con-urgencias', conUrgencias);
  const tardaron = urgentes && estado.terminado ? tx('urgenciasTardaron', Math.round(estado.urgencias.tardaron), urgentes) : '';
  escribir(cifras.tardaron, tardaron);
  if (cifras.tardaron.hidden !== !tardaron) cifras.tardaron.hidden = !tardaron;
  // En grande, las unidades van más chicas que los números ("7 h 46 min")
  conUnidades(cifras.tiempo, estado.tiempoPorTareaNormales === null ? '–' : formatoTiempo(estado.tiempoPorTareaNormales));
  pintarNotaNormales(cifras.tiempoNota, urgentes > 0);
  conUnidades(cifras.eficiencia, formatoEficiencia(estado.eficiencia));
  elEficienciaBarra.style.width = `${Math.round((estado.eficiencia ?? 0) * 100)}%`;
  escribir(cifras.colillas, String(estado.colillas));
  escribir(cifras.cafes, String(estado.cafes));
}

// Resumen del día en la exhibición: el día recién jugado y los anteriores
// (los mismos de "Días jugados")
let diasDelResumen = null; // los que muestra (para repintarlo en otro idioma)
function llenarResumenDelDia() {
  diasDelResumen = cargarDias();
  pintarResumen();
  pintarSiguienteDia();
}

function pintarResumen() {
  const dias = diasDelResumen;
  const actual = dias[dias.length - 1];
  if (!actual) return;
  elExFinTitulo.textContent = tx('finDelDiaWip', actual.wip);
  elExFinFilas.innerHTML = '';
  dias.slice(-3).forEach((d, i, lista) => {
    const tr = document.createElement('tr');
    // La fila de hoy se marca para distinguirla de los días anteriores
    const hoy = i === lista.length - 1;
    if (hoy) tr.className = 'actual';
    tr.innerHTML = `<th>WIP ${d.wip}${hoy ? ` <span class="fila-hoy">${tx('hoy')}</span>` : ''}</th>${celdaHechas(d)}<td>${formatoTiempo(tiempoDelDia(d), true)}</td><td>${d.colillas}</td><td>${d.cafes ?? '–'}</td><td>${d.estresMax}%</td>`;
    elExFinFilas.appendChild(tr);
  });
  // El aviso de fin del día (Control y celular): con urgencias terminadas
  // (8.3), las dos cifras y cuánto tardó cada una; si no, el de siempre
  const aMedias = aMediasDe(actual);
  const hubo = actual.urgencias > 0 || aMedias > 0;
  if (hubo) {
    elBannerUrgenciasHechas.textContent = `${tx('hechasConUrgencias', actual.hechasNormales, actual.urgencias, aMedias)}.`;
    // cuánto tardó cada una, solo si alguna terminó (8.4)
    elBannerUrgenciasTardo.textContent = actual.urgencias > 0 ? `${tx('urgenciasTardaron', actual.urgenciasTardaron, actual.urgencias)}.` : '';
    elBannerUrgenciasTardo.hidden = !(actual.urgencias > 0);
  }
  elBannerUrgencias.hidden = !hubo;
}

function siguienteWipDemo() {
  return Number(elWip.value) > 3 ? WIP_DEMO.bajo : WIP_DEMO.alto;
}

// Lo que sigue (se recuerda lo último que dijo, para repintarlo en otro idioma)
let siguientePintado = null;
function pintarSiguienteDia() {
  siguientePintado = modoDemo ? { demo: true, wip: siguienteWipDemo() } : { demo: false };
  escribirSiguienteDia();
}
function escribirSiguienteDia() {
  elExFinTexto.textContent = siguientePintado.demo ? tx('demoSigue', siguientePintado.wip) : tx('otroDia');
}

// ---------- Tamaño de los lienzos y encuadre ----------
// Resolución: en Control, la real de la pantalla (y se actualiza si la
// ventana pasa a otra pantalla); en Exhibición, siempre al doble (nítida
// aunque la pantalla no sea Retina). En el celular, a lo más 1,5 veces (así
// no se calienta).
function ratioEscena() {
  const dpr = window.devicePixelRatio || 1;
  if (esCelular()) return Math.min(Math.max(dpr, 1), 1.5);
  return vista === 'exhibicion' ? 2 : Math.min(Math.max(dpr, 1), 2);
}
let dprAplicado = 0;
let tamanoAplicado = ''; // el último tamaño de la oficina que se le dio al lienzo
const tamanoEscena = () => `${Math.max(1, elEscena.clientWidth)}×${Math.max(1, elEscena.clientHeight)}`;
function ajustarEscena() {
  const w = Math.max(1, elEscena.clientWidth);
  const h = Math.max(1, elEscena.clientHeight);
  tamanoAplicado = `${w}×${h}`;
  dprAplicado = window.devicePixelRatio;
  renderer.setPixelRatio(ratioEscena());
  renderer.setSize(w, h); // también fija el tamaño visible del lienzo
  camera.aspect = w / h;
  aplicarEspacioPanel();
  // (solo en desarrollo, si scripts/probar-salto.mjs lo pidió: cada vez que
  // el lienzo se rehace)
  if (import.meta.env.DEV && window.__cuadrosMosca) window.__cuadrosMosca.push({ tipo: 'ajuste', t: Math.round(performance.now()), lienzo: [w, h] });
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
// Silueta de la mosca: una muestra de puntos reales de su cuerpo. Se vuelve a
// mirar cada tanto, porque la mosca cambia de postura (fuma, toma café), pero
// la imagen solo se reacomoda si la silueta cambió de verdad, y entonces lo
// hace de a poco. (8.8, pedido de Felipe: antes de empezar, la oficina "se iba
// corriendo y pegaba un salto". Cada 2 segundos se medía de nuevo a la mosca,
// que respira y se mueve un poco, y en ventanas angostas la imagen se
// reacomodaba de golpe, hasta 1 píxel. Lo comprueba scripts/probar-quieta.mjs)
let silueta = [];
let siluetaAntes = null; // la silueta de la que viene, mientras se funde con la nueva
let cambioSilueta = 0; // cuándo cambió (performance.now())
let cuadrosSilueta = 0;
const FUNDIDO_SILUETA_MS = 600;
function muestrearSilueta() {
  const puntos = [];
  mosca.grupo.updateMatrixWorld(true);
  mosca.grupo.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.geometry?.attributes?.position) return;
    const pos = o.geometry.attributes.position;
    const paso = Math.max(1, Math.floor(pos.count / 24));
    for (let i = 0; i < pos.count; i += paso) puntos.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
  });
  return puntos;
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
  if (vista === 'exhibicion' || esCelular() || (fi < 0.002 && fd < 0.002)) {
    // Sin paneles: la escena ocupa toda la pantalla con el encuadre oficial
    // (en el celular no hay paneles al lado: la oficina tiene su recuadro)
    camera.zoom = 1;
    camera.clearViewOffset();
    // ...salvo en el celular antes de empezar: la oficina, más chica, sobre la
    // tarjeta de inicio (8.7)
    const k = esCelular() ? cuantoEncaje() : 0;
    if (k > 0) {
      const w = elEscena.clientWidth;
      const h = elEscena.clientHeight;
      camera.zoom = 1 + (encajeAviso.zoom - 1) * k;
      camera.setViewOffset(w, h, -encajeAviso.dx * k, -encajeAviso.dy * k, w, h);
    }
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
  const arribaIzq = elCerebro.offsetTop - 8;
  const abajoIzq = elCerebro.offsetTop + elCerebro.offsetHeight + 8;
  const arribaDer = elPanelControl.offsetTop - 8;
  const abajoDer = elPanelControl.offsetTop + elPanelControl.offsetHeight + 8;
  // Hasta dónde llega un grupo de puntos, en píxeles de la pantalla: a la
  // izquierda (a la altura del cerebro) y a la derecha (a la del panel)
  const extremos = (puntos) => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of puntos) {
      _v.copy(p).applyMatrix4(camera.matrixWorldInverse);
      // lo que queda detrás de la cámara (al rotarla) no cuenta
      if (_v.z > -camera.near) continue;
      _v.applyMatrix4(camBase.projectionMatrix);
      if (Math.abs(_v.x) > 1.6 || Math.abs(_v.y) > 1.6) continue;
      const x = ((_v.x + 1) / 2) * w;
      const y = ((1 - _v.y) / 2) * h;
      if (y > arribaIzq && y < abajoIzq) min = Math.min(min, x);
      if (y > arribaDer && y < abajoDer) max = Math.max(max, x);
    }
    return [min, max];
  };
  // Cada 2 segundos se mira de nuevo a la mosca. Si su silueta llega casi a
  // lo mismo que la que ya se usa (respira, mueve la cabeza), no se toca nada
  if (cuadrosSilueta-- <= 0) {
    cuadrosSilueta = 120;
    const nueva = muestrearSilueta();
    if (!silueta.length) silueta = nueva;
    else {
      const [a0, a1] = extremos(silueta);
      const [b0, b1] = extremos(nueva);
      const holgura = Math.max(6, h * 0.008);
      const cambio = (a, b) => (Number.isFinite(a) || Number.isFinite(b)) && !(Math.abs(a - b) < holgura);
      if (cambio(a0, b0) || cambio(a1, b1)) {
        siluetaAntes = silueta;
        silueta = nueva;
        cambioSilueta = performance.now();
      }
    }
  }
  let [xMin, xMax] = extremos(silueta);
  // ...y si cambió de verdad, la imagen pasa de la silueta de antes a la
  // nueva en 0,6 segundos (de una vez con movimiento reducido)
  if (siluetaAntes) {
    const t = (performance.now() - cambioSilueta) / FUNDIDO_SILUETA_MS;
    if (t >= 1 || matchMedia('(prefers-reduced-motion: reduce)').matches) siluetaAntes = null;
    else {
      const k = t * t * (3 - 2 * t);
      const [v0, v1] = extremos(siluetaAntes);
      const mezclar = (antes, ahora) => (Number.isFinite(antes) && Number.isFinite(ahora) ? antes + (ahora - antes) * k : ahora);
      xMin = mezclar(v0, xMin);
      xMax = mezclar(v1, xMax);
    }
  }
  const [fijoMin, fijoMax] = extremos(puntosFijos);
  xMin = Math.min(xMin, fijoMin);
  xMax = Math.max(xMax, fijoMax);

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

// Si el foco estaba en lo que se esconde, pasa al botón que hace lo contrario
// (revisión final, S13)
function seguirConElFoco(ocultar, foco, panel, botonOcultar, botonMostrar) {
  if (ocultar && panel.contains(foco)) botonMostrar.focus({ preventScroll: true });
  else if (!ocultar && foco === botonMostrar) botonOcultar.focus({ preventScroll: true });
}

function alternarControles(ocultar = !controlesOculto) {
  if (vista !== 'control' || esCelular()) return;
  const foco = document.activeElement;
  controlesOculto = ocultar;
  try {
    localStorage.setItem(CLAVE_CONTROLES_OCULTO, ocultar ? '1' : '0');
  } catch {
    // sin almacenamiento: sólo dura esta sesión
  }
  pintarControlesOculto();
  seguirConElFoco(ocultar, foco, document.getElementById('panel'), document.getElementById('btn-ocultar-controles'), document.getElementById('btn-mostrar-controles'));
}
document.getElementById('btn-ocultar-controles').addEventListener('click', () => alternarControles(true));
document.getElementById('btn-mostrar-controles').addEventListener('click', () => alternarControles(false));
pintarControlesOculto();

function alternarCerebro(ocultar = !cerebroOculto) {
  if (vista !== 'control' || esCelular()) return;
  const foco = document.activeElement;
  cerebroOculto = ocultar;
  try {
    localStorage.setItem(CLAVE_CEREBRO_OCULTO, ocultar ? '1' : '0');
  } catch {
    // sin almacenamiento: sólo dura esta sesión
  }
  pintarCerebroOculto();
  seguirConElFoco(ocultar, foco, document.getElementById('cerebro'), document.getElementById('btn-ocultar-cerebro'), document.getElementById('btn-mostrar-cerebro'));
}
document.getElementById('btn-ocultar-cerebro').addEventListener('click', () => alternarCerebro(true));
document.getElementById('btn-mostrar-cerebro').addEventListener('click', () => alternarCerebro(false));
pintarCerebroOculto();
// (en el celular, la oficina también se encuadra sola en su recuadro)
// El primer aviso llega siempre, aunque el tamaño no haya cambiado: si es el
// mismo que ya tiene el lienzo, no se toca nada (rehacer el lienzo lo deja en
// blanco un cuadro y volver a encuadrar movía la cámara justo después del
// primer cuadro: el "salto" de la Etapa 8.6)
new ResizeObserver(() => {
  if (tamanoEscena() === tamanoAplicado) return;
  ajustarEscena();
  if (esCelular()) encuadrarSinPerderGiro();
  else if (vista === 'exhibicion') encuadrarExhibicion();
}).observe(elEscena);
// La mosca toma su postura (sentada, las patas en su lugar y la cabeza
// mirando el monitor) antes del primer encuadre y del primer cuadro: el
// encuadre del celular y el espacio de los paneles se calculan con puntos de
// su cuerpo, y así el primer cuadro ya es el definitivo (8.6). Es un segundo
// de su animación, en pasos de 0,05 s (antes giraba la cabeza al abrir)
const posturaInicial = estadoMosca(juego.estado());
for (let i = 0; i < 20; i++) mosca.update(0.05, posturaInicial);
ajustarEscena();

// En exhibición la cámara mira desde el mismo ángulo oficial, pero se
// acerca o aleja para que la mosca, el monitor y el cenicero entren bien en
// el recuadro (que es más angosto que la pantalla completa).
const _caja = new THREE.Box3();
const _p = new THREE.Vector3();
function puntosVisibles(objeto, porPieza = 24) {
  const puntos = [];
  // (también los de más arriba: antes del primer cuadro la silla todavía no
  // había puesto a la mosca en su lugar, y el primer encuadre del celular
  // miraba a una mosca fantasma en el centro de la oficina, 8.6)
  objeto.updateWorldMatrix(true, true);
  objeto.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    for (let n = o; n; n = n.parent) if (!n.visible) return;
    const pos = o.geometry.attributes.position;
    const paso = Math.max(1, Math.floor(pos.count / porPieza));
    for (let i = 0; i < pos.count; i += paso) puntos.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
  });
  return puntos;
}

// El zoom con dos dedos en el celular, contra la distancia de la vista inicial
// (con la mitad, la mosca llena la pantalla; con el doble, se ve el escritorio
// entero y la mosca sigue a la vista)
const ZOOM_CELULAR = { cerca: 0.5, lejos: 2 };
// Lo que debe verse completo: la mosca (sin la silla), la pantalla con el
// kanban y el cenicero. Se usan puntos reales de la mosca (no su caja), así
// la cámara queda lo más cerca posible.
function puntosEncuadre() {
  const puntos = puntosVisibles(mosca.figura);
  const anchoPantalla = 0.49 * ESCALA_MONITOR;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      puntos.push(CENTRO_PANTALLA.clone().add(new THREE.Vector3(sx * anchoPantalla, sy * 0.33 * ESCALA_MONITOR, 0)));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) puntos.push(POS_CENICERO.clone().add(new THREE.Vector3(sx * 0.17, 0.06, sz * 0.17)));
  return puntos;
}
function encuadrarExhibicion() {
  // (se mide con la imagen sin achicar ni correr: el encaje de la tarjeta en
  // el celular o los paneles del computador no cambian la vista inicial; en el
  // próximo cuadro aplicarEspacioPanel los vuelve a poner)
  camera.zoom = 1;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const puntos = puntosEncuadre();
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
  // En el celular, los dos dedos acercan la oficina hasta la mitad de esta
  // distancia y la alejan hasta el doble: la mosca nunca se pierde (8.6)
  if (esCelular()) {
    controls.minDistance = d * ZOOM_CELULAR.cerca;
    controls.maxDistance = d * ZOOM_CELULAR.lejos;
  }
  controls.update();
  guardarCasa();
}

// ---------- Celular, antes de empezar: la mosca sobre la tarjeta (8.7) ----------
// Pedido de Felipe (2026-11-07): la tarjeta de inicio entra completa en un
// celular de 375 × 667 sin tapar a la mosca. La tarjeta es más alta que el
// espacio que deja la mosca encuadrada, así que mientras no empieza el día la
// imagen de la oficina se achica y sube (sin mover la cámara, como con los
// paneles del computador) hasta que la mosca, la pantalla con el kanban y el
// cenicero entran entre los botones de arriba y la tarjeta. Si el espacio es
// muy poco (celular girado, letra muy grande), queda como antes. Al empezar el
// día vuelve a su encuadre en medio segundo (de golpe con movimiento reducido).
// (las variables están arriba, junto a "empezado": la escena se ajusta antes
// de llegar aquí)
function medirEncajeAviso() {
  encajeAviso = null;
  if (!esCelular() || empezado || elAvisoEmpezar.hidden) return;
  const escena = elEscena.getBoundingClientRect();
  const aviso = elAvisoEmpezar.getBoundingClientRect();
  if (!aviso.width || !escena.height) return; // (otra pestaña: no se ve)
  const [arriba, abajo] = lugarSobreAviso();
  if (abajo - arriba < ALTO_MINIMO_ENCAJE) return;
  // Dónde queda todo con el encuadre de siempre
  const w = escena.width;
  const h = escena.height;
  camera.zoom = 1;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of puntosEncuadre()) {
    _p.copy(p).project(camera);
    const x = ((_p.x + 1) / 2) * w;
    const y = ((1 - _p.y) / 2) * h;
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  if (!Number.isFinite(y1) || y1 <= abajo) return; // la tarjeta no tapa nada
  const zoom = Math.min(1, (abajo - arriba) / (y1 - y0), (w - 2 * 10) / (x1 - x0));
  // (con el zoom, cada punto se acerca al centro de la escena; después se
  // corre: la mosca y su escritorio quedan al centro del espacio libre)
  encajeAviso = {
    zoom,
    dx: w / 2 - (w / 2 + ((x0 + x1) / 2 - w / 2) * zoom),
    dy: (arriba + abajo) / 2 - (h / 2 + ((y0 + y1) / 2 - h / 2) * zoom),
  };
  soltandoEncaje = 0;
}
// 1 mientras la tarjeta está; baja a 0 en medio segundo al empezar el día
function cuantoEncaje() {
  if (!encajeAviso) return 0;
  if (!soltandoEncaje) return 1;
  const t = Math.min(1, (performance.now() - soltandoEncaje) / SOLTAR_ENCAJE_MS);
  if (t >= 1) {
    encajeAviso = null;
    return 0;
  }
  return (1 - t) ** 3; // (sale rápido y llega suave)
}
function soltarEncajeAviso() {
  if (!encajeAviso) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) encajeAviso = null;
  else soltandoEncaje = performance.now();
}

// ---------- Volver la oficina a su vista inicial ----------
// Arrastrar sobre la escena gira la oficina (para mirarla desde otro lado;
// arrastrar el cerebro NO la mueve). Doble clic en la escena, o el botón
// "Vista inicial" (aparece sólo si se movió), la devuelve suave a su vista
// inicial: la oficial en Control y el encuadre de la mosca en Exhibición.
const elBtnVistaInicial = document.getElementById('btn-vista-inicial');
let casa = { pos: CAMARA_INICIAL.posicion.clone(), obj: CAMARA_INICIAL.objetivo.clone() };
let volviendo = null;
function guardarCasa() {
  casa = { pos: camera.position.clone(), obj: controls.target.clone() };
  volviendo = null;
}
// En el celular el recuadro de la oficina cambia de tamaño (al girar el
// teléfono o, en pantallas bajas, al cambiar de pestaña): se calcula la nueva
// vista inicial, pero si la oficina estaba girada con el dedo, sigue girada
// (si ya iba volviendo a su vista inicial, llega directo a la nueva)
function encuadrarSinPerderGiro() {
  const girada = camera.position.distanceTo(casa.pos) > 0.05 || controls.target.distanceTo(casa.obj) > 0.05;
  if (!girada || volviendo) return encuadrarExhibicion();
  const pos = camera.position.clone();
  const obj = controls.target.clone();
  encuadrarExhibicion();
  camera.position.copy(pos);
  controls.target.copy(obj);
  controls.update();
}
function volverAVistaInicial() {
  // corta la inercia que dejó el mouse (si no, la oficina seguiría girando
  // un poco después de volver)
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = true;
  volviendo = casa;
}
canvas.addEventListener('dblclick', volverAVistaInicial);
elBtnVistaInicial.addEventListener('click', volverAVistaInicial);
// Si la toman con el mouse mientras vuelve, manda el mouse
controls.addEventListener('start', () => (volviendo = null));
function moverCamaraACasa(dt) {
  if (volviendo) {
    const k = 1 - Math.exp(-7 * dt);
    camera.position.lerp(volviendo.pos, k);
    controls.target.lerp(volviendo.obj, k);
    if (camera.position.distanceTo(volviendo.pos) < 0.003 && controls.target.distanceTo(volviendo.obj) < 0.003) {
      camera.position.copy(volviendo.pos);
      controls.target.copy(volviendo.obj);
      volviendo = null;
    }
  }
  const lejos = camera.position.distanceTo(casa.pos) > 0.05 || controls.target.distanceTo(casa.obj) > 0.05;
  if (elBtnVistaInicial.hidden === lejos) elBtnVistaInicial.hidden = !lejos;
}

// ---------- La página del juego no se acerca con los dedos (8.6) ----------
// Dos dedos sobre la oficina la acercan a ella (la escena 3D, con su tope);
// la página misma nunca se agranda (antes se agrandaba, se corría hacia el
// lado y la oficina se perdía). Android lo cumple con el viewport de
// jugar/index.html; el iPhone lo ignora, y ahí lo frenan touch-action
// (src/style.css) y, por si acaso, esto: los gestos de Safari y cualquier
// movimiento con dos dedos (la oficina no lo nota: escucha los punteros, no
// estos avisos). Solo con pantalla táctil: en el computador, el pellizco del
// trackpad sigue como siempre.
if (navigator.maxTouchPoints > 0 || matchMedia('(any-pointer: coarse)').matches) {
  const sinZoom = (e) => e.preventDefault();
  for (const tipo of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(tipo, sinZoom, { passive: false });
  document.addEventListener('touchmove', (e) => e.touches.length > 1 && e.preventDefault(), { passive: false });
}

// ---------- Día nuevo ----------
// La mosca, el cerebro y el gráfico parten del estado real del juego (sin
// arrastrar el día anterior)
function empezarLimpio() {
  mosca.reiniciar(juego.estado().estres / 100);
  cerebro?.reiniciar();
  graficoDia.reiniciar();
  colillasMarcadas = 0;
  cafesMarcados = 0;
  zonasDia = {};
  encendidasDia = 0;
  fraccionZonas = juego.fraccionDelDia;
  registrarDia();
}

// ---------- Cambio de vista: sólo cambia cómo se ve, no la partida ----------
function alternarDemo(activar = !modoDemo) {
  if (vista !== 'exhibicion') return;
  modoDemo = activar;
  esperaDemo = 0;
  if (activar && !empezado) alternarPausa();
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
  // (8.8) Al entrar a Exhibición, "Volver a la oficina" late dos veces: así se
  // ve por dónde se vuelve (la animación está en src/style.css)
  const elVolverOficina = document.getElementById('btn-volver-oficina');
  elVolverOficina.classList.remove('llamar');
  if (nueva === 'exhibicion') {
    void elVolverOficina.offsetWidth; // (para que la animación parta de nuevo)
    elVolverOficina.classList.add('llamar');
  }
  ajustarEscena();
  if (nueva === 'exhibicion') encuadrarExhibicion();
  controls.update();
  if (nueva === 'control') guardarCasa();
  if (juego.terminado) pintarSiguienteDia();
}

// Transición suave: se funde a oscuro, cambia, y vuelve a aparecer
function cambiarVista(nueva = vista === 'control' ? 'exhibicion' : 'control', inmediato = false) {
  if (cambiandoVista || nueva === vista) return;
  // En el celular no hay Exhibición (la pantalla ya es una sola vista)
  if (esCelular() && nueva === 'exhibicion') return;
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
// "Volver a la oficina" (Exhibición, 2026-10-28): la misma partida en la vista
// normal, sin pausar ni reiniciar. Con teclado, el foco queda en el botón
// Exhibición, para poder volver a entrar
document.getElementById('btn-volver-oficina').addEventListener('click', (e) => {
  const conTeclado = e.detail === 0;
  cambiarVista('control');
  if (conTeclado) setTimeout(() => document.getElementById('btn-exhibicion').focus(), 720);
});
// Un botón apretado con el mouse suelta el foco: así Espacio pausa el juego
// en vez de volver a apretar ese botón (con teclado, el foco se mantiene)
document.addEventListener('click', (e) => {
  const boton = e.target.closest?.('button');
  if (boton && e.detail > 0) boton.blur();
});

window.addEventListener('keydown', (e) => {
  // Con la pregunta de salir abierta, las teclas del juego no hacen nada (Esc
  // la cierra sola: es un <dialog>). Tampoco con el recorrido abierto (8.8),
  // que tiene sus propias teclas (src/recorrido.js)
  if (elSalir.open || recorrido.abierto()) return;
  if (e.target instanceof HTMLInputElement && e.key !== 'Escape') {
    if (e.target.type !== 'range') return;
  }
  // Con la explicación ⓘ abierta, Esc sólo la cierra (no cambia de vista)
  if (e.key === 'Escape' && !elInfo.hidden) {
    alternarInfo(false);
    return;
  }
  // Con Cmd, Ctrl o Alt, las teclas son del navegador (Cmd+C copia), no del
  // juego (revisión final, S12)
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'e' || e.key === 'E') cambiarVista();
  if (e.key === 'b' || e.key === 'B') alternarCerebro();
  if (e.key === 'c' || e.key === 'C') alternarControles();
  if (e.key === 'Escape' && vista === 'exhibicion') cambiarVista('control');
  // Para presentar (en las dos vistas): Espacio pausa/reanuda, R día nuevo,
  // 1–9 y 0 (=10) cambian el WIP; en exhibición, D activa el modo demo
  if (e.code === 'Space' && !(e.target instanceof HTMLButtonElement)) {
    e.preventDefault();
    alternarPausa();
  }
  // Antes del primer día, Enter también lo empieza (lo mismo que "Empezar el
  // día" en la tarjeta de inicio, 8.1); con el foco en un botón o un enlace,
  // Enter hace lo suyo
  if (e.key === 'Enter' && !empezado && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLAnchorElement)) {
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
// La pantalla habla el idioma de la oficina: aquí "neuronas encendidas", una
// frase simple y de qué zonas viene la actividad (de vuelta por pedido de
// Felipe). La neurociencia (limpieza de antenas, relevos, Hz) va al informe.
let cerebro = null;
const elActivas = document.getElementById('c-activas');
const elFrase = document.getElementById('cerebro-frase');
// (la frase, la del día terminado y lo que está haciendo la mosca, en
// palabras, están en src/juego-textos.js: frase, fraseFin y queHace)
// Zonas: qué parte de las neuronas encendidas está en cada una (suman 100 %).
// Durante el día, en vivo; al terminar, el promedio del día.
const elZonasTitulo = document.getElementById('zonas-titulo');
const elZonasSub = document.getElementById('zonas-sub');
const elGrupos = document.getElementById('cerebro-grupos');
const filasGrupo = {};

// Las luces salen de la actividad simulada del cableado real (Etapa 3.3,
// opción A): el cerebro muestra, el juego decide.
cargarDatosCerebro()
  .then(async (datos) => {
    const real = await cargarActividadReal(datos);
    cerebro = crearCerebro(document.getElementById('lienzo-cerebro'), datos, real, {
      topeResolucion: () => (esCelular() ? 1.5 : 2),
    });
    datos.info.grupos.forEach((g) => {
      const li = document.createElement('li');
      li.className = 'grupo';
      li.style.setProperty('--c', GRUPOS_VISUALES[g.id].color);
      li.innerHTML = `<span class="grupo-nombre"><span class="grupo-punto"></span>${zona(g).nombre}</span><span class="grupo-valor">–</span><span class="grupo-barra"><span></span></span>`;
      elGrupos.appendChild(li);
      filasGrupo[g.id] = { g, li, nombre: li.querySelector('.grupo-nombre'), valor: li.querySelector('.grupo-valor'), barra: li.querySelector('.grupo-barra span') };
    });
  })
  .catch((err) => console.error('No se pudo cargar el cerebro', err));

let ultimaLectura = 0;
// Gráfico del día: el estrés, con una marca por cada cigarro y cada café
const graficoDia = crearGraficoDia({
  lienzo: document.getElementById('lienzo-dia'),
  tooltip: document.getElementById('cerebro-dia-tooltip'),
});
let colillasMarcadas = 0;
let cafesMarcados = 0;
// Promedio del día por zona: neuronas encendidas en cada zona, sumadas por
// cada minuto del juego (lo simulado para las tareas abiertas y el café de
// ese minuto). Así no depende de la pantalla ni de si el cerebro está oculto.
let zonasDia = {};
let encendidasDia = 0;
let fraccionZonas = 0;
// Se llama después de cada paso del reloj del juego (no depende de cuántos
// cuadros por segundo dibuje la pantalla)
function registrarDia() {
  graficoDia.registrar(juego.fraccionDelDia, { estres: juego.estres, enCurso: juego.enCurso.length, wip: juego.wip });
  for (; colillasMarcadas < juego.colillas; colillasMarcadas++) graficoDia.marcar(juego.fraccionDelDia, 'cigarro');
  for (; cafesMarcados < juego.cafes; cafesMarcados++) graficoDia.marcar(juego.fraccionDelDia, 'cafe');
  const minutos = (juego.fraccionDelDia - fraccionZonas) * 540;
  fraccionZonas = juego.fraccionDelDia;
  if (minutos < 0) {
    // el reloj volvió atrás: es otro día
    zonasDia = {};
    encendidasDia = 0;
  }
  if (!cerebro || minutos <= 0) return;
  const s = cerebro.situacion({ enCurso: juego.enCurso.length, cafe: juego.tomandoCafe });
  encendidasDia += s.activas * minutos;
  for (const id in s.zonas) zonasDia[id] = (zonasDia[id] ?? 0) + s.zonas[id].activas * minutos;
}

// Porcentajes enteros que suman exactamente 100 (el resto va a los que más
// perdieron al redondear)
function repartirCien(partes) {
  const base = partes.map((p) => Math.floor(p * 100));
  let falta = 100 - base.reduce((a, b) => a + b, 0);
  partes
    .map((p, i) => [p * 100 - base[i], i])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (falta > 0) {
        base[i]++;
        falta--;
      }
    });
  return base;
}

// En vivo (lectura del cerebro) o, con el día terminado, el promedio del día
function pintarZonas(l, terminado) {
  const filas = Object.values(filasGrupo);
  if (!filas.length) return;
  escribir(elZonasTitulo, tx(terminado ? 'zonasDia' : 'zonasAhora'));
  escribir(elZonasSub, tx(terminado ? 'zonasSubDia' : 'zonasSubAhora'));
  const hay = terminado ? encendidasDia > 0 : l.activas > 0;
  const partes = filas.map(({ g }) => {
    if (!hay) return 0;
    return terminado ? (zonasDia[g.id] ?? 0) / encendidasDia : l.porGrupo.find((z) => z.id === g.id).parte;
  });
  const enteros = hay ? repartirCien(partes) : partes;
  filas.forEach(({ g, li, valor, barra }, i) => {
    escribir(valor, hay ? `${enteros[i]}%` : '–');
    barra.style.width = `${(partes[i] * 100).toFixed(1)}%`;
    const z = l.porGrupo.find((x) => x.id === g.id);
    const { nombre, detalle } = zona(g);
    li.title = !hay
      ? tx('zonaSinActividad', nombre, detalle)
      : terminado
        ? tx('zonaPromedio', nombre, detalle, enteros[i])
        : tx('zonaAhora', nombre, detalle, miles.format(z.activas), miles.format(l.activas));
  });
}
// Botón "Centrar": vuelve a la vista inicial y a girar solo
document.getElementById('btn-centrar-cerebro').addEventListener('click', () => {
  cerebro?.centrar();
  soltarFicha();
});
// Botón "Detener / Girar" (lo mismo que un clic en el cerebro). Detener el
// giro no pausa el juego.
const elBtnGirar = document.getElementById('btn-girar-cerebro');
const elBtnGirarTexto = document.getElementById('btn-girar-texto');
elBtnGirar.addEventListener('click', () => {
  if (!cerebro) return;
  if (cerebro.girando()) cerebro.detener();
  else {
    cerebro.girar();
    soltarFicha();
  }
});
let giroPintado = null;
function pintarBotonGiro() {
  const girando = cerebro.girando();
  if (girando === giroPintado) return;
  giroPintado = girando;
  elBtnGirar.classList.toggle('detenido', !girando);
  elBtnGirar.setAttribute('aria-pressed', String(!girando));
  elBtnGirarTexto.textContent = tx(girando ? 'detener' : 'girar');
  elBtnGirar.title = tx(girando ? 'detenerTitulo' : 'girarTitulo');
}

// ---------- "¿Es real?": qué es real y qué es juego, en pocas líneas ----------
const elInfo = document.getElementById('cerebro-info');
const elBtnInfo = document.getElementById('btn-es-real');
function alternarInfo(abrir = elInfo.hidden) {
  elInfo.hidden = !abrir;
  elBtnInfo.setAttribute('aria-expanded', String(abrir));
  if (!abrir) return;
  // Al lado del botón, sin salirse de la pantalla
  const r = elBtnInfo.getBoundingClientRect();
  const w = elInfo.offsetWidth;
  const h = elInfo.offsetHeight;
  const izq = r.right + 12 + w < window.innerWidth - 8 ? r.right + 12 : r.left - 12 - w;
  elInfo.style.left = `${Math.max(8, izq)}px`;
  elInfo.style.top = `${Math.max(8, Math.min(window.innerHeight - h - 8, r.bottom - h))}px`;
}
elBtnInfo.addEventListener('click', (e) => {
  e.stopPropagation();
  alternarInfo();
});
document.getElementById('btn-cerrar-info').addEventListener('click', () => alternarInfo(false));
document.addEventListener('pointerdown', (e) => {
  if (!elInfo.hidden && !elInfo.contains(e.target) && e.target !== elBtnInfo) alternarInfo(false);
});

// ---------- Tarjetita de una neurona (al pasar el cursor o hacer clic) ----------
// Para curiosos y en palabras simples: su nombre y su rol general, y si está
// encendida ahora. Sin Hz ni detalles del circuito (van al informe).
const elFicha = document.getElementById('cerebro-ficha');
const lienzoCerebro = document.getElementById('lienzo-cerebro');
let fichaFija = null; // la que se dejó abierta con un clic
const APODOS = { ANXXX462a: 'Clavicle', GNG197: 'FMIn', AN13B002: 'Dandelion', GNG108: 'Roundup', GNG120: 'Roundtree', GNG588: 'Fdg' };
// [rol general, qué hace] (las palabras, en src/juego-textos.js: roles)
function rolGeneral(n) {
  return tx('roles')[claveRol(n)];
}
function claveRol(n) {
  if (n.rol === 1) return 'antenaSensor';
  if (n.rol === 2 || n.rol === 3) return 'antenaRelevo';
  if (n.rol === 4 || n.rol === 5) return 'ordenPatas';
  if (n.rol === 6) return 'dulceSensor';
  if (n.rol === 7) return 'dulceRelevo';
  if (n.rol === 8) return 'trompita';
  const s = n.superclase;
  if (s === 'descending_neuron') return 'baja';
  if (s === 'ascending_neuron') return 'sube';
  if (s.endsWith('motor')) return 'motora';
  if (s === 'vnc_intrinsic') return 'cordon';
  if (s.includes('sensory')) return 'sensor';
  if (s.startsWith('ol_') || s.startsWith('visual')) return 'vision';
  if (s === 'cb_intrinsic') return 'procesa';
  return 'neurona';
}
let fichaNeurona = null; // la última que mostró (para repintarla en otro idioma)
function escribirFicha(n) {
  fichaNeurona = n;
  const nombre = n.tipo ? `${n.tipo}${APODOS[n.tipo] ? ` (${APODOS[n.tipo]})` : ''}` : tx('neuronaSinNombre');
  const [rol, que] = rolGeneral(n);
  const ahora = tx(n.hz > 0 ? 'encendidaAhora' : 'enReposoAhora');
  const html = `<strong>${nombre}</strong><span class="ficha-linea"><b>${rol}:</b> ${que}</span><span class="ficha-linea ficha-suave">${ahora}</span>`;
  if (html === fichaEscrita) return;
  fichaEscrita = html;
  elFicha.innerHTML = html;
}
let fichaEscrita = '';
function ponerFicha(n, x, y) {
  if (!n) {
    elFicha.hidden = true;
    return;
  }
  escribirFicha(n);
  elFicha.hidden = false;
  const w = elFicha.offsetWidth;
  const h = elFicha.offsetHeight;
  // A la derecha del cursor, salvo que se salga de la pantalla o (en
  // Exhibición) tape los números de la oficina: ahí va a la izquierda
  const lado = vista === 'exhibicion' ? document.querySelector('.cifras').getBoundingClientRect().left : Infinity;
  const izq = x + 16 + w > Math.min(window.innerWidth - 8, lado) ? x - 16 - w : x + 16;
  elFicha.style.left = `${Math.max(8, izq)}px`;
  elFicha.style.top = `${Math.min(window.innerHeight - h - 8, Math.max(8, y - h / 2))}px`;
}
function soltarFicha() {
  fichaFija = null;
  elFicha.hidden = true;
}
lienzoCerebro.addEventListener('pointermove', (e) => {
  if (!cerebro || fichaFija || e.buttons) return;
  ponerFicha(cerebro.neuronaEn(e.clientX, e.clientY), e.clientX, e.clientY);
});
lienzoCerebro.addEventListener('pointerleave', () => {
  if (!fichaFija) elFicha.hidden = true;
});
// Al empezar a arrastrar, la tarjetita que estaba de paso se esconde
lienzoCerebro.addEventListener('pointerdown', () => {
  if (!fichaFija) elFicha.hidden = true;
});
// Un clic detiene el giro (y si fue sobre una neurona, su tarjetita queda
// fija); el clic siguiente lo vuelve a poner a girar y suelta la tarjetita.
// Soltar después de arrastrar no cuenta como clic.
lienzoCerebro.addEventListener('click', (e) => {
  if (!cerebro || cerebro.fueArrastre()) return;
  if (cerebro.girando()) {
    cerebro.detener();
    const n = cerebro.neuronaEn(e.clientX, e.clientY);
    fichaFija = n ? { ...n, x: e.clientX, y: e.clientY } : null;
    ponerFicha(n, e.clientX, e.clientY);
  } else {
    cerebro.girar();
    soltarFicha();
  }
});

function refrescarCerebro(dt, estado, cafeVisible, ahora) {
  // Los números se actualizan unas 8 veces por segundo (más se vería nervioso)
  const toca = ahora - ultimaLectura >= 125;
  if (toca) {
    ultimaLectura = ahora;
    graficoDia.dibujar();
  }
  if (!cerebro) return;
  // El cerebro sólo mira lo que le llega a la antena (las tareas abiertas) y
  // el azúcar del café; las reglas del juego deciden lo demás.
  cerebro.actualizar(dt, { enCurso: estado.enCurso, cafe: cafeVisible, apagado: estado.terminado || pausado });
  pintarBotonGiro();
  // Oculto (y ya fuera de la pantalla) o, en el celular, en otra pestaña: no
  // se dibuja, así no gasta nada
  if (esCelular() ? vistaCelular() !== 'cerebro' : vista === 'control' && cerebroOculto && factorIzq === 0) return;
  cerebro.renderizar();
  if (!toca) return;
  const l = pintarLectura(estado);
  // El borde del panel también brilla más mientras más neuronas disparan
  elCerebro.style.setProperty('--actividad', l.intensidad.toFixed(3));
  // La tarjetita fija se mantiene al día (se enciende y se apaga)
  if (fichaFija) escribirFicha(cerebro.neurona(fichaFija.punto));
}

// Neuronas encendidas, la frase y las zonas (también al cambiar de idioma)
function pintarLectura(estado) {
  const l = cerebro.lectura();
  escribir(elActivas, miles.format(l.activas));
  escribir(elFrase, tx(estado.terminado ? 'fraseFin' : 'frase'));
  pintarZonas(l, estado.terminado);
  return l;
}

// ---------- Botón ES | EN: cambia el idioma sin reiniciar el día ----------
// Hay dos: uno en la cabecera del cerebro y otro que aparece cuando ese panel
// no está (cerebro oculto o exhibición). Hacen lo mismo y se ven iguales.
const botonesIdioma = document.querySelectorAll('[data-idioma]');
function pintarBotonesIdioma() {
  for (const boton of botonesIdioma) boton.setAttribute('aria-pressed', String(boton.dataset.idioma === idioma));
}
pintarBotonesIdioma();
for (const boton of botonesIdioma) boton.addEventListener('click', () => cambiarIdioma(boton.dataset.idioma));

// Los enlaces a la portada ("← Inicio" en Control, la flecha del celular,
// "Salir del juego" de la pregunta y "¿Qué es esto?" de la tarjeta de inicio)
// llevan al mismo idioma del juego (5.2i): en inglés, /en/. (Desde la 8.8,
// "← Inicio" no va en la barra de Exhibición: ahí está "Volver a la oficina")
function ponerEnlacesInicio() {
  for (const a of document.querySelectorAll('.volver-inicio, #cel-volver, #btn-salir-juego, #aviso-que-es')) a.setAttribute('href', rutaEnIdioma('/', idioma));
  // el enlace a la guía del límite WIP, en el panel (Etapa 7): /limite-wip/ o /en/wip-limit/
  for (const a of document.querySelectorAll('[data-guia]')) a.setAttribute('href', rutaEnIdioma('/limite-wip/', idioma));
  // el crédito del cerebro: /creditos/ o /creditos/?lang=en (revisión final, S5)
  for (const a of document.querySelectorAll('.cerebro-credito')) a.setAttribute('href', rutaEnIdioma('/creditos/', idioma));
}

// Antes de ir a la portada, el juego pregunta (2026-10-28, pedido de Felipe:
// quien estaba jugando apretaba "← Inicio" y salía sin querer). Mientras
// pregunta, el día queda en pausa; al seguir jugando, vuelve a correr si
// corría. Abrir el enlace en otra pestaña (Cmd o Ctrl + clic, botón del medio)
// no saca del juego, así que no pregunta.
const elSalir = document.getElementById('salir-juego');
const elSalirTexto = document.getElementById('salir-texto');
let corriaAlPreguntar = false;
function preguntarSalida(e) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  const diaAMedias = empezado && !juego.terminado;
  elSalirTexto.textContent = tx(diaAMedias ? 'salirConDia' : 'salirSinDia');
  corriaAlPreguntar = !pausado;
  if (corriaAlPreguntar) alternarPausa();
  elSalir.showModal();
}
for (const a of document.querySelectorAll('.volver-inicio, #cel-volver')) a.addEventListener('click', preguntarSalida);
document.getElementById('btn-seguir-jugando').addEventListener('click', () => elSalir.close());
// Un clic fuera de la tarjeta (en el fondo oscuro) también es seguir jugando
elSalir.addEventListener('click', (e) => {
  if (e.target === elSalir) elSalir.close();
});
elSalir.addEventListener('close', () => {
  if (corriaAlPreguntar && pausado) alternarPausa();
  corriaAlPreguntar = false;
});

// ---------- El recorrido: dónde está cada cosa y para qué (8.8, 2026-11-09) ----------
// Pedido de Felipe: "en el juego hace falta como ese mini tutorial flash".
// Lo abren "¿Dónde está cada cosa?" de la tarjeta de inicio y el botón Ayuda
// (arriba a la izquierda en el computador; el "?" de arriba en el celular), y
// la primera vez en cada navegador sale solo (8.9; al final de este archivo).
// Muestra, una por una, las cosas de la pantalla con su título y una línea
// (src/recorrido.js). Mientras está abierto el día queda en pausa, y al cerrar
// sigue si corría. En Exhibición no hay recorrido: ahí explica quien facilita.
// El tablero se ubica en la pantalla a partir de las esquinas del monitor (en
// el mundo 3D) y de la cámara de ahora
const _esquina = new THREE.Vector3();
function rectTablero() {
  if (esCelular() && vistaCelular() !== 'oficina') return null;
  const escena = elEscena.getBoundingClientRect();
  if (!escena.width || !escena.height) return null;
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      _esquina.copy(CENTRO_PANTALLA).add(new THREE.Vector3(sx * 0.52 * ESCALA_MONITOR, sy * 0.34 * ESCALA_MONITOR, 0));
      _esquina.project(camera);
      if (_esquina.z > 1) return null; // (quedó detrás de la cámara)
      x0 = Math.min(x0, escena.left + ((_esquina.x + 1) / 2) * escena.width);
      x1 = Math.max(x1, escena.left + ((_esquina.x + 1) / 2) * escena.width);
      y0 = Math.min(y0, escena.top + ((1 - _esquina.y) / 2) * escena.height);
      y1 = Math.max(y1, escena.top + ((1 - _esquina.y) / 2) * escena.height);
    }
  // Solo la parte que se ve de la oficina (si la giraron, puede no verse)
  x0 = Math.max(x0, escena.left);
  y0 = Math.max(y0, escena.top);
  x1 = Math.min(x1, escena.right);
  y1 = Math.min(y1, escena.bottom);
  return x1 - x0 > 24 && y1 - y0 > 24 ? new DOMRect(x0, y0, x1 - x0, y1 - y0) : null;
}
// Dónde está una parte de la página (null si no se ve)
const rectDe = (selector) => () => {
  const el = document.querySelector(selector);
  if (!el) return null;
  const estilo = getComputedStyle(el);
  if (estilo.display === 'none' || estilo.visibility === 'hidden') return null;
  return el.getBoundingClientRect();
};
// Los pasos, en el orden en que se usan: decidir, el día, el tablero, cómo le
// va, el cerebro y los días. En el celular el cerebro y los días son pestañas
// (se muestra la pestaña) y el día está en la píldora de arriba; antes de
// empezar, la hoja todavía no lleva los números (ese paso se salta solo)
const pasosRecorrido = () => [
  { clave: 'tareas', donde: rectDe('#panel .bloque-wip') },
  { clave: 'reloj', donde: rectDe(esCelular() ? '#cel-controles' : '#panel .bloque-hora') },
  { clave: 'tablero', donde: rectTablero },
  { clave: 'numeros', donde: rectDe('#panel .bloque-numeros') },
  { clave: 'cerebro', donde: rectDe(esCelular() ? '#cel-pestana-cerebro' : '#cerebro') },
  { clave: 'dias', donde: esCelular() ? rectDe('#cel-pestana-dias') : rectDiasJugados },
];
// "Días jugados" en el panel: el título y la tabla (sin los atajos ni la nota de abajo)
function rectDiasJugados() {
  const titulo = rectDe('#panel .bloque.ultimo .bloque-fila')();
  const tabla = rectDe('#tabla-dias')();
  if (!titulo || !tabla) return null;
  const x0 = Math.min(titulo.left, tabla.left);
  const x1 = Math.max(titulo.right, tabla.right);
  return new DOMRect(x0, titulo.top - 4, x1 - x0, tabla.bottom - titulo.top + 4);
}
// La primera vez, el recorrido sale solo (8.9, 2026-11-10, pedido de Felipe:
// "que al menos la primera vez sea como obligatorio, te lo puedas saltar
// claro, y que siempre esté ahí disponible en Ayuda igual"). El navegador
// recuerda que ya se vio, lo haya abierto el juego o la persona
// (abrirRecorrido, más abajo), y desde entonces solo sale con sus botones.
// Sin almacenamiento no se puede recordar: ahí sale en cada visita, y se
// salta con un clic.
const CLAVE_RECORRIDO_VISTO = 'mosca-del-wip-recorrido-visto';
function recorridoVisto() {
  try {
    return localStorage.getItem(CLAVE_RECORRIDO_VISTO) === '1';
  } catch {
    return false;
  }
}
function anotarRecorridoVisto() {
  try {
    localStorage.setItem(CLAVE_RECORRIDO_VISTO, '1');
  } catch {
    // sin almacenamiento disponible: la próxima visita lo verá de nuevo
  }
}
let corriaAlAbrirRecorrido = false;
const recorrido = crearRecorrido({
  pasos: pasosRecorrido,
  texto: (clave) => tx('recorrido')[clave],
  rotulos: () => ({ paso: (i, n) => tx('recorridoPaso', i, n), sigue: tx('recorridoSigue'), listo: tx('recorridoListo') }),
  alAbrir() {
    corriaAlAbrirRecorrido = !pausado;
    if (corriaAlAbrirRecorrido) alternarPausa();
    // Todo a la vista: en el celular, la pestaña Oficina; en el computador,
    // los dos paneles (si estaban ocultos, se quedan abiertos)
    if (esCelular()) {
      if (vistaCelular() !== 'oficina') document.getElementById('cel-pestana-oficina').click();
    } else {
      alternarCerebro(false);
      alternarControles(false);
    }
  },
  alCerrar() {
    if (corriaAlAbrirRecorrido && pausado) alternarPausa();
    corriaAlAbrirRecorrido = false;
  },
});
// Abre el recorrido y, si de verdad se mostró (si no hay nada que mostrar, no
// se abre), el navegador anota que ya se vio
function abrirRecorrido() {
  recorrido.abrir();
  if (recorrido.abierto()) anotarRecorridoVisto();
}
for (const id of ['btn-recorrido', 'btn-ayuda', 'cel-ayuda'])
  document.getElementById(id).addEventListener('click', () => {
    if (vista === 'exhibicion') return;
    abrirRecorrido();
  });

function cambiarIdioma(nuevo) {
  if (nuevo === idioma || !['es', 'en'].includes(nuevo)) return;
  elegirIdioma(nuevo);
  idioma = nuevo;
  ponerIdiomaJuego(nuevo);
  ponerEnlacesInicio();
  miles = formatoNumero(nuevo);
  traducirPagina(nuevo);
  pintarBotonesIdioma();
  repintarTextos();
}

// Todo lo que escribe el juego, de nuevo y en el idioma de ahora: la misma
// partida (no cambia la hora, la pausa, el WIP ni el historial)
function repintarTextos() {
  pintarTabla(diasPintados);
  elBtnBorrar.textContent = tx(esperandoConfirmacion ? 'confirmarBorrado' : 'borrarHistorial');
  // (el botón dice lo que ya decía: "Empezar", "Reanudar" o "Pausa")
  pintarBotonPausa();
  if (elExMosca.dataset.hace) elExMoscaHace.textContent = tx('queHace')[elExMosca.dataset.hace];
  if (diasDelResumen?.length) pintarResumen();
  if (siguientePintado) escribirSiguienteDia();
  for (const { g, nombre } of Object.values(filasGrupo)) nombre.lastChild.nodeValue = zona(g).nombre;
  if (cerebro) {
    giroPintado = null;
    pintarBotonGiro();
    pintarLectura(juego.estado());
    // la tarjetita de una neurona, si está a la vista (la fija se vuelve a
    // ubicar: con otro largo podría salirse de la pantalla)
    if (!elFicha.hidden) {
      if (fichaFija) ponerFicha(cerebro.neurona(fichaFija.punto), fichaFija.x, fichaFija.y);
      else if (fichaNeurona) escribirFicha(fichaNeurona);
    }
  }
  graficoDia.refrescarTextos();
  graficoDia.dibujar();
  oficina.ponerTextos();
  refrescarUI(juego.estado(), mosca.cigarroEnMano());
  if (!elInfo.hidden) alternarInfo(true);
  recorrido.repintar();
}

// ---------- Bucle principal (máximo 60 cuadros por segundo: fluido y sin calentar) ----------
const CUADRO_MINIMO = 1000 / 61;
let ultimoTiempo = performance.now();
let fotoLista = false;
// Si el navegador pierde el 3D y lo devuelve (por ejemplo, un celular que
// vuelve de otra app), la foto del escritorio se saca de nuevo, porque su
// imagen se pierde con el 3D y quedaba negra (revisión final, S19)
renderer.domElement.addEventListener('webglcontextrestored', () => {
  fotoLista = false;
});
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
  if (!pausado && !juego.terminado && !relojDetenido) {
    juego.tick(dtReal * MIN_SIM_POR_SEG_REAL * VELOCIDADES[indiceVelocidad]);
  }
  registrarDia();
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

  moverCamaraACasa(dtReal);
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
  // En el celular la oficina se dibuja solo si su pestaña está a la vista
  if (!esCelular() || vistaCelular() === 'oficina') {
    renderer.render(scene, camera);
    if (import.meta.env.DEV && window.__cuadrosMosca) anotarCuadro(ahora);
  }
  refrescarCerebro(dtReal, estado, mosca.tomandoCafe(), ahora);
}

// (solo en desarrollo) scripts/probar-salto.mjs prende window.__cuadrosMosca
// antes de que cargue el juego: cada cuadro dibujado de la oficina anota el
// tamaño del lienzo, la cámara y la caja de la mosca en la pantalla (píxeles
// CSS), para comprobar que el primer cuadro ya es el definitivo
const _enPantalla = new THREE.Vector3();
function anotarCuadro(ahora) {
  const ancho = canvas.clientWidth;
  const alto = canvas.clientHeight;
  const caja = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of puntosVisibles(mosca.figura, 6)) {
    _enPantalla.copy(p).project(camera);
    const x = ((_enPantalla.x + 1) / 2) * ancho;
    const y = ((1 - _enPantalla.y) / 2) * alto;
    caja[0] = Math.min(caja[0], x);
    caja[1] = Math.min(caja[1], y);
    caja[2] = Math.max(caja[2], x);
    caja[3] = Math.max(caja[3], y);
  }
  window.__cuadrosMosca.push({
    tipo: 'cuadro',
    t: Math.round(ahora),
    lienzo: [ancho, alto, canvas.width, canvas.height],
    camara: [...camera.position.toArray(), ...controls.target.toArray(), camera.zoom].map((v) => +v.toFixed(4)),
    mosca: caja.map((v) => +v.toFixed(1)),
  });
}

// ---------- Celular: la misma partida, acomodada a la pantalla chica ----------
// (src/celular.js) Al encenderse, la oficina se encuadra sola en su recuadro
// (como en Exhibición) y los dos dedos solo la acercan o la alejan, con tope
// (ZOOM_CELULAR; antes también la corrían hacia el lado y la mosca se perdía,
// 8.6); al apagarse (un iPad que agranda su ventana), todo vuelve a como estaba.
iniciarCelular({
  alCambiar(activo) {
    if (activo && vista === 'exhibicion') aplicarVista('control');
    controls.enablePan = !activo;
    // (los topes del computador, los de src/scene.js; los del celular los pone
    // encuadrarExhibicion)
    if (!activo) {
      controls.minDistance = 1.6;
      controls.maxDistance = 7;
    }
    if (activo) document.body.classList.remove('cerebro-oculto', 'controles-oculto');
    else {
      pintarCerebroOculto();
      pintarControlesOculto();
      camera.position.copy(CAMARA_INICIAL.posicion);
      controls.target.copy(CAMARA_INICIAL.objetivo);
      controls.update();
      guardarCasa();
    }
    ajustarEscena();
    if (activo) encuadrarExhibicion();
    // (8.8) la tarjeta de inicio se acomoda ANTES del primer cuadro: si recién
    // después soltara sus líneas para dejarle lugar a la mosca, la mosca se
    // dibujaría grande un instante y se achicaría de golpe (lo revisa
    // scripts/probar-salto.mjs en 375 × 667)
    ajustarAvisoEmpezar();
  },
  // Al salir del cerebro se cierran su explicación y la tarjetita de una neurona
  alCambiarVista(nueva) {
    if (nueva === 'cerebro') return;
    alternarInfo(false);
    soltarFicha();
  },
});

animar();
// El script del <head> esconde la página mientras se ponen los textos en
// inglés; ya están (el primer cuadro se dibujó en su idioma)
document.documentElement.classList.remove('traduciendo');
// La tarjeta de inicio recibe el foco al abrir el juego (8.1): el lector de
// pantalla la lee primero (es un diálogo con su título y su texto) y Enter o
// Espacio empiezan el día. En Exhibición no se ve y el foco no entra.
elAvisoEmpezar.focus({ preventScroll: true });
// (8.9) La primera vez en este navegador, lo primero que se ve es el
// recorrido: sale antes de pintar la pantalla, para que nadie alcance a leer
// la tarjeta de inicio y se la quiten de las manos. Al cerrarlo ("Saltar",
// Esc o "Listo") vuelve la tarjeta, con el foco del teclado, y el día sigue
// en las 09:00. Un navegador manejado por un programa (navigator.webdriver:
// las pruebas y las fotos de scripts/) no lo ve solo, porque todas esperan la
// tarjeta de inicio; scripts/probar-recorrido.mjs se hace pasar por una
// persona para probar la primera vez.
if (!recorridoVisto() && !navigator.webdriver) abrirRecorrido();

if (import.meta.env.DEV) {
  window.__mosca = {
    escena: scene,
    estado: () => juego.estado(),
    setWip(v) {
      ponerWip(v);
    },
    // bloqueadas: n bloquea las n tareas en curso más antiguas por `minutosBloqueo`
    // (8.14) cafes: n deja el contador de cafés en n (el peor día de scripts/probar-desbordes.mjs)
    forzar({ estres, fumando, cafe, colillas, cafes, hechas, bloqueadas, minutosBloqueo = 45 } = {}) {
      if (bloqueadas !== undefined) {
        juego.enCurso.forEach((t, i) => {
          t.minutosBloqueada = i < bloqueadas ? minutosBloqueo : 0;
        });
      }
      if (estres !== undefined) {
        juego.estresBase = estres;
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
      if (cafes !== undefined) juego.cafes = cafes;
      if (hechas !== undefined) {
        while (juego.hechas.length < hechas && juego.porHacer.length) juego.hechas.push(juego.porHacer.shift());
      }
    },
    // Como apretar la pausa (también pinta el botón; antes de Empezar, pausar
    // no hace nada y quitarla empieza el día)
    pausar(v) {
      if (v !== pausado) alternarPausa();
    },
    // Aprieta Empezar (las pruebas que necesitan el reloj corriendo)
    empezar() {
      if (!empezado) alternarPausa();
    },
    empezado: () => empezado,
    congelar(v) {
      congelado = v;
    },
    // Detiene sólo el reloj del juego (no es la pausa: la mosca sigue lo que
    // hacía). Sirve para sostener un momento en una captura sin cambiar el día.
    detenerReloj(v) {
      relojDetenido = v;
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
    // Idioma: cuál está puesto y qué dicen los textos de la escena 3D (kanban,
    // póster y post-its)
    idioma: () => idioma,
    textosEscena: () => oficina.textosEscena(),
    // Dónde está en pantalla una neurona del circuito (2 = aBN1, 4 = aDN1…)
    cerebroDonde: (rol) => cerebro?.dondeEsta(rol),
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
      while (!juego.terminado) {
        juego.tick(1);
        registrarDia();
      }
    },
    // Juega N minutos del día de una vez, con las reglas normales (para
    // capturas a media jornada sin forzar nada)
    adelantar: (minutos) => {
      const fin = juego.minutoActual + minutos;
      while (!juego.terminado && juego.minutoActual < fin) {
        juego.tick(0.15);
        registrarDia();
      }
    },
    casiFin: () => (juego.minutoActual = 18 * 60 - 2),
    // (con los topes del zoom y si los dos dedos pueden correr la oficina, 8.6)
    camaraInfo: () => ({
      pos: camera.position.toArray(),
      obj: controls.target.toArray(),
      aspect: camera.aspect,
      zoom: [controls.minDistance, controls.maxDistance],
      correr: controls.enablePan,
    }),
    // Cómo está corrida y achicada la imagen de la oficina entre los paneles
    // (scripts/probar-quieta.mjs: quieta mientras nadie toca nada, 8.8)
    imagenOficina: () => ({ zoom: camera.zoom, dx: camera.view?.enabled ? -camera.view.offsetX : 0, dy: camera.view?.enabled ? -camera.view.offsetY : 0 }),
    celular: () => ({ activo: esCelular(), vista: vistaCelular(), ratio: renderer.getPixelRatio() }),
    // El recorrido (8.8): en qué paso va, o null si está cerrado; y dónde está el tablero en la pantalla
    recorrido: () => recorrido.paso(),
    rectTablero: () => { const r = rectTablero(); return r && [r.x, r.y, r.width, r.height].map(Math.round); },
    cerebro: () => cerebro?.lectura(),
    cerebroVista: () => cerebro?.vista(),
    // Urgencias (8.3): como apretar el botón; las tarjetas del tablero tal
    // como se dibujaron (urgentes arriba); las tareas en curso; las medidas del día
    mandarUrgencia: () => mandarUrgencia(),
    kanban: () => oficina.tarjetasKanban(),
    tareas: () => juego.enCurso.map((t) => ({ id: t.id, urgente: !!t.urgente, restante: t.minutosRestantes, bloqueada: t.minutosBloqueada > 0 })),
    medidas: () => juego.medidas(),
    reencuadrar() {
      camera.position.copy(CAMARA_INICIAL.posicion);
      controls.target.copy(CAMARA_INICIAL.objetivo);
      controls.update();
    },
  };
}
