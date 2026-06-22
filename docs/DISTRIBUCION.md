# Kit de distribución — cómo llevar visitas (y leads) al sitio

El sitio ya está en línea, pero **sin visitas no hay solicitudes**. Esto es lo más barato y
de mayor impacto. Aquí tienes todo listo para copiar/pegar.

Link a compartir (provisional, hasta tener dominio):
**https://thaiplast-web.jorquera-mendoza.workers.dev**

---

## 1. Google Business Profile (lo más importante para "ser encontrado")

Crea/optimiza la ficha en <https://business.google.com>. Aparecerás en Google y Maps
cuando busquen "desechables", "envases", "vasos por mayor" en tu zona.

Campos sugeridos (ajusta a tu realidad):

- **Nombre:** ThaiPlast
- **Categoría principal:** Proveedor de envases / Tienda de artículos para fiestas
  (elige la más cercana; categoría secundaria: "Mayorista")
- **Área de servicio:** Maipú y Región Metropolitana (si no atiendes público en local,
  configúralo como "negocio con área de servicio", sin dirección visible).
- **Teléfono:** +56 9 5789 6128 (WhatsApp)
- **Sitio web:** el link de arriba (o tu dominio cuando lo tengas)
- **Horario:** _por confirmar_
- **Descripción (copiar):**
  > ThaiPlast — todo en desechables. Distribuidor de packaging y desechables por mayor
  > para minimarkets, cafeterías, delivery, food trucks y clínicas: vasos, envases, bolsas,
  > bandejas, cubiertos y más. Precios competitivos y despacho en Santiago y RM.
  > Pide tu lista de precios por WhatsApp.
- **Fotos:** sube el logo (`public/img/brand/logo.jpg`), la portada del catálogo
  (`public/img/catalogo/pagina-01.jpg`) y algunas páginas del catálogo.
- **Botón de acción:** enlaza a WhatsApp o al sitio.

> Tip: responde reseñas y publica novedades; Google premia la actividad.

## 2. Instagram (@thaiplast)

- **Bio:** agrega el link del sitio como "enlace" del perfil.
  Texto sugerido: "🛒 Todo en desechables por mayor · Pide por WhatsApp 👇 [link]".
- **Historias/Posts (ideas):**
  - "Nuevo catálogo 2026 online 👉 [link]" (usa la portada del catálogo como imagen).
  - "Arma tu pedido en 1 minuto y nos llega por WhatsApp 📲" (muestra `/pedido`).
  - Publica 2-3 productos destacados con el link a su ficha.

## 3. WhatsApp (tu base de clientes actual)

- Pon el link en tu **estado de WhatsApp** y en la **info del negocio**.
- Mensaje para difundir a clientes:
  > ¡Hola! Ya puedes ver todo nuestro catálogo y armar tu pedido aquí: [link] 🛒
  > Cualquier duda, respóndeme por aquí. — ThaiPlast

## 4. Otros canales gratis

- Firma de correo con el link.
- Tarjetas/volantes con un **QR** al sitio (ver abajo).
- Marketplaces locales / grupos de comerciantes de tu comuna.

### QR del sitio (para mostrador, bolsas, volantes)

Hay un generador listo. Crea un PNG de alta resolución (900 px, navy de marca) que
apunta a `https://thaiplast.cl`:

```bash
npm run qr
```

Salida: **`public/img/brand/qr-thaiplast.png`** (listo para imprimir).

> Pendiente de generar hasta que el dominio `thaiplast.cl` esté activo, para que el QR
> apunte al dominio final. Cuando lo necesites, pídelo y se genera al instante
> (o corre `npm run qr`). Si cambia la URL, edita `URL` en `scripts/make-qr.mjs`.

---

## 5. Medir si funciona

Con la analítica conectada (ver `docs/ADMIN_GUIDE.md` → "Conectar analítica") sabrás
**cuántos clics a WhatsApp** llega y **desde dónde** (cada botón manda su "origen"). Esa es
la métrica que importa: optimiza lo que más leads genere.
