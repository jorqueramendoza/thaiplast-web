import { normalizeProduct, type Product } from './catalog-model.ts';

const stringFields = ['sku', 'nombre', 'slug', 'categoria', 'grupo', 'grupo_nombre', 'medida', 'presentacion', 'color', 'material', 'uso', 'descripcion', 'iva', 'notas'] as const;
const safeImage = (source: string) => /^\/(?:media|img)\/[a-zA-Z0-9/_\.\-]+$/.test(source) && !source.includes('..');

export function validateProduct(input: unknown, existing?: Product): Product {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Producto inválido');
  const data = input as Record<string, unknown>;
  const product = { ...existing } as Product;
  if (existing && data.id !== existing.id) throw new Error('No se puede cambiar el identificador');
  if (typeof data.id !== 'string' || !/^[a-zA-Z0-9_-]{1,180}$/.test(data.id)) throw new Error('Identificador inválido');
  product.id = data.id;
  for (const field of stringFields) {
    if (typeof data[field] !== 'string' || (data[field] as string).length > (field === 'descripcion' || field === 'notas' ? 6000 : 300)) throw new Error(`Campo inválido: ${field}`);
    product[field] = (data[field] as string).trim();
  }
  if (!product.nombre || !product.categoria || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.grupo)) throw new Error('Nombre, categoría, URL o grupo inválidos');
  if (!['Incluido', 'No incluido', 'No indicado'].includes(product.iva)) throw new Error('IVA debe ser Incluido, No incluido o No indicado');
  if (existing && product.slug !== existing.slug) throw new Error('La URL existente es permanente');
  if (data.precio !== null && (!Number.isSafeInteger(data.precio) || Number(data.precio) <= 0 || Number(data.precio) > 1000000000)) throw new Error('El precio debe ser un entero positivo CLP o vacío');
  if (typeof data.activo !== 'boolean' || typeof data.imagenes_compartidas !== 'boolean') throw new Error('Estado inválido');
  if (data.stock != null && (typeof data.stock !== 'number' || !Number.isSafeInteger(data.stock) || Number(data.stock) < 0)) throw new Error('Stock inválido');
  if (data.pagina_catalogo != null && (!Number.isSafeInteger(data.pagina_catalogo) || Number(data.pagina_catalogo) < 1 || Number(data.pagina_catalogo) > 9999)) throw new Error('Página inválida');
  if (!Array.isArray(data.imagenes) || data.imagenes.length > 4) throw new Error('La galería admite hasta cuatro imágenes');
  product.imagenes = data.imagenes.map(image => {
    if (!image || typeof image !== 'object' || typeof image.src !== 'string' || !safeImage(image.src) || typeof image.alt !== 'string' || image.alt.length > 300) throw new Error('Imagen inválida');
    for (const key of ['thumbnail', 'original']) if (image[key] != null && (typeof image[key] !== 'string' || !safeImage(image[key]))) throw new Error('Ruta de imagen inválida');
    return { src: image.src, alt: image.alt, thumbnail: image.thumbnail, original: image.original, driveId: typeof image.driveId === 'string' ? image.driveId.slice(0, 200) : undefined, sha256: typeof image.sha256 === 'string' && /^[a-f0-9]{64}$/.test(image.sha256) ? image.sha256 : undefined };
  });
  if (new Set(product.imagenes.map(image => image.sha256 || image.src)).size !== product.imagenes.length) throw new Error('La galería no debe repetir imágenes');
  if (!Array.isArray(data.carpetas_drive) || data.carpetas_drive.length > 20 || data.carpetas_drive.some(url => typeof url !== 'string' || !/^https:\/\/drive\.google\.com\/drive\/folders\/[a-zA-Z0-9_-]+$/.test(url))) throw new Error('Carpeta de Drive inválida');
  Object.assign(product, { precio: data.precio, activo: data.activo, stock: data.stock ?? null, pagina_catalogo: data.pagina_catalogo, imagenes_compartidas: data.imagenes_compartidas, carpetas_drive: data.carpetas_drive, estado_imagenes: data.estado_imagenes === 'pendiente_verificacion' ? 'pendiente_verificacion' : '', unidad_venta: product.presentacion || 'Unidad', fecha_creacion: existing?.fecha_creacion || new Date().toISOString(), fecha_actualizacion: new Date().toISOString(), version: (existing?.version || 0) + 1 });
  product.imagen = product.imagenes[0]?.src || `/img/products/_placeholder/${product.grupo}.svg`;
  return normalizeProduct(product);
}

export const guardSql = `INSERT INTO write_guards(token, valid)
  SELECT ?, CASE WHEN NOT EXISTS (
    SELECT 1 FROM json_each(?) incoming LEFT JOIN products current ON current.id = json_extract(incoming.value, '$.id')
    WHERE COALESCE(current.version, 0) != json_extract(incoming.value, '$.expectedVersion')
  ) THEN 1 ELSE 0 END`;

export const auditSql = `INSERT INTO audit_log(id, actor, action, product_id, before_json, after_json, created_at)
  SELECT ? || '-' || incoming.key, ?, ?, json_extract(incoming.value, '$.id'), current.data, json_extract(incoming.value, '$.product'), ?
  FROM json_each(?) incoming LEFT JOIN products current ON current.id = json_extract(incoming.value, '$.id')`;

export const upsertSql = `INSERT INTO products(id, slug, active, version, data)
  SELECT json_extract(value, '$.id'), json_extract(value, '$.product.slug'), json_extract(value, '$.product.activo'), json_extract(value, '$.product.version'), json_extract(value, '$.product')
  FROM json_each(?) WHERE 1
  ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, active=excluded.active, version=excluded.version, data=excluded.data`;
