# SEO

Objetivo: aparecer en búsquedas B2B locales ("vasos desechables por mayor", "envases
delivery Santiago", "bolsas kraft mayorista") y captar tráfico que termine en WhatsApp.

## Qué ya está implementado

- **HTML estático** (Astro): carga rápida, buenos Core Web Vitals.
- **Meta por página:** `title` y `description` dinámicos en `BaseLayout.astro`.
- **Open Graph / Twitter Card** para compartir en redes y WhatsApp.
- **JSON-LD:**
  - `Organization` en todas las páginas.
  - `Product` + `Offer` (precio CLP, disponibilidad) en cada ficha (362 páginas).
  - `BreadcrumbList` en catálogo, categorías, fichas e industrias.
- **Sitemap** automático (`@astrojs/sitemap` → `/sitemap-index.xml`).
- **`robots.txt`** con sitemap declarado; `/pedido` excluido.
- **URLs limpias:** `/catalogo/<grupo>`, `/producto/<slug>`, `/industrias/<rubro>`.
- **Canonical** en cada página.
- **362 páginas de producto** indexables → mucho contenido long-tail.

## Pendientes recomendados

- [ ] Cambiar `site` al dominio real (afecta canonical, sitemap y OG).
- [ ] Subir **fotos reales** de producto (mejora CTR e imágenes en Google).
- [ ] Crear imagen Open Graph dedicada (1200×630) en vez del logo cuadrado.
- [ ] `LocalBusiness` con dirección y horario reales (rich results locales).
- [ ] Conectar **Google Search Console** y enviar el sitemap.
- [ ] Self-hostear la fuente Poppins (hoy vía Google Fonts) para ganar velocidad.
- [ ] Textos descriptivos por categoría/industria (más contenido para indexar).
- [ ] Reseñas/`AggregateRating` si se recopilan opiniones.

## Buenas prácticas al crecer

- Un `slug` único por producto; no reutilizar URLs.
- Mantener `description` < 160 caracteres y única por página.
- Comprimir imágenes (WebP/AVIF, ~600px) antes de subirlas.
