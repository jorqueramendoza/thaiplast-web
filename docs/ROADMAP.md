# Roadmap

## Estado actual ✅

- [x] Proyecto Astro + estructura + tokens de marca (desde el logo)
- [x] Pipeline de datos: `category-map.json`, `import`/`validate`, `products.json` (362), `categories.json` (11 grupos)
- [x] Catálogo: grilla, buscador, filtros por grupo/material
- [x] Páginas de categoría y 362 fichas de producto con JSON-LD
- [x] "Armar Pedido" (localStorage) → mensaje a WhatsApp
- [x] Los 4 CTA globales + botón flotante de WhatsApp
- [x] Home, industrias, nosotros, contacto, lista de precios, 404
- [x] SEO base (meta, OG, JSON-LD, sitemap, robots)
- [x] Documentación en `/docs`

## Antes de publicar

- [ ] Instalar Node.js LTS y Git (este equipo no los tiene)
- [ ] `npm install` && `npm run build` sin errores
- [ ] Reemplazar datos de contacto reales en `src/lib/site.ts`
- [ ] Dominio real en `astro.config.mjs`
- [ ] Pruebas en celular (flujo de pedido → WhatsApp)
- [ ] Deploy en Cloudflare Pages

## Backlog (mejora continua)

- [ ] **Fotos reales** de producto (reemplazar placeholders por grupo)
- [ ] Corregir las 5 filas "Vasos Térmicos" desalineadas en el Excel
- [ ] Imagen Open Graph dedicada (1200×630)
- [ ] Google Analytics / medición de clics a WhatsApp
- [ ] `LocalBusiness` con dirección y horario reales
- [ ] Self-host de la tipografía Poppins
- [ ] Textos SEO por categoría e industria
- [ ] (Futuro, si el cliente lo pide) panel/CMS para editar productos sin Excel
