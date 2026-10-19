// Capturas del panel del cerebro (Etapa 3.3): WIP 3, WIP 9 y café, en
// Control y en Exhibición, a media jornada; una con la tarjetita de una
// neurona abierta (fija con un clic) y otra con el cerebro detenido y con
// zoom. Juega la mañana de a poco para que el gráfico "Actividad del día"
// tenga su línea. Guarda la pantalla completa y el panel recortado, e imprime
// lo que dice el panel.
// Requiere npm run dev.
// Uso: ETIQUETA=v2 node scripts/capturas-cerebro.mjs   (carpeta capturas/etapa3-3/<ETIQUETA>)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const ETIQUETA = process.env.ETIQUETA ?? 'v2';
const DIR = `capturas/etapa3-3/${ETIQUETA}`;
mkdirSync(DIR, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1512, height: 860 } });
p.on('pageerror', (e) => console.log('ERROR', e.message));
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('PCFSoft')) console.log('CONSOLA', m.text()); });
const abrir = async () => {
  await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__mosca && window.__mosca.cerebro());
};
await abrir();
await p.evaluate(() => ['mosca-del-wip-dias', 'mosca-del-wip-cerebro-oculto', 'mosca-del-wip-controles-oculto'].forEach((k) => localStorage.removeItem(k)));
await abrir();

const leer = () => p.evaluate(() => {
  const t = (id) => document.getElementById(id)?.textContent.trim();
  const cadena = [...document.querySelectorAll('#cerebro-cadena li')].map((li) => `${li.querySelector('.paso-nombre').textContent}${li.classList.contains('encendido') ? (li.classList.contains('debil') ? ' (débil)' : ' ✓') : ' ·'}`);
  const zonas = [...document.querySelectorAll('#cerebro-grupos .grupo')].map((li) => `${li.querySelector('.grupo-nombre').textContent.trim()} ${li.querySelector('.grupo-valor').textContent.trim()}`);
  return `limpieza ${t('c-limpieza')} · activas ${t('c-activas')} · estado ${t('c-estado')} · cadena [${cadena.join(' → ')}]\n     zonas [${zonas.join(' · ')}] · día: ${t('cerebro-dia-pico')}\n     frase: "${t('cerebro-lectura')}"`;
});
const panel = (nombre) => p.locator('#cerebro').screenshot({ path: `${DIR}/${nombre}-panel.png` });
// Juega la mañana de a poco (el gráfico registra la limpieza en cada momento)
const jugarHasta = async (w, minutos) => {
  await p.evaluate((w) => window.__mosca.diaExhibicion(w), w);
  for (let m = 0; m < minutos; m += 3) {
    await p.evaluate(() => window.__mosca.adelantar(3));
    await p.waitForTimeout(140);
  }
  // Que no quede justo en un café (ese momento tiene su propia captura)
  await p.evaluate(() => {
    while (window.__mosca.estado().tomandoCafe) window.__mosca.adelantar(1);
    window.__mosca.avanzar(4);
  });
};

for (const w of [3, 9]) {
  await p.evaluate(() => window.__mosca.vista('control'));
  await p.waitForTimeout(600);
  await jugarHasta(w, 270);
  await p.mouse.move(700, 500);
  await p.waitForTimeout(2200);
  // si justo partió un café en vivo, espera a que termine
  for (let i = 0; i < 10 && (await p.textContent('#c-estado')) === 'Café'; i++) await p.waitForTimeout(1200);
  await p.waitForTimeout(1200);
  console.log(`WIP ${w} · control 13:30 → ${await leer()}`);
  await p.screenshot({ path: `${DIR}/wip${w}-control.png` });
  await panel(`wip${w}-control`);
  await p.evaluate(() => window.__mosca.vista('exhibicion'));
  await p.waitForTimeout(2200);
  console.log(`WIP ${w} · exhibición   → ${await leer()}`);
  await p.screenshot({ path: `${DIR}/wip${w}-exhibicion.png` });
  await panel(`wip${w}-exhibicion`);
}

// Café (pausa sana, sólo con poco estrés): WIP 2 y un café forzado
await p.evaluate(() => window.__mosca.vista('control'));
await p.waitForTimeout(600);
await jugarHasta(2, 200);
await p.evaluate(() => { window.__mosca.forzar({ cafe: true }); window.__mosca.avanzar(1.2); });
await p.waitForTimeout(1800);
console.log(`WIP 2 · café control    → ${await leer()}`);
await p.screenshot({ path: `${DIR}/cafe-control.png` });
await panel('cafe-control');
await p.evaluate(() => window.__mosca.vista('exhibicion'));
await p.waitForTimeout(1800);
await p.evaluate(() => window.__mosca.forzar({ cafe: true }));
await p.waitForTimeout(1500);
console.log(`WIP 2 · café exhibición → ${await leer()}`);
await p.screenshot({ path: `${DIR}/cafe-exhibicion.png` });
await panel('cafe-exhibicion');
await p.evaluate(() => window.__mosca.forzar({ cafe: false }));

// Tarjetita fija: en Exhibición con WIP 9, un clic sobre aBN1 (el relevo)
await p.evaluate(() => window.__mosca.vista('exhibicion'));
await p.waitForTimeout(600);
await jugarHasta(9, 270);
await p.waitForTimeout(2000);
const donde = await p.evaluate(() => window.__mosca.cerebroDonde(2));
await p.mouse.move(donde.x, donde.y);
await p.waitForTimeout(100);
const donde2 = await p.evaluate(() => window.__mosca.cerebroDonde(2));
await p.mouse.click(donde2.x, donde2.y);
await p.waitForTimeout(600);
console.log(`tarjetita: "${await p.evaluate(() => document.getElementById('cerebro-ficha').innerText.replace(/\n/g, ' | '))}" · girando: ${(await p.evaluate(() => window.__mosca.cerebroVista())).girando}`);
await p.screenshot({ path: `${DIR}/tarjetita-exhibicion.png` });

// Detenido y con zoom: en Control con WIP 9 (un clic en un lugar vacío, rueda)
await p.mouse.click(donde2.x, donde2.y); // suelta la tarjetita y vuelve a girar
await p.evaluate(() => window.__mosca.vista('control'));
await p.waitForTimeout(1500);
const caja = await p.locator('#lienzo-cerebro').boundingBox();
await p.mouse.click(caja.x + 12, caja.y + 12);
await p.mouse.move(caja.x + caja.width / 2, caja.y + caja.height * 0.35);
await p.mouse.wheel(0, -260);
await p.waitForTimeout(800);
await p.mouse.move(700, 500);
await p.waitForTimeout(400);
const vista = await p.evaluate(() => window.__mosca.cerebroVista());
console.log(`detenido con zoom: girando ${vista.girando} · zoom ${vista.zoom.toFixed(2)} · botón "${await p.textContent('#btn-girar-texto')}"`);
await p.screenshot({ path: `${DIR}/detenido-zoom-control.png` });
await panel('detenido-zoom-control');

// La explicación ⓘ abierta (Control)
await p.click('#btn-info-cerebro');
await p.waitForTimeout(400);
await p.screenshot({ path: `${DIR}/info-control.png` });
await b.close();
console.log(`Capturas en ${DIR}/`);
