import { ArrowRight, CircleX, Search, ShoppingCart, Zap } from 'lucide-react';
import { useEffect, useRef, type Dispatch, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAX_CANTIDAD } from '@/domain/cantidad';
import { formatearEuros } from '@/domain/dinero';
import type { AccionTpv } from '@/domain/tpv';
import { importeLinea, totalVenta, unidadesVenta, type Linea, type Venta } from '@/domain/venta';
import { Atajo } from '@/lib/atajos';
import { botonPaso } from '@/lib/estilos';
import { cn } from '@/lib/utils';

const columnas =
  'grid grid-cols-[minmax(0,1fr)_176px_88px_112px] items-center gap-x-2 px-4 xl:grid-cols-[minmax(0,1fr)_176px_104px_132px] xl:gap-x-3 xl:px-5';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * FilaProducto — Una fila de la lista, seleccionable por toque, Enter o Espacio. «Seleccionado» (borde y fondo
 * azulados) y «último añadido» (borde gris) son marcas distintas porque pueden estar en filas distintas.
 * Solo atiende teclas cuando el foco está en la fila, para no interceptar los botones − y + de dentro.
 */
function FilaProducto({
  linea,
  seleccionada,
  ultima,
  dispatch,
}: {
  linea: Linea;
  seleccionada: boolean;
  ultima: boolean;
  dispatch: Dispatch<AccionTpv>;
}) {
  const seleccionar = () => dispatch({ tipo: 'seleccionar', codigo: linea.codigo });
  const alPulsarTecla = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    seleccionar();
  };

  return (
    <li
      tabIndex={0}
      aria-current={seleccionada || undefined}
      aria-label={`Seleccionar ${linea.nombre}, ${plural(linea.cantidad, 'unidad', 'unidades')}`}
      onClick={seleccionar}
      onKeyDown={alPulsarTecla}
      className={cn(
        columnas,
        'min-h-16 flex-none cursor-pointer border-b border-l-4 border-b-line border-l-transparent bg-surface pl-3 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink xl:pl-4',
        ultima && 'border-l-ink-muted bg-surface-subtle',
        seleccionada && 'border-l-select-line bg-select-tint',
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'line-clamp-2 text-body leading-snug font-semibold wrap-anywhere',
            seleccionada && 'font-bold text-select-ink',
          )}
        >
          {linea.nombre}
        </span>
        {ultima && (
          <span className="inline-flex items-center gap-1 self-start rounded-sm bg-warning-surface px-2 text-meta leading-4 font-bold text-warning-ink">
            <Zap className="size-icon-xs" aria-hidden />
            Último añadido
          </span>
        )}
      </div>

      <div className="grid grid-cols-[repeat(3,var(--touch))] items-center justify-center gap-1">
        <button
          type="button"
          aria-label={linea.cantidad === 1 ? 'Borrar producto' : 'Restar una unidad'}
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ tipo: 'sumar', codigo: linea.codigo, delta: -1 });
          }}
          className={cn(botonPaso, 'w-touch', !seleccionada && 'invisible')}
        >
          −
        </button>
        <button
          type="button"
          aria-label={`Editar cantidad de ${linea.nombre}: ${linea.cantidad}`}
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ tipo: 'abrir-editor', codigo: linea.codigo });
          }}
          className={cn(
            'grid size-touch place-items-center rounded-control border border-transparent text-name font-bold tabular-nums transition-colors duration-75 hover:bg-surface-hover active:bg-surface-pressed',
            seleccionada && 'border-line-control bg-surface',
          )}
        >
          {linea.cantidad}
        </button>
        <button
          type="button"
          disabled={linea.cantidad >= MAX_CANTIDAD}
          aria-label="Añadir una unidad"
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ tipo: 'sumar', codigo: linea.codigo, delta: 1 });
          }}
          className={cn(botonPaso, 'w-touch', !seleccionada && 'invisible')}
        >
          +
        </button>
      </div>

      <span className="text-right whitespace-nowrap tabular-nums text-ink-muted">
        {formatearEuros(linea.precio)}
      </span>
      <span className="text-right text-amount font-bold whitespace-nowrap tabular-nums">
        {formatearEuros(importeLinea(linea))}
      </span>
    </li>
  );
}

