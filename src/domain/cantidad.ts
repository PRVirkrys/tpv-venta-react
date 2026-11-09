/** Máximo de unidades por producto (regla del wireframe). */
export const MAX_CANTIDAD = 999;

/**
 * Convierte el texto escrito en el editor en una cantidad válida.
 * Solo enteros de 1 a 999; cualquier otra cosa (vacío, 0, decimales, letras, 1000…) devuelve null.
 */
export function leerCantidad(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^\d+$/.test(limpio)) return null;
  const n = Number(limpio);
  return Number.isSafeInteger(n) && n >= 1 && n <= MAX_CANTIDAD ? n : null;
}
