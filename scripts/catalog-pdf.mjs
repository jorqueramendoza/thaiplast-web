import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export function decodeAscii85(input) {
  const encoded = input.toString('ascii').replace(/\s/g, '').replace(/^<~/, '').replace(/~>$/, '');
  const bytes = [];
  let digits = [];
  function flush() {
    const count = digits.length;
    while (digits.length < 5) digits.push(84);
    const value = digits.reduce((result, digit) => result * 85 + digit, 0);
    for (let shift = 24; shift >= 32 - (count - 1) * 8; shift -= 8) bytes.push((value >>> shift) & 255);
    digits = [];
  }
  for (const character of encoded) {
    if (character === 'z' && !digits.length) bytes.push(0, 0, 0, 0);
    else {
      const digit = character.charCodeAt(0) - 33;
      if (digit < 0 || digit > 84) throw new Error('ASCII85 inválido');
      digits.push(digit);
      if (digits.length === 5) flush();
    }
  }
  if (digits.length === 1) throw new Error('ASCII85 truncado');
  if (digits.length) flush();
  return Buffer.from(bytes);
}

export function extractCatalogPages(source, output) {
  const buffer = fs.readFileSync(source);
  fs.mkdirSync(output, { recursive: true });
  const pages = [];
  let offset = 0;
  while (true) {
    const filter = buffer.indexOf('DCTDecode', offset);
    if (filter < 0) break;
    const stream = buffer.indexOf('stream', filter);
    const end = buffer.indexOf('endstream', stream);
    if (stream < 0 || end < 0) throw new Error('PDF incompleto');
    const dictionary = buffer.subarray(Math.max(0, filter - 160), stream).toString('latin1');
    let start = stream + 6;
    if (buffer[start] === 13) start++;
    if (buffer[start] === 10) start++;
    let jpeg = buffer.subarray(start, end);
    if (dictionary.includes('ASCII85Decode')) jpeg = decodeAscii85(jpeg);
    const first = jpeg.indexOf(Buffer.from([255, 216, 255]));
    const last = jpeg.lastIndexOf(Buffer.from([255, 217]));
    if (first < 0 || last <= first) throw new Error('Imagen JPEG no válida');
    jpeg = jpeg.subarray(first, last + 2);
    const number = pages.length + 1;
    const filename = `pagina-${String(number).padStart(2, '0')}.jpg`;
    fs.writeFileSync(path.join(output, filename), jpeg);
    pages.push({ n: number, src: `/img/catalogo/${filename}`, sha256: createHash('sha256').update(jpeg).digest('hex') });
    offset = end + 9;
  }
  if (!pages.length) throw new Error('El PDF no contiene páginas JPEG compatibles');
  return pages;
}

if (process.argv[1]?.endsWith('catalog-pdf.mjs')) {
  const source = process.argv[2];
  if (!source) throw new Error('Uso: node scripts/catalog-pdf.mjs archivo.pdf');
  const pages = extractCatalogPages(source, 'public/img/catalogo');
  fs.writeFileSync('data/catalogo-paginas.json', JSON.stringify(pages, null, 2) + '\n');
  fs.copyFileSync(source, 'public/catalogo-thaiplast.pdf');
  console.log(`${pages.length} páginas extraídas`);
}
