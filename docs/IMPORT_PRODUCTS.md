# Importar y actualizar productos

Toda la información de productos sale de **`data/products.csv`** (o un `.xlsx`). El código
nunca contiene productos: editas el archivo y reimportas.

## Columnas del archivo

El archivo debe tener esta fila de encabezado (en este orden):

```
SKU,Categoría,Producto,Medida/Capacidad,Presentación,Color,Material,Uso Recomendado,Precio,Stock
```

- **Precio:** se acepta "$1.000" o "1000". Se guarda como entero.
- **Stock:** opcional. Si está vacío, no se muestra.
- **Categoría:** debe existir en `data/category-map.json`. Si es nueva, agrégala ahí.

## Flujo para actualizar precios o agregar productos

1. Edita `data/products.csv` (en Excel: "Guardar como" → CSV UTF-8) **o** `data/products.xlsx`.
2. Revisa que no haya errores:
   ```bash
   npm run validate
   ```
3. Regenera los datos:
   ```bash
   npm run import          # desde CSV
   npm run import:xlsx     # desde XLSX (instala antes: npm i -D xlsx)
   ```
4. Verifica localmente:
   ```bash
   npm run dev
   ```
5. Publica (ver [DEPLOYMENT.md](DEPLOYMENT.md)):
   ```bash
   git add data/ && git commit -m "Actualiza productos" && git push
   ```
   Cloudflare reconstruye el sitio solo. `npm run build` ya ejecuta el `import`.

## Agregar una categoría nueva

1. En `data/category-map.json`, agrega el nombre exacto de la categoría dentro del grupo que
   corresponda (o crea un grupo nuevo con su `slug`, `nombre`, `descripcion`, `icono`).
2. Reimporta. La categoría aparecerá en el menú y en los filtros.

## Fotos de producto

Hoy cada producto usa un **placeholder por grupo**. Para fotos reales:

1. Guarda la imagen en `public/img/products/<grupo>/<slug>.jpg` (cuadrada, ~600×600).
2. Agrega una columna `Imagen` al CSV con esa ruta, o ajusta `placeholderImage()` /
   el mapeo en `scripts/import-products.mjs`.

## Catálogos nuevos (PDF)

El catálogo PDF es **solo imágenes** (sin texto extraíble). El documento canónico siempre es
el CSV/Excel. Cuando llegue un catálogo nuevo, transcribe los productos al Excel y reimporta.
