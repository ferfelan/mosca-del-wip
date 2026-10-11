// La mosca oficinista: una Drosophila melanogaster en versión tierna.
// Las patas se calculan cada cuadro para que las manos queden justo sobre el
// teclado (o con el cigarro en la boca) sin atravesar nada.
import * as THREE from 'three';
import {
  texturaAbdomenDrosophila,
  texturaOjoFacetas,
  texturaAla,
  texturaCorbata,
  texturasHumo,
  texturaBrillo,
  CONTORNO_ALA,
  ALA_V_MIN,
  ALA_V_MAX,
} from './textures.js';
import {
  MOSCA,
  ESCALA_MOSCA,
  ALTO_ASIENTO,
  ALTO_ESCRITORIO,
  TECLADO,
  IZQ_MOSCA,
  DIR_MOSCA,
  CENTRO_PANTALLA,
  CAMARA_INICIAL,
} from './layout.js';

const COLORES = {
  cuticula: '#c99a58',
  pata: '#b0834a',
  pataPunta: '#6e4b2a',
  cerda: '#3a2818',
  ojoPupila: '#240405',
  camisa: '#fbf8f2',
  silla: '#46525f',
  metal: '#9aa3ad',
  gota: '#86d3f4',
};

// Cuánto dura en pantalla cada salida a fumar (segundos reales), aunque el
// juego la cuente como unos pocos minutos simulados.
const DURACION_FUMADA_VISUAL = 3.0;

const Z_SILLA = -0.2;
const SILLA = { radio: 0.27, grosor: 0.07, altoAro: 0.25, radioAro: 0.2, tuboAro: 0.013 };

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const suave = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const amortiguar = (actual, objetivo, rapidez, dt) => lerp(actual, objetivo, 1 - Math.exp(-rapidez * dt));

const EJE_Y = new THREE.Vector3(0, 1, 0);

function marcar(mesh, datos) {
  Object.assign(mesh.userData, datos);
  mesh.castShadow = true;
  return mesh;
}

// ---------- Huesos y patas ----------

function crearHueso(padre, radioInicio, radioFin, mat, datos = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radioFin, radioInicio, 1, 10, 1), mat);
  marcar(m, { parteMosca: true, ...datos });
  padre.add(m);
  return m;
}

const _dir = new THREE.Vector3();
function ubicarHueso(m, a, b) {
  _dir.subVectors(b, a);
  const largo = Math.max(_dir.length(), 1e-5);
  m.position.addVectors(a, b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(EJE_Y, _dir.divideScalar(largo));
  m.scale.set(1, largo, 1);
}

const _d = new THREE.Vector3();
const _p = new THREE.Vector3();
// Dos huesos que llegan a un punto (como un brazo). El "polo" dice hacia
// dónde se dobla el codo/rodilla.
function resolverIK(a, objetivo, L1, L2, polo, outRodilla, outFin) {
  _d.subVectors(objetivo, a);
  let dist = _d.length();
  _d.divideScalar(dist || 1);
  dist = clamp(dist, Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
  const x = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
  _p.copy(polo).addScaledVector(_d, -polo.dot(_d)).normalize();
  outRodilla.copy(a).addScaledVector(_d, x).addScaledVector(_p, h);
  outFin.copy(a).addScaledVector(_d, dist);
}

function crearPata(padre, mats, { largos, radios, manga = null, revisaCuerpo = false }) {
  const [L1, L2, L3] = largos;
  const [r1, r2, r3] = radios;
  const datosPunta = revisaCuerpo ? { revisaCuerpo: true } : {};
  const femur = crearHueso(padre, r1, r1 * 0.85, mats.pata);
  const tibia = crearHueso(padre, r2, r2 * 0.85, mats.pata, datosPunta);
  const tarso = crearHueso(padre, r3, r3 * 0.8, mats.pata, datosPunta);
  const esfera = (r, mat, datos = {}) => {
    const m = marcar(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat), { parteMosca: true, ...datos });
    padre.add(m);
    return m;
  };
  const rodillaM = esfera(r1 * 1.05, mats.pata);
  const munecaM = esfera(r2 * 0.95, mats.pata, datosPunta);
  const almohadilla = esfera(r3 * 1.5, mats.pataPunta, datosPunta);

  let mangaM = null;
  if (manga) {
    mangaM = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.043, 1, 18, 1, true), manga);
    marcar(mangaM, {});
    padre.add(mangaM);
  }

  const rodilla = new THREE.Vector3();
  const muneca = new THREE.Vector3();
  const punta = new THREE.Vector3();
  const finManga = new THREE.Vector3();

  function poner(cadera, objetivoPunta, dirTarso, polo) {
    muneca.copy(objetivoPunta).addScaledVector(dirTarso, -L3);
    resolverIK(cadera, muneca, L1, L2, polo, rodilla, muneca);
    punta.copy(muneca).addScaledVector(dirTarso, L3);
    ubicarHueso(femur, cadera, rodilla);
    ubicarHueso(tibia, rodilla, muneca);
    ubicarHueso(tarso, muneca, punta);
    rodillaM.position.copy(rodilla);
    munecaM.position.copy(muneca);
    almohadilla.position.copy(punta);
    if (mangaM) {
      finManga.subVectors(rodilla, cadera).normalize().multiplyScalar(0.1).add(cadera);
      ubicarHueso(mangaM, cadera, finManga);
    }
  }
  return { poner, punta, muneca };
}

// ---------- Casquete (pupila y brillos pegados a la superficie del ojo) ----------

function crearCasquete(radio, angulo, anillos = 6, segmentos = 32) {
  const n = 1 + anillos * segmentos;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const idx = [];
  for (let s = 0; s < segmentos; s++) idx.push(0, 1 + ((s + 1) % segmentos), 1 + s);
  for (let r = 1; r < anillos; r++) {
    for (let s = 0; s < segmentos; s++) {
      const a = 1 + (r - 1) * segmentos + s;
      const b = 1 + (r - 1) * segmentos + ((s + 1) % segmentos);
      idx.push(a, b, a + segmentos, b, b + segmentos, a + segmentos);
    }
  }
  geo.setIndex(idx);
  geo.userData = { radio, anillos, segmentos, angulo: -1 };
  fijarAnguloCasquete(geo, angulo);
  return geo;
}

