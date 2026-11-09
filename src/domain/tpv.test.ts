import { describe, expect, it } from 'vitest';
import { BOLSA, consultarProducto, type ResultadoConsulta } from './catalogo';
import { MAX_CANTIDAD } from './cantidad';
import {
  hayCantidadSinGuardar,
  lineaSeleccionada,
  TPV_INICIAL,
  tpvReducer,
  type AccionTpv,
  type Tpv,
} from './tpv';
import { totalVenta } from './venta';

const leer = (codigo: string): ResultadoConsulta => consultarProducto(codigo);
const CERVEZA = '841000100001';
const PAN = '841000100002';
const MANZANAS = '841000100003';
const ARROZ = '841000100004';

const escanear = (codigo: string): AccionTpv => ({
  tipo: 'producto-leido',
  resultado: leer(codigo),
});
const aplicar = (t: Tpv, ...acciones: AccionTpv[]) => acciones.reduce(tpvReducer, t);
const codigos = (t: Tpv) => t.venta.lineas.map((l) => l.codigo);
const cantidadDe = (t: Tpv, codigo: string) =>
  t.venta.lineas.find((l) => l.codigo === codigo)?.cantidad;

/** Venta con cerveza (1), pan (1) y manzanas (3); manzanas primero y seleccionada. */
const conProductos = () =>
  aplicar(
    TPV_INICIAL,
    escanear(CERVEZA),
    escanear(PAN),
    escanear(MANZANAS),
    escanear(MANZANAS),
    escanear(MANZANAS),
  );

/** Igual, con el editor abierto sobre las manzanas y el borrador cambiado a 7. */
const editandoSucio = () =>
  aplicar(
    conProductos(),
    { tipo: 'abrir-editor', codigo: MANZANAS },
    { tipo: 'borrador-cantidad', texto: '7' },
  );

describe('escaneo', () => {
  it('registra el producto: primero en la lista, seleccionado y sin aviso', () => {
    const t = aplicar(TPV_INICIAL, escanear(CERVEZA), escanear(PAN));
    expect(codigos(t)).toEqual([PAN, CERVEZA]);
    expect(t.venta.seleccionada).toBe(PAN);
    expect(t.aviso).toBeNull();
  });

  it('un escaneo repetido sube el producto al primer lugar aunque se estuviera revisando otro más abajo', () => {
    const t = aplicar(conProductos(), { tipo: 'seleccionar', codigo: CERVEZA }, escanear(CERVEZA));
    expect(codigos(t)[0]).toBe(CERVEZA);
    expect(cantidadDe(t, CERVEZA)).toBe(2);
    expect(t.venta.seleccionada).toBe(CERVEZA);
  });

  it('con 999 unidades avisa del límite y no cambia la venta', () => {
    const lleno = aplicar(conProductos(), {
      tipo: 'fijar-cantidad',
      cantidad: MAX_CANTIDAD,
    });
    const t = aplicar(lleno, escanear(MANZANAS));
    expect(t.aviso).toBe('limite-unidades');
    expect(t.venta).toBe(lleno.venta);
  });

  it('con la bolsa: se añade como un producto más', () => {
    const t = aplicar(conProductos(), { tipo: 'registrar-bolsa' }, { tipo: 'registrar-bolsa' });
    expect(codigos(t)[0]).toBe(BOLSA.codigo);
    expect(cantidadDe(t, BOLSA.codigo)).toBe(2);
  });
});

