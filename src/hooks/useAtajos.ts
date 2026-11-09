import { useEffect, useRef, type Dispatch } from 'react';
import type { AccionTpv, Tpv } from '@/domain/tpv';

/**
 * useAtajos — F2 código manual · F3 otra cantidad (producto seleccionado) · F4 catálogo de panadería · F8 cobrar.
 * Propuesta demostrativa de cómo se verían las pistas de atajos; la prueba se centra en lo táctil.
 * Ignora teclas repetidas y combinaciones con modificadores para no pisar atajos del navegador. La selección
 * va en un ref para no volver a suscribir el listener en cada cambio. Enter y Esc los resuelve cada campo o
 * diálogo. Con un diálogo abierto el reducer ignora estas acciones.
 */
export function useAtajos(tpv: Tpv, dispatch: Dispatch<AccionTpv>) {
  const seleccionada = useRef<string | null>(null);
  useEffect(() => {
    seleccionada.current = tpv.venta.seleccionada;
  });

  useEffect(() => {
    function alPulsar(e: KeyboardEvent) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      switch (e.key) {
        case 'F2':
          dispatch({ tipo: 'abrir-codigo-manual' });
          break;
        case 'F3':
          if (seleccionada.current)
            dispatch({ tipo: 'abrir-editor', codigo: seleccionada.current });
          break;
        case 'F4':
          dispatch({ tipo: 'abrir-catalogo', categoria: 'panaderia' });
          break;
        case 'F8':
          dispatch({ tipo: 'cobrar' });
          break;
        default:
          return;
      }
      e.preventDefault(); // F3 abriría la búsqueda del navegador
    }
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [dispatch]);
}
