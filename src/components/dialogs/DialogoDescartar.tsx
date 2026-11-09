import { useRef, type Dispatch } from 'react';
import { formatearEuros } from '@/domain/dinero';
import type { AccionTpv, Tpv } from '@/domain/tpv';
import { totalVenta, unidadesVenta } from '@/domain/venta';
import { BotonDialogo, Marco } from './Marco';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Confirmación para descartar toda la venta en curso. */
export function DialogoDescartar({ tpv, dispatch }: { tpv: Tpv; dispatch: Dispatch<AccionTpv> }) {
  const seguir = useRef<HTMLButtonElement>(null);
  const { venta } = tpv;

  return (
    <Marco
      modo="alerta"
      abierto={tpv.dialogo?.tipo === 'descartar'}
      onCerrar={() => dispatch({ tipo: 'cerrar-dialogo' })}
      tono="peligro"
      titulo="¿Descartar esta venta?"
      descripcion="Se quitarán todos los productos y comenzarás una venta nueva."
      focoInicial={seguir}
      acciones={
        <>
          <BotonDialogo
            ref={seguir}
            atajo="Esc"
            onClick={() => dispatch({ tipo: 'cerrar-dialogo' })}
          >
            Seguir con la venta
          </BotonDialogo>
          <BotonDialogo variante="peligro" onClick={() => dispatch({ tipo: 'confirmar-descarte' })}>
            Descartar venta
          </BotonDialogo>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-control bg-surface-subtle px-4 py-3">
          <span className="block text-meta font-semibold text-ink-muted">Compra actual</span>
          <strong className="block text-display wrap-anywhere">
            {plural(venta.lineas.length, 'producto', 'productos')}
          </strong>
          <span className="block text-meta font-semibold text-ink-muted">
            {plural(unidadesVenta(venta), 'unidad', 'unidades')}
          </span>
        </div>
        <div className="rounded-control bg-surface-subtle px-4 py-3">
          <span className="block text-meta font-semibold text-ink-muted">Total de la venta</span>
          <strong className="block text-display tabular-nums wrap-anywhere">
            {formatearEuros(totalVenta(venta))}
          </strong>
        </div>
      </div>
    </Marco>
  );
}
