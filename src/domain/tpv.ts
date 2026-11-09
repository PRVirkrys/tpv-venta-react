import { leerCantidad, MAX_CANTIDAD } from './cantidad';
import { BOLSA, type CategoriaCatalogo, type Producto, type ResultadoConsulta } from './catalogo';
import type { Centimos } from './dinero';
import {
  importeLinea,
  puedeRegistrar,
  totalVenta,
  unidadesVenta,
  VENTA_VACIA,
  ventaReducer,
  type Linea,
  type Venta,
} from './venta';

/* ---------------------------------------------------------------------------
   Estado de la pantalla (segunda capa, sobre la venta).
   Un solo reducer puro: la interfaz solo envía intenciones y dibuja el resultado.
   --------------------------------------------------------------------------- */

/** Qué ocupa el segundo bloque del panel derecho. */
export type Modo =
  | { tipo: 'escaneo' }
  /** Editor numérico de la cantidad de la línea seleccionada. */
  | { tipo: 'cantidad'; borrador: string; error: boolean }
  /** Entrada de código manual. */
  | { tipo: 'codigo-manual'; borrador: string; error: ErrorCodigo | null };

export type ErrorCodigo = 'codigo-invalido' | 'no-encontrado';

/** Mensaje de la tarjeta del escáner (la interfaz decide el texto). */
export type AvisoEscaner =
  'codigo-manual' | 'codigo-no-leido' | 'producto-no-encontrado' | 'limite-unidades';

export type MetodoPago = 'efectivo' | 'tarjeta';

export type { CategoriaCatalogo };

export type Dialogo =
  | { tipo: 'sin-guardar' }
  | { tipo: 'borrar'; codigo: string }
  | { tipo: 'descartar' }
  | { tipo: 'pago' }
  | {
      tipo: 'completada';
      metodo: MetodoPago;
      total: Centimos;
      unidades: number;
    }
  /**
   * `borrador`: la venta actual más lo que se va eligiendo. Solo se aplica al guardar.
   * `tocados`: códigos en orden de último toque, para saber cuál fue el último producto tocado.
   */
  | {
      tipo: 'catalogo';
      categoria: CategoriaCatalogo;
      borrador: readonly Linea[];
      tocados: readonly string[];
    };

/**
 * Acciones que cambian de contexto. Si el editor tiene una cantidad sin guardar, no se ejecutan:
 * se guarda la acción como `pendiente` y se pregunta. Después se ejecuta o se descarta.
 */
export type AccionBloqueable =
  | { tipo: 'producto-leido'; resultado: ResultadoConsulta }
  | { tipo: 'lectura-fallida' }
  | { tipo: 'seleccionar'; codigo: string }
  | { tipo: 'abrir-editor'; codigo: string }
  | { tipo: 'abrir-codigo-manual' }
  | { tipo: 'abrir-catalogo'; categoria: CategoriaCatalogo }
  | { tipo: 'registrar-bolsa' }
  | { tipo: 'pedir-descartar' }
  | { tipo: 'cobrar' };

export type AccionTpv =
  | AccionBloqueable
  // editor de cantidad
  | { tipo: 'borrador-cantidad'; texto: string }
  | { tipo: 'guardar-cantidad' }
  | { tipo: 'cancelar-editor' }
  | { tipo: 'sumar'; codigo: string; delta: 1 | -1 }
  | { tipo: 'fijar-cantidad'; cantidad: number }
  | { tipo: 'pedir-quitar'; codigo: string }
  // código manual
  | { tipo: 'borrador-codigo'; texto: string }
  | { tipo: 'enviar-codigo-manual'; resultado: ResultadoConsulta }
  | { tipo: 'cerrar-codigo-manual' }
  // diálogos
  | {
      tipo: 'resolver-sin-guardar';
      decision: 'seguir' | 'descartar' | 'guardar';
    }
  | { tipo: 'confirmar-borrado' }
  | { tipo: 'confirmar-descarte' }
  | { tipo: 'elegir-pago'; metodo: MetodoPago }
  | { tipo: 'cerrar-dialogo' }
  | { tipo: 'nueva-venta' }
  // catálogo rápido
  | { tipo: 'catalogo-categoria'; categoria: CategoriaCatalogo }
  | { tipo: 'catalogo-sumar'; producto: Producto; delta: 1 | -1 }
  | { tipo: 'catalogo-guardar' };

export interface Tpv {
  venta: Venta;
  modo: Modo;
  dialogo: Dialogo | null;
  /** Acción bloqueada a la espera de la decisión sobre la cantidad sin guardar. */
  pendiente: AccionBloqueable | null;
  aviso: AvisoEscaner | null;
}

