import { describe, expect, it } from 'vitest';
import { MAX_CANTIDAD } from './cantidad';
import { BOLSA, consultarProducto, type Producto } from './catalogo';
import {
  puedeRegistrar,
  totalVenta,
  unidadesVenta,
  VENTA_VACIA,
  ventaReducer,
  type AccionVenta,
  type Venta,
} from './venta';

const producto = (codigo: string): Producto => {
  const r = consultarProducto(codigo);
  if (r.estado !== 'encontrado') throw new Error('producto de prueba no existe: ' + codigo);
  return r.producto;
};
const cerveza = producto('841000100001'); // 2,10 €
const pan = producto('841000100002'); // 1,80 €
const manzanas = producto('841000100003'); // 2,20 €

const aplicar = (v: Venta, ...acciones: AccionVenta[]) => acciones.reduce(ventaReducer, v);
const registrar = (p: Producto): AccionVenta => ({
  tipo: 'registrar',
  producto: p,
});
const codigos = (v: Venta) => v.lineas.map((l) => l.codigo);

describe('registrar', () => {
  it('un producto nuevo entra primero con cantidad 1, queda seleccionado y como último añadido', () => {
    const v = aplicar(VENTA_VACIA, registrar(cerveza));
    expect(v.lineas).toEqual([
      {
        codigo: cerveza.codigo,
        nombre: cerveza.nombre,
        precio: 210,
        cantidad: 1,
      },
    ]);
    expect(v.seleccionada).toBe(cerveza.codigo);
    expect(v.ultimoRegistrado).toBe(cerveza.codigo);
  });

  it('cada producto nuevo queda primero', () => {
    const v = aplicar(VENTA_VACIA, registrar(cerveza), registrar(pan), registrar(manzanas));
    expect(codigos(v)).toEqual([manzanas.codigo, pan.codigo, cerveza.codigo]);
  });

  it('un producto repetido suma 1, no duplica la línea y sube al primer lugar', () => {
    const v = aplicar(
      VENTA_VACIA,
      registrar(cerveza),
      registrar(pan),
      registrar(manzanas),
      registrar(cerveza),
    );
    expect(codigos(v)).toEqual([cerveza.codigo, manzanas.codigo, pan.codigo]);
    expect(v.lineas[0].cantidad).toBe(2);
    expect(v.lineas).toHaveLength(3);
    expect(v.seleccionada).toBe(cerveza.codigo);
    expect(v.ultimoRegistrado).toBe(cerveza.codigo);
  });

  it('el contador de registros sube aunque la longitud de la lista no cambie', () => {
    const v1 = aplicar(VENTA_VACIA, registrar(cerveza));
    const v2 = aplicar(v1, registrar(cerveza));
    expect(v2.lineas).toHaveLength(v1.lineas.length);
    expect(v2.registros).toBe(v1.registros + 1);
  });

  it('con 999 unidades no registra más y no cambia nada', () => {
    const lleno = aplicar(VENTA_VACIA, registrar(cerveza), {
      tipo: 'fijar-cantidad',
      codigo: cerveza.codigo,
      cantidad: MAX_CANTIDAD,
    });
    expect(puedeRegistrar(lleno, cerveza.codigo)).toBe(false);
    expect(puedeRegistrar(lleno, pan.codigo)).toBe(true);
    expect(ventaReducer(lleno, registrar(cerveza))).toBe(lleno);
  });

  it('la bolsa se registra como cualquier producto', () => {
    const v = aplicar(VENTA_VACIA, registrar(cerveza), registrar(BOLSA), registrar(BOLSA));
    expect(codigos(v)).toEqual([BOLSA.codigo, cerveza.codigo]);
    expect(v.lineas[0]).toMatchObject({ cantidad: 2, precio: 10 });
  });
});

