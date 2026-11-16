// Prueba de lo que no debe cortarse en las páginas (revisión final v3, M25,
// M30 y M31, 2026-11-15), en los motores de Chrome, Safari y Firefox:
// - la tabla de 1 a 10 de la guía (/limite-wip/ y /en/wip-limit/) cabe
//   entera en el computador (1440, 1280 y 1024 px), sin barra para deslizar,
//   y su nota va debajo como texto, no como título de la tabla;
// - la tabla de 2 y 9 de la guía cabe en los celulares (320 a 414 px);
// - las tarjetas de descarga del taller (/taller/ y /en/workshop/) no se
//   cortan a 320 y 360 px ni en el computador.
// Uso: node scripts/probar-tablas.mjs [dirección]   (http://localhost:5173
//   por defecto; también contra el sitio publicado) → debe decir
//   "tablas: todo bien" y salir con 0 (con 1 si encuentra algo).
import { chromium, webkit, firefox } from 'playwright';

const BASE = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '');
const mal = [];
const ok = (c, m) => { if (!c) mal.push(m); };
let revisadas = 0;

async function abrir(b, ruta, ancho, alto) {
  const ctx = await b.newContext({ viewport: { width: ancho, height: alto } });
  // el contador de visitas de Vercel no suma visitas de las pruebas
  await ctx.route('**/_vercel/**', (r) => r.fulfill({ status: 204, body: '' }));
  const p = await ctx.newPage();
  await p.goto(BASE + ruta, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  revisadas++;
  return { ctx, p };
}

for (const [nombre, motor] of [['chromium', chromium], ['webkit', webkit], ['firefox', firefox]]) {
  const b = await motor.launch();
  for (const ruta of ['/limite-wip/', '/en/wip-limit/']) {
    for (const ancho of [1440, 1280, 1024]) {
      const { ctx, p } = await abrir(b, ruta, ancho, 900);
      const r = await p.evaluate(() => {
        const m = document.querySelector('.tabla-marco.ancho');
        const n = document.querySelector('.nota-tabla');
        if (!m) return null;
        return { sobra: m.scrollWidth - m.clientWidth, nota: n ? n.scrollWidth - n.clientWidth : null, titulo: Boolean(m.querySelector('caption')), describe: m.querySelector('table')?.getAttribute('aria-describedby') };
      });
      if (!r) ok(false, `${nombre} ${ruta} ${ancho} px: no está la tabla de 1 a 10`);
      else {
        ok(r.sobra <= 0, `${nombre} ${ruta} ${ancho} px: a la tabla de 1 a 10 le sobran ${r.sobra} px`);
        ok(r.nota !== null && r.nota <= 0, `${nombre} ${ruta} ${ancho} px: la nota de la tabla no está o se corta`);
        ok(!r.titulo && r.describe === 'nota-tabla-dias', `${nombre} ${ruta} ${ancho} px: la nota volvió a ser título de la tabla`);
      }
      await ctx.close();
    }
    for (const ancho of [320, 360, 375, 390, 414]) {
      const { ctx, p } = await abrir(b, ruta, ancho, 800);
      const sobra = await p.evaluate(() => { const m = document.querySelector('.tabla-marco:not(.ancho)'); return m ? m.scrollWidth - m.clientWidth : null; });
      ok(sobra !== null && sobra <= 0, `${nombre} ${ruta} ${ancho} px: a la tabla de 2 y 9 le sobran ${sobra} px`);
      await ctx.close();
    }
  }
  for (const ruta of ['/taller/', '/en/workshop/']) {
    for (const ancho of [320, 360, 1280]) {
      const { ctx, p } = await abrir(b, ruta, ancho, 800);
      const r = await p.evaluate(() => {
        const listas = [...document.querySelectorAll('.descargas-pagina')];
        let peor = -Infinity;
        for (const lista of listas) {
          const borde = lista.getBoundingClientRect().right;
          for (const a of lista.querySelectorAll('a')) {
            const corta = a.scrollWidth > a.clientWidth + 0.5;
            peor = Math.max(peor, corta ? 9999 : a.getBoundingClientRect().right - borde);
          }
        }
        return { listas: listas.length, peor };
      });
      ok(r.listas > 0, `${nombre} ${ruta} ${ancho} px: no están las tarjetas de descarga`);
      ok(r.peor <= 0.5, `${nombre} ${ruta} ${ancho} px: una tarjeta de descarga se corta (${r.peor.toFixed(1)} px)`);
      await ctx.close();
    }
  }
  await b.close();
}

console.log(`${revisadas} vistas revisadas`);
console.log(mal.length ? 'PROBLEMAS:\n- ' + mal.join('\n- ') : 'tablas: todo bien');
if (mal.length) process.exitCode = 1;
