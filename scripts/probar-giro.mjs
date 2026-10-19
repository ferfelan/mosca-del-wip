// Prueba el giro y el mouse del cerebro en las dos vistas (pedido de Felipe,
// 2026-10-19): gira solo por defecto; un clic lo detiene y otro lo hace girar
// (ya no vuelve solo); arrastrar mientras gira también lo detiene; el zoom
// funciona siempre; un clic sobre una neurona deja su tarjetita fija hasta el
// próximo clic; con el cursor encima gira más lento; botón Detener/Girar y
// Centrar; detener NO pausa el juego y los atajos siguen funcionando; ⓘ abre
// y cierra (Esc sólo la cierra). Requiere npm run dev.
// Uso: node scripts/probar-giro.mjs   → debe decir "giro: todo bien"
import { chromium } from 'playwright';

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.evaluate(() => ['mosca-del-wip-cerebro-oculto', 'mosca-del-wip-controles-oculto'].forEach((k) => localStorage.removeItem(k)));
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());

const fallas = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? '✅' : '❌'} ${texto}`);
  if (!ok) fallas.push(texto);
};
const vista = () => p.evaluate(() => window.__mosca.cerebroVista());
const boton = () => p.textContent('#btn-girar-texto');
const ficha = () => p.evaluate(() => !document.getElementById('cerebro-ficha').hidden);
const caja = async () => p.locator('#lienzo-cerebro').boundingBox();
// Un lugar del cerebro sin neuronas encendidas cerca (esquina de arriba a la izquierda)
const vacio = async () => {
  const r = await caja();
  return { x: r.x + 14, y: r.y + 14 };
};
// Cuánto gira en un rato (radianes por segundo reales)
const ritmo = async (ms = 1200) => {
  const a = (await vista()).angulo;
  await p.waitForTimeout(ms);
  return ((await vista()).angulo - a) / (ms / 1000);
};

for (const nombre of ['control', 'exhibicion']) {
  console.log(`\n— Vista ${nombre} —`);
  await p.evaluate((v) => window.__mosca.vista(v), nombre);
  await p.evaluate(() => window.__mosca.diaExhibicion(9));
  await p.mouse.move(5, 5);
  await p.waitForTimeout(1500);
  const r = await caja();

  // 1. Gira solo por defecto
  revisar((await vista()).girando && (await ritmo()) > 0.05 && (await boton()) === 'Detener', 'gira solo al abrir y el botón dice "Detener"');

  // 2. Con el cursor encima gira más lento
  const libre = await ritmo(1000);
  const v0 = await vacio();
  await p.mouse.move(v0.x, v0.y);
  await p.waitForTimeout(1500);
  const lento = await ritmo(1000);
  revisar(lento < libre * 0.45, `con el cursor encima gira más lento (${lento.toFixed(3)} vs ${libre.toFixed(3)} rad/s)`);

  // 3. Un clic lo detiene (sin pausar el juego) y no vuelve solo
  const hora0 = await p.evaluate(() => window.__mosca.estado().hora);
  await p.mouse.click(v0.x, v0.y);
  await p.waitForTimeout(300);
  const a0 = (await vista()).angulo;
  await p.waitForTimeout(9000); // antes volvía a girar solo a los 8 s
  const a1 = (await vista()).angulo;
  const hora1 = await p.evaluate(() => window.__mosca.estado().hora);
  revisar(!(await vista()).girando && Math.abs(a1 - a0) < 1e-6, 'un clic lo detiene y a los 9 s sigue detenido');
  revisar((await boton()) === 'Girar', 'detenido, el botón dice "Girar"');
  revisar(hora1 !== hora0 && !(await p.evaluate(() => window.__mosca.pausado())), `detenerlo no pausa el juego (${hora0} → ${hora1})`);

  // 4. Detenido, arrastrar lo gira a mano
  await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await p.mouse.down();
  await p.mouse.move(r.x + r.width / 2 + 80, r.y + r.height / 2, { steps: 8 });
  await p.mouse.up();
  await p.waitForTimeout(200);
  const a2 = (await vista()).angulo;
  revisar(Math.abs(a2 - a1) > 0.3 && !(await vista()).girando, 'detenido, arrastrar lo gira a mano (y soltar no lo pone a girar)');

  // 5. El zoom funciona detenido
  const z0 = (await vista()).zoom;
  await p.mouse.wheel(0, -300);
  await p.waitForTimeout(300);
  const z1 = (await vista()).zoom;
  revisar(z1 > z0 * 1.2, `zoom con la rueda estando detenido (${z0.toFixed(2)} → ${z1.toFixed(2)})`);

  // 6. Otro clic lo vuelve a poner a girar
  await p.mouse.click(v0.x, v0.y);
  await p.waitForTimeout(300);
  revisar((await vista()).girando && (await boton()) === 'Detener', 'otro clic lo vuelve a poner a girar');

  // 7. El zoom funciona girando y no lo detiene
  await p.mouse.move(v0.x, v0.y);
  await p.mouse.wheel(0, 300);
  await p.waitForTimeout(300);
  revisar((await vista()).zoom < z1 && (await vista()).girando, 'zoom con la rueda mientras gira (sigue girando)');

  // 8. Arrastrar mientras gira lo detiene
  await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await p.mouse.down();
  await p.mouse.move(r.x + r.width / 2 - 60, r.y + r.height / 2 + 10, { steps: 6 });
  await p.mouse.up();
  await p.waitForTimeout(200);
  revisar(!(await vista()).girando, 'arrastrar mientras gira lo detiene');

  // 9. Botón Detener/Girar
  await p.click('#btn-girar-cerebro');
  await p.waitForTimeout(200);
  revisar((await vista()).girando && (await boton()) === 'Detener', 'el botón "Girar" lo vuelve a poner a girar');
  await p.click('#btn-girar-cerebro');
  await p.waitForTimeout(200);
  revisar(!(await vista()).girando && (await boton()) === 'Girar', 'el botón "Detener" lo detiene');

  // 10. Atajos después de usar el botón: Espacio pausa, 4 cambia el WIP
  await p.mouse.move(5, 5);
  await p.keyboard.press('Space');
  await p.waitForTimeout(150);
  const pausadoTrasEspacio = await p.evaluate(() => window.__mosca.pausado());
  await p.keyboard.press('Space');
  await p.keyboard.press('4');
  await p.waitForTimeout(150);
  revisar(pausadoTrasEspacio && (await p.evaluate(() => window.__mosca.estado().wip)) === 4 && !(await vista()).girando,
    'después del botón, Espacio pausa, 4 cambia el WIP y el cerebro sigue detenido');
  await p.keyboard.press('9');

  // 11. Centrar: vuelve a la vista inicial (zoom 1) y a girar
  await p.mouse.move(v0.x, v0.y);
  await p.mouse.wheel(0, -400);
  await p.click('#btn-centrar-cerebro');
  await p.waitForTimeout(300);
  revisar((await vista()).girando && Math.abs((await vista()).zoom - 1) < 1e-6, '"Centrar" vuelve a la vista inicial y a girar');

  // 12. Clic sobre una neurona: se detiene y su tarjetita queda fija
  await p.evaluate(() => window.__mosca.adelantar(240));
  await p.waitForTimeout(1500);
  const donde = await p.evaluate(() => window.__mosca.cerebroDonde(2)); // aBN1
  await p.mouse.move(donde.x, donde.y);
  await p.waitForTimeout(80);
  const donde2 = await p.evaluate(() => window.__mosca.cerebroDonde(2)); // ya gira lento
  await p.mouse.click(donde2.x, donde2.y);
  await p.waitForTimeout(300);
  const texto = await p.evaluate(() => document.getElementById('cerebro-ficha').innerText.replace(/\n/g, ' | '));
  revisar(!(await vista()).girando && (await ficha()) && texto.includes('SAD093'), `clic en aBN1: se detiene y su tarjetita queda fija ("${texto.slice(0, 70)}…")`);
  await p.mouse.move(r.x + r.width - 20, r.y + r.height / 2, { steps: 4 });
  await p.waitForTimeout(300);
  revisar((await ficha()) && (await p.evaluate(() => document.getElementById('cerebro-ficha').innerText)).includes('SAD093'), 'al mover el cursor, la tarjetita fija no cambia');
  await p.mouse.move(5, 5);
  await p.waitForTimeout(300);
  revisar(await ficha(), 'al salir del cerebro, la tarjetita fija sigue');
  await p.mouse.click(v0.x, v0.y);
  await p.waitForTimeout(300);
  revisar((await vista()).girando && !(await ficha()), 'el clic siguiente la cierra y lo pone a girar');

  // 13. Sin nombres fijos sobre el cerebro
  revisar((await p.locator('.etiqueta-circuito').count()) === 0, 'no hay nombres fijos sobre el cerebro');

  // 14. ⓘ abre y cierra; Esc sólo la cierra
  await p.click('#btn-info-cerebro');
  await p.waitForTimeout(200);
  const abierta = await p.evaluate(() => !document.getElementById('cerebro-info').hidden);
  const dentro = await p.evaluate(() => {
    const r = document.getElementById('cerebro-info').getBoundingClientRect();
    return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
  });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  const cerrada = await p.evaluate(() => document.getElementById('cerebro-info').hidden);
  const sigue = await p.evaluate(() => document.body.classList.contains('exhibicion'));
  revisar(abierta && dentro && cerrada && sigue === (nombre === 'exhibicion'), 'ⓘ se abre dentro de la pantalla y Esc sólo la cierra');
}

await p.evaluate(() => window.__mosca.vista('control'));
revisar(errores.length === 0, `sin errores en la página${errores.length ? `: ${errores.join(' | ')}` : ''}`);
await b.close();
console.log(fallas.length ? `\ngiro: ${fallas.length} problema(s)` : '\ngiro: todo bien');
