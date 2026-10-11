// Panel del cerebro: nube de neuronas reales (MaleCNS v1.0) que gira lento y
// se enciende según lo que pasa en el juego.
//
// Etapa 2: las luces son ilustrativas (un modelo simple de "cuánta actividad
// tiene cada zona"). En la Etapa 3 las controlará el conectoma real.
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

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const amortiguar = (actual, objetivo, rapidez, dt) => lerp(actual, objetivo, 1 - Math.exp(-rapidez * dt));

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

const VERTICE = /* glsl */ `
  attribute vec3 aColor;
  attribute float aGrupo;
  attribute float aSemilla;
  uniform float uTiempo;
  uniform float uAct[5];
  uniform float uTamano;
  uniform float uEscalaVista;
  varying vec3 vColor;
  varying float vEncendido;

  float azar(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    int g = int(aGrupo + 0.5);
    float act = 0.0;
    for (int i = 0; i < 5; i++) {
      if (i == g) act = uAct[i];
    }
    // Cada neurona tiene su propio ritmo. En cada "latido" se enciende con
    // una probabilidad igual a la actividad de su zona, y luego se apaga
    // de a poco (un destello).
    float ritmo = 0.9 + aSemilla * 1.8;
    float t = uTiempo * ritmo + aSemilla * 17.0;
    float latido = floor(t);
    float fase = t - latido;
    float dispara = step(azar(vec2(aSemilla * 97.0, latido)), act);
    vEncendido = dispara * exp(-fase * 3.2);
    vColor = aColor;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.5, uTamano * (1.0 + 1.3 * vEncendido) * uEscalaVista / -mv.z);
  }
`;

