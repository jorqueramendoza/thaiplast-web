# Publicación en Cloudflare Workers

El sitio usa Astro 7 con el adaptador oficial, D1 y R2. La configuración está versionada en wrangler.jsonc. Las credenciales se mantienen en la sesión de Wrangler o secretos del proveedor.

## Requisitos

Node 24, npm y una sesión de Cloudflare: `npx wrangler login`. En Windows, las dependencias nativas pueden requerir Microsoft Visual C++ Redistributable x64. `npm run dev:local` ofrece un servidor alternativo Node para desarrollo.

## Configurar primero el entorno preview

Se reutiliza el proyecto existente `thaiplast-web` y el dominio `thaiplast.cl`; no hay que crear otra web. Producción está publicada con Cloudflare Access, D1, R2 y SESSION KV. Las dos bases D1 ya están creadas, migradas y cargadas con 325 productos activos y 319 anteriores inactivos. Sus IDs están configurados. R2 está activado y los contenedores `thaiplast-products` y `thaiplast-products-preview` están creados. Producción tiene 766 archivos iniciales de imágenes y miniaturas (26.8 MB). El entorno de prueba todavía no está publicado, su contenedor está vacío y sus variables Access faltan. No vuelvas a crear los recursos existentes.

La primera versión del catálogo administrable se publicó como `74ffcebf-7844-4cdc-8a5c-0244000a2646`. Consulta Deployments en Cloudflare para identificar la versión vigente después de publicaciones posteriores. Se comprobó el catálogo público, sus precios, las imágenes y la redirección a Access de las rutas administrativas. El inicio de sesión real con código de correo debe completarlo el propietario. Evidencia inicial en `artifacts/live-verification.json`. Se deshabilitaron workers.dev y las URL de versiones en producción; preview no tiene rutas sobre el dominio oficial.

1. Configura una aplicación Cloudflare Access para el dominio de preview, incluyendo /admin y /api/admin. Autoriza únicamente thaiplast.spa@gmail.com mediante código de correo. Registra el dominio del equipo terminado en .cloudflareaccess.com y la audiencia AUD en env.preview.vars. Protege solo las rutas administrativas, no el catálogo público.
2. `npm run images:publish -- --preview` carga los archivos iniciales en el contenedor de prueba. Los activos estáticos sirven de respaldo.
3. `npm run build:preview` y `npm run deploy -- --preview`.

Solo para recuperar una instalación vacía: crea la base con `npx wrangler d1 create thaiplast-catalog-preview`, guarda el ID real en la configuración, aplica `npx wrangler d1 migrations apply thaiplast-catalog-preview --env preview --remote` y carga `npx wrangler d1 execute thaiplast-catalog-preview --env preview --remote --file artifacts/catalog-seed.sql`. No ejecutes la creación sobre los recursos existentes.

El entorno se selecciona al compilar mediante CLOUDFLARE_ENV. El script comprueba que el Worker compilado coincida con el entorno que se va a publicar.

La semilla se genera con `npm run import` y no sobrescribe registros existentes. La configuración de preview usa recursos separados de producción. Protege también el hostname workers.dev o deshabilítalo; la aplicación valida JWT en todos los hostnames aunque Access no esté delante.

## Producción

Usa la base existente thaiplast-catalog y el contenedor thaiplast-products. Las variables de nivel superior y la aplicación Access que cubre thaiplast.cl/admin y thaiplast.cl/api/admin ya están configuradas. Respalda la base con `npx wrangler d1 export thaiplast-catalog --remote --output artifacts/catalog-backup.sql` antes de una migración o importación importante.

Revisa las diferencias en preview y conserva el despliegue anterior para revertir código. Aplica la migración, carga inicial y fotografías. Ejecuta `npm run validate`, `npm test`, `npm run check`, `npm run test:browser`, `npm run build` y finalmente `npm run deploy`.

El script de despliegue rechaza IDs provisionales o una configuración Access vacía. No publica un administrador sin protección.

## Workers Builds existente

El repositorio de código es `jorqueramendoza/thaiplast-web`, rama `main`. La implementación, incluyendo catálogo administrable y carruseles, se guardó y subió con autorización del propietario en el commit `f14f29d42738a597fbc54a721154aae40107c2e3`. `.node-version` fija Node 24 para las compilaciones remotas.

Se verificó el ciclo automático completo: push a main → Workers Builds exitoso → versión `13e50e20-b642-41cb-8bf2-367d96ec8ae8` publicada al 100 % → carrusel disponible en thaiplast.cl. Build: `e7fd0c03-324a-40d0-9d29-dd13e58590c6`. No fue necesario publicar este cambio manualmente desde Wrangler. Los siguientes cambios de código enviados a main utilizan la integración existente.

Elimina del comando del proveedor la instalación dinámica de astro add cloudflare; el adaptador ya está versionado. Usa `npm ci && npm run build` con Node 24 y `npm run deploy` como comando de publicación. El despliegue debe usar la configuración generada por el adaptador. Verifica los bindings D1 y R2 en el Worker y conserva el dominio oficial. Los cambios de precios y fotos guardados desde /admin consultan la base vigente y no requieren desplegar código.

La sesión OAuth actual de Wrangler publica el Worker, pero la API de Workers Builds devuelve 403 por falta de Workers CI Read/Write. Eso impide editar sus comandos desde esta sesión, no ejecutar la integración Git ya configurada. Su resultado se verificó mediante la comprobación Workers Builds de GitHub, el historial de despliegues y el dominio público. Para modificar comandos futuros usa el panel de Cloudflare. Subir un commit por sí solo no demuestra que la publicación finalizó: comprueba siempre el build y la versión servida.

El respaldo previo está en `.local/deploy-backup`: código anterior, metadatos y SQL de D1. La versión anterior del Worker es `edce41d4-0d3a-48f2-9f42-1c215dc6bae7`.

## Comprobación y recuperación

Comprueba acceso privado, cambios de precio sin rebuild, galería, filtros, sitemap y pedido WhatsApp. Revisa errores del Worker e historial del panel. Un fallo de lectura de D1 se presenta como error; nunca sustituye silenciosamente los datos vigentes por un catálogo antiguo.

Para revertir código usa la versión anterior del Worker. Conserva el respaldo D1 antes de restaurar datos; una reversión de código no revierte precios. No borres la base ni R2 durante una reversión.
