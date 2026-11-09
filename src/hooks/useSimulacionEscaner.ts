import { useEffect, useRef, type Dispatch } from 'react';
import { CATALOGO } from '@/domain/catalogo';
import type { AccionTpv } from '@/domain/tpv';

/**
 * Simula el lector de códigos con el teclado, para probar sin lector físico:
 * E = escanear el siguiente producto del catálogo · R = código no leído · N = producto no encontrado.
 * Se ignora al escribir en un campo y con teclas modificadoras.
 */
export function useSimulacionEscaner(dispatch: Dispatch<AccionTpv>) {
  const siguiente = useRef(4);

  useEffect(() => {
    function alPulsar(e: KeyboardEvent) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const destino = e.target;
      if (
        destino instanceof HTMLElement &&
        (destino.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(destino.tagName))
      )
        return;

      switch (e.key.toLowerCase()) {
        case 'e': {
          const producto = CATALOGO[siguiente.current++ % CATALOGO.length];
          dispatch({
            tipo: 'producto-leido',
            resultado: { estado: 'encontrado', producto },
          });
          break;
        }
        case 'r':
          dispatch({ tipo: 'lectura-fallida' });
          break;
        case 'n':
          dispatch({
            tipo: 'producto-leido',
            resultado: { estado: 'no-encontrado' },
          });
          break;
        default:
          return;
      }
      e.preventDefault();
    }
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [dispatch]);
}
