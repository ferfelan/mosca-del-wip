import './style.css';
import { crearEscena, CAMARA_INICIAL } from './scene.js';
import { crearOficina } from './office.js';
import { crearMosca } from './fly.js';
import { DayBrain } from './brain.js';
import { revisarChoques } from './choques.js';

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
  oficina.actualizarReloj(estado.fraccionDelDia);

  // El cigarro que la mosca tiene en la mano llega al cenicero cuando lo termina
  const colillasEnCenicero = Math.max(0, estado.colillasVisibles - (cigarroEnMano ? 1 : 0));
  while (colillasPintadas < colillasEnCenicero) {
    oficina.agregarColilla();
    colillasPintadas++;
  }

  if (estado.terminado && !diaYaRegistrado) {
    diaYaRegistrado = true;
    guardarDia(juego.resumenFinal());
    elBanner.classList.remove('oculto');
  }
}

let ultimoTiempo = performance.now();

function animar() {
  requestAnimationFrame(animar);
  const ahora = performance.now();
  const dtReal = Math.min((ahora - ultimoTiempo) / 1000, 0.1);
  ultimoTiempo = ahora;

  if (!pausado && !juego.terminado) {
    juego.tick(dtReal * MIN_SIM_POR_SEG_REAL * VELOCIDADES[indiceVelocidad]);
  }

  const estado = juego.estado();
  if (!congelado) {
    mosca.update(dtReal, { fumando: estado.fumando, estres: estado.estres / 100 });
    oficina.actualizar(dtReal);
  }
  refrescarUI(estado, mosca.cigarroEnMano());

  controls.update();
  renderer.render(scene, camera);
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
    reencuadrar() {
      camera.position.copy(CAMARA_INICIAL.posicion);
      controls.target.copy(CAMARA_INICIAL.objetivo);
      controls.update();
    },
  };
}