describe('código no leído o inexistente: entrada manual automática', () => {
  it('un código que no existe abre la entrada manual con el aviso, sin tocar la venta', () => {
    const base = conProductos();
    const t = aplicar(base, escanear('000000000000'));
    expect(t.modo).toEqual({
      tipo: 'codigo-manual',
      borrador: '',
      error: null,
    });
    expect(t.aviso).toBe('producto-no-encontrado');
    expect(t.venta).toBe(base.venta);
  });

  it('una lectura ilegible o fallida abre la entrada manual con «código no leído»', () => {
    expect(aplicar(TPV_INICIAL, escanear('84A')).aviso).toBe('codigo-no-leido');
    const t = aplicar(TPV_INICIAL, { tipo: 'lectura-fallida' });
    expect(t.modo.tipo).toBe('codigo-manual');
    expect(t.aviso).toBe('codigo-no-leido');
  });

  it('escanear un producto válido con la entrada manual abierta la cierra y lo registra', () => {
    const t = aplicar(TPV_INICIAL, { tipo: 'lectura-fallida' }, escanear(CERVEZA));
    expect(t.modo.tipo).toBe('escaneo');
    expect(t.aviso).toBeNull();
    expect(codigos(t)).toEqual([CERVEZA]);
  });
});

describe('código manual', () => {
  const manual = () => aplicar(conProductos(), { tipo: 'abrir-codigo-manual' });

  it('al abrirlo sin error previo, la tarjeta dice «código manual»', () => {
    expect(manual().modo).toEqual({
      tipo: 'codigo-manual',
      borrador: '',
      error: null,
    });
    expect(manual().aviso).toBe('codigo-manual');
  });

  it('un código válido añade el producto y vuelve al escaneo', () => {
    const t = aplicar(manual(), {
      tipo: 'enviar-codigo-manual',
      resultado: leer(ARROZ),
    });
    expect(codigos(t)[0]).toBe(ARROZ);
    expect(t.modo.tipo).toBe('escaneo');
    expect(t.aviso).toBeNull();
  });

  it('un código con letras da error en el campo, sin aviso nuevo ni cambios en la venta', () => {
    const base = manual();
    const t = aplicar(base, {
      tipo: 'enviar-codigo-manual',
      resultado: leer('12A'),
    });
    expect(t.modo).toEqual({
      tipo: 'codigo-manual',
      borrador: '',
      error: 'codigo-invalido',
    });
    expect(t.venta).toBe(base.venta);
  });

  it('un código inexistente da error en el campo y aviso en la tarjeta, y se mantiene abierta', () => {
    const t = aplicar(manual(), {
      tipo: 'enviar-codigo-manual',
      resultado: leer('000'),
    });
    expect(t.modo).toMatchObject({
      tipo: 'codigo-manual',
      error: 'no-encontrado',
    });
    expect(t.aviso).toBe('producto-no-encontrado');
  });

  it('escribir borra el error; «Volver al escaneo» cierra y quita el aviso', () => {
    const conError = aplicar(manual(), {
      tipo: 'enviar-codigo-manual',
      resultado: leer('12A'),
    });
    const escribiendo = aplicar(conError, {
      tipo: 'borrador-codigo',
      texto: '8410',
    });
    expect(escribiendo.modo).toEqual({
      tipo: 'codigo-manual',
      borrador: '8410',
      error: null,
    });
    const cerrado = aplicar(escribiendo, { tipo: 'cerrar-codigo-manual' });
    expect(cerrado.modo.tipo).toBe('escaneo');
    expect(cerrado.aviso).toBeNull();
  });
});

