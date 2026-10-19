// Panel del cerebro: nube de neuronas reales (MaleCNS v1.0) que gira lento y
// se enciende con la ACTIVIDAD SIMULADA del cableado real (Etapa 3.3,
// opción A: el cerebro muestra, el juego decide).
//
// La actividad de cada neurona viene precalculada (scripts/datos/
// preparar_cerebro_real.py): para cada cantidad de tareas abiertas (0 a 10),
// la antena izquierda recibe 20 + (n − 1) × 200/9 Hz y el modelo de Shiu et
// al. 2024 (peso 0,090 mV) dice cuánto dispara cada neurona; en el café se
// suma el azúcar. El juego sólo lee esos archivos: nada pesado en vivo. Las
// reglas del juego (brain.js) no usan esta actividad.
import * as THREE from 'three';

// Un color neón por zona, como en las imágenes de referencia.
export const GRUPOS_VISUALES = {
  vision: { color: '#2fe3ff' },
  central: { color: '#8b5cff' },
  memoria: { color: '#ffd84d' },
  mando: { color: '#ff4fd8' },
  movimiento: { color: '#ff7f66' },
};

const FONDO = '#060a16';
const TAMANO_PUNTO_UM = 6.5; // tamaño de cada punto, en micrómetros del cerebro
const VUELTA_SEGUNDOS = 40; // una vuelta completa cada 40 s
const INCLINACION = 0.32; // inclinado hacia la cámara para que se vea en 3D
const SEGUNDOS_TRANSICION = 1.2; // paso suave de una situación a otra

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const amortiguar = (actual, objetivo, rapidez, dt) => lerp(actual, objetivo, 1 - Math.exp(-rapidez * dt));

// Los 25.000 puntos de siempre (también los usa la portada holograma del PDF)
export async function cargarDatosCerebro() {
  const base = import.meta.env.BASE_URL;
  const [info, binario] = await Promise.all([
    fetch(`${base}cerebro/malecns-info.json`).then((r) => r.json()),
    fetch(`${base}cerebro/malecns-puntos.bin`).then((r) => r.arrayBuffer()),
  ]);
  const n = info.puntos;
  const enteros = new Int16Array(binario, 0, n * 3);
  const posiciones = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) posiciones[i] = enteros[i] / info.escala;
  const grupos = new Uint8Array(binario, n * 6, n);
  const tonos = new Uint8Array(binario, n * 7, n);
  return { info, posiciones, grupos, tonos };
}

// La actividad simulada: suma los puntos extra (el circuito y todas las
// neuronas que se encienden en alguna situación) y el brillo de cada punto en
// cada situación.
export async function cargarActividadReal(datos) {
  const base = import.meta.env.BASE_URL;
  const [meta, extra, act] = await Promise.all([
    fetch(`${base}cerebro/actividad-real.json`).then((r) => r.json()),
    fetch(`${base}cerebro/puntos-extra.bin`).then((r) => r.arrayBuffer()),
    fetch(`${base}cerebro/actividad-real.bin`).then((r) => r.arrayBuffer()),
  ]);
  const nBase = datos.info.puntos;
  const nExtra = meta.puntos_extra;
  const n = nBase + nExtra;
  const posiciones = new Float32Array(n * 3);
  posiciones.set(datos.posiciones);
  const enteros = new Int16Array(extra, 0, nExtra * 3);
  for (let i = 0; i < nExtra * 3; i++) posiciones[nBase * 3 + i] = enteros[i] / datos.info.escala;
  const grupos = new Uint8Array(n);
  grupos.set(datos.grupos);
  grupos.set(new Uint8Array(extra, nExtra * 6, nExtra), nBase);
  const tonos = new Uint8Array(n);
  tonos.set(datos.tonos);
  tonos.set(new Uint8Array(extra, nExtra * 7, nExtra), nBase);
  const k = meta.puntos_con_actividad;
  return {
    meta,
    n,
    posiciones,
    grupos,
    tonos,
    roles: new Uint8Array(act, 0, n),
    indices: new Uint32Array(act.slice(n, n + k * 4)), // copia alineada
    brillo: new Uint8Array(act, n + k * 4, meta.condiciones.length * k),
  };
}

