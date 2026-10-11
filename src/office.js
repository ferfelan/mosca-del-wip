import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { crearTexturaKanban, dibujarKanban } from './kanban.js';
import {
  texturaCielo,
  texturaPoster,
  texturaTeclado,
  texturaCaraReloj,
  texturaMadera,
  texturasHumo,
} from './textures.js';

import {
  ALTO_ESCRITORIO,
  ESCRITORIO,
  POS_MONITOR,
  ROT_MONITOR,
  ESCALA_MONITOR,
  TECLADO,
  POS_MOUSE,
  POS_MOUSEPAD,
  MOUSEPAD,
  POS_CAJETILLA,
  ANG_APOYO_CENICERO,
  POS_CENICERO,
  POS_TAZA,
  POS_VENTANA,
  MOSCA,
} from './layout.js';

export { ALTO_ESCRITORIO };

const COLORES = {
  pared: '#d9e0d2',
  zocalo: '#f3f1ea',
  piso: '#e8d3b4',
  alfombra: '#dfc2c0',
  metal: '#3a4350',
  plastico: '#262c35',
  ceramica: '#2f7579',
  ceniza: '#8c8780',
};

function malla(geo, mat, { x = 0, y = 0, z = 0, sombra = true, recibe = false } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = sombra;
  m.receiveShadow = recibe;
  return m;
}

const LARGO_COLILLA = 0.096;
const RADIO_COLILLA = 0.016;

function crearColilla() {
  const g = new THREE.Group();
  const L = LARGO_COLILLA;
  const partes = [
    [0.035, '#d9a35f', -L / 2 + 0.0175],
    [0.049, '#f6f3ec', -L / 2 + 0.035 + 0.0245],
    [0.012, '#3a332d', L / 2 - 0.006],
  ];
  partes.forEach(([largo, color, y]) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(RADIO_COLILLA, RADIO_COLILLA, largo, 12),
      new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
    );
    m.position.y = y;
    m.castShadow = true;
    m.userData.colilla = true;
    g.add(m);
  });
  return g;
}

// Dónde cae cada colilla. Dentro del cenicero: un anillo apoyado en el
// borde, otro encima y uno más arriba, dejando libre el sector donde la mosca
// apoya el cigarro encendido. Cuando se llena, se desbordan al escritorio.
const SUELO_CENICERO = 0.019;
const HUECO = (70 * Math.PI) / 180;
const DENTRO = [
  { cuantas: 6, adentro: [0.035, 0.035], afuera: [0.128, 0.06] },
  { cuantas: 6, adentro: [0.05, 0.066], afuera: [0.14, 0.086] },
  { cuantas: 5, adentro: [0.032, 0.106], afuera: [0.122, 0.121] },
  { cuantas: 4, adentro: [0.02, 0.15], afuera: [0.11, 0.152] },
];
const CAPACIDAD = DENTRO.reduce((n, c) => n + c.cuantas, 0);

function anguloLibre(i, cuantas, desfase) {
  const inicio = ANG_APOYO_CENICERO + HUECO / 2;
  return inicio + ((i + 0.5 + desfase) / cuantas) * (Math.PI * 2 - HUECO);
}

function ubicacionColilla(n, desbordes) {
  let i = n;
  for (const [k, c] of DENTRO.entries()) {
    if (i < c.cuantas) {
      const a = anguloLibre(i, c.cuantas, k * 0.33);
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      return {
        filtro: dir.clone().multiplyScalar(c.afuera[0]).setY(c.afuera[1]),
        punta: dir.clone().multiplyScalar(c.adentro[0]).setY(c.adentro[1]),
      };
    }
    i -= c.cuantas;
  }
  // Desborde: tiradas sobre el escritorio alrededor del cenicero
  const d = desbordes[i % desbordes.length];
  const capa = Math.floor(i / desbordes.length);
  const giro = d.giro + capa * 1.2;
  const eje = new THREE.Vector3(Math.cos(giro), 0, Math.sin(giro)).multiplyScalar(LARGO_COLILLA / 2);
  const centro = new THREE.Vector3(Math.cos(d.a) * d.r, RADIO_COLILLA * (1 + 2 * capa), Math.sin(d.a) * d.r);
  return { filtro: centro.clone().sub(eje), punta: centro.clone().add(eje) };
}

