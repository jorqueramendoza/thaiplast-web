# ThaiPlast — Sitio web B2B

Sitio de catálogo **mobile-first** para ThaiPlast ("todo en desechables"). El objetivo
no es vender online: es **generar solicitudes por WhatsApp**. Toda la información de
productos vive en archivos externos (`/data`), nunca en el código.

- **Stack:** [Astro](https://astro.build) (HTML estático + JS mínimo)
- **Datos:** `data/products.csv` → `data/products.json` (vía `npm run import`)
- **Hosting:** Cloudflare Pages
- **Productos:** 362 (generados desde la lista de precios)

## Requisitos

Este equipo **aún no tiene Node.js ni Git**. Para correr o publicar el sitio:

1. Instala **Node.js LTS** (incluye npm): <https://nodejs.org/es> → botón "LTS".
2. Instala **Git**: <https://git-scm.com/download/win>.
3. Reinicia la terminal y verifica: `node -v` y `git -v`.

> Mientras tanto, `data/products.json` y `data/categories.json` ya fueron generados,
> así que el sitio se puede construir apenas instales Node.

## Puesta en marcha

```bash
npm install        # instala dependencias (una sola vez)
npm run dev        # servidor local en http://localhost:4321
npm run build      # importa productos + genera el sitio en /dist
npm run preview    # previsualiza el build de producción
```

## Comandos de datos

```bash
npm run validate   # revisa data/products.csv y reporta problemas
npm run import     # regenera products.json y categories.json desde el CSV
npm run import:xlsx# igual, pero desde data/products.xlsx (requiere instalar 'xlsx')
```

## Antes de publicar (importante)

Edita `src/lib/site.ts` con los **datos reales**:
- `whatsapp` — número en formato internacional sin "+" (ej. `56912345678`)
- `email`, `direccion`, `horario`, redes sociales
- Actualiza `site` (dominio) en `astro.config.mjs` y `src/lib/site.ts`

## Documentación

| Archivo | Contenido |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Estructura del proyecto y decisiones técnicas |
| [DATABASE.md](DATABASE.md) | Esquema de datos de productos y categorías |
| [IMPORT_PRODUCTS.md](IMPORT_PRODUCTS.md) | Cómo cargar/actualizar productos |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | Guía no técnica para el cliente |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Publicar en Cloudflare Pages |
| [SEO.md](SEO.md) | Estrategia y checklist SEO |
| [ROADMAP.md](ROADMAP.md) | Fases y pendientes |
