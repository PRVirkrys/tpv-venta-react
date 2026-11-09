import {
  Apple,
  Croissant,
  Keyboard,
  OctagonX,
  ScanBarcode,
  ShoppingBag,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import type { Dispatch, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { MAX_CANTIDAD } from '@/domain/cantidad';
import { BOLSA, consultarProducto } from '@/domain/catalogo';
import { formatearEuros } from '@/domain/dinero';
import type { AccionTpv, AvisoEscaner, ErrorCodigo, Tpv } from '@/domain/tpv';
import type { Linea, Venta } from '@/domain/venta';
import { ID_FOCO_ESCANER } from '@/hooks/useFocoEstable';
import { Atajo } from '@/lib/atajos';
import { botonPaso } from '@/lib/estilos';
import { cn } from '@/lib/utils';
import { EntradaNumerica } from './EntradaNumerica';

/** Card — Tarjeta contenedora del panel. `label` es su nombre accesible como sección. */
function Card({
  className,
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        'flex flex-none flex-col gap-3 rounded-card border border-line bg-surface p-4',
        className,
      )}
    >
      {children}
    </section>
  );
}

const control =
  'h-touch rounded-control border-line-control bg-surface-subtle font-semibold text-ink';

type Tono = 'listo' | 'neutro' | 'error' | 'aviso';

const estiloTono: Record<Tono, string> = {
  listo: 'bg-success-surface text-success-ink',
  neutro: 'bg-surface-subtle text-ink-muted',
  error: 'bg-error-surface text-error-ink',
  aviso: 'bg-warning-surface text-warning-ink',
};

const avisos: Record<AvisoEscaner, { tono: Tono; titulo: string; detalle: string }> = {
  'codigo-manual': {
    tono: 'neutro',
    titulo: 'Código manual',
    detalle: 'Escribe el código del producto abajo.',
  },
  'codigo-no-leido': {
    tono: 'error',
    titulo: 'Código no leído',
    detalle: 'No se pudo leer el código. Escríbelo abajo.',
  },
  'producto-no-encontrado': {
    tono: 'error',
    titulo: 'Producto no encontrado',
    detalle: 'El código no está en el catálogo. Escríbelo abajo.',
  },
  'limite-unidades': {
    tono: 'aviso',
    titulo: 'Límite de unidades',
    detalle: `Máximo ${MAX_CANTIDAD} unidades por producto.`,
  },
};

/**
 * Escaner — Estado del lector (listo, error, aviso) y entrada al código manual. El aviso se anuncia con
 * `role="status"`. El botón se oculta con el teclado numérico abierto: ya estás en esa función.
 */
function Escaner({
  aviso,
  tecladoAbierto,
  dispatch,
}: {
  aviso: AvisoEscaner | null;
  tecladoAbierto: boolean;
  dispatch: Dispatch<AccionTpv>;
}) {
  const { tono, titulo, detalle } = aviso
    ? avisos[aviso]
    : {
        tono: 'listo' as const,
        titulo: 'Escáner listo',
        detalle: 'Esperando código de barras',
      };
  const Icono = tono === 'error' ? OctagonX : tono === 'aviso' ? TriangleAlert : ScanBarcode;

  return (
    <Card label="Escáner" className="gap-3">
      <div className="relative flex min-h-row items-center gap-3">
        <Atajo tecla="E" />
        <span
          aria-hidden
          className={cn(
            'grid size-touch-compact flex-none place-items-center rounded-control',
            estiloTono[tono],
          )}
        >
          <Icono className={tono === 'error' || tono === 'aviso' ? 'size-icon-lg' : 'size-icon-md'} />
        </span>
        {/* Se anuncia a lectores de pantalla cada vez que cambia el estado del escáner. */}
        <div
          id={ID_FOCO_ESCANER}
          tabIndex={-1}
          role="status"
          className="flex min-w-0 flex-col outline-none"
        >
          <strong className="text-name leading-tight">{titulo}</strong>
          <span className="text-meta text-ink-muted">{detalle}</span>
        </div>
      </div>
      {!tecladoAbierto && (
        <Button
          type="button"
          variant="outline"
          aria-keyshortcuts="F2"
          className={cn(control, 'relative w-full gap-2 text-body font-bold')}
          onClick={() => dispatch({ tipo: 'abrir-codigo-manual' })}
        >
          <Atajo tecla="F2" />
          <Keyboard className="size-icon-sm" aria-hidden />
          Código manual
        </Button>
      )}
    </Card>
  );
}

