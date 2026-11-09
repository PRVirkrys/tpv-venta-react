/** Dinero siempre en céntimos enteros: evita errores de coma flotante (0,1 × 3 ≠ 0,3). */
export type Centimos = number;

const formatoEuro = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

/** 1290 → "12,90 €" */
export function formatearEuros(centimos: Centimos): string {
  return formatoEuro.format(centimos / 100);
}