describe('editor de cantidad', () => {
  it('se abre con la cantidad actual como borrador', () => {
    const t = aplicar(conProductos(), {
      tipo: 'abrir-editor',
      codigo: MANZANAS,
    });
    expect(t.modo).toEqual({ tipo: 'cantidad', borrador: '3', error: false });
    expect(hayCantidadSinGuardar(t)).toBe(false);
  });

  it('guardar una cantidad válida la aplica sin reordenar y cierra el editor', () => {
    const base = conProductos();
    const t = aplicar(editandoSucio(), { tipo: 'guardar-cantidad' });
    expect(cantidadDe(t, MANZANAS)).toBe(7);
    expect(codigos(t)).toEqual(codigos(base));
    expect(t.modo.tipo).toBe('escaneo');
  });

  it.each(['0', '1000', '', '2.5', 'abc'])(
    'guardar el borrador inválido %j muestra el error y no cambia la venta',
    (texto) => {
      const base = aplicar(conProductos(), {
        tipo: 'abrir-editor',
        codigo: MANZANAS,
      });
      const t = aplicar(base, { tipo: 'borrador-cantidad', texto }, { tipo: 'guardar-cantidad' });
      expect(t.modo).toMatchObject({ tipo: 'cantidad', error: true });
      expect(t.venta).toBe(base.venta);
    },
  );

  it('escribir de nuevo borra el error', () => {
    const t = aplicar(
      conProductos(),
      { tipo: 'abrir-editor', codigo: MANZANAS },
      { tipo: 'borrador-cantidad', texto: '0' },
      { tipo: 'guardar-cantidad' },
      { tipo: 'borrador-cantidad', texto: '5' },
    );
    expect(t.modo).toEqual({ tipo: 'cantidad', borrador: '5', error: false });
  });

  it('cancelar descarta el borrador', () => {
    const t = aplicar(editandoSucio(), { tipo: 'cancelar-editor' });
    expect(t.modo.tipo).toBe('escaneo');
    expect(cantidadDe(t, MANZANAS)).toBe(3);
  });

  it('tocar otra vez el producto que se está editando no cambia nada', () => {
    const base = editandoSucio();
    expect(aplicar(base, { tipo: 'seleccionar', codigo: MANZANAS })).toBe(base);
    expect(aplicar(base, { tipo: 'abrir-editor', codigo: MANZANAS })).toBe(base);
  });

  it('+ y − sobre el producto editado actualizan el borrador', () => {
    const t = aplicar(
      conProductos(),
      { tipo: 'abrir-editor', codigo: MANZANAS },
      { tipo: 'sumar', codigo: MANZANAS, delta: 1 },
    );
    expect(t.modo).toEqual({ tipo: 'cantidad', borrador: '4', error: false });
  });
});

