import fs from 'node:fs';
import { createWorker } from 'tesseract.js';

fs.mkdirSync('artifacts/ocr', { recursive: true });
const pages = JSON.parse(fs.readFileSync('data/catalogo-paginas.json', 'utf8'));
const worker = await createWorker('spa+eng', 1, { cachePath: 'artifacts/ocr' });
for (const page of pages) {
  const target = `artifacts/ocr/page-${page.n}.json`;
  if (fs.existsSync(target)) continue;
  const { data } = await worker.recognize(`public${page.src}`, {}, { text: true, blocks: true });
  fs.writeFileSync(target, JSON.stringify({ page: page.n, text: data.text, blocks: data.blocks }, null, 2));
  console.log(`OCR ${page.n}/${pages.length}`);
}
await worker.terminate();
