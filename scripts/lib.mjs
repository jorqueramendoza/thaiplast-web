// Utilidades compartidas por import-products.mjs y validate-products.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = path.join(ROOT, 'data');

// Columnas canónicas esperadas en el CSV (orden y cantidad).
export const COLUMNS = [
  'SKU', 'Categoría', 'Producto', 'Medida/Capacidad', 'Presentación',
  'Color', 'Material', 'Uso Recomendado', 'Precio', 'Stock',
];

/** Parser CSV mínimo compatible con RFC-4180 (comillas + comas internas). */
export function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c === '\r') {
      // ignorar; el \n cierra la fila
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/** Quita acentos, pasa a minúsculas y genera un slug URL-safe. */
export function slugify(str) {
  return String(str)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[°ºª]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** "$1.000" -> 1000 ; "$18.000" -> 18000 ; "" -> null */
export function parsePrice(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[^0-9]/g, '');
  if (cleaned === '') return null;
  return parseInt(cleaned, 10);
}

export function formatPrice(value) {
  if (value == null) return 'Consultar';
  return '$' + value.toLocaleString('es-CL');
}

/** Carga category-map.json y construye índice categoría-CSV -> grupo. */
export function loadCategoryMap() {
  const map = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'category-map.json'), 'utf8'));
  const index = new Map();
  for (const grupo of map.grupos) {
    for (const cat of grupo.categorias) {
      index.set(cat.trim().toLowerCase(), grupo);
    }
  }
  return { grupos: map.grupos, index };
}

/** Localiza la fila de encabezado real (la que empieza con SKU). */
export function findHeaderIndex(rows) {
  return rows.findIndex((r) => (r[0] || '').trim().toLowerCase() === 'sku');
}

/**
 * Normaliza una fila de datos en un objeto-producto crudo, tolerando
 * desalineaciones de columnas: localiza el precio buscando desde el final
 * y reparte los campos intermedios por posición.
 */
export function normalizeRow(fields) {
  const sku = (fields[0] || '').trim();
  const categoria = (fields[1] || '').trim();
  const nombre = (fields[2] || '').trim();

  // Ubicar el índice del precio: último campo que parece precio (>0).
  let priceIndex = -1;
  for (let i = fields.length - 1; i >= 3; i--) {
    const v = parsePrice(fields[i]);
    if (v != null && v > 0) { priceIndex = i; break; }
  }
  const precio = priceIndex >= 0 ? parsePrice(fields[priceIndex]) : null;
  const middle = fields.slice(3, priceIndex >= 0 ? priceIndex : fields.length).map((s) => (s || '').trim());
  const [medida = '', presentacion = '', color = '', material = '', uso = ''] = middle;
  const stock = priceIndex >= 0 && fields[priceIndex + 1] ? (fields[priceIndex + 1] || '').trim() : '';

  return { sku, categoria, nombre, medida, presentacion, color, material, uso, precio, stockRaw: stock, _fieldCount: fields.length };
}
