import { defineMiddleware } from 'astro:middleware';
import { authenticateAdmin } from './lib/admin-auth';
import { bindings, loadCatalog, revision } from './lib/catalog-store';

export const onRequest = defineMiddleware(async (context, next) => {
  let pathname: string;
  try { pathname = decodeURIComponent(context.url.pathname).replace(/\/{2,}/g, '/'); }
  catch { return new Response('URL inválida', { status: 400 }); }
  const admin = pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/api/admin' || pathname.startsWith('/api/admin/');
  if (admin) {
    try {
      const localToken = import.meta.env.DEV && ['127.0.0.1', 'localhost'].includes(context.url.hostname) && bindings().LOCAL_ADMIN_TOKEN;
      context.locals.adminEmail = localToken && context.request.headers.get('Authorization') === `Bearer ${localToken}` ? 'thaiplast.spa@gmail.com' : await authenticateAdmin(context.request, bindings());
      if (!['GET', 'HEAD'].includes(context.request.method)) {
        if (context.request.headers.get('Origin') !== context.url.origin) return Response.json({ error: 'Origen no permitido' }, { status: 403 });
        const length = Number(context.request.headers.get('Content-Length') || 0);
        if (length > 20 * 1024 * 1024) return Response.json({ error: 'Solicitud demasiado grande' }, { status: 413 });
      }
    } catch (error) {
      return new Response(pathname.startsWith('/api/') ? JSON.stringify({ error: (error as Error).message }) : 'El panel requiere iniciar sesión con el correo autorizado. La protección Cloudflare Access debe estar configurada.', { status: 403, headers: { 'Content-Type': pathname.startsWith('/api/') ? 'application/json' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    }
  }
  if (!admin && !pathname.startsWith('/api/') && !pathname.startsWith('/media/') && !pathname.startsWith('/img/') && !pathname.startsWith('/_')) {
    context.locals.catalogRevision = await revision();
    context.locals.catalog = await loadCatalog();
  }
  const response = await next();
  if (admin || pathname.startsWith('/api/') || response.headers.get('Content-Type')?.includes('text/html')) response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (admin) { response.headers.set('X-Robots-Tag', 'noindex, nofollow'); response.headers.set('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"); }
  return response;
});
