// Prueba "el salto" (Etapa 8.6, punto 8a; pedido de Felipe, 2026-11-06): al
// pasar de la portada al juego en el iPhone, la mosca se agrandaba o se
// achicaba un instante. Causa: la oficina se encuadraba una primera vez antes
// de que la mosca estuviera en su silla (todavía en el centro del mundo, sin su
// lugar ni su postura), así que el primer cuadro salía con la cámara muy cerca
// y apuntando a otro lado; en el cuadro siguiente se volvía a encuadrar bien y
// la cámara saltaba.
//
// En cada teléfono abre la portada, toca "Jugar (1 minuto)" y, desde que empieza
// a cargar /jugar/:
//  - anota cada cuadro dibujado de la oficina (el juego lo hace solo en
//    desarrollo, si la prueba prende window.__cuadrosMosca): el tamaño del
//    lienzo, la cámara y la caja de la mosca en la pantalla (píxeles CSS); y
//    cada vez que el lienzo se rehace;
//  - en cada cuadro de la pantalla, el alto de la ventana y el visualViewport;
//  - saca una captura cada 50 ms durante 2 segundos.
// Falla si después del primer cuadro dibujado (y hasta 2 s después) el lienzo
// cambia de tamaño o se rehace, la cámara se mueve, o la mosca cambia de tamaño
// en la pantalla más de lo que se mueve sola (respira y mueve las antenas), o
// si la página se mueve hacia el lado o queda con zoom.
// Teléfonos: iPhone 15 Pro Max (WebKit, el motor de Safari), un iPhone de
// 393 × 852 y uno de 375 × 667 (WebKit) y un Pixel 7 (Chromium).
// Deja una hoja de contacto por teléfono (las capturas en grilla, con la hora,
// el tamaño de la mosca y un borde rojo en los cuadros con la cámara distinta
// de la final) y, del iPhone 15 Pro Max, dos o tres cuadros sueltos.
// Requiere el servidor de desarrollo (npm run dev). Uso:
//   node scripts/probar-salto.mjs        → debe decir "salto: todo bien"
//   SITIO=http://localhost:5173/          la portada (el juego es SITIO + jugar/)
//   TELEFONOS=iphone15promax,pixel7       solo esos
//   CAPTURAS=docs/etapa8-6-capturas       dónde dejar las hojas (por defecto capturas/salto)
//   NOMBRE=antes | despues                la palabra del nombre (salto-<NOMBRE>-<teléfono>.jpg)
import { chromium, webkit, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const SITIO = (process.env.SITIO ?? 'http://localhost:5173/').replace(/\/?$/, '/');
const DIR = process.env.CAPTURAS ?? 'capturas/salto';
const NOMBRE = process.env.NOMBRE ?? 'prueba';
const ROTULO = NOMBRE === 'despues' ? 'después' : NOMBRE; // (el título de la hoja, con su tilde)
mkdirSync(DIR, { recursive: true });

// Cuánto puede cambiar sola la mosca en la pantalla en 2 segundos (respira y
// mueve las antenas): el alto o el ancho de su caja, contra el primer cuadro
// (medido: menos de 1 %). El salto que se arregló era de un 20 % (271 × 342 px
// en el primer cuadro y 217 × 313 px después, en el iPhone 15 Pro Max).
const TOLERANCIA_MOSCA = 0.03;
const VENTANA_MS = 2000; // lo que se mira después del primer cuadro dibujado
const CADA_MS = 50; // una captura cada 50 ms

const UA_IPHONE = devices['iPhone 15 Pro Max'].userAgent;
const iphone = (ancho, alto, dpr) => ({
  motor: 'webkit',
  viewport: { width: ancho, height: alto },
  screen: { width: ancho, height: alto },
  deviceScaleFactor: dpr,
  isMobile: true,
  hasTouch: true,
  userAgent: UA_IPHONE,
});
const sinMotor = ({ defaultBrowserType, ...resto }) => resto;
const TELEFONOS = {
  iphone15promax: { motor: 'webkit', ...sinMotor(devices['iPhone 15 Pro Max']) }, // 430 × 739 (Safari con sus barras)
  'iphone-393x852': iphone(393, 852, 3),
  'iphone-375x667': iphone(375, 667, 2),
  pixel7: { motor: 'chromium', ...sinMotor(devices['Pixel 7']) },
};
const elegidos = process.env.TELEFONOS ? process.env.TELEFONOS.split(',') : Object.keys(TELEFONOS);

const navegadores = {};
const abrirMotor = async (motor) =>
  (navegadores[motor] ??=
    motor === 'webkit'
      ? await webkit.launch()
      : await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] }));