describe('sumar (− y +)', () => {
  const base = aplicar(VENTA_VACIA, registrar(cerveza), registrar(pan), registrar(manzanas)); // manzanas, pan, cerveza

  it('+ y − cambian la cantidad sin reordenar ni cambiar «último añadido»', () => {
    const v = aplicar(
      base,
      { tipo: 'sumar', codigo: cerveza.codigo, delta: 1 },
      { tipo: 'sumar', codigo: cerveza.codigo, delta: 1 },
      { tipo: 'sumar', codigo: cerveza.codigo, delta: -1 },
    );
    expect(codigos(v)).toEqual(codigos(base));
    expect(v.lineas.find((l) => l.codigo === cerveza.codigo)?.cantidad).toBe(2);
    expect(v.ultimoRegistrado).toBe(base.ultimoRegistrado);
    expect(v.registros).toBe(base.registros);
  });

  it('− con 1 unidad no hace nada (la interfaz pide confirmar el borrado)', () => {
    expect(ventaReducer(base, { tipo: 'sumar', codigo: cerveza.codigo, delta: -1 })).toBe(base);
  });

  it('+ con 999 unidades no hace nada', () => {
    const lleno = aplicar(base, {
      tipo: 'fijar-cantidad',
      codigo: cerveza.codigo,
      cantidad: MAX_CANTIDAD,
    });
    expect(ventaReducer(lleno, { tipo: 'sumar', codigo: cerveza.codigo, delta: 1 })).toBe(lleno);
  });

  it('un código que no está en la venta no hace nada', () => {
    expect(ventaReducer(base, { tipo: 'sumar', codigo: '999', delta: 1 })).toBe(base);
  });
});

describe('fijar cantidad', () => {
  const base = aplicar(VENTA_VACIA, registrar(cerveza), registrar(pan));

  it('guarda una cantidad válida sin reordenar', () => {
    const v = aplicar(base, {
      tipo: 'fijar-cantidad',
      codigo: cerveza.codigo,
      cantidad: 6,
    });
    expect(v.lineas.find((l) => l.codigo === cerveza.codigo)?.cantidad).toBe(6);
    expect(codigos(v)).toEqual(codigos(base));
  });

  it.each([0, -3, 1000, 1.5, Number.NaN])('ignora la cantidad inválida %s', (cantidad) => {
    expect(
      ventaReducer(base, {
        tipo: 'fijar-cantidad',
        codigo: cerveza.codigo,
        cantidad,
      }),
    ).toBe(base);
  });
});

describe('quitar y seleccionar', () => {
  const base = aplicar(VENTA_VACIA, registrar(cerveza), registrar(pan), registrar(manzanas)); // seleccionada: manzanas

  it('quitar la línea seleccionada deja la selección vacía', () => {
    const v = aplicar(base, { tipo: 'quitar', codigo: manzanas.codigo });
    expect(codigos(v)).toEqual([pan.codigo, cerveza.codigo]);
    expect(v.seleccionada).toBeNull();
    expect(v.ultimoRegistrado).toBeNull();
  });

  it('quitar otra línea conserva la selección', () => {
    const v = aplicar(base, { tipo: 'quitar', codigo: cerveza.codigo });
    expect(v.seleccionada).toBe(manzanas.codigo);
    expect(v.ultimoRegistrado).toBe(manzanas.codigo);
  });

  it('seleccionar cambia solo la selección; un código ajeno se ignora', () => {
    const v = aplicar(base, { tipo: 'seleccionar', codigo: cerveza.codigo });
    expect(v.seleccionada).toBe(cerveza.codigo);
    expect(codigos(v)).toEqual(codigos(base));
    expect(ventaReducer(base, { tipo: 'seleccionar', codigo: 'x' })).toBe(base);
  });

  it('vaciar descarta la venta', () => {
    expect(aplicar(base, { tipo: 'vaciar' })).toEqual(VENTA_VACIA);
  });
});

describe('totales', () => {
  it('suma importes y unidades', () => {
    const v = aplicar(
      VENTA_VACIA,
      registrar(cerveza), // 2,10
      registrar(pan), // 1,80
      registrar(manzanas), // 2,20 × 3
      { tipo: 'fijar-cantidad', codigo: manzanas.codigo, cantidad: 3 },
    );
    expect(totalVenta(v)).toBe(210 + 180 + 660);
    expect(unidadesVenta(v)).toBe(1 + 1 + 3);
  });

  it('una venta vacía vale 0', () => {
    expect(totalVenta(VENTA_VACIA)).toBe(0);
    expect(unidadesVenta(VENTA_VACIA)).toBe(0);
  });
});

describe('inmutabilidad', () => {
  it('no modifica la venta anterior', () => {
    const antes = aplicar(VENTA_VACIA, registrar(cerveza));
    const copia = structuredClone(antes);
    aplicar(antes, registrar(pan), registrar(cerveza), {
      tipo: 'quitar',
      codigo: cerveza.codigo,
    });
    expect(antes).toEqual(copia);
  });
});
