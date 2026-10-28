// Avisa a Bing (y a los buscadores que comparten IndexNow, como Yandex y
// Naver) que las páginas del sitio cambiaron (Etapa 7, 2026-10-28). Lee las
// direcciones de public/sitemap.xml y las manda en un solo pedido. Google no
// usa IndexNow: a Google se le avisa con el sitemap en Search Console.
// La clave es un archivo público en la raíz del sitio (public/<clave>.txt):
// así IndexNow sabe que el aviso viene del dueño del sitio.
// Se corre DESPUÉS de publicar (el sitio tiene que estar en vivo):
//   node scripts/indexnow.mjs            (todas las páginas del sitemap)
//   node scripts/indexnow.mjs /taller/   (solo algunas direcciones)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const SITIO = 'https://mosca.deliverycraft.ai';
const CLAVE = '1a78af90025ed0524980976e4c84799c';
const RAIZ = fileURLToPath(new URL('..', import.meta.url));

let direcciones = process.argv.slice(2).map((r) => (r.startsWith('http') ? r : SITIO + r));
if (!direcciones.length) {
  const sitemap = readFileSync(join(RAIZ, 'public/sitemap.xml'), 'utf8');
  direcciones = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
if (!direcciones.length) throw new Error('no hay direcciones: ¿existe public/sitemap.xml? (node scripts/sitemap.mjs)');

// Antes de avisar, comprobar que la clave está publicada (si no, IndexNow la rechaza)
const clave = await fetch(`${SITIO}/${CLAVE}.txt`);
if (!clave.ok || (await clave.text()).trim() !== CLAVE) {
  console.error(`La clave no está en vivo en ${SITIO}/${CLAVE}.txt (responde ${clave.status}). ¿Ya se publicó el sitio?`);
  process.exit(1);
}
const respuesta = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'mosca.deliverycraft.ai', key: CLAVE, keyLocation: `${SITIO}/${CLAVE}.txt`, urlList: direcciones }),
});
console.log(`IndexNow respondió ${respuesta.status} ${respuesta.statusText} para ${direcciones.length} direcciones`);
console.log('  200 u OK = recibido · 202 = recibido, la clave se valida después · 4xx = revisar la clave o las direcciones');
for (const d of direcciones) console.log('  ', d);
process.exit(respuesta.ok ? 0 : 1);
