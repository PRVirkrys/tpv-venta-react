import { useRef, type Dispatch } from 'react';
import type { AccionTpv, Tpv } from '@/domain/tpv';
import { BotonDialogo, Marco } from './Marco';

const contexto = {
  escaneo: 'Antes de añadir el producto escaneado, decide qué hacer con esta cantidad.',
  otro: 'Antes de editar otro producto, decide qué hacer con esta cantidad.',
  finalizar: 'Antes de finalizar la venta, decide qué hacer con esta cantidad.',
};

function textoContexto(pendiente: Tpv['pendiente']): string {
  switch (pendiente?.tipo) {
    case 'producto-leido':
      return contexto.escaneo;
    case 'cobrar':
    case 'pedir-descartar':
      return contexto.finalizar;
    default:
      return contexto.otro;
  }
}

/** Pregunta qué hacer con una cantidad escrita y no guardada antes de cambiar de contexto. */
export function DialogoSinGuardar({ tpv, dispatch }: { tpv: Tpv; dispatch: Dispatch<AccionTpv> }) {
  const seguir = useRef<HTMLButtonElement>(null);
  const linea = tpv.venta.lineas.find((l) => l.codigo === tpv.venta.seleccionada);
  const abierta = tpv.dialogo?.tipo === 'sin-guardar' && tpv.modo.tipo === 'cantidad' && !!linea;
  const nueva = tpv.modo.tipo === 'cantidad' ? tpv.modo.borrador.trim() || 'Sin indicar' : '';
  const resolver = (decision: 'seguir' | 'descartar' | 'guardar') => () =>
    dispatch({ tipo: 'resolver-sin-guardar', decision });

  return (
    <Marco
      modo="alerta"
      abierto={abierta}
      onCerrar={resolver('seguir')}
      tono="aviso"
      titulo="Tienes una cantidad sin guardar"
      descripcion={textoContexto(tpv.pendiente)}
      focoInicial={seguir}
      acciones={
        <>
          <BotonDialogo ref={seguir} atajo="Esc" onClick={resolver('seguir')}>
            Seguir editando
          </BotonDialogo>
          <BotonDialogo onClick={resolver('descartar')}>Continuar sin guardar</BotonDialogo>
          <BotonDialogo variante="primario" onClick={resolver('guardar')}>
            Guardar y continuar
          </BotonDialogo>
        </>
      }
    >
      <p className="font-bold wrap-anywhere">{linea?.nombre}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-control bg-surface-subtle px-4 py-3">
          <span className="block text-meta font-semibold text-ink-muted">Cantidad actual</span>
          <strong className="block text-display tabular-nums wrap-anywhere">
            {linea?.cantidad}
          </strong>
        </div>
        <div className="rounded-control bg-surface-subtle px-4 py-3">
          <span className="block text-meta font-semibold text-ink-muted">Nueva cantidad</span>
          <strong className="block text-display tabular-nums wrap-anywhere">{nueva}</strong>
        </div>
      </div>
    </Marco>
  );
}
