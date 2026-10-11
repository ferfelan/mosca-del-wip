// La mosca oficinista: una Drosophila melanogaster en versión tierna, con
// cuerpo de mosca de verdad (cabeza chica, tórax y abdomen largos, patas
// finas con pelitos, trompita en vez de boca). Las patas se calculan cada
// cuadro para que se apoyen justo en el teclado y en el asiento, y para que
// lleven el cigarro a la trompita sin atravesar nada.
import * as THREE from 'three';
import {
  texturaAbdomenDrosophila,
  texturaCuticula,
  texturaOjoFacetas,
  texturaAla,
  texturaCorbata,
  texturasHumo,
  texturaBrillo,
  texturaBrilloOjo,
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
  cuticula: '#a98f70',
  pata: '#9b8162',
  articulacion: '#6c5642',
  pataPunta: '#4e3d2e',
  trompa: '#8e7458',
  labelo: '#a88b6b',
  cerda: '#2e241b',
  camisa: '#fbf8f2',
  boton: '#e4ded2',
  silla: '#46525f',
  metal: '#9aa3ad',
  gota: '#86d3f4',
};

// Cuánto dura en pantalla cada salida a fumar (segundos reales), aunque el
// juego la cuente como unos pocos minutos simulados.
const DURACION_FUMADA_VISUAL = 3.0;

// La silla (en metros del mundo, centrada bajo la mosca)
const Z_SILLA = -0.1 * ESCALA_MOSCA;
const SILLA = { radio: 0.32, grosor: 0.07, altoAro: 0.25, radioAro: 0.2, tuboAro: 0.013 };

// ---------- Forma del cuerpo (medidas de la mosca, antes de escalar) ----------
// El tórax va inclinado hacia arriba (como una mosca que levanta el frente) y
// el abdomen se alarga hacia atrás sobre el asiento.
const ALTO_CINTURA = 0.21; // unión tórax-abdomen, sobre el asiento
const INCLINACION_TORAX = (55 * Math.PI) / 180;
const EJE_TORAX = new THREE.Vector3(0, Math.sin(INCLINACION_TORAX), Math.cos(INCLINACION_TORAX));
const VIENTRE = new THREE.Vector3(0, -Math.cos(INCLINACION_TORAX), Math.sin(INCLINACION_TORAX));
const R_TORAX = { lado: 0.15, largo: 0.21, fondo: 0.15 };
// Medidas relativas a la cintura (el "delantero" gira desde ahí)
const TORAX_C = EJE_TORAX.clone().multiplyScalar(0.19);
const CUELLO = TORAX_C.clone().addScaledVector(EJE_TORAX, 0.18);
const NUDO = CUELLO.clone().addScaledVector(VIENTRE, 0.1);
const CABEZA_C = new THREE.Vector3(0, 0.41, 0.3);
const R_CABEZA = new THREE.Vector3(0.14, 0.12, 0.115);
const ABDOMEN = { c: new THREE.Vector3(0, ALTO_CINTURA - 0.052, -0.245), giro: -0.21, r: [0.15, 0.13, 0.27] };

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


// Pelitos cortos y oscuros a lo largo de un tramo de pata
const GEO_PELO = new THREE.ConeGeometry(0.0032, 0.026, 4);
GEO_PELO.translate(0, 0.013, 0);
const _ref = new THREE.Vector3();
const _p1 = new THREE.Vector3();
const _p2 = new THREE.Vector3();
const _dirPelo = new THREE.Vector3();
function ubicarPelos(lista, a, b, fase) {
  _dir.subVectors(b, a);
  const largo = _dir.length();
  _dir.divideScalar(largo || 1);
  _ref.set(0, 1, 0);
  if (Math.abs(_dir.y) > 0.9) _ref.set(1, 0, 0);
  _p1.crossVectors(_dir, _ref).normalize();
  _p2.crossVectors(_dir, _p1).normalize();
  lista.forEach((m, i) => {
    const f = (i + 0.6) / (lista.length + 0.3);
    m.position.copy(a).addScaledVector(_dir, largo * f);
    const ang = fase + i * 2.3;
    _dirPelo
      .copy(_p1)
      .multiplyScalar(Math.cos(ang))
      .addScaledVector(_p2, Math.sin(ang))
      .addScaledVector(_dir, 0.95)
      .normalize();
    m.quaternion.setFromUnitVectors(EJE_Y, _dirPelo);
  });
}

