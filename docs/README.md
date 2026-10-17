# ThaiPlast — Catálogo administrable

El catálogo oficial es ThaiPlast_Catalogo_2026(1).pdf, de 49 páginas. La transcripción contiene 325 variantes publicables. Hay 191 sin fotografías asociadas, 42 con galería incompleta y seis asociaciones por verificar; cinco de estas últimas también carecen de fotos.

## Empezar

- `npm install`: instalar dependencias.
- `npm run dev:local`: abrir el sitio en localhost con SQLite y archivos locales, sin Cloudflare.
- `npm run dev`: emular el destino Cloudflare, con D1 y R2 locales.
- `npm run validate`, `npm test`, `npm run check`: verificar datos y código.
- `npm run test:browser`: probar panel, Excel, precios, fotografías y pedido en una base aislada.
- `npm run build`: compilar para Cloudflare Workers.

El panel de producción exige Cloudflare Access. El modo local permanece cerrado salvo que se configure explícitamente un token de pruebas; el test de navegador lo genera temporalmente y no lo publica.

## Documentación vigente

- [Estado y entregables](ESTADO_DEL_PROYECTO.md).
- [Arquitectura](ARCHITECTURE.md).
- [Modelo de datos](DATABASE.md).
- [Guía del administrador](ADMIN_GUIDE.md).
- [Importación y generación de informes](IMPORT_PRODUCTS.md).
- [Configuración y publicación](DEPLOYMENT.md).

`docs/BITACORA.md` conserva el historial del sitio anterior. Los documentos de SEO, distribución y roadmap describen trabajo previo y deben interpretarse con esta arquitectura actual.
