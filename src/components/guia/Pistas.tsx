import {
  CreditCard,
  Hash,
  Keyboard,
  OctagonX,
  Pointer,
  ScanBarcode,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import type { Tpv } from '@/domain/tpv';
import { pistaActual, pistaPorId, type IdPista, type Pista } from './pistaActual';

const ICONO: Record<IdPista, LucideIcon> = {
  escaner: ScanBarcode,
  cantidad: Pointer,
  'teclado-cantidad': Keyboard,
  lectura: OctagonX,
  'teclado-codigo': Hash,
  cobrar: CreditCard,
};

/** Ancho de la nota (w-72) y separación con el control resaltado. */
const ANCHO = 288;
const HUECO = 12;

interface Caja {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Coloca la nota junto al control, dentro de la ventana. */
function posicion(rect: Caja, lado: Pista['lado'], alto: number) {
  const dentro = (v: number, max: number) => Math.max(HUECO, Math.min(v, max - HUECO));
  if (lado === 'izquierda' && rect.left - ANCHO - HUECO >= HUECO) {
    return {
      left: rect.left - ANCHO - HUECO,
      top: dentro(rect.top, innerHeight - alto),
    };
  }
  const left = dentro(rect.left + rect.width / 2 - ANCHO / 2, innerWidth - ANCHO);
  if (lado === 'arriba' && rect.top - alto - HUECO >= HUECO) {
    return { left, top: rect.top - alto - HUECO };
  }
  return { left, top: dentro(rect.top + rect.height + HUECO, innerHeight - alto) };
}

/**
 * Pistas contextuales de la demo publicada. Resaltan el control real y explican qué hacer con él,
 * una vez cada una. No reciben el foco ni bloquean el teclado: la venta sigue funcionando debajo.
 * Una pista se da por vista al cerrarla con «Entendido» o cuando la situación cambia (se usó el control).
 */
export function Pistas({ tpv, activas }: { tpv: Tpv; activas: boolean }) {
  const [vistas, setVistas] = useState<ReadonlySet<IdPista>>(() => new Set());
  const pista = activas ? pistaActual(tpv, vistas) : null;
  const anterior = useRef<IdPista | null>(null);
  const nota = useRef<HTMLDivElement>(null);
  const [sitio, setSitio] = useState<{ id: IdPista; rect: Caja; top: number; left: number } | null>(
    null,
  );

  const marcar = (id: IdPista) => setVistas((v) => new Set(v).add(id));

  // Al cambiar de situación, la pista que se mostraba ya cumplió.
  useEffect(() => {
    const previa = anterior.current;
    anterior.current = pista?.id ?? null;
    if (previa && previa !== pista?.id) marcar(previa);
  }, [pista?.id]);

  // Mide el control resaltado y la nota (ya pintada, pero invisible) antes de mostrarla, después de cada
  // cambio de la pantalla y al redimensionar.
  const id = pista?.id;
  useLayoutEffect(() => {
    if (!id) return;
    const { objetivo, lado } = pistaPorId(id);
    const medir = () => {
      const r = document.querySelector(objetivo)?.getBoundingClientRect();
      if (!r) return setSitio(null);
      const rect = { top: r.top, left: r.left, width: r.width, height: r.height };
      setSitio({ id, rect, ...posicion(rect, lado, nota.current?.offsetHeight ?? 0) });
    };
    medir();
    addEventListener('resize', medir);
    addEventListener('scroll', medir, true);
    return () => {
      removeEventListener('resize', medir);
      removeEventListener('scroll', medir, true);
    };
  }, [id, tpv]);

  if (!activas) return null;
  const Icono = pista ? ICONO[pista.id] : null;
  const medida = pista && sitio?.id === pista.id ? sitio : null;

  return createPortal(
    // La región existe siempre para que el lector de pantalla anuncie cada pista nueva al aparecer.
    <div aria-live="polite">
      {pista && Icono ? (
        <>
          {medida && (
            <div
              aria-hidden
              data-testid="resaltado-pista"
              className="pointer-events-none fixed z-40 rounded-control ring-2 ring-primary ring-offset-2 ring-offset-surface motion-safe:animate-pulse"
              style={medida.rect}
            />
          )}
          <div
            ref={nota}
            role="note"
            aria-label={`Pista: ${pista.titulo}`}
            className="fixed z-40 flex w-72 flex-col gap-2 rounded-card border-w-2 border-primary bg-surface p-4 text-ink motion-safe:animate-in motion-safe:fade-in-0"
            // Hasta medirla, la nota se pinta oculta para conocer su alto.
            style={
              medida
                ? { top: medida.top, left: medida.left }
                : { top: 0, left: 0, visibility: 'hidden' }
            }
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-touch-compact flex-none place-items-center rounded-control bg-surface-subtle text-primary"
              >
                <Icono className="size-icon-md" />
              </span>
              <strong className="text-name leading-tight">{pista.titulo}</strong>
            </div>
            <p className="text-body leading-normal">{pista.texto}</p>
            <Button
              type="button"
              variant="outline"
              size="compact"
              className="self-end rounded-control border-line-control bg-surface px-4 font-bold text-ink"
              onClick={() => marcar(pista.id)}
            >
              Entendido
            </Button>
          </div>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
