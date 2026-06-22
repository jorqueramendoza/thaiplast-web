/**
 * extract-catalog-images.mjs
 * Extrae las imágenes JPEG embebidas (DCTDecode) del catálogo PDF y las guarda como
 * public/img/catalogo/pagina-01.jpg … pagina-NN.jpg. Genera data/catalogo-paginas.json.
 *
 * El catálogo es un PDF "aplanado": cada página es una sola imagen JPEG. Aquí no se
 * decodifica el PDF completo; se localizan los streams DCTDecode y se recorta el JPEG
 * crudo (de FFD8…FFD9), que es exactamente lo que necesitamos.
 *
 * Uso: node scripts/extract-catalog-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'img', 'catalogo');

// Localiza el PDF (el nombre trae espacios/acento).
function findPdf() {
  const direct = path.join(ROOT, 'Catálogo ThaiPlast .pdf');
  if (fs.existsSync(direct)) return direct;
  const hit = fs.readdirSync(ROOT).find((f) => /cat[aá]logo.*\.pdf$/i.test(f));
  if (hit) return path.join(ROOT, hit);
  // fallback: el PDF público
  const pub = path.join(ROOT, 'public', 'catalogo-thaiplast.pdf');
  if (fs.existsSync(pub)) return pub;
  return null;
}

/**
 * Extrae JPEGs embebidos buscando objetos con /Filter /DCTDecode y recortando el
 * contenido del stream (entre 'stream' y 'endstream'), recortado a los marcadores
 * JPEG SOI (FFD8) … EOI (FFD9) para mayor robustez.
 */
function extractJpegs(buf) {
  const images = [];
  const needle = Buffer.from('DCTDecode', 'latin1');
  const streamTok = Buffer.from('stream', 'latin1');
  const endTok = Buffer.from('endstream', 'latin1');

  let from = 0;
  while (true) {
    const dct = buf.indexOf(needle, from);
    if (dct === -1) break;
    from = dct + needle.length;

    // 'stream' después del DCTDecode
    const s = buf.indexOf(streamTok, dct);
    if (s === -1) continue;
    // saltar el EOL tras 'stream' (\r\n o \n)
    let dataStart = s + streamTok.length;
    if (buf[dataStart] === 0x0d) dataStart++;
    if (buf[dataStart] === 0x0a) dataStart++;

    const e = buf.indexOf(endTok, dataStart);
    if (e === -1) continue;

    let chunk = buf.subarray(dataStart, e);
    // recortar a SOI…EOI
    const soi = chunk.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
    if (soi === -1) { from = e; continue; }
    let eoi = chunk.lastIndexOf(Buffer.from([0xff, 0xd9]));
    if (eoi === -1) eoi = chunk.length - 2;
    const jpeg = chunk.subarray(soi, eoi + 2);
    if (jpeg.length > 1024) images.push(Buffer.from(jpeg)); // descarta basura pequeña
    from = e + endTok.length;
  }
  return images;
}

function main() {
  const pdf = findPdf();
  if (!pdf) { console.error('✖ No se encontró el catálogo PDF.'); process.exit(1); }
  const buf = fs.readFileSync(pdf);
  const images = extractJpegs(buf);
  if (images.length === 0) { console.error('✖ No se extrajo ninguna imagen JPEG.'); process.exit(1); }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  // limpiar páginas previas
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (/^pagina-\d+\.jpg$/i.test(f)) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  const pages = [];
  images.forEach((jpeg, i) => {
    const n = String(i + 1).padStart(2, '0');
    const file = `pagina-${n}.jpg`;
    fs.writeFileSync(path.join(OUT_DIR, file), jpeg);
    pages.push({ n: i + 1, src: `/img/catalogo/${file}` });
  });

  fs.writeFileSync(
    path.join(ROOT, 'data', 'catalogo-paginas.json'),
    JSON.stringify(pages, null, 2) + '\n',
    'utf8'
  );

  console.log(`✔ ${images.length} páginas → public/img/catalogo/`);
  console.log(`✔ índice → data/catalogo-paginas.json`);
}

main();
