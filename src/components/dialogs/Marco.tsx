import { CircleCheck, OctagonX, TriangleAlert } from 'lucide-react';
import { forwardRef, type ReactNode, type RefObject } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Atajo } from '@/lib/atajos';
import { cn } from '@/lib/utils';

/** Color de la cabecera, y el icono que le acompaña (el neutro no lleva). */
const cabecera = {
  neutro: { icono: null, estilo: 'border-line bg-surface text-ink' },
  exito: { icono: CircleCheck, estilo: 'border-success-line bg-success-surface text-success-ink' },
  aviso: {
    icono: TriangleAlert,
    estilo: 'border-warning-line bg-warning-surface text-warning-ink',
  },
  peligro: { icono: OctagonX, estilo: 'border-error-line bg-error-surface text-error-ink' },
} as const;

interface MarcoProps {
  /**
   * Qué le anuncia el diálogo a la tecnología de apoyo (el aspecto es idéntico).
   * - `alerta`: confirmaciones que exigen una decisión antes de seguir (borrar, descartar, cantidad
   *   sin guardar). Usa `AlertDialog`, que expone el rol `alertdialog`: un lector de pantalla lo
   *   anuncia como interrupción y lee título y descripción al abrirse.
   * - `proceso`: pasos del flujo de venta (pago, venta completada). Usa `Dialog` (rol `dialog`).
   * Se mantiene la distinción aunque el TPV no use lector de pantalla a diario: cuesta una línea,
   * no cambia nada visible y evita un fallo de accesibilidad si el equipo lo activa o se audita.
   * Los tests (`accesibilidad.test.tsx` y otros) consultan el rol `alertdialog`.
   */
  modo: 'alerta' | 'proceso';
  abierto: boolean;
  /** Escape. Sin esta función el diálogo no se puede cancelar. El clic exterior nunca cierra. */
  onCerrar?: () => void;
  tono: keyof typeof cabecera;
  titulo: string;
  /** Para devolverle el foco al título (cuando no hay ningún botón que lo reciba). */
  idTitulo?: string;
  /** Se muestra en la cabecera, a la derecha (por ejemplo, la × de cerrar). */
  accionCabecera?: ReactNode;
  descripcion?: string;
  /** Elemento que recibe el foco al abrir (en `alerta`, siempre la opción segura). */
  focoInicial: RefObject<HTMLElement | null> | (() => HTMLElement | null);
  /** Contenido bajo la descripción. */
  children?: ReactNode;
  /** Botones del pie, de menos a más importante. Sin ellos no hay pie. */
  acciones?: ReactNode;
}

/** Estructura común de todos los diálogos del TPV: cabecera de color, cuerpo y pie opcional. */
export function Marco({
  modo,
  abierto,
  onCerrar,
  tono,
  titulo,
  idTitulo,
  accionCabecera,
  descripcion,
  focoInicial,
  children,
  acciones,
}: MarcoProps) {
  const { icono: Icono, estilo } = cabecera[tono];
  const alerta = modo === 'alerta';
  const Raiz = alerta ? AlertDialog : Dialog;
  const Contenido = alerta ? AlertDialogContent : DialogContent;
  const Titulo = alerta ? AlertDialogTitle : DialogTitle;
  const Descripcion = alerta ? AlertDialogDescription : DialogDescription;

  return (
    <Raiz
      open={abierto}
      // AlertDialog ya ignora el clic exterior; Dialog hay que pedírselo.
      {...(alerta ? {} : { disablePointerDismissal: true })}
      onOpenChange={(a) => {
        if (!a) onCerrar?.();
      }}
    >
      <Contenido initialFocus={focoInicial}>
        <div className={cn('flex items-center gap-3 border-b px-6 py-4', estilo)}>
          {Icono ? <Icono className="size-icon-lg" aria-hidden /> : null}
          <Titulo
            id={idTitulo}
            tabIndex={idTitulo ? -1 : undefined}
            className="text-heading leading-tight font-bold"
          >
            {titulo}
          </Titulo>
          {accionCabecera}
        </div>
        <div className="flex flex-col gap-4 px-6 py-5 text-name leading-normal">
          {descripcion ? (
            <Descripcion className="text-name text-ink">{descripcion}</Descripcion>
          ) : null}
          {children}
        </div>
        {acciones ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 pt-4 pb-5">
            {acciones}
          </div>
        ) : null}
      </Contenido>
    </Raiz>
  );
}

const botonBase = 'h-touch flex-none rounded-control px-5 text-name font-bold whitespace-nowrap';

type BotonDialogoProps = Omit<React.ComponentPropsWithoutRef<typeof Button>, 'variant'> & {
  variante?: 'normal' | 'primario' | 'peligro';
  /** Tecla que equivale al botón (solo Esc en los diálogos). */
  atajo?: string;
};

// React 18: forwardRef para que `initialFocus` reciba la referencia del botón.
export const BotonDialogo = forwardRef<HTMLButtonElement, BotonDialogoProps>(function BotonDialogo(
  { variante = 'normal', atajo, className, children, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      type="button"
      variant={variante === 'normal' ? 'outline' : 'default'}
      aria-keyshortcuts={atajo === 'Esc' ? 'Escape' : atajo}
      className={cn(
        'relative',
        botonBase,
        variante === 'normal' && 'border-line-control bg-surface text-ink',
        variante === 'peligro' &&
          'border-error-solid bg-error-solid text-white hover:bg-error-hover-solid active:bg-error-pressed',
        className,
      )}
      {...props}
    >
      {atajo && <Atajo tecla={atajo} />}
      {children}
    </Button>
  );
});
