// Prueba de las páginas de lectura (Etapa 7, 2026-10-28): la guía, el informe en
// la web, el taller, sus versiones en inglés y la 404, en computador y celular.
// Revisa en cada una: el título y la descripción (largo razonable), un solo H1,
// el canonical y los hreflang, el idioma del <html>, que los datos estructurados
// sean JSON válido con tipos de schema.org, que los enlaces internos existan
// (responden 200), que toda imagen tenga alt, que no haya barra horizontal ni
// errores en la consola, y deja capturas en capturas/paginas/.
// Con npm run dev: node scripts/probar-paginas.mjs [dirección]
// (por defecto http://localhost:5173/). Debe decir "páginas: todo bien".
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const DIRECCION = (process.argv[2] ?? 'http://localhost:5173/').replace(/\/?$/, '/');
const CAPTURAS = process.env.CAPTURAS ?? 'capturas/paginas';
mkdirSync(CAPTURAS, { recursive: true });

const PAGINAS = [
  { ruta: 'limite-wip/', idioma: 'es', nombre: 'guia-es', tipos: ['Article', 'BreadcrumbList', 'Dataset'] },
  { ruta: 'en/wip-limit/', idioma: 'en', nombre: 'guia-en', tipos: ['Article', 'BreadcrumbList', 'Dataset'] },
  { ruta: 'informe/', idioma: 'es', nombre: 'informe-es', tipos: ['Article', 'BreadcrumbList'] },
  { ruta: 'en/report/', idioma: 'en', nombre: 'informe-en', tipos: ['Article', 'BreadcrumbList'] },
  { ruta: 'taller/', idioma: 'es', nombre: 'taller-es', tipos: ['Article', 'BreadcrumbList'] },
  { ruta: 'en/workshop/', idioma: 'en', nombre: 'taller-en', tipos: ['Article', 'BreadcrumbList'] },
  { ruta: '404.html', idioma: 'es', nombre: '404', tipos: [], sinIndexar: true },
];
const PANTALLAS = [
  { nombre: 'computador', ancho: 1440, alto: 900 },
  { nombre: 'celular', ancho: 390, alto: 844, movil: true },
];

const problemas = [];
const avisar = (p) => {
  problemas.push(p);
  console.log('  ✗', p);
};
const existe = new Map();
async function responde(url) {
  if (!existe.has(url)) {
    try {
      const r = await fetch(url, { method: 'GET', redirect: 'manual' });
      existe.set(url, r.status);
    } catch {
      existe.set(url, 0);
    }
  }
  return existe.get(url);
}

