# Modelo de datos

## Cloudflare D1

- products: id estable, slug único, active, version y data JSON con los atributos del producto.
- catalog_meta: revisión global, usada para detectar cambios en pestañas abiertas.
- audit_log: actor, acción, producto, valor anterior, valor nuevo y fecha UTC.
- write_guards: control transaccional de versiones; una discrepancia aborta el lote completo.

El esquema está en migrations/0001_catalog.sql. El archivo artifacts/catalog-seed.sql sirve para la carga inicial con INSERT OR IGNORE; no sobrescribe productos ya editados.

## Producto

Se conservan nombre, SKU, categoría, grupo, medida, presentación, color, material, uso, descripción, precio CLP, stock, estado, slug y fechas. Se agregan:

- imagenes: hasta cuatro objetos con src, thumbnail, alt, driveId y sha256.
- imagenes_compartidas: indica fotografías representativas de una familia.
- estado_imagenes: sin_imagenes, galeria_incompleta, galeria_completa o pendiente_verificacion.
- carpetas_drive: enlaces de origen verificados.
- pagina_catalogo: página física del PDF oficial, incluyendo portada.
- iva: Incluido, No incluido o No indicado.
- notas: aclaraciones internas y diferencias del documento.
- version: número requerido en ediciones e importaciones para evitar sobrescrituras.

precio_formato e imagen se derivan del precio y la portada. Un precio desconocido es null y se muestra Consultar; nunca se transforma en cero. Stock vacío significa desconocido, no disponible.

El SKU puede repetirse en datos históricos. El identificador es la clave de edición y el slug existente permanece estable. Los IDs nuevos son independientes del nombre.

## Archivos de origen y auditoría

data/catalogo-oficial.txt contiene la transcripción tabular revisada. data/drive-inventory.json conserva el inventario completo; data/image-manifest.json describe los archivos optimizados. data/catalog-reconciliation.json registra cantidades y carpetas sin correspondencia. data/products-legacy.json conserva los 362 registros anteriores.

data/products.json es una instantánea para preparar la carga inicial y los informes. No se reimporta durante el build ni reemplaza la base de datos en producción.
