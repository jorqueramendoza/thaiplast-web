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

Hoy cada producto usa un **placeholder por grupo**. El importador resuelve la imagen así
(función `resolveImage()` en `scripts/import-products.mjs`), en orden de prioridad:

1. **Columna `Imagen`** en el CSV (ruta `/img/...` o URL `https://...`), si existe.
2. **Archivo por slug**: `public/img/products/<grupo>/<slug>.(jpg|jpeg|webp|png|avif)`.
3. **Placeholder** del grupo.

### Forma recomendada (sin tocar el CSV)
1. Mira en `data/products.json` el `grupo` y el `slug` del producto.
2. Guarda la foto (cuadrada, ~600×600, WebP/JPG) como
   `public/img/products/<grupo>/<slug>.jpg`. Ejemplo:
   `public/img/products/vasos-y-tapas/vaso-90-cc-90-cc.jpg`.
3. `npm run import` y la foto aparece sola en la tarjeta y la ficha.

> Las fotos se pueden recortar desde las páginas del catálogo en `public/img/catalogo/`.

## Catálogo visual (páginas del PDF)

El catálogo PDF son **páginas-imagen** (sin texto extraíble). Para regenerar la galería
`/catalogo-visual` a partir del PDF:

```bash
npm run extract:catalogo   # vuelca las páginas a public/img/catalogo/pagina-*.jpg
```

Si llega un catálogo nuevo: reemplaza `Catálogo ThaiPlast .pdf` (o `public/catalogo-thaiplast.pdf`),
corre `npm run extract:catalogo` y vuelve a publicar. El documento canónico de **datos**
sigue siendo el CSV/Excel: transcribe los productos nuevos ahí y reimporta.
