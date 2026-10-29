// Revisa los íconos y las vistas previas de todo el sitio (2026-10-29): las
// imágenes que muestran WhatsApp, LinkedIn y los buscadores al pegar un enlace,
// y los íconos de la pestaña, el iPhone y Android. En cada página (las 10 y la
// 404) revisa:
//  - que enlace los íconos y la vista previa con la fecha de scripts/sello.mjs
//    en el nombre, sin ningún nombre viejo (ni ?v=), con og:image y
//    twitter:image iguales, y la misma imagen en los datos estructurados;
//  - que cada archivo responda 200 con su tipo y su tamaño (1200×630, 180,
//    192, 512) y sea igual al de public/ (así se sabe que lo publicado es lo
//    nuevo);
//  - que tenga el logo «La asomada»: el amarillo del post-it en el ícono y en
//    el rincón del logo de la vista previa (el logo antiguo no tenía amarillo);
//  - que el manifest enlace sus tres íconos con la fecha, y que /favicon.ico y
//    /apple-touch-icon.png (los nombres de siempre, que algunas apps piden sin
//    leer la página) tengan el mismo dibujo que los de la fecha.
// Uso: node scripts/probar-iconos.mjs [dirección]
//   después de npm run build y con npx vite preview: http://localhost:4173/
//   con npm run dev: http://localhost:5173/ · el sitio: https://mosca.deliverycraft.ai/
// Debe decir "íconos y vistas previas: todo bien".
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { ICONOS, SELLO, VISTAS_PREVIAS, vistaPrevia } from './sello.mjs';

const SITIO = 'https://mosca.deliverycraft.ai/';
const DIRECCION = (process.argv[2] ?? 'http://localhost:4173/').replace(/\/?$/, '/');
const PAGINAS = ['', 'en/', 'jugar/', 'creditos/', 'limite-wip/', 'en/wip-limit/', 'informe/', 'en/report/', 'taller/', 'en/workshop/', '404.html'];
// Los nombres de antes del 2026-10-29 (o con ?v=): ninguna página debe usarlos
const VIEJO = /vista-previa(-[a-z-]+)?\.jpg|\/favicon\.(ico|svg)|\/apple-touch-icon\.png|icono-(192|512|mascara)\.png|\.(ico|svg|png|jpg)\?v=/;

const problemas = [];
const avisar = (p) => {
  problemas.push(p);
  console.log('  ✗', p);
};
// Una dirección del sitio publicado se revisa en la dirección que se prueba
const aqui = (url) => (url.startsWith(SITIO) ? DIRECCION + url.slice(SITIO.length) : new URL(url, DIRECCION).href);
const ruta = (url) => new URL(url).pathname;

// Lo que dicen los <link> y <meta> de una página, y las imágenes de sus datos estructurados
function leerCabeza(html) {
  const atributo = (etiqueta, nombre) => etiqueta.match(new RegExp(`\\s${nombre}="([^"]*)"`))?.[1];
  const etiquetas = [...html.matchAll(/<(link|meta)\s[^>]*>/g)].map((m) => m[0]);
  const enlaces = (rel) => etiquetas.filter((e) => e.startsWith('<link') && atributo(e, 'rel') === rel).map((e) => atributo(e, 'href'));
  const meta = (clave, valor) => etiquetas.filter((e) => atributo(e, clave) === valor).map((e) => atributo(e, 'content'));
  const enDatos = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const recorrer = (v) => {
      if (typeof v === 'string') { if (/\.(jpg|png|ico|svg)$/.test(v)) enDatos.push(v); }
      else if (v && typeof v === 'object') Object.values(v).forEach(recorrer);
    };
    try { recorrer(JSON.parse(m[1])); } catch { enDatos.push('(datos estructurados que no son JSON)'); }
  }
  return {
    iconos: enlaces('icon'),
    iphone: enlaces('apple-touch-icon'),
    manifest: enlaces('manifest'),
    og: meta('property', 'og:image'),
    twitter: meta('name', 'twitter:image'),
    enDatos,
    // Todo lo que la página enlaza, también fuera del <head>
    todo: [...html.matchAll(/\s(?:href|src|content|poster|srcset)="([^"]*)"/g)].map((m) => m[1]),
  };
}

