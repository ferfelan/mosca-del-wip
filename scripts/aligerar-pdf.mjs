// Aligera el informe para compartir (el Informe y el Report, unos 4 MB) sin
// que se note a la vista (pedido de Felipe, 2026-11-16, "la versión de 2,73
// MB, la que no se nota"; las pruebas están en la sección 2.7 de
// docs/etapa8-16.md y el resultado en docs/etapa8-17.md).
// Hace dos cosas, nada más:
//   1. Las fotos JPEG guardadas a más de 315 ppi se achican a 300 ppi (lo que
//      se usa para imprimir) y se guardan en JPEG de calidad 88, con su perfil
//      de color igual. Las que ya están a 300 ppi o menos no se tocan.
//   2. Las demás imágenes (las capas del tamaño de la hoja, sus máscaras y los
//      dibujos) se vuelven a comprimir SIN PÉRDIDA, con el filtro de PNG, y
//      solo si así quedan más chicas. Los píxeles son los mismos.
// El texto, las letras, los dibujos de líneas, las propiedades y la fecha de
// creación no cambian. Comparado hoja por hoja en imagen con el original, las
// 18 hojas se ven iguales (las que tienen fotos achicadas dan más de 40 dB, que
// a la vista es lo mismo, y las demás son idénticas).
// Uso (después de armar el PDF y antes de las propiedades):
//   node scripts/aligerar-pdf.mjs <entrada.pdf> <salida.pdf>
//   y después node scripts/pdf-metadatos.mjs public/Mosca-del-WIP-Informe.pdf
//   (que le pone sus propiedades y lo deja linealizado otra vez).
// Si la entrada ya está linealizada, qpdf la entrega normal antes de leerla
// (pdf-lib pierde la fecha de creación de un PDF linealizado). Necesita
// pdfimages (poppler), magick (ImageMagick) y qpdf.
// PPI=<n> y CALIDAD=<n> cambian el máximo de ppi de las fotos y su calidad
// JPEG (por defecto 300 y 88, lo elegido; con menos ya se nota en las fotos).
import { readFileSync, writeFileSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { inflateSync, deflateSync, constants } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PDFDocument, PDFRawStream, PDFName, PDFNumber } from 'pdf-lib';

