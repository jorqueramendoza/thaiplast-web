# Estado del proyecto — ThaiPlast Web (handoff)

> **Punto de entrada para cualquier dev o agente (incluido Codex) que tome el proyecto.**
> Lee este documento primero; luego el resto de `/docs`. Última actualización: 2026-06-22.

## 1. Qué es y para qué

Sitio **catálogo B2B mobile-first** de **ThaiPlast** ("todo en desechables"), distribuidor
chileno de productos desechables/packaging. **Métrica única de éxito: solicitudes por
WhatsApp.** No es e-commerce: **no hay pagos ni checkout**; todo CTA importante termina en
un mensaje de WhatsApp prearmado.

## 2. Estado actual (vivo)

- **Producción:** https://thaiplast-web.jorquera-mendoza.workers.dev
- **Repo:** https://github.com/jorqueramendoza/thaiplast-web (rama `main`)
- **Despliegue:** Cloudflare (Workers Builds, conectado a GitHub). En cada `git push` a
  `main`, Cloudflare corre `npm run build` y publica. Durante ese build Cloudflare ejecuta
  `astro add cloudflare` y agrega el adapter `@astrojs/cloudflare` + archivos `wrangler`
  **dentro del contenedor de build** (no están commiteados en el repo). Implicancia: el
  build local usa salida `static` y el de Cloudflare usa el adapter; ambos funcionan. Si se
  quiere reproducibilidad total, commitear el adapter; por ahora **no es necesario**.
- **Contacto real ya cargado** en `src/lib/site.ts`: WhatsApp `56957896128`
  (+56 9 5789 6128), correo `thaiplast.spa@gmail.com`, Instagram `@thaiplast`.
- **Pendiente de confirmar:** dirección y horario (hoy de ejemplo), dominio final
  (`thaiplast.cl` provisional en `astro.config.mjs` y `site.ts`).

## 3. Stack y versiones

- **Astro 6.x** (SSG, salida estática). Sin framework UI: la interactividad usa
  `<script>` nativos de Astro (carrito, filtros, lightbox). Menos JS = más velocidad.
- **@astrojs/sitemap** para `sitemap-index.xml`.
- **Node 24** local / **Node 22** en Cloudflare. **npm**. Git instalado.
- Datos en **archivos planos** (CSV → JSON). Sin base de datos, sin CMS.
- Dependencia dev opcional: `xlsx` (solo si se importa desde `.xlsx`).

## 4. Cómo correr

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # corre import + genera /dist
npm run preview
# Datos:
npm run validate           # revisa data/products.csv
npm run import             # CSV  -> products.json + categories.json
npm run import:xlsx        # XLSX -> idem (requiere 'xlsx')
npm run extract:catalogo   # PDF  -> public/img/catalogo/pagina-*.jpg
```

> Nota Windows: si una terminal no encuentra `node`/`git`, ábrela de nuevo (PATH viejo).

## 5. Mapa del proyecto

```
data/
  products.csv            Fuente de productos (lista de precios). EDITAR aquí.
  products.json           GENERADO (no editar a mano).
  categories.json         GENERADO (grupos de navegación + conteos).
  category-map.json       Config editable: categoría CSV -> grupo de navegación.
  catalogo-paginas.json   GENERADO por extract:catalogo (lista de páginas del PDF).
scripts/
  lib.mjs                 Utilidades (CSV, slug, precios, normalización de filas).
  import-products.mjs     CSV/XLSX -> JSON. Resuelve SKUs duplicados, slugs, imágenes.
  validate-products.mjs   Reporta problemas del CSV (no modifica nada).
  extract-catalog-images.mjs  Extrae los 37 JPEG del PDF a public/img/catalogo/.
public/
  catalogo-thaiplast.pdf       Catálogo PDF (descarga).
  img/brand/logo.jpg           Logo oficial (fuente de la marca).
  img/catalogo/pagina-*.jpg    37 páginas del catálogo (galería visual).
  img/products/_placeholder/   Placeholders SVG por grupo.
  img/products/<grupo>/<slug>.* Fotos reales por producto (ver §7).
