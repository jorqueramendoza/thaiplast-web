/**
 * Núcleo de conversión: construye enlaces wa.me con mensajes prearmados.
 * La métrica única del proyecto es la cantidad de solicitudes por WhatsApp,
 * así que TODOS los CTA importantes pasan por aquí.
 */
import { site } from './site';
import type { Product } from './products';

const BASE = 'https://wa.me/';

function build(message: string): string {
  return `${BASE}${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Consulta general (botón flotante / "Hablar por WhatsApp"). */
export function waGeneral(origen = 'web'): string {
  return build(
    `¡Hola ${site.nombre}! 👋 Me gustaría recibir información sobre sus productos desechables.\n\n(Origen: ${origen})`
  );
}

/** Solicitud de lista de precios completa. */
export function waListaPrecios(origen = 'web'): string {
  return build(
    `¡Hola ${site.nombre}! 📄 Quiero solicitar la *lista de precios* actualizada.\n\nMi negocio es: __________\n\n(Origen: ${origen})`
  );
}

/** Consulta por un producto puntual (desde la ficha o la tarjeta). */
export function waProducto(p: Pick<Product, 'nombre' | 'sku' | 'presentacion' | 'precio_formato'>): string {
  const lineas = [
    `¡Hola ${site.nombre}! 🛒 Me interesa este producto:`,
    '',
    `• *${p.nombre}*`,
    p.presentacion ? `  Presentación: ${p.presentacion}` : '',
    p.sku ? `  SKU: ${p.sku}` : '',
    p.precio_formato ? `  Precio ref.: ${p.precio_formato}` : '',
    '',
    '¿Me confirman disponibilidad y precio por mayor?',
  ].filter(Boolean);
  return build(lineas.join('\n'));
}

export type OrderLine = {
  nombre: string;
  sku?: string;
  presentacion?: string;
  precio?: number | null;
  cantidad: number;
};

/** Pedido completo armado en /pedido → mensaje detallado para WhatsApp. */
export function waPedido(lines: OrderLine[]): string {
  if (!lines.length) return waGeneral('pedido-vacio');
  let total = 0;
  const items = lines.map((l, i) => {
    const sub = (l.precio ?? 0) * l.cantidad;
    total += sub;
    const precioTxt = l.precio != null ? ` — $${(l.precio).toLocaleString('es-CL')} c/u` : '';
    const skuTxt = l.sku ? ` [${l.sku}]` : '';
    const presTxt = l.presentacion ? ` (${l.presentacion})` : '';
    return `${i + 1}. ${l.cantidad} × ${l.nombre}${presTxt}${skuTxt}${precioTxt}`;
  });
  const msg = [
    `¡Hola ${site.nombre}! 🧾 Quiero hacer este *pedido*:`,
    '',
    ...items,
    '',
    total > 0 ? `Total estimado: *$${total.toLocaleString('es-CL')}*` : '',
    '',
    '¿Me confirman stock, precio final y forma de despacho? Gracias 🙌',
  ].filter(Boolean);
  return build(msg.join('\n'));
}
