// Valida los datos estructurados (JSON-LD, schema.org) de todas las páginas
// del sitio contra el vocabulario oficial de schema.org (Etapa 7,
// 2026-10-28). Revisa que cada @type exista, que cada propiedad exista y
// sirva para ese tipo (o uno de sus padres), que las referencias "@id"
// apunten a algo definido en la misma página, que las direcciones sean
// absolutas y que los tipos que usamos lleven lo mínimo que piden los
// buscadores (Article: headline, author, datePublished…).
// El vocabulario se baja una vez a node_modules/.cache/ (unos 7 MB).
//   node scripts/validar-datos.mjs            (las páginas de dist/)
//   node scripts/validar-datos.mjs fuentes    (los HTML de la carpeta del proyecto)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VOCABULARIO_URL = 'https://schema.org/version/latest/schemaorg-current-https.jsonld';
const CACHE = join(RAIZ, 'node_modules/.cache/schemaorg-current-https.jsonld');
const DESDE_FUENTES = process.argv[2] === 'fuentes';
const BASE = DESDE_FUENTES ? RAIZ : join(RAIZ, 'dist');
const PAGINAS = [
  'index.html', 'en/index.html', 'jugar/index.html', 'creditos/index.html',
  'limite-wip/index.html', 'en/wip-limit/index.html', 'informe/index.html',
  'en/report/index.html', 'taller/index.html', 'en/workshop/index.html', '404.html',
];
// Lo mínimo que pedimos por tipo (lo que Google documenta para sus resultados
// enriquecidos, más lo que necesita cualquier lector para entender el nodo).
const MINIMO = {
  Article: ['headline', 'author', 'datePublished', 'dateModified', 'inLanguage'],
  Dataset: ['name', 'description', 'license', 'distribution', 'creator'],
  DataDownload: ['contentUrl', 'encodingFormat'],
  VideoGame: ['name', 'url', 'inLanguage'],
  BreadcrumbList: ['itemListElement'],
  ListItem: ['position', 'name'],
  Person: ['name'],
  Organization: ['name'],
  WebSite: ['name', 'url'],
  WebPage: ['name', 'url'],
};

async function vocabulario() {
  if (!existsSync(CACHE)) {
    mkdirSync(join(RAIZ, 'node_modules/.cache'), { recursive: true });
    const r = await fetch(VOCABULARIO_URL);
    if (!r.ok) throw new Error(`no pude bajar el vocabulario (${r.status})`);
    writeFileSync(CACHE, await r.text());
  }
  const graph = JSON.parse(readFileSync(CACHE, 'utf8'))['@graph'];
  const clases = new Map();      // nombre → [padres]
  const propiedades = new Map(); // nombre → [tipos que la aceptan]
  const lista = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const nombre = (x) => (typeof x === 'string' ? x : x['@id']).replace('schema:', '');
  for (const n of graph) {
    const tipos = lista(n['@type']);
    const id = nombre(n);
    if (tipos.includes('rdfs:Class')) clases.set(id, lista(n['rdfs:subClassOf']).map(nombre));
    if (tipos.includes('rdf:Property')) propiedades.set(id, lista(n['schema:domainIncludes']).map(nombre));
  }
  return { clases, propiedades };
}

function ancestros(clases, tipo, vistos = new Set()) {
  if (vistos.has(tipo)) return vistos;
  vistos.add(tipo);
  for (const p of clases.get(tipo) ?? []) ancestros(clases, p, vistos);
  return vistos;
}

const { clases, propiedades } = await vocabulario();
const PROPIEDADES_UNIVERSALES = new Set(['@context', '@type', '@id', '@graph', '@language', '@value']);
let errores = 0;
let nodos = 0;

for (const pagina of PAGINAS) {
  const ruta = join(BASE, pagina);
  if (!existsSync(ruta)) { console.log(`✖ ${pagina}: no existe en ${BASE}`); errores++; continue; }
  const html = readFileSync(ruta, 'utf8');
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const problemas = [];
  const definidos = new Set();
  const referidos = new Set();
  const nodosDePagina = [];
  for (const b of bloques) {
    let json;
    try { json = JSON.parse(b); } catch (e) { problemas.push(`JSON inválido: ${e.message}`); continue; }
    const raiz = Array.isArray(json) ? json : [json];
    for (const r of raiz) {
      if (r['@context'] !== 'https://schema.org') problemas.push(`@context debe ser https://schema.org (es ${JSON.stringify(r['@context'])})`);
      const items = r['@graph'] ?? [r];
      for (const it of items) recorrer(it, 'raíz');
    }
  }
  function recorrer(nodo, camino) {
    if (nodo == null || typeof nodo !== 'object' || Array.isArray(nodo)) return;
    const claves = Object.keys(nodo);
    if (claves.length === 1 && nodo['@id']) { referidos.add(nodo['@id']); return; } // referencia
    if (!nodo['@type']) { problemas.push(`${camino}: nodo sin @type`); return; }
    nodos++;
    const tipos = Array.isArray(nodo['@type']) ? nodo['@type'] : [nodo['@type']];
    if (nodo['@id']) definidos.add(nodo['@id']);
    const familia = new Set();
    for (const t of tipos) {
      if (!clases.has(t)) { problemas.push(`${camino}: el tipo "${t}" no existe en schema.org`); continue; }
      for (const a of ancestros(clases, t)) familia.add(a);
      for (const p of MINIMO[t] ?? []) if (nodo[p] == null) problemas.push(`${camino} (${t}): falta "${p}"`);
    }
    for (const k of claves) {
      if (PROPIEDADES_UNIVERSALES.has(k)) continue;
      if (!propiedades.has(k)) { problemas.push(`${camino} (${tipos.join('/')}): la propiedad "${k}" no existe en schema.org`); continue; }
      const dominios = propiedades.get(k);
      if (dominios.length && !dominios.some((d) => familia.has(d))) problemas.push(`${camino} (${tipos.join('/')}): "${k}" no sirve para este tipo (sirve para ${dominios.join(', ')})`);
      const v = nodo[k];
      for (const x of Array.isArray(v) ? v : [v]) {
        if (typeof x === 'string' && /^(url|contentUrl|sameAs|image|license|thumbnailUrl|logo)$/.test(k) && !/^https:\/\//.test(x)) problemas.push(`${camino}: "${k}" no es una dirección absoluta https (${x})`);
        if (typeof x === 'string' && /^https?:\/\/[^/]*vercel\.app/.test(x)) problemas.push(`${camino}: "${k}" apunta a vercel.app (${x})`);
        recorrer(x, `${camino} › ${k}`);
      }
    }
  }
  for (const r of referidos) if (!definidos.has(r)) problemas.push(`referencia "${r}" a un nodo que no está definido en esta página`);
  const noindex = /name="robots" content="[^"]*noindex/.test(html);
  if (noindex && bloques.length) problemas.push('página con noindex no debería llevar datos estructurados');
  if (!noindex && !bloques.length && !/creditos/.test(pagina)) problemas.push('sin datos estructurados');
  if (problemas.length) { errores += problemas.length; console.log(`✖ ${pagina}`); for (const p of problemas) console.log(`   ${p}`); }
  else console.log(`ok  ${pagina} (${bloques.length} bloque${bloques.length === 1 ? '' : 's'})`);
}
console.log(errores ? `\n${errores} problema${errores === 1 ? '' : 's'} en los datos estructurados` : `\ndatos estructurados: todo bien (${nodos} nodos revisados contra el vocabulario de schema.org)`);
process.exit(errores ? 1 : 0);
