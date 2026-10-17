import { env } from 'cloudflare:workers';
import seed from '../../data/products.json';
import categories from '../../data/categories.json';
import { createCatalog, normalizeProduct, type Product, type Category } from './catalog-model';
import { guardSql, auditSql, upsertSql } from './catalog-write';

export const bindings = () => env as unknown as App.Bindings;

export async function readProducts(includeInactive = false): Promise<Product[]> {
  const database = bindings().CATALOG_DB;
  if (!database) {
    if (!import.meta.env.DEV) throw new Error('CATALOG_DB no está configurada');
    return (seed as unknown as Product[]).map(normalizeProduct).filter(product => includeInactive || product.activo);
  }
  const result = await database.prepare(`SELECT data FROM products${includeInactive ? '' : ' WHERE active = 1'} ORDER BY rowid`).all<{ data: string }>();
  return result.results.map(row => normalizeProduct(JSON.parse(row.data)));
}

export async function loadCatalog() {
  return createCatalog(await readProducts(), categories as Category[]);
}

export async function revision() {
  return bindings().CATALOG_DB ? (await bindings().CATALOG_DB.prepare('SELECT revision FROM catalog_meta WHERE id = 1').first<{ revision: number }>())?.revision || 0 : 0;
}

export async function writeProducts(products: { id: string; expectedVersion: number; product: Product }[], actor: string, action: string) {
  const database = bindings().CATALOG_DB;
  if (!database) throw new Error('Configura la base de datos para guardar cambios');
  const payload = JSON.stringify(products);
  const token = crypto.randomUUID();
  await database.batch([
    database.prepare(guardSql).bind(token, payload),
    database.prepare(auditSql).bind(token, actor, action, new Date().toISOString(), payload),
    database.prepare(upsertSql).bind(payload),
    database.prepare('UPDATE catalog_meta SET revision = revision + 1 WHERE id = 1'),
    database.prepare('DELETE FROM write_guards WHERE token = ?').bind(token),
  ]);
}