const ESCANEO: Modo = { tipo: 'escaneo' };

export const TPV_INICIAL: Tpv = {
  venta: VENTA_VACIA,
  modo: ESCANEO,
  dialogo: null,
  pendiente: null,
  aviso: null,
};

const BLOQUEABLES = new Set<AccionTpv['tipo']>([
  'producto-leido',
  'lectura-fallida',
  'seleccionar',
  'abrir-editor',
  'abrir-codigo-manual',
  'abrir-catalogo',
  'registrar-bolsa',
  'pedir-descartar',
  'cobrar',
]);
const esBloqueable = (a: AccionTpv): a is AccionBloqueable => BLOQUEABLES.has(a.tipo);

/** Acciones que solo tienen sentido con un diálogo concreto abierto. */
const DE_DIALOGO = new Set<AccionTpv['tipo']>([
  'resolver-sin-guardar',
  'confirmar-borrado',
  'confirmar-descarte',
  'elegir-pago',
  'cerrar-dialogo',
  'nueva-venta',
  'catalogo-categoria',
  'catalogo-sumar',
  'catalogo-guardar',
]);

/* ------------------------------ utilidades ------------------------------ */

export const lineaSeleccionada = (t: Tpv) =>
  t.venta.lineas.find((l) => l.codigo === t.venta.seleccionada) ?? null;

/** Editor abierto con un borrador distinto de la cantidad guardada. */
export function hayCantidadSinGuardar(t: Tpv): boolean {
  if (t.modo.tipo !== 'cantidad') return false;
  const linea = lineaSeleccionada(t);
  return !!linea && t.modo.borrador.trim() !== String(linea.cantidad);
}

/* ------------------------------- reducer -------------------------------- */

/**
 * tpvReducer — Única función que cambia el estado de la pantalla; es pura. Las reglas viven aquí y los
 * componentes solo despachan acciones.
 */
export function tpvReducer(t: Tpv, accion: AccionTpv): Tpv {
  // Con un diálogo abierto solo cuentan sus propias acciones. Excepción: con la venta completada,
  // un escaneo válido antes de tiempo empieza la venta nueva y registra ese producto.
  if (t.dialogo) {
    if (
      t.dialogo.tipo === 'completada' &&
      accion.tipo === 'producto-leido' &&
      accion.resultado.estado === 'encontrado'
    ) {
      return aplicar({ ...TPV_INICIAL }, accion);
    }
    if (!DE_DIALOGO.has(accion.tipo)) return t;
  } else if (DE_DIALOGO.has(accion.tipo)) {
    return t;
  }

  if (esBloqueable(accion)) return guardia(t, accion);
  return aplicar(t, accion);
}

/** Antes de cambiar de contexto: cierra el editor si no hay cambios, o pregunta si los hay. */
function guardia(t: Tpv, accion: AccionBloqueable): Tpv {
  if (t.modo.tipo !== 'cantidad') return aplicar(t, accion);

  // Tocar de nuevo el producto que ya se está editando no cambia nada.
  if (
    (accion.tipo === 'seleccionar' || accion.tipo === 'abrir-editor') &&
    accion.codigo === t.venta.seleccionada
  )
    return t;

  if (!hayCantidadSinGuardar(t)) return aplicar({ ...t, modo: ESCANEO }, accion);
  return { ...t, dialogo: { tipo: 'sin-guardar' }, pendiente: accion };
}

function registrarProducto(t: Tpv, producto: Producto): Tpv {
  if (!puedeRegistrar(t.venta, producto.codigo))
    return { ...t, modo: ESCANEO, aviso: 'limite-unidades' };
  return {
    ...t,
    venta: ventaReducer(t.venta, { tipo: 'registrar', producto }),
    modo: ESCANEO,
    aviso: null,
  };
}

function entradaManual(t: Tpv, aviso: AvisoEscaner): Tpv {
  return {
    ...t,
    modo: { tipo: 'codigo-manual', borrador: '', error: null },
    aviso,
  };
}

