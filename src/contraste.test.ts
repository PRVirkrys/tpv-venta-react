import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Se lee el archivo original: con `?raw` el plugin de Tailwind lo procesa y abrevia los colores.
const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8');

/**
 * Contraste de color de los pares texto/fondo de la paleta (WCAG 2.x). axe-core no lo mide en jsdom,
 * así que se calcula aquí con los valores reales de `index.css`.
 */
const tokens: Record<string, string> = {};
for (const m of css.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) tokens[m[1]] = m[2];

const lineal = (c: number) =>
  (c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const luminancia = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lineal(n >> 16) + 0.7152 * lineal((n >> 8) & 255) + 0.0722 * lineal(n & 255);
};
const color = (c: string) => tokens[c] ?? c;
function contraste(a: string, b: string) {
  const [claro, oscuro] = [luminancia(color(a)), luminancia(color(b))].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Texto (primer color) sobre su fondo (segundo). Exigen 4,5:1. Los estados desactivados están exentos. */
const textos: [string, string, string][] = [
  ['ink', 'surface', 'texto general'],
  ['ink', 'canvas', 'texto sobre el fondo de la pantalla'],
  ['ink', 'surface-subtle', 'texto sobre controles'],
  ['ink-muted', 'surface', 'texto secundario (meta 12 px)'],
  ['ink-muted', 'canvas', 'texto secundario sobre el fondo'],
  ['ink-muted', 'surface-subtle', 'encabezado de la tabla, buscador y etiqueta del cajero'],
  ['primary-ink', 'primary', 'botones principales (Cobrar, Guardar…)'],
  ['primary-ink', 'primary-pressed', 'botón principal pulsado'],
  ['primary', 'surface', 'cifras y «En ticket» activos'],
  ['primary', '#fffbf7', '«En ticket» sobre la tarjeta activa'],
  ['select-ink', 'select-tint', 'fila seleccionada'],
  ['error-ink', 'error-surface', 'errores y diálogos de peligro'],
  ['error-ink', 'surface', 'Quitar de la venta, Descartar venta'],
  ['warning-ink', 'warning-surface', 'avisos y «Último añadido»'],
  ['success-ink', 'success-surface', 'escáner listo y venta completada'],
  ['#ffffff', 'error-solid', 'botón de peligro'],
  ['#ffffff', 'ink', 'pestaña activa del catálogo'],
  // Estados hover
  ['primary-ink', 'primary-hover', 'botón principal con ratón encima'],
  ['ink', 'surface-hover', 'control neutro con ratón encima'],
  ['error-ink', 'error-hover', 'Descartar / Quitar con ratón encima'],
  ['#ffffff', 'error-hover-solid', 'botón de peligro con ratón encima'],
  // Estados pulsados
  ['ink', 'surface-pressed', 'control neutro pulsado'],
  ['ink', 'surface-subtle', 'opción de pago pulsada'],
  ['error-pressed', 'error-press', 'Descartar / Quitar pulsados'],
  ['#ffffff', 'error-pressed', 'botón de peligro pulsado'],
];

describe('contraste de la paleta (texto, AA 4,5:1)', () => {
  it.each(textos)('%s sobre %s · %s', (a, b) =>
    expect(contraste(a, b)).toBeGreaterThanOrEqual(4.5),
  );

  it('el gris atenuado (ink-muted) llega a 4,5:1 también sobre todos los fondos claros donde se usa', () => {
    for (const fondo of ['surface', 'canvas', 'surface-subtle']) {
      expect(contraste('ink-muted', fondo), fondo).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('los estados desactivados están exentos de contraste (WCAG 1.4.3) y se atenúan a propósito', () => {
    expect(contraste('disabled-ink', 'disabled-surface')).toBeLessThan(4.5);
  });
});

describe('contraste de elementos gráficos (WCAG 1.4.11, 3:1) · informativo', () => {
  it('los campos donde se escribe tienen borde fuerte (line-strong)', () => {
    expect(contraste('line-strong', 'surface')).toBeGreaterThanOrEqual(3);
  });

  it('los bordes de los botones (line-control) quedan por debajo de 3:1; cada botón se identifica además por su texto y su relleno', () => {
    expect(contraste('line-control', 'surface')).toBeLessThan(3);
    expect(contraste('line-control', 'surface-subtle')).toBeLessThan(3);
  });
});
