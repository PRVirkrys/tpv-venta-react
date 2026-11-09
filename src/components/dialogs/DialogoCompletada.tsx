import { useEffect, useRef, useState, type Dispatch } from 'react';
import { formatearEuros } from '@/domain/dinero';
import type { AccionTpv, Tpv } from '@/domain/tpv';
import { ICONO_PAGO, NOMBRE_PAGO } from './metodosPago';
import { Marco } from './Marco';

const SEGUNDOS = 3;
const ID_TITULO = 'titulo-venta-completada';

/** Cuenta atrás visible. Solo existe mientras el diálogo está abierto, así que siempre empieza en 3. */
function CuentaAtras({ alTerminar }: { alTerminar: () => void }) {
  const [restantes, setRestantes] = useState(SEGUNDOS);
  // Siempre la última función, sin reiniciar la cuenta si el padre se vuelve a renderizar.
  const alTerminarActual = useRef(alTerminar);
  useEffect(() => {
    alTerminarActual.current = alTerminar;
  });

  useEffect(() => {
    const limite = Date.now() + SEGUNDOS * 1000;
    const id = setInterval(() => {
      const faltan = Math.max(0, Math.ceil((limite - Date.now()) / 1000));
      setRestantes(faltan);
      if (faltan <= 0) {
        clearInterval(id);
        alTerminarActual.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-name">
      Nueva venta en <strong className="tabular-nums text-ink">{restantes}</strong> s…
    </p>
  );
}

/** Resultado de la venta simulada. No se puede cancelar: tras 3 s empieza una venta nueva (o antes, al escanear). */
export function DialogoCompletada({ tpv, dispatch }: { tpv: Tpv; dispatch: Dispatch<AccionTpv> }) {
  const dialogo = tpv.dialogo?.tipo === 'completada' ? tpv.dialogo : null;
  const Icono = dialogo ? ICONO_PAGO[dialogo.metodo] : null;

  return (
    <Marco
      modo="proceso"
      abierto={!!dialogo}
      tono="exito"
      titulo="Venta completada"
      idTitulo={ID_TITULO}
      focoInicial={() => document.getElementById(ID_TITULO)}
    >
      <div className="flex items-center justify-between rounded-control bg-surface-subtle px-4 py-3 text-amount">
        <span>Método de pago</span>
        <span className="inline-flex items-center gap-2 font-bold">
          {Icono ? <Icono className="size-icon-xl" aria-hidden /> : null}
          {dialogo ? NOMBRE_PAGO[dialogo.metodo] : null}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-control bg-surface-subtle px-5 py-4">
        <span className="text-amount font-semibold text-ink-muted">Total de la venta</span>
        <strong className="text-total font-bold tabular-nums">
          {dialogo ? formatearEuros(dialogo.total) : ''}
        </strong>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-line pt-3 text-meta text-ink-muted">
        <CuentaAtras alTerminar={() => dispatch({ tipo: 'nueva-venta' })} />
        <p className="text-name">Escanea un producto para empezar antes.</p>
      </div>
    </Marco>
  );
}