function aplicar(t: Tpv, accion: AccionTpv): Tpv {
  switch (accion.tipo) {
    /* ---- acciones bloqueables ---- */
    case 'producto-leido': {
      const { resultado } = accion;
      if (resultado.estado === 'encontrado') return registrarProducto(t, resultado.producto);
      return entradaManual(
        t,
        resultado.estado === 'no-encontrado' ? 'producto-no-encontrado' : 'codigo-no-leido',
      );
    }
    case 'lectura-fallida':
      return entradaManual(t, 'codigo-no-leido');
    case 'seleccionar':
      return {
        ...t,
        venta: ventaReducer(t.venta, {
          tipo: 'seleccionar',
          codigo: accion.codigo,
        }),
        modo: ESCANEO,
      };
    case 'abrir-editor': {
      const venta = ventaReducer(t.venta, {
        tipo: 'seleccionar',
        codigo: accion.codigo,
      });
      const linea = venta.lineas.find((l) => l.codigo === accion.codigo);
      if (!linea) return t;
      return {
        ...t,
        venta,
        modo: {
          tipo: 'cantidad',
          borrador: String(linea.cantidad),
          error: false,
        },
      };
    }
    case 'abrir-codigo-manual':
      // Con la entrada ya abierta no se vacía lo que se esté escribiendo.
      return t.modo.tipo === 'codigo-manual' ? t : entradaManual(t, t.aviso ?? 'codigo-manual');
    case 'abrir-catalogo':
      return {
        ...t,
        dialogo: {
          tipo: 'catalogo',
          categoria: accion.categoria,
          borrador: t.venta.lineas,
          tocados: [],
        },
      };
    case 'registrar-bolsa':
      return registrarProducto(t, BOLSA);
    case 'pedir-descartar':
      return t.venta.lineas.length ? { ...t, dialogo: { tipo: 'descartar' } } : t;
    case 'cobrar':
      return t.venta.lineas.length ? { ...t, dialogo: { tipo: 'pago' } } : t;

    /* ---- editor de cantidad ---- */
    case 'borrador-cantidad':
      return t.modo.tipo === 'cantidad'
        ? {
            ...t,
            modo: { tipo: 'cantidad', borrador: accion.texto, error: false },
          }
        : t;
    case 'guardar-cantidad': {
      if (t.modo.tipo !== 'cantidad' || !t.venta.seleccionada) return t;
      const n = leerCantidad(t.modo.borrador);
      if (n === null) return { ...t, modo: { ...t.modo, error: true } };
      return {
        ...t,
        venta: ventaReducer(t.venta, {
          tipo: 'fijar-cantidad',
          codigo: t.venta.seleccionada,
          cantidad: n,
        }),
        modo: ESCANEO,
        aviso: null,
      };
    }
    case 'cancelar-editor':
      return t.modo.tipo === 'cantidad' ? { ...t, modo: ESCANEO } : t;
    case 'sumar': {
      const linea = t.venta.lineas.find((l) => l.codigo === accion.codigo);
      if (!linea) return t;
      // Bajar de 1 unidad es borrar: se confirma antes.
      if (accion.delta < 0 && linea.cantidad === 1)
        return { ...t, dialogo: { tipo: 'borrar', codigo: linea.codigo } };
      const venta = ventaReducer(t.venta, accion);
      // Si ese mismo producto está en el editor, el borrador sigue a la cantidad.
      const modo: Modo =
        t.modo.tipo === 'cantidad' && t.venta.seleccionada === accion.codigo
          ? {
              tipo: 'cantidad',
              borrador: String(venta.lineas.find((l) => l.codigo === accion.codigo)!.cantidad),
              error: false,
            }
          : t.modo;
      return { ...t, venta, modo };
    }
    case 'fijar-cantidad':
      return t.venta.seleccionada
        ? {
            ...t,
            venta: ventaReducer(t.venta, {
              tipo: 'fijar-cantidad',
              codigo: t.venta.seleccionada,
              cantidad: accion.cantidad,
            }),
          }
        : t;
    case 'pedir-quitar':
      return t.venta.lineas.some((l) => l.codigo === accion.codigo)
        ? { ...t, dialogo: { tipo: 'borrar', codigo: accion.codigo } }
        : t;

    /* ---- código manual ---- */
    case 'borrador-codigo':
      return t.modo.tipo === 'codigo-manual'
        ? {
            ...t,
            modo: {
              tipo: 'codigo-manual',
              borrador: accion.texto,
              error: null,
            },
          }
        : t;
    case 'enviar-codigo-manual': {
      if (t.modo.tipo !== 'codigo-manual') return t;
      const { resultado } = accion;
      if (resultado.estado === 'encontrado') return registrarProducto(t, resultado.producto);
      if (resultado.estado === 'codigo-invalido')
        return { ...t, modo: { ...t.modo, error: 'codigo-invalido' } };
      return {
        ...t,
        modo: { ...t.modo, error: 'no-encontrado' },
        aviso: 'producto-no-encontrado',
      };
    }
    case 'cerrar-codigo-manual':
      return t.modo.tipo === 'codigo-manual' ? { ...t, modo: ESCANEO, aviso: null } : t;

    /* ---- diálogos ---- */
    case 'resolver-sin-guardar':
      return resolverSinGuardar(t, accion.decision);
    case 'confirmar-borrado': {
      if (t.dialogo?.tipo !== 'borrar') return t;
      return {
        ...t,
        venta: ventaReducer(t.venta, {
          tipo: 'quitar',
          codigo: t.dialogo.codigo,
        }),
        modo: ESCANEO,
        dialogo: null,
        aviso: null,
      };
    }
    case 'confirmar-descarte':
      return t.dialogo?.tipo === 'descartar' ? { ...TPV_INICIAL } : t;
    case 'elegir-pago':
      return t.dialogo?.tipo === 'pago'
        ? {
            ...t,
            dialogo: {
              tipo: 'completada',
              metodo: accion.metodo,
              total: totalVenta(t.venta),
              unidades: unidadesVenta(t.venta),
            },
          }
        : t;
    case 'cerrar-dialogo':
      // La venta completada no se puede cancelar.
      if (!t.dialogo || t.dialogo.tipo === 'completada') return t;
      // Cerrar la pregunta de cantidad sin guardar equivale a «Seguir editando».
      return { ...t, dialogo: null, pendiente: null };
    case 'nueva-venta':
      return t.dialogo?.tipo === 'completada' ? { ...TPV_INICIAL } : t;

    /* ---- catálogo rápido ---- */
    case 'catalogo-categoria':
      return t.dialogo?.tipo === 'catalogo'
        ? { ...t, dialogo: { ...t.dialogo, categoria: accion.categoria } }
        : t;
    case 'catalogo-sumar': {
      if (t.dialogo?.tipo !== 'catalogo') return t;
      const { producto, delta } = accion;
      const borrador = t.dialogo.borrador;
      const actual = borrador.find((l) => l.codigo === producto.codigo);
      const nueva = (actual?.cantidad ?? 0) + delta;
      if (nueva < 0 || nueva > MAX_CANTIDAD || nueva === (actual?.cantidad ?? 0)) return t;
      const siguiente = actual
        ? borrador.map((l) => (l.codigo === producto.codigo ? { ...l, cantidad: nueva } : l))
        : [
            ...borrador,
            {
              codigo: producto.codigo,
              nombre: producto.nombre,
              precio: producto.precio,
              cantidad: nueva,
            },
          ];
      const tocados = [...t.dialogo.tocados.filter((c) => c !== producto.codigo), producto.codigo];
      return { ...t, dialogo: { ...t.dialogo, borrador: siguiente, tocados } };
    }
    case 'catalogo-guardar': {
      if (t.dialogo?.tipo !== 'catalogo') return t;
      // Se procesa en orden de toque: el último producto tocado se aplica el último.
      const { borrador, tocados } = t.dialogo;
      const lineas = [
        ...borrador.filter((l) => !tocados.includes(l.codigo)),
        ...tocados.flatMap((c) => borrador.filter((l) => l.codigo === c)),
      ];
      return {
        ...t,
        venta: ventaReducer(t.venta, { tipo: 'aplicar-cantidades', lineas }),
        modo: ESCANEO,
        dialogo: null,
        aviso: null,
      };
    }
  }
}

