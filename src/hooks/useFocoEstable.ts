import { useEffect } from 'react';
import type { Tpv } from '@/domain/tpv';

/** Identificador del bloque de estado del escáner (título + detalle), el punto de foco estable de la pantalla. */
export const ID_FOCO_ESCANER = 'foco-escaner';

/**
 * Si tras un cambio el foco se ha perdido (el botón que lo tenía desapareció: se confirmó un borrado,
 * se guardó una cantidad, se cerró un diálogo…), vuelve al estado del escáner.
 * Si el foco sigue en un control, no se toca. Con un diálogo abierto lo gestiona el propio diálogo.
 */
export function useFocoEstable(tpv: Tpv) {
  useEffect(() => {
    if (tpv.dialogo) return;
    // Se espera un instante para que cada diálogo termine de devolver el foco a su propio botón.
    const id = setTimeout(() => {
      const perdido = !document.activeElement || document.activeElement === document.body;
      if (perdido) document.getElementById(ID_FOCO_ESCANER)?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(id);
  }, [tpv]);
}
