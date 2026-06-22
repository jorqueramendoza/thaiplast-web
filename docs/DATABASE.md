# Modelo de datos

No hay base de datos: los "registros" son archivos JSON generados desde el CSV.

## `data/products.json` — un objeto por producto

| Campo | Tipo | Origen | Notas |
|---|---|---|---|
| `id` | string | generado | Único. Resuelve SKUs duplicados. Ej: `vasos-y-tapas-vaso-90-cc-tp-vas-001` |
| `sku` | string | CSV | Original (informativo; puede repetirse en el CSV) |
| `nombre` | string | CSV `Producto` | |
| `slug` | string | generado | Único, para la URL `/producto/{slug}` |
| `categoria` | string | CSV `Categoría` | Categoría cruda |
| `grupo` | string | category-map | Slug del grupo de navegación |
| `grupo_nombre` | string | category-map | Nombre visible del grupo |
| `medida` | string | CSV `Medida/Capacidad` | |
| `presentacion` | string | CSV `Presentación` | Ej. "Pack x50" |
| `color` | string | CSV `Color` | |
| `material` | string | CSV `Material` | Usado en el filtro |
| `uso` | string | CSV `Uso Recomendado` | |
| `descripcion` | string | generado | Plantilla: nombre + medida + material + uso |
| `precio` | number\|null | CSV `Precio` | Entero CLP (parseado de "$1.000") |
| `precio_formato` | string | generado | Ej. "$1.000" / "Consultar" |
| `imagen` | string | generado | Placeholder por grupo hasta cargar foto real |
| `unidad_venta` | string | = presentación | |
| `stock` | number\|string\|null | CSV `Stock` | Vacío en el CSV actual → `null` |
| `activo` | boolean | generado | `false` oculta el producto del sitio |
| `fecha_creacion` | string | generado | Se preserva entre importaciones |
| `fecha_actualizacion` | string | generado | Fecha de la última importación |

## `data/categories.json` — grupos de navegación

```jsonc
{
  "slug": "vasos-y-tapas",
  "nombre": "Vasos y Tapas",
  "descripcion": "…",
  "icono": "cup",
  "destacado": true,
  "conteo": 43,
  "categorias": [{ "nombre": "Vasos", "conteo": 8 }, …]
}
```

## `data/category-map.json` — configuración editable

Mapea cada `Categoría` del CSV a un grupo. Para mover una categoría de grupo, edita las
listas `categorias`. Si una categoría del CSV no está mapeada, el importador la asigna a
`otros` y lo reporta como advertencia.

## Taxonomía actual (11 grupos)

Vasos y Tapas · Envases y Contenedores · Bandejas y Platos · Cajas y Delivery · Bolsas ·
Film y Empaque · Copas y Postres · Cubiertos y Bombillas · Cafetería ·
Insumos Clínicos (Health) · Fiestas y Eventos.

## Problemas conocidos del CSV original

1. **SKUs duplicados** entre grupos (ej. `TP-VAS-001`). Resuelto con `id` único.
2. **5 filas "Vasos Térmicos"** con columnas desalineadas: se importan salvadas pero los
   campos medida/material quedan corridos. Conviene corregirlas en el Excel.
3. **Stock vacío** en todas las filas → `null` (no se muestra).
