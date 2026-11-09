import { useEffect, type Dispatch } from 'react';
import { consultarProducto } from '@/domain/catalogo';
import type { AccionTpv } from '@/domain/tpv';

/** Un lector de códigos escribe como un teclado muy rápido: menos de unos 80 ms entre teclas. Una persona tarda más. */
const MAX_ENTRE_TECLAS_MS = 80;
const MIN_DIGITOS = 3;

const esCampoEditable = (destino: EventTarget | null) =>
  destino instanceof HTMLElement &&
  (destino.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(destino.tagName));

/**
 * Recoge los códigos que escribe un lector de códigos físico (dígitos seguidos de Enter) cuando no hay
 * ningún campo con el foco, y los envía como una lectura. Si hay un campo con el foco (código manual,
 * cantidad, buscador), el lector escribe ahí. Con un diálogo abierto el reducer ignora la lectura.
 */
export function useLectorCodigos(dispatch: Dispatch<AccionTpv>) {
  useEffect(() => {
    let codigo = '';
    let ultima = 0;
    // Una letra en medio estropea la lectura entera: se descarta hasta el Enter o una pausa.
    let descartada = false;

    function alPulsar(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (esCampoEditable(e.target)) {
        codigo = '';
        descartada = false;
        return;
      }

      // Una pausa larga entre teclas: no es un lector, se empieza de cero.
      if (e.timeStamp - ultima > MAX_ENTRE_TECLAS_MS) {
        codigo = '';
        descartada = false;
      }
      ultima = e.timeStamp;

      if (e.key === 'Enter') {
        const leido = codigo;
        const valida = !descartada;
        codigo = '';
        descartada = false;
        if (!valida || leido.length < MIN_DIGITOS) return;
        // Evita que el Enter del lector pulse el botón que tenga el foco.
        e.preventDefault();
        dispatch({
          tipo: 'producto-leido',
          resultado: consultarProducto(leido),
        });
      } else if (/^\d$/.test(e.key)) {
        if (!descartada) codigo += e.key;
      } else if (e.key.length === 1) {
        codigo = '';
        descartada = true;
      }
    }

    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [dispatch]);
}
