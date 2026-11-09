import { describe, expect, it } from 'vitest';
import { formatearEuros } from './dinero';
import { importeLinea, totalVenta, VENTA_VACIA, ventaReducer } from './venta';
import { BOLSA } from './catalogo';

describe('dinero', () => {
  it('formatea céntimos como euros en español', () => {
    expect(formatearEuros(1290).replace(/\s/g, ' ')).toBe('12,90 €');
    expect(formatearEuros(0).replace(/\s/g, ' ')).toBe('0,00 €');
    expect(formatearEuros(10).replace(/\s/g, ' ')).toBe('0,10 €');
  });

  it('suma exacta: 3 bolsas de 0,10 € son 0,30 € (con decimales flotantes saldría 0,30000000000000004)', () => {
    expect(0.1 * 3).not.toBe(0.3);
    let v = VENTA_VACIA;
    for (let i = 0; i < 3; i++) v = ventaReducer(v, { tipo: 'registrar', producto: BOLSA });
    expect(importeLinea(v.lineas[0])).toBe(30);
    expect(totalVenta(v)).toBe(30);
  });
});
