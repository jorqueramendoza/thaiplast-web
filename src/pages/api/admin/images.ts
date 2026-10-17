import type { APIRoute } from 'astro';
import { bindings } from '../../../lib/catalog-store';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.adminEmail) return new Response(null, { status: 403 });
  const bucket = bindings().PRODUCT_IMAGES;
  if (!bucket) return Response.json({ error: 'Almacenamiento de imágenes sin configurar' }, { status: 503 });
  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length > 10 * 1024 * 1024 || bytes.length < 12) throw new Error('La imagen debe pesar menos de 10 MB');
    const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
    if (!png && !jpeg && !webp) throw new Error('Solo se admiten PNG, JPEG y WebP');
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
    const extension = png ? 'png' : jpeg ? 'jpg' : 'webp';
    const key = `uploads/${hash}.${extension}`;
    await bucket.put(key, bytes, { httpMetadata: { contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}` } });
    return Response.json({ src: `/media/${key}`, sha256: hash });
  } catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
};
