import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createCatalog, normalizeProduct, imageStatus, type Product } from '../src/lib/catalog-model.ts';
import { validateProduct, guardSql, auditSql, upsertSql } from '../src/lib/catalog-write.ts';
import { authenticateAdmin } from '../src/lib/admin-auth.ts';
import { createWorkbook, parseWorkbook } from '../src/lib/workbook.ts';

const product = normalizeProduct({ id: 'test-product', sku: 'TP-1', nombre: 'Producto de prueba', slug: 'producto-de-prueba', categoria: 'Vasos', grupo: 'vasos-y-tapas', grupo_nombre: 'Vasos y Tapas', medida: '200 cc', presentacion: '50 unidades', color: '', material: 'PET', uso: '', descripcion: 'Descripción', precio: 1000, activo: true, stock: null, notas: '', iva: 'Incluido', pagina_catalogo: 4, imagenes_compartidas: false });

test('valida CLP, stock, identificadores, URL, estados y rutas de imagen', () => {
  const saved = validateProduct(product, product);
  assert.equal(saved.precio_formato, '$1.000');
  assert.equal(saved.version, 2);
  assert.equal(validateProduct({ ...product, precio: null }, product).precio_formato, 'Consultar');
  for (const invalid of [{ precio: -1 }, { precio: 1.5 }, { precio: '$1.000' }, { activo: 'Sí' }, { stock: -1 }, { slug: 'otra-url' }, { imagenes: [{ src: 'javascript:alert(1)', alt: 'Imagen' }] }, { imagenes: [{ src: '/media/../admin', alt: 'Imagen' }] }]) assert.throws(() => validateProduct({ ...product, ...invalid }, product));
  assert.throws(() => validateProduct({ ...product, iva: 'desconocido' }, product));
  assert.throws(() => validateProduct({ ...product, imagenes: [{ src: '/img/foto.jpg', alt: '' }, { src: '/img/foto.jpg', alt: '' }] }, product));
});

test('clasifica imágenes distintas, galerías vacías y verificación pendiente', () => {
  assert.equal(imageStatus([]), 'sin_imagenes');
  assert.equal(imageStatus([{ src: '/img/a.jpg', alt: '' }, { src: '/img/a.jpg', alt: '' }]), 'galeria_incompleta');
  assert.equal(imageStatus([1, 2, 3, 4].map(number => ({ src: `/img/${number}.jpg`, alt: '' }))), 'galeria_completa');
  assert.equal(imageStatus([], true), 'pendiente_verificacion');
});

function database() {
  const database = new DatabaseSync(':memory:');
  database.exec(fs.readFileSync('migrations/0001_catalog.sql', 'utf8'));
  database.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?)').run(product.id, product.slug, 1, 1, JSON.stringify(product));
  return database;
}

function write(database: DatabaseSync, changes: { id: string; expectedVersion: number; product: Product }[]) {
  const token = crypto.randomUUID(); const payload = JSON.stringify(changes);
  database.exec('BEGIN');
  try {
    database.prepare(guardSql).run(token, payload);
    database.prepare(auditSql).run(token, 'thaiplast.spa@gmail.com', 'test', new Date().toISOString(), payload);
    database.prepare(upsertSql).run(payload);
    database.exec('UPDATE catalog_meta SET revision=revision+1 WHERE id=1');
    database.prepare('DELETE FROM write_guards WHERE token=?').run(token);
    database.exec('COMMIT');
  } catch (error) { database.exec('ROLLBACK'); throw error; }
}

test('guarda precios, incrementa versión y registra el valor anterior atómicamente', () => {
  const db = database(); const updated = validateProduct({ ...product, precio: 2500 }, product);
  write(db, [{ id: product.id, expectedVersion: 1, product: updated }]);
  const row = db.prepare('SELECT * FROM products').get()!;
  assert.equal(JSON.parse(String(row.data)).precio, 2500);
  assert.equal(row.version, 2);
  assert.equal(db.prepare('SELECT revision FROM catalog_meta').get()!.revision, 2);
  assert.equal(JSON.parse(String(db.prepare('SELECT before_json FROM audit_log').get()!.before_json)).precio, 1000);
  db.close();
});

test('una edición concurrente cancela toda la importación y todo el historial', () => {
  const db = database();
  const added = validateProduct({ ...product, id: 'second', slug: 'second' });
  assert.throws(() => write(db, [{ id: added.id, expectedVersion: 0, product: added }, { id: product.id, expectedVersion: 0, product: validateProduct(product, product) }]));
  assert.equal(db.prepare('SELECT count(*) count FROM products').get()!.count, 1);
  assert.equal(db.prepare('SELECT count(*) count FROM audit_log').get()!.count, 0);
  assert.equal(db.prepare('SELECT revision FROM catalog_meta').get()!.revision, 1);
  db.close();
});

test('una URL duplicada cancela toda la transacción', () => {
  const db = database(); const added = validateProduct({ ...product, id: 'second' });
  assert.throws(() => write(db, [{ id: added.id, expectedVersion: 0, product: added }]));
  assert.equal(db.prepare('SELECT count(*) count FROM audit_log').get()!.count, 0);
  db.close();
});

test('los inactivos no aparecen en catálogo, destacados ni conteos', () => {
  const catalog = createCatalog([product, { ...product, id: 'hidden', activo: false }], []);
  assert.equal(catalog.totalProducts, 1); assert.equal(catalog.activeCategories()[0].conteo, 1);
  assert.equal(catalog.featured().length, 1);
});

test('el acceso se cierra cuando falta configuración, token o correo permitido', async () => {
  await assert.rejects(authenticateAdmin(new Request('https://thaiplast.cl/admin'), {}));
  const config = { ACCESS_TEAM_DOMAIN: 'thaiplast.cloudflareaccess.com', ACCESS_AUD: 'audience' };
  await assert.rejects(authenticateAdmin(new Request('https://thaiplast.cl/admin'), config));
  const request = new Request('https://thaiplast.cl/admin', { headers: { 'Cf-Access-Jwt-Assertion': 'token' } });
  const verify = (async (_token: unknown, _key: unknown, options: unknown) => { assert.deepEqual(options, { issuer: 'https://thaiplast.cloudflareaccess.com', audience: 'audience', algorithms: ['RS256'] }); return { payload: { email: 'thaiplast.spa@gmail.com' } }; }) as unknown as Parameters<typeof authenticateAdmin>[2];
  assert.equal(await authenticateAdmin(request, config, verify), 'thaiplast.spa@gmail.com');
  const denied = (async () => ({ payload: { email: 'intruso@example.com' } })) as unknown as Parameters<typeof authenticateAdmin>[2];
  await assert.rejects(authenticateAdmin(request, config, denied));
});

test('Excel conserva IDs, versiones, precios, tildes y galerías', async () => {
  const workbook = await createWorkbook([{ name: 'Productos', products: [product] }]);
  const buffer = await workbook.xlsx.writeBuffer();
  const parsed = await parseWorkbook(buffer as unknown as ArrayBuffer);
  assert.equal(parsed[0].id, product.id); assert.equal(parsed[0].version, product.version); assert.equal(parsed[0].precio, 1000); assert.equal(parsed[0].descripcion, 'Descripción'); assert.deepEqual(parsed[0].imagenes, []);
  workbook.worksheets[0].getCell('N2').value = { formula: '1000+1', result: 1001 };
  await assert.rejects(parseWorkbook(await workbook.xlsx.writeBuffer() as unknown as ArrayBuffer));
});
