// La foto del escritorio: la mosca con su gato. Se arma una mini escena 3D
// (la misma mosca del juego + un gato atigrado) y se "saca la foto" una sola
// vez a una textura, que luego va dentro del marco.
import * as THREE from 'three';

// Se saca en alta resolución y con versiones reducidas (mipmaps) para que
// se vea nítida tanto de cerca como chiquita en el escritorio.
const ANCHO_FOTO = 1600;
const ALTO_FOTO = 1200;

function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d') };
}

// Pelaje naranjo con rayas más oscuras
function texturaPelaje() {
  const { c, ctx } = lienzo(512, 256);
  ctx.scale(2, 2); // mismo dibujo, el doble de resolución
  ctx.fillStyle = '#e7953f';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = 'rgba(176, 92, 30, 0.75)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const x = 14 + i * 28;
    ctx.lineWidth = 7 + Math.random() * 4;
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.bezierCurveTo(x + 10, 40, x - 10, 80, x + 4, 120);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function crearGato() {
  const gato = new THREE.Group();
  const pelaje = new THREE.MeshStandardMaterial({ map: texturaPelaje(), roughness: 0.85 });
  const blanco = new THREE.MeshStandardMaterial({ color: '#fbf3e6', roughness: 0.85 });
  const rosado = new THREE.MeshStandardMaterial({ color: '#f29aa0', roughness: 0.6 });
  const negro = new THREE.MeshStandardMaterial({ color: '#1d1a17', roughness: 0.3 });
  const verde = new THREE.MeshPhysicalMaterial({ color: '#7cc576', roughness: 0.2, clearcoat: 1 });
  const esfera = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    gato.add(m);
    return m;
  };
  // Cuerpo sentado, pecho blanco y patitas
  esfera(0.2, pelaje, 0, 0.2, 0, 1, 1.15, 0.95);
  esfera(0.12, blanco, 0, 0.19, 0.12, 1, 1.3, 0.6);
  esfera(0.055, blanco, -0.07, 0.03, 0.15, 1, 0.7, 1.3);
  esfera(0.055, blanco, 0.07, 0.03, 0.15, 1, 0.7, 1.3);
  // Cabeza
  const cabeza = new THREE.Group();
  cabeza.position.set(0, 0.47, 0.03);
  cabeza.rotation.z = 0.12;
  gato.add(cabeza);
  const enCabeza = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    cabeza.add(m);
    return m;
  };
  enCabeza(new THREE.SphereGeometry(0.16, 32, 24), pelaje, 0, 0, 0).scale.set(1.12, 0.95, 1);
  enCabeza(new THREE.SphereGeometry(0.06, 20, 16), blanco, -0.045, -0.05, 0.12).scale.set(1, 0.8, 0.8);
  enCabeza(new THREE.SphereGeometry(0.06, 20, 16), blanco, 0.045, -0.05, 0.12).scale.set(1, 0.8, 0.8);
  const nariz = enCabeza(new THREE.ConeGeometry(0.018, 0.022, 3), rosado, 0, -0.02, 0.165);
  nariz.rotation.set(Math.PI / 2, 0, Math.PI);
  [-1, 1].forEach((lado) => {
    // Orejas con interior rosado
    const oreja = enCabeza(new THREE.ConeGeometry(0.06, 0.11, 24), pelaje, lado * 0.1, 0.13, -0.01);
    oreja.rotation.z = -lado * 0.35;
    const dentro = enCabeza(new THREE.ConeGeometry(0.035, 0.07, 24), rosado, lado * 0.098, 0.125, 0.015);
    dentro.rotation.z = -lado * 0.35;
    // Ojos verdes grandes con pupila y brillito
    enCabeza(new THREE.SphereGeometry(0.035, 20, 16), verde, lado * 0.065, 0.03, 0.13).scale.set(1, 1.1, 0.6);
    enCabeza(new THREE.SphereGeometry(0.018, 16, 12), negro, lado * 0.065, 0.03, 0.15).scale.set(0.7, 1.3, 0.5);
    enCabeza(new THREE.SphereGeometry(0.007, 10, 8), blanco, lado * 0.058, 0.045, 0.158);
    // Bigotes
    for (let k = -1; k <= 1; k++) {
      const bigote = enCabeza(new THREE.CylinderGeometry(0.0015, 0.0015, 0.13, 4), blanco, lado * 0.12, -0.045 + k * 0.012, 0.12);
      bigote.rotation.z = Math.PI / 2 + lado * k * 0.12;
    }
  });
  // Cola que se curva alrededor
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, 0.08, -0.15),
    new THREE.Vector3(0.26, 0.04, -0.05),
    new THREE.Vector3(0.28, 0.03, 0.12),
    new THREE.Vector3(0.17, 0.05, 0.2),
  ]);
  const cola = new THREE.Mesh(new THREE.TubeGeometry(curva, 30, 0.035, 12), pelaje);
  gato.add(cola);
  return gato;
}

