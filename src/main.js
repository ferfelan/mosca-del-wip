import './style.css';
import { crearEscena } from './scene.js';
import { crearOficina } from './office.js';
import { crearMosca } from './fly.js';
import { DayBrain, nivelDeEstres } from './brain.js';

const CLAVE_STORAGE = 'mosca-del-wip-dias';
const MIN_SIM_POR_SEG_REAL = 540 / 60; // día de 540 min simulados en 60s reales a x1

const canvas = document.getElementById('lienzo-3d');
const { scene, camera, renderer, controls } = crearEscena(canvas);
const oficina = crearOficina(scene);
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
const elTablaBody = document.getElementById('tabla-dias-body');
const elBanner = document.getElementById('banner-fin-dia');

const VELOCIDADES = [1, 2, 4];
let indiceVelocidad = 0;
let pausado = false;
let diaYaRegistrado = false;

let juego = new DayBrain(Number(elWip.value));

function cargarDias() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_STORAGE)) || [];
  } catch {
    return [];
  }
}

function guardarDia(resumen) {
  const dias = cargarDias();
  dias.push(resumen);
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(dias));
  pintarTabla(dias);
}

function pintarTabla(dias) {
  elTablaBody.innerHTML = '';
  dias.forEach((d) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.wip}</td><td>${d.hechas}</td><td>${d.colillas}</td><td>${d.estresMax}</td>`;
    elTablaBody.appendChild(tr);
  });
}

pintarTabla(cargarDias());

elWip.addEventListener('input', () => {
  elWipValor.textContent = elWip.value;
  juego.setWip(Number(elWip.value));
});

elBtnPausa.addEventListener('click', () => {
  pausado = !pausado;
  elBtnPausa.textContent = pausado ? '▶ Reanudar' : '⏸ Pausa';
});

elBtnVelocidad.addEventListener('click', () => {
  indiceVelocidad = (indiceVelocidad + 1) % VELOCIDADES.length;
  elBtnVelocidad.textContent = `x${VELOCIDADES[indiceVelocidad]}`;
});

elBtnReiniciar.addEventListener('click', () => {
  juego = new DayBrain(Number(elWip.value));
  diaYaRegistrado = false;
  elBanner.classList.add('oculto');
  oficina.limpiarColillas();
});

let colillasPintadas = 0;

function refrescarUI(estado) {
  elReloj.textContent = estado.hora;
  elBarraDia.style.width = `${Math.round(estado.fraccionDelDia * 100)}%`;
  elHechas.textContent = estado.hechas;
  elColillas.textContent = estado.colillas;
  elEstres.textContent = estado.nivel.nombre;
  elEstres.style.color = estado.nivel.color;

  oficina.actualizarKanban(estado);
  oficina.actualizarReloj(estado.fraccionDelDia);

  while (colillasPintadas < estado.colillasVisibles) {
    oficina.agregarColilla();
    colillasPintadas++;
  }

  if (estado.terminado && !diaYaRegistrado) {
    diaYaRegistrado = true;
    guardarDia(juego.resumenFinal());
    elBanner.classList.remove('oculto');
  }
}

const reloj3js = { ultimo: performance.now() };

function animar() {
  requestAnimationFrame(animar);
  const ahora = performance.now();
  const dtReal = Math.min((ahora - reloj3js.ultimo) / 1000, 0.1);
  reloj3js.ultimo = ahora;

  if (!pausado && !juego.estado().terminado) {
    const velocidad = VELOCIDADES[indiceVelocidad];
    juego.tick(dtReal * MIN_SIM_POR_SEG_REAL * velocidad);
  }

  const estado = juego.estado();
  refrescarUI(estado);
  mosca.update(dtReal, { fumando: estado.fumando, nivel: estado.nivel.nombre });

  controls.update();
  renderer.render(scene, camera);
}

animar();
