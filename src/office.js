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

// Dónde cae cada colilla dentro del cenicero: primero un anillo apoyado en el
// borde, luego otro encima, y al final un montoncito en el centro.
const SUELO_CENICERO = 0.019;
function ubicacionColilla(n) {
  const capas = [
    { cuantas: 6, giro: 10, adentro: [0.035, 0.035], afuera: [0.128, 0.06] },
    { cuantas: 6, giro: 40, adentro: [0.05, 0.066], afuera: [0.14, 0.086] },
    { cuantas: 5, giro: 15, adentro: [0.032, 0.106], afuera: [0.122, 0.121] },
  ];
  let i = n;
  for (const c of capas) {
    if (i < c.cuantas) {
      const a = ((c.giro + (i * 360) / c.cuantas) * Math.PI) / 180;
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const pIn = dir.clone().multiplyScalar(c.adentro[0]).setY(c.adentro[1]);
      const pOut = dir.clone().multiplyScalar(c.afuera[0]).setY(c.afuera[1]);
      return { filtro: pOut, punta: pIn };
    }
    i -= c.cuantas;
  }
  // Encima de todo: cruzadas sobre el centro
  const a = (i * 60 * Math.PI) / 180 + 0.3;
  const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
  const y = 0.142 + i * 0.03;
  return {
    filtro: dir.clone().multiplyScalar(LARGO_COLILLA / 2).setY(y),
    punta: dir.clone().multiplyScalar(-LARGO_COLILLA / 2).setY(y),
  };
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
    new RoundedBoxGeometry(0.98, 0.012, 0.4, 2, 0.006),
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

  const colillas = [];
  function agregarColilla() {
    const n = colillas.length;
    const colilla = crearColilla();
    const { filtro, punta } = ubicacionColilla(n);
    colilla.position.addVectors(filtro, punta).multiplyScalar(0.5);
    colilla.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), punta.clone().sub(filtro).normalize());
    colilla.rotateY(Math.random() * Math.PI * 2);
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