function texturaFondo() {
  const { c, ctx } = lienzo(1536, 1152);
  ctx.scale(3, 3); // mismo dibujo, el triple de resolución
  const cielo = ctx.createLinearGradient(0, 0, 0, 384);
  cielo.addColorStop(0, '#9fd3f2');
  cielo.addColorStop(0.62, '#dff0f6');
  cielo.addColorStop(0.62, '#9bcf86');
  cielo.addColorStop(1, '#79b66a');
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, 512, 384);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  [
    [90, 70, 26],
    [118, 62, 32],
    [146, 72, 22],
    [380, 50, 20],
    [404, 44, 26],
  ].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = 'rgba(255, 214, 102, 0.95)';
  ctx.beginPath();
  ctx.arc(450, 96, 26, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaSombra() {
  const { c, ctx } = lienzo(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(30,50,20,0.45)');
  g.addColorStop(1, 'rgba(30,50,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// figuraMosca: el grupo de la mosca del juego (se copia; no se modifica)
export function sacarFoto(renderer, figuraMosca) {
  const escena = new THREE.Scene();
  escena.background = texturaFondo();
  escena.add(new THREE.HemisphereLight('#fff6e8', '#7a9a6a', 1.4));
  const sol = new THREE.DirectionalLight('#fff1dc', 2.2);
  sol.position.set(2, 3, 3);
  escena.add(sol);

  // La mosca (copia) mirando a la cámara, un poco girada
  const mosca = figuraMosca.clone(true);
  mosca.position.set(-0.2, 0, -0.02);
  mosca.rotation.set(0, 0.42, 0);
  mosca.scale.setScalar(0.92);
  mosca.traverse((o) => {
    if (o.isMesh && o.material?.transparent && o.material.opacity === 0) o.visible = false;
  });
  escena.add(mosca);

  // El gato a su lado, justo donde llegan las patas de adelante (lo acaricia)
  const gato = crearGato();
  gato.position.set(0.24, 0, 0.12);
  gato.rotation.y = -0.5;
  gato.scale.setScalar(0.82);
  escena.add(gato);

  // Sombras suaves en el pasto
  const matSombra = new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false });
  [
    [-0.2, -0.02, 0.4, 0.32],
    [0.24, 0.12, 0.26, 0.22],
  ].forEach(([x, z, sx, sz]) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matSombra);
    s.rotation.x = -Math.PI / 2;
    s.position.set(x, 0.002, z);
    s.scale.set(sx * 2, sz * 2, 1);
    escena.add(s);
  });

  const camara = new THREE.PerspectiveCamera(32, ANCHO_FOTO / ALTO_FOTO, 0.05, 20);
  camara.position.set(0.1, 0.52, 1.85);
  camara.lookAt(0.0, 0.34, 0.02);

  const destino = new THREE.WebGLRenderTarget(ANCHO_FOTO, ALTO_FOTO, {
    samples: 4,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
  });
  destino.texture.colorSpace = THREE.SRGBColorSpace;
  destino.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const antes = renderer.getRenderTarget();
  const sombras = renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(destino);
  renderer.clear();
  renderer.render(escena, camara);
  renderer.setRenderTarget(antes);
  renderer.shadowMap.enabled = sombras;
  return destino.texture;
}
