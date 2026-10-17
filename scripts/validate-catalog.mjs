import fs from 'node:fs';
import assert from 'node:assert/strict';
import { validateProduct } from '../src/lib/catalog-write.ts';

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const ids = new Set(); const slugs = new Set();
for (const product of products) {
  assert(!ids.has(product.id), `ID repetido: ${product.id}`); ids.add(product.id);
  assert(!slugs.has(product.slug), `URL repetida: ${product.slug}`); slugs.add(product.slug);
  if (!product.activo) continue;
  validateProduct(product, product);
  for (const image of product.imagenes) {
    const filename = image.src.replace('/media/catalog/', 'public/img/products/assets/');
    assert(fs.existsSync(filename), `Falta archivo: ${filename}`);
  }
}
const active = products.filter(product => product.activo);
assert.equal(new Set(active.map(product => product.pagina_catalogo)).size, 45);
const report = JSON.parse(fs.readFileSync('data/catalog-reconciliation.json', 'utf8'));
assert.equal(report.officialProducts, active.length);
assert.equal(report.noImages, active.filter(product => product.imagenes.length === 0).length);
console.log(`${active.length} productos oficiales y ${products.length - active.length} registros anteriores inactivos. Identificadores, precios, páginas e imágenes verificados.`);
