# Arquitectura

Sitio **estático** generado con Astro y desplegado en Cloudflare Pages. Se renderiza
HTML completo en el build (excelente SEO y velocidad). El JavaScript se limita a:
carrito de pedido, buscador/filtros del catálogo y badge del carrito.

## Estructura

```
data/
  products.csv         Lista de precios (fuente de trabajo)
  products.json        GENERADO por npm run import (fuente del build)
  categories.json      GENERADO: grupos de navegación + conteos
  category-map.json    Config: categoría del CSV → grupo de navegación
scripts/
  lib.mjs              Utilidades compartidas (CSV, slug, precios)
  import-products.mjs  CSV/XLSX → products.json + categories.json
  validate-products.mjs Reporta problemas del CSV sin modificarlo
public/
  catalogo-thaiplast.pdf       Descarga "Ver catálogo"
  img/brand/logo.jpg           Logo oficial
  img/products/_placeholder/   Placeholders SVG por grupo
src/
  lib/        site.ts, whatsapp.ts, products.ts, format.ts, cart.ts
  components/ Header, Footer, WhatsAppFloat, CtaBlock, ProductCard, Icon
  layouts/    BaseLayout.astro (SEO, JSON-LD, header/footer)
  pages/      index, catalogo/, producto/[slug], industrias/, pedido, contacto…
  styles/     tokens.css (marca), global.css
```

## Flujo de datos

```
products.csv  ──(npm run import)──►  products.json ─┐
category-map.json ──────────────────► categories.json ─┴─► Astro build ─► /dist ─► Cloudflare
```

Cero productos hardcodeados: las páginas leen `src/lib/products.ts`, que importa los JSON.

## Decisiones clave

- **Sin framework UI (React/Vue):** se usan `<script>` nativos de Astro. Menos JS, más velocidad.
- **Carrito en `localStorage`** (`src/lib/cart.ts`): no hay backend ni pagos. El pedido se
  convierte en un mensaje de WhatsApp (`src/lib/whatsapp.ts`).
- **Conversión centralizada:** todos los CTA importantes generan enlaces `wa.me` con
  mensajes prearmados y una etiqueta de origen para medir desde qué punto llegó el lead.
- **SKUs duplicados del CSV** se resuelven generando un `id` único por producto; el `sku`
  original se conserva como dato informativo.

## Rendimiento

- HTML estático + CSS crítico inline (`inlineStylesheets: 'auto'`).
- Imágenes `loading="lazy"`, placeholders SVG livianos.
- El JSON de productos **no** se envía al navegador (solo se usa en el build).
