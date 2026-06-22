# Guía del administrador (sin tecnicismos)

Esta guía es para mantener el sitio sin ser programador.

## ¿Cómo funciona en simple?

- Hay un **archivo de productos** (una planilla, como un Excel).
- Cuando cambias la planilla y la "subes", el sitio se actualiza solo.
- El sitio **no cobra online**: cada cliente termina escribiéndote por **WhatsApp**.

## Cambiar precios o agregar un producto

1. Abre `data/products.csv` con Excel.
2. Cambia el precio o agrega una fila nueva (respeta las columnas existentes).
3. Guarda como **CSV UTF-8**.
4. Avisa a quien mantiene el sitio (o sigue los pasos de [IMPORT_PRODUCTS.md](IMPORT_PRODUCTS.md))
   para reimportar y publicar.

## Cambiar el número de WhatsApp, correo o dirección

Estos datos están en un solo lugar: `src/lib/site.ts`. Hay que editar:
- `whatsapp`: tu número en formato internacional **sin "+"** (ej. `56912345678`).
- `whatsappLabel`: el número como se ve (ej. `+56 9 1234 5678`).
- `email`, `direccion`, `horario` y las redes sociales.

> ⚠️ Hoy esos valores son de ejemplo. **Hay que reemplazarlos por los reales antes de publicar.**

## Medir cuántas solicitudes llegan

Cada botón de WhatsApp incluye una etiqueta de origen en el mensaje (ej. "Origen: home-hero").
Así sabes desde qué parte del sitio te escribió cada cliente. Para estadísticas más completas,
se puede conectar Google Analytics más adelante (ver [ROADMAP.md](ROADMAP.md)).

## ¿Qué NO se puede romper fácil?

- Si borras un producto del CSV, simplemente deja de aparecer.
- Si pones `activo` en `false` (o quitas la fila), el producto se oculta.
- El sitio no guarda datos de clientes ni pagos: es solo catálogo + WhatsApp.