/**
 * Inspector — Cantidad del producto seleccionado. «−» con 1 unidad pide confirmar el borrado en lugar de
 * bajar a 0; esa regla vive en el reducer.
 */
function Inspector({ linea, dispatch }: { linea: Linea; dispatch: Dispatch<AccionTpv> }) {
  const enMaximo = linea.cantidad >= MAX_CANTIDAD;
  const sumar = (delta: 1 | -1) => () => dispatch({ tipo: 'sumar', codigo: linea.codigo, delta });

  return (
    <Card label="Producto seleccionado" className="flex-1">
      <div className="flex flex-col gap-1">
        <div className="flex h-5 items-center justify-between gap-2">
          <span className="text-meta font-bold tracking-wider text-ink-muted uppercase">
            Producto seleccionado
          </span>
          {enMaximo && (
            <span
              role="status"
              className="flex-none rounded-sm border border-warning-line bg-warning-surface px-2 text-meta leading-4 font-bold tracking-wide text-warning-ink uppercase"
            >
              Máximo {MAX_CANTIDAD} uds
            </span>
          )}
        </div>
        <strong className="line-clamp-2 text-amount leading-snug wrap-anywhere">
          {linea.nombre}
        </strong>
        <span className="text-meta tabular-nums text-ink-muted">
          Código: {linea.codigo} · Precio: {formatearEuros(linea.precio)}/ud
        </span>
      </div>
      <div className="grid grid-cols-[var(--touch)_minmax(0,1fr)_var(--touch)] items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className={botonPaso}
          aria-label={linea.cantidad === 1 ? 'Borrar producto' : 'Restar una unidad'}
          onClick={sumar(-1)}
        >
          −
        </Button>
        <button
          type="button"
          aria-label={`Editar cantidad: ${linea.cantidad}`}
          onClick={() => dispatch({ tipo: 'abrir-editor', codigo: linea.codigo })}
          className="grid h-touch place-items-center rounded-control border-w-2 border-line-strong bg-surface text-display font-bold tabular-nums transition-colors duration-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink hover:bg-surface-hover active:bg-surface-pressed"
        >
          {linea.cantidad}
        </button>
        <Button
          type="button"
          variant="outline"
          disabled={enMaximo}
          className={botonPaso}
          aria-label="Añadir una unidad"
          onClick={sumar(1)}
        >
          +
        </Button>
      </div>
      <Button
        type="button"
        variant="outline"
        aria-keyshortcuts="F3"
        className={cn(control, 'relative w-full text-body font-semibold')}
        onClick={() => dispatch({ tipo: 'abrir-editor', codigo: linea.codigo })}
      >
        <Atajo tecla="F3" />
        Otra cantidad
      </Button>
      <Button
        type="button"
        variant="destructive"
        className="mt-auto h-touch w-full gap-2 rounded-control font-bold"
        onClick={() => dispatch({ tipo: 'pedir-quitar', codigo: linea.codigo })}
      >
        <Trash2 className="size-5" aria-hidden />
        Quitar de la venta
      </Button>
    </Card>
  );
}

/**
 * AccesosRapidos — Catálogo de Panadería, de Fruta y verdura y «+ Bolsa». Va siempre fijado abajo (`mt-auto`),
 * con o sin producto seleccionado, por consistencia de posición: no se mueve según el estado de la venta y se
 * aprende de memoria. «Fruta y verdura» es un solo botón; sus pestañas viven dentro del catálogo.
 */