const [, , entrada, salida] = process.argv;
if (!entrada || !salida) {
  console.error('Uso: node scripts/aligerar-pdf.mjs <entrada.pdf> <salida.pdf>');
  process.exit(1);
}
const PPI = +(process.env.PPI || 300);
const CALIDAD = +(process.env.CALIDAD || 88);
const pesoAntes = statSync(entrada).size; // la salida puede ser el mismo archivo
const QPDF = ['qpdf', '/opt/homebrew/bin/qpdf', '/usr/local/bin/qpdf'].find((q) => {
  try {
    execFileSync(q, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
});
if (!QPDF) {
  console.error('Falta qpdf ("brew install qpdf"). No se tocó nada.');
  process.exit(1);
}

// Si está linealizado, una copia normal en una carpeta temporal (pdfimages y
// pdf-lib leen la misma, así los números de cada imagen coinciden)
const temporal = mkdtempSync(join(tmpdir(), 'aligerar-'));
let fuente = entrada;
if (!execFileSync(QPDF, ['--check-linearization', entrada], { encoding: 'utf8' }).includes('is not linearized')) {
  fuente = join(temporal, 'normal.pdf');
  execFileSync(QPDF, ['--deterministic-id', entrada, fuente]); // así dos corridas dan el mismo archivo
}

// Los ppi de cada foto, como los cuenta pdfimages (el mayor, si aparece en
// varias hojas)
const ppi = new Map();
for (const linea of execFileSync('pdfimages', ['-list', fuente], { encoding: 'utf8' }).split('\n').slice(2)) {
  const c = linea.trim().split(/\s+/);
  if (c.length < 15) continue;
  const objeto = +c[10];
  const x = +c[12];
  if (objeto) ppi.set(objeto, Math.max(ppi.get(objeto) || 0, x));
}

const doc = await PDFDocument.load(readFileSync(fuente), { updateMetadata: false });
const N = (n) => PDFName.of(n);

// El filtro de PNG, eligiendo el mejor para cada fila (sin pérdida)
function conFiltroPng(raw, w, h, n) {
  const fila = w * n;
  const out = Buffer.alloc((fila + 1) * h);
  let previa = Buffer.alloc(fila);
  for (let y = 0; y < h; y++) {
    const actual = raw.subarray(y * fila, (y + 1) * fila);
    let mejor = null;
    let mejorSuma = Infinity;
    let mejorTipo = 0;
    for (let t = 0; t < 5; t++) {
      const f = Buffer.alloc(fila);
      let suma = 0;
      for (let i = 0; i < fila; i++) {
        const a = i >= n ? actual[i - n] : 0;
        const b = previa[i];
        const c = i >= n ? previa[i - n] : 0;
        let p;
        if (t === 0) p = 0;
        else if (t === 1) p = a;
        else if (t === 2) p = b;
        else if (t === 3) p = (a + b) >> 1;
        else {
          const pa = Math.abs(b - c);
          const pb = Math.abs(a - c);
          const pc = Math.abs(a + b - 2 * c);
          p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }
        const v = (actual[i] - p) & 255;
        f[i] = v;
        suma += v < 128 ? v : 256 - v;
      }
      if (suma < mejorSuma) {
        mejorSuma = suma;
        mejor = f;
        mejorTipo = t;
      }
    }
    out[y * (fila + 1)] = mejorTipo;
    mejor.copy(out, y * (fila + 1) + 1);
    previa = actual;
  }
  return deflateSync(out, { level: 9, memLevel: 9, strategy: constants.Z_DEFAULT_STRATEGY });
}

const magick = (args, datos) => execFileSync('magick', args, { input: datos, maxBuffer: 1 << 28 });
const reemplazar = (ref, dict, bytes) => doc.context.assign(ref, PDFRawStream.of(dict, bytes));
let antes = 0;
let despues = 0;
let fotos = 0;
let sinPerdida = 0;

for (const [ref, obj] of [...doc.context.enumerateIndirectObjects()]) {
  if (!(obj instanceof PDFRawStream)) continue;
  const d = obj.dict;
  if (d.get(N('Subtype'))?.toString() !== '/Image') continue;
  const w = +d.get(N('Width')).toString();
  const h = +d.get(N('Height')).toString();
  const filtro = d.get(N('Filter'))?.toString();
  const color = d.get(N('ColorSpace'))?.toString();
  const bits = +(d.get(N('BitsPerComponent'))?.toString() || 8);
  const viejo = obj.contents.length;
  antes += viejo;

  // 1. Fotos JPEG con más ppi de lo que se usa: se achican
  if (filtro === '/DCTDecode') {
    const p = ppi.get(ref.objectNumber) || 0;
    if (p > PPI * 1.05) {
      const nw = Math.round((w * PPI) / p);
      const nh = Math.round((h * PPI) / p);
      const nuevo = magick(['jpg:-', '-colorspace', 'sRGB', '-filter', 'Lanczos', '-resize', `${nw}x${nh}!`, '-quality', String(CALIDAD), '-sampling-factor', '4:2:0', '-strip', 'jpg:-'], Buffer.from(obj.contents));
      const nd = d.clone(doc.context);
      nd.set(N('Width'), PDFNumber.of(nw));
      nd.set(N('Height'), PDFNumber.of(nh));
      nd.set(N('Length'), PDFNumber.of(nuevo.length));
      reemplazar(ref, nd, nuevo); // el espacio de color (y su perfil ICC) queda igual
      despues += nuevo.length;
      fotos++;
      continue;
    }
    despues += viejo;
    continue;
  }

  // 2. Lo demás, sin pérdida, si así queda más chico
  if (filtro === '/FlateDecode' && bits === 8 && !d.get(N('DecodeParms'))) {
    const n = color === '/DeviceGray' ? 1 : color === '/DeviceRGB' ? 3 : 0;
    if (n) {
      const nuevo = conFiltroPng(inflateSync(Buffer.from(obj.contents)), w, h, n);
      if (nuevo.length < viejo) {
        const nd = d.clone(doc.context);
        nd.set(N('DecodeParms'), doc.context.obj({ Predictor: 15, Colors: n, BitsPerComponent: 8, Columns: w }));
        nd.set(N('Length'), PDFNumber.of(nuevo.length));
        reemplazar(ref, nd, nuevo);
        despues += nuevo.length;
        sinPerdida++;
        continue;
      }
    }
  }
  despues += viejo;
}

const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false, updateFieldAppearances: false });
writeFileSync(salida, bytes);
rmSync(temporal, { recursive: true, force: true });
const mib = (b) => (b / 1048576).toFixed(2).replace('.', ',');
console.log(`${salida}: ${fotos} fotos achicadas a ${PPI} ppi y ${sinPerdida} imágenes comprimidas sin pérdida · imágenes ${mib(antes)} → ${mib(despues)} MiB · archivo ${mib(pesoAntes)} → ${mib(bytes.length)} MiB`);