describe('cantidad sin guardar + acción que cambia de contexto', () => {
  it('sin cambios en el borrador no se pregunta: se cierra el editor y se ejecuta la acción', () => {
    const t = aplicar(conProductos(), { tipo: 'abrir-editor', codigo: MANZANAS }, escanear(ARROZ));
    expect(t.dialogo).toBeNull();
    expect(t.modo.tipo).toBe('escaneo');
    expect(codigos(t)[0]).toBe(ARROZ);
  });

  it('escanear con cambios pendientes pregunta y no altera la venta todavía', () => {
    const base = editandoSucio();
    const t = aplicar(base, escanear(ARROZ));
    expect(t.dialogo).toEqual({ tipo: 'sin-guardar' });
    expect(t.pendiente).toEqual(escanear(ARROZ));
    expect(t.venta).toBe(base.venta);
    expect(t.modo).toBe(base.modo);
  });

  it('«Seguir editando» conserva el borrador, no registra nada y olvida la acción pendiente', () => {
    const base = editandoSucio();
    const t = aplicar(base, escanear(ARROZ), {
      tipo: 'resolver-sin-guardar',
      decision: 'seguir',
    });
    expect(t.dialogo).toBeNull();
    expect(t.pendiente).toBeNull();
    expect(t.modo).toEqual({ tipo: 'cantidad', borrador: '7', error: false });
    expect(t.venta).toBe(base.venta);
  });

  it('Escape (cerrar el diálogo) equivale a «Seguir editando»', () => {
    const t = aplicar(editandoSucio(), escanear(ARROZ), {
      tipo: 'cerrar-dialogo',
    });
    expect(t.modo).toMatchObject({ tipo: 'cantidad', borrador: '7' });
    expect(t.dialogo).toBeNull();
    expect(t.pendiente).toBeNull();
  });

  it('«Guardar y continuar» guarda la cantidad, registra el escaneo pendiente y sube el contador de registros', () => {
    const base = editandoSucio();
    const t = aplicar(base, escanear(ARROZ), {
      tipo: 'resolver-sin-guardar',
      decision: 'guardar',
    });
    expect(cantidadDe(t, MANZANAS)).toBe(7);
    expect(codigos(t)[0]).toBe(ARROZ);
    expect(t.venta.seleccionada).toBe(ARROZ);
    expect(t.venta.registros).toBe(base.venta.registros + 1);
    expect(t.modo.tipo).toBe('escaneo');
    expect(t.dialogo).toBeNull();
    expect(t.pendiente).toBeNull();
  });

  it('«Continuar sin guardar» descarta el borrador y registra el escaneo pendiente', () => {
    const base = editandoSucio();
    const t = aplicar(base, escanear(ARROZ), {
      tipo: 'resolver-sin-guardar',
      decision: 'descartar',
    });
    expect(cantidadDe(t, MANZANAS)).toBe(3);
    expect(codigos(t)[0]).toBe(ARROZ);
    expect(t.venta.registros).toBe(base.venta.registros + 1);
    expect(t.modo.tipo).toBe('escaneo');
  });

  it('«Guardar y continuar» con un borrador inválido vuelve al editor con el error y no ejecuta la acción', () => {
    const base = aplicar(
      conProductos(),
      { tipo: 'abrir-editor', codigo: MANZANAS },
      { tipo: 'borrador-cantidad', texto: '1000' },
    );
    const t = aplicar(base, escanear(ARROZ), {
      tipo: 'resolver-sin-guardar',
      decision: 'guardar',
    });
    expect(t.modo).toMatchObject({
      tipo: 'cantidad',
      borrador: '1000',
      error: true,
    });
    expect(t.venta).toBe(base.venta);
    expect(t.dialogo).toBeNull();
    expect(t.pendiente).toBeNull();
  });

  it('seleccionar otro producto: tras guardar, se guarda la cantidad y cambia la selección', () => {
    const t = aplicar(
      editandoSucio(),
      { tipo: 'seleccionar', codigo: CERVEZA },
      { tipo: 'resolver-sin-guardar', decision: 'guardar' },
    );
    expect(cantidadDe(t, MANZANAS)).toBe(7);
    expect(t.venta.seleccionada).toBe(CERVEZA);
    expect(lineaSeleccionada(t)?.codigo).toBe(CERVEZA);
  });

  it('cobrar con cambios pendientes: tras descartar se abre el pago con la cantidad original', () => {
    const t = aplicar(
      editandoSucio(),
      { tipo: 'cobrar' },
      { tipo: 'resolver-sin-guardar', decision: 'descartar' },
    );
    expect(t.dialogo).toEqual({ tipo: 'pago' });
    expect(cantidadDe(t, MANZANAS)).toBe(3);
  });

  it.each<[string, AccionTpv]>([
    ['abrir el código manual', { tipo: 'abrir-codigo-manual' }],
    ['abrir el catálogo', { tipo: 'abrir-catalogo', categoria: 'panaderia' }],
    ['añadir una bolsa', { tipo: 'registrar-bolsa' }],
    ['descartar la venta', { tipo: 'pedir-descartar' }],
    ['una lectura fallida', { tipo: 'lectura-fallida' }],
  ])('%s también pregunta antes', (_nombre, accion) => {
    const t = aplicar(editandoSucio(), accion);
    expect(t.dialogo).toEqual({ tipo: 'sin-guardar' });
    expect(t.pendiente).toEqual(accion);
  });
});

