import { useReducer, useState } from 'react';
import { CatalogoRapido } from '@/components/dialogs/CatalogoRapido';
import { DialogoBorrar } from '@/components/dialogs/DialogoBorrar';
import { DialogoCompletada } from '@/components/dialogs/DialogoCompletada';
import { DialogoDescartar } from '@/components/dialogs/DialogoDescartar';
import { DialogoPago } from '@/components/dialogs/DialogoPago';
import { DialogoSinGuardar } from '@/components/dialogs/DialogoSinGuardar';
import { AppHeader } from '@/components/layout/AppHeader';
import { SalePanel } from '@/components/layout/SalePanel';
import { SidePanel } from '@/components/layout/SidePanel';
import { tpvDesdeEstado } from '@/dev/estadosDemo';
import { tpvReducer } from '@/domain/tpv';
import { useAtajos } from '@/hooks/useAtajos';
import { useFocoEstable } from '@/hooks/useFocoEstable';
import { useLectorCodigos } from '@/hooks/useLectorCodigos';
import { useSimulacionEscaner } from '@/hooks/useSimulacionEscaner';
import { AtajosContext } from '@/lib/atajosContexto';

/**
 * App — Raíz de la pantalla de venta. Conecta el reducer único con los paneles y los diálogos y activa los
 * hooks globales de teclado. Todo el estado de negocio vive en el reducer; aquí solo se lee `?estado=`
 * para abrir un estado de comprobación.
 */
export default function App() {
  const estado = new URLSearchParams(location.search).get('estado');
  const [tpv, dispatch] = useReducer(tpvReducer, estado, tpvDesdeEstado);
  const [atajos, setAtajos] = useState(estado === 'atajos');
  useFocoEstable(tpv);
  useLectorCodigos(dispatch);
  useSimulacionEscaner(dispatch);
  useAtajos(tpv, dispatch);

  return (
    <AtajosContext.Provider value={atajos}>
      <div className="grid h-full min-w-256 grid-rows-[var(--header-h)_minmax(0,1fr)]">
        <AppHeader atajos={atajos} onAtajos={setAtajos} menuAbiertoInicial={estado === 'atajos'} />
        <main className="grid min-h-0 grid-cols-[minmax(0,1fr)_var(--panel-w)] gap-3 bg-canvas p-3 xl:gap-5 xl:px-6 xl:py-4">
          <SalePanel venta={tpv.venta} dispatch={dispatch} />
          <SidePanel tpv={tpv} dispatch={dispatch} />
        </main>
        <DialogoBorrar tpv={tpv} dispatch={dispatch} />
        <DialogoSinGuardar tpv={tpv} dispatch={dispatch} />
        <DialogoDescartar tpv={tpv} dispatch={dispatch} />
        <DialogoPago tpv={tpv} dispatch={dispatch} />
        <DialogoCompletada tpv={tpv} dispatch={dispatch} />
        <CatalogoRapido tpv={tpv} dispatch={dispatch} />
      </div>
    </AtajosContext.Provider>
  );
}
