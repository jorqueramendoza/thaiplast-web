import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import { fileURLToPath } from 'node:url';

// IMPORTANT: actualizar 'site' con el dominio final antes de publicar.
// Se usa para generar sitemap.xml, canonical URLs y datos Open Graph absolutos.
export default defineConfig({
  site: 'https://thaiplast.cl',
  output: 'server',
  devToolbar: { enabled: false },
  adapter: process.argv.includes('check') ? undefined : process.env.THAIPLAST_LOCAL === '1' ? node({ mode: 'standalone' }) : cloudflare({ imageService: 'passthrough' }),
  vite: {
    cacheDir: process.env.THAIPLAST_LOCAL === '1' ? '.local/vite-local' : process.argv.includes('check') ? '.astro/vite-check' : '.astro/vite-cloudflare',
    resolve: {
      alias: process.env.THAIPLAST_LOCAL === '1' ? { 'cloudflare:workers': fileURLToPath(new URL('./scripts/local-runtime.mjs', import.meta.url)) } : {},
    },
  },
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    // Permite optimización de imágenes locales con astro:assets
    domains: [],
  },
});
