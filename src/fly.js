import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { texturaRayasAbdomen, texturaHumo, texturaBrillo } from './textures.js';
import { ALTO_ESCRITORIO } from './office.js';

const BASE = new THREE.Vector3(-1.14, ALTO_ESCRITORIO - 0.45, -1.06);
const ESCALA = 1.42;
const ROT_BASE = 0.75;

const COLORES = {
  cuerpo: '#8d775c',
  torax: '#6f5c48',
  cabeza: '#7b6750',
  patas: '#3d352c',
  ojo: '#df3a2b',
  camisa: '#fbf8f1',
  corbata: '#d33a2c',
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function crearPata(matPatas, { base, largoFemur, largoTibia, radio, rotFemur, rotTibia }) {
  const grupo = new THREE.Group();
  grupo.position.copy(base);
  grupo.rotation.set(...rotFemur);

  const femurGeo = new THREE.CapsuleGeometry(radio, largoFemur, 4, 10);
  femurGeo.translate(0, -largoFemur / 2, 0);
  const femur = new THREE.Mesh(femurGeo, matPatas);
  femur.castShadow = true;
  grupo.add(femur);

  const rodilla = new THREE.Group();
  rodilla.position.y = -largoFemur;
  rodilla.rotation.set(...rotTibia);
  grupo.add(rodilla);

  const tibiaGeo = new THREE.CapsuleGeometry(radio * 0.82, largoTibia, 4, 10);
  tibiaGeo.translate(0, -largoTibia / 2, 0);
  const tibia = new THREE.Mesh(tibiaGeo, matPatas);
  tibia.castShadow = true;
  rodilla.add(tibia);

  const punta = new THREE.Group();
  punta.position.y = -largoTibia;
  rodilla.add(punta);

  return { grupo, rodilla, punta };
}

function crearAla() {
  const forma = new THREE.Shape();
  forma.moveTo(0, 0);
  forma.bezierCurveTo(0.12, 0.08, 0.14, 0.3, 0.08, 0.46);
  forma.bezierCurveTo(0.04, 0.55, -0.02, 0.56, -0.05, 0.48);
  forma.bezierCurveTo(-0.1, 0.3, -0.08, 0.1, 0, 0);
  const geo = new THREE.ShapeGeometry(forma, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#eef4ff',
    transparent: true,
    opacity: 0.55,
    roughness: 0.05,
    metalness: 0,
    iridescence: 1,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [120, 500],
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

export function crearMosca(scene) {
  const raiz = new THREE.Group();
  raiz.position.copy(BASE);
  raiz.rotation.y = ROT_BASE;
  raiz.scale.setScalar(ESCALA);

  const cuerpo = new THREE.Group();
  raiz.add(cuerpo);

  const matCuerpo = new THREE.MeshStandardMaterial({ map: texturaRayasAbdomen(), roughness: 0.8 });
  const matTorax = new THREE.MeshStandardMaterial({ color: COLORES.torax, roughness: 0.82 });
  const matCabeza = new THREE.MeshStandardMaterial({ color: COLORES.cabeza, roughness: 0.78 });
  const matPatas = new THREE.MeshStandardMaterial({ color: COLORES.patas, roughness: 0.6 });
  const matCamisa = new THREE.MeshStandardMaterial({ color: COLORES.camisa, roughness: 0.85 });
  const matCorbata = new THREE.MeshStandardMaterial({ color: COLORES.corbata, roughness: 0.6 });

  // --- Abdomen con rayas ---
  const abdomenGeo = new THREE.SphereGeometry(1, 28, 20);
  abdomenGeo.rotateX(Math.PI / 2);
  abdomenGeo.scale(0.25, 0.225, 0.33);
  const abdomen = new THREE.Mesh(abdomenGeo, matCuerpo);
  abdomen.position.set(0, 0.3, -0.26);
  abdomen.rotation.x = -0.22;
  abdomen.castShadow = true;
  cuerpo.add(abdomen);

  // --- Tórax ---
  const torax = new THREE.Mesh(new THREE.SphereGeometry(0.21, 26, 20), matTorax);
  torax.position.set(0, 0.42, 0.0);
  torax.scale.set(1, 0.95, 1.08);
  torax.castShadow = true;
  cuerpo.add(torax);

  // --- Camisa + cuello ---
  const camisa = new THREE.Mesh(new THREE.SphereGeometry(0.215, 26, 20), matCamisa);
  camisa.position.set(0, 0.395, 0.105);
  camisa.scale.set(0.93, 0.88, 0.66);
  camisa.castShadow = true;
  cuerpo.add(camisa);

  [-1, 1].forEach((s) => {
    const cuello = new THREE.Mesh(new RoundedBoxGeometry(0.085, 0.07, 0.03, 2, 0.012), matCamisa);
    cuello.position.set(s * 0.062, 0.535, 0.145);
    cuello.rotation.set(-0.25, 0, s * 0.55);
    cuello.castShadow = true;
    cuerpo.add(cuello);
  });

  // --- Corbata ---
  const nudo = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.065, 0.045, 2, 0.015), matCorbata);
  nudo.position.set(0, 0.535, 0.205);
  nudo.rotation.x = -0.2;
  nudo.castShadow = true;
  cuerpo.add(nudo);

  const formaCorbata = new THREE.Shape();
  formaCorbata.moveTo(-0.042, 0);
  formaCorbata.lineTo(0.042, 0);
  formaCorbata.lineTo(0.068, -0.2);
  formaCorbata.lineTo(0, -0.27);
  formaCorbata.lineTo(-0.068, -0.2);
  formaCorbata.closePath();
  const corbata = new THREE.Mesh(
    new THREE.ExtrudeGeometry(formaCorbata, { depth: 0.02, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 }),
    matCorbata
  );
  corbata.position.set(0, 0.505, 0.198);
  corbata.rotation.x = -0.22;
  corbata.castShadow = true;
  cuerpo.add(corbata);

  const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.1, 0.09, 16), matTorax);
  cuello.position.set(0, 0.525, 0.09);
  cuello.rotation.x = -0.3;
  cuello.castShadow = true;
  cuerpo.add(cuello);

  // --- Cabeza ---
  const cabezaGrupo = new THREE.Group();
  cabezaGrupo.position.set(0, 0.565, 0.145);
  cuerpo.add(cabezaGrupo);

  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.175, 26, 20), matCabeza);
  cabeza.scale.set(1, 0.96, 0.94);
  cabeza.castShadow = true;
  cabezaGrupo.add(cabeza);

  const matOjo = new THREE.MeshPhysicalMaterial({
    color: COLORES.ojo,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const ojos = [-1, 1].map((s) => {
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.098, 22, 18), matOjo);
    ojo.position.set(s * 0.108, 0.025, 0.085);
    ojo.scale.set(0.92, 1.12, 0.95);
    ojo.castShadow = true;
    cabezaGrupo.add(ojo);

    const brillo = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    );
    brillo.position.set(s * 0.108 - 0.042, 0.085, 0.14);
    cabezaGrupo.add(brillo);

    const brillo2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.013, 10, 10),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    );
    brillo2.position.set(s * 0.108 + 0.035, -0.012, 0.135);
    cabezaGrupo.add(brillo2);
    return ojo;
  });

  const cejas = [-1, 1].map((s) => {
    const ceja = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.022, 0.028, 2, 0.01), matPatas);
    ceja.rotation.x = -0.45;
    ceja.position.set(s * 0.104, 0.112, 0.142);
    ceja.castShadow = true;
    cabezaGrupo.add(ceja);
    return ceja;
  });

  const boca = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20, Math.PI), matPatas);
  boca.position.set(0, -0.045, 0.158);
  cabezaGrupo.add(boca);

  [-1, 1].forEach((s) => {
    const antena = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.05, 4, 8), matPatas);
    antena.position.set(s * 0.045, 0.165, 0.05);
    antena.rotation.set(-0.15, 0, s * 0.3);
    antena.castShadow = true;
    cabezaGrupo.add(antena);
  });

  const proboscis = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.07, 12), matCabeza);
  proboscis.position.set(0, -0.105, 0.115);
  proboscis.rotation.x = Math.PI * 0.62;
  cabezaGrupo.add(proboscis);

  // --- Alas ---
  const alas = [-1, 1].map((s) => {
    const ala = crearAla();
    ala.position.set(s * 0.065, 0.565, -0.07);
    ala.rotation.set(-0.22, s * 0.38, s * 0.1);
    ala.scale.set(s * 0.8, 0.8, 0.82);
    cuerpo.add(ala);
    return ala;
  });

  // --- Patas (6) ---
  // Delanteras: s=-1 es el lado que mira a la cámara (sostiene el cigarro).
  const brazos = [-1, 1].map((s) =>
    crearPata(matPatas, {
      base: new THREE.Vector3(s * 0.145, 0.4, 0.09),
      largoFemur: 0.2,
      largoTibia: 0.21,
      radio: 0.024,
      rotFemur: [-1.3, s * 0.12, s * 0.34],
      rotTibia: [-0.15, 0, s * -0.12],
    })
  );
  brazos.forEach(({ grupo }) => cuerpo.add(grupo));

  brazos.forEach(({ punta }, i) => {
    const s = i === 0 ? -1 : 1;
    const mano = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), matPatas);
    mano.castShadow = true;
    punta.add(mano);
    const puño = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), matCamisa);
    puño.position.y = 0.055;
    punta.add(puño);
    punta.userData.lado = s;
  });

  const patasMedias = [-1, 1].map((s) =>
    crearPata(matPatas, {
      base: new THREE.Vector3(s * 0.165, 0.33, -0.06),
      largoFemur: 0.19,
      largoTibia: 0.2,
      radio: 0.022,
      rotFemur: [0.1, 0, s * 1.05],
      rotTibia: [0.1, 0, s * -0.75],
    })
  );
  patasMedias.forEach(({ grupo }) => cuerpo.add(grupo));

  const patasTraseras = [-1, 1].map((s) =>
    crearPata(matPatas, {
      base: new THREE.Vector3(s * 0.15, 0.26, -0.24),
      largoFemur: 0.2,
      largoTibia: 0.22,
      radio: 0.022,
      rotFemur: [-0.5, 0, s * 0.8],
      rotTibia: [0.7, 0, s * -0.5],
    })
  );
  patasTraseras.forEach(({ grupo }) => cuerpo.add(grupo));

  // --- Cigarro (en la mano del lado de la cámara) ---
  const manoCigarro = brazos[0].punta;
  const cigarro = new THREE.Group();
  const cigarroCuerpo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.17, 10),
    new THREE.MeshStandardMaterial({ color: '#f8f5ee', roughness: 0.85 })
  );
  cigarro.add(cigarroCuerpo);
  const filtro = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.017, 0.05, 10),
    new THREE.MeshStandardMaterial({ color: '#d4a263', roughness: 0.9 })
  );
  filtro.position.y = -0.095;
  cigarro.add(filtro);
  const brasa = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.014, 0.03, 10),
    new THREE.MeshStandardMaterial({
      color: '#ff7a2f',
      emissive: '#ff5a12',
      emissiveIntensity: 2.2,
      roughness: 0.6,
    })
  );
  brasa.position.y = 0.095;
  cigarro.add(brasa);

  const resplandor = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texturaBrillo('255,140,50'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  resplandor.scale.setScalar(0.14);
  resplandor.position.y = 0.1;
  cigarro.add(resplandor);

  const luzBrasa = new THREE.PointLight('#ff7a30', 0.35, 0.55, 2);
  luzBrasa.position.y = 0.1;
  cigarro.add(luzBrasa);

  cigarro.position.set(0, 0.015, 0.04);
  cigarro.rotation.set(0.35, 0, 0.55);
  cigarro.scale.setScalar(0.6);
  cigarro.visible = false;
  manoCigarro.add(cigarro);

  // --- Gotas de sudor ---
  const matGota = new THREE.MeshPhysicalMaterial({
    color: '#5ec1ef',
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
    transmission: 0.4,
  });
  const gotas = [0, 1, 2].map((i) => {
    const gota = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 12), matGota);
    gota.scale.set(1, 1.35, 1);
    gota.visible = false;
    gota.userData.fase = i * 0.37;
    gota.userData.lado = i % 2 === 0 ? -1 : 1;
    cabezaGrupo.add(gota);
    return gota;
  });

  scene.add(raiz);

  // --- Humo ---
  const humo = new THREE.Group();
  scene.add(humo);
  const texHumo = texturaHumo();
  const particulas = [];
  for (let i = 0; i < 16; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texHumo, transparent: true, depthWrite: false, opacity: 0 })
    );
    sprite.visible = false;
    sprite.userData = { vida: 0, maxVida: 1, deriva: new THREE.Vector3() };
    humo.add(sprite);
    particulas.push(sprite);
  }

  const posBrasa = new THREE.Vector3();
  let t = 0;
  let mezclaFumar = 0;
  let estresSuave = 0;
  let acumuladorHumo = 0;

  function update(dtReal, estado) {
    t += dtReal;
    const objetivoFumar = estado.fumando ? 1 : 0;
    mezclaFumar = lerp(mezclaFumar, objetivoFumar, Math.min(1, dtReal * 3.5));
    estresSuave = lerp(estresSuave, estado.estres, Math.min(1, dtReal * 2));
    const s = estresSuave;

    // Pose general: al fumar se echa atrás y gira hacia la cámara
    raiz.rotation.y = ROT_BASE - mezclaFumar * 0.45;
    raiz.position.set(
      BASE.x - mezclaFumar * 0.1,
      BASE.y - mezclaFumar * 0.02,
      BASE.z - mezclaFumar * 0.12
    );

    // Temblor y encorvarse con el estrés
    const temblor = s > 0.55 ? (s - 0.55) / 0.45 : 0;
    cuerpo.position.x = (Math.random() - 0.5) * 0.016 * temblor;
    cuerpo.position.y = (Math.random() - 0.5) * 0.012 * temblor;
    cuerpo.rotation.x = lerp(0, 0.14, s) - mezclaFumar * 0.2;
    cuerpo.rotation.z = (Math.random() - 0.5) * 0.02 * temblor;

    // Cabeza: mira al monitor; al fumar mira al frente, al colapsar baja
    cabezaGrupo.rotation.y = lerp(0.2, -0.15, mezclaFumar);
    cabezaGrupo.rotation.x = lerp(0, 0.18, s) + Math.sin(t * 2.2) * 0.02 * (1 - s);

    // Cara
    cejas.forEach((ceja, i) => {
      const s_ = i === 0 ? -1 : 1;
      ceja.rotation.z = lerp(s_ * 0.16, s_ * -0.55, s);
      ceja.position.y = lerp(0.14, 0.125, s);
    });
    boca.rotation.z = lerp(Math.PI, 0, Math.min(1, s * 1.15));
    boca.scale.set(lerp(1, 1.25, s), lerp(1, 0.85, s), 1);
    ojos.forEach((ojo) => {
      ojo.scale.y = lerp(1.12, 0.82, s);
    });

    // Alas: aleteo suave; vibran rápido con estrés
    const frec = 7 + s * 60;
    const amp = 0.05 + s * 0.16;
    const aleteo = Math.sin(t * frec) * amp;
    alas.forEach((ala, i) => {
      const s_ = i === 0 ? -1 : 1;
      ala.rotation.z = s_ * 0.12 + aleteo * s_;
      ala.rotation.x = -0.16 + Math.abs(aleteo) * 0.35;
    });

    // Brazos: tipeo o cigarro a la boca
    const bob = Math.sin(t * 13);
    brazos.forEach(({ grupo, rodilla }, i) => {
      const s_ = i === 0 ? -1 : 1;
      const tipeo = (i === 0 ? bob : -bob) * 0.09;
      const mezcla = i === 0 ? mezclaFumar : mezclaFumar * 0.3;
      grupo.rotation.x = lerp(-1.3 + tipeo, i === 0 ? -0.6 : -1.05, mezcla);
      grupo.rotation.z = lerp(s_ * 0.34, s_ * 0.95, mezcla);
      rodilla.rotation.x = lerp(-0.15 - tipeo * 0.5, i === 0 ? -2.3 : -0.3, mezcla);
      if (i === 0) grupo.rotation.y = lerp(s_ * 0.12, s_ * 0.45, mezcla);
    });

    // Sudor
    gotas.forEach((gota, i) => {
      const activo = s > 0.45;
      gota.visible = activo;
      if (!activo) return;
      const ciclo = (t * 0.9 + gota.userData.fase) % 1;
      gota.position.set(gota.userData.lado * 0.165, 0.11 - ciclo * 0.34, 0.075 + i * 0.015);
      gota.material.opacity = 0.9 * (1 - ciclo);
    });

    // Cigarro + humo
    cigarro.visible = mezclaFumar > 0.25;
    luzBrasa.intensity = mezclaFumar * 0.35;
    if (cigarro.visible) {
      brasa.getWorldPosition(posBrasa);
      acumuladorHumo += dtReal;
      while (acumuladorHumo > 0.16) {
        acumuladorHumo -= 0.16;
        const libre = particulas.find((p) => !p.visible);
        if (!libre) break;
        libre.visible = true;
        libre.userData.maxVida = 2.6 + Math.random() * 1.2;
        libre.userData.vida = libre.userData.maxVida - acumuladorHumo;
        libre.userData.deriva.set((Math.random() - 0.5) * 0.14, 0.26 + Math.random() * 0.1, (Math.random() - 0.5) * 0.1);
        libre.position.copy(posBrasa);
        libre.position.y += (libre.userData.maxVida - libre.userData.vida) * 0.26;
        libre.scale.setScalar(0.1);
        libre.material.opacity = 0;
      }
    }

    particulas.forEach((p) => {
      if (!p.visible) return;
      p.userData.vida -= dtReal;
      if (p.userData.vida <= 0) {
        p.visible = false;
        return;
      }
      const vidaFrac = p.userData.vida / p.userData.maxVida;
      p.position.addScaledVector(p.userData.deriva, dtReal);
      p.userData.deriva.x += (Math.random() - 0.5) * dtReal * 0.08;
      p.scale.setScalar(0.13 + (1 - vidaFrac) * 0.5);
      p.material.opacity = Math.sin((1 - vidaFrac) * Math.PI) * 0.62;
    });
  }

  return { grupo: raiz, update };
}