function resolverSinGuardar(t: Tpv, decision: 'seguir' | 'descartar' | 'guardar'): Tpv {
  if (t.dialogo?.tipo !== 'sin-guardar' || t.modo.tipo !== 'cantidad') return t;
  const { pendiente } = t;
  const cerrado: Tpv = { ...t, dialogo: null, pendiente: null };

  // Seguir editando: se conserva el borrador y la venta no cambia.
  if (decision === 'seguir') return cerrado;

  let base: Tpv;
  if (decision === 'descartar') {
    base = { ...cerrado, modo: ESCANEO };
  } else {
    const n = leerCantidad(t.modo.borrador);
    // Si el borrador no es válido no se puede guardar: se vuelve al editor mostrando el error y no se ejecuta la acción pendiente.
    if (n === null || !t.venta.seleccionada)
      return { ...cerrado, modo: { ...t.modo, error: true } };
    base = {
      ...cerrado,
      venta: ventaReducer(t.venta, {
        tipo: 'fijar-cantidad',
        codigo: t.venta.seleccionada,
        cantidad: n,
      }),
      modo: ESCANEO,
      aviso: null,
    };
  }
  return pendiente ? aplicar(base, pendiente) : base;
}

/** Resumen del borrador del catálogo para la barra inferior (solo cuentan las líneas con unidades). */
export function resumenBorrador(borrador: readonly Linea[]) {
  const elegidas = borrador.filter((l) => l.cantidad > 0);
  return {
    productos: elegidas.length,
    unidades: elegidas.reduce((n, l) => n + l.cantidad, 0),
    total: elegidas.reduce((n, l) => n + importeLinea(l), 0),
  };
}
