import type { APIRoute } from 'astro';
import { readProducts, revision, writeProducts } from '../../../lib/catalog-store';
import { validateProduct } from '../../../lib/catalog-write';
import type { Product } from '../../../lib/catalog-model';

export const GET: APIRoute = async ({ locals }) => locals.adminEmail ? Response.json({ products: await readProducts(true), revision: await revision() }) : Response.json({ error: 'No autorizado' }, { status: 403 });

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.adminEmail) return Response.json({ error: 'No autorizado' }, { status: 403 });
  try {
    const text = await request.text();
    if (text.length > 1800000) return Response.json({ error: 'Importación demasiado grande' }, { status: 413 });
    const input = JSON.parse(text);
    if (!Array.isArray(input.products) || !input.products.length || input.products.length > 1000) throw new Error('Se requieren entre 1 y 1000 productos');
    const records = await readProducts(true);
    const existing = new Map(records.map(product => [product.id, product]));
    const ids = new Set<string>();
    const slugs = new Map(records.map(product => [product.slug, product.id]));
    const errors: { row: number; message: string }[] = [];
    const changes: { id: string; expectedVersion: number; product: Product }[] = input.products.flatMap((candidate: unknown, index: number) => {
      try {
        const raw = candidate as Record<string, unknown>;
        const previous = existing.get(String(raw.id));
        if (!Number.isInteger(raw.version) || raw.version !== (previous?.version || 0)) throw new Error('El producto cambió: vuelve a cargar o exportar los datos');
        const product = validateProduct(raw, previous);
        if (ids.has(product.id)) throw new Error('Identificador repetido en la importación');
        if (slugs.has(product.slug) && slugs.get(product.slug) !== product.id) throw new Error('La URL ya pertenece a otro producto');
        ids.add(product.id);
        slugs.set(product.slug, product.id);
        return [{ id: product.id, expectedVersion: previous?.version || 0, product }];
      } catch (error) { errors.push({ row: index + 2, message: (error as Error).message }); return []; }
    });
    if (errors.length) return Response.json({ errors }, { status: 422 });
    if (input.preview === true) return Response.json({ valid: true, count: changes.length, changes: changes.map(change => ({ id: change.id, nombre: change.product.nombre, precio_anterior: existing.get(change.id)?.precio ?? null, precio_nuevo: change.product.precio, activo: change.product.activo })) });
    await writeProducts(changes, locals.adminEmail, input.products.length > 1 ? 'import' : 'edit');
    return Response.json({ saved: changes.length, revision: await revision() });
  } catch (error) {
    const conflict = /CHECK constraint|UNIQUE constraint/.test(String(error));
    return Response.json({ error: conflict ? 'Otro cambio se guardó antes. Recarga los datos y vuelve a intentarlo.' : (error as Error).message }, { status: conflict ? 409 : 400 });
  }
};

export const DELETE: APIRoute = async () => Response.json({ error: 'Desactiva el producto para conservar su historial' }, { status: 405 });
