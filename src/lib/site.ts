/**
 * Configuración central del sitio y del negocio.
 * ⚠️ EDITAR estos valores con los datos reales de ThaiPlast antes de publicar.
 */
export const site = {
  nombre: 'ThaiPlast',
  tagline: 'Todo en desechables',
  descripcion:
    'Desechables y packaging por mayor para tu negocio: vasos, envases, bolsas, bandejas, cubiertos y más, con precios competitivos y despacho en Santiago y RM. Pide tu lista de precios por WhatsApp.',
  url: 'https://thaiplast.cl', // ← dominio final

  // WhatsApp: SOLO dígitos en formato internacional, sin "+" ni espacios.
  // Ej: Chile +56 9 1234 5678  ->  "56912345678"
  whatsapp: '56957896128',
  whatsappLabel: '+56 9 5789 6128', // visible para humanos

  email: 'thaiplast.spa@gmail.com',
  direccion: 'Maipú, Santiago de Chile', // ← confirmar/ajustar dirección real
  horario: 'Lun a Vie · 9:00 a 18:00', // ← confirmar/ajustar horario real

  redes: {
    instagram: 'https://instagram.com/thaiplast',
    facebook: '', // sin Facebook por ahora
  },

  // Métrica del proyecto: todas las conversiones apuntan a WhatsApp.
  // Estas etiquetas UTM permiten medir desde qué CTA llegó el lead.
  utmSource: 'web',

  // Analítica: deja en '' lo que no uses. Al poner un valor, el sitio carga
  // automáticamente ese servicio y registra el evento "whatsapp_click".
  //  - ga4: ID de Google Analytics 4, formato 'G-XXXXXXXXXX'
  //  - plausibleDomain: el dominio registrado en Plausible, ej. 'thaiplast.cl'
  analytics: {
    ga4: '',
    plausibleDomain: '',
  },
} as const;

export type IndustriaSlug =
  | 'minimarkets' | 'sushi-delivery' | 'cafeterias' | 'salud-clinicas' | 'food-trucks';

export const industrias = [
  {
    slug: 'minimarkets',
    nombre: 'Minimarkets y Almacenes',
    corto: 'Minimarkets',
    descripcion: 'Todo el desechable para tu punto de venta: bolsas, rollos, film y empaque por mayor.',
    grupos: ['bolsas', 'film-y-empaque', 'vasos-y-tapas'],
    icono: 'store',
  },
  {
    slug: 'sushi-delivery',
    nombre: 'Sushi y Delivery',
    corto: 'Sushi y Delivery',
    descripcion: 'Envases que mantienen la comida perfecta hasta la puerta del cliente.',
    grupos: ['envases-y-contenedores', 'cajas-y-delivery', 'cubiertos-y-bombillas'],
    icono: 'delivery',
  },
  {
    slug: 'cafeterias',
    nombre: 'Cafeterías y Pastelerías',
    corto: 'Cafeterías',
    descripcion: 'Vasos térmicos, polipapel, tapas, cúpulas y todo para servir con calidad.',
    grupos: ['vasos-y-tapas', 'copas-y-postres', 'cafeteria'],
    icono: 'coffee',
  },
  {
    slug: 'salud-clinicas',
    nombre: 'Salud y Clínicas · Health',
    corto: 'Salud y Clínicas',
    descripcion: 'Insumos clínicos desechables certificados para entornos exigentes.',
    grupos: ['insumos-clinicos'],
    icono: 'health',
  },
  {
    slug: 'food-trucks',
    nombre: 'Food Trucks y Comida Rápida',
    corto: 'Food Trucks',
    descripcion: 'Cajas, bandejas, canastos y envases resistentes para alto volumen.',
    grupos: ['cajas-y-delivery', 'bandejas-y-platos', 'envases-y-contenedores'],
    icono: 'truck',
  },
] as const;