function fijarAnguloCasquete(geo, angulo) {
  const { radio, anillos, segmentos } = geo.userData;
  if (Math.abs(geo.userData.angulo - angulo) < 0.002) return;
  geo.userData.angulo = angulo;
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  pos.setXYZ(0, 0, radio, 0);
  nor.setXYZ(0, 0, 1, 0);
  for (let r = 1; r <= anillos; r++) {
    const a = (angulo * r) / anillos;
    for (let s = 0; s < segmentos; s++) {
      const f = (s / segmentos) * Math.PI * 2;
      const x = Math.sin(a) * Math.cos(f);
      const y = Math.cos(a);
      const z = Math.sin(a) * Math.sin(f);
      const i = 1 + (r - 1) * segmentos + s;
      pos.setXYZ(i, x * radio, y * radio, z * radio);
      nor.setXYZ(i, x, y, z);
    }
  }
  pos.needsUpdate = true;
  nor.needsUpdate = true;
  geo.computeBoundingSphere();
}

// ---------- Piezas de tela pegadas al pecho (corbata, nudo, cuello) ----------

const PECHO = { c: new THREE.Vector3(0, 0.4, 0.02), r: new THREE.Vector3(0.175, 0.19, 0.16) };
function superficiePecho(x, y) {
  const u = (x - PECHO.c.x) / PECHO.r.x;
  const v = (y - PECHO.c.y) / PECHO.r.y;
  return PECHO.c.z + PECHO.r.z * Math.sqrt(Math.max(0, 1 - u * u - v * v));
}

// perfil(t) -> { x, y, hw, nx, ny }: centro, medio ancho y dirección del ancho.
function crearPiezaSobrePecho(perfil, { nT = 18, nS = 6, atras = 0.003, frente = 0.014, escalaUV = 7 } = {}) {
  const pos = [];
  const uv = [];
  const idx = [];
  const punto = (t, s, d) => {
    const p = perfil(t);
    const x = p.x + s * p.hw * p.nx;
    const y = p.y + s * p.hw * p.ny;
    return [x, y, superficiePecho(x, y) + d];
  };
  function capa(d) {
    const base = pos.length / 3;
    for (let i = 0; i <= nT; i++) {
      for (let j = 0; j <= nS; j++) {
        const [x, y, z] = punto(i / nT, -1 + (2 * j) / nS, d);
        pos.push(x, y, z);
        uv.push(x * escalaUV, y * escalaUV);
      }
    }
    for (let i = 0; i < nT; i++) {
      for (let j = 0; j < nS; j++) {
        const a = base + i * (nS + 1) + j;
        const c = a + nS + 1;
        idx.push(a, c, a + 1, a + 1, c, c + 1);
      }
    }
  }
  function borde(muestras) {
    const base = pos.length / 3;
    muestras.forEach(([t, s]) => {
      pos.push(...punto(t, s, frente), ...punto(t, s, atras));
      uv.push(0, 0, 0, 0);
    });
    for (let k = 0; k < muestras.length - 1; k++) {
      const v0 = base + 2 * k;
      idx.push(v0, v0 + 1, v0 + 2, v0 + 1, v0 + 3, v0 + 2);
    }
  }
  capa(frente);
  capa(atras);
  const lado = (s) => Array.from({ length: nT + 1 }, (_, i) => [i / nT, s]);
  borde(lado(-1));
  borde(lado(1));
  borde(Array.from({ length: nS + 1 }, (_, j) => [0, -1 + (2 * j) / nS]));
  borde(Array.from({ length: nS + 1 }, (_, j) => [1, -1 + (2 * j) / nS]));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ---------- Ala con venas ----------

function crearGeometriaAla(largo) {
  const curva = new THREE.SplineCurve(CONTORNO_ALA.concat([CONTORNO_ALA[0]]).map(([u, v]) => new THREE.Vector2(u, v)));
  const forma = new THREE.Shape(curva.getPoints(60).map((p) => new THREE.Vector2(p.x * largo, p.y * largo)));
  const geo = new THREE.ShapeGeometry(forma, 1);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / largo, (pos.getY(i) / largo - ALA_V_MIN) / (ALA_V_MAX - ALA_V_MIN));
  }
  return geo;
}

// ---------- Silla (piso de oficina giratorio) ----------

function crearSilla() {
  const silla = new THREE.Group();
  const matTapiz = new THREE.MeshStandardMaterial({ color: COLORES.silla, roughness: 0.9 });
  const matMetal = new THREE.MeshStandardMaterial({ color: COLORES.metal, roughness: 0.35, metalness: 0.6 });
  const matNegro = new THREE.MeshStandardMaterial({ color: '#2b3038', roughness: 0.6 });
  const solido = (m) => {
    m.userData.solido = 'silla';
    m.userData.parteMosca = true;
    m.castShadow = true;
    m.receiveShadow = true;
    silla.add(m);
    return m;
  };

  const asiento = solido(
    new THREE.Mesh(new THREE.CylinderGeometry(SILLA.radio, SILLA.radio - 0.02, SILLA.grosor, 36), matTapiz)
  );
  asiento.position.set(0, ALTO_ASIENTO - SILLA.grosor / 2, Z_SILLA);
  const ribete = new THREE.Mesh(new THREE.TorusGeometry(SILLA.radio - 0.004, 0.012, 8, 40), matTapiz);
  ribete.rotation.x = Math.PI / 2;
  ribete.position.set(0, ALTO_ASIENTO - 0.012, Z_SILLA);
  ribete.castShadow = true;
  silla.add(ribete);

  const columna = solido(new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, ALTO_ASIENTO - 0.16, 14), matMetal));
  columna.position.set(0, 0.09 + (ALTO_ASIENTO - 0.16) / 2, Z_SILLA);

  const aro = solido(new THREE.Mesh(new THREE.TorusGeometry(SILLA.radioAro, SILLA.tuboAro, 10, 40), matMetal));
  aro.rotation.x = Math.PI / 2;
  aro.position.set(0, SILLA.altoAro, Z_SILLA);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const rayo = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, SILLA.radioAro, 6), matMetal);
    rayo.rotation.z = Math.PI / 2;
    rayo.rotation.y = a;
    rayo.position.set(Math.cos(a) * SILLA.radioAro * 0.5, SILLA.altoAro, Z_SILLA - Math.sin(a) * SILLA.radioAro * 0.5);
    silla.add(rayo);
  }

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.05), matNegro);
    brazo.position.set(Math.cos(a) * 0.15, 0.075, Z_SILLA - Math.sin(a) * 0.15);
    brazo.rotation.y = a;
    brazo.castShadow = true;
    silla.add(brazo);
    const rueda = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), matNegro);
    rueda.position.set(Math.cos(a) * 0.29, 0.032, Z_SILLA - Math.sin(a) * 0.29);
    rueda.castShadow = true;
    silla.add(rueda);
  }
  return silla;
}

