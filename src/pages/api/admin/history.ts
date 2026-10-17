import type { APIRoute } from 'astro';
import { bindings } from '../../../lib/catalog-store';

export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.adminEmail) return new Response(null, { status: 403 });
  const id = url.searchParams.get('id');
  const database = bindings().CATALOG_DB;
  if (!database) return Response.json({ history: [] });
  const query = id ? database.prepare('SELECT * FROM audit_log WHERE product_id = ? ORDER BY created_at DESC LIMIT 100').bind(id) : database.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100');
  return Response.json({ history: (await query.all()).results });
};
