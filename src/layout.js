// Dónde va cada cosa. La mosca mira de frente al monitor; detrás del monitor
// está la ventana; la cámara mira en 3/4 desde atrás de la mosca.
import * as THREE from 'three';

export const ALTO_ESCRITORIO = 0.95;
export const ESCRITORIO = { x: -0.4, z: -0.02, ancho: 3.4, fondo: 1.35 };
export const BORDE_DELANTERO_ESCRITORIO = ESCRITORIO.z + ESCRITORIO.fondo / 2;

// La mosca va delante del escritorio, mirando hacia la pared del fondo
// (rumbo = π: mira hacia -z), con su cuerpo fuera del borde del escritorio.
export const MOSCA = { x: -0.9, z: BORDE_DELANTERO_ESCRITORIO + 0.545, rumbo: Math.PI };
export const ESCALA_MOSCA = 1.45;
export const ALTO_ASIENTO = 0.47;

// Hacia dónde mira la mosca (adelante) y cuál es su lado izquierdo, en el mundo.
export const DIR_MOSCA = new THREE.Vector3(Math.sin(MOSCA.rumbo), 0, Math.cos(MOSCA.rumbo));
export const IZQ_MOSCA = new THREE.Vector3(Math.cos(MOSCA.rumbo), 0, -Math.sin(MOSCA.rumbo));
const POS_MOSCA = new THREE.Vector3(MOSCA.x, 0, MOSCA.z);

// distancia: hacia adelante de la mosca; lateral: + a su izquierda, - a su derecha
function delanteDeLaMosca(distancia, lateral = 0) {
  return POS_MOSCA.clone()
    .addScaledVector(DIR_MOSCA, distancia)
    .addScaledVector(IZQ_MOSCA, lateral)
    .setY(ALTO_ESCRITORIO);
}

export const TECLADO = { pos: delanteDeLaMosca(0.957), rot: MOSCA.rumbo + Math.PI, ancho: 0.52, fondo: 0.2 };
export const MOUSEPAD = { pos: delanteDeLaMosca(0.967, 0), ancho: 0.8, fondo: 0.4 };
export const POS_MOUSEPAD = MOUSEPAD.pos;
export const POS_MOUSE = delanteDeLaMosca(0.99, 0.33);
// Taza a la derecha del mousepad, sobre un posavasos, al alcance de la pata
// (sin tocar el mousepad, el teclado ni el cenicero)
export const POS_TAZA = delanteDeLaMosca(1.05, -0.55);
export const ALTO_POSAVASOS = 0.008;
// La manilla de la taza mira hacia la pata delantera derecha de la mosca
// (la que la toma). En la taza, la manilla apunta a su eje +x.
const _haciaPata = new THREE.Vector3(MOSCA.x, 0, MOSCA.z)
  .addScaledVector(IZQ_MOSCA, -0.12)
  .addScaledVector(DIR_MOSCA, 0.35)
  .sub(POS_TAZA)
  .setY(0)
  .normalize();
export const ROT_TAZA = Math.atan2(-_haciaPata.z, _haciaPata.x);
// Cenicero cerca del borde, a la derecha: la pata delantera lo alcanza
export const POS_CENICERO = delanteDeLaMosca(0.73, -0.6);
// Cajetilla al lado del cenicero (lado de la cámara)
export const POS_CAJETILLA = delanteDeLaMosca(0.8, -0.88);
// Hacia dónde queda la mosca vista desde el cenicero: ahí se apoya el
// cigarro encendido, y en ese sector no caen colillas.
// Lado derecho del escritorio: pila de carpetas (crece con el WIP) bajo una
// lámpara
export const POS_PILA = new THREE.Vector3(0.42, ALTO_ESCRITORIO, 0.02);
export const POS_LAMPARA = new THREE.Vector3(0.86, ALTO_ESCRITORIO, -0.46);
// Foto enmarcada (la mosca con su gato), entre el monitor y la lámpara,
// mirando hacia la mosca
export const POS_FOTO = new THREE.Vector3(-0.1, ALTO_ESCRITORIO, -0.4);
export const ROT_FOTO = -0.2;
export const ANG_APOYO_CENICERO = Math.atan2(MOSCA.z - POS_CENICERO.z, MOSCA.x - POS_CENICERO.x);
// Monitor de frente a la mosca (de espaldas a la ventana)
export const POS_MONITOR = delanteDeLaMosca(1.5);
export const ROT_MONITOR = MOSCA.rumbo + Math.PI;
export const ESCALA_MONITOR = 1.22;

// Ventana en la pared del fondo, justo detrás del monitor
export const POS_VENTANA = new THREE.Vector3(MOSCA.x - 0.35, 2.0, -2.06);

export const CAMARA_INICIAL = {
  posicion: new THREE.Vector3(1.55, 2.7, 3.45),
  objetivo: new THREE.Vector3(-0.78, 1.06, -0.38),
};

export const CENTRO_PANTALLA = POS_MONITOR.clone()
  .add(new THREE.Vector3(0, 0.63 * ESCALA_MONITOR, 0))
  .addScaledVector(new THREE.Vector3(Math.sin(ROT_MONITOR), 0, Math.cos(ROT_MONITOR)), 0.03);
