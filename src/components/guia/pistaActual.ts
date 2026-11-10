import type { Tpv } from '@/domain/tpv';

/**
 * Pistas de la demo publicada (`VITE_GUIA_REVISION=1`): aparecen una vez, en el momento y junto al control
 * en que sirven. Esta función solo decide cuál toca según el estado de la pantalla; no forma parte del TPV.
 */
export type IdPista =
  'escaner' | 'cantidad' | 'teclado-cantidad' | 'lectura' | 'teclado-codigo' | 'cobrar';

export interface Pista {
  id: IdPista;
  titulo: string;
  texto: string;
  /** Control real que se resalta. Se localiza por su nombre accesible, que los tests ya vigilan. */
  objetivo: string;
  /** Dónde se coloca la nota respecto al control, para no taparlo. */
  lado: 'izquierda' | 'abajo' | 'arriba';
}

const PISTAS: Record<IdPista, Omit<Pista, 'id'>> = {
  escaner: {
    titulo: 'Añadir productos',
    texto:
      'Pulsen E para simular un escaneo. R simula una lectura fallida y N, un código que no existe.',
    objetivo: 'section[aria-label="Escáner"]',
    lado: 'izquierda',
  },
  cantidad: {
    titulo: 'Cambiar la cantidad',
    texto: 'Toquen el número para escribirla con el teclado. − y + restan o suman una unidad.',
    objetivo: 'main [aria-label^="Editar cantidad de"]',
    lado: 'abajo',
  },
  'teclado-cantidad': {
    titulo: 'Teclado de cantidad',
    texto:
      'Escribe la cantidad total del producto seleccionado. Guardar cantidad la aplica y Esc cancela.',
    objetivo: 'section[aria-label="Editar cantidad"]',
    lado: 'izquierda',
  },
  lectura: {
    titulo: 'Si falla la lectura',
    texto:
      'Escriban el código con este teclado, por ejemplo 841000100001, y toquen Añadir producto.',
    objetivo: 'section[aria-label="Introducir código manual"]',
    lado: 'izquierda',
  },
  'teclado-codigo': {
    titulo: 'Código manual',
    texto: 'Este teclado escribe el código del producto. Prueben con 841000100001.',
    objetivo: 'section[aria-label="Introducir código manual"]',
    lado: 'izquierda',
  },
  cobrar: {
    titulo: 'Cerrar la venta',
    texto: 'Cuando terminen, toquen Cobrar o pulsen F8.',
    objetivo: 'button[aria-keyshortcuts="F8"]',
    lado: 'arriba',
  },
};

/** Pistas que encajan con lo que hay en pantalla, de la más concreta a la más general. */
function candidatas(tpv: Tpv, vistas: ReadonlySet<IdPista>): IdPista[] {
  if (tpv.dialogo) return [];
  const { modo, venta, aviso } = tpv;
  if (modo.tipo === 'cantidad') return ['teclado-cantidad'];
  if (modo.tipo === 'codigo-manual') {
    const fallo = aviso === 'codigo-no-leido' || aviso === 'producto-no-encontrado';
    return fallo ? ['lectura'] : ['teclado-codigo'];
  }
  if (venta.lineas.length === 0) return ['escaner'];
  // Cobrar solo después de haber visto cómo cambiar la cantidad, y con algo más que un producto.
  if (vistas.has('cantidad') && venta.lineas.length > 1) return ['cobrar'];
  return ['cantidad'];
}

export const pistaPorId = (id: IdPista): Pista => ({ id, ...PISTAS[id] });

export function pistaActual(tpv: Tpv, vistas: ReadonlySet<IdPista>): Pista | null {
  const id = candidatas(tpv, vistas).find((c) => !vistas.has(c));
  return id ? pistaPorId(id) : null;
}
