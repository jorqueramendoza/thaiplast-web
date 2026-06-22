/**
 * validate-products.mjs
 * Revisa data/products.csv y reporta problemas SIN modificar nada:
 *   - filas con número de columnas distinto de 10 (posible desalineación)
 *   - precios no parseables
 *   - SKUs duplicados
 *   - categorías que no están en category-map.json
 * Sale con código 0 si no hay errores críticos, 1 si los hay.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, parseCsv, parsePrice, loadCategoryMap, findHeaderIndex, normalizeRow } from './lib.mjs';

const csv = fs.readFileSync(path.join(DATA_DIR, 'products.csv'), 'utf8');
const rows = parseCsv(csv);
const headerIdx = findHeaderIndex(rows);
const { index } = loadCategoryMap();

const errors = [];
const warns = [];
const skuSeen = new Map();
let count = 0;

for (let r = headerIdx + 1; r < rows.length; r++) {
  const fields = rows[r];
  if (!fields || fields.every((f) => !String(f).trim())) continue;
  const row = normalizeRow(fields);
  if (!row.sku && !row.nombre) continue;
  count++;
  const line = r + 1; // 1-indexado como en una hoja de cálculo

  if (row._fieldCount !== 10) warns.push(`L${line}: ${row._fieldCount} columnas (esperadas 10) · ${row.sku} ${row.nombre}`);
  if (row.precio == null || row.precio <= 0) errors.push(`L${line}: precio inválido "${fields.join(',')}"`);
  if (!index.get(row.categoria.toLowerCase())) warns.push(`L${line}: categoría sin mapear "${row.categoria}"`);

  if (row.sku) {
    if (skuSeen.has(row.sku)) warns.push(`L${line}: SKU duplicado "${row.sku}" (también en L${skuSeen.get(row.sku)})`);
    else skuSeen.set(row.sku, line);
  } else {
    errors.push(`L${line}: SKU vacío · ${row.nombre}`);
  }
}

console.log(`Revisados ${count} productos.`);
if (warns.length) {
  console.log(`\n⚠ ${warns.length} advertencias:`);
  for (const w of warns) console.log(`  · ${w}`);
}
if (errors.length) {
  console.log(`\n✖ ${errors.length} errores críticos:`);
  for (const e of errors) console.log(`  · ${e}`);
  process.exit(1);
}
console.log(warns.length ? '\n✓ Sin errores críticos (revisa las advertencias).' : '\n✓ Todo correcto.');
