// Dónde va cada cosa. La mosca, el teclado, el monitor y la cámara se ubican
// juntos para que la mosca mire la pantalla y la cámara la vea en 3/4.
import * as THREE from 'three';

export const ALTO_ESCRITORIO = 0.95;
export const ESCRITORIO = { x: -0.4, z: -0.02, ancho: 3.4, fondo: 1.35 };
export const BORDE_TRASERO_ESCRITORIO = ESCRITORIO.z - ESCRITORIO.fondo / 2;

// La mosca se sienta detrás del escritorio, girada hacia el monitor.
export const MOSCA = { x: -1.02, z: -0.99, rumbo: 0.45 };
export const ESCALA_MOSCA = 1.35;
export const ALTO_ASIENTO = 0.47;

// Hacia dónde mira la mosca (adelante) y cuál es su lado izquierdo, en el mundo.
export const DIR_MOSCA = new THREE.Vector3(Math.sin(MOSCA.rumbo), 0, Math.cos(MOSCA.rumbo));
export const IZQ_MOSCA = new THREE.Vector3(Math.cos(MOSCA.rumbo), 0, -Math.sin(MOSCA.rumbo));
const POS_MOSCA = new THREE.Vector3(MOSCA.x, 0, MOSCA.z);

function delanteDeLaMosca(distancia, lateral = 0) {
  return POS_MOSCA.clone()
    .addScaledVector(DIR_MOSCA, distancia)
    .addScaledVector(IZQ_MOSCA, lateral)
    .setY(ALTO_ESCRITORIO);
}

export const TECLADO = { pos: delanteDeLaMosca(0.76), rot: MOSCA.rumbo + Math.PI, ancho: 0.52, fondo: 0.2 };
export const POS_MOUSE = delanteDeLaMosca(0.78, -0.4);
export const POS_MOUSEPAD = delanteDeLaMosca(0.77, -0.12);
export const POS_MONITOR = delanteDeLaMosca(1.27);
export const POS_CENICERO = new THREE.Vector3(-1.3, ALTO_ESCRITORIO, 0.3);
export const POS_TAZA = new THREE.Vector3(0.55, ALTO_ESCRITORIO, 0.3);

export const CAMARA_INICIAL = {
  posicion: new THREE.Vector3(-2.2, 2.25, 2.42),
  objetivo: new THREE.Vector3(-0.58, 1.2, -0.3),
};

// El monitor se gira a medio camino entre la mosca y la cámara (un poco más
// hacia la cámara): la mosca lo mira de lado y el kanban se lee bien.
function anguloHacia(desde, hacia) {
  return Math.atan2(hacia.x - desde.x, hacia.z - desde.z);
}
const haciaMosca = anguloHacia(POS_MONITOR, POS_MOSCA);
const haciaCamara = anguloHacia(POS_MONITOR, CAMARA_INICIAL.posicion);
export const ROT_MONITOR = haciaCamara + (haciaMosca - haciaCamara) * 0.42;

export const CENTRO_PANTALLA = POS_MONITOR.clone()
  .add(new THREE.Vector3(0, 0.63, 0))
  .addScaledVector(new THREE.Vector3(Math.sin(ROT_MONITOR), 0, Math.cos(ROT_MONITOR)), 0.03);