// Pata de mosca: fémur, tibia y tarso (con segmentos), articulaciones
// marcadas y pelitos.
function crearPata(padre, mats, { largos, radios, manga = null, revisaCuerpo = false }) {
  const [L1, L2, L3] = largos;
  const [r1, r2, r3] = radios;
  const datosPunta = revisaCuerpo ? { revisaCuerpo: true } : {};
  const femur = crearHueso(padre, r1, r1 * 0.8, mats.pata);
  const tibia = crearHueso(padre, r2, r2 * 0.85, mats.pata, datosPunta);
  const tarso = crearHueso(padre, r3, r3 * 0.8, mats.pata, datosPunta);
  const esfera = (r, mat, datos = {}) => {
    const m = marcar(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat), { parteMosca: true, ...datos });
    padre.add(m);
    return m;
  };
  const caderaM = esfera(r1 * 1.25, mats.articulacion);
  const rodillaM = esfera(r1 * 1.15, mats.articulacion);
  const munecaM = esfera(r2 * 1.1, mats.articulacion, datosPunta);
  const segmentos = [0.3, 0.55, 0.78].map(() => esfera(r3 * 1.18, mats.articulacion, datosPunta));
  const almohadilla = esfera(r3 * 1.5, mats.pataPunta, datosPunta);

  const pelo = () => {
    const m = new THREE.Mesh(GEO_PELO, mats.cerda);
    padre.add(m);
    return m;
  };
  const pelosFemur = [0, 1, 2].map(pelo);
  const pelosTibia = [0, 1, 2, 3].map(pelo);

  let mangaM = null;
  if (manga) {
    mangaM = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 1, 4, 14), manga);
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
    caderaM.position.copy(cadera);
    rodillaM.position.copy(rodilla);
    munecaM.position.copy(muneca);
    segmentos.forEach((m, i) => m.position.lerpVectors(muneca, punta, [0.3, 0.55, 0.78][i]));
    almohadilla.position.copy(punta);
    ubicarPelos(pelosFemur, cadera, rodilla, 0.4);
    ubicarPelos(pelosTibia, rodilla, muneca, 1.7);
    if (mangaM) {
      finManga.subVectors(rodilla, cadera).normalize().multiplyScalar(0.035).add(cadera);
      ubicarHueso(mangaM, cadera, finManga);
      mangaM.scale.y = 0.035 / 1.044;
    }
  }
  return { poner, punta, muneca };
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
  const S = ESCALA_MOSCA;
  const raiz = new THREE.Group();
  raiz.position.set(MOSCA.x, 0, MOSCA.z);
  raiz.rotation.y = MOSCA.rumbo;
  raiz.add(crearSilla());

  const mosca = new THREE.Group();
  mosca.position.y = ALTO_ASIENTO;
  mosca.scale.setScalar(S);
  raiz.add(mosca);

  // cuerpo: abdomen y patas. delantero: tórax, cabeza y alas (se inclina
  // desde la cintura para mostrar el ánimo con la postura).
  const cuerpo = new THREE.Group();
  mosca.add(cuerpo);
  const delantero = new THREE.Group();
  delantero.position.set(0, ALTO_CINTURA, 0);
  cuerpo.add(delantero);

  const texCuticula = texturaCuticula();
  const mats = {
    cuticula: new THREE.MeshStandardMaterial({ map: texCuticula, roughness: 0.6 }),
    pata: new THREE.MeshStandardMaterial({ color: COLORES.pata, roughness: 0.55 }),
    articulacion: new THREE.MeshStandardMaterial({ color: COLORES.articulacion, roughness: 0.5 }),
    pataPunta: new THREE.MeshStandardMaterial({ color: COLORES.pataPunta, roughness: 0.6 }),
    cerda: new THREE.MeshStandardMaterial({ color: COLORES.cerda, roughness: 0.5 }),
    camisa: new THREE.MeshStandardMaterial({ color: COLORES.camisa, roughness: 0.82 }),
    camisaDoble: new THREE.MeshStandardMaterial({ color: COLORES.camisa, roughness: 0.82, side: THREE.DoubleSide }),
    trompa: new THREE.MeshStandardMaterial({ color: COLORES.trompa, roughness: 0.5 }),
    labelo: new THREE.MeshStandardMaterial({ color: COLORES.labelo, roughness: 0.45 }),
  };

  const agregar = (padre, geo, mat, pos, datos = {}) => {
    const m = marcar(new THREE.Mesh(geo, mat), datos);
    m.position.copy(pos);
    padre.add(m);
    return m;
  };

  // --- Abdomen: largo hacia atrás, con bandas finas ---
  const abdomenGeo = new THREE.SphereGeometry(1, 40, 26);
  abdomenGeo.rotateX(Math.PI / 2);
  const abdomen = agregar(
    cuerpo,
    abdomenGeo,
    new THREE.MeshStandardMaterial({ map: texturaAbdomenDrosophila(), roughness: 0.6 }),
    ABDOMEN.c,
    { solido: 'cuerpo', parteMosca: true }
  );
  abdomen.rotation.x = ABDOMEN.giro;
  abdomen.scale.set(...ABDOMEN.r);

  // --- Tórax con camisa ---
  const torax = agregar(delantero, new THREE.SphereGeometry(1, 36, 26), mats.camisa, TORAX_C, {
    solido: 'cuerpo',
    parteMosca: true,
  });
  torax.rotation.x = Math.PI / 2 - INCLINACION_TORAX;
  torax.scale.set(R_TORAX.lado, R_TORAX.largo, R_TORAX.fondo);

  // Botones de la camisa por el frente
  [0.07, 0.0, -0.07].forEach((u) => {
    const w = R_TORAX.fondo * Math.sqrt(1 - (u / R_TORAX.largo) ** 2);
    const pos = TORAX_C.clone().addScaledVector(EJE_TORAX, u).addScaledVector(VIENTRE, w + 0.002);
    const boton = agregar(
      delantero,
      new THREE.SphereGeometry(0.009, 10, 8),
      new THREE.MeshStandardMaterial({ color: COLORES.boton, roughness: 0.4 }),
      pos
    );
    boton.scale.set(1, 1, 0.45);
    boton.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), VIENTRE);
  });

  // Cuello de la camisa (anillo) y sus dos puntas
  const anillo = agregar(delantero, new THREE.TorusGeometry(0.072, 0.015, 10, 30), mats.camisa, CUELLO);
  anillo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), EJE_TORAX);
  [-1, 1].forEach((lado) => {
    const geo = new THREE.ConeGeometry(0.024, 0.055, 3);
    const punta = agregar(
      delantero,
      geo,
      mats.camisa,
      CUELLO.clone().addScaledVector(VIENTRE, 0.075).addScaledVector(EJE_TORAX, -0.012).add(new THREE.Vector3(lado * 0.034, 0, 0))
    );
    const dir = VIENTRE.clone().multiplyScalar(0.45).addScaledVector(EJE_TORAX, -0.85).add(new THREE.Vector3(lado * 0.45, 0, 0)).normalize();
    punta.quaternion.setFromUnitVectors(EJE_Y, dir);
    punta.scale.set(1, 1, 0.35);
  });

  // Cuello de la mosca
  const cuelloPiel = agregar(
    delantero,
    new THREE.CylinderGeometry(0.048, 0.055, 0.1, 16),
    mats.cuticula,
    CUELLO.clone().lerp(CABEZA_C, 0.45)
  );
  cuelloPiel.quaternion.setFromUnitVectors(EJE_Y, CABEZA_C.clone().sub(CUELLO).normalize());

  // --- Corbata: nudo marcado y hoja que cuelga derecha ---
  const nudoGeo = new THREE.SphereGeometry(1, 24, 16);
  const pn = nudoGeo.attributes.position;
  for (let i = 0; i < pn.count; i++) pn.setX(i, pn.getX(i) * (1 + 0.38 * pn.getY(i)));
  nudoGeo.computeVertexNormals();
  const matNudo = new THREE.MeshStandardMaterial({ color: '#1d48b5', roughness: 0.45 });
  const nudo = agregar(delantero, nudoGeo, matNudo, NUDO);
  nudo.scale.set(0.027, 0.023, 0.016);
  nudo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), VIENTRE);

  const forma = new THREE.Shape();
  forma.moveTo(-0.014, 0);
  forma.lineTo(0.014, 0);
  forma.lineTo(0.031, -0.078);
  forma.lineTo(0, -0.1);
  forma.lineTo(-0.031, -0.078);
  forma.closePath();
  const hojaGeo = new THREE.ExtrudeGeometry(forma, {
    depth: 0.007,
    bevelEnabled: true,
    bevelSize: 0.002,
    bevelThickness: 0.002,
    bevelSegments: 1,
  });
  hojaGeo.translate(0, 0, -0.0035);
  const texCorbata = texturaCorbata();
  texCorbata.repeat.set(16, 16);
  const corbata = new THREE.Group();
  corbata.position.copy(NUDO).addScaledVector(EJE_TORAX, -0.016).addScaledVector(VIENTRE, 0.008);
  delantero.add(corbata);
  const hoja = marcar(new THREE.Mesh(hojaGeo, new THREE.MeshStandardMaterial({ map: texCorbata, roughness: 0.5 })), {
    solido: 'corbata',
    parteMosca: true,
    revisaCuerpo: true,
  });
  corbata.add(hoja);

  // --- Cabeza: más chica que el cuerpo, casi toda ojos ---
  const cabeza = new THREE.Group();
  cabeza.position.copy(CABEZA_C);
  cabeza.rotation.order = 'YXZ';
  delantero.add(cabeza);

  const craneo = agregar(cabeza, new THREE.SphereGeometry(1, 36, 28), mats.cuticula, new THREE.Vector3(), {
    solido: 'cuerpo',
    parteMosca: true,
  });
  craneo.scale.copy(R_CABEZA);

  // Ojos compuestos: rojo, facetas y un brillo suave (sin pupila)
  const facetas = texturaOjoFacetas();
  const matOjo = new THREE.MeshPhysicalMaterial({
    map: facetas.mapa,
    bumpMap: facetas.bump,
    bumpScale: 1.2,
    roughness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const texGlint = texturaBrilloOjo();
  const R_OJO = 0.085;
  const ojos = [-1, 1].map((lado) => {
    const grupo = new THREE.Group();
    grupo.position.set(lado * 0.088, 0.012, 0.035);
    grupo.rotation.y = lado * 0.95;
    grupo.scale.set(0.72, 1.12, 0.95);
    cabeza.add(grupo);
    grupo.add(marcar(new THREE.Mesh(new THREE.SphereGeometry(R_OJO, 48, 32), matOjo), { solido: 'cuerpo', parteMosca: true }));
    const crearBrillo = (dir) => {
      const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlint, transparent: true, depthWrite: false }));
      b.position.copy(dir).normalize().multiplyScalar(R_OJO * 1.12);
      grupo.add(b);
      return b;
    };
    const brillo = [crearBrillo(new THREE.Vector3(-lado * 0.25, 0.5, 0.83)), crearBrillo(new THREE.Vector3(-lado * 0.05, 0.22, 0.97))];
    return { lado, grupo, brillo };
  });

  // Trompita (probóscide) con su labelo: en vez de boca
  const trompa = new THREE.Group();
  trompa.position.set(0, -0.088, 0.06);
  trompa.rotation.x = -0.45;
  cabeza.add(trompa);
  const troncoGeo = new THREE.CylinderGeometry(0.017, 0.014, 0.05, 14);
  troncoGeo.translate(0, -0.025, 0);
  trompa.add(marcar(new THREE.Mesh(troncoGeo, mats.trompa), {}));
  [-1, 1].forEach((lado) => {
    const lobulo = marcar(new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 10), mats.labelo), {});
    lobulo.position.set(lado * 0.011, -0.057, 0.002);
    lobulo.scale.set(0.9, 0.75, 1.15);
    trompa.add(lobulo);
  });
  const boca = new THREE.Object3D();
  boca.position.set(0, -0.068, 0.006);
  trompa.add(boca);

  // Antenas: segmento ovalado y arista plumosa (muestran el ánimo)
  const antenas = [-1, 1].map((lado) => {
    const antena = new THREE.Group();
    antena.position.set(lado * 0.026, 0.05, 0.096);
    antena.rotation.order = 'YXZ';
    antena.rotation.y = lado * 0.35;
    cabeza.add(antena);
    antena.add(marcar(new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 10), mats.articulacion), {}));
    const funiculo = marcar(new THREE.Mesh(new THREE.SphereGeometry(0.012, 14, 12), mats.articulacion), {});
    funiculo.scale.set(0.85, 1.3, 0.85);
    funiculo.position.set(0, -0.006, 0.014);
    antena.add(funiculo);
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(lado * 0.008, -0.002, 0.02),
      new THREE.Vector3(lado * 0.018, 0.02, 0.042),
      new THREE.Vector3(lado * 0.022, 0.045, 0.062),
    ]);
    antena.add(marcar(new THREE.Mesh(new THREE.TubeGeometry(curva, 14, 0.0024, 5), mats.cerda), {}));
    for (let i = 0; i < 5; i++) {
      const p = curva.getPoint(0.25 + i * 0.15);
      const rama = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 0.011, 3), mats.cerda);
      rama.position.copy(p);
      rama.rotation.set(0.9, 0, (i % 2 ? 1 : -1) * 0.9);
      antena.add(rama);
    }
    return { lado, antena };
  });

  // Ocelos (3 ojitos simples arriba) y cerdas cortas y oscuras
  const enCabezaSuperficie = (yaw, pitch, extra = 0) =>
    new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch) * (R_CABEZA.x + extra),
      Math.sin(pitch) * (R_CABEZA.y + extra),
      Math.cos(yaw) * Math.cos(pitch) * (R_CABEZA.z + extra)
    );
  const matOcelo = new THREE.MeshStandardMaterial({ color: '#7a1d14', roughness: 0.3 });
  [
    [0, 1.42],
    [-0.5, 1.32],
    [0.5, 1.32],
  ].forEach(([yaw, pitch]) =>
    agregar(cabeza, new THREE.SphereGeometry(0.008, 10, 8), matOcelo, enCabezaSuperficie(yaw, pitch, -0.002))
  );
  const geoCerda = new THREE.ConeGeometry(0.0028, 0.02, 5);
  geoCerda.translate(0, 0.01, 0);
  const atras = new THREE.Vector3(0, 0.2, -1);
  [-1, 1].forEach((lado) => {
    [
      [0.35, 0.95],
      [0.7, 0.85],
      [0.3, 1.25],
      [1.1, 0.45],
    ].forEach(([yaw, pitch]) => {
      const pos = enCabezaSuperficie(lado * yaw, pitch);
      const cerda = agregar(cabeza, geoCerda, mats.cerda, pos);
      const dir = pos.clone().normalize().addScaledVector(atras, 1.6).normalize();
      cerda.quaternion.setFromUnitVectors(EJE_Y, dir);
    });
  });

  // Gotas de sudor (forma de lágrima), pequeñas
  const perfilGota = [
    [0, -1],
    [0.55, -0.82],
    [0.78, -0.45],
    [0.68, -0.02],
    [0.42, 0.42],
    [0.18, 0.78],
    [0, 1],
  ].map(([x, y]) => new THREE.Vector2(x * 0.015, y * 0.02));
  const gotaGeo = new THREE.LatheGeometry(perfilGota, 14);
  const gotas = [
    { lado: -1, fase: 0 },
    { lado: -1, fase: 0.5 },
    { lado: 1, fase: 0.25 },
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

  // --- Alas con venas, plegadas sobre el abdomen (bien visibles) ---
  const geoAla = crearGeometriaAla(0.52);
  const matAla = new THREE.MeshPhysicalMaterial({
    map: texturaAla(),
    transparent: true,
    roughness: 0.15,
    iridescence: 1,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [150, 450],
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const raizAla = TORAX_C.clone().addScaledVector(VIENTRE, -0.13).addScaledVector(EJE_TORAX, -0.05);
  const alas = [-1, 1].map((lado) => {
    const pivote = new THREE.Group();
    pivote.position.copy(raizAla).add(new THREE.Vector3(lado * 0.045, 0, 0));
    const haciaAtras = new THREE.Vector3(lado * 0.3, -0.22, -1).normalize();
    const afuera = new THREE.Vector3(lado, -0.35, 0);
    afuera.addScaledVector(haciaAtras, -afuera.dot(haciaAtras)).normalize();
    const normal = new THREE.Vector3().crossVectors(haciaAtras, afuera);
    pivote.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(haciaAtras, afuera, normal));
    const base = pivote.quaternion.clone();
    const ala = new THREE.Mesh(geoAla, matAla);
    ala.renderOrder = 2;
    // El ala nace dentro del tórax; se revisa que no toque el abdomen
    ala.userData = { parteMosca: true, revisaCuerpo: true, ignorar: torax };
    pivote.add(ala);
    delantero.add(pivote);
    return { lado, pivote, base };
  });

  // --- Patas: 6, finas, con articulaciones y pelitos ---
  const patasDelanteras = [-1, 1].map(() =>
    crearPata(cuerpo, mats, {
      largos: [0.21, 0.21, 0.1],
      radios: [0.015, 0.012, 0.0085],
      manga: mats.camisaDoble,
      revisaCuerpo: true,
    })
  );
  const patasMedias = [-1, 1].map(() =>
    crearPata(cuerpo, mats, { largos: [0.2, 0.21, 0.08], radios: [0.014, 0.011, 0.008] })
  );
  const patasTraseras = [-1, 1].map(() =>
    crearPata(cuerpo, mats, { largos: [0.22, 0.24, 0.08], radios: [0.014, 0.011, 0.008] })
  );
  // Caderas, en el espacio del "delantero"
  const CADERA_DEL = (lado) => new THREE.Vector3(lado * 0.06, 0.17, 0.25);
  const CADERA_MED = (lado) => new THREE.Vector3(lado * 0.08, 0.044, 0.165);
  const CADERA_TRA = (lado) => new THREE.Vector3(lado * 0.07, 0.0, 0.105);

  // Apoyos fijos sobre el asiento (en el espacio de la mosca)
  const radioAlmohadilla = 0.008 * 1.5;
  const apoyoMedio = (lado) => new THREE.Vector3(lado * 0.18, radioAlmohadilla, -0.01);
  const apoyoTrasero = (lado) => new THREE.Vector3(lado * 0.18, radioAlmohadilla, -0.17);

  // --- Cigarro (en la pata delantera derecha: el lado que ve la cámara) ---
  const LARGO_FILTRO = 0.028;
  const LARGO_PAPEL = 0.078;
  const RADIO_CIG = 0.0105;
  const cigarro = new THREE.Group();
  cigarro.visible = false;
  cuerpo.add(cigarro);
  const datosCig = { parteMosca: true, revisaCuerpo: true };
  const filtro = marcar(
    new THREE.Mesh(
      new THREE.CylinderGeometry(RADIO_CIG, RADIO_CIG, LARGO_FILTRO, 14),
      new THREE.MeshStandardMaterial({ color: '#d9a35f', roughness: 0.85 })
    ),
    datosCig
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
    sprite.userData = { edad: 0, vida: 1, vel: new THREE.Vector3(), t0: 0.02, t1: 0.2, opMax: 0.3, giro: 0, semilla: 0 };
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
  const giroCabeza = { yaw: 0, pitch: 0 };

  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const objetivoMirada = new THREE.Vector3();
  const puntoBoca = new THREE.Vector3();
  const adelanteCabeza = new THREE.Vector3();
  const derechaCabeza = new THREE.Vector3();
  const manoObjetivo = new THREE.Vector3();
  const ejeCig = new THREE.Vector3();
  const posBrasa = new THREE.Vector3();
  const dirTarso = new THREE.Vector3();
  const polo = new THREE.Vector3();
  const mundoBoca = new THREE.Vector3();
  const adelanteMundo = new THREE.Vector3();
  const qCabeza = new THREE.Quaternion();
  const qDelantero = new THREE.Quaternion();

  const DIR_TARSO_TECLA = new THREE.Vector3(0, -0.62, 0.78).normalize();
  const MANO_REPOSO = new THREE.Vector3(-0.21, 0.56, 0.44);
  const EJE_REPOSO = new THREE.Vector3(-0.3, 0.85, 0.42).normalize();
  const AGARRE = 0.035; // dónde sujeta el cigarro, medido desde el filtro

  function puntoTeclado(lado, levantar, lateral) {
    const altoTecla = ALTO_ESCRITORIO + 0.049;
    return tmp
      .copy(TECLADO.pos)
      .addScaledVector(IZQ_MOSCA, lado * 0.1 + lateral)
      .addScaledVector(DIR_MOSCA, -0.04)
      .setY(altoTecla + radioAlmohadilla * S + levantar);
  }

  // De "delantero" a "cuerpo" (para las caderas)
  const enCuerpo = (v) => v.applyMatrix4(delantero.matrix);

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

    const PERIODO = 2.6;
    let ciclo = 0;
    if (fumando && tFumar > 0.5) {
      const p = (tFumar - 0.5) % PERIODO;
      ciclo = suave(0, 0.65, p) * (1 - suave(1.35, 2.0, p));
    }
    pesoBocaAntes = pesoBoca;
    pesoBoca = amortiguar(pesoBoca, ciclo * suave(0.6, 0.95, mezclaFumar), 12, dt);
    if (pesoBocaAntes > 0.9 && pesoBoca <= 0.9) exhalando = 0.6;
    exhalando = Math.max(0, exhalando - dt);

    // --- Postura: el ánimo se ve en el cuerpo ---
    // Tranquila: erguida. Estresada: encorvada hacia la pantalla. Fumando:
    // echada hacia atrás y girada un poco en la silla.
    raiz.rotation.y = MOSCA.rumbo - mezclaFumar * 0.16;
    delantero.rotation.x = lerp(-0.03, 0.11, s) * (1 - mezclaFumar) - mezclaFumar * 0.07;
    const temblor = suave(0.8, 1, s);
    cuerpo.position.x = Math.sin(t * 21) * 0.001 * temblor;
    torax.scale.x = R_TORAX.lado * (1 + Math.sin(t * 1.7) * 0.008);
    delantero.updateMatrix();

    // La corbata cuelga siempre derecha, con un vaivén suave
    corbata.rotation.x = -delantero.rotation.x + Math.sin(t * 1.3) * 0.03;
    corbata.rotation.z = Math.sin(t * 0.9) * 0.025;

    // --- Cabeza: mira la pantalla ---
    raiz.updateMatrixWorld(true);
    objetivoMirada.copy(CENTRO_PANTALLA).lerp(CAMARA_INICIAL.posicion, mezclaFumar * 0.15);
    tmp.copy(objetivoMirada);
    delantero.worldToLocal(tmp).sub(cabeza.position);
    const yaw = clamp(Math.atan2(tmp.x, tmp.z), -0.75, 0.75);
    const pitch = clamp(Math.atan2(-tmp.y, Math.hypot(tmp.x, tmp.z)), -0.35, 0.35);
    giroCabeza.yaw = amortiguar(giroCabeza.yaw, yaw, 3, dt);
    giroCabeza.pitch = amortiguar(giroCabeza.pitch, pitch + s * 0.1, 3, dt);
    cabeza.rotation.y = giroCabeza.yaw;
    cabeza.rotation.x = giroCabeza.pitch + Math.sin(t * 2.1) * 0.012 * (1 - s);
    cabeza.updateMatrixWorld(true);

    // --- Antenas: paradas cuando está tranquila, caídas con estrés ---
    antenas.forEach(({ lado, antena }) => {
      const tic = Math.sin(t * 3.1 + lado * 1.7) * 0.05 * (1 - s) + Math.sin(t * 0.7 + lado) * 0.03;
      antena.rotation.x = lerp(-0.25, 0.75, s) + tic;
      antena.rotation.z = lado * lerp(0.0, 0.35, s);
    });

    // --- Ojos: brillan cuando está tranquila; con estrés el brillo se apaga ---
    ojos.forEach(({ brillo }) => {
      brillo[0].material.opacity = lerp(0.95, 0.2, s);
      brillo[0].scale.setScalar(lerp(0.042, 0.026, s));
      brillo[1].material.opacity = lerp(0.8, 0.0, s);
      brillo[1].scale.setScalar(0.018);
    });
    // Con estrés el ojo pierde brillo: más opaco y un poco más oscuro
    matOjo.clearcoatRoughness = lerp(0.05, 0.5, s);
    matOjo.color.setScalar(lerp(1, 0.74, s));

    // --- Alas: casi quietas; un zumbido leve con mucho estrés ---
    faseAlas += dt * (14 + 16 * s);
    const zumbido = Math.sin(faseAlas) * 0.03 * suave(0.55, 1, s);
    alas.forEach(({ lado, pivote, base }) => {
      const e = new THREE.Euler(lado * (Math.sin(t * 1.3) * 0.015 + zumbido), 0, 0);
      pivote.quaternion.copy(base).multiply(new THREE.Quaternion().setFromEuler(e));
    });

    // --- Patas de apoyo (sobre el asiento) ---
    cuerpo.updateMatrix();
    const invCuerpo = cuerpo.matrix.clone().invert();
    patasMedias.forEach((pata, i) => {
      const lado = i === 0 ? -1 : 1;
      dirTarso.set(lado * 0.4, -0.88, 0.2).normalize();
      pata.poner(
        enCuerpo(CADERA_MED(lado)),
        apoyoMedio(lado).applyMatrix4(invCuerpo),
        dirTarso,
        polo.set(lado, 0.9, 0.15).normalize()
      );
    });
    patasTraseras.forEach((pata, i) => {
      const lado = i === 0 ? -1 : 1;
      dirTarso.set(lado * 0.35, -0.85, -0.35).normalize();
      pata.poner(
        enCuerpo(CADERA_TRA(lado)),
        apoyoTrasero(lado).applyMatrix4(invCuerpo),
        dirTarso,
        polo.set(lado, 0.8, -0.35).normalize()
      );
    });

    // --- Patas delanteras: tipean; la derecha además fuma ---
    faseTipeo += dt * (7 + 7 * s) * (1 - mezclaFumar * 0.8);
    const desdeMundo = (v) => cuerpo.worldToLocal(v);
    [0, 1].forEach((i) => {
      const lado = i === 0 ? -1 : 1;
      const onda = 0.5 + 0.5 * Math.sin(faseTipeo + i * Math.PI);
      const quieta = i === 1 ? mezclaFumar : 0;
      const levantar = onda * onda * 0.03 * (1 - quieta);
      const lateral = Math.sin(faseTipeo * 0.31 + i * 2) * 0.022 * (1 - quieta);
      const enTecla = desdeMundo(puntoTeclado(lado, levantar, lateral)).clone();
      const cadera = enCuerpo(CADERA_DEL(lado));
      const poloTecleo = new THREE.Vector3(lado * 0.7, 1, -0.25).normalize();

      if (i === 0 && mezclaFumar > 0.001) {
        boca.getWorldPosition(mundoBoca);
        puntoBoca.copy(mundoBoca);
        desdeMundo(puntoBoca);
        qDelantero.setFromEuler(delantero.rotation);
        adelanteCabeza.set(0, 0, 1).applyQuaternion(cabeza.quaternion).applyQuaternion(qDelantero);
        derechaCabeza.set(-1, 0, 0).applyQuaternion(cabeza.quaternion).applyQuaternion(qDelantero);
        const ejeBoca = tmp2
          .copy(adelanteCabeza)
          .multiplyScalar(0.7)
          .addScaledVector(derechaCabeza, 0.6)
          .add(new THREE.Vector3(0, -0.15, 0))
          .normalize()
          .clone();
        const filtroBoca = puntoBoca.clone().addScaledVector(ejeBoca, 0.006);
        const manoBoca = filtroBoca.clone().addScaledVector(ejeBoca, AGARRE);

        manoObjetivo.copy(MANO_REPOSO).lerp(manoBoca, pesoBoca);
        ejeCig.copy(EJE_REPOSO).lerp(ejeBoca, pesoBoca).normalize();

        // En el camino teclado <-> cigarro la pata sube en arco y la
        // rodilla cambia de lado recién al final: nunca roza el escritorio.
        const objetivo = enTecla.clone().lerp(manoObjetivo, mezclaFumar);
        objetivo.y += Math.sin(Math.PI * mezclaFumar) * 0.1;
        const mezclaRodilla = suave(0.55, 1, mezclaFumar);
        const dirSujetar = manoObjetivo.clone().sub(cadera).normalize();
        dirTarso.copy(DIR_TARSO_TECLA).lerp(dirSujetar, mezclaFumar).normalize();
        const poloFumar = new THREE.Vector3(lado * 0.9, 0.6, -0.25).normalize();
        polo.copy(poloTecleo).lerp(poloFumar, mezclaRodilla).normalize();
        patasDelanteras[i].poner(cadera, objetivo, dirTarso, polo);

        const aparecer = suave(0.55, 0.92, mezclaFumar);
        cigarro.visible = aparecer > 0.01;
        cigarro.position.copy(patasDelanteras[i].punta).addScaledVector(ejeCig, -AGARRE * aparecer);
        cigarro.quaternion.setFromUnitVectors(EJE_Y, ejeCig);
        cigarro.scale.setScalar(Math.max(aparecer, 0.001));
      } else {
        patasDelanteras[i].poner(cadera, enTecla, DIR_TARSO_TECLA, poloTecleo);
        if (i === 0) cigarro.visible = false;
      }
    });

    // Largo del cigarro, ceniza y brasa
    const largoPapel = LARGO_PAPEL * (1 - quemado);
    papel.scale.y = largoPapel;
    const largoCeniza = 0.004 + quemado * 0.026;
    ceniza.position.y = LARGO_FILTRO + largoPapel;
    ceniza.scale.y = largoCeniza;
    brasa.position.y = LARGO_FILTRO + largoPapel + largoCeniza;
    resplandor.position.y = brasa.position.y + 0.004;
    const chupada = pesoBoca * (0.75 + 0.25 * Math.sin(t * 9));
    matBrasa.emissiveIntensity = 1.6 + chupada * 3.5;
    resplandor.scale.setScalar(0.045 + chupada * 0.03);
    resplandor.material.opacity = 0.75 + chupada * 0.25;
    brasa.getWorldPosition(posBrasa);
    tmp.copy(posBrasa);
    luzBrasa.position.copy(cuerpo.worldToLocal(tmp));
    luzBrasa.intensity = cigarro.visible ? (0.08 + chupada * 0.14) * cigarro.scale.x : 0;

    // --- Humo ---
    if (cigarro.visible && cigarro.scale.x > 0.6) {
      // Cerca de la cara echa menos humo, para no taparle los ojos
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
      // Exhala hacia el costado (lado de la cámara) para no taparse la cara
      cabeza.getWorldQuaternion(qCabeza);
      adelanteMundo.set(-0.75, 0.2, 0.55).applyQuaternion(qCabeza).normalize();
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
      g.m.position.copy(enCabezaSuperficie(g.lado * 1.65, lerp(0.75, 0.0, ciclo), 0.01));
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
