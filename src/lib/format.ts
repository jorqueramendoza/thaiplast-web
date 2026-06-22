/** Formatea un entero CLP a "$1.234". Devuelve "Consultar" si es null. */
export function formatCLP(value: number | null | undefined): string {
  if (value == null) return 'Consultar';
  return '$' + value.toLocaleString('es-CL');
}

/** Texto corto de presentación: "Pack x50" -> "Pack x50". Vacío -> "Unidad". */
export function unidad(presentacion?: string | null): string {
  const p = (presentacion || '').trim();
  return p === '' ? 'Unidad' : p;
}
