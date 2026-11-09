import { CATALOGO, consultarProducto } from '@/domain/catalogo';
import { TPV_INICIAL, tpvReducer, type Tpv } from '@/domain/tpv';

const escanear = (t: Tpv, codigo: string): Tpv => {
  const resultado = consultarProducto(codigo);
  return tpvReducer(t, { tipo: 'producto-leido', resultado });
};

/** Venta de ejemplo del wireframe: cerveza (1), pan (1), manzanas (3), arroz (1); la cerveza es lo último registrado. */
function productos(): Tpv {
  let t = TPV_INICIAL;
  for (const codigo of [
    '841000100004',
    '841000100003',
    '841000100003',
    '841000100003',
    '841000100002',
    '841000100001',
  ]) {
    t = escanear(t, codigo);
  }
  return t;
}

const conPrimeraLinea = (t: Tpv, cambios: Partial<Tpv['venta']['lineas'][number]>): Tpv => ({
  ...t,
  venta: {
    ...t.venta,
    lineas: t.venta.lineas.map((l, i) => (i === 0 ? { ...l, ...cambios } : l)),
  },
});

/**
 * Estados de comprobación por enlace (`?estado=…`), los estados de diseño aprobados.
 * Sin parámetro, la aplicación arranca con una venta nueva vacía.
 */
export function tpvDesdeEstado(estado: string | null): Tpv {
  switch (estado) {
    case 'productos':
      return productos();
    case 'seleccion': {
      const t = productos();
      return {
        ...t,
        venta: { ...t.venta, seleccionada: t.venta.lineas[1].codigo },
      };
    }
    case 'maximo':
      return conPrimeraLinea(productos(), { cantidad: 999 });
    case 'nombre-largo':
      return conPrimeraLinea(productos(), {
        nombre:
          'Galletas integrales de avena con chocolate negro y frutos secos · paquete familiar de ejemplo con nombre muy largo',
      });
    case 'importe-amplio':
      return conPrimeraLinea(productos(), { precio: 99999, cantidad: 999 });
    case 'editar':
    case 'otra-cantidad':
      return tpvReducer(productos(), {
        tipo: 'abrir-editor',
        codigo: productos().venta.seleccionada!,
      });
    case 'cantidad-error': {
      let t = tpvReducer(productos(), {
        tipo: 'abrir-editor',
        codigo: productos().venta.seleccionada!,
      });
      t = tpvReducer(t, { tipo: 'borrador-cantidad', texto: '1000' });
      return tpvReducer(t, { tipo: 'guardar-cantidad' });
    }
    case 'cantidad-pendiente':
    case 'cierre-pendiente': {
      let t = tpvReducer(productos(), {
        tipo: 'abrir-editor',
        codigo: productos().venta.seleccionada!,
      });
      t = tpvReducer(t, { tipo: 'borrador-cantidad', texto: '255' });
      return tpvReducer(t, { tipo: 'cobrar' });
    }
    case 'atajos':
      return productos();
    case 'catalogo':
      return tpvReducer(productos(), {
        tipo: 'abrir-catalogo',
        categoria: 'panaderia',
      });
    case 'descarte':
      return tpvReducer(productos(), { tipo: 'pedir-descartar' });
    case 'pago':
      return tpvReducer(productos(), { tipo: 'cobrar' });
    case 'completada':
      return tpvReducer(tpvReducer(productos(), { tipo: 'cobrar' }), {
        tipo: 'elegir-pago',
        metodo: 'efectivo',
      });
    case 'borrar': {
      const t = productos();
      return tpvReducer(t, {
        tipo: 'pedir-quitar',
        codigo: t.venta.seleccionada!,
      });
    }
    case 'escaneo-correcto':
      return productos();
    case 'lectura-error':
      return tpvReducer(productos(), { tipo: 'lectura-fallida' });
    case 'codigo-error':
      return tpvReducer(productos(), {
        tipo: 'producto-leido',
        resultado: { estado: 'no-encontrado' },
      });
    case 'codigo-manual':
      return tpvReducer(productos(), { tipo: 'abrir-codigo-manual' });
    case 'codigo-manual-error': {
      let t = tpvReducer(productos(), { tipo: 'abrir-codigo-manual' });
      t = tpvReducer(t, { tipo: 'borrador-codigo', texto: '12A45' });
      return tpvReducer(t, {
        tipo: 'enviar-codigo-manual',
        resultado: consultarProducto('12A45'),
      });
    }
    case 'lista-larga': {
      let t = productos();
      for (let i = 0; i < 16; i++) t = escanear(t, CATALOGO[(4 + i) % CATALOGO.length].codigo);
      return t;
    }
    default:
      return TPV_INICIAL;
  }
}
