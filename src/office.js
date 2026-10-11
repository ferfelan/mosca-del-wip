import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { crearTexturaKanban, dibujarKanban } from './kanban.js';
import {
  texturaCielo,
  texturaPoster,
  texturaTeclado,
  texturaCaraReloj,
  texturaMadera,
} from './textures.js';

export const ALTO_ESCRITORIO = 0.95;
export const POS_CENICERO = new THREE.Vector3(-0.28, ALTO_ESCRITORIO, 0.16);

const COLORES = {
  pared: '#ead9c4',
  zocalo: '#f6ece0',
  piso: '#e8d3b4',
  alfombra: '#dfc2c0',
  metal: '#3a4350',
  plastico: '#262c35',
  ceramica: '#e7e0d2',
  ceniza: '#4b4640',
};

function malla(geo, mat, { x = 0, y = 0, z = 0, sombra = true, recibe = false } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = sombra;
  m.receiveShadow = recibe;
  return m;
}

function crearColilla() {
  const g = new THREE.Group();
  const papel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.021, 0.021, 0.1, 10),
    new THREE.MeshStandardMaterial({ color: '#f6f3ec', roughness: 0.85 })
  );
  g.add(papel);
  const filtro = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.042, 10),
    new THREE.MeshStandardMaterial({ color: '#d4a263', roughness: 0.9 })
  );
  filtro.position.y = -0.07;
  g.add(filtro);
  const quemado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.019, 0.021, 0.022, 10),
    new THREE.MeshStandardMaterial({ color: '#2f2a26', roughness: 1 })
  );
  quemado.position.y = 0.06;
  g.add(quemado);
  g.traverse((o) => {
    o.castShadow = true;
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
  ventana.position.set(-2.0, 1.85, -2.06);
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
    { x: 0.48, y: 1.9, z: -2.07, sombra: false }
  );
  oficina.add(poster);

  // ---------- Reloj de pared ----------
  const reloj = new THREE.Group();
  reloj.position.set(-0.38, 2.12, -2.04);
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
  planta.position.set(1.45, 0, -1.55);
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
  const maderaTex = texturaMadera();
  maderaTex.anisotropy = anisotropia;
  const tablero = malla(
    new RoundedBoxGeometry(3.4, 0.1, 1.15, 4, 0.035),
    new THREE.MeshStandardMaterial({ map: maderaTex, color: '#ffffff', roughness: 0.6 }),
    { x: -0.4, y: ALTO_ESCRITORIO - 0.05, z: -0.12, recibe: true }
  );
  oficina.add(tablero);

  const patas = new THREE.MeshStandardMaterial({ color: '#a9793f', roughness: 0.7 });
  [
    [-2.0, -0.62],
    [1.15, -0.62],
    [-2.0, 0.38],
    [1.15, 0.38],
  ].forEach(([x, z]) => {
    oficina.add(
      malla(new RoundedBoxGeometry(0.1, 0.9, 0.1, 2, 0.025), patas, { x, y: 0.45, z, recibe: true })
    );
  });

  // ---------- Monitor ----------
  const monitor = new THREE.Group();
  monitor.position.set(0.12, ALTO_ESCRITORIO, -0.5);
  monitor.rotation.y = -0.45;
  const matMonitor = new THREE.MeshStandardMaterial({ color: COLORES.plastico, roughness: 0.45 });
  monitor.add(malla(new RoundedBoxGeometry(0.44, 0.04, 0.28, 2, 0.015), matMonitor, { y: 0.02, recibe: true }));
  monitor.add(malla(new RoundedBoxGeometry(0.075, 0.28, 0.06, 2, 0.02), matMonitor, { y: 0.16 }));
  monitor.add(malla(new RoundedBoxGeometry(0.98, 0.63, 0.05, 3, 0.026), matMonitor, { y: 0.63 }));

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

  // ---------- Mousepad, teclado y mouse ----------
  const mousepad = malla(
    new RoundedBoxGeometry(1.15, 0.012, 0.44, 2, 0.006),
    new THREE.MeshStandardMaterial({ color: '#56657a', roughness: 0.95 }),
    { x: -0.72, y: ALTO_ESCRITORIO + 0.006, z: -0.4, sombra: false, recibe: true }
  );
  mousepad.rotation.y = 0.75;
  oficina.add(mousepad);

  const teclado = new THREE.Group();
  teclado.position.set(-0.84, ALTO_ESCRITORIO + 0.012, -0.44);
  teclado.rotation.y = 0.75;
  teclado.add(
    malla(new RoundedBoxGeometry(0.64, 0.035, 0.24, 2, 0.012), new THREE.MeshStandardMaterial({ color: '#2f343d', roughness: 0.6 }), {
      y: 0.018,
      recibe: true,
    })
  );
  const tapaTeclas = malla(
    new THREE.PlaneGeometry(0.6, 0.21),
    new THREE.MeshStandardMaterial({ map: texturaTeclado(), roughness: 0.7 }),
    { y: 0.037, sombra: false }
  );
  tapaTeclas.rotation.x = -Math.PI / 2;
  teclado.add(tapaTeclas);
  oficina.add(teclado);

  const mouse = malla(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#3b424d', roughness: 0.5 }),
    { x: -0.32, y: ALTO_ESCRITORIO + 0.03, z: -0.3 }
  );
  mouse.scale.set(0.05, 0.022, 0.075);
  oficina.add(mouse);

  // ---------- Taza ----------
  const taza = new THREE.Group();
  taza.position.set(0.52, ALTO_ESCRITORIO, 0.18);
  const matTaza = new THREE.MeshStandardMaterial({ color: '#f3f0e8', roughness: 0.35 });
  taza.add(malla(new THREE.CylinderGeometry(0.085, 0.072, 0.13, 22), matTaza, { y: 0.065, recibe: true }));
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

  // ---------- Cenicero ----------
  const cenicero = new THREE.Group();
  cenicero.position.copy(POS_CENICERO);
  const matCeramica = new THREE.MeshStandardMaterial({ color: COLORES.ceramica, roughness: 0.3, metalness: 0.05 });
  cenicero.add(malla(new THREE.CylinderGeometry(0.21, 0.19, 0.05, 28), matCeramica, { y: 0.025, recibe: true }));
  cenicero.add(
    malla(new THREE.CylinderGeometry(0.168, 0.15, 0.055, 28), new THREE.MeshStandardMaterial({ color: '#8d8578', roughness: 0.95 }), {
      y: 0.036,
      sombra: false,
      recibe: true,
    })
  );
  const borde = malla(new THREE.TorusGeometry(0.2, 0.023, 10, 30), matCeramica, { y: 0.05 });
  borde.rotation.x = Math.PI / 2;
  cenicero.add(borde);
  const ceniza = malla(
    new THREE.SphereGeometry(0.13, 16, 10),
    new THREE.MeshStandardMaterial({ color: COLORES.ceniza, roughness: 1 }),
    { y: 0.04, sombra: false }
  );
  ceniza.scale.set(1, 0.12, 1);
  ceniza.visible = false;
  cenicero.add(ceniza);
  oficina.add(cenicero);

  const colillas = [];
  function agregarColilla() {
    const n = colillas.length;
    const colilla = crearColilla();
    colilla.scale.setScalar(0.85);
    if (n < 9) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.03 + Math.random() * 0.1;
      colilla.position.set(Math.cos(a) * r, 0.055 + n * 0.009, Math.sin(a) * r);
      colilla.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.18, Math.random() * Math.PI * 2, 0);
    } else {
      const a = Math.random() * Math.PI * 2;
      const r = 0.26 + Math.random() * 0.16;
      colilla.position.set(Math.cos(a) * r, 0.021, Math.sin(a) * r);
      colilla.rotation.set(Math.PI / 2, Math.random() * Math.PI * 2, 0);
    }
    cenicero.add(colilla);
    colillas.push(colilla);
    ceniza.visible = true;
    const crecer = Math.min(1, 0.4 + colillas.length * 0.07);
    ceniza.scale.set(crecer, 0.12 + colillas.length * 0.012, crecer);
  }

  function limpiarColillas() {
    colillas.forEach((c) => cenicero.remove(c));
    colillas.length = 0;
    ceniza.visible = false;
  }

  scene.add(oficina);

  return {
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
