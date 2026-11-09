import { useRef, type Dispatch } from 'react';
import { Button } from '@/components/ui/button';
import { formatearEuros } from '@/domain/dinero';
import type { AccionTpv, Tpv } from '@/domain/tpv';
import { totalVenta } from '@/domain/venta';
import { ICONO_PAGO, NOMBRE_PAGO } from './metodosPago';
import { Marco } from './Marco';

/** Elegir cómo paga el cliente (simulado: no hay cobro real). */
export function DialogoPago({ tpv, dispatch }: { tpv: Tpv; dispatch: Dispatch<AccionTpv> }) {
  const efectivo = useRef<HTMLButtonElement>(null);
  const cerrar = () => dispatch({ tipo: 'cerrar-dialogo' });

  return (
    <Marco
      modo="proceso"
      abierto={tpv.dialogo?.tipo === 'pago'}
      onCerrar={cerrar}
      tono="neutro"
      titulo="Finalizar venta"
      accionCabecera={
        <Button
          type="button"
          variant="ghost"
          aria-label="Volver a la venta"
          size="icon"
          className="ml-auto rounded-control text-display"
          onClick={cerrar}
        >
          ×
        </Button>
      }
      descripcion="¿Cómo paga el cliente?"
      focoInicial={efectivo}
    >
      <div className="flex items-center justify-between rounded-control bg-surface-subtle px-5 py-4">
        <span className="text-amount font-semibold text-ink-muted">Total de la venta</span>
        <strong className="text-total font-bold tabular-nums">
          {formatearEuros(totalVenta(tpv.venta))}
        </strong>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-4">
        {(['efectivo', 'tarjeta'] as const).map((metodo) => {
          const Icono = ICONO_PAGO[metodo];
          return (
            <Button
              key={metodo}
              ref={metodo === 'efectivo' ? efectivo : undefined}
              type="button"
              variant="outline"
              className="h-auto min-h-30 flex-col gap-3 rounded-card border-w-2 border-line-strong bg-surface text-amount font-bold text-ink hover:bg-surface-hover active:bg-surface-subtle"
              onClick={() => dispatch({ tipo: 'elegir-pago', metodo })}
            >
              <Icono className="size-icon-xl" aria-hidden />
              {NOMBRE_PAGO[metodo]}
            </Button>
          );
        })}
      </div>
    </Marco>
  );
}
