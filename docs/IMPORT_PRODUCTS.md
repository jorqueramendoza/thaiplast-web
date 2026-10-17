# Catálogo oficial e importaciones

## Preparación inicial

1. Ejecuta `node scripts/catalog-pdf.mjs "ruta/al/ThaiPlast_Catalogo_2026(1).pdf"` para extraer las 49 páginas y actualizar la descarga pública.
2. `npm run catalog:ocr` ayuda a leer las páginas. El OCR requiere modelos de español e inglés y no sustituye la revisión visual.
3. La transcripción revisada está en data/catalogo-oficial.txt. Cada sección empieza con @página, título, categoría, grupo e IVA, separados por barras verticales. Cada producto contiene nombre, medida, presentación, precio entero, alias exactos de carpetas separados por punto y coma, y notas.
4. El inventario de ambas ramas de Drive está en data/drive-inventory.json. Las descargas autenticadas se guardan por ID en artifacts/drive-originals; nunca se guardan enlaces temporales ni credenciales en Git.
5. `npm run import` optimiza imágenes, concilia los registros anteriores y produce la instantánea, informes y semilla SQL.
6. `npm run validate` comprueba IDs, slugs, precios, cobertura de páginas y existencia de los archivos.

El generador conserva una copia de los datos anteriores y reutiliza identificadores solo ante correspondencias inequívocas. Los demás se conservan como inactivos. Nunca inventa una asociación por similitud entre medidas diferentes.

## Entregables

entregables contiene la transcripción Markdown, el Excel completo, el Excel de faltantes y el PDF de productos sin imágenes. La hoja Sin imágenes incluye toda variante sin fotos asociadas, incluso si también aparece en Por verificar. La suma de estados no se obtiene sumando hojas superpuestas.

Los resultados de Drive se registran en entregables/drive-links.json. Los originales, OCR y bases de pruebas permanecen fuera de Git.

## Actualizaciones posteriores

Usa el administrador y su exportación Excel como plantilla. Las escrituras pasan por la misma validación del servidor y requieren la versión que se exportó. El build no importa archivos ni modifica la base.

Los comandos import:legacy e import:xlsx se conservan únicamente para recuperar el importador CSV/XLSX anterior. Esos comandos reemplazan la instantánea local; no deben usarse para mantener el catálogo oficial ni el catálogo publicado.
