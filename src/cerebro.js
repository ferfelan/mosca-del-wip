// Panel del cerebro: nube de neuronas reales (MaleCNS v1.0) con la ACTIVIDAD
// SIMULADA del cableado real (Etapa 3.3, opción A: el cerebro muestra, el
// juego decide).
//
// La actividad de cada neurona viene precalculada (scripts/datos/
// preparar_cerebro_real.py): para cada cantidad de tareas abiertas (0 a 10),
// la antena izquierda recibe 20 + (n − 1) × 200/9 Hz y el modelo de Shiu et
// al. 2024 (peso 0,090 mV) dice cuánto dispara cada neurona; en el café se
// suma el azúcar. El juego sólo lee esos archivos: nada pesado en vivo. Las
// reglas del juego (brain.js) no usan esta actividad.
//
// Cómo se ve: gris = neurona en reposo (su posición es real); color de su
// zona = neurona que dispara, más grande y brillante mientras más Hz, con un
// pulso más rápido mientras más dispara; anillo = circuito de limpieza; líneas
// = recorrido real de la señal (conexiones de MaleCNS) con un pulso que viaja
// (su velocidad es sólo para que se vea). Los nombres sólo en la tarjetita.
//
// Métrica principal: "Limpieza de antenas" = qué tan encendidas están aDN1 y
// aDN2 (promedio de sus Hz) comparado con su máximo en el juego (10 tareas
// abiertas = 100 %).
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
const SEGUNDOS_POR_TRAMO = 0.75; // el pulso del recorrido avanza un tramo cada 0,75 s
const GIRO_CON_CURSOR = 0.25; // con el cursor encima gira 4 veces más lento (para apuntar)
const MARGEN_ENCUADRE = 1.05; // un 5 % de aire alrededor del cerebro y su cordón
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 3.5;
const HZ_MINIMO = 1; // un tramo del recorrido se enciende si sus dos neuronas pasan de 1 Hz

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
// neuronas que se encienden en alguna situación), el brillo y los Hz de cada
// punto en cada situación, las fichas y el recorrido real de la señal.
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
  const c = meta.condiciones.length;
  const inicioHz = n + k * 4 + c * k;
  return {
    meta,
    n,
    posiciones,
    grupos,
    tonos,
    roles: new Uint8Array(act, 0, n),
    indices: new Uint32Array(act.slice(n, n + k * 4)), // copias alineadas
    brillo: new Uint8Array(act, n + k * 4, c * k),
    hz10: new Uint16Array(act.slice(inicioHz, inicioHz + c * k * 2)),
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
  varying float vPulso;
  varying float vAnillo;

  void main() {
    // Actividad simulada de ESTA neurona (0 a 1 = log de sus disparos por
    // segundo), con un paso suave cuando cambia la situación.
    float act = mix(aActA, aActB, uMezcla);
    float dispara = step(0.001, act);
    // Pulso suave, más rápido mientras más dispara (sólo las que disparan)
    float frecuencia = 0.35 + 2.2 * act;
    float pulso = 0.5 + 0.5 * sin(6.2831853 * (uTiempo * frecuencia + aSemilla));
    vPulso = pulso * dispara;
    vAct = act;
    vColor = aColor;

    // Circuito destacado con un anillo: la limpieza de antenas siempre
    // (sensores de la antena suave; aBN1, aBN2, aDN1 y aDN2 fuerte); el azúcar
    // sólo en el café.
    float anillo = 0.0;
    float agranda = 1.0;
    if (aRol > 0.5 && aRol < 1.5) { anillo = 0.25; agranda = 0.9; }
    else if (aRol > 1.5 && aRol < 5.5) { anillo = 1.0; agranda = 3.0; }
    else if (aRol > 5.5 && aRol < 6.5) { anillo = 0.25 * uCafe; agranda = 1.0; }
    else if (aRol > 6.5) { anillo = uCafe; agranda = 1.0 + 2.0 * uCafe; }
    vAnillo = anillo;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // En reposo: chico y fijo. Disparando: más grande mientras más Hz, y late.
    float tamano = uTamano * mix(0.85, (1.1 + 1.9 * act) * (0.88 + 0.24 * pulso), dispara) * agranda;
    gl_PointSize = max(1.4, tamano * uEscalaVista / -mv.z);
  }
`;

const FRAGMENTO = /* glsl */ `
  uniform float uGanancia;
  varying vec3 vColor;
  varying float vAct;
  varying float vPulso;
  varying float vAnillo;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float nucleo = smoothstep(0.55, 0.0, d);
    vec3 color;
    if (vAct < 0.001) {
      // En reposo: gris tenue, sin color (su posición es real)
      color = vec3(0.5, 0.54, 0.66) * nucleo * 0.27;
    } else {
      // Disparando: el color de su zona, más brillo y más halo con más Hz
      float halo = exp(-d * d * mix(5.0, 1.6, vAct));
      float brillo = (0.45 + 0.6 * vAct) * (0.78 + 0.32 * vPulso);
      color = vColor * (nucleo + halo * (0.35 + 0.55 * vAct)) * brillo;
      color += vec3(1.0) * nucleo * 0.08 * vAct * vPulso;
    }
    // Anillo claro del circuito: se ve aunque esté en reposo, más fuerte si dispara
    float anillo = smoothstep(0.58, 0.7, d) * (1.0 - smoothstep(0.84, 1.0, d));
    color += vec3(0.88, 0.92, 1.0) * anillo * vAnillo * (0.45 + 0.55 * vAct);
    gl_FragColor = vec4(color * uGanancia, 1.0);
  }
