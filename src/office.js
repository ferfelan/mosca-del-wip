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
  POS_PILA,
  ROT_TAZA,
  POS_LAMPARA,
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

function texturaPostit(color, lineas) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 0, 128, 18);
  ctx.fillStyle = '#3a3226';
  ctx.font = 'italic 600 24px "Marker Felt", "Comic Sans MS", cursive';
  ctx.textAlign = 'center';
  lineas.forEach((t, i) => ctx.fillText(t, 64, 58 + i * 32));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaCharcoLuz() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,214,150,0.22)');
  g.addColorStop(0.6, 'rgba(255,214,150,0.08)');
  g.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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

  // Post-its pegados en el borde del monitor (sobre el marco, sin tapar el kanban)
  [
    { x: 0.52, y: 0.82, giro: -0.12, color: '#ffe46b', texto: ['¡urgente!', 'cliente'] },
    { x: 0.525, y: 0.6, giro: 0.1, color: '#ff9ec7', texto: ['revisar', 'informe'] },
    { x: -0.52, y: 0.74, giro: 0.14, color: '#a6e3a1', texto: ['WIP ≤ 3', ':)'] },
  ].forEach(({ x, y, giro, color, texto }) => {
    const nota = malla(
      new THREE.BoxGeometry(0.088, 0.088, 0.002),
      new THREE.MeshStandardMaterial({ map: texturaPostit(color, texto), roughness: 0.85 }),
      { x, y, z: 0.027, sombra: false }
    );
    nota.rotation.z = giro;
    monitor.add(nota);
  });
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
  // La manilla es una "C" redondeada cuyos extremos entran en la pared de la
  // taza (bien unida). La mosca la toma por el centro de la "C".
  const taza = new THREE.Group();
  taza.position.copy(POS_TAZA);
  taza.rotation.y = ROT_TAZA;
  const matTaza = new THREE.MeshStandardMaterial({ color: '#f3f0e8', roughness: 0.35 });
  taza.add(solido(malla(new THREE.CylinderGeometry(0.085, 0.072, 0.13, 32), matTaza, { y: 0.065, recibe: true })));
  const ARCO_ASA = Math.PI * 1.3;
  const R_ASA = 0.038;
  const X_ASA = 0.092;
  const Y_ASA = 0.07;
  const asa = malla(new THREE.TorusGeometry(R_ASA, 0.012, 14, 40, ARCO_ASA), matTaza, { x: X_ASA, y: Y_ASA });
  asa.rotation.z = -ARCO_ASA / 2;
  taza.add(asa);
  taza.add(
    malla(new THREE.CylinderGeometry(0.077, 0.077, 0.006, 32), new THREE.MeshStandardMaterial({ color: '#6b4631', roughness: 0.25 }), {
      y: 0.118,
      sombra: false,
    })
  );
  // Borde un poco más grueso (se ve más "taza")
  const bordeTaza = malla(new THREE.TorusGeometry(0.083, 0.005, 8, 40), matTaza, { y: 0.13, sombra: false });
  bordeTaza.rotation.x = Math.PI / 2;
  taza.add(bordeTaza);
  oficina.add(taza);
  // Pose de descanso (la mosca la levanta y la vuelve a dejar aquí)
  const reposoTaza = { posicion: taza.position.clone(), rotacion: taza.quaternion.clone() };
  // Donde la pata toma la manilla, y el borde por donde bebe (en la taza)
  const AGARRE_TAZA = new THREE.Vector3(X_ASA + R_ASA + 0.014, Y_ASA, 0);
  const BORDE_TAZA = new THREE.Vector3(0, 0.13, 0);

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
    { p: POS_PILA, r: 0.42 },
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

  // ---------- Pila de trabajo: crece con las tareas en curso ----------
  // Cada tarea en curso suma una carpeta con un fajo de hojas encima. Con
  // pocas tareas: pila chica y ordenada. Con muchas: torre alta, torcida y
  // desordenada, con hojas que asoman y hojas sueltas sobre el escritorio.
  const MAX_CAPAS = 10;
  const pila = new THREE.Group();
  pila.position.copy(POS_PILA);
  pila.rotation.y = 0.35;
  oficina.add(pila);
  const coloresPestana = ['#4f86c6', '#e0794f', '#6aa86f', '#c9a227', '#9b6fc4'];
  const coloresCarpeta = ['#e7c983', '#e7c983', '#9fc1e0', '#e7c983', '#f0a8a0'];
  const matPapel = new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: 0.9 });
  const matPapel2 = new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: 0.9 });
  const geoHoja = new THREE.BoxGeometry(0.21, 0.0035, 0.29);
  const capas = [];
  for (let i = 0; i < MAX_CAPAS; i++) {
    const g = new THREE.Group();
    const matCarpeta = new THREE.MeshStandardMaterial({ color: coloresCarpeta[i % coloresCarpeta.length], roughness: 0.85 });
    // Carpeta de cartulina con hojas adentro que asoman por un costado
    const tapa = malla(new RoundedBoxGeometry(0.31, 0.02, 0.23, 2, 0.004), matCarpeta, { y: 0.01, recibe: true });
    tapa.userData.solido = 'oficina';
    g.add(tapa);
    g.add(
      malla(new THREE.BoxGeometry(0.28, 0.01, 0.2), matPapel, {
        x: 0.03 + Math.random() * 0.03,
        y: 0.01,
        z: (Math.random() - 0.5) * 0.03,
        recibe: true,
      })
    );
    g.add(
      malla(
        new RoundedBoxGeometry(0.07, 0.014, 0.03, 1, 0.004),
        new THREE.MeshStandardMaterial({ color: coloresPestana[i % coloresPestana.length], roughness: 0.7 }),
        { x: -0.06 + (i % 3) * 0.06, y: 0.009, z: -0.124 }
      )
    );
    // Fajo de hojas encima de la carpeta
    const hojas = [];
    for (let k = 0; k < 6; k++) {
      const hoja = malla(geoHoja, k % 2 ? matPapel : matPapel2, { y: 0.0215 + k * 0.0042, recibe: true });
      hoja.rotation.y = Math.PI / 2;
      hoja.userData = { azarX: Math.random() - 0.5, azarZ: Math.random() - 0.5, azarGiro: Math.random() - 0.5 };
      g.add(hoja);
      hojas.push(hoja);
    }
    // Una hoja que asoma por un costado (sólo con desorden)
    const asoma = malla(geoHoja, matPapel, { y: 0.022, recibe: true });
    asoma.userData = { lado: i % 2 ? 1 : -1, azar: Math.random() };
    g.add(asoma);
    g.visible = false;
    g.userData = {
      presencia: 0,
      azarGiro: Math.random() - 0.5,
      azarX: Math.random() - 0.5,
      azarZ: Math.random() - 0.5,
      hojas,
      asoma,
    };
    pila.add(g);
    capas.push(g);
  }
  const ALTO_CAPA = 0.0215 + 6 * 0.0042;

  // Hojas sueltas sobre el escritorio alrededor de la pila (con WIP alto)
  const sueltas = [];
  [
    [0.27, -0.1, 0.4],
    [-0.05, 0.27, 1.2],
    [0.22, 0.22, 2.1],
    [-0.3, -0.12, 0.7],
    [0.05, -0.28, 2.6],
  ].forEach(([x, z, giro], i) => {
    const hoja = malla(geoHoja, i % 2 ? matPapel : matPapel2, { x, y: 0.002 + i * 0.0005, z, recibe: true });
    hoja.rotation.y = giro;
    hoja.visible = false;
    hoja.userData = { presencia: 0, umbral: 0.35 + i * 0.13 };
    pila.add(hoja);
    sueltas.push(hoja);
  });

  let carpetasObjetivo = 0;
  let desorden = 0;
  function actualizarPila(dt) {
    desorden += (Math.min(1, Math.max(0, (carpetasObjetivo - 3) / 7)) - desorden) * (1 - Math.exp(-2 * dt));
    let altura = 0;
    let derivaX = 0;
    let derivaZ = 0;
    capas.forEach((g, i) => {
      const u = g.userData;
      const objetivo = i < carpetasObjetivo ? 1 : 0;
      u.presencia += (objetivo - u.presencia) * (1 - Math.exp(-4 * dt));
      g.visible = u.presencia > 0.02;
      if (!g.visible) return;
      // Más arriba, más desorden; la torre se va inclinando de a poco
      const m = desorden * (0.3 + 0.7 * (i / MAX_CAPAS));
      derivaX += 0.012 * desorden;
      derivaZ += u.azarZ * 0.01 * desorden;
      // cae desde arriba al aparecer
      g.position.set(derivaX + u.azarX * 0.07 * m, altura + (1 - u.presencia) * 0.2, derivaZ + u.azarZ * 0.05 * m);
      g.rotation.set(u.azarZ * 0.04 * m, u.azarGiro * 1.0 * m, u.azarX * 0.035 * m);
      g.scale.setScalar(0.6 + 0.4 * u.presencia);
      u.hojas.forEach((h) => {
        const d = h.userData;
        h.position.x = d.azarX * 0.035 * m;
        h.position.z = d.azarZ * 0.035 * m;
        h.rotation.y = Math.PI / 2 + d.azarGiro * 0.7 * m;
      });
      const a = u.asoma;
      a.visible = desorden > 0.15;
      a.position.x = a.userData.lado * (0.06 + 0.07 * desorden);
      a.position.y = 0.022 + 0.01 * a.userData.azar;
      a.rotation.set(0, a.userData.lado * (0.4 + a.userData.azar * 0.5), a.userData.lado * 0.05 * desorden);
      altura += ALTO_CAPA * u.presencia;
    });
    sueltas.forEach((h) => {
      const u = h.userData;
      u.presencia += ((desorden > u.umbral ? 1 : 0) - u.presencia) * (1 - Math.exp(-3 * dt));
      h.visible = u.presencia > 0.02;
      h.scale.setScalar(Math.max(0.01, u.presencia));
    });
  }

  // ---------- Lámpara de escritorio (ilumina la pila) ----------
  const lampara = new THREE.Group();
  lampara.position.copy(POS_LAMPARA);
  oficina.add(lampara);
  const matLampara = new THREE.MeshStandardMaterial({ color: '#d9a23b', roughness: 0.45, metalness: 0.15 });
  const matArticulacion = new THREE.MeshStandardMaterial({ color: '#3b424d', roughness: 0.5 });
  const baseLampara = malla(new THREE.CylinderGeometry(0.1, 0.115, 0.03, 32), matLampara, { y: 0.015, recibe: true });
  baseLampara.userData.solido = 'oficina';
  lampara.add(baseLampara);
  // Brazos: del pie hacia arriba y luego hacia la pila
  const objetivoLuz = POS_PILA.clone().add(new THREE.Vector3(0, 0.05, 0));
  const hombro = new THREE.Vector3(0, 0.04, 0).add(POS_LAMPARA);
  const codo = POS_LAMPARA.clone().add(new THREE.Vector3(-0.08, 0.42, 0.05));
  const muneca = POS_LAMPARA.clone().lerp(objetivoLuz, 0.42).setY(ALTO_ESCRITORIO + 0.5);
  const brazo = (a, b) => {
    const largo = a.distanceTo(b);
    const m = malla(new THREE.CylinderGeometry(0.012, 0.012, largo, 12), matLampara);
    m.position.copy(a).add(b).multiplyScalar(0.5).sub(POS_LAMPARA);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    lampara.add(m);
  };
  brazo(hombro, codo);
  brazo(codo, muneca);
  [hombro, codo, muneca].forEach((p) => {
    lampara.add(malla(new THREE.SphereGeometry(0.022, 14, 10), matArticulacion, { x: p.x - POS_LAMPARA.x, y: p.y - POS_LAMPARA.y, z: p.z - POS_LAMPARA.z }));
  });
  const cabezal = new THREE.Group();
  cabezal.position.copy(muneca).sub(POS_LAMPARA);
  cabezal.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), objetivoLuz.clone().sub(muneca).normalize());
  lampara.add(cabezal);
  const pantallaLampara = malla(new THREE.CylinderGeometry(0.035, 0.1, 0.12, 28, 1, true), new THREE.MeshStandardMaterial({ color: '#d9a23b', roughness: 0.45, metalness: 0.15, side: THREE.DoubleSide }), { y: -0.04 });
  cabezal.add(pantallaLampara);
  cabezal.add(malla(new THREE.SphereGeometry(0.04, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), matLampara, { y: 0.02 }));
  const ampolleta = malla(
    new THREE.SphereGeometry(0.035, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#ffd98a', emissiveIntensity: 1.6 }),
    { y: -0.08, sombra: false }
  );
  cabezal.add(ampolleta);
  const luzLampara = new THREE.PointLight('#ffd9a0', 0.55, 1.1, 2);
  luzLampara.position.copy(muneca).sub(POS_LAMPARA).add(objetivoLuz.clone().sub(muneca).normalize().multiplyScalar(0.12));
  lampara.add(luzLampara);
  // Círculo de luz cálida sobre el escritorio (pintado, no cuesta nada)
  const charco = malla(
    new THREE.CircleGeometry(0.42, 40),
    new THREE.MeshBasicMaterial({ map: texturaCharcoLuz(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    { x: objetivoLuz.x - POS_LAMPARA.x, y: 0.0015, z: objetivoLuz.z - POS_LAMPARA.z, sombra: false }
  );
  charco.rotation.x = -Math.PI / 2;
  lampara.add(charco);

  // ---------- Vapor del café: hilos blancos suaves que suben y se van ----------
  const texVapor = texturasHumo(3);
  const vapor = [];
  const bocaTaza = new THREE.Vector3();
  // Temperatura del café: caliente con estrés bajo; con estrés alto se
  // olvida del café y se enfría de a poco (el vapor se apaga).
  let calor = 1;
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
  function actualizarVapor(dt, estres) {
    tVapor += dt;
    const objetivoCalor = 1 - Math.min(1, Math.max(0, (estres - 0.35) / 0.25));
    // se enfría lento (~10 s) y se "recalienta" (taza nueva) un poco más rápido
    calor += (objetivoCalor - calor) * (1 - Math.exp(-dt / (objetivoCalor < calor ? 10 : 6)));
    taza.localToWorld(bocaTaza.copy(BORDE_TAZA));
    acumVapor += dt * 8 * calor;
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
      p.material.opacity = 0.8 * Math.max(0.15, calor) * Math.min(1, a / 0.12) * Math.pow(1 - a, 1.4);
    });
  }

  scene.add(oficina);

  return {
    actualizar(dt, estres = 0) {
      actualizarVapor(Math.min(dt, 0.05), estres);
      actualizarPila(Math.min(dt, 0.05));
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
    taza,
    reposoTaza,
    AGARRE_TAZA,
    BORDE_TAZA,
    calorCafe: () => calor,
    actualizarPilaTareas(enCurso) {
      carpetasObjetivo = Math.min(MAX_CAPAS, enCurso);
    },
    agregarColilla,
    limpiarColillas,
  };
}
