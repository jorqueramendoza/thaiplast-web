export interface ProductImage {
  src: string;
  thumbnail?: string;
  original?: string;
  driveId?: string;
  sha256?: string;
  alt: string;
}

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
  imagenes: ProductImage[];
  imagenes_compartidas: boolean;
  estado_imagenes: string;
  carpetas_drive: string[];
  pagina_catalogo: number | null;
  iva: string;
  notas: string;
  unidad_venta: string;
  stock: number | string | null;
  activo: boolean;
  version: number;
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

export function formatPrice(value: number | null) {
  return value == null ? 'Consultar' : '$' + value.toLocaleString('es-CL');
}

export function imageStatus(images: ProductImage[], review = false) {
  if (review) return 'pendiente_verificacion';
  const count = new Set(images.map(image => image.sha256 || image.src)).size;
  return count === 0 ? 'sin_imagenes' : count < 4 ? 'galeria_incompleta' : 'galeria_completa';
}

export function normalizeProduct(input: Partial<Product>): Product {
  const images = input.imagenes || [];
  return { ...input, imagenes: images, imagen: images[0]?.src || input.imagen || `/img/products/_placeholder/${input.grupo || 'otros'}.svg`, imagenes_compartidas: input.imagenes_compartidas || false, estado_imagenes: imageStatus(images, input.estado_imagenes === 'pendiente_verificacion'), carpetas_drive: input.carpetas_drive || [], pagina_catalogo: input.pagina_catalogo ?? null, iva: input.iva || 'No indicado', notas: input.notas || '', version: input.version || 1, precio_formato: formatPrice(input.precio ?? null) } as Product;
}

export function createCatalog(records: Product[], definitions: Category[]) {
  const products = records.filter(product => product.activo).map(normalizeProduct);
  const groups = new Map(definitions.map(category => [category.slug, { ...category, conteo: 0, categorias: [] as CategoryRef[] }]));
  for (const product of products) {
    if (!groups.has(product.grupo)) groups.set(product.grupo, { slug: product.grupo, nombre: product.grupo_nombre || product.categoria, descripcion: '', icono: 'box', destacado: false, conteo: 0, categorias: [] });
    const group = groups.get(product.grupo)!;
    group.conteo++;
    let category = group.categorias.find(category => category.nombre === product.categoria);
    if (!category) { category = { nombre: product.categoria, conteo: 0 }; group.categorias.push(category); }
    category.conteo++;
  }
  const categories = [...groups.values()];
  return {
    products, categories, totalProducts: products.length,
    productsBySlug: new Map(products.map(product => [product.slug, product])),
    getCategory: (slug: string) => categories.find(category => category.slug === slug),
    productsInGroup: (slug: string) => products.filter(product => product.grupo === slug),
    activeCategories: () => categories.filter(category => category.conteo > 0).sort((first, second) => Number(second.destacado) - Number(first.destacado) || second.conteo - first.conteo),
    related: (product: Product, limit = 4) => products.filter(candidate => candidate.grupo === product.grupo && candidate.id !== product.id).slice(0, limit),
    featured: (limit = 8) => {
      const seen = new Set<string>();
      return [...products].sort((first, second) => Number(second.imagenes.length > 0) - Number(first.imagenes.length > 0)).filter(product => {
        if (product.precio == null || seen.has(product.grupo)) return false;
        seen.add(product.grupo);
        return true;
      }).slice(0, limit);
    },
  };
}
