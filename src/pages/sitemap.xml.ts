import type { APIRoute } from 'astro';
import { loadCatalog } from '../lib/catalog-store';
import { industrias, site } from '../lib/site';

export const GET: APIRoute = async () => {
  const catalog = await loadCatalog();
  const paths = ['/', '/catalogo', '/nosotros', '/contacto', '/lista-precios', '/catalogo-visual', '/industrias', ...industrias.map(industry => `/industrias/${industry.slug}`), ...catalog.activeCategories().map(category => `/catalogo/${category.slug}`), ...catalog.products.map(product => `/producto/${product.slug}`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${new URL(path, site.url).href}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
};
