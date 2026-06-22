/**
 * import-products.mjs
 * Lee data/products.csv (o un .xlsx con --xlsx) y genera:
 *   - data/products.json    (fuente de productos para el build de Astro)
 *   - data/categories.json  (grupos de navegación + conteos)
 *
 * Cero productos hardcodeados: toda la info viene de los archivos en /data.
 * Idempotente: preserva fecha_creacion de productos ya existentes (por id).
 *
 * Uso:
 *   node scripts/import-products.mjs           # desde data/products.csv
 *   node scripts/import-products.mjs --xlsx    # desde data/products.xlsx (req. paquete 'xlsx')
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  DATA_DIR, parseCsv, slugify, parsePrice, formatPrice,
  loadCategoryMap, findHeaderIndex, normalizeRow,
} from './lib.mjs';

const TODAY = new Date().toISOString().slice(0, 10);
const useXlsx = process.argv.includes('--xlsx');

function readRows() {
  if (useXlsx) {
    // Carga perezosa: solo se requiere 'xlsx' si se usa --xlsx.
    const xlsxPath = path.join(DATA_DIR, 'products.xlsx');
    const XLSX = require('xlsx');
    const wb = XLSX.readFile(xlsxPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  }
  const csv = fs.readFileSync(path.join(DATA_DIR, 'products.csv'), 'utf8');
  return parseCsv(csv);
}

function loadExisting() {
  const file = path.join(DATA_DIR, 'products.json');
  if (!fs.existsSync(file)) return new Map();
  try {
    const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
    return new Map(arr.map((p) => [p.id, p]));
  } catch { return new Map(); }
}

function placeholderImage(grupoSlug) {
  return `/img/products/_placeholder/${grupoSlug}.svg`;
}

function buildDescription({ nombre, medida, material, uso }) {
  const parts = [nombre];
  if (medida && !nombre.toLowerCase().includes(medida.toLowerCase())) parts.push(medida);
  const tail = [];
  if (material) tail.push(material);
  if (uso) tail.push(`ideal para ${uso.toLowerCase()}`);
  let desc = parts.join(' ');
  if (tail.length) desc += `. ${tail.join(', ')}.`;
  return desc.replace(/\.\.$/, '.');
}

function main() {
  const { grupos, index } = loadCategoryMap();
  const rows = readRows();
  const headerIdx = findHeaderIndex(rows);
  if (headerIdx < 0) { console.error('✖ No se encontró la fila de encabezado (SKU,...). Abortando.'); process.exit(1); }

  const existing = loadExisting();
  const usedIds = new Set();
  const usedSlugs = new Set();
  const products = [];
  const warnings = [];
  const grupoCounts = new Map();
  const catCounts = new Map();

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const fields = rows[r];
    if (!fields || fields.every((f) => !String(f).trim())) continue; // fila vacía
    const row = normalizeRow(fields);
    if (!row.sku && !row.nombre) continue;

    const grupo = index.get(row.categoria.toLowerCase());
    const grupoSlug = grupo ? grupo.slug : 'otros';
    if (!grupo) warnings.push(`Categoría sin mapear: "${row.categoria}" (SKU ${row.sku}) → grupo 'otros'`);
    if (row.precio == null) warnings.push(`Precio inválido o vacío (SKU ${row.sku} · ${row.nombre})`);
    if (row._fieldCount !== 10) warnings.push(`Fila con ${row._fieldCount} columnas (se esperaban 10) → ${row.sku} · ${row.nombre}`);

    // slug de producto único
    let baseSlug = slugify([row.nombre, row.medida].filter(Boolean).join(' ')) || slugify(row.sku) || 'producto';
    let slug = baseSlug; let n = 2;
    while (usedSlugs.has(slug)) { slug = `${baseSlug}-${n++}`; }
    usedSlugs.add(slug);

    // id interno único (resuelve SKUs duplicados entre grupos)
    let baseId = slugify([grupoSlug, row.nombre, row.sku].filter(Boolean).join('-'));
    let id = baseId; let m = 2;
    while (usedIds.has(id)) { id = `${baseId}-${m++}`; }
    usedIds.add(id);

    const prev = existing.get(id);
    const product = {
      id,
      sku: row.sku,
      nombre: row.nombre,
      slug,
      categoria: row.categoria,
      grupo: grupoSlug,
      grupo_nombre: grupo ? grupo.nombre : 'Otros',
      medida: row.medida,
      presentacion: row.presentacion,
      color: row.color,
      material: row.material,
      uso: row.uso,
      descripcion: buildDescription(row),
      precio: row.precio,
      precio_formato: formatPrice(row.precio),
      imagen: placeholderImage(grupoSlug),
      unidad_venta: row.presentacion || 'Unidad',
      stock: row.stockRaw ? Number(row.stockRaw) || row.stockRaw : null,
      activo: true,
      fecha_creacion: prev ? prev.fecha_creacion : TODAY,
      fecha_actualizacion: TODAY,
    };
    products.push(product);

    grupoCounts.set(grupoSlug, (grupoCounts.get(grupoSlug) || 0) + 1);
    catCounts.set(row.categoria, (catCounts.get(row.categoria) || 0) + 1);
  }

  // categories.json
  const categories = grupos.map((g) => ({
    slug: g.slug,
    nombre: g.nombre,
    descripcion: g.descripcion,
    icono: g.icono,
    destacado: !!g.destacado,
    conteo: grupoCounts.get(g.slug) || 0,
    categorias: g.categorias
      .filter((c) => catCounts.has(c))
      .map((c) => ({ nombre: c, conteo: catCounts.get(c) || 0 })),
  }));
  if (grupoCounts.get('otros')) {
    categories.push({ slug: 'otros', nombre: 'Otros', descripcion: 'Productos sin categoría asignada.', icono: 'box', destacado: false, conteo: grupoCounts.get('otros'), categorias: [] });
  }

  fs.writeFileSync(path.join(DATA_DIR, 'products.json'), JSON.stringify(products, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2) + '\n', 'utf8');

  console.log(`✔ ${products.length} productos → data/products.json`);
  console.log(`✔ ${categories.length} grupos     → data/categories.json`);
  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} advertencias (datos importados igual):`);
    for (const w of warnings.slice(0, 30)) console.log(`  · ${w}`);
    if (warnings.length > 30) console.log(`  … y ${warnings.length - 30} más. Corrige en el Excel y reimporta.`);
  }
}

// Soporte require() dentro de ESM para el carga perezosa de 'xlsx'.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

main();
