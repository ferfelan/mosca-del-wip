import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { crearTexturaKanban, dibujarKanban } from './kanban.js';

function texturaTexto({ ancho = 256, alto = 128, fondo, texto, colorTexto, fuente }) {
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ancho, alto);
  ctx.fillStyle = colorTexto;
  ctx.font = fuente;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, ancho / 2, alto / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function crearOficina(scene) {
  const oficina = new THREE.Group();

  // --- Piso ---
  const piso = new THREE.Mesh(
    new THREE.CircleGeometry(9, 48),
    new THREE.MeshStandardMaterial({ color: '#e7e2d8', roughness: 0.95 })
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  oficina.add(piso);

  // --- Pared de fondo ---
  const pared = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 6),
    new THREE.MeshStandardMaterial({ color: '#cfe8e0', roughness: 1 })
  );
  pared.position.set(0, 3, -2.6);
  pared.receiveShadow = true;
  oficina.add(pared);

  // --- Escritorio ---
  const escritorio = new THREE.Mesh(
    new RoundedBoxGeometry(3.6, 0.14, 1.7, 3, 0.05),
    new THREE.MeshStandardMaterial({ color: '#c89b6b', roughness: 0.7 })
  );
  escritorio.position.set(0, 0.9, 0);
  escritorio.castShadow = true;
  escritorio.receiveShadow = true;
  oficina.add(escritorio);

  const patasGeo = new RoundedBoxGeometry(0.14, 0.9, 0.14, 2, 0.03);
  const patasMat = new THREE.MeshStandardMaterial({ color: '#8a6947', roughness: 0.8 });
  [
    [-1.6, 0.45, -0.7],
    [1.6, 0.45, -0.7],
    [-1.6, 0.45, 0.7],
    [1.6, 0.45, 0.7],
  ].forEach(([x, y, z]) => {
    const pata = new THREE.Mesh(patasGeo, patasMat);
    pata.position.set(x, y, z);
    pata.castShadow = true;
    oficina.add(pata);
  });

  // --- Monitor (girado hacia la cámara para que se lea la pantalla) ---
  const monitor = new THREE.Group();
  monitor.position.set(0, 0.97, -0.45);
  monitor.rotation.y = 0.3; // de frente a la mosca, leve giro hacia la cámara

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(0.4, 0.06, 0.3, 2, 0.02),
    new THREE.MeshStandardMaterial({ color: '#2d2d2d', roughness: 0.6 })
  );
  base.position.y = 0;
  monitor.add(base);

  const cuello = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.28, 12),
    new THREE.MeshStandardMaterial({ color: '#2d2d2d', roughness: 0.6 })
  );
  cuello.position.y = 0.17;
  monitor.add(cuello);

  const carcasa = new THREE.Mesh(
    new RoundedBoxGeometry(1.1, 0.7, 0.05, 3, 0.05),
    new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.5 })
  );
  carcasa.position.y = 0.66;
  carcasa.castShadow = true;
  monitor.add(carcasa);

  const { canvas: kanbanCanvas, ctx: kanbanCtx, textura: kanbanTextura } = crearTexturaKanban();
  dibujarKanban(kanbanCtx, { porHacer: 0, enCurso: 0, hechas: 0 });
  kanbanTextura.needsUpdate = true;
  const pantalla = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.6),
    new THREE.MeshBasicMaterial({ map: kanbanTextura })
  );
  pantalla.position.set(0, 0.66, 0.031);
  monitor.add(pantalla);

  oficina.add(monitor);

  // --- Taza de café ---
  const taza = new THREE.Group();
  const tazaCuerpo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.07, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 })
  );
  taza.add(tazaCuerpo);
  const asa = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.012, 8, 16, Math.PI * 1.4),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 })
  );
  asa.rotation.z = Math.PI / 2;
  asa.position.set(0.09, 0, 0);
  taza.add(asa);
  taza.position.set(1.15, 1.03, 0.35);
  taza.castShadow = true;
  oficina.add(taza);

  // --- Reloj de pared ---
  const reloj = new THREE.Group();
  const esferaReloj = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.04, 32),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 })
  );
  esferaReloj.rotation.x = Math.PI / 2;
  reloj.add(esferaReloj);
  const aroReloj = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.03, 8, 32),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 })
  );
  reloj.add(aroReloj);
  const horaManecilla = new THREE.Mesh(
    new RoundedBoxGeometry(0.03, 0.2, 0.02, 1, 0.01),
    new THREE.MeshStandardMaterial({ color: '#1e293b' })
  );
  horaManecilla.position.set(0, 0.1, 0.03);
  horaManecilla.geometry.translate(0, 0.1, 0);
  reloj.add(horaManecilla);
  const minutoManecilla = new THREE.Mesh(
    new RoundedBoxGeometry(0.02, 0.32, 0.02, 1, 0.01),
    new THREE.MeshStandardMaterial({ color: '#334155' })
  );
  minutoManecilla.geometry.translate(0, 0.16, 0);
  minutoManecilla.position.set(0, 0, 0.035);
  reloj.add(minutoManecilla);
  reloj.position.set(-2.2, 3.3, -2.55);
  oficina.add(reloj);

  // --- Póster "WIP <= 3" ---
  const posterTextura = texturaTexto({
    ancho: 300,
    alto: 380,
    fondo: '#fef3c7',
    texto: 'WIP ≤ 3',
    colorTexto: '#b45309',
    fuente: 'bold 48px sans-serif',
  });
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1.3),
    new THREE.MeshStandardMaterial({ map: posterTextura, roughness: 0.9 })
  );
  poster.position.set(2.4, 3.1, -2.55);
  oficina.add(poster);

  // --- Cenicero + colillas ---
  const ceniceroGrupo = new THREE.Group();
  const ceniceroBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20),
    new THREE.MeshStandardMaterial({ color: '#4b5563', roughness: 0.7 })
  );
  ceniceroGrupo.add(ceniceroBase);
  ceniceroGrupo.position.set(-1.2, 0.99, 0.35);
  oficina.add(ceniceroGrupo);

  const colillaGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6);
  const colillaMatBlanco = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
  const colillasMeshes = [];
  function agregarColilla() {
    const colilla = new THREE.Mesh(colillaGeo, colillaMatBlanco);
    const angulo = Math.random() * Math.PI * 2;
    const radio = Math.random() * 0.1;
    colilla.position.set(Math.cos(angulo) * radio, 1.03 + colillasMeshes.length * 0.004, Math.sin(angulo) * radio);
    colilla.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.6);
    ceniceroGrupo.add(colilla);
    colillasMeshes.push(colilla);
  }
  function limpiarColillas() {
    colillasMeshes.forEach((m) => ceniceroGrupo.remove(m));
    colillasMeshes.length = 0;
  }

  // --- Silla simple ---
  const silla = new THREE.Mesh(
    new RoundedBoxGeometry(0.6, 0.08, 0.6, 2, 0.04),
    new THREE.MeshStandardMaterial({ color: '#6b7280', roughness: 0.8 })
  );
  silla.position.set(0, 0.5, 1.1);
  silla.castShadow = true;
  oficina.add(silla);
  const respaldo = new THREE.Mesh(
    new RoundedBoxGeometry(0.55, 0.7, 0.08, 2, 0.03),
    new THREE.MeshStandardMaterial({ color: '#6b7280', roughness: 0.8 })
  );
  respaldo.position.set(0, 0.85, 1.4);
  respaldo.castShadow = true;
  oficina.add(respaldo);

  scene.add(oficina);

  return {
    grupo: oficina,
    actualizarKanban: (estado) => {
      dibujarKanban(kanbanCtx, estado);
      kanbanTextura.needsUpdate = true;
    },
    actualizarReloj: (fraccionDelDia) => {
      horaManecilla.rotation.z = -fraccionDelDia * Math.PI * 2 - Math.PI;
      minutoManecilla.rotation.z = -((fraccionDelDia * 9) % 1) * Math.PI * 2 - Math.PI;
    },
    agregarColilla,
    limpiarColillas,
  };
}
