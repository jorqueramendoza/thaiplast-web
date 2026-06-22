# Bitácora del proyecto — ThaiPlast Web

Registro cronológico de todo lo realizado, para retomar el trabajo en el futuro.
Para el estado actual y cómo correr el proyecto, ver primero `docs/ESTADO_DEL_PROYECTO.md`.

Última actualización: 2026-06-22.

---

## Resumen ejecutivo

Se construyó **desde cero** y se **publicó en producción con dominio propio** un sitio
catálogo B2B mobile-first para **ThaiPlast** (desechables/packaging). Objetivo: generar
**leads por WhatsApp** (sin e-commerce ni pagos). 362 productos, en línea en
**https://thaiplast.cl**.

---

## Cronología

### 1. Análisis y planificación
- Insumos del cliente: `logo.jpg`, `idea_pagina.png` (referencia visual), catálogo PDF y
  **lista de precios CSV** (`Listado de Precios … .csv`, 362 productos).
- Hallazgos: el **catálogo PDF son 37 páginas-imagen** (sin texto extraíble); el **CSV es la
  fuente real de datos**. Problemas del CSV detectados: SKUs duplicados, 5 filas
  "Vasos Térmicos" con columnas corridas, stock vacío, precios como texto (`$1.000`).
- Decisiones confirmadas con el cliente: **Astro** (estático), **datos en archivos planos**
  (CSV→JSON), hosting **Cloudflare**.

### 2. Construcción del sitio (Astro)
- Estructura del proyecto, tokens de marca desde el logo (rojo `#BD090D`, azul `#0A3F95`,
  dorado `#DEA621`), layout con SEO/JSON-LD, header/footer, botón flotante de WhatsApp.
- **Pipeline de datos:** `scripts/lib.mjs`, `import-products.mjs`, `validate-products.mjs`;
  `data/category-map.json` (54 categorías del CSV → 11 grupos de navegación). Genera
  `products.json` (362) y `categories.json`. Resuelve SKUs duplicados con `id` único.
- Páginas: home, catálogo + buscador/filtros, 362 fichas con `Product`/`Offer` JSON-LD,
  páginas por categoría, industrias, **armar pedido** (`/pedido`, carrito en localStorage →
  WhatsApp), contacto, nosotros, lista de precios, 404.
- Documentación inicial en `/docs`.

### 3. Toolchain
- Al inicio la máquina no tenía Node/Git; luego **se instalaron**: Node v24.17.0, npm 11.x,
  Git 2.54. Gotcha: terminales ya abiertas no ven el PATH nuevo (reabrir o refrescar PATH).

### 4. Primer despliegue
- `npm install` + `npm run build` OK. Se actualizó **Astro 4 → 6** (el `@astrojs/sitemap`
  instalado requería Astro nuevo). 387 páginas generadas.
- **GitHub:** repo `jorqueramendoza/thaiplast-web`, commit inicial, push.
- **Cloudflare:** conectado al repo (Workers Builds). Deploy a
  `thaiplast-web.jorquera-mendoza.workers.dev`.

### 5. Datos reales y mejoras multi-rol
- Contacto real en `src/lib/site.ts`: WhatsApp `56957896128`, correo `thaiplast.spa@gmail.com`,
  Instagram `@thaiplast`; Facebook se dejó opcional/oculto.
- **Backend:** corregidas las 5 filas "Vasos Térmicos" del CSV (nombre `Vaso Térmico`,
  medida, material).
- **Diseño:** imagen **Open Graph 1200×630** (`public/img/brand/og-image.jpg`); **favicons**
  PNG 16/32/180 (antes el favicon era el logo JPG de 578 KB).
- **Publicista:** meta-descripción más persuasiva y con keywords locales.
- **Data Scientist:** evento `whatsapp_click` (a `gtag`/`dataLayer`/Plausible con el `origen`
  del CTA). **Analítica conectable**: `site.ts → analytics { ga4, plausibleDomain }`; al poner
  un ID se carga el servicio automáticamente.
- **SEO local:** schema `LocalBusiness` (teléfono, email, zona RM, dirección).
- **Documentación:** `ESTADO_DEL_PROYECTO.md`, `CODEX_AGENTS_PROMPT.md` (roster de 10 roles),
  `DISTRIBUCION.md` (kit Google Business + redes), `BITACORA.md` (este archivo).
