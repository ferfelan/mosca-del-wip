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
const elEficiencia = document.getElementById('m-eficiencia');
const elEstres = document.getElementById('m-estres');
const elBarraEstres = document.getElementById('barra-estres-relleno');
const elTablaBody = document.getElementById('tabla-dias-body');
const elBanner = document.getElementById('banner-fin-dia');
const elWipNota = document.getElementById('wip-nota');
const elAvisoEmpezar = document.getElementById('aviso-empezar');

const VELOCIDADES = [1, 2, 4];
let indiceVelocidad = 0;
// El día parte detenido: el reloj corre recién al apretar Empezar (pedido de
// Felipe, 2026-10-25: antes partía solo al entrar)
let pausado = true;
let empezado = false;
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

let diasPintados = []; // los de la tabla (para repintarla en otro idioma)
function pintarTabla(dias) {
  diasPintados = dias;
  elTablaBody.innerHTML = '';
  elBtnBorrar.hidden = !dias.length;
  if (!dias.length) {
    elTablaBody.innerHTML = `<tr class="vacia"><td colspan="7">${tx('tablaVacia')}</td></tr>`;
    return;
  }
  // El mejor día (más tareas terminadas) se destaca: ayuda a comparar
  const mejor = dias.length > 1 ? Math.max(...dias.map((d) => d.hechas)) : null;
  dias.forEach((d, i) => {
    const tr = document.createElement('tr');
    if (d.hechas === mejor) {
      tr.className = 'mejor-dia';
      tr.title = tx('mejorDia');
    }
    tr.innerHTML = `<td>${d.wip}</td><td>${d.hechas}</td><td>${formatoTiempo(d.tiempoPorTarea, true)}</td><td>${d.colillas}</td><td>${d.cafes ?? '–'}</td><td>${d.estresMax}%</td>`;
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
    elAvisoEmpezar.hidden = true;
    document.documentElement.classList.remove('por-empezar');
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
// no tiene nada que contar, y la hoja lleva solo las tareas a la vez). Si no
// cabe entera (pantallas con zoom o con la letra agrandada), va perdiendo de
// a poco: la línea del final y "¿Qué es esto?", después el título y al final
// el texto: queda el botón (reglas en src/celular.css).
const TAPAN_AVISO = ['cel-volver', 'cel-controles', 'cel-pestanas', 'panel'].map((id) => document.getElementById(id));
function ajustarAvisoEmpezar() {
  const niveles = ['sin-detalle', 'sin-titulo', 'solo-boton'];
  elAvisoEmpezar.classList.remove(...niveles);
  if (!esCelular() || elAvisoEmpezar.hidden) return;
  const choca = () => {
    const a = elAvisoEmpezar.getBoundingClientRect();
    return TAPAN_AVISO.some((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    });
  };
  for (const nivel of niveles) {
    if (!choca()) return;
    elAvisoEmpezar.classList.add(nivel);
  }
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
  elBanner.classList.add('oculto');
  elExFin.classList.add('oculto');
  oficina.limpiarColillas();
  empezarLimpio();
}
const reiniciarDia = () => armarDia();
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
    // Todas sus tareas en curso están bloqueadas: espera sin teclear
    espera: estado.esperando && !descansa,
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
  elEficiencia.textContent = formatoEficiencia(estado.eficiencia);
  elEstres.textContent = nombreNivel(estado.nivel.nombre);
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
  const drenando = estado.enCurso > estado.wip && !estado.terminado;
  pintarNotaWip(estado.wip, estado.terminado ? 0 : estado.enCurso);
  const textoAviso = drenando
    ? tx('avisoTerminando', estado.wip)
    : estado.wip > LIMITE_SANO
      ? tx('muchasTareas')
      : tx('pocasTareas');
  if (elExInicioTexto.textContent !== textoAviso) elExInicioTexto.textContent = textoAviso;
  elExInicio.dataset.carga = nivelCarga(drenando ? estado.enCurso : estado.wip);
  elExInicio.classList.toggle('oculto', estado.terminado);
  pintarCifras(estado);

  // Fin del día (en cualquier vista): se guarda en "Días jugados" y se
  // muestra el resumen
  if (estado.terminado && !diaYaRegistrado) {
    diaYaRegistrado = true;
    guardarDia(juego.resumenFinal());
    llenarResumenDelDia();
  }
  document.body.classList.toggle('dia-terminado', estado.terminado);
  elBanner.classList.toggle('oculto', !estado.terminado);
  elExFin.classList.toggle('oculto', !estado.terminado);
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
  tiempo: document.getElementById('cf-tiempo'),
  eficiencia: document.getElementById('cf-eficiencia'),
  colillas: document.getElementById('cf-colillas'),
  cafes: document.getElementById('cf-cafes'),
};
const elEficienciaBarra = document.getElementById('cf-eficiencia-barra');
const segmentosCarga = [...document.querySelectorAll('#carga-segmentos i')];
const conUnidades = (el, texto) => {
  const html = texto.replace(/ ?([a-z]+)/g, '<small> $1</small>');
  if (el.innerHTML !== html) el.innerHTML = html;
};
const escribir = (el, texto) => {
  if (el.textContent !== texto) el.textContent = texto;
};
function pintarCifras(estado) {
  escribir(elCifrasTitulo, tx(estado.terminado ? 'resumenDelDia' : 'hoyEnLaOficina'));
  escribir(cifras.carga, String(estado.enCurso));
  elCifraCarga.dataset.carga = nivelCarga(estado.enCurso);
  segmentosCarga.forEach((s, i) => s.classList.toggle('lleno', i < estado.enCurso));
  escribir(cifras.hechas, String(estado.hechas));
  // En grande, las unidades van más chicas que los números ("7 h 46 min")
  conUnidades(cifras.tiempo, estado.tiempoPorTarea === null ? '–' : formatoTiempo(estado.tiempoPorTarea));
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
  elExFinTitulo.textContent = tx('finDelDiaWip', actual.wip);
  elExFinFilas.innerHTML = '';
  dias.slice(-3).forEach((d, i, lista) => {
    const tr = document.createElement('tr');
    // La fila de hoy se marca para distinguirla de los días anteriores
    const hoy = i === lista.length - 1;
    if (hoy) tr.className = 'actual';
    tr.innerHTML = `<th>WIP ${d.wip}${hoy ? ` <span class="fila-hoy">${tx('hoy')}</span>` : ''}</th><td>${d.hechas}</td><td>${formatoTiempo(d.tiempoPorTarea, true)}</td><td>${d.colillas}</td><td>${d.cafes ?? '–'}</td><td>${d.estresMax}%</td>`;
    elExFinFilas.appendChild(tr);
  });
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
  if (vista === 'exhibicion' || esCelular() || (fi < 0.002 && fd < 0.002)) {
    // Sin paneles: la escena ocupa toda la pantalla con el encuadre oficial
    // (en el celular no hay paneles al lado: la oficina tiene su recuadro)
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
  if (vista !== 'control' || esCelular()) return;
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
  if (vista !== 'control' || esCelular()) return;
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
// (en el celular, la oficina también se encuadra sola en su recuadro)
new ResizeObserver(() => {
  ajustarEscena();
  if (esCelular()) encuadrarSinPerderGiro();
  else if (vista === 'exhibicion') encuadrarExhibicion();
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
  guardarCasa();
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
  // la cierra sola: es un <dialog>)
  if (elSalir.open) return;
  if (e.target instanceof HTMLInputElement && e.key !== 'Escape') {
    if (e.target.type !== 'range') return;
  }
  // Con la explicación ⓘ abierta, Esc sólo la cierra (no cambia de vista)
  if (e.key === 'Escape' && !elInfo.hidden) {
    alternarInfo(false);
    return;
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

// Los enlaces a la portada ("← Inicio" en Control y en la barra de Exhibición,
// la flecha del celular, "Salir del juego" de la pregunta y "¿Qué es esto?" de
// la tarjeta de inicio) llevan al mismo idioma del juego (5.2i): en inglés, /en/
function ponerEnlacesInicio() {
  for (const a of document.querySelectorAll('.volver-inicio, #cel-volver, #btn-salir-juego, #aviso-que-es')) a.setAttribute('href', rutaEnIdioma('/', idioma));
  // el enlace a la guía del límite WIP, en el panel (Etapa 7): /limite-wip/ o /en/wip-limit/
  for (const a of document.querySelectorAll('[data-guia]')) a.setAttribute('href', rutaEnIdioma('/limite-wip/', idioma));
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
  if (!esCelular() || vistaCelular() === 'oficina') renderer.render(scene, camera);
  refrescarCerebro(dtReal, estado, mosca.tomandoCafe(), ahora);
}

// ---------- Celular: la misma partida, acomodada a la pantalla chica ----------
// (src/celular.js) Al encenderse, la oficina se encuadra sola en su recuadro
// (como en Exhibición) y se puede alejar hasta 12; al apagarse (un iPad que
// agranda su ventana), todo vuelve a como estaba.
iniciarCelular({
  alCambiar(activo) {
    if (activo && vista === 'exhibicion') aplicarVista('control');
    controls.maxDistance = activo ? 12 : 7;
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

if (import.meta.env.DEV) {
  window.__mosca = {
    escena: scene,
    estado: () => juego.estado(),
    setWip(v) {
      ponerWip(v);
    },
    // bloqueadas: n bloquea las n tareas en curso más antiguas por `minutosBloqueo`
    forzar({ estres, fumando, cafe, colillas, hechas, bloqueadas, minutosBloqueo = 45 } = {}) {
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
    camaraInfo: () => ({ pos: camera.position.toArray(), obj: controls.target.toArray(), aspect: camera.aspect }),
    celular: () => ({ activo: esCelular(), vista: vistaCelular(), ratio: renderer.getPixelRatio() }),
    cerebro: () => cerebro?.lectura(),
    cerebroVista: () => cerebro?.vista(),
    reencuadrar() {
      camera.position.copy(CAMARA_INICIAL.posicion);
      controls.target.copy(CAMARA_INICIAL.objetivo);
      controls.update();
    },
  };
}
