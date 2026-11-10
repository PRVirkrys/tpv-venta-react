import { useReducer, useState } from 'react';
import { CatalogoRapido } from '@/components/dialogs/CatalogoRapido';
import { DialogoBorrar } from '@/components/dialogs/DialogoBorrar';
import { DialogoCompletada } from '@/components/dialogs/DialogoCompletada';
import { DialogoDescartar } from '@/components/dialogs/DialogoDescartar';
import { DialogoPago } from '@/components/dialogs/DialogoPago';
import { DialogoSinGuardar } from '@/components/dialogs/DialogoSinGuardar';
import { GuiaRevision } from '@/components/guia/GuiaRevision';
import { BotonPantallaCompleta } from '@/components/guia/PantallaCompleta';
import { Pistas } from '@/components/guia/Pistas';
import { AppHeader } from '@/components/layout/AppHeader';
import { SalePanel } from '@/components/layout/SalePanel';
import { SidePanel } from '@/components/layout/SidePanel';
import { tpvDesdeEstado } from '@/dev/estadosDemo';
import { tpvReducer } from '@/domain/tpv';
import { useAjusteVentana } from '@/hooks/useAjusteVentana';
import { useAtajos } from '@/hooks/useAtajos';
import { useFocoEstable } from '@/hooks/useFocoEstable';
import { useLectorCodigos } from '@/hooks/useLectorCodigos';
import { useSimulacionEscaner } from '@/hooks/useSimulacionEscaner';
import { AtajosContext } from '@/lib/atajosContexto';

const ignorar = () => {};

/**
 * App — Raíz de la pantalla de venta. Conecta el reducer único con los paneles y los diálogos y activa los
 * hooks globales de teclado. Todo el estado de negocio vive en el reducer; aquí solo se lee `?estado=`
 * para abrir un estado de comprobación, y si la versión publicada lleva la ayuda de revisión (intro, pistas
 * y pantalla completa).
 */
export default function App() {
  const estado = new URLSearchParams(location.search).get('estado');
  const [tpv, dispatch] = useReducer(tpvReducer, estado, tpvDesdeEstado);
  const [atajos, setAtajos] = useState(estado === 'atajos');
  // Solo en la versión publicada para revisar la prueba: `VITE_GUIA_REVISION=1` al compilar.
  const guia = import.meta.env.VITE_GUIA_REVISION === '1';
  // La guía no se abre sola sobre un estado de comprobación, que puede traer ya un diálogo abierto.
  const [guiaAbierta, setGuiaAbierta] = useState(guia && !estado);
  // «Ver guía otra vez» reinicia también las pistas ya vistas.
  const [vueltas, setVueltas] = useState(0);
  const { escala, estilo } = useAjusteVentana(guia);
  // Con la guía abierta, las teclas de venta (E, N, R, F2…) no llegan al reducer.
  const teclado = guiaAbierta ? ignorar : dispatch;
  useFocoEstable(tpv);
  useLectorCodigos(teclado);
  useSimulacionEscaner(teclado);
  useAtajos(tpv, teclado);

  return (
    <AtajosContext.Provider value={atajos}>
      <div
        className="grid h-full min-w-256 grid-rows-[var(--header-h)_minmax(0,1fr)]"
        style={estilo}
      >
        <AppHeader
          atajos={atajos}
          onAtajos={setAtajos}
          menuAbiertoInicial={estado === 'atajos'}
          onVerGuia={
            guia
              ? () => {
                  setGuiaAbierta(true);
                  setVueltas((v) => v + 1);
                }
              : undefined
          }
          acciones={guia ? <BotonPantallaCompleta reducida={escala < 1} /> : null}
        />
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
        {guia && <GuiaRevision abierta={guiaAbierta} onCerrar={() => setGuiaAbierta(false)} />}
        {guia && <Pistas key={vueltas} tpv={tpv} activas={!guiaAbierta} />}
      </div>
    </AtajosContext.Provider>
  );
}