/**
 * SalePanel — Lista de la venta en curso, con buscador, cabecera de columnas y estado vacío. El último
 * registrado es la primera fila; la lista vuelve arriba según `venta.registros` y no según la longitud,
 * para cubrir el producto repetido.
 */
export function SalePanel({ venta, dispatch }: { venta: Venta; dispatch: Dispatch<AccionTpv> }) {
  const vacia = venta.lineas.length === 0;
  const lista = useRef<HTMLUListElement>(null);

  // Cada producto registrado vuelve la lista al inicio, aunque no cambie su longitud (un repetido).
  useEffect(() => {
    if (lista.current) lista.current.scrollTop = 0;
  }, [venta.registros]);

  return (
    <section
      aria-label="Venta en curso"
      className="flex min-h-0 min-w-0 flex-col rounded-card border border-line bg-surface p-4 pb-3 xl:px-6 xl:py-5"
    >
      <div className="mb-3 flex min-h-touch items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <h1 className="text-title font-bold tracking-tight text-ink">
            {vacia ? 'Nueva venta' : 'Venta en curso'}
          </h1>
          <span className="text-meta tabular-nums text-ink-muted">
            {plural(venta.lineas.length, 'producto', 'productos')} ·{' '}
            {plural(unidadesVenta(venta), 'unidad', 'unidades')}
          </span>
        </div>
        <label className="flex min-h-touch w-65 items-center gap-2 rounded-control border border-line-control bg-surface-subtle px-3 text-ink-muted focus-within:border-line-strong focus-within:bg-surface">
          <Search className="size-icon-sm" aria-hidden />
          <Input
            type="search"
            aria-label="Buscar en esta venta"
            placeholder="Buscar en la venta…"
            className="h-full flex-1 border-0 bg-transparent px-0 text-body md:text-body text-ink shadow-none ring-0 focus-visible:ring-0"
          />
        </label>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-control border border-line bg-surface">
        <div
          className={cn(
            columnas,
            'min-h-10 border-b border-line bg-surface-subtle text-meta font-bold tracking-wider text-ink-muted uppercase',
          )}
        >
          <span>Producto</span>
          <span className="text-center">Cantidad</span>
          <span className="text-right">Precio/ud</span>
          <span className="text-right">Importe</span>
        </div>

        {vacia ? (
          <div
            role="status"
            className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center text-ink-disabled"
          >
            <ShoppingCart className="size-18" strokeWidth={1.5} aria-hidden />
            <strong className="text-total leading-tight font-bold text-ink-muted">
              Venta vacía
            </strong>
            <p className="text-name text-ink-muted">
              Escanea un producto o introduce un código manual para empezar.
            </p>
          </div>
        ) : (
          <ul
            ref={lista}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
          >
            {venta.lineas.map((linea) => (
              <FilaProducto
                key={linea.codigo}
                linea={linea}
                seleccionada={linea.codigo === venta.seleccionada}
                ultima={linea.codigo === venta.ultimoRegistrado}
                dispatch={dispatch}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 pt-3">
        <Button
          type="button"
          variant="destructive"
          disabled={vacia}
          className="h-touch gap-2 rounded-control px-4 font-bold disabled:text-disabled-ink disabled:opacity-100"
          onClick={() => dispatch({ tipo: 'pedir-descartar' })}
        >
          <CircleX className="size-icon-sm" aria-hidden />
          Descartar venta
        </Button>
        <div className="ml-auto flex flex-col items-end">
          <span className="text-meta font-bold tracking-wider text-ink-muted uppercase">
            Total venta
          </span>
          <span className="text-total font-bold whitespace-nowrap tabular-nums">
            {formatearEuros(totalVenta(venta))}
          </span>
        </div>
        <Button
          type="button"
          disabled={vacia}
          aria-keyshortcuts="F8"
          size="pay"
          className="relative"
          onClick={() => dispatch({ tipo: 'cobrar' })}
        >
          <Atajo tecla="F8" />
          Cobrar
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </section>
  );
}