const FRAGMENTO = /* glsl */ `
  uniform float uBase;
  varying vec3 vColor;
  varying float vEncendido;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float nucleo = smoothstep(0.55, 0.0, d);
    float halo = exp(-d * d * 3.2) * 0.7;
    float brillo = mix(uBase, 1.0, vEncendido);
    vec3 color = vColor * (nucleo + halo) * brillo + vec3(1.0) * nucleo * vEncendido * 0.45;
    gl_FragColor = vec4(color, 1.0);
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

export function crearCerebro(canvas, datos) {
  const { info, posiciones, grupos, tonos } = datos;
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
  resplandor.scale.set(1500, 1500, 1);
  resplandor.position.z = -500;
  resplandor.renderOrder = -1;
  scene.add(resplandor);

  // Colores: el de la zona, con un matiz distinto por tipo de neurona
  const n = info.puntos;
  const colores = new Float32Array(n * 3);
  const semillas = new Float32Array(n);
  const grupoF = new Float32Array(n);
  const hsl = {};
  const base = ids.map((id) => new THREE.Color(GRUPOS_VISUALES[id].color));
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const g = grupos[i];
    base[g].getHSL(hsl);
    const tono = tonos[i] / 255 - 0.5;
    c.setHSL((hsl.h + tono * 0.07 + 1) % 1, clamp(hsl.s - Math.abs(tono) * 0.1, 0, 1), clamp(hsl.l + tono * 0.12, 0.35, 0.75));
    colores[i * 3] = c.r;
    colores[i * 3 + 1] = c.g;
    colores[i * 3 + 2] = c.b;
    semillas[i] = Math.random();
    grupoF[i] = g;
  }
  // Los colores van tal cual a la pantalla (sin conversión), así que uso sRGB
  for (let i = 0; i < colores.length; i++) colores[i] = Math.pow(colores[i], 1 / 2.2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colores, 3));
  geo.setAttribute('aGrupo', new THREE.BufferAttribute(grupoF, 1));
  geo.setAttribute('aSemilla', new THREE.BufferAttribute(semillas, 1));
  geo.computeBoundingSphere();

  const uniforms = {
    uTiempo: { value: 0 },
    uAct: { value: [0.1, 0.1, 0.1, 0.1, 0.1] },
    uTamano: { value: TAMANO_PUNTO_UM },
    uEscalaVista: { value: 500 },
    uBase: { value: 0.3 },
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
  const nube = new THREE.Points(geo, material);
  nube.frustumCulled = false;
  // Gira alrededor del centro de las neuronas (no del rectángulo que las
  // contiene): así cerebro y cordón no se separan al girar.
  let sx = 0;
  let sz = 0;
  for (let i = 0; i < n; i++) {
    sx += posiciones[i * 3];
    sz += posiciones[i * 3 + 2];
  }
  nube.position.set(-sx / n, 0, -sz / n);

  const inclinado = new THREE.Group();
  inclinado.rotation.x = INCLINACION;
  const giratorio = new THREE.Group();
  giratorio.add(nube);
  inclinado.add(giratorio);
  scene.add(inclinado);

  // Encuadre: el cerebro + cordón entra completo, girando, con margen
  const [ancho, alto, fondo] = info.tamano_um;
  const radioGiro = Math.hypot(ancho, fondo) / 2;
  const altoVisible = alto * Math.cos(INCLINACION) + fondo * Math.sin(INCLINACION);
  let tamano = { w: 0, h: 0 };

  function redimensionar() {
    const w = Math.max(1, Math.round(canvas.clientWidth));
    const h = Math.max(1, Math.round(canvas.clientHeight));
    if (w === tamano.w && h === tamano.h) return;
    tamano = { w, h };
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tanMedio = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const porAlto = (altoVisible / 2) / tanMedio;
    const porAncho = radioGiro / (tanMedio * camera.aspect);
    camera.position.set(0, 0, Math.max(porAlto, porAncho) * 1.05 + radioGiro);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    uniforms.uEscalaVista.value = (h * ratio) / (2 * tanMedio);
    // En el panel chico los puntos se ven un poco más finos
    uniforms.uBase.value = h < 320 ? 0.42 : 0.36;
  }

  // ---------- Actividad (modelo ilustrativo) ----------
  const actividad = Object.fromEntries(ids.map((id) => [id, 0.06]));
  let pulsoTarea = 0;
  let hechasAntes = null;

  function objetivos({ enCurso, estres, fumando, terminado, hechas }) {
    if (hechasAntes !== null && hechas > hechasAntes) pulsoTarea = 1;
    hechasAntes = hechas;
    if (terminado) return Object.fromEntries(ids.map((id) => [id, 0.03]));
    const trabajando = fumando ? 0 : 1;
    const o = {
      // "Ve tareas": más tareas abiertas en pantalla = más actividad visual
      vision: 0.05 + 0.065 * Math.min(enCurso, 10) * (fumando ? 0.45 : 1),
      central: 0.06 + 0.5 * estres,
      memoria: 0.05 + 0.2 * estres + 0.45 * pulsoTarea,
      mando: 0.05 + 0.1 * trabajando + 0.55 * (fumando ? 1 : 0),
      movimiento: 0.05 + 0.14 * trabajando + 0.6 * (fumando ? 1 : 0),
    };
    // El estrés sube un poco todo
    for (const id of ids) o[id] = clamp(o[id] + 0.12 * estres, 0, 0.95);
    return o;
  }

  let tiempo = 0;
  function actualizar(dt, estadoJuego) {
    tiempo += dt;
    pulsoTarea = Math.max(0, pulsoTarea - dt * 0.7);
    const o = objetivos(estadoJuego);
    ids.forEach((id, i) => {
      actividad[id] = amortiguar(actividad[id], o[id], 2.2, dt);
      uniforms.uAct.value[i] = actividad[id];
    });
    uniforms.uTiempo.value = tiempo;
    giratorio.rotation.y = (tiempo / VUELTA_SEGUNDOS) * Math.PI * 2;
  }

  function renderizar() {
    redimensionar();
    renderer.render(scene, camera);
  }

  // Contadores tipo monitor (sobre las neuronas reales con posición)
  function lectura() {
    let activas = 0;
    let total = 0;
    const porGrupo = info.grupos.map((g) => {
      activas += actividad[g.id] * g.real;
      total += g.real;
      return { id: g.id, nombre: g.nombre, detalle: g.detalle, actividad: actividad[g.id] };
    });
    return { activas: Math.round(activas), total, nivel: activas / total, porGrupo };
  }

  return { actualizar, renderizar, lectura, info };
}