function AccesosRapidos({ venta, dispatch }: { venta: Venta; dispatch: Dispatch<AccionTpv> }) {
  const bolsas = venta.lineas.find((l) => l.codigo === BOLSA.codigo)?.cantidad ?? 0;
  const accesos = [
    {
      nombre: 'Panadería',
      Icono: Croissant,
      atajo: 'F4',
      accion: { tipo: 'abrir-catalogo', categoria: 'panaderia' } as AccionTpv,
    },
    {
      nombre: 'Fruta y verdura',
      Icono: Apple,
      atajo: undefined,
      accion: { tipo: 'abrir-catalogo', categoria: 'fruta' } as AccionTpv,
    },
    {
      nombre: '+ Bolsa',
      Icono: ShoppingBag,
      atajo: undefined,
      accion: { tipo: 'registrar-bolsa' } as AccionTpv,
    },
  ];

  return (
    <Card label="Accesos rápidos" className="mt-auto">
      <div className="grid grid-cols-3 gap-2">
        {accesos.map(({ nombre, Icono, atajo, accion }) => {
          const esBolsa = accion.tipo === 'registrar-bolsa';
          return (
            <Button
              key={nombre}
              type="button"
              variant="outline"
              aria-label={
                esBolsa && bolsas > 0
                  ? `Añadir bolsa (${bolsas} en la venta)`
                  : esBolsa
                    ? 'Añadir bolsa'
                    : `Abrir catálogo de ${nombre}`
              }
              aria-keyshortcuts={atajo}
              className={cn(
                control,
                'relative h-auto min-h-20 flex-col gap-1.5 px-1 py-2 text-meta font-bold',
              )}
              onClick={() => dispatch(accion)}
            >
              {atajo && <Atajo tecla={atajo} />}
              <Icono className="size-icon-md" aria-hidden />
              {nombre}
              {esBolsa && bolsas > 0 && (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-meta font-bold text-primary-foreground"
                >
                  {bolsas}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}

const erroresCodigo: Record<ErrorCodigo, string> = {
  'codigo-invalido': 'Escribe un código usando solo números.',
  'no-encontrado': 'Producto no encontrado. Revisa el código.',
};

/** EntradaCodigoManual — Configuración de `EntradaNumerica` para introducir un código de producto. */
function EntradaCodigoManual({
  borrador,
  error,
  dispatch,
}: {
  borrador: string;
  error: ErrorCodigo | null;
  dispatch: Dispatch<AccionTpv>;
}) {
  return (
    <EntradaNumerica
      etiquetaSeccion="Introducir código manual"
      titulo="Código de barras manual"
      etiquetaCampo="Código de barras"
      placeholder="Escribe el código…"
      valor={borrador}
      error={error ? erroresCodigo[error] : null}
      textoEnviar="Añadir producto"
      textoCancelar="Volver al escaneo"
      onCambio={(texto) => dispatch({ tipo: 'borrador-codigo', texto })}
      onEnviar={() =>
        dispatch({
          tipo: 'enviar-codigo-manual',
          resultado: consultarProducto(borrador),
        })
      }
      onCancelar={() => dispatch({ tipo: 'cerrar-codigo-manual' })}
    />
  );
}

/** EditorCantidad — Configuración de `EntradaNumerica` para editar la cantidad del producto seleccionado. */
function EditorCantidad({
  nombre,
  borrador,
  error,
  dispatch,
}: {
  nombre: string;
  borrador: string;
  error: boolean;
  dispatch: Dispatch<AccionTpv>;
}) {
  return (
    <EntradaNumerica
      etiquetaSeccion="Editar cantidad"
      titulo={`Cantidad · ${nombre}`}
      etiquetaCampo="Cantidad total"
      placeholder="1–999"
      valor={borrador}
      error={error ? `Escribe una cantidad entera de 1 a ${MAX_CANTIDAD}.` : null}
      textoEnviar="Guardar cantidad"
      textoCancelar="Cancelar"
      onCambio={(texto) => dispatch({ tipo: 'borrador-cantidad', texto })}
      onEnviar={() => dispatch({ tipo: 'guardar-cantidad' })}
      onCancelar={() => dispatch({ tipo: 'cancelar-editor' })}
    />
  );
}

/**
 * SidePanel — Panel derecho táctil. Qué se ve según el modo: al editar la cantidad, solo el editor; con el
 * código manual, escáner y teclado, sin inspector ni accesos; en el resto, escáner, inspector y accesos.
 */
export function SidePanel({ tpv, dispatch }: { tpv: Tpv; dispatch: Dispatch<AccionTpv> }) {
  const { venta, modo } = tpv;
  const seleccionada = venta.lineas.find((l) => l.codigo === venta.seleccionada);
  return (
    <aside
      aria-label="Panel de control táctil"
      className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto"
    >
      {modo.tipo === 'cantidad' && seleccionada ? (
        <EditorCantidad
          nombre={seleccionada.nombre}
          borrador={modo.borrador}
          error={modo.error}
          dispatch={dispatch}
        />
      ) : (
        <>
          <Escaner
            aviso={tpv.aviso}
            tecladoAbierto={modo.tipo === 'codigo-manual'}
            dispatch={dispatch}
          />
          {modo.tipo === 'codigo-manual' ? (
            <EntradaCodigoManual borrador={modo.borrador} error={modo.error} dispatch={dispatch} />
          ) : (
            <>
              {seleccionada && <Inspector linea={seleccionada} dispatch={dispatch} />}
              <AccesosRapidos venta={venta} dispatch={dispatch} />
            </>
          )}
        </>
      )}
    </aside>
  );
}