const VERTICE = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSemilla;
  attribute float aRol;
  attribute float aActA;
  attribute float aActB;
  uniform float uTiempo;
  uniform float uMezcla;
  uniform float uCafe;
  uniform float uTamano;
  uniform float uEscalaVista;
  varying vec3 vColor;
  varying float vAct;
  varying float vEncendido;
  varying float vAnillo;

  float azar(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Actividad simulada de ESTA neurona (0 a 1 = log de sus disparos por
    // segundo), con un paso suave cuando cambia la situación.
    float act = mix(aActA, aActB, uMezcla);
    // Cada neurona late a su ritmo y en cada latido destella con una
    // probabilidad que sigue a su actividad: si no dispara, nunca destella.
    float ritmo = 0.55 + aSemilla * 1.1 + 1.6 * act;
    float t = uTiempo * ritmo + aSemilla * 17.0;
    float latido = floor(t);
    float fase = t - latido;
    float dispara = step(azar(vec2(aSemilla * 97.0, latido)), act * 0.9) * step(0.001, act);
    float envolvente = smoothstep(0.0, 0.16, fase) * (1.0 - smoothstep(0.24, 0.8, fase));
    vEncendido = dispara * envolvente;
    vAct = act;
    vColor = aColor;

    // Circuito destacado con un anillo: la limpieza de antenas siempre
    // (sensores de la antena, aBN1, aBN2, aDN1, aDN2); el azúcar sólo en el café.
    float anillo = 0.0;
    float agranda = 1.0;
    if (aRol > 0.5 && aRol < 1.5) { anillo = 0.15; agranda = 0.9; }
    else if (aRol > 1.5 && aRol < 5.5) { anillo = 1.0; agranda = 3.4; }
    else if (aRol > 5.5 && aRol < 6.5) { anillo = 0.15 * uCafe; agranda = 1.0 - 0.1 * uCafe; }
    else if (aRol > 6.5) { anillo = uCafe; agranda = 1.0 + 2.4 * uCafe; }
    vAnillo = anillo;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tamano = uTamano * (0.6 + 0.9 * act + 1.2 * vEncendido) * agranda;
    gl_PointSize = max(1.2, tamano * uEscalaVista / -mv.z);
  }
`;

const FRAGMENTO = /* glsl */ `
  uniform float uGanancia;
  varying vec3 vColor;
  varying float vAct;
  varying float vEncendido;
  varying float vAnillo;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float nucleo = smoothstep(0.5, 0.0, d);
    // El halo (glow) crece con la actividad y con cada destello
    float halo = exp(-d * d * mix(6.0, 2.0, max(vAct, vEncendido)));
    // Sin actividad: gris tenue, sólo para ver la forma del cerebro (el color
    // aparece únicamente cuando la neurona dispara). Con actividad: su color,
    // brillante y con glow.
    float base = mix(0.2, 0.42, smoothstep(0.0, 0.85, vAct));
    float brillo = base + 0.85 * vEncendido;
    vec3 tinta = mix(vec3(0.42, 0.47, 0.62), vColor, smoothstep(0.0, 0.25, vAct));
    vec3 color = tinta * (nucleo + halo * (0.12 + 0.55 * vEncendido + 0.35 * vAct)) * brillo;
    color += vec3(1.0) * nucleo * vEncendido * 0.05;
    // Anillo claro del circuito: tenue si está apagado, más fuerte si dispara
    float anillo = smoothstep(0.6, 0.72, d) * (1.0 - smoothstep(0.84, 1.0, d));
    color += vec3(0.86, 0.9, 1.0) * anillo * vAnillo * (0.35 + 0.65 * vAct);
    gl_FragColor = vec4(color * uGanancia, 1.0);
  }
