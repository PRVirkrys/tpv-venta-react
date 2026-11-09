/** Dinero siempre en céntimos enteros: evita errores de coma flotante (0,1 × 3 ≠ 0,3). */
export type Centimos = number;

const formatoEuro = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

/** Por ejemplo, 1290 se muestra como "12,90 €". */
export function formatearEuros(centimos: Centimos): string {
  return formatoEuro.format(centimos / 100);
}
