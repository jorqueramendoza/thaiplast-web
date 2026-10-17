import type { APIRoute } from 'astro';
import { bindings } from '../../lib/catalog-store';

export const GET: APIRoute = async ({ params, request }) => {
  const key = params.key || '';
  if (!/^[a-zA-Z0-9/_\.\-]+$/.test(key) || key.includes('..')) return new Response(null, { status: 404 });
  const bucket = bindings().PRODUCT_IMAGES;
  const object = bucket ? await bucket.get(key) : null;
  if (!object && /^catalog\/[a-f0-9]{64}(?:-thumb)?\.webp$/.test(key)) {
    const assetUrl = new URL(`/img/products/assets/${key.slice('catalog/'.length)}`, request.url);
    const response = await bindings().ASSETS.fetch(assetUrl);
    const headers = new Headers([...response.headers.entries()]);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(response.body as unknown as ReadableStream<Uint8Array> | null, { status: response.status, headers });
  }
  if (!object) return new Response(null, { status: 404 });
  const headers = new Headers({ 'Cache-Control': 'public, max-age=31536000, immutable', ETag: object.httpEtag, 'X-Content-Type-Options': 'nosniff' });
  if (request.headers.get('If-None-Match') === object.httpEtag) return new Response(null, { status: 304, headers });
  object.writeHttpMetadata(headers as never);
  return new Response('body' in object ? object.body as unknown as ReadableStream<Uint8Array> : null, { status: 'body' in object ? 200 : 304, headers });
};