describe('borrar un producto', () => {
  it('− con una sola unidad pide confirmación y no cambia la venta', () => {
    const base = conProductos();
    const t = aplicar(base, { tipo: 'sumar', codigo: CERVEZA, delta: -1 });
    expect(t.dialogo).toEqual({ tipo: 'borrar', codigo: CERVEZA });
    expect(t.venta).toBe(base.venta);
  });

  it('«Quitar de la venta» pide la misma confirmación', () => {
    expect(aplicar(conProductos(), { tipo: 'pedir-quitar', codigo: PAN }).dialogo).toEqual({
      tipo: 'borrar',
      codigo: PAN,
    });
  });

  it('confirmar quita el producto, deja la selección vacía y quita el aviso', () => {
    const t = aplicar(
      conProductos(),
      { tipo: 'pedir-quitar', codigo: MANZANAS },
      { tipo: 'confirmar-borrado' },
    );
    expect(codigos(t)).toEqual([PAN, CERVEZA]);
    expect(t.venta.seleccionada).toBeNull();
    expect(t.dialogo).toBeNull();
  });

  it('cancelar (Escape) lo deja todo igual', () => {
    const base = conProductos();
    const t = aplicar(base, { tipo: 'pedir-quitar', codigo: MANZANAS }, { tipo: 'cerrar-dialogo' });
    expect(t.venta).toBe(base.venta);
    expect(t.dialogo).toBeNull();
  });

  it('− con varias unidades resta sin preguntar', () => {
    const t = aplicar(conProductos(), {
      tipo: 'sumar',
      codigo: MANZANAS,
      delta: -1,
    });
    expect(cantidadDe(t, MANZANAS)).toBe(2);
    expect(t.dialogo).toBeNull();
  });
});

describe('descartar venta', () => {
  it('con la venta vacía no abre nada', () => {
    expect(aplicar(TPV_INICIAL, { tipo: 'pedir-descartar' })).toBe(TPV_INICIAL);
  });

  it('pide confirmación y, al confirmar, deja todo como al principio', () => {
    const pedido = aplicar(conProductos(), { tipo: 'pedir-descartar' });
    expect(pedido.dialogo).toEqual({ tipo: 'descartar' });
    expect(aplicar(pedido, { tipo: 'confirmar-descarte' })).toEqual(TPV_INICIAL);
  });

  it('«Seguir con la venta» no cambia nada', () => {
    const base = conProductos();
    const t = aplicar(base, { tipo: 'pedir-descartar' }, { tipo: 'cerrar-dialogo' });
    expect(t.venta).toBe(base.venta);
  });
});

describe('cobro y cierre', () => {
  it('con la venta vacía no se puede cobrar', () => {
    expect(aplicar(TPV_INICIAL, { tipo: 'cobrar' })).toBe(TPV_INICIAL);
  });

  it('cobrar abre el pago; Escape lo cancela', () => {
    const pago = aplicar(conProductos(), { tipo: 'cobrar' });
    expect(pago.dialogo).toEqual({ tipo: 'pago' });
    expect(aplicar(pago, { tipo: 'cerrar-dialogo' }).dialogo).toBeNull();
  });

  it('elegir el método completa la venta con su total y sus unidades', () => {
    const base = conProductos();
    const t = aplicar(base, { tipo: 'cobrar' }, { tipo: 'elegir-pago', metodo: 'tarjeta' });
    expect(t.dialogo).toEqual({
      tipo: 'completada',
      metodo: 'tarjeta',
      total: totalVenta(base.venta),
      unidades: 5,
    });
    expect(totalVenta(base.venta)).toBe(210 + 180 + 3 * 220);
  });

  const completada = () =>
    aplicar(conProductos(), { tipo: 'cobrar' }, { tipo: 'elegir-pago', metodo: 'efectivo' });

  it('la venta completada no se puede cancelar', () => {
    const base = completada();
    expect(aplicar(base, { tipo: 'cerrar-dialogo' })).toBe(base);
  });

  it('al terminar la cuenta atrás empieza una venta nueva vacía', () => {
    expect(aplicar(completada(), { tipo: 'nueva-venta' })).toEqual(TPV_INICIAL);
  });

  it('un escaneo antes de terminar la cuenta empieza la venta nueva con ese producto', () => {
    const t = aplicar(completada(), escanear(ARROZ));
    expect(t.dialogo).toBeNull();
    expect(codigos(t)).toEqual([ARROZ]);
    expect(cantidadDe(t, ARROZ)).toBe(1);
  });

  it('un código desconocido durante la venta completada se ignora: sigue el resultado', () => {
    const base = completada();
    expect(aplicar(base, escanear('000'))).toBe(base);
    expect(aplicar(base, { tipo: 'lectura-fallida' })).toBe(base);
  });
});

