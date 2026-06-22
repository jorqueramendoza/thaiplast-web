/**
 * Carga y consulta de productos/categorías desde los JSON generados.
 * Estos archivos los produce `npm run import` a partir de data/products.csv.
 * Nada de productos hardcodeados aquí.
 */
import productsData from '../../data/products.json';
import categoriesData from '../../data/categories.json';

export interface Product {
  id: string;
  sku: string;
  nombre: string;
  slug: string;
  categoria: string;
  grupo: string;
  grupo_nombre: string;
  medida: string;
  presentacion: string;
  color: string;
  material: string;
  uso: string;
  descripcion: string;
  precio: number | null;
  precio_formato: string;
  imagen: string;
  unidad_venta: string;
  stock: number | string | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CategoryRef { nombre: string; conteo: number; }
export interface Category {
  slug: string;
  nombre: string;
  descripcion: string;
  icono: string;
  destacado: boolean;
  conteo: number;
  categorias: CategoryRef[];
}

export const products: Product[] = (productsData as Product[]).filter((p) => p.activo);
export const categories: Category[] = categoriesData as Category[];

export const categoriesBySlug = new Map(categories.map((c) => [c.slug, c]));
export const productsBySlug = new Map(products.map((p) => [p.slug, p]));

export function getCategory(slug: string): Category | undefined {
  return categoriesBySlug.get(slug);
}

export function productsInGroup(slug: string): Product[] {
  return products.filter((p) => p.grupo === slug);
}

/** Grupos con al menos un producto, ordenados (destacados primero, luego por conteo). */
export function activeCategories(): Category[] {
  return categories
    .filter((c) => c.conteo > 0)
    .sort((a, b) => Number(b.destacado) - Number(a.destacado) || b.conteo - a.conteo);
}

/** Productos relacionados: mismo grupo, distinto id. */
export function related(p: Product, limit = 4): Product[] {
  return products.filter((x) => x.grupo === p.grupo && x.id !== p.id).slice(0, limit);
}

/** Selección de destacados para la home (variedad por grupo). */
export function featured(limit = 8): Product[] {
  const out: Product[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    if (p.precio == null) continue;
    if (seen.has(p.grupo)) continue;
    seen.add(p.grupo);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

export const totalProducts = products.length;
