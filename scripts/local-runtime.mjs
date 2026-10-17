import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

const root = process.cwd();
const local = path.resolve(root, process.env.LOCAL_DATA_DIRECTORY || '.local');
if (!local.startsWith(root + path.sep)) throw new Error('La base local debe estar dentro del proyecto');
fs.mkdirSync(local, { recursive: true });
const database = new DatabaseSync(path.join(local, 'catalog.sqlite'));
database.exec(fs.readFileSync(path.join(root, 'migrations/0001_catalog.sql'), 'utf8'));
if (!database.prepare('SELECT count(*) count FROM products').get().count) {
  const insert = database.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?)');
  database.exec('BEGIN');
  for (const product of JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'))) insert.run(product.id, product.slug, product.activo ? 1 : 0, product.version || 1, JSON.stringify(product));
  database.exec('COMMIT');
}
function statement(sql, values = []) {
  return {
    bind: (...parameters) => statement(sql, parameters),
    all: async () => ({ results: database.prepare(sql).all(...values), success: true }),
    first: async () => database.prepare(sql).get(...values) || null,
    run: () => database.prepare(sql).run(...values),
  };
}
const mime = filename => filename.endsWith('.webp') ? 'image/webp' : filename.endsWith('.jpg') ? 'image/jpeg' : filename.endsWith('.png') ? 'image/png' : 'application/octet-stream';
const mediaDirectory = path.join(local, 'media');
export const env = {
  LOCAL_ADMIN_TOKEN: process.env.LOCAL_ADMIN_TOKEN,
  CATALOG_DB: { prepare: statement, batch: async statements => {
    database.exec('BEGIN');
    try { const results = statements.map(statement => statement.run()); database.exec('COMMIT'); return results; }
    catch (error) { database.exec('ROLLBACK'); throw error; }
  } },
  PRODUCT_IMAGES: {
    put: async (key, bytes) => {
      const target = path.join(mediaDirectory, key);
      fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, Buffer.from(bytes));
    },
    get: async key => {
      const target = path.join(mediaDirectory, key);
      if (!fs.existsSync(target)) return null;
      const bytes = fs.readFileSync(target);
      return { body: new Blob([bytes]).stream(), httpEtag: `"${createHash('sha256').update(bytes).digest('hex')}"`, writeHttpMetadata: headers => headers.set('Content-Type', mime(key)) };
    },
  },
  ASSETS: { fetch: async url => {
    const pathname = new URL(String(url)).pathname;
    if (!/^\/img\/products\/assets\/[a-f0-9]{64}(?:-thumb)?\.webp$/.test(pathname)) return new Response(null, { status: 404 });
    const target = path.join(root, 'public', pathname.slice(1));
    return fs.existsSync(target) ? new Response(fs.readFileSync(target), { headers: { 'Content-Type': mime(target) } }) : new Response(null, { status: 404 });
  } },
};