const navegador = await chromium.launch();
const hoja = await navegador.newPage();
// Ancho, alto y cuántos puntos amarillos (el post-it) hay en un rincón del dibujo
async function medir(bytes, tipo, rincon) {
  return hoja.evaluate(async ({ datos, tipo, rincon }) => {
    const img = new Image();
    img.src = `data:${tipo};base64,${datos}`;
    await img.decode();
    const lienzo = document.createElement('canvas');
    lienzo.width = img.naturalWidth || 512;
    lienzo.height = img.naturalHeight || 512;
    const c = lienzo.getContext('2d');
    c.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    const [x0, y0, x1, y1] = rincon ?? [0, 0, lienzo.width, lienzo.height];
    const d = c.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    let amarillo = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128 && d[i] >= 200 && d[i + 1] >= 160 && d[i + 2] <= 140 && d[i] - d[i + 2] >= 90) amarillo++;
    return { ancho: img.naturalWidth, alto: img.naturalHeight, amarillo };
  }, { datos: Buffer.from(bytes).toString('base64'), tipo, rincon });
}

const revisados = new Map();
// Baja un archivo y lo revisa: 200, tipo, igual a public/, tamaño y el amarillo del post-it
async function revisarArchivo(url, { de, tipo, ancho, alto, rincon, minAmarillo }) {
  const clave = `${url}|${ancho}`;
  if (revisados.has(clave)) return revisados.get(clave);
  let r;
  try {
    r = await fetch(aqui(url), { redirect: 'manual' });
  } catch (e) {
    avisar(`${de}: ${url} no responde (${e.message})`);
    revisados.set(clave, null);
    return null;
  }
  if (r.status !== 200) {
    avisar(`${de}: ${url} responde ${r.status}`);
    revisados.set(clave, null);
    return null;
  }
  const tipoRecibido = r.headers.get('content-type') ?? '';
  if (!tipo.test(tipoRecibido)) avisar(`${de}: ${url} llega como "${tipoRecibido}"`);
  const bytes = Buffer.from(await r.arrayBuffer());
  const local = `public${ruta(aqui(url))}`;
  if (!existsSync(local)) avisar(`${de}: ${url} no está en ${local}`);
  else if (!bytes.equals(readFileSync(local))) avisar(`${de}: ${url} no es igual a ${local} (¿falta subir los cambios al sitio?)`);
  if (minAmarillo !== undefined) {
    const formato = /svg/.test(tipoRecibido) ? 'image/svg+xml' : /icon/.test(tipoRecibido) ? 'image/x-icon' : /png/.test(tipoRecibido) ? 'image/png' : 'image/jpeg';
    const m = await medir(bytes, formato, rincon);
    if (ancho && (m.ancho !== ancho || m.alto !== alto)) avisar(`${de}: ${url} mide ${m.ancho}×${m.alto} y debía medir ${ancho}×${alto}`);
    if (m.amarillo < minAmarillo) avisar(`${de}: ${url} no tiene el logo «La asomada» (${m.amarillo} puntos del amarillo del post-it; se esperaban ${minAmarillo} o más)`);
  }
  revisados.set(clave, bytes);
  return bytes;
}

// La vista previa: 1200×630, con el logo en el rincón de arriba a la izquierda
const VISTA = { tipo: /image\/jpeg/, ancho: 1200, alto: 630, rincon: [40, 100, 320, 380], minAmarillo: 300 };
const ICONO = { tipo: /image\/(png|svg\+xml|x-icon|vnd\.microsoft\.icon)/, minAmarillo: 30 };

