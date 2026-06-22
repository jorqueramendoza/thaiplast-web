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
Así sabes desde qué parte del sitio te escribió cada cliente.

### Conectar analítica (para contar clics a WhatsApp)

El sitio ya registra el evento **`whatsapp_click`** en cada clic de WhatsApp. Solo falta
conectar una herramienta. Edita `src/lib/site.ts` → bloque `analytics`:

**Opción A — Google Analytics 4 (gratis):**
1. Crea una cuenta en <https://analytics.google.com> → Administrar → Crear propiedad.
2. Agrega un flujo de datos "Web" con tu dominio y copia el **ID de medición** (`G-XXXXXXXXXX`).
3. Pega ese ID en `analytics.ga4` y publica (`git push`).
4. En GA4, marca el evento `whatsapp_click` como **conversión** (Administrar → Eventos).

**Opción B — Plausible (más simple, de pago):**
1. Crea cuenta en <https://plausible.io>, agrega tu dominio.
2. Pon ese dominio en `analytics.plausibleDomain` y publica.
3. Verás el objetivo "WhatsApp" con la propiedad `origen`.

> Puedes usar una u otra (o ambas). Si dejas los dos en `''`, no se carga nada.

## ¿Qué NO se puede romper fácil?

- Si borras un producto del CSV, simplemente deja de aparecer.
- Si pones `activo` en `false` (o quitas la fila), el producto se oculta.
- El sitio no guarda datos de clientes ni pagos: es solo catálogo + WhatsApp.
