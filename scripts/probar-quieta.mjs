// Prueba de que la oficina se queda quieta (Etapa 8.8, 2026-11-09, pedido de
// Felipe: "cuando no lo tienes iniciado y estás esperando, la imagen de la
// mosca en la oficina se va corriendo y se pega un salto, casi no se nota").
//
// Qué pasaba: para que los paneles no tapen a la mosca, el juego corre y achica
// la imagen de la oficina entre ellos, midiendo la silueta de la mosca. Esa
// silueta se volvía a medir cada 2 segundos y, como la mosca respira y se
// mueve un poco, en ventanas angostas (menos de unos 1500 px de ancho) la
// imagen se reacomodaba de golpe cada vez: hasta 1 píxel y 0,3 % de tamaño. En
// 24 segundos, 11 saltos. En la ventana de Felipe (1906 × 830) no pasaba,
// porque ahí la mosca cabe sin correr nada.
//
// Qué se arregló (src/main.js, aplicarEspacioPanel): la silueta se sigue
// mirando cada 2 segundos, pero la imagen solo se reacomoda si cambió de
// verdad (más que su respirar), y entonces pasa de un encuadre al otro en 0,6
// segundos, sin salto.
//
// Revisa, en 1440 × 900 y 1280 × 720 (donde saltaba) y en 1906 × 830:
//  1. antes de empezar, 12 segundos: la imagen no se mueve ni una vez;
//  2. con el día corriendo y 9 tareas (la mosca fuma: cambia de postura), 25
//     segundos: entre un cuadro y el siguiente la imagen nunca se corre más de
//     0,35 px (antes saltaba hasta 1 px de una vez), y la mosca sigue entera
//     entre los dos paneles.
// Requiere npm run dev (usa window.__mosca).
// Uso: node scripts/probar-quieta.mjs   → debe decir "quieta: todo bien"
import { chromium } from 'playwright';

const JUEGO = process.env.JUEGO ?? 'http://localhost:5173/jugar/';
const PASO_MAXIMO = 0.35; // px entre dos cuadros, con el día corriendo
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const mal = [];
const ok = (cond, msg) => { if (!cond) mal.push(msg); };

// La imagen de la oficina, cuadro a cuadro, durante unos segundos
const mirar = (p, segundos) => p.evaluate(async (segundos) => {
  const cuadros = [];
  const t0 = performance.now();
  await new Promise((fin) => {
    const paso = () => {
      const i = window.__mosca.imagenOficina();
      cuadros.push([i.zoom, i.dx, i.dy]);
      if (performance.now() - t0 < segundos * 1000) requestAnimationFrame(paso);
      else fin();
    };
    requestAnimationFrame(paso);
  });
  let cambios = 0;
  let pasoMayor = 0;
  for (let n = 1; n < cuadros.length; n++) {
    const d = Math.max(Math.abs(cuadros[n][1] - cuadros[n - 1][1]), Math.abs(cuadros[n][2] - cuadros[n - 1][2]));
    const dz = Math.abs(cuadros[n][0] - cuadros[n - 1][0]);
    if (d > 0 || dz > 0) cambios++;
    pasoMayor = Math.max(pasoMayor, d);
  }
  return { cuadros: cuadros.length, cambios, pasoMayor };
}, segundos);

for (const [ancho, alto] of [[1440, 900], [1280, 720], [1906, 830]]) {
  const tag = `${ancho}×${alto}`;
  const ctx = await b.newContext({ viewport: { width: ancho, height: alto } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__cuadrosMosca = []; });
  p.on('pageerror', (e) => mal.push(`error ${tag}: ${e.message}`));
  await p.goto(JUEGO, { waitUntil: 'networkidle' });
  await p.waitForSelector('#btn-empezar', { state: 'visible' });
  await p.waitForTimeout(1500);
  // 1. antes de empezar
  const antes = await mirar(p, 12);
  ok(antes.cuadros > 300, `${tag}: se dibujaron pocos cuadros en 12 s (${antes.cuadros}): la medición no vale`);
  ok(antes.cambios === 0, `${tag}: antes de empezar la imagen se movió ${antes.cambios} veces (el paso más grande, ${antes.pasoMayor.toFixed(2)} px)`);
  // 2. con el día corriendo y la mosca fumando
  await p.keyboard.press('9');
  await p.waitForTimeout(300);
  await p.click('#btn-empezar');
  const dia = await mirar(p, 25);
  const fumo = await p.evaluate(() => window.__mosca.estado().colillas > 0 || window.__mosca.estado().fumando);
  ok(fumo, `${tag}: en 25 s con 9 tareas la mosca no fumó: la prueba no vio un cambio de postura`);
  ok(dia.pasoMayor <= PASO_MAXIMO, `${tag}: con el día corriendo la imagen saltó ${dia.pasoMayor.toFixed(2)} px entre dos cuadros (se aceptan ${PASO_MAXIMO})`);
  // ...y la mosca sigue entera entre los dos paneles
  const e = await p.evaluate(() => {
    const mosca = (window.__cuadrosMosca || []).filter((c) => c.tipo === 'cuadro').at(-1)?.mosca;
    const cerebro = document.getElementById('cerebro').getBoundingClientRect();
    const panel = document.getElementById('panel').getBoundingClientRect();
    return { mosca, izq: cerebro.right, der: panel.left };
  });
  ok(e.mosca && e.mosca[0] >= e.izq && e.mosca[2] <= e.der, `${tag}: la mosca (de ${Math.round(e.mosca?.[0])} a ${Math.round(e.mosca?.[2])} px) no queda entre el cerebro (${Math.round(e.izq)}) y el panel (${Math.round(e.der)})`);
  console.log(`${tag}: antes de empezar, ${antes.cambios} movimientos en ${antes.cuadros} cuadros; con el día corriendo, ${dia.cambios} cuadros de reacomodo y el paso más grande de ${dia.pasoMayor.toFixed(3)} px`);
  await ctx.close();
}

await b.close();
if (mal.length) { console.log('PROBLEMAS:\n - ' + mal.join('\n - ')); process.exit(1); }
console.log('quieta: todo bien');
