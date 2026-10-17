/**
 * Carrito de "Armar Pedido" — store liviano sobre localStorage.
 * Solo para uso en el navegador (dentro de <script> en .astro).
 * No hay checkout ni pago: el pedido se envía como mensaje a WhatsApp.
 */
export interface CartItem {
  id: string;
  slug: string;
  sku: string;
  nombre: string;
  presentacion: string;
  precio: number | null;
  imagen: string;
  cantidad: number;
  disponible?: boolean;
}

const KEY = 'tp_pedido_v1';
const EVENT = 'tp-cart-change';

export function getCart(): CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { items } }));
}

export function addItem(item: Omit<CartItem, 'cantidad'>, cantidad = 1): void {
  const items = getCart();
  const found = items.find((i) => i.id === item.id);
  if (found) found.cantidad += cantidad;
  else items.push({ ...item, cantidad });
  save(items);
}

export function setQty(id: string, cantidad: number): void {
  if (!Number.isSafeInteger(cantidad) || cantidad < 0 || cantidad > 1000000) return;
  let items = getCart();
  if (cantidad <= 0) {
    items = items.filter((i) => i.id !== id);
  } else {
    const it = items.find((i) => i.id === id);
    if (it) it.cantidad = cantidad;
  }
  save(items);
}

export function removeItem(id: string): void {
  save(getCart().filter((i) => i.id !== id));
}

export function clearCart(): void {
  save([]);
}

export function count(): number {
  return getCart().reduce((n, i) => n + i.cantidad, 0);
}

export function total(): number {
  return getCart().reduce((s, i) => s + (i.precio ?? 0) * i.cantidad, 0);
}

export function onCartChange(cb: (items: CartItem[]) => void): () => void {
  const handler = () => cb(getCart());
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler); // sincroniza entre pestañas
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export const CART_EVENT = EVENT;

export async function refreshCart(): Promise<CartItem[]> {
  const response = await fetch('/api/catalogo', { cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudieron confirmar los precios. Reintenta antes de enviar el pedido.');
  const data = await response.json() as { products: CartItem[] };
  const products = new Map<string, CartItem>((data.products as CartItem[]).map(product => [product.id, product]));
  const items = getCart().map(item => {
    const current = products.get(item.id);
    return current ? { ...item, nombre: current.nombre, slug: current.slug, sku: current.sku, presentacion: current.presentacion, precio: current.precio, imagen: current.imagen, disponible: true } : { ...item, disponible: false };
  });
  save(items);
  return items;
}
