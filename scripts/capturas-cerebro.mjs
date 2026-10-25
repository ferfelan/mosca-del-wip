// Capturas del panel (Etapa 3.3, v4: vuelven las zonas "De dónde viene la
// actividad") en el tamaño de la ventana de Felipe (1906×830): WIP 2, WIP 9,
// el café y el fin del día, en Control y en Exhibición; al final del día en
// Control también con los controles ocultos (tecla C), la tabla con la fila
// de hoy marcada y "¿Es real?" abierto. Juega los días de verdad (con las
// reglas normales) para que el gráfico del estrés tenga sus marcas y el
// promedio del día de las zonas sea el real; el café es uno real del día, sólo
// se sostiene un rato para la foto. Imprime lo que muestra cada vista.
// Requiere npm run dev.
// Uso: ETIQUETA=v4 node scripts/capturas-cerebro.mjs   (carpeta capturas/etapa3-3/<ETIQUETA>)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const ETIQUETA = process.env.ETIQUETA ?? 'v4';
const DIR = `capturas/etapa3-3/${ETIQUETA}`;
mkdirSync(DIR, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1906, height: 830 } });
p.on('pageerror', (e) => console.log('ERROR', e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) console.log('CONSOLA', m.text()); });
const abrir = async () => {
  await p.goto('http://localhost:5173/jugar/', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
  await p.evaluate(() => window.__mosca.empezar()); // el juego parte detenido hasta apretar Empezar
};
await abrir();
await p.evaluate(() => localStorage.clear());
await abrir();

const leer = () => p.evaluate(() => {
  const t = (id) => document.getElementById(id)?.textContent.replace(/\s+/g, ' ').trim();
  const ex = document.body.classList.contains('exhibicion');
  const control = `slider ${t('wip-valor')} (${t('wip-nota')}) · terminadas ${t('m-hechas')} · colillas ${t('m-colillas')} · cafés ${t('m-cafes')} · tiempo ${t('m-tiempo')} · eficiencia ${t('m-eficiencia')} de cada hora · estrés ${t('m-estres')}`;
  const visibles = getComputedStyle(document.querySelector('.cifras')).display !== 'none';
  const cifras = [...document.querySelectorAll('.cifra')].filter((c) => visibles && getComputedStyle(c).display !== 'none').map((c) => `${c.querySelector('.cifra-label').textContent} ${c.querySelector('.cifra-valor').textContent.replace(/\s+/g, ' ').trim()}`);
  const lectura = getComputedStyle(document.querySelector('.cerebro-lectura')).display !== 'none' ? `${t('c-activas')} neuronas encendidas` : '';
  const panel = [lectura, visibles ? `${t('cifras-titulo')}${cifras.length ? `: ${cifras.join(' · ')}` : ' (sin números)'}` : ''].filter(Boolean).join(' · ');
  const zonas = `${t('zonas-titulo')} (${t('zonas-sub')}): ${[...document.querySelectorAll('.grupo')].map((li) => li.innerText.replace(/\s+/g, ' ')).join(' · ')}`;
  return `${ex ? `aviso "${t('ex-inicio')}" · mosca "${t('ex-mosca-hace')}" ${t('ex-mosca-nivel')} ${t('ex-mosca-pct')} · rótulo "${document.querySelector('.rotulo-escena').innerText.replace(/\s+/g, ' ')}"` : control}\n     panel del cerebro → ${panel}\n     zonas → ${zonas}\n     gráfico → ${document.getElementById('lienzo-dia').getAttribute('aria-label')}`;
});
const foto = async (nombre) => {
  await p.mouse.move(700, 790); // sobre la escena, lejos del cerebro (no lo frena)
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${DIR}/${nombre}.png` });
};
const enVista = async (v) => {
  await p.evaluate((v) => window.__mosca.vista(v), v);
  await p.waitForTimeout(1500);
};
// Juega el día de a poco (3 minutos por paso) hasta esa hora
const jugarHasta = async (hora) => {
  const fin = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
  while (await p.evaluate((fin) => window.__mosca.estado().fraccionDelDia * 540 + 540 < fin && !window.__mosca.estado().terminado, fin)) {
    await p.evaluate(() => window.__mosca.adelantar(3));
    await p.waitForTimeout(40);
  }
  // que no quede justo a mitad de un cigarro o un café (esos tienen su foto)
  await p.evaluate(() => {
    for (let i = 0; i < 30 && (window.__mosca.estado().fumando || window.__mosca.estado().tomandoCafe); i++) window.__mosca.adelantar(1);
    window.__mosca.avanzar(3);
  });
};

// ---- Día con WIP 2 ----
await enVista('control');
await p.evaluate(() => window.__mosca.diaExhibicion(2));
await jugarHasta('13:30');
await foto('wip2-control');
console.log(`WIP 2 · control 13:30\n     ${await leer()}`);
await enVista('exhibicion');
await foto('wip2-exhibicion');
console.log(`WIP 2 · exhibición\n     ${await leer()}`);

// Café: el próximo café real del día. Para la foto se detiene el reloj del
// juego (no cuenta como tiempo perdido) y se sostiene el café un rato.
const cafesAntes = await p.evaluate(() => window.__mosca.estado().cafes);
await p.evaluate(() => window.__mosca.detenerReloj(true));
for (let i = 0; i < 240 && (await p.evaluate(() => window.__mosca.estado().cafes)) === cafesAntes; i++) await p.evaluate(() => window.__mosca.adelantar(1));
await p.evaluate(() => window.__mosca.forzar({ cafe: true }));
await p.waitForTimeout(2600); // la mosca toma la taza
await foto('cafe-exhibicion');
console.log(`Café (WIP 2) · exhibición\n     ${await leer()}`);
await enVista('control');
await p.waitForTimeout(1200);
await foto('cafe-control');
console.log(`Café (WIP 2) · control\n     ${await leer()}`);
await p.evaluate(() => { window.__mosca.forzar({ cafe: false }); window.__mosca.detenerReloj(false); });
// El resto del día con WIP 2 (queda en "Días jugados" para comparar)
await jugarHasta('18:00');
await foto('fin-wip2-control');
console.log(`Fin del día con WIP 2 · control\n     ${await leer()}`);
await enVista('exhibicion');
await foto('fin-wip2-exhibicion');
console.log(`Fin del día con WIP 2 · exhibición\n     ${await leer()}`);
await enVista('control');

// ---- Día con WIP 9 ----
await p.evaluate(() => window.__mosca.diaExhibicion(9));
await jugarHasta('13:30');
await foto('wip9-control');
console.log(`WIP 9 · control 13:30\n     ${await leer()}`);
await enVista('exhibicion');
await foto('wip9-exhibicion');
console.log(`WIP 9 · exhibición\n     ${await leer()}`);

// Fin del día con WIP 9 (después del de WIP 2)
await jugarHasta('18:00');
await foto('fin-exhibicion');
console.log(`Fin del día · exhibición\n     ${await leer()}\n     tabla: ${await p.evaluate(() => document.getElementById('ex-fin').innerText.replace(/\s+/g, ' '))}`);
await enVista('control');
await foto('fin-control');
console.log(`Fin del día · control\n     ${await leer()}`);
// Con los controles ocultos (tecla C), el resumen suma los números
await p.keyboard.press('c');
await p.waitForTimeout(1400);
await foto('fin-control-sin-controles');
console.log(`Fin del día · control sin controles\n     ${await leer()}`);
await p.keyboard.press('c');
await p.waitForTimeout(1200);

// "¿Es real?" abierto (Control)
await p.click('#btn-es-real');
await p.waitForTimeout(400);
await p.screenshot({ path: `${DIR}/es-real-control.png` });
console.log(`¿Es real?: ${await p.evaluate(() => document.getElementById('cerebro-info').innerText.replace(/\n+/g, ' | '))}`);
await p.keyboard.press('Escape');
await b.close();
console.log(`Capturas en ${DIR}/`);
