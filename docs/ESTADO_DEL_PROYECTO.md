# Estado del proyecto — Catálogo 2026

La implementación publicada en https://thaiplast.cl reemplaza el catálogo estático por un catálogo administrable. D1 es la fuente vigente de productos y precios; guardar desde /admin no requiere una nueva publicación.

## Datos y archivos entregados

- 49 páginas del PDF oficial extraídas y 45 páginas de productos transcritas y revisadas visualmente.
- 325 variantes oficiales. Se conservan 43 identificadores anteriores; 319 registros anteriores quedan inactivos por falta de correspondencia inequívoca.
- 170 carpetas de Drive auditadas, 18 vacías, 485 archivos descargados y procesados sin errores.
- 191 variantes sin fotografías asociadas, 42 con galería incompleta y seis por verificar. Cinco de estas seis también están en Sin imágenes.
- Markdown, Excel completo, Excel de faltantes y PDF en entregables; copias verificadas en THAIPLAST WEB de Drive. Enlaces en entregables/drive-links.json.

## Implementación

Panel /admin, validación de acceso y origen, edición de productos y galerías, importación Excel con vista previa, exportaciones, historial y control de versiones. Catálogo, fichas, precios, conteos y sitemap consultan D1. Los pedidos revalidan precios y productos antes de generar WhatsApp.

Los activos iniciales tienen WebP y miniaturas; las cargas del administrador usan R2. El sitio preserva identidad visual y pedidos por WhatsApp.

## Producción publicada

La cuenta Cloudflare jorquera.mendoza@gmail.com está autenticada. Las bases D1 thaiplast-catalog y thaiplast-catalog-preview están creadas y sus IDs están configurados. El usuario activó R2; se crearon thaiplast-products y thaiplast-products-preview. El contenedor de producción recibió 766 archivos de imágenes y miniaturas (26,836,336 bytes); cinco descargas de comprobación coincidieron por SHA-256 con sus originales locales. El contenedor de prueba todavía está vacío. La evidencia está en artifacts/r2-upload-verification.json.

El propietario configuró Cloudflare Access con la política Administrador ThaiPlast y One-time PIN para /admin y /api/admin. El dominio del equipo y el AUD se verificaron mediante las redirecciones públicas y se configuraron en producción. La primera versión administrable fue `74ffcebf-7844-4cdc-8a5c-0244000a2646`, en el proyecto existente thaiplast-web y su dominio thaiplast.cl. SESSION KV quedó vinculado; workers.dev y las URL de versiones de producción están deshabilitados.

Se verificaron 325 productos con los precios esperados, páginas públicas, sitemap, imágenes y miniaturas con SHA-256, redirecciones de todas las rutas administrativas a Access y respuesta 404 para un producto inexistente. Evidencia en artifacts/live-verification.json. El propietario debe completar la prueba de inicio de sesión por correo; no se solicitó ni utilizó su código.

El respaldo anterior está en .local/deploy-backup. La implementación se guardó y subió a GitHub en `f14f29d42738a597fbc54a721154aae40107c2e3`, con autorización del propietario. Workers Builds publicó automáticamente la versión `13e50e20-b642-41cb-8bf2-367d96ec8ae8` al 100 %. Se verificaron el resultado exitoso en GitHub, la versión activa en Cloudflare y el carrusel servido por thaiplast.cl. La automatización GitHub → Cloudflare funciona; no fue necesario publicar este cambio por CLI. La sesión OAuth no puede editar comandos de Builds, pero esa limitación no bloquea la integración existente.

## Carruseles

Las tarjetas y fichas comparten carrusel con fundido, rotación cada cinco segundos, miniaturas o indicadores, anterior/siguiente, pausa, teclado y deslizamiento móvil. Solo rota cuando tiene dos o más fotografías y está visible. Respeta movimiento reducido y conserva la portada sin JavaScript. Las pruebas de navegador cubren reproducción, pausa, interacción, imágenes faltantes, móvil y respaldo estático, además de los flujos existentes del administrador y pedido.

Empieza por README.md y DEPLOYMENT.md. Las pruebas de navegador se ejecutan en una base local aislada; nunca modifican Drive ni producción.
