import type { APIRoute } from 'astro';
import { readProducts, revision } from '../../lib/catalog-store';

export const GET: APIRoute = async () => {
  const products = await readProducts();
  const publicProducts = products.map(({ carpetas_drive, notas, ...product }) => product);
  return Response.json({ revision: await revision(), products: publicProducts }, { headers: { 'Cache-Control': 'no-store' } });
};
