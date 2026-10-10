import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function crearEscena(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#cfe8e0');
  scene.fog = new THREE.Fog('#cfe8e0', 10, 20);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(2.6, 2.4, 3.6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.1, 0.2);
  controls.enableDamping = true;
  controls.minDistance = 2.5;
  controls.maxDistance = 7;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.update();

  const luzAmbiente = new THREE.AmbientLight('#ffffff', 0.7);
  scene.add(luzAmbiente);

  const luzHemi = new THREE.HemisphereLight('#e0f2fe', '#8d7a5e', 0.5);
  scene.add(luzHemi);

  const luzSol = new THREE.DirectionalLight('#fff7e6', 1.1);
  luzSol.position.set(4, 6, 3);
  luzSol.castShadow = true;
  luzSol.shadow.mapSize.set(1024, 1024);
  luzSol.shadow.camera.near = 1;
  luzSol.shadow.camera.far = 20;
  luzSol.shadow.camera.left = -6;
  luzSol.shadow.camera.right = 6;
  luzSol.shadow.camera.top = 6;
  luzSol.shadow.camera.bottom = -6;
  scene.add(luzSol);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, controls };
}