`;

// Recorrido: líneas suaves entre neuronas que se conectan de verdad, con un
// pulso que viaja tramo a tramo (nivel 0 antena → aBN1 … nivel 3 aDN → cordón)
const VERTICE_LINEA = /* glsl */ `
  attribute float aT;
  attribute float aNivel;
  attribute float aEncendida;
  varying float vT;
  varying float vNivel;
  varying float vEncendida;
  void main() {
    vT = aT;
    vNivel = aNivel;
    vEncendida = aEncendida;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAGMENTO_LINEA = /* glsl */ `
  uniform float uFase;
  uniform float uGanancia;
  varying float vT;
  varying float vNivel;
  varying float vEncendida;
  void main() {
    float avance = uFase - vNivel;
    float viaja = step(0.0, avance) * step(avance, 1.0);
    float pulso = exp(-pow((vT - clamp(avance, 0.0, 1.0)) / 0.09, 2.0)) * viaja;
    float base = mix(0.07, 0.3, vEncendida);
    vec3 color = vec3(0.62, 0.74, 1.0) * (base + 1.1 * pulso * vEncendida);
    gl_FragColor = vec4(color * uGanancia, 1.0);
  }
`;
const VERTICE_PULSO = /* glsl */ `
  attribute float aBrillo;
  uniform float uTamano;
  uniform float uEscalaVista;
  varying float vBrillo;
  void main() {
    vBrillo = aBrillo;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(2.0, uTamano * uEscalaVista / -mv.z) * step(0.01, aBrillo);
  }
`;
const FRAGMENTO_PULSO = /* glsl */ `
  uniform float uGanancia;
  varying float vBrillo;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float luz = exp(-d * d * 4.0);
    gl_FragColor = vec4(vec3(0.8, 0.88, 1.0) * luz * vBrillo * uGanancia, 1.0);
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
  const { meta, n, posiciones, grupos, tonos, roles, indices, brillo, hz10 } = real;
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

  // ---------- Recorrido real de la señal ----------
  const aristas = meta.recorrido.aristas; // [desde, hasta, sinapsis, nivel]
  const nA = aristas.length;
  const posLineas = new Float32Array(nA * 6);
  const tLineas = new Float32Array(nA * 2);
  const nivelLineas = new Float32Array(nA * 2);
  const encendida = new THREE.BufferAttribute(new Float32Array(nA * 2), 1);
  encendida.setUsage(THREE.DynamicDrawUsage);
  aristas.forEach(([de, a, , nivel], j) => {
    for (let e = 0; e < 3; e++) {
      posLineas[j * 6 + e] = posiciones[de * 3 + e];
      posLineas[j * 6 + 3 + e] = posiciones[a * 3 + e];
    }
    tLineas[j * 2 + 1] = 1;
    nivelLineas[j * 2] = nivelLineas[j * 2 + 1] = nivel;
  });
  const geoLineas = new THREE.BufferGeometry();
  geoLineas.setAttribute('position', new THREE.BufferAttribute(posLineas, 3));
  geoLineas.setAttribute('aT', new THREE.BufferAttribute(tLineas, 1));
  geoLineas.setAttribute('aNivel', new THREE.BufferAttribute(nivelLineas, 1));
  geoLineas.setAttribute('aEncendida', encendida);
  const uniformsLinea = { uFase: { value: 0 }, uGanancia: uniforms.uGanancia };
  const lineas = new THREE.LineSegments(
    geoLineas,
    new THREE.ShaderMaterial({
      vertexShader: VERTICE_LINEA,
      fragmentShader: FRAGMENTO_LINEA,
      uniforms: uniformsLinea,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
  );
  lineas.frustumCulled = false;
  // Un punto de luz por tramo que viaja de una neurona a la otra
  const posPulsos = new THREE.BufferAttribute(new Float32Array(nA * 3), 3);
  const brilloPulsos = new THREE.BufferAttribute(new Float32Array(nA), 1);
  posPulsos.setUsage(THREE.DynamicDrawUsage);
  brilloPulsos.setUsage(THREE.DynamicDrawUsage);
  const geoPulsos = new THREE.BufferGeometry();
  geoPulsos.setAttribute('position', posPulsos);
  geoPulsos.setAttribute('aBrillo', brilloPulsos);
  const pulsos = new THREE.Points(
    geoPulsos,
    new THREE.ShaderMaterial({
      vertexShader: VERTICE_PULSO,
      fragmentShader: FRAGMENTO_PULSO,
      uniforms: { uTamano: { value: TAMANO_PUNTO_UM * 2.6 }, uEscalaVista: uniforms.uEscalaVista, uGanancia: uniforms.uGanancia },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
  );
  pulsos.frustumCulled = false;
  const encendidaSuave = new Float32Array(nA);

  // ---------- Disposición: cerebro arriba y cordón nervioso colgando ----------
  // Ambos giran juntos alrededor de un eje vertical que pasa por el centro de
  // los 25.000 puntos de siempre (así el encuadre no cambia).
  let tx = 0;
  let tz = 0;
  for (let i = 0; i < info.puntos; i++) {
    tx += posiciones[i * 3];
    tz += posiciones[i * 3 + 2];
  }
  const altoTotal = info.tamano_um[1];
  const inclinado = new THREE.Group();
  inclinado.rotation.x = INCLINACION;
  const giratorio = new THREE.Group();
  inclinado.add(giratorio);
  scene.add(inclinado);
  nube.position.set(-tx / info.puntos, 0, -tz / info.puntos);
  nube.add(lineas);
  nube.add(pulsos);
  giratorio.add(nube);
  resplandor.scale.set(1500, 1500, 1);

  // ---------- Encuadre: el cerebro y su cordón centrados y llenando su espacio ----------
  // Se miran los puntos (todos los de los bordes y uno de cada cinco del
  // resto) en 16 ángulos de la vuelta, ya inclinados como se ven. La cámara
  // queda a la altura del centro de lo que se ve y a la distancia justa para
  // que nada se salga en ninguna parte de la vuelta (con un 5 % de aire).
  let muestra = [];
  {
    let maxY = 0;
    let maxR = 0;
    for (let i = 0; i < n; i++) {
      maxY = Math.max(maxY, Math.abs(posiciones[i * 3 + 1]));
      maxR = Math.max(maxR, Math.hypot(posiciones[i * 3] - tx / info.puntos, posiciones[i * 3 + 2] - tz / info.puntos));
    }
    const m = new THREE.Matrix4();
    const rx = new THREE.Matrix4().makeRotationX(INCLINACION);
    const p = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const x = posiciones[i * 3] - tx / info.puntos;
      const y = posiciones[i * 3 + 1];
      const z = posiciones[i * 3 + 2] - tz / info.puntos;
      const borde = Math.abs(y) > 0.94 * maxY || Math.hypot(x, z) > 0.9 * maxR;
      if (!borde && i % 5) continue;
      for (let a = 0; a < 16; a++) {
        m.makeRotationY((a / 16) * Math.PI * 2).premultiply(rx);
        p.set(x, y, z).applyMatrix4(m);
        muestra.push(p.x, p.y, p.z);
      }
    }
    muestra = Float32Array.from(muestra);
  }
  // Distancia mínima de la cámara si se pone a la altura yc: cada punto debe
  // quedar dentro del cuadro (arriba/abajo y a los lados) estando más cerca o
  // más lejos según el giro.
  function distanciaPara(yc, tanAlto, tanAncho) {
    let d = 0;
    for (let j = 0; j < muestra.length; j += 3) {
      const necesita = muestra[j + 2] + Math.max(Math.abs(muestra[j + 1] - yc) / tanAlto, Math.abs(muestra[j]) / tanAncho);
      if (necesita > d) d = necesita;
    }
    return d;
  }
  function encuadrar(aspecto) {
    const tanAlto = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / MARGEN_ENCUADRE;
    const tanAncho = tanAlto * aspecto;
    // La distancia necesaria según la altura es una curva con un solo mínimo:
    // se busca acortando el intervalo (búsqueda ternaria)
    let lo = -altoTotal / 2;
    let hi = altoTotal / 2;
    for (let k = 0; k < 40; k++) {
      const a = lo + (hi - lo) / 3;
      const b = hi - (hi - lo) / 3;
      if (distanciaPara(a, tanAlto, tanAncho) < distanciaPara(b, tanAlto, tanAncho)) hi = b;
      else lo = a;
    }
    const yc = (lo + hi) / 2;
    return { yc, distancia: distanciaPara(yc, tanAlto, tanAncho) };
  }

  // ---------- Vista: gira solo; un clic lo detiene u otro lo hace girar ----------
  let distanciaBase = 2000;
  let alturaCamara = 0;
  let zoom = 1;
  let zoomSuave = 1;
  // Corrimiento de la vista al hacer zoom hacia el cursor (en µm del cerebro)
  const corrido = { x: 0, y: 0 };
  const corridoSuave = { x: 0, y: 0 };
  let anguloY = 0;
  let inclinacion = INCLINACION;
  let autoGiro = true;
  let cursorEncima = false;
  let velocidadGiro = 1;
  let arrastre = null;
  let ultimoFueArrastre = false; // el clic que sigue a un arrastre no cuenta como clic
  let tiempo = 0;

  function detener() {
    autoGiro = false;
  }
  function girar() {
    autoGiro = true;
  }
  // "Centrar": vuelve a la vista inicial (sin zoom ni inclinación propia) y a girar
  function centrar() {
    zoom = 1;
    corrido.x = corrido.y = 0;
    inclinacion = INCLINACION;
    autoGiro = true;
  }
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerenter', () => (cursorEncima = true));
  canvas.addEventListener('pointerleave', () => (cursorEncima = false));
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    arrastre = { x: e.clientX, y: e.clientY, movio: false };
    ultimoFueArrastre = false;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x;
    const dy = e.clientY - arrastre.y;
    if (!arrastre.movio && Math.abs(dx) + Math.abs(dy) < 3) return; // un clic no lo mueve
    arrastre.movio = true;
    arrastre.x = e.clientX;
    arrastre.y = e.clientY;
    // Arrastrar lo gira a mano (y si estaba girando solo, se detiene)
    autoGiro = false;
    anguloY += dx * 0.008;
    inclinacion = clamp(inclinacion + dy * 0.006, -0.9, 1.3);
  });
  const soltar = (e) => {
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    ultimoFueArrastre = Boolean(arrastre?.movio);
    arrastre = null;
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  // Rueda o pellizco del trackpad (en el Mac llega como rueda con Ctrl): el
  // zoom funciona siempre, gire o no
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const paso = e.ctrlKey ? 0.012 : 0.0016;
      const antes = zoom;
      zoom = clamp(zoom * Math.exp(-e.deltaY * paso), ZOOM_MIN, ZOOM_MAX);
      // Se acerca hacia donde apunta el cursor: ese punto queda bajo el cursor
      const r = canvas.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = 1 - ((e.clientY - r.top) / r.height) * 2;
      const tanMedio = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const cambio = distanciaBase * (1 / antes - 1 / zoom);
      corrido.x += nx * tanMedio * camera.aspect * cambio;
      corrido.y += ny * tanMedio * cambio;
      // Sin alejarse del cerebro: el corrimiento se achica al alejar (en zoom 1 o menos, centrado)
      const libre = Math.max(0, 1 - 1 / zoom);
      corrido.x = clamp(corrido.x, -libre * distanciaBase * tanMedio * camera.aspect, libre * distanciaBase * tanMedio * camera.aspect);
      corrido.y = clamp(corrido.y, -libre * distanciaBase * tanMedio, libre * distanciaBase * tanMedio);
    },
    { passive: false }
  );
  canvas.addEventListener('dblclick', centrar);

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
    const { yc, distancia } = encuadrar(camera.aspect);
    distanciaBase = distancia;
    alturaCamara = yc;
    resplandor.position.y = yc;
    camera.updateProjectionMatrix();
    uniforms.uEscalaVista.value = (h * ratio) / (2 * tanMedio);
    // En el panel chico los puntos quedan muy juntos y se suman: bajo la
    // intensidad para que no se quemen a blanco
    uniforms.uGanancia.value = clamp((w * h) / 520000, 0.45, 0.9);
  }

  // ---------- Actividad simulada (precalculada) ----------
  const nombres = meta.condiciones;
  const k = indices.length;
  const posEnActivos = new Int32Array(n).fill(-1);
  for (let j = 0; j < k; j++) posEnActivos[indices[j]] = j;
  const maxActivas = Math.max(...nombres.map((s) => meta.situaciones[s].activas));
  // El máximo de la limpieza en el juego: con 10 tareas abiertas (≈ 78 Hz)
  const limpiezaMaxima = meta.situaciones.antena_10.limpieza;
  let actual = 0; // situación que se muestra (índice en meta.condiciones)
  let previa = 0;
  let mezcla = 1;
  let saltar = true; // día nuevo: la actividad parte en su valor, sin arrastrar
  let cafeSuave = 0;

  const hzDe = (punto, s = actual) => {
    const j = posEnActivos[punto];
    return j < 0 ? 0 : hz10[s * k + j] / 10;
  };

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

  function actualizarRecorrido(dt) {
    const fase = (tiempo / SEGUNDOS_POR_TRAMO) % 4.6; // 4 tramos y una pausa corta
    uniformsLinea.uFase.value = fase;
    const enc = encendida.array;
    const P = posPulsos.array;
    const B = brilloPulsos.array;
    aristas.forEach(([de, a, , nivel], j) => {
      const objetivo = hzDe(de) > HZ_MINIMO && hzDe(a) > HZ_MINIMO ? 1 : 0;
      encendidaSuave[j] = saltar ? objetivo : amortiguar(encendidaSuave[j], objetivo, 3, dt);
      enc[j * 2] = enc[j * 2 + 1] = encendidaSuave[j];
      const avance = fase - nivel;
      const viaja = avance >= 0 && avance <= 1;
      const t = clamp(avance, 0, 1);
      for (let e = 0; e < 3; e++) P[j * 3 + e] = lerp(posiciones[de * 3 + e], posiciones[a * 3 + e], t);
      B[j] = viaja ? encendidaSuave[j] * Math.sin(Math.PI * t) : 0;
    });
    encendida.needsUpdate = true;
    posPulsos.needsUpdate = true;
    brilloPulsos.needsUpdate = true;
  }

  const v = new THREE.Vector3();

  function actualizar(dt, estadoJuego) {
    tiempo += dt;
    const s = situacionPara(estadoJuego);
    if (saltar) ir(s, true);
    else if (s !== actual) ir(s, false);
    mezcla = Math.min(1, mezcla + dt / SEGUNDOS_TRANSICION);
    uniforms.uMezcla.value = mezcla * mezcla * (3 - 2 * mezcla);
    cafeSuave = amortiguar(cafeSuave, s >= 11 ? 1 : 0, 3, dt);
    uniforms.uCafe.value = cafeSuave;
    uniforms.uTiempo.value = tiempo;
    actualizarRecorrido(dt);
    saltar = false;
    // El resplandor azul de fondo sigue a cuántas neuronas disparan
    const activas = lerp(meta.situaciones[nombres[previa]].activas, meta.situaciones[nombres[actual]].activas, uniforms.uMezcla.value);
    resplandor.material.opacity = 0.2 + 0.7 * (activas / maxActivas);
    resplandor.material.transparent = true;
    // Gira solo hasta que lo detengan (un clic o arrastrarlo); con el cursor
    // encima gira más lento, para poder apuntar a una neurona
    velocidadGiro = amortiguar(velocidadGiro, cursorEncima ? GIRO_CON_CURSOR : 1, 4, dt);
    if (autoGiro) {
      anguloY += (dt / VUELTA_SEGUNDOS) * Math.PI * 2 * velocidadGiro;
      inclinacion = amortiguar(inclinacion, INCLINACION, 1.5, dt);
    }
    giratorio.rotation.y = anguloY;
    inclinado.rotation.x = inclinacion;
    zoomSuave = amortiguar(zoomSuave, zoom, 8, dt);
    corridoSuave.x = amortiguar(corridoSuave.x, corrido.x, 8, dt);
    corridoSuave.y = amortiguar(corridoSuave.y, corrido.y, 8, dt);
    camera.position.set(corridoSuave.x, alturaCamara + corridoSuave.y, distanciaBase / zoomSuave);
    camera.lookAt(corridoSuave.x, alturaCamara + corridoSuave.y, 0);
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
    const activasExactas = lerp(s0.activas, s1.activas, t);
    const activas = Math.round(activasExactas);
    // Zonas: qué parte de las neuronas activas está en cada una (suman 100 %)
    const porGrupo = info.grupos.map((g) => {
      const a = lerp(s0.zonas[g.id].activas, s1.zonas[g.id].activas, t);
      return { id: g.id, nombre: g.nombre, detalle: g.detalle, activas: Math.round(a), parte: activasExactas > 0 ? a / activasExactas : 0 };
    });
    return {
      activas,
      total: meta.neuronas_simuladas,
      nivel: activas / meta.neuronas_simuladas,
      intensidad: activas / maxActivas,
      // Limpieza de antenas: aDN1 y aDN2 comparadas con su máximo (10 tareas = 100 %)
      limpieza: clamp(lerp(s0.limpieza, s1.limpieza, t) / limpiezaMaxima, 0, 1),
      limpiezaObjetivo: clamp(s1.limpieza / limpiezaMaxima, 0, 1), // sin el paso suave (para las palabras)
      limpiezaHz: s1.limpieza,
      porGrupo,
      situacion: nombres[actual],
      cafe: actual >= 11,
      tareas: actual % 11,
      datos: s1,
    };
  }

  // La neurona (que dispara o del circuito) más cercana al cursor, o null
  const fichas = meta.fichas;
  const candidatos = Object.keys(fichas).map(Number);
  function neuronaEn(clientX, clientY) {
    if (arrastre?.movio) return null;
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    nube.updateWorldMatrix(true, false);
    let mejor = -1;
    let mejorD = 12 * 12;
    for (const i of candidatos) {
      const hz = hzDe(i);
      if (roles[i] === 0 && hz <= 0) continue;
      if (roles[i] >= 6 && cafeSuave < 0.5 && hz <= 0) continue; // el azúcar se marca sólo en el café
      v.set(posiciones[i * 3], posiciones[i * 3 + 1], posiciones[i * 3 + 2]).applyMatrix4(nube.matrixWorld).project(camera);
      if (v.z > 1) continue;
      const dx = ((v.x + 1) / 2) * r.width - x;
      const dy = ((1 - v.y) / 2) * r.height - y;
      // aBN1, aBN2, aDN1 y aDN2 se dibujan 3 veces más grandes: se pueden
      // tomar desde un poco más lejos
      const d = (dx * dx + dy * dy) * (roles[i] >= 2 && roles[i] <= 5 ? 0.35 : 1);
      if (d < mejorD) {
        mejorD = d;
        mejor = i;
      }
    }
    return mejor < 0 ? null : neurona(mejor);
  }
  // La ficha de un punto con sus Hz de ahora (sirve también para refrescar la
  // tarjetita fija si cambia la situación)
  function neurona(punto) {
    const [bodyId, tipo, lado, superclase, zona] = fichas[punto];
    return { punto, bodyId, tipo, lado, superclase, zona, rol: roles[punto], hz: hzDe(punto) };
  }

  // Dónde se ve en pantalla la neurona del circuito con ese papel que más
  // dispara (para las pruebas automáticas)
  function dondeEsta(rol) {
    let mejor = -1;
    for (let i = 0; i < n; i++) if (roles[i] === rol && (mejor < 0 || hzDe(i) > hzDe(mejor))) mejor = i;
    if (mejor < 0) return null;
    nube.updateWorldMatrix(true, false);
    v.set(posiciones[mejor * 3], posiciones[mejor * 3 + 1], posiciones[mejor * 3 + 2]).applyMatrix4(nube.matrixWorld).project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }

  function reiniciar() {
    saltar = true;
  }

  return {
    dondeEsta,
    actualizar,
    renderizar,
    lectura,
    info,
    meta,
    reiniciar,
    centrar,
    detener,
    girar,
    girando: () => autoGiro,
    // Para las pruebas automáticas: ángulo, zoom y velocidad del giro
    vista: () => ({ angulo: anguloY, zoom, velocidad: velocidadGiro, girando: autoGiro }),
    neuronaEn,
    neurona,
    fueArrastre: () => ultimoFueArrastre,
  };
}
