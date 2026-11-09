import * as React from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Estados de los botones, sin sombras. La pantalla es táctil, pero también se puede usar con ratón, así que
 * hay dos respuestas: `hover:` (solo en dispositivos con puntero, un paso suave) y `active:` (al pulsar, más marcado):
 * - principal: `--primary-hover` / `--primary-pressed`
 * - neutro (outline, ghost, secondary): `--surface-hover` / `--surface-pressed`
 * - peligro suave (Descartar venta, Quitar de la venta): fondo `--error-hover` / `--error-press` y texto `--error-pressed` al pulsar
 * Lo desactivado no responde (`pointer-events-none`).
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-body font-medium whitespace-nowrap transition-colors duration-75 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed',
        outline:
          'border-border bg-background hover:bg-surface-hover active:bg-surface-pressed aria-expanded:bg-surface-subtle',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-surface-hover active:bg-surface-pressed',
        ghost: 'hover:bg-surface-hover active:bg-surface-pressed',
        destructive: 'text-error-ink hover:bg-error-hover active:bg-error-press active:text-error-pressed',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      // Alturas del TPV: --touch (56 px) para lo que se pulsa con el dedo y --touch-compact (44 px) para lo secundario.
      size: {
        default: 'h-touch gap-1.5 px-3',
        compact: 'h-touch-compact gap-1.5 px-3',
        // Cobrar: la acción principal de la venta. Alto y ancho mínimos de --pay-*, icono de 24 px y, desactivado, gris sin
        // transparencia para que se lea como «no disponible» y no como «cargando».
        pay: "min-h-pay min-w-pay gap-2 rounded-control px-7 text-amount font-bold disabled:bg-disabled-surface disabled:text-disabled-ink disabled:opacity-100 [&_svg:not([class*='size-'])]:size-icon-md",
        icon: 'size-touch-compact',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonPrimitive.Props, 'ref'> & VariantProps<typeof buttonVariants>
>(function Button({ className, variant = 'default', size = 'default', ...props }, ref) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});

export { Button, buttonVariants };
