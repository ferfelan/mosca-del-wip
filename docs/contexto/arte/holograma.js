// Portada del documento: la cara de la mosca del juego convertida en
// holograma, con las neuronas reales de su cerebro (MaleCNS) brillando
// adentro. Se dibuja UNA vez y queda quieta (window.__listo = true).
// Parámetros en la URL: ?w=1240&h=1754&dpr=2
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { crearMosca } from '../../../src/fly.js';
import { cargarDatosCerebro, GRUPOS_VISUALES } from '../../../src/cerebro.js';

const q = new URLSearchParams(location.search);
const W = Number(q.get('w') ?? 1240);
const H = Number(q.get('h') ?? 1754);
const DPR = Number(q.get('dpr') ?? 2);

const canvas = document.getElementById('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(DPR);
renderer.setSize(W, H);
renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor('#04060d', 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#03050b'); // (con setClearColor el negro salía azulado)
const camera = new THREE.PerspectiveCamera(26, W / H, 0.01, 50);

// ---------- Materiales de holograma ----------
const VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  varying vec2 vUv;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vec4 mv = viewMatrix * w;
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG_CUERPO = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uBorde;
  uniform float uFuerza;
  uniform vec2 uDesvanece; // de qué altura a qué altura aparece el cuerpo
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);
    float lineas = 0.72 + 0.28 * sin(vW.y * 1400.0);
    vec3 col = mix(uBase, uBorde, f);
    float aparece = smoothstep(uDesvanece.x, uDesvanece.y, vW.y);
    float a = (0.035 + 0.95 * f) * lineas * uFuerza * aparece;
    gl_FragColor = vec4(col * a, a);
  }
`;
// Ojos compuestos: panal de facetas que brillan en los bordes
const FRAG_OJO = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uBorde;
  uniform float uFuerza;
  varying vec3 vN;
  varying vec3 vV;
  varying vec2 vUv;
  float hexDist(vec2 p) {
    p = abs(p);
    return max(dot(p, normalize(vec2(1.0, 1.732))), p.x);
  }
  void main() {
    vec2 g = vUv * vec2(64.0, 30.0);
    vec2 r = vec2(1.0, 1.732);
    vec2 h = r * 0.5;
    vec2 a = mod(g, r) - h;
    vec2 b = mod(g - h, r) - h;
    vec2 gv = dot(a, a) < dot(b, b) ? a : b;
    float borde = smoothstep(0.36, 0.49, hexDist(gv));
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.8);
    float alfa = (0.015 + 0.42 * borde + 0.38 * f) * uFuerza;
    vec3 col = mix(uBase, uBorde, clamp(borde * 0.6 + f, 0.0, 1.0));
    gl_FragColor = vec4(col * alfa, alfa);
  }
`;
const holo = (frag, base, borde, fuerza = 1, lado = THREE.FrontSide) =>
  new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: frag,
    uniforms: {
      uBase: { value: new THREE.Color(base) },
      uBorde: { value: new THREE.Color(borde) },
      uFuerza: { value: fuerza },
      uDesvanece: { value: new THREE.Vector2(-100, -99) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: lado,
  });
const matCuerpo = holo(FRAG_CUERPO, '#06404f', '#5fe8ff', 0.55);
const matAlas = holo(FRAG_CUERPO, '#1a2670', '#8ea2ff', 0.35, THREE.DoubleSide);
const matOjo = holo(FRAG_OJO, '#3a0718', '#ff5c7f', 0.9);

// ---------- La mosca ----------
const mosca = crearMosca(scene);
mosca.grupo.children.forEach((c) => {
  if (c !== mosca.figura) c.visible = false; // sin la silla
});
const quieta = { fumando: false, tomandoCafe: false, estres: 0, descansa: true };
for (let i = 0; i < 240; i++) mosca.update(1 / 60, quieta);
mosca.figura.updateMatrixWorld(true);

mosca.figura.traverse((o) => {
  if (o.isPoints || o.isSprite || o.isLine) {
    o.visible = false;
    return;
  }
  if (!o.isMesh) return;
  const m = Array.isArray(o.material) ? o.material[0] : o.material;
  // brillos de los ojos, gotas de sudor, humo y cigarro apagados: fuera
  if (!o.visible || (m.transparent && m.opacity < 0.05) || m.isMeshBasicMaterial) {
    o.visible = false;
    return;
  }
  if (m.map && m.isMeshPhysicalMaterial && o.geometry.type === 'SphereGeometry') o.material = matOjo;
  else if (m.transparent && m.opacity < 0.9) o.material = matAlas;
  else o.material = matCuerpo;
});

// Cabeza: centro y tamaño reales (para encuadrar y meterle el cerebro)
const caja = new THREE.Box3().setFromObject(mosca.cabeza);
const centro = caja.getCenter(new THREE.Vector3());
const tam = caja.getSize(new THREE.Vector3());

