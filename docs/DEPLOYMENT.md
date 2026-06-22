# Despliegue — Cloudflare Pages

El sitio es estático: el build genera `/dist`, que Cloudflare sirve por su CDN global.

## Requisitos previos

- Node.js LTS y Git instalados (ver [README.md](README.md)).
- Una cuenta en [Cloudflare](https://dash.cloudflare.com) (plan gratuito sirve).
- El proyecto subido a un repositorio Git (GitHub/GitLab) **o** desplegado con Wrangler.

## Opción A — Git + Cloudflare Pages (recomendada)

1. Sube el proyecto a GitHub:
   ```bash
   git init
   git add .
   git commit -m "Sitio ThaiPlast"
   git branch -M main
   git remote add origin <URL-de-tu-repo>
   git push -u origin main
   ```
2. En Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** y elige el repo.
3. Configura el build:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 18 o superior (variable `NODE_VERSION=18`)
4. Deploy. Cada `git push` vuelve a desplegar automáticamente.

## Opción B — Wrangler (sin Git)

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name=thaiplast
```

## Dominio propio

En el proyecto de Pages → **Custom domains** → agrega `thaiplast.cl` (y `www`).
Sigue las instrucciones de DNS de Cloudflare.

## Checklist antes de publicar

- [ ] `site` correcto en `astro.config.mjs` y `src/lib/site.ts` (dominio final).
- [ ] WhatsApp, correo, dirección y horario reales en `src/lib/site.ts`.
- [ ] `npm run build` corre sin errores.
- [ ] Probar en celular: catálogo, ficha, **armar pedido → WhatsApp**, botón flotante.
- [ ] `robots.txt` y `sitemap-index.xml` accesibles tras el deploy.

## Notas

- `404.astro` se genera como `404.html`; Cloudflare lo usa automáticamente.
- `/pedido` está marcado `noindex` y bloqueado en `robots.txt` (no aporta a SEO).