// =====================================================================

export function crearMosca(scene) {
  const raiz = new THREE.Group();
  raiz.position.set(MOSCA.x, 0, MOSCA.z);
  raiz.rotation.y = MOSCA.rumbo;
  raiz.add(crearSilla());

  const mosca = new THREE.Group();
  mosca.position.y = ALTO_ASIENTO;
  mosca.scale.setScalar(ESCALA_MOSCA);
  raiz.add(mosca);

  const cuerpo = new THREE.Group();
  mosca.add(cuerpo);

  const mats = {
    cuticula: new THREE.MeshStandardMaterial({ color: COLORES.cuticula, roughness: 0.62 }),
    pata: new THREE.MeshStandardMaterial({ color: COLORES.pata, roughness: 0.55 }),
    pataPunta: new THREE.MeshStandardMaterial({ color: COLORES.pataPunta, roughness: 0.6 }),
    antena: new THREE.MeshStandardMaterial({ color: '#a8743d', roughness: 0.55 }),
    cerda: new THREE.MeshStandardMaterial({ color: COLORES.cerda, roughness: 0.5 }),
    camisa: new THREE.MeshStandardMaterial({ color: COLORES.camisa, roughness: 0.82 }),
    camisaDoble: new THREE.MeshStandardMaterial({ color: COLORES.camisa, roughness: 0.82, side: THREE.DoubleSide }),
  };

  const parte = (geo, mat, x, y, z, datos = { parteMosca: true }) => {
    const m = marcar(new THREE.Mesh(geo, mat), datos);
    m.position.set(x, y, z);
    cuerpo.add(m);
    return m;
  };

  // --- Abdomen con rayas ---
  const abdomenGeo = new THREE.SphereGeometry(1, 36, 24);
  abdomenGeo.rotateX(Math.PI / 2);
  const abdomen = parte(
    abdomenGeo,
    new THREE.MeshStandardMaterial({ map: texturaAbdomenDrosophila(), roughness: 0.55 }),
    0,
    0.17,
    -0.17,
    { solido: 'cuerpo', parteMosca: true }
  );
  abdomen.rotation.x = -0.25;
  abdomen.scale.set(0.19, 0.16, 0.26);

  // --- Tórax con camisa ---
  const torax = parte(new THREE.SphereGeometry(1, 36, 26), mats.camisa, PECHO.c.x, PECHO.c.y, PECHO.c.z, {
    solido: 'cuerpo',
    parteMosca: true,
  });
  torax.scale.copy(PECHO.r);

  const cuelloPiel = parte(new THREE.CylinderGeometry(0.066, 0.072, 0.1, 18), mats.cuticula, 0, 0.625, 0.05);
  cuelloPiel.userData = {};
  const cuelloCamisa = parte(new THREE.TorusGeometry(0.07, 0.016, 10, 30), mats.camisa, 0, 0.585, 0.035, {});
  cuelloCamisa.rotation.x = Math.PI / 2 + 0.12;

  // Puntas del cuello de la camisa
  [-1, 1].forEach((lado) => {
    const ax = 0.05 * lado;
    const ay = -0.075;
    const largo = Math.hypot(ax, ay);
    const geo = crearPiezaSobrePecho(
      (t) => ({
        x: lado * 0.022 + ax * t,
        y: 0.592 + ay * t,
        hw: 0.028 * (1 - t),
        nx: -ay / largo,
        ny: ax / largo,
      }),
      { atras: 0.002, frente: 0.011, nT: 8, nS: 4 }
    );
    parte(geo, mats.camisaDoble, 0, 0, 0, {});
  });

  // --- Corbata: azul intenso con rayas doradas, pegada a la curva del pecho ---
  const matCorbata = new THREE.MeshStandardMaterial({
    map: texturaCorbata(),
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  const hoja = crearPiezaSobrePecho(
    (t) => {
      const y = t < 0.8 ? lerp(0.53, 0.335, t / 0.8) : lerp(0.335, 0.285, (t - 0.8) / 0.2);
      const hw = t < 0.8 ? lerp(0.02, 0.054, t / 0.8) : lerp(0.054, 0.0, (t - 0.8) / 0.2);
      return { x: 0, y, hw, nx: 1, ny: 0 };
    },
    { atras: 0.004, frente: 0.017 }
  );
  parte(hoja, matCorbata, 0, 0, 0, { solido: 'cuerpo', parteMosca: true });
  // Nudo: un bulto trapezoidal bien marcado, apoyado en el pecho
  const nudoGeo = new THREE.SphereGeometry(1, 24, 16);
  const pn = nudoGeo.attributes.position;
  for (let i = 0; i < pn.count; i++) {
    const y = pn.getY(i);
    pn.setX(i, pn.getX(i) * (1 + 0.38 * y));
  }
  nudoGeo.computeVertexNormals();
  const yNudo = 0.548;
  const pendiente = (superficiePecho(0, yNudo + 0.005) - superficiePecho(0, yNudo - 0.005)) / 0.01;
  const nudo = parte(
    nudoGeo,
    new THREE.MeshStandardMaterial({ color: '#1d48b5', roughness: 0.45 }),
    0,
    yNudo,
    superficiePecho(0, yNudo) + 0.014,
    { solido: 'cuerpo', parteMosca: true }
  );
  nudo.scale.set(0.036, 0.03, 0.017);
  nudo.rotation.x = -Math.atan(-pendiente) * 0.85;

  // --- Cabeza ---
  const cabeza = new THREE.Group();
  cabeza.position.set(0, 0.79, 0.07);
  cabeza.rotation.order = 'YXZ';
  cuerpo.add(cabeza);
  const R_CABEZA = new THREE.Vector3(0.208, 0.188, 0.188);

  const enCabeza = (geo, mat, x, y, z, datos = {}) => {
    const m = marcar(new THREE.Mesh(geo, mat), datos);
    m.position.set(x, y, z);
    cabeza.add(m);
    return m;
  };

  const craneo = enCabeza(new THREE.SphereGeometry(1, 36, 28), mats.cuticula, 0, 0, 0, { solido: 'cuerpo', parteMosca: true });
  craneo.scale.copy(R_CABEZA);

  // Ojos compuestos
  const facetas = texturaOjoFacetas();
  const matOjo = new THREE.MeshPhysicalMaterial({
    map: facetas.mapa,
    bumpMap: facetas.bump,
    bumpScale: 1.2,
    roughness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });
  const matPupila = new THREE.MeshPhysicalMaterial({
    color: COLORES.ojoPupila,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const matBrilloOjo = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const R_OJO = 0.112;
  const ojos = [-1, 1].map((lado) => {
    const grupo = new THREE.Group();
    grupo.position.set(lado * 0.114, 0.012, 0.084);
    grupo.rotation.y = lado * 0.42;
    grupo.scale.set(0.84, 1.1, 0.94);
    cabeza.add(grupo);
    const esfera = marcar(new THREE.Mesh(new THREE.SphereGeometry(R_OJO, 48, 32), matOjo), { solido: 'cuerpo', parteMosca: true });
    grupo.add(esfera);
    const pupila = new THREE.Mesh(crearCasquete(R_OJO * 1.004, 0.48), matPupila);
    const brilloGrande = new THREE.Mesh(crearCasquete(R_OJO * 1.008, 0.17), matBrilloOjo);
    const brilloChico = new THREE.Mesh(crearCasquete(R_OJO * 1.008, 0.085), matBrilloOjo);
    grupo.add(pupila, brilloGrande, brilloChico);
    return { lado, grupo, pupila, brilloGrande, brilloChico };
  });

  // Cejas (cerdas oscuras sobre los ojos: le dan expresión)
  const cejas = [-1, 1].map((lado) => {
    const ceja = enCabeza(new THREE.CapsuleGeometry(0.011, 0.07, 4, 10), mats.cerda, lado * 0.1, 0.132, 0.122);
    ceja.rotation.order = 'YXZ';
    ceja.rotation.y = lado * 0.5;
    ceja.rotation.x = -0.5;
    return ceja;
  });

  // Boca
  const boca = enCabeza(new THREE.TorusGeometry(0.03, 0.0075, 8, 24, Math.PI), mats.cerda, 0, -0.105, 0.157);
  boca.rotation.order = 'XYZ';
  boca.rotation.x = 0.56;
  boca.rotation.z = Math.PI;

  // Antenas: segmento ovalado + arista plumosa
  [-1, 1].forEach((lado) => {
    const antena = new THREE.Group();
    antena.position.set(lado * 0.034, 0.04, 0.178);
    antena.rotation.set(0.35, lado * 0.25, 0);
    cabeza.add(antena);
    const pedicelo = marcar(new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), mats.antena), {});
    antena.add(pedicelo);
    const funiculo = marcar(new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 12), mats.antena), {});
    funiculo.scale.set(0.85, 1.4, 0.85);
    funiculo.position.set(0, -0.028, 0.012);
    antena.add(funiculo);
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(lado * 0.012, -0.02, 0.022),
      new THREE.Vector3(lado * 0.03, 0.012, 0.05),
      new THREE.Vector3(lado * 0.036, 0.055, 0.062),
    ]);
    const arista = marcar(new THREE.Mesh(new THREE.TubeGeometry(curva, 12, 0.0026, 5), mats.cerda), {});
    antena.add(arista);
  });

  // Ocelos (3 ojitos simples arriba de la cabeza) y cerdas del cráneo
  const matOcelo = new THREE.MeshStandardMaterial({ color: '#7a1d14', roughness: 0.3 });
  [
    [0, 0.186, 0.03],
    [-0.022, 0.183, -0.006],
    [0.022, 0.183, -0.006],
  ].forEach(([x, y, z]) => enCabeza(new THREE.SphereGeometry(0.0105, 10, 8), matOcelo, x, y, z));
  [-1, 1].forEach((lado) => {
    [0, 1].forEach((k) => {
      const geo = new THREE.ConeGeometry(0.0055, 0.075, 6);
      geo.translate(0, 0.0375, 0);
      const cerda = enCabeza(geo, mats.cerda, lado * (0.03 + k * 0.03), 0.178 - k * 0.012, -0.03 - k * 0.03);
      cerda.rotation.set(-0.75 - k * 0.2, 0, lado * -(0.2 + k * 0.25));
    });
  });

  // Gotas de sudor (forma de lágrima)
  const perfilGota = [
    [0, -1],
    [0.55, -0.82],
    [0.78, -0.45],
    [0.68, -0.02],
    [0.42, 0.42],
    [0.18, 0.78],
    [0, 1],
  ].map(([x, y]) => new THREE.Vector2(x * 0.02, y * 0.026));
  const gotaGeo = new THREE.LatheGeometry(perfilGota, 14);
  const gotas = [
    { lado: -1, fase: 0 },
    { lado: -1, fase: 0.45 },
    { lado: 1, fase: 0.22 },
  ].map((g) => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: COLORES.gota,
      roughness: 0.06,
      clearcoat: 1,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const m = new THREE.Mesh(gotaGeo, mat);
    m.visible = false;
    cabeza.add(m);
    return { ...g, m };
  });

  // --- Alas con venas, plegadas sobre el abdomen ---
  const geoAla = crearGeometriaAla(0.5);
  const matAla = new THREE.MeshPhysicalMaterial({
    map: texturaAla(),
    transparent: true,
    roughness: 0.15,
    iridescence: 0.9,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [150, 450],
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const alas = [-1, 1].map((lado) => {
    const pivote = new THREE.Group();
    pivote.position.set(lado * 0.055, 0.5, -0.1);
    const atras = new THREE.Vector3(lado * 0.24, -0.34, -1).normalize();
    const afuera = new THREE.Vector3(lado, 0.12, 0);
    afuera.addScaledVector(atras, -afuera.dot(atras)).normalize();
    const normal = new THREE.Vector3().crossVectors(atras, afuera);
    pivote.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(atras, afuera, normal));
    const base = pivote.quaternion.clone();
    const ala = new THREE.Mesh(geoAla, matAla);
    ala.renderOrder = 2;
    pivote.add(ala);
    cuerpo.add(pivote);
    return { lado, pivote, base };
  });

  // --- Patas: 6, finas, de tres tramos ---
  const brazos = [-1, 1].map((lado) =>
    crearPata(cuerpo, mats, {
      largos: [0.25, 0.25, 0.09],
      radios: [0.019, 0.015, 0.0105],
      manga: mats.camisaDoble,
      revisaCuerpo: true,
    })
  );
  const patasMedias = [-1, 1].map(() =>
    crearPata(cuerpo, mats, { largos: [0.2, 0.21, 0.08], radios: [0.017, 0.013, 0.0095] })
  );
  const patasTraseras = [-1, 1].map(() =>
    crearPata(cuerpo, mats, { largos: [0.21, 0.23, 0.08], radios: [0.017, 0.013, 0.0095] })
  );

  const HOMBRO = (lado) => new THREE.Vector3(lado * 0.15, 0.47, 0.05);
  const CADERA_MEDIA = (lado) => new THREE.Vector3(lado * 0.15, 0.31, -0.03);
  const CADERA_TRASERA = (lado) => new THREE.Vector3(lado * 0.1, 0.22, -0.03);

  // Puntos de apoyo fijos (en el espacio de la mosca, antes de inclinarse)
  const S = ESCALA_MOSCA;
  const aMosca = (x, y, z) => new THREE.Vector3(x / S, (y - ALTO_ASIENTO) / S, z / S);
  const radioAlmohadilla = 0.0095 * 1.5 * S;
  const apoyoMedio = (lado) => {
    const a = (70 * Math.PI) / 180;
    const r = SILLA.radio + radioAlmohadilla;
    return aMosca(lado * Math.sin(a) * r, ALTO_ASIENTO - 0.022, Z_SILLA + Math.cos(a) * r);
  };
  const apoyoTrasero = (lado) => {
    const x = 0.09;
    return aMosca(
      lado * x,
      SILLA.altoAro + SILLA.tuboAro + radioAlmohadilla,
      Z_SILLA + Math.sqrt(SILLA.radioAro ** 2 - x * x)
    );
  };

  // --- Cigarro (en la mano derecha: el lado que ve la cámara) ---
  const LARGO_FILTRO = 0.032;
  const LARGO_PAPEL = 0.088;
  const RADIO_CIG = 0.0115;
  const cigarro = new THREE.Group();
  cigarro.visible = false;
  cuerpo.add(cigarro);
  const datosCig = { parteMosca: true, revisaCuerpo: true };
  const filtro = marcar(
    new THREE.Mesh(
      new THREE.CylinderGeometry(RADIO_CIG, RADIO_CIG, LARGO_FILTRO, 14),
      new THREE.MeshStandardMaterial({ color: '#d9a35f', roughness: 0.85 })
    ),
    { ...datosCig, cigarroBoca: true }
  );
  filtro.position.y = LARGO_FILTRO / 2;
  cigarro.add(filtro);
  const papelGeo = new THREE.CylinderGeometry(RADIO_CIG, RADIO_CIG, 1, 14);
  papelGeo.translate(0, 0.5, 0);
  const papel = marcar(
    new THREE.Mesh(papelGeo, new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.8 })),
    datosCig
  );
  papel.position.y = LARGO_FILTRO;
  cigarro.add(papel);
  const cenizaGeo = new THREE.CylinderGeometry(RADIO_CIG * 0.96, RADIO_CIG, 1, 14);
  cenizaGeo.translate(0, 0.5, 0);
  const ceniza = marcar(
    new THREE.Mesh(cenizaGeo, new THREE.MeshStandardMaterial({ color: '#8f8a84', roughness: 1 })),
    datosCig
  );
  cigarro.add(ceniza);
  const matBrasa = new THREE.MeshStandardMaterial({
    color: '#ff7a2f',
    emissive: '#ff4d0f',
    emissiveIntensity: 2,
    roughness: 0.7,
  });
  const brasa = new THREE.Mesh(new THREE.SphereGeometry(RADIO_CIG * 0.92, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), matBrasa);
  cigarro.add(brasa);
  const resplandor = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texturaBrillo('255,130,40'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  cigarro.add(resplandor);
  const luzBrasa = new THREE.PointLight('#ff7a30', 0, 0.35, 2);
  cuerpo.add(luzBrasa);

  scene.add(raiz);

  // --- Humo: volutas que suben, se mecen con el aire y se desvanecen ---
  const texHumo = texturasHumo(4);
  const particulas = [];
  const grupoHumo = new THREE.Group();
  scene.add(grupoHumo);
  for (let i = 0; i < 130; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texHumo[i % texHumo.length], transparent: true, depthWrite: false, opacity: 0 })
    );
    sprite.visible = false;
    sprite.userData = {
      edad: 0,
      vida: 1,
      vel: new THREE.Vector3(),
      t0: 0.02,
      t1: 0.2,
      opMax: 0.3,
      giro: 0,
      semilla: 0,
    };
    grupoHumo.add(sprite);
    particulas.push(sprite);
  }
  let siguienteParticula = 0;
  function emitir(pos, vel, { vida, t0, t1, opMax, color }) {
    for (let k = 0; k < particulas.length; k++) {
      const p = particulas[(siguienteParticula + k) % particulas.length];
      if (p.visible) continue;
      siguienteParticula = (siguienteParticula + k + 1) % particulas.length;
      p.visible = true;
      p.position.copy(pos);
      Object.assign(p.userData, { edad: 0, vida, t0, t1, opMax, giro: (Math.random() - 0.5) * 0.6, semilla: Math.random() * 10 });
      p.userData.vel.copy(vel);
      p.material.color.set(color);
      p.material.rotation = Math.random() * Math.PI * 2;
      p.material.opacity = 0;
      p.scale.setScalar(t0);
      return;
    }
  }

  // ---------- Estado de la animación ----------
  let t = 0;
  let estresSuave = 0;
  let mezclaFumar = 0;
  let restanteFumar = 0;
  let tFumar = 0;
  let pesoBoca = 0;
  let fumandoAntes = false;
  let quemado = 0;
  let exhalando = 0;
  let pesoBocaAntes = 0;
  let faseTipeo = 0;
  let faseAlas = 0;
  let acumHumo = 0;
  let acumExhalo = 0;
  const giroCabeza = { yaw: 0.0, pitch: 0.0 };

  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const objetivoMirada = new THREE.Vector3();
  const invCuerpo = new THREE.Matrix4();
  const puntoBoca = new THREE.Vector3();
  const adelanteCabeza = new THREE.Vector3();
  const derechaCabeza = new THREE.Vector3();
  const manoObjetivo = new THREE.Vector3();
  const ejeCig = new THREE.Vector3();
  const filtroPos = new THREE.Vector3();
  const posBrasa = new THREE.Vector3();
  const dirTarso = new THREE.Vector3();
  const polo = new THREE.Vector3();
  const mundoBoca = new THREE.Vector3();
  const adelanteMundo = new THREE.Vector3();

  const DIR_TARSO_TECLA = new THREE.Vector3(0, -0.72, 0.69).normalize();
  const MANO_REPOSO = new THREE.Vector3(-0.25, 0.6, 0.17);
  const EJE_REPOSO = new THREE.Vector3(-0.3, 0.88, 0.36).normalize();
  const AGARRE = 0.04; // dónde sujeta el cigarro, medido desde el filtro

  function puntoTeclado(lado, levantar, lateral) {
    const altoTecla = ALTO_ESCRITORIO + 0.049;
    return tmp
      .copy(TECLADO.pos)
      .addScaledVector(IZQ_MOSCA, lado * 0.1 + lateral)
      .addScaledVector(DIR_MOSCA, -0.035)
      .setY(altoTecla + radioAlmohadilla + levantar);
  }

  function update(dtReal, estado) {
    const dt = Math.min(dtReal, 0.05);
    t += dt;
    estresSuave = amortiguar(estresSuave, estado.estres, 1.6, dt);
    const s = estresSuave;

    // --- Fumar: dura un rato fijo en pantalla ---
    if (estado.fumando && !fumandoAntes) {
      if (restanteFumar <= 0) tFumar = 0;
      quemado = 0;
    }
    fumandoAntes = estado.fumando;
    if (estado.fumando) restanteFumar = DURACION_FUMADA_VISUAL;
    else restanteFumar -= dt;
    const fumando = restanteFumar > 0;
    if (fumando) tFumar += dt;
    mezclaFumar = amortiguar(mezclaFumar, fumando ? 1 : 0, 4, dt);
    quemado = Math.min(0.6, quemado + dt * 0.09 * (1 + pesoBoca * 2));

    // Ciclo: sube a la boca, chupa, baja, descansa
    const PERIODO = 2.6;
    let ciclo = 0;
    if (fumando && tFumar > 0.5) {
      const p = (tFumar - 0.5) % PERIODO;
      ciclo = suave(0, 0.65, p) * (1 - suave(1.35, 2.0, p));
    }
    pesoBocaAntes = pesoBoca;
    pesoBoca = amortiguar(pesoBoca, ciclo * suave(0.6, 0.95, mezclaFumar), 12, dt);
    if (pesoBocaAntes > 0.9 && pesoBoca <= 0.9) exhalando = 0.75;
    exhalando = Math.max(0, exhalando - dt);

    // --- Postura: gira un poco la silla al fumar, se inclina al estresarse ---
    raiz.rotation.y = MOSCA.rumbo - mezclaFumar * 0.16;
    cuerpo.rotation.x = lerp(0, 0.09, s) * (1 - mezclaFumar) - mezclaFumar * 0.05;
    // Al inclinarse, el abdomen gira sobre el asiento: lo levanto lo justo
    // para que nunca se hunda en el cojín.
    cuerpo.position.y = Math.max(0, -cuerpo.rotation.x) * 0.42 + Math.max(0, cuerpo.rotation.x) * 0.12;
    const temblor = suave(0.78, 1, s);
    cuerpo.position.x = Math.sin(t * 21) * 0.0012 * temblor;
    torax.scale.set(PECHO.r.x * (1 + Math.sin(t * 1.7) * 0.008), PECHO.r.y, PECHO.r.z);

    // --- Cabeza: mira la pantalla; al fumar mira un poco a la cámara ---
    raiz.updateMatrixWorld(true);
    objetivoMirada.copy(CENTRO_PANTALLA).lerp(CAMARA_INICIAL.posicion, mezclaFumar * 0.22);
    tmp.copy(objetivoMirada);
    cuerpo.worldToLocal(tmp).sub(cabeza.position);
    const yaw = clamp(Math.atan2(tmp.x, tmp.z), -0.75, 0.75);
    const pitch = clamp(Math.atan2(-tmp.y, Math.hypot(tmp.x, tmp.z)), -0.35, 0.35);
    giroCabeza.yaw = amortiguar(giroCabeza.yaw, yaw, 3, dt);
    giroCabeza.pitch = amortiguar(giroCabeza.pitch, pitch + s * 0.12, 3, dt);
    cabeza.rotation.y = giroCabeza.yaw;
    cabeza.rotation.x = giroCabeza.pitch + Math.sin(t * 2.1) * 0.012 * (1 - s);
    cabeza.updateMatrixWorld(true);

    // --- Ojos: la "pupila" de mosca apunta a donde mira ---
    const anguloPupila = lerp(0.5, 0.36, s);
    ojos.forEach((o) => {
      tmp.copy(objetivoMirada);
      o.grupo.worldToLocal(tmp).normalize();
      o.pupila.quaternion.setFromUnitVectors(EJE_Y, tmp);
      fijarAnguloCasquete(o.pupila.geometry, anguloPupila);
      const derecha = tmp2.crossVectors(EJE_Y, tmp).normalize();
      const arriba = new THREE.Vector3().crossVectors(tmp, derecha);
      const dirG = new THREE.Vector3()
        .copy(tmp)
        .addScaledVector(arriba, 0.36)
        .addScaledVector(derecha, -0.2)
        .normalize();
      const dirC = new THREE.Vector3()
        .copy(tmp)
        .addScaledVector(arriba, -0.24)
        .addScaledVector(derecha, 0.24)
        .normalize();
      o.brilloGrande.quaternion.setFromUnitVectors(EJE_Y, dirG);
      o.brilloChico.quaternion.setFromUnitVectors(EJE_Y, dirC);
      o.grupo.scale.y = lerp(1.1, 1.03, s);
    });

    // --- Cara: cejas, boca ---
    cejas.forEach((ceja, i) => {
      const lado = i === 0 ? -1 : 1;
      ceja.rotation.z = Math.PI / 2 + lado * lerp(0.12, -0.42, s);
      ceja.position.y = lerp(0.134, 0.141, s);
    });
    boca.scale.set(lerp(1, 0.8, s) * lerp(1, 0.55, pesoBoca), lerp(1, -0.85, Math.min(1, s * 1.2)), 1);

    // --- Alas: casi quietas; un zumbido leve cuando hay mucho estrés ---
    faseAlas += dt * (14 + 16 * s);
    const zumbido = Math.sin(faseAlas) * 0.03 * suave(0.55, 1, s);
    alas.forEach(({ lado, pivote, base }) => {
      tmp.set(0, 0, 0);
      const e = new THREE.Euler(lado * (Math.sin(t * 1.3) * 0.015 + zumbido), 0, 0);
      pivote.quaternion.copy(base).multiply(new THREE.Quaternion().setFromEuler(e));
    });

    // --- Patas ---
    cuerpo.updateMatrix();
    invCuerpo.copy(cuerpo.matrix).invert();
    const enCuerpo = (v) => v.applyMatrix4(invCuerpo);
    const desdeMundo = (v) => cuerpo.worldToLocal(v);

    patasMedias.forEach((pata, i) => {
      const lado = i === 0 ? -1 : 1;
      dirTarso.set(lado * 0.35, -0.9, 0.15).normalize();
      pata.poner(CADERA_MEDIA(lado), enCuerpo(apoyoMedio(lado)), dirTarso, polo.set(lado, 0.9, 0.1).normalize());
    });
    patasTraseras.forEach((pata, i) => {
      const lado = i === 0 ? -1 : 1;
      dirTarso.set(lado * 0.1, -0.8, -0.55).normalize();
      pata.poner(
        CADERA_TRASERA(lado),
        enCuerpo(apoyoTrasero(lado)),
        dirTarso,
        polo.set(lado * 0.35, 0.3, 1).normalize()
      );
    });

    // Tipeo: las manos suben y bajan sobre las teclas (nunca bajo ellas)
    faseTipeo += dt * (7 + 7 * s) * (1 - mezclaFumar * 0.8);
    [0, 1].forEach((i) => {
      const lado = i === 0 ? -1 : 1;
      const onda = 0.5 + 0.5 * Math.sin(faseTipeo + i * Math.PI);
      const quieta = i === 1 ? mezclaFumar : 0;
      const levantar = onda * onda * 0.028 * (1 - quieta);
      const lateral = Math.sin(faseTipeo * 0.31 + i * 2) * 0.022 * (1 - quieta);
      const enTecla = desdeMundo(puntoTeclado(lado, levantar, lateral)).clone();
      const hombro = HOMBRO(lado);
      const poloTecleo = polo.set(lado, -0.35, -0.45).normalize().clone();

      if (i === 0 && mezclaFumar > 0.001) {
        // Mano del cigarro
        boca.getWorldPosition(mundoBoca);
        puntoBoca.copy(mundoBoca);
        desdeMundo(puntoBoca);
        adelanteCabeza.set(0, 0, 1).applyQuaternion(cabeza.quaternion);
        derechaCabeza.set(-1, 0, 0).applyQuaternion(cabeza.quaternion);
        const ejeBoca = tmp2
          .copy(adelanteCabeza)
          .multiplyScalar(0.8)
          .addScaledVector(derechaCabeza, 0.55)
          .add(new THREE.Vector3(0, -0.04, 0))
          .normalize()
          .clone();
        const filtroBoca = puntoBoca.clone().addScaledVector(adelanteCabeza, 0.012);
        const manoBoca = filtroBoca.clone().addScaledVector(ejeBoca, AGARRE);

        manoObjetivo.copy(MANO_REPOSO).lerp(manoBoca, pesoBoca);
        ejeCig.copy(EJE_REPOSO).lerp(ejeBoca, pesoBoca).normalize();
        filtroPos.copy(manoObjetivo).addScaledVector(ejeCig, -AGARRE);

        // En el camino teclado <-> cigarro la mano sube primero (arco), y el
        // codo sólo baja cuando la mano ya está cerca del cuerpo: así el brazo
        // nunca roza el escritorio.
        const objetivo = enTecla.clone().lerp(manoObjetivo, mezclaFumar);
        objetivo.y += Math.sin(Math.PI * mezclaFumar) * 0.1;
        const mezclaCodo = suave(0.55, 1, mezclaFumar);
        const dirSujetar = manoObjetivo.clone().sub(hombro).add(new THREE.Vector3(0, 0.05, 0)).normalize();
        dirTarso.copy(DIR_TARSO_TECLA).lerp(dirSujetar, mezclaFumar).normalize();
        const poloFumar = new THREE.Vector3(lado * 0.75, -1, -0.25).normalize();
        polo.copy(poloTecleo).lerp(poloFumar, mezclaCodo).normalize();
        brazos[i].poner(hombro, objetivo, dirTarso, polo);

        // Cigarro en la mano
        const aparecer = suave(0.55, 0.92, mezclaFumar);
        cigarro.visible = aparecer > 0.01;
        cigarro.position.copy(brazos[i].punta).addScaledVector(ejeCig, -AGARRE * aparecer);
        cigarro.quaternion.setFromUnitVectors(EJE_Y, ejeCig);
        cigarro.scale.setScalar(Math.max(aparecer, 0.001));
      } else {
        brazos[i].poner(hombro, enTecla, DIR_TARSO_TECLA, poloTecleo);
        if (i === 0) cigarro.visible = false;
      }
    });

    // Largo del cigarro, ceniza y brasa
    const largoPapel = LARGO_PAPEL * (1 - quemado);
    papel.scale.y = largoPapel;
    const largoCeniza = 0.004 + quemado * 0.03;
    ceniza.position.y = LARGO_FILTRO + largoPapel;
    ceniza.scale.y = largoCeniza;
    brasa.position.y = LARGO_FILTRO + largoPapel + largoCeniza;
    resplandor.position.y = brasa.position.y + 0.004;
    const chupada = pesoBoca * (0.75 + 0.25 * Math.sin(t * 9));
    matBrasa.emissiveIntensity = 1.6 + chupada * 3.5;
    resplandor.scale.setScalar(0.05 + chupada * 0.035);
    resplandor.material.opacity = 0.75 + chupada * 0.25;
    brasa.getWorldPosition(posBrasa);
    tmp.copy(posBrasa);
    luzBrasa.position.copy(cuerpo.worldToLocal(tmp));
    luzBrasa.intensity = cigarro.visible ? (0.08 + chupada * 0.14) * cigarro.scale.x : 0;

    // --- Humo ---
    if (cigarro.visible && cigarro.scale.x > 0.6) {
      // Cerca de la cara echa menos humo, para que no le tape los ojos
      acumHumo += dt * 15 * (1 - 0.85 * pesoBoca);
      while (acumHumo >= 1) {
        acumHumo -= 1;
        emitir(
          tmp.copy(posBrasa).add(new THREE.Vector3((Math.random() - 0.5) * 0.006, 0.006, (Math.random() - 0.5) * 0.006)),
          new THREE.Vector3((Math.random() - 0.5) * 0.012, 0.07 + Math.random() * 0.03, (Math.random() - 0.5) * 0.012),
          { vida: 2.6 + Math.random() * 1.2, t0: 0.022, t1: 0.15 + Math.random() * 0.09, opMax: 0.75, color: '#7f8a9c' }
        );
      }
    }
    if (exhalando > 0) {
      boca.getWorldPosition(mundoBoca);
      // Exhala hacia el costado (el lado de la cámara) y un poco hacia arriba,
      // para que el humo no tape la cara.
      const qCabeza = cabeza.getWorldQuaternion(new THREE.Quaternion());
      adelanteMundo
        .set(-0.75, 0.2, 0.55)
        .applyQuaternion(qCabeza)
        .normalize();
      acumExhalo += dt * 22;
      while (acumExhalo >= 1) {
        acumExhalo -= 1;
        const v = adelanteMundo.clone().multiplyScalar(0.16 + Math.random() * 0.06);
        v.y += 0.03 + Math.random() * 0.02;
        v.x += (Math.random() - 0.5) * 0.04;
        v.z += (Math.random() - 0.5) * 0.04;
        emitir(mundoBoca.clone().addScaledVector(adelanteMundo, 0.02), v, {
          vida: 1.4 + Math.random() * 0.5,
          t0: 0.03,
          t1: 0.22 + Math.random() * 0.08,
          opMax: 0.2,
          color: '#a7a9ad',
        });
      }
    }

    particulas.forEach((p) => {
      if (!p.visible) return;
      const u = p.userData;
      u.edad += dt;
      const a = u.edad / u.vida;
      if (a >= 1) {
        p.visible = false;
        return;
      }
      u.vel.y = Math.min(0.16, u.vel.y + dt * 0.03);
      u.vel.multiplyScalar(1 - dt * 0.6 * (u.vel.y > 0.1 ? 0 : 1) * 0.3);
      const turbulencia = 0.35 + a * 1.1;
      const vientoX = (Math.sin(t * 0.6 + p.position.y * 5 + u.semilla * 6) * 0.04 - 0.02) * turbulencia;
      const vientoZ = Math.cos(t * 0.45 + p.position.y * 4 + u.semilla * 4) * 0.03 * turbulencia;
      p.position.x += (u.vel.x + vientoX) * dt;
      p.position.y += u.vel.y * dt;
      p.position.z += (u.vel.z + vientoZ) * dt;
      p.scale.setScalar(lerp(u.t0, u.t1, Math.sqrt(a)));
      p.material.rotation += u.giro * dt;
      p.material.opacity = u.opMax * suave(0, 0.06, a) * Math.pow(1 - a, 1.3);
    });

    // --- Sudor: aparece y desaparece de a poco ---
    const sudor = suave(0.42, 0.65, s);
    gotas.forEach((g) => {
      const ciclo = (t * 0.42 + g.fase) % 1;
      const vis = sudor * suave(0, 0.15, ciclo) * (1 - suave(0.72, 1, ciclo));
      g.m.visible = vis > 0.01;
      if (!g.m.visible) return;
      const yaw = g.lado * 1.42;
      const lat = lerp(0.55, -0.2, ciclo);
      const r = 1.0;
      g.m.position.set(
        Math.sin(yaw) * Math.cos(lat) * R_CABEZA.x * r,
        Math.sin(lat) * R_CABEZA.y * r,
        Math.cos(yaw) * Math.cos(lat) * R_CABEZA.z * r
      );
      g.m.position.addScaledVector(g.m.position.clone().normalize(), 0.012);
      g.m.material.opacity = 0.9 * vis;
      g.m.scale.setScalar(lerp(0.85, 1.1, ciclo));
    });
  }

  return {
    grupo: raiz,
    update,
    // El cigarro que fuma ahora todavía no es colilla
    cigarroEnMano: () => mezclaFumar > 0.5,
  };
}