// El cuerpo se desvanece hacia abajo (deja espacio para el título)
for (const m of [matCuerpo, matAlas]) m.uniforms.uDesvanece.value.set(centro.y - tam.y * 1.25, centro.y - tam.y * 0.15);

// ---------- El cerebro real dentro de la cabeza ----------
const VERT_PUNTO = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSemilla;
  uniform float uTam;
  varying vec3 vColor;
  varying float vBrillo;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vBrillo = 0.35 + 0.65 * step(0.7, aSemilla) + 0.25 * aSemilla;
    gl_PointSize = uTam * (0.7 + aSemilla * 0.9) / -mv.z;
    vColor = aColor;
  }
`;
const FRAG_PUNTO = /* glsl */ `
  uniform float uLuz;
  varying vec3 vColor;
  varying float vBrillo;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    float a = smoothstep(0.5, 0.0, r);
    a *= a;
    float k = a * vBrillo * uLuz;
    gl_FragColor = vec4(vColor * k, k);
  }
`;
const datos = await cargarDatosCerebro();
{
  const { info, posiciones, grupos } = datos;
  const ids = info.grupos.map((g) => g.id);
  const pos = [];
  const col = [];
  const sem = [];
  const c = new THREE.Color();
  for (let i = 0; i < info.puntos; i++) {
    const y = posiciones[i * 3 + 1];
    if (y < 150) continue; // sólo el cerebro (el cordón nervioso queda abajo)
    pos.push(posiciones[i * 3], y - 330, posiciones[i * 3 + 2]);
    c.set(GRUPOS_VISUALES[ids[grupos[i]]].color);
    col.push(c.r, c.g, c.b);
    sem.push(Math.random());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('aSemilla', new THREE.Float32BufferAttribute(sem, 1));
  const nube = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      vertexShader: VERT_PUNTO,
      fragmentShader: FRAG_PUNTO,
      uniforms: { uTam: { value: 12 * DPR }, uLuz: { value: Number(q.get('luz') ?? 0.42) } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const escala = (tam.x * 0.78) / 730; // el ancho del cerebro (con los lóbulos ópticos) calza con los ojos
  nube.scale.setScalar(escala);
  nube.position.copy(centro).add(new THREE.Vector3(0, tam.y * 0.04, tam.z * 0.05));
  nube.frustumCulled = false;
  scene.add(nube);
}

// ---------- Anillos de proyección y polvo de luz ----------
const anillos = new THREE.Group();
for (let k = 0; k < 7; k++) {
  const r = tam.x * (0.72 + k * 0.17);
  const geo = new THREE.RingGeometry(r, r + tam.x * (k === 2 ? 0.006 : 0.0025), 160);
  const m = new THREE.MeshBasicMaterial({
    color: k % 3 === 1 ? '#8b5cff' : '#2fe3ff',
    transparent: true,
    opacity: 0.11 - k * 0.012,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  anillos.add(new THREE.Mesh(geo, m));
}
anillos.position.copy(centro).add(new THREE.Vector3(0, 0, tam.z * 1.4));
anillos.rotation.y = Math.PI;
scene.add(anillos);

{
  const n = 900;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = centro.x + (Math.random() - 0.5) * tam.x * 5;
    pos[i * 3 + 1] = centro.y + (Math.random() - 0.62) * tam.y * 7;
    pos[i * 3 + 2] = centro.z + (Math.random() - 0.2) * tam.z * 4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const polvo = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: '#6fdcff',
      size: 1.6 * DPR,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(polvo);
}

// ---------- Cámara: de frente a la cara, un poco desde abajo ----------
// La mosca mira hacia -z (hacia el monitor): la cámara se pone por ese lado
const distancia = (tam.x / Number(q.get('ancho') ?? 0.8) / 2) / Math.tan(THREE.MathUtils.degToRad(13)) / camera.aspect;
camera.position.copy(centro).add(new THREE.Vector3(tam.x * 0.08, -tam.y * 0.18, -distancia));
camera.lookAt(centro.clone().add(new THREE.Vector3(0, -tam.y * 0.05, 0)));
// corre el cuadro hacia abajo: la cara queda arriba y abajo queda espacio para el título
const corrimiento = Number(q.get('corre') ?? 0.16);
camera.setViewOffset(W, H, 0, H * corrimiento, W, H);
camera.updateProjectionMatrix();

const composer = new EffectComposer(renderer);
composer.setPixelRatio(DPR);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W * DPR, H * DPR), Number(q.get('bloom') ?? 0.55), 0.35, 0.16));
composer.addPass(new OutputPass());
composer.render();

window.__info = { centro: centro.toArray(), tam: tam.toArray(), distancia };
window.__listo = true;
