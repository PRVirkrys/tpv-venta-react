import { ArrowLeft, ArrowRight, Apple, Carrot, Croissant, type LucideIcon } from 'lucide-react';
import type { Dispatch } from 'react';
import { Marca, SesionCajero } from '@/components/layout/Sesion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { productosDe, type CategoriaCatalogo, type Producto } from '@/domain/catalogo';
import { formatearEuros } from '@/domain/dinero';
import { resumenBorrador, type AccionTpv, type Tpv } from '@/domain/tpv';
import { MAX_CANTIDAD } from '@/domain/cantidad';
import { Atajo } from '@/lib/atajos';
import { botonPaso } from '@/lib/estilos';
import { cn } from '@/lib/utils';

const pestanas: {
  categoria: CategoriaCatalogo;
  nombre: string;
  icono: LucideIcon;
}[] = [
  { categoria: 'panaderia', nombre: 'Panadería / Bollería', icono: Croissant },
  { categoria: 'fruta', nombre: 'Fruta', icono: Apple },
  { categoria: 'verdura', nombre: 'Verdura', icono: Carrot },
];

const ID_PANEL = 'panel-catalogo';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** TarjetaProducto — Producto del catálogo con − y + sobre el borrador, no sobre la venta. Activa (borde terracota) si hay unidades. */
function TarjetaProducto({
  producto,
  cantidad,
  Icono,
  dispatch,
}: {
  producto: Producto;
  cantidad: number;
  Icono: LucideIcon;
  dispatch: Dispatch<AccionTpv>;
}) {
  const activa = cantidad > 0;
  const sumar = (delta: 1 | -1) => () => dispatch({ tipo: 'catalogo-sumar', producto, delta });

  return (
    <li
      className={cn(
        'flex min-h-product-card flex-col justify-between gap-3 rounded-card border-w-2 border-line bg-surface p-4',
        activa && 'border-primary bg-select-tint',
      )}
    >
      {/* Marcador de imagen: la prueba usa productos simulados, sin fotos. */}
      <div
        aria-hidden
        className={cn(
          'flex h-product-media w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-control border border-line bg-gradient-to-b from-canvas to-surface-subtle text-ink-muted',
          activa && 'border-select-line-soft from-select-tint to-warning-surface',
        )}
      >
        <span
          className={cn(
            'grid size-touch-compact place-items-center rounded-full bg-surface text-ink-muted',
            activa && 'text-primary',
          )}
        >
          <Icono className="size-icon-md" />
        </span>
        <span className="px-2 text-center text-meta font-semibold tracking-wide text-ink-muted uppercase">
          {producto.nombre}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-amount leading-snug font-bold text-ink">{producto.nombre}</span>
        <div className="flex items-center justify-between text-body text-ink-muted">
          <span className="text-name font-bold tabular-nums text-ink">
            {formatearEuros(producto.precio)} / ud
          </span>
          {activa && (
            <span className="text-body font-bold text-primary">En ticket: {cantidad} ud</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[var(--touch)_minmax(0,1fr)_var(--touch)] items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={cantidad === 0}
          aria-label={`Restar una unidad a ${producto.nombre}`}
          className={botonPaso}
          onClick={sumar(-1)}
        >
          −
        </Button>
        <span
          className={cn(
            'grid h-touch place-items-center rounded-control border-w-2 border-line-control bg-surface text-heading font-bold tabular-nums text-ink',
            activa && 'border-primary text-primary',
          )}
        >
          {cantidad}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={cantidad >= MAX_CANTIDAD}
          aria-label={`Añadir una unidad a ${producto.nombre}`}
          className={botonPaso}
          onClick={sumar(1)}
        >
          +
        </Button>
      </div>
    </li>
  );
}

/** Pantalla completa para elegir productos sin escanear. Nada llega a la venta hasta pulsar «Guardar». */
export function CatalogoRapido({ tpv, dispatch }: { tpv: Tpv; dispatch: Dispatch<AccionTpv> }) {
  const dialogo = tpv.dialogo?.tipo === 'catalogo' ? tpv.dialogo : null;
  const cerrar = () => dispatch({ tipo: 'cerrar-dialogo' });

  // El Dialog está siempre montado y solo cambia `open`: Base UI da el foco inicial al abrirse, no al montarse abierto.
  return (
    <Dialog
      open={!!dialogo}
      disablePointerDismissal
      onOpenChange={(abierto) => {
        if (!abierto) cerrar();
      }}
    >
      <DialogContent
        initialFocus={() =>
          document.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
        }
        className="top-0 left-0 flex h-full max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-canvas"
      >
        {dialogo ? <Pantalla dialogo={dialogo} dispatch={dispatch} cerrar={cerrar} /> : null}
      </DialogContent>
    </Dialog>
  );
}

type DialogoCatalogo = Extract<NonNullable<Tpv['dialogo']>, { tipo: 'catalogo' }>;

/** Pantalla — Contenido del diálogo a pantalla completa. Separado de `CatalogoRapido` para que solo exista con el diálogo abierto. */
function Pantalla({
  dialogo,
  dispatch,
  cerrar,
}: {
  dialogo: DialogoCatalogo;
  dispatch: Dispatch<AccionTpv>;
  cerrar: () => void;
}) {
  const resumen = resumenBorrador(dialogo.borrador);
  const activa = pestanas.find((p) => p.categoria === dialogo.categoria)!;

  return (
    <>
      <header className="flex h-header flex-none items-center justify-between border-b border-line bg-surface px-6">
        <div className="flex items-center gap-4">
          <Marca />
          <SesionCajero />
          <div aria-hidden className="mx-1 h-7 w-px bg-line" />
          <DialogTitle className="text-heading font-bold text-ink">Catálogo rápido</DialogTitle>
        </div>
        <Button
          type="button"
          variant="outline"
          size="compact"
          className="gap-2 rounded-control border-line-control bg-surface px-4 text-body font-semibold text-ink"
          onClick={cerrar}
        >
          <ArrowLeft className="size-icon-sm" aria-hidden />
          Volver a la venta
        </Button>
      </header>

      <div className="flex flex-none items-center justify-between gap-4 border-b border-line bg-surface px-6 py-3">
        <div role="tablist" aria-label="Categorías" className="flex items-center gap-3">
          {pestanas.map(({ categoria, nombre, icono: Icono }) => {
            const seleccionada = categoria === dialogo.categoria;
            return (
              <Button
                key={categoria}
                type="button"
                id={`pestana-${categoria}`}
                role="tab"
                variant="outline"
                aria-selected={seleccionada}
                aria-controls={ID_PANEL}
                className={cn(
                  'gap-2 rounded-control border-line-control bg-surface-subtle px-5 text-name font-bold text-ink',
                  seleccionada && 'border-ink bg-ink text-white active:bg-ink',
                )}
                onClick={() => dispatch({ tipo: 'catalogo-categoria', categoria })}
              >
                <Icono className="size-icon-md" aria-hidden />
                {nombre}
              </Button>
            );
          })}
        </div>
        <p className="text-meta text-ink-muted">
          Toca <strong>+</strong> o <strong>−</strong> en cualquier producto para cambiar unidades
        </p>
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <div
          id={ID_PANEL}
          role="tabpanel"
          aria-labelledby={`pestana-${dialogo.categoria}`}
          className="mx-auto max-w-350"
        >
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {productosDe(dialogo.categoria).map((producto) => (
              <TarjetaProducto
                key={producto.codigo}
                producto={producto}
                cantidad={dialogo.borrador.find((l) => l.codigo === producto.codigo)?.cantidad ?? 0}
                Icono={activa.icono}
                dispatch={dispatch}
              />
            ))}
          </ul>
        </div>
      </main>

      <footer className="flex h-dialog-footer flex-none items-center justify-between border-t border-line bg-surface px-6">
        <div className="flex flex-col gap-0.5">
          <strong className="text-title font-bold text-ink">
            {plural(resumen.productos, 'producto seleccionado', 'productos seleccionados')} ·{' '}
            {plural(resumen.unidades, 'unidad total', 'unidades totales')}
          </strong>
          <span className="text-meta text-ink-muted">
            Importe total estimado: {formatearEuros(resumen.total)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            aria-keyshortcuts="Escape"
            className="relative h-touch rounded-control border-line-control bg-surface-subtle px-5 text-name font-semibold text-ink"
            onClick={cerrar}
          >
            <Atajo tecla="Esc" />
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-touch gap-2 rounded-control px-7 text-amount font-bold"
            onClick={() => dispatch({ tipo: 'catalogo-guardar' })}
          >
            Guardar productos e ir a la venta
            <ArrowRight className="size-icon-sm" aria-hidden />
          </Button>
        </div>
      </footer>
    </>
  );
}
