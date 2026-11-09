import { useRef, type Dispatch } from 'react';
import type { AccionTpv, Tpv } from '@/domain/tpv';
import { BotonDialogo, Marco } from './Marco';

/**
 * DialogoBorrar — Confirmación de borrado de un producto (− con 1 unidad, o «Quitar de la venta»).
 * El foco inicial va a Cancelar, la opción segura, no a la destructiva.
 */
export function DialogoBorrar({ tpv, dispatch }: { tpv: Tpv; dispatch: Dispatch<AccionTpv> }) {
  const cancelar = useRef<HTMLButtonElement>(null);
  const codigo = tpv.dialogo?.tipo === 'borrar' ? tpv.dialogo.codigo : null;
  const linea = tpv.venta.lineas.find((l) => l.codigo === codigo);
  const unidades = linea?.cantidad ?? 0;

  return (
    <Marco
      modo="alerta"
      abierto={!!linea}
      onCerrar={() => dispatch({ tipo: 'cerrar-dialogo' })}
      tono="peligro"
      titulo="¿Borrar este producto?"
      descripcion="Se quitarán todas sus unidades de esta venta."
      focoInicial={cancelar}
      acciones={
        <>
          <BotonDialogo
            ref={cancelar}
            atajo="Esc"
            onClick={() => dispatch({ tipo: 'cerrar-dialogo' })}
          >
            Cancelar
          </BotonDialogo>
          <BotonDialogo variante="peligro" onClick={() => dispatch({ tipo: 'confirmar-borrado' })}>
            Borrar producto
          </BotonDialogo>
        </>
      }
    >
      <p className="font-bold wrap-anywhere">{linea?.nombre}</p>
      <p className="font-bold">
        {unidades === 1
          ? '1 unidad se quitará de la venta.'
          : `${unidades} unidades se quitarán de la venta.`}
      </p>
    </Marco>
  );
}
