# Arquitectura

Astro con renderizado en servidor y JavaScript nativo. La actualización a Astro 7 y adaptadores compatibles elimina los avisos críticos de la versión anterior al incorporar administración y solicitudes al servidor.

## Datos

El catálogo vigente reside en Cloudflare D1, no en un Excel ni en el JSON del build. Cada petición lee D1; los datos se comparten dentro de la petición mediante Astro.locals. Inicio, categorías, industrias, fichas, conteos, precios y sitemap consultan ese catálogo. El HTML y la API se sirven con Cache-Control: no-store.

Las pestañas públicas consultan la revisión cada 30 segundos y al recuperar el foco. Si cambió, recargan el catálogo. El pedido revalida los registros guardados en localStorage al abrirse, periódicamente y antes de generar WhatsApp. Los inactivos se señalan y bloquean el envío; los precios desconocidos permanecen como Consultar.

## Fotografías

Cada producto tiene una portada y hasta cuatro imágenes. Los archivos importados se optimizan a WebP con miniaturas y nombres por SHA-256. /media/catalog consulta R2 y conserva un respaldo de los archivos iniciales en los activos estáticos. Las nuevas cargas del panel van a R2. Los originales de Drive quedan en artifacts/drive-originals, excluidos de Git.

ProductCarousel se comparte entre las tarjetas y ProductGallery. El controlador usa JavaScript nativo, precarga únicamente la siguiente fotografía solicitada y aplica un fundido de 400 ms. Un IntersectionObserver suspende los temporizadores fuera de pantalla; foco, cursor y visibilidad de la pestaña también detienen la reproducción. Hay controles de pausa, teclado y gestos horizontales. prefers-reduced-motion desactiva el inicio automático y el fundido. Sin JavaScript se conserva la portada y el enlace del producto, sin controles inoperantes.

Drive conserva los archivos originales y las planillas de auditoría. La primera versión no sincroniza automáticamente cambios posteriores de Drive ni planillas editadas allí.

## Administración

Cloudflare Access identifica al administrador y la aplicación verifica firma, emisor, audiencia y correo del JWT en todas las rutas privadas, incluso en dominios alternativos. Las escrituras exigen mismo origen. No existe una contraseña guardada en código ni registro público de usuarios.

La validación ocurre en el servidor. La vista previa de Excel no modifica datos. Confirmar realiza una transacción que comprueba versiones, guarda registros y auditoría e incrementa la revisión. Un conflicto o error cancela todo el lote.

## Desarrollo

Cloudflare es el destino de producción. El servidor alternativo Node usa SQLite y almacenamiento dentro de .local, mediante un alias de compilación que no se incluye en el Worker. El acceso de pruebas solo funciona con import.meta.env.DEV, loopback y un token explícito. Las pruebas crean una base separada.

El sitio mantiene los pedidos por WhatsApp, sin cobros ni checkout.
