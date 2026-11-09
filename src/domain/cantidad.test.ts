import { describe, expect, it } from 'vitest';
import { leerCantidad, MAX_CANTIDAD } from './cantidad';

describe('leerCantidad', () => {
  it('acepta enteros de 1 a 999', () => {
    expect(leerCantidad('1')).toBe(1);
    expect(leerCantidad(' 42 ')).toBe(42);
    expect(leerCantidad(String(MAX_CANTIDAD))).toBe(999);
  });

  it.each(['', ' ', '0', '1000', '-1', '1.5', '1,5', 'abc', '1e2', '99999999999999999999'])(
    'rechaza %j',
    (texto) => expect(leerCantidad(texto)).toBeNull(),
  );
});