const navegador = await chromium.launch();
for (const pantalla of PANTALLAS) {
  const contexto = await navegador.newContext({
    viewport: { width: pantalla.ancho, height: pantalla.alto },
    isMobile: !!pantalla.movil,
    hasTouch: !!pantalla.movil,
    deviceScaleFactor: pantalla.movil ? 2 : 1,
  });
  // El contador de visitas de Vercel solo existe en el sitio publicado: en
  // npx vite preview responde 404 (un error que no es de la página). La consola
  // no dice qué dirección falló, así que se reemplaza por un archivo vacío.
  // (revisión final, fase 2, 2026-11-15) Desde ahora también contra el sitio
  // publicado y para todo /_vercel/. Antes, ahí el contador se cargaba en cada
  // página que abre esta prueba, y no sumaba visitas solo si notaba que el
  // navegador es automático.
  await contexto.route('**/_vercel/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  for (const pagina of PAGINAS) {
    const p = await contexto.newPage();
    const errores = [];
    p.on('pageerror', (e) => errores.push(e.message));
    p.on('console', (m) => {
      if (m.type() === 'error' && !/_vercel\/insights|favicon/.test(m.text())) errores.push(m.text());
    });
    const url = DIRECCION + pagina.ruta;
    console.log(`${pantalla.nombre} · ${url}`);
    const respuesta = await p.goto(url, { waitUntil: 'networkidle' });
    if (!respuesta || (respuesta.status() !== 200 && !(pagina.sinIndexar && respuesta.status() === 404))) avisar(`${pagina.nombre}: responde ${respuesta?.status()}`);
    // Las fotos cargan al acercarse (loading="lazy"): para revisarlas, pedirlas todas y esperarlas
    await p.evaluate(async () => {
      const fotos = [...document.querySelectorAll('img')];
      for (const i of fotos) i.loading = 'eager';
      await Promise.all(fotos.map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; }))));
    });
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(300);

    const datos = await p.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const meta = (n) => q(`meta[name="${n}"]`)?.content ?? q(`meta[property="${n}"]`)?.content ?? null;
      const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent);
      const enlaces = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
      const imagenes = [...document.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), ancho: i.naturalWidth }));
      const h1 = [...document.querySelectorAll('h1')].map((h) => h.textContent.trim());
      const encabezados = [...document.querySelectorAll('h1, h2, h3, h4')].map((h) => +h.tagName[1]);
      return {
        titulo: document.title,
        descripcion: meta('description'),
        lang: document.documentElement.lang,
        idiomaPagina: document.documentElement.dataset.idiomaPagina,
        canonical: q('link[rel="canonical"]')?.href ?? null,
        hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => `${l.hreflang}=${l.href}`),
        ogImage: meta('og:image'),
        robots: meta('robots'),
        jsonLd,
        enlaces,
        imagenes,
        h1,
        encabezados,
        anchoDoc: document.documentElement.scrollWidth,
        anchoVentana: innerWidth,
        barraVisible: !!q('header.barra'),
        fechaVisible: !!q('time[datetime]') || !!q('.pagina-meta'),
      };
    });

    // Lo que se revisa una sola vez por página (en computador)
    if (pantalla.nombre === 'computador') {
      console.log(`  título ${datos.titulo.length} letras · descripción ${datos.descripcion?.length ?? 0} letras`);
      if (datos.titulo.length < 25 || datos.titulo.length > 75) avisar(`${pagina.nombre}: título de ${datos.titulo.length} letras: "${datos.titulo}"`);
      if (!datos.titulo.endsWith('Mosca del WIP')) avisar(`${pagina.nombre}: el título no termina en "Mosca del WIP"`);
      if (!datos.descripcion) avisar(`${pagina.nombre}: sin descripción`);
      else if (datos.descripcion.length < 80 || datos.descripcion.length > 190) avisar(`${pagina.nombre}: descripción de ${datos.descripcion.length} letras`);
      if (datos.lang !== pagina.idioma || datos.idiomaPagina !== pagina.idioma) avisar(`${pagina.nombre}: lang=${datos.lang} data-idioma-pagina=${datos.idiomaPagina}`);
      if (pagina.sinIndexar) {
        if (datos.robots !== 'noindex') avisar(`${pagina.nombre}: debería llevar noindex`);
        if (datos.canonical) avisar(`${pagina.nombre}: la 404 no debería tener canonical`);
      } else {
        const esperado = `https://mosca.deliverycraft.ai/${pagina.ruta}`;
        if (datos.canonical !== esperado) avisar(`${pagina.nombre}: canonical ${datos.canonical} (esperaba ${esperado})`);
        const hl = Object.fromEntries(datos.hreflang.map((h) => h.split('=')));
        if (!hl.es || !hl.en || !hl['x-default']) avisar(`${pagina.nombre}: faltan hreflang (${datos.hreflang.join(' ')})`);
        if (hl['x-default'] !== hl.es) avisar(`${pagina.nombre}: x-default debería ser la versión en español`);
        if (hl[pagina.idioma] !== esperado) avisar(`${pagina.nombre}: el hreflang ${pagina.idioma} no apunta a esta página`);
        if (!datos.ogImage || !datos.ogImage.startsWith('https://mosca.deliverycraft.ai/img/')) avisar(`${pagina.nombre}: og:image ${datos.ogImage}`);
        else {
          const local = DIRECCION + datos.ogImage.replace('https://mosca.deliverycraft.ai/', '');
          const estado = await responde(local);
          if (estado !== 200) avisar(`${pagina.nombre}: la vista previa ${datos.ogImage} responde ${estado}`);
        }
        if (!datos.fechaVisible) avisar(`${pagina.nombre}: sin fecha visible`);
      }
      if (datos.h1.length !== 1) avisar(`${pagina.nombre}: ${datos.h1.length} H1 (${datos.h1.join(' | ')})`);
      // Los subtítulos no se saltan un nivel (h2 → h4)
      let nivel = 1;
      for (const n of datos.encabezados) {
        if (n > nivel + 1) { avisar(`${pagina.nombre}: un h${n} después de un h${nivel}`); break; }
        nivel = n;
      }
      // Datos estructurados: JSON válido, tipos estándar, los esperados
      const tipos = new Set();
      for (const texto of datos.jsonLd) {
        try {
          const g = JSON.parse(texto);
          if (g['@context'] !== 'https://schema.org') avisar(`${pagina.nombre}: @context ${g['@context']}`);
          const nodos = g['@graph'] ?? [g];
          for (const n of nodos) {
            if (!n['@type']) avisar(`${pagina.nombre}: un nodo sin @type`);
            tipos.add(n['@type']);
            if (n['@type'] === 'Article' && !(n.author && n.datePublished && n.dateModified && n.headline)) avisar(`${pagina.nombre}: Article sin autor, fechas o headline`);
            if (n['@type'] === 'Dataset' && !(n.license && n.distribution?.length === 2 && n.creator)) avisar(`${pagina.nombre}: Dataset sin licencia, distribución o autor`);
            if (n['@type'] === 'BreadcrumbList' && !(n.itemListElement?.length >= 2)) avisar(`${pagina.nombre}: BreadcrumbList corta`);
          }
        } catch (e) {
          avisar(`${pagina.nombre}: datos estructurados inválidos: ${e.message}`);
        }
      }
      for (const t of pagina.tipos) if (!tipos.has(t)) avisar(`${pagina.nombre}: falta el tipo ${t} en los datos estructurados`);
      if (pagina.sinIndexar && datos.jsonLd.length && tipos.size) avisar(`${pagina.nombre}: la 404 lleva datos estructurados (${[...tipos].join(', ')})`);
      // Imágenes con alt
      for (const i of datos.imagenes) {
        if (i.alt === null) avisar(`${pagina.nombre}: imagen sin alt: ${i.src}`);
        if (i.ancho === 0 && !i.src.startsWith('data:')) avisar(`${pagina.nombre}: imagen que no carga: ${i.src}`);
      }
      // Enlaces internos que existen
      const internos = [...new Set(datos.enlaces.filter((h) => h.startsWith('/') && !h.startsWith('//')))];
      for (const h of internos) {
        const limpio = h.split('#')[0].split('?')[0];
        if (!limpio) continue;
        const estado = await responde(DIRECCION + limpio.replace(/^\//, ''));
        if (estado !== 200) avisar(`${pagina.nombre}: el enlace ${h} responde ${estado}`);
      }
      // Anclas de la misma página que existen
      const anclas = [...new Set(datos.enlaces.filter((h) => h.startsWith('#') && h.length > 1))];
      const faltan = await p.evaluate((ids) => ids.filter((id) => !document.getElementById(decodeURIComponent(id.slice(1)))), anclas);
      for (const a of faltan) avisar(`${pagina.nombre}: el ancla ${a} no existe en la página`);
      // Enlaces a otras páginas con ancla: que la ancla exista allá
      for (const h of datos.enlaces.filter((h) => h.startsWith('/') && h.includes('#'))) {
        const [ruta, ancla] = h.split('#');
        const otra = await contexto.newPage();
        await otra.goto(DIRECCION + ruta.replace(/^\//, ''), { waitUntil: 'domcontentloaded' });
        const hay = await otra.evaluate((id) => !!document.getElementById(id), ancla);
        if (!hay) avisar(`${pagina.nombre}: el enlace ${h} apunta a una ancla que no existe`);
        await otra.close();
      }
    }
    if (!datos.barraVisible) avisar(`${pagina.nombre} (${pantalla.nombre}): sin barra de navegación`);
    if (datos.anchoDoc > datos.anchoVentana + 1) avisar(`${pagina.nombre} (${pantalla.nombre}): barra horizontal (${datos.anchoDoc} > ${datos.anchoVentana})`);
    // Nada se sale del ancho de la ventana (tablas con marco propio aparte)
    const salidos = await p.evaluate(() => {
      const malos = [];
      for (const el of document.querySelectorAll('main *')) {
        if (el.closest('.tabla-marco, .visual, figure.grafico')) continue;
        const r = el.getBoundingClientRect();
        if (r.width && r.right > innerWidth + 1 && getComputedStyle(el).overflowX !== 'auto') malos.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} (${Math.round(r.right)})`);
        if (malos.length > 4) break;
      }
      return malos;
    });
    for (const s of salidos) avisar(`${pagina.nombre} (${pantalla.nombre}): se sale del ancho: ${s}`);
    // Letra mínima 13 px en celular
    if (pantalla.movil) {
      const chicos = await p.evaluate(() => {
        const malos = new Set();
        for (const el of document.querySelectorAll('main *')) {
          if (!el.textContent.trim() || el.children.length) continue;
          let t = parseFloat(getComputedStyle(el).fontSize);
          const svg = el.closest('svg');
          if (svg) {
            // La letra de un gráfico se ve a la escala del dibujo (viewBox → píxeles)
            const vb = svg.viewBox?.baseVal;
            if (vb && vb.width) t = t * (svg.getBoundingClientRect().width / vb.width);
            if (t < 9.5) malos.add(`texto de gráfico ${t.toFixed(1)}px`);
            continue;
          }
          if (t < 12.5) malos.add(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} ${t}px`);
        }
        return [...malos].slice(0, 5);
      });
      for (const c of chicos) avisar(`${pagina.nombre} (celular): letra chica: ${c}`);
    }
    if (errores.length) avisar(`${pagina.nombre} (${pantalla.nombre}): errores en la consola: ${errores.slice(0, 3).join(' | ')}`);
    await p.screenshot({ path: `${CAPTURAS}/${pagina.nombre}-${pantalla.nombre}.png`, fullPage: true });
    // También la primera pantalla (lo que se ve al llegar)
    await p.screenshot({ path: `${CAPTURAS}/${pagina.nombre}-${pantalla.nombre}-arriba.png` });
    await p.close();
  }
  await contexto.close();
}
await navegador.close();

console.log(problemas.length ? `\npáginas: ${problemas.length} problema(s)` : '\npáginas: todo bien');
process.exit(problemas.length ? 1 : 0);