// Cajetilla de cigarros: caja roja y blanca con la tapa abierta y dos
// cigarros asomando.
function crearCajetilla() {
  const g = new THREE.Group();
  const W = 0.085;
  const H = 0.12;
  const D = 0.032;
  const lienzo = document.createElement('canvas');
  lienzo.width = 128;
  lienzo.height = 192;
  const c = lienzo.getContext('2d');
  c.fillStyle = '#f5f1ea';
  c.fillRect(0, 0, 128, 192);
  c.fillStyle = '#c8322b';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(128, 0);
  c.lineTo(128, 70);
  c.lineTo(64, 104);
  c.lineTo(0, 70);
  c.closePath();
  c.fill();
  c.fillStyle = '#2a2420';
  c.font = 'bold 22px -apple-system, Helvetica, sans-serif';
  c.textAlign = 'center';
  c.fillText('WIP', 64, 150);
  c.font = '13px -apple-system, Helvetica, sans-serif';
  c.fillText('FILTERS', 64, 170);
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  const matFrente = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
  const matLado = new THREE.MeshStandardMaterial({ color: '#efe9df', roughness: 0.55 });
  const matRojo = new THREE.MeshStandardMaterial({ color: '#c8322b', roughness: 0.55 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(W, H * 0.8, D), [matLado, matLado, matRojo, matLado, matFrente, matFrente]);
  cuerpo.position.y = (H * 0.8) / 2;
  cuerpo.castShadow = true;
  cuerpo.userData.solido = 'oficina';
  g.add(cuerpo);
  // tapa abierta hacia atrás
  const bisagra = new THREE.Group();
  bisagra.position.set(0, H * 0.8, -D / 2);
  bisagra.rotation.x = -1.9;
  const tapa = new THREE.Mesh(new THREE.BoxGeometry(W, H * 0.22, D), matRojo);
  tapa.position.set(0, (H * 0.22) / 2, D / 2);
  tapa.castShadow = true;
  bisagra.add(tapa);
  g.add(bisagra);
  // cigarros asomando
  [-0.022, 0.0, 0.022].forEach((x, i) => {
    const alto = [0.03, 0.045, 0.02][i];
    const cig = new THREE.Group();
    const papel = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, alto, 12), new THREE.MeshStandardMaterial({ color: '#d9a35f', roughness: 0.8 }));
    papel.position.y = alto / 2;
    cig.add(papel);
    cig.position.set(x, H * 0.8 - 0.01, 0);
    g.add(cig);
  });
  return g;
}

