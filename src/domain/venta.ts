import { MAX_CANTIDAD } from './cantidad';
import type { Producto } from './catalogo';
import type { Centimos } from './dinero';

export interface Linea {
  codigo: string;
  nombre: string;
  precio: Centimos;
  cantidad: number;
}

export interface Venta {
  /** La primera línea es la última registrada. */
  lineas: readonly Linea[];
  /** Código de la línea seleccionada para editar; null si no hay ninguna. */
  seleccionada: string | null;
  /** Código del último producto registrado (etiqueta «Último añadido»). */
  ultimoRegistrado: string | null;
  /** Sube con cada registro. La interfaz lo usa para volver al inicio de la lista aunque la longitud no cambie. */
  registros: number;
}

export const VENTA_VACIA: Venta = {
  lineas: [],
  seleccionada: null,
  ultimoRegistrado: null,
  registros: 0,
};

export type AccionVenta =
  | { tipo: 'registrar'; producto: Producto }
  | { tipo: 'sumar'; codigo: string; delta: 1 | -1 }
  | { tipo: 'fijar-cantidad'; codigo: string; cantidad: number }
  | { tipo: 'quitar'; codigo: string }
  | { tipo: 'seleccionar'; codigo: string }
  | { tipo: 'aplicar-cantidades'; lineas: readonly Linea[] }
  | { tipo: 'vaciar' };

const buscar = (venta: Venta, codigo: string) => venta.lineas.find((l) => l.codigo === codigo);

const cambiarLinea = (venta: Venta, codigo: string, cantidad: number): Venta => ({
  ...venta,
  lineas: venta.lineas.map((l) => (l.codigo === codigo ? { ...l, cantidad } : l)),
});

/** ¿Se puede registrar una unidad más de este producto? (false si ya tiene el máximo). */
export function puedeRegistrar(venta: Venta, codigo: string): boolean {
  const linea = buscar(venta, codigo);
  return !linea || linea.cantidad < MAX_CANTIDAD;
}

export function ventaReducer(venta: Venta, accion: AccionVenta): Venta {
  switch (accion.tipo) {
    case 'registrar': {
      const { producto } = accion;
      if (!puedeRegistrar(venta, producto.codigo)) return venta;
      const existente = buscar(venta, producto.codigo);
      const linea: Linea = existente
        ? { ...existente, cantidad: existente.cantidad + 1 }
        : {
            codigo: producto.codigo,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
          };
      return {
        lineas: [linea, ...venta.lineas.filter((l) => l.codigo !== producto.codigo)],
        seleccionada: producto.codigo,
        ultimoRegistrado: producto.codigo,
        registros: venta.registros + 1,
      };
    }
    case 'sumar': {
      const linea = buscar(venta, accion.codigo);
      if (!linea) return venta;
      const nueva = linea.cantidad + accion.delta;
      // Bajar de 1 es borrar (lo decide la interfaz con confirmación); pasar de 999 no se permite.
      if (nueva < 1 || nueva > MAX_CANTIDAD) return venta;
      return cambiarLinea(venta, accion.codigo, nueva);
    }
    case 'fijar-cantidad': {
      const { codigo, cantidad } = accion;
      if (!buscar(venta, codigo)) return venta;
      if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD) return venta;
      return cambiarLinea(venta, codigo, cantidad);
    }
    case 'quitar': {
      if (!buscar(venta, accion.codigo)) return venta;
      return {
        ...venta,
        lineas: venta.lineas.filter((l) => l.codigo !== accion.codigo),
        seleccionada: venta.seleccionada === accion.codigo ? null : venta.seleccionada,
        ultimoRegistrado: venta.ultimoRegistrado === accion.codigo ? null : venta.ultimoRegistrado,
      };
    }
    case 'seleccionar':
      return buscar(venta, accion.codigo) ? { ...venta, seleccionada: accion.codigo } : venta;
    case 'aplicar-cantidades':
      return aplicarCantidades(venta, accion.lineas);
    case 'vaciar':
      return VENTA_VACIA;
  }
}

export const importeLinea = (l: Linea): Centimos => l.precio * l.cantidad;
export const totalVenta = (v: Venta): Centimos => v.lineas.reduce((s, l) => s + importeLinea(l), 0);
export const unidadesVenta = (v: Venta): number => v.lineas.reduce((s, l) => s + l.cantidad, 0);

/**
 * Aplica las cantidades elegidas en el catálogo rápido (cada línea trae su cantidad deseada, 0 = quitar).
 * - Una línea existente con otra cantidad la cambia sin reordenar; con 0 se quita.
 * - Un producto nuevo entra primero (el último procesado, el primero de la lista).
 * - Cualquier cambio (nuevo, cantidad o quitado) sube `registros`, para que la lista vuelva arriba.
 * - Queda seleccionado el último producto que cambió; si no cambió ninguno y la selección ya no existe, el primero.
 */
function aplicarCantidades(venta: Venta, deseadas: readonly Linea[]): Venta {
  let lineas = [...venta.lineas];
  let seleccionada = venta.seleccionada;
  let ultimoRegistrado = venta.ultimoRegistrado;
  let ultimaCambiada: string | null = null;
  let hayCambios = false;

  for (const deseada of deseadas) {
    const cantidad = Math.min(Math.max(Math.trunc(deseada.cantidad), 0), MAX_CANTIDAD);
    const indice = lineas.findIndex((l) => l.codigo === deseada.codigo);
    if (indice >= 0) {
      if (cantidad === 0) {
        lineas.splice(indice, 1);
        hayCambios = true;
        if (ultimoRegistrado === deseada.codigo) ultimoRegistrado = null;
      } else if (lineas[indice].cantidad !== cantidad) {
        lineas[indice] = { ...lineas[indice], cantidad };
        ultimaCambiada = deseada.codigo;
        hayCambios = true;
      }
    } else if (cantidad > 0) {
      lineas = [
        {
          codigo: deseada.codigo,
          nombre: deseada.nombre,
          precio: deseada.precio,
          cantidad,
        },
        ...lineas,
      ];
      ultimaCambiada = deseada.codigo;
      ultimoRegistrado = deseada.codigo;
      hayCambios = true;
    }
  }

  if (ultimaCambiada) seleccionada = ultimaCambiada;
  else if (!lineas.some((l) => l.codigo === seleccionada)) seleccionada = lineas[0]?.codigo ?? null;

  return {
    lineas,
    seleccionada,
    ultimoRegistrado,
    registros: venta.registros + (hayCambios ? 1 : 0),
  };
}