src/
  lib/site.ts             Datos del negocio + industrias. EDITAR contacto aquí.
  lib/whatsapp.ts         NÚCLEO de conversión: arma todos los enlaces wa.me.
  lib/products.ts         Carga products.json/categories.json + helpers de consulta.
  lib/cart.ts             Carrito "Armar pedido" (localStorage), solo navegador.
  lib/format.ts           Formato CLP.
  components/             Header, Footer, WhatsAppFloat, CtaBlock, ProductCard, Icon.
  layouts/BaseLayout.astro  SEO, Open Graph, JSON-LD, header/footer, add-to-cart global.
  pages/                  index, catalogo/, catalogo/[categoria], producto/[slug],
                          industrias/, pedido, contacto, nosotros, lista-precios,
                          catalogo-visual, 404.
  styles/tokens.css       Tokens de marca (colores del logo). styles/global.css.
docs/                     Esta carpeta (README, ARCHITECTURE, DATABASE, etc.).
```

## 6. Flujo de datos (cero productos hardcodeados)

```
data/products.csv ──(npm run import)──► data/products.json ─┐
data/category-map.json ─────────────────► data/categories.json ─┴─► Astro build ─► /dist
```

Esquema de cada producto: ver `docs/DATABASE.md`. Para agregar/editar productos o precios:
editar el CSV → `npm run import` → `git push`. Detalle en `docs/IMPORT_PRODUCTS.md`.

## 7. Imágenes de producto

- Hoy cada producto usa un **placeholder por grupo** (`/img/products/_placeholder/<grupo>.svg`).
- El catálogo PDF se extrajo a **`public/img/catalogo/pagina-01..37.jpg`** y se muestra en
  **`/catalogo-visual`** (galería con lightbox). El PDF son páginas aplanadas, así que las
  fotos por producto **no** se pueden separar automáticamente: hay que recortarlas a mano.
- **Pipeline listo para fotos por producto** (`resolveImage()` en `import-products.mjs`):
  1. Si el CSV tiene columna `Imagen` con una ruta/URL, se usa esa.
  2. Si no, busca `public/img/products/<grupo>/<slug>.(jpg|jpeg|webp|png|avif)`.
  3. Si no hay, usa el placeholder del grupo.
  → Basta dejar la foto con el **nombre = slug del producto** en la carpeta de su **grupo**
  y reimportar; aparece sola sin tocar código. El `slug` y el `grupo` están en
  `data/products.json`.

## 8. Reglas duras (no romper)

1. **No hardcodear productos** en el código: todo sale de `data/`.
2. **Toda conversión pasa por `src/lib/whatsapp.ts`** (mantiene mensajes y UTM de origen).
3. **No agregar pasarela de pago / checkout.** La meta es el lead por WhatsApp.
4. **Mobile-first** (>80% del tráfico es móvil).
5. **Marca desde el logo**: usar `src/styles/tokens.css`; no inventar colores nuevos.
6. **Los 4 CTAs** (Ver Catálogo, Solicitar Lista de Precios, Armar Pedido, WhatsApp) y el
   **botón flotante** deben seguir presentes/accesibles.
7. JS mínimo: preferir `<script>` de Astro a añadir frameworks.

## 9. Issues conocidos / deuda

- **5 filas "Vasos Térmicos"** del CSV tienen columnas corridas; se importan salvadas pero
  con medida/material levemente desalineados. Corregir en el CSV cuando se pueda.
- Imágenes de producto = placeholders hasta cargar fotos reales (ver §7).
- Dirección, horario y dominio aún de ejemplo (ver §2).
- OG image usa el logo cuadrado; idealmente una imagen 1200×630 dedicada.

## 10. Próximos pasos

Ver `docs/ROADMAP.md` (backlog priorizado) y `docs/CODEX_AGENTS_PROMPT.md` (cómo dividir el
trabajo en roles para iterar con Codex).