describe('diálogos abiertos', () => {
  it('con un diálogo abierto se ignoran escaneos, selecciones y demás acciones de pantalla', () => {
    const base = aplicar(conProductos(), { tipo: 'pedir-descartar' });
    for (const accion of [
      escanear(ARROZ),
      { tipo: 'seleccionar', codigo: CERVEZA },
      { tipo: 'cobrar' },
      { tipo: 'registrar-bolsa' },
    ] as AccionTpv[]) {
      expect(aplicar(base, accion)).toBe(base);
    }
  });

  it('las acciones de un diálogo no hacen nada si ese diálogo no está abierto', () => {
    const base = conProductos();
    for (const accion of [
      { tipo: 'confirmar-borrado' },
      { tipo: 'confirmar-descarte' },
      { tipo: 'elegir-pago', metodo: 'efectivo' },
      { tipo: 'resolver-sin-guardar', decision: 'guardar' },
      { tipo: 'nueva-venta' },
    ] as AccionTpv[]) {
      expect(aplicar(base, accion)).toBe(base);
    }
  });

  it('abrir el catálogo abre su diálogo con la categoría; Escape lo cierra', () => {
    const t = aplicar(conProductos(), {
      tipo: 'abrir-catalogo',
      categoria: 'fruta',
    });
    expect(t.dialogo).toMatchObject({ tipo: 'catalogo', categoria: 'fruta' });
    expect(aplicar(t, { tipo: 'cerrar-dialogo' }).dialogo).toBeNull();
  });
});

describe('cantidades rápidas', () => {
  it('fijan la cantidad del producto seleccionado', () => {
    expect(
      cantidadDe(aplicar(conProductos(), { tipo: 'fijar-cantidad', cantidad: 6 }), MANZANAS),
    ).toBe(6);
  });

  it('sin producto seleccionado, o con una cantidad inválida, no hacen nada', () => {
    const base = conProductos();
    expect(aplicar(base, { tipo: 'fijar-cantidad', cantidad: 0 }).venta).toBe(base.venta);
    expect(aplicar(TPV_INICIAL, { tipo: 'fijar-cantidad', cantidad: 3 })).toBe(TPV_INICIAL);
  });
});

/* -------------------------------------------------------------------------- */
/* Catálogo rápido                                                            */
/* -------------------------------------------------------------------------- */

import { productosDe } from './catalogo';
import { resumenBorrador } from './tpv';

const croissant = productosDe('panaderia').find((p) => p.nombre === 'Croissant mantequilla')!;
const baguette = productosDe('panaderia').find((p) => p.nombre === 'Baguette tradicional')!;
const platano = productosDe('fruta').find((p) => p.nombre === 'Plátano de Canarias')!;
const lechuga = productosDe('verdura').find((p) => p.nombre === 'Lechuga romana')!;

const abrirCatalogo = (t: Tpv, categoria: 'panaderia' | 'fruta' | 'verdura' = 'panaderia') =>
  tpvReducer(t, { tipo: 'abrir-catalogo', categoria });
const sumarCat = (producto: typeof croissant, delta: 1 | -1 = 1): AccionTpv => ({
  tipo: 'catalogo-sumar',
  producto,
  delta,
});
const borradorDe = (t: Tpv) => (t.dialogo?.tipo === 'catalogo' ? t.dialogo.borrador : []);
const cantidadBorrador = (t: Tpv, codigo: string) =>
  borradorDe(t).find((l) => l.codigo === codigo)?.cantidad ?? 0;

