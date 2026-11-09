import { describe, expect, it } from 'vitest';
import { CATALOGO, consultarProducto, productosDe } from './catalogo';

describe('consultarProducto', () => {
  it('encuentra un producto por su código', () => {
    const r = consultarProducto('841000100001');
    expect(r).toEqual({
      estado: 'encontrado',
      producto: expect.objectContaining({
        nombre: 'Cerveza lata 33 cl',
        precio: 210,
      }),
    });
  });

  it('ignora espacios alrededor del código', () => {
    expect(consultarProducto(' 841000100001 ').estado).toBe('encontrado');
  });

  it('un código con solo números que no existe es «no encontrado»', () => {
    expect(consultarProducto('000000000000')).toEqual({
      estado: 'no-encontrado',
    });
  });

  it.each(['', '   ', '8410001A0001', '84100.1', '-1'])(
    'el código %j no es válido (solo números)',
    (c) => {
      expect(consultarProducto(c)).toEqual({ estado: 'codigo-invalido' });
    },
  );

  it('trata el código como texto: no iguala «0841…» con «841…»', () => {
    expect(consultarProducto('0841000100001')).toEqual({
      estado: 'no-encontrado',
    });
  });
});

describe('catálogo', () => {
  it('tiene códigos únicos y precios en céntimos enteros positivos', () => {
    expect(new Set(CATALOGO.map((p) => p.codigo)).size).toBe(CATALOGO.length);
    for (const p of CATALOGO) {
      expect(Number.isInteger(p.precio)).toBe(true);
      expect(p.precio).toBeGreaterThan(0);
    }
  });

  it('Fruta y Verdura son categorías separadas y no vacías', () => {
    expect(productosDe('fruta').length).toBeGreaterThan(0);
    expect(productosDe('verdura').length).toBeGreaterThan(0);
    expect(productosDe('fruta').some((p) => productosDe('verdura').includes(p))).toBe(false);
  });
});

describe('pestañas del catálogo rápido', () => {
  it.each(['panaderia', 'fruta', 'verdura'] as const)(
    '%s muestra todos sus productos del catálogo, una sola vez y de su categoría',
    (categoria) => {
      const enPestana = productosDe(categoria).map((p) => p.codigo);
      const enCatalogo = CATALOGO.filter((p) => p.categoria === categoria).map((p) => p.codigo);
      expect(new Set(enPestana).size).toBe(enPestana.length);
      expect([...enPestana].sort()).toEqual([...enCatalogo].sort());
    },
  );

  it('siguen el orden del catálogo rápido del prototipo (Pan de molde entre la bollería, Manzanas entre la fruta)', () => {
    expect(productosDe('panaderia').map((p) => p.nombre)).toEqual([
      'Barra de pan rústica',
      'Baguette tradicional',
      'Croissant mantequilla',
      'Napolitana de chocolate',
      'Pan de molde familiar',
      'Empanada gallega de atún',
    ]);
    expect(
      productosDe('fruta')
        .map((p) => p.nombre)
        .slice(0, 2),
    ).toEqual(['Plátano de Canarias', 'Manzanas Golden bolsa']);
  });
});