- **Imágenes del catálogo:** `scripts/extract-catalog-images.mjs` extrae las 37 páginas a
  `public/img/catalogo/`; nueva página **`/catalogo-visual`** (galería con lightbox). Pipeline
  de fotos por producto listo (`resolveImage()`): dejar `public/img/products/<grupo>/<slug>.jpg`
  y reimportar.

### 6. Datos del negocio
- Razón social **ThaiPlast SpA** y dirección **Arturo Godoy 1713, Santiago** (de NIC) cargadas
  en `site.ts` y en el schema `LocalBusiness`.

### 7. Dominio propio `thaiplast.cl` (configuración para referencia futura)
Registrado en **NIC Chile** (titular ThaiPlast SpA). Pasos realizados:
1. **Cloudflare → Add a site → Connect a domain → `thaiplast.cl`** (plan Free). Cloudflare
   asignó los nameservers: **`glen.ns.cloudflare.com`** y **`vida.ns.cloudflare.com`**.
2. **NIC Chile → thaiplast.cl → servidores de nombre:** se reemplazaron por esos 2 de
   Cloudflare (sin punto final, sin IP). Propagó en ~minutos.
3. **Worker custom domain:** Workers & Pages → `thaiplast-web` → Domains → Custom Domains →
   **Add → `thaiplast.cl`**. Creó solo el registro DNS (tipo "Worker") + SSL. `thaiplast.cl`
   quedó **en vivo con HTTPS**.
4. **`www`:** en la zona DNS se agregó **CNAME `www` → `thaiplast.cl` (Proxied)**.
   - El Worker custom domain **no** aceptaba `www` por el buscador ("No zones match").
5. **Redirección `www` → apex:** **Page Rule**:
   `www.thaiplast.cl/*` → **Forwarding URL 301** → `https://thaiplast.cl/$1`.
   Resultado: `www` redirige (301) al dominio sin www.

**Decisión:** el dominio **oficial es sin www** (`thaiplast.cl`), como github/wikipedia/etc.
El código ya apuntaba a `https://thaiplast.cl` en `astro.config.mjs` y `site.ts` (canonical,
sitemap, OG). Si en el futuro se quisiera invertir (www como principal), habría que mover el
Worker custom domain a `www` y la redirección al revés — más trabajo, sin beneficio real.

### 8. QR del sitio
- `scripts/make-qr.mjs` + `npm run qr` → genera `public/img/brand/qr-thaiplast.png`
  (apunta a `https://thaiplast.cl`). **Aún no generado**; correr cuando se necesite imprimir.

---

## Configuración técnica clave (referencia rápida)

| Qué | Valor / Dónde |
|---|---|
| Dominio oficial | `https://thaiplast.cl` (sin www) |
| Nameservers (en NIC) | `glen.ns.cloudflare.com`, `vida.ns.cloudflare.com` |
| Worker / proyecto Cloudflare | `thaiplast-web` (cuenta `jorquera-mendoza`) |
| DNS `thaiplast.cl` | registro tipo "Worker" → `thaiplast-web` (Proxied) |
| DNS `www` | CNAME → `thaiplast.cl` (Proxied) |
| Redirección www | Page Rule `www.thaiplast.cl/*` → 301 → `https://thaiplast.cl/$1` |
| Repo | github.com/jorqueramendoza/thaiplast-web (`main`) |
| Deploy | Cloudflare Workers Builds, auto en cada push a `main` |
| Contacto | `src/lib/site.ts` |
| Analítica | `src/lib/site.ts → analytics` (GA4/Plausible) |

---

## Pendientes (al 2026-06-22)

1. **Activar analítica:** pegar ID GA4 (`G-XXXX`) en `site.ts → analytics.ga4` → push.
2. **Google Business Profile + Instagram + difusión** (textos en `docs/DISTRIBUCION.md`).
3. **Generar el QR** (`npm run qr`) cuando se vaya a imprimir.
4. **Fotos reales de producto** (gradual; ver `docs/IMPORT_PRODUCTS.md` §Fotos).
5. **Confirmar horario** real en `site.ts`.
6. (Opcional/futuro) pago: NO requerido. Si algún día se cobra, lo simple es un **link de
   pago** (Flow/Mercado Pago) por WhatsApp; Webpay propio implicaría backend + afiliación
   Transbank.

## Cómo continuar
- Lee `docs/ESTADO_DEL_PROYECTO.md` (estado + cómo correr) y `docs/ROADMAP.md` (backlog).
- Para iterar con un equipo de agentes, usa `docs/CODEX_AGENTS_PROMPT.md`.