export function crearOficina(scene, { anisotropia = 4 } = {}) {
  const oficina = new THREE.Group();

  // ---------- Piso, pared, zócalo, alfombra ----------
  const piso = malla(
    new THREE.PlaneGeometry(26, 22),
    new THREE.MeshStandardMaterial({ color: COLORES.piso, roughness: 0.95 }),
    { y: 0, sombra: false, recibe: true }
  );
  piso.rotation.x = -Math.PI / 2;
  oficina.add(piso);

  const pared = malla(
    new THREE.PlaneGeometry(20, 7),
    new THREE.MeshStandardMaterial({ color: COLORES.pared, roughness: 1 }),
    { y: 3.5, z: -2.1, sombra: false, recibe: true }
  );
  oficina.add(pared);

  const zocalo = malla(
    new RoundedBoxGeometry(20, 0.16, 0.08, 2, 0.03),
    new THREE.MeshStandardMaterial({ color: COLORES.zocalo, roughness: 0.8 }),
    { y: 0.08, z: -2.05, sombra: false, recibe: true }
  );
  oficina.add(zocalo);

  const alfombra = malla(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshStandardMaterial({ color: COLORES.alfombra, roughness: 1 }),
    { x: -0.6, y: 0.006, z: -0.2, sombra: false, recibe: true }
  );
  alfombra.rotation.x = -Math.PI / 2;
  alfombra.scale.set(2.5, 1.9, 1);
  oficina.add(alfombra);

  // ---------- Ventana ----------
  const ventana = new THREE.Group();
  ventana.position.copy(POS_VENTANA);
  const marcoMat = new THREE.MeshStandardMaterial({ color: '#fbf6ee', roughness: 0.6 });
  const vidrio = malla(
    new THREE.PlaneGeometry(1.5, 1.2),
    new THREE.MeshBasicMaterial({ map: texturaCielo() }),
    { sombra: false }
  );
  ventana.add(vidrio);
  const grosor = 0.08;
  [
    [0, 0.64, 1.68, grosor],
    [0, -0.64, 1.68, grosor],
    [-0.79, 0, grosor, 1.36],
    [0.79, 0, grosor, 1.36],
    [0, 0, 0.05, 1.28],
    [0, 0, 1.6, 0.05],
  ].forEach(([x, y, w, h]) => {
    ventana.add(malla(new RoundedBoxGeometry(w, h, 0.07, 2, 0.02), marcoMat, { x, y, z: 0.02 }));
  });
  ventana.add(malla(new RoundedBoxGeometry(1.8, 0.09, 0.22, 2, 0.03), marcoMat, { y: -0.72, z: 0.08 }));
  oficina.add(ventana);

  // ---------- Póster ----------
  const poster = malla(
    new THREE.PlaneGeometry(0.72, 0.92),
    new THREE.MeshStandardMaterial({ map: texturaPoster(), roughness: 0.9 }),
    { x: 0.95, y: 1.95, z: -2.07, sombra: false }
  );
  oficina.add(poster);

  // ---------- Reloj de pared ----------
  const reloj = new THREE.Group();
  reloj.position.set(0.15, 2.3, -2.04);
  const caraReloj = malla(
    new THREE.CircleGeometry(0.26, 40),
    new THREE.MeshStandardMaterial({ map: texturaCaraReloj(), roughness: 0.6 }),
    { z: 0.05, sombra: false }
  );
  reloj.add(caraReloj);
  const aro = malla(
    new THREE.TorusGeometry(0.272, 0.028, 12, 40),
    new THREE.MeshStandardMaterial({ color: '#43505f', roughness: 0.5 }),
    { z: 0.05 }
  );
  reloj.add(aro);
  const manecillaHora = malla(
    new RoundedBoxGeometry(0.028, 0.13, 0.016, 1, 0.008),
    new THREE.MeshStandardMaterial({ color: '#2b3542' }),
    { z: 0.05, sombra: false }
  );
  manecillaHora.geometry.translate(0, 0.065, 0);
  manecillaHora.position.z = 0.065;
  reloj.add(manecillaHora);
  const manecillaMin = malla(
    new RoundedBoxGeometry(0.02, 0.2, 0.014, 1, 0.007),
    new THREE.MeshStandardMaterial({ color: '#5a6675' }),
    { z: 0.06, sombra: false }
  );
  manecillaMin.geometry.translate(0, 0.1, 0);
  manecillaMin.position.z = 0.072;
  reloj.add(manecillaMin);
  reloj.add(
    malla(new THREE.SphereGeometry(0.025, 12, 12), new THREE.MeshStandardMaterial({ color: '#2b3542' }), {
      z: 0.07,
      sombra: false,
    })
  );
  oficina.add(reloj);

  // ---------- Planta ----------
  const planta = new THREE.Group();
  planta.position.set(1.7, 0, -1.6);
  const maceta = malla(
    new THREE.CylinderGeometry(0.26, 0.2, 0.38, 20),
    new THREE.MeshStandardMaterial({ color: '#c9774f', roughness: 0.85 }),
    { y: 0.19, recibe: true }
  );
  planta.add(maceta);
  planta.add(
    malla(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 20), new THREE.MeshStandardMaterial({ color: '#d98a61' }), {
      y: 0.37,
    })
  );
  planta.add(
    malla(new THREE.CylinderGeometry(0.23, 0.23, 0.04, 20), new THREE.MeshStandardMaterial({ color: '#4a3a2c' }), {
      y: 0.39,
    })
  );
  const hojaGeo = new THREE.SphereGeometry(1, 14, 10);
  hojaGeo.scale(0.075, 0.46, 0.035);
  const verdes = ['#5f9e5c', '#74b06c', '#528f52'];
  for (let i = 0; i < 9; i++) {
    const hoja = malla(hojaGeo, new THREE.MeshStandardMaterial({ color: verdes[i % 3], roughness: 0.75 }), {
      y: 0.78,
    });
    hoja.rotation.z = (Math.random() - 0.5) * 0.9;
    hoja.rotation.x = (Math.random() - 0.5) * 0.7;
    hoja.rotation.y = (i / 9) * Math.PI * 2;
    hoja.position.x = Math.cos((i / 9) * Math.PI * 2) * 0.09;
    hoja.position.z = Math.sin((i / 9) * Math.PI * 2) * 0.09;
    hoja.position.y = 0.72 + Math.random() * 0.18;
    planta.add(hoja);
  }
  oficina.add(planta);

  // ---------- Escritorio ----------
  const solido = (m) => {
    m.userData.solido = 'oficina';
    return m;
  };
  const maderaTex = texturaMadera();
  maderaTex.anisotropy = anisotropia;
  const tablero = solido(
    malla(
      new RoundedBoxGeometry(ESCRITORIO.ancho, 0.1, ESCRITORIO.fondo, 4, 0.035),
      new THREE.MeshStandardMaterial({ map: maderaTex, color: '#ffffff', roughness: 0.6 }),
      { x: ESCRITORIO.x, y: ALTO_ESCRITORIO - 0.05, z: ESCRITORIO.z, recibe: true }
    )
  );
  oficina.add(tablero);

  const patas = new THREE.MeshStandardMaterial({ color: '#a9793f', roughness: 0.7 });
  const mx = ESCRITORIO.ancho / 2 - 0.1;
  const mz = ESCRITORIO.fondo / 2 - 0.08;
  [
    [-mx, -mz],
    [mx, -mz],
    [-mx, mz],
    [mx, mz],
  ].forEach(([x, z]) => {
    oficina.add(
      solido(
        malla(new RoundedBoxGeometry(0.1, 0.9, 0.1, 2, 0.025), patas, {
          x: ESCRITORIO.x + x,
          y: 0.45,
          z: ESCRITORIO.z + z,
          recibe: true,
        })
      )
    );
  });

  // ---------- Monitor (girado entre la mosca y la cámara) ----------
  const monitor = new THREE.Group();
  monitor.position.copy(POS_MONITOR);
  monitor.rotation.y = ROT_MONITOR;
  monitor.scale.setScalar(ESCALA_MONITOR);
  const matMonitor = new THREE.MeshStandardMaterial({ color: COLORES.plastico, roughness: 0.45 });
  monitor.add(solido(malla(new RoundedBoxGeometry(0.44, 0.04, 0.28, 2, 0.015), matMonitor, { y: 0.02, recibe: true })));
  monitor.add(solido(malla(new RoundedBoxGeometry(0.075, 0.28, 0.06, 2, 0.02), matMonitor, { y: 0.16 })));
  monitor.add(solido(malla(new RoundedBoxGeometry(0.98, 0.63, 0.05, 3, 0.026), matMonitor, { y: 0.63 })));

  const { ctx: kanbanCtx, textura: kanbanTextura } = crearTexturaKanban(anisotropia);
  dibujarKanban(kanbanCtx, { porHacer: 0, enCurso: 0, hechas: 0, hora: '09:00' });
  kanbanTextura.needsUpdate = true;
  const pantalla = malla(
    new THREE.PlaneGeometry(0.9, 0.55),
    new THREE.MeshBasicMaterial({ map: kanbanTextura }),
    { y: 0.63, z: 0.028, sombra: false }
  );
  monitor.add(pantalla);
  oficina.add(monitor);

  // ---------- Mousepad, teclado y mouse (frente a la mosca) ----------
  const mousepad = malla(
    new RoundedBoxGeometry(MOUSEPAD.ancho, 0.012, MOUSEPAD.fondo, 2, 0.006),
    new THREE.MeshStandardMaterial({ color: '#56657a', roughness: 0.95 }),
    { x: POS_MOUSEPAD.x, y: ALTO_ESCRITORIO + 0.006, z: POS_MOUSEPAD.z, sombra: false, recibe: true }
  );
  mousepad.rotation.y = TECLADO.rot;
  oficina.add(mousepad);

  const teclado = new THREE.Group();
  teclado.position.copy(TECLADO.pos).setY(ALTO_ESCRITORIO + 0.012);
  teclado.rotation.y = TECLADO.rot;
  teclado.add(
    solido(
      malla(
        new RoundedBoxGeometry(TECLADO.ancho, 0.035, TECLADO.fondo, 2, 0.012),
        new THREE.MeshStandardMaterial({ color: '#2f343d', roughness: 0.6 }),
        { y: 0.0175, recibe: true }
      )
    )
  );
  const tapaTeclas = malla(
    new THREE.PlaneGeometry(TECLADO.ancho - 0.03, TECLADO.fondo - 0.025),
    new THREE.MeshStandardMaterial({ map: texturaTeclado(), roughness: 0.7 }),
    { y: 0.0365, sombra: false, recibe: true }
  );
  tapaTeclas.rotation.x = -Math.PI / 2;
  teclado.add(tapaTeclas);
  oficina.add(teclado);

  const mouse = solido(
    malla(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: '#3b424d', roughness: 0.5 }), {
      x: POS_MOUSE.x,
      y: ALTO_ESCRITORIO + 0.012,
      z: POS_MOUSE.z,
    })
  );
  mouse.scale.set(0.05, 0.024, 0.075);
  mouse.rotation.y = MOSCA.rumbo;
  oficina.add(mouse);

  // ---------- Taza ----------
  const taza = new THREE.Group();
  taza.position.copy(POS_TAZA);
  const matTaza = new THREE.MeshStandardMaterial({ color: '#f3f0e8', roughness: 0.35 });
  taza.add(solido(malla(new THREE.CylinderGeometry(0.085, 0.072, 0.13, 22), matTaza, { y: 0.065, recibe: true })));
  const asa = malla(new THREE.TorusGeometry(0.045, 0.014, 10, 20, Math.PI * 1.3), matTaza, { x: 0.095, y: 0.07 });
  asa.rotation.y = Math.PI / 2;
  taza.add(asa);
  taza.add(
    malla(new THREE.CylinderGeometry(0.075, 0.075, 0.01, 22), new THREE.MeshStandardMaterial({ color: '#6b4631', roughness: 0.3 }), {
      y: 0.126,
      sombra: false,
    })
  );
  oficina.add(taza);

  // ---------- Cenicero: cerámica con hueco de verdad ----------
  const cenicero = new THREE.Group();
  cenicero.position.copy(POS_CENICERO);
  const perfilCenicero = [
    [0, 0],
    [0.16, 0],
    [0.172, 0.008],
    [0.176, 0.045],
    [0.169, 0.062],
    [0.156, 0.067],
    [0.144, 0.061],
    [0.128, 0.026],
    [0.118, SUELO_CENICERO],
    [0, SUELO_CENICERO],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const cuenco = solido(
    malla(
      new THREE.LatheGeometry(perfilCenicero, 48),
      new THREE.MeshStandardMaterial({ color: COLORES.ceramica, roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide }),
      { recibe: true }
    )
  );
  cenicero.add(cuenco);
  const ceniza = malla(
    new THREE.CylinderGeometry(1, 1.15, 1, 28),
    new THREE.MeshStandardMaterial({ color: COLORES.ceniza, roughness: 1 }),
    { y: SUELO_CENICERO, sombra: false, recibe: true }
  );
  ceniza.visible = false;
  cenicero.add(ceniza);
  oficina.add(cenicero);

  const cajetilla = crearCajetilla();
  cajetilla.position.copy(POS_CAJETILLA);
  cajetilla.rotation.y = MOSCA.rumbo + Math.PI + 0.5;
  oficina.add(cajetilla);

  // Lugares para colillas desbordadas: sobre el escritorio alrededor del
  // cenicero, sin caer encima de la taza, la cajetilla o el teclado, ni del
  // lado de la mosca, y separadas entre sí.
  const ocupados = [
    { p: POS_TAZA, r: 0.17 },
    { p: POS_CAJETILLA, r: 0.13 },
    { p: TECLADO.pos, r: 0.34 },
    { p: POS_MOUSE, r: 0.12 },
  ];
  const haciaMosca = Math.atan2(MOSCA.z - POS_CENICERO.z, MOSCA.x - POS_CENICERO.x);
  const zMin = ESCRITORIO.z - ESCRITORIO.fondo / 2 + 0.08;
  const zMax = ESCRITORIO.z + ESCRITORIO.fondo / 2 - 0.08;
  const desbordes = [];
  for (const r of [0.27, 0.34, 0.41, 0.48]) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2 + r * 3;
      const x = POS_CENICERO.x + Math.cos(a) * r;
      const z = POS_CENICERO.z + Math.sin(a) * r;
      const lado = Math.abs(Math.atan2(Math.sin(a - haciaMosca), Math.cos(a - haciaMosca)));
      if (lado < 0.7 || z < zMin || z > zMax) continue;
      if (ocupados.some((o) => Math.hypot(o.p.x - x, o.p.z - z) < o.r)) continue;
      if (desbordes.some((d) => Math.hypot(d.x - x, d.z - z) < 0.085)) continue;
      desbordes.push({ a, r, x, z, giro: a * 2.3 + k });
    }
  }

  const colillas = [];
  function agregarColilla() {
    const n = colillas.length;
    const colilla = crearColilla();
    const { filtro, punta } = ubicacionColilla(n, desbordes);
    colilla.position.addVectors(filtro, punta).multiplyScalar(0.5);
    colilla.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), punta.clone().sub(filtro).normalize());
    if (n < CAPACIDAD) colilla.rotateY(Math.random() * Math.PI * 2);
    cenicero.add(colilla);
    colillas.push(colilla);
    ceniza.visible = true;
    const r = Math.min(0.112, 0.05 + n * 0.006);
    const alto = 0.004 + Math.min(n, 12) * 0.0008;
    ceniza.scale.set(r, alto, r);
    ceniza.position.y = SUELO_CENICERO + alto / 2;
  }

  function limpiarColillas() {
    colillas.forEach((c) => cenicero.remove(c));
    colillas.length = 0;
    ceniza.visible = false;
  }

  // ---------- Vapor del café: hilos blancos suaves que suben y se van ----------
  const texVapor = texturasHumo(3);
  const vapor = [];
  const bocaTaza = new THREE.Vector3(POS_TAZA.x, ALTO_ESCRITORIO + 0.13, POS_TAZA.z);
  for (let i = 0; i < 26; i++) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texVapor[i % 3], color: '#e9edf2', transparent: true, depthWrite: false, opacity: 0 })
    );
    sp.visible = false;
    sp.userData = { edad: 0, vida: 1, semilla: 0 };
    oficina.add(sp);
    vapor.push(sp);
  }
  let acumVapor = 0;
  let tVapor = 0;
  function actualizarVapor(dt) {
    tVapor += dt;
    acumVapor += dt * 8;
    while (acumVapor >= 1) {
      acumVapor -= 1;
      const libre = vapor.find((p) => !p.visible);
      if (!libre) break;
      libre.visible = true;
      libre.position.copy(bocaTaza).add(new THREE.Vector3((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.5) * 0.06));
      Object.assign(libre.userData, { edad: 0, vida: 2.4 + Math.random() * 1.2, semilla: Math.random() * 10 });
      libre.material.rotation = Math.random() * Math.PI * 2;
    }
    vapor.forEach((p) => {
      if (!p.visible) return;
      const u = p.userData;
      u.edad += dt;
      const a = u.edad / u.vida;
      if (a >= 1) {
        p.visible = false;
        return;
      }
      p.position.y += dt * (0.06 + a * 0.04);
      p.position.x += Math.sin(tVapor * 1.3 + u.semilla + a * 4) * 0.03 * dt;
      p.position.z += Math.cos(tVapor * 1.1 + u.semilla) * 0.02 * dt;
      p.scale.setScalar(0.045 + a * 0.16);
      p.material.rotation += dt * 0.2;
      p.material.opacity = 0.8 * Math.min(1, a / 0.12) * Math.pow(1 - a, 1.4);
    });
  }

  scene.add(oficina);

  return {
    actualizar(dt) {
      actualizarVapor(Math.min(dt, 0.05));
    },
    grupo: oficina,
    actualizarKanban(estado) {
      dibujarKanban(kanbanCtx, estado);
      kanbanTextura.needsUpdate = true;
    },
    actualizarReloj(fraccionDelDia) {
      const horaDelDia = 9 + fraccionDelDia * 9;
      manecillaHora.rotation.z = -((horaDelDia % 12) / 12) * Math.PI * 2;
      manecillaMin.rotation.z = -(horaDelDia % 1) * Math.PI * 2;
    },
    agregarColilla,
    limpiarColillas,
  };
}