for (const p of PAGINAS) {
  const de = p === '' ? 'portada' : p.replace(/\/$/, '');
  const antes = problemas.length;
  const r = await fetch(DIRECCION + p);
  if (r.status !== 200) {
    avisar(`${de}: la página responde ${r.status}`);
    continue;
  }
  const cabeza = leerCabeza(await r.text());
  const viejos = [...cabeza.todo, ...cabeza.enDatos].filter((v) => VIEJO.test(v));
  for (const v of viejos) avisar(`${de}: todavía usa un nombre viejo: ${v}`);
  // Íconos: el .ico, el .svg y el del iPhone, con la fecha
  const esperados = [ICONOS.ico, ICONOS.svg];
  for (const e of esperados) if (!cabeza.iconos.some((h) => ruta(aqui(h)) === e)) avisar(`${de}: falta el ícono ${e} (tiene ${cabeza.iconos.join(', ') || 'ninguno'})`);
  if (cabeza.iphone.length !== 1 || ruta(aqui(cabeza.iphone[0])) !== ICONOS.iphone) avisar(`${de}: el ícono del iPhone debía ser ${ICONOS.iphone} (tiene ${cabeza.iphone.join(', ') || 'ninguno'})`);
  if (cabeza.manifest.length !== 1) avisar(`${de}: debía tener un manifest (tiene ${cabeza.manifest.length})`);
  for (const h of [...cabeza.iconos, ...cabeza.iphone]) await revisarArchivo(h, { de, ...ICONO, ...(h.endsWith('.png') ? { ancho: 180, alto: 180 } : {}) });
  // La vista previa: og:image y twitter:image, la misma, con la fecha
  if (cabeza.og.length !== 1) avisar(`${de}: debía tener un og:image (tiene ${cabeza.og.length})`);
  if (cabeza.twitter.length !== 1) avisar(`${de}: debía tener un twitter:image (tiene ${cabeza.twitter.length})`);
  const vista = cabeza.og[0];
  if (vista) {
    if (!VISTAS_PREVIAS.some((v) => vista === SITIO.slice(0, -1) + vistaPrevia(v))) avisar(`${de}: og:image no es una vista previa con la fecha ${SELLO}: ${vista}`);
    if (cabeza.twitter[0] && cabeza.twitter[0] !== vista) avisar(`${de}: twitter:image (${cabeza.twitter[0]}) no es igual a og:image (${vista})`);
    for (const d of cabeza.enDatos.filter((d) => d.includes('/vista-previa'))) if (d !== vista) avisar(`${de}: los datos estructurados usan ${d} y og:image es ${vista}`);
    if (p.startsWith('en/') && !/vista-previa-(en|wip-limit|report|workshop)-/.test(vista)) avisar(`${de}: la página en inglés usa la vista previa en español (${vista})`);
    await revisarArchivo(vista, { de, ...VISTA });
  }
  if (problemas.length === antes) console.log(`  ✓ ${de}: ${vista.replace(SITIO, '/')}`);
}

// El manifest: sus tres íconos, con la fecha
const manifest = await fetch(`${DIRECCION}manifest.webmanifest`);
if (manifest.status !== 200) avisar(`manifest: responde ${manifest.status}`);
else {
  if (!/manifest\+json|application\/json/.test(manifest.headers.get('content-type') ?? '')) avisar(`manifest: llega como "${manifest.headers.get('content-type')}"`);
  const antes = problemas.length;
  const { icons = [] } = await manifest.json();
  const esperados = [ICONOS.android, ICONOS.androidGrande, ICONOS.mascara];
  for (const e of esperados) if (!icons.some((i) => i.src === e)) avisar(`manifest: falta el ícono ${e}`);
  for (const i of icons) {
    if (!i.src.includes(SELLO)) avisar(`manifest: el ícono ${i.src} no tiene la fecha ${SELLO}`);
    const [ancho, alto] = i.sizes.split('x').map(Number);
    await revisarArchivo(i.src, { de: 'manifest', ...ICONO, ancho, alto });
  }
  if (problemas.length === antes) console.log(`  ✓ manifest: ${icons.map((i) => i.src).join(', ')}`);
}

// Los nombres de siempre: el mismo dibujo que los de la fecha
for (const [comun, conFecha, lado] of [['/favicon.ico', ICONOS.ico], ['/apple-touch-icon.png', ICONOS.iphone, 180]]) {
  const medidas = lado ? { ancho: lado, alto: lado } : {};
  const a = await revisarArchivo(comun, { de: 'nombres de siempre', ...ICONO, ...medidas });
  const b = await revisarArchivo(conFecha, { de: 'nombres de siempre', ...ICONO, ...medidas });
  if (a && b && !a.equals(b)) avisar(`${comun} no tiene el mismo dibujo que ${conFecha}`);
  else if (a && b) console.log(`  ✓ ${comun} = ${conFecha}`);
}

// En public/ no quedan los archivos con los nombres viejos (salvo los de siempre)
for (const v of ['', ...VISTAS_PREVIAS.filter((v) => v !== 'portada').map((v) => `-${v}`)]) if (existsSync(`public/img/vista-previa${v}.jpg`)) avisar(`quedó public/img/vista-previa${v}.jpg (nombre viejo)`);
for (const v of ['icono-192', 'icono-512', 'icono-mascara']) if (existsSync(`public/${v}.png`)) avisar(`quedó public/${v}.png (nombre viejo)`);

await navegador.close();
console.log(problemas.length ? `\níconos y vistas previas: ${problemas.length} problema(s)` : '\níconos y vistas previas: todo bien');
process.exit(problemas.length ? 1 : 0);
