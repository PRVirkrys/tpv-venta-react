import { CircleHelp, SlidersHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  atajos: boolean;
  onAtajos: (valor: boolean) => void;
  /** Solo para los estados de comprobación (`?estado=atajos`). */
  abiertoInicial?: boolean;
  /** Solo en la versión publicada para revisar la prueba. */
  onVerGuia?: () => void;
}

/** Menú de opciones: interruptor de las pistas de teclado y acceso a administración (no disponible en esta prueba). */
export function MenuOpciones({ atajos, onAtajos, abiertoInicial = false, onVerGuia }: Props) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const idMenu = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const interruptor = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alPulsar(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setAbierto(false);
      boton.current?.focus();
    }
    function alHacerClic(e: MouseEvent) {
      // Un clic fuera cierra el menú sin quitarle el foco al control pulsado.
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('keydown', alPulsar);
    document.addEventListener('click', alHacerClic);
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.removeEventListener('click', alHacerClic);
    };
  }, [abierto]);

  function alternar() {
    setAbierto((a) => !a);
  }
  // Al abrir, el foco pasa al interruptor.
  useEffect(() => {
    if (abierto) interruptor.current?.focus();
  }, [abierto]);

  return (
    <div ref={contenedor} className="flex items-center">
      <Button
        ref={boton}
        type="button"
        variant="outline"
        size="compact"
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        className={cn(
          'gap-2 rounded-control border-line-control bg-surface px-4 font-semibold text-ink',
          abierto && 'bg-surface-subtle',
        )}
        onClick={alternar}
      >
        <SlidersHorizontal className="size-icon-sm" aria-hidden />
        Opciones
      </Button>

      {abierto && (
        <div
          id={idMenu}
          className="absolute top-[calc(var(--header-h)-4px)] right-4 z-30 w-80 rounded-card border-w-1 border-line bg-surface p-3"
        >
          <button
            ref={interruptor}
            type="button"
            role="switch"
            aria-checked={atajos}
            onClick={() => onAtajos(!atajos)}
            className="flex min-h-touch w-full items-center justify-between gap-3 text-left text-body font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <span>Mostrar atajos de teclado</span>
            <span
              aria-hidden
              className={cn(
                'flex h-7 w-12 flex-none items-center rounded-full border p-0.5 transition-colors',
                atajos ? 'border-ink bg-ink' : 'border-ink-muted bg-surface-pressed',
              )}
            >
              <span
                className={cn(
                  'size-5 rounded-full transition-transform',
                  atajos ? 'translate-x-6 bg-white' : 'translate-x-0 bg-ink-muted',
                )}
              />
            </span>
          </button>
          {atajos && (
            <p className="mt-1.5 mb-2 text-meta leading-snug text-ink-muted">
              F2 · Código manual · F3 · Otra cantidad · F4 · Catálogo de panadería · F8 · Cobrar.
              Enter confirma y Esc cancela.
              <br />
              Sin lector físico: E simula un escaneo, R un código no leído y N un producto no
              encontrado.
            </p>
          )}
          {onVerGuia && (
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                onVerGuia();
              }}
              className="mt-1.5 flex min-h-touch w-full items-center gap-3 border-t border-line text-left text-body font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <CircleHelp className="size-icon-sm" aria-hidden />
              Ver guía otra vez
            </button>
          )}
          <button
            type="button"
            disabled
            className="mt-1.5 block w-full border-t border-line pt-3 pb-1 text-left font-semibold text-disabled-ink"
          >
            Administración
            <small className="mt-0.5 block text-meta font-normal">No disponible en esta demo</small>
          </button>
        </div>
      )}
    </div>
  );
}
