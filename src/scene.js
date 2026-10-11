import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { texturaFondo } from './textures.js';
import { CAMARA_INICIAL } from './layout.js';

export { CAMARA_INICIAL };

export function crearEscena(canvas) {
  const scene = new THREE.Scene();
  scene.background = texturaFondo();
  scene.fog = new THREE.Fog('#e4e6dc', 9, 24);

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.copy(CAMARA_INICIAL.posicion);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.38;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(CAMARA_INICIAL.objetivo);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.6;
  controls.maxDistance = 7;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.update();

  scene.add(new THREE.HemisphereLight('#eaf2ff', '#d6bf9c', 0.6));

  const luzPrincipal = new THREE.DirectionalLight('#fff0d8', 2.0);
  luzPrincipal.position.set(-2.6, 5.0, 3.6);
  luzPrincipal.castShadow = true;
  luzPrincipal.shadow.mapSize.set(2048, 2048);
  luzPrincipal.shadow.camera.near = 0.5;
  luzPrincipal.shadow.camera.far = 16;
  luzPrincipal.shadow.camera.left = -5;
  luzPrincipal.shadow.camera.right = 5;
  luzPrincipal.shadow.camera.top = 5;
  luzPrincipal.shadow.camera.bottom = -4;
  luzPrincipal.shadow.bias = -0.0006;
  luzPrincipal.shadow.radius = 4;
  scene.add(luzPrincipal);

  const relleno = new THREE.DirectionalLight('#dce8ff', 0.55);
  relleno.position.set(3.6, 2.6, 2.4);
  scene.add(relleno);

  const contraluz = new THREE.DirectionalLight('#ffe9c9', 0.45);
  contraluz.position.set(0.6, 2.8, -3.4);
  scene.add(contraluz);

  // El tamaño del lienzo lo ajusta main.js según la vista (control o exhibición)

  return { scene, camera, renderer, controls };
}