`;

function texturaResplandor() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(46,58,120,0.55)');
  g.addColorStop(0.45, 'rgba(26,32,78,0.25)');
  g.addColorStop(1, 'rgba(6,10,22,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function crearCerebro(canvas, datos, real) {
  const { info } = datos;
  const { meta, n, posiciones, grupos, tonos, roles, indices, brillo } = real;
  const ids = info.grupos.map((g) => g.id);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'default' });
  renderer.setClearColor(FONDO, 1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FONDO);
  const camera = new THREE.PerspectiveCamera(26, 1, 10, 8000);

  // Resplandor azul suave detrás del cerebro
  const resplandor = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texturaResplandor(), depthWrite: false, depthTest: false })
  );
  resplandor.position.z = -500;
  resplandor.renderOrder = -1;
  scene.add(resplandor);

  // Colores: el de la zona, con un matiz distinto por tipo de neurona
  const colores = new Float32Array(n * 3);
  const semillas = new Float32Array(n);
  const hsl = {};
  const base = ids.map((id) => new THREE.Color(GRUPOS_VISUALES[id].color));
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    base[grupos[i]].getHSL(hsl);
    const tono = tonos[i] / 255 - 0.5;
    c.setHSL((hsl.h + tono * 0.07 + 1) % 1, clamp(hsl.s - Math.abs(tono) * 0.1, 0, 1), clamp(hsl.l + tono * 0.12, 0.35, 0.75));
    // Los colores van tal cual a la pantalla (sin conversión), así que uso sRGB
    colores[i * 3] = Math.pow(c.r, 1 / 2.2);
    colores[i * 3 + 1] = Math.pow(c.g, 1 / 2.2);
    colores[i * 3 + 2] = Math.pow(c.b, 1 / 2.2);
    semillas[i] = Math.random();
  }

  const uniforms = {
    uTiempo: { value: 0 },
    uMezcla: { value: 1 },
    uCafe: { value: 0 },
    uTamano: { value: TAMANO_PUNTO_UM },
    uEscalaVista: { value: 500 },
    uGanancia: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTICE,
    fragmentShader: FRAGMENTO,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const rolF = new Float32Array(n);
  for (let i = 0; i < n; i++) rolF[i] = roles[i];
  const actA = new THREE.BufferAttribute(new Float32Array(n), 1);
  const actB = new THREE.BufferAttribute(new Float32Array(n), 1);
  actA.setUsage(THREE.DynamicDrawUsage);
  actB.setUsage(THREE.DynamicDrawUsage);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colores, 3));
  geo.setAttribute('aSemilla', new THREE.BufferAttribute(semillas, 1));
  geo.setAttribute('aRol', new THREE.BufferAttribute(rolF, 1));
  geo.setAttribute('aActA', actA);
  geo.setAttribute('aActB', actB);
  const nube = new THREE.Points(geo, material);
  nube.frustumCulled = false;

  // ---------- Disposición: cerebro arriba y cordón nervioso colgando ----------
  // Ambos giran juntos alrededor de un eje vertical que pasa por el centro de
  // los 25.000 puntos de siempre (así el encuadre no cambia).
  let tx = 0;
  let tz = 0;
  for (let i = 0; i < info.puntos; i++) {
    tx += posiciones[i * 3];
    tz += posiciones[i * 3 + 2];
  }
  const [anchoTotal, altoTotal, fondoTotal] = info.tamano_um;
  const inclinado = new THREE.Group();
  inclinado.rotation.x = INCLINACION;
  const giratorio = new THREE.Group();
  inclinado.add(giratorio);
  scene.add(inclinado);
  nube.position.set(-tx / info.puntos, 0, -tz / info.puntos);
  giratorio.add(nube);
  const radioGiro = Math.hypot(anchoTotal, fondoTotal) / 2;
  const encuadre = {
    mitadAncho: radioGiro,
    mitadAlto: (altoTotal * Math.cos(INCLINACION) + fondoTotal * Math.sin(INCLINACION)) / 2,
    cercania: radioGiro,
  };
  resplandor.scale.set(1500, 1500, 1);

  let tamano = { w: 0, h: 0 };
  function redimensionar() {
    const w = Math.max(1, Math.round(canvas.clientWidth));
    const h = Math.max(1, Math.round(canvas.clientHeight));
    if (w === tamano.w && h === tamano.h) return;
    tamano = { w, h };
    // Nunca por debajo de la resolución de la pantalla (nítido también con zoom del navegador)
    const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tanMedio = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const porAlto = encuadre.mitadAlto / tanMedio;
    const porAncho = encuadre.mitadAncho / (tanMedio * camera.aspect);
    camera.position.set(0, 0, Math.max(porAlto, porAncho) * 1.06 + encuadre.cercania);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    uniforms.uEscalaVista.value = (h * ratio) / (2 * tanMedio);
    // En el panel chico los puntos quedan muy juntos y se suman: bajo la
    // intensidad para que no se quemen a blanco
    uniforms.uGanancia.value = clamp((w * h) / 520000, 0.45, 0.9);
  }

  // ---------- Actividad simulada (precalculada) ----------
  const nombres = meta.condiciones;
  const k = indices.length;
  const maxActivas = Math.max(...nombres.map((s) => meta.situaciones[s].activas));
  let actual = 0; // situación que se muestra (índice en meta.condiciones)
  let previa = 0;
  let mezcla = 1;
  let saltar = true; // día nuevo: la actividad parte en su valor, sin arrastrar
  let cafeSuave = 0;

  function situacionPara({ enCurso, cafe, apagado }) {
    if (apagado) return 0; // en pausa o día terminado: sin estímulo
    const tareas = clamp(Math.round(enCurso), 0, 10);
    return cafe ? 11 + tareas : tareas;
  }

  function ir(s, inmediato) {
    const A = actA.array;
    const B = actB.array;
    // Lo que se ve ahora pasa a ser el punto de partida (sólo cambian los
    // puntos que alguna vez disparan; el resto está siempre en 0).
    if (!inmediato) for (let j = 0; j < k; j++) A[indices[j]] = lerp(A[indices[j]], B[indices[j]], mezcla);
    const desde = s * k;
    for (let j = 0; j < k; j++) B[indices[j]] = brillo[desde + j] / 255;
    if (inmediato) {
      A.set(B);
      mezcla = 1;
    } else {
      mezcla = 0;
    }
    actA.needsUpdate = true;
    actB.needsUpdate = true;
    previa = inmediato ? s : actual;
    actual = s;
  }

  let tiempo = 0;
  function actualizar(dt, estadoJuego) {
    tiempo += dt;
    const s = situacionPara(estadoJuego);
    if (saltar) ir(s, true);
    else if (s !== actual) ir(s, false);
    saltar = false;
    mezcla = Math.min(1, mezcla + dt / SEGUNDOS_TRANSICION);
    uniforms.uMezcla.value = mezcla * mezcla * (3 - 2 * mezcla);
    cafeSuave = amortiguar(cafeSuave, s >= 11 ? 1 : 0, 3, dt);
    uniforms.uCafe.value = cafeSuave;
    uniforms.uTiempo.value = tiempo;
    // El resplandor azul de fondo sigue a cuántas neuronas disparan
    const activas = lerp(meta.situaciones[nombres[previa]].activas, meta.situaciones[nombres[actual]].activas, uniforms.uMezcla.value);
    resplandor.material.opacity = 0.2 + 0.7 * (activas / maxActivas);
    resplandor.material.transparent = true;
    giratorio.rotation.y = (tiempo / VUELTA_SEGUNDOS) * Math.PI * 2;
  }

  function renderizar() {
    redimensionar();
    renderer.render(scene, camera);
  }

  // Contadores sobre TODA la red simulada (164.587 neuronas), no sólo los puntos
  function lectura() {
    const s0 = meta.situaciones[nombres[previa]];
    const s1 = meta.situaciones[nombres[actual]];
    const t = uniforms.uMezcla.value;
    const activas = Math.round(lerp(s0.activas, s1.activas, t));
    const porGrupo = info.grupos.map((g) => {
      const a = lerp(s0.zonas[g.id].activas, s1.zonas[g.id].activas, t);
      const total = s1.zonas[g.id].total;
      return { id: g.id, nombre: g.nombre, detalle: g.detalle, activas: Math.round(a), total, actividad: a / total };
    });
    return {
      activas,
      total: meta.neuronas_simuladas,
      nivel: activas / meta.neuronas_simuladas,
      intensidad: activas / maxActivas,
      porGrupo,
      situacion: nombres[actual],
      cafe: actual >= 11,
      tareas: actual % 11,
      datos: s1,
    };
  }

  function reiniciar() {
    saltar = true;
  }

  return { actualizar, renderizar, lectura, info, meta, reiniciar };
}
