import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// IMPORTANT: actualizar 'site' con el dominio final antes de publicar.
// Se usa para generar sitemap.xml, canonical URLs y datos Open Graph absolutos.
export default defineConfig({
  site: 'https://thaiplast.cl',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    // Permite optimización de imágenes locales con astro:assets
    domains: [],
  },
});