const fallas = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? '✅' : '❌'} ${texto}`);
  if (!ok) fallas.push(texto);
};

// En /jugar/: el juego anota sus cuadros en window.__cuadrosMosca (solo en
// desarrollo) y aquí se anota, en cada cuadro de la pantalla, el tamaño de la
// ventana y del visualViewport
function vigilarJuego() {
  if (!location.pathname.startsWith('/jugar')) return;
  window.__cuadrosMosca = [];
  const ventana = (window.__ventanaSalto = []);
  const anotar = () => {
    const vv = window.visualViewport;
    const c = document.getElementById('lienzo-3d');
    ventana.push({
      t: Math.round(performance.now()),
      ventana: [innerWidth, innerHeight],
      vv: vv ? [+vv.width.toFixed(1), +vv.height.toFixed(1), +vv.scale.toFixed(3), +vv.offsetTop.toFixed(1)] : null,
      lienzo: c ? [c.clientWidth, c.clientHeight] : null,
      desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    });
    if (performance.now() < 10000) requestAnimationFrame(anotar);
  };
  requestAnimationFrame(anotar);
}

const igual = (a, b, tol = 0) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tol);
const altoCaja = (m) => m[3] - m[1];
const anchoCaja = (m) => m[2] - m[0];
const ultimoAntes = (lista, t) => {
  let r = null;
  for (const x of lista) if (x.t <= t) r = x;
  return r;
};

async function probar(nombre) {
  const { motor, ...opciones } = TELEFONOS[nombre];
  const navegador = await abrirMotor(motor);
  console.log(`\n— ${nombre} (${opciones.viewport.width} × ${opciones.viewport.height}, ${motor})`);
  // Primero, una pasada sin mirar: así el servidor ya tiene listo todo lo del
  // juego y la carga medida se parece a la del sitio (no a la primera vez del
  // servidor de desarrollo)
  const previo = await navegador.newContext(opciones);
  const pp = await previo.newPage();
  await pp.goto(SITIO + 'jugar/', { waitUntil: 'load' });
  await pp.waitForFunction(() => window.__mosca, null, { timeout: 60000 });
  await previo.close();

  const contexto = await navegador.newContext(opciones);
  await contexto.addInitScript(vigilarJuego);
  const p = await contexto.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  await p.goto(SITIO, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  const boton = p.locator('.hero .acciones a[data-jugar]');
  await boton.waitFor();

  // El toque y, sin esperar, una captura cada 50 ms
  const capturas = [];
  const desde = Date.now();
  const toque = boton.tap({ noWaitAfter: true }).catch((e) => errores.push(`toque: ${e.message}`));
  while (Date.now() < desde + VENTANA_MS + 900) {
    const antes = Date.now();
    try {
      const img = await p.screenshot({ scale: 'css', type: 'png', timeout: 3000 });
      capturas.push({ t: (antes + Date.now()) / 2, img });
    } catch {
      // en medio de la navegación a veces no hay nada que capturar
    }
    const espera = CADA_MS - (Date.now() - antes);
    if (espera > 0) await p.waitForTimeout(espera);
  }
  await toque;
  await p.waitForURL(/\/jugar\//);
  await p.waitForFunction(() => window.__mosca, null, { timeout: 60000 });
  await p.waitForFunction(
    (ms) => {
      const c = window.__cuadrosMosca?.find((x) => x.tipo === 'cuadro');
      return c && performance.now() > c.t + ms;
    },
    VENTANA_MS + 100,
    { timeout: 60000 }
  );
  const datos = await p.evaluate(() => ({
    origen: performance.timeOrigin,
    cuadros: window.__cuadrosMosca,
    ventana: window.__ventanaSalto,
    hora: window.__mosca.estado().hora,
  }));
  await contexto.close();

  // ---------- Lo que pasó cuadro a cuadro ----------
  const dibujados = datos.cuadros.filter((c) => c.tipo === 'cuadro');
  const primero = dibujados[0];
  revisar(Boolean(primero), `${nombre}: el juego dibujó la oficina`);
  if (!primero) return;
  const hasta = primero.t + VENTANA_MS;
  const enVentana = dibujados.filter((c) => c.t <= hasta);
  const ultimo = enVentana.at(-1);
  const ajustes = datos.cuadros.filter((c) => c.tipo === 'ajuste' && c.t > primero.t && c.t <= hasta);
  const lienzoDistinto = enVentana.filter((c) => !igual(c.lienzo, primero.lienzo));
  const camaraDistinta = enVentana.filter((c) => !igual(c.camara, primero.camara, 0.002));
  const cambioMosca = (c) => Math.max(Math.abs(altoCaja(c.mosca) / altoCaja(primero.mosca) - 1), Math.abs(anchoCaja(c.mosca) / anchoCaja(primero.mosca) - 1));
  const peorMosca = enVentana.reduce((peor, c) => (cambioMosca(c) > cambioMosca(peor) ? c : peor), primero);
  // (desde el primer cuadro: antes, en el servidor de desarrollo la página
  // está un instante sin sus estilos, que llegan con el código; en el sitio
  // armado van en el <head>)
  const ventanas = datos.ventana.filter((v) => v.t >= primero.t && v.t <= hasta);
  const altos = [...new Set(ventanas.map((v) => v.ventana.join(' × ')))];
  const vvs = [...new Set(ventanas.map((v) => (v.vv ? v.vv.join(' ') : '–')))];
  const desborde = Math.max(0, ...ventanas.map((v) => v.desborde));

  console.log(
    `   primer cuadro a los ${primero.t} ms (${enVentana.length} cuadros hasta ${hasta} ms); lienzo ${primero.lienzo[0]} × ${primero.lienzo[1]} px; mosca ${Math.round(anchoCaja(primero.mosca))} × ${Math.round(altoCaja(primero.mosca))} px en el primer cuadro y ${Math.round(anchoCaja(ultimo.mosca))} × ${Math.round(altoCaja(ultimo.mosca))} px en el último`
  );
  console.log(`   ventana: ${altos.join(' → ')}; visualViewport (ancho alto zoom arriba): ${vvs.join(' → ')}`);
  revisar(lienzoDistinto.length === 0, `${nombre}: el lienzo no cambia de tamaño después del primer cuadro${lienzoDistinto.length ? ` (a los ${lienzoDistinto[0].t} ms: ${lienzoDistinto[0].lienzo.slice(0, 2).join(' × ')} en vez de ${primero.lienzo.slice(0, 2).join(' × ')})` : ''}`);
  revisar(ajustes.length === 0, `${nombre}: el lienzo no se rehace después del primer cuadro${ajustes.length ? ` (${ajustes.length} vez/veces, la primera a los ${ajustes[0].t} ms)` : ''}`);
  revisar(
    camaraDistinta.length === 0,
    `${nombre}: la cámara no se mueve después del primer cuadro${camaraDistinta.length ? ` (a los ${camaraDistinta[0].t} ms pasó de [${primero.camara.slice(0, 3).join(', ')}] a [${camaraDistinta[0].camara.slice(0, 3).join(', ')}])` : ''}`
  );
  revisar(
    cambioMosca(peorMosca) <= TOLERANCIA_MOSCA,
    `${nombre}: la mosca no cambia de tamaño en la pantalla (lo más que cambió: ${(cambioMosca(peorMosca) * 100).toFixed(1)} %, a los ${peorMosca.t} ms: ${Math.round(anchoCaja(peorMosca.mosca))} × ${Math.round(altoCaja(peorMosca.mosca))} px contra ${Math.round(anchoCaja(primero.mosca))} × ${Math.round(altoCaja(primero.mosca))} px; se acepta hasta ${TOLERANCIA_MOSCA * 100} %)`
  );
  revisar(altos.length === 1 && desborde <= 0 && vvs.every((v) => v === '–' || v.split(' ')[2] === '1'), `${nombre}: la ventana no cambia, no hay zoom ni desborde hacia el lado (${altos.join(' → ')}; desborde ${desborde} px)`);
  revisar(datos.hora === '09:00', `${nombre}: el día sigue esperando el botón Empezar (${datos.hora})`);
  revisar(errores.length === 0, `${nombre}: sin errores${errores.length ? `: ${errores.join(' | ')}` : ''}`);

  // ---------- La hoja de contacto ----------
  const finalCamara = ultimo.camara;
  const cuadrosHoja = capturas
    .map((c) => ({ ...c, tp: Math.round(c.t - datos.origen) }))
    .filter((c) => c.tp >= -CADA_MS && c.tp <= VENTANA_MS + CADA_MS)
    .map((c) => {
      const d = ultimoAntes(dibujados, c.tp);
      const v = ultimoAntes(datos.ventana, c.tp);
      const estado = !d ? 'sin' : igual(d.camara, finalCamara, 0.002) ? 'bien' : 'mal';
      return { ...c, d, v, estado };
    });
  console.log('   capturas (ms desde que empieza a cargar /jugar/ · ventana · visualViewport · lienzo · cámara · mosca):');
  for (const c of cuadrosHoja)
    console.log(
      `     ${String(c.tp).padStart(5)} ms · ${c.v ? c.v.ventana.join('×') : '–'} · ${c.v?.vv ? c.v.vv.slice(0, 3).join(' ') : '–'} · ${c.d ? c.d.lienzo.slice(0, 2).join('×') : '–'} · ${c.d ? c.d.camara.slice(0, 3).join(' ') : 'sin dibujar'} · ${c.d ? `${Math.round(anchoCaja(c.d.mosca))}×${Math.round(altoCaja(c.d.mosca))} px` : '–'}`
    );
  await hojaDeContacto(nombre, cuadrosHoja, opciones.viewport);

  // Cuadros sueltos (solo del iPhone 15 Pro Max): el primero con la oficina
  // dibujada, el primero con la cámara final (si hubo salto) y el de los 2 s
  if (nombre === 'iphone15promax') {
    const conOficina = cuadrosHoja.filter((c) => c.estado !== 'sin');
    const sueltos = [];
    if (conOficina[0]) sueltos.push(['1-primer-cuadro', conOficina[0]]);
    if (conOficina[0]?.estado === 'mal') {
      const tras = conOficina.find((c) => c.estado === 'bien');
      if (tras) sueltos.push(['2-tras-el-salto', tras]);
    }
    if (conOficina.at(-1)) sueltos.push([`${sueltos.length + 1}-a-los-2-segundos`, conOficina.at(-1)]);
    for (const [cual, c] of sueltos) await guardarSuelto(`salto-${NOMBRE}-${nombre}-${cual}.jpg`, c.img, opciones.viewport);
  }
}

// La hoja: cada captura achicada, con la hora, el tamaño de la mosca y un borde
// (verde: la cámara de siempre; rojo: otra cámara; gris: todavía sin la oficina)
async function hojaDeContacto(nombre, cuadros, { width, height }) {
  const ancho = 140;
  const alto = Math.round((height / width) * ancho);
  const columnas = 8;
  const color = { bien: '#2f8a4f', mal: '#d02f2f', sin: '#9a948a' };
  const celdas = cuadros
    .map(
      (c) => `<figure style="border-color:${color[c.estado]}"><img src="data:image/png;base64,${c.img.toString('base64')}"><figcaption><b>${c.tp} ms</b> · ${
        c.d ? `mosca ${Math.round(altoCaja(c.d.mosca))} px` : 'sin oficina'
      }</figcaption></figure>`
    )
    .join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; padding: 14px; background: #fff; font: 12px -apple-system, 'Segoe UI', sans-serif; color: #33291e; width: ${columnas * (ancho + 14) + 14}px; }
    h1 { margin: 0 0 4px; font-size: 16px; } p { margin: 0 0 10px; color: #7d6d59; }
    main { display: grid; grid-template-columns: repeat(${columnas}, ${ancho + 6}px); gap: 8px; }
    figure { margin: 0; border: 3px solid; border-radius: 6px; overflow: hidden; background: #f2ede3; }
    img { display: block; width: ${ancho}px; height: ${alto}px; }
    figcaption { padding: 3px 5px 4px; font-size: 11px; white-space: nowrap; }
  </style><h1>Mosca del WIP · de la portada al juego · ${nombre} (${width} × ${height}) · ${ROTULO}</h1>
  <p>Una captura cada 50 ms desde que empieza a cargar /jugar/. Borde verde: la cámara de siempre · rojo: otra cámara (el salto) · gris: todavía sin la oficina. "mosca" = alto de la mosca en la pantalla.</p>
  <main>${celdas}</main>`;
  const navegador = await abrirMotor('chromium');
  const pagina = await navegador.newPage({ viewport: { width: columnas * (ancho + 14) + 28, height: 600 }, deviceScaleFactor: 1 });
  await pagina.setContent(html);
  const archivo = `${DIR}/salto-${NOMBRE}-${nombre}.jpg`;
  await pagina.screenshot({ path: archivo, fullPage: true, type: 'jpeg', quality: 62 });
  await pagina.close();
  console.log(`   hoja de contacto: ${archivo}`);
}

async function guardarSuelto(archivo, img, { width, height }) {
  const navegador = await abrirMotor('chromium');
  const pagina = await navegador.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await pagina.setContent(`<body style="margin:0"><img style="display:block;width:${width}px;height:${height}px" src="data:image/png;base64,${img.toString('base64')}">`);
  await pagina.screenshot({ path: `${DIR}/${archivo}`, type: 'jpeg', quality: 75 });
  await pagina.close();
  console.log(`   cuadro suelto: ${DIR}/${archivo}`);
}

for (const nombre of elegidos) {
  if (!TELEFONOS[nombre]) {
    revisar(false, `no conozco el teléfono "${nombre}" (hay: ${Object.keys(TELEFONOS).join(', ')})`);
    continue;
  }
  await probar(nombre);
}
for (const n of Object.values(navegadores)) await n.close();
console.log(fallas.length ? `\nsalto: ${fallas.length} problema(s)` : '\nsalto: todo bien');
process.exit(fallas.length ? 1 : 0);