describe('catálogo rápido · borrador', () => {
  it('abre con la categoría y precargado con lo que ya hay en la venta', () => {
    const t = abrirCatalogo(conProductos(), 'fruta');
    expect(t.dialogo).toMatchObject({ tipo: 'catalogo', categoria: 'fruta' });
    expect(borradorDe(t).map((l) => [l.codigo, l.cantidad])).toEqual(
      t.venta.lineas.map((l) => [l.codigo, l.cantidad]),
    );
  });

  it('sumar a un producto nuevo lo añade al borrador con 1; la venta no cambia hasta guardar', () => {
    const base = conProductos();
    const t = aplicar(abrirCatalogo(base), sumarCat(croissant), sumarCat(croissant));
    expect(cantidadBorrador(t, croissant.codigo)).toBe(2);
    expect(t.venta).toBe(base.venta);
  });

  it('restar baja hasta 0 y no pasa de ahí; sumar no pasa de 999', () => {
    let t = aplicar(
      abrirCatalogo(TPV_INICIAL),
      sumarCat(croissant),
      sumarCat(croissant, -1),
      sumarCat(croissant, -1),
      sumarCat(croissant, -1),
    );
    expect(cantidadBorrador(t, croissant.codigo)).toBe(0);
    t = abrirCatalogo(
      aplicar(TPV_INICIAL, escanear(croissant.codigo), {
        tipo: 'fijar-cantidad',
        cantidad: MAX_CANTIDAD,
      }),
    );
    expect(tpvReducer(t, sumarCat(croissant))).toBe(t);
  });

  it('cambiar de pestaña conserva el borrador', () => {
    const t = aplicar(
      abrirCatalogo(TPV_INICIAL),
      sumarCat(croissant),
      { tipo: 'catalogo-categoria', categoria: 'verdura' },
      sumarCat(lechuga),
    );
    expect(t.dialogo).toMatchObject({ tipo: 'catalogo', categoria: 'verdura' });
    expect(cantidadBorrador(t, croissant.codigo)).toBe(1);
    expect(cantidadBorrador(t, lechuga.codigo)).toBe(1);
  });

  it('el resumen cuenta solo los productos con unidades', () => {
    const t = aplicar(
      abrirCatalogo(TPV_INICIAL),
      sumarCat(croissant),
      sumarCat(croissant),
      sumarCat(baguette),
      sumarCat(baguette, -1),
    );
    expect(resumenBorrador(borradorDe(t))).toEqual({
      productos: 1,
      unidades: 2,
      total: 2 * croissant.precio,
    });
  });

  it('las acciones del catálogo se ignoran si no está abierto, o si hay otro diálogo', () => {
    const base = conProductos();
    expect(aplicar(base, sumarCat(croissant))).toBe(base);
    expect(aplicar(base, { tipo: 'catalogo-guardar' })).toBe(base);
    const conPago = aplicar(base, { tipo: 'cobrar' });
    expect(aplicar(conPago, sumarCat(croissant))).toBe(conPago);
  });

  it('«Cancelar» o Escape descartan el borrador', () => {
    const base = conProductos();
    const t = aplicar(abrirCatalogo(base), sumarCat(croissant), {
      tipo: 'cerrar-dialogo',
    });
    expect(t.dialogo).toBeNull();
    expect(t.venta).toBe(base.venta);
  });
});

describe('catálogo rápido · guardar', () => {
  it('un producto nuevo entra primero, queda seleccionado y como último añadido, y sube el contador de registros', () => {
    const base = conProductos();
    const t = aplicar(abrirCatalogo(base), sumarCat(croissant), sumarCat(croissant), {
      tipo: 'catalogo-guardar',
    });
    expect(codigos(t)[0]).toBe(croissant.codigo);
    expect(cantidadDe(t, croissant.codigo)).toBe(2);
    expect(t.venta.seleccionada).toBe(croissant.codigo);
    expect(t.venta.ultimoRegistrado).toBe(croissant.codigo);
    expect(t.venta.registros).toBe(base.venta.registros + 1);
    expect(t.dialogo).toBeNull();
    expect(t.modo.tipo).toBe('escaneo');
  });

  it('con varios nuevos, el último que se tocó queda primero', () => {
    const t = aplicar(
      abrirCatalogo(TPV_INICIAL),
      sumarCat(croissant),
      sumarCat(platano),
      sumarCat(baguette),
      { tipo: 'catalogo-guardar' },
    );
    expect(codigos(t)).toEqual([baguette.codigo, platano.codigo, croissant.codigo]);
    expect(t.venta.seleccionada).toBe(baguette.codigo);
  });

  it('una línea existente con otra cantidad la cambia sin reordenar; queda seleccionada', () => {
    const base = conProductos(); // manzanas, pan, cerveza
    const manzanas = productosDe('fruta').find((p) => p.codigo === MANZANAS)!;
    const t = aplicar(abrirCatalogo(base, 'fruta'), sumarCat(manzanas), sumarCat(manzanas), {
      tipo: 'catalogo-guardar',
    });
    expect(cantidadDe(t, MANZANAS)).toBe(5);
    expect(codigos(t)).toEqual(codigos(base));
    expect(t.venta.seleccionada).toBe(MANZANAS);
    expect(t.venta.registros).toBe(base.venta.registros + 1);
  });

  it('si no cambia nada, el contador de registros no sube', () => {
    const base = conProductos();
    const t = aplicar(abrirCatalogo(base), { tipo: 'catalogo-guardar' });
    expect(t.venta.registros).toBe(base.venta.registros);
  });

  it('Croissant, Baguette y otra vez Croissant: el último tocado (Croissant) queda primero y seleccionado', () => {
    const t = aplicar(
      abrirCatalogo(TPV_INICIAL),
      sumarCat(croissant),
      sumarCat(baguette),
      sumarCat(croissant),
      { tipo: 'catalogo-guardar' },
    );
    expect(codigos(t)).toEqual([croissant.codigo, baguette.codigo]);
    expect(t.venta.seleccionada).toBe(croissant.codigo);
  });

  it('un producto que baja a 0 se quita de la venta', () => {
    const base = conProductos();
    const pan = productosDe('panaderia').find((p) => p.codigo === PAN)!;
    const t = aplicar(abrirCatalogo(base), sumarCat(pan, -1), {
      tipo: 'catalogo-guardar',
    });
    expect(codigos(t)).not.toContain(PAN);
    expect(codigos(t)).toHaveLength(2);
  });

  it('si no cambia nada, la selección se conserva', () => {
    const base = conProductos();
    const t = aplicar(abrirCatalogo(base), { tipo: 'catalogo-guardar' });
    expect(t.venta.lineas).toEqual(base.venta.lineas);
    expect(t.venta.seleccionada).toBe(base.venta.seleccionada);
  });

  it('si se quita la línea seleccionada y no cambia otra, se selecciona la primera', () => {
    const base = conProductos(); // seleccionada: manzanas
    const manzanas = productosDe('fruta').find((p) => p.codigo === MANZANAS)!;
    const t = aplicar(
      abrirCatalogo(base, 'fruta'),
      sumarCat(manzanas, -1),
      sumarCat(manzanas, -1),
      sumarCat(manzanas, -1),
      { tipo: 'catalogo-guardar' },
    );
    expect(codigos(t)).not.toContain(MANZANAS);
    expect(t.venta.seleccionada).toBe(codigos(t)[0]);
  });

  it('con productos de varias pestañas, todo se aplica a la vez', () => {
    const t = aplicar(
      abrirCatalogo(TPV_INICIAL),
      sumarCat(croissant),
      { tipo: 'catalogo-categoria', categoria: 'verdura' },
      sumarCat(lechuga),
      sumarCat(lechuga),
      { tipo: 'catalogo-guardar' },
    );
    expect(cantidadDe(t, croissant.codigo)).toBe(1);
    expect(cantidadDe(t, lechuga.codigo)).toBe(2);
  });

  it('al guardar se limpia el aviso del escáner', () => {
    const conAviso = tpvReducer(TPV_INICIAL, { tipo: 'lectura-fallida' });
    const t = aplicar(
      { ...conAviso, modo: { tipo: 'escaneo' } },
      { tipo: 'abrir-catalogo', categoria: 'panaderia' },
      sumarCat(croissant),
      { tipo: 'catalogo-guardar' },
    );
    expect(t.aviso).toBeNull();
  });
});
